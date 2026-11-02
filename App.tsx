
import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  AppState, 
  Installment, 
  Transaction, 
  TransactionType,
  CreditCard as CreditCardType,
  Saving,
  Piutang as PiutangType,
  DebtType,
  ViewMode,
  OwnerType
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
  Check,
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
  ArrowDown,
  ArrowUpCircle,
  Info,
  CalendarClock,
  ArrowDownRight,
  ArrowRightLeft,
  ShieldAlert,
  HandCoins,
  UserPlus,
  Zap,
  Image,
  Wifi
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
  <header
    className={`flex-none bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 z-[60] relative ${className}`}
    style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), var(--sat, 0px))' }}
  >
    <div className="px-4 md:px-8 h-13 md:h-16 flex justify-between items-center max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-2.5">
        {onBack && (
          <button onClick={onBack} className="p-1.5 -ml-1.5 text-slate-500 dark:text-slate-400 active:scale-90 transition hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <ChevronLeft size={22} />
          </button>
        )}
        <h2 className="text-base md:text-xl font-black text-slate-900 dark:text-white leading-none truncate max-w-[220px] md:max-w-md">{title}</h2>
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
  const [data, setData] = useState<AppState>(() => {
    const savedTheme = typeof window !== 'undefined' && localStorage.getItem('limitwatch_theme') === 'dark' ? 'dark' : 'light';
    return {
      cards: [],
      transactions: [],
      installments: [],
      savings: [],
      piutangs: [],
      theme: savedTheme,
      security: { pin: null, isPinEnabled: false }
    };
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
  const [editingPiutang, setEditingPiutang] = useState<PiutangType | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [savingHistoryModal, setSavingHistoryModal] = useState<{ title: string, items: Saving[], cardId: string, month: number, year: number } | null>(null);
  const [piutangHistoryModal, setPiutangHistoryModal] = useState<{ title: string, items: PiutangType[], cardId: string, month: number, year: number } | null>(null);

  const [historyCardFilter, setHistoryCardFilter] = useState<string>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<number>(new Date().getMonth());
  const [historyYearFilter, setHistoryYearFilter] = useState<number>(new Date().getFullYear());
  const [yearlySelectedYear, setYearlySelectedYear] = useState<number>(new Date().getFullYear());
  const [yearlyMonthFilter, setYearlyMonthFilter] = useState<'ALL' | 'HAS_BILL' | 'UNPAID'>('ALL');
  const [ownerBillsYear, setOwnerBillsYear] = useState<number>(new Date().getFullYear());
  const [ownerBillsFilter, setOwnerBillsFilter] = useState<'ALL' | 'HAS_BILL'>('ALL');
  const [savingsSelectedYear, setSavingsSelectedYear] = useState<number>(new Date().getFullYear());
  const [piutangsSelectedYear, setPiutangsSelectedYear] = useState<number>(new Date().getFullYear());
  const [dashMonth, setDashMonth] = useState<number>(new Date().getMonth());
  const [dashYear, setDashYear] = useState<number>(new Date().getFullYear());

  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDue, setCardDue] = useState('');
  const [cardColor, setCardColor] = useState(CARD_COLORS[0].value);
  const [cardType, setCardType] = useState<DebtType>(DebtType.CREDIT_CARD);
  const [cardEStatementFee, setCardEStatementFee] = useState('');
  const [cardLogoUrl, setCardLogoUrl] = useState<string>('');

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
  const [txInstallmentMonths, setTxInstallmentMonths] = useState(12);
  const [txUseSavings, setTxUseSavings] = useState(true);
  const [txTargetMonth, setTxTargetMonth] = useState(new Date().getMonth());
  const [txTargetYear, setTxTargetYear] = useState(new Date().getFullYear());
  const [txOwner, setTxOwner] = useState<OwnerType>(OwnerType.PERSONAL);
  const [txSplitPersonal, setTxSplitPersonal] = useState('');
  const [txSplitBusiness, setTxSplitBusiness] = useState('');

  const [savingAmount, setSavingAmount] = useState('');
  const [savingNote, setSavingNote] = useState('');
  const [savingCardId, setSavingCardId] = useState('');
  const [savingTargetMonth, setSavingTargetMonth] = useState(new Date().getMonth());
  const [savingTargetYear, setSavingTargetYear] = useState(new Date().getFullYear());
  const [savingOwner, setSavingOwner] = useState<OwnerType>(OwnerType.PERSONAL);

  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferSourceCardId, setTransferSourceCardId] = useState('');
  const [transferSourceMonth, setTransferSourceMonth] = useState(new Date().getMonth());
  const [transferSourceYear, setTransferSourceYear] = useState(new Date().getFullYear());
  const [transferTargetCardId, setTransferTargetCardId] = useState('');
  const [transferTargetMonth, setTransferTargetMonth] = useState(new Date().getMonth());
  const [transferTargetYear, setTransferTargetYear] = useState(new Date().getFullYear());

  const [piutangAmount, setPiutangAmount] = useState('');
  const [piutangDebtor, setPiutangDebtor] = useState('');
  const [piutangNote, setPiutangNote] = useState('');
  const [piutangCardId, setPiutangCardId] = useState('');
  const [piutangTargetMonth, setPiutangTargetMonth] = useState(new Date().getMonth());
  const [piutangTargetYear, setPiutangTargetYear] = useState(new Date().getFullYear());
  const [piutangIsInstallment, setPiutangIsInstallment] = useState(false);
  const [piutangInstallmentMonths, setPiutangInstallmentMonths] = useState(12);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [quickAddOpen, setQuickAddOpen] = useState(false);

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
    const fallbackTimer = setTimeout(() => {
      setAuthInited(true);
    }, 1200);
    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const sanitizeData = (state: AppState): AppState => {
    const validInstallments = (state.installments || []).filter(inst => {
      if (inst.transactionId) {
         return (state.transactions || []).some(t => t.id === inst.transactionId);
      }
      return (state.transactions || []).some(t => t.cardId === inst.cardId && t.description === inst.name && t.amount === inst.totalAmount && t.isInstallment);
    });
    return { ...state, installments: validInstallments };
  };

  useEffect(() => {
    const isDark = data.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('limitwatch_theme', isDark ? 'dark' : 'light');
    } catch {}
    const metaThemes = document.querySelectorAll('meta[name="theme-color"]');
    metaThemes.forEach((meta) => {
      meta.setAttribute('content', isDark ? '#020617' : '#ffffff');
    });
  }, [data.theme]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToAppState(user.uid, (newState) => {
        const cleanState = sanitizeData(newState);
        const resolvedTheme = cleanState.theme === 'dark' || cleanState.theme === 'light'
          ? cleanState.theme
          : (localStorage.getItem('limitwatch_theme') === 'dark' ? 'dark' : 'light');
        setData({ ...cleanState, theme: resolvedTheme });
      });
      return () => unsubscribe();
    }
  }, [user]);

  const toggleTheme = () => {
    const newTheme = data.theme === 'dark' ? 'light' : 'dark';
    const newData = { ...data, theme: newTheme };
    setData(newData);
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
      if (!piutangCardId) setPiutangCardId(data.cards[0].id);
    }
  }, [data.cards]);

  const saveData = (newData: AppState) => {
    const cleanData = sanitizeData(newData);
    setData(cleanData);
    if (user) saveAppState(user.uid, cleanData);
  };

  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    const isNegative = val.includes('-');
    const digitsOnly = val.replace(/[^\d]/g, '');
    if (digitsOnly === '') { setter(isNegative ? '-' : ''); return; }
    const numericVal = parseInt(digitsOnly, 10) * (isNegative ? -1 : 1);
    setter(formatIDR(numericVal));
  };

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      await logout();
      setUser(null);
      navigateToRoot('DASHBOARD');
      setData(prev => ({ cards: [], transactions: [], installments: [], savings: [], piutangs: [], theme: prev.theme || 'light', security: { pin: null, isPinEnabled: false } }));
    }
  };

  const handleStartDemoMode = () => {
    const demoUser = {
      uid: "demo-user",
      email: "demo@limitwatch.app",
      displayName: "Pengguna Demo",
      photoURL: ""
    } as User;
    setUser(demoUser);
    if (data.cards.length === 0) {
      setData(prev => ({
        cards: [
          { id: "c1", name: "Traveloka Card", limit: 10000000, color: "bg-blue-600", dueDay: 15, type: DebtType.CREDIT_CARD, eStatementFee: 15000 },
          { id: "c2", name: "Tokopedia Card", limit: 15000000, color: "bg-emerald-700", dueDay: 20, type: DebtType.CREDIT_CARD, eStatementFee: 10000 }
        ],
        transactions: [
          { id: "t1", cardId: "c1", amount: 2708052, date: new Date().toISOString(), description: "Hotel & Tiket Pesawat", type: TransactionType.EXPENSE, category: "Hiburan", isInstallment: false, owner: OwnerType.PERSONAL },
          { id: "t2", cardId: "c2", amount: 2445810, date: new Date().toISOString(), description: "Belanja Elektronik", type: TransactionType.EXPENSE, category: "Belanja Bulanan", isInstallment: false, owner: OwnerType.PERSONAL }
        ],
        installments: [],
        savings: [
          { id: "s1", cardId: "c1", amount: 1000000, date: new Date().toISOString(), note: "Simpanan Gaji", targetPeriod: { month: new Date().getMonth(), year: new Date().getFullYear() }, isTransferred: false }
        ],
        piutangs: [],
        theme: prev.theme || "light",
        security: { pin: null, isPinEnabled: false }
      }));
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

  const updateTransactionOwner = (id: string, owner: OwnerType) => {
    const updatedTransactions = data.transactions.map(t => t.id === id ? { ...t, owner } : t);
    // Jika transaksi ini jadi cicilan, kita juga perlu update cicilan terkait
    const updatedInstallments = data.installments.map(inst => inst.transactionId === id ? { ...inst, owner } : inst);
    saveData({ ...data, transactions: updatedTransactions, installments: updatedInstallments });
  };

  const updateInstallmentOwner = (id: string, owner: OwnerType) => {
    const updatedInstallments = data.installments.map(inst => inst.id === id ? { ...inst, owner } : inst);
    const targetInst = data.installments.find(inst => inst.id === id);
    let updatedTransactions = data.transactions;
    if (targetInst && targetInst.transactionId) {
       updatedTransactions = data.transactions.map(t => t.id === targetInst.transactionId ? { ...t, owner } : t);
    }
    saveData({ ...data, transactions: updatedTransactions, installments: updatedInstallments });
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
      const deletedTx = data.transactions.find(t => t.id === id);
      const updatedTx = data.transactions.filter(t => t.id !== id);
      
      let updatedInstallments = data.installments;
      if (deletedTx?.isInstallment) {
        updatedInstallments = data.installments.filter(inst => {
          if (inst.transactionId) {
             return inst.transactionId !== id;
          }
          return !(inst.cardId === deletedTx.cardId && inst.name === deletedTx.description && inst.totalAmount === deletedTx.amount);
        });
      }

      saveData({ ...data, transactions: updatedTx, installments: updatedInstallments });
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

  const handleDeletePiutang = (id: string) => {
    if (window.confirm("Hapus catatan piutang ini?")) {
      const updatedPiutangs = (data.piutangs || []).filter(p => p.id !== id);
      saveData({ ...data, piutangs: updatedPiutangs });
      popView();
      setEditingPiutang(null);
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
    setTxOwner(t.owner || OwnerType.PERSONAL);
    setTxSplitPersonal(t.splitAmounts ? formatIDR(t.splitAmounts.personal) : '');
    setTxSplitBusiness(t.splitAmounts ? formatIDR(t.splitAmounts.business) : '');
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
    setSavingOwner(s.owner === OwnerType.BUSINESS ? OwnerType.BUSINESS : OwnerType.PERSONAL);
    if (s.targetPeriod) {
      setSavingTargetMonth(s.targetPeriod.month);
      setSavingTargetYear(s.targetPeriod.year);
    }
    pushView('FORM_SAVING');
  };

  const toggleSavingOwner = (savingId: string) => {
    const updatedSavings = data.savings.map(s => {
      if (s.id === savingId) {
        const nextOwner = s.owner === OwnerType.BUSINESS ? OwnerType.PERSONAL : OwnerType.BUSINESS;
        return { ...s, owner: nextOwner };
      }
      return s;
    });
    saveData({ ...data, savings: updatedSavings });
    if (savingHistoryModal) {
      setSavingHistoryModal(prev => prev ? {
        ...prev,
        items: prev.items.map(item => item.id === savingId
          ? { ...item, owner: item.owner === OwnerType.BUSINESS ? OwnerType.PERSONAL : OwnerType.BUSINESS }
          : item
        )
      } : null);
    }
  };

  const openEditPiutang = (p: PiutangType) => {
    setEditingPiutang(p);
    setPiutangCardId(p.cardId);
    setPiutangDebtor(p.debtorName);
    setPiutangAmount(formatIDR(p.amount));
    setPiutangNote(p.note);
    if (p.targetPeriod) {
      setPiutangTargetMonth(p.targetPeriod.month);
      setPiutangTargetYear(p.targetPeriod.year);
    }
    pushView('FORM_PIUTANG');
  };

  const openStatement = (card: CreditCardType, month?: number, year?: number) => {
    setActiveStatementCard(card);
    if (month !== undefined && year !== undefined) {
      setStatementMonth(month);
      setStatementYear(year);
    } else {
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
    }
    pushView('VIEW_STATEMENT');
  };

  const getCardBalance = (cardId: string) => {
    const expenses = data.transactions.filter(t => t.cardId === cardId && t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const payments = data.transactions.filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
    return Math.ceil(expenses - payments);
  };

  const getOwnerSplit = (item: { owner?: OwnerType, splitAmounts?: { personal: number, business: number } }, amount: number) => {
    if (item.owner === OwnerType.PERSONAL) return { personal: amount, business: 0, unclassified: 0 };
    if (item.owner === OwnerType.BUSINESS) return { personal: 0, business: amount, unclassified: 0 };
    if (item.owner === OwnerType.SPLIT && item.splitAmounts) {
      const splitTotal = (item.splitAmounts.personal || 0) + (item.splitAmounts.business || 0);
      if (splitTotal > 0 && splitTotal !== amount) {
        return {
          personal: amount * (item.splitAmounts.personal / splitTotal),
          business: amount * (item.splitAmounts.business / splitTotal),
          unclassified: 0
        };
      }
      return { personal: item.splitAmounts.personal, business: item.splitAmounts.business, unclassified: 0 };
    }
    return { personal: amount, business: 0, unclassified: 0 };
  };

  const getMonthlyGrossBillByOwner = (cardId: string, targetMonth: number, targetYear: number) => {
     const card = data.cards.find(c => c.id === cardId);
     if (!card) return { personal: 0, business: 0, unclassified: 0 };
     let personal = 0; let business = 0; let unclassified = 0;
     let totalBase = 0;
     
     data.transactions.filter(t => {
          if (t.cardId !== cardId || t.type !== TransactionType.EXPENSE || t.isInstallment) return false;
          const billing = getBillingPeriod(t.date, card?.dueDay);
          return billing.month === targetMonth && billing.year === targetYear;
     }).forEach(t => {
        const split = getOwnerSplit(t, t.amount);
        personal += split.personal; business += split.business; unclassified += split.unclassified; totalBase += t.amount;
     });

     data.installments.filter(i => i.cardId === cardId).forEach(i => {
          const billingTenor1 = getBillingPeriod(i.startDate, card?.dueDay);
          const monthDiff = (targetYear - billingTenor1.year) * 12 + (targetMonth - billingTenor1.month);
          if (monthDiff >= 0 && monthDiff < i.totalMonths) { 
             const split = getOwnerSplit(i, i.monthlyAmount);
             personal += split.personal; business += split.business; unclassified += split.unclassified; totalBase += i.monthlyAmount;
          }
     });

     let fees = 0;
     if (totalBase > 0) {
       if (card.eStatementFee) fees += card.eStatementFee;
       if ((totalBase + fees) >= 5000000) fees += 10000;
     }
     
     if (fees > 0 && totalBase > 0) {
        personal += fees * (personal / totalBase);
        business += fees * (business / totalBase);
        unclassified += fees * (unclassified / totalBase);
     }

     return { personal: Math.ceil(personal), business: Math.ceil(business), unclassified: Math.ceil(unclassified) };
  };

  const getMonthlyBillByOwner = (cardId: string, targetMonth: number, targetYear: number) => {
     const card = data.cards.find(c => c.id === cardId);
     if (!card) return { personal: 0, business: 0, unclassified: 0 };
     let personal = 0; let business = 0; let unclassified = 0;
     let totalBase = 0;
     
     data.transactions.filter(t => {
          if (t.cardId !== cardId || t.type !== TransactionType.EXPENSE || t.isInstallment) return false;
          const billing = getBillingPeriod(t.date, card?.dueDay);
          return billing.month === targetMonth && billing.year === targetYear;
     }).forEach(t => {
        const split = getOwnerSplit(t, t.amount);
        personal += split.personal; business += split.business; unclassified += split.unclassified; totalBase += t.amount;
     });

     data.installments.filter(i => i.cardId === cardId).forEach(i => {
          const billingTenor1 = getBillingPeriod(i.startDate, card?.dueDay);
          const monthDiff = (targetYear - billingTenor1.year) * 12 + (targetMonth - billingTenor1.month);
          if (monthDiff >= 0 && monthDiff < i.totalMonths) { 
             const split = getOwnerSplit(i, i.monthlyAmount);
             personal += split.personal; business += split.business; unclassified += split.unclassified; totalBase += i.monthlyAmount;
          }
     });

     let fees = 0;
     if (totalBase > 0) {
       if (card.eStatementFee) fees += card.eStatementFee;
       if ((totalBase + fees) >= 5000000) fees += 10000;
     }
     
     if (fees > 0 && totalBase > 0) {
        personal += fees * (personal / totalBase);
        business += fees * (business / totalBase);
        unclassified += fees * (unclassified / totalBase);
     }
     
     const paid = data.transactions.filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === targetMonth && t.targetPeriod?.year === targetYear).reduce((sum, t) => sum + t.amount, 0);
     
     let remainingPayment = paid;
     const totalBilled = personal + business + unclassified;
     if (remainingPayment > 0 && totalBilled > 0) {
         personal = Math.max(0, personal - remainingPayment * (personal/totalBilled));
         business = Math.max(0, business - remainingPayment * (business/totalBilled));
         unclassified = Math.max(0, unclassified - remainingPayment * (unclassified/totalBilled));
     }

     return { personal: Math.ceil(personal), business: Math.ceil(business), unclassified: Math.ceil(unclassified) };
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
      if (!card) return { transactions: [], installments: [], payments: [], savings: [], piutangs: [], totalBill: 0, totalPaid: 0, totalSaved: 0, totalValidated: 0, adminFee: 0, materai: 0 };
      
      const cardTransactions = data.transactions.filter(t => {
          if (t.cardId !== cardId || t.isInstallment || t.type !== TransactionType.EXPENSE) return false;
          const billing = getBillingPeriod(t.date, card?.dueDay);
          return billing.month === month && billing.year === year;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const cardPayments = data.transactions.filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT && t.targetPeriod?.month === month && t.targetPeriod?.year === year)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const cardSavings = data.savings.filter(s => s.cardId === cardId && !s.isTransferred && s.targetPeriod?.month === month && s.targetPeriod?.year === year);
      const cardPiutangs = (data.piutangs || []).filter(p => p.cardId === cardId && !p.isCollected && p.targetPeriod?.month === month && p.targetPeriod?.year === year);
      
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
      
      const validatedBase = Math.ceil(
        cardTransactions.filter(t => t.isValidated).reduce((s, t) => s + t.amount, 0) + 
        activeInstallments.filter(i => i.isValidated).reduce((s, i) => s + i.monthlyAmount, 0)
      );

      let adminFee = 0; let materai = 0;
      if (baseAmount > 0) {
        adminFee = card.eStatementFee || 0;
        if ((baseAmount + adminFee) >= 5000000) materai = 10000;
      }

      const totalBill = Math.ceil(baseAmount + adminFee + materai);
      const totalValidated = Math.ceil(validatedBase + adminFee + materai);

      const totalPaid = Math.ceil(cardPayments.reduce((s, p) => s + p.amount, 0));
      const totalSavingsAmount = Math.ceil(cardSavings.reduce((s, v) => s + v.amount, 0));
      const totalPiutangsAmount = Math.ceil(cardPiutangs.reduce((s, v) => s + v.amount, 0));
      const totalSaved = totalSavingsAmount + totalPiutangsAmount;
      const totalKurang = Math.max(0, totalBill - totalPaid - totalSavingsAmount - totalPiutangsAmount);
      const totalUnpaid = Math.max(0, totalBill - totalPaid);
      
      return { 
        transactions: cardTransactions, 
        installments: activeInstallments, 
        payments: cardPayments, 
        savings: cardSavings, 
        piutangs: cardPiutangs, 
        totalBill, 
        totalPaid, 
        totalSavingsAmount,
        totalPiutangsAmount,
        totalSaved, 
        totalKurang,
        totalUnpaid,
        totalValidated, 
        adminFee, 
        materai 
      };
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

  const descriptionSuggestions = useMemo(() => {
    const relevantTxs = [...data.transactions]
      .filter(t => t.type === txType && t.description && t.description.trim().length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const freqMap = new Map<string, { label: string; count: number; lastSeenIdx: number }>();
    relevantTxs.forEach((t, idx) => {
      const clean = t.description.trim();
      const key = clean.toLowerCase();
      if (txType === TransactionType.EXPENSE && key.startsWith('pelunasan')) return;
      const existing = freqMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        freqMap.set(key, { label: clean, count: 1, lastSeenIdx: idx });
      }
    });

    const entries = Array.from(freqMap.values());
    // Terakhir diinput (3 terbaru)
    const recentTop = entries.slice(0, 3).map(e => e.label);
    // Sering diinput (urut berdasarkan frekuensi tertinggi, lalu terbaru)
    const frequentTop = [...entries]
      .sort((a, b) => b.count - a.count || a.lastSeenIdx - b.lastSeenIdx)
      .map(e => e.label);

    const combined = new Set<string>();
    recentTop.forEach(item => combined.add(item));
    frequentTop.forEach(item => {
      if (combined.size < 8) combined.add(item);
    });

    const defaults = txType === TransactionType.EXPENSE
      ? ['Makan & Minum', 'Belanja Bulanan', 'Bensin / Transport', 'Kopi & Camilan', 'Tagihan Rutin', 'Langganan']
      : ['Bayar Tagihan Penuh', 'Cicilan Bulan Ini', 'Transfer M-Banking', 'Pelunasan Kartu'];

    defaults.forEach(d => {
      if (combined.size < 6 && !Array.from(combined).some(x => x.toLowerCase() === d.toLowerCase())) {
        combined.add(d);
      }
    });

    return Array.from(combined);
  }, [data.transactions, txType]);

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
             const piutangForThisMonth = (data.piutangs || []).filter(p => p.cardId === c.id && !p.isCollected && p.targetPeriod?.month === targetMonth && p.targetPeriod?.year === targetYear).reduce((sum, p) => sum + p.amount, 0);
             
             const totalAssets = savedForThisMonth + piutangForThisMonth;
             return { ...c, daysLeft: diffDays, remainingBill: billAmount, savedForThisMonth: totalAssets, netGap: Math.max(0, billAmount - totalAssets), isCovered: totalAssets >= billAmount && billAmount > 0, progress: billAmount > 0 ? (totalAssets / billAmount) * 100 : 0 };
          }).filter(c => c.remainingBill > 100).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [data.cards, data.transactions, data.installments, data.savings, data.piutangs]);

  const categoryGrouping = useMemo(() => {
    const groups: Record<string, { total: number, personal: number, business: number }> = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let totalAll = 0;
    
    data.transactions.filter(t => {
        const d = new Date(t.date);
        return t.type === TransactionType.EXPENSE && !t.isInstallment && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).forEach(t => { 
        let cat = t.description ? t.description.trim() : "Lainnya";
        // Capitalize first letter to normalize
        cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
        
        if (!groups[cat]) groups[cat] = { total: 0, personal: 0, business: 0 };
        
        let p = t.splitAmounts?.personal || 0;
        let b = t.splitAmounts?.business || 0;
        if (p === 0 && b === 0) {
           if (t.owner === OwnerType.PERSONAL || !t.owner) p = t.amount;
           else if (t.owner === OwnerType.BUSINESS) b = t.amount;
        }
        
        groups[cat].total += t.amount;
        groups[cat].personal += p;
        groups[cat].business += b;
        totalAll += t.amount;
      });
      
    return {
      items: Object.entries(groups).sort((a, b) => b[1].total - a[1].total),
      totalAll
    };
  }, [data.transactions]);

  const yearlyBudgetAnalysis = useMemo(() => {
    const cardAggregatesMap: Record<string, {
      cardId: string;
      cardName: string;
      cardColor: string;
      cardObj: CreditCardType;
      totalBill: number;
      totalPaid: number;
      totalSavings: number;
      totalPiutangs: number;
      totalKurang: number;
      totalGap: number;
      totalPersonal: number;
      totalBusiness: number;
      totalUnclassified: number;
      monthsWithBillsCount: number;
    }> = {};

    data.cards.forEach(card => {
      cardAggregatesMap[card.id] = {
        cardId: card.id,
        cardName: card.name,
        cardColor: card.color || 'bg-slate-400',
        cardObj: card,
        totalBill: 0,
        totalPaid: 0,
        totalSavings: 0,
        totalPiutangs: 0,
        totalKurang: 0,
        totalGap: 0,
        totalPersonal: 0,
        totalBusiness: 0,
        totalUnclassified: 0,
        monthsWithBillsCount: 0,
      };
    });

    const monthlyBreakdown = monthNames.map((monthName, monthIdx) => {
      const cardsInMonth = data.cards.map(card => {
        const stmt = getStatementData(card.id, monthIdx, yearlySelectedYear);
        const ownerBreakdown = getMonthlyBillByOwner(card.id, monthIdx, yearlySelectedYear);

        const bill = stmt.totalBill;
        const paid = stmt.totalPaid;
        const savings = stmt.totalSavingsAmount;
        const piutangs = stmt.totalPiutangsAmount;
        const kurang = stmt.totalKurang;
        const unpaid = stmt.totalUnpaid;
        const gap = unpaid;
        const saved = stmt.totalSaved;

        const personal = ownerBreakdown.personal;
        const business = ownerBreakdown.business;
        const unclassified = ownerBreakdown.unclassified;

        if (cardAggregatesMap[card.id]) {
          cardAggregatesMap[card.id].totalBill += bill;
          cardAggregatesMap[card.id].totalPaid += paid;
          cardAggregatesMap[card.id].totalSavings += savings;
          cardAggregatesMap[card.id].totalPiutangs += piutangs;
          cardAggregatesMap[card.id].totalKurang += kurang;
          cardAggregatesMap[card.id].totalGap += gap;
          cardAggregatesMap[card.id].totalPersonal += personal;
          cardAggregatesMap[card.id].totalBusiness += business;
          cardAggregatesMap[card.id].totalUnclassified += unclassified;
          if (bill > 0 || paid > 0 || savings > 0 || piutangs > 0) {
            cardAggregatesMap[card.id].monthsWithBillsCount += 1;
          }
        }

        return {
          cardId: card.id,
          cardName: card.name,
          cardColor: card.color || 'bg-slate-400',
          cardObj: card,
          bill,
          savings,
          piutangs,
          paid,
          kurang,
          unpaid,
          gap,
          saved,
          personal,
          business,
          unclassified,
          isFullyPaid: bill > 0 && kurang === 0
        };
      });

      const totalMonthBill = cardsInMonth.reduce((s, c) => s + c.bill, 0);
      const totalMonthPaid = cardsInMonth.reduce((s, c) => s + c.paid, 0);
      const totalMonthSavings = cardsInMonth.reduce((s, c) => s + c.savings, 0);
      const totalMonthPiutangs = cardsInMonth.reduce((s, c) => s + c.piutangs, 0);
      const totalMonthKurang = Math.max(0, totalMonthBill - totalMonthPaid - totalMonthSavings - totalMonthPiutangs);
      const totalMonthUnpaid = Math.max(0, totalMonthBill - totalMonthPaid);
      const totalMonthGap = totalMonthUnpaid;
      const totalMonthSaved = totalMonthSavings + totalMonthPiutangs;
      const totalMonthPersonal = cardsInMonth.reduce((s, c) => s + c.personal, 0);
      const totalMonthBusiness = cardsInMonth.reduce((s, c) => s + c.business, 0);

      let status: 'LUNAS' | 'SEBAGIAN' | 'KURANG' | '-' = '-';
      if (totalMonthBill > 0) {
        if (totalMonthKurang === 0) status = 'LUNAS';
        else if (totalMonthPaid > 0 || totalMonthSavings > 0 || totalMonthPiutangs > 0) status = 'SEBAGIAN';
        else status = 'KURANG';
      } else if (totalMonthPaid > 0) {
        status = 'LUNAS';
      }

      return {
        monthName,
        monthIdx,
        cardsInMonth,
        totalMonthBill,
        totalMonthSavings,
        totalMonthPiutangs,
        totalMonthPaid,
        totalMonthKurang,
        totalMonthUnpaid,
        totalMonthGap,
        totalMonthSaved,
        totalMonthPersonal,
        totalMonthBusiness,
        monthlySavingsAmount: totalMonthSavings,
        monthlyPiutangsAmount: totalMonthPiutangs,
        status
      };
    });

    const totalYearBill = monthlyBreakdown.reduce((s, m) => s + m.totalMonthBill, 0);
    const totalYearPaid = monthlyBreakdown.reduce((s, m) => s + m.totalMonthPaid, 0);
    const totalYearSavings = monthlyBreakdown.reduce((s, m) => s + m.totalMonthSavings, 0);
    const totalYearPiutangs = monthlyBreakdown.reduce((s, m) => s + m.totalMonthPiutangs, 0);
    const totalYearKurang = Math.max(0, totalYearBill - totalYearPaid - totalYearSavings - totalYearPiutangs);
    const totalYearGap = Math.max(0, totalYearBill - totalYearPaid);

    const cardsSummaryList = Object.values(cardAggregatesMap).sort((a, b) => {
      const aHasKurang = a.totalKurang > 0;
      const bHasKurang = b.totalKurang > 0;

      if (aHasKurang && bHasKurang) return b.totalKurang - a.totalKurang;
      if (aHasKurang && !bHasKurang) return -1;
      if (!aHasKurang && bHasKurang) return 1;

      const aHasBill = a.totalBill > 0;
      const bHasBill = b.totalBill > 0;
      if (aHasBill && !bHasBill) return -1;
      if (!aHasBill && bHasBill) return 1;

      return a.cardName.localeCompare(b.cardName);
    });

    return {
      monthlyBreakdown,
      cardsSummaryList,
      totalYearBill,
      totalYearPaid,
      totalYearSavings,
      totalYearPiutangs,
      totalYearKurang,
      totalYearGap,
      hasData: true
    };
  }, [data, yearlySelectedYear]);

  const ownerBillsAnalysis = useMemo(() => {
    const monthlyList = monthNames.map((monthName, monthIdx) => {
      const cardsData = data.cards.map(card => {
        const ownerBill = getMonthlyGrossBillByOwner(card.id, monthIdx, ownerBillsYear);
        const cardMonthSavings = data.savings.filter(
          s => !s.isTransferred && s.cardId === card.id && s.targetPeriod?.month === monthIdx && s.targetPeriod?.year === ownerBillsYear
        );
        const savingBusiness = Math.max(0, cardMonthSavings
          .filter(s => s.owner === OwnerType.BUSINESS)
          .reduce((acc, s) => acc + s.amount, 0));
        const savingPersonal = Math.max(0, cardMonthSavings
          .filter(s => s.owner !== OwnerType.BUSINESS)
          .reduce((acc, s) => acc + s.amount, 0));

        const grossBusiness = ownerBill.business;
        const grossPersonal = ownerBill.personal;
        const business = Math.max(0, Math.ceil(grossBusiness - savingBusiness));
        const personal = Math.max(0, Math.ceil(grossPersonal - savingPersonal));

        return {
          cardId: card.id,
          cardName: card.name,
          cardColor: card.color || 'bg-slate-500',
          cardObj: card,
          grossBusiness,
          grossPersonal,
          savingBusiness,
          savingPersonal,
          business,
          personal,
          totalCardBill: business + personal
        };
      });

      const totalBusiness = cardsData.reduce((sum, c) => sum + c.business, 0);
      const totalPersonal = cardsData.reduce((sum, c) => sum + c.personal, 0);
      const totalGrossBusiness = cardsData.reduce((sum, c) => sum + c.grossBusiness, 0);
      const totalGrossPersonal = cardsData.reduce((sum, c) => sum + c.grossPersonal, 0);
      const totalSavingBusiness = cardsData.reduce((sum, c) => sum + c.savingBusiness, 0);
      const totalSavingPersonal = cardsData.reduce((sum, c) => sum + c.savingPersonal, 0);
      const totalMonth = totalBusiness + totalPersonal;
      const totalGrossMonth = totalGrossBusiness + totalGrossPersonal;

      return {
        monthIdx,
        monthName,
        year: ownerBillsYear,
        cardsData,
        totalBusiness,
        totalPersonal,
        totalGrossBusiness,
        totalGrossPersonal,
        totalSavingBusiness,
        totalSavingPersonal,
        totalMonth,
        totalGrossMonth
      };
    });

    const yearTotalBusiness = monthlyList.reduce((sum, m) => sum + m.totalBusiness, 0);
    const yearTotalPersonal = monthlyList.reduce((sum, m) => sum + m.totalPersonal, 0);
    const yearTotalSavingBusiness = monthlyList.reduce((sum, m) => sum + m.totalSavingBusiness, 0);
    const yearTotalSavingPersonal = monthlyList.reduce((sum, m) => sum + m.totalSavingPersonal, 0);
    const yearTotalAll = yearTotalBusiness + yearTotalPersonal;

    return {
      monthlyList,
      yearTotalBusiness,
      yearTotalPersonal,
      yearTotalSavingBusiness,
      yearTotalSavingPersonal,
      yearTotalAll
    };
  }, [data, ownerBillsYear]);

  const dashboardMonthlyData = useMemo(() => {
    let monthBusinessBill = 0;
    let monthPersonalBill = 0;

    const cardsInMonth = data.cards.map(card => {
      const stmt = getStatementData(card.id, dashMonth, dashYear);
      const ownerGross = getMonthlyGrossBillByOwner(card.id, dashMonth, dashYear);
      monthBusinessBill += ownerGross.business;
      monthPersonalBill += ownerGross.personal;

      const bill = stmt.totalBill;
      const paid = stmt.totalPaid;
      const savings = stmt.totalSavingsAmount;
      const piutangs = stmt.totalPiutangsAmount;
      const kurang = stmt.totalKurang;
      const unpaid = stmt.totalUnpaid;
      const coveredAmount = paid + savings + piutangs;
      const coveragePct = bill > 0 ? Math.min(100, Math.round((coveredAmount / bill) * 100)) : 100;

      return {
        cardId: card.id,
        cardName: card.name,
        cardColor: card.color || 'bg-slate-500',
        cardObj: card,
        bill,
        savings,
        piutangs,
        paid,
        kurang,
        unpaid,
        coveragePct,
        businessBill: ownerGross.business,
        personalBill: ownerGross.personal,
        isFullyPaid: bill > 0 && kurang === 0
      };
    });

    const totalMonthBill = cardsInMonth.reduce((s, c) => s + c.bill, 0);
    const totalMonthPaid = cardsInMonth.reduce((s, c) => s + c.paid, 0);
    const totalMonthSavings = cardsInMonth.reduce((s, c) => s + c.savings, 0);
    const totalMonthPiutangs = cardsInMonth.reduce((s, c) => s + c.piutangs, 0);
    const totalMonthKurang = Math.max(0, totalMonthBill - totalMonthPaid - totalMonthSavings - totalMonthPiutangs);
    const totalMonthUnpaid = Math.max(0, totalMonthBill - totalMonthPaid);
    const monthCoveragePct = totalMonthBill > 0
      ? Math.min(100, Math.round(((totalMonthPaid + totalMonthSavings + totalMonthPiutangs) / totalMonthBill) * 100))
      : 100;

    const totalLimit = data.cards.reduce((sum, c) => sum + (c.limit || 0), 0);
    const totalUsedLimit = data.cards.reduce((sum, c) => sum + Math.max(0, getCardBalance(c.id)), 0);
    const totalRemainingLimit = Math.max(0, totalLimit - totalUsedLimit);
    const limitUtilizationPct = totalLimit > 0 ? Math.min(100, Math.round((totalUsedLimit / totalLimit) * 100)) : 0;

    let status: 'LUNAS' | 'SEBAGIAN' | 'KURANG' | '-' = '-';
    if (totalMonthBill > 0) {
      if (totalMonthKurang === 0) status = 'LUNAS';
      else if (totalMonthPaid > 0 || totalMonthSavings > 0 || totalMonthPiutangs > 0) status = 'SEBAGIAN';
      else status = 'KURANG';
    } else if (totalMonthPaid > 0) {
      status = 'LUNAS';
    }

    return {
      monthName: monthNames[dashMonth],
      dashMonth,
      dashYear,
      cardsInMonth,
      totalMonthBill,
      totalMonthSavings,
      totalMonthPiutangs,
      totalMonthPaid,
      totalMonthKurang,
      totalMonthUnpaid,
      monthCoveragePct,
      monthBusinessBill,
      monthPersonalBill,
      totalLimit,
      totalUsedLimit,
      totalRemainingLimit,
      limitUtilizationPct,
      status
    };
  }, [data, dashMonth, dashYear]);

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

  const piutangsYearlyData = useMemo(() => {
    return monthNames.map((monthName, monthIdx) => {
       const monthlyPiutangs = (data.piutangs || []).filter(p => !p.isCollected && p.targetPeriod?.month === monthIdx && p.targetPeriod?.year === piutangsSelectedYear);
       const cardGroups: Record<string, { cardId: string, cardName: string, cardColor: string, amount: number, items: PiutangType[] }> = {};
       monthlyPiutangs.forEach(p => {
         const card = data.cards.find(c => c.id === p.cardId);
         if (!card) return;
         if (!cardGroups[p.cardId]) { cardGroups[p.cardId] = { cardId: p.cardId, cardName: card.name, cardColor: card.color, amount: 0, items: [] }; }
         cardGroups[p.cardId].amount += p.amount;
         cardGroups[p.cardId].items.push(p);
       });
       const totalMonth = monthlyPiutangs.reduce((sum, p) => sum + p.amount, 0);
       return { monthName, monthIdx, cardGroups: Object.values(cardGroups), totalMonth };
    });
  }, [data, piutangsSelectedYear]);

  const totalYearSavings = useMemo(() => {
    return data.savings.filter(s => !s.isTransferred && s.targetPeriod?.year === savingsSelectedYear).reduce((sum, s) => sum + s.amount, 0);
  }, [data.savings, savingsSelectedYear]);

  const totalYearPiutangs = useMemo(() => {
    return (data.piutangs || []).filter(p => !p.isCollected && p.targetPeriod?.year === piutangsSelectedYear).reduce((sum, p) => sum + p.amount, 0);
  }, [data.piutangs, piutangsSelectedYear]);

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
  const totalPiutangsAcrossYears = useMemo(() => Math.ceil((data.piutangs || []).filter(p => !p.isCollected).reduce((s, c) => s + c.amount, 0)), [data.piutangs]);
  const totalAssets = totalSavingsAcrossYears + totalPiutangsAcrossYears;
  const currentDebtGap = useMemo(() => Math.max(0, totalDebt - totalAssets), [totalDebt, totalAssets]);

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
      const updatedCards = data.cards.map(c => c.id === editingCard.id ? { ...c, name: cardName, limit: limitVal, dueDay: cardDue ? parseInt(cardDue) : undefined, color: cardColor, type: cardType, eStatementFee: estFeeVal, logoUrl: cardLogoUrl } : c);
      saveData({ ...data, cards: updatedCards });
      setEditingCard(null);
    } else {
      const newCard: CreditCardType = { id: generateId(), name: cardName, limit: limitVal, color: cardColor, dueDay: cardDue ? parseInt(cardDue) : undefined, type: cardType, eStatementFee: estFeeVal, logoUrl: cardLogoUrl };
      saveData({ ...data, cards: [...data.cards, newCard] });
    }
    popView();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault(); const amountVal = getNumericValue(txAmount); if (!txCardId) return;
    let finalAmount = Math.ceil(amountVal); let finalDesc = txDesc;
    let updatedSavings = [...data.savings]; let updatedInstallments = [...data.installments];
    
    let splitPersonalAmount = 0;
    let splitBusinessAmount = 0;
    if (txType === TransactionType.EXPENSE && txOwner === OwnerType.SPLIT) {
       splitPersonalAmount = getNumericValue(txSplitPersonal);
       splitBusinessAmount = getNumericValue(txSplitBusiness);
       if (splitPersonalAmount + splitBusinessAmount !== finalAmount) {
         alert(`Total split (Rp ${formatIDR(splitPersonalAmount + splitBusinessAmount).replace('Rp', '').trim()}) tidak sama dengan nominal transaksi (Rp ${formatIDR(finalAmount).replace('Rp', '').trim()}).`);
         return;
       }
    }
    const finalSplitAmounts = txType === TransactionType.EXPENSE && txOwner === OwnerType.SPLIT ? { personal: splitPersonalAmount, business: splitBusinessAmount } : undefined;
    const finalOwner = txType === TransactionType.EXPENSE ? txOwner : undefined;

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
    
    const txIdToSave = editingTransaction ? editingTransaction.id : generateId();

    if (txIsInstallment && txType === TransactionType.EXPENSE) {
      if (editingTransaction && !editingTransaction.isInstallment) {
         updatedInstallments = [{ id: generateId(), transactionId: txIdToSave, cardId: txCardId, name: finalDesc, totalAmount: finalAmount, monthlyAmount: Math.ceil(finalAmount / (txInstallmentMonths || 1)), totalMonths: txInstallmentMonths, monthsPaid: 0, startDate: new Date(txDate).toISOString(), validatedTenors: [], owner: finalOwner, splitAmounts: finalSplitAmounts }, ...updatedInstallments];
      } else if (!editingTransaction) {
         updatedInstallments = [{ id: generateId(), transactionId: txIdToSave, cardId: txCardId, name: finalDesc, totalAmount: finalAmount, monthlyAmount: Math.ceil(finalAmount / (txInstallmentMonths || 1)), totalMonths: txInstallmentMonths, monthsPaid: 0, startDate: new Date(txDate).toISOString(), validatedTenors: [], owner: finalOwner, splitAmounts: finalSplitAmounts }, ...updatedInstallments];
      } else {
         // Jika sebelumnya sudah cicilan dan sekarang diedit, update cicilan lama
         updatedInstallments = updatedInstallments.map(inst => {
           if (inst.transactionId === txIdToSave || (inst.cardId === editingTransaction.cardId && inst.name === editingTransaction.description && inst.totalAmount === editingTransaction.amount)) {
             return { ...inst, cardId: txCardId, name: finalDesc, totalAmount: finalAmount, monthlyAmount: Math.ceil(finalAmount / (txInstallmentMonths || 1)), totalMonths: txInstallmentMonths, startDate: new Date(txDate).toISOString(), transactionId: txIdToSave, owner: finalOwner, splitAmounts: finalSplitAmounts };
           }
           return inst;
         });
      }
    } else if (!txIsInstallment && editingTransaction?.isInstallment) {
      // Jika diubah dari cicilan menjadi bukan cicilan
      updatedInstallments = updatedInstallments.filter(inst => {
         if (inst.transactionId) return inst.transactionId !== txIdToSave;
         return !(inst.cardId === editingTransaction.cardId && inst.name === editingTransaction.description && inst.totalAmount === editingTransaction.amount);
      });
    }
    
    if (editingTransaction) {
      const updatedTransactions = data.transactions.map(t => t.id === editingTransaction.id ? { ...t, cardId: txCardId, amount: finalAmount, date: new Date(txDate).toISOString(), description: finalDesc, type: txType, category: txCategory, isInstallment: txIsInstallment, targetPeriod: txType === TransactionType.PAYMENT ? { month: txTargetMonth, year: txTargetYear } : undefined, owner: finalOwner, splitAmounts: finalSplitAmounts } : t);
      saveData({ ...data, transactions: updatedTransactions, installments: updatedInstallments, savings: updatedSavings });
      setEditingTransaction(null);
    } else {
      const newTransaction: Transaction = { id: txIdToSave, cardId: txCardId, amount: finalAmount, date: new Date(txDate).toISOString(), description: finalDesc, type: txType, category: txType === TransactionType.EXPENSE ? txCategory : 'Pelunasan', isInstallment: txIsInstallment, targetPeriod: txType === TransactionType.PAYMENT ? { month: txTargetMonth, year: txTargetYear } : undefined, owner: finalOwner, splitAmounts: finalSplitAmounts };
      saveData({ ...data, transactions: [newTransaction, ...data.transactions], installments: updatedInstallments, savings: updatedSavings });
    }
    popView();
  };

  const handleSaveSaving = (e: React.FormEvent) => {
    e.preventDefault(); const amountVal = getNumericValue(savingAmount); if (!savingCardId || amountVal === 0) return;
    const defaultNote = savingOwner === OwnerType.BUSINESS ? 'Tabungan Bisnis' : 'Tabungan Personal';
    if (editingSaving) {
      const updatedSavings = data.savings.map(s => s.id === editingSaving.id ? { ...s, cardId: savingCardId, amount: Math.ceil(amountVal), note: savingNote || defaultNote, owner: savingOwner, targetPeriod: { month: savingTargetMonth, year: savingTargetYear } } : s);
      saveData({ ...data, savings: updatedSavings });
      setEditingSaving(null);
    } else {
      const newSaving: Saving = { id: generateId(), cardId: savingCardId, amount: Math.ceil(amountVal), date: new Date().toISOString(), note: savingNote || defaultNote, owner: savingOwner, targetPeriod: { month: savingTargetMonth, year: savingTargetYear }, isTransferred: false };
      saveData({ ...data, savings: [newSaving, ...data.savings] });
    }
    popView(); setSavingAmount(''); setSavingNote('');
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = getNumericValue(transferAmount);
    if (!transferSourceCardId || !transferTargetCardId || amountVal <= 0) return;
    
    const sourceSaving: Saving = {
      id: generateId(),
      cardId: transferSourceCardId,
      amount: -Math.ceil(amountVal),
      date: new Date().toISOString(),
      note: transferNote || `Transfer ke ${data.cards.find(c => c.id === transferTargetCardId)?.name || 'Tabungan Lain'}`,
      targetPeriod: { month: transferSourceMonth, year: transferSourceYear },
      isTransferred: false
    };

    const targetSaving: Saving = {
      id: generateId(),
      cardId: transferTargetCardId,
      amount: Math.ceil(amountVal),
      date: new Date().toISOString(),
      note: transferNote || `Transfer dari ${data.cards.find(c => c.id === transferSourceCardId)?.name || 'Tabungan Lain'}`,
      targetPeriod: { month: transferTargetMonth, year: transferTargetYear },
      isTransferred: false
    };

    saveData({ ...data, savings: [sourceSaving, targetSaving, ...data.savings] });
    popView();
    setTransferAmount('');
    setTransferNote('');
  };

  const handleSavePiutang = (e: React.FormEvent) => {
    e.preventDefault(); const amountVal = getNumericValue(piutangAmount); if (!piutangCardId || amountVal <= 0 || !piutangDebtor) return;
    const currentPiutangs = data.piutangs || [];
    if (editingPiutang) {
      const updatedPiutangs = currentPiutangs.map(p => p.id === editingPiutang.id ? { ...p, cardId: piutangCardId, debtorName: piutangDebtor, amount: Math.ceil(amountVal), note: piutangNote, targetPeriod: { month: piutangTargetMonth, year: piutangTargetYear } } : p);
      saveData({ ...data, piutangs: updatedPiutangs });
      setEditingPiutang(null);
    } else {
      if (piutangIsInstallment && piutangInstallmentMonths > 1) {
        const monthlyAmount = Math.ceil(amountVal / piutangInstallmentMonths);
        const newPiutangs: PiutangType[] = [];
        let currentM = piutangTargetMonth;
        let currentY = piutangTargetYear;
        
        for (let i = 0; i < piutangInstallmentMonths; i++) {
          newPiutangs.push({
            id: generateId(),
            cardId: piutangCardId,
            debtorName: piutangDebtor,
            amount: monthlyAmount,
            date: new Date().toISOString(),
            note: `${piutangNote || 'Piutang'} (Cicilan ${i + 1}/${piutangInstallmentMonths})`,
            targetPeriod: { month: currentM, year: currentY },
            isCollected: false
          });
          currentM++;
          if (currentM > 11) {
            currentM = 0;
            currentY++;
          }
        }
        saveData({ ...data, piutangs: [...currentPiutangs, ...newPiutangs] });
      } else {
        const newPiutang: PiutangType = { id: generateId(), cardId: piutangCardId, debtorName: piutangDebtor, amount: Math.ceil(amountVal), date: new Date().toISOString(), note: piutangNote || 'Piutang', targetPeriod: { month: piutangTargetMonth, year: piutangTargetYear }, isCollected: false };
        saveData({ ...data, piutangs: [...currentPiutangs, newPiutang] });
      }
    }
    popView(); setPiutangAmount(''); setPiutangDebtor(''); setPiutangNote(''); setPiutangIsInstallment(false); setPiutangInstallmentMonths(12);
  };

  // Shared content rendering function for both mobile and desktop
  const renderCurrentView = () => {
    switch (currentView) {
      case 'DASHBOARD': {
        const globalCoveragePct = totalDebt > 0
          ? Math.min(100, Math.round((totalAssets / totalDebt) * 100))
          : 100;
        const recentDashboardTransactions = [...data.transactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        return (
          <div className="space-y-5 animate-in fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4 md:py-7">
            {/* 1. 2026 EXECUTIVE FINTECH BENTO HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Main Net Liability & Coverage Command Card */}
              <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 dark:from-slate-900 dark:via-indigo-950/90 dark:to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-white/10 relative overflow-hidden flex flex-col justify-between gap-5">
                <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Top Status & Privacy Bar */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-blue-200 border border-white/10 backdrop-blur-md">
                      <span className={`w-1.5 h-1.5 rounded-full ${currentDebtGap === 0 ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                      Portfolio Liabilitas
                    </span>
                    <span className="text-[11px] font-bold text-slate-300/80 hidden sm:inline">
                      • {data.cards.length} Instrumen Aktif
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAmounts(!showAmounts)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-blue-100 transition cursor-pointer border border-white/10"
                    title={showAmounts ? 'Sembunyikan Nominal' : 'Tampilkan Nominal'}
                  >
                    {showAmounts ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                </div>

                {/* Primary Figures: Total Liabilitas & Sisa Kewajiban Bersih */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-end">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200/75">
                      Total Proyeksi Liabilitas
                    </p>
                    <h3 className="text-2xl sm:text-4xl font-black tracking-tight tabular-nums mt-1">
                      {showAmounts ? formatIDR(totalDebt) : '••••••••'}
                    </h3>
                  </div>

                  <div className="sm:text-right bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-white/10 sm:border-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300/90">
                      Sisa Hutang Bersih (Net Gap)
                    </p>
                    <p className="text-xl sm:text-2xl font-black tracking-tight tabular-nums text-amber-300 mt-0.5">
                      {showAmounts ? formatIDR(currentDebtGap) : '••••••••'}
                    </p>
                  </div>
                </div>

                {/* Coverage Progress Bar */}
                <div className="relative z-10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider">
                    <span className="text-blue-200/80">Rasio Kesiapan Dana Pelunasan</span>
                    <span className={globalCoveragePct >= 100 ? 'text-emerald-300' : 'text-blue-200'}>
                      {globalCoveragePct}% Terkover ({showAmounts ? formatIDR(totalAssets) : '••••'})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        globalCoveragePct >= 100
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                          : 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400'
                      }`}
                      style={{ width: `${globalCoveragePct}%` }}
                    />
                  </div>
                </div>

                {/* Bottom 3 Interactive Bento Sub-Cards (Full un-truncated numbers on mobile & desktop) */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-2.5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => pushView('SAVINGS')}
                    className="px-3.5 py-2.5 sm:p-3.5 rounded-2xl bg-white/8 hover:bg-white/14 border border-white/10 flex sm:flex-col items-center sm:items-start justify-between gap-2 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center sm:justify-between gap-2.5 sm:w-full">
                      <div className="w-7 h-7 rounded-xl bg-emerald-400/15 text-emerald-300 flex items-center justify-center shrink-0">
                        <Vault size={14} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100/85 sm:hidden">
                        Tabungan
                      </span>
                      <ChevronRight size={13} className="hidden sm:block text-blue-200/60 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="flex items-center gap-1.5 sm:block sm:w-full sm:mt-1">
                      <p className="hidden sm:block text-[9px] font-bold uppercase tracking-wider text-blue-200/75">
                        Tabungan
                      </p>
                      <p className="text-sm sm:text-base font-black tabular-nums text-white whitespace-nowrap sm:mt-0.5">
                        {showAmounts ? formatIDR(totalSavingsAcrossYears) : '••••••••'}
                      </p>
                      <ChevronRight size={14} className="sm:hidden text-blue-200/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => pushView('PIUTANGS')}
                    className="px-3.5 py-2.5 sm:p-3.5 rounded-2xl bg-white/8 hover:bg-white/14 border border-white/10 flex sm:flex-col items-center sm:items-start justify-between gap-2 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center sm:justify-between gap-2.5 sm:w-full">
                      <div className="w-7 h-7 rounded-xl bg-cyan-400/15 text-cyan-300 flex items-center justify-center shrink-0">
                        <HandCoins size={14} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100/85 sm:hidden">
                        Piutang
                      </span>
                      <ChevronRight size={13} className="hidden sm:block text-blue-200/60 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="flex items-center gap-1.5 sm:block sm:w-full sm:mt-1">
                      <p className="hidden sm:block text-[9px] font-bold uppercase tracking-wider text-blue-200/75">
                        Piutang
                      </p>
                      <p className="text-sm sm:text-base font-black tabular-nums text-white whitespace-nowrap sm:mt-0.5">
                        {showAmounts ? formatIDR(totalPiutangsAcrossYears) : '••••••••'}
                      </p>
                      <ChevronRight size={14} className="sm:hidden text-blue-200/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => pushView('OWNER_BILLS')}
                    className="px-3.5 py-2.5 sm:p-3.5 rounded-2xl bg-white/8 hover:bg-white/14 border border-white/10 flex sm:flex-col items-center sm:items-start justify-between gap-2 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center sm:justify-between gap-2.5 sm:w-full">
                      <div className="w-7 h-7 rounded-xl bg-purple-400/15 text-purple-300 flex items-center justify-center shrink-0">
                        <Briefcase size={14} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100/85 sm:hidden">
                        Bisnis ({dashYear})
                      </span>
                      <ChevronRight size={13} className="hidden sm:block text-blue-200/60 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="flex items-center gap-1.5 sm:block sm:w-full sm:mt-1">
                      <p className="hidden sm:block text-[9px] font-bold uppercase tracking-wider text-blue-200/75">
                        Bisnis ({dashYear})
                      </p>
                      <p className="text-sm sm:text-base font-black tabular-nums text-white whitespace-nowrap sm:mt-0.5">
                        {showAmounts ? formatIDR(ownerBillsAnalysis.yearTotalBusiness) : '••••••••'}
                      </p>
                      <ChevronRight size={14} className="sm:hidden text-blue-200/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Side Bento Card: Credit Limit & Plafon Utilization + Menu Piutang & Kartu */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      Kesehatan Plafon Kredit
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                      Utilisasi Limit Kartu
                    </h4>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                    dashboardMonthlyData.limitUtilizationPct > 75
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : dashboardMonthlyData.limitUtilizationPct > 40
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {dashboardMonthlyData.limitUtilizationPct}% Terpakai
                  </span>
                </div>

                {/* Circular / Big Utilization Readout */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Sisa Limit Tersedia</span>
                    <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                      {showAmounts ? formatIDR(dashboardMonthlyData.totalRemainingLimit) : '••••••••'}
                    </p>
                  </div>

                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        dashboardMonthlyData.limitUtilizationPct > 75
                          ? 'bg-rose-500'
                          : dashboardMonthlyData.limitUtilizationPct > 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${dashboardMonthlyData.limitUtilizationPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>Terpakai: <strong className="text-slate-800 dark:text-slate-200">{showAmounts ? formatIDR(dashboardMonthlyData.totalUsedLimit) : '••••'}</strong></span>
                    <span>Plafon: <strong className="text-slate-800 dark:text-slate-200">{showAmounts ? formatIDR(dashboardMonthlyData.totalLimit) : '••••'}</strong></span>
                  </div>
                </div>

                {/* 2 Menu Navigation Icons: Piutang (opens PIUTANGS menu) & Kartu (opens CARDS menu) */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => pushView('PIUTANGS')}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 transition active:scale-95 cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                      <HandCoins size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                        Piutang
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block truncate">
                        Daftar Piutang
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => pushView('CARDS')}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-500/15 flex items-center justify-center shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                        Kartu
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block truncate">
                        Kelola Kartu
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. RADAR JATUH TEMPO TERDEKAT (IF ANY) */}
            {upcomingBills.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <CalendarClock size={15} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wider">
                        Jatuh Tempo
                      </h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400">
                    {upcomingBills.length} Tagihan Aktif
                  </span>
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
                  {upcomingBills.map(bill => (
                    <div
                      key={bill.id}
                      onClick={() => openStatement(bill)}
                      className="min-w-[260px] sm:min-w-[300px] bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex flex-col gap-2.5 snap-center active:scale-[0.99] hover:border-primary/50 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${bill.color || 'bg-slate-500'}`} />
                          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                            {bill.name}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          bill.daysLeft <= 3
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {bill.daysLeft <= 0 ? 'Hari Ini' : `H-${bill.daysLeft}`}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Tagihan</span>
                          <span className="font-black text-slate-900 dark:text-white tabular-nums">
                            {showAmounts ? formatIDR(bill.remainingBill) : '••••••'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">
                            {bill.netGap > 0 ? 'Kurang Dana' : 'Status'}
                          </span>
                          <span className={`font-black tabular-nums ${bill.netGap > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {bill.netGap > 0 ? (showAmounts ? formatIDR(bill.netGap) : '••••') : '✓ Siap Lunas'}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${bill.isCovered ? 'bg-emerald-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, bill.progress)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. MONTHLY COMMAND CENTER (RINCIAN TAGIHAN BULANAN & PER KARTU) */}
            <div className="space-y-5 bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                      Tagihan Bulan Ini
                    </h3>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                      dashboardMonthlyData.status === 'LUNAS'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : dashboardMonthlyData.status === 'SEBAGIAN'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : dashboardMonthlyData.status === 'KURANG'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {dashboardMonthlyData.status === '-' ? 'NIHIL' : dashboardMonthlyData.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Posisi tagihan, tabungan, piutang, pembayaran & kekurangan tiap kartu
                  </p>
                </div>

                {/* Sleek Month Navigator */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {(dashMonth !== new Date().getMonth() || dashYear !== new Date().getFullYear()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDashMonth(new Date().getMonth());
                        setDashYear(new Date().getFullYear());
                      }}
                      className="text-[10px] font-black uppercase bg-primary/10 text-primary dark:text-blue-400 px-2.5 py-1.5 rounded-xl hover:bg-primary/20 transition cursor-pointer"
                    >
                      Bulan Ini
                    </button>
                  )}

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                    <button
                      type="button"
                      onClick={() => {
                        if (dashMonth === 0) {
                          setDashMonth(11);
                          setDashYear(y => y - 1);
                        } else {
                          setDashMonth(m => m - 1);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="px-3 py-1 text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Calendar size={13} className="text-primary" />
                      <span>{dashboardMonthlyData.monthName} {dashYear}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (dashMonth === 11) {
                          setDashMonth(0);
                          setDashYear(y => y + 1);
                        } else {
                          setDashMonth(m => m + 1);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Bulan Berikutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* OVERALL MONTH SUMMARY BENTO (5 Metrics + Coverage Bar + Personal/Bisnis Pill) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-700/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Ringkasan {dashboardMonthlyData.monthName} {dashYear}
                    </span>
                    <span className="text-[10px] font-black text-primary dark:text-blue-400 bg-primary/10 px-2 py-0.5 rounded-md">
                      {dashboardMonthlyData.monthCoveragePct}% Terkover
                    </span>
                  </div>

                  {/* Mini Personal vs Business Split Pill for this Month */}
                  <div className="flex items-center gap-2 text-[10px] font-extrabold">
                    <button
                      type="button"
                      onClick={() => pushView('OWNER_BILLS')}
                      className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition cursor-pointer"
                    >
                      Personal: {showAmounts ? formatIDR(dashboardMonthlyData.monthPersonalBill) : '••••'}
                    </button>
                    <button
                      type="button"
                      onClick={() => pushView('OWNER_BILLS')}
                      className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition cursor-pointer"
                    >
                      Bisnis: {showAmounts ? formatIDR(dashboardMonthlyData.monthBusinessBill) : '••••'}
                    </button>
                  </div>
                </div>

                {/* Month Coverage Progress Bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      dashboardMonthlyData.totalMonthKurang === 0 ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${dashboardMonthlyData.monthCoveragePct}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                  {/* 1. Total Tagihan */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-0.5">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <CreditCard size={12} className="text-blue-500" /> Total Tagihan
                    </span>
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">
                      {showAmounts ? formatIDR(dashboardMonthlyData.totalMonthBill) : '••••••••'}
                    </p>
                  </div>

                  {/* 2. Tabungan */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-0.5">
                    <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Vault size={12} /> Tabungan
                    </span>
                    <p className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-300 tabular-nums">
                      {showAmounts ? formatIDR(dashboardMonthlyData.totalMonthSavings) : '••••••••'}
                    </p>
                  </div>

                  {/* 3. Piutang */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-0.5">
                    <span className="text-[9px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Receipt size={12} /> Piutang
                    </span>
                    <p className="text-sm sm:text-base font-black text-cyan-600 dark:text-cyan-300 tabular-nums">
                      {showAmounts ? formatIDR(dashboardMonthlyData.totalMonthPiutangs) : '••••••••'}
                    </p>
                  </div>

                  {/* 4. Sudah Dibayar */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-0.5">
                    <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={12} /> Sudah Dibayar
                    </span>
                    <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {showAmounts ? formatIDR(dashboardMonthlyData.totalMonthPaid) : '••••••••'}
                    </p>
                  </div>

                  {/* 5. Kurang */}
                  <div className="bg-rose-50/70 dark:bg-rose-950/25 p-3 rounded-2xl border border-rose-200/80 dark:border-rose-800/50 space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle size={12} /> Kurang Dana
                    </span>
                    <p className={`text-sm sm:text-base font-black tabular-nums ${dashboardMonthlyData.totalMonthKurang > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {showAmounts ? (dashboardMonthlyData.totalMonthKurang > 0 ? formatIDR(dashboardMonthlyData.totalMonthKurang) : 'Rp 0') : '••••••••'}
                    </p>
                    {dashboardMonthlyData.totalMonthSavings + dashboardMonthlyData.totalMonthPiutangs > 0 && dashboardMonthlyData.totalMonthUnpaid > dashboardMonthlyData.totalMonthKurang && showAmounts && (
                      <span className="text-[8px] text-slate-500 dark:text-slate-400 font-bold block">
                        Belum setor: {formatIDR(dashboardMonthlyData.totalMonthUnpaid)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PER KARTU BREAKDOWN GRID */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Rincian Per Kartu ({dashboardMonthlyData.monthName})
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    Klik Detail untuk buka e-Statement
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardMonthlyData.cardsInMonth.map(cardItem => {
                    const cardHasKurang = cardItem.kurang > 0;
                    return (
                      <div
                        key={cardItem.cardId}
                        className="bg-white dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-primary/40 transition flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2.5">
                          {/* Card Header */}
                          <div className="flex justify-between items-center gap-2">
                            <div
                              onClick={() => openStatement(cardItem.cardObj, dashMonth, dashYear)}
                              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                            >
                              <div className={`w-8 h-8 rounded-xl ${cardItem.cardColor} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                                {cardItem.cardName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-black text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition">
                                  {cardItem.cardName}
                                </h5>
                                <p className="text-[9px] font-bold text-slate-400">
                                  {cardItem.cardObj.dueDay ? `Jatuh Tempo Tgl ${cardItem.cardObj.dueDay}` : 'Pinjaman / Hutang'}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              cardHasKurang
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : cardItem.bill > 0 || cardItem.paid > 0
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {cardHasKurang ? 'Ada Kurang' : (cardItem.bill > 0 || cardItem.paid > 0 ? '✓ Lunas' : 'Nihil')}
                            </span>
                          </div>

                          {/* Mini Coverage Bar */}
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${cardHasKurang ? 'bg-primary' : 'bg-emerald-500'}`}
                              style={{ width: `${cardItem.coveragePct}%` }}
                            />
                          </div>

                          {/* 2x2 Metrics Grid + Kurang Highlight */}
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Tagihan</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
                                {showAmounts ? formatIDR(cardItem.bill) : '••••'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Dibayar</span>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {showAmounts ? formatIDR(cardItem.paid) : '••••'}
                              </span>
                            </div>
                            <div className="pt-1 border-t border-slate-200/50 dark:border-slate-800">
                              <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase block">Tabungan</span>
                              <span className="font-extrabold text-purple-600 dark:text-purple-300 tabular-nums">
                                {showAmounts ? formatIDR(cardItem.savings) : '••••'}
                              </span>
                            </div>
                            <div className="pt-1 border-t border-slate-200/50 dark:border-slate-800 text-right">
                              <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase block">Piutang</span>
                              <span className="font-extrabold text-cyan-600 dark:text-cyan-300 tabular-nums">
                                {showAmounts ? formatIDR(cardItem.piutangs) : '••••'}
                              </span>
                            </div>
                          </div>

                          {/* Kurang Row */}
                          <div className="flex justify-between items-center px-1">
                            <div>
                              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase">
                                Kurang Dana
                              </span>
                              {cardItem.savings + cardItem.piutangs > 0 && cardItem.unpaid > cardItem.kurang && showAmounts && (
                                <span className="text-[9px] text-slate-400 font-bold block">
                                  Belum setor: {formatIDR(cardItem.unpaid)}
                                </span>
                              )}
                            </div>
                            <span className={`font-black text-xs sm:text-sm tabular-nums ${cardHasKurang ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {showAmounts ? (cardHasKurang ? formatIDR(cardItem.kurang) : 'Rp 0') : '••••••'}
                            </span>
                          </div>
                        </div>

                        {/* Quick actions for this card */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => openStatement(cardItem.cardObj, dashMonth, dashYear)}
                            className="py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Receipt size={11} /> Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTransaction(null);
                              setTxAmount('');
                              setTxDesc(`Bayar ${cardItem.cardName}`);
                              setTxType(TransactionType.PAYMENT);
                              setTxCardId(cardItem.cardId);
                              setTxTargetMonth(dashMonth);
                              setTxTargetYear(dashYear);
                              pushView('FORM_TRANSACTION');
                            }}
                            className="py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check size={11} /> Bayar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSaving(null);
                              setSavingAmount('');
                              setSavingNote(`Tabungan ${cardItem.cardName}`);
                              setSavingOwner(OwnerType.PERSONAL);
                              setSavingCardId(cardItem.cardId);
                              setSavingTargetMonth(dashMonth);
                              setSavingTargetYear(dashYear);
                              pushView('FORM_SAVING');
                            }}
                            className="py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/20 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Vault size={11} /> Nabung
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {dashboardMonthlyData.cardsInMonth.length === 0 && (
                  <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs font-bold">Belum ada kartu atau hutang terdaftar.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. RECENT TRANSACTIONS */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <History size={16} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
                      Aktivitas Terakhir
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400">
                      5 transaksi & pembayaran terbaru
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => pushView('TRANSACTIONS')}
                  className="text-[10px] font-black text-primary dark:text-blue-400 hover:underline uppercase cursor-pointer"
                >
                  Semua
                </button>
              </div>

              <div className="space-y-2">
                {recentDashboardTransactions.map(t => {
                  const card = data.cards.find(c => c.id === t.cardId);
                  const isExpense = t.type === TransactionType.EXPENSE;
                  return (
                    <div
                      key={t.id}
                      onClick={() => openEditTransaction(t)}
                      className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2.5 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpense ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {isExpense ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                            {t.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                            <span>{card?.name || 'Kartu'}</span>
                            <span>•</span>
                            <span>{new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                            {t.owner && (
                              <span className={`px-1.5 py-0.2 rounded uppercase font-black ${
                                t.owner === OwnerType.BUSINESS
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              }`}>
                                {t.owner === OwnerType.BUSINESS ? 'BISNIS' : t.owner === OwnerType.PERSONAL ? 'PERSONAL' : 'SPLIT'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-black tabular-nums whitespace-nowrap ${
                        isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isExpense ? '-' : '+'}{showAmounts ? formatIDR(t.amount) : '••••'}
                      </span>
                    </div>
                  );
                })}
                {recentDashboardTransactions.length === 0 && (
                  <p className="text-center py-8 text-xs text-slate-400 font-bold">
                    Belum ada riwayat transaksi.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      }
      case 'CARDS':
        return (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-5 py-4 md:px-8 md:py-8">
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.cards.map(card => {
                  const balance = getCardBalance(card.id); const remaining = card.limit - balance;
                  return (
                    <div key={card.id} className="space-y-3">
                      <div onClick={() => openStatement(card)} className={`relative p-6 rounded-[24px] text-white shadow-xl h-56 flex flex-col justify-between overflow-hidden active:scale-[0.98] transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group`}>
                          {/* Background Colors & Gradient */}
                          <div className={`absolute inset-0 ${card.color || 'bg-slate-800'}`}></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 pointer-events-none"></div>
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_20%,rgba(255,255,255,0.1)_25%,transparent_30%)] pointer-events-none transition-transform duration-700 -translate-x-full group-hover:translate-x-full"></div>
                          
                          {/* Decorative overlay for texture */}
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none"></div>
                          
                          <div className="relative z-10 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                               {/* EMV Chip */}
                               <div className="w-10 h-7 bg-gradient-to-br from-[#e5c07b] to-[#d19a3b] rounded-md flex items-center justify-center opacity-90 shadow-sm border border-[#f5d596]/40 overflow-hidden">
                                 <div className="w-6 h-5 border border-[#a67b27]/30 rounded-sm flex flex-col justify-between p-[1px]">
                                    <div className="h-[1px] w-full bg-[#a67b27]/30 mt-1"></div>
                                    <div className="h-[1px] w-full bg-[#a67b27]/30"></div>
                                    <div className="h-[1px] w-full bg-[#a67b27]/30 mb-1"></div>
                                 </div>
                               </div>
                               <Wifi size={24} className="rotate-90 opacity-40 -ml-1" />
                            </div>
                            
                            {/* Merchant Logo */}
                            {card.logoUrl ? (
                              <div className="w-12 h-12 bg-white rounded-lg p-1.5 shadow-md flex-shrink-0">
                                <img src={card.logoUrl} alt={card.name} className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-xl text-white shadow-sm flex-shrink-0 backdrop-blur-sm border border-white/30">
                                {card.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          <div className="relative z-10 flex-1 flex flex-col justify-center mt-2">
                             <div className="font-mono text-[17px] sm:text-xl tracking-[0.25em] opacity-90 drop-shadow-md">
                               •••• •••• •••• {card.id.substring(0, 4).replace(/[^0-9]/g, '8').padEnd(4, '3')}
                             </div>
                          </div>
                          
                          <div className="relative z-10 flex justify-between items-end pt-2">
                            <div>
                              <h4 className="text-sm font-bold tracking-widest uppercase mb-3 text-white/90 drop-shadow-md">{card.name}</h4>
                              <div className="flex items-end gap-5">
                                <div>
                                  <p className="text-[8px] opacity-70 uppercase font-black tracking-widest mb-0.5">Limit/Plafon</p>
                                  <p className="text-sm font-black drop-shadow-sm">{showAmounts ? formatIDR(card.limit) : '••••••••'}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] opacity-70 uppercase font-black tracking-widest mb-0.5">Sisa Limit</p>
                                  <p className="text-sm font-black drop-shadow-sm">{showAmounts ? formatIDR(remaining) : '••••'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-[8px] opacity-70 uppercase font-black tracking-widest mb-0.5">{card.type === DebtType.CREDIT_CARD ? 'CREDIT' : 'DEBT'}</span>
                                <span className="text-xs font-mono font-bold tracking-widest drop-shadow-sm">{card.dueDay ? `**/${card.dueDay.toString().padStart(2, '0')}` : 'N/A'}</span>
                            </div>
                          </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setEditingCard(card); setCardName(card.name); setCardLimit(formatIDR(card.limit)); setCardDue(card.dueDay?.toString() || ''); setCardColor(card.color); setCardType(card.type); setCardEStatementFee(card.eStatementFee ? formatIDR(card.eStatementFee) : ''); setCardLogoUrl(card.logoUrl || ''); pushView('FORM_CARD'); }} className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"><Pencil size={14}/> Edit</button>
                        <button type="button" onClick={() => { if(window.confirm('Hapus item?')) saveData({...data, cards: data.cards.filter(c=>c.id!==card.id)}); }} className="flex-1 py-3 bg-red-50 dark:bg-red-900/10 text-danger rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition"><Trash2 size={14}/> Hapus</button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardLogoUrl(''); pushView('FORM_CARD'); }} className="h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] text-slate-400 dark:text-slate-600 font-bold flex flex-col items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-primary transition-all"><Plus size={32}/><span className="text-sm uppercase tracking-widest">Tambah Item Baru</span></button>
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
               <div className="flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0">
                 <button onClick={() => {
                   if (data.cards.length > 0) {
                     setTransferSourceCardId(data.cards[0].id);
                     setTransferTargetCardId(data.cards[0].id);
                   }
                   setTransferSourceMonth(new Date().getMonth());
                   setTransferSourceYear(new Date().getFullYear());
                   setTransferTargetMonth(new Date().getMonth());
                   setTransferTargetYear(new Date().getFullYear());
                   pushView('FORM_TRANSFER_SAVING');
                 }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-2xl transition font-bold text-sm w-full md:w-auto justify-center">
                   <ArrowRightLeft size={18} /> Transfer Dana
                 </button>
                 <div className="flex items-center justify-between w-full md:w-auto gap-6 bg-white/10 p-4 rounded-2xl">
                   <div className="flex items-center gap-3"><Calendar size={20} className="text-emerald-200"/><span className="text-xl font-black">{savingsSelectedYear}</span></div>
                   <div className="flex gap-2">
                     <button onClick={() => setSavingsSelectedYear(y => y - 1)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"><ChevronLeft size={20}/></button>
                     <button onClick={() => setSavingsSelectedYear(y => y + 1)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"><ChevronRight size={20}/></button>
                   </div>
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

            {savingHistoryModal && (
              <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                  <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight">{savingHistoryModal.title}</h3>
                    <button onClick={() => setSavingHistoryModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-500"><X size={20} /></button>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 no-scrollbar">
                    {savingHistoryModal.items.map(item => {
                      const isBiz = item.owner === OwnerType.BUSINESS;
                      return (
                        <div key={item.id} onClick={() => { setSavingHistoryModal(null); openEditSaving(item); }} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition group border border-transparent hover:border-success/30">
                          <div className="space-y-1 min-w-0 pr-2">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.note}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSavingOwner(item.id);
                                }}
                                title="Klik untuk ubah Personal / Bisnis"
                                className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border transition active:scale-95 ${
                                  isBiz
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25'
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
                                }`}
                              >
                                {isBiz ? 'UANG BISNIS' : 'UANG PERSONAL'}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-sm font-black ${item.amount < 0 ? 'text-danger' : 'text-success'}`}>{formatIDR(item.amount)}</span>
                            <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                    
                    <button 
                      onClick={() => {
                        setEditingSaving(null);
                        setSavingAmount('');
                        setSavingNote('');
                        setSavingOwner(OwnerType.PERSONAL);
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
      case 'PIUTANGS':
        return (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-5 py-4 md:px-8 md:py-8">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[32px] p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between">
               <div className="space-y-2">
                 <p className="text-indigo-100 text-[10px] md:text-xs font-bold uppercase tracking-widest">Total Piutang Tahun {piutangsSelectedYear}</p>
                 <h3 className="text-3xl md:text-5xl font-black">{showAmounts ? formatIDR(totalYearPiutangs) : '••••••••'}</h3>
               </div>
               <div className="flex items-center gap-6 mt-6 md:mt-0 bg-white/10 p-4 rounded-2xl">
                 <div className="flex items-center gap-3"><Calendar size={20} className="text-indigo-200"/><span className="text-xl font-black">{piutangsSelectedYear}</span></div>
                 <div className="flex gap-2">
                   <button onClick={() => setPiutangsSelectedYear(y => y - 1)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"><ChevronLeft size={20}/></button>
                   <button onClick={() => setPiutangsSelectedYear(y => y + 1)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"><ChevronRight size={20}/></button>
                 </div>
               </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {piutangsYearlyData.filter(m => m.totalMonth > 0).map((m, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800 p-6 space-y-4">
                   <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3"><h4 className="font-black text-base text-slate-800 dark:text-slate-100">{m.monthName}</h4><span className="text-sm font-black text-indigo-600">{showAmounts ? formatIDR(m.totalMonth) : '••••'}</span></div>
                   <div className="space-y-2.5">
                     {m.cardGroups.map((group, i) => (
                       <button key={i} onClick={() => setPiutangHistoryModal({ title: `${group.cardName} - ${m.monthName} ${piutangsSelectedYear}`, items: group.items, cardId: group.cardId, month: m.monthIdx, year: piutangsSelectedYear })} className="w-full flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition group">
                         <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${group.cardColor}`}></div><span className="text-sm font-bold text-slate-600 dark:text-slate-300">{group.cardName}</span></div>
                         <div className="flex items-center gap-2"><span className="text-sm font-black text-slate-800 dark:text-slate-100">{showAmounts ? formatIDR(group.amount) : '••'}</span><ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform"/></div>
                       </button>
                     ))}
                   </div>
                </div>
              ))}
            </div>
            {(data.piutangs || []).filter(p => !p.isCollected && p.targetPeriod?.year === piutangsSelectedYear).length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                <HandCoins size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">Belum ada catatan piutang untuk tahun ini.</p>
              </div>
            )}

            {piutangHistoryModal && (
              <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                  <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight">{piutangHistoryModal.title}</h3>
                    <button onClick={() => setPiutangHistoryModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-500"><X size={20} /></button>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 no-scrollbar">
                    {piutangHistoryModal.items.map(item => (
                      <div key={item.id} onClick={() => { setPiutangHistoryModal(null); openEditPiutang(item); }} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition group border border-transparent hover:border-indigo-500/30">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.debtorName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.note}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-indigo-600">{formatIDR(item.amount)}</span>
                          <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {
                        setEditingPiutang(null);
                        setPiutangAmount('');
                        setPiutangDebtor('');
                        setPiutangNote('');
                        setPiutangCardId(piutangHistoryModal.cardId);
                        setPiutangTargetMonth(piutangHistoryModal.month);
                        setPiutangTargetYear(piutangHistoryModal.year);
                        setPiutangHistoryModal(null);
                        pushView('FORM_PIUTANG');
                      }}
                      className="w-full mt-4 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all font-bold text-sm uppercase"
                    >
                      <Plus size={18} /> Tambah Data Piutang
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
          <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6">
            {/* 1. HEADER RINGKASAN TAHUNAN — COMPACT */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 text-slate-800 dark:text-white shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              {/* Header Title & Year Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">ANGGARAN {yearlySelectedYear}</h2>
                    <button 
                      type="button" 
                      onClick={() => setShowAmounts(!showAmounts)} 
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={showAmounts ? "Sembunyikan Nominal" : "Tampilkan Nominal"}
                    >
                      {showAmounts ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Ringkasan total tagihan, pembayaran, kekurangan, dan posisi keuangan tahun {yearlySelectedYear}
                  </p>
                </div>

                {/* Year Switcher < 2025  [2026]  2027 > */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto shrink-0">
                  <button 
                    type="button"
                    onClick={() => setYearlySelectedYear(y => y - 1)} 
                    className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-xs font-extrabold"
                  >
                    <ChevronLeft size={16}/>
                    <span>{yearlySelectedYear - 1}</span>
                  </button>
                  <span className="text-xs font-black px-3.5 py-1.5 bg-primary rounded-xl text-white shadow-sm">
                    {yearlySelectedYear}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setYearlySelectedYear(y => y + 1)} 
                    className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-xs font-extrabold"
                  >
                    <span>{yearlySelectedYear + 1}</span>
                    <ChevronRight size={16}/>
                  </button>
                </div>
              </div>

              {/* 5 Compact Stat Cards (Nominal Tampil Penuh) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* 1. Total Tagihan */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-500/15 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <CreditCard size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tagihan</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearBill) : '••••••••'}
                  </p>
                </div>

                {/* 2. Tabungan */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-purple-500/15 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                      <Vault size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tabungan</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-300 tracking-tight">
                    {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearSavings) : '••••••••'}
                  </p>
                </div>

                {/* 3. Piutang */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-cyan-500/15 rounded-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                      <Receipt size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Piutang</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-cyan-600 dark:text-cyan-300 tracking-tight">
                    {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearPiutangs) : '••••••••'}
                  </p>
                </div>

                {/* 4. Sudah Dibayar */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-500/15 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sudah Dibayar</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearPaid) : '••••••••'}
                  </p>
                </div>

                {/* 5. Kurang */}
                <div className="bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-3.5 sm:p-4 space-y-1.5 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-rose-500/15 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                      <AlertCircle size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider">Kurang</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 tracking-tight">
                    {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearKurang) : '••••••••'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. RINCIAN BULANAN — BESAR & INFORMATIF */}
            <div className="space-y-5 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                    <Calendar size={22} className="text-blue-500"/>
                    RINCIAN BULANAN
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Detail Total Tagihan, Tabungan, Piutang, Sudah Dibayar, dan Kurang setiap bulan & per kartu.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    value={yearlyMonthFilter}
                    onChange={(e) => setYearlyMonthFilter(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  >
                    <option value="ALL">Semua 12 Bulan</option>
                    <option value="HAS_BILL">Hanya Ada Tagihan</option>
                    <option value="UNPAID">Hanya Belum Lunas / Ada Kurang</option>
                  </select>
                </div>
              </div>

              {/* Grid 3 Kolom Desktop / 2 Kolom Tablet / 1 Kolom Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {yearlyBudgetAnalysis.monthlyBreakdown
                  .filter(m => {
                    if (yearlyMonthFilter === 'HAS_BILL') return m.totalMonthBill > 0 || m.totalMonthPaid > 0;
                    if (yearlyMonthFilter === 'UNPAID') return m.totalMonthKurang > 0 || m.totalMonthUnpaid > 0;
                    return true;
                  })
                  .map((m) => {
                    const isLunas = m.status === 'LUNAS';
                    const isSebagian = m.status === 'SEBAGIAN';
                    const isKurang = m.status === 'KURANG';

                    return (
                      <div 
                        key={m.monthIdx}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-5"
                      >
                        <div className="space-y-4">
                          {/* Month Header: Badge + Month Title + Status */}
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0 text-center">
                                <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 leading-none">
                                  {m.monthName.substring(0,3)}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 mt-0.5">{yearlySelectedYear}</span>
                              </div>
                              <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                                {m.monthName} {yearlySelectedYear}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shrink-0 ${
                                isLunas 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' 
                                  : isSebagian 
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' 
                                  : isKurang 
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {m.status === '-' ? 'LUNAS' : m.status}
                              </span>

                              <button 
                                type="button"
                                onClick={() => {
                                  const activeCard = m.cardsInMonth.find(c => c.bill > 0 || c.paid > 0)?.cardObj || data.cards[0];
                                  if (activeCard) openStatement(activeCard, m.monthIdx, yearlySelectedYear);
                                }}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition"
                                title="Lihat Rincian Tagihan"
                              >
                                <ChevronRight size={18} />
                              </button>
                            </div>
                          </div>

                          {/* Ringkasan Bulan (Summary Box: 5 Metrics) */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                            {/* 1. Total Tagihan */}
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Total Tagihan</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                {showAmounts ? formatIDR(m.totalMonthBill) : '••••••••'}
                              </span>
                            </div>

                            {/* 2. Tabungan */}
                            <div className="flex justify-between items-center">
                              <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1.5">
                                <Vault size={13} /> Tabungan
                              </span>
                              <span className="font-extrabold text-purple-600 dark:text-purple-400">
                                {showAmounts ? formatIDR(m.totalMonthSavings) : '••••••••'}
                              </span>
                            </div>

                            {/* 3. Piutang */}
                            <div className="flex justify-between items-center">
                              <span className="text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1.5">
                                <Receipt size={13} /> Piutang
                              </span>
                              <span className="font-extrabold text-cyan-600 dark:text-cyan-400">
                                {showAmounts ? formatIDR(m.totalMonthPiutangs) : '••••••••'}
                              </span>
                            </div>

                            {/* 4. Sudah Dibayar */}
                            <div className="flex justify-between items-center">
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                                <CheckCircle2 size={13} /> Sudah Dibayar
                              </span>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                {showAmounts ? formatIDR(m.totalMonthPaid) : '••••••••'}
                              </span>
                            </div>

                            {/* 5. Kurang */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex justify-between items-center">
                              <div>
                                <span className="font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                  Kurang
                                </span>
                                {m.totalMonthSavings + m.totalMonthPiutangs > 0 && m.totalMonthUnpaid > m.totalMonthKurang && showAmounts && (
                                  <span className="text-[9px] text-slate-400 font-bold block">
                                    Belum dibayar: {formatIDR(m.totalMonthUnpaid)}
                                  </span>
                                )}
                              </div>
                              <span className={`font-black text-base ${
                                m.totalMonthKurang > 0 
                                  ? 'text-rose-600 dark:text-rose-400' 
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {showAmounts ? (m.totalMonthKurang > 0 ? formatIDR(m.totalMonthKurang) : 'Rp 0') : '••••••••'}
                              </span>
                            </div>
                          </div>

                          {/* RINCIAN KARTU */}
                          <div className="space-y-3 pt-1">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                              RINCIAN KARTU ({m.monthName})
                            </p>

                            <div className="space-y-3">
                              {m.cardsInMonth.map((c) => {
                                const cardHasKurang = c.kurang > 0;

                                return (
                                  <div 
                                    key={c.cardId}
                                    onClick={() => c.cardObj && openStatement(c.cardObj, m.monthIdx, yearlySelectedYear)}
                                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer space-y-2.5"
                                  >
                                    {/* Card Header: Dot + Card Name */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${c.cardColor || 'bg-slate-400'}`} />
                                        <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                                          {c.cardName}
                                        </h5>
                                      </div>
                                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase shrink-0 ${
                                        cardHasKurang 
                                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                      }`}>
                                        {cardHasKurang ? 'Ada Kurang' : (c.bill > 0 || c.paid > 0 ? 'Lunas' : 'Nihil')}
                                      </span>
                                    </div>

                                    {/* 5 Baris Terstruktur: Total Tagihan, Tabungan, Piutang, Sudah Dibayar, Kurang */}
                                    <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
                                      {/* 1. Total Tagihan */}
                                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                        <span>Total Tagihan</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                          {showAmounts ? formatIDR(c.bill) : '••••••••'}
                                        </span>
                                      </div>

                                      {/* 2. Tabungan */}
                                      <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                                        <span className="flex items-center gap-1.5"><Vault size={12}/> Tabungan</span>
                                        <span className="font-bold">
                                          {showAmounts ? formatIDR(c.savings) : '••••••••'}
                                        </span>
                                      </div>

                                      {/* 3. Piutang */}
                                      <div className="flex justify-between items-center text-cyan-600 dark:text-cyan-400">
                                        <span className="flex items-center gap-1.5"><Receipt size={12}/> Piutang</span>
                                        <span className="font-bold">
                                          {showAmounts ? formatIDR(c.piutangs) : '••••••••'}
                                        </span>
                                      </div>

                                      {/* 4. Sudah Dibayar */}
                                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                        <span className="flex items-center gap-1.5"><CheckCircle2 size={12}/> Sudah Dibayar</span>
                                        <span className="font-bold">
                                          {showAmounts ? formatIDR(c.paid) : '••••••••'}
                                        </span>
                                      </div>

                                      {/* 5. Kurang */}
                                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                                        <div>
                                          <span className="font-black text-slate-800 dark:text-slate-200 uppercase">
                                            Kurang
                                          </span>
                                          {c.savings + c.piutangs > 0 && c.unpaid > c.kurang && showAmounts && (
                                            <span className="text-[9px] text-slate-400 font-bold block">
                                              Sisa tagihan: {formatIDR(c.unpaid)}
                                            </span>
                                          )}
                                        </div>
                                        <span className={`font-black text-sm ${
                                          cardHasKurang 
                                            ? 'text-rose-600 dark:text-rose-400' 
                                            : 'text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                          {showAmounts ? (cardHasKurang ? formatIDR(c.kurang) : 'Rp 0') : '••••••••'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Badges: Pribadi & Bisnis */}
                                    {showAmounts && (c.personal > 0 || c.business > 0) && (
                                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/40 text-[10px] font-bold">
                                        {c.personal > 0 && (
                                          <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50">
                                            Pribadi: {formatIDR(c.personal)}
                                          </span>
                                        )}
                                        {c.business > 0 && (
                                          <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-900/50">
                                            Bisnis: {formatIDR(c.business)}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );
      case 'OWNER_BILLS':
        return (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-5">
            {/* 1. HEADER RINGKASAN BISNIS & PERSONAL */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 text-slate-800 dark:text-white shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                      Tagihan Bisnis & Personal {ownerBillsYear}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowAmounts(!showAmounts)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={showAmounts ? "Sembunyikan Nominal" : "Tampilkan Nominal"}
                    >
                      {showAmounts ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Rincian pemisahan tagihan Bisnis dan Personal per kartu setiap bulannya
                  </p>
                </div>

                {/* Year Switcher & Filter */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <select
                    value={ownerBillsFilter}
                    onChange={(e) => setOwnerBillsFilter(e.target.value as 'ALL' | 'HAS_BILL')}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua 12 Bulan</option>
                    <option value="HAS_BILL">Hanya Ada Tagihan</option>
                  </select>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                    <button
                      type="button"
                      onClick={() => setOwnerBillsYear(y => y - 1)}
                      className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition text-slate-600 dark:text-slate-300 flex items-center gap-0.5 text-xs font-extrabold cursor-pointer"
                    >
                      <ChevronLeft size={15} />
                      <span>{ownerBillsYear - 1}</span>
                    </button>
                    <span className="text-xs font-black px-3 py-1 bg-primary rounded-xl text-white shadow-xs">
                      {ownerBillsYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOwnerBillsYear(y => y + 1)}
                      className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition text-slate-600 dark:text-slate-300 flex items-center gap-0.5 text-xs font-extrabold cursor-pointer"
                    >
                      <span>{ownerBillsYear + 1}</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Ringkasan Tahunan: Total Bisnis, Total Personal, Total Gabungan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-purple-50/70 dark:bg-purple-950/25 border border-purple-200/70 dark:border-purple-800/40 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                      Sisa Tagihan Bisnis ({ownerBillsYear})
                    </span>
                    <p className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300 tabular-nums mt-0.5">
                      {showAmounts ? formatIDR(ownerBillsAnalysis.yearTotalBusiness) : '••••••••'}
                    </p>
                    {ownerBillsAnalysis.yearTotalSavingBusiness > 0 && showAmounts && (
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Tabungan Bisnis: -{formatIDR(ownerBillsAnalysis.yearTotalSavingBusiness)}
                      </p>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Briefcase size={18} />
                  </div>
                </div>

                <div className="bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/70 dark:border-blue-800/40 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      Sisa Tagihan Personal ({ownerBillsYear})
                    </span>
                    <p className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-300 tabular-nums mt-0.5">
                      {showAmounts ? formatIDR(ownerBillsAnalysis.yearTotalPersonal) : '••••••••'}
                    </p>
                    {ownerBillsAnalysis.yearTotalSavingPersonal > 0 && showAmounts && (
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Tabungan Personal: -{formatIDR(ownerBillsAnalysis.yearTotalSavingPersonal)}
                      </p>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <UserIcon size={18} />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Total Sisa Gabungan ({ownerBillsYear})
                    </span>
                    <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                      {showAmounts ? formatIDR(ownerBillsAnalysis.yearTotalAll) : '••••••••'}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <CreditCard size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. GRID BULANAN: SETIAP BULAN MEMUAT SEKSI BISNIS & PERSONAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ownerBillsAnalysis.monthlyList
                .filter(m => ownerBillsFilter === 'ALL' ? true : (m.totalMonth > 0 || m.totalGrossMonth > 0))
                .map(m => (
                  <div
                    key={m.monthIdx}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                  >
                    {/* Month Title Header (e.g., Juli 2026) */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-200/80 dark:border-slate-700 shrink-0">
                          <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 leading-none">
                            {m.monthName.substring(0, 3)}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 mt-0.5">{m.year}</span>
                        </div>
                        <div>
                          <h4 className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight">
                            {m.monthName} {m.year}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400">
                            Sisa Bulan Ini: {showAmounts ? formatIDR(m.totalMonth) : '••••'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SEKSI 1: BISNIS */}
                    <div className="rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 p-3.5 space-y-2">
                      <div className="flex items-center justify-between border-b border-purple-200/50 dark:border-purple-800/40 pb-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                          <Briefcase size={13} />
                          BISNIS
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSaving(null);
                            setSavingAmount('');
                            setSavingNote('Tabungan Bisnis');
                            setSavingOwner(OwnerType.BUSINESS);
                            if (data.cards.length > 0) setSavingCardId(data.cards[0].id);
                            setSavingTargetMonth(m.monthIdx);
                            setSavingTargetYear(m.year);
                            pushView('FORM_SAVING');
                          }}
                          className="text-[9px] font-black text-purple-600 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus size={10} /> Tabungan Bisnis
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {m.cardsData.map(c => (
                          <div
                            key={`biz_${c.cardId}`}
                            onClick={() => openStatement(c.cardObj, m.monthIdx, m.year)}
                            className="flex items-start justify-between py-1 px-1.5 rounded-lg hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition cursor-pointer gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${c.cardColor}`} />
                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                                  {c.cardName}
                                </span>
                              </div>
                              {c.savingBusiness > 0 && showAmounts && (
                                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 pl-4 mt-0.5">
                                  Tagihan {formatIDR(c.grossBusiness)} − Tabungan {formatIDR(c.savingBusiness)}
                                </p>
                              )}
                            </div>
                            <span className={`font-extrabold tabular-nums whitespace-nowrap ${
                              c.business > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {showAmounts ? formatIDR(c.business) : '••••'}
                            </span>
                          </div>
                        ))}
                        {m.cardsData.length === 0 && (
                          <p className="text-[11px] text-slate-400 italic">Belum ada kartu</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/50 space-y-1">
                        {m.totalSavingBusiness > 0 && showAmounts && (
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span>Pengurang Tabungan Bisnis</span>
                            <span className="tabular-nums">−{formatIDR(m.totalSavingBusiness)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-purple-800 dark:text-purple-300">
                            Total
                          </span>
                          <span className="text-sm font-black text-purple-700 dark:text-purple-300 tabular-nums">
                            {showAmounts ? formatIDR(m.totalBusiness) : '••••'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SEKSI 2: PERSONAL */}
                    <div className="rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 p-3.5 space-y-2">
                      <div className="flex items-center justify-between border-b border-blue-200/50 dark:border-blue-800/40 pb-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <UserIcon size={13} />
                          PERSONAL
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSaving(null);
                            setSavingAmount('');
                            setSavingNote('Tabungan Personal');
                            setSavingOwner(OwnerType.PERSONAL);
                            if (data.cards.length > 0) setSavingCardId(data.cards[0].id);
                            setSavingTargetMonth(m.monthIdx);
                            setSavingTargetYear(m.year);
                            pushView('FORM_SAVING');
                          }}
                          className="text-[9px] font-black text-blue-600 dark:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus size={10} /> Tabungan Personal
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {m.cardsData.map(c => (
                          <div
                            key={`per_${c.cardId}`}
                            onClick={() => openStatement(c.cardObj, m.monthIdx, m.year)}
                            className="flex items-start justify-between py-1 px-1.5 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition cursor-pointer gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${c.cardColor}`} />
                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                                  {c.cardName}
                                </span>
                              </div>
                              {c.savingPersonal > 0 && showAmounts && (
                                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 pl-4 mt-0.5">
                                  Tagihan {formatIDR(c.grossPersonal)} − Tabungan {formatIDR(c.savingPersonal)}
                                </p>
                              )}
                            </div>
                            <span className={`font-extrabold tabular-nums whitespace-nowrap ${
                              c.personal > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {showAmounts ? formatIDR(c.personal) : '••••'}
                            </span>
                          </div>
                        ))}
                        {m.cardsData.length === 0 && (
                          <p className="text-[11px] text-slate-400 italic">Belum ada kartu</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/50 space-y-1">
                        {m.totalSavingPersonal > 0 && showAmounts && (
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span>Pengurang Tabungan Personal</span>
                            <span className="tabular-nums">−{formatIDR(m.totalSavingPersonal)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                            Total
                          </span>
                          <span className="text-sm font-black text-blue-700 dark:text-blue-300 tabular-nums">
                            {showAmounts ? formatIDR(m.totalPersonal) : '••••'}
                          </span>
                        </div>
                      </div>
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
          <div className="animate-in slide-in-from-right duration-300 max-w-xl mx-auto w-full px-3 py-2.5 md:px-5 md:py-6">
             <form onSubmit={handleSaveCard} className="space-y-3 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-50 dark:border-slate-800">
               <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl"><button type="button" onClick={()=>setCardType(DebtType.CREDIT_CARD)} className={`py-2 text-xs font-black rounded-lg transition-all ${cardType === DebtType.CREDIT_CARD ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-blue-400' : 'text-slate-500'}`}>KARTU KREDIT</button><button type="button" onClick={()=>setCardType(DebtType.OTHER_DEBT)} className={`py-2 text-xs font-black rounded-lg transition-all ${cardType === DebtType.OTHER_DEBT ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-blue-400' : 'text-slate-500'}`}>HUTANG LAIN</button></div>
               <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 block">Label Identitas</label><input type="text" value={cardName} onChange={(e)=>setCardName(e.target.value)} required placeholder="Contoh: Platinum Card" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl outline-none border border-transparent focus:border-primary transition font-bold text-sm" /></div>
               <div className="grid grid-cols-2 gap-2.5"><div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Limit / Plafon</label><input type="text" inputMode="numeric" value={cardLimit} onChange={(e)=>handleCurrencyInput(e.target.value, setCardLimit)} required placeholder="Rp 0" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl font-black text-xs sm:text-sm outline-none border border-transparent focus:border-primary" /></div><div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Tgl Jatuh Tempo</label><input type="number" min="1" max="31" value={cardDue} onChange={(e)=>setCardDue(e.target.value)} placeholder="Misal: 15" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs sm:text-sm outline-none border border-transparent focus:border-primary" /></div></div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 block">Logo Kartu / Merchant (Opsional)</label>
                 <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                   {cardLogoUrl ? (
                     <div className="relative">
                       <img src={cardLogoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-cover bg-white p-1 shadow-sm" />
                       <button type="button" onClick={() => setCardLogoUrl('')} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"><X size={10}/></button>
                     </div>
                   ) : (
                     <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 shadow-inner">
                       <Image size={16} />
                     </div>
                   )}
                   <div className="flex-1">
                     <label className="cursor-pointer bg-white dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors inline-block">
                       Pilih Gambar...
                       <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                     </label>
                   </div>
                 </div>
               </div>
               <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Warna Kartu</label><div className="flex gap-2.5 flex-wrap pt-1">{CARD_COLORS.map(c => (<button key={c.value} type="button" onClick={() => setCardColor(c.value)} className={`w-8 h-8 rounded-full ${c.value} ${cardColor === c.value ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-900' : 'hover:scale-110'} transition-all`}></button>))}</div></div>
               <div className="pt-2"><button type="submit" className="w-full py-3 bg-primary text-white font-black text-sm rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Simpan Konfigurasi</button></div>
             </form>
          </div>
        );
      case 'FORM_TRANSACTION':
        const currentBillEstimate = getMonthlyBill(txCardId, txTargetMonth, txTargetYear);
        const totalImpact = Math.ceil(getNumericValue(txAmount) + (txUseSavings ? availableSavingsForPeriod : 0));
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
        
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-xl mx-auto w-full px-3 py-1.5 md:px-5 md:py-5">
             <form onSubmit={handleSaveTransaction} className="space-y-2 bg-white dark:bg-slate-900 p-3.5 md:p-6 rounded-3xl shadow-xl border border-slate-50 dark:border-slate-800 overflow-hidden">
               {/* TYPE TOGGLE */}
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                 <button type="button" onClick={()=>setTxType(TransactionType.EXPENSE)} className={`flex-1 py-1.5 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all ${txType === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-danger shadow-sm' : 'text-slate-500'}`}><ArrowUpCircle size={15}/> PAKAI</button>
                 <button type="button" onClick={()=>setTxType(TransactionType.PAYMENT)} className={`flex-1 py-1.5 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all ${txType === TransactionType.PAYMENT ? 'bg-white dark:bg-slate-700 text-success shadow-sm' : 'text-slate-500'}`}><ArrowDownCircle size={15}/> BAYAR</button>
               </div>

               {/* CARD SELECT (Pilihan Sumber Dana Langsung Terlihat) */}
               <div className="space-y-1">
                 <div className="flex justify-between items-center px-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sumber Dana / Kartu</label>
                   <span className="text-[9px] font-bold text-slate-400">{data.cards.length} Sumber</span>
                 </div>
                 <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                   {data.cards.map(c => {
                     const isSelected = c.id === txCardId;
                     return (
                       <button
                         key={c.id}
                         type="button"
                         onClick={() => setTxCardId(c.id)}
                         className={`shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                           isSelected
                             ? 'bg-primary text-white border-primary shadow-sm'
                             : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:border-primary/40'
                         }`}
                       >
                         <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : (c.color || 'bg-slate-500')}`} />
                         <span className="text-xs font-bold whitespace-nowrap">{c.name}</span>
                         {isSelected && <Check size={12} className="text-white shrink-0" />}
                       </button>
                     );
                   })}
                 </div>
               </div>

               {/* PAYMENT SPECIFIC FIELDS */}
               {txType === TransactionType.PAYMENT && (
                 <div className="space-y-2 animate-in slide-in-from-top duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Bulan Tagihan</label>
                        <select value={txTargetMonth} onChange={(e)=>setTxTargetMonth(parseInt(e.target.value))} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold border border-transparent focus:border-success outline-none">
                          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Tahun</label>
                        <input type="number" value={txTargetYear} onChange={(e)=>setTxTargetYear(parseInt(e.target.value))} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold border border-transparent focus:border-success outline-none"/>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5">
                       <div className="flex justify-between items-center px-1">
                          <div className="flex items-center gap-1.5"><Info size={12} className="text-slate-400"/><span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Status Tagihan</span></div>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">{formatIDR(currentBillEstimate)}</span>
                       </div>
                       
                       <div onClick={() => setTxUseSavings(!txUseSavings)} className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${txUseSavings ? 'bg-success/10 border-success/30 border' : 'bg-white dark:bg-slate-800 border border-transparent'}`}>
                          <div className="flex items-center gap-2">
                             <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${txUseSavings ? 'bg-success text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}><Vault size={14}/></div>
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Tabungan Tersedia</span>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">{formatIDR(availableSavingsForPeriod)}</span>
                             </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${txUseSavings ? 'bg-success border-success' : 'border-slate-300'}`}>
                             {txUseSavings && <CheckCircle2 size={11} className="text-white"/>}
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {/* EXPENSE SPECIFIC: INSTALLMENT OPTION */}
               {txType === TransactionType.EXPENSE && (
                 <div className="space-y-1.5 animate-in slide-in-from-top duration-200">
                    <div onClick={() => setTxIsInstallment(!txIsInstallment)} className={`flex items-center justify-between px-3 py-1.5 rounded-xl cursor-pointer transition-all border ${txIsInstallment ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 border-transparent'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${txIsInstallment ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                          <Zap size={14} />
                        </div>
                        <div>
                          <p className={`text-[11px] font-black uppercase tracking-tight leading-tight ${txIsInstallment ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}>Konversi ke Cicilan</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">Pecah Tagihan Jadi Ringan</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${txIsInstallment ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {txIsInstallment && <CheckCircle2 size={11} className="text-white"/>}
                      </div>
                    </div>

                    {txIsInstallment && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-2.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-2 animate-in zoom-in-95 duration-200">
                        <div className="space-y-1">
                           <div className="flex justify-between items-center px-1">
                             <label className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Durasi Cicilan (Bulan)</label>
                             <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">{txInstallmentMonths}x</span>
                           </div>
                           <input 
                            type="range" 
                            min="2" 
                            max="60" 
                            value={txInstallmentMonths} 
                            onChange={(e) => setTxInstallmentMonths(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                           />
                           <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase px-1">
                             <span>2x</span>
                             <span>12x</span>
                             <span>24x</span>
                             <span>36x</span>
                             <span>48x</span>
                             <span>60x</span>
                           </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl shadow-xs flex justify-between items-center border border-indigo-50 dark:border-indigo-800">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Angsuran / Bln</span>
                            <span className="text-xs font-black text-indigo-600">{formatIDR(Math.ceil(getNumericValue(txAmount) / (txInstallmentMonths || 1)))}</span>
                          </div>
                          <div className="text-right">
                             <span className="text-[8px] font-black text-slate-400 uppercase block">Periode</span>
                             <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Mulai {monthNames[new Date(txDate).getMonth()]} {new Date(txDate).getFullYear()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
               )}

               {/* MAIN AMOUNT INPUT */}
               <div className="space-y-0.5 text-center">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                    {txType === TransactionType.EXPENSE ? 'Nominal Pemakaian' : 'Nominal Bayar Tunai'}
                 </label>
                 <input 
                   type="text" 
                   inputMode="numeric"
                   value={txAmount} 
                   onChange={(e)=>handleCurrencyInput(e.target.value, setTxAmount)} 
                   required 
                   placeholder="Rp 0" 
                   className={`w-full ${txAmount.length > 14 ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-black py-1 px-2 border-b-2 outline-none bg-transparent text-slate-800 dark:text-slate-100 text-center transition-colors ${txType === TransactionType.EXPENSE ? 'border-red-200 dark:border-red-900/50 focus:border-danger' : 'border-green-200 dark:border-green-900/50 focus:border-success'}`} 
                 />
                 
                 {txType === TransactionType.PAYMENT && txUseSavings && availableSavingsForPeriod > 0 && (
                   <div className="pt-0.5 flex items-center justify-center gap-2 animate-in zoom-in duration-200">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Pengurangan:</span>
                      <span className="text-xs font-black text-success">{formatIDR(totalImpact)}</span>
                   </div>
                 )}
               </div>

               {txType === TransactionType.EXPENSE && (
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-center block">Kepemilikan Transaksi</label>
                   <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                     <button type="button" onClick={() => setTxOwner(OwnerType.PERSONAL)} className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${txOwner === OwnerType.PERSONAL ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Pribadi</button>
                     <button type="button" onClick={() => setTxOwner(OwnerType.BUSINESS)} className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${txOwner === OwnerType.BUSINESS ? 'bg-white dark:bg-slate-700 shadow-xs text-purple-600 dark:text-purple-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Bisnis</button>
                     <button type="button" onClick={() => setTxOwner(OwnerType.SPLIT)} className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${txOwner === OwnerType.SPLIT ? 'bg-white dark:bg-slate-700 shadow-xs text-orange-600 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Split</button>
                   </div>
                   {txOwner === OwnerType.SPLIT && (
                     <div className="grid grid-cols-2 gap-2 pt-1 animate-in slide-in-from-top-1">
                       <div className="space-y-1">
                         <label className="text-[9px] font-black text-blue-500 uppercase ml-1 block">Pribadi</label>
                         <input type="text" inputMode="numeric" value={txSplitPersonal} onChange={(e) => {
                             handleCurrencyInput(e.target.value, setTxSplitPersonal);
                             const personalVal = getNumericValue(e.target.value);
                             const amountVal = getNumericValue(txAmount);
                             setTxSplitBusiness(formatIDR(Math.max(0, amountVal - personalVal)));
                           }} required placeholder="Rp 0" className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl border border-transparent focus:border-blue-400 outline-none transition font-bold text-xs text-center" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[9px] font-black text-purple-500 uppercase ml-1 block">Bisnis</label>
                         <input type="text" inputMode="numeric" value={txSplitBusiness} onChange={(e) => {
                             handleCurrencyInput(e.target.value, setTxSplitBusiness);
                             const businessVal = getNumericValue(e.target.value);
                             const amountVal = getNumericValue(txAmount);
                             setTxSplitPersonal(formatIDR(Math.max(0, amountVal - businessVal)));
                           }} required placeholder="Rp 0" className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl border border-transparent focus:border-purple-400 outline-none transition font-bold text-xs text-center" />
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {/* 1. TANGGAL TRANSAKSI (Di atas Keterangan) */}
               <div className="space-y-1">
                 <div className="flex justify-between items-center px-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tanggal Transaksi</label>
                   <div className="flex items-center gap-1">
                     <button
                       type="button"
                       onClick={() => setTxDate(todayStr)}
                       className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition ${txDate === todayStr ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                     >
                       Hari Ini
                     </button>
                     <button
                       type="button"
                       onClick={() => setTxDate(yesterdayStr)}
                       className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition ${txDate === yesterdayStr ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                     >
                       Kemarin
                     </button>
                   </div>
                 </div>
                 <input 
                   type="date" 
                   value={txDate} 
                   onChange={(e)=>setTxDate(e.target.value)} 
                   className="block w-full min-w-0 max-w-full box-border px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl border border-transparent focus:border-primary outline-none transition font-bold text-xs sm:text-sm"
                 />
               </div>

               {/* 2. KETERANGAN (Di bawah Tanggal Transaksi) */}
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Keterangan</label>
                 <input 
                   type="text" 
                   value={txDesc} 
                   onChange={(e)=>setTxDesc(e.target.value)} 
                   placeholder={txType === TransactionType.EXPENSE ? "Beli apa? (cth: Makan Siang, Belanja)" : "Bayar via apa?"} 
                   className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl border border-transparent focus:border-primary outline-none transition font-bold text-xs sm:text-sm" 
                 />

                 {/* 3. DAFTAR SUGESTI (Sering / Terakhir Diinput di bawah Keterangan) */}
                 {descriptionSuggestions.length > 0 && (
                   <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5">
                     {descriptionSuggestions.map((sug, idx) => {
                       const isActive = txDesc.trim().toLowerCase() === sug.toLowerCase();
                       return (
                         <button
                           key={idx}
                           type="button"
                           onClick={() => setTxDesc(sug)}
                           className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 cursor-pointer ${
                             isActive
                               ? 'bg-primary text-white border-primary shadow-xs'
                               : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:border-primary/40'
                           }`}
                         >
                           {sug}
                         </button>
                       );
                     })}
                   </div>
                 )}
               </div>

               {/* ACTION BUTTONS */}
               <div className="space-y-1.5 pt-1">
                 <button type="submit" className={`w-full py-2.5 text-white font-black text-sm rounded-2xl shadow-lg active:scale-95 transition-all ${txType === TransactionType.EXPENSE ? 'bg-danger hover:bg-red-600' : 'bg-success hover:bg-emerald-600'}`}>
                    {editingTransaction ? 'Simpan Perubahan' : (txType === TransactionType.EXPENSE ? (txIsInstallment ? 'Proses Cicilan Baru' : 'Catat Pengeluaran') : 'Konfirmasi Pembayaran')}
                 </button>
                 {editingTransaction && (
                   <button type="button" onClick={() => handleDeleteTransaction(editingTransaction.id)} className="w-full py-2 bg-red-50 dark:bg-red-900/10 text-danger text-xs font-bold rounded-xl hover:bg-red-100 transition">Hapus Transaksi Ini</button>
                 )}
               </div>
             </form>
          </div>
        );
      case 'FORM_SAVING':
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-xl mx-auto w-full px-3 py-2.5 md:px-5 md:py-6">
             <form onSubmit={handleSaveSaving} className="space-y-3 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-50 dark:border-slate-800">
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Alokasi Sumber Dana / Kartu</label>
                 <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                   {data.cards.map(c => {
                     const isSelected = c.id === savingCardId;
                     return (
                       <button
                         key={c.id}
                         type="button"
                         onClick={() => setSavingCardId(c.id)}
                         className={`shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                           isSelected
                             ? 'bg-success text-white border-success shadow-sm'
                             : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700'
                         }`}
                       >
                         <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : (c.color || 'bg-slate-500')}`} />
                         <span className="text-xs font-bold whitespace-nowrap">{c.name}</span>
                         {isSelected && <Check size={12} className="text-white shrink-0" />}
                       </button>
                     );
                   })}
                 </div>
               </div>

               {/* PILIHAN UANG PERSONAL ATAU UANG BISNIS */}
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Jenis Dana Tabungan (Pengurang Menu Bisnis)</label>
                 <div className="grid grid-cols-2 gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700/60">
                   <button
                     type="button"
                     onClick={() => setSavingOwner(OwnerType.PERSONAL)}
                     className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                       savingOwner === OwnerType.PERSONAL
                         ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                         : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                     }`}
                   >
                     <UserIcon size={13} />
                     <span>Uang Personal</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setSavingOwner(OwnerType.BUSINESS)}
                     className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                       savingOwner === OwnerType.BUSINESS
                         ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                         : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                     }`}
                   >
                     <Briefcase size={13} />
                     <span>Uang Bisnis</span>
                   </button>
                 </div>
               </div>

               <div className="space-y-1 text-center py-1"><label className="text-[9px] font-black text-slate-400 uppercase block">Dana Disisihkan</label><input type="text" inputMode="numeric" value={savingAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setSavingAmount)} required placeholder="Rp 0" className="w-full text-xl sm:text-2xl font-black py-1.5 px-2 border-b-2 border-slate-100 dark:border-slate-800 outline-none focus:border-success bg-transparent text-slate-800 dark:text-slate-100 text-center" /></div>
               <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Target Periode Tagihan</label><div className="grid grid-cols-2 gap-2.5"><select value={savingTargetMonth} onChange={(e)=>setSavingTargetMonth(parseInt(e.target.value))} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-bold">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={savingTargetYear} onChange={(e)=>setSavingTargetYear(parseInt(e.target.value))} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-bold"/></div></div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Catatan Tabungan (Opsional)</label>
                 <input
                   type="text"
                   value={savingNote}
                   onChange={(e) => setSavingNote(e.target.value)}
                   placeholder={savingOwner === OwnerType.BUSINESS ? 'Misal: Tabungan Bisnis' : 'Misal: Tabungan Personal'}
                   className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-bold outline-none border border-slate-200/70 dark:border-slate-700"
                 />
               </div>
               <div className="pt-2"><button type="submit" className="w-full py-3 bg-success text-white font-black text-sm rounded-2xl shadow-lg hover:bg-emerald-600 active:scale-95 transition-all">Amankan Dana Pelunasan</button>{editingSaving && (<button type="button" onClick={() => handleDeleteSaving(editingSaving.id)} className="w-full mt-2 py-2.5 bg-red-50 dark:bg-red-900/10 text-danger text-xs font-bold rounded-xl transition">Hapus Tabungan</button>)}</div>
             </form>
          </div>
        );
      case 'FORM_TRANSFER_SAVING':
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-xl mx-auto w-full px-3 py-2.5 md:px-5 md:py-6">
             <form onSubmit={handleSaveTransfer} className="space-y-3 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-50 dark:border-slate-800">
               <div className="text-center space-y-1">
                 <div className="w-10 h-10 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-1">
                   <ArrowRightLeft size={20} />
                 </div>
                 <h2 className="text-base font-black text-slate-800 dark:text-slate-100">Transfer Dana Tabungan</h2>
                 <p className="text-[11px] text-slate-500 font-medium">Pindahkan dana antar tabungan</p>
               </div>
               
               <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sumber Dana</h4>
                 <div className="space-y-2">
                   <select value={transferSourceCardId} onChange={(e)=>setTransferSourceCardId(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700">{data.cards.map(c => <option key={`src_${c.id}`} value={c.id}>{c.name}</option>)}</select>
                   <div className="grid grid-cols-2 gap-2">
                     <select value={transferSourceMonth} onChange={(e)=>setTransferSourceMonth(parseInt(e.target.value))} className="px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700">{monthNames.map((m, i) => <option key={`src_m_${i}`} value={i}>{m}</option>)}</select>
                     <input type="number" value={transferSourceYear} onChange={(e)=>setTransferSourceYear(parseInt(e.target.value))} className="px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700"/>
                   </div>
                 </div>
               </div>

               <div className="flex justify-center -my-4 relative z-10">
                 <div className="w-8 h-8 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 shadow-xs">
                   <ArrowDown size={14} />
                 </div>
               </div>

               <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tujuan Transfer</h4>
                 <div className="space-y-2">
                   <select value={transferTargetCardId} onChange={(e)=>setTransferTargetCardId(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700">{data.cards.map(c => <option key={`tgt_${c.id}`} value={c.id}>{c.name}</option>)}</select>
                   <div className="grid grid-cols-2 gap-2">
                     <select value={transferTargetMonth} onChange={(e)=>setTransferTargetMonth(parseInt(e.target.value))} className="px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700">{monthNames.map((m, i) => <option key={`tgt_m_${i}`} value={i}>{m}</option>)}</select>
                     <input type="number" value={transferTargetYear} onChange={(e)=>setTransferTargetYear(parseInt(e.target.value))} className="px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700"/>
                   </div>
                 </div>
               </div>

               <div className="space-y-1 text-center pt-1"><label className="text-[9px] font-black text-slate-400 uppercase block">Nominal Transfer</label><input type="text" inputMode="numeric" value={transferAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setTransferAmount)} required placeholder="Rp 0" className="w-full text-xl sm:text-2xl font-black py-1.5 px-2 border-b-2 border-slate-100 dark:border-slate-800 outline-none focus:border-success bg-transparent text-slate-800 dark:text-slate-100 text-center" /></div>
               
               <div className="pt-2"><button type="submit" className="w-full py-3 bg-success text-white font-black text-sm rounded-2xl shadow-lg hover:bg-emerald-600 active:scale-95 transition-all">Proses Transfer</button></div>
             </form>
          </div>
        );
      case 'FORM_PIUTANG':
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-xl mx-auto w-full px-3 py-2.5 md:px-5 md:py-6">
             <form onSubmit={handleSavePiutang} className="space-y-3 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-50 dark:border-slate-800">
               <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Piutang Dari Siapa?</label><input type="text" value={piutangDebtor} onChange={(e)=>setPiutangDebtor(e.target.value)} required placeholder="Contoh: Andi" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl outline-none font-bold text-xs sm:text-sm" /></div>
               <div className="space-y-1 text-center py-1"><label className="text-[9px] font-black text-slate-400 uppercase block">Nominal Piutang</label><input type="text" inputMode="numeric" value={piutangAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setPiutangAmount)} required placeholder="Rp 0" className="w-full text-xl sm:text-2xl font-black py-1.5 px-2 border-b-2 border-slate-100 dark:border-slate-800 outline-none focus:border-indigo-600 bg-transparent text-slate-800 dark:text-slate-100 text-center" /></div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Alokasi Untuk Hutang</label>
                 <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                   {data.cards.map(c => {
                     const isSelected = c.id === piutangCardId;
                     return (
                       <button
                         key={c.id}
                         type="button"
                         onClick={() => setPiutangCardId(c.id)}
                         className={`shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                           isSelected
                             ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                             : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700'
                         }`}
                       >
                         <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : (c.color || 'bg-slate-500')}`} />
                         <span className="text-xs font-bold whitespace-nowrap">{c.name}</span>
                         {isSelected && <Check size={12} className="text-white shrink-0" />}
                       </button>
                     );
                   })}
                 </div>
               </div>
               {!editingPiutang && (
                 <div className="space-y-2">
                   <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 rounded-xl cursor-pointer" onClick={() => setPiutangIsInstallment(!piutangIsInstallment)}>
                     <div className={`w-5 h-5 rounded-md flex items-center justify-center ${piutangIsInstallment ? 'bg-indigo-600' : 'border-2 border-slate-300 dark:border-slate-600'}`}>
                       {piutangIsInstallment && <Check size={13} className="text-white" />}
                     </div>
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Jadikan Cicilan Bulanan</span>
                   </div>
                   {piutangIsInstallment && (
                     <div className="space-y-1 animate-in slide-in-from-top duration-200">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Berapa Bulan (Tenor)?</label>
                       <input type="number" min="2" max="60" value={piutangInstallmentMonths} onChange={(e)=>setPiutangInstallmentMonths(parseInt(e.target.value))} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-indigo-600 border border-transparent" />
                       {piutangInstallmentMonths > 1 && getNumericValue(piutangAmount) > 0 && (
                          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 pl-1">Tagihan per bulan: {formatIDR(getNumericValue(piutangAmount) / piutangInstallmentMonths)}</p>
                       )}
                     </div>
                   )}
                 </div>
               )}
               <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Target Periode Tagihan {piutangIsInstallment ? 'Pertama' : ''}</label><div className="grid grid-cols-2 gap-2.5"><select value={piutangTargetMonth} onChange={(e)=>setPiutangTargetMonth(parseInt(e.target.value))} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-bold">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={piutangTargetYear} onChange={(e)=>setPiutangTargetYear(parseInt(e.target.value))} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-bold"/></div></div>
               <div className="pt-2"><button type="submit" className="w-full py-3 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">Simpan Catatan Piutang</button>{editingPiutang && (<button type="button" onClick={() => handleDeletePiutang(editingPiutang.id)} className="w-full mt-2 py-2.5 bg-red-50 dark:bg-red-900/10 text-danger text-xs font-bold rounded-xl transition">Hapus Piutang</button>)}</div>
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
        const isReconciled = s.totalValidated === s.totalBill && s.totalBill > 0;
        const reconcilePercent = s.totalBill > 0 ? Math.min(100, Math.round((s.totalValidated / s.totalBill) * 100)) : 0;
        const totalInstallmentsAmount = Math.ceil(s.installments.reduce((sum, i) => sum + i.monthlyAmount, 0));
        const totalTransactionsAmount = Math.ceil(s.transactions.reduce((sum, t) => sum + t.amount, 0));

        const handlePrevStatementMonth = () => {
          if (statementMonth === 0) {
            setStatementMonth(11);
            setStatementYear(y => y - 1);
          } else {
            setStatementMonth(m => m - 1);
          }
        };

        const handleNextStatementMonth = () => {
          if (statementMonth === 11) {
            setStatementMonth(0);
            setStatementYear(y => y + 1);
          } else {
            setStatementMonth(m => m + 1);
          }
        };
        
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-4xl mx-auto w-full px-3.5 py-3 md:px-6 md:py-6 space-y-3.5 pb-24">
            
            {/* 1. TOP BAR: CARD SWITCHER & PERIOD SELECTOR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {data.cards.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {data.cards.map(c => {
                    const isSelected = c.id === activeStatementCard.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveStatementCard(c)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.color || 'bg-slate-500'}`} />
                        <span className="whitespace-nowrap">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sleek Period Navigator */}
              <div className="flex items-center justify-between sm:justify-end gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0">
                <button
                  type="button"
                  onClick={handlePrevStatementMonth}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1 px-1">
                  <select
                    value={statementMonth}
                    onChange={(e) => setStatementMonth(parseInt(e.target.value))}
                    className="text-xs font-extrabold bg-transparent text-slate-800 dark:text-slate-100 py-1 px-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    {monthNames.map((m, i) => (
                      <option key={i} value={i} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={statementYear}
                    onChange={(e) => setStatementYear(parseInt(e.target.value))}
                    className="w-16 text-xs font-extrabold bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-1 px-2 rounded-lg text-center outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleNextStatementMonth}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 2. UNIFIED BANKING E-STATEMENT CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md overflow-hidden">
              
              {/* Hero Header Banner */}
              <div className="relative p-4 sm:p-6 text-white overflow-hidden">
                <div className={`absolute inset-0 ${activeStatementCard.color || 'bg-slate-800'}`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/35 pointer-events-none" />
                <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none">
                  <Receipt size={140} />
                </div>

                <div className="relative z-10 space-y-4">
                  {/* Top Row: Card Identity & Status Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {activeStatementCard.logoUrl ? (
                        <div className="w-10 h-10 bg-white rounded-xl p-1.5 shadow-sm shrink-0">
                          <img src={activeStatementCard.logoUrl} alt={activeStatementCard.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-sm shrink-0 backdrop-blur-sm border border-white/25">
                          {activeStatementCard.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-widest font-extrabold text-white/80">
                            {activeStatementCard.type === DebtType.CREDIT_CARD ? 'Bank e-Statement' : 'Pinjaman'}
                          </span>
                          {activeStatementCard.dueDay && (
                            <span className="text-[9px] font-bold text-white/75 bg-black/20 px-1.5 py-0.5 rounded">
                              Jatuh Tempo Tgl {activeStatementCard.dueDay}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg sm:text-xl font-black tracking-tight truncate drop-shadow-xs">
                          {activeStatementCard.name}
                        </h4>
                      </div>
                    </div>

                    <span className={`shrink-0 whitespace-nowrap text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border backdrop-blur-md ${
                      s.totalKurang === 0
                        ? 'bg-emerald-500/25 text-emerald-100 border-emerald-300/40'
                        : 'bg-rose-500/30 text-rose-100 border-rose-300/40'
                    }`}>
                      {s.totalKurang === 0 ? '✓ Lunas / Cukup' : 'Ada Kurang'}
                    </span>
                  </div>

                  {/* Main Statement Figures: Total Tagihan & Kekurangan */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15 items-end">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/75">
                        Total Tagihan ({monthNames[statementMonth].substring(0, 3)} {statementYear})
                      </p>
                      <p className="text-xl sm:text-2xl font-black tracking-tight tabular-nums mt-0.5">
                        {showAmounts ? formatIDR(s.totalBill) : '••••••••'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/75">
                        Kurang Dana
                      </p>
                      <p className={`text-lg sm:text-xl font-black tracking-tight tabular-nums mt-0.5 ${
                        s.totalKurang > 0 ? 'text-rose-200' : 'text-emerald-200'
                      }`}>
                        {showAmounts ? (s.totalKurang > 0 ? formatIDR(s.totalKurang) : 'Rp 0') : '••••••••'}
                      </p>
                      {s.totalSavingsAmount + s.totalPiutangsAmount > 0 && s.totalUnpaid > s.totalKurang && showAmounts && (
                        <p className="text-[9px] font-bold text-white/75">
                          Belum setor: {formatIDR(s.totalUnpaid)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Posisi Dana Grid: Tabungan, Piutang, Sudah Dibayar */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="p-3 text-center sm:text-left sm:px-4">
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    <Vault size={12} className="shrink-0" />
                    <span>Tabungan</span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5 truncate">
                    {showAmounts ? formatIDR(s.totalSavingsAmount) : '••••'}
                  </p>
                </div>

                <div className="p-3 text-center sm:text-left sm:px-4">
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                    <Receipt size={12} className="shrink-0" />
                    <span>Piutang</span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5 truncate">
                    {showAmounts ? formatIDR(s.totalPiutangsAmount) : '••••'}
                  </p>
                </div>

                <div className="p-3 text-center sm:text-left sm:px-4">
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Dibayar</span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5 truncate">
                    {showAmounts ? formatIDR(s.totalPaid) : '••••'}
                  </p>
                </div>
              </div>

              {/* Breakdown Biaya Strip */}
              <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <Briefcase size={12} className="text-slate-400" />
                  <span>Breakdown Biaya</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>e-Statement: <strong className="text-slate-700 dark:text-slate-200">{showAmounts ? formatIDR(s.adminFee) : '••'}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>Materai: <strong className="text-slate-700 dark:text-slate-200">{showAmounts ? formatIDR(s.materai) : '••'}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-800 dark:text-slate-100 font-black">Total: {showAmounts ? formatIDR(s.adminFee + s.materai) : '••'}</span>
                </div>
              </div>

              {/* Integrated Banking Quick Actions */}
              <div className="p-2.5 bg-slate-50/80 dark:bg-slate-900/90 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTransaction(null);
                    setTxAmount('');
                    setTxDesc('');
                    setTxType(TransactionType.EXPENSE);
                    setTxCardId(activeStatementCard.id);
                    setTxDate(new Date(statementYear, statementMonth, 1).toISOString().split('T')[0]);
                    setTxIsInstallment(false);
                    pushView('FORM_TRANSACTION');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-2xs active:scale-95 transition hover:border-danger cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-red-500/10 text-danger flex items-center justify-center shrink-0">
                    <Plus size={13} />
                  </div>
                  <span>Catat</span>
                </button>

                <button
                  type="button"
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
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-2xs active:scale-95 transition hover:border-success cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-success flex items-center justify-center shrink-0">
                    <ArrowDownCircle size={13} />
                  </div>
                  <span>Bayar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingSaving(null);
                    setSavingAmount('');
                    setSavingNote('');
                    setSavingOwner(OwnerType.PERSONAL);
                    setSavingCardId(activeStatementCard.id);
                    setSavingTargetMonth(statementMonth);
                    setSavingTargetYear(statementYear);
                    pushView('FORM_SAVING');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-2xs active:scale-95 transition hover:border-indigo-500 cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <Vault size={13} />
                  </div>
                  <span>Nabung</span>
                </button>
              </div>
            </div>

            {/* 3. COMPACT REKONSILIASI (CEKLIST) WIDGET */}
            <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isReconciled ? 'bg-emerald-500/15 text-emerald-500' : 'bg-primary/15 text-primary'}`}>
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block leading-none">
                      Rekonsiliasi Mutasi Bank
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 block mt-0.5 truncate">
                      {isReconciled
                        ? 'Cocok 100% dengan lembar tagihan bank'
                        : `Selisih ${formatIDR(Math.abs(s.totalBill - s.totalValidated))} • Ceklist rincian di bawah`}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs sm:text-sm font-black tabular-nums ${isReconciled ? 'text-emerald-500' : 'text-primary'}`}>
                    {showAmounts ? formatIDR(s.totalValidated) : '••••'}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400 block leading-none">
                    {reconcilePercent}% Tervalidasi
                  </span>
                </div>
              </div>

              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${isReconciled ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: `${reconcilePercent}%` }}
                />
              </div>
            </div>

            {/* 4. TAGIHAN CICILAN BERJALAN (BANK LEDGER LIST) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h5 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarClock size={14} className="text-indigo-500" />
                  <span>Tagihan Cicilan Berjalan</span>
                  <span className="text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-extrabold">
                    {s.installments.length}
                  </span>
                </h5>
                {s.installments.length > 0 && (
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 tabular-nums">
                    {showAmounts ? formatIDR(totalInstallmentsAmount) : '••••'}
                  </span>
                )}
              </div>

              {s.installments.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
                  {s.installments.map(inst => (
                    <div
                      key={inst.id}
                      className="px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          inst.isValidated ? 'bg-primary/15 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <CalendarRange size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase truncate leading-tight">
                            {inst.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="whitespace-nowrap text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-extrabold uppercase">
                              Tenor {inst.currentTenor}/{inst.totalMonths}
                            </span>
                            {!inst.owner ? (
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => updateInstallmentOwner(inst.id, OwnerType.PERSONAL)} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[9px] font-bold hover:bg-blue-500/20 whitespace-nowrap">PRIBADI</button>
                                <button type="button" onClick={() => updateInstallmentOwner(inst.id, OwnerType.BUSINESS)} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded text-[9px] font-bold hover:bg-purple-500/20 whitespace-nowrap">BISNIS</button>
                              </div>
                            ) : (
                              <span className={`whitespace-nowrap text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                inst.owner === OwnerType.PERSONAL
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : inst.owner === OwnerType.BUSINESS
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                              }`}>
                                {inst.owner}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm tabular-nums whitespace-nowrap">
                          {showAmounts ? formatIDR(inst.monthlyAmount) : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleInstallmentValidation(inst.id, statementMonth, statementYear)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transform active:scale-90 transition-all cursor-pointer ${
                            inst.isValidated
                              ? 'bg-primary text-white shadow-sm shadow-primary/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 font-bold text-xs bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  Tidak ada cicilan aktif pada periode ini.
                </div>
              )}
            </section>

            {/* 5. LOG TRANSAKSI PERIODE INI (BANK LEDGER LIST) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h5 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History size={14} className="text-primary" />
                  <span>Log Transaksi Periode Ini</span>
                  <span className="text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-extrabold">
                    {s.transactions.length}
                  </span>
                </h5>
                {s.transactions.length > 0 && (
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 tabular-nums">
                    {showAmounts ? formatIDR(totalTransactionsAmount) : '••••'}
                  </span>
                )}
              </div>

              {s.transactions.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
                  {s.transactions.map(t => (
                    <div
                      key={t.id}
                      onClick={() => openEditTransaction(t)}
                      className="px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          t.isValidated ? 'bg-primary/15 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <History size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase truncate leading-tight">
                            {t.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                              {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            {!t.owner ? (
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => updateTransactionOwner(t.id, OwnerType.PERSONAL)} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[9px] font-bold hover:bg-blue-500/20 whitespace-nowrap">PRIBADI</button>
                                <button type="button" onClick={() => updateTransactionOwner(t.id, OwnerType.BUSINESS)} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded text-[9px] font-bold hover:bg-purple-500/20 whitespace-nowrap">BISNIS</button>
                              </div>
                            ) : (
                              <span className={`whitespace-nowrap text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                t.owner === OwnerType.PERSONAL
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : t.owner === OwnerType.BUSINESS
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                              }`}>
                                {t.owner}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-black text-danger text-xs sm:text-sm tabular-nums whitespace-nowrap">
                          {showAmounts ? formatIDR(t.amount) : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTransactionValidation(t.id);
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transform active:scale-90 transition-all cursor-pointer ${
                            t.isValidated
                              ? 'bg-primary text-white shadow-sm shadow-primary/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 font-bold text-xs bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  Belum ada pemakaian baru di periode ini.
                </div>
              )}
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
          <button type="button" onClick={handleStartDemoMode} className="w-full mt-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3.5 rounded-[22px] font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 flex items-center justify-center gap-2"><Zap size={16} className="text-yellow-500"/>Coba Mode Demo (Tanpa Akun)</button>
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }} className="w-full mt-6 text-sm text-primary dark:text-blue-400 font-black hover:underline">{isRegistering ? 'Punya akun? Masuk di sini' : 'Baru di LimitWatch? Daftar gratis'}</button>
        </div>
      </div>
  );

  const isFormOrDetailView = ['FORM_TRANSACTION', 'FORM_CARD', 'FORM_SAVING', 'FORM_TRANSFER_SAVING', 'FORM_PIUTANG', 'VIEW_STATEMENT', 'VIEW_PROFILE'].includes(currentView);

  return (
    <div className={`${data.theme === 'dark' ? 'dark' : ''} h-full`}>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
        
        {/* SHARED DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-50">
           <div className="h-20 flex items-center px-8 border-b border-slate-50 dark:border-slate-800 shrink-0"><div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center mr-3 shadow-lg"><Wallet size={22} /></div><span className="font-black text-2xl text-slate-800 dark:text-slate-100 tracking-tighter">LimitWatch</span></div>
           <div className="px-5 pt-5">
             <button
               type="button"
               onClick={() => setQuickAddOpen(true)}
               className="w-full py-3 px-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
             >
               <Plus size={18} strokeWidth={3} />
               <span>Input Cepat</span>
             </button>
           </div>
           <nav className="p-5 space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
              <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] mb-4 ml-2">Navigasi Utama</div>
              <DesktopNavItem icon={<Home size={22}/>} label="Beranda" active={currentView === 'DASHBOARD'} onClick={() => navigateToRoot('DASHBOARD')} />
              <DesktopNavItem icon={<Briefcase size={22}/>} label="Kartu & Hutang" active={currentView === 'CARDS'} onClick={() => navigateToRoot('CARDS')} />
              <DesktopNavItem icon={<Vault size={22}/>} label="Tabungan" active={currentView === 'SAVINGS'} onClick={() => navigateToRoot('SAVINGS')} />
              <DesktopNavItem icon={<HandCoins size={22}/>} label="Piutang" active={currentView === 'PIUTANGS'} onClick={() => navigateToRoot('PIUTANGS')} />
              <DesktopNavItem icon={<CalendarRange size={22}/>} label="Anggaran Tahunan" active={currentView === 'YEARLY'} onClick={() => navigateToRoot('YEARLY')} />
              <DesktopNavItem icon={<PieChart size={22}/>} label="Bisnis & Personal" active={currentView === 'OWNER_BILLS'} onClick={() => navigateToRoot('OWNER_BILLS')} />
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
              title={
                currentView === 'DASHBOARD' ? 'Beranda' :
                currentView === 'CARDS' ? 'Kartu & Hutang' :
                currentView === 'TRANSACTIONS' ? 'Riwayat Aktivitas' :
                currentView === 'SAVINGS' ? 'Tabungan' :
                currentView === 'PIUTANGS' ? 'Piutang' :
                currentView === 'YEARLY' ? 'Anggaran Tahunan' :
                currentView === 'OWNER_BILLS' ? 'Tagihan Bisnis & Personal' :
                currentView === 'FORM_TRANSACTION' ? 'Input Transaksi' :
                currentView === 'FORM_SAVING' ? 'Input Tabungan' :
                currentView === 'FORM_PIUTANG' ? 'Input Piutang' :
                currentView === 'FORM_CARD' ? 'Input Kartu / Hutang' :
                currentView === 'FORM_TRANSFER_SAVING' ? 'Transfer Tabungan' :
                currentView === 'VIEW_STATEMENT' ? 'Rincian e-Statement' :
                currentView === 'VIEW_PROFILE' ? 'Profil & Keamanan' :
                currentView.replace('FORM_', 'Input ').replace('VIEW_', 'Rincian ').replace('_', ' ')
              } 
              onBack={viewStack.length > 1 ? popView : undefined}
              rightElement={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition active:scale-90 cursor-pointer"
                    title={data.theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                  >
                    {data.theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
                  </button>
                  {isMobileDevice && currentView === 'DASHBOARD' && (
                    <button onClick={() => pushView('VIEW_PROFILE')} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200/70 dark:border-slate-700">
                      {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={18} className="text-slate-500 dark:text-slate-400"/>}
                    </button>
                  )}
                </div>
              }
            />
          )}

          <main className={`flex-1 overflow-y-auto no-scrollbar ${isFormOrDetailView ? 'pb-4' : 'pb-24'} md:pb-10 bg-slate-50 dark:bg-slate-950`}>
            {renderCurrentView()}
          </main>

          {/* MOBILE BOTTOM NAV */}
          {!isFormOrDetailView && isMobileDevice && (
            <nav 
              className="fixed left-0 right-0 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-[70] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" 
              style={{ height: 'calc(60px + var(--sab, 0px))', paddingBottom: 'var(--sab, 0px)' }}
            >
              <div className="h-[60px] px-3 grid grid-cols-5 items-center max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={() => { setQuickAddOpen(false); navigateToRoot('DASHBOARD'); }}
                  className={`flex flex-col items-center justify-center gap-1 transition-all py-1 cursor-pointer ${
                    currentView === 'DASHBOARD' && !quickAddOpen ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <Home size={20} />
                  <span className="text-[9px] font-black uppercase tracking-tighter leading-none">Beranda</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setQuickAddOpen(false); navigateToRoot('SAVINGS'); }}
                  className={`flex flex-col items-center justify-center gap-1 transition-all py-1 cursor-pointer ${
                    currentView === 'SAVINGS' && !quickAddOpen ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <Vault size={20} />
                  <span className="text-[9px] font-black uppercase tracking-tighter leading-none">Tabung</span>
                </button>

                {/* CENTER UNIVERSAL + BUTTON */}
                <div className="flex flex-col items-center justify-center -mt-5">
                  <button
                    type="button"
                    onClick={() => setQuickAddOpen(prev => !prev)}
                    aria-label="Menu Input Cepat"
                    className={`w-13 h-13 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 active:scale-90 cursor-pointer border-4 border-white dark:border-slate-900 ${
                      quickAddOpen
                        ? 'bg-slate-800 dark:bg-slate-700 rotate-45 shadow-slate-900/30'
                        : 'bg-gradient-to-tr from-primary to-blue-500 shadow-primary/40'
                    }`}
                  >
                    <Plus size={26} strokeWidth={2.75} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setQuickAddOpen(false); navigateToRoot('YEARLY'); }}
                  className={`flex flex-col items-center justify-center gap-1 transition-all py-1 cursor-pointer ${
                    currentView === 'YEARLY' && !quickAddOpen ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <CalendarRange size={20} />
                  <span className="text-[9px] font-black uppercase tracking-tighter leading-none">Tahun</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setQuickAddOpen(false); navigateToRoot('OWNER_BILLS'); }}
                  className={`flex flex-col items-center justify-center gap-1 transition-all py-1 cursor-pointer ${
                    currentView === 'OWNER_BILLS' && !quickAddOpen ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <PieChart size={20} />
                  <span className="text-[9px] font-black uppercase tracking-tighter leading-none">Bisnis</span>
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>

      {/* UNIVERSAL QUICK ADD (+) MODAL / SHEET */}
      {quickAddOpen && (
        <div
          onClick={() => setQuickAddOpen(false)}
          className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-xs flex items-end md:items-center justify-center p-4 pb-24 md:pb-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 animate-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Input Cepat Universal
                </h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Pilih jenis pencatatan yang ingin ditambahkan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* 1. Transaksi (Pakai) */}
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  setEditingTransaction(null);
                  if (!txCardId && data.cards.length > 0) setTxCardId(data.cards[0].id);
                  setTxAmount('');
                  setTxDesc('');
                  setTxType(TransactionType.EXPENSE);
                  setTxIsInstallment(false);
                  setTxOwner(OwnerType.PERSONAL);
                  setTxSplitPersonal('');
                  setTxSplitBusiness('');
                  pushView('FORM_TRANSACTION');
                }}
                className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/25 border border-red-200/70 dark:border-red-800/40 hover:bg-red-100/70 dark:hover:bg-red-900/40 transition flex flex-col items-start gap-2.5 text-left active:scale-95 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-danger text-white flex items-center justify-center shadow-sm shadow-danger/30">
                  <ArrowUpCircle size={22} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Transaksi
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    Catat pengeluaran / cicilan
                  </p>
                </div>
              </button>

              {/* 2. Pembayaran (Bayar) */}
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  setEditingTransaction(null);
                  const defaultCard = data.cards.find(c => c.id === txCardId) || data.cards[0];
                  if (defaultCard) {
                    setTxCardId(defaultCard.id);
                    setTxDesc(`Bayar Tagihan ${defaultCard.name}`);
                  } else {
                    setTxDesc('Bayar Tagihan');
                  }
                  setTxAmount('');
                  setTxType(TransactionType.PAYMENT);
                  setTxIsInstallment(false);
                  setTxTargetMonth(new Date().getMonth());
                  setTxTargetYear(new Date().getFullYear());
                  pushView('FORM_TRANSACTION');
                }}
                className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-800/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition flex flex-col items-start gap-2.5 text-left active:scale-95 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-success text-white flex items-center justify-center shadow-sm shadow-success/30">
                  <ArrowDownCircle size={22} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Pembayaran
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    Bayar tagihan kartu / hutang
                  </p>
                </div>
              </button>

              {/* 3. Nabung */}
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  setEditingSaving(null);
                  if (!savingCardId && data.cards.length > 0) setSavingCardId(data.cards[0].id);
                  setSavingAmount('');
                  setSavingNote('');
                  setSavingOwner(OwnerType.PERSONAL);
                  setSavingTargetMonth(new Date().getMonth());
                  setSavingTargetYear(new Date().getFullYear());
                  pushView('FORM_SAVING');
                }}
                className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/70 dark:border-blue-800/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition flex flex-col items-start gap-2.5 text-left active:scale-95 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm shadow-primary/30">
                  <Vault size={22} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Nabung
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    Sisihkan dana personal / bisnis
                  </p>
                </div>
              </button>

              {/* 4. Piutang */}
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  setEditingPiutang(null);
                  if (!piutangCardId && data.cards.length > 0) setPiutangCardId(data.cards[0].id);
                  setPiutangAmount('');
                  setPiutangDebtor('');
                  setPiutangNote('');
                  setPiutangIsInstallment(false);
                  setPiutangTargetMonth(new Date().getMonth());
                  setPiutangTargetYear(new Date().getFullYear());
                  pushView('FORM_PIUTANG');
                }}
                className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/70 dark:border-indigo-800/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 transition flex flex-col items-start gap-2.5 text-left active:scale-95 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/30">
                  <HandCoins size={22} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Piutang
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    Catat titipan / tagihan teman
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
