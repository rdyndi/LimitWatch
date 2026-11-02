import React, { useState, useMemo } from 'react';
import { AppState, Transaction, TransactionType } from '../../types';
import { MONTH_NAMES } from '../../lib/constants';
import { formatIDR } from '../../lib/format';
import { getBillingPeriod } from '../../lib/billing';
import { CheckCircle2, History, Search } from 'lucide-react';

interface TransactionListProps {
  data: AppState;
  showAmounts: boolean;
  onEditTransaction: (t: Transaction) => void;
  onToggleValidation: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  data,
  showAmounts,
  onEditTransaction,
  onToggleValidation
}) => {
  const [cardFilter, setCardFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth());
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = useMemo(() => {
    return data.transactions.filter(t => {
      const card = data.cards.find(c => c.id === t.cardId);
      const billing = getBillingPeriod(t.date, card?.dueDay);
      const matchCard = cardFilter === 'all' || t.cardId === cardFilter;
      const matchMonth = billing.month === monthFilter;
      const matchYear = billing.year === yearFilter;
      const matchSearch = searchQuery.trim() === '' || t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCard && matchMonth && matchYear && matchSearch;
    });
  }, [data.transactions, data.cards, cardFilter, monthFilter, yearFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 md:py-8">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={cardFilter}
            onChange={(e) => setCardFilter(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 outline-none hover:border-primary transition cursor-pointer"
          >
            <option value="all">💳 Semua Kartu / Hutang</option>
            {data.cards.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(parseInt(e.target.value, 10))}
              className="flex-1 sm:w-44 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 outline-none hover:border-primary transition cursor-pointer"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={i} value={i}>📅 {m}</option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(parseInt(e.target.value, 10))}
              className="w-28 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 outline-none hover:border-primary transition cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Items */}
      <div className="space-y-3">
        {filteredTransactions.map(t => {
          const card = data.cards.find(c => c.id === t.cardId);
          return (
            <div
              key={t.id}
              onClick={() => onEditTransaction(t)}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-xs flex justify-between items-center active:scale-[0.99] hover:border-primary transition group relative overflow-hidden cursor-pointer"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${card?.color || 'bg-slate-800'}`} />
              <div className="pl-3 space-y-1 min-w-0 pr-3">
                <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 leading-tight truncate">
                  {t.description}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase truncate">
                    {card?.name || 'Kartu'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm sm:text-base font-black ${t.type === TransactionType.EXPENSE ? 'text-danger' : 'text-success'}`}>
                  {t.type === TransactionType.PAYMENT ? '-' : ''}
                  {showAmounts ? formatIDR(t.amount) : '••••'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleValidation(t.id);
                  }}
                  className={`p-2 rounded-full transform active:scale-90 transition-colors ${
                    t.isValidated
                      ? 'bg-primary/10 text-primary dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700 hover:text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={22} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <History size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-3" />
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Belum ada catatan transaksi pada periode ini.</p>
          </div>
        )}
      </div>
    </div>
  );
};
