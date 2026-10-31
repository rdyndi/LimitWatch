import {
  AppState,
  Transaction,
  TransactionType,
  OwnerType,
  Saving,
  Piutang,
  CreditCard,
  DebtType
} from '../types';
import { MONTH_NAMES } from '../lib/constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

export interface SaveTransactionPayload {
  cardId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  category?: string;
  isInstallment?: boolean;
  installmentMonths?: number;
  useSavings?: boolean;
  targetMonth?: number;
  targetYear?: number;
  owner?: OwnerType;
  splitPersonal?: number;
  splitBusiness?: number;
}

export function executeSaveTransaction(
  data: AppState,
  payload: SaveTransactionPayload,
  availableSavingsForPeriod: number,
  editingTransaction?: Transaction | null
): AppState | null {
  const { cardId, type, amount, description, date, category, isInstallment, installmentMonths = 12, useSavings, targetMonth = new Date().getMonth(), targetYear = new Date().getFullYear(), owner, splitPersonal = 0, splitBusiness = 0 } = payload;

  if (!cardId) return null;
  let finalAmount = Math.ceil(amount);
  let finalDesc = description.trim();
  let updatedSavings = [...data.savings];
  let updatedInstallments = [...data.installments];

  let splitPersonalAmount = 0;
  let splitBusinessAmount = 0;
  if (type === TransactionType.EXPENSE && owner === OwnerType.SPLIT) {
    splitPersonalAmount = Math.ceil(splitPersonal);
    splitBusinessAmount = Math.ceil(splitBusiness);
    if (splitPersonalAmount + splitBusinessAmount !== finalAmount) {
      return null;
    }
  }

  const finalSplitAmounts =
    type === TransactionType.EXPENSE && owner === OwnerType.SPLIT
      ? { personal: splitPersonalAmount, business: splitBusinessAmount }
      : undefined;
  const finalOwner = type === TransactionType.EXPENSE ? owner : undefined;

  if (type === TransactionType.EXPENSE) {
    if (finalAmount <= 0 || !finalDesc) return null;
  } else {
    const savingsUsed = useSavings ? availableSavingsForPeriod : 0;
    const totalPaymentReduction = Math.ceil(finalAmount + savingsUsed);
    if (totalPaymentReduction <= 0) return null;

    finalAmount = totalPaymentReduction;
    if (!finalDesc) {
      finalDesc = `Pelunasan ${MONTH_NAMES[targetMonth]} ${targetYear}`;
    }

    if (useSavings && savingsUsed > 0) {
      updatedSavings = data.savings.map((s) =>
        s.cardId === cardId &&
        !s.isTransferred &&
        s.targetPeriod?.month === targetMonth &&
        s.targetPeriod?.year === targetYear
          ? { ...s, isTransferred: true }
          : s
      );
    }
  }

  const txIdToSave = editingTransaction ? editingTransaction.id : generateId();

  if (isInstallment && type === TransactionType.EXPENSE) {
    if (editingTransaction && !editingTransaction.isInstallment) {
      updatedInstallments = [
        {
          id: generateId(),
          transactionId: txIdToSave,
          cardId,
          name: finalDesc,
          totalAmount: finalAmount,
          monthlyAmount: Math.ceil(finalAmount / (installmentMonths || 1)),
          totalMonths: installmentMonths,
          monthsPaid: 0,
          startDate: new Date(date).toISOString(),
          validatedTenors: [],
          owner: finalOwner,
          splitAmounts: finalSplitAmounts
        },
        ...updatedInstallments
      ];
    } else if (!editingTransaction) {
      updatedInstallments = [
        {
          id: generateId(),
          transactionId: txIdToSave,
          cardId,
          name: finalDesc,
          totalAmount: finalAmount,
          monthlyAmount: Math.ceil(finalAmount / (installmentMonths || 1)),
          totalMonths: installmentMonths,
          monthsPaid: 0,
          startDate: new Date(date).toISOString(),
          validatedTenors: [],
          owner: finalOwner,
          splitAmounts: finalSplitAmounts
        },
        ...updatedInstallments
      ];
    } else {
      updatedInstallments = updatedInstallments.map((inst) => {
        if (
          inst.transactionId === txIdToSave ||
          (inst.cardId === editingTransaction.cardId &&
            inst.name === editingTransaction.description &&
            inst.totalAmount === editingTransaction.amount)
        ) {
          return {
            ...inst,
            cardId,
            name: finalDesc,
            totalAmount: finalAmount,
            monthlyAmount: Math.ceil(finalAmount / (installmentMonths || 1)),
            totalMonths: installmentMonths,
            startDate: new Date(date).toISOString(),
            transactionId: txIdToSave,
            owner: finalOwner,
            splitAmounts: finalSplitAmounts
          };
        }
        return inst;
      });
    }
  } else if (!isInstallment && editingTransaction?.isInstallment) {
    updatedInstallments = updatedInstallments.filter((inst) => {
      if (inst.transactionId) return inst.transactionId !== txIdToSave;
      return !(
        inst.cardId === editingTransaction.cardId &&
        inst.name === editingTransaction.description &&
        inst.totalAmount === editingTransaction.amount
      );
    });
  }

  let updatedTransactions: Transaction[];
  if (editingTransaction) {
    updatedTransactions = data.transactions.map((t) =>
      t.id === editingTransaction.id
        ? {
            ...t,
            cardId,
            amount: finalAmount,
            date: new Date(date).toISOString(),
            description: finalDesc,
            type,
            category: category || t.category || 'Lainnya',
            isInstallment: !!isInstallment,
            targetPeriod: type === TransactionType.PAYMENT ? { month: targetMonth, year: targetYear } : undefined,
            owner: finalOwner,
            splitAmounts: finalSplitAmounts
          }
        : t
    );
  } else {
    const newTransaction: Transaction = {
      id: txIdToSave,
      cardId,
      amount: finalAmount,
      date: new Date(date).toISOString(),
      description: finalDesc,
      type,
      category: type === TransactionType.EXPENSE ? category || 'Lainnya' : 'Pelunasan',
      isInstallment: !!isInstallment,
      targetPeriod: type === TransactionType.PAYMENT ? { month: targetMonth, year: targetYear } : undefined,
      owner: finalOwner,
      splitAmounts: finalSplitAmounts
    };
    updatedTransactions = [newTransaction, ...data.transactions];
  }

  return {
    ...data,
    transactions: updatedTransactions,
    installments: updatedInstallments,
    savings: updatedSavings
  };
}

export function executeDeleteTransaction(data: AppState, id: string): AppState {
  const deletedTx = data.transactions.find((t) => t.id === id);
  const updatedTx = data.transactions.filter((t) => t.id !== id);

  let updatedInstallments = data.installments;
  if (deletedTx?.isInstallment) {
    updatedInstallments = data.installments.filter((inst) => {
      if (inst.transactionId) {
        return inst.transactionId !== id;
      }
      return !(
        inst.cardId === deletedTx.cardId &&
        inst.name === deletedTx.description &&
        inst.totalAmount === deletedTx.amount
      );
    });
  }

  return {
    ...data,
    transactions: updatedTx,
    installments: updatedInstallments
  };
}

export function executeSaveSaving(
  data: AppState,
  payload: { cardId: string; amount: number; note: string; targetMonth: number; targetYear: number },
  editingSaving?: Saving | null
): AppState | null {
  const { cardId, amount, note, targetMonth, targetYear } = payload;
  const finalAmount = Math.ceil(amount);
  if (!cardId || finalAmount === 0) return null;

  if (editingSaving) {
    const updatedSavings = data.savings.map((s) =>
      s.id === editingSaving.id
        ? {
            ...s,
            cardId,
            amount: finalAmount,
            note,
            targetPeriod: { month: targetMonth, year: targetYear }
          }
        : s
    );
    return { ...data, savings: updatedSavings };
  } else {
    const newSaving: Saving = {
      id: generateId(),
      cardId,
      amount: finalAmount,
      date: new Date().toISOString(),
      note: note || 'Tabungan Rutin',
      targetPeriod: { month: targetMonth, year: targetYear },
      isTransferred: false
    };
    return { ...data, savings: [newSaving, ...data.savings] };
  }
}

export function executeDeleteSaving(data: AppState, id: string): AppState {
  return {
    ...data,
    savings: data.savings.filter((s) => s.id !== id)
  };
}

export function executeSaveTransfer(
  data: AppState,
  payload: {
    sourceCardId: string;
    targetCardId: string;
    amount: number;
    note: string;
    sourceMonth: number;
    sourceYear: number;
    targetMonth: number;
    targetYear: number;
  }
): AppState | null {
  const { sourceCardId, targetCardId, amount, note, sourceMonth, sourceYear, targetMonth, targetYear } = payload;
  const finalAmount = Math.ceil(amount);
  if (!sourceCardId || !targetCardId || finalAmount <= 0) return null;

  const sourceSaving: Saving = {
    id: generateId(),
    cardId: sourceCardId,
    amount: -finalAmount,
    date: new Date().toISOString(),
    note: note || `Transfer ke ${data.cards.find((c) => c.id === targetCardId)?.name || 'Tabungan Lain'}`,
    targetPeriod: { month: sourceMonth, year: sourceYear },
    isTransferred: false
  };

  const targetSaving: Saving = {
    id: generateId(),
    cardId: targetCardId,
    amount: finalAmount,
    date: new Date().toISOString(),
    note: note || `Transfer dari ${data.cards.find((c) => c.id === sourceCardId)?.name || 'Tabungan Lain'}`,
    targetPeriod: { month: targetMonth, year: targetYear },
    isTransferred: false
  };

  return {
    ...data,
    savings: [sourceSaving, targetSaving, ...data.savings]
  };
}

export function executeSavePiutang(
  data: AppState,
  payload: {
    cardId: string;
    debtor: string;
    amount: number;
    note: string;
    targetMonth: number;
    targetYear: number;
    isInstallment: boolean;
    installmentMonths: number;
  },
  editingPiutang?: Piutang | null
): AppState | null {
  const { cardId, debtor, amount, note, targetMonth, targetYear, isInstallment, installmentMonths } = payload;
  const finalAmount = Math.ceil(amount);
  const debtorName = debtor.trim();
  if (!cardId || finalAmount <= 0 || !debtorName) return null;

  const currentPiutangs = data.piutangs || [];

  if (editingPiutang) {
    const updatedPiutangs = currentPiutangs.map((p) =>
      p.id === editingPiutang.id
        ? {
            ...p,
            cardId,
            debtorName,
            amount: finalAmount,
            note,
            targetPeriod: { month: targetMonth, year: targetYear }
          }
        : p
    );
    return { ...data, piutangs: updatedPiutangs };
  } else {
    if (isInstallment && installmentMonths > 1) {
      const monthlyAmount = Math.ceil(finalAmount / installmentMonths);
      const newPiutangs: Piutang[] = [];
      let currentM = targetMonth;
      let currentY = targetYear;

      for (let i = 0; i < installmentMonths; i++) {
        newPiutangs.push({
          id: generateId(),
          cardId,
          debtorName,
          amount: monthlyAmount,
          date: new Date().toISOString(),
          note: `${note || 'Piutang'} (Cicilan ${i + 1}/${installmentMonths})`,
          targetPeriod: { month: currentM, year: currentY },
          isCollected: false
        });
        currentM++;
        if (currentM > 11) {
          currentM = 0;
          currentY++;
        }
      }
      return { ...data, piutangs: [...currentPiutangs, ...newPiutangs] };
    } else {
      const newPiutang: Piutang = {
        id: generateId(),
        cardId,
        debtorName,
        amount: finalAmount,
        date: new Date().toISOString(),
        note: note || 'Piutang',
        targetPeriod: { month: targetMonth, year: targetYear },
        isCollected: false
      };
      return { ...data, piutangs: [...currentPiutangs, newPiutang] };
    }
  }
}

export function executeDeletePiutang(data: AppState, id: string): AppState {
  return {
    ...data,
    piutangs: (data.piutangs || []).filter((p) => p.id !== id)
  };
}

export function executeSaveCard(
  data: AppState,
  payload: {
    name: string;
    limit: number;
    dueDay?: number;
    color: string;
    type: DebtType;
    eStatementFee?: number;
    logoUrl?: string;
  },
  editingCard?: CreditCard | null
): AppState | null {
  const { name, limit, dueDay, color, type, eStatementFee, logoUrl } = payload;
  const trimmedName = name.trim();
  const finalLimit = Math.ceil(limit);
  if (!trimmedName || finalLimit <= 0) return null;

  if (editingCard) {
    const updatedCards = data.cards.map((c) =>
      c.id === editingCard.id
        ? {
            ...c,
            name: trimmedName,
            limit: finalLimit,
            dueDay,
            color,
            type,
            eStatementFee,
            logoUrl
          }
        : c
    );
    return { ...data, cards: updatedCards };
  } else {
    const newCard: CreditCard = {
      id: generateId(),
      name: trimmedName,
      limit: finalLimit,
      dueDay,
      color,
      type,
      eStatementFee,
      logoUrl
    };
    return { ...data, cards: [...data.cards, newCard] };
  }
}
