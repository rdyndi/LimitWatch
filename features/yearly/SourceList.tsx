import React from 'react';
import { formatIDR } from '../../lib/format';
import { X, ArrowDownRight, ArrowUpRight, HelpCircle, Layers } from 'lucide-react';

export interface SourceItem {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;
  date?: string;
  type?: 'expense' | 'payment' | 'saving' | 'piutang' | 'installment';
  tag?: string;
  isEstimated?: boolean;
}

interface SourceListProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: SourceItem[];
}

export const SourceList: React.FC<SourceListProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  items
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300 border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-800 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 no-scrollbar">
          {items.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Layers size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                Tidak ada data sumber tercatat
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isNegative = item.amount < 0;
              const formattedDate = item.date
                ? new Date(item.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : undefined;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex justify-between items-center gap-3 transition"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                        {item.title}
                      </span>
                      {item.tag && (
                        <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {item.tag}
                        </span>
                      )}
                      {item.isEstimated && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          <HelpCircle size={10} /> Perkiraan
                        </span>
                      )}
                    </div>
                    {(formattedDate || item.subtitle) && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                        {formattedDate} {formattedDate && item.subtitle ? '•' : ''} {item.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm sm:text-base font-black ${
                        isNegative
                          ? 'text-danger'
                          : item.type === 'payment'
                          ? 'text-emerald-500'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {formatIDR(item.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-2xl text-sm transition min-h-[44px] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
