import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext();

function loadCart() {
  try {
    const saved = localStorage.getItem('massive-cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  try { localStorage.setItem('massive-cart', JSON.stringify(items)); } catch {}
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  const addToCart = useCallback((item) => {
    setItems(prev => {
      const updated = [...prev, item];
      saveCart(updated);
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((index) => {
    setItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      saveCart(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((index, quantity, unitPrice) => {
    setItems(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, quantity, unitPrice, totalPrice: quantity * unitPrice } : item
      );
      saveCart(updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const cartCount = items.length;
  const cartTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const value = useMemo(() => ({
    items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal
  }), [items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
