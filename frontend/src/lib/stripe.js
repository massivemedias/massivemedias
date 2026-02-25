let stripePromiseCache = null;

export function getStripePromise() {
  if (stripePromiseCache) return stripePromiseCache;
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!key) return null;
  return import('@stripe/stripe-js').then(({ loadStripe }) => {
    stripePromiseCache = loadStripe(key);
    return stripePromiseCache;
  });
}
