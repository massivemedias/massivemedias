import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Contact from './pages/Contact';
import APropos from './pages/APropos';
import Portfolio from './pages/Portfolio';
import Tarifs from './pages/Tarifs';
import './index.css';

// Base path pour GitHub Pages — changer en '/' avec custom domain
const basename = import.meta.env.BASE_URL;

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
          <Route path="/boutique" element={<div className="section-container pt-32 text-white text-center"><h1 className="text-4xl font-heading">Boutique — Bientôt disponible</h1></div>} />
          <Route path="/boutique/:slug" element={<div className="section-container pt-32 text-white text-center"><h1 className="text-4xl font-heading">Produit — Bientôt disponible</h1></div>} />
          <Route path="/panier" element={<div className="section-container pt-32 text-white text-center"><h1 className="text-4xl font-heading">Panier — Bientôt disponible</h1></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
