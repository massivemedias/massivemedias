import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

/**
 * Modal d'ajustement manuel du total d'une commande.
 * Appele PUT /api/orders/:documentId/total avec { total, reason }.
 * Le backend logge l'ajustement dans les notes admin avec timestamp + auteur.
 *
 * Props:
 *   order: { documentId, total (en cents), customerName, ... }
 *   onClose(): ferme le modal sans rien faire
 *   onUpdated(updatedOrder): appele apres succes, permet au parent de refresh
 */
function EditOrderTotalModal({ order, onClose, onUpdated }) {
  const { tx } = useLang();
  // Affichage en dollars (l'utilisateur tape 100.60 pas 10060)
  const initialDollars = ((Number(order?.total) || 0) / 100).toFixed(2);
  const [totalInput, setTotalInput] = useState(initialDollars);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Autofocus sur l'input total + selectionne le texte pour facilement remplacer
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
  }, []);

  // Echap ferme
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e?.preventDefault?.();
    setError('');
    const asNumber = parseFloat(String(totalInput).replace(',', '.'));
    if (!Number.isFinite(asNumber) || asNumber < 0) {
      setError(tx({
        fr: 'Montant invalide. Entre un nombre en dollars (ex: 100.60)',
        en: 'Invalid amount. Enter a number in dollars (ex: 100.60)',
        es: 'Monto invalido. Introduce un numero en dolares (ej: 100.60)',
      }));
      return;
    }
    if (!reason.trim()) {
      setError(tx({
        fr: 'Raison obligatoire pour traceabilite (ex: "Ajout balance 4\" + rabais artiste")',
        en: 'Reason required for audit trail (ex: "4\" balance added + artist discount")',
        es: 'Razon obligatoria para trazabilidad',
      }));
      return;
    }

    setLoading(true);
    try {
      const res = await api.put(`/orders/${order.documentId}/total`, {
        total: asNumber,
        reason: reason.trim(),
      });
      onUpdated?.(res.data?.data || res.data);
      onClose();
    } catch (err) {
      console.error('updateTotal error:', err);
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || 'Erreur inconnue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const previousDollars = ((Number(order?.total) || 0) / 100).toFixed(2);
  const parsedPreview = parseFloat(String(totalInput).replace(',', '.'));
  const delta = Number.isFinite(parsedPreview) ? parsedPreview - (Number(order?.total) || 0) / 100 : NaN;

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[#1a0030] border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-heading font-heading font-bold text-lg">
            {tx({ fr: 'Ajuster le total', en: 'Adjust total', es: 'Ajustar total' })}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-grey-muted hover:text-heading hover:bg-white/5 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Contexte commande */}
          <div className="rounded-lg bg-black/20 px-3 py-2.5 text-xs space-y-0.5">
            <p className="text-grey-muted">{tx({ fr: 'Commande de', en: 'Order by', es: 'Pedido de' })}:</p>
            <p className="text-heading font-semibold">{order?.customerName || '?'}</p>
            <p className="text-grey-muted">{order?.customerEmail}</p>
            <p className="text-grey-muted mt-1">
              {tx({ fr: 'Total actuel', en: 'Current total', es: 'Total actual' })}: <span className="text-heading font-bold">{previousDollars}$</span>
            </p>
          </div>

          {/* Input total */}
          <div>
            <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
              {tx({ fr: 'Nouveau total', en: 'New total', es: 'Nuevo total' })} ($CAD)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                className="w-full rounded-lg bg-black/30 text-heading text-xl font-bold px-3 py-3 pr-10 outline-none border border-white/10 focus:border-accent"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted font-semibold">$</span>
            </div>
            {Number.isFinite(delta) && Math.abs(delta) > 0.001 && (
              <p className={`text-[11px] mt-1 ${delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {delta > 0
                  ? tx({ fr: `+ ${delta.toFixed(2)}$ (balance ajoutee)`, en: `+ $${delta.toFixed(2)} (balance added)`, es: `+ $${delta.toFixed(2)} (saldo anadido)` })
                  : tx({ fr: `- ${Math.abs(delta).toFixed(2)}$ (rabais)`, en: `- $${Math.abs(delta).toFixed(2)} (discount)`, es: `- $${Math.abs(delta).toFixed(2)} (descuento)` })
                }
              </p>
            )}
          </div>

          {/* Raison */}
          <div>
            <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
              {tx({ fr: 'Raison (obligatoire)', en: 'Reason (required)', es: 'Razon (obligatoria)' })}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={tx({
                fr: 'Ex: Ajout balance format 4" Lio Taylor + correction taxes',
                en: 'Ex: Added 4" format balance Lio Taylor + tax correction',
                es: 'Ej: Saldo formato 4" Lio Taylor + correccion impuestos',
              })}
              className="w-full rounded-lg bg-black/30 text-heading text-sm px-3 py-2.5 outline-none border border-white/10 focus:border-accent resize-none"
            />
            <p className="text-[10px] text-grey-muted mt-1">
              {tx({
                fr: 'Enregistre dans les notes avec date + auteur pour traceabilite',
                en: 'Logged in notes with date + author for audit trail',
                es: 'Registrado en notas con fecha + autor para auditoria',
              })}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 bg-black/30 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-white/5 text-grey-muted font-semibold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-accent text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditOrderTotalModal;
