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
