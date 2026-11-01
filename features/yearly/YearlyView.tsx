import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { AppState, CreditCard } from '../../types';
import { buildMonthReport, buildYearReport } from '../../lib/yearlyReport';
import { YearStrip } from './YearStrip';
import { YearRecap } from './YearRecap';
import { MonthDetail } from './MonthDetail';
import { CardDetail } from './CardDetail';
import { MONTH_NAMES } from '../../lib/constants';
import { ChevronLeft } from 'lucide-react';

interface YearlyViewProps {
  data: AppState;
  showAmounts: boolean;
  onOpenStatement?: (card: CreditCard, month: number, year: number) => void;
}

export const YearlyView: React.FC<YearlyViewProps> = ({
  data,
  showAmounts
}) => {
  const navigate = useNavigate();
  const { year: routeYear, month: routeMonth, cardId: routeCardId } = useParams<{
    year?: string;
    month?: string;
    cardId?: string;
  }>();

  // Active Main Tab on /yearly ("Bulan" vs "Rekap Tahun")
  const [activeMainTab, setActiveMainTab] = useState<'BULAN' | 'REKAP'>('BULAN');

  const currentSystemYear = new Date().getFullYear();
  const currentSystemMonth = new Date().getMonth(); // 0-based: 0..11

  // Compute available years from actual data + current year
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentSystemYear]);
    (data.transactions || []).forEach((t) => {
      if (t.date) yearsSet.add(new Date(t.date).getFullYear());
      if (t.targetPeriod) yearsSet.add(t.targetPeriod.year);
    });
    (data.installments || []).forEach((i) => {
      if (i.startDate) yearsSet.add(new Date(i.startDate).getFullYear());
    });
    (data.savings || []).forEach((s) => {
      if (s.date) yearsSet.add(new Date(s.date).getFullYear());
      if (s.targetPeriod) yearsSet.add(s.targetPeriod.year);
    });
    (data.piutangs || []).forEach((p) => {
      if (p.date) yearsSet.add(new Date(p.date).getFullYear());
      if (p.targetPeriod) yearsSet.add(p.targetPeriod.year);
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [data, currentSystemYear]);

  // Validate route parameters (1-based month: 1..12)
  const parsedRouteYear = routeYear !== undefined ? parseInt(routeYear, 10) : undefined;
  const isYearParamPresent = routeYear !== undefined;
  const isYearValid = parsedRouteYear !== undefined && !isNaN(parsedRouteYear);

  const parsedRouteMonth = routeMonth !== undefined ? parseInt(routeMonth, 10) : undefined;
  const isMonthParamPresent = routeMonth !== undefined;
  const isMonthValid =
    parsedRouteMonth !== undefined && !isNaN(parsedRouteMonth) && parsedRouteMonth >= 1 && parsedRouteMonth <= 12;

  // If year is in route but invalid -> redirect to /yearly
  if (isYearParamPresent && !isYearValid) {
    return <Navigate to="/yearly" replace />;
  }

  // If month is in route but invalid (NaN, < 1, or > 12) -> redirect to /yearly
  if (isMonthParamPresent && !isMonthValid) {
    return <Navigate to="/yearly" replace />;
  }

  const [selectedYearState, setSelectedYearState] = useState<number>(
    isYearValid ? parsedRouteYear! : currentSystemYear
  );

  const activeYear = isYearValid ? parsedRouteYear! : selectedYearState;
  // Convert 1-based route month to 0-based month index (0..11) for data calculation
  const activeMonthIndex = isMonthValid ? parsedRouteMonth! - 1 : currentSystemMonth;

  // Build pure reports from lib/yearlyReport.ts
  const yearReport = useMemo(() => {
    return buildYearReport(data, activeYear);
  }, [data, activeYear]);

  const monthReport = useMemo(() => {
    return buildMonthReport(data, activeYear, activeMonthIndex);
  }, [data, activeYear, activeMonthIndex]);

  const cardReport = useMemo(() => {
    if (!routeCardId) return undefined;
    return monthReport.cards.find((c) => c.cardId === routeCardId);
  }, [monthReport, routeCardId]);

  // If cardId is present but not found in this month's report -> redirect to month level
  if (isYearParamPresent && isMonthParamPresent && routeCardId !== undefined && !cardReport) {
    return <Navigate to={`/yearly/${activeYear}/${parsedRouteMonth}`} replace />;
  }

  // Pager navigation for MonthDetail (1-based route months)
  const handlePrevMonth = () => {
    if (activeMonthIndex === 0) {
      const prevYear = activeYear - 1;
      navigate(`/yearly/${prevYear}/12`);
    } else {
      navigate(`/yearly/${activeYear}/${activeMonthIndex}`);
    }
  };

  const handleNextMonth = () => {
    if (activeMonthIndex === 11) {
      const nextYear = activeYear + 1;
      navigate(`/yearly/${nextYear}/1`);
    } else {
      navigate(`/yearly/${activeYear}/${activeMonthIndex + 2}`);
    }
  };

  // SCREEN 3: Detail Kartu (/yearly/:year/:month/:cardId)
  if (isYearParamPresent && isMonthParamPresent && routeCardId && cardReport) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-6 animate-in fade-in pb-28">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/yearly/${activeYear}/${parsedRouteMonth}`)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Detail Kartu – {MONTH_NAMES[activeMonthIndex]} {activeYear}
            </h1>
            <p className="text-xs text-slate-400 font-semibold">{cardReport.cardName}</p>
          </div>
        </div>

        <CardDetail
          data={data}
          year={activeYear}
          month={activeMonthIndex}
          cardReport={cardReport}
          showAmounts={showAmounts}
          onBackToMonth={() => navigate(`/yearly/${activeYear}/${parsedRouteMonth}`)}
        />
      </div>
    );
  }

  // SCREEN 2: Detail Bulan (/yearly/:year/:month)
  if (isYearParamPresent && isMonthParamPresent) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-6 animate-in fade-in pb-28">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/yearly')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Detail Anggaran Bulan
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              {MONTH_NAMES[activeMonthIndex]} {activeYear}
            </p>
          </div>
        </div>

        <MonthDetail
          data={data}
          year={activeYear}
          month={activeMonthIndex}
          monthReport={monthReport}
          showAmounts={showAmounts}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectCard={(cardId) => navigate(`/yearly/${activeYear}/${parsedRouteMonth}/${cardId}`)}
        />
      </div>
    );
  }

  // SCREEN 1: Anggaran Tahunan (/yearly)
  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-4 sm:py-6 space-y-6 animate-in fade-in pb-28">
      {/* Top Header & Year Chips */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Anggaran Tahunan
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Pilih bulan untuk melihat rincian pengeluaran & ketersediaan tabungan
          </p>
        </div>

        {/* Year Chips */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {availableYears.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setSelectedYearState(y)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer min-h-[40px] whitespace-nowrap ${
                activeYear === y
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Segmented Tab: "Bulan" vs "Rekap Tahun" */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm">
        <button
          type="button"
          onClick={() => setActiveMainTab('BULAN')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer min-h-[44px] ${
            activeMainTab === 'BULAN'
              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Ringkasan Bulan
        </button>
        <button
          type="button"
          onClick={() => setActiveMainTab('REKAP')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer min-h-[44px] ${
            activeMainTab === 'REKAP'
              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Rekap Tahun {activeYear}
        </button>
      </div>

      {/* Tab Content */}
      {activeMainTab === 'BULAN' ? (
        <YearStrip
          year={activeYear}
          months={yearReport.months}
          showAmounts={showAmounts}
          onSelectMonth={(monthIdx) => navigate(`/yearly/${activeYear}/${monthIdx + 1}`)}
        />
      ) : (
        <YearRecap
          year={activeYear}
          report={yearReport}
          showAmounts={showAmounts}
          onSelectCard={(cardId) => {
            // Navigate to current month's card detail (1-based: currentSystemMonth + 1)
            navigate(`/yearly/${activeYear}/${currentSystemMonth + 1}/${cardId}`);
          }}
        />
      )}
    </div>
  );
};
