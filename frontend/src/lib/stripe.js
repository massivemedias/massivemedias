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

  // Fallback: attendre que le script async se charge
  stripePromiseCache = new Promise((resolve) => {
    const check = () => {
      if (window.Stripe) {
        resolve(window.Stripe(key));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });

  return stripePromiseCache;
}
