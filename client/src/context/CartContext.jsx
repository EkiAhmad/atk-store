import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [discountType, setDiscountType] = useState('nominal'); // 'nominal' (Rp) | 'percent' (%)
  const [discountValue, setDiscountValue] = useState(0); // Nilai masukan kasir
  const [cashierName, setCashierName] = useState('Kasir Toko');
  const [notes, setNotes] = useState('');
  const toast = useToast();

  // Add item to cart (from barcode hit or product card click)
  const addToCart = useCallback(
    (product, qtyToAdd = 1) => {
      if (!product || product.stock <= 0) {
        toast.error(`Stok "${product?.name || 'Barang'}" habis!`);
        return false;
      }

      let success = true;

      setCartItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.product.id === product.id);

        if (existingIndex > -1) {
          const currentItem = prev[existingIndex];
          const newQty = currentItem.quantity + qtyToAdd;

          if (newQty > product.stock) {
            toast.warning(`Stok "${product.name}" hanya tersisa ${product.stock} ${product.unit}.`);
            success = false;
            // Update to max available
            const updated = [...prev];
            updated[existingIndex] = {
              ...currentItem,
              quantity: product.stock,
              subtotal: product.stock * Number(product.sellPrice),
            };
            return updated;
          }

          const updated = [...prev];
          updated[existingIndex] = {
            ...currentItem,
            quantity: newQty,
            subtotal: newQty * Number(product.sellPrice),
          };
          toast.info(`+${qtyToAdd} ${product.name}`);
          return updated;
        } else {
          const initialQty = Math.min(qtyToAdd, product.stock);
          toast.info(`Ditambahkan ke keranjang: ${product.name}`);
          return [
            ...prev,
            {
              product,
              quantity: initialQty,
              subtotal: initialQty * Number(product.sellPrice),
            },
          ];
        }
      });

      return success;
    },
    [toast]
  );

  // Update quantity directly (from stepper or manual typing)
  const updateQuantity = useCallback(
    (productId, newQty) => {
      const parsedQty = parseInt(newQty, 10);

      setCartItems((prev) => {
        const existing = prev.find((item) => item.product.id === productId);
        if (!existing) return prev;

        if (isNaN(parsedQty) || parsedQty <= 0) {
          // Remove if 0 or invalid
          return prev.filter((item) => item.product.id !== productId);
        }

        const maxStock = existing.product.stock;
        if (parsedQty > maxStock) {
          toast.warning(`Jumlah dibatasi stok maksimal: ${maxStock} ${existing.product.unit}`);
          return prev.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: maxStock, subtotal: maxStock * Number(item.product.sellPrice) }
              : item
          );
        }

        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: parsedQty, subtotal: parsedQty * Number(item.product.sellPrice) }
            : item
        );
      });
    },
    [toast]
  );

  // Remove single item
  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  // Derived subtotal
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cartItems]);

  // Derived discountAmount (selalu divalidasi dan di-clamp: 0 <= discountAmount <= subtotal)
  const discountAmount = useMemo(() => {
    if (subtotal <= 0) return 0;
    if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, parseFloat(discountValue) || 0));
      return Math.round((subtotal * pct) / 100);
    }
    const nom = Math.max(0, parseFloat(discountValue) || 0);
    return Math.min(subtotal, nom);
  }, [discountType, discountValue, subtotal]);

  // Derived discountPercent (selalu di-clamp: 0 <= discountPercent <= 100)
  const discountPercent = useMemo(() => {
    if (discountType === 'percent') {
      return Math.min(100, Math.max(0, parseFloat(discountValue) || 0));
    }
    if (subtotal > 0) {
      return Math.min(100, Math.round((discountAmount / subtotal) * 100));
    }
    return 0;
  }, [discountType, discountValue, discountAmount, subtotal]);

  // Helper set discount
  const setDiscount = useCallback((type, value) => {
    const parsed = Math.max(0, parseFloat(value) || 0);
    if (type === 'percent') {
      setDiscountType('percent');
      setDiscountValue(Math.min(100, parsed));
    } else {
      setDiscountType('nominal');
      setDiscountValue(parsed);
    }
  }, []);

  // Backward compatibility setter
  const setDiscountAmount = useCallback((amt) => {
    setDiscount('nominal', amt);
  }, [setDiscount]);

  // Clear discount
  const clearDiscount = useCallback(() => {
    setDiscountValue(0);
    setDiscountType('nominal');
  }, []);

  // Clear all cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setDiscountValue(0);
    setDiscountType('nominal');
    setNotes('');
  }, []);

  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        discountType,
        setDiscountType,
        discountValue,
        setDiscountValue,
        discountPercent,
        discountAmount,
        setDiscountAmount,
        setDiscount,
        clearDiscount,
        cashierName,
        setCashierName,
        notes,
        setNotes,
        subtotal,
        totalItemsCount,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
