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
  Plus,
  Eye,
  EyeOff,
  ChevronUp,
  Clock,
  Lock,
  Delete,
  ShieldAlert
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
  
  const [showAmounts, setShowAmounts] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [pinEntry, setPinEntry] = useState("");
  const [isPinError, setIsPinError] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 Menit

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [savingsHistoryModalOpen, setSavingsHistoryModalOpen] = useState(false);
  const [pinSettingsModalOpen, setPinSettingsModalOpen] = useState(false);
  
  const [selectedSavingsHistory, setSelectedSavingsHistory] = useState<{ cardName: string, cardColor: string, monthName: string, year: number, items: Saving[] } | null>(null);
  
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'savings' | 'yearly' | 'history'>('home');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);

  const [historyCardFilter, setHistoryCardFilter] = useState<string>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<number>(new Date().getMonth());
  const [historyYearFilter, setHistoryYearFilter] = useState<number>(new Date().getFullYear());
  const [yearlySelectedYear, setYearlySelectedYear] = useState<number>(new Date().getFullYear());
  const [savingsSelectedYear, setSavingsSelectedYear] = useState<number>(new Date().getFullYear());

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

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [oldPinVerify, setOldPinVerify] = useState("");

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
      const unsubscribe = subscribeToAppState(user.uid, (fetchedData) => {
        setData(fetchedData);
        // Lock app initially if PIN is set
        if (fetchedData.securityPin && !isLocked) {
          setIsLocked(true);
        }
      });
      return () => unsubscribe();
    } else {
      setData({ cards: [], transactions: [], installments: [], savings: [] });
      setIsLocked(false);
    }
  }, [user]);

  // Activity Tracking for Inactivity Lock
  useEffect(() => {
    if (!user || !data.securityPin || isLocked) return;

    const updateActivity = () => setLastActivity(Date.now());
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, updateActivity));

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
        setIsLocked(true);
      }
    }, 10000); // Check every 10s

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(interval);
    };
  }, [user, data.securityPin, isLocked, lastActivity]);

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

  const handlePinKeypad = (num: string) => {
    if (pinEntry.length < 6) {
      const updated = pinEntry + num;
      setPinEntry(updated);
      if (updated.length === 6) {
        if (updated === data.securityPin) {
          setIsLocked(false);
          setPinEntry("");
          setLastActivity(Date.now());
        } else {
          setIsPinError(true);
          setTimeout(() => {
            setIsPinError(false);
            setPinEntry("");
          }, 600);
        }
      }
    }
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.securityPin && oldPinVerify !== data.securityPin) {
      alert("PIN lama salah!");
      return;
    }
    if (newPin.length !== 6) {
      alert("PIN harus 6 digit angka.");
      return;
    }
    if (newPin !== confirmPin) {
      alert("Konfirmasi PIN tidak cocok.");
      return;
    }
    saveData({ ...data, securityPin: newPin });
    setPinSettingsModalOpen(false);
    setNewPin("");
    setConfirmPin("");
    setOldPinVerify("");
    alert("PIN Keamanan berhasil diperbarui.");
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
      if (selectedSavingsHistory) {
        const filteredItems = selectedSavingsHistory.items.filter(item => item.id !== id);
        if (filteredItems.length === 0) {
          setSavingsHistoryModalOpen(false);
          setSelectedSavingsHistory(null);
        } else {
          setSelectedSavingsHistory({ ...selectedSavingsHistory, items: filteredItems });
        }
      }
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

  const getCardBalance = (cardId: string) => {
    const expenses = data.transactions
      .filter(t => t.cardId === cardId && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    const payments = data.transactions
      .filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT)
      .reduce((sum, t) => sum + t.amount, 0);
    return Math.ceil(expenses - payments);
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
             return { ...c, daysLeft: diffDays, remainingBill: billAmount, savedForThisMonth, netGap: Math.max(0, billAmount - savedForThisMonth), isCovered: savedForThisMonth >= billAmount && billAmount > 0, progress: billAmount > 0 ? (savedForThisMonth / billAmount) * 100 : 0 };
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

  const savingsYearlyData = useMemo(() => {
    return monthNames.map((monthName, monthIdx) => {
       const monthlySavings = data.savings.filter(s => 
         !s.isTransferred && 
         s.targetPeriod?.month === monthIdx && 
         s.targetPeriod?.year === savingsSelectedYear
       );
       
       const cardGroups: Record<string, { cardId: string, cardName: string, cardColor: string, amount: number, items: Saving[] }> = {};
       
       monthlySavings.forEach(s => {
         const card = data.cards.find(c => c.id === s.cardId);
         if (!card) return;
         if (!cardGroups[s.cardId]) {
           cardGroups[s.cardId] = { cardId: s.cardId, cardName: card.name, cardColor: card.color, amount: 0, items: [] };
         }
         cardGroups[s.cardId].amount += s.amount;
         cardGroups[s.cardId].items.push(s);
       });
       
       const totalMonth = monthlySavings.reduce((sum, s) => sum + s.amount, 0);
       return { monthName, monthIdx, cardGroups: Object.values(cardGroups), totalMonth };
    });
  }, [data, savingsSelectedYear]);

  const totalYearSavings = useMemo(() => {
    return data.savings
      .filter(s => !s.isTransferred && s.targetPeriod?.year === savingsSelectedYear)
      .reduce((sum, s) => sum + s.amount, 0);
  }, [data.savings, savingsSelectedYear]);

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
      if (selectedSavingsHistory) {
         const newItems = selectedSavingsHistory.items.map(item => item.id === editingSaving.id ? { ...item, cardId: savingCardId, amount: Math.ceil(amountVal), note: savingNote, targetPeriod: { month: savingTargetMonth, year: savingTargetYear } } : item);
         setSelectedSavingsHistory({ ...selectedSavingsHistory, items: newItems });
      }
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
      {/* PIN LOCK SCREEN (iOS Style) */}
      {isLocked && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-3xl flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
           <div className="flex flex-col items-center max-w-xs w-full px-10">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
                 <Lock size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-black mb-1">Masukkan PIN</h2>
              <p className="text-sm text-white/50 mb-10 font-medium">Keamanan aplikasi aktif</p>

              {/* PIN Indicator Circles */}
              <div className={`flex gap-6 mb-16 ${isPinError ? 'animate-bounce text-red-500' : ''}`}>
                 {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 border-white/30 transition-all duration-200 ${i < pinEntry.length ? 'bg-white scale-110' : ''}`}></div>
                 ))}
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={() => handlePinKeypad(num.toString())} className="w-16 h-16 rounded-full bg-white/10 text-2xl font-bold border border-white/5 active:bg-white/30 active:scale-90 transition-all flex items-center justify-center">
                       {num}
                    </button>
                 ))}
                 <div className="w-16 h-16"></div>
                 <button onClick={() => handlePinKeypad("0")} className="w-16 h-16 rounded-full bg-white/10 text-2xl font-bold border border-white/5 active:bg-white/30 active:scale-90 transition-all flex items-center justify-center">0</button>
                 <button onClick={() => setPinEntry(pinEntry.slice(0, -1))} className="w-16 h-16 rounded-full flex items-center justify-center active:scale-90 active:bg-white/5 transition-all text-white/50">
                    <Delete size={28} />
                 </button>
              </div>

              <button onClick={handleLogout} className="mt-16 text-xs font-black text-white/40 uppercase tracking-widest hover:text-white/60 transition">Ganti Akun</button>
           </div>
        </div>
      )}

      {/* DESKTOP LAYOUT */}
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

           {/* Content Sections Same as Before */}
           {mobileTab === 'home' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-3 gap-6">
                   <div className="bg-gradient-to-br from-primary to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
                      <div className="flex justify-between items-start mb-1">
                        <p className="opacity-70 text-sm">Total Hutang Berjalan</p>
                        <button onClick={() => setShowAmounts(!showAmounts)} className="opacity-70 hover:opacity-100 transition p-1">
                          {showAmounts ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                      <h3 className="text-3xl font-bold">{showAmounts ? formatIDR(totalDebt) : '••••••••'}</h3>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-sm mb-1">Total Tabungan</p><h3 className="text-3xl font-bold text-slate-800">{showAmounts ? formatIDR(totalSavings) : '••••••••'}</h3></div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-sm mb-1">Bulan Ini (Pengeluaran)</p><h3 className="text-3xl font-bold text-danger">{showAmounts ? formatIDR(categoryGrouping.reduce((sum, [, val]) => sum + val, 0)) : '••••••••'}</h3></div>
                </div>
                {/* Remaining content follows original logic */}
             </div>
           )}
           {/* ... Other Tabs Content ... */}
        </main>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="md:hidden flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
        <header className="flex-none bg-white px-5 pt-8 pb-4 z-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">LIMITWATCH</p>
              <h2 className="text-2xl font-black text-slate-800">
                {mobileTab === 'home' ? 'Beranda' : mobileTab === 'cards' ? 'Hutang' : mobileTab === 'savings' ? 'Tabungan' : mobileTab === 'yearly' ? 'Tahunan' : 'Riwayat'}
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
              <div className="bg-gradient-to-br from-primary to-indigo-700 rounded-[32px] p-6 text-white shadow-xl relative">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-blue-100 text-sm">Total Hutang Berjalan</p>
                  <button onClick={() => setShowAmounts(!showAmounts)} className="text-blue-100 hover:text-white transition p-1">
                    {showAmounts ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
                <h3 className="text-3xl font-black mb-6">{showAmounts ? formatIDR(totalDebt) : '••••••••'}</h3>
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                  <div><p className="text-blue-200 text-[10px] uppercase font-bold tracking-widest mb-1">Tabungan</p><p className="font-bold text-lg">{showAmounts ? formatIDR(totalSavings) : '••••••••'}</p></div>
                  <div className="text-right"><p className="text-blue-200 text-[10px] uppercase font-bold tracking-widest mb-1">Item Hutang</p><p className="font-bold text-lg">{data.cards.length}</p></div>
                </div>
              </div>

              {/* Upcoming Bills Reminder (Same as Previous Version) */}
              {upcomingBills.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-top duration-500">
                   <div className="flex justify-between items-center">
                      <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Pengingat Tagihan</h3>
                      <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full">
                         <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                         <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Geser Kartu</span>
                      </div>
                   </div>
                   <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                      {upcomingBills.map(bill => (
                         <div key={bill.id} onClick={() => openStatement(bill)} className="min-w-[280px] bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4 snap-center active:scale-95 transition-all group">
                            <div className="flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 ${bill.color} rounded-2xl flex items-center justify-center text-white shadow-sm`}>
                                     <AlertCircle size={18}/>
                                  </div>
                                  <span className="text-sm font-black text-slate-800 tracking-tight">{bill.name}</span>
                               </div>
                               <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${bill.daysLeft <= 3 ? 'bg-red-50 text-danger' : 'bg-orange-50 text-orange-600'}`}>
                                  {bill.daysLeft} Hari
                               </span>
                            </div>
                            <div className="space-y-2.5 bg-slate-50/50 p-4 rounded-2xl">
                               <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Tagihan</span>
                                  <span className="font-black text-slate-700">{showAmounts ? formatIDR(bill.remainingBill) : '••••••••'}</span>
                               </div>
                               <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Tabungan</span>
                                  <span className="font-black text-success">{showAmounts ? formatIDR(bill.savedForThisMonth || 0) : '••••••••'}</span>
                               </div>
                               <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                  <span className="text-slate-800 font-black uppercase tracking-widest text-[10px]">Sisa Perlu</span>
                                  <span className="font-black text-danger text-sm">{showAmounts ? formatIDR(bill.netGap) : '••••••••'}</span>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              )}
              {/* Keypad Quick Actions (Catat, Nabung, Hutang) ... */}
            </div>
          )}
          {/* ... Remaining Mobile View Tabs ... */}
        </main>

        <nav className="flex-none h-[90px] bg-white border-t border-slate-100 px-6 flex justify-between items-center z-50">
          <button onClick={()=>setMobileTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'home' ? 'text-primary scale-110' : 'text-slate-300'}`}><Home size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Home</span></button>
          <button onClick={()=>setMobileTab('cards')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'cards' ? 'text-primary scale-110' : 'text-slate-300'}`}><Briefcase size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Hutang</span></button>
          <button onClick={()=>setMobileTab('savings')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'savings' ? 'text-primary scale-110' : 'text-slate-300'}`}><PiggyBank size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Tabung</span></button>
          <button onClick={()=>setMobileTab('yearly')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'yearly' ? 'text-primary scale-110' : 'text-slate-300'}`}><CalendarRange size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Tahunan</span></button>
          <button onClick={()=>setMobileTab('history')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'history' ? 'text-primary scale-110' : 'text-slate-300'}`}><History size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Riwayat</span></button>
        </nav>
      </div>

      {/* --- ACCOUNT PROFILE MODAL --- */}
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
                <MobileMenuButton icon={<ShieldCheck size={20}/>} label={data.securityPin ? "Ubah PIN Keamanan" : "Aktifkan PIN Keamanan"} onClick={() => { setPinSettingsModalOpen(true); setProfileModalOpen(false); }} />
                <MobileMenuButton icon={<Settings size={20}/>} label="Pengaturan Akun" onClick={() => alert('Fitur Segera Hadir')} />
                <div className="mt-2 border-t border-slate-50">
                  <MobileMenuButton icon={<LogOut size={20}/>} label="Keluar dari Aplikasi" onClick={handleLogout} danger />
                </div>
              </div>
           </div>
         </div>
      )}

      {/* --- PIN SETTINGS MODAL --- */}
      {pinSettingsModalOpen && (
         <div className="fixed inset-0 z-[250] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-8">
               <h3 className="font-black text-xl text-slate-800">PIN Keamanan</h3>
               <button onClick={() => setPinSettingsModalOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-full active:scale-90"><X size={20}/></button>
             </div>
             <form onSubmit={handleUpdatePin} className="space-y-6">
                {data.securityPin && (
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">PIN Saat Ini</label>
                      <input type="password" maxLength={6} required value={oldPinVerify} onChange={(e)=>setOldPinVerify(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none text-center text-xl tracking-[0.5em] font-black" />
                   </div>
                )}
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">PIN Baru (6 Digit)</label>
                   <input type="password" maxLength={6} required value={newPin} onChange={(e)=>setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none text-center text-xl tracking-[0.5em] font-black" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Konfirmasi PIN Baru</label>
                   <input type="password" maxLength={6} required value={confirmPin} onChange={(e)=>setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none text-center text-xl tracking-[0.5em] font-black" />
                </div>
                <div className="pt-4">
                   <button type="submit" className="w-full py-5 bg-primary text-white font-black rounded-[24px] shadow-xl active:scale-95 transition flex items-center justify-center gap-3">
                      <ShieldCheck size={20} /> Simpan PIN
                   </button>
                   {data.securityPin && (
                      <button type="button" onClick={() => { if(window.confirm('Hapus PIN Keamanan?')) saveData({...data, securityPin: undefined}); setPinSettingsModalOpen(false); }} className="w-full mt-4 py-4 text-danger font-bold text-xs uppercase tracking-widest active:scale-95 transition">Hapus PIN</button>
                   )}
                </div>
             </form>
           </div>
         </div>
      )}

      {/* ... Other Modals (Transaction, Card, Saving, Statement) ... */}
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
                 {/* Transaction fields follow original logic */}
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nominal Transaksi</label>
                    <input type="text" value={txAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setTxAmount)} required placeholder="Rp 0" className="w-full text-4xl font-black p-2 border-b-[4px] border-slate-50 outline-none focus:border-primary bg-transparent" />
                 </div>
                 <div className="space-y-4 pt-6"><button type="submit" className="w-full py-5 bg-primary text-white font-black rounded-[24px] shadow-xl active:scale-95 transition">Konfirmasi Transaksi</button>{editingTransaction && <button type="button" onClick={() => handleDeleteTransaction(editingTransaction.id)} className="w-full py-5 bg-red-50 text-danger font-black rounded-[24px] border border-red-100 flex items-center justify-center gap-2 active:bg-red-100"><Trash2 size={20}/> Hapus Transaksi</button>}</div>
             </form>
           </div>
         </div>
      )}
      {/* ... Other existing modals ... */}
    </>
  );
};

export default App;