import React, { useState } from 'react';
import { AppState } from '../../types';
import { CardMonthReport, getCardStatus } from '../../lib/yearlyReport';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { SourceList, SourceItem } from './SourceList';
import { CardSummaryTab } from './CardSummaryTab';
import { CardSavingsTab } from './CardSavingsTab';
import { CardPiutangTab } from './CardPiutangTab';
import { CardOwnerTab } from './CardOwnerTab';
import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Clock
} from 'lucide-react';

interface CardDetailProps {
  data: AppState;
  year: number;
  month: number;
  cardReport: CardMonthReport;
  showAmounts?: boolean;
  onBackToMonth?: () => void;
}

type CardTab = 'RINGKASAN' | 'SAVINGS' | 'PIUTANG' | 'OWNER';

export const CardDetail: React.FC<CardDetailProps> = ({
  data,
  year,
  month,
  cardReport,
  showAmounts = true
}) => {
  const [activeTab, setActiveTab] = useState<CardTab>('RINGKASAN');
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

  const monthName = MONTH_NAMES[month];
  const status = getCardStatus(cardReport, year, month);

  // Filter actual transactions for this card that fall into this billing period
  const cardTransactions = data.transactions
    .filter((t) => cardReport.expenseTxIds.includes(t.id) || cardReport.paymentTxIds.includes(t.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Tracing Handlers
  const openSourceForTagihan = () => {
    const expenses: SourceItem[] = cardReport.expenseTxIds
      .map((id) => data.transactions.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({
        id: t.id,
        title: t.description,
        amount: t.amount,
        date: t.date,
        type: 'expense',
        tag: t.owner === 'BUSINESS' ? 'Bisnis' : t.owner === 'SPLIT' ? 'Split' : 'Pribadi'
      }));

    const installments: SourceItem[] = cardReport.installmentIds
      .map((id) => data.installments.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => !!i)
      .map((i) => ({
        id: i.id,
        title: `Cicilan: ${i.name}`,
        amount: i.monthlyAmount,
        date: i.startDate,
        type: 'installment',
        tag: 'Cicilan'
      }));

    setSourceModal({
      isOpen: true,
      title: `Rincian Tagihan ${cardReport.cardName}`,
      subtitle: `${monthName} ${year} • Total ${formatIDR(cardReport.tagihan)}`,
      items: [...expenses, ...installments]
    });
  };

  const openSourceForDibayar = () => {
    const payments: SourceItem[] = cardReport.paymentTxIds
      .map((id) => data.transactions.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({
        id: t.id,
        title: t.description || 'Pembayaran Tagihan',
        amount: t.amount,
        date: t.date,
        type: 'payment'
      }));

    setSourceModal({
      isOpen: true,
      title: `Pembayaran ${cardReport.cardName}`,
      subtitle: `${monthName} ${year} • Total ${formatIDR(cardReport.dibayar)}`,
      items: payments
    });
  };

  const openSourceForTabungan = () => {
    const items: SourceItem[] = cardReport.tabungan.untukTagihanSavingIds
      .map((id) => data.savings.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map((s) => ({
        id: s.id,
        title: s.note || 'Tabungan Disiapkan',
        amount: s.amount,
        date: s.date,
        type: 'saving'
      }));

    setSourceModal({
      isOpen: true,
      title: `Tabungan Disiapkan untuk ${cardReport.cardName}`,
      subtitle: `${monthName} ${year} • Total ${formatIDR(cardReport.tabungan.untukTagihan)}`,
      items
    });
  };

  const openSourceForPiutang = () => {
    const items: SourceItem[] = cardReport.piutang.untukTagihanPiutangIds
      .map((id) => (data.piutangs || []).find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({
        id: p.id,
        title: p.debtorName,
        subtitle: p.note,
        amount: p.amount,
        date: p.date,
        type: 'piutang'
      }));

    setSourceModal({
      isOpen: true,
      title: `Piutang Tertuju untuk ${cardReport.cardName}`,
      subtitle: `${monthName} ${year} • Total ${formatIDR(cardReport.piutang.untukTagihan)}`,
      items
    });
  };

  const openSourceForPribadi = () => {
    const txs: SourceItem[] = cardReport.personalTxIds
      .map((id) => data.transactions.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({
        id: t.id,
        title: t.description,
        amount: t.owner === 'SPLIT' && t.splitAmounts ? t.splitAmounts.personal : t.amount,
        date: t.date,
        type: 'expense',
        tag: 'Pribadi'
      }));

    const insts: SourceItem[] = cardReport.personalInstallmentIds
      .map((id) => data.installments.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => !!i)
      .map((i) => ({
        id: i.id,
        title: `Cicilan: ${i.name}`,
        amount: i.owner === 'SPLIT' && i.splitAmounts ? i.splitAmounts.personal : i.monthlyAmount,
        date: i.startDate,
        type: 'installment',
        tag: 'Pribadi'
      }));

    setSourceModal({
      isOpen: true,
      title: `Alokasi Pribadi ${cardReport.cardName}`,
      subtitle: `${monthName} ${year} • Total ${formatIDR(cardReport.pribadi)}`,
      items: [...txs, ...insts]
    });
  };

  const openSourceForBisnis = () => {
    const txs: SourceItem[] = cardReport.businessTxIds
      .map((id) => data.transactions.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({
        id: t.id,
        title: t.description,
        amount: t.owner === 'SPLIT' && t.splitAmounts ? t.splitAmounts.business : t.amount,
        date: t.date,
        type: 'expense',
        tag: 'Bisnis'
      }));

    const insts: SourceItem[] = cardReport.businessInstallmentIds
      .map((id) => data.installments.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => !!i)
      .map((i) => ({
        id: i.id,
        title: `Cicilan: ${i.name}`,
        amount: i.owner === 'SPLIT' && i.splitAmounts ? i.splitAmounts.business : i.monthlyAmount,
        date: i.startDate,
        type: 'installment',
        tag: 'Bisnis'
      }));

    setSourceModal({
      isOpen: true,
      title: `Alokasi Bisnis ${cardReport.cardName}`,
      subtitle: `${monthName} ${year} • Total ${formatIDR(cardReport.bisnis)}`,
      items: [...txs, ...insts]
    });
  };

  // Status Badge Rendering
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
          <span>Tertutup tabungan/piutang</span>
        </>
      );
      break;
    case 'KURANG':
      badgeClasses =
        'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60';
      badgeContent = (
        <>
          <AlertCircle size={13} className="shrink-0" />
          <span>Kurang {showAmounts ? formatIDR(status.kurangBersih) : '••••'}</span>
        </>
      );
      break;
    case 'MENDATANG':
      badgeClasses =
        'bg-blue-50/70 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50';
      badgeContent = (
        <>
          <Calendar size={13} className="shrink-0" />
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
    <div className="space-y-6">
      {/* Card Header & Status */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-5 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-5 h-5 rounded-full shrink-0 shadow-xs ${cardReport.cardColor}`} />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100 truncate">
                {cardReport.cardName}
              </h2>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                {cardReport.dueDay
                  ? `Jatuh tempo: ${cardReport.dueDay} ${monthName} ${year}`
                  : cardReport.isUnlinked
                  ? 'Kategori Tanpa Kartu (Bebas)'
                  : 'Hutang / Pinjaman'}
              </p>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${badgeClasses}`}
            >
              {badgeContent}
            </span>
          </div>
        </div>

        {/* 3 Angka Utama (Tagihan, Dibayar, Sisa) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={openSourceForTagihan}
            className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/40 text-left transition cursor-pointer group"
          >
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
              Tagihan
              <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition" />
            </span>
            <p className="text-sm sm:text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {showAmounts ? formatIDR(cardReport.tagihan) : '••••'}
            </p>
          </button>

          <button
            type="button"
            onClick={openSourceForDibayar}
            className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/40 text-left transition cursor-pointer group"
          >
            <span className="text-xs font-black uppercase text-emerald-500 tracking-wider flex items-center justify-between">
              Dibayar
              <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition" />
            </span>
            <p className="text-sm sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {showAmounts ? formatIDR(cardReport.dibayar) : '••••'}
            </p>
          </button>

          <div className="p-3 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-left">
            <span className="text-xs font-black uppercase text-rose-500 tracking-wider block">
              Sisa Tagihan
            </span>
            <p className="text-sm sm:text-xl font-black text-rose-500 mt-1">
              {showAmounts ? formatIDR(cardReport.kurang) : '••••'}
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Scrolling Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'RINGKASAN', label: 'Ringkasan' },
          { id: 'SAVINGS', label: 'Tabungan' },
          { id: 'PIUTANG', label: 'Piutang' },
          { id: 'OWNER', label: 'Pribadi / Bisnis' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as CardTab)}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Modular Tab Content */}
      {activeTab === 'RINGKASAN' && (
        <CardSummaryTab
          cardReport={cardReport}
          cardTransactions={cardTransactions}
          monthName={monthName}
          year={year}
          showAmounts={showAmounts}
          openSourceForTabungan={openSourceForTabungan}
          openSourceForPiutang={openSourceForPiutang}
          openSourceForPribadi={openSourceForPribadi}
          openSourceForBisnis={openSourceForBisnis}
        />
      )}

      {activeTab === 'SAVINGS' && (
        <CardSavingsTab
          cardReport={cardReport}
          showAmounts={showAmounts}
          openSourceForTabungan={openSourceForTabungan}
        />
      )}

      {activeTab === 'PIUTANG' && (
        <CardPiutangTab
          cardReport={cardReport}
          showAmounts={showAmounts}
          openSourceForPiutang={openSourceForPiutang}
        />
      )}

      {activeTab === 'OWNER' && (
        <CardOwnerTab
          cardReport={cardReport}
          showAmounts={showAmounts}
          openSourceForPribadi={openSourceForPribadi}
          openSourceForBisnis={openSourceForBisnis}
        />
      )}

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
