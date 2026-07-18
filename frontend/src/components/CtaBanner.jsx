import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'

/**
 * Bandeau CTA pleine largeur : gradient de l'ACCENT DU THEME (via --accent-rgb,
 * jamais de rose/mauve code en dur -> tient sur les 11 palettes), titre blanc,
 * pill blanc a droite. Reutilise a l'identique sur /artistes ("Imprime tes
 * oeuvres" -> /services/prints) et /stickers ("Imprime tes stickers" ->
 * /services/stickers). Extrait du bloc inline d'origine (Artistes.jsx) pour
 * garantir un rendu STRICTEMENT identique des deux cotes.
 *
 * Le composant ne rend QUE la bande (pas de conteneur) : chaque page la place
 * dans son propre conteneur (section-container sur /artistes, max-w-7xl sur
 * /stickers), pour rester aligne sur le contenu voisin. Passer la marge via
 * `className`.
 *
 * title / subtitle / cta = objets {fr,en,es} (traduits ici). to = URL interne.
 */
export default function CtaBanner({ title, subtitle, cta, to, className = '' }) {
  const { tx } = useLang()
  return (
    <div
      className={`rounded-2xl px-6 py-5 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
      style={{
        background: 'linear-gradient(120deg, rgba(var(--accent-rgb),1), rgba(var(--accent-rgb),0.62))',
        boxShadow: '0 14px 36px rgba(var(--accent-rgb),0.28)',
      }}
    >
      <div>
        <p className="text-white font-heading font-bold text-xl leading-tight">{tx(title)}</p>
        {subtitle && <p className="text-white/90 text-sm mt-1">{tx(subtitle)}</p>}
      </div>
      <Link
        to={to}
        className="shrink-0 inline-flex items-center gap-2 bg-white text-accent font-bold text-sm px-5 py-2.5 rounded-full hover:brightness-95 transition-all whitespace-nowrap"
      >
        {tx(cta)}
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
