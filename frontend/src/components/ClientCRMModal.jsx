import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Star, Tag, History, Loader2, AlertTriangle, Copy, CheckCircle, DollarSign, ShoppingBag,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getCrmClient, createCrmPromo } from '../services/adminService';

/**
 * ClientCRMModal
 * --------------
 * Fiche CRM "Super Client" (Phase 7C). S'ouvre depuis le clic sur le nom
 * d'un client dans la liste des commandes admin. Aggrege en live :
 *   - LTV (Lifetime Value, total depense hors cancelled/refunded)
 *   - Nombre de commandes
 *   - Historique court (status / date / total)
 * Permet aussi de generer un code promo Stripe VIP -15% (one-time) en 1
 * clic, copiable.
 *
 * Props :
 *   - email      : string, requis. Le modal fetch a l'ouverture.
 *   - onClose()
 */

const STATUS_COLORS = {
  draft: 'text-gray-400',
  pending: 'text-yellow-400',
  paid: 'text-green-400',
  processing: 'text-blue-400',
  ready: 'text-cyan-400',
  shipped: 'text-purple-400',
  delivered: 'text-emerald-400',
  cancelled: 'text-red-400',
  refunded: 'text-orange-400',
};

// FIX-I18N (3 mai 2026) : ortografies FR avec accents corrects + libelles
// metiers (Pret/A remettre, Livre/Remis) alignes sur ORDER_STATUS dans
// AdminOrders.jsx pour coherence cross-composants.
const STATUS_LABELS = {
  draft: { fr: 'Brouillon', en: 'Draft', es: 'Borrador' },
  pending: { fr: 'En attente', en: 'Pending', es: 'Pendiente' },
  paid: { fr: 'Payé / En production', en: 'Paid / In production', es: 'Pagado / En producción' },
  processing: { fr: 'En production', en: 'Processing', es: 'En producción' },
  ready: { fr: 'Prêt / À remettre', en: 'Ready / To hand over', es: 'Listo / Por entregar' },
  shipped: { fr: 'Expédié', en: 'Shipped', es: 'Enviado' },
  delivered: { fr: 'Livré / Remis', en: 'Delivered / Handed over', es: 'Entregado' },
  cancelled: { fr: 'Annulé', en: 'Cancelled', es: 'Cancelado' },
  refunded: { fr: 'Remboursé', en: 'Refunded', es: 'Reembolsado' },
};

function ClientCRMModal({ email, onClose }) {
  const { tx, lang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promoState, setPromoState] = useState('idle'); // idle | loading | success | error
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch CRM data on mount + when email changes
  useEffect(() => {
    if (!email) return;
    setLoading(true);
    setError('');
    getCrmClient(email)
      .then(({ data: payload }) => setData(payload))
      .catch((err) => setError(err?.response?.data?.error?.message || err?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [email]);

  // Echap pour fermer
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCreatePromo = async () => {
    if (promoState === 'loading' || promoState === 'success') return;
    setPromoState('loading');
    setPromoError('');
    try {
      const { data: payload } = await createCrmPromo(email);
      setPromoCode(payload?.code || '');
      setPromoState('success');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || tx({
        fr: 'Echec generation du code promo Stripe.',
        en: 'Failed to generate Stripe promo code.',
        es: 'Error al generar el codigo promo.',
      });
      setPromoError(msg);
      setPromoState('error');
    }
  };

  const handleCopy = async () => {
    if (!promoCode) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(promoCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* noop */ }
  };

  const formatMoney = (cents) => {
    const v = (Number(cents) || 0) / 100;
    return v.toLocaleString(lang === 'fr' ? 'fr-CA' : lang === 'es' ? 'es-ES' : 'en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(
        lang === 'fr' ? 'fr-CA' : lang === 'es' ? 'es-ES' : 'en-CA',
        { day: 'numeric', month: 'short', year: '2-digit' },
      );
    } catch {
      return '-';
    }
  };

  const displayName = data?.companyName || data?.name || email;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl my-8 rounded-2xl border shadow-2xl overflow-hidden"
          style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--bg-input-border)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-6 py-5 border-b" style={{ borderColor: 'var(--bg-input-border)' }}>
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-accent" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-grey-muted font-semibold mb-0.5">
                  {tx({ fr: 'Fiche client', en: 'Client profile', es: 'Ficha cliente' })}
                </p>
                <h3 className="text-heading font-heading font-bold text-base leading-tight truncate">
                  {displayName}
                </h3>
                {data?.companyName && data?.name && data.companyName !== data.name && (
                  <p className="text-[11px] text-grey-muted mt-0.5 truncate">{data.name}</p>
                )}
                <p className="text-[12px] text-grey-muted truncate mt-0.5">{email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-grey-muted hover:text-heading transition-colors flex-shrink-0 outline-none focus:outline-none focus:ring-0"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={22} className="animate-spin text-accent" />
              </div>
            )}

            {error && !loading && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-[13px] text-red-400">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {!loading && !error && data && (
              <>
                {/* Stats : 2 cartes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4 ring-1 ring-green-400/20 card-bg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center">
                        <DollarSign size={14} className="text-green-400" />
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-grey-muted font-semibold">
                        {tx({ fr: 'Total depense (LTV)', en: 'Total spent (LTV)', es: 'Total gastado (LTV)' })}
                      </span>
                    </div>
                    <p className="text-2xl md:text-3xl font-heading font-bold text-heading leading-none tracking-tight">
                      {formatMoney(data.ltv)} $
                    </p>
                    <p className="text-[10px] text-grey-muted mt-1.5">
                      {tx({ fr: 'Hors annulees / remboursees', en: 'Excluding cancelled / refunded', es: 'Excluyendo cancelados / reembolsados' })}
                    </p>
                  </div>

                  <div className="rounded-xl p-4 ring-1 ring-sky-400/20 card-bg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-sky-400/10 flex items-center justify-center">
                        <ShoppingBag size={14} className="text-sky-400" />
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-grey-muted font-semibold">
                        {tx({ fr: 'Commandes totales', en: 'Total orders', es: 'Pedidos totales' })}
                      </span>
                    </div>
                    <p className="text-2xl md:text-3xl font-heading font-bold text-heading leading-none tracking-tight">
                      {data.orderCount}
                    </p>
                    <p className="text-[10px] text-grey-muted mt-1.5">
                      {tx({ fr: 'Toutes commandes confondues', en: 'All orders combined', es: 'Todos los pedidos' })}
                    </p>
                  </div>
                </div>

                {/* VIP block */}
                <div className="rounded-xl p-4 bg-accent/5 ring-1 ring-accent/25">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                      <Star size={16} className="text-accent" />
                    </span>
                    <div className="flex-1">
                      <p className="text-heading font-heading font-bold text-sm">
                        {tx({ fr: 'Geste VIP', en: 'VIP gesture', es: 'Gesto VIP' })}
                      </p>
                      <p className="text-grey-muted text-xs mt-0.5 leading-relaxed">
                        {tx({
                          fr: 'Genere un code promo Stripe -15% a usage unique pour ce client.',
                          en: 'Generate a one-time Stripe -15% promo code for this client.',
                          es: 'Genera un codigo promo Stripe -15% de un solo uso.',
                        })}
                      </p>
                    </div>
                  </div>

                  {promoState === 'success' ? (
                    <div className="rounded-lg bg-black/30 px-3 py-2.5 flex items-center gap-3 border border-green-400/30">
                      <Tag size={14} className="text-green-400 flex-shrink-0" />
                      <span className="font-mono text-base md:text-lg font-bold text-heading flex-1 truncate" title={promoCode}>
                        {promoCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 outline-none focus:outline-none focus:ring-0 ${
                          copied
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/10 text-heading hover:bg-white/20'
                        }`}
                      >
                        {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
                        {copied
                          ? tx({ fr: 'Copie', en: 'Copied', es: 'Copiado' })
                          : tx({ fr: 'Copier', en: 'Copy', es: 'Copiar' })}
                      </button>
                    </div>
                  ) : (
                    <>
                      {promoState === 'error' && promoError && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[12px] text-red-400 mb-2">
                          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{promoError}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleCreatePromo}
                        disabled={promoState === 'loading'}
                        className="w-full py-2.5 rounded-lg bg-accent text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 outline-none focus:outline-none focus:ring-0"
                      >
                        {promoState === 'loading' ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            {tx({ fr: 'Generation...', en: 'Generating...', es: 'Generando...' })}
                          </>
                        ) : (
                          <>
                            <Star size={14} />
                            {tx({ fr: 'Generer un code VIP -15%', en: 'Generate VIP -15% code', es: 'Generar codigo VIP -15%' })}
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Historique */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <History size={14} className="text-grey-muted" />
                    <span className="text-[11px] uppercase tracking-wider text-grey-muted font-semibold">
                      {tx({ fr: 'Historique des commandes', en: 'Order history', es: 'Historial de pedidos' })}
                    </span>
                  </div>
                  {data.orders.length === 0 ? (
                    <p className="text-grey-muted text-xs italic py-3 text-center">
                      {tx({ fr: 'Aucune commande pour ce client.', en: 'No order yet for this client.', es: 'Aun ningun pedido.' })}
                    </p>
                  ) : (
                    <div className="rounded-lg border max-h-64 overflow-y-auto" style={{ borderColor: 'var(--bg-input-border)' }}>
                      <table className="w-full text-[12px]">
                        <thead className="sticky top-0 bg-black/40 backdrop-blur-sm">
                          <tr className="text-grey-muted">
                            <th className="text-left px-3 py-2 font-semibold">{tx({ fr: 'Reference', en: 'Reference', es: 'Referencia' })}</th>
                            <th className="text-left px-3 py-2 font-semibold">{tx({ fr: 'Statut', en: 'Status', es: 'Estado' })}</th>
                            <th className="text-left px-3 py-2 font-semibold">{tx({ fr: 'Date', en: 'Date', es: 'Fecha' })}</th>
                            <th className="text-right px-3 py-2 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.orders.map((o) => (
                            <tr key={o.documentId} className="border-t" style={{ borderColor: 'var(--bg-input-border)' }}>
                              <td className="px-3 py-2 font-mono text-heading">#{o.orderRef}</td>
                              <td className={`px-3 py-2 font-semibold ${STATUS_COLORS[o.status] || 'text-grey-muted'}`}>
                                {tx(STATUS_LABELS[o.status] || { fr: o.status, en: o.status, es: o.status })}
                              </td>
                              <td className="px-3 py-2 text-grey-muted">{formatDate(o.createdAt)}</td>
                              <td className="px-3 py-2 text-right text-heading font-mono">
                                {formatMoney(o.total)} $
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--bg-input-border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors hover:brightness-110 outline-none focus:outline-none focus:ring-0"
              style={{ background: 'var(--bg-glass)', color: 'var(--color-grey-muted)' }}
            >
              {tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ClientCRMModal;
