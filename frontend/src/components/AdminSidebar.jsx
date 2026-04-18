/**
 * SOURCE UNIQUE du sidebar admin.
 * Utilise dans AdminLayout.jsx ET Account.jsx.
 * Pour changer le style du menu: modifier ICI et nulle part ailleurs.
 */
import { NavLink } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import NAV_ITEMS from '../data/adminNav';

/**
 * Map route -> count key pour afficher un badge sur l'item de menu.
 * messagesOnlyCount = contacts/artist-submissions/artist-msgs
 * newOrdersCount = commandes depuis derniere visite
 * newUsersCount = users depuis derniere visite
 */
function getBadgeCount(route, notifs) {
  if (route === '/admin/messages') return notifs.messagesOnlyCount || 0;
  if (route === '/admin/commandes') return notifs.newOrdersCount || 0;
  if (route === '/admin/utilisateurs') return notifs.newUsersCount || 0;
  return 0;
}

function NotifBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/40 animate-pulse">
      {count}
    </span>
  );
}

const ACCOUNT_ITEMS = [
  { to: '/account?tab=profile', icon: Pencil, fr: 'Profil', en: 'Profile', es: 'Perfil' },
];

// --- Styles constants (single source of truth) ---
const SIDEBAR_CLASSES = 'sticky top-20 rounded-xl bg-glass p-3 space-y-1';
const SECTION_TITLE_CLASSES = 'text-[11px] font-semibold text-grey-muted uppercase tracking-wider px-2.5 py-1.5';
const LINK_BASE_CLASSES = 'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200';
const LINK_ACTIVE_CLASSES = 'bg-[var(--active-tab-bg)] text-white';
const LINK_INACTIVE_CLASSES = 'text-grey-muted hover:text-heading hover:bg-glass';
const ICON_SIZE = 16;

/**
 * Sidebar pour les pages admin (NavLink-based, route matching)
 * @param {object} props
 * @param {string} props.currentPath - location.pathname
 * @param {number} [props.msgCount] - nombre de messages non-lus (badge)
 */
export function AdminSidebarNav({ currentPath, msgCount = 0 }) {
  const { tx } = useLang();
  const notifs = useNotifications();

  return (
    <div className={SIDEBAR_CLASSES}>
      <h2 className={SECTION_TITLE_CLASSES}>
        {tx({ fr: 'Mon compte', en: 'My account', es: 'Mi cuenta' })}
      </h2>
      {ACCOUNT_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`${LINK_BASE_CLASSES} ${LINK_INACTIVE_CLASSES}`}
          >
            <Icon size={ICON_SIZE} />
            {tx({ fr: item.fr, en: item.en, es: item.es })}
          </NavLink>
        );
      })}

      <div className="shadow-[0_-1px_0_rgba(255,255,255,0.04)] my-2" />

      <h2 className={SECTION_TITLE_CLASSES}>Admin</h2>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath.startsWith(item.to);
        // Prop msgCount retrocompatible (utilise uniquement sur /admin/messages si fourni)
        const badge = item.to === '/admin/messages' && msgCount
          ? msgCount
          : getBadgeCount(item.to, notifs);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`${LINK_BASE_CLASSES} ${isActive ? LINK_ACTIVE_CLASSES : LINK_INACTIVE_CLASSES}`}
          >
            <Icon size={ICON_SIZE} />
            {tx({ fr: item.fr, en: item.en, es: item.es })}
            <NotifBadge count={badge} />
          </NavLink>
        );
      })}
    </div>
  );
}

/**
 * Sidebar pour Account.jsx (button-based, tab matching)
 * @param {object} props
 * @param {string} props.activeTab - current active tab id
 * @param {function} props.onSetTab - handler to change tab
 * @param {Array} props.accountItems - account sidebar items [{id, label, icon}]
 * @param {Array} props.adminItems - admin nav items from adminNav.js
 * @param {number} [props.msgCount] - nombre de messages non-lus
 */
export function AccountSidebarNav({ activeTab, onSetTab, accountItems, adminItems, msgCount = 0 }) {
  const { tx } = useLang();
  const notifs = useNotifications();

  return (
    <div className={SIDEBAR_CLASSES}>
      <h2 className={SECTION_TITLE_CLASSES}>
        {tx({ fr: 'Mon compte', en: 'My account', es: 'Mi cuenta' })}
      </h2>
      {accountItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSetTab(item.id)}
            className={`w-full ${LINK_BASE_CLASSES} ${isActive ? LINK_ACTIVE_CLASSES : LINK_INACTIVE_CLASSES}`}
          >
            <Icon size={ICON_SIZE} />
            {item.label}
          </button>
        );
      })}

      <div className="shadow-[0_-1px_0_rgba(255,255,255,0.04)] my-2" />

      <h2 className={SECTION_TITLE_CLASSES}>Admin</h2>
      {adminItems.map((item) => {
        const Icon = item.icon;
        const badge = item.to === '/admin/messages' && msgCount
          ? msgCount
          : getBadgeCount(item.to, notifs);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${LINK_BASE_CLASSES} relative ${isActive ? LINK_ACTIVE_CLASSES : LINK_INACTIVE_CLASSES}`}
          >
            <Icon size={ICON_SIZE} />
            {tx({ fr: item.fr, en: item.en, es: item.es })}
            <NotifBadge count={badge} />
          </NavLink>
        );
      })}
    </div>
  );
}

export { ACCOUNT_ITEMS, NAV_ITEMS as ADMIN_NAV_ITEMS };
export default AdminSidebarNav;
