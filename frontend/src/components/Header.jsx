import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart, LogIn, Printer, Sticker, Shirt, Globe, Store, Info, Phone, ChevronRight, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MassiveLogo from './MassiveLogo';
import { useLang } from '../i18n/LanguageContext';
import BrightnessFader from './BrightnessFader';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { getContactSubmissions, getArtistSubmissions } from '../services/adminService';
import { getArtistMessagesAdmin } from '../services/artistService';

const SERVICE_ICONS = [Printer, Sticker, Shirt, Globe];

function Header() {
  const { lang, cycleLang, t, tx } = useLang();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMsgCount, setAdminMsgCount] = useState(0);
  const prevCountRef = useRef(0);

  // Son de notification admin (Web Audio API - pas de fichier externe)
  const playNotifSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Double beep sympathique
      [0, 0.15].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = delay === 0 ? 880 : 1100;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.15);
      });
    } catch { /* Audio not supported */ }
  }, []);

  // Polling notifications admin
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function fetchCount() {
      try {
        const [contactRes, artistRes, artistMsgRes] = await Promise.all([
          getContactSubmissions({ pageSize: 200 }),
          getArtistSubmissions({ pageSize: 200 }),
          getArtistMessagesAdmin(),
        ]);
        const contacts = contactRes?.data?.data || [];
        const artists = artistRes?.data?.data || [];
        const artistMsgs = artistMsgRes?.data?.data || [];
        const count = contacts.filter(c => (c.status || 'new') === 'new').length
          + artists.filter(a => (a.status || 'new') === 'new').length
          + artistMsgs.filter(m => (m.status || 'new') === 'new').length;
        if (!cancelled) {
          // Jouer le son si le count augmente (nouveau message)
          if (count > prevCountRef.current && prevCountRef.current !== 0) {
            playNotifSound();
          }
          prevCountRef.current = count;
          setAdminMsgCount(count);
        }
      } catch { /* ignore */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAdmin, playNotifSound]);

  const services = t('nav.servicesList');
  const close = () => setMobileMenuOpen(false);

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
              {services.map((service) => (
                <Link
                  key={service.slug}
                  to={`/services/${service.slug}`}
                  className="transition-colors duration-200 font-medium text-sm nav-link whitespace-nowrap"
                >
                  {service.name}
                </Link>
              ))}

              <Link to="/boutique" className="transition-colors duration-200 font-medium text-sm nav-link whitespace-nowrap">
                {t('nav.boutique')}
              </Link>

              <Link to="/a-propos" className="transition-colors duration-200 font-medium text-sm nav-link whitespace-nowrap">
                {t('nav.aPropos')}
              </Link>

              <Link to="/contact" className="btn-primary text-sm py-2 px-5 whitespace-nowrap">
                {t('nav.contact')}
              </Link>

              <BrightnessFader />

              <button
                onClick={cycleLang}
                className="text-sm font-semibold tracking-wide px-3 py-1.5 rounded-md transition-all duration-200 toggle-button"
                aria-label={{ fr: 'Changer la langue', en: 'Change language', es: 'Cambiar idioma' }[lang]}
              >
                {lang.toUpperCase()}
              </button>

              {user ? (
                <Link to="/account" className="flex items-center gap-1.5 p-1 transition-colors duration-200 nav-link" title={t('nav.account')}>
                  <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                  </span>
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </Link>
              ) : (
                <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white text-sm font-bold transition-all duration-200 hover:brightness-110 hover:scale-105 whitespace-nowrap shadow-[0_0_20px_rgba(var(--accent-rgb,255,200,0),0.35)] animate-subtle-glow">
                  <LogIn size={16} />
                  {tx({ fr: 'Connexion / Inscription', en: 'Sign in / Register', es: 'Conectarse / Registro' })}
                </Link>
              )}

              {isAdmin && adminMsgCount > 0 && (
                <Link to="/account?tab=messages" className="relative p-2 transition-colors duration-200 nav-link" aria-label="Messages admin">
                  <Bell size={18} />
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold animate-pulse">
                    {adminMsgCount}
                  </span>
                </Link>
              )}

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

            {/* Mobile Controls - minimal: theme, lang, hamburger */}
            <div className="flex items-center gap-1.5 lg:hidden overflow-visible">
              <BrightnessFader />
              <button
                onClick={cycleLang}
                className="flex-shrink-0 text-sm font-semibold tracking-wide px-2 py-1 rounded-md transition-all duration-200 toggle-button"
                aria-label={{ fr: 'Changer la langue', en: 'Change language', es: 'Cambiar idioma' }[lang]}
              >
                {lang.toUpperCase()}
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex-shrink-0 relative p-1.5 transition-colors nav-link"
                aria-label={tx({ fr: 'Ouvrir le menu', en: 'Open menu', es: 'Abrir menú' })}
              >
                <Menu size={24} />
                {(adminMsgCount > 0 || cartCount > 0) && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold animate-pulse">
                    {adminMsgCount + cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Mobile Drawer - outside header to avoid z-index issues ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="lg:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-[2px]"
              onClick={close}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-[60] w-[min(300px,85vw)] mobile-drawer flex flex-col"
              style={{ backgroundColor: 'var(--bg-body, #3D0079)' }}
            >
              {/* Drawer header row */}
              <div className="flex items-center justify-between px-4 py-3 border-b mobile-drawer-border flex-shrink-0">
                <Link to="/" onClick={close} className="flex items-center">
                  <MassiveLogo className="logo-header" />
                </Link>
                <button
                  onClick={close}
                  className="p-2 rounded-lg nav-link transition-colors hover:bg-black/5"
                  aria-label={tx({ fr: 'Fermer le menu', en: 'Close menu', es: 'Cerrar menú' })}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable links */}
              <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
                {/* Services */}
                <p className="mobile-drawer-label text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-1.5">
                  Services
                </p>

                {services.map((service, i) => {
                  const Icon = SERVICE_ICONS[i];
                  return (
                    <Link
                      key={service.slug}
                      to={`/services/${service.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl nav-link mobile-drawer-item group transition-colors"
                      onClick={close}
                    >
                      {Icon && (
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                          <Icon size={15} className="text-accent" />
                        </span>
                      )}
                      <span className="font-semibold text-[15px]">{service.name}</span>
                      <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                    </Link>
                  );
                })}

                <div className="h-px mobile-drawer-sep mx-2 my-2.5" />

                {/* Boutique */}
                <Link
                  to="/boutique"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl nav-link mobile-drawer-item group transition-colors"
                  onClick={close}
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                    <Store size={15} className="text-accent" />
                  </span>
                  <span className="font-semibold text-[15px]">{t('nav.boutique')}</span>
                  <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                </Link>

                {/* A propos */}
                <Link
                  to="/a-propos"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl nav-link mobile-drawer-item group transition-colors"
                  onClick={close}
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                    <Info size={15} className="text-accent" />
                  </span>
                  <span className="font-semibold text-[15px]">{t('nav.aPropos')}</span>
                  <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                </Link>

                {/* Panier */}
                <Link
                  to="/panier"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl nav-link mobile-drawer-item group transition-colors"
                  onClick={close}
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0 relative">
                    <ShoppingCart size={15} className="text-accent" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-[15px]">{tx({ fr: 'Panier', en: 'Cart', es: 'Carrito' })}</span>
                  <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                </Link>

                {isAdmin && adminMsgCount > 0 && (
                  <Link
                    to="/account?tab=messages"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl nav-link mobile-drawer-item group transition-colors"
                    onClick={close}
                  >
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0 relative">
                      <Bell size={15} className="text-accent" />
                      <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                        {adminMsgCount}
                      </span>
                    </span>
                    <span className="font-semibold text-[15px]">{tx({ fr: 'Messages', en: 'Messages', es: 'Mensajes' })}</span>
                    <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                  </Link>
                )}

                <div className="h-px mobile-drawer-sep mx-2 my-2.5" />

                {/* Account / Login */}
                {user ? (
                  <Link
                    to="/account"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl nav-link mobile-drawer-item group transition-colors"
                    onClick={close}
                  >
                    <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                    </span>
                    <span className="font-semibold text-[15px]">
                      {user.user_metadata?.full_name?.split(' ')[0] || t('nav.account')}
                    </span>
                    <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-accent text-white group transition-all hover:brightness-110 mt-2 shadow-[0_0_20px_rgba(var(--accent-rgb,255,200,0),0.3)]"
                    onClick={close}
                  >
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/20 flex-shrink-0">
                      <LogIn size={18} className="text-white" />
                    </span>
                    <div>
                      <span className="font-bold text-[15px] block">{tx({ fr: 'Connexion / Inscription', en: 'Sign in / Register', es: 'Conectarse / Registro' })}</span>
                      <span className="text-[11px] text-white/70">{tx({ fr: 'Google, Apple ou email', en: 'Google, Apple or email', es: 'Google, Apple o email' })}</span>
                    </div>
                    <ChevronRight size={14} className="ml-auto text-white/60 group-hover:text-white transition-opacity" />
                  </Link>
                )}
              </div>

              {/* Contact CTA - pinned bottom */}
              <div className="px-4 pt-3 pb-8 flex-shrink-0 border-t mobile-drawer-border">
                <Link
                  to="/contact"
                  className="btn-primary w-full text-center py-3 font-bold flex items-center justify-center gap-2 text-[15px]"
                  onClick={close}
                >
                  <Phone size={17} />
                  {t('nav.contact')}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Header;
