import React, { useRef } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { formatDateID } from '../../lib/format';

export interface DatePickerChipsProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  label?: string;
  className?: string;
}

export const DatePickerChips: React.FC<DatePickerChipsProps> = ({
  value,
  onChange,
  label = 'Tanggal Transaksi',
  className = ''
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const isToday = value === todayStr;
  const isYesterday = value === yesterdayStr;
  const isCustom = !isToday && !isYesterday;

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
          {label}
        </label>
      )}

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
        {/* Hari Ini Chip */}
        <button
          type="button"
          onClick={() => onChange(todayStr)}
          className={`shrink-0 min-h-[44px] px-4 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-black border-2 transition-all active:scale-95 ${
            isToday
              ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <Clock size={14} className={isToday ? 'text-white' : 'text-slate-400'} />
          <span>Hari Ini</span>
        </button>

        {/* Kemarin Chip */}
        <button
          type="button"
          onClick={() => onChange(yesterdayStr)}
          className={`shrink-0 min-h-[44px] px-4 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-black border-2 transition-all active:scale-95 ${
            isYesterday
              ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <span>Kemarin</span>
        </button>

        {/* Custom Date Chip */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={openDatePicker}
            className={`min-h-[44px] px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black border-2 transition-all active:scale-95 ${
              isCustom
                ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <CalendarIcon size={14} className={isCustom ? 'text-white' : 'text-slate-400'} />
            <span>{isCustom ? formatDateID(value) : 'Pilih Lainnya...'}</span>
          </button>

          {/* Hidden native date input triggered by showPicker */}
          <input
            ref={dateInputRef}
            type="date"
            value={value}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="sr-only"
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
};
