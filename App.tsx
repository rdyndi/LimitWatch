import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Tag,
  Info
} from "lucide-react";

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

/**
 * Mengambil nilai numerik dari string input.
 * Diperbaiki: Mengambil hanya digit untuk menghindari bug "kembali ke nol"
 * karena awalan "Rp " pada input yang sudah terformat.
 */
const getNumericValue = (val: string) => {
    if (!val) return 0;
    
    // Hapus semua karakter kecuali angka dan tanda minus
    // Ini memastikan awalan "Rp", titik ribuan, atau spasi tidak mengganggu parsing
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
  "Cicilan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya"
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
  
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'savings' | 'history' | 'report' | 'profile'>('home');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);

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
  const [txCategory, setTxCategory] = useState(TRANSACTION_CATEGORIES[0]);
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

  // Ref for scroll containers
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (data.cards.length > 0) {
      if (!txCardId) setTxCardId(data.cards[0].id);
      if (!savingCardId) setSavingCardId(data.cards[0].id);
    }
  }, [data.cards, txCardId, savingCardId]);

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

  const saveData = (newData: AppState) => {
    setData(newData);
    if (user) {
      saveAppState(user.uid, newData);
    }
  };

  /**
   * Menangani input mata uang.
   */
  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    // Ambil digit saja untuk cek apakah input kosong
    const digitsOnly = val.replace(/[^\d]/g, '');
    
    if (digitsOnly === '') {
        setter('');
        return;
    }

    const numericVal = getNumericValue(val);
    setter(formatIDR(numericVal));
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
          category: 'Cicilan',
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
    setTxCategory(TRANSACTION_CATEGORIES[0]);
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
    setTxCategory(t.category || TRANSACTION_CATEGORIES[0]);
    setTxDate(new Date(t.date).toISOString().split('T')[0]);
    setTxIsInstallment(!!t.isInstallment);
    setPayFromSavings(false);
    setTransactionModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const txToDelete = data.transactions.find(t => t.id === id);
    if (!txToDelete) return;

    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${txToDelete.description}"? Hutang Anda akan disesuaikan otomatis.`)) {
      let updatedInstallments = [...data.installments];
      
      if (txToDelete.isInstallment && txToDelete.type === TransactionType.EXPENSE) {
          updatedInstallments = updatedInstallments.filter(inst => 
              !(inst.cardId === txToDelete.cardId && 
                inst.totalAmount === txToDelete.amount && 
                inst.name === txToDelete.description)
          );
      }

      const updatedTransactions = data.transactions.filter(t => t.id !== id);
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

    if (amountVal <= 0) {
        alert("Nominal transaksi harus lebih dari 0.");
        return;
    }

    if (txIsInstallment && txType === TransactionType.EXPENSE) {
       if (!editingTransaction || (editingTransaction && !editingTransaction.isInstallment)) {
          const newInstallment: Installment = {
              id: generateId(),
              cardId: txCardId,
              name: txDesc,
              totalAmount: amountVal,
              monthlyAmount: Math.ceil(amountVal / txInstallmentMonths),
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
            category: txCategory,
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
        category: payFromSavings ? 'Pelunasan Tabungan' : txCategory,
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
    if(limitVal <= 0) return;

    if (editingCard) {
      const updatedCards = data.cards.map(c => 
        c.id === editingCard.id ? { ...c, name: cardName, limit: limitVal, dueDay: cardDue ? parseInt(cardDue) : undefined } : c
      );
      saveData({ ...data, cards: updatedCards });
      setEditingCard(null);
    } else {
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
    }

    setCardName('');
    setCardLimit('');
    setCardDue('');
    setCardModalOpen(false);
  };

  const handleEditCardClick = (card: CreditCardType) => {
    setEditingCard(card);
    setCardName(card.name);
    setCardLimit(formatIDR(card.limit));
    setCardDue(card.dueDay?.toString() || '');
    setCardModalOpen(true);
  };

  const handleDeleteCard = (cardId: string) => {
    const card = data.cards.find(c => c.id === cardId);
    if (!card) return;

    if (window.confirm(`Hapus kartu "${card.name}"? PERHATIAN: Seluruh riwayat transaksi, cicilan, dan tabungan yang terkait kartu ini akan ikut terhapus selamanya.`)) {
      const updatedCards = data.cards.filter(c => c.id !== cardId);
      const updatedTransactions = data.transactions.filter(t => t.cardId !== cardId);
      const updatedInstallments = data.installments.filter(i => i.cardId !== cardId);
      const updatedSavings = data.savings.filter(s => s.cardId !== cardId);
      
      saveData({
        ...data,
        cards: updatedCards,
        transactions: updatedTransactions,
        installments: updatedInstallments,
        savings: updatedSavings
      });
    }
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
    if(amountVal <= 0) return;

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
        category: 'Pembayaran Tabungan',
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

  // Re-calculate total debt reactively using useMemo for performance
  const totalDebt = useMemo(() => {
    const expenses = data.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const payments = data.transactions
      .filter(t => t.type === TransactionType.PAYMENT)
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    return expenses - payments;
  }, [data.transactions]);

  const totalSavings = useMemo(() => {
    return data.savings
      .filter(s => !s.isTransferred)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [data.savings]);

  const upcomingBills = useMemo(() => {
      return data.cards
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
             
             const savedForThisMonth = data.savings
                .filter(s => 
                    s.cardId === c.id && 
                    !s.isTransferred && 
                    s.targetPeriod?.month === targetMonth && 
                    s.targetPeriod?.year === targetYear
                )
                .reduce((sum, s) => sum + s.amount, 0);

             const remainingDebtAfterPayment = Math.max(0, billAmount - paidAmount);
             const netGap = Math.max(0, remainingDebtAfterPayment - savedForThisMonth);
             const isCovered = savedForThisMonth >= remainingDebtAfterPayment && remainingDebtAfterPayment > 0;
             
             return { 
                ...c, 
                daysLeft: diffDays, 
                nextDueDate: dueDate, 
                totalBill: billAmount,
                alreadyPaid: paidAmount,
                savedAmount: savedForThisMonth,
                remainingBill: remainingDebtAfterPayment,
                netGap: netGap,
                isCovered: isCovered
             };
          })
          .filter(c => c.remainingBill > 1000)
          .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [data.cards, data.transactions, data.installments, data.savings]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Wallet size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">LimitWatch</h1>
            <p className="text-slate-500 mt-2">Atur hutang kartu kredit Anda.</p>
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
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
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading ? 'Memproses...' : (isRegistering ? 'Daftar' : 'Masuk')}
              {!authLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Atau</span>
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
                }}
                className="text-blue-600 font-bold hover:text-blue-700"
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
      {/* DESKTOP VIEW                              */}
      {/* ========================================= */}
      <div className="hidden md:flex min-h-screen bg-slate-50 font-sans">
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20 shadow-sm">
           <div className="h-20 flex items-center px-8 border-b border-slate-50">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Wallet size={18} />
              </div>
              <span className="font-bold text-xl text-slate-800">LimitWatch</span>
           </div>
           
           <nav className="p-4 space-y-1 flex-1 overflow-y-auto no-scrollbar">
              <div className="px-4 pb-2 pt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</div>
              <DesktopNavItem icon={<Home size={20}/>} label="Dashboard" active={mobileTab === 'home'} onClick={() => setMobileTab('home')} />
              <DesktopNavItem icon={<CreditCard size={20}/>} label="Kartu Saya" active={mobileTab === 'cards'} onClick={() => setMobileTab('cards')} />
              <DesktopNavItem icon={<History size={20}/>} label="Riwayat Transaksi" active={mobileTab === 'history'} onClick={() => setMobileTab('history')} />
              <DesktopNavItem icon={<PiggyBank size={20}/>} label="Tabungan Pelunasan" active={mobileTab === 'savings'} onClick={() => setMobileTab('savings')} />
              <DesktopNavItem icon={<FileBarChart size={20}/>} label="Laporan Tahunan" active={mobileTab === 'report'} onClick={() => setMobileTab('report')} />
              
              <div className="px-4 pb-2 pt-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Akun</div>
              <DesktopNavItem icon={<UserIcon size={20}/>} label="Profil" active={mobileTab === 'profile'} onClick={() => setMobileTab('profile')} />
           </nav>
           
           <div className="p-4 border-t border-slate-100">
              <button onClick={() => logout()} className="flex items-center gap-3 text-slate-500 hover:text-red-600 w-full p-3 rounded-lg transition-colors hover:bg-red-50">
                 <LogOut size={20} />
                 <span className="font-medium">Keluar</span>
              </button>
           </div>
        </aside>

        <main className="flex-1 ml-72 p-10 overflow-y-auto no-scrollbar">
           <header className="flex justify-between items-center mb-10">
              <div>
                 <h1 className="text-3xl font-bold text-slate-800 mb-1">
                    {mobileTab === 'home' && 'Dashboard'}
                    {mobileTab === 'cards' && 'Kartu Kredit'}
                    {mobileTab === 'history' && 'Riwayat'}
                    {mobileTab === 'savings' && 'Tabungan'}
                    {mobileTab === 'report' && 'Laporan'}
                    {mobileTab === 'profile' && 'Profil'}
                 </h1>
                 <p className="text-slate-500">Halo, {user.displayName || user.email}</p>
              </div>
              <div className="flex items-center gap-4">
                 <button 
                   onClick={openAddTransactionModal}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg active:scale-95"
                 >
                    <PlusCircle size={20} /> Transaksi
                 </button>
              </div>
           </header>

           {mobileTab === 'home' && (
             <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                     <div>
                       <p className="text-slate-500 font-medium mb-1">Total Hutang</p>
                       <h3 className="text-2xl font-bold text-slate-800">{formatIDR(totalDebt)}</h3>
                     </div>
                     <div className="text-sm text-red-500 font-medium flex items-center gap-1"><TrendingDown size={14}/> Perlu pelunasan</div>
                  </div>
                  <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                     <div>
                       <p className="text-slate-500 font-medium mb-1">Total Tabungan</p>
                       <h3 className="text-2xl font-bold text-slate-800">{formatIDR(totalSavings)}</h3>
                     </div>
                     <button onClick={openAddSavingModal} className="text-sm text-green-600 font-medium hover:underline">+ Tambah</button>
                  </div>
                  <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between h-40">
                      <div>
                        <h3 className="text-lg font-bold">Cicilan Aktif</h3>
                        <p className="text-3xl font-bold mt-1">{data.installments.filter(i => i.monthsPaid < i.totalMonths).length} Kontrak</p>
                      </div>
                      <button onClick={() => setInstallmentModalOpen(true)} className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg w-fit transition">Lihat Detail</button>
                  </div>
               </div>
               
               {/* AI Section */}
               <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-purple-600 font-bold">
                       <Sparkles size={20} /> <span>Analisis AI SmartAdvisor</span>
                    </div>
                    <button onClick={handleGetAdvice} disabled={loadingAi} className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                       {loadingAi ? 'Menganalisis...' : 'Refresh'}
                    </button>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl whitespace-pre-line border border-slate-100">
                    {aiAdvice || "Klik refresh untuk melihat saran pelunasan dari AI."}
                  </div>
               </div>
             </div>
           )}
        </main>
      </div>

      {/* ========================================= */}
      {/* MOBILE SUPER APP VIEW                      */}
      {/* ========================================= */}
      <div className="md:hidden flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
        
        {/* --- FIXED MOBILE HEADER --- */}
        <header className="flex-none bg-white px-5 pt-8 pb-4 border-b border-slate-100 z-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">LimitWatch</p>
              <h2 className="text-xl font-bold text-slate-800">
                {mobileTab === 'home' && 'Beranda'}
                {mobileTab === 'cards' && 'Kartu Kredit'}
                {mobileTab === 'savings' && 'Tabungan'}
                {mobileTab === 'history' && 'Transaksi'}
                {mobileTab === 'report' && 'Laporan'}
                {mobileTab === 'profile' && 'Akun'}
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 border border-slate-200 relative"
                >
                    <BellRing size={20} />
                    {notifications.length > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                   {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={20} className="m-2.5 text-slate-400"/>}
                </div>
            </div>
          </div>
        </header>

        {/* --- SCROLLABLE CONTENT AREA --- */}
        <main 
          className="flex-1 overflow-y-auto no-scrollbar pb-10 px-5 pt-5 space-y-6"
          ref={scrollRef}
        >
          {mobileTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-blue-100 text-sm mb-1">Total Hutang Kartu</p>
                <h3 className="text-3xl font-bold mb-4">{formatIDR(totalDebt)}</h3>
                <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                  <div>
                    <p className="text-blue-100 text-[10px] uppercase font-bold tracking-wider">Tabungan</p>
                    <p className="font-bold text-lg">{formatIDR(totalSavings)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-[10px] uppercase font-bold tracking-wider">Tagihan Dekat</p>
                    <p className="font-bold text-lg">{upcomingBills.length} Kartu</p>
                  </div>
                </div>
              </div>

              {/* Menu Utama */}
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-3">Menu Cepat</h3>
                <div className="grid grid-cols-4 gap-4">
                  <button onClick={openAddTransactionModal} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm"><PlusCircle size={22}/></div>
                    <span className="text-[10px] font-bold text-slate-600 text-center">Catat</span>
                  </button>
                  <button onClick={() => setMobileTab('savings')} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-sm"><PiggyBank size={22}/></div>
                    <span className="text-[10px] font-bold text-slate-600 text-center">Tabungan</span>
                  </button>
                  <button onClick={() => setMobileTab('report')} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm"><FileBarChart size={22}/></div>
                    <span className="text-[10px] font-bold text-slate-600 text-center">Laporan</span>
                  </button>
                  <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardDue(''); setCardModalOpen(true); }} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"><CreditCard size={22}/></div>
                    <span className="text-[10px] font-bold text-slate-600 text-center">Kartu</span>
                  </button>
                </div>
              </div>

              {/* Tagihan Mendatang */}
              {upcomingBills.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                    <Bell size={16} className="text-red-500" /> Tagihan Dekat
                  </h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {upcomingBills.map(c => (
                      <div key={c.id} className="min-w-[240px] bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-800 text-xs">{c.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.daysLeft <= 3 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {c.daysLeft} Hari
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-slate-400">Total Tagihan</span>
                                <span className="font-bold text-slate-700">{formatIDR(c.remainingBill)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-slate-400">Tabungan Bulan Ini</span>
                                <span className="font-bold text-green-600">{formatIDR(c.savedAmount)}</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${c.isCovered ? 'bg-green-500' : 'bg-orange-400'}`} 
                                    style={{ width: `${Math.min(100, (c.savedAmount / (c.remainingBill || 1)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {c.isCovered ? (
                            <div className="bg-green-50 text-green-700 p-2 rounded-lg flex items-center gap-2 text-[9px] font-bold">
                                <Check size={12} strokeWidth={3} /> Dana Siap Bayar
                            </div>
                        ) : (
                            <div className="bg-red-50 text-red-700 p-2 rounded-lg flex items-center gap-2 text-[9px] font-bold">
                                <AlertCircle size={12} strokeWidth={3} /> Kurang: {formatIDR(c.netGap)}
                            </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-3 pt-2 border-t border-slate-50">
                          <Calendar size={10} /> Jatuh Tempo: {c.nextDueDate.toLocaleDateString('id-ID', {day:'numeric', month:'short'})}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent History */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800 text-sm">Riwayat Terakhir</h3>
                  <button onClick={() => setMobileTab('history')} className="text-blue-600 text-xs font-bold">Semua</button>
                </div>
                <div className="space-y-3">
                   {data.transactions.slice(0, 4).map(t => (
                      <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                            {t.type === TransactionType.EXPENSE ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{t.description}</p>
                            <p className="text-[10px] text-slate-400">{t.category || 'Lainnya'}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-green-600'}`}>
                          {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                        </span>
                      </div>
                   ))}
                </div>
              </div>
            </div>
          )}

          {mobileTab === 'cards' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="font-bold text-lg text-slate-800">Kartu Saya</h3>
                   <button onClick={() => { setEditingCard(null); setCardName(''); setCardLimit(''); setCardDue(''); setCardModalOpen(true); }} className="text-xs font-bold text-blue-600">+ Tambah</button>
                </div>
                {data.cards.map(card => (
                   <div key={card.id} className="space-y-2">
                     <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg relative h-44 flex flex-col justify-between overflow-hidden">
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full -mr-8 -mt-8"></div>
                        <div className="flex justify-between items-start z-10">
                          <span className="text-sm font-bold tracking-wide">{card.name}</span>
                          <CreditCard size={20} className="text-slate-400" />
                        </div>
                        <div className="z-10">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Limit Kartu</p>
                          <h4 className="text-xl font-bold tracking-widest">{formatIDR(card.limit)}</h4>
                        </div>
                        <div className="flex justify-between items-end z-10">
                           <p className="text-[10px] text-slate-300">Tempo: Tgl {card.dueDay || '-'}</p>
                           <div className="flex gap-1.5">
                              <div className="w-8 h-5 bg-white/20 rounded-sm"></div>
                              <div className="w-8 h-5 bg-white/20 rounded-sm"></div>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => handleEditCardClick(card)} className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2 shadow-sm">
                           <Pencil size={14}/> Edit Kartu
                        </button>
                        <button onClick={() => handleDeleteCard(card.id)} className="flex-1 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center justify-center gap-2 shadow-sm">
                           <Trash2 size={14}/> Hapus
                        </button>
                     </div>
                   </div>
                ))}
             </div>
          )}

          {mobileTab === 'savings' && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800">Tabungan Saya</h3>
                  <button onClick={openAddSavingModal} className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">+ Nabung</button>
               </div>
               {data.cards.map(card => {
                  const groups = getSavingsByMonth(card.id);
                  const totalCardSaved = groups.reduce((s, g) => s + g.total, 0);
                  return (
                    <div key={card.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                       <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                          <span className="font-bold text-slate-700 text-sm">{card.name}</span>
                          <span className="font-bold text-green-600">{formatIDR(totalCardSaved)}</span>
                       </div>
                       {groups.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 italic">Belum ada tabungan.</div>
                       ) : (
                          <div className="divide-y divide-slate-50">
                             {groups.map(g => (
                                <div key={g.key} className="p-3">
                                   <div className="flex justify-between items-center mb-3">
                                      <span className="text-[10px] font-bold text-indigo-600 uppercase">Periode {g.label}</span>
                                      <span className="text-sm font-bold text-slate-800">{formatIDR(g.total)}</span>
                                   </div>
                                   <div className="flex gap-2">
                                      <button onClick={() => openWithdrawModal(g.items)} className="flex-1 py-2 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-lg border border-orange-100">Ambil</button>
                                      <button onClick={() => handleOpenBatchPay(g.items, g.label, g.total)} className="flex-1 py-2 bg-green-600 text-white text-[10px] font-bold rounded-lg shadow-sm">Bayar Lunas</button>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                  )
               })}
             </div>
          )}

          {mobileTab === 'history' && (
             <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-800">Riwayat Transaksi</h3>
                <div className="space-y-3">
                  {data.transactions.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{t.description}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{new Date(t.date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                        </div>
                        <span className={`text-sm font-bold ${t.type === TransactionType.EXPENSE ? 'text-red-500' : 'text-green-600'}`}>
                          {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                         <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded">
                            <Tag size={10} /> {t.category || 'Lainnya'}
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleEditClick(t)} className="p-1.5 text-blue-500"><Pencil size={14}/></button>
                            <button onClick={() => handleDeleteClick(t.id)} className="p-1.5 text-red-500"><Trash2 size={14}/></button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {mobileTab === 'report' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="font-bold text-lg text-slate-800">Laporan Tahunan</h3>
                   <select value={selectedYear} onChange={(e)=>setSelectedYear(parseInt(e.target.value))} className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none">
                      <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                      <option value={new Date().getFullYear()-1}>{new Date().getFullYear()-1}</option>
                   </select>
                </div>
                <div className="space-y-3">
                   {monthNames.map((m, i) => {
                      const totalMonthBill = data.cards.reduce((sum, c) => sum + getMonthlyBill(c.id, i, selectedYear), 0);
                      if (totalMonthBill === 0) return null;
                      return (
                        <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                           <div>
                              <p className="font-bold text-slate-800 text-sm">{m}</p>
                              <p className="text-[10px] text-slate-400">Tahun {selectedYear}</p>
                           </div>
                           <span className="font-bold text-red-500 text-sm">{formatIDR(totalMonthBill)}</span>
                        </div>
                      )
                   })}
                </div>
             </div>
          )}

          {mobileTab === 'profile' && (
             <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                   <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={32} className="text-slate-300"/>}
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-800">{user.displayName || 'User'}</h4>
                      <p className="text-xs text-slate-500">{user.email}</p>
                   </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                   <button onClick={() => logout()} className="w-full p-4 text-left text-sm font-bold text-red-500 flex justify-between items-center">
                      Keluar <LogOut size={16} />
                   </button>
                </div>
             </div>
          )}
        </main>

        {/* --- FIXED BOTTOM NAVIGATION --- */}
        <nav className="flex-none h-[85px] bg-white border-t border-slate-100 px-6 flex justify-between items-center z-50">
          <button onClick={()=>setMobileTab('home')} className={`flex flex-col items-center gap-1 ${mobileTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Home size={22} strokeWidth={mobileTab==='home'?2.5:2} />
            <span className="text-[9px] font-bold">Home</span>
          </button>
          <button onClick={()=>setMobileTab('cards')} className={`flex flex-col items-center gap-1 ${mobileTab === 'cards' ? 'text-blue-600' : 'text-slate-400'}`}>
            <CreditCard size={22} strokeWidth={mobileTab==='cards'?2.5:2} />
            <span className="text-[9px] font-bold">Kartu</span>
          </button>
          <button onClick={()=>setMobileTab('savings')} className={`flex flex-col items-center gap-1 ${mobileTab === 'savings' ? 'text-blue-600' : 'text-slate-400'}`}>
            <PiggyBank size={22} strokeWidth={mobileTab==='savings'?2.5:2} />
            <span className="text-[9px] font-bold">Tabung</span>
          </button>
          <button onClick={()=>setMobileTab('history')} className={`flex flex-col items-center gap-1 ${mobileTab === 'history' ? 'text-blue-600' : 'text-slate-400'}`}>
            <History size={22} strokeWidth={mobileTab==='history'?2.5:2} />
            <span className="text-[9px] font-bold">Riwayat</span>
          </button>
          <button onClick={()=>setMobileTab('profile')} className={`flex flex-col items-center gap-1 ${mobileTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}>
            <UserIcon size={22} strokeWidth={mobileTab==='profile'?2.5:2} />
            <span className="text-[9px] font-bold">Akun</span>
          </button>
        </nav>
      </div>

      {/* --- TRANSACTION MODAL --- */}
      {transactionModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto no-scrollbar max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">{editingTransaction ? 'Ubah Transaksi' : 'Catat Transaksi'}</h3>
              <button onClick={() => setTransactionModalOpen(false)}><X className="text-slate-400"/></button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button type="button" onClick={()=>setTxType(TransactionType.EXPENSE)} className={`flex-1 py-2 text-xs font-bold rounded-lg ${txType === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>PEMAKAIAN</button>
                <button type="button" onClick={()=>setTxType(TransactionType.PAYMENT)} className={`flex-1 py-2 text-xs font-bold rounded-lg ${txType === TransactionType.PAYMENT ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}>PEMBAYARAN</button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Jumlah</label>
                <input type="text" value={txAmount} onChange={(e)=>handleCurrencyInput(e.target.value, setTxAmount)} placeholder="Rp 0" className="w-full text-2xl font-bold py-2 border-b-2 border-slate-100 outline-none focus:border-blue-500 transition" required />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Keterangan</label>
                <input type="text" value={txDesc} onChange={(e)=>setTxDesc(e.target.value)} placeholder="Misal: Belanja Baju" className="w-full py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 outline-none" required />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Kategori</label>
                <select value={txCategory} onChange={(e)=>setTxCategory(e.target.value)} className="w-full py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 outline-none">
                   {TRANSACTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Kartu</label>
                   <select value={txCardId} onChange={(e)=>setTxCardId(e.target.value)} className="w-full py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 outline-none">
                      {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal</label>
                    <input type="date" value={txDate} onChange={(e)=>setTxDate(e.target.value)} className="w-full py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 outline-none" />
                 </div>
              </div>

              {txType === TransactionType.EXPENSE && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                   <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-200 text-indigo-700 rounded-lg"><PieChart size={14}/></div>
                      <div>
                         <p className="text-xs font-bold text-slate-800">Ubah ke Cicilan</p>
                         <p className="text-[9px] text-indigo-500">Bagi menjadi tenor tetap</p>
                      </div>
                   </div>
                   <input type="checkbox" checked={txIsInstallment} onChange={(e)=>setTxIsInstallment(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </div>
              )}

              {txIsInstallment && txType === TransactionType.EXPENSE && (
                 <div className="p-3 bg-white border border-indigo-100 rounded-xl">
                    <label className="text-[10px] font-bold text-indigo-500 uppercase">Tenor (Bulan)</label>
                    <select value={txInstallmentMonths} onChange={(e)=>setTxInstallmentMonths(parseInt(e.target.value))} className="w-full py-2 outline-none">
                       {[3, 6, 12, 18, 24].map(m => <option key={m} value={m}>{m} Bulan</option>)}
                    </select>
                 </div>
              )}

              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition">
                {editingTransaction ? 'Simpan Perubahan' : 'Catat Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT CARD MODAL --- */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4">
           <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-slate-800">{editingCard ? 'Edit Kartu' : 'Tambah Kartu'}</h3>
               <button onClick={() => setCardModalOpen(false)}><X className="text-slate-400"/></button>
             </div>
             <form onSubmit={handleSaveCard} className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Kartu</label>
                  <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="BCA Everyday" className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" required />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Limit (IDR)</label>
                  <input type="text" value={cardLimit} onChange={e => handleCurrencyInput(e.target.value, setCardLimit)} placeholder="Rp 0" className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold" required />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Jatuh Tempo (1-31)</label>
                  <input type="number" min="1" max="31" value={cardDue} onChange={e => setCardDue(e.target.value)} placeholder="Contoh: 25" className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none" />
               </div>
               <button type="submit" className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition">
                 {editingCard ? 'Simpan Perubahan' : 'Simpan Kartu'}
               </button>
             </form>
           </div>
        </div>
      )}

      {/* --- SAVING MODAL --- */}
      {savingModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center">
           <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-slate-800">Tabung Pelunasan</h3>
               <button onClick={() => setSavingModalOpen(false)}><X className="text-slate-400"/></button>
             </div>
             <form onSubmit={handleSaveSaving} className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Kartu Target</label>
                  <select value={savingCardId} onChange={(e) => setSavingCardId(e.target.value)} className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none">
                     {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Untuk Bulan</label>
                    <select value={savingTargetMonth} onChange={(e) => setSavingTargetMonth(parseInt(e.target.value))} className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl">
                       {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tahun</label>
                    <input type="number" value={savingTargetYear} onChange={(e) => setSavingTargetYear(parseInt(e.target.value))} className="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl" />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nominal</label>
                  <input type="text" value={savingAmount} onChange={e => handleCurrencyInput(e.target.value, setSavingAmount)} placeholder="Rp 0" className="w-full text-xl font-bold py-2 border-b-2 border-slate-100 outline-none focus:border-green-500" required />
               </div>
               <button type="submit" className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg">Simpan Tabungan</button>
             </form>
           </div>
        </div>
      )}

      {/* --- BATCH PAY MODAL --- */}
      {batchPayModalOpen && activeBatchGroup && (
         <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200">
               <h3 className="text-lg font-bold text-slate-800 mb-2">Lunasi Tagihan?</h3>
               <p className="text-sm text-slate-500 mb-6">Gunakan saldo tabungan <strong>{formatIDR(activeBatchGroup.total)}</strong> untuk melunasi tagihan periode {activeBatchGroup.label}.</p>
               <div className="flex gap-3">
                  <button onClick={() => setBatchPayModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Batal</button>
                  <button onClick={handleConfirmBatchPay} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg">Lunas!</button>
               </div>
            </div>
         </div>
      )}

      {/* --- WITHDRAW MODAL --- */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
             <h3 className="text-lg font-bold text-slate-800 mb-2">Ambil Tabungan</h3>
             <form onSubmit={handleConfirmWithdraw} className="space-y-4">
               <input type="text" value={withdrawAmount} onChange={e => handleCurrencyInput(e.target.value, setWithdrawAmount)} placeholder="Rp 0" className="w-full text-xl font-bold py-2 border-b-2 border-slate-100 outline-none" required />
               <div className="flex gap-3">
                  <button type="button" onClick={() => setWithdrawModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg">Ambil</button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* TOAST NOTIF */}
      {showToast && toastMessage && (
        <div className="fixed top-24 left-5 right-5 z-[100] md:top-5 md:right-5 md:left-auto md:w-80 animate-in slide-in-from-top duration-300">
           <div className={`p-4 rounded-xl shadow-2xl flex gap-3 border ${toastMessage.type === 'urgent' ? 'bg-red-600 border-red-700 text-white' : 'bg-orange-500 border-orange-600 text-white'}`}>
              <AlertCircle size={20} className="flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">{toastMessage.title}</p>
                <p className="text-[10px] opacity-90">{toastMessage.message}</p>
              </div>
              <button onClick={()=>setShowToast(false)} className="ml-auto opacity-50"><X size={16}/></button>
           </div>
        </div>
      )}
    </>
  );
};

export default App;