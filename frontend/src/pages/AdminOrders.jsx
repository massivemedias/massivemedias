import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, ChevronUp, ShoppingBag, DollarSign,
  Clock, Truck, Package, CreditCard, CheckCircle, XCircle,
  RotateCcw, Loader2, ExternalLink, MapPin, Save, Image,
  FileText, ChevronLeft, ChevronRight, Phone, Mail, Hash, Palette,
  Download, Receipt,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getOrders, getOrderStats, updateOrderStatus, updateOrderNotes } from '../services/adminService';
import { generateInvoicePDF } from '../utils/generateInvoice';

const ORDER_STATUS = {
  pending:    { fr: 'En attente',    en: 'Pending',    es: 'Pendiente',    color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  paid:       { fr: 'Paye',          en: 'Paid',       es: 'Pagado',       color: 'bg-green-500/20 text-green-400', icon: CreditCard },
  processing: { fr: 'En production', en: 'Processing', es: 'En proceso',   color: 'bg-blue-500/20 text-blue-400', icon: Package },
  shipped:    { fr: 'Expedie',       en: 'Shipped',    es: 'Enviado',      color: 'bg-purple-500/20 text-purple-400', icon: Truck },
  delivered:  { fr: 'Livre',         en: 'Delivered',  es: 'Entregado',    color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  cancelled:  { fr: 'Annule',        en: 'Cancelled',  es: 'Cancelado',    color: 'bg-red-500/20 text-red-400', icon: XCircle },
  refunded:   { fr: 'Rembourse',     en: 'Refunded',   es: 'Reembolsado',  color: 'bg-gray-500/20 text-gray-400', icon: RotateCcw },
};

const STATUS_FLOW = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'refunded'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

// Montants stockes en cents dans Strapi - afficher en dollars
const dollars = (v) => `${((v || 0) / 100).toFixed(2)}$`;

function AdminOrders() {
  const { tx } = useLang();

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
      // silent
    } finally {
      setSavingNotes(null);
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
      label: tx({ fr: 'A traiter', en: 'To process', es: 'Por procesar' }),
      value: stats?.orderStats?.byStatus ? (stats.orderStats.byStatus.paid || 0) + (stats.orderStats.byStatus.pending || 0) : 0,
      icon: Clock,
      accent: 'text-yellow-400',
    },
    {
      label: tx({ fr: 'A expedier', en: 'To ship', es: 'Por enviar' }),
      value: stats?.orderStats?.byStatus?.processing || 0,
      icon: Truck,
      accent: 'text-blue-400',
    },
  ];

  const statusKeys = ['all', ...Object.keys(ORDER_STATUS)];

  return (
    <div className="space-y-6">
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
              className="rounded-xl p-4 bg-glass card-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={card.accent} />
                <span className="text-grey-muted text-xs">{card.label}</span>
              </div>
              <span className="text-2xl font-heading font-bold text-heading">{card.value}</span>
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
        <div className="flex flex-wrap gap-1.5">
          {statusKeys.map((s) => {
            const isActive = filterStatus === s;
            const label = s === 'all'
              ? tx({ fr: 'Tout', en: 'All', es: 'Todo' })
              : tx({ fr: ORDER_STATUS[s].fr, en: ORDER_STATUS[s].en, es: ORDER_STATUS[s].es });
            return (
              <button
                key={s}
                onClick={() => handleFilterChange(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
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
          {tx({ fr: 'Aucune commande trouvee', en: 'No orders found', es: 'No se encontraron pedidos' })}
        </div>
      ) : (
        <div className="rounded-xl bg-glass overflow-hidden card-border">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1fr_100px_80px_120px_120px_40px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b card-border">
            <span>Client</span>
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
                  className="border-b last:border-b-0 card-border"
                >
                  {/* Row - Client en premier, prix clair */}
                  <div
                    onClick={() => toggleExpand(order.documentId)}
                    className="grid grid-cols-1 md:grid-cols-[1fr_100px_80px_120px_120px_40px] gap-2 md:gap-3 px-4 py-3 items-center cursor-pointer hover:bg-accent/5 transition-colors"
                  >
                    {/* Client - nom + email */}
                    <div className="min-w-0">
                      <p className="text-sm text-heading font-semibold truncate">{order.customerName}</p>
                      <p className="text-xs text-grey-muted truncate">{order.customerEmail}</p>
                    </div>

                    {/* Date courte */}
                    <span className="text-xs text-grey-muted">{formatDateShort(order.createdAt)}</span>

                    {/* Nb articles */}
                    <span className="text-sm text-heading">{items.length} {items.length > 1 ? 'items' : 'item'}</span>

                    {/* Total - gros et clair */}
                    <span className="text-lg text-heading font-bold">{dollars(order.total)}</span>

                    {/* Status badge + artist badge */}
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

                    {/* Expand */}
                    <span className="text-grey-muted justify-self-end">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
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
                        <div className="px-4 pb-5 pt-1 space-y-5 border-t card-border bg-glass/50">

                          {/* Infos client + reference */}
                          <div className="flex flex-wrap gap-4 items-start">
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider">Client</h4>
                              <p className="text-sm text-heading font-medium">{order.customerName}</p>
                              <p className="text-xs text-grey-muted flex items-center gap-1.5"><Mail size={11} /> {order.customerEmail}</p>
                              {order.customerPhone && (
                                <p className="text-xs text-grey-muted flex items-center gap-1.5"><Phone size={11} /> {order.customerPhone}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider">{tx({ fr: 'Reference', en: 'Reference', es: 'Referencia' })}</h4>
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
                                  {tx({ fr: 'Recu', en: 'Receipt', es: 'Recibo' })}
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
                              {tx({ fr: 'Articles commandes', en: 'Ordered items', es: 'Articulos pedidos' })} ({items.length})
                            </h4>
                            <div className="space-y-3">
                              {items.map((item, idx) => {
                                const files = Array.isArray(item.uploadedFiles) ? item.uploadedFiles : [];
                                return (
                                  <div key={idx} className="rounded-lg bg-glass p-4">
                                    <div className="flex items-start gap-4">
                                      {/* Image produit - plus grande */}
                                      {item.image && (
                                        <img src={item.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border card-border" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                          <div>
                                            <p className="text-base font-semibold text-heading">{item.productName || 'Produit'}</p>
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
                                                  <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
                                {tx({ fr: 'Detail financier', en: 'Financial detail', es: 'Detalle financiero' })}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-grey-muted">Sous-total</span>
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
                                <div className="flex justify-between border-t pt-2 mt-2 card-border">
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
                                <span className="text-xs text-grey-muted">{tx({ fr: 'Design pret', en: 'Design ready', es: 'Diseno listo' })}:</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${order.designReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                  {order.designReady ? tx({ fr: 'Oui', en: 'Yes', es: 'Si' }) : tx({ fr: 'Non', en: 'No', es: 'No' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Admin notes */}
                          <div>
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
