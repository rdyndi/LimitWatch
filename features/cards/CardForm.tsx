import React from 'react';
import { CreditCard, DebtType } from '../../types';
import { useCardForm } from '../../hooks/useFormReducers';
import { executeSaveCard } from '../../hooks/useTransactionService';
import { CARD_COLORS } from '../../lib/constants';
import { MoneyInput, SegmentedControl, StickyActionBar } from '../../components/ui';
import { Image, X } from 'lucide-react';

interface CardFormProps {
  data: any;
  editingCard?: CreditCard | null;
  onSave: (updatedData: any) => void;
  onCancel: () => void;
}

export const CardForm: React.FC<CardFormProps> = ({
  data,
  editingCard,
  onSave,
  onCancel
}) => {
  const cardForm = useCardForm();

  React.useEffect(() => {
    if (editingCard) {
      cardForm.dispatch({ type: 'LOAD_ITEM', item: editingCard });
    } else {
      cardForm.dispatch({ type: 'RESET' });
    }
  }, [editingCard]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        cardForm.dispatch({ type: 'SET_FIELD', field: 'logoUrl', value: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = executeSaveCard(
      data,
      {
        name: cardForm.state.name,
        limit: cardForm.state.limit,
        dueDay: cardForm.state.dueDay ? parseInt(cardForm.state.dueDay, 10) : undefined,
        color: cardForm.state.color,
        type: cardForm.state.type,
        eStatementFee: cardForm.state.eStatementFee,
        logoUrl: cardForm.state.logoUrl
      },
      editingCard
    );
    if (updated) {
      onSave(updated);
    }
  };

  const isCardValid = cardForm.state.name.trim().length > 0 && cardForm.state.limit > 0;

  return (
    <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto w-full px-4 py-4 sm:px-6 sm:py-8">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 relative">
        <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
          <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
            {editingCard ? 'Edit Kartu / Hutang' : 'Tambah Kartu Baru'}
          </h3>
          <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <SegmentedControl
          value={cardForm.state.type}
          onChange={(val) => cardForm.dispatch({ type: 'SET_FIELD', field: 'type', value: val as DebtType })}
          options={[
            { value: DebtType.CREDIT_CARD, label: 'KARTU KREDIT', activeColor: 'bg-white dark:bg-slate-700 shadow-md text-primary dark:text-blue-400' },
            { value: DebtType.OTHER_DEBT, label: 'HUTANG LAIN', activeColor: 'bg-white dark:bg-slate-700 shadow-md text-primary dark:text-blue-400' }
          ]}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Label Identitas</label>
          <input
            type="text"
            value={cardForm.state.name}
            onChange={(e) => cardForm.dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
            required
            placeholder="Contoh: Platinum Card"
            className="w-full min-h-[48px] p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl outline-none border-2 border-transparent focus:border-primary transition font-bold text-base"
          />
          {!cardForm.state.name.trim() && <p className="text-[11px] text-slate-400 ml-1">Nama atau label kartu wajib diisi</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <MoneyInput
              value={cardForm.state.limit}
              onChange={(val) => cardForm.dispatch({ type: 'SET_FIELD', field: 'limit', value: val })}
              label="Limit / Plafon"
              showQuickButtons={false}
              color="primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Tgl Jatuh Tempo (1-31)</label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              max="31"
              value={cardForm.state.dueDay}
              onChange={(e) => cardForm.dispatch({ type: 'SET_FIELD', field: 'dueDay', value: e.target.value })}
              placeholder="Misal: 15"
              className="w-full min-h-[48px] p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-2xl font-bold text-base outline-none border-2 border-transparent focus:border-primary transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Logo Kartu / Merchant (Opsional)</label>
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            {cardForm.state.logoUrl ? (
              <div className="relative">
                <img src={cardForm.state.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover bg-white p-1 shadow-xs" />
                <button
                  type="button"
                  onClick={() => cardForm.dispatch({ type: 'SET_FIELD', field: 'logoUrl', value: '' })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 shadow-inner">
                <Image size={20} />
              </div>
            )}
            <div className="flex-1">
              <label className="cursor-pointer bg-white dark:bg-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors inline-flex items-center justify-center min-h-[44px]">
                Pilih Gambar...
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Warna Kartu</label>
          <div className="flex gap-3 flex-wrap pt-1">
            {CARD_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => cardForm.dispatch({ type: 'SET_FIELD', field: 'color', value: c.value })}
                className={`w-11 h-11 rounded-full ${c.value} ${cardForm.state.color === c.value ? 'ring-4 ring-offset-4 ring-primary dark:ring-offset-slate-900' : 'hover:scale-105'} transition-all`}
              />
            ))}
          </div>
        </div>

        <StickyActionBar
          primaryLabel={editingCard ? 'Simpan Perubahan Kartu' : 'Simpan Konfigurasi'}
          isValid={isCardValid}
          color="primary"
          invalidMessage={!isCardValid ? (!cardForm.state.name.trim() ? 'Masukkan label/nama kartu' : 'Masukkan limit/plafon kartu') : undefined}
        />
      </form>
    </div>
  );
};
