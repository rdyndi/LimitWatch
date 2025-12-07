
export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  color: string;
  notes?: string;
  dueDay?: number; // Tanggal jatuh tempo (1-31)
}

export interface Wallet {
  id: string;
  name: string;
  type: 'BANK' | 'EWALLET' | 'CASH';
  balance: number;
  color: string;
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
  installmentId?: string; // ID referensi ke data installment (jika isInstallment true)
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
  targetPeriod?: { month: number, year: number }; // Target pembayaran untuk tagihan bulan apa
  isTransferred: boolean; // Jika true, berarti sudah dipakai bayar tagihan
}

export interface AppState {
  username?: string; // Optional karena user lama mungkin belum punya
  email?: string; // Untuk keperluan lookup username
  cards: CreditCard[];
  transactions: Transaction[];
  installments: Installment[];
  savings: Saving[];
  wallets: Wallet[];
}

export type ViewMode = 'DASHBOARD' | 'TRANSACTIONS' | 'SAVINGS' | 'CARDS' | 'INSTALLMENTS' | 'YEARLY' | 'ACCOUNT' | 'WALLETS';