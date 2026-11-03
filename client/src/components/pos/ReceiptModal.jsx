import React from 'react';
import { Printer, Download, PlusCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { generateReceiptPdf } from '../../utils/pdfExport';
import { PaymentBadge } from '../common/Badge';

export default function ReceiptModal({ isOpen, onClose, transaction, store, onNewTransaction }) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateReceiptPdf({ store, transaction });
  };

  const storeName = store?.name || 'TOKO ATK BAROKAH';
  const storeAddress = store?.address || 'Jl. KH. Dewantoro No. 1 Rejoso - Nganjuk';
  const storePhone = store?.phone || '081259878173';
  const footerNote = store?.receiptFooter || 'Terima kasih atas kunjungan Anda!\nBarang yang dibeli tidak dapat ditukar/dikembalikan.';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Pembayaran Berhasil" subtitle="Transaksi berhasil dicatat ke sistem" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Success Banner */}
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Transaksi selesai! Struk siap dicetak atau diunduh sebagai PDF.</span>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div
          id="printable-receipt"
          className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-800 shadow-inner"
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">{storeName}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{storeAddress}</p>
            <p className="text-[10px] text-slate-500">Telp: {storePhone}</p>
          </div>

          {/* Invoice Info */}
          <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span>No. Faktur</span>
              <span className="font-bold text-slate-900">{transaction.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{formatDateTime(transaction.date)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir</span>
              <span>{transaction.cashierName || 'Kasir'}</span>
            </div>
            <div className="flex justify-between">
              <span>Metode</span>
              <span className="font-bold">{transaction.paymentMethod}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5">
            {transaction.items?.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>{item.quantity} x {formatCurrency(item.price)}</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(transaction.totalAmount)}</span>
            </div>
            {Number(transaction.discountAmount) > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon</span>
                <span>-{formatCurrency(transaction.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-slate-900 pt-1">
              <span>TOTAL AKHIR</span>
              <span className="text-emerald-700">{formatCurrency(transaction.finalAmount)}</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span>Bayar ({transaction.paymentMethod})</span>
              <span>{formatCurrency(transaction.amountPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian</span>
              <span className="font-bold">{formatCurrency(transaction.changeAmount)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-3 text-center text-[9px] text-slate-500 whitespace-pre-line leading-normal">
            {footerNote}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Nota Thermal</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Nota PDF</span>
          </button>
        </div>

        {/* New Transaction Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onNewTransaction?.();
          }}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Mulai Transaksi Baru (Enter)</span>
        </button>
      </div>
    </Modal>
  );
}
