import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, CreditCard, Hammer, MapPin, Truck, CheckCircle, XCircle,
  Loader2, ArrowRight, AlertCircle, Mail, RotateCcw, Sparkles,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import SEO from '../components/SEO';
import api from '../services/api';

/**
 * Tracking.jsx - Portail public de suivi de commande.
 *
 * FIX-TRACKING-PORTAL (28 avril 2026) - cf brief Phase 3.
 *
 * Route : /suivi
 * - Form public avec 2 inputs (orderId + email).
 * - Si query params `?id=X&email=Y` presents, le form est pre-rempli ET
 *   l'auto-submit s'execute pour gagner un click au client (pattern utilise
 *   par les emails post-paiement qui inserent le lien parametre).
 * - Backend : GET /orders/track?orderId=X&email=Y (controller order.ts).
 * - Securite : double cle orderId+email matchant. Reponse minimale (status,
 *   createdAt, updatedAt). Pas de prix, pas d'items, pas d'adresse.
 *
 * Timeline visuelle a 5 etapes mappees sur les statuts Strapi :
 *   1. Reception (draft / pending) - "On a recu ta commande"
 *   2. Paiement confirme (paid) - "Paiement valide"
 *   3. En production (processing) - "On fabrique"
 *   4. Pret / Expedie (ready / shipped) - "Pret a recuperer ou en route"
 *   5. Livre (delivered) - "C'est arrive !"
 *
 * Statuts terminaux negatifs (cancelled / refunded) : timeline coupee + message
 * dedie. Le user voit clairement que la commande n'a pas suivi le chemin normal.
 */

// Map statut backend -> index de progression dans la timeline (1-5).
// Les statuts inconnus tombent a 0 (rien d'affiche, message generique).
const STATUS_PROGRESS = {
  draft: 1,
  pending: 1,
  paid: 2,
  processing: 3,
  ready: 4,
  shipped: 4,
  delivered: 5,
};

const NEGATIVE_STATUSES = new Set(['cancelled', 'refunded']);

// Etapes de la timeline. Chaque step a un id (mappe au progress), un label
// tri-langue, et une icone dediee. Les couleurs sont gerees au render selon
// l'etat (active / passe / a-venir).
const TIMELINE_STEPS = [
  {
    id: 1,
    icon: Package,
    label: { fr: 'Reçue', en: 'Received', es: 'Recibida' },
    desc: { fr: 'Ta commande est dans le système.', en: 'Your order is in our system.', es: 'Tu pedido está en el sistema.' },
  },
  {
    id: 2,
    icon: CreditCard,
    label: { fr: 'Payée', en: 'Paid', es: 'Pagada' },
    desc: { fr: 'Paiement validé, on prépare la production.', en: 'Payment confirmed, prepping production.', es: 'Pago confirmado.' },
  },
  {
    id: 3,
    icon: Hammer,
    label: { fr: 'En production', en: 'In production', es: 'En producción' },
    desc: { fr: 'On imprime, on découpe, on assemble.', en: 'Printing, cutting, assembling.', es: 'Imprimiendo, cortando, ensamblando.' },
  },
  {
    id: 4,
    icon: MapPin,
    label: { fr: 'Prête / Expédiée', en: 'Ready / Shipped', es: 'Lista / Enviada' },
    desc: { fr: 'Prête à récupérer ou colis en route.', en: 'Ready to pick up or in transit.', es: 'Lista para recoger o en tránsito.' },
  },
  {
    id: 5,
    icon: CheckCircle,
    label: { fr: 'Livrée', en: 'Delivered', es: 'Entregada' },
    desc: { fr: 'Entre tes mains. Bon usage !', en: 'In your hands. Enjoy!', es: '¡En tus manos!' },
  },
];

function Tracking() {
  const { tx, lang } = useLang();
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // REORDER (Phase 6) : etat dedie au bouton "Recommander a l'identique"
  // affiche uniquement si la commande est livree (cf TIMELINE et brief).
  // Trois etats UI :
  //   - idle    : bouton actif
  //   - loading : spinner pendant l'appel POST /orders/reorder
  //   - success : message vert + nouveau orderRef
  //   - error   : message rouge inline + bouton reactive
  const [reorderState, setReorderState] = useState('idle');
  const [reorderError, setReorderError] = useState('');
  const [reorderResult, setReorderResult] = useState(null);

  // UPSELL (Phase 7B) : etat de la carte d'offre "Order Bump". Visible
  // uniquement quand status pending/draft ET hasUpsell=false (drapeau
  // calcule par le backend dans trackOrder). Apres succes on refetch
  // l'order pour que l'UI reflete le nouveau total + le nouveau lien
  // Stripe et que la carte se cache automatiquement (hasUpsell devient
  // true).
  const [upsellState, setUpsellState] = useState('idle'); // idle | loading | error
  const [upsellError, setUpsellError] = useState('');

  // Auto-prefill + auto-submit si l'url contient ?id=X&email=Y (lien email).
  useEffect(() => {
    const idFromUrl = (searchParams.get('id') || '').trim();
    const emailFromUrl = (searchParams.get('email') || '').trim();
    if (idFromUrl) setOrderId(idFromUrl);
    if (emailFromUrl) setEmail(emailFromUrl);
    if (idFromUrl && emailFromUrl) {
      // Soumission automatique apres un court delai pour laisser le state se sync.
      const t = setTimeout(() => doLookup(idFromUrl, emailFromUrl), 100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLookup = async (idArg, emailArg) => {
    const id = String(idArg || orderId).trim();
    const em = String(emailArg || email).trim();
    if (!id || !em) {
      setError(tx({
        fr: 'Numéro de commande et courriel requis.',
        en: 'Order number and email are required.',
        es: 'Numero de pedido y correo requeridos.',
      }));
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.get('/orders/track', { params: { orderId: id, email: em } });
      setResult(data);
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.error?.code;
      if (status === 404 || code === 'NOT_FOUND') {
        setError(tx({
          fr: 'Aucune commande ne correspond à ce numéro et cette adresse courriel. Vérifiez que vous avez bien recopié le numéro reçu par courriel et que l\'adresse est celle que vous avez utilisée pour la commande.',
          en: 'No order matches this number and email. Double-check the number from your confirmation email and the address you used for the order.',
          es: 'Ningún pedido coincide. Verifica el número y el correo.',
        }));
      } else if (status === 400) {
        setError(err?.response?.data?.error?.message || tx({
          fr: 'Données invalides. Vérifiez le numéro et l\'adresse courriel.',
          en: 'Invalid data. Check the number and email.',
          es: 'Datos inválidos.',
        }));
      } else {
        setError(tx({
          fr: 'Erreur de connexion. Réessayez dans quelques secondes.',
          en: 'Connection error. Retry in a few seconds.',
          es: 'Error de conexión.',
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    doLookup();
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setOrderId('');
    setEmail('');
    setReorderState('idle');
    setReorderError('');
    setReorderResult(null);
    setUpsellState('idle');
    setUpsellError('');
  };

  // UPSELL (Phase 7B) : POST /orders/upsell + refetch automatique sur
  // succes. Le refetch rafraichit hasUpsell + total + paymentUrl, ce qui
  // (1) cache la carte d'offre, (2) met a jour le bouton "Payer ma
  // facture" avec le nouveau lien Stripe, (3) affiche le nouveau total.
  const handleUpsell = async () => {
    if (upsellState === 'loading') return;
    setUpsellState('loading');
    setUpsellError('');
    try {
      await api.post('/orders/upsell', {
        orderId: result?.orderId || orderId,
        email,
      });
      // Refetch silencieux pour basculer la carte vers le nouvel etat
      // (hasUpsell=true -> la carte disparait automatiquement).
      const { data } = await api.get('/orders/track', {
        params: { orderId: result?.orderId || orderId, email },
      });
      setResult(data);
      setUpsellState('idle');
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.error?.code;
      let msg;
      if (status === 409 || code === 'ALREADY_ADDED') {
        msg = tx({
          fr: 'L\'offre est déjà sur cette commande.',
          en: 'The offer is already on this order.',
          es: 'La oferta ya está en este pedido.',
        });
      } else if (status === 400 && code === 'NOT_PENDING') {
        msg = tx({
          fr: 'Cette commande a déjà été traitée et ne peut plus être modifiée.',
          en: 'This order has already been processed and cannot be modified.',
          es: 'Este pedido ya fue procesado.',
        });
      } else {
        msg = tx({
          fr: 'Erreur lors de l\'ajout de l\'offre. Réessaie ou écris-nous à massivemedias@gmail.com.',
          en: 'Error adding the offer. Retry or email massivemedias@gmail.com.',
          es: 'Error al añadir la oferta.',
        });
      }
      setUpsellError(msg);
      setUpsellState('error');
    }
  };

  // REORDER (Phase 6) : appelle POST /orders/reorder avec orderId+email
  // (doublecle deja validee cote backend). Sur succes, on bascule sur l'etat
  // "success" qui remplace le bouton par un bandeau vert.
  const handleReorder = async () => {
    if (reorderState === 'loading' || reorderState === 'success') return;
    setReorderState('loading');
    setReorderError('');
    try {
      const { data } = await api.post('/orders/reorder', {
        orderId: result?.orderId || orderId,
        email: email,
      });
      setReorderResult(data);
      setReorderState('success');
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.error?.code;
      const retryAfter = err?.response?.data?.error?.retryAfter;
      let msg;
      if (status === 429 || code === 'THROTTLED') {
        msg = tx({
          fr: `Trop de tentatives. Réessayez dans ${retryAfter || 60} secondes.`,
          en: `Too many attempts. Retry in ${retryAfter || 60} seconds.`,
          es: `Demasiados intentos. Inténtalo de nuevo en ${retryAfter || 60} segundos.`,
        });
      } else if (status === 409 || code === 'NOT_ELIGIBLE') {
        msg = tx({
          fr: 'Cette commande ne peut être recommandée que lorsqu\'elle est livrée.',
          en: 'This order can only be reordered once it has been delivered.',
          es: 'Este pedido solo se puede volver a pedir una vez entregado.',
        });
      } else if (status === 404 || code === 'NOT_FOUND') {
        msg = tx({
          fr: 'Commande introuvable. Recommencez la recherche.',
          en: 'Order not found. Restart your search.',
          es: 'Pedido no encontrado.',
        });
      } else {
        msg = tx({
          fr: 'Erreur de connexion. Réessayez dans quelques secondes.',
          en: 'Connection error. Retry in a few seconds.',
          es: 'Error de conexión.',
        });
      }
      setReorderError(msg);
      setReorderState('error');
    }
  };

  // Calcul du progress en cours d'apres le status retourne par le backend.
  const currentStep = result ? (STATUS_PROGRESS[result.status] || 0) : 0;
  const isNegative = result && NEGATIVE_STATUSES.has(result.status);
  const negativeLabel = isNegative
    ? tx({
        fr: result.status === 'cancelled' ? 'Annulée' : 'Remboursée',
        en: result.status === 'cancelled' ? 'Cancelled' : 'Refunded',
        es: result.status === 'cancelled' ? 'Cancelada' : 'Reembolsada',
      })
    : null;

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-CA' : lang === 'es' ? 'es-ES' : 'en-CA', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  return (
    <>
      <SEO
        title={tx({
          fr: 'Suivi de commande - Massive Medias',
          en: 'Order Tracking - Massive Medias',
          es: 'Seguimiento de pedido - Massive Medias',
        })}
        description={tx({
          fr: 'Suivez l\'avancement de votre commande Massive Medias en temps réel.',
          en: 'Track your Massive Medias order in real time.',
          es: 'Sigue tu pedido en tiempo real.',
        })}
      />

      <div className="min-h-screen pt-24 pb-16 section-container">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-3">
              {tx({
                fr: 'Suivi de commande',
                en: 'Order tracking',
                es: 'Seguimiento de pedido',
              })}
            </h1>
            <p className="text-grey-muted text-base">
              {tx({
                fr: 'Entrez votre numéro de commande et votre courriel pour voir l\'avancement.',
                en: 'Enter your order number and email to see the progress.',
                es: 'Introduce tu número de pedido y correo para ver el progreso.',
              })}
            </p>
          </motion.div>

          {/* Form OU Result */}
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="card-bg rounded-2xl p-6 md:p-8 shadow-lg shadow-black/20 space-y-5"
              >
                <div>
                  <label htmlFor="orderId" className="block text-heading font-semibold mb-2 text-sm">
                    {tx({ fr: 'Numéro de commande', en: 'Order number', es: 'Número de pedido' })}
                  </label>
                  <input
                    id="orderId"
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                    placeholder="ABCD1234"
                    autoComplete="off"
                    className="input-field font-mono uppercase tracking-wider"
                    maxLength={64}
                    disabled={loading}
                  />
                  <p className="text-xs text-grey-muted mt-1.5">
                    {tx({
                      fr: 'Le numéro figure dans le sujet et le corps du courriel de confirmation.',
                      en: 'The number is in the subject and body of your confirmation email.',
                      es: 'El número está en tu correo de confirmación.',
                    })}
                  </p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-heading font-semibold mb-2 text-sm">
                    {tx({ fr: 'Adresse courriel', en: 'Email address', es: 'Correo electrónico' })}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@courriel.com"
                    autoComplete="email"
                    className="input-field"
                    maxLength={200}
                    disabled={loading}
                  />
                  <p className="text-xs text-grey-muted mt-1.5">
                    {tx({
                      fr: 'L\'adresse utilisée pour passer la commande.',
                      en: 'The address used to place the order.',
                      es: 'La dirección usada para hacer el pedido.',
                    })}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400"
                  >
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading || !orderId.trim() || !email.trim()}
                  className="w-full py-3 rounded-lg bg-accent text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--accent-rgb,255,82,160),0.35)]"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {loading
                    ? tx({ fr: 'Recherche...', en: 'Searching...', es: 'Buscando...' })
                    : tx({ fr: 'Voir l\'avancement', en: 'See progress', es: 'Ver progreso' })}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Header carte resultat */}
                <div className="card-bg rounded-2xl p-6 md:p-8 shadow-lg shadow-black/20">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-grey-muted mb-1">
                        {tx({ fr: 'Commande', en: 'Order', es: 'Pedido' })}
                      </p>
                      <p className="text-2xl md:text-3xl font-heading font-bold text-heading font-mono">
                        #{result.orderId}
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-xs text-grey-muted hover:text-heading transition-colors flex items-center gap-1"
                    >
                      {tx({ fr: 'Nouvelle recherche', en: 'New search', es: 'Nueva búsqueda' })}
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-grey-muted">
                        {tx({ fr: 'Reçue le', en: 'Received', es: 'Recibida' })}
                      </p>
                      <p className="text-heading font-semibold mt-0.5">{formatDate(result.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-grey-muted">
                        {tx({ fr: 'Dernière mise à jour', en: 'Last updated', es: 'Última actualización' })}
                      </p>
                      <p className="text-heading font-semibold mt-0.5">{formatDate(result.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline OU statut negatif */}
                {isNegative ? (
                  <div className="card-bg rounded-2xl p-6 md:p-8 shadow-lg shadow-black/20 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 text-red-400 mb-4">
                      <XCircle size={32} />
                    </div>
                    <h2 className="text-xl font-heading font-bold text-heading mb-2">
                      {tx({
                        fr: `Commande ${negativeLabel.toLowerCase()}`,
                        en: `Order ${negativeLabel.toLowerCase()}`,
                        es: `Pedido ${negativeLabel.toLowerCase()}`,
                      })}
                    </h2>
                    <p className="text-grey-muted text-sm leading-relaxed max-w-md mx-auto">
                      {tx({
                        fr: 'Cette commande a été interrompue. Pour toute question, écrivez-nous à massivemedias@gmail.com en mentionnant le numéro ci-dessus.',
                        en: 'This order has been interrupted. For any question, email massivemedias@gmail.com with the number above.',
                        es: 'Este pedido fue interrumpido. Para cualquier pregunta, escríbenos.',
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="card-bg rounded-2xl p-6 md:p-8 shadow-lg shadow-black/20">
                    <h2 className="text-lg font-heading font-bold text-heading mb-6">
                      {tx({ fr: 'Avancement', en: 'Progress', es: 'Progreso' })}
                    </h2>
                    <div className="space-y-4">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isPast = step.id < currentStep;
                        const isActive = step.id === currentStep;
                        const isFuture = step.id > currentStep;
                        const isLast = idx === TIMELINE_STEPS.length - 1;
                        return (
                          <div key={step.id} className="flex gap-4 relative">
                            {/* Vertical connector line */}
                            {!isLast && (
                              <div
                                className={`absolute left-5 top-10 bottom-0 w-0.5 -mb-4 ${
                                  isPast ? 'bg-accent' : 'bg-white/10'
                                }`}
                                aria-hidden
                              />
                            )}
                            {/* Icon circle */}
                            <div
                              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                isPast
                                  ? 'bg-accent text-white'
                                  : isActive
                                    ? 'bg-accent text-white shadow-[0_0_20px_rgba(var(--accent-rgb,255,82,160),0.5)] animate-pulse'
                                    : 'bg-white/5 text-grey-muted/50 border border-white/10'
                              }`}
                            >
                              <Icon size={18} />
                            </div>
                            {/* Label + desc */}
                            <div className="flex-1 pb-4">
                              <p
                                className={`font-heading font-bold text-sm ${
                                  isPast || isActive ? 'text-heading' : 'text-grey-muted/60'
                                }`}
                              >
                                {tx(step.label)}
                                {isActive && (
                                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent align-middle">
                                    {tx({ fr: 'En cours', en: 'In progress', es: 'En curso' })}
                                  </span>
                                )}
                              </p>
                              <p
                                className={`text-xs mt-0.5 leading-relaxed ${
                                  isPast || isActive ? 'text-grey-muted' : 'text-grey-muted/40'
                                }`}
                              >
                                {tx(step.desc)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PAYMENT CTA (Phase 7B) : carte de paiement visible quand
                    la commande est pending/draft ET qu'un Stripe Payment Link
                    est disponible. Le bouton fonctionne meme apres l'ajout
                    d'un upsell (le backend regenere le lien et le push
                    automatiquement dans la reponse trackOrder via le refetch). */}
                {(result.status === 'pending' || result.status === 'draft') && result.paymentUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card-bg rounded-2xl p-6 md:p-7 shadow-lg shadow-black/20"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                        <CreditCard size={20} />
                      </span>
                      <div className="flex-1">
                        <p className="text-heading font-heading font-bold text-base mb-1">
                          {tx({ fr: 'Paiement en attente', en: 'Payment pending', es: 'Pago pendiente' })}
                        </p>
                        <p className="text-grey-muted text-xs leading-relaxed">
                          {tx({
                            fr: 'Finalise ta commande en toute sécurité via Stripe (carte, Apple Pay, Google Pay).',
                            en: 'Finalize your order securely via Stripe (card, Apple Pay, Google Pay).',
                            es: 'Finaliza tu pedido de forma segura via Stripe (tarjeta, Apple Pay, Google Pay).',
                          })}
                        </p>
                        {typeof result.total === 'number' && result.total > 0 && (
                          <p className="text-[11px] text-grey-muted mt-1.5">
                            {tx({ fr: 'Total à régler', en: 'Total to pay', es: 'Total a pagar' })}
                            {' : '}
                            <span className="font-mono font-semibold text-heading">
                              {(result.total / 100).toLocaleString(lang === 'fr' ? 'fr-CA' : lang === 'es' ? 'es-ES' : 'en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <a
                      href={result.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-accent text-white font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(var(--accent-rgb,255,82,160),0.35)]"
                    >
                      <CreditCard size={16} />
                      {tx({ fr: 'Payer ma facture', en: 'Pay my invoice', es: 'Pagar mi factura' })}
                    </a>
                  </motion.div>
                )}

                {/* UPSELL (Phase 7B) : carte d'offre incitative "Order Bump".
                    Visible UNIQUEMENT pour pending/draft non encore upsell.
                    Backend POST /orders/upsell : recalc TPS/TVQ + regen
                    Stripe Payment Link, refetch frontend met a jour total
                    + paymentUrl + cache la carte (hasUpsell devient true). */}
                {(result.status === 'pending' || result.status === 'draft') && !result.hasUpsell && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="rounded-2xl p-6 md:p-7 shadow-lg shadow-black/20 border bg-accent/5"
                    style={{ borderColor: 'rgba(255,82,160,0.25)' }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0">
                        <Sparkles size={20} />
                      </span>
                      <div className="flex-1">
                        <p className="text-heading font-heading font-bold text-base mb-1">
                          {tx({
                            fr: 'Ajoutez de la magie à votre commande',
                            en: 'Add some magic to your order',
                            es: 'Añade magia a tu pedido',
                          })}
                        </p>
                        <p className="text-grey-muted text-xs leading-relaxed">
                          {tx({
                            fr: 'Obtenez 50 stickers holographiques premium (2x2 pouces) pour seulement 49$ supplémentaires. L\'ajout parfait pour faire briller votre marque.',
                            en: 'Get 50 premium holographic stickers (2x2 inch) for only $49 extra. The perfect add-on to make your brand shine.',
                            es: 'Obtén 50 stickers holográficos premium (2x2 pulgadas) por solo 49$ adicionales. El complemento perfecto para que tu marca brille.',
                          })}
                        </p>
                      </div>
                    </div>

                    {upsellState === 'error' && upsellError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400 mb-3"
                      >
                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{upsellError}</span>
                      </motion.div>
                    )}

                    <button
                      type="button"
                      onClick={handleUpsell}
                      disabled={upsellState === 'loading'}
                      className="w-full py-3 rounded-lg bg-accent text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {upsellState === 'loading' ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {tx({ fr: 'Ajout en cours...', en: 'Adding...', es: 'Añadiendo...' })}
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          {tx({
                            fr: 'Ajouter à ma commande (+49$)',
                            en: 'Add to my order (+$49)',
                            es: 'Añadir a mi pedido (+49$)',
                          })}
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* REORDER (Phase 6) : bouton "Recommander a l'identique"
                    visible UNIQUEMENT si la commande est livree. Backend
                    POST /orders/reorder gate le status (409 si non eligible)
                    + throttle 1/60s/email. */}
                {result.status === 'delivered' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="card-bg rounded-2xl p-6 md:p-7 shadow-lg shadow-black/20"
                  >
                    {reorderState === 'success' ? (
                      <div className="flex items-start gap-3">
                        <span className="w-10 h-10 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={20} />
                        </span>
                        <div className="flex-1">
                          <p className="text-heading font-heading font-bold text-base mb-1">
                            {tx({
                              fr: 'Succès !',
                              en: 'Success!',
                              es: '¡Éxito!',
                            })}
                          </p>
                          <p className="text-grey-muted text-sm leading-relaxed">
                            {tx({
                              fr: 'Votre demande de réimpression a été envoyée. Vous recevrez votre nouvelle facture sous peu.',
                              en: 'Your reprint request has been sent. You will receive your new invoice shortly.',
                              es: 'Tu solicitud de reimpresión fue enviada. Recibirás tu nueva factura en breve.',
                            })}
                          </p>
                          {reorderResult?.newOrderId && (
                            <p className="text-xs text-grey-muted mt-2">
                              {tx({ fr: 'Nouvelle référence', en: 'New reference', es: 'Nueva referencia' })}
                              {' : '}
                              <span className="font-mono font-semibold text-heading">#{reorderResult.newOrderId}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3 mb-4">
                          <span className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                            <RotateCcw size={20} />
                          </span>
                          <div className="flex-1">
                            <p className="text-heading font-heading font-bold text-base mb-1">
                              {tx({
                                fr: 'Besoin d\'une autre série ?',
                                en: 'Need another batch?',
                                es: '¿Necesitas otra serie?',
                              })}
                            </p>
                            <p className="text-grey-muted text-xs leading-relaxed">
                              {tx({
                                fr: 'On garde tout en mémoire (fichiers, formats, quantités). En un clic, on relance la même commande à l\'identique.',
                                en: 'We have everything saved (files, sizes, quantities). One click and we re-launch the exact same order.',
                                es: 'Lo tenemos todo guardado (archivos, formatos, cantidades). Un click y relanzamos el mismo pedido.',
                              })}
                            </p>
                          </div>
                        </div>

                        {reorderState === 'error' && reorderError && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400 mb-3"
                          >
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{reorderError}</span>
                          </motion.div>
                        )}

                        <button
                          type="button"
                          onClick={handleReorder}
                          disabled={reorderState === 'loading'}
                          className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-accent/40 hover:border-accent text-heading font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {reorderState === 'loading' ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              {tx({ fr: 'Envoi en cours...', en: 'Submitting...', es: 'Enviando...' })}
                            </>
                          ) : (
                            <>
                              <RotateCcw size={16} />
                              {tx({
                                fr: 'Recommander à l\'identique (Reprint)',
                                en: 'Reorder identically (Reprint)',
                                es: 'Volver a pedir igual (Reprint)',
                              })}
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Lien support */}
                <div className="card-bg rounded-2xl p-5 shadow-lg shadow-black/20 flex items-start gap-3">
                  <Mail size={16} className="text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="text-heading font-semibold mb-1">
                      {tx({ fr: 'Une question ?', en: 'A question?', es: '¿Una pregunta?' })}
                    </p>
                    <p className="text-grey-muted">
                      {tx({
                        fr: 'Écrivez à ',
                        en: 'Email ',
                        es: 'Escribe a ',
                      })}
                      <a href="mailto:massivemedias@gmail.com" className="text-accent hover:underline">
                        massivemedias@gmail.com
                      </a>
                      {tx({
                        fr: ` en mentionnant le numéro #${result.orderId}.`,
                        en: ` with the number #${result.orderId}.`,
                        es: ` con el número #${result.orderId}.`,
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lien retour */}
          <div className="text-center mt-8">
            <Link to="/" className="text-sm text-grey-muted hover:text-accent transition-colors inline-flex items-center gap-1">
              <ArrowRight size={12} className="rotate-180" />
              {tx({ fr: 'Retour à l\'accueil', en: 'Back to home', es: 'Volver al inicio' })}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Tracking;
