import api from './api';

// AUDIT-01 (avril 2026) : validations pre-envoi strictes au niveau du service.
// Si un caller oublie un champ critique, on throw AVANT l'appel reseau plutot
// que de laisser le backend bricoler ou silencieusement creer une demande vide.

function requireFields(obj, fields, prefix) {
  if (!obj || typeof obj !== 'object') {
    throw new Error(`${prefix}: payload manquant`);
  }
  for (const f of fields) {
    const v = obj[f];
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      throw new Error(`${prefix}: champ requis manquant "${f}"`);
    }
  }
}

function validateChangeData(requestType, changeData) {
  if (!changeData || typeof changeData !== 'object') {
    throw new Error(`changeData manquant pour ${requestType}`);
  }
  switch (requestType) {
    case 'add-prints':
    case 'add-stickers':
    case 'add-merch': {
      const images = changeData.images;
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error(`${requestType}: au moins une image requise`);
      }
      images.forEach((img, i) => {
        if (!img?.originalUrl && !img?.url && !img?.driveViewLink) {
          throw new Error(`${requestType}: image[${i}] sans URL source`);
        }
      });
      break;
    }
    case 'remove-prints':
    case 'remove-stickers':
    case 'remove-merch': {
      const items = Array.isArray(changeData.items) ? changeData.items : [];
      const ids = Array.isArray(changeData.itemIds) ? changeData.itemIds : [];
      if (items.length === 0 && ids.length === 0) {
        throw new Error(`${requestType}: aucun item a supprimer`);
      }
      break;
    }
    case 'rename-item':
      requireFields(changeData, ['itemId', 'newTitle', 'field'], requestType);
      break;
    case 'mark-unique':
    case 'unmark-unique':
      requireFields(changeData, ['itemId'], requestType);
      break;
    default:
      // Types profil : on laisse passer, valide par le backend
      break;
  }
}

// --- Messages artiste ---
export const sendArtistMessage = (data) => {
  requireFields(data, ['email', 'subject', 'message'], 'sendArtistMessage');
  return api.post('/artist-messages/send', data);
};
export const getMyMessages = (email) => api.get('/artist-messages/my-messages', { params: { email } });
export const getArtistMessagesAdmin = () => api.get('/artist-messages/admin');
export const replyArtistMessage = (documentId, adminReply) => {
  if (!documentId) throw new Error('replyArtistMessage: documentId requis');
  if (!adminReply || !String(adminReply).trim()) throw new Error('replyArtistMessage: reponse vide');
  return api.put(`/artist-messages/${documentId}/reply`, { adminReply });
};
export const updateArtistMessageStatus = (documentId, status) => api.put(`/artist-messages/${documentId}/status`, { status });
export const deleteArtistMessage = (documentId) => api.delete(`/artist-messages/${documentId}`);

// --- Retraits PayPal ---
export const createWithdrawal = (data) => {
  requireFields(data, ['email', 'paypalEmail', 'amount'], 'createWithdrawal');
  const amt = Number(data.amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    throw new Error('createWithdrawal: montant doit etre > 0');
  }
  return api.post('/withdrawal-requests/create', data);
};
export const getMyWithdrawals = (email) => api.get('/withdrawal-requests/my-requests', { params: { email } });
export const getWithdrawalsAdmin = () => api.get('/withdrawal-requests/admin');
export const processWithdrawal = (documentId, status, adminNotes, paypalTransactionId) => {
  if (!documentId) throw new Error('processWithdrawal: documentId requis');
  if (!['processing', 'completed', 'rejected'].includes(status)) {
    throw new Error(`processWithdrawal: status invalide "${status}"`);
  }
  return api.put(`/withdrawal-requests/${documentId}/process`, { status, adminNotes, paypalTransactionId });
};

// --- Edit requests artiste ---
export const createEditRequest = (data) => {
  requireFields(data, ['email', 'requestType', 'changeData'], 'createEditRequest');
  validateChangeData(data.requestType, data.changeData);
  return api.post('/artist-edit-requests/create', data);
};
export const getMyEditRequests = (email) => api.get('/artist-edit-requests/my-requests', { params: { email } });
export const getEditRequestsAdmin = () => api.get('/artist-edit-requests/admin');
export const approveEditRequest = (documentId) => {
  if (!documentId) throw new Error('approveEditRequest: documentId requis');
  return api.put(`/artist-edit-requests/${documentId}/approve`);
};
export const rejectEditRequest = (documentId, adminNotes) => {
  if (!documentId) throw new Error('rejectEditRequest: documentId requis');
  return api.put(`/artist-edit-requests/${documentId}/reject`, { adminNotes });
};
