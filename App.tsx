import React, { useState, useEffect } from "react";
import { 
  AppState, 
  Installment, 
  Transaction, 
  TransactionType,
  CreditCard as CreditCardType
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
  ArrowRight
} from "lucide-react";

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

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
  const [mobileTab, setMobileTab] = useState<'home' | 'cards' | 'history' | 'profile'>('home');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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
      // Auth subscription will handle the user state update
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Wallet size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Dompet Cerdas</h1>
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

  return (
    <>
      {/* ========================================= */}
      {/* DESKTOP VIEW (Original - Preserved)       */}
      {/* ========================================= */}
      <div className="hidden md:block app-container" style={{ padding: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1>Dompet Cerdas</h1>
          <div>
            <span>{user.displayName || user.email}</span>
            <button onClick={() => logout()} style={{ marginLeft: 10 }}>Logout</button>
          </div>
        </header>
        
        <main>
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => setInstallmentModalOpen(true)}>Add Installment</button>
            <button onClick={handleGetAdvice} style={{ marginLeft: 10 }}>Ask AI</button>
          </div>

          {loadingAi && <p>Loading AI advice...</p>}
          {aiAdvice && (
            <div style={{ background: '#f0f9ff', padding: 15, borderRadius: 8, marginBottom: 20, whiteSpace: 'pre-line' }}>
              <h3>Saran Keuangan:</h3>
              {aiAdvice}
            </div>
          )}

          <section>
            <h2>Transactions</h2>
            <ul>
              {data.transactions.map(t => (
                <li key={t.id}>{t.description}: {formatIDR(t.amount)}</li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      {/* ========================================= */}
      {/* MOBILE SUPER APP VIEW                     */}
      {/* ========================================= */}
      <div className="md:hidden min-h-screen bg-slate-50 font-sans pb-24">
        
        {/* --- Header (Shared across tabs) --- */}
        <header className="bg-white px-5 pt-8 pb-4 sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">Selamat Datang,</p>
              <h2 className="text-xl font-bold text-slate-800">
                {user.displayName ? user.displayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'User')}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={20} className="text-slate-400" />
              )}
            </div>
          </div>
        </header>

        {/* --- HOME TAB CONTENT --- */}
        {mobileTab === 'home' && (
          <div className="px-5 space-y-6 mt-4">
            
            {/* Financial Summary Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <p className="text-blue-100 text-sm mb-1">Total Hutang Berjalan</p>
                <h3 className="text-3xl font-bold mb-4">{formatIDR(totalDebt)}</h3>
                
                <div className="flex gap-4 border-t border-white/20 pt-4">
                  <div>
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

            {/* Quick Actions Grid (Gojek Style) */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Menu Utama</h3>
              <div className="grid grid-cols-4 gap-4">
                <button 
                  onClick={() => {/* Logic to add transaction */}} 
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shadow-sm">
                    <PlusCircle size={24} />
                  </div>
                  <span className="text-xs text-slate-600 font-medium text-center">Catat<br/>Belanja</span>
                </button>

                <button 
                  onClick={() => setInstallmentModalOpen(true)} 
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                    <LayoutGrid size={24} />
                  </div>
                  <span className="text-xs text-slate-600 font-medium text-center">Cicilan<br/>Baru</span>
                </button>

                <button 
                  onClick={handleGetAdvice} 
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Sparkles size={24} />
                  </div>
                  <span className="text-xs text-slate-600 font-medium text-center">Tanya<br/>AI</span>
                </button>

                <button 
                  onClick={() => setMobileTab('cards')} 
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <CreditCard size={24} />
                  </div>
                  <span className="text-xs text-slate-600 font-medium text-center">Kelola<br/>Kartu</span>
                </button>
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

        {/* --- CARDS TAB CONTENT --- */}
        {mobileTab === 'cards' && (
          <div className="px-5 mt-4 space-y-4">
             <h3 className="font-bold text-lg text-slate-800">Kartu Kredit Saya</h3>
             {data.cards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <CreditCard className="mx-auto text-slate-300 mb-2" size={48} />
                  <p className="text-slate-500">Belum ada kartu kredit</p>
                </div>
             ) : (
                data.cards.map(card => (
                  <div key={card.id} className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden h-48 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <span className="font-medium tracking-wider">{card.name}</span>
                        <CreditCard size={20} className="opacity-80"/>
                     </div>
                     <div>
                        <p className="text-xs text-slate-400 mb-1">Limit Kartu</p>
                        <p className="text-xl font-bold tracking-widest">{formatIDR(card.limit)}</p>
                     </div>
                     <div className="flex justify-between items-end">
                        <div className="text-xs text-slate-400">
                          {card.dueDay ? `Jatuh Tempo: Tgl ${card.dueDay}` : 'No Due Date'}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20"></div>
                     </div>
                  </div>
                ))
             )}
             <button className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-medium flex items-center justify-center gap-2">
                <PlusCircle size={18} /> Tambah Kartu Baru
             </button>
          </div>
        )}

        {/* --- HISTORY TAB CONTENT --- */}
        {mobileTab === 'history' && (
           <div className="px-5 mt-4">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Riwayat Transaksi</h3>
              <div className="space-y-3">
                {data.transactions.map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border-b border-slate-50 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">{t.description}</p>
                      <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('id-ID', { dateStyle: 'full'})}</p>
                    </div>
                    <span className={`font-semibold ${t.type === TransactionType.EXPENSE ? 'text-red-500' : 'text-green-500'}`}>
                      {t.type === TransactionType.EXPENSE ? '-' : '+'} {formatIDR(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
           </div>
        )}

        {/* --- PROFILE TAB CONTENT --- */}
        {mobileTab === 'profile' && (
          <div className="px-5 mt-4">
             <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden">
                   {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={32} className="m-auto mt-4 text-slate-400" />
                    )}
                </div>
                <div>
                   <h3 className="font-bold text-slate-800">{user.displayName || user.email}</h3>
                   <p className="text-sm text-slate-500">{user.email}</p>
                </div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100">
                   <div className="flex items-center gap-3 text-slate-700">
                      <CreditCard size={18} /> <span>Pengaturan Kartu</span>
                   </div>
                   <ChevronRight size={16} className="text-slate-400" />
                </button>
                <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100">
                   <div className="flex items-center gap-3 text-slate-700">
                      <Wallet size={18} /> <span>Target Tabungan</span>
                   </div>
                   <ChevronRight size={16} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => logout()}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-red-50 text-red-600"
                >
                   <div className="flex items-center gap-3">
                      <LogOut size={18} /> <span>Keluar Aplikasi</span>
                   </div>
                </button>
             </div>
          </div>
        )}

        {/* --- BOTTOM NAVIGATION --- */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-[80px]">
          <button 
            onClick={() => setMobileTab('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <Home size={24} strokeWidth={mobileTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Beranda</span>
          </button>
          
          <button 
            onClick={() => setMobileTab('cards')}
            className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'cards' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <CreditCard size={24} strokeWidth={mobileTab === 'cards' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Kartu</span>
          </button>

          <div className="relative -top-6">
             <button 
               onClick={() => {
                 // Open add menu or modal
                 setInstallmentModalOpen(true);
               }}
               className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 active:scale-95 transition-transform"
             >
                <PlusCircle size={28} />
             </button>
          </div>

          <button 
            onClick={() => setMobileTab('history')}
            className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'history' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <History size={24} strokeWidth={mobileTab === 'history' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Riwayat</span>
          </button>

          <button 
            onClick={() => setMobileTab('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <UserIcon size={24} strokeWidth={mobileTab === 'profile' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Akun</span>
          </button>
        </nav>
      </div>

      {/* --- MODAL (Shared logic, improved UI for mobile) --- */}
      {installmentModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Tambah Simulasi Cicilan</h3>
            <div className="space-y-4">
               <p className="text-sm text-slate-500">Fitur ini mensimulasikan penambahan cicilan manual untuk testing.</p>
               
               <button 
                 onClick={() => {
                   const mockInstallment: Installment = {
                     id: generateId(),
                     cardId: data.cards[0]?.id || 'unknown_card',
                     name: 'iPhone 15 Pro',
                     totalAmount: 20000000,
                     monthlyAmount: 1666666,
                     totalMonths: 12,
                     monthsPaid: 0,
                     startDate: new Date().toISOString()
                   };
                   addInstallment(mockInstallment);
                 }}
                 className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
               >
                 Simpan Simulasi
               </button>
               <button 
                 onClick={() => setInstallmentModalOpen(false)} 
                 className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-200"
               >
                 Batal
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;