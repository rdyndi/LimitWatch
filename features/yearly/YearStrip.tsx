import React, { useState, useMemo } from 'react';
import { MonthReport, getMonthStatus } from '../../lib/yearlyReport';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import {
  Calendar,
  CreditCard,
  Users,
  PiggyBank,
  Target,
  User,
  Briefcase,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

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

  // Default hide Lunas months (ON by default as requested by user)
  const [hideLunas, setHideLunas] = useState<boolean>(true);

  const lunasCount = useMemo(() => {
    return months.filter((m) => getMonthStatus(m, currentDate).type === 'LUNAS').length;
  }, [months, currentDate]);

  const displayedMonths = useMemo(() => {
    if (!hideLunas) return months;
    return months.filter((m) => getMonthStatus(m, currentDate).type !== 'LUNAS');
  }, [months, hideLunas, currentDate]);

  const yearTotals = useMemo(() => {
    const totalTagihan = months.reduce((sum, m) => sum + (m.total?.tagihan || 0), 0);
    const totalDibayar = months.reduce((sum, m) => sum + (m.total?.dibayar || 0), 0);
    const sisaHutang = months.reduce((sum, m) => sum + (m.total?.kurang || 0), 0);
    const totalTabungan = months.reduce(
      (sum, m) => sum + (m.total?.tabungan?.tabunganBelumTerpakai || 0),
      0
    );
    const totalPiutang = months.reduce(
      (sum, m) => sum + (m.total?.piutang?.piutangBelumKembali || 0),
      0
    );
    const totalKurang = months.reduce((sum, m) => sum + (m.total?.kurangBersih || 0), 0);
    const totalPribadi = months.reduce((sum, m) => sum + (m.total?.pribadi || 0), 0);
    const totalBisnis = months.reduce((sum, m) => sum + (m.total?.bisnis || 0), 0);

    const tagihanBase = totalTagihan > 0 ? totalTagihan : 1;
    const personalPct = Math.min(100, Math.max(0, Math.round((totalPribadi / tagihanBase) * 100)));
    const businessPct = Math.max(0, 100 - personalPct);

    let statusType = 'LUNAS';
    if (totalTagihan === 0) {
      statusType = 'KOSONG';
    } else if (totalKurang > 0) {
      statusType = 'KURANG';
    }

    return {
      totalTagihan,
      totalDibayar,
      sisaHutang,
      totalPiutang,
      totalTabungan,
      totalKurang,
      totalPribadi,
      totalBisnis,
      personalPct,
      businessPct,
      statusType
    };
  }, [months]);

  // Helper for rendering status pill badges
  const renderStatusBadge = (statusType: string, kurangBersih: number, subLabel?: string) => {
    switch (statusType) {
      case 'LUNAS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0">
            <CheckCircle2 size={12} />
            <span>Lunas</span>
          </span>
        );
      case 'TERTUTUP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-sky-500/15 text-sky-400 border border-sky-500/30 whitespace-nowrap shrink-0">
            <ShieldCheck size={12} />
            <span>Tertutup</span>
          </span>
        );
      case 'KURANG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap shrink-0">
            <AlertCircle size={12} />
            <span>Belum Lunas</span>
          </span>
        );
      case 'MENDATANG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/30 whitespace-nowrap shrink-0">
            <Clock size={12} />
            <span>Mendatang{subLabel ? ` (${subLabel})` : ''}</span>
          </span>
        );
      case 'KOSONG':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap shrink-0">
            <Clock size={12} />
            <span>Belum ada tagihan</span>
          </span>
        );
    }
  };

  // Collapsible top card state (default false = diciutkan)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* 1. TOP YEARLY SUMMARY CARD (Collapsible) */}
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
                Ringkasan Tahun {year}
              </h3>
              <div>
                {renderStatusBadge(
                  yearTotals.statusType,
                  yearTotals.totalKurang
                )}
              </div>
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
                  {showAmounts ? formatIDR(yearTotals.totalKurang) : '••••••••'}
                </span>
              </div>
            )}

            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
        </div>

        {/* Expanded Details Content */}
        {isExpanded && (
          <div className="space-y-5 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
            {/* 4-Grid Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
              {/* Sisa Hutang */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-400">Sisa Hutang</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white tracking-tight">
                  {showAmounts ? formatIDR(yearTotals.sisaHutang) : '••••••••'}
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
                  {showAmounts ? formatIDR(yearTotals.totalPiutang) : '••••••••'}
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
                  {showAmounts ? formatIDR(yearTotals.totalTabungan) : '••••••••'}
                </p>
              </div>

              {/* Sisa Kekurangan */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                yearTotals.totalKurang === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    yearTotals.totalKurang === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    <Target size={16} />
                  </div>
                  <span className={`text-xs font-bold ${yearTotals.totalKurang === 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    Sisa Kekurangan
                  </span>
                </div>
                <p className={`text-base sm:text-lg font-black tracking-tight ${
                  yearTotals.totalKurang === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {showAmounts ? formatIDR(yearTotals.totalKurang) : '••••••••'}
                </p>
              </div>
            </div>

            {/* Breakdown Progress Bar (Pribadi vs Bisnis) */}
            {yearTotals.totalTagihan > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <User size={14} />
                    <span>
                      Pribadi {showAmounts ? formatIDR(yearTotals.totalPribadi) : '••'} ({yearTotals.personalPct}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Briefcase size={14} />
                    <span>
                      Bisnis {showAmounts ? formatIDR(yearTotals.totalBisnis) : '••'} ({yearTotals.businessPct}%)
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${yearTotals.personalPct}%` }}
                  />
                  <div
                    className="bg-purple-500 transition-all duration-500"
                    style={{ width: `${yearTotals.businessPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. 12-MONTH CARDS SECTION HEADER WITH LUNAS TOGGLE */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h4 className="text-xs sm:text-sm font-black text-white">Daftar Bulan ({year})</h4>
          {lunasCount > 0 && hideLunas && (
            <p className="text-xs text-slate-400 font-medium">
              {lunasCount} bulan Lunas disembunyikan
            </p>
          )}
        </div>

        {lunasCount > 0 && (
          <button
            type="button"
            onClick={() => setHideLunas(!hideLunas)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              hideLunas
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/60'
            }`}
          >
            {hideLunas ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{hideLunas ? 'Sembunyikan Lunas' : 'Tampilkan Semua'}</span>
          </button>
        )}
      </div>

      {/* 12-MONTH CARDS GRID (1 card per row) */}
      {displayedMonths.length === 0 ? (
        <div className="p-8 rounded-[24px] bg-slate-900/80 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm sm:text-base">
              Semua Bulan Periode {year} Sudah Lunas
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Bulan berstatus Lunas disembunyikan sesuai pengaturan default.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHideLunas(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-lg hover:bg-blue-500 transition cursor-pointer"
          >
            <Eye size={14} />
            <span>Tampilkan Bulan Lunas ({lunasCount})</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {displayedMonths.map((m) => {
            const monthIdx = m.month;
            const monthName = MONTH_NAMES[monthIdx];
            const status = getMonthStatus(m, currentDate);

            const piutangVal = m.total.piutang.piutangBelumKembali;
            const tabunganVal = m.total.tabungan.tabunganBelumTerpakai;
            const sisaVal = m.total.kurangBersih;

            return (
              <div
                key={monthIdx}
                onClick={() => onSelectMonth(monthIdx)}
                className="p-4 sm:p-5 rounded-[22px] text-left transition-all cursor-pointer flex flex-col justify-between bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xs hover:shadow-md group space-y-3"
              >
                {/* Header: Year, Month Name, Status Badge & Chevron */}
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50">
                      {year}
                    </span>
                    <h4 className="font-black text-base sm:text-lg text-white group-hover:text-blue-400 transition">
                      {monthName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(status.type, status.kurangBersih, status.subLabel)}
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition shrink-0">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>

                {/* Stats Breakdown 4-Box Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {/* Sisa Hutang */}
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
                      <CreditCard size={14} className="shrink-0 text-pink-400" />
                      <span>Sisa Hutang</span>
                    </div>
                    <p className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                      {showAmounts ? formatIDR(m.total.kurang) : '••••••••'}
                    </p>
                  </div>

                  {/* Piutang */}
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
                      <Users size={14} className="shrink-0 text-purple-400" />
                      <span>Piutang</span>
                    </div>
                    <p className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                      {showAmounts ? formatIDR(piutangVal) : '••••••••'}
                    </p>
                  </div>

                  {/* Tabungan */}
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
                      <PiggyBank size={14} className="shrink-0 text-emerald-400" />
                      <span>Tabungan</span>
                    </div>
                    <p className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                      {showAmounts ? formatIDR(tabunganVal) : '••••••••'}
                    </p>
                  </div>

                  {/* Sisa */}
                  <div className={`p-3 rounded-xl border ${
                    sisaVal === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                  }`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
                      <Target size={14} className={`shrink-0 ${sisaVal === 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                      <span>Sisa</span>
                    </div>
                    <p className={`font-black text-xs sm:text-sm tracking-tight truncate ${
                      sisaVal === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {showAmounts ? formatIDR(sisaVal) : '••••••••'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

