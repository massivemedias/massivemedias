import { useState, useEffect, useRef } from 'react';
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const MOUNT_ID = 'stripe-payment-element-mount';

function CheckoutForm({ cartTotal, clientSecret }) {
  const { t, tx } = useLang();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!clientSecret || !STRIPE_KEY || mountedRef.current) return;

    function doMount() {
      if (mountedRef.current) return;
      const target = document.getElementById(MOUNT_ID);
      if (!target || !target.isConnected || !window.Stripe) return;

      mountedRef.current = true;

      // CRITICAL: Remove ALL orphan Stripe iframes BEFORE creating instance
      document.querySelectorAll('iframe[src*="stripe"]').forEach(f => f.remove());

      const stripe = window.Stripe(STRIPE_KEY);
      stripeRef.current = stripe;

      const cs = getComputedStyle(document.documentElement);
      const elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: cs.getPropertyValue('--accent-color').trim() || '#FF52A0',
            colorBackground: cs.getPropertyValue('--bg-main').trim() || '#1a1a2e',
            colorText: cs.getPropertyValue('--text-heading').trim() || '#e4e4f0',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      });
      elementsRef.current = elements;

      const pe = elements.create('payment', { layout: 'tabs' });
      pe.on('ready', () => setPaymentElementReady(true));
      pe.mount('#' + MOUNT_ID);
    }

    // Load Stripe script if needed, then poll for mount target
    if (!window.Stripe) {
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = () => {
        const interval = setInterval(() => {
          if (mountedRef.current) { clearInterval(interval); return; }
          doMount();
        }, 200);
      };
      document.head.appendChild(s);
    } else {
      const interval = setInterval(() => {
        if (mountedRef.current) { clearInterval(interval); return; }
        doMount();
      }, 200);
    }
  }, [clientSecret]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripeRef.current || !elementsRef.current || !paymentElementReady) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        setErrorMessage(
          error.type === 'card_error' || error.type === 'validation_error'
            ? error.message || t('checkout.stripeError')
            : t('checkout.stripeError') || 'Une erreur est survenue.'
        );
        setIsProcessing(false);
      }
    } catch (err) {
      setErrorMessage('Une erreur inattendue est survenue. Veuillez reessayer.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-bold text-heading mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-accent" />
          {t('checkout.paymentInfo')}
        </h3>
        <div className="p-4 rounded-xl bg-glass">
          {!paymentElementReady && (
            <div className="flex items-center justify-center gap-3 py-6 text-grey-muted">
              <Loader2 size={20} className="animate-spin text-accent" />
              <span className="text-sm">{tx({ fr: 'Chargement du formulaire de paiement...', en: 'Loading payment form...', es: 'Cargando formulario de pago...' })}</span>
            </div>
          )}
          <div id={MOUNT_ID} />
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30 error-bg">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!paymentElementReady || isProcessing}
        className="btn-primary w-full justify-center text-base py-3.5 disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('checkout.processing')}
          </>
        ) : !paymentElementReady ? (
          <>
            <Loader2 size={18} className="mr-2 animate-spin" />
            {tx({ fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' })}
          </>
        ) : (
          <>
            <CreditCard size={18} className="mr-2" />
            {t('checkout.payAmount').replace('{amount}', cartTotal)}
          </>
        )}
      </button>
    </form>
  );
}

export default CheckoutForm;
