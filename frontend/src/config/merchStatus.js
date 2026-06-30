/**
 * SOURCE UNIQUE de l'etat "Merch/Sublimation".
 *
 * Quand MERCH_PAUSED est a `true`:
 *   - Les boutons "Ajouter au panier" des composants Merch sont visuellement desactives
 *   - Cliquer dessus affiche un alert expliquant la pause
 *   - La banniere <MerchPauseBanner /> s'affiche en haut des pages Merch
 *
 * Pour REACTIVER la section (fin du demenagement):
 *   - Passer MERCH_PAUSED a `false`
 *   - C'est tout. Les composants retombent automatiquement en mode normal.
 */
export const MERCH_PAUSED = true;

export const MERCH_PAUSE_COPY = {
  title: {
    fr: 'Service temporairement suspendu - Demenagement de nos ateliers 📦',
    en: 'Service temporarily suspended - Our studios are moving 📦',
    es: 'Servicio temporalmente suspendido - Mudanza de nuestros talleres 📦',
  },
  body: {
    fr: "Pour vous offrir la meilleure qualite, notre service de sublimation couleur (textiles, tasses, objets) est actuellement en pause pendant que nous installons notre nouvel equipement.\n\n⚡️ Bonne nouvelle : L'impression de logos en vinyle simple sur textile reste disponible ! Contactez-nous directement pour ces demandes specifiques.",
    en: "To give you the best quality, our color sublimation service (textiles, mugs, objects) is currently paused while we install our new equipment.\n\n⚡️ Good news: Simple vinyl logo printing on textiles is still available! Contact us directly for these specific requests.",
    es: "Para ofrecerte la mejor calidad, nuestro servicio de sublimacion a color (textiles, tazas, objetos) esta en pausa mientras instalamos nuestro nuevo equipo.\n\n⚡️ Buena noticia: la impresion de logos en vinilo simple sobre textil sigue disponible! Contactanos directamente para estos pedidos especificos.",
  },
  // Message court pour l'alert au click sur un bouton desactive
  alert: {
    fr: "Ce service est temporairement indisponible pendant le demenagement de nos ateliers. Pour une demande speciale en vinyle, contactez-nous directement.",
    en: "This service is temporarily unavailable while our studios are moving. For a special vinyl request, please contact us directly.",
    es: "Este servicio esta temporalmente no disponible durante la mudanza de nuestros talleres. Para un pedido especial en vinilo, contactanos directamente.",
  },
  ctaLabel: {
    fr: 'Faire une demande speciale (Vinyle)',
    en: 'Make a special request (Vinyl)',
    es: 'Hacer un pedido especial (Vinilo)',
  },
};

/**
 * Helper a appeler dans les onClick des boutons "Ajouter au panier" des
 * composants Merch. Quand MERCH_PAUSED=true, il affiche un alert et retourne
 * true (= bloque l'action). Quand pas en pause, retourne false (= laisse passer).
 *
 * Usage:
 *   const handleAddToCart = () => {
 *     if (blockIfMerchPaused(tx)) return;
 *     addToCart({ ... });
 *   };
 */
export function blockIfMerchPaused(tx) {
  if (!MERCH_PAUSED) return false;
  try {
    window.alert(tx(MERCH_PAUSE_COPY.alert));
  } catch {
    // SSR ou environnement sans window - on bloque quand meme
  }
  return true;
}

/**
 * MERCH_HIDDEN (distinct de MERCH_PAUSED) : quand `true`, TOUTE la section
 * merch est MASQUEE, pas seulement mise en pause :
 *   - les liens merch disparaissent de la nav, du footer, de la home et des
 *     pilules cross-sell (rien n'est supprime, juste delie)
 *   - l'acces direct aux routes /services/merch, /boutique/sublimation et
 *     /boutique/merch/* redirige vers l'accueil
 *
 * Pour TOUT REAFFICHER (page + liens + routes) : repasser MERCH_HIDDEN a
 * `false`. C'est la seule action necessaire, rien n'a ete detruit. N'affecte
 * ni MERCH_PAUSED ni la logique panier/banniere existante.
 */
export const MERCH_HIDDEN = true

// Slugs de service caches de la nav (Header/Footer) et de la navigation
// prev/next de ServiceDetail. Vide quand MERCH_HIDDEN=false.
export const HIDDEN_SERVICE_SLUGS = MERCH_HIDDEN ? ['merch'] : []

// Routes de la section merch. Sert a filtrer les liens cross-sell + la carte
// service de la home, et a rediriger l'acces direct.
const MERCH_PATHS = ['/services/merch', '/boutique/sublimation', '/boutique/merch']

/**
 * Retourne true si `path` pointe vers une surface merch ET que MERCH_HIDDEN
 * est actif. Quand MERCH_HIDDEN=false, retourne toujours false (aucun filtre).
 */
export function isHiddenMerchPath(path) {
  if (!MERCH_HIDDEN) return false
  const p = String(path || '')
  return MERCH_PATHS.some((m) => p === m || p.startsWith(m + '/'))
}
