import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, CheckCircle, XCircle, Trash2, Link2, Copy, Check,
  ChevronDown, ChevronUp, Loader2, Send, Eye, Clock, Award,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import {
  getTestimonials, approveTestimonial, deleteTestimonial, generateTestimonialLink,
} from '../services/adminService';

const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

function AdminTemoignages() {
  const { tx } = useLang();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filter, setFilter] = useState('all'); // all, approved, pending
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Generate link state
  const [showGenerate, setShowGenerate] = useState(false);
  const [genName, setGenName] = useState('');
  const [genEmail, setGenEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (searchDebounce) params.search = searchDebounce;
      const res = await getTestimonials(params);
      setItems(res.data?.data || []);
    } catch (err) {
      console.error('Fetch testimonials error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, searchDebounce]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleApprove = async (item, approve) => {
    setUpdatingId(item.documentId);
    try {
      await approveTestimonial(item.documentId, approve, item.featured || false);
      await fetchItems();
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFeatured = async (item) => {
    setUpdatingId(item.documentId);
    try {
      await approveTestimonial(item.documentId, item.approved, !item.featured);
      await fetchItems();
    } catch (err) {
      console.error('Featured error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (documentId) => {
    setDeleting(documentId);
    try {
      await deleteTestimonial(documentId);
      setConfirmDelete(null);
      await fetchItems();
    } catch (err) {
      console.error('Delete error:', err);
      alert(tx({ fr: 'Erreur lors de la suppression', en: 'Error deleting', es: 'Error al eliminar' }));
    } finally {
      setDeleting(null);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genName.trim() || !genEmail.trim()) return;
    setGenerating(true);
    try {
      const res = await generateTestimonialLink({ clientName: genName, clientEmail: genEmail });
      setGeneratedLink(res.data?.link || '');
    } catch (err) {
      console.error('Generate link error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetGenerate = () => {
    setShowGenerate(false);
    setGenName('');
    setGenEmail('');
    setGeneratedLink('');
    setCopied(false);
  };

  const pendingCount = items.filter(i => !i.approved && i.textFr).length;
  const approvedCount = items.filter(i => i.approved).length;

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-glass text-center">
          <div className="text-2xl font-heading font-bold text-heading">{items.length}</div>
          <div className="text-xs text-grey-muted">{tx({ fr: 'Total', en: 'Total', es: 'Total' })}</div>
        </div>
        <div className="p-4 rounded-xl bg-glass text-center">
          <div className="text-2xl font-heading font-bold text-yellow-400">{pendingCount}</div>
          <div className="text-xs text-grey-muted">{tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' })}</div>
        </div>
        <div className="p-4 rounded-xl bg-glass text-center">
          <div className="text-2xl font-heading font-bold text-green-400">{approvedCount}</div>
          <div className="text-xs text-grey-muted">{tx({ fr: 'Approuves', en: 'Approved', es: 'Aprobados' })}</div>
        </div>
        <div className="p-4 rounded-xl bg-glass text-center">
          <div className="text-2xl font-heading font-bold text-accent">{items.filter(i => i.featured).length}</div>
          <div className="text-xs text-grey-muted">{tx({ fr: 'Vedette', en: 'Featured', es: 'Destacado' })}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx({ fr: 'Rechercher...', en: 'Search...', es: 'Buscar...' })}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-glass text-heading text-sm placeholder:text-grey-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'pending', 'approved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
              }`}
            >
              {f === 'all' ? tx({ fr: 'Tous', en: 'All', es: 'Todos' })
                : f === 'pending' ? tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' })
                : tx({ fr: 'Approuves', en: 'Approved', es: 'Aprobados' })}
            </button>
          ))}
        </div>

        {/* Generate link button */}
        <button
          onClick={() => showGenerate ? resetGenerate() : setShowGenerate(true)}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
        >
          <Link2 size={16} />
          {tx({ fr: 'Générer un lien', en: 'Generate link', es: 'Generar enlace' })}
        </button>
      </div>

      {/* Generate link form */}
      <AnimatePresence>
        {showGenerate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-xl bg-glass bg-accent/5">
              <h3 className="text-heading font-heading font-bold mb-3 flex items-center gap-2">
                <Send size={16} className="text-accent" />
                {tx({ fr: 'Générer un lien de témoignage', en: 'Generate testimonial link', es: 'Generar enlace de testimonio' })}
              </h3>

              {!generatedLink ? (
                <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={genName}
                    onChange={(e) => setGenName(e.target.value)}
                    placeholder={tx({ fr: 'Nom du client', en: 'Client name', es: 'Nombre del cliente' })}
                    required
                    className="flex-1 px-4 py-2.5 rounded-lg bg-transparent text-heading text-sm placeholder:text-grey-muted/50 focus:shadow-[inset_0_1px_4px_rgba(255,82,160,0.3)] focus:outline-none"
                  />
                  <input
                    type="email"
                    value={genEmail}
                    onChange={(e) => setGenEmail(e.target.value)}
                    placeholder={tx({ fr: 'Email du client', en: 'Client email', es: 'Email del cliente' })}
                    required
                    className="flex-1 px-4 py-2.5 rounded-lg bg-transparent text-heading text-sm placeholder:text-grey-muted/50 focus:shadow-[inset_0_1px_4px_rgba(255,82,160,0.3)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={generating}
                    className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50"
                  >
                    {generating ? <Loader2 size={16} className="animate-spin" /> : tx({ fr: 'Générer', en: 'Generate', es: 'Generar' })}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle size={16} />
                    {tx({ fr: 'Lien genere! Copiez-le et envoyez-le au client.', en: 'Link generated! Copy it and send it to the client.', es: 'Enlace generado! Copielo y envieselo al cliente.' })}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 px-4 py-2.5 rounded-lg bg-transparent text-heading text-sm font-mono"
                    />
                    <button
                      onClick={handleCopy}
                      className="btn-outline text-sm py-2.5 px-4 flex items-center gap-2"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      {copied ? tx({ fr: 'Copie!', en: 'Copied!', es: 'Copiado!' }) : tx({ fr: 'Copier', en: 'Copy', es: 'Copiar' })}
                    </button>
                  </div>
                  <button onClick={resetGenerate} className="text-xs text-grey-muted hover:text-heading">
                    {tx({ fr: 'Générer un autre lien', en: 'Generate another link', es: 'Generar otro enlace' })}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-grey-muted">
          <Star size={48} className="mx-auto mb-4 opacity-30" />
          <p>{tx({ fr: 'Aucun témoignage', en: 'No testimonials', es: 'Sin testimonios' })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item.documentId;
            const isWaiting = !item.textFr; // Lien envoye mais pas encore soumis
            const isUpdating = updatingId === item.documentId;

            return (
              <motion.div
                key={item.documentId}
                layout
                className="rounded-xl card-bg shadow-lg shadow-black/20 overflow-hidden"
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-glass/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.documentId)}
                >
                  {/* Status indicator */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    isWaiting ? 'bg-grey-muted/40' : item.approved ? 'bg-green-400' : 'bg-yellow-400'
                  }`} />

                  {/* Name + rating */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-heading font-semibold text-sm truncate">{item.name}</span>
                      {item.featured && <Award size={14} className="text-accent flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-grey-muted">
                      <span className="truncate">{item.email}</span>
                      <span>-</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Stars */}
                  {item.rating && (
                    <div className="hidden sm:flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} className={s <= item.rating ? 'text-yellow-400' : 'text-grey-muted/20'} fill={s <= item.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  )}

                  {/* Status badge */}
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                    isWaiting ? 'bg-grey-muted/20 text-grey-muted'
                      : item.approved ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {isWaiting
                      ? tx({ fr: 'En attente', en: 'Awaiting', es: 'Esperando' })
                      : item.approved
                        ? tx({ fr: 'Approuve', en: 'Approved', es: 'Aprobado' })
                        : tx({ fr: 'A approuver', en: 'To approve', es: 'Por aprobar' })}
                  </span>

                  {/* Actions rapides (desktop) */}
                  <div className="hidden md:flex items-center gap-1">
                    {!isWaiting && !item.approved && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(item, true); }}
                        disabled={isUpdating}
                        className="p-1.5 rounded-lg hover:bg-green-500/20 text-grey-muted hover:text-green-400 transition-colors"
                        title={tx({ fr: 'Approuver', en: 'Approve', es: 'Aprobar' })}
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {!isWaiting && item.approved && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(item, false); }}
                        disabled={isUpdating}
                        className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-grey-muted hover:text-yellow-400 transition-colors"
                        title={tx({ fr: 'Retirer approbation', en: 'Unapprove', es: 'Desaprobar' })}
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    {!isWaiting && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleFeatured(item); }}
                        disabled={isUpdating}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.featured ? 'text-accent hover:bg-accent/20' : 'text-grey-muted hover:bg-accent/20 hover:text-accent'
                        }`}
                        title={tx({ fr: 'Vedette', en: 'Featured', es: 'Destacado' })}
                      >
                        <Award size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.documentId); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-grey-muted hover:text-red-400 transition-colors"
                      title={tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {isExpanded ? <ChevronUp size={16} className="text-grey-muted" /> : <ChevronDown size={16} className="text-grey-muted" />}
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 space-y-3 shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
                        {isWaiting ? (
                          <p className="text-grey-muted text-sm italic flex items-center gap-2">
                            <Clock size={14} />
                            {tx({
                              fr: 'Le client n\'a pas encore soumis son témoignage.',
                              en: 'The client has not submitted their testimonial yet.',
                              es: 'El cliente aun no ha enviado su testimonio.',
                            })}
                          </p>
                        ) : (
                          <>
                            {/* Stars mobile */}
                            {item.rating && (
                              <div className="flex items-center gap-1 sm:hidden">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} size={16} className={s <= item.rating ? 'text-yellow-400' : 'text-grey-muted/20'} fill={s <= item.rating ? 'currentColor' : 'none'} />
                                ))}
                              </div>
                            )}

                            {/* Texte */}
                            <div className="p-4 rounded-lg bg-glass/50">
                              <p className="text-heading text-sm leading-relaxed italic">"{item.textFr}"</p>
                              {item.textEn && (
                                <p className="text-grey-muted text-sm leading-relaxed italic mt-2">"{item.textEn}"</p>
                              )}
                            </div>

                            {/* Role */}
                            {item.roleFr && (
                              <p className="text-grey-muted text-xs">
                                <span className="text-heading font-semibold">{item.name}</span> - {item.roleFr}
                              </p>
                            )}
                          </>
                        )}

                        {/* Token/link */}
                        {item.token && (
                          <div className="flex items-center gap-2 text-xs text-grey-muted">
                            <Link2 size={12} />
                            <span className="font-mono truncate">{item.token}</span>
                          </div>
                        )}

                        {/* Mobile actions */}
                        <div className="flex items-center gap-2 md:hidden pt-2 shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
                          {!isWaiting && !item.approved && (
                            <button
                              onClick={() => handleApprove(item, true)}
                              disabled={isUpdating}
                              className="flex-1 btn-primary text-xs py-2 justify-center"
                            >
                              <CheckCircle size={14} className="mr-1" />
                              {tx({ fr: 'Approuver', en: 'Approve', es: 'Aprobar' })}
                            </button>
                          )}
                          {!isWaiting && item.approved && (
                            <button
                              onClick={() => handleApprove(item, false)}
                              disabled={isUpdating}
                              className="flex-1 btn-outline text-xs py-2 justify-center"
                            >
                              <XCircle size={14} className="mr-1" />
                              {tx({ fr: 'Retirer', en: 'Unapprove', es: 'Desaprobar' })}
                            </button>
                          )}
                          {!isWaiting && (
                            <button
                              onClick={() => handleFeatured(item)}
                              disabled={isUpdating}
                              className={`btn-outline text-xs py-2 px-3 ${item.featured ? 'text-accent' : ''}`}
                            >
                              <Award size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDelete(item.documentId)}
                            className="btn-outline text-xs py-2 px-3 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Confirm delete */}
                        {confirmDelete === item.documentId && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 bg-red-500/5">
                            <span className="text-red-400 text-xs flex-1">
                              {tx({ fr: 'Supprimer ce témoignage?', en: 'Delete this testimonial?', es: 'Eliminar este testimonio?' })}
                            </span>
                            <button
                              onClick={() => handleDelete(item.documentId)}
                              disabled={deleting === item.documentId}
                              className="px-3 py-1 rounded bg-red-500 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              {deleting === item.documentId ? <Loader2 size={12} className="animate-spin" /> : tx({ fr: 'Oui', en: 'Yes', es: 'Si' })}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1 rounded bg-glass text-grey-muted text-xs"
                            >
                              {tx({ fr: 'Non', en: 'No', es: 'No' })}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminTemoignages;
