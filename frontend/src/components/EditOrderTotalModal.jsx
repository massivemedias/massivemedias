import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Loader2, AlertCircle, Receipt } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

/**
 * Modal d'ajustement du SOUS-TOTAL d'une commande (la modification cascade
 * automatiquement sur TPS, TVQ et Grand Total).
 *
 * FIX-COMPTA (27 avril 2026) : avant ce fix, l'admin editait le Grand Total
 * directement, ce qui laissait les lignes TPS/TVQ stockees calculees sur
 * l'ancien sous-total = exports comptables faux + factures incoherentes.
 * Maintenant on edite la SOURCE (sous-total) et tout est derive de facon
 * deterministe : TPS = subtotal * 5%, TVQ = subtotal * 9.975%, Grand Total
 * = subtotal + TPS + TVQ + livraison.
 *
 * Appele PUT /api/orders/:documentId/total avec { subtotal, reason }.
 * Le backend recalcule TPS/TVQ/total et cascade sur l'Invoice liee.
 *
 * Props:
 *   order: { documentId, subtotal (cents), tps (cents), tvq (cents), total (cents), shipping (cents), customerName, ... }
 *   onClose(): ferme le modal sans rien faire
 *   onUpdated(updatedOrder): appele apres succes, permet au parent de refresh
 */
function EditOrderTotalModal({ order, onClose, onUpdated }) {
  const { tx } = useLang();

  // Conversions cents -> dollars pour l'affichage
  const previousSubtotal = (Number(order?.subtotal) || 0) / 100;
  const previousTps = (Number(order?.tps) || 0) / 100;
  const previousTvq = (Number(order?.tvq) || 0) / 100;
  const previousTotal = (Number(order?.total) || 0) / 100;
  const shippingDollars = (Number(order?.shipping) || 0) / 100;

  // FIX-COMPTA : detection automatique d'une commande hors-QC.
  // Si previousTps == 0 ET previousTvq == 0 sur un sous-total non-nul, on
  // suppose hors-QC et on ne re-applique PAS automatiquement les taxes.
  // Pour une commande totalement vide, on utilise les taux QC par defaut.
  const isQcOrder = previousTps > 0 || previousTvq > 0 || previousSubtotal === 0;

  const TPS_RATE = 0.05;
  const TVQ_RATE = 0.09975;

  // Initial value = sous-total actuel (string pour controller l'input)
  const [subtotalInput, setSubtotalInput] = useState(previousSubtotal.toFixed(2));
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    // Autofocus + select pour facilement remplacer
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
  }, []);

  // Echap ferme (mais pas pendant loading - eviter de fermer pendant l'enregistrement)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, loading]);

  // Calcul live du breakdown a partir du sous-total saisi.
  // useMemo evite les re-calculs inutiles a chaque keystroke et stabilise la
  // reference pour le rendu conditionnel.
  const preview = useMemo(() => {
    const parsed = parseFloat(String(subtotalInput).replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { valid: false, subtotal: 0, tps: 0, tvq: 0, total: 0, delta: NaN };
    }
    // Round each amount to 2 decimals (cents) before summing - meme logique que le backend
    const tps = isQcOrder ? Math.round(parsed * TPS_RATE * 100) / 100 : 0;
    const tvq = isQcOrder ? Math.round(parsed * TVQ_RATE * 100) / 100 : 0;
    const total = Math.round((parsed + tps + tvq + shippingDollars) * 100) / 100;
    const delta = parsed - previousSubtotal;
    return { valid: true, subtotal: parsed, tps, tvq, total, delta };
  }, [subtotalInput, isQcOrder, shippingDollars, previousSubtotal]);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (submittingRef.current) return;
    setError('');

    if (!preview.valid) {
      setError(tx({
        fr: 'Sous-total invalide. Entre un nombre en dollars (ex: 160.00)',
        en: 'Invalid subtotal. Enter a number in dollars (ex: 160.00)',
        es: 'Subtotal invalido. Introduce un numero en dolares (ej: 160.00)',
      }));
      return;
    }
    if (!reason.trim()) {
      setError(tx({
        fr: 'Raison obligatoire pour traceabilite (ex: "Rabais artiste 10$" ou "Correction prix unitaire")',
        en: 'Reason required for audit trail (ex: "Artist discount $10")',
        es: 'Razon obligatoria para trazabilidad',
      }));
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      // FIX-COMPAT (27 avril 2026) : on envoie LE BUNDLE COMPLET (subtotal +
      // tps + tvq + total) en Number explicite. Le frontend deploye via GH
      // Pages part en quelques minutes alors que le backend Render peut prendre
      // 5-10 min (cold start, build TS + restart container). Pendant cette
      // fenetre de desynchronisation, l'ancien backend n'accepte que `total`,
      // le nouveau accepte `subtotal` (recalcule). En envoyant les deux :
      //   - Ancien backend : ignore subtotal/tps/tvq, valide total -> OK
      //   - Nouveau backend : utilise subtotal en priorite (source de verite),
      //     ignore tps/tvq/total qu'il recalcule lui-meme -> OK
      // Conversion explicite via Number(...) pour neutraliser tout edge case
      // ou un input controle aurait une valeur string en interne.
      const payload = {
        subtotal: Number(preview.subtotal),
        tps: Number(preview.tps),
        tvq: Number(preview.tvq),
        total: Number(preview.total),
        reason: reason.trim(),
      };
      const res = await api.put(`/orders/${order.documentId}/total`, payload);
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
      submittingRef.current = false;
    }
  };

  const fmt = (n) => `${(Number(n) || 0).toFixed(2)}$`;

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={loading ? undefined : onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[#1a0030] border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2">
            <Receipt size={18} className="text-accent" />
            {tx({ fr: 'Ajuster le sous-total', en: 'Adjust subtotal', es: 'Ajustar subtotal' })}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-grey-muted hover:text-heading hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
              <div>
                <p className="text-[10px] text-grey-muted uppercase tracking-wider">
                  {tx({ fr: 'Sous-total actuel', en: 'Current subtotal', es: 'Subtotal actual' })}
                </p>
                <p className="text-heading font-bold">{fmt(previousSubtotal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-grey-muted uppercase tracking-wider">
                  {tx({ fr: 'Total TTC actuel', en: 'Current grand total', es: 'Total actual' })}
                </p>
                <p className="text-heading font-bold">{fmt(previousTotal)}</p>
              </div>
            </div>
          </div>

          {/* Input sous-total */}
          <div>
            <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
              {tx({ fr: 'Nouveau sous-total (HT)', en: 'New subtotal (before tax)', es: 'Nuevo subtotal' })} ($CAD)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={subtotalInput}
                onChange={(e) => setSubtotalInput(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg bg-black/30 text-heading text-xl font-bold px-3 py-3 pr-10 outline-none border border-white/10 focus:border-accent disabled:opacity-50"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted font-semibold">$</span>
            </div>
            {Number.isFinite(preview.delta) && Math.abs(preview.delta) > 0.001 && (
              <p className={`text-[11px] mt-1 ${preview.delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {preview.delta > 0
                  ? tx({ fr: `+ ${preview.delta.toFixed(2)}$ (sous-total augmente)`, en: `+ $${preview.delta.toFixed(2)} (subtotal up)`, es: `+ $${preview.delta.toFixed(2)}` })
                  : tx({ fr: `- ${Math.abs(preview.delta).toFixed(2)}$ (rabais applique)`, en: `- $${Math.abs(preview.delta).toFixed(2)} (discount applied)`, es: `- $${Math.abs(preview.delta).toFixed(2)} (descuento)` })
                }
              </p>
            )}
          </div>

          {/* FIX-COMPTA : breakdown live read-only - l'admin VOIT exactement ce
              qui sera persiste avant de cliquer Enregistrer. Empeche les surprises. */}
          <div className="rounded-lg border border-white/10 overflow-hidden bg-black/20">
            <div className="px-3 py-2 border-b border-white/5 bg-white/5">
              <p className="text-[10px] text-grey-muted uppercase tracking-wider font-semibold">
                {tx({ fr: 'Recalcul automatique', en: 'Auto-recalculation', es: 'Recalculo automatico' })}
              </p>
            </div>
            <div className="px-3 py-2 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-grey-muted">{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</span>
                <span className="text-heading font-mono">{fmt(preview.subtotal)}</span>
              </div>
              {shippingDollars > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-grey-muted">{tx({ fr: 'Livraison (inchangee)', en: 'Shipping (unchanged)', es: 'Envio' })}</span>
                  <span className="text-heading font-mono">{fmt(shippingDollars)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-grey-muted">
                  {isQcOrder
                    ? tx({ fr: 'TPS (5%)', en: 'GST (5%)', es: 'TPS (5%)' })
                    : tx({ fr: 'TPS (hors-QC: 0%)', en: 'GST (non-QC: 0%)', es: 'TPS (no-QC)' })}
                </span>
                <span className="text-heading font-mono">{fmt(preview.tps)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-grey-muted">
                  {isQcOrder
                    ? tx({ fr: 'TVQ (9.975%)', en: 'QST (9.975%)', es: 'TVQ (9.975%)' })
                    : tx({ fr: 'TVQ (hors-QC: 0%)', en: 'QST (non-QC: 0%)', es: 'TVQ (no-QC)' })}
                </span>
                <span className="text-heading font-mono">{fmt(preview.tvq)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                <span className="text-heading font-semibold uppercase tracking-wider text-xs">
                  {tx({ fr: 'Grand Total (TTC)', en: 'Grand Total (with tax)', es: 'Total con impuestos' })}
                </span>
                <span className="text-accent font-heading font-bold text-base">{fmt(preview.total)}</span>
              </div>
            </div>
            {!isQcOrder && (
              <div className="px-3 py-1.5 bg-amber-500/5 border-t border-amber-500/20">
                <p className="text-[10px] text-amber-400/80 leading-relaxed">
                  {tx({
                    fr: 'Commande detectee hors-Quebec (taxes a 0). Pour appliquer TPS/TVQ, edite manuellement les champs taxes via l\'admin Strapi.',
                    en: 'Non-QC order detected (taxes 0). To apply tax, edit manually via Strapi admin.',
                    es: 'Pedido no-QC detectado (impuestos 0).',
                  })}
                </p>
              </div>
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
              disabled={loading}
              placeholder={tx({
                fr: 'Ex: Rabais artiste 10$ accorde sur l\'edition limitee Cosmovision',
                en: 'Ex: $10 artist discount on Cosmovision limited edition',
                es: 'Ej: Descuento de 10$ aplicado',
              })}
              className="w-full rounded-lg bg-black/30 text-heading text-sm px-3 py-2.5 outline-none border border-white/10 focus:border-accent resize-none disabled:opacity-50"
            />
            <p className="text-[10px] text-grey-muted mt-1">
              {tx({
                fr: 'Enregistre dans les notes avec date + auteur + breakdown complet pour traceabilite comptable',
                en: 'Logged in notes with date + author + full breakdown for accounting audit trail',
                es: 'Registrado en notas con fecha + autor + desglose completo',
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
            disabled={loading || !preview.valid}
            aria-busy={loading}
            className="flex-1 py-2 rounded-lg bg-accent text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading
              ? tx({ fr: 'Enregistrement...', en: 'Saving...', es: 'Guardando...' })
              : tx({ fr: 'Enregistrer + recalculer', en: 'Save + recalculate', es: 'Guardar + recalcular' })}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditOrderTotalModal;
