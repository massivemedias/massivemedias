import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Heart, X } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useLang } from '../i18n/LanguageContext'
import api from '../services/api'

/**
 * STICKERS-FAV : favoris de la collection stickers.
 *
 * ANONYME D'ABORD : les favoris vivent en localStorage (`massive-favorites`),
 * exactement comme le panier (`massive-cart`) - zero compte requis, persistant.
 * Voir la lecon BUG-CRITICAL-FIX dans CartContext : JAMAIS de donnees dans le
 * JWT/user_metadata Supabase. Le sync connecte passe par une table Strapi.
 *
 * CONNECTE : au login, merge union(local, serveur) -> serveur devient la source
 * (champ JSON `favoris` du content-type client, via /clients/me/favoris garde).
 * Les ecritures suivantes sont debouncees (jamais 1 requete par toggle).
 *
 * INVITATION DOUCE : pas de mur de login. Le coeur marche tout de suite pour
 * l'anonyme ; au 2e favori, un toast discret invite (UNE fois) a creer un compte.
 */
const FavoritesContext = createContext()

const LS_KEY = 'massive-favorites'
const INVITE_KEY = 'massive-fav-invite-seen'
const INVITE_AT = 2 // le 2e favori declenche l'invitation
const SYNC_DEBOUNCE = 800

function loadFavs() {
  try {
    const s = localStorage.getItem(LS_KEY)
    const a = s ? JSON.parse(s) : []
    return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}
function saveFavs(a) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(a)) } catch {}
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState(loadFavs)
  const [inviteOpen, setInviteOpen] = useState(false)
  const mergedRef = useRef(false) // le merge au login a-t-il deja eu lieu cette session ?
  const debounceRef = useRef(0)

  // Persistance locale a chaque changement (source de verite pour l'anonyme).
  useEffect(() => { saveFavs(favorites) }, [favorites])

  // Push serveur debounce (connectes seulement).
  const pushToServer = useCallback((favs) => {
    if (!user) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      api.put('/clients/me/favoris', { favoris: favs }).catch(() => {})
    }, SYNC_DEBOUNCE)
  }, [user])

  // Merge au login : union(local, serveur) -> serveur devient la source.
  useEffect(() => {
    if (!user) { mergedRef.current = false; return }
    if (mergedRef.current) return
    mergedRef.current = true
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/clients/me/favoris')
        const server = Array.isArray(data?.favoris) ? data.favoris : []
        const local = loadFavs()
        const union = [...new Set([...server, ...local])]
        if (cancelled) return
        setFavorites(union)
        // Ecrire l'union cote serveur si le local a apporte quelque chose.
        if (union.length !== server.length) {
          api.put('/clients/me/favoris', { favoris: union }).catch(() => {})
        }
      } catch {
        // Hors-ligne / erreur : on garde le local, re-sync a la prochaine action.
      }
    })()
    return () => { cancelled = true }
  }, [user])

  const isFavorite = useCallback((slug) => favorites.includes(slug), [favorites])

  // Toggle = updater PUR : aucun effet de bord dedans (StrictMode double-invoque
  // les updaters -> les effets doivent vivre ailleurs). Les effets (push serveur,
  // invitation) sont declenches par le changement de `favorites` ci-dessous.
  const toggleFavorite = useCallback((slug) => {
    if (!slug) return
    setFavorites((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))
  }, [])

  // Effets de bord des favoris : push serveur (debounce) + invitation douce au
  // passage a INVITE_AT favoris (anonyme, jamais vue). Ignore le tout premier
  // render (chargement initial depuis localStorage / avant merge login).
  const firstRun = useRef(true)
  const prevLen = useRef(favorites.length)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; prevLen.current = favorites.length; return }
    pushToServer(favorites)
    const crossedUp = prevLen.current < INVITE_AT && favorites.length >= INVITE_AT
    prevLen.current = favorites.length
    if (crossedUp && !user) {
      try {
        if (!localStorage.getItem(INVITE_KEY)) {
          localStorage.setItem(INVITE_KEY, '1')
          setInviteOpen(true)
        }
      } catch {}
    }
  }, [favorites, user, pushToServer])

  const dismissInvite = useCallback(() => setInviteOpen(false), [])

  const value = useMemo(() => ({
    favorites,
    favCount: favorites.length,
    isFavorite,
    toggleFavorite,
    inviteOpen,
    dismissInvite,
  }), [favorites, isFavorite, toggleFavorite, inviteOpen, dismissInvite])

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
