import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, XCircle, CheckCircle, Search,
  Edit3, X, Save, Loader2, BarChart3, DollarSign, Archive,
  Upload, FileText, Trash2, Plus, ChevronDown, ChevronUp,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import api, { uploadFile } from '../services/api';

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

const INVENTORY_CATEGORIES = ['textile', 'frame', 'accessory', 'sticker', 'print', 'merch', 'other'];
const EXPENSE_CATEGORIES = {
  consommables: { fr: 'Consommables', en: 'Consumables', es: 'Consumibles' },
  materiel: { fr: 'Materiel', en: 'Materials', es: 'Materiales' },
  shipping: { fr: 'Expedition', en: 'Shipping', es: 'Envio' },
  software: { fr: 'Logiciel', en: 'Software', es: 'Software' },
  marketing: { fr: 'Marketing', en: 'Marketing', es: 'Marketing' },
  equipment: { fr: 'Equipement', en: 'Equipment', es: 'Equipo' },
  taxes: { fr: 'Taxes', en: 'Taxes', es: 'Impuestos' },
  other: { fr: 'Autre', en: 'Other', es: 'Otro' },
};

function AdminInventaire() {
  const { tx, lang } = useLang();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ quantity: 0 });
  const [saving, setSaving] = useState(false);

  // Invoice import state
  const [showImport, setShowImport] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const fileInputRef = useRef(null);

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
    setEditData({ quantity: item.quantity || 0 });
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
    return matchSearch && matchStatus;
  });

  // --- Invoice PDF import ---
  const handlePDFSelect = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setParseError(tx({ fr: 'Fichier PDF requis', en: 'PDF file required', es: 'Archivo PDF requerido' }));
      return;
    }
    setParsing(true);
    setParseError('');
    setInvoiceData(null);
    setImportSuccess('');
    setReceiptUrl('');

    try {
      // Upload le PDF comme recu
      setUploadingReceipt(true);
      const uploaded = await uploadFile(file);
      setReceiptUrl(uploaded.url);
      setUploadingReceipt(false);

      // Parser le PDF
      const { parseInvoicePDF } = await import('../utils/invoiceParser');
      const result = await parseInvoicePDF(file);
      setInvoiceData(result);
    } catch (err) {
      console.error('Erreur parsing PDF:', err);
      setParseError(tx({ fr: 'Erreur lors de l\'analyse du PDF. Verifiez que le fichier est valide.', en: 'Error analyzing PDF. Check that the file is valid.', es: 'Error al analizar el PDF.' }));
    } finally {
      setParsing(false);
      setUploadingReceipt(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handlePDFSelect(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const updateInvoiceItem = (index, field, value) => {
    setInvoiceData(prev => {
      const updated = { ...prev, lineItems: [...prev.lineItems] };
      updated.lineItems[index] = { ...updated.lineItems[index], [field]: value };
      return updated;
    });
  };

  const removeInvoiceItem = (index) => {
    setInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const addInvoiceItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        category: 'other',
        addToInventory: true,
      }],
    }));
  };

  const handleImport = async () => {
    if (!invoiceData) return;
    setImporting(true);
    setParseError('');

    try {
      const inventoryItems = invoiceData.lineItems
        .filter(i => i.addToInventory && i.description)
        .map(i => ({
          nameFr: i.description,
          nameEn: i.description,
          category: i.category || 'other',
          quantity: parseInt(i.quantity) || 0,
          costPrice: parseFloat(i.unitPrice) || 0,
          notes: `Facture ${invoiceData.invoiceNumber || ''} - ${invoiceData.vendor || ''} - ${invoiceData.date}`,
        }));

      const expenseData = {
        description: `Facture ${invoiceData.invoiceNumber || ''} - ${invoiceData.vendor || ''}`.trim().replace(/\s*-\s*$/, ''),
        amount: invoiceData.total || invoiceData.subtotal || 0,
        category: invoiceData.expenseCategory || 'materiel',
        date: invoiceData.date,
        vendor: invoiceData.vendor || '',
        receiptNumber: invoiceData.invoiceNumber || '',
        receiptUrl: receiptUrl || '',
        taxDeductible: true,
        tpsAmount: invoiceData.tps || 0,
        tvqAmount: invoiceData.tvq || 0,
        notes: `Import automatique - ${inventoryItems.length} item(s)`,
      };

      await api.post('/inventory-items/import-invoice', {
        items: inventoryItems,
        expense: expenseData,
      });

      const created = inventoryItems.length;
      setImportSuccess(tx({
        fr: `Import reussi! ${created} item(s) ajoute(s) a l'inventaire + 1 depense de ${expenseData.amount}$ creee.`,
        en: `Import successful! ${created} item(s) added to inventory + 1 expense of $${expenseData.amount} created.`,
        es: `Importacion exitosa! ${created} item(s) agregado(s) al inventario + 1 gasto de $${expenseData.amount} creado.`,
      }));

      setInvoiceData(null);
      fetchData();
    } catch (err) {
      console.error('Erreur import:', err);
      setParseError(tx({ fr: 'Erreur lors de l\'import. Reessayez.', en: 'Import error. Try again.', es: 'Error de importacion.' }));
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="section-container pt-32 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  const outOfStockItems = items.filter(item => item.status === 'out');
  const lowStockItems = items.filter(item => item.status === 'low');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-grey-muted">
          {tx({ fr: 'Gestion du stock en temps reel', en: 'Real-time stock management', es: 'Gestion de stock en tiempo real' })}
        </p>
        <button
          onClick={() => { setShowImport(!showImport); setInvoiceData(null); setParseError(''); setImportSuccess(''); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition-colors"
        >
          {showImport ? <X size={16} /> : <FileText size={16} />}
          {showImport ? tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' }) : tx({ fr: 'Importer facture', en: 'Import invoice', es: 'Importar factura' })}
        </button>
      </div>

      {/* Invoice import section */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="rounded-xl bg-glass card-border p-4 space-y-4">
              <h3 className="text-sm font-semibold text-heading uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} className="text-accent" />
                {tx({ fr: 'Import de facture PDF', en: 'PDF Invoice Import', es: 'Importar factura PDF' })}
              </h3>

              {/* Drop zone */}
              {!invoiceData && !parsing && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragging ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-accent/50 hover:bg-accent/5'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handlePDFSelect(e.target.files?.[0])}
                    accept=".pdf"
                    className="hidden"
                  />
                  <Upload size={32} className={`mx-auto mb-3 ${dragging ? 'text-accent' : 'text-grey-muted'}`} />
                  <p className="text-heading font-medium mb-1">
                    {tx({ fr: 'Deposer une facture PDF ici', en: 'Drop a PDF invoice here', es: 'Soltar factura PDF aqui' })}
                  </p>
                  <p className="text-grey-muted text-xs">
                    {tx({ fr: 'ou cliquer pour selectionner un fichier', en: 'or click to select a file', es: 'o hacer clic para seleccionar' })}
                  </p>
                </div>
              )}

              {/* Parsing loader */}
              {parsing && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 size={32} className="animate-spin text-accent" />
                  <p className="text-heading text-sm">
                    {uploadingReceipt
                      ? tx({ fr: 'Upload du PDF...', en: 'Uploading PDF...', es: 'Subiendo PDF...' })
                      : tx({ fr: 'Analyse de la facture en cours...', en: 'Analyzing invoice...', es: 'Analizando factura...' })
                    }
                  </p>
                </div>
              )}

              {/* Parse error */}
              {parseError && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                  <p className="text-red-400 text-sm">{parseError}</p>
                </div>
              )}

              {/* Import success */}
              {importSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border border-green-500/30 bg-green-500/10"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{importSuccess}</p>
                  </div>
                </motion.div>
              )}

              {/* Parsed data preview */}
              {invoiceData && (
                <div className="space-y-4">
                  {/* Invoice header */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'Fournisseur', en: 'Vendor', es: 'Proveedor' })}</label>
                      <input
                        type="text"
                        value={invoiceData.vendor}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, vendor: e.target.value }))}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-grey-muted uppercase tracking-wider">Date</label>
                      <input
                        type="date"
                        value={invoiceData.date}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'No. facture', en: 'Invoice #', es: 'No. factura' })}</label>
                      <input
                        type="text"
                        value={invoiceData.invoiceNumber}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'Categorie depense', en: 'Expense category', es: 'Categoria gasto' })}</label>
                      <select
                        value={invoiceData.expenseCategory}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, expenseCategory: e.target.value }))}
                        className="input-field text-sm mt-1"
                      >
                        {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                          <option key={k} value={k}>{tx(v)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Line items */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-heading uppercase tracking-wider">
                        {tx({ fr: 'Articles', en: 'Line items', es: 'Articulos' })} ({invoiceData.lineItems.length})
                      </h4>
                      <button
                        onClick={addInvoiceItem}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-accent/20 text-accent text-xs font-semibold hover:bg-accent/30 transition-colors"
                      >
                        <Plus size={12} /> {tx({ fr: 'Ajouter', en: 'Add', es: 'Agregar' })}
                      </button>
                    </div>

                    {invoiceData.lineItems.length === 0 ? (
                      <div className="text-center py-6 text-grey-muted text-sm">
                        {tx({ fr: 'Aucun article detecte. Ajoutez-en manuellement.', en: 'No items detected. Add manually.', es: 'Ningun articulo detectado. Agregue manualmente.' })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {invoiceData.lineItems.map((lineItem, i) => (
                          <div key={i} className="rounded-lg bg-glass/50 p-3 card-border">
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_90px_90px_100px_40px_40px] gap-2 items-center">
                              {/* Description */}
                              <input
                                type="text"
                                value={lineItem.description}
                                onChange={(e) => updateInvoiceItem(i, 'description', e.target.value)}
                                placeholder={tx({ fr: 'Description', en: 'Description', es: 'Descripcion' })}
                                className="input-field text-sm"
                              />
                              {/* Qty */}
                              <input
                                type="number"
                                value={lineItem.quantity}
                                onChange={(e) => updateInvoiceItem(i, 'quantity', Number(e.target.value))}
                                placeholder="Qty"
                                min="0"
                                className="input-field text-sm text-center"
                              />
                              {/* Prix unitaire */}
                              <input
                                type="number"
                                step="0.01"
                                value={lineItem.unitPrice}
                                onChange={(e) => {
                                  const price = parseFloat(e.target.value) || 0;
                                  updateInvoiceItem(i, 'unitPrice', price);
                                  updateInvoiceItem(i, 'total', price * (lineItem.quantity || 1));
                                }}
                                placeholder={tx({ fr: 'Prix unit.', en: 'Unit price', es: 'Precio unit.' })}
                                className="input-field text-sm text-right"
                              />
                              {/* Total */}
                              <div className="text-sm text-heading font-semibold text-right px-2">
                                {(lineItem.total || 0).toFixed(2)}$
                              </div>
                              {/* Categorie inventaire */}
                              <select
                                value={lineItem.category}
                                onChange={(e) => updateInvoiceItem(i, 'category', e.target.value)}
                                className="input-field text-[10px] p-1"
                              >
                                {INVENTORY_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>{CATEGORY_LABELS[c] ? tx(CATEGORY_LABELS[c]) : c}</option>
                                ))}
                              </select>
                              {/* Toggle inventaire */}
                              <button
                                onClick={() => updateInvoiceItem(i, 'addToInventory', !lineItem.addToInventory)}
                                title={lineItem.addToInventory
                                  ? tx({ fr: 'Ajouter a l\'inventaire', en: 'Add to inventory', es: 'Agregar al inventario' })
                                  : tx({ fr: 'Exclure de l\'inventaire', en: 'Exclude from inventory', es: 'Excluir del inventario' })
                                }
                                className={`p-1.5 rounded-lg transition-colors ${lineItem.addToInventory ? 'bg-green-500/20 text-green-400' : 'bg-glass text-grey-muted'}`}
                              >
                                <Package size={14} />
                              </button>
                              {/* Supprimer */}
                              <button
                                onClick={() => removeInvoiceItem(i)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Totaux */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={invoiceData.subtotal}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, subtotal: parseFloat(e.target.value) || 0 }))}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-grey-muted uppercase tracking-wider">TPS (5%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={invoiceData.tps}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, tps: parseFloat(e.target.value) || 0 }))}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-grey-muted uppercase tracking-wider">TVQ (9.975%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={invoiceData.tvq}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, tvq: parseFloat(e.target.value) || 0 }))}
                        className="input-field text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-grey-muted uppercase tracking-wider">Total</label>
                      <input
                        type="number"
                        step="0.01"
                        value={invoiceData.total}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, total: parseFloat(e.target.value) || 0 }))}
                        className="input-field text-sm mt-1 font-bold"
                      />
                    </div>
                  </div>

                  {/* Raw text toggle (debug) */}
                  <details className="text-xs">
                    <summary className="text-grey-muted cursor-pointer hover:text-heading transition-colors">
                      {tx({ fr: 'Voir le texte brut extrait', en: 'View raw extracted text', es: 'Ver texto sin formato' })}
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-black/20 text-grey-muted overflow-x-auto max-h-40 text-[10px] whitespace-pre-wrap">
                      {invoiceData.rawText}
                    </pre>
                  </details>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2 border-t card-border">
                    <button
                      onClick={() => { setInvoiceData(null); setReceiptUrl(''); }}
                      className="px-4 py-2 rounded-lg bg-glass text-grey-muted text-sm hover:text-heading transition-colors"
                    >
                      {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importing || invoiceData.lineItems.length === 0}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50 ml-auto"
                    >
                      {importing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {tx({
                        fr: `Importer ${invoiceData.lineItems.filter(i => i.addToInventory).length} item(s) + depense`,
                        en: `Import ${invoiceData.lineItems.filter(i => i.addToInventory).length} item(s) + expense`,
                        es: `Importar ${invoiceData.lineItems.filter(i => i.addToInventory).length} item(s) + gasto`,
                      })}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerte rupture de stock */}
      {outOfStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border-2 border-red-500/40 bg-red-500/10 mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={18} className="text-red-400" />
            <span className="text-red-400 font-bold text-sm">
              {tx({ fr: 'RUPTURE DE STOCK', en: 'OUT OF STOCK', es: 'AGOTADO' })} ({outOfStockItems.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {outOfStockItems.map((item) => (
              <span key={item.documentId} className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs font-medium">
                {getName(item)} {item.sku ? `(${item.sku})` : ''}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Alerte stock bas */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl border-2 border-orange-500/40 bg-orange-500/10 mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-orange-400" />
            <span className="text-orange-400 font-bold text-sm">
              {tx({ fr: 'STOCK BAS', en: 'LOW STOCK', es: 'STOCK BAJO' })} ({lowStockItems.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item.documentId} className="px-2 py-1 rounded bg-orange-500/20 text-orange-300 text-xs font-medium">
                {getName(item)} - {item.available} {tx({ fr: 'restant(s)', en: 'remaining', es: 'restante(s)' })} {item.sku ? `(${item.sku})` : ''}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 error-bg mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: tx({ fr: 'Total items', en: 'Total items', es: 'Total items' }), value: summary.total, icon: Archive, accent: false },
            { label: tx({ fr: 'Stock bas', en: 'Low stock', es: 'Stock bajo' }), value: summary.lowStock, icon: AlertTriangle, accent: summary.lowStock > 0 },
            { label: tx({ fr: 'Rupture', en: 'Out of stock', es: 'Agotado' }), value: summary.outOfStock, icon: XCircle, accent: summary.outOfStock > 0 },
            { label: tx({ fr: 'Valeur stock', en: 'Stock value', es: 'Valor stock' }), value: `$${summary.totalValue}`, icon: DollarSign, accent: false },
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
                  <Icon size={18} className={card.accent ? 'text-red-400' : 'text-accent'} />
                  <span className="text-grey-muted text-xs uppercase">{card.label}</span>
                </div>
                <div className={`text-2xl font-heading font-bold ${card.accent ? 'text-red-400' : 'text-heading'}`}>
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
        <div className="flex gap-2">
          {['all', 'ok', 'low', 'out'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s ? 'text-accent' : 'text-grey-muted hover:text-accent'
              }`}
            >
              {s === 'all' ? tx({ fr: 'Tous', en: 'All', es: 'Todos' }) : tx(STATUS_CONFIG[s].label)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-grey-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2">{tx({ fr: 'Produit', en: 'Product', es: 'Producto' })}</th>
                <th className="text-left px-4 py-2">SKU</th>
                <th className="text-left px-4 py-2">{tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })}</th>
                <th className="text-center px-4 py-2">Stock</th>
                <th className="text-center px-4 py-2">{tx({ fr: 'Dispo', en: 'Avail.', es: 'Disp.' })}</th>
                <th className="text-center px-4 py-2">{tx({ fr: 'Seuil', en: 'Threshold', es: 'Umbral' })}</th>
                <th className="text-center px-4 py-2">Status</th>
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
                      className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-2 text-heading font-medium">{getName(item)}</td>
                      <td className="px-4 py-2 font-mono text-grey-muted text-xs">{item.sku || '-'}</td>
                      <td className="px-4 py-2 text-grey-muted">{CATEGORY_LABELS[item.category] ? tx(CATEGORY_LABELS[item.category]) : item.category}</td>
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
                          <span className="text-heading font-medium">{item.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center font-medium text-heading">{item.available}</td>
                      <td className="px-4 py-2 text-center text-grey-muted">{item.lowStockThreshold}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon size={12} />
                          {tx(statusCfg.label)}
                        </span>
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
    </div>
  );
}

export default AdminInventaire;
