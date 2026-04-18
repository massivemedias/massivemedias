import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import Tooltip from '../components/Tooltip';
import NAV_ITEMS from '../data/adminNav';
import { AdminSidebarNav } from '../components/AdminSidebar';

function getDrawerBadge(route, notifs) {
  if (route === '/admin/messages') return notifs.messagesOnlyCount || 0;
  if (route === '/admin/commandes') return notifs.newOrdersCount || 0;
  if (route === '/admin/utilisateurs') return notifs.newUsersCount || 0;
  return 0;
}

function AdminLayout() {
  const { tx } = useLang();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifs = useNotifications();

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
                  const badge = getDrawerBadge(item.to, notifs);
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
                      {badge > 0 ? (
                        <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/40 animate-pulse">
                          {badge}
                        </span>
                      ) : (
                        <ChevronRight size={12} className="ml-auto opacity-25" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex gap-6 max-w-7xl mx-auto">
        {/* Sidebar desktop - composant partage */}
        <aside className="hidden lg:block w-48 flex-shrink-0">
          <AdminSidebarNav currentPath={location.pathname} />
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
