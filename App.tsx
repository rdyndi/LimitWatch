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
  loginWithEmail,
  registerWithEmail,
  updateUserProfile,
  logout, 
  subscribeToAuth, 
  subscribeToAppState, 
  saveAppState,
  getEmailByUsername,
  requestFcmToken,
  onMessageListener
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
  TrendingUp,
  TrendingDown,
  X,
  Pencil,
  Trash2,
  Coins,
  FileBarChart,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  WalletCards,
  ReceiptText,
  Calculator,
  ChevronRight,
  CheckCircle2,
  Filter,
  Check,
  Download,
  CalendarDays
} from "lucide-react";

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
const getNumericValue = (val: string) => parseInt(val.replace(/\D/g, '') || '0', 10);

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const CARD_COLORS = [
  { id: 'slate', class: 'bg-gradient-to-br from-slate-700 to-slate-900', label: 'Hitam' },
  { id: 'blue', class: 'bg-gradient-to-br from-indigo-600 to-violet-700', label: 'Biru' },
  { id: 'emerald', class: 'bg-gradient-to-br from-emerald-500 to-emerald-700', label: 'Hijau' },
  { id: 'red', class: 'bg-gradient-to-br from-red-500 to-red-700', label: 'Merah' },
];

const iosGradients: Record<string, string> = {
  transaksi: 'bg-gradient-to-b from-blue-400 to-blue-600',
  cicilan: 'bg-gradient-to-b from-violet-400 to-purple-600',
  wallets: 'bg-gradient-to-b from-emerald-400 to-teal-600',
  laporan: 'bg-gradient-to-b from-orange-400 to-red-500',
  kartu: 'bg-gradient-to-b from-pink-400 to-rose-600',
  bills: 'bg-gradient-to-b from-red-400 to-red-600',
  tabungan: 'bg-gradient-to-b from-cyan-400 to-blue-500',
  history: 'bg-gradient-to-b from-slate-400 to-slate-600',
};

const ProfileDropdown = ({ user, onLogout, onNavigate }: { user: User, onLogout: () => void, onNavigate: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
        <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full glass-panel p-0.5 overflow-hidden shadow-md">
            {user.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover"/> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><UserIcon className="text-slate-500 w-5 h-5"/></div>}
        </button>
        {isOpen && (
            <div className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-white/30 bg-white/20">
                    <p className="font-bold text-slate-800 text-sm truncate">{user.displayName || 'User'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="p-2">
                    <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors">
                        <LogOut size={16} /> Keluar
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [data, setData] = useState<AppState>({ cards: [], transactions: [], installments: [], savings: [], wallets: [] });
  
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'savings' | 'history' | 'report' | 'wallets' | 'bills'>('home');
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [selectedCardForStatement, setSelectedCardForStatement] = useState<CreditCardType | null>(null);

  // States for filtering history
  const [historyFilterCard, setHistoryFilterCard] = useState<string>('all');
  const [historyFilterMonth, setHistoryFilterMonth] = useState<number>(new Date().getMonth());
  const [historyFilterYear, setHistoryFilterYear] = useState<number>(new Date().getFullYear());

  const [authInput, setAuthInput] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txCardId, setTxCardId] = useState('');

  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDue, setCardDue] = useState('');

  const [savingAmount, setSavingAmount] = useState('');
  const [savingCardId, setSavingCardId] = useState('');

  const [walletName, setWalletName] = useState('');
  const [walletBalance, setWalletBalance] = useState('');

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      setAuthChecking(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user) {
      return subscribeToAppState(user.uid, (d) => {
        setData(d || { cards: [], transactions: [], installments: [], savings: [], wallets: [] });
        if (d.cards.length > 0 && !txCardId) setTxCardId(d.cards[0].id);
        if (d.cards.length > 0 && !savingCardId) setSavingCardId(d.cards[0].id);
      });
    }
  }, [user]);

  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    const numericVal = getNumericValue(val);
    setter(numericVal === 0 ? '' : formatIDR(numericVal));
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (isRegistering) {
        await registerWithEmail(authInput, password);
        if (displayName) await updateUserProfile(displayName);
      } else {
        let email = authInput;
        if (!authInput.includes('@')) {
          const foundEmail = await getEmailByUsername(authInput);
          if (foundEmail) email = foundEmail;
          else throw new Error("Username tidak ditemukan");
        }
        await loginWithEmail(email, password);
      }
    } catch (err: any) { setAuthError(err.message); }
    finally { setAuthLoading(false); }
  };

  const saveData = (newData: AppState) => {
    setData(newData);
    if (user) saveAppState(user.uid, newData);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = getNumericValue(txAmount);
    if (!amount || !txCardId) return;
    const newTx: Transaction = {
      id: generateId(),
      cardId: txCardId,
      amount,
      date: new Date().toISOString(),
      description: txDesc || (txType === TransactionType.EXPENSE ? 'Pemakaian' : 'Pembayaran'),
      type: txType,
      isValidated: false
    };
    saveData({ ...data, transactions: [newTx, ...data.transactions] });
    setTransactionModalOpen(false);
    setTxAmount(''); setTxDesc('');
  };

  const toggleTransactionValidation = (id: string) => {
    const updatedTransactions = data.transactions.map(t => 
      t.id === id ? { ...t, isValidated: !t.isValidated } : t
    );
    saveData({ ...data, transactions: updatedTransactions });
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = getNumericValue(cardLimit);
    if (!cardName || !limit) return;
    const newCard: CreditCardType = {
      id: generateId(),
      name: cardName,
      limit,
      color: CARD_COLORS[data.cards.length % CARD_COLORS.length].class,
      dueDay: cardDue ? parseInt(cardDue) : undefined
    };
    saveData({ ...data, cards: [...data.cards, newCard] });
    setCardModalOpen(false);
    setCardName(''); setCardLimit(''); setCardDue('');
  };

  const handleSaveSaving = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = getNumericValue(savingAmount);
    if (!amount || !savingCardId) return;
    const newSaving: Saving = {
      id: generateId(),
      cardId: savingCardId,
      amount,
      date: new Date().toISOString(),
      note: 'Tabungan Pelunasan',
      isTransferred: false
    };
    saveData({ ...data, savings: [newSaving, ...data.savings] });
    setSavingModalOpen(false);
    setSavingAmount('');
  };

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = getNumericValue(walletBalance);
    if (!walletName) return;
    const newWallet: WalletType = {
      id: generateId(),
      name: walletName,
      type: 'BANK',
      balance,
      color: 'bg-slate-700'
    };
    saveData({ ...data, wallets: [...(data.wallets || []), newWallet] });
    setWalletModalOpen(false);
    setWalletName(''); setWalletBalance('');
  };

  const totalDebt = data.transactions.reduce((acc, t) => acc + (t.type === TransactionType.EXPENSE ? t.amount : -t.amount), 0);
  const totalSavings = (data.savings || []).filter(s => !s.isTransferred).reduce((acc, s) => acc + s.amount, 0);

  // Filtering Logic for History
  const filteredTransactions = data.transactions.filter(t => {
    const tDate = new Date(t.date);
    const matchesCard = historyFilterCard === 'all' || t.cardId === historyFilterCard;
    const matchesMonth = tDate.getMonth() === historyFilterMonth;
    const matchesYear = tDate.getFullYear() === historyFilterYear;
    return matchesCard && matchesMonth && matchesYear;
  });

  const openCardStatement = (card: CreditCardType) => {
    setSelectedCardForStatement(card);
    setStatementModalOpen(true);
  };

  if (authChecking) return <div className="h-dvh flex items-center justify-center bg-[#0F0F1E] text-white font-bold">LimitWatch Memuat...</div>;

  if (!user) {
    return (
      <div className="h-dvh flex items-center justify-center p-6 bg-[#0F0F1E]">
        <div className="glass-panel p-8 rounded-[32px] w-full max-sm shadow-2xl">
          <h1 className="text-3xl font-black text-slate-800 text-center mb-2 italic">LimitWatch</h1>
          <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Manajemen Hutang Cerdas</p>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && <input type="text" placeholder="Nama Lengkap" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full glass-input rounded-xl p-4 outline-none font-bold" />}
            <input type="text" placeholder="Email atau Username" value={authInput} onChange={(e) => setAuthInput(e.target.value)} className="w-full glass-input rounded-xl p-4 outline-none font-bold" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full glass-input rounded-xl p-4 outline-none font-bold" required />
            {authError && <p className="text-red-500 text-[10px] font-bold text-center">{authError}</p>}
            <button type="submit" disabled={authLoading} className="w-full btn-liquid text-white py-4 rounded-xl font-black uppercase tracking-wider">{isRegistering ? 'Daftar' : 'Masuk'}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-xs text-indigo-600 font-bold uppercase">{isRegistering ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-transparent overflow-hidden">
      {/* HEADER MOBILE */}
      <header className="glass-nav pt-safe px-5 pb-4 flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center gap-2 font-black text-slate-800 italic text-lg"><Wallet size={20} className="text-indigo-600"/> LimitWatch</div>
        <ProfileDropdown user={user} onLogout={logout} onNavigate={() => {}} />
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-[100px] p-5 scrollbar-hide">
        {/* TAB HOME */}
        {mobileTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-7 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Hutang</p>
              <h2 className="text-4xl font-black tracking-tighter mb-8">{formatIDR(totalDebt)}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                   <p className="text-[9px] text-indigo-100 font-bold uppercase mb-1 flex items-center gap-1"><Coins size={10}/> Tabungan</p>
                   <p className="font-black text-sm">{formatIDR(totalSavings)}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                   <p className="text-[9px] text-indigo-100 font-bold uppercase mb-1 flex items-center gap-1"><Calculator size={10}/> Cicilan</p>
                   <p className="font-black text-sm">{data.installments.length} Item</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4">
              <button onClick={() => setTransactionModalOpen(true)} className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${iosGradients.transaksi}`}><PlusCircle size={24}/></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Input</span>
              </button>
              <button onClick={() => setMobileTab('cards')} className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${iosGradients.kartu}`}><CreditCard size={24}/></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Kartu</span>
              </button>
              <button onClick={() => setMobileTab('wallets')} className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${iosGradients.wallets}`}><WalletCards size={24}/></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Dompet</span>
              </button>
              <button onClick={() => setMobileTab('report')} className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${iosGradients.laporan}`}><FileBarChart size={24}/></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Laporan</span>
              </button>
            </div>

            {/* Recent History */}
            <div className="glass-panel rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-black text-slate-800 uppercase text-xs italic">Transaksi Terakhir</h3>
                <button onClick={() => setMobileTab('history')} className="text-[10px] font-bold text-indigo-600 uppercase">Lihat Semua</button>
              </div>
              <div className="space-y-4">
                {data.transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex gap-3 items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {t.type === TransactionType.EXPENSE ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight mb-0.5 line-clamp-1">{t.description}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <p className={`font-black text-sm tracking-tight ${t.type === TransactionType.EXPENSE ? 'text-red-600' : 'text-green-600'}`}>
                      {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB CARDS */}
        {mobileTab === 'cards' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-black text-slate-800 italic">Kartu Kredit</h2>
               <button onClick={() => setCardModalOpen(true)} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg"><PlusCircle size={20}/></button>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 -mt-4">Klik kartu untuk detail tagihan</p>
            <div className="space-y-4">
              {data.cards.map(card => (
                <button 
                  key={card.id} 
                  onClick={() => openCardStatement(card)}
                  className={`w-full text-left active:scale-[0.98] transition-all ${card.color} rounded-[28px] p-6 text-white shadow-xl h-48 flex flex-col justify-between relative overflow-hidden`}
                >
                  <div className="card-gloss-overlay absolute inset-0"></div>
                  <div className="flex justify-between items-start z-10">
                    <span className="font-black text-lg italic uppercase tracking-tighter">{card.name}</span>
                    <div className="flex flex-col items-end">
                      <CreditCard size={20} className="opacity-50 mb-1"/>
                      <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md text-[8px] font-black uppercase">E-Statement</div>
                    </div>
                  </div>
                  <div className="z-10">
                    <p className="text-[9px] opacity-70 font-black uppercase mb-1">Limit Kartu</p>
                    <p className="text-3xl font-black tracking-tighter">{formatIDR(card.limit)}</p>
                  </div>
                  {card.dueDay && <div className="absolute bottom-6 right-6 z-10 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-bold uppercase">Jatuh Tempo: {card.dueDay}</div>}
                </button>
              ))}
              {data.cards.length === 0 && <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs italic">Belum ada kartu terdaftar</div>}
            </div>
          </div>
        )}

        {/* TAB HISTORY */}
        {mobileTab === 'history' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
            <h2 className="text-2xl font-black text-slate-800 italic">Riwayat Transaksi</h2>
            
            {/* Filter UI */}
            <div className="glass-panel rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    <Filter size={12} /> Filter Riwayat
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <select 
                        value={historyFilterCard} 
                        onChange={(e) => setHistoryFilterCard(e.target.value)}
                        className="glass-input rounded-xl p-3 text-[11px] font-bold outline-none appearance-none bg-white/40"
                    >
                        <option value="all">Semua Kartu</option>
                        {data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select 
                        value={historyFilterMonth} 
                        onChange={(e) => setHistoryFilterMonth(parseInt(e.target.value))}
                        className="glass-input rounded-xl p-3 text-[11px] font-bold outline-none appearance-none bg-white/40"
                    >
                        {monthNames.map((name, idx) => <option key={idx} value={idx}>{name}</option>)}
                    </select>
                </div>
                <div className="flex gap-3">
                    <input 
                        type="number" 
                        value={historyFilterYear} 
                        onChange={(e) => setHistoryFilterYear(parseInt(e.target.value))}
                        className="glass-input rounded-xl p-3 text-[11px] font-bold outline-none w-full bg-white/40"
                        placeholder="Tahun"
                    />
                    <button 
                        onClick={() => {
                            setHistoryFilterCard('all');
                            setHistoryFilterMonth(new Date().getMonth());
                            setHistoryFilterYear(new Date().getFullYear());
                        }}
                        className="bg-slate-100 text-slate-500 px-4 rounded-xl text-[10px] font-black uppercase whitespace-nowrap"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-5 border border-white/40 shadow-sm">
              <div className="space-y-5">
                {filteredTransactions.map(t => {
                   const card = data.cards.find(c => c.id === t.cardId);
                   return (
                     <div key={t.id} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex gap-4 items-center flex-1">
                        {/* Checklist Button */}
                        <button 
                          onClick={() => toggleTransactionValidation(t.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${t.isValidated ? `${card?.color || 'bg-indigo-600'} border-transparent text-white shadow-md scale-110` : 'border-slate-200 text-slate-200 hover:border-slate-400'}`}
                        >
                          <Check size={16} strokeWidth={4} />
                        </button>

                        <div className="flex flex-col min-w-0">
                          <p className={`font-bold text-sm mb-0.5 line-clamp-1 transition-colors ${t.isValidated ? 'text-slate-400' : 'text-slate-800'}`}>{t.description}</p>
                          <div className="flex gap-2 items-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                              {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </p>
                              <span className="text-[10px] text-slate-300">•</span>
                              <p className={`text-[10px] font-bold uppercase ${t.isValidated ? 'text-slate-300' : 'text-indigo-500'}`}>
                                  {card?.name || 'N/A'}
                              </p>
                          </div>
                        </div>
                      </div>
                      <p className={`font-black text-base tracking-tighter shrink-0 ml-2 ${t.isValidated ? 'text-slate-300' : (t.type === TransactionType.EXPENSE ? 'text-red-600' : 'text-green-600')}`}>
                        {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                      </p>
                    </div>
                   );
                })}
                {filteredTransactions.length === 0 && <p className="text-center py-10 text-slate-400 font-bold italic text-xs uppercase">Tidak ada riwayat pada periode ini</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB SAVINGS */}
        {mobileTab === 'savings' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 italic">Tabungan Pelunasan</h2>
              <button onClick={() => setSavingModalOpen(true)} className="bg-teal-600 text-white p-2.5 rounded-xl shadow-lg"><PlusCircle size={20}/></button>
            </div>
            <div className="glass-panel rounded-[32px] p-7 text-slate-800 shadow-sm border border-white">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Saldo Terkumpul</p>
              <h2 className="text-4xl font-black text-teal-600 tracking-tighter">{formatIDR(totalSavings)}</h2>
            </div>
            <div className="space-y-4">
              {data.savings.filter(s => !s.isTransferred).map(s => (
                <div key={s.id} className="glass-panel p-5 rounded-3xl flex justify-between items-center border border-slate-100">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center"><Coins size={20}/></div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{s.note}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(s.date).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <p className="font-black text-teal-600">{formatIDR(s.amount)}</p>
                </div>
              ))}
              {data.savings.length === 0 && <p className="text-center py-10 text-slate-400 font-bold italic text-xs uppercase">Belum ada tabungan</p>}
            </div>
          </div>
        )}

        {/* TAB WALLETS */}
        {mobileTab === 'wallets' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 italic">Dompet Digital</h2>
              <button onClick={() => setWalletModalOpen(true)} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg"><PlusCircle size={20}/></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {data.wallets?.map(w => (
                <div key={w.id} className="glass-panel-light p-6 rounded-[28px] shadow-sm border border-slate-100 flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner"><Wallet size={24}/></div>
                    <div>
                      <p className="font-black text-slate-800 text-base">{w.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{w.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-600 text-lg">{formatIDR(w.balance)}</p>
                  </div>
                </div>
              ))}
              {(!data.wallets || data.wallets.length === 0) && <p className="text-center py-20 text-slate-400 font-bold uppercase text-xs italic">Belum ada dompet terdaftar</p>}
            </div>
          </div>
        )}

        {/* TAB REPORT */}
        {mobileTab === 'report' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-2xl font-black text-slate-800 italic">Analisa Keuangan</h2>
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400">Rasio Hutang vs Tabungan</p>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-red-500 h-full" style={{ width: `${Math.min(100, (totalDebt / (totalDebt + totalSavings || 1)) * 100)}%` }}></div>
                  <div className="bg-teal-500 h-full" style={{ width: `${Math.min(100, (totalSavings / (totalDebt + totalSavings || 1)) * 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] font-bold uppercase pt-1">
                  <span className="text-red-600">Hutang</span>
                  <span className="text-teal-600">Tabungan</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Transaksi</p>
                  <p className="font-black text-slate-800">{data.transactions.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Kartu Aktif</p>
                  <p className="font-black text-slate-800">{data.cards.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-[calc(var(--sab)+10px)] left-1/2 -translate-x-1/2 w-[92%] max-w-md h-[68px] glass-nav rounded-[28px] shadow-2xl border border-white/60 z-[100] flex justify-between items-center px-8">
        <button onClick={() => setMobileTab('home')} className={`p-2.5 transition-all ${mobileTab === 'home' ? 'text-indigo-600 bg-indigo-50 rounded-2xl scale-110' : 'text-slate-400'}`}><Home size={22}/></button>
        <button onClick={() => setMobileTab('cards')} className={`p-2.5 transition-all ${mobileTab === 'cards' ? 'text-pink-600 bg-pink-50 rounded-2xl scale-110' : 'text-slate-400'}`}><CreditCard size={22}/></button>
        <div className="relative -mt-14">
          <button onClick={() => setTransactionModalOpen(true)} className="btn-liquid w-14 h-14 rounded-full shadow-2xl flex items-center justify-center border-4 border-white active:scale-90 transition-all">
            <PlusCircle size={28} className="text-white"/>
          </button>
        </div>
        <button onClick={() => setMobileTab('savings')} className={`p-2.5 transition-all ${mobileTab === 'savings' ? 'text-teal-600 bg-teal-50 rounded-2xl scale-110' : 'text-slate-400'}`}><Coins size={22}/></button>
        <button onClick={() => setMobileTab('history')} className={`p-2.5 transition-all ${mobileTab === 'history' ? 'text-slate-800 bg-slate-100 rounded-2xl scale-110' : 'text-slate-400'}`}><History size={22}/></button>
      </nav>

      {/* TRANSACTION MODAL */}
      {transactionModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 glass-overlay">
           <div className="glass-panel-light w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center p-6 border-b border-slate-100"><h3 className="font-black text-lg text-slate-800 italic">Transaksi</h3><button onClick={() => setTransactionModalOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={18}/></button></div>
              <form onSubmit={handleSaveTransaction} className="p-6 space-y-5">
                 <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button type="button" onClick={() => setTxType(TransactionType.EXPENSE)} className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${txType === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>Pakai</button>
                    <button type="button" onClick={() => setTxType(TransactionType.PAYMENT)} className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${txType === TransactionType.PAYMENT ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}>Bayar</button>
                 </div>
                 <select required value={txCardId} onChange={(e) => setTxCardId(e.target.value)} className="w-full glass-input rounded-2xl p-4 font-bold appearance-none text-slate-800"><option value="">Pilih Kartu</option>{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nominal</label>
                    <input type="text" inputMode="numeric" required placeholder="Rp 0" value={txAmount} onChange={(e) => handleCurrencyInput(e.target.value, setTxAmount)} className="w-full text-3xl font-black bg-transparent border-b-2 border-slate-100 py-2 outline-none focus:border-indigo-600 text-slate-800 tracking-tighter" />
                 </div>
                 <input type="text" placeholder="Keterangan..." value={txDesc} onChange={(e) => setTxDesc(e.target.value)} className="w-full glass-input rounded-2xl p-4 outline-none font-bold text-sm" />
                 <button type="submit" className="w-full btn-liquid text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Simpan</button>
              </form>
           </div>
        </div>
      )}

      {/* CARD MODAL */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 glass-overlay">
           <div className="glass-panel-light w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in">
              <div className="flex justify-between items-center p-6 border-b border-slate-100"><h3 className="font-black text-lg italic">Tambah Kartu</h3><button onClick={() => setCardModalOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={18}/></button></div>
              <form onSubmit={handleSaveCard} className="p-6 space-y-4">
                 <input placeholder="Nama Kartu" value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full glass-input rounded-2xl p-4 font-bold outline-none" required />
                 <input placeholder="Limit Kartu" value={cardLimit} onChange={(e) => handleCurrencyInput(e.target.value, setCardLimit)} className="w-full glass-input rounded-2xl p-4 font-bold outline-none" required />
                 <input placeholder="Tanggal Jatuh Tempo (1-31)" type="number" min="1" max="31" value={cardDue} onChange={(e) => setCardDue(e.target.value)} className="w-full glass-input rounded-2xl p-4 font-bold outline-none" />
                 <button type="submit" className="w-full btn-liquid text-white py-4 rounded-2xl font-black uppercase">Tambah Kartu</button>
              </form>
           </div>
        </div>
      )}

      {/* SAVING MODAL */}
      {savingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 glass-overlay">
           <div className="glass-panel-light w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in">
              <div className="flex justify-between items-center p-6 border-b border-slate-100"><h3 className="font-black text-lg italic text-teal-600">Simpan Dana</h3><button onClick={() => setSavingModalOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={18}/></button></div>
              <form onSubmit={handleSaveSaving} className="p-6 space-y-4">
                 <select required value={savingCardId} onChange={(e) => setSavingCardId(e.target.value)} className="w-full glass-input rounded-2xl p-4 font-bold text-slate-800"><option value="">Pilih Kartu Target</option>{data.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                 <input placeholder="Nominal Tabungan" value={savingAmount} onChange={(e) => handleCurrencyInput(e.target.value, setSavingAmount)} className="w-full glass-input rounded-2xl p-4 font-bold outline-none" required />
                 <button type="submit" className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg">Simpan Dana</button>
              </form>
           </div>
        </div>
      )}

      {/* WALLET MODAL */}
      {walletModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 glass-overlay">
           <div className="glass-panel-light w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in">
              <div className="flex justify-between items-center p-6 border-b border-slate-100"><h3 className="font-black text-lg italic">Tambah Dompet</h3><button onClick={() => setWalletModalOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={18}/></button></div>
              <form onSubmit={handleSaveWallet} className="p-6 space-y-4">
                 <input placeholder="Nama Dompet / Bank" value={walletName} onChange={(e) => setWalletName(e.target.value)} className="w-full glass-input rounded-2xl p-4 font-bold outline-none" required />
                 <input placeholder="Saldo Awal" value={walletBalance} onChange={(e) => handleCurrencyInput(e.target.value, setWalletBalance)} className="w-full glass-input rounded-2xl p-4 font-bold outline-none" required />
                 <button type="submit" className="w-full btn-liquid text-white py-4 rounded-2xl font-black uppercase">Tambah Dompet</button>
              </form>
           </div>
        </div>
      )}

      {/* CARD STATEMENT MODAL */}
      {statementModalOpen && selectedCardForStatement && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-5 glass-overlay">
           <div className="bg-white w-full max-w-2xl sm:rounded-[40px] rounded-t-[40px] h-[92dvh] sm:h-auto sm:max-h-[85dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
              {/* Header Statement */}
              <div className={`${selectedCardForStatement.color} p-8 text-white relative`}>
                 <div className="card-gloss-overlay absolute inset-0"></div>
                 <div className="flex justify-between items-start z-10 relative">
                    <div>
                      <h3 className="text-2xl font-black italic tracking-tighter mb-1">{selectedCardForStatement.name}</h3>
                      <p className="text-[10px] font-black uppercase opacity-70 flex items-center gap-1"><ReceiptText size={12}/> E-Statement Pro</p>
                    </div>
                    <button onClick={() => setStatementModalOpen(false)} className="bg-white/20 p-2.5 rounded-2xl active:scale-90 transition-all"><X size={20}/></button>
                 </div>
                 
                 <div className="mt-8 grid grid-cols-2 gap-6 z-10 relative">
                    <div>
                       <p className="text-[9px] font-black uppercase opacity-60 mb-1">Tagihan Berjalan</p>
                       <p className="text-2xl font-black tracking-tighter">
                          {formatIDR(data.transactions.filter(t => t.cardId === selectedCardForStatement.id).reduce((acc, t) => acc + (t.type === TransactionType.EXPENSE ? t.amount : -t.amount), 0))}
                       </p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black uppercase opacity-60 mb-1">Sisa Limit</p>
                       <p className="text-2xl font-black tracking-tighter">
                          {formatIDR(selectedCardForStatement.limit - data.transactions.filter(t => t.cardId === selectedCardForStatement.id).reduce((acc, t) => acc + (t.type === TransactionType.EXPENSE ? t.amount : -t.amount), 0))}
                       </p>
                    </div>
                 </div>
              </div>

              {/* Body Statement */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-hide">
                 {/* Cicilan Aktif */}
                 <div>
                    <div className="flex items-center gap-2 mb-4">
                       <Calculator size={16} className="text-slate-400" />
                       <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Cicilan Aktif</h4>
                    </div>
                    <div className="space-y-3">
                       {data.installments.filter(i => i.cardId === selectedCardForStatement.id).map(inst => (
                          <div key={inst.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                             <div>
                                <p className="font-bold text-slate-800 text-sm mb-1">{inst.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Tenor: {inst.monthsPaid}/{inst.totalMonths} Bulan</p>
                             </div>
                             <div className="text-right">
                                <p className="font-black text-slate-800 text-sm">{formatIDR(inst.monthlyAmount)}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Per Bulan</p>
                             </div>
                          </div>
                       ))}
                       {data.installments.filter(i => i.cardId === selectedCardForStatement.id).length === 0 && (
                          <p className="text-[10px] text-center py-4 text-slate-300 italic font-bold">Tidak ada cicilan aktif</p>
                       )}
                    </div>
                 </div>

                 {/* Transaksi Bulan Ini */}
                 <div>
                    <div className="flex items-center gap-2 mb-4">
                       <CalendarDays size={16} className="text-slate-400" />
                       <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Transaksi Berjalan</h4>
                    </div>
                    <div className="space-y-4">
                       {data.transactions
                          .filter(t => t.cardId === selectedCardForStatement.id)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(t => (
                          <div key={t.id} className="flex justify-between items-start group">
                             <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                   {t.type === TransactionType.EXPENSE ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                                </div>
                                <div className="min-w-0">
                                   <p className="font-bold text-slate-800 text-sm mb-0.5 truncate">{t.description}</p>
                                   <div className="flex items-center gap-2">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                      {t.isValidated && <span className="bg-green-100 text-green-600 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Dibukukan</span>}
                                   </div>
                                </div>
                             </div>
                             <p className={`font-black text-sm tracking-tight ${t.type === TransactionType.EXPENSE ? 'text-red-600' : 'text-green-600'}`}>
                                {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                             </p>
                          </div>
                       ))}
                       {data.transactions.filter(t => t.cardId === selectedCardForStatement.id).length === 0 && (
                          <p className="text-[10px] text-center py-10 text-slate-300 italic font-bold">Belum ada transaksi</p>
                       )}
                    </div>
                 </div>
              </div>

              {/* Footer Statement */}
              <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
                 <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 py-3.5 rounded-2xl font-black text-xs uppercase shadow-sm active:scale-95 transition-all">
                    <Download size={16}/> Simpan PDF
                 </button>
                 <button className="bg-slate-800 text-white py-3.5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-slate-200 active:scale-95 transition-all">
                    Kirim Email
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};