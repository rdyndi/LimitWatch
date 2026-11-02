import { describe, it, expect } from 'vitest';
import {
  buildMonthReport,
  buildYearReport,
  getCurrentSavingsBalance,
  getMonthStatus,
  getCardStatus,
  UNLINKED_CARD_ID
} from './yearlyReport';
import { AppState, DebtType, OwnerType, TransactionType } from '../types';
import {
  executeSaveTransaction,
  executeDeleteTransaction,
  executeToggleSavingTransferred
} from '../hooks/useTransactionService';

describe('Yearly Report Calculation Engine', () => {
  // Test dataset with installments, split, used savings, collected piutang, and unlinked items
  const testState: AppState = {
    cards: [
      {
        id: 'card-1',
        name: 'Bank Mega',
        limit: 10_000_000,
        color: 'bg-red-500',
        type: DebtType.CREDIT_CARD,
        dueDay: 15,
        eStatementFee: 15_000
      },
      {
        id: 'card-2',
        name: 'BCA Card',
        limit: 15_000_000,
        color: 'bg-blue-500',
        type: DebtType.CREDIT_CARD,
        dueDay: 25,
        eStatementFee: 0
      }
    ],
    transactions: [
      // Card 1 expense in March 2026 billing (date 2026-03-05 is before dueDay 15 -> month 2 = March)
      {
        id: 'tx-1',
        cardId: 'card-1',
        amount: 500_000,
        date: '2026-03-05T10:00:00Z',
        description: 'Belanja Personal',
        type: TransactionType.EXPENSE,
        owner: OwnerType.PERSONAL
      },
      // Card 1 expense in March 2026 billing
      {
        id: 'tx-2',
        cardId: 'card-1',
        amount: 300_000,
        date: '2026-03-10T11:00:00Z',
        description: 'Server Cloud Bisnis',
        type: TransactionType.EXPENSE,
        owner: OwnerType.BUSINESS
      },
      // Card 2 expense with Split in March 2026 billing (dueDay 25 -> month 2)
      {
        id: 'tx-3',
        cardId: 'card-2',
        amount: 1_000_000,
        date: '2026-03-12T12:00:00Z',
        description: 'Makan Bersama Tim (Split)',
        type: TransactionType.EXPENSE,
        owner: OwnerType.SPLIT,
        splitAmounts: { personal: 600_000, business: 400_000 }
      },
      // Installment source transaction (marked isInstallment: true so not counted twice)
      {
        id: 'tx-inst-source',
        cardId: 'card-1',
        amount: 1_200_000,
        date: '2026-01-10T08:00:00Z',
        description: 'Laptop Cicilan',
        type: TransactionType.EXPENSE,
        isInstallment: true
      },
      // Payment for Card 1 in March 2026
      {
        id: 'tx-pay-1',
        cardId: 'card-1',
        amount: 200_000,
        date: '2026-03-18T14:00:00Z',
        description: 'Bayar Sebagian Kartu 1',
        type: TransactionType.PAYMENT,
        targetPeriod: { month: 2, year: 2026 }
      }
    ],
    installments: [
      {
        id: 'inst-1',
        cardId: 'card-1',
        name: 'Laptop Cicilan',
        totalAmount: 1_200_000,
        monthlyAmount: 200_000,
        totalMonths: 6,
        monthsPaid: 0,
        startDate: '2026-01-10T08:00:00Z',
        owner: OwnerType.SPLIT,
        splitAmounts: { personal: 120_000, business: 80_000 }
      }
    ],
    savings: [
      // Saving 1: Transferred / used in March 2026
      {
        id: 'sav-1',
        cardId: 'card-1',
        amount: 250_000,
        date: '2026-02-15T09:00:00Z',
        note: 'Tabungan Bayar Mega',
        targetPeriod: { month: 2, year: 2026 },
        isTransferred: true,
        transferredAt: '2026-03-01T10:00:00Z',
        usedAmount: 250_000
      },
      // Saving 2: Active (belum terpakai)
      {
        id: 'sav-2',
        cardId: 'card-1',
        amount: 300_000,
        date: '2026-03-10T09:00:00Z',
        note: 'Tabungan Cadangan Mega',
        targetPeriod: { month: 2, year: 2026 },
        isTransferred: false
      },
      // Saving 3: Card 2 active
      {
        id: 'sav-3',
        cardId: 'card-2',
        amount: 500_000,
        date: '2026-01-20T09:00:00Z',
        note: 'Tabungan BCA',
        targetPeriod: { month: 2, year: 2026 },
        isTransferred: false
      },
      // Saving 4: Unlinked saving (tanpa kartu)
      {
        id: 'sav-unlinked',
        cardId: '',
        amount: 150_000,
        date: '2026-03-01T09:00:00Z',
        note: 'Tabungan Bebas',
        targetPeriod: { month: 2, year: 2026 },
        isTransferred: false
      },
      // Saving 5: Legacy transferred without transferredAt date (tests fallback & estimated flag)
      {
        id: 'sav-legacy',
        cardId: 'card-1',
        amount: 100_000,
        date: '2026-01-05T09:00:00Z',
        note: 'Tabungan Lama Terpakai',
        targetPeriod: { month: 0, year: 2026 },
        isTransferred: true
      }
    ],
    piutangs: [
      // Piutang 1: Collected in March 2026
      {
        id: 'piu-1',
        cardId: 'card-1',
        debtorName: 'Budi',
        amount: 400_000,
        date: '2026-02-01T10:00:00Z',
        note: 'Pinjam Uang Makan',
        targetPeriod: { month: 2, year: 2026 },
        isCollected: true,
        collectedAt: '2026-03-05T12:00:00Z'
      },
      // Piutang 2: Active on Card 2
      {
        id: 'piu-2',
        cardId: 'card-2',
        debtorName: 'Siti',
        amount: 600_000,
        date: '2026-03-02T10:00:00Z',
        note: 'Pinjam Beli Pulsa',
        targetPeriod: { month: 2, year: 2026 },
        isCollected: false
      },
      // Piutang 3: Unlinked legacy collected without collectedAt date
      {
        id: 'piu-unlinked-legacy',
        cardId: '',
        debtorName: 'Andi',
        amount: 200_000,
        date: '2026-01-10T10:00:00Z',
        note: 'Pinjam Cash Bebas',
        targetPeriod: { month: 0, year: 2026 },
        isCollected: true
      }
    ]
  };

  it('Invarian 1: Jumlah semua kartu = total bulan untuk setiap angka', () => {
    for (let month = 0; month < 12; month++) {
      const report = buildMonthReport(testState, 2026, month);

      const sumTagihan = report.cards.reduce((sum, c) => sum + c.tagihan, 0);
      const sumDibayar = report.cards.reduce((sum, c) => sum + c.dibayar, 0);
      const sumKurang = report.cards.reduce((sum, c) => sum + c.kurang, 0);
      const sumPribadi = report.cards.reduce((sum, c) => sum + c.pribadi, 0);
      const sumBisnis = report.cards.reduce((sum, c) => sum + c.bisnis, 0);

      const sumUntukTagihan = report.cards.reduce((sum, c) => sum + c.tabungan.untukTagihan, 0);
      const sumSetoran = report.cards.reduce((sum, c) => sum + c.tabungan.setoran, 0);
      const sumDipakai = report.cards.reduce((sum, c) => sum + c.tabungan.dipakai, 0);
      const sumSaldoAwal = report.cards.reduce((sum, c) => sum + c.tabungan.saldoAwal, 0);
      const sumSaldoAkhir = report.cards.reduce((sum, c) => sum + c.tabungan.saldoAkhir, 0);

      const sumPiutangUntukTagihan = report.cards.reduce(
        (sum, c) => sum + c.piutang.untukTagihan,
        0
      );
      const sumPiutangBaru = report.cards.reduce((sum, c) => sum + c.piutang.piutangBaru, 0);
      const sumDikembalikan = report.cards.reduce((sum, c) => sum + c.piutang.dikembalikan, 0);
      const sumSisaAwal = report.cards.reduce((sum, c) => sum + c.piutang.sisaAwal, 0);
      const sumSisaBerjalan = report.cards.reduce((sum, c) => sum + c.piutang.sisaBerjalan, 0);

      expect(sumTagihan).toBe(report.total.tagihan);
      expect(sumDibayar).toBe(report.total.dibayar);
      expect(sumKurang).toBe(report.total.kurang);
      expect(sumPribadi).toBe(report.total.pribadi);
      expect(sumBisnis).toBe(report.total.bisnis);

      expect(sumUntukTagihan).toBe(report.total.tabungan.untukTagihan);
      expect(sumSetoran).toBe(report.total.tabungan.setoran);
      expect(sumDipakai).toBe(report.total.tabungan.dipakai);
      expect(sumSaldoAwal).toBe(report.total.tabungan.saldoAwal);
      expect(sumSaldoAkhir).toBe(report.total.tabungan.saldoAkhir);

      expect(sumPiutangUntukTagihan).toBe(report.total.piutang.untukTagihan);
      expect(sumPiutangBaru).toBe(report.total.piutang.piutangBaru);
      expect(sumDikembalikan).toBe(report.total.piutang.dikembalikan);
      expect(sumSisaAwal).toBe(report.total.piutang.sisaAwal);
      expect(sumSisaBerjalan).toBe(report.total.piutang.sisaBerjalan);
    }
  });

  it('Invarian 2: pribadi + bisnis = tagihan, per kartu dan per bulan', () => {
    for (let month = 0; month < 12; month++) {
      const report = buildMonthReport(testState, 2026, month);

      // Per card
      report.cards.forEach((card) => {
        expect(card.pribadi + card.bisnis).toBe(card.tagihan);
      });

      // Total month
      expect(report.total.pribadi + report.total.bisnis).toBe(report.total.tagihan);
    }
  });

  it('Invarian 3: saldoAkhir = saldoAwal + setoran - dipakai; sisaBerjalan = sisaAwal + piutangBaru - dikembalikan', () => {
    let prevSavingsEnding: number | null = null;
    let prevPiutangEnding: number | null = null;

    for (let month = 0; month < 12; month++) {
      const report = buildMonthReport(testState, 2026, month);

      // Check card level
      report.cards.forEach((card) => {
        const expectedSaldoAkhir =
          card.tabungan.saldoAwal + card.tabungan.setoran - card.tabungan.dipakai;
        expect(card.tabungan.saldoAkhir).toBe(expectedSaldoAkhir);

        const expectedSisaBerjalan =
          card.piutang.sisaAwal + card.piutang.piutangBaru - card.piutang.dikembalikan;
        expect(card.piutang.sisaBerjalan).toBe(expectedSisaBerjalan);
      });

      // Check total level
      const totalExpectedSaldoAkhir =
        report.total.tabungan.saldoAwal +
        report.total.tabungan.setoran -
        report.total.tabungan.dipakai;
      expect(report.total.tabungan.saldoAkhir).toBe(totalExpectedSaldoAkhir);

      const totalExpectedSisaBerjalan =
        report.total.piutang.sisaAwal +
        report.total.piutang.piutangBaru -
        report.total.piutang.dikembalikan;
      expect(report.total.piutang.sisaBerjalan).toBe(totalExpectedSisaBerjalan);

      // Verify continuity: saldoAwal(m) === saldoAkhir(m - 1)
      if (prevSavingsEnding !== null) {
        expect(report.total.tabungan.saldoAwal).toBe(prevSavingsEnding);
      }
      if (prevPiutangEnding !== null) {
        expect(report.total.piutang.sisaAwal).toBe(prevPiutangEnding);
      }

      prevSavingsEnding = report.total.tabungan.saldoAkhir;
      prevPiutangEnding = report.total.piutang.sisaBerjalan;
    }
  });

  it('Invarian 4: Jumlah 12 bulan = total tahun (untuk angka arus; bukan untuk saldo)', () => {
    const yearReport = buildYearReport(testState, 2026);

    const sumMonthsTagihan = yearReport.months.reduce((sum, m) => sum + m.total.tagihan, 0);
    const sumMonthsDibayar = yearReport.months.reduce((sum, m) => sum + m.total.dibayar, 0);
    const sumMonthsKurang = yearReport.months.reduce((sum, m) => sum + m.total.kurang, 0);
    const sumMonthsPribadi = yearReport.months.reduce((sum, m) => sum + m.total.pribadi, 0);
    const sumMonthsBisnis = yearReport.months.reduce((sum, m) => sum + m.total.bisnis, 0);

    const sumMonthsSetoran = yearReport.months.reduce((sum, m) => sum + m.total.tabungan.setoran, 0);
    const sumMonthsDipakai = yearReport.months.reduce((sum, m) => sum + m.total.tabungan.dipakai, 0);

    const sumMonthsPiutangBaru = yearReport.months.reduce(
      (sum, m) => sum + m.total.piutang.piutangBaru,
      0
    );
    const sumMonthsDikembalikan = yearReport.months.reduce(
      (sum, m) => sum + m.total.piutang.dikembalikan,
      0
    );

    // Flow sums check
    expect(sumMonthsTagihan).toBe(yearReport.total.tagihan);
    expect(sumMonthsDibayar).toBe(yearReport.total.dibayar);
    expect(sumMonthsKurang).toBe(yearReport.total.kurang);
    expect(sumMonthsPribadi).toBe(yearReport.total.pribadi);
    expect(sumMonthsBisnis).toBe(yearReport.total.bisnis);
    expect(sumMonthsSetoran).toBe(yearReport.total.tabungan.setoran);
    expect(sumMonthsDipakai).toBe(yearReport.total.tabungan.dipakai);
    expect(sumMonthsPiutangBaru).toBe(yearReport.total.piutang.piutangBaru);
    expect(sumMonthsDikembalikan).toBe(yearReport.total.piutang.dikembalikan);

    // Balances check: Year start is Jan start, Year end is Dec end
    expect(yearReport.total.tabungan.saldoAwal).toBe(yearReport.months[0].total.tabungan.saldoAwal);
    expect(yearReport.total.tabungan.saldoAkhir).toBe(
      yearReport.months[11].total.tabungan.saldoAkhir
    );
    expect(yearReport.total.piutang.sisaAwal).toBe(yearReport.months[0].total.piutang.sisaAwal);
    expect(yearReport.total.piutang.sisaBerjalan).toBe(
      yearReport.months[11].total.piutang.sisaBerjalan
    );
  });

  it('Invarian 5: Saldo tabungan saat ini = jumlah saving dengan isTransferred false (sama dengan SavingsView)', () => {
    const expectedCurrentSavings = testState.savings
      .filter((s) => !s.isTransferred)
      .reduce((sum, s) => sum + s.amount, 0);

    const calculatedSavings = getCurrentSavingsBalance(testState);
    expect(calculatedSavings).toBe(expectedCurrentSavings);

    // Check after all activity through end of year 2026:
    const yearReport = buildYearReport(testState, 2026);
    expect(yearReport.total.tabungan.saldoAkhir).toBe(expectedCurrentSavings);
  });

  it('Mendeteksi data legacy bertanda estimated dengan benar', () => {
    const janReport = buildMonthReport(testState, 2026, 0);
    // Legacy saving without transferredAt in Jan 2026
    expect(janReport.total.tabungan.dipakaiEstimated).toBe(true);
    // Legacy piutang without collectedAt in Jan 2026
    expect(janReport.total.piutang.dikembalikanEstimated).toBe(true);

    const marchReport = buildMonthReport(testState, 2026, 2);
    // March saving has explicit transferredAt timestamp -> estimated is false
    expect(marchReport.total.tabungan.dipakaiEstimated).toBe(false);
    expect(marchReport.total.piutang.dikembalikanEstimated).toBe(false);
  });

  it('Menyertakan bucket unlinked (Tanpa Kartu) saat ada data tanpa cardId', () => {
    const marchReport = buildMonthReport(testState, 2026, 2);
    const unlinkedCard = marchReport.cards.find((c) => c.cardId === UNLINKED_CARD_ID);
    expect(unlinkedCard).toBeDefined();
    expect(unlinkedCard?.isUnlinked).toBe(true);
    expect(unlinkedCard?.tabungan.setoran).toBe(150_000);
  });

  describe('Bug 1 & 2: Pemakaian tabungan sebagian dan pembatalan transaksi', () => {
    const baseSavingState: AppState = {
      cards: [
        {
          id: 'card-test',
          name: 'Kartu Uji',
          limit: 10_000_000,
          color: 'bg-emerald-500',
          type: DebtType.CREDIT_CARD,
          dueDay: 20
        }
      ],
      transactions: [],
      installments: [],
      savings: [
        {
          id: 'sav-initial-2jt',
          cardId: 'card-test',
          amount: 2_000_000,
          date: '2026-03-01T08:00:00Z',
          note: 'Tabungan Pelunasan',
          targetPeriod: { month: 2, year: 2026 }, // Maret 2026
          isTransferred: false
        }
      ],
      piutangs: []
    };

    it('Test 1: Bayar tagihan dengan tabungan Rp 2.000.000 tetapi memakai Rp 500.000 -> dipakai 500.000, saldo akhir 1.500.000, total amount semua record tidak berubah', () => {
      const initialTotalAmount = baseSavingState.savings.reduce((s, item) => s + item.amount, 0);

      const stateAfterPay = executeSaveTransaction(
        baseSavingState,
        {
          cardId: 'card-test',
          type: TransactionType.PAYMENT,
          amount: 0,
          description: 'Bayar Tagihan Maret',
          date: '2026-03-15T10:00:00Z',
          useSavings: true,
          savingsAmount: 500_000,
          targetMonth: 2,
          targetYear: 2026
        },
        2_000_000,
        null
      );

      expect(stateAfterPay).not.toBeNull();
      if (!stateAfterPay) return;

      // Check total amount across all savings records does not change (Bug 1 rule)
      const afterPayTotalAmount = stateAfterPay.savings.reduce((s, item) => s + item.amount, 0);
      expect(afterPayTotalAmount).toBe(initialTotalAmount);
      expect(afterPayTotalAmount).toBe(2_000_000);

      // Record pecah jadi dua: 500k terpakai dan 1.500k sisa
      const usedSaving = stateAfterPay.savings.find((s) => s.isTransferred);
      const remainingSaving = stateAfterPay.savings.find((s) => !s.isTransferred);

      expect(usedSaving).toBeDefined();
      expect(usedSaving?.amount).toBe(500_000);
      expect(usedSaving?.usedAmount).toBe(500_000);
      expect(usedSaving?.usedByTransactionId).toBe(stateAfterPay.transactions[0].id);

      expect(remainingSaving).toBeDefined();
      expect(remainingSaving?.amount).toBe(1_500_000);
      expect(remainingSaving?.splitFromSavingId).toBe('sav-initial-2jt');

      // Check report ledger
      const report = buildMonthReport(stateAfterPay, 2026, 2);
      expect(report.total.tabungan.setoran).toBe(2_000_000);
      expect(report.total.tabungan.dipakai).toBe(500_000);
      expect(report.total.tabungan.saldoAkhir).toBe(1_500_000);
      expect(getCurrentSavingsBalance(stateAfterPay)).toBe(1_500_000);
    });

    it('Test 2: Pakai 500.000, lalu hapus pembayarannya -> saldo tabungan kembali Rp 2.000.000 dan record yang terpecah menyatu lagi', () => {
      // 1. Eksekusi pembayaran memakai 500k
      const stateAfterPay = executeSaveTransaction(
        baseSavingState,
        {
          cardId: 'card-test',
          type: TransactionType.PAYMENT,
          amount: 0,
          description: 'Bayar Tagihan Maret',
          date: '2026-03-15T10:00:00Z',
          useSavings: true,
          savingsAmount: 500_000,
          targetMonth: 2,
          targetYear: 2026
        },
        2_000_000,
        null
      )!;

      const paymentTxId = stateAfterPay.transactions[0].id;

      // 2. Hapus transaksi pembayaran
      const stateAfterDelete = executeDeleteTransaction(stateAfterPay, paymentTxId);

      // Record terpecah menyatu lagi menjadi 1 record Rp 2.000.000
      expect(stateAfterDelete.savings.length).toBe(1);
      expect(stateAfterDelete.savings[0].amount).toBe(2_000_000);
      expect(stateAfterDelete.savings[0].isTransferred).toBe(false);
      expect(stateAfterDelete.savings[0].usedByTransactionId).toBeUndefined();
      expect(getCurrentSavingsBalance(stateAfterDelete)).toBe(2_000_000);

      // Check report ledger
      const report = buildMonthReport(stateAfterDelete, 2026, 2);
      expect(report.total.tabungan.dipakai).toBe(0);
      expect(report.total.tabungan.saldoAkhir).toBe(2_000_000);
    });

    it('Test 3: Edit pembayaran dari 500.000 menjadi 800.000 -> dipakai 800.000, sisa 1.200.000', () => {
      // 1. Eksekusi pembayaran memakai 500k
      const stateAfterPay = executeSaveTransaction(
        baseSavingState,
        {
          cardId: 'card-test',
          type: TransactionType.PAYMENT,
          amount: 0,
          description: 'Bayar Tagihan Maret',
          date: '2026-03-15T10:00:00Z',
          useSavings: true,
          savingsAmount: 500_000,
          targetMonth: 2,
          targetYear: 2026
        },
        2_000_000,
        null
      )!;

      const existingPaymentTx = stateAfterPay.transactions[0];

      // 2. Edit pembayaran menjadi memakai 800k
      const stateAfterEdit = executeSaveTransaction(
        stateAfterPay,
        {
          cardId: 'card-test',
          type: TransactionType.PAYMENT,
          amount: 0,
          description: 'Bayar Tagihan Maret (Update)',
          date: '2026-03-15T10:00:00Z',
          useSavings: true,
          savingsAmount: 800_000,
          targetMonth: 2,
          targetYear: 2026
        },
        2_000_000,
        existingPaymentTx
      )!;

      // Check total amount across all savings records does not change
      const totalAmount = stateAfterEdit.savings.reduce((s, item) => s + item.amount, 0);
      expect(totalAmount).toBe(2_000_000);

      // Check ledger
      const report = buildMonthReport(stateAfterEdit, 2026, 2);
      expect(report.total.tabungan.dipakai).toBe(800_000);
      expect(report.total.tabungan.saldoAkhir).toBe(1_200_000);
      expect(getCurrentSavingsBalance(stateAfterEdit)).toBe(1_200_000);
    });

    it('Langkah 3.0: executeToggleSavingTransferred membersihkan usedByTransactionId saat ditandai belum terpakai secara manual', () => {
      const stateWithUsedSaving: AppState = {
        ...baseSavingState,
        savings: [
          {
            id: 'sav-tied',
            cardId: 'card-test',
            amount: 500_000,
            date: '2026-03-01T08:00:00Z',
            note: 'Tabungan Terpakai Oleh Transaksi',
            isTransferred: true,
            transferredAt: '2026-03-15T10:00:00Z',
            usedAmount: 500_000,
            usedByTransactionId: 'tx-payment-123'
          }
        ]
      };

      // Toggle saving to false (belum terpakai)
      const toggledState = executeToggleSavingTransferred(stateWithUsedSaving, 'sav-tied');
      const toggledSaving = toggledState.savings[0];

      expect(toggledSaving.isTransferred).toBe(false);
      expect(toggledSaving.transferredAt).toBeUndefined();
      expect(toggledSaving.usedAmount).toBeUndefined();
      expect(toggledSaving.usedByTransactionId).toBeUndefined();
    });
  });

  describe('Tahap 3 UI: Pemetaan status bulan dan penelusuran ID sumber', () => {
    it('Status bulan: Mendeteksi Lunas, Kurang, Mendatang, dan Kosong dengan benar', () => {
      const fixedNow = new Date('2026-03-15T00:00:00Z');

      // 1. Bulan kosong di masa lalu (Februari 2026 tanpa tagihan & pembayaran)
      const emptyMonthReport = buildMonthReport(
        {
          cards: [],
          transactions: [],
          installments: [],
          savings: [],
          piutangs: []
        },
        2026,
        1
      );
      const statusKosong = getMonthStatus(emptyMonthReport, fixedNow);
      expect(statusKosong.type).toBe('KOSONG');
      expect(statusKosong.label).toBe('Belum ada tagihan');

      // 2. Bulan kosong di masa mendatang (Desember 2026)
      const futureEmptyReport = buildMonthReport(
        {
          cards: [],
          transactions: [],
          installments: [],
          savings: [],
          piutangs: []
        },
        2026,
        11
      );
      const statusMendatangKosong = getMonthStatus(futureEmptyReport, fixedNow);
      expect(statusMendatangKosong.type).toBe('MENDATANG');
      expect(statusMendatangKosong.label).toBe('Mendatang');

      // 3. Bulan dengan tagihan tetapi di masa mendatang -> TIDAK boleh menampilkan "Kurang"
      const futureWithBillReport = buildMonthReport(testState, 2026, 5); // Juni 2026 (ada sisa cicilan laptop)
      const statusMendatangCicilan = getMonthStatus(futureWithBillReport, fixedNow);
      expect(statusMendatangCicilan.type).toBe('MENDATANG');
      expect(statusMendatangCicilan.label).toBe('Mendatang');

      // 4. Bulan berjalan/lalu yang kurang bersih > 0 -> status KURANG
      const currentMonthReport = buildMonthReport(testState, 2026, 2); // Maret 2026
      const statusKurang = getMonthStatus(currentMonthReport, fixedNow);
      expect(statusKurang.type).toBe('KURANG');
      expect(statusKurang.label).toContain('Kurang');
      expect(statusKurang.kurangBersih).toBeGreaterThan(0);
    });

    it('Penelusuran ID sumber: Memastikan setiap ID sumber di laporan dapat ditelusuri ke datanya', () => {
      const marchReport = buildMonthReport(testState, 2026, 2);

      // Verifikasi ID transaksi tagihan
      marchReport.total.expenseTxIds.forEach((id) => {
        const found = testState.transactions.find((t) => t.id === id);
        expect(found).toBeDefined();
        expect(found?.type).toBe(TransactionType.EXPENSE);
      });

      // Verifikasi ID cicilan
      marchReport.total.installmentIds.forEach((id) => {
        const found = testState.installments.find((i) => i.id === id);
        expect(found).toBeDefined();
      });

      // Verifikasi ID pembayaran
      marchReport.total.paymentTxIds.forEach((id) => {
        const found = testState.transactions.find((t) => t.id === id);
        expect(found).toBeDefined();
        expect(found?.type).toBe(TransactionType.PAYMENT);
      });

      // Verifikasi ID tabungan setoran
      marchReport.total.tabungan.setoranSavingIds.forEach((id) => {
        const found = testState.savings.find((s) => s.id === id);
        expect(found).toBeDefined();
      });

      // Verifikasi ID tabungan dipakai
      marchReport.total.tabungan.dipakaiSavingIds.forEach((id) => {
        const found = testState.savings.find((s) => s.id === id);
        expect(found).toBeDefined();
        expect(found?.isTransferred).toBe(true);
      });

      // Verifikasi ID piutang baru
      marchReport.total.piutang.piutangBaruIds.forEach((id) => {
        const found = (testState.piutangs || []).find((p) => p.id === id);
        expect(found).toBeDefined();
      });

      // Verifikasi ID piutang kembali
      marchReport.total.piutang.dikembalikanPiutangIds.forEach((id) => {
        const found = (testState.piutangs || []).find((p) => p.id === id);
        expect(found).toBeDefined();
        expect(found?.isCollected).toBe(true);
      });
    });
  });

  describe('Status Tiga Tingkat (getMonthStatus & getCardStatus)', () => {
    // (a) tagihan Rp 4.000.000, belum dibayar, tabungan belum-terpakai Rp 4.000.000 → TERTUTUP, bukan LUNAS
    it('(a) tagihan Rp 4.000.000, belum dibayar, tabungan belum-terpakai Rp 4.000.000 -> TERTUTUP, bukan LUNAS', () => {
      const state: AppState = {
        cards: [
          {
            id: 'c1',
            name: 'Card A',
            limit: 10_000_000,
            color: 'bg-blue-500',
            type: DebtType.CREDIT_CARD,
            dueDay: 15,
            eStatementFee: 0
          }
        ],
        transactions: [
          {
            id: 'tx-1',
            cardId: 'c1',
            amount: 4_000_000,
            date: '2026-03-05T10:00:00Z',
            description: 'Belanja',
            type: TransactionType.EXPENSE,
            owner: OwnerType.PERSONAL
          }
        ],
        installments: [],
        savings: [
          {
            id: 'sav-1',
            cardId: 'c1',
            amount: 4_000_000,
            date: '2026-03-01T10:00:00Z',
            note: 'Tabungan',
            targetPeriod: { month: 2, year: 2026 },
            isTransferred: false
          }
        ],
        piutangs: []
      };

      const monthReport = buildMonthReport(state, 2026, 2);
      expect(monthReport.total.tagihan).toBe(4_000_000);
      expect(monthReport.total.dibayar).toBe(0);
      expect(monthReport.total.kurang).toBe(4_000_000);
      expect(monthReport.total.tabungan.tabunganBelumTerpakai).toBe(4_000_000);
      expect(monthReport.total.kurangBersih).toBe(0);

      // Simulasikan tanggal di bulan berjalan (Maret 2026)
      const curDate = new Date(2026, 2, 10);
      const status = getMonthStatus(monthReport, curDate);
      expect(status.type).toBe('TERTUTUP');
      expect(status.label).toBe('Tertutup tabungan/piutang');
      expect(status.type).not.toBe('LUNAS');

      // Pastikan getCardStatus juga mengembalikan TERTUTUP
      const cardReport = monthReport.cards[0];
      const cardStatus = getCardStatus(cardReport, 2026, 2, curDate);
      expect(cardStatus.type).toBe('TERTUTUP');
      expect(cardStatus.label).toBe('Tertutup tabungan/piutang');
    });

    // (b) bulan berstatus LUNAS tidak mungkin punya kartu berstatus KURANG
    it('(b) bulan berstatus LUNAS tidak mungkin punya kartu berstatus KURANG', () => {
      const state: AppState = {
        cards: [
          {
            id: 'c1',
            name: 'Card 1',
            limit: 10_000_000,
            color: 'bg-red-500',
            type: DebtType.CREDIT_CARD,
            dueDay: 15,
            eStatementFee: 0
          },
          {
            id: 'c2',
            name: 'Card 2',
            limit: 10_000_000,
            color: 'bg-blue-500',
            type: DebtType.CREDIT_CARD,
            dueDay: 20,
            eStatementFee: 0
          }
        ],
        transactions: [
          {
            id: 'tx-1',
            cardId: 'c1',
            amount: 2_000_000,
            date: '2026-03-05T10:00:00Z',
            description: 'Belanja 1',
            type: TransactionType.EXPENSE,
            owner: OwnerType.PERSONAL
          },
          {
            id: 'tx-2',
            cardId: 'c2',
            amount: 3_000_000,
            date: '2026-03-05T10:00:00Z',
            description: 'Belanja 2',
            type: TransactionType.EXPENSE,
            owner: OwnerType.PERSONAL
          },
          {
            id: 'tx-pay-1',
            cardId: 'c1',
            amount: 2_000_000,
            date: '2026-03-10T10:00:00Z',
            description: 'Bayar 1',
            type: TransactionType.PAYMENT,
            targetPeriod: { month: 2, year: 2026 }
          },
          {
            id: 'tx-pay-2',
            cardId: 'c2',
            amount: 3_000_000,
            date: '2026-03-10T10:00:00Z',
            description: 'Bayar 2',
            type: TransactionType.PAYMENT,
            targetPeriod: { month: 2, year: 2026 }
          }
        ],
        installments: [],
        savings: [],
        piutangs: []
      };

      const monthReport = buildMonthReport(state, 2026, 2);
      const curDate = new Date(2026, 2, 15);
      const monthStatus = getMonthStatus(monthReport, curDate);

      expect(monthStatus.type).toBe('LUNAS');

      // Memastikan TIDAK ADA kartu yang berstatus KURANG
      monthReport.cards.forEach((c) => {
        const cStatus = getCardStatus(c, 2026, 2, curDate);
        expect(cStatus.type).not.toBe('KURANG');
        expect(cStatus.type).toBe('LUNAS');
      });
    });

    // (c) bulan mendatang dengan kurangBersih > 0 → MENDATANG dengan nilai "perlu"
    it('(c) bulan mendatang dengan kurangBersih > 0 -> MENDATANG dengan nilai "perlu"', () => {
      const state: AppState = {
        cards: [
          {
            id: 'c1',
            name: 'Card 1',
            limit: 10_000_000,
            color: 'bg-red-500',
            type: DebtType.CREDIT_CARD,
            dueDay: 15,
            eStatementFee: 0
          }
        ],
        transactions: [
          {
            id: 'tx-future',
            cardId: 'c1',
            amount: 1_500_000,
            date: '2026-08-05T10:00:00Z',
            description: 'Rencana Belanja',
            type: TransactionType.EXPENSE,
            owner: OwnerType.PERSONAL
          }
        ],
        installments: [],
        savings: [],
        piutangs: []
      };

      // Evaluasi Agustus 2026 (month 7) saat tanggal sistem adalah Maret 2026 (month 2)
      const monthReport = buildMonthReport(state, 2026, 7);
      const curDate = new Date(2026, 2, 10);
      const status = getMonthStatus(monthReport, curDate);

      expect(status.type).toBe('MENDATANG');
      expect(status.label).toBe('Mendatang');
      expect(status.kurangBersih).toBe(1_500_000);
      expect(status.subLabel).toBeDefined();
      expect(status.subLabel).toContain('perlu');
      expect(status.subLabel).toContain('1.500.000');
    });

    it('excludes transferred savings and collected piutangs from untukTagihan calculation', () => {
      const state: AppState = {
        cards: [
          {
            id: 'c1',
            name: 'Card 1',
            limit: 10_000_000,
            color: 'bg-red-500',
            type: DebtType.CREDIT_CARD,
            dueDay: 15,
            eStatementFee: 0
          }
        ],
        transactions: [],
        installments: [],
        savings: [
          {
            id: 's1',
            cardId: 'c1',
            amount: 5_000_000,
            date: '2026-01-05T00:00:00Z',
            note: 'Tabungan Jan Untransferred',
            targetPeriod: { month: 0, year: 2026 },
            isTransferred: false
          },
          {
            id: 's2',
            cardId: 'c1',
            amount: 3_000_000,
            date: '2026-01-05T00:00:00Z',
            note: 'Tabungan Jan Transferred',
            targetPeriod: { month: 0, year: 2026 },
            isTransferred: true,
            transferredAt: '2026-01-10T00:00:00Z'
          }
        ],
        piutangs: [
          {
            id: 'p1',
            cardId: 'c1',
            debtorName: 'Budi',
            note: 'Piutang Budi',
            amount: 2_000_000,
            date: '2026-01-05T00:00:00Z',
            targetPeriod: { month: 0, year: 2026 },
            isCollected: false
          },
          {
            id: 'p2',
            cardId: 'c1',
            debtorName: 'Andi',
            note: 'Piutang Andi',
            amount: 1_000_000,
            date: '2026-01-05T00:00:00Z',
            targetPeriod: { month: 0, year: 2026 },
            isCollected: true,
            collectedAt: '2026-01-12T00:00:00Z'
          }
        ]
      };

      const monthReport = buildMonthReport(state, 2026, 0);

      // untukTagihan should ONLY count s1 (5,000,000) and ignore s2 (3,000,000)
      expect(monthReport.total.tabungan.untukTagihan).toBe(5_000_000);
      expect(monthReport.total.tabungan.untukTagihanSavingIds).toEqual(['s1']);

      // piutangUntukTagihan should ONLY count p1 (2,000,000) and ignore p2 (1,000,000)
      expect(monthReport.total.piutang.untukTagihan).toBe(2_000_000);
      expect(monthReport.total.piutang.untukTagihanPiutangIds).toEqual(['p1']);
    });
  });
});


