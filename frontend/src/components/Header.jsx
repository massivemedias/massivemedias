import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, ShoppingCart, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MassiveLogoDark from '../assets/massive-logo.svg';
import MassiveLogoLight from '../assets/massive-logo-light.png';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';

function Header() {
  const { lang, toggleLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  const services = t('nav.servicesList');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300" style={{ background: 'var(--bg-header)', backdropFilter: 'blur(16px)' }}>
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={theme === 'light' ? MassiveLogoLight : MassiveLogoDark} 
              alt="Massive Medias" 
              className="transition-opacity duration-300"
              style={{ width: '149px', height: '36px' }}
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
              <button className="flex items-center gap-1 transition-colors duration-200 font-medium text-sm" style={{ color: 'var(--nav-text)' }}>
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
                    className="absolute top-full left-0 mt-2 w-56 rounded-lg overflow-hidden"
                    style={{ background: 'var(--header-dropdown-bg)', boxShadow: 'var(--header-dropdown-shadow)', border: '1px solid var(--header-border)' }}
                  >
                    {services.map((service) => (
                      <Link
                        key={service.slug}
                        to={`/services/${service.slug}`}
                        className="block px-5 py-2.5 text-sm transition-colors duration-150"
                        style={{ color: 'var(--nav-text)', borderBottom: '1px solid var(--header-border)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--header-item-hover)'; e.currentTarget.style.color = 'var(--nav-text-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--nav-text)'; }}
                      >
                        {service.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/tarifs" className="transition-colors duration-200 font-medium text-sm" style={{ color: 'var(--nav-text)' }}>
              {t('nav.tarifs')}
            </Link>
            <Link to="/portfolio" className="transition-colors duration-200 font-medium text-sm" style={{ color: 'var(--nav-text)' }}>
              {t('nav.portfolio')}
            </Link>
            <Link to="/boutique" className="transition-colors duration-200 font-medium text-sm" style={{ color: 'var(--nav-text)' }}>
              {t('nav.boutique')}
            </Link>
            <Link to="/a-propos" className="transition-colors duration-200 font-medium text-sm" style={{ color: 'var(--nav-text)' }}>
              {t('nav.aPropos')}
            </Link>
            <Link to="/contact" className="btn-primary text-sm py-2 px-5">
              {t('nav.contact')}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md transition-all duration-200"
              style={{ color: 'var(--toggle-text)', border: '1px solid var(--toggle-border)' }}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="text-sm font-semibold tracking-wide px-3 py-1.5 rounded-md transition-all duration-200"
              style={{ color: 'var(--toggle-text)', border: '1px solid var(--toggle-border)' }}
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Panier */}
            <Link to="/panier" className="relative p-2 transition-colors duration-200" style={{ color: 'var(--nav-text)' }}>
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-magenta text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                0
              </span>
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md transition-all duration-200"
              style={{ color: 'var(--toggle-text)', border: '1px solid var(--toggle-border)' }}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={toggleLang}
              className="text-sm font-semibold tracking-wide px-2.5 py-1 rounded-md transition-all duration-200"
              style={{ color: 'var(--toggle-text)', border: '1px solid var(--toggle-border)' }}
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 transition-colors"
              style={{ color: 'var(--nav-text)' }}
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
              className="lg:hidden mt-3 overflow-hidden pt-4"
              style={{ borderTop: '1px solid var(--header-border)' }}
            >
              <div className="flex flex-col gap-1">
                <div>
                  <button 
                    onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                    className="w-full flex items-center justify-between transition-colors duration-200 font-medium py-2.5 text-sm"
                    style={{ color: 'var(--nav-text)' }}
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
                            className="transition-colors duration-200 py-2 text-sm"
                            style={{ color: 'var(--nav-text)' }}
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
                  { to: '/panier', label: `${t('nav.panier')} (0)` },
                ].map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="transition-colors duration-200 font-medium py-2.5 text-sm"
                    style={{ color: 'var(--nav-text)' }}
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
