import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Package, MessageSquare, Receipt,
  BarChart3, DollarSign, Banknote, AlertCircle,
  Loader2, ArrowRight, StickyNote, Clock, CheckCircle, Truck, Activity,
  UserPlus, Eye, Users, Globe, Zap, TrendingUp, AlertTriangle, ChevronDown, ChevronUp,
  Plus,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getOrders, getContactSubmissions, getExpenses, getAnalytics } from '../services/adminService';
import api from '../services/api';
import AnnualBalanceCard from '../components/AnnualBalanceCard';

// FIX-NOTES-FETCH (23 avril 2026) : on abandonne le wrapper getAdminNotes
// et on utilise api.get('/admin-notes/list') EN DIRECT, exactement comme
// AdminNotes.jsx. Ca elimine toute divergence possible entre les deux endpoints.
const NOTES_LOCAL_KEY = 'mm-admin-notes';
function loadLocalNotesFallback() {
  try {
    const raw = localStorage.getItem(NOTES_LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

// FIX-NOTES (avril 2026) : le widget Notes lisait localStorage qui etait quasi
// toujours vide -> affichait "Aucune note". On branche maintenant sur le content-type
// admin-note (meme source que la page complete /admin/notes) via getAdminNotes().

/**
 * Calcule un texte "il y a X" a partir d'un timestamp.
 * Retourne : "a l'instant" | "il y a Xm" | "il y a Xh" | "il y a Xj" | "il y a Xsem".
 */
function timeAgo(ts, tx) {
  if (!ts) return '';
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return tx({ fr: "a l'instant", en: 'just now', es: 'ahora' });
  if (mins < 60) return tx({ fr: `il y a ${mins}m`, en: `${mins}m ago`, es: `hace ${mins}m` });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return tx({ fr: `il y a ${hours}h`, en: `${hours}h ago`, es: `hace ${hours}h` });
  const days = Math.floor(hours / 24);
  if (days < 7) return tx({ fr: `il y a ${days}j`, en: `${days}d ago`, es: `hace ${days}d` });
  const weeks = Math.floor(days / 7);
  return tx({ fr: `il y a ${weeks}sem`, en: `${weeks}w ago`, es: `hace ${weeks}sem` });
}

/** Deballe le body richtext (peut contenir HTML) en texte plain pour l'excerpt. */
function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Montants stockes en cents dans Strapi - afficher en dollars
const dollars = (v) => `${((v || 0) / 100).toFixed(2)}$`;

// FIX-DASH (avril 2026) : Dashboard enrichi en centre de controle ultra-actionnable.
// Les stats detaillees (AdminStats) sont desormais integrees au bas de la page via
// un toggle "Afficher les statistiques detaillees" qui lazy-charge le composant.
const AdminStats = lazy(() => import('./AdminStats'));

// --- StatCard reutilisable (accepte maintenant un subValue optionnel) ---
function StatCard({ icon: Icon, label, value, subValue, color, to, highlight }) {
  const content = (
    <div className={`flex items-center gap-3 p-4 rounded-xl bg-black/20 hover:bg-black/25 transition-all group ${highlight ? 'ring-1 ring-accent/30' : ''}`}>
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xl font-bold text-heading leading-tight">{value}</span>
          {subValue && (
            <span className={`text-xs font-semibold ${color.includes('text-') ? color.split(' ').find(c => c.startsWith('text-')) : 'text-grey-muted'}`}>
              {subValue}
            </span>
          )}
        </div>
        <p className="text-xs text-grey-muted truncate">{label}</p>
      </div>
      {to && <ArrowRight size={14} className="ml-auto text-grey-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

// --- Alerte compacte cliquable ---
function AlertRow({ icon: Icon, iconColor, text, sub, to }) {
  const body = (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-black/20 transition-colors group">
      <Icon size={16} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-heading leading-snug">{text}</p>
        {sub && <p className="text-[11px] text-grey-muted mt-0.5">{sub}</p>}
      </div>
      {to && <ArrowRight size={14} className="text-grey-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function AdminDashboard() {
  const { tx } = useLang();
  const [loading, setLoading] = useState(true);

  // Donnees brutes utilisees par KPIs + section Alertes
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Revenue agrege
  const [revenue, setRevenue] = useState({ total: 0, orders: 0, commissions: 0 });

  // Notes (CMS admin-note, pas localStorage).
  // Le widget Dashboard affiche uniquement les 3 plus recentes en preview,
  // l'edition complete se fait dans /admin/notes.
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);

  // Toggle stats detaillees (lazy-loaded)
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
      const withTimeout = (p) => Promise.race([p, timeout(8000)]);
      try {
        const [ordersRes, messagesRes, inventoryRes, expensesRes, usersRes, analyticsRes] = await Promise.allSettled([
          withTimeout(getOrders({ pageSize: 500 })),
          withTimeout(getContactSubmissions()),
          withTimeout(api.get('/inventory-items/dashboard')),
          withTimeout(getExpenses()),
          withTimeout(api.get('/user-roles')),
          withTimeout(getAnalytics(3)),
        ]);

        if (cancelled) return;

        // FIX-CRASH (avril 2026) : certaines reponses API remontent un objet
        // wrapper {data: [...], meta: {...}} (Strapi) au lieu d'un array direct.
        // Si on laissait passer l'objet, .filter() crashait avec
        // "TypeError: u.filter is not a function" au premier render.
        // Helper qui deballe jusqu'a trouver un array, sinon retourne [].
        const toArray = (val) => {
          if (Array.isArray(val)) return val;
          if (val && typeof val === 'object') {
            if (Array.isArray(val.data)) return val.data;
            if (Array.isArray(val.data?.data)) return val.data.data;
            if (Array.isArray(val.items)) return val.items;
            if (Array.isArray(val.results)) return val.results;
          }
          return [];
        };

        setOrders(ordersRes.status === 'fulfilled' ? toArray(ordersRes.value?.data) : []);
        setMessages(messagesRes.status === 'fulfilled' ? toArray(messagesRes.value?.data) : []);
        setInventory(inventoryRes.status === 'fulfilled' ? toArray(inventoryRes.value?.data) : []);
        setUsers(usersRes.status === 'fulfilled' ? toArray(usersRes.value?.data) : []);
        // Analytics reste un object (pas un array) : structure { overview, pages, sources, ... }
        setAnalytics(analyticsRes.status === 'fulfilled' ? (analyticsRes.value?.data?.data || analyticsRes.value?.data || null) : null);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // FIX-NOTES-FETCH (23 avril 2026) : fetch identique a AdminNotes.jsx ligne 26-63.
  // EXACTEMENT meme endpoint (api.get direct, pas de wrapper), meme extraction
  // (res.data?.data), meme fallback localStorage sur erreur. La seule difference
  // est qu'on conserve body + createdAt en plus pour l'excerpt/timeAgo du widget.
  useEffect(() => {
    let cancelled = false;
    async function fetchNotes() {
      try {
        const res = await api.get('/admin-notes/list');
        if (cancelled) return;

        // Log de diagnostic : si le widget affiche encore "Aucune note" malgre
        // des entrees en BDD, ce log montrera EXACTEMENT ce que renvoie l'API.
        // A supprimer une fois le bug client confirme resolu.
        console.log('[Dashboard.Notes] API response shape :', {
          hasData: !!res?.data,
          dataIsArray: Array.isArray(res?.data),
          hasDataData: !!res?.data?.data,
          dataDataLength: Array.isArray(res?.data?.data) ? res.data.data.length : 'not array',
          sampleKeys: res?.data?.data?.[0] ? Object.keys(res.data.data[0]) : null,
        });

        const cmsNotes = (res.data?.data || []).map(n => ({
          id: n.documentId || n.id,
          title: n.title || '',
          body: n.body || '',
          updatedAt: n.updatedAt ? new Date(n.updatedAt).getTime() : 0,
          createdAt: n.createdAt ? new Date(n.createdAt).getTime() : 0,
          pinned: !!n.pinned,
          color: n.color || '',
        }));
        setNotes(cmsNotes);
      } catch (err) {
        console.warn('[Dashboard.Notes] Fetch failed, fallback localStorage:', err?.response?.status, err?.message);
        if (cancelled) return;
        // Fallback localStorage IDENTIQUE a AdminNotes.jsx : meme STORAGE_KEY,
        // meme shape de mapping. Si AdminNotes affiche les notes depuis
        // localStorage, le Dashboard les verra aussi.
        const local = loadLocalNotesFallback();
        setNotes(local.map(n => ({
          id: n.id,
          title: n.title || '',
          body: n.body || '',
          updatedAt: n.updatedAt || Date.now(),
          createdAt: n.createdAt || 0,
          pinned: !!n.pinned,
          color: n.color || '',
        })));
      } finally {
        if (!cancelled) setNotesLoading(false);
      }
    }
    fetchNotes();
    const interval = setInterval(fetchNotes, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    const fetchRevenue = () => {
      Promise.all([
        api.get('/orders/stats').catch(() => ({ data: {} })),
        api.get('/orders/commissions').catch(() => ({ data: { artists: [] } })),
      ]).then(([statsRes, commRes]) => {
        const d = statsRes.data;
        const artists = commRes.data?.artists || [];
        const totalCommissions = artists.reduce((s, a) => s + (a.totalCommission || 0), 0);
        const paidOrders = (d.orderStats?.byStatus?.paid || 0) + (d.orderStats?.byStatus?.processing || 0) + (d.orderStats?.byStatus?.ready || 0) + (d.orderStats?.byStatus?.shipped || 0) + (d.orderStats?.byStatus?.delivered || 0);
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

  // ---------- Derived KPIs (useMemo pour eviter les recalculs a chaque render) ----------
  // FIX-CRASH (avril 2026) : defense a deux niveaux pour eviter les
  // "TypeError: filter is not a function" si une reponse API arrive sous
  // forme d'object wrapper inattendu. Les setters force-array deja, mais on
  // double-garde ici avec Array.isArray + fallback [] au cas ou le state
  // initial serait patche par un code externe.
  const kpis = useMemo(() => {
    const safeOrders    = Array.isArray(orders)    ? orders    : [];
    const safeMessages  = Array.isArray(messages)  ? messages  : [];
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    const safeUsers     = Array.isArray(users)     ? users     : [];

    const pendingOrders = safeOrders.filter(o => o && (o.status === 'pending' || o.status === 'paid'));
    const pendingAmountCents = pendingOrders.reduce((s, o) => s + (Number(o?.total) || 0), 0);
    const processing = safeOrders.filter(o => o?.status === 'processing').length;
    const ready = safeOrders.filter(o => o?.status === 'ready');
    const unreadMessages = safeMessages.filter(m => m && (m.status === 'new' || m.status === 'unread')).length;
    const lowStockItems = safeInventory.filter(i => i && typeof i.quantity === 'number' && i.quantity <= (i.lowStockThreshold || 5));
    const outOfStockItems = safeInventory.filter(i => i && typeof i.quantity === 'number' && i.quantity === 0);
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const newUsers3d = safeUsers.filter(u => u?.createdAt && new Date(u.createdAt).getTime() >= threeDaysAgo).length;

    // Analytics champs bien connus (GA4 via backend /analytics/stats) :
    //   overview.activeUsers | overview.realtimeUsers | realtimeUsers
    //   pages[0] = { path, views }
    const realtimeUsers = analytics?.realtimeUsers ?? analytics?.overview?.realtimeUsers ?? analytics?.overview?.activeUsers ?? 0;
    const visitorsTodayRaw = analytics?.visitorsToday ?? analytics?.uniqueVisitors ?? analytics?.overview?.activeUsers ?? '-';
    const visitorsToday = typeof visitorsTodayRaw === 'object' ? '-' : String(visitorsTodayRaw);
    const pagesArr = Array.isArray(analytics?.pages) ? analytics.pages : [];
    const topPage = pagesArr[0] || null;

    return {
      pendingCount: pendingOrders.length,
      pendingAmountCents,
      processing,
      readyOrders: ready,
      unreadMessages,
      lowStockItems,
      outOfStockItems,
      newUsers3d,
      totalUsers: safeUsers.length,
      realtimeUsers,
      visitorsToday,
      topPage,
    };
  }, [orders, messages, inventory, users, analytics]);

  // L'edition des notes est desormais deportee dans /admin/notes (CRUD complet).
  // Le widget Dashboard est purement en lecture pour preview rapide.

  // Top 3 notes : pinned en premier, puis triees par updatedAt desc.
  // Le champ `pinned` vient du schema admin-note (existe deja cote backend).
  const topNotes = useMemo(() => {
    const safe = Array.isArray(notes) ? notes : [];
    return [...safe]
      .sort((a, b) => {
        // Epinglees toujours en tete
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        // Fallback createdAt si updatedAt=0 (note non encore sauvegardee)
        return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
      })
      .slice(0, 3);
  }, [notes]);

  // ---------- Alertes et actions du jour ----------
  // FIX-HOOKS (23 avril 2026) : ce useMemo DOIT etre declare AVANT le
  // "if (loading) return" sinon Rules of Hooks violation : au premier render
  // (loading=true) le hook n'est pas atteint, au 2e render il l'est, React
  // voit un nombre different de hooks entre renders -> Error #310 crash.
  // TOUS les hooks du composant sont maintenant au top, early returns apres.
  //
  // Consolidation des 3 sources d'alertes (commandes pretes / ruptures stock /
  // stock faible) dans un seul tableau pour pouvoir appliquer slice(0, 3) et
  // limiter l'encombrement vertical du widget. Le badge en haut affiche
  // TOUJOURS le total reel, pas le nombre affiche.
  const alertsList = useMemo(() => {
    const out = [];
    // 1. Commandes pretes a remettre (priorite max : action client directe)
    for (const o of kpis.readyOrders) {
      out.push({
        key: `ready-${o.documentId || o.id}`,
        kind: 'ready',
        icon: Package,
        iconColor: 'text-orange-400',
        text: tx({
          fr: `La commande de ${o.customerName || 'client inconnu'} est prete pour la cueillette.`,
          en: `${o.customerName || 'unknown client'}'s order is ready for pickup.`,
          es: `El pedido de ${o.customerName || 'cliente'} esta listo para recoger.`,
        }),
        sub: o.total ? `${dollars(o.total)} - ${o.customerEmail || ''}` : (o.customerEmail || ''),
        to: '/admin/commandes',
      });
    }
    // 2. Ruptures totales de stock (qty = 0)
    for (const it of kpis.outOfStockItems) {
      out.push({
        key: `oos-${it.documentId || it.id}`,
        kind: 'out-of-stock',
        icon: AlertCircle,
        iconColor: 'text-red-400',
        text: tx({
          fr: `Rupture de stock : ${it.nameFr || it.nameEn || it.sku || 'item'}.`,
          en: `Out of stock: ${it.nameEn || it.nameFr || it.sku || 'item'}.`,
          es: `Sin stock: ${it.nameFr || it.nameEn || it.sku}.`,
        }),
        sub: it.category ? `Cat: ${it.category}${it.location ? ` - ${it.location}` : ''}` : null,
        to: '/admin/inventaire',
      });
    }
    // 3. Stock faible (qty > 0 mais <= threshold) - on exclut les ruptures
    for (const it of kpis.lowStockItems) {
      if (!(it.quantity > 0)) continue;
      out.push({
        key: `low-${it.documentId || it.id}`,
        kind: 'low-stock',
        icon: AlertTriangle,
        iconColor: 'text-yellow-400',
        text: tx({
          fr: `Stock faible : ${it.nameFr || it.nameEn || it.sku} (${it.quantity} restant${it.quantity > 1 ? 's' : ''}).`,
          en: `Low stock: ${it.nameEn || it.nameFr || it.sku} (${it.quantity} left).`,
          es: `Stock bajo: ${it.nameFr || it.nameEn || it.sku}.`,
        }),
        sub: it.category ? `Cat: ${it.category}` : null,
        to: '/admin/inventaire',
      });
    }
    return out;
  }, [kpis.readyOrders, kpis.outOfStockItems, kpis.lowStockItems, tx]);

  // Derived plain values (non-hooks) - peuvent rester ici, pas besoin d'etre
  // au-dessus du if. Mais on les garde ici pour la proximite avec alertsList.
  const totalAlertsCount = alertsList.length;
  const visibleAlerts = alertsList.slice(0, 3);
  const hiddenAlertsCount = Math.max(0, totalAlertsCount - 3);
  const hasAlerts = totalAlertsCount > 0;

  // ========== EARLY RETURNS ICI, PAS AVANT ==========
  // Aucun hook React ne doit etre appele apres ce point. Si tu ajoutes un
  // useState / useEffect / useMemo / useCallback / useRef, mets-le AU-DESSUS
  // de ce commentaire sinon React Error #310 au prochain toggle loading.
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ===== RANGEE 1 : KPIs business (revenus / ventes / commissions) ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={ShoppingBag}
          label={tx({ fr: 'Ventes', en: 'Sales', es: 'Ventas' })}
          value={revenue.orders || 0}
          color="bg-green-500/15 text-green-400"
          to="/admin/commandes"
        />
        <StatCard
          icon={DollarSign}
          label={tx({ fr: 'Revenus', en: 'Revenue', es: 'Ingresos' })}
          value={`${(revenue.total || 0).toFixed(0)}$`}
          color="bg-accent/15 text-accent"
          to="/admin/commandes"
        />
        <StatCard
          icon={Banknote}
          label={tx({ fr: 'Commissions artistes', en: 'Artist commissions', es: 'Comisiones' })}
          value={`${(revenue.commissions || 0).toFixed(0)}$`}
          color="bg-blue-500/15 text-blue-400"
          to="/admin/artists"
        />
        <StatCard
          icon={Clock}
          label={tx({ fr: 'En attente', en: 'Pending', es: 'Pendientes' })}
          value={kpis.pendingCount}
          subValue={kpis.pendingAmountCents > 0 ? `(${dollars(kpis.pendingAmountCents)})` : null}
          color="bg-yellow-500/15 text-yellow-400"
          to="/admin/commandes"
          highlight={kpis.pendingCount > 0}
        />
      </div>

      {/* ===== RANGEE 2 : operations + messages + utilisateurs ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Package}
          label={tx({ fr: 'En production', en: 'Processing', es: 'En produccion' })}
          value={kpis.processing}
          color="bg-blue-500/15 text-blue-400"
          to="/admin/commandes"
        />
        <StatCard
          icon={MessageSquare}
          label={tx({ fr: 'Messages', en: 'Messages', es: 'Mensajes' })}
          value={kpis.unreadMessages || '0'}
          color={kpis.unreadMessages > 0 ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-grey-muted'}
          to="/admin/messages"
        />
        <StatCard
          icon={Users}
          label={tx({ fr: 'Utilisateurs totaux', en: 'Total users', es: 'Usuarios totales' })}
          value={kpis.totalUsers}
          subValue={kpis.newUsers3d > 0 ? `+${kpis.newUsers3d} 3j` : null}
          color="bg-purple-500/15 text-purple-400"
          to="/admin/utilisateurs"
        />
        <StatCard
          icon={UserPlus}
          label={tx({ fr: 'Nouveaux (3j)', en: 'New (3d)', es: 'Nuevos (3d)' })}
          value={kpis.newUsers3d}
          color={kpis.newUsers3d > 0 ? 'bg-purple-500/15 text-purple-400' : 'bg-white/5 text-grey-muted'}
          to="/admin/utilisateurs"
        />
      </div>

      {/* ===== RANGEE 3 : trafic en direct ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Zap}
          label={tx({ fr: 'Actifs maintenant', en: 'Active now', es: 'Activos ahora' })}
          value={kpis.realtimeUsers}
          color={kpis.realtimeUsers > 0 ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-grey-muted'}
        />
        <StatCard
          icon={Eye}
          label={tx({ fr: 'Visiteurs uniques', en: 'Unique visitors', es: 'Visitantes' })}
          value={kpis.visitorsToday}
          color="bg-cyan-500/15 text-cyan-400"
        />
        <StatCard
          icon={TrendingUp}
          label={tx({ fr: 'Page la plus vue', en: 'Top page', es: 'Pagina mas vista' })}
          value={kpis.topPage ? (kpis.topPage.path || kpis.topPage.pagePath || '-') : '-'}
          subValue={kpis.topPage?.views ? `${kpis.topPage.views} vues` : null}
          color="bg-pink-500/15 text-pink-400"
        />
        <StatCard
          icon={Globe}
          label={tx({ fr: 'Stock faible', en: 'Low stock', es: 'Stock bajo' })}
          value={kpis.lowStockItems.length}
          color={kpis.lowStockItems.length > 0 ? 'bg-orange-500/15 text-orange-400' : 'bg-white/5 text-grey-muted'}
          to="/admin/inventaire"
        />
      </div>

      {/* ===== ALERTES & ACTIONS DU JOUR =====
          Limite a 3 elements visibles pour eviter l'encombrement vertical.
          Le badge en haut garde le total reel (ex: 42). Une ligne discrete
          en bas signale combien d'alertes restent masquees. */}
      <div className="rounded-2xl p-4 md:p-5 card-bg">
        <h3 className="text-heading font-heading font-bold text-base flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className={hasAlerts ? 'text-yellow-400' : 'text-green-400'} />
          {tx({
            fr: `Alertes & actions du jour`,
            en: 'Alerts & actions for today',
            es: 'Alertas & acciones del dia',
          })}
          {hasAlerts && (
            <span className="ml-auto text-[11px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
              {totalAlertsCount}
            </span>
          )}
        </h3>

        {!hasAlerts ? (
          <div className="flex items-center gap-2 px-3 py-4 text-sm text-grey-muted">
            <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
            {tx({
              fr: 'Rien d\'urgent. Les commandes sont a jour, le stock est OK. Profite de ta journee.',
              en: 'Nothing urgent. Orders are up to date, stock is fine. Enjoy your day.',
              es: 'Nada urgente. Pedidos al dia, stock OK.',
            })}
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {visibleAlerts.map(a => (
                <AlertRow
                  key={a.key}
                  icon={a.icon}
                  iconColor={a.iconColor}
                  text={a.text}
                  sub={a.sub}
                  to={a.to}
                />
              ))}
            </div>

            {hiddenAlertsCount > 0 && (
              <p className="mt-3 text-center text-[11px] text-grey-muted/70 italic">
                {tx({
                  fr: `+ ${hiddenAlertsCount} autres alerte${hiddenAlertsCount > 1 ? 's' : ''} (voir les onglets Commandes et Inventaire)`,
                  en: `+ ${hiddenAlertsCount} more alert${hiddenAlertsCount > 1 ? 's' : ''} (see Orders and Inventory tabs)`,
                  es: `+ ${hiddenAlertsCount} alertas mas (ver pestanas Pedidos e Inventario)`,
                })}
              </p>
            )}
          </>
        )}
      </div>

      {/* ===== BILAN ANNUEL (revenus + depenses + taxes + net a remettre) ===== */}
      {/* Deplace depuis AdminDepenses (avril 2026) : sa place naturelle est ici
          car il melange revenus et depenses. Inclut le Guide Express finances. */}
      <AnnualBalanceCard />

      {/* ===== NOTES (widget preview - 3 plus recentes, edition dans /admin/notes) ===== */}
      <div className="rounded-2xl p-4 md:p-5 card-bg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-heading font-heading font-bold text-sm flex items-center gap-2">
            <StickyNote size={16} className="text-accent" />
            {tx({ fr: 'Notes recentes', en: 'Recent notes', es: 'Notas recientes' })}
          </h3>
          <Link to="/admin/notes" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
            <Plus size={12} />
            {tx({ fr: 'Nouvelle', en: 'New', es: 'Nueva' })}
          </Link>
        </div>

        {notesLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={16} className="animate-spin text-accent" />
          </div>
        ) : topNotes.length === 0 ? (
          <Link to="/admin/notes" className="block text-center py-6 rounded-lg bg-black/10 hover:bg-black/20 transition-colors">
            <StickyNote size={20} className="mx-auto mb-1.5 text-grey-muted opacity-50" />
            <p className="text-xs text-grey-muted">
              {tx({ fr: 'Aucune note pour l\'instant', en: 'No notes yet', es: 'Aun no hay notas' })}
            </p>
            <p className="text-[11px] text-accent mt-1">
              {tx({ fr: 'Cliquer pour creer la premiere', en: 'Click to create first one', es: 'Clic para crear' })}
            </p>
          </Link>
        ) : (
          <>
            <div className="space-y-2">
              {topNotes.map((n) => {
                const excerpt = stripHtml(n.body);
                const truncated = excerpt.length > 120 ? excerpt.slice(0, 120) + '...' : excerpt;
                const when = timeAgo(n.updatedAt || n.createdAt, tx);
                return (
                  <Link
                    key={n.id}
                    to="/admin/notes"
                    className="block rounded-lg bg-black/20 hover:bg-black/30 transition-colors p-3 group"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="text-heading text-sm font-bold truncate flex-1">
                        {n.title || tx({ fr: 'Sans titre', en: 'Untitled', es: 'Sin titulo' })}
                      </p>
                      {when && (
                        <span className="text-[10px] text-grey-muted flex-shrink-0 font-mono">
                          {when}
                        </span>
                      )}
                    </div>
                    {truncated && (
                      <p className="text-grey-muted text-xs line-clamp-2 leading-relaxed">
                        {truncated}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Lien "Voir toutes les notes" si > 3 notes totales */}
            {notes.length > 3 && (
              <Link
                to="/admin/notes"
                className="flex items-center justify-center gap-1.5 mt-3 py-2 rounded-lg text-xs text-grey-muted hover:text-accent hover:bg-black/10 transition-colors"
              >
                {tx({
                  fr: `Voir toutes les notes (${notes.length})`,
                  en: `View all notes (${notes.length})`,
                  es: `Ver todas (${notes.length})`,
                })}
                <ArrowRight size={12} />
              </Link>
            )}
          </>
        )}
      </div>

      {/* ===== SYSTEMES ===== */}
      <SystemStatusWidget tx={tx} />

      {/* ===== TOGGLE STATS DETAILLEES (lazy-loaded) ===== */}
      <div>
        <button
          type="button"
          onClick={() => setShowStats(v => !v)}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl card-bg hover:bg-black/30 transition-colors border border-white/5"
        >
          <BarChart3 size={18} className="text-accent" />
          <span className="text-heading font-heading font-bold text-sm">
            {showStats
              ? tx({ fr: 'Masquer les statistiques detaillees', en: 'Hide detailed statistics', es: 'Ocultar estadisticas' })
              : tx({ fr: 'Afficher les statistiques detaillees', en: 'Show detailed statistics', es: 'Mostrar estadisticas' })}
          </span>
          {showStats ? <ChevronUp size={16} className="text-grey-muted" /> : <ChevronDown size={16} className="text-grey-muted" />}
        </button>

        <AnimatePresence initial={false}>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden mt-4"
            >
              <Suspense fallback={
                <div className="flex items-center justify-center py-12 card-bg rounded-2xl">
                  <Loader2 size={28} className="animate-spin text-accent" />
                </div>
              }>
                <AdminStats />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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

    try {
      const start = Date.now();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://massivemedias-api.onrender.com/api'}/artists?pagination[pageSize]=1`, { signal: AbortSignal.timeout(8000) });
      results.push({ name: 'Render', ok: res.ok, ms: Date.now() - start });
    } catch {
      results.push({ name: 'Render', ok: false, ms: 0 });
    }

    results.push({ name: 'Strapi', ok: results[0]?.ok });
    results.push({ name: 'Neon DB', ok: results[0]?.ok });

    try {
      const start = Date.now();
      await fetch('https://massivemedias.com/', { mode: 'no-cors', signal: AbortSignal.timeout(5000) });
      results.push({ name: 'Cloudflare Pages', ok: true, ms: Date.now() - start });
    } catch {
      results.push({ name: 'Cloudflare Pages', ok: false, ms: 0 });
    }

    results.push({ name: 'Supabase', ok: !!import.meta.env.VITE_SUPABASE_URL });
    results.push({ name: 'Stripe', ok: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY });
    results.push({ name: 'Analytics', ok: !!import.meta.env.VITE_GA_ID });

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
