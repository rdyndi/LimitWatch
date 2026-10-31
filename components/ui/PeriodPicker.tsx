import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MONTH_NAMES, MONTH_SHORT_NAMES } from '../../lib/constants';

export interface PeriodPickerProps {
  month: number; // 0 - 11
  year: number;
  onChange: (period: { month: number; year: number }) => void;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const PeriodPicker: React.FC<PeriodPickerProps> = ({
  month,
  year,
  onChange,
  label,
  className = '',
  compact = false
}) => {
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [modalYear, setModalYear] = useState(year);

  // Normalize month & year to safe numbers
  const safeMonth = Math.min(11, Math.max(0, isNaN(month) ? new Date().getMonth() : month));
  const safeYear = isNaN(year) || year < 2000 ? new Date().getFullYear() : year;

  const handlePrev = () => {
    if (safeMonth === 0) {
      onChange({ month: 11, year: safeYear - 1 });
    } else {
      onChange({ month: safeMonth - 1, year: safeYear });
    }
  };

  const handleNext = () => {
    if (safeMonth === 11) {
      onChange({ month: 0, year: safeYear + 1 });
    } else {
      onChange({ month: safeMonth + 1, year: safeYear });
    }
  };

  const selectMonthAndYear = (m: number, y: number) => {
    onChange({ month: m, year: y });
    setShowQuickModal(false);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
          {label}
        </label>
      )}

      {/* Stepper Bar */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Bulan sebelumnya"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          type="button"
          onClick={() => {
            setModalYear(safeYear);
            setShowQuickModal(true);
          }}
          className={`flex items-center gap-2 px-4 min-h-[44px] rounded-xl hover:bg-white dark:hover:bg-slate-700 active:scale-98 transition-all font-black text-slate-800 dark:text-slate-100 ${
            compact ? 'text-sm' : 'text-base'
          }`}
          title="Klik untuk memilih bulan & tahun langsung"
        >
          <Calendar size={16} className="text-primary shrink-0" />
          <span>
            {MONTH_NAMES[safeMonth]} {safeYear}
          </span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Bulan berikutnya"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Quick Jump Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Pilih Periode
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalYear((y) => y - 1)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-base font-black text-slate-800 dark:text-slate-100 px-1">
                  {modalYear}
                </span>
                <button
                  type="button"
                  onClick={() => setModalYear((y) => y + 1)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-3 gap-2">
              {MONTH_SHORT_NAMES.map((name, idx) => {
                const isSelected = idx === safeMonth && modalYear === safeYear;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectMonthAndYear(idx, modalYear)}
                    className={`min-h-[44px] py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  selectMonthAndYear(now.getMonth(), now.getFullYear());
                }}
                className="flex-1 min-h-[44px] py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="min-h-[44px] px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
