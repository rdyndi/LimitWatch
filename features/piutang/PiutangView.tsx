import React, { useState, useMemo } from 'react';
import { AppState, Piutang as PiutangType } from '../../types';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { HandCoins, Plus, ChevronRight, X } from 'lucide-react';

interface PiutangViewProps {
  data: AppState;
  showAmounts: boolean;
  onOpenQuickRecord: (tab: 'PIUTANG') => void;
  onEditPiutang: (p: PiutangType) => void;
}

export const PiutangView: React.FC<PiutangViewProps> = ({
  data,
  showAmounts,
  onOpenQuickRecord,
  onEditPiutang
}) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [historyModal, setHistoryModal] = useState<{
    title: string;
    items: PiutangType[];
    cardId: string;
    month: number;
    year: number;
  } | null>(null);

  const piutangsYearlyData = useMemo(() => {
    return MONTH_NAMES.map((monthName, monthIdx) => {
      const monthlyPiutangs = (data.piutangs || []).filter(
        p => !p.isCollected && p.targetPeriod?.month === monthIdx && p.targetPeriod?.year === selectedYear
      );
      const cardGroups: Record<string, { cardId: string; cardName: string; cardColor: string; amount: number; items: PiutangType[] }> = {};
      monthlyPiutangs.forEach(p => {
        const card = data.cards.find(c => c.id === p.cardId);
        if (!card) return;
        if (!cardGroups[p.cardId]) {
          cardGroups[p.cardId] = { cardId: p.cardId, cardName: card.name, cardColor: card.color, amount: 0, items: [] };
        }
        cardGroups[p.cardId].amount += p.amount;
        cardGroups[p.cardId].items.push(p);
      });
      const totalMonth = monthlyPiutangs.reduce((sum, p) => sum + p.amount, 0);
      return { monthName, monthIdx, cardGroups: Object.values(cardGroups), totalMonth };
    });
  }, [data, selectedYear]);

  const totalYearPiutangs = useMemo(() => {
    return (data.piutangs || [])
      .filter(p => !p.isCollected && p.targetPeriod?.year === selectedYear)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [data.piutangs, selectedYear]);

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4 md:py-8">
      {/* Hero Header */}
      <div className="bg-[#1e1b4b] rounded-[32px] p-6 sm:p-8 text-white shadow-xl space-y-6 relative overflow-hidden border border-indigo-900/60">
        <div className="absolute -right-10 -top-10 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <HandCoins size={22} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Catatan Piutang</h2>
            </div>
            <p className="text-xs text-indigo-200/70 mt-1">Uang yang dipinjamkan ke orang lain & ditargetkan untuk bayar tagihan</p>
          </div>

          <div className="flex items-center gap-2">
            {[2024, 2025, 2026, 2027].map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedYear === y ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-950 text-indigo-300 hover:bg-indigo-900'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-indigo-900/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Total Piutang {selectedYear}</span>
            <p className="text-2xl sm:text-3xl font-black text-indigo-300 mt-1">
              {showAmounts ? formatIDR(totalYearPiutangs) : '••••••••'}
            </p>
          </div>

          <div className="sm:col-span-2 flex items-center justify-start sm:justify-end">
            <button
              onClick={() => onOpenQuickRecord('PIUTANG')}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition"
            >
              <Plus size={18} /> Tambah Piutang
            </button>
          </div>
        </div>
      </div>

      {/* Grid Monthly Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {piutangsYearlyData.map(m => (
          <div
            key={m.monthIdx}
            className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <h3 className="font-black text-base text-slate-800 dark:text-slate-100 tracking-tight">
                {m.monthName} {selectedYear}
              </h3>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                {showAmounts ? formatIDR(m.totalMonth) : '••••'}
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3 flex-1">
              {m.cardGroups.map(cg => (
                <div
                  key={cg.cardId}
                  onClick={() =>
                    setHistoryModal({
                      title: `Piutang ${cg.cardName} (${m.monthName} ${selectedYear})`,
                      items: cg.items,
                      cardId: cg.cardId,
                      month: m.monthIdx,
                      year: selectedYear
                    })
                  }
                  className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-100 dark:border-slate-700/50 flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${cg.cardColor || 'bg-indigo-500'}`} />
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm truncate">
                      {cg.cardName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
                      {showAmounts ? formatIDR(cg.amount) : '••••'}
                    </span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}

              {m.cardGroups.length === 0 && (
                <p className="text-center text-xs font-bold text-slate-300 dark:text-slate-700 py-6">
                  Tidak ada data piutang
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
                    onEditPiutang(item);
                  }}
                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition group border border-transparent hover:border-indigo-500/30"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.debtorName}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.note || 'Piutang'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {formatIDR(item.amount)}
                    </span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  setHistoryModal(null);
                  onOpenQuickRecord('PIUTANG');
                }}
                className="w-full mt-4 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all font-bold text-sm uppercase"
              >
                <Plus size={18} /> Tambah Data Piutang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
