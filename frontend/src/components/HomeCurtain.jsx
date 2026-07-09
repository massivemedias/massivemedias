import { useEffect, useRef } from 'react'

/**
 * HOME-02 (9 juillet 2026) : effet "rideau de magasin" de la page d'accueil.
 *
 * A l'arrivee, le hero MASSIVE plein ecran occupe le premier viewport (comme
 * avant). Apres un court instant OU des le premier geste de l'utilisateur (le
 * premier des deux), tout l'etage (hero + contenu) se SOULEVE vers le haut
 * comme un rideau de commerce, revelant la vitrine de vente en dessous.
 *
 * Regles UX (non negociables) :
 *  - Joue UNE fois par session (sessionStorage). Aux visites suivantes de la
 *    session, page normale, aucun rideau.
 *  - Jamais de scroll-hijacking continu : le verrou ne dure que l'animation.
 *    Apres, scroll 100 % natif.
 *  - Un geste utilisateur pendant l'attente LANCE le rideau (l'accelere), un
 *    geste pendant l'animation la TERMINE net. Jamais bloquant.
 *  - prefers-reduced-motion : aucune animation, page normale immediate.
 *
 * SEO / prerender : le contenu sous le rideau est TOUJOURS dans le DOM (rendu
 * normal). Le verrou et le transform sont poses en effet client uniquement,
 * jamais pendant le prerender (window.__MASSIVE_PRERENDER__). Le HTML capture
 * est donc la page complete, deroulee, visible du crawler. Le hero reste le
 * LCP (premier element du flux, rien n'est retarde).
 *
 * Technique : on translate l'etage entier de -hauteurHero (transform GPU,
 * transform/opacity only), scroll de fond verrouille a 0 pendant l'animation.
 * A la fin on retire le transform ET on place scrollTop = hauteurHero : la
 * position visuelle est identique (translate -H a scroll 0 == translate 0 a
 * scroll H), donc AUCUN saut, et le hero reste accessible en scroll-back.
 */

const SESSION_KEY = 'massive-home-curtain-played'
const REVEAL_DELAY_MS = 1500 // 1,2-1,8 s : temps avant lever auto
const REVEAL_DURATION_MS = 1000 // 800-1200 ms : duree du lever
const REVEAL_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)' // ease-in-out

// HOME-PERF-01 : interrupteur du rideau. false = page normale (hero + contenu,
// scroll natif, aucun lever). Sert de kill-switch ET a l'isolation Lighthouse
// (mesure rideau ON vs OFF).
const HOME_CURTAIN_ENABLED = true

export default function HomeCurtain({ children }) {
  const stageRef = useRef(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || typeof window === 'undefined') return

    // Prerender : ne jamais toucher au scroll ni au transform, laisser la page
    // deroulee pour le crawler.
    if (window.__MASSIVE_PRERENDER__) return

    // HOME-PERF-01 : rideau desactive -> page normale, rien a faire.
    if (!HOME_CURTAIN_ENABLED) return

    // Deja joue cette session, ou l'utilisateur refuse les animations : page
    // normale, scroll natif, rien a faire.
    let played = false
    try { played = sessionStorage.getItem(SESSION_KEY) === '1' } catch { /* prive */ }
    const prefersReduced = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (played || prefersReduced) return

    // ── Premiere visite, animation permise : on arme le rideau ──
    const hero = stage.firstElementChild
    const heroHeight = () => (hero ? hero.offsetHeight : window.innerHeight)

    // Verrou : on remonte en haut et on bloque le scroll de fond. Le hero
    // occupe le viewport, comme a l'arrivee habituelle.
    window.scrollTo(0, 0)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    stage.style.willChange = 'transform'

    let phase = 'waiting' // waiting -> animating -> done
    let fallbackTimer = null

    const markPlayed = () => { try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* prive */ } }

    const cleanupStyles = () => {
      const h = heroHeight()
      stage.style.transition = 'none'
      stage.style.transform = 'none'
      stage.style.willChange = ''
      document.body.style.overflow = prevOverflow
      // Position finale identique au visuel de fin d'animation, mais en scroll
      // reel : hero au-dessus (scroll-back), contenu en vue, aucun saut.
      window.scrollTo(0, h)
    }

    const endAnim = () => {
      if (phase === 'done') return
      phase = 'done'
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null }
      stage.removeEventListener('transitionend', onTransitionEnd)
      cleanupStyles()
      removeIntentListeners()
    }

    const onTransitionEnd = (e) => {
      if (e.target === stage && e.propertyName === 'transform') endAnim()
    }

    const startAnim = () => {
      if (phase !== 'waiting') return
      phase = 'animating'
      markPlayed()
      if (timer) { clearTimeout(timer); timer = null }
      const h = heroHeight()
      stage.style.transition = `transform ${REVEAL_DURATION_MS}ms ${REVEAL_EASING}`
      stage.addEventListener('transitionend', onTransitionEnd)
      // Filet si transitionend ne fire pas (onglet cache, etc.)
      fallbackTimer = setTimeout(endAnim, REVEAL_DURATION_MS + 200)
      // rAF pour garantir que la transition s'applique au changement de valeur.
      requestAnimationFrame(() => { stage.style.transform = `translateY(-${h}px)` })
    }

    // Un geste : lance le rideau si en attente, le termine net si en cours.
    const onIntent = () => {
      if (phase === 'waiting') startAnim()
      else if (phase === 'animating') endAnim()
    }

    const INTENT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown']
    const addIntentListeners = () => {
      INTENT_EVENTS.forEach((ev) =>
        window.addEventListener(ev, onIntent, { passive: true }))
    }
    const removeIntentListeners = () => {
      INTENT_EVENTS.forEach((ev) => window.removeEventListener(ev, onIntent))
    }

    let timer = setTimeout(startAnim, REVEAL_DELAY_MS)
    addIntentListeners()

    // Demontage : tout remettre en etat (jamais laisser le body verrouille).
    return () => {
      if (timer) clearTimeout(timer)
      if (fallbackTimer) clearTimeout(fallbackTimer)
      stage.removeEventListener('transitionend', onTransitionEnd)
      removeIntentListeners()
      stage.style.transition = 'none'
      stage.style.transform = 'none'
      stage.style.willChange = ''
      document.body.style.overflow = prevOverflow
    }
  }, [])

  return <div ref={stageRef}>{children}</div>
}
