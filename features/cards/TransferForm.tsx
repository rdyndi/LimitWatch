import React from 'react';
import { useTransferForm } from '../../hooks/useFormReducers';
import { executeSaveTransfer } from '../../hooks/useTransactionService';
import { MoneyInput, PeriodPicker, CardPicker, StickyActionBar } from '../../components/ui';
import { ArrowLeftRight, X } from 'lucide-react';

interface TransferFormProps {
  data: any;
  defaultCardId?: string;
  onSave: (updatedData: any) => void;
  onCancel: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  data,
  defaultCardId,
  onSave,
  onCancel
}) => {
  const transferForm = useTransferForm(defaultCardId, defaultCardId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = executeSaveTransfer(data, transferForm.state);
    if (updated) {
      onSave(updated);
    }
  };

  const isTransferValid =
    !!transferForm.state.sourceCardId && !!transferForm.state.targetCardId && transferForm.state.amount > 0;

  return (
    <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto w-full px-4 py-4 sm:px-6 sm:py-8">
      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 relative">
        <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">Transfer Dana Tabungan</h3>
              <p className="text-xs text-slate-400">Pindahkan alokasi tabungan antar periode/kartu</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <MoneyInput
          value={transferForm.state.amount}
          onChange={(val) => transferForm.dispatch({ type: 'SET_FIELD', field: 'amount', value: val })}
          label="Jumlah Nominal Yang Dipindahkan"
          color="success"
          helperText={transferForm.state.amount <= 0 ? 'Ketik jumlah dana yang ingin dipindahkan' : undefined}
        />

        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-700/50">
          <p className="text-xs font-black uppercase text-slate-400 tracking-wider">SUMBER DANA (DIKURANGI)</p>

          <CardPicker
            cards={data.cards}
            value={transferForm.state.sourceCardId}
            onChange={(id) => transferForm.dispatch({ type: 'SET_FIELD', field: 'sourceCardId', value: id })}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Periode Sumber:</span>
            <PeriodPicker
              month={transferForm.state.sourceMonth}
              year={transferForm.state.sourceYear}
              onChange={(month, year) => {
                transferForm.dispatch({ type: 'SET_FIELD', field: 'sourceMonth', value: month });
                transferForm.dispatch({ type: 'SET_FIELD', field: 'sourceYear', value: year });
              }}
            />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-700/50">
          <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">TUJUAN DANA (DITAMBAHKAN)</p>

          <CardPicker
            cards={data.cards}
            value={transferForm.state.targetCardId}
            onChange={(id) => transferForm.dispatch({ type: 'SET_FIELD', field: 'targetCardId', value: id })}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Periode Tujuan:</span>
            <PeriodPicker
              month={transferForm.state.targetMonth}
              year={transferForm.state.targetYear}
              onChange={(month, year) => {
                transferForm.dispatch({ type: 'SET_FIELD', field: 'targetMonth', value: month });
                transferForm.dispatch({ type: 'SET_FIELD', field: 'targetYear', value: year });
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
            Catatan Tambahan (Opsional)
          </label>
          <input
            type="text"
            value={transferForm.state.note}
            onChange={(e) => transferForm.dispatch({ type: 'SET_FIELD', field: 'note', value: e.target.value })}
            placeholder="Contoh: Geser alokasi THR ke tagihan BNI..."
            className="w-full min-h-[48px] p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-emerald-500 transition"
          />
        </div>

        <StickyActionBar
          primaryLabel="Eksekusi Transfer"
          isValid={isTransferValid}
          color="success"
          invalidMessage={!isTransferValid ? 'Masukkan nominal transfer & pilih kartu' : undefined}
        />
      </form>
    </div>
  );
};
