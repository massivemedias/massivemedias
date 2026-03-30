const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Load Stripe script if not already present
function ensureStripeScript() {
  return new Promise((resolve) => {
    if (window.Stripe) {
      resolve(window.Stripe);
      return;
    }

    // Check if script tag already exists
    const existing = document.querySelector('script[src*="js.stripe.com"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Stripe));
      return;
    }

    // Inject script tag
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => resolve(window.Stripe);
    document.head.appendChild(script);
  });
}

let stripeInstance = null;

export async function getStripeInstance() {
  if (!key) return null;
  if (stripeInstance) return stripeInstance;

  const Stripe = await ensureStripeScript();
  if (!Stripe) return null;

  stripeInstance = Stripe(key);
  return stripeInstance;
}
