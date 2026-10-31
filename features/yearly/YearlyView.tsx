import React, { useState, useMemo } from 'react';
import { AppState, CreditCard, TransactionType, OwnerType } from '../../types';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { getBillingPeriod, getOwnerSplit, getMonthlyBillByOwner } from '../../lib/billing';
import { CalendarRange, Calendar } from 'lucide-react';

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
    const cardAggregatesMap: Record<string, {
      cardId: string;
      cardName: string;
      cardColor: string;
      cardObj: CreditCard;
      totalBill: number;
      totalPaid: number;
      totalGap: number;
      totalSaved: number;
      totalPersonal: number;
      totalBusiness: number;
      totalUnclassified: number;
      monthsWithBillsCount: number;
    }> = {};

    data.cards.forEach(card => {
      cardAggregatesMap[card.id] = {
        cardId: card.id,
        cardName: card.name,
        cardColor: card.color || 'bg-slate-400',
        cardObj: card,
        totalBill: 0,
        totalPaid: 0,
        totalGap: 0,
        totalSaved: 0,
        totalPersonal: 0,
        totalBusiness: 0,
        totalUnclassified: 0,
        monthsWithBillsCount: 0
      };
    });

    let totalYearBill = 0;
    let totalYearPaid = 0;
    let totalYearSaved = 0;
    let totalYearPersonal = 0;
    let totalYearBusiness = 0;

    const activeMonthsBreakdown: Array<{
      monthIdx: number;
      monthName: string;
      totalMonthBill: number;
      totalMonthPaid: number;
      totalMonthGap: number;
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

        const ownerSplit = getMonthlyBillByOwner(data, card.id, monthIdx, selectedYear);

        if (cardBill > 0 || cardPaid > 0) {
          cardsInThisMonth.push({
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color || 'bg-slate-400',
            cardObj: card,
            bill: cardBill,
            paid: cardPaid,
            gap: cardGap,
            personal: ownerSplit.personal,
            business: ownerSplit.business
          });

          if (cardAggregatesMap[card.id]) {
            const agg = cardAggregatesMap[card.id];
            agg.totalBill += cardBill;
            agg.totalPaid += cardPaid;
            agg.totalSaved += totalSavedCardMonth;
            agg.totalPersonal += ownerSplit.personal;
            agg.totalBusiness += ownerSplit.business;
            agg.totalUnclassified += ownerSplit.unclassified;
            if (cardBill > 0) agg.monthsWithBillsCount++;
          }

          monthBillTotal += cardBill;
          monthPaidTotal += cardPaid;

          totalYearBill += cardBill;
          totalYearPaid += cardPaid;
          totalYearSaved += totalSavedCardMonth;
          totalYearPersonal += ownerSplit.personal;
          totalYearBusiness += ownerSplit.business;
        }
      });

      if (cardsInThisMonth.length > 0) {
        const monthGapTotal = Math.max(0, monthBillTotal - monthPaidTotal);
        let monthStatus: 'LUNAS' | 'SEBAGIAN' | 'BELUM' = 'BELUM';
        if (monthBillTotal > 0 && monthGapTotal === 0) monthStatus = 'LUNAS';
        else if (monthPaidTotal > 0) monthStatus = 'SEBAGIAN';

        activeMonthsBreakdown.push({
          monthIdx,
          monthName,
          totalMonthBill: monthBillTotal,
          totalMonthPaid: monthPaidTotal,
          totalMonthGap: monthGapTotal,
          status: monthStatus,
          cardsInMonth: cardsInThisMonth
        });
      }
    });

    const cardsSummaryList = Object.values(cardAggregatesMap).map(c => {
      const gap = Math.max(0, c.totalBill - c.totalPaid);
      return { ...c, totalGap: gap };
    }).sort((a, b) => b.totalGap - a.totalGap);

    const totalYearGap = Math.max(0, totalYearBill - totalYearPaid);

    return {
      monthlyBreakdown: activeMonthsBreakdown,
      cardsSummaryList,
      totalYearBill,
      totalYearPaid,
      totalYearGap,
      totalYearSaved,
      totalYearPersonal,
      totalYearBusiness,
      hasData: totalYearBill > 0 || totalYearPaid > 0 || totalYearSaved > 0
    };
  }, [data, selectedYear]);

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4 md:py-8">
      {/* Hero Header */}
      <div className="bg-[#1a2332] rounded-[32px] p-6 sm:p-8 text-white shadow-xl space-y-6 relative overflow-hidden border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <CalendarRange size={22} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Anggaran & Rekap Tahunan</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Evaluasi kesehatan finansial & pemetaan beban hutang tahunan</p>
          </div>

          <div className="flex items-center gap-2">
            {[2024, 2025, 2026, 2027].map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedYear === y ? 'bg-primary text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Tagihan</span>
            <p className="text-lg sm:text-2xl font-black text-slate-100 mt-0.5">
              {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearBill) : '••••'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Dibayar</span>
            <p className="text-lg sm:text-2xl font-black text-emerald-400 mt-0.5">
              {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearPaid) : '••••'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Sisa Kurang</span>
            <p className={`text-lg sm:text-2xl font-black mt-0.5 ${yearlyBudgetAnalysis.totalYearGap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearGap) : '••••'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Cadangan Likuid</span>
            <p className="text-lg sm:text-2xl font-black text-blue-400 mt-0.5">
              {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearSaved) : '••••'}
            </p>
          </div>
        </div>
      </div>

      {!yearlyBudgetAnalysis.hasData ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
          <CalendarRange size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-3" />
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Belum ada data anggaran di tahun {selectedYear}.</p>
        </div>
      ) : (
        <>
          {/* Section A: Card Aggregates */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg sm:text-xl flex items-center gap-2">
              <CalendarRange size={22} className="text-primary" /> Rincian Per Kartu / Hutang ({selectedYear})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {yearlyBudgetAnalysis.cardsSummaryList.map(c => {
                const hasGap = c.totalGap > 0;
                const isLunas = c.totalBill > 0 && c.totalGap === 0;
                const progressPct = c.totalBill > 0 ? Math.min(100, Math.round((c.totalPaid / c.totalBill) * 100)) : 0;

                return (
                  <div
                    key={c.cardId}
                    className={`bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                      hasGap
                        ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10'
                        : isLunas
                        ? 'border-emerald-200 dark:border-emerald-900/40'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ${c.cardColor}`} />
                          <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-tight truncate">
                            {c.cardName}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 ${
                            hasGap
                              ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                              : isLunas
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {hasGap ? 'Ada Kurang' : isLunas ? 'Lunas' : 'Tanpa Tagihan'}
                        </span>
                      </div>

                      <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Tagihan</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {showAmounts ? formatIDR(c.totalBill) : '••••'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Dibayar</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {showAmounts ? formatIDR(c.totalPaid) : '••••'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Kurang</span>
                          <span className={`font-black text-sm ${hasGap ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {showAmounts ? formatIDR(c.totalGap) : '••••'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {c.totalBill > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                            <span>Progress</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${isLunas ? 'bg-emerald-500' : 'bg-primary'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Monthly Breakdown */}
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg sm:text-xl flex items-center gap-2">
              <Calendar size={22} className="text-indigo-500" /> Ringkasan Bulanan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {yearlyBudgetAnalysis.monthlyBreakdown.map(m => {
                const isLunas = m.status === 'LUNAS';
                const isSebagian = m.status === 'SEBAGIAN';

                return (
                  <div
                    key={m.monthIdx}
                    className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden relative"
                  >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                      <h4 className="font-black text-base sm:text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-none uppercase">
                        {m.monthName} {selectedYear}
                      </h4>
                      <span
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase ${
                          isLunas
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : isSebagian
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="p-5 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Tagihan</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {showAmounts ? formatIDR(m.totalMonthBill) : '••••'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Dibayar</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {showAmounts ? formatIDR(m.totalMonthPaid) : '••••'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Kurang</span>
                        <span className={`font-black text-sm ${m.totalMonthGap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {showAmounts ? formatIDR(m.totalMonthGap) : '••••'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3 flex-1">
                      {m.cardsInMonth.map(ce => (
                        <div
                          key={ce.cardId}
                          onClick={() => ce.cardObj && onOpenStatement(ce.cardObj, m.monthIdx, selectedYear)}
                          className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-100 dark:border-slate-700/50"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${ce.cardColor}`} />
                              <span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate">
                                {ce.cardName}
                              </span>
                            </div>
                            <span className={`text-[10px] font-black ${ce.gap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {ce.gap > 0 ? `Kurang ${showAmounts ? formatIDR(ce.gap) : '••'}` : 'Lunas'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
