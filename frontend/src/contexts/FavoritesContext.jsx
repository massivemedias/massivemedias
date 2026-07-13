import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Heart, X } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useCart } from './CartContext'
import { useLang } from '../i18n/LanguageContext'
import api from '../services/api'

/**
 * FAVORIS : deux espaces separes - stickers (collection) et prints (oeuvres
 * d'artistes). Catalogues et identifiants differents, donc DEUX listes.
 *
 * ANONYME D'ABORD : chaque liste vit en localStorage (`massive-favorites` pour
 * les stickers - cle historique #95 inchangee ; `massive-favorites-prints` pour
 * les prints), comme le panier (`massive-cart`) - zero compte requis, persistant.
 * Voir la lecon BUG-CRITICAL-FIX dans CartContext : JAMAIS de donnees dans le
 * JWT/user_metadata Supabase. Le sync connecte passe par une table Strapi.
 *
 * CONNECTE : au login, merge union(local, serveur) sur les DEUX listes -> serveur
 * devient la source (champ JSON `favoris` = { stickers, prints } du content-type
 * client, via /clients/me/favoris garde). Migration douce cote backend : un ancien
 * tableau plat devient la liste stickers, aucun favori perdu. Les ecritures
 * suivantes sont debouncees (jamais 1 requete par toggle).
 *
 * INVITATION DOUCE : pas de mur de login. Le coeur marche tout de suite pour
 * l'anonyme ; au 2e favori (stickers + prints confondus), un toast discret
 * invite (UNE fois) a creer un compte.
 *
 * API : l'API stickers historique (`favorites`, `favCount`, `isFavorite`,
 * `toggleFavorite`) est INCHANGEE (retro-compat des consommateurs #95). Les
 * prints ajoutent `favoritesPrints`, `favPrintCount`, `isFavoritePrint`,
 * `toggleFavoritePrint`. Le PONT PANIER reste STICKERS SEULEMENT (les prints ont
 * leur propre parcours configurateur) - aucune liste prints branchee au panier.
 */
const FavoritesContext = createContext()

const LS_STICKERS = 'massive-favorites'
const LS_PRINTS = 'massive-favorites-prints'
const INVITE_KEY = 'massive-fav-invite-seen'
const INVITE_AT = 2 // le 2e favori (toutes listes) declenche l'invitation
const SYNC_DEBOUNCE = 800

function loadList(key) {
  try {
    const s = localStorage.getItem(key)
    const a = s ? JSON.parse(s) : []
    return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}
function saveList(key, a) {
  try { localStorage.setItem(key, JSON.stringify(a)) } catch {}
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const { isCartDrawerOpen } = useCart()
  const [stickers, setStickers] = useState(() => loadList(LS_STICKERS))
  const [prints, setPrints] = useState(() => loadList(LS_PRINTS))
  const [inviteOpen, setInviteOpen] = useState(false)
  const [favDrawerOpen, setFavDrawerOpen] = useState(false)
  const mergedRef = useRef(false) // le merge au login a-t-il deja eu lieu cette session ?
  const debounceRef = useRef(0)

  // FAV-04 : tiroir lateral des favoris (pattern CART-01). Un SEUL panneau a la
  // fois, PRIORITE PANIER : le tiroir favoris ne s'ouvre jamais par-dessus le
  // tiroir panier, et se ferme si le panier s'ouvre. (CartProvider enveloppe
  // FavoritesProvider dans main.jsx -> useCart dispo ici.)
  const openFavDrawer = useCallback(() => {
    if (isCartDrawerOpen) return
    setFavDrawerOpen(true)
  }, [isCartDrawerOpen])
  const closeFavDrawer = useCallback(() => setFavDrawerOpen(false), [])
  useEffect(() => { if (isCartDrawerOpen) setFavDrawerOpen(false) }, [isCartDrawerOpen])

  // Persistance locale a chaque changement (source de verite pour l'anonyme).
  useEffect(() => { saveList(LS_STICKERS, stickers) }, [stickers])
  useEffect(() => { saveList(LS_PRINTS, prints) }, [prints])

  // Push serveur debounce (connectes seulement) : les DEUX listes ensemble.
  const pushToServer = useCallback((s, p) => {
    if (!user) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      api.put('/clients/me/favoris', { favoris: { stickers: s, prints: p } }).catch(() => {})
    }, SYNC_DEBOUNCE)
  }, [user])

  // Merge au login : union(local, serveur) sur les DEUX listes -> serveur = source.
  useEffect(() => {
    if (!user) { mergedRef.current = false; return }
    if (mergedRef.current) return
    mergedRef.current = true
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/clients/me/favoris')
        const raw = data?.favoris
        // Le backend renvoie deja { stickers, prints } (migre a la lecture) ; on
        // tolere l'ancien tableau plat par prudence (=> tout en stickers).
        const srvStickers = Array.isArray(raw) ? raw : (Array.isArray(raw?.stickers) ? raw.stickers : [])
        const srvPrints = Array.isArray(raw?.prints) ? raw.prints : []
        const uS = [...new Set([...srvStickers, ...loadList(LS_STICKERS)])]
        const uP = [...new Set([...srvPrints, ...loadList(LS_PRINTS)])]
        if (cancelled) return
        setStickers(uS)
        setPrints(uP)
        // Ecrire l'union cote serveur si le local a apporte quelque chose.
        if (uS.length !== srvStickers.length || uP.length !== srvPrints.length) {
          api.put('/clients/me/favoris', { favoris: { stickers: uS, prints: uP } }).catch(() => {})
        }
      } catch {
        // Hors-ligne / erreur : on garde le local, re-sync a la prochaine action.
      }
    })()
    return () => { cancelled = true }
  }, [user])

  // Toggles = updaters PURS : aucun effet de bord dedans (StrictMode double-invoque
  // les updaters -> les effets doivent vivre ailleurs). Les effets (push serveur,
  // invitation) sont declenches par le changement des listes ci-dessous.
  const isFavorite = useCallback((slug) => stickers.includes(slug), [stickers])
  const toggleFavorite = useCallback((slug) => {
    if (!slug) return
    setStickers((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))
  }, [])
  const isFavoritePrint = useCallback((id) => prints.includes(id), [prints])
  const toggleFavoritePrint = useCallback((id) => {
    if (!id) return
    setPrints((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }, [])

  // Effets de bord des favoris : push serveur (debounce) + invitation douce au
  // passage a INVITE_AT favoris TOTAUX (stickers + prints), anonyme, jamais vue.
  // Ignore le tout premier render (chargement initial localStorage / avant merge).
  const firstRun = useRef(true)
  const prevTotal = useRef(stickers.length + prints.length)
  useEffect(() => {
    const total = stickers.length + prints.length
    if (firstRun.current) { firstRun.current = false; prevTotal.current = total; return }
    pushToServer(stickers, prints)
    const crossedUp = prevTotal.current < INVITE_AT && total >= INVITE_AT
    prevTotal.current = total
    if (crossedUp && !user) {
      try {
        if (!localStorage.getItem(INVITE_KEY)) {
          localStorage.setItem(INVITE_KEY, '1')
          setInviteOpen(true)
        }
      } catch {}
    }
  }, [stickers, prints, user, pushToServer])

  const dismissInvite = useCallback(() => setInviteOpen(false), [])

  const value = useMemo(() => ({
    // Stickers (API historique #95, inchangee pour les consommateurs existants).
    favorites: stickers,
    favCount: stickers.length,
    isFavorite,
    toggleFavorite,
    // Prints (FAV-02) - espace separe.
    favoritesPrints: prints,
    favPrintCount: prints.length,
    isFavoritePrint,
    toggleFavoritePrint,
    inviteOpen,
    dismissInvite,
    // Tiroir lateral (FAV-04).
    favDrawerOpen,
    openFavDrawer,
    closeFavDrawer,
  }), [stickers, prints, isFavorite, toggleFavorite, isFavoritePrint, toggleFavoritePrint, inviteOpen, dismissInvite, favDrawerOpen, openFavDrawer, closeFavDrawer])

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <FavoriteInviteToast />
    </FavoritesContext.Provider>
  )
}

// Toast d'invitation discret (bas de l'ecran), fermable, montre une seule fois.
function FavoriteInviteToast() {
  const { inviteOpen, dismissInvite } = useContext(FavoritesContext)
  const { tx } = useLang()
  if (!inviteOpen) return null
  return (
    <div
      role="status"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[60] sm:max-w-sm rounded-2xl border border-accent/30 bg-surface/95 backdrop-blur shadow-2xl p-4 flex items-start gap-3"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.35)' }}
    >
      <span className="mt-0.5 shrink-0 inline-grid place-items-center w-8 h-8 rounded-full bg-accent/15 text-accent">
        <Heart size={16} fill="currentColor" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-heading font-medium leading-snug">
          {tx({
            fr: 'Cree un compte pour retrouver tes favoris partout.',
            en: 'Create an account to keep your favorites everywhere.',
            es: 'Crea una cuenta para conservar tus favoritos en todas partes.',
          })}
        </p>
        {/* <a> et non <Link> : ce toast est rendu par le FavoritesProvider, monte
            HORS du Router (dans main.jsx). Une nav pleine vers /login est OK pour
            un CTA login. */}
        <a
          href="/login"
          onClick={dismissInvite}
          className="inline-block mt-2 text-sm font-semibold text-accent hover:brightness-110"
        >
          {tx({ fr: 'Creer un compte', en: 'Create an account', es: 'Crear una cuenta' })} &rarr;
        </a>
      </div>
      <button
        type="button"
        onClick={dismissInvite}
        aria-label={tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
        className="shrink-0 p-1 rounded-full text-grey-muted hover:text-heading hover:bg-white/10 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
