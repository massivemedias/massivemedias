import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { trackAddToCart, trackRemoveFromCart } from '../utils/analytics';
import { getStickerPrice } from '../data/products';

const CartContext = createContext();

/**
 * cartId stable: identifiant aleatoire persiste dans localStorage, genere une
 * seule fois au premier chargement. Utilise pour:
 *   - Classer les uploads Google Drive du client dans un sous-dossier dedie
 *   - Lier une session guest a une commande finale
 *   - Tracker les paniers abandonnes sans compte
 *
 * Longueur 14 chars base36 (~72 bits entropie) - suffisant pour eviter les
 * collisions sans etre inutilement long dans les URLs et noms de dossiers.
 */
function ensureCartId() {
  try {
    const existing = localStorage.getItem('massive-cart-id');
    if (existing && /^[a-zA-Z0-9]{8,20}$/.test(existing)) return existing;
    const fresh = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 14)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem('massive-cart-id', fresh);
    return fresh;
  } catch {
    return 'nocart';
  }
}

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

  // Promo code state (initialise une seule fois depuis localStorage)
  const [promoCode, setPromoCode] = useState(() => loadPromo()?.code || '');
  const [discountPercent, setDiscountPercent] = useState(() => loadPromo()?.percent || 0);
  const [promoLabel, setPromoLabel] = useState(() => loadPromo()?.label || '');

  // BUG-CRITICAL-FIX (6 mai 2026) : la sauvegarde du panier dans
  // supabase.user_metadata.cart_items a ete ENTIEREMENT SUPPRIMEE.
  //
  // Pourquoi : un sticker custom contient une preview base64 (`image`) qui peut
  // peser 100KB+. Ce blob etait persiste dans user_metadata, donc serialise
  // dans le payload du JWT a chaque refresh (c'est la nature des JWT
  // Supabase : tout user_metadata y est inclus). Resultat : JWT > 144KB,
  // header Authorization rejete par Cloudflare/Render -> "Failed to fetch"
  // sur TOUS les calls API authentifies (dashboard admin vide, panier vide,
  // etc.). Diagnostic confirme par dump live : payload JWT 108KB dont
  // user_metadata.cart_items[0].image = 106KB de data:image/png;base64,...
  //
  // Decision : panier en localStorage UNIQUEMENT. Le multi-appareil n'est
  // pas critique pour un panier - la conversion a lieu sur le meme appareil
  // que le browse. Si on veut le multi-appareil un jour, il faudra une
  // table Strapi `cart` cote backend (jamais du JWT).
  //
  // Cleanup deja effectue cote BDD : UPDATE auth.users SET raw_user_meta_data
  // = raw_user_meta_data - 'cart_items' WHERE raw_user_meta_data ? 'cart_items'
  // (7 users impactes nettoyes).

  const saveCart = useCallback((cartItems) => {
    saveCartLocal(cartItems);
  }, []);

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
        // FIX-FP-MONEY (5 mai 2026) : roundMoney sur le total ligne pour eviter
        // les artefacts IEEE 754 (ex: 25 * 0.5 = 12.499999... apres plusieurs ops).
        // Sans ca, un user a vu "125.99999999$" dans son total panier.
        // HOTFIX-ALLUMAGE (8 juillet 2026) : `existing` etait le parametre du
        // callback findIndex ci-dessus, DONC hors scope ici -> ReferenceError
        // et page blanche des qu'on ajoutait 2 fois le meme produit. Dormant
        // depuis mai (configs produits toutes uniques), revele par la
        // collection stickers ou re-cliquer un design est le geste normal.
        const base = prev[existingIndex];
        const newQty = base.quantity + (item.quantity || 1);
        const newTotal = Math.round(newQty * base.unitPrice * 100) / 100;
        updated = prev.map((existing, i) =>
          i === existingIndex
            ? { ...existing, quantity: newQty, totalPrice: newTotal }
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
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((index, quantity, unitPrice) => {
    setItems(prev => {
      const updated = prev.map((item, i) => {
        if (i !== index) return item;
        // Pour les stickers, recalculer le prix selon le palier (anti-manipulation)
        // FIX-FP-MONEY (5 mai 2026) : round le total a 2 decimales pour eviter
        // les artefacts FP type "125.99999999" qui propageraient ensuite au
        // cartTotal et au checkout.
        let finalUnitPrice = unitPrice;
        let finalTotal = Math.round(quantity * unitPrice * 100) / 100;
        if (item.productId === 'sticker-custom' || item.productId === 'sticker-artist') {
          // FIX-PRICING-TIERS (27 avril 2026) : la taille IMPACTE le prix via 3
          // paliers (Standard/Medium/Large). On passe item.sizeId au lookup pour
          // recalculer le prix dans le bon palier. Fallback gracieux : si sizeId
          // absent (ancien item du panier pre-fix), getStickerPrice utilise tier
          // 'standard' = ancien comportement -> aucune regression.
          const priceInfo = getStickerPrice(item.finish, item.shape, quantity, item.sizeId);
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
  // Calculer le total depuis quantity * unitPrice (plus robuste que totalPrice stocke)
  // FIX-FP-MONEY (5 mai 2026) : round chaque ligne ET le total final pour eviter
  // l'accumulation d'erreurs FP. Sans ca : 25 * 0.5 + 30.99 + 12.50 = 68.49 mais
  // sur certaines combinaisons -> 68.48999999. On round 2 fois (defense en profondeur).
  const cartTotal = Math.round(items.reduce((sum, item) => {
    const rawLineTotal = item.unitPrice != null ? item.quantity * item.unitPrice : item.totalPrice;
    const lineTotal = Math.round((rawLineTotal || 0) * 100) / 100;
    return sum + lineTotal;
  }, 0) * 100) / 100;
  // discountAmount : le rabais en $ arrondi a 2 decimales (pas Math.round entier
  // qui rendait 12.50$ -> 13$ - bug a part qui faisait "perdre" 0.50$ au user).
  const discountAmount = discountPercent > 0
    ? Math.round(cartTotal * discountPercent) / 100
    : 0;

  // cartId stable pour classer les uploads dans un sous-dossier Google Drive dedie
  const cartId = useMemo(() => ensureCartId(), []);

  const value = useMemo(() => ({
    items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal,
    promoCode, discountPercent, discountAmount, promoLabel,
    applyPromoCode, removePromoCode, cartId,
  }), [items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal,
    promoCode, discountPercent, discountAmount, promoLabel, applyPromoCode, removePromoCode, cartId]);

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
