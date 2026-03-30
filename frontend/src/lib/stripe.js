import { loadStripe } from '@stripe/stripe-js';

const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// loadStripe est LA methode officielle recommandee par Stripe
// Elle retourne une Promise<Stripe> que Elements sait gerer
const stripePromise = key ? loadStripe(key) : null;

export function getStripePromise() {
  return stripePromise;
}
