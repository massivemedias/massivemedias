import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getSubdomainSlug } from '../App';

// SmartLink : si l'utilisateur est sur un sous-domaine artiste (ex: gallium
// .massivemedias.com), on emet un <a href> ABSOLU vers massivemedias.com pour
// que les clics "Accueil/Services/Contact" sortent bien du sous-domaine et
// ramenent vers le site principal. Sur le domaine racine, comportement
// identique a <SmartLink> de react-router (navigation SPA rapide).
function SmartLink({ to, children, ...rest }) {
  const slug = getSubdomainSlug();
  if (slug && typeof to === 'string' && to.startsWith('/')) {
    return <a href={`https://massivemedias.com${to}`} {...rest}>{children}</a>;
  }
  return <Link to={to} {...rest}>{children}</Link>;
}
import { Menu, X, ShoppingCart, LogIn, User, Printer, Sticker, Shirt, Globe, Monitor, Store, Info, Phone, ChevronRight, ChevronDown, Bell, PenTool, Camera, Settings, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MassiveLogo from './MassiveLogo';
import { useLang } from '../i18n/LanguageContext';
import BrightnessFader from './BrightnessFader';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { STICKERS_SHOP_ENABLED } from '../config/stickersShopStatus'
import { useUserRole } from '../contexts/UserRoleContext';
import { useNotifications } from '../contexts/NotificationContext';
import { HIDDEN_SERVICE_SLUGS } from '../config/merchStatus';

const SERVICE_ICONS = [Printer, Sticker, Shirt, Globe, Monitor];

// SITE-ARCHI-02 (9 juillet 2026) : descriptifs courts des services custom pour
// le mega-menu "Services". Cle = slug. Inline ici pour rester dans Header.jsx.
const SERVICE_DESC = {
  design: { fr: 'Identité visuelle, affiches, logos', en: 'Visual identity, posters, logos', es: 'Identidad visual, afiches, logos' },
  web: { fr: 'Sites, boutiques, applications', en: 'Websites, shops, apps', es: 'Sitios, tiendas, aplicaciones' },
  stickers: { fr: 'Vinyle découpé sur mesure', en: 'Custom die-cut vinyl', es: 'Vinilo troquelado a medida' },
  merch: { fr: 'Textiles, tasses, objets', en: 'Apparel, mugs, objects', es: 'Textiles, tazas, objetos' },
};

function Header() {
  const { lang, cycleLang, t, tx } = useLang();
  const { cartCount } = useCart();
  const { user, signInWithOAuth } = useAuth();
  const { isAdmin } = useUserRole();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Ecouter l'event global pour ouvrir la modal login depuis n'importe quelle page
  useEffect(() => {
    const handler = () => setShowLoginModal(true);
    window.addEventListener('open-login-modal', handler);
    return () => window.removeEventListener('open-login-modal', handler);
  }, []);
  const { adminMsgCount } = useNotifications();
  const { pathname } = useLocation();
  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const services = t('nav.servicesList');
  const close = () => setMobileMenuOpen(false);

  // SITE-ARCHI-02 (9 juillet 2026) : nav a 3 piliers d'offre + Artistes + Suivi.
  // Barre finale : Stickers | Prints | Services (mega-menu) | Artistes | Suivi |
  // Contact. "Prints" sort du dropdown pour devenir un pilier (route inchangee
  // /services/prints) ; le mega-menu "Services" = le reste des services custom
  // en respectant les slugs caches (merch via HIDDEN_SERVICE_SLUGS). "La
  // Collection" devient le pilier "Stickers" (meme URL /stickers). "A propos"
  // quitte la barre et vit dans le footer. REGLE ABSOLUE : aucune URL ne change.
  const printsLabel = services.find((s) => s.slug === 'prints')?.name || 'Prints';
  const serviceMenu = services
    .map((s, i) => ({ ...s, Icon: SERVICE_ICONS[i] }))
    .filter((s) => s.slug !== 'prints' && !HIDDEN_SERVICE_SLUGS.includes(s.slug));
  const onServicePage = pathname.startsWith('/services') && !pathname.startsWith('/services/prints');

  // FIX-NAV-SCROLL (27 avril 2026) : helper pour scroller en haut quand on
  // re-clique sur le lien de la page courante. React Router ne re-render pas
  // un Link si pathname == to, et ScrollToTop ne se declenche que sur un vrai
  // changement de pathname. Sans ce helper, l'utilisateur reste au milieu de
  // la page (tres frustrant sur mobile apres avoir scrolle pour lire).
  // Comportement :
  //   - Si pathname === target -> preventDefault + scrollTo(0,0) smooth.
  //   - Sinon : laisse Link naviguer normalement (ScrollToTop scrollera apres).
  // Le 2eme arg `andDo` permet de chainer une action (ex: close() pour le drawer mobile).
  const navClick = (targetPath, andDo) => (e) => {
    if (pathname === targetPath) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (typeof andDo === 'function') andDo();
  };

  // Desktop: mega-menu "Services"
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesTimeoutRef = useRef(null);
  const openServices = () => {
    clearTimeout(servicesTimeoutRef.current);
    setServicesOpen(true);
  };
  const closeServices = () => {
    clearTimeout(servicesTimeoutRef.current);
    servicesTimeoutRef.current = setTimeout(() => setServicesOpen(false), 150);
  };
  // Fermer quand on change de page
  useEffect(() => { setServicesOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 header-bg">
        <nav className="mx-4 lg:mx-6 py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <SmartLink to="/" onClick={navClick('/')} className="flex items-center gap-3 flex-shrink-0">
              <MassiveLogo className="transition-colors duration-300 logo-header" />
            </SmartLink>

            {/* Navigation Desktop */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-7">
              {/* Pilier Stickers = boutique Collection (meme URL /stickers, gated) */}
              {STICKERS_SHOP_ENABLED && (
                <SmartLink
                  to="/stickers"
                  onClick={navClick('/stickers')}
                  className={`transition-colors duration-200 font-medium text-sm whitespace-nowrap ${isActive('/stickers') ? 'text-accent' : 'nav-link'}`}
                >
                  {tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })}
                </SmartLink>
              )}

              {/* Pilier Prints (route inchangee /services/prints) */}
              <SmartLink
                to="/services/prints"
                onClick={navClick('/services/prints')}
                className={`transition-colors duration-200 font-medium text-sm whitespace-nowrap ${isActive('/services/prints') ? 'text-accent' : 'nav-link'}`}
              >
                {printsLabel}
              </SmartLink>

              {/* Services : mega-menu des offres sur mesure */}
              <div
                className="relative"
                onMouseEnter={openServices}
                onMouseLeave={closeServices}
              >
                <button
                  type="button"
                  onClick={() => setServicesOpen(v => !v)}
                  className={`flex items-center gap-1 transition-colors duration-200 font-medium text-sm whitespace-nowrap ${onServicePage ? 'text-accent' : 'nav-link'}`}
                  aria-expanded={servicesOpen}
                  aria-haspopup="true"
                >
                  {tx({ fr: 'Services', en: 'Services', es: 'Servicios' })}
                  <ChevronDown size={14} className={`transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {servicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[440px] max-w-[92vw] rounded-2xl shadow-2xl shadow-black/40 p-3 z-50"
                      style={{ backgroundColor: 'var(--bg-body, #3D0079)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-grey-muted">
                        {tx({ fr: 'Sur mesure', en: 'Custom work', es: 'A medida' })}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {serviceMenu.map(({ slug, name, Icon }) => {
                          const active = isActive(`/services/${slug}`);
                          return (
                            <SmartLink
                              key={slug}
                              to={`/services/${slug}`}
                              onClick={navClick(`/services/${slug}`, () => setServicesOpen(false))}
                              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${active ? 'bg-accent/15 text-accent' : 'nav-link hover:bg-white/5'}`}
                            >
                              {Icon && (
                                <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent/10 flex-shrink-0">
                                  <Icon size={17} className="text-accent" />
                                </span>
                              )}
                              <span className="min-w-0">
                                <span className="block font-semibold text-sm leading-tight">{name}</span>
                                {SERVICE_DESC[slug] && (
                                  <span className="block text-xs mt-0.5 text-grey-muted leading-snug">{tx(SERVICE_DESC[slug])}</span>
                                )}
                              </span>
                            </SmartLink>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <SmartLink
                to="/artistes"
                onClick={navClick('/artistes')}
                className={`transition-colors duration-200 font-medium text-sm whitespace-nowrap ${isActive('/artistes') || isActive('/boutique') ? 'text-accent' : 'nav-link'}`}
              >
                {tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' })}
              </SmartLink>

              {/* NAV-01 : suivi de commande public (/tracking), page client
                  essentielle -> reste en barre primaire (decision Mika ARCHI-02). */}
              <SmartLink to="/tracking" onClick={navClick('/tracking')} className={`transition-colors duration-200 font-medium text-sm whitespace-nowrap ${isActive('/tracking') ? 'text-accent' : 'nav-link'}`}>
                {tx({ fr: 'Suivi', en: 'Tracking', es: 'Seguimiento' })}
              </SmartLink>

              <SmartLink to="/contact" onClick={navClick('/contact')} className="btn-primary text-sm !py-1 !px-3.5 whitespace-nowrap">
                {t('nav.contact')}
              </SmartLink>

              <BrightnessFader />

              <button
                onClick={cycleLang}
                className="text-sm font-semibold tracking-wide px-3 py-1.5 rounded-md transition-all duration-200 toggle-button"
                aria-label={{ fr: 'Changer la langue', en: 'Change language', es: 'Cambiar idioma' }[lang]}
              >
                {lang.toUpperCase()}
              </button>

              {user ? (
                <SmartLink
                  // FIX-ROUTING (23 avril 2026) : l'admin qui clique sur son
                  // icone engrenage dans le header public atterrit maintenant
                  // sur /admin/dashboard (vrai porte d'entree back-office) au
                  // lieu de /account (qui poussait vers le tab Profil). Si des
                  // messages admin sont en attente, on garde le shortcut
                  // historique vers /admin/messages pour traiter en priorite.
                  to={isAdmin
                    ? (adminMsgCount > 0 ? "/admin/messages" : "/admin/dashboard")
                    : "/account"}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="relative p-1 transition-colors duration-200 nav-link"
                  title={t('nav.account')}
                >
                  <span className="w-8 h-8 rounded-full bg-accent/20 text-white flex items-center justify-center font-bold text-sm">
                    {isAdmin ? (
                      <Settings size={16} />
                    ) : (() => {
                      const name = user.user_metadata?.full_name;
                      if (name) {
                        const parts = name.trim().split(' ');
                        return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
                      }
                      return (user.email || '?').substring(0, 2).toUpperCase();
                    })()}
                  </span>
                  {isAdmin && adminMsgCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/40 animate-pulse">
                      {adminMsgCount}
                    </span>
                  )}
                </SmartLink>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white text-sm font-bold transition-all duration-200 hover:brightness-110 hover:scale-105 whitespace-nowrap shadow-[0_0_20px_rgba(var(--accent-rgb,255,200,0),0.35)] animate-subtle-glow">
                  <LogIn size={16} />
                  {tx({ fr: 'Connexion', en: 'Sign in', es: 'Conectarse' })}
                </button>
              )}

              <SmartLink to="/panier" onClick={navClick('/panier')} className="relative p-2 transition-colors duration-200 nav-link" aria-label={t('nav.panier')}>
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
              </SmartLink>
            </div>

            {/* Mobile Controls - minimal: theme, lang, hamburger */}
            <div className="flex items-center gap-1.5 lg:hidden overflow-visible">
              {!user && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex-shrink-0 p-1.5 rounded-full bg-accent text-white transition-colors"
                  aria-label="Se connecter"
                >
                  <User size={18} />
                </button>
              )}
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
              className="lg:hidden fixed top-0 right-0 bottom-0 z-[60] w-[min(300px,85vw)] mobile-drawer flex flex-col h-[100dvh]"
              style={{ backgroundColor: 'var(--bg-body, #3D0079)' }}
            >
              {/* Drawer header row */}
              <div className="flex items-center justify-between px-4 py-3 border-b mobile-drawer-border flex-shrink-0">
                <SmartLink to="/" onClick={navClick('/', close)} className="flex items-center">
                  <MassiveLogo className="logo-header" />
                </SmartLink>
                <button
                  onClick={close}
                  className="p-2 rounded-lg nav-link transition-colors hover:bg-black/5"
                  aria-label={tx({ fr: 'Fermer le menu', en: 'Close menu', es: 'Cerrar menú' })}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable links */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 flex flex-col gap-0">
                {/* SITE-ARCHI-02 : Boutique (produits) */}
                <p className="mobile-drawer-label text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-1">
                  {tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' })}
                </p>

                {STICKERS_SHOP_ENABLED && (
                  <SmartLink
                    to="/stickers"
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl mobile-drawer-item group transition-colors ${isActive('/stickers') ? 'bg-accent/15 text-accent' : 'nav-link'}`}
                    onClick={navClick('/stickers', close)}
                  >
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                      <Sticker size={14} className="text-accent" />
                    </span>
                    <span className="font-semibold text-[14px]">{tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })}</span>
                    <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                  </SmartLink>
                )}

                <SmartLink
                  to="/services/prints"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl mobile-drawer-item group transition-colors ${isActive('/services/prints') ? 'bg-accent/15 text-accent' : 'nav-link'}`}
                  onClick={navClick('/services/prints', close)}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                    <Printer size={14} className="text-accent" />
                  </span>
                  <span className="font-semibold text-[14px]">{printsLabel}</span>
                  <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                </SmartLink>

                <div className="h-px mobile-drawer-sep mx-2 my-1.5" />

                {/* Services sur mesure */}
                <p className="mobile-drawer-label text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-1">
                  {tx({ fr: 'Services', en: 'Services', es: 'Servicios' })}
                </p>

                {serviceMenu.map(({ slug, name, Icon }) => {
                  const active = isActive(`/services/${slug}`);
                  return (
                    <SmartLink
                      key={slug}
                      to={`/services/${slug}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl mobile-drawer-item group transition-colors ${active ? 'bg-accent/15 text-accent' : 'nav-link'}`}
                      onClick={navClick(`/services/${slug}`, close)}
                    >
                      {Icon && (
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                          <Icon size={14} className="text-accent" />
                        </span>
                      )}
                      <span className="font-semibold text-[14px]">{name}</span>
                      <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                    </SmartLink>
                  );
                })}

                <div className="h-px mobile-drawer-sep mx-2 my-1.5" />

                {/* Decouvrir */}
                <p className="mobile-drawer-label text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-1">
                  {tx({ fr: 'Découvrir', en: 'Discover', es: 'Descubrir' })}
                </p>

                <SmartLink
                  to="/artistes"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl mobile-drawer-item group transition-colors ${(isActive('/artistes') || isActive('/boutique')) ? 'bg-accent/15 text-accent' : 'nav-link'}`}
                  onClick={navClick('/artistes', close)}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                    <Camera size={14} className="text-accent" />
                  </span>
                  <span className="font-semibold text-[14px]">{tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' })}</span>
                  <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                </SmartLink>

                {/* NAV-01 : suivi de commande, page client essentielle */}
                <SmartLink
                  to="/tracking"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl mobile-drawer-item group transition-colors ${isActive('/tracking') ? 'bg-accent/15 text-accent' : 'nav-link'}`}
                  onClick={navClick('/tracking', close)}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                    <PackageSearch size={14} className="text-accent" />
                  </span>
                  <span className="font-semibold text-[14px]">{tx({ fr: 'Suivi de commande', en: 'Order tracking', es: 'Seguimiento de pedido' })}</span>
                  <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                </SmartLink>

                <SmartLink
                  to="/panier"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl mobile-drawer-item group transition-colors ${isActive('/panier') ? 'bg-accent/15 text-accent' : 'nav-link'}`}
                  onClick={navClick('/panier', close)}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0 relative">
                    <ShoppingCart size={14} className="text-accent" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-[14px]">{tx({ fr: 'Panier', en: 'Cart', es: 'Carrito' })}</span>
                  <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                </SmartLink>

                {isAdmin && adminMsgCount > 0 && (
                  <SmartLink
                    to="/account?tab=messages"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl nav-link mobile-drawer-item group transition-colors"
                    onClick={close}
                  >
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0 relative">
                      <Bell size={14} className="text-accent" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse shadow-lg shadow-red-500/40">
                        {adminMsgCount}
                      </span>
                    </span>
                    <span className="font-semibold text-[14px]">{tx({ fr: 'Messages', en: 'Messages', es: 'Mensajes' })}</span>
                    <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                  </SmartLink>
                )}

                <div className="h-px mobile-drawer-sep mx-2 my-1.5" />

                {/* Account / Login */}
                {user ? (
                  <SmartLink
                    // FIX-ROUTING (23 avril 2026) : symetrie avec l'icone desktop -
                    // admin atterrit sur /admin/dashboard plutot que sur le tab
                    // Profil. Fallback /account pour les utilisateurs non-admin.
                    to={isAdmin ? "/admin/dashboard" : "/account"}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl mobile-drawer-item group transition-colors ${isActive(isAdmin ? '/admin' : '/account') ? 'bg-accent/15 text-accent' : 'nav-link'}`}
                    onClick={close}
                  >
                    <span className="relative flex-shrink-0">
                      <span className="w-7 h-7 rounded-full bg-accent/20 text-white flex items-center justify-center font-bold text-xs">
                        {isAdmin ? (
                          <Settings size={14} />
                        ) : (() => {
                          const name = user.user_metadata?.full_name;
                          if (name) {
                            const parts = name.trim().split(' ');
                            return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
                          }
                          return (user.email || '?').substring(0, 2).toUpperCase();
                        })()}
                      </span>
                      {isAdmin && adminMsgCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold shadow-lg shadow-red-500/40">
                          {adminMsgCount}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-[14px]">
                      {t('nav.account')}
                    </span>
                    <ChevronRight size={14} className="ml-auto opacity-25 group-hover:opacity-50 transition-opacity" />
                  </SmartLink>
                ) : (
                  <SmartLink
                    to="/login"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent text-white group transition-all hover:brightness-110 mt-1 shadow-[0_0_15px_rgba(var(--accent-rgb,255,200,0),0.3)]"
                    onClick={close}
                  >
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/20 flex-shrink-0">
                      <LogIn size={15} className="text-white" />
                    </span>
                    <span className="font-bold text-[14px]">{tx({ fr: 'Connexion / Inscription', en: 'Sign in / Register', es: 'Conectarse / Registro' })}</span>
                    <ChevronRight size={14} className="ml-auto text-white/60 group-hover:text-white transition-opacity" />
                  </SmartLink>
                )}

                {/* Contact CTA */}
                <div className="mt-2 pt-2 border-t mobile-drawer-border">
                  <SmartLink
                    to="/contact"
                    className="btn-primary w-full text-center py-2.5 font-bold flex items-center justify-center gap-2 text-[14px]"
                    onClick={navClick('/contact', close)}
                  >
                    <Phone size={15} />
                    {t('nav.contact')}
                  </SmartLink>
                </div>

                {/* Espace en bas pour safe area iOS */}
                <div className="h-10 flex-shrink-0" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Modal connexion rapide */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLoginModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[101] max-w-sm mx-auto rounded-2xl p-6 space-y-4 border border-white/10 shadow-2xl"
              style={{ background: 'var(--bg-secondary, #1a1030)' }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-heading font-heading font-bold text-lg">
                  {tx({ fr: 'Connexion rapide', en: 'Quick sign in', es: 'Conexion rapida' })}
                </h3>
                <button onClick={() => setShowLoginModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-grey-muted">
                  <X size={18} />
                </button>
              </div>

              {/* Google */}
              <button
                onClick={() => { signInWithOAuth('google'); setShowLoginModal(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {tx({ fr: 'Continuer avec Google', en: 'Continue with Google', es: 'Continuar con Google' })}
              </button>

              {/* Apple */}
              <button
                onClick={async () => {
                  const { error } = await signInWithOAuth('apple');
                  if (error) {
                    // Apple OAuth pas configure - afficher message au lieu de crash
                    alert(tx({
                      fr: 'Apple Sign In sera bientot disponible. En attendant, utilisez Google ou Email.',
                      en: 'Apple Sign In coming soon. Please use Google or Email.',
                      es: 'Apple Sign In disponible pronto. Use Google o Email.',
                    }));
                  } else {
                    setShowLoginModal(false);
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-900 transition-colors border border-white/10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                {tx({ fr: 'Continuer avec Apple', en: 'Continue with Apple', es: 'Continuar con Apple' })}
                <span className="ml-auto text-[9px] text-white/40 uppercase">{tx({ fr: 'Bientot', en: 'Soon', es: 'Pronto' })}</span>
              </button>

              {/* Separateur */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-grey-muted text-xs">{tx({ fr: 'ou', en: 'or', es: 'o' })}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Email */}
              <SmartLink
                to="/login"
                onClick={() => setShowLoginModal(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent font-semibold text-sm hover:bg-accent/20 transition-colors"
              >
                <LogIn size={16} />
                {tx({ fr: 'Connexion par email', en: 'Sign in with email', es: 'Conectarse con email' })}
              </SmartLink>

              <p className="text-grey-muted text-[10px] text-center">
                {tx({ fr: 'En continuant, vous acceptez nos conditions d\'utilisation', en: 'By continuing, you agree to our terms of service', es: 'Al continuar, acepta nuestros terminos de servicio' })}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Header;
