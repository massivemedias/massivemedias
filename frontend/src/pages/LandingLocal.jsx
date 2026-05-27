/**
 * LandingLocal (8 mai 2026) - composant generique pour les landing pages
 * SEO local. Resolu via /:slug declare dans App.jsx, lit la data depuis
 * src/data/landingPages.js.
 *
 * Strategie SEO :
 *   - 1 H1 unique avec keyword principal
 *   - 3-5 H2 avec variantes long-tail
 *   - 800-1200 mots de contenu unique (anti-duplicate)
 *   - Schemas : LocalBusiness + Service + FAQ + BreadcrumbList (4 graphes)
 *   - Internal links vers /services/* + /contact pour distribuer le PageRank
 *   - Hero image avec alt riche en keyword
 *   - CTAs vers actions de conversion (devis, boutique)
 *
 * Pour ajouter une nouvelle landing :
 *   1. Ajouter une entree dans LANDING_PAGES (data/landingPages.js)
 *   2. Ajouter l'URL dans public/sitemap.xml
 *   C'est tout - la route est auto-routee via /:landingSlug.
 */
import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Phone, Mail, CheckCircle, Sparkles, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import SEO from '../components/SEO';
import {
  getLocalBusinessSchema,
  getServiceSchema,
  getFAQSchema,
} from '../components/seo/schemas';
import { useLang } from '../i18n/LanguageContext';
import { thumb } from '../utils/paths';
import { LANDING_PAGES } from '../data/landingPages';

const SITE_URL = 'https://massivemedias.com';

function LandingLocal() {
  // Les routes /imprimeur-mile-end, /stickers-personnalises-montreal, etc.
  // sont declarees explicitement dans App.jsx (pas de :param dynamique pour
  // eviter de capturer les 404). On extrait le slug depuis le pathname pour
  // resoudre la data dans LANDING_PAGES.
  const location = useLocation();
  const landingSlug = location.pathname.replace(/^\/+|\/+$/g, '');
  const { tx, lang } = useLang();
  const [openFaq, setOpenFaq] = useState(null);

  const page = LANDING_PAGES[landingSlug];
  if (!page) return <Navigate to="/" replace />;

  // FAQ schema (rich snippet sur SERP Google) - format question/answer requis.
  const faqSchema = page.faq && page.faq.length > 0
    ? getFAQSchema(page.faq.map(item => ({ q: item.q, a: item.a })))
    : null;

  // Service schema enrichi avec keywords + audience locale (boost SEO local).
  const serviceSchema = getServiceSchema({
    name: page.keyword,
    description: page.description,
    url: `/${landingSlug}`,
    serviceType: page.keyword,
    keywords: [page.keyword, page.geo, 'Massive Medias', 'imprimeur Montréal'],
    audience: 'Artistes, commerces, organisations - ' + page.geo,
    image: page.heroImage,
  });

  // Breadcrumb : Accueil > {keyword} pour signaler la hierarchie a Google.
  const breadcrumbs = [
    { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
    { name: page.keyword },
  ];

  return (
    <>
      <SEO
        title={page.title}
        description={page.description}
        ogImage={page.heroImage}
        breadcrumbs={breadcrumbs}
        jsonLd={[
          getLocalBusinessSchema(lang),
          serviceSchema,
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />

      {/* HERO */}
      <section className="relative min-h-[60vh] flex items-center pt-32 pb-16 overflow-hidden">
        {/* Background image floue + overlay sombre */}
        <div className="absolute inset-0 z-0">
          <img
            src={thumb(page.heroImage)}
            alt={`${page.keyword} - Massive Medias studio Plateau Mont-Royal Montréal`}
            className="w-full h-full object-cover opacity-30 blur-sm"
            loading="eager"
            fetchpriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge geo */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/30 mb-6">
              <MapPin size={14} className="text-accent" />
              <span className="text-accent text-xs font-bold uppercase tracking-wider">
                {page.geo}
              </span>
            </div>

            {/* H1 unique avec keyword principal - signal SEO le plus fort */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-heading mb-6 leading-tight">
              {page.h1}
            </h1>

            {/* Intro avec densité keyword naturelle */}
            <p className="text-lg sm:text-xl text-grey-light max-w-3xl mx-auto leading-relaxed mb-8">
              {page.intro}
            </p>

            {/* CTAs primaires */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/contact" className="btn-primary">
                {tx({ fr: 'Demander une soumission', en: 'Request a quote', es: 'Solicitar cotización' })}
                <ArrowRight size={18} className="ml-2" />
              </Link>
              <Link to="/boutique" className="btn-outline">
                {tx({ fr: 'Voir la boutique', en: 'View the shop', es: 'Ver la tienda' })}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTIONS H2 - contenu unique 800-1200 mots */}
      <section className="section-container">
        <div className="max-w-3xl mx-auto space-y-10 sm:space-y-14">
          {page.sections.map((section, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-heading mb-4">
                {section.h2}
              </h2>
              <p className="text-grey-light text-base sm:text-lg leading-relaxed">
                {section.body}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* SERVICES LIES - internal linking pour distribuer le PageRank */}
      {page.relatedServices && page.relatedServices.length > 0 && (
        <section className="section-container !py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-heading mb-6 text-center">
              {tx({
                fr: 'Services complémentaires',
                en: 'Complementary services',
                es: 'Servicios complementarios',
              })}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {page.relatedServices.map((svc) => (
                <Link
                  key={svc.slug}
                  to={`/services/${svc.slug}`}
                  className="p-4 rounded-xl bg-glass border border-white/5 hover:border-accent/40 hover:bg-glass/80 transition-all group"
                >
                  <CheckCircle size={16} className="text-accent mb-2" />
                  <p className="text-heading text-sm font-semibold leading-tight group-hover:text-accent transition-colors">
                    {svc.label}
                  </p>
                  <ArrowRight size={14} className="text-grey-muted mt-2 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ - rich snippet sur SERP via FAQPage schema */}
      {page.faq && page.faq.length > 0 && (
        <section className="section-container !py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-heading mb-8 text-center">
              {tx({ fr: 'Questions fréquentes', en: 'Frequently asked questions', es: 'Preguntas frecuentes' })}
            </h2>
            <div className="space-y-3">
              {page.faq.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className="rounded-xl bg-glass border border-white/5 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left hover:bg-white/5 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="text-heading text-sm sm:text-base font-semibold leading-snug">
                        {item.q}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-accent flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                        <p className="text-grey-light text-sm leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA FINAL - conversion vers contact */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-8 sm:p-12 text-center"
        >
          <Sparkles size={32} className="text-accent mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-heading mb-3">
            {tx({
              fr: 'Prêt à lancer ton projet ?',
              en: 'Ready to start your project?',
              es: '¿Listo para lanzar tu proyecto?',
            })}
          </h2>
          <p className="text-grey-light text-base sm:text-lg max-w-xl mx-auto mb-8">
            {tx({
              fr: 'Réponse en moins de 24h. Devis gratuit. Production locale au Plateau Mont-Royal, Montréal.',
              en: 'Response within 24h. Free quote. Local Plateau Mont-Royal production, Montreal.',
              es: 'Respuesta en menos de 24h. Cotización gratis. Producción local Plateau Mont-Royal, Montreal.',
            })}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/contact" className="btn-primary">
              <Mail size={16} className="mr-2" />
              {tx({ fr: 'Demander une soumission', en: 'Request a quote', es: 'Solicitar cotización' })}
            </Link>
            <a href="tel:+15146531423" className="btn-outline">
              <Phone size={16} className="mr-2" />
              514-653-1423
            </a>
          </div>
        </motion.div>
      </section>
    </>
  );
}

export default LandingLocal;
