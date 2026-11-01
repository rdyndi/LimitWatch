# Rencana Implementasi: Pengeluaran Tabungan Terpakai dari Tagihan Bulan Ini

Berdasarkan konfirmasi Anda: **"Keluarkan tabungan yang sudah terpakai dari perhitungan tagihan bulan ini sepenuhnya"**, berikut adalah rencana penyesuaian logika dan UI pada LimitWatch.

---

## 1. Analisis Perubahan Logika (`lib/yearlyReport.ts`)

Saat ini, tabungan yang ditargetkan untuk bulan tertentu (`targetPeriod`) tetap dijumlahkan ke dalam `untukTagihan` meskipun statusnya sudah ditransfer/digunakan (`isTransferred = true`). Hal ini menyebabkan angka "Tabungan untuk Tagihan Bulan Ini" di layar **Detail Bulan** tetap memunculkan nominal tabungan yang sebenarnya sudah dipakai bayar tagihan.

### Perubahan yang Akan Dilakukan:
1. **Perhitungan Tabungan (`buildCardMonthReport`)**:
   - Hanya masukkan tabungan ke `untukTagihan` dan `untukTagihanSavingIds` **apabila tabungan tersebut BELUM terpakai** (`!s.isTransferred`).
   - Tabungan yang sudah terpakai (`isTransferred = true`) otomatis bernilai 0 pada `untukTagihan` bulan tersebut.
2. **Perhitungan Piutang (`buildCardMonthReport`)**:
   - Terapkan hal yang sama pada piutang: hanya masukkan ke `piutangUntukTagihan` jika piutang **BELUM kembali** (`!p.isCollected`).
3. **Penyelarasan Status & Kurang Bersih**:
   - Penentuan status bulan (LUNAS, TERTUTUP, KURANG) dan `kurangBersih` tetap konsisten karena hanya memperhitungkan tabungan/piutang yang masih tersedia/aktif (`tabunganBelumTerpakai` dan `piutangBelumKembali`).

---

## 2. Pengujian & Verifikasi Automated Test (`lib/yearlyReport.test.ts`)

1. Tambahkan unit test di `lib/yearlyReport.test.ts`:
   - Skenario A: Ada tabungan Rp 5.000.000 target Jan 2026, status `isTransferred = true` -> `untukTagihan` Jan 2026 harus menjadi `0`.
   - Skenario B: Ada tabungan Rp 5.000.000 target Jan 2026, status `isTransferred = false` -> `untukTagihan` Jan 2026 adalah `5.000.000`.
2. Jalankan pengujian otomatis via `npm test`.
3. Jalankan `compile_applet` dan `lint_applet` untuk memastikan tidak ada kesalahan kompilasi atau TypeScript lint error.

---

## 3. Langkah Selanjutnya

Mohon tinjau rencana di atas. Setelah Anda menekan **Proceed** atau mengonfirmasi setuju, saya akan langsung menerapkan perubahan kode ini dan memverifikasi hasilnya.
