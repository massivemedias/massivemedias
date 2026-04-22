import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Menu, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import NAV_ITEMS from '../data/adminNav';
// FIX-UI (avril 2026) : on importe ACCOUNT_ITEMS qui etait referencee dans le
// drawer mobile mais jamais importee -> ReferenceError au click sur le menu
// mobile -> drawer ne se montait plus et l'admin voyait un amas de fragments.
import { AdminSidebarNav, ACCOUNT_ITEMS } from '../components/AdminSidebar';

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
  const totalBadge = (notifs.messagesOnlyCount || 0) + (notifs.newOrdersCount || 0) + (notifs.newUsersCount || 0);

  return (
    <section className="section-container pt-28 pb-20 min-h-screen">
      {/* FIX-UI (avril 2026) : header mobile = titre a gauche + bouton Menu Admin
          a droite avec icone hamburger + texte. Plus lisible que l'ancienne
          languette verticale en bord d'ecran qu'on louchait pour deviner. */}
      <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-heading font-bold text-heading truncate">{pageTitle}</h1>
        <button
          onClick={() => setMobileOpen(true)}
          className="relative flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm shadow-lg shadow-accent/30 hover:brightness-110 transition-all active:scale-95"
          aria-label={tx({ fr: 'Ouvrir le menu admin', en: 'Open admin menu', es: 'Abrir menu admin' })}
        >
          <Menu size={18} />
          <span>{tx({ fr: 'Menu Admin', en: 'Admin Menu', es: 'Menu Admin' })}</span>
          {totalBadge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/40 flex items-center justify-center animate-pulse">
              {totalBadge}
            </span>
          )}
        </button>
      </div>

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
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b mobile-drawer-border flex-shrink-0">
                <span className="text-heading font-heading font-bold text-sm">Menu Admin</span>
                <div className="flex items-center gap-1">
                  {/* FIX-NOTIF (avril 2026) : "Tout marquer comme lu" pour que
                      l'admin puisse effacer d'un coup les 2+ items fantomes sans
                      avoir a rouvrir chaque conversation. Visible seulement si
                      au moins une notification rouge. */}
                  {totalBadge > 0 && (
                    <button
                      onClick={() => { notifs.markAllViewed(); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
                      aria-label={tx({ fr: 'Tout marquer comme lu', en: 'Mark all as read', es: 'Marcar todo como leido' })}
                    >
                      <CheckCheck size={12} />
                      <span>{tx({ fr: 'Tout lu', en: 'Mark read', es: 'Marcar leido' })}</span>
                    </button>
                  )}
                  <button
                    onClick={close}
                    className="p-2 rounded-lg nav-link transition-colors"
                    aria-label="Fermer"
                  >
                    <X size={18} />
                  </button>
                </div>
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

      <div className="flex items-start gap-6 max-w-7xl mx-auto">
        {/* Sidebar desktop - composant partage.
            FIX-UX (avril 2026) : sidebar sticky au scroll pour que l'admin garde
            toujours le menu a porte, meme sur une page longue. `self-start` pour
            que l'aside ne s'etire pas a la hauteur de main (sinon sticky n'a plus
            de sens), `max-h-[calc(100vh-7rem)]` pour qu'elle tienne dans le
            viewport sous le header fixe, `overflow-y-auto` pour scroller a
            l'interieur si la liste est plus longue que l'ecran. */}
        <aside className="hidden lg:block w-48 flex-shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
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
