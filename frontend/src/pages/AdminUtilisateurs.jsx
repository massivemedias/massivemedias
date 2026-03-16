import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, Clock, Mail, Calendar, Search,
  Loader2, Shield, Palette, ChevronDown, ChevronUp, Check, X,
  DollarSign, ShoppingBag, Phone, Building2, MapPin, Trash2,
  Eye, MousePointerClick, ArrowUpRight, ExternalLink, BarChart3,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';
import { getClients } from '../services/adminService';
import { getUserRoles, setUserRole } from '../services/userRoleService';
import artistsData from '../data/artists';

const ARTIST_SLUGS = Object.keys(artistsData);
const GA_PROPERTY_ID = '525792501';

function AdminUtilisateurs() {
  const { tx } = useLang();

  // Users from Supabase
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});

  // Clients from orders (buyers)
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'buyers' | 'visitors' | 'artists'
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, rolesRes, clientsRes] = await Promise.all([
          api.get('/clients/users'),
          getUserRoles().catch(() => ({ data: { data: [] } })),
          getClients({ pageSize: 999 }).catch(() => ({ data: { data: [] } })),
        ]);
        setUsers(usersRes.data.data || []);

        const roleMap = {};
        (rolesRes.data.data || []).forEach(r => {
          roleMap[r.email.toLowerCase()] = r;
        });
        setRoles(roleMap);
        setClients(clientsRes.data?.data || []);
        setError('');
      } catch {
        setError(tx({ fr: 'Impossible de charger les donnees', en: 'Unable to load data', es: 'No se pueden cargar los datos' }));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatMoney = (v) => `${(parseFloat(v) || 0).toFixed(2)}$`;

  // Build buyer map from clients data (email -> client info)
  const buyerMap = {};
  clients.forEach(c => {
    if (c.email) buyerMap[c.email.toLowerCase()] = c;
  });

  // Merge users with buyer data
  const mergedUsers = users.map(u => {
    const buyer = buyerMap[u.email?.toLowerCase()];
    return {
      ...u,
      isBuyer: !!buyer,
      totalSpent: buyer?.totalSpent || 0,
      orderCount: buyer?.orderCount || 0,
      lastOrderDate: buyer?.lastOrderDate || null,
      company: buyer?.company || null,
      phone: buyer?.lastCustomerPhone || buyer?.phone || null,
      lastShippingAddress: buyer?.lastShippingAddress || u.profileAddress || null,
    };
  });

  // Also add clients who are NOT registered users (guest checkout)
  const registeredEmails = new Set(users.map(u => u.email?.toLowerCase()));
  const guestBuyers = clients
    .filter(c => c.email && !registeredEmails.has(c.email.toLowerCase()))
    .map(c => ({
      id: `guest-${c.documentId}`,
      email: c.email,
      fullName: c.name,
      emailConfirmed: false,
      provider: 'guest',
      createdAt: c.createdAt,
      isBuyer: true,
      isGuest: true,
      totalSpent: c.totalSpent || 0,
      orderCount: c.orderCount || 0,
      lastOrderDate: c.lastOrderDate || null,
      company: c.company || null,
      phone: c.lastCustomerPhone || c.phone || null,
      lastShippingAddress: c.lastShippingAddress || null,
    }));

  const allUsers = [...mergedUsers, ...guestBuyers];

  // Filter
  const getUserRole = (email) => {
    const e = (email || '').toLowerCase();
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'massivemedias@gmail.com').split(',').map(x => x.trim().toLowerCase());
    if (adminEmails.includes(e)) return 'admin';
    return roles[e]?.role || 'user';
  };

  const getUserArtistSlug = (email) => roles[(email || '').toLowerCase()]?.artistSlug || null;

  const filtered = allUsers.filter(u => {
    // Search filter
    const q = search.toLowerCase();
    if (q) {
      const match = (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.company || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    // Tab filter
    if (tab === 'buyers') return u.isBuyer;
    if (tab === 'visitors') return !u.isBuyer && getUserRole(u.email) === 'user';
    if (tab === 'artists') return getUserRole(u.email) === 'artist';
    return true;
  }).sort((a, b) => {
    // Buyers first, then by date
    if (a.isBuyer !== b.isBuyer) return a.isBuyer ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Summary stats
  const totalUsers = allUsers.length;
  const totalBuyers = allUsers.filter(u => u.isBuyer).length;
  const totalVisitors = allUsers.filter(u => !u.isBuyer && getUserRole(u.email) === 'user').length;
  const artistCount = Object.values(roles).filter(r => r.role === 'artist').length;
  const totalRevenue = allUsers.reduce((s, u) => s + (parseFloat(u.totalSpent) || 0), 0);

  const summaryCards = [
    { label: tx({ fr: 'Total utilisateurs', en: 'Total users', es: 'Total usuarios' }), value: totalUsers, icon: Users, accent: 'text-accent' },
    { label: tx({ fr: 'Acheteurs', en: 'Buyers', es: 'Compradores' }), value: totalBuyers, icon: ShoppingBag, accent: 'text-green-400' },
    { label: tx({ fr: 'Visiteurs inscrits', en: 'Registered visitors', es: 'Visitantes registrados' }), value: totalVisitors, icon: Eye, accent: 'text-blue-400' },
    { label: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }), value: artistCount, icon: Palette, accent: 'text-purple-400' },
  ];

  const tabs = [
    { key: 'all', label: tx({ fr: 'Tous', en: 'All', es: 'Todos' }), count: totalUsers },
    { key: 'buyers', label: tx({ fr: 'Acheteurs', en: 'Buyers', es: 'Compradores' }), count: totalBuyers },
    { key: 'visitors', label: tx({ fr: 'Visiteurs', en: 'Visitors', es: 'Visitantes' }), count: totalVisitors },
    { key: 'artists', label: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }), count: artistCount },
  ];

  const handleSetArtist = async (user) => {
    const email = user.email.toLowerCase();
    if (!selectedSlug) return;
    setSaving(email);
    try {
      await setUserRole(email, 'artist', selectedSlug, user.id, user.fullName);
      setRoles(prev => ({ ...prev, [email]: { role: 'artist', artistSlug: selectedSlug, email } }));
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
    } catch {} finally {
      setSaving(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.isGuest) return;
    setSaving(user.email?.toLowerCase());
    try {
      await api.delete(`/clients/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setDeleteConfirm(null);
      setExpandedId(null);
      setToast(tx({ fr: `${user.fullName || user.email} supprime`, en: `${user.fullName || user.email} deleted`, es: `${user.fullName || user.email} eliminado` }));
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast(tx({ fr: 'Erreur lors de la suppression', en: 'Error deleting user', es: 'Error al eliminar' }));
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(null);
    }
  };

  const getRoleBadge = (role, artistSlug) => {
    if (role === 'admin') return { label: 'Admin', className: 'bg-red-500/20 text-red-400' };
    if (role === 'artist') return { label: `Artiste (${artistSlug || '?'})`, className: 'bg-purple-500/20 text-purple-400' };
    return null;
  };

  const getBuyerBadge = (user) => {
    if (user.isBuyer) return { label: tx({ fr: 'Acheteur', en: 'Buyer', es: 'Comprador' }), className: 'bg-green-500/20 text-green-400' };
    if (user.isGuest) return { label: 'Guest', className: 'bg-yellow-500/20 text-yellow-400' };
    return { label: tx({ fr: 'Visiteur', en: 'Visitor', es: 'Visitante' }), className: 'bg-gray-500/20 text-gray-400' };
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-accent" /></div>;
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

      {/* Search + Tabs */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={tx({ fr: 'Rechercher par nom, email, entreprise...', en: 'Search by name, email, company...', es: 'Buscar por nombre, email, empresa...' })}
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === t.key
                ? 'bg-accent text-white'
                : 'bg-glass text-grey-muted hover:text-heading'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Users list */}
      {filtered.length > 0 && (
        <div className="rounded-xl bg-glass overflow-hidden card-border">
          <div className="hidden md:grid grid-cols-[1fr_1fr_100px_100px_80px_100px_100px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b card-border">
            <span>{tx({ fr: 'Utilisateur', en: 'User', es: 'Usuario' })}</span>
            <span>Email</span>
            <span>{tx({ fr: 'Type', en: 'Type', es: 'Tipo' })}</span>
            <span>{tx({ fr: 'Role', en: 'Role', es: 'Rol' })}</span>
            <span>{tx({ fr: 'Cmd', en: 'Orders', es: 'Ped' })}</span>
            <span>{tx({ fr: 'Depense', en: 'Spent', es: 'Gastado' })}</span>
            <span>Actions</span>
          </div>

          {filtered.map((user) => {
            const role = getUserRole(user.email);
            const artistSlug = getUserArtistSlug(user.email);
            const roleBadge = getRoleBadge(role, artistSlug);
            const buyerBadge = getBuyerBadge(user);
            const isEditing = editingUser === user.email;
            const isSaving = saving === (user.email || '').toLowerCase();
            const isExpanded = expandedId === user.id;

            return (
              <div key={user.id} className="border-b last:border-b-0 card-border">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : user.id)}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_100px_80px_100px_100px] gap-2 md:gap-3 px-4 py-3 items-center cursor-pointer hover:bg-accent/5 transition-colors"
                >
                  {/* Name + provider */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      role === 'admin' ? 'bg-red-500/20 text-red-400' :
                      role === 'artist' ? 'bg-purple-500/20 text-purple-400' :
                      user.isBuyer ? 'bg-green-500/20 text-green-400' :
                      'bg-accent/20 text-accent'
                    }`}>
                      {(user.fullName || user.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] text-heading font-semibold truncate">
                        {user.fullName || tx({ fr: 'Sans nom', en: 'No name', es: 'Sin nombre' })}
                      </p>
                      <p className="text-[11px] text-grey-muted flex items-center gap-1">
                        {user.isGuest ? (
                          <><ShoppingBag size={9} /> Guest checkout</>
                        ) : (
                          <><Shield size={9} /> {user.provider}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail size={12} className="text-grey-muted flex-shrink-0" />
                    <span className="text-[13.5px] text-grey-muted truncate">{user.email}</span>
                  </div>

                  {/* Buyer/Visitor badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold w-fit ${buyerBadge.className}`}>
                    {user.isBuyer ? <ShoppingBag size={10} /> : <Eye size={10} />}
                    {buyerBadge.label}
                  </span>

                  {/* Role badge */}
                  {roleBadge ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold w-fit ${roleBadge.className}`}>
                      {role === 'artist' && <Palette size={10} />}
                      {role === 'admin' && <Shield size={10} />}
                      {roleBadge.label}
                    </span>
                  ) : (
                    <span className="text-[11px] text-grey-muted">-</span>
                  )}

                  {/* Orders */}
                  <span className={`text-[15px] font-semibold ${user.orderCount > 0 ? 'text-heading' : 'text-grey-muted'}`}>
                    {user.orderCount || 0}
                  </span>

                  {/* Total spent */}
                  <span className={`text-[15px] font-bold ${user.totalSpent > 0 ? 'text-green-400' : 'text-grey-muted'}`}>
                    {user.totalSpent > 0 ? formatMoney(user.totalSpent) : '-'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {role === 'admin' ? (
                      <span className="text-[11.5px] text-grey-muted italic">Admin</span>
                    ) : user.isGuest ? (
                      <span className="text-[11.5px] text-grey-muted italic">Guest</span>
                    ) : role === 'artist' ? (
                      <>
                        <button
                          onClick={() => { setEditingUser(isEditing ? null : user.email); setSelectedSlug(artistSlug || ''); }}
                          className="text-[12.5px] text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                        >
                          <Palette size={12} />
                          <ChevronDown size={12} className={`transition-transform ${isEditing ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleRemoveArtist(user)}
                          disabled={isSaving}
                          className="text-[12.5px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          {tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setEditingUser(isEditing ? null : user.email); setSelectedSlug(''); }}
                        className="text-[12.5px] text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                      >
                        <Palette size={12} />
                        {tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' })}
                        <ChevronDown size={12} className={`transition-transform ${isEditing ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded detail - buyer info */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t card-border bg-glass/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          {/* Contact */}
                          <div className="rounded-lg bg-glass p-3">
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">
                              {tx({ fr: 'Coordonnees', en: 'Contact', es: 'Contacto' })}
                            </h4>
                            <div className="space-y-2 text-[15px]">
                              <p className="text-heading font-medium">{user.fullName || '-'}</p>
                              <p className="text-grey-muted flex items-center gap-2"><Mail size={13} /> {user.email}</p>
                              {user.phone && <p className="text-grey-muted flex items-center gap-2"><Phone size={13} /> {user.phone}</p>}
                              {user.company && <p className="text-grey-muted flex items-center gap-2"><Building2 size={13} /> {user.company}</p>}
                            </div>
                          </div>

                          {/* Address */}
                          <div className="rounded-lg bg-glass p-3">
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <MapPin size={12} />
                              {user.isBuyer && user.lastShippingAddress
                                ? tx({ fr: 'Derniere adresse', en: 'Last address', es: 'Ultima direccion' })
                                : tx({ fr: 'Adresse', en: 'Address', es: 'Direccion' })}
                            </h4>
                            {user.lastShippingAddress ? (
                              <div className="text-[15px] text-heading space-y-0.5">
                                <p>{user.lastShippingAddress.address}</p>
                                <p>{user.lastShippingAddress.city}, {user.lastShippingAddress.province} {user.lastShippingAddress.postalCode}</p>
                              </div>
                            ) : (
                              <p className="text-[15px] text-grey-muted">{tx({ fr: 'Aucune adresse', en: 'No address', es: 'Sin direccion' })}</p>
                            )}
                          </div>

                          {/* Summary */}
                          <div className="rounded-lg bg-glass p-3">
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">
                              {tx({ fr: 'Resume', en: 'Summary', es: 'Resumen' })}
                            </h4>
                            <div className="space-y-1.5 text-[15px]">
                              <div className="flex justify-between">
                                <span className="text-grey-muted">{tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' })}</span>
                                <span className="text-heading font-semibold">{user.orderCount || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-grey-muted">{tx({ fr: 'Total depense', en: 'Total spent', es: 'Total gastado' })}</span>
                                <span className="text-heading font-bold">{formatMoney(user.totalSpent)}</span>
                              </div>
                              {user.lastOrderDate && (
                                <div className="flex justify-between">
                                  <span className="text-grey-muted">{tx({ fr: 'Derniere cmd', en: 'Last order', es: 'Ultimo pedido' })}</span>
                                  <span className="text-heading">{formatDate(user.lastOrderDate)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-grey-muted">{tx({ fr: 'Inscrit le', en: 'Signed up', es: 'Registrado' })}</span>
                                <span className="text-heading">{formatDate(user.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Delete user */}
                        {role !== 'admin' && !user.isGuest && (
                          <div className="mt-4 pt-3 border-t border-purple-main/10">
                            {deleteConfirm === user.id ? (
                              <div className="flex items-center gap-3">
                                <span className="text-red-400 text-[13.5px]">
                                  {tx({ fr: 'Confirmer la suppression de cet utilisateur?', en: 'Confirm deleting this user?', es: 'Confirmar eliminar este usuario?' })}
                                </span>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={isSaving}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                  {tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="text-grey-muted text-xs hover:text-heading transition-colors"
                                >
                                  {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(user.id)}
                                className="text-red-400/50 hover:text-red-400 text-xs transition-colors flex items-center gap-1.5"
                              >
                                <Trash2 size={12} />
                                {tx({ fr: 'Supprimer cet utilisateur', en: 'Delete this user', es: 'Eliminar este usuario' })}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Artist assignment dropdown */}
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
                          {role === 'artist'
                            ? tx({ fr: 'Changer le profil artiste:', en: 'Change artist profile:', es: 'Cambiar perfil artista:' })
                            : tx({ fr: 'Lier a l\'artiste:', en: 'Link to artist:', es: 'Vincular al artista:' })}
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

      {filtered.length === 0 && !error && (
        <div className="text-center py-20 text-grey-muted">
          <Users size={40} className="mx-auto mb-4 opacity-30" />
          <p>{tx({ fr: 'Aucun utilisateur trouve', en: 'No users found', es: 'Sin usuarios encontrados' })}</p>
        </div>
      )}

      {/* Google Analytics - Navigation habits */}
      <div className="rounded-xl bg-glass p-5 card-border">
        <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-400" />
          {tx({ fr: 'Habitudes de navigation', en: 'Navigation habits', es: 'Habitos de navegacion' })}
        </h3>
        <p className="text-grey-muted text-sm mb-4">
          {tx({
            fr: 'Consulte les habitudes de navigation des utilisateurs, pages populaires, parcours et conversions sur Google Analytics.',
            en: 'View user navigation habits, popular pages, journeys and conversions on Google Analytics.',
            es: 'Consulta los habitos de navegacion, paginas populares, recorridos y conversiones en Google Analytics.',
          })}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <a
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID}/reports/explorer?params=_u..nav%3Dmaui&r=lifecycle-engagement-overview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition-colors"
          >
            <MousePointerClick size={16} />
            {tx({ fr: 'Engagement', en: 'Engagement', es: 'Engagement' })}
            <ExternalLink size={12} className="ml-auto" />
          </a>
          <a
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID}/reports/explorer?params=_u..nav%3Dmaui&r=lifecycle-acquisition-overview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-colors"
          >
            <ArrowUpRight size={16} />
            {tx({ fr: 'Acquisition', en: 'Acquisition', es: 'Adquisicion' })}
            <ExternalLink size={12} className="ml-auto" />
          </a>
          <a
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID}/reports/explorer?params=_u..nav%3Dmaui&r=lifecycle-retention-overview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-purple-500/10 text-purple-400 text-sm font-semibold hover:bg-purple-500/20 transition-colors"
          >
            <Users size={16} />
            {tx({ fr: 'Retention', en: 'Retention', es: 'Retencion' })}
            <ExternalLink size={12} className="ml-auto" />
          </a>
          <a
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID}/reports/explorer?params=_u..nav%3Dmaui&r=all-pages-and-screens`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/20 transition-colors"
          >
            <Eye size={16} />
            {tx({ fr: 'Pages vues', en: 'Page views', es: 'Paginas vistas' })}
            <ExternalLink size={12} className="ml-auto" />
          </a>
          <a
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID}/reports/explorer?params=_u..nav%3Dmaui&r=user-demographics-overview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-pink-500/10 text-pink-400 text-sm font-semibold hover:bg-pink-500/20 transition-colors"
          >
            <Users size={16} />
            {tx({ fr: 'Demographiques', en: 'Demographics', es: 'Demograficos' })}
            <ExternalLink size={12} className="ml-auto" />
          </a>
          <a
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID}/reports/explorer?params=_u..nav%3Dmaui&r=lifecycle-monetization-ecommerce-purchases`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors"
          >
            <DollarSign size={16} />
            {tx({ fr: 'E-commerce', en: 'E-commerce', es: 'E-commerce' })}
            <ExternalLink size={12} className="ml-auto" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminUtilisateurs;
