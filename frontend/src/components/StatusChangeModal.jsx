import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mail, MailX, Send, Loader2, AlertTriangle,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

/**
 * StatusChangeModal
 * -----------------
 * Interception manuelle du changement de statut d'une commande. Avant ce modal,
 * un simple onChange du <select> pouvait declencher des courriels client
 * invisibles (confirmation paye, demande temoignage livre). L'admin exige
 * desormais un controle explicite : ce modal affiche l'apercu du courriel qui
 * SERAIT envoye et l'admin choisit : changer en silence, changer + envoyer,
 * ou annuler.
 *
 * Props:
 *   order        - la commande ({ customerName, customerEmail, total, ... })
 *   currentStatus - statut actuel (pour affichage de la transition)
 *   targetStatus  - statut cible choisi dans le dropdown
 *   onCancel()   - ferme et restaure le dropdown a currentStatus
 *   onConfirm(sendEmail: boolean) - declenche l'appel API avec le choix
 *   submitting   - loading state controle par le parent (disable tous les boutons)
 */

// Map statut -> template de courriel qui serait envoye. null = aucun courriel.
function getEmailPreview(status, order, tx) {
  const name = order?.customerName || tx({ fr: 'client', en: 'client', es: 'cliente' });
  const totalStr = typeof order?.total === 'number' ? `${(order.total / 100).toFixed(2)}$` : '';
  const orderRef = order?.orderRef || String(order?.documentId || '').slice(-8).toUpperCase();

  switch (status) {
    case 'paid':
      return {
        subject: tx({
          fr: `Confirmation de votre commande #${orderRef}`,
          en: `Order confirmation #${orderRef}`,
          es: `Confirmacion del pedido #${orderRef}`,
        }),
        preview: tx({
          fr: `Bonjour ${name},\n\nMerci pour votre achat. Votre commande #${orderRef} est confirmee pour un total de ${totalStr}. Nous demarrons la production et vous tiendrons informe(e) des prochaines etapes.\n\nMassive Medias`,
          en: `Hello ${name},\n\nThank you for your purchase. Order #${orderRef} is confirmed for ${totalStr}. We are starting production and will keep you updated.\n\nMassive Medias`,
          es: `Hola ${name},\n\nGracias por tu compra. Pedido #${orderRef} confirmado por ${totalStr}.\n\nMassive Medias`,
        }),
        notes: tx({
          fr: 'Envoie aussi une notification admin a massivemedias@gmail.com avec les details complets.',
          en: 'Also triggers admin notification with full details.',
          es: 'Tambien notifica al admin.',
        }),
      };
    case 'delivered':
      return {
        subject: tx({
          fr: `Votre commande est livree - partagez votre experience`,
          en: `Your order is delivered - share your experience`,
          es: `Tu pedido esta entregado - comparte tu experiencia`,
        }),
        // FIX-SEO (23 avril 2026) : prompt Google Review ajoute a la fin pour
        // booster le referencement local. [LIEN_GOOGLE_REVIEW] est le placeholder
        // reel injecte en prod (remplace par process.env.GOOGLE_REVIEW_URL cote
        // backend). On le garde verbatim dans la preview pour que l'admin voie
        // exactement ce qui partira.
        preview: tx({
          fr: `Bonjour ${name},\n\nVotre commande est livree. Nous serions ravis de lire votre temoignage. Cliquez sur le lien personnel ci-dessous pour partager votre experience en quelques mots :\n\n[lien temoignage genere automatiquement]\n\n---\n\nVous avez un compte Google ? Vous pouvez aussi nous donner un enorme coup de pouce en laissant un avis rapide sur notre page :\n[LIEN_GOOGLE_REVIEW]\n\nMassive Medias`,
          en: `Hello ${name},\n\nYour order has been delivered. We would love to hear your feedback. Click the personal link below to share your experience:\n\n[auto-generated testimonial link]\n\n---\n\nDo you have a Google account? You can also give us a huge boost by leaving a quick review on our page:\n[LIEN_GOOGLE_REVIEW]\n\nMassive Medias`,
          es: `Hola ${name},\n\nTu pedido esta entregado. Comparte tu experiencia:\n\n[enlace de testimonio]\n\n---\n\nTienes cuenta Google? Tambien puedes dejarnos una resena:\n[LIEN_GOOGLE_REVIEW]\n\nMassive Medias`,
        }),
        notes: tx({
          fr: 'Cree aussi un enregistrement Temoignage en attente de validation dans /admin/temoignages. Le lien Google Review utilise la variable d\'env GOOGLE_REVIEW_URL en prod.',
          en: 'Also creates a pending testimonial record in /admin/temoignages. Google Review link uses GOOGLE_REVIEW_URL env var in prod.',
          es: 'Crea un testimonio pendiente. Enlace Google usa GOOGLE_REVIEW_URL.',
        }),
      };
    default:
      return null;
  }
}

const STATUS_LABELS = {
  draft:      { fr: 'Brouillon',            en: 'Draft',                es: 'Borrador' },
  pending:    { fr: 'En attente',           en: 'Pending',              es: 'Pendiente' },
  paid:       { fr: 'Paye',                 en: 'Paid',                 es: 'Pagado' },
  processing: { fr: 'En production',        en: 'Processing',           es: 'En produccion' },
  ready:      { fr: 'Pret / A remettre',    en: 'Ready / To hand over', es: 'Listo / Por entregar' },
  shipped:    { fr: 'Expedie',              en: 'Shipped',              es: 'Enviado' },
  delivered:  { fr: 'Livre / Remis',        en: 'Delivered',            es: 'Entregado' },
  cancelled:  { fr: 'Annule',               en: 'Cancelled',            es: 'Cancelado' },
  refunded:   { fr: 'Rembourse',            en: 'Refunded',             es: 'Reembolsado' },
};

function StatusChangeModal({ order, currentStatus, targetStatus, onCancel, onConfirm, submitting }) {
  const { tx } = useLang();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, submitting]);

  const email = getEmailPreview(targetStatus, order, tx);
  const hasEmail = !!email;
  const fromLabel = STATUS_LABELS[currentStatus] ? tx(STATUS_LABELS[currentStatus]) : currentStatus;
  const toLabel = STATUS_LABELS[targetStatus] ? tx(STATUS_LABELS[targetStatus]) : targetStatus;

  const modalBg = { background: 'var(--bg-card-solid)', borderColor: 'var(--bg-input-border)' };
  const dividerBorder = { borderColor: 'var(--bg-input-border)' };
  const cancelBtnStyle = { background: 'var(--bg-glass)', color: 'var(--color-grey-muted)' };
  const neutralBtnStyle = { background: 'var(--bg-glass)', color: 'var(--color-heading)' };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={() => !submitting && onCancel()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg my-8 rounded-2xl border shadow-2xl overflow-hidden"
          style={modalBg}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={dividerBorder}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-grey-muted font-semibold mb-1">
                {tx({ fr: 'Changement de statut', en: 'Status change', es: 'Cambio de estado' })}
              </p>
              <h3 className="text-heading font-heading font-bold text-base leading-tight flex items-center gap-2 flex-wrap">
                <span className="text-grey-muted line-through">{fromLabel}</span>
                <span className="text-accent text-lg">→</span>
                <span className="text-accent">{toLabel}</span>
              </h3>
              {order?.customerName && (
                <p className="text-xs text-grey-muted mt-1 truncate">
                  {tx({ fr: 'Commande de', en: 'Order from', es: 'Pedido de' })}{' '}
                  <span className="text-heading">{order.customerName}</span>
                  {order.customerEmail && <span className="ml-1">({order.customerEmail})</span>}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="p-1.5 rounded-lg text-grey-muted hover:text-heading transition-colors disabled:opacity-40 ml-2 flex-shrink-0"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body : apercu du courriel OU message "aucun courriel" */}
          <div className="px-5 py-4 space-y-3">
            {hasEmail ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                    <Mail size={13} className="text-accent" />
                  </span>
                  <span className="text-xs font-semibold text-heading">
                    {tx({ fr: 'Apercu du courriel au client', en: 'Client email preview', es: 'Vista previa' })}
                  </span>
                </div>
                <div className="rounded-lg border px-3 py-3 space-y-2" style={{ borderColor: 'var(--bg-input-border)', background: 'var(--bg-input)' }}>
                  <div className="text-[11px] text-grey-muted">
                    <span className="font-semibold">{tx({ fr: 'Objet', en: 'Subject', es: 'Asunto' })} :</span>{' '}
                    <span className="text-heading">{email.subject}</span>
                  </div>
                  <div className="border-t pt-2 text-xs text-heading whitespace-pre-wrap leading-relaxed font-mono" style={{ borderColor: 'var(--bg-input-border)' }}>
                    {email.preview}
                  </div>
                </div>
                {email.notes && (
                  <p className="flex items-start gap-1.5 text-[11px] text-grey-muted leading-relaxed">
                    <AlertTriangle size={11} className="flex-shrink-0 mt-0.5 text-yellow-400" />
                    {email.notes}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border px-3 py-3" style={{ borderColor: 'var(--bg-input-border)', background: 'var(--bg-input)' }}>
                <span className="w-7 h-7 rounded-lg bg-grey-muted/15 flex items-center justify-center flex-shrink-0">
                  <MailX size={13} className="text-grey-muted" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-heading">
                    {tx({ fr: 'Aucun courriel prevu', en: 'No email planned', es: 'Sin correo' })}
                  </p>
                  <p className="text-[11px] text-grey-muted mt-0.5">
                    {tx({
                      fr: `Le statut "${toLabel}" ne declenche aucun courriel automatique cote client.`,
                      en: `Status "${toLabel}" does not trigger any automatic client email.`,
                      es: `Estado "${toLabel}" no envia correo automatico.`,
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 px-5 py-4 border-t" style={dividerBorder}>
            <button
              type="button"
              onClick={() => onConfirm(false)}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-colors hover:brightness-110 disabled:opacity-40"
              style={neutralBtnStyle}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <MailX size={14} />}
              {tx({
                fr: 'Changer le statut SANS courriel',
                en: 'Change status WITHOUT email',
                es: 'Cambiar SIN correo',
              })}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(true)}
              disabled={submitting || !hasEmail}
              title={!hasEmail ? tx({
                fr: 'Aucun courriel a envoyer pour ce statut.',
                en: 'No email to send for this status.',
                es: 'Sin correo.',
              }) : undefined}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {tx({
                fr: 'Changer le statut ET envoyer le courriel',
                en: 'Change status AND send email',
                es: 'Cambiar Y enviar',
              })}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="w-full py-2 rounded-lg text-xs text-grey-muted hover:text-heading transition-colors disabled:opacity-40"
              style={{ background: 'transparent' }}
            >
              {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default StatusChangeModal;
