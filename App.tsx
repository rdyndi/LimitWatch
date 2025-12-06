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
  Share2
} from "lucide-react";

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
  
  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<NotificationItem | null>(null);
  
  // Profile Menu State (Mobile & Desktop)
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'savings' | 'history' | 'report' | 'profile' | 'wallets'>('home');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);

  // Card History Modal State
  const [selectedCardForHistory, setSelectedCardForHistory] = useState<CreditCardType | null>(null);
  const [cardHistoryMonth, setCardHistoryMonth] = useState(new Date().getMonth());
  const [cardHistoryYear, setCardHistoryYear] = useState(new Date().getFullYear());

  // Swipe Gesture States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  const maxVerticalDistance = 30; // Maximum allowed vertical scroll during swipe
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Drag & Drop Mobile Menu States
  const [menuOrder, setMenuOrder] = useState<string[]>(['transaksi', 'cicilan', 'wallets', 'laporan', 'kartu', 'tabungan', 'history', 'profile']);
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
  const [payFromSavings, setPayFromSavings] = useState(false);
  
  // Installment Conversion State (Transaction)
  const [txIsInstallment, setTxIsInstallment] = useState(false);
  const [txInstallmentMonths, setTxInstallmentMonths] = useState(3);

  // Manual Installment Form State
  const [instName, setInstName] = useState('');
  const [instTotal, setInstTotal] = useState('');
  const [instTenure, setInstTenure] = useState<string>('3'); // Changed to string for input handling
  const [instMonthlyAmount, setInstMonthlyAmount] = useState(''); // NEW: Allow manual input
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

  // Set default card selection when cards are loaded
  useEffect(() => {
    if (data.cards.length > 0) {
      if (!txCardId) setTxCardId(data.cards[0].id);
      if (!savingCardId) setSavingCardId(data.cards[0].id);
      if (!instCardId) setInstCardId(data.cards[0].id);
      if (!reportCardId) setReportCardId(data.cards[0].id);
      if (!transferTargetCardId) setTransferTargetCardId(data.cards[0].id);
    }
  }, [data.cards, txCardId, savingCardId, instCardId, reportCardId, transferTargetCardId]);

  // Auto calculate monthly amount when Total or Tenure changes in Manual Installment Form
  useEffect(() => {
    const totalVal = getNumericValue(instTotal);
    const tenureVal = parseInt(instTenure) || 0;
    
    if (totalVal > 0 && tenureVal > 0) {
      const calculated = Math.ceil(totalVal / tenureVal);
      setInstMonthlyAmount(formatIDR(calculated));
    }
  }, [instTotal, instTenure]);

  // --- HISTORY & BACK BUTTON MANAGEMENT ---
  useEffect(() => {
    const handlePopState = () => {
      // Saat tombol back ditekan
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

  // Helper for Input Currency Formatting
  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    const numericVal = getNumericValue(val);
    if(numericVal === 0 && val.replace(/\D/g, '') === '') {
        setter('');
        return;
    }
    setter(formatIDR(numericVal));
  };

  // Improved calculation logic for report with Cutoff Date Logic
  const getMonthlyReportData = (cardId: string, monthIndex: number, year: number) => {
    // Find the card to check dueDay
    const card = data.cards.find(c => c.id === cardId);
    // Default cutoff is end of month if not set (meaning transaction stays in current month)
    const cutoffDay = card?.dueDay || 31; 

    // 1. Expenses
    const monthlyExpenses = data.transactions.filter(t => {
        if (t.cardId !== cardId || t.type !== TransactionType.EXPENSE || t.isInstallment) return false;
        
        const tDate = new Date(t.date);
        let billingMonth = tDate.getMonth();
        let billingYear = tDate.getFullYear();

        // LOGIC: If transaction date is AFTER due date, it belongs to the NEXT month's bill
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
    // Note: Installments are typically fixed schedule. We assume startDate determines the first month.
    // Logic updated in handleSaveTransaction to shift startDate if transacting after due date.
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
        
        // Prioritize targetPeriod if set (e.g. from Batch Pay or Savings Pay)
        if (t.targetPeriod) {
            return t.targetPeriod.month === monthIndex && t.targetPeriod.year === year;
        }
        
        // Fallback to transaction date
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

  // --- NOTIFICATION LOGIC ---
  useEffect(() => {
    if (data.cards.length === 0) return;

    const newNotifications: NotificationItem[] = [];
    const today = new Date();

    data.cards.forEach(card => {
        if (card.dueDay) {
            const currentDay = today.getDate();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            let targetMonth = currentMonth;
            let targetYear = currentYear;
            
            if (card.dueDay < currentDay) {
                targetMonth++;
                if (targetMonth > 11) { targetMonth = 0; targetYear++; }
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

  // --- SWIPE HANDLERS ---
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

  // --- DRAG & DROP HANDLERS (Mobile Menu) ---
  const onMenuTouchStart = (e: React.TouchEvent, itemId: string) => {
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
        setDraggingItem(itemId);
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms long press to activate drag
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
         // If user moves finger before long press triggers, cancel it
         clearTimeout(longPressTimerRef.current);
         longPressTimerRef.current = null;
    }

    if (!draggingItem) return;
    
    // Logic to find which item is being hovered
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = target?.closest('[data-menu-id]') as HTMLElement;
    
    if (targetItem) {
        const targetId = targetItem.getAttribute('data-menu-id');
        if (targetId && targetId !== draggingItem) {
            // Swap items
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

  // Helper to open Manual Installment Modal
  const openInstallmentModal = () => {
    setInstName('');
    setInstTotal('');
    setInstTenure('3');
    setInstMonthlyAmount('');
    setInstStartDate(new Date().toISOString().split('T')[0]);
    if (data.cards.length > 0) setInstCardId(data.cards[0].id);
    setInstallmentModalOpen(true);
  };

  // Direct Delete for Ghost Installments
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
        name: instName || 'Cicilan Manual', // Default if empty
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
          installmentId: inst.id, // Link to installment ID
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

    let confirmMsg = "Apakah Anda yakin ingin menghapus transaksi ini? Laporan akan disesuaikan otomatis.";

    // Check if this is a Payment made from Savings
    const isSavingsPayment = txToDelete.type === TransactionType.PAYMENT &&
                             (txToDelete.category === 'Payment from Savings' || txToDelete.category === 'Savings Payment');

    if (isSavingsPayment) {
        confirmMsg += "\n\nDana sebesar " + formatIDR(txToDelete.amount) + " akan DIKEMBALIKAN ke Tabungan (Refund).";
    }

    if (window.confirm(confirmMsg)) {
      const updatedTransactions = data.transactions.filter(t => t.id !== id);
      
      let updatedInstallments = data.installments;
      let updatedSavings = data.savings;

      // 1. Handle Installment Deletion
      if (txToDelete.isInstallment) {
          if (txToDelete.installmentId) {
              // Delete by ID (Strong link)
              updatedInstallments = data.installments.filter(i => i.id !== txToDelete.installmentId);
          } else {
              // Fallback: Delete by matching content (Weak link/Legacy)
              // Note: We deliberately ignore the date to catch "ghost" installments shifted to next month
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

      // 2. Handle Savings Refund (New Logic)
      if (isSavingsPayment) {
          const refundSaving: Saving = {
              id: generateId(),
              cardId: txToDelete.cardId,
              amount: txToDelete.amount,
              date: new Date().toISOString(),
              note: `Refund: ${txToDelete.description || 'Hapus Transaksi'}`,
              targetPeriod: txToDelete.targetPeriod || { month: new Date().getMonth(), year: new Date().getFullYear() },
              isTransferred: false // Mark as available again
          };
          updatedSavings = [refundSaving, ...updatedSavings];
      }

      saveData({ 
          ...data, 
          transactions: updatedTransactions,
          installments: updatedInstallments,
          savings: updatedSavings
      });
      setTransactionModalOpen(false); // Close modal if delete called from there
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
    // Improved Validation Logic
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

    // Default description if empty
    const finalDesc = txDesc || (txType === TransactionType.EXPENSE ? 'Pengeluaran' : 'Pembayaran');

    // Variable to hold the generated Installment ID if created
    let generatedInstallmentId: string | undefined = undefined;

    if (txIsInstallment && txType === TransactionType.EXPENSE) {
       // Validasi Tenor Manual
       if (txInstallmentMonths <= 0) {
           alert("Lama cicilan minimal 1 bulan");
           return;
       }

       if (!editingTransaction || (editingTransaction && !editingTransaction.isInstallment)) {
          // --- LOGIC: Shift Installment Date if past Due Date ---
          const selectedCard = data.cards.find(c => c.id === txCardId);
          let instStartDateObj = new Date(txDate);
          
          if (selectedCard && selectedCard.dueDay) {
              // If transaction happens after due day, billing moves to next month
              if (instStartDateObj.getDate() > selectedCard.dueDay) {
                  // Move to next month (Javascript handles year rollover automatically)
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
              startDate: instStartDateObj.toISOString() // Use adjusted date
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
      // Check if this transaction was an installment and if we need to update the installment record too
      if (editingTransaction.isInstallment) {
          updatedInstallments = updatedInstallments.map(inst => {
              // Priority 1: Find by ID
              if (editingTransaction.installmentId && inst.id === editingTransaction.installmentId) {
                   return { 
                      ...inst, 
                      cardId: txCardId, // Update Card ID
                      name: finalDesc, // Update Name
                      startDate: new Date(txDate).toISOString(), // Update Date
                  };
              }

              // Priority 2: Fallback (Legacy) - Match by content
              const isMatch = (
                  inst.cardId === editingTransaction.cardId &&
                  inst.totalAmount === editingTransaction.amount &&
                  inst.name === editingTransaction.description
                  // Ignore date check to find shifted installments
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
            // Keep existing installmentId unless new one generated (unlikely in edit unless toggled on)
            installmentId: generatedInstallmentId || t.installmentId 
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
        installmentId: generatedInstallmentId // Link if created
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

  // Helper to open specific card history modal
  const openCardHistory = (card: CreditCardType) => {
      setSelectedCardForHistory(card);
      setCardHistoryMonth(new Date().getMonth());
      setCardHistoryYear(new Date().getFullYear());
  };

  const closeCardHistory = () => {
      setSelectedCardForHistory(null);
  };

  // --- SHARE INVOICE PDF HANDLER ---
  const handleShareInvoice = async () => {
    const target = document.querySelector('.invoice-container') as HTMLElement;
    if (!target) return;

    // Loading indicator on button if needed, but we'll use a simple alert or toast if it fails
    // Wait a bit to ensure everything is rendered
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
    
    // Ensure we always have a valid color class
    const finalColor = cardColor && cardColor.trim() !== '' ? cardColor : CARD_COLORS[0].class;

    if (editingCard) {
        // Edit Mode
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
        // Create Mode
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

  // --- WALLET FUNCTIONS ---
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

      // 1. Deduct from Wallet
      const updatedWallets = (data.wallets || []).map(w => {
          if(w.id === walletId) return { ...w, balance: w.balance - amountVal };
          return w;
      });

      // 2. Add to Savings
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

  // Used for bill reminder
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
         
         // Logic Perbaikan: Cek status bulan berjalan dulu
         // 1. Ambil laporan bulan ini
         const currentMonthReport = getMonthlyReportData(c.id, currentMonth, currentYear);
         const currentMonthRemaining = currentMonthReport.remaining;
         const isCurrentMonthUnpaid = currentMonthRemaining > 1000;

         let targetMonth = currentMonth;
         let targetYear = currentYear;
         
         if (c.dueDay! < currentDay) {
            // Tanggal jatuh tempo bulan ini sudah lewat.
            // Cek apakah bulan ini masih ada sisa tagihan?
            if (isCurrentMonthUnpaid) {
                // Jika masih ada sisa, target tetap bulan ini (Status: Telat)
                targetMonth = currentMonth;
                targetYear = currentYear;
            } else {
                // Jika sudah lunas, baru pindah ke bulan depan
                targetMonth++;
                if (targetMonth > 11) { targetMonth = 0; targetYear++; }
            }
         }
         
         const dueDate = new Date(targetYear, targetMonth, c.dueDay!);
         const diffTime = dueDate.getTime() - today.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

         const reportData = getMonthlyReportData(c.id, targetMonth, targetYear);
         const remaining = Math.max(0, reportData.remaining);

         // Calculate available savings for this card (Not specific to period, just total card savings available)
         const availableSavings = data.savings
            .filter(s => s.cardId === c.id && !s.isTransferred)
            .reduce((sum, s) => sum + s.amount, 0);
         
         // Calculate Shortfall
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
  
  // Logic for Active Installments Display
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const activeInstallmentsCount = data.installments.filter(i => {
      const startDate = new Date(i.startDate);
      const monthDiff = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth());
      return (monthDiff >= 0 && monthDiff < i.totalMonths);
  }).length;

  const totalInstallmentBillThisMonth = data.installments.filter(i => {
      const startDate = new Date(i.startDate);
      const monthDiff = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth());
      return (monthDiff >= 0 && monthDiff < i.totalMonths);
  }).reduce((sum, i) => sum + i.monthlyAmount, 0);

  // --- NEW LOGIC: GLOBAL MONTHLY SUMMARY ---
  // Calculate Total Global Bill for THIS specific month (All Cards)
  const totalGlobalBillThisMonth = data.cards.reduce((sum, card) => {
      const report = getMonthlyReportData(card.id, currentMonth, currentYear);
      return sum + Math.max(0, report.remaining);
  }, 0);

  // Calculate Total Savings TARGETED for THIS specific month (All Cards)
  const totalGlobalSavingsThisMonth = data.savings
      .filter(s => !s.isTransferred && s.targetPeriod?.month === currentMonth && s.targetPeriod?.year === currentYear)
      .reduce((sum, s) => sum + s.amount, 0);

  const globalMonthStatus = totalGlobalBillThisMonth - totalGlobalSavingsThisMonth;
  const isGlobalSafe = globalMonthStatus <= 0;

  // Filter Logic for History View
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Wallet size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">LimitWatch</h1>
            <p className="text-slate-500 mt-2">Kelola finansial Anda dengan lebih bijak.</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon size={18} />
                </div>
                <input 
                  type="text" 
                  required 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                  placeholder="Nama Lengkap"
                />
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                placeholder="Alamat Email"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                placeholder="Kata Sandi (Min. 6 karakter)"
              />
            </div>

            {authError && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-start gap-2">
                 <AlertCircle size={14} className="mt-0.5 shrink-0" />
                 <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading ? 'Memproses...' : (isRegistering ? 'Buat Akun Baru' : 'Masuk Sekarang')}
              {!authLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Atau masuk dengan</span>
            </div>
          </div>

          <button 
            onClick={loginWithGoogle}
            className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G"/>
            <span>Google</span>
          </button>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500">
              {isRegistering ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-blue-600 font-bold hover:text-blue-700 transition"
              >
                {isRegistering ? "Login disini" : "Daftar gratis"}
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
      {label}
    </button>
  );

  return (
    <>
      {/* ========================================= */}
      {/* DESKTOP VIEW (Redesigned & Functional)    */}
      {/* ========================================= */}
      <div className="hidden md:flex h-screen bg-slate-50 font-sans overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20 shadow-sm">
           <div className="h-20 flex items-center px-8 border-b border-slate-50">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3 shadow-md shadow-blue-200">
                <Wallet size={18} />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">LimitWatch</span>
           </div>
           
           <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
              <div className="px-4 pb-2 pt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</div>
              <DesktopNavItem icon={<Home size={20}/>} label="Dashboard" active={mobileTab === 'home'} onClick={() => setMobileTab('home')} />
              <DesktopNavItem icon={<CreditCard size={20}/>} label="Kartu Saya" active={mobileTab === 'cards'} onClick={() => setMobileTab('cards')} />
              <DesktopNavItem icon={<WalletCards size={20}/>} label="Dompet" active={mobileTab === 'wallets'} onClick={() => setMobileTab('wallets')} />
              <DesktopNavItem icon={<History size={20}/>} label="Riwayat Transaksi" active={mobileTab === 'history'} onClick={() => setMobileTab('history')} />
              <DesktopNavItem icon={<Coins size={20}/>} label="Tabungan Pelunasan" active={mobileTab === 'savings'} onClick={() => setMobileTab('savings')} />
              <DesktopNavItem icon={<FileBarChart size={20}/>} label="Laporan Tahunan" active={mobileTab === 'report'} onClick={() => setMobileTab('report')} />
           </nav>
           
           <div className="p-4 border-t border-slate-100">
              <button onClick={() => logout()} className="flex items-center gap-3 text-slate-500 hover:text-red-600 w-full p-3 rounded-lg transition-colors hover:bg-red-50">
                 <LogOut size={20} />
                 <span className="font-medium">Keluar Aplikasi</span>
              </button>
           </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 ml-72 p-10 overflow-y-auto">
           {/* Desktop Header */}
           <header className="flex justify-between items-center mb-10">
              <div>
                 <h1 className="text-3xl font-bold text-slate-800 mb-1">
                    {mobileTab === 'home' && 'Ringkasan Keuangan'}
                    {mobileTab === 'cards' && 'Kelola Kartu Kredit'}
                    {mobileTab === 'wallets' && 'Dompet & Pemasukan'}
                    {mobileTab === 'history' && 'Riwayat Transaksi'}
                    {mobileTab === 'savings' && 'Tabungan Pelunasan'}
                    {mobileTab === 'report' && 'Laporan Tagihan Tahunan'}
                    {mobileTab === 'profile' && 'Pengaturan Akun'}
                 </h1>
                 <p className="text-slate-500">
                    Selamat datang kembali, <span className="font-semibold text-slate-700">{user.displayName || user.email}</span>
                 </p>
              </div>
              <div className="flex items-center gap-4">
                 {/* Notification Bell (Desktop) */}
                 <div className="relative">
                    <button 
                      onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-600 border border-slate-200 hover:bg-slate-50 transition shadow-sm relative"
                    >
                        <BellRing size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                    {showNotifDropdown && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b border-slate-50 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-sm">Notifikasi</h3>
                                {notifications.length > 0 && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{notifications.length} Baru</span>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs">Tidak ada notifikasi baru.</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer ${n.type === 'urgent' ? 'bg-red-50/50' : ''}`}>
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
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-l-2xl rounded-tr-2xl rounded-br-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 relative mr-2"
                    >
                       <PlusCircle size={18} /> 
                       <span>Catat Transaksi</span>
                       {/* The "Tail" of the bubble pointing to the profile */}
                       <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-l-[12px] border-l-blue-600 border-b-8 border-b-transparent group-hover:border-l-blue-700 transition-colors"></div>
                    </button>
                 </div>

                 {/* Profile Dropdown */}
                 <div className="relative">
                     <button 
                       onClick={() => setShowProfileMenu(!showProfileMenu)}
                       className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-blue-200 transition-all cursor-pointer"
                     >
                         {user.photoURL ? (
                           <img src={user.photoURL} alt="User" className="w-full h-full object-cover"/>
                         ) : (
                           <UserIcon className="m-3 text-slate-500"/>
                         )}
                     </button>
                     {showProfileMenu && (
                        <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                           <div className="p-4 bg-slate-50 border-b border-slate-100">
                              <p className="font-bold text-slate-800 text-sm truncate">{user.displayName || 'Pengguna'}</p>
                              <p className="text-xs text-slate-500 truncate">{user.email}</p>
                           </div>
                           <div className="p-2">
                              <button onClick={() => {logout(); setShowProfileMenu(false);}} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-medium">
                                 <LogOut size={16} /> Keluar Aplikasi
                              </button>
                           </div>
                        </div>
                     )}
                 </div>
              </div>
           </header>

           {/* --- DASHBOARD VIEW --- */}
           {mobileTab === 'home' && (
             <div className="space-y-8 animate-in fade-in duration-500">
               {/* Stats Grid */}
               <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown size={64} className="text-red-600"/>
                     </div>
                     <div className="relative z-10">
                       <p className="text-slate-500 font-medium mb-1">Total Hutang</p>
                       <h3 className="text-2xl font-bold text-slate-800">{formatIDR(totalDebt)}</h3>
                     </div>
                     <div className="relative z-10 text-sm text-red-500 flex items-center gap-1 font-medium">
                        Perlu dilunasi
                     </div>
                  </div>

                  <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Coins size={64} className="text-green-600"/>
                     </div>
                     <div className="relative z-10">
                       <p className="text-slate-500 font-medium mb-1">Tabungan</p>
                       <h3 className="text-2xl font-bold text-slate-800">{formatIDR(totalSavings)}</h3>
                     </div>
                     <button onClick={openAddSavingModal} className="relative z-10 text-sm text-green-600 flex items-center gap-1 font-medium hover:underline w-fit">
                        + Tambah
                     </button>
                  </div>

                  <div className="col-span-1 bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg shadow-blue-200 text-white flex flex-col justify-between h-40">
                     <div>
                       <p className="text-blue-100 font-medium mb-1">Cicilan Aktif</p>
                       <div className="flex items-baseline gap-2">
                           <h3 className="text-2xl font-bold">{activeInstallmentsCount} Item</h3>
                           <span className="text-sm text-blue-200">({formatIDR(totalInstallmentBillThisMonth)}/bln)</span>
                       </div>
                     </div>
                     <div className="flex gap-2">
                         <button onClick={() => setInstallmentListModalOpen(true)} className="text-sm bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 px-3 rounded-lg w-fit transition-colors">
                            Lihat Detail
                         </button>
                         <button onClick={openInstallmentModal} className="text-sm bg-white text-indigo-700 font-bold py-2 px-3 rounded-lg w-fit transition-colors">
                            + Baru
                         </button>
                     </div>
                  </div>
               </div>

               {/* GLOBAL MONTH SUMMARY (New Widget) */}
               <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 p-6 opacity-5 ${isGlobalSafe ? 'text-green-600' : 'text-red-600'}`}>
                      <Calculator size={80} />
                  </div>
                  <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <Target size={20} className="text-indigo-600" /> 
                          Status {monthNames[currentMonth]} {currentYear}
                      </h3>
                      <div className="flex items-center gap-8">
                           <div>
                               <p className="text-xs font-bold text-slate-500 uppercase">Sisa Tagihan (Semua Kartu)</p>
                               <p className="text-xl font-bold text-slate-800">{formatIDR(totalGlobalBillThisMonth)}</p>
                           </div>
                           <div className="h-10 w-px bg-slate-300"></div>
                           <div>
                               <p className="text-xs font-bold text-slate-500 uppercase">Tabungan Bulan Ini</p>
                               <p className="text-xl font-bold text-green-600">{formatIDR(totalGlobalSavingsThisMonth)}</p>
                           </div>
                           <div className="h-10 w-px bg-slate-300"></div>
                           <div>
                               <p className="text-xs font-bold text-slate-500 uppercase">Status Dana</p>
                               <p className={`text-xl font-bold ${isGlobalSafe ? 'text-green-600' : 'text-red-600'}`}>
                                   {isGlobalSafe ? 'Dana Siap / Surplus' : `Kurang ${formatIDR(Math.abs(globalMonthStatus))}`}
                               </p>
                           </div>
                      </div>
                  </div>
               </div>

               {/* Bill Reminder Section (Horizontal) */}
               <div>
                  <div className="flex items-center gap-2 mb-4">
                      <Bell size={20} className="text-orange-500"/>
                      <h3 className="text-lg font-bold text-slate-800">Rincian Pengingat Tagihan</h3>
                  </div>
                  
                  {upcomingBills.length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 flex flex-col items-center">
                          <CheckCircle2 size={48} className="mb-2 opacity-20"/>
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
                                  <div key={c.id} className={`p-4 rounded-xl border shadow-sm ${isOverdue ? 'bg-red-100 border-red-300' : isUrgent ? 'bg-red-50 border-red-100' : isWarning ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-100'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                              <p className="font-bold text-slate-800 truncate">{c.name}</p>
                                              <p className="text-xs text-slate-500">{c.nextDueDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                                          </div>
                                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${isOverdue ? 'bg-red-600 text-white' : isUrgent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                              {isOverdue ? `Telat ${Math.abs(c.daysLeft)} Hari` : `${c.daysLeft} Hari Lagi`}
                                          </span>
                                      </div>
                                      
                                      <div className="space-y-1.5 mt-3 text-sm">
                                         <div className="flex justify-between">
                                            <span className="text-slate-500 text-xs">Tagihan</span>
                                            <span className="font-bold text-slate-800">{formatIDR(c.remainingBill)}</span>
                                         </div>
                                         <div className="flex justify-between">
                                            <span className="text-slate-500 text-xs">Tabungan</span>
                                            <span className="font-bold text-slate-600">{formatIDR(c.availableSavings)}</span>
                                         </div>
                                         <div className="h-px bg-slate-200/50 my-1"></div>
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
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="font-bold text-lg text-slate-800">Transaksi Terakhir</h3>
                     <button onClick={() => setMobileTab('history')} className="text-blue-600 text-sm font-semibold hover:underline">Lihat Semua</button>
                  </div>
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                           <th className="p-4 font-semibold">Tanggal</th>
                           <th className="p-4 font-semibold">Keterangan</th>
                           <th className="p-4 font-semibold">Tipe</th>
                           <th className="p-4 font-semibold text-right">Jumlah</th>
                        </tr>
                     </thead>
                     <tbody className="text-sm text-slate-700">
                        {data.transactions.slice(0, 5).map(t => {
                           const card = data.cards.find(c => c.id === t.cardId);
                           return (
                             <tr onClick={() => handleEditClick(t)} key={t.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                                <td className="p-4 text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                <td className="p-4 font-medium flex items-center gap-2">
                                   <div className={`w-2.5 h-2.5 rounded-full ${card?.color || 'bg-slate-400'}`} title={card?.name}></div>
                                   {t.description}
                                   {t.isInstallment && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">CICILAN</span>}
                                </td>
                                <td className="p-4">
                                   <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                      t.type === TransactionType.EXPENSE ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                   }`}>
                                      {t.type === TransactionType.EXPENSE ? 'Pengeluaran' : 'Pembayaran'}
                                   </span>
                                </td>
                                <td className={`p-4 text-right font-bold ${
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

           {/* --- WALLETS VIEW (DESKTOP) --- */}
           {mobileTab === 'wallets' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-slate-800">Daftar Dompet</h2>
                      <button onClick={openAddWalletModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                          <PlusCircle size={18}/> Tambah Dompet
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                      {(data.wallets || []).map(w => (
                          <div key={w.id} className={`p-6 rounded-2xl shadow-sm border border-slate-100 text-white relative group overflow-hidden ${w.color || 'bg-slate-700'}`}>
                              <div className="flex justify-between items-start mb-4 relative z-10">
                                  <div>
                                      <p className="text-white/80 text-xs uppercase tracking-wider">{w.type}</p>
                                      <h3 className="font-bold text-xl">{w.name}</h3>
                                  </div>
                                  <div className="flex gap-2">
                                     <button onClick={() => handleEditWallet(w)} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg backdrop-blur-sm"><Pencil size={16}/></button>
                                  </div>
                              </div>
                              <h2 className="text-3xl font-bold mb-6 relative z-10">{formatIDR(w.balance)}</h2>
                              
                              <div className="flex gap-2 relative z-10">
                                  <button onClick={() => openWalletIncomeModal(w.id)} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1">
                                      <ArrowDownLeft size={16}/> Isi Saldo
                                  </button>
                                  <button onClick={() => openWalletTransferModal(w.id)} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1">
                                      <ArrowUpRight size={16}/> Transfer
                                  </button>
                              </div>
                              <WalletCards className="absolute -bottom-4 -right-4 text-white/10 w-32 h-32 transform rotate-12" />
                          </div>
                      ))}
                      {(data.wallets || []).length === 0 && (
                          <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                              <WalletCards size={48} className="mx-auto mb-3 opacity-50"/>
                              <p>Belum ada dompet. Tambahkan dompet untuk mencatat pemasukan.</p>
                          </div>
                      )}
                  </div>
              </div>
           )}

           {/* --- HISTORY VIEW (DESKTOP) --- */}
           {mobileTab === 'history' && (
             <div className="space-y-6 animate-in fade-in">
                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Filter Kartu</label>
                        <select value={historyFilterCard} onChange={(e) => setHistoryFilterCard(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm">
                            <option value="all">Semua Kartu</option>
                            {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="w-40">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Bulan</label>
                         <select value={historyFilterMonth} onChange={(e) => setHistoryFilterMonth(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm">
                             {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                         </select>
                    </div>
                    <div className="w-32">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Tahun</label>
                         <select value={historyFilterYear} onChange={(e) => setHistoryFilterYear(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm">
                             {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                         </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="text-xs text-red-600 font-bold uppercase">Total Pengeluaran</p>
                        <p className="text-2xl font-bold text-red-700">{formatIDR(filteredExpense)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 font-bold uppercase">Total Pembayaran</p>
                        <p className="text-2xl font-bold text-green-700">{formatIDR(filteredPayment)}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm">
                            <tr>
                                <th className="p-4 font-semibold w-16 text-center">Valid</th>
                                <th className="p-4 font-semibold">Tanggal</th>
                                <th className="p-4 font-semibold">Keterangan</th>
                                <th className="p-4 font-semibold text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredTransactions.map(t => {
                                const card = data.cards.find(c => c.id === t.cardId);
                                return (
                                    <tr onClick={() => handleEditClick(t)} key={t.id} className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer">
                                        <td className="p-4 text-center" onClick={(e) => handleToggleValidation(e, t.id)}>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-colors ${t.isValidated ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent hover:border-green-400'}`}>
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                        <td className="p-4 font-medium flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${card?.color || 'bg-slate-400'}`} title={card?.name}></div>
                                            {t.description}
                                            {t.isInstallment && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">CICILAN</span>}
                                        </td>
                                        <td className={`p-4 text-right font-bold ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                                            {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredTransactions.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Tidak ada transaksi yang sesuai filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
           )}

           {/* --- SAVINGS VIEW (DESKTOP) --- */}
           {mobileTab === 'savings' && (
               <div className="space-y-8 animate-in fade-in">
                   <div className="flex justify-between items-center">
                       <h2 className="text-xl font-bold text-slate-800">Tabungan Pelunasan</h2>
                       <button onClick={openAddSavingModal} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2">
                           <PlusCircle size={18}/> Tambah Tabungan
                       </button>
                   </div>
                   
                   {data.cards.map(card => {
                       const groupedSavings = getSavingsByMonth(card.id);
                       if (groupedSavings.length === 0) return null;

                       return (
                           <div key={card.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                               <div className={`p-4 ${card.color || 'bg-slate-700'} text-white flex justify-between items-center`}>
                                   <h3 className="font-bold">{card.name}</h3>
                                   <div className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                       Total: {formatIDR(groupedSavings.reduce((sum, g) => sum + g.total, 0))}
                                   </div>
                               </div>
                               <div className="p-6 grid grid-cols-2 gap-6">
                                   {groupedSavings.map(group => (
                                       <div key={group.key} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                           <div className="flex justify-between items-start mb-3">
                                               <h4 className="font-bold text-slate-700">{group.label}</h4>
                                               <span className="text-lg font-bold text-green-600">{formatIDR(group.total)}</span>
                                           </div>
                                           <div className="space-y-2 mb-4">
                                               {group.items.map(item => (
                                                   <div key={item.id} className="flex justify-between text-sm items-center group/item">
                                                       <span className="text-slate-500 truncate max-w-[150px]">{item.note}</span>
                                                       <div className="flex items-center gap-2">
                                                           <span className="font-medium">{formatIDR(item.amount)}</span>
                                                           <button onClick={() => handleEditSaving(item)} className="text-slate-400 hover:text-blue-500 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                               <Pencil size={12}/>
                                                           </button>
                                                       </div>
                                                   </div>
                                               ))}
                                           </div>
                                           <div className="flex gap-2">
                                               <button onClick={() => openWithdrawModal(group.items)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-bold">
                                                   Ambil
                                               </button>
                                               <button onClick={() => handleOpenBatchPay(group.items, group.label, group.total)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold">
                                                   Bayar Tagihan
                                               </button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )
                   })}
                   {data.savings.filter(s => !s.isTransferred).length === 0 && (
                       <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                           <Coins size={48} className="mx-auto mb-3 opacity-50"/>
                           <p>Belum ada tabungan aktif.</p>
                       </div>
                   )}
               </div>
           )}

           {/* --- CARDS VIEW (DESKTOP - NEW) --- */}
           {mobileTab === 'cards' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-slate-800">Daftar Kartu Kredit</h2>
                      <button onClick={openAddCardModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                          <PlusCircle size={18}/> Tambah Kartu
                      </button>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                      {data.cards.map(card => {
                          const cardUsage = data.transactions
                             .filter(t => t.cardId === card.id && t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
                          const cardPayments = data.transactions
                             .filter(t => t.cardId === card.id && t.type === TransactionType.PAYMENT).reduce((sum, t) => sum + t.amount, 0);
                          const currentDebt = cardUsage - cardPayments;
                          const remainingLimit = card.limit - currentDebt;
                          return (
                              <div key={card.id} onClick={() => openCardHistory(card)} className={`rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] ${card.color || 'bg-slate-700'}`}>
                                  <div className="flex justify-between items-start mb-8">
                                      <div className="flex items-center gap-2">
                                          <CreditCard size={24} className="opacity-80"/>
                                          <span className="font-bold text-lg tracking-wide">{card.name}</span>
                                      </div>
                                      <button 
                                          onClick={(e) => {e.stopPropagation(); handleEditCard(card);}} 
                                          className="bg-white/20 p-2 rounded-lg hover:bg-white/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <Pencil size={16} className="text-white"/>
                                      </button>
                                  </div>
                                  <div className="space-y-1">
                                      <p className="text-xs opacity-80 uppercase tracking-widest">Sisa Limit</p>
                                      <p className="text-3xl font-bold">{formatIDR(remainingLimit)}</p>
                                      <p className="text-sm opacity-60 mt-1">Total Limit: {formatIDR(card.limit)}</p>
                                  </div>
                                  {card.dueDay && (
                                      <div className="absolute bottom-6 right-6 text-right">
                                          <p className="text-[10px] opacity-70 uppercase">Jatuh Tempo</p>
                                          <p className="text-sm font-bold">Tanggal {card.dueDay}</p>
                                      </div>
                                  )}
                              </div>
                          )
                      })}
                  </div>
              </div>
           )}

           {/* --- REPORT VIEW (DESKTOP) --- */}
           {mobileTab === 'report' && (
              <div className="space-y-6 animate-in fade-in h-full flex flex-col">
                  <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-slate-800">Laporan Tahunan</h2>
                      <div className="flex gap-4">
                          <select value={reportCardId} onChange={(e) => setReportCardId(e.target.value)} className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm">
                              {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm">
                              {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                  <option key={y} value={y}>{y}</option>
                              ))}
                          </select>
                          <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                              <button onClick={() => setReportViewMode('detail')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${reportViewMode === 'detail' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Detail</button>
                              <button onClick={() => setReportViewMode('matrix')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${reportViewMode === 'matrix' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Matriks</button>
                          </div>
                      </div>
                  </div>

                  {reportViewMode === 'detail' ? (
                      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                          <div className="overflow-x-auto flex-1">
                              <table className="w-full text-left border-collapse min-w-[1200px]">
                                  <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200">
                                          <th className="p-4 w-40 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Bulan</th>
                                          {monthNames.map(m => (
                                              <th key={m} className="p-4 font-bold text-slate-500 text-center border-r border-slate-100 min-w-[200px]">{m}</th>
                                          ))}
                                      </tr>
                                  </thead>
                                  <tbody>
                                      <tr className="border-b border-slate-100">
                                          <td className="p-4 font-bold text-slate-700 sticky left-0 bg-white border-r border-slate-200 align-top">Rincian</td>
                                          {monthNames.map((_, i) => {
                                              const report = getMonthlyReportData(reportCardId, i, selectedYear);
                                              return (
                                                  <td key={i} className="p-4 border-r border-slate-100 align-top h-64">
                                                      <div className="space-y-2 text-xs overflow-y-auto max-h-60 custom-scrollbar">
                                                          {report.expenses.map(t => (
                                                              <div key={t.id} className="text-slate-600 truncate" title={t.description}>• {t.description} ({formatIDR(t.amount)})</div>
                                                          ))}
                                                          {report.installments.map(ins => (
                                                              <div key={ins.id} className="text-indigo-600 truncate" title={ins.name}>• {ins.name} ({ins.currentMonthIndex}) ({formatIDR(ins.monthlyAmount)})</div>
                                                          ))}
                                                          {report.expenses.length === 0 && report.installments.length === 0 && (
                                                              <span className="text-slate-300">-</span>
                                                          )}
                                                      </div>
                                                  </td>
                                              )
                                          })}
                                      </tr>
                                      <tr className="bg-slate-50/50 border-b border-slate-100">
                                          <td className="p-4 font-bold text-slate-700 sticky left-0 bg-slate-50 border-r border-slate-200">Total Tagihan</td>
                                          {monthNames.map((_, i) => {
                                              const report = getMonthlyReportData(reportCardId, i, selectedYear);
                                              return (
                                                  <td key={i} className="p-4 text-right font-bold text-slate-800 border-r border-slate-100">
                                                      {formatIDR(report.totalBill)}
                                                  </td>
                                              )
                                          })}
                                      </tr>
                                      <tr className="bg-green-50/30 border-b border-slate-100">
                                          <td className="p-4 font-bold text-slate-700 sticky left-0 bg-green-50 border-r border-slate-200">Dibayar</td>
                                          {monthNames.map((_, i) => {
                                              const report = getMonthlyReportData(reportCardId, i, selectedYear);
                                              return (
                                                  <td key={i} className="p-4 text-right font-bold text-green-600 border-r border-slate-100">
                                                      {formatIDR(report.totalPaid)}
                                                  </td>
                                              )
                                          })}
                                      </tr>
                                      <tr>
                                          <td className="p-4 font-bold text-slate-700 sticky left-0 bg-white border-r border-slate-200">Sisa Tagihan</td>
                                          {monthNames.map((_, i) => {
                                              const report = getMonthlyReportData(reportCardId, i, selectedYear);
                                              return (
                                                  <td key={i} className={`p-4 text-right font-bold border-r border-slate-100 ${report.remaining > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                      {formatIDR(Math.max(0, report.remaining))}
                                                  </td>
                                              )
                                          })}
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  ) : (
                       // MATRIX VIEW
                       <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                           <div className="overflow-auto flex-1">
                               <table className="w-full text-left border-collapse">
                                   <thead className="bg-slate-50 sticky top-0 z-20">
                                       <tr>
                                           <th className="p-4 font-bold text-slate-700 border-b border-r border-slate-200 sticky left-0 bg-slate-50 w-40">Bulan</th>
                                           {data.cards.map(c => (
                                               <th key={c.id} className="p-4 font-bold text-slate-600 border-b border-slate-200 min-w-[150px] text-right">
                                                   {c.name}
                                               </th>
                                           ))}
                                           <th className="p-4 font-bold text-slate-800 border-b border-l border-slate-200 min-w-[150px] text-right bg-slate-100">TOTAL</th>
                                       </tr>
                                   </thead>
                                   <tbody>
                                       {monthNames.map((month, i) => {
                                           let monthlyTotal = 0;
                                           return (
                                               <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                                   <td className="p-4 font-medium text-slate-600 border-r border-slate-200 sticky left-0 bg-white">{month}</td>
                                                   {data.cards.map(c => {
                                                       const bill = getMonthlyBill(c.id, i, selectedYear);
                                                       monthlyTotal += bill;
                                                       return (
                                                           <td key={c.id} className="p-4 text-right text-slate-700">{formatIDR(bill)}</td>
                                                       );
                                                   })}
                                                   <td className="p-4 text-right font-bold text-slate-900 border-l border-slate-200 bg-slate-50/50">{formatIDR(monthlyTotal)}</td>
                                               </tr>
                                           );
                                       })}
                                   </tbody>
                               </table>
                           </div>
                       </div>
                  )}
              </div>
           )}
        </main>
      </div>

      {/* ========================================= */}
      {/* MOBILE SUPER APP VIEW (Fixed Layout)      */}
      {/* ========================================= */}
      <div className="md:hidden fixed inset-0 bg-slate-50 font-sans flex flex-col">
        {/* HEADER MOBILE */}
        <header className="bg-blue-600 text-white pt-safe px-4 pb-4 shadow-md z-30 flex-shrink-0">
          <div className="flex justify-between items-center py-2">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                   <Wallet size={18} className="text-white"/>
                </div>
                <h1 className="text-lg font-bold tracking-tight">LimitWatch</h1>
             </div>
             <div className="flex items-center gap-3">
                 <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="relative p-1">
                     <Bell size={20} />
                     {notifications.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full"></span>}
                 </button>
                 <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-8 h-8 rounded-full bg-white/20 border border-white/30 overflow-hidden">
                     {user.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover"/> : <UserIcon className="p-1.5"/>}
                 </button>
             </div>
          </div>
          {/* Mobile Profile Dropdown */}
          {showProfileMenu && (
              <div className="absolute top-16 right-4 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100">
                      <p className="font-bold text-sm truncate">{user.displayName || 'Pengguna'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button onClick={() => {logout(); setShowProfileMenu(false);}} className="w-full text-left p-4 text-sm text-red-600 flex items-center gap-2">
                      <LogOut size={16}/> Keluar
                  </button>
              </div>
          )}
        </header>

        {/* CONTENT MOBILE (Scrollable Area) */}
        <div 
          className="flex-1 overflow-y-auto pb-24"
          onTouchStart={mobileTab === 'savings' ? onTouchStart : undefined}
          onTouchMove={mobileTab === 'savings' ? onTouchMove : undefined}
          onTouchEnd={mobileTab === 'savings' ? onTouchEnd : undefined}
        >
          {/* TOAST NOTIFICATION */}
          {showToast && toastMessage && (
            <div className="mx-4 mt-4 bg-slate-800/90 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-xl flex items-start gap-3 animate-in slide-in-from-top-5 fade-in duration-300 z-50">
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                <div>
                    <p className="font-bold text-sm">{toastMessage.title}</p>
                    <p className="text-xs text-slate-300">{toastMessage.message}</p>
                </div>
            </div>
          )}

          {mobileTab === 'home' && (
            <div className="p-4 space-y-6">
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
                   <p className="text-blue-100 text-sm mb-1">Total Hutang Berjalan</p>
                   <h2 className="text-3xl font-bold mb-4">{formatIDR(totalDebt)}</h2>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                         <div className="flex items-center gap-2 mb-1">
                            <Coins size={14} className="text-green-300"/>
                            <span className="text-xs text-blue-100">Tabungan</span>
                         </div>
                         <p className="font-bold">{formatIDR(totalSavings)}</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm" onClick={() => setInstallmentListModalOpen(true)}>
                         <div className="flex items-center gap-2 mb-1">
                            <FileBarChart size={14} className="text-orange-300"/>
                            <span className="text-xs text-blue-100">Cicilan Aktif</span>
                         </div>
                         <p className="font-bold">{activeInstallmentsCount} Item</p>
                      </div>
                   </div>
                </div>

                {/* Global Summary Mobile */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                        <Target size={14}/> Ringkasan {monthNames[currentMonth]}
                    </h3>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[9px] text-slate-400 uppercase">Tagihan vs Tabungan</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xs font-medium text-slate-600">{formatIDR(totalGlobalBillThisMonth)}</span>
                                <span className="text-[10px] text-slate-400">/</span>
                                <span className="text-xs font-medium text-green-600">{formatIDR(totalGlobalSavingsThisMonth)}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className={`text-xs font-bold ${isGlobalSafe ? 'text-green-600' : 'text-red-600'}`}>
                                 {isGlobalSafe ? 'Aman' : `Kurang ${formatIDR(Math.abs(globalMonthStatus))}`}
                             </p>
                        </div>
                    </div>
                </div>
                
                {/* Horizontal Scroll Menu (Sortable) */}
                <div>
                   <h3 className="text-sm font-bold text-slate-700 mb-3 px-1">Menu Utama</h3>
                   <div className="grid grid-cols-4 gap-3">
                      {menuOrder.map(item => {
                          let label = '', icon = null, action = () => {};
                          if (item === 'transaksi') { label = 'Catat'; icon = <PlusCircle size={24} className="text-blue-600"/>; action = openAddTransactionModal; }
                          if (item === 'cicilan') { label = 'Cicilan'; icon = <Calculator size={24} className="text-indigo-600"/>; action = openInstallmentModal; }
                          if (item === 'wallets') { label = 'Dompet'; icon = <WalletCards size={24} className="text-emerald-600"/>; action = () => setMobileTab('wallets'); }
                          if (item === 'laporan') { label = 'Laporan'; icon = <FileBarChart size={24} className="text-orange-600"/>; action = () => setMobileTab('report'); }
                          if (item === 'kartu') { label = 'Kartu'; icon = <CreditCard size={24} className="text-purple-600"/>; action = () => setMobileTab('cards'); }
                          if (item === 'tabungan') { label = 'Tabungan'; icon = <Coins size={24} className="text-teal-600"/>; action = () => setMobileTab('savings'); }
                          if (item === 'history') { label = 'Riwayat'; icon = <History size={24} className="text-slate-600"/>; action = () => setMobileTab('history'); }
                          if (item === 'profile') { label = 'Akun'; icon = <UserIcon size={24} className="text-pink-600"/>; action = () => setMobileTab('profile'); }

                          return (
                              <button 
                                key={item}
                                data-menu-id={item}
                                onTouchStart={(e) => onMenuTouchStart(e, item)}
                                onTouchEnd={onMenuTouchEnd}
                                onTouchMove={onMenuTouchMove}
                                onClick={action}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl active:scale-95 transition-all ${draggingItem === item ? 'bg-slate-100 scale-110 shadow-lg z-10' : 'bg-white shadow-sm border border-slate-50'}`}
                              >
                                 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                    {icon}
                                 </div>
                                 <span className="text-[10px] font-medium text-slate-600">{label}</span>
                              </button>
                          )
                      })}
                   </div>
                </div>

                {/* Bill Reminder Horizontal Scroll */}
                {upcomingBills.length > 0 && (
                   <div>
                       <h3 className="text-sm font-bold text-slate-700 mb-3 px-1">Tagihan Terdekat</h3>
                       <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                           {upcomingBills.map(c => {
                               const isOverdue = c.daysLeft < 0;
                               const isUrgent = c.daysLeft <= 3 && !isOverdue;
                               const isCovered = c.shortfall <= 0;
                               return (
                                   <div key={c.id} className={`flex-shrink-0 w-64 p-4 rounded-xl border shadow-sm ${isOverdue ? 'bg-red-50 border-red-200' : isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                                       <div className="flex justify-between items-start mb-2">
                                           <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                               {isOverdue ? `Telat ${Math.abs(c.daysLeft)} Hari` : `${c.daysLeft} Hari Lagi`}
                                           </span>
                                       </div>
                                       <div className="text-xs space-y-1">
                                           <div className="flex justify-between text-slate-500">
                                               <span>Sisa Tagihan</span>
                                               <span className="text-slate-700 font-medium">{formatIDR(c.remainingBill)}</span>
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-700">Transaksi Terakhir</h3>
                      <button onClick={() => setMobileTab('history')} className="text-xs text-blue-600 font-semibold">Lihat Semua</button>
                   </div>
                   <div className="space-y-4">
                      {data.transactions.slice(0, 5).map(t => {
                          const card = data.cards.find(c => c.id === t.cardId);
                          return (
                              <div onClick={() => handleEditClick(t)} key={t.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${t.type === TransactionType.EXPENSE ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                          {t.type === TransactionType.EXPENSE ? <ArrowUpRight size={16}/> : <ArrowDownLeft size={16}/>}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{t.description}</p>
                                          <div className="flex items-center gap-1 text-xs text-slate-500">
                                              <span className={`w-2 h-2 rounded-full ${card?.color || 'bg-slate-300'}`}></span>
                                              <span>{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className={`text-sm font-bold ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                                          {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                                      </p>
                                      {t.isInstallment && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Cicilan</span>}
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
                 <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Kartu Saya</h2>
                    <button onClick={openAddCardModal} className="bg-blue-600 text-white p-2 rounded-full shadow-lg shadow-blue-200">
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
                         <div key={card.id} onClick={() => openCardHistory(card)} className={`rounded-xl p-5 text-white shadow-lg relative overflow-hidden ${card.color || 'bg-slate-700'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <span className="font-bold text-lg tracking-wide">{card.name}</span>
                                <button 
                                    onClick={(e) => {e.stopPropagation(); handleEditCard(card);}} 
                                    className="bg-white/20 p-1.5 rounded-lg hover:bg-white/30 backdrop-blur-sm"
                                >
                                    <Pencil size={14} className="text-white"/>
                                </button>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs opacity-80">Sisa Limit</p>
                                <p className="text-2xl font-bold">{formatIDR(remainingLimit)}</p>
                                <p className="text-xs opacity-60 mt-1">Limit: {formatIDR(card.limit)}</p>
                            </div>
                            {card.dueDay && (
                                <div className="absolute bottom-4 right-4 bg-white/20 px-2 py-1 rounded text-[10px] font-medium backdrop-blur-sm">
                                    Jatuh Tempo Tgl {card.dueDay}
                                </div>
                            )}
                         </div>
                     )
                 })}
                 {data.cards.length === 0 && <p className="text-center text-slate-400 py-10">Belum ada kartu kredit.</p>}
             </div>
          )}

          {mobileTab === 'wallets' && (
             <div className="p-4 space-y-4 animate-in fade-in">
                 <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Dompet & Kas</h2>
                    <button onClick={openAddWalletModal} className="bg-blue-600 text-white p-2 rounded-full shadow-lg shadow-blue-200">
                        <PlusCircle size={20} />
                    </button>
                 </div>
                 {(data.wallets || []).map(w => (
                     <div key={w.id} className={`p-5 rounded-xl text-white shadow-md ${w.color || 'bg-slate-700'}`}>
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white uppercase tracking-wider">{w.type}</span>
                                  <h3 className="font-bold text-lg mt-1">{w.name}</h3>
                              </div>
                              <button onClick={() => handleEditWallet(w)} className="bg-white/20 p-1.5 rounded-lg"><Pencil size={14}/></button>
                          </div>
                          <h2 className="text-2xl font-bold mb-4">{formatIDR(w.balance)}</h2>
                          <div className="flex gap-2">
                              <button onClick={() => openWalletIncomeModal(w.id)} className="flex-1 bg-white/20 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                  <ArrowDownLeft size={14}/> Isi
                              </button>
                              <button onClick={() => openWalletTransferModal(w.id)} className="flex-1 bg-white/20 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
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
                 <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Tabungan Pelunasan</h2>
                    <button onClick={openAddSavingModal} className="bg-green-600 text-white p-2 rounded-full shadow-lg shadow-green-200">
                        <PlusCircle size={20} />
                    </button>
                 </div>
                 {data.cards.map(card => {
                       const groupedSavings = getSavingsByMonth(card.id);
                       if (groupedSavings.length === 0) return null;

                       return (
                           <div key={card.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                               <div className={`p-3 ${card.color || 'bg-slate-700'} text-white flex justify-between items-center`}>
                                   <h3 className="font-bold text-sm">{card.name}</h3>
                                   <div className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                       Total: {formatIDR(groupedSavings.reduce((sum, g) => sum + g.total, 0))}
                                   </div>
                               </div>
                               <div className="p-4 space-y-4">
                                   {groupedSavings.map(group => (
                                       <div key={group.key} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                                           <div className="flex justify-between items-start mb-2">
                                               <h4 className="font-bold text-slate-700 text-sm">{group.label}</h4>
                                               <span className="font-bold text-green-600">{formatIDR(group.total)}</span>
                                           </div>
                                           <div className="space-y-2 mb-3">
                                               {group.items.map(item => (
                                                   <div key={item.id} className="flex justify-between text-xs items-center group/item">
                                                       <span className="text-slate-500 truncate max-w-[120px]">{item.note}</span>
                                                       <div className="flex items-center gap-2">
                                                           <span className="font-medium">{formatIDR(item.amount)}</span>
                                                           <button onClick={() => handleEditSaving(item)} className="text-slate-400"><Pencil size={10}/></button>
                                                       </div>
                                                   </div>
                                               ))}
                                           </div>
                                           <div className="flex gap-2">
                                               <button onClick={() => openWithdrawModal(group.items)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-bold">
                                                   Ambil
                                               </button>
                                               <button onClick={() => handleOpenBatchPay(group.items, group.label, group.total)} className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold">
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
                 <h2 className="text-lg font-bold text-slate-800">Riwayat Transaksi</h2>
                 
                 {/* Mobile Filters */}
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <select value={historyFilterCard} onChange={(e) => setHistoryFilterCard(e.target.value)} className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs flex-shrink-0">
                        <option value="all">Semua Kartu</option>
                        {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={historyFilterMonth} onChange={(e) => setHistoryFilterMonth(parseInt(e.target.value))} className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs flex-shrink-0">
                         {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                     </select>
                     <select value={historyFilterYear} onChange={(e) => setHistoryFilterYear(parseInt(e.target.value))} className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs flex-shrink-0">
                         {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                 </div>

                 {/* Summary Cards Mobile */}
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                        <p className="text-[10px] text-red-600 font-bold uppercase">Pengeluaran</p>
                        <p className="text-lg font-bold text-red-700">{formatIDR(filteredExpense)}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                        <p className="text-[10px] text-green-600 font-bold uppercase">Pembayaran</p>
                        <p className="text-lg font-bold text-green-700">{formatIDR(filteredPayment)}</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                      {filteredTransactions.map(t => {
                          const card = data.cards.find(c => c.id === t.cardId);
                          return (
                              <div onClick={() => handleEditClick(t)} key={t.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      {/* Checklist Validation Toggle Mobile */}
                                      <div onClick={(e) => handleToggleValidation(e, t.id)} className={`w-5 h-5 rounded-full border flex items-center justify-center ${t.isValidated ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                                          {t.isValidated && <Check size={12} className="text-white" />}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{t.description}</p>
                                          <div className="flex items-center gap-1 text-xs text-slate-500">
                                              <span className={`w-2 h-2 rounded-full ${card?.color || 'bg-slate-300'}`}></span>
                                              <span>{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className={`text-sm font-bold ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                                          {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                                      </p>
                                      {t.isInstallment && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Cicilan</span>}
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
                 <h2 className="text-lg font-bold text-slate-800">Laporan Tahunan</h2>
                 
                 <div className="grid grid-cols-2 gap-3 mb-2">
                     <select value={reportCardId} onChange={(e) => setReportCardId(e.target.value)} className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs">
                          {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs">
                          {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                              <option key={y} value={y}>{y}</option>
                          ))}
                      </select>
                 </div>
                 
                 <div className="flex justify-center mb-4">
                     <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                          <button onClick={() => setReportViewMode('detail')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${reportViewMode === 'detail' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Detail</button>
                          <button onClick={() => setReportViewMode('matrix')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${reportViewMode === 'matrix' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Matriks</button>
                      </div>
                 </div>

                 {reportViewMode === 'detail' ? (
                     <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
                         <div className="overflow-x-auto overflow-y-auto flex-1">
                             <table className="w-full text-left text-xs border-collapse" style={{minWidth: '800px'}}>
                                  <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200">
                                          <th className="p-3 w-24 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Bulan</th>
                                          {monthNames.map(m => (
                                              <th key={m} className="p-3 font-bold text-slate-500 text-center border-r border-slate-100 w-48">{m.substring(0,3)}</th>
                                          ))}
                                      </tr>
                                  </thead>
                                  <tbody>
                                      <tr className="border-b border-slate-100">
                                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white border-r border-slate-200 align-top">Rincian</td>
                                          {monthNames.map((_, i) => {
                                              const report = getMonthlyReportData(reportCardId, i, selectedYear);
                                              return (
                                                  <td key={i} className="p-3 border-r border-slate-100 align-top h-40">
                                                      <div className="space-y-1 text-[10px] overflow-y-auto max-h-36">
                                                          {report.expenses.map(t => (
                                                              <div key={t.id} className="text-slate-600 truncate">• {t.description}</div>
                                                          ))}
                                                          {report.installments.map(ins => (
                                                              <div key={ins.id} className="text-indigo-600 truncate">• {ins.name}</div>
                                                          ))}
                                                      </div>
                                                  </td>
                                              )
                                          })}
                                      </tr>
                                      <tr className="bg-slate-50/50 border-b border-slate-100">
                                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-slate-50 border-r border-slate-200">Total</td>
                                          {monthNames.map((_, i) => (
                                              <td key={i} className="p-3 text-right font-bold text-slate-800 border-r border-slate-100">
                                                  {formatIDR(getMonthlyReportData(reportCardId, i, selectedYear).totalBill)}
                                              </td>
                                          ))}
                                      </tr>
                                      <tr className="bg-green-50/30 border-b border-slate-100">
                                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-green-50 border-r border-slate-200">Bayar</td>
                                          {monthNames.map((_, i) => (
                                              <td key={i} className="p-3 text-right font-bold text-green-600 border-r border-slate-100">
                                                  {formatIDR(getMonthlyReportData(reportCardId, i, selectedYear).totalPaid)}
                                              </td>
                                          ))}
                                      </tr>
                                      <tr>
                                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white border-r border-slate-200">Sisa</td>
                                          {monthNames.map((_, i) => {
                                              const rem = getMonthlyReportData(reportCardId, i, selectedYear).remaining;
                                              return (
                                                  <td key={i} className={`p-3 text-right font-bold border-r border-slate-100 ${rem > 0 ? 'text-red-600' : 'text-slate-400'}`}>
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
                     <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
                         <div className="overflow-auto flex-1">
                             <table className="w-full text-left text-xs border-collapse">
                                 <thead className="bg-slate-50 sticky top-0 z-20">
                                     <tr>
                                         <th className="p-3 font-bold text-slate-700 border-b border-r border-slate-200 sticky left-0 bg-slate-50 w-24">Bulan</th>
                                         {data.cards.map(c => (
                                             <th key={c.id} className="p-3 font-bold text-slate-600 border-b border-slate-200 min-w-[100px] text-right">
                                                 {c.name}
                                             </th>
                                         ))}
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {monthNames.map((month, i) => (
                                         <tr key={i} className="border-b border-slate-100">
                                             <td className="p-3 font-medium text-slate-600 border-r border-slate-200 sticky left-0 bg-white">{month.substring(0,3)}</td>
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
                 <h2 className="text-lg font-bold text-slate-800">Akun Pengguna</h2>
                 <div className="bg-white rounded-xl p-6 text-center border border-slate-100 shadow-sm">
                     <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 overflow-hidden border-4 border-slate-50 shadow-sm">
                         {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover"/> : <UserIcon className="w-full h-full p-4 text-slate-400"/>}
                     </div>
                     <h3 className="font-bold text-xl text-slate-800">{user.displayName || 'Pengguna'}</h3>
                     <p className="text-slate-500 text-sm mb-6">{user.email}</p>
                     
                     <div className="space-y-3">
                         <button className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-100">
                             <Settings size={18}/> Pengaturan
                         </button>
                         <button className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-100">
                             <Shield size={18}/> Keamanan
                         </button>
                         <button onClick={() => logout()} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 mt-4 hover:bg-red-100">
                             <LogOut size={18}/> Keluar Aplikasi
                         </button>
                     </div>
                 </div>
                 
                 <div className="bg-blue-600 rounded-xl p-5 text-white shadow-lg shadow-blue-200 mt-6 relative overflow-hidden">
                     <div className="relative z-10">
                         <h3 className="font-bold text-lg mb-1">LimitWatch Premium</h3>
                         <p className="text-blue-100 text-sm mb-4">Dapatkan fitur analisis AI dan laporan eksklusif.</p>
                         <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold">Segera Hadir</button>
                     </div>
                     <div className="absolute -right-6 -bottom-6 bg-white/10 w-32 h-32 rounded-full"></div>
                 </div>
                 
                 <div className="text-center text-xs text-slate-400 mt-8 pb-8">
                     <p>Versi 2.4.0 (Super App Build)</p>
                     <p>&copy; 2024 LimitWatch Financial</p>
                 </div>
             </div>
          )}
        </div>
        
        {/* Floating Action Button (Mobile) */}
        {mobileTab === 'home' && (
            <button 
                onClick={openAddTransactionModal}
                className="absolute bottom-24 right-4 bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl shadow-blue-300 flex items-center justify-center z-40 active:scale-90 transition-transform"
            >
                <PlusCircle size={28} />
            </button>
        )}

        {/* BOTTOM NAVIGATION MOBILE */}
        <nav 
            className="bg-white border-t border-slate-200 fixed bottom-0 w-full z-40 flex justify-around items-start text-[10px] font-medium text-slate-400"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', paddingTop: '12px' }}
        >
            <button onClick={() => setMobileTab('home')} className={`flex flex-col items-center gap-1 w-14 ${mobileTab === 'home' ? 'text-blue-600' : ''}`}>
                <Home size={24} strokeWidth={mobileTab === 'home' ? 2.5 : 2} />
                <span>Beranda</span>
            </button>
            <button onClick={() => setMobileTab('cards')} className={`flex flex-col items-center gap-1 w-14 ${mobileTab === 'cards' ? 'text-blue-600' : ''}`}>
                <CreditCard size={24} strokeWidth={mobileTab === 'cards' ? 2.5 : 2} />
                <span>Kartu</span>
            </button>
            <button onClick={() => setMobileTab('wallets')} className={`flex flex-col items-center gap-1 w-14 ${mobileTab === 'wallets' ? 'text-blue-600' : ''}`}>
                <WalletCards size={24} strokeWidth={mobileTab === 'wallets' ? 2.5 : 2} />
                <span>Dompet</span>
            </button>
            <button onClick={() => setMobileTab('savings')} className={`flex flex-col items-center gap-1 w-14 ${mobileTab === 'savings' ? 'text-blue-600' : ''}`}>
                <Coins size={24} strokeWidth={mobileTab === 'savings' ? 2.5 : 2} />
                <span>Tabungan</span>
            </button>
            <button onClick={() => setMobileTab('history')} className={`flex flex-col items-center gap-1 w-14 ${mobileTab === 'history' ? 'text-blue-600' : ''}`}>
                <History size={24} strokeWidth={mobileTab === 'history' ? 2.5 : 2} />
                <span>Riwayat</span>
            </button>
        </nav>
      </div>

      {/* ========================================= */}
      {/* MODALS & OVERLAYS                         */}
      {/* ========================================= */}
      
      {/* TRANSACTION MODAL */}
      {transactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center p-4 border-b border-slate-100">
                 <h3 className="font-bold text-lg text-slate-800">
                     {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi'}
                 </h3>
                 <button onClick={() => setTransactionModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200">
                     <X size={20} className="text-slate-500"/>
                 </button>
              </div>
              
              <form onSubmit={handleSaveTransaction} className="p-5 space-y-5">
                 {/* Type Toggle */}
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                       type="button" 
                       onClick={() => setTxType(TransactionType.EXPENSE)}
                       className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${txType === TransactionType.EXPENSE ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}
                    >
                       Pengeluaran
                    </button>
                    <button 
                       type="button" 
                       onClick={() => setTxType(TransactionType.PAYMENT)}
                       className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${txType === TransactionType.PAYMENT ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
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
                       className="w-full text-2xl font-bold bg-white border-b-2 border-slate-200 py-2 px-1 text-slate-800 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-300"
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
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Keterangan (Opsional)</label>
                        <input 
                           type="text" 
                           placeholder={txType === TransactionType.EXPENSE ? "Beli apa?" : "Bayar tagihan"}
                           value={txDesc}
                           onChange={(e) => setTxDesc(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                     </div>
                 </div>

                 {/* Options based on Type */}
                 {txType === TransactionType.EXPENSE && (
                     <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2">
                              <Calculator size={18} className="text-indigo-600"/>
                              <span className="font-bold text-sm text-indigo-800">Ubah jadi Cicilan?</span>
                           </div>
                           <button 
                              type="button"
                              onClick={() => setTxIsInstallment(!txIsInstallment)}
                              className={`w-10 h-6 rounded-full transition-colors relative ${txIsInstallment ? 'bg-indigo-600' : 'bg-slate-300'}`}
                           >
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${txIsInstallment ? 'translate-x-4' : ''}`}></div>
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
                                    className="w-full bg-white border border-indigo-200 rounded-lg py-2 px-3 text-sm font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-bold text-indigo-500 shrink-0">Bulan</span>
                              </div>
                              <p className="text-xs text-indigo-500 mt-2">
                                 Estimasi: {formatIDR(getNumericValue(txAmount) / txInstallmentMonths)} / bulan
                              </p>
                           </div>
                        )}
                     </div>
                 )}

                 {txType === TransactionType.PAYMENT && !editingTransaction && (
                     <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Coins size={18} className="text-green-600"/>
                            <span className="font-bold text-sm text-green-800">Ambil dari Tabungan?</span>
                         </div>
                         <button 
                            type="button"
                            onClick={() => setPayFromSavings(!payFromSavings)}
                            className={`w-10 h-6 rounded-full transition-colors relative ${payFromSavings ? 'bg-green-600' : 'bg-slate-300'}`}
                         >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${payFromSavings ? 'translate-x-4' : ''}`}></div>
                         </button>
                     </div>
                 )}

                 {/* Action Buttons */}
                 <div className="flex gap-3 pt-2">
                     {editingTransaction && (
                         <button 
                           type="button" 
                           onClick={() => handleDeleteClick(editingTransaction.id)}
                           className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition"
                         >
                             Hapus
                         </button>
                     )}
                     <button 
                        type="submit" 
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
              <h3 className="font-bold text-lg mb-4 text-slate-800">{editingCard ? 'Edit Kartu' : 'Tambah Kartu Baru'}</h3>
              <form onSubmit={handleSaveCard} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Nama Kartu</label>
                      <input type="text" required value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: BCA Visa" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Limit Kartu</label>
                      <input type="text" inputMode="numeric" required value={cardLimit} onChange={(e) => handleCurrencyInput(e.target.value, setCardLimit)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Cetak Tagihan (1-31)</label>
                      <input type="number" min="1" max="31" value={cardDue} onChange={(e) => setCardDue(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 25" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Warna Kartu</label>
                      <div className="flex flex-wrap gap-2">
                          {CARD_COLORS.map(color => (
                              <button
                                  key={color.id}
                                  type="button"
                                  onClick={() => setCardColor(color.class)}
                                  className={`w-8 h-8 rounded-full ${color.class} ${cardColor === color.class ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'} transition-all`}
                                  title={color.label}
                              />
                          ))}
                      </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                      {editingCard && (
                          <button type="button" onClick={() => handleDeleteCard(editingCard.id)} className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold">Hapus</button>
                      )}
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">Simpan Kartu</button>
                  </div>
                  <button type="button" onClick={() => setCardModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
              </form>
           </div>
        </div>
      )}

      {/* SAVING MODAL */}
      {savingModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
               <h3 className="font-bold text-lg mb-4 text-slate-800">{editingSaving ? 'Edit Tabungan' : 'Tambah Tabungan'}</h3>
               <form onSubmit={handleSaveSaving} className="space-y-4">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Target Kartu</label>
                       <select value={savingCardId} onChange={(e) => setSavingCardId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none">
                           {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Untuk Tagihan Bulan</label>
                       <div className="grid grid-cols-2 gap-2">
                           <select value={savingTargetMonth} onChange={(e) => setSavingTargetMonth(parseInt(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none">
                               {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                           </select>
                           <select value={savingTargetYear} onChange={(e) => setSavingTargetYear(parseInt(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none">
                               {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
                                   <option key={y} value={y}>{y}</option>
                               ))}
                           </select>
                       </div>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Nominal (Rp)</label>
                       <input type="text" inputMode="numeric" required value={savingAmount} onChange={(e) => handleCurrencyInput(e.target.value, setSavingAmount)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" placeholder="0"/>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Catatan (Opsional)</label>
                       <input type="text" value={savingNote} onChange={(e) => setSavingNote(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" placeholder="Contoh: Gaji Bulan Ini"/>
                   </div>
                   <div className="flex gap-3 mt-4">
                       {editingSaving && (
                           <button type="button" onClick={() => handleDeleteSaving(editingSaving.id)} className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold">Hapus</button>
                       )}
                       <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200">Simpan</button>
                   </div>
                   <button type="button" onClick={() => setSavingModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
               </form>
            </div>
         </div>
      )}

      {/* WALLET MODAL */}
      {walletModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">{editingWallet ? 'Edit Dompet' : 'Tambah Dompet'}</h3>
                 <form onSubmit={handleSaveWallet} className="space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Nama Dompet</label>
                         <input type="text" required value={walletName} onChange={(e) => setWalletName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" placeholder="Contoh: BCA Debit"/>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Tipe</label>
                         <select value={walletType} onChange={(e) => setWalletType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none">
                             <option value="BANK">Bank</option>
                             <option value="EWALLET">E-Wallet</option>
                             <option value="CASH">Tunai</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Saldo Awal</label>
                         <input type="text" inputMode="numeric" required value={walletBalance} onChange={(e) => handleCurrencyInput(e.target.value, setWalletBalance)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" placeholder="0"/>
                     </div>
                     <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Warna</label>
                      <div className="flex flex-wrap gap-2">
                          {CARD_COLORS.map(color => (
                              <button
                                  key={color.id}
                                  type="button"
                                  onClick={() => setWalletColor(color.class)}
                                  className={`w-8 h-8 rounded-full ${color.class} ${walletColor === color.class ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'} transition-all`}
                              />
                          ))}
                      </div>
                  </div>
                     <div className="flex gap-3 mt-4">
                         {editingWallet && (
                             <button type="button" onClick={() => handleDeleteWallet(editingWallet.id)} className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold">Hapus</button>
                         )}
                         <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Simpan</button>
                     </div>
                     <button type="button" onClick={() => setWalletModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
                 </form>
             </div>
          </div>
      )}

      {/* WALLET INCOME MODAL */}
      {walletIncomeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">Isi Saldo Dompet</h3>
                 <form onSubmit={handleWalletIncome}>
                     <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Nominal Masuk (Rp)</label>
                         <input type="text" inputMode="numeric" required value={incomeAmount} onChange={(e) => handleCurrencyInput(e.target.value, setIncomeAmount)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xl font-bold outline-none" autoFocus/>
                     </div>
                     <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold mb-3">Tambah Saldo</button>
                     <button type="button" onClick={() => setWalletIncomeModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
                 </form>
             </div>
          </div>
      )}

      {/* WALLET TRANSFER MODAL */}
      {walletTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">Transfer ke Tabungan</h3>
                 <form onSubmit={handleWalletTransferToSaving}>
                     <div className="space-y-4 mb-6">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Nominal (Rp)</label>
                             <input type="text" inputMode="numeric" required value={transferAmount} onChange={(e) => handleCurrencyInput(e.target.value, setTransferAmount)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xl font-bold outline-none"/>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Ke Tabungan Kartu</label>
                             <select value={transferTargetCardId} onChange={(e) => setTransferTargetCardId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none">
                                 {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                         </div>
                     </div>
                     <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mb-3">Transfer Sekarang</button>
                     <button type="button" onClick={() => setWalletTransferModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
                 </form>
             </div>
          </div>
      )}

      {/* INSTALLMENT MANUAL FORM MODAL */}
      {installmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">Catat Cicilan Manual</h3>
                 <form onSubmit={handleSaveInstallmentManual} className="space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Nama Barang</label>
                         <input type="text" value={instName} onChange={(e) => setInstName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" placeholder="Contoh: iPhone 15"/>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Kartu Kredit</label>
                         <select value={instCardId} onChange={(e) => setInstCardId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none">
                             {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Total Harga (Rp)</label>
                             <input type="text" inputMode="numeric" required value={instTotal} onChange={(e) => handleCurrencyInput(e.target.value, setInstTotal)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" placeholder="0"/>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Tenor (Bulan)</label>
                             <input type="number" min="1" required value={instTenure} onChange={(e) => setInstTenure(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" />
                        </div>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Cicilan Per Bulan (Rp)</label>
                         <input type="text" inputMode="numeric" required value={instMonthlyAmount} onChange={(e) => handleCurrencyInput(e.target.value, setInstMonthlyAmount)} className="w-full bg-white border-2 border-indigo-100 rounded-xl p-3 text-sm font-bold text-indigo-700 outline-none focus:border-indigo-500" placeholder="0"/>
                         <p className="text-[10px] text-slate-400 mt-1">*Otomatis dihitung, tapi bisa diubah manual.</p>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Mulai</label>
                         <input type="date" value={instStartDate} onChange={(e) => setInstStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none"/>
                     </div>
                     <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 mt-2">Simpan Cicilan</button>
                     <button type="button" onClick={() => setInstallmentModalOpen(false)} className="w-full py-3 text-slate-500 font-medium">Batal</button>
                 </form>
             </div>
          </div>
      )}

      {/* INSTALLMENT LIST MODAL */}
      {installmentListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Daftar Cicilan Aktif</h3>
                    <div className="flex gap-2">
                        <button onClick={openInstallmentModal} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100">+ Baru</button>
                        <button onClick={() => setInstallmentListModalOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={18}/></button>
                    </div>
                 </div>
                 <div className="p-4 overflow-y-auto space-y-3 flex-1">
                    {data.installments.filter(i => {
                        const startDate = new Date(i.startDate);
                        const now = new Date();
                        const diffMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
                        return diffMonths < i.totalMonths;
                    }).length === 0 ? (
                        <p className="text-center text-slate-400 py-8">Tidak ada cicilan aktif.</p>
                    ) : (
                        data.installments
                        .filter(i => {
                            const startDate = new Date(i.startDate);
                            const now = new Date();
                            const diffMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
                            return diffMonths < i.totalMonths; // Only show strictly active ones
                        })
                        .map(inst => {
                            const card = data.cards.find(c => c.id === inst.cardId);
                            // Simple calculation based on start date
                            const startDate = new Date(inst.startDate);
                            const now = new Date();
                            const diffMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
                            // Current installment number (1-based)
                            const currentN = Math.max(1, diffMonths + 1);
                            
                            return (
                                <div key={inst.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50 relative group">
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
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                                        <div 
                                            className="bg-indigo-500 h-full rounded-full" 
                                            style={{ width: `${(currentN / inst.totalMonths) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Ke {currentN} dari {inst.totalMonths}</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
                 <h3 className="font-bold text-lg mb-4 text-slate-800">Ambil Tabungan</h3>
                 <form onSubmit={handleConfirmWithdraw}>
                     <p className="text-sm text-slate-500 mb-4">
                         Mengambil dana dari tabungan yang belum terpakai.
                     </p>
                     <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Nominal (Rp)</label>
                         <input type="text" inputMode="numeric" required value={withdrawAmount} onChange={(e) => handleCurrencyInput(e.target.value, setWithdrawAmount)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none" autoFocus/>
                     </div>
                     <div className="flex gap-3">
                         <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Ambil</button>
                         <button type="button" onClick={() => setWithdrawModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Batal</button>
                     </div>
                 </form>
             </div>
          </div>
      )}

      {/* BATCH PAY MODAL */}
      {batchPayModalOpen && activeBatchGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
                 <div className="text-center mb-6">
                     <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                         <CheckSquare size={24}/>
                     </div>
                     <h3 className="font-bold text-lg text-slate-800">Konfirmasi Pembayaran</h3>
                     <p className="text-sm text-slate-500 mt-1">{activeBatchGroup.label}</p>
                 </div>
                 
                 <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-6">
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

                 <button onClick={handleConfirmBatchPay} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 mb-3">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <CreditCard size={20}/>
                        Invoice: {selectedCardForHistory.name}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handleShareInvoice} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100">
                            <Share2 size={16}/> Share PDF
                        </button>
                        <button onClick={closeCardHistory} className="bg-slate-200 p-2 rounded-full"><X size={18}/></button>
                    </div>
                 </div>
                 
                 <div className="p-4 border-b border-slate-100 flex gap-4">
                     <select 
                        value={cardHistoryMonth} 
                        onChange={(e) => setCardHistoryMonth(parseInt(e.target.value))}
                        className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-semibold outline-none"
                     >
                         {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                     </select>
                     <select 
                        value={cardHistoryYear} 
                        onChange={(e) => setCardHistoryYear(parseInt(e.target.value))}
                        className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-semibold outline-none"
                     >
                         {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                             <option key={y} value={y}>{y}</option>
                         ))}
                     </select>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 bg-white invoice-container">
                    {(() => {
                        const report = getMonthlyReportData(selectedCardForHistory.id, cardHistoryMonth, cardHistoryYear);
                        return (
                            <div className="space-y-6">
                                <div className="text-center border-b border-slate-100 pb-4">
                                    <h2 className="text-2xl font-bold text-slate-800">Tagihan Kartu Kredit</h2>
                                    <p className="text-slate-500">{monthNames[cardHistoryMonth]} {cardHistoryYear}</p>
                                </div>

                                {/* Summary Box */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Total Tagihan</p>
                                        <p className="text-lg font-bold text-slate-800">{formatIDR(report.totalBill)}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-xl">
                                        <p className="text-xs text-green-600 uppercase">Dibayar</p>
                                        <p className="text-lg font-bold text-green-600">{formatIDR(report.totalPaid)}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase">Sisa Tagihan</p>
                                        <p className={`text-lg font-bold ${report.remaining <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatIDR(report.remaining)}
                                        </p>
                                    </div>
                                </div>

                                {/* Transactions List */}
                                <div>
                                    <h4 className="font-bold text-slate-700 mb-3 border-l-4 border-blue-500 pl-3">Transaksi Baru</h4>
                                    {report.expenses.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">Tidak ada transaksi belanja baru.</p>
                                    ) : (
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="text-slate-400 border-b border-slate-100">
                                                    <th className="py-2 font-medium">Tanggal</th>
                                                    <th className="py-2 font-medium">Keterangan</th>
                                                    <th className="py-2 font-medium text-right">Jumlah</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.expenses.map(t => (
                                                    <tr key={t.id} className="border-b border-slate-50">
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
                                                <tr className="text-slate-400 border-b border-slate-100">
                                                    <th className="py-2 font-medium">Cicilan</th>
                                                    <th className="py-2 font-medium">Ke</th>
                                                    <th className="py-2 font-medium text-right">Jumlah</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.installments.map(i => (
                                                    <tr key={i.id} className="border-b border-slate-50">
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
                                                    <tr key={t.id} className="border-b border-slate-50">
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