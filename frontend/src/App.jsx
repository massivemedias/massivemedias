import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Contact from './pages/Contact';
import APropos from './pages/APropos';
import Portfolio from './pages/Portfolio';
import Tarifs from './pages/Tarifs';
import BoutiqueStickers from './pages/BoutiqueStickers';
import Panier from './pages/Panier';
import Login from './pages/Login';
import Account from './pages/Account';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
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
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/tarifs" element={<Tarifs />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/a-propos" element={<APropos />} />
          
          {/* Boutique */}
          <Route path="/boutique" element={<BoutiqueStickers />} />
          <Route path="/boutique/stickers" element={<BoutiqueStickers />} />
          <Route path="/panier" element={<Panier />} />

          {/* Auth & Account */}
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

          {/* Checkout */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
