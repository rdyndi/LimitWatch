import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { CreditCard, Transaction, TransactionType, Saving, Piutang as PiutangType, OwnerType } from './types';
import { useAppData } from './hooks/useAppData';
import { loginWithEmail, registerWithEmail, updateUserProfile, loginWithGoogle } from './services/firebase';
import { executeSaveTransaction, executeDeleteTransaction, executeSaveSaving, executeDeleteSaving, executeSavePiutang, executeDeletePiutang, SaveTransactionPayload } from './hooks/useTransactionService';
import { QuickRecordSheet, QuickRecordTab } from './components/QuickRecordSheet';
import { getAvailableSavings, getMonthlyBill } from './lib/billing';

// Feature Views
import { DashboardView } from './features/dashboard/DashboardView';
import { CardsView } from './features/cards/CardsView';
import { CardForm } from './features/cards/CardForm';
import { TransferForm } from './features/cards/TransferForm';
import { StatementView } from './features/cards/StatementView';
import { SavingsView } from './features/savings/SavingsView';
import { PiutangView } from './features/piutang/PiutangView';
import { YearlyView } from './features/yearly/YearlyView';
import { TransactionList } from './features/transactions/TransactionList';
import { ProfileView } from './features/profile/ProfileView';

import {
  Home,
  Briefcase,
  Vault,
  HandCoins,
  CalendarRange,
  History,
  User as UserIcon,
  Sun,
  Moon,
  LogOut,
  Wallet,
  ShieldCheck,
  Lock,
  Plus,
  ChevronLeft,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

// --- Pin Keypad Subcomponents ---
const PinIndicators = ({ length, iError }: { length: number; iError: boolean }) => (
  <div className="flex gap-4 justify-center my-8">
    {[0, 1, 2, 3, 4, 5].map((idx) => (
      <div
        key={idx}
        className={`w-4 h-4 rounded-full transition-all duration-300 ${
          idx < length
            ? iError
              ? 'bg-danger scale-125 shadow-md shadow-red-500/50'
              : 'bg-primary dark:bg-blue-400 scale-125 shadow-md shadow-blue-500/50'
            : 'bg-slate-200 dark:bg-slate-800'
        }`}
      />
    ))}
  </div>
);

const PinKeypad = ({ onAction }: { onAction: (val: string) => void }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];
  return (
    <div className="grid grid-cols-3 gap-6 max-w-xs mx-auto w-full">
      {keys.map((k, idx) => {
        if (k === '') return <div key={idx} />;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onAction(k)}
            className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black text-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all mx-auto shadow-xs"
          >
            {k === 'DEL' ? '⌫' : k}
          </button>
        );
      })}
    </div>
  );
};

// --- Desktop Navigation Item ---
const DesktopNavItem = ({
  icon,
  label,
  active,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
      active
        ? 'bg-primary text-white shadow-lg shadow-blue-500/25'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-100'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// --- Main Inner App Shell ---
const MainAppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appData = useAppData();

  const {
    user,
    setUser,
    authInited,
    data,
    saveData,
    isMobileDevice,
    toggleTheme,
    isLocked,
    pinInput,
    pinError,
    setupPinStep,
    setSetupPinStep,
    handlePinInput,
    deletePinInput,
    handleSetupPin,
    toggleTransactionValidation,
    toggleInstallmentValidation,
    updateTransactionOwner,
    updateInstallmentOwner,
    handleLogoutUser
  } = appData;

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // QuickRecord Sheet State
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [quickRecordTab, setQuickRecordTab] = useState<QuickRecordTab>('EXPENSE');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [editingPiutang, setEditingPiutang] = useState<PiutangType | null>(null);

  // Active Card for Form / Statement
  const [activeCard, setActiveCard] = useState<CreditCard | null>(null);

  // Toggle Visibility for Numbers
  const [showAmounts, setShowAmounts] = useState(true);

  const lastUsedCardId = data.transactions.length > 0 ? data.transactions[0].cardId : data.cards[0]?.id;
  const descriptionHistory = data.transactions.map((t) => t.description);

  // Open QuickRecord Sheet Helpers
  const openQuickRecord = (tab: QuickRecordTab = 'EXPENSE') => {
    setEditingTransaction(null);
    setEditingSaving(null);
    setEditingPiutang(null);
    setQuickRecordTab(tab);
    setIsQuickRecordOpen(true);
  };

  const openEditTransaction = (t: Transaction) => {
    setEditingSaving(null);
    setEditingPiutang(null);
    setEditingTransaction(t);
    setQuickRecordTab(t.type === TransactionType.PAYMENT ? 'PAYMENT' : 'EXPENSE');
    setIsQuickRecordOpen(true);
  };

  const openEditSaving = (s: Saving) => {
    setEditingTransaction(null);
    setEditingPiutang(null);
    setEditingSaving(s);
    setQuickRecordTab('SAVING');
    setIsQuickRecordOpen(true);
  };

  const openEditPiutang = (p: PiutangType) => {
    setEditingTransaction(null);
    setEditingSaving(null);
    setEditingPiutang(p);
    setQuickRecordTab('PIUTANG');
    setIsQuickRecordOpen(true);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
        if (displayName) await updateUserProfile(displayName);
      } else {
        await loginWithEmail(email, password);
      }
    } catch {
      setAuthError('Email atau password salah.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await loginWithGoogle();
    } catch {
      setAuthError('Gagal masuk dengan Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveTransactionFromSheet = (payload: SaveTransactionPayload) => {
    const savingsForPeriod = getAvailableSavings(data, payload.cardId, payload.targetMonth || 0, payload.targetYear || 0);
    const updated = executeSaveTransaction(data, payload, savingsForPeriod, editingTransaction);
    if (updated) {
      saveData(updated);
      setEditingTransaction(null);
      setIsQuickRecordOpen(false);
    }
  };

  const handleDeleteTransactionFromSheet = (id: string) => {
    if (window.confirm('Hapus transaksi ini secara permanen?')) {
      const updated = executeDeleteTransaction(data, id);
      saveData(updated);
      setEditingTransaction(null);
      setIsQuickRecordOpen(false);
    }
  };

  const handleSaveSavingFromSheet = (payload: {
    cardId: string;
    amount: number;
    note: string;
    targetMonth: number;
    targetYear: number;
  }) => {
    const updated = executeSaveSaving(data, payload, editingSaving);
    if (updated) {
      saveData(updated);
      setEditingSaving(null);
      setIsQuickRecordOpen(false);
    }
  };

  const handleDeleteSavingFromSheet = (id: string) => {
    if (window.confirm('Hapus catatan tabungan ini?')) {
      const updated = executeDeleteSaving(data, id);
      saveData(updated);
      setEditingSaving(null);
      setIsQuickRecordOpen(false);
    }
  };

  const handleSavePiutangFromSheet = (payload: {
    cardId: string;
    debtor: string;
    amount: number;
    note: string;
    targetMonth: number;
    targetYear: number;
    isInstallment: boolean;
    installmentMonths: number;
  }) => {
    const updated = executeSavePiutang(data, payload, editingPiutang);
    if (updated) {
      saveData(updated);
      setEditingPiutang(null);
      setIsQuickRecordOpen(false);
    }
  };

  const handleDeletePiutangFromSheet = (id: string) => {
    if (window.confirm('Hapus catatan piutang ini?')) {
      const updated = executeDeletePiutang(data, id);
      saveData(updated);
      setEditingPiutang(null);
      setIsQuickRecordOpen(false);
    }
  };

  if (!authInited) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (isLocked && isMobileDevice) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-950 rounded-2xl flex items-center justify-center mb-10 shadow-xl">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Masukkan PIN</h2>
        <p className={`text-sm font-bold mt-2 transition-colors ${pinError ? 'text-danger' : 'text-slate-400 dark:text-slate-500'}`}>
          {pinError ? 'PIN Salah, coba lagi' : 'Sesi terkunci karena tidak ada aktivitas'}
        </p>
        <PinIndicators length={pinInput.length} iError={pinError} />
        <PinKeypad onAction={(val) => (val === 'DEL' ? deletePinInput() : handlePinInput(val))} />
        <button
          type="button"
          onClick={handleLogoutUser}
          className="mt-12 text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest hover:text-danger transition"
        >
          Keluar Sesi
        </button>
      </div>
    );
  }

  if (setupPinStep !== 'OFF' && isMobileDevice) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 animate-in slide-in-from-bottom duration-500">
        <button
          type="button"
          onClick={() => {
            setSetupPinStep('OFF');
          }}
          className="absolute top-10 right-10 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-600 dark:text-slate-400"
        >
          ✕
        </button>
        <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-10 shadow-xl">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {setupPinStep === 'ENTER_NEW' ? 'Set PIN Baru' : 'Konfirmasi PIN'}
        </h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2">
          {setupPinStep === 'ENTER_NEW' ? 'Gunakan PIN 6-digit untuk keamanan' : 'Masukkan kembali PIN yang Anda buat'}
        </p>
        <PinIndicators length={pinInput.length} iError={false} />
        <PinKeypad onAction={(val) => (val === 'DEL' ? deletePinInput() : handleSetupPin(val))} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Wallet size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">LimitWatch</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Asisten cerdas pelunasan hutang.</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none focus:border-primary transition text-slate-800 dark:text-slate-100 font-bold text-sm"
                  placeholder="Nama Anda..."
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none focus:border-primary transition text-slate-800 dark:text-slate-100 font-bold text-sm"
                placeholder="email@domain.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none focus:border-primary transition text-slate-800 dark:text-slate-100 font-bold text-sm"
                placeholder="••••••••"
              />
            </div>
            {authError && (
              <p className="text-danger text-xs text-center font-black bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/40">
                {authError}
              </p>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-[22px] font-black text-base transition-all shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? 'Tunggu sebentar...' : isRegistering ? 'Buat Akun Sekarang' : 'Masuk Dashboard'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-300 dark:text-slate-700">Metode Lain</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3.5 rounded-[22px] font-black flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95 cursor-pointer text-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Lanjutkan dengan Google
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setAuthError('');
            }}
            className="w-full mt-6 text-xs text-primary dark:text-blue-400 font-black hover:underline cursor-pointer"
          >
            {isRegistering ? 'Punya akun? Masuk di sini' : 'Baru di LimitWatch? Daftar gratis'}
          </button>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname;
  const isDetailOrFormRoute = ['/statement', '/form-card', '/form-transfer', '/profile'].includes(currentPath);

  const getPageTitle = () => {
    switch (currentPath) {
      case '/':
        return 'Beranda';
      case '/cards':
        return 'Kartu & Liabilitas';
      case '/savings':
        return 'Tabungan';
      case '/piutangs':
        return 'Piutang';
      case '/yearly':
        return 'Anggaran Tahunan';
      case '/transactions':
        return 'Riwayat Aktivitas';
      case '/statement':
        return activeCard ? `Statement ${activeCard.name}` : 'Rincian Statement';
      case '/form-card':
        return activeCard ? 'Edit Kartu' : 'Tambah Kartu';
      case '/form-transfer':
        return 'Transfer Tabungan';
      case '/profile':
        return 'Profil Pengguna';
      default:
        return 'LimitWatch';
    }
  };

  return (
    <div className={`${data.theme === 'dark' ? 'dark' : ''} h-full`}>
      <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
        {/* SHARED DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-50">
          <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Wallet size={22} />
            </div>
            <span className="font-black text-2xl text-slate-800 dark:text-slate-100 tracking-tighter">LimitWatch</span>
          </div>

          <nav className="p-5 space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
            <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] mb-4 ml-2">
              Navigasi Utama
            </div>
            <DesktopNavItem icon={<Home size={22} />} label="Beranda" active={currentPath === '/'} onClick={() => navigate('/')} />
            <DesktopNavItem icon={<Briefcase size={22} />} label="Kartu & Hutang" active={currentPath === '/cards'} onClick={() => navigate('/cards')} />
            <DesktopNavItem icon={<Vault size={22} />} label="Tabungan" active={currentPath === '/savings'} onClick={() => navigate('/savings')} />
            <DesktopNavItem icon={<HandCoins size={22} />} label="Piutang" active={currentPath === '/piutangs'} onClick={() => navigate('/piutangs')} />
            <DesktopNavItem icon={<CalendarRange size={22} />} label="Anggaran Tahunan" active={currentPath === '/yearly'} onClick={() => navigate('/yearly')} />
            <DesktopNavItem icon={<History size={22} />} label="Riwayat Aktivitas" active={currentPath === '/transactions'} onClick={() => navigate('/transactions')} />
          </nav>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-4 w-full p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={20} className="text-slate-400 mx-auto mt-2" />
                )}
              </div>
              <div className="flex flex-col items-start overflow-hidden min-w-0">
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 truncate w-full">
                  {user.displayName || 'Pengguna'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Member</span>
              </div>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 w-full p-3 rounded-xl transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-bold"
            >
              {data.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span>{data.theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogoutUser}
              className="flex items-center gap-3 text-slate-500 hover:text-danger w-full p-3 rounded-xl transition hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-sm font-bold"
            >
              <LogOut size={20} />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </aside>

        {/* DYNAMIC MAIN CONTENT */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header
            className="flex-none bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-[60] sticky top-0"
            style={{ paddingTop: 'var(--sat, 0px)' }}
          >
            <div className="px-4 sm:px-8 h-16 flex justify-between items-center max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-3">
                {currentPath !== '/' && (
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-slate-500 dark:text-slate-400 active:scale-90 transition hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                  >
                    <ChevronLeft size={22} />
                  </button>
                )}
                <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {getPageTitle()}
                </h1>
              </div>

              {isMobileDevice && currentPath === '/' && (
                <button
                  onClick={() => navigate('/profile')}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={18} className="text-slate-400" />
                  )}
                </button>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-10 bg-slate-50 dark:bg-slate-950">
            <Routes>
              <Route
                path="/"
                element={
                  <DashboardView
                    data={data}
                    showAmounts={showAmounts}
                    onToggleShowAmounts={() => setShowAmounts(!showAmounts)}
                    onOpenQuickRecord={openQuickRecord}
                    onOpenCardForm={(card) => {
                      setActiveCard(card || null);
                      navigate('/form-card');
                    }}
                    onOpenStatement={(card) => {
                      setActiveCard(card);
                      navigate('/statement');
                    }}
                  />
                }
              />

              <Route
                path="/cards"
                element={
                  <CardsView
                    data={data}
                    showAmounts={showAmounts}
                    onOpenCardForm={(card) => {
                      setActiveCard(card || null);
                      navigate('/form-card');
                    }}
                    onOpenStatement={(card) => {
                      setActiveCard(card);
                      navigate('/statement');
                    }}
                    onDeleteCard={(cardId) => {
                      saveData({ ...data, cards: data.cards.filter((c) => c.id !== cardId) });
                    }}
                  />
                }
              />

              <Route
                path="/form-card"
                element={
                  <CardForm
                    data={data}
                    editingCard={activeCard}
                    onSave={(updatedData) => {
                      saveData(updatedData);
                      setActiveCard(null);
                      navigate(-1);
                    }}
                    onCancel={() => navigate(-1)}
                  />
                }
              />

              <Route
                path="/form-transfer"
                element={
                  <TransferForm
                    data={data}
                    defaultCardId={lastUsedCardId}
                    onSave={(updatedData) => {
                      saveData(updatedData);
                      navigate(-1);
                    }}
                    onCancel={() => navigate(-1)}
                  />
                }
              />

              <Route
                path="/statement"
                element={
                  activeCard ? (
                    <StatementView
                      data={data}
                      card={activeCard}
                      showAmounts={showAmounts}
                      onOpenQuickRecord={openQuickRecord}
                      onEditTransaction={openEditTransaction}
                      onToggleTransactionValidation={toggleTransactionValidation}
                      onToggleInstallmentValidation={toggleInstallmentValidation}
                      onUpdateTransactionOwner={updateTransactionOwner}
                      onUpdateInstallmentOwner={updateInstallmentOwner}
                    />
                  ) : (
                    <Navigate to="/cards" replace />
                  )
                }
              />

              <Route
                path="/savings"
                element={
                  <SavingsView
                    data={data}
                    showAmounts={showAmounts}
                    onOpenQuickRecord={() => openQuickRecord('SAVING')}
                    onOpenTransfer={() => navigate('/form-transfer')}
                    onEditSaving={openEditSaving}
                  />
                }
              />

              <Route
                path="/piutangs"
                element={
                  <PiutangView
                    data={data}
                    showAmounts={showAmounts}
                    onOpenQuickRecord={() => openQuickRecord('PIUTANG')}
                    onEditPiutang={openEditPiutang}
                  />
                }
              />

              <Route
                path="/yearly"
                element={
                  <YearlyView
                    data={data}
                    showAmounts={showAmounts}
                    onOpenStatement={(card) => {
                      setActiveCard(card);
                      navigate('/statement');
                    }}
                  />
                }
              />

              <Route
                path="/transactions"
                element={
                  <TransactionList
                    data={data}
                    showAmounts={showAmounts}
                    onEditTransaction={openEditTransaction}
                    onToggleValidation={toggleTransactionValidation}
                  />
                }
              />

              <Route
                path="/profile"
                element={
                  <ProfileView
                    user={user}
                    data={data}
                    onToggleTheme={toggleTheme}
                    onSetupPin={() => setSetupPinStep('ENTER_NEW')}
                    onLogout={handleLogoutUser}
                    onOpenHistory={() => navigate('/transactions')}
                  />
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* MOBILE BOTTOM NAVIGATION (4 Nav Items + Elevated Center (+) CTA) */}
          {!isDetailOrFormRoute && isMobileDevice && (
            <nav
              className="fixed left-0 right-0 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
              style={{ height: 'calc(60px + var(--sab, 0px))', paddingBottom: 'var(--sab, 0px)' }}
            >
              <div className="h-[60px] px-2 flex justify-around items-center max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1 cursor-pointer ${
                    currentPath === '/' ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Home size={20} />
                  <span className="text-[11px] font-bold tracking-tight leading-none">Beranda</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/cards')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1 cursor-pointer ${
                    currentPath === '/cards' ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Briefcase size={20} />
                  <span className="text-[11px] font-bold tracking-tight leading-none">Kartu</span>
                </button>

                {/* Elevated Center (+) Button */}
                <div className="flex items-center justify-center px-1">
                  <button
                    type="button"
                    onClick={() => openQuickRecord('EXPENSE')}
                    aria-label="Catat Transaksi Cepat"
                    className="w-12 h-12 -translate-y-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/35 active:scale-90 transition-all border-4 border-white dark:border-slate-950 cursor-pointer"
                  >
                    <Plus size={26} strokeWidth={2.75} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/savings')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1 cursor-pointer ${
                    currentPath === '/savings' ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Vault size={20} />
                  <span className="text-[11px] font-bold tracking-tight leading-none">Tabung</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/yearly')}
                  className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1 cursor-pointer ${
                    currentPath === '/yearly' ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <CalendarRange size={20} />
                  <span className="text-[11px] font-bold tracking-tight leading-none">Tahunan</span>
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>

      {/* QUICK RECORD BOTTOM SHEET */}
      <QuickRecordSheet
        isOpen={isQuickRecordOpen}
        onClose={() => {
          setIsQuickRecordOpen(false);
          setEditingTransaction(null);
          setEditingSaving(null);
          setEditingPiutang(null);
        }}
        initialTab={quickRecordTab}
        editingTransaction={editingTransaction}
        editingSaving={editingSaving}
        editingPiutang={editingPiutang}
        cards={data.cards}
        lastUsedCardId={lastUsedCardId}
        descriptionHistory={descriptionHistory}
        getAvailableSavings={(cardId, month, year) => getAvailableSavings(data, cardId, month, year)}
        getBillEstimate={(cardId, month, year) => getMonthlyBill(data, cardId, month, year)}
        onSaveTransaction={handleSaveTransactionFromSheet}
        onDeleteTransaction={handleDeleteTransactionFromSheet}
        onSaveSaving={handleSaveSavingFromSheet}
        onDeleteSaving={handleDeleteSavingFromSheet}
        onSavePiutang={handleSavePiutangFromSheet}
        onDeletePiutang={handleDeletePiutangFromSheet}
      />
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <MainAppShell />
    </HashRouter>
  );
}
