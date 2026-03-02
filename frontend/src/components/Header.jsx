import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart, UserCircle, Printer, Sticker, Shirt, Palette, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MassiveLogo from './MassiveLogo';
import { useLang } from '../i18n/LanguageContext';
import BrightnessFader from './BrightnessFader';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { thumb } from '../utils/paths';

const boutiqueItems = [
  { slug: 'stickers', icon: Sticker, image: thumb('/images/stickers/StickersHero.webp'), fr: 'Stickers', en: 'Stickers', descFr: 'Autocollants custom pour createurs', descEn: 'Custom stickers for creators' },
  { slug: 'fine-art', icon: Printer, image: thumb('/images/prints/PrintsHero.webp'), fr: 'Prints', en: 'Prints', descFr: 'Fine art, flyers, cartes d\'affaires', descEn: 'Fine art, flyers, business cards' },
  { slug: 'sublimation', icon: Shirt, image: thumb('/images/textile/MerchHero.webp'), fr: 'Merch', en: 'Merch', descFr: 'T-shirts, hoodies, sacs, mugs', descEn: 'T-shirts, hoodies, bags, mugs' },
  { slug: 'design', icon: Palette, image: thumb('/images/graphism/GraphicDesignHero.webp'), fr: 'Design', en: 'Design', descFr: 'Logos, identite visuelle', descEn: 'Logos, visual identity' },
  { slug: 'web', icon: Globe, image: thumb('/images/web/DevWebHero.webp'), fr: 'Web', en: 'Web', descFr: 'Sites web sur mesure', descEn: 'Custom websites' },
];

function Header() {
  const { lang, toggleLang, t } = useLang();

  const { cartCount } = useCart();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef(null);
  const megaTimeout = useRef(null);

  const services = t('nav.servicesList');

  // Close mega-menu when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (megaRef.current && !megaRef.current.contains(e.target)) {
        setMegaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMegaEnter = () => {
    clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  };
  const handleMegaLeave = () => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 200);
  };

  return (
    <>
      {/* ── Header ── */}
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

              {/* Boutique with mega-menu */}
              <div
                ref={megaRef}
                className="relative"
                onMouseEnter={handleMegaEnter}
                onMouseLeave={handleMegaLeave}
              >
                <Link
                  to="/boutique"
                  className="transition-colors duration-200 font-medium text-sm nav-link"
                >
                  {t('nav.boutique')}
                </Link>

                <AnimatePresence>
                  {megaOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-[600px] rounded-xl overflow-hidden mega-menu-bg"
                      onMouseEnter={handleMegaEnter}
                      onMouseLeave={handleMegaLeave}
                    >
                      <div className="grid grid-cols-2 gap-1 p-3">
                        {boutiqueItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.slug}
                              to={`/boutique/${item.slug}`}
                              className="flex items-center gap-3 p-3 rounded-lg mega-menu-item transition-colors"
                              onClick={() => setMegaOpen(false)}
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-heading flex items-center gap-1.5">
                                  <Icon size={14} className="text-accent flex-shrink-0" />
                                  {lang === 'fr' ? item.fr : item.en}
                                </div>
                                <div className="text-xs text-grey-muted truncate">
                                  {lang === 'fr' ? item.descFr : item.descEn}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <div className="px-3 pb-3">
                        <Link
                          to="/boutique"
                          className="block text-center text-xs font-semibold text-accent py-2.5 rounded-lg mega-menu-cta transition-colors"
                          onClick={() => setMegaOpen(false)}
                        >
                          {lang === 'fr' ? 'Voir toute la boutique' : 'View all products'}
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
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
                onClick={toggleLang}
                className="text-sm font-semibold tracking-wide px-2.5 py-1 rounded-md transition-all duration-200 toggle-button"
                aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
              >
                {lang === 'fr' ? 'EN' : 'FR'}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 transition-colors nav-link"
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
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

                  {/* Boutique sub-items on mobile */}
                  <div className="py-2">
                    <Link
                      to="/boutique"
                      className="transition-colors duration-200 font-semibold py-2.5 text-sm nav-link block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.boutique')}
                    </Link>
                    <div className="grid grid-cols-2 gap-2 mt-2 ml-2">
                      {boutiqueItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.slug}
                            to={`/boutique/${item.slug}`}
                            className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs nav-link mega-menu-item transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon size={14} className="text-accent flex-shrink-0" />
                            <span className="font-medium">{lang === 'fr' ? item.fr : item.en}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {[
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
      </header>
    </>
  );
}

export default Header;
