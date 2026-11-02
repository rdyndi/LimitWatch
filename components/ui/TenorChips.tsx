import React, { useState } from 'react';
import { formatIDR } from '../../lib/format';
import { QUICK_TENORS } from '../../lib/constants';
import { Zap } from 'lucide-react';

export interface TenorChipsProps {
  months: number;
  onChange: (months: number) => void;
  totalAmount?: number;
  label?: string;
  className?: string;
}

export const TenorChips: React.FC<TenorChipsProps> = ({
  months,
  onChange,
  totalAmount = 0,
  label = 'Durasi Cicilan (Tenor)',
  className = ''
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInput, setCustomInput] = useState(String(months));

  const isPreset = (QUICK_TENORS as readonly number[]).includes(months);
  const monthlyEstimate = months > 0 && totalAmount > 0 ? Math.ceil(totalAmount / months) : 0;

  const handleApplyCustom = () => {
    const parsed = parseInt(customInput, 10);
    if (!isNaN(parsed) && parsed >= 2 && parsed <= 60) {
      onChange(parsed);
      setShowCustomModal(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center px-1">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
          {months} Bulan ({months}x)
        </span>
      </div>

      {/* Tenor Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
        {QUICK_TENORS.map((t) => {
          const isSelected = months === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className={`shrink-0 min-h-[44px] px-3.5 py-2 rounded-2xl flex items-center justify-center font-black text-xs border-2 transition-all active:scale-95 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {t}x
            </button>
          );
        })}

        {/* Lainnya Chip */}
        <button
          type="button"
          onClick={() => {
            setCustomInput(String(months));
            setShowCustomModal(true);
          }}
          className={`shrink-0 min-h-[44px] px-3.5 py-2 rounded-2xl flex items-center justify-center font-black text-xs border-2 transition-all active:scale-95 ${
            !isPreset
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          {!isPreset ? `${months}x (Ubah)` : 'Lainnya...'}
        </button>
      </div>

      {/* Monthly Installment Calculation Preview */}
      {monthlyEstimate > 0 && (
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Estimasi Cicilan per Bulan:
            </span>
          </div>
          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
            {formatIDR(monthlyEstimate)}
          </span>
        </div>
      )}

      {/* Custom Tenor Dialog */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 text-center">
              Tentukan Tenor (Bulan)
            </h3>
            <p className="text-xs text-slate-400 text-center">
              Masukkan durasi cicilan antara 2 hingga 60 bulan
            </p>

            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={2}
                max={60}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                autoFocus
                className="w-24 text-3xl font-black text-center p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-2 border-indigo-500 outline-none"
              />
              <span className="text-base font-black text-slate-500">Bulan</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="flex-1 min-h-[44px] py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="flex-1 min-h-[44px] py-2.5 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-md hover:bg-indigo-700"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
