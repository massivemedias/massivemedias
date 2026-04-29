// ============================================================
// analytics.js - Google Analytics (gtag.js) conditionnel
// Ne charge le script que si l'utilisateur a consenti
// ============================================================
//
// EXCLUSION DU TRAFIC INTERNE (29 avril 2026, mission Top 3 oeuvres GA4) :
// On NE veut PAS que les visites de l'admin Massive Medias ou des
// artistes eux-memes (qui regardent leurs propres pages depuis leurs
// comptes) polluent les stats GA4 - sinon les chiffres "vues d'oeuvres"
// affiches dans le panneau admin sont fausses.
//
// L'identite de l'utilisateur connecte est poussee dans ce module
// par la couche AuthContext via setAnalyticsIdentity(...). Si l'email
// matche l'admin OU l'email d'un artiste public, AUCUN event n'est
// envoye a GA - meme pas le pageview implicite.

const GA_ID = import.meta.env.VITE_GA_ID || '';
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'massivemedias@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

let initialized = false;

// Etat d'identite pousse par la couche Auth + useArtists
let _currentUserEmail = '';
let _artistEmails = new Set();

/**
 * Pousse l'identite de l'utilisateur connecte vers le module analytics.
 * A appeler quand l'utilisateur change (login / logout) ou quand la
 * liste des artistes est chargee depuis le CMS. Ce setter est volontaire-
 * ment idempotent et muet : si rien ne change, on ne re-init pas.
 *
 * @param {object} identity
 * @param {string} [identity.email] - email du user courant
 * @param {string[]} [identity.artistEmails] - liste des emails artistes
 */
export function setAnalyticsIdentity({ email, artistEmails } = {}) {
  if (typeof email === 'string') {
    _currentUserEmail = email.trim().toLowerCase();
  }
  if (Array.isArray(artistEmails)) {
    _artistEmails = new Set(
      artistEmails
        .filter(Boolean)
        .map((e) => String(e).trim().toLowerCase()),
    );
  }
}

/**
 * Predicat strict : true si l'utilisateur courant doit etre exclu de
 * GA. On exclut :
 *   - l'admin (massivemedias@gmail.com via VITE_ADMIN_EMAILS)
 *   - tout user dont l'email matche celui d'un artiste publie
 *
 * Aucun side-effect, aucune log : ce predicat est appele sur CHAQUE
 * event, donc il doit rester rapide et silencieux.
 */
function _shouldExclude() {
  if (!_currentUserEmail) return false;
  if (ADMIN_EMAILS.includes(_currentUserEmail)) return true;
  if (_artistEmails.has(_currentUserEmail)) return true;
  return false;
}

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

// Garde universel pour TOUS les emit GA. Retourne true si on doit
// dropper l'event (gtag manquant OU user a exclure).
function _gateOut() {
  if (!initialized || !window.gtag) return true;
  if (_shouldExclude()) return true;
  return false;
}

export function trackPageView(path) {
  if (_gateOut()) return;
  window.gtag('event', 'page_view', {
    page_path: path,
  });
}

export function trackEvent(action, category, label, value) {
  if (_gateOut()) return;
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
  if (_gateOut()) return;
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
  if (_gateOut()) return;
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
  if (_gateOut()) return;
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
  if (_gateOut()) return;
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
  if (_gateOut()) return;
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

/**
 * Mission Top 3 oeuvres : pageview virtuel par oeuvre artiste.
 * Le path utilise un prefixe `/oeuvre/{artistSlug}/{printSlug}` pour
 * que le backend puisse facilement filtrer les pages-vues "oeuvres"
 * sans impacter le path canonique de la page (qui reste /artistes/X).
 *
 * Pourquoi un pageview plutot qu'un event custom ? GA4 expose
 * `screenPageViews` par `pagePath` nativement via le Reporting API,
 * donc on n'a pas besoin de configurer un nouveau parametre custom
 * dans GA4. Less ops, more clean.
 */
export function trackArtworkView(artistSlug, printSlug, printTitle) {
  if (_gateOut()) return;
  if (!artistSlug || !printSlug) return;
  const path = `/oeuvre/${artistSlug}/${printSlug}`;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: printTitle || `${artistSlug} - ${printSlug}`,
  });
}
