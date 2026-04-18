import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, ChevronUp, ShoppingBag, DollarSign,
  Clock, Truck, Package, CreditCard, CheckCircle, XCircle,
  RotateCcw, Loader2, ExternalLink, MapPin, Save, Image,
  FileText, ChevronLeft, ChevronRight, Phone, Mail, Hash, Palette,
  Download, Receipt, Trash2, Send, AlertTriangle,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getOrders, getOrderStats, updateOrderStatus, updateOrderNotes, updateOrderTracking, deleteOrder, getPrivateSales, deletePrivateSale, resendPrivateSaleEmail } from '../services/adminService';
import { useNotifications } from '../contexts/NotificationContext';
import { generateInvoicePDF } from '../utils/generateInvoice';

const ORDER_STATUS = {
  draft:      { fr: 'Brouillon',    en: 'Draft',      es: 'Borrador',     color: 'bg-gray-600/20 text-gray-500', icon: Clock },
  pending:    { fr: 'En attente',    en: 'Pending',    es: 'Pendiente',    color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  paid:       { fr: 'Payé',          en: 'Paid',       es: 'Pagado',       color: 'bg-green-500/20 text-green-400', icon: CreditCard },
  processing: { fr: 'En production', en: 'Processing', es: 'En proceso',   color: 'bg-blue-500/20 text-blue-400', icon: Package },
  shipped:    { fr: 'Expédié',       en: 'Shipped',    es: 'Enviado',      color: 'bg-purple-500/20 text-purple-400', icon: Truck },
  delivered:  { fr: 'Livré',         en: 'Delivered',  es: 'Entregado',    color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  cancelled:  { fr: 'Annulé',        en: 'Cancelled',  es: 'Cancelado',    color: 'bg-red-500/20 text-red-400', icon: XCircle },
  refunded:   { fr: 'Remboursé',     en: 'Refunded',   es: 'Reembolsado',  color: 'bg-gray-500/20 text-gray-400', icon: RotateCcw },
};

const STATUS_FLOW = {
  draft: ['cancelled'],
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'refunded'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

// Montants stockés en cents dans Strapi - afficher en dollars
const dollars = (v) => `${((v || 0) / 100).toFixed(2)}$`;

function AdminOrders() {
  const { tx } = useLang();
  const { markOrdersViewed } = useNotifications();

  // Marquer les nouvelles commandes comme vues au chargement de la page
  useEffect(() => { markOrdersViewed(); }, [markOrdersViewed]);

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 25, total: 0, pageCount: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [editNotes, setEditNotes] = useState({});
  const [savingNotes, setSavingNotes] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [trackingCarrier, setTrackingCarrier] = useState({});
  const [savingTracking, setSavingTracking] = useState(null);
  const [opError, setOpError] = useState('');
  const [privateSales, setPrivateSales] = useState([]);
  const [privateSalesLoading, setPrivateSalesLoading] = useState(false);
  const [privateSaleBusyId, setPrivateSaleBusyId] = useState(null);
  const [privateSaleConfirmDelete, setPrivateSaleConfirmDelete] = useState(null);
  const [privateSaleFeedback, setPrivateSaleFeedback] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: meta.page, pageSize: meta.pageSize };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchDebounce) params.search = searchDebounce;
      const { data } = await getOrders(params);
      setOrders(data.data);
      setMeta(data.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [meta.page, filterStatus, searchDebounce]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Stats
  useEffect(() => {
    getOrderStats().then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  // Ventes privees en attente (prints artistes avec private: true && !paid)
  useEffect(() => {
    setPrivateSalesLoading(true);
    getPrivateSales()
      .then(({ data }) => setPrivateSales(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setPrivateSales([]))
      .finally(() => setPrivateSalesLoading(false));
  }, []);

  // Handlers
  const handleStatusChange = async (documentId, newStatus) => {
    setUpdatingId(documentId);
    try {
      await updateOrderStatus(documentId, newStatus);
      setOrders(prev => prev.map(o =>
        o.documentId === documentId ? { ...o, status: newStatus } : o
      ));
    } catch {
      // silent
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (documentId) => {
    setSavingNotes(documentId);
    try {
      await updateOrderNotes(documentId, editNotes[documentId] || '');
      setOrders(prev => prev.map(o =>
        o.documentId === documentId ? { ...o, notes: editNotes[documentId] || '' } : o
      ));
    } catch {
      setOpError(tx({ fr: 'Erreur sauvegarde notes', en: 'Error saving notes', es: 'Error guardando notas' }));
      setTimeout(() => setOpError(''), 4000);
    } finally {
      setSavingNotes(null);
    }
  };

  const handleSaveTracking = async (documentId) => {
    const tracking = trackingInputs[documentId]?.trim();
    if (!tracking) return;
    setSavingTracking(documentId);
    try {
      const carrier = trackingCarrier[documentId] || 'postes-canada';
      await updateOrderTracking(documentId, tracking, carrier);
      setOrders(prev => prev.map(o =>
        o.documentId === documentId ? { ...o, trackingNumber: tracking, carrier, status: 'shipped' } : o
      ));
    } catch {
      setOpError(tx({ fr: 'Erreur sauvegarde tracking', en: 'Error saving tracking', es: 'Error guardando tracking' }));
      setTimeout(() => setOpError(''), 4000);
    } finally {
      setSavingTracking(null);
    }
  };

  const handleDelete = async (documentId) => {
    setDeletingId(documentId);
    try {
      await deleteOrder(documentId);
      setOrders(prev => prev.filter(o => o.documentId !== documentId));
      setExpandedId(null);
      setConfirmDeleteId(null);
    } catch {
      setOpError(tx({ fr: 'Erreur suppression commande', en: 'Error deleting order', es: 'Error eliminando orden' }));
      setTimeout(() => setOpError(''), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (newPage) => {
    setMeta(prev => ({ ...prev, page: newPage }));
    setExpandedId(null);
  };

  const handleFilterChange = (s) => {
    setFilterStatus(s);
    setMeta(prev => ({ ...prev, page: 1 }));
    setExpandedId(null);
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const order = orders.find(o => o.documentId === id);
      if (order && editNotes[id] === undefined) {
        setEditNotes(prev => ({ ...prev, [id]: order.notes || '' }));
      }
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateShort = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  };

  // Summary cards
  const summaryCards = [
    {
      label: tx({ fr: 'Total commandes', en: 'Total orders', es: 'Total pedidos' }),
      value: stats?.orderStats?.total || meta.total || 0,
      icon: ShoppingBag,
      accent: 'text-accent',
    },
    {
      label: tx({ fr: 'Revenus', en: 'Revenue', es: 'Ingresos' }),
      value: stats ? `${(stats.revenue?.totalDollars || 0).toFixed(0)}$` : '-',
      icon: DollarSign,
      accent: 'text-green-400',
    },
    {
      label: tx({ fr: 'À traiter', en: 'To process', es: 'Por procesar' }),
      value: stats?.orderStats?.byStatus ? (stats.orderStats.byStatus.paid || 0) + (stats.orderStats.byStatus.pending || 0) : 0,
      icon: Clock,
      accent: 'text-yellow-400',
    },
    {
      label: tx({ fr: 'À expédier', en: 'To ship', es: 'Por enviar' }),
      value: stats?.orderStats?.byStatus?.processing || 0,
      icon: Truck,
      accent: 'text-blue-400',
    },
  ];

  const statusKeys = ['all', ...Object.keys(ORDER_STATUS)];

  return (
    <div className="space-y-6">
      {/* Error toast */}
      {opError && (
        <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          {opError}
        </div>
      )}
      {/* Ventes privees en attente (artistes) */}
      {(privateSalesLoading || privateSales.length > 0) && (
        <div className="rounded-xl card-bg shadow-lg shadow-black/20 p-4 md:p-5 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-purple-400" />
            <h3 className="text-sm font-heading font-bold text-heading">
              {tx({ fr: 'Ventes privees en attente', en: 'Pending private sales', es: 'Ventas privadas pendientes' })}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
              {privateSales.length}
            </span>
          </div>
          {privateSaleFeedback && (
            <div className="mb-3 px-3 py-2 rounded-lg text-xs bg-green-500/10 text-green-400">
              {privateSaleFeedback}
            </div>
          )}
          {privateSalesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {privateSales.map((sale) => {
                const key = `${sale.artistSlug}-${sale.id}`;
                const busy = privateSaleBusyId === key;
                const confirmingDelete = privateSaleConfirmDelete === key;
                const priceMissing = typeof sale.price !== 'number';

                const handleResend = async () => {
                  setPrivateSaleBusyId(key);
                  setPrivateSaleFeedback('');
                  try {
                    await resendPrivateSaleEmail(sale.artistSlug, sale.id);
                    setPrivateSaleFeedback(tx({
                      fr: `Courriel renvoye a ${sale.clientEmail}`,
                      en: `Email resent to ${sale.clientEmail}`,
                      es: `Correo reenviado a ${sale.clientEmail}`,
                    }));
                    setTimeout(() => setPrivateSaleFeedback(''), 5000);
                  } catch (err) {
                    setOpError(tx({
                      fr: 'Erreur lors du renvoi du courriel',
                      en: 'Error resending email',
                      es: 'Error al reenviar el correo',
                    }));
                    setTimeout(() => setOpError(''), 4000);
                  } finally {
                    setPrivateSaleBusyId(null);
                  }
                };

                const handleDelete = async () => {
                  setPrivateSaleBusyId(key);
                  try {
                    await deletePrivateSale(sale.artistSlug, sale.id);
                    setPrivateSales(prev => prev.filter(s => !(s.artistSlug === sale.artistSlug && s.id === sale.id)));
                    setPrivateSaleConfirmDelete(null);
                  } catch (err) {
                    setOpError(tx({
                      fr: 'Erreur lors de la suppression',
                      en: 'Error deleting',
                      es: 'Error al eliminar',
                    }));
                    setTimeout(() => setOpError(''), 4000);
                  } finally {
                    setPrivateSaleBusyId(null);
                  }
                };

                return (
                  <div
                    key={key}
                    className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-lg bg-glass hover:bg-glass/80 transition-colors"
                  >
                    {sale.image ? (
                      <img src={sale.image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Palette size={18} className="text-purple-400/60" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold text-heading truncate">{sale.artistName}</span>
                        {sale.title && <span className="text-xs text-grey-muted truncate">· {sale.title}</span>}
                        {sale.unique && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                            {tx({ fr: 'Piece unique', en: 'Unique piece', es: 'Pieza unica' })}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                        <span className="text-xs text-grey-muted flex items-center gap-1">
                          <Mail size={11} /> {sale.clientEmail || tx({ fr: 'Pas de courriel', en: 'No email', es: 'Sin correo' })}
                        </span>
                        {sale.fixedFormat && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 uppercase font-semibold tracking-wider">
                            {sale.fixedFormat}
                          </span>
                        )}
                        {sale.fixedTier && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 uppercase font-semibold tracking-wider">
                            {sale.fixedTier}
                          </span>
                        )}
                        {priceMissing ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 flex items-center gap-1 font-semibold">
                            <AlertTriangle size={10} />
                            {tx({ fr: 'Prix non defini', en: 'No price set', es: 'Sin precio' })}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-heading">{sale.price}$</span>
                        )}
                        {sale.createdAt && (
                          <span className="text-xs text-grey-muted">
                            {formatDateShort(sale.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 w-full md:w-auto justify-end">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 mr-1">
                        <Clock size={10} />
                        {tx({ fr: 'Attente paiement', en: 'Awaiting payment', es: 'Esperando pago' })}
                      </span>
                      {sale.clientLink && (
                        <a
                          href={sale.clientLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                          title={tx({ fr: 'Vue client (meme lien que le courriel)', en: 'Client view', es: 'Vista cliente' })}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button
                        onClick={handleResend}
                        disabled={busy || !sale.clientEmail}
                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-40"
                        title={tx({ fr: 'Renvoyer le courriel au client', en: 'Resend email to client', es: 'Reenviar correo al cliente' })}
                      >
                        {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      </button>
                      {confirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleDelete}
                            disabled={busy}
                            className="px-2 py-1 rounded-lg bg-red-500/30 text-red-400 text-[10px] font-semibold hover:bg-red-500/40 transition-colors disabled:opacity-40"
                          >
                            {busy ? <Loader2 size={11} className="animate-spin" /> : tx({ fr: 'Confirmer', en: 'Confirm', es: 'Confirmar' })}
                          </button>
                          <button
                            onClick={() => setPrivateSaleConfirmDelete(null)}
                            className="px-2 py-1 rounded-lg bg-glass text-grey-muted text-[10px] hover:text-heading transition-colors"
                          >
                            {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPrivateSaleConfirmDelete(key)}
                          disabled={busy}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-40"
                          title={tx({ fr: 'Supprimer la demande', en: 'Delete request', es: 'Eliminar solicitud' })}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-grey-muted mt-3">
            {tx({
              fr: 'Quand le client paye, la vente apparaitra dans la liste des commandes ci-dessous. Clique sur l\'icone avion pour renvoyer le courriel, sur la poubelle pour annuler la demande.',
              en: 'When the client pays, the sale will appear in the orders list below. Click the plane icon to resend the email, the trash to cancel the request.',
              es: 'Cuando el cliente pague, la venta aparecera en la lista de pedidos abajo. Click en el avion para reenviar correo, papelera para cancelar.',
            })}
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-3 md:p-4 card-bg shadow-lg shadow-black/20"
            >
              <div className="flex items-center gap-1.5 mb-1 md:mb-2">
                <Icon size={14} className={card.accent} />
                <span className="text-grey-muted text-[10px] md:text-xs">{card.label}</span>
              </div>
              <span className="text-xl md:text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setMeta(prev => ({ ...prev, page: 1 })); }}
            placeholder={tx({ fr: 'Rechercher par nom, email...', en: 'Search by name, email...', es: 'Buscar por nombre, email...' })}
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {statusKeys.map((s) => {
            const isActive = filterStatus === s;
            const label = s === 'all'
              ? tx({ fr: 'Tout', en: 'All', es: 'Todo' })
              : tx({ fr: ORDER_STATUS[s].fr, en: ORDER_STATUS[s].en, es: ORDER_STATUS[s].es });
            return (
              <button
                key={s}
                onClick={() => handleFilterChange(s)}
                className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-semibold transition-all ${
                  isActive ? 'text-accent' : 'text-grey-muted hover:text-accent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-grey-muted">
          {tx({ fr: 'Aucune commande trouvée', en: 'No orders found', es: 'No se encontraron pedidos' })}
        </div>
      ) : (
        <div className="rounded-xl card-bg shadow-lg shadow-black/20 overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1fr_100px_80px_120px_120px_40px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider shadow-[0_1px_0_rgba(255,255,255,0.04)]">
            <span>{tx({ fr: 'Client', en: 'Client', es: 'Cliente' })}</span>
            <span>Date</span>
            <span>{tx({ fr: 'Articles', en: 'Items', es: 'Articulos' })}</span>
            <span>Total</span>
            <span>Status</span>
            <span></span>
          </div>

          {/* Rows */}
          <AnimatePresence>
            {orders.map((order) => {
              const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
              const StIcon = st.icon;
              const isExpanded = expandedId === order.documentId;
              const items = Array.isArray(order.items) ? order.items : [];
              const nextStatuses = STATUS_FLOW[order.status] || [];
              const artistItems = items.filter(i => (i.productId || '').startsWith('artist-print-'));
              const artistNames = [...new Set(artistItems.map(i => (i.productName || '').split(' - ')[0]).filter(Boolean))];

              return (
                <motion.div
                  key={order.documentId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className=""
                >
                  {/* Row - Compact mobile, full desktop */}
                  <div
                    onClick={() => toggleExpand(order.documentId)}
                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                  >
                    {/* Desktop row */}
                    <div className="hidden md:grid grid-cols-[1fr_100px_80px_120px_120px_40px] gap-3 px-4 py-3 items-center">
                      <div className="min-w-0">
                        <p className="text-sm text-heading font-semibold truncate">{order.customerName}</p>
                        <p className="text-xs text-grey-muted truncate">{order.customerEmail}</p>
                      </div>
                      <span className="text-xs text-grey-muted">{formatDateShort(order.createdAt)}</span>
                      <span className="text-sm text-heading">{items.length} {items.length > 1 ? 'items' : 'item'}</span>
                      <span className="text-lg text-heading font-bold">{dollars(order.total)}</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                          <StIcon size={12} />
                          {tx({ fr: st.fr, en: st.en, es: st.es })}
                        </span>
                        {artistNames.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-400">
                            <Palette size={10} />
                            {artistNames.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="text-grey-muted justify-self-end">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>

                    {/* Mobile row - compact */}
                    <div className="md:hidden px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-heading font-semibold truncate flex-1">{order.customerName}</p>
                        <span className="text-base text-heading font-bold flex-shrink-0">{dollars(order.total)}</span>
                        <span className="text-grey-muted flex-shrink-0">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-grey-muted">{formatDateShort(order.createdAt)}</span>
                        <span className="text-[11px] text-grey-muted">{items.length} item{items.length > 1 ? 's' : ''}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${st.color}`}>
                          <StIcon size={10} />
                          {tx({ fr: st.fr, en: st.en, es: st.es })}
                        </span>
                        {artistNames.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-400">
                            <Palette size={9} />
                            {artistNames[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-5 pt-1 space-y-5 shadow-[0_-1px_0_rgba(255,255,255,0.04)] bg-glass/50">

                          {/* Infos client + reference */}
                          <div className="flex flex-wrap gap-4 items-start">
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider">{tx({ fr: 'Client', en: 'Client', es: 'Cliente' })}</h4>
                              <p className="text-sm text-heading font-medium">{order.customerName}</p>
                              <p className="text-xs text-grey-muted flex items-center gap-1.5"><Mail size={11} /> {order.customerEmail}</p>
                              {order.customerPhone && (
                                <p className="text-xs text-grey-muted flex items-center gap-1.5"><Phone size={11} /> {order.customerPhone}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider">{tx({ fr: 'Référence', en: 'Reference', es: 'Referencia' })}</h4>
                              <p className="text-xs text-grey-muted flex items-center gap-1.5 font-mono">
                                <Hash size={11} />
                                {order.stripePaymentIntentId || '-'}
                              </p>
                              <p className="text-xs text-grey-muted">{formatDate(order.createdAt)}</p>
                            </div>

                            {/* Boutons facture / recu */}
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider">Documents</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); generateInvoicePDF(order, 'invoice'); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                                >
                                  <Download size={12} />
                                  {tx({ fr: 'Facture', en: 'Invoice', es: 'Factura' })}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); generateInvoicePDF(order, 'receipt'); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                >
                                  <Receipt size={12} />
                                  {tx({ fr: 'Reçu', en: 'Receipt', es: 'Recibo' })}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Status actions */}
                          {nextStatuses.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-grey-muted mr-1">
                                {tx({ fr: 'Changer le status:', en: 'Change status:', es: 'Cambiar estado:' })}
                              </span>
                              {nextStatuses.map((ns) => {
                                const nst = ORDER_STATUS[ns];
                                const NsIcon = nst.icon;
                                return (
                                  <button
                                    key={ns}
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(order.documentId, ns); }}
                                    disabled={updatingId === order.documentId}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${nst.color} hover:scale-105 disabled:opacity-50`}
                                  >
                                    {updatingId === order.documentId ? <Loader2 size={12} className="animate-spin" /> : <NsIcon size={12} />}
                                    {tx({ fr: nst.fr, en: nst.en, es: nst.es })}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Items - avec images bien visibles */}
                          <div>
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3">
                              {tx({ fr: 'Articles commandés', en: 'Ordered items', es: 'Articulos pedidos' })} ({items.length})
                            </h4>
                            <div className="space-y-3">
                              {items.map((item, idx) => {
                                const files = Array.isArray(item.uploadedFiles) ? item.uploadedFiles : [];
                                return (
                                  <div key={idx} className="rounded-lg bg-glass p-4">
                                    <div className="flex items-start gap-4">
                                      {/* Image produit - plus grande */}
                                      {item.image && (
                                        <img src={item.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                          <div>
                                            <p className="text-base font-semibold text-heading">{item.productName || tx({ fr: 'Produit', en: 'Product', es: 'Producto' })}</p>
                                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                              {item.size && <span className="text-xs text-grey-muted bg-glass px-2 py-0.5 rounded">{item.size}</span>}
                                              {item.finish && <span className="text-xs text-grey-muted bg-glass px-2 py-0.5 rounded">{item.finish}</span>}
                                              {item.shape && <span className="text-xs text-grey-muted bg-glass px-2 py-0.5 rounded">{item.shape}</span>}
                                              {item.quantity && <span className="text-xs text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded">x{item.quantity}</span>}
                                            </div>
                                          </div>
                                          <span className="text-lg font-bold text-heading flex-shrink-0">{item.totalPrice ? `${item.totalPrice}$` : ''}</span>
                                        </div>
                                        {item.notes && (
                                          <p className="text-sm text-grey-muted mt-2 italic bg-glass rounded px-2 py-1">"{item.notes}"</p>
                                        )}

                                        {/* Pack details (artist sticker packs) - A IMPRIMER */}
                                        {Array.isArray(item.packDetails) && item.packDetails.length > 0 && (
                                          <div className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-xs text-accent font-semibold uppercase tracking-wide">
                                                {tx({ fr: 'Stickers a imprimer', en: 'Stickers to print', es: 'Stickers a imprimir' })}
                                              </span>
                                              <span className="text-xs text-grey-muted">
                                                {item.packDetails.reduce((acc, d) => acc + (Number(d.qty) || 0), 0)} {tx({ fr: 'par pack', en: 'per pack', es: 'por pack' })} x {item.quantity || 1} = <strong className="text-accent">{item.packDetails.reduce((acc, d) => acc + (Number(d.qty) || 0), 0) * (item.quantity || 1)} {tx({ fr: 'stickers total', en: 'stickers total', es: 'stickers total' })}</strong>
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {item.packDetails.map((detail, di) => {
                                                const perPack = Number(detail.qty) || Number(detail.qtyPerPack) || 1;
                                                const totalToPrint = perPack * (item.quantity || 1);
                                                return (
                                                  <a
                                                    key={di}
                                                    href={detail.image}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-2 p-2 rounded bg-glass hover:bg-accent/10 transition-colors group"
                                                    title={tx({ fr: 'Ouvrir l\'image', en: 'Open image', es: 'Abrir imagen' })}
                                                  >
                                                    {detail.image && (
                                                      <img
                                                        src={detail.image}
                                                        alt=""
                                                        className="w-12 h-12 rounded object-cover flex-shrink-0 border border-accent/20"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                      />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-xs font-semibold text-heading truncate">{detail.title || detail.id}</p>
                                                      <p className="text-[11px] text-grey-muted">
                                                        {perPack}/pack × {item.quantity || 1} = <strong className="text-accent">{totalToPrint}</strong>
                                                      </p>
                                                    </div>
                                                    <ExternalLink size={12} className="text-grey-muted group-hover:text-accent flex-shrink-0" />
                                                  </a>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Fichiers uploades - images grandes et claires */}
                                    {files.length > 0 && (
                                      <div className="mt-4">
                                        <div className="flex items-center gap-1.5 mb-2">
                                          <Image size={14} className="text-accent" />
                                          <span className="text-xs text-accent font-semibold">
                                            {tx({ fr: 'Fichiers du client', en: 'Client files', es: 'Archivos del cliente' })} ({files.length})
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                          {files.map((file, fi) => {
                                            const isImg = file.mime && file.mime.startsWith('image/');
                                            return (
                                              <a
                                                key={fi}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="block group relative"
                                                title={file.name}
                                              >
                                                {isImg ? (
                                                  <img
                                                    src={file.url}
                                                    alt={file.name}
                                                    className="w-28 h-28 rounded-lg object-cover border-2 border-transparent group-hover:border-accent transition-colors"
                                                  />
                                                ) : (
                                                  <div className="w-28 h-28 rounded-lg bg-glass flex flex-col items-center justify-center gap-1 border-2 border-transparent group-hover:border-accent transition-colors">
                                                    <FileText size={24} className="text-accent" />
                                                    <span className="text-[10px] text-grey-muted truncate max-w-[100px] px-1">{file.name}</span>
                                                  </div>
                                                )}
                                                <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                  <ExternalLink size={16} className="text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                                                </div>
                                              </a>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Financial + Shipping grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Financial - clair et lisible */}
                            <div className="rounded-lg bg-glass p-4">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3">
                                {tx({ fr: 'Détail financier', en: 'Financial detail', es: 'Detalle financiero' })}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-grey-muted">{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</span>
                                  <span className="text-heading">{dollars(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-grey-muted">{tx({ fr: 'Frais de livraison', en: 'Shipping', es: 'Envio' })}</span>
                                  <span className="text-heading">{order.shipping === 0 ? tx({ fr: 'Gratuit', en: 'Free', es: 'Gratis' }) : dollars(order.shipping)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-grey-muted">TPS (5%)</span>
                                  <span className="text-heading">{dollars(order.tps)}</span>
                                </div>
                                {order.tvq > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-grey-muted">TVQ (9.975%)</span>
                                    <span className="text-heading">{dollars(order.tvq)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between shadow-[0_-1px_0_rgba(255,255,255,0.04)] pt-2 mt-2">
                                  <span className="text-heading font-bold text-base">Total</span>
                                  <span className="text-heading font-bold text-lg">{dollars(order.total)}</span>
                                </div>
                              </div>
                              {order.totalWeight > 0 && (
                                <p className="text-xs text-grey-muted mt-3">{tx({ fr: 'Poids total', en: 'Total weight', es: 'Peso total' })}: {order.totalWeight}g</p>
                              )}
                            </div>

                            {/* Shipping address */}
                            <div className="rounded-lg bg-glass p-4">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <MapPin size={12} />
                                {tx({ fr: 'Adresse de livraison', en: 'Shipping address', es: 'Direccion de envio' })}
                              </h4>
                              {order.shippingAddress ? (
                                <div className="text-sm text-heading space-y-1">
                                  <p className="font-medium">{order.customerName}</p>
                                  <p>{order.shippingAddress.address}</p>
                                  <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}</p>
                                  {order.customerPhone && (
                                    <p className="text-grey-muted text-xs mt-2 flex items-center gap-1.5">
                                      <Phone size={11} /> {order.customerPhone}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-grey-muted">{tx({ fr: 'Aucune adresse', en: 'No address', es: 'Sin direccion' })}</p>
                              )}
                              <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs text-grey-muted">{tx({ fr: 'Design prêt', en: 'Design ready', es: 'Diseno listo' })}:</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${order.designReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                  {order.designReady ? tx({ fr: 'Oui', en: 'Yes', es: 'Si' }) : tx({ fr: 'Non', en: 'No', es: 'No' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Suivi de colis */}
                          <div className="rounded-lg bg-glass p-4">
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Truck size={12} />
                              {tx({ fr: 'Suivi de colis', en: 'Package tracking', es: 'Seguimiento de paquete' })}
                            </h4>
                            {order.trackingNumber ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-heading font-mono font-bold">{order.trackingNumber}</span>
                                  <span className="text-xs text-grey-muted">
                                    {order.carrier === 'purolator' ? 'Purolator' : order.carrier === 'ups' ? 'UPS' : 'Postes Canada'}
                                  </span>
                                </div>
                                <a
                                  href={order.carrier === 'purolator'
                                    ? `https://www.purolator.com/en/shipping/tracker?pin=${order.trackingNumber}`
                                    : order.carrier === 'ups'
                                    ? `https://www.ups.com/track?tracknum=${order.trackingNumber}`
                                    : `https://www.canadapost-postescanada.ca/track-reperage/fr#/search?searchFor=${order.trackingNumber}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                                >
                                  <ExternalLink size={12} />
                                  {tx({ fr: 'Suivre le colis', en: 'Track package', es: 'Rastrear paquete' })}
                                </a>
                              </div>
                            ) : (
                              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2">
                                  <select
                                    value={trackingCarrier[order.documentId] || 'postes-canada'}
                                    onChange={(e) => setTrackingCarrier(prev => ({ ...prev, [order.documentId]: e.target.value }))}
                                    className="input-field text-sm py-2 w-auto"
                                  >
                                    <option value="postes-canada">Postes Canada</option>
                                    <option value="purolator">Purolator</option>
                                    <option value="ups">UPS</option>
                                    <option value="autre">{tx({ fr: 'Autre', en: 'Other', es: 'Otro' })}</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={trackingInputs[order.documentId] || ''}
                                    onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.documentId]: e.target.value }))}
                                    placeholder={tx({ fr: 'Numéro de suivi...', en: 'Tracking number...', es: 'Numero de seguimiento...' })}
                                    className="input-field text-sm py-2 flex-1 font-mono"
                                  />
                                  <button
                                    onClick={() => handleSaveTracking(order.documentId)}
                                    disabled={savingTracking === order.documentId || !trackingInputs[order.documentId]?.trim()}
                                    className="px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                                  >
                                    {savingTracking === order.documentId ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
                                    {tx({ fr: 'Envoyer', en: 'Send', es: 'Enviar' })}
                                  </button>
                                </div>
                                <p className="text-[10px] text-grey-muted">
                                  {tx({
                                    fr: 'Le client recevra un email automatique avec le lien de suivi.',
                                    en: 'The customer will receive an automatic email with the tracking link.',
                                    es: 'El cliente recibira un email automatico con el enlace de seguimiento.',
                                  })}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Admin notes + delete */}
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">
                                {tx({ fr: 'Notes internes', en: 'Internal notes', es: 'Notas internas' })}
                              </h4>
                              <div className="flex gap-2">
                                <textarea
                                  value={editNotes[order.documentId] ?? order.notes ?? ''}
                                  onChange={(e) => setEditNotes(prev => ({ ...prev, [order.documentId]: e.target.value }))}
                                  onClick={(e) => e.stopPropagation()}
                                  rows={2}
                                  placeholder={tx({ fr: 'Ajouter une note...', en: 'Add a note...', es: 'Agregar una nota...' })}
                                  className="input-field text-sm flex-1 resize-none"
                                />
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSaveNotes(order.documentId); }}
                                  disabled={savingNotes === order.documentId}
                                  className="self-end px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {savingNotes === order.documentId ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                  {tx({ fr: 'Sauver', en: 'Save', es: 'Guardar' })}
                                </button>
                              </div>
                            </div>

                            {/* Delete button */}
                            <div className="flex-shrink-0 self-end">
                              {confirmDeleteId === order.documentId ? (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-xs text-red-400">{tx({ fr: 'Confirmer?', en: 'Confirm?', es: 'Confirmar?' })}</span>
                                  <button
                                    onClick={() => handleDelete(order.documentId)}
                                    disabled={deletingId === order.documentId}
                                    className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {deletingId === order.documentId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    {tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-3 py-2 rounded-lg bg-glass text-grey-muted text-xs font-semibold hover:text-heading transition-colors"
                                  >
                                    {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(order.documentId); }}
                                  className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400/60 text-xs font-semibold hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                  <Trash2 size={12} />
                                  {tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {meta.pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page <= 1}
            className="p-2 rounded-lg bg-glass text-grey-muted hover:text-heading disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-grey-muted">
            {meta.page} / {meta.pageCount}
          </span>
          <button
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={meta.page >= meta.pageCount}
            className="p-2 rounded-lg bg-glass text-grey-muted hover:text-heading disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
