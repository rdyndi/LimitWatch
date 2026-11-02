import { useReducer, useEffect } from 'react';
import {
  Transaction,
  TransactionType,
  OwnerType,
  Saving,
  Piutang,
  CreditCard,
  DebtType
} from '../types';

// ==========================================
// 1. TRANSACTION FORM REDUCER
// ==========================================
export interface TransactionFormState {
  type: TransactionType;
  amount: number;
  description: string;
  cardId: string;
  category: string;
  date: string; // YYYY-MM-DD
  isInstallment: boolean;
  installmentMonths: number;
  useSavings: boolean;
  targetMonth: number;
  targetYear: number;
  owner: OwnerType;
  splitPersonal: number;
  splitBusiness: number;
  isValidated: boolean;
  showMoreOptions: boolean;
}

export type TransactionFormAction =
  | { type: 'SET_FIELD'; field: keyof TransactionFormState; value: any }
  | { type: 'SET_TYPE'; value: TransactionType }
  | { type: 'SET_AMOUNT'; value: number }
  | { type: 'SET_SPLIT_PERSONAL'; value: number }
  | { type: 'SET_SPLIT_BUSINESS'; value: number }
  | { type: 'RESET'; defaultCardId?: string; initialValidated?: boolean }
  | { type: 'LOAD_ITEM'; item: Transaction };

const getInitialTxState = (defaultCardId: string = '', initialValidated: boolean = false): TransactionFormState => {
  const now = new Date();
  return {
    type: TransactionType.EXPENSE,
    amount: 0,
    description: '',
    cardId: defaultCardId,
    category: 'Lainnya',
    date: now.toISOString().split('T')[0],
    isInstallment: false,
    installmentMonths: 12,
    useSavings: true,
    targetMonth: now.getMonth(),
    targetYear: now.getFullYear(),
    owner: OwnerType.PERSONAL,
    splitPersonal: 0,
    splitBusiness: 0,
    isValidated: initialValidated,
    showMoreOptions: false
  };
};

function transactionReducer(
  state: TransactionFormState,
  action: TransactionFormAction
): TransactionFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_TYPE':
      return {
        ...state,
        type: action.value,
        showMoreOptions: action.value === TransactionType.PAYMENT ? state.showMoreOptions : false
      };
    case 'SET_AMOUNT': {
      const amount = Math.max(0, action.value);
      let splitPersonal = state.splitPersonal;
      let splitBusiness = state.splitBusiness;
      if (state.owner === OwnerType.SPLIT) {
        // Adjust split to keep personal proportional or business as remainder
        if (splitPersonal > amount) {
          splitPersonal = amount;
          splitBusiness = 0;
        } else {
          splitBusiness = Math.max(0, amount - splitPersonal);
        }
      }
      return { ...state, amount, splitPersonal, splitBusiness };
    }
    case 'SET_SPLIT_PERSONAL': {
      const splitPersonal = Math.max(0, action.value);
      const splitBusiness = Math.max(0, state.amount - splitPersonal);
      return { ...state, splitPersonal, splitBusiness };
    }
    case 'SET_SPLIT_BUSINESS': {
      const splitBusiness = Math.max(0, action.value);
      const splitPersonal = Math.max(0, state.amount - splitBusiness);
      return { ...state, splitPersonal, splitBusiness };
    }
    case 'RESET':
      return getInitialTxState(action.defaultCardId, action.initialValidated);
    case 'LOAD_ITEM': {
      const t = action.item;
      const d = new Date(t.date);
      const now = new Date();
      return {
        type: t.type,
        amount: t.amount,
        description: t.description,
        cardId: t.cardId,
        category: t.category || 'Lainnya',
        date: isNaN(d.getTime()) ? now.toISOString().split('T')[0] : d.toISOString().split('T')[0],
        isInstallment: !!t.isInstallment,
        installmentMonths: 12, // Will be overridden if matched with installment
        useSavings: true,
        targetMonth: t.targetPeriod?.month ?? now.getMonth(),
        targetYear: t.targetPeriod?.year ?? now.getFullYear(),
        owner: t.owner ?? OwnerType.PERSONAL,
        splitPersonal: t.splitAmounts?.personal ?? 0,
        splitBusiness: t.splitAmounts?.business ?? 0,
        isValidated: !!t.isValidated,
        showMoreOptions: !!t.isInstallment || t.owner === OwnerType.SPLIT || t.type === TransactionType.PAYMENT
      };
    }
    default:
      return state;
  }
}

export function useTransactionForm(defaultCardId: string = '') {
  const [state, dispatch] = useReducer(
    transactionReducer,
    defaultCardId,
    getInitialTxState
  );

  return { state, dispatch };
}

// ==========================================
// 2. SAVING FORM REDUCER
// ==========================================
export interface SavingFormState {
  amount: number;
  cardId: string;
  targetMonth: number;
  targetYear: number;
  note: string;
}

export type SavingFormAction =
  | { type: 'SET_FIELD'; field: keyof SavingFormState; value: any }
  | { type: 'RESET'; defaultCardId?: string }
  | { type: 'LOAD_ITEM'; item: Saving };

const getInitialSavingState = (defaultCardId: string = ''): SavingFormState => {
  const now = new Date();
  return {
    amount: 0,
    cardId: defaultCardId,
    targetMonth: now.getMonth(),
    targetYear: now.getFullYear(),
    note: ''
  };
};

function savingReducer(state: SavingFormState, action: SavingFormAction): SavingFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return getInitialSavingState(action.defaultCardId);
    case 'LOAD_ITEM': {
      const s = action.item;
      const now = new Date();
      return {
        amount: s.amount,
        cardId: s.cardId,
        targetMonth: s.targetPeriod?.month ?? now.getMonth(),
        targetYear: s.targetPeriod?.year ?? now.getFullYear(),
        note: s.note || ''
      };
    }
    default:
      return state;
  }
}

export function useSavingForm(defaultCardId: string = '') {
  const [state, dispatch] = useReducer(savingReducer, defaultCardId, getInitialSavingState);
  return { state, dispatch };
}

// ==========================================
// 3. PIUTANG FORM REDUCER
// ==========================================
export interface PiutangFormState {
  debtor: string;
  amount: number;
  cardId: string;
  isInstallment: boolean;
  installmentMonths: number;
  targetMonth: number;
  targetYear: number;
  note: string;
}

export type PiutangFormAction =
  | { type: 'SET_FIELD'; field: keyof PiutangFormState; value: any }
  | { type: 'RESET'; defaultCardId?: string }
  | { type: 'LOAD_ITEM'; item: Piutang };

const getInitialPiutangState = (defaultCardId: string = ''): PiutangFormState => {
  const now = new Date();
  return {
    debtor: '',
    amount: 0,
    cardId: defaultCardId,
    isInstallment: false,
    installmentMonths: 12,
    targetMonth: now.getMonth(),
    targetYear: now.getFullYear(),
    note: ''
  };
};

function piutangReducer(state: PiutangFormState, action: PiutangFormAction): PiutangFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return getInitialPiutangState(action.defaultCardId);
    case 'LOAD_ITEM': {
      const p = action.item;
      const now = new Date();
      return {
        debtor: p.debtorName,
        amount: p.amount,
        cardId: p.cardId,
        isInstallment: false,
        installmentMonths: 12,
        targetMonth: p.targetPeriod?.month ?? now.getMonth(),
        targetYear: p.targetPeriod?.year ?? now.getFullYear(),
        note: p.note || ''
      };
    }
    default:
      return state;
  }
}

export function usePiutangForm(defaultCardId: string = '') {
  const [state, dispatch] = useReducer(piutangReducer, defaultCardId, getInitialPiutangState);
  return { state, dispatch };
}

// ==========================================
// 4. CARD FORM REDUCER
// ==========================================
export interface CardFormState {
  name: string;
  limit: number;
  dueDay: string;
  color: string;
  type: DebtType;
  eStatementFee: number;
  logoUrl: string;
}

export type CardFormAction =
  | { type: 'SET_FIELD'; field: keyof CardFormState; value: any }
  | { type: 'RESET' }
  | { type: 'LOAD_ITEM'; item: CreditCard };

const initialCardState: CardFormState = {
  name: '',
  limit: 0,
  dueDay: '',
  color: 'bg-gradient-to-tr from-slate-900 to-slate-800',
  type: DebtType.CREDIT_CARD,
  eStatementFee: 0,
  logoUrl: ''
};

function cardReducer(state: CardFormState, action: CardFormAction): CardFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return initialCardState;
    case 'LOAD_ITEM': {
      const c = action.item;
      return {
        name: c.name,
        limit: c.limit,
        dueDay: c.dueDay ? String(c.dueDay) : '',
        color: c.color || initialCardState.color,
        type: c.type || DebtType.CREDIT_CARD,
        eStatementFee: c.eStatementFee || 0,
        logoUrl: c.logoUrl || ''
      };
    }
    default:
      return state;
  }
}

export function useCardForm() {
  const [state, dispatch] = useReducer(cardReducer, initialCardState);
  return { state, dispatch };
}

// ==========================================
// 5. TRANSFER SAVING FORM REDUCER
// ==========================================
export interface TransferFormState {
  sourceCardId: string;
  sourceMonth: number;
  sourceYear: number;
  targetCardId: string;
  targetMonth: number;
  targetYear: number;
  amount: number;
  note: string;
}

export type TransferFormAction =
  | { type: 'SET_FIELD'; field: keyof TransferFormState; value: any }
  | { type: 'RESET'; defaultSourceCardId?: string; defaultTargetCardId?: string };

const getInitialTransferState = (defaultSourceCardId: string = '', defaultTargetCardId: string = ''): TransferFormState => {
  const now = new Date();
  return {
    sourceCardId: defaultSourceCardId,
    sourceMonth: now.getMonth(),
    sourceYear: now.getFullYear(),
    targetCardId: defaultTargetCardId || defaultSourceCardId,
    targetMonth: (now.getMonth() + 1) % 12,
    targetYear: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
    amount: 0,
    note: ''
  };
};

function transferReducer(state: TransferFormState, action: TransferFormAction): TransferFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return getInitialTransferState(action.defaultSourceCardId, action.defaultTargetCardId);
    default:
      return state;
  }
}

export function useTransferForm(defaultSourceCardId: string = '', defaultTargetCardId: string = '') {
  const [state, dispatch] = useReducer(
    transferReducer,
    { from: defaultSourceCardId, to: defaultTargetCardId },
    ({ from, to }) => getInitialTransferState(from, to)
  );
  return { state, dispatch };
}


