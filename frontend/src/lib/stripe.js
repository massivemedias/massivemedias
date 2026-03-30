import { loadStripe } from '@stripe/stripe-js';

const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Singleton: loadStripe charge le script ET cree l'instance une seule fois
let stripePromise = key ? loadStripe(key) : null;

export async function getStripeInstance() {
  if (!stripePromise) return null;
  return stripePromise;
}
