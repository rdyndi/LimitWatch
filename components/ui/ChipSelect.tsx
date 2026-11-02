import React from 'react';

export interface ChipOption<T = string | number> {
  id: T;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface ChipSelectProps<T = string | number> {
  options: ChipOption<T>[];
  value: T;
  onChange: (val: T) => void;
  label?: string;
  className?: string;
  wrap?: boolean;
}

export function ChipSelect<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className = '',
  wrap = false
}: ChipSelectProps<T>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
          {label}
        </label>
      )}

      <div
        className={`py-1 ${
          wrap
            ? 'flex flex-wrap gap-2'
            : 'flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1'
        }`}
      >
        {options.map((opt) => {
          const isSelected = opt.id === value;
          return (
            <button
              key={String(opt.id)}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`shrink-0 min-h-[44px] px-3.5 py-2 rounded-2xl flex items-center gap-2 transition-all font-bold text-xs select-none border-2 active:scale-95 ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {opt.icon && (
                <span
                  className={`shrink-0 ${
                    isSelected ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {opt.icon}
                </span>
              )}
              <div className="flex flex-col text-left">
                <span>{opt.label}</span>
                {opt.subLabel && (
                  <span
                    className={`text-[10px] font-medium leading-none mt-0.5 ${
                      isSelected
                        ? 'text-white/80'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {opt.subLabel}
                  </span>
                )}
              </div>
              {opt.badge && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ml-1 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
