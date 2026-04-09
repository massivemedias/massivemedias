import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Package, MessageSquare, Users, Receipt,
  BarChart3, DollarSign, Banknote, Star, AlertCircle,
  Loader2, ArrowRight, StickyNote, Clock, CheckCircle, Truck, Activity,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getOrders, getContactSubmissions, getExpenses, getAnalytics } from '../services/adminService';
import api from '../services/api';
import { UserPlus, Eye } from 'lucide-react';
const NOTES_KEY = 'mm-admin-notes';

function DashboardNotes() {
  const { tx } = useLang();
  const notes = (() => {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); } catch { return []; }
  })();
  const sorted = notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  if (sorted.length === 0) {
    return (
      <div className="text-center py-6 text-grey-muted text-xs">
        <StickyNote size={24} className="mx-auto mb-2 opacity-30" />
        {tx({ fr: 'Aucune note', en: 'No notes', es: 'Sin notas' })}
      </div>
    );
  }

  return (
    <div className="space-y-0.5 max-h-[280px] overflow-y-auto scrollbar-thin">
      {sorted.slice(0, 5).map((n, i) => (
        <Link
          key={n.id}
          to="/admin/notes"
          className="block px-3 py-2.5 rounded-lg hover:bg-black/10 transition-colors"
        >
          <p className="text-sm text-heading truncate font-medium">
            {n.title || tx({ fr: 'Sans titre', en: 'Untitled', es: 'Sin titulo' })}
          </p>
          {i === 0 && n.body && (
            <p className="text-xs text-grey-muted mt-1 line-clamp-2">{n.body.replace(/<[^>]*>/g, '').slice(0, 120)}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 hover:bg-black/25 transition-all group">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-heading">{value}</p>
        <p className="text-xs text-grey-muted">{label}</p>
      </div>
      {to && <ArrowRight size={14} className="ml-auto text-grey-muted opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function AdminDashboard() {
  const { tx } = useLang();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    orders: 0, pending: 0, processing: 0, shipped: 0,
    messages: 0, unreadMessages: 0,
    inventoryLow: 0,
    expenses: 0,
    newUsers3d: 0,
    visitorsToday: '-',
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
      const withTimeout = (p) => Promise.race([p, timeout(8000)]);
      try {
        const [ordersRes, messagesRes, inventoryRes, expensesRes, usersRes, analyticsRes] = await Promise.allSettled([
          withTimeout(getOrders()),
          withTimeout(getContactSubmissions()),
          withTimeout(api.get('/inventory-items/dashboard')),
          withTimeout(getExpenses()),
          withTimeout(api.get('/user-roles')),
          withTimeout(getAnalytics(3)),
        ]);

        if (cancelled) return;

        const orders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.data || []) : [];
        const messages = messagesRes.status === 'fulfilled' ? (messagesRes.value?.data || []) : [];
        const inventory = inventoryRes.status === 'fulfilled' ? (inventoryRes.value?.data || []) : [];
        const expenses = expensesRes.status === 'fulfilled' ? (expensesRes.value?.data || []) : [];

        const pending = orders.filter(o => o.status === 'pending' || o.status === 'paid').length;
        const processing = orders.filter(o => o.status === 'processing').length;
        const shipped = orders.filter(o => o.status === 'shipped').length;
        const unread = messages.filter(m => m.status === 'new' || m.status === 'unread').length;
        const lowStock = inventory.filter(i => i.quantity !== undefined && i.quantity <= (i.lowStockThreshold || 5)).length;
        const users = usersRes.status === 'fulfilled' ? (usersRes.value?.data || []) : [];
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const newUsers3d = users.filter(u => new Date(u.createdAt) >= threeDaysAgo).length;
        const analytics = analyticsRes.status === 'fulfilled' ? (analyticsRes.value?.data || {}) : {};
        const rawVisitors = analytics.visitorsToday ?? analytics.uniqueVisitors ?? '-';
        const visitorsToday = typeof rawVisitors === 'object' ? JSON.stringify(rawVisitors) : String(rawVisitors);
        const monthExpenses = expenses
          .filter(e => {
            const d = new Date(e.date || e.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((sum, e) => sum + (e.amount || 0), 0);

        setStats({
          orders: orders.length,
          pending,
          processing,
          shipped,
          messages: messages.length,
          unreadMessages: unread,
          inventoryLow: lowStock,
          expenses: monthExpenses,
          newUsers3d,
          visitorsToday,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    const interval = setInterval(fetchAll, 60000); // refresh toutes les 60s
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  // Notes inline
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); } catch { return []; }
  });
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');

  const saveNotes = (updated) => { setNotes(updated); localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); };
  const addNote = () => {
    const n = { id: Date.now(), title: '', body: '', updatedAt: Date.now() };
    const updated = [n, ...notes];
    saveNotes(updated);
    setEditingNote(n.id); setNoteTitle(''); setNoteBody('');
  };
  const saveEdit = () => {
    const updated = notes.map(n => n.id === editingNote ? { ...n, title: noteTitle, body: noteBody, updatedAt: Date.now() } : n);
    saveNotes(updated);
    setEditingNote(null);
  };
  const deleteNote = (id) => { saveNotes(notes.filter(n => n.id !== id)); if (editingNote === id) setEditingNote(null); };

  // Revenue from stats + commissions APIs
  const [revenue, setRevenue] = useState({ total: 0, orders: 0, commissions: 0 });
  useEffect(() => {
    const fetchRevenue = () => {
      Promise.all([
        api.get('/orders/stats').catch(() => ({ data: {} })),
        api.get('/orders/commissions').catch(() => ({ data: { artists: [] } })),
      ]).then(([statsRes, commRes]) => {
        const d = statsRes.data;
        const artists = commRes.data?.artists || [];
        const totalCommissions = artists.reduce((s, a) => s + (a.totalCommission || 0), 0);
        const paidOrders = (d.orderStats?.byStatus?.paid || 0) + (d.orderStats?.byStatus?.processing || 0) + (d.orderStats?.byStatus?.shipped || 0) + (d.orderStats?.byStatus?.delivered || 0);
        setRevenue({
          total: d.revenue?.totalDollars || 0,
          orders: paidOrders || d.orderStats?.total || 0,
          commissions: Math.round(totalCommissions * 100) / 100,
        });
      });
    };
    fetchRevenue();
    const interval = setInterval(fetchRevenue, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5">
      {/* Ventes + Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ShoppingBag} label={tx({ fr: 'Ventes', en: 'Sales', es: 'Ventas' })} value={revenue.orders || 0} color="bg-green-500/15 text-green-400" to="/admin/commandes" />
        <StatCard icon={DollarSign} label={tx({ fr: 'Revenus', en: 'Revenue', es: 'Ingresos' })} value={`${(revenue.total || 0).toFixed(0)}$`} color="bg-accent/15 text-accent" to="/admin/commandes" />
        <StatCard icon={Banknote} label={tx({ fr: 'Commissions artistes', en: 'Artist commissions', es: 'Comisiones' })} value={`${(revenue.commissions || 0).toFixed(0)}$`} color="bg-blue-500/15 text-blue-400" to="/admin/commissions" />
        <StatCard icon={Eye} label={tx({ fr: 'Visiteurs uniques', en: 'Unique visitors', es: 'Visitantes' })} value={stats.visitorsToday} color="bg-cyan-500/15 text-cyan-400" to="/admin/stats" />
      </div>

      {/* Status commandes + Messages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Clock} label={tx({ fr: 'En attente', en: 'Pending', es: 'Pendientes' })} value={stats.pending} color="bg-yellow-500/15 text-yellow-400" to="/admin/commandes" />
        <StatCard icon={Package} label={tx({ fr: 'En production', en: 'Processing', es: 'En produccion' })} value={stats.processing} color="bg-blue-500/15 text-blue-400" to="/admin/commandes" />
        <StatCard icon={MessageSquare} label={tx({ fr: 'Messages', en: 'Messages', es: 'Mensajes' })} value={stats.unreadMessages > 0 ? stats.unreadMessages : '0'} color={stats.unreadMessages > 0 ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-grey-muted'} to="/admin/messages" />
        <StatCard icon={UserPlus} label={tx({ fr: 'Nouveaux (3j)', en: 'New (3d)', es: 'Nuevos (3d)' })} value={stats.newUsers3d} color={stats.newUsers3d > 0 ? 'bg-purple-500/15 text-purple-400' : 'bg-white/5 text-grey-muted'} to="/admin/utilisateurs" />
      </div>

      {/* Notes inline */}
      <div className="rounded-2xl p-4 md:p-5 card-bg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-heading font-heading font-bold text-sm flex items-center gap-2">
            <StickyNote size={16} className="text-accent" />
            Notes
          </h3>
          <button onClick={addNote} className="text-xs text-accent hover:underline">+ {tx({ fr: 'Ajouter', en: 'Add', es: 'Agregar' })}</button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map(n => (
            <div key={n.id} className="rounded-lg bg-black/20 p-3">
              {editingNote === n.id ? (
                <div className="space-y-2">
                  <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder={tx({ fr: 'Titre', en: 'Title', es: 'Titulo' })}
                    className="w-full bg-black/30 text-heading text-sm px-2 py-1.5 rounded border border-white/10 focus:outline-none focus:border-accent" autoFocus />
                  <textarea value={noteBody} onChange={e => setNoteBody(e.target.value)} placeholder="..." rows={3}
                    className="w-full bg-black/30 text-heading text-xs px-2 py-1.5 rounded border border-white/10 focus:outline-none focus:border-accent resize-none" />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold"><CheckCircle size={12} className="inline mr-1" />OK</button>
                    <button onClick={() => setEditingNote(null)} className="px-3 py-1 rounded bg-white/10 text-grey-muted text-xs">Annuler</button>
                    <button onClick={() => deleteNote(n.id)} className="px-3 py-1 rounded bg-red-500/10 text-red-400 text-xs ml-auto">Supprimer</button>
                  </div>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => { setEditingNote(n.id); setNoteTitle(n.title || ''); setNoteBody(n.body || ''); }}>
                  <p className="text-heading text-sm font-medium">{n.title || tx({ fr: 'Sans titre', en: 'Untitled', es: 'Sin titulo' })}</p>
                  {n.body && <p className="text-grey-muted text-xs mt-1 line-clamp-2">{n.body.replace(/<[^>]*>/g, '').slice(0, 150)}</p>}
                </div>
              )}
            </div>
          ))}
          {notes.length === 0 && <p className="text-grey-muted text-xs text-center py-4">{tx({ fr: 'Aucune note', en: 'No notes', es: 'Sin notas' })}</p>}
        </div>
      </div>

      {/* Systeme */}
      <SystemStatusWidget tx={tx} />
    </div>
  );
}

function SystemStatusWidget({ tx }) {
  const [services, setServices] = useState([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 60000);
    return () => clearInterval(interval);
  }, []);

  async function checkServices() {
    setChecking(true);
    const results = [];

    // Render (Strapi API)
    try {
      const start = Date.now();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://massivemedias-api.onrender.com/api'}/artists?pagination[pageSize]=1`, { signal: AbortSignal.timeout(8000) });
      results.push({ name: 'Render', ok: res.ok, ms: Date.now() - start });
    } catch {
      results.push({ name: 'Render', ok: false, ms: 0 });
    }

    // Strapi CMS (implied by Render)
    results.push({ name: 'Strapi', ok: results[0]?.ok });

    // Neon DB (implied by Strapi working)
    results.push({ name: 'Neon DB', ok: results[0]?.ok });

    // Cloudflare Pages (frontend)
    try {
      const start = Date.now();
      await fetch('https://massivemedias.com/', { mode: 'no-cors', signal: AbortSignal.timeout(5000) });
      results.push({ name: 'Cloudflare Pages', ok: true, ms: Date.now() - start });
    } catch {
      results.push({ name: 'Cloudflare Pages', ok: false, ms: 0 });
    }

    // Supabase
    results.push({ name: 'Supabase', ok: !!import.meta.env.VITE_SUPABASE_URL });

    // Stripe
    results.push({ name: 'Stripe', ok: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY });

    // Google Analytics
    results.push({ name: 'Analytics', ok: !!import.meta.env.VITE_GA_ID });

    // Last deploy info from GitHub
    try {
      const ghRes = await fetch('https://api.github.com/repos/massivemedias/massivemedias/commits?per_page=1', { signal: AbortSignal.timeout(5000) });
      if (ghRes.ok) {
        const [commit] = await ghRes.json();
        const ago = Math.round((Date.now() - new Date(commit.commit.author.date).getTime()) / 60000);
        const msg = commit.commit.message.split('\n')[0].substring(0, 50);
        results.push({ name: `Dernier push: ${ago < 60 ? ago + 'min' : Math.round(ago / 60) + 'h'}`, ok: true, info: msg });
      }
    } catch {}

    setServices(results);
    setChecking(false);
  }

  const allOk = services.length > 0 && services.every(s => s.ok);

  return (
    <div className="rounded-2xl p-4 md:p-5 card-bg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-heading font-heading font-bold text-base flex items-center gap-2">
          <Activity size={18} className={allOk ? 'text-green-400' : 'text-red-400'} />
          {tx({ fr: 'Systemes', en: 'Systems', es: 'Sistemas' })}
        </h3>
        <div className="flex items-center gap-2">
          {checking && <Loader2 size={12} className="animate-spin text-grey-muted" />}
          <span className={`text-xs font-bold ${allOk ? 'text-green-400' : 'text-red-400'}`}>
            {services.filter(s => s.ok).length}/{services.length} OK
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {services.map(s => (
          <div key={s.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 text-xs" title={s.info || ''}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-grey-light">{s.name}</span>
            {s.ms > 0 && <span className="text-grey-muted">{s.ms}ms</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
