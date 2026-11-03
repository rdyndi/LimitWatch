-- 1. Insert Cards (Plafon Rp 85.000.000)
INSERT OR REPLACE INTO cards (id, name, limit_amount, color, due_day, type, e_statement_fee, logo_url) VALUES
('card_traveloka', 'Traveloka', 30000000, 'bg-gradient-to-br from-blue-500 to-indigo-700', 3, 'CREDIT_CARD', 5000, ''),
('card_tokopedia', 'Tokopedia', 30000000, 'bg-gradient-to-br from-emerald-500 to-teal-700', 17, 'CREDIT_CARD', 10000, ''),
('card_mandiri', 'Bank Mandiri', 25000000, 'bg-gradient-to-br from-amber-500 to-orange-700', 20, 'CREDIT_CARD', 0, '');

-- 2. Insert Installments (Cicilan Berjalan)
INSERT OR REPLACE INTO installments (id, card_id, name, total_amount, total_months, monthly_amount, months_paid, start_date, owner) VALUES
('inst_hp_kakak', 'card_traveloka', 'HP KAKAK', 3524016, 24, 146834, 2, '2026-09-03T00:00:00.000Z', 'PERSONAL'),
('inst_mesin_cuci', 'card_traveloka', 'MESIN CUCI', 3155724, 12, 262977, 2, '2026-09-03T00:00:00.000Z', 'BUSINESS'),
('inst_tv_24', 'card_traveloka', 'TV 24', 3352968, 24, 139707, 11, '2025-12-03T00:00:00.000Z', 'PERSONAL'),
('inst_pengeluaran', 'card_traveloka', 'PENGELUARAN', 14249202, 19, 749958, 12, '2025-11-03T00:00:00.000Z', 'PERSONAL'),
('inst_bisnis_2026', 'card_mandiri', 'Investasi Modal Bisnis', 26943427, 12, 2245285, 0, '2026-01-20T00:00:00.000Z', 'BUSINESS');

-- 3. Insert Transactions (Log Transaksi Harian)
INSERT OR REPLACE INTO transactions (id, card_id, amount, date, description, type, category, is_installment, owner, is_validated) VALUES
('tx_jco', 'card_traveloka', 159000, '2026-11-01T00:00:00.000Z', 'JCO', 'EXPENSE', 'Makan & Minum', 0, 'PERSONAL', 1),
('tx_shopee_1', 'card_traveloka', 56500, '2026-10-30T00:00:00.000Z', 'SHOPEE', 'EXPENSE', 'Belanja', 0, 'PERSONAL', 1),
('tx_gojek_1', 'card_traveloka', 10556, '2026-10-24T00:00:00.000Z', 'GOJEK', 'EXPENSE', 'Transportasi', 0, 'BUSINESS', 1),
('tx_gojek_2', 'card_traveloka', 25793, '2026-10-15T00:00:00.000Z', 'GOJEK', 'EXPENSE', 'Transportasi', 0, 'BUSINESS', 1),
('tx_shopee_2', 'card_traveloka', 70640, '2026-10-13T00:00:00.000Z', 'SHOPEE', 'EXPENSE', 'Belanja', 0, 'BUSINESS', 1),
('tx_tiket_hotel', 'card_traveloka', 3885756, '2026-10-20T00:00:00.000Z', 'Tiket Pesawat & Reservasi Hotel', 'EXPENSE', 'Hiburan', 0, 'PERSONAL', 1),
('tx_tokped_belanja', 'card_tokopedia', 4500000, '2026-10-25T00:00:00.000Z', 'Belanja Kebutuhan & Elektronik Tokopedia', 'EXPENSE', 'Belanja', 0, 'PERSONAL', 1),
('tx_tokped_sub', 'card_tokopedia', 805101, '2026-10-28T00:00:00.000Z', 'Langganan Layanan & Tagihan', 'EXPENSE', 'Tagihan', 0, 'PERSONAL', 1),
('tx_mandiri_ops', 'card_mandiri', 3838715, '2026-10-18T00:00:00.000Z', 'Pengeluaran Operasional Mandiri', 'EXPENSE', 'Operasional', 0, 'BUSINESS', 1);

-- 4. Insert Savings (Total Rp 10.824.203)
INSERT OR REPLACE INTO savings (id, card_id, amount, date, note, owner, target_month, target_year, is_transferred) VALUES
('sav_traveloka', 'card_traveloka', 2507507, '2026-10-28T00:00:00.000Z', 'Tabungan Tagihan Traveloka (Nov 2026)', 'PERSONAL', 10, 2026, 0),
('sav_tokopedia', 'card_tokopedia', 2816603, '2026-10-29T00:00:00.000Z', 'Tabungan Tagihan Tokopedia', 'PERSONAL', 10, 2026, 0),
('sav_mandiri', 'card_mandiri', 5500093, '2026-10-25T00:00:00.000Z', 'Alokasi Dana Cadangan & Bisnis', 'BUSINESS', 10, 2026, 0);

-- 5. Insert Piutangs (Total Rp 4.328.836)
INSERT OR REPLACE INTO piutangs (id, card_id, debtor_name, amount, date, note, target_month, target_year, is_collected) VALUES
('piutang_1', 'card_tokopedia', 'Rekan Bisnis / Teman', 2500000, '2026-10-15T00:00:00.000Z', 'Titipan Transaksi Tokopedia', 10, 2026, 0),
('piutang_2', 'card_traveloka', 'Operasional Project', 1828836, '2026-10-18T00:00:00.000Z', 'Talangan Tiket & Booking', 10, 2026, 0);

-- 6. Insert Settings
INSERT OR REPLACE INTO settings (key, value) VALUES
('theme', 'dark'),
('isPinEnabled', 'false');
