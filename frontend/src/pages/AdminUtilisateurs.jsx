import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, Clock, Mail, Calendar,
  Loader2, Shield, Palette, ChevronDown, Check, X,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';
import { getUserRoles, setUserRole } from '../services/userRoleService';
import artistsData from '../data/artists';

const ARTIST_SLUGS = Object.keys(artistsData);

function AdminUtilisateurs() {
  const { tx } = useLang();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({}); // { email: { role, artistSlug, documentId } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          api.get('/clients/users'),
          getUserRoles().catch(() => ({ data: { data: [] } })),
        ]);
        setUsers(usersRes.data.data || []);

        const roleMap = {};
        (rolesRes.data.data || []).forEach(r => {
          roleMap[r.email.toLowerCase()] = r;
        });
        setRoles(roleMap);
        setError('');
      } catch {
        setError(tx({ fr: 'Impossible de charger les utilisateurs', en: 'Unable to load users', es: 'No se pueden cargar los usuarios' }));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const confirmed = users.filter(u => u.emailConfirmed);
  const artistCount = Object.values(roles).filter(r => r.role === 'artist').length;

  const latestSignup = users.length > 0
    ? users.reduce((latest, u) => new Date(u.createdAt) > new Date(latest.createdAt) ? u : latest)
    : null;

  const summaryCards = [
    { label: tx({ fr: 'Total inscrits', en: 'Total users', es: 'Total usuarios' }), value: users.length, icon: Users, accent: 'text-accent' },
    { label: tx({ fr: 'Email confirme', en: 'Confirmed', es: 'Confirmado' }), value: confirmed.length, icon: UserCheck, accent: 'text-green-400' },
    { label: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }), value: artistCount, icon: Palette, accent: 'text-purple-400' },
    { label: tx({ fr: 'Dernier inscrit', en: 'Latest signup', es: 'Ultimo registro' }), value: latestSignup ? formatDate(latestSignup.createdAt) : '-', icon: Calendar, accent: 'text-blue-400' },
  ];

  const handleSetArtist = async (user) => {
    const email = user.email.toLowerCase();
    if (!selectedSlug) return;

    setSaving(email);
    try {
      await setUserRole(email, 'artist', selectedSlug, user.id, user.fullName);
      setRoles(prev => ({
        ...prev,
        [email]: { role: 'artist', artistSlug: selectedSlug, email },
      }));
      setEditingUser(null);
      setSelectedSlug('');
      setToast(tx({ fr: `${user.fullName || email} est maintenant artiste (${selectedSlug})`, en: `${user.fullName || email} is now an artist (${selectedSlug})`, es: `${user.fullName || email} ahora es artista (${selectedSlug})` }));
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast(tx({ fr: 'Erreur lors de la mise a jour', en: 'Error updating role', es: 'Error al actualizar' }));
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveArtist = async (user) => {
    const email = user.email.toLowerCase();
    setSaving(email);
    try {
      await setUserRole(email, 'user', null, user.id, user.fullName);
      const newRoles = { ...roles };
      delete newRoles[email];
      setRoles(newRoles);
      setToast(tx({ fr: `Role artiste retire pour ${user.fullName || email}`, en: `Artist role removed for ${user.fullName || email}`, es: `Rol de artista eliminado para ${user.fullName || email}` }));
      setTimeout(() => setToast(''), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  };

  const getUserRole = (email) => {
    const e = email.toLowerCase();
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'massivemedias@gmail.com').split(',').map(x => x.trim().toLowerCase());
    if (adminEmails.includes(e)) return 'admin';
    return roles[e]?.role || 'user';
  };

  const getUserArtistSlug = (email) => roles[email.toLowerCase()]?.artistSlug || null;

  const getRoleBadge = (role, artistSlug) => {
    if (role === 'admin') return { label: 'Admin', className: 'bg-red-500/20 text-red-400' };
    if (role === 'artist') return { label: `Artiste (${artistSlug || '?'})`, className: 'bg-purple-500/20 text-purple-400' };
    return { label: tx({ fr: 'Utilisateur', en: 'User', es: 'Usuario' }), className: 'bg-grey-500/20 text-grey-400' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 z-50 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2 shadow-lg"
          >
            <Check size={16} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards */}
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

      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Users table */}
      {users.length > 0 && (
        <div className="rounded-xl bg-glass overflow-hidden card-border">
          <div className="hidden md:grid grid-cols-[1fr_1fr_160px_100px_140px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b card-border">
            <span>{tx({ fr: 'Utilisateur', en: 'User', es: 'Usuario' })}</span>
            <span>Email</span>
            <span>{tx({ fr: 'Role', en: 'Role', es: 'Rol' })}</span>
            <span>{tx({ fr: 'Inscrit le', en: 'Signed up', es: 'Registrado' })}</span>
            <span>Actions</span>
          </div>

          {users
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((user) => {
              const role = getUserRole(user.email);
              const artistSlug = getUserArtistSlug(user.email);
              const badge = getRoleBadge(role, artistSlug);
              const isEditing = editingUser === user.email;
              const isSaving = saving === user.email.toLowerCase();

              return (
                <div key={user.id} className="border-b last:border-b-0 card-border">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_160px_100px_140px] gap-2 md:gap-3 px-4 py-3 items-center hover:bg-accent/5 transition-colors">
                    {/* Nom + provider */}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        role === 'artist' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-accent/20 text-accent'
                      }`}>
                        {(user.fullName || user.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-heading font-semibold truncate">
                          {user.fullName || tx({ fr: 'Sans nom', en: 'No name', es: 'Sin nombre' })}
                        </p>
                        <p className="text-[10px] text-grey-muted flex items-center gap-1">
                          <Shield size={9} />
                          {user.provider}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail size={12} className="text-grey-muted flex-shrink-0" />
                      <span className="text-xs text-grey-muted truncate">{user.email}</span>
                    </div>

                    {/* Role badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold w-fit ${badge.className}`}>
                      {role === 'artist' && <Palette size={10} />}
                      {role === 'admin' && <Shield size={10} />}
                      {badge.label}
                    </span>

                    {/* Inscrit le */}
                    <span className="text-xs text-grey-muted">{formatDate(user.createdAt)}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {role === 'admin' ? (
                        <span className="text-[10px] text-grey-muted italic">Admin</span>
                      ) : role === 'artist' ? (
                        <button
                          onClick={() => handleRemoveArtist(user)}
                          disabled={isSaving}
                          className="text-[11px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          {tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
                        </button>
                      ) : (
                        <button
                          onClick={() => { setEditingUser(isEditing ? null : user.email); setSelectedSlug(''); }}
                          className="text-[11px] text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                        >
                          <Palette size={12} />
                          {tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' })}
                          <ChevronDown size={12} className={`transition-transform ${isEditing ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown pour choisir l'artiste */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-3 flex flex-wrap items-center gap-3 bg-accent/5 border-t border-accent/10">
                          <span className="text-xs text-grey-muted whitespace-nowrap">
                            {tx({ fr: 'Lier a l\'artiste:', en: 'Link to artist:', es: 'Vincular al artista:' })}
                          </span>
                          <select
                            value={selectedSlug}
                            onChange={(e) => setSelectedSlug(e.target.value)}
                            className="input-field text-sm py-1.5 px-3 max-w-xs"
                          >
                            <option value="">{tx({ fr: '-- Choisir --', en: '-- Choose --', es: '-- Elegir --' })}</option>
                            {ARTIST_SLUGS.map(slug => (
                              <option key={slug} value={slug}>
                                {artistsData[slug]?.name || slug}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSetArtist(user)}
                            disabled={!selectedSlug || isSaving}
                            className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            <span className="ml-1">{tx({ fr: 'Confirmer', en: 'Confirm', es: 'Confirmar' })}</span>
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-grey-muted hover:text-heading text-xs transition-colors"
                          >
                            {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>
      )}

      {users.length === 0 && !error && (
        <div className="text-center py-20 text-grey-muted">
          <Users size={40} className="mx-auto mb-4 opacity-30" />
          <p>{tx({ fr: 'Aucun utilisateur inscrit', en: 'No registered users', es: 'Sin usuarios registrados' })}</p>
        </div>
      )}
    </div>
  );
}

export default AdminUtilisateurs;
