import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard as CreditCardType,
  Transaction,
  TransactionType,
  OwnerType,
  Saving,
  Piutang as PiutangType
} from '../types';
import {
  PeriodPicker,
  TenorChips,
  SegmentedControl,
  Toggle
} from './ui';
import {
  useTransactionForm,
  useSavingForm,
  usePiutangForm
} from '../hooks/useFormReducers';
import {
  SaveTransactionPayload
} from '../hooks/useTransactionService';
import { formatIDR, formatNumberIDR, parseIDR, formatDateID } from '../lib/format';
import { MONTH_NAMES, MONTH_SHORT_NAMES, QUICK_TENORS } from '../lib/constants';
import { useVisualViewport } from '../hooks/useVisualViewport';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Vault,
  HandCoins,
  X,
  CreditCard as CardIcon,
  Tag,
  Calendar,
  Sliders,
  ChevronDown,
  Check,
  Zap,
  RotateCcw,
  AlertCircle,
  FileText,
  User,
  Scale
} from 'lucide-react';

export type QuickRecordTab = 'EXPENSE' | 'PAYMENT' | 'SAVING' | 'PIUTANG';

export interface QuickRecordSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: QuickRecordTab;
  editingTransaction?: Transaction | null;
  editingSaving?: Saving | null;
  editingPiutang?: PiutangType | null;
  prefillCardId?: string;
  prefillMonth?: number;
  prefillYear?: number;
  prefillValidated?: boolean;
  cards: CreditCardType[];
  lastUsedCardId?: string;
  descriptionHistory?: string[];
  getAvailableSavings: (cardId: string, month: number, year: number) => number;
  getBillEstimate: (cardId: string, month: number, year: number) => number;
  onSaveTransaction: (payload: SaveTransactionPayload) => void;
  onDeleteTransaction?: (id: string) => void;
  onSaveSaving: (payload: { cardId: string; amount: number; note: string; targetMonth: number; targetYear: number }) => void;
  onDeleteSaving?: (id: string) => void;
  onSavePiutang: (payload: {
    cardId: string;
    debtor: string;
    amount: number;
    note: string;
    targetMonth: number;
    targetYear: number;
    isInstallment: boolean;
    installmentMonths: number;
  }) => void;
  onDeletePiutang?: (id: string) => void;
}

export const QuickRecordSheet: React.FC<QuickRecordSheetProps> = ({
  isOpen,
  onClose,
  initialTab = 'EXPENSE',
  editingTransaction,
  editingSaving,
  editingPiutang,
  prefillCardId,
  prefillMonth,
  prefillYear,
  prefillValidated,
  cards,
  lastUsedCardId,
  descriptionHistory = [],
  getAvailableSavings,
  getBillEstimate,
  onSaveTransaction,
  onDeleteTransaction,
  onSaveSaving,
  onDeleteSaving,
  onSavePiutang,
  onDeletePiutang
}) => {
  const defaultCard = prefillCardId || lastUsedCardId || cards[0]?.id || '';

  const [activeTab, setActiveTab] = useState<QuickRecordTab>(initialTab);
  const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);

  // Sub-sheet "Opsi Tambahan" State
  const [isExtraOptionsOpen, setIsExtraOptionsOpen] = useState(false);
  const [draftIsInstallment, setDraftIsInstallment] = useState(false);
  const [draftTenor, setDraftTenor] = useState(12);
  const [isCustomTenorOpen, setIsCustomTenorOpen] = useState(false);
  const [customTenorInput, setCustomTenorInput] = useState('');
  const [draftOwner, setDraftOwner] = useState<OwnerType>(OwnerType.PERSONAL);
  const [draftSplitPersonal, setDraftSplitPersonal] = useState<number>(0);
  const [draftSplitBusiness, setDraftSplitBusiness] = useState<number>(0);

  // Custom savings amount when paying bill
  const [customSavingsAmount, setCustomSavingsAmount] = useState<number | null>(null);

  // Native date input refs
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  // Hook for visual viewport / keyboard handling on mobile
  const { isKeyboardVisible, keyboardHeight } = useVisualViewport();

  // Form Reducers
  const txForm = useTransactionForm(defaultCard);
  const savingForm = useSavingForm(defaultCard);
  const piutangForm = usePiutangForm(defaultCard);

  const isEditing = !!(editingTransaction || editingSaving || editingPiutang);

  // Sync state when opened or editing item changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      txForm.dispatch({ type: 'LOAD_ITEM', item: editingTransaction });
      setActiveTab(editingTransaction.type === TransactionType.PAYMENT ? 'PAYMENT' : 'EXPENSE');
      setCustomSavingsAmount(null);
    } else if (editingSaving) {
      savingForm.dispatch({ type: 'LOAD_ITEM', item: editingSaving });
      setActiveTab('SAVING');
      setCustomSavingsAmount(null);
    } else if (editingPiutang) {
      piutangForm.dispatch({ type: 'LOAD_ITEM', item: editingPiutang });
      setActiveTab('PIUTANG');
      setCustomSavingsAmount(null);
    } else {
      setActiveTab(initialTab);
      txForm.dispatch({
        type: 'RESET',
        defaultCardId: defaultCard,
        initialValidated: prefillValidated ?? false
      });
      if (initialTab === 'PAYMENT') {
        txForm.dispatch({ type: 'SET_TYPE', value: TransactionType.PAYMENT });
      }
      savingForm.dispatch({ type: 'RESET', defaultCardId: defaultCard });
      piutangForm.dispatch({ type: 'RESET', defaultCardId: defaultCard });

      if (prefillMonth !== undefined && prefillYear !== undefined) {
        txForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: prefillMonth });
        txForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: prefillYear });
        savingForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: prefillMonth });
        savingForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: prefillYear });
        piutangForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: prefillMonth });
        piutangForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: prefillYear });

        // Set date to day 15 of requested period for clean billing matching
        const formattedDate = `${prefillYear}-${String(prefillMonth + 1).padStart(2, '0')}-15`;
        txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: formattedDate });
      }

      setCustomSavingsAmount(null);
    }
  }, [
    isOpen,
    editingTransaction,
    editingSaving,
    editingPiutang,
    initialTab,
    defaultCard,
    prefillMonth,
    prefillYear,
    prefillValidated
  ]);

  // Ensure cardId is valid if current cardId is empty
  useEffect(() => {
    if (cards.length > 0) {
      if (!txForm.state.cardId) txForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: defaultCard });
      if (!savingForm.state.cardId) savingForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: defaultCard });
      if (!piutangForm.state.cardId) piutangForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: defaultCard });
    }
  }, [cards, defaultCard]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Helper date strings
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  // Start-End month formatted string
  const formatStartEndMonth = (dateStr: string, tenor: number): string => {
    try {
      const d = new Date(dateStr || new Date());
      if (isNaN(d.getTime())) return '-';
      const startM = d.getMonth();
      const startY = d.getFullYear();
      const endTotalM = startM + Math.max(0, tenor - 1);
      const endM = endTotalM % 12;
      const endY = startY + Math.floor(endTotalM / 12);
      return `Mulai: ${MONTH_SHORT_NAMES[startM]} ${startY} – ${MONTH_SHORT_NAMES[endM]} ${endY}`;
    } catch {
      return '-';
    }
  };

  // Selected card details
  const selectedCard = useMemo(() => {
    const cardId =
      activeTab === 'SAVING'
        ? savingForm.state.cardId
        : activeTab === 'PIUTANG'
        ? piutangForm.state.cardId
        : txForm.state.cardId;
    return cards.find((c) => c.id === cardId) || cards[0];
  }, [cards, activeTab, txForm.state.cardId, savingForm.state.cardId, piutangForm.state.cardId]);

  // Calculations for Payment tab
  const availableSavingsForPeriod = useMemo(() => {
    if (!txForm.state.cardId) return 0;
    return getAvailableSavings(txForm.state.cardId, txForm.state.targetMonth, txForm.state.targetYear);
  }, [txForm.state.cardId, txForm.state.targetMonth, txForm.state.targetYear, getAvailableSavings]);

  const currentBillEstimate = useMemo(() => {
    if (!txForm.state.cardId) return 0;
    return getBillEstimate(txForm.state.cardId, txForm.state.targetMonth, txForm.state.targetYear);
  }, [txForm.state.cardId, txForm.state.targetMonth, txForm.state.targetYear, getBillEstimate]);

  // Default savings usage = min(saldo, tagihan)
  const defaultSavingsUsage = useMemo(() => {
    if (availableSavingsForPeriod <= 0) return 0;
    return currentBillEstimate > 0
      ? Math.min(availableSavingsForPeriod, currentBillEstimate)
      : availableSavingsForPeriod;
  }, [availableSavingsForPeriod, currentBillEstimate]);

  const effectiveSavingsUsed =
    customSavingsAmount !== null && customSavingsAmount >= 0
      ? Math.min(customSavingsAmount, availableSavingsForPeriod)
      : defaultSavingsUsage;

  const totalPaymentImpact = Math.ceil(
    txForm.state.amount + (txForm.state.useSavings ? effectiveSavingsUsed : 0)
  );

  // Validation
  const splitTotal = txForm.state.splitPersonal + txForm.state.splitBusiness;
  const isSplitMismatch =
    activeTab === 'EXPENSE' &&
    txForm.state.owner === OwnerType.SPLIT &&
    splitTotal !== txForm.state.amount;

  const isExpenseValid =
    !!txForm.state.cardId &&
    txForm.state.amount > 0 &&
    txForm.state.description.trim().length > 0 &&
    !isSplitMismatch;

  const isPaymentValid =
    !!txForm.state.cardId &&
    (txForm.state.amount > 0 || (txForm.state.useSavings && effectiveSavingsUsed > 0));

  const isSavingValid = !!savingForm.state.cardId && savingForm.state.amount > 0;

  const isPiutangValid =
    !!piutangForm.state.cardId &&
    piutangForm.state.amount > 0 &&
    piutangForm.state.debtor.trim().length > 0 &&
    (!piutangForm.state.isInstallment || piutangForm.state.installmentMonths > 1);

  // Active form validation & info
  const currentIsValid =
    activeTab === 'EXPENSE'
      ? isExpenseValid
      : activeTab === 'PAYMENT'
      ? isPaymentValid
      : activeTab === 'SAVING'
      ? isSavingValid
      : isPiutangValid;

  const currentInvalidMessage =
    activeTab === 'EXPENSE'
      ? txForm.state.amount <= 0
        ? 'Masukkan nominal pemakaian'
        : !txForm.state.description.trim()
        ? 'Isi keterangan transaksi'
        : isSplitMismatch
        ? `Total Split (${formatIDR(splitTotal)}) harus sama dengan nominal (${formatIDR(txForm.state.amount)})`
        : undefined
      : activeTab === 'PAYMENT'
      ? !isPaymentValid
        ? 'Masukkan nominal pembayaran atau aktifkan tabungan'
        : undefined
      : activeTab === 'SAVING'
      ? !isSavingValid
        ? 'Masukkan nominal tabungan'
        : undefined
      : !isPiutangValid
      ? !piutangForm.state.debtor.trim()
        ? 'Isi nama peminjam piutang'
        : piutangForm.state.amount <= 0
        ? 'Masukkan nominal piutang'
        : 'Lengkapi data piutang'
      : undefined;

  // Submit Handlers
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isExpenseValid) return;
    onSaveTransaction({
      cardId: txForm.state.cardId,
      type: TransactionType.EXPENSE,
      amount: txForm.state.amount,
      description: txForm.state.description,
      date: txForm.state.date,
      category: txForm.state.category,
      isInstallment: txForm.state.isInstallment,
      installmentMonths: txForm.state.installmentMonths,
      owner: txForm.state.owner,
      splitPersonal: txForm.state.splitPersonal,
      splitBusiness: txForm.state.splitBusiness,
      isValidated: txForm.state.isValidated
    });
    onClose();
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaymentValid) return;
    onSaveTransaction({
      cardId: txForm.state.cardId,
      type: TransactionType.PAYMENT,
      amount: txForm.state.amount,
      description: txForm.state.description || `Pelunasan ${MONTH_NAMES[txForm.state.targetMonth]} ${txForm.state.targetYear}`,
      date: txForm.state.date,
      useSavings: txForm.state.useSavings,
      savingsAmount: txForm.state.useSavings ? effectiveSavingsUsed : 0,
      targetMonth: txForm.state.targetMonth,
      targetYear: txForm.state.targetYear
    });
    onClose();
  };

  const handleSubmitSaving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSavingValid) return;
    onSaveSaving({
      cardId: savingForm.state.cardId,
      amount: savingForm.state.amount,
      note: savingForm.state.note,
      targetMonth: savingForm.state.targetMonth,
      targetYear: savingForm.state.targetYear
    });
    onClose();
  };

  const handleSubmitPiutang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPiutangValid) return;
    onSavePiutang({
      cardId: piutangForm.state.cardId,
      debtor: piutangForm.state.debtor,
      amount: piutangForm.state.amount,
      note: piutangForm.state.note,
      targetMonth: piutangForm.state.targetMonth,
      targetYear: piutangForm.state.targetYear,
      isInstallment: piutangForm.state.isInstallment,
      installmentMonths: piutangForm.state.installmentMonths
    });
    onClose();
  };

  // Quick Amount Handlers
  const handleAddAmount = (delta: number) => {
    if (activeTab === 'EXPENSE' || activeTab === 'PAYMENT') {
      const current = txForm.state.amount || 0;
      txForm.dispatch({ type: 'SET_AMOUNT', value: Math.max(0, current + delta) });
    } else if (activeTab === 'SAVING') {
      const current = savingForm.state.amount || 0;
      savingForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: Math.max(0, current + delta) });
    } else {
      const current = piutangForm.state.amount || 0;
      piutangForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: Math.max(0, current + delta) });
    }
  };

  const handleMultiplyThousand = () => {
    let current = 0;
    if (activeTab === 'EXPENSE' || activeTab === 'PAYMENT') {
      current = txForm.state.amount || 0;
      if (current > 0) txForm.dispatch({ type: 'SET_AMOUNT', value: current * 1000 });
    } else if (activeTab === 'SAVING') {
      current = savingForm.state.amount || 0;
      if (current > 0) savingForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: current * 1000 });
    } else {
      current = piutangForm.state.amount || 0;
      if (current > 0) piutangForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: current * 1000 });
    }
  };

  const handleClearAmount = () => {
    if (activeTab === 'EXPENSE' || activeTab === 'PAYMENT') {
      txForm.dispatch({ type: 'SET_AMOUNT', value: 0 });
    } else if (activeTab === 'SAVING') {
      savingForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: 0 });
    } else {
      piutangForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: 0 });
    }
  };

  // Select Card handler
  const handleSelectCard = (cardId: string) => {
    if (activeTab === 'EXPENSE' || activeTab === 'PAYMENT') {
      txForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: cardId });
    } else if (activeTab === 'SAVING') {
      savingForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: cardId });
    } else {
      piutangForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: cardId });
    }
    setIsCardPickerOpen(false);
  };

  // Open Extra Options sub-sheet
  const handleOpenExtraOptions = () => {
    setDraftIsInstallment(txForm.state.isInstallment);
    const initialT = txForm.state.installmentMonths || 12;
    setDraftTenor(initialT);
    const isPreset = (QUICK_TENORS as readonly number[]).includes(initialT);
    setIsCustomTenorOpen(!isPreset);
    setCustomTenorInput(!isPreset ? String(initialT) : '');

    setDraftOwner(txForm.state.owner);
    const totalAmt = txForm.state.amount || 0;
    const currentP = txForm.state.splitPersonal;
    const currentB = txForm.state.splitBusiness;
    if (currentP > 0 || currentB > 0) {
      setDraftSplitPersonal(currentP);
      setDraftSplitBusiness(currentB);
    } else {
      const half = Math.floor(totalAmt / 2);
      setDraftSplitPersonal(half);
      setDraftSplitBusiness(totalAmt - half);
    }

    setIsExtraOptionsOpen(true);
  };

  // Apply both Cicilan and Split from sub-sheet
  const handleApplyExtraOptions = () => {
    txForm.dispatch({ type: 'SET_FIELD', field: 'isInstallment', value: draftIsInstallment });
    txForm.dispatch({ type: 'SET_FIELD', field: 'installmentMonths', value: draftTenor });
    txForm.dispatch({ type: 'SET_FIELD', field: 'owner', value: draftOwner });
    txForm.dispatch({ type: 'SET_SPLIT_PERSONAL', value: draftSplitPersonal });
    txForm.dispatch({ type: 'SET_SPLIT_BUSINESS', value: draftSplitBusiness });
    setIsExtraOptionsOpen(false);
  };

  // Auto-calculate split remaining
  const handlePersonalSplitChange = (val: number) => {
    const totalAmt = txForm.state.amount || 0;
    setDraftSplitPersonal(val);
    setDraftSplitBusiness(Math.max(0, totalAmt - val));
  };

  const handleBusinessSplitChange = (val: number) => {
    const totalAmt = txForm.state.amount || 0;
    setDraftSplitBusiness(val);
    setDraftSplitPersonal(Math.max(0, totalAmt - val));
  };

  const handleSplitEvenly = () => {
    const totalAmt = txForm.state.amount || 0;
    const half = Math.floor(totalAmt / 2);
    setDraftSplitPersonal(half);
    setDraftSplitBusiness(totalAmt - half);
  };

  const draftSplitSum = draftSplitPersonal + draftSplitBusiness;
  const isDraftSplitMismatch =
    draftOwner === OwnerType.SPLIT && draftSplitSum !== txForm.state.amount;

  const sheetTitle = isEditing
    ? editingTransaction
      ? 'Ubah Transaksi'
      : editingSaving
      ? 'Ubah Tabungan'
      : 'Ubah Piutang'
    : 'Catat Baru';

  const submitButtonLabel = isEditing
    ? 'Simpan Perubahan'
    : activeTab === 'EXPENSE'
    ? txForm.state.isInstallment
      ? 'Proses Cicilan Baru'
      : 'Catat Pengeluaran'
    : activeTab === 'PAYMENT'
    ? 'Catat Pembayaran'
    : activeTab === 'SAVING'
    ? 'Catat Tabungan'
    : 'Catat Piutang';

  const submitButtonBg =
    activeTab === 'EXPENSE'
      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
      : activeTab === 'PAYMENT'
      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
      : activeTab === 'SAVING'
      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25';

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] h-dvh max-h-dvh flex flex-col bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden select-none animate-in fade-in duration-200"
      style={{
        paddingTop: 'var(--sat, 0px)'
      }}
    >
      {/* 1. HEADER (shrink-0) */}
      <header className="shrink-0 h-14 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
          {sheetTitle}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Catat Baru"
          className="min-h-[44px] min-w-[44px] -mr-2 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-90 transition-all cursor-pointer"
        >
          <X size={22} />
        </button>
      </header>

      {/* 2. SEGMENTED TABS (shrink-0) */}
      {!isEditing && (
        <div className="shrink-0 px-4 pt-3 pb-2.5 bg-white dark:bg-slate-950">
          <div className="grid grid-cols-4 gap-2">
            {/* Tab 1: Pakai (Merah / Danger) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('EXPENSE');
                txForm.dispatch({ type: 'SET_TYPE', value: TransactionType.EXPENSE });
              }}
              className={`min-h-[44px] px-2 py-2 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-[13px] font-bold cursor-pointer active:scale-95 ${
                activeTab === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <ArrowUpCircle size={15} />
              <span>Pakai</span>
            </button>

            {/* Tab 2: Bayar (Hijau / Success) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('PAYMENT');
                txForm.dispatch({ type: 'SET_TYPE', value: TransactionType.PAYMENT });
              }}
              className={`min-h-[44px] px-2 py-2 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-[13px] font-bold cursor-pointer active:scale-95 ${
                activeTab === 'PAYMENT'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <ArrowDownCircle size={15} />
              <span>Bayar</span>
            </button>

            {/* Tab 3: Nabung (Biru / Primary) */}
            <button
              type="button"
              onClick={() => setActiveTab('SAVING')}
              className={`min-h-[44px] px-2 py-2 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-[13px] font-bold cursor-pointer active:scale-95 ${
                activeTab === 'SAVING'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <Vault size={15} />
              <span>Nabung</span>
            </button>

            {/* Tab 4: Piutang (Ungu / Indigo) */}
            <button
              type="button"
              onClick={() => setActiveTab('PIUTANG')}
              className={`min-h-[44px] px-2 py-2 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-[13px] font-bold cursor-pointer active:scale-95 ${
                activeTab === 'PIUTANG'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <HandCoins size={15} />
              <span>Piutang</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SCROLLABLE BODY (flex-1 min-h-0 overflow-y-auto overscroll-contain) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2 space-y-3.5 no-scrollbar">
        {/* ==================================================== */}
        {/* TAB 1: PAKAI (PENGELUARAN)                           */}
        {/* ==================================================== */}
        {activeTab === 'EXPENSE' && (
          <form id="form-expense" onSubmit={handleSubmitExpense} noValidate className="space-y-3">
            {/* 1. Nominal Pemakaian Card */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 block">
                Nominal Pemakaian
              </label>

              <div className="relative bg-slate-50 dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-center focus-within:border-rose-500 transition-all">
                <span className="text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-500 mr-1.5 select-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={txForm.state.amount > 0 ? formatNumberIDR(txForm.state.amount) : ''}
                  onChange={(e) => txForm.dispatch({ type: 'SET_AMOUNT', value: parseIDR(e.target.value) })}
                  placeholder="0"
                  autoFocus={!isEditing}
                  style={{ fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)' }}
                  className="w-full font-black text-center outline-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 min-h-[46px]"
                />
                {txForm.state.amount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAmount}
                    aria-label="Bersihkan nominal"
                    className="min-h-[44px] min-w-[44px] -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <RotateCcw size={17} />
                  </button>
                )}
              </div>

              {/* Quick Increment Chips (40px height) */}
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleAddAmount(10000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +10rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(50000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +50rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(100000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +100rb
                </button>
                <button
                  type="button"
                  onClick={handleMultiplyThousand}
                  disabled={!txForm.state.amount}
                  className="h-10 min-h-[40px] px-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 disabled:opacity-40 text-rose-600 dark:text-rose-400 text-xs font-black rounded-xl transition-all border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center cursor-pointer"
                >
                  000
                </button>
              </div>
            </div>

            {/* 2. Kartu (Compact Row with "Ganti") */}
            <div
              onClick={() => setIsCardPickerOpen(true)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: selectedCard?.color || '#3b82f6' }}
                >
                  {selectedCard?.logoUrl ? (
                    <img src={selectedCard.logoUrl} alt={selectedCard.name} className="w-6 h-6 object-contain rounded-md" />
                  ) : (
                    <CardIcon size={18} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedCard?.name || 'Pilih Kartu'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedCard?.dueDay ? `Jatuh tempo tgl ${selectedCard.dueDay}` : 'Bebas tempo'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCardPickerOpen(true);
                }}
                className="text-xs font-bold text-primary dark:text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-0.5 cursor-pointer"
              >
                Ganti &rsaquo;
              </button>
            </div>

            {/* 3. Keterangan (Compact Row with Clear + Suggestions) */}
            <div className="space-y-1.5">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-3 focus-within:border-rose-500 transition">
                <Tag size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={txForm.state.description}
                  onChange={(e) => txForm.dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                  placeholder="Keterangan transaksi (misal: Makan siang)"
                  className="w-full bg-transparent outline-none text-base font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-h-[38px]"
                />
                {txForm.state.description && (
                  <button
                    type="button"
                    onClick={() => txForm.dispatch({ type: 'SET_FIELD', field: 'description', value: '' })}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Suggestions chips row */}
              {descriptionHistory.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
                  {Array.from(new Set(descriptionHistory))
                    .slice(0, 8)
                    .map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => txForm.dispatch({ type: 'SET_FIELD', field: 'description', value: item })}
                        className="shrink-0 px-3 py-1 bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-200/50 dark:border-slate-700/50 cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* 4. Tanggal (Compact Row with Hari Ini / Kemarin / Pilih Native) */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400 shrink-0" />

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: todayStr })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txForm.state.date === todayStr
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Hari ini
                  </button>

                  <button
                    type="button"
                    onClick={() => txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: yesterdayStr })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txForm.state.date === yesterdayStr
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Kemarin
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      nativeDateInputRef.current?.showPicker?.();
                      nativeDateInputRef.current?.focus();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txForm.state.date !== todayStr && txForm.state.date !== yesterdayStr
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Pilih...
                  </button>

                  {/* Native Hidden Date Input */}
                  <input
                    ref={nativeDateInputRef}
                    type="date"
                    value={txForm.state.date}
                    onChange={(e) => e.target.value && txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: e.target.value })}
                    className="sr-only"
                    tabIndex={-1}
                  />
                </div>
              </div>

              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {formatDateID(txForm.state.date)}
              </span>
            </div>

            {/* 5. Opsi Tambahan (Buka Sub-sheet) */}
            <div
              onClick={handleOpenExtraOptions}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sliders size={18} className="text-slate-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    Opsi tambahan • Cicilan &amp; Split
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">
                    {txForm.state.isInstallment && txForm.state.owner === OwnerType.SPLIT
                      ? `Cicilan ${txForm.state.installmentMonths}x & Split Aktif`
                      : txForm.state.isInstallment
                      ? `Cicilan ${txForm.state.installmentMonths}x Aktif`
                      : txForm.state.owner === OwnerType.SPLIT
                      ? 'Split Pribadi/Bisnis Aktif'
                      : txForm.state.owner === OwnerType.BUSINESS
                      ? 'Kepemilikan Bisnis'
                      : 'Atur tenor cicilan & alokasi kepemilikan'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                {(txForm.state.isInstallment || txForm.state.owner === OwnerType.SPLIT) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                    Aktif
                  </span>
                )}
                <span className="text-xs font-bold text-primary dark:text-blue-400">
                  Atur &rsaquo;
                </span>
              </div>
            </div>

            {/* 6. Status Pencocokan Transaksi (Match dengan e-Statement) */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    txForm.state.isValidated
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Check size={16} strokeWidth={3} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Pencocokan Transaksi (Match)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {txForm.state.isValidated
                      ? 'Sudah dicocokkan dengan tagihan bank'
                      : 'Tandai transaksi langsung cocok'}
                  </span>
                </div>
              </div>
              <Toggle
                checked={txForm.state.isValidated}
                onChange={(val) => txForm.dispatch({ type: 'SET_FIELD', field: 'isValidated', value: val })}
              />
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* TAB 2: BAYAR (PELUNASAN TAGIHAN)                     */}
        {/* ==================================================== */}
        {activeTab === 'PAYMENT' && (
          <form id="form-payment" onSubmit={handleSubmitPayment} noValidate className="space-y-3">
            {/* 1. Nominal Pembayaran Card */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 block">
                Nominal Pembayaran
              </label>

              <div className="relative bg-slate-50 dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-center focus-within:border-emerald-500 transition-all">
                <span className="text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-500 mr-1.5 select-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={txForm.state.amount > 0 ? formatNumberIDR(txForm.state.amount) : ''}
                  onChange={(e) => txForm.dispatch({ type: 'SET_AMOUNT', value: parseIDR(e.target.value) })}
                  placeholder="0"
                  autoFocus={!isEditing}
                  style={{ fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)' }}
                  className="w-full font-black text-center outline-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 min-h-[46px]"
                />
                {txForm.state.amount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAmount}
                    aria-label="Bersihkan nominal"
                    className="min-h-[44px] min-w-[44px] -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <RotateCcw size={17} />
                  </button>
                )}
              </div>

              {/* Quick Increment Chips: +100rb, +500rb, +1jt, 000 */}
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleAddAmount(100000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +100rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(500000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +500rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(1000000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +1jt
                </button>
                <button
                  type="button"
                  onClick={handleMultiplyThousand}
                  disabled={!txForm.state.amount}
                  className="h-10 min-h-[40px] px-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95 disabled:opacity-40 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl transition-all border border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-center cursor-pointer"
                >
                  000
                </button>
              </div>
            </div>

            {/* 2. Kartu (Compact Row with "Ganti") */}
            <div
              onClick={() => setIsCardPickerOpen(true)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: selectedCard?.color || '#3b82f6' }}
                >
                  {selectedCard?.logoUrl ? (
                    <img src={selectedCard.logoUrl} alt={selectedCard.name} className="w-6 h-6 object-contain rounded-md" />
                  ) : (
                    <CardIcon size={18} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedCard?.name || 'Pilih Kartu'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Tagihan {MONTH_NAMES[txForm.state.targetMonth]} {txForm.state.targetYear}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCardPickerOpen(true);
                }}
                className="text-xs font-bold text-primary dark:text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-0.5 cursor-pointer"
              >
                Ganti &rsaquo;
              </button>
            </div>

            {/* 3. Stepper Periode Tagihan ‹ Nov 2026 › */}
            <PeriodPicker
              month={txForm.state.targetMonth}
              year={txForm.state.targetYear}
              onChange={({ month, year }) => {
                txForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: month });
                txForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: year });
              }}
              label="Periode Tagihan Yang Dibayar"
            />

            {/* 4. Baris Estimasi Tagihan + Toggle Gunakan Tabungan */}
            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Estimasi Tagihan</span>
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {formatIDR(currentBillEstimate)}
                </span>
              </div>

              {/* Toggle Gunakan Tabungan */}
              <Toggle
                checked={txForm.state.useSavings}
                onChange={(checked) => {
                  txForm.dispatch({ type: 'SET_FIELD', field: 'useSavings', value: checked });
                  if (checked) {
                    setCustomSavingsAmount(defaultSavingsUsage);
                  }
                }}
                label="Gunakan Tabungan"
                description={`Saldo: ${formatIDR(availableSavingsForPeriod)}`}
                icon={<Vault size={20} />}
                activeColor="bg-emerald-500"
              />

              {/* Kolom jumlah tabungan yang bisa diubah */}
              {txForm.state.useSavings && availableSavingsForPeriod > 0 && (
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Jumlah Tabungan Digunakan
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomSavingsAmount(defaultSavingsUsage)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Default ({formatIDR(defaultSavingsUsage)})
                    </button>
                  </div>

                  <div className="relative flex items-center bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <span className="text-sm font-bold text-slate-400 mr-2 select-none">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={effectiveSavingsUsed > 0 ? formatNumberIDR(effectiveSavingsUsed) : ''}
                      onChange={(e) => setCustomSavingsAmount(parseIDR(e.target.value))}
                      placeholder={formatNumberIDR(defaultSavingsUsage)}
                      className="w-full bg-transparent font-bold text-base outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-1 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Pengurangan Hutang (+Tabungan)
                    </span>
                    <span className="text-lg font-black text-emerald-500">
                      {formatIDR(totalPaymentImpact)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Tanggal Pembayaran Row */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400 shrink-0" />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: todayStr })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txForm.state.date === todayStr ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Hari ini
                  </button>
                  <button
                    type="button"
                    onClick={() => txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: yesterdayStr })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txForm.state.date === yesterdayStr ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Kemarin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      nativeDateInputRef.current?.showPicker?.();
                      nativeDateInputRef.current?.focus();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txForm.state.date !== todayStr && txForm.state.date !== yesterdayStr
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Pilih...
                  </button>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {formatDateID(txForm.state.date)}
              </span>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* TAB 3: NABUNG (TABUNGAN)                             */}
        {/* ==================================================== */}
        {activeTab === 'SAVING' && (
          <form id="form-saving" onSubmit={handleSubmitSaving} noValidate className="space-y-3">
            {/* 1. Nominal Tabungan Card */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 block">
                Nominal Tabungan
              </label>

              <div className="relative bg-slate-50 dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-center focus-within:border-blue-600 transition-all">
                <span className="text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-500 mr-1.5 select-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={savingForm.state.amount > 0 ? formatNumberIDR(savingForm.state.amount) : ''}
                  onChange={(e) => savingForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: parseIDR(e.target.value) })}
                  placeholder="0"
                  autoFocus={!isEditing}
                  style={{ fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)' }}
                  className="w-full font-black text-center outline-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 min-h-[46px]"
                />
                {savingForm.state.amount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAmount}
                    aria-label="Bersihkan nominal"
                    className="min-h-[44px] min-w-[44px] -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <RotateCcw size={17} />
                  </button>
                )}
              </div>

              {/* Quick Increment Chips: +100rb, +500rb, +1jt, 000 */}
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleAddAmount(100000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +100rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(500000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +500rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(1000000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +1jt
                </button>
                <button
                  type="button"
                  onClick={handleMultiplyThousand}
                  disabled={!savingForm.state.amount}
                  className="h-10 min-h-[40px] px-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95 disabled:opacity-40 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl transition-all border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center cursor-pointer"
                >
                  000
                </button>
              </div>
            </div>

            {/* 2. Tabungan Tujuan (+ "Ganti") */}
            <div
              onClick={() => setIsCardPickerOpen(true)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: selectedCard?.color || '#3b82f6' }}
                >
                  <Vault size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-400">Ke Tabungan</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedCard?.name || 'Pilih Tabungan Tujuan'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCardPickerOpen(true);
                }}
                className="text-xs font-bold text-primary dark:text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-0.5 cursor-pointer"
              >
                Ganti &rsaquo;
              </button>
            </div>

            {/* 3. Target / Periode Stepper */}
            <PeriodPicker
              month={savingForm.state.targetMonth}
              year={savingForm.state.targetYear}
              onChange={({ month, year }) => {
                savingForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: month });
                savingForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: year });
              }}
              label="Target / Periode"
            />

            {/* 4. Keterangan (Opsional) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 block">
                Keterangan (Opsional)
              </label>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-3 focus-within:border-blue-600 transition">
                <Tag size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={savingForm.state.note}
                  onChange={(e) => savingForm.dispatch({ type: 'SET_FIELD', field: 'note', value: e.target.value })}
                  placeholder="Keterangan (opsional, misal: Dari bonus / sisa gaji)"
                  className="w-full bg-transparent outline-none text-base font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-h-[38px]"
                />
                {savingForm.state.note && (
                  <button
                    type="button"
                    onClick={() => savingForm.dispatch({ type: 'SET_FIELD', field: 'note', value: '' })}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* TAB 4: PIUTANG                                       */}
        {/* ==================================================== */}
        {activeTab === 'PIUTANG' && (
          <form id="form-piutang" onSubmit={handleSubmitPiutang} noValidate className="space-y-3">
            {/* 1. Nominal Piutang Card */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 block">
                Nominal Piutang
              </label>

              <div className="relative bg-slate-50 dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-center focus-within:border-purple-600 transition-all">
                <span className="text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-500 mr-1.5 select-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={piutangForm.state.amount > 0 ? formatNumberIDR(piutangForm.state.amount) : ''}
                  onChange={(e) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: parseIDR(e.target.value) })}
                  placeholder="0"
                  autoFocus={!isEditing}
                  style={{ fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)' }}
                  className="w-full font-black text-center outline-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 min-h-[46px]"
                />
                {piutangForm.state.amount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAmount}
                    aria-label="Bersihkan nominal"
                    className="min-h-[44px] min-w-[44px] -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <RotateCcw size={17} />
                  </button>
                )}
              </div>

              {/* Quick Increment Chips: +100rb, +500rb, +1jt, 000 */}
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleAddAmount(100000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +100rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(500000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +500rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(1000000)}
                  className="h-10 min-h-[40px] px-2 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 flex items-center justify-center cursor-pointer"
                >
                  +1jt
                </button>
                <button
                  type="button"
                  onClick={handleMultiplyThousand}
                  disabled={!piutangForm.state.amount}
                  className="h-10 min-h-[40px] px-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 active:scale-95 disabled:opacity-40 text-purple-600 dark:text-purple-400 text-xs font-black rounded-xl transition-all border border-purple-200/60 dark:border-purple-900/60 flex items-center justify-center cursor-pointer"
                >
                  000
                </button>
              </div>
            </div>

            {/* 2. Nama Peminjam */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 block">
                Nama Peminjam
              </label>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-3 focus-within:border-purple-600 transition">
                <User size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  required
                  value={piutangForm.state.debtor}
                  onChange={(e) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'debtor', value: e.target.value })}
                  placeholder="Nama peminjam (misal: Budi)"
                  className="w-full bg-transparent outline-none text-base font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-h-[38px]"
                />
                {piutangForm.state.debtor && (
                  <button
                    type="button"
                    onClick={() => piutangForm.dispatch({ type: 'SET_FIELD', field: 'debtor', value: '' })}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Kartu Alokasi Row */}
            <div
              onClick={() => setIsCardPickerOpen(true)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: selectedCard?.color || '#3b82f6' }}
                >
                  {selectedCard?.logoUrl ? (
                    <img src={selectedCard.logoUrl} alt={selectedCard.name} className="w-6 h-6 object-contain rounded-md" />
                  ) : (
                    <CardIcon size={18} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-400">Alokasi Kartu</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedCard?.name || 'Pilih Kartu'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCardPickerOpen(true);
                }}
                className="text-xs font-bold text-primary dark:text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-0.5 cursor-pointer"
              >
                Ganti &rsaquo;
              </button>
            </div>

            {/* 4. Target / Periode Stepper */}
            <PeriodPicker
              month={piutangForm.state.targetMonth}
              year={piutangForm.state.targetYear}
              onChange={({ month, year }) => {
                piutangForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: month });
                piutangForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: year });
              }}
              label="Target / Periode"
            />

            {/* 5. Cicilan Toggle */}
            <div className="space-y-2">
              <Toggle
                checked={piutangForm.state.isInstallment}
                onChange={(checked) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'isInstallment', value: checked })}
                label="Cicilan"
                description="Atur tenor cicilan bulanan"
                icon={<Zap size={20} />}
                activeColor="bg-purple-600"
              />

              {piutangForm.state.isInstallment && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-150">
                  <TenorChips
                    months={piutangForm.state.installmentMonths}
                    onChange={(m) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'installmentMonths', value: m })}
                    totalAmount={piutangForm.state.amount}
                    label="Durasi Cicilan (Tenor)"
                  />
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* 4. FOOTER (shrink-0, border-t, pb-[calc(0.75rem+env(safe-area-inset-bottom))]) */}
      <footer
        className="shrink-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-4 space-y-2 z-20"
        style={{
          paddingBottom: isKeyboardVisible ? '12px' : 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
          transform: isKeyboardVisible && keyboardHeight > 0 ? `translateY(-${Math.min(keyboardHeight, 10)}px)` : undefined
        }}
      >
        {!currentIsValid && currentInvalidMessage && (
          <div className="text-center animate-in fade-in duration-200">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {currentInvalidMessage}
            </p>
          </div>
        )}

        <button
          type="submit"
          form={
            activeTab === 'EXPENSE'
              ? 'form-expense'
              : activeTab === 'PAYMENT'
              ? 'form-payment'
              : activeTab === 'SAVING'
              ? 'form-saving'
              : 'form-piutang'
          }
          disabled={!currentIsValid}
          className={`w-full min-h-[50px] py-3.5 text-white font-black text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            !currentIsValid
              ? 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700 shadow-none'
              : `${submitButtonBg} active:scale-[0.98]`
          }`}
        >
          <span>{submitButtonLabel}</span>
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={() => {
              if (editingTransaction && onDeleteTransaction) onDeleteTransaction(editingTransaction.id);
              else if (editingSaving && onDeleteSaving) onDeleteSaving(editingSaving.id);
              else if (editingPiutang && onDeletePiutang) onDeletePiutang(editingPiutang.id);
              onClose();
            }}
            className="w-full min-h-[44px] py-2 font-bold text-xs rounded-xl bg-red-50 dark:bg-red-950/30 text-rose-600 dark:text-rose-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all cursor-pointer"
          >
            Hapus Catatan Ini
          </button>
        )}
      </footer>

      {/* SUB-SHEET 1: PILIH KARTU (Compact modal from image) */}
      {isCardPickerOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end animate-in fade-in duration-150">
          <div
            onClick={() => setIsCardPickerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-[32px] p-5 shadow-2xl z-10 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom duration-250 max-h-[75dvh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Pilih Kartu
              </h3>
              <button
                type="button"
                onClick={() => setIsCardPickerOpen(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain py-3 space-y-2 no-scrollbar">
              {cards.map((c) => {
                const isSelected = c.id === selectedCard?.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCard(c.id)}
                    className={`w-full min-h-[56px] p-3 rounded-2xl flex items-center justify-between border-2 transition-all active:scale-[0.99] text-left cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-blue-50/50 dark:bg-blue-900/20'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: c.color || '#3b82f6' }}
                      >
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="w-6 h-6 object-contain rounded-md" />
                        ) : (
                          <CardIcon size={18} />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {c.name}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {c.dueDay ? `Jatuh tempo tgl ${c.dueDay}` : 'Bebas tempo'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                        isSelected
                          ? 'bg-primary border-primary text-white shadow-xs'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SHEET 2: OPSI TAMBAHAN (Cicilan & Split Non-Eksklusif) */}
      {isExtraOptionsOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end animate-in fade-in duration-150">
          <div
            onClick={() => setIsExtraOptionsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl z-10 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom duration-250 max-h-[85dvh] flex flex-col overflow-hidden">
            {/* Header Sub-Sheet */}
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Opsi Tambahan
              </h3>
              <button
                type="button"
                onClick={() => setIsExtraOptionsOpen(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5 no-scrollbar">
              {/* SEKSI 1: CICILAN */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Konversi Cicilan
                  </h4>
                </div>

                <Toggle
                  checked={draftIsInstallment}
                  onChange={setDraftIsInstallment}
                  label="Aktifkan Cicilan"
                  description="Pecah pembayaran tagihan menjadi angsuran bulanan"
                  icon={<Zap size={20} />}
                  activeColor="bg-indigo-600"
                />

                {draftIsInstallment && (
                  <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                      Tenor Cicilan
                    </label>

                    {/* Chips: 3x, 6x, 12x, 18x, 24x, 36x + Lainnya... */}
                    <div className="grid grid-cols-4 gap-2">
                      {QUICK_TENORS.map((m) => {
                        const isSelected = draftTenor === m && !isCustomTenorOpen;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setDraftTenor(m);
                              setIsCustomTenorOpen(false);
                            }}
                            className={`min-h-[44px] py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02]'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {m}x
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setIsCustomTenorOpen(true)}
                        className={`min-h-[44px] py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCustomTenorOpen
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02]'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        Lainnya...
                      </button>
                    </div>

                    {/* Input Tenor Custom */}
                    {isCustomTenorOpen && (
                      <div className="pt-1 space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 block">
                          Masukkan Durasi Bulan (2 – 60 bulan)
                        </label>
                        <input
                          type="number"
                          min={2}
                          max={60}
                          value={customTenorInput}
                          onChange={(e) => {
                            setCustomTenorInput(e.target.value);
                            const parsed = parseInt(e.target.value, 10);
                            if (!isNaN(parsed) && parsed >= 2 && parsed <= 60) {
                              setDraftTenor(parsed);
                            }
                          }}
                          placeholder="Misal: 9"
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm outline-none focus:border-indigo-600 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    )}

                    {/* Calculation Card (Estimasi & Mulai-Selesai) */}
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Estimasi per bulan
                        </span>
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                          {formatIDR(Math.ceil((txForm.state.amount || 0) / (draftTenor || 1)))}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {formatStartEndMonth(txForm.state.date, draftTenor)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SEKSI 2: KEPEMILIKAN (PRIBADI / BISNIS / SPLIT) */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Scale size={18} className="text-purple-600 dark:text-purple-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Kepemilikan Transaksi
                  </h4>
                </div>

                <SegmentedControl
                  value={draftOwner}
                  onChange={setDraftOwner}
                  options={[
                    { value: OwnerType.PERSONAL, label: 'Pribadi', activeColor: 'bg-blue-600 text-white shadow-sm' },
                    { value: OwnerType.BUSINESS, label: 'Bisnis', activeColor: 'bg-purple-600 text-white shadow-sm' },
                    { value: OwnerType.SPLIT, label: 'Split', activeColor: 'bg-orange-500 text-white shadow-sm' }
                  ]}
                />

                {draftOwner === OwnerType.SPLIT && (
                  <div className="pt-2 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Pembagian Tagihan
                      </label>
                      <button
                        type="button"
                        onClick={handleSplitEvenly}
                        className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                      >
                        Bagi Rata (50:50)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 block text-center">
                          Pribadi
                        </label>
                        <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-2 py-1.5 focus-within:border-blue-500">
                          <span className="text-xs font-bold text-slate-400 mr-1 select-none">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={draftSplitPersonal > 0 ? formatNumberIDR(draftSplitPersonal) : ''}
                            onChange={(e) => handlePersonalSplitChange(parseIDR(e.target.value))}
                            placeholder="0"
                            className="w-full text-center font-bold text-sm outline-none bg-transparent text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 block text-center">
                          Bisnis
                        </label>
                        <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-2 py-1.5 focus-within:border-purple-500">
                          <span className="text-xs font-bold text-slate-400 mr-1 select-none">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={draftSplitBusiness > 0 ? formatNumberIDR(draftSplitBusiness) : ''}
                            onChange={(e) => handleBusinessSplitChange(parseIDR(e.target.value))}
                            placeholder="0"
                            className="w-full text-center font-bold text-sm outline-none bg-transparent text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {isDraftSplitMismatch && (
                      <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                        <AlertCircle size={16} className="shrink-0 text-amber-600" />
                        <span>
                          Total Split ({formatIDR(draftSplitSum)}) harus sama dengan nominal transaksi ({formatIDR(txForm.state.amount)})
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Sub-Sheet: Tombol Terapkan */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
              <button
                type="button"
                onClick={handleApplyExtraOptions}
                disabled={isDraftSplitMismatch}
                className="w-full min-h-[50px] py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={18} strokeWidth={2.5} />
                <span>Terapkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
};
