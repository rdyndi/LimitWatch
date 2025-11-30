import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CreditCard as CardIcon, 
  LayoutDashboard, 
  List, 
  CalendarClock, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowRightLeft, 
  TrendingUp, 
  Wallet,
  CheckCircle,
  Cloud,
  LogOut,
  Loader2,
  AlertTriangle,
  Bell,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Mail,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppState, CreditCard, Transaction, Installment, Saving, TransactionType, ViewMode } from './types';
import { 
  subscribeToAppState, 
  saveAppState, 
  subscribeToAuth, 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  logout 
} from './services/firebase';

// --- Utility Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

// --- Icons ---
const ChickenIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22v-2" />
    <path d="M16 22v-3" />
    <path d="M12 20c0-5-3-6-6-6 1-3 4-6 9-7 3 0 5 3 5 5 0 2.5-2.5 4.5-6 5" />
    <path d="M17 6c-1-2-3-2-3-2" />
    <circle cx="16" cy="8" r="1" />
    <path d="M9 20c-1.5 0-3 .5-4 1.5" />
  </svg>
);

// --- Initial State ---
const initialState: AppState = {
  cards: [],
  transactions: [],
  installments: [],
  savings: []
};

// --- Components ---

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle size={28} />
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-slate-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg shadow-red-200 transition-colors"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

const CardForm = ({ onSave, onCancel, initialData }: { onSave: (c: CreditCard) => void, onCancel: () => void, initialData?: CreditCard }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [limit, setLimit] = useState(initialData?.limit?.toString() || '');
  const [color, setColor] = useState(initialData?.color || '#3b82f6');
  const [dueDay, setDueDay] = useState(initialData?.dueDay?.toString() || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit Kartu' : 'Tambah Kartu Baru'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kartu / Bank</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" placeholder="Contoh: BCA Visa Batman" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Limit Kredit (Rp)</label>
                <input type="number" value={limit} onChange={e => setLimit(e.target.value)} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" placeholder="20000000" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tgl Jatuh Tempo</label>
                <input 
                  type="number" 
                  min="1" 
                  max="31" 
                  value={dueDay} 
                  onChange={e => setDueDay(e.target.value)} 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" 
                  placeholder="Tgl (1-31)" 
                />
                <p className="text-[10px] text-slate-500 mt-1">Tanggal harus bayar setiap bulan.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Warna Penanda</label>
            <div className="flex gap-2">
              {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
            <button onClick={() => onSave({ id: initialData?.id || generateId(), name, limit: Number(limit), color, dueDay: dueDay ? Number(dueDay) : undefined })} disabled={!name || !limit} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TransactionResult {
    transaction: Transaction;
    installment?: Installment;
    usedSavingsAmount?: number; // Amount taken from savings
}

const TransactionForm = ({ 
  cards, 
  savings, 
  onSave, 
  onCancel, 
  initialData 
}: { 
  cards: CreditCard[], 
  savings: Saving[],
  onSave: (res: TransactionResult) => void, 
  onCancel: () => void, 
  initialData?: Transaction 
}) => {
  const [cardId, setCardId] = useState(initialData?.cardId || cards[0]?.id || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
  
  // Installment option state (only for new expenses)
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentMonths, setInstallmentMonths] = useState('3');

  // Payment Specific State
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth());
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  
  // Savings Usage State
  const [useSavings, setUseSavings] = useState(false);
  const [savingsUsedAmount, setSavingsUsedAmount] = useState('');
  const [transferUsedAmount, setTransferUsedAmount] = useState('');

  const isEditMode = !!initialData;

  // Calculate available savings for selected card
  const availableSavings = useMemo(() => {
      return savings
        .filter(s => s.cardId === cardId && !s.isTransferred)
        .reduce((sum, s) => sum + s.amount, 0);
  }, [savings, cardId]);

  // Auto calculate total when saving/transfer parts change
  useEffect(() => {
      if (type === TransactionType.PAYMENT && useSavings) {
          const s = Number(savingsUsedAmount) || 0;
          const t = Number(transferUsedAmount) || 0;
          setAmount((s + t).toString());
      }
  }, [savingsUsedAmount, transferUsedAmount, type, useSavings]);

  const handleSubmit = () => {
      const transaction: Transaction = { 
          id: initialData?.id || generateId(), 
          cardId, 
          amount: Number(amount), 
          date, 
          description, 
          type,
          isInstallment: type === TransactionType.EXPENSE && isInstallment,
          targetPeriod: type === TransactionType.PAYMENT ? { month: targetMonth, year: targetYear } : undefined,
          isValidated: initialData?.isValidated || false
      };

      let installment: Installment | undefined = undefined;

      if (!isEditMode && type === TransactionType.EXPENSE && isInstallment && installmentMonths) {
          let instStartDate = date;
          const card = cards.find(c => c.id === cardId);
          
          if (card && card.dueDay) {
              const tDate = new Date(date);
              const tDay = tDate.getDate();
              if (tDay > card.dueDay) {
                  tDate.setMonth(tDate.getMonth() + 1);
                  instStartDate = tDate.toISOString().split('T')[0];
              }
          }

          const totalMonths = Number(installmentMonths);
          installment = {
              id: generateId(),
              cardId,
              name: description,
              totalAmount: Number(amount),
              totalMonths: totalMonths,
              monthlyAmount: Number(amount) / totalMonths,
              monthsPaid: 0,
              startDate: instStartDate
          };
      }

      onSave({ 
          transaction, 
          installment,
          usedSavingsAmount: (type === TransactionType.PAYMENT && useSavings) ? Number(savingsUsedAmount) : 0
      });
  };

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">{isEditMode ? 'Edit Transaksi' : 'Catat Transaksi'}</h3>
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-2 rounded-md text-sm font-medium ${type === TransactionType.EXPENSE ? 'bg-white shadow text-danger' : 'text-slate-500'}`}>Pengeluaran</button>
            <button onClick={() => setType(TransactionType.PAYMENT)} className={`flex-1 py-2 rounded-md text-sm font-medium ${type === TransactionType.PAYMENT ? 'bg-white shadow text-success' : 'text-slate-500'}`}>Bayar Tagihan</button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Kartu</label>
            <select value={cardId} onChange={e => setCardId(e.target.value)} className="w-full border rounded-lg p-2 bg-white">
              {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Transaksi</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg p-2" placeholder={type === TransactionType.EXPENSE ? "Beli Makan, Tiket..." : "Bayar tagihan..."} />
          </div>

          {type === TransactionType.PAYMENT && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                      <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tagihan Bulan</label>
                          <select value={targetMonth} onChange={e => setTargetMonth(Number(e.target.value))} className="w-full text-sm border rounded p-2">
                              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tahun</label>
                          <input type="number" value={targetYear} onChange={e => setTargetYear(Number(e.target.value))} className="w-full text-sm border rounded p-2" />
                      </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                     <div className="flex items-center gap-2 mb-2">
                        <input 
                            id="useSavings" 
                            type="checkbox" 
                            checked={useSavings} 
                            onChange={e => setUseSavings(e.target.checked)} 
                            className="w-4 h-4 text-success rounded"
                        />
                        <label htmlFor="useSavings" className="text-sm font-bold text-slate-700">Bayar dari Simpanan?</label>
                     </div>

                     {useSavings ? (
                         <div className="pl-6 space-y-2">
                             <p className="text-xs text-slate-500">Saldo Simpanan: <span className="font-bold text-emerald-600">{formatIDR(availableSavings)}</span></p>
                             <div>
                                <label className="block text-xs text-slate-600">Ambil dari Simpanan</label>
                                <input 
                                    type="number" 
                                    max={availableSavings}
                                    value={savingsUsedAmount} 
                                    onChange={e => setSavingsUsedAmount(e.target.value)} 
                                    className="w-full text-sm border border-emerald-300 rounded p-1.5 bg-emerald-50" 
                                    placeholder="0"
                                />
                             </div>
                             <div>
                                <label className="block text-xs text-slate-600">Tambah Transfer/Cash</label>
                                <input 
                                    type="number" 
                                    value={transferUsedAmount} 
                                    onChange={e => setTransferUsedAmount(e.target.value)} 
                                    className="w-full text-sm border rounded p-1.5" 
                                    placeholder="0"
                                />
                             </div>
                         </div>
                     ) : null}
                  </div>
              </div>
          )}

          <div className={`${(type === TransactionType.PAYMENT && useSavings) ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="block text-sm font-medium text-slate-700 mb-1">Total Nominal (Rp)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded-lg p-2 font-bold" readOnly={type === TransactionType.PAYMENT && useSavings} />
          </div>

          {!isEditMode && type === TransactionType.EXPENSE && (
              <div className="border-t pt-4 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                      <input 
                        id="isInstallment" 
                        type="checkbox" 
                        checked={isInstallment} 
                        onChange={e => setIsInstallment(e.target.checked)}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <label htmlFor="isInstallment" className="text-sm font-bold text-slate-700 flex items-center gap-1">
                          <CalendarClock size={14} /> Jadikan Cicilan?
                      </label>
                  </div>

                  {isInstallment && (
                      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 space-y-3">
                          <div>
                              <label className="block text-xs font-medium text-indigo-900 mb-1">Lama Cicilan (Bulan)</label>
                              <input 
                                type="number" 
                                min="2" 
                                value={installmentMonths} 
                                onChange={e => setInstallmentMonths(e.target.value)} 
                                className="w-full border border-indigo-200 rounded-md p-2 text-sm"
                                placeholder="Contoh: 3, 6, 12..."
                              />
                          </div>
                          {amount && installmentMonths && (
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-indigo-700">Estimasi per bulan:</span>
                                  <span className="font-bold text-indigo-900">{formatIDR(Number(amount) / Number(installmentMonths))}</span>
                              </div>
                          )}
                          <p className="text-[10px] text-indigo-500">
                              *Transaksi ini akan tercatat tapi tidak dihitung full di laporan bulanan, melainkan dibagi sesuai tenor.
                              <br/>
                              *Jika tanggal transaksi melewati Jatuh Tempo, cicilan dimulai periode berikutnya.
                          </p>
                      </div>
                  )}
              </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
            <button onClick={handleSubmit} disabled={!amount || !cardId} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SavingForm = ({ cards, onSave, onCancel }: { cards: CreditCard[], onSave: (s: Saving) => void, onCancel: () => void }) => {
  const [cardId, setCardId] = useState(cards[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-2 mb-4 text-emerald-600">
            <ChickenIcon size={24} />
            <h3 className="text-xl font-bold">Input Simpanan</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Uang ini disimpan (disisihkan) untuk membayar tagihan kartu kredit tertentu nanti.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Kartu</label>
            <select value={cardId} onChange={e => setCardId(e.target.value)} className="w-full border rounded-lg p-2 bg-white">
              {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Simpanan (Rp)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Simpan</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full border rounded-lg p-2" placeholder="Sisa gaji bulan ini..." />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
            <button onClick={() => onSave({ id: generateId(), cardId, amount: Number(amount), date, note, isTransferred: false })} disabled={!amount || !cardId} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">Simpan Uang</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InstallmentForm = ({ cards, onSave, onCancel }: { cards: CreditCard[], onSave: (i: Installment) => void, onCancel: () => void }) => {
    const [cardId, setCardId] = useState(cards[0]?.id || '');
    const [name, setName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [totalMonths, setTotalMonths] = useState('12');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const monthly = Number(totalAmount) / Number(totalMonths);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Tambah Cicilan Baru</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kartu</label>
                        <select value={cardId} onChange={e => setCardId(e.target.value)} className="w-full border rounded-lg p-2 bg-white">
                            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Barang</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2" placeholder="iPhone 15, Kulkas..." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Total Harga</label>
                            <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full border rounded-lg p-2" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tenor (Bulan)</label>
                            <input 
                                type="number" 
                                min="2" 
                                value={totalMonths} 
                                onChange={e => setTotalMonths(e.target.value)} 
                                className="w-full border rounded-lg p-2"
                                placeholder="Contoh: 12"
                            />
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border">
                        <p className="text-sm text-slate-500">Estimasi Cicilan per Bulan:</p>
                        <p className="text-lg font-bold text-slate-800">{formatIDR(monthly || 0)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mulai Tanggal</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-lg p-2" />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                        <button onClick={() => onSave({ id: generateId(), cardId, name, totalAmount: Number(totalAmount), monthlyAmount: monthly, totalMonths: Number(totalMonths), monthsPaid: 0, startDate })} disabled={!totalAmount || !name} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">Simpan Cicilan</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const AuthScreen = ({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      let user;
      if (isRegister) {
        user = await registerWithEmail(email, password);
      } else {
        user = await loginWithEmail(email, password);
      }
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Gagal autentikasi email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center bg-primary text-white">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Wallet size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold">DompetCerdas</h1>
          <p className="text-blue-100 mt-2">Kelola Kartu Kredit & Hutang dengan Bijak</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  placeholder="******"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-medium hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (isRegister ? 'Daftar Akun Baru' : 'Masuk')}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs text-slate-400 font-medium">ATAU</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className="w-full border border-slate-300 bg-white text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Masuk dengan Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} 
            <button onClick={() => setIsRegister(!isRegister)} className="text-primary font-bold ml-1 hover:underline">
              {isRegister ? 'Login disini' : 'Daftar disini'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [view, setView] = useState<ViewMode>('DASHBOARD');
  const [data, setData] = useState<AppState>(initialState);
  
  // Loading & Sync States
  const [isLoading, setIsLoading] = useState(true);
  const isRemoteUpdate = useRef(false);

  // Modals
  const [isCardModalOpen, setCardModalOpen] = useState(false);
  const [isTransModalOpen, setTransModalOpen] = useState(false);
  const [isSavingModalOpen, setSavingModalOpen] = useState(false);
  const [isInstallmentModalOpen, setInstallmentModalOpen] = useState(false);
  
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

  // Confirmation State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // --- Auth Subscription ---
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
      
      // If no user, stop loading data spin (handled by view transition)
      if (!currentUser) {
        setIsLoading(false); 
      } else {
        setIsLoading(true); // Start loading data for this user
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Core Calculation Logic ---
  
  const calculatePeriodBill = (cardId: string, month: number, year: number) => {
      const card = data.cards.find(c => c.id === cardId);
      const dueDay = card?.dueDay || 31;

      const oneTimeSum = data.transactions
          .filter(t => {
              if (t.cardId !== cardId || t.type !== TransactionType.EXPENSE || t.isInstallment) return false;
              
              const tDate = new Date(t.date);
              const tDay = tDate.getDate();
              const tMonth = tDate.getMonth();
              const tYear = tDate.getFullYear();

              let billingMonth = tMonth;
              let billingYear = tYear;

              if (tDay > dueDay) {
                  billingMonth += 1;
                  if (billingMonth > 11) {
                      billingMonth = 0;
                      billingYear += 1;
                  }
              }

              return billingMonth === month && billingYear === year;
          })
          .reduce((sum, t) => sum + t.amount, 0);

      const installmentSum = data.installments
          .filter(inst => {
                if (inst.cardId !== cardId) return false;
                
                const start = new Date(inst.startDate);
                const startTotalMonths = (start.getFullYear() * 12) + start.getMonth();
                const currentTotalMonths = (year * 12) + month;
                const endTotalMonths = startTotalMonths + inst.totalMonths;

                return currentTotalMonths >= startTotalMonths && currentTotalMonths < endTotalMonths;
          })
          .reduce((sum, inst) => sum + inst.monthlyAmount, 0);

      const paymentSum = data.transactions
          .filter(t => 
              t.cardId === cardId &&
              t.type === TransactionType.PAYMENT &&
              t.targetPeriod &&
              t.targetPeriod.month === month &&
              t.targetPeriod.year === year
          )
          .reduce((sum, t) => sum + t.amount, 0);

      return (oneTimeSum + installmentSum) - paymentSum;
  };

  // 1. Realtime Sync Subscription (User Specific)
  useEffect(() => {
    if (!user) return;

    // Subscribe to Firebase Firestore for the specific User ID
    const unsubscribe = subscribeToAppState(user.uid, (newData) => {
      isRemoteUpdate.current = true;
      setData(newData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Auto-Save to Firebase (User Specific)
  useEffect(() => {
    if (isLoading || !user) return; 
    
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveAppState(user.uid, data);
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, isLoading, user]);


  // 3. Sync Installments Progress
  useEffect(() => {
    if (isLoading || !user) return;

    const syncInstallmentProgress = () => {
        let hasUpdates = false;

        const newInstallments = data.installments.map(inst => {
            const start = new Date(inst.startDate);
            let paidCount = 0;

            for (let i = 0; i < inst.totalMonths; i++) {
                let m = start.getMonth() + i;
                let y = start.getFullYear();
                
                const addYears = Math.floor(m / 12);
                m = m % 12;
                y = y + addYears;

                const remainingBill = calculatePeriodBill(inst.cardId, m, y);

                if (remainingBill <= 1000) {
                    paidCount++;
                }
            }

            if (paidCount > inst.totalMonths) paidCount = inst.totalMonths;

            if (paidCount !== inst.monthsPaid) {
                hasUpdates = true;
                return { ...inst, monthsPaid: paidCount };
            }
            return inst;
        });

        if (hasUpdates) {
            setData(prev => ({ ...prev, installments: newInstallments }));
        }
    };

    syncInstallmentProgress();
  }, [data.transactions, data.cards, user, isLoading]); 

  // Actions
  const addOrUpdateCard = (card: CreditCard) => {
    if (editingCard) {
      setData(prev => ({ ...prev, cards: prev.cards.map(c => c.id === card.id ? card : c) }));
    } else {
      setData(prev => ({ ...prev, cards: [...prev.cards, card] }));
    }
    setCardModalOpen(false);
    setEditingCard(undefined);
  };

  const handleDeleteCardClick = (id: string) => {
    setConfirmModal({
        isOpen: true,
        title: 'Hapus Kartu Kredit?',
        message: 'Tindakan ini akan menghapus kartu beserta SEMUA riwayat transaksi, cicilan, dan simpanan yang terkait dengan kartu ini. Data tidak dapat dikembalikan.',
        onConfirm: () => {
             setData(prev => ({
                ...prev,
                cards: prev.cards.filter(c => c.id !== id),
                transactions: prev.transactions.filter(t => t.cardId !== id),
                installments: prev.installments.filter(i => i.cardId !== id),
                savings: prev.savings.filter(s => s.cardId !== id)
              }));
              setConfirmModal(prev => ({...prev, isOpen: false}));
        }
    });
  };

  const handleSaveTransaction = (result: TransactionResult) => {
    setData(prev => {
        // 1. Handle Transaction
        let newTransactions = [...prev.transactions];
        if (editingTransaction) {
            newTransactions = newTransactions.map(t => t.id === result.transaction.id ? result.transaction : t);
        } else {
            newTransactions = [result.transaction, ...newTransactions];
        }

        // 2. Handle Installment (Create New)
        let newInstallments = [...prev.installments];
        if (result.installment) {
            newInstallments = [result.installment, ...newInstallments];
        }

        // 3. Handle Savings Deduction
        let newSavings = [...prev.savings];
        if (result.usedSavingsAmount && result.usedSavingsAmount > 0) {
            let remainingToDeduct = result.usedSavingsAmount;
            
            const availableSavings = newSavings
                .filter(s => s.cardId === result.transaction.cardId && !s.isTransferred)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            for (const saving of availableSavings) {
                if (remainingToDeduct <= 0) break;

                if (saving.amount <= remainingToDeduct) {
                    saving.isTransferred = true;
                    saving.note += ` (Terpakai: ${formatDate(result.transaction.date)})`;
                    remainingToDeduct -= saving.amount;
                } else {
                    const originalAmount = saving.amount;
                    saving.amount = remainingToDeduct;
                    saving.isTransferred = true;
                    saving.note += ` (Bagian terpakai)`;
                    
                    const newSavingEntry: Saving = {
                        id: generateId(),
                        cardId: saving.cardId,
                        amount: originalAmount - remainingToDeduct,
                        date: saving.date,
                        note: saving.note.replace(' (Bagian terpakai)', '') + ' (Sisa)',
                        isTransferred: false
                    };
                    newSavings.push(newSavingEntry);
                    
                    remainingToDeduct = 0;
                }
            }
        }

        return {
            ...prev,
            transactions: newTransactions,
            installments: newInstallments,
            savings: newSavings
        };
    });

    setTransModalOpen(false);
    setEditingTransaction(undefined);
  };

  const handleDeleteTransactionClick = (id: string) => {
      setConfirmModal({
          isOpen: true,
          title: 'Hapus Transaksi',
          message: 'Apakah Anda yakin ingin menghapus catatan transaksi ini? Saldo kartu akan disesuaikan kembali.',
          onConfirm: () => {
              setData(prev => ({
                ...prev,
                transactions: prev.transactions.filter(t => t.id !== id)
              }));
              setConfirmModal(prev => ({...prev, isOpen: false}));
          }
      });
  };
  
  const handleDeleteSavingClick = (id: string) => {
      setConfirmModal({
          isOpen: true,
          title: 'Hapus Simpanan',
          message: 'Apakah Anda yakin ingin menghapus data simpanan ini?',
          onConfirm: () => {
              setData(prev => ({
                  ...prev,
                  savings: prev.savings.filter(s => s.id !== id)
              }));
              setConfirmModal(prev => ({...prev, isOpen: false}));
          }
      });
  }

  const handleDeleteInstallmentClick = (id: string) => {
      setConfirmModal({
          isOpen: true,
          title: 'Hapus Cicilan',
          message: 'Apakah Anda yakin ingin menghapus cicilan ini? Tagihan bulanan di masa depan tidak akan dihitung lagi.',
          onConfirm: () => {
              setData(prev => ({
                  ...prev,
                  installments: prev.installments.filter(i => i.id !== id)
              }));
              setConfirmModal(prev => ({...prev, isOpen: false}));
          }
      });
  }

  const toggleTransactionValidation = (id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => 
        t.id === id ? { ...t, isValidated: !t.isValidated } : t
      )
    }));
  };

  const addSaving = (saving: Saving) => {
    setData(prev => ({ ...prev, savings: [saving, ...prev.savings] }));
    setSavingModalOpen(false);
  };

  const addInstallment = (inst: Installment) => {
      setData(prev => ({ ...prev, installments: [inst, ...prev.installments]}));
      setInstallmentModalOpen(false);
  }

  const executeTransfer = (saving: Saving) => {
      if (confirm(`Transfer ${formatIDR(saving.amount)} ke pembayaran kartu sekarang?`)) {
          setData(prev => {
              const newSavings = prev.savings.map(s => s.id === saving.id ? { ...s, isTransferred: true, note: s.note + ` (Terpakai: ${formatDate(new Date().toISOString())})` } : s);
              const newTrans: Transaction = {
                  id: generateId(),
                  cardId: saving.cardId,
                  amount: saving.amount,
                  date: new Date().toISOString().split('T')[0],
                  description: `Bayar pakai simpanan (${saving.note})`,
                  type: TransactionType.PAYMENT,
                  category: 'Auto-Transfer',
                  targetPeriod: { month: new Date().getMonth(), year: new Date().getFullYear() },
                  isValidated: true
              };
              return {
                  ...prev,
                  savings: newSavings,
                  transactions: [newTrans, ...prev.transactions]
              };
          });
      }
  };

  // Derived Data & Views Calculations (Same as before)
  const getCardBalance = (cardId: string) => {
    const expenses = data.transactions
      .filter(t => t.cardId === cardId && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    const payments = data.transactions
      .filter(t => t.cardId === cardId && t.type === TransactionType.PAYMENT)
      .reduce((sum, t) => sum + t.amount, 0);
    return expenses - payments;
  };

  const getCardSavings = (cardId: string) => {
      return data.savings
        .filter(s => s.cardId === cardId && !s.isTransferred)
        .reduce((sum, s) => sum + s.amount, 0);
  };

  const totalDebt = data.cards.reduce((sum, c) => sum + getCardBalance(c.id), 0);
  const totalSavings = data.savings.filter(s => !s.isTransferred).reduce((sum, s) => sum + s.amount, 0);
  const netPosition = totalSavings - totalDebt;

  const transactionsByMonth = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    data.transactions.forEach(t => {
        const key = t.date.substring(0, 7);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data.transactions]);

  // --- Views ---

  // Reused Dashboard, TransactionsView, etc. from previous context.
  // I will just include them directly in the return below for clarity, or reuse if they were separate components.
  // Since they were defined inside App in the previous file, I will keep them here.

  const Dashboard = () => {
    const today = new Date();
    const upcomingBills = data.cards
        .map(c => {
            const dueDay = c.dueDay || 1;
            let targetDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
            if (today.getDate() > dueDay) {
                targetDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
            }
            const diffTime = targetDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const billAmount = calculatePeriodBill(c.id, targetDate.getMonth(), targetDate.getFullYear());
            return { ...c, currentDebt: Math.max(0, billAmount), nextDueDate: targetDate, daysLeft: diffDays };
        })
        .filter(c => c.currentDebt > 0)
        .sort((a, b) => a.daysLeft - b.daysLeft);

    return (
    <div className="space-y-6">
      {upcomingBills.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200 bg-orange-50/50">
              <div className="flex items-center gap-2 mb-4 text-orange-700">
                  <Bell className="animate-pulse" size={20} />
                  <h3 className="font-bold text-lg">Pengingat Tagihan (Periode Ini)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingBills.map(bill => (
                      <div key={bill.id} className="bg-white border border-orange-100 p-4 rounded-lg flex items-center justify-between shadow-sm">
                          <div>
                              <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: bill.color}}></div>
                                  <span className="font-bold text-slate-700">{bill.name}</span>
                              </div>
                              <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                 <Clock size={12} /> {bill.nextDueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                          </div>
                          <div className="text-right">
                               <p className="font-bold text-slate-800">{formatIDR(bill.currentDebt)}</p>
                               <p className={`text-xs font-bold ${bill.daysLeft <= 3 ? 'text-red-500' : 'text-orange-500'}`}>
                                   {bill.daysLeft === 0 ? 'Hari Ini!' : `${bill.daysLeft} Hari Lagi`}
                               </p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Total Hutang (Semua)</p>
          <p className="text-2xl font-bold text-danger mt-1">{formatIDR(totalDebt)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Total Simpanan (Sinking Fund)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatIDR(totalSavings)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Posisi Bersih</p>
          <p className={`text-2xl font-bold mt-1 ${netPosition >= 0 ? 'text-success' : 'text-warning'}`}>
            {formatIDR(netPosition)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-800">Status Per Kartu</h3>
        {data.cards.length === 0 && <div className="text-slate-400 italic">Belum ada kartu.</div>}
        {data.cards.map(card => {
            const balance = getCardBalance(card.id);
            const saved = getCardSavings(card.id);
            const gap = balance - saved;
            return (
                <div key={card.id} className="bg-white p-4 rounded-xl shadow-sm border border-l-4" style={{ borderLeftColor: card.color }}>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-700">{card.name}</h4>
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">Limit: {formatIDR(card.limit)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Tagihan Berjalan:</span>
                        <span className="font-semibold text-slate-800">{formatIDR(balance)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-emerald-600">Tersimpan:</span>
                        <span className="font-semibold text-emerald-600">{formatIDR(saved)}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                        <div className="text-xs text-slate-400">Kekurangan Simpanan</div>
                        <div className={`font-bold ${gap > 0 ? 'text-red-500' : 'text-green-500'}`}>{gap > 0 ? `-${formatIDR(gap)}` : 'Lunas/Surplus'}</div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
    );
  };

  const TransactionsView = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h2>
              <button onClick={() => { setEditingTransaction(undefined); setTransModalOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  <Plus size={18} /> Catat Baru
              </button>
          </div>

          {data.transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Belum ada transaksi tercatat.</div>
          ) : (
              <div className="space-y-8">
                  {transactionsByMonth.map(([month, trans]) => {
                      const cardGroups: Record<string, Transaction[]> = {};
                      trans.forEach(t => {
                          if (!cardGroups[t.cardId]) cardGroups[t.cardId] = [];
                          cardGroups[t.cardId].push(t);
                      });

                      return (
                      <div key={month} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                          <div className="bg-slate-100 px-4 py-3 border-b flex justify-between font-bold text-slate-700">
                              <span>{new Date(month + "-01").toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                              <span className="text-sm font-normal text-slate-500">{trans.length} Transaksi</span>
                          </div>
                          
                          <div className="divide-y divide-slate-100">
                              {Object.entries(cardGroups).map(([cardId, cardTrans]) => {
                                  const card = data.cards.find(c => c.id === cardId);
                                  return (
                                      <div key={cardId} className="p-4 bg-white">
                                          <div className="flex items-center gap-2 mb-3">
                                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card?.color || '#ccc' }}></div>
                                              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{card?.name || 'Kartu Terhapus'}</h4>
                                          </div>
                                          
                                          <div className="space-y-2 pl-2 border-l-2 ml-1" style={{ borderColor: card?.color ? `${card.color}30` : '#f1f5f9' }}>
                                              {cardTrans.map(t => (
                                                  <div 
                                                    key={t.id} 
                                                    className={`
                                                        p-3 rounded-lg flex items-center justify-between group transition-all
                                                        ${t.isValidated 
                                                            ? 'bg-emerald-50 border border-emerald-100' 
                                                            : 'bg-white hover:bg-slate-50 border border-transparent'
                                                        }
                                                    `}
                                                  >
                                                      <div className="flex items-center gap-4">
                                                          <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); toggleTransactionValidation(t.id); }}
                                                            className={`p-1 rounded transition-colors ${t.isValidated ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`}
                                                            title={t.isValidated ? "Sudah divalidasi" : "Tandai valid"}
                                                          >
                                                              {t.isValidated ? <CheckSquare size={20} /> : <Square size={20} />}
                                                          </button>

                                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                              {t.type === TransactionType.EXPENSE ? <TrendingUp size={16} /> : <CheckCircle size={16} />}
                                                          </div>
                                                          
                                                          <div>
                                                              <div className="flex items-center gap-2">
                                                                  <p className={`font-medium ${t.isValidated ? 'text-emerald-900' : 'text-slate-800'}`}>{t.description}</p>
                                                                  {t.isInstallment && <span className="text-[10px] px-1 bg-indigo-100 text-indigo-700 rounded border border-indigo-200">Cicilan</span>}
                                                                  {t.targetPeriod && <span className="text-[10px] px-1 bg-green-100 text-green-700 rounded border border-green-200">Tagihan {t.targetPeriod.month + 1}/{t.targetPeriod.year}</span>}
                                                              </div>
                                                              <p className="text-xs text-slate-500">{formatDate(t.date)}</p>
                                                          </div>
                                                      </div>
                                                      
                                                      <div className="flex items-center gap-4">
                                                          <span className={`font-bold ${t.type === TransactionType.EXPENSE ? 'text-slate-800' : 'text-success'}`}>
                                                              {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatIDR(t.amount)}
                                                          </span>
                                                          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1">
                                                              <button type="button" onClick={(e) => { e.stopPropagation(); setEditingTransaction(t); setTransModalOpen(true); }} className="p-2 hover:bg-slate-200 rounded text-slate-400 hover:text-primary transition-all" title="Edit"><Edit2 size={16} /></button>
                                                              <button 
                                                                type="button" 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteTransactionClick(t.id); }} 
                                                                className="p-2 hover:bg-red-100 rounded text-slate-400 hover:text-red-500 transition-all cursor-pointer" 
                                                                title="Hapus"
                                                              >
                                                                <Trash2 size={16} />
                                                              </button>
                                                          </div>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )})}
              </div>
          )}
      </div>
  );

  const YearlyRecapView = () => {
      const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
      const months = Array.from({ length: 12 }, (_, i) => i);

      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">Laporan Tahunan (Sisa Tagihan)</h2>
                  <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm border">
                      <button onClick={() => setSelectedYear(y => y - 1)} className="text-slate-500 hover:text-primary"><ChevronLeft size={20} /></button>
                      <span className="font-bold text-slate-800 text-lg">{selectedYear}</span>
                      <button onClick={() => setSelectedYear(y => y + 1)} className="text-slate-500 hover:text-primary"><ChevronRight size={20} /></button>
                  </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                  <div className="p-4 border-b bg-slate-50">
                      <h3 className="font-bold text-slate-700">Estimasi Tagihan Bersih Per Bulan</h3>
                      <p className="text-xs text-slate-500">
                          Angka mencakup: (Transaksi Harian + Cicilan) - Pembayaran Tagihan. <br/>
                          Jika 0 atau negatif, berarti tagihan bulan tersebut sudah lunas.
                      </p>
                  </div>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                          <tr>
                              <th className="px-4 py-3 sticky left-0 bg-slate-50 border-r">Bulan</th>
                              {data.cards.map(card => (
                                  <th key={card.id} className="px-4 py-3 min-w-[150px] whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: card.color}}></div>
                                          {card.name}
                                      </div>
                                  </th>
                              ))}
                              <th className="px-4 py-3 font-extrabold bg-slate-100">Total Sisa</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y">
                          {months.map(month => {
                              const monthName = new Date(selectedYear, month, 1).toLocaleDateString('id-ID', { month: 'long' });
                              let monthlyTotalAllCards = 0;

                              return (
                                  <tr key={month} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 font-medium text-slate-700 sticky left-0 bg-white border-r">{monthName}</td>
                                      {data.cards.map(card => {
                                          const amount = calculatePeriodBill(card.id, month, selectedYear);
                                          monthlyTotalAllCards += Math.max(0, amount);
                                          return (
                                              <td key={card.id} className="px-4 py-3 text-slate-600">
                                                  {amount > 0 ? (
                                                      <span className="text-red-600 font-medium">{formatIDR(amount)}</span>
                                                  ) : amount < 0 ? (
                                                      <span className="text-green-600 text-xs">Lunas (Over {formatIDR(Math.abs(amount))})</span>
                                                  ) : (
                                                      <span className="text-slate-300">-</span>
                                                  )}
                                              </td>
                                          );
                                      })}
                                      <td className="px-4 py-3 font-bold text-slate-800 bg-slate-50">
                                          {monthlyTotalAllCards > 0 ? formatIDR(monthlyTotalAllCards) : '-'}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t">
                          <tr>
                              <td className="px-4 py-3 sticky left-0 bg-slate-50 border-r">TOTAL SISA TAHUN INI</td>
                              {data.cards.map(card => {
                                  const yearTotal = months.reduce((sum, m) => sum + Math.max(0, calculatePeriodBill(card.id, m, selectedYear)), 0);
                                  return (
                                      <td key={card.id} className="px-4 py-3 text-primary">
                                          {formatIDR(yearTotal)}
                                      </td>
                                  )
                              })}
                              <td className="px-4 py-3 text-slate-900 bg-slate-100">
                                  {formatIDR(
                                      data.cards.reduce((acc, card) => acc + months.reduce((sum, m) => sum + Math.max(0, calculatePeriodBill(card.id, m, selectedYear)), 0), 0)
                                  )}
                              </td>
                          </tr>
                      </tfoot>
                  </table>
              </div>
          </div>
      );
  };

  const SavingsView = () => {
      const activeSavings = data.savings.filter(s => !s.isTransferred).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const historySavings = data.savings.filter(s => s.isTransferred).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Simpanan Pelunasan (Sinking Fund)</h2>
                <button onClick={() => setSavingModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                    <ChickenIcon size={18} /> Tabung Uang
                </button>
            </div>

            {/* Cards Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {data.cards.map(card => {
                    const saved = getCardSavings(card.id);
                    const balance = getCardBalance(card.id);
                    if (balance <= 0 && saved <= 0) return null;
                    
                    return (
                        <div key={card.id} className="bg-white p-5 rounded-xl shadow-sm border flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: card.color }}></div>
                            <div>
                                <h3 className="font-bold text-lg">{card.name}</h3>
                                <p className="text-sm text-slate-500 mb-4">Target Hutang: {formatIDR(balance)}</p>
                                
                                <div className="mb-2">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Terkumpul</span>
                                        <span className="font-bold text-emerald-600">{Math.round((saved / (balance || 1)) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${Math.min((saved / (balance || 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-emerald-700 mt-2">{formatIDR(saved)}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Active Savings List */}
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-6 py-4 border-b font-bold text-lg text-emerald-700 flex items-center gap-2">
                    <ChickenIcon size={20} /> Simpanan Aktif
                </div>
                <div className="divide-y">
                    {activeSavings.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">Belum ada simpanan aktif.</div>
                    ) : (
                        activeSavings.map(s => {
                            const card = data.cards.find(c => c.id === s.cardId);
                            return (
                                <div key={s.id} className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-slate-50 group">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <Wallet size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{card?.name}</p>
                                            <p className="text-sm text-slate-500">{s.note || 'Simpanan Rutin'} • {formatDate(s.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        <span className="font-bold text-emerald-600 text-lg">{formatIDR(s.amount)}</span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => executeTransfer(s)}
                                                className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                                                title="Pindahkan ke pembayaran kartu"
                                            >
                                                <ArrowRightLeft size={12} /> Bayar Tagihan
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteSavingClick(s.id)}
                                                className="p-1.5 bg-red-100 text-red-500 rounded hover:bg-red-200 transition-colors"
                                                title="Hapus Simpanan"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* History List */}
            <div className="bg-white rounded-xl shadow-sm border opacity-80">
                <div className="px-6 py-4 border-b font-bold text-lg text-slate-600 flex items-center gap-2">
                    <CheckCircle size={20} /> Riwayat Penggunaan
                </div>
                <div className="divide-y">
                    {historySavings.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">Belum ada riwayat penggunaan simpanan.</div>
                    ) : (
                        historySavings.map(s => {
                            const card = data.cards.find(c => c.id === s.cardId);
                            return (
                                <div key={s.id} className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                            <ArrowRightLeft size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-600">{card?.name}</p>
                                            <p className="text-sm text-slate-500">{s.note}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        <span className="font-bold text-slate-500 line-through decoration-red-500">{formatIDR(s.amount)}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Terpakai</span>
                                            <button 
                                                onClick={() => handleDeleteSavingClick(s.id)}
                                                className="p-1.5 bg-red-100 text-red-500 rounded hover:bg-red-200 transition-colors"
                                                title="Hapus Riwayat"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      );
  };

  const InstallmentsView = () => (
      <div className="space-y-6">
           <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Daftar Cicilan Aktif</h2>
              <button onClick={() => setInstallmentModalOpen(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  <CalendarClock size={18} /> Cicilan Baru
              </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.installments.length === 0 && <div className="col-span-2 text-center py-12 text-slate-400">Tidak ada cicilan aktif.</div>}
              {data.installments.map(inst => {
                  const card = data.cards.find(c => c.id === inst.cardId);
                  const progress = (inst.monthsPaid / inst.totalMonths) * 100;
                  const remainingAmount = inst.totalAmount - (inst.monthsPaid * inst.monthlyAmount);

                  return (
                      <div key={inst.id} className="bg-white p-5 rounded-xl shadow-sm border relative group">
                          <button 
                             onClick={() => handleDeleteInstallmentClick(inst.id)}
                             className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-1"
                             title="Hapus Cicilan"
                          >
                             <Trash2 size={16} />
                          </button>

                          <div className="flex justify-between items-start mb-4 pr-8">
                              <div>
                                  <h3 className="font-bold text-lg">{inst.name}</h3>
                                  <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 border" style={{ borderColor: card?.color }}>{card?.name}</span>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-indigo-600">{formatIDR(inst.monthlyAmount)}<span className="text-xs text-slate-400 font-normal">/bulan</span></p>
                              </div>
                          </div>
                          
                          <div className="space-y-1 mb-4">
                              <div className="flex justify-between text-xs text-slate-500">
                                  <span>Progress: {inst.monthsPaid} / {inst.totalMonths} Bulan</span>
                                  <span>Sisa: {inst.totalMonths - inst.monthsPaid} Bulan</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                              </div>
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded-lg mt-3 mb-3 grid grid-cols-2 gap-4">
                              <div>
                                  <p className="text-xs text-slate-500">Total Harga</p>
                                  <p className="font-semibold text-slate-700">{formatIDR(inst.totalAmount)}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-orange-600">Sisa Pokok</p>
                                  <p className="font-bold text-orange-600">{formatIDR(remainingAmount)}</p>
                              </div>
                          </div>
                          
                          <div className="flex justify-end items-center text-sm">
                              <button 
                                onClick={() => {
                                    const newPaid = Math.min(inst.monthsPaid + 1, inst.totalMonths);
                                    setData(prev => ({
                                        ...prev, 
                                        installments: prev.installments.map(i => i.id === inst.id ? {...i, monthsPaid: newPaid} : i)
                                    }))
                                }}
                                className="text-indigo-600 hover:underline text-xs font-medium"
                              >
                                  + Tandai 1 Bulan Lunas
                              </button>
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>
  );

  const CardsView = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Kelola Kartu</h2>
              <button onClick={() => { setEditingCard(undefined); setCardModalOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  <Plus size={18} /> Tambah Kartu
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.cards.map(card => (
                  <div key={card.id} className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center mb-4">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: card.color }}></div>
                        </div>
                        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-2">
                             <button onClick={() => { setEditingCard(card); setCardModalOpen(true); }} className="p-1.5 bg-white/10 hover:bg-white/20 rounded"><Edit2 size={14} /></button>
                             <button onClick={() => handleDeleteCardClick(card.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h3 className="font-bold text-xl mb-1 tracking-wide">{card.name}</h3>
                      <p className="text-slate-400 text-sm mb-6 font-mono">**** **** **** {card.id.substring(0, 4).toUpperCase()}</p>
                      
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-xs text-slate-400 uppercase">Limit Kredit</p>
                              <p className="font-semibold">{formatIDR(card.limit)}</p>
                          </div>
                          <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase">Jatuh Tempo</p>
                                <p className="font-semibold">{card.dueDay ? `Tgl ${card.dueDay}` : '-'}</p>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  // --- Layout Render ---

  if (isAuthChecking) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
     );
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={setUser} />;
  }

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                  <Loader2 className="animate-spin mx-auto text-primary mb-4" size={48} />
                  <p className="text-slate-500 font-medium">Memuat Data Keuangan...</p>
                  <p className="text-xs text-slate-400 mt-2">Menghubungkan ke Akun Anda</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Wallet /> Dompet<span className="text-slate-800">Cerdas</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'TRANSACTIONS', label: 'Transaksi', icon: List },
            { id: 'YEARLY', label: 'Laporan Tahunan', icon: BarChart3 },
            { id: 'SAVINGS', label: 'Simpanan', icon: ChickenIcon },
            { id: 'INSTALLMENTS', label: 'Cicilan', icon: CalendarClock },
            { id: 'CARDS', label: 'Kartu Kredit', icon: CardIcon },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewMode)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                view === item.id ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t bg-slate-50">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                   <UserIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <LogOut size={14} /> Keluar Aplikasi
            </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 z-20 text-xs text-slate-600 overflow-x-auto">
          <button onClick={() => setView('DASHBOARD')} className={`flex flex-col items-center min-w-[50px] ${view === 'DASHBOARD' && 'text-primary'}`}><LayoutDashboard size={20} /> Dash</button>
          <button onClick={() => setView('TRANSACTIONS')} className={`flex flex-col items-center min-w-[50px] ${view === 'TRANSACTIONS' && 'text-primary'}`}><List size={20} /> Trans</button>
          <button onClick={() => setView('YEARLY')} className={`flex flex-col items-center min-w-[50px] ${view === 'YEARLY' && 'text-primary'}`}><BarChart3 size={20} /> Report</button>
          <button onClick={() => setView('SAVINGS')} className={`flex flex-col items-center min-w-[50px] ${view === 'SAVINGS' && 'text-primary'}`}><ChickenIcon size={20} /> Save</button>
          <button onClick={() => setView('INSTALLMENTS')} className={`flex flex-col items-center min-w-[50px] ${view === 'INSTALLMENTS' && 'text-primary'}`}><CalendarClock size={20} /> Cicil</button>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto relative">
        <div className="md:hidden absolute top-4 right-4 z-0 flex gap-2">
            <button onClick={logout} className="bg-white p-2 rounded-full shadow-sm text-slate-500 hover:text-red-500">
                <LogOut size={18} />
            </button>
        </div>

        {view === 'DASHBOARD' && <Dashboard />}
        {view === 'TRANSACTIONS' && <TransactionsView />}
        {view === 'YEARLY' && <YearlyRecapView />}
        {view === 'SAVINGS' && <SavingsView />}
        {view === 'INSTALLMENTS' && <InstallmentsView />}
        {view === 'CARDS' && <CardsView />}
      </main>

      {isCardModalOpen && <CardForm onSave={addOrUpdateCard} onCancel={() => { setCardModalOpen(false); setEditingCard(undefined); }} initialData={editingCard} />}
      {isTransModalOpen && <TransactionForm cards={data.cards} savings={data.savings} onSave={handleSaveTransaction} onCancel={() => { setTransModalOpen(false); setEditingTransaction(undefined); }} initialData={editingTransaction} />}
      {isSavingModalOpen && <SavingForm cards={data.cards} onSave={addSaving} onCancel={() => setSavingModalOpen(false)} />}
      {isInstallmentModalOpen && <InstallmentForm cards={data.cards} onSave={addInstallment} onCancel={() => setInstallmentModalOpen(false)} />}
      
      <ConfirmDialog 
         isOpen={confirmModal.isOpen} 
         title={confirmModal.title} 
         message={confirmModal.message} 
         onConfirm={confirmModal.onConfirm} 
         onCancel={() => setConfirmModal({...confirmModal, isOpen: false})} 
      />
    </div>
  );
}