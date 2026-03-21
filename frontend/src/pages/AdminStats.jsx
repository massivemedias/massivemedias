import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Receipt, Loader2,
  BarChart3, Users, ShoppingBag, Percent, ExternalLink,
  Activity, ArrowUpRight, ArrowDownRight, Download,
  Globe, Monitor, Smartphone, Tablet, Clock, Eye, MousePointerClick,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import { useLang } from '../i18n/LanguageContext';
import { getOrderStats, getAnalytics } from '../services/adminService';

const CATEGORY_LABELS = {
  materials: { fr: 'Matériaux', en: 'Materials', es: 'Materiales' },
  shipping: { fr: 'Expédition', en: 'Shipping', es: 'Envio' },
  software: { fr: 'Logiciel', en: 'Software', es: 'Software' },
  marketing: { fr: 'Marketing', en: 'Marketing', es: 'Marketing' },
  rent: { fr: 'Loyer', en: 'Rent', es: 'Alquiler' },
  equipment: { fr: 'Équipement', en: 'Equipment', es: 'Equipo' },
  taxes: { fr: 'Taxes', en: 'Taxes', es: 'Impuestos' },
  other: { fr: 'Autre', en: 'Other', es: 'Otro' },
};

function downloadCSV(filename, csvContent) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Helper: lire les couleurs CSS du theme actif
function getThemeColor(varName, fallback = '#FF52A0') {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

// Tooltip custom pour matcher le theme
function ChartTooltip({ active, payload, label, suffix = '$' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg card-bg shadow-lg shadow-black/20 px-3 py-2 shadow-lg backdrop-blur-sm">
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
  const [tab, setTab] = useState('business'); // 'business' | 'analytics'
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState(30);
  const [analyticsError, setAnalyticsError] = useState('');

  useEffect(() => {
    getOrderStats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'analytics') return;
    setAnalyticsLoading(true);
    setAnalyticsError('');
    getAnalytics(analyticsPeriod)
      .then(({ data }) => setAnalytics(data.data || data))
      .catch((err) => {
        setAnalyticsError(err.response?.data?.error || 'Failed to load analytics');
      })
      .finally(() => setAnalyticsLoading(false));
  }, [tab, analyticsPeriod]);

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
    { label: tx({ fr: 'Dépenses totales', en: 'Total expenses', es: 'Total gastos' }), value: `${(stats.expenses?.total || 0).toFixed(2)}$`, icon: Receipt, accent: 'text-red-400' },
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
    paid:       { color: colors.green,   label: tx({ fr: 'Payé', en: 'Paid', es: 'Pagado' }) },
    processing: { color: colors.blue,    label: tx({ fr: 'En production', en: 'Processing', es: 'En proceso' }) },
    shipped:    { color: colors.purple,  label: tx({ fr: 'Expédié', en: 'Shipped', es: 'Enviado' }) },
    delivered:  { color: colors.emerald, label: tx({ fr: 'Livré', en: 'Delivered', es: 'Entregado' }) },
    cancelled:  { color: colors.red,     label: tx({ fr: 'Annulé', en: 'Cancelled', es: 'Cancelado' }) },
    refunded:   { color: colors.gray,    label: tx({ fr: 'Remboursé', en: 'Refunded', es: 'Reembolsado' }) },
  };

  const statusData = Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: statusConfig[status]?.label || status,
      value: count,
      color: statusConfig[status]?.color || colors.accent,
      pct: ((count / totalOrders) * 100).toFixed(1),
    }));

  const DEVICE_ICONS = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2">
        <button onClick={() => setTab('business')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'business' ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'}`}>
          <DollarSign size={16} />
          {tx({ fr: 'Affaires', en: 'Business', es: 'Negocios' })}
        </button>
        <button onClick={() => setTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'analytics' ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'}`}>
          <Activity size={16} />
          {tx({ fr: 'Trafic & Visiteurs', en: 'Traffic & Visitors', es: 'Trafico & Visitantes' })}
        </button>
      </div>

      {/* ═══════════ ANALYTICS TAB ═══════════ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex gap-2 flex-wrap">
            {[7, 14, 30, 90].map(p => (
              <button key={p} onClick={() => setAnalyticsPeriod(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${analyticsPeriod === p ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'}`}>
                {p} {tx({ fr: 'jours', en: 'days', es: 'dias' })}
              </button>
            ))}
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-accent" /></div>
          ) : analyticsError ? (
            <div className="rounded-xl bg-glass p-8 text-center">
              <Activity size={32} className="mx-auto mb-3 text-grey-muted" />
              <p className="text-heading font-semibold mb-2">{tx({ fr: 'Analytics non configuré', en: 'Analytics not configured', es: 'Analytics no configurado' })}</p>
              <p className="text-grey-muted text-sm mb-4">{analyticsError}</p>
              <p className="text-grey-muted text-xs mb-4">
                {tx({
                  fr: 'Configure GOOGLE_SERVICE_ACCOUNT_JSON dans les variables Render pour activer les analytics.',
                  en: 'Set GOOGLE_SERVICE_ACCOUNT_JSON in Render env vars to enable analytics.',
                  es: 'Configure GOOGLE_SERVICE_ACCOUNT_JSON en variables Render para activar analytics.',
                })}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a href="https://analytics.google.com/analytics/web/#/p525792501/reports/dashboard" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-colors">
                  <BarChart3 size={16} /> GA4 Dashboard <ExternalLink size={12} />
                </a>
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-glass text-grey-muted text-sm hover:text-heading transition-colors">
                  Search Console <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ) : analytics ? (
            <>
              {/* Overview cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { label: tx({ fr: 'En ligne', en: 'Online now', es: 'En linea' }), value: analytics.realtimeUsers ?? '-', icon: Activity, accent: 'text-green-400', pulse: true },
                  { label: tx({ fr: 'Visiteurs', en: 'Visitors', es: 'Visitantes' }), value: analytics.overview?.activeUsers || 0, icon: Users, accent: 'text-blue-400' },
                  { label: tx({ fr: 'Sessions', en: 'Sessions', es: 'Sesiones' }), value: analytics.overview?.sessions || 0, icon: MousePointerClick, accent: 'text-purple-400' },
                  { label: tx({ fr: 'Pages vues', en: 'Page views', es: 'Paginas vistas' }), value: analytics.overview?.pageViews || 0, icon: Eye, accent: 'text-cyan-400' },
                  { label: tx({ fr: 'Nouveaux', en: 'New users', es: 'Nuevos' }), value: analytics.overview?.newUsers || 0, icon: ArrowUpRight, accent: 'text-emerald-400' },
                  { label: tx({ fr: 'Taux rebond', en: 'Bounce rate', es: 'Tasa rebote' }), value: `${((analytics.overview?.bounceRate || 0) * 100).toFixed(1)}%`, icon: ArrowDownRight, accent: 'text-orange-400' },
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-3 card-bg shadow-lg shadow-black/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={14} className={card.accent} />
                        {card.pulse && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                        <span className="text-grey-muted text-[10px]">{card.label}</span>
                      </div>
                      <span className="text-xl font-heading font-bold text-heading">{card.value}</span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily visitors chart */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl bg-glass p-5 lg:col-span-2">
                  <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-400" />
                    {tx({ fr: 'Visiteurs quotidiens', en: 'Daily visitors', es: 'Visitantes diarios' })}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={analytics.daily || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.blue} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={colors.blue} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.cyan} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={colors.cyan} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fill: colors.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip suffix="" />} />
                      <Area type="monotone" dataKey="users" name={tx({ fr: 'Visiteurs', en: 'Visitors', es: 'Visitantes' })} stroke={colors.blue} strokeWidth={2} fill="url(#gradUsers)" />
                      <Area type="monotone" dataKey="pageViews" name={tx({ fr: 'Pages vues', en: 'Page views', es: 'Paginas' })} stroke={colors.cyan} strokeWidth={1.5} fill="url(#gradViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Top pages */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
                  <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
                    <Eye size={16} className="text-cyan-400" />
                    {tx({ fr: 'Pages les plus visitées', en: 'Most visited pages', es: 'Paginas mas visitadas' })}
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {(analytics.pages || []).map((page, i) => {
                      const maxViews = analytics.pages[0]?.views || 1;
                      return (
                        <div key={i} className="relative">
                          <div className="absolute inset-0 rounded-lg bg-cyan-500/10" style={{ width: `${(page.views / maxViews) * 100}%` }} />
                          <div className="relative flex items-center justify-between px-3 py-2">
                            <span className="text-xs text-heading truncate flex-1 font-mono">{page.path}</span>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                              <span className="text-xs text-grey-muted">{page.users} <Users size={10} className="inline" /></span>
                              <span className="text-xs text-heading font-semibold">{page.views}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Traffic sources */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
                  <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-green-400" />
                    {tx({ fr: 'Sources de trafic', en: 'Traffic sources', es: 'Fuentes de trafico' })}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-36 h-36 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={(analytics.sources || []).map((s, i) => ({ ...s, name: s.source, value: s.sessions, color: [colors.blue, colors.green, colors.purple, colors.yellow, colors.cyan, colors.red, colors.orange, colors.emerald, colors.accent, colors.gray][i % 10] }))}
                            cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={2} dataKey="value">
                            {(analytics.sources || []).map((_, i) => (
                              <Cell key={i} fill={[colors.blue, colors.green, colors.purple, colors.yellow, colors.cyan, colors.red, colors.orange, colors.emerald, colors.accent, colors.gray][i % 10]} fillOpacity={0.7} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5 max-h-36 overflow-y-auto">
                      {(analytics.sources || []).map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: [colors.blue, colors.green, colors.purple, colors.yellow, colors.cyan, colors.red, colors.orange, colors.emerald, colors.accent, colors.gray][i % 10], opacity: 0.7 }} />
                          <span className="text-grey-muted flex-1 truncate">{s.source}</span>
                          <span className="text-heading font-semibold">{s.sessions}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Countries */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
                  <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-purple-400" />
                    {tx({ fr: 'Pays', en: 'Countries', es: 'Paises' })}
                  </h3>
                  <div className="space-y-2">
                    {(analytics.countries || []).map((c, i) => {
                      const maxUsers = analytics.countries[0]?.users || 1;
                      return (
                        <div key={i} className="relative">
                          <div className="absolute inset-0 rounded-lg bg-purple-500/10" style={{ width: `${(c.users / maxUsers) * 100}%` }} />
                          <div className="relative flex items-center justify-between px-3 py-1.5">
                            <span className="text-xs text-heading">{c.country}</span>
                            <span className="text-xs text-heading font-semibold">{c.users} <Users size={10} className="inline text-grey-muted" /></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Devices */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
                  <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
                    <Monitor size={16} className="text-yellow-400" />
                    {tx({ fr: 'Appareils', en: 'Devices', es: 'Dispositivos' })}
                  </h3>
                  <div className="space-y-3">
                    {(analytics.devices || []).map((d, i) => {
                      const totalDeviceUsers = (analytics.devices || []).reduce((s, x) => s + x.users, 0) || 1;
                      const pct = ((d.users / totalDeviceUsers) * 100).toFixed(1);
                      const DevIcon = DEVICE_ICONS[d.device] || Monitor;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <DevIcon size={18} className="text-yellow-400 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-heading capitalize">{d.device}</span>
                              <span className="text-xs text-heading font-semibold">{pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-glass overflow-hidden">
                              <div className="h-full rounded-full bg-yellow-400/60" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <span className="text-xs text-grey-muted w-10 text-right">{d.users}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Age groups */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
                  <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
                    <Users size={16} className="text-emerald-400" />
                    {tx({ fr: 'Âge des visiteurs', en: 'Visitor age', es: 'Edad de visitantes' })}
                  </h3>
                  {(analytics.ageGroups || []).length === 0 ? (
                    <p className="text-grey-muted text-xs">{tx({ fr: 'Données insuffisantes', en: 'Insufficient data', es: 'Datos insuficientes' })}</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={analytics.ageGroups} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="age" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip suffix="" />} />
                        <Bar dataKey="users" fill={colors.emerald} radius={[4, 4, 0, 0]} barSize={30} fillOpacity={0.7} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              </div>

              {/* GA external links */}
              <div className="flex flex-wrap gap-3">
                <a href="https://analytics.google.com/analytics/web/#/p525792501/reports/dashboard" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass text-grey-muted text-xs hover:text-heading transition-colors">
                  GA4 Dashboard <ExternalLink size={10} />
                </a>
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass text-grey-muted text-xs hover:text-heading transition-colors">
                  Search Console <ExternalLink size={10} />
                </a>
                <a href="https://dashboard.stripe.com/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass text-grey-muted text-xs hover:text-heading transition-colors">
                  Stripe <ExternalLink size={10} />
                </a>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ═══════════ BUSINESS TAB ═══════════ */}
      {tab === 'business' && <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 card-bg shadow-lg shadow-black/20">
              <div className="flex items-center gap-2 mb-2"><Icon size={16} className={card.accent} /><span className="text-grey-muted text-xs">{card.label}</span></div>
              <span className="text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Export CSV button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const lines = [
              'Massive Medias - Bilan fiscal',
              `NEQ: 2269057891 | TPS: 732457635RT0001 | TVQ: 4012577678TQ0001`,
              '',
              'Sommaire',
              `Revenus totaux,${(stats.revenue?.totalDollars || 0).toFixed(2)}`,
              `Dépenses totales,${(stats.expenses?.total || 0).toFixed(2)}`,
              `Profit brut,${(stats.profit?.gross || 0).toFixed(2)}`,
              `Commandes,${stats.orderStats?.total || 0}`,
              '',
              'Taxes',
              ',TPS (5%),TVQ (9.975%)',
              `Perçue,${(stats.taxes?.tpsCollected || 0).toFixed(2)},${(stats.taxes?.tvqCollected || 0).toFixed(2)}`,
              `Payée,${(stats.taxes?.tpsPaid || 0).toFixed(2)},${(stats.taxes?.tvqPaid || 0).toFixed(2)}`,
              `À remettre,${(stats.taxes?.tpsNet || 0).toFixed(2)},${(stats.taxes?.tvqNet || 0).toFixed(2)}`,
              '',
              'Revenus mensuels',
              'Mois,Revenus ($),Commandes',
              ...(stats.revenue?.monthly || []).map(m => `${m.month},${(m.revenue / 100).toFixed(2)},${m.orders}`),
              '',
              'Dépenses par catégorie',
              'Categorie,Montant ($)',
              ...Object.entries(stats.expenses?.byCategory || {}).map(([cat, amt]) => `${cat},${amt.toFixed(2)}`),
              '',
              'Status des commandes',
              'Status,Nombre',
              ...Object.entries(stats.orderStats?.byStatus || {}).map(([s, c]) => `${s},${c}`),
              '',
              'Top clients',
              'Nom,Email,Total depense ($),Commandes',
              ...(stats.topClients || []).map(c => `"${c.name}","${c.email}",${(c.totalSpent / 100).toFixed(2)},${c.orderCount}`),
            ];
            downloadCSV(`massive-bilan-fiscal-${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'));
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/30 transition-colors"
        >
          <Download size={16} />
          {tx({ fr: 'Exporter CSV', en: 'Export CSV', es: 'Exportar CSV' })}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue - Area Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-green-400" />
            {tx({ fr: 'Revenus mensuels', en: 'Monthly revenue', es: 'Ingresos mensuales' })}
          </h3>
          {monthlyRev.length === 0 ? (
            <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune donnée', en: 'No data', es: 'Sin datos' })}</p>
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Receipt size={16} className="text-red-400" />
            {tx({ fr: 'Dépenses par catégorie', en: 'Expenses by category', es: 'Gastos por categoria' })}
          </h3>
          {expenseData.length === 0 ? (
            <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune donnée', en: 'No data', es: 'Sin datos' })}</p>
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
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
              <span className="text-grey-muted text-xs">{tx({ fr: 'Perçue', en: 'Collected', es: 'Cobrado' })}</span>
              <span className="text-heading text-center font-semibold">{(stats.taxes?.tpsCollected || 0).toFixed(2)}$</span>
              <span className="text-heading text-center font-semibold">{(stats.taxes?.tvqCollected || 0).toFixed(2)}$</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-grey-muted text-xs">{tx({ fr: 'Payée', en: 'Paid', es: 'Pagado' })}</span>
              <span className="text-heading text-center">{(stats.taxes?.tpsPaid || 0).toFixed(2)}$</span>
              <span className="text-heading text-center">{(stats.taxes?.tvqPaid || 0).toFixed(2)}$</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm shadow-[0_-1px_0_rgba(255,255,255,0.04)] pt-2">
              <span className="text-heading font-semibold text-xs">{tx({ fr: 'À remettre', en: 'Net owed', es: 'A remitir' })}</span>
              <span className={`text-center font-bold ${(stats.taxes?.tpsNet || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>{(stats.taxes?.tpsNet || 0).toFixed(2)}$</span>
              <span className={`text-center font-bold ${(stats.taxes?.tvqNet || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>{(stats.taxes?.tvqNet || 0).toFixed(2)}$</span>
            </div>
          </div>
        </motion.div>

        {/* KPIs calcules */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl bg-glass p-5 lg:col-span-2">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Users size={16} className="text-accent" />
            {tx({ fr: 'Top 10 clients', en: 'Top 10 clients', es: 'Top 10 clientes' })}
          </h3>
          {(stats.topClients || []).length === 0 ? (
            <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune donnée', en: 'No data', es: 'Sin datos' })}</p>
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
      </>}
    </div>
  );
}

export default AdminStats;
