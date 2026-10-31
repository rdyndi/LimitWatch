import React from 'react';
import { Loader2 } from 'lucide-react';

export interface StickyActionBarProps {
  primaryLabel: string;
  onPrimaryClick?: () => void;
  primaryType?: 'submit' | 'button';
  isValid?: boolean;
  isLoading?: boolean;
  color?: 'danger' | 'success' | 'indigo' | 'primary';
  invalidMessage?: string;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  secondaryDanger?: boolean;
  className?: string;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  primaryLabel,
  onPrimaryClick,
  primaryType = 'submit',
  isValid = true,
  isLoading = false,
  color = 'primary',
  invalidMessage,
  secondaryLabel,
  onSecondaryClick,
  secondaryDanger = false,
  className = ''
}) => {
  const bgClasses = {
    danger: 'bg-danger hover:bg-red-600',
    success: 'bg-success hover:bg-emerald-600',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    primary: 'bg-primary hover:bg-blue-600'
  }[color];

  return (
    <div
      className={`sticky bottom-0 -mx-4 -mb-4 sm:-mx-8 sm:-mb-8 p-4 sm:p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 rounded-b-3xl z-10 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] space-y-2 ${className}`}
    >
      {!isValid && invalidMessage && (
        <div className="text-center animate-in fade-in duration-200">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            {invalidMessage}
          </p>
        </div>
      )}

      <button
        type={primaryType}
        onClick={onPrimaryClick}
        disabled={!isValid || isLoading}
        className={`w-full min-h-[52px] py-4 text-white font-black text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
          !isValid
            ? 'opacity-40 cursor-not-allowed bg-slate-400 dark:bg-slate-600 shadow-none'
            : `${bgClasses} active:scale-[0.98]`
        }`}
      >
        {isLoading && <Loader2 size={18} className="animate-spin shrink-0" />}
        <span>{primaryLabel}</span>
      </button>

      {secondaryLabel && onSecondaryClick && (
        <button
          type="button"
          onClick={onSecondaryClick}
          className={`w-full min-h-[44px] py-2.5 font-bold text-xs rounded-xl transition-all ${
            secondaryDanger
              ? 'bg-red-50 dark:bg-red-950/30 text-danger hover:bg-red-100 dark:hover:bg-red-900/40'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
};
