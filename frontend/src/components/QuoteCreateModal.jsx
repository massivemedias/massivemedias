/**
 * QuoteCreateModal (6 mai 2026)
 * ---------------------------------------------------------------
 * Modal SIMPLIFIEE pour creer une soumission cliente (Quote).
 *
 * Champs : Nom client, Email (optionnel), Service / description, Prix estime.
 * POST /orders/quote-create -> backend cree un Order avec :
 *   - status='draft'
 *   - isManual=true
 *   - PAS de Stripe, PAS d'Invoice, PAS d'email
 *
 * Le devis apparait ensuite dans l'onglet "Soumissions" de AdminOrders d'ou
 * l'admin peut le convertir en commande (status='pending') une fois que le
 * client a accepte le prix. Plus tard, generer le lien Stripe via le bouton
 * standard "Regenerer Stripe link".
 *
 * Distinct de CreateManualOrderModal qui declenche un flow complet (Stripe
 * Payment Link + Invoice + email) pour des commandes deja confirmees.
 */
import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, FileText } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { createQuote } from '../services/adminService';

/**
 * Presets de prix par categorie pour accelerer la saisie de devis recurrents.
 * Source : tarifs Massive Medias 2026 + lignes les plus frequentes en historique.
 *
 * Format : { category, options: [{ description, price }] }
 * - description : libelle inscrit dans items[].description (modifiable)
 * - price : unitPrice (modifiable, qty default = 1)
 *
 * L'admin peut toujours ecrire une ligne libre sans selectionner de preset.
 */
const QUOTE_PRESETS = [
  {
    category: { fr: 'Prints (impressions fine art)', en: 'Prints', es: 'Impresiones' },
    options: [
      { description: 'Impression fine art 8x10', price: 25 },
      { description: 'Impression fine art 11x14', price: 40 },
      { description: 'Impression fine art 12x16', price: 60 },
      { description: 'Impression fine art 16x20', price: 90 },
      { description: 'Impression fine art 20x30', price: 150 },
    ],
  },
  {
    category: { fr: 'Cadres', en: 'Frames', es: 'Marcos' },
    options: [
      { description: 'Cadre noir 8x10', price: 35 },
      { description: 'Cadre noir 11x14', price: 50 },
      { description: 'Cadre 12x16', price: 70 },
      { description: 'Cadre 16x20', price: 95 },
      { description: 'Cadre 20x30', price: 140 },
    ],
  },
  {
    category: { fr: 'Stickers', en: 'Stickers', es: 'Stickers' },
    options: [
      { description: '50 collants 2"', price: 50 },
      { description: '100 collants 2"', price: 80 },
      { description: '150 collants mats (Type carte d\'affaires)', price: 106 },
      { description: '50 collants code QR', price: 35 },
      { description: '80 collants code QR', price: 45 },
      { description: '100 collants code QR', price: 55 },
    ],
  },
  {
    category: { fr: 'Affiches (grands formats)', en: 'Posters', es: 'Carteles' },
    options: [
      { description: '20 affiches 12x16 (Lustre)', price: 80 },
      { description: '60 affiches 12x16 (Lustre/Exterieur)', price: 160 },
      { description: '100 affiches 12x16 (Lustre/Exterieur)', price: 220 },
      { description: '20 affiches 18x24', price: 120 },
      { description: '50 affiches 18x24', price: 240 },
    ],
  },
  {
    category: { fr: 'Impressions (cartes / flyers)', en: 'Print runs', es: 'Tarjetas / Flyers' },
    options: [
      { description: '250 cartes d\'affaires', price: 35 },
      { description: '500 cartes d\'affaires', price: 60 },
      { description: '1000 cartes d\'affaires', price: 95 },
      { description: '250 flyers', price: 60 },
      { description: '500 flyers', price: 95 },
      { description: '1000 flyers', price: 150 },
    ],
  },
];

function QuoteCreateModal({ onClose, onCreated }) {
  const { tx } = useLang();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: '' }]);
  const [notes, setNotes] = useState('');
  // Delai de production communique au client. Stocke en debut de notes pour
  // qu'il soit visible sur la PDF facture lors de la conversion en commande.
  const [delay, setDelay] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const firstInputRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const updateItem = (idx, patch) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: '' }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  // Preset selection : "category::index" -> auto-fill description + price
  const applyPreset = (idx, presetKey) => {
    if (!presetKey) return;
    const [catIdx, optIdx] = presetKey.split('::').map(n => parseInt(n, 10));
    const opt = QUOTE_PRESETS[catIdx]?.options?.[optIdx];
    if (!opt) return;
    updateItem(idx, { description: opt.description, unitPrice: String(opt.price) });
  };

  const subtotal = items.reduce((acc, it) => {
    const q = Number(it.quantity) || 0;
    const u = parseFloat(String(it.unitPrice).replace(',', '.')) || 0;
    return acc + q * u;
  }, 0);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (submittingRef.current) return;
    setError('');

    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setError(tx({
        fr: 'Le nom du client est obligatoire.',
        en: 'Customer name is required.',
        es: 'El nombre del cliente es obligatorio.',
      }));
      return;
    }
    const validItems = items
      .filter(it => it.description?.trim() || (Number(it.unitPrice) > 0))
      .map(it => ({
        description: (it.description || '').trim() || tx({ fr: 'Service', en: 'Service', es: 'Servicio' }),
        quantity: Number(it.quantity) || 1,
        unitPrice: parseFloat(String(it.unitPrice).replace(',', '.')) || 0,
      }));
    if (validItems.length === 0) {
      setError(tx({
        fr: 'Ajoute au moins un service avec un prix.',
        en: 'Add at least one service with a price.',
        es: 'Agrega al menos un servicio con precio.',
      }));
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      // Si l'admin a saisi un delai, on le prefixe dans les notes pour qu'il
      // ressorte sur la facture PDF generee lors de la conversion en commande.
      const finalNotes = [
        delay.trim() && `Delai : ${delay.trim()}`,
        notes.trim(),
      ].filter(Boolean).join('\n\n');
      await createQuote({
        customerName: trimmedName,
        customerEmail: customerEmail.trim().toLowerCase() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: validItems,
        subtotal,
        total: subtotal,
        notes: finalNotes || undefined,
      });
      onCreated?.();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error?.message || err?.message;
      if (status === 401 || status === 403) {
        setError(tx({
          fr: 'Acces refuse - reconnexion necessaire.',
          en: 'Access denied - please re-login.',
          es: 'Acceso denegado - reconectate.',
        }));
      } else {
        setError(msg || tx({
          fr: 'Erreur de creation de la soumission.',
          en: 'Quote creation error.',
          es: 'Error al crear la cotizacion.',
        }));
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl card-bg border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center gap-3 p-5 border-b border-white/5 bg-black/50 backdrop-blur z-10">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-heading font-bold text-heading">
              {tx({ fr: 'Creer une soumission', en: 'Create quote', es: 'Crear cotizacion' })}
            </h2>
            <p className="text-xs text-grey-muted">
              {tx({
                fr: 'Devis pre-commande - aucun paiement ni email automatique.',
                en: 'Pre-order quote - no payment or automatic email.',
                es: 'Cotizacion previa - sin pago ni email automatico.',
              })}
            </p>
          </div>
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="p-1.5 rounded-lg bg-glass hover:bg-white/10 text-grey-muted hover:text-heading transition-colors flex-shrink-0 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-grey-muted text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                {tx({ fr: 'Nom du client *', en: 'Client name *', es: 'Nombre del cliente *' })}
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={submitting}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-grey-muted text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                {tx({ fr: 'Courriel', en: 'Email', es: 'Email' })}
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                disabled={submitting}
                placeholder="optionnel"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-grey-muted text-[11px] font-semibold uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Telephone', en: 'Phone', es: 'Telefono' })}
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              disabled={submitting}
              placeholder="optionnel"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-grey-muted text-[11px] font-semibold uppercase tracking-wider">
                {tx({ fr: 'Services / Description', en: 'Services / Description', es: 'Servicios / Descripcion' })}
              </label>
              <button
                type="button"
                onClick={addItem}
                disabled={submitting}
                className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline disabled:opacity-40"
              >
                <Plus size={12} />
                {tx({ fr: 'Ajouter une ligne', en: 'Add line', es: 'Anadir linea' })}
              </button>
            </div>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="space-y-1.5">
                  {/* Ligne 1 : preset selector (auto-fill description + prix) */}
                  <select
                    value=""
                    onChange={(e) => { applyPreset(idx, e.target.value); e.target.value = ''; }}
                    disabled={submitting}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-grey-muted text-xs focus:outline-none focus:border-accent disabled:opacity-50"
                  >
                    <option value="">
                      {tx({
                        fr: '+ Preset (auto-remplit description + prix)',
                        en: '+ Preset (auto-fills description + price)',
                        es: '+ Preset (auto-rellena)',
                      })}
                    </option>
                    {QUOTE_PRESETS.map((cat, cIdx) => (
                      <optgroup key={cIdx} label={cat.category.fr}>
                        {cat.options.map((opt, oIdx) => (
                          <option key={oIdx} value={`${cIdx}::${oIdx}`}>
                            {opt.description} — {opt.price}$
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {/* Ligne 2 : description + qty + prix + remove */}
                  <div className="grid grid-cols-[1fr_60px_100px_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      disabled={submitting}
                      placeholder={tx({ fr: 'Description (ou choisir un preset)', en: 'Description (or pick a preset)', es: 'Descripcion (o preset)' })}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50"
                    />
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      disabled={submitting}
                      title={tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
                      className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50 text-center"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                      disabled={submitting}
                      placeholder="$"
                      title={tx({ fr: 'Prix unitaire', en: 'Unit price', es: 'Precio unitario' })}
                      className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50 text-right"
                    />
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={submitting}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <div className="w-[30px]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-grey-muted uppercase tracking-wider">
                {tx({ fr: 'Total estime', en: 'Estimated total', es: 'Total estimado' })}
              </span>
              <span className="text-base font-bold text-heading">
                {subtotal.toFixed(2)} $
              </span>
            </div>
          </div>

          <div>
            <label className="block text-grey-muted text-[11px] font-semibold uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Delai de production', en: 'Production delay', es: 'Plazo de produccion' })}
            </label>
            <input
              type="text"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
              disabled={submitting}
              placeholder={tx({
                fr: 'Ex: 4 a 5 jours ouvrables apres reception du paiement',
                en: 'e.g. 4 to 5 business days after payment',
                es: 'Ej: 4 a 5 dias habiles tras pago',
              })}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50"
            />
            <p className="text-[10px] text-grey-muted mt-1">
              {tx({
                fr: 'Ajoute en tete des notes pour apparaitre sur la facture du client.',
                en: 'Prepended to notes so it appears on the client invoice.',
                es: 'Se anade al inicio de las notas y aparece en la factura.',
              })}
            </p>
          </div>

          <div>
            <label className="block text-grey-muted text-[11px] font-semibold uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Notes internes', en: 'Internal notes', es: 'Notas internas' })}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder={tx({
                fr: 'Visibles uniquement dans le panneau admin (pas sur la facture client).',
                en: 'Admin-only notes (not on client invoice).',
                es: 'Solo visible en el panel admin.',
              })}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50 resize-none"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-white/5 text-grey-muted font-semibold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> {tx({ fr: 'Creation...', en: 'Creating...', es: 'Creando...' })}</>
                : <><Plus size={14} /> {tx({ fr: 'Creer la soumission', en: 'Create quote', es: 'Crear cotizacion' })}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuoteCreateModal;
