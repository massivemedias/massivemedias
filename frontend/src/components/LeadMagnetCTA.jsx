/**
 * LeadMagnetCTA (8 mai 2026) - Bandeau d'inscription "lead magnet" sur la
 * page d'accueil.
 *
 * Objectif business : booster le taux de creation de compte (le checkout
 * invite cannibalise les inscriptions). On offre une valeur immediate
 * (10% de rabais) et on liste les avantages concrets du compte pour
 * convertir le visiteur des le scroll initial.
 *
 * Design : section contrastee (gradient sombre + accent rose Massive),
 * look premium, badge de promo visuel, 3 bullets icones, CTA primaire
 * unique. Responsive mobile-first.
 *
 * Le bouton CTA pointe vers /login?mode=register&welcome=1 :
 *   - mode=register : pre-selectionne le formulaire d'inscription
 *   - welcome=1     : declenche l'injection du code WELCOME10 dans le
 *                     panier au signup success (cf. Login.jsx).
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, Activity, Tag, ArrowRight } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

function LeadMagnetCTA() {
  const { tx } = useLang();
  const { user } = useAuth();

  // Pas de pitch d'inscription pour les users deja loggues - on cache la
  // section au lieu d'afficher un CTA inutile (et potentiellement vexant).
  if (user) return null;

  const benefits = [
    {
      icon: FileText,
      label: tx({
        fr: 'Sauvegarde de tes devis',
        en: 'Save your quotes',
        es: 'Guarda tus cotizaciones',
      }),
    },
    {
      icon: Activity,
      label: tx({
        fr: 'Suivi de production en temps réel',
        en: 'Real-time production tracking',
        es: 'Seguimiento de producción en tiempo real',
      }),
    },
    {
      icon: Tag,
      label: tx({
        fr: 'Rabais de volume exclusifs',
        en: 'Exclusive volume discounts',
        es: 'Descuentos de volumen exclusivos',
      }),
    },
  ];

  return (
    <section className="relative px-4 sm:px-6 py-12 sm:py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: '-80px' }}
        className="relative max-w-5xl mx-auto"
      >
        {/* Carte centrale : gradient sombre + accent rose Massive */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl bg-gradient-to-br from-black via-[#0a0a14] to-black">
          {/* Halo gradient accent en arriere-plan (decoratif) */}
          <div
            aria-hidden
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-accent, #F00098) 0%, transparent 70%)' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-accent, #F00098) 0%, transparent 70%)' }}
          />

          {/* Contenu */}
          <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 md:px-16 md:py-16">
            {/* Badge promo */}
            <div className="flex justify-center mb-5">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/40 backdrop-blur-sm">
                <Sparkles size={14} className="text-accent" />
                <span className="text-accent text-xs font-bold uppercase tracking-[0.18em]">
                  {tx({ fr: 'Offre de bienvenue', en: 'Welcome offer', es: 'Oferta de bienvenida' })}
                </span>
              </span>
            </div>

            {/* Titre */}
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-4 leading-tight">
              {tx({
                fr: 'Débloque l\'expérience Studio.',
                en: 'Unlock the Studio experience.',
                es: 'Desbloquea la experiencia Studio.',
              })}
            </h2>

            {/* Sous-titre - structure : <prefix> <accent-highlight> <suffix>
                pour pouvoir styler "10%" sans casser le i18n (tx ne sait gerer
                que des strings). */}
            <p className="text-center text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8 sm:mb-10">
              {tx({
                fr: 'Crée ton compte gratuit aujourd\'hui et obtiens ',
                en: 'Create your free account today and get ',
                es: 'Crea tu cuenta gratuita hoy y obtén ',
              })}
              <span className="text-accent font-bold">
                {tx({ fr: '10% de rabais', en: '10% off', es: '10% de descuento' })}
              </span>
              {tx({
                fr: ' sur ta première commande d\'impression.',
                en: ' on your first printing order.',
                es: ' en tu primer pedido de impresión.',
              })}
            </p>

            {/* Bullets avantages */}
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10 max-w-3xl mx-auto">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                  >
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                      <Icon size={16} className="text-accent" />
                    </span>
                    <span className="text-sm text-white/90 font-medium leading-tight">
                      {b.label}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            {/* CTA primaire */}
            <div className="flex flex-col items-center gap-3">
              <Link
                to="/login?mode=register&welcome=1"
                className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-accent text-white text-sm sm:text-base font-bold uppercase tracking-wider shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-[1.02] active:scale-[0.99] transition-all"
              >
                {tx({
                  fr: 'Créer mon compte (10% offerts)',
                  en: 'Create my account (10% off)',
                  es: 'Crear mi cuenta (10% gratis)',
                })}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="text-xs text-white/40">
                {tx({
                  fr: 'Aucune carte requise. Compte gratuit, code appliqué automatiquement.',
                  en: 'No card required. Free account, code auto-applied.',
                  es: 'Sin tarjeta. Cuenta gratuita, código aplicado automáticamente.',
                })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default LeadMagnetCTA;
