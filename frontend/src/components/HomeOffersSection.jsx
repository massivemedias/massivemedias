import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, PartyPopper, Rocket, Shirt, ArrowRight, Tag } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

/**
 * HOME-02 section d : OFFRES & PACKAGES.
 *
 * Arbitrage HOME-02 : l'offre de bienvenue (ex-LeadMagnetCTA) est INTEGREE
 * ici comme PREMIERE carte de la rangee (c'est un rabais d'acquisition, sa
 * place naturelle est avec les packages), au lieu d'etre une section a part.
 * Deplacement, pas suppression : le CTA welcome=1 (code WELCOME10) est
 * conserve tel quel. La carte disparait si l'utilisateur est deja connecte.
 *
 * PRIX DES PACKAGES : volontairement VIDES pour l'instant. Mika remplira les
 * montants et l'economie ici meme (constante PACKAGES ci-dessous), un par un.
 * Tant que `price` est vide, la carte affiche "Sur devis" + CTA /contact.
 * Aucune valeur inventee (regle dual-source, prod Stripe LIVE).
 */

// Prix verifies contre Tarifs.pdf. `savings` = montant de l'economie SEUL (le
// verbe "Economise / Save / Ahorra" est ajoute selon la langue par
// PackageCard). Un `price` vide affiche "Sur devis".
const PACKAGES = [
  {
    id: 'festival',
    icon: PartyPopper,
    price: '900 $',
    savings: '245 $',
    link: '/contact',
    fr: 'Festival', en: 'Festival', es: 'Festival',
    dFr: 'Affiches line-up, flyers et stickers, prêts pour la scène.',
    dEn: 'Line-up posters, flyers and stickers, stage-ready.',
    dEs: 'Carteles line-up, flyers y stickers, listos para el escenario.',
  },
  {
    id: 'artist-launch',
    icon: Rocket,
    price: '2 800 $',
    savings: '490 $',
    link: '/contact',
    fr: 'Lancement artiste', en: 'Artist launch', es: 'Lanzamiento de artista',
    dFr: 'Pochette, prints et visuels pour ta sortie.',
    dEn: 'Cover art, prints and visuals for your release.',
    dEs: 'Portada, prints y visuales para tu lanzamiento.',
  },
  {
    id: 'label-merch',
    icon: Shirt,
    price: '1 400 $',
    savings: '285 $',
    link: '/contact',
    fr: 'Merchandising label', en: 'Label merchandising', es: 'Merchandising de sello',
    dFr: 'Merch et goodies aux couleurs de ton label.',
    dEn: 'Merch and goodies in your label’s colors.',
    dEs: 'Merch y goodies con los colores de tu sello.',
  },
]

// Carte de l'offre de bienvenue (1re carte, arbitrage HOME-02). Distincte des
// packages par son halo accent (FIX-COULEURS : plus aucune bordure rose au repos).
//
// HOME-BG (14 juillet 2026) : c'etait LA carte "degrade mauve tres fonce" du
// constat client. Son fond etait code EN DUR (linear-gradient #3D0079 ->
// #2a0a4a), donc il ne suivait AUCUN theme : boite mauve sombre sur les
// palettes sombres, et carrement une boite sombre posee sur du blanc sur les 2
// themes clairs (piege UI-10c). Elle prend maintenant .surface-vitrine, le meme
// voile que toutes les cartes du site, et ses textes passent aux jetons de
// theme. Le halo accent est thematise via --accent-rgb.
function WelcomeCard({ tx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="surface-vitrine card-shadow flex flex-col h-full rounded-2xl p-6 border border-white/5 relative overflow-hidden"
    >
      {/* CHANTIER FOND PROPRE : halo accent flou (blur-3xl) retire -> carte nette,
          coherente avec le hero simplifie. La surface-vitrine porte deja son
          propre fond de theme. */}
      <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent text-[11px] font-bold uppercase tracking-wider w-fit mb-3">
        <Sparkles size={12} />
        {tx({ fr: 'Offre de bienvenue', en: 'Welcome offer', es: 'Oferta de bienvenida' })}
      </span>
      <h3 className="relative font-heading font-bold text-xl text-heading mb-1.5">
        {tx({ fr: '10% sur ta 1re commande', en: '10% off your 1st order', es: '10% en tu 1er pedido' })}
      </h3>
      <p className="relative text-sm flex-1 text-grey-light">
        {tx({
          fr: 'Crée ton compte gratuit : code appliqué automatiquement, suivi de production et rabais de volume.',
          en: 'Create your free account: code auto-applied, production tracking and volume discounts.',
          es: 'Crea tu cuenta gratuita: codigo aplicado automaticamente, seguimiento y descuentos por volumen.',
        })}
      </p>
      <Link
        to="/login?mode=register&welcome=1"
        className="relative inline-flex items-center justify-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-accent text-white text-sm font-bold hover:brightness-110 transition-all"
      >
        {tx({ fr: 'Créer mon compte', en: 'Create my account', es: 'Crear mi cuenta' })}
        <ArrowRight size={16} />
      </Link>
    </motion.div>
  )
}

function PackageCard({ pkg, tx, index }) {
  const Icon = pkg.icon
  const hasPrice = Boolean(pkg.price)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index + 1) * 0.07 }}
      viewport={{ once: true }}
      className="flex flex-col h-full rounded-2xl p-6 bg-glass card-shadow border border-white/5 hover:border-accent/40 transition-all"
    >
      <div className="mb-4 p-2.5 rounded-lg w-fit icon-bg">
        <Icon size={22} className="text-accent" />
      </div>
      <h3 className="font-heading font-bold text-lg text-heading mb-1.5">
        {tx({ fr: pkg.fr, en: pkg.en, es: pkg.es })}
      </h3>
      <p className="text-sm text-grey-light flex-1">
        {tx({ fr: pkg.dFr, en: pkg.dEn, es: pkg.dEs })}
      </p>
      {/* Prix (dual-source, rempli par Mika). Vide -> "Sur devis". */}
      <div className="mt-4 mb-4">
        {hasPrice ? (
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-2xl text-accent">{pkg.price}</span>
            {pkg.savings && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400">
                <Tag size={12} />
                {tx({ fr: 'Économise', en: 'Save', es: 'Ahorra' })} {pkg.savings}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm font-semibold text-grey-light">
            {tx({ fr: 'Sur devis', en: 'On quote', es: 'Bajo cotizacion' })}
          </span>
        )}
      </div>
      <Link
        to={pkg.link}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-accent/50 text-heading text-sm font-semibold hover:bg-accent/10 transition-all"
      >
        {hasPrice
          ? tx({ fr: 'Commander', en: 'Order', es: 'Ordenar' })
          : tx({ fr: 'Demander un devis', en: 'Request a quote', es: 'Pedir cotizacion' })}
        <ArrowRight size={15} />
      </Link>
    </motion.div>
  )
}

export default function HomeOffersSection({ welcomeOnly = false }) {
  const { tx } = useLang()
  const { user } = useAuth()

  // HOME-04 : mode "offre de bienvenue seule" - packages retires (choix Mika),
  // on garde la carte offre de bienvenue (ex-LeadMagnetCTA) centree, sans le
  // titre "Offres & Packages" qui n'a plus de sens sans les forfaits. Rien pour
  // les connectes (deja inscrits).
  if (welcomeOnly) {
    if (user) return null
    return (
      <section className="section-container">
        <div className="max-w-md mx-auto">
          <WelcomeCard tx={tx} />
        </div>
      </section>
    )
  }

  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-3 hero-title">
          {tx({ fr: 'Offres & Packages', en: 'Offers & Packages', es: 'Ofertas y Packages' })}
        </h2>
        <p className="text-xl text-grey-light max-w-2xl mx-auto">
          {tx({
            fr: 'Des forfaits pensés pour les artistes, labels et événements.',
            en: 'Bundles built for artists, labels and events.',
            es: 'Paquetes pensados para artistas, sellos y eventos.',
          })}
        </p>
      </motion.div>

      {/* Arbitrage HOME-02 : offre de bienvenue en 1re carte, puis les packages. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {!user && <WelcomeCard tx={tx} />}
        {PACKAGES.map((pkg, i) => (
          <PackageCard key={pkg.id} pkg={pkg} tx={tx} index={i} />
        ))}
      </div>
    </section>
  )
}
