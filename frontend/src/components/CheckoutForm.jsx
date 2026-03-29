import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

function CheckoutForm({ cartTotal, checkoutData }) {
  const stripe = useStripe();
  const elements = useElements();
  const { t, tx } = useLang();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [usesFallback, setUsesFallback] = useState(false);

  // Si apres 8 secondes le PaymentElement n'est toujours pas ready,
  // on bascule automatiquement vers Stripe Checkout (page hebergee)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!paymentElementReady) {
        setUsesFallback(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [paymentElementReady]);

  // Lancer automatiquement le fallback
  useEffect(() => {
    if (usesFallback && checkoutData && !fallbackLoading) {
      handleFallbackCheckout();
    }
  }, [usesFallback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !paymentElementReady) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message || t('checkout.stripeError'));
        } else {
          setErrorMessage(t('checkout.stripeError') || 'Une erreur est survenue. Veuillez reessayer.');
        }
        setIsProcessing(false);
      }
    } catch (err) {
      // Si confirmPayment echoue completement, fallback vers Stripe Checkout
      setUsesFallback(true);
    }
  };

  // Fallback: rediriger vers Stripe Checkout (page hebergee par Stripe)
  const handleFallbackCheckout = async () => {
    if (!checkoutData) return;
    setFallbackLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post('/orders/create-checkout-session', checkoutData);
      const url = res.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        setErrorMessage('Impossible de creer la session de paiement.');
        setFallbackLoading(false);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Erreur lors de la creation du paiement.');
      setFallbackLoading(false);
    }
  };

  // Affichage fallback
  if (usesFallback) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-glass">
          <p className="text-heading text-sm mb-4">
            {tx({
              fr: 'Redirection vers la page de paiement securisee...',
              en: 'Redirecting to secure payment page...',
              es: 'Redirigiendo a la pagina de pago segura...',
            })}
          </p>
          <button
            onClick={handleFallbackCheckout}
            disabled={fallbackLoading}
            className="btn-primary w-full justify-center text-base py-3.5 disabled:opacity-50"
          >
            {fallbackLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                {tx({ fr: 'Redirection...', en: 'Redirecting...', es: 'Redirigiendo...' })}
              </>
            ) : (
              <>
                <ExternalLink size={18} className="mr-2" />
                {tx({
                  fr: `Payer ${cartTotal}$ via Stripe`,
                  en: `Pay ${cartTotal}$ via Stripe`,
                  es: `Pagar ${cartTotal}$ via Stripe`,
                })}
              </>
            )}
          </button>
        </div>
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30 error-bg">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-bold text-heading mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-accent" />
          {t('checkout.paymentInfo')}
        </h3>
        <div className="p-4 rounded-xl bg-glass">
          <PaymentElement
            onReady={() => setPaymentElementReady(true)}
            options={{
              layout: 'tabs',
            }}
          />
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
        disabled={!stripe || !paymentElementReady || isProcessing}
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
