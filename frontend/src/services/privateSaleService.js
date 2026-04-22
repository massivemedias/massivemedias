import api from './api';

/**
 * Flux public "vente privee" (Pay What You Want ou prix fixe).
 * Le token dans l'URL EST le secret - pas d'auth requise.
 */

// Retourne les infos d'affichage d'une vente privee (artwork + prix + allow custom).
// 404 si token invalide/expire.
export const getPrivateSaleByToken = (token) => {
  if (!token) throw new Error('getPrivateSaleByToken: token requis');
  return api.get(`/artists-private-sales/token/${encodeURIComponent(token)}`);
};

// Cree une session Stripe Checkout pour finaliser l'achat.
// Si allowCustomPrice=true, passer `amount` en dollars (>= basePrice).
// Si allowCustomPrice=false, amount est ignore (backend force basePrice).
// Retourne { sessionUrl, sessionId, amount }.
export const createPrivateSaleCheckout = (token, amount) => {
  if (!token) throw new Error('createPrivateSaleCheckout: token requis');
  const body = Number.isFinite(amount) && amount > 0 ? { amount } : {};
  return api.post(`/artists-private-sales/token/${encodeURIComponent(token)}/checkout`, body);
};
