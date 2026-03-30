const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

let stripeInstance = null;

export function getStripePromise() {
  if (!key) return null;
  if (stripeInstance) return stripeInstance;

  // window.Stripe est charge via <script> synchrone dans index.html
  if (window.Stripe) {
    stripeInstance = Promise.resolve(window.Stripe(key));
    return stripeInstance;
  }

  // Fallback: ne devrait jamais arriver avec le script synchrone
  return null;
}
