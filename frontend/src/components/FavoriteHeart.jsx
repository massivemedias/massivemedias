import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useFavorites } from '../contexts/FavoritesContext'
import { useLang } from '../i18n/LanguageContext'

/**
 * STICKERS-FAV : coeur favori reutilisable (grille + fiche produit).
 * Toggle en localStorage (via FavoritesContext), AUCUN ajout panier.
 * Repos = contour blanc discret sur pastille sombre ; favori = rose plein.
 * Micro "pop" uniquement quand on AJOUTE (pas au montage d'un deja-favori).
 */
export default function FavoriteHeart({ slug, className = '', size = 16 }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { tx } = useLang()
  const [pop, setPop] = useState(false)
  const faved = isFavorite(slug)

  const onClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (!faved) { setPop(true); setTimeout(() => setPop(false), 320) }
    toggleFavorite(slug)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={faved}
      aria-label={faved
        ? tx({ fr: 'Retirer des favoris', en: 'Remove from favorites', es: 'Quitar de favoritos' })
        : tx({ fr: 'Ajouter aux favoris', en: 'Add to favorites', es: 'Agregar a favoritos' })}
      className={`fav-heart ${pop ? 'fav-heart-pop' : ''} grid place-items-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors ${className}`}
    >
      <Heart
        size={size}
        className={faved ? 'text-accent' : 'text-white/85'}
        fill={faved ? 'currentColor' : 'none'}
        strokeWidth={faved ? 0 : 2}
      />
    </button>
  )
}
