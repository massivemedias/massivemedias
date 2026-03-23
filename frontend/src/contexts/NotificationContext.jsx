import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useUserRole } from './UserRoleContext';
import { getContactSubmissions, getArtistSubmissions } from '../services/adminService';
import { getArtistMessagesAdmin } from '../services/artistService';
import { isServerDown } from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [adminMsgCount, setAdminMsgCount] = useState(0);
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

      if (count > prevCountRef.current) {
        playNotifSound();
      }
      prevCountRef.current = count;
      setAdminMsgCount(count);
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

  return (
    <NotificationContext.Provider value={{ adminMsgCount, refreshNotifs }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) return { adminMsgCount: 0, refreshNotifs: () => {} };
  return ctx;
}
