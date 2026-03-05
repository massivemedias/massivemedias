import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, XCircle, CheckCircle, Search,
  Edit3, X, Save, Loader2, BarChart3, DollarSign, Archive,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

const STATUS_CONFIG = {
  ok: { label: 'OK', icon: CheckCircle, color: 'bg-green-500/20 text-green-400' },
  low: { label: 'Alerte', icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-400' },
  out: { label: 'Rupture', icon: XCircle, color: 'bg-red-500/20 text-red-400' },
};

const CATEGORY_LABELS = {
  textile: 'Textile',
  frame: 'Cadre',
  accessory: 'Accessoire',
  sticker: 'Sticker',
  print: 'Print',
  merch: 'Merch',
  other: 'Autre',
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
  const [editData, setEditData] = useState({ quantity: 0, reserved: 0 });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/inventory-items/dashboard');
      setItems(data.data || []);
      setSummary(data.summary || null);
      setError('');
    } catch (err) {
      setError('Impossible de charger l\'inventaire');
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
    setEditData({ quantity: item.quantity || 0, reserved: item.reserved || 0 });
  };

  const getName = (item) => lang === 'en' ? (item.nameEn || item.nameFr) : item.nameFr;

  const filtered = items.filter((item) => {
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
    <>
      <SEO
        title={tx({ fr: 'Inventaire | Massive', en: 'Inventory | Massive', es: 'Inventario | Massive' })}
        description=""
        noindex
      />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-2">
            <Package size={28} className="inline text-accent mr-3" />
            {tx({ fr: 'Inventaire', en: 'Inventory', es: 'Inventario' })}
          </h1>
          <p className="text-grey-muted mb-8">
            {tx({ fr: 'Gestion du stock en temps reel', en: 'Real-time stock management', es: 'Gestion de stock en tiempo real' })}
          </p>

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
                    filterStatus === s ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
                  }`}
                >
                  {s === 'all' ? tx({ fr: 'Tous', en: 'All', es: 'Todos' }) : STATUS_CONFIG[s].label}
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
                    <th className="text-left p-4">SKU</th>
                    <th className="text-left p-4">{tx({ fr: 'Produit', en: 'Product', es: 'Producto' })}</th>
                    <th className="text-left p-4">{tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })}</th>
                    <th className="text-center p-4">Stock</th>
                    <th className="text-center p-4">{tx({ fr: 'Reserve', en: 'Reserved', es: 'Reservado' })}</th>
                    <th className="text-center p-4">{tx({ fr: 'Dispo', en: 'Avail.', es: 'Disp.' })}</th>
                    <th className="text-center p-4">{tx({ fr: 'Seuil', en: 'Threshold', es: 'Umbral' })}</th>
                    <th className="text-center p-4">Status</th>
                    <th className="text-center p-4">Actions</th>
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
                          <td className="p-4 font-mono text-grey-muted text-xs">{item.sku || '-'}</td>
                          <td className="p-4 text-heading font-medium">{getName(item)}</td>
                          <td className="p-4 text-grey-muted">{CATEGORY_LABELS[item.category] || item.category}</td>
                          <td className="p-4 text-center">
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
                          <td className="p-4 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editData.reserved}
                                onChange={(e) => setEditData(d => ({ ...d, reserved: Number(e.target.value) }))}
                                className="w-16 text-center rounded bg-glass text-heading p-1 text-sm"
                                min="0"
                              />
                            ) : (
                              <span className="text-grey-muted">{item.reserved || 0}</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-medium text-heading">{item.available}</td>
                          <td className="p-4 text-center text-grey-muted">{item.lowStockThreshold}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                              <StatusIcon size={12} />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="p-4 text-center">
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
      </section>
    </>
  );
}

export default AdminInventaire;
