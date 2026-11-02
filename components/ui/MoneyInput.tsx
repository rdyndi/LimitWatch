import React, { useRef } from 'react';
import { formatNumberIDR, parseIDR } from '../../lib/format';
import { Plus, Minus, RotateCcw } from 'lucide-react';

export interface MoneyInputProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  placeholder?: string;
  color?: 'danger' | 'success' | 'indigo' | 'primary';
  variant?: 'boxed' | 'underline';
  showQuickButtons?: boolean;
  allowNegative?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  id?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '0',
  color = 'primary',
  variant = 'boxed',
  showQuickButtons = true,
  allowNegative = false,
  required = false,
  autoFocus = false,
  error,
  helperText,
  className = '',
  id
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const displayString = absValue > 0 ? formatNumberIDR(absValue) : '';

  const colorClasses = {
    danger: 'border-red-200 focus-within:border-danger text-danger',
    success: 'border-emerald-200 focus-within:border-success text-success',
    indigo: 'border-indigo-200 focus-within:border-indigo-600 text-indigo-600 dark:text-indigo-400',
    primary: 'border-blue-200 focus-within:border-blue-600 text-slate-800 dark:text-slate-100'
  }[color];

  const underlineColor = {
    danger: 'border-red-500',
    success: 'border-emerald-500',
    indigo: 'border-indigo-600',
    primary: 'border-blue-600'
  }[color];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseIDR(rawVal);
    onChange(isNegative ? -parsed : parsed);
  };

  const addAmount = (delta: number) => {
    const current = value || 0;
    onChange(Math.max(0, current + delta));
  };

  const multiplyByThousand = () => {
    const current = Math.abs(value || 0);
    if (current === 0) return;
    const next = current * 1000;
    onChange(isNegative ? -next : next);
  };

  const toggleSign = () => {
    onChange(-value);
  };

  const handleClear = () => {
    onChange(0);
    inputRef.current?.focus();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">
          {label}
        </label>
      )}

      {/* Main Input Display */}
      {variant === 'underline' ? (
        <div
          onClick={() => inputRef.current?.focus()}
          className={`relative flex items-center justify-center pb-1.5 border-b-2 transition-all cursor-text max-w-sm mx-auto ${
            error ? 'border-red-500' : underlineColor
          }`}
        >
          <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mr-2 select-none">
            {isNegative ? '- Rp' : 'Rp'}
          </span>

          <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="numeric"
            value={displayString}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            autoFocus={autoFocus}
            style={{ fontSize: 'clamp(2.25rem, 8vw, 3rem)' }}
            className="w-full font-black text-left outline-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-[48px]"
          />

          {value !== 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              aria-label="Bersihkan input nominal"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl flex items-center justify-center transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.focus()}
          className={`relative flex items-center justify-center p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border-2 transition-all cursor-text ${
            error ? 'border-red-400 bg-red-50/20' : colorClasses
          }`}
        >
          {allowNegative && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSign();
              }}
              className={`min-h-[44px] min-w-[44px] mr-2 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${
                isNegative
                  ? 'bg-danger text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Ubah tanda Positif / Negatif"
            >
              {isNegative ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          )}

          <span className="text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-500 mr-1.5 select-none">
            {isNegative ? '- Rp' : 'Rp'}
          </span>

          <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="numeric"
            value={displayString}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            autoFocus={autoFocus}
            style={{ fontSize: 'clamp(1.75rem, 6.5vw, 2.75rem)' }}
            className="w-full font-black text-center outline-none bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-[52px]"
          />

          {value !== 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              aria-label="Bersihkan input nominal"
              className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl flex items-center justify-center transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      )}

      {/* Inline Feedback / Error */}
      {error ? (
        <p className="text-xs font-bold text-danger text-center animate-in fade-in duration-200">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 text-center font-medium">
          {helperText}
        </p>
      ) : null}

      {/* Quick Increment Buttons */}
      {showQuickButtons && (
        <div className="flex items-center justify-center gap-1.5 pt-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => addAmount(10000)}
            className="min-h-[44px] px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-700/60"
          >
            +10rb
          </button>
          <button
            type="button"
            onClick={() => addAmount(50000)}
            className="min-h-[44px] px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-700/60"
          >
            +50rb
          </button>
          <button
            type="button"
            onClick={() => addAmount(100000)}
            className="min-h-[44px] px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-700/60"
          >
            +100rb
          </button>
          <button
            type="button"
            onClick={multiplyByThousand}
            disabled={!value || value === 0}
            className="min-h-[44px] px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-xl transition-all border border-indigo-200/60 dark:border-indigo-800/60"
            title="Kalikan 1.000 (tambah tiga nol)"
          >
            000
          </button>
        </div>
      )}
    </div>
  );
};
