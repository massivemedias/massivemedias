import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, Copy, ExternalLink, Plus, Trash2, CreditCard, Banknote } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

/**
 * Modal de creation d'une commande manuelle + facture + lien de paiement Stripe.
 * Appele POST /api/orders/manual. Le backend cree Client (si email), Order (isManual),
 * Invoice, puis genere un Stripe Payment Link. Retourne { orderId, invoiceId,
 * invoiceNumber, paymentUrl }.
 *
 * Props:
 *   onClose(): ferme le modal
 *   onCreated(result): appele apres succes pour refresh la liste parent
 */
function CreateManualOrderModal({ onClose, onCreated }) {
  const { tx } = useLang();
  const [customerName, setCustomerName] = useState('');
  // FIX-B2B (23 avril 2026) : nom de l'entreprise optionnel. Affiche sur le
  // resume admin et injecte dans le PDF facture sous le nom du client.
  const [companyName, setCompanyName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  // Note: le champ "lineTotal" est le prix TOTAL de la ligne (pas un prix unitaire).
  // Le calcul ne multiplie plus par quantity - la quantity sert uniquement de
  // descriptif ("100x Stickers") sur la facture et le paiement Stripe.
  const [items, setItems] = useState([{ description: '', quantity: 1, lineTotal: '' }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const firstInputRef = useRef(null);

  // FIX-PREPAID (23 avril 2026) : toggle paiement requis vs deja paye hors-ligne.
  // - 'stripe'    : comportement historique (cree l'order + genere un lien Stripe)
  // - 'prepaid'   : bypass Stripe, order.status='paid' direct, invoice paymentStatus='paid'
  // Si prepaid, l'admin peut preciser la methode (interac/cash/square/cheque/other)
  // pour la trace comptable.
  const [paymentMode, setPaymentMode] = useState('stripe');
  const [offlineMethod, setOfflineMethod] = useState('interac');

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, lineTotal: '' }]);
  };

  const removeItem = (idx) => {
    setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  const parsedItems = items.map(it => ({
    description: String(it.description || '').trim(),
    quantity: parseInt(it.quantity, 10) || 0,
    lineTotal: parseFloat(String(it.lineTotal).replace(',', '.')) || 0,
  }));

  // IMPORTANT: on NE multiplie PAS par quantity. La somme des "Prix total" saisis
  // par l'admin EST le subtotal. La quantity est purement descriptive.
  const subtotal = parsedItems.reduce((s, it) => s + it.lineTotal, 0);

  // FIX-TAXES (avril 2026): calcul TPS/TVQ cote client + affichage du breakdown.
  // Le backend recalcule de toute facon, mais on envoie les bons chiffres pour
  // que l'UI admin corresponde a ce que le client verra sur Stripe.
  const TPS_RATE = 0.05;
  const TVQ_RATE = 0.09975;
  const tps = Math.round(subtotal * TPS_RATE * 100) / 100;
  const tvq = Math.round(subtotal * TVQ_RATE * 100) / 100;
  const grandTotal = Math.round((subtotal + tps + tvq) * 100) / 100;

  const submit = async (e) => {
    e?.preventDefault?.();
    setError('');

    if (!customerName.trim()) {
      setError(tx({ fr: 'Nom du client requis', en: 'Customer name required', es: 'Nombre del cliente requerido' }));
      return;
    }
    const validItems = parsedItems.filter(it => it.description && it.quantity > 0 && it.lineTotal > 0);
    if (validItems.length === 0) {
      setError(tx({
        fr: 'Au moins une ligne avec description, quantite et prix requise',
        en: 'At least one line with description, quantity and price required',
        es: 'Al menos una linea con descripcion, cantidad y precio requerida',
      }));
      return;
    }

    // Payload vers le backend: on envoie `lineTotal` (nouveau champ clair) ET
    // `unitPrice` calcule = lineTotal / quantity pour compat avec le rendu existant
    // des factures ("100 x 0.85$ = 85$") sans casser les templates PDF.
    const payloadItems = validItems.map(it => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.quantity > 0 ? Math.round((it.lineTotal / it.quantity) * 100) / 100 : it.lineTotal,
      lineTotal: it.lineTotal,
    }));

    setLoading(true);
    try {
      const isAlreadyPaid = paymentMode === 'prepaid';
      const { data } = await api.post('/orders/manual', {
        customerName: customerName.trim(),
        companyName: companyName.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: payloadItems,
        subtotal,
        tps,
        tvq,
        // Le backend recalcule total = subtotal + shipping + tps + tvq, on envoie la
        // valeur UI pour trace/coherence mais le serveur reste la source de verite.
        total: grandTotal,
        notes: notes.trim() || undefined,
        // FIX-PREPAID : envoi du flag + methode pour que le backend bypass Stripe
        // et cree la commande directement en status='paid' si deja reglee.
        isAlreadyPaid,
        offlinePaymentMethod: isAlreadyPaid ? offlineMethod : undefined,
      });
      setResult(data);
      onCreated?.(data);
    } catch (err) {
      console.error('manualCreate error:', err);
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || tx({ fr: 'Erreur inconnue', en: 'Unknown error', es: 'Error desconocido' });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!result?.paymentUrl) return;
    try {
      await navigator.clipboard.writeText(result.paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
      const el = document.createElement('textarea');
      el.value = result.paymentUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // FIX-UI (avril 2026) : styles theme-adaptatifs. On utilise les CSS variables
  // globales (--bg-card-solid / --bg-input / --bg-input-border / --color-heading)
  // definies dans index.css pour que la modale suive automatiquement le theme
  // actif (Creme clair ou Massive sombre).
  const modalBg = { background: 'var(--bg-card-solid)', borderColor: 'var(--bg-input-border)' };
  const inputBg = { background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--color-heading)' };
  const dividerBorder = { borderColor: 'var(--bg-input-border)' };
  const sectionBg = { background: 'var(--bg-glass)', borderColor: 'var(--bg-input-border)' };
  const footerBg = { background: 'var(--bg-glass-alt, var(--bg-glass))', borderColor: 'var(--bg-input-border)' };
  const cancelBtnStyle = { background: 'var(--bg-glass)', color: 'var(--color-grey-muted)' };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl my-8 rounded-2xl border shadow-2xl overflow-hidden"
        style={modalBg}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={dividerBorder}>
          <h3 className="text-heading font-heading font-bold text-lg">
            {result
              ? tx({ fr: 'Facture creee', en: 'Invoice created', es: 'Factura creada' })
              : tx({ fr: 'Nouvelle commande manuelle', en: 'New manual order', es: 'Nuevo pedido manual' })}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-grey-muted hover:text-heading transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-glass)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success view : payment URL + copy */}
        {result ? (
          <div className="px-5 py-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
              <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-heading font-semibold text-sm">
                  {tx({ fr: 'Commande et facture creees', en: 'Order and invoice created', es: 'Pedido y factura creados' })}
                </p>
                <p className="text-grey-muted text-xs mt-0.5">
                  {tx({ fr: 'Numero de facture', en: 'Invoice number', es: 'Numero de factura' })}:{' '}
                  <span className="text-heading font-mono font-bold">{result.invoiceNumber}</span>
                </p>
              </div>
            </div>

            {result.paymentUrl ? (
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1.5">
                  {tx({ fr: 'Lien de paiement Stripe', en: 'Stripe payment link', es: 'Enlace de pago Stripe' })}
                </label>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 rounded-lg border px-3 py-2.5 text-sm text-heading font-mono truncate" style={inputBg}>
                    {result.paymentUrl}
                  </div>
                  <button
                    type="button"
                    onClick={copyLink}
                    className={`px-3 rounded-lg font-semibold text-sm transition-all flex items-center gap-1.5 ${
                      copied ? 'bg-green-500/20 text-green-400' : 'bg-accent text-white hover:brightness-110'
                    }`}
                  >
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copied
                      ? tx({ fr: 'Copie', en: 'Copied', es: 'Copiado' })
                      : tx({ fr: 'Copier', en: 'Copy', es: 'Copiar' })}
                  </button>
                </div>
                <a
                  href={result.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-accent hover:brightness-110"
                >
                  <ExternalLink size={12} />
                  {tx({ fr: 'Ouvrir le lien dans un nouvel onglet', en: 'Open link in new tab', es: 'Abrir en nueva pestana' })}
                </a>
                <p className="text-[11px] text-grey-muted mt-2 leading-relaxed">
                  {tx({
                    fr: 'Envoie ce lien au client par courriel ou WhatsApp. Quand il paie, la commande passera automatiquement en "paye" et la facture sera marquee comme reglee.',
                    en: 'Send this link to the customer by email or WhatsApp. When they pay, the order will auto-flip to "paid" and the invoice to "settled".',
                    es: 'Envia este enlace al cliente por correo o WhatsApp. Cuando pague, el pedido pasara a "pagado" y la factura a "liquidada".',
                  })}
                </p>
              </div>
            ) : (
              /* Mode prepaid : pas de lien Stripe, message de confirmation */
              <div className="rounded-lg bg-green-500/5 border border-green-500/20 px-4 py-3">
                <p className="text-sm text-green-300 font-semibold flex items-center gap-2">
                  <Banknote size={14} />
                  {tx({
                    fr: 'Commande enregistree au statut PAYE',
                    en: 'Order recorded as PAID',
                    es: 'Pedido registrado como PAGADO',
                  })}
                </p>
                <p className="text-[11px] text-grey-muted mt-1.5 leading-relaxed">
                  {tx({
                    fr: `Aucun lien Stripe genere. Le paiement hors-ligne${result.offlinePaymentMethod ? ` (${result.offlinePaymentMethod})` : ''} est deja consigne dans les notes de la commande. La facture est marquee "reglee".`,
                    en: `No Stripe link generated. Offline payment${result.offlinePaymentMethod ? ` (${result.offlinePaymentMethod})` : ''} already logged in order notes. Invoice marked "settled".`,
                    es: 'No se genero enlace Stripe. Pago offline ya registrado.',
                  })}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-accent text-white font-semibold text-sm hover:brightness-110 transition-all"
              >
                {tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
              </button>
            </div>
          </div>
        ) : (
          /* Form view */
          <form onSubmit={submit}>
            <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Client info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
                    {tx({ fr: 'Nom du client', en: 'Customer name', es: 'Nombre del cliente' })} *
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg text-sm px-3 py-2.5 outline-none border focus:border-accent" style={inputBg}
                    placeholder="Cindy Deroeux"
                  />
                </div>
                <div>
                  <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
                    {tx({ fr: 'Courriel', en: 'Email', es: 'Correo' })}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-lg text-sm px-3 py-2.5 outline-none border focus:border-accent" style={inputBg}
                    placeholder="client@example.com"
                  />
                </div>
              </div>
              {/* FIX-B2B (23 avril 2026) : nouvelle rangee company + phone.
                  Layout grille 2 colonnes sur desktop pour rester compact. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
                    {tx({
                      fr: `Nom de l'entreprise (optionnel)`,
                      en: 'Company name (optional)',
                      es: 'Nombre de la empresa (opcional)',
                    })}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-lg text-sm px-3 py-2.5 outline-none border focus:border-accent" style={inputBg}
                    placeholder="La Presse Inc."
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
                    {tx({ fr: 'Telephone (optionnel)', en: 'Phone (optional)', es: 'Telefono (opcional)' })}
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg text-sm px-3 py-2.5 outline-none border focus:border-accent" style={inputBg}
                    placeholder="514 555 1234"
                  />
                </div>
              </div>

              {/* Items lines */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-grey-muted uppercase tracking-wider">
                    {tx({ fr: 'Lignes de facture', en: 'Invoice lines', es: 'Lineas de factura' })} *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-accent text-[11px] font-semibold transition-colors border"
                    style={{ background: 'var(--bg-glass)', borderColor: 'var(--bg-input-border)' }}
                  >
                    <Plus size={12} />
                    {tx({ fr: 'Ajouter', en: 'Add', es: 'Anadir' })}
                  </button>
                </div>
                {/* Colonnes headers pour clarifier Quantite vs Prix total */}
                <div className="grid grid-cols-[1fr_70px_90px_32px] gap-2 mb-1 px-0.5">
                  <span className="text-[10px] text-grey-muted uppercase tracking-wider">
                    {tx({ fr: 'Description', en: 'Description', es: 'Descripcion' })}
                  </span>
                  <span className="text-[10px] text-grey-muted uppercase tracking-wider text-center">
                    {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
                  </span>
                  <span className="text-[10px] text-grey-muted uppercase tracking-wider text-right">
                    {tx({ fr: 'Prix total ($)', en: 'Line total ($)', es: 'Precio total ($)' })}
                  </span>
                  <span></span>
                </div>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_70px_90px_32px] gap-2 items-start">
                      <input
                        type="text"
                        value={it.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder={tx({ fr: '100x Stickers Standard', en: '100x Standard Stickers', es: '100x Stickers Standard' })}
                        className="rounded-lg text-sm px-3 py-2 outline-none border focus:border-accent"
                        style={inputBg}
                      />
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        placeholder="100"
                        title={tx({
                          fr: 'Quantite (descriptive uniquement - ne multiplie PAS le prix)',
                          en: 'Quantity (descriptive only - does NOT multiply the price)',
                          es: 'Cantidad (solo descriptiva - NO multiplica el precio)',
                        })}
                        className="rounded-lg text-sm px-2 py-2 outline-none border focus:border-accent text-center"
                        style={inputBg}
                      />
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={it.lineTotal}
                          onChange={(e) => updateItem(idx, 'lineTotal', e.target.value)}
                          placeholder="85.00"
                          title={tx({
                            fr: 'Prix TOTAL de la ligne (pas par unite)',
                            en: 'TOTAL line price (not per unit)',
                            es: 'Precio TOTAL de la linea (no por unidad)',
                          })}
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
                        aria-label="Supprimer ligne"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-grey-muted mt-2 leading-relaxed">
                  {tx({
                    fr: 'Saisis le prix TOTAL de la ligne (ex: 100 stickers = 85$, pas 0.85$). La quantite est purement descriptive.',
                    en: 'Enter the TOTAL line price (ex: 100 stickers = $85, not $0.85). Quantity is purely descriptive.',
                    es: 'Ingresa el precio TOTAL de la linea (ej: 100 stickers = 85$, no 0.85$). La cantidad es solo descriptiva.',
                  })}
                </p>
              </div>

              {/* Breakdown financier strict : sous-total + TPS + TVQ + Grand Total */}
              <div className="rounded-lg border overflow-hidden" style={sectionBg}>
                <div className="flex items-center justify-between px-4 py-2 border-b" style={dividerBorder}>
                  <span className="text-grey-muted text-xs uppercase tracking-wider">
                    {tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}
                  </span>
                  <span className="text-heading text-sm font-semibold">{subtotal.toFixed(2)}$</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 border-b" style={dividerBorder}>
                  <span className="text-grey-muted text-xs">
                    {tx({ fr: 'TPS (5%)', en: 'GST (5%)', es: 'TPS (5%)' })}
                  </span>
                  <span className="text-heading text-sm">{tps.toFixed(2)}$</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 border-b" style={dividerBorder}>
                  <span className="text-grey-muted text-xs">
                    {tx({ fr: 'TVQ (9.975%)', en: 'QST (9.975%)', es: 'TVQ (9.975%)' })}
                  </span>
                  <span className="text-heading text-sm">{tvq.toFixed(2)}$</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-accent/10">
                  <span className="text-heading text-xs uppercase tracking-wider font-bold">
                    {tx({ fr: 'Grand Total (TTC)', en: 'Grand Total (with tax)', es: 'Total con impuestos' })}
                  </span>
                  <span className="text-accent text-xl font-heading font-bold">{grandTotal.toFixed(2)}$</span>
                </div>
              </div>
              <p className="text-[10px] text-grey-muted mt-1.5 text-right">
                {tx({
                  fr: 'Montant facture au client sur Stripe = Grand Total (TTC).',
                  en: 'Amount charged to client on Stripe = Grand Total (tax included).',
                  es: 'Monto cobrado al cliente en Stripe = Total con impuestos.',
                })}
              </p>

              {/* Notes */}
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider block mb-1">
                  {tx({ fr: 'Notes internes (optionnel)', en: 'Internal notes (optional)', es: 'Notas internas (opcional)' })}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full rounded-lg text-sm px-3 py-2 outline-none border focus:border-accent resize-none"
                  style={inputBg}
                />
              </div>

              {/* FIX-PREPAID (23 avril 2026) : selecteur mode de paiement.
                  Stripe = genere un lien, client paie plus tard.
                  Prepaid = commande deja reglee hors-ligne (Interac, comptant,
                  Square en personne) -> bypass Stripe + status='paid' immediat. */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-grey-muted uppercase tracking-wider">
                  {tx({ fr: 'Mode de paiement', en: 'Payment mode', es: 'Modo de pago' })}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-start gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentMode === 'stripe'
                      ? 'border-accent bg-accent/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="stripe"
                      checked={paymentMode === 'stripe'}
                      onChange={() => setPaymentMode('stripe')}
                      className="mt-0.5 accent-accent flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-heading">
                        <CreditCard size={14} className="text-accent" />
                        {tx({
                          fr: 'Paiement requis (generer un lien Stripe)',
                          en: 'Payment required (generate Stripe link)',
                          es: 'Pago requerido (generar enlace Stripe)',
                        })}
                      </p>
                      <p className="text-[11px] text-grey-muted mt-0.5">
                        {tx({
                          fr: 'Envoyer le lien au client. La commande passera a "paye" automatiquement au paiement.',
                          en: 'Send link to client. Order auto-flips to "paid" on payment.',
                          es: 'Enviar enlace al cliente.',
                        })}
                      </p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentMode === 'prepaid'
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="prepaid"
                      checked={paymentMode === 'prepaid'}
                      onChange={() => setPaymentMode('prepaid')}
                      className="mt-0.5 accent-green-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-heading">
                        <Banknote size={14} className="text-green-400" />
                        {tx({
                          fr: 'Deja paye hors-ligne (Virement, Comptant, etc.)',
                          en: 'Already paid offline (Interac, Cash, etc.)',
                          es: 'Pagado fuera de linea',
                        })}
                      </p>
                      <p className="text-[11px] text-grey-muted mt-0.5">
                        {tx({
                          fr: 'La commande sera enregistree directement en statut "paye". Aucun lien Stripe.',
                          en: 'Order recorded directly as "paid". No Stripe link.',
                          es: 'Pedido registrado directamente como "pagado".',
                        })}
                      </p>
                      {paymentMode === 'prepaid' && (
                        <select
                          value={offlineMethod}
                          onChange={(e) => setOfflineMethod(e.target.value)}
                          className="mt-2 w-full rounded-md text-xs px-2 py-1.5 outline-none border focus:border-green-500"
                          style={inputBg}
                        >
                          <option value="interac">{tx({ fr: 'Interac', en: 'Interac', es: 'Interac' })}</option>
                          <option value="cash">{tx({ fr: 'Comptant', en: 'Cash', es: 'Efectivo' })}</option>
                          <option value="square">Square</option>
                          <option value="cheque">{tx({ fr: 'Cheque', en: 'Cheque', es: 'Cheque' })}</option>
                          <option value="other">{tx({ fr: 'Autre', en: 'Other', es: 'Otro' })}</option>
                        </select>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-5 py-3 border-t" style={footerBg}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 border"
                style={{ ...cancelBtnStyle, borderColor: 'var(--bg-input-border)' }}
              >
                {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
              </button>
              <button
                type="submit"
                disabled={loading || subtotal <= 0}
                className={`flex-[2] py-2 rounded-lg text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  paymentMode === 'prepaid' ? 'bg-green-500' : 'bg-accent'
                }`}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {/* FIX-PREPAID : label dynamique selon le mode choisi. */}
                {paymentMode === 'prepaid'
                  ? tx({
                      fr: 'Creer la commande (Statut: Paye)',
                      en: 'Create order (Status: Paid)',
                      es: 'Crear pedido (Estado: Pagado)',
                    })
                  : tx({
                      fr: 'Creer et generer lien Stripe',
                      en: 'Create and generate Stripe link',
                      es: 'Crear y generar enlace Stripe',
                    })}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateManualOrderModal;
