import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  AppState, 
  Installment, 
  Transaction, 
  TransactionType,
  CreditCard as CreditCardType,
  Saving,
  DebtType
} from "./types";
import { 
  loginWithGoogle, 
  loginWithEmail,
  registerWithEmail,
  updateUserProfile,
  logout, 
  subscribeToAuth, 
  subscribeToAppState, 
  saveAppState 
} from "./services/firebase";
import { User } from "firebase/auth";
import { 
  Home, 
  CreditCard, 
  History, 
  User as UserIcon, 
  PlusCircle, 
  Wallet, 
  LogOut,
  ChevronRight,
  X,
  Calendar,
  Pencil, 
  Trash2,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  AlertCircle,
  Bell,
  Check,
  FileText,
  Filter,
  CheckCircle2,
  Coins,
  CalendarRange,
  TrendingUp,
  ChevronLeft,
  BarChart3,
  PieChart,
  Settings,
  ShieldCheck,
  Info,
  HelpCircle,
  Briefcase,
  Loader2,
  Receipt,
  Plus
} from "lucide-react";

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.ceil(num));

const getNumericValue = (val: string) => {
    if (!val) return 0;
    const digitsOnly = val.replace(/[^\d-]/g, '');
    if (digitsOnly === '' || digitsOnly === '-') return 0;
    const num = parseInt(digitsOnly, 10);
    return isNaN(num) ? 0 : Math.ceil(num);
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const TRANSACTION_CATEGORIES = [
  "Makan & Minum",
  "Transportasi",
  "Belanja Bulanan",
  "Tagihan Rutin",
  "Cicilan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya"
];

const CARD_COLORS = [
  { label: 'Slate', value: 'bg-slate-800', text: 'text-slate-800' },
  { label: 'Blue', value: 'bg-blue-600', text: 'text-blue-600' },
  { label: 'Indigo', value: 'bg-indigo-700', text: 'text-indigo-700' },
  { label: 'Emerald', value: 'bg-emerald-700', text: 'text-emerald-700' },
  { label: 'Rose', value: 'bg-rose-700', text: 'text-rose-700' },
  { label: 'Amber', value: 'bg-amber-600', text: 'text-amber-600' },
  { label: 'Violet', value: 'bg-violet-700', text: 'text-violet-700' }
];

const getBillingPeriod = (dateStr: string, dueDay?: number): { month: number, year: number } => {
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authInited, setAuthInited] = useState(false);
  const [data, setData] = useState<AppState>({
    cards: [],
    transactions: [],
    installments: [],
    savings: []
  });
  
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'savings' | 'yearly' | 'history'>('home');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);

  const [historyCardFilter, setHistoryCardFilter] = useState<string>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<number>(new Date().getMonth());
  const [historyYearFilter, setHistoryYearFilter] = useState<number>(new Date().getFullYear());
  const [yearlySelectedYear, setYearlySelectedYear] = useState<number>(new Date().getFullYear());

  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDue, setCardDue] = useState('');
  const [cardColor, setCardColor] = useState(CARD_COLORS[0].value);
  const [cardType, setCardType] = useState<DebtType>(DebtType.CREDIT_CARD);
  const [cardEStatementFee, setCardEStatementFee] = useState('');

  const [activeStatementCard, setActiveStatementCard] = useState<CreditCardType | null>(null);
  const [statementMonth, setStatementMonth] = useState(new Date().getMonth());
  const [statementYear, setStatementYear] = useState(new Date().getFullYear());

  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txCardId, setTxCardId] = useState('');
  const [txCategory, setTxCategory] = useState(TRANSACTION_CATEGORIES[0]);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txIsInstallment, setTxIsInstallment] = useState(false);
  const [txInstallmentMonths, setTxInstallmentMonths] = useState(3);
  const [txUseSavings, setTxUseSavings] = useState(false);
  const [txTargetMonth, setTxTargetMonth] = useState(new Date().getMonth());
  const [txTargetYear, setTxTargetYear] = useState(new Date().getFullYear());

  const [savingAmount, setSavingAmount] = useState('');
  const [savingNote, setSavingNote] = useState('');
  const [savingCardId, setSavingCardId] = useState('');
  const [savingTargetMonth, setSavingTargetMonth] = useState(new Date().getMonth());
  const [savingTargetYear, setSavingTargetYear] = useState(new Date().getFullYear());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setUser(user);
      setAuthInited(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToAppState(user.uid, setData);
      return () => unsubscribe();
    } else {
      setData({ cards: [], transactions: [], installments: [], savings: [] });
    }
  }, [user]);

  useEffect(() => {
    if (data.cards.length > 0) {
      if (!txCardId) setTxCardId(data.cards[0].id);
      if (!savingCardId) setSavingCardId(data.cards[0].id);
    }
  }, [data.cards]);

  const saveData = (newData: AppState) => {
    setData(newData);
    if (user) saveAppState(user.uid, newData);
  };

  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    const digitsOnly = val.replace(/[^\d/]/g, '');
    if (digitsOnly === '') { setter(''); return; }
    const numericVal = getNumericValue(val);
    setter(formatIDR(numericVal));
  };

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      await logout();
      setUser(null);
      setProfileModalOpen(false);
      setData({ cards: [], transactions: [], installments: [], savings: [] });
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await loginWithGoogle();
    } catch (err) {
      setAuthError("Gagal masuk dengan Google.");
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleTransactionValidation = (id: string) => {
    const updated = data.transactions.map(t => 
      t.id === id ? { ...t, isValidated: !t.isValidated } : t
    );
    saveData({ ...data, transactions: updated });
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Hapus transaksi ini secara permanen?")) {
      const updatedTx = data.transactions.filter(t => t.id !== id);
      saveData({ ...data, transactions: updatedTx });
      setTransactionModalOpen(false);
      setEditingTransaction(null);
    }
  };

  const handleDeleteSaving = (id: string) => {
    if (window.confirm("Hapus catatan tabungan ini?")) {
      const updatedSavings = data.savings.filter(s => s.id !== id);
      saveData({ ...data, savings: updatedSavings });
      setSavingModalOpen(false);
      setEditingSaving(null);
    }
  };

  const availableSavingsForCard = useMemo(() => {
    if (!txCardId) return 0;
    return data.savings
      .filter(s => s.cardId === txCardId && !s.isTransferred)
      .reduce((sum, s) => sum + s.amount, 0);
  }, [data.savings, txCardId]);

  const openEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setTxType(t.type);
    setTxAmount(formatIDR(t.amount));
    setTxDesc(t.description);
    setTxCardId(t.cardId);
    setTxDate(t.date.split('T')[0]);
    setTxCategory(t.category || TRANSACTION_CATEGORIES[0]);
    setTxIsInstallment(!!t.isInstallment);
    setTxUseSavings(false);
    if (t.targetPeriod) {
      setTxTargetMonth(t.targetPeriod.month);
      setTxTargetYear(t.targetPeriod.year);
    }
    setTransactionModalOpen(true);
  };

  const openEditSaving = (s: Saving) => {
    setEditingSaving(s);
    setSavingCardId(s.cardId);
    setSavingAmount(formatIDR(s.amount));
    setSavingNote(s.note);
    if (s.targetPeriod) {
      setSavingTargetMonth(s.targetPeriod.month);
      setSavingTargetYear(s.targetPeriod.year);
    }
    setSavingModalOpen(true);
  };

  const openStatement = (card: CreditCardType) => {
    setActiveStatementCard(card);
    const today = new Date();
    if (card.dueDay && today.getDate() >= card.dueDay) {
        let nextM = today.getMonth() + 1;
        let nextY = today.getFullYear();
        if (nextM > 11) { nextM = 0; nextY++; }
        setStatementMonth(nextM);
        setStatementYear(nextY);
    } else {
        setStatementMonth(today.getMonth());
        setStatementYear(today.getFullYear());
    }
    setStatementModalOpen(true);
  };

  const getMonthlyBill = (cardId: string, targetMonth: number, targetYear: number) => {
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

     let billBeforeFees = Math.ceil(expenses + installmentLoad);
     let finalBill = billBeforeFees;
     
     if (billBeforeFees > 0) {
       if (card.eStatementFee) finalBill += card.eStatementFee;
       if (finalBill >= 5000000) finalBill += 10000;
     }

     const paid = data.transactions
       .filter(t => 
         t.cardId === cardId && 
         t.type === TransactionType.PAYMENT && 
         t.targetPeriod?.month === targetMonth && 
         t.targetPeriod?.year === targetYear
       )
       .reduce((sum, t) => sum + t.amount, 0);

     return Math.max(0, Math.ceil(finalBill - paid));
  };

  const getStatementData = (cardId: string, month: number, year: number) => {
      const card = data.cards.find(c => c.id === cardId);
      if (!card) return { transactions: [], installments: [], payments: [], savings: [], totalBill: 0, totalPaid: 0, totalSaved: 0, adminFee: 0, materai: 0 };
      
      const cardTransactions = data.transactions.filter(t => {
          if (t.cardId !== cardId || t.isInstallment || t.type !== TransactionType.EXPENSE) return false;
          const billing = getBillingPeriod(t.date, card?.dueDay);
          return billing.month === month && billing.year === year;
      });
      const cardPayments = data.transactions.filter(t => {
          return t.cardId === cardId && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === month && t.targetPeriod?.year === year;
      });
      const cardSavings = data.savings.filter(s => {
          return s.cardId === cardId && !s.isTransferred && s.targetPeriod?.month === month && s.targetPeriod?.year === year;
      });
      const activeInstallments = data.installments.filter(inst => {
          const billingTenor1 = getBillingPeriod(inst.startDate, card?.dueDay);
          const monthDiff = (year - billingTenor1.year) * 12 + (month - billingTenor1.month);
          return inst.cardId === cardId && monthDiff >= 0 && monthDiff < inst.totalMonths;
      }).map(inst => {
          const billingTenor1 = getBillingPeriod(inst.startDate, card?.dueDay);
          const monthDiff = (year - billingTenor1.year) * 12 + (month - billingTenor1.month);
          return { ...inst, currentTenor: monthDiff + 1 };
      });

      const baseAmount = Math.ceil(cardTransactions.reduce((s, t) => s + t.amount, 0) + activeInstallments.reduce((s, i) => s + i.monthlyAmount, 0));
      
      let adminFee = 0;
      let materai = 0;

      if (baseAmount > 0) {
        adminFee = card.eStatementFee || 0;
        if ((baseAmount + adminFee) >= 5000000) {
          materai = 10000;
        }
      }

      const totalBill = Math.ceil(baseAmount + adminFee + materai);
      const totalPaid = Math.ceil(cardPayments.reduce((s, p) => s + p.amount, 0));
      const totalSaved = Math.ceil(cardSavings.reduce((s, v) => s + v.amount, 0));
      
      return { transactions: cardTransactions, installments: activeInstallments, payments: cardPayments, savings: cardSavings, totalBill, totalPaid, totalSaved, adminFee, materai };
  };

  const filteredTransactions = useMemo(() => {
    return data.transactions.filter(t => {
      const card = data.cards.find(c => c.id === t.cardId);
      const billing = getBillingPeriod(t.date, card?.dueDay);
      const matchCard = historyCardFilter === 'all' || t.cardId === historyCardFilter;
      const matchMonth = billing.month === historyMonthFilter;
      const matchYear = billing.year === historyYearFilter;
      return matchCard && matchMonth && matchYear;
    });
  }, [data.transactions, data.cards, historyCardFilter, historyMonthFilter, historyYearFilter]);

  const upcomingBills = useMemo(() => {
      return data.cards
          .filter(c => c.dueDay || c.type === DebtType.OTHER_DEBT)
          .map(c => {
             const today = new Date();
             let targetMonth = today.getMonth();
             let targetYear = today.getFullYear();
             if (c.dueDay && today.getDate() >= c.dueDay) {
                targetMonth++;
                if (targetMonth > 11) { targetMonth = 0; targetYear++; }
             }
             const dueDate = c.dueDay ? new Date(targetYear, targetMonth, c.dueDay) : new Date(targetYear, targetMonth, 28);
             const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
             const billAmount = getMonthlyBill(c.id, targetMonth, targetYear);
             const savedForThisMonth = data.savings
                .filter(s => s.cardId === c.id && !s.isTransferred && s.targetPeriod?.month === targetMonth && s.targetPeriod?.year === targetYear)
                .reduce((sum, s) => sum + s.amount, 0);
             return { ...c, daysLeft: diffDays, remainingBill: billAmount, netGap: Math.max(0, billAmount - savedForThisMonth), isCovered: savedForThisMonth >= billAmount && billAmount > 0, progress: billAmount > 0 ? (savedForThisMonth / billAmount) * 100 : 0 };
          })
          .filter(c => c.remainingBill > 100)
          .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [data.cards, data.transactions, data.installments, data.savings]);

  const categoryGrouping = useMemo(() => {
    const groups: Record<string, number> = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    data.transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === TransactionType.EXPENSE && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .forEach(t => {
        const cat = t.category || "Lainnya";
        groups[cat] = (groups[cat] || 0) + t.amount;
      });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [data.transactions]);

  const yearlyData = useMemo(() => {
    return monthNames.map((monthName, monthIdx) => {
        const cardsEstimates = data.cards.map(card => {
            const billTotal = getMonthlyBill(card.id, monthIdx, yearlySelectedYear);
            const saved = data.savings
                .filter(s => 
                    s.cardId === card.id && 
                    !s.isTransferred && 
                    s.targetPeriod?.month === monthIdx && 
                    s.targetPeriod?.year === yearlySelectedYear
                )
                .reduce((sum, s) => sum + s.amount, 0);
            
            const progress = billTotal > 0 ? (saved / billTotal) * 100 : 0;
            
            return {
                cardId: card.id,
                cardName: card.name,
                color: card.color,
                bill: billTotal,
                isFullyPaid: billTotal <= 0 && data.transactions.some(t => t.cardId === card.id && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === monthIdx && t.targetPeriod?.year === yearlySelectedYear),
                saved,
                gap: Math.max(0, Math.ceil(billTotal - saved)),
                progress
            };
        }).filter(ce => ce.bill > 0 || ce.saved > 0 || ce.isFullyPaid);

        const totalMonthGap = Math.ceil(cardsEstimates.reduce((sum, ce) => sum + ce.gap, 0));
        const totalMonthBill = Math.ceil(cardsEstimates.reduce((sum, ce) => sum + ce.bill, 0));
        const totalMonthSaved = Math.ceil(cardsEstimates.reduce((sum, ce) => sum + ce.saved, 0));

        return { monthName, cardsEstimates, totalMonthGap, totalMonthBill, totalMonthSaved };
    });
  }, [data, yearlySelectedYear]);

  const yearlySummary = useMemo(() => {
    let totalYearBill = 0;
    let totalYearSaved = 0;
    let totalYearGap = 0;
    
    yearlyData.forEach(m => {
        totalYearBill += m.totalMonthBill;
        totalYearSaved += m.totalMonthSaved;
        totalYearGap += m.totalMonthGap;
    });

    return { totalYearBill, totalYearSaved, totalYearGap };
  }, [yearlyData]);

  const totalDebt = useMemo(() => {
    const expenses = data.transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, c) => s + c.amount, 0);
    const payments = data.transactions.filter(t => t.type === TransactionType.PAYMENT).reduce((s, c) => s + c.amount, 0);
    return Math.ceil(expenses - payments);
  }, [data.transactions]);

  const totalSavings = useMemo(() => Math.ceil(data.savings.filter(s => !s.isTransferred).reduce((s, c) => s + c.amount, 0)), [data.savings]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
        if (displayName) await updateUserProfile(displayName);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) { setAuthError("Email atau password salah."); }
    finally { setAuthLoading(false); }
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const limitVal = getNumericValue(cardLimit);
    const estFeeVal = getNumericValue(cardEStatementFee);
    if (!cardName || limitVal <= 0) return;
    if (editingCard) {
      const updatedCards = data.cards.map(c => c.id === editingCard.id ? { ...c, name: cardName, limit: limitVal, dueDay: cardDue ? parseInt(cardDue) : undefined, color: cardColor, type: cardType, eStatementFee: estFeeVal } : c);
      saveData({ ...data, cards: updatedCards });
      setEditingCard(null);
    } else {
      const newCard: CreditCardType = { id: generateId(), name: cardName, limit: limitVal, color: cardColor, dueDay: cardDue ? parseInt(cardDue) : undefined, type: cardType, eStatementFee: estFeeVal };
      saveData({ ...data, cards: [...data.cards, newCard] });
    }
    setCardModalOpen(false);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = getNumericValue(txAmount);
    if (!txCardId) return;
    let finalAmount = Math.ceil(amountVal);
    let finalDesc = txDesc;
    let updatedSavings = [...data.savings];
    let updatedInstallments = [...data.installments];

    if (txType === TransactionType.EXPENSE) {
       if (amountVal <= 0 || !txDesc) return;
    } else {
       const totalPayment = Math.ceil(amountVal + (txUseSavings ? availableSavingsForCard : 0));
       if (totalPayment <= 0) return;
       finalAmount = totalPayment;
       if (!finalDesc) finalDesc = `Bayar Tagihan ${monthNames[txTargetMonth]} ${txTargetYear}`;
       if (txUseSavings) updatedSavings = data.savings.map(s => s.cardId === txCardId ? { ...s, isTransferred: true } : s);
    }

    if (txIsInstallment && txType === TransactionType.EXPENSE && (!editingTransaction || !editingTransaction.isInstallment)) {
          updatedInstallments = [{ id: generateId(), cardId: txCardId, name: finalDesc, totalAmount: finalAmount, monthlyAmount: Math.ceil(finalAmount / txInstallmentMonths), totalMonths: txInstallmentMonths, monthsPaid: 0, startDate: new Date(txDate).toISOString() }, ...updatedInstallments];
    }

    if (editingTransaction) {
      const updatedTransactions = data.transactions.map(t => t.id === editingTransaction.id ? { ...t, cardId: txCardId, amount: finalAmount, date: new Date(txDate).toISOString(), description: finalDesc, type: txType, category: txCategory, isInstallment: txIsInstallment, targetPeriod: txType === TransactionType.PAYMENT ? { month: txTargetMonth, year: txTargetYear } : undefined } : t);
      saveData({ ...data, transactions: updatedTransactions, installments: updatedInstallments, savings: updatedSavings });
      setEditingTransaction(null);
    } else {
      const newTransaction: Transaction = { id: generateId(), cardId: txCardId, amount: finalAmount, date: new Date(txDate).toISOString(), description: finalDesc, type: txType, category: txType === TransactionType.EXPENSE ? txCategory : 'Pelunasan', isInstallment: txIsInstallment, targetPeriod: txType === TransactionType.PAYMENT ? { month: txTargetMonth, year: txTargetYear } : undefined };
      saveData({ ...data, transactions: [newTransaction, ...data.transactions], installments: updatedInstallments, savings: updatedSavings });
    }
    setTransactionModalOpen(false);
  };

  const handleSaveSaving = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = getNumericValue(savingAmount);
    if (!savingCardId || amountVal <= 0) return;
    if (editingSaving) {
      const updatedSavings = data.savings.map(s => s.id === editingSaving.id ? { ...s, cardId: savingCardId, amount: Math.ceil(amountVal), note: savingNote, targetPeriod: { month: savingTargetMonth, year: savingTargetYear } } : s);
      saveData({ ...data, savings: updatedSavings });
      setEditingSaving(null);
    } else {
      const newSaving: Saving = { id: generateId(), cardId: savingCardId, amount: Math.ceil(amountVal), date: new Date().toISOString(), note: savingNote || 'Tabungan Rutin', targetPeriod: { month: savingTargetMonth, year: savingTargetYear }, isTransferred: false };
      saveData({ ...data, savings: [newSaving, ...data.savings] });
    }
    setSavingModalOpen(false);
    setSavingAmount('');
    setSavingNote('');
  };

  const DesktopNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${active ? 'bg-blue-50 text-blue-700' : 'text-secondary hover:bg-slate-50 hover:text-slate-900'}`}>
      <span className={active ? 'text-primary' : 'text-slate-400'}>{icon}</span>
      {label}
    </button>
  );

  const MobileMenuButton = ({ icon, label, onClick, danger = false }: { icon: React.ReactNode, label: string, onClick: () => void, danger?: boolean }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 bg-white border-b border-slate-50 last:border-0 active:bg-slate-50 transition`}>
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50 text-danger' : 'bg-slate-50 text-slate-600'}`}>
             {icon}
          </div>
          <span className={`text-sm font-bold ${danger ? 'text-danger' : 'text-slate-700'}`}>{label}</span>
       </div>
       <ChevronRight size={18} className={danger ? 'text-red-300' : 'text-slate-300'} />
    </button>
  );

  if (!authInited) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50"><Loader2 size={40} className="animate-spin text-primary" /></div>
  );

  if (!user) return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Wallet size={32} /></div>
            <h1 className="text-2xl font-bold text-slate-800">LimitWatch</h1>
            <p className="text-slate-500 mt-2">Kelola kartu kredit & hutang Anda.</p>
          </div>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nama Lengkap</label>
                <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary transition" placeholder="Masukkan nama..."/>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary transition" placeholder="email@contoh.com"/>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary transition" placeholder="********"/>
            </div>
            {authError && <p className="text-danger text-xs text-center font-bold bg-red-50 p-2 rounded-lg">{authError}</p>}
            <button type="submit" disabled={authLoading} className="w-full bg-primary hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg active:scale-95 disabled:opacity-50">
              {authLoading ? 'Memproses...' : (isRegistering ? 'Buat Akun' : 'Masuk Sekarang')}
            </button>
          </form>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Atau</span></div>
          </div>
          <button onClick={handleGoogleLogin} disabled={authLoading} className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition active:scale-95">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Lanjutkan dengan Google
          </button>
          <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }} className="w-full mt-6 text-sm text-primary font-bold hover:underline">
            {isRegistering ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis'}
          </button>
        </div>
      </div>
  );

  return (
    <>
      <div className="hidden md:flex h-screen bg-slate-50 overflow-hidden">
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20 shadow-sm">
           <div className="h-20 flex items-center px-8 border-b border-slate-50">
              <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center mr-3 shadow-md"><Wallet size={18} /></div>
              <span className="font-bold text-xl text-slate-800">LimitWatch</span>
           </div>
           <nav className="p-4 space-y-1 flex-1">
              <DesktopNavItem icon={<Home size={20}/>} label="Dashboard" active={mobileTab === 'home'} onClick={() => setMobileTab('home')} />
              <DesktopNavItem icon={<CreditCard size={20}/>} label="Kartu & Hutang" active={mobileTab === 'cards'} onClick={() => setMobileTab('cards')} />
              <DesktopNavItem icon={<PiggyBank size={20}/>} label="Tabungan" active={mobileTab === 'savings'} onClick={() => setMobileTab('savings')} />
              <DesktopNavItem icon={<CalendarRange size={20}/>} label="Tahunan" active={mobileTab === 'yearly'} onClick={() => setMobileTab('yearly')} />
              <DesktopNavItem icon={<History size={20}/>} label="Riwayat" active={mobileTab === 'history'} onClick={() => setMobileTab('history')} />
           </nav>
           <div className="p-4 border-t border-slate-100">
              <button onClick={handleLogout} className="flex items-center gap-3 text-secondary hover:text-danger w-full p-3 rounded-lg transition"><LogOut size={20} /> <span className="font-bold">Keluar</span></button>
           </div>
        </aside>

        <main className="flex-1 ml-72 p-10 overflow-y-auto no-scrollbar h-full">
           <header className="flex justify-between items-center mb-10">
              <div><h1 className="text-3xl font-bold text-slate-800">{mobileTab === 'home' ? 'Dashboard' : mobileTab === 'cards' ? 'Manajemen Hutang' : mobileTab === 'savings' ? 'Tabungan Pelunasan' : mobileTab === 'yearly' ? 'Proyeksi Tahunan' : 'Riwayat Transaksi'}</h1><p className="text-slate-500">Halo, {user.displayName || user.email}</p></div>
              <div className="flex items-center gap-4"><button onClick={() => { setEditingTransaction(null); setTxAmount(''); setTxDesc(''); setTxType(TransactionType.EXPENSE); setTransactionModalOpen(true); }} className="bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg active:scale-95"><PlusCircle size={20} /> Transaksi</button><button onClick={() => setProfileModalOpen(true)} className="w-12 h-12 rounded-full border-2 border-slate-200 overflow-hidden shadow-sm active:scale-95 transition">{user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"><UserIcon size={24} /></div>}</button></div>
           </header>

           {mobileTab === 'home' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-3 gap-6">
                   <div className="bg-gradient-to-br from-primary to-indigo-700 p-6 rounded-2xl text-white shadow-lg"><p className="opacity-70 text-sm mb-1">Total Hutang Berjalan</p><h3 className="text-3xl font-bold">{formatIDR(totalDebt)}</h3></div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-sm mb-1">Total Tabungan</p><h3 className="text-3xl font-bold text-slate-800">{formatIDR(totalSavings)}</h3></div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-sm mb-1">Bulan Ini (Pengeluaran)</p><h3 className="text-3xl font-bold text-danger">{formatIDR(categoryGrouping.reduce((sum, [, val]) => sum + val, 0))}</h3></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {upcomingBills.length > 0 && (
                    <div><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Bell size={18} /> Tagihan Dekat Jatuh Tempo</h3><div className="grid gap-4">{upcomingBills.map(c => (<div key={c.id} onClick={() => openStatement(c)} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer flex justify-between items-center"><div className="flex flex-col"><span className="font-bold text-slate-800">{c.name}</span><span className="text-[10px] text-slate-400 uppercase font-bold">{formatIDR(c.remainingBill)}</span></div><span className="text-[10px] font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-600">{c.daysLeft} Hari Lagi</span></div>))}</div></div>
                  )}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit"><h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChart size={18} /> Pengeluaran Kelompok</h3><div className="space-y-4">{categoryGrouping.map(([cat, val], idx) => (<div key={idx} className="space-y-1.5"><div className="flex justify-between items-end"><span className="text-sm font-bold text-slate-700">{cat}</span><span className="text-xs font-medium text-slate-400">{formatIDR(val)}</span></div><div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(val / (categoryGrouping.reduce((s, [, v]) => s + v, 0) || 1)) * 100}%` }}></div></div></div>))}</div></div>
                </div>
             </div>
           )}

           {mobileTab === 'cards' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800">Daftar Kartu & Hutang</h2><button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardDue(''); setCardType(DebtType.CREDIT_CARD); setCardEStatementFee(''); setCardModalOpen(true); }} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><PlusCircle size={18}/> Tambah</button></div>
                <div className="grid grid-cols-3 gap-6">{data.cards.map(card => (<div key={card.id} className="space-y-4"><div onClick={() => openStatement(card)} className={`${card.color || 'bg-slate-800'} p-6 rounded-[28px] text-white shadow-lg relative h-48 flex flex-col justify-between overflow-hidden cursor-pointer active:scale-95 transition-transform`}><div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full -mr-8 -mt-8"></div><div className="flex justify-between items-start relative z-10"><div className="flex flex-col"><span className="text-lg font-bold">{card.name}</span><span className="text-[9px] uppercase font-black opacity-60">{card.type}</span></div><FileText size={24} className="opacity-50" /></div><div className="relative z-10"><p className="text-[10px] opacity-60 uppercase mb-1">Limit / Hutang</p><h4 className="text-2xl font-bold">{formatIDR(card.limit)}</h4></div><div className="flex justify-between items-center relative z-10"><p className="text-xs opacity-60 font-medium">{card.dueDay ? `Tempo: Tgl ${card.dueDay}` : 'Tanpa tempo'}</p></div></div><div className="flex gap-3"><button onClick={() => { setEditingCard(card); setCardName(card.name); setCardLimit(formatIDR(card.limit)); setCardDue(card.dueDay?.toString() || ''); setCardColor(card.color); setCardType(card.type); setCardEStatementFee(card.eStatementFee ? formatIDR(card.eStatementFee) : ''); setCardModalOpen(true); }} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2"><Pencil size={16}/> Edit</button><button onClick={() => { if(window.confirm('Hapus item?')) saveData({...data, cards: data.cards.filter(c=>c.id!==card.id)}); }} className="flex-1 py-3 bg-red-50 text-danger rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Trash2 size={16}/> Hapus</button></div></div>))}</div>
             </div>
           )}

           {mobileTab === 'savings' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800">Tabungan Pelunasan</h2><button onClick={() => { setEditingSaving(null); setSavingAmount(''); setSavingNote(''); setSavingModalOpen(true); }} className="bg-success text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><PiggyBank size={18}/> Tabung Dana</button></div>
                <div className="grid grid-cols-2 gap-8">{data.cards.map(card => {
                      const activeSavings = data.savings.filter(s => s.cardId === card.id && !s.isTransferred);
                      if (activeSavings.length === 0) return null;
                      return (<div key={card.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-fit"><div className="p-6 bg-slate-50 flex justify-between items-center"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Target Pelunasan</p><h4 className="font-bold text-slate-800">{card.name}</h4></div><span className="text-xl font-bold text-success">{formatIDR(activeSavings.reduce((s, v) => s + v.amount, 0))}</span></div><div className="divide-y divide-slate-50">{activeSavings.map(s => (<div key={s.id} onClick={() => openEditSaving(s)} className="p-4 flex justify-between items-center hover:bg-slate-50 transition cursor-pointer"><div><p className="text-sm font-bold text-slate-800">{s.note}</p><p className="text-[10px] text-slate-400">{new Date(s.date).toLocaleDateString('id-ID')}</p></div><span className="font-bold text-slate-800">{formatIDR(s.amount)}</span></div>))}</div></div>)
                   })}</div>
             </div>
           )}

           {mobileTab === 'history' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-3 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Item</label><select value={historyCardFilter} onChange={(e)=>setHistoryCardFilter(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"><option value="all">Semua</option>{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bulan</label><select value={historyMonthFilter} onChange={(e)=>setHistoryMonthFilter(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tahun</label><input type="number" value={historyYearFilter} onChange={(e)=>setHistoryYearFilter(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" /></div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase"><tr><th className="px-6 py-4">Tgl</th><th className="px-6 py-4">Keterangan</th><th className="px-6 py-4">Item</th><th className="px-6 py-4 text-right">Nominal</th><th className="px-6 py-4 text-center">Buku</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredTransactions.length === 0 ? <tr><td colSpan={5} className="text-center py-20 text-slate-400">Tidak ada transaksi.</td></tr> : filteredTransactions.map(t => (<tr key={t.id} onClick={() => openEditTransaction(t)} className="hover:bg-slate-50 transition cursor-pointer">
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4"><p className="text-sm font-bold text-slate-800">{t.description}</p><p className="text-[10px] text-slate-400">{t.category}</p></td>
                  <td className="px-6 py-4"><span className={`text-[9px] font-bold px-2 py-1 rounded-full text-white ${data.cards.find(c=>c.id===t.cardId)?.color || 'bg-slate-800'}`}>{data.cards.find(c=>c.id===t.cardId)?.name}</span></td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === TransactionType.EXPENSE ? 'text-danger' : 'text-success'}`}>{formatIDR(t.amount)}</td>
                  <td className="px-6 py-4 text-center" onClick={(e)=>e.stopPropagation()}><button onClick={()=>toggleTransactionValidation(t.id)} className={`transition transform active:scale-90 ${t.isValidated ? 'text-primary' : 'text-slate-200'}`}><CheckCircle2 size={24}/></button></td>
                </tr>))}</tbody></table></div>
             </div>
           )}

           {mobileTab === 'yearly' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-end">
                   <div>
                      <h2 className="text-2xl font-bold text-slate-800">Ringkasan Tahunan</h2>
                      <p className="text-slate-500">Proyeksi pengeluaran dan tabungan tahun {yearlySelectedYear}</p>
                   </div>
                   <input type="number" value={yearlySelectedYear} onChange={(e)=>setYearlySelectedYear(parseInt(e.target.value))} className="bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold w-32 shadow-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>

                <div className="grid grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tagihan Setahun</p>
                      <h3 className="text-2xl font-bold text-danger">{formatIDR(yearlySummary.totalYearBill)}</h3>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tabungan Setahun</p>
                      <h3 className="text-2xl font-bold text-success">{formatIDR(yearlySummary.totalYearSaved)}</h3>
                   </div>
                   <div className="bg-slate-800 p-6 rounded-3xl shadow-lg text-white">
                      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Selisih Belum Tercover</p>
                      <h3 className="text-2xl font-bold">{formatIDR(yearlySummary.totalYearGap)}</h3>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {yearlyData.filter(m => m.totalMonthBill > 0 || m.totalMonthSaved > 0).map((m, idx) => (
                    <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-fit">
                       <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                          <h4 className="font-bold text-slate-800">{m.monthName}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{m.cardsEstimates.length} Item</span>
                       </div>
                       <div className="p-5 space-y-3 flex-1">
                          {m.cardsEstimates.map((ce, i) => (
                            <div key={i} className="flex justify-between items-center">
                               <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${ce.color}`}></div>
                                  <span className="text-xs text-slate-600 font-medium">{ce.cardName}</span>
                               </div>
                               <div className="text-right">
                                  <p className="text-xs font-bold text-slate-800">{formatIDR(ce.bill)}</p>
                                  {ce.saved > 0 && <p className="text-[9px] font-bold text-success">Simpan: {formatIDR(ce.saved)}</p>}
                               </div>
                            </div>
                          ))}
                       </div>
                       <div className="p-5 bg-slate-50/50 border-t border-slate-100 space-y-2">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Tabungan Bulan Ini</span>
                             <span className="text-sm font-black text-success">{formatIDR(m.totalMonthSaved)}</span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Sisa Gap</span>
                             <span className={`text-xs font-black ${m.totalMonthGap > 0 ? 'text-danger' : 'text-success'}`}>{formatIDR(m.totalMonthGap)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tagihan</span>
                             <span className="text-sm font-black text-slate-800">{formatIDR(m.totalMonthBill)}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </main>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
        <header className="flex-none bg-white px-5 pt-8 pb-4 z-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">LIMITWATCH</p>
              <h2 className="text-2xl font-black text-slate-800">
                {mobileTab === 'home' ? 'Beranda' : mobileTab === 'cards' ? 'Hutang' : mobileTab === 'savings' ? 'Tabung' : mobileTab === 'yearly' ? 'Tahunan' : 'Riwayat'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
                <button className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-slate-600 border border-slate-100 shadow-sm relative active:scale-95 transition">
                  <Bell size={22} />
                </button>
                <button onClick={() => setProfileModalOpen(true)} className="w-11 h-11 rounded-full bg-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center shadow-sm active:scale-95 transition">
                   {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={22} className="text-slate-400"/>}
                </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-5 pt-4 space-y-6" ref={scrollRef}>
          {mobileTab === 'home' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-br from-primary to-indigo-700 rounded-[32px] p-6 text-white shadow-xl">
                <p className="text-blue-100 text-sm mb-1">Total Hutang Berjalan</p>
                <h3 className="text-3xl font-black mb-6">{formatIDR(totalDebt)}</h3>
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                  <div><p className="text-blue-200 text-[10px] uppercase font-bold tracking-widest mb-1">Tabungan</p><p className="font-bold text-lg">{formatIDR(totalSavings)}</p></div>
                  <div className="text-right"><p className="text-blue-200 text-[10px] uppercase font-bold tracking-widest mb-1">Item Hutang</p><p className="font-bold text-lg">{data.cards.length}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => { setEditingTransaction(null); setTxAmount(''); setTxDesc(''); setTxType(TransactionType.EXPENSE); setTransactionModalOpen(true); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-full aspect-square bg-blue-50 text-primary rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-all"><PlusCircle size={28}/></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Catat</span>
                </button>
                <button onClick={() => { setEditingSaving(null); setSavingAmount(''); setSavingNote(''); setSavingModalOpen(true); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-full aspect-square bg-emerald-50 text-success rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-all"><PiggyBank size={28}/></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Nabung</span>
                </button>
                <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardType(DebtType.CREDIT_CARD); setCardModalOpen(true); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-full aspect-square bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-all"><Briefcase size={28}/></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hutang</span>
                </button>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-4">Item Hutang & Kartu</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {data.cards.map(card => (
                    <button key={card.id} onClick={() => openStatement(card)} className={`min-w-[220px] ${card.color} p-5 rounded-3xl text-white text-left shadow-lg relative overflow-hidden active:scale-95 transition group`}>
                      <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-6 -mt-6"></div>
                      <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{card.name}</p>
                      <p className="text-xl font-black mt-3">{formatIDR(card.limit)}</p>
                      <div className="mt-4 flex items-center justify-between opacity-60">
                        <span className="text-[10px] font-bold">{card.dueDay ? `Tgl ${card.dueDay}` : 'N/A'}</span>
                        <ArrowUpRight size={14} className="group-active:translate-x-1 group-active:-translate-y-1 transition-transform"/>
                      </div>
                    </button>
                  ))}
                  {data.cards.length === 0 && <p className="text-slate-400 text-xs italic">Belum ada item ditambahkan.</p>}
                </div>
              </div>
            </div>
          )}

          {mobileTab === 'yearly' && (
            <div className="space-y-6 animate-in fade-in pb-10">
              {/* Yearly Header Summary Card */}
              <div className="bg-[#1a2332] rounded-[32px] p-7 text-white shadow-2xl space-y-7">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-blue-400" size={24} />
                    <span className="text-lg font-black tracking-tight">Tahun {yearlySelectedYear}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setYearlySelectedYear(y => y - 1)} className="p-2.5 bg-white/10 rounded-xl active:bg-white/20 transition"><ChevronLeft size={18}/></button>
                    <button onClick={() => setYearlySelectedYear(y => y + 1)} className="p-2.5 bg-white/10 rounded-xl active:bg-white/20 transition"><ChevronRight size={18}/></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa Tagihan</p>
                    <p className="text-xl font-bold">{formatIDR(yearlySummary.totalYearBill)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dana Terkumpul</p>
                    <p className="text-xl font-bold text-success">{formatIDR(yearlySummary.totalYearSaved)}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-1">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-danger uppercase tracking-widest">Sisa Gap Tahunan</p>
                    <p className="text-2xl font-black text-danger">{formatIDR(yearlySummary.totalYearGap)}</p>
                  </div>
                  <div className="w-full h-[6px] bg-white/5 rounded-full overflow-hidden mt-3">
                     <div className="h-full bg-danger/40 rounded-full" style={{ width: `${Math.min(100, (yearlySummary.totalYearGap / (yearlySummary.totalYearBill || 1)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdowns */}
              {yearlyData.filter(m => m.totalMonthBill > 0 || m.totalMonthSaved > 0).map((m, idx) => (
                <div key={idx} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-black text-slate-800">{m.monthName}</h4>
                    {m.totalMonthGap === 0 ? (
                      <span className="text-[10px] font-bold text-success bg-success/10 px-3 py-1.5 rounded-full uppercase tracking-wider">Sesuai Target</span>
                    ) : (
                      <span className="text-[10px] font-bold text-danger bg-red-50 px-3 py-1.5 rounded-full uppercase tracking-wider">Kurang {formatIDR(m.totalMonthGap)}</span>
                    )}
                  </div>

                  <div className="space-y-7">
                    {m.cardsEstimates.map((ce, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{ce.cardName}</p>
                            <div className="flex items-center gap-2">
                               <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${ce.bill <= 0 ? 'bg-success/10 text-success' : 'bg-orange-50 text-orange-600'}`}>
                                 {ce.bill <= 0 ? 'LUNAS' : 'PAKAI'}
                               </span>
                               <span className="text-xs font-black text-slate-700">{formatIDR(ce.bill)}</span>
                            </div>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="text-[10px] font-bold text-success uppercase tracking-tight">Dana Siap</p>
                            <p className="text-sm font-black text-slate-800">{formatIDR(ce.saved)}</p>
                          </div>
                        </div>
                        {/* Monthly item progress bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-700 ${ce.progress >= 100 ? 'bg-success' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, ce.progress)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sisa Tagihan</p>
                    <p className="text-lg font-black text-slate-800">{formatIDR(m.totalMonthBill)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mobileTab === 'cards' && (
             <div className="space-y-4 animate-in fade-in">
                {data.cards.map(card => (
                  <div key={card.id} className="space-y-3">
                    <div onClick={() => openStatement(card)} className={`${card.color || 'bg-slate-800'} p-5 rounded-3xl text-white shadow-lg relative h-44 flex flex-col justify-between overflow-hidden cursor-pointer active:opacity-90 transition`}>
                        <div className="absolute top-0 right-0 p-10 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                        <div className="flex justify-between items-start z-10">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-tight">{card.name}</span>
                            <span className="text-[8px] uppercase opacity-60 tracking-[0.2em] font-black">{card.type === DebtType.CREDIT_CARD ? 'KARTU KREDIT' : 'HUTANG LAIN'}</span>
                          </div>
                          <FileText size={22} className="opacity-40" />
                        </div>
                        <div className="z-10"><p className="text-[10px] opacity-60 uppercase mb-1 font-bold tracking-widest">Limit / Hutang</p><h4 className="text-2xl font-black">{formatIDR(card.limit)}</h4></div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setEditingCard(card); setCardName(card.name); setCardLimit(formatIDR(card.limit)); setCardDue(card.dueDay?.toString() || ''); setCardColor(card.color); setCardType(card.type); setCardEStatementFee(card.eStatementFee ? formatIDR(card.eStatementFee) : ''); setCardModalOpen(true); }} className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-600 flex items-center justify-center gap-2 active:bg-slate-50"><Pencil size={16}/> Edit</button>
                       <button onClick={() => { if(window.confirm('Hapus item?')) saveData({...data, cards: data.cards.filter(c=>c.id!==card.id)}); }} className="flex-1 py-3 bg-red-50 text-danger rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 active:bg-red-100"><Trash2 size={16}/> Hapus</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardModalOpen(true); }} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-bold flex items-center justify-center gap-2 active:bg-slate-50 transition">
                  <Plus size={20}/> Tambah Hutang Baru
                </button>
             </div>
          )}

          {mobileTab === 'savings' && (
            <div className="space-y-4 animate-in fade-in">
              {data.cards.map(card => {
                const activeSavings = data.savings.filter(s => s.cardId === card.id && !s.isTransferred);
                if (activeSavings.length === 0) return null;
                return (
                  <div key={card.id} className="bg-white rounded-[32px] border border-slate-50 shadow-sm p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                      <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target</p><h4 className="font-black text-slate-800">{card.name}</h4></div>
                      <span className="font-black text-xl text-success">{formatIDR(activeSavings.reduce((s, v) => s + v.amount, 0))}</span>
                    </div>
                    <div className="space-y-3">
                      {activeSavings.map(s => (<div key={s.id} onClick={()=>openEditSaving(s)} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-2xl active:scale-95 transition">
                        <div className="space-y-1">
                          <span className="text-slate-800 font-bold block">{s.note}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(s.date).toLocaleDateString('id-ID')}</span>
                        </div>
                        <span className="font-black text-slate-800">{formatIDR(s.amount)}</span>
                      </div>))}
                    </div>
                  </div>
                )
              })}
              {data.savings.filter(s=>!s.isTransferred).length === 0 && (
                <div className="text-center py-24">
                   <PiggyBank size={64} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-slate-400 font-bold">Belum ada tabungan terkumpul.</p>
                </div>
              )}
            </div>
          )}

          {mobileTab === 'history' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <select value={historyMonthFilter} onChange={(e)=>setHistoryMonthFilter(parseInt(e.target.value))} className="bg-white border-slate-100 border p-3 px-4 rounded-2xl text-xs font-bold shrink-0 shadow-sm">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                <select value={historyCardFilter} onChange={(e)=>setHistoryCardFilter(e.target.value)} className="bg-white border-slate-100 border p-3 px-4 rounded-2xl text-xs font-bold shrink-0 shadow-sm"><option value="all">Semua</option>{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div className="space-y-3">
                {filteredTransactions.map(t => (
                  <div key={t.id} onClick={() => openEditTransaction(t)} className="bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm flex justify-between items-center active:scale-[0.98] transition group">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-800 group-active:text-primary">{t.description}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{new Date(t.date).toLocaleDateString('id-ID')} • {data.cards.find(c=>c.id===t.cardId)?.name}</p>
                    </div>
                    <span className={`text-sm font-black ${t.type === TransactionType.EXPENSE ? 'text-danger' : 'text-success'}`}>{t.type === TransactionType.EXPENSE ? '-' : '+'}{formatIDR(t.amount)}</span>
                  </div>
                ))}
                {filteredTransactions.length === 0 && <p className="text-center py-20 text-slate-400 text-xs italic">Tidak ada transaksi pada periode ini.</p>}
              </div>
            </div>
          )}
        </main>

        <nav className="flex-none h-[90px] bg-white border-t border-slate-100 px-6 flex justify-between items-center z-50">
          <button onClick={()=>setMobileTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'home' ? 'text-primary scale-110' : 'text-slate-300'}`}><Home size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Home</span></button>
          <button onClick={()=>setMobileTab('cards')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'cards' ? 'text-primary scale-110' : 'text-slate-300'}`}><Briefcase size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Hutang</span></button>
          <button onClick={()=>setMobileTab('savings')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'savings' ? 'text-primary scale-110' : 'text-slate-300'}`}><PiggyBank size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Tabung</span></button>
          <button onClick={()=>setMobileTab('yearly')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'yearly' ? 'text-primary scale-110' : 'text-slate-300'}`}><CalendarRange size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Tahunan</span></button>
          <button onClick={()=>setMobileTab('history')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'history' ? 'text-primary scale-110' : 'text-slate-300'}`}><History size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Riwayat</span></button>
        </nav>
      </div>

      {/* --- UNIVERSAL MODALS --- */}
      {profileModalOpen && (
         <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
              <div className="bg-slate-50 p-8 flex flex-col items-center border-b border-slate-100 relative">
                <button onClick={() => setProfileModalOpen(false)} className="absolute top-6 right-6 p-2.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 active:scale-90"><X size={20} /></button>
                <div className="w-28 h-28 rounded-full border-[6px] border-white shadow-xl overflow-hidden flex items-center justify-center mb-5 ring-1 ring-slate-100">
                  {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-slate-400" />}
                </div>
                <h3 className="text-2xl font-black text-slate-800">{user.displayName || 'User'}</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{user.email}</p>
              </div>
              <div className="p-3">
                <MobileMenuButton icon={<Settings size={20}/>} label="Pengaturan Akun" onClick={() => alert('Fitur Segera Hadir')} />
                <div className="mt-2 border-t border-slate-50">
                  <MobileMenuButton icon={<LogOut size={20}/>} label="Keluar dari Aplikasi" onClick={handleLogout} danger />
                </div>
              </div>
           </div>
         </div>
      )}

      {cardModalOpen && (
         <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-8"><h3 className="font-black text-xl text-slate-800">{editingCard ? 'Edit Hutang' : 'Tambah Hutang'}</h3><button onClick={() => setCardModalOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-full active:scale-90"><X size={20}/></button></div>
             <form onSubmit={handleSaveCard} className="space-y-5">
                 <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl"><button type="button" onClick={()=>setCardType(DebtType.CREDIT_CARD)} className={`py-2.5 text-[10px] font-black rounded-xl transition ${cardType === DebtType.CREDIT_CARD ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>KARTU KREDIT</button><button type="button" onClick={()=>setCardType(DebtType.OTHER_DEBT)} className={`py-2.5 text-[10px] font-black rounded-xl transition ${cardType === DebtType.OTHER_DEBT ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}>HUTANG LAIN</button></div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Label Hutang</label>
                    <input type="text" value={cardName} onChange={(e)=>setCardName(e.target.value)} required placeholder="Contoh: Cicilan Motor" className="w-full p-4 bg-slate-50 rounded-2xl border-transparent focus:border-primary border-2 outline-none transition" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Limit/Total</label>
                       <input type="text" value={cardLimit} onChange={(e)=>handleCurrencyInput(e.target.value, setCardLimit)} required placeholder="Rp 0" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-slate-800" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tgl Tempo</label>
                       <input type="number" min="1" max="31" value={cardDue} onChange={(e)=>setCardDue(e.target.value)} placeholder="Tgl 1-31" className="w-full p-4 bg-slate-50 rounded-2xl" />
                    </div>
                 </div>
                 <div className="flex gap-2.5 flex-wrap pt-2">{CARD_COLORS.map(c => (<button key={c.value} type="button" onClick={() => setCardColor(c.value)} className={`w-9 h-9 rounded-full ${c.value} ${cardColor === c.value ? 'ring-2 ring-offset-4 ring-primary scale-110' : ''} transition-all`}></button>))}</div>
                 <button type="submit" className="w-full py-5 bg-slate-800 text-white font-black rounded-[24px] shadow-xl active:scale-95 transition mt-4">Simpan Hutang</button>
             </form>
           </div>
         </div>
      )}

      {transactionModalOpen && (
         <div className="fixed inset-0 z-[120] bg-black/70 flex items-end md:items-center md:justify-center backdrop-blur-sm">
           <div className="bg-white w-full md:max-w-xl h-[88vh] md:h-auto md:max-h-[92vh] md:rounded-[40px] rounded-t-[40px] p-8 shadow-2xl overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-8"><h3 className="font-black text-xl text-slate-800">{editingTransaction ? 'Detail Transaksi' : 'Catat Aktivitas'}</h3><button onClick={() => setTransactionModalOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-full active:scale-90"><X size={20}/></button></div>
             <form onSubmit={handleSaveTransaction} className="space-y-6">
                 <div className="flex bg-slate-100 p-1.5 rounded-[20px]"><button type="button" onClick={()=>setTxType(TransactionType.EXPENSE)} className={`flex-1 py-3 text-xs font-black rounded-2xl transition ${txType === TransactionType.EXPENSE ? 'bg-white text-danger shadow-sm' : 'text-slate-500'}`}>HUTANG BARU</button><button type="button" onClick={()=>setTxType(TransactionType.PAYMENT)} className={`flex-1 py-3 text-xs font-black rounded-2xl transition ${txType === TransactionType.PAYMENT ? 'bg-white text-success shadow-sm' : 'text-slate-500'}`}>PEMBAYARAN</button></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pilih Item</label>
                      <select value={txCardId} onChange={(e)=>setTxCardId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold">{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal</label>
                      <input type="date" value={txDate} onChange={(e)=>setTxDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold"/>
                    </div>
                 </div>
                 {txType === TransactionType.PAYMENT ? (
                    <div className="space-y-6 animate-in slide-in-from-top-2">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bulan</label>
                             <select value={txTargetMonth} onChange={(e)=>setTxTargetMonth(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tahun</label>
                             <input type="number" value={txTargetYear} onChange={(e)=>setTxTargetYear(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold" />
                          </div>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tagihan Periode Ini</p>
                            <p className="text-2xl font-black text-slate-800">{formatIDR(getMonthlyBill(txCardId, txTargetMonth, txTargetYear))}</p>
                          </div>
                          <button type="button" onClick={() => setTxAmount(formatIDR(getMonthlyBill(txCardId, txTargetMonth, txTargetYear)))} className="text-xs font-black text-primary bg-blue-50 px-4 py-2.5 rounded-[16px] active:scale-95 transition">Pilih Semua</button>
                       </div>
                       {availableSavingsForCard > 0 && <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-3xl border border-emerald-100"><div className="flex items-center gap-3"><Coins size={22} className="text-success" /><div className="space-y-0.5"><span className="text-xs font-black text-emerald-800 block">Pakai Tabungan?</span><span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{formatIDR(availableSavingsForCard)}</span></div></div><input type="checkbox" checked={txUseSavings} onChange={(e) => setTxUseSavings(e.target.checked)} className="w-6 h-6 accent-success" /></div>}
                    </div>
                 ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kategori</label>
                      <select value={txCategory} onChange={(e)=>setTxCategory(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold">{TRANSACTION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                    </div>
                 )}
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Keterangan</label>
                    <input type="text" value={txDesc} onChange={(e)=>setTxDesc(e.target.value)} placeholder="Misal: Belanja Bulanan" className="w-full p-4 bg-slate-50 rounded-2xl border-transparent border-2 focus:border-primary outline-none transition font-bold" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nominal Transaksi</label>
                    <input type="text" value={txAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setTxAmount)} required placeholder="Rp 0" className="w-full text-4xl font-black p-2 border-b-[4px] border-slate-50 outline-none focus:border-primary bg-transparent" />
                 </div>
                 <div className="space-y-4 pt-6"><button type="submit" className="w-full py-5 bg-primary text-white font-black rounded-[24px] shadow-xl active:scale-95 transition">Konfirmasi Transaksi</button>{editingTransaction && <button type="button" onClick={() => handleDeleteTransaction(editingTransaction.id)} className="w-full py-5 bg-red-50 text-danger font-black rounded-[24px] border border-red-100 flex items-center justify-center gap-2 active:bg-red-100"><Trash2 size={20}/> Hapus Transaksi</button>}</div>
             </form>
           </div>
         </div>
      )}

      {savingModalOpen && (
         <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-8"><h3 className="font-black text-xl text-slate-800">Nabung Yuk</h3><button onClick={() => setSavingModalOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-full active:scale-90"><X size={20}/></button></div>
             <form onSubmit={handleSaveSaving} className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Simpan Untuk</label>
                    <select value={savingCardId} onChange={(e)=>setSavingCardId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold">{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nominal Tabungan</label>
                    <input type="text" value={savingAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setSavingAmount)} required placeholder="Rp 0" className="w-full text-2xl font-black p-2 border-b-[3px] border-slate-100 outline-none focus:border-success bg-transparent" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Target Periode</label>
                    <div className="grid grid-cols-2 gap-3"><select value={savingTargetMonth} onChange={(e)=>setSavingTargetMonth(parseInt(e.target.value))} className="p-4 bg-slate-50 rounded-2xl text-xs font-bold">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={savingTargetYear} onChange={(e)=>setSavingTargetYear(parseInt(e.target.value))} className="p-4 bg-slate-50 rounded-2xl text-xs font-bold"/></div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-success text-white font-black rounded-[24px] shadow-xl active:scale-95 transition mt-4">Simpan Dana</button>
             </form>
           </div>
         </div>
      )}

      {statementModalOpen && activeStatementCard && (
         <div className="fixed inset-0 z-[110] bg-black/70 flex items-end md:items-center md:justify-center backdrop-blur-sm">
            <div className="bg-slate-50 w-full md:max-w-2xl h-[92vh] md:h-auto md:max-h-[94vh] md:rounded-[40px] rounded-t-[40px] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className={`${activeStatementCard.color} p-8 text-white shrink-0`}>
                    <div className="flex justify-between items-center mb-8"><button onClick={() => setStatementModalOpen(false)} className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center active:scale-90 transition"><ChevronDown size={28}/></button><h3 className="font-black text-xl tracking-tight uppercase">E-Statement</h3><div className="w-12"></div></div>
                    <div className="flex justify-between items-start"><div><p className="text-[10px] opacity-70 uppercase tracking-[0.3em] font-black mb-2">{activeStatementCard.type === DebtType.CREDIT_CARD ? 'KREDIT' : 'DEBT'}</p><h4 className="text-2xl font-black">{activeStatementCard.name}</h4></div><Receipt size={40} className="opacity-30" /></div>
                </div>
                <div className="bg-white p-5 border-b border-slate-100 flex gap-4 shrink-0 shadow-sm"><select value={statementMonth} onChange={(e)=>setStatementMonth(parseInt(e.target.value))} className="flex-1 text-sm font-black bg-slate-50 p-3 rounded-2xl active:bg-slate-100 transition outline-none">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={statementYear} onChange={(e)=>setStatementYear(parseInt(e.target.value))} className="w-28 text-sm font-black bg-slate-50 p-3 rounded-2xl outline-none" /></div>
                <div className="bg-white p-5 border-b border-slate-50 flex gap-3 shrink-0 overflow-x-auto no-scrollbar">
                   <button onClick={() => { setTxType(TransactionType.EXPENSE); setTxCardId(activeStatementCard.id); setTxTargetMonth(statementMonth); setTxTargetYear(statementYear); setTransactionModalOpen(true); }} className="flex items-center gap-2 bg-slate-100 px-5 py-3 rounded-2xl text-[11px] font-black uppercase whitespace-nowrap active:bg-slate-200 transition">Pakai</button>
                   <button onClick={() => { setTxType(TransactionType.PAYMENT); setTxCardId(activeStatementCard.id); setTxTargetMonth(statementMonth); setTxTargetYear(statementYear); setTxAmount(formatIDR(getMonthlyBill(activeStatementCard.id, statementMonth, statementYear))); setTransactionModalOpen(true); }} className="flex items-center gap-2 bg-blue-50 text-primary px-5 py-3 rounded-2xl text-[11px] font-black uppercase whitespace-nowrap active:bg-blue-100 transition">Bayar</button>
                   <button onClick={() => { setSavingCardId(activeStatementCard.id); setSavingTargetMonth(statementMonth); setSavingTargetYear(statementYear); setSavingModalOpen(true); }} className="flex items-center gap-2 bg-emerald-50 text-success px-5 py-3 rounded-2xl text-[11px] font-black uppercase whitespace-nowrap active:bg-emerald-100 transition">Tabung</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24">
                   {(() => {
                      const s = getStatementData(activeStatementCard.id, statementMonth, statementYear);
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-5">
                            <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL TAGIHAN</p><p className="text-xl font-black text-danger">{formatIDR(s.totalBill)}</p></div>
                            <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SISA PROYEKSI</p><p className="text-xl font-black text-slate-800">{formatIDR(Math.max(0, s.totalBill - s.totalPaid - s.totalSaved))}</p></div>
                          </div>
                          {(s.adminFee > 0 || s.materai > 0) && (
                            <div className="bg-slate-100/50 p-6 rounded-[32px] border border-slate-100 space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">BIAYA OTOMATIS</p>
                              {s.adminFee > 0 && <div className="flex justify-between text-xs font-bold"><span>E-Statement Fee</span><span className="font-black">{formatIDR(s.adminFee)}</span></div>}
                              {s.materai > 0 && <div className="flex justify-between text-xs font-bold"><span>Biaya Materai ({" >= 5JT "})</span><span className="font-black">{formatIDR(s.materai)}</span></div>}
                            </div>
                          )}
                          <section>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 ml-2">CICILAN AKTIF</h5>
                            <div className="space-y-4">
                              {s.installments.map(inst => (<div key={inst.id} className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex justify-between items-center active:bg-slate-50 transition"><div><p className="text-xs font-black text-slate-800 uppercase tracking-tight">{inst.name}</p><p className="text-[10px] text-primary font-black uppercase mt-1">TENOR {inst.currentTenor}/{inst.totalMonths}</p></div><span className="font-black text-slate-800">{formatIDR(inst.monthlyAmount)}</span></div>))}
                              {s.installments.length === 0 && <p className="text-xs text-slate-300 italic text-center py-4">Tidak ada cicilan aktif.</p>}
                            </div>
                          </section>
                          <section>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 ml-2">TRANSAKSI RITEL</h5>
                            <div className="space-y-4">
                              {s.transactions.map(t => (<div key={t.id} onClick={() => openEditTransaction(t)} className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex justify-between items-center active:scale-[0.98] transition group"><div className="flex items-center gap-4"><CheckCircle2 size={26} className={t.isValidated ? 'text-primary' : 'text-slate-100'}/><div><p className="text-xs font-black text-slate-800 uppercase group-active:text-primary transition">{t.description}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{t.category}</p></div></div><span className="font-black text-slate-800">{formatIDR(t.amount)}</span></div>))}
                              {s.transactions.length === 0 && <p className="text-xs text-slate-300 italic text-center py-4">Tidak ada pemakaian ritel.</p>}
                            </div>
                          </section>
                        </>
                      )
                   })()}
                </div>
            </div>
         </div>
      )}
    </>
  );
};

export default App;