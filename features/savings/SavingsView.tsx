import React, { useState, useMemo } from 'react';
import { AppState, Saving } from '../../types';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { Vault, Plus, ArrowLeftRight, ChevronRight, X } from 'lucide-react';

interface SavingsViewProps {
  data: AppState;
  showAmounts: boolean;
  onOpenQuickRecord: (tab: 'SAVING') => void;
  onOpenTransfer: () => void;
  onEditSaving: (s: Saving) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  data,
  showAmounts,
  onOpenQuickRecord,
  onOpenTransfer,
  onEditSaving
}) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [historyModal, setHistoryModal] = useState<{
    title: string;
    items: Saving[];
    cardId: string;
    month: number;
    year: number;
  } | null>(null);

  const savingsYearlyData = useMemo(() => {
    return MONTH_NAMES.map((monthName, monthIdx) => {
      const monthlySavings = data.savings.filter(
        s => !s.isTransferred && s.targetPeriod?.month === monthIdx && s.targetPeriod?.year === selectedYear
      );
      const cardGroups: Record<string, { cardId: string; cardName: string; cardColor: string; amount: number; items: Saving[] }> = {};
      monthlySavings.forEach(s => {
        const card = data.cards.find(c => c.id === s.cardId);
        if (!card) return;
        if (!cardGroups[s.cardId]) {
          cardGroups[s.cardId] = { cardId: s.cardId, cardName: card.name, cardColor: card.color, amount: 0, items: [] };
        }
        cardGroups[s.cardId].amount += s.amount;
        cardGroups[s.cardId].items.push(s);
      });
      const totalMonth = monthlySavings.reduce((sum, s) => sum + s.amount, 0);
      return { monthName, monthIdx, cardGroups: Object.values(cardGroups), totalMonth };
    });
  }, [data, selectedYear]);

  const totalYearSavings = useMemo(() => {
    return data.savings
      .filter(s => !s.isTransferred && s.targetPeriod?.year === selectedYear)
      .reduce((sum, s) => sum + s.amount, 0);
  }, [data.savings, selectedYear]);

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4 md:py-8">
      {/* Hero Header */}
      <div className="bg-[#101827] rounded-[32px] p-6 sm:p-8 text-white shadow-xl space-y-6 relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -top-10 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Vault size={22} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Tabungan Pelunasan</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Simpanan khusus untuk menutupi tagihan kartu kredit & hutang</p>
          </div>

          <div className="flex items-center gap-2">
            {[2024, 2025, 2026, 2027].map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedYear === y ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Tabungan {selectedYear}</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {showAmounts ? formatIDR(totalYearSavings) : '••••••••'}
            </p>
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3 justify-start sm:justify-end">
            <button
              onClick={() => onOpenQuickRecord('SAVING')}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition"
            >
              <Plus size={18} /> Tambah Tabungan
            </button>
            <button
              onClick={onOpenTransfer}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 active:scale-95 transition"
            >
              <ArrowLeftRight size={18} /> Transfer Tabungan
            </button>
          </div>
        </div>
      </div>

      {/* Grid Monthly Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {savingsYearlyData.map(m => (
          <div
            key={m.monthIdx}
            className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <h3 className="font-black text-base text-slate-800 dark:text-slate-100 tracking-tight">
                {m.monthName} {selectedYear}
              </h3>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                {showAmounts ? formatIDR(m.totalMonth) : '••••'}
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3 flex-1">
              {m.cardGroups.map(cg => (
                <div
                  key={cg.cardId}
                  onClick={() =>
                    setHistoryModal({
                      title: `Tabungan ${cg.cardName} (${m.monthName} ${selectedYear})`,
                      items: cg.items,
                      cardId: cg.cardId,
                      month: m.monthIdx,
                      year: selectedYear
                    })
                  }
                  className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-100 dark:border-slate-700/50 flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${cg.cardColor || 'bg-emerald-500'}`} />
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm truncate">
                      {cg.cardName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                      {showAmounts ? formatIDR(cg.amount) : '••••'}
                    </span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}

              {m.cardGroups.length === 0 && (
                <p className="text-center text-xs font-bold text-slate-300 dark:text-slate-700 py-6">
                  Tidak ada alokasi tabungan
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-5 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight">
                {historyModal.title}
              </h3>
              <button
                onClick={() => setHistoryModal(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3 no-scrollbar">
              {historyModal.items.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setHistoryModal(null);
                    onEditSaving(item);
                  }}
                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition group border border-transparent hover:border-emerald-500/30"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.note || 'Tabungan'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black ${item.amount < 0 ? 'text-danger' : 'text-emerald-600'}`}>
                      {formatIDR(item.amount)}
                    </span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  setHistoryModal(null);
                  onOpenQuickRecord('SAVING');
                }}
                className="w-full mt-4 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-600 hover:border-emerald-600 transition-all font-bold text-sm uppercase"
              >
                <Plus size={18} /> Tambah Data Tabungan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
