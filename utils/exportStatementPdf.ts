import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CreditCard as CreditCardType,
  DebtType,
  OwnerType,
  Piutang,
  Saving,
  Transaction,
  Installment
} from '../types';

export interface StatementInstallmentItem extends Installment {
  currentTenor: number;
  isValidated: boolean;
}

export interface StatementExportData {
  transactions: Transaction[];
  installments: StatementInstallmentItem[];
  payments: Transaction[];
  savings: Saving[];
  piutangs: Piutang[];
  totalBill: number;
  totalPaid: number;
  totalSavingsAmount: number;
  totalPiutangsAmount: number;
  totalSaved: number;
  totalKurang: number;
  totalUnpaid: number;
  totalValidated: number;
  adminFee: number;
  materai: number;
}

export interface ExportStatementPdfParams {
  card: CreditCardType;
  monthIndex: number;
  monthName: string;
  year: number;
  statement: StatementExportData;
  holderName?: string;
}

const formatIDR = (num: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.ceil(num || 0));

const formatDateShort = (isoOrDate: string): string => {
  if (!isoOrDate) return '-';
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatOwnerLabel = (owner?: OwnerType): string => {
  if (owner === OwnerType.BUSINESS) return 'Bisnis';
  if (owner === OwnerType.SPLIT) return 'Split';
  if (owner === OwnerType.PERSONAL) return 'Pribadi';
  return '-';
};

export const exportStatementToPdf = ({
  card,
  monthName,
  year,
  statement,
  holderName
}: ExportStatementPdfParams): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // 1. HEADER BANNER
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Top accent strip
  doc.setFillColor(37, 99, 235); // primary blue
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Brand & Document Title (Left)
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('LIMITWATCH • DOKUMEN RINGKASAN TAGIHAN', marginX, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('E-STATEMENT BULANAN', marginX, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225); // slate-300
  const cardTypeLabel = card.type === DebtType.CREDIT_CARD ? 'Kartu Kredit' : 'Pinjaman / PayLater';
  doc.text(`${card.name} (${cardTypeLabel})`, marginX, 26);

  if (holderName) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Pemegang Akun: ${holderName}`, marginX, 32);
  }

  // Period & Status Badge (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`${monthName} ${year}`, pageWidth - marginX, 14, { align: 'right' });

  if (card.dueDay) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Jatuh Tempo: Tanggal ${card.dueDay}`, pageWidth - marginX, 20.5, { align: 'right' });
  }

  const isLunasOrCukup = statement.totalKurang === 0;
  const statusText = isLunasOrCukup ? 'LUNAS / DANA CUKUP' : 'ADA KURANG DANA';
  const badgeWidth = 42;
  const badgeHeight = 6.5;
  const badgeX = pageWidth - marginX - badgeWidth;
  const badgeY = 25;
  if (isLunasOrCukup) {
    doc.setFillColor(16, 185, 129); // emerald-500
  } else {
    doc.setFillColor(225, 29, 72); // rose-600
  }
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(statusText, badgeX + badgeWidth / 2, badgeY + 4.4, { align: 'center' });

  let cursorY = 45;

  // 2. RINGKASAN KEUANGAN (5 METRIK UTAMA)
  const boxGap = 3;
  const boxWidth = (contentWidth - boxGap * 4) / 5;
  const boxHeight = 19;

  const summaryCards = [
    {
      label: 'TOTAL TAGIHAN',
      value: formatIDR(statement.totalBill),
      bg: [248, 250, 252] as [number, number, number],
      border: [226, 232, 240] as [number, number, number],
      text: [15, 23, 42] as [number, number, number]
    },
    {
      label: 'TABUNGAN',
      value: formatIDR(statement.totalSavingsAmount),
      bg: [250, 245, 255] as [number, number, number],
      border: [233, 213, 255] as [number, number, number],
      text: [126, 34, 206] as [number, number, number]
    },
    {
      label: 'PIUTANG',
      value: formatIDR(statement.totalPiutangsAmount),
      bg: [236, 254, 255] as [number, number, number],
      border: [165, 243, 252] as [number, number, number],
      text: [14, 116, 144] as [number, number, number]
    },
    {
      label: 'SUDAH DIBAYAR',
      value: formatIDR(statement.totalPaid),
      bg: [236, 253, 245] as [number, number, number],
      border: [167, 243, 208] as [number, number, number],
      text: [4, 120, 87] as [number, number, number]
    },
    {
      label: 'KURANG DANA',
      value: formatIDR(statement.totalKurang),
      bg: statement.totalKurang > 0 ? ([255, 241, 242] as [number, number, number]) : ([236, 253, 245] as [number, number, number]),
      border: statement.totalKurang > 0 ? ([254, 205, 211] as [number, number, number]) : ([167, 243, 208] as [number, number, number]),
      text: statement.totalKurang > 0 ? ([190, 18, 60] as [number, number, number]) : ([4, 120, 87] as [number, number, number])
    }
  ];

  summaryCards.forEach((sc, idx) => {
    const x = marginX + idx * (boxWidth + boxGap);
    doc.setFillColor(...sc.bg);
    doc.setDrawColor(...sc.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cursorY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(sc.label, x + 2.5, cursorY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...sc.text);
    doc.text(sc.value, x + 2.5, cursorY + 13.5, { maxWidth: boxWidth - 5 });
  });

  cursorY += boxHeight + 5;

  // 3. STRIP RINCIAN BIAYA & REKONSILIASI
  const totalTxBase = Math.ceil(statement.transactions.reduce((sum, t) => sum + t.amount, 0));
  const totalInstBase = Math.ceil(statement.installments.reduce((sum, i) => sum + i.monthlyAmount, 0));
  const reconcilePct =
    statement.totalBill > 0 ? Math.min(100, Math.round((statement.totalValidated / statement.totalBill) * 100)) : 0;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Pemakaian Reguler: ${formatIDR(totalTxBase)}   |   Cicilan: ${formatIDR(totalInstBase)}   |   Biaya e-Statement: ${formatIDR(statement.adminFee)}   |   Materai: ${formatIDR(statement.materai)}`,
    marginX + 3,
    cursorY + 5
  );
  doc.text(
    `Rekonsiliasi Ceklist: ${reconcilePct}% (${formatIDR(statement.totalValidated)} dari ${formatIDR(statement.totalBill)})   |   Sisa Belum Bayar: ${formatIDR(statement.totalUnpaid)}`,
    marginX + 3,
    cursorY + 9.5
  );

  cursorY += 18;

  const ensureSectionSpace = (minSpaceMm: number) => {
    if (cursorY + minSpaceMm > pageHeight - 20) {
      doc.addPage();
      cursorY = 16;
    }
  };

  const drawSectionTitle = (title: string, subtitle?: string) => {
    ensureSectionSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(title, marginX, cursorY);
    if (subtitle) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235);
      doc.text(subtitle, pageWidth - marginX, cursorY, { align: 'right' });
    }
    cursorY += 3;
  };

  // 4. TABEL TAGIHAN CICILAN BERJALAN
  drawSectionTitle(
    `TAGIHAN CICILAN BERJALAN (${statement.installments.length})`,
    statement.installments.length > 0 ? `Subtotal: ${formatIDR(totalInstBase)}` : undefined
  );

  if (statement.installments.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['No', 'Nama Cicilan', 'Tenor', 'Kategori', 'Ceklist', 'Angsuran']],
      body: statement.installments.map((inst, idx) => [
        String(idx + 1),
        inst.name.toUpperCase(),
        `Tenor ${inst.currentTenor}/${inst.totalMonths}`,
        formatOwnerLabel(inst.owner),
        inst.isValidated ? 'Cocok' : 'Belum',
        formatIDR(inst.monthlyAmount)
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        2: { halign: 'center', cellWidth: 22 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 32 }
      }
    });
    cursorY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY) + 8;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Tidak ada cicilan aktif pada periode ini.', marginX, cursorY + 3);
    cursorY += 10;
  }

  // 5. TABEL LOG TRANSAKSI PERIODE INI
  drawSectionTitle(
    `LOG TRANSAKSI PERIODE INI (${statement.transactions.length})`,
    statement.transactions.length > 0 ? `Subtotal: ${formatIDR(totalTxBase)}` : undefined
  );

  if (statement.transactions.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['No', 'Tanggal', 'Keterangan', 'Kategori', 'Kepemilikan', 'Ceklist', 'Nominal']],
      body: statement.transactions.map((t, idx) => [
        String(idx + 1),
        formatDateShort(t.date),
        (t.description || '-').toUpperCase(),
        t.category || '-',
        formatOwnerLabel(t.owner),
        t.isValidated ? 'Cocok' : 'Belum',
        formatIDR(t.amount)
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 23 },
        3: { cellWidth: 24 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 30 }
      }
    });
    cursorY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY) + 8;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada transaksi pemakaian pada periode ini.', marginX, cursorY + 3);
    cursorY += 10;
  }

  // 6. RIWAYAT PEMBAYARAN (Jika ada)
  if (statement.payments.length > 0) {
    drawSectionTitle(
      `RIWAYAT PEMBAYARAN (${statement.payments.length})`,
      `Total Dibayar: ${formatIDR(statement.totalPaid)}`
    );
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['No', 'Tanggal', 'Keterangan Pembayaran', 'Nominal']],
      body: statement.payments.map((p, idx) => [
        String(idx + 1),
        formatDateShort(p.date),
        p.description || 'Pembayaran Tagihan',
        formatIDR(p.amount)
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [4, 120, 87], // emerald-700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 25 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 34 }
      }
    });
    cursorY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY) + 8;
  }

  // 7. ALOKASI TABUNGAN & PIUTANG (Jika ada)
  if (statement.savings.length > 0 || statement.piutangs.length > 0) {
    const combinedAllocations = [
      ...statement.savings.map(sv => ({
        jenis: 'Tabungan',
        tanggal: formatDateShort(sv.date),
        keterangan: sv.note || 'Tabungan Pelunasan',
        pemilik: formatOwnerLabel(sv.owner),
        nominal: sv.amount
      })),
      ...statement.piutangs.map(pt => ({
        jenis: 'Piutang',
        tanggal: formatDateShort(pt.date),
        keterangan: `${pt.debtorName}${pt.note ? ` - ${pt.note}` : ''}`,
        pemilik: '-',
        nominal: pt.amount
      }))
    ];

    drawSectionTitle(
      `ALOKASI DANA PELUNASAN (${combinedAllocations.length})`,
      `Total: ${formatIDR(statement.totalSaved)}`
    );

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['No', 'Jenis', 'Tanggal', 'Keterangan / Pihak', 'Kepemilikan', 'Nominal']],
      body: combinedAllocations.map((item, idx) => [
        String(idx + 1),
        item.jenis,
        item.tanggal,
        item.keterangan,
        item.pemilik,
        formatIDR(item.nominal)
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [79, 70, 229], // indigo-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      alternateRowStyles: {
        fillColor: [238, 242, 255]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 20 },
        2: { cellWidth: 23 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 32 }
      }
    });
  }

  // 8. FOOTER DI SETIAP HALAMAN
  const totalPages = doc.getNumberOfPages();
  const printedAt = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`LimitWatch e-Statement • Dicetak ${printedAt}`, marginX, pageHeight - 8);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }

  const safeCardName = card.name.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  const fileName = `e-Statement_${safeCardName || 'Kartu'}_${monthName}_${year}.pdf`;
  doc.save(fileName);
};
