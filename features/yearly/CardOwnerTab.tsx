import React from 'react';
import { CardMonthReport } from '../../lib/yearlyReport';
import { formatIDR } from '../../lib/format';
import { ChevronRight } from 'lucide-react';

interface CardOwnerTabProps {
  cardReport: CardMonthReport;
  showAmounts?: boolean;
  openSourceForPribadi: () => void;
  openSourceForBisnis: () => void;
}

export const CardOwnerTab: React.FC<CardOwnerTabProps> = ({
  cardReport,
  showAmounts = true,
  openSourceForPribadi,
  openSourceForBisnis
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
        Alokasi Kepemilikan {cardReport.cardName}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={openSourceForPribadi}
          className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left transition cursor-pointer hover:bg-blue-500/15"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase text-blue-500 tracking-wider">
              Pribadi
            </span>
            <ChevronRight size={14} className="text-blue-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {showAmounts ? formatIDR(cardReport.pribadi) : '••••'}
          </p>
          <span className="text-xs text-slate-400 block mt-0.5">
            {cardReport.tagihan > 0
              ? `${Math.round((cardReport.pribadi / cardReport.tagihan) * 100)}% dari tagihan kartu ini`
              : '0%'}
          </span>
        </button>

        <button
          type="button"
          onClick={openSourceForBisnis}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left transition cursor-pointer hover:bg-amber-500/15"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
              Bisnis
            </span>
            <ChevronRight size={14} className="text-amber-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-amber-500 dark:text-amber-400 mt-1">
            {showAmounts ? formatIDR(cardReport.bisnis) : '••••'}
          </p>
          <span className="text-xs text-slate-400 block mt-0.5">
            {cardReport.tagihan > 0
              ? `${Math.round((cardReport.bisnis / cardReport.tagihan) * 100)}% dari tagihan kartu ini`
              : '0%'}
          </span>
        </button>
      </div>
    </div>
  );
};
