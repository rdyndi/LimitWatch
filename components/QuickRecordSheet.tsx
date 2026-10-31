import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard as CreditCardType,
  Transaction,
  TransactionType,
  OwnerType,
  Saving,
  Piutang as PiutangType
} from '../types';
import {
  BottomSheet,
  MoneyInput,
  PeriodPicker,
  CardPicker,
  DatePickerChips,
  TenorChips,
  DescriptionSuggestions,
  SegmentedControl,
  Toggle,
  StickyActionBar
} from './ui';
import {
  useTransactionForm,
  useSavingForm,
  usePiutangForm
} from '../hooks/useFormReducers';
import { SaveTransactionPayload } from '../hooks/useTransactionService';
import { formatIDR, formatNumberIDR, parseIDR } from '../lib/format';
import { MONTH_NAMES } from '../lib/constants';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Vault,
  HandCoins,
  Zap,
  Info,
  ChevronRight,
  Check,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export type QuickRecordTab = 'EXPENSE' | 'PAYMENT' | 'SAVING' | 'PIUTANG';

export interface QuickRecordSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: QuickRecordTab;
  editingTransaction?: Transaction | null;
  editingSaving?: Saving | null;
  editingPiutang?: PiutangType | null;
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
  const defaultCard = lastUsedCardId || cards[0]?.id || '';

  const [activeTab, setActiveTab] = useState<QuickRecordTab>(initialTab);
  const [viewMode, setViewMode] = useState<'MAIN' | 'OPTIONS'>('MAIN');

  // Form Reducers
  const txForm = useTransactionForm(defaultCard);
  const savingForm = useSavingForm(defaultCard);
  const piutangForm = usePiutangForm(defaultCard);

  const isEditing = !!(editingTransaction || editingSaving || editingPiutang);

  // Sync state when sheet opens or editing item changes
  useEffect(() => {
    if (!isOpen) return;

    setViewMode('MAIN');

    if (editingTransaction) {
      txForm.dispatch({ type: 'LOAD_ITEM', item: editingTransaction });
      setActiveTab(editingTransaction.type === TransactionType.PAYMENT ? 'PAYMENT' : 'EXPENSE');
      if (editingTransaction.isInstallment || editingTransaction.owner === OwnerType.SPLIT) {
        setViewMode('OPTIONS');
      }
    } else if (editingSaving) {
      savingForm.dispatch({ type: 'LOAD_ITEM', item: editingSaving });
      setActiveTab('SAVING');
    } else if (editingPiutang) {
      piutangForm.dispatch({ type: 'LOAD_ITEM', item: editingPiutang });
      setActiveTab('PIUTANG');
    } else {
      // New record mode
      setActiveTab(initialTab);
      txForm.dispatch({ type: 'RESET', defaultCardId: defaultCard });
      if (initialTab === 'PAYMENT') {
        txForm.dispatch({ type: 'SET_TYPE', value: TransactionType.PAYMENT });
      }
      savingForm.dispatch({ type: 'RESET', defaultCardId: defaultCard });
      piutangForm.dispatch({ type: 'RESET', defaultCardId: defaultCard });
    }
  }, [isOpen, editingTransaction, editingSaving, editingPiutang, initialTab, defaultCard]);

  // Ensure cardId is valid if current cardId is empty
  useEffect(() => {
    if (cards.length > 0) {
      if (!txForm.state.cardId) txForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: defaultCard });
      if (!savingForm.state.cardId) savingForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: defaultCard });
      if (!piutangForm.state.cardId) piutangForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: defaultCard });
    }
  }, [cards, defaultCard]);

  const selectedCard = useMemo(() => {
    return cards.find((c) => c.id === txForm.state.cardId) || cards[0];
  }, [cards, txForm.state.cardId]);

  // Calculations for Payment tab
  const availableSavingsForPeriod = useMemo(() => {
    if (!txForm.state.cardId) return 0;
    return getAvailableSavings(txForm.state.cardId, txForm.state.targetMonth, txForm.state.targetYear);
  }, [txForm.state.cardId, txForm.state.targetMonth, txForm.state.targetYear, getAvailableSavings]);

  const currentBillEstimate = useMemo(() => {
    if (!txForm.state.cardId) return 0;
    return getBillEstimate(txForm.state.cardId, txForm.state.targetMonth, txForm.state.targetYear);
  }, [txForm.state.cardId, txForm.state.targetMonth, txForm.state.targetYear, getBillEstimate]);

  const totalPaymentImpact = Math.ceil(
    txForm.state.amount + (txForm.state.useSavings ? availableSavingsForPeriod : 0)
  );

  // Split calculation
  const splitTotal = txForm.state.splitPersonal + txForm.state.splitBusiness;
  const isSplitMismatch =
    activeTab === 'EXPENSE' &&
    txForm.state.owner === OwnerType.SPLIT &&
    splitTotal !== txForm.state.amount;

  const calculatedBusiness = Math.max(0, txForm.state.amount - txForm.state.splitPersonal);

  // Validation
  const isExpenseValid =
    !!txForm.state.cardId &&
    txForm.state.amount > 0 &&
    txForm.state.description.trim().length > 0 &&
    !isSplitMismatch;

  const isPaymentValid =
    !!txForm.state.cardId &&
    (txForm.state.amount > 0 || (txForm.state.useSavings && availableSavingsForPeriod > 0));

  const isSavingValid = !!savingForm.state.cardId && savingForm.state.amount > 0;

  const isPiutangValid =
    !!piutangForm.state.cardId &&
    piutangForm.state.amount > 0 &&
    piutangForm.state.debtor.trim().length > 0 &&
    (!piutangForm.state.isInstallment || piutangForm.state.installmentMonths > 1);

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
      splitPersonal: txForm.state.owner === OwnerType.SPLIT ? txForm.state.splitPersonal : 0,
      splitBusiness: txForm.state.owner === OwnerType.SPLIT ? calculatedBusiness : 0
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

  // Next installment start month name calculation
  const installmentStartText = useMemo(() => {
    const today = new Date();
    let m = today.getMonth();
    let y = today.getFullYear();
    if (selectedCard?.dueDay && today.getDate() >= selectedCard.dueDay) {
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return `Mulai ${MONTH_NAMES[m]} ${y}`;
  }, [selectedCard]);

  const monthlyInstallmentAmount = useMemo(() => {
    if (!txForm.state.installmentMonths || txForm.state.installmentMonths <= 0) return 0;
    return Math.ceil(txForm.state.amount / txForm.state.installmentMonths);
  }, [txForm.state.amount, txForm.state.installmentMonths]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} showHeader={false}>
      <div className="space-y-3">

        {/* ==================================================== */}
        {/* VIEW MODE 1: MAIN ONE-SCREEN FORM (NO SCROLLING!)    */}
        {/* ==================================================== */}
        {viewMode === 'MAIN' && (
          <>
            {/* Top Segmented Control (Pakai / Bayar / Nabung / Piutang) */}
            {!isEditing && (
              <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl select-none">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('EXPENSE');
                    txForm.dispatch({ type: 'SET_TYPE', value: TransactionType.EXPENSE });
                  }}
                  className={`min-h-[40px] rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    activeTab === 'EXPENSE'
                      ? 'bg-white dark:bg-slate-700 text-danger shadow-xs font-black'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Pakai
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('PAYMENT');
                    txForm.dispatch({ type: 'SET_TYPE', value: TransactionType.PAYMENT });
                  }}
                  className={`min-h-[40px] rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    activeTab === 'PAYMENT'
                      ? 'bg-white dark:bg-slate-700 text-success shadow-xs font-black'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Bayar
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('SAVING')}
                  className={`min-h-[40px] rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    activeTab === 'SAVING'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Nabung
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PIUTANG')}
                  className={`min-h-[40px] rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    activeTab === 'PIUTANG'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Piutang
                </button>
              </div>
            )}

            {/* TAB 1: PAKAI (MAIN EXPENSE VIEW) */}
            {activeTab === 'EXPENSE' && (
              <form onSubmit={handleSubmitExpense} className="space-y-3">
                {/* Nominal Pemakaian */}
                <MoneyInput
                  value={txForm.state.amount}
                  onChange={(val) => {
                    txForm.dispatch({ type: 'SET_AMOUNT', value: val });
                    if (txForm.state.owner === OwnerType.SPLIT) {
                      txForm.dispatch({ type: 'SET_SPLIT_PERSONAL', value: Math.ceil(val / 2) });
                    }
                  }}
                  color="danger"
                  variant="underline"
                  label="Nominal pemakaian"
                  autoFocus={!isEditing}
                />

                {/* Kartu / sumber dana */}
                <CardPicker
                  cards={cards}
                  value={txForm.state.cardId}
                  onChange={(id) => txForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: id })}
                  lastUsedCardId={lastUsedCardId}
                  label="Kartu / sumber dana"
                />

                {/* Keterangan */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={txForm.state.description}
                    onChange={(e) => txForm.dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                    placeholder="Makan siang tim..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-100/80 dark:bg-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-danger/50 font-semibold text-sm transition"
                  />
                  <DescriptionSuggestions
                    history={descriptionHistory}
                    onSelect={(val) => txForm.dispatch({ type: 'SET_FIELD', field: 'description', value: val })}
                    currentValue={txForm.state.description}
                  />
                </div>

                {/* Tanggal */}
                <DatePickerChips
                  value={txForm.state.date}
                  onChange={(d) => txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: d })}
                  label="Tanggal"
                />

                {/* Dashed Button for "Opsi lainnya · cicilan, pribadi/bisnis >" */}
                <button
                  type="button"
                  onClick={() => setViewMode('OPTIONS')}
                  className="w-full min-h-[46px] px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors active:scale-98 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Opsi lainnya</span>
                    <span className="text-slate-400 font-normal">· cicilan, pribadi/bisnis</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>

                {/* Sticky Action Button */}
                <StickyActionBar
                  primaryLabel={isEditing ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
                  isValid={isExpenseValid}
                  color="danger"
                  invalidMessage={
                    txForm.state.amount <= 0
                      ? 'Masukkan nominal pemakaian'
                      : !txForm.state.description.trim()
                      ? 'Isi keterangan transaksi'
                      : undefined
                  }
                  secondaryLabel={isEditing && onDeleteTransaction && editingTransaction ? 'Hapus' : undefined}
                  onSecondaryClick={
                    isEditing && onDeleteTransaction && editingTransaction
                      ? () => {
                          onDeleteTransaction(editingTransaction.id);
                          onClose();
                        }
                      : undefined
                  }
                  secondaryDanger
                />
              </form>
            )}

            {/* TAB 2: BAYAR */}
            {activeTab === 'PAYMENT' && (
              <form onSubmit={handleSubmitPayment} className="space-y-3">
                <MoneyInput
                  value={txForm.state.amount}
                  onChange={(val) => txForm.dispatch({ type: 'SET_AMOUNT', value: val })}
                  color="success"
                  variant="underline"
                  label="Nominal Pembayaran"
                  autoFocus={!isEditing}
                />

                <CardPicker
                  cards={cards}
                  value={txForm.state.cardId}
                  onChange={(id) => txForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: id })}
                  lastUsedCardId={lastUsedCardId}
                  label="Kartu Yang Dibayar"
                />

                <PeriodPicker
                  month={txForm.state.targetMonth}
                  year={txForm.state.targetYear}
                  onChange={({ month, year }) => {
                    txForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: month });
                    txForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: year });
                  }}
                  label="Target Bulan Tagihan"
                />

                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase">Estimasi Tagihan</span>
                    <span className="font-black text-slate-800 dark:text-slate-100">{formatIDR(currentBillEstimate)}</span>
                  </div>

                  <Toggle
                    checked={txForm.state.useSavings}
                    onChange={(checked) => txForm.dispatch({ type: 'SET_FIELD', field: 'useSavings', value: checked })}
                    label="Gunakan Tabungan Tersedia"
                    description={`Saldo tabungan: ${formatIDR(availableSavingsForPeriod)}`}
                    icon={<Vault size={18} />}
                    activeColor="bg-success"
                  />
                </div>

                <DatePickerChips
                  value={txForm.state.date}
                  onChange={(d) => txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: d })}
                  label="Tanggal Bayar"
                />

                <StickyActionBar
                  primaryLabel={isEditing ? 'Simpan Pembayaran' : 'Konfirmasi Pembayaran'}
                  isValid={isPaymentValid}
                  color="success"
                  invalidMessage={!isPaymentValid ? 'Masukkan nominal bayar' : undefined}
                />
              </form>
            )}

            {/* TAB 3: NABUNG */}
            {activeTab === 'SAVING' && (
              <form onSubmit={handleSubmitSaving} className="space-y-3">
                <MoneyInput
                  value={savingForm.state.amount}
                  onChange={(val) => savingForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: val })}
                  color="success"
                  variant="underline"
                  label="Dana Disisihkan"
                  autoFocus={!isEditing}
                />

                <CardPicker
                  cards={cards}
                  value={savingForm.state.cardId}
                  onChange={(id) => savingForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: id })}
                  lastUsedCardId={lastUsedCardId}
                  label="Alokasi Untuk Kartu"
                />

                <PeriodPicker
                  month={savingForm.state.targetMonth}
                  year={savingForm.state.targetYear}
                  onChange={({ month, year }) => {
                    savingForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: month });
                    savingForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: year });
                  }}
                  label="Target Periode Tagihan"
                />

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={savingForm.state.note}
                    onChange={(e) => savingForm.dispatch({ type: 'SET_FIELD', field: 'note', value: e.target.value })}
                    placeholder="Bonus / alokasi gaji..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-100/80 dark:bg-slate-800 dark:text-slate-100 rounded-2xl outline-none font-semibold text-sm transition"
                  />
                </div>

                <StickyActionBar
                  primaryLabel={isEditing ? 'Simpan Tabungan' : 'Amankan Tabungan'}
                  isValid={isSavingValid}
                  color="success"
                  invalidMessage={!isSavingValid ? 'Masukkan nominal tabungan' : undefined}
                />
              </form>
            )}

            {/* TAB 4: PIUTANG */}
            {activeTab === 'PIUTANG' && (
              <form onSubmit={handleSubmitPiutang} className="space-y-3">
                <MoneyInput
                  value={piutangForm.state.amount}
                  onChange={(val) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: val })}
                  color="indigo"
                  variant="underline"
                  label="Nominal Piutang"
                  autoFocus={!isEditing}
                />

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
                    Piutang Dari Siapa?
                  </label>
                  <input
                    type="text"
                    value={piutangForm.state.debtor}
                    onChange={(e) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'debtor', value: e.target.value })}
                    required
                    placeholder="Nama peminjam..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-100/80 dark:bg-slate-800 dark:text-slate-100 rounded-2xl outline-none font-bold text-sm transition"
                  />
                </div>

                <CardPicker
                  cards={cards}
                  value={piutangForm.state.cardId}
                  onChange={(id) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: id })}
                  lastUsedCardId={lastUsedCardId}
                  label="Alokasi Untuk Kartu"
                />

                <PeriodPicker
                  month={piutangForm.state.targetMonth}
                  year={piutangForm.state.targetYear}
                  onChange={({ month, year }) => {
                    piutangForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: month });
                    piutangForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: year });
                  }}
                  label="Target Periode Tagihan"
                />

                <StickyActionBar
                  primaryLabel={isEditing ? 'Simpan Piutang' : 'Catat Piutang'}
                  isValid={isPiutangValid}
                  color="indigo"
                  invalidMessage={!isPiutangValid ? 'Isi nama peminjam & nominal' : undefined}
                />
              </form>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* VIEW MODE 2: OPSI LAINNYA (CICILAN + SPLIT SUB-VIEW) */}
        {/* ==================================================== */}
        {viewMode === 'OPTIONS' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Summary Banner Card */}
            <div className="p-4 bg-red-50/80 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Pakai · {selectedCard?.name || 'Kartu'}
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatIDR(txForm.state.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('MAIN')}
                className="text-xs font-bold text-primary dark:text-blue-400 hover:underline px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
              >
                Ubah
              </button>
            </div>

            {/* Opsi Lainnya Title & Cicilan Checkbox Card */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
                Opsi lainnya
              </label>

              <div
                onClick={() => txForm.dispatch({ type: 'SET_FIELD', field: 'isInstallment', value: !txForm.state.isInstallment })}
                className="p-4 bg-blue-50/60 dark:bg-slate-800 rounded-2xl border border-blue-100 dark:border-slate-700 flex justify-between items-center cursor-pointer select-none hover:border-blue-300 transition"
              >
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Konversi ke cicilan
                </span>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  txForm.state.isInstallment ? 'bg-primary text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                }`}>
                  {txForm.state.isInstallment && <Check size={16} strokeWidth={3} />}
                </div>
              </div>
            </div>

            {/* Tenor Selection (only if Cicilan is enabled) */}
            {txForm.state.isInstallment && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <TenorChips
                  months={txForm.state.installmentMonths}
                  onChange={(m) => txForm.dispatch({ type: 'SET_FIELD', field: 'installmentMonths', value: m })}
                  totalAmount={txForm.state.amount}
                  label="Tenor (bulan)"
                />

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Angsuran per bulan</span>
                    <span className="text-lg font-black text-primary dark:text-blue-400">
                      {formatIDR(monthlyInstallmentAmount)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {installmentStartText}
                  </span>
                </div>
              </div>
            )}

            {/* Kepemilikan (Pribadi / Bisnis / Split) */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
                Kepemilikan
              </label>

              <SegmentedControl
                value={txForm.state.owner}
                onChange={(val) => {
                  txForm.dispatch({ type: 'SET_FIELD', field: 'owner', value: val });
                  if (val === OwnerType.SPLIT && txForm.state.splitPersonal === 0) {
                    txForm.dispatch({ type: 'SET_SPLIT_PERSONAL', value: Math.ceil(txForm.state.amount / 2) });
                  }
                }}
                options={[
                  { value: OwnerType.PERSONAL, label: 'Pribadi', activeColor: 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm font-black' },
                  { value: OwnerType.BUSINESS, label: 'Bisnis', activeColor: 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm font-black' },
                  { value: OwnerType.SPLIT, label: 'Split', activeColor: 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm font-black' }
                ]}
              />

              {txForm.state.owner === OwnerType.SPLIT && (
                <div className="pt-2 space-y-2 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block ml-1">Pribadi</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={txForm.state.splitPersonal > 0 ? formatNumberIDR(txForm.state.splitPersonal) : ''}
                        onChange={(e) => txForm.dispatch({ type: 'SET_SPLIT_PERSONAL', value: parseIDR(e.target.value) })}
                        placeholder="0"
                        className="w-full min-h-[44px] px-3.5 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-100 rounded-2xl outline-none font-black text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block ml-1">Bisnis (otomatis)</label>
                      <input
                        type="text"
                        readOnly
                        value={formatNumberIDR(calculatedBusiness)}
                        className="w-full min-h-[44px] px-3.5 py-2 bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {!isSplitMismatch ? (
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 ml-1">
                      <CheckCircle2 size={14} /> Total split cocok dengan nominal
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 ml-1">
                      <AlertCircle size={14} /> Total split ({formatIDR(splitTotal)}) harus sama dengan nominal
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Button for Options Mode */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmitExpense}
                disabled={!isExpenseValid}
                className="w-full min-h-[50px] bg-primary hover:bg-blue-700 text-white rounded-2xl font-black text-base shadow-lg transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {txForm.state.isInstallment ? 'Proses Cicilan Baru' : 'Simpan Transaksi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
