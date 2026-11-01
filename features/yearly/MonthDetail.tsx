import React, { useState } from 'react';
import { AppState } from '../../types';
import { MonthReport, getMonthStatus, getCardStatus } from '../../lib/yearlyReport';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { LedgerCard } from './LedgerCard';
import { SourceList, SourceItem } from './SourceList';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Layers
} from 'lucide-react';

interface MonthDetailProps {
  data: AppState;
  year: number;
  month: number;
  monthReport: MonthReport;
  showAmounts?: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectCard: (cardId: string) => void;
}

export const MonthDetail: React.FC<MonthDetailProps> = ({
  data,
  year,
  month,
  monthReport,
  showAmounts = true,
  onPrevMonth,
  onNextMonth,
  onSelectCard
}) => {
  const [sourceModal, setSourceModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    items: SourceItem[];
  }>({
    isOpen: false,
    title: '',
    items: []
  });

  const { total, cards } = monthReport;
  const status = getMonthStatus(monthReport);
  const monthName = MONTH_NAMES[month];

  // Pribadi / Bisnis percentages
  const tagihanBase = total.tagihan > 0 ? total.tagihan : 1;
  const personalPct = Math.round((total.pribadi / tagihanBase) * 100);
  const businessPct = 100 - personalPct;

  // Open Source Tracing Helper
  const openSourceForLedger = (sourceType: 'setoran' | 'dipakai' | 'piutangBaru' | 'dikembalikan') => {
    if (sourceType === 'setoran') {
      const items: SourceItem[] = total.tabungan.setoranSavingIds
        .map((id) => data.savings.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => !!s)
        .map((s) => ({
          id: s.id,
          title: s.note || 'Setor Tabungan',
          subtitle: data.cards.find((c) => c.id === s.cardId)?.name || 'Tanpa Kartu',
          amount: s.amount,
          date: s.date,
          type: 'saving'
        }));

      setSourceModal({
        isOpen: true,
        title: 'Sumber Setoran Tabungan',
        subtitle: `${monthName} ${year}`,
        items
      });
    } else if (sourceType === 'dipakai') {
      const items: SourceItem[] = total.tabungan.dipakaiSavingIds
        .map((id) => data.savings.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => !!s)
        .map((s) => ({
          id: s.id,
          title: s.note || 'Tabungan Terpakai',
          subtitle: data.cards.find((c) => c.id === s.cardId)?.name || 'Tanpa Kartu',
          amount: s.usedAmount ?? s.amount,
          date: s.transferredAt || s.date,
          type: 'saving',
          isEstimated: !s.transferredAt
        }));

      setSourceModal({
        isOpen: true,
        title: 'Sumber Tabungan Terpakai',
        subtitle: `${monthName} ${year}`,
        items
      });
    } else if (sourceType === 'piutangBaru') {
      const items: SourceItem[] = total.piutang.piutangBaruIds
        .map((id) => (data.piutangs || []).find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => !!p)
        .map((p) => ({
          id: p.id,
          title: p.debtorName,
          subtitle: p.note || 'Piutang Baru',
          amount: p.amount,
          date: p.date,
          type: 'piutang'
        }));

      setSourceModal({
        isOpen: true,
        title: 'Sumber Piutang Baru',
        subtitle: `${monthName} ${year}`,
        items
      });
    } else if (sourceType === 'dikembalikan') {
      const items: SourceItem[] = total.piutang.dikembalikanPiutangIds
        .map((id) => (data.piutangs || []).find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => !!p)
        .map((p) => ({
          id: p.id,
          title: p.debtorName,
          subtitle: p.note || 'Pengembalian Piutang',
          amount: p.amount,
          date: p.collectedAt || p.date,
          type: 'piutang',
          isEstimated: !p.collectedAt
        }));

      setSourceModal({
        isOpen: true,
        title: 'Sumber Pengembalian Piutang',
        subtitle: `${monthName} ${year}`,
        items
      });
    }
  };

  const openSourceForTagihan = () => {
    const expenses: SourceItem[] = total.expenseTxIds
      .map((id) => data.transactions.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({
        id: t.id,
        title: t.description,
        subtitle: data.cards.find((c) => c.id === t.cardId)?.name,
        amount: t.amount,
        date: t.date,
        type: 'expense',
        tag: t.owner === 'BUSINESS' ? 'Bisnis' : t.owner === 'SPLIT' ? 'Split' : 'Pribadi'
      }));

    const installments: SourceItem[] = total.installmentIds
      .map((id) => data.installments.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => !!i)
      .map((i) => ({
        id: i.id,
        title: `Cicilan: ${i.name}`,
        subtitle: data.cards.find((c) => c.id === i.cardId)?.name,
        amount: i.monthlyAmount,
        date: i.startDate,
        type: 'installment',
        tag: 'Cicilan'
      }));

    setSourceModal({
      isOpen: true,
      title: 'Sumber Tagihan Bulan Ini',
      subtitle: `${monthName} ${year} • Total ${formatIDR(total.tagihan)}`,
      items: [...expenses, ...installments]
    });
  };

  const openSourceForDibayar = () => {
    const payments: SourceItem[] = total.paymentTxIds
      .map((id) => data.transactions.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({
        id: t.id,
        title: t.description || 'Pembayaran Tagihan',
        subtitle: data.cards.find((c) => c.id === t.cardId)?.name,
        amount: t.amount,
        date: t.date,
        type: 'payment'
      }));

    setSourceModal({
      isOpen: true,
      title: 'Sumber Pembayaran Bulan Ini',
      subtitle: `${monthName} ${year} • Total ${formatIDR(total.dibayar)}`,
      items: payments
    });
  };

  // Month status badge
  let monthBadge: React.ReactNode;
  switch (status.type) {
    case 'LUNAS':
      monthBadge = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 size={13} /> Lunas
        </span>
      );
      break;
    case 'TERTUTUP':
      monthBadge = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
          <ShieldCheck size={13} /> Tertutup tabungan/piutang
        </span>
      );
      break;
    case 'KURANG':
      monthBadge = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
          <AlertCircle size={13} /> Kurang {showAmounts ? formatIDR(status.kurangBersih) : '••'}
        </span>
      );
      break;
    case 'MENDATANG':
      monthBadge = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-blue-50/70 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
          <Clock size={13} /> Mendatang{status.subLabel ? ` • ${status.subLabel}` : ''}
        </span>
      );
      break;
    case 'KOSONG':
    default:
      monthBadge = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
          <Clock size={13} /> Belum ada tagihan
        </span>
      );
      break;
  }

  return (
    <div className="space-y-6">
      {/* Month Pager ‹ Januari 2026 › */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Bulan Sebelumnya"
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="text-center">
          <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {monthName} {year}
          </h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Detail Anggaran Bulanan
          </span>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Bulan Berikutnya"
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Ringkasan Bulan Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-5 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
              {month + 1}
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100">
              Ringkasan {monthName} {year}
            </h3>
          </div>

          <div>{monthBadge}</div>
        </div>

        {/* 4 Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Tagihan */}
          <button
            type="button"
            onClick={openSourceForTagihan}
            className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/40 text-left transition cursor-pointer group"
          >
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
              Tagihan
              <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition" />
            </span>
            <p className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
              {showAmounts ? formatIDR(total.tagihan) : '••••••••'}
            </p>
          </button>

          {/* Dibayar */}
          <button
            type="button"
            onClick={openSourceForDibayar}
            className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/40 text-left transition cursor-pointer group"
          >
            <span className="text-xs font-black uppercase text-emerald-500 tracking-wider flex items-center justify-between">
              Dibayar
              <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition" />
            </span>
            <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {showAmounts ? formatIDR(total.dibayar) : '••••••••'}
            </p>
          </button>

          {/* Kurang Kotor */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/40">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
              Kurang (Kotor)
            </span>
            <p className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 mt-1">
              {showAmounts ? formatIDR(total.kurang) : '••••••••'}
            </p>
          </div>

          {/* Kurang Bersih */}
          <div className="p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20">
            <span className="text-xs font-black uppercase text-rose-500 tracking-wider block">
              Kurang Bersih
            </span>
            <p className="text-base sm:text-lg font-black text-rose-500 mt-1">
              {showAmounts ? formatIDR(total.kurangBersih) : '••••••••'}
            </p>
          </div>
        </div>

        {/* Tabungan & Piutang disiapkan bulan ini */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex justify-between items-center text-xs">
            <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
              Tabungan untuk Tagihan Bulan Ini:
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
              {showAmounts ? formatIDR(total.tabungan.untukTagihan) : '••••'}
            </span>
          </div>

          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex justify-between items-center text-xs">
            <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
              Piutang untuk Tagihan Bulan Ini:
            </span>
            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
              {showAmounts ? formatIDR(total.piutang.untukTagihan) : '••••'}
            </span>
          </div>
        </div>

        {/* Pribadi / Bisnis Split Bar */}
        {total.tagihan > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-blue-500">Pribadi {personalPct}% ({showAmounts ? formatIDR(total.pribadi) : '••'})</span>
              <span className="text-amber-500">Bisnis {businessPct}% ({showAmounts ? formatIDR(total.bisnis) : '••'})</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${personalPct}%` }}
              />
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${businessPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* DUA MINI-LEDGER (Tabungan & Piutang) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LedgerCard
          type="tabungan"
          title="Buku Pembantu Tabungan"
          saldoAwal={total.tabungan.saldoAwal}
          masuk={total.tabungan.setoran}
          keluar={total.tabungan.dipakai}
          saldoAkhir={total.tabungan.saldoAkhir}
          isEstimated={total.tabungan.dipakaiEstimated}
          showAmounts={showAmounts}
          onOpenSourceMasuk={() => openSourceForLedger('setoran')}
          onOpenSourceKeluar={() => openSourceForLedger('dipakai')}
        />

        <LedgerCard
          type="piutang"
          title="Buku Pembantu Piutang"
          saldoAwal={total.piutang.sisaAwal}
          masuk={total.piutang.piutangBaru}
          keluar={total.piutang.dikembalikan}
          saldoAkhir={total.piutang.sisaBerjalan}
          isEstimated={total.piutang.dikembalikanEstimated}
          showAmounts={showAmounts}
          onOpenSourceMasuk={() => openSourceForLedger('piutangBaru')}
          onOpenSourceKeluar={() => openSourceForLedger('dikembalikan')}
        />
      </div>

      {/* Rincian per Kartu */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-5 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100">
              Rincian per Kartu
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Pilih kartu untuk melihat rincian terperinci & transaksi sumber
            </p>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            {cards.length} entitas
          </span>
        </div>

        <div className="space-y-3">
          {cards.map((c) => {
            const cardStatus = getCardStatus(c, year, month);

            let cardBadge: React.ReactNode;
            switch (cardStatus.type) {
              case 'LUNAS':
                cardBadge = (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 size={12} className="shrink-0" /> Lunas
                  </span>
                );
                break;
              case 'TERTUTUP':
                cardBadge = (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
                    <ShieldCheck size={12} className="shrink-0" /> Tertutup
                  </span>
                );
                break;
              case 'KURANG':
                cardBadge = (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                    <AlertCircle size={12} className="shrink-0" /> Kurang {showAmounts ? formatIDR(cardStatus.kurangBersih) : '••'}
                  </span>
                );
                break;
              case 'MENDATANG':
                cardBadge = (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50/70 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
                    <Clock size={12} className="shrink-0" /> Mendatang{cardStatus.subLabel ? ` (${cardStatus.subLabel})` : ''}
                  </span>
                );
                break;
              case 'KOSONG':
              default:
                cardBadge = (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                    <Clock size={12} className="shrink-0" /> Rp 0
                  </span>
                );
                break;
            }

            return (
              <div
                key={c.cardId}
                onClick={() => onSelectCard(c.cardId)}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/50 transition cursor-pointer flex justify-between items-center gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${c.cardColor}`} />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">
                      {c.cardName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {c.dueDay ? `Jatuh tempo tgl ${c.dueDay}` : c.isUnlinked ? 'Alokasi bebas' : 'Hutang'} • Tab: {showAmounts ? formatIDR(c.tabungan.untukTagihan) : '••'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-semibold">
                      Tagihan
                    </span>
                    <span className="font-black text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      {showAmounts ? formatIDR(c.tagihan) : '••••'}
                    </span>
                  </div>

                  <div>{cardBadge}</div>

                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Modal */}
      <SourceList
        isOpen={sourceModal.isOpen}
        onClose={() => setSourceModal((prev) => ({ ...prev, isOpen: false }))}
        title={sourceModal.title}
        subtitle={sourceModal.subtitle}
        items={sourceModal.items}
      />
    </div>
  );
};
