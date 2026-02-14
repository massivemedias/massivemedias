import { Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';

function MainLayout() {
  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-16">
          <Outlet />
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}

export default MainLayout;
