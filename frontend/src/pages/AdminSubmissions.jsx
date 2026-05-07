import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus, Loader2, Search, ExternalLink, Trash2, X, Mail, Phone,
  MapPin, FileText, AlertCircle, CheckCircle2, Clock, Eye, RefreshCw,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import {
  getArtistSubmissions,
  updateArtistStatus,
  deleteArtistSubmission,
} from '../services/adminService';

/**
 * Statuts backend (enum schema.json) -> labels & couleurs UI.
 * Le backend stocke 'new' / 'reviewing' / 'accepted' / 'rejected' / 'archived'.
 * Mapping vers les labels demandes : En attente / En revue / Approuve / Refuse / Archive.
 */
const STATUS_META = {
  new: { fr: 'En attente', en: 'Pending', es: 'En espera', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  reviewing: { fr: 'En revue', en: 'Reviewing', es: 'En revision', color: 'bg-sky-500/20 text-sky-400', icon: Eye },
  accepted: { fr: 'Approuve', en: 'Approved', es: 'Aprobada', color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  rejected: { fr: 'Refuse', en: 'Rejected', es: 'Rechazada', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
  archived: { fr: 'Archive', en: 'Archived', es: 'Archivada', color: 'bg-grey-muted/20 text-grey-muted', icon: FileText },
};

const STATUS_OPTIONS = ['new', 'reviewing', 'accepted', 'rejected', 'archived'];

function formatDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return '-'; }
}

function StatusBadge({ status, lang = 'fr' }) {
  const meta = STATUS_META[status] || STATUS_META.new;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${meta.color}`}>
      <Icon size={11} />
      {meta[lang] || meta.fr}
    </span>
  );
}

function AdminSubmissions() {
  const { tx, lang } = useLang();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(null);
  const [feedback, setFeedback] = useState('');

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { pageSize: 200 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await getArtistSubmissions(params);
      setSubmissions(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      // Backend renvoie 401 si pas admin, autre code = problem reseau/serveur
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError(tx({
          fr: 'Acces refuse - email admin requis',
          en: 'Access denied - admin email required',
          es: 'Acceso denegado - email admin requerido',
        }));
      } else {
        setError(tx({
          fr: 'Erreur de chargement des soumissions',
          en: 'Error loading submissions',
          es: 'Error al cargar postulaciones',
        }));
      }
      console.error('[AdminSubmissions] fetch failed:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, tx]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Stats simples par statut
  const counts = useMemo(() => {
    const c = { all: submissions.length };
    for (const s of STATUS_OPTIONS) c[s] = 0;
    for (const sub of submissions) {
      if (sub.status && c[sub.status] !== undefined) c[sub.status]++;
    }
    return c;
  }, [submissions]);

  const handleStatusChange = async (sub, newStatus) => {
    if (sub.status === newStatus) return;
    setBusyId(sub.documentId);
    try {
      // updateArtistStatus(documentId, status, notes) - signature existante
      await updateArtistStatus(sub.documentId, newStatus);
      setSubmissions(prev => prev.map(s =>
        s.documentId === sub.documentId ? { ...s, status: newStatus } : s
      ));
      setFeedback(tx({
        fr: `Statut mis a jour : ${STATUS_META[newStatus]?.fr || newStatus}`,
        en: `Status updated: ${STATUS_META[newStatus]?.en || newStatus}`,
        es: `Estado actualizado: ${STATUS_META[newStatus]?.es || newStatus}`,
      }));
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      console.error('[AdminSubmissions] updateStatus failed:', err?.message || err);
      setError(tx({
        fr: 'Erreur de mise a jour du statut',
        en: 'Error updating status',
        es: 'Error al actualizar estado',
      }));
      setTimeout(() => setError(''), 4000);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (sub) => {
    setBusyId(sub.documentId);
    try {
      await deleteArtistSubmission(sub.documentId);
      setSubmissions(prev => prev.filter(s => s.documentId !== sub.documentId));
      setConfirmDelete(null);
      if (detailsOpen?.documentId === sub.documentId) setDetailsOpen(null);
      setFeedback(tx({
        fr: 'Soumission supprimee',
        en: 'Submission deleted',
        es: 'Postulacion eliminada',
      }));
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      console.error('[AdminSubmissions] delete failed:', err?.message || err);
      setError(tx({
        fr: 'Erreur de suppression',
        en: 'Error deleting',
        es: 'Error al eliminar',
      }));
      setTimeout(() => setError(''), 4000);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-heading font-bold text-heading flex items-center gap-2">
          <UserPlus size={22} className="text-accent" />
          {tx({ fr: 'Soumissions Artistes', en: 'Artist Submissions', es: 'Postulaciones de Artistas' })}
        </h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
          {counts.all}
        </span>
        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="ml-auto p-2 rounded-lg bg-glass hover:bg-glass/70 text-grey-muted hover:text-heading transition-colors disabled:opacity-40"
          title={tx({ fr: 'Actualiser', en: 'Refresh', es: 'Actualizar' })}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {/* Feedback / Error toasts */}
      {feedback && (
        <div className="px-3 py-2 rounded-lg text-sm bg-green-500/10 text-green-400 border border-green-500/20">
          {feedback}
        </div>
      )}
      {error && (
        <div className="px-3 py-2 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Filtres : recherche + status pills */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx({
              fr: 'Rechercher par nom, email...',
              en: 'Search by name, email...',
              es: 'Buscar por nombre, email...',
            })}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-glass text-heading placeholder-grey-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...STATUS_OPTIONS].map((s) => {
            const isActive = statusFilter === s;
            const meta = s === 'all'
              ? { fr: 'Tout', en: 'All', es: 'Todo' }
              : STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
                }`}
              >
                {meta[lang] || meta.fr} <span className="opacity-60">({counts[s] || 0})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste */}
      {loading && submissions.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl bg-glass border border-white/5 p-12 text-center">
          <UserPlus size={36} className="mx-auto mb-3 text-grey-muted/40" />
          <p className="text-heading font-semibold mb-1">
            {tx({
              fr: 'Aucune soumission pour le moment',
              en: 'No submissions yet',
              es: 'Sin postulaciones aun',
            })}
          </p>
          <p className="text-sm text-grey-muted">
            {tx({
              fr: 'Les candidatures envoyees via /contact?tab=artiste apparaitront ici.',
              en: 'Applications sent via /contact?tab=artiste will appear here.',
              es: 'Las postulaciones enviadas via /contact?tab=artiste apareceran aqui.',
            })}
          </p>
        </div>
      ) : (
        <div className="rounded-xl card-bg border border-white/5 overflow-hidden">
          {/* Header table desktop */}
          <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_auto_auto] gap-3 px-4 py-3 bg-black/30 text-[11px] uppercase tracking-wider font-semibold text-grey-muted border-b border-white/5">
            <div>{tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' })}</div>
            <div>{tx({ fr: 'Contact', en: 'Contact', es: 'Contacto' })}</div>
            <div>{tx({ fr: 'Date', en: 'Date', es: 'Fecha' })}</div>
            <div>{tx({ fr: 'Statut', en: 'Status', es: 'Estado' })}</div>
            <div>{tx({ fr: 'Actions', en: 'Actions', es: 'Acciones' })}</div>
          </div>

          {/* Rows */}
          {submissions.map((sub) => {
            const isBusy = busyId === sub.documentId;
            const portfolioCount = Array.isArray(sub.portfolioUrls) ? sub.portfolioUrls.length : 0;
            return (
              <div
                key={sub.documentId}
                className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto_auto] gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {sub.photoProfilUrl ? (
                    <img
                      src={sub.photoProfilUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <UserPlus size={16} className="text-accent" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-heading truncate">
                      {sub.nomArtiste || sub.nomLegal}
                    </p>
                    {sub.nomArtiste && sub.nomLegal && sub.nomArtiste !== sub.nomLegal && (
                      <p className="text-[11px] text-grey-muted truncate">{sub.nomLegal}</p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-grey-muted truncate flex items-center gap-1">
                  <Mail size={11} className="flex-shrink-0" />
                  <a
                    href={`mailto:${sub.email}`}
                    className="hover:text-accent transition-colors truncate"
                  >
                    {sub.email}
                  </a>
                </div>

                <div className="text-xs text-grey-muted">
                  {formatDate(sub.createdAt)}
                </div>

                <div>
                  <StatusBadge status={sub.status} lang={lang} />
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 justify-end">
                  <button
                    onClick={() => setDetailsOpen(sub)}
                    disabled={isBusy}
                    className="p-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-40"
                    title={tx({ fr: 'Voir details', en: 'View details', es: 'Ver detalles' })}
                  >
                    <Eye size={13} />
                  </button>
                  {confirmDelete === sub.documentId ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(sub)}
                        disabled={isBusy}
                        className="px-2 py-1 rounded-lg bg-red-500/30 text-red-400 text-[10px] font-semibold hover:bg-red-500/40 transition-colors disabled:opacity-40"
                      >
                        {isBusy ? <Loader2 size={11} className="animate-spin" /> : tx({ fr: 'Confirmer', en: 'Confirm', es: 'Confirmar' })}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 rounded-lg bg-glass text-grey-muted text-[10px] hover:text-heading transition-colors"
                      >
                        {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(sub.documentId)}
                      disabled={isBusy}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-40"
                      title={tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details modal */}
      {detailsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setDetailsOpen(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl card-bg border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="sticky top-0 flex items-start gap-3 p-5 border-b border-white/5 bg-black/50 backdrop-blur z-10">
              {detailsOpen.photoProfilUrl ? (
                <img src={detailsOpen.photoProfilUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <UserPlus size={20} className="text-accent" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-heading font-bold text-heading truncate">
                  {detailsOpen.nomArtiste || detailsOpen.nomLegal}
                </h2>
                {detailsOpen.nomArtiste && detailsOpen.nomLegal && detailsOpen.nomArtiste !== detailsOpen.nomLegal && (
                  <p className="text-xs text-grey-muted">
                    {tx({ fr: 'Nom legal', en: 'Legal name', es: 'Nombre legal' })} : {detailsOpen.nomLegal}
                  </p>
                )}
                <div className="mt-2">
                  <StatusBadge status={detailsOpen.status} lang={lang} />
                </div>
              </div>
              <button
                onClick={() => setDetailsOpen(null)}
                className="p-1.5 rounded-lg bg-glass hover:bg-white/10 text-grey-muted hover:text-heading transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Contact */}
              <div className="space-y-2">
                <h3 className="text-[11px] uppercase tracking-wider font-semibold text-grey-muted">
                  {tx({ fr: 'Contact', en: 'Contact', es: 'Contacto' })}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <a href={`mailto:${detailsOpen.email}`} className="flex items-center gap-2 text-heading hover:text-accent transition-colors">
                    <Mail size={14} className="text-grey-muted" />
                    <span className="truncate">{detailsOpen.email}</span>
                  </a>
                  {detailsOpen.telephone && (
                    <a href={`tel:${detailsOpen.telephone}`} className="flex items-center gap-2 text-heading hover:text-accent transition-colors">
                      <Phone size={14} className="text-grey-muted" />
                      <span>{detailsOpen.telephone}</span>
                    </a>
                  )}
                </div>
                {detailsOpen.adresse && (
                  <div className="flex items-start gap-2 text-sm text-heading">
                    <MapPin size={14} className="text-grey-muted mt-0.5 flex-shrink-0" />
                    <span className="whitespace-pre-line">{detailsOpen.adresse}</span>
                  </div>
                )}
                {detailsOpen.tpsTvq && (
                  <div className="text-xs text-grey-muted">
                    TPS/TVQ : {detailsOpen.tpsTvq}
                  </div>
                )}
              </div>

              {/* Bio */}
              {detailsOpen.bio && (
                <div className="space-y-2">
                  <h3 className="text-[11px] uppercase tracking-wider font-semibold text-grey-muted">
                    {tx({ fr: 'Bio / Style', en: 'Bio / Style', es: 'Bio / Estilo' })}
                  </h3>
                  <p className="text-sm text-heading whitespace-pre-line">{detailsOpen.bio}</p>
                </div>
              )}

              {/* Portfolio */}
              {Array.isArray(detailsOpen.portfolioUrls) && detailsOpen.portfolioUrls.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[11px] uppercase tracking-wider font-semibold text-grey-muted">
                    {tx({ fr: 'Portfolio', en: 'Portfolio', es: 'Portafolio' })}
                    <span className="ml-2 normal-case opacity-60">({detailsOpen.portfolioUrls.length})</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {detailsOpen.portfolioUrls.map((url, i) => {
                      const isImage = /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url);
                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square rounded-lg overflow-hidden bg-glass border border-white/5 hover:border-accent/50 transition-colors"
                        >
                          {isImage ? (
                            <img
                              src={url}
                              alt={`Portfolio ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-grey-muted">
                              <ExternalLink size={24} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ExternalLink size={16} className="text-white" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes admin */}
              {detailsOpen.notes && (
                <div className="space-y-2">
                  <h3 className="text-[11px] uppercase tracking-wider font-semibold text-grey-muted">
                    {tx({ fr: 'Notes admin', en: 'Admin notes', es: 'Notas admin' })}
                  </h3>
                  <p className="text-sm text-heading whitespace-pre-line bg-glass rounded-lg p-3">
                    {detailsOpen.notes}
                  </p>
                </div>
              )}

              {/* Date / contrat */}
              <div className="text-xs text-grey-muted flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-white/5">
                <span>
                  {tx({ fr: 'Soumis', en: 'Submitted', es: 'Enviado' })} : {formatDate(detailsOpen.createdAt)}
                </span>
                {detailsOpen.contractAccepted && (
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    {tx({ fr: 'Contrat accepte', en: 'Contract accepted', es: 'Contrato aceptado' })}
                    {detailsOpen.contractVersion && ` (${detailsOpen.contractVersion})`}
                  </span>
                )}
              </div>

              {/* Actions changement de statut */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <h3 className="text-[11px] uppercase tracking-wider font-semibold text-grey-muted">
                  {tx({ fr: 'Changer le statut', en: 'Change status', es: 'Cambiar estado' })}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((s) => {
                    const meta = STATUS_META[s];
                    const isCurrent = detailsOpen.status === s;
                    const isBusyHere = busyId === detailsOpen.documentId;
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(detailsOpen, s)}
                        disabled={isCurrent || isBusyHere}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                          isCurrent
                            ? `${meta.color} ring-1 ring-inset ring-white/20 cursor-default`
                            : 'bg-glass text-grey-muted hover:text-heading hover:bg-white/10'
                        } disabled:opacity-60`}
                      >
                        {isBusyHere && !isCurrent ? <Loader2 size={11} className="animate-spin" /> : null}
                        {meta[lang] || meta.fr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSubmissions;
