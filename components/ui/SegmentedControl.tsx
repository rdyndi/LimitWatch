import React from 'react';

export interface SegmentOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  activeColor?: string; // custom active color class, e.g. 'text-danger' or 'bg-danger text-white'
  badge?: string;
}

export interface SegmentedControlProps<T = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className = '',
  size = 'md'
}: SegmentedControlProps<T>) {
  const minHeight = size === 'sm' ? 'min-h-[40px]' : size === 'lg' ? 'min-h-[52px]' : 'min-h-[46px]';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm font-black';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
          {label}
        </label>
      )}

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 gap-1 select-none">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex-1 ${minHeight} ${textClass} rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                isSelected
                  ? opt.activeColor || 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-md font-black scale-[1.01]'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold'
              }`}
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span>{opt.label}</span>
              {opt.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ml-1">
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
