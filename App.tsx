
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
    // Selalu bulatkan ke atas sesuai instruksi user
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
  
  // UI States
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'savings' | 'yearly' | 'history' | 'profile'>('home');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);

  // History Filter State
  const [historyCardFilter, setHistoryCardFilter] = useState<string>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<number>(new Date().getMonth());
  const [historyYearFilter, setHistoryYearFilter] = useState<number>(new Date().getFullYear());

  // Yearly Estimates State
  const [yearlySelectedYear, setYearlySelectedYear] = useState<number>(new Date().getFullYear());

  // Card Form State
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDue, setCardDue] = useState('');
  const [cardColor, setCardColor] = useState(CARD_COLORS[0].value);
  const [cardType, setCardType] = useState<DebtType>(DebtType.CREDIT_CARD);
  const [cardEStatementFee, setCardEStatementFee] = useState('');

  // Statement State
  const [activeStatementCard, setActiveStatementCard] = useState<CreditCardType | null>(null);
  const [statementMonth, setStatementMonth] = useState(new Date().getMonth());
  const [statementYear, setStatementYear] = useState(new Date().getFullYear());

  // Form States
  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txCardId, setTxCardId] = useState('');
  const [txCategory, setTxCategory] = useState(TRANSACTION_CATEGORIES[0]);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txIsInstallment, setTxIsInstallment] = useState(false);
  const [txInstallmentMonths, setTxInstallmentMonths] = useState(3);
  const [txUseSavings, setTxUseSavings] = useState(false);
  // States for Payment Target Period
  const [txTargetMonth, setTxTargetMonth] = useState(new Date().getMonth());
  const [txTargetYear, setTxTargetYear] = useState(new Date().getFullYear());

  const [savingAmount, setSavingAmount] = useState('');
  const [savingNote, setSavingNote] = useState('');
  const [savingCardId, setSavingCardId] = useState('');
  const [savingTargetMonth, setSavingTargetMonth] = useState(new Date().getMonth());
  const [savingTargetYear, setSavingTargetYear] = useState(new Date().getFullYear());

  // Auth States
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
       if (finalBill >= 5000000) finalBill += 10000; // Biaya Materai
     }

     // Subtract existing payments for the same period
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
             const currentDay = today.getDate();
             const currentMonth = today.getMonth();
             const currentYear = today.getFullYear();
             
             let targetMonth = currentMonth;
             let targetYear = currentYear;
             
             if (c.dueDay && currentDay >= c.dueDay) {
                targetMonth++;
                if (targetMonth > 11) { targetMonth = 0; targetYear++; }
             }
             
             const dueDate = c.dueDay ? new Date(targetYear, targetMonth, c.dueDay) : new Date(targetYear, targetMonth, 28);
             const diffTime = dueDate.getTime() - today.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

             const billAmount = getMonthlyBill(c.id, targetMonth, targetYear);
             
             const savedForThisMonth = data.savings
                .filter(s => 
                    s.cardId === c.id && 
                    !s.isTransferred && 
                    s.targetPeriod?.month === targetMonth && 
                    s.targetPeriod?.year === targetYear
                )
                .reduce((sum, s) => sum + s.amount, 0);

             const netGap = Math.max(0, Math.ceil(billAmount - savedForThisMonth));
             const isCovered = savedForThisMonth >= billAmount && billAmount > 0;
             const progress = billAmount > 0 ? (savedForThisMonth / billAmount) * 100 : 0;
             
             return { 
                ...c, 
                daysLeft: diffDays, 
                nextDueDate: dueDate, 
                remainingBill: billAmount,
                netGap: netGap,
                isCovered: isCovered,
                progress: progress
             };
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
                
            return {
                cardName: card.name,
                color: card.color,
                bill: billTotal,
                isFullyPaid: billTotal <= 0,
                saved,
                gap: Math.max(0, Math.ceil(billTotal - saved))
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
    
    // Validasi dasar
    if (!txCardId) return;

    let finalAmount = Math.ceil(amountVal);
    let finalDesc = txDesc;
    let updatedSavings = [...data.savings];
    let updatedInstallments = [...data.installments];

    if (txType === TransactionType.EXPENSE) {
       // Keterangan wajib untuk pengeluaran
       if (amountVal <= 0 || !txDesc) return;
    } else {
       // PEMBAYARAN
       const savingsToUse = txUseSavings ? availableSavingsForCard : 0;
       const totalPayment = Math.ceil(amountVal + savingsToUse);
       
       if (totalPayment <= 0) return; // Harus ada yang dibayar (dari tabungan atau manual)

       finalAmount = totalPayment;
       // Keterangan tidak wajib untuk pembayaran
       if (!finalDesc) finalDesc = `Bayar Tagihan ${monthNames[txTargetMonth]} ${txTargetYear}`;

       if (txUseSavings) {
          // Tandai tabungan yang dipakai
          updatedSavings = data.savings.map(s => s.cardId === txCardId ? { ...s, isTransferred: true } : s);
       }
    }

    if (txIsInstallment && txType === TransactionType.EXPENSE) {
       if (!editingTransaction || (editingTransaction && !editingTransaction.isInstallment)) {
          updatedInstallments = [{ 
            id: generateId(), 
            cardId: txCardId, 
            name: finalDesc, 
            totalAmount: finalAmount, 
            monthlyAmount: Math.ceil(finalAmount / txInstallmentMonths), 
            totalMonths: txInstallmentMonths, 
            monthsPaid: 0, 
            startDate: new Date(txDate).toISOString() 
          }, ...updatedInstallments];
       }
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
      const newSaving: Saving = { 
        id: generateId(), 
        cardId: savingCardId, 
        amount: Math.ceil(amountVal), 
        date: new Date().toISOString(), 
        note: savingNote || 'Tabungan Rutin', 
        targetPeriod: { month: savingTargetMonth, year: savingTargetYear }, 
        isTransferred: false 
      };
      saveData({ ...data, savings: [newSaving, ...data.savings] });
    }
    setSavingModalOpen(false);
    setSavingAmount('');
    setSavingNote('');
  };

  const currentDebtForPeriod = useMemo(() => {
    if (!txCardId || txType !== TransactionType.PAYMENT) return 0;
    return getMonthlyBill(txCardId, txTargetMonth, txTargetYear);
  }, [txCardId, txTargetMonth, txTargetYear, txType, data.transactions, data.installments, data.cards]);

  if (!authInited) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl"><Wallet size={40} /></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">LimitWatch</h2>
          <div className="flex items-center gap-2 text-slate-400 font-medium">
             <Loader2 size={16} className="animate-spin" />
             Menyiapkan data Anda...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Wallet size={32} /></div>
            <h1 className="text-2xl font-bold text-slate-800">LimitWatch</h1>
            <p className="text-slate-500 mt-2">Kelola kartu kredit & hutang Anda.</p>
          </div>
          
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nama Lengkap</label>
                <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Masukkan nama..."/>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="email@contoh.com"/>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="********"/>
            </div>
            {authError && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded-lg">{authError}</p>}
            <button type="submit" disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg active:scale-95 disabled:opacity-50">
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
          
          <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }} className="w-full mt-6 text-sm text-blue-600 font-bold hover:underline">
            {isRegistering ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis'}
          </button>
        </div>
      </div>
    );
  }

  const DesktopNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
      <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
      {label}
    </button>
  );

  const MobileMenuButton = ({ icon, label, onClick, danger = false }: { icon: React.ReactNode, label: string, onClick: () => void, danger?: boolean }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 bg-white border-b border-slate-50 last:border-0 active:bg-slate-50 transition`}>
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-600'}`}>
             {icon}
          </div>
          <span className={`text-sm font-bold ${danger ? 'text-red-600' : 'text-slate-700'}`}>{label}</span>
       </div>
       <ChevronRight size={18} className={danger ? 'text-red-300' : 'text-slate-300'} />
    </button>
  );

  return (
    <>
      <div className="hidden md:flex h-screen bg-slate-50 overflow-hidden">
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20 shadow-sm">
           <div className="h-20 flex items-center px-8 border-b border-slate-50">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3 shadow-md"><Wallet size={18} /></div>
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
              <button onClick={handleLogout} className="flex items-center gap-3 text-slate-500 hover:text-red-600 w-full p-3 rounded-lg transition"><LogOut size={20} /> <span className="font-bold">Keluar</span></button>
           </div>
        </aside>

        <main className="flex-1 ml-72 p-10 overflow-y-auto no-scrollbar h-full">
           <header className="flex justify-between items-center mb-10">
              <div>
                 <h1 className="text-3xl font-bold text-slate-800 mb-1">
                    {mobileTab === 'home' ? 'Dashboard' : mobileTab === 'cards' ? 'Manajemen Hutang' : mobileTab === 'savings' ? 'Tabungan' : mobileTab === 'yearly' ? 'Perkiraan Tahunan' : 'Riwayat'}
                 </h1>
                 <p className="text-slate-500">Halo, {user.displayName || user.email}</p>
              </div>
              <button onClick={() => { setEditingTransaction(null); setTxAmount(''); setTxDesc(''); setTxType(TransactionType.EXPENSE); setTxUseSavings(false); setTransactionModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg active:scale-95"><PlusCircle size={20} /> Transaksi</button>
           </header>

           {mobileTab === 'home' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-3 gap-6">
                   <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
                      <p className="opacity-70 text-sm mb-1">Total Hutang Berjalan</p>
                      <h3 className="text-3xl font-bold">{formatIDR(totalDebt)}</h3>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-slate-400 text-sm mb-1">Total Tabungan</p>
                      <h3 className="text-3xl font-bold text-slate-800">{formatIDR(totalSavings)}</h3>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-slate-400 text-sm mb-1">Bulan Ini (Pengeluaran)</p>
                      <h3 className="text-3xl font-bold text-red-500">
                        {formatIDR(categoryGrouping.reduce((sum, [, val]) => sum + val, 0))}
                      </h3>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {upcomingBills.length > 0 && (
                    <div>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Bell size={18} className="text-primary"/> Tagihan Dekat Jatuh Tempo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {upcomingBills.map(c => (
                              <div key={c.id} onClick={() => openStatement(c)} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-800">{c.name}</span>
                                      <span className="text-[9px] text-slate-400 uppercase font-black">{c.type === DebtType.CREDIT_CARD ? 'Kartu Kredit' : 'Hutang Lain'}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.daysLeft <= 3 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{c.daysLeft} Hari Lagi</span>
                                </div>
                                <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Tagihan Siklus</span><span className="font-bold text-slate-700">{formatIDR(c.remainingBill)}</span></div>
                                <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden"><div className={`h-full transition-all duration-1000 ${c.isCovered ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${Math.min(100, c.progress)}%` }}></div></div>
                                {c.isCovered ? (
                                    <div className="bg-green-50 text-green-700 p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold"><Check size={14} /> Dana Siap Bayar</div>
                                ) : (
                                    <div className="bg-red-50 text-red-700 p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold"><AlertCircle size={14} /> Kurang: {formatIDR(c.netGap)}</div>
                                )}
                              </div>
                          ))}
                        </div>
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChart size={18} className="text-indigo-600"/> Pengeluaran Berdasarkan Kelompok</h3>
                    <div className="space-y-4">
                      {categoryGrouping.length === 0 ? (
                        <p className="text-center py-10 text-slate-300 text-sm italic">Belum ada pengeluaran bulan ini.</p>
                      ) : categoryGrouping.map(([cat, val], idx) => {
                        const total = categoryGrouping.reduce((s, [, v]) => s + v, 0);
                        const percentage = (val / total) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-sm font-bold text-slate-700">{cat}</span>
                              <span className="text-xs font-medium text-slate-400">{formatIDR(val)} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
             </div>
           )}

           {mobileTab === 'cards' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-slate-800">Daftar Kartu & Hutang</h2>
                   <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardDue(''); setCardType(DebtType.CREDIT_CARD); setCardEStatementFee(''); setCardModalOpen(true); }} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition hover:bg-slate-900 shadow-md">
                      <PlusCircle size={18}/> Tambah Hutang
                   </button>
                </div>
                {data.cards.length === 0 ? (
                  <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
                    <CreditCard size={64} className="mx-auto text-slate-200 mb-4"/>
                    <p className="text-slate-400">Belum ada kartu atau hutang ditambahkan.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-6">
                    {data.cards.map(card => (
                      <div key={card.id} className="space-y-4">
                        <div onClick={() => openStatement(card)} className={`${card.color || 'bg-slate-800'} p-6 rounded-[28px] text-white shadow-lg relative h-48 flex flex-col justify-between overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform`}>
                            <div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full -mr-8 -mt-8"></div>
                            <div className="flex justify-between items-start relative z-10">
                              <div className="flex flex-col">
                                <span className="text-lg font-bold">{card.name}</span>
                                <span className="text-[9px] uppercase font-black opacity-60 tracking-widest">{card.type === DebtType.CREDIT_CARD ? 'Kartu Kredit' : 'Hutang Umum'}</span>
                              </div>
                              <FileText size={24} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="relative z-10"><p className="text-[10px] opacity-60 uppercase font-bold tracking-widest mb-1">{card.type === DebtType.CREDIT_CARD ? 'Limit Kredit' : 'Total Pinjaman'}</p><h4 className="text-2xl font-bold">{formatIDR(card.limit)}</h4></div>
                            <div className="flex justify-between items-center relative z-10">
                              <p className="text-xs opacity-60 font-medium">{card.dueDay ? `Tempo: Tgl ${card.dueDay}` : 'Tempo: Belum diset'}</p>
                              {card.eStatementFee && <p className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">Fee: {formatIDR(card.eStatementFee)}</p>}
                            </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => { setEditingCard(card); setCardName(card.name); setCardLimit(formatIDR(card.limit)); setCardDue(card.dueDay?.toString() || ''); setCardColor(card.color); setCardType(card.type); setCardEStatementFee(card.eStatementFee ? formatIDR(card.eStatementFee) : ''); setCardModalOpen(true); }} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm"><Pencil size={16}/> Edit</button>
                           <button onClick={() => { if(window.confirm('Hapus item ini?')) saveData({...data, cards: data.cards.filter(c=>c.id!==card.id)}); }} className="flex-1 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center justify-center gap-2 hover:bg-red-100 transition shadow-sm"><Trash2 size={16}/> Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           )}

           {mobileTab === 'savings' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-slate-800">Dana Tabungan Pelunasan</h2>
                   <button onClick={() => { setEditingSaving(null); setSavingAmount(''); setSavingNote(''); setSavingModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition hover:bg-green-700 shadow-md">
                      <PiggyBank size={18}/> Tabung Dana
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   {data.cards.map(card => {
                      const activeSavings = data.savings.filter(s => s.cardId === card.id && !s.isTransferred);
                      const totalCardSaved = Math.ceil(activeSavings.reduce((s, v) => s + v.amount, 0));
                      if (activeSavings.length === 0) return null;
                      return (
                        <div key={card.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-fit">
                           <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tabungan Untuk</p>
                                 <h4 className="font-bold text-slate-800 text-lg">{card.name}</h4>
                              </div>
                              <span className="text-xl font-bold text-green-600">{formatIDR(totalCardSaved)}</span>
                           </div>
                           <div className="divide-y divide-slate-50">
                              {activeSavings.map(s => (
                                 <div key={s.id} onClick={() => openEditSaving(s)} className="p-6 flex justify-between items-center hover:bg-slate-50 transition cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                          <Coins size={20}/>
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-slate-800">{s.note}</p>
                                          <p className="text-xs text-slate-400 font-medium">{new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <span className="font-bold text-slate-800">{formatIDR(s.amount)}</span>
                                       <button onClick={(e) => { e.stopPropagation(); handleDeleteSaving(s.id); }} className="text-slate-200 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                                          <Trash2 size={18}/>
                                       </button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                      )
                   })}
                   {data.savings.filter(s => !s.isTransferred).length === 0 && (
                      <div className="col-span-2 bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
                         <PiggyBank size={64} className="mx-auto text-slate-200 mb-4"/>
                         <p className="text-slate-400">Belum ada dana tabungan terkumpul.</p>
                      </div>
                   )}
                </div>
             </div>
           )}

           {mobileTab === 'history' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                      <Filter size={20} className="text-primary"/>
                      <h3 className="font-bold text-slate-800">Filter Riwayat Siklus</h3>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Kartu/Hutang</label><select value={historyCardFilter} onChange={(e)=>setHistoryCardFilter(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"><option value="all">Semua</option>{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bulan Siklus</label><select value={historyMonthFilter} onChange={(e)=>setHistoryMonthFilter(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tahun Siklus</label><input type="number" value={historyYearFilter} onChange={(e)=>setHistoryYearFilter(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium" /></div>
                   </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                         <tr><th className="px-6 py-4">Status</th><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Keterangan</th><th className="px-6 py-4">Item</th><th className="px-6 py-4 text-right">Nominal</th><th className="px-6 py-4 text-center">Buku</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredTransactions.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-20 text-slate-400 text-sm">Tidak ada transaksi ditemukan untuk filter ini.</td></tr>
                         ) : filteredTransactions.map(t => {
                            const card = data.cards.find(c => c.id === t.cardId);
                            const cardTheme = CARD_COLORS.find(cc => cc.value === card?.color) || CARD_COLORS[0];
                            return (
                               <tr key={t.id} onClick={() => openEditTransaction(t)} className="hover:bg-slate-50 transition cursor-pointer group">
                                  <td className="px-6 py-4"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>{t.type === TransactionType.EXPENSE ? <ArrowUpRight size={16}/> : <ArrowDownLeft size={16}/>}</div></td>
                                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition">{t.description}</p>
                                    <p className="text-[10px] text-slate-400">{t.category} {t.isInstallment && '• Cicilan'}</p>
                                  </td>
                                  <td className="px-6 py-4"><span className={`text-[9px] font-bold px-2 py-1 rounded-full text-white ${card?.color || 'bg-slate-800'}`}>{card?.name || 'Unknown'}</span></td>
                                  <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === TransactionType.EXPENSE ? 'text-red-500' : 'text-green-600'}`}>{t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}</td>
                                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}><button onClick={() => toggleTransactionValidation(t.id)} className={`transition transform active:scale-90 ${t.isValidated ? cardTheme.text : 'text-slate-200'}`}><CheckCircle2 size={24} fill={t.isValidated ? 'currentColor' : 'none'} className={t.isValidated ? 'fill-current opacity-20' : ''}/></button></td>
                               </tr>
                            )
                         })}
                      </tbody>
                   </table>
                </div>
              </div>
           )}
        </main>
      </div>

      <div className="md:hidden flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
        <header className="flex-none bg-white px-5 pt-8 pb-4 border-b border-slate-100 z-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">LimitWatch</p>
              <h2 className="text-xl font-bold text-slate-800">
                {mobileTab === 'home' ? 'Beranda' : mobileTab === 'cards' ? 'Kartu' : mobileTab === 'savings' ? 'Tabungan' : mobileTab === 'yearly' ? 'Tahunan' : mobileTab === 'history' ? 'Riwayat' : 'Akun'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 border border-slate-200 relative"><Bell size={20} /></button>
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                   {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-slate-400"/>}
                </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-5 pt-5 space-y-6" ref={scrollRef}>
          {mobileTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-blue-100 text-sm mb-1">Total Hutang Berjalan</p>
                <h3 className="text-3xl font-bold mb-4">{formatIDR(totalDebt)}</h3>
                <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                  <div><p className="text-blue-100 text-[10px] uppercase font-bold tracking-widest">Tabungan</p><p className="font-bold text-lg">{formatIDR(totalSavings)}</p></div>
                  <div className="text-right"><p className="text-blue-100 text-[10px] uppercase font-bold tracking-widest">Hutang Aktif</p><p className="font-bold text-lg">{data.cards.length} Item</p></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><PieChart size={16} className="text-indigo-600"/> Ringkasan Kelompok (Bulan Ini)</h3>
                <div className="space-y-3">
                  {categoryGrouping.length === 0 ? (
                    <p className="text-[10px] text-slate-300 italic">Belum ada pemakaian.</p>
                  ) : categoryGrouping.map(([cat, val], i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600">{cat}</span>
                      <span className="text-xs font-bold text-slate-800">{formatIDR(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {upcomingBills.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                    <Bell size={16} className="text-red-500" /> Tagihan Dekat Siklus
                  </h3>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {upcomingBills.map(c => (
                      <div key={c.id} onClick={() => openStatement(c)} className="min-w-[260px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-95 transition cursor-pointer">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs">{c.name}</span>
                            <span className="text-[8px] uppercase font-bold text-slate-400">{c.type === DebtType.CREDIT_CARD ? 'Kartu Kredit' : 'Hutang Umum'}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.daysLeft <= 3 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{c.daysLeft} Hari Lagi</span>
                        </div>
                        <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-[10px]"><span className="text-slate-400">Tagihan Siklus</span><span className="font-bold text-slate-700">{formatIDR(c.remainingBill)}</span></div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${c.isCovered ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${Math.min(100, c.progress)}%` }}></div></div>
                        </div>
                        {c.isCovered ? (
                            <div className="bg-green-50 text-green-700 p-2 rounded-lg flex items-center gap-2 text-[9px] font-bold"><Check size={12} /> Dana Siap Bayar</div>
                        ) : (
                            <div className="bg-red-50 text-red-700 p-2 rounded-lg flex items-center gap-2 text-[9px] font-bold"><AlertCircle size={12} /> Kurang: {formatIDR(c.netGap)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => { setEditingTransaction(null); setTxAmount(''); setTxDesc(''); setTxType(TransactionType.EXPENSE); setTxUseSavings(false); setTransactionModalOpen(true); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-full aspect-square bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><PlusCircle size={24}/></div>
                  <span className="text-[10px] font-bold text-slate-600">Catat</span>
                </button>
                <button onClick={() => { setEditingSaving(null); setSavingAmount(''); setSavingNote(''); setSavingModalOpen(true); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-full aspect-square bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><PiggyBank size={24}/></div>
                  <span className="text-[10px] font-bold text-slate-600">Nabung</span>
                </button>
                <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardDue(''); setCardType(DebtType.CREDIT_CARD); setCardEStatementFee(''); setCardModalOpen(true); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-full aspect-square bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><Briefcase size={24}/></div>
                  <span className="text-[10px] font-bold text-slate-600">Hutang</span>
                </button>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-3">Item Hutang & Kartu</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {data.cards.map(card => (
                    <button key={card.id} onClick={() => openStatement(card)} className={`min-w-[200px] ${card.color || 'bg-slate-800'} p-4 rounded-xl text-white text-left shadow-md relative overflow-hidden active:scale-95 transition`}>
                       <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full -mr-4 -mt-4"></div>
                       <p className="text-[10px] font-bold opacity-80 mb-1">{card.name}</p>
                       <p className="text-[8px] opacity-60 uppercase font-bold tracking-widest mb-3">{card.type === DebtType.CREDIT_CARD ? 'Kartu Kredit' : 'Pinjaman/Hutang'}</p>
                       <p className="text-sm font-bold truncate">{formatIDR(card.limit)}</p>
                       <p className="text-[9px] mt-2 opacity-60">Klik untuk Detail</p>
                    </button>
                  ))}
                  <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardDue(''); setCardType(DebtType.CREDIT_CARD); setCardEStatementFee(''); setCardModalOpen(true); }} className="min-w-[200px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs font-bold gap-2"><PlusCircle size={20}/> Tambah Hutang</button>
                </div>
              </div>
            </div>
          )}

          {mobileTab === 'cards' && (
             <div className="space-y-4 animate-in fade-in">
                {data.cards.length === 0 ? (
                  <div className="text-center py-20"><CreditCard size={48} className="mx-auto text-slate-200 mb-4"/><p className="text-slate-400 text-sm">Belum ada item ditambahkan.</p></div>
                ) : data.cards.map(card => (
                  <div key={card.id} className="space-y-3">
                    <div onClick={() => openStatement(card)} className={`${card.color || 'bg-slate-800'} p-5 rounded-2xl text-white shadow-lg relative h-40 flex flex-col justify-between overflow-hidden cursor-pointer active:opacity-90 transition`}>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{card.name}</span>
                            <span className="text-[8px] uppercase font-bold opacity-60 tracking-wider">{card.type === DebtType.CREDIT_CARD ? 'Kartu Kredit' : 'Hutang Lain'}</span>
                          </div>
                          <FileText size={20} className="opacity-50" />
                        </div>
                        <div><p className="text-[10px] opacity-60 uppercase mb-1">{card.type === DebtType.CREDIT_CARD ? 'Limit' : 'Total Pinjaman'}</p><h4 className="text-xl font-bold">{formatIDR(card.limit)}</h4></div>
                        <div className="flex justify-between items-center"><p className="text-[10px] opacity-60">{card.dueDay ? `Tempo: Tgl ${card.dueDay}` : 'Tempo: Belum diset'}</p> {card.eStatementFee && <p className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">Fee: {formatIDR(card.eStatementFee)}</p>}</div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setEditingCard(card); setCardName(card.name); setCardLimit(formatIDR(card.limit)); setCardDue(card.dueDay?.toString() || ''); setCardColor(card.color); setCardType(card.type); setCardEStatementFee(card.eStatementFee ? formatIDR(card.eStatementFee) : ''); setCardModalOpen(true); }} className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 flex items-center justify-center gap-2"><Pencil size={14}/> Edit</button>
                       <button onClick={() => { if(window.confirm('Hapus item ini?')) saveData({...data, cards: data.cards.filter(c=>c.id!==card.id)}); }} className="flex-1 py-2 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600 flex items-center justify-center gap-2"><Trash2 size={14}/> Hapus</button>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </main>

        <nav className="flex-none h-[85px] bg-white border-t border-slate-100 px-6 flex justify-between items-center z-50">
          <button onClick={()=>setMobileTab('home')} className={`flex flex-col items-center gap-1 transition ${mobileTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}><Home size={22} /><span className="text-[9px] font-bold">Home</span></button>
          <button onClick={()=>setMobileTab('cards')} className={`flex flex-col items-center gap-1 transition ${mobileTab === 'cards' ? 'text-blue-600' : 'text-slate-400'}`}><Briefcase size={22} /><span className="text-[9px] font-bold">Hutang</span></button>
          <button onClick={()=>setMobileTab('history')} className={`flex flex-col items-center gap-1 transition ${mobileTab === 'history' ? 'text-blue-600' : 'text-slate-400'}`}><History size={22} /><span className="text-[9px] font-bold">Riwayat</span></button>
          <button onClick={()=>setMobileTab('savings')} className={`flex flex-col items-center gap-1 transition ${mobileTab === 'savings' ? 'text-blue-600' : 'text-slate-400'}`}><PiggyBank size={22} /><span className="text-[9px] font-bold">Tabung</span></button>
          <button onClick={()=>setMobileTab('profile')} className={`flex flex-col items-center gap-1 transition ${mobileTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}><UserIcon size={22} /><span className="text-[9px] font-bold">Profil</span></button>
        </nav>
      </div>

      {/* --- UNIVERSAL MODALS --- */}
      
      {cardModalOpen && (
         <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">{editingCard ? 'Edit Item' : 'Tambah Hutang'}</h3><button onClick={() => setCardModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button></div>
             <form onSubmit={handleSaveCard} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipe Hutang</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                      <button type="button" onClick={()=>setCardType(DebtType.CREDIT_CARD)} className={`py-2 text-[10px] font-bold rounded-lg transition ${cardType === DebtType.CREDIT_CARD ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>KARTU KREDIT</button>
                      <button type="button" onClick={()=>setCardType(DebtType.OTHER_DEBT)} className={`py-2 text-[10px] font-bold rounded-lg transition ${cardType === DebtType.OTHER_DEBT ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>HUTANG LAIN</button>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama {cardType === DebtType.CREDIT_CARD ? 'Kartu' : 'Pinjaman'}</label>
                    <input type="text" value={cardName} onChange={(e)=>setCardName(e.target.value)} required placeholder="Misal: BCA Everyday" className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{cardType === DebtType.CREDIT_CARD ? 'Limit' : 'Total Hutang'}</label>
                      <input type="text" value={cardLimit} onChange={(e)=>handleCurrencyInput(e.target.value, setCardLimit)} required placeholder="Rp 0" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold focus:ring-2 focus:ring-blue-500 transition"/>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">E-Statement Fee</label>
                      <input type="text" value={cardEStatementFee} onChange={(e)=>handleCurrencyInput(e.target.value, setCardEStatementFee)} placeholder="Rp 0" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold focus:ring-2 focus:ring-blue-500 transition"/>
                   </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tgl Jatuh Tempo (1-31)</label>
                    <input type="number" min="1" max="31" value={cardDue} onChange={(e)=>setCardDue(e.target.value)} placeholder="Tgl 1-31" className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Pilih Tema Warna</label>
                    <div className="flex gap-2 flex-wrap pt-1">{CARD_COLORS.map(c => ( <button key={c.value} type="button" onClick={() => setCardColor(c.value)} className={`w-8 h-8 rounded-full ${c.value} ${cardColor === c.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}></button> ))}</div>
                 </div>
                 <button type="submit" className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-lg transition active:scale-95">Simpan</button>
             </form>
           </div>
         </div>
      )}

      {transactionModalOpen && (
         <div className="fixed inset-0 z-[120] bg-black/60 flex items-end md:items-center md:justify-center">
           <div className="bg-white w-full md:max-w-2xl h-[85vh] md:h-auto md:max-h-[90vh] md:rounded-[32px] rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in duration-300 overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">{editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi'}</h3><button onClick={() => setTransactionModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button></div>
             <form onSubmit={handleSaveTransaction} className="space-y-5">
                 <div className="flex bg-slate-100 p-1 rounded-xl"><button type="button" onClick={()=>setTxType(TransactionType.EXPENSE)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${txType === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>PAKAI / HUTANG</button><button type="button" onClick={()=>setTxType(TransactionType.PAYMENT)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${txType === TransactionType.PAYMENT ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}>BAYAR / CICIL</button></div>
                 
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hutang Ke...</label>
                        <select value={txCardId} onChange={(e)=>setTxCardId(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition">{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tanggal Transaksi</label>
                        <input type="date" value={txDate} onChange={(e)=>setTxDate(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                      </div>
                    </div>

                    {txType === TransactionType.PAYMENT ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Bulan Tagihan</label>
                            <select value={txTargetMonth} onChange={(e)=>setTxTargetMonth(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition">
                              {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tahun Tagihan</label>
                            <input type="number" value={txTargetYear} onChange={(e)=>setTxTargetYear(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" />
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                           <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Tagihan Periode Ini</p>
                             <p className="text-xl font-bold text-slate-800">{formatIDR(currentDebtForPeriod)}</p>
                             <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">*Sudah termasuk E-Fee & Materai (jika ada)</p>
                           </div>
                           <button type="button" onClick={() => setTxAmount(formatIDR(currentDebtForPeriod))} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition">Pilih Semua</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Kategori</label>
                        <select value={txCategory} onChange={(e)=>setTxCategory(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition">{TRANSACTION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Keterangan {txType === TransactionType.PAYMENT && '(Opsional)'}</label>
                      <input type="text" value={txDesc} onChange={(e)=>setTxDesc(e.target.value)} required={txType === TransactionType.EXPENSE} placeholder={txType === TransactionType.EXPENSE ? "Misal: Beli Kebutuhan" : "Boleh dikosongkan"} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                    </div>

                    {txType === TransactionType.PAYMENT && availableSavingsForCard > 0 && (
                       <div className="bg-green-50 p-4 rounded-2xl border border-green-100 space-y-3">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Coins size={18} className="text-green-600" />
                                <span className="text-xs font-bold text-green-800">Gunakan Dana Tabungan?</span>
                             </div>
                             <input type="checkbox" checked={txUseSavings} onChange={(e) => setTxUseSavings(e.target.checked)} className="w-5 h-5 accent-green-600" />
                          </div>
                          <div className="flex justify-between text-[10px] text-green-700 font-bold uppercase tracking-wider">
                             <span>Dana Tersedia</span>
                             <span>{formatIDR(availableSavingsForCard)}</span>
                          </div>
                       </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                         {txType === TransactionType.PAYMENT && txUseSavings ? 'Tambahan Bayar Manual' : 'Nominal'}
                      </label>
                      <input type="text" value={txAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setTxAmount)} required={!txUseSavings || txAmount !== ''} placeholder="Rp 0" className="w-full text-3xl font-bold p-2 border-b-2 border-slate-100 outline-none focus:border-blue-500 transition"/>
                      {txType === TransactionType.PAYMENT && txUseSavings && (
                         <div className="flex justify-between pt-2 px-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Pelunasan</span>
                            <span className="text-sm font-bold text-green-600">{formatIDR(availableSavingsForCard + getNumericValue(txAmount))}</span>
                         </div>
                      )}
                    </div>
                 </div>

                 {txType === TransactionType.EXPENSE && ( <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100"><div><p className="text-xs font-bold text-slate-800">Ubah ke Cicilan</p></div><input type="checkbox" checked={txIsInstallment} onChange={(e)=>setTxIsInstallment(e.target.checked)} className="w-5 h-5 rounded accent-blue-600"/></div> )}
                 {txIsInstallment && txType === TransactionType.EXPENSE && ( <div className="space-y-1 animate-in slide-in-from-top-2 duration-200"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tenor Cicilan</label><select value={txInstallmentMonths} onChange={(e)=>setTxInstallmentMonths(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition">{[3, 6, 12, 18, 24].map(m => <option key={m} value={m}>{m} Bulan</option>)}</select></div> )}
                 
                 <div className="space-y-3 pt-4">
                    <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition active:scale-95">{editingTransaction ? 'Update' : 'Simpan'}</button>
                    {editingTransaction && (
                       <button type="button" onClick={() => handleDeleteTransaction(editingTransaction.id)} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition">
                          <Trash2 size={18}/> Hapus
                       </button>
                    )}
                 </div>
             </form>
           </div>
         </div>
      )}

      {savingModalOpen && (
         <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">{editingSaving ? 'Edit Tabungan' : 'Nabung Pelunasan'}</h3><button onClick={() => setSavingModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button></div>
             <form onSubmit={handleSaveSaving} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Untuk Item</label>
                    <select value={savingCardId} onChange={(e)=>setSavingCardId(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition">{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nominal Tabungan</label>
                    <input type="text" value={savingAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setSavingAmount)} required placeholder="Rp 0" className="w-full text-xl font-bold p-2 border-b-2 border-slate-100 outline-none focus:border-blue-500 transition"/>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Keterangan</label>
                    <input type="text" value={savingNote} onChange={(e)=>setSavingNote(e.target.value)} placeholder="Misal: Dana sisa gaji" className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Target Periode Tagihan</label>
                    <div className="grid grid-cols-2 gap-2"><select value={savingTargetMonth} onChange={(e)=>setSavingTargetMonth(parseInt(e.target.value))} className="p-3 bg-slate-50 rounded-xl outline-none text-xs">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={savingTargetYear} onChange={(e)=>setSavingTargetYear(parseInt(e.target.value))} className="p-3 bg-slate-50 rounded-xl outline-none text-xs"/></div>
                 </div>
                 <button type="submit" className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg transition active:scale-95">{editingSaving ? 'Update' : 'Simpan'}</button>
             </form>
           </div>
         </div>
      )}

      {statementModalOpen && activeStatementCard && (
         <div className="fixed inset-0 z-[110] bg-black/60 flex items-end md:items-center md:justify-center">
            <div className="bg-slate-50 w-full md:max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] md:rounded-[32px] rounded-t-[32px] overflow-hidden flex flex-col animate-in slide-in-from-bottom md:zoom-in duration-300">
                <div className={`${activeStatementCard.color || 'bg-slate-800'} p-6 text-white shrink-0`}>
                    <div className="flex justify-between items-center mb-6"><button onClick={() => setStatementModalOpen(false)} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><ChevronDown size={24}/></button><h3 className="font-bold text-lg">E-Statement</h3><div className="w-10"></div></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold">{activeStatementCard.type === DebtType.CREDIT_CARD ? 'Kartu Kredit' : 'Pinjaman Umum'}</p>
                        <h4 className="text-xl font-bold mb-1">{activeStatementCard.name}</h4>
                        <p className="text-xs opacity-80">{activeStatementCard.dueDay ? `Jatuh Tempo: Tgl ${activeStatementCard.dueDay}` : 'Tanpa tgl jatuh tempo tetap'}</p>
                      </div>
                      <Receipt size={32} className="opacity-40" />
                    </div>
                </div>
                <div className="bg-white p-4 border-b border-slate-100 flex gap-3 overflow-x-auto no-scrollbar shrink-0">
                    <div className="flex-1"><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Pilih Bulan</label><select value={statementMonth} onChange={(e)=>setStatementMonth(parseInt(e.target.value))} className="w-full text-sm font-bold bg-slate-50 p-2 rounded-lg outline-none">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
                    <div className="w-24"><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tahun</label><input type="number" value={statementYear} onChange={(e)=>setStatementYear(parseInt(e.target.value))} className="w-full text-sm font-bold bg-slate-50 p-2 rounded-lg outline-none" /></div>
                </div>
                
                <div className="bg-white p-4 border-b border-slate-50 flex gap-4 shrink-0 overflow-x-auto no-scrollbar">
                   <button onClick={() => { setTxType(TransactionType.EXPENSE); setTxCardId(activeStatementCard.id); setTxTargetMonth(statementMonth); setTxTargetYear(statementYear); setTransactionModalOpen(true); }} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition whitespace-nowrap"><Plus size={16}/> Pakai Kartu</button>
                   <button onClick={() => { setTxType(TransactionType.PAYMENT); setTxCardId(activeStatementCard.id); setTxTargetMonth(statementMonth); setTxTargetYear(statementYear); setTxAmount(formatIDR(getMonthlyBill(activeStatementCard.id, statementMonth, statementYear))); setTransactionModalOpen(true); }} className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 active:scale-95 transition whitespace-nowrap"><ArrowDownLeft size={16}/> Bayar Tagihan</button>
                   <button onClick={() => { setSavingCardId(activeStatementCard.id); setSavingTargetMonth(statementMonth); setSavingTargetYear(statementYear); setSavingModalOpen(true); }} className="flex items-center gap-2 bg-green-50 border border-green-100 px-4 py-2 rounded-xl text-xs font-bold text-green-600 active:scale-95 transition whitespace-nowrap"><PiggyBank size={16}/> Tabung Dana</button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-24">
                    {(() => {
                       const s = getStatementData(activeStatementCard.id, statementMonth, statementYear);
                       const cardTheme = CARD_COLORS.find(cc => cc.value === activeStatementCard.color) || CARD_COLORS[0];
                       const projection = Math.max(0, s.totalBill - s.totalPaid - s.totalSaved);
                       return (
                          <>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Total Tagihan</p><p className="text-lg font-bold text-red-500">{formatIDR(s.totalBill)}</p></div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Sudah Dibayar</p><p className="text-lg font-bold text-blue-600">{formatIDR(s.totalPaid)}</p></div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Dana Tabungan</p><p className="text-lg font-bold text-green-600">{formatIDR(s.totalSaved)}</p></div>
                                <div className="bg-slate-800 p-4 rounded-2xl text-white shadow-sm"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Proyeksi Sisa</p><p className="text-lg font-bold text-white">{formatIDR(projection)}</p></div>
                             </div>

                             {/* Bagian Biaya-Biaya */}
                             {(s.adminFee > 0 || s.materai > 0) && (
                                <section className="bg-slate-100/50 p-4 rounded-2xl border border-slate-100">
                                   <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Biaya & Admin Otomatis</h5>
                                   <div className="space-y-2">
                                      {s.adminFee > 0 && (
                                         <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">E-Statement Fee</span>
                                            <span className="font-bold text-slate-800">{formatIDR(s.adminFee)}</span>
                                         </div>
                                      )}
                                      {s.materai > 0 && (
                                         <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                               <span className="text-slate-500 font-medium">Biaya Materai</span>
                                               <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1 rounded font-bold uppercase">Tagihan >= 5JT</span>
                                            </div>
                                            <span className="font-bold text-slate-800">{formatIDR(s.materai)}</span>
                                         </div>
                                      )}
                                   </div>
                                </section>
                             )}

                             <section><h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Cicilan Aktif</h5><div className="space-y-3">{s.installments.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-4">Tidak ada cicilan.</p> : s.installments.map(inst => ( <div key={inst.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center"><div><p className="text-xs font-bold text-slate-800">{inst.name}</p><p className="text-[10px] text-indigo-600 font-bold">Bulan ke-{inst.currentTenor} / {inst.totalMonths}</p></div><span className="font-bold text-slate-800 text-sm">{formatIDR(inst.monthlyAmount)}</span></div>))}</div></section>
                             
                             <section>
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Rincian Transaksi Ritel</h5>
                                <div className="space-y-3">
                                  {s.transactions.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center py-4">Tidak ada pemakaian ritel.</p>
                                  ) : s.transactions.map(t => (
                                    <div key={t.id} onClick={() => openEditTransaction(t)} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition cursor-pointer group">
                                       <div className="flex items-center gap-3">
                                          <button onClick={(e) => { e.stopPropagation(); toggleTransactionValidation(t.id); }} className={`transition transform active:scale-90 ${t.isValidated ? cardTheme.text : 'text-slate-200'}`}>
                                             <CheckCircle2 size={24} fill={t.isValidated ? 'currentColor' : 'none'} className={t.isValidated ? 'fill-current opacity-20' : ''}/>
                                          </button>
                                          <div>
                                             <p className="text-xs font-bold text-slate-800 group-hover:text-primary transition">{t.description}</p>
                                             <p className="text-[10px] text-slate-400">{t.category} • {new Date(t.date).toLocaleDateString('id-ID')}</p>
                                          </div>
                                       </div>
                                       <span className="font-bold text-slate-800 text-sm">{formatIDR(t.amount)}</span>
                                    </div>
                                  ))}
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
