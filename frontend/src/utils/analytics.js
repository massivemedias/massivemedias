// ============================================================
// analytics.js - Google Analytics (gtag.js) conditionnel
// Ne charge le script que si l'utilisateur a consenti
// ============================================================

const GA_ID = import.meta.env.VITE_GA_ID || '';

let initialized = false;

export function initGA() {
  if (initialized || !GA_ID) return;

  // Inject gtag.js script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Init dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });

  initialized = true;
}

export function trackPageView(path) {
  if (!initialized || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
  });
}

export function trackEvent(action, category, label, value) {
  if (!initialized || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
}

// ============================================================
// E-commerce GA4 events
// ============================================================

export function trackAddToCart(item) {
  if (!initialized || !window.gtag) return;
  window.gtag('event', 'add_to_cart', {
    currency: 'CAD',
    value: item.totalPrice || item.unitPrice,
    items: [{
      item_id: item.productId,
      item_name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity || 1,
    }],
  });
}

export function trackRemoveFromCart(item) {
  if (!initialized || !window.gtag) return;
  window.gtag('event', 'remove_from_cart', {
    currency: 'CAD',
    value: item.totalPrice || item.unitPrice,
    items: [{
      item_id: item.productId,
      item_name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity || 1,
    }],
  });
}

export function trackBeginCheckout(items, total) {
  if (!initialized || !window.gtag) return;
  window.gtag('event', 'begin_checkout', {
    currency: 'CAD',
    value: total,
    items: items.map(item => ({
      item_id: item.productId,
      item_name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity || 1,
    })),
  });
}

export function trackPurchase(transactionId, items, total, shipping, tax) {
  if (!initialized || !window.gtag) return;
  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    currency: 'CAD',
    value: total,
    shipping: shipping || 0,
    tax: tax || 0,
    items: items.map(item => ({
      item_id: item.productId,
      item_name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity || 1,
    })),
  });
}

export function trackViewItem(item) {
  if (!initialized || !window.gtag) return;
  window.gtag('event', 'view_item', {
    currency: 'CAD',
    value: item.price || 0,
    items: [{
      item_id: item.id || item.productId,
      item_name: item.name || item.productName,
      price: item.price || 0,
    }],
  });
}
