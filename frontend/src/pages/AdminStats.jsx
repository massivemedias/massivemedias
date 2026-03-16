import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Receipt, Loader2,
  BarChart3, Users, ShoppingBag, Percent, ExternalLink,
  Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { useLang } from '../i18n/LanguageContext';
import { getOrderStats } from '../services/adminService';

const CATEGORY_LABELS = {
  materials: { fr: 'Materiaux', en: 'Materials', es: 'Materiales' },
  shipping: { fr: 'Expedition', en: 'Shipping', es: 'Envio' },
  software: { fr: 'Logiciel', en: 'Software', es: 'Software' },
  marketing: { fr: 'Marketing', en: 'Marketing', es: 'Marketing' },
  rent: { fr: 'Loyer', en: 'Rent', es: 'Alquiler' },
  equipment: { fr: 'Equipement', en: 'Equipment', es: 'Equipo' },
  taxes: { fr: 'Taxes', en: 'Taxes', es: 'Impuestos' },
  other: { fr: 'Autre', en: 'Other', es: 'Otro' },
};

// Helper: lire les couleurs CSS du theme actif
function getThemeColor(varName, fallback = '#FF52A0') {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

// Tooltip custom pour matcher le theme
function ChartTooltip({ active, payload, label, suffix = '$' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-glass card-border px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs text-grey-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
          {typeof p.value === 'number' ? p.value.toFixed(0) : p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

function AdminStats() {
  const { tx } = useLang();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderStats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Couleurs theme (relues a chaque render pour suivre les changements de theme)
  const colors = useMemo(() => ({
    accent: getThemeColor('--accent-color', '#FF52A0'),
    green: '#4ade80',
    red: '#f87171',
    purple: '#c084fc',
    blue: '#60a5fa',
    yellow: '#facc15',
    cyan: '#22d3ee',
    orange: '#fb923c',
    emerald: '#34d399',
    gray: '#9ca3af',
    heading: getThemeColor('--color-heading', '#ffffff'),
    muted: getThemeColor('--color-grey-muted', '#9ca3af'),
    glass: getThemeColor('--bg-glass', 'rgba(255,255,255,0.05)'),
  }), [stats]); // eslint-disable-line

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-accent" /></div>;
  }

  if (!stats) {
    return <div className="text-center py-20 text-grey-muted">{tx({ fr: 'Erreur de chargement', en: 'Loading error', es: 'Error de carga' })}</div>;
  }

  const summaryCards = [
    { label: tx({ fr: 'Revenus totaux', en: 'Total revenue', es: 'Ingresos totales' }), value: `${(stats.revenue?.totalDollars || 0).toFixed(2)}$`, icon: DollarSign, accent: 'text-green-400' },
    { label: tx({ fr: 'Depenses totales', en: 'Total expenses', es: 'Total gastos' }), value: `${(stats.expenses?.total || 0).toFixed(2)}$`, icon: Receipt, accent: 'text-red-400' },
    { label: tx({ fr: 'Profit brut', en: 'Gross profit', es: 'Ganancia bruta' }), value: `${(stats.profit?.gross || 0).toFixed(2)}$`, icon: TrendingUp, accent: stats.profit?.gross >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' }), value: stats.orderStats?.total || 0, icon: ShoppingBag, accent: 'text-accent' },
  ];

  // Revenue area chart data
  const monthlyRev = (stats.revenue?.monthly || []).slice(-12).map(m => ({
    month: m.month,
    revenue: Math.round(m.revenue / 100),
    orders: m.orders,
  }));

  // Expense bar chart data
  const expByCat = stats.expenses?.byCategory || {};
  const expenseData = Object.entries(expByCat)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({
      category: CATEGORY_LABELS[cat] ? tx(CATEGORY_LABELS[cat]) : cat,
      amount: Math.round(amount),
    }));

  // Order status donut data
  const byStatus = stats.orderStats?.byStatus || {};
  const totalOrders = Object.values(byStatus).reduce((s, v) => s + v, 0) || 1;

  const statusConfig = {
    pending:    { color: colors.yellow,  label: tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' }) },
    paid:       { color: colors.green,   label: tx({ fr: 'Paye', en: 'Paid', es: 'Pagado' }) },
    processing: { color: colors.blue,    label: tx({ fr: 'En production', en: 'Processing', es: 'En proceso' }) },
    shipped:    { color: colors.purple,  label: tx({ fr: 'Expedie', en: 'Shipped', es: 'Enviado' }) },
    delivered:  { color: colors.emerald, label: tx({ fr: 'Livre', en: 'Delivered', es: 'Entregado' }) },
    cancelled:  { color: colors.red,     label: tx({ fr: 'Annule', en: 'Cancelled', es: 'Cancelado' }) },
    refunded:   { color: colors.gray,    label: tx({ fr: 'Rembourse', en: 'Refunded', es: 'Reembolsado' }) },
  };

  const statusData = Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: statusConfig[status]?.label || status,
      value: count,
      color: statusConfig[status]?.color || colors.accent,
      pct: ((count / totalOrders) * 100).toFixed(1),
    }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 bg-glass card-border">
              <div className="flex items-center gap-2 mb-2"><Icon size={16} className={card.accent} /><span className="text-grey-muted text-xs">{card.label}</span></div>
              <span className="text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue - Area Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-green-400" />
            {tx({ fr: 'Revenus mensuels', en: 'Monthly revenue', es: 'Ingresos mensuales' })}
          </h3>
          {monthlyRev.length === 0 ? (
            <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune donnee', en: 'No data', es: 'Sin datos' })}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyRev} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke={colors.green} strokeWidth={2} fill="url(#gradRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {/* Order count legend below chart */}
          {monthlyRev.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {monthlyRev.map(m => (
                <div key={m.month} className="text-center flex-shrink-0" style={{ minWidth: `${100 / Math.max(monthlyRev.length, 1)}%` }}>
                  <span className="text-[10px] text-grey-muted">{m.orders} {tx({ fr: 'cmd', en: 'ord', es: 'ped' })}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Expenses by category - Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Receipt size={16} className="text-red-400" />
            {tx({ fr: 'Depenses par categorie', en: 'Expenses by category', es: 'Gastos por categoria' })}
          </h3>
          {expenseData.length === 0 ? (
            <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune donnee', en: 'No data', es: 'Sin datos' })}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={expenseData} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="amount" fill={colors.red} radius={[0, 4, 4, 0]} barSize={16} fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Order status - Donut Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-accent" />
            {tx({ fr: 'Status des commandes', en: 'Order status', es: 'Estado de pedidos' })}
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} fillOpacity={0.75} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} (${((value / totalOrders) * 100).toFixed(1)}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {statusData.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color, opacity: 0.75 }} />
                  <span className="text-grey-muted flex-1">{s.name}</span>
                  <span className="text-heading font-semibold">{s.value}</span>
                  <span className="text-grey-muted w-10 text-right">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Taxes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Percent size={16} className="text-purple-400" />
            {tx({ fr: 'Bilan taxes', en: 'Tax summary', es: 'Resumen impuestos' })}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-grey-muted"></span>
              <span className="text-grey-muted text-xs text-center">TPS (5%)</span>
              <span className="text-grey-muted text-xs text-center">TVQ (9.975%)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-grey-muted text-xs">{tx({ fr: 'Percue', en: 'Collected', es: 'Cobrado' })}</span>
              <span className="text-heading text-center font-semibold">{(stats.taxes?.tpsCollected || 0).toFixed(2)}$</span>
              <span className="text-heading text-center font-semibold">{(stats.taxes?.tvqCollected || 0).toFixed(2)}$</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-grey-muted text-xs">{tx({ fr: 'Payee', en: 'Paid', es: 'Pagado' })}</span>
              <span className="text-heading text-center">{(stats.taxes?.tpsPaid || 0).toFixed(2)}$</span>
              <span className="text-heading text-center">{(stats.taxes?.tvqPaid || 0).toFixed(2)}$</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm border-t pt-2 card-border">
              <span className="text-heading font-semibold text-xs">{tx({ fr: 'A remettre', en: 'Net owed', es: 'A remitir' })}</span>
              <span className={`text-center font-bold ${(stats.taxes?.tpsNet || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>{(stats.taxes?.tpsNet || 0).toFixed(2)}$</span>
              <span className={`text-center font-bold ${(stats.taxes?.tvqNet || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>{(stats.taxes?.tvqNet || 0).toFixed(2)}$</span>
            </div>
          </div>
        </motion.div>

        {/* Google Analytics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            Google Analytics
          </h3>
          <p className="text-grey-muted text-sm mb-4">
            {tx({
              fr: 'Trafic, visiteurs, conversions et e-commerce.',
              en: 'Traffic, visitors, conversions and e-commerce.',
              es: 'Trafico, visitantes, conversiones y e-commerce.',
            })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <a
              href="https://analytics.google.com/analytics/web/#/p525792501/reports/dashboard?r=firebase-overview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-colors"
            >
              <BarChart3 size={16} />
              {tx({ fr: 'Dashboard GA4', en: 'GA4 Dashboard', es: 'Dashboard GA4' })}
              <ExternalLink size={12} className="ml-auto" />
            </a>
            <a
              href="https://analytics.google.com/analytics/web/#/p525792501/reports/explorer?params=_u..nav%3Dmaui&r=lifecycle-monetization-ecommerce-purchases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/30 transition-colors"
            >
              <DollarSign size={16} />
              {tx({ fr: 'E-commerce', en: 'E-commerce', es: 'E-commerce' })}
              <ExternalLink size={12} className="ml-auto" />
            </a>
            <a
              href="https://analytics.google.com/analytics/web/#/p525792501/reports/explorer?params=_u..nav%3Dmaui&r=lifecycle-engagement-overview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-semibold hover:bg-purple-500/30 transition-colors"
            >
              <Activity size={16} />
              {tx({ fr: 'Engagement', en: 'Engagement', es: 'Engagement' })}
              <ExternalLink size={12} className="ml-auto" />
            </a>
            <a
              href="https://analytics.google.com/analytics/web/#/p525792501/reports/explorer?params=_u..nav%3Dmaui&r=all-pages-and-screens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/30 transition-colors"
            >
              <Users size={16} />
              {tx({ fr: 'Pages vues', en: 'Page views', es: 'Paginas vistas' })}
              <ExternalLink size={12} className="ml-auto" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass text-grey-muted text-xs hover:text-heading transition-colors"
            >
              Search Console <ExternalLink size={10} />
            </a>
            <a
              href="https://dashboard.stripe.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass text-grey-muted text-xs hover:text-heading transition-colors"
            >
              Stripe Dashboard <ExternalLink size={10} />
            </a>
          </div>
        </motion.div>

        {/* KPIs calcules */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            KPIs
          </h3>
          <div className="space-y-4">
            {(() => {
              const totalRev = stats.revenue?.totalDollars || 0;
              const totalOrders2 = stats.orderStats?.total || 0;
              const avgOrder = totalOrders2 > 0 ? (totalRev / totalOrders2) : 0;
              const totalExp = stats.expenses?.total || 0;
              const margin = totalRev > 0 ? ((totalRev - totalExp) / totalRev * 100) : 0;
              return [
                { label: tx({ fr: 'Panier moyen', en: 'Avg order value', es: 'Valor medio pedido' }), value: `${avgOrder.toFixed(2)}$`, good: true },
                { label: tx({ fr: 'Marge nette', en: 'Net margin', es: 'Margen neto' }), value: `${margin.toFixed(1)}%`, good: margin > 0 },
                { label: tx({ fr: 'Taux annulation', en: 'Cancel rate', es: 'Tasa cancelacion' }),
                  value: `${totalOrders2 > 0 ? (((byStatus.cancelled || 0) / totalOrders2) * 100).toFixed(1) : 0}%`,
                  good: false, reverse: true },
                { label: tx({ fr: 'Taux remboursement', en: 'Refund rate', es: 'Tasa reembolso' }),
                  value: `${totalOrders2 > 0 ? (((byStatus.refunded || 0) / totalOrders2) * 100).toFixed(1) : 0}%`,
                  good: false, reverse: true },
              ].map((kpi, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-grey-muted">{kpi.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-lg font-bold ${
                      kpi.reverse
                        ? (parseFloat(kpi.value) > 5 ? 'text-red-400' : 'text-green-400')
                        : (kpi.good ? 'text-green-400' : 'text-red-400')
                    }`}>{kpi.value}</span>
                    {kpi.reverse
                      ? (parseFloat(kpi.value) > 5 ? <ArrowUpRight size={14} className="text-red-400" /> : <ArrowDownRight size={14} className="text-green-400" />)
                      : (kpi.good ? <ArrowUpRight size={14} className="text-green-400" /> : <ArrowDownRight size={14} className="text-red-400" />)
                    }
                  </div>
                </div>
              ));
            })()}
          </div>
        </motion.div>

        {/* Top clients */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl bg-glass p-5 card-border lg:col-span-2">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Users size={16} className="text-accent" />
            {tx({ fr: 'Top 10 clients', en: 'Top 10 clients', es: 'Top 10 clientes' })}
          </h3>
          {(stats.topClients || []).length === 0 ? (
            <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune donnee', en: 'No data', es: 'Sin datos' })}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(stats.topClients || []).map((client, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-heading font-medium truncate">{client.name}</p>
                    <p className="text-xs text-grey-muted truncate">{client.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-heading font-semibold">{(client.totalSpent / 100).toFixed(0)}$</p>
                    <p className="text-[10px] text-grey-muted">{client.orderCount} {tx({ fr: 'cmd', en: 'ord', es: 'ped' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default AdminStats;
