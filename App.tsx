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
  ToggleRight,
  List,
  Grid
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
  const [installmentListModalOpen, setInstallmentListModalOpen] = useState(false);
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

  // Drag & Drop Mobile Menu States
  const [menuOrder, setMenuOrder] = useState<string[]>(['transaksi', 'cicilan', 'laporan', 'ai', 'kartu', 'tabungan', 'history', 'profile']);
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
  const [instTenure, setInstTenure] = useState(3);
  const [instCardId, setInstCardId] = useState('');
  const [instStartDate, setInstStartDate] = useState(new Date().toISOString().split('T')[0]);

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
      setData({ cards: [], transactions: [], installments: [], savings: [] });
    }
  }, [user]);

  // Set default card selection when cards are loaded
  useEffect(() => {
    if (data.cards.length > 0) {
      if (!txCardId) setTxCardId(data.cards[0].id);
      if (!savingCardId) setSavingCardId(data.cards[0].id);
      if (!instCardId) setInstCardId(data.cards[0].id);
    }
  }, [data.cards, txCardId, savingCardId, instCardId]);

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
    setInstTenure(3);
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
    if (!instName || !instTotal || !instCardId) return;

    const totalVal = getNumericValue(instTotal);
    if (totalVal === 0) return;

    const newInstallment: Installment = {
        id: generateId(),
        cardId: instCardId,
        name: instName,
        totalAmount: totalVal,
        monthlyAmount: Math.ceil(totalVal / instTenure), 
        totalMonths: instTenure,
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

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini? Data laporan akan disesuaikan.")) {
      const txToDelete = data.transactions.find(t => t.id === id);
      const updatedTransactions = data.transactions.filter(t => t.id !== id);
      
      let updatedInstallments = data.installments;

      if (txToDelete && txToDelete.isInstallment) {
          updatedInstallments = data.installments.filter(i => {
              const isMatch = (
                  i.cardId === txToDelete.cardId &&
                  i.totalAmount === txToDelete.amount &&
                  i.name === txToDelete.description &&
                  i.startDate === txToDelete.date
              );
              return !isMatch; 
          });
      }

      saveData({ 
          ...data, 
          transactions: updatedTransactions,
          installments: updatedInstallments
      });
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
    if (!txCardId || !txAmount || !txDesc) return;

    let updatedInstallments = [...data.installments];
    let updatedSavings = [...data.savings];
    let finalIsInstallment = txIsInstallment;
    const amountVal = getNumericValue(txAmount); 

    if (amountVal === 0) return;

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

     const installmentLoad = data.installments
       .filter(i => i.cardId === cardId)
       .reduce((sum, i) => {
          const startDate = new Date(i.startDate);
          const monthDiff = (year - startDate.getFullYear()) * 12 + (monthIndex - startDate.getMonth());
          
          if (monthDiff >= 0 && monthDiff < i.totalMonths) {
             return sum + i.monthlyAmount;
          }
          return sum;
       }, 0);

     return expenses + installmentLoad;
  };

  const handleGetAdvice = async () => {
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
         
         let targetMonth = currentMonth;
         let targetYear = currentYear;
         
         if (c.dueDay! < currentDay) {
            targetMonth++;
            if (targetMonth > 11) { targetMonth = 0; targetYear++; }
         }
         
         const dueDate = new Date(targetYear, targetMonth, c.dueDay!);
         const diffTime = dueDate.getTime() - today.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
      .filter(c => c.remainingBill > 1000) 
      .sort((a, b) => a.daysLeft - b.daysLeft);

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
                     <div className="flex gap-2">
                         <button onClick={() => setInstallmentListModalOpen(true)} className="text-sm bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 px-3 rounded-lg w-fit transition-colors">
                            Lihat Detail
                         </button>
                         <button onClick={openInstallmentModal} className="text-sm bg-white text-indigo-700 font-bold py-2 px-3 rounded-lg w-fit transition-colors">
                            + Baru
                         </button>
                     </div>
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
                   <button 
                     onClick={() => setCardModalOpen(true)}
                     className="border-2 border-dashed border-slate-300 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all"
                   >
                      <PlusCircle size={32} className="mb-2"/>
                      <span className="font-medium">Tambah Kartu Baru</span>
                   </button>

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

           {/* --- REPORT VIEW (DESKTOP) --- */}
           {mobileTab === 'report' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                     <h2 className="text-xl font-bold text-slate-700">Laporan Matriks Tagihan</h2>
                     <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-medium text-slate-700"
                     >
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                     </select>
                 </div>
                 
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                             <th className="p-4 border-b border-r font-bold sticky left-0 bg-slate-50">Bulan</th>
                             {data.cards.map(card => (
                                 <th key={card.id} className="p-4 border-b font-bold whitespace-nowrap min-w-[150px]">{card.name}</th>
                             ))}
                             <th className="p-4 border-b font-bold bg-slate-100">Total Bulanan</th>
                          </tr>
                       </thead>
                       <tbody className="text-sm">
                          {monthNames.map((month, idx) => {
                              const cardBills = data.cards.map(card => getMonthlyBill(card.id, idx, selectedYear));
                              const totalMonth = cardBills.reduce((a, b) => a + b, 0);
                              
                              // Highlight current month
                              const isCurrentMonth = idx === new Date().getMonth() && selectedYear === new Date().getFullYear();

                              return (
                                  <tr key={month} className={isCurrentMonth ? "bg-blue-50/50" : "hover:bg-slate-50 transition"}>
                                      <td className={`p-4 border-r font-medium text-slate-700 sticky left-0 ${isCurrentMonth ? "bg-blue-50" : "bg-white"}`}>{month}</td>
                                      {cardBills.map((bill, cardIdx) => (
                                          <td key={cardIdx} className="p-4 border-b text-slate-600">
                                              {bill > 0 ? formatIDR(bill) : '-'}
                                          </td>
                                      ))}
                                      <td className="p-4 border-b font-bold text-slate-800 bg-slate-50/50">
                                          {totalMonth > 0 ? formatIDR(totalMonth) : '-'}
                                      </td>
                                  </tr>
                              )
                          })}
                       </tbody>
                       <tfoot>
                           <tr className="bg-slate-100 font-bold text-slate-800">
                               <td className="p-4 border-r sticky left-0 bg-slate-100">TOTAL TAHUNAN</td>
                               {data.cards.map(card => {
                                   const totalYear = Array.from({length: 12}, (_, i) => getMonthlyBill(card.id, i, selectedYear)).reduce((a,b)=>a+b,0);
                                   return <td key={card.id} className="p-4">{formatIDR(totalYear)}</td>
                               })}
                               <td className="p-4 bg-slate-200">
                                   {formatIDR(data.cards.reduce((sum, card) => sum + Array.from({length: 12}, (_, i) => getMonthlyBill(card.id, i, selectedYear)).reduce((a,b)=>a+b,0), 0))}
                               </td>
                           </tr>
                       </tfoot>
                    </table>
                 </div>
              </div>
           )}

           {/* --- HISTORY VIEW (DESKTOP) --- */}
           {mobileTab === 'history' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">Semua Riwayat Transaksi</h2>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Filter Tanggal</button>
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Export PDF</button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">Tanggal</th>
                                <th className="p-4 font-semibold">Kartu</th>
                                <th className="p-4 font-semibold">Deskripsi</th>
                                <th className="p-4 font-semibold text-right">Nominal</th>
                                <th className="p-4 font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.transactions.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Belum ada transaksi.</td></tr>
                            ) : (
                                data.transactions.map(t => {
                                    const cardName = data.cards.find(c => c.id === t.cardId)?.name || 'Unknown Card';
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50 transition">
                                            <td className="p-4 text-slate-500 text-sm">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 text-slate-700 text-sm font-medium">{cardName}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-800 font-medium">{t.description}</span>
                                                    {t.isInstallment && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">CICILAN</span>}
                                                </div>
                                                <p className="text-xs text-slate-400">{t.category || (t.type === TransactionType.EXPENSE ? 'Pengeluaran' : 'Pembayaran')}</p>
                                            </td>
                                            <td className={`p-4 text-right font-bold ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                                                {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleEditClick(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
              </div>
           )}
        </main>
      </div>

      {/* ========================================= */}
      {/* MOBILE SUPER APP VIEW (Fixed Layout)      */}
      {/* ========================================= */}
      <div className="md:hidden flex flex-col h-screen bg-slate-50 overflow-hidden">
         {/* Fixed Header */}
         <div className="bg-white px-6 pt-safe pb-4 border-b border-slate-100 flex justify-between items-center z-20 shrink-0">
             <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">LimitWatch</p>
                <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px]">
                   Hi, {user.displayName?.split(' ')[0] || 'User'}
                </h1>
             </div>
             <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                   className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 relative"
                 >
                    <Bell size={20} />
                    {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                 </button>
                 
                 {/* Profile Dropdown Trigger */}
                 <div className="relative">
                     <button 
                       onClick={() => setShowProfileMenu(!showProfileMenu)}
                       className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm"
                     >
                        {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon className="m-2 text-slate-500"/>}
                     </button>
                     
                     {/* Mobile Profile Menu Dropdown */}
                     {showProfileMenu && (
                        <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                           <div className="p-3 bg-slate-50 border-b border-slate-100">
                              <p className="text-xs font-bold text-slate-800 truncate">{user.displayName || 'Pengguna'}</p>
                              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                           </div>
                           <div className="p-2">
                              <button onClick={() => {setMobileTab('profile'); setShowProfileMenu(false)}} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                 <Settings size={14} /> Pengaturan
                              </button>
                              <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
                                 <LogOut size={14} /> Keluar
                              </button>
                           </div>
                        </div>
                     )}
                 </div>
             </div>
         </div>

         {/* Scrollable Content Area */}
         <div 
           className="flex-1 overflow-y-auto overscroll-none" 
           onTouchStart={mobileTab === 'savings' ? onTouchStart : undefined}
           onTouchMove={mobileTab === 'savings' ? onTouchMove : undefined}
           onTouchEnd={mobileTab === 'savings' ? onTouchEnd : undefined}
         >
             <div className="p-6 pb-24 space-y-6">
                 
                 {/* MOBILE HOME TAB */}
                 {mobileTab === 'home' && (
                    <>
                       {/* Hero Card */}
                       <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 mb-6">
                           <p className="text-blue-100 text-sm font-medium mb-1">Total Hutang Berjalan</p>
                           <h2 className="text-3xl font-bold mb-4">{formatIDR(totalDebt)}</h2>
                           <div className="flex gap-3">
                              <div className="bg-white/10 rounded-xl p-3 flex-1 backdrop-blur-sm">
                                  <p className="text-xs text-blue-100 mb-1">Tabungan</p>
                                  <p className="font-bold">{formatIDR(totalSavings)}</p>
                              </div>
                              <div onClick={() => setInstallmentListModalOpen(true)} className="bg-white/10 rounded-xl p-3 flex-1 backdrop-blur-sm active:bg-white/20 transition cursor-pointer">
                                  <p className="text-xs text-blue-100 mb-1">Cicilan Aktif</p>
                                  <p className="font-bold">{data.installments.filter(i => i.monthsPaid < i.totalMonths).length} Item</p>
                              </div>
                           </div>
                       </div>

                       {/* Bill Reminder Widget (Mobile) */}
                       {upcomingBills.length > 0 && (
                          <div className="mb-6">
                             <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Clock size={16} className="text-orange-500"/> Tagihan Segera
                             </h3>
                             <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                                {upcomingBills.map(c => {
                                    const isUrgent = c.daysLeft <= 3;
                                    return (
                                       <div key={c.id} className={`snap-center shrink-0 w-40 p-3 rounded-xl border ${isUrgent ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'} shadow-sm`}>
                                          <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                                          <p className={`text-xs font-bold mt-1 ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>{c.daysLeft} Hari Lagi</p>
                                          <p className="text-[10px] text-slate-500 mt-2">Sisa: {formatIDR(c.remainingBill)}</p>
                                       </div>
                                    )
                                })}
                             </div>
                          </div>
                       )}

                       {/* Draggable Menu Grid */}
                       <div className="grid grid-cols-4 gap-4 mb-8">
                          {menuOrder.map((item) => {
                             let icon, label, action, color;
                             switch(item) {
                                case 'transaksi': 
                                   icon = <PlusCircle size={24}/>; label = "Catat"; action = openAddTransactionModal; color = "bg-blue-100 text-blue-600"; break;
                                case 'cicilan':
                                   icon = <Banknote size={24}/>; label = "Cicilan"; action = openInstallmentModal; color = "bg-purple-100 text-purple-600"; break;
                                case 'laporan':
                                   icon = <FileBarChart size={24}/>; label = "Laporan"; action = () => setMobileTab('report'); color = "bg-emerald-100 text-emerald-600"; break;
                                case 'ai':
                                   icon = <Sparkles size={24}/>; label = "Advisor"; action = handleGetAdvice; color = "bg-amber-100 text-amber-600"; break;
                                case 'kartu':
                                   icon = <CreditCard size={24}/>; label = "Kartu"; action = () => setMobileTab('cards'); color = "bg-indigo-100 text-indigo-600"; break;
                                case 'tabungan':
                                   icon = <PiggyBank size={24}/>; label = "Tabungan"; action = () => setMobileTab('savings'); color = "bg-green-100 text-green-600"; break;
                                case 'history':
                                   icon = <History size={24}/>; label = "Riwayat"; action = () => setMobileTab('history'); color = "bg-rose-100 text-rose-600"; break;
                                case 'profile':
                                   icon = <UserIcon size={24}/>; label = "Akun"; action = () => setMobileTab('profile'); color = "bg-slate-100 text-slate-600"; break;
                                default: return null;
                             }
                             
                             const isDragging = draggingItem === item;

                             return (
                                <div 
                                   key={item}
                                   data-menu-id={item}
                                   onTouchStart={(e) => onMenuTouchStart(e, item)}
                                   onTouchEnd={onMenuTouchEnd}
                                   onTouchMove={onMenuTouchMove}
                                   onClick={action}
                                   className={`flex flex-col items-center gap-2 transition-transform ${isDragging ? 'scale-110 opacity-80 z-50' : ''}`}
                                >
                                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${color} ${isDragging ? 'ring-2 ring-blue-500' : ''}`}>
                                      {icon}
                                   </div>
                                   <span className="text-xs font-medium text-slate-600">{label}</span>
                                </div>
                             );
                          })}
                       </div>

                       {/* Recent Transactions List */}
                       <div>
                          <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-slate-800">Transaksi Terakhir</h3>
                             <button onClick={() => setMobileTab('history')} className="text-blue-600 text-xs font-bold">Lihat Semua</button>
                          </div>
                          <div className="space-y-3">
                             {data.transactions.slice(0, 5).map(t => (
                                <div onClick={() => handleEditClick(t)} key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-95 transition-transform">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                          t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                                       }`}>
                                          {t.type === TransactionType.EXPENSE ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                                       </div>
                                       <div>
                                          <p className="font-bold text-sm text-slate-800 truncate w-32">{t.description}</p>
                                          <p className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className={`font-bold text-sm ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                                          {formatIDR(t.amount)}
                                       </p>
                                       {t.isInstallment && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Cicilan</span>}
                                    </div>
                                </div>
                             ))}
                             {data.transactions.length === 0 && <p className="text-center text-xs text-slate-400 py-4">Belum ada transaksi</p>}
                          </div>
                       </div>
                    </>
                 )}

                 {/* MOBILE REPORT TAB */}
                 {mobileTab === 'report' && (
                     <div className="space-y-4">
                         <div className="flex items-center justify-between mb-2">
                             <h2 className="text-lg font-bold text-slate-800">Laporan Bulanan</h2>
                             <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-white text-sm border border-slate-200 rounded-lg px-2 py-1"
                             >
                                {Array.from({length: 3}, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                             </select>
                         </div>

                         {/* Mobile Report Card List */}
                         {monthNames.map((month, idx) => {
                             const totalBill = data.cards.reduce((sum, c) => sum + getMonthlyBill(c.id, idx, selectedYear), 0);
                             const isCurrent = idx === new Date().getMonth() && selectedYear === new Date().getFullYear();

                             return (
                                 <div key={idx} className={`bg-white rounded-xl p-4 border ${isCurrent ? 'border-blue-200 shadow-md ring-1 ring-blue-100' : 'border-slate-100 shadow-sm'}`}>
                                     <div className="flex justify-between items-center mb-3">
                                         <h3 className={`font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>{month} {selectedYear}</h3>
                                         <span className="font-bold text-slate-800">{formatIDR(totalBill)}</span>
                                     </div>
                                     <div className="space-y-1">
                                         {data.cards.map(c => {
                                             const bill = getMonthlyBill(c.id, idx, selectedYear);
                                             if (bill === 0) return null;
                                             return (
                                                 <div key={c.id} className="flex justify-between text-xs text-slate-500">
                                                     <span>{c.name}</span>
                                                     <span>{formatIDR(bill)}</span>
                                                 </div>
                                             )
                                         })}
                                     </div>
                                 </div>
                             )
                         })}
                     </div>
                 )}
                 
                 {/* MOBILE OTHER TABS (Simple Reuse Logic) */}
                 {mobileTab === 'cards' && (
                     <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <h2 className="font-bold text-lg text-slate-800">Daftar Kartu</h2>
                            <button onClick={() => setCardModalOpen(true)} className="text-blue-600 text-sm font-bold">+ Tambah</button>
                         </div>
                         {data.cards.map(card => (
                            <div key={card.id} className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden h-40 flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-20 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                                <div className="z-10 flex justify-between">
                                    <span className="text-xs tracking-wider opacity-70">CREDIT CARD</span>
                                    <CreditCard size={20} />
                                </div>
                                <div className="z-10">
                                    <h3 className="text-lg font-bold tracking-widest">{card.name}</h3>
                                    <p className="text-xs opacity-70">Limit: {formatIDR(card.limit)}</p>
                                </div>
                                <div className="z-10 text-right">
                                    <p className="text-[10px] opacity-70">Jatuh Tempo: Tgl {card.dueDay || '-'}</p>
                                </div>
                            </div>
                         ))}
                     </div>
                 )}

                 {mobileTab === 'savings' && (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-lg text-slate-800">Tabungan</h2>
                            <button onClick={openAddSavingModal} className="text-green-600 text-sm font-bold">+ Tambah</button>
                        </div>
                        {data.cards.map(card => {
                            const monthGroups = getSavingsByMonth(card.id);
                            return (
                                <div key={card.id} className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pl-1">{card.name}</h3>
                                    {monthGroups.length === 0 ? <p className="text-xs text-slate-400 italic pl-1">Belum ada tabungan.</p> : 
                                        monthGroups.map(group => (
                                            <div key={group.key} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-700">{group.label}</span>
                                                    <span className="text-sm font-bold text-green-700">{formatIDR(group.total)}</span>
                                                </div>
                                                <div className="p-2 flex gap-2 justify-end bg-white border-b border-slate-50">
                                                    <button onClick={() => openWithdrawModal(group.items)} className="px-3 py-1 bg-orange-50 text-orange-600 rounded text-xs font-bold">Ambil</button>
                                                    <button onClick={() => handleOpenBatchPay(group.items, group.label, group.total)} className="px-3 py-1 bg-green-50 text-green-600 rounded text-xs font-bold">Bayar</button>
                                                </div>
                                                <div className="divide-y divide-slate-50">
                                                    {group.items.map(s => (
                                                        <div key={s.id} onClick={() => handleEditSaving(s)} className="p-3 flex justify-between items-center active:bg-slate-50">
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-700">{s.note}</p>
                                                                <p className="text-[10px] text-slate-400">{new Date(s.date).toLocaleDateString()}</p>
                                                            </div>
                                                            <span className="text-xs font-semibold">{formatIDR(s.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )
                        })}
                     </div>
                 )}

                 {mobileTab === 'history' && (
                     <div className="space-y-4">
                         <h2 className="font-bold text-lg text-slate-800">Semua Riwayat</h2>
                         <div className="space-y-3">
                             {data.transactions.map(t => (
                                <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                                            <p className="font-bold text-sm text-slate-800">{t.description}</p>
                                            <p className="text-[10px] text-slate-500">{data.cards.find(c=>c.id === t.cardId)?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-sm ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                                                {formatIDR(t.amount)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-slate-50">
                                        <button onClick={() => handleEditClick(t)} className="text-blue-500 text-xs font-medium flex items-center gap-1"><Pencil size={12}/> Edit</button>
                                        <button onClick={() => handleDeleteClick(t.id)} className="text-red-500 text-xs font-medium flex items-center gap-1"><Trash2 size={12}/> Hapus</button>
                                    </div>
                                </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {mobileTab === 'profile' && (
                     <div className="space-y-4 text-center py-8">
                         <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto overflow-hidden">
                             {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon className="w-full h-full p-4 text-slate-400"/>}
                         </div>
                         <h2 className="font-bold text-xl text-slate-800">{user.displayName}</h2>
                         <p className="text-slate-500 text-sm">{user.email}</p>
                         <button onClick={logout} className="mt-8 px-6 py-2 bg-red-50 text-red-600 rounded-full font-bold text-sm">Keluar Aplikasi</button>
                     </div>
                 )}

             </div>
         </div>

         {/* Fixed Bottom Navigation (Mobile) */}
         <div className="bg-white border-t border-slate-200 pb-safe pt-2 px-6 flex justify-between items-center shrink-0 z-30">
            <button onClick={() => setMobileTab('home')} className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
                <Home size={22} strokeWidth={mobileTab === 'home' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Beranda</span>
            </button>
            <button onClick={() => setMobileTab('cards')} className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'cards' ? 'text-blue-600' : 'text-slate-400'}`}>
                <CreditCard size={22} strokeWidth={mobileTab === 'cards' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Kartu</span>
            </button>
            <button onClick={() => setMobileTab('savings')} className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'savings' ? 'text-blue-600' : 'text-slate-400'}`}>
                <PiggyBank size={22} strokeWidth={mobileTab === 'savings' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Tabungan</span>
            </button>
            <button onClick={() => setMobileTab('profile')} className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}>
                <UserIcon size={22} strokeWidth={mobileTab === 'profile' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Akun</span>
            </button>
         </div>

      </div>

      {/* ========================================= */}
      {/* MODALS & OVERLAYS                         */}
      {/* ========================================= */}

      {/* TOAST NOTIFICATION */}
      {showToast && toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm animate-in fade-in slide-in-from-top-4">
              <div className={`p-4 rounded-xl shadow-xl flex gap-3 ${toastMessage.type === 'urgent' ? 'bg-red-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                  <AlertCircle size={20} className={toastMessage.type === 'urgent' ? 'text-white' : 'text-orange-500'} />
                  <div>
                      <h4 className="font-bold text-sm">{toastMessage.title}</h4>
                      <p className="text-xs opacity-90 mt-0.5">{toastMessage.message}</p>
                  </div>
                  <button onClick={() => setShowToast(false)} className="ml-auto opacity-70 hover:opacity-100"><X size={16}/></button>
              </div>
          </div>
      )}

      {/* TRANSACTION MODAL */}
      {transactionModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">{editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi'}</h2>
              <button onClick={() => setTransactionModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Type Toggle */}
              <div className="bg-slate-100 p-1 rounded-xl flex">
                 <button 
                   type="button" 
                   onClick={() => { setTxType(TransactionType.EXPENSE); setPayFromSavings(false); }}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${txType === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                 >
                    Pengeluaran
                 </button>
                 <button 
                   type="button" 
                   onClick={() => { setTxType(TransactionType.PAYMENT); setTxIsInstallment(false); }}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${txType === TransactionType.PAYMENT ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
                 >
                    Pembayaran
                 </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pilih Kartu</label>
                <select 
                  value={txCardId} 
                  onChange={(e) => setTxCardId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {data.cards.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nominal (Rp)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  required 
                  value={txAmount}
                  onChange={(e) => handleCurrencyInput(e.target.value, setTxAmount)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Keterangan</label>
                <input 
                  type="text" 
                  required 
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Makan Siang, Bayar Tagihan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tanggal</label>
                <input 
                  type="date" 
                  required 
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Special Options: Installment Conversion */}
              {txType === TransactionType.EXPENSE && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                     <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-bold text-indigo-700 cursor-pointer">
                           <input type="checkbox" checked={txIsInstallment} onChange={(e) => setTxIsInstallment(e.target.checked)} className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"/>
                           Jadikan Cicilan
                        </label>
                        {txIsInstallment && <span className="text-xs text-indigo-500 font-medium">Estimasi</span>}
                     </div>
                     {txIsInstallment && (
                         <div className="mt-3 animate-in fade-in">
                             <select 
                                value={txInstallmentMonths}
                                onChange={(e) => setTxInstallmentMonths(parseInt(e.target.value))}
                                className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-medium text-indigo-800 mb-2"
                             >
                                <option value={3}>3 Bulan</option>
                                <option value={6}>6 Bulan</option>
                                <option value={12}>12 Bulan</option>
                                <option value={18}>18 Bulan</option>
                                <option value={24}>24 Bulan</option>
                             </select>
                             <div className="flex justify-between text-xs text-indigo-600 font-bold px-1">
                                <span>Per bulan:</span>
                                <span>{formatIDR(getNumericValue(txAmount) / txInstallmentMonths)}</span>
                             </div>
                         </div>
                     )}
                  </div>
              )}

              {/* Special Options: Pay from Savings */}
              {txType === TransactionType.PAYMENT && !editingTransaction && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <label className="flex items-center gap-2 text-sm font-bold text-green-700 cursor-pointer">
                           <input type="checkbox" checked={payFromSavings} onChange={(e) => setPayFromSavings(e.target.checked)} className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-500"/>
                           Ambil dari Tabungan
                      </label>
                      <p className="text-xs text-green-600 mt-1 pl-6 leading-tight">
                         Saldo tabungan akan otomatis dikurangi.
                      </p>
                  </div>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 mt-2 transition-transform active:scale-95">
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INSTALLMENT MANUAL MODAL */}
      {installmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Catat Cicilan Manual</h2>
              <button onClick={() => setInstallmentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveInstallmentManual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pilih Kartu</label>
                <select 
                  value={instCardId} 
                  onChange={(e) => setInstCardId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium outline-none"
                >
                  {data.cards.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Barang/Cicilan</label>
                <input 
                  type="text" 
                  required 
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none"
                  placeholder="Contoh: iPhone 15"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Total Harga (Rp)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  required 
                  value={instTotal}
                  onChange={(e) => handleCurrencyInput(e.target.value, setInstTotal)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tenor</label>
                    <select 
                        value={instTenure}
                        onChange={(e) => setInstTenure(parseInt(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none"
                    >
                        <option value={3}>3 Bulan</option>
                        <option value={6}>6 Bulan</option>
                        <option value={12}>12 Bulan</option>
                        <option value={18}>18 Bulan</option>
                        <option value={24}>24 Bulan</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Mulai Tanggal</label>
                    <input 
                      type="date" 
                      required 
                      value={instStartDate}
                      onChange={(e) => setInstStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none"
                    />
                 </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                  <span className="text-xs text-indigo-600 font-bold">Estimasi Cicilan/Bulan</span>
                  <span className="text-lg font-bold text-indigo-700">
                      {formatIDR(getNumericValue(instTotal) / instTenure)}
                  </span>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold mt-2">
                Simpan Cicilan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CARD MODAL */}
      {cardModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Tambah Kartu</h2>
            <form onSubmit={handleSaveCard} className="space-y-4">
              <input 
                type="text" 
                required 
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                placeholder="Nama Kartu (e.g. BCA Visa)"
              />
              <input 
                type="text" 
                inputMode="numeric"
                required 
                value={cardLimit}
                onChange={(e) => handleCurrencyInput(e.target.value, setCardLimit)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                placeholder="Limit Kredit (Rp)"
              />
              <input 
                type="number" 
                min="1" max="31"
                value={cardDue}
                onChange={(e) => setCardDue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                placeholder="Tanggal Jatuh Tempo (1-31)"
              />
              <div className="flex gap-3 pt-2">
                 <button type="button" onClick={() => setCardModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl">Batal</button>
                 <button type="submit" className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAVING MODAL */}
      {savingModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-green-800">{editingSaving ? 'Edit Tabungan' : 'Tambah Tabungan'}</h2>
                <button onClick={() => setSavingModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleSaveSaving} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Untuk Kartu</label>
                 <select 
                   value={savingCardId} 
                   onChange={(e) => setSavingCardId(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                 >
                   {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Target Tagihan Bulan</label>
                 <div className="flex gap-3">
                    <select 
                       value={savingTargetMonth} 
                       onChange={(e) => setSavingTargetMonth(parseInt(e.target.value))}
                       className="flex-[2] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                    >
                       {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select 
                       value={savingTargetYear} 
                       onChange={(e) => setSavingTargetYear(parseInt(e.target.value))}
                       className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                    >
                       {Array.from({length: 3}, (_, i) => new Date().getFullYear() + i).map(y => (
                          <option key={y} value={y}>{y}</option>
                       ))}
                    </select>
                 </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nominal (Rp)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    required 
                    value={savingAmount}
                    onChange={(e) => handleCurrencyInput(e.target.value, setSavingAmount)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-green-700 outline-none"
                  />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Catatan</label>
                  <input 
                    type="text" 
                    value={savingNote}
                    onChange={(e) => setSavingNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                    placeholder="Contoh: Sisihan Gaji"
                  />
               </div>

               <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 mt-2">
                 Simpan
               </button>
             </form>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {withdrawModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                 <h2 className="text-xl font-bold text-slate-800 mb-2">Ambil Tabungan</h2>
                 <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 mb-4">
                     <p className="text-xs text-orange-600 font-bold uppercase">Saldo Tersedia</p>
                     <p className="text-lg font-bold text-orange-700">
                        {formatIDR(activeSavingsGroup.reduce((sum, s) => sum + s.amount, 0))}
                     </p>
                 </div>
                 <form onSubmit={handleConfirmWithdraw} className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nominal Penarikan</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          required 
                          value={withdrawAmount}
                          onChange={(e) => handleCurrencyInput(e.target.value, setWithdrawAmount)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
                          autoFocus
                        />
                     </div>
                     <div className="flex gap-3">
                        <button type="button" onClick={() => setWithdrawModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Batal</button>
                        <button type="submit" className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-200">Ambil</button>
                     </div>
                 </form>
             </div>
          </div>
      )}

      {/* BATCH PAY CONFIRMATION MODAL */}
      {batchPayModalOpen && activeBatchGroup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                 <h2 className="text-xl font-bold text-slate-800 mb-1">Konfirmasi Bayar</h2>
                 <p className="text-slate-500 text-sm mb-4">Gunakan tabungan untuk membayar tagihan.</p>

                 <div className="space-y-3 mb-6">
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">Total Tabungan</span>
                         <span className="font-bold text-green-600">{formatIDR(activeBatchGroup.total)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">Estimasi Tagihan</span>
                         <span className="font-bold text-slate-800">
                             {formatIDR(getMonthlyBill(activeBatchGroup.items[0].cardId, activeBatchGroup.month, activeBatchGroup.year))}
                         </span>
                     </div>
                     <div className="h-px bg-slate-100"></div>
                     <div className="flex justify-between text-sm font-bold">
                         <span className="text-slate-700">Sisa Tagihan Nanti</span>
                         <span className="text-red-500">
                             {formatIDR(Math.max(0, getMonthlyBill(activeBatchGroup.items[0].cardId, activeBatchGroup.month, activeBatchGroup.year) - activeBatchGroup.total))}
                         </span>
                     </div>
                 </div>

                 <div className="flex gap-3">
                    <button onClick={() => setBatchPayModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Batal</button>
                    <button onClick={handleConfirmBatchPay} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200">Bayar Sekarang</button>
                 </div>
             </div>
          </div>
      )}

      {/* INSTALLMENT LIST MODAL (View/Delete Active Installments) */}
      {installmentListModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-slate-800">Daftar Cicilan Aktif</h2>
                      <button onClick={() => setInstallmentListModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                      {data.installments.length === 0 ? (
                          <div className="text-center py-10 text-slate-400">Tidak ada cicilan aktif.</div>
                      ) : (
                          data.installments.map(inst => {
                              const isActive = inst.monthsPaid < inst.totalMonths; // Simple check logic, usually controlled by date in real app
                              return (
                                  <div key={inst.id} className="border border-slate-100 rounded-xl p-4 flex justify-between items-center hover:bg-slate-50 transition">
                                      <div>
                                          <p className="font-bold text-slate-800">{inst.name}</p>
                                          <p className="text-xs text-slate-500">
                                              {data.cards.find(c => c.id === inst.cardId)?.name} • {formatIDR(inst.monthlyAmount)}/bln
                                          </p>
                                          <p className="text-[10px] text-slate-400 mt-1">
                                              Total: {formatIDR(inst.totalAmount)} • {inst.totalMonths} Bulan
                                          </p>
                                      </div>
                                      <button 
                                        onClick={() => handleDeleteInstallmentDirectly(inst.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                        title="Hapus Paksa Data Cicilan"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              )
                          })
                      )}
                  </div>
              </div>
          </div>
      )}

    </>
  );
};

export default App;