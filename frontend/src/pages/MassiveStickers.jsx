import { useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import SEO from '../components/SEO'
import { useLang } from '../i18n/LanguageContext'
import { MASSIVE_STICKERS, MASSIVE_STICKER_CATEGORIES } from '../data/massiveStickers'
import { normalizeSearchText } from '../utils/clientAccountSearch'
import { thumb } from '../utils/paths'

/**
 * MassiveStickers (STICKERS-SHOP-A, 8 juillet 2026) - VITRINE de la
 * collection stickers Massive : 285 designs navigables par categorie, badge
 * "Nouveau", recherche par nom. AUCUN prix, AUCUN achat ce chantier-ci
 * (le commerce arrive au chantier 3B).
 *
 * Accessible uniquement si STICKERS_SHOP_ENABLED (config/stickersShopStatus)
 * est actif : la route et le lien header sont conditionnels au flag.
 *
 * Perf : 285 images -> la grille charge les thumbs 400px en lazy loading,
 * les 800px de /images/stickers-massive/ servent aux futures fiches produit.
 */

const STICKER_DIR = '/images/stickers-massive'

function MassiveStickers() {
  const { tx } = useLang()
  const [activeCat, setActiveCat] = useState('all')
  const [query, setQuery] = useState('')

  const visibles = useMemo(() => {
    const q = normalizeSearchText(query).trim()
    return MASSIVE_STICKERS.filter((s) => {
      if (activeCat !== 'all' && s.cat !== activeCat) return false
      if (q && !normalizeSearchText(s.nom).includes(q)) return false
      return true
    })
  }, [activeCat, query])

  const countByCat = useMemo(() => {
    const counts = { all: MASSIVE_STICKERS.length }
    for (const s of MASSIVE_STICKERS) counts[s.cat] = (counts[s.cat] || 0) + 1
    return counts
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <SEO
        title={tx({ fr: 'Collection Stickers - Massive', en: 'Sticker Collection - Massive', es: 'Coleccion de Stickers - Massive' })}
        description={tx({
          fr: 'La collection de stickers Massive : 285 designs originaux crees a Montreal. Skulls, animaux, aliens, manga, street art et plus.',
          en: 'The Massive sticker collection: 285 original designs made in Montreal. Skulls, animals, aliens, manga, street art and more.',
          es: 'La coleccion de stickers Massive: 285 disenos originales hechos en Montreal.',
        })}
      />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-heading mb-3">
            {tx({ fr: 'Collection Stickers', en: 'Sticker Collection', es: 'Coleccion de Stickers' })}
          </h1>
          <p className="text-grey-muted max-w-2xl mx-auto">
            {tx({
              fr: `${MASSIVE_STICKERS.length} designs originaux crees a Montreal. Vinyle die-cut, resistant eau et UV.`,
              en: `${MASSIVE_STICKERS.length} original designs made in Montreal. Die-cut vinyl, water and UV resistant.`,
              es: `${MASSIVE_STICKERS.length} disenos originales hechos en Montreal. Vinilo die-cut, resistente al agua y UV.`,
            })}
          </p>
        </div>

        {/* Recherche par nom */}
        <div className="max-w-md mx-auto mb-6 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tx({ fr: 'Chercher un sticker...', en: 'Search a sticker...', es: 'Buscar un sticker...' })}
            className="w-full rounded-full text-sm pl-9 pr-4 py-2.5 outline-none border border-white/10 bg-black/20 text-heading focus:border-accent transition-colors"
          />
        </div>

        {/* Chips categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setActiveCat('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCat === 'all' ? 'bg-accent text-white shadow-md' : 'bg-black/20 text-grey-muted hover:text-heading'
            }`}
          >
            {tx({ fr: 'Tout', en: 'All', es: 'Todo' })} ({countByCat.all})
          </button>
          {MASSIVE_STICKER_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCat(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCat === c.id ? 'bg-accent text-white shadow-md' : 'bg-black/20 text-grey-muted hover:text-heading'
              }`}
            >
              {tx(c)} ({countByCat[c.id] || 0})
            </button>
          ))}
        </div>

        {/* Grille */}
        {visibles.length === 0 ? (
          <p className="text-center text-grey-muted py-16">
            {tx({ fr: 'Aucun sticker ne correspond.', en: 'No sticker matches.', es: 'Ningun sticker coincide.' })}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {visibles.map((s) => (
              <div
                key={s.slug}
                className="relative rounded-xl bg-black/20 hover:bg-black/30 transition-colors p-3 flex flex-col items-center group"
              >
                {s.nouveau && (
                  <span className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wide">
                    <Sparkles size={9} />
                    {tx({ fr: 'Nouveau', en: 'New', es: 'Nuevo' })}
                  </span>
                )}
                <img
                  loading="lazy"
                  src={thumb(`${STICKER_DIR}/${s.slug}.webp`)}
                  alt={`Sticker ${s.nom} - collection Massive`}
                  className="w-full aspect-square object-contain group-hover:scale-105 transition-transform duration-200"
                />
                <p className="mt-2 text-xs text-grey-muted text-center truncate w-full" title={s.nom}>
                  {s.nom}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MassiveStickers
