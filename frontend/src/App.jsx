import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ServiceDetail from './pages/ServiceDetail';
import Contact from './pages/Contact';
import APropos from './pages/APropos';
import Boutique from './pages/Boutique';
import BoutiqueStickers from './pages/BoutiqueStickers';
import BoutiqueFineArt from './pages/BoutiqueFineArt';
import BoutiqueSublimation from './pages/BoutiqueSublimation';
import BoutiqueFlyers from './pages/BoutiqueFlyers';
import BoutiqueDesign from './pages/BoutiqueDesign';
import BoutiqueWeb from './pages/BoutiqueWeb';
import Panier from './pages/Panier';
import Login from './pages/Login';
import Account from './pages/Account';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { useLang } from './i18n/LanguageContext';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

// Base path pour GitHub Pages - changer en '/' avec custom domain
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
    </BrowserRouter>
  );
}

export default App;
