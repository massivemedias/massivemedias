import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { trackAddToCart, trackRemoveFromCart } from '../utils/analytics';
import { useAuth } from './AuthContext';
import { getStickerPrice } from '../data/products';

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

function loadPromo() {
  try {
    const saved = localStorage.getItem('massive-promo');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function savePromoLocal(promo) {
  try {
    if (promo) {
      localStorage.setItem('massive-promo', JSON.stringify(promo));
    } else {
      localStorage.removeItem('massive-promo');
    }
  } catch {}
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const { user, updateProfile } = useAuth();
  const syncedRef = useRef(false);
  const savingRef = useRef(false);

  // Promo code state (initialise une seule fois depuis localStorage)
  const [promoCode, setPromoCode] = useState(() => loadPromo()?.code || '');
  const [discountPercent, setDiscountPercent] = useState(() => loadPromo()?.percent || 0);
  const [promoLabel, setPromoLabel] = useState(() => loadPromo()?.label || '');

  // A la connexion : restaurer le panier depuis Supabase SEULEMENT si pas de panier local
  useEffect(() => {
    if (!user || syncedRef.current) return;
    syncedRef.current = true;
    const localCart = loadCart();
    if (localCart.length > 0) {
      // Le panier local a priorite - sync vers Supabase
      saveToSupabase(localCart);
      return;
    }
    const meta = user.user_metadata || {};
    const savedCart = meta.cart_items || [];
    if (savedCart.length > 0) {
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
      // Si le meme produit existe deja (meme productId + finish + size + shape), incrementer la quantite
      const existingIndex = prev.findIndex(existing =>
        existing.productId === item.productId &&
        existing.finish === item.finish &&
        existing.size === item.size &&
        existing.shape === item.shape &&
        !existing.isUnique && !item.isUnique
      );
      let updated;
      if (existingIndex >= 0) {
        updated = prev.map((existing, i) =>
          i === existingIndex
            ? { ...existing, quantity: existing.quantity + (item.quantity || 1), totalPrice: (existing.quantity + (item.quantity || 1)) * existing.unitPrice }
            : existing
        );
      } else {
        updated = [...prev, item];
      }
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
      saveCartLocal(updated);
      // Sauvegarde immediate dans Supabase (pas debounce) pour eviter la restauration fantome
      if (user) saveToSupabase(updated);
      return updated;
    });
  }, [user, saveToSupabase]);

  const updateQuantity = useCallback((index, quantity, unitPrice) => {
    setItems(prev => {
      const updated = prev.map((item, i) => {
        if (i !== index) return item;
        // Pour les stickers, recalculer le prix selon le palier (anti-manipulation)
        let finalUnitPrice = unitPrice;
        let finalTotal = quantity * unitPrice;
        if (item.productId === 'sticker-custom' || item.productId === 'sticker-artist') {
          const priceInfo = getStickerPrice(item.finish, item.shape, quantity);
          if (priceInfo) {
            finalUnitPrice = priceInfo.unitPrice;
            finalTotal = priceInfo.price;
          }
        }
        return { ...item, quantity, unitPrice: finalUnitPrice, totalPrice: finalTotal };
      });
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
    setPromoCode('');
    setDiscountPercent(0);
    setPromoLabel('');
    savePromoLocal(null);
  }, [saveCart]);

  const applyPromoCode = useCallback((code, percent, label) => {
    setPromoCode(code);
    setDiscountPercent(percent);
    setPromoLabel(label || '');
    savePromoLocal({ code, percent, label });
  }, []);

  const removePromoCode = useCallback(() => {
    setPromoCode('');
    setDiscountPercent(0);
    setPromoLabel('');
    savePromoLocal(null);
  }, []);

  const cartCount = items.length;
  const cartTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = discountPercent > 0 ? Math.round(cartTotal * discountPercent / 100) : 0;

  const value = useMemo(() => ({
    items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal,
    promoCode, discountPercent, discountAmount, promoLabel,
    applyPromoCode, removePromoCode,
  }), [items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal,
    promoCode, discountPercent, discountAmount, promoLabel, applyPromoCode, removePromoCode]);

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
