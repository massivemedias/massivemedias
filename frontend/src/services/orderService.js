import api from './api';

export async function createPaymentIntent({ items, customerEmail, customerName, customerPhone, shippingAddress, subtotal, artistDiscount, promoCode, promoDiscountPercent, shipping, taxes, orderTotal, designReady, notes, supabaseUserId }) {
  const { data } = await api.post('/orders/create-payment-intent', {
    items,
    customerEmail,
    customerName,
    customerPhone,
    shippingAddress,
    subtotal,
    artistDiscount,
    promoCode,
    promoDiscountPercent,
    shipping,
    taxes,
    orderTotal,
    designReady,
    notes,
    supabaseUserId,
  });
  return data;
}

export async function validatePromoCode(code) {
  const { data } = await api.post('/promo-codes/validate', { code });
  return data;
}

export async function getMyOrders(supabaseUserId, email) {
  // Envoie aussi l'email pour rattraper les commandes invitees / manuelles
  // creees avant que le client s'inscrive au portail.
  const params = {};
  if (supabaseUserId) params.supabaseUserId = supabaseUserId;
  if (email) params.email = email;
  const { data } = await api.get('/orders/my-orders', { params });
  return data;
}

export async function getOrderByPaymentIntent(paymentIntentId) {
  const { data } = await api.get(`/orders/by-payment-intent/${paymentIntentId}`);
  return data;
}

export async function linkOrdersByEmail({ email, supabaseUserId }) {
  const { data } = await api.post('/orders/link-by-email', { email, supabaseUserId });
  return data;
}
