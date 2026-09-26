import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
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

  // Clear all cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setDiscountAmount(0);
    setNotes('');
  }, []);

  // Derived calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cartItems]);

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
        discountAmount,
        setDiscountAmount,
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
