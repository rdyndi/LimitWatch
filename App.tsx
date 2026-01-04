
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
  Vault,
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
  RotateCcw,
  Moon,
  Sun
} from "lucide-react";

// --- Utility Functions ---
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

// --- Sub-components ---

const DesktopNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
    <span className={active ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>{icon}</span>{label}
  </button>
);

const MobileMenuButton = ({ icon, label, onClick, danger = false, rightElement }: { icon: React.ReactNode, label: string, onClick: () => void, danger?: boolean, rightElement?: React.ReactNode }) => (
  <button type="button" onClick={(e) => { e.preventDefault(); onClick(); }} className={`w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 last:border-0 active:bg-slate-100 dark:active:bg-slate-800 transition`}>
     <div className="flex items-center gap-4 pointer-events-none">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-900/20 text-danger' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{icon}</div>
        <span className={`text-sm font-bold ${danger ? 'text-danger' : 'text-slate-700 dark:text-slate-200'}`}>{label}</span>
     </div>
     <div className="flex items-center gap-2 pointer-events-none">
        {rightElement}
        <ChevronRight size={18} className={danger ? 'text-red-300 dark:text-red-800' : 'text-slate-300 dark:text-slate-600'} />
     </div>
  </button>
);

const PinKeypad = ({ onAction }: { onAction: (val: string) => void }) => {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];
  return (
    <div className="grid grid-cols-3 gap-6 max-w-[280px] mx-auto mt-10">
      {keys.map((k, i) => k === "" ? <div key={i} /> : (
        <button key={i} type="button" onClick={() => onAction(k === "DEL" ? "DEL" : k)} className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium transition active:scale-90 ${k === "DEL" ? 'text-slate-400 dark:text-slate-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'}`}>
          {k === "DEL" ? <Delete size={24} /> : k}
        </button>
      ))}
    </div>
  );
};

const PinIndicators = ({ length, iError }: { length: number, iError: boolean }) => (
  <div className={`flex gap-5 justify-center mt-6 ${iError ? 'animate-shake' : ''}`}>
    {[...Array(6)].map((_, i) => (<div key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${i < length ? 'bg-slate-800 dark:bg-slate-100 border-slate-800 dark:border-slate-100 scale-110' : 'border-slate-300 dark:border-slate-700'}`}></div>))}
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authInited, setAuthInited] = useState(false);
  const [data, setData] = useState<AppState>({
    cards: [],
    transactions: [],
    installments: [],
    savings: [],
    theme: 'light',
    security: { pin: null, isPinEnabled: false }
  });
  
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [setupPinStep, setSetupPinStep] = useState<'OFF' | 'ENTER_NEW' | 'CONFIRM_NEW'>('OFF');
  const [tempPin, setTempPin] = useState("");
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isMobileDevice, setIsMobileDevice] = useState(window.innerWidth < 768);
  
  const [showAmounts, setShowAmounts] = useState(true);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [savingsHistoryModalOpen, setSavingsHistoryModalOpen] = useState(false);
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
  const [txUseSavings, setTxUseSavings] = useState(true);
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
    const handleResize = () => setIsMobileDevice(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setUser(user);
      setAuthInited(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToAppState(user.uid, (newState) => {
        setData(newState);
        if (newState.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const toggleTheme = () => {
    const newTheme = data.theme === 'dark' ? 'light' : 'dark';
    const newData = { ...data, theme: newTheme };
    setData(newData);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveData(newData);
  };

  useEffect(() => {
    if (!user || !data.security?.isPinEnabled || isLocked || !isMobileDevice) return;
    const checkInactivity = () => {
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      if (now - lastActivity > tenMinutes) {
        setIsLocked(true);
      }
    };
    const interval = setInterval(checkInactivity, 10000); 
    const updateActivity = () => { setLastActivity(Date.now()); };
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [user, data.security?.isPinEnabled, isLocked, lastActivity, isMobileDevice]);

  const handlePinInput = (num: string) => {
    if (pinInput.length >= 6) return;
    const newVal = pinInput + num;
    setPinInput(newVal);
    setPinError(false);
    if (newVal.length === 6) {
      if (newVal === data.security?.pin) {
        setIsLocked(false);
        setPinInput("");
        setLastActivity(Date.now());
      } else {
        setTimeout(() => {
          setPinError(true);
          setPinInput("");
        }, 200);
      }
    }
  };

  const deletePinInput = () => { setPinInput(prev => prev.slice(0, -1)); };

  const handleSetupPin = (num: string) => {
    if (pinInput.length >= 6) return;
    const newVal = pinInput + num;
    setPinInput(newVal);
    if (newVal.length === 6) {
      if (setupPinStep === 'ENTER_NEW') {
        setTimeout(() => {
          setTempPin(newVal);
          setPinInput("");
          setSetupPinStep('CONFIRM_NEW');
        }, 200);
      } else if (setupPinStep === 'CONFIRM_NEW') {
        if (newVal === tempPin) {
          saveData({ ...data, security: { pin: newVal, isPinEnabled: true } });
          setSetupPinStep('OFF');
          setPinInput("");
          setTempPin("");
        } else {
          setTimeout(() => {
            alert("PIN tidak cocok. Silakan ulangi.");
            setPinInput("");
            setSetupPinStep('ENTER_NEW');
          }, 200);
        }
      }
    }
  };

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
      setData({ cards: [], transactions: [], installments: [], savings: [], theme: 'light', security: { pin: null, isPinEnabled: false } });
      document.documentElement.classList.remove('dark');
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try { await loginWithGoogle(); } catch (err) { setAuthError("Gagal masuk dengan Google."); }
    finally { setAuthLoading(false); }
  };

  const toggleTransactionValidation = (id: string) => {
    const updated = data.transactions.map(t => t.id === id ? { ...t, isValidated: !t.isValidated } : t);
    saveData({ ...data, transactions: updated });
  };

  const toggleInstallmentValidation = (id: string, month: number, year: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const updated = data.installments.map(inst => {
      if (inst.id === id) {
        const validated = inst.validatedTenors || [];
        const newValidated = validated.includes(key) 
          ? validated.filter(v => v !== key) 
          : [...validated, key];
        return { ...inst, validatedTenors: newValidated };
      }
      return inst;
    });
    saveData({ ...data, installments: updated });
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
         const newItems = selectedSavingsHistory.items.filter(item => item.id !== id);
         if (newItems.length === 0) {
           setSavingsHistoryModalOpen(false);
           setSelectedSavingsHistory(null);
         } else {
           setSelectedSavingsHistory({ ...selectedSavingsHistory, items: newItems });
         }
      }
      
      setSavingModalOpen(false);
      setEditingSaving(null);
    }
  };

  const availableSavingsForPeriod = useMemo(() => {
    if (!txCardId) return 0;
    return data.savings
      .filter(s => s.cardId === txCardId && !s.isTransferred && s.targetPeriod?.month === txTargetMonth && s.targetPeriod?.year === txTargetYear)
      .reduce((sum, s) => sum + s.amount, 0);
  }, [data.savings, txCardId, txTargetMonth, txTargetYear]);

  const openEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setTxType(t.type);
    setTxAmount(formatIDR(t.amount));
    setTxDesc(t.description);
    setTxCardId(t.cardId);
    setTxDate(t.date.split('T')[0]);
    setTxCategory(t.category || TRANSACTION_CATEGORIES[0]);
    setTxIsInstallment(!!t.isInstallment);
    setTxUseSavings(true);
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
    const expenses = data.transactions.filter(t => t.cardId === cardId && t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const payments = data.transactions.filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
    return Math.ceil(expenses - payments);
  };

  const getMonthlyBill = (cardId: string, targetMonth: number, targetYear: number) => {
     const card = data.cards.find(c => c.id === cardId);
     if (!card) return 0;
     const expenses = data.transactions.filter(t => {
          if (t.cardId !== cardId || t.type !== TransactionType.EXPENSE || t.isInstallment) return false;
          const billing = getBillingPeriod(t.date, card?.dueDay);
          return billing.month === targetMonth && billing.year === targetYear;
       }).reduce((sum, t) => sum + t.amount, 0);
     const installmentLoad = data.installments.filter(i => i.cardId === cardId).reduce((sum, i) => {
          const billingTenor1 = getBillingPeriod(i.startDate, card?.dueDay);
          const monthDiff = (targetYear - billingTenor1.year) * 12 + (targetMonth - billingTenor1.month);
          if (monthDiff >= 0 && monthDiff < i.totalMonths) { return sum + i.monthlyAmount; }
          return sum;
       }, 0);
     let billBeforeFees = Math.ceil(expenses + installmentLoad);
     let finalBill = billBeforeFees;
     if (billBeforeFees > 0) {
       if (card.eStatementFee) finalBill += card.eStatementFee;
       if (finalBill >= 5000000) finalBill += 10000;
     }
     const paid = data.transactions.filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === targetMonth && t.targetPeriod?.year === targetYear).reduce((sum, t) => sum + t.amount, 0);
     return Math.max(0, Math.ceil(finalBill - paid));
  };

  const getStatementData = (cardId: string, month: number, year: number) => {
      const card = data.cards.find(c => c.id === cardId);
      if (!card) return { transactions: [], installments: [], payments: [], savings: [], totalBill: 0, totalPaid: 0, totalSaved: 0, adminFee: 0, materai: 0 };
      const cardTransactions = data.transactions.filter(t => {
          if (t.cardId !== cardId || t.isInstallment || t.type !== TransactionType.EXPENSE) return false;
          const billing = getBillingPeriod(t.date, card?.dueDay);
          return billing.month === month && billing.year === year;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const cardPayments = data.transactions.filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === month && t.targetPeriod?.year === year)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const cardSavings = data.savings.filter(s => s.cardId === cardId && !s.isTransferred && s.targetPeriod?.month === month && s.targetPeriod?.year === year);
      const activeInstallments = data.installments.filter(inst => {
          const billingTenor1 = getBillingPeriod(inst.startDate, card?.dueDay);
          const monthDiff = (year - billingTenor1.year) * 12 + (month - billingTenor1.month);
          return inst.cardId === cardId && monthDiff >= 0 && monthDiff < inst.totalMonths;
      }).map(inst => {
          const billingTenor1 = getBillingPeriod(inst.startDate, card?.dueDay);
          const monthDiff = (year - billingTenor1.year) * 12 + (month - billingTenor1.month);
          const key = `${year}-${String(month).padStart(2, '0')}`;
          return { 
            ...inst, 
            currentTenor: monthDiff + 1, 
            isValidated: inst.validatedTenors?.includes(key) || false 
          };
      });
      const baseAmount = Math.ceil(cardTransactions.reduce((s, t) => s + t.amount, 0) + activeInstallments.reduce((s, i) => s + i.monthlyAmount, 0));
      let adminFee = 0; let materai = 0;
      if (baseAmount > 0) {
        adminFee = card.eStatementFee || 0;
        if ((baseAmount + adminFee) >= 5000000) materai = 10000;
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
      return data.cards.filter(c => c.dueDay || c.type === DebtType.OTHER_DEBT).map(c => {
             const today = new Date();
             let targetMonth = today.getMonth();
             let targetYear = today.getFullYear();
             if (c.dueDay && today.getDate() >= c.dueDay) { targetMonth++; if (targetMonth > 11) { targetMonth = 0; targetYear++; } }
             const dueDate = c.dueDay ? new Date(targetYear, targetMonth, c.dueDay) : new Date(targetYear, targetMonth, 28);
             const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
             const billAmount = getMonthlyBill(c.id, targetMonth, targetYear);
             const savedForThisMonth = data.savings.filter(s => s.cardId === c.id && !s.isTransferred && s.targetPeriod?.month === targetMonth && s.targetPeriod?.year === targetYear).reduce((sum, s) => sum + s.amount, 0);
             return { ...c, daysLeft: diffDays, remainingBill: billAmount, savedForThisMonth, netGap: Math.max(0, billAmount - savedForThisMonth), isCovered: savedForThisMonth >= billAmount && billAmount > 0, progress: billAmount > 0 ? (savedForThisMonth / billAmount) * 100 : 0 };
          }).filter(c => c.remainingBill > 100).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [data.cards, data.transactions, data.installments, data.savings]);

  const categoryGrouping = useMemo(() => {
    const groups: Record<string, number> = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    data.transactions.filter(t => {
        const d = new Date(t.date);
        return t.type === TransactionType.EXPENSE && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).forEach(t => { const cat = t.category || "Lainnya"; groups[cat] = (groups[cat] || 0) + t.amount; });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [data.transactions]);

  const yearlyData = useMemo(() => {
    return monthNames.map((monthName, monthIdx) => {
        const cardsEstimates = data.cards.map(card => {
            const billTotal = getMonthlyBill(card.id, monthIdx, yearlySelectedYear);
            const saved = data.savings.filter(s => s.cardId === card.id && !s.isTransferred && s.targetPeriod?.month === monthIdx && s.targetPeriod?.year === yearlySelectedYear).reduce((sum, s) => sum + s.amount, 0);
            const progress = billTotal > 0 ? (saved / billTotal) * 100 : 0;
            return { cardId: card.id, cardName: card.name, color: card.color, bill: billTotal, isFullyPaid: billTotal <= 0 && data.transactions.some(t => t.cardId === card.id && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === monthIdx && t.targetPeriod?.year === yearlySelectedYear), saved, gap: Math.max(0, Math.ceil(billTotal - saved)), progress };
        }).filter(ce => ce.bill > 0 || ce.saved > 0 || ce.isFullyPaid);
        const totalMonthGap = Math.ceil(cardsEstimates.reduce((sum, ce) => sum + ce.gap, 0));
        const totalMonthBill = Math.ceil(cardsEstimates.reduce((sum, ce) => sum + ce.bill, 0));
        const totalMonthSaved = Math.ceil(cardsEstimates.reduce((sum, ce) => sum + ce.saved, 0));
        return { monthName, cardsEstimates, totalMonthGap, totalMonthBill, totalMonthSaved };
    });
  }, [data, yearlySelectedYear]);

  const savingsYearlyData = useMemo(() => {
    return monthNames.map((monthName, monthIdx) => {
       const monthlySavings = data.savings.filter(s => !s.isTransferred && s.targetPeriod?.month === monthIdx && s.targetPeriod?.year === savingsSelectedYear);
       const cardGroups: Record<string, { cardId: string, cardName: string, cardColor: string, amount: number, items: Saving[] }> = {};
       monthlySavings.forEach(s => {
         const card = data.cards.find(c => c.id === s.cardId);
         if (!card) return;
         if (!cardGroups[s.cardId]) { cardGroups[s.cardId] = { cardId: s.cardId, cardName: card.name, cardColor: card.color, amount: 0, items: [] }; }
         cardGroups[s.cardId].amount += s.amount;
         cardGroups[s.cardId].items.push(s);
       });
       const totalMonth = monthlySavings.reduce((sum, s) => sum + s.amount, 0);
       return { monthName, monthIdx, cardGroups: Object.values(cardGroups), totalMonth };
    });
  }, [data, savingsSelectedYear]);

  const totalYearSavings = useMemo(() => {
    return data.savings.filter(s => !s.isTransferred && s.targetPeriod?.year === savingsSelectedYear).reduce((sum, s) => sum + s.amount, 0);
  }, [data.savings, savingsSelectedYear]);

  const yearlySummary = useMemo(() => {
    let totalYearBill = 0; let totalYearSaved = 0; let totalYearGap = 0;
    yearlyData.forEach(m => { totalYearBill += m.totalMonthBill; totalYearSaved += m.totalMonthSaved; totalYearGap += m.totalMonthGap; });
    return { totalYearBill, totalYearSaved, totalYearGap };
  }, [yearlyData]);

  const totalDebt = useMemo(() => {
    let globalTotalProyeksi = 0;
    data.cards.forEach(card => {
       const monthMap = new Map<string, number>();
       data.transactions.filter(t => t.cardId === card.id && t.type === TransactionType.EXPENSE && !t.isInstallment).forEach(t => {
          const p = getBillingPeriod(t.date, card.dueDay);
          const key = `${p.year}-${p.month}`;
          monthMap.set(key, (monthMap.get(key) || 0) + t.amount);
       });
       data.installments.filter(i => i.cardId === card.id).forEach(inst => {
          const start = getBillingPeriod(inst.startDate, card.dueDay);
          for(let m=0; m<inst.totalMonths; m++) {
             let curM = start.month + m; 
             let curY = start.year + Math.floor(curM / 12); 
             curM = curM % 12;
             const key = `${curY}-${curM}`;
             monthMap.set(key, (monthMap.get(key) || 0) + inst.monthlyAmount);
          }
       });
       let cardTotalWithFees = 0;
       monthMap.forEach((baseAmount) => {
          let fee = 0; let materai = 0;
          if (baseAmount > 0) {
             fee = card.eStatementFee || 0;
             if ((baseAmount + fee) >= 5000000) materai = 10000;
          }
          cardTotalWithFees += (baseAmount + fee + materai);
       });
       const totalPaidEver = data.transactions.filter(t => t.cardId === card.id && t.type === TransactionType.PAYMENT).reduce((s, t) => s + t.amount, 0);
       globalTotalProyeksi += Math.max(0, cardTotalWithFees - totalPaidEver);
    });
    return Math.ceil(globalTotalProyeksi);
  }, [data.cards, data.transactions, data.installments]);

  const totalSavingsAcrossYears = useMemo(() => Math.ceil(data.savings.filter(s => !s.isTransferred).reduce((s, c) => s + c.amount, 0)), [data.savings]);
  const currentDebtGap = useMemo(() => Math.max(0, totalDebt - totalSavingsAcrossYears), [totalDebt, totalSavingsAcrossYears]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError("");
    try {
      if (isRegistering) { await registerWithEmail(email, password); if (displayName) await updateUserProfile(displayName); }
      else { await loginWithEmail(email, password); }
    } catch (err: any) { setAuthError("Email atau password salah."); }
    finally { setAuthLoading(false); }
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault(); const limitVal = getNumericValue(cardLimit); const estFeeVal = getNumericValue(cardEStatementFee);
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
    e.preventDefault(); const amountVal = getNumericValue(txAmount); if (!txCardId) return;
    let finalAmount = Math.ceil(amountVal); let finalDesc = txDesc;
    let updatedSavings = [...data.savings]; let updatedInstallments = [...data.installments];
    
    if (txType === TransactionType.EXPENSE) { 
       if (amountVal <= 0 || !txDesc) return; 
    } else {
       // Logika Pembayaran
       const savingsUsed = txUseSavings ? availableSavingsForPeriod : 0;
       const totalPaymentReduction = Math.ceil(amountVal + savingsUsed);
       if (totalPaymentReduction <= 0) return; 
       
       finalAmount = totalPaymentReduction;
       if (!finalDesc) finalDesc = `Bayar Tagihan ${monthNames[txTargetMonth]} ${txTargetYear}`;
       
       // Mark specific period savings as transferred
       if (txUseSavings && savingsUsed > 0) {
          updatedSavings = data.savings.map(s => 
            (s.cardId === txCardId && !s.isTransferred && s.targetPeriod?.month === txTargetMonth && s.targetPeriod?.year === txTargetYear) 
            ? { ...s, isTransferred: true } 
            : s
          );
       }
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
    e.preventDefault(); const amountVal = getNumericValue(savingAmount); if (!savingCardId || amountVal <= 0) return;
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
    setSavingModalOpen(false); setSavingAmount(''); setSavingNote('');
  };

  if (!authInited) return (<div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950"><Loader2 size={40} className="animate-spin text-primary" /></div>);

  if (isLocked && isMobileDevice) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-950 rounded-2xl flex items-center justify-center mb-10 shadow-xl"><Lock size={32} /></div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Masukkan PIN</h2>
        <p className={`text-sm font-bold mt-2 transition-colors ${pinError ? 'text-danger' : 'text-slate-400 dark:text-slate-500'}`}>{pinError ? 'PIN Salah, coba lagi' : 'Sesi terkunci karena tidak ada aktivitas'}</p>
        <PinIndicators length={pinInput.length} iError={pinError} /><PinKeypad onAction={(val) => val === "DEL" ? deletePinInput() : handlePinInput(val)} />
        <button type="button" onClick={handleLogout} className="mt-12 text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest hover:text-danger transition">Keluar Sesi</button>
      </div>
    );
  }

  if (setupPinStep !== 'OFF' && isMobileDevice) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 animate-in slide-in-from-bottom duration-500">
        <button type="button" onClick={() => { setSetupPinStep('OFF'); setPinInput(""); }} className="absolute top-10 right-10 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-600 dark:text-slate-400"><X size={24}/></button>
        <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-10 shadow-xl"><ShieldCheck size={32} /></div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{setupPinStep === 'ENTER_NEW' ? 'Set PIN Baru' : 'Konfirmasi PIN'}</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2">{setupPinStep === 'ENTER_NEW' ? 'Gunakan PIN 6-digit untuk keamanan' : 'Masukkan kembali PIN yang Anda buat'}</p>
        <PinIndicators length={pinInput.length} iError={false} /><PinKeypad onAction={(val) => val === "DEL" ? deletePinInput() : handleSetupPin(val)} />
      </div>
    );
  }

  if (!user) return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-md border border-slate-100 dark:border-slate-800">
          <div className="text-center mb-8"><div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Wallet size={32} /></div><h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">LimitWatch</h1><p className="text-slate-500 dark:text-slate-400 mt-2">Kelola kartu kredit & hutang Anda.</p></div>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (<div className="space-y-1"><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nama Lengkap</label><input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition text-slate-800 dark:text-slate-100" placeholder="Masukkan nama..."/></div>)}
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition text-slate-800 dark:text-slate-100" placeholder="email@contoh.com"/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition text-slate-800 dark:text-slate-100" placeholder="********"/></div>
            {authError && <p className="text-danger text-xs text-center font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{authError}</p>}
            <button type="submit" disabled={authLoading} className="w-full bg-primary hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg active:scale-95 disabled:opacity-50">{authLoading ? 'Memproses...' : (isRegistering ? 'Buat Akun' : 'Masuk Sekarang')}</button>
          </form>
          <div className="relative my-8"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-600 font-bold">Atau</span></div></div>
          <button type="button" onClick={handleGoogleLogin} disabled={authLoading} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />Lanjutkan dengan Google</button>
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }} className="w-full mt-6 text-sm text-primary dark:text-blue-400 font-bold hover:underline">{isRegistering ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis'}</button>
        </div>
      </div>
  );

  return (
    <div className={`${data.theme === 'dark' ? 'dark' : ''} h-full`}>
      <div className="hidden md:flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-20 shadow-sm">
           <div className="h-20 flex items-center px-8 border-b border-slate-50 dark:border-slate-800"><div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center mr-3 shadow-md"><Wallet size={18} /></div><span className="font-bold text-xl text-slate-800 dark:text-slate-100">LimitWatch</span></div>
           <nav className="p-4 space-y-1 flex-1">
              <DesktopNavItem icon={<Home size={20}/>} label="Dashboard" active={mobileTab === 'home'} onClick={() => setMobileTab('home')} />
              <DesktopNavItem icon={<CreditCard size={20}/>} label="Kartu & Hutang" active={mobileTab === 'cards'} onClick={() => setMobileTab('cards')} />
              <DesktopNavItem icon={<Vault size={20}/>} label="Tabungan" active={mobileTab === 'savings'} onClick={() => setMobileTab('savings')} />
              <DesktopNavItem icon={<CalendarRange size={20}/>} label="Tahunan" active={mobileTab === 'yearly'} onClick={() => setMobileTab('yearly')} />
              <DesktopNavItem icon={<History size={20}/>} label="Riwayat" active={mobileTab === 'history'} onClick={() => setMobileTab('history')} />
           </nav>
           <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <button type="button" onClick={toggleTheme} className="flex items-center gap-3 text-secondary hover:text-slate-900 dark:hover:text-slate-100 w-full p-3 rounded-lg transition">
                 {data.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                 <span className="font-bold">{data.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button type="button" onClick={handleLogout} className="flex items-center gap-3 text-secondary hover:text-danger w-full p-3 rounded-lg transition"><LogOut size={20} /> <span className="font-bold">Keluar</span></button>
           </div>
        </aside>

        <main className="flex-1 ml-72 p-10 overflow-y-auto no-scrollbar h-full bg-slate-50 dark:bg-slate-950">
           <header className="flex justify-between items-center mb-10">
              <div><h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{mobileTab === 'home' ? 'Dashboard' : mobileTab === 'cards' ? 'Manajemen Hutang' : mobileTab === 'savings' ? 'Tabungan Pelunasan' : mobileTab === 'yearly' ? 'Proyeksi Tahunan' : 'Riwayat Transaksi'}</h1><p className="text-slate-500 dark:text-slate-400">Halo, {user.displayName || user.email}</p></div>
              <div className="flex items-center gap-4"><button type="button" onClick={() => { setEditingTransaction(null); setTxAmount(''); setTxDesc(''); setTxType(TransactionType.EXPENSE); setTransactionModalOpen(true); }} className="bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg active:scale-95"><PlusCircle size={20} /> Transaksi</button><button type="button" onClick={() => setProfileModalOpen(true)} className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm active:scale-95 transition">{user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><UserIcon size={24} /></div>}</button></div>
           </header>

           {mobileTab === 'home' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-3 gap-6">
                   <div className="bg-gradient-to-br from-violet-600 to-primary p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between">
                      <div><div className="flex justify-between items-start mb-1"><p className="opacity-70 text-sm">Liabilitas Proyeksi Total</p><button type="button" onClick={() => setShowAmounts(!showAmounts)} className="opacity-70 hover:opacity-100 transition p-1">{showAmounts ? <Eye size={16} /> : <EyeOff size={16} />}</button></div><h3 className="text-3xl font-bold">{showAmounts ? formatIDR(totalDebt) : '••••••••'}</h3></div>
                      <div className="mt-4 pt-4 border-t border-white/20"><div className="flex justify-between text-xs opacity-80 mb-1"><span>Total Tabungan</span><span>{showAmounts ? formatIDR(totalSavingsAcrossYears) : '••••'}</span></div><div className="flex justify-between text-sm font-black"><span>Sisa Hutang (Gap)</span><span>{showAmounts ? formatIDR(currentDebtGap) : '••••'}</span></div></div>
                   </div>
                   <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center"><p className="text-slate-400 dark:text-slate-500 text-sm mb-1">Total Tabungan (Tersedia)</p><h3 className="text-3xl font-bold text-success">{showAmounts ? formatIDR(totalSavingsAcrossYears) : '••••••••'}</h3></div>
                   <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center"><p className="text-slate-400 dark:text-slate-500 text-sm mb-1">Pengeluaran Bulan Ini</p><h3 className="text-3xl font-bold text-danger">{showAmounts ? formatIDR(categoryGrouping.reduce((sum, [, val]) => sum + val, 0)) : '••••••••'}</h3></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {upcomingBills.length > 0 && (<div><h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Bell size={18} /> Tagihan Dekat Jatuh Tempo</h3><div className="grid gap-4">{upcomingBills.map(c => (<div key={c.id} onClick={() => openStatement(c)} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer flex justify-between items-center"><div className="flex flex-col"><span className="font-bold text-slate-800 dark:text-slate-100">{c.name}</span><span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">{showAmounts ? formatIDR(c.remainingBill) : '••••••••'}</span></div><span className="text-[10px] font-bold px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">{c.daysLeft} Hari Lagi</span></div>))}</div></div>)}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit"><h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2"><PieChart size={18} /> Pengeluaran Kelompok</h3><div className="space-y-4">{categoryGrouping.map(([cat, val], idx) => (<div key={idx} className="space-y-1.5"><div className="flex justify-between items-end"><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat}</span><span className="text-xs font-medium text-slate-400 dark:text-slate-500">{showAmounts ? formatIDR(val) : '••••••••'}</span></div><div className="w-full h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(val / (categoryGrouping.reduce((s, [, v]) => s + v, 0) || 1)) * 100}%` }}></div></div></div>))}</div></div>
                </div>
             </div>
           )}

           {mobileTab === 'cards' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Daftar Kartu & Hutang</h2><button type="button" onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardDue(''); setCardType(DebtType.CREDIT_CARD); setCardEStatementFee(''); setCardModalOpen(true); }} className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><PlusCircle size={18}/> Tambah</button></div>
                <div className="grid grid-cols-3 gap-6">{data.cards.map(card => {
                  const balance = getCardBalance(card.id); const remaining = card.limit - balance;
                  return (<div key={card.id} className="space-y-4"><div onClick={() => openStatement(card)} className={`${card.color || 'bg-slate-800'} p-6 rounded-[28px] text-white shadow-lg relative h-48 flex flex-col justify-between overflow-hidden cursor-pointer active:scale-95 transition-transform`}><div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full -mr-8 -mt-8"></div><div className="flex justify-between items-start relative z-10"><div className="flex flex-col"><span className="text-lg font-bold">{card.name}</span><span className="text-[9px] uppercase font-black opacity-60">{card.type}</span></div><FileText size={24} className="opacity-50" /></div><div className="relative z-10"><p className="text-[10px] opacity-60 uppercase mb-1">Limit / Hutang</p><h4 className="text-2xl font-bold">{showAmounts ? formatIDR(card.limit) : '••••••••'}</h4></div><div className="flex justify-between items-center relative z-10"><p className="text-xs opacity-60 font-medium">{card.dueDay ? `Tempo: Tgl ${card.dueDay}` : 'Tanpa tempo'}</p><div className="text-right"><p className="text-[9px] uppercase font-bold opacity-60">Sisa Limit</p><p className="text-xs font-black">{showAmounts ? formatIDR(remaining) : '••••••••'}</p></div></div></div><div className="flex gap-3"><button type="button" onClick={() => { setEditingCard(card); setCardName(card.name); setCardLimit(formatIDR(card.limit)); setCardDue(card.dueDay?.toString() || ''); setCardColor(card.color); setCardType(card.type); setCardEStatementFee(card.eStatementFee ? formatIDR(card.eStatementFee) : ''); setCardModalOpen(true); }} className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2"><Pencil size={16}/> Edit</button><button type="button" onClick={() => { if(window.confirm('Hapus item?')) saveData({...data, cards: data.cards.filter(c=>c.id!==card.id)}); }} className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-danger rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Trash2 size={16}/> Hapus</button></div></div>);
                })}</div>
             </div>
           )}

           {mobileTab === 'savings' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-end">
                   <div><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tabungan Pelunasan</h2><p className="text-slate-500 dark:text-slate-400">Kelola dana cadangan untuk setiap kartu.</p></div>
                   <div className="flex items-center gap-3">
                     <button type="button" onClick={() => setSavingsSelectedYear(y => y - 1)} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"><ChevronLeft size={18}/></button>
                     <span className="font-black text-slate-800 dark:text-slate-100 px-2">{savingsSelectedYear}</span>
                     <button type="button" onClick={() => setSavingsSelectedYear(y => y + 1)} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"><ChevronRight size={18}/></button>
                   </div>
                </div>
                <div className="bg-gradient-to-br from-success to-emerald-700 p-8 rounded-[32px] text-white shadow-xl flex justify-between items-center">
                   <div><p className="opacity-70 text-sm font-bold uppercase tracking-widest mb-1">Total Tabungan Tahun {savingsSelectedYear}</p><h3 className="text-4xl font-black">{showAmounts ? formatIDR(totalYearSavings) : '••••••••'}</h3></div>
                   <button type="button" onClick={() => { setEditingSaving(null); setSavingAmount(''); setSavingNote(''); setSavingModalOpen(true); }} className="bg-white text-success px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 transition"><Plus size={18}/> Tambah Simpanan</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                   {savingsYearlyData.filter(m => m.totalMonth > 0).map((m, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-fit">
                         <div className="p-5 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center"><h4 className="font-black text-slate-800 dark:text-slate-100">{m.monthName}</h4><span className="text-sm font-black text-success">{showAmounts ? formatIDR(m.totalMonth) : '••••••••'}</span></div>
                         <div className="p-5 space-y-2">
                            {m.cardGroups.map((group, i) => (
                               <button key={i} type="button" onClick={() => { setSelectedSavingsHistory({ cardName: group.cardName, cardColor: group.cardColor, monthName: m.monthName, year: savingsSelectedYear, items: group.items }); setSavingsHistoryModalOpen(true); }} className="w-full flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition group text-left">
                                  <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${group.cardColor}`}></div><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{group.cardName}</span></div>
                                  <div className="flex items-center gap-2"><span className="text-sm font-black text-slate-800 dark:text-slate-100">{showAmounts ? formatIDR(group.amount) : '••••••••'}</span><ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform"/></div>
                               </button>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {mobileTab === 'history' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-3 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Item</label><select value={historyCardFilter} onChange={(e)=>setHistoryCardFilter(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-200"><option value="all">Semua</option>{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Bulan</label><select value={historyMonthFilter} onChange={(e)=>setHistoryMonthFilter(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-200">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
                  <div><label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Tahun</label><input type="number" value={historyYearFilter} onChange={(e)=>setHistoryYearFilter(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-200" /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase"><tr><th className="px-6 py-4">Tgl</th><th className="px-6 py-4">Keterangan</th><th className="px-6 py-4">Item</th><th className="px-6 py-4 text-right">Nominal</th><th className="px-6 py-4 text-center">Buku</th></tr></thead><tbody className="divide-y divide-slate-50 dark:divide-slate-800">{filteredTransactions.length === 0 ? <tr><td colSpan={5} className="text-center py-20 text-slate-400 dark:text-slate-600">Tidak ada transaksi.</td></tr> : filteredTransactions.map(t => (<tr key={t.id} onClick={() => openEditTransaction(t)} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4"><p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.description}</p><p className="text-[10px] text-slate-400 dark:text-slate-500">{t.category}</p></td>
                  <td className="px-6 py-4"><span className={`text-[9px] font-bold px-2 py-1 rounded-full text-white ${data.cards.find(c=>c.id===t.cardId)?.color || 'bg-slate-800'}`}>{data.cards.find(c=>c.id===t.cardId)?.name}</span></td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === TransactionType.EXPENSE ? 'text-danger' : 'text-success'}`}>{showAmounts ? formatIDR(t.amount) : '••••••••'}</td>
                  <td className="px-6 py-4 text-center" onClick={(e)=>e.stopPropagation()}><button type="button" onClick={(e)=>{ e.stopPropagation(); toggleTransactionValidation(t.id); }} className={`transition transform active:scale-90 ${t.isValidated ? 'text-primary dark:text-blue-400' : 'text-slate-200 dark:text-slate-700'}`}><CheckCircle2 size={24}/></button></td>
                </tr>))}</tbody></table></div>
             </div>
           )}

           {mobileTab === 'yearly' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-end">
                   <div><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Ringkasan Tahunan</h2><p className="text-slate-500 dark:text-slate-400">Proyeksi pengeluaran dan tabungan tahun {yearlySelectedYear}</p></div>
                   <input type="number" value={yearlySelectedYear} onChange={(e)=>setYearlySelectedYear(parseInt(e.target.value))} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-slate-100 p-3 rounded-xl text-sm font-bold w-32 shadow-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-6">
                   <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Proyeksi Tagihan</p><h3 className="text-2xl font-bold text-danger">{showAmounts ? formatIDR(yearlySummary.totalYearBill) : '••••••••'}</h3></div>
                   <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Dana Disiapkan</p><h3 className="text-2xl font-bold text-success">{showAmounts ? formatIDR(yearlySummary.totalYearSaved) : '••••••••'}</h3></div>
                   <div className="bg-slate-800 dark:bg-slate-700 p-6 rounded-3xl shadow-lg text-white"><p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Sisa Belum Tercover</p><h3 className="text-2xl font-bold">{showAmounts ? formatIDR(yearlySummary.totalYearGap) : '••••••••'}</h3></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {yearlyData.filter(m => m.totalMonthBill > 0 || m.totalMonthSaved > 0).map((m, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-fit">
                       <div className="p-5 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{m.monthName}</h4>
                            {m.totalMonthGap > 0 ? (
                              <p className="text-[10px] font-black text-danger uppercase mt-0.5 tracking-tight">Kekurangan: {showAmounts ? formatIDR(m.totalMonthGap) : '••••'}</p>
                            ) : m.totalMonthBill > 0 ? (
                              <p className="text-[10px] font-black text-success uppercase mt-0.5 tracking-tight">Tercover Lunas</p>
                            ) : null}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{m.cardsEstimates.length} Item</span>
                       </div>
                       <div className="p-5 space-y-4 flex-1">
                          {m.cardsEstimates.map((ce, i) => (
                            <div key={i} className="space-y-2 pb-2 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                               <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-2.5 h-2.5 rounded-full ${ce.color}`}></div>
                                     <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{ce.cardName}</span>
                                  </div>
                                  {ce.gap > 0 ? (
                                    <span className="text-[10px] font-black text-danger">Sisa: {showAmounts ? formatIDR(ce.gap) : '••••'}</span>
                                  ) : (
                                    <span className="text-[10px] font-black text-success">LUNAS</span>
                                  )}
                               </div>
                               <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full transition-all duration-700 ${ce.progress >= 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.min(100, ce.progress)}%` }}></div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </main>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
        {/* Header with Top Safe Area */}
        <header className="flex-none bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 z-[60]" style={{ paddingTop: 'var(--sat)' }}>
          <div className="px-5 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg"><Wallet size={20} /></div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] leading-none mb-1">LIMITWATCH</p>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none">{mobileTab === 'home' ? 'Beranda' : mobileTab === 'cards' ? 'Hutang' : mobileTab === 'savings' ? 'Tabungan' : mobileTab === 'yearly' ? 'Tahunan' : 'Riwayat'}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm active:scale-90 transition"><Bell size={20} /></button>
              <button type="button" onClick={() => setProfileModalOpen(true)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-sm active:scale-90 transition">{user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-slate-400"/>}</button>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 space-y-6" ref={scrollRef}>
          {mobileTab === 'home' && (
            <div className="space-y-6 animate-in fade-in pb-8">
              <div className="bg-gradient-to-br from-violet-600 to-primary rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start mb-1 relative z-10"><p className="text-blue-100 text-sm">Liabilitas Proyeksi Total</p><button type="button" onClick={() => setShowAmounts(!showAmounts)} className="text-blue-100 hover:text-white transition p-1">{showAmounts ? <Eye size={20} /> : <EyeOff size={20} />}</button></div>
                <h3 className="text-3xl font-black mb-6 relative z-10">{showAmounts ? formatIDR(totalDebt) : '••••••••'}</h3>
                <div className="space-y-3 pt-5 border-t border-white/10 relative z-10">
                  <div className="flex justify-between items-center"><p className="text-blue-200 text-[10px] uppercase font-bold tracking-widest">Total Simpanan</p><p className="font-bold text-base">{showAmounts ? formatIDR(totalSavingsAcrossYears) : '••••'}</p></div>
                  <div className="flex justify-between items-center pt-1"><p className="text-white text-[10px] uppercase font-black tracking-widest">Sisa Hutang (Gap)</p><p className="font-black text-xl text-yellow-300">{showAmounts ? formatIDR(currentDebtGap) : '••••'}</p></div>
                </div>
              </div>
              
              {upcomingBills.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-top duration-500">
                   <div className="flex justify-between items-center"><h3 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight">Pengingat Tagihan</h3><div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span><span className="text-[10px] font-black text-primary dark:text-blue-400 uppercase tracking-tighter">Geser Kartu</span></div></div>
                   <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                      {upcomingBills.map(bill => (
                         <div key={bill.id} onClick={() => openStatement(bill)} className="min-w-[85vw] bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3 snap-center active:scale-[0.98] transition-all group border-b-2">
                            <div className="flex justify-between items-center"><div className="flex items-center gap-2.5"><div className={`w-9 h-9 ${bill.color} rounded-xl flex items-center justify-center text-white shadow-sm`}><AlertCircle size={16}/></div><span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{bill.name}</span></div><span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${bill.daysLeft <= 3 ? 'bg-red-50 dark:bg-red-900/30 text-danger dark:text-red-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>{bill.daysLeft} Hari</span></div>
                            <div className="grid grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl"><div className="flex flex-col"><span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[8px]">Tagihan</span><span className="font-black text-slate-700 dark:text-slate-200 text-xs">{showAmounts ? formatIDR(bill.remainingBill) : '••••••••'}</span></div><div className="flex flex-col text-right"><span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[8px]">Tabungan</span><span className="font-black text-success text-xs">{showAmounts ? formatIDR(bill.savedForThisMonth || 0) : '••••••••'}</span></div><div className="col-span-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center"><span className="text-slate-800 dark:text-slate-300 font-black uppercase tracking-widest text-[9px]">Sisa Perlu</span><span className="font-black text-danger text-xs">{showAmounts ? formatIDR(bill.netGap) : '••••••••'}</span></div></div>
                         </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <button type="button" onClick={() => { setEditingTransaction(null); setTxAmount(''); setTxDesc(''); setTxType(TransactionType.EXPENSE); setTransactionModalOpen(true); }} className="flex flex-col items-center gap-2 group"><div className="w-full aspect-square bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-all"><PlusCircle size={28}/></div><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Catat</span></button>
                <button type="button" onClick={() => { setEditingSaving(null); setSavingAmount(''); setSavingNote(''); setSavingModalOpen(true); }} className="flex flex-col items-center gap-2 group"><div className="w-full aspect-square bg-emerald-50 dark:bg-emerald-900/30 text-success dark:text-emerald-400 rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-all"><Vault size={28}/></div><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nabung</span></button>
                <button type="button" onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardType(DebtType.CREDIT_CARD); setCardModalOpen(true); }} className="flex flex-col items-center gap-2 group"><div className="w-full aspect-square bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-all"><Briefcase size={28}/></div><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Hutang</span></button>
              </div>
            </div>
          )}

          {mobileTab === 'history' && (
            <div className="space-y-6 animate-in fade-in pb-8">
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  <select value={historyCardFilter} onChange={(e)=>setHistoryCardFilter(e.target.value)} className="shrink-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl text-xs font-bold shadow-sm dark:text-slate-200 outline-none"><option value="all">💳 Semua</option>{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <select value={historyMonthFilter} onChange={(e)=>setHistoryMonthFilter(parseInt(e.target.value))} className="shrink-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl text-xs font-bold shadow-sm dark:text-slate-200 outline-none">{monthNames.map((m, i) => <option key={i} value={i}>📅 {m}</option>)}</select>
                </div>
              </div>
              <div className="space-y-3">
                {filteredTransactions.length > 0 ? filteredTransactions.map(t => {
                  const card = data.cards.find(c => c.id === t.cardId);
                  return (
                    <div key={t.id} onClick={() => openEditTransaction(t)} className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-50 dark:border-slate-800 shadow-sm flex justify-between items-center active:scale-[0.98] transition group relative overflow-hidden"><div className={`absolute left-0 top-0 bottom-0 w-1 ${card?.color || 'bg-slate-800'}`}></div><div className="pl-2 space-y-1"><p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">{t.description}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleDateString('id-ID')}</p></div><div className="flex items-center gap-3"><span className={`text-sm font-black ${t.type === TransactionType.EXPENSE ? 'text-danger' : 'text-success'}`}>{showAmounts ? formatIDR(t.amount) : '••••'}</span><button type="button" onClick={(e) => { e.stopPropagation(); toggleTransactionValidation(t.id); }} className={`p-2 rounded-full transform active:scale-90 ${t.isValidated ? 'text-primary dark:text-blue-400' : 'text-slate-200 dark:text-slate-800'}`}><CheckCircle2 size={24}/></button></div></div>
                  );
                }) : (<div className="text-center py-20"><History size={48} className="mx-auto text-slate-100 dark:text-slate-800 mb-4" /><p className="text-slate-400 dark:text-slate-600 font-bold text-sm">Tidak ada transaksi.</p></div>)}
              </div>
            </div>
          )}

          {mobileTab === 'yearly' && (
            <div className="space-y-6 animate-in fade-in pb-8">
              <div className="bg-[#1a2332] rounded-[32px] p-6 text-white shadow-xl space-y-4">
                <div className="flex justify-between items-center"><div className="flex items-center gap-2"><Calendar className="text-blue-400" size={20} /><span className="text-base font-black">{yearlySelectedYear}</span></div><div className="flex gap-2"><button type="button" onClick={() => setYearlySelectedYear(y => y - 1)} className="p-1.5 bg-white/10 rounded-lg active:bg-white/20"><ChevronLeft size={16}/></button><button type="button" onClick={() => setYearlySelectedYear(y => y + 1)} className="p-1.5 bg-white/10 rounded-lg active:bg-white/20"><ChevronRight size={16}/></button></div></div>
                <div className="grid grid-cols-2 gap-4 pt-2"><div className="space-y-1"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Tagihan</p><p className="text-lg font-bold">{showAmounts ? formatIDR(yearlySummary.totalYearBill) : '••••'}</p></div><div className="text-right space-y-1"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dana Siap</p><p className="text-lg font-bold text-success">{showAmounts ? formatIDR(yearlySummary.totalYearSaved) : '••••'}</p></div></div>
              </div>
              {yearlyData.filter(m => m.totalMonthBill > 0 || m.totalMonthSaved > 0).map((m, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-[32px] p-5 shadow-sm border border-slate-50 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center"><h4 className="font-black text-slate-800 dark:text-slate-100">{m.monthName}</h4><span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${m.totalMonthGap === 0 ? 'bg-success/10 text-success' : 'bg-red-50 text-danger'}`}>{m.totalMonthGap === 0 ? 'Lunas' : `Kurang ${showAmounts ? formatIDR(m.totalMonthGap) : '••'}`}</span></div>
                  <div className="space-y-4">{m.cardsEstimates.map((ce, i) => (<div key={i} className="space-y-1"><div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400 uppercase">{ce.cardName}</span><span className={ce.progress >= 100 ? 'text-success' : 'text-slate-700 dark:text-slate-300'}>{showAmounts ? formatIDR(ce.saved) : '••'}</span></div><div className="h-1 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 ${ce.progress >= 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.min(100, ce.progress)}%` }}></div></div></div>))}</div>
                </div>
              ))}
            </div>
          )}

          {mobileTab === 'cards' && (
             <div className="space-y-4 animate-in fade-in pb-8">
               {data.cards.map(card => {
                  const balance = getCardBalance(card.id); const remaining = card.limit - balance;
                  return (
                    <div key={card.id} className="space-y-3">
                      <div onClick={() => openStatement(card)} className={`${card.color || 'bg-slate-800'} p-5 rounded-[32px] text-white shadow-lg relative h-44 flex flex-col justify-between overflow-hidden active:scale-[0.98] transition cursor-pointer`}>
                          <div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full -mr-8 -mt-8"></div>
                          <div className="relative z-10 flex justify-between items-start"><div><p className="text-[9px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">{card.type === DebtType.CREDIT_CARD ? 'Credit Card' : 'Debt Item'}</p><h4 className="text-lg font-black tracking-tight">{card.name}</h4></div></div>
                          <div className="relative z-10"><p className="text-[9px] opacity-60 uppercase font-black tracking-tighter">Total Limit</p><p className="text-xl font-black">{showAmounts ? formatIDR(card.limit) : '••••••••'}</p></div>
                          <div className="relative z-10 flex justify-between items-end pt-2 border-t border-white/10"><div><p className="text-[9px] opacity-60 uppercase font-black tracking-tighter">Sisa Limit</p><p className="text-sm font-black">{showAmounts ? formatIDR(remaining) : '••••••••'}</p></div><div className="text-right opacity-60"><span className="text-[9px] font-black uppercase">{card.dueDay ? `TGL ${card.dueDay}` : 'N/A'}</span></div></div>
                      </div>
                      <div className="flex gap-2"><button type="button" onClick={() => { setEditingCard(card); setCardName(card.name); setCardLimit(formatIDR(card.limit)); setCardDue(card.dueDay?.toString() || ''); setCardColor(card.color); setCardType(card.type); setCardEStatementFee(card.eStatementFee ? formatIDR(card.eStatementFee) : ''); setCardModalOpen(true); }} className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 active:bg-slate-50 transition"><Pencil size={14}/> Edit</button><button type="button" onClick={() => { if(window.confirm('Hapus item?')) saveData({...data, cards: data.cards.filter(c=>c.id!==card.id)}); }} className="flex-1 py-3 bg-red-50 dark:bg-red-900/10 text-danger rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 active:bg-red-100 transition"><Trash2 size={14}/> Hapus</button></div>
                    </div>
                  );
                })}<button type="button" onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardModalOpen(true); }} className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] text-slate-400 dark:text-slate-600 font-bold flex items-center justify-center gap-2 active:bg-slate-50 transition"><Plus size={20}/> Tambah Baru</button>
             </div>
          )}

          {mobileTab === 'savings' && (
            <div className="space-y-6 animate-in fade-in pb-8">
              <div className="bg-gradient-to-br from-success to-emerald-700 rounded-[32px] p-6 text-white shadow-xl">
                 <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><Calendar size={18} className="text-emerald-200"/><span className="text-base font-black">{savingsSelectedYear}</span></div><div className="flex gap-2"><button type="button" onClick={() => setSavingsSelectedYear(y => y - 1)} className="p-1.5 bg-white/10 rounded-lg active:bg-white/20"><ChevronLeft size={16}/></button><button type="button" onClick={() => setSavingsSelectedYear(y => y + 1)} className="p-1.5 bg-white/10 rounded-lg active:bg-white/20"><ChevronRight size={16}/></button></div></div>
                 <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Simpanan</p><h3 className="text-2xl font-black">{showAmounts ? formatIDR(totalYearSavings) : '••••••••'}</h3>
              </div>
              <div className="space-y-4">{savingsYearlyData.filter(m => m.totalMonth > 0).map((m, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800 p-5 space-y-3">
                       <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2"><h4 className="font-black text-sm text-slate-800 dark:text-slate-100">{m.monthName}</h4><span className="text-xs font-black text-success">{showAmounts ? formatIDR(m.totalMonth) : '••••'}</span></div>
                       <div className="space-y-2">{m.cardGroups.map((group, i) => (<button key={i} type="button" onClick={() => { setSelectedSavingsHistory({ cardName: group.cardName, cardColor: group.cardColor, monthName: m.monthName, year: savingsSelectedYear, items: group.items }); setSavingsHistoryModalOpen(true); }} className="w-full flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:bg-slate-100 transition group"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${group.cardColor}`}></div><span className="text-xs font-bold text-slate-600 dark:text-slate-400">{group.cardName}</span></div><div className="flex items-center gap-1"><span className="text-xs font-black text-slate-800 dark:text-slate-200">{showAmounts ? formatIDR(group.amount) : '••'}</span><ChevronRight size={12} className="text-slate-300"/></div></button>))}</div>
                    </div>
                 ))}</div>
            </div>
          )}
        </main>

        {/* Bottom Navigation with Safe Area */}
        <nav className="flex-none bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.03)]" style={{ paddingBottom: 'var(--sab)' }}>
          <div className="h-16 flex justify-between items-center">
            <button type="button" onClick={()=>setMobileTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'home' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><Home size={24} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Beranda</span></button>
            <button type="button" onClick={()=>setMobileTab('cards')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'cards' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><Briefcase size={24} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Hutang</span></button>
            <button type="button" onClick={()=>setMobileTab('savings')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'savings' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><Vault size={24} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Tabung</span></button>
            <button type="button" onClick={()=>setMobileTab('yearly')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'yearly' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><CalendarRange size={24} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Tahunan</span></button>
            <button type="button" onClick={()=>setMobileTab('history')} className={`flex flex-col items-center gap-1.5 transition-all ${mobileTab === 'history' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><History size={24} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Riwayat</span></button>
          </div>
        </nav>
      </div>

      {/* --- MODALS --- */}
      {profileModalOpen && (
         <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300 border border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-8 flex flex-col items-center border-b border-slate-100 dark:border-slate-800 relative"><button type="button" onClick={() => setProfileModalOpen(false)} className="absolute top-6 right-6 p-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 active:scale-90"><X size={20} /></button><div className="w-24 h-24 rounded-full border-[6px] border-white dark:border-slate-900 shadow-xl overflow-hidden flex items-center justify-center mb-5">{user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-slate-400" />}</div><h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{user.displayName || 'User'}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.email}</p></div>
              <div className="p-3">
                 <MobileMenuButton icon={data.theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>} label={data.theme === 'dark' ? 'Gunakan Light Mode' : 'Gunakan Dark Mode'} onClick={toggleTheme} />
                 {isMobileDevice && (<MobileMenuButton icon={<ShieldCheck size={20}/>} label="Pengamanan PIN" rightElement={<span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${data.security?.isPinEnabled ? 'bg-success/10 text-success' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{data.security?.isPinEnabled ? 'AKTIF' : 'OFF'}</span>} onClick={() => { setSetupPinStep('ENTER_NEW'); setPinInput(""); }} />)}
                 <div className="mt-2 border-t border-slate-50 dark:border-slate-800"><MobileMenuButton icon={<LogOut size={20}/>} label="Keluar Aplikasi" onClick={handleLogout} danger /></div>
              </div>
           </div>
         </div>
      )}

      {savingsHistoryModalOpen && selectedSavingsHistory && (
         <div className="fixed inset-0 z-[150] bg-black/70 flex items-end md:items-center md:justify-center p-0 md:p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-lg rounded-t-[40px] md:rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
               <div className={`${selectedSavingsHistory.cardColor} p-6 text-white shrink-0`}><div className="flex justify-between items-center mb-6"><button type="button" onClick={() => setSavingsHistoryModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition"><X size={20}/></button><span className="text-[10px] font-black uppercase tracking-widest">Riwayat Simpanan</span><div className="w-8"></div></div><div className="flex justify-between items-end"><div><h4 className="text-xl font-black">{selectedSavingsHistory.cardName}</h4><p className="text-xs font-bold opacity-70 uppercase mt-1">{selectedSavingsHistory.monthName} {selectedSavingsHistory.year}</p></div><div className="text-right"><p className="text-[10px] font-bold opacity-60 uppercase mb-1">Total</p><h3 className="text-lg font-black">{showAmounts ? formatIDR(selectedSavingsHistory.items.reduce((s, i) => s + i.amount, 0)) : '••••'}</h3></div></div></div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-10">{selectedSavingsHistory.items.map(item => (<div key={item.id} onClick={() => openEditSaving(item)} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex justify-between items-center active:scale-[0.98] transition cursor-pointer"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-success shadow-sm"><Vault size={20}/></div><div><p className="text-sm font-black text-slate-800 dark:text-slate-100">{item.note}</p><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">{new Date(item.date).toLocaleDateString('id-ID')}</p></div></div><p className="text-sm font-black text-success">{showAmounts ? formatIDR(item.amount) : '••••'}</p></div>))}</div>
            </div>
         </div>
      )}

      {cardModalOpen && (
         <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-200 border dark:border-slate-800">
             <div className="flex justify-between items-center mb-8"><h3 className="font-black text-xl text-slate-800 dark:text-slate-100">{editingCard ? 'Edit Item' : 'Tambah Item'}</h3><button type="button" onClick={() => setCardModalOpen(false)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full active:scale-90 text-slate-600 dark:text-slate-400"><X size={20}/></button></div>
             <form onSubmit={handleSaveCard} className="space-y-5">
                 <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl"><button type="button" onClick={()=>setCardType(DebtType.CREDIT_CARD)} className={`py-2.5 text-[10px] font-black rounded-xl transition ${cardType === DebtType.CREDIT_CARD ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-blue-400' : 'text-slate-500'}`}>KARTU KREDIT</button><button type="button" onClick={()=>setCardType(DebtType.OTHER_DEBT)} className={`py-2.5 text-[10px] font-black rounded-xl transition ${cardType === DebtType.OTHER_DEBT ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-blue-400' : 'text-slate-500'}`}>HUTANG LAIN</button></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Nama Item</label><input type="text" value={cardName} onChange={(e)=>setCardName(e.target.value)} required placeholder="Contoh: Cicilan Gadget" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl outline-none border-2 border-transparent focus:border-primary transition font-bold" /></div>
                 <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Limit/Liabilitas</label><input type="text" value={cardLimit} onChange={(e)=>handleCurrencyInput(e.target.value, setCardLimit)} required placeholder="Rp 0" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl font-black" /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tgl Tempo</label><input type="number" min="1" max="31" value={cardDue} onChange={(e)=>setCardDue(e.target.value)} placeholder="Tgl 1-31" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl font-bold" /></div></div>
                 <div className="flex gap-2.5 flex-wrap pt-2">{CARD_COLORS.map(c => (<button key={c.value} type="button" onClick={() => setCardColor(c.value)} className={`w-8 h-8 rounded-full ${c.value} ${cardColor === c.value ? 'ring-2 ring-offset-4 ring-primary' : ''} transition-all`}></button>))}</div>
                 <button type="submit" className="w-full py-5 bg-slate-800 dark:bg-blue-600 text-white font-black rounded-[24px] shadow-xl active:scale-95 transition mt-4">Simpan Data</button>
             </form>
           </div>
         </div>
      )}

      {transactionModalOpen && (
         <div className="fixed inset-0 z-[120] bg-black/70 flex items-end md:items-center md:justify-center backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 w-full md:max-w-xl h-[85vh] md:h-auto md:max-h-[90vh] md:rounded-[40px] rounded-t-[40px] p-8 shadow-2xl overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-6"><h3 className="font-black text-xl text-slate-800 dark:text-slate-100">{editingTransaction ? 'Detail Transaksi' : 'Catat Pemakaian'}</h3><button type="button" onClick={() => setTransactionModalOpen(false)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full active:scale-90 text-slate-600 dark:text-slate-400"><X size={20}/></button></div>
             <form onSubmit={handleSaveTransaction} className="space-y-6">
                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[20px]"><button type="button" onClick={()=>setTxType(TransactionType.EXPENSE)} className={`flex-1 py-3 text-xs font-black rounded-2xl transition ${txType === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-danger shadow-sm' : 'text-slate-500'}`}>PAKAI</button><button type="button" onClick={()=>setTxType(TransactionType.PAYMENT)} className={`flex-1 py-3 text-xs font-black rounded-2xl transition ${txType === TransactionType.PAYMENT ? 'bg-white dark:bg-slate-700 text-success shadow-sm' : 'text-slate-500'}`}>BAYAR</button></div>
                 <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pilih Item</label><select value={txCardId} onChange={(e)=>setTxCardId(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold">{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal</label><input type="date" value={txDate} onChange={(e)=>setTxDate(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold"/></div></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nominal</label><input type="text" value={txAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setTxAmount)} required placeholder="Rp 0" className="w-full text-4xl font-black p-2 border-b-[4px] border-slate-100 dark:border-slate-800 outline-none focus:border-primary bg-transparent text-slate-800 dark:text-slate-100" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Keterangan</label><input type="text" value={txDesc} onChange={(e)=>setTxDesc(e.target.value)} placeholder="Misal: Makan Siang" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl border-2 border-transparent focus:border-primary outline-none transition font-bold" /></div>
                 <div className="space-y-4 pt-4"><button type="submit" className="w-full py-5 bg-primary text-white font-black rounded-[24px] shadow-xl active:scale-95 transition">Konfirmasi</button>{editingTransaction && (<button type="button" onClick={() => handleDeleteTransaction(editingTransaction.id)} className="w-full py-5 bg-red-50 dark:bg-red-900/10 text-danger font-black rounded-[24px] flex items-center justify-center gap-2 active:bg-red-100 transition"><Trash2 size={20}/> Hapus Transaksi</button>)}</div>
             </form>
           </div>
         </div>
      )}

      {savingModalOpen && (
         <div className="fixed inset-0 z-[160] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-200 border dark:border-slate-800">
             <div className="flex justify-between items-center mb-8"><h3 className="font-black text-xl text-slate-800 dark:text-slate-100">Simpan Dana</h3><button type="button" onClick={() => setSavingModalOpen(false)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full active:scale-90 text-slate-600 dark:text-slate-400"><X size={20}/></button></div>
             <form onSubmit={handleSaveSaving} className="space-y-6">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Target Kartu</label><select value={savingCardId} onChange={(e)=>setSavingCardId(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold">{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nominal</label><input type="text" value={savingAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setSavingAmount)} required placeholder="Rp 0" className="w-full text-2xl font-black p-2 border-b-[3px] border-slate-100 dark:border-slate-800 outline-none focus:border-success bg-transparent text-slate-800 dark:text-slate-100" /></div>
                 <div className="grid grid-cols-2 gap-3"><select value={savingTargetMonth} onChange={(e)=>setSavingTargetMonth(parseInt(e.target.value))} className="p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-xs font-bold">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={savingTargetYear} onChange={(e)=>setSavingTargetYear(parseInt(e.target.value))} className="p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-xs font-bold"/></div>
                 <button type="submit" className="w-full py-5 bg-success text-white font-black rounded-[24px] shadow-xl active:scale-95 transition">Amankan</button>
             </form>
           </div>
         </div>
      )}

      {statementModalOpen && activeStatementCard && (
         <div className="fixed inset-0 z-[110] bg-black/70 flex items-end md:items-center md:justify-center backdrop-blur-sm">
            <div className="bg-slate-50 dark:bg-slate-950 w-full md:max-w-2xl h-[90vh] md:h-auto md:max-h-[92vh] md:rounded-[40px] rounded-t-[40px] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 border-t dark:border-slate-800">
                <div className={`${activeStatementCard.color} p-8 text-white shrink-0`}><div className="flex justify-between items-center mb-8"><button type="button" onClick={() => setStatementModalOpen(false)} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center active:scale-90 transition"><ChevronDown size={24}/></button><h3 className="font-black text-xl tracking-tight uppercase">E-Statement</h3><div className="w-10"></div></div><div className="flex justify-between items-start"><div><p className="text-[10px] opacity-70 uppercase tracking-widest font-black mb-1">{activeStatementCard.type}</p><h4 className="text-2xl font-black">{activeStatementCard.name}</h4></div><Receipt size={40} className="opacity-30" /></div></div>
                <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 shadow-sm"><select value={statementMonth} onChange={(e)=>setStatementMonth(parseInt(e.target.value))} className="flex-1 text-sm font-black bg-slate-50 dark:bg-slate-800 dark:text-slate-100 p-3 rounded-2xl outline-none">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={statementYear} onChange={(e)=>setStatementYear(parseInt(e.target.value))} className="w-24 text-sm font-black bg-slate-50 dark:bg-slate-800 dark:text-slate-100 p-3 rounded-2xl outline-none" /></div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-10 bg-white dark:bg-slate-900">
                   {(() => {
                      const s = getStatementData(activeStatementCard.id, statementMonth, statementYear);
                      return (
                        <>
                          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</span><span className="text-lg font-black text-slate-800 dark:text-slate-100">{showAmounts ? formatIDR(s.totalBill) : '••••'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-success uppercase">Dibayar</span><span className="text-sm font-black text-success">-{showAmounts ? formatIDR(s.totalPaid) : '••'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-primary uppercase">Tabungan</span><span className="text-sm font-black text-primary">-{showAmounts ? formatIDR(s.totalSaved) : '••'}</span></div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700"><span className="text-[10px] font-black text-danger uppercase">Sisa Bersih</span><span className="text-xl font-black text-danger">{showAmounts ? formatIDR(Math.max(0, s.totalBill - s.totalPaid - s.totalSaved)) : '••••'}</span></div>
                          </div>
                          
                          <section>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">TRANSAKSI</h5>
                            <div className="space-y-3">
                              {s.transactions.map(t => (
                                <div key={t.id} onClick={() => openEditTransaction(t)} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-50 dark:border-slate-700 flex justify-between items-center active:scale-[0.98] transition cursor-pointer">
                                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400"><FileText size={18}/></div><div><p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase leading-tight">{t.description}</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{new Date(t.date).toLocaleDateString('id-ID')}</p></div></div>
                                  <div className="flex items-center gap-2"><span className="font-black text-danger text-sm">{showAmounts ? formatIDR(t.amount) : '••'}</span><button type="button" onClick={(e) => { e.stopPropagation(); toggleTransactionValidation(t.id); }} className={`p-2 rounded-full transform active:scale-90 ${t.isValidated ? 'text-primary dark:text-blue-400' : 'text-slate-200 dark:text-slate-600'}`}><CheckCircle2 size={24}/></button></div>
                                </div>
                              ))}
                              {s.transactions.length === 0 && <p className="text-[10px] text-slate-300 italic text-center">Tidak ada transaksi.</p>}
                            </div>
                          </section>

                          <section>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">CICILAN</h5>
                            <div className="space-y-3">
                              {s.installments.map(inst => (
                                <div key={inst.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                  <div><p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase">{inst.name}</p><p className="text-[9px] text-primary font-black uppercase mt-0.5">T {inst.currentTenor}/{inst.totalMonths}</p></div>
                                  <div className="flex items-center gap-2"><span className="font-black text-slate-800 dark:text-slate-100">{showAmounts ? formatIDR(inst.monthlyAmount) : '••'}</span><button type="button" onClick={(e) => { e.stopPropagation(); toggleInstallmentValidation(inst.id, statementMonth, statementYear); }} className={`p-2 rounded-full transform active:scale-90 ${inst.isValidated ? 'text-primary dark:text-blue-400' : 'text-slate-200 dark:text-slate-600'}`}><CheckCircle2 size={24}/></button></div>
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
    </div>
  );
};

export default App;
