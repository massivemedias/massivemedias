import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Lock, CheckCircle, AlertTriangle, ShieldCheck, Sparkles, XCircle,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { getPrivateSaleByToken, createPrivateSaleCheckout } from '../services/privateSaleService';

/**
 * Page publique "Vente Privee" - acces exclusif via un token unique envoye
 * par email au client. Pattern :
 *   1. Fetch de la vente par token (GET /api/artists-private-sales/token/:token)
 *   2. Affichage de l'oeuvre + bloc prix (fixe ou libre avec min)
 *   3. Validation stricte cote UI (amount >= basePrice) + cote backend (re-check)
 *   4. Call POST /artists-private-sales/token/:token/checkout -> redirect Stripe
 *
 * Le status=success redirect de Stripe affiche une confirmation. L'oeuvre est
 * marquee sold=true via webhook (pas ici) - on refetch au retour pour confirmer.
 */
function VentePrivee() {
  const { token } = useParams();
  const { tx } = useLang();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('status'); // 'success' | 'cancel' | null

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch au mount + au retour de Stripe (success / cancel)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    getPrivateSaleByToken(token)
      .then(({ data }) => {
        if (cancelled) return;
        const payload = data?.data || null;
        if (!payload) {
          setLoadError(tx({
            fr: 'Vente privee introuvable ou lien expire.',
            en: 'Private sale not found or expired link.',
            es: 'Venta privada no encontrada o enlace caducado.',
          }));
        } else {
          setSale(payload);
          // Pre-remplir l'input custom avec le basePrice si allowCustomPrice
          if (payload.allowCustomPrice && typeof payload.basePrice === 'number') {
            setCustomAmount(String(payload.basePrice));
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err?.response?.status === 404
          ? tx({
              fr: 'Ce lien de vente privee n\'existe pas ou a ete retire.',
              en: 'This private sale link does not exist or has been removed.',
              es: 'Este enlace de venta privada no existe o ha sido retirado.',
            })
          : err?.response?.data?.error?.message || err?.message || tx({
              fr: 'Erreur de chargement.', en: 'Loading error.', es: 'Error de carga.',
            });
        setLoadError(msg);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, tx]);

  // Derived: prix effectif qui sera envoye au backend
  const parsedAmount = useMemo(() => {
    if (!sale) return 0;
    if (!sale.allowCustomPrice) return Number(sale.basePrice) || 0;
    const n = parseFloat(String(customAmount).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }, [sale, customAmount]);

  const amountValid = sale && parsedAmount >= (sale.basePrice || 0) && parsedAmount > 0;
  const amountTooLow = sale?.allowCustomPrice && customAmount !== '' && !amountValid;

  const handleCheckout = async () => {
    if (!sale || submitting) return;
    if (!amountValid) {
      setSubmitError(tx({
        fr: `Le montant minimum pour cette oeuvre est de ${sale.basePrice}$.`,
        en: `The minimum amount for this artwork is ${sale.basePrice}$.`,
        es: `El monto minimo para esta obra es ${sale.basePrice}$.`,
      }));
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const { data } = await createPrivateSaleCheckout(
        token,
        sale.allowCustomPrice ? parsedAmount : undefined,
      );
      const url = data?.data?.sessionUrl;
      if (!url) throw new Error('Session URL manquante');
      window.location.href = url;
    } catch (err) {
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || tx({ fr: 'Erreur de paiement.', en: 'Payment error.', es: 'Error de pago.' });
      setSubmitError(msg);
      setSubmitting(false);
    }
  };

  // --- ETATS DE RENDU ---

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center section-container pt-28">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (loadError || !sale) {
    return (
      <div className="section-container pt-28 pb-20">
        <SEO title="Vente privee - Massive Medias" description="Vente privee exclusive." />
        <div className="max-w-lg mx-auto text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <XCircle size={28} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-heading">
            {tx({ fr: 'Lien expire', en: 'Expired link', es: 'Enlace caducado' })}
          </h1>
          <p className="text-grey-muted text-sm">{loadError}</p>
          <p className="text-xs text-grey-muted/70">
            {tx({
              fr: 'Contactez massivemedias@gmail.com si vous pensez qu\'il s\'agit d\'une erreur.',
              en: 'Contact massivemedias@gmail.com if you believe this is an error.',
              es: 'Contacte massivemedias@gmail.com si cree que es un error.',
            })}
          </p>
        </div>
      </div>
    );
  }

  // Retour Stripe : succes
  if (paymentStatus === 'success' || sale.sold) {
    return (
      <div className="section-container pt-28 pb-20">
        <SEO title={`${sale.title} - Acquise`} description="Acquisition confirmee." />
        <div className="max-w-xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto rounded-full bg-green-500/15 flex items-center justify-center"
          >
            <CheckCircle size={40} className="text-green-400" />
          </motion.div>
          <h1 className="text-3xl font-heading font-bold text-heading">
            {tx({ fr: 'Acquisition confirmee', en: 'Acquisition confirmed', es: 'Adquisicion confirmada' })}
          </h1>
          <p className="text-grey-muted text-sm max-w-md mx-auto leading-relaxed">
            {tx({
              fr: `Merci. "${sale.title}" vous est desormais reservee. Un courriel de confirmation a ete envoye avec les details de production et de livraison.`,
              en: `Thank you. "${sale.title}" is now reserved for you. A confirmation email has been sent with production and shipping details.`,
              es: `Gracias. "${sale.title}" ahora esta reservada para usted.`,
            })}
          </p>
          {sale.image && (
            <img
              src={sale.image}
              alt={sale.title}
              className="max-w-md mx-auto rounded-xl shadow-2xl shadow-black/40 border border-white/5"
            />
          )}
        </div>
      </div>
    );
  }

  // Rendu standard : carte de vente
  return (
    <div className="section-container pt-28 pb-20">
      <SEO
        title={`${sale.title} - Acces prive`}
        description={`Une oeuvre reservee par ${sale.artistName}.`}
      />

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* COLONNE GAUCHE - oeuvre */}
        <div className="space-y-4">
          {sale.image ? (
            <motion.img
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              src={sale.image}
              alt={sale.title}
              className="w-full rounded-2xl shadow-2xl shadow-black/50 border border-white/5 object-cover"
            />
          ) : (
            <div className="aspect-square rounded-2xl bg-glass flex items-center justify-center">
              <Sparkles size={48} className="text-accent/50" />
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-grey-muted">
            <Lock size={12} className="text-accent" />
            <span>{tx({
              fr: 'Lien prive - reserve exclusivement a votre adresse.',
              en: 'Private link - reserved exclusively for your address.',
              es: 'Enlace privado - reservado exclusivamente para su direccion.',
            })}</span>
          </div>
        </div>

        {/* COLONNE DROITE - infos + paiement */}
        <div className="space-y-5">
          {/* En-tete exclusive */}
          <div>
            <p className="text-accent text-[10px] font-bold uppercase tracking-[0.18em] mb-2">
              {tx({ fr: 'Acces exclusif', en: 'Exclusive access', es: 'Acceso exclusivo' })}
            </p>
            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-heading leading-tight">
              {sale.title}
            </h1>
            <p className="text-grey-muted text-sm mt-2">
              {tx({ fr: 'Par', en: 'By', es: 'Por' })}{' '}
              <span className="text-heading font-semibold">{sale.artistName}</span>
            </p>
          </div>

          {sale.description && (
            <p className="text-grey-muted text-sm leading-relaxed whitespace-pre-wrap">
              {sale.description}
            </p>
          )}

          {/* Details fixes */}
          {(sale.fixedFormat || sale.fixedFrame) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {sale.fixedFormat && (
                <span className="px-2.5 py-1 rounded-full bg-glass text-heading">
                  {tx({ fr: 'Format', en: 'Format', es: 'Formato' })}: {sale.fixedFormat}
                </span>
              )}
              {sale.fixedFrame && (
                <span className="px-2.5 py-1 rounded-full bg-glass text-heading">
                  {tx({ fr: 'Cadre', en: 'Frame', es: 'Marco' })}: {sale.fixedFrame}
                </span>
              )}
            </div>
          )}

          {/* Bloc prix */}
          <div className="rounded-2xl p-5 card-bg border border-accent/20 space-y-4">
            {sale.allowCustomPrice ? (
              <>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-accent font-bold mb-1">
                    {tx({ fr: 'Prix libre', en: 'Pay what you want', es: 'Precio libre' })}
                  </p>
                  <p className="text-xs text-grey-muted">
                    {tx({
                      fr: `Minimum requis : ${sale.basePrice}$`,
                      en: `Minimum required: ${sale.basePrice}$`,
                      es: `Minimo requerido: ${sale.basePrice}$`,
                    })}
                  </p>
                </div>
                <label className="block">
                  <span className="text-xs font-semibold text-heading mb-2 block">
                    {tx({ fr: 'Votre montant ($CAD)', en: 'Your amount ($CAD)', es: 'Su monto ($CAD)' })}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min={sale.basePrice}
                      step="1"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setSubmitError(''); }}
                      placeholder={String(sale.basePrice)}
                      className={`w-full rounded-xl bg-black/20 text-heading text-xl font-bold px-4 py-3.5 outline-none border-2 transition-colors ${
                        amountTooLow ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-accent'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-grey-muted text-sm font-semibold pointer-events-none">
                      $
                    </span>
                  </div>
                  {amountTooLow && (
                    <p className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                      <AlertTriangle size={12} />
                      {tx({
                        fr: `Le montant minimum pour cette oeuvre est de ${sale.basePrice}$.`,
                        en: `The minimum amount for this artwork is ${sale.basePrice}$.`,
                        es: `El monto minimo para esta obra es ${sale.basePrice}$.`,
                      })}
                    </p>
                  )}
                </label>
              </>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-wider text-accent font-bold mb-1">
                  {tx({ fr: 'Prix', en: 'Price', es: 'Precio' })}
                </p>
                <p className="text-4xl font-heading font-bold text-heading">
                  {sale.basePrice}$ <span className="text-sm text-grey-muted font-normal">CAD</span>
                </p>
              </>
            )}

            {submitError && !amountTooLow && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle size={12} /> {submitError}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={!amountValid || submitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent text-white font-bold text-base shadow-lg shadow-accent/30 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {tx({ fr: 'Redirection vers Stripe...', en: 'Redirecting to Stripe...', es: 'Redirigiendo...' })}
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  {tx({ fr: 'Proceder au paiement', en: 'Proceed to payment', es: 'Proceder al pago' })}
                </>
              )}
            </button>

            <p className="flex items-center gap-1.5 text-[11px] text-grey-muted justify-center">
              <Lock size={10} className="text-green-400" />
              {tx({
                fr: 'Paiement securise via Stripe - cartes, Apple Pay, Google Pay.',
                en: 'Secure payment via Stripe - cards, Apple Pay, Google Pay.',
                es: 'Pago seguro via Stripe.',
              })}
            </p>
          </div>

          {paymentStatus === 'cancel' && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-xs text-yellow-200">
              {tx({
                fr: 'Paiement annule - votre oeuvre est toujours disponible, retentez quand vous voulez.',
                en: 'Payment cancelled - your artwork is still available, try again anytime.',
                es: 'Pago cancelado - su obra sigue disponible.',
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VentePrivee;
