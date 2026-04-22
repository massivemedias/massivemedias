import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Lock, Mail, DollarSign, Loader2, CheckCircle, Copy, ExternalLink, AlertCircle, Sparkles,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { activatePrivateSale } from '../services/adminService';

/**
 * Modal admin pour activer une vente privee sur une oeuvre en 3 clics.
 *
 * Props:
 *   artistSlug (string, required) - slug de l'artiste
 *   item (object, required) - { id, titleFr, titleEn, image, customPrice, private, clientEmail, basePrice, allowCustomPrice }
 *   category ('prints'|'stickers', default 'prints')
 *   onClose() - ferme la modale (sans changer de state)
 *   onActivated(result) - callback apres succes pour refresh parent. result = { token, clientLink, emailSent }
 *
 * Flux :
 *   1. L'admin saisit clientEmail + basePrice + (checkbox) allowCustomPrice
 *   2. Submit = POST /admin/artists-item/:slug/:itemId/private-sale
 *   3. Backend genere le token, patch l'item, envoie le courriel
 *   4. On bascule sur l'ecran de confirmation avec le lien copiable
 */
function ActivatePrivateSaleModal({ artistSlug, item, category = 'prints', onClose, onActivated }) {
  const { tx } = useLang();

  // Pre-fill avec les valeurs existantes si l'item est deja en vente privee
  // (admin peut re-declencher l'email avec les memes infos ou les modifier).
  const [clientEmail, setClientEmail] = useState(item?.clientEmail || '');
  const [basePrice, setBasePrice] = useState(
    item?.basePrice != null ? String(item.basePrice)
    : item?.customPrice != null ? String(item.customPrice)
    : '',
  );
  const [allowCustomPrice, setAllowCustomPrice] = useState(!!item?.allowCustomPrice);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const isReactivation = !!(item?.private && item?.privateToken);

  const submit = async (e) => {
    e?.preventDefault?.();
    setError('');

    const email = clientEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(tx({
        fr: 'Email client invalide.',
        en: 'Invalid client email.',
        es: 'Email de cliente invalido.',
      }));
      return;
    }
    const price = parseFloat(String(basePrice).replace(',', '.'));
    if (!Number.isFinite(price) || price <= 0) {
      setError(tx({
        fr: 'Prix de base invalide (doit etre > 0).',
        en: 'Invalid base price (must be > 0).',
        es: 'Precio de base invalido (> 0).',
      }));
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await activatePrivateSale(artistSlug, item.id, {
        clientEmail: email,
        basePrice: price,
        allowCustomPrice,
        category,
      });
      const payload = data?.data || data;
      setResult(payload);
      onActivated?.(payload);
    } catch (err) {
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || tx({ fr: 'Erreur inconnue', en: 'Unknown error', es: 'Error desconocido' });
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!result?.clientLink) return;
    try {
      await navigator.clipboard.writeText(result.clientLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = result.clientLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Theme-adaptive styles (CSS vars definies globalement dans index.css)
  const modalBg = { background: 'var(--bg-card-solid)', borderColor: 'var(--bg-input-border)' };
  const inputBg = { background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--color-heading)' };
  const dividerBorder = { borderColor: 'var(--bg-input-border)' };
  const cancelBtnStyle = { background: 'var(--bg-glass)', color: 'var(--color-grey-muted)' };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={() => !submitting && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md my-8 rounded-2xl border shadow-2xl overflow-hidden"
          style={modalBg}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={dividerBorder}>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                <Lock size={16} className="text-accent" />
              </span>
              <div>
                <h3 className="text-heading font-heading font-bold text-base leading-tight">
                  {result
                    ? tx({ fr: 'Vente privee activee', en: 'Private sale activated', es: 'Venta privada activada' })
                    : isReactivation
                      ? tx({ fr: 'Modifier la vente privee', en: 'Edit private sale', es: 'Editar venta privada' })
                      : tx({ fr: 'Creer une vente privee', en: 'Create private sale', es: 'Crear venta privada' })}
                </h3>
                <p className="text-[11px] text-grey-muted truncate max-w-[240px]">
                  {item?.titleFr || item?.titleEn || item?.id}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 rounded-lg text-grey-muted hover:text-heading transition-colors disabled:opacity-40"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Success state */}
          {result ? (
            <div className="px-5 py-6 space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="text-heading font-semibold">
                    {tx({
                      fr: 'Courriel envoye au client',
                      en: 'Email sent to client',
                      es: 'Correo enviado al cliente',
                    })}
                  </p>
                  <p className="text-grey-muted text-xs mt-0.5">
                    {result.emailSent
                      ? tx({
                          fr: `Le tutoriel a ete envoye a ${result.clientEmail}.`,
                          en: `Tutorial sent to ${result.clientEmail}.`,
                          es: `Tutorial enviado a ${result.clientEmail}.`,
                        })
                      : tx({
                          fr: `Vente activee, mais le courriel n'a pas pu partir. Utilisez le lien ci-dessous.`,
                          en: `Sale activated, but email failed. Use the link below.`,
                          es: `Venta activada, pero el correo fallo.`,
                        })}
                  </p>
                </div>
              </div>

              {/* Link display + copy */}
              <div>
                <label className="text-[11px] text-grey-muted uppercase tracking-wider font-semibold">
                  {tx({ fr: 'Lien prive client', en: 'Client private link', es: 'Enlace privado' })}
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    readOnly
                    value={result.clientLink || ''}
                    className="flex-1 rounded-lg text-[11px] font-mono px-3 py-2.5 outline-none border"
                    style={inputBg}
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className={`px-3 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors ${
                      copied ? 'bg-green-500 text-white' : 'bg-accent text-white hover:brightness-110'
                    }`}
                  >
                    {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                    {copied
                      ? tx({ fr: 'Copie', en: 'Copied', es: 'Copiado' })
                      : tx({ fr: 'Copier', en: 'Copy', es: 'Copiar' })}
                  </button>
                </div>
                <a
                  href={result.clientLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[11px] text-accent hover:underline"
                >
                  <ExternalLink size={10} /> {tx({ fr: 'Ouvrir dans un onglet', en: 'Open in tab', es: 'Abrir' })}
                </a>
              </div>

              {/* Summary */}
              <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'var(--bg-glass)' }}>
                <div className="flex justify-between text-grey-muted">
                  <span>{tx({ fr: 'Prix minimum', en: 'Min price', es: 'Precio min' })}</span>
                  <span className="text-heading font-semibold">{result.basePrice}$ CAD</span>
                </div>
                <div className="flex justify-between text-grey-muted">
                  <span>{tx({ fr: 'Prix libre', en: 'Pay what you want', es: 'Precio libre' })}</span>
                  <span className="text-heading font-semibold">
                    {result.allowCustomPrice
                      ? tx({ fr: 'Oui', en: 'Yes', es: 'Si' })
                      : tx({ fr: 'Non', en: 'No', es: 'No' })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-lg font-semibold text-sm"
                style={cancelBtnStyle}
              >
                {tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
              </button>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={submit} className="px-5 py-5 space-y-4">
              {/* Preview oeuvre */}
              {item?.image && (
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
                  <img
                    src={item.image}
                    alt={item.titleFr || item.id}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-heading truncate">
                      {item.titleFr || item.titleEn || item.id}
                    </p>
                    <p className="text-[10px] text-grey-muted font-mono truncate">{item.id}</p>
                    {isReactivation && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded font-semibold">
                        <Sparkles size={9} />
                        {tx({ fr: 'Deja activee', en: 'Already active', es: 'Ya activa' })}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Client email */}
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-grey-muted flex items-center gap-1.5 mb-1.5">
                  <Mail size={11} />
                  {tx({ fr: 'Email du client', en: 'Client email', es: 'Email del cliente' })} *
                </span>
                <input
                  ref={firstInputRef}
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@exemple.com"
                  className="w-full rounded-lg text-sm px-3 py-2.5 outline-none border focus:border-accent"
                  style={inputBg}
                  disabled={submitting}
                />
              </label>

              {/* Base price */}
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-grey-muted flex items-center gap-1.5 mb-1.5">
                  <DollarSign size={11} />
                  {tx({ fr: 'Prix de base ($CAD)', en: 'Base price ($CAD)', es: 'Precio de base ($CAD)' })} *
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="250"
                  className="w-full rounded-lg text-sm px-3 py-2.5 outline-none border focus:border-accent"
                  style={inputBg}
                  disabled={submitting}
                />
                <p className="text-[10px] text-grey-muted mt-1">
                  {tx({
                    fr: 'Montant minimum que le client doit payer pour cette oeuvre.',
                    en: 'Minimum amount the client must pay for this artwork.',
                    es: 'Monto minimo que el cliente debe pagar.',
                  })}
                </p>
              </label>

              {/* Allow custom price */}
              <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg border hover:border-accent/50 transition-colors"
                style={{ ...inputBg, borderColor: allowCustomPrice ? 'var(--accent-color, #F00098)' : 'var(--bg-input-border)' }}>
                <input
                  type="checkbox"
                  checked={allowCustomPrice}
                  onChange={(e) => setAllowCustomPrice(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-accent cursor-pointer flex-shrink-0"
                  disabled={submitting}
                />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-heading">
                    {tx({
                      fr: 'Autoriser le client a payer plus cher (Prix libre)',
                      en: 'Allow client to pay more (Pay what you want)',
                      es: 'Permitir al cliente pagar mas',
                    })}
                  </p>
                  <p className="text-[10px] text-grey-muted mt-0.5 leading-relaxed">
                    {tx({
                      fr: 'Le prix de base reste un minimum. Le client peut choisir de payer plus.',
                      en: 'The base price stays the minimum. The client can choose to pay more.',
                      es: 'El precio de base sigue siendo el minimo.',
                    })}
                  </p>
                </div>
              </label>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-40"
                  style={cancelBtnStyle}
                >
                  {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !clientEmail || !basePrice}
                  className="flex-1 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? <><Loader2 size={14} className="animate-spin" /> {tx({ fr: 'Envoi...', en: 'Sending...', es: 'Enviando...' })}</>
                    : <><Lock size={14} /> {isReactivation
                        ? tx({ fr: 'Renvoyer le lien', en: 'Resend link', es: 'Reenviar' })
                        : tx({ fr: 'Activer et envoyer', en: 'Activate and send', es: 'Activar y enviar' })}</>}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ActivatePrivateSaleModal;
