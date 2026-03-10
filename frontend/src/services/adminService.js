import api from './api';

// --- Commandes ---
export const getOrders = (params) => api.get('/orders/admin', { params });
export const getOrderStats = () => api.get('/orders/stats');
export const updateOrderStatus = (documentId, status) => api.put(`/orders/${documentId}/status`, { status });
export const updateOrderNotes = (documentId, notes) => api.put(`/orders/${documentId}/notes`, { notes });

// --- Messages contact ---
export const getContactSubmissions = (params) => api.get('/contact-submissions/admin', { params });
export const updateContactStatus = (documentId, status, notes) => api.put(`/contact-submissions/${documentId}/status`, { status, notes });

// --- Soumissions artistes ---
export const getArtistSubmissions = (params) => api.get('/artist-submissions/admin', { params });
export const updateArtistStatus = (documentId, status, notes) => api.put(`/artist-submissions/${documentId}/status`, { status, notes });

// --- Clients ---
export const getClients = (params) => api.get('/clients/admin', { params });

// --- Depenses ---
export const getExpenses = (params) => api.get('/expenses/admin', { params });
export const createExpense = (data) => api.post('/expenses/create', data);

// --- Commissions artistes ---
export const getCommissions = () => api.get('/orders/commissions');
export const createArtistPayment = (data) => api.post('/artist-payments/create', data);
