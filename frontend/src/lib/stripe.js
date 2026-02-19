import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export const stripePromise = stripePublicKey
  ? loadStripe(stripePublicKey)
  : null;
