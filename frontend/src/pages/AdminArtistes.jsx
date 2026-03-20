import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, ChevronUp, Palette, Mail, Eye,
  CheckCircle, XCircle, Archive, Loader2, Save, ExternalLink,
  Image, FileText, MapPin, Phone, ChevronLeft, ChevronRight,
  Clock, UserCheck,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getArtistSubmissions, updateArtistStatus } from '../services/adminService';

const ARTIST_STATUS = {
  new:       { fr: 'Nouvelle',    en: 'New',       es: 'Nueva',      color: 'bg-blue-500/20 text-blue-400', icon: Mail },
  reviewing: { fr: 'En révision', en: 'Reviewing', es: 'En revision', color: 'bg-yellow-500/20 text-yellow-400', icon: Eye },
  accepted:  { fr: 'Accepté',     en: 'Accepted',  es: 'Aceptado',   color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  rejected:  { fr: 'Refusé',      en: 'Rejected',  es: 'Rechazado',  color: 'bg-red-500/20 text-red-400', icon: XCircle },
  archived:  { fr: 'Archivé',     en: 'Archived',  es: 'Archivado',  color: 'bg-gray-500/20 text-gray-400', icon: Archive },
};

const STATUS_FLOW = {
  new: ['reviewing', 'rejected', 'archived'],
  reviewing: ['accepted', 'rejected', 'archived'],
  accepted: ['archived'],
  rejected: ['reviewing', 'archived'],
  archived: [],
};

function AdminArtistes() {
  const { tx } = useLang();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 25, total: 0, pageCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [editNotes, setEditNotes] = useState({});
  const [savingNotes, setSavingNotes] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: meta.page, pageSize: meta.pageSize };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchDebounce) params.search = searchDebounce;
      const { data } = await getArtistSubmissions(params);
      setItems(data.data);
      setMeta(data.meta);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [meta.page, filterStatus, searchDebounce]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleStatusChange = async (documentId, newStatus) => {
    setUpdatingId(documentId);
    try {
      await updateArtistStatus(documentId, newStatus);
      setItems(prev => prev.map(i => i.documentId === documentId ? { ...i, status: newStatus } : i));
    } catch { /* silent */ } finally { setUpdatingId(null); }
  };

  const handleSaveNotes = async (documentId) => {
    setSavingNotes(documentId);
    try {
      await updateArtistStatus(documentId, null, editNotes[documentId] || '');
      setItems(prev => prev.map(i => i.documentId === documentId ? { ...i, notes: editNotes[documentId] || '' } : i));
    } catch { /* silent */ } finally { setSavingNotes(null); }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const item = items.find(i => i.documentId === id);
    if (item && editNotes[id] === undefined) setEditNotes(prev => ({ ...prev, [id]: item.notes || '' }));
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const summaryCards = [
    { label: tx({ fr: 'Total soumissions', en: 'Total submissions', es: 'Total solicitudes' }), value: meta.total || 0, icon: Palette, accent: 'text-accent' },
    { label: tx({ fr: 'Nouvelles', en: 'New', es: 'Nuevas' }), value: items.filter(i => i.status === 'new').length, icon: Clock, accent: 'text-blue-400' },
    { label: tx({ fr: 'En révision', en: 'Reviewing', es: 'En revision' }), value: items.filter(i => i.status === 'reviewing').length, icon: Eye, accent: 'text-yellow-400' },
    { label: tx({ fr: 'Acceptées', en: 'Accepted', es: 'Aceptadas' }), value: items.filter(i => i.status === 'accepted').length, icon: UserCheck, accent: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 card-bg shadow-lg shadow-black/20">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={card.accent} />
                <span className="text-grey-muted text-xs">{card.label}</span>
              </div>
              <span className="text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setMeta(prev => ({ ...prev, page: 1 })); }}
            placeholder={tx({ fr: 'Rechercher par nom, email...', en: 'Search by name, email...', es: 'Buscar por nombre, email...' })}
            className="input-field pl-9 text-sm" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...Object.keys(ARTIST_STATUS)].map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setMeta(prev => ({ ...prev, page: 1 })); setExpandedId(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === s ? 'text-accent' : 'text-grey-muted hover:text-accent'}`}>
              {s === 'all' ? tx({ fr: 'Tout', en: 'All', es: 'Todo' }) : tx({ fr: ARTIST_STATUS[s].fr, en: ARTIST_STATUS[s].en, es: ARTIST_STATUS[s].es })}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-accent" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-grey-muted">{tx({ fr: 'Aucune soumission', en: 'No submissions', es: 'Sin solicitudes' })}</div>
      ) : (
        <div className="rounded-xl card-bg shadow-lg shadow-black/20 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_80px_80px_110px_40px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider shadow-[0_1px_0_rgba(255,255,255,0.04)]">
            <span>Date</span>
            <span>{tx({ fr: 'Nom legal', en: 'Legal name', es: 'Nombre legal' })}</span>
            <span>Email</span>
            <span>{tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' })}</span>
            <span>Portfolio</span>
            <span>Status</span>
            <span></span>
          </div>

          <AnimatePresence>
            {items.map((item) => {
              const st = ARTIST_STATUS[item.status] || ARTIST_STATUS.new;
              const StIcon = st.icon;
              const isExpanded = expandedId === item.documentId;
              const nextStatuses = STATUS_FLOW[item.status] || [];
              const portfolio = Array.isArray(item.portfolioUrls) ? item.portfolioUrls : [];

              return (
                <motion.div key={item.documentId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="">
                  <div onClick={() => toggleExpand(item.documentId)}
                    className={`grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_80px_80px_110px_40px] gap-2 md:gap-3 px-4 py-3 items-center cursor-pointer hover:bg-accent/5 transition-colors ${item.status === 'new' ? 'bg-blue-500/5' : ''}`}>
                    <span className="text-xs text-grey-muted">{formatDate(item.createdAt)}</span>
                    <span className="text-sm text-heading font-medium truncate">{item.nomLegal}</span>
                    <span className="text-xs text-grey-muted truncate">{item.email}</span>
                    <span className="text-xs text-grey-muted truncate">{item.nomArtiste || '-'}</span>
                    <span className="text-xs text-heading">{portfolio.length} {tx({ fr: 'oeuvre(s)', en: 'work(s)', es: 'obra(s)' })}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold w-fit ${st.color}`}>
                      <StIcon size={12} />
                      {tx({ fr: st.fr, en: st.en, es: st.es })}
                    </span>
                    <span className="text-grey-muted justify-self-end">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-5 pt-1 space-y-4 shadow-[0_-1px_0_rgba(255,255,255,0.04)] bg-glass/50">

                          {/* Status actions */}
                          {nextStatuses.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-grey-muted mr-1">{tx({ fr: 'Changer le status:', en: 'Change status:', es: 'Cambiar estado:' })}</span>
                              {nextStatuses.map((ns) => {
                                const nst = ARTIST_STATUS[ns];
                                const NsIcon = nst.icon;
                                return (
                                  <button key={ns} onClick={(e) => { e.stopPropagation(); handleStatusChange(item.documentId, ns); }}
                                    disabled={updatingId === item.documentId}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${nst.color} hover:scale-105 disabled:opacity-50`}>
                                    {updatingId === item.documentId ? <Loader2 size={12} className="animate-spin" /> : <NsIcon size={12} />}
                                    {tx({ fr: nst.fr, en: nst.en, es: nst.es })}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Profile + Info */}
                          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
                            {/* Photo profil */}
                            {item.photoProfilUrl && (
                              <a href={item.photoProfilUrl} target="_blank" rel="noopener noreferrer" className="block group">
                                <img src={item.photoProfilUrl} alt={item.nomLegal}
                                  className="w-28 h-28 rounded-xl object-cover border-2 border-transparent group-hover:border-accent transition-colors" />
                              </a>
                            )}
                            <div className="space-y-2">
                              <h4 className="text-lg font-heading font-bold text-heading">
                                {item.nomLegal}
                                {item.nomArtiste && <span className="text-accent ml-2 text-sm font-normal">({item.nomArtiste})</span>}
                              </h4>
                              <div className="flex flex-wrap gap-3 text-sm">
                                <div className="flex items-center gap-1.5"><Mail size={14} className="text-accent" /><span className="text-heading">{item.email}</span></div>
                                <div className="flex items-center gap-1.5"><Phone size={14} className="text-accent" /><span className="text-heading">{item.telephone}</span></div>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                <MapPin size={14} className="text-accent flex-shrink-0" />
                                <span className="text-grey-muted">{item.adresse}</span>
                              </div>
                              {item.tpsTvq && <p className="text-xs text-grey-muted">TPS/TVQ: {item.tpsTvq}</p>}
                            </div>
                          </div>

                          {/* Bio */}
                          <div className="rounded-lg bg-glass p-4">
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">{tx({ fr: 'Bio / Demarche', en: 'Bio / Statement', es: 'Bio / Propuesta' })}</h4>
                            <p className="text-sm text-heading whitespace-pre-wrap">{item.bio}</p>
                          </div>

                          {/* Portfolio */}
                          {portfolio.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Image size={12} className="text-accent" />
                                Portfolio ({portfolio.length} {tx({ fr: 'oeuvres', en: 'works', es: 'obras' })})
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                                {portfolio.map((file, fi) => {
                                  const isImg = file.mime && file.mime.startsWith('image/');
                                  return (
                                    <a key={fi} href={file.url} target="_blank" rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()} className="block group relative aspect-square" title={file.name}>
                                      {isImg ? (
                                        <img src={file.url} alt={file.name} className="w-full h-full rounded-lg object-cover border-2 border-transparent group-hover:border-accent transition-colors" />
                                      ) : (
                                        <div className="w-full h-full rounded-lg bg-glass flex flex-col items-center justify-center gap-1 border-2 border-transparent group-hover:border-accent transition-colors">
                                          <FileText size={24} className="text-accent" />
                                          <span className="text-[8px] text-grey-muted truncate max-w-[90%] px-1">{file.name}</span>
                                        </div>
                                      )}
                                      <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <ExternalLink size={16} className="text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Contract info */}
                          <div className="flex items-center gap-3 text-xs text-grey-muted">
                            <CheckCircle size={14} className="text-green-400" />
                            <span>{tx({ fr: 'Contrat accepté', en: 'Contract accepted', es: 'Contrato aceptado' })} (v{item.contractVersion || '1'})</span>
                          </div>

                          {/* Notes */}
                          <div>
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">{tx({ fr: 'Notes internes', en: 'Internal notes', es: 'Notas internas' })}</h4>
                            <div className="flex gap-2">
                              <textarea value={editNotes[item.documentId] ?? item.notes ?? ''} onChange={(e) => setEditNotes(prev => ({ ...prev, [item.documentId]: e.target.value }))}
                                onClick={(e) => e.stopPropagation()} rows={2}
                                placeholder={tx({ fr: 'Ajouter une note...', en: 'Add a note...', es: 'Agregar una nota...' })}
                                className="input-field text-sm flex-1 resize-none" />
                              <button onClick={(e) => { e.stopPropagation(); handleSaveNotes(item.documentId); }}
                                disabled={savingNotes === item.documentId}
                                className="self-end px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center gap-1">
                                {savingNotes === item.documentId ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                {tx({ fr: 'Sauver', en: 'Save', es: 'Guardar' })}
                              </button>
                            </div>
                          </div>
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

export default AdminArtistes;
