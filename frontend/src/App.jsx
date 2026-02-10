import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Contact from './pages/Contact';
import APropos from './pages/APropos';
import Portfolio from './pages/Portfolio';
import Tarifs from './pages/Tarifs';
import { useLang } from './i18n/LanguageContext';
import './index.css';

// Base path pour GitHub Pages — changer en '/' avec custom domain
const basename = import.meta.env.BASE_URL;

function ComingSoon({ section }) {
  const { t } = useLang();
  return (
    <div className="section-container pt-32 text-white text-center">
      <h1 className="text-4xl font-heading">{section} — {t('common.comingSoon')}</h1>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/tarifs" element={<Tarifs />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/a-propos" element={<APropos />} />
          
          {/* Routes à venir */}
          <Route path="/boutique" element={<ComingSoon section="Boutique" />} />
          <Route path="/boutique/:slug" element={<ComingSoon section="Product" />} />
          <Route path="/panier" element={<ComingSoon section="Cart" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
