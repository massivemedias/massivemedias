import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
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
const BoutiqueFlyers = lazy(() => import('./pages/BoutiqueFlyers'));
const BoutiqueDesign = lazy(() => import('./pages/BoutiqueDesign'));
const BoutiqueWeb = lazy(() => import('./pages/BoutiqueWeb'));
const Panier = lazy(() => import('./pages/Panier'));
const Login = lazy(() => import('./pages/Login'));
const Account = lazy(() => import('./pages/Account'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const CheckoutCancel = lazy(() => import('./pages/CheckoutCancel'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

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

function App() {
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
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
            <Route path="/services/developpement-web" element={<Navigate to="/services/design" replace />} />

            {/* Boutique */}
            <Route path="/boutique" element={<Boutique />} />
            <Route path="/boutique/stickers" element={<BoutiqueStickers />} />
            <Route path="/boutique/fine-art" element={<BoutiqueFineArt />} />
            <Route path="/boutique/sublimation" element={<BoutiqueSublimation />} />
            <Route path="/boutique/flyers" element={<BoutiqueFlyers />} />
            <Route path="/boutique/design" element={<BoutiqueDesign />} />
            <Route path="/boutique/web" element={<BoutiqueWeb />} />
            <Route path="/panier" element={<Panier />} />

            {/* Auth & Account */}
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

            {/* Checkout */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
