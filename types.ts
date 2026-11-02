
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
  logoUrl?: string; // Base64 image URL for custom logo
  statementBills?: Record<string, number>; // key: "YYYY-MM", value: Tagihan Bank e-Statement
}

export enum TransactionType {
  EXPENSE = 'EXPENSE', // Pemakaian Kartu / Penambahan Hutang
  PAYMENT = 'PAYMENT', // Pembayaran Tagihan (Mengurangi Hutang)
}

export enum OwnerType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  SPLIT = 'SPLIT',
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
  owner?: OwnerType;
  splitAmounts?: { personal: number; business: number };
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
  transactionId?: string; // ID transaksi yang menjadi sumber cicilan ini
  owner?: OwnerType;
  splitAmounts?: { personal: number; business: number };
}

export interface Saving {
  id: string;
  cardId: string;
  amount: number;
  date: string;
  note: string;
  targetPeriod?: { month: number, year: number }; // Target pembayaran untuk tagihan bulan apa
  isTransferred: boolean; // Jika true, berarti sudah dipakai bayar tagihan
  transferredAt?: string; // ISO String kapan dipakai bayar tagihan
  usedAmount?: number; // Jumlah yang dipakai (default = amount)
  usedByTransactionId?: string; // ID transaksi pembayaran yang memakai tabungan ini
  splitFromSavingId?: string; // ID tabungan asal jika record ini merupakan sisa dari pemakaian sebagian
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
  collectedAt?: string; // ISO String kapan uang kembali
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
  | 'OWNER_BILLS'
  | 'ACCOUNT'
  | 'FORM_TRANSACTION'
  | 'FORM_CARD'
  | 'FORM_SAVING'
  | 'FORM_TRANSFER_SAVING'
  | 'FORM_PIUTANG'
  | 'VIEW_STATEMENT'
  | 'VIEW_PROFILE';
