import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

function CheckoutCancel() {
  const { t } = useLang();

  return (
    <>
      <Helmet>
        <title>{t('checkout.cancelTitle')} - Massive Medias</title>
      </Helmet>

      <section className="section-container pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center"
        >
          <XCircle size={64} className="text-grey-muted mx-auto mb-6" />
          <h1 className="text-4xl font-heading font-bold text-heading mb-4">{t('checkout.cancelTitle')}</h1>
          <p className="text-grey-light text-lg mb-8">{t('checkout.cancelMessage')}</p>
          <Link to="/panier" className="btn-primary">{t('checkout.backToCart')}</Link>
        </motion.div>
      </section>
    </>
  );
}

export default CheckoutCancel;
