import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Scissors, Frame, Shirt, Coffee, ShoppingBag } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';

const merchMassiveItems = [
  { fr: 'Stickers Massive', en: 'Massive Stickers', icon: Scissors },
  { fr: 'Prints Massive', en: 'Massive Prints', icon: Frame },
  { fr: 'T-Shirts', en: 'T-Shirts', icon: Shirt },
  { fr: 'Hoodies', en: 'Hoodies', icon: Shirt },
  { fr: 'Mugs', en: 'Mugs', icon: Coffee },
  { fr: 'Tote Bags', en: 'Tote Bags', icon: ShoppingBag },
];

function Boutique() {
  const { lang } = useLang();

  return (
    <>
      <SEO
        title={lang === 'fr' ? 'Boutique | Massive Medias' : 'Shop | Massive Medias'}
        description={lang === 'fr'
          ? 'Boutique Massive Medias. Merch officiel - stickers, prints, t-shirts, hoodies, mugs. Bientot disponible.'
          : 'Massive Medias Shop. Official merch - stickers, prints, t-shirts, hoodies, mugs. Coming soon.'}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Boutique' : 'Shop' },
        ]}
      />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
              {lang === 'fr' ? 'Boutique' : 'Shop'}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-3xl mx-auto">
              {lang === 'fr'
                ? 'Merch officiel Massive Medias. Notre collection arrive bientot.'
                : 'Official Massive Medias merch. Our collection is coming soon.'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-7xl mx-auto">

        {/* ── Merch Massive (Coming Soon) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gradient mb-3">
              Merch Massive
            </h2>
            <p className="text-grey-muted max-w-2xl mx-auto">
              {lang === 'fr'
                ? 'Notre collection de produits arrive bientot.'
                : 'Our product collection coming soon.'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {merchMassiveItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="relative rounded-2xl overflow-hidden card-bg-bordered opacity-50 cursor-default"
                >
                  <div className="aspect-[16/10] bg-glass flex items-center justify-center">
                    <Icon size={48} className="text-grey-muted/40" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-glass backdrop-blur-sm text-grey-muted text-xs font-semibold uppercase tracking-wider border border-white/10 flex items-center gap-1.5">
                      <Lock size={12} />
                      {lang === 'fr' ? 'Bientot' : 'Coming Soon'}
                    </span>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-sm font-heading font-bold text-grey-muted">
                      {lang === 'fr' ? item.fr : item.en}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA - Services custom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl mb-8 cta-text-bordered"
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Besoin d\'impression custom?' : 'Need custom printing?'}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'Stickers, prints fine art, sublimation, design graphique - consultez nos services.'
              : 'Stickers, fine art prints, sublimation, graphic design - check out our services.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/services" className="btn-primary">
              {lang === 'fr' ? 'Voir nos services' : 'See our services'}
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default Boutique;
