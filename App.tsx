import React, { useState, useEffect, useRef } from "react";
import { 
  AppState, 
  Installment, 
  Transaction, 
  TransactionType,
  CreditCard as CreditCardType,
  Saving
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
import { getFinancialAdvice } from "./services/geminiService";
import { 
  Home, 
  CreditCard, 
  History, 
  User as UserIcon, 
  PlusCircle, 
  Wallet, 
  Sparkles, 
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
  PiggyBank,
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
  ToggleRight
} from "lucide-react";

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
// Helper to parse "Rp 10.000" back to 10000
const getNumericValue = (val: string) => {
    return parseInt(val.replace(/\D/g, '') || '0', 10);
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

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
    savings: []
  });
  
  // UI States
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [batchPayModalOpen, setBatchPayModalOpen] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<NotificationItem | null>(null);
  
  // Profile Menu State (Mobile)
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isNotifEnabled, setIsNotifEnabled] = useState(true); // Dummy state for toggle
  
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'savings' | 'history' | 'report' | 'profile'>('home');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);

  // Swipe Gesture States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  const maxVerticalDistance = 30; // Maximum allowed vertical scroll during swipe
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

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
  
  // Installment Conversion State
  const [txIsInstallment, setTxIsInstallment] = useState(false);
  const [txInstallmentMonths, setTxInstallmentMonths] = useState(3);

  // Card Form State
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDue, setCardDue] = useState('');

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

  // History / Back Button Logic Refs
  const prevTabRef = useRef(mobileTab);
  const isBackNavigationRef = useRef(false);

  // --- MENU DRAG & DROP STATES ---
  const [menuOrder, setMenuOrder] = useState<string[]>(['catat_belanja', 'cicilan_baru', 'laporan_tagihan', 'tabungan_rutin']);
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  const [draggedMenuIndex, setDraggedMenuIndex] = useState<number | null>(null);
  const menuLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const dragItemRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(setUser);
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

  // Set default card selection when cards are loaded
  useEffect(() => {
    if (data.cards.length > 0) {
      if (!txCardId) setTxCardId(data.cards[0].id);
      if (!savingCardId) setSavingCardId(data.cards[0].id);
    }
  }, [data.cards, txCardId, savingCardId]);

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
    // Jangan push history jika perubahan state disebabkan oleh tombol back
    if (isBackNavigationRef.current) {
        isBackNavigationRef.current = false;
        prevTabRef.current = mobileTab;
        return;
    }

    if (mobileTab === 'home') {
        // Jika kembali ke home, kita tidak perlu push state baru, 
        // biarkan browser stack apa adanya (atau user menekan tombol home)
    } else {
        // Jika pindah ke tab selain home
        if (prevTabRef.current === 'home') {
            // Home -> Tab: Push State (agar tombol back aktif)
            window.history.pushState({ tab: mobileTab }, '', '');
        } else {
            // Tab -> Tab: Replace State (agar stack tidak menumpuk: Home -> TabBaru)
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

    // Trigger Toast for most urgent notification if exists
    const urgentNotif = newNotifications.find(n => n.type === 'urgent');
    if (urgentNotif) {
        setToastMessage(urgentNotif);
        setShowToast(true);
        // Auto hide toast after 5 seconds
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
    
    // Check if swipe is horizontal dominant
    if (verticalDistance > maxVerticalDistance) {
        // This was likely a scroll, ignore swipe
        setTouchStart(null);
        setTouchEnd(null);
        setTouchStartY(null);
        return;
    }

    const isLeftSwipe = horizontalDistance > minSwipeDistance;
    const isRightSwipe = horizontalDistance < -minSwipeDistance;

    // Swipe Left to Right (Negative distance) -> Go Home
    if (isRightSwipe) {
      setMobileTab('home');
    }
    
    // Reset
    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartY(null);
  };

  const saveData = (newData: AppState) => {
    setData(newData);
    if (user) {
      saveAppState(user.uid, newData);
    }
  };

  const addInstallment = (inst: Installment) => {
      // Create corresponding transaction automatically
      const newTransaction: Transaction = {
          id: generateId(),
          cardId: inst.cardId,
          amount: inst.totalAmount,
          date: inst.startDate,
          description: inst.name,
          type: TransactionType.EXPENSE,
          isInstallment: true,
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
    setTxIsInstallment(false); // Reset installment toggle
    setTxInstallmentMonths(3);
    setPayFromSavings(false); // Reset savings toggle
    if (data.cards.length > 0) setTxCardId(data.cards[0].id);
    setTransactionModalOpen(true);
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setTxType(t.type);
    setTxAmount(formatIDR(t.amount)); // Pre-fill with formatted currency
    setTxDesc(t.description);
    setTxCardId(t.cardId);
    setTxDate(new Date(t.date).toISOString().split('T')[0]);
    setTxIsInstallment(!!t.isInstallment);
    setPayFromSavings(false); // Edit mode doesn't support complex logic re-trigger
    setTransactionModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      const updatedTransactions = data.transactions.filter(t => t.id !== id);
      saveData({ ...data, transactions: updatedTransactions });
    }
  };

  // Helper to consume savings (FIFO)
  const consumeSavings = (cardId: string, amount: number, existingSavings: Saving[]) => {
      let remainingToDeduct = amount;
      let updatedSavings = [...existingSavings];

      // Get available savings for this card
      // Sort by date (oldest first) to use FIFO
      const availableSavings = updatedSavings
          .filter(s => s.cardId === cardId && !s.isTransferred)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const item of availableSavings) {
          if (remainingToDeduct <= 0) break;

          if (item.amount <= remainingToDeduct) {
              // Mark as transferred/used
              remainingToDeduct -= item.amount;
              updatedSavings = updatedSavings.map(s => s.id === item.id ? { ...s, isTransferred: true } : s);
          } else {
              // Reduce amount
              const newAmount = item.amount - remainingToDeduct;
              updatedSavings = updatedSavings.map(s => s.id === item.id ? { ...s, amount: newAmount } : s);
              remainingToDeduct = 0;
          }
      }
      return updatedSavings;
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txCardId || !txAmount || !txDesc) return;

    let updatedInstallments = [...data.installments];
    let updatedSavings = [...data.savings];
    let finalIsInstallment = txIsInstallment;
    const amountVal = getNumericValue(txAmount); // Parse from formatted string

    if (amountVal === 0) return;

    // 1. Logic for Installment Conversion (Expense only)
    if (txIsInstallment && txType === TransactionType.EXPENSE) {
       if (!editingTransaction || (editingTransaction && !editingTransaction.isInstallment)) {
          const newInstallment: Installment = {
              id: generateId(),
              cardId: txCardId,
              name: txDesc,
              totalAmount: amountVal,
              monthlyAmount: amountVal / txInstallmentMonths,
              totalMonths: txInstallmentMonths,
              monthsPaid: 0,
              startDate: new Date(txDate).toISOString()
          };
          updatedInstallments = [newInstallment, ...updatedInstallments];
       }
    } else {
        finalIsInstallment = false;
    }

    // 2. Logic for Pay From Savings (Payment only)
    if (txType === TransactionType.PAYMENT && payFromSavings && !editingTransaction) {
        // Calculate available savings
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
      // Edit Logic
      const updatedTransactions = data.transactions.map(t => {
        if (t.id === editingTransaction.id) {
          return {
            ...t,
            cardId: txCardId,
            amount: amountVal,
            date: new Date(txDate).toISOString(),
            description: txDesc,
            type: txType,
            isInstallment: finalIsInstallment 
          };
        }
        return t;
      });
      saveData({ ...data, transactions: updatedTransactions, installments: updatedInstallments, savings: updatedSavings });
      setEditingTransaction(null);
    } else {
      // Add Logic
      const newTransaction: Transaction = {
        id: generateId(),
        cardId: txCardId,
        amount: amountVal,
        date: new Date(txDate).toISOString(),
        description: txDesc,
        type: txType,
        category: payFromSavings ? 'Payment from Savings' : 'General',
        isValidated: false,
        isInstallment: finalIsInstallment
      };
      saveData({
        ...data,
        transactions: [newTransaction, ...data.transactions],
        installments: updatedInstallments,
        savings: updatedSavings
      });
    }

    // Reset Form
    setTxAmount('');
    setTxDesc('');
    setTransactionModalOpen(false);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardLimit) return;

    const limitVal = getNumericValue(cardLimit);
    if(limitVal === 0) return;

    const newCard: CreditCardType = {
        id: generateId(),
        name: cardName,
        limit: limitVal,
        color: 'bg-slate-800', 
        dueDay: cardDue ? parseInt(cardDue) : undefined
    };

    saveData({
        ...data,
        cards: [...data.cards, newCard]
    });

    setCardName('');
    setCardLimit('');
    setCardDue('');
    setCardModalOpen(false);
  };

  // --- SAVING FUNCTIONS ---
  
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
    setSavingAmount(formatIDR(s.amount)); // Pre-fill with formatted
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
        // UPDATE Existing Saving
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
        // CREATE New Saving
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

  // Helper to open batch pay modal
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

  // Handle confirm Batch Pay
  const handleConfirmBatchPay = () => {
    if (!activeBatchGroup) return;

    const { items, total, month, year } = activeBatchGroup;
    const firstItem = items[0];
    const periodText = (month >= 0 && year > 0) 
        ? ` (${monthNames[month]} ${year})` 
        : '';

    // 1. Create ONE Payment Transaction
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

    // 2. Mark ALL Savings in this group as Transferred
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

  // Handle ambil tabungan: Open Modal
  const openWithdrawModal = (savingsGroup: Saving[]) => {
      setActiveSavingsGroup(savingsGroup);
      setWithdrawAmount('');
      setWithdrawModalOpen(true);
  }

  // Handle confirm withdraw in modal
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

    // Reuse helper
    const updatedSavings = consumeSavings(
        activeSavingsGroup[0].cardId, 
        amountToWithdraw, 
        data.savings
    );

    saveData({ ...data, savings: updatedSavings });
    setWithdrawModalOpen(false);
  }

  // Helper for deleting single item
  const handleDeleteSaving = (id: string) => {
     if(window.confirm("Hapus data tabungan ini?")) {
        const updatedSavings = data.savings.filter(s => s.id !== id);
        saveData({...data, savings: updatedSavings});
     }
  }

  // Helper: Group savings by target month
  const getSavingsByMonth = (cardId: string) => {
     const activeSavings = data.savings.filter(s => s.cardId === cardId && !s.isTransferred);
     
     // Group key: "YYYY-MM"
     const grouped: Record<string, Saving[]> = {};
     
     activeSavings.forEach(s => {
         let key = "Lainnya";
         if (s.targetPeriod) {
             key = `${s.targetPeriod.year}-${s.targetPeriod.month}`;
         }
         if (!grouped[key]) grouped[key] = [];
         grouped[key].push(s);
     });

     // Sort keys: "Lainnya" last, others chronologically
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

  // --- REPORT FUNCTIONS ---
  const getMonthlyBill = (cardId: string, monthIndex: number, year: number) => {
     // 1. Sum Regular Expenses (Non-Installment Transactions)
     const expenses = data.transactions
       .filter(t => {
          const d = new Date(t.date);
          return t.cardId === cardId && 
                 t.type === TransactionType.EXPENSE && 
                 !t.isInstallment && 
                 d.getMonth() === monthIndex && 
                 d.getFullYear() === year;
       })
       .reduce((sum, t) => sum + t.amount, 0);

     // 2. Add Monthly Installment Portion
     // Logic: Installment contributes to bill if current month is within range [start, start + duration]
     const installmentLoad = data.installments
       .filter(i => i.cardId === cardId)
       .reduce((sum, i) => {
          const startDate = new Date(i.startDate);
          // Calculate end date
          const endDate = new Date(startDate);
          endDate.setMonth(startDate.getMonth() + i.totalMonths);

          const currentMonthDate = new Date(year, monthIndex, 1);
          // Check if current analysis month is AFTER/EQUAL start AND BEFORE end
          // Simple month diff check
          const monthDiff = (year - startDate.getFullYear()) * 12 + (monthIndex - startDate.getMonth());
          
          if (monthDiff >= 0 && monthDiff < i.totalMonths) {
             return sum + i.monthlyAmount;
          }
          return sum;
       }, 0);

     return expenses + installmentLoad;
  };

  const handleGetAdvice = async () => {
    // Attempt to prompt for API Key if supported by the environment (e.g. AI Studio)
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      try {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
        }
      } catch (e) {
        console.error("Failed to select API key:", e);
      }
    }

    setLoadingAi(true);
    const advice = await getFinancialAdvice(data);
    setAiAdvice(advice);
    setLoadingAi(false);
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
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Email atau password salah.";
      if (err.code === 'auth/email-already-in-use') msg = "Email sudah terdaftar.";
      if (err.code === 'auth/weak-password') msg = "Password terlalu lemah (min 6 karakter).";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // --- MENU DRAG & DROP HANDLERS ---
  const handleMenuTouchStart = (e: React.TouchEvent, index: number) => {
    // Start timer for long press
    dragItemRef.current = index;
    menuLongPressTimer.current = setTimeout(() => {
        setIsDraggingMenu(true);
        setDraggedMenuIndex(index);
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms long press
  };

  const handleMenuTouchMove = (e: React.TouchEvent) => {
    // If not in drag mode, check if we moved enough to cancel long press
    if (!isDraggingMenu) {
        if (menuLongPressTimer.current) {
             clearTimeout(menuLongPressTimer.current);
             menuLongPressTimer.current = null;
        }
        return;
    }

    // Prevent scrolling while dragging menu
    // e.preventDefault(); // Note: Passive listener might prevent this, but touch-action CSS helps

    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const closestButton = target?.closest('[data-menu-index]');

    if (closestButton && draggedMenuIndex !== null) {
        const targetIndex = parseInt(closestButton.getAttribute('data-menu-index') || '-1');
        
        if (targetIndex !== -1 && targetIndex !== draggedMenuIndex) {
             // Swap in state
             const newOrder = [...menuOrder];
             const [movedItem] = newOrder.splice(draggedMenuIndex, 1);
             newOrder.splice(targetIndex, 0, movedItem);
             
             setMenuOrder(newOrder);
             setDraggedMenuIndex(targetIndex);
             dragItemRef.current = targetIndex;
             // Small vibrate on swap
             if (navigator.vibrate) navigator.vibrate(10);
        }
    }
  };

  const handleMenuTouchEnd = () => {
    // Clear timer
    if (menuLongPressTimer.current) {
        clearTimeout(menuLongPressTimer.current);
        menuLongPressTimer.current = null;
    }
    
    // End dragging
    setIsDraggingMenu(false);
    setDraggedMenuIndex(null);
    dragItemRef.current = null;
  };

  // Menu Configuration
  const menuConfig: Record<string, { label: string, icon: React.ReactNode, color: string, action: () => void }> = {
     'catat_belanja': {
         label: 'Catat\nBelanja',
         icon: <PlusCircle size={24} />,
         color: 'bg-green-100 text-green-600',
         action: openAddTransactionModal
     },
     'cicilan_baru': {
         label: 'Cicilan\nBaru',
         icon: <LayoutGrid size={24} />,
         color: 'bg-orange-100 text-orange-600',
         action: () => setInstallmentModalOpen(true)
     },
     'laporan_tagihan': {
         label: 'Laporan\nTagihan',
         icon: <FileBarChart size={24} />,
         color: 'bg-blue-100 text-blue-600',
         action: () => setMobileTab('report')
     },
     'tabungan_rutin': {
         label: 'Tabungan\nRutin',
         icon: <PiggyBank size={24} />,
         color: 'bg-teal-100 text-teal-600',
         action: () => setMobileTab('savings')
     }
  };


  // --- Calculated Values ---
  const totalDebt = data.transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0) - 
    data.transactions
    .filter(t => t.type === TransactionType.PAYMENT)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSavings = data.savings
    .filter(s => !s.isTransferred)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // --- Bill Reminder Logic for Widget ---
  const upcomingBills = data.cards
      .filter(c => c.dueDay)
      .map(c => {
         const today = new Date();
         const currentDay = today.getDate();
         const currentMonth = today.getMonth();
         const currentYear = today.getFullYear();
         
         let targetMonth = currentMonth;
         let targetYear = currentYear;
         
         // If due day passed this month, target is next month
         if (c.dueDay! < currentDay) {
            targetMonth++;
            if (targetMonth > 11) { targetMonth = 0; targetYear++; }
         }
         
         const dueDate = new Date(targetYear, targetMonth, c.dueDay!);
         const diffTime = dueDate.getTime() - today.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

         // Calculate Remaining Bill (Expenses & Installments - Payments) for Target Month
         const billAmount = getMonthlyBill(c.id, targetMonth, targetYear);
         const paidAmount = data.transactions
            .filter(t => {
                const d = new Date(t.date);
                return t.cardId === c.id &&
                       t.type === TransactionType.PAYMENT &&
                       d.getMonth() === targetMonth &&
                       d.getFullYear() === targetYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
         
         const remaining = Math.max(0, billAmount - paidAmount);
         
         return { ...c, daysLeft: diffDays, nextDueDate: dueDate, remainingBill: remaining };
      })
      .filter(c => c.remainingBill > 1000) // Only show bills with remaining debt
      .sort((a, b) => a.daysLeft - b.daysLeft);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Wallet size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">LimitWatch</h1>
            <p className="text-slate-500 mt-2">Kelola finansial Anda dengan lebih bijak.</p>
          </div>

          {/* Form */}
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
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
                {authError}
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Atau masuk dengan</span>
            </div>
          </div>

          {/* Google Login */}
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G"/>
            <span>Google</span>
          </button>

          {/* Toggle */}
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

  // Helper component for Sidebar Navigation
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
      <div className="hidden md:flex min-h-screen bg-slate-50 font-sans">
        
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
              <DesktopNavItem icon={<History size={20}/>} label="Riwayat Transaksi" active={mobileTab === 'history'} onClick={() => setMobileTab('history')} />
              <DesktopNavItem icon={<PiggyBank size={20}/>} label="Tabungan Pelunasan" active={mobileTab === 'savings'} onClick={() => setMobileTab('savings')} />
              <DesktopNavItem icon={<FileBarChart size={20}/>} label="Laporan Tahunan" active={mobileTab === 'report'} onClick={() => setMobileTab('report')} />
              
              <div className="px-4 pb-2 pt-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Akun</div>
              <DesktopNavItem icon={<UserIcon size={20}/>} label="Profil Pengguna" active={mobileTab === 'profile'} onClick={() => setMobileTab('profile')} />
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

                 <button 
                   onClick={openAddTransactionModal}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
                 >
                    <PlusCircle size={20} /> Catat Transaksi
                 </button>
                 <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                     {user.photoURL ? (
                       <img src={user.photoURL} alt="User" className="w-full h-full object-cover"/>
                     ) : (
                       <UserIcon className="m-3 text-slate-500"/>
                     )}
                 </div>
              </div>
           </header>

           {/* --- DASHBOARD VIEW --- */}
           {mobileTab === 'home' && (
             <div className="space-y-8 animate-in fade-in duration-500">
               {/* Stats Grid */}
               <div className="grid grid-cols-4 gap-6">
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
                        <PiggyBank size={64} className="text-green-600"/>
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
                       <h3 className="text-2xl font-bold">{data.installments.filter(i => i.monthsPaid < i.totalMonths).length} Item</h3>
                     </div>
                     <button onClick={() => setInstallmentModalOpen(true)} className="text-sm bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 px-4 rounded-lg w-fit transition-colors">
                        + Baru
                     </button>
                  </div>
                  
                  {/* Bill Reminder Widget (Desktop) */}
                  <div className="col-span-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 h-40 overflow-y-auto">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                          <Bell size={16} className="text-orange-500"/>
                          <h3 className="text-sm font-bold text-slate-800">Pengingat Tagihan</h3>
                      </div>
                      <div className="space-y-2">
                          {upcomingBills.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-4">Semua tagihan lunas!</p>
                          ) : (
                              upcomingBills.map(c => {
                                  const isUrgent = c.daysLeft <= 3;
                                  const isWarning = c.daysLeft <= 7;
                                  return (
                                      <div key={c.id} className={`p-2 rounded-lg text-xs border ${isUrgent ? 'bg-red-50 border-red-100' : isWarning ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                                          <div className="flex justify-between font-bold">
                                              <span className="truncate w-16">{c.name}</span>
                                              <span className={isUrgent ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-slate-600'}>
                                                  {c.daysLeft} Hari
                                              </span>
                                          </div>
                                          <div className="flex justify-between items-center mt-1">
                                             <div className="text-slate-500 text-[10px]">
                                                {c.nextDueDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                             </div>
                                             <div className="font-bold text-slate-800 text-[10px]">
                                                Sisa: {formatIDR(c.remainingBill)}
                                             </div>
                                          </div>
                                      </div>
                                  )
                              })
                          )}
                      </div>
                  </div>
               </div>

               {/* AI Section */}
               <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                           <Sparkles size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">Analisis Keuangan AI</h3>
                     </div>
                     <button onClick={handleGetAdvice} disabled={loadingAi} className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                        {loadingAi ? 'Menganalisis...' : 'Refresh Analisis'}
                     </button>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5 text-slate-700 text-sm leading-relaxed whitespace-pre-line border border-slate-100 min-h-[100px]">
                     {aiAdvice ? aiAdvice : "Tekan tombol refresh untuk mendapatkan saran keuangan cerdas berdasarkan data transaksi Anda."}
                  </div>
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
                        {data.transactions.slice(0, 5).map(t => (
                           <tr key={t.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                              <td className="p-4 font-medium flex items-center gap-2">
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
                        ))}
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

           {/* --- CARDS VIEW --- */}
           {mobileTab === 'cards' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-slate-700">Daftar Kartu Kredit</h2>
                   <button onClick={() => setCardModalOpen(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <PlusCircle size={16} /> Tambah Kartu
                   </button>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                   {/* Add Card Button (Visual) */}
                   <button 
                     onClick={() => setCardModalOpen(true)}
                     className="border-2 border-dashed border-slate-300 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all"
                   >
                      <PlusCircle size={32} className="mb-2"/>
                      <span className="font-medium">Tambah Kartu Baru</span>
                   </button>

                   {/* Cards List */}
                   {data.cards.map(card => (
                      <div key={card.id} className="bg-gradient-to-br from-slate-700 to-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden h-48 flex flex-col justify-between group transition-transform hover:-translate-y-1">
                         <div className="absolute top-0 right-0 p-24 bg-white opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                         
                         <div className="flex justify-between items-start z-10">
                            <span className="font-medium tracking-wider text-slate-300 uppercase text-xs">Credit Card</span>
                            <div className="flex gap-2">
                               <div className="w-8 h-5 bg-white/20 rounded"></div>
                               <div className="w-8 h-5 bg-white/20 rounded"></div>
                            </div>
                         </div>
                         
                         <div className="z-10">
                            <h3 className="text-xl font-bold tracking-widest mb-1">{card.name}</h3>
                            <p className="text-xs text-slate-400">Limit: {formatIDR(card.limit)}</p>
                         </div>
                         
                         <div className="flex justify-between items-end z-10">
                            <div>
                               <p className="text-[10px] text-slate-400 uppercase">Jatuh Tempo</p>
                               <p className="text-sm font-mono">{card.dueDay ? `Tgl ${card.dueDay}` : '-'}</p>
                            </div>
                            <CreditCard className="opacity-50" size={24} />
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {/* --- SAVINGS VIEW (DESKTOP) --- */}
           {mobileTab === 'savings' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center bg-green-50 p-6 rounded-2xl border border-green-100">
                    <div>
                        <h2 className="text-2xl font-bold text-green-800">Tabungan Pelunasan</h2>
                        <p className="text-green-600 mt-1">Sisihkan uang setiap bulan untuk membayar tagihan.</p>
                    </div>
                    <button 
                      onClick={openAddSavingModal}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-200"
                    >
                       <PlusCircle size={20} /> Tambah Tabungan
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {data.cards.map(card => {
                      const cardDebt = data.transactions
                        .filter(t => t.cardId === card.id && t.type === TransactionType.EXPENSE)
                        .reduce((sum, t) => sum + t.amount, 0) - 
                        data.transactions
                        .filter(t => t.cardId === card.id && t.type === TransactionType.PAYMENT)
                        .reduce((sum, t) => sum + t.amount, 0);

                      const cardSaved = data.savings
                        .filter(s => s.cardId === card.id && !s.isTransferred)
                        .reduce((sum, s) => sum + s.amount, 0);

                      const progress = cardDebt > 0 ? Math.min((cardSaved / cardDebt) * 100, 100) : 0;
                      const monthGroups = getSavingsByMonth(card.id);

                      return (
                         <div key={card.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                     <CreditCard size={20} />
                                  </div>
                                  <div>
                                     <h3 className="font-bold text-slate-800">{card.name}</h3>
                                     <p className="text-xs text-slate-500">Hutang: {formatIDR(cardDebt)}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-xs text-slate-400">Terkumpul</p>
                                  <p className="text-xl font-bold text-green-600">{formatIDR(cardSaved)}</p>
                               </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6">
                               <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>

                            {/* Savings Groups */}
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                               {monthGroups.length === 0 ? (
                                  <p className="text-center text-xs text-slate-400 italic py-2">Belum ada tabungan aktif.</p>
                               ) : (
                                  monthGroups.map(group => (
                                    <div key={group.key} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                       <div className="p-3 bg-slate-100 flex justify-between items-center border-b border-slate-200">
                                          <div>
                                             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tagihan {group.label}</p>
                                             <p className="text-lg font-bold text-green-700">{formatIDR(group.total)}</p>
                                          </div>
                                          <div className="flex gap-2">
                                             <button 
                                                onClick={() => openWithdrawModal(group.items)}
                                                className="px-3 py-1.5 bg-white text-orange-600 border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-50 transition"
                                             >
                                                Ambil
                                             </button>
                                             <button 
                                                onClick={() => handleOpenBatchPay(group.items, group.label, group.total)}
                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm"
                                             >
                                                Bayar Tagihan
                                             </button>
                                          </div>
                                       </div>
                                       <div className="divide-y divide-slate-100">
                                          {group.items.map(s => (
                                             <div key={s.id} className="p-3 flex justify-between items-center hover:bg-white transition-colors">
                                                <div>
                                                   <p className="text-sm font-medium text-slate-700">{s.note}</p>
                                                   <p className="text-[10px] text-slate-400">{new Date(s.date).toLocaleDateString('id-ID')}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                   <span className="font-semibold text-slate-600 text-sm">{formatIDR(s.amount)}</span>
                                                   <div className="flex gap-1 ml-2">
                                                      <button onClick={() => handleEditSaving(s)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Pencil size={12} /></button>
                                                      <button onClick={() => handleDeleteSaving(s.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                                                   </div>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                  ))
                               )}
                            </div>
                         </div>
                      )
                   })}
                </div>
             </div>
           )}

           {/* --- REPORT VIEW (NEW) --- */}
           {mobileTab === 'report' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Laporan Tagihan Tahunan</h2>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                       {[0, 1, 2].map(offset => {
                          const y = new Date().getFullYear() - 1 + offset;
                          return <option key={y} value={y}>{y}</option>;
                       })}
                    </select>
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="bg-slate-800 text-white text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold sticky left-0 bg-slate-800 z-10 w-32">Bulan</th>
                                {data.cards.map(c => (
                                   <th key={c.id} className="p-4 font-semibold whitespace-nowrap">{c.name}</th>
                                ))}
                                <th className="p-4 font-semibold text-right bg-slate-900/50">Total</th>
                             </tr>
                          </thead>
                          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                             {Array.from({ length: 12 }).map((_, monthIndex) => {
                                const monthName = new Date(selectedYear, monthIndex).toLocaleString('id-ID', { month: 'long' });
                                let monthlyTotal = 0;

                                return (
                                   <tr key={monthIndex} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4 font-medium text-slate-800 sticky left-0 bg-white shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)]">{monthName}</td>
                                      {data.cards.map(c => {
                                         const bill = getMonthlyBill(c.id, monthIndex, selectedYear);
                                         monthlyTotal += bill;
                                         return (
                                            <td key={c.id} className="p-4 whitespace-nowrap text-slate-600">
                                               {bill > 0 ? formatIDR(bill) : '-'}
                                            </td>
                                         );
                                      })}
                                      <td className="p-4 text-right font-bold text-slate-800 bg-slate-50/50">
                                         {monthlyTotal > 0 ? formatIDR(monthlyTotal) : '-'}
                                      </td>
                                   </tr>
                                );
                             })}
                          </tbody>
                       </table>
                    </div>
                 </div>
                 
                 <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 border border-blue-100 flex items-start gap-3">
                    <div className="mt-0.5"><Sparkles size={16}/></div>
                    <p>
                       <strong>Catatan Laporan:</strong> Angka di atas adalah proyeksi tagihan berdasarkan transaksi belanja reguler dan cicilan aktif pada bulan tersebut. Pembayaran (Payment) tidak mengurangi angka ini karena tabel ini fokus pada "Beban Tagihan".
                    </p>
                 </div>
              </div>
           )}

           {/* --- HISTORY VIEW --- */}
           {mobileTab === 'history' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="p-6 border-b border-slate-100">
                     <h2 className="text-xl font-bold text-slate-800">Semua Riwayat Transaksi</h2>
                 </div>
                 <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                           <th className="p-4 font-semibold">Tanggal</th>
                           <th className="p-4 font-semibold">Kartu</th>
                           <th className="p-4 font-semibold">Keterangan</th>
                           <th className="p-4 font-semibold">Kategori</th>
                           <th className="p-4 font-semibold text-right">Jumlah</th>
                           <th className="p-4 font-semibold text-center">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                        {data.transactions.map(t => {
                           const cardName = data.cards.find(c => c.id === t.cardId)?.name || 'Unknown Card';
                           return (
                             <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                <td className="p-4 text-slate-600">{cardName}</td>
                                <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                                  {t.description}
                                  {t.isInstallment && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">CICILAN</span>}
                                </td>
                                <td className="p-4">
                                   <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                      t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                   }`}>
                                      {t.type === TransactionType.EXPENSE ? 'EXPENSE' : 'PAYMENT'}
                                   </span>
                                </td>
                                <td className={`p-4 text-right font-bold ${
                                   t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'
                                }`}>
                                   {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                  <button onClick={() => handleEditClick(t)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit Transaksi">
                                    <Pencil size={16} />
                                  </button>
                                  <button onClick={() => handleDeleteClick(t.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Hapus Transaksi">
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                             </tr>
                           );
                        })}
                     </tbody>
                 </table>
             </div>
           )}

           {/* --- PROFILE VIEW --- */}
           {mobileTab === 'profile' && (
              <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                 <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden">
                        {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={40} className="m-auto mt-7 text-slate-400"/>}
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-slate-800">{user.displayName || 'Pengguna'}</h2>
                       <p className="text-slate-500">{user.email}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <h3 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Pengaturan Aplikasi</h3>
                    <div className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:bg-slate-50 cursor-pointer">
                       <span className="text-slate-700 font-medium">Notifikasi Tagihan</span>
                       <div className="w-10 h-5 bg-green-500 rounded-full relative">
                          <div className="w-3 h-3 bg-white rounded-full absolute right-1 top-1"></div>
                       </div>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:bg-slate-50 cursor-pointer">
                       <span className="text-slate-700 font-medium">Mata Uang (IDR)</span>
                       <span className="text-slate-400 text-sm">Default</span>
                    </div>

                    <h3 className="font-semibold text-slate-400 uppercase text-xs tracking-wider pt-4">Zona Bahaya</h3>
                    <button onClick={() => logout()} className="w-full p-4 border border-red-200 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors text-left">
                       Keluar dari Aplikasi
                    </button>
                 </div>
              </div>
           )}

        </main>
      </div>

      {/* ========================================= */}
      {/* MOBILE SUPER APP VIEW                     */}
      {/* ========================================= */}
      <div className="md:hidden fixed inset-0 bg-slate-50 font-sans flex flex-col">
        
        {/* --- Header (Shared across tabs) --- */}
        <header className="flex-none bg-white px-5 pt-8 pb-4 z-20 shadow-sm relative pt-safe">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">Selamat Datang,</p>
              <h2 className="text-xl font-bold text-slate-800">
                {user.displayName ? user.displayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'User')}
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
                {/* Notification Bell (Mobile) */}
                <div className="relative">
                    <button 
                        onClick={() => {
                            setShowNotifDropdown(!showNotifDropdown);
                            setShowProfileMenu(false);
                        }}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 border border-slate-200 active:bg-slate-50 relative"
                    >
                        <BellRing size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                    {showNotifDropdown && (
                        <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                             <div className="p-3 border-b border-slate-50 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-xs">Notifikasi</h3>
                                {notifications.length > 0 && (
                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{notifications.length} Baru</span>
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-xs">Tidak ada notifikasi baru.</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-3 border-b border-slate-50 active:bg-slate-50 ${n.type === 'urgent' ? 'bg-red-50/50' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className={`mt-0.5 p-1 rounded-full h-fit ${n.type === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    <AlertCircle size={12} />
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold ${n.type === 'urgent' ? 'text-red-700' : 'text-slate-700'}`}>{n.title}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">{n.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Photo (Dropdown Toggle) */}
                <div className="relative">
                    <button 
                        onClick={() => {
                             setShowProfileMenu(!showProfileMenu);
                             setShowNotifDropdown(false);
                        }}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 active:scale-95 transition-transform"
                    >
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={20} className="text-slate-400" />
                        )}
                    </button>
                    
                    {/* Quick Profile Menu Dropdown */}
                    {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                             <div className="p-4 bg-slate-50 border-b border-slate-100">
                                 <p className="font-bold text-slate-800 text-sm truncate">{user.displayName || 'Pengguna'}</p>
                                 <p className="text-xs text-slate-500 truncate">{user.email}</p>
                             </div>
                             
                             <div className="p-2 space-y-1">
                                 <button 
                                     onClick={() => {
                                         setMobileTab('profile');
                                         setShowProfileMenu(false);
                                     }}
                                     className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-slate-700 text-sm transition-colors"
                                 >
                                     <Settings size={16} /> <span>Pengaturan Akun</span>
                                 </button>
                                 
                                 <button 
                                     onClick={() => setIsNotifEnabled(!isNotifEnabled)}
                                     className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-lg text-slate-700 text-sm transition-colors"
                                 >
                                     <div className="flex items-center gap-3">
                                         <Bell size={16} /> <span>Notifikasi</span>
                                     </div>
                                     {isNotifEnabled ? (
                                         <ToggleRight size={24} className="text-green-500" />
                                     ) : (
                                         <ToggleLeft size={24} className="text-slate-400" />
                                     )}
                                 </button>
                                 
                                 <div className="h-px bg-slate-100 my-1"></div>
                                 
                                 <button 
                                     onClick={() => logout()}
                                     className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg text-red-600 text-sm transition-colors"
                                 >
                                     <LogOut size={16} /> <span>Keluar</span>
                                 </button>
                             </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </header>

        {/* --- SCROLLABLE CONTENT AREA --- */}
        <main 
          className="flex-1 overflow-y-auto overscroll-none scrollbar-hide bg-slate-50 pb-24"
          onTouchStart={(e) => {
            // Only trigger swipe on savings tab, prevent triggering menu drag logic here
            if (mobileTab === 'savings' && !isDraggingMenu) onTouchStart(e);
          }}
          onTouchMove={mobileTab === 'savings' && !isDraggingMenu ? onTouchMove : undefined}
          onTouchEnd={(e) => {
            if (mobileTab === 'savings') onTouchEnd(e);
            handleMenuTouchEnd(); // Always clear drag state on global touch end if finger lifts
          }}
          onScroll={() => {
            // Cancel drag if scrolling happens
            if (menuLongPressTimer.current) {
                clearTimeout(menuLongPressTimer.current);
                menuLongPressTimer.current = null;
            }
          }}
        >
          {/* --- HOME TAB CONTENT --- */}
          {mobileTab === 'home' && (
            <div className="px-5 space-y-6 pt-4">
              
              {/* Financial Summary Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <p className="text-blue-100 text-sm mb-1">Total Hutang Berjalan</p>
                  <h3 className="text-3xl font-bold mb-4">{formatIDR(totalDebt)}</h3>
                  
                  <div className="flex gap-4 border-t border-white/20 pt-4">
                    <div onClick={() => setMobileTab('savings')} className="cursor-pointer">
                      <p className="text-blue-100 text-xs">Tabungan Pelunasan</p>
                      <p className="font-semibold">{formatIDR(totalSavings)}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs">Cicilan Aktif</p>
                      <p className="font-semibold">{data.installments.filter(i => i.monthsPaid < i.totalMonths).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BILL REMINDER WIDGET (Mobile Super App Style) */}
              <div>
                  <div className="flex items-center gap-2 mb-2 text-slate-600">
                      <Bell size={16} />
                      <h3 className="text-xs font-bold uppercase tracking-wider">Pengingat Tagihan</h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {upcomingBills.length === 0 ? (
                          <div className="bg-white border border-slate-100 rounded-xl p-3 min-w-[200px] flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-full text-green-600"><CheckCircle2 size={16}/></div>
                            <p className="text-xs text-slate-500">Semua aman, tidak ada tagihan dekat.</p>
                          </div>
                      ) : (
                          upcomingBills.map(c => {
                              const isUrgent = c.daysLeft <= 3;
                              const isWarning = c.daysLeft <= 7;
                              return (
                                  <div key={c.id} className={`min-w-[220px] p-3 rounded-xl border flex flex-col justify-between ${
                                      isUrgent ? 'bg-red-50 border-red-100' : isWarning ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-100'
                                  }`}>
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="text-xs font-bold text-slate-800">{c.name}</div>
                                          <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                              isUrgent ? 'bg-red-100 text-red-600' : isWarning ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
                                          }`}>
                                              {c.daysLeft} Hari
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                          <Clock size={12} />
                                          <span>Jatuh Tempo: {c.nextDueDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                      </div>
                                      <div className="mt-1 pt-2 border-t border-slate-100/50 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-500">Sisa Tagihan</span>
                                        <span className="text-xs font-bold text-slate-800">{formatIDR(c.remainingBill)}</span>
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </div>

              {/* Quick Actions Grid (Reorderable) */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Menu Utama</h3>
                <div 
                  className="grid grid-cols-4 gap-4"
                  onTouchMove={handleMenuTouchMove}
                  style={{ touchAction: isDraggingMenu ? 'none' : 'auto' }} // Prevent scroll only when dragging
                >
                  {menuOrder.map((key, index) => {
                      const item = menuConfig[key];
                      if (!item) return null;
                      
                      const isDraggingThis = isDraggingMenu && draggedMenuIndex === index;

                      return (
                        <button 
                            key={key}
                            data-menu-index={index}
                            onTouchStart={(e) => handleMenuTouchStart(e, index)}
                            onClick={() => {
                                // Only trigger action if not dragging
                                if (!isDraggingMenu) item.action();
                            }}
                            className={`flex flex-col items-center gap-2 transition-all duration-200 relative ${isDraggingThis ? 'scale-110 z-20 opacity-90' : 'active:scale-95'}`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-shadow ${item.color} ${isDraggingThis ? 'shadow-lg ring-2 ring-offset-2 ring-blue-400' : ''}`}>
                                {item.icon}
                            </div>
                            <span className="text-xs text-slate-600 font-medium text-center whitespace-pre-line select-none pointer-events-none">
                                {item.label}
                            </span>
                            {/* Visual indicator for drag mode availability (optional) */}
                        </button>
                      );
                  })}
                </div>
              </div>

              {/* AI Advice Section (Dynamic) */}
              {loadingAi && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-pulse">
                  <div className="h-4 bg-purple-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-purple-200 rounded w-1/2"></div>
                </div>
              )}
              
              {aiAdvice && !loadingAi && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-purple-600">
                    <Sparkles size={16} />
                    <h4 className="font-semibold text-sm">Analisis AI</h4>
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-xs">{aiAdvice}</pre>
                  </div>
                </div>
              )}
              
              {!aiAdvice && (
                  <button onClick={handleGetAdvice} className="w-full py-3 bg-purple-50 text-purple-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      <Sparkles size={16} /> Minta Saran AI
                  </button>
              )}

              {/* Recent Transactions List */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-800">Transaksi Terakhir</h3>
                  <button onClick={() => setMobileTab('history')} className="text-blue-600 text-xs font-medium">Lihat Semua</button>
                </div>
                <div className="space-y-3">
                  {data.transactions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-slate-100 border-dashed">
                      Belum ada transaksi
                    </div>
                  ) : (
                    data.transactions.slice(0, 5).map(t => (
                      <div key={t.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                          }`}>
                            {t.type === TransactionType.EXPENSE ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{t.description}</p>
                            <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        <span className={`font-semibold text-sm ${
                          t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'
                        }`}>
                          {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default App;