import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDateTime } from './formatters';

/**
 * Generate PDF for Sales Report
 */
export function generateSalesReportPdf({ store, summary, transactions, dateRangeLabel }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const storeName = store?.name || 'TOKO ATK BERKAH MANDIRI';
  const storeAddress = store?.address || 'Jl. Pendidikan No. 123, Jakarta';
  const storePhone = store?.phone || '0812-3456-7890';

  // 1. Header & Store Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(22, 101, 52); // Brand green
  doc.text(storeName.toUpperCase(), 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${storeAddress} | Telp: ${storePhone}`, 14, 23);

  // Line separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 26, 196, 26);

  // 2. Report Title & Period
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN PENJUALAN TOKO ATK', 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${dateRangeLabel || 'Semua Waktu'}`, 14, 39);
  doc.text(`Waktu Cetak: ${formatDateTime(new Date())}`, 140, 39);

  // 3. Summary KPI Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 43, 182, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 43, 182, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL TRANSAKSI', 20, 49);
  doc.text('TOTAL PENDAPATAN', 65, 49);
  doc.text('ESTIMASI LABA BERSIH', 120, 49);
  doc.text('TOTAL ITEM', 170, 49);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${summary.totalTransactions} Transaksi`, 20, 58);
  doc.setTextColor(22, 101, 52);
  doc.text(formatCurrency(summary.totalRevenue), 65, 58);
  doc.setTextColor(30, 64, 175);
  doc.text(formatCurrency(summary.grossProfit), 120, 58);
  doc.setTextColor(15, 23, 42);
  doc.text(`${summary.totalItemsSold} Pcs`, 170, 58);

  // 4. Transaction Table
  const tableRows = transactions.map((t, idx) => [
    idx + 1,
    t.invoiceNumber,
    formatDateTime(t.date),
    t.cashierName || 'Kasir',
    t.paymentMethod || 'CASH',
    t.items ? t.items.reduce((s, i) => s + i.quantity, 0) : 0,
    formatCurrency(t.totalAmount),
    formatCurrency(t.discountAmount),
    formatCurrency(t.finalAmount),
  ]);

  doc.autoTable({
    startY: 70,
    head: [['No', 'No. Invoice', 'Tanggal & Waktu', 'Kasir', 'Metode', 'Item', 'Subtotal', 'Diskon', 'Total Akhir']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 28 },
      3: { cellWidth: 20 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Footer note
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${pageCount}`, 14, 287);
    doc.text('Dicetak otomatis oleh Sistem Kasir Toko ATK', 130, 287);
  }

  doc.save(`Laporan_Penjualan_ATK_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Generate Single Transaction Receipt PDF
 */
export function generateReceiptPdf({ store, transaction }) {
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] }); // 80mm roll width

  const storeName = store?.name || 'TOKO ATK BERKAH MANDIRI';
  const storeAddress = store?.address || 'Jl. Pendidikan No. 123, Jakarta';
  const storePhone = store?.phone || '0812-3456-7890';
  const footer = store?.receiptFooter || 'Terima kasih atas kunjungan Anda!';

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(storeName, 40, 10, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text(storeAddress, 40, 15, { align: 'center' });
  doc.text(`Telp: ${storePhone}`, 40, 18, { align: 'center' });

  doc.text('----------------------------------------', 40, 22, { align: 'center' });
  doc.text(`No. Faktur : ${transaction.invoiceNumber}`, 6, 26);
  doc.text(`Tanggal    : ${formatDateTime(transaction.date)}`, 6, 30);
  doc.text(`Kasir      : ${transaction.cashierName || 'Kasir'}`, 6, 34);
  doc.text(`Pembayaran : ${transaction.paymentMethod}`, 6, 38);
  doc.text('----------------------------------------', 40, 42, { align: 'center' });

  let y = 46;
  if (transaction.items) {
    transaction.items.forEach((item) => {
      doc.setFont('courier', 'bold');
      doc.text(item.productName.substring(0, 28), 6, y);
      y += 4;
      doc.setFont('courier', 'normal');
      doc.text(`${item.quantity} x ${formatCurrency(item.price)}`, 6, y);
      doc.text(formatCurrency(item.subtotal), 74, y, { align: 'right' });
      y += 4;
    });
  }

  doc.text('----------------------------------------', 40, y, { align: 'center' });
  y += 4;

  doc.text('Subtotal', 6, y);
  doc.text(formatCurrency(transaction.totalAmount), 74, y, { align: 'right' });
  y += 4;

  if (Number(transaction.discountAmount) > 0) {
    doc.text('Diskon', 6, y);
    doc.text(`-${formatCurrency(transaction.discountAmount)}`, 74, y, { align: 'right' });
    y += 4;
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL AKHIR', 6, y);
  doc.text(formatCurrency(transaction.finalAmount), 74, y, { align: 'right' });
  y += 4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('Tunai / Bayar', 6, y);
  doc.text(formatCurrency(transaction.amountPaid), 74, y, { align: 'right' });
  y += 4;

  doc.text('Kembalian', 6, y);
  doc.text(formatCurrency(transaction.changeAmount), 74, y, { align: 'right' });
  y += 6;

  doc.text('----------------------------------------', 40, y, { align: 'center' });
  y += 4;

  const splitFooter = doc.splitTextToSize(footer, 70);
  doc.text(splitFooter, 40, y, { align: 'center' });

  doc.save(`Struk_${transaction.invoiceNumber}.pdf`);
}
