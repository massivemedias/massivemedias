import { useState, useEffect, useRef } from 'react';
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Create ONE Stripe instance at module level - never create a second one
let _stripe = null;
function getStripe() {
  if (_stripe) return _stripe;
  if (window.Stripe && STRIPE_KEY) {
    _stripe = window.Stripe(STRIPE_KEY);
  }
  return _stripe;
}

function CheckoutForm({ cartTotal, clientSecret }) {
  const { t, tx } = useLang();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const elementsRef = useRef(null);
  const divRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!clientSecret || mountedRef.current) return;

    const stripe = getStripe();
    if (!stripe) return;

    // Wait for div to be in DOM
    const interval = setInterval(() => {
      if (mountedRef.current) { clearInterval(interval); return; }
      const target = divRef.current;
      if (!target || !target.isConnected) return;

      clearInterval(interval);
      mountedRef.current = true;

      // Remove orphan Stripe iframes from previous loads
      document.querySelectorAll('body > iframe[src*="stripe"]').forEach(f => f.remove());

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
      pe.mount(target);
    }, 200);

    return () => clearInterval(interval);
  }, [clientSecret]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stripe = getStripe();
    if (!stripe || !elementsRef.current || !paymentElementReady) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
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
          <div ref={divRef} />
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
