import React from 'react';
import { Transaction } from '../../types';
import { CardMonthReport } from '../../lib/yearlyReport';
import { formatIDR } from '../../lib/format';
import { Vault, HandCoins, User, Briefcase, ChevronRight } from 'lucide-react';

interface CardSummaryTabProps {
  cardReport: CardMonthReport;
  cardTransactions: Transaction[];
  monthName: string;
  year: number;
  showAmounts?: boolean;
  openSourceForTabungan: () => void;
  openSourceForPiutang: () => void;
  openSourceForPribadi: () => void;
  openSourceForBisnis: () => void;
}

export const CardSummaryTab: React.FC<CardSummaryTabProps> = ({
  cardReport,
  cardTransactions,
  monthName,
  year,
  showAmounts = true,
  openSourceForTabungan,
  openSourceForPiutang,
  openSourceForPribadi,
  openSourceForBisnis
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 mb-2">
          Ringkasan Kartu – {monthName} {year}
        </h3>

        {/* Tabungan di kartu ini */}
        <div
          onClick={openSourceForTabungan}
          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-100 dark:border-slate-700/40 flex justify-between items-center group"
        >
          <div className="flex items-center gap-2.5">
            <Vault size={18} className="text-emerald-500" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Tabungan (di kartu ini)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
              {showAmounts ? formatIDR(cardReport.tabungan.untukTagihan) : '••••'}
            </span>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Piutang di kartu ini */}
        <div
          onClick={openSourceForPiutang}
          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-100 dark:border-slate-700/40 flex justify-between items-center group"
        >
          <div className="flex items-center gap-2.5">
            <HandCoins size={18} className="text-indigo-400" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Piutang (di kartu ini)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-indigo-500 dark:text-indigo-400">
              {showAmounts ? formatIDR(cardReport.piutang.untukTagihan) : '••••'}
            </span>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Pribadi */}
        <div
          onClick={openSourceForPribadi}
          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-100 dark:border-slate-700/40 flex justify-between items-center group"
        >
          <div className="flex items-center gap-2.5">
            <User size={18} className="text-blue-500" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Pribadi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400">
              {showAmounts ? formatIDR(cardReport.pribadi) : '••••'}
            </span>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Bisnis */}
        <div
          onClick={openSourceForBisnis}
          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-100 dark:border-slate-700/40 flex justify-between items-center group"
        >
          <div className="flex items-center gap-2.5">
            <Briefcase size={18} className="text-amber-500" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Bisnis
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-amber-500 dark:text-amber-400">
              {showAmounts ? formatIDR(cardReport.bisnis) : '••••'}
            </span>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      {/* Sisa Tabungan & Sisa Piutang Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
          <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">
            Sisa Tabungan Akhir Bulan
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {showAmounts ? formatIDR(cardReport.tabungan.saldoAkhir) : '••••••••'}
          </p>
          <span className="text-xs text-slate-400 block">
            Saldo Awal: {showAmounts ? formatIDR(cardReport.tabungan.saldoAwal) : '••'}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
          <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider">
            Sisa Piutang Berjalan
          </span>
          <p className="text-xl sm:text-2xl font-black text-indigo-500 dark:text-indigo-400">
            {showAmounts ? formatIDR(cardReport.piutang.sisaBerjalan) : '••••••••'}
          </p>
          <span className="text-xs text-slate-400 block">
            Sisa Awal: {showAmounts ? formatIDR(cardReport.piutang.sisaAwal) : '••'}
          </span>
        </div>
      </div>

      {/* Detail Transaksi Bulan Ini */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
            Detail Transaksi Bulan Ini
          </h3>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            {cardTransactions.length} transaksi
          </span>
        </div>

        {cardTransactions.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 text-center py-6">
            Tidak ada transaksi belanja atau pelunasan langsung di periode ini
          </p>
        ) : (
          <div className="space-y-2.5">
            {cardTransactions.map((t) => {
              const isPayment = t.type === 'PAYMENT';
              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/40 flex justify-between items-center"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 truncate">
                      {t.description}
                    </p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      {new Date(t.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        isPayment ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {isPayment ? '- ' : ''}
                      {showAmounts ? formatIDR(t.amount) : '••••'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
