import api from './api';

export async function createPaymentIntent({ items, customerEmail, customerName, customerPhone, designReady, notes, supabaseUserId }) {
  const { data } = await api.post('/orders/create-payment-intent', {
    items,
    customerEmail,
    customerName,
    customerPhone,
    designReady,
    notes,
    supabaseUserId,
  });
  return data;
}

export async function getMyOrders(supabaseUserId) {
  const { data } = await api.get('/orders/my-orders', {
    params: { supabaseUserId },
  });
  return data;
}
