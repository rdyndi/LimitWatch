
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
import { getFinancialAdvice } from "./services/geminiService";
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
  <header className={`flex-none bg-white dark:bg-slate-900 border-b dark:border-slate-800 z-[60] sticky top-0 ${className}`} style={{ paddingTop: 'var(--sat, 0px)' }}>
    <div className="px-4 md:px-8 h-12 md:h-16 flex justify-between items-center max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-2.5">
        {onBack && (
          <button onClick={onBack} className="p-1.5 -ml-1.5 text-slate-500 dark:text-slate-400 active:scale-90 transition hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <ChevronLeft size={22} />
          </button>
        )}
        <h2 className="text-base md:text-xl font-black text-slate-800 dark:text-slate-100 leading-none truncate max-w-[220px] md:max-w-md">{title}</h2>
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
    piutangs: [],
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
  const [editingPiutang, setEditingPiutang] = useState<PiutangType | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [savingHistoryModal, setSavingHistoryModal] = useState<{ title: string, items: Saving[], cardId: string, month: number, year: number } | null>(null);
  const [piutangHistoryModal, setPiutangHistoryModal] = useState<{ title: string, items: PiutangType[], cardId: string, month: number, year: number } | null>(null);

  const [historyCardFilter, setHistoryCardFilter] = useState<string>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<number>(new Date().getMonth());
  const [historyYearFilter, setHistoryYearFilter] = useState<number>(new Date().getFullYear());
  const [yearlySelectedYear, setYearlySelectedYear] = useState<number>(new Date().getFullYear());
  const [yearlyMonthFilter, setYearlyMonthFilter] = useState<'ALL' | 'HAS_BILL' | 'UNPAID'>('ALL');
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

  const [aiAdviceModalOpen, setAiAdviceModalOpen] = useState(false);
  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);
  const [aiAdviceContent, setAiAdviceContent] = useState('');

  const handleFetchAiAdvice = async () => {
    setAiAdviceLoading(true);
    setAiAdviceModalOpen(true);
    setAiAdviceContent('');
    try {
      const advice = await getFinancialAdvice(data);
      setAiAdviceContent(advice);
    } catch (err) {
      setAiAdviceContent("Terjadi kesalahan saat meminta analisis AI.");
    } finally {
      setAiAdviceLoading(false);
    }
  };

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
    if (user) {
      const unsubscribe = subscribeToAppState(user.uid, (newState) => {
        const cleanState = sanitizeData(newState);
        setData(cleanState);
        if (cleanState.theme === 'dark') {
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
      setData({ cards: [], transactions: [], installments: [], savings: [], piutangs: [], theme: 'light', security: { pin: null, isPinEnabled: false } });
      document.documentElement.classList.remove('dark');
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
      setData({
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
        theme: "light",
        security: { pin: null, isPinEnabled: false }
      });
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
    if (s.targetPeriod) {
      setSavingTargetMonth(s.targetPeriod.month);
      setSavingTargetYear(s.targetPeriod.year);
    }
    pushView('FORM_SAVING');
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
    if (item.owner === OwnerType.SPLIT && item.splitAmounts) return { personal: item.splitAmounts.personal, business: item.splitAmounts.business, unclassified: 0 };
    return { personal: 0, business: 0, unclassified: amount };
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

  const dashboardMonthlyData = useMemo(() => {
    const cardsInMonth = data.cards.map(card => {
      const stmt = getStatementData(card.id, dashMonth, dashYear);
      const bill = stmt.totalBill;
      const paid = stmt.totalPaid;
      const savings = stmt.totalSavingsAmount;
      const piutangs = stmt.totalPiutangsAmount;
      const kurang = stmt.totalKurang;
      const unpaid = stmt.totalUnpaid;
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
        isFullyPaid: bill > 0 && kurang === 0
      };
    });

    const totalMonthBill = cardsInMonth.reduce((s, c) => s + c.bill, 0);
    const totalMonthPaid = cardsInMonth.reduce((s, c) => s + c.paid, 0);
    const totalMonthSavings = cardsInMonth.reduce((s, c) => s + c.savings, 0);
    const totalMonthPiutangs = cardsInMonth.reduce((s, c) => s + c.piutangs, 0);
    const totalMonthKurang = Math.max(0, totalMonthBill - totalMonthPaid - totalMonthSavings - totalMonthPiutangs);
    const totalMonthUnpaid = Math.max(0, totalMonthBill - totalMonthPaid);

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
      case 'DASHBOARD':
        return (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto w-full px-5 py-4 md:px-8 md:py-8">
            <div className="bg-gradient-to-br from-violet-600 to-primary rounded-[32px] p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="flex justify-between items-start mb-1 relative z-10"><p className="text-blue-100 text-sm md:text-base font-bold uppercase tracking-wider">Total Liabilitas</p><button type="button" onClick={() => setShowAmounts(!showAmounts)} className="text-blue-100 hover:text-white transition p-1">{showAmounts ? <Eye size={24} /> : <EyeOff size={24} />}</button></div>
              <h3 className="text-3xl md:text-5xl font-black mb-6 relative z-10">{showAmounts ? formatIDR(totalDebt) : '••••••••'}</h3>
              <div className="space-y-3 pt-6 border-t border-white/10 relative z-10 grid md:grid-cols-3 md:gap-10">
                <button type="button" onClick={() => pushView('SAVINGS')} className="flex justify-between items-center text-left hover:opacity-80 transition cursor-pointer"><p className="text-blue-200 text-[10px] md:text-xs uppercase font-bold tracking-widest">Tabungan</p><p className="font-bold text-base md:text-lg">{showAmounts ? formatIDR(totalSavingsAcrossYears) : '••••'}</p></button>
                <button type="button" onClick={() => pushView('PIUTANGS')} className="flex justify-between items-center text-left hover:opacity-80 transition cursor-pointer"><p className="text-blue-200 text-[10px] md:text-xs uppercase font-bold tracking-widest">Piutang</p><p className="font-bold text-base md:text-lg">{showAmounts ? formatIDR(totalPiutangsAcrossYears) : '••••'}</p></button>
                <button type="button" onClick={() => pushView('CARDS')} className="flex justify-between items-center text-left hover:opacity-80 transition cursor-pointer"><p className="text-white text-[10px] md:text-xs uppercase font-black tracking-widest">Sisa Hutang</p><p className="font-black text-xl md:text-2xl text-yellow-300">{showAmounts ? formatIDR(currentDebtGap) : '••••'}</p></button>
              </div>
            </div>

            {/* AI Advisor Banner */}
            <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-blue-900/90 p-5 md:p-6 rounded-[28px] border border-indigo-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
                  <Zap size={24} className="text-yellow-400" />
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-black text-white tracking-tight flex items-center gap-2">
                    Penasihat Keuangan AI (Gemini)
                  </h4>
                  <p className="text-xs text-slate-300">
                    Dapatkan analisis cerdas & strategi pelunasan hutang kartu kredit Anda.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleFetchAiAdvice}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs md:text-sm rounded-2xl transition shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Zap size={16} className="text-yellow-300" />
                Analisis Keuangan Saya
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-4 md:gap-8">
              <button 
                type="button"
                onClick={() => { setEditingTransaction(null); setTxAmount(''); setTxDesc(''); setTxType(TransactionType.EXPENSE); setTxIsInstallment(false); setTxOwner(OwnerType.PERSONAL); setTxSplitPersonal(''); setTxSplitBusiness(''); pushView('FORM_TRANSACTION'); }} 
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-full aspect-square max-w-[72px] md:w-20 md:h-20 bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xs active:scale-95 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all">
                  <PlusCircle size={26} className="md:w-7 md:h-7" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center truncate w-full">Catat</span>
              </button>

              <button 
                type="button"
                onClick={() => { setEditingSaving(null); setSavingAmount(''); setSavingNote(''); pushView('FORM_SAVING'); }} 
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-full aspect-square max-w-[72px] md:w-20 md:h-20 bg-emerald-50 dark:bg-emerald-900/30 text-success dark:text-emerald-400 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xs active:scale-95 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all">
                  <Vault size={26} className="md:w-7 md:h-7" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center truncate w-full">Nabung</span>
              </button>

              <button 
                type="button"
                onClick={() => { setEditingPiutang(null); setPiutangAmount(''); setPiutangDebtor(''); setPiutangNote(''); pushView('FORM_PIUTANG'); }} 
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-full aspect-square max-w-[72px] md:w-20 md:h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xs active:scale-95 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all">
                  <HandCoins size={26} className="md:w-7 md:h-7" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center truncate w-full">Piutang</span>
              </button>

              <button 
                type="button"
                onClick={() => pushView('CARDS')} 
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-full aspect-square max-w-[72px] md:w-20 md:h-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xs active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  <Briefcase size={26} className="md:w-7 md:h-7" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center truncate w-full">Hutang</span>
              </button>

              <button 
                type="button"
                onClick={() => pushView('TRANSACTIONS')} 
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-full aspect-square max-w-[72px] md:w-20 md:h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xs active:scale-95 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all">
                  <History size={26} className="md:w-7 md:h-7" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center truncate w-full">Riwayat</span>
              </button>
            </div>

            {/* MONTHLY & PER-CARD OVERVIEW SECTION (Setiap Bulan & Perkartu: Total Tagihan, Tabungan, Piutang, Sudah Dibayar, Kurang) */}
            <div className="space-y-5 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                    <Calendar size={22} className="text-primary"/>
                    RINCIAN TAGIHAN BULANAN
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Total Tagihan, Tabungan, Piutang, Sudah Dibayar, dan Kurang setiap bulan & perkartu
                  </p>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
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
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 dark:text-slate-400"
                    title="Bulan Sebelumnya"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Calendar size={14} className="text-primary"/>
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
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 dark:text-slate-400"
                    title="Bulan Berikutnya"
                  >
                    <ChevronRight size={18} />
                  </button>

                  {(dashMonth !== new Date().getMonth() || dashYear !== new Date().getFullYear()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDashMonth(new Date().getMonth());
                        setDashYear(new Date().getFullYear());
                      }}
                      className="text-[10px] font-black uppercase text-primary dark:text-blue-400 hover:underline px-2"
                    >
                      Bulan Ini
                    </button>
                  )}
                </div>
              </div>

              {/* OVERALL MONTH SUMMARY CARD (5 Metrics) */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 md:p-6 shadow-md border border-slate-700/80 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                      TOTAL SEMUA KARTU ({dashboardMonthlyData.monthName} {dashYear})
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${dashboardMonthlyData.status === 'LUNAS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : dashboardMonthlyData.status === 'SEBAGIAN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : dashboardMonthlyData.status === 'KURANG' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    {dashboardMonthlyData.status === '-' ? 'LUNAS' : dashboardMonthlyData.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                  {/* 1. Total Tagihan */}
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={13} className="text-blue-400"/> Total Tagihan
                    </span>
                    <p className="text-sm md:text-base font-black text-white">
                      {showAmounts ? formatIDR(dashboardMonthlyData.totalMonthBill) : '••••••••'}
                    </p>
                  </div>

                  {/* 2. Tabungan */}
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50 space-y-1">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Vault size={13} className="text-purple-400"/> Tabungan
                    </span>
                    <p className="text-sm md:text-base font-black text-purple-300">
                      {showAmounts ? formatIDR(dashboardMonthlyData.totalMonthSavings) : '••••••••'}
                    </p>
                  </div>

                  {/* 3. Piutang */}
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50 space-y-1">
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt size={13} className="text-cyan-400"/> Piutang
                    </span>
                    <p className="text-sm md:text-base font-black text-cyan-300">
                      {showAmounts ? formatIDR(dashboardMonthlyData.totalMonthPiutangs) : '••••••••'}
                    </p>
                  </div>

                  {/* 4. Sudah Dibayar */}
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400"/> Sudah Dibayar
                    </span>
                    <p className="text-sm md:text-base font-black text-emerald-400">
                      {showAmounts ? formatIDR(dashboardMonthlyData.totalMonthPaid) : '••••••••'}
                    </p>
                  </div>

                  {/* 5. Kurang */}
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-rose-800/50 bg-rose-950/20 space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400"/> Kurang
                    </span>
                    <p className={`text-sm md:text-base font-black ${dashboardMonthlyData.totalMonthKurang > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {showAmounts ? (dashboardMonthlyData.totalMonthKurang > 0 ? formatIDR(dashboardMonthlyData.totalMonthKurang) : 'Rp 0') : '••••••••'}
                    </p>
                    {dashboardMonthlyData.totalMonthSavings + dashboardMonthlyData.totalMonthPiutangs > 0 && dashboardMonthlyData.totalMonthUnpaid > dashboardMonthlyData.totalMonthKurang && showAmounts && (
                      <span className="text-[8px] text-slate-400 font-bold block">
                        Belum setor: {formatIDR(dashboardMonthlyData.totalMonthUnpaid)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PER KARTU BREAKDOWN (e.g. Traveloka Card) */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    RINCIAN PER KARTU ({dashboardMonthlyData.monthName})
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    {dashboardMonthlyData.cardsInMonth.length} Kartu / Sumber Hutang
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardMonthlyData.cardsInMonth.map(cardItem => {
                    const cardHasKurang = cardItem.kurang > 0;
                    return (
                      <div 
                        key={cardItem.cardId}
                        className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:border-primary/50 transition space-y-3"
                      >
                        {/* Header: Dot + Card Name + Status */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${cardItem.cardColor}`} />
                            <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                              {cardItem.cardName}
                            </h5>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase shrink-0 ${cardHasKurang ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}`}>
                            {cardHasKurang ? 'Ada Kurang' : (cardItem.bill > 0 || cardItem.paid > 0 ? 'Lunas' : 'Nihil')}
                          </span>
                        </div>

                        {/* 5 Rows: Total Tagihan, Tabungan, Piutang, Sudah Dibayar, Kurang */}
                        <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
                          {/* 1. Total Tagihan */}
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                            <span>Total Tagihan</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {showAmounts ? formatIDR(cardItem.bill) : '••••••••'}
                            </span>
                          </div>

                          {/* 2. Tabungan */}
                          <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                            <span className="flex items-center gap-1.5"><Vault size={12}/> Tabungan</span>
                            <span className="font-bold">
                              {showAmounts ? formatIDR(cardItem.savings) : '••••••••'}
                            </span>
                          </div>

                          {/* 3. Piutang */}
                          <div className="flex justify-between items-center text-cyan-600 dark:text-cyan-400">
                            <span className="flex items-center gap-1.5"><Receipt size={12}/> Piutang</span>
                            <span className="font-bold">
                              {showAmounts ? formatIDR(cardItem.piutangs) : '••••••••'}
                            </span>
                          </div>

                          {/* 4. Sudah Dibayar */}
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={12}/> Sudah Dibayar</span>
                            <span className="font-bold">
                              {showAmounts ? formatIDR(cardItem.paid) : '••••••••'}
                            </span>
                          </div>

                          {/* 5. Kurang */}
                          <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-700">
                            <div>
                              <span className="font-black text-slate-800 dark:text-slate-200 uppercase">
                                Kurang
                              </span>
                              {cardItem.savings + cardItem.piutangs > 0 && cardItem.unpaid > cardItem.kurang && showAmounts && (
                                <span className="text-[9px] text-slate-400 font-bold block">
                                  Sisa tagihan: {formatIDR(cardItem.unpaid)}
                                </span>
                              )}
                            </div>
                            <span className={`font-black text-sm ${cardHasKurang ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {showAmounts ? (cardHasKurang ? formatIDR(cardItem.kurang) : 'Rp 0') : '••••••••'}
                            </span>
                          </div>
                        </div>

                        {/* Quick actions for this card */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/40">
                          <button 
                            type="button"
                            onClick={() => openStatement(cardItem.cardObj, dashMonth, dashYear)}
                            className="py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1"
                          >
                            <Receipt size={12}/> Detail
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
                            className="py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1"
                          >
                            <Check size={12}/> Bayar
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingSaving(null);
                              setSavingAmount('');
                              setSavingNote(`Tabungan ${cardItem.cardName}`);
                              setSavingCardId(cardItem.cardId);
                              setSavingTargetMonth(dashMonth);
                              setSavingTargetYear(dashYear);
                              pushView('FORM_SAVING');
                            }}
                            className="py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1"
                          >
                            <Vault size={12}/> Nabung
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


            {upcomingBills.length > 0 && (
              <div className="space-y-4">
                 <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm md:text-base uppercase tracking-tight">Tagihan Terdekat</h3>
                 <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                    {upcomingBills.map(bill => (
                       <div key={bill.id} onClick={() => openStatement(bill)} className="min-w-[85vw] md:min-w-[400px] bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4 snap-center active:scale-[0.98] hover:border-primary transition-all cursor-pointer">
                          <div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className={`w-10 h-10 ${bill.color} rounded-xl flex items-center justify-center text-white shadow-sm`}><AlertCircle size={18}/></div><span className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">{bill.name}</span></div><span className={`text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${bill.daysLeft <= 3 ? 'bg-red-50 dark:bg-red-900/30 text-danger dark:text-red-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>{bill.daysLeft} Hari Lagi</span></div>
                          
                          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl relative overflow-hidden">
                             <div className="flex flex-col">
                                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[8px] md:text-[9px]">Tagihan</span>
                                <span className="font-black text-slate-700 dark:text-slate-200 text-xs md:text-sm">{showAmounts ? formatIDR(bill.remainingBill) : '••••••••'}</span>
                             </div>
                             <div className="flex flex-col text-right">
                                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[8px] md:text-[9px]">Aset Likuid</span>
                                <span className="font-black text-success text-xs md:text-sm">{showAmounts ? formatIDR(bill.savedForThisMonth || 0) : '••••••••'}</span>
                             </div>
                             {bill.netGap > 0 && (
                               <div className="col-span-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                 <span className="text-danger font-black text-[10px] md:text-[11px] uppercase flex items-center gap-1">
                                   <ArrowDownRight size={14} className="animate-bounce" />
                                   Kurang {showAmounts ? formatIDR(bill.netGap) : '••••'}
                                 </span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase">{Math.round(bill.progress)}% SIAP</span>
                               </div>
                             )}
                          </div>
                          
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${bill.isCovered ? 'bg-success' : 'bg-primary'}`} 
                              style={{ width: `${Math.min(100, bill.progress)}%` }}
                            ></div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-8 flex items-center gap-3"><PieChart size={24} /> Pengeluaran Kelompok Bulan Ini</h3>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                {categoryGrouping.items.map(([cat, val], idx) => (
                  <div key={idx} className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 leading-tight">{cat}</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">{showAmounts ? formatIDR(val.total) : '••••'}</span>
                    </div>
                    
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      {val.personal > 0 && <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(val.personal / val.total) * 100}%` }}></div>}
                      {val.business > 0 && <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${(val.business / val.total) * 100}%` }}></div>}
                    </div>
                    
                    {(val.personal > 0 || val.business > 0) && (
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                        {val.personal > 0 && (
                          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 px-2 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <span className="uppercase opacity-80">Pribadi</span><span>{showAmounts ? formatIDR(val.personal) : '••'}</span>
                          </div>
                        )}
                        {val.business > 0 && (
                          <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 px-2 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <span className="uppercase opacity-80">Bisnis</span><span>{showAmounts ? formatIDR(val.business) : '••'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {categoryGrouping.items.length === 0 && <p className="text-center py-10 text-slate-400 font-medium">Belum ada pengeluaran yang dicatat bulan ini.</p>}
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
                    {savingHistoryModal.items.map(item => (
                      <div key={item.id} onClick={() => { setSavingHistoryModal(null); openEditSaving(item); }} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition group border border-transparent hover:border-success/30">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.note}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black ${item.amount < 0 ? 'text-danger' : 'text-success'}`}>{formatIDR(item.amount)}</span>
                          <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                    
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
            <div className="bg-[#1a2332] rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-800 space-y-4">
              {/* Header Title & Year Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">ANGGARAN {yearlySelectedYear}</h2>
                    <button 
                      type="button" 
                      onClick={() => setShowAmounts(!showAmounts)} 
                      className="text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-slate-800"
                      title={showAmounts ? "Sembunyikan Nominal" : "Tampilkan Nominal"}
                    >
                      {showAmounts ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Ringkasan total tagihan, pembayaran, kekurangan, dan posisi keuangan tahun {yearlySelectedYear}
                  </p>
                </div>

                {/* Year Switcher < 2025  [2026]  2027 > */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto shrink-0">
                  <button 
                    type="button"
                    onClick={() => setYearlySelectedYear(y => y - 1)} 
                    className="px-2.5 py-1.5 hover:bg-slate-800 rounded-xl transition text-slate-300 hover:text-white flex items-center gap-1 text-xs font-extrabold"
                  >
                    <ChevronLeft size={16}/>
                    <span>{yearlySelectedYear - 1}</span>
                  </button>
                  <span className="text-xs font-black px-3.5 py-1.5 bg-blue-600 rounded-xl text-white shadow-md">
                    {yearlySelectedYear}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setYearlySelectedYear(y => y + 1)} 
                    className="px-2.5 py-1.5 hover:bg-slate-800 rounded-xl transition text-slate-300 hover:text-white flex items-center gap-1 text-xs font-extrabold"
                  >
                    <span>{yearlySelectedYear + 1}</span>
                    <ChevronRight size={16}/>
                  </button>
                </div>
              </div>

              {/* 5 Compact Stat Cards (Nominal Tampil Penuh) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* 1. Total Tagihan */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-500/15 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                      <CreditCard size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
                    {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearBill) : '••••••••'}
                  </p>
                </div>

                {/* 2. Tabungan */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-purple-500/15 rounded-lg flex items-center justify-center text-purple-400 shrink-0">
                      <Vault size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tabungan</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-purple-300 tracking-tight">
                    {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearSavings) : '••••••••'}
                  </p>
                </div>

                {/* 3. Piutang */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-cyan-500/15 rounded-lg flex items-center justify-center text-cyan-400 shrink-0">
                      <Receipt size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Piutang</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-cyan-300 tracking-tight">
                    {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearPiutangs) : '••••••••'}
                  </p>
                </div>

                {/* 4. Sudah Dibayar */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-500/15 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sudah Dibayar</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-emerald-400 tracking-tight">
                    {showAmounts ? formatIDR(yearlyBudgetAnalysis.totalYearPaid) : '••••••••'}
                  </p>
                </div>

                {/* 5. Kurang */}
                <div className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-3.5 sm:p-4 space-y-1.5 bg-rose-950/20 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-rose-500/15 rounded-lg flex items-center justify-center text-rose-400 shrink-0">
                      <AlertCircle size={15} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-rose-300 uppercase tracking-wider">Kurang</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-rose-400 tracking-tight">
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
               <div className="space-y-1 text-center py-1"><label className="text-[9px] font-black text-slate-400 uppercase block">Dana Disisihkan</label><input type="text" inputMode="numeric" value={savingAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setSavingAmount)} required placeholder="Rp 0" className="w-full text-xl sm:text-2xl font-black py-1.5 px-2 border-b-2 border-slate-100 dark:border-slate-800 outline-none focus:border-success bg-transparent text-slate-800 dark:text-slate-100 text-center" /></div>
               <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 block">Target Periode Tagihan</label><div className="grid grid-cols-2 gap-2.5"><select value={savingTargetMonth} onChange={(e)=>setSavingTargetMonth(parseInt(e.target.value))} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-bold">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={savingTargetYear} onChange={(e)=>setSavingTargetYear(parseInt(e.target.value))} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs sm:text-sm font-bold"/></div></div>
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
        
        return (
          <div className="animate-in slide-in-from-right duration-300 max-w-5xl mx-auto w-full px-5 py-8 space-y-8 pb-32">
            <div className={`relative p-8 md:p-12 text-white rounded-[40px] shadow-xl flex justify-between items-center overflow-hidden`}>
                <div className={`absolute inset-0 ${activeStatementCard.color || 'bg-slate-800'}`}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_20%,rgba(255,255,255,0.05)_25%,transparent_30%)] pointer-events-none"></div>
                
                <div className="absolute -right-10 -bottom-10 opacity-10"><Receipt size={200} /></div>
                
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    {activeStatementCard.logoUrl ? (
                      <div className="w-12 h-12 bg-white rounded-lg p-1.5 shadow-md flex-shrink-0">
                        <img src={activeStatementCard.logoUrl} alt={activeStatementCard.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-sm flex-shrink-0 backdrop-blur-sm border border-white/30">
                        {activeStatementCard.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs opacity-80 uppercase tracking-widest font-black mb-0.5 drop-shadow-md">{activeStatementCard.type === DebtType.CREDIT_CARD ? 'Bank Statement' : 'Private Loan'}</p>
                      <h4 className="text-3xl font-black tracking-tight drop-shadow-md">{activeStatementCard.name}</h4>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end relative z-10"><p className="text-[10px] opacity-80 uppercase font-black tracking-widest drop-shadow-sm">Bulan Tagihan</p><p className="text-xl font-black uppercase drop-shadow-md">{monthNames[statementMonth]} {statementYear}</p></div>
            </div>
            
            <div className="flex gap-4"><select value={statementMonth} onChange={(e)=>setStatementMonth(parseInt(e.target.value))} className="flex-1 text-sm font-black bg-white dark:bg-slate-900 dark:text-slate-100 p-5 rounded-2xl shadow-sm outline-none hover:border-primary border border-transparent transition">{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><input type="number" value={statementYear} onChange={(e)=>setStatementYear(parseInt(e.target.value))} className="w-32 text-sm font-black bg-white dark:bg-slate-900 dark:text-slate-100 p-5 rounded-2xl shadow-sm outline-none hover:border-primary border border-transparent transition" /></div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[40px] border dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">RINGKASAN STATUS TAGIHAN</span>
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${s.totalKurang === 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}`}>
                    {s.totalKurang === 0 ? 'Lunas / Tercukupi' : 'Ada Kurang'}
                  </span>
                </div>

                {/* 1. Total Tagihan */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Tagihan</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100">{showAmounts ? formatIDR(s.totalBill) : '••••'}</span>
                </div>

                {/* 2. Tabungan */}
                <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                  <span className="text-xs font-bold flex items-center gap-1.5"><Vault size={14}/> Tabungan</span>
                  <span className="text-base font-black">{showAmounts ? formatIDR(s.totalSavingsAmount) : '••'}</span>
                </div>

                {/* 3. Piutang */}
                <div className="flex justify-between items-center text-cyan-600 dark:text-cyan-400">
                  <span className="text-xs font-bold flex items-center gap-1.5"><Receipt size={14}/> Piutang</span>
                  <span className="text-base font-black">{showAmounts ? formatIDR(s.totalPiutangsAmount) : '••'}</span>
                </div>

                {/* 4. Sudah Dibayar */}
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span className="text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={14}/> Sudah Dibayar</span>
                  <span className="text-base font-black">{showAmounts ? formatIDR(s.totalPaid) : '••'}</span>
                </div>

                {/* 5. Kurang */}
                <div className="flex justify-between items-center pt-3 border-t-2 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Kurang</span>
                    {s.totalSavingsAmount + s.totalPiutangsAmount > 0 && s.totalUnpaid > s.totalKurang && showAmounts && (
                      <span className="text-[10px] text-slate-400 font-bold block">Sisa belum setor: {formatIDR(s.totalUnpaid)}</span>
                    )}
                  </div>
                  <span className={`text-2xl font-black ${s.totalKurang > 0 ? 'text-danger' : 'text-success'}`}>{showAmounts ? (s.totalKurang > 0 ? formatIDR(s.totalKurang) : 'Rp 0') : '••••'}</span>
                </div>
                
                {/* Checklist Rekonsiliasi Card */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700 space-y-2.5 mt-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rekonsiliasi (Ceklist)</span></div>
                    <span className={`text-sm font-black ${isReconciled ? 'text-success' : 'text-primary'}`}>{showAmounts ? formatIDR(s.totalValidated) : '••••'}</span>
                  </div>
                  <div className="h-2 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${isReconciled ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.min(100, (s.totalValidated / (s.totalBill || 1)) * 100)}%` }}></div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                    {isReconciled ? '✅ Angka Cocok dengan Record Bank' : `⚠️ Selisih ${formatIDR(Math.abs(s.totalBill - s.totalValidated))} dari App Record`}
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border dark:border-slate-800 shadow-sm space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Briefcase size={12}/> Breakdown Biaya</h5>
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl space-y-3 shadow-sm">
                    <div className="flex justify-between text-xs font-bold text-slate-500"><span className="uppercase">E-Statement Fee</span><span>{showAmounts ? formatIDR(s.adminFee) : '••'}</span></div>
                    <div className="flex justify-between text-xs font-bold text-slate-500"><span className="uppercase">Biaya Materai</span><span>{showAmounts ? formatIDR(s.materai) : '••'}</span></div>
                    <div className="pt-2 border-t dark:border-slate-700 flex justify-between text-xs font-black text-slate-800 dark:text-slate-200"><span className="uppercase">Total Tambahan</span><span>{showAmounts ? formatIDR(s.adminFee + s.materai) : '••'}</span></div>
                  </div>
                </div>

                {!isReconciled && s.totalBill > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-5 rounded-3xl flex items-start gap-4">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 shrink-0"><ShieldAlert size={20}/></div>
                    <div><p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-tight">Tips Rekonsiliasi</p><p className="text-[10px] font-bold text-amber-700/70 dark:text-amber-400/60 leading-relaxed mt-1">Ceklist transaksi di bawah satu per satu sambil melihat tagihan di aplikasi bank. Jika total tervalidasi sudah sama, berarti catatan Anda sudah akurat.</p></div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
               <button 
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
                  className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition hover:border-primary group"
               >
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-danger flex items-center justify-center group-hover:bg-danger group-hover:text-white transition-colors">
                    <Plus size={18} />
                  </div>
                  Catat
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
                  className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition hover:border-success group"
               >
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-success flex items-center justify-center group-hover:bg-success group-hover:text-white transition-colors">
                    <ArrowDownCircle size={18} />
                  </div>
                  Bayar
               </button>
               <button 
                  onClick={() => {
                    setEditingSaving(null);
                    setSavingAmount('');
                    setSavingNote('');
                    setSavingCardId(activeStatementCard.id);
                    setSavingTargetMonth(statementMonth);
                    setSavingTargetYear(statementYear);
                    pushView('FORM_SAVING');
                  }}
                  className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition hover:border-indigo-500 group"
               >
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Vault size={18} />
                  </div>
                  Nabung
               </button>
            </div>

            <section className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2"><CalendarClock size={14}/> Tagihan Cicilan Berjalan</h5>
              <div className="grid md:grid-cols-2 gap-4">
                {s.installments.map(inst => (
                   <div key={inst.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-50 dark:border-slate-800 flex justify-between items-center group shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${inst.isValidated ? 'bg-primary/10 text-primary' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                        <CalendarRange size={20}/>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase leading-tight">{inst.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black uppercase">Tenor {inst.currentTenor}/{inst.totalMonths}</span>
                          {!inst.owner ? (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                               <button type="button" onClick={() => updateInstallmentOwner(inst.id, OwnerType.PERSONAL)} className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-bold hover:bg-blue-200">PRIBADI</button>
                               <button type="button" onClick={() => updateInstallmentOwner(inst.id, OwnerType.BUSINESS)} className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[9px] font-bold hover:bg-purple-200">BISNIS</button>
                            </div>
                          ) : (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${inst.owner === OwnerType.PERSONAL ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : inst.owner === OwnerType.BUSINESS ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                              {inst.owner}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-800 dark:text-slate-200 text-base">{showAmounts ? formatIDR(inst.monthlyAmount) : '••'}</span>
                      <button 
                        type="button" 
                        onClick={() => toggleInstallmentValidation(inst.id, statementMonth, statementYear)} 
                        className={`p-2.5 rounded-full transform active:scale-90 transition-all ${inst.isValidated ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 hover:text-slate-400'}`}
                      >
                        <CheckCircle2 size={24}/>
                      </button>
                    </div>
                  </div>
                ))}
                {s.installments.length === 0 && <div className="col-span-full py-10 text-center text-slate-300 font-bold text-xs italic bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed dark:border-slate-800">Tidak ada cicilan aktif pada periode ini.</div>}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Log Transaksi Periode Ini</h5>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {s.transactions.map(t => (
                  <div key={t.id} onClick={() => openEditTransaction(t)} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-50 dark:border-slate-800 flex justify-between items-center hover:border-primary transition group cursor-pointer shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${t.isValidated ? 'bg-primary/10 text-primary' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                        <History size={20}/>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase leading-tight">{t.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                          {!t.owner ? (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                               <button type="button" onClick={() => updateTransactionOwner(t.id, OwnerType.PERSONAL)} className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-bold hover:bg-blue-200">PRIBADI</button>
                               <button type="button" onClick={() => updateTransactionOwner(t.id, OwnerType.BUSINESS)} className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[9px] font-bold hover:bg-purple-200">BISNIS</button>
                            </div>
                          ) : (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.owner === OwnerType.PERSONAL ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : t.owner === OwnerType.BUSINESS ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                              {t.owner}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-danger text-base">{showAmounts ? formatIDR(t.amount) : '••'}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleTransactionValidation(t.id); }} className={`p-2.5 rounded-full transform active:scale-90 transition-all ${t.isValidated ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 hover:text-slate-400'}`}><CheckCircle2 size={24}/></button>
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
          <button type="button" onClick={handleStartDemoMode} className="w-full mt-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3.5 rounded-[22px] font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 flex items-center justify-center gap-2"><Zap size={16} className="text-yellow-500"/>Coba Mode Demo (Tanpa Akun)</button>
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }} className="w-full mt-6 text-sm text-primary dark:text-blue-400 font-black hover:underline">{isRegistering ? 'Punya akun? Masuk di sini' : 'Baru di LimitWatch? Daftar gratis'}</button>
        </div>
      </div>
  );

  const isFormOrDetailView = ['FORM_TRANSACTION', 'FORM_CARD', 'FORM_SAVING', 'FORM_PIUTANG', 'VIEW_STATEMENT', 'VIEW_PROFILE'].includes(currentView);

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
              <DesktopNavItem icon={<HandCoins size={22}/>} label="Piutang" active={currentView === 'PIUTANGS'} onClick={() => navigateToRoot('PIUTANGS')} />
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
              title={
                currentView === 'DASHBOARD' ? 'Beranda' :
                currentView === 'CARDS' ? 'Kartu & Hutang' :
                currentView === 'TRANSACTIONS' ? 'Riwayat Aktivitas' :
                currentView === 'SAVINGS' ? 'Tabungan' :
                currentView === 'PIUTANGS' ? 'Piutang' :
                currentView === 'YEARLY' ? 'Anggaran Tahunan' :
                currentView === 'FORM_TRANSACTION' ? 'Input Transaksi' :
                currentView === 'FORM_SAVING' ? 'Input Tabungan' :
                currentView === 'FORM_PIUTANG' ? 'Input Piutang' :
                currentView === 'FORM_CARD' ? 'Input Kartu / Hutang' :
                currentView === 'FORM_TRANSFER_SAVING' ? 'Transfer Tabungan' :
                currentView.replace('FORM_', 'Input ').replace('VIEW_', 'Rincian ').replace('_', ' ')
              } 
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

          <main className={`flex-1 overflow-y-auto no-scrollbar ${isFormOrDetailView ? 'pb-4' : 'pb-24'} md:pb-10 bg-slate-50 dark:bg-slate-950`}>
            {renderCurrentView()}
          </main>

          {/* MOBILE BOTTOM NAV */}
          {!isFormOrDetailView && isMobileDevice && (
            <nav 
              className="fixed left-0 right-0 bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" 
              style={{ height: 'calc(56px + var(--sab, 0px))', paddingBottom: 'var(--sab, 0px)' }}
            >
              <div className="h-[56px] px-6 grid grid-cols-3 items-center max-w-lg mx-auto">
                <button onClick={()=>navigateToRoot('DASHBOARD')} className={`flex flex-col items-center justify-center gap-1 transition-all py-1 ${currentView === 'DASHBOARD' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><Home size={20} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Beranda</span></button>
                <button onClick={()=>navigateToRoot('SAVINGS')} className={`flex flex-col items-center justify-center gap-1 transition-all py-1 ${currentView === 'SAVINGS' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><Vault size={20} /><span className="text-[9px] font-black uppercase tracking-tighter shadow-sm leading-none">Tabung</span></button>
                <button onClick={()=>navigateToRoot('YEARLY')} className={`flex flex-col items-center justify-center gap-1 transition-all py-1 ${currentView === 'YEARLY' ? 'text-primary dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}><CalendarRange size={20} /><span className="text-[9px] font-black uppercase tracking-tighter leading-none">Tahun</span></button>
              </div>
            </nav>
          )}
        </div>
      </div>

      {/* AI ADVICE MODAL */}
      {aiAdviceModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
                  <Zap size={18} className="text-yellow-500" />
                </div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base">Analisis & Rekomendasi Gemini AI</h3>
              </div>
              <button onClick={() => setAiAdviceModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-500"><X size={20} /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 no-scrollbar">
              {aiAdviceLoading ? (
                <div className="py-16 text-center space-y-4 flex flex-col items-center">
                  <Loader2 size={40} className="text-indigo-600 animate-spin" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sedang menganalisis profil hutang & kartu kredit Anda...</p>
                </div>
              ) : (
                <div className="text-sm text-slate-700 dark:text-slate-200 space-y-3 leading-relaxed whitespace-pre-wrap font-medium">
                  {aiAdviceContent}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
              <button 
                type="button" 
                onClick={() => setAiAdviceModalOpen(false)} 
                className="px-6 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs rounded-xl hover:bg-slate-700 transition"
              >
                Tutup Analisis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
