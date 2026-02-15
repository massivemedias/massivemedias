import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, ShoppingCart, Sparkles, Sun, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MassiveLogoVibrant from '../assets/massive-logo.svg';
import MassiveLogoLight from '../assets/massive-logo-light.png';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { lang, toggleLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  const services = t('nav.servicesList');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 header-bg">
      <nav className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={theme === 'light' ? MassiveLogoLight : MassiveLogoVibrant}
              alt="Massive Medias"
              className="transition-opacity duration-300 logo-header"
            />
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Services Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 transition-colors duration-200 font-medium text-sm nav-link">
                {t('nav.services')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {servicesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-56 rounded-lg overflow-hidden header-dropdown header-border"
                  >
                    {services.map((service) => (
                      <Link
                        key={service.slug}
                        to={`/services/${service.slug}`}
                        className="block px-5 py-2.5 text-sm transition-colors duration-150 nav-link header-item-hover header-border"
                      >
                        {service.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/tarifs" className="transition-colors duration-200 font-medium text-sm nav-link">
              {t('nav.tarifs')}
            </Link>
            <Link to="/portfolio" className="transition-colors duration-200 font-medium text-sm nav-link">
              {t('nav.portfolio')}
            </Link>
            <Link to="/boutique" className="transition-colors duration-200 font-medium text-sm nav-link">
              {t('nav.boutique')}
            </Link>
            <Link to="/a-propos" className="transition-colors duration-200 font-medium text-sm nav-link">
              {t('nav.aPropos')}
            </Link>
            <Link to="/contact" className="btn-primary text-sm py-2 px-5">
              {t('nav.contact')}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md transition-all duration-200 toggle-button"
              title={theme === 'light' ? 'Vibrant mode' : 'Light mode'}
            >
              {theme === 'light' ? <Sparkles size={16} /> : <Sun size={16} />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="text-sm font-semibold tracking-wide px-3 py-1.5 rounded-md transition-all duration-200 toggle-button"
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Account / Login */}
            <Link to={user ? '/account' : '/login'} className="p-2 transition-colors duration-200 nav-link" title={user ? t('nav.account') : t('nav.login')}>
              <UserCircle size={20} />
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
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md transition-all duration-200 toggle-button"
            >
              {theme === 'light' ? <Sparkles size={14} /> : <Sun size={14} />}
            </button>
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
                <div>
                  <button 
                    onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                    className="w-full flex items-center justify-between transition-colors duration-200 font-medium py-2.5 text-sm nav-link"
                  >
                    {t('nav.services')}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {servicesDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-4 flex flex-col gap-0.5 mb-2"
                      >
                        {services.map((service) => (
                          <Link
                            key={service.slug}
                            to={`/services/${service.slug}`}
                            className="transition-colors duration-200 py-2 text-sm nav-link"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {service.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {[
                  { to: '/tarifs', label: t('nav.tarifs') },
                  { to: '/portfolio', label: t('nav.portfolio') },
                  { to: '/boutique', label: t('nav.boutique') },
                  { to: '/a-propos', label: t('nav.aPropos') },
                  { to: '/panier', label: `${t('nav.panier')}${cartCount > 0 ? ` (${cartCount})` : ''}` },
                  { to: user ? '/account' : '/login', label: user ? t('nav.account') : t('nav.login') },
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
    </header>
  );
}

export default Header;
