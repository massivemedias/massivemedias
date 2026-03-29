import { loadStripe } from '@stripe/stripe-js';

const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// loadStripe gere tout: chargement du script, retry, cache
const stripePromise = key ? loadStripe(key) : null;

export function getStripePromise() {
  return stripePromise;
}
