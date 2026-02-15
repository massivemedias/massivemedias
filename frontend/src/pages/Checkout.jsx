import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';

function Checkout() {
  const { t } = useLang();
  const { items, cartTotal } = useCart();

  if (items.length === 0) {
    return (
      <section className="section-container pt-32 pb-20 text-center">
        <h1 className="text-3xl font-heading font-bold text-heading mb-4">{t('checkout.title')}</h1>
        <p className="text-grey-muted mb-6">{t('checkout.emptyCart')}</p>
        <Link to="/boutique" className="btn-primary">{t('checkout.continueShopping')}</Link>
      </section>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('checkout.title')} - Massive Medias</title>
      </Helmet>

      <section className="section-container pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/panier" className="inline-flex items-center gap-2 text-grey-muted hover:text-magenta transition-colors mb-6 text-sm">
              <ArrowLeft size={16} />
              {t('checkout.backToCart')}
            </Link>

            <h1 className="text-4xl font-heading font-bold text-heading mb-8">{t('checkout.title')}</h1>

            {/* Placeholder - will be expanded in Phase 3 with multi-step form + Stripe */}
            <div className="rounded-2xl border border-purple-main/30 p-8 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}>
              <p className="text-grey-light text-lg mb-4">{t('checkout.comingSoon')}</p>
              <p className="text-grey-muted">{t('checkout.comingSoonSub')}</p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Checkout;
