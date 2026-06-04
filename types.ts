
export enum DebtType {
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER_DEBT = 'OTHER_DEBT', // Misal: Pinjaman, Hutang Teman, dll.
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  color: string;
  type: DebtType;
  notes?: string;
  dueDay?: number; // Tanggal jatuh tempo (1-31)
  eStatementFee?: number; // Biaya E-Statement bulanan
}

export enum TransactionType {
  EXPENSE = 'EXPENSE', // Pemakaian Kartu / Penambahan Hutang
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
  usedSavingIds?: string[]; // Tabungan yang dipakai untuk pembayaran ini, agar bisa dikembalikan saat pembayaran dibatalkan
}

export interface Installment {
  id: string;
  cardId: string;
  name: string;
  totalAmount: number; // Total harga barang
  monthlyAmount: number; // Cicilan per bulan (Selalu dibulatkan ke atas)
  totalMonths: number;
  monthsPaid: number;
  startDate: string;
  validatedTenors?: string[]; // Format: "YYYY-MM" untuk menandai cicilan bulan tersebut sudah dicek
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

export interface Piutang {
  id: string;
  cardId: string; // Alokasi untuk mengurangi hutang kartu mana
  debtorName: string; // Nama orang yang berhutang
  amount: number;
  date: string;
  note: string;
  targetPeriod?: { month: number, year: number };
  isCollected: boolean; // Jika true, berarti uang sudah diterima
}

export interface AppState {
  cards: CreditCard[];
  transactions: Transaction[];
  installments: Installment[];
  savings: Saving[];
  piutangs?: Piutang[];
  theme?: 'light' | 'dark';
  security?: {
    pin: string | null;
    isPinEnabled: boolean;
  };
}

export type ViewMode = 
  | 'DASHBOARD' 
  | 'TRANSACTIONS' 
  | 'SAVINGS' 
  | 'PIUTANGS'
  | 'CARDS' 
  | 'INSTALLMENTS' 
  | 'YEARLY' 
  | 'ACCOUNT'
  | 'FORM_TRANSACTION'
  | 'FORM_CARD'
  | 'FORM_SAVING'
  | 'FORM_PIUTANG'
  | 'VIEW_STATEMENT'
  | 'VIEW_PROFILE';
