import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, AlertTriangle, Loader2, CheckCircle, ArrowRight, Users, Mail,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { mergeUsers } from '../services/adminService';

/**
 * UserMergeModal - outil admin de fusion de 2 comptes utilisateurs.
 *
 * Scenario principal : un client a fait un achat invite (guest checkout) puis
 * s'est cree un compte plus tard avec le meme email OU un autre email.
 * L'admin utilise cet outil pour consolider l'historique d'achat dans UN
 * seul profil.
 *
 * Pattern UX :
 *   1. 2 champs email (avec liste deroulante autocomplete des comptes existants).
 *      Le source peut etre pre-rempli par l'action "Fusionner vers" d'une row.
 *   2. Bandeau d'avertissement rouge clair (action irreversible).
 *   3. Bouton "Confirmer la fusion" (disable si source === target ou email invalide).
 *   4. Apres succes : ecran de rapport avec counts par entite migree.
 *
 * Props :
 *   users         - Array d'objets user deja charges par AdminUtilisateurs
 *                   { email, fullName, isGuest, orderCount, totalSpent }
 *   initialSource - email pre-selectionne pour le champ source (optionnel)
 *   onClose()     - ferme le modal
 *   onMerged()    - rafraichit la liste parent apres succes
 */
function UserMergeModal({ users = [], initialSource = '', onClose, onMerged }) {
  const { tx } = useLang();
  const [sourceEmail, setSourceEmail] = useState(initialSource || '');
  const [targetEmail, setTargetEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 60);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  // Liste deroulante : tous les users ayant un email. On trie par plus actif en haut.
  const emailOptions = useMemo(() => {
    return (users || [])
      .filter(u => u && u.email)
      .map(u => ({
        email: u.email,
        label: u.fullName ? `${u.fullName} - ${u.email}` : u.email,
        isGuest: !!u.isGuest,
        orderCount: u.orderCount || 0,
        totalSpent: u.totalSpent || 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent);
  }, [users]);

  // Preview : donnees associees au compte source qui seront migrees
  const sourcePreview = useMemo(() => {
    if (!sourceEmail) return null;
    const u = (users || []).find(x => String(x.email || '').toLowerCase() === sourceEmail.toLowerCase());
    return u || null;
  }, [sourceEmail, users]);

  const targetPreview = useMemo(() => {
    if (!targetEmail) return null;
    return (users || []).find(x => String(x.email || '').toLowerCase() === targetEmail.toLowerCase()) || null;
  }, [targetEmail, users]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const srcValid = emailRegex.test(sourceEmail.trim());
  const tgtValid = emailRegex.test(targetEmail.trim());
  const sameEmail = sourceEmail.trim().toLowerCase() === targetEmail.trim().toLowerCase();
  const canSubmit = srcValid && tgtValid && !sameEmail && !submitting;

  const submit = async () => {
    setError('');
    if (!canSubmit) {
      if (!srcValid || !tgtValid) setError(tx({ fr: 'Format email invalide.', en: 'Invalid email format.', es: 'Formato email invalido.' }));
      else if (sameEmail) setError(tx({ fr: 'Source et cible doivent etre differents.', en: 'Source and target must differ.', es: 'Source y target deben ser diferentes.' }));
      return;
    }
    setSubmitting(true);
    try {
      const res = await mergeUsers(sourceEmail, targetEmail);
      setResult(res.data?.data || res.data);
      onMerged?.();
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

  // Theme-adaptive styles
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
          className="w-full max-w-xl my-8 rounded-2xl border shadow-2xl overflow-hidden"
          style={modalBg}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b" style={dividerBorder}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-accent" />
              </span>
              <h3 className="text-heading font-heading font-bold text-base truncate">
                {result
                  ? tx({ fr: 'Fusion terminee', en: 'Merge complete', es: 'Fusion completada' })
                  : tx({ fr: 'Fusionner deux utilisateurs', en: 'Merge two users', es: 'Fusionar dos usuarios' })}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 rounded-lg text-grey-muted hover:text-heading transition-colors disabled:opacity-40 flex-shrink-0"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Success state */}
          {result ? (
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="text-heading font-semibold">
                    {tx({ fr: 'Fusion reussie', en: 'Merge successful', es: 'Fusion exitosa' })}
                  </p>
                  <p className="text-grey-muted text-xs mt-0.5">
                    {result.sourceEmail} <ArrowRight className="inline mx-1" size={10} /> {result.targetEmail}
                  </p>
                </div>
              </div>

              <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'var(--bg-glass)' }}>
                <h4 className="text-heading font-semibold mb-2 text-[11px] uppercase tracking-wider">
                  {tx({ fr: 'Donnees migrees', en: 'Data migrated', es: 'Datos migrados' })}
                </h4>
                <div className="flex justify-between text-grey-muted">
                  <span>{tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' })}</span>
                  <span className="text-heading font-mono">{result.updatedOrders}</span>
                </div>
                <div className="flex justify-between text-grey-muted">
                  <span>{tx({ fr: 'Temoignages', en: 'Testimonials', es: 'Testimonios' })}</span>
                  <span className="text-heading font-mono">{result.updatedTestimonials}</span>
                </div>
                <div className="flex justify-between text-grey-muted">
                  <span>{tx({ fr: 'Soumissions contact', en: 'Contact submissions', es: 'Envios' })}</span>
                  <span className="text-heading font-mono">{result.updatedContactSubmissions}</span>
                </div>
                <div className="flex justify-between text-grey-muted">
                  <span>{tx({ fr: 'Demandes edition artiste', en: 'Artist edit requests', es: 'Solicitudes' })}</span>
                  <span className="text-heading font-mono">{result.updatedArtistEditRequests}</span>
                </div>
                <div className="pt-1.5 mt-1.5 border-t border-white/5 flex justify-between text-grey-muted">
                  <span>{tx({ fr: 'Compte source supprime', en: 'Source account deleted', es: 'Cuenta origen eliminada' })}</span>
                  <span className="text-heading font-mono">
                    {result.deletedSourceUserRole || result.deletedSourceClient
                      ? tx({ fr: 'Oui', en: 'Yes', es: 'Si' })
                      : tx({ fr: 'Aucun', en: 'None', es: 'Ninguno' })}
                  </span>
                </div>
              </div>

              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs text-yellow-300">
                  <p className="font-semibold mb-1">
                    {tx({ fr: 'Avertissements', en: 'Warnings', es: 'Advertencias' })} ({result.errors.length})
                  </p>
                  <ul className="space-y-0.5 text-[11px] text-yellow-200/80 font-mono max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-lg font-semibold text-sm bg-accent text-white hover:brightness-110 transition-all"
              >
                {tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
              </button>
            </div>
          ) : (
            /* Form state */
            <div className="px-5 py-5 space-y-4">
              {/* Warning rouge */}
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-200 leading-relaxed">
                  <p className="font-bold text-red-300 mb-1 uppercase tracking-wider text-[10px]">
                    {tx({ fr: 'Attention - Action irreversible', en: 'Warning - Irreversible', es: 'Atencion - Irreversible' })}
                  </p>
                  {tx({
                    fr: 'Toutes les commandes, temoignages et soumissions du compte source seront transferes au compte cible. Le compte source sera ensuite definitivement supprime. Cette action ne peut PAS etre annulee.',
                    en: 'All orders, testimonials and submissions from the source account will be transferred to the target. The source account will then be permanently deleted. This action CANNOT be undone.',
                    es: 'Todos los pedidos, testimonios y envios del origen seran transferidos al destino. La cuenta origen sera eliminada definitivamente.',
                  })}
                </div>
              </div>

              {/* Source email */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-grey-muted flex items-center gap-1.5 mb-1.5">
                  <Mail size={11} />
                  {tx({
                    fr: 'Compte source (a supprimer)',
                    en: 'Source account (to delete)',
                    es: 'Cuenta origen (a eliminar)',
                  })} *
                </label>
                <input
                  ref={firstInputRef}
                  type="email"
                  list="merge-src-options"
                  value={sourceEmail}
                  onChange={(e) => { setSourceEmail(e.target.value); setError(''); }}
                  placeholder="guest@example.com"
                  className="w-full rounded-lg text-sm px-3 py-2.5 outline-none border focus:border-red-400/60"
                  style={inputBg}
                  disabled={submitting}
                />
                <datalist id="merge-src-options">
                  {emailOptions.map(o => <option key={o.email} value={o.email}>{o.label}</option>)}
                </datalist>
                {sourcePreview && (
                  <p className="text-[11px] text-grey-muted mt-1">
                    {sourcePreview.fullName || tx({ fr: 'Sans nom', en: 'Unnamed', es: 'Sin nombre' })}
                    {' · '}
                    <span className="text-heading">{sourcePreview.orderCount || 0} {tx({ fr: 'commandes', en: 'orders', es: 'pedidos' })}</span>
                    {sourcePreview.isGuest && <span className="ml-1 text-accent">({tx({ fr: 'invite', en: 'guest', es: 'invitado' })})</span>}
                  </p>
                )}
              </div>

              {/* Arrow visuel */}
              <div className="flex items-center justify-center text-grey-muted">
                <ArrowRight size={18} className="text-accent" />
              </div>

              {/* Target email */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-grey-muted flex items-center gap-1.5 mb-1.5">
                  <Mail size={11} />
                  {tx({
                    fr: 'Compte cible (a conserver)',
                    en: 'Target account (to keep)',
                    es: 'Cuenta destino (a conservar)',
                  })} *
                </label>
                <input
                  type="email"
                  list="merge-tgt-options"
                  value={targetEmail}
                  onChange={(e) => { setTargetEmail(e.target.value); setError(''); }}
                  placeholder="client@example.com"
                  className="w-full rounded-lg text-sm px-3 py-2.5 outline-none border focus:border-accent"
                  style={inputBg}
                  disabled={submitting}
                />
                <datalist id="merge-tgt-options">
                  {emailOptions.map(o => <option key={o.email} value={o.email}>{o.label}</option>)}
                </datalist>
                {targetPreview && (
                  <p className="text-[11px] text-grey-muted mt-1">
                    {targetPreview.fullName || tx({ fr: 'Sans nom', en: 'Unnamed', es: 'Sin nombre' })}
                    {' · '}
                    <span className="text-heading">{targetPreview.orderCount || 0} {tx({ fr: 'commandes existantes', en: 'existing orders', es: 'pedidos' })}</span>
                  </p>
                )}
              </div>

              {sameEmail && sourceEmail && (
                <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {tx({
                    fr: 'Source et cible sont identiques - choisissez deux comptes differents.',
                    en: 'Source and target are identical.',
                    es: 'Son identicos.',
                  })}
                </p>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
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
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit}
                  className="flex-[2] py-2.5 rounded-lg bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? <><Loader2 size={14} className="animate-spin" /> {tx({ fr: 'Fusion en cours...', en: 'Merging...', es: 'Fusionando...' })}</>
                    : <>{tx({ fr: 'Confirmer la fusion', en: 'Confirm merge', es: 'Confirmar fusion' })}</>}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default UserMergeModal;
