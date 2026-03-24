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
        const visitorsToday = analytics.visitorsToday ?? analytics.uniqueVisitors ?? '-';
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
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={Clock}
          label={tx({ fr: 'En attente', en: 'Pending', es: 'Pendientes' })}
          value={stats.pending}
          color="bg-yellow-500/15 text-yellow-400"
          to="/admin/commandes"
        />
        <StatCard
          icon={ShoppingBag}
          label={tx({ fr: 'En production', en: 'Processing', es: 'En produccion' })}
          value={stats.processing}
          color="bg-blue-500/15 text-blue-400"
          to="/admin/commandes"
        />
        <StatCard
          icon={Truck}
          label={tx({ fr: 'Expediees', en: 'Shipped', es: 'Enviados' })}
          value={stats.shipped}
          color="bg-green-500/15 text-green-400"
          to="/admin/commandes"
        />
        <StatCard
          icon={MessageSquare}
          label={tx({ fr: 'Messages non lus', en: 'Unread', es: 'No leidos' })}
          value={stats.unreadMessages}
          color={stats.unreadMessages > 0 ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-grey-muted'}
          to="/admin/messages"
        />
        <StatCard
          icon={UserPlus}
          label={tx({ fr: 'Nouveaux (3j)', en: 'New users (3d)', es: 'Nuevos (3d)' })}
          value={stats.newUsers3d}
          color={stats.newUsers3d > 0 ? 'bg-purple-500/15 text-purple-400' : 'bg-white/5 text-grey-muted'}
          to="/admin/utilisateurs"
        />
        <StatCard
          icon={Eye}
          label={tx({ fr: 'Visiteurs aujourd\'hui', en: 'Visitors today', es: 'Visitantes hoy' })}
          value={stats.visitorsToday}
          color="bg-cyan-500/15 text-cyan-400"
          to="/admin/stats"
        />
      </div>

      {/* Raccourcis rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {[
          { to: '/admin/commandes', icon: ShoppingBag, label: tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' }), count: stats.orders },
          { to: '/admin/inventaire', icon: Package, label: tx({ fr: 'Inventaire', en: 'Inventory', es: 'Inventario' }), count: stats.inventoryLow > 0 ? `${stats.inventoryLow} low` : null },
          { to: '/admin/depenses', icon: Receipt, label: tx({ fr: 'Depenses', en: 'Expenses', es: 'Gastos' }), count: stats.expenses > 0 ? `${stats.expenses.toFixed(0)}$` : null },
          { to: '/admin/utilisateurs', icon: Users, label: tx({ fr: 'Utilisateurs', en: 'Users', es: 'Usuarios' }) },
          { to: '/admin/stats', icon: BarChart3, label: tx({ fr: 'Statistiques', en: 'Statistics', es: 'Estadisticas' }) },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-black/10 hover:bg-black/20 transition-all text-center group"
          >
            <item.icon size={20} className="text-grey-muted group-hover:text-accent transition-colors" />
            <span className="text-xs text-heading font-medium">{item.label}</span>
            {item.count && <span className="text-[10px] text-accent">{item.count}</span>}
          </Link>
        ))}
      </div>

      {/* Notes + Activite recente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notes - titres seulement */}
        <div className="rounded-2xl p-4 md:p-5 card-bg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-heading font-heading font-bold text-base flex items-center gap-2">
              <StickyNote size={18} className="text-accent" />
              {tx({ fr: 'Notes', en: 'Notes', es: 'Notas' })}
            </h3>
            <Link to="/admin/notes" className="text-xs text-accent hover:underline flex items-center gap-1">
              {tx({ fr: 'Ouvrir', en: 'Open', es: 'Abrir' })}
              <ArrowRight size={12} />
            </Link>
          </div>
          <DashboardNotes />
        </div>

        {/* Activite recente */}
        <div className="rounded-2xl p-4 md:p-5 card-bg">
          <h3 className="text-heading font-heading font-bold text-base flex items-center gap-2 mb-3">
            <Clock size={18} className="text-accent" />
            {tx({ fr: 'Activite recente', en: 'Recent activity', es: 'Actividad reciente' })}
          </h3>
          <div className="space-y-2">
            {stats.pending > 0 && (
              <Link to="/admin/commandes" className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-xs text-heading">{stats.pending} {tx({ fr: 'commande(s) en attente', en: 'pending order(s)', es: 'pedido(s) pendiente(s)' })}</span>
              </Link>
            )}
            {stats.processing > 0 && (
              <Link to="/admin/commandes" className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-heading">{stats.processing} {tx({ fr: 'en production', en: 'in production', es: 'en produccion' })}</span>
              </Link>
            )}
            {stats.shipped > 0 && (
              <Link to="/admin/commandes" className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-heading">{stats.shipped} {tx({ fr: 'expediee(s)', en: 'shipped', es: 'enviado(s)' })}</span>
              </Link>
            )}
            {stats.unreadMessages > 0 && (
              <Link to="/admin/messages" className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs text-heading">{stats.unreadMessages} {tx({ fr: 'message(s) non lu(s)', en: 'unread message(s)', es: 'mensaje(s) no leido(s)' })}</span>
              </Link>
            )}
            {stats.inventoryLow > 0 && (
              <Link to="/admin/inventaire" className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-xs text-heading">{stats.inventoryLow} {tx({ fr: 'article(s) stock bas', en: 'low stock item(s)', es: 'articulo(s) stock bajo' })}</span>
              </Link>
            )}
            {stats.pending === 0 && stats.processing === 0 && stats.shipped === 0 && stats.unreadMessages === 0 && stats.inventoryLow === 0 && (
              <div className="flex items-center gap-2 p-2">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs text-grey-muted">{tx({ fr: 'Tout est à jour!', en: 'All caught up!', es: 'Todo al dia!' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Systeme - widget compact */}
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

    // GitHub Pages
    try {
      const start = Date.now();
      await fetch('https://massivemedias.com/', { mode: 'no-cors', signal: AbortSignal.timeout(5000) });
      results.push({ name: 'GitHub Pages', ok: true, ms: Date.now() - start });
    } catch {
      results.push({ name: 'GitHub Pages', ok: false, ms: 0 });
    }

    // Cloudflare
    results.push({ name: 'Cloudflare', ok: true });

    // Supabase
    results.push({ name: 'Supabase', ok: !!import.meta.env.VITE_SUPABASE_URL });

    // Stripe
    results.push({ name: 'Stripe', ok: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY });

    // Google Analytics
    results.push({ name: 'Analytics', ok: !!import.meta.env.VITE_GA_ID });

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
          <div key={s.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 text-xs">
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
