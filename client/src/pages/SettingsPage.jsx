import React, { useState, useEffect } from 'react';
import { settingService } from '../services/settingService';
import { useToast } from '../context/ToastContext';
import { Store, Phone, MapPin, MessageSquare, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    receiptFooter: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    settingService
      .getSettings()
      .then((res) => {
        if (res.data) {
          setFormData({
            name: res.data.name || '',
            address: res.data.address || '',
            phone: res.data.phone || '',
            receiptFooter: res.data.receiptFooter || '',
          });
        }
      })
      .catch((err) => {
        toast.error('Gagal mengambil pengaturan toko: ' + err.message);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingService.updateSettings(formData);
      toast.success('Profil toko & keterangan struk berhasil disimpan!');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
        <p className="text-xs font-semibold">Memuat pengaturan toko...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Pengaturan Profil Toko</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Data ini akan otomatis muncul pada kop struk cetak, laporan PDF, dan dashboard kasir.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Store Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Nama Toko ATK *</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Toko ATK Berkah Mandiri"
              className="w-full mt-1.5 px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Address & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Alamat Toko</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. Pendidikan No. 123, Jakarta"
                className="w-full mt-1.5 px-3.5 py-2.5 text-xs text-slate-800 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>No. Telepon / WhatsApp</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812-3456-7890"
                className="w-full mt-1.5 px-3.5 py-2.5 text-xs text-slate-800 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Receipt Footer Note */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Catatan Kaki Struk (Receipt Footer Note)</span>
            </label>
            <textarea
              rows={3}
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              placeholder="Terima kasih atas kunjungan Anda!&#10;Barang yang sudah dibeli tidak dapat ditukar/dikembalikan."
              className="w-full mt-1.5 px-3.5 py-2 text-xs text-slate-800 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Teks ini dicetak di bagian paling bawah nota struk kasir.
            </span>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Pengaturan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
