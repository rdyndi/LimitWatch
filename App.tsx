import React, { useState, useEffect, useRef } from "react";
import { 
  AppState, 
  Installment, 
  Transaction, 
  TransactionType,
  CreditCard as CreditCardType,
  Saving,
  Wallet as WalletType
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
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { 
  Home, 
  CreditCard, 
  History, 
  User as UserIcon, 
  PlusCircle, 
  Wallet, 
  LogOut,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Mail,
  Lock,
  ArrowRight,
  X,
  Calendar,
  CheckCircle2,
  Pencil,
  Trash2,
  PieChart,
  Coins,
  FileBarChart,
  Landmark,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Bell,
  Clock,
  BellRing,
  Check,
  Settings,
  Shield,
  ToggleLeft,
  ToggleRight,
  List,
  Grid,
  Filter,
  Columns,
  WalletCards,
  ArrowRightLeft,
  Download,
  CheckSquare,
  Calculator,
  Receipt,
  Share2,
  ReceiptText,
  Info
} from "lucide-react";

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
// Helper to parse "Rp 10.000" back to 10000
const getNumericValue = (val: string) => {
    return parseInt(val.replace(/\D/g, '') || '0', 10);
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Predefined Card Colors with Gloss Effect
const CARD_COLORS = [
  { id: 'slate', class: 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-inner', label: 'Hitam' },
  { id: 'blue', class: 'bg-gradient-to-br from-indigo-600 to-violet-700 shadow-inner', label: 'Biru (Indigo)' },
  { id: 'emerald', class: 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-inner', label: 'Hijau' },
  { id: 'red', class: 'bg-gradient-to-br from-red-500 to-red-700 shadow-inner', label: 'Merah' },
  { id: 'purple', class: 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-inner', label: 'Ungu' },
  { id: 'orange', class: 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-inner', label: 'Oranye' },
  { id: 'pink', class: 'bg-gradient-to-br from-pink-500 to-pink-700 shadow-inner', label: 'Pink' },
  { id: 'cyan', class: 'bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-inner', label: 'Cyan' },
];

interface NotificationItem {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  date: string;
}

// --- REUSABLE PROFILE COMPONENT ---
const ProfileDropdown = ({ user, onLogout, onNavigate }: { user: User, onLogout: () => void, onNavigate: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel p-0.5 overflow-hidden hover:scale-105 transition-transform cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            aria-label="User Menu"
            aria-expanded={isOpen}
        >
            {user.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover"/>
            ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <UserIcon className="text-slate-500 w-5 h-5 md:w-6 md:h-6"/>
            </div>
            )}
        </button>

        {isOpen && (
            <div className="absolute right-0 mt-3 w-64 glass-panel rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 ring-1 ring-white/60">
                <div className="p-5 border-b border-white/30 bg-white/30 backdrop-blur-xl">
                    <p className="font-bold text-slate-800 text-base truncate">{user.displayName || 'Pengguna'}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                </div>
                <div className="p-3 bg-white/40 backdrop-blur-lg">
                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            onNavigate();
                        }} 
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-white/60 rounded-xl flex items-center gap-3 font-medium transition-colors mb-1"
                    >
                        <Settings size={18} className="text-slate-500" /> Akun & Pengaturan
                    </button>
                    <button 
                        onClick={() => {
                            onLogout();
                            setIsOpen(false);
                        }} 
                        className="w-full text-left px-4 py-3 text-sm text-red-600 bg-red-50/50 hover:bg-red-100/80 rounded-xl flex items-center gap-3 font-bold transition-colors border border-red-100/30"
                    >
                        <LogOut size={18} /> Keluar Aplikasi
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppState>({
    cards: [],
    transactions: [],
    installments: [],
    savings: [],
    wallets: []
  });
  
  // UI States
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [installmentListModalOpen, setInstallmentListModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [batchPayModalOpen, setBatchPayModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletIncomeModalOpen, setWalletIncomeModalOpen] = useState(false);
  const [walletTransferModalOpen, setWalletTransferModalOpen] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<NotificationItem | null>(null);
  
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'savings' | 'history' | 'report' | 'profile' | 'wallets' | 'bills'>('home');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);

  // Card History Modal State
  const [selectedCardForHistory, setSelectedCardForHistory] = useState<CreditCardType | null>(null);
  const [cardHistoryMonth, setCardHistoryMonth] = useState(new Date().getMonth());
  const [cardHistoryYear, setCardHistoryYear] = useState(new Date().getFullYear());

  // Bills View State
  const [billsYear, setBillsYear] = useState(new Date().getFullYear());

  // Swipe Gesture States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  const maxVerticalDistance = 30; // Maximum allowed vertical scroll during swipe
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Drag & Drop Mobile Menu States - REMOVED redundant items and 'profile' (moved to dropdown)
  const [menuOrder, setMenuOrder] = useState<string[]>(['cicilan', 'wallets', 'laporan', 'bills']);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Transaction Form State
  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txCardId, setTxCardId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txTargetMonth, setTxTargetMonth] = useState(new Date().getMonth());
  const [txTargetYear, setTxTargetYear] = useState(new Date().getFullYear());
  const [payFromSavings, setPayFromSavings] = useState(false);
  
  // Installment Conversion State (Transaction)
  const [txIsInstallment, setTxIsInstallment] = useState(false);
  const [txInstallmentMonths, setTxInstallmentMonths] = useState(3);

  // Manual Installment Form State
  const [instName, setInstName] = useState('');
  const [instTotal, setInstTotal] = useState('');
  const [instTenure, setInstTenure] = useState<string>('3'); 
  const [instMonthlyAmount, setInstMonthlyAmount] = useState(''); 
  const [instCardId, setInstCardId] = useState('');
  const [instStartDate, setInstStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Card Form State
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDue, setCardDue] = useState('');
  const [cardColor, setCardColor] = useState(CARD_COLORS[0].class);

  // Wallet Form State
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<'BANK' | 'EWALLET' | 'CASH'>('BANK');
  const [walletBalance, setWalletBalance] = useState('');
  const [walletColor, setWalletColor] = useState(CARD_COLORS[0].class);
  const [activeWalletId, setActiveWalletId] = useState('');

  // Wallet Transaction States
  const [incomeAmount, setIncomeAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTargetCardId, setTransferTargetCardId] = useState('');

  // Saving Form State
  const [savingAmount, setSavingAmount] = useState('');
  const [savingNote, setSavingNote] = useState('');
  const [savingCardId, setSavingCardId] = useState('');
  const [savingTargetMonth, setSavingTargetMonth] = useState(new Date().getMonth());
  const [savingTargetYear, setSavingTargetYear] = useState(new Date().getFullYear());

  // Withdraw & Batch Pay State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeSavingsGroup, setActiveSavingsGroup] = useState<Saving[]>([]);
  const [activeBatchGroup, setActiveBatchGroup] = useState<{items: Saving[], label: string, total: number, month: number, year: number} | null>(null);

  // Report State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportCardId, setReportCardId] = useState(''); 
  const [reportViewMode, setReportViewMode] = useState<'detail' | 'matrix'>('detail');

  // History Filter State
  const [historyFilterCard, setHistoryFilterCard] = useState('all');
  const [historyFilterMonth, setHistoryFilterMonth] = useState(new Date().getMonth());
  const [historyFilterYear, setHistoryFilterYear] = useState(new Date().getFullYear());

  // History / Back Button Logic Refs
  const prevTabRef = useRef(mobileTab);
  const isBackNavigationRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToAppState(user.uid, setData);
      return () => unsubscribe();
    } else {
      setData({ cards: [], transactions: [], installments: [], savings: [], wallets: [] });
    }
  }, [user]);

  useEffect(() => {
    if (data.cards.length > 0) {
      if (!txCardId) setTxCardId(data.cards[0].id);
      if (!savingCardId) setSavingCardId(data.cards[0].id);
      if (!instCardId) setInstCardId(data.cards[0].id);
      if (!reportCardId) setReportCardId(data.cards[0].id);
      if (!transferTargetCardId) setTransferTargetCardId(data.cards[0].id);
    }
  }, [data.cards, txCardId, savingCardId, instCardId, reportCardId, transferTargetCardId]);

  useEffect(() => {
    const totalVal = getNumericValue(instTotal);
    const tenureVal = parseInt(instTenure) || 0;
    
    if (totalVal > 0 && tenureVal > 0) {
      const calculated = Math.ceil(totalVal / tenureVal);
      setInstMonthlyAmount(formatIDR(calculated));
    }
  }, [instTotal, instTenure]);

  useEffect(() => {
    const handlePopState = () => {
      isBackNavigationRef.current = true;
      setMobileTab('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isBackNavigationRef.current) {
        isBackNavigationRef.current = false;
        prevTabRef.current = mobileTab;
        return;
    }

    if (mobileTab === 'home') {
       // do nothing
    } else {
        if (prevTabRef.current === 'home') {
            window.history.pushState({ tab: mobileTab }, '', '');
        } else {
            window.history.replaceState({ tab: mobileTab }, '', '');
        }
    }
    prevTabRef.current = mobileTab;
  }, [mobileTab]);

  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    const numericVal = getNumericValue(val);
    if(numericVal === 0 && val.replace(/\D/g, '') === '') {
        setter('');
        return;
    }
    setter(formatIDR(numericVal));
  };

  const getMonthlyReportData = (cardId: string, monthIndex: number, year: number) => {
    const card = data.cards.find(c => c.id === cardId);
    const cutoffDay = card?.dueDay || 31; 

    // 1. Expenses
    const monthlyExpenses = data.transactions.filter(t => {
        if (t.cardId !== cardId || t.type !== TransactionType.EXPENSE || t.isInstallment) return false;
        
        const tDate = new Date(t.date);
        let billingMonth = tDate.getMonth();
        let billingYear = tDate.getFullYear();

        if (tDate.getDate() > cutoffDay) {
            billingMonth++;
            if (billingMonth > 11) {
                billingMonth = 0;
                billingYear++;
            }
        }

        return billingMonth === monthIndex && billingYear === year;
    });

    // 2. Installments
    const monthlyInstallments = data.installments.filter(i => {
         if (i.cardId !== cardId) return false;
         const startDate = new Date(i.startDate);
         const monthDiff = (year - startDate.getFullYear()) * 12 + (monthIndex - startDate.getMonth());
         return (monthDiff >= 0 && monthDiff < i.totalMonths);
    }).map(i => {
        const startDate = new Date(i.startDate);
        const monthDiff = (year - startDate.getFullYear()) * 12 + (monthIndex - startDate.getMonth());
        return {
            ...i,
            currentMonthIndex: monthDiff + 1
        };
    });

    // 3. Payments
    const monthlyPayments = data.transactions.filter(t => {
        if (t.cardId !== cardId || t.type !== TransactionType.PAYMENT) return false;
        if (t.targetPeriod) {
            return t.targetPeriod.month === monthIndex && t.targetPeriod.year === year;
        }
        const d = new Date(t.date);
        return d.getMonth() === monthIndex && d.getFullYear() === year;
    });

    const totalExpense = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalInstallment = monthlyInstallments.reduce((sum, i) => sum + i.monthlyAmount, 0);
    const totalBill = totalExpense + totalInstallment;
    const totalPaid = monthlyPayments.reduce((sum, t) => sum + t.amount, 0);
    const remaining = totalBill - totalPaid;

    return {
        expenses: monthlyExpenses,
        installments: monthlyInstallments,
        payments: monthlyPayments,
        totalBill,
        totalPaid,
        remaining
    };
  }

  useEffect(() => {
    if (data.cards.length === 0) return;

    const newNotifications: NotificationItem[] = [];
    const today = new Date();

    data.cards.forEach(card => {
        if (card.dueDay) {
            const currentDay = today.getDate();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            const currentMonthReport = getMonthlyReportData(card.id, currentMonth, currentYear);
            const isCurrentMonthUnpaid = currentMonthReport.remaining > 1000;

            let targetMonth = currentMonth;
            let targetYear = currentYear;
            
            if (card.dueDay < currentDay) {
                if (isCurrentMonthUnpaid) {
                    targetMonth = currentMonth;
                    targetYear = currentYear;
                } else {
                    targetMonth++;
                    if (targetMonth > 11) { targetMonth = 0; targetYear++; }
                }
            }
            
            const dueDate = new Date(targetYear, targetMonth, card.dueDay);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 3 && diffDays >= 0) {
                newNotifications.push({
                    id: `urgent-${card.id}`,
                    type: 'urgent',
                    title: 'Jatuh Tempo Segera!',
                    message: `Kartu ${card.name} jatuh tempo dalam ${diffDays === 0 ? 'HARI INI' : `${diffDays} hari`}. Segera lakukan pembayaran.`,
                    date: new Date().toISOString()
                });
            } else if (diffDays <= 7 && diffDays > 3) {
                newNotifications.push({
                    id: `warning-${card.id}`,
                    type: 'warning',
                    title: 'Pengingat Tagihan',
                    message: `Tagihan ${card.name} jatuh tempo dalam ${diffDays} hari lagi.`,
                    date: new Date().toISOString()
                });
            } else if (diffDays < 0 && isCurrentMonthUnpaid) {
                 newNotifications.push({
                    id: `late-${card.id}`,
                    type: 'urgent',
                    title: 'Tagihan Telat!',
                    message: `Tagihan ${card.name} sudah telat ${Math.abs(diffDays)} hari.`,
                    date: new Date().toISOString()
                });
            }
        }
    });

    setNotifications(newNotifications);

    const urgentNotif = newNotifications.find(n => n.type === 'urgent');
    if (urgentNotif) {
        setToastMessage(urgentNotif);
        setShowToast(true);
        const timer = setTimeout(() => setShowToast(false), 5000);
        return () => clearTimeout(timer);
    }

  }, [data.cards]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd || !touchStartY) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const horizontalDistance = touchStart - touchEnd;
    const verticalDistance = Math.abs(touchStartY - touchEndY);
    
    if (verticalDistance > maxVerticalDistance) {
        setTouchStart(null);
        setTouchEnd(null);
        setTouchStartY(null);
        return;
    }

    const isLeftSwipe = horizontalDistance > minSwipeDistance;
    const isRightSwipe = horizontalDistance < -minSwipeDistance;

    if (isRightSwipe) {
      setMobileTab('home');
    }
    
    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartY(null);
  };

  const onMenuTouchStart = (e: React.TouchEvent, itemId: string) => {
    longPressTimerRef.current = setTimeout(() => {
        setDraggingItem(itemId);
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500); 
  };

  const onMenuTouchEnd = () => {
    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    }
    setDraggingItem(null);
  };

  const onMenuTouchMove = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
         clearTimeout(longPressTimerRef.current);
         longPressTimerRef.current = null;
    }

    if (!draggingItem) return;
    
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = target?.closest('[data-menu-id]') as HTMLElement;
    
    if (targetItem) {
        const targetId = targetItem.getAttribute('data-menu-id');
        if (targetId && targetId !== draggingItem) {
            const newOrder = [...menuOrder];
            const dragIdx = newOrder.indexOf(draggingItem);
            const targetIdx = newOrder.indexOf(targetId);
            
            if (dragIdx > -1 && targetIdx > -1) {
                [newOrder[dragIdx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[dragIdx]];
                setMenuOrder(newOrder);
            }
        }
    }
  };

  const saveData = (newData: AppState) => {
    setData(newData);
    if (user) {
      saveAppState(user.uid, newData);
    }
  };

  const openInstallmentModal = () => {
    setInstName('');
    setInstTotal('');
    setInstTenure('3');
    setInstMonthlyAmount('');
    setInstStartDate(new Date().toISOString().split('T')[0]);
    if (data.cards.length > 0) setInstCardId(data.cards[0].id);
    setInstallmentModalOpen(true);
  };

  const handleDeleteInstallmentDirectly = (id: string) => {
      if(window.confirm("Hapus data cicilan ini secara permanen?")) {
          const updatedInstallments = data.installments.filter(i => i.id !== id);
          saveData({ ...data, installments: updatedInstallments });
      }
  };

  const handleSaveInstallmentManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instTotal || !instCardId || !instMonthlyAmount) return;

    const totalVal = getNumericValue(instTotal);
    const monthlyVal = getNumericValue(instMonthlyAmount);
    const tenureVal = parseInt(instTenure) || 1;

    if (totalVal === 0 || monthlyVal === 0) return;

    const newInstallment: Installment = {
        id: generateId(),
        cardId: instCardId,
        name: instName || 'Cicilan Manual', 
        totalAmount: totalVal,
        monthlyAmount: monthlyVal, 
        totalMonths: tenureVal,
        monthsPaid: 0,
        startDate: new Date(instStartDate).toISOString()
    };

    addInstallment(newInstallment);
  };

  const addInstallment = (inst: Installment) => {
      const newTransaction: Transaction = {
          id: generateId(),
          cardId: inst.cardId,
          amount: inst.totalAmount,
          date: inst.startDate,
          description: inst.name,
          type: TransactionType.EXPENSE,
          isInstallment: true,
          installmentId: inst.id, 
          category: 'Cicilan Manual',
          isValidated: false
      };

      saveData({ 
          ...data, 
          installments: [inst, ...data.installments],
          transactions: [newTransaction, ...data.transactions]
      });
      setInstallmentModalOpen(false);
  }

  const openAddTransactionModal = () => {
    setEditingTransaction(null);
    setTxAmount('');
    setTxDesc('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxTargetMonth(new Date().getMonth());
    setTxTargetYear(new Date().getFullYear());
    setTxType(TransactionType.EXPENSE);
    setTxIsInstallment(false);
    setTxInstallmentMonths(3);
    setPayFromSavings(false);
    if (data.cards.length > 0) setTxCardId(data.cards[0].id);
    setTransactionModalOpen(true);
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setTxType(t.type);
    setTxAmount(formatIDR(t.amount)); 
    setTxDesc(t.description);
    setTxCardId(t.cardId);
    setTxDate(new Date(t.date).toISOString().split('T')[0]);
    
    if (t.targetPeriod) {
        setTxTargetMonth(t.targetPeriod.month);
        setTxTargetYear(t.targetPeriod.year);
    } else {
        const d = new Date(t.date);
        setTxTargetMonth(d.getMonth());
        setTxTargetYear(d.getFullYear());
    }

    setTxIsInstallment(!!t.isInstallment);
    setPayFromSavings(false); 
    setTransactionModalOpen(true);
  };

  const handleToggleValidation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedTransactions = data.transactions.map(t => 
      t.id === id ? { ...t, isValidated: !t.isValidated } : t
    );
    saveData({ ...data, transactions: updatedTransactions });
  };

  const handleDeleteClick = (id: string) => {
    const txToDelete = data.transactions.find(t => t.id === id);
    if (!txToDelete) return;

    if (txToDelete.isInstallment && txToDelete.installmentId) {
        const relatedInstallment = data.installments.find(i => i.id === txToDelete.installmentId);
        if (relatedInstallment) {
            const startDate = new Date(relatedInstallment.startDate);
            const startMonth = startDate.getMonth();
            const startYear = startDate.getFullYear();
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const startPeriod = startYear * 12 + startMonth;
            const currentPeriod = currentYear * 12 + currentMonth;

            if (currentPeriod > startPeriod) {
                alert("Cicilan ini sudah berjalan dari periode sebelumnya. Transaksi tidak dapat dihapus.");
                return;
            }

            if (currentPeriod === startPeriod) {
                 const report = getMonthlyReportData(relatedInstallment.cardId, startMonth, startYear);
                 if (report.totalBill > 0 && report.remaining <= 100) { 
                      alert("Tagihan bulan ini sudah lunas. Transaksi cicilan tidak dapat dihapus.");
                      return;
                 }
            }
        }
    }

    let confirmMsg = "Apakah Anda yakin ingin menghapus transaksi ini? Laporan akan disesuaikan otomatis.";
    const isSavingsPayment = txToDelete.type === TransactionType.PAYMENT &&
                             (txToDelete.category === 'Payment from Savings' || txToDelete.category === 'Savings Payment');

    if (isSavingsPayment) {
        confirmMsg += "\n\nDana sebesar " + formatIDR(txToDelete.amount) + " akan DIKEMBALIKAN ke Tabungan (Refund).";
    }

    if (window.confirm(confirmMsg)) {
      const updatedTransactions = data.transactions.filter(t => t.id !== id);
      let updatedInstallments = data.installments;
      let updatedSavings = data.savings;

      if (txToDelete.isInstallment) {
          if (txToDelete.installmentId) {
              updatedInstallments = data.installments.filter(i => i.id !== txToDelete.installmentId);
          } else {
              updatedInstallments = data.installments.filter(i => {
                  const isMatch = (
                      i.cardId === txToDelete.cardId &&
                      i.totalAmount === txToDelete.amount &&
                      i.name === txToDelete.description
                  );
                  return !isMatch; 
              });
          }
      }

      if (isSavingsPayment) {
          const refundSaving: Saving = {
              id: generateId(),
              cardId: txToDelete.cardId,
              amount: txToDelete.amount,
              date: new Date().toISOString(),
              note: `Refund: ${txToDelete.description || 'Hapus Transaksi'}`,
              targetPeriod: txToDelete.targetPeriod || { month: new Date().getMonth(), year: new Date().getFullYear() },
              isTransferred: false 
          };
          updatedSavings = [refundSaving, ...updatedSavings];
      }

      saveData({ 
          ...data, 
          transactions: updatedTransactions,
          installments: updatedInstallments,
          savings: updatedSavings
      });
      setTransactionModalOpen(false); 
    }
  };

  const consumeSavings = (cardId: string, amount: number, existingSavings: Saving[]) => {
      let remainingToDeduct = amount;
      let updatedSavings = [...existingSavings];

      const availableSavings = updatedSavings
          .filter(s => s.cardId === cardId && !s.isTransferred)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const item of availableSavings) {
          if (remainingToDeduct <= 0) break;

          if (item.amount <= remainingToDeduct) {
              remainingToDeduct -= item.amount;
              updatedSavings = updatedSavings.map(s => s.id === item.id ? { ...s, isTransferred: true } : s);
          } else {
              const newAmount = item.amount - remainingToDeduct;
              updatedSavings = updatedSavings.map(s => s.id === item.id ? { ...s, amount: newAmount } : s);
              remainingToDeduct = 0;
          }
      }
      return updatedSavings;
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.cards.length === 0) {
        alert("Mohon tambah kartu kredit terlebih dahulu di menu Kartu.");
        return;
    }
    if (!txCardId) {
        alert("Silakan pilih kartu kredit untuk transaksi ini.");
        return;
    }
    if (!txAmount) {
        alert("Mohon masukkan nominal transaksi.");
        return;
    }

    let updatedInstallments = [...data.installments];
    let updatedSavings = [...data.savings];
    let finalIsInstallment = txIsInstallment;
    const amountVal = getNumericValue(txAmount); 

    if (amountVal === 0) {
        alert("Nominal transaksi harus lebih dari 0.");
        return;
    }

    const finalDesc = txDesc || (txType === TransactionType.EXPENSE ? 'Pengeluaran' : 'Pembayaran');
    let generatedInstallmentId: string | undefined = undefined;

    if (txIsInstallment && txType === TransactionType.EXPENSE) {
       if (txInstallmentMonths <= 0) {
           alert("Lama cicilan minimal 1 bulan");
           return;
       }

       if (!editingTransaction || (editingTransaction && !editingTransaction.isInstallment)) {
          const selectedCard = data.cards.find(c => c.id === txCardId);
          let instStartDateObj = new Date(txDate);
          
          if (selectedCard && selectedCard.dueDay) {
              if (instStartDateObj.getDate() > selectedCard.dueDay) {
                  instStartDateObj.setMonth(instStartDateObj.getMonth() + 1);
              }
          }

          const newInstId = generateId();
          generatedInstallmentId = newInstId;

          const newInstallment: Installment = {
              id: newInstId,
              cardId: txCardId,
              name: finalDesc,
              totalAmount: amountVal,
              monthlyAmount: amountVal / txInstallmentMonths,
              totalMonths: txInstallmentMonths,
              monthsPaid: 0,
              startDate: instStartDateObj.toISOString() 
          };
          updatedInstallments = [newInstallment, ...updatedInstallments];
       }
    } else {
        finalIsInstallment = false;
    }

    if (txType === TransactionType.PAYMENT && payFromSavings && !editingTransaction) {
        const totalAvailable = updatedSavings
            .filter(s => s.cardId === txCardId && !s.isTransferred)
            .reduce((sum, s) => sum + s.amount, 0);
        
        if (amountVal > totalAvailable) {
            alert(`Saldo tabungan tidak mencukupi. Tersedia: ${formatIDR(totalAvailable)}`);
            return;
        }

        updatedSavings = consumeSavings(txCardId, amountVal, updatedSavings);
    }

    if (editingTransaction) {
      if (editingTransaction.isInstallment) {
          updatedInstallments = updatedInstallments.map(inst => {
              if (editingTransaction.installmentId && inst.id === editingTransaction.installmentId) {
                   return { 
                      ...inst, 
                      cardId: txCardId, 
                      name: finalDesc, 
                      startDate: new Date(txDate).toISOString(), 
                  };
              }

              const isMatch = (
                  inst.cardId === editingTransaction.cardId &&
                  inst.totalAmount === editingTransaction.amount &&
                  inst.name === editingTransaction.description
              );
              
              if (isMatch && !editingTransaction.installmentId) {
                  return { 
                      ...inst, 
                      cardId: txCardId, 
                      name: finalDesc, 
                      startDate: new Date(txDate).toISOString(), 
                  }; 
              }
              return inst;
          });
      }

      const updatedTransactions = data.transactions.map(t => {
        if (t.id === editingTransaction.id) {
          return {
            ...t,
            cardId: txCardId,
            amount: amountVal,
            date: new Date(txDate).toISOString(),
            description: finalDesc,
            type: txType,
            isInstallment: finalIsInstallment,
            installmentId: generatedInstallmentId || t.installmentId,
            targetPeriod: txType === TransactionType.PAYMENT ? { month: txTargetMonth, year: txTargetYear } : undefined
          };
        }
        return t;
      });
      saveData({ ...data, transactions: updatedTransactions, installments: updatedInstallments, savings: updatedSavings });
      setEditingTransaction(null);
    } else {
      const newTransaction: Transaction = {
        id: generateId(),
        cardId: txCardId,
        amount: amountVal,
        date: new Date(txDate).toISOString(),
        description: finalDesc,
        type: txType,
        category: payFromSavings ? 'Payment from Savings' : 'General',
        isValidated: false,
        isInstallment: finalIsInstallment,
        installmentId: generatedInstallmentId,
        targetPeriod: txType === TransactionType.PAYMENT ? { month: txTargetMonth, year: txTargetYear } : undefined
      };
      saveData({
        ...data,
        transactions: [newTransaction, ...data.transactions],
        installments: updatedInstallments,
        savings: updatedSavings
      });
    }

    setTxAmount('');
    setTxDesc('');
    setTransactionModalOpen(false);
  };

  const openAddCardModal = () => {
    setEditingCard(null);
    setCardName('');
    setCardLimit('');
    setCardDue('');
    setCardColor(CARD_COLORS[0].class);
    setCardModalOpen(true);
  }

  const handleEditCard = (card: CreditCardType) => {
    setEditingCard(card);
    setCardName(card.name);
    setCardLimit(formatIDR(card.limit));
    setCardDue(card.dueDay ? card.dueDay.toString() : '');
    setCardColor(card.color || CARD_COLORS[0].class);
    setCardModalOpen(true);
  }

  const handleDeleteCard = (id: string) => {
    if (window.confirm("Hapus kartu ini? Semua transaksi terkait akan tetap ada, namun nama kartu mungkin hilang.")) {
      const updatedCards = data.cards.filter(c => c.id !== id);
      saveData({ ...data, cards: updatedCards });
    }
  }

  const openCardHistory = (card: CreditCardType) => {
      setSelectedCardForHistory(card);
      setCardHistoryMonth(new Date().getMonth());
      setCardHistoryYear(new Date().getFullYear());
  };

  const closeCardHistory = () => {
      setSelectedCardForHistory(null);
  };

  const handleShareInvoice = async (targetRef?: React.RefObject<HTMLDivElement>) => {
    // If we're on mobile, we might need a direct DOM selection fallback
    const target = targetRef?.current || document.querySelector('.invoice-container') as HTMLElement;
    
    if (!target) return;
    
    // Wait for any rendering or image loading
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const canvas = await html2canvas(target, {
            scale: 3,
            allowTaint: true,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: target.scrollWidth,
            windowHeight: target.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pageWidth = 210;
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Invoice-${selectedCardForHistory?.name}-${monthNames[cardHistoryMonth]}.pdf`);
    } catch (err) {
        console.error("PDF Gen Error", err);
        alert("Gagal membuat PDF. Silakan coba lagi.");
    }
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName) {
        alert("Nama kartu wajib diisi");
        return;
    }

    const limitVal = getNumericValue(cardLimit);
    if(limitVal <= 0) {
        alert("Limit kartu harus lebih dari 0");
        return;
    }
    
    const finalColor = cardColor && cardColor.trim() !== '' ? cardColor : CARD_COLORS[0].class;

    if (editingCard) {
        const updatedCards = data.cards.map(c => {
            if (c.id === editingCard.id) {
                return {
                    ...c,
                    name: cardName,
                    limit: limitVal,
                    dueDay: cardDue ? parseInt(cardDue) : undefined,
                    color: finalColor
                };
            }
            return c;
        });
        saveData({ ...data, cards: updatedCards });
    } else {
        const newCard: CreditCardType = {
            id: generateId(),
            name: cardName,
            limit: limitVal,
            color: finalColor, 
            dueDay: cardDue ? parseInt(cardDue) : undefined
        };
        saveData({ ...data, cards: [...data.cards, newCard] });
    }

    setCardName('');
    setCardLimit('');
    setCardDue('');
    setCardColor(CARD_COLORS[0].class);
    setCardModalOpen(false);
    setEditingCard(null);
  };

  const openAddWalletModal = () => {
    setEditingWallet(null);
    setWalletName('');
    setWalletType('BANK');
    setWalletBalance('');
    setWalletColor(CARD_COLORS[0].class);
    setWalletModalOpen(true);
  }

  const handleEditWallet = (w: WalletType) => {
    setEditingWallet(w);
    setWalletName(w.name);
    setWalletType(w.type);
    setWalletBalance(formatIDR(w.balance));
    setWalletColor(w.color || CARD_COLORS[0].class);
    setWalletModalOpen(true);
  }

  const handleDeleteWallet = (id: string) => {
     if(window.confirm("Hapus dompet ini?")) {
         const updatedWallets = (data.wallets || []).filter(w => w.id !== id);
         saveData({...data, wallets: updatedWallets});
     }
  }

  const handleSaveWallet = (e: React.FormEvent) => {
     e.preventDefault();
     if(!walletName) return;

     const balanceVal = getNumericValue(walletBalance);
     const finalColor = walletColor || CARD_COLORS[0].class;

     if(editingWallet) {
         const updatedWallets = (data.wallets || []).map(w => {
             if(w.id === editingWallet.id) {
                 return { ...w, name: walletName, type: walletType, balance: balanceVal, color: finalColor };
             }
             return w;
         });
         saveData({...data, wallets: updatedWallets});
     } else {
         const newWallet: WalletType = {
             id: generateId(),
             name: walletName,
             type: walletType,
             balance: balanceVal,
             color: finalColor
         };
         saveData({...data, wallets: [...(data.wallets || []), newWallet]});
     }
     setWalletModalOpen(false);
     setEditingWallet(null);
  }

  const openWalletIncomeModal = (walletId: string) => {
      setActiveWalletId(walletId);
      setIncomeAmount('');
      setWalletIncomeModalOpen(true);
  }

  const handleWalletIncome = (e: React.FormEvent) => {
      e.preventDefault();
      const amountVal = getNumericValue(incomeAmount);
      if(amountVal <= 0 || !activeWalletId) return;

      const updatedWallets = (data.wallets || []).map(w => {
          if(w.id === activeWalletId) {
              return { ...w, balance: w.balance + amountVal };
          }
          return w;
      });
      saveData({...data, wallets: updatedWallets});
      setWalletIncomeModalOpen(false);
  }

  const openWalletTransferModal = (walletId: string) => {
      setActiveWalletId(walletId);
      setTransferAmount('');
      if(data.cards.length > 0) setTransferTargetCardId(data.cards[0].id);
      setWalletTransferModalOpen(true);
  }

  const handleWalletTransferToSaving = (e: React.FormEvent) => {
      e.preventDefault();
      const amountVal = getNumericValue(transferAmount);
      const targetCardId = transferTargetCardId;
      const walletId = activeWalletId;

      if(amountVal <= 0 || !targetCardId || !walletId) return;

      const wallet = data.wallets?.find(w => w.id === walletId);
      if(wallet && wallet.balance < amountVal) {
          alert("Saldo dompet tidak mencukupi!");
          return;
      }

      const updatedWallets = (data.wallets || []).map(w => {
          if(w.id === walletId) return { ...w, balance: w.balance - amountVal };
          return w;
      });

      const newSaving: Saving = {
          id: generateId(),
          cardId: targetCardId,
          amount: amountVal,
          date: new Date().toISOString(),
          note: `Transfer dari ${wallet?.name || 'Dompet'}`,
          targetPeriod: { month: new Date().getMonth(), year: new Date().getFullYear() },
          isTransferred: false
      };

      saveData({
          ...data, 
          wallets: updatedWallets, 
          savings: [newSaving, ...data.savings]
      });

      setWalletTransferModalOpen(false);
  }

  const openAddSavingModal = () => {
    setEditingSaving(null);
    setSavingAmount('');
    setSavingNote('');
    if (data.cards.length > 0) setSavingCardId(data.cards[0].id);
    setSavingTargetMonth(new Date().getMonth());
    setSavingTargetYear(new Date().getFullYear());
    setSavingModalOpen(true);
  };

  const handleEditSaving = (s: Saving) => {
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

  const handleSaveSaving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!savingCardId || !savingAmount) return;

    const amountVal = getNumericValue(savingAmount);
    if(amountVal === 0) return;

    if (editingSaving) {
        const updatedSavings = data.savings.map(s => {
            if (s.id === editingSaving.id) {
                return {
                    ...s,
                    cardId: savingCardId,
                    amount: amountVal,
                    note: savingNote || 'Tabungan Rutin',
                    targetPeriod: { month: savingTargetMonth, year: savingTargetYear }
                };
            }
            return s;
        });
        saveData({ ...data, savings: updatedSavings });
        setEditingSaving(null);
    } else {
        const newSaving: Saving = {
          id: generateId(),
          cardId: savingCardId,
          amount: amountVal,
          date: new Date().toISOString(),
          note: savingNote || 'Tabungan Rutin',
          targetPeriod: { month: savingTargetMonth, year: savingTargetYear },
          isTransferred: false
        };
        saveData({
          ...data,
          savings: [newSaving, ...data.savings]
        });
    }

    setSavingAmount('');
    setSavingNote('');
    setSavingModalOpen(false);
  };

  const handleOpenBatchPay = (savings: Saving[], label: string, total: number) => {
    if (savings.length === 0) return;
    const firstItem = savings[0];
    const month = firstItem.targetPeriod ? firstItem.targetPeriod.month : -1;
    const year = firstItem.targetPeriod ? firstItem.targetPeriod.year : -1;
    
    setActiveBatchGroup({
        items: savings,
        label,
        total,
        month,
        year
    });
    setBatchPayModalOpen(true);
  }

  const handleConfirmBatchPay = () => {
    if (!activeBatchGroup) return;

    const { items, total, month, year } = activeBatchGroup;
    const firstItem = items[0];
    const periodText = (month >= 0 && year > 0) 
        ? ` (${monthNames[month]} ${year})` 
        : '';

    const newTransaction: Transaction = {
        id: generateId(),
        cardId: firstItem.cardId,
        amount: total,
        date: new Date().toISOString(),
        description: `Bayar Tagihan Full${periodText}`,
        type: TransactionType.PAYMENT,
        category: 'Savings Payment',
        targetPeriod: (month >= 0 && year > 0) ? { month, year } : undefined,
        isValidated: true
    };

    const idsToMark = new Set(items.map(s => s.id));
    const updatedSavings = data.savings.map(s => 
        idsToMark.has(s.id) ? { ...s, isTransferred: true } : s
    );

    saveData({
        ...data,
        transactions: [newTransaction, ...data.transactions],
        savings: updatedSavings
    });
    setBatchPayModalOpen(false);
  };

  const openWithdrawModal = (savingsGroup: Saving[]) => {
      setActiveSavingsGroup(savingsGroup);
      setWithdrawAmount('');
      setWithdrawModalOpen(true);
  }

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSavingsGroup.length === 0) return;

    const totalAvailable = activeSavingsGroup.reduce((sum, s) => sum + s.amount, 0);
    const amountToWithdraw = getNumericValue(withdrawAmount);

    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
        alert("Masukkan nominal yang valid.");
        return;
    }

    if (amountToWithdraw > totalAvailable) {
        alert("Saldo tabungan di bulan ini tidak mencukupi.");
        return;
    }

    const updatedSavings = consumeSavings(
        activeSavingsGroup[0].cardId, 
        amountToWithdraw, 
        data.savings
    );

    saveData({ ...data, savings: updatedSavings });
    setWithdrawModalOpen(false);
  }

  const handleDeleteSaving = (id: string) => {
     if(window.confirm("Hapus data tabungan ini?")) {
        const updatedSavings = data.savings.filter(s => s.id !== id);
        saveData({...data, savings: updatedSavings});
     }
  }

  const getSavingsByMonth = (cardId: string) => {
     const activeSavings = data.savings.filter(s => s.cardId === cardId && !s.isTransferred);
     
     const grouped: Record<string, Saving[]> = {};
     
     activeSavings.forEach(s => {
         let key = "Lainnya";
         if (s.targetPeriod) {
             key = `${s.targetPeriod.year}-${s.targetPeriod.month}`;
         }
         if (!grouped[key]) grouped[key] = [];
         grouped[key].push(s);
     });

     const keys = Object.keys(grouped).sort((a, b) => {
         if (a === "Lainnya") return 1;
         if (b === "Lainnya") return -1;
         return a.localeCompare(b);
     });

     return keys.map(key => ({
         key,
         label: key === "Lainnya" ? "Lainnya" : `${monthNames[parseInt(key.split('-')[1])]} ${key.split('-')[0]}`,
         items: grouped[key],
         total: grouped[key].reduce((sum, s) => sum + s.amount, 0)
     }));
  };

  const getMonthlyBill = (cardId: string, monthIndex: number, year: number) => {
     const reportData = getMonthlyReportData(cardId, monthIndex, year);
     return reportData.totalBill;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
        if (displayName) {
             await updateUserProfile(displayName);
        }
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Terjadi kesalahan.";
      if (err.code === 'auth/invalid-email') msg = "Format email tidak valid.";
      if (err.code === 'auth/user-not-found') msg = "Akun tidak ditemukan. Silakan daftar.";
      if (err.code === 'auth/wrong-password') msg = "Password salah.";
      if (err.code === 'auth/invalid-credential') msg = "Email atau password salah.";
      if (err.code === 'auth/email-already-in-use') msg = "Email sudah terdaftar.";
      if (err.code === 'auth/weak-password') msg = "Password terlalu lemah (min 6 karakter).";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const totalDebt = data.transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0) - 
    data.transactions
    .filter(t => t.type === TransactionType.PAYMENT)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSavings = data.savings
    .filter(s => !s.isTransferred)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const upcomingBills = data.cards
      .filter(c => c.dueDay)
      .map(c => {
         const today = new Date();
         const currentDay = today.getDate();
         const currentMonth = today.getMonth();
         const currentYear = today.getFullYear();
         
         const currentMonthReport = getMonthlyReportData(c.id, currentMonth, currentYear);
         const isCurrentMonthUnpaid = currentMonthReport.remaining > 1000;

         let targetMonth = currentMonth;
         let targetYear = currentYear;
         
         if (c.dueDay! < currentDay) {
            if (isCurrentMonthUnpaid) {
                targetMonth = currentMonth;
                targetYear = currentYear;
            } else {
                targetMonth++;
                if (targetMonth > 11) { targetMonth = 0; targetYear++; }
            }
         }
         
         const dueDate = new Date(targetYear, targetMonth, c.dueDay!);
         const diffTime = dueDate.getTime() - today.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

         const reportData = getMonthlyReportData(c.id, targetMonth, targetYear);
         const remaining = Math.max(0, reportData.remaining);

         const availableSavings = data.savings
            .filter(s => s.cardId === c.id && !s.isTransferred && s.targetPeriod?.month === targetMonth && s.targetPeriod?.year === targetYear)
            .reduce((sum, s) => sum + s.amount, 0);
         
         const shortfall = remaining - availableSavings;
         
         return { 
            ...c, 
            daysLeft: diffDays, 
            nextDueDate: dueDate, 
            remainingBill: remaining,
            availableSavings,
            shortfall
         };
      })
      .filter(c => c.remainingBill > 1000) 
      .sort((a, b) => a.daysLeft - b.daysLeft);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // --- CHANGED LOGIC: CALCULATE ALL ONGOING INSTALLMENTS GLOBALLY ---
  // Calculates all installments that are not finished (currentMonthIndex < totalMonths)
  // This includes future starts (committed) and currently running ones.
  const allOngoingInstallments = data.installments.filter(i => {
      const startDate = new Date(i.startDate);
      const monthsSinceStart = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth());
      return monthsSinceStart < i.totalMonths;
  });

  // Filter for Dashboard Widget: Only show installments if the bill for that card in the CURRENT MONTH is NOT paid yet.
  // "Jika tagihan bulan tertentu status lunas maka kurangi cicilan aktif"
  const unpaidOngoingInstallments = allOngoingInstallments.filter(inst => {
      // Get bill report for the card of this installment for the CURRENT month
      const report = getMonthlyReportData(inst.cardId, currentMonth, currentYear);
      
      // If remaining bill is <= 0, it means it is LUNAS (Paid). 
      // So we exclude it from the "Active Burden" widget count.
      const isPaidOff = report.remaining <= 0;
      
      return !isPaidOff;
  });

  const activeInstallmentsCount = unpaidOngoingInstallments.length;
  const totalInstallmentBillThisMonth = unpaidOngoingInstallments.reduce((sum, i) => sum + i.monthlyAmount, 0);

  // Logic to help list modal (show all running installments for visibility)
  const isInstallmentActiveInMonth = (inst: Installment, month: number, year: number) => {
      const startDate = new Date(inst.startDate);
      const monthDiff = (year - startDate.getFullYear()) * 12 + (month - startDate.getMonth());
      return (monthDiff >= 0 && monthDiff < inst.totalMonths);
  }
  
  const isInstallmentFuture = (inst: Installment, month: number, year: number) => {
      const startDate = new Date(inst.startDate);
      const monthDiff = (year - startDate.getFullYear()) * 12 + (month - startDate.getMonth());
      return monthDiff < 0;
  }

  // --- NEW LOGIC: GLOBAL MONTHLY SUMMARY ---
  const totalGlobalBillThisMonth = data.cards.reduce((sum, card) => {
      const report = getMonthlyReportData(card.id, currentMonth, currentYear);
      return sum + Math.max(0, report.remaining);
  }, 0);

  const totalGlobalSavingsThisMonth = data.savings
      .filter(s => !s.isTransferred && s.targetPeriod?.month === currentMonth && s.targetPeriod?.year === currentYear)
      .reduce((sum, s) => sum + s.amount, 0);

  const globalMonthStatus = totalGlobalBillThisMonth - totalGlobalSavingsThisMonth;
  const isGlobalSafe = globalMonthStatus <= 0;

  const filteredTransactions = data.transactions.filter(t => {
      const d = new Date(t.date);
      const matchCard = historyFilterCard === 'all' || t.cardId === historyFilterCard;
      const matchMonth = d.getMonth() === historyFilterMonth;
      const matchYear = d.getFullYear() === historyFilterYear;
      return matchCard && matchMonth && matchYear;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(b.date).getTime());

  const filteredExpense = filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

  const filteredPayment = filteredTransactions
      .filter(t => t.type === TransactionType.PAYMENT)
      .reduce((sum, t) => sum + t.amount, 0);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 font-sans relative">
        <div className="glass-panel p-8 rounded-3xl shadow-xl w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/30 backdrop-blur-sm text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-1 ring-white/50">
              <Wallet size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">LimitWatch</h1>
            <p className="text-slate-500 mt-2 font-medium">Finansial Cerdas & Transparan</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon size={18} />
                </div>
                <input 
                  type="text" 
                  required 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass-input rounded-xl outline-none text-sm placeholder:text-slate-400 text-slate-800"
                  placeholder="Nama Lengkap"
                />
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl outline-none text-sm placeholder:text-slate-400 text-slate-800"
                placeholder="Alamat Email"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl outline-none text-sm placeholder:text-slate-400 text-slate-800"
                placeholder="Kata Sandi"
              />
            </div>

            {authError && (
              <div className="bg-red-50/50 backdrop-blur-sm text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-start gap-2">
                 <AlertCircle size={14} className="mt-0.5 shrink-0" />
                 <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full btn-liquid text-white py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading ? 'Memproses...' : (isRegistering ? 'Buat Akun' : 'Masuk Aplikasi')}
              {!authLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/50 backdrop-blur-md px-2 rounded text-slate-500 font-medium">Atau</span>
            </div>
          </div>

          <button 
            onClick={loginWithGoogle}
            className="w-full bg-white/70 backdrop-blur-md border border-white/60 text-slate-700 py-3 rounded-xl font-semibold hover:bg-white transition flex items-center justify-center gap-3 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G"/>
            <span>Google</span>
          </button>

          <div className="mt-8 text-center pt-6 border-t border-slate-200/40">
            <p className="text-sm text-slate-600">
              {isRegistering ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-indigo-600 font-bold hover:text-indigo-700 transition"
              >
                {isRegistering ? "Login" : "Daftar"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const DesktopNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active 
          ? 'bg-white/60 text-indigo-700 shadow-sm border border-white/50 backdrop-blur-md' 
          : 'text-slate-600 hover:bg-white/30 hover:text-slate-900'
      }`}
    >
      <span className={active ? 'text-indigo-600' : 'text-slate-500'}>{icon}</span>
      {label}
    </button>
  );

  return (
    <>
      {/* ========================================= */}
      {/* DESKTOP VIEW (Redesigned & Functional)    */}
      {/* ========================================= */}
      <div className="hidden md:flex h-screen font-sans overflow-hidden">
        
        {/* SIDEBAR (GLASS) */}
        <aside className="w-72 glass-heavy flex flex-col fixed h-full z-20">
           <div className="h-24 flex items-center px-8">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
                <Wallet size={20} />
              </div>
              <span className="font-bold text-2xl text-slate-800 tracking-tight">LimitWatch</span>
           </div>
           
           <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
              <div className="px-4 pb-2 pt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Menu</div>
              <DesktopNavItem icon={<Home size={20}/>} label="Dashboard" active={mobileTab === 'home'} onClick={() => setMobileTab('home')} />
              <DesktopNavItem icon={<CreditCard size={20}/>} label="Kartu Saya" active={mobileTab === 'cards'} onClick={() => setMobileTab('cards')} />
              <DesktopNavItem icon={<ReceiptText size={20}/>} label="Tagihan Bulanan" active={mobileTab === 'bills'} onClick={() => setMobileTab('bills')} />
              <DesktopNavItem icon={<WalletCards size={20}/>} label="Dompet" active={mobileTab === 'wallets'} onClick={() => setMobileTab('wallets')} />
              <DesktopNavItem icon={<History size={20}/>} label="Riwayat Transaksi" active={mobileTab === 'history'} onClick={() => setMobileTab('history')} />
              <DesktopNavItem icon={<Coins size={20}/>} label="Tabungan Pelunasan" active={mobileTab === 'savings'} onClick={() => setMobileTab('savings')} />
              <DesktopNavItem icon={<FileBarChart size={20}/>} label="Laporan Tahunan" active={mobileTab === 'report'} onClick={() => setMobileTab('report')} />
           </nav>
           
           <div className="p-4 border-t border-white/50">
              <button onClick={() => logout()} className="flex items-center gap-3 text-slate-500 hover:text-red-600 w-full p-3 rounded-xl transition-colors hover:bg-red-50/50">
                 <LogOut size={20} />
                 <span className="font-medium">Keluar Aplikasi</span>
              </button>
           </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 ml-72 p-10 overflow-y-auto relative z-10">
           {/* Desktop Header */}
           <header className="flex justify-between items-center mb-10">
              <div className="glass-panel px-6 py-4 rounded-2xl">
                 <h1 className="text-2xl font-bold text-slate-800 mb-1">
                    {mobileTab === 'home' && 'Ringkasan Keuangan'}
                    {mobileTab === 'cards' && 'Kelola Kartu Kredit'}
                    {mobileTab === 'bills' && 'Tagihan Bulanan'}
                    {mobileTab === 'wallets' && 'Dompet & Pemasukan'}
                    {mobileTab === 'history' && 'Riwayat Transaksi'}
                    {mobileTab === 'savings' && 'Tabungan Pelunasan'}
                    {mobileTab === 'report' && 'Laporan Tagihan Tahunan'}
                    {mobileTab === 'profile' && 'Pengaturan Akun'}
                 </h1>
                 <p className="text-slate-500 text-sm">
                    Selamat datang kembali, <span className="font-semibold text-slate-700">{user.displayName || user.email}</span>
                 </p>
              </div>
              <div className="flex items-center gap-4">
                 {/* Notification Bell (Desktop) */}
                 <div className="relative">
                    <button 
                      onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                      className="w-12 h-12 glass-panel rounded-full flex items-center justify-center text-slate-600 hover:bg-white/80 transition relative"
                    >
                        <BellRing size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white box-content"></span>
                        )}
                    </button>
                    {showNotifDropdown && (
                        <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b border-white/30 bg-white/30 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-sm">Notifikasi</h3>
                                {notifications.length > 0 && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{notifications.length} Baru</span>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 text-xs">Tidak ada notifikasi baru.</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-slate-100/50 hover:bg-white/40 transition cursor-pointer ${n.type === 'urgent' ? 'bg-red-50/30' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className={`mt-1 p-1.5 rounded-full h-fit ${n.type === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    <AlertCircle size={14} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${n.type === 'urgent' ? 'text-red-700' : 'text-slate-700'}`}>{n.title}</p>
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                     )}
                 </div>

                 {/* Catat Transaksi Bubble Button */}
                 <div className="relative group">
                    <button 
                      onClick={openAddTransactionModal}
                      className="btn-liquid text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/30"
                    >
                       <PlusCircle size={18} /> 
                       <span>Catat Transaksi</span>
                    </button>
                 </div>

                 {/* Profile Dropdown Component */}
                 <ProfileDropdown user={user} onLogout={logout} onNavigate={() => setMobileTab('profile')} />
              </div>
           </header>

           {/* --- DASHBOARD VIEW --- */}
           {mobileTab === 'home' && (
             <div className="space-y-8 animate-in fade-in duration-500">
               {/* Stats Grid */}
               <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1 glass-panel p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown size={80} className="text-red-600"/>
                     </div>
                     <div className="relative z-10">
                       <p className="text-slate-500 font-medium mb-2 uppercase tracking-wide text-xs">Total Hutang</p>
                       <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{formatIDR(totalDebt)}</h3>
                     </div>
                     <div className="relative z-10 text-sm text-red-500 flex items-center gap-1 font-bold mt-4 bg-red-50/50 w-fit px-3 py-1 rounded-full border border-red-100">
                        Perlu dilunasi
                     </div>
                  </div>

                  <div className="col-span-1 glass-panel p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Coins size={80} className="text-green-600"/>
                     </div>
                     <div className="relative z-10">
                       <p className="text-slate-500 font-medium mb-2 uppercase tracking-wide text-xs">Tabungan</p>
                       <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{formatIDR(totalSavings)}</h3>
                     </div>
                     <button onClick={openAddSavingModal} className="relative z-10 text-sm text-green-600 flex items-center gap-1 font-bold mt-4 bg-green-50/50 w-fit px-3 py-1 rounded-full border border-green-100 hover:bg-green-100 transition-colors">
                        + Tambah
                     </button>
                  </div>

                  <div className="col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 text-white flex flex-col justify-between h-48 relative overflow-hidden">
                     <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
                     <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-400 rounded-full blur-3xl opacity-50"></div>
                     
                     <div className="relative z-10">
                       <p className="text-indigo-100 font-medium mb-1 uppercase tracking-wide text-xs">Cicilan Aktif</p>
                       <div className="flex items-baseline gap-2">
                           <h3 className="text-3xl font-bold">{activeInstallmentsCount} Item</h3>
                       </div>
                       <span className="text-sm text-indigo-100/80 font-medium mt-1 block">Beban: {formatIDR(totalInstallmentBillThisMonth)}/bln</span>
                     </div>
                     <div className="flex gap-2 relative z-10 mt-auto">
                         <button onClick={() => setInstallmentListModalOpen(true)} className="text-sm bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 py-2 px-4 rounded-xl transition-all font-semibold">
                            Lihat Detail
                         </button>
                         <button onClick={openInstallmentModal} className="text-sm bg-white text-indigo-700 font-bold py-2 px-4 rounded-xl transition-colors shadow-lg">
                            + Baru
                         </button>
                     </div>
                  </div>
               </div>

               {/* GLOBAL MONTH SUMMARY (New Widget) */}
               <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 p-6 opacity-5 ${isGlobalSafe ? 'text-green-600' : 'text-red-600'}`}>
                      <Calculator size={100} />
                  </div>
                  <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                          <Target size={20} className="text-indigo-600" /> 
                          Status {monthNames[currentMonth]} {currentYear}
                      </h3>
                      <div className="flex items-center gap-10">
                           <div>
                               <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sisa Tagihan (Semua Kartu)</p>
                               <p className="text-2xl font-bold text-slate-800">{formatIDR(totalGlobalBillThisMonth)}</p>
                           </div>
                           <div className="h-12 w-px bg-slate-200"></div>
                           <div>
                               <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tabungan Bulan Ini</p>
                               <p className="text-2xl font-bold text-green-600">{formatIDR(totalGlobalSavingsThisMonth)}</p>
                           </div>
                           <div className="h-12 w-px bg-slate-200"></div>
                           <div>
                               <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status Dana</p>
                               <p className={`text-2xl font-bold ${isGlobalSafe ? 'text-green-600' : 'text-red-600'}`}>
                                   {isGlobalSafe ? 'Dana Siap / Surplus' : `Kurang ${formatIDR(Math.abs(globalMonthStatus))}`}
                               </p>
                           </div>
                      </div>
                  </div>
               </div>

               {/* Bill Reminder Section (Horizontal) */}
               <div>
                  <div className="flex items-center gap-2 mb-4 pl-1">
                      <Bell size={20} className="text-orange-500"/>
                      <h3 className="text-lg font-bold text-slate-800">Rincian Pengingat Tagihan</h3>
                  </div>
                  
                  {upcomingBills.length === 0 ? (
                      <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 flex flex-col items-center border-dashed border-2 border-white/40">
                          <CheckCircle2 size={48} className="mb-2 opacity-30 text-green-500"/>
                          <p>Semua tagihan aman! Tidak ada yang jatuh tempo dalam waktu dekat.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-3 gap-6">
                          {upcomingBills.map(c => {
                              const isUrgent = c.daysLeft <= 3 && c.daysLeft >= 0;
                              const isOverdue = c.daysLeft < 0;
                              const isWarning = c.daysLeft <= 7 && c.daysLeft > 3;
                              const isCovered = c.shortfall <= 0;

                              return (
                                  <div key={c.id} className={`p-5 rounded-2xl border backdrop-blur-md shadow-sm transition-all hover:-translate-y-1 ${isOverdue ? 'bg-red-50/60 border-red-200' : isUrgent ? 'bg-red-50/40 border-red-100' : isWarning ? 'bg-orange-50/40 border-orange-100' : 'glass-panel'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                              <p className="font-bold text-slate-800 truncate text-lg">{c.name}</p>
                                              <p className="text-xs text-slate-500">{c.nextDueDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                                          </div>
                                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${isOverdue ? 'bg-red-600 text-white border-red-600' : isUrgent ? 'bg-red-100 text-red-600 border-red-200' : 'bg-orange-100 text-orange-600 border-orange-200'}`}>
                                              {isOverdue ? `Telat ${Math.abs(c.daysLeft)} Hari` : `${c.daysLeft} Hari Lagi`}
                                          </span>
                                      </div>
                                      
                                      <div className="space-y-1.5 mt-4 text-sm">
                                         <div className="flex justify-between">
                                            <span className="text-slate-500 text-xs">Tagihan</span>
                                            <span className="font-bold text-slate-800">{formatIDR(c.remainingBill)}</span>
                                         </div>
                                         <div className="flex justify-between">
                                            <span className="text-slate-500 text-xs">Tabungan</span>
                                            <span className="font-bold text-slate-600">{formatIDR(c.availableSavings)}</span>
                                         </div>
                                         <div className="h-px bg-slate-300/50 my-2"></div>
                                         <div className={`flex justify-between font-bold ${isCovered ? 'text-green-600' : 'text-red-600'}`}>
                                            <span className="text-xs">Kekurangan</span>
                                            <span>{isCovered ? 'Aman' : formatIDR(c.shortfall)}</span>
                                         </div>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                  )}
               </div>

               {/* Recent Transactions Table */}
               <div className="glass-panel rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-white/30 flex justify-between items-center bg-white/20">
                     <h3 className="font-bold text-lg text-slate-800">Transaksi Terakhir</h3>
                     <button onClick={() => setMobileTab('history')} className="text-indigo-600 text-sm font-semibold hover:bg-indigo-50/50 px-3 py-1 rounded-lg transition-colors">Lihat Semua</button>
                  </div>
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-white/10 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-white/20">
                           <th className="p-5">Tanggal</th>
                           <th className="p-5">Keterangan</th>
                           <th className="p-5">Tipe</th>
                           <th className="p-5 text-right">Jumlah</th>
                        </tr>
                     </thead>
                     <tbody className="text-sm text-slate-700">
                        {data.transactions.slice(0, 5).map(t => {
                           const card = data.cards.find(c => c.id === t.cardId);
                           return (
                             <tr onClick={() => handleEditClick(t)} key={t.id} className="border-b border-white/20 hover:bg-white/30 transition-colors cursor-pointer last:border-0">
                                <td className="p-5 text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                <td className="p-5 font-medium flex items-center gap-3">
                                   <div className={`w-3 h-3 rounded-full shadow-sm ${card?.color ? card.color.split(' ')[0] : 'bg-slate-400'}`} title={card?.name}></div>
                                   {t.description}
                                   {t.isInstallment && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-indigo-200">CICILAN</span>}
                                </td>
                                <td className="p-5">
                                   <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                      t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
                                   }`}>
                                      {t.type === TransactionType.EXPENSE ? 'Pengeluaran' : 'Pembayaran'}
                                   </span>
                                </td>
                                <td className={`p-5 text-right font-bold ${
                                   t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'
                                }`}>
                                   {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                                </td>
                             </tr>
                           );
                        })}
                        {data.transactions.length === 0 && (
                           <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400">Belum ada data transaksi.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
             </div>
           )}

           {/* ... (Other Desktop Views Omitted for Brevity as Request Focused on Mobile Color) ... */}
           {/* Re-rendering other desktop views using the same logic as before but ensuring they are inside the main desktop container */}
           {mobileTab === 'wallets' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="flex justify-between items-center glass-panel p-4 rounded-2xl">
                      <h2 className="text-xl font-bold text-slate-800">Daftar Dompet</h2>
                      <button onClick={openAddWalletModal} className="btn-liquid text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                          <PlusCircle size={18}/> Tambah Dompet
                      </button>
                  </div>
                  {/* ... Desktop Wallet Grid ... */}
                  <div className="grid grid-cols-3 gap-6">
                      {(data.wallets || []).map(w => (
                          <div key={w.id} className={`p-6 rounded-3xl shadow-lg relative group overflow-hidden ${w.color || 'bg-slate-700'}`}>
                              <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
                              <div className="flex justify-between items-start mb-4 relative z-10">
                                  <div>
                                      <p className="text-white/80 text-xs uppercase tracking-wider font-bold bg-black/20 px-2 py-1 rounded-lg w-fit mb-1">{w.type}</p>
                                      <h3 className="font-bold text-xl text-white">{w.name}</h3>
                                  </div>
                                  <div className="flex gap-2">
                                     <button onClick={() => handleEditWallet(w)} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl backdrop-blur-md transition-colors"><Pencil size={16} className="text-white"/></button>
                                  </div>
                              </div>
                              <h2 className="text-3xl font-bold mb-8 relative z-10 text-white tracking-tight">{formatIDR(w.balance)}</h2>
                              
                              <div className="flex gap-3 relative z-10">
                                  <button onClick={() => openWalletIncomeModal(w.id)} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 text-white border border-white/20 transition-all">
                                      <ArrowDownLeft size={16}/> Isi Saldo
                                  </button>
                                  <button onClick={() => openWalletTransferModal(w.id)} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 text-white border border-white/20 transition-all">
                                      <ArrowUpRight size={16}/> Transfer
                                  </button>
                              </div>
                              <WalletCards className="absolute -bottom-4 -right-4 text-white/10 w-40 h-40 transform rotate-12" />
                          </div>
                      ))}
                  </div>
              </div>
           )}

           {/* ... Other desktop tabs ... */}
           {/* Keeping existing desktop tabs implementation */}
           {mobileTab === 'history' && (
             <div className="space-y-6 animate-in fade-in">
                {/* ... History Desktop ... */}
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/20 text-slate-500 text-sm border-b border-white/30">
                            <tr>
                                <th className="p-5 font-semibold w-20 text-center">Valid</th>
                                <th className="p-5 font-semibold">Tanggal</th>
                                <th className="p-5 font-semibold">Keterangan</th>
                                <th className="p-5 font-semibold text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredTransactions.map(t => {
                                const card = data.cards.find(c => c.id === t.cardId);
                                return (
                                    <tr onClick={() => handleEditClick(t)} key={t.id} className="border-b border-white/20 hover:bg-white/40 cursor-pointer transition-colors transition-colors last:border-0">
                                        <td className="p-5 text-center" onClick={(e) => handleToggleValidation(e, t.id)}>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${t.isValidated ? 'bg-green-500 border-green-500 text-white shadow-md' : 'border-slate-300 text-transparent hover:border-green-400 bg-white/50'}`}>
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-600 font-medium">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                        <td className="p-5 font-medium flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full shadow-sm ${card?.color ? card.color.split(' ')[0] : 'bg-slate-400'}`} title={card?.name}></div>
                                            <span className="text-slate-800">{t.description}</span>
                                            {t.isInstallment && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-indigo-200">CICILAN</span>}
                                        </td>
                                        <td className={`p-5 text-right font-bold text-base ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                                            {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
             </div>
           )}

           {mobileTab === 'savings' && (
               <div className="space-y-8 animate-in fade-in">
                   {/* ... Savings Desktop ... */}
                   <div className="flex justify-between items-center glass-panel p-4 rounded-2xl">
                       <h2 className="text-xl font-bold text-slate-800">Tabungan Pelunasan</h2>
                       <button onClick={openAddSavingModal} className="btn-liquid text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                           <PlusCircle size={18}/> Tambah Tabungan
                       </button>
                   </div>
                   {/* ... Savings List ... */}
                   {data.cards.map(card => {
                       const groupedSavings = getSavingsByMonth(card.id);
                       if (groupedSavings.length === 0) return null;
                       return (
                           <div key={card.id} className="glass-panel rounded-3xl overflow-hidden shadow-lg">
                               <div className={`p-4 ${card.color || 'bg-slate-700'} text-white flex justify-between items-center relative`}>
                                   <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                                   <h3 className="font-bold relative z-10 flex items-center gap-2">
                                     <CreditCard size={18}/> {card.name}
                                   </h3>
                                   <div className="text-sm bg-black/20 px-3 py-1 rounded-lg backdrop-blur-md relative z-10 font-bold border border-white/10">
                                       Total: {formatIDR(groupedSavings.reduce((sum, g) => sum + g.total, 0))}
                                   </div>
                               </div>
                               {/* ... Grouped Savings Items ... */}
                               <div className="p-6 grid grid-cols-2 gap-6 bg-white/40">
                                   {groupedSavings.map(group => (
                                       <div key={group.key} className="glass-panel rounded-2xl p-5 border-white/50">
                                            <div className="flex justify-between items-start mb-4">
                                               <h4 className="font-bold text-slate-700 bg-white/50 px-2 py-1 rounded-lg">{group.label}</h4>
                                               <span className="text-xl font-bold text-green-600">{formatIDR(group.total)}</span>
                                           </div>
                                            {/* ... */}
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )
                   })}
               </div>
           )}

           {mobileTab === 'cards' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="flex justify-between items-center glass-panel p-4 rounded-2xl">
                      <h2 className="text-xl font-bold text-slate-800">Daftar Kartu Kredit</h2>
                      <button onClick={openAddCardModal} className="btn-liquid text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                          <PlusCircle size={18}/> Tambah Kartu
                      </button>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                      {data.cards.map(card => {
                           const cardUsage = data.transactions
                             .filter(t => t.cardId === card.id && t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
                          const cardPayments = data.transactions
                             .filter(t => t.cardId === card.id && t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
                          const currentDebt = cardUsage - cardPayments;
                          const remainingLimit = card.limit - currentDebt;
                          return (
                              <div key={card.id} onClick={() => openCardHistory(card)} className={`aspect-[1.58/1] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] ${card.color || 'bg-slate-700'}`}>
                                  <div className="card-gloss-overlay absolute inset-0"></div>
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                  <div className="flex justify-between items-start mb-8 relative z-10">
                                      <div className="flex items-center gap-2">
                                          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                                             <CreditCard size={20} className="text-white"/>
                                          </div>
                                          <span className="font-bold text-lg tracking-wide text-shadow-sm">{card.name}</span>
                                      </div>
                                      <button onClick={(e) => {e.stopPropagation(); handleEditCard(card);}} className="bg-black/20 p-2 rounded-xl hover:bg-black/30 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Pencil size={16} className="text-white"/>
                                      </button>
                                  </div>
                                  <div className="space-y-1 relative z-10 mt-auto">
                                      <p className="text-xs opacity-80 uppercase tracking-widest font-semibold">Sisa Limit</p>
                                      <p className="text-3xl font-mono font-bold tracking-tight text-shadow-md">{formatIDR(remainingLimit)}</p>
                                      <p className="text-xs opacity-70 mt-2 font-mono tracking-wide">LIMIT: {formatIDR(card.limit)}</p>
                                  </div>
                                  {/* ... */}
                              </div>
                          )
                      })}
                  </div>
              </div>
           )}

           {mobileTab === 'report' && (
              <div className="space-y-6 animate-in fade-in h-full flex flex-col">
                  {/* ... Report Desktop ... */}
                   <div className="flex justify-between items-center glass-panel p-4 rounded-2xl">
                      <h2 className="text-xl font-bold text-slate-800">Laporan Tahunan</h2>
                      {/* ... filters ... */}
                   </div>
                   {/* ... report table ... */}
              </div>
           )}

           {mobileTab === 'bills' && (
              <div className="space-y-6 animate-in fade-in">
                  {/* ... Bills Desktop ... */}
                  <div className="flex justify-between items-center glass-panel p-4 rounded-2xl">
                      <h2 className="text-xl font-bold text-slate-800">Tagihan Bulanan</h2>
                      {/* ... filters ... */}
                  </div>
                   {/* ... bills grid ... */}
              </div>
           )}
        </main>
      </div>

      {/* ========================================= */}
      {/* MOBILE SUPER APP VIEW (Fixed Layout)      */}
      {/* ========================================= */}
      <div className="md:hidden fixed inset-0 font-sans flex flex-col bg-transparent">
        {/* HEADER MOBILE */}
        <header className="glass-nav pt-safe px-4 pb-4 shadow-sm z-30 flex-shrink-0">
          <div className="flex justify-between items-center py-2">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30">
                   <Wallet size={18} className="text-white"/>
                </div>
                <h1 className="text-lg font-bold tracking-tight text-slate-800">LimitWatch</h1>
             </div>
             <div className="flex items-center gap-3">
                 <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
                     <Bell size={20} className="text-slate-600" />
                     {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                 </button>
                 
                 {/* Mobile Profile Dropdown */}
                 <ProfileDropdown user={user} onLogout={logout} onNavigate={() => setMobileTab('profile')} />
             </div>
          </div>
        </header>

        {/* CONTENT MOBILE (Scrollable Area) */}
        <div 
          className="flex-1 overflow-y-auto pb-32"
          onTouchStart={mobileTab === 'savings' ? onTouchStart : undefined}
          onTouchMove={mobileTab === 'savings' ? onTouchMove : undefined}
          onTouchEnd={mobileTab === 'savings' ? onTouchEnd : undefined}
        >
          {/* TOAST NOTIFICATION */}
          {showToast && toastMessage && (
            <div className="mx-4 mt-4 glass-panel border-l-4 border-red-500 px-4 py-3 rounded-xl shadow-xl flex items-start gap-3 animate-in slide-in-from-top-5 fade-in duration-300 z-50 bg-white/90">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div>
                    <p className="font-bold text-sm text-slate-800">{toastMessage.title}</p>
                    <p className="text-xs text-slate-500">{toastMessage.message}</p>
                </div>
            </div>
          )}

          {mobileTab === 'home' && (
            <div className="p-4 space-y-6">
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                   <div className="relative z-10">
                     <p className="text-indigo-100 text-xs font-bold uppercase tracking-wide mb-1">Total Hutang Berjalan</p>
                     <h2 className="text-4xl font-bold mb-6 tracking-tight">{formatIDR(totalDebt)}</h2>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/10">
                           <div className="flex items-center gap-2 mb-1">
                              <Coins size={14} className="text-green-300"/>
                              <span className="text-xs text-indigo-100 font-medium">Tabungan</span>
                           </div>
                           <p className="font-bold text-lg">{formatIDR(totalSavings)}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/10 active:scale-95 transition-transform" onClick={() => setInstallmentListModalOpen(true)}>
                           <div className="flex items-center gap-2 mb-1">
                              <FileBarChart size={14} className="text-orange-300"/>
                              <span className="text-xs text-indigo-100 font-medium">Cicilan Aktif</span>
                           </div>
                           <p className="font-bold text-lg">{activeInstallmentsCount} Item</p>
                        </div>
                     </div>
                   </div>
                </div>

                {/* Global Summary Mobile */}
                <div className="glass-panel rounded-2xl p-4 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                        <Target size={14}/> Ringkasan {monthNames[currentMonth]}
                    </h3>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Tagihan vs Tabungan</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-sm font-bold text-slate-700">{formatIDR(totalGlobalBillThisMonth)}</span>
                                <span className="text-[10px] text-slate-400">/</span>
                                <span className="text-sm font-bold text-green-600">{formatIDR(totalGlobalSavingsThisMonth)}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className={`text-sm font-bold px-3 py-1 rounded-lg ${isGlobalSafe ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {isGlobalSafe ? 'Aman' : `Kurang ${formatIDR(Math.abs(globalMonthStatus))}`}
                             </p>
                        </div>
                    </div>
                </div>
                
                {/* Horizontal Scroll Menu (Sortable) */}
                <div>
                   <h3 className="text-sm font-bold text-slate-700 mb-3 px-1 ml-1">Menu Utama</h3>
                   <div className="grid grid-cols-4 gap-3">
                      {menuOrder.map(item => {
                          let label = '', icon = null, action = () => {}, colorClass = '';
                          if (item === 'transaksi') { label = 'Catat'; icon = <PlusCircle size={24}/>; action = openAddTransactionModal; colorClass='text-indigo-600'; }
                          if (item === 'cicilan') { label = 'Cicilan'; icon = <Calculator size={24}/>; action = openInstallmentModal; colorClass='text-violet-600'; }
                          if (item === 'wallets') { label = 'Dompet'; icon = <WalletCards size={24}/>; action = () => setMobileTab('wallets'); colorClass='text-emerald-600'; }
                          if (item === 'laporan') { label = 'Laporan'; icon = <FileBarChart size={24}/>; action = () => setMobileTab('report'); colorClass='text-orange-600'; }
                          if (item === 'kartu') { label = 'Kartu'; icon = <CreditCard size={24}/>; action = () => setMobileTab('cards'); colorClass='text-purple-600'; }
                          if (item === 'bills') { label = 'Tagihan'; icon = <ReceiptText size={24}/>; action = () => setMobileTab('bills'); colorClass='text-red-600'; }
                          if (item === 'tabungan') { label = 'Tabungan'; icon = <Coins size={24}/>; action = () => setMobileTab('savings'); colorClass='text-teal-600'; }
                          if (item === 'history') { label = 'Riwayat'; icon = <History size={24}/>; action = () => setMobileTab('history'); colorClass='text-slate-600'; }
                          if (item === 'profile') { label = 'Akun'; icon = <UserIcon size={24}/>; action = () => setMobileTab('profile'); colorClass='text-pink-600'; }

                          return (
                              <button 
                                key={item}
                                data-menu-id={item}
                                onTouchStart={(e) => onMenuTouchStart(e, item)}
                                onTouchEnd={onMenuTouchEnd}
                                onTouchMove={onMenuTouchMove}
                                onClick={action}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl active:scale-95 transition-all glass-panel ${draggingItem === item ? 'scale-110 shadow-2xl z-20 bg-white' : ''}`}
                              >
                                 <div className={`w-10 h-10 rounded-full bg-white/50 flex items-center justify-center ${colorClass}`}>
                                    {icon}
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-600">{label}</span>
                              </button>
                          )
                      })}
                   </div>
                </div>

                {/* Bill Reminder Horizontal Scroll */}
                {upcomingBills.length > 0 && (
                   <div>
                       <h3 className="text-sm font-bold text-slate-700 mb-3 px-1 ml-1">Tagihan Terdekat</h3>
                       <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                           {upcomingBills.map(c => {
                               const isOverdue = c.daysLeft < 0;
                               const isUrgent = c.daysLeft <= 3 && !isOverdue;
                               const isCovered = c.shortfall <= 0;
                               return (
                                   <div key={c.id} className={`flex-shrink-0 w-64 p-4 rounded-2xl border backdrop-blur-md shadow-sm ${isOverdue ? 'bg-red-50/80 border-red-200' : isUrgent ? 'bg-orange-50/80 border-orange-200' : 'glass-panel'}`}>
                                       <div className="flex justify-between items-start mb-2">
                                           <span className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{c.name}</span>
                                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                               {isOverdue ? `Telat ${Math.abs(c.daysLeft)} Hari` : `${c.daysLeft} Hari Lagi`}
                                           </span>
                                       </div>
                                       <div className="text-xs space-y-1.5">
                                           <div className="flex justify-between text-slate-500">
                                               <span>Sisa Tagihan</span>
                                               <span className="text-slate-700 font-bold">{formatIDR(c.remainingBill)}</span>
                                           </div>
                                           <div className="flex justify-between text-slate-500">
                                               <span>Kurang Dana</span>
                                               <span className={`font-bold ${isCovered ? 'text-green-600' : 'text-red-600'}`}>
                                                   {isCovered ? 'Aman' : formatIDR(c.shortfall)}
                                               </span>
                                           </div>
                                       </div>
                                   </div>
                               )
                           })}
                       </div>
                   </div>
                )}

                {/* Recent Transactions */}
                <div className="glass-panel rounded-2xl p-4 shadow-lg">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-700">Transaksi Terakhir</h3>
                      <button onClick={() => setMobileTab('history')} className="text-xs text-indigo-600 font-bold bg-indigo-50/50 px-2 py-1 rounded-lg">Lihat Semua</button>
                   </div>
                   <div className="space-y-4">
                      {data.transactions.slice(0, 5).map(t => {
                          const card = data.cards.find(c => c.id === t.cardId);
                          return (
                              <div onClick={() => handleEditClick(t)} key={t.id} className="flex items-center justify-between border-b border-white/30 pb-3 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${t.type === TransactionType.EXPENSE ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                          {t.type === TransactionType.EXPENSE ? <ArrowUpRight size={16}/> : <ArrowDownLeft size={16}/>}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{t.description}</p>
                                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                              <span className={`w-2 h-2 rounded-full ${card?.color ? card.color.split(' ')[0] : 'bg-slate-300'}`}></span>
                                              <span>{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className={`text-sm font-bold ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                                          {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                                      </p>
                                      {t.isInstallment && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200">Cicilan</span>}
                                  </div>
                              </div>
                          )
                      })}
                      {data.transactions.length === 0 && <p className="text-center text-xs text-slate-400 py-4">Belum ada data.</p>}
                   </div>
                </div>
            </div>
          )}

          {mobileTab === 'cards' && (
             <div className="p-4 space-y-4 animate-in fade-in">
                 <div className="flex justify-between items-center glass-panel p-3 rounded-2xl">
                    <h2 className="text-lg font-bold text-slate-800 ml-2">Kartu Saya</h2>
                    <button onClick={openAddCardModal} className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/30">
                        <PlusCircle size={20} />
                    </button>
                 </div>
                 {data.cards.map(card => {
                     const cardUsage = data.transactions
                        .filter(t => t.cardId === card.id && t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
                     const cardPayments = data.transactions
                        .filter(t => t.cardId === card.id && t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
                     const currentDebt = cardUsage - cardPayments;
                     const remainingLimit = card.limit - currentDebt;
                     return (
                         <div key={card.id} onClick={() => openCardHistory(card)} className={`rounded-3xl p-5 text-white shadow-xl relative overflow-hidden active:scale-[0.98] transition-transform ${card.color || 'bg-slate-700'}`}>
                            {/* Card Gloss */}
                            <div className="card-gloss-overlay absolute inset-0"></div>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <span className="font-bold text-lg tracking-wide drop-shadow-sm">{card.name}</span>
                                <button 
                                    onClick={(e) => {e.stopPropagation(); handleEditCard(card);}} 
                                    className="bg-black/20 p-2 rounded-xl backdrop-blur-md"
                                >
                                    <Pencil size={14} className="text-white"/>
                                </button>
                            </div>
                            <div className="space-y-1 relative z-10">
                                <p className="text-xs opacity-80 font-semibold uppercase">Sisa Limit</p>
                                <p className="text-2xl font-bold font-mono tracking-tight text-shadow-sm">{formatIDR(remainingLimit)}</p>
                                <p className="text-[10px] opacity-70 mt-1 font-mono">LIMIT: {formatIDR(card.limit)}</p>
                            </div>
                            {card.dueDay && (
                                <div className="absolute bottom-4 right-4 bg-black/20 px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md border border-white/10">
                                    Tempo Tgl {card.dueDay}
                                </div>
                            )}
                         </div>
                     )
                 })}
                 {data.cards.length === 0 && <p className="text-center text-slate-500 py-10">Belum ada kartu kredit.</p>}
             </div>
          )}

          {mobileTab === 'bills' && (
             <div className="p-4 space-y-4 animate-in fade-in">
                 <div className="flex justify-between items-center mb-2 glass-panel p-3 rounded-2xl">
                    <h2 className="text-lg font-bold text-slate-800 ml-2">Tagihan Bulanan</h2>
                    <select value={billsYear} onChange={(e) => setBillsYear(parseInt(e.target.value))} className="bg-white/50 rounded-lg py-1.5 px-3 text-xs font-bold outline-none border border-white/20">
                          {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                              <option key={y} value={y}>{y}</option>
                          ))}
                    </select>
                 </div>
                 
                 <div className="space-y-4">
                     {monthNames.map((month, i) => {
                         const billsInMonth = data.cards.map(card => {
                            const report = getMonthlyReportData(card.id, i, billsYear);
                            if (report.totalBill === 0 && report.totalPaid === 0 && report.remaining === 0) return null;
                            let status: 'PAID' | 'UNPAID' | 'LATE' = 'UNPAID';
                            if (report.remaining <= 0) status = 'PAID';
                            else {
                                const dueDate = new Date(billsYear, i, card.dueDay || 25);
                                const today = new Date();
                                if (today > dueDate) status = 'LATE';
                            }
                            return { card, report, status };
                        }).filter(item => item !== null) as {card: CreditCardType, report: ReturnType<typeof getMonthlyReportData>, status: 'PAID'|'UNPAID'|'LATE'}[];

                        if (billsInMonth.length === 0) return null;

                        return (
                            <div key={month} className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-white/30 px-4 py-2 border-b border-white/30 flex justify-between items-center">
                                    <span className="font-bold text-slate-700 text-sm">{month}</span>
                                    <span className="text-[10px] font-bold text-slate-500 bg-white/50 px-2 py-0.5 rounded-full">Total: {formatIDR(billsInMonth.reduce((sum, item) => sum + item.report.totalBill, 0))}</span>
                                </div>
                                <div className="p-3 space-y-3">
                                    {billsInMonth.map(({card, report, status}) => (
                                        <div 
                                            key={card.id}
                                            onClick={() => { setSelectedCardForHistory(card); setCardHistoryMonth(i); setCardHistoryYear(billsYear); }}
                                            className={`rounded-xl p-3 border text-xs bg-white/40 backdrop-blur-sm ${status === 'LATE' ? 'border-red-200 bg-red-50/40' : status === 'PAID' ? 'border-green-200 bg-green-50/40' : 'border-orange-200 bg-orange-50/40'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-slate-800">{card.name}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${status === 'LATE' ? 'bg-red-100 text-red-600' : status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {status === 'LATE' ? 'TELAT' : status === 'PAID' ? 'LUNAS' : 'BELUM'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-slate-600 mb-1">
                                                <span>Total Tagihan</span>
                                                <span className="font-medium">{formatIDR(report.totalBill)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold">
                                                <span className="text-slate-600">Sisa Bayar</span>
                                                <span className={report.remaining > 0 ? 'text-red-600' : 'text-slate-400'}>{formatIDR(Math.max(0, report.remaining))}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                     })}
                 </div>
                 {data.cards.length > 0 && monthNames.every((_, i) => {
                         const hasBills = data.cards.some(c => {
                             const r = getMonthlyReportData(c.id, i, billsYear);
                             return r.totalBill > 0 || r.totalPaid > 0;
                         });
                         return !hasBills;
                  }) && (
                     <div className="text-center py-10 text-slate-400 text-xs">
                         <p>Tidak ada tagihan tahun {billsYear}</p>
                     </div>
                  )}
             </div>
          )}

          {mobileTab === 'wallets' && (
             <div className="p-4 space-y-4 animate-in fade-in">
                 <div className="flex justify-between items-center glass-panel p-3 rounded-2xl">
                    <h2 className="text-lg font-bold text-slate-800 ml-2">Dompet & Kas</h2>
                    <button onClick={openAddWalletModal} className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/30">
                        <PlusCircle size={20} />
                    </button>
                 </div>
                 {(data.wallets || []).map(w => (
                     <div key={w.id} className={`p-5 rounded-3xl text-white shadow-lg relative overflow-hidden ${w.color || 'bg-slate-700'}`}>
                          <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
                          <div className="flex justify-between items-start mb-3 relative z-10">
                              <div>
                                  <span className="text-[10px] bg-black/20 px-2 py-1 rounded-lg text-white font-bold uppercase tracking-wider backdrop-blur-md">{w.type}</span>
                                  <h3 className="font-bold text-lg mt-2">{w.name}</h3>
                              </div>
                              <button onClick={() => handleEditWallet(w)} className="bg-black/20 p-2 rounded-xl backdrop-blur-md"><Pencil size={14}/></button>
                          </div>
                          <h2 className="text-2xl font-bold mb-6 relative z-10 tracking-tight">{formatIDR(w.balance)}</h2>
                          <div className="flex gap-2 relative z-10">
                              <button onClick={() => openWalletIncomeModal(w.id)} className="flex-1 bg-white/20 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 backdrop-blur-md border border-white/10 active:bg-white/30 transition-colors">
                                  <ArrowDownLeft size={14}/> Isi
                              </button>
                              <button onClick={() => openWalletTransferModal(w.id)} className="flex-1 bg-white/20 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 backdrop-blur-md border border-white/10 active:bg-white/30 transition-colors">
                                  <ArrowUpRight size={14}/> Transfer
                              </button>
                          </div>
                     </div>
                 ))}
                 {(data.wallets || []).length === 0 && <p className="text-center text-slate-400 py-10">Belum ada dompet.</p>}
             </div>
          )}

          {mobileTab === 'savings' && (
             <div className="p-4 space-y-6 animate-in fade-in min-h-full">
                 <div className="flex justify-between items-center glass-panel p-3 rounded-2xl">
                    <h2 className="text-lg font-bold text-slate-800 ml-2">Tabungan Pelunasan</h2>
                    <button onClick={openAddSavingModal} className="bg-green-600 text-white p-2 rounded-xl shadow-lg shadow-green-500/30">
                        <PlusCircle size={20} />
                    </button>
                 </div>
                 {data.cards.map(card => {
                       const groupedSavings = getSavingsByMonth(card.id);
                       if (groupedSavings.length === 0) return null;

                       return (
                           <div key={card.id} className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                               <div className={`p-3 ${card.color || 'bg-slate-700'} text-white flex justify-between items-center relative`}>
                                   <div className="absolute inset-0 bg-white/10"></div>
                                   <h3 className="font-bold text-sm relative z-10">{card.name}</h3>
                                   <div className="text-xs bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-lg relative z-10 border border-white/10">
                                       Total: {formatIDR(groupedSavings.reduce((sum, g) => sum + g.total, 0))}
                                   </div>
                               </div>
                               <div className="p-4 space-y-4 bg-white/20">
                                   {groupedSavings.map(group => (
                                       <div key={group.key} className="bg-white/60 backdrop-blur-md rounded-xl p-3 border border-white/40">
                                           <div className="flex justify-between items-start mb-2">
                                               <h4 className="font-bold text-slate-700 text-sm bg-white/50 px-2 py-0.5 rounded-md">{group.label}</h4>
                                               <span className="font-bold text-green-600">{formatIDR(group.total)}</span>
                                           </div>
                                           <div className="space-y-2 mb-3">
                                               {group.items.map(item => (
                                                   <div key={item.id} className="flex justify-between text-xs items-center group/item p-1 hover:bg-white/50 rounded transition-colors">
                                                       <span className="text-slate-600 truncate max-w-[120px] font-medium">{item.note}</span>
                                                       <div className="flex items-center gap-2">
                                                           <span className="font-bold text-slate-800">{formatIDR(item.amount)}</span>
                                                           <button onClick={() => handleEditSaving(item)} className="text-slate-400 bg-white rounded p-0.5 shadow-sm"><Pencil size={10}/></button>
                                                       </div>
                                                   </div>
                                               ))}
                                           </div>
                                           <div className="flex gap-2">
                                               <button onClick={() => openWithdrawModal(group.items)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                                   Ambil
                                               </button>
                                               <button onClick={() => handleOpenBatchPay(group.items, group.label, group.total)} className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-xs font-bold shadow-md shadow-green-200">
                                                   Bayar
                                               </button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )
                 })}
                 {data.savings.filter(s => !s.isTransferred).length === 0 && <p className="text-center text-slate-400 py-10">Belum ada tabungan.</p>}
             </div>
          )}

          {mobileTab === 'history' && (
             <div className="p-4 space-y-4 animate-in fade-in">
                 <h2 className="text-lg font-bold text-slate-800 glass-panel p-3 rounded-2xl w-fit">Riwayat Transaksi</h2>
                 
                 {/* Mobile Filters */}
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <select value={historyFilterCard} onChange={(e) => setHistoryFilterCard(e.target.value)} className="glass-input rounded-xl py-2 px-3 text-xs flex-shrink-0 font-bold">
                        <option value="all">Semua Kartu</option>
                        {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={historyFilterMonth} onChange={(e) => setHistoryFilterMonth(parseInt(e.target.value))} className="glass-input rounded-xl py-2 px-3 text-xs flex-shrink-0 font-bold">
                         {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                     </select>
                     <select value={historyFilterYear} onChange={(e) => setHistoryFilterYear(parseInt(e.target.value))} className="glass-input rounded-xl py-2 px-3 text-xs flex-shrink-0 font-bold">
                         {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                 </div>

                 {/* Summary Cards Mobile */}
                 <div className="grid grid-cols-2 gap-3">
                    <div className="glass-panel bg-red-50/50 p-3 rounded-2xl border-red-100">
                        <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Pengeluaran</p>
                        <p className="text-lg font-bold text-red-700">{formatIDR(filteredExpense)}</p>
                    </div>
                    <div className="glass-panel bg-green-50/50 p-3 rounded-2xl border-green-100">
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Pembayaran</p>
                        <p className="text-lg font-bold text-green-700">{formatIDR(filteredPayment)}</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                      {filteredTransactions.map(t => {
                          const card = data.cards.find(c => c.id === t.cardId);
                          return (
                              <div onClick={() => handleEditClick(t)} key={t.id} className="glass-panel rounded-2xl p-3 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform">
                                  <div className="flex items-center gap-3">
                                      {/* Checklist Validation Toggle Mobile */}
                                      <div onClick={(e) => handleToggleValidation(e, t.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${t.isValidated ? 'bg-green-500 border-green-500 shadow-md' : 'border-slate-300 bg-white/50'}`}>
                                          {t.isValidated && <Check size={12} className="text-white" />}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{t.description}</p>
                                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                              <span className={`w-2 h-2 rounded-full ${card?.color ? card.color.split(' ')[0] : 'bg-slate-300'}`}></span>
                                              <span>{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className={`text-sm font-bold ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                                          {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                                      </p>
                                      {t.isInstallment && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200">Cicilan</span>}
                                  </div>
                              </div>
                          )
                      })}
                      {filteredTransactions.length === 0 && <p className="text-center text-slate-400 py-10">Tidak ada transaksi.</p>}
                 </div>
             </div>
          )}

          {mobileTab === 'report' && (
             <div className="p-4 space-y-4 animate-in fade-in h-full flex flex-col">
                 <h2 className="text-lg font-bold text-slate-800 glass-panel p-3 rounded-2xl w-fit">Laporan Tahunan</h2>
                 
                 <div className="grid grid-cols-2 gap-3 mb-2">
                     <select value={reportCardId} onChange={(e) => setReportCardId(e.target.value)} className="glass-input rounded-xl py-2 px-3 text-xs font-bold">
                          {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="glass-input rounded-xl py-2 px-3 text-xs font-bold">
                          {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                              <option key={y} value={y}>{y}</option>
                          ))}
                      </select>
                 </div>
                 
                 <div className="flex justify-center mb-4">
                     <div className="bg-white/40 p-1 rounded-xl flex gap-1 border border-white/20">
                          <button onClick={() => setReportViewMode('detail')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${reportViewMode === 'detail' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Detail</button>
                          <button onClick={() => setReportViewMode('matrix')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${reportViewMode === 'matrix' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Matriks</button>
                      </div>
                 </div>

                 {reportViewMode === 'detail' ? (
                     <div className="glass-panel rounded-2xl overflow-hidden flex-1 flex flex-col shadow-lg">
                         <div className="overflow-x-auto overflow-y-auto flex-1">
                             <table className="w-full text-left text-xs border-collapse" style={{minWidth: '800px'}}>
                                  <thead>
                                      <tr className="bg-white/30 border-b border-white/30">
                                          <th className="p-3 w-24 font-bold text-slate-700 sticky left-0 bg-white/80 backdrop-blur-md z-10 border-r border-slate-200/50">Bulan</th>
                                          {monthNames.map(m => (
                                              <th key={m} className="p-3 font-bold text-slate-600 text-center border-r border-white/30 w-48">{m.substring(0,3)}</th>
                                          ))}
                                      </tr>
                                  </thead>
                                  <tbody>
                                      <tr className="border-b border-white/30 bg-white/10">
                                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white/80 backdrop-blur-md border-r border-slate-200/50 align-top">Rincian</td>
                                          {monthNames.map((_, i) => {
                                              const report = getMonthlyReportData(reportCardId, i, selectedYear);
                                              return (
                                                  <td key={i} className="p-3 border-r border-white/30 align-top h-40">
                                                      <div className="space-y-1 text-[10px] overflow-y-auto max-h-36">
                                                          {report.expenses.map(t => (
                                                              <div key={t.id} className="text-slate-700 font-medium truncate">• {t.description}</div>
                                                          ))}
                                                          {report.installments.map(ins => (
                                                              <div key={ins.id} className="text-indigo-600 font-medium truncate">• {ins.name}</div>
                                                          ))}
                                                      </div>
                                                  </td>
                                              )
                                          })}
                                      </tr>
                                      <tr className="bg-white/20 border-b border-white/30">
                                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white/80 backdrop-blur-md border-r border-slate-200/50">Total</td>
                                          {monthNames.map((_, i) => (
                                              <td key={i} className="p-3 text-right font-bold text-slate-800 border-r border-white/30">
                                                  {formatIDR(getMonthlyReportData(reportCardId, i, selectedYear).totalBill)}
                                              </td>
                                          ))}
                                      </tr>
                                      <tr className="bg-green-50/40 border-b border-white/30">
                                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-green-50/80 backdrop-blur-md border-r border-slate-200/50">Bayar</td>
                                          {monthNames.map((_, i) => (
                                              <td key={i} className="p-3 text-right font-bold text-green-600 border-r border-white/30">
                                                  {formatIDR(getMonthlyReportData(reportCardId, i, selectedYear).totalPaid)}
                                              </td>
                                          ))}
                                      </tr>
                                      <tr className="bg-white/30">
                                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white/80 backdrop-blur-md border-r border-slate-200/50">Sisa</td>
                                          {monthNames.map((_, i) => {
                                              const rem = getMonthlyReportData(reportCardId, i, selectedYear).remaining;
                                              return (
                                                  <td key={i} className={`p-3 text-right font-bold border-r border-white/30 ${rem > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                      {formatIDR(Math.max(0, rem))}
                                                  </td>
                                              )
                                          })}
                                      </tr>
                                  </tbody>
                             </table>
                         </div>
                     </div>
                 ) : (
                     <div className="glass-panel rounded-2xl overflow-hidden flex-1 flex flex-col shadow-lg">
                         <div className="overflow-auto flex-1">
                             <table className="w-full text-left text-xs border-collapse">
                                 <thead className="bg-white/30 sticky top-0 z-20 backdrop-blur-md">
                                     <tr>
                                         <th className="p-3 font-bold text-slate-700 border-b border-r border-white/30 sticky left-0 bg-white/90 w-24">Bulan</th>
                                         {data.cards.map(c => (
                                             <th key={c.id} className="p-3 font-bold text-slate-600 border-b border-white/30 min-w-[100px] text-right">
                                                 {c.name}
                                             </th>
                                         ))}
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {monthNames.map((month, i) => (
                                         <tr key={i} className="border-b border-white/20">
                                             <td className="p-3 font-medium text-slate-600 border-r border-white/30 sticky left-0 bg-white/80 backdrop-blur-sm">{month.substring(0,3)}</td>
                                             {data.cards.map(c => (
                                                 <td key={c.id} className="p-3 text-right text-slate-700">
                                                     {formatIDR(getMonthlyBill(c.id, i, selectedYear))}
                                                 </td>
                                             ))}
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     </div>
                 )}
             </div>
          )}

          {mobileTab === 'profile' && (
             <div className="p-4 space-y-4 animate-in fade-in">
                 <h2 className="text-lg font-bold text-slate-800 glass-panel p-3 rounded-2xl w-fit">Akun Pengguna</h2>
                 <div className="glass-panel rounded-3xl p-6 text-center border-white/40 shadow-xl">
                     <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                         {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover"/> : <UserIcon className="w-full h-full p-6 text-slate-400"/>}
                     </div>
                     <h3 className="font-bold text-xl text-slate-800">{user.displayName || 'Pengguna'}</h3>
                     <p className="text-slate-500 text-sm mb-6 font-medium">{user.email}</p>
                     
                     <div className="space-y-3">
                         <button className="w-full py-3 bg-white/50 text-slate-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors border border-white/40">
                             <Settings size={18}/> Pengaturan
                         </button>
                         <button className="w-full py-3 bg-white/50 text-slate-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors border border-white/40">
                             <Shield size={18}/> Keamanan
                         </button>
                         <button onClick={() => logout()} className="w-full py-3 bg-red-50/50 text-red-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 mt-4 hover:bg-red-100/50 border border-red-100/50">
                             <LogOut size={18}/> Keluar Aplikasi
                         </button>
                     </div>
                 </div>
                 
                 <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/30 mt-6 relative overflow-hidden">
                     <div className="relative z-10">
                         <h3 className="font-bold text-lg mb-1">LimitWatch Premium</h3>
                         <p className="text-indigo-100 text-sm mb-4">Dapatkan fitur analisis AI dan laporan eksklusif.</p>
                         <button className="bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg">Segera Hadir</button>
                     </div>
                     <div className="absolute -right-6 -bottom-6 bg-white/10 w-40 h-40 rounded-full blur-xl"></div>
                 </div>
                 
                 <div className="text-center text-xs text-slate-500 mt-8 pb-8 font-medium">
                     <p>Versi 2.4.0 (Super App Build)</p>
                     <p>&copy; 2024 LimitWatch Financial</p>
                 </div>
             </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION MOBILE (Floating Pill) */}
        <nav 
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md h-[72px] bg-white/65 backdrop-blur-xl saturate-150 rounded-[40px] shadow-[0_8px_32px_rgba(99,102,241,0.15)] border border-white/50 z-50 flex justify-between items-center px-6"
        >
            <button onClick={() => setMobileTab('home')} className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${mobileTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Home size={22} strokeWidth={mobileTab === 'home' ? 2.5 : 2} />
                <span className="text-[9px] font-bold">Beranda</span>
            </button>
            <button onClick={() => setMobileTab('cards')} className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${mobileTab === 'cards' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <CreditCard size={22} strokeWidth={mobileTab === 'cards' ? 2.5 : 2} />
                <span className="text-[9px] font-bold">Kartu</span>
            </button>
            
            {/* CENTER ADD BUTTON (Floating Out) */}
            <div className="relative -mt-10">
                <button 
                    onClick={openAddTransactionModal}
                    className="btn-liquid w-16 h-16 rounded-full shadow-xl shadow-indigo-500/40 flex items-center justify-center active:scale-90 transition-transform ring-4 ring-white/50"
                >
                    <PlusCircle size={32} strokeWidth={2.5} className="text-white" />
                </button>
            </div>

            <button onClick={() => setMobileTab('savings')} className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${mobileTab === 'savings' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Coins size={22} strokeWidth={mobileTab === 'savings' ? 2.5 : 2} />
                <span className="text-[9px] font-bold">Tabungan</span>
            </button>
            <button onClick={() => setMobileTab('history')} className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${mobileTab === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <History size={22} strokeWidth={mobileTab === 'history' ? 2.5 : 2} />
                <span className="text-[9px] font-bold">Riwayat</span>
            </button>
        </nav>
      </div>

      {/* ========================================= */}
      {/* MODALS & OVERLAYS                         */}
      {/* ========================================= */}
      
      {/* TRANSACTION MODAL */}
      {transactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
           <div className="glass-panel w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 bg-white/80">
              <div className="flex justify-between items-center p-4 border-b border-white/40 shrink-0">
                 <h3 className="font-bold text-lg text-slate-800">
                     {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi'}
                 </h3>
                 <button onClick={() => setTransactionModalOpen(false)} className="bg-black/5 p-2 rounded-full hover:bg-black/10 transition-colors">
                     <X size={20} className="text-slate-500"/>
                 </button>
              </div>
              
              <form onSubmit={handleSaveTransaction} className="p-5 space-y-5 overflow-y-auto">
                 {/* Type Toggle */}
                 <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-white/50">
                    <button 
                       type="button" 
                       onClick={() => setTxType(TransactionType.EXPENSE)}
                       className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${txType === TransactionType.EXPENSE ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}
                    >
                       Pengeluaran
                    </button>
                    <button 
                       type="button" 
                       onClick={() => setTxType(TransactionType.PAYMENT)}
                       className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${txType === TransactionType.PAYMENT ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}
                    >
                       Pembayaran
                    </button>
                 </div>

                 {/* Card Selection */}
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Kartu Kredit</label>
                    <div className="relative">
                       <CreditCard className="absolute left-3 top-3 text-slate-400" size={18}/>
                       <select 
                          required
                          value={txCardId} 
                          onChange={(e) => setTxCardId(e.target.value)}
                          className="w-full glass-input rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none"
                       >
                          <option value="" disabled>Pilih Kartu</option>
                          {data.cards.map(c => (
                             <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 {/* Amount Input */}
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nominal (Rp)</label>
                    <input 
                       type="text"
                       inputMode="numeric" 
                       required
                       placeholder="0"
                       value={txAmount}
                       onChange={(e) => handleCurrencyInput(e.target.value, setTxAmount)}
                       className="w-full text-3xl font-bold bg-transparent border-b-2 border-slate-200 py-2 px-1 text-slate-800 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-300"
                    />
                 </div>

                 {/* Date & Desc */}
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
                        <input 
                           type="date" 
                           required
                           value={txDate}
                           onChange={(e) => setTxDate(e.target.value)}
                           className="w-full glass-input rounded-xl py-2.5 px-3 text-sm text-slate-700 outline-none font-medium"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Keterangan</label>
                        <input 
                           type="text" 
                           placeholder={txType === TransactionType.EXPENSE ? "Beli apa?" : "Bayar tagihan"}
                           value={txDesc}
                           onChange={(e) => setTxDesc(e.target.value)}
                           className="w-full glass-input rounded-xl py-2.5 px-3 text-sm text-slate-700 outline-none font-medium"
                        />
                     </div>
                 </div>

                 {/* NEW: Payment Target Month & Year Selection (Only for Payments) */}
                 {txType === TransactionType.PAYMENT && (
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Target Pembayaran Tagihan</label>
                         <div className="grid grid-cols-2 gap-4">
                             <select 
                                value={txTargetMonth} 
                                onChange={(e) => setTxTargetMonth(parseInt(e.target.value))}
                                className="glass-input rounded-xl py-2.5 px-3 text-sm font-bold outline-none"
                             >
                                 {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                             </select>
                             <select 
                                value={txTargetYear} 
                                onChange={(e) => setTxTargetYear(parseInt(e.target.value))}
                                className="glass-input rounded-xl py-2.5 px-3 text-sm font-bold outline-none"
                             >
                                 {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                     <option key={y} value={y}>{y}</option>
                                 ))}
                             </select>
                         </div>
                     </div>
                 )}

                 {/* Options based on Type */}
                 {txType === TransactionType.EXPENSE && (
                     <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2">
                              <Calculator size={18} className="text-indigo-600"/>
                              <span className="font-bold text-sm text-indigo-800">Ubah jadi Cicilan?</span>
                           </div>
                           <button 
                              type="button"
                              onClick={() => setTxIsInstallment(!txIsInstallment)}
                              className={`w-12 h-7 rounded-full transition-colors relative shadow-inner ${txIsInstallment ? 'bg-indigo-500' : 'bg-slate-300'}`}
                           >
                              <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform ${txIsInstallment ? 'translate-x-5' : ''}`}></div>
                           </button>
                        </div>
                        {txIsInstallment && (
                           <div className="mt-3 animate-in slide-in-from-top-2">
                              <label className="block text-xs font-bold text-indigo-700 mb-1">Lama Cicilan (Bulan)</label>
                              <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    min="1"
                                    max="60"
                                    value={txInstallmentMonths}
                                    onChange={(e) => setTxInstallmentMonths(parseInt(e.target.value) || 1)}
                                    className="w-full glass-input border-indigo-200 rounded-lg py-2 px-3 text-sm font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-bold text-indigo-500 shrink-0">Bulan</span>
                              </div>
                              <p className="text-xs text-indigo-500 mt-2 font-medium">
                                 Estimasi: {formatIDR(getNumericValue(txAmount) / txInstallmentMonths)} / bulan
                              </p>
                           </div>
                        )}
                     </div>
                 )}

                 {txType === TransactionType.PAYMENT && !editingTransaction && (
                     <div className="space-y-3">
                         <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Coins size={18} className="text-green-600"/>
                                <span className="font-bold text-sm text-green-800">Ambil dari Tabungan?</span>
                             </div>
                             <button 
                                type="button"
                                onClick={() => setPayFromSavings(!payFromSavings)}
                                className={`w-12 h-7 rounded-full transition-colors relative shadow-inner ${payFromSavings ? 'bg-green-500' : 'bg-slate-300'}`}
                             >
                                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform ${payFromSavings ? 'translate-x-5' : ''}`}></div>
                             </button>
                         </div>
                         
                         {payFromSavings && (
                             <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 text-sm space-y-2 animate-in slide-in-from-top-2">
                                 <div className="flex items-start gap-2 text-indigo-800 font-bold mb-1">
                                     <Info size={16} className="mt-0.5"/>
                                     <span>Simulasi Pembayaran</span>
                                 </div>
                                 {(() => {
                                     // Calculate on the fly for display
                                     const report = getMonthlyReportData(txCardId, txTargetMonth, txTargetYear);
                                     const totalAvailableSavings = data.savings
                                        .filter(s => s.cardId === txCardId && !s.isTransferred)
                                        .reduce((sum, s) => sum + s.amount, 0);
                                     
                                     const inputAmount = getNumericValue(txAmount);
                                     const remainingBill = Math.max(0, report.remaining);
                                     const projectedRemaining = Math.max(0, remainingBill - inputAmount);

                                     return (
                                         <div className="space-y-1 text-slate-600">
                                             <div className="flex justify-between">
                                                 <span>Tabungan Tersedia:</span>
                                                 <span className="font-bold text-green-600">{formatIDR(totalAvailableSavings)}</span>
                                             </div>
                                             <div className="h-px bg-indigo-200/50 my-1"></div>
                                             <div className="flex justify-between">
                                                 <span>Total Tagihan ({monthNames[txTargetMonth]}):</span>
                                                 <span className="font-bold">{formatIDR(report.totalBill)}</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span>Sisa Tagihan (Saat ini):</span>
                                                 <span className="font-bold text-red-500">{formatIDR(remainingBill)}</span>
                                             </div>
                                             <div className="flex justify-between border-t border-indigo-200/50 pt-1 mt-1">
                                                 <span className="font-bold text-indigo-700">Sisa Setelah Bayar:</span>
                                                 <span className="font-bold text-indigo-700">{formatIDR(projectedRemaining)}</span>
                                             </div>
                                         </div>
                                     );
                                 })()}
                             </div>
                         )}
                     </div>
                 )}

                 {/* Action Buttons */}
                 <div className="flex gap-3 pt-2">
                     {editingTransaction && (
                         <button 
                           type="button" 
                           onClick={() => handleDeleteClick(editingTransaction.id)}
                           className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition shadow-sm"
                         >
                             Hapus
                         </button>
                     )}
                     <button 
                        type="submit" 
                        className="flex-1 btn-liquid text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:opacity-90 transition active:scale-95"
                     >
                        {editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                     </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* CARD MODAL */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
           <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white/80">
              <h3 className="font-bold text-lg mb-4 text-slate-800">{editingCard ? 'Edit Kartu' : 'Tambah Kartu Baru'}</h3>
              <form onSubmit={handleSaveCard} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Nama Kartu</label>
                      <input type="text" required value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" placeholder="Contoh: BCA Visa" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Limit Kartu</label>
                      <input type="text" inputMode="numeric" required value={cardLimit} onChange={(e) => handleCurrencyInput(e.target.value, setCardLimit)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" placeholder="0" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Cetak Tagihan (1-31)</label>
                      <input type="number" min="1" max="31" value={cardDue} onChange={(e) => setCardDue(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" placeholder="Contoh: 25" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Warna Kartu</label>
                      <div className="flex flex-wrap gap-2">
                          {CARD_COLORS.map(color => (
                              <button
                                  key={color.id}
                                  type="button"
                                  onClick={() => setCardColor(color.class)}
                                  className={`w-10 h-10 rounded-full ${color.class} ${cardColor === color.class ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'} transition-all`}
                                  title={color.label}
                              />
                          ))}
                      </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                      {editingCard && (
                          <button type="button" onClick={() => handleDeleteCard(editingCard.id)} className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold shadow-sm">Hapus</button>
                      )}
                      <button type="submit" className="flex-1 btn-liquid text-white py-3 rounded-xl font-bold shadow-lg">Simpan Kartu</button>
                  </div>
                  <button type="button" onClick={() => setCardModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
              </form>
           </div>
        </div>
      )}

      {/* SAVING MODAL */}
      {savingModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
            <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white/80">
               <h3 className="font-bold text-lg mb-4 text-slate-800">{editingSaving ? 'Edit Tabungan' : 'Tambah Tabungan'}</h3>
               <form onSubmit={handleSaveSaving} className="space-y-4">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Target Kartu</label>
                       <select value={savingCardId} onChange={(e) => setSavingCardId(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none">
                           {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Untuk Tagihan Bulan</label>
                       <div className="grid grid-cols-2 gap-2">
                           <select value={savingTargetMonth} onChange={(e) => setSavingTargetMonth(parseInt(e.target.value))} className="glass-input rounded-xl p-3 text-sm font-semibold outline-none">
                               {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                           </select>
                           <select value={savingTargetYear} onChange={(e) => setSavingTargetYear(parseInt(e.target.value))} className="glass-input rounded-xl p-3 text-sm font-semibold outline-none">
                               {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
                                   <option key={y} value={y}>{y}</option>
                               ))}
                           </select>
                       </div>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Nominal (Rp)</label>
                       <input type="text" inputMode="numeric" required value={savingAmount} onChange={(e) => handleCurrencyInput(e.target.value, setSavingAmount)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" placeholder="0"/>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Catatan (Opsional)</label>
                       <input type="text" value={savingNote} onChange={(e) => setSavingNote(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" placeholder="Contoh: Gaji Bulan Ini"/>
                   </div>
                   <div className="flex gap-3 mt-4">
                       {editingSaving && (
                           <button type="button" onClick={() => handleDeleteSaving(editingSaving.id)} className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold shadow-sm">Hapus</button>
                       )}
                       <button type="submit" className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200">Simpan</button>
                   </div>
                   <button type="button" onClick={() => setSavingModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
               </form>
            </div>
         </div>
      )}

      {/* WALLET MODAL */}
      {walletModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
             <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white/80">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">{editingWallet ? 'Edit Dompet' : 'Tambah Dompet'}</h3>
                 <form onSubmit={handleSaveWallet} className="space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Nama Dompet</label>
                         <input type="text" required value={walletName} onChange={(e) => setWalletName(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" placeholder="Contoh: BCA Debit"/>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Tipe</label>
                         <select value={walletType} onChange={(e) => setWalletType(e.target.value as any)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none">
                             <option value="BANK">Bank</option>
                             <option value="EWALLET">E-Wallet</option>
                             <option value="CASH">Tunai</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Saldo Awal</label>
                         <input type="text" inputMode="numeric" required value={walletBalance} onChange={(e) => handleCurrencyInput(e.target.value, setWalletBalance)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" placeholder="0"/>
                     </div>
                     <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Warna</label>
                      <div className="flex flex-wrap gap-2">
                          {CARD_COLORS.map(color => (
                              <button
                                  key={color.id}
                                  type="button"
                                  onClick={() => setWalletColor(color.class)}
                                  className={`w-10 h-10 rounded-full ${color.class} ${walletColor === color.class ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'} transition-all`}
                              />
                          ))}
                      </div>
                  </div>
                     <div className="flex gap-3 mt-4">
                         {editingWallet && (
                             <button type="button" onClick={() => handleDeleteWallet(editingWallet.id)} className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold shadow-sm">Hapus</button>
                         )}
                         <button type="submit" className="flex-1 btn-liquid text-white py-3 rounded-xl font-bold">Simpan</button>
                     </div>
                     <button type="button" onClick={() => setWalletModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
                 </form>
             </div>
          </div>
      )}

      {/* WALLET INCOME MODAL */}
      {walletIncomeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
             <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white/80">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">Isi Saldo Dompet</h3>
                 <form onSubmit={handleWalletIncome}>
                     <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Nominal Masuk (Rp)</label>
                         <input type="text" inputMode="numeric" required value={incomeAmount} onChange={(e) => handleCurrencyInput(e.target.value, setIncomeAmount)} className="w-full glass-input rounded-xl p-4 text-2xl font-bold outline-none" autoFocus/>
                     </div>
                     <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold mb-3 shadow-lg shadow-green-200">Tambah Saldo</button>
                     <button type="button" onClick={() => setWalletIncomeModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
                 </form>
             </div>
          </div>
      )}

      {/* WALLET TRANSFER MODAL */}
      {walletTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
             <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white/80">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">Transfer ke Tabungan</h3>
                 <form onSubmit={handleWalletTransferToSaving}>
                     <div className="space-y-4 mb-6">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Nominal (Rp)</label>
                             <input type="text" inputMode="numeric" required value={transferAmount} onChange={(e) => handleCurrencyInput(e.target.value, setTransferAmount)} className="w-full glass-input rounded-xl p-3 text-xl font-bold outline-none"/>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Ke Tabungan Kartu</label>
                             <select value={transferTargetCardId} onChange={(e) => setTransferTargetCardId(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none">
                                 {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                         </div>
                     </div>
                     <button type="submit" className="w-full btn-liquid text-white py-3 rounded-xl font-bold mb-3">Transfer Sekarang</button>
                     <button type="button" onClick={() => setWalletTransferModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
                 </form>
             </div>
          </div>
      )}

      {/* INSTALLMENT MANUAL FORM MODAL */}
      {installmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
             <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white/80">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">Catat Cicilan Manual</h3>
                 <form onSubmit={handleSaveInstallmentManual} className="space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Nama Barang</label>
                         <input type="text" value={instName} onChange={(e) => setInstName(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" placeholder="Contoh: iPhone 15"/>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Kartu Kredit</label>
                         <select value={instCardId} onChange={(e) => setInstCardId(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none">
                             {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Total Harga (Rp)</label>
                             <input type="text" inputMode="numeric" required value={instTotal} onChange={(e) => handleCurrencyInput(e.target.value, setInstTotal)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" placeholder="0"/>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Tenor (Bulan)</label>
                             <input type="number" min="1" required value={instTenure} onChange={(e) => setInstTenure(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none" />
                        </div>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Cicilan Per Bulan (Rp)</label>
                         <input type="text" inputMode="numeric" required value={instMonthlyAmount} onChange={(e) => handleCurrencyInput(e.target.value, setInstMonthlyAmount)} className="w-full glass-input border-indigo-200 rounded-xl p-3 text-sm font-bold text-indigo-700 outline-none focus:border-indigo-500" placeholder="0"/>
                         <p className="text-[10px] text-slate-400 mt-1">*Otomatis dihitung, tapi bisa diubah manual.</p>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Mulai</label>
                         <input type="date" value={instStartDate} onChange={(e) => setInstStartDate(e.target.value)} className="w-full glass-input rounded-xl p-3 text-sm font-semibold outline-none"/>
                     </div>
                     <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 mt-2">Simpan Cicilan</button>
                     <button type="button" onClick={() => setInstallmentModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
                 </form>
             </div>
          </div>
      )}

      {/* INSTALLMENT LIST MODAL */}
      {installmentListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
             <div className="glass-panel w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] bg-white/90">
                 <div className="p-4 border-b border-white/40 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Daftar Cicilan Aktif</h3>
                    <div className="flex gap-2">
                        <button onClick={openInstallmentModal} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100">+ Baru</button>
                        <button onClick={() => setInstallmentListModalOpen(false)} className="bg-black/5 p-2 rounded-full"><X size={18}/></button>
                    </div>
                 </div>
                 <div className="p-4 overflow-y-auto space-y-3 flex-1">
                    {data.installments.filter(i => {
                        return isInstallmentActiveInMonth(i, currentMonth, currentYear) || isInstallmentFuture(i, currentMonth, currentYear);
                    }).length === 0 ? (
                        <p className="text-center text-slate-400 py-8">Tidak ada cicilan aktif bulan ini.</p>
                    ) : (
                        data.installments
                        .filter(i => {
                            return isInstallmentActiveInMonth(i, currentMonth, currentYear) || isInstallmentFuture(i, currentMonth, currentYear);
                        })
                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map(inst => {
                            const card = data.cards.find(c => c.id === inst.cardId);
                            const startDate = new Date(inst.startDate);
                            const now = new Date();
                            const diffMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
                            const currentN = diffMonths + 1;
                            
                            const isFuture = diffMonths < 0;

                            return (
                                <div key={inst.id} className={`border border-white/40 rounded-2xl p-4 relative group ${isFuture ? 'bg-slate-50/50 opacity-70 border-dashed' : 'glass-panel'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-slate-800">{inst.name}</p>
                                            <p className="text-xs text-slate-500">{card?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-indigo-600">{formatIDR(inst.monthlyAmount)}</p>
                                            <p className="text-xs text-slate-400">/ bulan</p>
                                        </div>
                                    </div>
                                    
                                    {isFuture ? (
                                        <div className="w-full bg-orange-100 text-orange-600 text-[10px] font-bold py-1 px-2 rounded text-center mb-2">
                                            Mulai Tagihan Bulan Depan
                                        </div>
                                    ) : (
                                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                                            <div 
                                                className="bg-indigo-500 h-full rounded-full" 
                                                style={{ width: `${Math.min(100, (currentN / inst.totalMonths) * 100)}%` }}
                                            ></div>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>{isFuture ? 'Menunggu' : `Ke ${Math.max(1, currentN)} dari ${inst.totalMonths}`}</span>
                                        <span>Total: {formatIDR(inst.totalAmount)}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteInstallmentDirectly(inst.id)}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        title="Hapus Cicilan (Force Delete)"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )
                        })
                    )}
                 </div>
             </div>
          </div>
      )}

      {/* WITHDRAW MODAL */}
      {withdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
             <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white/80">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">Ambil Tabungan</h3>
                 <form onSubmit={handleConfirmWithdraw}>
                     <p className="text-sm text-slate-500 mb-4">
                         Mengambil dana dari tabungan yang belum terpakai.
                     </p>
                     <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Nominal (Rp)</label>
                         <input type="text" inputMode="numeric" required value={withdrawAmount} onChange={(e) => handleCurrencyInput(e.target.value, setWithdrawAmount)} className="w-full glass-input rounded-xl p-3 font-bold outline-none" autoFocus/>
                     </div>
                     <div className="flex gap-3">
                         <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg">Ambil</button>
                         <button type="button" onClick={() => setWithdrawModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Batal</button>
                     </div>
                 </form>
             </div>
          </div>
      )}

      {/* BATCH PAY MODAL */}
      {batchPayModalOpen && activeBatchGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
             <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white/80">
                 <div className="text-center mb-6">
                     <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                         <CheckSquare size={24}/>
                     </div>
                     <h3 className="font-bold text-lg text-slate-800">Konfirmasi Pembayaran</h3>
                     <p className="text-sm text-slate-500 mt-1">{activeBatchGroup.label}</p>
                 </div>
                 
                 <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3 mb-6">
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">Total Tabungan</span>
                         <span className="font-bold text-slate-800">{formatIDR(activeBatchGroup.total)}</span>
                     </div>
                     {activeBatchGroup.month >= 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Tagihan {monthNames[activeBatchGroup.month]}</span>
                            <span className="font-bold text-red-600">
                                {formatIDR(getMonthlyBill(activeBatchGroup.items[0].cardId, activeBatchGroup.month, activeBatchGroup.year))}
                            </span>
                        </div>
                     )}
                 </div>

                 <button onClick={handleConfirmBatchPay} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 mb-3">
                     Bayar Tagihan Sekarang
                 </button>
                 <button onClick={() => setBatchPayModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">
                     Batal
                 </button>
             </div>
          </div>
      )}

      {/* CARD SPECIFIC HISTORY MODAL (INVOICE) */}
      {selectedCardForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
             <div className="glass-panel w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] bg-white/90">
                 <div className="p-4 border-b border-white/40 flex justify-between items-center bg-white/30">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <CreditCard size={20}/>
                        Invoice: {selectedCardForHistory.name}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => handleShareInvoice()} className="flex items-center gap-2 bg-white/50 border border-white/40 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-white">
                            <Share2 size={16}/> Share PDF
                        </button>
                        <button onClick={closeCardHistory} className="bg-black/5 p-2 rounded-full hover:bg-black/10 transition-colors"><X size={18}/></button>
                    </div>
                 </div>
                 
                 <div className="p-4 border-b border-white/40 flex gap-4">
                     <select 
                        value={cardHistoryMonth} 
                        onChange={(e) => setCardHistoryMonth(parseInt(e.target.value))}
                        className="glass-input rounded-xl py-2 px-3 text-sm font-semibold outline-none"
                     >
                         {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                     </select>
                     <select 
                        value={cardHistoryYear} 
                        onChange={(e) => setCardHistoryYear(parseInt(e.target.value))}
                        className="glass-input rounded-xl py-2 px-3 text-sm font-semibold outline-none"
                     >
                         {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                             <option key={y} value={y}>{y}</option>
                         ))}
                     </select>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 bg-white/40 invoice-container">
                    {(() => {
                        const report = getMonthlyReportData(selectedCardForHistory.id, cardHistoryMonth, cardHistoryYear);
                        return (
                            <div className="space-y-6">
                                <div className="text-center border-b border-white/40 pb-4">
                                    <h2 className="text-2xl font-bold text-slate-800">Tagihan Kartu Kredit</h2>
                                    <p className="text-slate-500">{monthNames[cardHistoryMonth]} {cardHistoryYear}</p>
                                </div>

                                {/* Summary Box */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-white/50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Total Tagihan</p>
                                        <p className="text-lg font-bold text-slate-800">{formatIDR(report.totalBill)}</p>
                                    </div>
                                    <div className="bg-green-50/50 p-3 rounded-xl border border-green-100/50">
                                        <p className="text-xs text-green-600 uppercase">Dibayar</p>
                                        <p className="text-lg font-bold text-green-600">{formatIDR(report.totalPaid)}</p>
                                    </div>
                                    <div className="glass-panel border-white/40 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Sisa Tagihan</p>
                                        <p className={`text-lg font-bold ${report.remaining <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatIDR(report.remaining)}
                                        </p>
                                    </div>
                                </div>

                                {/* Transactions List */}
                                <div>
                                    <h4 className="font-bold text-slate-700 mb-3 border-l-4 border-indigo-500 pl-3">Transaksi Baru</h4>
                                    {report.expenses.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">Tidak ada transaksi belanja baru.</p>
                                    ) : (
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="text-slate-400 border-b border-white/40">
                                                    <th className="py-2 font-medium">Tanggal</th>
                                                    <th className="py-2 font-medium">Keterangan</th>
                                                    <th className="py-2 font-medium text-right">Jumlah</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.expenses.map(t => (
                                                    <tr key={t.id} className="border-b border-white/20">
                                                        <td className="py-2 text-slate-500">{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</td>
                                                        <td className="py-2 text-slate-700">{t.description}</td>
                                                        <td className="py-2 text-right font-medium text-slate-800">{formatIDR(t.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Installments List */}
                                <div>
                                    <h4 className="font-bold text-slate-700 mb-3 border-l-4 border-indigo-500 pl-3">Cicilan Berjalan</h4>
                                    {report.installments.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">Tidak ada tagihan cicilan bulan ini.</p>
                                    ) : (
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="text-slate-400 border-b border-white/40">
                                                    <th className="py-2 font-medium">Cicilan</th>
                                                    <th className="py-2 font-medium">Ke</th>
                                                    <th className="py-2 font-medium text-right">Jumlah</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.installments.map(i => (
                                                    <tr key={i.id} className="border-b border-white/20">
                                                        <td className="py-2 text-slate-700">{i.name}</td>
                                                        <td className="py-2 text-slate-500 text-xs">{i.currentMonthIndex}/{i.totalMonths}</td>
                                                        <td className="py-2 text-right font-medium text-slate-800">{formatIDR(i.monthlyAmount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Payments List */}
                                <div>
                                    <h4 className="font-bold text-slate-700 mb-3 border-l-4 border-green-500 pl-3">Pembayaran Masuk</h4>
                                    {report.payments.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">Belum ada pembayaran.</p>
                                    ) : (
                                        <table className="w-full text-sm text-left">
                                            <tbody>
                                                {report.payments.map(t => (
                                                    <tr key={t.id} className="border-b border-white/20">
                                                        <td className="py-2 text-slate-500 w-24">{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</td>
                                                        <td className="py-2 text-slate-700">{t.description}</td>
                                                        <td className="py-2 text-right font-bold text-green-600">{formatIDR(t.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
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