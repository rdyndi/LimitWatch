import React, { useState } from 'react';
import { AppState, CreditCard, DebtType, OwnerType, Transaction } from '../../types';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { getStatementData } from '../../lib/billing';
import {
  Receipt,
  CheckCircle2,
  Briefcase,
  ShieldAlert,
  Plus,
  ArrowDownCircle,
  Vault,
  CalendarClock,
  CalendarRange,
  History
} from 'lucide-react';

interface StatementViewProps {
  data: AppState;
  card: CreditCard;
  showAmounts: boolean;
  onOpenQuickRecord: (tab: 'EXPENSE' | 'PAYMENT' | 'SAVING') => void;
  onEditTransaction: (t: Transaction) => void;
  onToggleTransactionValidation: (id: string) => void;
  onToggleInstallmentValidation: (instId: string, monthKey: string) => void;
  onUpdateTransactionOwner: (id: string, owner: OwnerType) => void;
  onUpdateInstallmentOwner: (instId: string, owner: OwnerType) => void;
}

export const StatementView: React.FC<StatementViewProps> = ({
  data,
  card,
  showAmounts,
  onOpenQuickRecord,
  onEditTransaction,
  onToggleTransactionValidation,
  onToggleInstallmentValidation,
  onUpdateTransactionOwner,
  onUpdateInstallmentOwner
}) => {
  const [statementMonth, setStatementMonth] = useState(new Date().getMonth());
  const [statementYear, setStatementYear] = useState(new Date().getFullYear());

  const s = getStatementData(data, card.id, statementMonth, statementYear);
  const isReconciled = s.totalValidated === s.totalBill && s.totalBill > 0;

  return (
    <div className="animate-in slide-in-from-right duration-300 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Hero Card Header */}
      <div className="relative p-6 sm:p-10 text-white rounded-[32px] sm:rounded-[40px] shadow-xl flex justify-between items-center overflow-hidden">
        <div className={`absolute inset-0 ${card.color || 'bg-slate-800'}`} />
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_20%,rgba(255,255,255,0.05)_25%,transparent_30%)] pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Receipt size={200} />
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {card.logoUrl ? (
              <div className="w-12 h-12 bg-white rounded-lg p-1.5 shadow-md shrink-0">
                <img src={card.logoUrl} alt={card.name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-xs backdrop-blur-xs border border-white/30 shrink-0">
                {card.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs opacity-80 uppercase tracking-widest font-black mb-0.5 drop-shadow-md">
                {card.type === DebtType.CREDIT_CARD ? 'Bank Statement' : 'Private Loan'}
              </p>
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">{card.name}</h4>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end relative z-10">
          <p className="text-[10px] opacity-80 uppercase font-black tracking-widest drop-shadow-xs">Bulan Tagihan</p>
          <p className="text-base sm:text-xl font-black uppercase drop-shadow-md">
            {MONTH_NAMES[statementMonth]} {statementYear}
          </p>
        </div>
      </div>

      {/* Month/Year Selectors */}
      <div className="flex gap-3">
        <select
          value={statementMonth}
          onChange={(e) => setStatementMonth(parseInt(e.target.value, 10))}
          className="flex-1 text-sm font-black bg-white dark:bg-slate-900 dark:text-slate-100 p-4 rounded-2xl shadow-xs outline-none hover:border-primary border border-slate-100 dark:border-slate-800 transition cursor-pointer"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={statementYear}
          onChange={(e) => setStatementYear(parseInt(e.target.value, 10))}
          className="w-28 text-sm font-black bg-white dark:bg-slate-900 dark:text-slate-100 p-4 rounded-2xl shadow-xs outline-none hover:border-primary border border-slate-100 dark:border-slate-800 transition text-center"
        />
      </div>

      {/* Statement Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tagihan App</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {showAmounts ? formatIDR(s.totalBill) : '••••'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rekonsiliasi (Ceklist)</span>
              </div>
              <span className={`text-base font-black ${isReconciled ? 'text-success' : 'text-primary'}`}>
                {showAmounts ? formatIDR(s.totalValidated) : '••••'}
              </span>
            </div>

            <div className="h-2 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${isReconciled ? 'bg-success' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, (s.totalValidated / (s.totalBill || 1)) * 100)}%` }}
              />
            </div>

            <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-tighter">
              {isReconciled
                ? '✅ Angka Cocok dengan Record Bank'
                : `⚠️ Selisih ${formatIDR(Math.abs(s.totalBill - s.totalValidated))} dari App Record`}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-success uppercase tracking-widest">Dana Terbayar</span>
            <span className="text-base font-black text-success">-{showAmounts ? formatIDR(s.totalPaid) : '••'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Dana Cadangan</span>
            <span className="text-base font-black text-primary">-{showAmounts ? formatIDR(s.totalSaved) : '••'}</span>
          </div>

          <div className="flex justify-between items-center pt-4 border-t-2 dark:border-slate-800">
            <span className="text-[10px] font-black text-danger uppercase tracking-widest">Sisa Kewajiban</span>
            <span className="text-2xl sm:text-3xl font-black text-danger">
              {showAmounts ? formatIDR(Math.max(0, s.totalBill - s.totalPaid - s.totalSaved)) : '••••'}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border dark:border-slate-800 shadow-xs space-y-4">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Briefcase size={12} /> Breakdown Biaya
            </h5>
            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl space-y-3 shadow-xs">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span className="uppercase">E-Statement Fee</span>
                <span>{showAmounts ? formatIDR(s.adminFee) : '••'}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span className="uppercase">Biaya Materai</span>
                <span>{showAmounts ? formatIDR(s.materai) : '••'}</span>
              </div>
              <div className="pt-2 border-t dark:border-slate-700 flex justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                <span className="uppercase">Total Tambahan</span>
                <span>{showAmounts ? formatIDR(s.adminFee + s.materai) : '••'}</span>
              </div>
            </div>
          </div>

          {!isReconciled && s.totalBill > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-5 rounded-3xl flex items-start gap-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-tight">Tips Rekonsiliasi</p>
                <p className="text-[10px] font-bold text-amber-700/70 dark:text-amber-400/60 leading-relaxed mt-1">
                  Ceklist transaksi di bawah satu per satu sambil melihat tagihan di aplikasi bank. Jika total tervalidasi sudah sama, berarti catatan Anda sudah akurat.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <button
          onClick={() => onOpenQuickRecord('EXPENSE')}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 shadow-xs active:scale-95 transition hover:border-primary group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-danger flex items-center justify-center group-hover:bg-danger group-hover:text-white transition-colors">
            <Plus size={18} />
          </div>
          Catat
        </button>

        <button
          onClick={() => onOpenQuickRecord('PAYMENT')}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 shadow-xs active:scale-95 transition hover:border-success group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-success flex items-center justify-center group-hover:bg-success group-hover:text-white transition-colors">
            <ArrowDownCircle size={18} />
          </div>
          Bayar
        </button>

        <button
          onClick={() => onOpenQuickRecord('SAVING')}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 shadow-xs active:scale-95 transition hover:border-indigo-500 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Vault size={18} />
          </div>
          Nabung
        </button>
      </div>

      {/* Active Installments Section */}
      <section className="space-y-4">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
          <CalendarClock size={14} /> Tagihan Cicilan Berjalan
        </h5>
        <div className="grid md:grid-cols-2 gap-4">
          {s.installments.map(inst => (
            <div
              key={inst.id}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group shadow-xs transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    inst.isValidated ? 'bg-primary/10 text-primary' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <CalendarRange size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase leading-tight truncate">
                    {inst.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-black uppercase">
                      Tenor {inst.currentTenor}/{inst.totalMonths}
                    </span>
                    {!inst.owner ? (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onUpdateInstallmentOwner(inst.id, OwnerType.PERSONAL)}
                          className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[9px] font-bold hover:bg-blue-200"
                        >
                          PRIBADI
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateInstallmentOwner(inst.id, OwnerType.BUSINESS)}
                          className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-md text-[9px] font-bold hover:bg-purple-200"
                        >
                          BISNIS
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          inst.owner === OwnerType.PERSONAL
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : inst.owner === OwnerType.BUSINESS
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {inst.owner}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                  {showAmounts ? formatIDR(inst.monthlyAmount) : '••'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const monthKey = `${statementYear}-${String(statementMonth).padStart(2, '0')}`;
                    onToggleInstallmentValidation(inst.id, monthKey);
                  }}
                  className={`p-2 sm:p-2.5 rounded-full transform active:scale-90 transition-all ${
                    inst.isValidated
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-700 hover:text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={22} />
                </button>
              </div>
            </div>
          ))}

          {s.installments.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-300 font-bold text-xs italic bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed dark:border-slate-800">
              Tidak ada cicilan aktif pada periode ini.
            </div>
          )}
        </div>
      </section>

      {/* Transaction Log Section */}
      <section className="space-y-4">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
          <History size={14} /> Log Transaksi Periode Ini
        </h5>
        <div className="grid md:grid-cols-2 gap-4">
          {s.transactions.map(t => (
            <div
              key={t.id}
              onClick={() => onEditTransaction(t)}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex justify-between items-center hover:border-primary transition group cursor-pointer shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    t.isValidated ? 'bg-primary/10 text-primary' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <History size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase leading-tight truncate">
                    {t.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {new Date(t.date).toLocaleDateString('id-ID')}
                    </p>
                    {!t.owner ? (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onUpdateTransactionOwner(t.id, OwnerType.PERSONAL)}
                          className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[9px] font-bold hover:bg-blue-200"
                        >
                          PRIBADI
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateTransactionOwner(t.id, OwnerType.BUSINESS)}
                          className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-md text-[9px] font-bold hover:bg-purple-200"
                        >
                          BISNIS
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          t.owner === OwnerType.PERSONAL
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : t.owner === OwnerType.BUSINESS
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {t.owner}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-black text-danger text-xs sm:text-base">
                  {showAmounts ? formatIDR(t.amount) : '••'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTransactionValidation(t.id);
                  }}
                  className={`p-2 sm:p-2.5 rounded-full transform active:scale-90 transition-all ${
                    t.isValidated
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-700 hover:text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={22} />
                </button>
              </div>
            </div>
          ))}

          {s.transactions.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-300 font-bold text-xs italic bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed dark:border-slate-800">
              Belum ada pemakaian baru di periode ini.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
