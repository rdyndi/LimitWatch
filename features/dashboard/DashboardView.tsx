import React, { useMemo } from 'react';
import { AppState, CreditCard, TransactionType, OwnerType } from '../../types';
import { formatIDR } from '../../lib/format';
import { getUpcomingBills } from '../../lib/billing';
import {
  Eye,
  EyeOff,
  PlusCircle,
  Vault,
  HandCoins,
  Briefcase,
  AlertCircle,
  ArrowDownRight,
  PieChart
} from 'lucide-react';

interface DashboardViewProps {
  data: AppState;
  showAmounts: boolean;
  onToggleShowAmounts: () => void;
  onOpenQuickRecord: (tab: 'EXPENSE' | 'SAVING' | 'PIUTANG') => void;
  onOpenCardForm: (card?: CreditCard | null) => void;
  onOpenStatement: (card: CreditCard) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  showAmounts,
  onToggleShowAmounts,
  onOpenQuickRecord,
  onOpenCardForm,
  onOpenStatement
}) => {
  const upcomingBills = useMemo(() => {
    return getUpcomingBills(data);
  }, [data]);

  const totalDebt = useMemo(() => {
    let globalTotalProyeksi = 0;
    data.cards.forEach(card => {
      const monthMap = new Map<string, number>();
      data.transactions
        .filter(t => t.cardId === card.id && t.type === TransactionType.EXPENSE && !t.isInstallment)
        .forEach(t => {
          const date = new Date(t.date);
          let month = date.getMonth();
          let year = date.getFullYear();
          if (card.dueDay && date.getDate() >= card.dueDay) {
            month++;
            if (month > 11) {
              month = 0;
              year++;
            }
          }
          const key = `${year}-${month}`;
          monthMap.set(key, (monthMap.get(key) || 0) + t.amount);
        });

      data.installments
        .filter(i => i.cardId === card.id)
        .forEach(inst => {
          const startDate = new Date(inst.startDate);
          let startMonth = startDate.getMonth();
          let startYear = startDate.getFullYear();
          if (card.dueDay && startDate.getDate() >= card.dueDay) {
            startMonth++;
            if (startMonth > 11) {
              startMonth = 0;
              startYear++;
            }
          }
          for (let m = 0; m < inst.totalMonths; m++) {
            let curM = startMonth + m;
            let curY = startYear + Math.floor(curM / 12);
            curM = curM % 12;
            const key = `${curY}-${curM}`;
            monthMap.set(key, (monthMap.get(key) || 0) + inst.monthlyAmount);
          }
        });

      let cardTotalWithFees = 0;
      monthMap.forEach(baseAmount => {
        let fee = 0;
        let materai = 0;
        if (baseAmount > 0) {
          fee = card.eStatementFee || 0;
          if (baseAmount + fee >= 5000000) materai = 10000;
        }
        cardTotalWithFees += baseAmount + fee + materai;
      });

      const totalPaidEver = data.transactions
        .filter(t => t.cardId === card.id && t.type === TransactionType.PAYMENT)
        .reduce((s, t) => s + t.amount, 0);

      globalTotalProyeksi += Math.max(0, cardTotalWithFees - totalPaidEver);
    });
    return Math.ceil(globalTotalProyeksi);
  }, [data.cards, data.transactions, data.installments]);

  const totalSavingsAcrossYears = useMemo(
    () => Math.ceil(data.savings.filter(s => !s.isTransferred).reduce((s, c) => s + c.amount, 0)),
    [data.savings]
  );

  const totalPiutangsAcrossYears = useMemo(
    () => Math.ceil((data.piutangs || []).filter(p => !p.isCollected).reduce((s, c) => s + c.amount, 0)),
    [data.piutangs]
  );

  const totalAssets = totalSavingsAcrossYears + totalPiutangsAcrossYears;
  const currentDebtGap = useMemo(() => Math.max(0, totalDebt - totalAssets), [totalDebt, totalAssets]);

  const categoryGrouping = useMemo(() => {
    const groups: Record<string, { total: number; personal: number; business: number }> = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    data.transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === TransactionType.EXPENSE && !t.isInstallment && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .forEach(t => {
        let cat = t.description ? t.description.trim() : 'Lainnya';
        cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();

        if (!groups[cat]) groups[cat] = { total: 0, personal: 0, business: 0 };

        let p = t.splitAmounts?.personal || 0;
        let b = t.splitAmounts?.business || 0;
        if (p === 0 && b === 0) {
          if (t.owner === OwnerType.PERSONAL || !t.owner) p = t.amount;
          else if (t.owner === OwnerType.BUSINESS) b = t.amount;
        }

        groups[cat].total += t.amount;
        groups[cat].personal += p;
        groups[cat].business += b;
      });

    return {
      items: Object.entries(groups).sort((a, b) => b[1].total - a[1].total)
    };
  }, [data.transactions]);

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4 md:py-8">
      {/* Total Liabilities Hero Card */}
      <div className="bg-gradient-to-br from-violet-600 to-primary rounded-[32px] p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex justify-between items-start mb-1 relative z-10">
          <p className="text-blue-100 text-xs sm:text-sm font-bold uppercase tracking-wider">Total Liabilitas</p>
          <button type="button" onClick={onToggleShowAmounts} className="text-blue-100 hover:text-white transition p-1 cursor-pointer">
            {showAmounts ? <Eye size={22} /> : <EyeOff size={22} />}
          </button>
        </div>

        <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 relative z-10">
          {showAmounts ? formatIDR(totalDebt) : '••••••••'}
        </h3>

        <div className="space-y-3 pt-5 border-t border-white/15 relative z-10 grid sm:grid-cols-3 sm:gap-6">
          <div className="flex justify-between sm:flex-col items-center sm:items-start">
            <p className="text-blue-200 text-[10px] sm:text-xs uppercase font-bold tracking-widest">Tabungan</p>
            <p className="font-bold text-base sm:text-lg">{showAmounts ? formatIDR(totalSavingsAcrossYears) : '••••'}</p>
          </div>

          <div className="flex justify-between sm:flex-col items-center sm:items-start">
            <p className="text-blue-200 text-[10px] sm:text-xs uppercase font-bold tracking-widest">Piutang</p>
            <p className="font-bold text-base sm:text-lg">{showAmounts ? formatIDR(totalPiutangsAcrossYears) : '••••'}</p>
          </div>

          <div className="flex justify-between sm:flex-col items-center sm:items-start">
            <p className="text-white text-[10px] sm:text-xs uppercase font-black tracking-widest">Sisa Hutang</p>
            <p className="font-black text-lg sm:text-2xl text-amber-300">{showAmounts ? formatIDR(currentDebtGap) : '••••'}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-4 gap-3 sm:gap-6">
        <button
          type="button"
          onClick={() => onOpenQuickRecord('EXPENSE')}
          className="flex flex-col items-center gap-2 group cursor-pointer"
        >
          <div className="w-full aspect-square max-w-[80px] bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xs active:scale-95 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all">
            <PlusCircle size={28} />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-slate-600 dark:text-slate-300 uppercase">Catat</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenQuickRecord('SAVING')}
          className="flex flex-col items-center gap-2 group cursor-pointer"
        >
          <div className="w-full aspect-square max-w-[80px] bg-emerald-50 dark:bg-emerald-900/30 text-success dark:text-emerald-400 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xs active:scale-95 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all">
            <Vault size={28} />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-slate-600 dark:text-slate-300 uppercase">Nabung</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenQuickRecord('PIUTANG')}
          className="flex flex-col items-center gap-2 group cursor-pointer"
        >
          <div className="w-full aspect-square max-w-[80px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xs active:scale-95 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all">
            <HandCoins size={28} />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-slate-600 dark:text-slate-300 uppercase">Piutang</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenCardForm(null)}
          className="flex flex-col items-center gap-2 group cursor-pointer"
        >
          <div className="w-full aspect-square max-w-[80px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xs active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <Briefcase size={28} />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-slate-600 dark:text-slate-300 uppercase">Hutang</span>
        </button>
      </div>

      {/* Upcoming Bills Horizontal Carousel */}
      {upcomingBills.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base uppercase tracking-tight ml-1">
            Tagihan Terdekat
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
            {upcomingBills.map(b => (
              <div
                key={b.card.id}
                onClick={() => onOpenStatement(b.card)}
                className="min-w-[85vw] sm:min-w-[360px] bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col gap-4 snap-center active:scale-[0.98] hover:border-primary transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${b.card.color || 'bg-slate-800'} rounded-xl flex items-center justify-center text-white shadow-xs`}>
                      <AlertCircle size={18} />
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{b.card.name}</span>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    Jatuh Tempo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl relative overflow-hidden">
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[8px] sm:text-[9px]">Tagihan</span>
                    <span className="font-black text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
                      {showAmounts ? formatIDR(b.amount) : '••••'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Expenses Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg mb-6 flex items-center gap-2">
          <PieChart size={22} className="text-primary" /> Pengeluaran Kelompok Bulan Ini
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {categoryGrouping.items.map(([cat, val], idx) => (
            <div key={idx} className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">{cat}</span>
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">{showAmounts ? formatIDR(val.total) : '••••'}</span>
              </div>

              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                {val.personal > 0 && (
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(val.personal / val.total) * 100}%` }} />
                )}
                {val.business > 0 && (
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(val.business / val.total) * 100}%` }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {categoryGrouping.items.length === 0 && (
          <p className="text-center py-8 text-slate-400 font-medium text-xs">Belum ada pengeluaran yang dicatat bulan ini.</p>
        )}
      </div>
    </div>
  );
};
