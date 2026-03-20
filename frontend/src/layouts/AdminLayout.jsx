import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Package, MessageSquare, Banknote,
  Users, Receipt, BarChart3, Menu, X, DollarSign,
  Pencil, MapPin, Shield, Star, LayoutDashboard, StickyNote,
} from 'lucide-react';
import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

const ACCOUNT_ITEMS = [
  { to: '/account?tab=profile', icon: Pencil, fr: 'Profil', en: 'Profile', es: 'Perfil' },
  { to: '/account?tab=address', icon: MapPin, fr: 'Adresse', en: 'Address', es: 'Direccion' },
  { to: '/account?tab=security', icon: Shield, fr: 'Sécurité', en: 'Security', es: 'Seguridad' },
];

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, fr: 'Dashboard', en: 'Dashboard', es: 'Dashboard' },
  { to: '/admin/notes', icon: StickyNote, fr: 'Notes', en: 'Notes', es: 'Notas' },
  { to: '/admin/commandes', icon: ShoppingBag, fr: 'Commandes', en: 'Orders', es: 'Pedidos' },
  { to: '/admin/commissions', icon: Banknote, fr: 'Commissions', en: 'Commissions', es: 'Comisiones' },
  { to: '/admin/inventaire', icon: Package, fr: 'Inventaire', en: 'Inventory', es: 'Inventario' },
  { to: '/admin/messages', icon: MessageSquare, fr: 'Messages', en: 'Messages', es: 'Mensajes' },
  { to: '/admin/utilisateurs', icon: Users, fr: 'Utilisateurs', en: 'Users', es: 'Usuarios' },
  { to: '/admin/depenses', icon: Receipt, fr: 'Dépenses', en: 'Expenses', es: 'Gastos' },
  { to: '/admin/temoignages', icon: Star, fr: 'Témoignages', en: 'Testimonials', es: 'Testimonios' },
  { to: '/admin/stats', icon: BarChart3, fr: 'Stats', en: 'Stats', es: 'Stats' },
  { to: '/admin/tarifs', icon: DollarSign, fr: 'Tarifs', en: 'Pricing', es: 'Precios' },
];

function AdminLayout() {
  const { tx } = useLang();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentNav = NAV_ITEMS.find(item => location.pathname.startsWith(item.to));
  const pageTitle = currentNav ? tx({ fr: currentNav.fr, en: currentNav.en, es: currentNav.es }) : 'Admin';

  return (
    <section className="section-container pt-28 pb-20 min-h-screen">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <h1 className="text-2xl font-heading font-bold text-heading">{pageTitle}</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-glass text-heading"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden flex flex-wrap gap-2 mb-6"
        >
          {ACCOUNT_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-glass text-grey-muted hover:text-heading"
              >
                <Icon size={14} />
                {tx({ fr: item.fr, en: item.en, es: item.es })}
              </NavLink>
            );
          })}
          <div className="w-full shadow-[0_-1px_0_rgba(255,255,255,0.04)] mt-1 pt-2" />
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'bg-glass text-grey-muted hover:text-heading'
                }`}
              >
                <Icon size={14} />
                {tx({ fr: item.fr, en: item.en, es: item.es })}
              </NavLink>
            );
          })}
        </motion.div>
      )}

      <div className="flex gap-6 max-w-7xl mx-auto">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-28 rounded-xl bg-glass p-3 space-y-1">
            <h2 className="text-xs font-semibold text-grey-muted uppercase tracking-wider px-3 py-2">
              {tx({ fr: 'Mon compte', en: 'My account', es: 'Mi cuenta' })}
            </h2>
            {ACCOUNT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-grey-muted hover:text-heading hover:bg-glass"
                >
                  <Icon size={16} />
                  {tx({ fr: item.fr, en: item.en, es: item.es })}
                </NavLink>
              );
            })}

            <div className="shadow-[0_-1px_0_rgba(255,255,255,0.04)] my-2" />

            <h2 className="text-xs font-semibold text-grey-muted uppercase tracking-wider px-3 py-2">
              Admin
            </h2>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-accent/20 text-accent'
                      : 'text-grey-muted hover:text-heading hover:bg-glass'
                  }`}
                >
                  <Icon size={16} />
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
