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
import {
  SaveTransactionPayload
} from '../hooks/useTransactionService';
import { formatIDR } from '../lib/format';
import { MONTH_NAMES } from '../lib/constants';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Vault,
  HandCoins,
  Zap,
  Info,
  ChevronDown,
  AlertCircle
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
  const [showExpenseMore, setShowExpenseMore] = useState(false);

  // Form Reducers
  const txForm = useTransactionForm(defaultCard);
  const savingForm = useSavingForm(defaultCard);
  const piutangForm = usePiutangForm(defaultCard);

  const isEditing = !!(editingTransaction || editingSaving || editingPiutang);

  // Sync state when sheet opens or editing item changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      txForm.dispatch({ type: 'LOAD_ITEM', item: editingTransaction });
      setActiveTab(editingTransaction.type === TransactionType.PAYMENT ? 'PAYMENT' : 'EXPENSE');
      setShowExpenseMore(!!editingTransaction.isInstallment || editingTransaction.owner === OwnerType.SPLIT);
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
      setShowExpenseMore(false);
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
      splitPersonal: txForm.state.splitPersonal,
      splitBusiness: txForm.state.splitBusiness
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

  const sheetTitle = isEditing
    ? editingTransaction
      ? 'Ubah Transaksi'
      : editingSaving
      ? 'Ubah Tabungan'
      : 'Ubah Piutang'
    : 'Catat Baru';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={sheetTitle}>
      <div className="space-y-4">
        {/* Tab Selector (Hidden if in Edit Mode to keep focused) */}
        {!isEditing && (
          <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl select-none">
            <button
              type="button"
              onClick={() => {
                setActiveTab('EXPENSE');
                txForm.dispatch({ type: 'SET_TYPE', value: TransactionType.EXPENSE });
              }}
              className={`min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
                activeTab === 'EXPENSE'
                  ? 'bg-white dark:bg-slate-700 text-danger shadow-md font-black scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
              }`}
            >
              <div className="flex items-center gap-1">
                <ArrowUpCircle size={14} />
                <span className="text-xs">Pakai</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('PAYMENT');
                txForm.dispatch({ type: 'SET_TYPE', value: TransactionType.PAYMENT });
              }}
              className={`min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
                activeTab === 'PAYMENT'
                  ? 'bg-white dark:bg-slate-700 text-success shadow-md font-black scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
              }`}
            >
              <div className="flex items-center gap-1">
                <ArrowDownCircle size={14} />
                <span className="text-xs">Bayar</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SAVING')}
              className={`min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
                activeTab === 'SAVING'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md font-black scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
              }`}
            >
              <div className="flex items-center gap-1">
                <Vault size={14} />
                <span className="text-xs">Nabung</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PIUTANG')}
              className={`min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
                activeTab === 'PIUTANG'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md font-black scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
              }`}
            >
              <div className="flex items-center gap-1">
                <HandCoins size={14} />
                <span className="text-xs">Piutang</span>
              </div>
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 1: PAKAI (MAIN EXPENSE CASE - FITS IN ONE SCREEN) */}
        {/* ==================================================== */}
        {activeTab === 'EXPENSE' && (
          <form onSubmit={handleSubmitExpense} className="space-y-4">
            {/* 1. Nominal Input (Top Priority) */}
            <MoneyInput
              value={txForm.state.amount}
              onChange={(val) => txForm.dispatch({ type: 'SET_AMOUNT', value: val })}
              color="danger"
              label="Nominal Pemakaian"
              autoFocus={!isEditing}
              helperText={txForm.state.amount <= 0 ? 'Ketik nominal pengeluaran kartu' : undefined}
            />

            {/* 2. Card Picker */}
            <CardPicker
              cards={cards}
              value={txForm.state.cardId}
              onChange={(id) => txForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: id })}
              lastUsedCardId={lastUsedCardId}
              label="Pilih Kartu"
            />

            {/* 3. Description + Suggestions */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Keterangan Transaksi
                </label>
                {!txForm.state.description.trim() && txForm.state.amount > 0 && (
                  <span className="text-[11px] font-bold text-danger">Wajib diisi</span>
                )}
              </div>
              <input
                type="text"
                value={txForm.state.description}
                onChange={(e) => txForm.dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                placeholder="Contoh: Makan siang, bensin, belanja"
                className="w-full min-h-[48px] p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl border-2 border-transparent focus:border-danger outline-none font-semibold text-base transition"
              />
              <DescriptionSuggestions
                history={descriptionHistory}
                onSelect={(val) => txForm.dispatch({ type: 'SET_FIELD', field: 'description', value: val })}
                currentValue={txForm.state.description}
              />
            </div>

            {/* 4. Date Picker Chips */}
            <DatePickerChips
              value={txForm.state.date}
              onChange={(d) => txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: d })}
              label="Tanggal"
            />

            {/* 5. Collapsible More Options (Cicilan & Split) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowExpenseMore(!showExpenseMore)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 hover:bg-slate-200/70 rounded-2xl flex items-center justify-between transition-colors text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">Opsi Tambahan</span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {txForm.state.isInstallment
                      ? '(Cicilan Aktif)'
                      : txForm.state.owner === OwnerType.SPLIT
                      ? '(Split Aktif)'
                      : txForm.state.owner === OwnerType.BUSINESS
                      ? '(Bisnis)'
                      : '(Cicilan & Split)'}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${showExpenseMore ? 'rotate-180' : ''}`}
                />
              </button>

              {showExpenseMore && (
                <div className="mt-3 space-y-4 p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                  {/* Cicilan Toggle */}
                  <Toggle
                    checked={txForm.state.isInstallment}
                    onChange={(checked) => txForm.dispatch({ type: 'SET_FIELD', field: 'isInstallment', value: checked })}
                    label="Konversi ke Cicilan"
                    description="Pecah tagihan menjadi angsuran bulanan"
                    icon={<Zap size={20} />}
                    activeColor="bg-indigo-600"
                  />

                  {txForm.state.isInstallment && (
                    <TenorChips
                      months={txForm.state.installmentMonths}
                      onChange={(m) => txForm.dispatch({ type: 'SET_FIELD', field: 'installmentMonths', value: m })}
                      totalAmount={txForm.state.amount}
                      label="Durasi Cicilan (Tenor)"
                    />
                  )}

                  {/* Kepemilikan (Pribadi / Bisnis / Split) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">
                      Kepemilikan Transaksi
                    </label>
                    <SegmentedControl
                      value={txForm.state.owner}
                      onChange={(val) => txForm.dispatch({ type: 'SET_FIELD', field: 'owner', value: val })}
                      options={[
                        { value: OwnerType.PERSONAL, label: 'Pribadi', activeColor: 'bg-blue-600 text-white shadow-sm' },
                        { value: OwnerType.BUSINESS, label: 'Bisnis', activeColor: 'bg-purple-600 text-white shadow-sm' },
                        { value: OwnerType.SPLIT, label: 'Split', activeColor: 'bg-orange-500 text-white shadow-sm' }
                      ]}
                    />

                    {txForm.state.owner === OwnerType.SPLIT && (
                      <div className="pt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <MoneyInput
                            value={txForm.state.splitPersonal}
                            onChange={(val) => txForm.dispatch({ type: 'SET_SPLIT_PERSONAL', value: val })}
                            label="Pribadi"
                            showQuickButtons={false}
                            color="primary"
                          />
                          <MoneyInput
                            value={txForm.state.splitBusiness}
                            onChange={(val) => txForm.dispatch({ type: 'SET_SPLIT_BUSINESS', value: val })}
                            label="Bisnis"
                            showQuickButtons={false}
                            color="indigo"
                          />
                        </div>
                        {isSplitMismatch && (
                          <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                            <AlertCircle size={16} className="shrink-0 text-amber-600" />
                            <span>Total Split ({formatIDR(splitTotal)}) harus sama dengan nominal ({formatIDR(txForm.state.amount)})</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Bar */}
            <StickyActionBar
              primaryLabel={isEditing ? 'Simpan Perubahan' : (txForm.state.isInstallment ? 'Proses Cicilan Baru' : 'Catat Pengeluaran')}
              isValid={isExpenseValid}
              color="danger"
              invalidMessage={
                txForm.state.amount <= 0
                  ? 'Masukkan nominal pengeluaran'
                  : !txForm.state.description.trim()
                  ? 'Isi keterangan transaksi'
                  : isSplitMismatch
                  ? 'Sesuaikan pembagian split'
                  : undefined
              }
              secondaryLabel={isEditing && onDeleteTransaction && editingTransaction ? 'Hapus Transaksi' : undefined}
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

        {/* ==================================================== */}
        {/* TAB 2: BAYAR (PAYMENT OF BILL)                      */}
        {/* ==================================================== */}
        {activeTab === 'PAYMENT' && (
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <MoneyInput
              value={txForm.state.amount}
              onChange={(val) => txForm.dispatch({ type: 'SET_AMOUNT', value: val })}
              color="success"
              label="Nominal Bayar Tunai"
              autoFocus={!isEditing}
              helperText="Ketik nominal transfer/tunai untuk pelunasan"
            />

            <CardPicker
              cards={cards}
              value={txForm.state.cardId}
              onChange={(id) => txForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: id })}
              lastUsedCardId={lastUsedCardId}
              label="Pilih Kartu Yang Dibayar"
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

            {/* Bill Info & Savings Toggle */}
            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Info size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Status Tagihan</span>
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {formatIDR(currentBillEstimate)}
                </span>
              </div>

              <Toggle
                checked={txForm.state.useSavings}
                onChange={(checked) => txForm.dispatch({ type: 'SET_FIELD', field: 'useSavings', value: checked })}
                label="Gunakan Tabungan Tersedia"
                description={`Saldo tabungan: ${formatIDR(availableSavingsForPeriod)}`}
                icon={<Vault size={20} />}
                activeColor="bg-success"
              />

              {txForm.state.useSavings && availableSavingsForPeriod > 0 && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center gap-0.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Pengurangan Hutang (+Tabungan)
                  </span>
                  <span className="text-xl font-black text-success">{formatIDR(totalPaymentImpact)}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                Keterangan (Opsional)
              </label>
              <input
                type="text"
                value={txForm.state.description}
                onChange={(e) => txForm.dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                placeholder={`Otomatis: Pelunasan ${MONTH_NAMES[txForm.state.targetMonth]} ${txForm.state.targetYear}`}
                className="w-full min-h-[48px] p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl border-2 border-transparent focus:border-success outline-none font-semibold text-base transition"
              />
            </div>

            <DatePickerChips
              value={txForm.state.date}
              onChange={(d) => txForm.dispatch({ type: 'SET_FIELD', field: 'date', value: d })}
              label="Tanggal Pembayaran"
            />

            <StickyActionBar
              primaryLabel={isEditing ? 'Simpan Perubahan Pembayaran' : 'Konfirmasi Pembayaran'}
              isValid={isPaymentValid}
              color="success"
              invalidMessage={!isPaymentValid ? 'Masukkan nominal bayar atau aktifkan tabungan' : undefined}
              secondaryLabel={isEditing && onDeleteTransaction && editingTransaction ? 'Hapus Transaksi' : undefined}
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

        {/* ==================================================== */}
        {/* TAB 3: NABUNG (SAVINGS)                             */}
        {/* ==================================================== */}
        {activeTab === 'SAVING' && (
          <form onSubmit={handleSubmitSaving} className="space-y-4">
            <MoneyInput
              value={savingForm.state.amount}
              onChange={(val) => savingForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: val })}
              color="success"
              label="Dana Disisihkan (Tabungan)"
              autoFocus={!isEditing}
              helperText="Simpan dana untuk antisipasi tagihan"
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={savingForm.state.note}
                onChange={(e) => savingForm.dispatch({ type: 'SET_FIELD', field: 'note', value: e.target.value })}
                placeholder="Contoh: Sisihkan dari bonus / gaji"
                className="w-full min-h-[48px] p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl border-2 border-transparent focus:border-success outline-none font-semibold text-base transition"
              />
            </div>

            <StickyActionBar
              primaryLabel={isEditing ? 'Simpan Perubahan Tabungan' : 'Amankan Dana Pelunasan'}
              isValid={isSavingValid}
              color="success"
              invalidMessage={!isSavingValid ? 'Masukkan nominal dana yang ingin disisihkan' : undefined}
              secondaryLabel={isEditing && onDeleteSaving && editingSaving ? 'Hapus Tabungan' : undefined}
              onSecondaryClick={
                isEditing && onDeleteSaving && editingSaving
                  ? () => {
                      onDeleteSaving(editingSaving.id);
                      onClose();
                    }
                  : undefined
              }
              secondaryDanger
            />
          </form>
        )}

        {/* ==================================================== */}
        {/* TAB 4: PIUTANG (LOAN TO OTHERS)                     */}
        {/* ==================================================== */}
        {activeTab === 'PIUTANG' && (
          <form onSubmit={handleSubmitPiutang} className="space-y-4">
            <MoneyInput
              value={piutangForm.state.amount}
              onChange={(val) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: val })}
              color="indigo"
              label="Nominal Piutang"
              autoFocus={!isEditing}
              helperText="Uang yang dipinjamkan dan akan ditagih"
            />

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Piutang Dari Siapa?
                </label>
                {!piutangForm.state.debtor.trim() && piutangForm.state.amount > 0 && (
                  <span className="text-[11px] font-bold text-danger">Wajib diisi</span>
                )}
              </div>
              <input
                type="text"
                value={piutangForm.state.debtor}
                onChange={(e) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'debtor', value: e.target.value })}
                required
                placeholder="Contoh: Andi / Rekan Kantor"
                className="w-full min-h-[48px] p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-600 font-bold text-base transition"
              />
            </div>

            <CardPicker
              cards={cards}
              value={piutangForm.state.cardId}
              onChange={(id) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'cardId', value: id })}
              lastUsedCardId={lastUsedCardId}
              label="Alokasi Untuk Hutang Kartu"
            />

            {!isEditing && (
              <div className="space-y-3">
                <Toggle
                  checked={piutangForm.state.isInstallment}
                  onChange={(checked) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'isInstallment', value: checked })}
                  label="Jadikan Cicilan Bulanan"
                  description="Peminjam akan mengangsur tagihan tiap bulan"
                  icon={<Zap size={20} />}
                  activeColor="bg-indigo-600"
                />
                {piutangForm.state.isInstallment && (
                  <TenorChips
                    months={piutangForm.state.installmentMonths}
                    onChange={(m) => piutangForm.dispatch({ type: 'SET_FIELD', field: 'installmentMonths', value: m })}
                    totalAmount={piutangForm.state.amount}
                    label="Durasi Cicilan (Bulan)"
                  />
                )}
              </div>
            )}

            <PeriodPicker
              month={piutangForm.state.targetMonth}
              year={piutangForm.state.targetYear}
              onChange={({ month, year }) => {
                piutangForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: month });
                piutangForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: year });
              }}
              label={`Target Periode Tagihan ${piutangForm.state.isInstallment ? 'Pertama' : ''}`}
            />

            <StickyActionBar
              primaryLabel={isEditing ? 'Simpan Perubahan Piutang' : 'Simpan Catatan Piutang'}
              isValid={isPiutangValid}
              color="indigo"
              invalidMessage={
                !isPiutangValid
                  ? !piutangForm.state.debtor.trim()
                    ? 'Isi nama peminjam piutang'
                    : piutangForm.state.amount <= 0
                    ? 'Masukkan nominal piutang'
                    : 'Lengkapi data piutang'
                  : undefined
              }
              secondaryLabel={isEditing && onDeletePiutang && editingPiutang ? 'Hapus Piutang' : undefined}
              onSecondaryClick={
                isEditing && onDeletePiutang && editingPiutang
                  ? () => {
                      onDeletePiutang(editingPiutang.id);
                      onClose();
                    }
                  : undefined
              }
              secondaryDanger
            />
          </form>
        )}
      </div>
    </BottomSheet>
  );
};
