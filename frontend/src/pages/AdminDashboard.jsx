import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Package, MessageSquare, Users, Receipt,
  BarChart3, DollarSign, Banknote, Star, AlertCircle,
  Loader2, ArrowRight, StickyNote, Clock, CheckCircle, Truck,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getOrders, getContactSubmissions, getExpenses } from '../services/adminService';
import api from '../services/api';
import AdminNotes from './AdminNotes';

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)] hover:bg-black/25 transition-all group">
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
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      try {
        const [ordersRes, messagesRes, inventoryRes, expensesRes] = await Promise.allSettled([
          getOrders(),
          getContactSubmissions(),
          api.get('/inventory-items/dashboard'),
          getExpenses(),
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          label={tx({ fr: 'Messages non lus', en: 'Unread messages', es: 'Mensajes no leidos' })}
          value={stats.unreadMessages}
          color={stats.unreadMessages > 0 ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-grey-muted'}
          to="/admin/messages"
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
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-black/10 shadow-[inset_0_1px_4px_rgba(0,0,0,0.15)] hover:bg-black/20 transition-all text-center group"
          >
            <item.icon size={20} className="text-grey-muted group-hover:text-accent transition-colors" />
            <span className="text-xs text-heading font-medium">{item.label}</span>
            {item.count && <span className="text-[10px] text-accent">{item.count}</span>}
          </Link>
        ))}
      </div>

      {/* Notes */}
      <div className="rounded-2xl p-4 md:p-5 card-bg card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-heading font-heading font-bold text-base flex items-center gap-2">
            <StickyNote size={18} className="text-accent" />
            {tx({ fr: 'Notes', en: 'Notes', es: 'Notas' })}
          </h3>
          <Link to="/admin/notes" className="text-xs text-accent hover:underline flex items-center gap-1">
            {tx({ fr: 'Voir tout', en: 'View all', es: 'Ver todo' })}
            <ArrowRight size={12} />
          </Link>
        </div>
        <AdminNotes embedded />
      </div>
    </div>
  );
}

export default AdminDashboard;
