import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, ChevronUp, MessageSquare, Mail,
  Eye, Reply, Archive, Loader2, Phone, Building2,
  ChevronLeft, ChevronRight, Clock, Send, X, Palette,
  CheckCircle, XCircle, MapPin, Image, FileText, ExternalLink,
  UserCheck, Trash2,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import {
  getContactSubmissions, updateContactStatus, replyToContact, deleteContact,
  getArtistSubmissions, updateArtistStatus, deleteArtistSubmission,
} from '../services/adminService';
import {
  getArtistMessagesAdmin, replyArtistMessage, updateArtistMessageStatus,
  approveEditRequest, rejectEditRequest,
} from '../services/artistService';

// Helper: rend les URLs cliquables et parse les liens sociaux
function Linkify({ text }) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      // Determine label
      let label = part;
      if (part.includes('instagram.com')) label = 'Instagram';
      else if (part.includes('facebook.com')) label = 'Facebook';
      else if (part.includes('tiktok.com')) label = 'TikTok';
      else if (part.includes('youtube.com') || part.includes('youtu.be')) label = 'YouTube';
      else if (part.includes('gallea.ca')) label = 'Gallea';
      else {
        try {
          const h = new URL(part).hostname.replace('www.', '');
          const domainParts = h.split('.');
          const main = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domainParts[0];
          label = main.charAt(0).toUpperCase() + main.slice(1);
        } catch { label = part; }
      }
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent text-xs hover:bg-accent/20 transition-colors mx-0.5"
          onClick={(e) => e.stopPropagation()}>
          <ExternalLink size={10} />
          {label}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// Unified status map - includes both contact and artist statuses
const ALL_STATUS = {
  new:       { fr: 'Nouveau',     en: 'New',       es: 'Nuevo',      color: 'bg-blue-500/20 text-blue-400', icon: Mail },
  read:      { fr: 'Lu',          en: 'Read',      es: 'Leido',      color: 'bg-yellow-500/20 text-yellow-400', icon: Eye },
  reviewing: { fr: 'En revision', en: 'Reviewing', es: 'En revision', color: 'bg-yellow-500/20 text-yellow-400', icon: Eye },
  replied:   { fr: 'Repondu',     en: 'Replied',   es: 'Respondido',  color: 'bg-green-500/20 text-green-400', icon: Reply },
  accepted:  { fr: 'Accepte',     en: 'Accepted',  es: 'Aceptado',    color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  rejected:  { fr: 'Refuse',      en: 'Rejected',  es: 'Rechazado',   color: 'bg-red-500/20 text-red-400', icon: XCircle },
  archived:  { fr: 'Archive',     en: 'Archived',  es: 'Archivado',   color: 'bg-gray-500/20 text-gray-400', icon: Archive },
};

const CONTACT_FLOW = {
  new: ['read', 'replied', 'archived'],
  read: ['replied', 'archived'],
  replied: ['archived'],
  archived: [],
};

const ARTIST_FLOW = {
  new: ['reviewing', 'rejected', 'archived'],
  reviewing: ['accepted', 'rejected', 'archived'],
  accepted: ['archived'],
  rejected: ['reviewing', 'archived'],
  archived: [],
};

const ARTIST_MSG_FLOW = {
  new: ['read', 'replied', 'archived'],
  read: ['replied', 'archived'],
  replied: ['archived'],
  archived: [],
};

// Category labels for artist messages
const CATEGORY_LABELS = {
  'new-images': { fr: 'Depot images', en: 'Image deposit', es: 'Deposito imagenes' },
  'question': { fr: 'Question', en: 'Question', es: 'Pregunta' },
  'withdrawal': { fr: 'Retrait', en: 'Withdrawal', es: 'Retiro' },
  'update-profile': { fr: 'Profil', en: 'Profile', es: 'Perfil' },
  'edit-request': { fr: 'Demande modif', en: 'Edit request', es: 'Solicitud modif' },
  'other': { fr: 'Autre', en: 'Other', es: 'Otro' },
};

// Filter buttons: show only the combined relevant statuses
const FILTER_STATUSES = ['all', 'new', 'read', 'reviewing', 'replied', 'accepted', 'rejected', 'archived'];

const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y} ${m} ${day}`;
};

function AdminMessages() {
  const { tx } = useLang();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all'); // all, contact, candidature, artist-msg
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all three in parallel
      const [contactRes, artistRes, artistMsgRes] = await Promise.all([
        getContactSubmissions({ pageSize: 100, ...(searchDebounce ? { search: searchDebounce } : {}) }),
        getArtistSubmissions({ pageSize: 100, ...(searchDebounce ? { search: searchDebounce } : {}) }),
        getArtistMessagesAdmin().catch(() => ({ data: { data: [] } })),
      ]);

      // Normalize contact messages
      const contacts = (contactRes.data.data || []).map(c => ({
        ...c,
        _type: 'contact',
        _uid: `contact-${c.documentId}`,
        _nom: c.nom,
        _email: c.email,
        _service: c.service || '-',
      }));

      // Normalize artist submissions
      const artists = (artistRes.data.data || []).map(a => ({
        ...a,
        _type: 'candidature',
        _uid: `artist-${a.documentId}`,
        _nom: a.nomLegal,
        _email: a.email,
        _service: 'Candidature',
      }));

      // Normalize artist messages (image deposits, questions, etc.)
      const artistMsgs = (artistMsgRes.data?.data || artistMsgRes.data || []).map(m => ({
        ...m,
        _type: 'artist-msg',
        _uid: `amsg-${m.documentId}`,
        _nom: m.artistName || m.artistSlug || m.email,
        _email: m.email,
        _service: tx(CATEGORY_LABELS[m.category] || CATEGORY_LABELS.other),
      }));

      // Merge and sort by date descending
      const merged = [...contacts, ...artists, ...artistMsgs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(merged);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [searchDebounce]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Apply filters client-side since we fetch all
  const filtered = items.filter(i => {
    if (filterType !== 'all' && i._type !== filterType) return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    return true;
  });

  const handleStatusChange = async (item, newStatus) => {
    setUpdatingId(item._uid);
    try {
      if (item._type === 'contact') {
        await updateContactStatus(item.documentId, newStatus);
      } else if (item._type === 'artist-msg') {
        await updateArtistMessageStatus(item.documentId, newStatus);
      } else {
        await updateArtistStatus(item.documentId, newStatus);
      }
      setItems(prev => prev.map(i => i._uid === item._uid ? { ...i, status: newStatus } : i));
    } catch { /* silent */ } finally { setUpdatingId(null); }
  };

  const handleDelete = async (item) => {
    if (confirmDelete !== item._uid) { setConfirmDelete(item._uid); return; }
    setDeleting(item._uid);
    try {
      if (item._type === 'contact') {
        await deleteContact(item.documentId);
      } else {
        await deleteArtistSubmission(item.documentId);
      }
      setItems(prev => prev.filter(i => i._uid !== item._uid));
      setExpandedId(null);
      setConfirmDelete(null);
    } catch { /* silent */ } finally { setDeleting(null); }
  };

  const handleReply = async (item) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    setReplySuccess(null);
    try {
      if (item._type === 'artist-msg') {
        await replyArtistMessage(item.documentId, replyText.trim());
        setItems(prev => prev.map(i => i._uid === item._uid ? { ...i, status: 'replied', adminReply: replyText.trim() } : i));
      } else {
        const { data } = await replyToContact(item.documentId, replyText.trim());
        setItems(prev => prev.map(i => i._uid === item._uid ? { ...i, status: 'replied', notes: data.notes } : i));
      }
      setReplySuccess(item._uid);
      setReplyText('');
      setTimeout(() => { setReplySuccess(null); setReplyingTo(null); }, 2000);
    } catch {
      setReplySuccess(false);
    } finally {
      setSendingReply(false);
    }
  };

  const toggleExpand = (item) => {
    if (expandedId === item._uid) { setExpandedId(null); return; }
    setExpandedId(item._uid);
    // Auto-mark as read/reviewing when expanded
    if (item.status === 'new') {
      if (item._type === 'contact' || item._type === 'artist-msg') handleStatusChange(item, 'read');
      else if (item._type === 'candidature') handleStatusChange(item, 'reviewing');
    }
  };

  const newCount = items.filter(i => i.status === 'new').length;

  const summaryCards = [
    { label: tx({ fr: 'Total', en: 'Total', es: 'Total' }), value: items.length, icon: MessageSquare, accent: 'text-accent' },
    { label: tx({ fr: 'Nouveaux', en: 'New', es: 'Nuevos' }), value: newCount, icon: Mail, accent: 'text-blue-400' },
    { label: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }), value: items.filter(i => i._type === 'artist-msg').length, icon: Image, accent: 'text-pink-400' },
    { label: tx({ fr: 'Candidatures', en: 'Applications', es: 'Candidaturas' }), value: items.filter(i => i._type === 'candidature').length, icon: Palette, accent: 'text-purple-400' },
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
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={tx({ fr: 'Rechercher par nom, email...', en: 'Search by name, email...', es: 'Buscar por nombre, email...' })}
            className="input-field pl-9 text-sm" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {/* Type filter */}
          {['all', 'contact', 'artist-msg', 'candidature'].map((t) => (
            <button key={t} onClick={() => { setFilterType(t); setExpandedId(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterType === t ? 'text-accent' : 'text-grey-muted hover:text-accent'}`}>
              {t === 'all' ? tx({ fr: 'Tout', en: 'All', es: 'Todo' })
                : t === 'contact' ? tx({ fr: 'Messages', en: 'Messages', es: 'Mensajes' })
                : t === 'artist-msg' ? tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' })
                : tx({ fr: 'Candidatures', en: 'Applications', es: 'Candidaturas' })}
            </button>
          ))}
          <span className="w-px bg-grey-muted/20 mx-1 self-stretch" />
          {/* Status filter */}
          {FILTER_STATUSES.map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setExpandedId(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === s ? 'text-accent' : 'text-grey-muted hover:text-accent'}`}>
              {s === 'all' ? tx({ fr: 'Tous', en: 'All', es: 'Todos' }) : tx({ fr: ALL_STATUS[s].fr, en: ALL_STATUS[s].en, es: ALL_STATUS[s].es })}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-grey-muted">{tx({ fr: 'Aucun message', en: 'No messages', es: 'Sin mensajes' })}</div>
      ) : (
        <div className="rounded-xl bg-glass overflow-hidden card-border">
          <div className="hidden md:grid grid-cols-[100px_1fr_1fr_120px_100px_40px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b card-border">
            <span>Date</span>
            <span>{tx({ fr: 'Nom', en: 'Name', es: 'Nombre' })}</span>
            <span>Email</span>
            <span>Service</span>
            <span>Status</span>
            <span></span>
          </div>

          <AnimatePresence>
            {filtered.map((item) => {
              const st = ALL_STATUS[item.status] || ALL_STATUS.new;
              const StIcon = st.icon;
              const isExpanded = expandedId === item._uid;
              const statusFlow = item._type === 'contact' ? CONTACT_FLOW : item._type === 'artist-msg' ? ARTIST_MSG_FLOW : ARTIST_FLOW;
              const nextStatuses = statusFlow[item.status] || [];
              const isCandidature = item._type === 'candidature';
              const isArtistMsg = item._type === 'artist-msg';

              return (
                <motion.div key={item._uid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b last:border-b-0 card-border">
                  <div onClick={() => toggleExpand(item)}
                    className={`grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_120px_100px_40px] gap-2 md:gap-3 px-4 py-3 items-center cursor-pointer hover:bg-accent/5 transition-colors ${item.status === 'new' ? 'bg-blue-500/5' : ''}`}>
                    {/* Mobile: 2-line compact */}
                    <span className="text-xs text-grey-muted md:block hidden">{formatDate(item.createdAt)}</span>
                    <span className="md:hidden text-xs text-grey-muted flex items-center gap-2">
                      {formatDate(item.createdAt)}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.color}`}>
                        <StIcon size={10} />{tx({ fr: st.fr, en: st.en, es: st.es })}
                      </span>
                      {isCandidature && <span className="text-purple-400 text-[10px] font-semibold">{tx({ fr: 'Candidature', en: 'Application', es: 'Candidatura' })}</span>}
                      {isArtistMsg && <span className="text-pink-400 text-[10px] font-semibold">{item._service}</span>}
                    </span>
                    <span className="text-sm text-heading font-medium truncate">{item._nom}</span>
                    <span className="text-xs text-grey-muted truncate hidden md:block">{item._email}</span>
                    <span className="text-xs text-grey-muted truncate hidden md:block">
                      {isCandidature ? (
                        <span className="text-purple-400 font-semibold">{tx({ fr: 'Candidature', en: 'Application', es: 'Candidatura' })}</span>
                      ) : isArtistMsg ? (
                        <span className="text-pink-400 font-semibold">{item._service}</span>
                      ) : item._service}
                    </span>
                    <span className={`hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold w-fit ${st.color}`}>
                      <StIcon size={12} />
                      {tx({ fr: st.fr, en: st.en, es: st.es })}
                    </span>
                    <span className="text-grey-muted justify-self-end hidden md:block">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-5 pt-1 space-y-4 border-t card-border bg-glass/50">
                          {/* ARTIST MESSAGE expanded view */}
                          {isArtistMsg && (
                            <>
                              {/* Artist info bar */}
                              <div className="flex items-center gap-3 rounded-lg bg-pink-500/5 border border-pink-500/20 p-3">
                                <Palette size={16} className="text-pink-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-heading text-sm font-semibold">{item.artistName || item.artistSlug}</p>
                                  <p className="text-grey-muted text-xs">{item.email}</p>
                                </div>
                                <span className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-semibold">{item._service}</span>
                              </div>

                              {/* Message */}
                              {item.message && (
                                <div className="rounded-lg bg-glass p-4">
                                  <p className="text-sm text-heading whitespace-pre-wrap"><Linkify text={item.message} /></p>
                                </div>
                              )}

                              {/* Attachments / Images */}
                              {(() => {
                                const atts = Array.isArray(item.attachments) ? item.attachments : [];
                                return atts.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                      <Image size={12} className="text-pink-400" />
                                      {tx({ fr: 'Fichiers joints', en: 'Attachments', es: 'Archivos adjuntos' })} ({atts.length})
                                    </h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                                      {atts.map((att, ai) => {
                                        const isImg = att.mime && att.mime.startsWith('image/');
                                        return (
                                          <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()} className="block group relative aspect-square" title={att.name}>
                                            {isImg ? (
                                              <img src={att.url} alt={att.name} className="w-full h-full rounded-lg object-cover border-2 border-transparent group-hover:border-pink-400 transition-colors" />
                                            ) : (
                                              <div className="w-full h-full rounded-lg bg-glass flex flex-col items-center justify-center gap-1 border-2 border-transparent group-hover:border-pink-400 transition-colors">
                                                <FileText size={24} className="text-pink-400" />
                                                <span className="text-[8px] text-grey-muted truncate max-w-[90%] px-1">{att.name}</span>
                                              </div>
                                            )}
                                            <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                              <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Admin reply display */}
                              {item.adminReply && (
                                <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Reply size={12} /> {tx({ fr: 'Reponse admin', en: 'Admin reply', es: 'Respuesta admin' })}
                                  </h4>
                                  <p className="text-sm text-heading whitespace-pre-wrap">{item.adminReply}</p>
                                </div>
                              )}

                              {/* Edit request: Approve/Reject buttons */}
                              {item.category === 'edit-request' && item.attachments?.editRequestId && (() => {
                                const editReqId = item.attachments.editRequestId;
                                const reqType = item.attachments.requestType || '';
                                const changeData = item.attachments.changeData || {};
                                const isGalleryChange = reqType.startsWith('add-') || reqType.startsWith('remove-');
                                const isAlreadyProcessed = item.status === 'replied' || item.adminReply;

                                if (!isGalleryChange || isAlreadyProcessed) return null;

                                const images = changeData.images || [];
                                const itemIds = changeData.itemIds || [];

                                return (
                                  <div className="rounded-lg bg-purple-main/10 border border-purple-main/20 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                                    <h4 className="text-xs font-semibold text-heading uppercase tracking-wider flex items-center gap-1.5">
                                      <Image size={12} className="text-accent" />
                                      {tx({ fr: 'Demande de modification', en: 'Edit request', es: 'Solicitud de modificacion' })}
                                      <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px]">{reqType}</span>
                                    </h4>

                                    {/* Preview images for add requests */}
                                    {images.length > 0 && (
                                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {images.map((img, idx) => (
                                          <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-glass">
                                            <img src={img.originalUrl} alt={img.title || ''} className="w-full h-full object-cover" loading="lazy" />
                                            {img.title && <p className="text-[9px] text-grey-muted truncate px-1 py-0.5">{img.title}</p>}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Info for remove requests */}
                                    {itemIds.length > 0 && (
                                      <p className="text-sm text-heading">
                                        {tx({ fr: `Suppression de ${itemIds.length} element(s):`, en: `Removal of ${itemIds.length} item(s):`, es: `Eliminacion de ${itemIds.length} elemento(s):` })}
                                        <span className="text-grey-muted ml-1">{itemIds.join(', ')}</span>
                                      </p>
                                    )}

                                    {/* Reject reason input */}
                                    {replyingTo === `reject-${item._uid}` ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          rows={2}
                                          autoFocus
                                          placeholder={tx({ fr: 'Raison du refus (optionnel)...', en: 'Rejection reason (optional)...', es: 'Razon del rechazo (opcional)...' })}
                                          className="input-field text-sm w-full resize-none"
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={async () => {
                                              try {
                                                await rejectEditRequest(editReqId, replyText);
                                                setReplyingTo(null);
                                                setReplyText('');
                                                // Refresh
                                                fetchItems();
                                              } catch {}
                                            }}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                                          >
                                            <XCircle size={12} /> {tx({ fr: 'Confirmer le refus', en: 'Confirm rejection', es: 'Confirmar rechazo' })}
                                          </button>
                                          <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="text-grey-muted text-xs hover:text-heading">
                                            {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={async () => {
                                            try {
                                              await approveEditRequest(editReqId);
                                              // Refresh
                                              const { data } = await getArtistMessagesAdmin();
                                              fetchItems();
                                            } catch (err) {
                                              console.error('Approve failed:', err);
                                            }
                                          }}
                                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                                        >
                                          <CheckCircle size={14} /> {tx({ fr: 'Approuver', en: 'Approve', es: 'Aprobar' })}
                                        </button>
                                        <button
                                          onClick={() => { setReplyingTo(`reject-${item._uid}`); setReplyText(''); }}
                                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors"
                                        >
                                          <XCircle size={14} /> {tx({ fr: 'Rejeter', en: 'Reject', es: 'Rechazar' })}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Reply + actions */}
                              {replyingTo === item._uid ? (
                                <div className="rounded-lg bg-accent/5 border card-border p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                                      <Reply size={12} />
                                      {tx({ fr: `Repondre a ${item._nom}`, en: `Reply to ${item._nom}`, es: `Responder a ${item._nom}` })}
                                    </h4>
                                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="text-grey-muted hover:text-heading"><X size={14} /></button>
                                  </div>
                                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} autoFocus
                                    placeholder={tx({ fr: 'Ecrire votre reponse...', en: 'Write your reply...', es: 'Escribir su respuesta...' })}
                                    className="input-field text-sm w-full resize-none" />
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-grey-muted">{tx({ fr: 'Visible dans le panneau artiste', en: 'Visible in artist panel', es: 'Visible en panel artista' })}</span>
                                    <button onClick={() => handleReply(item)} disabled={sendingReply || !replyText.trim()}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50">
                                      {sendingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                      {tx({ fr: 'Envoyer', en: 'Send', es: 'Enviar' })}
                                    </button>
                                  </div>
                                  {replySuccess === item._uid && <p className="text-xs text-green-400 font-semibold">{tx({ fr: 'Reponse envoyee!', en: 'Reply sent!', es: 'Respuesta enviada!' })}</p>}
                                  {replySuccess === false && <p className="text-xs text-red-400 font-semibold">{tx({ fr: 'Erreur lors de l\'envoi', en: 'Error sending reply', es: 'Error al enviar' })}</p>}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); setReplyingTo(item._uid); setReplyText(''); setReplySuccess(null); }}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors">
                                    <Reply size={14} /> {tx({ fr: 'Repondre', en: 'Reply', es: 'Responder' })}
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {/* CONTACT expanded view */}
                          {!isCandidature && !isArtistMsg && (
                            <>
                              {/* Message */}
                              <div className="rounded-lg bg-glass p-4">
                                <p className="text-sm text-heading whitespace-pre-wrap"><Linkify text={item.message} /></p>
                                {item.attachments && item.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                                    {item.attachments.map((att, j) => (
                                      <a key={j} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent hover:bg-accent/20 transition-colors">
                                        📎 {att.name?.length > 25 ? att.name.substring(0, 25) + '...' : att.name}
                                        {att.size && <span className="text-grey-muted text-[10px]">({(att.size / 1024 / 1024).toFixed(1)} MB)</span>}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Reply section */}
                              {replyingTo === item._uid ? (
                                <div className="rounded-lg bg-accent/5 border card-border p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                                      <Reply size={12} />
                                      {tx({ fr: `Repondre a ${item._nom}`, en: `Reply to ${item._nom}`, es: `Responder a ${item._nom}` })}
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
                                      {tx({ fr: `L'email sera envoye a ${item._email}`, en: `Email will be sent to ${item._email}`, es: `El email sera enviado a ${item._email}` })}
                                    </span>
                                    <button
                                      onClick={() => handleReply(item)}
                                      disabled={sendingReply || !replyText.trim()}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50"
                                    >
                                      {sendingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                      {tx({ fr: 'Envoyer', en: 'Send', es: 'Enviar' })}
                                    </button>
                                  </div>
                                  {replySuccess === item._uid && (
                                    <p className="text-xs text-green-400 font-semibold">{tx({ fr: 'Reponse envoyee!', en: 'Reply sent!', es: 'Respuesta enviada!' })}</p>
                                  )}
                                  {replySuccess === false && (
                                    <p className="text-xs text-red-400 font-semibold">{tx({ fr: 'Erreur lors de l\'envoi', en: 'Error sending reply', es: 'Error al enviar' })}</p>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setReplyingTo(item._uid); setReplyText(''); setReplySuccess(null); }}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors"
                                  >
                                    <Reply size={14} />
                                    {tx({ fr: 'Repondre par email', en: 'Reply by email', es: 'Responder por email' })}
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                    disabled={deleting === item._uid}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50">
                                    {deleting === item._uid ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    {confirmDelete === item._uid
                                      ? tx({ fr: 'Confirmer', en: 'Confirm', es: 'Confirmar' })
                                      : tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                                  </button>
                                  {confirmDelete === item._uid && (
                                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                                      className="px-3 py-2 rounded-lg text-xs font-semibold text-grey-muted hover:text-heading transition-colors">
                                      {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                                    </button>
                                  )}
                                </div>
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
                                {item.urgence && <div><span className="text-grey-muted text-xs">{tx({ fr: 'Urgence', en: 'Urgency', es: 'Urgencia' })}: </span><span className="text-heading">{item.urgence}</span></div>}
                              </div>
                            </>
                          )}

                          {/* CANDIDATURE expanded view */}
                          {isCandidature && (
                            <>
                              {/* Profile + Info */}
                              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
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
                                    {item.telephone && <div className="flex items-center gap-1.5"><Phone size={14} className="text-accent" /><span className="text-heading">{item.telephone}</span></div>}
                                  </div>
                                  {item.adresse && (
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <MapPin size={14} className="text-accent flex-shrink-0" />
                                      <span className="text-grey-muted">{item.adresse}</span>
                                    </div>
                                  )}
                                  {item.tpsTvq && <p className="text-xs text-grey-muted">TPS/TVQ: {item.tpsTvq}</p>}
                                </div>
                              </div>

                              {/* Bio */}
                              {item.bio && (
                                <div className="rounded-lg bg-glass p-4">
                                  <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">{tx({ fr: 'Bio / Demarche', en: 'Bio / Statement', es: 'Bio / Propuesta' })}</h4>
                                  <p className="text-sm text-heading whitespace-pre-wrap">{item.bio}</p>
                                </div>
                              )}

                              {/* Portfolio */}
                              {(() => {
                                const portfolio = Array.isArray(item.portfolioUrls) ? item.portfolioUrls : [];
                                return portfolio.length > 0 && (
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
                                              <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Contract info + delete */}
                              <div className="flex items-center gap-3 text-xs text-grey-muted">
                                <CheckCircle size={14} className="text-green-400" />
                                <span>{tx({ fr: 'Contrat accepte', en: 'Contract accepted', es: 'Contrato aceptado' })} (v{item.contractVersion || '1'})</span>
                                <span className="flex-1" />
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                  disabled={deleting === item._uid}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50">
                                  {deleting === item._uid ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                  {confirmDelete === item._uid
                                    ? tx({ fr: 'Confirmer', en: 'Confirm', es: 'Confirmar' })
                                    : tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                                </button>
                                {confirmDelete === item._uid && (
                                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-grey-muted hover:text-heading transition-colors">
                                    {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
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
    </div>
  );
}

export default AdminMessages;
