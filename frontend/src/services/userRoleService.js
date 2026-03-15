import api from './api';

// Liste tous les roles (admin)
export const getUserRoles = () => api.get('/user-roles/list');

// Role d'un user par email
export const getUserRoleByEmail = (email) => api.get('/user-roles/by-email', { params: { email } });

// Definir le role d'un user
export const setUserRole = (email, role, artistSlug, supabaseUserId, displayName) =>
  api.put('/user-roles/set', { email, role, artistSlug, supabaseUserId, displayName });

// Supprimer un role (remet en user)
export const deleteUserRole = (documentId) => api.delete(`/user-roles/${documentId}`);
