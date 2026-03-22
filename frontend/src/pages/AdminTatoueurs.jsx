import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, X, Eye, ExternalLink, Instagram, MapPin, PenTool, BarChart3 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { mediaUrl } from '../utils/cms';
import api from '../services/api';

export default function AdminTatoueurs() {
  const { lang, tx } = useLang();
  const [tatoueurs, setTatoueurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, active
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchAll() {
      try {
        const { data } = await api.get('/tatoueurs', {
          params: {
            populate: '*',
            'sort[0]': 'createdAt:desc',
            'pagination[pageSize]': 100,
            status: 'draft',
          },
        });
        // Also fetch published
        const { data: published } = await api.get('/tatoueurs', {
          params: {
            populate: '*',
            'sort[0]': 'createdAt:desc',
            'pagination[pageSize]': 100,
          },
        });

        // Merge (deduplicate by documentId)
        const all = [...(data.data || []), ...(published.data || [])];
        const unique = Array.from(new Map(all.map(t => [t.documentId, t])).values());
        setTatoueurs(unique);
      } catch (err) {
        console.warn('[AdminTatoueurs] Erreur:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const handleApprove = async (tatoueur) => {
    try {
      await api.put(`/tatoueurs/${tatoueur.documentId}`, {
        data: { approved: true, active: true },
      });
      setTatoueurs(prev => prev.map(t =>
        t.documentId === tatoueur.documentId ? { ...t, approved: true, active: true } : t
      ));
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleReject = async (tatoueur) => {
    try {
      await api.put(`/tatoueurs/${tatoueur.documentId}`, {
        data: { approved: false, active: false },
      });
      setTatoueurs(prev => prev.map(t =>
        t.documentId === tatoueur.documentId ? { ...t, approved: false, active: false } : t
      ));
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const filtered = tatoueurs.filter(t => {
    if (filter === 'pending' && t.approved) return false;
    if (filter === 'active' && !t.active) return false;
    if (search) {
      const s = search.toLowerCase();
      return (t.name || '').toLowerCase().includes(s) || (t.email || '').toLowerCase().includes(s) || (t.slug || '').toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) {
    return <div className="text-center py-12 text-grey-muted animate-pulse">...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-heading flex items-center gap-2">
          <PenTool size={24} className="text-accent" />
          {tx({ fr: 'Gestion des tatoueurs', en: 'Tattoo Artist Management' })}
        </h1>
        <span className="text-sm text-grey-muted">{tatoueurs.length} {tx({ fr: 'total', en: 'total' })}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx({ fr: 'Rechercher...', en: 'Search...' })}
            className="w-full bg-bg-elevated border border-white/10 rounded-lg pl-9 pr-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'active'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                filter === f ? 'bg-accent text-black font-bold' : 'bg-bg-card text-grey-light border border-white/5'
              }`}
            >
              {f === 'all' ? tx({ fr: 'Tous', en: 'All' }) : f === 'pending' ? tx({ fr: 'En attente', en: 'Pending' }) : tx({ fr: 'Actifs', en: 'Active' })}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-bg-card rounded-xl border border-white/5">
          <PenTool className="w-12 h-12 text-grey-muted/30 mx-auto mb-3" />
          <p className="text-grey-muted">{tx({ fr: 'Aucun tatoueur.', en: 'No tattoo artists.' })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tatoueur) => {
            const avatarUrl = tatoueur.avatar ? mediaUrl(tatoueur.avatar) : null;
            const flashCount = (tatoueur.flashs || []).length;

            return (
              <motion.div
                key={tatoueur.documentId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-bg-card rounded-xl border border-white/5 p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={tatoueur.name} className="w-14 h-14 rounded-full object-cover border-2 border-accent/20 flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center flex-shrink-0">
                      <PenTool size={20} className="text-grey-muted/30" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Name + status */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-heading">{tatoueur.name}</h3>
                      <span className="text-xs text-grey-muted">@{tatoueur.slug}</span>
                      {tatoueur.approved ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-bold">
                          {tx({ fr: 'Approuve', en: 'Approved' })}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold">
                          {tx({ fr: 'En attente', en: 'Pending' })}
                        </span>
                      )}
                      {tatoueur.active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 font-bold">
                          {tx({ fr: 'Actif', en: 'Active' })}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="text-xs text-grey-muted space-y-0.5">
                      {tatoueur.email && <p>{tatoueur.email}</p>}
                      <div className="flex items-center gap-3">
                        {tatoueur.studio && <span>{tatoueur.studio}</span>}
                        {tatoueur.city && <span className="flex items-center gap-0.5"><MapPin size={10} />{tatoueur.city}</span>}
                        {tatoueur.instagramHandle && (
                          <a href={`https://instagram.com/${tatoueur.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-accent">
                            <Instagram size={10} />@{tatoueur.instagramHandle}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span>{flashCount} flashs</span>
                        <span>{tatoueur.pageViews || 0} vues</span>
                        {tatoueur.styles?.length > 0 && (
                          <span>{tatoueur.styles.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/tatoueurs/${tatoueur.slug}`}
                      target="_blank"
                      className="p-2 rounded-lg bg-bg-elevated text-grey-muted hover:text-accent transition-colors"
                      title={tx({ fr: 'Voir la page', en: 'View page' })}
                    >
                      <Eye size={16} />
                    </a>
                    {!tatoueur.approved && (
                      <>
                        <button
                          onClick={() => handleApprove(tatoueur)}
                          className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                          title={tx({ fr: 'Approuver', en: 'Approve' })}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(tatoueur)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title={tx({ fr: 'Refuser', en: 'Reject' })}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
