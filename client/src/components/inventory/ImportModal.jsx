import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../common/Modal';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle, Loader2, ArrowRight, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function ImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewErrors, setPreviewErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleDownloadTemplate = async (type = 'xlsx') => {
    try {
      setDownloadingTemplate(true);
      if (type === 'xlsx') {
        await productService.downloadTemplate();
        toast.success('Template Excel berhasil diunduh!');
      } else {
        await productService.downloadCsvTemplate();
        toast.success('Template CSV berhasil diunduh!');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal mengunduh template.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewRows([]);
    setPreviewErrors([]);
    setLoading(false);
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      toast.error('Format file tidak didukung! Gunakan file Excel (.xlsx, .xls) atau CSV (.csv).');
      return;
    }

    setFile(selectedFile);

    // Read and preview file locally
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (jsonRows.length < 2) {
          setPreviewErrors(['File kosong atau tidak memiliki baris data.']);
          setPreviewRows([]);
          return;
        }

        const headers = jsonRows[0].map((h) => String(h).trim().toLowerCase());

        // T-02 Fix: Kolom barcode/kode
        const barcodeIdx = headers.findIndex((h) => h.includes('barcode') || h.includes('kode'));

        // T-02 Fix: Prioritaskan 'nama', dan hindari mencocokkan 'barang' pada kolom barcode/kode
        let nameIdx = headers.findIndex((h) => h.includes('nama'));
        if (nameIdx === -1) {
          nameIdx = headers.findIndex(
            (h) => (h.includes('produk') || h.includes('item') || h.includes('barang')) &&
                   !h.includes('barcode') &&
                   !h.includes('kode')
          );
        }

        const catIdx = headers.findIndex((h) => h.includes('kategori') || h.includes('category'));
        const buyIdx = headers.findIndex((h) => h.includes('modal') || h.includes('harga beli') || h.includes('beli'));
        const sellIdx = headers.findIndex(
          (h) => (h.includes('harga jual') || h.includes('jual')) && !h.includes('beli') && !h.includes('modal')
        );
        const stockIdx = headers.findIndex(
          (h) => (h.includes('stok') || h.includes('stock') || h.includes('qty')) && !h.includes('min')
        );
        const unitIdx = headers.findIndex((h) => h.includes('satuan') || h.includes('unit'));

        if (nameIdx === -1) {
          setPreviewErrors(['Kolom "Nama Produk" tidak ditemukan pada header file!']);
          setPreviewRows([]);
          return;
        }

        const parsed = [];
        const errs = [];

        for (let i = 1; i < Math.min(jsonRows.length, 100); i++) {
          const r = jsonRows[i];
          if (!r || r.every((c) => String(c).trim() === '')) continue;

          const name = String(r[nameIdx] || '').trim();
          if (!name) {
            errs.push(`Baris ${i + 1}: Nama produk kosong.`);
            continue;
          }

          const barcode = barcodeIdx !== -1 ? String(r[barcodeIdx] || '').trim() : '';
          const category = catIdx !== -1 ? String(r[catIdx] || 'Alat Tulis').trim() : 'Alat Tulis';
          const buyPrice = buyIdx !== -1 ? parseFloat(String(r[buyIdx]).replace(/[^0-9.-]/g, '')) || 0 : 0;
          const sellPrice = sellIdx !== -1 ? parseFloat(String(r[sellIdx]).replace(/[^0-9.-]/g, '')) || 0 : 0;
          const stock = stockIdx !== -1 ? parseInt(String(r[stockIdx]).replace(/[^0-9-]/g, ''), 10) || 0 : 0;
          const unit = unitIdx !== -1 ? String(r[unitIdx] || 'pcs').trim() : 'pcs';

          parsed.push({
            rowNum: i + 1,
            barcode,
            name,
            category,
            buyPrice,
            sellPrice,
            stock,
            unit,
          });
        }

        setPreviewRows(parsed);
        setPreviewErrors(errs);
      } catch (err) {
        setPreviewErrors([`Gagal membaca file: ${err.message}`]);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Pilih file Excel / CSV terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await productService.importFile(formData);
      toast.success(res.message || 'Import data berhasil diproses!');
      resetState();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal mengimpor file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetState();
        onClose();
      }}
      title="Import / Restock Produk Massal"
      subtitle="Upload file Excel (.xlsx) atau CSV (.csv) untuk menambah/restock barang ATK"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Template download notice */}
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
          <div className="flex items-center space-x-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-900 leading-tight">Gunakan Template Standar</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                Unduh template yang sudah terformat rapi dengan contoh barang ATK.
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              type="button"
              disabled={downloadingTemplate}
              onClick={() => handleDownloadTemplate('xlsx')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingTemplate ? 'Mengunduh...' : 'Template Excel'}</span>
            </button>
            <button
              type="button"
              disabled={downloadingTemplate}
              onClick={() => handleDownloadTemplate('csv')}
              className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              CSV
            </button>
          </div>
        </div>

        {/* Upload Dropzone */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Tarik file ke sini, atau klik untuk memilih</h4>
            <p className="text-xs text-slate-500 mt-1">Mendukung file .xlsx, .xls, dan .csv (Maksimal 10MB)</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* File info bar */}
            <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{file.name}</div>
                  <div className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={resetState}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Errors alert if any */}
            {previewErrors.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Peringatan Pembacaan Data:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {previewErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            {previewRows.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
                  <span>Pratinjau Data ({previewRows.length} baris terdeteksi):</span>
                  <span className="text-[11px] text-slate-500 font-normal">Barang yang sudah ada akan otomatis di-restock</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">Kode/Barcode</th>
                        <th className="p-2">Nama Produk ATK</th>
                        <th className="p-2">Kategori</th>
                        <th className="p-2 text-right">Harga Jual</th>
                        <th className="p-2 text-center">Stok Masuk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-500">{row.barcode || '-'}</td>
                          <td className="p-2 font-bold text-slate-800">{row.name}</td>
                          <td className="p-2 text-slate-600">{row.category}</td>
                          <td className="p-2 text-right font-semibold text-emerald-700">
                            {formatCurrency(row.sellPrice)}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-900">
                            +{row.stock} {row.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !file || previewRows.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Database...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Proses Import & Simpan ke Database</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
