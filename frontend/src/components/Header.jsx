import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart, UserCircle, LogIn, Printer, Sticker, Shirt, Globe, Store, Info, Phone, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MassiveLogo from './MassiveLogo';
import { useLang } from '../i18n/LanguageContext';
import BrightnessFader from './BrightnessFader';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { lang, cycleLang, t, tx } = useLang();

  const { cartCount } = useCart();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const services = t('nav.servicesList');

  return (
    <>
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 header-bg">
        <nav className="mx-4 lg:mx-6 py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <MassiveLogo className="transition-colors duration-300 logo-header" />
            </Link>

            {/* Navigation Desktop */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-7">
              {/* 4 service links */}
              {services.map((service) => (
                <Link
                  key={service.slug}
                  to={`/services/${service.slug}`}
                  className="transition-colors duration-200 font-medium text-sm nav-link whitespace-nowrap"
                >
                  {service.name}
                </Link>
              ))}

              {/* Boutique */}
              <Link
                to="/boutique"
                className="transition-colors duration-200 font-medium text-sm nav-link whitespace-nowrap"
              >
                {t('nav.boutique')}
              </Link>

              <Link to="/a-propos" className="transition-colors duration-200 font-medium text-sm nav-link whitespace-nowrap">
                {t('nav.aPropos')}
              </Link>
              <Link to="/contact" className="btn-primary text-sm py-2 px-5 whitespace-nowrap">
                {t('nav.contact')}
              </Link>

              {/* Brightness Fader */}
              <BrightnessFader />

              {/* Language Toggle */}
              <button
                onClick={cycleLang}
                className="text-sm font-semibold tracking-wide px-3 py-1.5 rounded-md transition-all duration-200 toggle-button"
                aria-label={{ fr: 'Changer la langue', en: 'Change language', es: 'Cambiar idioma' }[lang]}
              >
                {lang.toUpperCase()}
              </button>

              {/* Account / Login */}
              {user ? (
                <Link to="/account" className="flex items-center gap-1.5 p-2 transition-colors duration-200 nav-link" title={t('nav.account')}>
                  <UserCircle size={20} />
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </Link>
              ) : (
                <Link to="/login" className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/60 text-accent text-sm font-semibold transition-all duration-200 hover:bg-accent hover:text-white whitespace-nowrap">
                  <LogIn size={16} />
                  {t('nav.login')}
                </Link>
              )}

              {/* Panier */}
              <Link to="/panier" className="relative p-2 transition-colors duration-200 nav-link" aria-label={t('nav.panier')}>
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <BrightnessFader />
              <button
                onClick={cycleLang}
                className="text-sm font-semibold tracking-wide px-2.5 py-1 rounded-md transition-all duration-200 toggle-button"
                aria-label={{ fr: 'Changer la langue', en: 'Change language', es: 'Cambiar idioma' }[lang]}
              >
                {lang.toUpperCase()}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 transition-colors nav-link"
                aria-label={mobileMenuOpen ? tx({ fr: 'Fermer le menu', en: 'Close menu', es: 'Cerrar men\u00fa' }) : tx({ fr: 'Ouvrir le menu', en: 'Open menu', es: 'Abrir men\u00fa' })}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu - Fullscreen overlay */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="lg:hidden fixed inset-0 top-0 z-40 mobile-menu-bg"
              >
                {/* Close zone top - matches header height */}
                <div className="h-14" />

                <nav className="flex flex-col justify-between px-6 pt-6 pb-10" style={{ height: 'calc(100dvh - 3.5rem)' }}>
                  {/* Links */}
                  <div className="flex flex-col gap-0.5">
                    {/* Services */}
                    {(() => {
                      const serviceIcons = [Printer, Sticker, Shirt, Globe];
                      return services.map((service, i) => (
                        <motion.div
                          key={service.slug}
                          initial={{ opacity: 0, x: 60 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                          transition={{ duration: 0.3, delay: i * 0.04 }}
                        >
                          <Link
                            to={`/services/${service.slug}`}
                            className="flex items-center gap-4 py-3.5 px-3 rounded-xl transition-colors duration-200 nav-link group hover:bg-white/5 active:bg-white/10"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {serviceIcons[i] && (() => { const Icon = serviceIcons[i]; return <Icon size={20} className="text-accent opacity-70 flex-shrink-0" />; })()}
                            <span className="text-lg font-heading font-semibold tracking-tight">{service.name}</span>
                            <ChevronRight size={16} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                          </Link>
                        </motion.div>
                      ));
                    })()}

                    {/* Separator */}
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.3, delay: 0.16 }}
                      className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent my-2"
                      style={{ transformOrigin: 'left' }}
                    />

                    {/* Boutique */}
                    <motion.div
                      initial={{ opacity: 0, x: 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.3, delay: 0.18 }}
                    >
                      <Link
                        to="/boutique"
                        className="flex items-center gap-4 py-3.5 px-3 rounded-xl transition-colors duration-200 nav-link group hover:bg-white/5 active:bg-white/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Store size={20} className="text-accent opacity-70 flex-shrink-0" />
                        <span className="text-lg font-heading font-semibold tracking-tight">{t('nav.boutique')}</span>
                        <ChevronRight size={16} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                      </Link>
                    </motion.div>

                    {/* A propos */}
                    <motion.div
                      initial={{ opacity: 0, x: 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.3, delay: 0.22 }}
                    >
                      <Link
                        to="/a-propos"
                        className="flex items-center gap-4 py-3.5 px-3 rounded-xl transition-colors duration-200 nav-link group hover:bg-white/5 active:bg-white/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Info size={20} className="text-accent opacity-70 flex-shrink-0" />
                        <span className="text-lg font-heading font-semibold tracking-tight">{t('nav.aPropos')}</span>
                        <ChevronRight size={16} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                      </Link>
                    </motion.div>

                    {/* Panier */}
                    <motion.div
                      initial={{ opacity: 0, x: 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.3, delay: 0.26 }}
                    >
                      <Link
                        to="/panier"
                        className="flex items-center gap-4 py-3.5 px-3 rounded-xl transition-colors duration-200 nav-link group hover:bg-white/5 active:bg-white/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ShoppingCart size={20} className="text-accent opacity-70 flex-shrink-0" />
                        <span className="text-lg font-heading font-semibold tracking-tight">{t('nav.panier')}</span>
                        {cartCount > 0 && (
                          <span className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {cartCount}
                          </span>
                        )}
                        <ChevronRight size={16} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                      </Link>
                    </motion.div>

                    {/* Separator */}
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.3, delay: 0.28 }}
                      className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent my-2"
                      style={{ transformOrigin: 'left' }}
                    />

                    {/* Account / Login */}
                    <motion.div
                      initial={{ opacity: 0, x: 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.3, delay: 0.30 }}
                    >
                      {user ? (
                        <Link
                          to="/account"
                          className="flex items-center gap-4 py-3.5 px-3 rounded-xl transition-colors duration-200 nav-link group hover:bg-white/5 active:bg-white/10"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <UserCircle size={20} className="text-accent opacity-70 flex-shrink-0" />
                          <span className="text-lg font-heading font-semibold tracking-tight">
                            {user.user_metadata?.full_name?.split(' ')[0] || t('nav.account')}
                          </span>
                          <ChevronRight size={16} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                        </Link>
                      ) : (
                        <Link
                          to="/login"
                          className="flex items-center gap-4 py-3.5 px-3 rounded-xl transition-colors duration-200 nav-link group hover:bg-white/5 active:bg-white/10"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LogIn size={20} className="text-accent opacity-70 flex-shrink-0" />
                          <span className="text-lg font-heading font-semibold tracking-tight text-accent">{t('nav.login')}</span>
                          <ChevronRight size={16} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                        </Link>
                      )}
                    </motion.div>
                  </div>

                  {/* Contact button - bottom */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                  >
                    <Link
                      to="/contact"
                      className="btn-primary w-full text-center text-base py-3.5 font-heading font-bold tracking-tight flex items-center justify-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Phone size={18} />
                      {t('nav.contact')}
                    </Link>
                  </motion.div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>
    </>
  );
}

export default Header;
