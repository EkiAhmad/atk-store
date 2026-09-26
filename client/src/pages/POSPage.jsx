import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BarcodeSearchInput from '../components/pos/BarcodeSearchInput';
import CategoryTabs from '../components/pos/CategoryTabs';
import ProductGrid from '../components/pos/ProductGrid';
import CartPanel from '../components/pos/CartPanel';
import PaymentModal from '../components/pos/PaymentModal';
import ReceiptModal from '../components/pos/ReceiptModal';
import { productService } from '../services/productService';
import { settingService } from '../services/settingService';
import { useToast } from '../context/ToastContext';
import { RefreshCw } from 'lucide-react';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState(null);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  const toast = useToast();

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, setRes] = await Promise.all([
        productService.getAllProductsForPos(),
        productService.getCategories(),
        settingService.getSettings(),
      ]);

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setStoreInfo(setRes.data || null);
    } catch (err) {
      toast.error('Gagal memuat katalog barang: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Filter products by category and search text
  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory) {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  const handleTransactionSuccess = (transactionData) => {
    setLastTransaction(transactionData);
    setIsReceiptOpen(true);
    // Refresh product stock in catalog
    fetchInitialData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Search, Category Tabs, & Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Barcode Search Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <BarcodeSearchInput
                products={products}
                onSelectProduct={(query) => setSearchQuery(query)}
              />
            </div>
            <button
              onClick={fetchInitialData}
              title="Perbarui Data Stok"
              className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* Category Filter Tabs */}
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Product Cards Grid */}
          <ProductGrid products={filteredProducts} loading={loading} />
        </div>

        {/* Right Column: Active Cart & Calculation (4 cols) */}
        <div className="lg:col-span-4">
          <CartPanel onOpenPaymentModal={() => setIsPaymentOpen(true)} />
        </div>
      </div>

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handleTransactionSuccess}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={lastTransaction}
        store={storeInfo}
        onNewTransaction={() => {
          setIsReceiptOpen(false);
          // Refocus search if desired
        }}
      />
    </div>
  );
}
