import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart, UserCircle, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MassiveLogo from './MassiveLogo';
import { useLang } from '../i18n/LanguageContext';
import BrightnessFader from './BrightnessFader';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { lang, toggleLang, t } = useLang();

  const { cartCount } = useCart();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const services = t('nav.servicesList');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 header-bg">
      <nav className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <MassiveLogo className="transition-colors duration-300 logo-header" />
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {/* 4 service links */}
            {services.map((service) => (
              <Link
                key={service.slug}
                to={`/services/${service.slug}`}
                className="transition-colors duration-200 font-medium text-sm nav-link"
              >
                {service.name}
              </Link>
            ))}

            <Link to="/boutique" className="transition-colors duration-200 font-medium text-sm nav-link">
              {t('nav.boutique')}
            </Link>
            <Link to="/a-propos" className="transition-colors duration-200 font-medium text-sm nav-link">
              {t('nav.aPropos')}
            </Link>
            <Link to="/contact" className="btn-primary text-sm py-2 px-5">
              {t('nav.contact')}
            </Link>

            {/* Brightness Fader */}
            <BrightnessFader />

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="text-sm font-semibold tracking-wide px-3 py-1.5 rounded-md transition-all duration-200 toggle-button"
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Account / Login */}
            <Link to={user ? '/account' : '/login'} className="flex items-center gap-1.5 p-2 transition-colors duration-200 nav-link" title={user ? t('nav.account') : t('nav.login')}>
              <UserCircle size={20} />
              {user && (
                <span className="text-sm font-medium max-w-[100px] truncate">
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
              )}
            </Link>

            {/* Panier */}
            <Link to="/panier" className="relative p-2 transition-colors duration-200 nav-link">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-magenta text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <BrightnessFader size="compact" />
            <button
              onClick={toggleLang}
              className="text-sm font-semibold tracking-wide px-2.5 py-1 rounded-md transition-all duration-200 toggle-button"
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 transition-colors nav-link"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-3 overflow-hidden pt-4 header-border"
            >
              <div className="flex flex-col gap-1">
                {/* 4 service links */}
                {services.map((service) => (
                  <Link
                    key={service.slug}
                    to={`/services/${service.slug}`}
                    className="transition-colors duration-200 font-medium py-2.5 text-sm nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {service.name}
                  </Link>
                ))}

                {[
                  { to: '/boutique', label: t('nav.boutique') },
                  { to: '/a-propos', label: t('nav.aPropos') },
                  { to: '/panier', label: `${t('nav.panier')}${cartCount > 0 ? ` (${cartCount})` : ''}` },
                  { to: user ? '/account' : '/login', label: user ? `${user.user_metadata?.full_name?.split(' ')[0] || t('nav.account')}` : t('nav.login') },
                ].map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="transition-colors duration-200 font-medium py-2.5 text-sm nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                <Link to="/contact" className="btn-primary text-center mt-3 text-sm py-2.5" onClick={() => setMobileMenuOpen(false)}>
                  {t('nav.contact')}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <div className="text-center py-1 text-[11px] font-medium tracking-wide border-t border-purple-main/10 delivery-banner">
        <Truck size={12} className="inline mr-1.5 -mt-px" />
        {lang === 'fr' ? 'Livraison locale gratuite · Mile-End, Montréal' : 'Free local delivery · Mile-End, Montreal'}
      </div>
    </header>
  );
}

export default Header;
