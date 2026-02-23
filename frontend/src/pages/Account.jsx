import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Package, LogOut, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getMyOrders } from '../services/orderService';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  processing: 'bg-blue-500/20 text-blue-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  refunded: 'bg-grey-500/20 text-grey-400',
};

function Account() {
  const { t, lang } = useLang();
  const { user, signOut } = useAuth();
  const isFr = lang === 'fr';

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    async function fetchOrders() {
      try {
        const data = await getMyOrders(user.id);
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setOrdersError(true);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }
    fetchOrders();
    return () => { cancelled = true; };
  }, [user?.id]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: isFr ? 'En attente' : 'Pending',
      paid: isFr ? 'Payé' : 'Paid',
      processing: isFr ? 'En traitement' : 'Processing',
      shipped: isFr ? 'Expédié' : 'Shipped',
      delivered: isFr ? 'Livré' : 'Delivered',
      cancelled: isFr ? 'Annulé' : 'Cancelled',
      refunded: isFr ? 'Remboursé' : 'Refunded',
    };
    return labels[status] || status;
  };

  return (
    <>
      <SEO title={`${t('account.title')} - Massive Medias`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-4xl font-heading font-bold text-heading">{t('account.title')}</h1>
              <button onClick={signOut} className="flex items-center gap-2 text-grey-muted hover:text-red-400 transition-colors text-sm">
                <LogOut size={16} />
                {t('auth.logout')}
              </button>
            </div>

            {/* Profile */}
            <div className="rounded-2xl border border-purple-main/30 p-8 mb-8" style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}>
              <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
                <User size={22} className="text-magenta" />
                {t('account.profile')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-grey-light">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-grey-muted" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User size={16} className="text-grey-muted" />
                  <span>{user?.user_metadata?.full_name || '—'}</span>
                </div>
              </div>
            </div>

            {/* Orders */}
            <div className="rounded-2xl border border-purple-main/30 p-8" style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}>
              <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
                <Package size={22} className="text-magenta" />
                {t('account.orders')}
              </h2>

              {ordersLoading ? (
                <div className="flex items-center gap-3 text-grey-muted">
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isFr ? 'Chargement...' : 'Loading...'}</span>
                </div>
              ) : ordersError ? (
                <p className="text-grey-muted">{isFr ? 'Erreur au chargement des commandes.' : 'Error loading orders.'}</p>
              ) : orders.length === 0 ? (
                <p className="text-grey-muted">{t('account.noOrders')}</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.documentId || order.id}
                      className="p-4 rounded-xl"
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--bg-card-border)' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-heading font-semibold text-sm">
                            {formatDate(order.createdAt)}
                          </p>
                          <p className="text-grey-muted text-xs">
                            {order.items?.length || 0} {(order.items?.length || 0) > 1 ? (isFr ? 'articles' : 'items') : (isFr ? 'article' : 'item')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-grey-500/20 text-grey-400'}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          <span className="text-heading font-bold">
                            {((order.total || 0) / 100).toFixed(2)}$
                          </span>
                        </div>
                      </div>
                      {order.items && (
                        <div className="text-grey-muted text-xs space-y-1">
                          {order.items.map((item, i) => (
                            <p key={i}>{item.productName} — {item.finish}, {item.quantity}x</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Account;
