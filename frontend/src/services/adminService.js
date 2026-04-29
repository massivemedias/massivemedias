import api from './api';

// --- Notes admin (content-type admin-note, stockees en BDD) ---
// Utilise par AdminNotes.jsx (page complete) ET AdminDashboard.jsx (widget 3 recentes).
export const getAdminNotes = () => api.get('/admin-notes/list');

/**
 * Fusion de 2 utilisateurs : le compte source et sa trace (user-role, client)
 * sont supprimes, toutes les donnees liees (orders, testimonials, contact-
 * submissions, artist-edit-requests) sont migrees vers le compte cible.
 *
 * Action irreversible - le frontend affiche un avertissement rouge avant
 * appel. Validation cote backend (requireAdminAuth + regex emails + source
 * != target).
 *
 * @param {string} sourceEmail  - email du compte a supprimer
 * @param {string} targetEmail  - email du compte a conserver
 * @returns Promise<{ success, data: { updatedOrders, updatedTestimonials, ... } }>
 */
export const mergeUsers = (sourceEmail, targetEmail) => {
  const src = String(sourceEmail || '').trim().toLowerCase();
  const tgt = String(targetEmail || '').trim().toLowerCase();
  if (!src || !tgt) throw new Error('mergeUsers: sourceEmail et targetEmail requis');
  if (src === tgt) throw new Error('mergeUsers: source et target doivent etre differents');
  return api.post('/admin/users/merge', { sourceEmail: src, targetEmail: tgt });
};

// --- Reglages Facturation (TPS/TVQ, bancaire, Interac) ---
export const getBillingSettings = () => api.get('/billing-settings');

export const updateBillingSettings = (fields) => {
  if (!fields || typeof fields !== 'object') {
    throw new Error('updateBillingSettings: fields requis');
  }
  return api.put('/billing-settings', fields);
};

/**
 * Backup manuel JSON - telecharge une copie complete des donnees vitales
 * (clients, orders, invoices, products, artists, testimonials, expenses,
 * contact-submissions, user-roles) sous forme de fichier JSON.
 *
 * Cote backend (admin-only via requireAdminAuth) : voir
 * backend/src/api/backup/controllers/backup.ts
 *
 * Pourquoi responseType:'blob' :
 *   On veut traiter la reponse comme un binaire pour pouvoir creer un Blob
 *   et declencher le telechargement avec URL.createObjectURL. Sinon axios
 *   parse en JSON et on perd le filename suggere par Content-Disposition.
 *
 * Timeout etendu a 120s : sur une grosse base la generation peut prendre
 * 30-60s (parallelisme + serialization JSON sur ~10k records).
 *
 * @returns Promise<AxiosResponse<Blob>> - le composant appelant gere le DL.
 */
export const downloadBackup = () => api.get('/admin/backup/export', {
  responseType: 'blob',
  timeout: 120000,
});


// --- GOD MODE artistes (mutations directes, bypass edit-requests) ---
// Toutes ces fonctions validen les params AVANT appel reseau.

export const getAdminArtistsList = () => api.get('/admin/artists-list');

export const getAdminArtistDetail = (slug) => {
  if (!slug) throw new Error('getAdminArtistDetail: slug requis');
  return api.get(`/admin/artists-detail/${encodeURIComponent(slug)}`);
};

export const updateAdminArtistProfile = (slug, fields) => {
  if (!slug) throw new Error('updateAdminArtistProfile: slug requis');
  if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
    throw new Error('updateAdminArtistProfile: fields[] vide');
  }
  return api.put(`/admin/artists-profile/${encodeURIComponent(slug)}`, fields);
};

export const updateAdminArtistItem = (slug, itemId, { category = 'prints', ...patch }) => {
  if (!slug || !itemId) throw new Error('updateAdminArtistItem: slug et itemId requis');
  if (Object.keys(patch).length === 0) {
    throw new Error('updateAdminArtistItem: aucun champ a modifier');
  }
  return api.put(`/admin/artists-item/${encodeURIComponent(slug)}/${encodeURIComponent(itemId)}`, {
    category,
    ...patch,
  });
};

export const deleteAdminArtistItem = (slug, itemId, category = 'prints') => {
  if (!slug || !itemId) throw new Error('deleteAdminArtistItem: slug et itemId requis');
  return api.delete(`/admin/artists-item/${encodeURIComponent(slug)}/${encodeURIComponent(itemId)}`, {
    params: { category },
  });
};

/**
 * Active une vente privee sur une oeuvre en un seul appel :
 *   - patch artist.prints[itemId] avec private=true + clientEmail + basePrice + allowCustomPrice
 *   - genere un privateToken cryptographique si absent
 *   - envoie le courriel tutoriel au client + notif admin
 *
 * Utilise par AdminArtistManager / ActivatePrivateSaleModal.
 *
 * @param {string} slug - artist slug
 * @param {string} itemId - print/sticker id
 * @param {object} payload
 * @param {string} payload.clientEmail - email du client acheteur (valide serveur-side)
 * @param {number} payload.basePrice   - prix minimum en dollars (> 0)
 * @param {boolean} [payload.allowCustomPrice=false] - si true, le client peut payer plus
 * @param {'prints'|'stickers'} [payload.category='prints']
 * @returns Promise<{ data: { success, data: { token, clientLink, emailSent, ... } } }>
 */
export const activatePrivateSale = (slug, itemId, payload) => {
  if (!slug || !itemId) throw new Error('activatePrivateSale: slug et itemId requis');
  if (!payload?.clientEmail) throw new Error('activatePrivateSale: clientEmail requis');
  if (!Number.isFinite(payload.basePrice) || payload.basePrice <= 0) {
    throw new Error('activatePrivateSale: basePrice invalide');
  }
  return api.post(
    `/admin/artists-item/${encodeURIComponent(slug)}/${encodeURIComponent(itemId)}/private-sale`,
    {
      clientEmail: String(payload.clientEmail).trim().toLowerCase(),
      basePrice: Number(payload.basePrice),
      allowCustomPrice: !!payload.allowCustomPrice,
      category: payload.category === 'stickers' ? 'stickers' : 'prints',
    },
  );
};

// --- Commandes ---
export const getOrders = (params) => api.get('/orders/admin', { params });
export const getOrderStats = () => api.get('/orders/stats');
// MONEY-BOARD (Phase 5) : KPIs financiers + leads pour le tableau de bord
// admin. Optionnel : { month: 'YYYY-MM' } pour piloter le mois courant
// (ex: navigation historique). Defaut backend = mois courant America/Toronto.
export const getAdminMoneyBoard = (params) => api.get('/admin/stats', { params });
// KANBAN PRODUCTION (Phase 7A) : update du sous-statut production sans
// toucher au status global. Backend : PUT /orders/:documentId/production-stage
// (auth admin). Stages : files_prep / printing / cutting / packaging.
export const updateOrderProductionStage = (documentId, productionStage) =>
  api.put(`/orders/${documentId}/production-stage`, { productionStage });
/**
 * Changement de statut d'une commande.
 * @param {string} documentId
 * @param {string} status - enum backend ('pending', 'paid', 'processing', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded')
 * @param {object} [opts]
 * @param {boolean} [opts.sendEmail=false] - true = envoie les courriels lies au nouveau statut
 *   (confirmation si paid, demande temoignage si delivered). false = mise a jour silencieuse.
 *   Defaut false pour que le comportement reste "silencieux" sans intervention explicite admin.
 * @param {string} [opts.invoiceNumber] - optionnel, override du numero de facture
 * @param {boolean} [opts.autoInvoice] - optionnel, auto-genere un numero MM-AAAA-NNNN quand passe a paid
 */
export const updateOrderStatus = (documentId, status, opts = {}) => {
  const payload = { status };
  if (typeof opts.sendEmail === 'boolean') payload.sendEmail = opts.sendEmail;
  if (opts.invoiceNumber) payload.invoiceNumber = opts.invoiceNumber;
  if (typeof opts.autoInvoice === 'boolean') payload.autoInvoice = opts.autoInvoice;
  return api.put(`/orders/${documentId}/status`, payload);
};
export const updateOrderNotes = (documentId, notes) => api.put(`/orders/${documentId}/notes`, { notes });
export const updateOrderTracking = (documentId, trackingNumber, carrier) => api.put(`/orders/${documentId}/tracking`, { trackingNumber, carrier });

/**
 * Interroge le provider de tracking (mock intelligent / 17Track / Shippo).
 * Retourne { status, statusLabel, events[], delivered, deliveredAt, suggestStatusChange }.
 */
export const getOrderTracking = (documentId) => {
  if (!documentId) throw new Error('getOrderTracking: documentId requis');
  return api.get(`/orders/${documentId}/tracking`);
};
export const deleteOrder = (documentId) => api.delete(`/orders/${documentId}`);

/**
 * Regenere un lien Stripe pour une commande pending/draft dont le lien
 * initial n'a pas pu etre genere (Stripe down, race condition, deploy
 * mid-flight). Cas reel : commande Don Mescal - Cosmovision (195,46$)
 * restee sans paymentLink suite a une violation unique sur companyName.
 *
 * Cote backend (admin-only via requireAdminAuth) : voir
 * backend/src/api/order/controllers/order.ts -> regenerateStripeLink
 *
 * Comportement :
 *   - Refuse si la commande est deja en statut terminal (paid/processing/etc.)
 *     -> retourne HTTP 409 + code: 'INVALID_STATUS_FOR_REGEN'
 *   - Cree un nouveau Payment Link Stripe (l'ancien reste valide chez Stripe
 *     mais l'invoice ne pointe que sur le DERNIER lien)
 *   - Si pas d'invoice liee, en cree une minimale a la volee
 *
 * @param {string} documentId - ID Strapi de la commande
 * @returns Promise<{ data: { success, paymentUrl, invoiceNumber, amount, message } }>
 */
export const regenerateStripeLink = (documentId) => {
  if (!documentId) throw new Error('regenerateStripeLink: documentId requis');
  return api.post(`/orders/${encodeURIComponent(documentId)}/regenerate-stripe-link`);
};

/**
 * Envoyer la facture par courriel au client avec lien Stripe + PDF.
 * Validation pre-envoi stricte : throw AVANT l'appel reseau si donnees critiques absentes.
 * @param {string} documentId - ID Strapi de la commande
 * @param {object} options
 * @param {string} [options.pdfBase64] - PDF genere cote client (sans prefix data:...)
 * @param {string} [options.pdfFilename]
 * @param {string} [options.customerEmail] - Override email (defaut = email de l'order)
 */
export const sendOrderInvoice = (documentId, { pdfBase64, pdfFilename, customerEmail } = {}) => {
  if (!documentId) throw new Error('sendOrderInvoice: documentId requis');
  return api.post(`/orders/${documentId}/send-invoice`, {
    pdfBase64: pdfBase64 || undefined,
    pdfFilename: pdfFilename || undefined,
    customerEmail: customerEmail || undefined,
  });
};

// --- Ventes privees (prints artistes) ---
export const getPrivateSales = () => api.get('/artists-private-sales');
export const deletePrivateSale = (artistSlug, printId) =>
  api.post('/artists-private-sales/delete', { artistSlug, printId });
export const resendPrivateSaleEmail = (artistSlug, printId) =>
  api.post('/artists-private-sales/resend', { artistSlug, printId });

// --- Messages contact ---
export const getContactSubmissions = (params) => api.get('/contact-submissions/admin', { params });
export const updateContactStatus = (documentId, status, notes) => api.put(`/contact-submissions/${documentId}/status`, { status, notes });
export const replyToContact = (documentId, replyMessage, subject) => api.post(`/contact-submissions/${documentId}/reply`, { replyMessage, subject });
export const deleteContact = (documentId) => api.delete(`/contact-submissions/${documentId}`);

// --- Soumissions artistes ---
export const getArtistSubmissions = (params) => api.get('/artist-submissions/admin', { params });
export const updateArtistStatus = (documentId, status, notes) => api.put(`/artist-submissions/${documentId}/status`, { status, notes });
export const deleteArtistSubmission = (documentId) => api.delete(`/artist-submissions/${documentId}`);

// --- Clients ---
export const getClients = (params) => api.get('/clients/admin', { params });

// --- Depenses ---
export const getExpenses = (params) => api.get('/expenses/admin', { params });
export const createExpense = (data) => api.post('/expenses/create', data);
export const updateExpense = (documentId, data) => api.put(`/expenses/${documentId}`, data);
export const deleteExpense = (documentId) => api.delete(`/expenses/${documentId}`);
export const getExpenseSummary = (year) => api.get(`/expenses/summary/${year}`);

// --- Commissions artistes ---
export const getCommissions = () => api.get('/orders/commissions');
export const createArtistPayment = (data) => api.post('/artist-payments/create', data);

// --- Temoignages ---
export const getTestimonials = (params) => api.get('/testimonials/admin', { params });
export const approveTestimonial = (documentId, approved, featured) => api.put(`/testimonials/${documentId}/approve`, { approved, featured });
export const deleteTestimonial = (documentId) => api.delete(`/testimonials/${documentId}`);
export const generateTestimonialLink = (data) => api.post('/testimonials/generate-link', data);

// --- Analytics ---
export const getAnalytics = (period = 30) => api.get('/analytics/stats', { params: { period } });
export const getArtistAnalytics = (slug, period = 30) => api.get(`/analytics/artist/${slug}`, { params: { period } });

// --- Factures ---
export const getInvoices = () => api.get('/invoices', { params: { sort: 'date:desc', pagination: { pageSize: 100 } } });
export const createInvoice = (data) => api.post('/invoices', { data });
export const updateInvoice = (documentId, data) => api.put(`/invoices/${documentId}`, { data });
export const deleteInvoice = (documentId) => api.delete(`/invoices/${documentId}`);
export const uploadInvoicePDF = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/invoices/upload-pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
// Sync facture sortante -> inventaire (delta entre oldItems et newItems)
export const syncInvoiceToInventory = (oldItems, newItems) =>
  api.post('/inventory-items/sync-outgoing-invoice', { oldItems, newItems });
