import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AppState, OwnerType } from '../types';
import { subscribeToAuth, subscribeToAppState, saveAppState, loginWithGoogle, logout } from '../services/firebase';

const INITIAL_APP_STATE: AppState = {
  cards: [],
  transactions: [],
  installments: [],
  savings: [],
  piutangs: [],
  theme: 'light',
  security: { pin: null, isPinEnabled: false }
};

export function useAppData() {
  const [user, setUser] = useState<User | null>(null);
  const [authInited, setAuthInited] = useState(false);
  const [data, setData] = useState<AppState>(INITIAL_APP_STATE);
  const [isMobileDevice, setIsMobileDevice] = useState(window.innerWidth < 768);

  // Security & PIN State
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [setupPinStep, setSetupPinStep] = useState<'OFF' | 'ENTER_NEW' | 'CONFIRM_NEW'>('OFF');
  const [tempPin, setTempPin] = useState('');
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const handleResize = () => setIsMobileDevice(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
      setAuthInited(true);
    });
    return () => unsubscribe();
  }, []);

  const sanitizeData = (state: AppState): AppState => {
    const validInstallments = (state.installments || []).filter(inst => {
      if (inst.transactionId) {
        return (state.transactions || []).some(t => t.id === inst.transactionId);
      }
      return (state.transactions || []).some(
        t => t.cardId === inst.cardId && t.description === inst.name && t.amount === inst.totalAmount && t.isInstallment
      );
    });

    const validSavings = (state.savings || []).map(s => ({
      ...s,
      amount: Number(s.amount) || 0,
      isTransferred: Boolean(s.isTransferred),
      // Do not guess or fabricate transferredAt for legacy records without dates
      transferredAt: s.transferredAt ? String(s.transferredAt) : undefined,
      usedAmount: s.usedAmount !== undefined ? Number(s.usedAmount) : (s.isTransferred ? Number(s.amount) : undefined),
      usedByTransactionId: s.usedByTransactionId ? String(s.usedByTransactionId) : undefined,
      splitFromSavingId: s.splitFromSavingId ? String(s.splitFromSavingId) : undefined
    }));

    const validPiutangs = (state.piutangs || []).map(p => ({
      ...p,
      amount: Number(p.amount) || 0,
      isCollected: Boolean(p.isCollected),
      // Do not guess or fabricate collectedAt for legacy records without dates
      collectedAt: p.collectedAt ? String(p.collectedAt) : undefined
    }));

    return {
      ...state,
      installments: validInstallments,
      savings: validSavings,
      piutangs: validPiutangs
    };
  };

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToAppState(user.uid, (newState) => {
        const cleanState = sanitizeData(newState);
        setData(cleanState);
        if (cleanState.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const saveData = (newData: AppState) => {
    const cleanData = sanitizeData(newData);
    setData(cleanData);
    if (user) saveAppState(user.uid, cleanData);
  };

  const toggleTheme = () => {
    const newTheme = data.theme === 'dark' ? 'light' : 'dark';
    const newData = { ...data, theme: newTheme };
    setData(newData);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveData(newData);
  };

  // Auto PIN lock after 10m inactivity
  useEffect(() => {
    if (!user || !data.security?.isPinEnabled || isLocked || !isMobileDevice) return;
    const checkInactivity = () => {
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      if (now - lastActivity > tenMinutes) {
        setIsLocked(true);
      }
    };
    const interval = setInterval(checkInactivity, 10000);
    const updateActivity = () => {
      setLastActivity(Date.now());
    };
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [user, data.security?.isPinEnabled, isLocked, lastActivity, isMobileDevice]);

  const handlePinInput = (num: string) => {
    if (pinInput.length >= 6) return;
    const newVal = pinInput + num;
    setPinInput(newVal);
    setPinError(false);
    if (newVal.length === 6) {
      if (newVal === data.security?.pin) {
        setIsLocked(false);
        setPinInput('');
        setLastActivity(Date.now());
      } else {
        setTimeout(() => {
          setPinError(true);
          setPinInput('');
        }, 200);
      }
    }
  };

  const deletePinInput = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleSetupPin = (num: string) => {
    if (pinInput.length >= 6) return;
    const newVal = pinInput + num;
    setPinInput(newVal);
    if (newVal.length === 6) {
      if (setupPinStep === 'ENTER_NEW') {
        setTimeout(() => {
          setTempPin(newVal);
          setPinInput('');
          setSetupPinStep('CONFIRM_NEW');
        }, 200);
      } else if (setupPinStep === 'CONFIRM_NEW') {
        if (newVal === tempPin) {
          saveData({ ...data, security: { pin: newVal, isPinEnabled: true } });
          setSetupPinStep('OFF');
          setPinInput('');
          setTempPin('');
        } else {
          setTimeout(() => {
            alert('PIN tidak cocok. Silakan ulangi.');
            setPinInput('');
            setSetupPinStep('ENTER_NEW');
          }, 200);
        }
      }
    }
  };

  const toggleTransactionValidation = (id: string) => {
    const updated = data.transactions.map(t => (t.id === id ? { ...t, isValidated: !t.isValidated } : t));
    saveData({ ...data, transactions: updated });
  };

  const toggleInstallmentValidation = (instId: string, monthKey: string) => {
    const updated = data.installments.map(inst => {
      if (inst.id !== instId) return inst;
      const current = inst.validatedTenors || [];
      const next = current.includes(monthKey) ? current.filter(k => k !== monthKey) : [...current, monthKey];
      return { ...inst, validatedTenors: next };
    });
    saveData({ ...data, installments: updated });
  };

  const updateTransactionOwner = (id: string, owner: OwnerType) => {
    const updatedTransactions = data.transactions.map(t => (t.id === id ? { ...t, owner } : t));
    const updatedInstallments = data.installments.map(inst => (inst.transactionId === id ? { ...inst, owner } : inst));
    saveData({ ...data, transactions: updatedTransactions, installments: updatedInstallments });
  };

  const updateInstallmentOwner = (instId: string, owner: OwnerType) => {
    const updatedInstallments = data.installments.map(inst => (inst.id === instId ? { ...inst, owner } : inst));
    saveData({ ...data, installments: updatedInstallments });
  };

  const handleLogoutUser = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      await logout();
      setUser(null);
      setData(INITIAL_APP_STATE);
      document.documentElement.classList.remove('dark');
    }
  };

  return {
    user,
    setUser,
    authInited,
    data,
    setData,
    saveData,
    isMobileDevice,
    toggleTheme,
    // PIN
    isLocked,
    setIsLocked,
    pinInput,
    pinError,
    setupPinStep,
    setSetupPinStep,
    handlePinInput,
    deletePinInput,
    handleSetupPin,
    // Validations & Owners
    toggleTransactionValidation,
    toggleInstallmentValidation,
    updateTransactionOwner,
    updateInstallmentOwner,
    handleLogoutUser
  };
}
