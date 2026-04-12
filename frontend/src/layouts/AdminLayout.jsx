import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Package, MessageSquare, Banknote,
  Users, Receipt, FileText, BarChart3, X, DollarSign,
  Pencil, Star, LayoutDashboard, StickyNote, Bot, ChevronRight, Tag,
} from 'lucide-react';
import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import Tooltip from '../components/Tooltip';

const ACCOUNT_ITEMS = [
  { to: '/account?tab=profile', icon: Pencil, fr: 'Profil', en: 'Profile', es: 'Perfil' },
];

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, fr: 'Dashboard', en: 'Dashboard', es: 'Dashboard', tooltip: { fr: 'Vue d\'ensemble de l\'activite', en: 'Activity overview', es: 'Resumen de actividad' } },
  { to: '/admin/massive-ia', icon: Bot, fr: 'ai.massive', en: 'ai.massive', es: 'ai.massive', tooltip: { fr: 'Outils IA: chat, stickers, mockups', en: 'AI tools: chat, stickers, mockups', es: 'Herramientas IA: chat, stickers, mockups' } },
  { to: '/admin/notes', icon: StickyNote, fr: 'Notes', en: 'Notes', es: 'Notas', tooltip: { fr: 'Notes internes et rappels', en: 'Internal notes and reminders', es: 'Notas internas y recordatorios' } },
  { to: '/admin/commandes', icon: ShoppingBag, fr: 'Commandes', en: 'Orders', es: 'Pedidos', tooltip: { fr: 'Gestion des commandes clients', en: 'Customer order management', es: 'Gestion de pedidos' } },
  { to: '/admin/commissions', icon: Banknote, fr: 'Commissions', en: 'Commissions', es: 'Comisiones', tooltip: { fr: 'Suivi des commissions artistes', en: 'Artist commission tracking', es: 'Seguimiento de comisiones' } },
  { to: '/admin/inventaire', icon: Package, fr: 'Inventaire', en: 'Inventory', es: 'Inventario', tooltip: { fr: 'Gestion du stock (textiles, cadres, materiel)', en: 'Stock management (textiles, frames, equipment)', es: 'Gestion de stock' } },
  { to: '/admin/messages', icon: MessageSquare, fr: 'Messages', en: 'Messages', es: 'Mensajes', tooltip: { fr: 'Messages des artistes et clients', en: 'Artist and client messages', es: 'Mensajes de artistas y clientes' } },
  { to: '/admin/utilisateurs', icon: Users, fr: 'Utilisateurs', en: 'Users', es: 'Usuarios', tooltip: { fr: 'Gestion des comptes (admin, artistes, clients)', en: 'Account management (admin, artists, clients)', es: 'Gestion de cuentas' } },
  { to: '/admin/factures', icon: FileText, fr: 'Factures', en: 'Invoices', es: 'Facturas', tooltip: { fr: 'Factures sortantes (ventes) et entrantes (achats)', en: 'Outgoing (sales) and incoming (purchases) invoices', es: 'Facturas salientes (ventas) y entrantes (compras)' } },
  { to: '/admin/temoignages', icon: Star, fr: 'Témoignages', en: 'Testimonials', es: 'Testimonios', tooltip: { fr: 'Temoignages clients affiches sur le site', en: 'Client testimonials shown on website', es: 'Testimonios de clientes' } },
  { to: '/admin/stats', icon: BarChart3, fr: 'Stats', en: 'Stats', es: 'Stats', tooltip: { fr: 'Statistiques de ventes et revenus', en: 'Sales and revenue statistics', es: 'Estadisticas de ventas' } },
  { to: '/admin/tarifs', icon: DollarSign, fr: 'Tarifs', en: 'Pricing', es: 'Precios', tooltip: { fr: 'Gestion des prix (CMS)', en: 'Price management (CMS)', es: 'Gestion de precios' } },
  { to: '/admin/promos', icon: Tag, fr: 'Codes Promo', en: 'Promo Codes', es: 'Codigos Promo', tooltip: { fr: 'Gestion des codes promotionnels', en: 'Promo code management', es: 'Gestion de codigos promocionales' } },
];

function AdminLayout() {
  const { tx } = useLang();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentNav = NAV_ITEMS.find(item => location.pathname.startsWith(item.to));
  const pageTitle = currentNav ? tx({ fr: currentNav.fr, en: currentNav.en, es: currentNav.es }) : 'Admin';
  const close = () => setMobileOpen(false);

  return (
    <section className="section-container pt-28 pb-20 min-h-screen">
      {/* Mobile title */}
      <div className="lg:hidden mb-4">
        <h1 className="text-2xl font-heading font-bold text-heading">{pageTitle}</h1>
      </div>

      {/* Sticky tab on right edge - mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-[50] bg-accent text-white px-1.5 py-4 rounded-l-lg shadow-lg shadow-accent/30"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        aria-label="Menu Admin"
      >
        <span className="text-[11px] font-bold tracking-wider uppercase">Menu Admin</span>
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
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

            {/* Drawer panel - slides from right */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-[60] w-[min(280px,80vw)] mobile-drawer flex flex-col h-[100dvh]"
              style={{ backgroundColor: 'var(--bg-body, #3D0079)' }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-3 border-b mobile-drawer-border flex-shrink-0">
                <span className="text-heading font-heading font-bold text-sm">Menu Admin</span>
                <button
                  onClick={close}
                  className="p-2 rounded-lg nav-link transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable nav */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 flex flex-col gap-0">
                {/* Mon compte */}
                <p className="mobile-drawer-label text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-1">
                  {tx({ fr: 'Mon compte', en: 'My account', es: 'Mi cuenta' })}
                </p>
                {ACCOUNT_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={close}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl mobile-drawer-item group transition-colors nav-link"
                    >
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                        <Icon size={14} className="text-accent" />
                      </span>
                      <span className="font-semibold text-[13px]">{tx({ fr: item.fr, en: item.en, es: item.es })}</span>
                      <ChevronRight size={12} className="ml-auto opacity-25" />
                    </NavLink>
                  );
                })}

                <div className="h-px mobile-drawer-sep mx-2 my-2" />

                {/* Admin */}
                <p className="mobile-drawer-label text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-1">
                  Admin
                </p>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={close}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl mobile-drawer-item group transition-colors ${isActive ? 'bg-accent/15 text-accent' : 'nav-link'}`}
                    >
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center mobile-icon-bg flex-shrink-0">
                        <Icon size={14} className="text-accent" />
                      </span>
                      <span className="font-semibold text-[13px]">{tx({ fr: item.fr, en: item.en, es: item.es })}</span>
                      <ChevronRight size={12} className="ml-auto opacity-25" />
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex gap-6 max-w-7xl mx-auto">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-48 flex-shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl bg-glass p-2 space-y-0.5 scrollbar-thin">
            <h2 className="text-[10px] font-semibold text-grey-muted uppercase tracking-wider px-2.5 py-1">
              {tx({ fr: 'Mon compte', en: 'My account', es: 'Mi cuenta' })}
            </h2>
            {ACCOUNT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 text-grey-muted hover:text-heading hover:bg-glass"
                >
                  <Icon size={14} />
                  {tx({ fr: item.fr, en: item.en, es: item.es })}
                </NavLink>
              );
            })}

            <div className="shadow-[0_-1px_0_rgba(255,255,255,0.04)] my-1" />

            <h2 className="text-[10px] font-semibold text-grey-muted uppercase tracking-wider px-2.5 py-1">
              Admin
            </h2>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--active-tab-bg)] text-white'
                      : 'text-grey-muted hover:text-heading hover:bg-glass'
                  }`}
                >
                  <Icon size={14} />
                  {tx({ fr: item.fr, en: item.en, es: item.es })}
                </NavLink>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Desktop title */}
          <h1 className="hidden lg:block text-3xl font-heading font-bold text-heading mb-6">
            {pageTitle}
          </h1>
          <Outlet />
        </main>
      </div>
    </section>
  );
}

export default AdminLayout;
