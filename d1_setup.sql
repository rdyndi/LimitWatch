-- ====================================================================
-- LIMITWATCH CLOUDFLARE D1 SETUP SCRIPT
-- Database: limitwatch (ID: 0dd0303d-682b-46e2-af76-e08c8838f0cc)
-- ====================================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  limit_amount INTEGER NOT NULL,
  color TEXT NOT NULL,
  due_day INTEGER,
  type TEXT NOT NULL DEFAULT 'CREDIT_CARD',
  e_statement_fee INTEGER DEFAULT 0,
  logo_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'EXPENSE',
  category TEXT NOT NULL DEFAULT 'Umum',
  is_installment BOOLEAN DEFAULT 0,
  installment_id TEXT,
  owner TEXT NOT NULL DEFAULT 'PERSONAL',
  is_validated BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS installments (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  transaction_id TEXT,
  name TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  total_months INTEGER NOT NULL,
  monthly_amount INTEGER NOT NULL,
  months_paid INTEGER DEFAULT 0,
  start_date TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'PERSONAL',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS savings (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  owner TEXT NOT NULL DEFAULT 'PERSONAL',
  target_month INTEGER,
  target_year INTEGER,
  is_transferred BOOLEAN DEFAULT 0,
  used_by_transaction_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS piutangs (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  debtor_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  target_month INTEGER,
  target_year INTEGER,
  is_collected BOOLEAN DEFAULT 0,
  collected_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 2. Insert Cards
INSERT OR REPLACE INTO cards (id, name, limit_amount, color, due_day, type, e_statement_fee, logo_url) VALUES
("card_traveloka", "Traveloka", 30000000, "bg-gradient-to-br from-blue-500 to-indigo-700", 3, "CREDIT_CARD", 5000, ""),
("card_tokopedia", "Tokopedia", 30000000, "bg-gradient-to-br from-emerald-500 to-teal-700", 17, "CREDIT_CARD", 10000, ""),
("card_mandiri", "Bank Mandiri", 25000000, "bg-gradient-to-br from-amber-500 to-orange-700", 20, "CREDIT_CARD", 0, ""),
("card_mega", "Bank Mega", 25000000, "bg-gradient-to-br from-amber-500 to-orange-600", 19, "CREDIT_CARD", 5000, "");

-- 3. Insert Installments
INSERT OR REPLACE INTO installments (id, card_id, name, total_amount, total_months, monthly_amount, months_paid, start_date, owner) VALUES
("inst_hp_kakak", "card_traveloka", "HP KAKAK", 3524016, 24, 146834, 2, "2026-09-03T00:00:00.000Z", "PERSONAL"),
("inst_mesin_cuci", "card_traveloka", "MESIN CUCI", 3155724, 12, 262977, 2, "2026-09-03T00:00:00.000Z", "BUSINESS"),
("inst_tv_24", "card_traveloka", "TV 24", 3352968, 24, 139707, 11, "2025-12-03T00:00:00.000Z", "PERSONAL"),
("inst_pengeluaran", "card_traveloka", "PENGELUARAN", 14249202, 19, 749958, 12, "2025-11-03T00:00:00.000Z", "PERSONAL"),
("inst_bisnis_2026", "card_mandiri", "Investasi Modal Bisnis", 26943427, 12, 2245285, 0, "2026-01-20T00:00:00.000Z", "BUSINESS"),
("inst_tokped_ccl12_1", "card_tokopedia", "Tokopedia CYBS (1)", 12000996, 12, 1000083, 3, "2026-08-05T00:00:00.000Z", "PERSONAL"),
("inst_tokped_eragone_dago", "card_tokopedia", "Erafone & More Dago Bandung", 9298008, 24, 387417, 17, "2025-06-05T00:00:00.000Z", "PERSONAL"),
("inst_tokped_ccl12_2", "card_tokopedia", "Tokopedia CYBS (2)", 3642264, 12, 303522, 4, "2026-07-05T00:00:00.000Z", "PERSONAL"),
("inst_tokped_ccl12_3", "card_tokopedia", "Tokopedia CYBS (3 - Rp 2.7M)", 2701000, 12, 225083, 1, "2026-10-05T00:00:00.000Z", "PERSONAL"),
("inst_tokped_ccl12_4", "card_tokopedia", "Tokopedia CYBS (4)", 1311636, 12, 109303, 11, "2025-12-05T00:00:00.000Z", "PERSONAL"),
("inst_tokped_blibli", "card_tokopedia", "Blibli Elektronik Lembang", 5188008, 24, 216167, 2, "2026-09-05T00:00:00.000Z", "PERSONAL"),
("inst_tokped_ccl12_5", "card_tokopedia", "Tokopedia CYBS (5)", 578820, 12, 48235, 2, "2026-09-05T00:00:00.000Z", "PERSONAL"),
("inst_tokped_erafone_bdg", "card_tokopedia", "Erafone 1 Bandung Electronic", 5699000, 24, 237458, 9, "2026-02-05T00:00:00.000Z", "PERSONAL"),
("inst_tokped_ccl12_6", "card_tokopedia", "Tokopedia CYBS (6)", 1952868, 12, 162739, 4, "2026-07-05T00:00:00.000Z", "PERSONAL");

-- 4. Insert Transactions
INSERT OR REPLACE INTO transactions (id, card_id, amount, date, description, type, category, is_installment, owner, is_validated) VALUES
("mega_tx_20261103_101003", "card_mega", 262000, "2026-11-03T10:10:03.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261103_035054", "card_mega", 241200, "2026-11-03T03:50:54.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261102_110916", "card_mega", 82200, "2026-11-02T11:09:16.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261101_162503", "card_mega", 260000, "2026-11-01T16:25:03.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261101_161401", "card_mega", 78000, "2026-11-01T16:14:01.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("tx_jco", "card_traveloka", 159000, "2026-11-01T00:00:00.000Z", "JCO", "EXPENSE", "Makan & Minum", 0, "PERSONAL", 1),
("mega_tx_20261031_234826", "card_mega", 301000, "2026-10-31T23:48:26.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261031_202127", "card_mega", 69000, "2026-10-31T20:21:27.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261031_194456", "card_mega", 65000, "2026-10-31T19:44:56.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261031_193255", "card_mega", 24000, "2026-10-31T19:32:55.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261031_192807", "card_mega", 350000, "2026-10-31T19:28:07.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261031_181500", "card_mega", 34000, "2026-10-31T18:15:00.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261031_175425", "card_mega", 89000, "2026-10-31T17:54:25.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261030_234117", "card_mega", 141600, "2026-10-30T23:41:17.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261030_193023", "card_mega", 62500, "2026-10-30T19:30:23.000Z", "Qr Payment – Id (Refund/Credit)", "PAYMENT", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261030_193022", "card_mega", 62500, "2026-10-30T19:30:22.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("tx_shopee_1", "card_traveloka", 56500, "2026-10-30T00:00:00.000Z", "SHOPEE", "EXPENSE", "Belanja", 0, "PERSONAL", 1),
("mega_tx_20261029_183642", "card_mega", 110300, "2026-10-29T18:36:42.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261029_112703", "card_mega", 300000, "2026-10-29T11:27:03.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261029_080545", "card_mega", 341824, "2026-10-29T08:05:45.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261029_074132", "card_mega", 106200, "2026-10-29T07:41:32.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261028_171005", "card_mega", 160000, "2026-10-28T17:10:05.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261028_170132", "card_mega", 129500, "2026-10-28T17:01:32.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261028_155808", "card_mega", 266000, "2026-10-28T15:58:08.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261028_135345", "card_mega", 88800, "2026-10-28T13:53:45.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261028_132501", "card_mega", 56000, "2026-10-28T13:25:01.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261028_130426", "card_mega", 70000, "2026-10-28T13:04:26.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261028_041005", "card_mega", 103200, "2026-10-28T04:10:05.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("tx_tokped_sub", "card_tokopedia", 805101, "2026-10-28T00:00:00.000Z", "Langganan Layanan & Tagihan", "EXPENSE", "Tagihan", 0, "PERSONAL", 1),
("mega_tx_20261027_071616", "card_mega", 29000, "2026-10-27T07:16:16.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261027_070525", "card_mega", 82800, "2026-10-27T07:05:25.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261026_175858", "card_mega", 135700, "2026-10-26T17:58:58.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261026_122944", "card_mega", 100300, "2026-10-26T12:29:44.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261025_155940", "card_mega", 264000, "2026-10-25T15:59:40.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261025_081810", "card_mega", 82100, "2026-10-25T08:18:10.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("tx_tokped_belanja", "card_tokopedia", 4500000, "2026-10-25T00:00:00.000Z", "Belanja Kebutuhan & Elektronik Tokopedia", "EXPENSE", "Belanja", 0, "PERSONAL", 1),
("mega_tx_20261024_210131", "card_mega", 50000, "2026-10-24T21:01:31.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261024_191823", "card_mega", 124200, "2026-10-24T19:18:23.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261024_141601", "card_mega", 196884, "2026-10-24T14:16:01.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261024_115432", "card_mega", 100300, "2026-10-24T11:54:32.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261024_110626", "card_mega", 49500, "2026-10-24T11:06:26.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("tx_gojek_1", "card_traveloka", 10556, "2026-10-24T00:00:00.000Z", "GOJEK", "EXPENSE", "Transportasi", 0, "BUSINESS", 1),
("mega_tx_20261023_202204", "card_mega", 276000, "2026-10-23T20:22:04.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261022_232438", "card_mega", 112909, "2026-10-22T23:24:38.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261022_151921", "card_mega", 134000, "2026-10-22T15:19:21.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261022_112710", "card_mega", 108000, "2026-10-22T11:27:10.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261022_104336", "card_mega", 100500, "2026-10-22T10:43:36.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261021_110405", "card_mega", 83000, "2026-10-21T11:04:05.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("tx_tiket_hotel", "card_traveloka", 3885756, "2026-10-20T00:00:00.000Z", "Tiket Pesawat & Reservasi Hotel", "EXPENSE", "Hiburan", 0, "PERSONAL", 1),
("mega_tx_20261019_233427", "card_mega", 49500, "2026-10-19T23:34:27.000Z", "Qr Payment – Id (Refund/Credit)", "PAYMENT", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261019_233426", "card_mega", 49500, "2026-10-19T23:34:26.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261019_233335", "card_mega", 49500, "2026-10-19T23:33:35.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261019_233246", "card_mega", 82800, "2026-10-19T23:32:46.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261019_220115", "card_mega", 282000, "2026-10-19T22:01:15.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261019_101625", "card_mega", 163000, "2026-10-19T10:16:25.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("mega_tx_20261019_012450", "card_mega", 9042417, "2026-10-19T01:24:50.000Z", "Incoming Bi-fast (Bayar Tagihan)", "PAYMENT", "Tagihan Rutin", 0, "PERSONAL", 1),
("tx_mandiri_ops", "card_mandiri", 3838715, "2026-10-18T00:00:00.000Z", "Pengeluaran Operasional Mandiri", "EXPENSE", "Operasional", 0, "BUSINESS", 1),
("mega_tx_20261017_224943", "card_mega", 242000, "2026-10-17T22:49:43.000Z", "Qr Payment – Id", "EXPENSE", "Lainnya", 0, "PERSONAL", 1),
("tx_gojek_2", "card_traveloka", 25793, "2026-10-15T00:00:00.000Z", "GOJEK", "EXPENSE", "Transportasi", 0, "BUSINESS", 1),
("tx_shopee_2", "card_traveloka", 70640, "2026-10-13T00:00:00.000Z", "SHOPEE", "EXPENSE", "Belanja", 0, "BUSINESS", 1);

-- 5. Insert Savings
INSERT OR REPLACE INTO savings (id, card_id, amount, date, note, owner, target_month, target_year, is_transferred) VALUES
("sav_traveloka", "card_traveloka", 2507507, "2026-10-28T00:00:00.000Z", "Tabungan Tagihan Traveloka (Nov 2026)", "PERSONAL", 10, 2026, 0),
("sav_tokopedia", "card_tokopedia", 2816603, "2026-10-29T00:00:00.000Z", "Tabungan Tagihan Tokopedia", "PERSONAL", 10, 2026, 0),
("sav_mandiri", "card_mandiri", 5500093, "2026-10-25T00:00:00.000Z", "Alokasi Dana Cadangan & Bisnis", "BUSINESS", 10, 2026, 0);

-- 6. Insert Piutangs
INSERT OR REPLACE INTO piutangs (id, card_id, debtor_name, amount, date, note, target_month, target_year, is_collected) VALUES
("piutang_1", "card_tokopedia", "Rekan Bisnis / Teman", 2500000, "2026-10-15T00:00:00.000Z", "Titipan Transaksi Tokopedia", 10, 2026, 0),
("piutang_2", "card_traveloka", "Operasional Project", 1828836, "2026-10-18T00:00:00.000Z", "Talangan Tiket & Booking", 10, 2026, 0);

-- 7. Insert Settings
INSERT OR REPLACE INTO settings (key, value) VALUES
('theme', 'dark'),
('isPinEnabled', 'false');
