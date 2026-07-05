// FILE-PROD-01A (4 juillet 2026) : constantes de statut de commande partagees.
// Source de verite pour les NOUVEAUX composants (ProductionQueue). Les valeurs
// sont la copie exacte des tokens historiques dupliques dans AdminOrders.jsx
// (ORDER_STATUS) et ClientCRMModal.jsx (STATUS_COLORS / STATUS_LABELS). La
// migration de ces deux fichiers vers ce module est un chantier separe : ne
// pas les brancher ici sans GO explicite.

// Badges (fond translucide + texte colore), theme sombre panneau admin.
export const STATUS_COLORS = {
  draft: 'bg-gray-600/20 text-gray-500',
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  processing: 'bg-blue-500/20 text-blue-400',
  ready: 'bg-orange-500/20 text-orange-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
  refunded: 'bg-gray-500/20 text-gray-400',
}

// Libelles trilingues, format compatible tx({fr, en, es}).
export const STATUS_LABELS = {
  draft: { fr: 'Brouillon', en: 'Draft', es: 'Borrador' },
  pending: { fr: 'En attente', en: 'Pending', es: 'Pendiente' },
  paid: { fr: 'Payé / En production', en: 'Paid / In production', es: 'Pagado / En producción' },
  processing: { fr: 'En production', en: 'Processing', es: 'En producción' },
  ready: { fr: 'Prêt / À remettre', en: 'Ready / To hand over', es: 'Listo / Por entregar' },
  shipped: { fr: 'Expédié', en: 'Shipped', es: 'Enviado' },
  delivered: { fr: 'Livré / Remis', en: 'Delivered / Handed over', es: 'Entregado' },
  cancelled: { fr: 'Annulé', en: 'Cancelled', es: 'Cancelado' },
  refunded: { fr: 'Remboursé', en: 'Refunded', es: 'Reembolsado' },
}

// Etapes de production (champ Order.productionStage), libelles FR.
export const PRODUCTION_STAGE_LABELS = {
  files_prep: 'Préparation fichiers',
  printing: 'Impression',
  cutting: 'Découpe',
  packaging: 'Emballage',
}
