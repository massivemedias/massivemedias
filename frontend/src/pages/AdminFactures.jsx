import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, DollarSign, Loader2, Plus, X, Save,
  CheckCircle, Trash2, Download, Send, Eye, ChevronDown, ChevronUp,
  ArrowUpRight, ArrowDownLeft,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Tooltip from '../components/Tooltip';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, uploadInvoicePDF } from '../services/adminService';
import { generateManualInvoicePDF } from '../utils/generateInvoice';

const AdminDepenses = lazy(() => import('./AdminDepenses'));

const STATUS_LABELS = {
  draft: { fr: 'Brouillon', en: 'Draft', es: 'Borrador', color: 'bg-gray-500/20 text-gray-400' },
  sent: { fr: 'Envoyee', en: 'Sent', es: 'Enviada', color: 'bg-blue-500/20 text-blue-400' },
  paid: { fr: 'Payee', en: 'Paid', es: 'Pagada', color: 'bg-green-500/20 text-green-400' },
  cancelled: { fr: 'Annulee', en: 'Cancelled', es: 'Cancelada', color: 'bg-red-500/20 text-red-400' },
};

const TPS_RATE = 0.05;
const TVQ_RATE = 0.09975;

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MM-${y}${m}${d}-${rand}`;
}

function FacturesSortantes() {
  const { tx, lang } = useLang();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  // Form state
  const [form, setForm] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ description: '', category: '', prix: 0, qty: 1 }],
    discountPercent: 0,
    notes: '',
    status: 'draft',
  });

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await getInvoices();
      const data = res.data?.data || res.data || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement factures:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const resetForm = () => {
    setForm({
      invoiceNumber: generateInvoiceNumber(),
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      items: [{ description: '', category: '', prix: 0, qty: 1 }],
      discountPercent: 0,
      notes: '',
      status: 'draft',
    });
  };

  const openNewForm = () => {
    resetForm();
    setPdfFile(null);
    setShowForm(true);
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { description: '', category: '', prix: 0, qty: 1 }] }));
  };

  const removeItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: field === 'prix' || field === 'qty' ? Number(value) || 0 : value };
      return { ...f, items };
    });
  };

  // Computed totals
  const subtotal = form.items.reduce((sum, it) => sum + (it.prix * it.qty), 0);
  const discountAmount = form.discountPercent > 0 ? Math.round(subtotal * form.discountPercent / 100 * 100) / 100 : 0;
  const afterDiscount = subtotal - discountAmount;
  const tps = Math.round(afterDiscount * TPS_RATE * 100) / 100;
  const tvq = Math.round(afterDiscount * TVQ_RATE * 100) / 100;
  const total = afterDiscount + tps + tvq;

  const handleSave = async () => {
    if (!form.customerName || form.items.length === 0) return;
    setSaving(true);
    try {
      // Upload PDF si present
      let pdfUrl = null;
      let pdfFileId = null;
      if (pdfFile) {
        try {
          const uploadRes = await uploadInvoicePDF(pdfFile);
          pdfUrl = uploadRes.data?.pdfUrl || null;
          pdfFileId = uploadRes.data?.pdfFileId || null;
        } catch (uploadErr) {
          console.error('Erreur upload PDF:', uploadErr);
          // Continuer sans le PDF
        }
      }

      const payload = {
        invoiceNumber: form.invoiceNumber,
        date: form.date,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        customerAddress: form.customerAddress,
        items: form.items,
        subtotal,
        discountPercent: form.discountPercent || null,
        discountAmount: discountAmount || null,
        tps,
        tvq,
        total,
        status: form.status,
        notes: form.notes,
        ...(pdfUrl && { pdfUrl }),
        ...(pdfFileId && { pdfFileId }),
      };
      await createInvoice(payload);
      setPdfFile(null);
      setShowForm(false);
      fetchInvoices();
    } catch (err) {
      console.error('Erreur creation facture:', err);
      alert('Erreur: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (inv, newStatus) => {
    try {
      const data = { status: newStatus };
      if (newStatus === 'paid') data.paidAt = new Date().toISOString();
      await updateInvoice(inv.documentId, data);
      fetchInvoices();
    } catch (err) {
      console.error('Erreur mise a jour statut:', err);
    }
  };

  const handleDelete = async (inv) => {
    if (!confirm(tx({ fr: 'Supprimer cette facture?', en: 'Delete this invoice?', es: 'Eliminar esta factura?' }))) return;
    try {
      await deleteInvoice(inv.documentId);
      fetchInvoices();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleDownloadPDF = (inv) => {
    generateManualInvoicePDF(inv);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  // Filter + search
  const filtered = invoices.filter(inv => {
    const data = inv;
    if (filterStatus !== 'all' && data.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (data.customerName || '').toLowerCase().includes(q) ||
        (data.invoiceNumber || '').toLowerCase().includes(q) ||
        (data.customerEmail || '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + (i.total || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-heading flex items-center gap-2">
          <FileText size={24} className="text-accent" />
          {tx({ fr: 'Factures', en: 'Invoices', es: 'Facturas' })}
        </h2>
        <button onClick={openNewForm} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} />
          {tx({ fr: 'Nouvelle facture', en: 'New invoice', es: 'Nueva factura' })}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 card-bg text-center">
          <p className="text-2xl font-bold text-heading">{invoices.length}</p>
          <p className="text-xs text-grey-muted">{tx({ fr: 'Total', en: 'Total', es: 'Total' })}</p>
        </div>
        <div className="rounded-xl p-4 card-bg text-center">
          <p className="text-2xl font-bold text-green-400">{totalRevenue.toFixed(0)}$</p>
          <p className="text-xs text-grey-muted">{tx({ fr: 'Payees', en: 'Paid', es: 'Pagadas' })}</p>
        </div>
        <div className="rounded-xl p-4 card-bg text-center">
          <p className="text-2xl font-bold text-blue-400">{totalPending.toFixed(0)}$</p>
          <p className="text-xs text-grey-muted">{tx({ fr: 'En attente', en: 'Pending', es: 'Pendientes' })}</p>
        </div>
        <div className="rounded-xl p-4 card-bg text-center">
          <p className="text-2xl font-bold text-accent">{invoices.filter(i => i.status === 'draft').length}</p>
          <p className="text-xs text-grey-muted">{tx({ fr: 'Brouillons', en: 'Drafts', es: 'Borradores' })}</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tx({ fr: 'Chercher par nom, email ou numero...', en: 'Search by name, email or number...', es: 'Buscar por nombre, email o numero...' })}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-glass text-heading text-sm placeholder:text-grey-muted/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'sent', 'paid', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === s ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
              }`}
            >
              {s === 'all' ? tx({ fr: 'Tout', en: 'All', es: 'Todo' }) : STATUS_LABELS[s]?.[lang] || s}
            </button>
          ))}
        </div>
      </div>

      {/* New Invoice Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-6 card-bg overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-heading font-semibold flex items-center gap-2">
                <Plus size={18} className="text-accent" />
                {tx({ fr: 'Nouvelle facture', en: 'New invoice', es: 'Nueva factura' })}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-grey-muted hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">{tx({ fr: 'Numero', en: 'Number', es: 'Numero' })}</label>
                <input value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">{tx({ fr: 'Nom client', en: 'Client name', es: 'Nombre cliente' })}</label>
                <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none" placeholder="Pauline Gerber" />
              </div>
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">Email</label>
                <input value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">{tx({ fr: 'Telephone', en: 'Phone', es: 'Telefono' })}</label>
                <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">{tx({ fr: 'Adresse', en: 'Address', es: 'Direccion' })}</label>
                <input value={form.customerAddress} onChange={e => setForm(f => ({ ...f, customerAddress: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none" />
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <label className="text-xs text-grey-muted uppercase tracking-wider mb-2 block">{tx({ fr: 'Articles', en: 'Items', es: 'Articulos' })}</label>
              {form.items.map((item, i) => (
                <div key={i} className="flex flex-wrap gap-2 mb-3 items-start p-3 rounded-lg bg-black/10">
                  <div className="flex-1 min-w-[200px]">
                    {i === 0 && <label className="text-[9px] text-grey-muted uppercase tracking-wider mb-0.5 block">Description</label>}
                    <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder={tx({ fr: 'Ex: Developpement site web, Design graphique, Impression A3...', en: 'Ex: Web development, Graphic design, A3 print...', es: 'Descripcion' })} className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none" />
                  </div>
                  <div className="w-36">
                    {i === 0 && <label className="text-[9px] text-grey-muted uppercase tracking-wider mb-0.5 block">{tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })}</label>}
                    <select value={item.category || ''} onChange={e => updateItem(i, 'category', e.target.value)} className="w-full px-2 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none">
                      <option value="">{tx({ fr: '-- Type --', en: '-- Type --', es: '-- Tipo --' })}</option>
                      <option value="web">Web</option>
                      <option value="design">Design</option>
                      <option value="print">Print</option>
                      <option value="sticker">Sticker</option>
                      <option value="merch">Merch</option>
                      <option value="photo">Photo</option>
                      <option value="video">Video</option>
                      <option value="consulting">{tx({ fr: 'Consulting', en: 'Consulting', es: 'Consultoria' })}</option>
                      <option value="hosting">{tx({ fr: 'Hebergement', en: 'Hosting', es: 'Hosting' })}</option>
                      <option value="other">{tx({ fr: 'Autre', en: 'Other', es: 'Otro' })}</option>
                    </select>
                  </div>
                  <div className="w-24">
                    {i === 0 && <label className="text-[9px] text-grey-muted uppercase tracking-wider mb-0.5 block">Prix $</label>}
                    <input type="number" value={item.prix || ''} onChange={e => updateItem(i, 'prix', e.target.value)} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none text-right" />
                  </div>
                  <div className="w-16">
                    {i === 0 && <label className="text-[9px] text-grey-muted uppercase tracking-wider mb-0.5 block">Qty</label>}
                    <input type="number" value={item.qty || ''} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="1" min="1" className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none text-center" />
                  </div>
                  <div className="w-20 text-right pt-5">
                    <span className="text-heading font-semibold text-sm">{((item.prix || 0) * (item.qty || 1)).toFixed(2)}$</span>
                  </div>
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300 p-1 pt-5"><X size={14} /></button>
                  )}
                </div>
              ))}
              <button onClick={addItem} className="text-accent text-xs hover:underline flex items-center gap-1 mt-1">
                <Plus size={12} /> {tx({ fr: 'Ajouter un article', en: 'Add item', es: 'Agregar articulo' })}
              </button>
            </div>

            {/* Discount + Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">{tx({ fr: 'Rabais (%)', en: 'Discount (%)', es: 'Descuento (%)' })}</label>
                <input type="number" value={form.discountPercent || ''} onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none" />
              </div>
            </div>

            {/* Totals preview */}
            <div className="bg-glass rounded-lg p-4 mb-4 space-y-1 text-sm">
              <div className="flex justify-between text-grey-muted">
                <span>{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</span>
                <span className="text-heading">{subtotal.toFixed(2)} $</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>{tx({ fr: 'Rabais', en: 'Discount', es: 'Descuento' })} ({form.discountPercent}%)</span>
                  <span>-{discountAmount.toFixed(2)} $</span>
                </div>
              )}
              <div className="flex justify-between text-grey-muted">
                <span>TPS (5%)</span>
                <span className="text-heading">{tps.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-grey-muted">
                <span>TVQ (9,975%)</span>
                <span className="text-heading">{tvq.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between font-bold text-accent pt-2 border-t border-white/10">
                <span>TOTAL</span>
                <span>{total.toFixed(2)} $</span>
              </div>
            </div>

            {/* PDF upload */}
            <div className="mb-4">
              <label className="block text-grey-muted text-xs mb-1.5">{tx({ fr: 'Joindre un PDF', en: 'Attach PDF', es: 'Adjuntar PDF' })}</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-glass text-sm text-grey-muted hover:text-heading cursor-pointer transition-colors border border-dashed border-white/10 hover:border-accent/30">
                  <FileText size={16} />
                  {pdfFile ? pdfFile.name : tx({ fr: 'Choisir un fichier PDF...', en: 'Choose a PDF file...', es: 'Elegir un archivo PDF...' })}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => setPdfFile(e.target.files?.[0] || null)}
                  />
                </label>
                {pdfFile && (
                  <button onClick={() => setPdfFile(null)} className="text-red-400/60 hover:text-red-400 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.customerName} className="btn-primary text-sm flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-outline text-sm">
                {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-grey-muted">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>{tx({ fr: 'Aucune facture', en: 'No invoices', es: 'Sin facturas' })}</p>
          </div>
        ) : filtered.map(inv => {
          const isExpanded = expandedId === inv.documentId;
          const st = STATUS_LABELS[inv.status] || STATUS_LABELS.draft;
          return (
            <div key={inv.documentId} className="rounded-xl card-bg overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : inv.documentId)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="text-accent flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-heading font-semibold text-sm truncate">{inv.invoiceNumber}</p>
                    <p className="text-grey-muted text-xs">{inv.customerName} - {formatDate(inv.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.color}`}>
                    {st[lang] || st.fr}
                  </span>
                  <span className="text-heading font-bold text-sm">{Number(inv.total || 0).toFixed(2)} $</span>
                  {isExpanded ? <ChevronUp size={16} className="text-grey-muted" /> : <ChevronDown size={16} className="text-grey-muted" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                      {/* Client info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div><span className="text-grey-muted">Email:</span> <span className="text-heading">{inv.customerEmail || '-'}</span></div>
                        <div><span className="text-grey-muted">Tel:</span> <span className="text-heading">{inv.customerPhone || '-'}</span></div>
                        <div className="col-span-2"><span className="text-grey-muted">{tx({ fr: 'Adresse:', en: 'Address:', es: 'Direccion:' })}</span> <span className="text-heading">{inv.customerAddress || '-'}</span></div>
                      </div>

                      {/* Items */}
                      <div className="bg-glass rounded-lg p-3">
                        <p className="text-xs text-grey-muted uppercase tracking-wider mb-2">{tx({ fr: 'Articles', en: 'Items', es: 'Articulos' })}</p>
                        {(inv.items || []).map((it, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span className="text-heading">{it.description} {it.category && `[${it.category}]`}</span>
                            <span className="text-heading font-medium">{(it.prix * (it.qty || 1)).toFixed(2)} $</span>
                          </div>
                        ))}
                        <div className="border-t border-white/10 mt-2 pt-2 space-y-1 text-xs">
                          <div className="flex justify-between"><span className="text-grey-muted">Sous-total</span><span className="text-heading">{Number(inv.subtotal || 0).toFixed(2)} $</span></div>
                          {inv.discountPercent > 0 && (
                            <div className="flex justify-between text-green-400"><span>Rabais ({inv.discountPercent}%)</span><span>-{Number(inv.discountAmount || 0).toFixed(2)} $</span></div>
                          )}
                          <div className="flex justify-between"><span className="text-grey-muted">TPS</span><span className="text-heading">{Number(inv.tps || 0).toFixed(2)} $</span></div>
                          <div className="flex justify-between"><span className="text-grey-muted">TVQ</span><span className="text-heading">{Number(inv.tvq || 0).toFixed(2)} $</span></div>
                          <div className="flex justify-between font-bold text-accent"><span>TOTAL</span><span>{Number(inv.total || 0).toFixed(2)} $</span></div>
                        </div>
                      </div>

                      {inv.notes && <p className="text-xs text-grey-muted italic">{inv.notes}</p>}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {inv.pdfUrl ? (
                          <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5">
                            <Eye size={13} /> {tx({ fr: 'Voir PDF', en: 'View PDF', es: 'Ver PDF' })}
                          </a>
                        ) : (
                          <button onClick={() => handleDownloadPDF(inv)} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5">
                            <Download size={13} /> PDF
                          </button>
                        )}
                        {inv.status === 'draft' && (
                          <button onClick={() => handleStatusChange(inv, 'sent')} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 text-blue-400">
                            <Send size={13} /> {tx({ fr: 'Marquer envoyee', en: 'Mark sent', es: 'Marcar enviada' })}
                          </button>
                        )}
                        {(inv.status === 'draft' || inv.status === 'sent') && (
                          <button onClick={() => handleStatusChange(inv, 'paid')} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 text-green-400">
                            <CheckCircle size={13} /> {tx({ fr: 'Marquer payee', en: 'Mark paid', es: 'Marcar pagada' })}
                          </button>
                        )}
                        <button onClick={() => handleDelete(inv)} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 text-red-400">
                          <Trash2 size={13} /> {tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Wrapper avec onglets Sortantes / Entrantes
function AdminFactures() {
  const { tx } = useLang();
  const [tab, setTab] = useState('sortantes');

  return (
    <div>
      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        <Tooltip text={tx({ fr: 'Factures envoyees a vos clients - vous recevez de l\'argent', en: 'Invoices sent to clients - you receive money', es: 'Facturas enviadas a clientes - recibes dinero' })} position="bottom">
          <button
            onClick={() => setTab('sortantes')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'sortantes' ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
            }`}
          >
            <ArrowUpRight size={16} />
            {tx({ fr: 'Sortantes', en: 'Outgoing', es: 'Salientes' })}
          </button>
        </Tooltip>
        <Tooltip text={tx({ fr: 'Factures de vos achats et depenses - l\'argent sort', en: 'Purchase invoices and expenses - money goes out', es: 'Facturas de compras y gastos - el dinero sale' })} position="bottom">
          <button
            onClick={() => setTab('entrantes')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'entrantes' ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
            }`}
          >
            <ArrowDownLeft size={16} />
            {tx({ fr: 'Entrantes', en: 'Incoming', es: 'Entrantes' })}
          </button>
        </Tooltip>
      </div>

      {/* Contenu */}
      {tab === 'sortantes' && <FacturesSortantes />}
      {tab === 'entrantes' && (
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="animate-spin text-accent" size={32} /></div>}>
          <AdminDepenses />
        </Suspense>
      )}
    </div>
  );
}

export default AdminFactures;
