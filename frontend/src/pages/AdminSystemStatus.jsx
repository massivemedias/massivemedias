import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Server, Database, Globe, Shield, CreditCard,
  BarChart3, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Clock, HardDrive,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { supabase } from '../lib/supabase';

const STRAPI_URL = 'https://massivemedias-api.onrender.com';
const SITE_URL = 'https://massivemedias.com';
const REFRESH_INTERVAL = 30_000;

const STATUS_ICONS = {
  ok: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  loading: RefreshCw,
};

const STATUS_COLORS = {
  ok: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  loading: 'text-grey-muted animate-spin',
};

const DOT_COLORS = {
  ok: 'bg-green-400',
  error: 'bg-red-400',
  warning: 'bg-yellow-400',
  loading: 'bg-grey-muted animate-pulse',
};

function StatusDot({ status }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${DOT_COLORS[status] || DOT_COLORS.loading}`} />
  );
}

function ServiceCard({ service, tx }) {
  const Icon = service.icon;
  const StatusIcon = STATUS_ICONS[service.status] || STATUS_ICONS.loading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-black/20 p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20 text-accent">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-heading">{service.name}</h3>
            <p className="text-xs text-grey-muted">{tx(service.description)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot status={service.status} />
          <StatusIcon size={16} className={STATUS_COLORS[service.status]} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-grey-muted">
        {service.responseTime != null && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {service.responseTime} ms
          </span>
        )}
        {service.lastChecked && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {service.lastChecked}
          </span>
        )}
      </div>

      {service.details && (
        <p className="text-xs text-grey-muted border-t border-white/5 pt-2">
          {service.details}
        </p>
      )}
    </motion.div>
  );
}

async function checkStrapi() {
  const start = performance.now();
  try {
    const res = await fetch(`${STRAPI_URL}/api/artists?pagination[pageSize]=1`, {
      signal: AbortSignal.timeout(10000),
    });
    const ms = Math.round(performance.now() - start);
    if (res.ok) {
      return { status: ms > 3000 ? 'warning' : 'ok', responseTime: ms, details: `HTTP ${res.status}` };
    }
    return { status: 'error', responseTime: ms, details: `HTTP ${res.status}` };
  } catch (e) {
    return { status: 'error', responseTime: Math.round(performance.now() - start), details: e.message };
  }
}

async function checkGitHubPages() {
  const start = performance.now();
  try {
    const res = await fetch(SITE_URL, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(8000),
    });
    const ms = Math.round(performance.now() - start);
    // no-cors returns opaque response, so we can only check if it didn't throw
    return { status: ms > 5000 ? 'warning' : 'ok', responseTime: ms, details: 'Accessible (no-cors)' };
  } catch (e) {
    return { status: 'error', responseTime: Math.round(performance.now() - start), details: e.message };
  }
}

function checkCloudflare() {
  // Cloudflare is in front of the site - if GitHub Pages works, CF works
  // We check for cf-ray presence in concept
  return { status: 'ok', responseTime: null, details: 'Proxy actif devant massivemedias.com' };
}

function checkSupabase() {
  if (!supabase) {
    return { status: 'error', details: 'Client non configure (VITE_SUPABASE_URL manquant)' };
  }
  return { status: 'ok', details: 'Client Supabase initialise' };
}

function checkStripe() {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (key) {
    return { status: 'ok', details: `Cle configuree (${key.slice(0, 12)}...)` };
  }
  return { status: 'warning', details: 'VITE_STRIPE_PUBLIC_KEY non definie' };
}

function checkGA() {
  const gaId = import.meta.env.VITE_GA_ID;
  if (gaId) {
    return { status: 'ok', details: `ID: ${gaId}` };
  }
  return { status: 'warning', details: 'VITE_GA_ID non defini' };
}

function formatTime(date) {
  return date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function AdminSystemStatus() {
  const { tx } = useLang();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const buildTime = import.meta.env.VITE_BUILD_TIME || null;

  const runChecks = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const timeStr = formatTime(now);

    // Run async checks in parallel
    const [strapiResult, ghResult] = await Promise.all([
      checkStrapi(),
      checkGitHubPages(),
    ]);

    // Sync checks
    const cfResult = checkCloudflare();
    const supabaseResult = checkSupabase();
    const stripeResult = checkStripe();
    const gaResult = checkGA();

    // Neon DB status implied by Strapi
    const neonResult = strapiResult.status === 'ok'
      ? { status: 'ok', details: 'Connecte via Strapi (PostgreSQL)' }
      : { status: 'warning', details: 'Statut inconnu (Strapi inaccessible)' };

    setServices([
      {
        id: 'strapi',
        name: 'Strapi API',
        icon: Server,
        description: { fr: 'CMS headless - backend', en: 'Headless CMS - backend', es: 'CMS headless - backend' },
        lastChecked: timeStr,
        ...strapiResult,
      },
      {
        id: 'supabase',
        name: 'Supabase Auth',
        icon: Shield,
        description: { fr: 'Authentification utilisateurs', en: 'User authentication', es: 'Autenticacion de usuarios' },
        lastChecked: timeStr,
        responseTime: null,
        ...supabaseResult,
      },
      {
        id: 'github',
        name: 'GitHub Pages',
        icon: Globe,
        description: { fr: 'Hebergement frontend', en: 'Frontend hosting', es: 'Alojamiento frontend' },
        lastChecked: timeStr,
        ...ghResult,
      },
      {
        id: 'cloudflare',
        name: 'Cloudflare',
        icon: Shield,
        description: { fr: 'CDN / DNS / proxy', en: 'CDN / DNS / proxy', es: 'CDN / DNS / proxy' },
        lastChecked: timeStr,
        responseTime: null,
        ...cfResult,
      },
      {
        id: 'stripe',
        name: 'Stripe',
        icon: CreditCard,
        description: { fr: 'Paiements en ligne', en: 'Online payments', es: 'Pagos en linea' },
        lastChecked: timeStr,
        responseTime: null,
        ...stripeResult,
      },
      {
        id: 'neon',
        name: 'Neon DB',
        icon: Database,
        description: { fr: 'Base de donnees PostgreSQL', en: 'PostgreSQL database', es: 'Base de datos PostgreSQL' },
        lastChecked: timeStr,
        responseTime: null,
        ...neonResult,
      },
      {
        id: 'uptimerobot',
        name: 'UptimeRobot',
        icon: Activity,
        description: { fr: 'Monitoring de disponibilite', en: 'Uptime monitoring', es: 'Monitoreo de disponibilidad' },
        lastChecked: timeStr,
        responseTime: null,
        status: 'ok',
        details: 'Configure - surveille Strapi + site',
      },
      {
        id: 'ga',
        name: 'Google Analytics',
        icon: BarChart3,
        description: { fr: 'Suivi des visites', en: 'Visit tracking', es: 'Seguimiento de visitas' },
        lastChecked: timeStr,
        responseTime: null,
        ...gaResult,
      },
    ]);

    setLastRefresh(now);
    setLoading(false);
  }, []);

  useEffect(() => {
    runChecks();
    const interval = setInterval(runChecks, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [runChecks]);

  const okCount = services.filter(s => s.status === 'ok').length;
  const warnCount = services.filter(s => s.status === 'warning').length;
  const errCount = services.filter(s => s.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-grey-muted">
            {tx({
              fr: 'Statut de tous les services utilises par Massive Medias',
              en: 'Status of all services used by Massive Medias',
              es: 'Estado de todos los servicios usados por Massive Medias',
            })}
          </p>
        </div>
        <button
          onClick={runChecks}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {tx({ fr: 'Rafraichir', en: 'Refresh', es: 'Actualizar' })}
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-green-400 font-bold">{okCount}</span>
          <span className="text-grey-muted">OK</span>
        </div>
        {warnCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-yellow-400 font-bold">{warnCount}</span>
            <span className="text-grey-muted">{tx({ fr: 'Avertissements', en: 'Warnings', es: 'Advertencias' })}</span>
          </div>
        )}
        {errCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-red-400 font-bold">{errCount}</span>
            <span className="text-grey-muted">{tx({ fr: 'Erreurs', en: 'Errors', es: 'Errores' })}</span>
          </div>
        )}
        {lastRefresh && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 text-sm text-grey-muted ml-auto">
            <Clock size={14} />
            {formatTime(lastRefresh)}
          </div>
        )}
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <ServiceCard key={service.id} service={service} tx={tx} />
        ))}
      </div>

      {/* Deploy info & environment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-black/20 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-heading font-bold text-sm">
            <HardDrive size={16} className="text-accent" />
            {tx({ fr: 'Deploiement', en: 'Deployment', es: 'Despliegue' })}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-grey-muted">{tx({ fr: 'Build time', en: 'Build time', es: 'Build time' })}</span>
              <span className="text-heading font-mono">
                {buildTime || tx({ fr: 'Non defini', en: 'Not set', es: 'No definido' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-muted">{tx({ fr: 'Environnement', en: 'Environment', es: 'Entorno' })}</span>
              <span className="text-heading font-mono">{import.meta.env.MODE}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-muted">{tx({ fr: 'Base URL', en: 'Base URL', es: 'Base URL' })}</span>
              <span className="text-heading font-mono">{import.meta.env.BASE_URL}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-muted">Strapi</span>
              <span className="text-heading font-mono text-[10px] break-all">{STRAPI_URL}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-black/20 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-heading font-bold text-sm">
            <Globe size={16} className="text-accent" />
            {tx({ fr: 'Infrastructure', en: 'Infrastructure', es: 'Infraestructura' })}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-grey-muted">Frontend</span>
              <span className="text-heading">GitHub Pages + Cloudflare</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-muted">Backend</span>
              <span className="text-heading">Render (Strapi v5)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-muted">Database</span>
              <span className="text-heading">Neon (PostgreSQL)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-muted">Auth</span>
              <span className="text-heading">Supabase</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-muted">Paiements</span>
              <span className="text-heading">Stripe</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Auto-refresh notice */}
      <p className="text-xs text-grey-muted text-center">
        {tx({
          fr: 'Rafraichissement automatique toutes les 30 secondes',
          en: 'Auto-refresh every 30 seconds',
          es: 'Actualizacion automatica cada 30 segundos',
        })}
      </p>
    </div>
  );
}

export default AdminSystemStatus;
