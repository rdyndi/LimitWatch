
export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  color: string;
  notes?: string;
  dueDay?: number; // Tanggal jatuh tempo (1-31)
}

export enum TransactionType {
  EXPENSE = 'EXPENSE', // Pemakaian Kartu
  PAYMENT = 'PAYMENT', // Pembayaran Tagihan (Mengurangi Hutang)
}

export interface Transaction {
  id: string;
  cardId: string;
  amount: number;
  date: string; // ISO String
  description: string;
  type: TransactionType;
  category?: string;
  isInstallment?: boolean; // True jika transaksi ini dikonversi jadi cicilan (agar tidak double hitung di laporan)
  targetPeriod?: { month: number, year: number }; // Khusus PAYMENT: Pembayaran untuk tagihan bulan apa
  isValidated?: boolean; // Status validasi (Checklist)
}

export interface Installment {
  id: string;
  cardId: string;
  name: string;
  totalAmount: number; // Total harga barang
  monthlyAmount: number; // Cicilan per bulan
  totalMonths: number;
  monthsPaid: number;
  startDate: string;
}

export interface Saving {
  id: string;
  cardId: string;
  amount: number;
  date: string;
  note: string;
  isTransferred: boolean; // Jika true, berarti sudah dipakai bayar tagihan
}

export interface AppState {
  cards: CreditCard[];
  transactions: Transaction[];
  installments: Installment[];
  savings: Saving[];
}

export type ViewMode = 'DASHBOARD' | 'TRANSACTIONS' | 'SAVINGS' | 'CARDS' | 'INSTALLMENTS' | 'YEARLY';
