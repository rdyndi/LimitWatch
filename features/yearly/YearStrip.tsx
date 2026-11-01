import React from 'react';
import { MonthReport, getMonthStatus } from '../../lib/yearlyReport';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { CheckCircle2, ChevronRight, BarChart3, Clock, AlertCircle, ShieldCheck } from 'lucide-react';

interface YearStripProps {
  year: number;
  months: MonthReport[];
  showAmounts?: boolean;
  onSelectMonth: (monthIdx: number) => void;
}

export const YearStrip: React.FC<YearStripProps> = ({
  year,
  months,
  showAmounts = true,
  onSelectMonth
}) => {
  const currentDate = new Date();

  // Max bill for relative chart scaling
  const maxBill = Math.max(
    1,
    ...months.map((m) => Math.max(m.total.tagihan, m.total.dibayar))
  );

  return (
    <div className="space-y-6">
      {/* 12 Months Strip Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {months.map((m) => {
          const monthIdx = m.month;
          const monthName = MONTH_NAMES[monthIdx];
          const status = getMonthStatus(m, currentDate);

          const isCurrentMonth =
            currentDate.getFullYear() === year && currentDate.getMonth() === monthIdx;

          // Status Badge details (3-tier status + KOSONG/MENDATANG)
          let badgeContent: React.ReactNode;
          let badgeClasses = '';

          switch (status.type) {
            case 'LUNAS':
              badgeClasses =
                'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60';
              badgeContent = (
                <>
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>Lunas</span>
                </>
              );
              break;
            case 'TERTUTUP':
              badgeClasses =
                'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60';
              badgeContent = (
                <>
                  <ShieldCheck size={13} className="shrink-0" />
                  <span className="truncate">Tertutup tab/piutang</span>
                </>
              );
              break;
            case 'KURANG':
              badgeClasses =
                'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60';
              badgeContent = (
                <>
                  <AlertCircle size={13} className="shrink-0" />
                  <span>
                    Kurang {showAmounts ? formatIDR(status.kurangBersih) : '••••'}
                  </span>
                </>
              );
              break;
            case 'MENDATANG':
              badgeClasses =
                'bg-blue-50/70 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50';
              badgeContent = (
                <>
                  <Clock size={13} className="shrink-0" />
                  <span>Mendatang{status.subLabel ? ` • ${status.subLabel}` : ''}</span>
                </>
              );
              break;
            case 'KOSONG':
            default:
              badgeClasses =
                'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
              badgeContent = (
                <>
                  <Clock size={13} className="shrink-0" />
                  <span>Belum ada tagihan</span>
                </>
              );
              break;
          }

          return (
            <button
              key={monthIdx}
              type="button"
              onClick={() => onSelectMonth(monthIdx)}
              className={`p-4 rounded-3xl text-left transition-all cursor-pointer flex flex-col justify-between min-h-[124px] bg-white dark:bg-slate-900 border ${
                isCurrentMonth
                  ? 'border-primary ring-2 ring-primary/20 shadow-md'
                  : 'border-slate-100 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              } hover:shadow-md active:scale-[0.98] group`}
            >
              {/* Row 1: Month Name & Indicator */}
              <div className="flex justify-between items-start gap-1">
                <div>
                  <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                    {year}
                  </span>
                  <h4 className="font-black text-base text-slate-800 dark:text-slate-100 tracking-tight">
                    {monthName}
                  </h4>
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition shrink-0">
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                </div>
              </div>

              {/* Row 2: Tagihan Total */}
              <div className="my-2">
                <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 block">
                  Tagihan
                </span>
                <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {showAmounts ? formatIDR(m.total.tagihan) : '••••••••'}
                </p>
              </div>

              {/* Row 3: Status Badge */}
              <div className="pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold max-w-full truncate ${badgeClasses}`}
                >
                  {badgeContent}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bill vs Paid Monthly Comparison Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                Grafik Tagihan vs Pembayaran
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Perbandingan nominal 12 bulan di tahun {year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Tagihan
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Dibayar
            </span>
          </div>
        </div>

        {/* Bar chart container */}
        <div className="pt-4 grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-44 border-b border-slate-100 dark:border-slate-800 pb-2">
          {months.map((m) => {
            const billPct = Math.round((m.total.tagihan / maxBill) * 100);
            const paidPct = Math.round((m.total.dibayar / maxBill) * 100);
            const shortName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][m.month];

            return (
              <div
                key={m.month}
                onClick={() => onSelectMonth(m.month)}
                className="flex flex-col items-center justify-end h-full gap-1 cursor-pointer group"
                title={`${MONTH_NAMES[m.month]}: Tagihan ${formatIDR(m.total.tagihan)}, Dibayar ${formatIDR(m.total.dibayar)}`}
              >
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-32">
                  {/* Bill bar */}
                  <div
                    className="w-1/2 bg-blue-500/80 group-hover:bg-blue-500 rounded-t-sm transition-all duration-300"
                    style={{ height: `${Math.max(4, billPct)}%` }}
                  />
                  {/* Paid bar */}
                  <div
                    className="w-1/2 bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t-sm transition-all duration-300"
                    style={{ height: `${Math.max(4, paidPct)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-primary transition uppercase">
                  {shortName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
