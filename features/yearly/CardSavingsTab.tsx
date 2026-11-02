import React from 'react';
import { CardMonthReport } from '../../lib/yearlyReport';
import { formatIDR } from '../../lib/format';
import { ChevronRight } from 'lucide-react';

interface CardSavingsTabProps {
  cardReport: CardMonthReport;
  showAmounts?: boolean;
  openSourceForTabungan: () => void;
}

export const CardSavingsTab: React.FC<CardSavingsTabProps> = ({
  cardReport,
  showAmounts = true,
  openSourceForTabungan
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
        Arus Tabungan {cardReport.cardName}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/40">
          <span className="text-xs font-black uppercase text-slate-400 block">
            Saldo Awal
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 mt-1 block">
            {showAmounts ? formatIDR(cardReport.tabungan.saldoAwal) : '••••'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/40">
          <span className="text-xs font-black uppercase text-emerald-500 block">
            + Setoran
          </span>
          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {showAmounts ? formatIDR(cardReport.tabungan.setoran) : '••••'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/40">
          <span className="text-xs font-black uppercase text-rose-500 block">
            − Dipakai
          </span>
          <span className="text-xs sm:text-sm font-black text-rose-500 mt-1 block">
            {showAmounts ? formatIDR(cardReport.tabungan.dipakai) : '••••'}
          </span>
        </div>

        <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 block">
            Saldo Akhir
          </span>
          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {showAmounts ? formatIDR(cardReport.tabungan.saldoAkhir) : '••••'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={openSourceForTabungan}
        className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs sm:text-sm rounded-2xl transition cursor-pointer flex justify-between items-center border border-slate-100 dark:border-slate-700/40"
      >
        <span>Lihat Semua Catatan Tabungan Terkait Periode Ini</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
