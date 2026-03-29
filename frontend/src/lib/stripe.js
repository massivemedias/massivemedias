let stripePromiseCache = null;

export function getStripePromise() {
  if (stripePromiseCache) return stripePromiseCache;
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!key) return null;

  // Utiliser le Stripe deja charge via <script> dans index.html
  if (window.Stripe) {
    stripePromiseCache = Promise.resolve(window.Stripe(key));
    return stripePromiseCache;
  }

  // Fallback: attendre que le script async se charge (max 10s)
  stripePromiseCache = new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 100; // 100 x 100ms = 10 secondes
    const check = () => {
      if (window.Stripe) {
        resolve(window.Stripe(key));
      } else if (attempts >= maxAttempts) {
        reject(new Error('Stripe failed to load'));
      } else {
        attempts++;
        setTimeout(check, 100);
      }
    };
    check();
  }).catch(() => null); // Retourne null si Stripe ne charge pas

  return stripePromiseCache;
}
