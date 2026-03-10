import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { useLang } from './i18n/LanguageContext';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

// Lazy-loaded pages (chargées à la demande)
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const APropos = lazy(() => import('./pages/APropos'));
const Boutique = lazy(() => import('./pages/Boutique'));
const BoutiqueStickers = lazy(() => import('./pages/BoutiqueStickers'));
const BoutiqueFineArt = lazy(() => import('./pages/BoutiqueFineArt'));
const BoutiqueSublimation = lazy(() => import('./pages/BoutiqueSublimation'));
const BoutiqueDesign = lazy(() => import('./pages/BoutiqueDesign'));
const BoutiqueWeb = lazy(() => import('./pages/BoutiqueWeb'));
const BoutiqueMerch = lazy(() => import('./pages/BoutiqueMerch'));
const Panier = lazy(() => import('./pages/Panier'));
const Login = lazy(() => import('./pages/Login'));
const Account = lazy(() => import('./pages/Account'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const CheckoutCancel = lazy(() => import('./pages/CheckoutCancel'));
const Artistes = lazy(() => import('./pages/Artistes'));
const ArtisteDetail = lazy(() => import('./pages/ArtisteDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const MmAdmin = lazy(() => import('./pages/MmAdmin'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminInventaire = lazy(() => import('./pages/AdminInventaire'));
const AdminMessages = lazy(() => import('./pages/AdminMessages'));
const AdminArtistes = lazy(() => import('./pages/AdminArtistes'));
const AdminCommissions = lazy(() => import('./pages/AdminCommissions'));
const AdminClients = lazy(() => import('./pages/AdminClients'));
const AdminDepenses = lazy(() => import('./pages/AdminDepenses'));
const AdminStats = lazy(() => import('./pages/AdminStats'));
const AdminUtilisateurs = lazy(() => import('./pages/AdminUtilisateurs'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const AdminRoute = lazy(() => import('./components/AdminRoute'));

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
      <ScrollToTop />
      <ErrorBoundary>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={subdomainSlug ? <ArtisteDetail subdomainSlug={subdomainSlug} /> : <Home />} />
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
            <Route path="/boutique" element={<Boutique />} />
            <Route path="/boutique/stickers" element={<BoutiqueStickers />} />
            <Route path="/boutique/fine-art" element={<BoutiqueFineArt />} />
            <Route path="/boutique/sublimation" element={<BoutiqueSublimation />} />
            <Route path="/boutique/flyers" element={<Navigate to="/boutique/fine-art" replace />} />
            <Route path="/boutique/design" element={<BoutiqueDesign />} />
            <Route path="/boutique/web" element={<BoutiqueWeb />} />
            <Route path="/boutique/merch/:type" element={<BoutiqueMerch />} />
            <Route path="/boutique/merch-tshirt" element={<Navigate to="/boutique/merch/tshirt" replace />} />
            <Route path="/panier" element={<Panier />} />

            {/* Auth & Account */}
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

            {/* Artistes */}
            <Route path="/artistes" element={<Artistes />} />
            <Route path="/artistes/:slug" element={<ArtisteDetail />} />

            {/* Admin - redirige vers le dashboard */}
            <Route path="/mm-admin" element={<AdminRoute><MmAdmin /></AdminRoute>} />
          </Route>

          {/* Admin dashboard */}
          <Route element={<MainLayout />}>
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Navigate to="/admin/commandes" replace />} />
              <Route path="commandes" element={<AdminOrders />} />
              <Route path="commissions" element={<AdminCommissions />} />
              <Route path="inventaire" element={<AdminInventaire />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="candidatures" element={<Navigate to="/admin/messages" replace />} />
              <Route path="artistes" element={<Navigate to="/admin/messages" replace />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="utilisateurs" element={<AdminUtilisateurs />} />
              <Route path="depenses" element={<AdminDepenses />} />
              <Route path="stats" element={<AdminStats />} />
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
