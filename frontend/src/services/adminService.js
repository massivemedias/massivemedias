import api from './api';

// --- Commandes ---
export const getOrders = (params) => api.get('/orders/admin', { params });
export const getOrderStats = () => api.get('/orders/stats');
export const updateOrderStatus = (documentId, status) => api.put(`/orders/${documentId}/status`, { status });
export const updateOrderNotes = (documentId, notes) => api.put(`/orders/${documentId}/notes`, { notes });
export const updateOrderTracking = (documentId, trackingNumber, carrier) => api.put(`/orders/${documentId}/tracking`, { trackingNumber, carrier });
export const deleteOrder = (documentId) => api.delete(`/orders/${documentId}`);

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
