import api from './api';

// --- Messages artiste ---
export const sendArtistMessage = (data) => api.post('/artist-messages/send', data);
export const getMyMessages = (email) => api.get('/artist-messages/my-messages', { params: { email } });
export const getArtistMessagesAdmin = () => api.get('/artist-messages/admin');
export const replyArtistMessage = (documentId, adminReply) => api.put(`/artist-messages/${documentId}/reply`, { adminReply });
export const updateArtistMessageStatus = (documentId, status) => api.put(`/artist-messages/${documentId}/status`, { status });

// --- Retraits PayPal ---
export const createWithdrawal = (data) => api.post('/withdrawal-requests/create', data);
export const getMyWithdrawals = (email) => api.get('/withdrawal-requests/my-requests', { params: { email } });
export const getWithdrawalsAdmin = () => api.get('/withdrawal-requests/admin');
export const processWithdrawal = (documentId, status, adminNotes, paypalTransactionId) =>
  api.put(`/withdrawal-requests/${documentId}/process`, { status, adminNotes, paypalTransactionId });
