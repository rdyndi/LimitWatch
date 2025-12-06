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
  Info,
  ArrowLeft,
  PiggyBank,
  Smartphone
} from "lucide-react";
import { getFinancialAdvice } from "./services/geminiService";

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
// Helper to parse "Rp 10.000" back to 10000
const getNumericValue = (val: string) => {
    return parseInt(val.replace(/\D/g, '') || '0', 10);
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Predefined Card Colors
const CARD_COLORS = [
  { id: 'slate', class: 'bg-gradient-to-br from-slate-700 to-slate-900', label: 'Hitam' },
  { id: 'blue', class: 'bg-gradient-to-br from-blue-600 to-blue-800', label: 'Biru' },
  { id: 'emerald', class: 'bg-gradient-to-br from-emerald-600 to-emerald-800', label: 'Hijau' },
  { id: 'red', class: 'bg-gradient-to-br from-red-600 to-red-800', label: 'Merah' },
  { id: 'purple', class: 'bg-gradient-to-br from-purple-600 to-purple-800', label: 'Ungu' },
  { id: 'orange', class: 'bg-gradient-to-br from-orange-500 to-orange-700', label: 'Oranye' },
  { id: 'pink', class: 'bg-gradient-to-br from-pink-600 to-pink-800', label: 'Pink' },
  { id: 'cyan', class: 'bg-gradient-to-br from-cyan-600 to-cyan-800', label: 'Cyan' },
];

interface NotificationItem {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  date: string;
}

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
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<NotificationItem | null>(null);
  
  // Profile Menu State (Mobile & Desktop)
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
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
  const [expandedMonths, setExpandedMonths] = useState<string[]>([new Date().getFullYear() + '-' + new Date().getMonth()]); // Default expand current month

  // Swipe Gesture States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  // Removed touchEnd state to prevent re-renders on scroll
  const minSwipeDistance = 50;
  const maxVerticalDistance = 30; // Maximum allowed vertical scroll during swipe

  // Drag & Drop Mobile Menu States
  const [menuOrder, setMenuOrder] = useState<string[]>(['transaksi', 'cicilan', 'wallets', 'laporan', 'kartu', 'tabungan', 'history', 'bills', 'profile']);
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
    if (!card) return { expenses: [], installments: [], payments: [], totalBill: 0, totalPaid: 0, remaining: 0 };

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
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || touchStartY === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const horizontalDistance = touchStart - touchEnd;
    const verticalDistance = Math.abs(touchStartY - touchEndY);
    
    // Reset state first
    setTouchStart(null);
    setTouchStartY(null);

    // Only consider it a swipe if vertical scrolling was minimal
    if (verticalDistance > maxVerticalDistance) {
        return;
    }

    const isLeftSwipe = horizontalDistance > minSwipeDistance;
    const isRightSwipe = horizontalDistance < -minSwipeDistance;

    if (isRightSwipe) {
      if (mobileTab !== 'home') {
          setMobileTab('home');
      }
    }
    // We could add isLeftSwipe logic here if needed for future features
  };

  const handleSaveTransaction = async () => {
    if (!user || !txCardId) return;

    const amount = getNumericValue(txAmount);
    if (amount <= 0) return;

    const newTx: Transaction = {
      id: generateId(),
      cardId: txCardId,
      amount: amount,
      date: txDate,
      description: txDesc || (txType === TransactionType.EXPENSE ? 'Pengeluaran' : 'Pembayaran Tagihan'),
      type: txType,
      isInstallment: txIsInstallment,
      targetPeriod: txType === TransactionType.PAYMENT ? { month: txTargetMonth, year: txTargetYear } : undefined
    };

    let updatedInstallments = [...data.installments];
    let updatedSavings = [...data.savings];

    // Jika user memilih untuk convert ke cicilan
    if (txType === TransactionType.EXPENSE && txIsInstallment) {
      const installmentId = generateId();
      const newInstallment: Installment = {
        id: installmentId,
        cardId: txCardId,
        name: txDesc || 'Cicilan Transaksi',
        totalAmount: amount,
        totalMonths: txInstallmentMonths,
        monthsPaid: 0,
        startDate: txDate,
        monthlyAmount: Math.ceil(amount / txInstallmentMonths)
      };
      updatedInstallments.push(newInstallment);
      newTx.installmentId = installmentId;
    }

    // Jika pembayaran diambil dari tabungan
    if (txType === TransactionType.PAYMENT && payFromSavings) {
       // Logic sederhana: tandai tabungan terlama yang belum ditransfer sebagai transferred
       // sampai jumlahnya mencukupi atau habis.
       let remainingPay = amount;
       updatedSavings = updatedSavings.map(s => {
          if (s.cardId === txCardId && !s.isTransferred && remainingPay > 0) {
             if (s.amount <= remainingPay) {
                remainingPay -= s.amount;
                return { ...s, isTransferred: true };
             } else {
                 // Partial usage logic could be complex, for now we don't split savings
                 // User should ideally match savings
                 return s;
             }
          }
          return s;
       });
    }

    const updatedData = {
      ...data,
      transactions: [...data.transactions, newTx],
      installments: updatedInstallments,
      savings: updatedSavings
    };

    setData(updatedData);
    await saveAppState(user.uid, updatedData);
    setTransactionModalOpen(false);
    
    // Reset form
    setTxAmount('');
    setTxDesc('');
    setTxIsInstallment(false);
    setPayFromSavings(false);
  };

  const handleSaveCard = async () => {
    if (!user) return;
    const limit = getNumericValue(cardLimit);
    if (!cardName || limit <= 0) return;

    const newCard: CreditCardType = {
      id: generateId(),
      name: cardName,
      limit: limit,
      color: cardColor,
      dueDay: cardDue ? parseInt(cardDue) : undefined
    };

    const updatedData = { ...data, cards: [...data.cards, newCard] };
    setData(updatedData);
    await saveAppState(user.uid, updatedData);
    setCardModalOpen(false);
    setCardName('');
    setCardLimit('');
    setCardDue('');
  };
  
  const handleSaveWallet = async () => {
    if (!user) return;
    const balance = getNumericValue(walletBalance);
    if (!walletName) return;

    const newWallet: WalletType = {
      id: generateId(),
      name: walletName,
      type: walletType,
      balance: balance,
      color: walletColor
    };

    const updatedData = { ...data, wallets: [...(data.wallets || []), newWallet] };
    setData(updatedData);
    await saveAppState(user.uid, updatedData);
    setWalletModalOpen(false);
    setWalletName('');
    setWalletBalance('');
  };

  const handleSaveSaving = async () => {
      if (!user) return;
      const amount = getNumericValue(savingAmount);
      if(amount <= 0) return;
      
      const newSaving: Saving = {
          id: generateId(),
          cardId: savingCardId,
          amount,
          date: new Date().toISOString(),
          note: savingNote,
          isTransferred: false,
          targetPeriod: { month: savingTargetMonth, year: savingTargetYear }
      };
      
      const updatedData = { ...data, savings: [...data.savings, newSaving] };
      setData(updatedData);
      await saveAppState(user.uid, updatedData);
      setSavingModalOpen(false);
      setSavingAmount('');
      setSavingNote('');
  };

  const handleGetAiAdvice = async () => {
    setAiLoading(true);
    setAiModalOpen(true);
    const advice = await getFinancialAdvice(data);
    setAiAdvice(advice);
    setAiLoading(false);
  };

  const toggleMonthExpand = (key: string) => {
    setExpandedMonths(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // --- Render Helpers ---

  if (!user) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                     <Wallet className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">LimitWatch</h1>
                  <p className="text-slate-500 mb-8">Kelola kartu kredit dan hutang Anda dengan cerdas dan terencana.</p>
                  
                  {isRegistering ? (
                      <div className="space-y-4">
                          <input type="text" placeholder="Nama Lengkap" className="w-full p-3 border rounded-xl" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
                          <input type="email" placeholder="Email" className="w-full p-3 border rounded-xl" value={email} onChange={e=>setEmail(e.target.value)} />
                          <input type="password" placeholder="Password" className="w-full p-3 border rounded-xl" value={password} onChange={e=>setPassword(e.target.value)} />
                          <button onClick={async () => {
                              try {
                                  setAuthLoading(true);
                                  const u = await registerWithEmail(email, password);
                                  if(u) { await updateUserProfile(displayName); setUser(u); }
                              } catch(e: any) { setAuthError(e.message); }
                              finally { setAuthLoading(false); }
                          }} className="w-full py-3 bg-primary text-white font-bold rounded-xl">{authLoading ? 'Loading...' : 'Daftar'}</button>
                          <p className="text-sm text-slate-500 mt-4">Sudah punya akun? <button onClick={()=>setIsRegistering(false)} className="text-primary font-bold">Login</button></p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                           <input type="email" placeholder="Email" className="w-full p-3 border rounded-xl" value={email} onChange={e=>setEmail(e.target.value)} />
                           <input type="password" placeholder="Password" className="w-full p-3 border rounded-xl" value={password} onChange={e=>setPassword(e.target.value)} />
                           <button onClick={async () => {
                              try {
                                  setAuthLoading(true);
                                  await loginWithEmail(email, password);
                              } catch(e: any) { setAuthError(e.message); }
                              finally { setAuthLoading(false); }
                          }} className="w-full py-3 bg-primary text-white font-bold rounded-xl">{authLoading ? 'Loading...' : 'Login Email'}</button>
                           
                          <div className="relative my-6">
                              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">Atau</span></div>
                          </div>

                          <button onClick={loginWithGoogle} className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50">
                              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                              Login dengan Google
                          </button>
                           <p className="text-sm text-slate-500 mt-4">Belum punya akun? <button onClick={()=>setIsRegistering(true)} className="text-primary font-bold">Daftar</button></p>
                      </div>
                  )}
                  {authError && <p className="text-red-500 text-sm mt-4 bg-red-50 p-2 rounded">{authError}</p>}
              </div>
          </div>
      );
  }

  // Calculate Dashboard Data
  const totalDebt = data.cards.reduce((sum, card) => {
      const expenses = data.transactions.filter(t => t.cardId === card.id && t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      const payments = data.transactions.filter(t => t.cardId === card.id && t.type === 'PAYMENT').reduce((s, t) => s + t.amount, 0);
      return sum + (expenses - payments);
  }, 0);

  const totalLimit = data.cards.reduce((sum, card) => sum + card.limit, 0);
  const totalSavings = data.savings.filter(s => !s.isTransferred).reduce((sum, s) => sum + s.amount, 0);
  const utilization = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;
  
  // Calculate simulation for transaction modal
  const getSimulationData = () => {
    const savingsForCard = data.savings
        .filter(s => s.cardId === txCardId && !s.isTransferred)
        .reduce((sum, s) => sum + s.amount, 0);
    
    // Get current unpaid bill for this card (Simplified for simulation)
    const cardExpenses = data.transactions
        .filter(t => t.cardId === txCardId && t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);
    const cardPayments = data.transactions
        .filter(t => t.cardId === txCardId && t.type === 'PAYMENT')
        .reduce((sum, t) => sum + t.amount, 0);
    const currentDebt = cardExpenses - cardPayments;

    const amountToPay = getNumericValue(txAmount);
    
    return {
        savingsAvailable: savingsForCard,
        currentDebt,
        amountToPay,
        remainingSavings: savingsForCard - (payFromSavings ? amountToPay : 0),
        remainingDebt: currentDebt - amountToPay
    };
  };

  const simulation = getSimulationData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-0 font-sans" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Toast Notification */}
      {showToast && toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-slide-down w-[90%] max-w-md">
            <div className={`p-4 rounded-xl shadow-lg flex items-start gap-3 ${toastMessage.type === 'urgent' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>
                <AlertCircle className="shrink-0" />
                <div>
                    <h4 className="font-bold">{toastMessage.title}</h4>
                    <p className="text-sm opacity-90">{toastMessage.message}</p>
                </div>
                <button onClick={() => setShowToast(false)} className="ml-auto opacity-70 hover:opacity-100"><X size={18} /></button>
            </div>
        </div>
      )}

      {/* Main Header (Desktop/Mobile) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between pt-safe">
         {mobileTab !== 'home' ? (
             <button onClick={() => setMobileTab('home')} className="flex items-center gap-2 text-slate-700 hover:bg-slate-100 p-1.5 -ml-2 rounded-lg transition-colors">
                 <ArrowLeft size={24} />
                 <span className="font-bold text-lg">Kembali</span>
             </button>
         ) : (
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                     <Wallet className="text-white w-5 h-5" />
                 </div>
                 <span className="font-bold text-lg text-primary tracking-tight">LimitWatch</span>
             </div>
         )}
         
         <div className="flex items-center gap-3">
             <button onClick={() => setAiModalOpen(true)} className="p-2 rounded-full hover:bg-slate-100 text-purple-600 relative">
                 <div className="absolute top-1 right-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                 <div className="font-bold text-xs flex items-center gap-1"><span className="text-lg">✨</span> AI Tips</div>
             </button>
             <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="p-2 rounded-full hover:bg-slate-100 relative">
                 <Bell className="w-6 h-6 text-slate-600" />
                 {notifications.length > 0 && (
                     <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                 )}
             </button>
             <div className="hidden md:flex items-center gap-2 ml-2">
                 <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden">
                     {user.photoURL ? <img src={user.photoURL} alt="User" /> : <UserIcon className="w-full h-full p-1 text-slate-500" />}
                 </div>
             </div>
         </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
          
          {/* Dashboard View */}
          {mobileTab === 'home' && (
              <div className="space-y-6 animate-fade-in">
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Total Hutang */}
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingDown size={100} /></div>
                          <p className="text-slate-400 text-sm font-medium mb-1">Total Hutang Berjalan</p>
                          <h2 className="text-3xl font-bold tracking-tight">{formatIDR(totalDebt)}</h2>
                          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-white/5 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                              <CreditCard size={14} /> <span>{data.cards.length} Kartu Terdaftar</span>
                          </div>
                      </div>

                      {/* Limit Tersedia */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                          <p className="text-slate-500 text-sm font-medium mb-1">Sisa Limit Gabungan</p>
                          <h2 className="text-3xl font-bold text-slate-800">{formatIDR(totalLimit - totalDebt)}</h2>
                          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(utilization, 100)}%` }}></div>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 text-right">{utilization.toFixed(1)}% Terpakai</p>
                      </div>

                      {/* Tabungan Pelunasan */}
                      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                           <div className="absolute -bottom-4 -right-4 p-4 opacity-20"><Target size={100} /></div>
                           <p className="text-emerald-100 text-sm font-medium mb-1">Tabungan Pelunasan</p>
                           <h2 className="text-3xl font-bold">{formatIDR(totalSavings)}</h2>
                           <p className="text-xs text-emerald-100 mt-2 opacity-80">
                               {totalSavings >= totalDebt ? 'Cukup untuk melunasi semua hutang!' : `Kurang ${formatIDR(totalDebt - totalSavings)} untuk lunas.`}
                           </p>
                      </div>
                  </div>

                  {/* Ringkasan Bulan & Tagihan Terdekat */}
                  {(() => {
                      const currentMonth = new Date().getMonth();
                      const currentYear = new Date().getFullYear();
                      const today = new Date();

                      let totalMonthlyBill = 0;
                      
                      // Calculate per card details
                      const cardStatus = data.cards.map(card => {
                          const report = getMonthlyReportData(card.id, currentMonth, currentYear);
                          totalMonthlyBill += report.totalBill;

                          // Only care if unpaid
                          if (report.remaining <= 1000) return null;

                          const dueDate = new Date(currentYear, currentMonth, card.dueDay || 25);
                          const diffTime = dueDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          // Savings specifically for this card
                          const specificSavings = data.savings
                            .filter(s => s.cardId === card.id && !s.isTransferred)
                            .reduce((sum, s) => sum + s.amount, 0);
                          
                          const gap = report.remaining - specificSavings;

                          return {
                              ...card,
                              remaining: report.remaining,
                              saved: specificSavings,
                              gap,
                              diffDays,
                              dueDate
                          };
                      })
                      .filter((item): item is NonNullable<typeof item> => item !== null)
                      .sort((a, b) => a.diffDays - b.diffDays);
                      
                      const deficit = totalMonthlyBill - totalSavings;

                      return (
                          <div className="space-y-6">
                              {/* 1. Ringkasan Bulan */}
                              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                   <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-xs tracking-wider mb-2">
                                       <Target size={16} /> RINGKASAN {monthNames[currentMonth].toUpperCase()}
                                   </div>
                                   <p className="text-xs text-slate-400 mb-1">TAGIHAN VS TABUNGAN</p>
                                   <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                                       <span className="text-2xl font-bold text-slate-700">{formatIDR(totalMonthlyBill)}</span>
                                       <span className="hidden sm:inline text-slate-300">/</span>
                                       <span className="text-2xl font-bold text-emerald-600">{formatIDR(totalSavings)}</span>
                                       {deficit > 0 && (
                                           <span className="text-lg font-bold text-red-600 sm:ml-auto">
                                               Kurang {formatIDR(deficit)}
                                           </span>
                                       )}
                                       {deficit <= 0 && totalMonthlyBill > 0 && (
                                           <span className="text-lg font-bold text-emerald-600 sm:ml-auto">
                                               Surplus {formatIDR(Math.abs(deficit))}
                                           </span>
                                       )}
                                   </div>
                              </div>

                              {/* 2. Tagihan Terdekat (Horizontal Scroll) */}
                              <div>
                                  <h3 className="font-bold text-slate-800 text-lg mb-3">Tagihan Terdekat</h3>
                                  {cardStatus.length > 0 ? (
                                      <div className="flex overflow-x-auto gap-3 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
                                          {cardStatus.map(card => {
                                              const isUrgent = card.diffDays <= 3;
                                              const isLate = card.diffDays < 0;
                                              const bgClass = isLate ? 'bg-red-50 border-red-200' : isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200';
                                              
                                              return (
                                                  <div key={card.id} className={`min-w-[280px] sm:min-w-[320px] rounded-2xl p-4 border shadow-sm snap-center ${bgClass}`}>
                                                      <div className="flex justify-between items-start mb-3">
                                                          <div>
                                                              <h4 className="font-bold text-slate-800 text-lg">{card.name}</h4>
                                                              <p className="text-xs text-slate-500">Jatuh Tempo: {card.dueDate.getDate()} {monthNames[currentMonth]}</p>
                                                          </div>
                                                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isLate ? 'bg-red-600 text-white' : isUrgent ? 'bg-orange-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                                              {isLate ? `Telat ${Math.abs(card.diffDays)} Hari` : card.diffDays === 0 ? 'Hari Ini' : `${card.diffDays} Hari Lagi`}
                                                          </span>
                                                      </div>
                                                      
                                                      <div className="space-y-2">
                                                          <div className="flex justify-between items-center text-sm">
                                                              <span className="text-slate-500">Sisa Tagihan</span>
                                                              <span className="font-bold text-slate-800">{formatIDR(card.remaining)}</span>
                                                          </div>
                                                          <div className="flex justify-between items-center text-sm">
                                                              <span className="text-slate-500">Kurang Dana</span>
                                                              <span className={`font-bold ${card.gap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                  {card.gap > 0 ? formatIDR(card.gap) : 'Dana Cukup'}
                                                              </span>
                                                          </div>
                                                      </div>
                                                  </div>
                                              )
                                          })}
                                      </div>
                                  ) : (
                                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                                          <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={32} />
                                          <p className="font-bold text-emerald-800">Semua Tagihan Lunas!</p>
                                          <p className="text-xs text-emerald-600">Bulan ini aman, tidak ada tagihan tertunggak.</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })()}

                  {/* Main Menu Grid (8 Icons) */}
                  <div className="grid grid-cols-4 gap-4 sm:gap-6">
                      <button onClick={() => setTransactionModalOpen(true)} className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><PlusCircle size={28} /></div>
                          <span className="text-xs font-medium text-slate-700">Catat</span>
                      </button>
                      <button onClick={() => setMobileTab('bills')} className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><ReceiptText size={28} /></div>
                          <span className="text-xs font-medium text-slate-700">Tagihan</span>
                      </button>
                      <button onClick={() => setMobileTab('savings')} className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><PiggyBank size={28} /></div>
                          <span className="text-xs font-medium text-slate-700">Tabungan</span>
                      </button>
                      <button onClick={() => setMobileTab('wallets')} className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><Wallet size={28} /></div>
                          <span className="text-xs font-medium text-slate-700">Dompet</span>
                      </button>
                      
                      <button onClick={() => setMobileTab('cards')} className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><CreditCard size={28} /></div>
                          <span className="text-xs font-medium text-slate-700">Kartu</span>
                      </button>
                      <button onClick={() => setMobileTab('report')} className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><PieChart size={28} /></div>
                          <span className="text-xs font-medium text-slate-700">Laporan</span>
                      </button>
                      <button onClick={() => setMobileTab('history')} className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><History size={28} /></div>
                          <span className="text-xs font-medium text-slate-700">Riwayat</span>
                      </button>
                      <button onClick={() => setMobileTab('profile')} className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all"><UserIcon size={28} /></div>
                          <span className="text-xs font-medium text-slate-700">Akun</span>
                      </button>
                  </div>

                  {/* Recent Transactions List */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                          <h3 className="font-bold text-slate-800 flex items-center gap-2"><History size={18} /> Transaksi Terakhir</h3>
                          <button onClick={() => setMobileTab('history')} className="text-sm text-primary font-semibold hover:underline">Lihat Semua</button>
                      </div>
                      <div className="divide-y divide-slate-100">
                          {data.transactions.length === 0 ? (
                              <div className="p-8 text-center text-slate-400">Belum ada transaksi tercatat.</div>
                          ) : (
                              data.transactions.slice().reverse().slice(0, 5).map(tx => (
                                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'EXPENSE' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                              {tx.type === 'EXPENSE' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                          </div>
                                          <div>
                                              <p className="font-semibold text-slate-800 line-clamp-1">{tx.description}</p>
                                              <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} • {data.cards.find(c => c.id === tx.cardId)?.name}</p>
                                          </div>
                                      </div>
                                      <span className={`font-bold ${tx.type === 'EXPENSE' ? 'text-slate-800' : 'text-green-600'}`}>
                                          {tx.type === 'EXPENSE' ? '-' : '+'}{formatIDR(tx.amount)}
                                      </span>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          )}
          
          {mobileTab === 'cards' && (
              <div className="space-y-4 animate-fade-in">
                  <h2 className="text-xl font-bold text-slate-800">Kartu Saya</h2>
                  {data.cards.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
                          <CreditCard className="mx-auto mb-2 opacity-30" size={48} />
                          <p>Belum ada kartu kredit.</p>
                      </div>
                  ) : (
                      data.cards.map(card => {
                          const cardExpenses = data.transactions
                            .filter(t => t.cardId === card.id && t.type === 'EXPENSE')
                            .reduce((sum, t) => sum + t.amount, 0);
                          const cardPayments = data.transactions
                            .filter(t => t.cardId === card.id && t.type === 'PAYMENT')
                            .reduce((sum, t) => sum + t.amount, 0);
                          const currentDebt = cardExpenses - cardPayments;
                          const available = card.limit - currentDebt;
                          
                          return (
                              <div key={card.id} className={`p-6 rounded-2xl text-white shadow-lg relative overflow-hidden ${card.color.replace('bg-gradient-to-br', 'bg-gradient-to-r')}`}>
                                  <div className="absolute right-[-20px] top-[-20px] opacity-10"><CreditCard size={150}/></div>
                                  <div className="flex justify-between items-start mb-6 relative">
                                      <div className="flex items-center gap-2">
                                        <div className="w-10 h-6 bg-white/20 rounded-md backdrop-blur-sm border border-white/30"></div>
                                        <div className="w-6 h-6 rounded-full bg-red-500/80"></div>
                                        <div className="w-6 h-6 rounded-full bg-yellow-500/80 -ml-4 mix-blend-screen"></div>
                                      </div>
                                      <span className="font-mono text-lg opacity-80 tracking-widest">**** {card.id.substr(0,4).toUpperCase()}</span>
                                  </div>
                                  <div className="mb-4 relative">
                                      <p className="text-xs opacity-70 mb-1">Total Tagihan</p>
                                      <h3 className="text-3xl font-bold">{formatIDR(currentDebt)}</h3>
                                  </div>
                                  <div className="flex justify-between items-end border-t border-white/20 pt-4 relative">
                                      <div>
                                          <p className="text-xs opacity-70 mb-1">{card.name}</p>
                                          <p className="font-medium text-sm">Limit: {formatIDR(card.limit)}</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-xs opacity-70 mb-1">Jatuh Tempo</p>
                                          <p className="font-bold text-sm bg-white/20 px-2 py-1 rounded-lg">Tgl {card.dueDay || '-'}</p>
                                      </div>
                                  </div>
                                  <button onClick={() => {
                                      const confirmed = window.confirm("Hapus kartu ini beserta semua datanya?");
                                      if (confirmed) {
                                          const newData = {
                                              ...data,
                                              cards: data.cards.filter(c => c.id !== card.id),
                                              transactions: data.transactions.filter(t => t.cardId !== card.id),
                                              installments: data.installments.filter(i => i.cardId !== card.id),
                                              savings: data.savings.filter(s => s.cardId !== card.id)
                                          };
                                          setData(newData);
                                          saveAppState(user.uid, newData);
                                      }
                                  }} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/30 backdrop-blur-sm"><Trash2 size={16} /></button>
                              </div>
                          );
                      })
                  )}
                  <button onClick={() => setCardModalOpen(true)} className="w-full py-3 bg-white border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2">
                      <PlusCircle size={20} /> Tambah Kartu Lain
                  </button>
              </div>
          )}

          {/* Bills & Installments View */}
          {mobileTab === 'bills' && (
              <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-bold text-slate-800">Tagihan & Cicilan</h2>
                  
                  {/* Timeline View Grouped by Month */}
                  <div className="space-y-4">
                      {Array.from({ length: 12 }, (_, i) => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + i);
                          const m = date.getMonth();
                          const y = date.getFullYear();
                          const monthKey = `${y}-${m}`;
                          const isExpanded = expandedMonths.includes(monthKey);
                          const isCurrentMonth = i === 0;

                          // Check if there are any bills in this month
                          const hasBills = data.cards.some(card => {
                              const report = getMonthlyReportData(card.id, m, y);
                              return report.totalBill > 0;
                          });

                          if (!hasBills && !isCurrentMonth) return null;

                          return (
                              <div key={monthKey} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                  <button 
                                    onClick={() => toggleMonthExpand(monthKey)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-lg ${isCurrentMonth ? 'bg-primary/10 text-primary' : 'bg-slate-200/50 text-slate-500'}`}>
                                              <Calendar size={20} />
                                          </div>
                                          <div className="text-left">
                                              <h3 className={`font-bold ${isCurrentMonth ? 'text-primary' : 'text-slate-700'}`}>
                                                  {monthNames[m]} {y}
                                              </h3>
                                              {isCurrentMonth && <p className="text-xs text-slate-500">Bulan Ini</p>}
                                          </div>
                                      </div>
                                      {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                  </button>
                                  
                                  {isExpanded && (
                                      <div className="p-4 space-y-4 border-t border-slate-100">
                                          {data.cards.map(card => {
                                              const report = getMonthlyReportData(card.id, m, y);
                                              if (report.totalBill <= 0) return null;

                                              const isPaid = report.remaining <= 1000; // Tolerance

                                              return (
                                                  <div key={card.id} className="relative bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                      <div className="flex justify-between items-start mb-2">
                                                          <div className="flex items-center gap-2">
                                                              <div className={`w-3 h-3 rounded-full ${card.color}`}></div>
                                                              <h4 className="font-bold text-slate-800">{card.name}</h4>
                                                          </div>
                                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                              {isPaid ? 'Lunas' : 'Belum Lunas'}
                                                          </span>
                                                      </div>
                                                      
                                                      <div className="flex justify-between items-end mb-3">
                                                          <div>
                                                              <p className="text-xs text-slate-500 mb-0.5">Total Tagihan</p>
                                                              <p className="text-lg font-bold text-slate-800">{formatIDR(report.totalBill)}</p>
                                                          </div>
                                                          {!isPaid && (
                                                              <div className="text-right">
                                                                  <p className="text-xs text-slate-500 mb-0.5">Sisa Bayar</p>
                                                                  <p className="text-sm font-bold text-red-600">{formatIDR(report.remaining)}</p>
                                                              </div>
                                                          )}
                                                      </div>

                                                      {/* Detail Breakdown */}
                                                      <div className="bg-slate-50 rounded-lg p-2 text-xs space-y-1">
                                                          <div className="flex justify-between">
                                                              <span className="text-slate-500">Transaksi Reguler</span>
                                                              <span className="font-medium">{formatIDR(report.expenses.reduce((s,t) => s + t.amount, 0))}</span>
                                                          </div>
                                                          {report.installments.length > 0 && (
                                                              <>
                                                                  <div className="flex justify-between border-b border-slate-200 pb-1 mb-1">
                                                                      <span className="text-slate-500">Total Cicilan ({report.installments.length})</span>
                                                                      <span className="font-medium">{formatIDR(report.installments.reduce((s,i) => s + i.monthlyAmount, 0))}</span>
                                                                  </div>
                                                                  {report.installments.map(inst => (
                                                                      <div key={inst.id} className="flex justify-between pl-2 text-slate-400">
                                                                          <span>• {inst.name} ({inst.currentMonthIndex}/{inst.totalMonths})</span>
                                                                          <span>{formatIDR(inst.monthlyAmount)}</span>
                                                                      </div>
                                                                  ))}
                                                              </>
                                                          )}
                                                      </div>
                                                      
                                                      {card.dueDay && (
                                                          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                                                              <Clock size={12} />
                                                              <span>Jatuh Tempo: Tgl {card.dueDay} {monthNames[m]}</span>
                                                          </div>
                                                      )}
                                                  </div>
                                              );
                                          })}
                                          {/* Empty State for Month */}
                                          {!data.cards.some(c => getMonthlyReportData(c.id, m, y).totalBill > 0) && (
                                              <p className="text-center text-sm text-slate-400 py-2">Tidak ada tagihan di bulan ini.</p>
                                          )}
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* Savings View */}
          {mobileTab === 'savings' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-slate-800">Tabungan Pelunasan</h2>
                      <button onClick={() => setSavingModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                          + Tabung
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.cards.map(card => {
                          const savings = data.savings.filter(s => s.cardId === card.id && !s.isTransferred);
                          const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0);
                          
                          if (totalSaved === 0) return null;

                          return (
                              <div key={card.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                                  <div className="flex items-center gap-3 mb-4">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${card.color}`}>
                                          <Landmark size={20} />
                                      </div>
                                      <div>
                                          <p className="text-sm text-slate-500">Tabungan untuk</p>
                                          <p className="font-bold text-slate-800">{card.name}</p>
                                      </div>
                                  </div>
                                  <h3 className="text-2xl font-bold text-emerald-600 mb-4">{formatIDR(totalSaved)}</h3>
                                  <div className="space-y-2">
                                      {savings.slice(0, 3).map(s => (
                                          <div key={s.id} className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                                              <span className="text-slate-600">{s.note || 'Setoran'}</span>
                                              <span className="font-mono font-medium">{formatIDR(s.amount)}</span>
                                          </div>
                                      ))}
                                      {savings.length > 3 && (
                                          <p className="text-xs text-center text-slate-400 pt-1">...dan {savings.length - 3} lainnya</p>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                      {data.savings.filter(s => !s.isTransferred).length === 0 && (
                          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                              <PiggyBank size={48} className="mx-auto mb-3 opacity-30" />
                              <p>Belum ada dana ditabung.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* Wallets View */}
          {mobileTab === 'wallets' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-slate-800">Dompet Saya</h2>
                      <button onClick={() => setWalletModalOpen(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
                          + Dompet
                      </button>
                  </div>

                  <div className="space-y-4">
                      {data.wallets && data.wallets.length > 0 ? (
                          data.wallets.map(wallet => (
                              <div key={wallet.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${wallet.color || 'bg-slate-500'}`}>
                                          {wallet.type === 'BANK' && <Landmark size={24} />}
                                          {wallet.type === 'EWALLET' && <Smartphone size={24} />}
                                          {wallet.type === 'CASH' && <Banknote size={24} />}
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-slate-800">{wallet.name}</h3>
                                          <p className="text-xs text-slate-500 uppercase font-semibold">{wallet.type}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-lg text-slate-800">{formatIDR(wallet.balance)}</p>
                                      <button 
                                        onClick={() => {
                                            if(confirm('Hapus dompet ini?')) {
                                                const newData = {
                                                    ...data,
                                                    wallets: data.wallets.filter(w => w.id !== wallet.id)
                                                };
                                                setData(newData);
                                                saveAppState(user.uid, newData);
                                            }
                                        }}
                                        className="text-xs text-red-400 hover:text-red-600 mt-1"
                                      >
                                          Hapus
                                      </button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                              <Wallet size={48} className="mx-auto mb-3 opacity-30" />
                              <p>Belum ada dompet terdaftar.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* Report View */}
          {mobileTab === 'report' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h2>
                      <select 
                          value={selectedYear} 
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                  </div>

                  {/* Monthly Expense Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                      <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><FileBarChart size={18}/> Pengeluaran per Bulan</h3>
                      <div className="flex items-end justify-between h-48 gap-3 min-w-[300px]">
                          {monthNames.map((month, index) => {
                              const monthlyTotal = data.transactions
                                  .filter(t => {
                                      const d = new Date(t.date);
                                      return d.getMonth() === index && d.getFullYear() === selectedYear && t.type === TransactionType.EXPENSE;
                                  })
                                  .reduce((sum, t) => sum + t.amount, 0);
                              
                              // Calculate max for scale (min 1 to avoid div by zero)
                              const maxExpense = Math.max(1, ...Array.from({length: 12}, (_, i) => 
                                   data.transactions.filter(t => {
                                      const d = new Date(t.date);
                                      return d.getMonth() === i && d.getFullYear() === selectedYear && t.type === TransactionType.EXPENSE;
                                  }).reduce((s, x) => s + x.amount, 0)
                              ));

                              const heightPercent = (monthlyTotal / maxExpense) * 100;
                              
                              return (
                                  <div key={month} className="flex-1 flex flex-col items-center gap-2 group relative">
                                      <div className="w-full relative h-full flex items-end">
                                        <div 
                                            className={`w-full rounded-t-lg transition-all duration-500 ${monthlyTotal > 0 ? 'bg-primary hover:bg-blue-700' : 'bg-slate-100'}`} 
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                        ></div>
                                        {monthlyTotal > 0 && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                {formatIDR(monthlyTotal)}
                                            </div>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center">{month.substr(0, 3)}</span>
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                   {/* Spending by Card */}
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><PieChart size={18}/> Pengeluaran per Kartu ({selectedYear})</h3>
                      <div className="space-y-4">
                          {data.cards.map(card => {
                              const cardTotal = data.transactions
                                  .filter(t => t.cardId === card.id && t.type === TransactionType.EXPENSE && new Date(t.date).getFullYear() === selectedYear)
                                  .reduce((sum, t) => sum + t.amount, 0);
                              
                              const totalYearExpense = data.transactions
                                  .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getFullYear() === selectedYear)
                                  .reduce((sum, t) => sum + t.amount, 0);
                              
                              const percent = totalYearExpense > 0 ? (cardTotal / totalYearExpense) * 100 : 0;

                              if (cardTotal === 0) return null;

                              return (
                                  <div key={card.id}>
                                      <div className="flex justify-between text-sm mb-1">
                                          <span className="font-medium text-slate-700 flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${card.color}`}></div>
                                            {card.name}
                                          </span>
                                          <span className="font-bold">{formatIDR(cardTotal)} ({percent.toFixed(0)}%)</span>
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-2">
                                          <div 
                                              className={`h-2 rounded-full ${card.color.replace('bg-gradient-to-br', 'bg-gradient-to-r')}`} 
                                              style={{ width: `${percent}%` }}
                                          ></div>
                                      </div>
                                  </div>
                              );
                          })}
                          {data.transactions.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getFullYear() === selectedYear).length === 0 && (
                              <div className="text-center py-8 text-slate-400 flex flex-col items-center">
                                  <PieChart size={32} className="mb-2 opacity-50" />
                                  <p>Belum ada data pengeluaran tahun ini.</p>
                              </div>
                          )}
                      </div>
                   </div>
              </div>
          )}

          {/* History View */}
          {mobileTab === 'history' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h2>
                      <div className="flex gap-2">
                          <select 
                              value={cardHistoryMonth}
                              onChange={(e) => setCardHistoryMonth(parseInt(e.target.value))}
                              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                              {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                          </select>
                          <select 
                              value={cardHistoryYear}
                              onChange={(e) => setCardHistoryYear(parseInt(e.target.value))}
                              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                              {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[50vh]">
                      <div className="divide-y divide-slate-100">
                          {data.transactions
                              .filter(t => {
                                  const d = new Date(t.date);
                                  return d.getMonth() === cardHistoryMonth && d.getFullYear() === cardHistoryYear;
                              })
                              .length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                      <History size={48} className="mb-4 opacity-20" />
                                      <p>Tidak ada transaksi di periode ini.</p>
                                  </div>
                              ) : (
                                  data.transactions
                                  .filter(t => {
                                      const d = new Date(t.date);
                                      return d.getMonth() === cardHistoryMonth && d.getFullYear() === cardHistoryYear;
                                  })
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                  .map(tx => (
                                      <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                          <div className="flex items-center gap-3">
                                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'EXPENSE' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                  {tx.type === 'EXPENSE' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                              </div>
                                              <div>
                                                  <p className="font-semibold text-slate-800">{tx.description}</p>
                                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                                      <span>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                                                      <span>•</span>
                                                      <span className="flex items-center gap-1">
                                                        <CreditCard size={10} />
                                                        {data.cards.find(c => c.id === tx.cardId)?.name}
                                                      </span>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <p className={`font-bold ${tx.type === 'EXPENSE' ? 'text-slate-800' : 'text-emerald-600'}`}>
                                                  {tx.type === 'EXPENSE' ? '-' : '+'}{formatIDR(tx.amount)}
                                              </p>
                                              <button 
                                                onClick={() => {
                                                    if(confirm('Hapus transaksi ini?')) {
                                                        const newData = {
                                                            ...data,
                                                            transactions: data.transactions.filter(t => t.id !== tx.id)
                                                        };
                                                        setData(newData);
                                                        saveAppState(user.uid, newData);
                                                    }
                                                }}
                                                className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 mt-1"
                                              >
                                                  Hapus
                                              </button>
                                          </div>
                                      </div>
                                  ))
                              )
                          }
                      </div>
                  </div>
              </div>
          )}

          {/* Profile View */}
          {mobileTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-bold text-slate-800">Akun Saya</h2>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                          {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : (user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                          <h3 className="font-bold text-lg truncate">{user.displayName || 'Pengguna'}</h3>
                          <p className="text-slate-500 text-sm truncate">{user.email}</p>
                      </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                      <button onClick={logout} className="w-full p-4 flex items-center gap-3 hover:bg-red-50 text-red-600 transition-colors">
                          <LogOut size={20} />
                          <span className="font-medium">Keluar Aplikasi</span>
                      </button>
                  </div>

                  <div className="text-center text-xs text-slate-400 mt-8">
                      <p>LimitWatch v1.0.0</p>
                  </div>
              </div>
          )}
      </main>

      {/* Floating Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe z-50 flex justify-between items-center shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
          <button onClick={() => setMobileTab('home')} className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'home' ? 'text-primary' : 'text-slate-400'}`}>
              <Home size={24} strokeWidth={mobileTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Beranda</span>
          </button>
          <button onClick={() => setMobileTab('cards')} className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'cards' ? 'text-primary' : 'text-slate-400'}`}>
              <CreditCard size={24} strokeWidth={mobileTab === 'cards' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Kartu</span>
          </button>
          <div className="relative -top-6">
              <button onClick={() => setTransactionModalOpen(true)} className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 active:scale-95 transition-transform border-4 border-slate-50">
                  <PlusCircle size={28} />
              </button>
          </div>
          <button onClick={() => setMobileTab('report')} className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'report' ? 'text-primary' : 'text-slate-400'}`}>
              <PieChart size={24} strokeWidth={mobileTab === 'report' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Laporan</span>
          </button>
          <button onClick={() => setMobileTab('profile')} className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'profile' ? 'text-primary' : 'text-slate-400'}`}>
              <Settings size={24} strokeWidth={mobileTab === 'profile' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Akun</span>
          </button>
      </nav>

      {/* --- MODALS --- */}

      {/* Transaction Modal - FIXED */}
      {transactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setTransactionModalOpen(false)} />
            
            {/* Main Modal Container */}
            <div className="relative bg-white w-full max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[90vh] shadow-2xl animate-slide-up sm:animate-scale-in">
                
                {/* Header (Fixed) */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">Catat Transaksi</h2>
                    <button onClick={() => setTransactionModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content (Scrollable) */}
                <div className="p-5 overflow-y-auto flex-1 space-y-6">
                    
                    {/* Toggle Type */}
                    <div className="bg-slate-100 p-1 rounded-xl flex font-medium">
                        <button 
                            onClick={() => setTxType(TransactionType.EXPENSE)}
                            className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${txType === TransactionType.EXPENSE ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                        >
                            Pengeluaran
                        </button>
                        <button 
                            onClick={() => setTxType(TransactionType.PAYMENT)}
                            className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${txType === TransactionType.PAYMENT ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}
                        >
                            Pembayaran
                        </button>
                    </div>

                    {/* Card Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Kartu Kredit</label>
                        <div className="relative">
                            <select 
                                value={txCardId} 
                                onChange={(e) => setTxCardId(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-none rounded-xl appearance-none font-medium focus:ring-2 focus:ring-primary/20"
                            >
                                {data.cards.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                         <label className="text-xs font-semibold text-slate-500 uppercase">Nominal (Rp)</label>
                         <input 
                            type="text"
                            value={txAmount}
                            onChange={(e) => handleCurrencyInput(e.target.value, setTxAmount)}
                            placeholder="0"
                            className="w-full text-3xl font-bold p-2 bg-transparent border-b-2 border-slate-200 focus:border-primary focus:outline-none placeholder:text-slate-300"
                            autoFocus
                         />
                         {txType === TransactionType.PAYMENT && (
                             <p className="text-xs text-slate-400">Kosongkan untuk lunas...</p>
                         )}
                    </div>

                    {/* Date & Desc */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal</label>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={txDate} 
                                    onChange={e => setTxDate(e.target.value)}
                                    className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm font-medium" 
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Keterangan (Opsional)</label>
                            <input 
                                type="text" 
                                value={txDesc} 
                                onChange={e => setTxDesc(e.target.value)}
                                placeholder={txType === TransactionType.EXPENSE ? "Beli Kopi..." : "Bayar Tagihan..."}
                                className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm" 
                            />
                        </div>
                    </div>

                    {/* Specific for Payment */}
                    {txType === TransactionType.PAYMENT && (
                         <div className="space-y-2 animate-fade-in">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Target Pembayaran Tagihan</label>
                            <div className="flex gap-2">
                                <select 
                                    value={txTargetMonth} 
                                    onChange={e => setTxTargetMonth(parseInt(e.target.value))}
                                    className="flex-1 p-3 bg-slate-50 rounded-xl border-none text-sm font-medium"
                                >
                                    {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <select 
                                    value={txTargetYear} 
                                    onChange={e => setTxTargetYear(parseInt(e.target.value))}
                                    className="w-24 p-3 bg-slate-50 rounded-xl border-none text-sm font-medium"
                                >
                                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            <div className={`mt-4 p-4 rounded-xl border transition-colors cursor-pointer flex items-center justify-between ${payFromSavings ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setPayFromSavings(!payFromSavings)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${payFromSavings ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <Coins size={16} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Ambil dari Tabungan?</p>
                                        <p className="text-xs opacity-70">Otomatis potong saldo tersimpan</p>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${payFromSavings ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${payFromSavings ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>
                         </div>
                    )}
                    
                    {/* Specific for Expense - Installment */}
                    {txType === TransactionType.EXPENSE && (
                         <div className={`p-4 rounded-xl border transition-all cursor-pointer ${txIsInstallment ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between" onClick={() => setTxIsInstallment(!txIsInstallment)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txIsInstallment ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <ReceiptText size={16} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Jadikan Cicilan?</p>
                                        <p className="text-xs opacity-70">Konversi otomatis ke cicilan</p>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${txIsInstallment ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${txIsInstallment ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>
                            
                            {txIsInstallment && (
                                <div className="mt-4 pt-4 border-t border-blue-100 animate-fade-in">
                                    <label className="text-xs font-semibold text-blue-800 uppercase mb-2 block">Tenor (Bulan)</label>
                                    <div className="flex gap-2">
                                        {[3, 6, 12, 24].map(m => (
                                            <button 
                                                key={m}
                                                onClick={() => setTxInstallmentMonths(m)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold border ${txInstallmentMonths === m ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200'}`}
                                            >
                                                {m}x
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2 text-center bg-blue-100/50 p-2 rounded-lg">
                                        Estimasi: <b>{formatIDR(Math.ceil(getNumericValue(txAmount) / txInstallmentMonths))}</b> / bulan
                                    </p>
                                </div>
                            )}
                         </div>
                    )}

                    {/* Simulation Info (Only for Payment) */}
                    {txType === TransactionType.PAYMENT && (
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-2">
                             <h4 className="flex items-center gap-2 text-indigo-800 font-bold text-sm mb-3">
                                 <Info size={16} /> Simulasi Pembayaran
                             </h4>
                             <div className="flex justify-between text-sm">
                                 <span className="text-slate-600">Tabungan Tersedia:</span>
                                 <span className="font-mono font-medium text-emerald-600">{formatIDR(simulation.savingsAvailable)}</span>
                             </div>
                             <div className="flex justify-between text-sm border-b border-indigo-200 pb-2">
                                 <span className="text-slate-600">Sisa Tagihan:</span>
                                 <span className="font-mono font-medium text-red-600">{formatIDR(simulation.currentDebt)}</span>
                             </div>
                             <div className="flex justify-between text-sm pt-1">
                                 <span className="font-bold text-slate-700">Akan Dibayar:</span>
                                 <span className="font-mono font-bold text-indigo-700">{formatIDR(simulation.amountToPay)}</span>
                             </div>
                             <div className="flex justify-between text-xs pt-2 text-slate-500">
                                 <span>Sisa Setelah Bayar:</span>
                                 <span className="font-mono">{formatIDR(simulation.remainingSavings)}</span>
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer (Fixed) */}
                <div className="p-4 border-t bg-slate-50 rounded-b-2xl shrink-0 safe-bottom">
                    <button 
                        onClick={handleSaveTransaction}
                        className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {txType === TransactionType.EXPENSE ? 'Simpan Pengeluaran' : 'Catat Pembayaran'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add Card Modal */}
      {cardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCardModalOpen(false)}></div>
               <div className="bg-white w-full max-w-md rounded-2xl p-6 relative z-10 animate-scale-in">
                   <h2 className="text-xl font-bold mb-4">Tambah Kartu Baru</h2>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kartu (e.g. BCA Visa)</label>
                           <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Nama Kartu" autoFocus />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Limit Kartu</label>
                           <input type="text" value={cardLimit} onChange={e => handleCurrencyInput(e.target.value, setCardLimit)} className="w-full p-3 border rounded-xl" placeholder="Rp 0" />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Cetak Tagihan (Tanggal)</label>
                           <input type="number" value={cardDue} onChange={e => setCardDue(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Contoh: 20" max="31" min="1" />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Warna Kartu</label>
                           <div className="flex flex-wrap gap-2">
                               {CARD_COLORS.map(c => (
                                   <button 
                                       key={c.id} 
                                       onClick={() => setCardColor(c.class)} 
                                       className={`w-8 h-8 rounded-full ${c.class} ${cardColor === c.class ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`} 
                                   />
                               ))}
                           </div>
                       </div>
                       <button onClick={handleSaveCard} className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-4">Simpan Kartu</button>
                   </div>
                   <button onClick={() => setCardModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X /></button>
               </div>
          </div>
      )}

      {/* Add Saving Modal */}
      {savingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSavingModalOpen(false)}></div>
               <div className="bg-white w-full max-w-md rounded-2xl p-6 relative z-10 animate-scale-in">
                   <h2 className="text-xl font-bold mb-4">Tabung Dana</h2>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Untuk Tagihan Kartu</label>
                           <select value={savingCardId} onChange={e => setSavingCardId(e.target.value)} className="w-full p-3 border rounded-xl">
                               {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Disimpan</label>
                           <input type="text" value={savingAmount} onChange={e => handleCurrencyInput(e.target.value, setSavingAmount)} className="w-full p-3 border rounded-xl font-bold text-lg" placeholder="Rp 0" autoFocus />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                           <input type="text" value={savingNote} onChange={e => setSavingNote(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Misal: Sisa gaji bulan ini" />
                       </div>
                       <button onClick={handleSaveSaving} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl mt-4">Simpan Dana</button>
                   </div>
                   <button onClick={() => setSavingModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X /></button>
               </div>
          </div>
      )}

      {/* Add Wallet Modal */}
      {walletModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setWalletModalOpen(false)}></div>
               <div className="bg-white w-full max-w-md rounded-2xl p-6 relative z-10 animate-scale-in">
                   <h2 className="text-xl font-bold mb-4">Tambah Dompet Baru</h2>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Nama Dompet</label>
                           <input type="text" value={walletName} onChange={e => setWalletName(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="e.g. Bank BCA, OVO, Dompet Fisik" autoFocus />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
                           <div className="flex gap-2">
                               {(['BANK', 'EWALLET', 'CASH'] as const).map(t => (
                                   <button 
                                      key={t}
                                      onClick={() => setWalletType(t)}
                                      className={`flex-1 py-2 rounded-lg text-sm font-bold border ${walletType === t ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'}`}
                                   >
                                       {t}
                                   </button>
                               ))}
                           </div>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Saat Ini</label>
                           <input type="text" value={walletBalance} onChange={e => handleCurrencyInput(e.target.value, setWalletBalance)} className="w-full p-3 border rounded-xl" placeholder="Rp 0" />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Warna</label>
                           <div className="flex flex-wrap gap-2">
                               {CARD_COLORS.map(c => (
                                   <button 
                                       key={c.id} 
                                       onClick={() => setWalletColor(c.class)} 
                                       className={`w-8 h-8 rounded-full ${c.class} ${walletColor === c.class ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`} 
                                   />
                               ))}
                           </div>
                       </div>
                       <button onClick={handleSaveWallet} className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl mt-4">Simpan Dompet</button>
                   </div>
                   <button onClick={() => setWalletModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X /></button>
               </div>
          </div>
      )}

      {/* AI Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAiModalOpen(false)}></div>
             <div className="bg-white w-full max-w-2xl rounded-2xl flex flex-col max-h-[80vh] relative z-10 animate-scale-in overflow-hidden">
                 <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-white flex justify-between items-center">
                     <h2 className="font-bold text-lg text-purple-800 flex items-center gap-2">✨ Analisis Keuangan AI</h2>
                     <button onClick={() => setAiModalOpen(false)}><X className="text-slate-400" /></button>
                 </div>
                 <div className="p-6 overflow-y-auto flex-1">
                     {aiLoading ? (
                         <div className="flex flex-col items-center justify-center py-10 space-y-4">
                             <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                             <p className="text-slate-500 animate-pulse">Sedang menganalisis data keuangan Anda...</p>
                         </div>
                     ) : (
                         aiAdvice ? (
                             <div className="prose prose-sm max-w-none prose-purple">
                                 <div className="whitespace-pre-wrap">{aiAdvice}</div>
                             </div>
                         ) : (
                             <div className="text-center py-10">
                                 <p className="text-slate-500 mb-4">Dapatkan saran cerdas untuk mengelola hutang dan cashflow Anda.</p>
                                 <button onClick={handleGetAiAdvice} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700">Mulai Analisis</button>
                             </div>
                         )
                     )}
                 </div>
             </div>
        </div>
      )}
      
    </div>
  );
};

export default App;