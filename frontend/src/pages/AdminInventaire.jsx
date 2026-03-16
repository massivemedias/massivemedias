import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, XCircle, CheckCircle, Search,
  Edit3, X, Save, Loader2, DollarSign, Archive,
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

  if (loading) {
    return (
      <div className="section-container pt-32 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }


  return (
    <div>
      <p className="text-grey-muted mb-6">
        {tx({ fr: 'Gestion du stock en temps reel', en: 'Real-time stock management', es: 'Gestion de stock en tiempo real' })}
      </p>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 error-bg mb-6">
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
