import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, ChevronUp, ShoppingBag, DollarSign, Settings, Briefcase, Layers,
  Clock, Truck, Package, CreditCard, CheckCircle, XCircle,
  RotateCcw, Loader2, ExternalLink, MapPin, Save, Image,
  FileText, ChevronLeft, ChevronRight, Phone, Mail, Hash, Palette,
  Download, Receipt, Trash2, Send, AlertTriangle, Pencil, Plus,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getOrders, getOrderStats, updateOrderStatus, updateOrderNotes, updateOrderTracking, deleteOrder, getPrivateSales, deletePrivateSale, resendPrivateSaleEmail, sendOrderInvoice, getOrderTracking, getBillingSettings, seedLegacyInvoicesApril2026 } from '../services/adminService';
import { useNotifications } from '../contexts/NotificationContext';
import { generateInvoicePDF } from '../utils/generateInvoice';
import EditOrderTotalModal from '../components/EditOrderTotalModal';
import CreateManualOrderModal from '../components/CreateManualOrderModal';
import AdminReglagesFacturation from './AdminReglagesFacturation';

const ORDER_STATUS = {
  draft:      { fr: 'Brouillon',    en: 'Draft',      es: 'Borrador',     color: 'bg-gray-600/20 text-gray-500', icon: Clock },
  pending:    { fr: 'En attente',    en: 'Pending',    es: 'Pendiente',    color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  paid:       { fr: 'Payé',          en: 'Paid',       es: 'Pagado',       color: 'bg-green-500/20 text-green-400', icon: CreditCard },
  processing: { fr: 'En production', en: 'Processing', es: 'En proceso',   color: 'bg-blue-500/20 text-blue-400', icon: Package },
  ready:      { fr: 'Prêt',           en: 'Ready',      es: 'Listo',        color: 'bg-orange-500/20 text-orange-400', icon: MapPin },
  shipped:    { fr: 'Expédié',       en: 'Shipped',    es: 'Enviado',      color: 'bg-purple-500/20 text-purple-400', icon: Truck },
  delivered:  { fr: 'Livré',         en: 'Delivered',  es: 'Entregado',    color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  cancelled:  { fr: 'Annulé',        en: 'Cancelled',  es: 'Cancelado',    color: 'bg-red-500/20 text-red-400', icon: XCircle },
  refunded:   { fr: 'Remboursé',     en: 'Refunded',   es: 'Reembolsado',  color: 'bg-gray-500/20 text-gray-400', icon: RotateCcw },
};

const STATUS_FLOW = {
  draft: ['cancelled'],
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'refunded'],
  processing: ['ready', 'shipped', 'cancelled'],
  ready: ['delivered', 'shipped'],
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
  // FIX-ADMIN (avril 2026) : pageSize BUMPE de 25 a 500 pour que tout
  // l'historique tienne en une seule page. La limite default Strapi/controller
  // etait silencieusement a 25 -> les commandes legacy (les plus anciennes
  // apres sort createdAt:desc) tombaient en page 2+ et semblaient disparues.
  // 500 couvre largement l'historique Massive Medias sans overkill.
  const [meta, setMeta] = useState({ page: 1, pageSize: 500, total: 0, pageCount: 0 });
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

  // Modal creation commande manuelle + facture + lien Stripe
  const [showManualModal, setShowManualModal] = useState(false);

  // One-shot : reinjection 3 factures B2B perdues (avril 2026)
  const [seedingLegacy, setSeedingLegacy] = useState(false);
  const [seedReport, setSeedReport] = useState(null);

  // Tracking live : etat par commande - { [documentId]: { loading, data, error } }
  const [trackingState, setTrackingState] = useState({});

  const refreshTracking = async (order) => {
    const documentId = order?.documentId;
    if (!documentId) return;
    setTrackingState(prev => ({ ...prev, [documentId]: { ...prev[documentId], loading: true, error: null } }));
    try {
      const { data } = await getOrderTracking(documentId);
      const payload = data?.data || null;
      setTrackingState(prev => ({ ...prev, [documentId]: { loading: false, data: payload, error: null } }));

      // Si le provider suggere "delivered" et la commande n'est pas livree, demander confirmation
      if (payload?.suggestStatusChange === 'delivered' && order.status !== 'delivered') {
        const msg = tx({
          fr: `Le transporteur confirme que le colis a ete livre.\nMarquer la commande #${(order.orderRef || order.documentId.slice(0, 8))} comme "Livree" ?`,
          en: `The carrier confirms the package has been delivered.\nMark order #${(order.orderRef || order.documentId.slice(0, 8))} as "Delivered"?`,
          es: `El transportista confirma la entrega.\nMarcar pedido #${(order.orderRef || order.documentId.slice(0, 8))} como "Entregado"?`,
        });
        if (window.confirm(msg)) {
          try {
            await updateOrderStatus(documentId, 'delivered');
            setOrders(prev => prev.map(o => o.documentId === documentId ? { ...o, status: 'delivered' } : o));
            setActionToast({
              type: 'success',
              message: tx({
                fr: 'Commande marquee comme livree.',
                en: 'Order marked as delivered.',
                es: 'Pedido marcado como entregado.',
              }),
            });
          } catch (err) {
            setActionToast({
              type: 'error',
              message: (err?.response?.data?.error?.message || err?.message || 'Erreur changement statut'),
            });
          }
        }
      }
    } catch (err) {
      const backendMsg = err?.response?.data?.error?.message || err?.message || 'Erreur tracking';
      setTrackingState(prev => ({ ...prev, [documentId]: { loading: false, data: null, error: backendMsg } }));
    }
  };

  // Envoi facture par courriel - etat par commande + toast global
  const [sendingInvoiceId, setSendingInvoiceId] = useState(null);
  // Modal de previsualisation avant envoi facture (controle admin)
  const [previewInvoiceOrder, setPreviewInvoiceOrder] = useState(null);

  // FIX-ADMIN (avril 2026) : interface minimaliste a 2 onglets seulement.
  // - 'all'      : tableau complet sans aucun filtre (recupere tout l'historique)
  // - 'settings' : affiche AdminReglagesFacturation inline
  // Les anciens onglets Boutique/B2B ont ete supprimes : l'admin peut toujours
  // distinguer manuel vs e-commerce via la colonne / badge dans le tableau.
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'settings'

  // Billing settings (TPS/TVQ/bancaire/Interac) charges une fois au mount
  // et passes en options au generateInvoicePDF pour que toutes les factures
  // incluent les modalites de paiement et les bons numeros de taxes.
  const [billingSettings, setBillingSettings] = useState(null);
  useEffect(() => {
    getBillingSettings()
      .then(({ data }) => setBillingSettings(data?.data || {}))
      .catch(() => setBillingSettings({})); // fallback silencieux -> PDF utilise defaults
  }, []);
  const [actionToast, setInvoiceToast] = useState(null); // { type: 'success'|'error', message: '...' }
  useEffect(() => {
    if (!actionToast) return;
    const t = setTimeout(() => setInvoiceToast(null), actionToast.type === 'error' ? 7000 : 4500);
    return () => clearTimeout(t);
  }, [actionToast]);

  // One-shot : reinjecter les 3 factures B2B perdues (avril 2026).
  // Idempotent : backend skip si deja presentes. Affiche le rapport et refresh la liste.
  const handleSeedLegacy = async () => {
    if (seedingLegacy) return;
    const confirmed = window.confirm(tx({
      fr: 'Reinjecter les 3 factures B2B historiques (La Presse 770$, Andrew Higgs 400$, Jerome Prunier 1500$) ? Idempotent : skip si deja presentes.',
      en: 'Reinject the 3 historical B2B invoices (La Presse 770$, Andrew Higgs 400$, Jerome Prunier 1500$)? Idempotent: skips if already present.',
      es: 'Reinjectar las 3 facturas B2B historicas? Idempotente: omite si ya estan presentes.',
    }));
    if (!confirmed) return;

    setSeedingLegacy(true);
    setSeedReport(null);
    try {
      const { data } = await seedLegacyInvoicesApril2026();
      setSeedReport(data || { success: false, summary: null, report: [] });
      // Refresh la liste pour que les 3 factures apparaissent immediatement
      await fetchOrders();
      getOrderStats().then(({ data }) => setStats(data)).catch(() => {});
      const summary = data?.summary || {};
      setInvoiceToast({
        type: summary.failed === 0 ? 'success' : 'error',
        message: tx({
          fr: `Reinjection: ${summary.created || 0} crees, ${summary.skipped || 0} skip, ${summary.failed || 0} echec(s).`,
          en: `Reinjected: ${summary.created || 0} created, ${summary.skipped || 0} skipped, ${summary.failed || 0} failed.`,
          es: `Reinjectado: ${summary.created || 0} creadas, ${summary.skipped || 0} omitidas, ${summary.failed || 0} fallos.`,
        }),
      });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Erreur';
      setInvoiceToast({ type: 'error', message: `Reinjection: ${msg}` });
    } finally {
      setSeedingLegacy(false);
    }
  };

  const handleSendInvoice = async (order) => {
    if (!order?.documentId) return;

    // Validation pre-envoi cote UI pour UX claire (en plus du blindage backend)
    if (!order.customerEmail) {
      setInvoiceToast({ type: 'error', message: tx({
        fr: 'Impossible d\'envoyer: aucun email client sur cette commande.',
        en: 'Cannot send: no customer email on this order.',
        es: 'No se puede enviar: sin email del cliente.',
      }) });
      return;
    }

    setSendingInvoiceId(order.documentId);
    setInvoiceToast(null);
    try {
      // Generer le PDF cote client et l'envoyer en base64 au backend.
      // Le backend fallback sur pas-de-PDF si base64 absent, mais on le fournit toujours.
      let pdfBase64;
      let pdfFilename;
      try {
        const result = generateInvoicePDF(order, 'invoice', { returnBase64: true, settings: billingSettings || {} });
        if (result && typeof result === 'object' && result.base64) {
          pdfBase64 = result.base64;
          pdfFilename = result.fileName;
        }
      } catch (pdfErr) {
        console.warn('PDF generation failed, sending email without attachment:', pdfErr);
      }

      const res = await sendOrderInvoice(order.documentId, { pdfBase64, pdfFilename });
      const sentTo = res?.data?.data?.customerEmail || order.customerEmail;
      setInvoiceToast({
        type: 'success',
        message: tx({
          fr: `Courriel envoye avec succes a ${sentTo}`,
          en: `Email sent successfully to ${sentTo}`,
          es: `Correo enviado con exito a ${sentTo}`,
        }),
      });
    } catch (err) {
      console.error('sendInvoice failed:', err);
      const backendMsg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || 'Erreur inconnue';
      setInvoiceToast({
        type: 'error',
        message: tx({
          fr: `Echec envoi : ${backendMsg}`,
          en: `Send failed: ${backendMsg}`,
          es: `Error de envio: ${backendMsg}`,
        }),
      });
    } finally {
      setSendingInvoiceId(null);
    }
  };

  // Modal d'edition du total d'une commande (ajustement rabais/balance)
  const [editTotalOrder, setEditTotalOrder] = useState(null);
  const onOrderTotalUpdated = useCallback((updatedOrder) => {
    // Mise a jour optimiste locale: remplace la commande dans l'etat sans refetch complet
    if (!updatedOrder) return;
    setOrders((prev) => prev.map((o) => (o.documentId === updatedOrder.documentId ? { ...o, ...updatedOrder } : o)));
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    // Preuve que la donnee arrive : compte d'orders + debug pagination dans la console.
    // Si le nombre affiche ici diverge de l'UI, c'est que le filtrage frontend
    // (activeTab ou searchDebounce) cache des orders. Jamais que le backend.
    setLoading(true);
    try {
      const params = { page: meta.page, pageSize: meta.pageSize };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchDebounce) params.search = searchDebounce;
      const { data } = await getOrders(params);
      const received = Array.isArray(data?.data) ? data.data : [];
      // LOG DE PREUVE : on verifie ici que toute la data traverse bien le tuyau.
      console.log(
        '[AdminOrders] Nombre TOTAL de commandes recues du serveur :',
        received.length,
        '(meta.total backend:', data?.meta?.total, '| pageSize:', meta.pageSize, '| page:', meta.page, ')',
      );
      if (data?.meta?.total > received.length) {
        console.warn(
          '[AdminOrders] ATTENTION : le backend indique', data.meta.total,
          'orders mais seulement', received.length, 'sont retournees. Augmenter pageSize.',
        );
      }
      setOrders(received);
      setMeta(data.meta || { page: 1, pageSize: meta.pageSize, total: received.length, pageCount: 1 });
    } catch (err) {
      console.error('[AdminOrders] fetchOrders failed:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.pageSize, filterStatus, searchDebounce]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // POLLING LIVE (avril 2026) : refresh silencieux toutes les 30s pour detecter
  // les nouveaux paiements Stripe arrivant via webhook. Si une nouvelle commande
  // `paid` apparait (ou une commande change de status vers `paid`), on affiche
  // un toast special "Nouveau paiement valide" pour alerter l'admin.
  const lastPaidKeysRef = useRef(null);
  useEffect(() => {
    // Snapshot initial des commandes paid/processing/ready/shipped/delivered deja connues
    if (lastPaidKeysRef.current === null && Array.isArray(orders)) {
      const known = new Set(orders
        .filter(o => ['paid','processing','ready','shipped','delivered'].includes(o.status))
        .map(o => o.documentId));
      lastPaidKeysRef.current = known;
    }
  }, [orders]);

  useEffect(() => {
    // Si l'admin change de page/filter/search, on ne veut pas re-flasher le toast
    // pour les commandes deja vues. On reset le snapshot au prochain render.
    lastPaidKeysRef.current = null;
  }, [meta.page, filterStatus, searchDebounce]);

  useEffect(() => {
    const POLL_MS = 30_000;
    const intervalId = setInterval(async () => {
      // Skip le polling si admin est en pleine mutation (evite concurrence visuelle)
      if (updatingId || deletingId || sendingInvoiceId) return;
      try {
        const params = { page: meta.page, pageSize: meta.pageSize };
        if (filterStatus !== 'all') params.status = filterStatus;
        if (searchDebounce) params.search = searchDebounce;
        const { data } = await getOrders(params);
        const fresh = data?.data || [];

        // Detection des nouveaux paiements : doc IDs paid/... absents du snapshot
        const currentPaid = fresh.filter(o => ['paid','processing','ready','shipped','delivered'].includes(o.status));
        const known = lastPaidKeysRef.current || new Set();
        const justPaid = currentPaid.filter(o => !known.has(o.documentId));

        if (justPaid.length > 0) {
          const first = justPaid[0];
          const ref = first.orderRef || first.documentId?.slice(0, 8).toUpperCase() || '';
          const amt = ((first.total || 0) / 100).toFixed(2);
          setActionToast({
            type: 'success',
            message: tx({
              fr: `Nouveau paiement valide ! Commande #${ref} - ${amt}$${justPaid.length > 1 ? ` (+${justPaid.length - 1} autres)` : ''}`,
              en: `New payment validated! Order #${ref} - $${amt}${justPaid.length > 1 ? ` (+${justPaid.length - 1} more)` : ''}`,
              es: `Nuevo pago validado! Pedido #${ref} - ${amt}$${justPaid.length > 1 ? ` (+${justPaid.length - 1} mas)` : ''}`,
            }),
          });
          // Beep discret pour attirer l'attention si l'onglet est en arriere-plan
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine'; osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start(); osc.stop(ctx.currentTime + 0.2);
          } catch { /* audio non supporte - OK */ }
        }

        // Mettre a jour le snapshot + la liste affichee (uniquement si pas de diff majeur)
        lastPaidKeysRef.current = new Set(currentPaid.map(o => o.documentId));
        // Update list seulement si le count total a change ou si de nouveaux paid
        if (justPaid.length > 0 || fresh.length !== orders.length) {
          setOrders(fresh);
          if (data.meta) setMeta(data.meta);
        }
      } catch { /* silent polling - ne pas flood de toasts */ }
    }, POLL_MS);
    return () => clearInterval(intervalId);
  }, [meta.page, meta.pageSize, filterStatus, searchDebounce, orders.length, updatingId, deletingId, sendingInvoiceId, tx]);

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
  const handleStatusChange = async (documentId, newStatus, currentStatus) => {
    if (!newStatus || newStatus === currentStatus) return;
    setUpdatingId(documentId);
    setActionToast(null);
    // Optimistic update
    const snapshot = orders;
    setOrders(prev => prev.map(o => o.documentId === documentId ? { ...o, status: newStatus } : o));
    try {
      await updateOrderStatus(documentId, newStatus);
      const label = ORDER_STATUS[newStatus];
      const labelTxt = label ? tx({ fr: label.fr, en: label.en, es: label.es }) : newStatus;
      setActionToast({
        type: 'success',
        message: tx({
          fr: `Statut change vers "${labelTxt}".`,
          en: `Status changed to "${labelTxt}".`,
          es: `Estado cambiado a "${labelTxt}".`,
        }),
      });
    } catch (err) {
      // Rollback
      setOrders(snapshot);
      const backendMsg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || 'Erreur inconnue';
      setActionToast({
        type: 'error',
        message: tx({
          fr: `Changement de statut refuse : ${backendMsg}`,
          en: `Status change rejected: ${backendMsg}`,
          es: `Cambio de estado rechazado: ${backendMsg}`,
        }),
      });
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

  const handleDelete = async (order) => {
    const documentId = order?.documentId;
    if (!documentId) return;

    // Confirmation native window.confirm - impossible a skipper par accident.
    const ref = order.orderRef || documentId.slice(0, 8).toUpperCase();
    const who = order.customerName || order.customerEmail || '(client inconnu)';
    const amt = ((order.total || 0) / 100).toFixed(2);
    const confirmMsg = tx({
      fr: `Supprimer DEFINITIVEMENT la commande ${ref}\n(${who}, ${amt}$) ?\n\nCette action est irreversible.`,
      en: `PERMANENTLY delete order ${ref}\n(${who}, $${amt}) ?\n\nThis cannot be undone.`,
      es: `Eliminar DEFINITIVAMENTE el pedido ${ref}\n(${who}, ${amt}$) ?\n\nEsta accion es irreversible.`,
    });
    if (!window.confirm(confirmMsg)) return;

    // OPTIMISTIC UI : snapshot + filter local IMMEDIAT avant appel API.
    // L'utilisateur voit la commande disparaitre a l'instant. Si l'API echoue,
    // on restaure le snapshot et on affiche un toast rouge explicite.
    const snapshot = orders;
    const wasExpanded = expandedId === documentId;

    // Filter robuste : on matche sur documentId ET id Strapi numerique au cas ou
    // un des deux serait manquant apres un mapping malheureux.
    setOrders(prev => prev.filter(o =>
      o.documentId !== documentId && String(o.id) !== String(documentId),
    ));
    if (wasExpanded) setExpandedId(null);
    setConfirmDeleteId(null);

    setDeletingId(documentId);
    setActionToast(null);
    try {
      await deleteOrder(documentId);
      setActionToast({
        type: 'success',
        message: tx({
          fr: `Commande ${ref} supprimee definitivement.`,
          en: `Order ${ref} permanently deleted.`,
          es: `Pedido ${ref} eliminado definitivamente.`,
        }),
      });
      // Refresh silencieux en arriere-plan pour confirmer parfaitement la sync
      // avec la BDD (meta.total, stats). Non-bloquant et non-throw.
      fetchOrders().catch(() => {});
      getOrderStats().then(({ data }) => setStats(data)).catch(() => {});
    } catch (err) {
      console.error('deleteOrder failed:', err);
      // ROLLBACK : restaurer l'ordre dans la liste + reouvrir le panel si l'user l'avait
      setOrders(snapshot);
      if (wasExpanded) setExpandedId(documentId);
      const backendMsg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || 'Erreur inconnue';
      setActionToast({
        type: 'error',
        message: tx({
          fr: `Echec suppression : ${backendMsg}`,
          en: `Delete failed: ${backendMsg}`,
          es: `Error de eliminacion: ${backendMsg}`,
        }),
      });
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

  // Interface minimaliste : "all" affiche TOUTES les orders, sans filtre.
  // Les anciens onglets Boutique/B2B ont ete supprimes.
  const displayedOrders = orders;

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

      {/* Toast global envoi facture (bas droite, auto-dismiss) */}
      <AnimatePresence>
        {actionToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 border ${
              actionToast.type === 'success'
                ? 'bg-green-600/95 border-green-400/60'
                : 'bg-red-600/95 border-red-400/60'
            }`}
          >
            {actionToast.type === 'success'
              ? <CheckCircle size={20} className="text-white flex-shrink-0 mt-0.5" />
              : <AlertTriangle size={20} className="text-white flex-shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {actionToast.type === 'success'
                  ? tx({ fr: 'Courriel envoye', en: 'Email sent', es: 'Correo enviado' })
                  : tx({ fr: 'Erreur', en: 'Error', es: 'Error' })}
              </p>
              <p className="text-white/90 text-xs mt-0.5 whitespace-pre-wrap">{actionToast.message}</p>
            </div>
            <button onClick={() => setInvoiceToast(null)} className="text-white/70 hover:text-white transition-colors">
              <XCircle size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre de tabs minimaliste (2 onglets) : commandes + reglages integres */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 card-bg rounded-xl p-1 shadow-sm">
          {[
            { id: 'all',      label: tx({ fr: 'Toutes les commandes', en: 'All orders', es: 'Todos los pedidos' }),    icon: ShoppingBag },
            { id: 'settings', label: tx({ fr: 'Reglages Facturation', en: 'Billing Settings', es: 'Ajustes' }),        icon: Settings },
          ].map(t => {
            const Ic = t.icon;
            const isActive = activeTab === t.id;
            const count = t.id === 'all' ? orders.length : null;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? 'bg-accent text-white shadow' : 'text-grey-muted hover:text-heading hover:bg-white/5'
                }`}
              >
                <Ic size={13} />
                <span>{t.label}</span>
                {count !== null && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-black/20'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CTA: creer une commande manuelle + facture + lien Stripe (masque en Reglages) */}
        {activeTab !== 'settings' && (
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-accent/20"
          >
            <Plus size={16} />
            {tx({
              fr: 'Creer une commande / facture manuelle',
              en: 'Create manual order / invoice',
              es: 'Crear pedido / factura manual',
            })}
          </button>
        )}
      </div>

      {showManualModal && (
        <CreateManualOrderModal
          onClose={() => setShowManualModal(false)}
          onCreated={() => {
            fetchOrders();
            getOrderStats().then(({ data }) => setStats(data)).catch(() => {});
          }}
        />
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

      {/* SETTINGS TAB : on escamote le tableau et on affiche le form de
          Reglages Facturation integre. Aucun fetch additionel necessaire,
          le composant gere son propre load state. */}
      {activeTab === 'settings' ? (
        <>
          {/* One-shot : reinjection 3 factures B2B perdues (avril 2026) */}
          <div className="rounded-xl card-bg shadow-lg shadow-black/20 p-5 mb-4 border border-yellow-500/30">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-heading font-bold text-heading mb-1">
                  {tx({
                    fr: 'Reinjection factures perdues (one-shot)',
                    en: 'Reinject lost invoices (one-shot)',
                    es: 'Reinjectar facturas perdidas (una vez)',
                  })}
                </h3>
                <p className="text-xs text-grey-muted leading-relaxed">
                  {tx({
                    fr: 'Recree les 3 factures B2B historiques disparues lors du refactor : La Presse (770$), Andrew Higgs (400$), Jerome Prunier (1500$). TPS/TVQ calculees serveur. Genere un Stripe Payment Link par facture. Idempotent : skip si deja presentes.',
                    en: 'Recreates the 3 historical B2B invoices lost during refactor: La Presse (770$), Andrew Higgs (400$), Jerome Prunier (1500$). GST/QST server-side. Generates a Stripe Payment Link per invoice. Idempotent.',
                    es: 'Recrea las 3 facturas B2B historicas perdidas.',
                  })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSeedLegacy}
              disabled={seedingLegacy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seedingLegacy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              {seedingLegacy
                ? tx({ fr: 'Reinjection en cours...', en: 'Reinjecting...', es: 'Reinjectando...' })
                : tx({ fr: 'Reinjecter les 3 factures', en: 'Reinject the 3 invoices', es: 'Reinjectar las 3 facturas' })}
            </button>

            {seedReport && seedReport.report && (
              <div className="mt-4 p-3 rounded-lg bg-black/30 border border-white/5">
                <div className="text-xs font-mono text-grey-muted mb-2">
                  {tx({ fr: 'Rapport :', en: 'Report:', es: 'Informe:' })}
                  {' '}
                  <span className="text-green-400">{seedReport.summary?.created || 0} {tx({ fr: 'crees', en: 'created', es: 'creadas' })}</span>
                  {' · '}
                  <span className="text-yellow-400">{seedReport.summary?.skipped || 0} skip</span>
                  {' · '}
                  <span className="text-red-400">{seedReport.summary?.failed || 0} {tx({ fr: 'echec', en: 'failed', es: 'fallo' })}</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {seedReport.report.map((r, i) => (
                    <div key={i} className="text-[11px] font-mono flex items-start gap-2">
                      <span className={r.error ? 'text-red-400' : r.skipped ? 'text-yellow-400' : 'text-green-400'}>
                        {r.error ? 'X' : r.skipped ? '-' : '+'}
                      </span>
                      <span className="text-grey-muted flex-1">
                        <span className="text-heading">{r.key}</span>
                        {r.invoiceNumber && <> -&gt; {r.invoiceNumber} ({r.total}$)</>}
                        {r.skipped && <> {tx({ fr: 'deja present', en: 'already exists', es: 'ya existe' })}</>}
                        {r.error && <> {tx({ fr: 'erreur :', en: 'error:', es: 'error:' })} {r.error}</>}
                        {r.paymentUrl && (
                          <>
                            {' '}
                            <a href={r.paymentUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                              [Stripe link]
                            </a>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
            <AdminReglagesFacturation />
          </div>
        </>
      ) : (
      <>
      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      ) : displayedOrders.length === 0 ? (
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
            {displayedOrders.map((order) => {
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
                      <span className="text-lg text-heading font-bold inline-flex items-center gap-1.5 group">
                        {dollars(order.total)}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditTotalOrder(order); }}
                          className="p-1 rounded hover:bg-white/10 text-grey-muted hover:text-accent transition-colors opacity-60 group-hover:opacity-100"
                          title={tx({ fr: 'Ajuster le total', en: 'Adjust total', es: 'Ajustar total' })}
                          aria-label={tx({ fr: 'Ajuster le total', en: 'Adjust total', es: 'Ajustar total' })}
                        >
                          <Pencil size={12} />
                        </button>
                      </span>
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
                        <span className="text-base text-heading font-bold flex-shrink-0 inline-flex items-center gap-1">
                          {dollars(order.total)}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditTotalOrder(order); }}
                            className="p-1 rounded text-grey-muted hover:text-accent transition-colors"
                            title={tx({ fr: 'Ajuster le total', en: 'Adjust total', es: 'Ajustar total' })}
                            aria-label={tx({ fr: 'Ajuster le total', en: 'Adjust total', es: 'Ajustar total' })}
                          >
                            <Pencil size={11} />
                          </button>
                        </span>
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
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={(e) => { e.stopPropagation(); generateInvoicePDF(order, 'invoice', { settings: billingSettings || {} }); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                                >
                                  <Download size={12} />
                                  {tx({ fr: 'Facture', en: 'Invoice', es: 'Factura' })}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); generateInvoicePDF(order, 'receipt', { settings: billingSettings || {} }); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                >
                                  <Receipt size={12} />
                                  {tx({ fr: 'Reçu', en: 'Receipt', es: 'Recibo' })}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPreviewInvoiceOrder(order); }}
                                  disabled={sendingInvoiceId === order.documentId || !order.customerEmail}
                                  title={!order.customerEmail
                                    ? tx({ fr: 'Aucun email client', en: 'No customer email', es: 'Sin email del cliente' })
                                    : tx({ fr: 'Previsualiser avant envoi (PDF + lien Stripe)', en: 'Preview before sending (PDF + Stripe link)', es: 'Previsualizar antes de enviar' })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {sendingInvoiceId === order.documentId ? (
                                    <><Loader2 size={12} className="animate-spin" /> {tx({ fr: 'Envoi...', en: 'Sending...', es: 'Enviando...' })}</>
                                  ) : (
                                    <><Mail size={12} /> {tx({ fr: 'Envoyer la facture', en: 'Email invoice', es: 'Enviar factura' })}</>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Status dropdown - admin peut passer a n'importe quel statut */}
                          <div className="flex items-center gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-grey-muted">
                              {tx({ fr: 'Statut de la commande:', en: 'Order status:', es: 'Estado del pedido:' })}
                            </span>
                            <div className="relative inline-block">
                              <select
                                value={order.status || 'pending'}
                                onChange={(e) => handleStatusChange(order.documentId, e.target.value, order.status)}
                                disabled={updatingId === order.documentId}
                                className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold border-2 border-white/10 hover:border-accent/50 focus:border-accent focus:outline-none transition-colors disabled:opacity-50 ${ORDER_STATUS[order.status]?.color || 'bg-gray-500/20 text-gray-400'}`}
                              >
                                <option value="pending">{tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' })}</option>
                                <option value="paid">{tx({ fr: 'Paye / En production', en: 'Paid / In production', es: 'Pagado / En produccion' })}</option>
                                <option value="processing">{tx({ fr: 'En production', en: 'Processing', es: 'En proceso' })}</option>
                                <option value="ready">{tx({ fr: 'Pret', en: 'Ready', es: 'Listo' })}</option>
                                <option value="shipped">{tx({ fr: 'Expedie', en: 'Shipped', es: 'Enviado' })}</option>
                                <option value="delivered">{tx({ fr: 'Livre', en: 'Delivered', es: 'Entregado' })}</option>
                                <option value="cancelled">{tx({ fr: 'Annule', en: 'Cancelled', es: 'Cancelado' })}</option>
                                <option value="refunded">{tx({ fr: 'Rembourse', en: 'Refunded', es: 'Reembolsado' })}</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                            </div>
                            {updatingId === order.documentId && <Loader2 size={12} className="animate-spin text-accent" />}

                            {/* Lien rapide Stripe Dashboard (visible si stripePaymentIntentId present) */}
                            {order.stripePaymentIntentId && (
                              <a
                                href={`https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/30 ml-auto"
                                title={tx({ fr: 'Ouvrir la transaction dans Stripe', en: 'Open transaction in Stripe', es: 'Abrir transaccion en Stripe' })}
                              >
                                <CreditCard size={12} />
                                {tx({ fr: 'Voir dans Stripe', en: 'View in Stripe', es: 'Ver en Stripe' })}
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>

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
                                        {Array.isArray(item.packDetails) && item.packDetails.length > 0 && (() => {
                                          // Data source: ConfiguratorArtistSticker.jsx
                                          // - detail.qty = TOTAL deja calcule de CE sticker pour toute la commande
                                          // - detail.qtyPerPack = nb de CE sticker dans UN pack (pochette)
                                          // - item.quantity = TOTAL de stickers dans toute la commande (= packCount x packSize)
                                          // - packComposition = { packSize, packCount, total }
                                          const composition = item.packComposition || {};
                                          const packCount = Number(composition.packCount) || 0;
                                          const packSize = Number(composition.packSize) || 0;
                                          const totalStickers = Number(item.quantity) || item.packDetails.reduce((acc, d) => acc + (Number(d.qty) || 0), 0);
                                          return (
                                          <div className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                                            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                                              <span className="text-xs text-accent font-semibold uppercase tracking-wide">
                                                {tx({ fr: 'Stickers a imprimer', en: 'Stickers to print', es: 'Stickers a imprimir' })}
                                              </span>
                                              <span className="text-xs text-grey-muted">
                                                {packCount > 0 && packSize > 0 ? (
                                                  <>{packCount} pack(s) × {packSize} stickers = </>
                                                ) : null}
                                                <strong className="text-accent">{totalStickers} {tx({ fr: 'stickers au total', en: 'stickers total', es: 'stickers total' })}</strong>
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {item.packDetails.map((detail, di) => {
                                                const totalToPrint = Number(detail.qty) || ((Number(detail.qtyPerPack) || 1) * (packCount || 1));
                                                const perPack = Number(detail.qtyPerPack) || 1;
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
                                                        {packCount > 0 ? <>{perPack}/pack × {packCount} = </> : null}<strong className="text-accent">{totalToPrint}</strong>
                                                      </p>
                                                    </div>
                                                    <ExternalLink size={12} className="text-grey-muted group-hover:text-accent flex-shrink-0" />
                                                  </a>
                                                );
                                              })}
                                            </div>
                                          </div>
                                          );
                                        })()}
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
                                <div className="flex justify-between items-center shadow-[0_-1px_0_rgba(255,255,255,0.04)] pt-2 mt-2">
                                  <span className="text-heading font-bold text-base">Total</span>
                                  <span className="inline-flex items-center gap-2">
                                    <span className="text-heading font-bold text-lg">{dollars(order.total)}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setEditTotalOrder(order); }}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-accent/20 text-grey-muted hover:text-accent transition-colors"
                                      title={tx({ fr: 'Ajuster le total (rabais/balance)', en: 'Adjust total (discount/balance)', es: 'Ajustar total' })}
                                      aria-label={tx({ fr: 'Ajuster le total', en: 'Adjust total', es: 'Ajustar total' })}
                                    >
                                      <Pencil size={13} />
                                    </button>
                                  </span>
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

                          {/* Expedition & Suivi (tracking live via provider) */}
                          <div className="rounded-lg bg-glass p-4">
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Truck size={12} />
                              {tx({ fr: 'Expedition & Suivi', en: 'Shipping & Tracking', es: 'Envio y Seguimiento' })}
                            </h4>
                            {order.trackingNumber ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-sm text-heading font-mono font-bold">{order.trackingNumber}</span>
                                  <span className="text-xs text-grey-muted">
                                    {order.carrier === 'purolator' ? 'Purolator' : order.carrier === 'ups' ? 'UPS' : 'Postes Canada'}
                                  </span>
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20"
                                  >
                                    <ExternalLink size={12} />
                                    {tx({ fr: 'Site transporteur', en: 'Carrier site', es: 'Sitio transportista' })}
                                  </a>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); refreshTracking(order); }}
                                    disabled={trackingState[order.documentId]?.loading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
                                  >
                                    {trackingState[order.documentId]?.loading
                                      ? <><Loader2 size={12} className="animate-spin" /> {tx({ fr: 'Verification...', en: 'Checking...', es: 'Verificando...' })}</>
                                      : <><RotateCcw size={12} /> {tx({ fr: 'Verifier le statut de livraison', en: 'Check delivery status', es: 'Verificar estado' })}</>}
                                  </button>
                                </div>

                                {/* Radar timeline (apres clic sur "Verifier") */}
                                {trackingState[order.documentId]?.error && (
                                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
                                    <AlertTriangle size={12} />
                                    {trackingState[order.documentId].error}
                                  </div>
                                )}
                                {trackingState[order.documentId]?.data && (() => {
                                  const td = trackingState[order.documentId].data;
                                  const statusColor = td.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400'
                                    : td.status === 'out_for_delivery' ? 'bg-orange-500/20 text-orange-400'
                                    : td.status === 'in_transit' ? 'bg-blue-500/20 text-blue-400'
                                    : td.status === 'exception' ? 'bg-red-500/20 text-red-400'
                                    : 'bg-gray-500/20 text-gray-400';
                                  return (
                                    <div className="rounded-lg bg-black/20 p-3 space-y-3 border border-white/5">
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                          {td.status === 'delivered' && <CheckCircle size={12} />}
                                          {td.status === 'out_for_delivery' && <Truck size={12} />}
                                          {td.status === 'in_transit' && <Package size={12} />}
                                          {td.statusLabel}
                                        </span>
                                        <span className="text-[10px] text-grey-muted">
                                          {tx({ fr: 'Source', en: 'Source', es: 'Fuente' })}: {td.providerUsed}
                                          {td.providerUsed === 'mock' && (
                                            <span className="ml-1 text-yellow-400">({tx({ fr: 'mode demo', en: 'demo mode', es: 'demo' })})</span>
                                          )}
                                        </span>
                                      </div>

                                      {Array.isArray(td.events) && td.events.length > 0 && (
                                        <ol className="relative border-l-2 border-white/10 ml-1 space-y-3">
                                          {td.events.map((ev, i) => (
                                            <li key={i} className="ml-4 pl-0">
                                              <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#1a0030] border-2 border-accent/50 mt-1" />
                                              <p className="text-sm text-heading">{ev.description}</p>
                                              <p className="text-[10px] text-grey-muted mt-0.5">
                                                {ev.location} · {ev.date ? new Date(ev.date).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                              </p>
                                            </li>
                                          ))}
                                        </ol>
                                      )}
                                    </div>
                                  );
                                })()}
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

                          {/* Historique / journal des evenements de la commande */}
                          <div className="rounded-lg bg-glass p-4">
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Clock size={12} />
                              {tx({ fr: 'Historique', en: 'History', es: 'Historial' })}
                            </h4>
                            {(() => {
                              const events = [];
                              // Creation
                              if (order.createdAt) {
                                events.push({
                                  ts: order.createdAt,
                                  label: order.isManual
                                    ? tx({ fr: 'Commande manuelle creee', en: 'Manual order created', es: 'Pedido manual creado' })
                                    : tx({ fr: 'Commande creee', en: 'Order created', es: 'Pedido creado' }),
                                  icon: Plus,
                                  color: 'text-grey-muted',
                                });
                              }
                              // Lien Stripe genere (pour les commandes manuelles)
                              if (order.isManual && order.invoiceNumber) {
                                events.push({
                                  ts: order.createdAt,
                                  label: tx({
                                    fr: `Facture ${order.invoiceNumber} + lien Stripe genere`,
                                    en: `Invoice ${order.invoiceNumber} + Stripe link generated`,
                                    es: `Factura ${order.invoiceNumber} + enlace Stripe generado`,
                                  }),
                                  icon: FileText,
                                  color: 'text-accent',
                                });
                              }
                              // Paiement recu
                              if (order.status === 'paid' || order.status === 'processing' || order.status === 'ready' || order.status === 'shipped' || order.status === 'delivered') {
                                events.push({
                                  ts: order.paidAt || order.updatedAt,
                                  label: tx({ fr: 'Paiement recu', en: 'Payment received', es: 'Pago recibido' }),
                                  icon: CreditCard,
                                  color: 'text-green-400',
                                });
                              }
                              // Expedition
                              if (order.trackingNumber) {
                                events.push({
                                  ts: order.shippedAt || order.updatedAt,
                                  label: tx({
                                    fr: `Expedie (${order.carrier || 'postes-canada'}) - ${order.trackingNumber}`,
                                    en: `Shipped (${order.carrier || 'postes-canada'}) - ${order.trackingNumber}`,
                                    es: `Enviado (${order.carrier || 'postes-canada'}) - ${order.trackingNumber}`,
                                  }),
                                  icon: Truck,
                                  color: 'text-purple-400',
                                });
                              }
                              // Livraison
                              if (order.status === 'delivered') {
                                events.push({
                                  ts: order.deliveredAt || order.updatedAt,
                                  label: tx({ fr: 'Livree au client', en: 'Delivered to customer', es: 'Entregado al cliente' }),
                                  icon: CheckCircle,
                                  color: 'text-emerald-400',
                                });
                              }
                              // Annulation
                              if (order.status === 'cancelled') {
                                events.push({
                                  ts: order.updatedAt,
                                  label: tx({ fr: 'Commande annulee', en: 'Order cancelled', es: 'Pedido cancelado' }),
                                  icon: XCircle,
                                  color: 'text-red-400',
                                });
                              }
                              // Remboursement
                              if (order.status === 'refunded') {
                                events.push({
                                  ts: order.refundedAt || order.updatedAt,
                                  label: tx({ fr: 'Remboursee', en: 'Refunded', es: 'Reembolsado' }),
                                  icon: RotateCcw,
                                  color: 'text-gray-400',
                                });
                              }

                              if (events.length === 0) {
                                return <p className="text-xs text-grey-muted">{tx({ fr: 'Aucun evenement.', en: 'No events.', es: 'Sin eventos.' })}</p>;
                              }

                              return (
                                <ol className="relative border-l-2 border-white/10 ml-1 space-y-3">
                                  {events.map((ev, i) => {
                                    const Ic = ev.icon;
                                    return (
                                      <li key={i} className="ml-4 pl-0">
                                        <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#1a0030] border-2 border-white/20 mt-1" />
                                        <div className="flex items-center gap-2">
                                          <Ic size={13} className={ev.color} />
                                          <span className="text-sm text-heading">{ev.label}</span>
                                        </div>
                                        <span className="text-[10px] text-grey-muted ml-[21px]">
                                          {ev.ts ? formatDate(ev.ts) : '-'}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ol>
                              );
                            })()}
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

                            {/* Delete button (hard delete + window.confirm) */}
                            <div className="flex-shrink-0 self-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(order); }}
                                disabled={deletingId === order.documentId}
                                title={tx({
                                  fr: 'Supprimer definitivement cette commande',
                                  en: 'Permanently delete this order',
                                  es: 'Eliminar definitivamente este pedido',
                                })}
                                className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20 hover:border-red-500/50"
                              >
                                {deletingId === order.documentId
                                  ? <><Loader2 size={12} className="animate-spin" /> {tx({ fr: 'Suppression...', en: 'Deleting...', es: 'Eliminando...' })}</>
                                  : <><Trash2 size={12} /> {tx({ fr: 'Supprimer la commande', en: 'Delete order', es: 'Eliminar pedido' })}</>}
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
      </>
      )}

      {/* Modal d'ajustement manuel du total d'une commande */}
      {editTotalOrder && (
        <EditOrderTotalModal
          order={editTotalOrder}
          onClose={() => setEditTotalOrder(null)}
          onUpdated={onOrderTotalUpdated}
        />
      )}

      {/* Modal de PREVISUALISATION avant envoi facture - admin doit confirmer */}
      <AnimatePresence>
        {previewInvoiceOrder && (() => {
          const po = previewInvoiceOrder;
          const invNum = po.invoiceNumber || po.orderRef || (po.documentId?.slice(0, 8).toUpperCase() || '');
          const refShort = po.orderRef || po.documentId?.slice(0, 8).toUpperCase() || '';
          const totalDollars = ((po.total || 0) / 100).toFixed(2);
          const isSending = sendingInvoiceId === po.documentId;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSending && setPreviewInvoiceOrder(null)}
              className="fixed inset-0 z-[9500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1a0030] rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full my-8 overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2">
                    <Mail size={16} className="text-accent" />
                    {tx({ fr: 'Envoyer la facture', en: 'Send invoice', es: 'Enviar factura' })}
                  </h3>
                  <button
                    onClick={() => !isSending && setPreviewInvoiceOrder(null)}
                    disabled={isSending}
                    className="p-1.5 rounded-lg text-grey-muted hover:text-heading hover:bg-white/5 disabled:opacity-40"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                <div className="px-5 py-5 space-y-4 text-sm">
                  {/* Destinataire */}
                  <div>
                    <label className="text-[10px] text-grey-muted uppercase tracking-wider block mb-1">
                      {tx({ fr: 'Destinataire', en: 'Recipient', es: 'Destinatario' })}
                    </label>
                    <div className="rounded-lg bg-black/30 px-3 py-2.5 border border-white/10">
                      <p className="text-heading font-semibold">{po.customerName || 'Client'}</p>
                      <p className="text-grey-muted text-xs font-mono mt-0.5">{po.customerEmail}</p>
                    </div>
                  </div>

                  {/* BCC admin (info) */}
                  <div className="rounded-lg bg-accent/5 border border-accent/20 px-3 py-2 text-xs text-accent flex items-center gap-2">
                    <CheckCircle size={12} />
                    {tx({
                      fr: 'BCC automatique : massivemedias@gmail.com (copie admin)',
                      en: 'Auto BCC: massivemedias@gmail.com (admin copy)',
                      es: 'BCC automatico: massivemedias@gmail.com',
                    })}
                  </div>

                  {/* Sujet */}
                  <div>
                    <label className="text-[10px] text-grey-muted uppercase tracking-wider block mb-1">
                      {tx({ fr: 'Sujet', en: 'Subject', es: 'Asunto' })}
                    </label>
                    <p className="rounded-lg bg-black/30 px-3 py-2.5 border border-white/10 text-heading text-xs">
                      Facture pour la commande #{invNum} - {po.customerName || 'Client'}
                    </p>
                  </div>

                  {/* Apercu message */}
                  <div>
                    <label className="text-[10px] text-grey-muted uppercase tracking-wider block mb-1">
                      {tx({ fr: 'Apercu du message', en: 'Message preview', es: 'Vista previa' })}
                    </label>
                    <div className="rounded-lg bg-black/30 px-3 py-2.5 border border-white/10 text-xs text-grey-muted space-y-1.5">
                      <p className="text-heading">{tx({ fr: `Bonjour ${po.customerName || 'client'},`, en: `Hi ${po.customerName || 'client'},`, es: `Hola ${po.customerName || 'cliente'},` })}</p>
                      <p>{tx({
                        fr: `Voici votre facture pour la commande #${refShort} (total ${totalDollars}$).`,
                        en: `Here is your invoice for order #${refShort} (total $${totalDollars}).`,
                        es: `Aqui esta tu factura del pedido #${refShort} (total ${totalDollars}$).`,
                      })}</p>
                      <p>{tx({
                        fr: 'Vous pouvez regler en ligne via le lien de paiement securise Stripe inclus.',
                        en: 'You can pay online via the secure Stripe payment link included.',
                        es: 'Puede pagar en linea mediante el enlace Stripe incluido.',
                      })}</p>
                      <p className="text-grey-muted">{tx({ fr: 'Cordialement,\nMassive Medias', en: 'Best regards,\nMassive Medias', es: 'Saludos,\nMassive Medias' })}</p>
                    </div>
                  </div>

                  {/* Piece jointe */}
                  <div>
                    <label className="text-[10px] text-grey-muted uppercase tracking-wider block mb-1">
                      {tx({ fr: 'Piece jointe', en: 'Attachment', es: 'Adjunto' })}
                    </label>
                    <div className="rounded-lg bg-black/30 px-3 py-2.5 border border-white/10 flex items-center gap-2">
                      <FileText size={14} className="text-accent" />
                      <span className="text-heading text-xs font-mono">facture-{invNum}.pdf</span>
                      <span className="text-[10px] text-grey-muted ml-auto">
                        {tx({ fr: 'genere au moment de l\'envoi', en: 'generated on send', es: 'generado al enviar' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-5 py-3 bg-black/30 border-t border-white/5">
                  <button
                    onClick={() => !isSending && setPreviewInvoiceOrder(null)}
                    disabled={isSending}
                    className="flex-1 py-2 rounded-lg bg-white/5 text-grey-muted font-semibold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                  </button>
                  <button
                    onClick={async () => {
                      await handleSendInvoice(po);
                      setPreviewInvoiceOrder(null);
                    }}
                    disabled={isSending}
                    className="flex-[2] py-2 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSending
                      ? <><Loader2 size={14} className="animate-spin" /> {tx({ fr: 'Envoi en cours...', en: 'Sending...', es: 'Enviando...' })}</>
                      : <><Send size={14} /> {tx({ fr: 'Confirmer l\'envoi', en: 'Confirm send', es: 'Confirmar envio' })}</>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

export default AdminOrders;
