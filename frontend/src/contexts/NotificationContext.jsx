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
  const [adminMsgCount, setAdminMsgCount] = useState(0);
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
      const nUsers = userRoles.filter(u => new Date(u.createdAt).getTime() > lastUsersAt).length;
      const nOrders = orders.filter(o => new Date(o.createdAt).getTime() > lastOrdersAt).length;

      const count = contacts.filter(c => (c.status || 'new') === 'new').length
        + artists.filter(a => (a.status || 'new') === 'new').length
        + artistMsgs.filter(m => (m.status || 'new') === 'new').length
        + nUsers
        + nOrders;

      if (count > prevCountRef.current) {
        playNotifSound();
      }
      prevCountRef.current = count;
      setAdminMsgCount(count);
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

  return (
    <NotificationContext.Provider value={{ adminMsgCount, newUsersCount, newOrdersCount, refreshNotifs, markUsersViewed, markOrdersViewed }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) return { adminMsgCount: 0, newUsersCount: 0, newOrdersCount: 0, refreshNotifs: () => {}, markUsersViewed: () => {}, markOrdersViewed: () => {} };
  return ctx;
}
