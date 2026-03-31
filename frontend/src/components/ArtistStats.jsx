import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, Users, Clock, Loader2, AlertCircle,
  Monitor, Smartphone, Tablet, Globe, TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { useLang } from '../i18n/LanguageContext';
import { getArtistAnalytics } from '../services/adminService';

// Lire les couleurs CSS du theme actif
function getThemeColor(varName, fallback = '#FF52A0') {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

// Tooltip custom pour matcher le theme
function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg card-bg shadow-lg shadow-black/20 px-3 py-2 backdrop-blur-sm">
      <p className="text-xs text-grey-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
          {typeof p.value === 'number' ? p.value.toFixed(0) : p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

// Formater la duree moyenne de session en min:sec
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

export default function ArtistStats({ artistSlug }) {
  const { tx } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (!artistSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    getArtistAnalytics(artistSlug, period)
      .then(({ data: res }) => setData(res.data || res))
      .catch((err) => {
        const msg = err.response?.data?.error || 'Failed to load analytics';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [artistSlug, period]);

  const colors = useMemo(() => ({
    accent: getThemeColor('--accent-color', '#FF52A0'),
    green: '#4ade80',
    blue: '#60a5fa',
    purple: '#c084fc',
    orange: '#fb923c',
    cyan: '#22d3ee',
  }), []);

  const PIE_COLORS = [colors.accent, colors.blue, colors.green, colors.purple, colors.orange];

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-grey-muted py-16">
        <Loader2 size={20} className="animate-spin" />
        <span>{tx({ fr: 'Chargement des statistiques...', en: 'Loading statistics...', es: 'Cargando estadisticas...' })}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400 py-8 justify-center">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const { overview, daily, sources, pages, devices } = data;

  // Noms lisibles pour les pages
  const formatPagePath = (path) => {
    if (path === '/' || path === `/artistes/${artistSlug}`) {
      return tx({ fr: 'Page principale', en: 'Main page', es: 'Pagina principal' });
    }
    // Extraire le dernier segment
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || path;
    return last.charAt(0).toUpperCase() + last.slice(1);
  };

  const statCards = [
    {
      label: tx({ fr: 'Pages vues', en: 'Page views', es: 'Paginas vistas' }),
      value: overview.pageViews,
      icon: Eye,
      color: colors.accent,
    },
    {
      label: tx({ fr: 'Visiteurs uniques', en: 'Unique visitors', es: 'Visitantes unicos' }),
      value: overview.activeUsers,
      icon: Users,
      color: colors.blue,
    },
    {
      label: tx({ fr: 'Duree moy.', en: 'Avg. duration', es: 'Duracion prom.' }),
      value: formatDuration(overview.avgSessionDuration),
      icon: Clock,
      color: colors.purple,
      isText: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Selecteur de periode */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-heading flex items-center gap-2">
          <TrendingUp size={20} className="text-accent" />
          {tx({ fr: 'Statistiques de ta page', en: 'Your page statistics', es: 'Estadisticas de tu pagina' })}
        </h3>
        <div className="flex gap-2">
          {[7, 30, 90].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                period === p
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'bg-bg-card text-grey-muted hover:text-heading'
              }`}
            >
              {p === 7
                ? tx({ fr: '7 jours', en: '7 days', es: '7 dias' })
                : p === 30
                ? tx({ fr: '30 jours', en: '30 days', es: '30 dias' })
                : tx({ fr: '90 jours', en: '90 days', es: '90 dias' })}
            </button>
          ))}
        </div>
      </div>

      {/* Cartes resume */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-bg rounded-xl p-4 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${card.color}20` }}>
                  <Icon size={16} style={{ color: card.color }} />
                </div>
                <span className="text-xs text-grey-muted">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-heading">
                {card.isText ? card.value : card.value.toLocaleString()}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Graphique vues par jour */}
      {daily && daily.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-bg rounded-xl p-4 border border-white/5"
        >
          <h4 className="text-sm font-medium text-heading mb-4 flex items-center gap-2">
            <Eye size={16} className="text-accent" />
            {tx({ fr: 'Vues par jour', en: 'Daily views', es: 'Vistas por dia' })}
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="artistViewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="pageViews"
                stroke={colors.accent}
                strokeWidth={2}
                fill="url(#artistViewsGradient)"
                name={tx({ fr: 'Vues', en: 'Views', es: 'Vistas' })}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Sources de trafic */}
        {sources && sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-bg rounded-xl p-4 border border-white/5"
          >
            <h4 className="text-sm font-medium text-heading mb-3 flex items-center gap-2">
              <Globe size={16} className="text-accent" />
              {tx({ fr: "D'ou viennent tes visiteurs", en: 'Where your visitors come from', es: 'De donde vienen tus visitantes' })}
            </h4>
            <div className="space-y-2">
              {sources.slice(0, 8).map((s, i) => {
                const maxUsers = sources[0]?.users || 1;
                const pct = Math.round((s.users / maxUsers) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-heading w-28 truncate" title={s.source}>
                      {s.source === '(not set)' || s.source === '(direct)'
                        ? tx({ fr: 'Acces direct', en: 'Direct', es: 'Directo' })
                        : s.source}
                    </span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs text-grey-muted w-8 text-right">{s.users}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Appareils */}
        {devices && devices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card-bg rounded-xl p-4 border border-white/5"
          >
            <h4 className="text-sm font-medium text-heading mb-3 flex items-center gap-2">
              <Monitor size={16} className="text-accent" />
              {tx({ fr: 'Appareils', en: 'Devices', es: 'Dispositivos' })}
            </h4>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={devices}
                    dataKey="users"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={30}
                  >
                    {devices.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {devices.map((d, i) => {
                const DevIcon = DEVICE_ICONS[d.device] || Monitor;
                return (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <DevIcon size={14} style={{ color: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-grey-muted capitalize">{d.device}</span>
                    <span className="text-heading font-medium">{d.users}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Pages les plus vues */}
      {pages && pages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-bg rounded-xl p-4 border border-white/5"
        >
          <h4 className="text-sm font-medium text-heading mb-3 flex items-center gap-2">
            <Eye size={16} className="text-accent" />
            {tx({ fr: 'Pages les plus vues', en: 'Most viewed pages', es: 'Paginas mas vistas' })}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-grey-muted text-xs border-b border-white/5">
                  <th className="text-left py-2 font-medium">
                    {tx({ fr: 'Page', en: 'Page', es: 'Pagina' })}
                  </th>
                  <th className="text-right py-2 font-medium">
                    {tx({ fr: 'Vues', en: 'Views', es: 'Vistas' })}
                  </th>
                  <th className="text-right py-2 font-medium">
                    {tx({ fr: 'Visiteurs', en: 'Visitors', es: 'Visitantes' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.slice(0, 10).map((p, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-2 text-heading truncate max-w-[200px]" title={p.path}>
                      {formatPagePath(p.path)}
                    </td>
                    <td className="py-2 text-right text-heading font-medium">
                      {p.views.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-grey-muted">
                      {p.users.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Message si aucune donnee */}
      {overview.pageViews === 0 && (
        <div className="text-center py-8 text-grey-muted">
          <Eye size={32} className="mx-auto mb-3 opacity-30" />
          <p>{tx({ fr: 'Aucune visite enregistree pour cette periode.', en: 'No visits recorded for this period.', es: 'Sin visitas registradas para este periodo.' })}</p>
          <p className="text-xs mt-1">{tx({ fr: 'Partage ta page pour attirer des visiteurs!', en: 'Share your page to attract visitors!', es: 'Comparte tu pagina para atraer visitantes!' })}</p>
        </div>
      )}
    </div>
  );
}
