import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useUserRole } from './UserRoleContext';
import { getContactSubmissions, getArtistSubmissions, getOrders } from '../services/adminService';
import { getArtistMessagesAdmin } from '../services/artistService';
import { getUserRoles } from '../services/userRoleService';
import { isServerDown } from '../services/api';

const NotificationContext = createContext(null);

// Helpers localStorage pour "vu jusqu'a"
function getLastViewed(key) {
  try {
    const v = parseInt(localStorage.getItem(key) || '0', 10);
    if (!v) {
      // Premier acces: setter a maintenant pour ne pas flasher tous les items existants
      const now = Date.now();
      localStorage.setItem(key, String(now));
      return now;
    }
    return v;
  } catch { return Date.now(); }
}
function setLastViewed(key) {
  try { localStorage.setItem(key, String(Date.now())); } catch { /* ignore */ }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [adminMsgCount, setAdminMsgCount] = useState(0); // total (messages + commandes + users)
  const [messagesOnlyCount, setMessagesOnlyCount] = useState(0); // uniquement messages/soumissions/artist-msgs
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const prevCountRef = useRef(0);

  // Son de notification
  const playNotifSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
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

  // FIX-FOCUS-SYNC (27 avril 2026) : throttle minimal entre 2 fetchNotifs.
  // Quand l'utilisateur switche rapidement entre apps mobile (Safari +
  // Mail + Massive en boucle), on declenchait visibilitychange ET focus
  // ET online en quelques ms - 3 fetch consecutifs identiques. On limite
  // a 1 fetch toutes les 5 secondes max (suffisant pour qu'un changement
  // serveur soit visible).
  const lastFetchAtRef = useRef(0);
  const MIN_FETCH_INTERVAL_MS = 5000;

  const fetchNotifs = useCallback(async ({ force = false } = {}) => {
    if (!isAdmin || isServerDown()) return;
    // Throttle : ignore si le dernier fetch date de moins de 5s, SAUF si force=true.
    // Les actions manuelles (markXxxViewed, refreshNotifs) passent force=true pour
    // garantir un refetch instantane apres un reset optimiste local.
    const now = Date.now();
    if (!force && now - lastFetchAtRef.current < MIN_FETCH_INTERVAL_MS) return;
    lastFetchAtRef.current = now;
    try {
      const [contactRes, artistRes, artistMsgRes, usersRes, ordersRes] = await Promise.all([
        getContactSubmissions({ pageSize: 200 }),
        getArtistSubmissions({ pageSize: 200 }),
        getArtistMessagesAdmin(),
        getUserRoles(),
        getOrders({ pageSize: 200 }),
      ]);
      const contacts = contactRes?.data?.data || [];
      const artists = artistRes?.data?.data || [];
      const artistMsgs = artistMsgRes?.data?.data || [];
      const userRoles = usersRes?.data?.data || [];
      const orders = ordersRes?.data?.data || [];

      // Nouveaux users et commandes depuis la derniere visite admin
      const lastUsersAt = getLastViewed('lastViewedUsersAt');
      const lastOrdersAt = getLastViewed('lastViewedOrdersAt');
      const lastMessagesAt = getLastViewed('lastViewedMessagesAt');
      const nUsers = userRoles.filter(u => new Date(u.createdAt).getTime() > lastUsersAt).length;
      const nOrders = orders.filter(o => new Date(o.createdAt).getTime() > lastOrdersAt).length;

      // FIX-NOTIF (avril 2026) : le compteur de messages etait bloque sur 2 car
      // il ne filtrait QUE sur status='new' sans jamais comparer a un timestamp
      // "vu jusqu'a". Resultat : 2 contacts/submissions orphelins laissaient le
      // badge rouge colle a jamais. On ajoute un filtre date > lastViewedMessagesAt
      // (cumulatif avec status='new') pour que l'admin puisse ecraser le compteur
      // via markMessagesViewed / markAllViewed sans avoir a rouvrir chaque message.
      const isNewMsg = (m) => (m.status || 'new') === 'new';
      const isRecent = (m) => new Date(m.createdAt).getTime() > lastMessagesAt;
      const msgsOnly = contacts.filter(c => isNewMsg(c) && isRecent(c)).length
        + artists.filter(a => isNewMsg(a) && isRecent(a)).length
        + artistMsgs.filter(m => isNewMsg(m) && isRecent(m)).length;

      const count = msgsOnly + nUsers + nOrders;

      if (count > prevCountRef.current) {
        playNotifSound();
      }
      prevCountRef.current = count;
      setAdminMsgCount(count);
      setMessagesOnlyCount(msgsOnly);
      setNewUsersCount(nUsers);
      setNewOrdersCount(nOrders);
    } catch { /* ignore */ }
  }, [isAdmin, playNotifSound]);

  // FIX-FOCUS-SYNC (27 avril 2026) : polling intelligent + refetch on focus.
  //
  // Probleme avant : setInterval(fetchNotifs, 120000) tournait theoriquement
  // toutes les 2 min, mais sur mobile (Safari iOS surtout) les timers sont
  // SUSPENDUS quand l'onglet est en arriere-plan / ecran verrouille pour
  // economiser la batterie. Resultat : badge \"8\" affiche meme apres que
  // l'admin ait tout lu sur desktop, jusqu'au prochain poll qui pouvait
  // mettre plusieurs minutes a se declencher.
  //
  // Apres ce fix :
  //   1. visibilitychange (priorite mobile) : refetch IMMEDIAT des que l'onglet
  //      redevient visible (deverrouillage, retour app). force=true pour
  //      bypass le throttle 5s.
  //   2. focus (cross-browser fallback, priorite desktop) : idem quand le
  //      window reprend le focus apres un Cmd+Tab.
  //   3. online : refetch quand le reseau revient apres une coupure.
  //   4. setInterval pause-aware : skip le fetch si l'onglet est cache.
  //      Economie batterie + data mobile + reduction charge backend.
  useEffect(() => {
    if (!isAdmin) return;
    fetchNotifs({ force: true });

    const interval = setInterval(() => {
      // Skip silencieux si l'onglet est cache - inutile de polluer le reseau
      // quand l'admin n'est meme pas sur la page. Le visibilitychange
      // s'occupe du refetch des qu'il revient.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchNotifs();
    }, 120000);

    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchNotifs({ force: true });
      }
    };
    const onFocus = () => fetchNotifs({ force: true });
    const onOnline = () => fetchNotifs({ force: true });

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [isAdmin, fetchNotifs]);

  // Appeler refreshNotifs() apres avoir lu des messages pour mettre a jour le badge instantanement
  const refreshNotifs = useCallback(() => {
    fetchNotifs({ force: true });
  }, [fetchNotifs]);

  // A appeler quand l'admin visite les pages /admin/utilisateurs et /admin/commandes
  const markUsersViewed = useCallback(() => {
    setLastViewed('lastViewedUsersAt');
    setNewUsersCount(0);
    fetchNotifs({ force: true });
  }, [fetchNotifs]);
  const markOrdersViewed = useCallback(() => {
    setLastViewed('lastViewedOrdersAt');
    setNewOrdersCount(0);
    fetchNotifs({ force: true });
  }, [fetchNotifs]);
  // FIX-NOTIF (avril 2026) : equivalent pour /admin/messages. Reset optimiste
  // du compteur pour que le badge disparaisse immediatement, puis refetch pour
  // capter d'eventuels nouveaux items arrives entre temps.
  const markMessagesViewed = useCallback(() => {
    setLastViewed('lastViewedMessagesAt');
    setMessagesOnlyCount(0);
    prevCountRef.current = newUsersCount + newOrdersCount; // evite de rejouer le son
    fetchNotifs({ force: true });
  }, [fetchNotifs, newUsersCount, newOrdersCount]);

  // "Tout marquer comme lu" : bouton dedie dans le drawer mobile / header.
  // Reset les 3 timestamps d'un coup et force un refetch. Utile quand l'admin
  // veut juste effacer le badge sans naviguer dans chaque section.
  const markAllViewed = useCallback(() => {
    setLastViewed('lastViewedUsersAt');
    setLastViewed('lastViewedOrdersAt');
    setLastViewed('lastViewedMessagesAt');
    setNewUsersCount(0);
    setNewOrdersCount(0);
    setMessagesOnlyCount(0);
    setAdminMsgCount(0);
    prevCountRef.current = 0;
    fetchNotifs({ force: true });
  }, [fetchNotifs]);

  return (
    <NotificationContext.Provider value={{ adminMsgCount, messagesOnlyCount, newUsersCount, newOrdersCount, refreshNotifs, markUsersViewed, markOrdersViewed, markMessagesViewed, markAllViewed }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) return { adminMsgCount: 0, messagesOnlyCount: 0, newUsersCount: 0, newOrdersCount: 0, refreshNotifs: () => {}, markUsersViewed: () => {}, markOrdersViewed: () => {}, markMessagesViewed: () => {}, markAllViewed: () => {} };
  return ctx;
}
