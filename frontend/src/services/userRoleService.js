import api from './api';

// Liste tous les roles (admin)
export const getUserRoles = () => api.get('/user-roles/list');

// Role d'un user par email
export const getUserRoleByEmail = (email) => api.get('/user-roles/by-email', { params: { email } });

// Definir le role d'un user
export const setUserRole = (email, role, slug, supabaseUserId, displayName) =>
  api.put('/user-roles/set', {
    email, role, supabaseUserId, displayName,
    artistSlug: role === 'artist' ? slug : null,
  });

// Supprimer un role (remet en user)
export const deleteUserRole = (documentId) => api.delete(`/user-roles/${documentId}`);

// Renvoyer le courriel de bienvenue artiste (admin). Le back AWAIT l'envoi et
// renvoie { ok: true } ou une erreur (400 si pas artiste, 502 si Resend echoue).
export const resendArtistWelcome = (email) => api.post('/user-roles/resend-welcome', { email });
