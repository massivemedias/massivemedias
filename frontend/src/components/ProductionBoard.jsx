import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Printer, Scissors, Package, Loader2, Hash, User, Calendar } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { updateOrderProductionStage } from '../services/adminService';

/**
 * ProductionBoard.jsx
 * --------------------
 * Vue Kanban "Atelier" du panneau admin (Phase 7A).
 *
 * - Affiche UNIQUEMENT les commandes dont status === 'processing'.
 *   Les autres statuts (paid, ready, shipped, etc) n'ont pas vocation
 *   a apparaitre ici - le board est centre sur le travail atelier en
 *   cours.
 * - 4 colonnes (CSS Grid) : files_prep, printing, cutting, packaging.
 * - Drag & drop HTML5 natif :
 *     * onDragStart sur la carte -> stocke documentId dans le state
 *     * onDragOver sur la colonne -> e.preventDefault() (sans ca, drop
 *       est rejete par le navigateur)
 *     * onDrop sur la colonne -> optimistic update + PUT API
 * - Echec backend : rollback du state local + erreur visible (toast
 *   parent via prop onError).
 *
 * Props :
 *   - orders        : array complet des commandes (filtrage interne sur processing)
 *   - onStageChange(documentId, stage)  : callback apres reussite,
 *                     utile au parent pour rafraichir Money Board / stats
 *   - onError(msg)  : callback en cas d'echec API
 */

const STAGES = [
  {
    id: 'files_prep',
    icon: FileSearch,
    accent: 'sky',
    label: { fr: 'Fichiers a verifier', en: 'Files to check', es: 'Archivos por verificar' },
  },
  {
    id: 'printing',
    icon: Printer,
    accent: 'amber',
    label: { fr: 'Impression', en: 'Printing', es: 'Impresion' },
  },
  {
    id: 'cutting',
    icon: Scissors,
    accent: 'purple',
    label: { fr: 'Decoupe', en: 'Cutting', es: 'Corte' },
  },
  {
    id: 'packaging',
    icon: Package,
    accent: 'green',
    label: { fr: 'Emballage', en: 'Packaging', es: 'Embalaje' },
  },
];

// Tailwind safelist hint : on construit les classes avec template literals,
// donc il faut que toutes les variantes existent en dur dans au moins un
// fichier (sinon Tailwind purge les classes au build). Ces classes sont
// referencees ci-dessous donc le compilateur les detecte naturellement.
const ACCENT_CLASSES = {
  sky:    { ring: 'ring-sky-400/30',    border: 'border-sky-400/30',    bg: 'bg-sky-400/10',    text: 'text-sky-400',    dropBg: 'bg-sky-400/5'  },
  amber:  { ring: 'ring-amber-400/30',  border: 'border-amber-400/30',  bg: 'bg-amber-400/10',  text: 'text-amber-400',  dropBg: 'bg-amber-400/5' },
  purple: { ring: 'ring-purple-400/30', border: 'border-purple-400/30', bg: 'bg-purple-400/10', text: 'text-purple-400', dropBg: 'bg-purple-400/5' },
  green:  { ring: 'ring-green-400/30',  border: 'border-green-400/30',  bg: 'bg-green-400/10',  text: 'text-green-400',  dropBg: 'bg-green-400/5' },
};

function summarizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  // Resume "500x Stickers Holographiques" : on agrege par productName et
  // on garde le 1er pour ne pas surcharger la carte. Si plusieurs items
  // distincts, on suffixe "+N".
  const grouped = items.reduce((acc, it) => {
    const name = it?.productName || it?.name || 'item';
    const qty = Number(it?.quantity) || 1;
    if (!acc[name]) acc[name] = 0;
    acc[name] += qty;
    return acc;
  }, {});
  const entries = Object.entries(grouped);
  if (entries.length === 0) return null;
  const [firstName, firstQty] = entries[0];
  const extra = entries.length - 1;
  const main = `${firstQty}x ${firstName}`;
  return extra > 0 ? `${main} +${extra}` : main;
}

function formatShortDate(iso, lang) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString(
      lang === 'fr' ? 'fr-CA' : lang === 'es' ? 'es-ES' : 'en-CA',
      { day: 'numeric', month: 'short' },
    );
  } catch {
    return '-';
  }
}

function ProductionBoard({ orders, onStageChange, onError }) {
  const { tx, lang } = useLang();

  // Etat local : on travaille sur une copie pour gerer l'optimistic UI sans
  // attendre la prop parent. Le parent reste source de verite via onStageChange.
  const [localOrders, setLocalOrders] = useState(() => orders);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Quand le parent renvoie une liste fraiche, on resync sans casser un drop
  // en cours.
  if (!draggingId && localOrders !== orders) {
    setLocalOrders(orders);
  }

  // Filtre : Kanban ne montre QUE les commandes en production.
  const processingOrders = useMemo(
    () => (localOrders || []).filter((o) => o?.status === 'processing'),
    [localOrders],
  );

  // Group by productionStage. Les commandes sans stage tombent dans files_prep
  // (default backend) - on garde la meme logique cote frontend pour les
  // commandes legacy creees avant l'ajout du champ.
  const byStage = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => { map[s.id] = []; });
    processingOrders.forEach((o) => {
      const stage = o.productionStage && map[o.productionStage] ? o.productionStage : 'files_prep';
      map[stage].push(o);
    });
    return map;
  }, [processingOrders]);

  const handleDragStart = (e, order) => {
    setDraggingId(order.documentId);
    // Necessaire pour que Firefox accepte le drag.
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', order.documentId); } catch { /* noop */ }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stageId) => {
    // Sans preventDefault le navigateur refuse le drop -> les drops
    // silencieux qui ne marchent jamais sont 99% du temps un onDragOver
    // sans preventDefault.
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) setDragOverStage(stageId);
  };

  const handleDragLeave = (e, stageId) => {
    // On ne reset que si on quitte vraiment la colonne (pas si on entre
    // dans un enfant). currentTarget = la colonne, relatedTarget = ou on va.
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverStage === stageId) setDragOverStage(null);
    }
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const documentId = draggingId || e.dataTransfer.getData('text/plain');
    setDraggingId(null);
    if (!documentId) return;

    const order = (localOrders || []).find((o) => o.documentId === documentId);
    if (!order) return;
    if (order.productionStage === targetStage) return; // pas de move utile

    // Optimistic update
    const previousStage = order.productionStage || 'files_prep';
    setLocalOrders((prev) => prev.map((o) =>
      o.documentId === documentId ? { ...o, productionStage: targetStage } : o,
    ));
    setUpdatingId(documentId);

    try {
      await updateOrderProductionStage(documentId, targetStage);
      if (onStageChange) onStageChange(documentId, targetStage);
    } catch (err) {
      // Rollback
      setLocalOrders((prev) => prev.map((o) =>
        o.documentId === documentId ? { ...o, productionStage: previousStage } : o,
      ));
      const msg = err?.response?.data?.error?.message || err?.message || tx({
        fr: 'Echec de la mise a jour du stage de production.',
        en: 'Failed to update production stage.',
        es: 'Error al actualizar el estado de produccion.',
      });
      if (onError) onError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  if (processingOrders.length === 0) {
    return (
      <div className="card-bg rounded-xl p-8 text-center">
        <Package size={32} className="mx-auto text-grey-muted mb-3" />
        <p className="text-heading font-semibold mb-1">
          {tx({ fr: 'Aucune commande en production', en: 'No order in production', es: 'Ningun pedido en produccion' })}
        </p>
        <p className="text-grey-muted text-sm">
          {tx({
            fr: 'Le Kanban affiche uniquement les commandes au statut "En production". Passe une commande en production pour la voir ici.',
            en: 'The Kanban only shows orders with "Processing" status. Move an order to processing to see it here.',
            es: 'El Kanban solo muestra pedidos en estado "En produccion".',
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {STAGES.map((stage) => {
        const Icon = stage.icon;
        const acc = ACCENT_CLASSES[stage.accent];
        const isOver = dragOverStage === stage.id;
        const stageOrders = byStage[stage.id] || [];

        return (
          <div
            key={stage.id}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={(e) => handleDragLeave(e, stage.id)}
            onDrop={(e) => handleDrop(e, stage.id)}
            className={`rounded-xl p-3 ring-1 ${acc.ring} card-bg min-h-[200px] transition-colors ${
              isOver ? acc.dropBg : ''
            }`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-lg ${acc.bg} flex items-center justify-center`}>
                  <Icon size={13} className={acc.text} />
                </span>
                <h3 className="text-heading font-heading font-bold text-xs uppercase tracking-wider">
                  {tx(stage.label)}
                </h3>
              </div>
              <span className={`text-[11px] font-semibold ${acc.text} bg-black/30 px-2 py-0.5 rounded-full`}>
                {stageOrders.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              <AnimatePresence>
                {stageOrders.map((order) => {
                  const orderRef = (
                    order.orderRef ||
                    String(order.stripePaymentIntentId || '').slice(-8) ||
                    String(order.documentId || '').slice(-8)
                  ).toUpperCase();
                  const itemsSummary = summarizeItems(order.items);
                  const isDragging = draggingId === order.documentId;
                  const isUpdating = updatingId === order.documentId;

                  return (
                    <motion.div
                      key={order.documentId}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable={!isUpdating}
                      onDragStart={(e) => handleDragStart(e, order)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-lg p-3 bg-black/30 border ${acc.border} cursor-grab active:cursor-grabbing select-none transition-opacity ${
                        isDragging ? 'opacity-40' : 'opacity-100'
                      } ${isUpdating ? 'pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Hash size={10} className="text-grey-muted" />
                        <span className="text-[11px] font-mono text-heading font-semibold">
                          {orderRef}
                        </span>
                        {isUpdating && <Loader2 size={11} className="animate-spin text-accent ml-auto" />}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <User size={10} className="text-grey-muted flex-shrink-0" />
                        <span className="text-[12px] text-heading truncate" title={order.companyName || order.customerName || ''}>
                          {order.companyName || order.customerName || tx({ fr: 'Client', en: 'Client', es: 'Cliente' })}
                        </span>
                      </div>

                      {itemsSummary && (
                        <p className="text-[11px] text-grey-muted mb-1.5 leading-snug line-clamp-2" title={itemsSummary}>
                          {itemsSummary}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-grey-muted/80">
                        <Calendar size={9} />
                        {formatShortDate(order.createdAt, lang)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {stageOrders.length === 0 && (
                <p className="text-[11px] text-grey-muted/60 italic text-center py-4">
                  {tx({ fr: 'Vide', en: 'Empty', es: 'Vacio' })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProductionBoard;
