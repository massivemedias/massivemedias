import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Users, DollarSign, ShoppingBag, Calendar,
  Loader2, ChevronLeft, ChevronRight, Mail, Phone, Building2,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getClients } from '../services/adminService';

function AdminClients() {
  const { tx } = useLang();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 25, total: 0, pageCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [sort, setSort] = useState('lastOrderDate:desc');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: meta.page, pageSize: meta.pageSize, sort };
      if (searchDebounce) params.search = searchDebounce;
      const { data } = await getClients(params);
      setItems(data.data);
      setMeta(data.meta);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [meta.page, searchDebounce, sort]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatMoney = (v) => `${(parseFloat(v) || 0).toFixed(2)}$`;

  const totalSpentAll = items.reduce((s, c) => s + (parseFloat(c.totalSpent) || 0), 0);
  const totalOrders = items.reduce((s, c) => s + (c.orderCount || 0), 0);

  const summaryCards = [
    { label: tx({ fr: 'Total clients', en: 'Total clients', es: 'Total clientes' }), value: meta.total || 0, icon: Users, accent: 'text-accent' },
    { label: tx({ fr: 'Depenses totales', en: 'Total spent', es: 'Total gastado' }), value: `${totalSpentAll.toFixed(0)}$`, icon: DollarSign, accent: 'text-green-400' },
    { label: tx({ fr: 'Total commandes', en: 'Total orders', es: 'Total pedidos' }), value: totalOrders, icon: ShoppingBag, accent: 'text-blue-400' },
    { label: tx({ fr: 'Moyenne/client', en: 'Avg/client', es: 'Prom/cliente' }), value: items.length > 0 ? `${(totalSpentAll / items.length).toFixed(0)}$` : '0$', icon: Calendar, accent: 'text-purple-400' },
  ];

  const sortOptions = [
    { value: 'lastOrderDate:desc', fr: 'Derniere commande', en: 'Last order', es: 'Ultimo pedido' },
    { value: 'totalSpent:desc', fr: 'Plus gros client', en: 'Highest spender', es: 'Mayor gasto' },
    { value: 'orderCount:desc', fr: 'Plus de commandes', en: 'Most orders', es: 'Mas pedidos' },
    { value: 'createdAt:desc', fr: 'Plus recent', en: 'Newest', es: 'Mas reciente' },
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

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setMeta(prev => ({ ...prev, page: 1 })); }}
            placeholder={tx({ fr: 'Rechercher par nom, email, entreprise...', en: 'Search by name, email, company...', es: 'Buscar por nombre, email, empresa...' })}
            className="input-field pl-9 text-sm" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field text-sm w-auto">
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{tx({ fr: o.fr, en: o.en, es: o.es })}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-accent" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-grey-muted">{tx({ fr: 'Aucun client', en: 'No clients', es: 'Sin clientes' })}</div>
      ) : (
        <div className="rounded-xl bg-glass overflow-hidden card-border">
          <div className="hidden md:grid grid-cols-[1fr_1fr_100px_80px_100px_100px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b card-border">
            <span>Nom</span>
            <span>Email</span>
            <span>{tx({ fr: 'Entreprise', en: 'Company', es: 'Empresa' })}</span>
            <span>{tx({ fr: 'Cmd', en: 'Orders', es: 'Ped' })}</span>
            <span>{tx({ fr: 'Total', en: 'Total', es: 'Total' })}</span>
            <span>{tx({ fr: 'Derniere cmd', en: 'Last order', es: 'Ultimo ped' })}</span>
          </div>

          {items.map((client) => (
            <div key={client.documentId} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_80px_100px_100px] gap-2 md:gap-3 px-4 py-3 items-center border-b last:border-b-0 card-border hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                  {(client.name || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm text-heading font-medium truncate">{client.name}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail size={12} className="text-grey-muted flex-shrink-0" />
                <span className="text-xs text-grey-muted truncate">{client.email}</span>
              </div>
              <span className="text-xs text-grey-muted truncate">{client.company || '-'}</span>
              <span className="text-sm text-heading font-semibold">{client.orderCount || 0}</span>
              <span className="text-sm text-heading font-semibold">{formatMoney(client.totalSpent)}</span>
              <span className="text-xs text-grey-muted">{formatDate(client.lastOrderDate)}</span>
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

export default AdminClients;
