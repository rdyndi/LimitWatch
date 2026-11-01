import React, { useState, useMemo } from 'react';
import { AppState, CreditCard, TransactionType } from '../../types';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { getBillingPeriod, getMonthlyBillByOwner } from '../../lib/billing';
import { CalendarRange, ArrowDownRight, CheckCircle2 } from 'lucide-react';

interface YearlyViewProps {
  data: AppState;
  showAmounts: boolean;
  onOpenStatement: (card: CreditCard, month: number, year: number) => void;
}

export const YearlyView: React.FC<YearlyViewProps> = ({
  data,
  showAmounts,
  onOpenStatement
}) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const yearlyBudgetAnalysis = useMemo(() => {
    let totalYearBill = 0;
    let totalYearPaid = 0;
    let totalYearSaved = 0;

    const activeMonthsBreakdown: Array<{
      monthIdx: number;
      monthName: string;
      shortMonthName: string;
      totalMonthBill: number;
      totalMonthPaid: number;
      totalMonthSaved: number;
      totalMonthPiutang: number;
      totalMonthGrossGap: number;
      totalMonthNetGap: number;
      status: 'LUNAS' | 'SEBAGIAN' | 'BELUM';
      cardsInMonth: Array<{
        cardId: string;
        cardName: string;
        cardColor: string;
        cardObj?: CreditCard;
        bill: number;
        paid: number;
        gap: number;
        personal: number;
        business: number;
      }>;
    }> = [];

    MONTH_NAMES.forEach((monthName, monthIdx) => {
      let monthBillTotal = 0;
      let monthPaidTotal = 0;
      let monthSavedTotal = 0;
      let monthPiutangTotal = 0;

      const cardsInThisMonth: Array<{
        cardId: string;
        cardName: string;
        cardColor: string;
        cardObj?: CreditCard;
        bill: number;
        paid: number;
        gap: number;
        personal: number;
        business: number;
      }> = [];

      data.cards.forEach(card => {
        const expenses = data.transactions.filter(t => {
          if (t.cardId !== card.id || t.type !== TransactionType.EXPENSE || t.isInstallment) return false;
          const billing = getBillingPeriod(t.date, card.dueDay);
          return billing.month === monthIdx && billing.year === selectedYear;
        }).reduce((s, t) => s + t.amount, 0);

        const installmentLoad = data.installments.filter(i => i.cardId === card.id).reduce((s, i) => {
          const start = getBillingPeriod(i.startDate, card.dueDay);
          const monthDiff = (selectedYear - start.year) * 12 + (monthIdx - start.month);
          if (monthDiff >= 0 && monthDiff < i.totalMonths) return s + i.monthlyAmount;
          return s;
        }, 0);

        let billBeforeFees = Math.ceil(expenses + installmentLoad);
        let cardBill = billBeforeFees;
        if (billBeforeFees > 0) {
          if (card.eStatementFee) cardBill += card.eStatementFee;
          if (cardBill >= 5000000) cardBill += 10000;
        }

        const cardPaid = data.transactions.filter(t => t.cardId === card.id && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === monthIdx && t.targetPeriod?.year === selectedYear).reduce((s, t) => s + t.amount, 0);
        const cardGap = Math.max(0, cardBill - cardPaid);

        const cardSaved = data.savings.filter(s => s.cardId === card.id && !s.isTransferred && s.targetPeriod?.month === monthIdx && s.targetPeriod?.year === selectedYear).reduce((s, v) => s + v.amount, 0);
        const cardPiutang = (data.piutangs || []).filter(p => p.cardId === card.id && !p.isCollected && p.targetPeriod?.month === monthIdx && p.targetPeriod?.year === selectedYear).reduce((s, v) => s + v.amount, 0);
        const totalSavedCardMonth = cardSaved + cardPiutang;

        monthSavedTotal += cardSaved;
        monthPiutangTotal += cardPiutang;

        const ownerSplit = getMonthlyBillByOwner(data, card.id, monthIdx, selectedYear);

        if (cardBill > 0 || cardPaid > 0) {
          cardsInThisMonth.push({
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color || 'bg-blue-500',
            cardObj: card,
            bill: cardBill,
            paid: cardPaid,
            gap: cardGap,
            personal: ownerSplit.personal,
            business: ownerSplit.business
          });

          monthBillTotal += cardBill;
          monthPaidTotal += cardPaid;

          totalYearBill += cardBill;
          totalYearPaid += cardPaid;
          totalYearSaved += totalSavedCardMonth;
        }
      });

      const unlinkedSavings = data.savings.filter(s => (!s.cardId || !data.cards.some(c => c.id === s.cardId)) && !s.isTransferred && s.targetPeriod?.month === monthIdx && s.targetPeriod?.year === selectedYear).reduce((s, v) => s + v.amount, 0);
      const unlinkedPiutangs = (data.piutangs || []).filter(p => (!p.cardId || !data.cards.some(c => c.id === p.cardId)) && !p.isCollected && p.targetPeriod?.month === monthIdx && p.targetPeriod?.year === selectedYear).reduce((s, v) => s + v.amount, 0);

      monthSavedTotal += unlinkedSavings;
      monthPiutangTotal += unlinkedPiutangs;

      if (cardsInThisMonth.length > 0 || monthSavedTotal > 0 || monthPiutangTotal > 0) {
        const monthGrossGap = Math.max(0, monthBillTotal - monthPaidTotal);
        const monthLiquidAsset = monthSavedTotal + monthPiutangTotal;
        const monthNetGap = Math.max(0, monthBillTotal - monthPaidTotal - monthLiquidAsset);

        let monthStatus: 'LUNAS' | 'SEBAGIAN' | 'BELUM' = 'BELUM';
        if (monthBillTotal > 0 && monthNetGap === 0) monthStatus = 'LUNAS';
        else if (monthPaidTotal > 0 || monthLiquidAsset > 0) monthStatus = 'SEBAGIAN';

        const shortMonthName = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'][monthIdx];

        activeMonthsBreakdown.push({
          monthIdx,
          monthName,
          shortMonthName,
          totalMonthBill: monthBillTotal,
          totalMonthPaid: monthPaidTotal,
          totalMonthSaved: monthSavedTotal,
          totalMonthPiutang: monthPiutangTotal,
          totalMonthGrossGap: monthGrossGap,
          totalMonthNetGap: monthNetGap,
          status: monthStatus,
          cardsInMonth: cardsInThisMonth
        });
      }
    });

    const totalYearGap = Math.max(0, totalYearBill - totalYearPaid);

    return {
      monthlyBreakdown: activeMonthsBreakdown,
      totalYearBill,
      totalYearPaid,
      totalYearGap,
      totalYearSaved,
      hasData: totalYearBill > 0 || totalYearPaid > 0 || totalYearSaved > 0
    };
  }, [data, selectedYear]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full px-4 py-4 sm:py-6 pb-28 text-slate-100">
      {/* Top Header Row */}
      <div className="flex justify-between items-center px-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase">
          YEARLY
        </h1>

        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[2024, 2025, 2026, 2027].map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                selectedYear === y
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {!yearlyBudgetAnalysis.hasData ? (
        <div className="text-center py-20 bg-slate-900/60 rounded-[32px] border border-dashed border-slate-800 p-8">
          <CalendarRange size={48} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-400 font-bold text-sm">Belum ada data anggaran di tahun {selectedYear}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {yearlyBudgetAnalysis.monthlyBreakdown.map(m => {
            const hasMonthNetGap = m.totalMonthNetGap > 0;

            return (
              <div
                key={m.monthIdx}
                className="bg-[#0f172a] dark:bg-[#0c1322] rounded-[32px] p-5 sm:p-6 border border-slate-800/90 shadow-2xl space-y-5"
              >
                {/* Month Header Banner */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {/* Calendar Badge */}
                    <div className="w-12 h-13 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-md flex flex-col shrink-0">
                      <div className="bg-red-600 h-3.5 w-full flex items-center justify-center">
                        <span className="w-1 h-1 bg-white/70 rounded-full mx-0.5" />
                        <span className="w-1 h-1 bg-white/70 rounded-full mx-0.5" />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center py-0.5">
                        <span className="text-[10px] font-black text-slate-100 tracking-tighter leading-none">
                          {m.shortMonthName}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">
                          {selectedYear}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {m.monthName}
                    </h2>
                  </div>

                  {/* Deficit / Lunas Status Badge */}
                  <div>
                    {hasMonthNetGap ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-300 font-extrabold text-[11px] sm:text-xs tracking-wide">
                        KURANG {showAmounts ? formatIDR(m.totalMonthNetGap) : '••••'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-extrabold text-[11px] sm:text-xs tracking-wide">
                        <CheckCircle2 size={12} /> LUNAS
                      </span>
                    )}
                  </div>
                </div>

                {/* Cards List inside Month */}
                <div className="space-y-3">
                  {m.cardsInMonth.map(ce => {
                    const cardGap = ce.gap;
                    const isFullyPaid = ce.bill > 0 && cardGap === 0;
                    const pct = ce.bill > 0 ? Math.min(100, Math.round((ce.paid / ce.bill) * 100)) : 0;

                    return (
                      <div
                        key={ce.cardId}
                        onClick={() => ce.cardObj && onOpenStatement(ce.cardObj, m.monthIdx, selectedYear)}
                        className="bg-[#172033] hover:bg-[#1c273e] p-4 sm:p-5 rounded-2xl border border-slate-800/90 space-y-3 transition-all cursor-pointer shadow-md"
                      >
                        {/* Row 1: Card Title & Amount Status */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-3 h-3 rounded-full shrink-0 shadow-xs ${ce.cardColor}`} />
                            <span className="font-extrabold text-white text-sm sm:text-base truncate">
                              {ce.cardName}
                            </span>
                            {cardGap > 0 && (
                              <span className="flex items-center gap-0.5 text-rose-400 font-black text-[11px] shrink-0">
                                <ArrowDownRight size={12} /> Kurang
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className={`font-black text-xs sm:text-sm ${isFullyPaid ? 'text-emerald-400' : 'text-slate-200'}`}>
                              {showAmounts ? formatIDR(ce.paid) : '••'} / {showAmounts ? formatIDR(ce.bill) : '••'}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Pribadi / Bisnis Owner Split Row */}
                        {(ce.personal > 0 || ce.business > 0) && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {ce.personal > 0 && (
                              <div className="bg-[#121c2e] border border-blue-900/40 rounded-xl px-3 py-1.5 flex justify-between items-center text-xs">
                                <span className="font-bold text-blue-400">Pribadi</span>
                                <span className="font-extrabold text-blue-200">
                                  {showAmounts ? formatIDR(ce.personal) : '••'}
                                </span>
                              </div>
                            )}

                            {ce.business > 0 && (
                              <div className="bg-[#1c1328] border border-purple-900/40 rounded-xl px-3 py-1.5 flex justify-between items-center text-xs">
                                <span className="font-bold text-purple-400">Bisnis</span>
                                <span className="font-extrabold text-purple-200">
                                  {showAmounts ? formatIDR(ce.business) : '••'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Row 3: Progress Bar */}
                        <div className="pt-1">
                          <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-400' : 'bg-blue-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Monthly Savings & Receivables Summary Row */}
                {(m.totalMonthSaved > 0 || m.totalMonthPiutang > 0) && (
                  <div className="bg-[#121b2d] p-3.5 rounded-2xl border border-slate-800/80 flex flex-wrap justify-between items-center text-xs text-slate-300 gap-2">
                    <div className="flex items-center gap-4">
                      {m.totalMonthSaved > 0 && (
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Tabungan:</span>
                          <span className="font-extrabold text-blue-400">
                            {showAmounts ? formatIDR(m.totalMonthSaved) : '••'}
                          </span>
                        </div>
                      )}

                      {m.totalMonthPiutang > 0 && (
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Piutang:</span>
                          <span className="font-extrabold text-indigo-400">
                            {showAmounts ? formatIDR(m.totalMonthPiutang) : '••'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Selisih Net:</span>
                      <span className={`font-black ${m.totalMonthNetGap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {showAmounts ? formatIDR(m.totalMonthNetGap) : '••'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
