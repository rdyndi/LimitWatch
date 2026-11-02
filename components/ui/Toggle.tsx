import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  activeColor?: string;
  className?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  icon,
  activeColor = 'bg-primary',
  className = '',
  disabled = false
}) => {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`min-h-[48px] p-3.5 rounded-2xl flex items-center justify-between border-2 transition-all cursor-pointer select-none ${
        checked
          ? 'bg-slate-50 dark:bg-slate-800/80 border-primary/40'
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-98'} ${className}`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              checked
                ? `${activeColor} text-white`
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            {icon}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">
            {label}
          </span>
          {description && (
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Switch pill */}
      <div
        className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
          checked ? activeColor : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );
};
