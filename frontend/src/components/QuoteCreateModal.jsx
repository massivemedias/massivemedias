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
import { X, Plus, Trash2, Loader2, FileText, Save, Calculator } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { createQuote, updateQuote } from '../services/adminService';
import {
  stickerFinishes, stickerShapes, stickerSizes,
  getFineArtPrice, fineArtPrinterTiers, fineArtFormats, fineArtFramePriceByFormat,
} from '../data/products';
// FIX-VOLUME-DISCOUNT (7 mai 2026) : on utilise lookupStickerPriceCustomQty
// (le MEME helper que le configurateur public ConfiguratorStickers.jsx) pour
// avoir l'INTERPOLATION LINEAIRE entre paliers. L'ancien import getStickerPrice
// ne marchait que pour les paliers EXACTS (25/50/100/200/500) et retournait
// null sinon -> le prix unite restait bloque sur le 1er palier visible et ne
// baissait jamais avec la quantite. Cf. lookupStickerPriceCustomQty pour le
// detail du calcul (interpolation entre les 2 paliers qui encadrent qty).
import { lookupStickerPriceCustomQty } from '../utils/pricingData';

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

// Item vide initial. Tous les champs des modes typed sont pre-remplis avec
// des valeurs par defaut sensees pour eviter les undefined lors du switch
// de mode (ex: passer en sticker -> finish='matte', size='2in').
function makeBlankItem() {
  return {
    kind: 'free',
    description: '',
    quantity: 1,
    unitPrice: '',
    // sticker
    finish: 'matte',
    shape: 'round',
    size: '2in',
    // fine art
    tier: 'studio',
    format: '',
    withFrame: false,
    // web / design / affiches : presetKey = id du preset selectionne
    // (les valeurs sont resolues via PRESET_DEFINITIONS)
    presetKey: '',
  };
}

// Presets fixes (grille tarifaire 2026 Massive Medias). Distinct des modes
// calcules (sticker/fineart) qui utilisent une formule. Ces presets sont
// "a partir de" : l'admin garde la liberte d'ajuster description et prix
// dans la ligne apres selection.
//
// Flag isHourly : pour les banques d'heures, la qty est le nombre d'heures
// que l'admin saisit. Le selecteur de preset n'ecrase pas la qty existante
// (sinon on perdrait la saisie en cours), il fixe juste description et prix.
const PRESET_DEFINITIONS = {
  affiches: [
    { id: 'aff-20-12x16',  description: '20 affiches 12x16 (Lustre)',          price: 80 },
    { id: 'aff-60-12x16',  description: '60 affiches 12x16 (Lustre/Exterieur)', price: 160 },
    { id: 'aff-100-12x16', description: '100 affiches 12x16 (Lustre/Exterieur)', price: 220 },
    { id: 'aff-20-18x24',  description: '20 affiches 18x24',                    price: 120 },
    { id: 'aff-50-18x24',  description: '50 affiches 18x24',                    price: 240 },
  ],
  web: [
    { id: 'web-landing',     description: 'Landing page',                  price: 900 },
    { id: 'web-vitrine',     description: 'Site vitrine (5-10 pages)',     price: 1000 },
    { id: 'web-ecommerce',   description: 'Site e-commerce',               price: 1500 },
    { id: 'web-maintenance', description: 'Maintenance mensuelle',         price: 100 },
    { id: 'web-hours',       description: 'Banque d\'heures Web (Sur mesure)', price: 85, isHourly: true },
  ],
  design: [
    { id: 'design-logo',         description: 'Creation logo',                  price: 300 },
    { id: 'design-identite',     description: 'Identite visuelle complete',     price: 800 },
    { id: 'design-affiche',      description: 'Affiche / flyer evenement',      price: 150 },
    { id: 'design-pochette',     description: 'Pochette album/single',          price: 200 },
    { id: 'design-icones',       description: 'Design d\'icones (set)',         price: 200 },
    { id: 'design-retouche',     description: 'Retouche photo (par image)',     price: 15 },
    { id: 'design-hours',        description: 'Banque d\'heures Design',        price: 85, isHourly: true },
  ],
};

/**
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {() => void} props.onCreated - callback apres creation/mise a jour reussie
 * @param {object} [props.existingQuote] - si fourni, mode edition : pre-remplit
 *   les champs et le submit fait PUT au lieu de POST. Place le titre + libelle
 *   du bouton submit en mode "Enregistrer" plutot que "Creer".
 */
function QuoteCreateModal({ onClose, onCreated, existingQuote }) {
  const { tx } = useLang();
  const isEdit = !!existingQuote;

  // Helper : extraire le "Delai : ..." du debut des notes pour le placer dans
  // un champ dedie en mode edition. Le reste des notes va dans le champ notes.
  const splitDelayFromNotes = (raw) => {
    if (!raw) return { delay: '', rest: '' };
    const m = String(raw).match(/^Delai\s*:\s*([^\n]+)\n*\n*([\s\S]*)$/i);
    if (m) return { delay: m[1].trim(), rest: m[2].trim() };
    return { delay: '', rest: String(raw).trim() };
  };
  const initialNotes = splitDelayFromNotes(existingQuote?.notes);
  // kind: 'free' (saisie libre) | 'sticker' (auto via getStickerPrice)
  //       | 'fineart' (auto via getFineArtPrice). Default 'free' pour compat
  //       avec les items deja en BDD qui n'ont pas de discriminant.
  const initialItems = Array.isArray(existingQuote?.items) && existingQuote.items.length > 0
    ? existingQuote.items.map(it => ({
        kind: it.kind || 'free',
        description: it.description || it.name || '',
        quantity: Number(it.quantity) || 1,
        unitPrice: it.unitPrice != null ? String(it.unitPrice) : '',
        finish: it.finish || 'matte',
        shape: it.shape || 'round',
        size: it.size || '2in',
        tier: it.tier || 'studio',
        format: it.format || '',
        withFrame: !!it.withFrame,
      }))
    : [makeBlankItem()];

  const [customerName, setCustomerName] = useState(existingQuote?.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(
    existingQuote?.customerEmail && !/@quote\.placeholder$/i.test(existingQuote.customerEmail)
      ? existingQuote.customerEmail
      : ''
  );
  const [customerPhone, setCustomerPhone] = useState(existingQuote?.customerPhone || '');
  const [items, setItems] = useState(initialItems);
  const [notes, setNotes] = useState(initialNotes.rest);
  // Delai de production communique au client. Stocke en debut de notes pour
  // qu'il soit visible sur la PDF facture lors de la conversion en commande.
  const [delay, setDelay] = useState(initialNotes.delay);
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

  // recomputeItem (7 mai 2026) : si l'item est en mode calcule (sticker / fineart),
  // on regenere description + unitPrice depuis les selections + qty via les helpers
  // de products.js. En mode 'free', ne touche a rien (saisie manuelle preservee).
  // Les libelles sont en FR (les soumissions sont generees pour les clients de
  // Massive Medias - tous francophones aujourd'hui).
  const recomputeItem = (item) => {
    if (item.kind === 'sticker' && item.finish && item.size) {
      const qty = Number(item.quantity) || 1;
      const shape = item.shape || 'round';
      // lookupStickerPriceCustomQty fait :
      //   - palier exact (25/50/100/200/500) -> prix tabule direct
      //   - qty intermediaire -> interpolation lineaire entre les 2 paliers
      //     qui encadrent (ex: 255 -> entre 200 et 500 -> ~1.50$/u sur matte 4")
      //   - qty > max palier -> rate du dernier palier (cap, pas d'extrapolation)
      //   - qty < 25 -> null (minimum production), on garde l'item en l'etat
      const p = lookupStickerPriceCustomQty(item.finish, qty, item.size);
      if (p && p.unitPrice != null) {
        const finishLabel = stickerFinishes.find(f => f.id === item.finish)?.labelFr || item.finish;
        const sizeLabel = stickerSizes.find(s => s.id === item.size)?.label || item.size;
        const shapeLabel = stickerShapes.find(s => s.id === shape)?.labelFr || shape;
        return {
          ...item,
          description: `Stickers ${finishLabel} ${shapeLabel} ${sizeLabel}`,
          unitPrice: String(p.unitPrice),
        };
      }
    }
    if (item.kind === 'fineart' && item.tier && item.format) {
      const p = getFineArtPrice(item.tier, item.format, !!item.withFrame);
      if (p && p.price != null) {
        const tierLabel = fineArtPrinterTiers.find(t => t.id === item.tier)?.labelFr || item.tier;
        const formatLabel = fineArtFormats.find(f => f.id === item.format)?.label || item.format;
        return {
          ...item,
          description: `Impression Fine Art ${formatLabel} (${tierLabel})${item.withFrame ? ' avec cadre' : ''}`,
          unitPrice: String(p.price),
        };
      }
    }
    // Modes "preset list" (affiches/web/design) : resolution via PRESET_DEFINITIONS.
    // Contrairement a sticker/fineart, on N'ECRASE PAS description / unitPrice
    // si l'admin les a deja modifies manuellement apres la selection (la grille
    // 2026 est "a partir de", l'admin doit pouvoir ajuster). On ne synchronise
    // que lors d'un CHANGEMENT de preset (ce qui se fait via applyTypedPreset
    // ci-dessous, pas via recomputeItem). Du coup recomputeItem est no-op ici.
    return item;
  };

  // Selectionne un preset typed (affiches/web/design) : remplit description
  // + unitPrice + qty (1 par defaut, sauf banque d'heures qui garde la qty
  // courante pour permettre a l'admin de taper le nombre d'heures avant ou
  // apres la selection).
  const applyTypedPreset = (idx, kind, presetId) => {
    const list = PRESET_DEFINITIONS[kind] || [];
    const preset = list.find(p => p.id === presetId);
    if (!preset) return;
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const next = {
        ...it,
        kind,
        presetKey: preset.id,
        description: preset.description,
        unitPrice: String(preset.price),
      };
      if (!preset.isHourly) next.quantity = 1;
      return next;
    }));
  };

  const updateItem = (idx, patch) => {
    setItems(prev => prev.map((it, i) => i === idx ? recomputeItem({ ...it, ...patch }) : it));
  };
  const addItem = () => setItems(prev => [...prev, makeBlankItem()]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  // Preset selection : "category::index" -> auto-fill description + price.
  // Force kind='free' au cas ou l'item etait en mode calcule (le preset ecrase
  // les selections sticker/fineart sans confusion).
  const applyPreset = (idx, presetKey) => {
    if (!presetKey) return;
    const [catIdx, optIdx] = presetKey.split('::').map(n => parseInt(n, 10));
    const opt = QUOTE_PRESETS[catIdx]?.options?.[optIdx];
    if (!opt) return;
    updateItem(idx, { kind: 'free', description: opt.description, unitPrice: String(opt.price) });
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
      const payload = {
        customerName: trimmedName,
        customerEmail: customerEmail.trim().toLowerCase() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: validItems,
        subtotal,
        total: subtotal,
        notes: finalNotes || undefined,
      };
      if (isEdit) {
        await updateQuote(existingQuote.documentId, payload);
      } else {
        await createQuote(payload);
      }
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
              {isEdit
                ? tx({ fr: 'Modifier la soumission', en: 'Edit quote', es: 'Editar cotizacion' })
                : tx({ fr: 'Creer une soumission', en: 'Create quote', es: 'Crear cotizacion' })}
            </h2>
            <p className="text-xs text-grey-muted">
              {isEdit
                ? tx({
                    fr: 'Modifie les lignes ou le total. Les notes/delai sont prefixees automatiquement.',
                    en: 'Update lines or total. Notes/delay are prefixed automatically.',
                    es: 'Edita las lineas o el total.',
                  })
                : tx({
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
            <div className="space-y-4">
              {items.map((it, idx) => {
                // isCalculated : modes a formule (description + unitPrice
                // verrouilles, recalcules a chaque change). NE PAS inclure
                // affiches/web/design qui ont des prix "a partir de" libres.
                const isCalculated = it.kind === 'sticker' || it.kind === 'fineart';
                const presetList = PRESET_DEFINITIONS[it.kind];
                return (
                <div key={idx} className="rounded-lg bg-black/20 border border-white/5 p-2.5 space-y-2">
                  {/* Ligne 0 : selecteur de mode (6 pills + preset libre dropdown).
                      Affiches/Web/Design : prix base de la grille 2026, modifiable. */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'free',     label: tx({ fr: 'Libre',    en: 'Free',     es: 'Libre' }),     icon: Plus },
                      { id: 'sticker',  label: tx({ fr: 'Sticker',  en: 'Sticker',  es: 'Sticker' }),   icon: Calculator },
                      { id: 'fineart',  label: tx({ fr: 'Fine Art', en: 'Fine Art', es: 'Fine Art' }),  icon: Calculator },
                      { id: 'affiches', label: tx({ fr: 'Affiches', en: 'Posters',  es: 'Carteles' }),  icon: FileText },
                      { id: 'web',      label: tx({ fr: 'Site Web', en: 'Web',      es: 'Web' }),       icon: FileText },
                      { id: 'design',   label: tx({ fr: 'Design',   en: 'Design',   es: 'Diseno' }),    icon: FileText },
                    ].map(m => {
                      const Ic = m.icon;
                      const active = it.kind === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => updateItem(idx, { kind: m.id })}
                          disabled={submitting}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                            active
                              ? 'bg-accent text-white'
                              : 'bg-glass text-grey-muted hover:text-heading'
                          }`}
                        >
                          <Ic size={11} />
                          {m.label}
                        </button>
                      );
                    })}
                    {it.kind === 'free' && (
                      <select
                        value=""
                        onChange={(e) => { applyPreset(idx, e.target.value); e.target.value = ''; }}
                        disabled={submitting}
                        className="ml-auto bg-black/40 border border-white/10 rounded-md px-2 py-1 text-grey-muted text-[11px] focus:outline-none focus:border-accent disabled:opacity-50"
                      >
                        <option value="">
                          {tx({ fr: '+ Preset', en: '+ Preset', es: '+ Preset' })}
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
                    )}
                  </div>

                  {/* Mode Sticker : finition + forme + taille selects, auto-calcul du prix par palier */}
                  {it.kind === 'sticker' && (
                    <div className="grid grid-cols-3 gap-1.5">
                      <select
                        value={it.finish}
                        onChange={(e) => updateItem(idx, { finish: e.target.value })}
                        disabled={submitting}
                        className="bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-heading text-xs focus:outline-none focus:border-accent disabled:opacity-50"
                      >
                        {stickerFinishes.map(f => (
                          <option key={f.id} value={f.id}>{f.labelFr}</option>
                        ))}
                      </select>
                      <select
                        value={it.shape}
                        onChange={(e) => updateItem(idx, { shape: e.target.value })}
                        disabled={submitting}
                        className="bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-heading text-xs focus:outline-none focus:border-accent disabled:opacity-50"
                      >
                        {stickerShapes.map(s => (
                          <option key={s.id} value={s.id}>{s.labelFr}</option>
                        ))}
                      </select>
                      <select
                        value={it.size}
                        onChange={(e) => updateItem(idx, { size: e.target.value })}
                        disabled={submitting}
                        className="bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-heading text-xs focus:outline-none focus:border-accent disabled:opacity-50"
                      >
                        {stickerSizes.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mode Fine Art : tier (studio/musee) + format + checkbox cadre */}
                  {it.kind === 'fineart' && (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={it.tier}
                          onChange={(e) => updateItem(idx, { tier: e.target.value })}
                          disabled={submitting}
                          className="bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-heading text-xs focus:outline-none focus:border-accent disabled:opacity-50"
                        >
                          {fineArtPrinterTiers.map(t => (
                            <option key={t.id} value={t.id}>{t.labelFr}</option>
                          ))}
                        </select>
                        <select
                          value={it.format}
                          onChange={(e) => updateItem(idx, { format: e.target.value })}
                          disabled={submitting}
                          className="bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-heading text-xs focus:outline-none focus:border-accent disabled:opacity-50"
                        >
                          <option value="">
                            {tx({ fr: 'Choisir un format...', en: 'Pick format...', es: 'Elegir formato...' })}
                          </option>
                          {fineArtFormats.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.label} — {f.studioPrice}$/Studio · {f.museumPrice}$/Musee
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-grey-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!it.withFrame}
                          onChange={(e) => updateItem(idx, { withFrame: e.target.checked })}
                          disabled={submitting}
                          className="rounded border-white/10 bg-black/30 text-accent focus:ring-accent disabled:opacity-50"
                        />
                        {tx({ fr: 'Avec cadre', en: 'With frame', es: 'Con marco' })}
                        {it.format && fineArtFramePriceByFormat[it.format] != null && (
                          <span className="text-[10px] opacity-70">
                            (+{fineArtFramePriceByFormat[it.format]}$)
                          </span>
                        )}
                      </label>
                    </div>
                  )}

                  {/* Modes preset list : Affiches / Web / Design.
                      Dropdown unique avec les options de la grille 2026. La
                      selection auto-fill description + unitPrice + qty=1
                      (sauf banque d'heures qui garde la qty saisie). Ensuite
                      l'admin peut ajuster description et prix manuellement. */}
                  {presetList && (
                    <select
                      value={it.presetKey || ''}
                      onChange={(e) => applyTypedPreset(idx, it.kind, e.target.value)}
                      disabled={submitting}
                      className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-heading text-xs focus:outline-none focus:border-accent disabled:opacity-50"
                    >
                      <option value="">
                        {tx({
                          fr: 'Choisir un preset...',
                          en: 'Pick a preset...',
                          es: 'Elegir un preset...',
                        })}
                      </option>
                      {presetList.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.description} {p.isHourly ? `— ${p.price}$/h` : `— ${p.price}$`}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Ligne finale : description + qty + prix + remove.
                      En mode calcule, description et unitPrice sont read-only
                      (mis a jour automatiquement par recomputeItem). */}
                  <div className="grid grid-cols-[1fr_60px_100px_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      disabled={submitting || isCalculated}
                      readOnly={isCalculated}
                      placeholder={tx({ fr: 'Description', en: 'Description', es: 'Descripcion' })}
                      className={`bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50 ${isCalculated ? 'cursor-not-allowed opacity-80' : ''}`}
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
                      disabled={submitting || isCalculated}
                      readOnly={isCalculated}
                      placeholder="$"
                      title={isCalculated
                        ? tx({ fr: 'Prix unitaire calcule auto', en: 'Auto unit price', es: 'Precio auto' })
                        : tx({ fr: 'Prix unitaire', en: 'Unit price', es: 'Precio unitario' })}
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

                  {/* Aide contextuelle en mode calcule : affiche le total ligne
                      pour que l'admin verifie d'un coup d'oeil avant submit. */}
                  {isCalculated && it.unitPrice && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                      <span className="text-grey-muted">
                        {tx({ fr: 'Total ligne', en: 'Line total', es: 'Total linea' })}
                      </span>
                      <span className="text-accent font-semibold">
                        {((Number(it.quantity) || 1) * (parseFloat(String(it.unitPrice).replace(',', '.')) || 0)).toFixed(2)} $
                      </span>
                    </div>
                  )}
                </div>
                );
              })}
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
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {isEdit
                    ? tx({ fr: 'Mise a jour...', en: 'Updating...', es: 'Actualizando...' })
                    : tx({ fr: 'Creation...', en: 'Creating...', es: 'Creando...' })}
                </>
              ) : isEdit ? (
                <><Save size={14} /> {tx({ fr: 'Enregistrer les modifications', en: 'Save changes', es: 'Guardar cambios' })}</>
              ) : (
                <><Plus size={14} /> {tx({ fr: 'Creer la soumission', en: 'Create quote', es: 'Crear cotizacion' })}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuoteCreateModal;
