import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Receipt, DollarSign, Loader2, Plus, X, Save,
  ChevronLeft, ChevronRight, CheckCircle,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getExpenses, createExpense } from '../services/adminService';

const CATEGORY_LABELS = {
  materials: { fr: 'Materiaux', en: 'Materials', es: 'Materiales' },
  shipping: { fr: 'Expedition', en: 'Shipping', es: 'Envio' },
  software: { fr: 'Logiciel', en: 'Software', es: 'Software' },
  marketing: { fr: 'Marketing', en: 'Marketing', es: 'Marketing' },
  rent: { fr: 'Loyer', en: 'Rent', es: 'Alquiler' },
  equipment: { fr: 'Equipement', en: 'Equipment', es: 'Equipo' },
  taxes: { fr: 'Taxes', en: 'Taxes', es: 'Impuestos' },
  other: { fr: 'Autre', en: 'Other', es: 'Otro' },
};

function AdminDepenses() {
  const { tx } = useLang();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pageSize: 25, total: 0, pageCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    description: '', amount: '', category: 'materials', date: new Date().toISOString().split('T')[0],
    vendor: '', taxDeductible: false, tpsAmount: '', tvqAmount: '', notes: '',
  });

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: meta.page, pageSize: meta.pageSize };
      if (filterCat !== 'all') params.category = filterCat;
      if (searchDebounce) params.search = searchDebounce;
      const { data } = await getExpenses(params);
      setItems(data.data);
      setSummary(data.summary);
      setMeta(data.meta);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [meta.page, filterCat, searchDebounce]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.date) return;
    setSaving(true);
    try {
      await createExpense(formData);
      setShowForm(false);
      setFormData({ description: '', amount: '', category: 'materials', date: new Date().toISOString().split('T')[0], vendor: '', taxDeductible: false, tpsAmount: '', tvqAmount: '', notes: '' });
      fetchItems();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const summaryCards = [
    { label: tx({ fr: 'Total depenses', en: 'Total expenses', es: 'Total gastos' }), value: summary ? `${summary.total.toFixed(2)}$` : '-', icon: Receipt, accent: 'text-accent' },
    { label: tx({ fr: 'TPS payee', en: 'GST paid', es: 'TPS pagado' }), value: summary ? `${summary.tps.toFixed(2)}$` : '-', icon: DollarSign, accent: 'text-blue-400' },
    { label: tx({ fr: 'TVQ payee', en: 'QST paid', es: 'TVQ pagado' }), value: summary ? `${summary.tvq.toFixed(2)}$` : '-', icon: DollarSign, accent: 'text-purple-400' },
    { label: tx({ fr: 'Deductible', en: 'Deductible', es: 'Deducible' }), value: summary ? `${summary.deductible.toFixed(2)}$` : '-', icon: CheckCircle, accent: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 bg-glass card-border">
              <div className="flex items-center gap-2 mb-2"><Icon size={16} className={card.accent} /><span className="text-grey-muted text-xs">{card.label}</span></div>
              <span className="text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Search + filter + add button */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setMeta(prev => ({ ...prev, page: 1 })); }}
            placeholder={tx({ fr: 'Rechercher...', en: 'Search...', es: 'Buscar...' })} className="input-field pl-9 text-sm" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...Object.keys(CATEGORY_LABELS)].map((c) => (
            <button key={c} onClick={() => { setFilterCat(c); setMeta(prev => ({ ...prev, page: 1 })); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterCat === c ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'}`}>
              {c === 'all' ? tx({ fr: 'Tout', en: 'All', es: 'Todo' }) : tx(CATEGORY_LABELS[c])}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition-colors">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' }) : tx({ fr: 'Ajouter', en: 'Add', es: 'Agregar' })}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreate} className="rounded-xl bg-glass p-4 card-border overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input type="text" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder={tx({ fr: 'Description *', en: 'Description *', es: 'Descripcion *' })} className="input-field text-sm" required />
              <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                placeholder={tx({ fr: 'Montant $ *', en: 'Amount $ *', es: 'Monto $ *' })} className="input-field text-sm" required />
              <input type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} className="input-field text-sm" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <select value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} className="input-field text-sm">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{tx(v)}</option>)}
              </select>
              <input type="text" value={formData.vendor} onChange={(e) => setFormData(p => ({ ...p, vendor: e.target.value }))}
                placeholder={tx({ fr: 'Fournisseur', en: 'Vendor', es: 'Proveedor' })} className="input-field text-sm" />
              <input type="number" step="0.01" value={formData.tpsAmount} onChange={(e) => setFormData(p => ({ ...p, tpsAmount: e.target.value }))}
                placeholder="TPS $" className="input-field text-sm" />
              <input type="number" step="0.01" value={formData.tvqAmount} onChange={(e) => setFormData(p => ({ ...p, tvqAmount: e.target.value }))}
                placeholder="TVQ $" className="input-field text-sm" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-heading cursor-pointer">
                <input type="checkbox" checked={formData.taxDeductible} onChange={(e) => setFormData(p => ({ ...p, taxDeductible: e.target.checked }))} className="w-4 h-4 accent-accent" />
                {tx({ fr: 'Deductible d\'impot', en: 'Tax deductible', es: 'Deducible' })}
              </label>
              <button type="submit" disabled={saving} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-accent" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-grey-muted">{tx({ fr: 'Aucune depense', en: 'No expenses', es: 'Sin gastos' })}</div>
      ) : (
        <div className="rounded-xl bg-glass overflow-hidden card-border">
          <div className="hidden md:grid grid-cols-[100px_1fr_120px_100px_80px_60px_60px_60px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b card-border">
            <span>Date</span>
            <span>Description</span>
            <span>{tx({ fr: 'Fournisseur', en: 'Vendor', es: 'Proveedor' })}</span>
            <span>{tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })}</span>
            <span>{tx({ fr: 'Montant', en: 'Amount', es: 'Monto' })}</span>
            <span>TPS</span>
            <span>TVQ</span>
            <span>{tx({ fr: 'Ded.', en: 'Ded.', es: 'Ded.' })}</span>
          </div>

          {items.map((item) => (
            <div key={item.documentId} className="grid grid-cols-1 md:grid-cols-[100px_1fr_120px_100px_80px_60px_60px_60px] gap-2 md:gap-3 px-4 py-3 items-center border-b last:border-b-0 card-border hover:bg-accent/5 transition-colors">
              <span className="text-xs text-grey-muted">{formatDate(item.date)}</span>
              <span className="text-sm text-heading font-medium truncate">{item.description}</span>
              <span className="text-xs text-grey-muted truncate">{item.vendor || '-'}</span>
              <span className="text-xs text-grey-muted">{CATEGORY_LABELS[item.category] ? tx(CATEGORY_LABELS[item.category]) : item.category}</span>
              <span className="text-sm text-heading font-semibold">{parseFloat(item.amount).toFixed(2)}$</span>
              <span className="text-xs text-grey-muted">{parseFloat(item.tpsAmount || 0).toFixed(2)}$</span>
              <span className="text-xs text-grey-muted">{parseFloat(item.tvqAmount || 0).toFixed(2)}$</span>
              <span className="text-xs">{item.taxDeductible ? <CheckCircle size={14} className="text-green-400" /> : '-'}</span>
            </div>
          ))}
        </div>
      )}

      {meta.pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setMeta(prev => ({ ...prev, page: prev.page - 1 }))} disabled={meta.page <= 1} className="p-2 rounded-lg bg-glass text-grey-muted hover:text-heading disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm text-grey-muted">{meta.page} / {meta.pageCount}</span>
          <button onClick={() => setMeta(prev => ({ ...prev, page: prev.page + 1 }))} disabled={meta.page >= meta.pageCount} className="p-2 rounded-lg bg-glass text-grey-muted hover:text-heading disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}

export default AdminDepenses;
