import { Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CookieBanner from '../components/CookieBanner';
import { useAnalytics } from '../hooks/useAnalytics';

function MainLayout() {
  useAnalytics();

  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-20">
          <Outlet />
        </main>
        <Footer />
        <CookieBanner />
      </div>
    </HelmetProvider>
  );
}

export default MainLayout;
