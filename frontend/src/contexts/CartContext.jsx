import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { trackAddToCart, trackRemoveFromCart } from '../utils/analytics';
import { useAuth } from './AuthContext';

const CartContext = createContext();

function loadCart() {
  try {
    const saved = localStorage.getItem('massive-cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCartLocal(items) {
  try { localStorage.setItem('massive-cart', JSON.stringify(items)); } catch (e) {
    console.warn('Erreur sauvegarde panier localStorage:', e);
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const { user, updateProfile } = useAuth();
  const syncedRef = useRef(false);
  const savingRef = useRef(false);

  // A la connexion : restaurer le panier depuis Supabase si le panier local est vide
  useEffect(() => {
    if (!user || syncedRef.current) return;
    syncedRef.current = true;
    const meta = user.user_metadata || {};
    const savedCart = meta.cart_items || [];
    if (savedCart.length > 0 && items.length === 0) {
      setItems(savedCart);
      saveCartLocal(savedCart);
    }
  }, [user]);

  // Sauvegarder le panier dans Supabase a chaque changement (si connecte)
  const saveToSupabase = useCallback(async (cartItems) => {
    if (!user || savingRef.current) return;
    savingRef.current = true;
    try {
      await updateProfile({ cart_items: cartItems });
    } catch {} finally {
      savingRef.current = false;
    }
  }, [user, updateProfile]);

  // Debounce la sauvegarde Supabase (pas a chaque clic)
  const debounceRef = useRef(null);
  const saveCart = useCallback((cartItems) => {
    saveCartLocal(cartItems);
    if (user) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveToSupabase(cartItems), 2000);
    }
  }, [user, saveToSupabase]);

  const addToCart = useCallback((item) => {
    setItems(prev => {
      const updated = [...prev, item];
      saveCart(updated);
      return updated;
    });
    trackAddToCart(item);
  }, [saveCart]);

  const removeFromCart = useCallback((index) => {
    setItems(prev => {
      const removed = prev[index];
      if (removed) trackRemoveFromCart(removed);
      const updated = prev.filter((_, i) => i !== index);
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const updateQuantity = useCallback((index, quantity, unitPrice) => {
    setItems(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, quantity, unitPrice, totalPrice: quantity * unitPrice } : item
      );
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, [saveCart]);

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
