import { AppState, CreditCard, Transaction, TransactionType, OwnerType, DebtType } from '../types';

export const getBillingPeriod = (dateStr: string, dueDay?: number): { month: number; year: number } => {
  const date = new Date(dateStr);
  let month = date.getMonth();
  let year = date.getFullYear();

  if (dueDay) {
    if (date.getDate() >= dueDay) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
  }
  return { month, year };
};

export const getOwnerSplit = (
  item: { owner?: OwnerType; splitAmounts?: { personal: number; business: number } },
  amount: number
): { personal: number; business: number; unclassified: number } => {
  if (item.owner === OwnerType.PERSONAL) return { personal: amount, business: 0, unclassified: 0 };
  if (item.owner === OwnerType.BUSINESS) return { personal: 0, business: amount, unclassified: 0 };
  if (item.owner === OwnerType.SPLIT && item.splitAmounts)
    return { personal: item.splitAmounts.personal, business: item.splitAmounts.business, unclassified: 0 };
  return { personal: 0, business: 0, unclassified: amount };
};

export const getAvailableSavings = (data: AppState, cardId: string, targetMonth: number, targetYear: number): number => {
  if (!cardId) return 0;
  const savings = data.savings
    .filter(s => s.cardId === cardId && !s.isTransferred && s.targetPeriod?.month === targetMonth && s.targetPeriod?.year === targetYear)
    .reduce((sum, s) => sum + s.amount, 0);

  const piutangs = (data.piutangs || [])
    .filter(p => p.cardId === cardId && !p.isCollected && p.targetPeriod?.month === targetMonth && p.targetPeriod?.year === targetYear)
    .reduce((sum, p) => sum + p.amount, 0);

  return Math.ceil(savings + piutangs);
};

export const getCardBalance = (data: AppState, cardId: string): number => {
  const expenses = data.transactions
    .filter(t => t.cardId === cardId && t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);
  const payments = data.transactions
    .filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT)
    .reduce((sum, t) => sum + t.amount, 0);
  return Math.ceil(expenses - payments);
};

export const getMonthlyBillByOwner = (
  data: AppState,
  cardId: string,
  targetMonth: number,
  targetYear: number
): { personal: number; business: number; unclassified: number } => {
  const card = data.cards.find(c => c.id === cardId);
  if (!card) return { personal: 0, business: 0, unclassified: 0 };
  let personal = 0;
  let business = 0;
  let unclassified = 0;
  let totalBase = 0;

  data.transactions
    .filter(t => {
      if (t.cardId !== cardId || t.type !== TransactionType.EXPENSE || t.isInstallment) return false;
      const billing = getBillingPeriod(t.date, card?.dueDay);
      return billing.month === targetMonth && billing.year === targetYear;
    })
    .forEach(t => {
      const split = getOwnerSplit(t, t.amount);
      personal += split.personal;
      business += split.business;
      unclassified += split.unclassified;
      totalBase += t.amount;
    });

  data.installments
    .filter(i => i.cardId === cardId)
    .forEach(i => {
      const billingTenor1 = getBillingPeriod(i.startDate, card?.dueDay);
      const monthDiff = (targetYear - billingTenor1.year) * 12 + (targetMonth - billingTenor1.month);
      if (monthDiff >= 0 && monthDiff < i.totalMonths) {
        const split = getOwnerSplit(i, i.monthlyAmount);
        personal += split.personal;
        business += split.business;
        unclassified += split.unclassified;
        totalBase += i.monthlyAmount;
      }
    });

  let fees = 0;
  if (totalBase > 0) {
    if (card.eStatementFee) fees += card.eStatementFee;
    if (totalBase + fees >= 5000000) fees += 10000;
  }

  if (fees > 0 && totalBase > 0) {
    personal += fees * (personal / totalBase);
    business += fees * (business / totalBase);
    unclassified += fees * (unclassified / totalBase);
  }

  const paid = data.transactions
    .filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === targetMonth && t.targetPeriod?.year === targetYear)
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingPayment = paid;
  const totalBilled = personal + business + unclassified;
  if (remainingPayment > 0 && totalBilled > 0) {
    personal = Math.max(0, personal - remainingPayment * (personal / totalBilled));
    business = Math.max(0, business - remainingPayment * (business / totalBilled));
    unclassified = Math.max(0, unclassified - remainingPayment * (unclassified / totalBilled));
  }

  return { personal: Math.ceil(personal), business: Math.ceil(business), unclassified: Math.ceil(unclassified) };
};

export const getMonthlyBill = (data: AppState, cardId: string, targetMonth: number, targetYear: number): number => {
  const card = data.cards.find(c => c.id === cardId);
  if (!card) return 0;
  const expenses = data.transactions
    .filter(t => {
      if (t.cardId !== cardId || t.type !== TransactionType.EXPENSE || t.isInstallment) return false;
      const billing = getBillingPeriod(t.date, card?.dueDay);
      return billing.month === targetMonth && billing.year === targetYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const installmentLoad = data.installments
    .filter(i => i.cardId === cardId)
    .reduce((sum, i) => {
      const billingTenor1 = getBillingPeriod(i.startDate, card?.dueDay);
      const monthDiff = (targetYear - billingTenor1.year) * 12 + (targetMonth - billingTenor1.month);
      if (monthDiff >= 0 && monthDiff < i.totalMonths) {
        return sum + i.monthlyAmount;
      }
      return sum;
    }, 0);

  const billBeforeFees = Math.ceil(expenses + installmentLoad);
  let finalBill = billBeforeFees;
  if (billBeforeFees > 0) {
    if (card.eStatementFee) finalBill += card.eStatementFee;
    if (finalBill >= 5000000) finalBill += 10000;
  }
  const paid = data.transactions
    .filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === targetMonth && t.targetPeriod?.year === targetYear)
    .reduce((sum, t) => sum + t.amount, 0);

  return Math.max(0, Math.ceil(finalBill - paid));
};

export const getStatementData = (data: AppState, cardId: string, month: number, year: number) => {
  const card = data.cards.find(c => c.id === cardId);
  if (!card)
    return {
      transactions: [],
      installments: [],
      payments: [],
      savings: [],
      piutangs: [],
      totalBill: 0,
      totalPaid: 0,
      totalSaved: 0,
      totalValidated: 0,
      adminFee: 0,
      materai: 0
    };

  const cardTransactions = data.transactions
    .filter(t => {
      if (t.cardId !== cardId || t.isInstallment || t.type !== TransactionType.EXPENSE) return false;
      const billing = getBillingPeriod(t.date, card?.dueDay);
      return billing.month === month && billing.year === year;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const cardPayments = data.transactions
    .filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === month && t.targetPeriod?.year === year)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const cardSavings = data.savings.filter(s => s.cardId === cardId && !s.isTransferred && s.targetPeriod?.month === month && s.targetPeriod?.year === year);
  const cardPiutangs = (data.piutangs || []).filter(p => p.cardId === cardId && !p.isCollected && p.targetPeriod?.month === month && p.targetPeriod?.year === year);

  const activeInstallments = data.installments
    .filter(inst => {
      const billingTenor1 = getBillingPeriod(inst.startDate, card?.dueDay);
      const monthDiff = (year - billingTenor1.year) * 12 + (month - billingTenor1.month);
      return inst.cardId === cardId && monthDiff >= 0 && monthDiff < inst.totalMonths;
    })
    .map(inst => {
      const billingTenor1 = getBillingPeriod(inst.startDate, card?.dueDay);
      const monthDiff = (year - billingTenor1.year) * 12 + (month - billingTenor1.month);
      const key = `${year}-${String(month).padStart(2, '0')}`;
      return {
        ...inst,
        currentTenor: monthDiff + 1,
        isValidated: inst.validatedTenors?.includes(key) || false
      };
    });

  const baseAmount = Math.ceil(
    cardTransactions.reduce((s, t) => s + t.amount, 0) + activeInstallments.reduce((s, i) => s + i.monthlyAmount, 0)
  );

  const validatedBase = Math.ceil(
    cardTransactions.filter(t => t.isValidated).reduce((s, t) => s + t.amount, 0) +
      activeInstallments.filter(i => i.isValidated).reduce((s, i) => s + i.monthlyAmount, 0)
  );

  let adminFee = 0;
  let materai = 0;
  if (baseAmount > 0) {
    adminFee = card.eStatementFee || 0;
    if (baseAmount + adminFee >= 5000000) materai = 10000;
  }

  const totalBill = Math.ceil(baseAmount + adminFee + materai);
  const totalValidated = Math.ceil(validatedBase + adminFee + materai);
  const totalPaid = Math.ceil(cardPayments.reduce((s, p) => s + p.amount, 0));
  const totalSaved = Math.ceil(cardSavings.reduce((s, v) => s + v.amount, 0) + cardPiutangs.reduce((s, v) => s + v.amount, 0));

  return {
    transactions: cardTransactions,
    installments: activeInstallments,
    payments: cardPayments,
    savings: cardSavings,
    piutangs: cardPiutangs,
    totalBill,
    totalPaid,
    totalSaved,
    totalValidated,
    adminFee,
    materai
  };
};

export const getUpcomingBills = (data: AppState) => {
  return data.cards
    .filter(c => c.dueDay || c.type === DebtType.OTHER_DEBT)
    .map(c => {
      const today = new Date();
      let targetMonth = today.getMonth();
      let targetYear = today.getFullYear();
      if (c.dueDay && today.getDate() >= c.dueDay) {
        targetMonth++;
        if (targetMonth > 11) {
          targetMonth = 0;
          targetYear++;
        }
      }
      const billAmount = getMonthlyBill(data, c.id, targetMonth, targetYear);
      return { card: c, month: targetMonth, year: targetYear, amount: billAmount };
    })
    .filter(b => b.amount > 0);
};
