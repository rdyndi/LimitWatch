import React, { useMemo } from 'react';
import { Tag } from 'lucide-react';

export interface DescriptionSuggestionsProps {
  history?: string[];
  onSelect: (description: string) => void;
  currentValue?: string;
  className?: string;
}

const DEFAULT_SUGGESTIONS = [
  'Makan Siang',
  'Kopi & Camilan',
  'Bensin / Transport',
  'Belanja Bulanan',
  'Tagihan & Utilitas',
  'Makan Malam',
  'Langganan / Subscriptions',
  'Keperluan Rumah'
];

export const DescriptionSuggestions: React.FC<DescriptionSuggestionsProps> = ({
  history = [],
  onSelect,
  currentValue = '',
  className = ''
}) => {
  // Aggregate recent unique descriptions
  const suggestions = useMemo(() => {
    const set = new Set<string>();
    // Prioritize user's own recent descriptions
    for (const h of history) {
      const trimmed = (h || '').trim();
      if (trimmed.length > 1 && !trimmed.toLowerCase().startsWith('pelunasan') && !set.has(trimmed)) {
        set.add(trimmed);
        if (set.size >= 6) break;
      }
    }
    // Fill with defaults if fewer than 6
    for (const def of DEFAULT_SUGGESTIONS) {
      if (!set.has(def)) {
        set.add(def);
        if (set.size >= 8) break;
      }
    }
    return Array.from(set);
  }, [history]);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-slate-400">
        <Tag size={12} />
        <span>Saran Cepat:</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
        {suggestions.map((item) => {
          const isCurrent = currentValue.trim().toLowerCase() === item.toLowerCase();
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                isCurrent
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
};
