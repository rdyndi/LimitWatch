
import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  AppState, 
  Installment, 
  Transaction, 
  TransactionType,
  CreditCard as CreditCardType,
  Saving,
  DebtType,
  ViewMode
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
  AlertCircle,
  Bell,
  CheckCircle2,
  CalendarRange,
  ChevronLeft,
  PieChart,
  ShieldCheck,
  Briefcase,
  Loader2,
  Receipt,
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  Lock,
  Delete,
  Moon,
  Sun,
  ArrowDownCircle,
  ArrowUpCircle,
  Info,
  CalendarClock
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

const PageHeader = ({ title, onBack, rightElement, className = "" }: { title: string, onBack?: () => void, rightElement?: React.ReactNode, className?: string }) => (
  <header className={`flex-none bg-white dark:bg-slate-900 border-b dark:border-slate-800 z-[60] sticky top-0 ${className}`} style={{ paddingTop: 'var(--sat, 0px)' }}>
    <div className="px-5 md:px-8 h-16 flex justify-between items-center max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 active:scale-90 transition hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <ChevronLeft size={24} />
          </button>
        )}
        <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-none truncate max-w-[200px] md:max-w-md">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
      </div>
    </div>
  </header>
);

const DesktopNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 translate-x-1' : 'text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
    <span className={active ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>{icon}</span>{label}
  </button>
);

const MobileMenuButton = ({ icon, label, onClick, danger = false, rightElement }: { icon: React.ReactNode, label: string, onClick: () => void, danger?: boolean, rightElement?: React.ReactNode }) => (
  <button type="button" onClick={onClick} className={`w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 last:border-0 active:bg-slate-100 dark:active:bg-slate-800 transition`}>
     <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-900/20 text-danger' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{icon}</div>
        <span className={`text-sm font-bold ${danger ? 'text-danger' : 'text-slate-700 dark:text-slate-200'}`}>{label}</span>
     </div>
     <div className="flex items-center gap-2">
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
  
  const [currentView, setCurrentView] = useState<ViewMode>('DASHBOARD');
  const [viewStack, setViewStack] = useState<ViewMode[]>(['DASHBOARD']);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [savingHistoryModal, setSavingHistoryModal] = useState<{ title: string, items: Saving[], cardId: string, month: number, year: number } | null>(null);

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

  // Navigation Logic
  const pushView = (view: ViewMode) => {
    setViewStack(prev => [...prev, view]);
    setCurrentView(view);
  };

  const popView = () => {
    if (viewStack.length > 1) {
      const newStack = [...viewStack];
      newStack.pop();
      setViewStack(newStack);
      setCurrentView(newStack[newStack.length - 1]);
    } else {
      setCurrentView('DASHBOARD');
      setViewStack(['DASHBOARD']);
    }
  };

  const navigateToRoot = (view: ViewMode) => {
    setCurrentView(view);
    setViewStack([view]);
  };

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
      navigateToRoot('DASHBOARD');
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

  const toggleInstallmentValidation = (installmentId: string, month: number, year: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const updated = data.installments.map(inst => {
      if (inst.id === installmentId) {
        const currentValidated = inst.validatedTenors || [];
        const newValidated = currentValidated.includes(key)
          ? currentValidated.filter(k => k !== key)
          : [...currentValidated, key];
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
      popView();
      setEditingTransaction(null);
    }
  };

  const handleDeleteSaving = (id: string) => {
    if (window.confirm("Hapus catatan tabungan ini?")) {
      const updatedSavings = data.savings.filter(s => s.id !== id);
      saveData({ ...data, savings: updatedSavings });
      popView();
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
    pushView('FORM_TRANSACTION');
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
    pushView('FORM_SAVING');
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
    pushView('VIEW_STATEMENT');
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
    popView();
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault(); const amountVal = getNumericValue(txAmount); if (!txCardId) return;
    let finalAmount = Math.ceil(amountVal); let finalDesc = txDesc;
    let updatedSavings = [...data.savings]; let updatedInstallments = [...data.installments];
    
    if (txType === TransactionType.EXPENSE) { 
       if (amountVal <= 0 || !txDesc) return; 
    } else {
       const savingsUsed = txUseSavings ? availableSavingsForPeriod : 0;
       const totalPaymentReduction = Math.ceil(amountVal + savingsUsed);
       if (totalPaymentReduction <= 0) return; 
       
       finalAmount = totalPaymentReduction;
       if (!finalDesc) finalDesc = `Pelunasan ${monthNames[txTargetMonth]} ${txTargetYear}`;
       
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
    popView();
  };

  const handleSaveSaving = (e: React.FormEvent) => {
    e.preventDefault(); const amountVal = getNumericValue(savingAmount); if (!savingCardId || amountVal <= 0) return;
    if (editingSaving) {
      const updatedSavings = data.savings.map(s => s.id === editingSaving.id ? { ...s, cardId: savingCardId, amount: Math.ceil(amountVal), note: savingNote, targetPeriod: { month: savingTargetMonth, year: savingTargetYear } } : s);
      saveData({ ...data, savings: updatedSavings });
      setEditingSaving(null);
    } else {
      const newSaving: Saving = { id: generateId(), cardId: savingCardId, amount: Math.ceil(amountVal), date: new Date().toISOString(), note: savingNote || 'Tabungan Rutin', targetPeriod: { month: savingTargetMonth, year: savingTargetYear }, isTransferred: false };
      saveData({ ...data, savings: [newSaving, ...data.savings] });
    }
    popView(); setSavingAmount(''); setSavingNote('');
  };

  // Shared content rendering function for both mobile and desktop
  const renderCurrentView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-5 py-4 md:px-8 md:py-8">
            <div className="bg-gradient-to-br from-violet-600 to-primary rounded-[32px] p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="flex justify-between items-start mb-1 relative z-10"><p className="text-blue-100 text-sm md:text-base font-bold uppercase tracking-wider">Total Liabilitas</p><button type="button" onClick={() => setShowAmounts(!showAmounts)} className="text-blue-100 hover:text-white transition p-1">{showAmounts ? <Eye size={24} /> : <EyeOff size={24} />}</button></div>
              <h3 className="text-3xl md:text-5xl font-black mb-6 relative z-10">{showAmounts ? formatIDR(totalDebt) : '••••••••'}</h3>
              <div className="space-y-3 pt-6 border-t border-white/10 relative z-10 grid md:grid-cols-2 md:gap-10">
                <div className="flex justify-between items-center"><p className="text-blue-200 text-[10px] md:text-xs uppercase font-bold tracking-widest">Tabungan Pelunasan</p><p className="font-bold text-base md:text-xl">{showAmounts ? formatIDR(totalSavingsAcrossYears) : '••••'}</p></div>
                <div className="flex justify-between items-center"><p className="text-white text-[10px] md:text-xs uppercase font-black tracking-widest">Sisa Hutang</p><p className="font-black text-xl md:text-2xl text-yellow-300">{showAmounts ? formatIDR(currentDebtGap) : '••••'}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <button onClick={() => { setEditingTransaction(null); setTxAmount(''); setTxDesc(''); setTxType(TransactionType.EXPENSE); pushView('FORM_TRANSACTION'); }} className="flex flex-col items-center gap-2 group"><div className="w-full aspect-square md:w-20 md:h-20 bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 rounded-3xl flex items-center justify-center shadow-sm active:scale-95 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"><PlusCircle size={28}/></div><span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Catat</span></button>
              <button onClick={() => { setEditingSaving(null); setSavingAmount(''); setSavingNote(''); pushView('FORM_SAVING'); }} className="flex flex-col items-center gap-2 group"><div className="w-full aspect-square md:w-20 md:h-20 bg-emerald-50 dark:bg-emerald-900/30 text-success dark:text-emerald-400 rounded-3xl flex items-center justify-center shadow-sm active:scale-95 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"><Vault size={28}/></div><span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nabung</span></button>
              <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); pushView('FORM_CARD'); }} className="flex flex-col items-center gap-2 group"><div className="w-full aspect-square md:w-20 md:h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center shadow-sm active:scale-95 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"><Briefcase size={28}/></div><span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Hutang</span></button>
            </div>

            {upcomingBills.length > 0 && (
              <div className="space-y-4">
                 <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm md:text-base uppercase tracking-tight">Tagihan Terdekat</h3>
                 <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                    {upcomingBills.map(bill => (
                       <div key={bill.id} onClick={() => openStatement(bill)} className="min-w-[85vw] md:min-w-[400px] bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4 snap-center active:scale-[0.98] hover:border-primary transition-all cursor-pointer">
                          <div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className={`w-10 h-10 ${bill.color} rounded-xl flex items-center justify-center text-white shadow-sm`}><AlertCircle size={18}/></div><span className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">{bill.name}</span></div><span className={`text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${bill.daysLeft <= 3 ? 'bg-red-50 dark:bg-red-900/30 text-danger dark:text-red-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>{bill.daysLeft} Hari Lagi</span></div>
                          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl"><div className="flex flex-col"><span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[8px] md:text-[9px]">Tagihan</span><span className="font-black text-slate-700 dark:text-slate-200 text-xs md:text-sm">{showAmounts ? formatIDR(bill.remainingBill) : '••••••••'}</span></div><div className="flex flex-col text-right"><span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[8px] md:text-[9px]">Tabungan</span><span className="font-black text-success text-xs md:text-sm">{showAmounts ? formatIDR(bill.savedForThisMonth || 0) : '••••••••'}</span></div></div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-8 flex items-center gap-3"><PieChart size={24} /> Pengeluaran Kelompok Bulan Ini</h3>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                {categoryGrouping.map(([cat, val], idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end"><span className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300">{cat}</span><span className="text-xs md:text-sm font-medium text-slate-400 dark:text-slate-500">{showAmounts ? formatIDR(val) : '••••'}</span></div>
                    <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(val / (categoryGrouping.reduce((s, [, v]) => s + v, 0) || 1)) * 100}%` }}></div></div>
                  </div>
                ))}
              </div>
              {categoryGrouping.length === 0 && <p className="text-center py-10 text-slate-400 font-medium">Belum ada pengeluaran yang dicatat bulan ini.</p>}
            </div>
          </div>
        );
      case 'CARDS':
        return (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-5 py-4 md:px-8 md:py-8">
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.cards.map(card => {
                  const balance = getCardBalance(card.id); const remaining = card.limit - balance;
                  return (
                    <div key={card.id} className="space-y-3">
                      <div onClick={() => openStatement(card)} className={`${card.color || 'bg-slate-800'} p-6 rounded-[32px] text-white shadow-lg relative h-48 flex flex-col justify-between overflow-hidden active:scale-[0.98] transition hover:shadow-2xl cursor-pointer group`}>
                          <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                          <div className="relative z-10 flex justify-between items-start"><div><p className="text-[9px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">{card.type === DebtType.CREDIT_CARD ? 'Credit Card' : 'Debt Item'}</p><h4 className="text-xl font-black tracking-tight">{card.name}</h4></div></div>
                          <div className="relative z-10"><p className="text-[9px] opacity-60 uppercase font-black tracking-tighter">Limit/Plafon</p><p className="text-2xl font-black">{showAmounts ? formatIDR(card.limit) : '••••••••'}</p></div>
                          <div className="relative z-10 flex justify-between items-end pt-3 border-t border-white/10"><div><p className="text-[9px] opacity-60 uppercase font-black tracking-tighter">Sisa Limit</p><p className="text-sm font-black">{showAmounts ? formatIDR(remaining) : '••••'}</p></div><div className="text-right opacity-60"><span className="text-[9px] font-black uppercase">{card.dueDay ? `TGL ${card.dueDay}` : 'N/A'}</span></div></div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setEditingCard(card); setCardName(card.name); setCardLimit(formatIDR(card.limit)); setCardDue(card.dueDay?.toString() || ''); setCardColor(card.color); setCardType(card.type); setCardEStatementFee(card.eStatementFee ? formatIDR(card.eStatementFee) : ''); pushView('FORM_CARD'); }} className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"><Pencil size={14}/> Edit</button>
                        <button type="button" onClick={() => { if(window.confirm('Hapus item?')) saveData({...data, cards: data.cards.filter(c=>c.id!==card.id)}); }} className="flex-1 py-3 bg-red-50 dark:bg-red-900/10 text-danger rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition"><Trash2 size={14}/> Hapus</button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); pushView('FORM_CARD'); }} className="h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] text-slate-400 dark:text-slate-600 font-bold flex flex-col items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-primary transition-all"><Plus size={32}/><span className="text-sm uppercase tracking-widest">Tambah Item Baru</span></button>
             </div>
          </div>
        );
      case 'SAVINGS':
        return (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-5 py-4 md:px-8 md:py-8">
            <div className="bg-gradient-to-br from-success to-emerald-700 rounded-[32px] p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between">
               <div className="space-y-2">
                 <p className="text-emerald-100 text-[10px] md:text-xs font-bold uppercase tracking-widest">Total Dana Tahun {savingsSelectedYear}</p>
                 <h3 className="text-3xl md:text-5xl font-black">{showAmounts ? formatIDR(totalYearSavings) : '••••••••'}</h3>
               </div>
               <div className="flex items-center gap-6 mt-6 md:mt-0 bg-white/10 p-4 rounded-2xl">
                 <div className="flex items-center gap-3"><Calendar size={20} className="text-emerald-200"/><span className="text-xl font-black">{savingsSelectedYear}</span></div>
                 <div className="flex gap-2">
                   <button onClick={() => setSavingsSelectedYear(y => y - 1)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"><ChevronLeft size={20}/></button>
                   <button onClick={() => setSavingsSelectedYear(y => y + 1)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"><ChevronRight size={20}/></button>
                 </div>
               </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savingsYearlyData.filter(m => m.totalMonth > 0).map((m, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800 p-6 space-y-4">
                   <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3"><h4 className="font-black text-base text-slate-800 dark:text-slate-100">{m.monthName}</h4><span className="text-sm font-black text-success">{showAmounts ? formatIDR(m.totalMonth) : '••••'}</span></div>
                   <div className="space-y-2.5">
                     {m.cardGroups.map((group, i) => (
                       <button key={i} onClick={() => setSavingHistoryModal({ title: `${group.cardName} - ${m.monthName} ${savingsSelectedYear}`, items: group.items, cardId: group.cardId, month: m.monthIdx, year: savingsSelectedYear })} className="w-full flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition group">
                         <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${group.cardColor}`}></div><span className="text-sm font-bold text-slate-600 dark:text-slate-300">{group.cardName}</span></div>
                         <div className="flex items-center gap-2"><span className="text-sm font-black text-slate-800 dark:text-slate-100">{showAmounts ? formatIDR(group.amount) : '••'}</span><ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform"/></div>
                       </button>
                     ))}
                   </div>
                </div>
              ))}
            </div>
            {data.savings.filter(s => !s.isTransferred && s.targetPeriod?.year === savingsSelectedYear).length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                <Vault size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">Belum ada tabungan untuk tahun ini.</p>
              </div>
            )}

            {/* Modal Riwayat Tabungan */}
            {savingHistoryModal && (
              <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                  <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight">{savingHistoryModal.title}</h3>
                    <button onClick={() => setSavingHistoryModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-500"><X size={20} /></button>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 no-scrollbar">
                    {savingHistoryModal.items.map(item => (
                      <div key={item.id} onClick={() => { setSavingHistoryModal(null); openEditSaving(item); }} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition group border border-transparent hover:border-success/30">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.note}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-success">{formatIDR(item.amount)}</span>
                          <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                    
                    {/* Tombol Tambah di Modal Riwayat Tabungan */}
                    <button 
                      onClick={() => {
                        setEditingSaving(null);
                        setSavingAmount('');
                        setSavingNote('');
                        setSavingCardId(savingHistoryModal.cardId);
                        setSavingTargetMonth(savingHistoryModal.month);
                        setSavingTargetYear(savingHistoryModal.year);
                        setSavingHistoryModal(null);
                        pushView('FORM_SAVING');
                      }}
                      className="w-full mt-4 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-success hover:border-success transition-all font-bold text-sm uppercase"
                    >
                      <Plus size={18} /> Tambah Data Tabungan
                    </button>
                  </div>
                  <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Klik item untuk mengubah data</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'YEARLY':
        return (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-5 py-4 md:px-8 md:py-8">
            <div className="bg-[#1a2332] rounded-[32px] p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex items-center gap-6"><div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400"><Calendar size={32} /></div><div className="flex flex-col"><span className="text-3xl font-black">{yearlySelectedYear}</span><span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Ringkasan Anggaran</span></div></div>
              <div className="grid grid-cols-2 gap-x-12 md:gap-x-20 border-l border-white/10 pl-8"><div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimasi Tagihan</p><p className="text-xl md:text-2xl font-bold">{showAmounts ? formatIDR(yearlySummary.totalYearBill) : '••••'}</p></div><div className="text-right space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dana Terkumpul</p><p className="text-xl md:text-2xl font-bold text-success">{showAmounts ? formatIDR(yearlySummary.totalYearSaved) : '••••'}</p></div></div>
              <div className="flex gap-2"><button onClick={() => setYearlySelectedYear(y => y - 1)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"><ChevronLeft size={24}/></button><button onClick={() => setYearlySelectedYear(y => y + 1)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"><ChevronRight size={24}/></button></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {yearlyData.filter(m => m.totalMonthBill > 0 || m.totalMonthSaved > 0).map((m, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-50 dark:border-slate-800 space-y-5">
                  <div className="flex justify-between items-center"><h4 className="font-black text-lg text-slate-800 dark:text-slate-100">{m.monthName}</h4><span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${m.totalMonthGap === 0 ? 'bg-success/10 text-success' : 'bg-red-50 dark:bg-red-900/20 text-danger'}`}>{m.totalMonthGap === 0 ? 'Lunas' : `Kurang ${showAmounts ? formatIDR(m.totalMonthGap) : '••'}`}</span></div>
                  <div className="space-y-5">
                    {m.cardsEstimates.map((ce, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase tracking-tighter">{ce.cardName}</span><span className={ce.progress >= 100 ? 'text-success' : 'text-slate-700 dark:text-slate-300'}>{showAmounts ? formatIDR(ce.saved) : '••'} / {showAmounts ? formatIDR(ce.bill) : '••'}</span></div>
                        <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${ce.progress >= 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.min(100, ce.progress)}%` }}></div></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'TRANSACTIONS':
        return (
          <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto w-full px-5 py-4 md:px-8 md:py-8">
            <div className="flex flex-col md:flex-row gap-4">
              <select value={historyCardFilter} onChange={(e)=>setHistoryCardFilter(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-sm font-bold shadow-sm dark:text-slate-200 outline-none hover:border-primary transition cursor-pointer"><option value="all">💳 Semua Item Kartu/Hutang</option>{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select value={historyMonthFilter} onChange={(e)=>setHistoryMonthFilter(parseInt(e.target.value))} className="md:w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-sm font-bold shadow-sm dark:text-slate-200 outline-none hover:border-primary transition cursor-pointer">{monthNames.map((m, i) => <option key={i} value={i}>📅 {m}</option>)}</select>
            </div>
            <div className="space-y-3">
              {filteredTransactions.map(t => {
                const card = data.cards.find(c => c.id === t.cardId);
                return (
                  <div key={t.id} onClick={() => openEditTransaction(t)} className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-50 dark:border-slate-800 shadow-sm flex justify-between items-center active:scale-[0.99] hover:border-primary transition group relative overflow-hidden cursor-pointer">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${card?.color || 'bg-slate-800'}`}></div>
                    <div className="pl-3 space-y-1">
                      <p className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 leading-tight">{t.description}</p>
                      <div className="flex items-center gap-2"><span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleDateString('id-ID')}</span><span className="text-[10px] text-slate-300">•</span><span className="text-[10px] text-slate-400 font-bold uppercase">{card?.name}</span></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-base font-black ${t.type === TransactionType.EXPENSE ? 'text-danger' : 'text-success'}`}>{t.type === TransactionType.PAYMENT ? '-' : ''}{showAmounts ? formatIDR(t.amount) : '••••'}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleTransactionValidation(t.id); }} className={`p-2.5 rounded-full transform active:scale-90 transition-colors ${t.isValidated ? 'bg-primary/10 text-primary dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 hover:text-slate-400'}`}><CheckCircle2 size={24}/></button>
                    </div>
                  </div>
                );
              })}
              {filteredTransactions.length === 0 && (
                <div className="text-center py-32 text-slate-400 flex flex-col items-center gap-4">
                  <History size={64} className="text-slate-100 dark:text-slate-900" />
                  <p className="font-bold">Tidak ada riwayat transaksi untuk kriteria ini.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'FORM_CARD':
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto w-full px-5 py-8">
             <form onSubmit={handleSaveCard} className="space-y-8 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-50 dark:border-slate-800">
               <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl"><button type="button" onClick={()=>setCardType(DebtType.CREDIT_CARD)} className={`py-3.5 text-xs font-black rounded-xl transition-all ${cardType === DebtType.CREDIT_CARD ? 'bg-white dark:bg-slate-700 shadow-md text-primary dark:text-blue-400 scale-[1.02]' : 'text-slate-500'}`}>KARTU KREDIT</button><button type="button" onClick={()=>setCardType(DebtType.OTHER_DEBT)} className={`py-3.5 text-xs font-black rounded-xl transition-all ${cardType === DebtType.OTHER_DEBT ? 'bg-white dark:bg-slate-700 shadow-md text-primary dark:text-blue-400 scale-[1.02]' : 'text-slate-500'}`}>HUTANG LAIN</button></div>
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Label Identitas</label><input type="text" value={cardName} onChange={(e)=>setCardName(e.target.value)} required placeholder="Contoh: Platinum Card" className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl outline-none border-2 border-transparent focus:border-primary transition font-bold text-lg" /></div>
               <div className="grid md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Limit/Plafon</label><input type="text" value={cardLimit} onChange={(e)=>handleCurrencyInput(e.target.value, setCardLimit)} required placeholder="Rp 0" className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl font-black text-lg" /></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tgl Jatuh Tempo</label><input type="number" min="1" max="31" value={cardDue} onChange={(e)=>setCardDue(e.target.value)} placeholder="Misal: 15" className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl font-bold text-lg" /></div></div>
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Warna Kartu</label><div className="flex gap-4 flex-wrap pt-2">{CARD_COLORS.map(c => (<button key={c.value} type="button" onClick={() => setCardColor(c.value)} className={`w-12 h-12 rounded-full ${c.value} ${cardColor === c.value ? 'ring-4 ring-offset-4 ring-primary dark:ring-offset-slate-900' : 'hover:scale-110'} transition-all`}></button>))}</div></div>
               <div className="pt-4"><button type="submit" className="w-full py-6 bg-primary text-white font-black text-lg rounded-[28px] shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Simpan Konfigurasi</button></div>
             </form>
          </div>
        );
      case 'FORM_TRANSACTION':
        const currentBillEstimate = getMonthlyBill(txCardId, txTargetMonth, txTargetYear);
        const totalImpact = Math.ceil(getNumericValue(txAmount) + (txUseSavings ? availableSavingsForPeriod : 0));
        
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto w-full px-5 py-8">
             <form onSubmit={handleSaveTransaction} className="space-y-8 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-xl border border-slate-50 dark:border-slate-800">
               {/* TYPE TOGGLE */}
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[24px]">
                 <button type="button" onClick={()=>setTxType(TransactionType.EXPENSE)} className={`flex-1 py-4 text-sm font-black rounded-2xl flex items-center justify-center gap-2 transition-all ${txType === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-danger shadow-lg scale-[1.02]' : 'text-slate-500'}`}><ArrowUpCircle size={18}/> PAKAI</button>
                 <button type="button" onClick={()=>setTxType(TransactionType.PAYMENT)} className={`flex-1 py-4 text-sm font-black rounded-2xl flex items-center justify-center gap-2 transition-all ${txType === TransactionType.PAYMENT ? 'bg-white dark:bg-slate-700 text-success shadow-lg scale-[1.02]' : 'text-slate-500'}`}><ArrowDownCircle size={18}/> BAYAR</button>
               </div>

               {/* CARD SELECT */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Sumber Dana / Kartu</label>
                 <select value={txCardId} onChange={(e)=>setTxCardId(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-base font-bold outline-none border-2 border-transparent focus:border-primary transition">
                   {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
               </div>

               {/* PAYMENT SPECIFIC FIELDS */}
               {txType === TransactionType.PAYMENT && (
                 <div className="space-y-6 animate-in slide-in-from-top duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bulan Tagihan</label>
                        <select value={txTargetMonth} onChange={(e)=>setTxTargetMonth(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-success outline-none">
                          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tahun</label>
                        <input type="number" value={txTargetYear} onChange={(e)=>setTxTargetYear(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-success outline-none"/>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2"><Info size={16} className="text-slate-400"/><span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Status Tagihan</span></div>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatIDR(currentBillEstimate)}</span>
                       </div>
                       
                       <div onClick={() => setTxUseSavings(!txUseSavings)} className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${txUseSavings ? 'bg-success/10 border-success/30 border-2' : 'bg-white dark:bg-slate-800 border-2 border-transparent'}`}>
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${txUseSavings ? 'bg-success text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}><Vault size={20}/></div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tabungan Tersedia</span>
                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{formatIDR(availableSavingsForPeriod)}</span>
                             </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${txUseSavings ? 'bg-success border-success' : 'border-slate-200'}`}>
                             {txUseSavings && <CheckCircle2 size={16} className="text-white"/>}
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {/* MAIN AMOUNT INPUT */}
               <div className="space-y-2 text-center">
                 <label className="text-[10px] font-black text-slate-400 uppercase">
                    {txType === TransactionType.EXPENSE ? 'Nominal Pemakaian' : 'Nominal Bayar Tunai'}
                 </label>
                 <input type="text" value={txAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setTxAmount)} required placeholder="Rp 0" className={`w-full text-5xl font-black p-4 border-b-4 outline-none bg-transparent text-slate-800 dark:text-slate-100 text-center transition-colors ${txType === TransactionType.EXPENSE ? 'border-red-100 focus:border-danger' : 'border-green-100 focus:border-success'}`} />
                 
                 {txType === TransactionType.PAYMENT && txUseSavings && availableSavingsForPeriod > 0 && (
                   <div className="mt-4 flex flex-col items-center gap-1 animate-in zoom-in duration-300">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pengurangan Hutang</span>
                      <span className="text-2xl font-black text-success">{formatIDR(totalImpact)}</span>
                   </div>
                 )}
               </div>

               {/* DESCRIPTION & DATE */}
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Keterangan</label>
                    <input type="text" value={txDesc} onChange={(e)=>setTxDesc(e.target.value)} placeholder={txType === TransactionType.EXPENSE ? "Beli apa?" : "Bayar lewat mana?"} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl border-2 border-transparent focus:border-primary outline-none transition font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal Transaksi</label>
                    <input type="date" value={txDate} onChange={(e)=>setTxDate(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl border-2 border-transparent focus:border-primary outline-none transition font-bold"/>
                  </div>
               </div>

               {/* ACTION BUTTONS */}
               <div className="space-y-4 pt-4">
                 <button type="submit" className={`w-full py-6 text-white font-black text-lg rounded-[28px] shadow-xl active:scale-95 transition-all ${txType === TransactionType.EXPENSE ? 'bg-danger hover:bg-red-600' : 'bg-success hover:bg-emerald-600'}`}>
                    {editingTransaction ? 'Simpan Perubahan' : (txType === TransactionType.EXPENSE ? 'Catat Pengeluaran' : 'Konfirmasi Pembayaran')}
                 </button>
                 {editingTransaction && (
                   <button type="button" onClick={() => handleDeleteTransaction(editingTransaction.id)} className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-danger font-bold rounded-[24px] hover:bg-red-100 transition">Hapus Transaksi Ini</button>
                 )}
               </div>
             </form>
          </div>
        );
      case 'FORM_SAVING':
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto w-full px-5 py-8">
             <form onSubmit={handleSaveSaving} className="space-y-8 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-xl border border-slate-50 dark:border-slate-800">
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Alokasi Untuk</label><select value={savingCardId} onChange={(e)=>setSavingCardId(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-base font-bold outline-none">{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Dana Disisihkan</label><input type="text" value={savingAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setSavingAmount)} required placeholder="Rp 0" className="w-full text-5xl font-black p-4 border-b-4 border-slate-100 dark:border-slate-800 outline-none focus:border-success bg-transparent text-slate-800 dark:text-slate-100 text-center" /></div>
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Target Periode Tagihan</label><div className="grid grid-cols-2 gap-4"><select value={savingTargetMonth} onChange={(e)=>setSavingTargetMonth(parseInt(e.target.value))} className="p-5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={savingTargetYear} onChange={(e)=>setSavingTargetYear(parseInt(e.target.value))} className="p-5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl text-sm font-bold"/></div></div>
               <div className="pt-4"><button type="submit" className="w-full py-6 bg-success text-white font-black text-lg rounded-[28px] shadow-xl hover:bg-emerald-600 active:scale-95 transition-all">Amankan Dana Pelunasan</button>{editingSaving && (<button type="button" onClick={() => handleDeleteSaving(editingSaving.id)} className="w-full mt-4 py-4 bg-red-50 dark:bg-red-900/10 text-danger font-bold rounded-[24px] transition">Hapus Tabungan</button>)}</div>
             </form>
          </div>
        );
      case 'VIEW_PROFILE':
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto w-full px-5 py-8">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-xl overflow-hidden border border-slate-50 dark:border-slate-800">
              <div className="p-10 md:p-14 flex flex-col items-center bg-slate-50/50 dark:bg-slate-800/20 border-b dark:border-slate-800">
                <div className="w-32 h-32 rounded-full border-8 border-white dark:border-slate-900 shadow-2xl overflow-hidden flex items-center justify-center mb-6">
                  {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={56} className="text-slate-300" />}
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{user.displayName || 'Pengguna'}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">{user.email}</p>
              </div>
              <div className="p-4">
                 <MobileMenuButton icon={data.theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>} label={data.theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'} onClick={toggleTheme} />
                 <MobileMenuButton icon={<ShieldCheck size={20}/>} label="Setel Pengamanan PIN" rightElement={<span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase ${data.security?.isPinEnabled ? 'bg-success/10 text-success' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{data.security?.isPinEnabled ? 'AKTIF' : 'TIDAK AKTIF'}</span>} onClick={() => { setSetupPinStep('ENTER_NEW'); setPinInput(""); }} />
                 <MobileMenuButton icon={<LogOut size={20}/>} label="Keluar dari Aplikasi" onClick={handleLogout} danger />
              </div>
              <div className="p-10 text-center opacity-30"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">LimitWatch Digital Assets © 2025</p></div>
            </div>
          </div>
        );
      case 'VIEW_STATEMENT':
        if (!activeStatementCard) return null;
        const s = getStatementData(activeStatementCard.id, statementMonth, statementYear);
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-5xl mx-auto w-full px-5 py-8 space-y-8">
            <div className={`${activeStatementCard.color} p-8 md:p-12 text-white rounded-[40px] shadow-xl flex justify-between items-center overflow-hidden relative`}>
                <div className="absolute -right-10 -bottom-10 opacity-10"><Receipt size={200} /></div>
                <div className="relative z-10"><p className="text-xs opacity-70 uppercase tracking-widest font-black mb-1">{activeStatementCard.type === DebtType.CREDIT_CARD ? 'Bank Statement' : 'Private Loan'}</p><h4 className="text-3xl font-black">{activeStatementCard.name}</h4></div>
                <div className="flex flex-col items-end relative z-10"><p className="text-[10px] opacity-70 uppercase font-black tracking-widest">Bulan Tagihan</p><p className="text-xl font-black uppercase">{monthNames[statementMonth]} {statementYear}</p></div>
            </div>
            
            <div className="flex gap-4"><select value={statementMonth} onChange={(e)=>setStatementMonth(parseInt(e.target.value))} className="flex-1 text-sm font-black bg-white dark:bg-slate-900 dark:text-slate-100 p-5 rounded-2xl shadow-sm outline-none hover:border-primary border border-transparent transition">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={statementYear} onChange={(e)=>setStatementYear(parseInt(e.target.value))} className="w-32 text-sm font-black bg-white dark:bg-slate-900 dark:text-slate-100 p-5 rounded-2xl shadow-sm outline-none hover:border-primary border border-transparent transition" /></div>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[40px] border dark:border-slate-800 shadow-sm grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Pemakaian</span><span className="text-2xl font-black text-slate-800 dark:text-slate-100">{showAmounts ? formatIDR(s.totalBill) : '••••'}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-success uppercase tracking-widest">Dana Terbayar</span><span className="text-base font-black text-success">-{showAmounts ? formatIDR(s.totalPaid) : '••'}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-primary uppercase tracking-widest">Dana Cadangan</span><span className="text-base font-black text-primary">-{showAmounts ? formatIDR(s.totalSaved) : '••'}</span></div>
                <div className="flex justify-between items-center pt-4 border-t-2 dark:border-slate-800"><span className="text-[10px] font-black text-danger uppercase tracking-widest">Sisa Kewajiban</span><span className="text-3xl font-black text-danger">{showAmounts ? formatIDR(Math.max(0, s.totalBill - s.totalPaid - s.totalSaved)) : '••••'}</span></div>
              </div>
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Briefcase size={12}/> Breakdown Biaya</h5>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl space-y-3 shadow-sm">
                   <div className="flex justify-between text-xs font-bold text-slate-500"><span className="uppercase">E-Statement Fee</span><span>{showAmounts ? formatIDR(s.adminFee) : '••'}</span></div>
                   <div className="flex justify-between text-xs font-bold text-slate-500"><span className="uppercase">Biaya Materai</span><span>{showAmounts ? formatIDR(s.materai) : '••'}</span></div>
                   <div className="pt-2 border-t dark:border-slate-700 flex justify-between text-xs font-black text-slate-800 dark:text-slate-200"><span className="uppercase">Total Tambahan</span><span>{showAmounts ? formatIDR(s.adminFee + s.materai) : '••'}</span></div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS IN STATEMENT */}
            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => {
                    setEditingTransaction(null);
                    setTxAmount('');
                    setTxDesc('');
                    setTxType(TransactionType.EXPENSE);
                    setTxCardId(activeStatementCard.id);
                    // Gunakan tanggal pertama bulan statement sebagai default
                    setTxDate(new Date(statementYear, statementMonth, 1).toISOString().split('T')[0]);
                    pushView('FORM_TRANSACTION');
                  }}
                  className="flex items-center justify-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-black text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition hover:border-primary group"
               >
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-danger flex items-center justify-center group-hover:bg-danger group-hover:text-white transition-colors">
                    <Plus size={18} />
                  </div>
                  Catat Pemakaian
               </button>
               <button 
                  onClick={() => {
                    setEditingTransaction(null);
                    setTxAmount('');
                    setTxDesc(`Bayar Tagihan ${activeStatementCard.name}`);
                    setTxType(TransactionType.PAYMENT);
                    setTxCardId(activeStatementCard.id);
                    setTxTargetMonth(statementMonth);
                    setTxTargetYear(statementYear);
                    pushView('FORM_TRANSACTION');
                  }}
                  className="flex items-center justify-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-black text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition hover:border-success group"
               >
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-success flex items-center justify-center group-hover:bg-success group-hover:text-white transition-colors">
                    <ArrowDownCircle size={18} />
                  </div>
                  Bayar Tagihan
               </button>
            </div>

            {/* SEKSI CICILAN */}
            <section className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2"><CalendarClock size={14}/> Tagihan Cicilan Berjalan</h5>
              <div className="grid md:grid-cols-2 gap-4">
                {s.installments.map(inst => (
                   <div key={inst.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-50 dark:border-slate-800 flex justify-between items-center group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500">
                        <CalendarRange size={20}/>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase leading-tight">{inst.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black uppercase">Tenor {inst.currentTenor}/{inst.totalMonths}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-800 dark:text-slate-200 text-base">{showAmounts ? formatIDR(inst.monthlyAmount) : '••'}</span>
                      <button 
                        type="button" 
                        onClick={() => toggleInstallmentValidation(inst.id, statementMonth, statementYear)} 
                        className={`p-2.5 rounded-full transform active:scale-90 transition-colors ${inst.isValidated ? 'bg-primary/10 text-primary dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 hover:text-slate-400'}`}
                      >
                        <CheckCircle2 size={24}/>
                      </button>
                    </div>
                  </div>
                ))}
                {s.installments.length === 0 && <div className="col-span-full py-10 text-center text-slate-300 font-bold text-xs italic bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed dark:border-slate-800">Tidak ada cicilan aktif pada periode ini.</div>}
              </div>
            </section>

            {/* SEKSI TRANSAKSI REGULER */}
            <section className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Log Transaksi Periode Ini</h5>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {s.transactions.map(t => (
                  <div key={t.id} onClick={() => openEditTransaction(t)} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-50 dark:border-slate-800 flex justify-between items-center hover:border-primary transition group cursor-pointer shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <History size={20}/>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase leading-tight">{t.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-danger text-base">{showAmounts ? formatIDR(t.amount) : '••'}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleTransactionValidation(t.id); }} className={`p-2.5 rounded-full transform active:scale-90 transition-colors ${t.isValidated ? 'bg-primary/10 text-primary dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 hover:text-slate-400'}`}><CheckCircle2 size={24}/></button>
                    </div>
                  </div>
                ))}
                {s.transactions.length === 0 && <div className="col-span-full py-10 text-center text-slate-300 font-bold text-xs italic bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed dark:border-slate-800">Belum ada pemakaian baru di periode ini.</div>}
              </div>
            </section>
          </div>
        );
      default:
        return null;
    }
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
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800">
          <div className="text-center mb-10"><div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"><Wallet size={40} /></div><h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">LimitWatch</h1><p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Asisten cerdas pelunasan hutang.</p></div>
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {isRegistering && (<div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nama Lengkap</label><input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none focus:border-primary transition text-slate-800 dark:text-slate-100 font-bold" placeholder="Nama Anda..."/></div>)}
            <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none focus:border-primary transition text-slate-800 dark:text-slate-100 font-bold" placeholder="email@domain.com"/></div>
            <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none focus:border-primary transition text-slate-800 dark:text-slate-100 font-bold" placeholder="••••••••"/></div>
            {authError && <p className="text-danger text-xs text-center font-black bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/40">{authError}</p>}
            <button type="submit" disabled={authLoading} className="w-full bg-primary hover:bg-blue-700 text-white py-4.5 rounded-[22px] font-black text-lg transition-all shadow-xl active:scale-95 disabled:opacity-50">{authLoading ? 'Tunggu sebentar...' : (isRegistering ? 'Buat Akun Sekarang' : 'Masuk Dashboard')}</button>
          </form>
          <div className="relative my-10"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div><div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-white dark:bg-slate-900 px-4 text-slate-300 dark:text-slate-700">Metode Lain</span></div></div>
          <button type="button" onClick={handleGoogleLogin} disabled={authLoading} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-[22px] font-black flex items-center justify-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />Lanjutkan dengan Google</button>
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }} className="w-full mt-8 text-sm text-primary dark:text-blue-400 font-black hover:underline">{isRegistering ? 'Punya akun? Masuk di sini' : 'Baru di LimitWatch? Daftar gratis'}</button>
        </div>
      </div>
  );

  const isFormOrDetailView = ['FORM_TRANSACTION', 'FORM_CARD', 'FORM_SAVING', 'VIEW_STATEMENT', 'VIEW_PROFILE'].includes(currentView);

  return (
    <div className={`${data.theme === 'dark' ? 'dark' : ''} h-full`}>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
        
        {/* SHARED DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-50">
           <div className="h-20 flex items-center px-8 border-b border-slate-50 dark:border-slate-800 shrink-0"><div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center mr-3 shadow-lg"><Wallet size={22} /></div><span className="font-black text-2xl text-slate-800 dark:text-slate-100 tracking-tighter">LimitWatch</span></div>
           <nav className="p-5 space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
              <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] mb-4 ml-2">Navigasi Utama</div>
              <DesktopNavItem icon={<Home size={22}/>} label="Beranda" active={currentView === 'DASHBOARD'} onClick={() => navigateToRoot('DASHBOARD')} />
              <DesktopNavItem icon={<Briefcase size={22}/>} label="Kartu & Hutang" active={currentView === 'CARDS'} onClick={() => navigateToRoot('CARDS')} />
              <DesktopNavItem icon={<Vault size={22}/>} label="Tabungan" active={currentView === 'SAVINGS'} onClick={() => navigateToRoot('SAVINGS')} />
              <DesktopNavItem icon={<CalendarRange size={22}/>} label="Anggaran Tahunan" active={currentView === 'YEARLY'} onClick={() => navigateToRoot('YEARLY')} />
              <DesktopNavItem icon={<History size={22}/>} label="Riwayat Aktivitas" active={currentView === 'TRANSACTIONS'} onClick={() => navigateToRoot('TRANSACTIONS')} />
           </nav>
           <div className="p-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
              <button type="button" onClick={() => pushView('VIEW_PROFILE')} className="flex items-center gap-4 w-full p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition group">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 shrink-0">
                  {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-slate-400 mx-auto mt-2"/>}
                </div>
                <div className="flex flex-col items-start overflow-hidden"><span className="text-sm font-black text-slate-700 dark:text-slate-200 truncate w-full">{user.displayName || 'Pengguna'}</span><span className="text-[10px] font-bold text-slate-400 uppercase">Premium Member</span></div>
              </button>
              <button type="button" onClick={toggleTheme} className="flex items-center gap-3 text-secondary hover:text-slate-900 dark:hover:text-slate-100 w-full p-3 rounded-xl transition hover:bg-slate-50 dark:hover:bg-slate-800">
                 {data.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                 <span className="font-bold text-sm">{data.theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
              </button>
              <button type="button" onClick={handleLogout} className="flex items-center gap-3 text-secondary hover:text-danger w-full p-3 rounded-xl transition hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut size={20} /> <span className="font-bold text-sm">Keluar Sesi</span></button>
           </div>
        </aside>

        {/* CONTENT AREA (DYNAMIC) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* HEADER (Only for certain views or small screens) */}
          {(currentView !== 'DASHBOARD' || isMobileDevice) && (
             <PageHeader 
              title={currentView === 'DASHBOARD' ? 'Beranda' : currentView.replace('FORM_', 'Input ').replace('VIEW_', 'Rincian ').replace('_', ' ')} 
              onBack={viewStack.length > 1 ? popView : undefined}
              rightElement={
                isMobileDevice && currentView === 'DASHBOARD' && (
                  <button onClick={() => pushView('VIEW_PROFILE')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                    {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-slate-400"/>}
                  </button>
                )
              }
            />
          )}

<main className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-950">
  {renderCurrentView()}
  {!isFormOrDetailView && isMobileDevice && <BottomSpacer />}
</main>

          {/* MOBILE BOTTOM NAV */}
          {!isFormOrDetailView && isMobileDevice && (
<nav
  className="fixed left-0 right-0 bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-[60]"
  style={{
    height: 'calc(var(--nav-height) + var(--sab))',
    paddingBottom: 'var(--sab)',
  }}
>
              <div className="h-[56px] px-6 flex justify-between items-center max-w-lg mx-auto">
                <button onClick={()=>navigateToRoot('DASHBOARD')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'DASHBOARD' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><Home size={22} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Beranda</span></button>
                <button onClick={()=>navigateToRoot('CARDS')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'CARDS' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><Briefcase size={22} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Hutang</span></button>
                <button onClick={()=>navigateToRoot('SAVINGS')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'SAVINGS' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><Vault size={22} /><span className="text-[9px] font-black uppercase tracking-tighter shadow-sm leading-none">Tabung</span></button>
                <button onClick={()=>navigateToRoot('YEARLY')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'YEARLY' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><CalendarRange size={22} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Tahun</span></button>
                <button onClick={()=>navigateToRoot('TRANSACTIONS')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'TRANSACTIONS' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><History size={22} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Riwayat</span></button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
