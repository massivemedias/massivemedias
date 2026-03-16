import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Receipt, DollarSign, Loader2, Plus, X, Save,
  ChevronLeft, ChevronRight, CheckCircle, ChevronDown, ChevronUp,
  Trash2, Upload, ExternalLink, BarChart3, TrendingUp, TrendingDown,
  Edit3, Image as ImageIcon,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary } from '../services/adminService';
import { uploadFile } from '../services/api';

const CATEGORY_LABELS = {
  consommables: { fr: 'Consommables', en: 'Consumables', es: 'Consumibles' },
  materiel: { fr: 'Materiel', en: 'Materials', es: 'Materiales' },
  shipping: { fr: 'Expedition', en: 'Shipping', es: 'Envio' },
  software: { fr: 'Logiciel', en: 'Software', es: 'Software' },
  marketing: { fr: 'Marketing', en: 'Marketing', es: 'Marketing' },
  equipment: { fr: 'Equipement', en: 'Equipment', es: 'Equipo' },
  taxes: { fr: 'Taxes', en: 'Taxes', es: 'Impuestos' },
  other: { fr: 'Autre', en: 'Other', es: 'Otro' },
};

const CATEGORY_COLORS = {
  consommables: 'bg-cyan-500/20 text-cyan-400',
  materiel: 'bg-orange-500/20 text-orange-400',
  shipping: 'bg-blue-500/20 text-blue-400',
  software: 'bg-purple-500/20 text-purple-400',
  marketing: 'bg-pink-500/20 text-pink-400',
  equipment: 'bg-yellow-500/20 text-yellow-400',
  taxes: 'bg-red-500/20 text-red-400',
  other: 'bg-gray-500/20 text-gray-400',
};

const MONTH_NAMES = {
  fr: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
};

const emptyForm = {
  description: '', amount: '', category: 'consommables', date: new Date().toISOString().split('T')[0],
  vendor: '', receiptNumber: '', receiptUrl: '', taxDeductible: false, tpsAmount: '', tvqAmount: '', notes: '',
};

function AdminDepenses() {
  const { tx, lang } = useLang();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pageSize: 25, total: 0, pageCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileInputRef = useRef(null);

  // Expand / Edit / Delete
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const editFileRef = useRef(null);
  const [uploadingEditReceipt, setUploadingEditReceipt] = useState(false);

  // Year summary
  const [showSummary, setShowSummary] = useState(false);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [yearData, setYearData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

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

  const fetchYearSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const { data } = await getExpenseSummary(summaryYear);
      setYearData(data);
    } catch { /* silent */ } finally { setLoadingSummary(false); }
  }, [summaryYear]);

  useEffect(() => {
    if (showSummary) fetchYearSummary();
  }, [showSummary, fetchYearSummary]);

  // Receipt upload for create form
  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const result = await uploadFile(file);
      setFormData(p => ({ ...p, receiptUrl: result.url }));
    } catch { /* silent */ } finally { setUploadingReceipt(false); }
  };

  // Receipt upload for edit form
  const handleEditReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditReceipt(true);
    try {
      const result = await uploadFile(file);
      setEditData(p => ({ ...p, receiptUrl: result.url }));
    } catch { /* silent */ } finally { setUploadingEditReceipt(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.date) return;
    setSaving(true);
    try {
      await createExpense(formData);
      setShowForm(false);
      setFormData({ ...emptyForm });
      fetchItems();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); setEditingId(null); return; }
    setExpandedId(id);
    setEditingId(null);
    setConfirmDeleteId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.documentId);
    setEditData({
      description: item.description || '',
      amount: item.amount || '',
      category: item.category || 'other',
      date: item.date || '',
      vendor: item.vendor || '',
      receiptNumber: item.receiptNumber || '',
      receiptUrl: item.receiptUrl || '',
      taxDeductible: item.taxDeductible || false,
      tpsAmount: item.tpsAmount || '',
      tvqAmount: item.tvqAmount || '',
      notes: item.notes || '',
    });
  };

  const handleUpdate = async (documentId) => {
    setUpdatingId(documentId);
    try {
      const { data } = await updateExpense(documentId, editData);
      setItems(prev => prev.map(i => i.documentId === documentId ? { ...i, ...data.data } : i));
      setEditingId(null);
      fetchItems(); // refresh summary too
    } catch { /* silent */ } finally { setUpdatingId(null); }
  };

  const handleDelete = async (documentId) => {
    setDeletingId(documentId);
    try {
      await deleteExpense(documentId);
      setItems(prev => prev.filter(i => i.documentId !== documentId));
      setExpandedId(null);
      setConfirmDeleteId(null);
      fetchItems(); // refresh summary
    } catch { /* silent */ } finally { setDeletingId(null); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const fmt = (v) => parseFloat(v || 0).toFixed(2);

  const summaryCards = [
    { label: tx({ fr: 'Total depenses', en: 'Total expenses', es: 'Total gastos' }), value: summary ? `${fmt(summary.total)}$` : '-', icon: Receipt, accent: 'text-accent' },
    { label: tx({ fr: 'TPS payee', en: 'GST paid', es: 'TPS pagado' }), value: summary ? `${fmt(summary.tps)}$` : '-', icon: DollarSign, accent: 'text-blue-400' },
    { label: tx({ fr: 'TVQ payee', en: 'QST paid', es: 'TVQ pagado' }), value: summary ? `${fmt(summary.tvq)}$` : '-', icon: DollarSign, accent: 'text-purple-400' },
    { label: tx({ fr: 'Deductible', en: 'Deductible', es: 'Deducible' }), value: summary ? `${fmt(summary.deductible)}$` : '-', icon: CheckCircle, accent: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-3 md:p-4 bg-glass card-border">
              <div className="flex items-center gap-2 mb-2"><Icon size={16} className={card.accent} /><span className="text-grey-muted text-[10px] md:text-xs">{card.label}</span></div>
              <span className="text-xl md:text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Year summary toggle */}
      <button onClick={() => setShowSummary(!showSummary)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-glass card-border text-sm font-semibold text-heading hover:bg-accent/10 transition-colors w-full md:w-auto">
        <BarChart3 size={16} className="text-accent" />
        {tx({ fr: 'Etat des comptes', en: 'Financial statement', es: 'Estado de cuentas' })}
        {showSummary ? <ChevronUp size={14} className="ml-auto md:ml-2" /> : <ChevronDown size={14} className="ml-auto md:ml-2" />}
      </button>

      {/* Year summary panel */}
      <AnimatePresence>
        {showSummary && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="rounded-xl bg-glass card-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-heading uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={14} className="text-accent" />
                  {tx({ fr: 'Bilan annuel', en: 'Annual summary', es: 'Resumen anual' })}
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSummaryYear(y => y - 1)} className="p-1 rounded bg-glass text-grey-muted hover:text-heading"><ChevronLeft size={14} /></button>
                  <span className="text-sm font-bold text-heading min-w-[4ch] text-center">{summaryYear}</span>
                  <button onClick={() => setSummaryYear(y => y + 1)} className="p-1 rounded bg-glass text-grey-muted hover:text-heading"><ChevronRight size={14} /></button>
                </div>
              </div>

              {loadingSummary ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-accent" /></div>
              ) : yearData ? (
                <>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b card-border">
                          <th className="text-left py-2 text-grey-muted font-semibold">{tx({ fr: 'Mois', en: 'Month', es: 'Mes' })}</th>
                          <th className="text-right py-2 text-green-400 font-semibold">{tx({ fr: 'Revenus', en: 'Revenue', es: 'Ingresos' })}</th>
                          <th className="text-right py-2 text-red-400 font-semibold">{tx({ fr: 'Depenses', en: 'Expenses', es: 'Gastos' })}</th>
                          <th className="text-right py-2 text-blue-400 font-semibold">TPS</th>
                          <th className="text-right py-2 text-purple-400 font-semibold">TVQ</th>
                          <th className="text-right py-2 text-heading font-semibold">{tx({ fr: 'Bilan', en: 'Balance', es: 'Balance' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(yearData.months).map(([key, m]) => {
                          const balance = m.revenue - m.expenses;
                          const hasData = m.revenue > 0 || m.expenses > 0;
                          if (!hasData) return (
                            <tr key={key} className="border-b card-border opacity-30">
                              <td className="py-2 text-grey-muted">{(MONTH_NAMES[lang] || MONTH_NAMES.fr)[parseInt(key) - 1]}</td>
                              <td className="text-right py-2 text-grey-muted">-</td>
                              <td className="text-right py-2 text-grey-muted">-</td>
                              <td className="text-right py-2 text-grey-muted">-</td>
                              <td className="text-right py-2 text-grey-muted">-</td>
                              <td className="text-right py-2 text-grey-muted">-</td>
                            </tr>
                          );
                          return (
                            <tr key={key} className="border-b card-border">
                              <td className="py-2 text-heading font-medium">{(MONTH_NAMES[lang] || MONTH_NAMES.fr)[parseInt(key) - 1]}</td>
                              <td className="text-right py-2 text-green-400">{fmt(m.revenue)}$</td>
                              <td className="text-right py-2 text-red-400">{fmt(m.expenses)}$</td>
                              <td className="text-right py-2 text-blue-400">{fmt(m.tps)}$</td>
                              <td className="text-right py-2 text-purple-400">{fmt(m.tvq)}$</td>
                              <td className={`text-right py-2 font-semibold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {balance >= 0 ? '+' : ''}{fmt(balance)}$
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-accent/30">
                          <td className="py-3 text-heading font-bold">Total {summaryYear}</td>
                          <td className="text-right py-3 text-green-400 font-bold">{fmt(yearData.totals.revenue)}$</td>
                          <td className="text-right py-3 text-red-400 font-bold">{fmt(yearData.totals.expenses)}$</td>
                          <td className="text-right py-3 text-blue-400 font-bold">{fmt(yearData.totals.tps)}$</td>
                          <td className="text-right py-3 text-purple-400 font-bold">{fmt(yearData.totals.tvq)}$</td>
                          <td className={`text-right py-3 font-bold text-lg ${(yearData.totals.revenue - yearData.totals.expenses) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(yearData.totals.revenue - yearData.totals.expenses) >= 0 ? '+' : ''}{fmt(yearData.totals.revenue - yearData.totals.expenses)}$
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Tax summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    <div className="rounded-lg bg-accent/5 p-3 card-border">
                      <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TPS percue', en: 'GST collected', es: 'TPS cobrado' })}</p>
                      <p className="text-sm font-bold text-green-400">{fmt(yearData.totals.revenueTps)}$</p>
                    </div>
                    <div className="rounded-lg bg-accent/5 p-3 card-border">
                      <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TPS payee', en: 'GST paid', es: 'TPS pagado' })}</p>
                      <p className="text-sm font-bold text-red-400">{fmt(yearData.totals.tps)}$</p>
                    </div>
                    <div className="rounded-lg bg-accent/5 p-3 card-border">
                      <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TVQ percue', en: 'QST collected', es: 'TVQ cobrado' })}</p>
                      <p className="text-sm font-bold text-green-400">{fmt(yearData.totals.revenueTvq)}$</p>
                    </div>
                    <div className="rounded-lg bg-accent/5 p-3 card-border">
                      <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TVQ payee', en: 'QST paid', es: 'TVQ pagado' })}</p>
                      <p className="text-sm font-bold text-red-400">{fmt(yearData.totals.tvq)}$</p>
                    </div>
                  </div>

                  {/* Net tax owing */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 rounded-lg bg-blue-500/5 p-3 card-border">
                      <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TPS nette a remettre', en: 'Net GST owing', es: 'TPS neto a remitir' })}</p>
                      <p className={`text-lg font-bold ${(yearData.totals.revenueTps - yearData.totals.tps) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {fmt(yearData.totals.revenueTps - yearData.totals.tps)}$
                      </p>
                    </div>
                    <div className="flex-1 rounded-lg bg-purple-500/5 p-3 card-border">
                      <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TVQ nette a remettre', en: 'Net QST owing', es: 'TVQ neto a remitir' })}</p>
                      <p className={`text-lg font-bold ${(yearData.totals.revenueTvq - yearData.totals.tvq) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {fmt(yearData.totals.revenueTvq - yearData.totals.tvq)}$
                      </p>
                    </div>
                    <div className="flex-1 rounded-lg bg-accent/5 p-3 card-border">
                      <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'Depenses deductibles', en: 'Deductible expenses', es: 'Gastos deducibles' })}</p>
                      <p className="text-lg font-bold text-green-400">{fmt(yearData.totals.deductible)}$</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + filter + add button */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setMeta(prev => ({ ...prev, page: 1 })); }}
            placeholder={tx({ fr: 'Rechercher...', en: 'Search...', es: 'Buscar...' })} className="input-field pl-9 text-sm" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...Object.keys(CATEGORY_LABELS)].map((c) => (
            <button key={c} onClick={() => { setFilterCat(c); setMeta(prev => ({ ...prev, page: 1 })); setExpandedId(null); }}
              className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-semibold transition-all ${filterCat === c ? 'text-accent' : 'text-grey-muted hover:text-accent'}`}>
              {c === 'all' ? tx({ fr: 'Tout', en: 'All', es: 'Todo' }) : tx(CATEGORY_LABELS[c])}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition-colors whitespace-nowrap">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' }) : tx({ fr: 'Ajouter', en: 'Add', es: 'Agregar' })}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreate} className="rounded-xl bg-glass p-4 card-border overflow-hidden space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder={tx({ fr: 'Description *', en: 'Description *', es: 'Descripcion *' })} className="input-field text-sm" required />
              <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                placeholder={tx({ fr: 'Montant $ *', en: 'Amount $ *', es: 'Monto $ *' })} className="input-field text-sm" required />
              <input type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} className="input-field text-sm" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" value={formData.receiptNumber} onChange={(e) => setFormData(p => ({ ...p, receiptNumber: e.target.value }))}
                placeholder={tx({ fr: 'No. facture / recu', en: 'Invoice / receipt #', es: 'No. factura / recibo' })} className="input-field text-sm" />
              <textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder={tx({ fr: 'Notes', en: 'Notes', es: 'Notas' })} rows={1} className="input-field text-sm resize-none" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-heading cursor-pointer">
                <input type="checkbox" checked={formData.taxDeductible} onChange={(e) => setFormData(p => ({ ...p, taxDeductible: e.target.checked }))} className="w-4 h-4 accent-accent" />
                {tx({ fr: 'Deductible d\'impot', en: 'Tax deductible', es: 'Deducible' })}
              </label>

              {/* Receipt upload */}
              <input type="file" ref={fileInputRef} onChange={handleReceiptUpload} accept="image/*,.pdf" className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingReceipt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-glass card-border text-xs text-grey-muted hover:text-heading transition-colors disabled:opacity-50">
                {uploadingReceipt ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {formData.receiptUrl ? tx({ fr: 'Recu joint', en: 'Receipt attached', es: 'Recibo adjunto' }) : tx({ fr: 'Joindre recu', en: 'Attach receipt', es: 'Adjuntar recibo' })}
              </button>
              {formData.receiptUrl && (
                <a href={formData.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                  <ExternalLink size={10} /> {tx({ fr: 'Voir', en: 'View', es: 'Ver' })}
                </a>
              )}

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
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[90px_1fr_120px_110px_80px_55px_55px_30px_30px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b card-border">
            <span>Date</span>
            <span>Description</span>
            <span>{tx({ fr: 'Fournisseur', en: 'Vendor', es: 'Proveedor' })}</span>
            <span>{tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })}</span>
            <span>{tx({ fr: 'Montant', en: 'Amount', es: 'Monto' })}</span>
            <span>TPS</span>
            <span>TVQ</span>
            <span></span>
            <span></span>
          </div>

          <AnimatePresence>
            {items.map((item) => {
              const isExpanded = expandedId === item.documentId;
              const isEditing = editingId === item.documentId;
              const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;

              return (
                <motion.div key={item.documentId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b last:border-b-0 card-border">
                  {/* Desktop row */}
                  <div onClick={() => toggleExpand(item.documentId)}
                    className="hidden md:grid grid-cols-[90px_1fr_120px_110px_80px_55px_55px_30px_30px] gap-3 px-4 py-3 items-center cursor-pointer hover:bg-accent/5 transition-colors">
                    <span className="text-xs text-grey-muted">{formatDate(item.date)}</span>
                    <span className="text-sm text-heading font-medium truncate flex items-center gap-1.5">
                      {item.receiptUrl && <ImageIcon size={12} className="text-accent flex-shrink-0" />}
                      {item.description}
                    </span>
                    <span className="text-xs text-grey-muted truncate">{item.vendor || '-'}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${catColor}`}>
                      {CATEGORY_LABELS[item.category] ? tx(CATEGORY_LABELS[item.category]) : item.category}
                    </span>
                    <span className="text-sm text-heading font-semibold">{fmt(item.amount)}$</span>
                    <span className="text-xs text-grey-muted">{fmt(item.tpsAmount)}</span>
                    <span className="text-xs text-grey-muted">{fmt(item.tvqAmount)}</span>
                    <span className="text-xs">{item.taxDeductible ? <CheckCircle size={12} className="text-green-400" /> : ''}</span>
                    <span className="text-grey-muted justify-self-end">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                  </div>

                  {/* Mobile row */}
                  <div onClick={() => toggleExpand(item.documentId)}
                    className="md:hidden px-4 py-3 cursor-pointer hover:bg-accent/5 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-heading font-medium truncate flex-1 flex items-center gap-1.5">
                        {item.receiptUrl && <ImageIcon size={12} className="text-accent flex-shrink-0" />}
                        {item.description}
                      </span>
                      <span className="text-sm text-heading font-semibold whitespace-nowrap">{fmt(item.amount)}$</span>
                      <span className="text-grey-muted">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-grey-muted">{formatDate(item.date)}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${catColor}`}>
                        {CATEGORY_LABELS[item.category] ? tx(CATEGORY_LABELS[item.category]) : item.category}
                      </span>
                      {item.vendor && <span className="text-[11px] text-grey-muted truncate">{item.vendor}</span>}
                      {item.taxDeductible && <CheckCircle size={10} className="text-green-400" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pt-1 space-y-3 border-t card-border bg-glass/50" onClick={(e) => e.stopPropagation()}>

                          {isEditing ? (
                            /* Edit form */
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input type="text" value={editData.description} onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))}
                                  placeholder={tx({ fr: 'Description *', en: 'Description *', es: 'Descripcion *' })} className="input-field text-sm" />
                                <input type="number" step="0.01" value={editData.amount} onChange={(e) => setEditData(p => ({ ...p, amount: e.target.value }))}
                                  placeholder={tx({ fr: 'Montant $ *', en: 'Amount $ *', es: 'Monto $ *' })} className="input-field text-sm" />
                                <input type="date" value={editData.date} onChange={(e) => setEditData(p => ({ ...p, date: e.target.value }))} className="input-field text-sm" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <select value={editData.category} onChange={(e) => setEditData(p => ({ ...p, category: e.target.value }))} className="input-field text-sm">
                                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{tx(v)}</option>)}
                                </select>
                                <input type="text" value={editData.vendor} onChange={(e) => setEditData(p => ({ ...p, vendor: e.target.value }))}
                                  placeholder={tx({ fr: 'Fournisseur', en: 'Vendor', es: 'Proveedor' })} className="input-field text-sm" />
                                <input type="number" step="0.01" value={editData.tpsAmount} onChange={(e) => setEditData(p => ({ ...p, tpsAmount: e.target.value }))}
                                  placeholder="TPS $" className="input-field text-sm" />
                                <input type="number" step="0.01" value={editData.tvqAmount} onChange={(e) => setEditData(p => ({ ...p, tvqAmount: e.target.value }))}
                                  placeholder="TVQ $" className="input-field text-sm" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input type="text" value={editData.receiptNumber} onChange={(e) => setEditData(p => ({ ...p, receiptNumber: e.target.value }))}
                                  placeholder={tx({ fr: 'No. facture / recu', en: 'Invoice / receipt #', es: 'No. factura / recibo' })} className="input-field text-sm" />
                                <textarea value={editData.notes} onChange={(e) => setEditData(p => ({ ...p, notes: e.target.value }))}
                                  placeholder={tx({ fr: 'Notes', en: 'Notes', es: 'Notas' })} rows={1} className="input-field text-sm resize-none" />
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <label className="flex items-center gap-2 text-sm text-heading cursor-pointer">
                                  <input type="checkbox" checked={editData.taxDeductible} onChange={(e) => setEditData(p => ({ ...p, taxDeductible: e.target.checked }))} className="w-4 h-4 accent-accent" />
                                  {tx({ fr: 'Deductible', en: 'Deductible', es: 'Deducible' })}
                                </label>
                                <input type="file" ref={editFileRef} onChange={handleEditReceiptUpload} accept="image/*,.pdf" className="hidden" />
                                <button type="button" onClick={() => editFileRef.current?.click()} disabled={uploadingEditReceipt}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-glass card-border text-xs text-grey-muted hover:text-heading transition-colors disabled:opacity-50">
                                  {uploadingEditReceipt ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                  {editData.receiptUrl ? tx({ fr: 'Recu joint', en: 'Receipt attached', es: 'Recibo adjunto' }) : tx({ fr: 'Joindre recu', en: 'Attach receipt', es: 'Adjuntar recibo' })}
                                </button>
                                {editData.receiptUrl && (
                                  <a href={editData.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                                    <ExternalLink size={10} /> {tx({ fr: 'Voir recu', en: 'View receipt', es: 'Ver recibo' })}
                                  </a>
                                )}
                                <div className="ml-auto flex items-center gap-2">
                                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-glass text-xs text-grey-muted hover:text-heading transition-colors">
                                    {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                                  </button>
                                  <button onClick={() => handleUpdate(item.documentId)} disabled={updatingId === item.documentId}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50">
                                    {updatingId === item.documentId ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    {tx({ fr: 'Sauver', en: 'Save', es: 'Guardar' })}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Read view */
                            <>
                              {/* Receipt image */}
                              {item.receiptUrl && (
                                <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
                                  <img src={item.receiptUrl} alt="Recu" className="max-h-48 rounded-lg border card-border object-contain" />
                                </a>
                              )}

                              {/* Info grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {item.receiptNumber && (
                                  <div><span className="text-grey-muted text-xs">{tx({ fr: 'No. recu:', en: 'Receipt #:', es: 'No. recibo:' })} </span><span className="text-heading">{item.receiptNumber}</span></div>
                                )}
                                {item.notes && (
                                  <div className="col-span-2"><span className="text-grey-muted text-xs">Notes: </span><span className="text-heading whitespace-pre-wrap">{item.notes}</span></div>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => startEdit(item)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-xs font-semibold hover:bg-accent/30 transition-colors">
                                  <Edit3 size={12} /> {tx({ fr: 'Modifier', en: 'Edit', es: 'Editar' })}
                                </button>

                                {confirmDeleteId === item.documentId ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-400">{tx({ fr: 'Confirmer?', en: 'Confirm?', es: 'Confirmar?' })}</span>
                                    <button onClick={() => handleDelete(item.documentId)} disabled={deletingId === item.documentId}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50">
                                      {deletingId === item.documentId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                      {tx({ fr: 'Oui, supprimer', en: 'Yes, delete', es: 'Si, eliminar' })}
                                    </button>
                                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 rounded-lg bg-glass text-xs text-grey-muted hover:text-heading transition-colors">
                                      {tx({ fr: 'Non', en: 'No', es: 'No' })}
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDeleteId(item.documentId)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors">
                                    <Trash2 size={12} /> {tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {meta.pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => { setMeta(prev => ({ ...prev, page: prev.page - 1 })); setExpandedId(null); }} disabled={meta.page <= 1}
            className="p-2 rounded-lg bg-glass text-grey-muted hover:text-heading disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm text-grey-muted">{meta.page} / {meta.pageCount}</span>
          <button onClick={() => { setMeta(prev => ({ ...prev, page: prev.page + 1 })); setExpandedId(null); }} disabled={meta.page >= meta.pageCount}
            className="p-2 rounded-lg bg-glass text-grey-muted hover:text-heading disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}

export default AdminDepenses;
