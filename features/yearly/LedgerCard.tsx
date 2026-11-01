import React, { useState } from 'react';
import { formatIDR } from '../../lib/format';
import { CardSavingsReport, CardPiutangReport } from '../../lib/yearlyReport';
import { ChevronRight, HelpCircle, Vault, HandCoins, Info } from 'lucide-react';

interface LedgerCardProps {
  type: 'SAVINGS' | 'PIUTANG';
  savingsData?: CardSavingsReport;
  piutangData?: CardPiutangReport;
  showAmounts?: boolean;
  onViewSource?: (sourceType: 'setoran' | 'dipakai' | 'piutangBaru' | 'dikembalikan') => void;
}

export const LedgerCard: React.FC<LedgerCardProps> = ({
  type,
  savingsData,
  piutangData,
  showAmounts = true,
  onViewSource
}) => {
  const [showEstimatedModal, setShowEstimatedModal] = useState(false);

  const isSavings = type === 'SAVINGS';
  const isEstimated = isSavings ? savingsData?.dipakaiEstimated : piutangData?.dikembalikanEstimated;

  const title = isSavings ? 'Ledger Kas Tabungan' : 'Ledger Piutang Berjalan';
  const subtitle = isSavings
    ? 'Arus simpanan tunai untuk tagihan'
    : 'Arus piutang yang dipinjamkan & kembali';
  const icon = isSavings ? (
    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
      <Vault size={18} />
    </div>
  ) : (
    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
      <HandCoins size={18} />
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
      {/* Title Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                {title}
              </h3>
              {isEstimated && (
                <button
                  type="button"
                  onClick={() => setShowEstimatedModal(true)}
                  aria-label="Lihat info data perkiraan"
                  className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-pointer min-h-[28px]"
                >
                  <HelpCircle size={12} />
                  <span>Perkiraan</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Ledger Formula Row */}
      {isSavings && savingsData && (
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/40">
            <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 block">
                Saldo Awal
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 mt-1 block">
                {showAmounts ? formatIDR(savingsData.saldoAwal) : '••••'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onViewSource?.('setoran')}
              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/40 cursor-pointer transition text-left sm:text-center group"
            >
              <div className="flex items-center justify-between sm:justify-center gap-1">
                <span className="text-xs font-black uppercase text-emerald-500 block">
                  + Setoran
                </span>
                <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {showAmounts ? formatIDR(savingsData.setoran) : '••••'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onViewSource?.('dipakai')}
              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/40 cursor-pointer transition text-left sm:text-center group"
            >
              <div className="flex items-center justify-between sm:justify-center gap-1">
                <span className="text-xs font-black uppercase text-rose-500 block">
                  − Dipakai
                </span>
                <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-rose-500 mt-1 block">
                {showAmounts ? formatIDR(savingsData.dipakai) : '••••'}
              </span>
            </button>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl flex justify-between items-center">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
              Saldo Akhir Bulan
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {showAmounts ? formatIDR(savingsData.saldoAkhir) : '••••••••'}
            </span>
          </div>
        </div>
      )}

      {!isSavings && piutangData && (
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/40">
            <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 block">
                Sisa Awal
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 mt-1 block">
                {showAmounts ? formatIDR(piutangData.sisaAwal) : '••••'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onViewSource?.('piutangBaru')}
              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/40 cursor-pointer transition text-left sm:text-center group"
            >
              <div className="flex items-center justify-between sm:justify-center gap-1">
                <span className="text-xs font-black uppercase text-indigo-400 block">
                  + Baru
                </span>
                <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-indigo-500 dark:text-indigo-300 mt-1 block">
                {showAmounts ? formatIDR(piutangData.piutangBaru) : '••••'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onViewSource?.('dikembalikan')}
              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/40 cursor-pointer transition text-left sm:text-center group"
            >
              <div className="flex items-center justify-between sm:justify-center gap-1">
                <span className="text-xs font-black uppercase text-emerald-500 block">
                  − Kembali
                </span>
                <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {showAmounts ? formatIDR(piutangData.dikembalikan) : '••••'}
              </span>
            </button>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-2xl flex justify-between items-center">
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
              Sisa Piutang Berjalan
            </span>
            <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
              {showAmounts ? formatIDR(piutangData.sisaBerjalan) : '••••••••'}
            </span>
          </div>
        </div>
      )}

      {/* Info Modal for Estimated Data */}
      {showEstimatedModal && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-sm w-full p-6 rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Info size={22} />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-black text-base text-slate-800 dark:text-slate-100">
                Penanda Data Perkiraan
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Catatan ini dibuat sebelum sistem pencatatan tanggal pelunasan aktif.
                Sistem menggunakan fallback bulan target tagihan agar data keuangan historis tetap akurat dan tidak berubah.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEstimatedModal(false)}
              className="w-full py-3 bg-primary text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition min-h-[44px] cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
