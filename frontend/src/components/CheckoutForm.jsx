import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, AlertCircle, ShieldAlert } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

function CheckoutForm({ cartTotal }) {
  const stripe = useStripe();
  const elements = useElements();
  const { t, tx } = useLang();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stripeBlocked, setStripeBlocked] = useState(false);

  // Detecter si Stripe est bloque (bloqueur de pub)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!stripe) setStripeBlocked(true);
    }, 5000);
    if (stripe) clearTimeout(timer);
    return () => clearTimeout(timer);
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      // If error, it means the payment was not redirected (card error, etc.)
      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message || t('checkout.stripeError'));
        } else {
          setErrorMessage(t('checkout.stripeError') || 'Une erreur est survenue. Veuillez reessayer ou utiliser une autre methode de paiement.');
        }
        setIsProcessing(false);
      }
      // If successful, the user is redirected to return_url
    } catch (err) {
      setErrorMessage('Une erreur inattendue est survenue. Veuillez reessayer.');
      setIsProcessing(false);
    }
  };

  if (stripeBlocked) {
    return (
      <div className="space-y-4 p-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <ShieldAlert size={24} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-heading font-bold mb-2">
              {tx({ fr: 'Le paiement ne peut pas se charger', en: 'Payment cannot load', es: 'El pago no puede cargarse' })}
            </h3>
            <p className="text-grey-muted text-sm mb-3">
              {tx({
                fr: 'Un bloqueur de publicites ou une extension de navigateur empeche le chargement du systeme de paiement securise (Stripe). Pour completer votre achat:',
                en: 'An ad blocker or browser extension is preventing the secure payment system (Stripe) from loading. To complete your purchase:',
                es: 'Un bloqueador de anuncios o extension del navegador impide que se cargue el sistema de pago seguro (Stripe). Para completar su compra:',
              })}
            </p>
            <ol className="text-grey-muted text-sm space-y-1.5 list-decimal list-inside">
              <li>{tx({ fr: 'Desactivez votre bloqueur de publicites pour massivemedias.com', en: 'Disable your ad blocker for massivemedias.com', es: 'Desactive su bloqueador de anuncios para massivemedias.com' })}</li>
              <li>{tx({ fr: 'Rechargez la page (Ctrl+R ou Cmd+R)', en: 'Reload the page (Ctrl+R or Cmd+R)', es: 'Recargue la pagina (Ctrl+R o Cmd+R)' })}</li>
            </ol>
            <p className="text-grey-muted text-xs mt-3">
              {tx({
                fr: 'Stripe est un systeme de paiement certifie PCI DSS utilise par des millions de commerces. Aucune donnee bancaire ne transite par nos serveurs.',
                en: 'Stripe is a PCI DSS certified payment system used by millions of businesses. No banking data passes through our servers.',
                es: 'Stripe es un sistema de pago certificado PCI DSS utilizado por millones de comercios. Ningun dato bancario pasa por nuestros servidores.',
              })}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-4 text-sm py-2.5 px-6"
            >
              {tx({ fr: 'Recharger la page', en: 'Reload page', es: 'Recargar pagina' })}
            </button>
          </div>
        </div>
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
        disabled={!stripe || isProcessing}
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
