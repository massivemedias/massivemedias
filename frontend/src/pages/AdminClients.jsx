import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, DollarSign, ShoppingBag, Calendar,
  Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Mail, Phone, Building2, MapPin,
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
  const [expandedId, setExpandedId] = useState(null);

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
    { value: 'lastOrderDate:desc', fr: 'Dernière commande', en: 'Last order', es: 'Ultimo pedido' },
    { value: 'totalSpent:desc', fr: 'Plus gros client', en: 'Highest spender', es: 'Mayor gasto' },
    { value: 'orderCount:desc', fr: 'Plus de commandes', en: 'Most orders', es: 'Mas pedidos' },
    { value: 'createdAt:desc', fr: 'Plus récent', en: 'Newest', es: 'Mas reciente' },
  ];

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 card-bg shadow-lg shadow-black/20">
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
        <div className="rounded-xl card-bg shadow-lg shadow-black/20 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_1fr_120px_80px_100px_40px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b border-white/5">
            <span>{tx({ fr: 'Client', en: 'Client', es: 'Cliente' })}</span>
            <span>{tx({ fr: 'Contact', en: 'Contact', es: 'Contacto' })}</span>
            <span>{tx({ fr: 'Dépensé', en: 'Spent', es: 'Gastado' })}</span>
            <span>{tx({ fr: 'Cmd', en: 'Orders', es: 'Ped' })}</span>
            <span>{tx({ fr: 'Dernière cmd', en: 'Last order', es: 'Ultimo ped' })}</span>
            <span></span>
          </div>

          <AnimatePresence>
            {items.map((client) => {
              const isExpanded = expandedId === client.documentId;
              const addr = client.lastShippingAddress;
              const phone = client.lastCustomerPhone || client.phone;

              return (
                <motion.div
                  key={client.documentId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b last:border-b-0 border-white/5"
                >
                  <div
                    onClick={() => toggleExpand(client.documentId)}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_80px_100px_40px] gap-2 md:gap-3 px-4 py-3 items-center cursor-pointer hover:bg-accent/5 transition-colors"
                  >
                    {/* Nom + entreprise */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        {(client.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-heading font-semibold truncate">{client.name}</p>
                        {client.company && (
                          <p className="text-xs text-grey-muted truncate flex items-center gap-1">
                            <Building2 size={10} className="flex-shrink-0" />
                            {client.company}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs text-grey-muted truncate flex items-center gap-1.5">
                        <Mail size={11} className="flex-shrink-0" />
                        {client.email}
                      </p>
                      {phone && (
                        <p className="text-xs text-grey-muted truncate flex items-center gap-1.5">
                          <Phone size={11} className="flex-shrink-0" />
                          {phone}
                        </p>
                      )}
                    </div>

                    {/* Depense totale */}
                    <span className="text-sm text-heading font-bold">{formatMoney(client.totalSpent)}</span>

                    {/* Nb commandes */}
                    <span className="text-sm text-heading font-semibold">{client.orderCount || 0}</span>

                    {/* Derniere commande */}
                    <span className="text-xs text-grey-muted">{formatDate(client.lastOrderDate)}</span>

                    {/* Expand arrow */}
                    <span className="text-grey-muted justify-self-end">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-glass/50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            {/* Coordonnees */}
                            <div className="rounded-lg bg-glass p-3">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">
                                {tx({ fr: 'Coordonnees', en: 'Contact info', es: 'Datos de contacto' })}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p className="text-heading font-medium">{client.name}</p>
                                <p className="text-grey-muted flex items-center gap-2"><Mail size={13} /> {client.email}</p>
                                {phone && <p className="text-grey-muted flex items-center gap-2"><Phone size={13} /> {phone}</p>}
                                {client.company && <p className="text-grey-muted flex items-center gap-2"><Building2 size={13} /> {client.company}</p>}
                              </div>
                            </div>

                            {/* Adresse */}
                            <div className="rounded-lg bg-glass p-3">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MapPin size={12} />
                                {tx({ fr: 'Dernière adresse', en: 'Last address', es: 'Ultima direccion' })}
                              </h4>
                              {addr ? (
                                <div className="text-sm text-heading space-y-0.5">
                                  <p>{addr.address}</p>
                                  <p>{addr.city}, {addr.province} {addr.postalCode}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-grey-muted">{tx({ fr: 'Aucune adresse enregistree', en: 'No address on file', es: 'Sin direccion registrada' })}</p>
                              )}
                            </div>

                            {/* Resume financier */}
                            <div className="rounded-lg bg-glass p-3">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">
                                {tx({ fr: 'Resume', en: 'Summary', es: 'Resumen' })}
                              </h4>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-grey-muted">{tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' })}</span>
                                  <span className="text-heading font-semibold">{client.orderCount || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-grey-muted">{tx({ fr: 'Total dépensé', en: 'Total spent', es: 'Total gastado' })}</span>
                                  <span className="text-heading font-bold">{formatMoney(client.totalSpent)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-grey-muted">{tx({ fr: 'Dernière commande', en: 'Last order', es: 'Ultimo pedido' })}</span>
                                  <span className="text-heading">{formatDate(client.lastOrderDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-grey-muted">{tx({ fr: 'Membre depuis', en: 'Member since', es: 'Miembro desde' })}</span>
                                  <span className="text-heading">{formatDate(client.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          {(client.notesFr || client.notesEn) && (
                            <div className="mt-3 rounded-lg bg-glass p-3">
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-1">Notes</h4>
                              <p className="text-sm text-heading">{client.notesFr || client.notesEn}</p>
                            </div>
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
