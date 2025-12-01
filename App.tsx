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
  Columns
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
  
  // Profile Menu State (Mobile & Desktop)
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'savings' | 'history' | 'report' | 'profile'>('home');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);

  // Swipe Gesture States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  const maxVerticalDistance = 30; // Maximum allowed vertical scroll during swipe
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Drag & Drop Mobile Menu States
  const [menuOrder, setMenuOrder] = useState<string[]>(['transaksi', 'cicilan', 'laporan', 'kartu', 'tabungan', 'history', 'profile']);
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
      setData({ cards: [], transactions: [], installments: [], savings: [] });
    }
  }, [user]);

  // Set default card selection when cards are loaded
  useEffect(() => {
    if (data.cards.length > 0) {
      if (!txCardId) setTxCardId(data.cards[0].id);
      if (!savingCardId) setSavingCardId(data.cards[0].id);
      if (!instCardId) setInstCardId(data.cards[0].id);
      if (!reportCardId) setReportCardId(data.cards[0].id);
    }
  }, [data.cards, txCardId, savingCardId, instCardId, reportCardId]);

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
    if (!txCardId || !txAmount) return; // Removed !txDesc check

    let updatedInstallments = [...data.installments];
    let updatedSavings = [...data.savings];
    let finalIsInstallment = txIsInstallment;
    const amountVal = getNumericValue(txAmount); 

    if (amountVal === 0) return;

    // Default description if empty
    const finalDesc = txDesc || (txType === TransactionType.EXPENSE ? 'Pengeluaran' : 'Pembayaran');

    if (txIsInstallment && txType === TransactionType.EXPENSE) {
       // Validasi Tenor Manual
       if (txInstallmentMonths <= 0) {
           alert("Lama cicilan minimal 1 bulan");
           return;
       }

       if (!editingTransaction || (editingTransaction && !editingTransaction.isInstallment)) {
          const newInstallment: Installment = {
              id: generateId(),
              cardId: txCardId,
              name: finalDesc,
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
      // Check if this transaction was an installment and if we need to update the installment record too
      if (editingTransaction.isInstallment) {
          updatedInstallments = updatedInstallments.map(inst => {
              // Try to find the matching installment (by old values)
              const isMatch = (
                  inst.cardId === editingTransaction.cardId &&
                  inst.totalAmount === editingTransaction.amount &&
                  inst.name === editingTransaction.description &&
                  inst.startDate === editingTransaction.date
              );
              
              if (isMatch) {
                  return { 
                      ...inst, 
                      cardId: txCardId, // Update Card ID
                      name: finalDesc, // Update Name
                      startDate: new Date(txDate).toISOString(), // Update Date
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
        description: finalDesc,
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

  // Improved calculation logic for report
  const getMonthlyReportData = (cardId: string, monthIndex: number, year: number) => {
    // 1. Expenses
    const monthlyExpenses = data.transactions.filter(t => {
        const d = new Date(t.date);
        return t.cardId === cardId &&
               t.type === TransactionType.EXPENSE &&
               !t.isInstallment && // Don't double count if it was converted
               d.getMonth() === monthIndex &&
               d.getFullYear() === year;
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
         
         let targetMonth = currentMonth;
         let targetYear = currentYear;
         
         if (c.dueDay! < currentDay) {
            targetMonth++;
            if (targetMonth > 11) { targetMonth = 0; targetYear++; }
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

  // Filter Logic for History View
  const filteredTransactions = data.transactions.filter(t => {
      const d = new Date(t.date);
      const matchCard = historyFilterCard === 'all' || t.cardId === historyFilterCard;
      const matchMonth = d.getMonth() === historyFilterMonth;
      const matchYear = d.getFullYear() === historyFilterYear;
      return matchCard && matchMonth && matchYear;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
              <DesktopNavItem icon={<History size={20}/>} label="Riwayat Transaksi" active={mobileTab === 'history'} onClick={() => setMobileTab('history')} />
              <DesktopNavItem icon={<Coins size={20}/>} label="Tabungan Pelunasan" active={mobileTab === 'savings'} onClick={() => setMobileTab('savings')} />
              <DesktopNavItem icon={<FileBarChart size={20}/>} label="Laporan Tahunan" active={mobileTab === 'report'} onClick={() => setMobileTab('report')} />
              
              {/* Account Menu Removed from Sidebar as requested */}
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
                              <button onClick={() => {setMobileTab('profile'); setShowProfileMenu(false)}} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                 <Settings size={16} /> Pengaturan Akun
                              </button>
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
               {/* Stats Grid - Now 3 Columns */}
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

               {/* Bill Reminder Widget (Desktop) - New Horizontal Section */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                      <Bell size={20} className="text-orange-500"/>
                      <h3 className="font-bold text-slate-800">Pengingat Tagihan Kartu</h3>
                  </div>
                  
                  {upcomingBills.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6 italic">Semua tagihan sudah lunas atau belum ada tagihan yang dekat jatuh tempo.</p>
                  ) : (
                      <div className="flex gap-4 overflow-x-auto pb-2">
                          {upcomingBills.map(c => {
                              const isUrgent = c.daysLeft <= 3;
                              const isWarning = c.daysLeft <= 7;
                              const isCovered = c.shortfall <= 0;

                              return (
                                  <div key={c.id} className={`flex-shrink-0 w-64 p-4 rounded-xl border ${isUrgent ? 'bg-red-50 border-red-100' : isWarning ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                                      <div className="flex justify-between font-bold mb-2">
                                          <span className="truncate flex-1 pr-2">{c.name}</span>
                                          <span className={`whitespace-nowrap ${isUrgent ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-slate-600'}`}>
                                              {c.daysLeft} Hari
                                          </span>
                                      </div>
                                      <div className="space-y-1.5 text-xs">
                                          <div className="flex justify-between items-center text-slate-500">
                                             <span>Jatuh Tempo:</span>
                                             <span>{c.nextDueDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                          </div>
                                          <div className="flex justify-between items-center font-medium text-slate-800">
                                             <span>Total Tagihan:</span>
                                             <span>{formatIDR(c.remainingBill)}</span>
                                          </div>
                                          <div className="flex justify-between items-center text-slate-500">
                                             <span>Tabungan:</span>
                                             <span>{formatIDR(c.availableSavings)}</span>
                                          </div>
                                          <div className={`flex justify-between items-center border-t border-slate-200/50 pt-2 font-bold ${isCovered ? 'text-green-600' : 'text-red-600'}`}>
                                             <span>Kekurangan:</span>
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

           {/* --- CARDS VIEW --- */}
           {mobileTab === 'cards' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-slate-700">Daftar Kartu Kredit</h2>
                   <button onClick={openAddCardModal} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <PlusCircle size={16} /> Tambah Kartu
                   </button>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                   <button 
                     onClick={openAddCardModal}
                     className="border-2 border-dashed border-slate-300 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all"
                   >
                      <PlusCircle size={32} className="mb-2"/>
                      <span className="font-medium">Tambah Kartu Baru</span>
                   </button>

                   {data.cards.map(card => (
                      <div key={card.id} className={`${card.color || 'bg-slate-800'} text-white p-6 rounded-2xl shadow-xl relative overflow-hidden h-48 flex flex-col justify-between group transition-transform hover:-translate-y-1`}>
                         <div className="absolute top-0 right-0 p-24 bg-white opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                         
                         <div className="flex justify-between items-start z-10">
                            <span className="font-medium tracking-wider text-slate-300 uppercase text-xs">Credit Card</span>
                            <div className="flex gap-2">
                               <button onClick={() => handleEditCard(card)} className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white transition"><Pencil size={14} /></button>
                               <button onClick={() => handleDeleteCard(card.id)} className="p-1 hover:bg-red-500/50 rounded text-slate-300 hover:text-red-200 transition"><Trash2 size={14} /></button>
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
                     <div>
                        <h2 className="text-xl font-bold text-slate-700">Laporan Tahunan</h2>
                        <p className="text-slate-500 text-sm">Lihat detail tagihan, cicilan, dan pembayaran bulanan.</p>
                     </div>
                     <div className="flex gap-3">
                        {/* Toggle View Mode */}
                        <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                            <button 
                                onClick={() => setReportViewMode('detail')}
                                className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${reportViewMode === 'detail' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                <List size={16}/> Detail
                            </button>
                            <button 
                                onClick={() => setReportViewMode('matrix')}
                                className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${reportViewMode === 'matrix' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                <Grid size={16}/> Matriks
                            </button>
                        </div>
                        
                        {/* Filters */}
                        {reportViewMode === 'detail' && (
                            <div className="relative">
                                <select 
                                    value={reportCardId} 
                                    onChange={(e) => setReportCardId(e.target.value)}
                                    className="appearance-none bg-white border border-slate-300 rounded-lg pl-4 pr-10 py-2 font-medium text-slate-700 w-48"
                                >
                                    {data.cards.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                            </div>
                        )}
                        <div className="relative">
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-slate-300 rounded-lg pl-4 pr-10 py-2 font-medium text-slate-700 w-28"
                            >
                                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                        </div>
                     </div>
                 </div>
                 
                 {/* DETAILED VIEW (Per Card) */}
                 {reportViewMode === 'detail' && (
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                                 <th className="p-4 border-b w-32 font-bold">Bulan</th>
                                 <th className="p-4 border-b font-bold">Rincian Transaksi</th>
                                 <th className="p-4 border-b w-40 font-bold text-right">Total Tagihan</th>
                                 <th className="p-4 border-b w-40 font-bold text-right">Dibayar</th>
                                 <th className="p-4 border-b w-40 font-bold text-right bg-slate-100">Sisa Tagihan</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {monthNames.map((month, idx) => {
                                  const reportData = getMonthlyReportData(reportCardId, idx, selectedYear);
                                  const isCurrentMonth = idx === new Date().getMonth() && selectedYear === new Date().getFullYear();
                                  
                                  const isEmpty = reportData.expenses.length === 0 && reportData.installments.length === 0 && reportData.totalBill === 0;

                                  return (
                                      <tr key={month} className={`hover:bg-slate-50/50 transition ${isCurrentMonth ? 'bg-blue-50/30' : ''}`}>
                                          <td className={`p-4 font-bold text-slate-700 align-top ${isCurrentMonth ? 'text-blue-600' : ''}`}>
                                              {month}
                                          </td>
                                          <td className="p-4 align-top">
                                              {isEmpty ? (
                                                  <span className="text-slate-400 text-xs italic">- Tidak ada transaksi -</span>
                                              ) : (
                                                  <div className="space-y-1">
                                                      {reportData.expenses.map(exp => (
                                                          <div key={exp.id} className="text-xs text-slate-600 flex justify-between gap-4">
                                                              <span>{exp.description}</span>
                                                              <span className="font-medium">{formatIDR(exp.amount)}</span>
                                                          </div>
                                                      ))}
                                                      {reportData.installments.map(inst => (
                                                          <div key={inst.id} className="text-xs text-slate-600 flex justify-between gap-4">
                                                              <span>
                                                                  {inst.name} 
                                                                  <span className="text-indigo-500 text-[10px] ml-1 font-bold bg-indigo-50 px-1 rounded">
                                                                      ({inst.currentMonthIndex}/{inst.totalMonths})
                                                                  </span>
                                                              </span>
                                                              <span className="font-medium">{formatIDR(inst.monthlyAmount)}</span>
                                                          </div>
                                                      ))}
                                                  </div>
                                              )}
                                          </td>
                                          <td className="p-4 text-right align-top font-bold text-slate-800">
                                              {reportData.totalBill > 0 ? formatIDR(reportData.totalBill) : '-'}
                                          </td>
                                          <td className="p-4 text-right align-top font-bold text-green-600">
                                              {reportData.totalPaid > 0 ? formatIDR(reportData.totalPaid) : '-'}
                                          </td>
                                          <td className={`p-4 text-right align-top font-bold border-l border-slate-50 ${isCurrentMonth ? 'bg-blue-50/50' : 'bg-slate-50/50'} ${reportData.remaining <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                              {formatIDR(Math.max(0, reportData.remaining))}
                                          </td>
                                      </tr>
                                  )
                              })}
                           </tbody>
                           <tfoot>
                               <tr className="bg-slate-100 font-bold text-slate-800 border-t border-slate-200">
                                   <td colSpan={2} className="p-4 text-right">TOTAL TAHUNAN</td>
                                   <td className="p-4 text-right">
                                       {formatIDR(Array.from({length:12},(_,i)=>getMonthlyReportData(reportCardId,i,selectedYear).totalBill).reduce((a,b)=>a+b,0))}
                                   </td>
                                   <td className="p-4 text-right text-green-700">
                                       {formatIDR(Array.from({length:12},(_,i)=>getMonthlyReportData(reportCardId,i,selectedYear).totalPaid).reduce((a,b)=>a+b,0))}
                                   </td>
                                   <td className="p-4 text-right text-red-700 bg-slate-200">
                                       {formatIDR(Array.from({length:12},(_,i)=>Math.max(0, getMonthlyReportData(reportCardId,i,selectedYear).remaining)).reduce((a,b)=>a+b,0))}
                                   </td>
                               </tr>
                           </tfoot>
                        </table>
                     </div>
                 )}

                 {/* MATRIX VIEW (All Cards Summary) */}
                 {reportViewMode === 'matrix' && (
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                                    <th className="p-4 border-b font-bold sticky left-0 bg-slate-50 z-10 w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Bulan</th>
                                    {data.cards.map(c => (
                                        <th key={c.id} className="p-4 border-b font-bold text-right min-w-[140px] whitespace-nowrap">{c.name}</th>
                                    ))}
                                    <th className="p-4 border-b font-bold text-right bg-slate-100 min-w-[140px]">Total Bulan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {monthNames.map((month, idx) => {
                                    const bills = data.cards.map(c => getMonthlyBill(c.id, idx, selectedYear));
                                    const totalMonth = bills.reduce((a, b) => a + b, 0);
                                    const isCurrent = idx === new Date().getMonth() && selectedYear === new Date().getFullYear();

                                    return (
                                        <tr key={month} className={`hover:bg-slate-50/50 ${isCurrent ? 'bg-blue-50/20' : ''}`}>
                                            <td className={`p-4 font-bold sticky left-0 z-10 w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${isCurrent ? 'bg-blue-50/80 text-blue-600' : 'bg-white text-slate-700'}`}>
                                                {month}
                                            </td>
                                            {bills.map((bill, i) => (
                                                <td key={i} className="p-4 text-right text-sm text-slate-600 border-l border-slate-50">
                                                    {bill > 0 ? formatIDR(bill) : '-'}
                                                </td>
                                            ))}
                                            <td className="p-4 text-right font-bold text-slate-800 bg-slate-50 border-l border-slate-100">
                                                {totalMonth > 0 ? formatIDR(totalMonth) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-100 font-bold text-slate-800 border-t border-slate-200">
                                    <td className="p-4 sticky left-0 bg-slate-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">TOTAL</td>
                                    {data.cards.map(c => {
                                        const totalYear = Array.from({length:12},(_,i)=>getMonthlyBill(c.id,i,selectedYear)).reduce((a,b)=>a+b,0);
                                        return <td key={c.id} className="p-4 text-right">{formatIDR(totalYear)}</td>
                                    })}
                                    <td className="p-4 text-right text-blue-700">
                                        {formatIDR(
                                            data.cards.reduce((sum, c) => sum + Array.from({length:12},(_,i)=>getMonthlyBill(c.id,i,selectedYear)).reduce((a,b)=>a+b,0), 0)
                                        )}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                     </div>
                 )}
              </div>
           )}

           {/* --- HISTORY VIEW (DESKTOP) --- */}
           {/* ... (Existing History View) ... */}
           {/* Note: I'm not repeating the History View block to save space, assuming no changes there from previous steps unless needed */}
           {mobileTab === 'history' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">Semua Riwayat Transaksi</h2>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <select 
                            value={historyFilterCard}
                            onChange={(e) => setHistoryFilterCard(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 outline-none font-medium"
                        >
                            <option value="all">Semua Kartu</option>
                            {data.cards.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <select 
                            value={historyFilterMonth}
                            onChange={(e) => setHistoryFilterMonth(parseInt(e.target.value))}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 outline-none font-medium"
                        >
                            {monthNames.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>

                        <select 
                            value={historyFilterYear}
                            onChange={(e) => setHistoryFilterYear(parseInt(e.target.value))}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 outline-none font-medium"
                        >
                            {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Pengeluaran</span>
                            <span className="font-bold text-slate-800">{formatIDR(filteredExpense)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Pembayaran</span>
                            <span className="font-bold text-green-600">{formatIDR(filteredPayment)}</span>
                        </div>
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Tidak ada transaksi yang cocok dengan filter.</td></tr>
                            ) : (
                                filteredTransactions.map(t => {
                                    const card = data.cards.find(c => c.id === t.cardId);
                                    const cardName = card?.name || 'Unknown Card';
                                    return (
                                        <tr 
                                            key={t.id} 
                                            onClick={() => handleEditClick(t)} 
                                            className="hover:bg-slate-50 transition cursor-pointer"
                                            title="Klik untuk edit"
                                        >
                                            <td className="p-4 text-slate-500 text-sm">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${card?.color || 'bg-slate-400'}`}></div>
                                                    <span className="text-slate-700 text-sm font-medium">{cardName}</span>
                                                </div>
                                            </td>
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
    </>
  );
};

export default App;