import { AppState, CreditCard, Transaction, TransactionType, OwnerType } from '../types';
import { getBillingPeriod, getOwnerSplit } from './billing';

export const UNLINKED_CARD_ID = '__unlinked__';
export const UNLINKED_CARD_NAME = 'Tanpa Kartu';
export const UNLINKED_CARD_COLOR = 'bg-slate-500';

export interface CardSavingsReport {
  untukTagihan: number;
  untukTagihanSavingIds: string[];
  tabunganBelumTerpakai: number;
  saldoAwal: number;
  setoran: number;
  setoranSavingIds: string[];
  dipakai: number;
  dipakaiSavingIds: string[];
  dipakaiEstimated: boolean;
  saldoAkhir: number;
}

export interface CardPiutangReport {
  untukTagihan: number;
  untukTagihanPiutangIds: string[];
  piutangBelumKembali: number;
  sisaAwal: number;
  piutangBaru: number;
  piutangBaruIds: string[];
  dikembalikan: number;
  dikembalikanPiutangIds: string[];
  dikembalikanEstimated: boolean;
  sisaBerjalan: number;
}

export interface CardMonthReport {
  cardId: string;
  cardName: string;
  cardColor: string;
  dueDay?: number;
  isUnlinked?: boolean;
  cardObj?: CreditCard;

  tagihan: number;
  expenseTxIds: string[];
  installmentIds: string[];

  dibayar: number;
  paymentTxIds: string[];

  kurang: number;
  kurangBersih: number;

  pribadi: number;
  personalTxIds: string[];
  personalInstallmentIds: string[];

  bisnis: number;
  businessTxIds: string[];
  businessInstallmentIds: string[];

  tabungan: CardSavingsReport;
  piutang: CardPiutangReport;
}

export interface MonthReport {
  year: number;
  month: number;
  cards: CardMonthReport[];
  total: {
    tagihan: number;
    expenseTxIds: string[];
    installmentIds: string[];

    dibayar: number;
    paymentTxIds: string[];

    kurang: number;
    kurangBersih: number;

    pribadi: number;
    personalTxIds: string[];
    personalInstallmentIds: string[];

    bisnis: number;
    businessTxIds: string[];
    businessInstallmentIds: string[];

    tabungan: CardSavingsReport;
    piutang: CardPiutangReport;
  };
}

export interface YearReport {
  year: number;
  months: MonthReport[];
  cards: Array<{
    cardId: string;
    cardName: string;
    cardColor: string;
    isUnlinked?: boolean;
    tagihan: number;
    dibayar: number;
    kurang: number;
    pribadi: number;
    bisnis: number;
    tabungan: CardSavingsReport;
    piutang: CardPiutangReport;
  }>;
  total: {
    tagihan: number;
    dibayar: number;
    kurang: number;
    pribadi: number;
    bisnis: number;
    tabungan: CardSavingsReport;
    piutang: CardPiutangReport;
  };
}

function parseMonthKey(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getFullYear() * 12 + d.getMonth();
}

function getCardBucketId(cardId: string | undefined, knownCardIds: Set<string>): string {
  if (!cardId || !knownCardIds.has(cardId)) {
    return UNLINKED_CARD_ID;
  }
  return cardId;
}

export function buildMonthReport(data: AppState, year: number, month: number): MonthReport {
  const targetMonthKey = year * 12 + month;
  const knownCards = data.cards || [];
  const knownCardIds = new Set(knownCards.map((c) => c.id));

  // Determine if unlinked bucket is needed
  const hasUnlinkedSavings = (data.savings || []).some(
    (s) => !s.cardId || !knownCardIds.has(s.cardId)
  );
  const hasUnlinkedPiutangs = (data.piutangs || []).some(
    (p) => !p.cardId || !knownCardIds.has(p.cardId)
  );
  const includeUnlinked = hasUnlinkedSavings || hasUnlinkedPiutangs;

  // Build list of card buckets
  const cardBuckets: Array<{
    cardId: string;
    cardName: string;
    cardColor: string;
    dueDay?: number;
    isUnlinked: boolean;
    cardObj?: CreditCard;
  }> = knownCards.map((c) => ({
    cardId: c.id,
    cardName: c.name,
    cardColor: c.color || 'bg-blue-500',
    dueDay: c.dueDay,
    isUnlinked: false,
    cardObj: c
  }));

  if (includeUnlinked) {
    cardBuckets.push({
      cardId: UNLINKED_CARD_ID,
      cardName: UNLINKED_CARD_NAME,
      cardColor: UNLINKED_CARD_COLOR,
      isUnlinked: true
    });
  }

  const cardReports: CardMonthReport[] = cardBuckets.map((bucket) => {
    const isUnlinked = bucket.isUnlinked;
    const cardId = bucket.cardId;

    // 1. Tagihan & Breakdown Pribadi / Bisnis
    let tagihan = 0;
    let pribadi = 0;
    let bisnis = 0;
    const expenseTxIds: string[] = [];
    const installmentIds: string[] = [];
    const personalTxIds: string[] = [];
    const personalInstallmentIds: string[] = [];
    const businessTxIds: string[] = [];
    const businessInstallmentIds: string[] = [];

    if (!isUnlinked) {
      const card = bucket.cardObj;
      let personalBase = 0;
      let businessBase = 0;

      (data.transactions || []).forEach((t) => {
        if (t.cardId !== cardId || t.type !== TransactionType.EXPENSE || t.isInstallment) return;
        const billing = getBillingPeriod(t.date, card?.dueDay);
        if (billing.month === month && billing.year === year) {
          expenseTxIds.push(t.id);
          const split = getOwnerSplit(t, t.amount);
          // If unclassified, default to personal
          const pAmount = split.personal + split.unclassified;
          const bAmount = split.business;
          personalBase += pAmount;
          businessBase += bAmount;
          if (pAmount > 0) personalTxIds.push(t.id);
          if (bAmount > 0) businessTxIds.push(t.id);
        }
      });

      (data.installments || []).forEach((inst) => {
        if (inst.cardId !== cardId) return;
        const start = getBillingPeriod(inst.startDate, card?.dueDay);
        const monthDiff = (year - start.year) * 12 + (month - start.month);
        if (monthDiff >= 0 && monthDiff < inst.totalMonths) {
          installmentIds.push(inst.id);
          const split = getOwnerSplit(inst, inst.monthlyAmount);
          const pAmount = split.personal + split.unclassified;
          const bAmount = split.business;
          personalBase += pAmount;
          businessBase += bAmount;
          if (pAmount > 0) personalInstallmentIds.push(inst.id);
          if (bAmount > 0) businessInstallmentIds.push(inst.id);
        }
      });

      const totalBase = personalBase + businessBase;
      let fees = 0;
      if (totalBase > 0 && card) {
        if (card.eStatementFee) fees += card.eStatementFee;
        if (totalBase + fees >= 5000000) fees += 10000;
      }

      tagihan = totalBase + fees;
      if (totalBase === 0) {
        pribadi = 0;
        bisnis = 0;
      } else {
        const personalFees = Math.round(fees * (personalBase / totalBase));
        pribadi = personalBase + personalFees;
        bisnis = tagihan - pribadi; // Invariant 2: pribadi + bisnis === tagihan
      }
    }

    // 2. Pembayaran (by targetPeriod)
    const paymentTxIds: string[] = [];
    let dibayar = 0;
    if (!isUnlinked) {
      (data.transactions || []).forEach((t) => {
        if (
          t.cardId === cardId &&
          t.type === TransactionType.PAYMENT &&
          t.targetPeriod?.month === month &&
          t.targetPeriod?.year === year
        ) {
          paymentTxIds.push(t.id);
          dibayar += t.amount;
        }
      });
    }

    const kurang = Math.max(0, tagihan - dibayar);

    // 3. Tabungan
    let untukTagihan = 0;
    const untukTagihanSavingIds: string[] = [];
    let tabunganBelumTerpakai = 0;

    let saldoAwal = 0;
    let setoran = 0;
    const setoranSavingIds: string[] = [];
    let dipakai = 0;
    const dipakaiSavingIds: string[] = [];
    let dipakaiEstimated = false;

    (data.savings || []).forEach((s) => {
      const bucketId = getCardBucketId(s.cardId, knownCardIds);
      if (bucketId !== cardId) return;

      // untukTagihan: targetPeriod matches this month
      if (s.targetPeriod?.month === month && s.targetPeriod?.year === year) {
        untukTagihan += s.amount;
        untukTagihanSavingIds.push(s.id);
        if (!s.isTransferred) {
          tabunganBelumTerpakai += s.amount;
        }
      }

      // Ledger: deposit (by date)
      const depositKey = parseMonthKey(s.date);
      if (depositKey < targetMonthKey) {
        saldoAwal += s.amount;
      } else if (depositKey === targetMonthKey) {
        setoran += s.amount;
        setoranSavingIds.push(s.id);
      }

      // Ledger: dipakai (when transferred)
      if (s.isTransferred) {
        const usedAmount = s.usedAmount ?? s.amount;
        let transferKey: number;
        let isEst = false;

        if (s.transferredAt) {
          transferKey = parseMonthKey(s.transferredAt);
        } else if (s.targetPeriod) {
          transferKey = s.targetPeriod.year * 12 + s.targetPeriod.month;
          isEst = true;
        } else {
          transferKey = depositKey;
          isEst = true;
        }

        if (transferKey < targetMonthKey) {
          saldoAwal -= usedAmount;
        } else if (transferKey === targetMonthKey) {
          dipakai += usedAmount;
          dipakaiSavingIds.push(s.id);
          if (isEst) dipakaiEstimated = true;
        }
      }
    });

    const saldoAkhir = saldoAwal + setoran - dipakai;

    // 4. Piutang
    let piutangUntukTagihan = 0;
    const untukTagihanPiutangIds: string[] = [];
    let piutangBelumKembali = 0;

    let sisaAwal = 0;
    let piutangBaru = 0;
    const piutangBaruIds: string[] = [];
    let dikembalikan = 0;
    const dikembalikanPiutangIds: string[] = [];
    let dikembalikanEstimated = false;

    (data.piutangs || []).forEach((p) => {
      const bucketId = getCardBucketId(p.cardId, knownCardIds);
      if (bucketId !== cardId) return;

      if (p.targetPeriod?.month === month && p.targetPeriod?.year === year) {
        piutangUntukTagihan += p.amount;
        untukTagihanPiutangIds.push(p.id);
        if (!p.isCollected) {
          piutangBelumKembali += p.amount;
        }
      }

      const pKey = parseMonthKey(p.date);
      if (pKey < targetMonthKey) {
        sisaAwal += p.amount;
      } else if (pKey === targetMonthKey) {
        piutangBaru += p.amount;
        piutangBaruIds.push(p.id);
      }

      if (p.isCollected) {
        let collectKey: number;
        let isEst = false;

        if (p.collectedAt) {
          collectKey = parseMonthKey(p.collectedAt);
        } else if (p.targetPeriod) {
          collectKey = p.targetPeriod.year * 12 + p.targetPeriod.month;
          isEst = true;
        } else {
          collectKey = pKey;
          isEst = true;
        }

        if (collectKey < targetMonthKey) {
          sisaAwal -= p.amount;
        } else if (collectKey === targetMonthKey) {
          dikembalikan += p.amount;
          dikembalikanPiutangIds.push(p.id);
          if (isEst) dikembalikanEstimated = true;
        }
      }
    });

    const sisaBerjalan = sisaAwal + piutangBaru - dikembalikan;
    const kurangBersih = Math.max(0, tagihan - dibayar - tabunganBelumTerpakai - piutangBelumKembali);

    return {
      cardId,
      cardName: bucket.cardName,
      cardColor: bucket.cardColor,
      dueDay: bucket.dueDay,
      isUnlinked: bucket.isUnlinked,
      cardObj: bucket.cardObj,
      tagihan,
      expenseTxIds,
      installmentIds,
      dibayar,
      paymentTxIds,
      kurang,
      kurangBersih,
      pribadi,
      personalTxIds,
      personalInstallmentIds,
      bisnis,
      businessTxIds,
      businessInstallmentIds,
      tabungan: {
        untukTagihan,
        untukTagihanSavingIds,
        tabunganBelumTerpakai,
        saldoAwal,
        setoran,
        setoranSavingIds,
        dipakai,
        dipakaiSavingIds,
        dipakaiEstimated,
        saldoAkhir
      },
      piutang: {
        untukTagihan: piutangUntukTagihan,
        untukTagihanPiutangIds,
        piutangBelumKembali,
        sisaAwal,
        piutangBaru,
        piutangBaruIds,
        dikembalikan,
        dikembalikanPiutangIds,
        dikembalikanEstimated,
        sisaBerjalan
      }
    };
  });

  // Calculate Month Totals (sum of all card reports ensures Invariant 1 holds!)
  const totalTagihan = cardReports.reduce((sum, c) => sum + c.tagihan, 0);
  const totalDibayar = cardReports.reduce((sum, c) => sum + c.dibayar, 0);
  const totalKurang = cardReports.reduce((sum, c) => sum + c.kurang, 0);
  const totalPribadi = cardReports.reduce((sum, c) => sum + c.pribadi, 0);
  const totalBisnis = cardReports.reduce((sum, c) => sum + c.bisnis, 0);

  const totalTabunganBelumTerpakai = cardReports.reduce(
    (sum, c) => sum + c.tabungan.tabunganBelumTerpakai,
    0
  );
  const totalPiutangBelumKembali = cardReports.reduce(
    (sum, c) => sum + c.piutang.piutangBelumKembali,
    0
  );

  const totalKurangBersih = Math.max(
    0,
    totalTagihan - totalDibayar - totalTabunganBelumTerpakai - totalPiutangBelumKembali
  );

  const totalExpenseTxIds = Array.from(new Set(cardReports.flatMap((c) => c.expenseTxIds)));
  const totalInstallmentIds = Array.from(new Set(cardReports.flatMap((c) => c.installmentIds)));
  const totalPaymentTxIds = Array.from(new Set(cardReports.flatMap((c) => c.paymentTxIds)));
  const totalPersonalTxIds = Array.from(new Set(cardReports.flatMap((c) => c.personalTxIds)));
  const totalPersonalInstallmentIds = Array.from(
    new Set(cardReports.flatMap((c) => c.personalInstallmentIds))
  );
  const totalBusinessTxIds = Array.from(new Set(cardReports.flatMap((c) => c.businessTxIds)));
  const totalBusinessInstallmentIds = Array.from(
    new Set(cardReports.flatMap((c) => c.businessInstallmentIds))
  );

  const totalTabunganUntukTagihan = cardReports.reduce(
    (sum, c) => sum + c.tabungan.untukTagihan,
    0
  );
  const totalTabunganUntukTagihanSavingIds = Array.from(
    new Set(cardReports.flatMap((c) => c.tabungan.untukTagihanSavingIds))
  );
  const totalTabunganSaldoAwal = cardReports.reduce((sum, c) => sum + c.tabungan.saldoAwal, 0);
  const totalTabunganSetoran = cardReports.reduce((sum, c) => sum + c.tabungan.setoran, 0);
  const totalTabunganSetoranSavingIds = Array.from(
    new Set(cardReports.flatMap((c) => c.tabungan.setoranSavingIds))
  );
  const totalTabunganDipakai = cardReports.reduce((sum, c) => sum + c.tabungan.dipakai, 0);
  const totalTabunganDipakaiSavingIds = Array.from(
    new Set(cardReports.flatMap((c) => c.tabungan.dipakaiSavingIds))
  );
  const totalTabunganDipakaiEstimated = cardReports.some((c) => c.tabungan.dipakaiEstimated);
  const totalTabunganSaldoAkhir = totalTabunganSaldoAwal + totalTabunganSetoran - totalTabunganDipakai;

  const totalPiutangUntukTagihan = cardReports.reduce((sum, c) => sum + c.piutang.untukTagihan, 0);
  const totalPiutangUntukTagihanPiutangIds = Array.from(
    new Set(cardReports.flatMap((c) => c.piutang.untukTagihanPiutangIds))
  );
  const totalPiutangSisaAwal = cardReports.reduce((sum, c) => sum + c.piutang.sisaAwal, 0);
  const totalPiutangBaru = cardReports.reduce((sum, c) => sum + c.piutang.piutangBaru, 0);
  const totalPiutangBaruIds = Array.from(new Set(cardReports.flatMap((c) => c.piutang.piutangBaruIds)));
  const totalPiutangDikembalikan = cardReports.reduce((sum, c) => sum + c.piutang.dikembalikan, 0);
  const totalPiutangDikembalikanPiutangIds = Array.from(
    new Set(cardReports.flatMap((c) => c.piutang.dikembalikanPiutangIds))
  );
  const totalPiutangDikembalikanEstimated = cardReports.some((c) => c.piutang.dikembalikanEstimated);
  const totalPiutangSisaBerjalan = totalPiutangSisaAwal + totalPiutangBaru - totalPiutangDikembalikan;

  return {
    year,
    month,
    cards: cardReports,
    total: {
      tagihan: totalTagihan,
      expenseTxIds: totalExpenseTxIds,
      installmentIds: totalInstallmentIds,
      dibayar: totalDibayar,
      paymentTxIds: totalPaymentTxIds,
      kurang: totalKurang,
      kurangBersih: totalKurangBersih,
      pribadi: totalPribadi,
      personalTxIds: totalPersonalTxIds,
      personalInstallmentIds: totalPersonalInstallmentIds,
      bisnis: totalBisnis,
      businessTxIds: totalBusinessTxIds,
      businessInstallmentIds: totalBusinessInstallmentIds,
      tabungan: {
        untukTagihan: totalTabunganUntukTagihan,
        untukTagihanSavingIds: totalTabunganUntukTagihanSavingIds,
        tabunganBelumTerpakai: totalTabunganBelumTerpakai,
        saldoAwal: totalTabunganSaldoAwal,
        setoran: totalTabunganSetoran,
        setoranSavingIds: totalTabunganSetoranSavingIds,
        dipakai: totalTabunganDipakai,
        dipakaiSavingIds: totalTabunganDipakaiSavingIds,
        dipakaiEstimated: totalTabunganDipakaiEstimated,
        saldoAkhir: totalTabunganSaldoAkhir
      },
      piutang: {
        untukTagihan: totalPiutangUntukTagihan,
        untukTagihanPiutangIds: totalPiutangUntukTagihanPiutangIds,
        piutangBelumKembali: totalPiutangBelumKembali,
        sisaAwal: totalPiutangSisaAwal,
        piutangBaru: totalPiutangBaru,
        piutangBaruIds: totalPiutangBaruIds,
        dikembalikan: totalPiutangDikembalikan,
        dikembalikanPiutangIds: totalPiutangDikembalikanPiutangIds,
        dikembalikanEstimated: totalPiutangDikembalikanEstimated,
        sisaBerjalan: totalPiutangSisaBerjalan
      }
    }
  };
}

export function buildYearReport(data: AppState, year: number): YearReport {
  const months: MonthReport[] = [];
  for (let m = 0; m < 12; m++) {
    months.push(buildMonthReport(data, year, m));
  }

  // Aggregate year flow numbers and balances across the 12 months
  const allCardIds = Array.from(new Set(months.flatMap((m) => m.cards.map((c) => c.cardId))));

  const yearCards = allCardIds.map((cId) => {
    const cardMonths = months.map((m) => m.cards.find((c) => c.cardId === cId));
    const firstDefined = cardMonths.find((c) => !!c);
    const cardName = firstDefined?.cardName || UNLINKED_CARD_NAME;
    const cardColor = firstDefined?.cardColor || UNLINKED_CARD_COLOR;
    const isUnlinked = firstDefined?.isUnlinked || false;

    // Flow sums over 12 months
    const tagihan = cardMonths.reduce((sum, c) => sum + (c?.tagihan || 0), 0);
    const dibayar = cardMonths.reduce((sum, c) => sum + (c?.dibayar || 0), 0);
    const kurang = cardMonths.reduce((sum, c) => sum + (c?.kurang || 0), 0);
    const pribadi = cardMonths.reduce((sum, c) => sum + (c?.pribadi || 0), 0);
    const bisnis = cardMonths.reduce((sum, c) => sum + (c?.bisnis || 0), 0);

    const untukTagihan = cardMonths.reduce((sum, c) => sum + (c?.tabungan.untukTagihan || 0), 0);
    const setoran = cardMonths.reduce((sum, c) => sum + (c?.tabungan.setoran || 0), 0);
    const dipakai = cardMonths.reduce((sum, c) => sum + (c?.tabungan.dipakai || 0), 0);

    // Ledger balances: Saldo awal is Jan saldo awal, saldo akhir is Dec saldo akhir
    const saldoAwal = cardMonths[0]?.tabungan.saldoAwal || 0;
    const saldoAkhir = cardMonths[11]?.tabungan.saldoAkhir || 0;
    const dipakaiEstimated = cardMonths.some((c) => c?.tabungan.dipakaiEstimated || false);

    const piutangUntukTagihan = cardMonths.reduce(
      (sum, c) => sum + (c?.piutang.untukTagihan || 0),
      0
    );
    const piutangBaru = cardMonths.reduce((sum, c) => sum + (c?.piutang.piutangBaru || 0), 0);
    const dikembalikan = cardMonths.reduce((sum, c) => sum + (c?.piutang.dikembalikan || 0), 0);

    const sisaAwal = cardMonths[0]?.piutang.sisaAwal || 0;
    const sisaBerjalan = cardMonths[11]?.piutang.sisaBerjalan || 0;
    const dikembalikanEstimated = cardMonths.some((c) => c?.piutang.dikembalikanEstimated || false);

    return {
      cardId: cId,
      cardName,
      cardColor,
      isUnlinked,
      tagihan,
      dibayar,
      kurang,
      pribadi,
      bisnis,
      tabungan: {
        untukTagihan,
        untukTagihanSavingIds: Array.from(
          new Set(cardMonths.flatMap((c) => c?.tabungan.untukTagihanSavingIds || []))
        ),
        tabunganBelumTerpakai: 0,
        saldoAwal,
        setoran,
        setoranSavingIds: Array.from(
          new Set(cardMonths.flatMap((c) => c?.tabungan.setoranSavingIds || []))
        ),
        dipakai,
        dipakaiSavingIds: Array.from(
          new Set(cardMonths.flatMap((c) => c?.tabungan.dipakaiSavingIds || []))
        ),
        dipakaiEstimated,
        saldoAkhir
      },
      piutang: {
        untukTagihan: piutangUntukTagihan,
        untukTagihanPiutangIds: Array.from(
          new Set(cardMonths.flatMap((c) => c?.piutang.untukTagihanPiutangIds || []))
        ),
        piutangBelumKembali: 0,
        sisaAwal,
        piutangBaru,
        piutangBaruIds: Array.from(
          new Set(cardMonths.flatMap((c) => c?.piutang.piutangBaruIds || []))
        ),
        dikembalikan,
        dikembalikanPiutangIds: Array.from(
          new Set(cardMonths.flatMap((c) => c?.piutang.dikembalikanPiutangIds || []))
        ),
        dikembalikanEstimated,
        sisaBerjalan
      }
    };
  });

  const totalTagihan = months.reduce((sum, m) => sum + m.total.tagihan, 0);
  const totalDibayar = months.reduce((sum, m) => sum + m.total.dibayar, 0);
  const totalKurang = months.reduce((sum, m) => sum + m.total.kurang, 0);
  const totalPribadi = months.reduce((sum, m) => sum + m.total.pribadi, 0);
  const totalBisnis = months.reduce((sum, m) => sum + m.total.bisnis, 0);

  const totalTabunganUntukTagihan = months.reduce(
    (sum, m) => sum + m.total.tabungan.untukTagihan,
    0
  );
  const totalTabunganSetoran = months.reduce((sum, m) => sum + m.total.tabungan.setoran, 0);
  const totalTabunganDipakai = months.reduce((sum, m) => sum + m.total.tabungan.dipakai, 0);
  const totalTabunganSaldoAwal = months[0].total.tabungan.saldoAwal;
  const totalTabunganSaldoAkhir = months[11].total.tabungan.saldoAkhir;
  const totalTabunganDipakaiEstimated = months.some((m) => m.total.tabungan.dipakaiEstimated);

  const totalPiutangUntukTagihan = months.reduce(
    (sum, m) => sum + m.total.piutang.untukTagihan,
    0
  );
  const totalPiutangBaru = months.reduce((sum, m) => sum + m.total.piutang.piutangBaru, 0);
  const totalPiutangDikembalikan = months.reduce((sum, m) => sum + m.total.piutang.dikembalikan, 0);
  const totalPiutangSisaAwal = months[0].total.piutang.sisaAwal;
  const totalPiutangSisaBerjalan = months[11].total.piutang.sisaBerjalan;
  const totalPiutangDikembalikanEstimated = months.some((m) => m.total.piutang.dikembalikanEstimated);

  return {
    year,
    months,
    cards: yearCards,
    total: {
      tagihan: totalTagihan,
      dibayar: totalDibayar,
      kurang: totalKurang,
      pribadi: totalPribadi,
      bisnis: totalBisnis,
      tabungan: {
        untukTagihan: totalTabunganUntukTagihan,
        untukTagihanSavingIds: Array.from(
          new Set(months.flatMap((m) => m.total.tabungan.untukTagihanSavingIds))
        ),
        tabunganBelumTerpakai: 0,
        saldoAwal: totalTabunganSaldoAwal,
        setoran: totalTabunganSetoran,
        setoranSavingIds: Array.from(
          new Set(months.flatMap((m) => m.total.tabungan.setoranSavingIds))
        ),
        dipakai: totalTabunganDipakai,
        dipakaiSavingIds: Array.from(
          new Set(months.flatMap((m) => m.total.tabungan.dipakaiSavingIds))
        ),
        dipakaiEstimated: totalTabunganDipakaiEstimated,
        saldoAkhir: totalTabunganSaldoAkhir
      },
      piutang: {
        untukTagihan: totalPiutangUntukTagihan,
        untukTagihanPiutangIds: Array.from(
          new Set(months.flatMap((m) => m.total.piutang.untukTagihanPiutangIds))
        ),
        piutangBelumKembali: 0,
        sisaAwal: totalPiutangSisaAwal,
        piutangBaru: totalPiutangBaru,
        piutangBaruIds: Array.from(new Set(months.flatMap((m) => m.total.piutang.piutangBaruIds))),
        dikembalikan: totalPiutangDikembalikan,
        dikembalikanPiutangIds: Array.from(
          new Set(months.flatMap((m) => m.total.piutang.dikembalikanPiutangIds))
        ),
        dikembalikanEstimated: totalPiutangDikembalikanEstimated,
        sisaBerjalan: totalPiutangSisaBerjalan
      }
    }
  };
}

export function getCurrentSavingsBalance(data: AppState, cardId?: string): number {
  const savings = data.savings || [];
  if (cardId) {
    return savings
      .filter((s) => s.cardId === cardId && !s.isTransferred)
      .reduce((sum, s) => sum + s.amount, 0);
  }
  return savings
    .filter((s) => !s.isTransferred)
    .reduce((sum, s) => sum + s.amount, 0);
}

export type YearlyStatusType = 'LUNAS' | 'TERTUTUP' | 'KURANG' | 'KOSONG' | 'MENDATANG';
export type MonthStatusType = YearlyStatusType;

export interface YearlyStatusResult {
  type: YearlyStatusType;
  label: string;
  subLabel?: string;
  kurangBersih: number;
}
export type MonthStatusResult = YearlyStatusResult;

export function computeYearlyStatus(
  tagihan: number,
  dibayar: number,
  kurang: number,
  kurangBersih: number,
  year: number,
  month: number,
  currentDate: Date = new Date()
): YearlyStatusResult {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const isFuture = year > currentYear || (year === currentYear && month > currentMonth);

  if (isFuture) {
    let subLabel: string | undefined = undefined;
    if (tagihan > 0 && kurangBersih > 0) {
      subLabel = `perlu Rp ${new Intl.NumberFormat('id-ID').format(kurangBersih)}`;
    } else if (tagihan > 0 && kurangBersih === 0) {
      subLabel = 'tertutup';
    }
    return {
      type: 'MENDATANG',
      label: 'Mendatang',
      subLabel,
      kurangBersih
    };
  }

  if (tagihan === 0 && dibayar === 0) {
    return {
      type: 'KOSONG',
      label: 'Belum ada tagihan',
      kurangBersih: 0
    };
  }

  if (tagihan > 0 && kurang === 0) {
    return {
      type: 'LUNAS',
      label: 'Lunas',
      kurangBersih: 0
    };
  }

  if (kurang > 0 && kurangBersih === 0) {
    return {
      type: 'TERTUTUP',
      label: 'Tertutup tabungan/piutang',
      kurangBersih: 0
    };
  }

  return {
    type: 'KURANG',
    label: `Kurang Rp ${new Intl.NumberFormat('id-ID').format(kurangBersih)}`,
    kurangBersih
  };
}

export function getMonthStatus(
  monthReport: MonthReport,
  currentDate: Date = new Date()
): YearlyStatusResult {
  const { tagihan, dibayar, kurang, kurangBersih } = monthReport.total;
  return computeYearlyStatus(
    tagihan,
    dibayar,
    kurang,
    kurangBersih,
    monthReport.year,
    monthReport.month,
    currentDate
  );
}

export function getCardStatus(
  cardMonthReport: CardMonthReport,
  year: number,
  month: number,
  currentDate: Date = new Date()
): YearlyStatusResult {
  const { tagihan, dibayar, kurang, kurangBersih } = cardMonthReport;
  return computeYearlyStatus(
    tagihan,
    dibayar,
    kurang,
    kurangBersih,
    year,
    month,
    currentDate
  );
}

