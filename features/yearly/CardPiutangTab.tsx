import React from 'react';
import { CardMonthReport } from '../../lib/yearlyReport';
import { formatIDR } from '../../lib/format';
import { ChevronRight } from 'lucide-react';

interface CardPiutangTabProps {
  cardReport: CardMonthReport;
  showAmounts?: boolean;
  openSourceForPiutang: () => void;
}

export const CardPiutangTab: React.FC<CardPiutangTabProps> = ({
  cardReport,
  showAmounts = true,
  openSourceForPiutang
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
        Arus Piutang {cardReport.cardName}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/40">
          <span className="text-xs font-black uppercase text-slate-400 block">
            Sisa Awal
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 mt-1 block">
            {showAmounts ? formatIDR(cardReport.piutang.sisaAwal) : '••••'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/40">
          <span className="text-xs font-black uppercase text-indigo-400 block">
            + Baru
          </span>
          <span className="text-xs sm:text-sm font-black text-indigo-500 dark:text-indigo-400 mt-1 block">
            {showAmounts ? formatIDR(cardReport.piutang.piutangBaru) : '••••'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/40">
          <span className="text-xs font-black uppercase text-emerald-500 block">
            − Kembali
          </span>
          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {showAmounts ? formatIDR(cardReport.piutang.dikembalikan) : '••••'}
          </span>
        </div>

        <div className="p-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300 block">
            Sisa Berjalan
          </span>
          <span className="text-xs sm:text-sm font-black text-indigo-500 dark:text-indigo-400 mt-1 block">
            {showAmounts ? formatIDR(cardReport.piutang.sisaBerjalan) : '••••'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={openSourceForPiutang}
        className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs sm:text-sm rounded-2xl transition cursor-pointer flex justify-between items-center border border-slate-100 dark:border-slate-700/40"
      >
        <span>Lihat Semua Catatan Piutang Terkait Periode Ini</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
