import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, QrCode, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import { useCart } from '../../context/CartContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { transactionService } from '../../services/transactionService';
import { useToast } from '../../context/ToastContext';

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
  const { cartItems, finalTotal, discountAmount, cashierName, notes, setNotes, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setAmountPaid(String(finalTotal));
    }
  }, [isOpen, finalTotal]);

  const numericPaid = parseFloat(amountPaid) || 0;
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, numericPaid - finalTotal) : 0;
  const isInsufficient = paymentMethod === 'CASH' && numericPaid < finalTotal;

  // Preset quick cash buttons
  const cashPresets = [
    { label: 'Uang Pas', value: finalTotal },
    { label: '10.000', value: 10000 },
    { label: '20.000', value: 20000 },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
  ].filter((p) => p.value >= finalTotal || p.label === 'Uang Pas');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isInsufficient) {
      toast.error('Uang yang dibayarkan kurang dari total tagihan!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        cashierName: cashierName || 'Kasir Toko',
        paymentMethod,
        amountPaid: paymentMethod === 'CASH' ? numericPaid : finalTotal,
        discountAmount,
        notes,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          barcode: item.product.barcode,
          price: Number(item.product.sellPrice),
          costPrice: Number(item.product.buyPrice),
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      };

      const res = await transactionService.createTransaction(payload);
      toast.success(`Transaksi ${res.data.invoiceNumber} berhasil disimpan!`);
      clearCart();
      onClose();
      onSuccess(res.data);
    } catch (err) {
      toast.error(err.message || 'Gagal memproses transaksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Selesaikan Pembayaran" subtitle="Pilih metode dan input nominal bayar" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Total Display */}
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Tagihan</span>
            <div className="text-2xl font-extrabold text-emerald-900 mt-0.5">{formatCurrency(finalTotal)}</div>
          </div>
          <div className="text-xs text-emerald-700 font-medium text-right">
            {cartItems.reduce((s, i) => s + i.quantity, 0)} Pcs Barang ATK
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Metode Pembayaran</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'CASH', label: 'Tunai', icon: Banknote },
              { id: 'QRIS', label: 'QRIS', icon: QrCode },
              { id: 'TRANSFER', label: 'Transfer', icon: CreditCard },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    setPaymentMethod(m.id);
                    if (m.id !== 'CASH') setAmountPaid(String(finalTotal));
                  }}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cash Input & Change Calculation */}
        {paymentMethod === 'CASH' && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 flex justify-between">
                <span>Uang Diterima (Rp)</span>
                {numericPaid > 0 && <span className="text-slate-400 font-normal">Rp {formatNumber(numericPaid)}</span>}
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2.5 text-base font-extrabold text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Cash Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {cashPresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAmountPaid(String(preset.value))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Change Result Box */}
            <div className={`p-3.5 rounded-xl border ${isInsufficient ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Uang Kembalian:</span>
                <span className={`text-lg font-extrabold ${isInsufficient ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {isInsufficient ? `Kurang Rp ${formatNumber(finalTotal - numericPaid)}` : formatCurrency(changeAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-slate-700">Catatan Transaksi (Opsional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Pesanan kantor / nama pembeli"
            className="w-full mt-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/3 py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || isInsufficient}
            className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Konfirmasi & Bayar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
