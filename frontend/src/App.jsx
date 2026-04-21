import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { useLang } from './i18n/LanguageContext';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopButton from './components/ScrollToTopButton';
import BackendHealthBanner from './components/BackendHealthBanner';
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
const APropos = lazyWithRetry(() => import('./pages/APropos'));
const Shop = lazyWithRetry(() => import('./pages/Shop'));
const ServiceFineArt = lazyWithRetry(() => import('./pages/ServiceFineArt'));
const ServiceMerch = lazyWithRetry(() => import('./pages/ServiceMerch'));
const ServiceDesign = lazyWithRetry(() => import('./pages/ServiceDesign'));
const ServiceWeb = lazyWithRetry(() => import('./pages/ServiceWeb'));
const MerchDetail = lazyWithRetry(() => import('./pages/MerchDetail'));
const Panier = lazyWithRetry(() => import('./pages/Panier'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Account = lazyWithRetry(() => import('./pages/Account'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const CheckoutSuccess = lazyWithRetry(() => import('./pages/CheckoutSuccess'));
const CheckoutCancel = lazyWithRetry(() => import('./pages/CheckoutCancel'));
const Artistes = lazyWithRetry(() => import('./pages/Artistes'));
const ArtisteDetail = lazyWithRetry(() => import('./pages/ArtisteDetail'));
const Temoignage = lazyWithRetry(() => import('./pages/Temoignage'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const MmAdmin = lazyWithRetry(() => import('./pages/MmAdmin'));
// AdminLayout est importe STATIQUEMENT (pas lazy) pour eviter les problemes
// de cache Cloudflare ou le sidebar n'affiche pas les nouveaux onglets au premier chargement.
import AdminLayout from './layouts/AdminLayout';
const AdminOrders = lazyWithRetry(() => import('./pages/AdminOrders'));
const AdminInventaire = lazyWithRetry(() => import('./pages/AdminInventaire'));
const AdminMessages = lazyWithRetry(() => import('./pages/AdminMessages'));
// AdminArtistes removed - redirect to messages
const AdminCommissions = lazyWithRetry(() => import('./pages/AdminCommissions'));
// AdminClients merged into AdminUtilisateurs - redirect in routes
const AdminDepenses = lazyWithRetry(() => import('./pages/AdminDepenses'));
const AdminStats = lazyWithRetry(() => import('./pages/AdminStats'));
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

function getSubdomainSlug() {
  const host = window.location.hostname;
  const match = host.match(/^([^.]+)\.massivemedias\.com$/);
  if (match && match[1] !== 'www') return match[1];
  return null;
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

function App() {
  const subdomainSlug = getSubdomainSlug();

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

  return (
    <BrowserRouter basename={basename}>
      <BackendHealthBanner />
      <RecoveryRedirect />
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

            {/* Boutique */}
            <Route path="/boutique" element={<Shop />} />
            <Route path="/boutique/stickers" element={<Navigate to="/services/stickers" replace />} />
            <Route path="/boutique/fine-art" element={<ServiceFineArt />} />
            <Route path="/boutique/sublimation" element={<ServiceMerch />} />
            <Route path="/boutique/flyers" element={<Navigate to="/boutique/fine-art" replace />} />
            <Route path="/boutique/design" element={<ServiceDesign />} />
            <Route path="/boutique/web" element={<ServiceWeb />} />
            <Route path="/boutique/merch/:type" element={<MerchDetail />} />
            <Route path="/boutique/merch-tshirt" element={<Navigate to="/boutique/merch/tshirt" replace />} />
            <Route path="/panier" element={<Panier />} />

            {/* Auth & Account */}
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

            {/* Temoignage */}
            <Route path="/temoignage" element={<Temoignage />} />

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
              <Route path="commissions" element={<AdminCommissions />} />
              <Route path="inventaire" element={<AdminInventaire />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="candidatures" element={<Navigate to="/admin/messages" replace />} />
              {/* /admin/artistes historique : redirige vers le nouveau hub artist-manager */}
              <Route path="clients" element={<Navigate to="/admin/utilisateurs" replace />} />
              <Route path="utilisateurs" element={<AdminUtilisateurs />} />
              {/* Depenses redirige vers sa propre page dediee (ancien flow passait par Factures) */}
              <Route path="depenses" element={<AdminDepenses />} />
              <Route path="temoignages" element={<AdminTemoignages />} />
              <Route path="stats" element={<AdminStats />} />
              <Route path="tarifs" element={<AdminTarifs />} />
              <Route path="promos" element={<AdminPromos />} />
              <Route path="systeme" element={<AdminSystemStatus />} />
              <Route path="massive-ia" element={<AdminMassiveIA />} />
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
