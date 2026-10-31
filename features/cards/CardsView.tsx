import React from 'react';
import { AppState, CreditCard, DebtType } from '../../types';
import { formatIDR } from '../../lib/format';
import { getCardBalance } from '../../lib/billing';
import { Plus, Pencil, Trash2, Wifi } from 'lucide-react';

interface CardsViewProps {
  data: AppState;
  showAmounts: boolean;
  onOpenCardForm: (card?: CreditCard | null) => void;
  onOpenStatement: (card: CreditCard) => void;
  onDeleteCard: (cardId: string) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  data,
  showAmounts,
  onOpenCardForm,
  onOpenStatement,
  onDeleteCard
}) => {
  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Daftar Kartu & Liabilitas
          </h2>
          <p className="text-xs text-slate-400 mt-1">Kelola kartu kredit, pinjaman, dan plafon kredit Anda</p>
        </div>

        <button
          onClick={() => onOpenCardForm(null)}
          className="px-5 py-3 bg-primary hover:bg-blue-700 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition"
        >
          <Plus size={18} /> Tambah Kartu Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.cards.map(card => {
          const balance = getCardBalance(data, card.id);
          const remaining = card.limit - balance;
          return (
            <div key={card.id} className="space-y-3">
              <div
                onClick={() => onOpenStatement(card)}
                className="relative p-6 rounded-[24px] text-white shadow-xl h-56 flex flex-col justify-between overflow-hidden active:scale-[0.98] transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group"
              >
                {/* Background Colors & Gradient */}
                <div className={`absolute inset-0 ${card.color || 'bg-slate-800'}`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_20%,rgba(255,255,255,0.1)_25%,transparent_30%)] pointer-events-none transition-transform duration-700 -translate-x-full group-hover:translate-x-full" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none" />

                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {/* EMV Chip */}
                    <div className="w-10 h-7 bg-gradient-to-br from-[#e5c07b] to-[#d19a3b] rounded-md flex items-center justify-center opacity-90 shadow-xs border border-[#f5d596]/40 overflow-hidden">
                      <div className="w-6 h-5 border border-[#a67b27]/30 rounded-xs flex flex-col justify-between p-[1px]">
                        <div className="h-[1px] w-full bg-[#a67b27]/30 mt-1" />
                        <div className="h-[1px] w-full bg-[#a67b27]/30" />
                        <div className="h-[1px] w-full bg-[#a67b27]/30 mb-1" />
                      </div>
                    </div>
                    <Wifi size={24} className="rotate-90 opacity-40 -ml-1" />
                  </div>

                  {/* Merchant Logo */}
                  {card.logoUrl ? (
                    <div className="w-12 h-12 bg-white rounded-lg p-1.5 shadow-md shrink-0">
                      <img src={card.logoUrl} alt={card.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-xl text-white shadow-xs shrink-0 backdrop-blur-xs border border-white/30">
                      {card.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-center mt-2">
                  <div className="font-mono text-[17px] sm:text-xl tracking-[0.25em] opacity-90 drop-shadow-md">
                    •••• •••• •••• {card.id.substring(0, 4).replace(/[^0-9]/g, '8').padEnd(4, '3')}
                  </div>
                </div>

                <div className="relative z-10 flex justify-between items-end pt-2">
                  <div>
                    <h4 className="text-sm font-bold tracking-widest uppercase mb-3 text-white/90 drop-shadow-md">
                      {card.name}
                    </h4>
                    <div className="flex items-end gap-5">
                      <div>
                        <p className="text-[8px] opacity-70 uppercase font-black tracking-widest mb-0.5">Limit/Plafon</p>
                        <p className="text-sm font-black drop-shadow-xs">{showAmounts ? formatIDR(card.limit) : '••••••••'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] opacity-70 uppercase font-black tracking-widest mb-0.5">Sisa Limit</p>
                        <p className="text-sm font-black drop-shadow-xs">{showAmounts ? formatIDR(remaining) : '••••'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[8px] opacity-70 uppercase font-black tracking-widest mb-0.5">
                      {card.type === DebtType.CREDIT_CARD ? 'CREDIT' : 'DEBT'}
                    </span>
                    <span className="text-xs font-mono font-bold tracking-widest drop-shadow-xs">
                      {card.dueDay ? `**/${card.dueDay.toString().padStart(2, '0')}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenCardForm(card)}
                  className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus kartu ${card.name}?`)) {
                      onDeleteCard(card.id);
                    }
                  }}
                  className="flex-1 py-3 bg-red-50 dark:bg-red-900/10 text-danger rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition cursor-pointer"
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => onOpenCardForm(null)}
          className="h-56 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[28px] text-slate-400 dark:text-slate-600 font-bold flex flex-col items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-primary transition-all cursor-pointer"
        >
          <Plus size={32} />
          <span className="text-xs font-black uppercase tracking-widest">Tambah Kartu Baru</span>
        </button>
      </div>
    </div>
  );
};
