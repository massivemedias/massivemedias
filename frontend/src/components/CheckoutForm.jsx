import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

function CheckoutForm({ cartTotal, checkoutData }) {
  const { t, tx } = useLang();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const res = await api.post('/orders/create-checkout-session', checkoutData);
      const url = res.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        setErrorMessage(tx({ fr: 'Impossible de creer la session de paiement.', en: 'Could not create payment session.', es: 'No se pudo crear la sesion de pago.' }));
        setIsProcessing(false);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || tx({ fr: 'Erreur lors de la creation du paiement.', en: 'Error creating payment.', es: 'Error al crear el pago.' }));
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-bold text-heading mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-accent" />
          {t('checkout.paymentInfo')}
        </h3>
        <div className="p-4 rounded-xl bg-glass">
          <p className="text-heading text-sm mb-2">
            {tx({ fr: 'Vous allez etre redirige vers la page de paiement securisee Stripe.', en: 'You will be redirected to the secure Stripe payment page.', es: 'Sera redirigido a la pagina de pago segura de Stripe.' })}
          </p>
          <p className="text-grey-muted text-xs">
            {tx({ fr: 'Carte bancaire, Apple Pay, Google Pay, Klarna', en: 'Credit card, Apple Pay, Google Pay, Klarna', es: 'Tarjeta, Apple Pay, Google Pay, Klarna' })}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30 error-bg">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="btn-primary w-full justify-center text-base py-3.5 disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 size={18} className="mr-2 animate-spin" />
            {tx({ fr: 'Redirection...', en: 'Redirecting...', es: 'Redirigiendo...' })}
          </>
        ) : (
          <>
            <CreditCard size={18} className="mr-2" />
            {t('checkout.payAmount').replace('{amount}', cartTotal)}
          </>
        )}
      </button>
    </div>
  );
}

export default CheckoutForm;
