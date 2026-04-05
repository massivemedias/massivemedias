import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, XCircle, CheckCircle, Check, Search,
  Edit3, X, Save, Loader2, DollarSign, Archive, Plus, ArrowUpDown, Trash2,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';
import { merchColors } from '../data/merchData';

// Couleurs triees du plus clair au plus fonce avec traductions
// Luminance percue: 0.299*R + 0.587*G + 0.114*B
function hexLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const COLOR_NAMES_FR = {
  'White': 'Blanc', 'PFD White': 'Blanc PFD', 'Mint Green': 'Vert Menthe', 'Natural': 'Naturel',
  'Cornsilk': 'Jaune Mais', 'Light Pink': 'Rose Pale', 'Light Blue': 'Bleu Pale', 'Pistachio': 'Pistache',
  'Lime': 'Lime', 'Safety Green': 'Vert Fluo', 'Sky': 'Ciel', 'Azalea': 'Azalee',
  'Ash': 'Cendre', 'Ice Grey': 'Gris Glace', 'Vegas Gold': 'Or Vegas', 'Daisy': 'Marguerite',
  'Safety Pink': 'Rose Fluo', 'Sand': 'Sable', 'Orchid': 'Orchidee', 'Sport Grey': 'Gris Sport',
  'Tan': 'Fauve', 'Carolina Blue': 'Bleu Carolina', 'Gold': 'Or', 'Heather Sapphire': 'Saphir Chine',
  'Safety Orange': 'Orange Fluo', 'Tangerine': 'Mandarine', 'Stone Blue': 'Bleu Pierre',
  'Indigo Blue': 'Bleu Indigo', 'Orange': 'Orange', 'Heather Cardinal': 'Cardinal Chine',
  'Heather Indigo': 'Indigo Chine', 'Irish Green': 'Vert Irlandais', 'Prairie Dust': 'Poussiere Prairie',
  'Antique Irish Green': 'Vert Irlandais Antique', 'Iris': 'Iris', 'Texas Orange': 'Orange Texas',
  'Heliconia': 'Heliconia', 'Jade Dome': 'Jade', 'Kelly': 'Kelly', 'Olive': 'Olive',
  'Sapphire': 'Saphir', 'Charcoal': 'Charbon', 'Dark Heather': 'Chine Fonce',
  'Galapagos Blue': 'Bleu Galapagos', 'Cherry Red': 'Rouge Cerise', 'Military Green': 'Vert Militaire',
  'Royal': 'Bleu Royal', 'Red': 'Rouge', 'Forest': 'Foret', 'Cardinal Red': 'Rouge Cardinal',
  'Blue Dusk': 'Bleu Crepuscule', 'Antique Cherry Red': 'Rouge Cerise Antique',
  'Antique Royal': 'Bleu Royal Antique', 'Heather Navy': 'Marine Chine',
  'Dark Chocolate': 'Chocolat Noir', 'Maroon': 'Bordeaux', 'Purple': 'Violet',
  'Metro Blue': 'Bleu Metro', 'Navy': 'Marine', 'Black': 'Noir',
};

const COLOR_NAMES_ES = {
  'White': 'Blanco', 'PFD White': 'Blanco PFD', 'Mint Green': 'Verde Menta', 'Natural': 'Natural',
  'Cornsilk': 'Maiz', 'Light Pink': 'Rosa Claro', 'Light Blue': 'Azul Claro', 'Pistachio': 'Pistacho',
  'Lime': 'Lima', 'Safety Green': 'Verde Fluo', 'Sky': 'Cielo', 'Azalea': 'Azalea',
  'Ash': 'Ceniza', 'Ice Grey': 'Gris Hielo', 'Vegas Gold': 'Oro Vegas', 'Daisy': 'Margarita',
  'Safety Pink': 'Rosa Fluo', 'Sand': 'Arena', 'Orchid': 'Orquidea', 'Sport Grey': 'Gris Sport',
  'Tan': 'Bronceado', 'Carolina Blue': 'Azul Carolina', 'Gold': 'Oro',
  'Safety Orange': 'Naranja Fluo', 'Tangerine': 'Mandarina', 'Orange': 'Naranja',
  'Irish Green': 'Verde Irlandes', 'Heliconia': 'Heliconia', 'Olive': 'Oliva',
  'Sapphire': 'Zafiro', 'Charcoal': 'Carbon', 'Cherry Red': 'Rojo Cereza',
  'Military Green': 'Verde Militar', 'Royal': 'Azul Real', 'Red': 'Rojo', 'Forest': 'Bosque',
  'Maroon': 'Granate', 'Purple': 'Purpura', 'Navy': 'Marino', 'Black': 'Negro',
};

const SORTED_COLORS = [...merchColors].sort((a, b) => hexLuminance(b.hex) - hexLuminance(a.hex));

const STATUS_CONFIG = {
  ok: { label: { fr: 'OK', en: 'OK', es: 'OK' }, icon: CheckCircle, color: 'bg-green-500/20 text-green-400' },
  low: { label: { fr: 'Alerte', en: 'Alert', es: 'Alerta' }, icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-400' },
  out: { label: { fr: 'Rupture', en: 'Out of stock', es: 'Agotado' }, icon: XCircle, color: 'bg-red-500/20 text-red-400' },
};

const CATEGORY_LABELS = {
  textile: { fr: 'Textile', en: 'Textile', es: 'Textil' },
  frame: { fr: 'Cadre', en: 'Frame', es: 'Marco' },
  accessory: { fr: 'Accessoire', en: 'Accessory', es: 'Accesorio' },
  sticker: 'Sticker',
  print: 'Print',
  merch: 'Merch',
  equipment: { fr: 'Materiel', en: 'Equipment', es: 'Equipo' },
  other: { fr: 'Autre', en: 'Other', es: 'Otro' },
};

const CATEGORIES = [
  { value: 'textile', label: 'Textile' },
  { value: 'frame', label: 'Cadre' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'print', label: 'Print' },
  { value: 'merch', label: 'Merch' },
  { value: 'equipment', label: 'Materiel' },
  { value: 'other', label: 'Autre' },
];

// Variantes suggerees par categorie
const VARIANT_SUGGESTIONS = {
  textile: ['Hoodie', 'T-Shirt', 'Crewneck'],
  frame: ['Noir', 'Blanc', 'Gris'],
  sticker: ['Clear', 'Glossy', 'Holographic', 'Broken Glass', 'Stars'],
  print: ['Fine Art', 'Photo', 'Canvas', 'Metal'],
  merch: ['Tote Bag', 'Mug', 'Tumbler', 'Fanny Pack', 'Pin'],
  equipment: ['Imprimante', 'Decoupeuse', 'Lamineuse', 'Presse a chaud', 'Tete d\'impression', 'Massicot', 'Plastifieuse', 'Scanner'],
  other: [],
};

// Couleurs depuis merchData (memes que le configurateur merch)

const SIZE_SUGGESTIONS = {
  textile: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  frame: ['A6', 'A4', 'A3', '11x17', 'A3+', '18x24', 'A2'],
  sticker: ['2"', '3"', '4"', '5"'],
  print: ['A6', 'A4', 'A3', 'A3+', 'A2'],
  default: [],
};

// ---- Formulaire creation / edition ----
function ItemForm({ onClose, onSaved, tx, lang, editItem }) {
  const isEdit = !!editItem;

  // Parser les infos depuis le nom pour pre-remplir en mode edition
  const parseFromName = (name, variant) => {
    if (!name) return { brand: '', color: '', detail: '', hasZip: false };
    const words = name.split(' ');
    const allColorNames = merchColors.map(c => c.name);
    const allSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'A6', 'A4', 'A3', 'A3+', 'A2'];
    let color = '', detail = '', brand = '', hasZip = false;

    for (const w of words) {
      if (w.toLowerCase() === 'zip') { hasZip = true; continue; }
      if (allSizes.includes(w.toUpperCase())) { detail = w.toUpperCase(); continue; }
      if (allColorNames.includes(w)) { color = w; continue; }
      // Le premier mot qui n'est ni variant, ni taille, ni couleur, ni zip = marque
      if (w !== variant && !brand) { brand = w; }
    }
    return { brand, color, detail, hasZip };
  };

  const parsed = isEdit ? parseFromName(editItem.nameFr, editItem.variant) : { brand: '', color: '', detail: '', hasZip: false };

  const [form, setForm] = useState({
    nameFr: editItem?.nameFr || '', nameEn: editItem?.nameEn || '',
    category: editItem?.category || 'textile',
    variant: editItem?.variant || '',
    detail: parsed.detail,
    color: parsed.color, brand: parsed.brand, hasZip: parsed.hasZip,
    quantity: editItem?.quantity || 0,
    costPrice: editItem?.costPrice || '',
    location: editItem?.location || '',
    notes: editItem?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdSku, setCreatedSku] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const variants = VARIANT_SUGGESTIONS[form.category] || [];
  const sizes = SIZE_SUGGESTIONS[form.category] || SIZE_SUGGESTIONS.default;

  // Auto-generer le nom FR depuis les champs
  const autoName = () => {
    if (form.category === 'textile') {
      // Pour textile: marque = nom produit (on concatene variant + zip + couleur + taille)
      const parts = [form.brand, form.variant, form.hasZip ? 'Zip' : '', form.color, form.detail].filter(Boolean);
      if (parts.length > 0) set('nameFr', parts.join(' '));
    } else if (form.category === 'equipment') {
      const parts = [form.brand, form.variant].filter(Boolean);
      if (parts.length > 0) set('nameFr', parts.join(' '));
    } else {
      const parts = [form.brand, form.variant, form.color, form.detail].filter(Boolean);
      if (parts.length > 0) set('nameFr', parts.join(' '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Pour textile, generer le nom depuis la marque si vide
    if (form.category === 'textile' && !form.nameFr && form.brand) {
      form.nameFr = [form.brand, form.variant, form.hasZip ? 'Zip' : '', form.color, form.detail].filter(Boolean).join(' ');
    }
    if (!form.nameFr || !form.category) return;
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        // Mode edition: mettre a jour tous les champs
        await api.put(`/inventory-items/${editItem.documentId}/adjust`, {
          nameFr: form.nameFr,
          nameEn: form.nameEn || form.nameFr,
          category: form.category,
          variant: form.variant,
          quantity: Number(form.quantity) || 0,
          costPrice: form.costPrice ? Number(form.costPrice) : 0,
          location: form.location,
          notes: form.notes,
        });
        setCreatedSku('');
        onSaved();
        onClose();
      } else {
        // Mode creation
        const res = await api.post('/inventory-items/create', {
          nameFr: form.nameFr,
          nameEn: form.nameEn || form.nameFr,
          category: form.category,
          variant: form.variant,
          detail: form.detail,
          quantity: Number(form.quantity) || 0,
          costPrice: form.costPrice ? Number(form.costPrice) : 0,
          location: form.location,
          notes: form.notes,
        });
        setCreatedSku(res.data?.data?.sku || '');
        onSaved();
        // Reset pour ajouter un autre
        setForm(f => ({ ...f, nameFr: '', nameEn: '', variant: '', detail: '', color: '', brand: '', hasZip: false, quantity: 0, costPrice: '', notes: '' }));
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 pt-20 overflow-y-auto" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 border border-white/15"
        style={{ background: '#2a2040' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-heading font-heading font-bold text-lg">
            {isEdit
              ? tx({ fr: 'Modifier l\'item', en: 'Edit item', es: 'Editar item' })
              : tx({ fr: 'Ajouter au stock', en: 'Add to stock', es: 'Agregar al stock' })}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-grey-muted"><X size={18} /></button>
        </div>

        {createdSku && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">
              {tx({ fr: 'Cree!', en: 'Created!', es: 'Creado!' })} SKU: <span className="font-mono font-bold">{createdSku}</span>
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categorie */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
              {tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })} *
            </label>
            <select
              value={form.category}
              onChange={(e) => { set('category', e.target.value); if (e.target.value !== 'equipment') { set('variant', ''); set('detail', ''); } }}
              className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2.5 outline-none border border-white/5 focus:border-accent"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Type pour Materiel */}
          {form.category === 'equipment' && (
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
                Type
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {VARIANT_SUGGESTIONS.equipment.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { set('variant', v); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      form.variant === v ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={form.variant}
                onChange={(e) => set('variant', e.target.value)}
                onBlur={autoName}
                placeholder="Ou saisir manuellement..."
                className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent placeholder:text-grey-muted/50"
              />
            </div>
          )}

          {/* --- Champs specifiques (caches pour Materiel) --- */}
          {form.category !== 'equipment' && (<>

          {/* Variante (chips suggerees) */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
              {tx({ fr: 'Variante / Type', en: 'Variant / Type', es: 'Variante / Tipo' })}
            </label>
            {variants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {variants.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { set('variant', v); autoName(); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      form.variant === v ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={form.variant}
              onChange={(e) => set('variant', e.target.value)}
              onBlur={autoName}
              placeholder="Ex: Hoodie, T-Shirt, Black..."
              className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent placeholder:text-grey-muted/50"
            />
          </div>

          {/* Taille / Detail (chips suggerees) */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
              {tx({ fr: 'Taille / Detail', en: 'Size / Detail', es: 'Talla / Detalle' })}
            </label>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {sizes.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('detail', s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      form.detail === s ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={form.detail}
              onChange={(e) => set('detail', e.target.value)}
              onBlur={autoName}
              placeholder="Ex: L, XL, A4, 3&quot;..."
              className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent placeholder:text-grey-muted/50"
            />
          </div>

          {/* SKU preview */}
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
            <span className="text-grey-muted text-xs">SKU auto-genere: </span>
            <span className="font-mono text-accent text-sm font-bold">
              {(() => {
                const prefixes = { textile: 'TXT', frame: 'FRM', accessory: 'ACC', sticker: 'STK', print: 'PRT', merch: 'MRC', other: 'OTH' };
                const p = prefixes[form.category] || 'OTH';
                const v = (form.variant || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GEN';
                const d = (form.detail || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                return d ? `${p}-${v}-${d}-001` : `${p}-${v}-001`;
              })()}
            </span>
          </div>

          </>)}

          {/* Marque (cache pour cadre et materiel) */}
          {form.category !== 'frame' && form.category !== 'equipment' && (<div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
              {tx({ fr: 'Marque', en: 'Brand', es: 'Marca' })}
            </label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => {
                set('brand', e.target.value);
                // Pour textile, la marque = le nom, auto-update en temps reel
                if (form.category === 'textile') {
                  const parts = [e.target.value, form.variant, form.hasZip ? 'Zip' : '', form.color, form.detail].filter(Boolean);
                  set('nameFr', parts.join(' '));
                }
              }}
              onBlur={autoName}
              placeholder="Ex: Gildan, Bella+Canvas, Stanley/Stella..."
              className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent placeholder:text-grey-muted/50"
            />
          </div>)}

          {/* Couleur + Zip (caches pour Materiel et Cadre) */}
          {form.category !== 'equipment' && form.category !== 'frame' && (<>
          {/* Couleur (dropdown custom avec ronds de couleur) */}
          <div className="relative">
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
              {tx({ fr: 'Couleur', en: 'Color', es: 'Color' })}
            </label>
            <button
              type="button"
              onClick={() => set('_colorOpen', !form._colorOpen)}
              className="w-full flex items-center gap-2.5 rounded-lg bg-black/20 text-sm px-3 py-2.5 outline-none border border-white/5 hover:border-white/15 transition-colors text-left"
            >
              {form.color ? (
                <>
                  <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: (merchColors.find(x => x.name === form.color) || {}).hex || '#888' }} />
                  <span className="text-heading">
                    {lang === 'es' ? (COLOR_NAMES_ES[form.color] || form.color) : lang === 'fr' ? (COLOR_NAMES_FR[form.color] || form.color) : form.color}
                  </span>
                </>
              ) : (
                <span className="text-grey-muted">{tx({ fr: '-- Choisir une couleur --', en: '-- Choose a color --', es: '-- Elegir un color --' })}</span>
              )}
            </button>
            {form._colorOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-white/10 shadow-xl" style={{ background: '#2a2040' }}>
                {SORTED_COLORS.map(c => {
                  const label = lang === 'es' ? (COLOR_NAMES_ES[c.name] || c.name) : lang === 'fr' ? (COLOR_NAMES_FR[c.name] || c.name) : c.name;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { set('color', c.name); set('_colorOpen', false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                        form.color === c.name ? 'bg-accent/20 text-accent' : 'text-heading hover:bg-white/5'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-white/15 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Case Zip */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasZip}
              onChange={(e) => { set('hasZip', e.target.checked); }}
              onBlur={autoName}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.hasZip ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
              {form.hasZip && <Check size={14} className="text-white" />}
            </div>
            <span className="text-heading text-sm font-medium">Zip</span>
          </label>
          </>)}

          {/* Nom produit - cache pour textile (marque = nom) */}
          {form.category !== 'textile' && (
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
                {tx({ fr: 'Nom produit', en: 'Product name', es: 'Nombre producto' })} *
              </label>
              <input
                type="text"
                value={form.nameFr}
                onChange={(e) => set('nameFr', e.target.value)}
                required
                placeholder="Auto-genere ou saisir manuellement"
                className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent placeholder:text-grey-muted/50"
              />
              <p className="text-grey-muted text-[10px] mt-1">Se remplit automatiquement depuis les champs ci-dessus</p>
            </div>
          )}

          {/* Quantite + Prix coutant */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
                {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
              </label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
                {tx({ fr: 'Prix coutant ($)', en: 'Cost price ($)', es: 'Precio costo ($)' })}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={(e) => set('costPrice', e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent placeholder:text-grey-muted/50"
              />
            </div>
          </div>

          {/* Location + Notes */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
              {tx({ fr: 'Emplacement', en: 'Location', es: 'Ubicacion' })}
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Ex: Etagere A3, Bac 2..."
              className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent placeholder:text-grey-muted/50"
            />
          </div>

          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder={tx({ fr: 'Notes supplementaires...', en: 'Additional notes...', es: 'Notas adicionales...' })}
              className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent resize-none placeholder:text-grey-muted/50"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!form.nameFr || !form.category || saving}
            className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : isEdit ? <Save size={16} /> : <Plus size={16} />}
            {saving
              ? tx({ fr: 'Sauvegarde...', en: 'Saving...', es: 'Guardando...' })
              : isEdit
                ? tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })
                : tx({ fr: 'Creer l\'item', en: 'Create item', es: 'Crear item' })}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ---- Page principale ----
function AdminInventaire() {
  const { tx, lang } = useLang();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showForm, setShowForm] = useState(false); // true = creation, item = edition
  const [editItem, setEditItem] = useState(null);
  const [sortKey, setSortKey] = useState('nameFr');
  const [sortDir, setSortDir] = useState('asc');
  const [deleting, setDeleting] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/inventory-items/dashboard');
      setItems(data.data || []);
      setSummary(data.summary || null);
      setError('');
    } catch (err) {
      setError(tx({ fr: 'Impossible de charger l\'inventaire', en: 'Unable to load inventory', es: 'No se puede cargar el inventario' }));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const handleDelete = async (documentId) => {
    try {
      await api.delete(`/inventory-items/${documentId}`);
      setDeleting(null);
      await fetchData();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const getName = (item) => lang === 'en' ? (item.nameEn || item.nameFr) : item.nameFr;

  const isConsommable = (item) => {
    const name = (getName(item) || '').toLowerCase();
    const sku = (item.sku || '').toLowerCase();
    if (name.includes('vinyle') || name.includes('vinyl') || sku.includes('stk-')) return true;
    const isPaper = name.includes('papier') || name.includes('paper') || sku.includes('paper') || sku.includes('papier');
    if (!isPaper) return false;
    const isLargeFormat = name.includes('grand format') || name.includes('large') || name.includes('13x19') || name.includes('17x') || name.includes('24x') || name.includes('a3') || name.includes('tabloid');
    return !isLargeFormat;
  };

  const filtered = items.filter((item) => {
    if (isConsommable(item)) return false;
    const matchSearch = !search || getName(item).toLowerCase().includes(search.toLowerCase()) || (item.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  // Tri
  const sorted = [...filtered].sort((a, b) => {
    let va, vb;
    if (sortKey === 'nameFr') { va = getName(a).toLowerCase(); vb = getName(b).toLowerCase(); }
    else if (sortKey === 'sku') { va = (a.sku || '').toLowerCase(); vb = (b.sku || '').toLowerCase(); }
    else if (sortKey === 'category') { va = a.category || ''; vb = b.category || ''; }
    else if (sortKey === 'variant') { va = (a.variant || '').toLowerCase(); vb = (b.variant || '').toLowerCase(); }
    else if (sortKey === 'detail') {
      const sizeOrder = ['XS','S','M','L','XL','2XL','3XL','A6','A4','A3','A3+','A2'];
      const getSize = (item) => { const p = (item.sku||'').split('-'); const s = p.length >= 4 ? p[p.length-2] : ''; return sizeOrder.indexOf(s); };
      va = getSize(a); vb = getSize(b);
      if (va === -1) va = 99; if (vb === -1) vb = 99;
    }
    else if (sortKey === 'quantity') { va = a.quantity || 0; vb = b.quantity || 0; }
    else if (sortKey === 'location') { va = (a.location || '').toLowerCase(); vb = (b.location || '').toLowerCase(); }
    else { va = ''; vb = ''; }
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  if (loading) {
    return (
      <div className="section-container pt-32 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-grey-muted">
          {tx({ fr: 'Gestion du stock en temps reel', en: 'Real-time stock management', es: 'Gestion de stock en tiempo real' })}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus size={16} />
          {tx({ fr: 'Ajouter', en: 'Add', es: 'Agregar' })}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 shadow-sm error-bg mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: tx({ fr: 'Total items', en: 'Total items', es: 'Total items' }), value: summary.total, icon: Archive },
            { label: tx({ fr: 'Valeur stock', en: 'Stock value', es: 'Valor stock' }), value: `$${summary.totalValue}`, icon: DollarSign },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-glass"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className="text-accent" />
                  <span className="text-grey-muted text-xs uppercase">{card.label}</span>
                </div>
                <div className="text-2xl font-heading font-bold text-heading">
                  {card.value}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input
            type="text"
            placeholder={tx({ fr: 'Rechercher par nom ou SKU...', en: 'Search by name or SKU...', es: 'Buscar por nombre o SKU...' })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-glass text-heading placeholder-grey-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg bg-glass text-heading text-sm px-3 py-2.5 outline-none border border-white/5"
        >
          <option value="all">{tx({ fr: 'Toutes categories', en: 'All categories', es: 'Todas categorias' })}</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl card-bg shadow-lg shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-grey-muted text-xs uppercase tracking-wider">
                {[
                  { key: 'category', label: tx({ fr: 'Cat.', en: 'Cat.', es: 'Cat.' }), align: 'text-left' },
                  { key: 'variant', label: 'Type', align: 'text-left' },
                  { key: 'nameFr', label: tx({ fr: 'Produit', en: 'Product', es: 'Producto' }), align: 'text-left' },
                  { key: 'detail', label: tx({ fr: 'Taille', en: 'Size', es: 'Talla' }), align: 'text-center' },
                  { key: 'sku', label: 'SKU', align: 'text-left' },
                  { key: 'quantity', label: 'Stock', align: 'text-center' },
                  { key: 'location', label: tx({ fr: 'Emplacement', en: 'Location', es: 'Ubicacion' }), align: 'text-left' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className={`${col.align} px-3 py-2 cursor-pointer hover:text-heading transition-colors select-none whitespace-nowrap`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown size={10} className={sortKey === col.key ? 'text-accent' : 'opacity-30'} />
                    </span>
                  </th>
                ))}
                <th className="text-center px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sorted.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.ok;
                  const StatusIcon = statusCfg.icon;
                  const isDeleting = deleting === item.documentId;

                  // Extraire taille depuis le SKU (TXT-HOODIE-XL-001 -> XL)
                  const skuParts = (item.sku || '').split('-');
                  const sizeFromSku = skuParts.length >= 4 ? skuParts[skuParts.length - 2] : '';
                  const allSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'A6', 'A4', 'A3', 'A3+', 'A2'];
                  const size = allSizes.includes(sizeFromSku) ? sizeFromSku : '';

                  // Pour les textiles: afficher la marque (nom sans variant, taille, couleur, zip)
                  const displayName = (() => {
                    const name = getName(item);
                    if (item.category !== 'textile') return name;
                    const colorNames = merchColors.map(c => c.name);
                    const remove = new Set([item.variant, 'Zip', size, ...allSizes]);
                    colorNames.forEach(c => remove.add(c));
                    const brand = name.split(' ').filter(w => w && !remove.has(w)).join(' ');
                    return brand || name;
                  })();

                  return (
                    <motion.tr
                      key={item.documentId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="shadow-[0_-1px_0_rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => openEdit(item)}
                    >
                      <td className="px-3 py-2 text-grey-muted text-xs whitespace-nowrap">
                        {CATEGORY_LABELS[item.category] ? tx(CATEGORY_LABELS[item.category]) : item.category}
                      </td>
                      <td className="px-3 py-2 text-heading text-xs font-medium whitespace-nowrap">
                        {item.variant || '-'}
                      </td>
                      <td className="px-3 py-2 text-heading font-medium text-sm">
                        {displayName}
                      </td>
                      <td className="px-3 py-2 text-center text-heading text-xs font-semibold">
                        {size || '-'}
                      </td>
                      <td className="px-3 py-2 font-mono text-grey-muted text-[11px] whitespace-nowrap">{item.sku || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-semibold text-sm ${item.quantity === 0 ? 'text-yellow-400' : 'text-heading'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-grey-muted text-xs whitespace-nowrap">{item.location || '-'}</td>
                      <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        {isDeleting ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDelete(item.documentId)}
                              className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[10px] font-semibold transition-colors"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setDeleting(null)}
                              className="p-1 rounded-lg text-grey-muted hover:text-heading transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg bg-glass text-grey-muted hover:text-accent transition-colors"
                              title={tx({ fr: 'Modifier', en: 'Edit', es: 'Editar' })}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => setDeleting(item.documentId)}
                              className="p-1.5 rounded-lg bg-glass text-grey-muted hover:text-red-400 transition-colors"
                              title={tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-grey-muted">
            <Package size={40} className="mx-auto mb-4 opacity-30" />
            <p>{tx({ fr: 'Aucun item trouve', en: 'No items found', es: 'Ningun item encontrado' })}</p>
          </div>
        )}
      </div>

      {/* Modal creation */}
      <AnimatePresence>
        {showForm && (
          <ItemForm
            onClose={() => { setShowForm(false); setEditItem(null); }}
            onSaved={() => fetchData()}
            tx={tx}
            lang={lang}
            editItem={editItem}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminInventaire;
