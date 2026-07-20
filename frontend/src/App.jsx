import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { useLang } from './i18n/LanguageContext';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopButton from './components/ScrollToTopButton';
import BackendHealthBanner from './components/BackendHealthBanner';
import { STICKERS_SHOP_ENABLED } from './config/stickersShopStatus'
import { ETIQUETTES_VISIBLE } from './config/etiquettesStatus'
import { sendVisitorBeacon } from './utils/visitorBeacon';
import './index.css';

// Retry wrapper for lazy imports - retries up to 3 times on chunk load failure
function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch((err) => {
      console.warn('[lazyWithRetry] Import failed, retrying...', err.message);
      // Clear module cache for Vite by adding a timestamp query param
      return new Promise((resolve) => setTimeout(resolve, 200)).then(() =>
        importFn().catch((err2) => {
          console.warn('[lazyWithRetry] 2nd attempt failed, retrying...', err2.message);
          return new Promise((resolve) => setTimeout(resolve, 500)).then(() => importFn());
        })
      );
    })
  );
}

// Lazy-loaded pages (chargees a la demande, avec retry automatique)
const ServiceDetail = lazyWithRetry(() => import('./pages/ServiceDetail'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
// FIX-TRACKING-PORTAL (28 avril 2026) : portail public de suivi de commande.
const Tracking = lazyWithRetry(() => import('./pages/Tracking'));
const APropos = lazyWithRetry(() => import('./pages/APropos'));
const Shop = lazyWithRetry(() => import('./pages/Shop'));
const Panier = lazyWithRetry(() => import('./pages/Panier'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Account = lazyWithRetry(() => import('./pages/Account'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const CheckoutSuccess = lazyWithRetry(() => import('./pages/CheckoutSuccess'));
const CheckoutCancel = lazyWithRetry(() => import('./pages/CheckoutCancel'));
const Artistes = lazyWithRetry(() => import('./pages/Artistes'));
const ArtisteDetail = lazyWithRetry(() => import('./pages/ArtisteDetail'));
const Temoignage = lazyWithRetry(() => import('./pages/Temoignage'));
const VentePrivee = lazyWithRetry(() => import('./pages/VentePrivee'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
// SEO-LOCAL (8 mai 2026) : 5 landing pages dediees aux keywords longue-traine
// geo + service. Chaque page resolue dynamiquement via le slug d'URL,
// data centralisee dans src/data/landingPages.js.
const LandingLocal = lazyWithRetry(() => import('./pages/LandingLocal'));
const MassiveStickers = lazyWithRetry(() => import('./pages/MassiveStickers'))
// ETIQUETTES (Phase 1) : page derriere flag, invisible en prod tant que le test
// lave-vaisselle de Mika n'est pas concluant (cf. config/etiquettesStatus.js).
const Etiquettes = lazyWithRetry(() => import('./pages/Etiquettes'))
const MmAdmin = lazyWithRetry(() => import('./pages/MmAdmin'));
// AdminLayout est importe STATIQUEMENT (pas lazy) pour eviter les problemes
// de cache Cloudflare ou le sidebar n'affiche pas les nouveaux onglets au premier chargement.
import AdminLayout from './layouts/AdminLayout';
const AdminOrders = lazyWithRetry(() => import('./pages/AdminOrders'));
const AdminInventaire = lazyWithRetry(() => import('./pages/AdminInventaire'));
const AdminMessages = lazyWithRetry(() => import('./pages/AdminMessages'));
// AdminArtistes removed - redirect to messages
// AdminCommissions supprime (avril 2026) - fusionne dans AdminArtistManager (God Mode, tab Finances).
// AdminClients merged into AdminUtilisateurs - redirect in routes
const AdminDepenses = lazyWithRetry(() => import('./pages/AdminDepenses'));
// AdminStats n'est plus une route propre (avril 2026) - il est lazy-imported
// directement dans AdminDashboard via le toggle "Afficher les statistiques detaillees".
// Le path /admin/stats redirige vers /admin/dashboard pour compat retroactive.
const AdminTarifs = lazyWithRetry(() => import('./pages/AdminTarifs'));
const AdminTemoignages = lazyWithRetry(() => import('./pages/AdminTemoignages'));
// AdminFactures supprime (refactor avril 2026) - doublon avec AdminOrders.
// Toute la gestion factures passe par /admin/commandes (centralise). Les anciennes
// URLs /admin/factures redirigent vers /admin/commandes.
const AdminUtilisateurs = lazyWithRetry(() => import('./pages/AdminUtilisateurs'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AdminNotes = lazyWithRetry(() => import('./pages/AdminNotes'));
const AdminSystemStatus = lazyWithRetry(() => import('./pages/AdminSystemStatus'));
const AdminMassiveIA = lazyWithRetry(() => import('./pages/AdminMassiveIA'));
const AdminPromos = lazyWithRetry(() => import('./pages/AdminPromos'));
const AdminArtistManager = lazyWithRetry(() => import('./pages/AdminArtistManager'));
// AdminReglagesFacturation n'a plus sa propre route (avril 2026) : integre
// comme onglet dans AdminOrders pour centraliser le workflow facturation.
// Les deep-links /admin/reglages-facturation redirigent vers /admin/commandes.

// These are small wrappers - load eagerly to avoid lazy-loading auth guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Base path pour GitHub Pages
const basename = import.meta.env.BASE_URL;

function ComingSoon({ section }) {
  const { t } = useLang();
  return (
    <div className="section-container pt-32 text-heading text-center">
      <h1 className="text-4xl font-heading">{section} - {t('common.comingSoon')}</h1>
    </div>
  );
}

// Liste des sous-domaines REZERVES (jamais traites comme un slug d'artiste).
// Si tu en ajoutes un (ex: 'blog'), pense aussi a configurer Cloudflare DNS
// pour qu'il ne tape pas la SPA (sinon `https://blog.massivemedias.com/` va
// quand meme atterrir sur le frontend et le filtre ci-dessous l'ignorera =>
// page d'accueil par defaut, pas une 404 - probablement OK comme fallback).
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'admin',
  'api',
  'staging',
  'preview',
  'mail',
  'm', // mobile redirect (cas usuel)
]);

function getSubdomainSlug() {
  // SSR-SAFE (2026-05-14) : guard typeof window. Avant ce fix, cette
  // fonction etait appelee a la phase RENDER de App.jsx (ligne 163) et
  // Header.jsx (ligne 11) -> ReferenceError en Node (SSR / prerender) ->
  // crash silencieux du build CI. La fonction rootUrl ligne 138-139 ci-
  // dessous avait deja le bon pattern, on l'aligne ici aussi.
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  // Localhost / 127.* / *.local : pas de wildcard SaaS (dev mode)
  if (/^(localhost|127\.|192\.168\.|10\.)/.test(host) || host.endsWith('.local')) {
    return null;
  }
  const match = host.match(/^([^.]+)\.massivemedias\.com$/);
  if (!match) return null;
  const slug = match[1].toLowerCase();
  if (RESERVED_SUBDOMAINS.has(slug)) return null;
  return slug;
}

// Exporte le check pour les composants qui doivent forcer une URL absolue
// vers le domaine racine (ex: nav globale -> sortir du sous-domaine artiste).
export { getSubdomainSlug };

// Helper : retourne une URL absolue vers la racine massivemedias.com si on est
// sur un sous-domaine d'artiste, sinon le path relatif tel quel. Utilise par
// le Header pour que les liens "Accueil"/"Services"/"Contact" sortent bien
// du sous-domaine artiste (l'artiste qui clique "Accueil" doit voir
// massivemedias.com/, pas gallium.massivemedias.com/).
export function rootUrl(path = '/') {
  if (typeof window === 'undefined') return path;
  if (getSubdomainSlug()) {
    return `https://massivemedias.com${path.startsWith('/') ? path : '/' + path}`;
  }
  return path;
}

// Redirect to /login if recovery hash is detected on any page
function RecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery') && location.pathname !== '/login') {
      // Keep the hash fragment so Login.jsx can detect it
      navigate('/login' + hash, { replace: true });
    }
  }, []);

  return null;
}

// ADMIN-VISITORS : pageview beacon a chaque changement de route. Monte une
// seule fois (dans MainLayout), suit location.pathname. sendBeacon est
// async et non bloquant, ne trace pas les pages /admin (donnees internes).
function VisitorBeacon() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/mm-admin')) return;
    sendVisitorBeacon(location.pathname);
  }, [location.pathname]);
  return null;
}

function App() {
  const subdomainSlug = getSubdomainSlug();

  // Debug : trace la detection en prod pour faciliter le diagnostic d'un
  // bug "j'ai pointe artist.massivemedias.com mais ca affiche la home". Le
  // log apparait dans la console DevTools, pas dans le DOM. Visible aussi
  // dans les logs Cloudflare Pages si on push une instrumentation cote
  // Worker plus tard.
  useEffect(() => {
    if (subdomainSlug) {
      // eslint-disable-next-line no-console
      console.log('[Massive] Subdomain detected:', subdomainSlug, '- rendering ArtisteDetail');
    }
  }, [subdomainSlug]);

  // Capture referral code from URL (?ref=XXXXXXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('referralCode', refCode);
      params.delete('ref');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  }, []);

  // FIX-OAUTH-LOOP (5 mai 2026, post-rollback) : safety net minimaliste pour
  // les retours OAuth Supabase qui atterrissent au root avec error_code dans
  // les query params (au lieu du hash que Login.jsx peut lire).
  // Pattern URL : /?error=invalid_request&error_code=bad_oauth_state&...
  // Sans ce handler le user reste BLOQUE sur la homepage avec l'URL polluee
  // et aucun feedback. Avec : on transfere l'erreur vers /login (qui a deja
  // un handler hash) pour affichage propre + on nettoie les cles Supabase
  // orphelines (code_verifier d'un flow precedent foire) qui empecheraient
  // un nouveau login de marcher.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get('error_code');
    if (!errorCode) return;
    // Cibler uniquement les erreurs OAuth Supabase connues
    if (errorCode !== 'bad_oauth_state' && errorCode !== 'invalid_request') return;
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (_) { /* localStorage indispo - ignore */ }
    const errorDesc = params.get('error_description') || 'Erreur d\'authentification';
    const cleanMsg = errorDesc.replace(/\+/g, ' ');
    // Redirect vers /login avec l'erreur en hash (handler existant Login.jsx)
    window.location.replace(
      `/login#error_code=${encodeURIComponent(errorCode)}&error_description=${encodeURIComponent(cleanMsg)}`
    );
  }, []);

  return (
    <BrowserRouter basename={basename}>
      <BackendHealthBanner />
      <RecoveryRedirect />
      <VisitorBeacon />
      <ScrollToTop />
      <ScrollToTopButton />
      <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={
              subdomainSlug
                ? <ArtisteDetail subdomainSlug={subdomainSlug} />
                : <Home />
            } />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/contact" element={<Contact />} />
            {/* FIX-TRACKING-PORTAL : portail public de suivi de commande.
                Accepte ?id=X&email=Y pour pre-remplissage auto via les liens
                inseres dans les emails post-paiement. */}
            <Route path="/suivi" element={<Tracking />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/a-propos" element={<APropos />} />

            {/* Redirects - anciens slugs → nouveaux */}
            <Route path="/services" element={<Navigate to="/" replace />} />
            <Route path="/tarifs" element={<Navigate to="/" replace />} />
            <Route path="/portfolio" element={<Navigate to="/" replace />} />
            <Route path="/services/impression-fine-art" element={<Navigate to="/services/prints" replace />} />
            <Route path="/services/flyers-cartes" element={<Navigate to="/services/prints" replace />} />
            <Route path="/services/stickers-custom" element={<Navigate to="/services/stickers" replace />} />
            <Route path="/services/sublimation-merch" element={<Navigate to="/services/merch" replace />} />
            <Route path="/services/design-graphique" element={<Navigate to="/services/design" replace />} />
            <Route path="/services/developpement-web" element={<Navigate to="/services/web" replace />} />

            {/* Landing pages SEO local (8 mai 2026) - 5 pages dediees a un
                keyword precis chacune. Catch-all sur /:landingSlug pour
                router automatiquement vers LandingLocal qui valide le slug
                contre LANDING_PAGES (data/landingPages.js) et 404 sinon.
                IMPORTANT : ces routes doivent etre declarees AVANT les
                routes catch-all 404 (NotFound) pour matcher en priorite. */}
            <Route path="/imprimeur-plateau-mont-royal" element={<LandingLocal />} />
            {/* RESTORE-MILE-END (7 juillet 2026) : le redirect du 10 mai est
                retire. Decision SEO du 23 juin : /imprimeur-mile-end est
                position 1 sur "printing mile end" et redevient une VRAIE
                landing (mode zone desservie, entree dediee dans
                landingPages.js). Les deux pages coexistent : requetes et
                contenus differents. NE PLUS rediriger cette URL. */}
            <Route path="/imprimeur-mile-end" element={<LandingLocal />} />
            {/* STICKERS-SHOP-A (8 juillet 2026) : vitrine de la collection
                stickers Massive, derriere le flag STICKERS_SHOP_ENABLED
                (config/stickersShopStatus.js). Flag off = route inexistante
                (404), rien d'autre a debrancher. */}
            {STICKERS_SHOP_ENABLED && (
              <Route path="/stickers" element={<MassiveStickers />} />
            )}
            {/* ETIQUETTES : flag false en prod (test lave-vaisselle = gate),
                visible en DEV pour construire et valider (Phases 1-2). */}
            {ETIQUETTES_VISIBLE && (
              <Route path="/etiquettes" element={<Etiquettes />} />
            )}
            <Route path="/stickers-personnalises-montreal" element={<LandingLocal />} />
            <Route path="/print-fine-art-quebec" element={<LandingLocal />} />
            <Route path="/sublimation-textile-montreal" element={<LandingLocal />} />
            <Route path="/impression-flyers-montreal" element={<LandingLocal />} />
            <Route path="/etiquettes-personnalisees-enfants-montreal" element={<LandingLocal />} />

            {/* Boutique */}
            <Route path="/boutique" element={<Shop />} />
            {/* SEO-2026 : les sous-pages /boutique/* sont des REDIRECTIONS. En prod
                c'est public/_redirects (301 serveur, source unique) qui agit ; ces
                <Navigate> sont le repli local/SPA (dev vite n'a pas _redirects).
                design/fine-art/web -> /services/* (fin de migration, tue le doublon) ;
                sublimation/merch -> / (MERCH_PAUSED, repointer /services/merch au relaunch). */}
            <Route path="/boutique/stickers" element={<Navigate to="/services/stickers" replace />} />
            <Route path="/boutique/fine-art" element={<Navigate to="/services/prints" replace />} />
            <Route path="/boutique/design" element={<Navigate to="/services/design" replace />} />
            <Route path="/boutique/web" element={<Navigate to="/services/web" replace />} />
            <Route path="/boutique/flyers" element={<Navigate to="/services/prints" replace />} />
            <Route path="/boutique/sublimation" element={<Navigate to="/" replace />} />
            <Route path="/boutique/merch/:type" element={<Navigate to="/" replace />} />
            <Route path="/boutique/merch-tshirt" element={<Navigate to="/" replace />} />
            <Route path="/panier" element={<Panier />} />

            {/* Auth & Account */}
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

            {/* Temoignage */}
            <Route path="/temoignage" element={<Temoignage />} />

            {/* Vente privee (acces exclusif par token) - pas d'auth */}
            <Route path="/vente-privee/:token" element={<VentePrivee />} />

            {/* Artistes */}
            <Route path="/artistes" element={<Artistes />} />
            <Route path="/artistes/:slug" element={<ArtisteDetail />} />

            {/* Admin - redirige vers le dashboard */}
            <Route path="/mm-admin" element={<AdminRoute><MmAdmin /></AdminRoute>} />
          </Route>

          {/* Admin dashboard */}
          <Route element={<MainLayout />}>
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="notes" element={<AdminNotes />} />
              <Route path="commandes" element={<AdminOrders />} />
              <Route path="artists" element={<AdminArtistManager />} />
              {/* Alias FR pour rester coherent avec le reste du menu */}
              <Route path="artistes" element={<Navigate to="/admin/artists" replace />} />
              {/* /admin/factures -> commandes (ancien doublon supprime avril 2026) */}
              <Route path="factures" element={<Navigate to="/admin/commandes" replace />} />
              {/* /admin/commissions -> redirige vers le hub artistes (tab Finances) */}
              <Route path="commissions" element={<Navigate to="/admin/artists" replace />} />
              <Route path="inventaire" element={<AdminInventaire />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="candidatures" element={<Navigate to="/admin/messages" replace />} />
              {/* /admin/artistes historique : redirige vers le nouveau hub artist-manager */}
              <Route path="clients" element={<Navigate to="/admin/utilisateurs" replace />} />
              <Route path="utilisateurs" element={<AdminUtilisateurs />} />
              {/* /admin/soumissions retire le 7 mai 2026 (les soumissions
                  CLIENTS sont desormais un onglet integre a /admin/commandes ;
                  les soumissions ARTISTES seront repositionnees plus tard). */}
              {/* Depenses redirige vers sa propre page dediee (ancien flow passait par Factures) */}
              <Route path="depenses" element={<AdminDepenses />} />
              <Route path="temoignages" element={<AdminTemoignages />} />
              {/* /admin/stats -> integre au Dashboard (toggle). Redirection pour backward compat. */}
              <Route path="stats" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="tarifs" element={<AdminTarifs />} />
              <Route path="promos" element={<AdminPromos />} />
              {/* /admin/reglages-facturation -> onglet integre dans /admin/commandes (avril 2026) */}
              <Route path="reglages-facturation" element={<Navigate to="/admin/commandes" replace />} />
              <Route path="systeme" element={<AdminSystemStatus />} />
              {/* FIX-ROUTE (3 mai 2026) : route principale massive-ai
                  (coherent avec le branding "ai.massive"). Alias massive-ia
                  conserve pour la backward-compat des liens deja partages. */}
              <Route path="massive-ai" element={<AdminMassiveIA />} />
              <Route path="massive-ia" element={<Navigate to="/admin/massive-ai" replace />} />
            </Route>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
