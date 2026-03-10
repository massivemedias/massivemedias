import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, ChevronUp, MessageSquare, Mail,
  Eye, Reply, Archive, Loader2, Phone, Building2, Save,
  ChevronLeft, ChevronRight, Clock, Send, X,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getContactSubmissions, updateContactStatus, replyToContact } from '../services/adminService';

const MSG_STATUS = {
  new:      { fr: 'Nouveau',   en: 'New',      es: 'Nuevo',     color: 'bg-blue-500/20 text-blue-400', icon: Mail },
  read:     { fr: 'Lu',        en: 'Read',     es: 'Leido',     color: 'bg-yellow-500/20 text-yellow-400', icon: Eye },
  replied:  { fr: 'Repondu',   en: 'Replied',  es: 'Respondido', color: 'bg-green-500/20 text-green-400', icon: Reply },
  archived: { fr: 'Archive',   en: 'Archived', es: 'Archivado', color: 'bg-gray-500/20 text-gray-400', icon: Archive },
};

const STATUS_FLOW = {
  new: ['read', 'replied', 'archived'],
  read: ['replied', 'archived'],
  replied: ['archived'],
  archived: [],
};

function AdminMessages() {
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
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(null);

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
      const { data } = await getContactSubmissions(params);
      setItems(data.data);
      setMeta(data.meta);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [meta.page, filterStatus, searchDebounce]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleStatusChange = async (documentId, newStatus) => {
    setUpdatingId(documentId);
    try {
      await updateContactStatus(documentId, newStatus);
      setItems(prev => prev.map(i => i.documentId === documentId ? { ...i, status: newStatus } : i));
    } catch { /* silent */ } finally { setUpdatingId(null); }
  };

  const handleSaveNotes = async (documentId) => {
    setSavingNotes(documentId);
    try {
      await updateContactStatus(documentId, null, editNotes[documentId] || '');
      setItems(prev => prev.map(i => i.documentId === documentId ? { ...i, notes: editNotes[documentId] || '' } : i));
    } catch { /* silent */ } finally { setSavingNotes(null); }
  };

  const handleReply = async (documentId) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    setReplySuccess(null);
    try {
      const { data } = await replyToContact(documentId, replyText.trim());
      setItems(prev => prev.map(i => i.documentId === documentId ? { ...i, status: 'replied', notes: data.notes } : i));
      setEditNotes(prev => ({ ...prev, [documentId]: data.notes }));
      setReplySuccess(documentId);
      setReplyText('');
      setTimeout(() => { setReplySuccess(null); setReplyingTo(null); }, 2000);
    } catch {
      setReplySuccess(false);
    } finally {
      setSendingReply(false);
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const item = items.find(i => i.documentId === id);
    if (item && editNotes[id] === undefined) setEditNotes(prev => ({ ...prev, [id]: item.notes || '' }));
    // Auto-mark as read
    if (item && item.status === 'new') handleStatusChange(id, 'read');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const newCount = items.filter(i => i.status === 'new').length;

  const summaryCards = [
    { label: tx({ fr: 'Total messages', en: 'Total messages', es: 'Total mensajes' }), value: meta.total || 0, icon: MessageSquare, accent: 'text-accent' },
    { label: tx({ fr: 'Nouveaux', en: 'New', es: 'Nuevos' }), value: newCount, icon: Mail, accent: 'text-blue-400' },
    { label: tx({ fr: 'En attente', en: 'Pending', es: 'Pendientes' }), value: items.filter(i => i.status === 'read').length, icon: Clock, accent: 'text-yellow-400' },
    { label: tx({ fr: 'Repondus', en: 'Replied', es: 'Respondidos' }), value: items.filter(i => i.status === 'replied').length, icon: Reply, accent: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 bg-glass card-border">
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
          {['all', ...Object.keys(MSG_STATUS)].map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setMeta(prev => ({ ...prev, page: 1 })); setExpandedId(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === s ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'}`}>
              {s === 'all' ? tx({ fr: 'Tout', en: 'All', es: 'Todo' }) : tx({ fr: MSG_STATUS[s].fr, en: MSG_STATUS[s].en, es: MSG_STATUS[s].es })}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-accent" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-grey-muted">{tx({ fr: 'Aucun message', en: 'No messages', es: 'Sin mensajes' })}</div>
      ) : (
        <div className="rounded-xl bg-glass overflow-hidden card-border">
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_100px_100px_40px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b card-border">
            <span>Date</span>
            <span>Nom</span>
            <span>Email</span>
            <span>Service</span>
            <span>Status</span>
            <span></span>
          </div>

          <AnimatePresence>
            {items.map((item) => {
              const st = MSG_STATUS[item.status] || MSG_STATUS.new;
              const StIcon = st.icon;
              const isExpanded = expandedId === item.documentId;
              const nextStatuses = STATUS_FLOW[item.status] || [];

              return (
                <motion.div key={item.documentId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b last:border-b-0 card-border">
                  <div onClick={() => toggleExpand(item.documentId)}
                    className={`grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_100px_100px_40px] gap-2 md:gap-3 px-4 py-3 items-center cursor-pointer hover:bg-accent/5 transition-colors ${item.status === 'new' ? 'bg-blue-500/5' : ''}`}>
                    <span className="text-xs text-grey-muted">{formatDate(item.createdAt)}</span>
                    <span className="text-sm text-heading font-medium truncate">{item.nom}</span>
                    <span className="text-xs text-grey-muted truncate">{item.email}</span>
                    <span className="text-xs text-grey-muted truncate">{item.service || '-'}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold w-fit ${st.color}`}>
                      <StIcon size={12} />
                      {tx({ fr: st.fr, en: st.en, es: st.es })}
                    </span>
                    <span className="text-grey-muted justify-self-end">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-5 pt-1 space-y-4 border-t card-border bg-glass/50">
                          {/* Status actions */}
                          {nextStatuses.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-grey-muted mr-1">{tx({ fr: 'Marquer comme:', en: 'Mark as:', es: 'Marcar como:' })}</span>
                              {nextStatuses.map((ns) => {
                                const nst = MSG_STATUS[ns];
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

                          {/* Message */}
                          <div className="rounded-lg bg-glass p-4">
                            <p className="text-sm text-heading whitespace-pre-wrap">{item.message}</p>
                          </div>

                          {/* Reply section */}
                          {replyingTo === item.documentId ? (
                            <div className="rounded-lg bg-accent/5 border card-border p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                                  <Reply size={12} />
                                  {tx({ fr: `Repondre a ${item.nom}`, en: `Reply to ${item.nom}`, es: `Responder a ${item.nom}` })}
                                </h4>
                                <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="text-grey-muted hover:text-heading">
                                  <X size={14} />
                                </button>
                              </div>
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={4}
                                autoFocus
                                placeholder={tx({ fr: 'Ecrire votre reponse...', en: 'Write your reply...', es: 'Escribir su respuesta...' })}
                                className="input-field text-sm w-full resize-none"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-grey-muted">
                                  {tx({ fr: `L'email sera envoye a ${item.email}`, en: `Email will be sent to ${item.email}`, es: `El email sera enviado a ${item.email}` })}
                                </span>
                                <button
                                  onClick={() => handleReply(item.documentId)}
                                  disabled={sendingReply || !replyText.trim()}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50"
                                >
                                  {sendingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                  {tx({ fr: 'Envoyer', en: 'Send', es: 'Enviar' })}
                                </button>
                              </div>
                              {replySuccess === item.documentId && (
                                <p className="text-xs text-green-400 font-semibold">{tx({ fr: 'Reponse envoyee!', en: 'Reply sent!', es: 'Respuesta enviada!' })}</p>
                              )}
                              {replySuccess === false && (
                                <p className="text-xs text-red-400 font-semibold">{tx({ fr: 'Erreur lors de l\'envoi', en: 'Error sending reply', es: 'Error al enviar' })}</p>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReplyingTo(item.documentId); setReplyText(''); setReplySuccess(null); }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors w-fit"
                            >
                              <Reply size={14} />
                              {tx({ fr: 'Repondre par email', en: 'Reply by email', es: 'Responder por email' })}
                            </button>
                          )}

                          {/* Details grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {item.telephone && (
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-accent" />
                                <span className="text-heading">{item.telephone}</span>
                              </div>
                            )}
                            {item.entreprise && (
                              <div className="flex items-center gap-2">
                                <Building2 size={14} className="text-accent" />
                                <span className="text-heading">{item.entreprise}</span>
                              </div>
                            )}
                            {item.budget && <div><span className="text-grey-muted text-xs">Budget: </span><span className="text-heading">{item.budget}</span></div>}
                            {item.urgence && <div><span className="text-grey-muted text-xs">Urgence: </span><span className="text-heading">{item.urgence}</span></div>}
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

export default AdminMessages;
