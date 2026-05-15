/**
 * EditOrderItemsModal (14 mai 2026)
 *
 * Modal pour modifier les LIGNES d'une commande deja creee. Permet a
 * l'admin de :
 *   - ajouter/supprimer des lignes (Produit ou Service)
 *   - editer description, quantite, lineTotal, isService
 *   - voir le recalcul automatique TPS (5%) + TVQ (9.975%) + total
 *
 * POST PUT /orders/:id/items (cf. updateOrderItems dans adminService.js)
 *
 * Pattern : reutilise la meme logique que CreateManualOrderModal (2 boutons
 * Produit/Service, badge bleu service, recalcul live des taxes) mais pour
 * editer une commande EXISTANTE au lieu d'en creer une nouvelle.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Loader2, Save, Calculator } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { updateOrderItems } from '../services/adminService';

const TPS_RATE = 0.05;
const TVQ_RATE = 0.09975;

// Inline style helper - reuse les CSS vars du theme
const inputBg = { background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-heading)' };

// Convertit un montant en cents (stocke en BDD) vers dollars (UI)
function centsToDollars(cents) {
  const n = Number(cents);
  return Number.isFinite(n) ? n / 100 : 0;
}

export default function EditOrderItemsModal({ order, onClose, onSaved }) {
  const { tx } = useLang();
  const submittingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Init items depuis order.items existants. Backend stocke les lineTotal
  // en dollars (pas en cents) puisque les items sont du JSON libre.
  // On preserve les champs pass-through (productName, image, size, etc.)
  // dans `_extra` pour les re-envoyer au backend sans les afficher.
  const [items, setItems] = useState(() => {
    const src = Array.isArray(order?.items) ? order.items : [];
    if (src.length === 0) {
      return [{ description: '', quantity: 1, lineTotal: '', isService: false, _extra: {} }];
    }
    return src.map((it) => {
      const description = String(it.description || it.productName || '').trim();
      const quantity = parseInt(it.quantity, 10) || 1;
      // Resolution lineTotal : lineTotal direct > totalPrice > unitPrice * qty
      let lineTotal = Number(it.lineTotal);
      if (!Number.isFinite(lineTotal) || lineTotal <= 0) lineTotal = Number(it.totalPrice);
      if (!Number.isFinite(lineTotal) || lineTotal <= 0) lineTotal = (Number(it.unitPrice) || 0) * quantity;
      lineTotal = Number.isFinite(lineTotal) ? lineTotal : 0;
      // Pass-through metadata - on les preserve mais on ne les affiche pas
      const _extra = {};
      for (const k of ['productName', 'size', 'finish', 'shape', 'image', 'uploadedFiles', 'notes', 'sku', 'slug', 'packDetails', 'packComposition']) {
        if (it[k] !== undefined) _extra[k] = it[k];
      }
      return {
        description: description || (it.productName || ''),
        quantity,
        lineTotal: lineTotal > 0 ? String(lineTotal.toFixed(2)) : '',
        isService: it.isService === true,
        _extra,
      };
    });
  });

  // Shipping pre-rempli depuis l'order existant (cents -> dollars)
  const [shipping, setShipping] = useState(() => {
    const sd = centsToDollars(order?.shipping);
    return sd > 0 ? String(sd.toFixed(2)) : '';
  });

  // ESC pour fermer
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onClose]);

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };
  const addProductItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, lineTotal: '', isService: false, _extra: {} }]);
  };
  const addServiceItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, lineTotal: '', isService: true, _extra: {} }]);
  };
  const removeItem = (idx) => {
    setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  // Calcul live des totaux pour preview UI
  const parsedItems = items.map((it) => ({
    description: String(it.description || '').trim(),
    quantity: parseInt(it.quantity, 10) || 0,
    lineTotal: parseFloat(String(it.lineTotal).replace(',', '.')) || 0,
    isService: it.isService === true,
    _extra: it._extra || {},
  }));
  const subtotal = parsedItems.reduce((s, it) => s + it.lineTotal, 0);
  const shippingNum = parseFloat(String(shipping).replace(',', '.')) || 0;
  const tps = Math.round(subtotal * TPS_RATE * 100) / 100;
  const tvq = Math.round(subtotal * TVQ_RATE * 100) / 100;
  const grandTotal = Math.round((subtotal + shippingNum + tps + tvq) * 100) / 100;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (submittingRef.current) return;

    const validItems = parsedItems.filter((it) => it.description && it.quantity > 0 && it.lineTotal >= 0);
    if (validItems.length === 0) {
      setError(tx({
        fr: 'Au moins une ligne avec description, quantite et prix requise',
        en: 'At least one line with description, quantity and price required',
        es: 'Al menos una linea requerida',
      }));
      return;
    }

    submittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const payloadItems = validItems.map((it) => ({
        // Pass-through metadata (productName, size, image, etc.) preserve
        ...it._extra,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.quantity > 0 ? Math.round((it.lineTotal / it.quantity) * 100) / 100 : it.lineTotal,
        lineTotal: it.lineTotal,
        isService: it.isService,
      }));
      const { data } = await updateOrderItems(order.documentId, payloadItems, shippingNum);
      onSaved?.(data?.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || tx({
        fr: 'Erreur lors de la sauvegarde',
        en: 'Save error',
        es: 'Error al guardar',
      }));
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl card-bg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={submit} className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-heading">
                {tx({ fr: 'Modifier les articles', en: 'Edit items', es: 'Editar articulos' })}
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="p-1.5 rounded-lg text-grey-muted hover:text-heading hover:bg-glass transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info contextuelle commande */}
            <div className="text-xs text-grey-muted">
              {tx({ fr: 'Commande de', en: 'Order from', es: 'Pedido de' })}{' '}
              <strong className="text-heading">{order?.customerName || order?.companyName || '—'}</strong>
              {order?.invoiceNumber && (
                <> · {tx({ fr: 'Facture', en: 'Invoice', es: 'Factura' })} <strong className="text-heading">{order.invoiceNumber}</strong></>
              )}
            </div>

            {/* Lignes items */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] text-grey-muted uppercase tracking-wider">
                  {tx({ fr: 'Lignes de facture', en: 'Invoice lines', es: 'Lineas' })} *
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={addProductItem}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-accent text-[11px] font-semibold transition-colors border"
                    style={{ background: 'var(--bg-glass)', borderColor: 'var(--bg-input-border)' }}
                  >
                    <Plus size={12} />
                    {tx({ fr: 'Produit', en: 'Product', es: 'Producto' })}
                  </button>
                  <button
                    type="button"
                    onClick={addServiceItem}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors border bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                  >
                    <Plus size={12} />
                    {tx({ fr: 'Service', en: 'Service', es: 'Servicio' })}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_70px_90px_32px] gap-2 mb-1 px-0.5">
                <span className="text-[13px] text-grey-muted uppercase tracking-wider">
                  {tx({ fr: 'Description', en: 'Description', es: 'Descripcion' })}
                </span>
                <span className="text-[13px] text-grey-muted uppercase tracking-wider text-center">
                  {tx({ fr: 'Qté', en: 'Qty', es: 'Cant.' })}
                </span>
                <span className="text-[13px] text-grey-muted uppercase tracking-wider text-right">
                  {tx({ fr: 'Total ($)', en: 'Total ($)', es: 'Total ($)' })}
                </span>
                <span></span>
              </div>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_70px_90px_32px] gap-2 items-start">
                    <div className="relative">
                      <input
                        type="text"
                        value={it.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder={it.isService
                          ? tx({ fr: 'Developpement web - 10 heures', en: 'Web dev - 10 hours', es: 'Desarrollo - 10 hr' })
                          : tx({ fr: '100x Stickers Standard', en: '100x Standard Stickers', es: '100x Stickers' })}
                        className={`w-full rounded-lg text-sm py-2 outline-none border focus:border-accent ${it.isService ? 'px-3 pr-16' : 'px-3'}`}
                        style={inputBg}
                      />
                      {it.isService && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 pointer-events-none">
                          {tx({ fr: 'Service', en: 'Service', es: 'Servicio' })}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      placeholder="1"
                      className="rounded-lg text-sm px-2 py-2 outline-none border focus:border-accent text-center"
                      style={inputBg}
                    />
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={it.lineTotal}
                        onChange={(e) => updateItem(idx, 'lineTotal', e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg text-sm px-2 py-2 pr-6 outline-none border focus:border-accent text-right"
                        style={inputBg}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-grey-muted text-xs">$</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="h-9 w-8 rounded-lg text-grey-muted hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping */}
            <div className="grid grid-cols-[1fr_120px] gap-3 items-center">
              <label className="text-sm text-grey-muted">
                {tx({ fr: 'Frais de livraison ($)', en: 'Shipping ($)', es: 'Envio ($)' })}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                placeholder="0.00"
                className="rounded-lg text-sm px-3 py-2 outline-none border focus:border-accent text-right"
                style={inputBg}
              />
            </div>

            {/* Recap totaux live */}
            <div className="rounded-lg p-3 space-y-1 text-sm" style={{ background: 'var(--bg-glass)' }}>
              <div className="flex items-center gap-1.5 text-grey-muted text-[11px] uppercase tracking-wider mb-1">
                <Calculator size={11} />
                {tx({ fr: 'Recalcul automatique', en: 'Auto recalculation', es: 'Recalculo' })}
              </div>
              <div className="flex justify-between text-grey-muted"><span>{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</span><span className="text-heading">{subtotal.toFixed(2)}$</span></div>
              <div className="flex justify-between text-grey-muted"><span>{tx({ fr: 'Livraison', en: 'Shipping', es: 'Envio' })}</span><span className="text-heading">{shippingNum.toFixed(2)}$</span></div>
              <div className="flex justify-between text-grey-muted"><span>TPS (5%)</span><span className="text-heading">{tps.toFixed(2)}$</span></div>
              <div className="flex justify-between text-grey-muted"><span>TVQ (9.975%)</span><span className="text-heading">{tvq.toFixed(2)}$</span></div>
              <div className="flex justify-between text-base font-bold pt-1 border-t border-white/10 mt-1">
                <span className="text-heading">{tx({ fr: 'Total', en: 'Total', es: 'Total' })}</span>
                <span className="text-accent">{grandTotal.toFixed(2)}$</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm text-grey-muted hover:text-heading transition-colors disabled:opacity-50"
              >
                {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
