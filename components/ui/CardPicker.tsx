import React, { useMemo } from 'react';
import { CreditCard as CreditCardType } from '../../types';
import { CreditCard as CardIcon, Check } from 'lucide-react';

export interface CardPickerProps {
  cards: CreditCardType[];
  value: string;
  onChange: (cardId: string) => void;
  lastUsedCardId?: string;
  label?: string;
  className?: string;
}

export const CardPicker: React.FC<CardPickerProps> = ({
  cards,
  value,
  onChange,
  lastUsedCardId,
  label = 'Pilih Kartu / Sumber Dana',
  className = ''
}) => {
  // Reorder cards so last used card is first
  const sortedCards = useMemo(() => {
    if (!lastUsedCardId) return cards;
    const lastUsed = cards.find((c) => c.id === lastUsedCardId);
    if (!lastUsed) return cards;
    return [lastUsed, ...cards.filter((c) => c.id !== lastUsedCardId)];
  }, [cards, lastUsedCardId]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Geser untuk kartu lain</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
        {sortedCards.map((c) => {
          const isSelected = c.id === value;
          const isLastUsed = c.id === lastUsedCardId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={`shrink-0 min-h-[48px] px-3.5 py-2.5 rounded-2xl flex items-center gap-3 border-2 transition-all active:scale-95 text-left select-none ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md scale-[1.02]'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: c.color || '#3b82f6' }}
              >
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt={c.name} className="w-5 h-5 object-contain rounded-md" />
                ) : (
                  <CardIcon size={16} />
                )}
              </div>

              <div className="flex flex-col pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black truncate max-w-[130px]">{c.name}</span>
                  {isLastUsed && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500">
                      Terakhir
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-tight ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                  {c.dueDay ? `Jatuh tempo tgl ${c.dueDay}` : 'Tanpa tempo'}
                </span>
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center ml-auto shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
