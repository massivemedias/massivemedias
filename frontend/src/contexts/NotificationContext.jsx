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

  const fetchNotifs = useCallback(async () => {
    if (!isAdmin || isServerDown()) return;
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

  // Polling toutes les 2 minutes
  useEffect(() => {
    if (!isAdmin) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 120000);
    return () => clearInterval(interval);
  }, [isAdmin, fetchNotifs]);

  // Appeler refreshNotifs() apres avoir lu des messages pour mettre a jour le badge instantanement
  const refreshNotifs = useCallback(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // A appeler quand l'admin visite les pages /admin/utilisateurs et /admin/commandes
  const markUsersViewed = useCallback(() => {
    setLastViewed('lastViewedUsersAt');
    setNewUsersCount(0);
    fetchNotifs();
  }, [fetchNotifs]);
  const markOrdersViewed = useCallback(() => {
    setLastViewed('lastViewedOrdersAt');
    setNewOrdersCount(0);
    fetchNotifs();
  }, [fetchNotifs]);
  // FIX-NOTIF (avril 2026) : equivalent pour /admin/messages. Reset optimiste
  // du compteur pour que le badge disparaisse immediatement, puis refetch pour
  // capter d'eventuels nouveaux items arrives entre temps.
  const markMessagesViewed = useCallback(() => {
    setLastViewed('lastViewedMessagesAt');
    setMessagesOnlyCount(0);
    prevCountRef.current = newUsersCount + newOrdersCount; // evite de rejouer le son
    fetchNotifs();
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
    fetchNotifs();
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
