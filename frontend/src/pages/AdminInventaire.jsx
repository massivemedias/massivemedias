import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, XCircle, CheckCircle, Check, Search,
  Edit3, X, Save, Loader2, DollarSign, Archive, Plus, Trash2, ChevronDown,
  Shirt, Layers, PackageOpen, Printer, Frame, ShoppingBag,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';
import { merchColors } from '../data/merchData';

// --- Helpers couleur ---
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
  'White': 'Blanco', 'Natural': 'Natural', 'Light Pink': 'Rosa Claro', 'Light Blue': 'Azul Claro',
  'Safety Green': 'Verde Fluo', 'Safety Pink': 'Rosa Fluo', 'Sand': 'Arena', 'Orchid': 'Orquidea',
  'Sport Grey': 'Gris Sport', 'Carolina Blue': 'Azul Carolina', 'Gold': 'Oro',
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

// =================== CONFIGURATION DES CATEGORIES ===================

const CATEGORY_LABELS = {
  textile:     { fr: 'Textile',      en: 'Textile',     es: 'Textil' },
  consommable: { fr: 'Consommables', en: 'Consumables', es: 'Consumibles' },
  emballage:   { fr: 'Emballage',    en: 'Packaging',   es: 'Embalaje' },
  equipment:   { fr: 'Equipement',   en: 'Equipment',   es: 'Equipo' },
  frame:       { fr: 'Cadre',        en: 'Frame',       es: 'Marco' },
  merch:       { fr: 'Merch',        en: 'Merch',       es: 'Merch' },
  // Legacy (compatibilite anciens items)
  sticker:     'Sticker',
  print:       'Print',
  accessory:   { fr: 'Accessoire',   en: 'Accessory',   es: 'Accesorio' },
};

const CATEGORIES = [
  { value: 'textile',     icon: Shirt,       label: 'Textile',      desc: 'T-Shirts, Hoodies, Crewnecks' },
  { value: 'consommable', icon: Layers,      label: 'Consommables', desc: 'Feuilles, papiers, encres, laminat' },
  { value: 'emballage',   icon: PackageOpen, label: 'Emballage',    desc: 'Boites, enveloppes, protections' },
  { value: 'equipment',   icon: Printer,     label: 'Equipement',   desc: 'Imprimantes, decoupe, laminage' },
  { value: 'frame',       icon: Frame,       label: 'Cadre',        desc: 'Cadres photo et presentoir' },
  { value: 'merch',       icon: ShoppingBag, label: 'Merch',        desc: 'Tote bags, mugs, accessoires' },
];

// Sous-types par categorie (stockes dans le champ `variant`)
const CONSOMMABLE_GROUPS = [
  {
    group: 'Stickers',
    items: [
      'Feuilles sticker clear',
      'Feuilles sticker blanc',
      'Feuilles FX holographique',
      'Feuilles FX glossy',
      'Feuilles FX broken glass',
      'Feuilles FX stars',
    ],
  },
  {
    group: 'Impression grand format',
    items: [
      'Papier fine art',
      'Papier photo lustre',
      'Papier photo brillant',
      'Papier photo mat',
      'Toile (canvas)',
    ],
  },
  {
    group: 'Supports rigides',
    items: ['Forex / Mousse PVC', 'Dibond (allu)'],
  },
  {
    group: 'Laminat',
    items: [
      'Rouleau laminat brillant',
      'Rouleau laminat mat',
      'Rouleau laminat satine',
    ],
  },
  {
    group: 'Machine',
    items: ["Encre imprimante", "Tete d'impression", 'Vinyle de decoupe'],
  },
];

const EMBALLAGE_TYPES = [
  'Enveloppe rigide',
  'Tube carton',
  'Boite carton',
  'Film a bulles',
  'Ruban adhesif',
  'Pochette de protection',
  'Papier de soie',
  'Sachet plastique',
  'Coin de protection',
];

const EQUIPMENT_TYPES = [
  'Imprimante',
  'Lamineuse',
  'Plotter / Decoupeuse',
  'Presse a chaud',
  'Massicot',
  'Scanner',
  'Ordinateur',
  'Ecran / Moniteur',
];

const TEXTILE_VARIANTS = ['T-Shirt', 'Hoodie', 'Crewneck', 'Polo', 'Tank Top'];
const TEXTILE_SIZES    = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

const MERCH_TYPES = ['Tote Bag', 'Mug', 'Tumbler', 'Fanny Pack', 'Casquette', 'Pin / Badge'];
const MERCH_COLORS = ['Blanc', 'Noir', 'Natural', 'Gris', 'Beige', 'Rouge', 'Bleu', 'Rose', 'Vert'];

const CONSOMMABLE_FORMATS = ['8.5x11', '11x17', '13x19', '17x22', 'A4', 'A3', 'A3+', 'A2', '24"', '36"', '44"'];
const EMBALLAGE_SIZES     = ['A6', 'A5', 'A4', 'A3', '5x5', '10x10', '12x12', '4x4x40', '6x6x48'];
const FRAME_SIZES         = ['A6', 'A5', 'A4', 'A3', 'A3+', 'A2', '11x14', '16x20'];
const FRAME_COLORS        = ['Noir', 'Blanc', 'Argent', 'Chene naturel', 'Noyer', 'Gris'];

const SKU_PREFIXES = {
  textile: 'TXT', consommable: 'CSM', emballage: 'EMB',
  equipment: 'EQP', frame: 'FRM', merch: 'MRC',
  sticker: 'STK', print: 'PRT', other: 'OTH',
};

// =================== COMPOSANTS UTILITAIRES ===================

function Chips({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? '' : opt)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            value === opt
              ? 'bg-accent text-white'
              : 'bg-black/20 text-grey-muted hover:text-heading hover:bg-white/5'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-grey-muted text-[10px] mt-1">{hint}</p>}
    </div>
  );
}

function InputText({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg bg-black/20 text-heading text-sm px-4 py-2.5 outline-none border border-white/10 focus:border-accent placeholder:text-grey-muted/50 ${className}`}
    />
  );
}

// =================== FORMULAIRE ===================

function ItemForm({ onClose, onSaved, tx, lang, editItem }) {
  const isEdit = !!editItem;

  const [form, setForm] = useState({
    nameFr:    editItem?.nameFr    || '',
    nameEn:    editItem?.nameEn    || '',
    category:  editItem?.category  || 'textile',
    variant:   editItem?.variant   || '',
    detail:    editItem?.detail    || '',
    color:     editItem?.color     || '',
    brand:     editItem?.brand     || '',
    hasZip:    editItem?.hasZip    ?? false,
    quantity:  editItem?.quantity  ?? 0,
    costPrice: editItem?.costPrice || '',
    location:  editItem?.location  || '',
    notes:     editItem?.notes     || '',
    _colorOpen: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdSku, setCreatedSku] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Calcule le nom depuis les champs
  const computeName = (f) => {
    switch (f.category) {
      case 'textile':
        return [f.brand, f.variant, f.hasZip ? 'Zip' : '', f.color, f.detail].filter(Boolean).join(' ');
      case 'consommable':
        return [f.variant, f.brand, f.detail].filter(Boolean).join(' ');
      case 'emballage':
        return [f.variant, f.detail].filter(Boolean).join(' ');
      case 'equipment':
        return [f.brand, f.variant, f.detail].filter(Boolean).join(' ');
      case 'frame':
        return ['Cadre', f.color, f.detail].filter(Boolean).join(' ');
      case 'merch':
        return [f.variant, f.brand, f.color, f.detail].filter(Boolean).join(' ');
      default:
        return [f.brand, f.variant, f.detail].filter(Boolean).join(' ');
    }
  };

  // Met a jour un champ ET regenere le nom automatiquement
  const upd = (updates) => {
    setForm(f => {
      const next = { ...f, ...updates };
      const name = computeName(next);
      if (name) next.nameFr = name;
      return next;
    });
  };

  const handleCategoryChange = (newCat) => {
    setForm(f => ({
      ...f,
      category: newCat,
      variant: '',
      detail: '',
      color: '',
      hasZip: false,
      nameFr: '',
    }));
  };

  const getSKUPreview = () => {
    const p = SKU_PREFIXES[form.category] || 'OTH';
    const v = (form.variant || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GEN';
    const d = (form.detail || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    return d ? `${p}-${v}-${d}-001` : `${p}-${v}-001`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameFr || !form.category) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        nameFr:    form.nameFr,
        nameEn:    form.nameEn || form.nameFr,
        category:  form.category,
        variant:   form.variant,
        brand:     form.brand,
        color:     form.color,
        detail:    form.detail,
        hasZip:    !!form.hasZip,
        quantity:  Number(form.quantity) || 0,
        costPrice: form.costPrice ? Number(form.costPrice) : 0,
        location:  form.location,
        notes:     form.notes,
      };
      if (isEdit) {
        await api.put(`/inventory-items/${editItem.documentId}/adjust`, payload);
        onSaved();
        onClose();
      } else {
        const res = await api.post('/inventory-items/create', payload);
        setCreatedSku(res.data?.data?.sku || '');
        onSaved();
        // Reset pour ajouter un autre du meme type
        setForm(f => ({
          ...f,
          variant: '', detail: '', color: '', brand: '', hasZip: false,
          quantity: 0, costPrice: '', notes: '', nameFr: '', nameEn: '',
          _colorOpen: false,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // Selecteur de couleur complet (gamme Merch) - pour Textile
  const renderFullColorPicker = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => set('_colorOpen', !form._colorOpen)}
        className="w-full flex items-center gap-3 rounded-lg bg-black/20 text-sm px-4 py-2.5 outline-none border border-white/10 hover:border-white/20 transition-colors text-left"
      >
        {form.color ? (
          <>
            <span
              className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
              style={{ backgroundColor: (merchColors.find(x => x.name === form.color) || {}).hex || '#888' }}
            />
            <span className="text-heading">
              {lang === 'es'
                ? (COLOR_NAMES_ES[form.color] || form.color)
                : lang === 'fr'
                  ? (COLOR_NAMES_FR[form.color] || form.color)
                  : form.color}
            </span>
          </>
        ) : (
          <span className="text-grey-muted">
            {tx({ fr: '-- Choisir une couleur --', en: '-- Choose a color --', es: '-- Elegir un color --' })}
          </span>
        )}
      </button>
      {form._colorOpen && (
        <div
          className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-white/10 shadow-xl"
          style={{ background: 'var(--bg-select-option)' }}
        >
          <button
            type="button"
            onClick={() => { upd({ color: '' }); set('_colorOpen', false); }}
            className="w-full px-3 py-2 text-sm text-grey-muted hover:bg-white/5 text-left"
          >
            -- Aucune --
          </button>
          {SORTED_COLORS.map(c => {
            const label = lang === 'es'
              ? (COLOR_NAMES_ES[c.name] || c.name)
              : lang === 'fr'
                ? (COLOR_NAMES_FR[c.name] || c.name)
                : c.name;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setForm(f => {
                    const next = { ...f, color: c.name, _colorOpen: false };
                    const name = computeName(next);
                    if (name) next.nameFr = name;
                    return next;
                  });
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  form.color === c.name ? 'bg-accent/20 text-accent' : 'text-heading hover:bg-white/5'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-white/15 flex-shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-start justify-center p-4 pt-6 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl rounded-2xl shadow-2xl border border-white/10 mb-8"
        style={{ background: 'var(--bg-select-option)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-white/10">
          <h3 className="text-heading font-heading font-bold text-2xl">
            {isEdit
              ? tx({ fr: "Modifier l'item", en: 'Edit item', es: 'Editar item' })
              : tx({ fr: 'Ajouter au stock', en: 'Add to stock', es: 'Agregar al stock' })}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-grey-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        {createdSku && (
          <div className="mx-8 mt-5 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">
              {tx({ fr: 'Cree!', en: 'Created!', es: 'Creado!' })}{' '}
              SKU: <span className="font-mono font-bold">{createdSku}</span>
            </span>
          </div>
        )}
        {error && (
          <div className="mx-8 mt-5 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex gap-0 divide-x divide-white/10">

            {/* ===== COLONNE GAUCHE: specifique a la categorie ===== */}
            <div className="flex-1 min-w-0 px-8 py-6 space-y-5">

          {/* ===== CATEGORIE ===== */}
          <div>
            <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-3">
              {tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })} *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.category === cat.value
                      ? 'border-accent bg-accent/10'
                      : 'border-white/10 bg-black/20 hover:border-white/25 hover:bg-white/[0.02]'
                  }`}
                >
                  <CatIcon size={20} className={`mb-1.5 ${form.category === cat.value ? 'text-accent' : 'text-grey-muted'}`} />
                  <div className="font-bold text-heading text-sm leading-tight">{cat.label}</div>
                  <div className="text-grey-muted text-[10px] leading-tight mt-0.5">{cat.desc}</div>
                </button>
                );
              })}
            </div>
          </div>

          {/* ===== TEXTILE ===== */}
          {form.category === 'textile' && (<>

            <Field label="Type de vetement">
              <Chips
                options={TEXTILE_VARIANTS}
                value={form.variant}
                onChange={v => upd({ variant: v })}
              />
            </Field>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasZip}
                onChange={e => upd({ hasZip: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.hasZip ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
                {form.hasZip && <Check size={14} className="text-white" />}
              </div>
              <span className="text-heading text-sm font-medium">Zip</span>
            </label>

            <Field label={tx({ fr: 'Marque', en: 'Brand', es: 'Marca' })}>
              <InputText
                value={form.brand}
                onChange={v => upd({ brand: v })}
                placeholder="Ex: Gildan, Bella+Canvas, Stanley/Stella..."
              />
            </Field>

            <Field label={tx({ fr: 'Couleur', en: 'Color', es: 'Color' })}>
              {renderFullColorPicker()}
            </Field>

            <Field label={tx({ fr: 'Taille', en: 'Size', es: 'Talla' })}>
              <Chips
                options={TEXTILE_SIZES}
                value={form.detail}
                onChange={v => upd({ detail: v })}
                className="mb-2"
              />
              <InputText
                value={form.detail}
                onChange={v => upd({ detail: v })}
                placeholder="XS, S, M, L, XL..."
              />
            </Field>

            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <span className="text-grey-muted text-xs">SKU: </span>
              <span className="font-mono text-accent text-sm font-bold">{getSKUPreview()}</span>
            </div>

          </>)}

          {/* ===== CONSOMMABLES ===== */}
          {form.category === 'consommable' && (<>

            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-3">
                Type de consommable *
              </label>
              <div className="space-y-3">
                {CONSOMMABLE_GROUPS.map(group => (
                  <div key={group.group}>
                    <p className="text-grey-muted text-[10px] uppercase tracking-widest mb-1.5 pl-0.5">
                      {group.group}
                    </p>
                    <Chips
                      options={group.items}
                      value={form.variant}
                      onChange={v => upd({ variant: v })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Field
              label={tx({ fr: 'Marque', en: 'Brand', es: 'Marca' })}
              hint="Ex: Epson, Canon, Canson, Hahnemuhle, 3M..."
            >
              <InputText
                value={form.brand}
                onChange={v => upd({ brand: v })}
                placeholder="Facultatif"
              />
            </Field>

            <Field label="Format / Dimension">
              <Chips
                options={CONSOMMABLE_FORMATS}
                value={form.detail}
                onChange={v => upd({ detail: v })}
                className="mb-2"
              />
              <InputText
                value={form.detail}
                onChange={v => upd({ detail: v })}
                placeholder={`Ex: 13x19, A3, 24"...`}
              />
            </Field>

            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <span className="text-grey-muted text-xs">SKU: </span>
              <span className="font-mono text-accent text-sm font-bold">{getSKUPreview()}</span>
            </div>

          </>)}

          {/* ===== EMBALLAGE ===== */}
          {form.category === 'emballage' && (<>

            <Field label="Type d'emballage *">
              <Chips
                options={EMBALLAGE_TYPES}
                value={form.variant}
                onChange={v => upd({ variant: v })}
              />
            </Field>

            <Field label="Taille / Dimension">
              <Chips
                options={EMBALLAGE_SIZES}
                value={form.detail}
                onChange={v => upd({ detail: v })}
                className="mb-2"
              />
              <InputText
                value={form.detail}
                onChange={v => upd({ detail: v })}
                placeholder="Ex: A4, 6x6x48cm..."
              />
            </Field>

            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <span className="text-grey-muted text-xs">SKU: </span>
              <span className="font-mono text-accent text-sm font-bold">{getSKUPreview()}</span>
            </div>

          </>)}

          {/* ===== EQUIPEMENT ===== */}
          {form.category === 'equipment' && (<>

            <Field label="Type d'equipement *">
              <Chips
                options={EQUIPMENT_TYPES}
                value={form.variant}
                onChange={v => upd({ variant: v })}
                className="mb-2"
              />
              <InputText
                value={form.variant}
                onChange={v => upd({ variant: v })}
                placeholder="Ou saisir manuellement..."
              />
            </Field>

            <Field label={tx({ fr: 'Marque', en: 'Brand', es: 'Marca' })}>
              <InputText
                value={form.brand}
                onChange={v => upd({ brand: v })}
                placeholder="Ex: Canon, Epson, Roland, Graphtec..."
              />
            </Field>

            <Field label="Modele / Detail">
              <InputText
                value={form.detail}
                onChange={v => upd({ detail: v })}
                placeholder="Ex: imagePROGRAF PRO-1000, GS-24..."
              />
            </Field>

          </>)}

          {/* ===== CADRE ===== */}
          {form.category === 'frame' && (<>

            <Field label={tx({ fr: 'Couleur', en: 'Color', es: 'Color' })}>
              <Chips
                options={FRAME_COLORS}
                value={form.color}
                onChange={v => upd({ color: v })}
                className="mb-2"
              />
              <InputText
                value={form.color}
                onChange={v => upd({ color: v })}
                placeholder="Ou saisir..."
              />
            </Field>

            <Field label="Taille *">
              <Chips
                options={FRAME_SIZES}
                value={form.detail}
                onChange={v => upd({ detail: v })}
                className="mb-2"
              />
              <InputText
                value={form.detail}
                onChange={v => upd({ detail: v })}
                placeholder="Ex: A4, A3+, 11x14..."
              />
            </Field>

            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <span className="text-grey-muted text-xs">SKU: </span>
              <span className="font-mono text-accent text-sm font-bold">{getSKUPreview()}</span>
            </div>

          </>)}

          {/* ===== MERCH ===== */}
          {form.category === 'merch' && (<>

            <Field label="Type de produit *">
              <Chips
                options={MERCH_TYPES}
                value={form.variant}
                onChange={v => upd({ variant: v })}
                className="mb-2"
              />
              <InputText
                value={form.variant}
                onChange={v => upd({ variant: v })}
                placeholder="Ou saisir..."
              />
            </Field>

            <Field label={tx({ fr: 'Marque', en: 'Brand', es: 'Marca' })}>
              <InputText
                value={form.brand}
                onChange={v => upd({ brand: v })}
                placeholder="Facultatif"
              />
            </Field>

            <Field label={tx({ fr: 'Couleur', en: 'Color', es: 'Color' })}>
              <Chips
                options={MERCH_COLORS}
                value={form.color}
                onChange={v => upd({ color: v })}
                className="mb-2"
              />
              <InputText
                value={form.color}
                onChange={v => upd({ color: v })}
                placeholder="Ou saisir..."
              />
            </Field>

            <Field label="Detail">
              <InputText
                value={form.detail}
                onChange={v => upd({ detail: v })}
                placeholder="Taille, variante..."
              />
            </Field>

            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <span className="text-grey-muted text-xs">SKU: </span>
              <span className="font-mono text-accent text-sm font-bold">{getSKUPreview()}</span>
            </div>

          </>)}

            </div> {/* fin colonne gauche */}

            {/* ===== COLONNE DROITE: champs communs ===== */}
            <div className="w-80 flex-shrink-0 px-8 py-6 space-y-5 flex flex-col">

              <Field
                label={tx({ fr: 'Nom produit', en: 'Product name', es: 'Nombre producto' }) + ' *'}
                hint="Auto-genere - modifiable"
              >
                <InputText
                  value={form.nameFr}
                  onChange={v => set('nameFr', v)}
                  placeholder="Nom de l'item..."
                />
              </Field>

              <Field label={tx({ fr: 'Quantite initiale', en: 'Initial qty', es: 'Cantidad' })}>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                  className="w-full rounded-lg bg-black/20 text-heading text-sm px-4 py-2.5 outline-none border border-white/10 focus:border-accent"
                />
              </Field>

              <Field label={tx({ fr: 'Prix coutant ($)', en: 'Cost price ($)', es: 'Costo ($)' })}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={e => set('costPrice', e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg bg-black/20 text-heading text-sm px-4 py-2.5 outline-none border border-white/10 focus:border-accent placeholder:text-grey-muted/50"
                />
              </Field>

              <Field label={tx({ fr: 'Emplacement', en: 'Location', es: 'Ubicacion' })}>
                <InputText
                  value={form.location}
                  onChange={v => set('location', v)}
                  placeholder="Ex: Etagere A3, Bac 2..."
                />
              </Field>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={4}
                  placeholder={tx({ fr: 'Notes supplementaires...', en: 'Additional notes...', es: 'Notas adicionales...' })}
                  className="w-full rounded-lg bg-black/20 text-heading text-sm px-4 py-2.5 outline-none border border-white/10 focus:border-accent resize-none placeholder:text-grey-muted/50"
                />
              </Field>

              <div className="pt-2 mt-auto">
                <button
                  type="submit"
                  disabled={!form.nameFr || !form.category || saving}
                  className="w-full py-4 rounded-xl bg-accent text-white font-bold text-base disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 hover:brightness-110"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : isEdit ? <Save size={18} /> : <Plus size={18} />}
                  {saving
                    ? tx({ fr: 'Sauvegarde...', en: 'Saving...', es: 'Guardando...' })
                    : isEdit
                      ? tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })
                      : tx({ fr: "Creer l'item", en: 'Create item', es: 'Crear item' })}
                </button>
              </div>

            </div> {/* fin colonne droite */}
          </div> {/* fin flex */}
        </form>
      </motion.div>
    </div>
  );
}

// =================== PAGE PRINCIPALE ===================

function AdminInventaire() {
  const { tx, lang } = useLang();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [openCats, setOpenCats] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/inventory-items/dashboard');
      setItems(data.data || []);
      setSummary(data.summary || null);
      setError('');
    } catch (err) {
      setError(tx({ fr: "Impossible de charger l'inventaire", en: 'Unable to load inventory', es: 'No se puede cargar el inventario' }));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit   = (item) => { setEditItem(item); setShowForm(true); };
  const openCreate = ()     => { setEditItem(null); setShowForm(true); };

  const handleDelete = async (documentId) => {
    try {
      await api.delete(`/inventory-items/${documentId}`);
      setDeleting(null);
      await fetchData();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const getName = (item) => lang === 'en' ? (item.nameEn || item.nameFr) : item.nameFr;

  const filtered = items.filter(item => {
    const matchSearch = !search
      || getName(item).toLowerCase().includes(search.toLowerCase())
      || (item.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchSearch && matchCategory;
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
        <div className="p-4 rounded-lg bg-red-500/10 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Cartes sommaire */}
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
                <div className="text-2xl font-heading font-bold text-heading">{card.value}</div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input
            type="text"
            placeholder={tx({ fr: 'Rechercher par nom ou SKU...', en: 'Search by name or SKU...', es: 'Buscar por nombre o SKU...' })}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-glass text-heading placeholder-grey-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="rounded-lg bg-glass text-heading text-sm px-3 py-2.5 outline-none border border-white/5"
        >
          <option value="all">{tx({ fr: 'Toutes categories', en: 'All categories', es: 'Todas categorias' })}</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
          ))}
        </select>
      </div>

      {/* Accordeons par categorie */}
      {(() => {
        const groups = {};
        filtered.forEach(item => {
          const cat = item.category || 'other';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(item);
        });

        const renderItem = (item) => {
          const isDeleting2 = deleting === item.documentId;
          return (
            <div
              key={item.documentId}
              onClick={() => openEdit(item)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors group"
            >
              <span className="text-heading text-sm font-medium flex-1 truncate">{getName(item)}</span>
              {item.detail && (
                <span className="text-grey-muted text-xs font-mono">{item.detail}</span>
              )}
              <span className={`font-semibold text-sm w-8 text-center ${item.quantity === 0 ? 'text-yellow-400' : 'text-heading'}`}>
                {item.quantity}
              </span>
              {item.location && (
                <span className="text-grey-muted text-[10px] hidden sm:inline">{item.location}</span>
              )}
              <div
                className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => openEdit(item)}
                  className="p-1 rounded text-grey-muted hover:text-accent"
                >
                  <Edit3 size={12} />
                </button>
                {isDeleting2 ? (
                  <>
                    <button
                      onClick={() => handleDelete(item.documentId)}
                      className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setDeleting(null)}
                      className="p-1 text-grey-muted"
                    >
                      <X size={10} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleting(item.documentId)}
                    className="p-1 rounded text-grey-muted hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        };

        const catOrder = ['textile', 'consommable', 'emballage', 'equipment', 'frame', 'merch', 'sticker', 'print', 'other'];
        const sortedCats = Object.keys(groups).sort(
          (a, b) => (catOrder.indexOf(a) === -1 ? 99 : catOrder.indexOf(a)) - (catOrder.indexOf(b) === -1 ? 99 : catOrder.indexOf(b))
        );

        if (sortedCats.length === 0) {
          return (
            <div className="p-12 text-center text-grey-muted">
              <Package size={40} className="mx-auto mb-4 opacity-30" />
              <p>{tx({ fr: 'Aucun item trouve', en: 'No items found', es: 'Ningun item encontrado' })}</p>
            </div>
          );
        }

        return (
          <div className="space-y-2">
            {sortedCats.map(cat => {
              const catItems = groups[cat];
              const catCfg = CATEGORIES.find(c => c.value === cat);
              const catLabelCfg = CATEGORY_LABELS[cat];
              const catLabel = catLabelCfg
                ? (typeof catLabelCfg === 'string' ? catLabelCfg : tx(catLabelCfg))
                : cat;
              const totalQty = catItems.reduce((s, i) => s + (i.quantity || 0), 0);
              const isOpen = openCats.includes(cat);

              // Textile: sous-accordeons par variant (Hoodie, T-Shirt, etc.)
              const hasSubGroups = cat === 'textile';
              const subGroups = {};
              if (hasSubGroups) {
                catItems.forEach(item => {
                  const variant = item.variant || 'Autre';
                  if (!subGroups[variant]) subGroups[variant] = [];
                  subGroups[variant].push(item);
                });
              }

              return (
                <div key={cat} className="rounded-xl card-bg shadow-lg shadow-black/20 overflow-hidden">
                  <button
                    onClick={() => setOpenCats(prev =>
                      isOpen ? prev.filter(c => c !== cat) : [...prev, cat]
                    )}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown size={16} className={`text-grey-muted transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      {catCfg && <span>{catCfg.emoji}</span>}
                      <span className="text-heading font-heading font-bold text-base">{catLabel}</span>
                      <span className="text-grey-muted text-xs">({catItems.length})</span>
                    </div>
                    <span className="text-heading font-semibold text-sm">{totalQty}</span>
                  </button>

                  {isOpen && (
                    <div className="px-2 pb-2">
                      {hasSubGroups ? (
                        Object.entries(subGroups).map(([variant, vItems]) => {
                          const vQty = vItems.reduce((s, i) => s + (i.quantity || 0), 0);
                          const vOpen = openCats.includes(`${cat}_${variant}`);
                          return (
                            <div key={variant} className="ml-2 mb-1">
                              <button
                                onClick={() => setOpenCats(prev =>
                                  vOpen
                                    ? prev.filter(c => c !== `${cat}_${variant}`)
                                    : [...prev, `${cat}_${variant}`]
                                )}
                                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronDown size={12} className={`text-grey-muted transition-transform ${vOpen ? '' : '-rotate-90'}`} />
                                  <span className="text-heading text-xs font-semibold">{variant}</span>
                                  <span className="text-grey-muted text-[10px]">({vItems.length})</span>
                                </div>
                                <span className="text-heading text-xs font-semibold">{vQty}</span>
                              </button>
                              {vOpen && <div className="ml-4">{vItems.map(renderItem)}</div>}
                            </div>
                          );
                        })
                      ) : (
                        catItems.map(renderItem)
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Modal creation / edition */}
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
