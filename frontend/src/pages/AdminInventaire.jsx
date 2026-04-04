import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, XCircle, CheckCircle, Search,
  Edit3, X, Save, Loader2, DollarSign, Archive, Plus,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

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
  other: { fr: 'Autre', en: 'Other', es: 'Otro' },
};

const CATEGORIES = [
  { value: 'textile', label: 'Textile (Hoodie, T-shirt, Crewneck...)' },
  { value: 'frame', label: 'Cadre' },
  { value: 'accessory', label: 'Accessoire' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'print', label: 'Print' },
  { value: 'merch', label: 'Merch (Tote bag, Mug...)' },
  { value: 'other', label: 'Autre' },
];

// Variantes suggerees par categorie
const VARIANT_SUGGESTIONS = {
  textile: ['Hoodie', 'T-Shirt', 'Crewneck', 'Tank Top', 'Jogger', 'Cap'],
  frame: ['Black', 'White', 'Natural', 'Gold'],
  accessory: ['Tote Bag', 'Fanny Pack', 'Phone Case', 'Poster Tube'],
  sticker: ['Clear', 'Glossy', 'Holographic', 'Broken Glass', 'Stars'],
  print: ['Fine Art', 'Photo', 'Canvas', 'Metal'],
  merch: ['Mug', 'Tumbler', 'Mousepad', 'Pin', 'Patch'],
  other: [],
};

const SIZE_SUGGESTIONS = {
  textile: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  frame: ['A6', 'A4', 'A3', 'A3+', 'A2'],
  sticker: ['2"', '3"', '4"', '5"'],
  print: ['A6', 'A4', 'A3', 'A3+', 'A2'],
  default: [],
};

// ---- Formulaire creation ----
function CreateItemForm({ onClose, onCreated, tx }) {
  const [form, setForm] = useState({
    nameFr: '', nameEn: '', category: 'textile', variant: '', detail: '',
    quantity: 0, costPrice: '', location: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdSku, setCreatedSku] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const variants = VARIANT_SUGGESTIONS[form.category] || [];
  const sizes = SIZE_SUGGESTIONS[form.category] || SIZE_SUGGESTIONS.default;

  // Auto-generer le nom FR
  const autoName = () => {
    const parts = [form.variant, form.detail].filter(Boolean);
    if (parts.length > 0 && !form.nameFr) {
      set('nameFr', parts.join(' '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameFr || !form.category) return;
    setSaving(true);
    setError('');
    try {
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
      onCreated();
      // Reset pour ajouter un autre
      setForm(f => ({ ...f, nameFr: '', nameEn: '', variant: '', detail: '', quantity: 0, costPrice: '', notes: '' }));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur de creation');
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
            {tx({ fr: 'Ajouter au stock', en: 'Add to stock', es: 'Agregar al stock' })}
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
              onChange={(e) => { set('category', e.target.value); set('variant', ''); set('detail', ''); }}
              className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2.5 outline-none border border-white/5 focus:border-accent"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

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

          {/* Nom FR / EN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
                {tx({ fr: 'Nom FR', en: 'Name FR', es: 'Nombre FR' })} *
              </label>
              <input
                type="text"
                value={form.nameFr}
                onChange={(e) => set('nameFr', e.target.value)}
                required
                placeholder="Hoodie Noir L"
                className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent placeholder:text-grey-muted/50"
              />
            </div>
            <div>
              <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1">
                {tx({ fr: 'Nom EN', en: 'Name EN', es: 'Nombre EN' })}
              </label>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => set('nameEn', e.target.value)}
                placeholder="Black Hoodie L"
                className="w-full rounded-lg bg-black/20 text-heading text-sm px-3 py-2 outline-none border border-white/5 focus:border-accent placeholder:text-grey-muted/50"
              />
            </div>
          </div>

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
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving
              ? tx({ fr: 'Creation...', en: 'Creating...', es: 'Creando...' })
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
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ quantity: 0, nameFr: '' });
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

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

  const handleSave = async (documentId) => {
    setSaving(true);
    try {
      await api.put(`/inventory-items/${documentId}/adjust`, editData);
      setEditingId(null);
      await fetchData();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.documentId);
    setEditData({ quantity: item.quantity || 0, nameFr: item.nameFr || '' });
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
          onClick={() => setShowCreate(true)}
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
                <th className="text-left px-4 py-2">{tx({ fr: 'Produit', en: 'Product', es: 'Producto' })}</th>
                <th className="text-left px-4 py-2">SKU</th>
                <th className="text-left px-4 py-2">{tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })}</th>
                <th className="text-center px-4 py-2">Stock</th>
                <th className="text-center px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.ok;
                  const StatusIcon = statusCfg.icon;
                  const isEditing = editingId === item.documentId;

                  return (
                    <motion.tr
                      key={item.documentId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="shadow-[0_-1px_0_rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-2 text-heading font-medium">
                        <div className="flex items-center gap-2">
                          <StatusIcon size={14} className={statusCfg.color.split(' ')[1]} />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.nameFr}
                              onChange={(e) => setEditData(d => ({ ...d, nameFr: e.target.value }))}
                              className="w-full rounded bg-glass text-heading p-1 text-sm"
                            />
                          ) : getName(item)}
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono text-grey-muted text-xs">{item.sku || '-'}</td>
                      <td className="px-4 py-2 text-grey-muted text-xs">
                        {CATEGORY_LABELS[item.category] ? tx(CATEGORY_LABELS[item.category]) : item.category}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData.quantity}
                            onChange={(e) => setEditData(d => ({ ...d, quantity: Number(e.target.value) }))}
                            className="w-16 text-center rounded bg-glass text-heading p-1 text-sm"
                            min="0"
                          />
                        ) : (
                          <span className={`font-medium ${item.status === 'out' ? 'text-red-400' : item.status === 'low' ? 'text-orange-400' : 'text-heading'}`}>
                            {item.quantity}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSave(item.documentId)}
                              disabled={saving}
                              className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                            >
                              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded-lg bg-glass text-grey-muted hover:text-accent transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
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
        {showCreate && (
          <CreateItemForm
            onClose={() => setShowCreate(false)}
            onCreated={() => fetchData()}
            tx={tx}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminInventaire;
