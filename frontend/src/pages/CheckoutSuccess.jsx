import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';

function CheckoutSuccess() {
  const { t, lang } = useLang();
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');
  const isFr = lang === 'fr';

  // Clear cart on successful payment
  useEffect(() => {
    clearCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SEO title={`${t('checkout.successTitle')} - Massive Medias`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center"
        >
          <CheckCircle size={64} className="text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl font-heading font-bold text-heading mb-4">{t('checkout.successTitle')}</h1>
          <p className="text-grey-light text-lg mb-4">{t('checkout.successMessage')}</p>

          {paymentIntent && (
            <p className="text-grey-muted text-sm mb-8">
              {isFr ? 'Référence' : 'Reference'}: <span className="font-mono text-heading">{paymentIntent.slice(-8)}</span>
            </p>
          )}

          <div className="flex gap-4 justify-center">
            <Link to="/boutique" className="btn-primary">{t('checkout.continueShopping')}</Link>
            <Link to="/account" className="px-6 py-3 rounded-lg border border-purple-main/30 text-heading hover:border-magenta/50 transition-colors">
              {t('account.orders')}
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}

export default CheckoutSuccess;
