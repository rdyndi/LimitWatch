import React, { useState, useMemo } from 'react';
import { AppState, CreditCard, Transaction, Installment, OwnerType, TransactionType } from '../../types';
import { CardMonthReport } from '../../lib/yearlyReport';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR, parseIDR } from '../../lib/format';
import { getBillingPeriod } from '../../lib/billing';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Calendar,
  CreditCard as CreditCardIcon,
  Users,
  PiggyBank,
  Target,
  User,
  Briefcase,
  Search,
  Filter,
  Check,
  CheckSquare,
  Square,
  ShoppingBag,
  Utensils,
  Plane,
  Car,
  Tv,
  Music,
  Receipt,
  Clock,
  X,
  FileText,
  Pencil,
  Plus,
  Sparkles
} from 'lucide-react';

interface CardDetailProps {
  data: AppState;
  year: number;
  month: number; // 0-based month (0..11)
  cardReport: CardMonthReport;
  showAmounts?: boolean;
  onBackToMonth?: () => void;
  onToggleTransactionValidation?: (id: string) => void;
  onToggleInstallmentValidation?: (instId: string, monthKey: string) => void;
  onEditTransaction?: (t: Transaction) => void;
  onOpenStatement?: (card: CreditCard, month: number, year: number) => void;
  onOpenQuickRecord?: (
    tab?: 'EXPENSE' | 'PAYMENT' | 'SAVING' | 'PIUTANG',
    prefill?: { cardId?: string; month?: number; year?: number; validated?: boolean }
  ) => void;
  saveData?: (data: AppState) => void;
}

type TabType = 'TRANSAKSI' | 'CICILAN';
type FilterType = 'ALL' | 'BUSINESS' | 'PERSONAL' | 'CHECKED' | 'UNCHECKED';

// Custom Brand Logo Helper
const CardBrandLogo: React.FC<{ cardName: string; logoUrl?: string; color?: string }> = ({
  cardName,
  logoUrl,
  color = 'bg-sky-500'
}) => {
  if (logoUrl) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-700/60">
        <img src={logoUrl} alt={cardName} className="w-full h-full object-contain" />
      </div>
    );
  }

  const lower = cardName.toLowerCase();

  // Traveloka
  if (lower.includes('traveloka')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#0194F3] flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
          <path d="M21.5 5.5c-.8.8-2.6 2.3-4.5 3.7-1.3-.9-3-1.4-4.8-1.2-3.1.3-5.5 2.8-5.8 5.9-.2 2.3.9 4.4 2.6 5.6-1.5-.7-2.7-1.8-3.4-3.3C4.8 14.7 5.2 13 6.3 11.8c.4-.4.8-.8 1.3-1.1-1.2.1-2.4.6-3.3 1.5-1.5 1.5-1.8 3.8-.9 5.7 1.1 2.3 3.3 3.9 5.8 4.1 3.5.3 6.7-1.9 7.6-5.2.4-1.5.2-3-.4-4.3 2.1-1.3 4.1-2.7 4.9-3.5.5-.5.4-1.3-.1-1.8-.6-.5-1.3-.4-1.8.1z" />
        </svg>
      </div>
    );
  }

  // BCA
  if (lower.includes('bca')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#005baa] flex items-center justify-center shrink-0 shadow-md">
        <span className="text-white font-black text-xs tracking-wider">BCA</span>
      </div>
    );
  }

  // Mandiri
  if (lower.includes('mandiri')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#002f6c] flex items-center justify-center shrink-0 shadow-md">
        <span className="text-[#f5a623] font-black text-[11px] tracking-tight">mandiri</span>
      </div>
    );
  }

  // BNI
  if (lower.includes('bni')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#f15a24] flex items-center justify-center shrink-0 shadow-md">
        <span className="text-white font-black text-xs tracking-wider">BNI</span>
      </div>
    );
  }

  // BRI
  if (lower.includes('bri')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#00529c] flex items-center justify-center shrink-0 shadow-md">
        <span className="text-white font-black text-xs tracking-wider">BRI</span>
      </div>
    );
  }

  // Citi
  if (lower.includes('citi')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#003b70] flex items-center justify-center shrink-0 shadow-md">
        <span className="text-white font-black text-xs tracking-wider">citi</span>
      </div>
    );
  }

  // Fallback to CreditCardIcon
  return (
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0 shadow-md`}>
      <CreditCardIcon size={24} className="text-white" />
    </div>
  );
};

// Merchant Icon Helper
const getMerchantIcon = (description: string, category?: string) => {
  const text = (description + ' ' + (category || '')).toLowerCase();

  if (text.includes('shopee')) {
    return {
      bg: 'bg-[#EE4D2D]',
      icon: <ShoppingBag size={18} className="text-white" />
    };
  }

  if (text.includes('gofood')) {
    return {
      bg: 'bg-[#ED2736]',
      icon: <Utensils size={18} className="text-white" />
    };
  }

  if (text.includes('gojek') || text.includes('goride') || text.includes('gocar')) {
    return {
      bg: 'bg-[#00AA13]',
      icon: (
        <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
      )
    };
  }

  if (text.includes('traveloka hotel') || text.includes('hotel')) {
    return {
      bg: 'bg-[#0194F3]',
      icon: <Plane size={18} className="text-white" />
    };
  }

  if (text.includes('traveloka') || text.includes('tiket') || text.includes('flight')) {
    return {
      bg: 'bg-[#0194F3]',
      icon: <Plane size={18} className="text-white" />
    };
  }

  if (text.includes('tokopedia') || text.includes('tokped')) {
    return {
      bg: 'bg-[#03AC0E]',
      icon: <ShoppingBag size={18} className="text-white" />
    };
  }

  if (text.includes('grab')) {
    return {
      bg: 'bg-[#00B14F]',
      icon: <Car size={18} className="text-white" />
    };
  }

  if (text.includes('netflix')) {
    return {
      bg: 'bg-[#E50914]',
      icon: <Tv size={18} className="text-white" />
    };
  }

  if (text.includes('spotify')) {
    return {
      bg: 'bg-[#1DB954]',
      icon: <Music size={18} className="text-white" />
    };
  }

  // Fallback
  return {
    bg: 'bg-slate-800 border border-slate-700',
    icon: <Receipt size={18} className="text-slate-300" />
  };
};

export const CardDetail: React.FC<CardDetailProps> = ({
  data,
  year,
  month,
  cardReport,
  showAmounts = true,
  onBackToMonth,
  onToggleTransactionValidation,
  onToggleInstallmentValidation,
  onEditTransaction,
  onOpenStatement,
  onOpenQuickRecord,
  saveData
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('TRANSAKSI');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Bank Statement Bill Input Modal State
  const [isEditingBankBill, setIsEditingBankBill] = useState(false);
  const [bankBillInput, setBankBillInput] = useState('');

  const monthName = MONTH_NAMES[month];
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  // Card reference & date details
  const card = cardReport.cardObj || data.cards.find((c) => c.id === cardReport.cardId);

  // Bank Bill from e-Statement (if set by user) vs calculated from transactions
  const manualBankBill = card?.statementBills?.[monthKey];
  const totalTagihanBank = manualBankBill !== undefined ? manualBankBill : cardReport.tagihan;

  // Billing period calculation (e.g. 1 - 30 Nov 2026)
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const monthShort = MONTH_NAMES[month].slice(0, 3);
  const billingPeriodStr = `1 – ${lastDayOfMonth} ${monthShort} ${year}`;

  // Due Date calculation (e.g. 17 Des 2026)
  const dueDay = card?.dueDay || 17;
  const nextMonthIdx = (month + 1) % 12;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const dueMonthShort = MONTH_NAMES[nextMonthIdx].slice(0, 3);
  const dueDateStr = `${dueDay} ${dueMonthShort} ${nextMonthYear}`;

  // Filter actual transactions for this card and period
  const rawTransactions = useMemo(() => {
    return data.transactions
      .filter(
        (t) =>
          cardReport.expenseTxIds.includes(t.id) ||
          (!t.isInstallment &&
            t.cardId === cardReport.cardId &&
            getBillingPeriod(t.date, card?.dueDay).month === month &&
            getBillingPeriod(t.date, card?.dueDay).year === year)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, cardReport.expenseTxIds, cardReport.cardId, card?.dueDay, month, year]);

  // Filter installments for this card and period
  const rawInstallments = useMemo(() => {
    return data.installments
      .filter((inst) => {
        if (inst.cardId !== cardReport.cardId) return false;
        const billingTenor1 = getBillingPeriod(inst.startDate, card?.dueDay);
        const monthDiff = (year - billingTenor1.year) * 12 + (month - billingTenor1.month);
        return monthDiff >= 0 && monthDiff < inst.totalMonths;
      })
      .map((inst) => {
        const billingTenor1 = getBillingPeriod(inst.startDate, card?.dueDay);
        const monthDiff = (year - billingTenor1.year) * 12 + (month - billingTenor1.month);
        return {
          ...inst,
          currentTenor: monthDiff + 1,
          isValidated: inst.validatedTenors?.includes(monthKey) || false
        };
      });
  }, [data.installments, cardReport.cardId, card?.dueDay, year, month, monthKey]);

  // Filtered transactions by Search & Filter
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((t) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = t.description.toLowerCase().includes(query);
        const matchesCat = (t.category || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCat) return false;
      }
      // Filter status
      if (activeFilter === 'BUSINESS' && t.owner !== OwnerType.BUSINESS) return false;
      if (activeFilter === 'PERSONAL' && t.owner !== OwnerType.PERSONAL) return false;
      if (activeFilter === 'CHECKED' && !t.isValidated) return false;
      if (activeFilter === 'UNCHECKED' && t.isValidated) return false;
      return true;
    });
  }, [rawTransactions, searchQuery, activeFilter]);

  // Filtered installments
  const filteredInstallments = useMemo(() => {
    return rawInstallments.filter((inst) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!inst.name.toLowerCase().includes(query)) return false;
      }
      if (activeFilter === 'BUSINESS' && inst.owner !== OwnerType.BUSINESS) return false;
      if (activeFilter === 'PERSONAL' && inst.owner !== OwnerType.PERSONAL) return false;
      if (activeFilter === 'CHECKED' && !inst.isValidated) return false;
      if (activeFilter === 'UNCHECKED' && inst.isValidated) return false;
      return true;
    });
  }, [rawInstallments, searchQuery, activeFilter]);

  // Validation statistics
  const totalItemCount = rawTransactions.length + rawInstallments.length;
  const validatedTxCount = rawTransactions.filter((t) => t.isValidated).length;
  const validatedInstCount = rawInstallments.filter((i) => i.isValidated).length;
  const validatedCount = validatedTxCount + validatedInstCount;

  // Sum of validated amounts
  const validatedTotalAmount = useMemo(() => {
    const txSum = rawTransactions.filter((t) => t.isValidated).reduce((sum, t) => sum + t.amount, 0);
    const instSum = rawInstallments.filter((i) => i.isValidated).reduce((sum, i) => sum + i.monthlyAmount, 0);
    return txSum + instSum;
  }, [rawTransactions, rawInstallments]);

  const areAllValidated = totalItemCount > 0 && validatedCount === totalItemCount;

  // Toggle All validation
  const handleToggleAll = () => {
    const targetState = !areAllValidated;

    if (saveData) {
      const targetTxIds = new Set(rawTransactions.map((t) => t.id));
      const targetInstIds = new Set(rawInstallments.map((i) => i.id));

      const updatedTx = data.transactions.map((t) => {
        if (targetTxIds.has(t.id)) {
          return { ...t, isValidated: targetState };
        }
        return t;
      });

      const updatedInst = data.installments.map((inst) => {
        if (targetInstIds.has(inst.id)) {
          const current = new Set(inst.validatedTenors || []);
          if (targetState) {
            current.add(monthKey);
          } else {
            current.delete(monthKey);
          }
          return { ...inst, validatedTenors: Array.from(current) };
        }
        return inst;
      });

      saveData({
        ...data,
        transactions: updatedTx,
        installments: updatedInst
      });
    } else {
      rawTransactions.forEach((t) => {
        if (Boolean(t.isValidated) !== targetState) {
          onToggleTransactionValidation?.(t.id);
        }
      });
      rawInstallments.forEach((i) => {
        if (Boolean(i.isValidated) !== targetState) {
          onToggleInstallmentValidation?.(i.id, monthKey);
        }
      });
    }
  };

  // Save manual bank bill
  const handleSaveBankBill = (newVal: number | null) => {
    if (!card || !saveData) return;
    const currentBills = { ...(card.statementBills || {}) };
    if (newVal === null || newVal <= 0) {
      delete currentBills[monthKey];
    } else {
      currentBills[monthKey] = newVal;
    }

    const updatedCards = data.cards.map((c) =>
      c.id === card.id ? { ...c, statementBills: currentBills } : c
    );
    saveData({ ...data, cards: updatedCards });
    setIsEditingBankBill(false);
  };

  // Seed screenshot sample data if requested
  const handleSeedSampleData = () => {
    if (!saveData || !card) return;
    if (
      !window.confirm(
        'Muat data contoh persis seperti gambar (Traveloka Nov 2026)?\nData transaksi dan piutang/tabungan contoh akan dimasukkan.'
      )
    ) {
      return;
    }

    const targetDateBase = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Sample transactions from screenshot
    const sampleTx: Transaction[] = [
      {
        id: 'sample-tx-1',
        cardId: card.id,
        description: 'Shopee',
        amount: 296120,
        date: `${targetDateBase}-30T10:00:00Z`,
        type: TransactionType.EXPENSE,
        category: 'Belanja',
        owner: OwnerType.BUSINESS,
        isValidated: true
      },
      {
        id: 'sample-tx-2',
        cardId: card.id,
        description: 'Gojek',
        amount: 10556,
        date: `${targetDateBase}-24T12:00:00Z`,
        type: TransactionType.EXPENSE,
        category: 'Transport',
        owner: OwnerType.BUSINESS,
        isValidated: true
      },
      {
        id: 'sample-tx-3',
        cardId: card.id,
        description: 'Traveloka Hotel',
        amount: 1250000,
        date: `${targetDateBase}-20T14:00:00Z`,
        type: TransactionType.EXPENSE,
        category: 'Akomodasi',
        owner: OwnerType.PERSONAL,
        isValidated: false
      },
      {
        id: 'sample-tx-4',
        cardId: card.id,
        description: 'Shopee',
        amount: 268168,
        date: `${targetDateBase}-15T09:00:00Z`,
        type: TransactionType.EXPENSE,
        category: 'Belanja',
        owner: OwnerType.BUSINESS,
        isValidated: true
      },
      {
        id: 'sample-tx-5',
        cardId: card.id,
        description: 'GoFood',
        amount: 70640,
        date: `${targetDateBase}-13T18:00:00Z`,
        type: TransactionType.EXPENSE,
        category: 'Makanan',
        owner: OwnerType.PERSONAL,
        isValidated: false
      }
    ];

    // Bank statement bill 14.320.000
    const currentBills = { ...(card.statementBills || {}), [monthKey]: 14320000 };
    const updatedCards = data.cards.map((c) =>
      c.id === card.id ? { ...c, statementBills: currentBills } : c
    );

    // Filter out existing sample transactions to avoid duplicates
    const otherTx = data.transactions.filter((t) => !t.id.startsWith('sample-tx-'));

    saveData({
      ...data,
      cards: updatedCards,
      transactions: [...sampleTx, ...otherTx]
    });
    setIsMenuOpen(false);
  };

  // Piutang & Tabungan numbers
  const piutangAmount = cardReport.piutang.untukTagihan || cardReport.piutang.piutangBelumKembali || 0;
  const tabunganAmount = cardReport.tabungan.untukTagihan || cardReport.tabungan.tabunganBelumTerpakai || 0;

  // Sisa kekurangan based on totalTagihanBank
  const sisaKekurangan = Math.max(0, totalTagihanBank - piutangAmount - tabunganAmount);

  // Percentage calculations
  const totalOwnerBase = (cardReport.pribadi || 0) + (cardReport.bisnis || 0);
  const pribadiPercent = totalOwnerBase > 0 ? Math.round(((cardReport.pribadi || 0) / totalOwnerBase) * 100) : 0;
  const bisnisPercent = totalOwnerBase > 0 ? 100 - pribadiPercent : 0;

  return (
    <div className="space-y-4 pb-28 text-slate-100">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMonth}
            className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-full transition cursor-pointer"
            aria-label="Kembali ke Ringkasan Bulan"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
              {cardReport.cardName} • {monthName} {year}
            </h1>
            <p className="text-xs font-semibold text-slate-400">e-Statement & Pencocokan Transaksi</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-full transition cursor-pointer"
            aria-label="Menu Pilihan"
          >
            <MoreVertical size={20} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setBankBillInput(String(totalTagihanBank));
                  setIsEditingBankBill(true);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Pencil size={16} className="text-amber-400" />
                Input / Ubah Tagihan Bank (e-Statement)
              </button>

              {onOpenQuickRecord && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenQuickRecord('EXPENSE', {
                      cardId: cardReport.cardId,
                      month,
                      year,
                      validated: true
                    });
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} className="text-sky-400" />
                  Tambah Transaksi Baru di Bulan Ini
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleToggleAll();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <CheckSquare size={16} className="text-emerald-400" />
                {areAllValidated ? 'Batalkan Cocok Semua' : 'Cocokkan Semua Transaksi'}
              </button>

              {card && onOpenStatement && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenStatement(card, month, year);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <FileText size={16} className="text-blue-400" />
                  Buka Halaman Statement
                </button>
              )}

              <button
                type="button"
                onClick={handleSeedSampleData}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer border-t border-slate-800 mt-1 pt-2"
              >
                <Sparkles size={16} className="text-purple-400" />
                Muat Contoh Screenshot (Traveloka Nov 2026)
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  const summaryText = `Ringkasan ${cardReport.cardName} (${monthName} ${year})\nTotal Tagihan: ${formatIDR(totalTagihanBank)}\nPiutang: ${formatIDR(piutangAmount)}\nTabungan: ${formatIDR(tabunganAmount)}\nSisa Kekurangan: ${formatIDR(sisaKekurangan)}`;
                  navigator.clipboard?.writeText(summaryText);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <CheckSquare size={16} className="text-slate-400" />
                Salin Ringkasan Tagihan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. CARD 1: TOP CARD OVERVIEW (Traveloka / Periode Tagihan / Jatuh Tempo) */}
      <div className="bg-[#121c33] dark:bg-[#121c33] border border-slate-800/90 rounded-2xl p-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Brand & Name */}
          <div className="sm:col-span-5 flex items-center gap-3">
            <CardBrandLogo cardName={cardReport.cardName} logoUrl={card?.logoUrl} color={cardReport.cardColor} />
            <div>
              <div className="font-extrabold text-white text-base leading-tight tracking-tight">
                {cardReport.cardName}
              </div>
              <div className="text-xs font-medium text-slate-400">Kartu Kredit</div>
            </div>
          </div>

          {/* Periode Tagihan */}
          <div className="sm:col-span-4 flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 leading-tight">Periode Tagihan</div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5">{billingPeriodStr}</div>
            </div>
          </div>

          {/* Jatuh Tempo */}
          <div className="sm:col-span-3 flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-rose-400 shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 leading-tight">Jatuh Tempo</div>
              <div className="mt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#381622] text-[#f87171] border border-[#5c1d2e]">
                  {dueDateStr}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CARD 2: METRICS DASHBOARD */}
      <div className="bg-[#121c33] dark:bg-[#121c33] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        {/* Row 1: Total Tagihan, Piutang, Tabungan */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-400">Total Tagihan (Bank)</div>
              <button
                type="button"
                onClick={() => {
                  setBankBillInput(String(totalTagihanBank));
                  setIsEditingBankBill(true);
                }}
                className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 font-semibold cursor-pointer transition"
              >
                <Pencil size={12} />
                <span>Ubah</span>
              </button>
            </div>
            <div
              onClick={() => {
                setBankBillInput(String(totalTagihanBank));
                setIsEditingBankBill(true);
              }}
              className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 cursor-pointer hover:text-sky-300 transition"
              title="Klik untuk mengubah tagihan sesuai e-Statement bank"
            >
              {showAmounts ? formatIDR(totalTagihanBank) : 'Rp ••••••••'}
            </div>
          </div>

          <div className="sm:col-span-3 flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Piutang</div>
              <div className="text-sm font-extrabold text-white">
                {showAmounts ? formatIDR(piutangAmount) : 'Rp ••••••••'}
              </div>
            </div>
          </div>

          <div className="sm:col-span-4 flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <PiggyBank size={18} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Tabungan</div>
              <div className="text-sm font-extrabold text-white">
                {showAmounts ? formatIDR(tabunganAmount) : 'Rp ••••••••'}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-slate-800/80 my-1" />

        {/* Row 2: Total Hutang & Sisa Kekurangan */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <CreditCardIcon size={18} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Total Hutang</div>
              <div className="text-sm sm:text-base font-extrabold text-white">
                {showAmounts ? formatIDR(totalTagihanBank) : 'Rp ••••••••'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-800/80 pl-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
              <Target size={18} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Sisa Kekurangan</div>
              <div className="text-sm sm:text-base font-extrabold text-rose-400">
                {showAmounts ? formatIDR(sisaKekurangan) : 'Rp ••••••••'}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Pribadi & Bisnis */}
        <div className="grid grid-cols-2 gap-4 items-center pt-1">
          <div className="flex items-center gap-2">
            <User size={16} className="text-sky-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 mr-2">Pribadi</span>
              <span className="font-bold text-white">
                {showAmounts ? formatIDR(cardReport.pribadi) : 'Rp ••••'}
              </span>
              <span className="text-slate-400 font-normal ml-1">({pribadiPercent}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800/80 pl-4">
            <Briefcase size={16} className="text-purple-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 mr-2">Bisnis</span>
              <span className="font-bold text-white">
                {showAmounts ? formatIDR(cardReport.bisnis) : 'Rp ••••'}
              </span>
              <span className="text-slate-400 font-normal ml-1">({bisnisPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Dual-color Progress Bar */}
        <div className="h-1.5 w-full bg-slate-800/90 rounded-full overflow-hidden flex">
          <div
            className="bg-sky-400 h-full transition-all duration-300"
            style={{ width: `${pribadiPercent}%` }}
          />
          <div
            className="bg-purple-500 h-full transition-all duration-300"
            style={{ width: `${bisnisPercent}%` }}
          />
        </div>
      </div>

      {/* QUICK ACTION: INPUT TRANSAKSI BARU (LANGSUNG COCOK) */}
      {onOpenQuickRecord && (
        <button
          type="button"
          onClick={() =>
            onOpenQuickRecord('EXPENSE', {
              cardId: cardReport.cardId,
              month,
              year,
              validated: true
            })
          }
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99] shadow-xs"
        >
          <Plus size={16} />
          <span>+ Tambah Transaksi di Periode Ini (Langsung Cocok)</span>
        </button>
      )}

      {/* 4. SEGMENTED TABS (Daftar Transaksi | Cicilan) */}
      <div className="bg-[#121c33] dark:bg-[#121c33] border border-slate-800/90 p-1 rounded-2xl flex gap-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('TRANSAKSI')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer text-center ${
            activeTab === 'TRANSAKSI'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Daftar Transaksi {rawTransactions.length > 0 && `(${rawTransactions.length})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CICILAN')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer text-center ${
            activeTab === 'CICILAN'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Cicilan {rawInstallments.length > 0 && `(${rawInstallments.length})`}
        </button>
      </div>

      {/* 5. SEARCH & FILTER BAR */}
      <div className="flex items-center gap-2 relative">
        <div className="flex-1 bg-[#121c33] dark:bg-[#121c33] border border-slate-800/90 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 outline-none font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`w-11 h-11 rounded-xl bg-[#121c33] border transition flex items-center justify-center cursor-pointer ${
              activeFilter !== 'ALL'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-slate-800/90 text-slate-300 hover:bg-slate-800'
            }`}
            aria-label="Filter"
          >
            <Filter size={18} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              {[
                { key: 'ALL', label: 'Semua Transaksi' },
                { key: 'BUSINESS', label: 'Bisnis Saja' },
                { key: 'PERSONAL', label: 'Pribadi Saja' },
                { key: 'CHECKED', label: 'Sudah Dicocokkan' },
                { key: 'UNCHECKED', label: 'Belum Dicocokkan' }
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(f.key as FilterType);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    activeFilter === f.key
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{f.label}</span>
                  {activeFilter === f.key && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. LIST OF TRANSACTIONS OR INSTALLMENTS */}
      <div className="space-y-2">
        {activeTab === 'TRANSAKSI' ? (
          filteredTransactions.length === 0 ? (
            <div className="bg-[#121c33] border border-slate-800/90 rounded-2xl p-8 text-center text-slate-400 text-xs">
              Tidak ada transaksi ditemukan pada periode ini.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const merchant = getMerchantIcon(tx.description, tx.category);
              const txDate = new Date(tx.date);
              const formattedDate = `${txDate.getDate()} ${MONTH_NAMES[txDate.getMonth()].slice(0, 3)} ${txDate.getFullYear()}`;

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction?.(tx)}
                  className="flex items-center justify-between p-3.5 bg-[#121c33] hover:bg-slate-900/90 border border-slate-800/90 rounded-2xl transition cursor-pointer gap-3 shadow-xs"
                >
                  {/* Left: Checkbox + Icon + Title/Date */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Interactive Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTransactionValidation?.(tx.id);
                      }}
                      className="p-1 -m-1 cursor-pointer shrink-0"
                      aria-label={tx.isValidated ? 'Batalkan cocok' : 'Cocokkan transaksi'}
                    >
                      {tx.isValidated ? (
                        <div className="w-5 h-5 rounded-md bg-sky-500 flex items-center justify-center text-white shadow-sm shadow-sky-500/30">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-600 bg-slate-950/60 hover:border-slate-400 transition" />
                      )}
                    </button>

                    {/* Merchant Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl ${merchant.bg} flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      {merchant.icon}
                    </div>

                    {/* Description & Date */}
                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-xs sm:text-sm truncate leading-tight">
                        {tx.description}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">{formattedDate}</div>
                    </div>
                  </div>

                  {/* Right: Pill Badge + Amount + Chevron */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Owner Badge */}
                    {tx.owner === OwnerType.BUSINESS ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#2e1d52] text-[#d8b4fe] border border-[#582b8c]">
                        Bisnis
                      </span>
                    ) : tx.owner === OwnerType.SPLIT ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#063b28] text-[#6ee7b7] border border-[#0d6342]">
                        Split
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#142d59] text-[#93c5fd] border border-[#1e4a8c]">
                        Pribadi
                      </span>
                    )}

                    {/* Amount */}
                    <div className="font-extrabold text-white text-xs sm:text-sm text-right">
                      {showAmounts ? formatIDR(tx.amount) : 'Rp ••••••••'}
                    </div>

                    <ChevronRight size={18} className="text-slate-500" />
                  </div>
                </div>
              );
            })
          )
        ) : (
          filteredInstallments.length === 0 ? (
            <div className="bg-[#121c33] border border-slate-800/90 rounded-2xl p-8 text-center text-slate-400 text-xs">
              Tidak ada cicilan aktif pada periode ini.
            </div>
          ) : (
            filteredInstallments.map((inst) => {
              return (
                <div
                  key={inst.id}
                  className="flex items-center justify-between p-3.5 bg-[#121c33] hover:bg-slate-900/90 border border-slate-800/90 rounded-2xl transition gap-3 shadow-xs"
                >
                  {/* Left: Checkbox + Icon + Title/Tenor */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleInstallmentValidation?.(inst.id, monthKey)}
                      className="p-1 -m-1 cursor-pointer shrink-0"
                      aria-label={inst.isValidated ? 'Batalkan cocok' : 'Cocokkan cicilan'}
                    >
                      {inst.isValidated ? (
                        <div className="w-5 h-5 rounded-md bg-sky-500 flex items-center justify-center text-white shadow-sm shadow-sky-500/30">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-600 bg-slate-950/60 hover:border-slate-400 transition" />
                      )}
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Clock size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-xs sm:text-sm truncate leading-tight">
                        {inst.name}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                        Bulan ke-{inst.currentTenor} dari {inst.totalMonths}
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge + Amount */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {inst.owner === OwnerType.BUSINESS ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#2e1d52] text-[#d8b4fe] border border-[#582b8c]">
                        Bisnis
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#142d59] text-[#93c5fd] border border-[#1e4a8c]">
                        Pribadi
                      </span>
                    )}

                    <div className="font-extrabold text-white text-xs sm:text-sm text-right">
                      {showAmounts ? formatIDR(inst.monthlyAmount) : 'Rp ••••••••'}
                    </div>

                    <ChevronRight size={18} className="text-slate-500" />
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* 7. STICKY BOTTOM RECONCILIATION BAR */}
      <div className="sticky bottom-4 z-40 bg-[#0d162b]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Total Transaksi (Aplikasi) */}
          <div>
            <div className="text-[11px] font-medium text-slate-400">Total Transaksi (Aplikasi)</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {showAmounts ? formatIDR(validatedTotalAmount) : 'Rp ••••••••'}
            </div>
          </div>

          {/* Transaksi Dicocokkan */}
          <div className="text-center sm:text-left">
            <div className="text-[11px] font-medium text-slate-400">Transaksi Dicocokkan</div>
            <div className="text-xs sm:text-sm mt-0.5">
              <span className="font-black text-white">{validatedCount}</span>{' '}
              <span className="text-slate-400 font-medium">dari {totalItemCount}</span>
            </div>
          </div>

          {/* Ceklist Semua Button */}
          <button
            type="button"
            onClick={handleToggleAll}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition active:scale-95 shadow-sm"
          >
            {areAllValidated ? (
              <>
                <Square size={14} className="text-slate-400" />
                <span>Batal Ceklist</span>
              </>
            ) : (
              <>
                <CheckSquare size={14} className="text-sky-400" />
                <span>Ceklist Semua</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL INPUT / UBAH TAGIHAN BANK (E-STATEMENT) */}
      {isEditingBankBill && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121c33] border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white">Input Tagihan Bank (e-Statement)</h3>
              <button
                type="button"
                onClick={() => setIsEditingBankBill(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Masukkan total tagihan dari lembar tagihan bank / PDF e-Statement untuk periode {monthName} {year} agar pencocokan transaksi lebih presisi.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400">Total Tagihan (Rp)</label>
              <input
                type="text"
                autoFocus
                value={bankBillInput}
                onChange={(e) => setBankBillInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="14320000"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-extrabold text-base outline-none focus:border-sky-500"
              />
              {bankBillInput && (
                <div className="text-xs text-sky-400 font-bold mt-1">
                  {formatIDR(parseIDR(bankBillInput) || 0)}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveBankBill(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Reset Otomatis
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseIDR(bankBillInput);
                  handleSaveBankBill(parsed);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
