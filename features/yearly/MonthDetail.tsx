import React, { useState, useMemo } from 'react';
import { AppState } from '../../types';
import { MonthReport, getMonthStatus, getCardStatus } from '../../lib/yearlyReport';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { SourceList, SourceItem } from './SourceList';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  Users,
  PiggyBank,
  Target,
  User,
  Briefcase
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

// Brand Logo badge component for cards
const CardBrandLogo: React.FC<{ cardName: string; cardColor?: string }> = ({ cardName, cardColor = 'bg-blue-500' }) => {
  const nameUpper = cardName.toUpperCase();

  if (nameUpper.includes('TRAVELOKA')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-sky-500 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
        ✈️
      </div>
    );
  }
  if (nameUpper.includes('BCA')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-700 text-white font-black flex items-center justify-center text-[10px] tracking-tighter shadow-xs shrink-0 px-1">
        BCA
      </div>
    );
  }
  if (nameUpper.includes('MANDIRI')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[9px] tracking-tighter shadow-xs shrink-0 px-1">
        mandırı
      </div>
    );
  }
  if (nameUpper.includes('CITI')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-sky-900 text-white font-black flex items-center justify-center text-[11px] tracking-tighter shadow-xs shrink-0 px-1 border border-sky-600/30">
        citi
      </div>
    );
  }
  if (nameUpper.includes('BNI')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-[10px] tracking-tighter shadow-xs shrink-0 px-1">
        BNI
      </div>
    );
  }
  if (nameUpper.includes('BRI')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-[10px] tracking-tighter shadow-xs shrink-0 px-1">
        BRI
      </div>
    );
  }

  // Fallback brand logo badge using card color
  return (
    <div className={`w-10 h-10 rounded-xl ${cardColor} text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0`}>
      <CreditCard size={20} />
    </div>
  );
};

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

  // Hide Lunas cards by default (ON)
  const [hideLunasCards, setHideLunasCards] = useState<boolean>(true);
  // Sort cards option: Total Hutang ('TAGIHAN'), Sisa Kekurangan ('SISA'), Nama Kartu ('NAME')
  const [sortBy, setSortBy] = useState<'TAGIHAN' | 'SISA' | 'NAME'>('TAGIHAN');

  const { total, cards } = monthReport;

  const lunasCardsCount = useMemo(() => {
    return cards.filter((c) => getCardStatus(c, year, month).type === 'LUNAS').length;
  }, [cards, year, month]);

  const displayedCards = useMemo(() => {
    let list = cards;
    if (hideLunasCards) {
      list = cards.filter((c) => getCardStatus(c, year, month).type !== 'LUNAS');
    }
    const copy = [...list];
    if (sortBy === 'TAGIHAN') {
      return copy.sort((a, b) => b.tagihan - a.tagihan);
    } else if (sortBy === 'SISA') {
      return copy.sort((a, b) => b.kurangBersih - a.kurangBersih);
    } else if (sortBy === 'NAME') {
      return copy.sort((a, b) => a.cardName.localeCompare(b.cardName));
    }
    return copy;
  }, [cards, hideLunasCards, sortBy, year, month]);

  const status = getMonthStatus(monthReport);
  const monthName = MONTH_NAMES[month];

  // Pribadi / Bisnis percentages
  const tagihanBase = total.tagihan > 0 ? total.tagihan : 1;
  const personalPct = Math.round((total.pribadi / tagihanBase) * 100);
  const businessPct = Math.max(0, 100 - personalPct);

  // Month status badge
  let monthBadge: React.ReactNode;
  switch (status.type) {
    case 'LUNAS':
      monthBadge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0">
          <CheckCircle2 size={12} />
          <span>Lunas</span>
        </span>
      );
      break;
    case 'TERTUTUP':
      monthBadge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-sky-500/15 text-sky-400 border border-sky-500/30 whitespace-nowrap shrink-0">
          <ShieldCheck size={12} />
          <span>Tertutup</span>
        </span>
      );
      break;
    case 'KURANG':
      monthBadge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap shrink-0">
          <AlertCircle size={12} />
          <span>Belum Lunas</span>
        </span>
      );
      break;
    case 'MENDATANG':
      monthBadge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/30 whitespace-nowrap shrink-0">
          <Clock size={12} />
          <span>Mendatang{status.subLabel ? ` (${status.subLabel})` : ''}</span>
        </span>
      );
      break;
    case 'KOSONG':
    default:
      monthBadge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap shrink-0">
          <Clock size={12} />
          <span>Belum ada tagihan</span>
        </span>
      );
      break;
  }

  // Collapsible top card state (default false = diciutkan)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* Month Navigation Pager ‹ November 2026 › */}
      <div className="flex items-center justify-between bg-slate-900/90 dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Bulan Sebelumnya"
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            {monthName} {year}
          </h2>
          <span className="text-[11px] font-bold text-slate-400 block">
            Detail Anggaran Bulanan
          </span>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Bulan Berikutnya"
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 1. TOP MONTH SUMMARY CARD (Collapsible) */}
      <div className="bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-[28px] p-5 sm:p-6 shadow-xl space-y-4 transition-all">
        {/* Card Header (Clickable to toggle Collapse/Expand) */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between gap-3 cursor-pointer group select-none"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600/30 transition">
              <Calendar size={20} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-blue-400 transition">
                {monthName} {year}
              </h3>
              <div>{monthBadge}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* When collapsed, display compact Sisa Kekurangan summary */}
            {!isExpanded && (
              <div className="text-right px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] font-bold text-rose-300 block uppercase tracking-wider">
                  Sisa Kekurangan
                </span>
                <span className="text-xs sm:text-sm font-black text-rose-400">
                  {showAmounts ? formatIDR(total.kurangBersih) : '••••••••'}
                </span>
              </div>
            )}

            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="space-y-5 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
            {/* 4-Grid Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
              {/* Total Hutang */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-400">Total Hutang</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white tracking-tight">
                  {showAmounts ? formatIDR(total.tagihan) : '••••••••'}
                </p>
              </div>

              {/* Total Piutang */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-400">Total Piutang</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white tracking-tight">
                  {showAmounts ? formatIDR(total.piutang.piutangBelumKembali) : '••••••••'}
                </p>
              </div>

              {/* Total Tabungan */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <PiggyBank size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-400">Total Tabungan</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white tracking-tight">
                  {showAmounts ? formatIDR(total.tabungan.tabunganBelumTerpakai) : '••••••••'}
                </p>
              </div>

              {/* Sisa Kekurangan */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                total.kurangBersih === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    total.kurangBersih === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    <Target size={16} />
                  </div>
                  <span className={`text-xs font-bold ${total.kurangBersih === 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    Sisa Kekurangan
                  </span>
                </div>
                <p className={`text-base sm:text-lg font-black tracking-tight ${
                  total.kurangBersih === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {showAmounts ? formatIDR(total.kurangBersih) : '••••••••'}
                </p>
              </div>
            </div>

            {/* Breakdown Progress Bar (Pribadi vs Bisnis) */}
            {total.tagihan > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <User size={14} />
                    <span>
                      Pribadi {showAmounts ? formatIDR(total.pribadi) : '••'} ({personalPct}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Briefcase size={14} />
                    <span>
                      Bisnis {showAmounts ? formatIDR(total.bisnis) : '••'} ({businessPct}%)
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${personalPct}%` }}
                  />
                  <div
                    className="bg-purple-500 transition-all duration-500"
                    style={{ width: `${businessPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. RINCIAN PER KARTU SECTION */}
      <div className="space-y-4 pt-2">
        {/* Section Header with Sort Dropdown */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">Rincian Per Kartu</h3>
            {lunasCardsCount > 0 && hideLunasCards && (
              <p className="text-xs text-slate-400 font-medium">
                {lunasCardsCount} kartu Lunas disembunyikan
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lunasCardsCount > 0 && (
              <button
                type="button"
                onClick={() => setHideLunasCards(!hideLunasCards)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  hideLunasCards
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/60'
                }`}
              >
                {hideLunasCards ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{hideLunasCards ? 'Sembunyikan Lunas' : 'Tampilkan Semua'}</span>
              </button>
            )}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'TAGIHAN' | 'SISA' | 'NAME')}
              className="bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="TAGIHAN">Urut: Total Hutang</option>
              <option value="SISA">Urut: Sisa Kekurangan</option>
              <option value="NAME">Urut: Nama Kartu</option>
            </select>
          </div>
        </div>

        {/* Cards List Grid (1 card per row) */}
        {displayedCards.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-slate-900/80 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm sm:text-base">
                Semua Kartu Bulan Ini Sudah Lunas
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Kartu berstatus Lunas disembunyikan sesuai pengaturan default.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHideLunasCards(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-lg hover:bg-blue-500 transition cursor-pointer"
            >
              <Eye size={14} />
              <span>Tampilkan Kartu Lunas ({lunasCardsCount})</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {displayedCards.map((c) => {
              const cTagihanBase = c.tagihan > 0 ? c.tagihan : 1;
              const cPersonalPct = Math.round((c.pribadi / cTagihanBase) * 100);
              const cBusinessPct = Math.max(0, 100 - cPersonalPct);

              return (
                <div
                  key={c.cardId}
                  onClick={() => onSelectCard(c.cardId)}
                  className="p-4 sm:p-5 rounded-[22px] bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-3.5 group shadow-xs hover:shadow-md text-left"
                >
                  {/* Top Row: Brand Logo, Name, Subtitle, Chevron */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardBrandLogo cardName={c.cardName} cardColor={c.cardColor} />
                      <div>
                        <h4 className="font-extrabold text-base sm:text-lg text-white group-hover:text-blue-400 transition">
                          {c.cardName}
                        </h4>
                        <p className="text-xs font-semibold text-slate-400">
                          {c.isUnlinked ? 'Tanpa Kartu' : 'Kartu Kredit'}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition shrink-0">
                      <ChevronRight size={18} />
                    </div>
                  </div>

                  {/* Middle Row: 4 Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {/* Hutang */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
                        <CreditCard size={14} className="shrink-0 text-pink-400" />
                        <span>Hutang</span>
                      </div>
                      <p className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                        {showAmounts ? formatIDR(c.tagihan) : '••••••••'}
                      </p>
                    </div>

                    {/* Piutang */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
                        <Users size={14} className="shrink-0 text-purple-400" />
                        <span>Piutang</span>
                      </div>
                      <p className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                        {showAmounts ? formatIDR(c.piutang.piutangBelumKembali) : '••••••••'}
                      </p>
                    </div>

                    {/* Tabungan */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
                        <PiggyBank size={14} className="shrink-0 text-emerald-400" />
                        <span>Tabungan</span>
                      </div>
                      <p className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                        {showAmounts ? formatIDR(c.tabungan.tabunganBelumTerpakai) : '••••••••'}
                      </p>
                    </div>

                    {/* Sisa */}
                    <div className={`p-2.5 sm:p-3 rounded-xl border ${
                      c.kurangBersih === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
                        <Target size={14} className={`shrink-0 ${c.kurangBersih === 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                        <span>Sisa</span>
                      </div>
                      <p className={`font-black text-xs sm:text-sm tracking-tight truncate ${
                        c.kurangBersih === 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {showAmounts ? formatIDR(c.kurangBersih) : '••••••••'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Pribadi & Bisnis Breakdown */}
                  {c.tagihan > 0 && (
                    <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-800/80 text-slate-300 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <User size={13} />
                        <span>
                          Pribadi: {showAmounts ? formatIDR(c.pribadi) : '••'} ({cPersonalPct}%)
                        </span>
                      </div>
                      <div className="text-slate-700 hidden sm:inline">|</div>
                      <div className="flex items-center gap-1.5 text-purple-400">
                        <Briefcase size={13} />
                        <span>
                          Bisnis: {showAmounts ? formatIDR(c.bisnis) : '••'} ({cBusinessPct}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
