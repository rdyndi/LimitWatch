import React from 'react';
import { YearReport } from '../../lib/yearlyReport';
import { formatIDR } from '../../lib/format';
import { Vault, HandCoins, User, Briefcase, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface YearRecapProps {
  year: number;
  report: YearReport;
  showAmounts?: boolean;
  onSelectCard?: (cardId: string) => void;
}

export const YearRecap: React.FC<YearRecapProps> = ({
  year,
  report,
  showAmounts = true,
  onSelectCard
}) => {
  const { total, cards } = report;

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tabungan */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-500">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Vault size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Tabungan
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {showAmounts ? formatIDR(total.tabungan.saldoAkhir) : '••••••••'}
          </p>
          <span className="text-xs text-slate-400 block font-medium">
            Setoran: {showAmounts ? formatIDR(total.tabungan.setoran) : '••'}
          </span>
        </div>

        {/* Total Piutang */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <HandCoins size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Piutang
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-indigo-500 dark:text-indigo-400">
            {showAmounts ? formatIDR(total.piutang.sisaBerjalan) : '••••••••'}
          </p>
          <span className="text-xs text-slate-400 block font-medium">
            Baru: {showAmounts ? formatIDR(total.piutang.piutangBaru) : '••'}
          </span>
        </div>

        {/* Alokasi Pribadi */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-500">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <User size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Alokasi Pribadi
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            {showAmounts ? formatIDR(total.pribadi) : '••••••••'}
          </p>
          <span className="text-xs text-slate-400 block font-medium">
            {total.tagihan > 0
              ? `${Math.round((total.pribadi / total.tagihan) * 100)}% dari tagihan`
              : '0%'}
          </span>
        </div>

        {/* Alokasi Bisnis */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-500">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Alokasi Bisnis
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-500 dark:text-amber-400">
            {showAmounts ? formatIDR(total.bisnis) : '••••••••'}
          </p>
          <span className="text-xs text-slate-400 block font-medium">
            {total.tagihan > 0
              ? `${Math.round((total.bisnis / total.tagihan) * 100)}% dari tagihan`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Rincian Per Kartu Tahun Ini */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100">
            Rincian per Kartu Tahun {year}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Akumulasi tagihan, pembayaran, dan tabungan per kartu
          </p>
        </div>

        <div className="space-y-3">
          {cards.map((c) => {
            const isFullyPaid = c.tagihan > 0 && c.kurang === 0;

            return (
              <div
                key={c.cardId}
                onClick={() => onSelectCard?.(c.cardId)}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/50 transition cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${c.cardColor}`} />
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">
                      {c.cardName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tabungan: {showAmounts ? formatIDR(c.tabungan.saldoAkhir) : '••'} • Piutang:{' '}
                      {showAmounts ? formatIDR(c.piutang.sisaBerjalan) : '••'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block font-semibold">
                      Dibayar / Tagihan
                    </span>
                    <span className="font-black text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      {showAmounts ? formatIDR(c.dibayar) : '••'} / {showAmounts ? formatIDR(c.tagihan) : '••'}
                    </span>
                  </div>

                  <div>
                    {isFullyPaid ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 size={12} /> Lunas
                      </span>
                    ) : c.kurang > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                        <AlertCircle size={12} /> Kurang {showAmounts ? formatIDR(c.kurang) : '••'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Kosong
                      </span>
                    )}
                  </div>

                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition hidden sm:block" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
