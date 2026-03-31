import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, Clock, Mail, Calendar, Search,
  Loader2, Shield, Palette, ChevronDown, ChevronUp, Check, X,
  DollarSign, ShoppingBag, Phone, Building2, MapPin, Trash2,
  Eye, MousePointerClick, ArrowUpRight, ExternalLink, BarChart3, Gift, FileCheck, Receipt, PenTool,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';
import { getClients, getArtistSubmissions } from '../services/adminService';
import { getUserRoles, setUserRole } from '../services/userRoleService';
import artistsData from '../data/artists';
import tatoueursData from '../data/tatoueurs';

const ARTIST_SLUGS = Object.keys(artistsData);
const TATOUEUR_SLUGS = Object.keys(tatoueursData);
const GA_PROPERTY_ID = '525792501';

function AdminUtilisateurs() {
  const { tx } = useLang();

  // Users from Supabase
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});

  // Clients from orders (buyers)
  const [clients, setClients] = useState([]);

  // Artist submissions (candidatures)
  const [artistSubs, setArtistSubs] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'buyers' | 'visitors' | 'artists'
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, rolesRes, clientsRes, subsRes] = await Promise.all([
          api.get('/clients/users'),
          getUserRoles().catch(() => ({ data: { data: [] } })),
          getClients({ pageSize: 999 }).catch(() => ({ data: { data: [] } })),
          getArtistSubmissions({ pageSize: 999 }).catch(() => ({ data: { data: [] } })),
        ]);
        setUsers(usersRes.data?.data || usersRes.data || []);

        const roleMap = {};
        (rolesRes.data?.data || rolesRes.data || []).forEach(r => {
          if (r?.email) roleMap[r.email.toLowerCase()] = r;
        });
        setRoles(roleMap);
        setClients(clientsRes.data?.data || clientsRes.data || []);

        // Build artist submissions map by email
        const subsMap = {};
        (subsRes.data?.data || subsRes.data || []).forEach(s => {
          if (s?.email) subsMap[s.email.toLowerCase()] = s;
        });
        setArtistSubs(subsMap);
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
    const buyer = buyerMap[(u.email || '').toLowerCase()];
    return {
      ...u,
      isBuyer: !!buyer,
      totalSpent: buyer?.totalSpent || 0,
      orderCount: buyer?.orderCount || 0,
      lastOrderDate: buyer?.lastOrderDate || null,
      company: buyer?.company || null,
      phone: buyer?.lastCustomerPhone || buyer?.phone || null,
      lastShippingAddress: buyer?.lastShippingAddress || u.profileAddress || null,
      referredBy: u.referredBy || null,
      contractSigned: u.contractSigned || false,
      contractSignedAt: u.contractSignedAt || null,
      contractVersion: u.contractVersion || null,
      nomArtiste: u.nomArtiste || null,
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

  const getUserArtistSlug = (email) => {
    const r = roles[(email || '').toLowerCase()];
    return r?.artistSlug || r?.tatoueurSlug || null;
  };

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
    if (tab === 'tatoueurs') return getUserRole(u.email) === 'tatoueur';
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
  const tatoueurCount = Object.values(roles).filter(r => r.role === 'tatoueur').length;
  const totalRevenue = allUsers.reduce((s, u) => s + (parseFloat(u.totalSpent) || 0), 0);

  const summaryCards = [
    { label: tx({ fr: 'Inscrits', en: 'Registered', es: 'Registrados' }), value: totalUsers, icon: Users, accent: 'text-accent' },
    { label: tx({ fr: 'Acheteurs', en: 'Buyers', es: 'Compradores' }), value: totalBuyers, icon: ShoppingBag, accent: 'text-green-400' },
    { label: tx({ fr: 'Sans achat', en: 'No purchase', es: 'Sin compra' }), value: totalVisitors, icon: Eye, accent: 'text-blue-400' },
    { label: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }), value: artistCount, icon: Palette, accent: 'text-red-400' },
    { label: tx({ fr: 'Tatoueurs', en: 'Tattoo Artists', es: 'Tatuadores' }), value: tatoueurCount, icon: PenTool, accent: 'text-blue-400' },
  ];

  const tabs = [
    { key: 'all', label: tx({ fr: 'Tous', en: 'All', es: 'Todos' }), count: totalUsers },
    { key: 'buyers', label: tx({ fr: 'Acheteurs', en: 'Buyers', es: 'Compradores' }), count: totalBuyers },
    { key: 'visitors', label: tx({ fr: 'Sans achat', en: 'No purchase', es: 'Sin compra' }), count: totalVisitors },
    { key: 'artists', label: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }), count: artistCount },
    { key: 'tatoueurs', label: tx({ fr: 'Tatoueurs', en: 'Tattoo Artists', es: 'Tatuadores' }), count: tatoueurCount },
  ];

  const handleSetArtist = async (user) => {
    const email = (user.email || '').toLowerCase();

    // Downgrade to normal user
    if (selectedSlug === '__downgrade__') {
      setSaving(email);
      try {
        await setUserRole(email, 'user', null, user.id, user.fullName);
        const newRoles = { ...roles };
        delete newRoles[email];
        setRoles(newRoles);
        setEditingUser(null);
        setSelectedSlug('');
        setToast(tx({ fr: `${user.fullName || email} est maintenant un utilisateur normal`, en: `${user.fullName || email} is now a normal user`, es: `${user.fullName || email} ahora es un usuario normal` }));
        setTimeout(() => setToast(''), 3000);
      } catch {
        setToast(tx({ fr: 'Erreur lors de la mise a jour', en: 'Error updating role', es: 'Error al actualizar' }));
        setTimeout(() => setToast(''), 3000);
      } finally {
        setSaving(null);
      }
      return;
    }

    let role = 'artist';
    let slug = selectedSlug;

    if (selectedSlug === '__new__') {
      slug = customSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    } else if (selectedSlug.startsWith('tatoueur:')) {
      role = 'tatoueur';
      slug = selectedSlug.replace('tatoueur:', '');
    } else if (selectedSlug.startsWith('artist:')) {
      role = 'artist';
      slug = selectedSlug.replace('artist:', '');
    }

    if (!slug) return;
    setSaving(email);
    try {
      const slugField = role === 'tatoueur' ? slug : slug;
      await setUserRole(email, role, slugField, user.id, user.fullName);
      setRoles(prev => ({
        ...prev,
        [email]: {
          role,
          artistSlug: role === 'artist' ? slug : null,
          tatoueurSlug: role === 'tatoueur' ? slug : null,
          email,
        },
      }));
      setEditingUser(null);
      setSelectedSlug('');
      setCustomSlug('');
      const roleLabel = role === 'tatoueur' ? tx({ fr: 'tatoueur', en: 'tattoo artist', es: 'tatuador' }) : tx({ fr: 'artiste', en: 'artist', es: 'artista' });
      setToast(tx({ fr: `${user.fullName || email} est maintenant ${roleLabel} (${slug})`, en: `${user.fullName || email} is now ${roleLabel} (${slug})`, es: `${user.fullName || email} ahora es ${roleLabel} (${slug})` }));
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast(tx({ fr: 'Erreur lors de la mise a jour', en: 'Error updating role', es: 'Error al actualizar' }));
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveArtist = async (user) => {
    const email = (user.email || '').toLowerCase();
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
    if (role === 'admin') return { label: 'Admin', slug: null, className: 'bg-yellow-500/20 text-yellow-400' };
    if (role === 'artist') return { label: tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' }), slug: artistSlug || '?', className: 'bg-red-500/20 text-red-400' };
    if (role === 'tatoueur') return { label: tx({ fr: 'Tatoueur', en: 'Tattoo Artist', es: 'Tatuador' }), slug: artistSlug || '?', className: 'bg-blue-500/20 text-blue-400' };
    return null;
  };

  const getBuyerBadge = (user) => {
    if (user.isBuyer) return { label: tx({ fr: 'Acheteur', en: 'Buyer', es: 'Comprador' }), className: 'bg-green-500/20 text-green-400' };
    if (user.isGuest) return { label: tx({ fr: 'Invite', en: 'Guest', es: 'Invitado' }), className: 'bg-yellow-500/20 text-yellow-400' };
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
            className="fixed top-4 right-4 z-50 p-4 rounded-lg bg-green-500/10 bg-green-500/5 text-green-400 text-sm flex items-center gap-2 shadow-lg"
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
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 card-bg shadow-lg shadow-black/20">
              <div className="flex items-center gap-2 mb-2"><Icon size={16} className={card.accent} /><span className="text-grey-muted text-xs">{card.label}</span></div>
              <span className="text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 shadow-sm bg-red-500/10">
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-grey-muted">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-400"></span> Admin</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-400"></span> {tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' })}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-400"></span> {tx({ fr: 'Tatoueur', en: 'Tattoo Artist', es: 'Tatuador' })}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-400"></span> {tx({ fr: 'Acheteur', en: 'Buyer', es: 'Comprador' })}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500/20 border border-purple-400"></span> {tx({ fr: 'Utilisateur', en: 'User', es: 'Usuario' })}</span>
      </div>

      {/* Users list */}
      {filtered.length > 0 && (
        <div className="rounded-xl card-bg shadow-lg shadow-black/20 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_1.2fr_100px_70px_100px_32px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider shadow-[0_1px_0_rgba(255,255,255,0.04)]">
            <span>{tx({ fr: 'Utilisateur', en: 'User', es: 'Usuario' })}</span>
            <span>Email</span>
            <span>{tx({ fr: 'Inscrit', en: 'Joined', es: 'Registro' })}</span>
            <span className="text-center">{tx({ fr: 'Cmd', en: 'Orders', es: 'Ped' })}</span>
            <span className="text-right">{tx({ fr: 'Depense', en: 'Spent', es: 'Gastado' })}</span>
            <span></span>
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
              <div key={user.id} className="">
                {/* Desktop row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : user.id)}
                  className={`hidden md:grid grid-cols-[1fr_1.2fr_100px_70px_100px_32px] gap-3 px-4 py-3 items-center cursor-pointer hover:bg-accent/5 transition-colors ${
                    role === 'admin' ? 'border-l-2 border-l-red-400' :
                    role === 'artist' ? 'border-l-2 border-l-purple-400' :
                    user.isBuyer ? 'border-l-2 border-l-green-400' :
                    'border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Name + provider */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' :
                      role === 'artist' ? 'bg-red-500/20 text-red-400' :
                      role === 'tatoueur' ? 'bg-blue-500/20 text-blue-400' :
                      user.isBuyer ? 'bg-green-500/20 text-green-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {(user.fullName || user.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[15px] font-semibold truncate ${
                        role === 'admin' ? 'text-yellow-400' :
                        role === 'artist' ? 'text-red-400' :
                        role === 'tatoueur' ? 'text-blue-400' :
                        'text-heading'
                      }`}>
                        {user.fullName || tx({ fr: 'Sans nom', en: 'No name', es: 'Sin nombre' })}
                        {role === 'artist' && artistSlug && (
                          <span className="text-[11px] text-red-400/60 font-normal ml-1.5">({artistSlug})</span>
                        )}
                        {role === 'tatoueur' && artistSlug && (
                          <span className="text-[11px] text-blue-400/60 font-normal ml-1.5">({artistSlug})</span>
                        )}
                      </p>
                      <p className="text-[11px] text-grey-muted flex items-center gap-1">
                        {user.isGuest ? (
                          <><ShoppingBag size={9} /> {tx({ fr: 'Achat sans compte', en: 'Guest checkout', es: 'Compra sin cuenta' })}</>
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

                  {/* Date inscription */}
                  <span className="text-[12px] text-grey-muted">
                    {formatDate(user.createdAt)}
                  </span>

                  {/* Orders */}
                  <span className={`text-[15px] font-semibold text-center ${user.orderCount > 0 ? 'text-heading' : 'text-grey-muted'}`}>
                    {user.orderCount || 0}
                  </span>

                  {/* Total spent */}
                  <span className={`text-[15px] font-bold text-right ${user.totalSpent > 0 ? 'text-green-400' : 'text-grey-muted'}`}>
                    {user.totalSpent > 0 ? formatMoney(user.totalSpent) : '-'}
                  </span>

                  {/* Chevron */}
                  <span className="text-grey-muted justify-self-end">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>

                {/* Mobile card */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : user.id)}
                  className={`md:hidden px-4 py-3 cursor-pointer hover:bg-accent/5 transition-colors ${
                    role === 'admin' ? 'border-l-2 border-l-red-400' :
                    role === 'artist' ? 'border-l-2 border-l-purple-400' :
                    user.isBuyer ? 'border-l-2 border-l-green-400' :
                    'border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Line 1: Avatar + Name + Spent */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' :
                      role === 'artist' ? 'bg-red-500/20 text-red-400' :
                      role === 'tatoueur' ? 'bg-blue-500/20 text-blue-400' :
                      user.isBuyer ? 'bg-green-500/20 text-green-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {(user.fullName || user.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        role === 'admin' ? 'text-yellow-400' :
                        role === 'artist' ? 'text-red-400' :
                        role === 'tatoueur' ? 'text-blue-400' :
                        'text-heading'
                      }`}>
                        {user.fullName || tx({ fr: 'Sans nom', en: 'No name', es: 'Sin nombre' })}
                      </p>
                      <p className="text-xs text-grey-muted truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      {user.totalSpent > 0 ? (
                        <span className="text-sm font-bold text-green-400">{formatMoney(user.totalSpent)}</span>
                      ) : (
                        <span className="text-xs text-grey-muted">-</span>
                      )}
                      {user.orderCount > 0 && (
                        <span className="text-[10px] text-grey-muted">{user.orderCount} cmd</span>
                      )}
                    </div>
                  </div>

                  {/* Line 2: Badges + provider + actions */}
                  <div className="flex items-center gap-1.5 mt-2 ml-[52px] flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${buyerBadge.className}`}>
                      {user.isBuyer ? <ShoppingBag size={9} /> : <Eye size={9} />}
                      {buyerBadge.label}
                    </span>
                    <span className="text-[10px] text-grey-muted flex items-center gap-0.5">
                      <Shield size={8} /> {user.isGuest ? 'guest' : user.provider}
                    </span>

                    {/* Mobile actions */}
                    <div className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {role !== 'admin' && !user.isGuest && (
                        <>
                          {role === 'artist' ? (
                            <>
                              <button
                                onClick={() => { setEditingUser(isEditing ? null : user.email); setSelectedSlug(artistSlug || ''); }}
                                className="p-1.5 rounded-lg bg-accent/10 text-accent"
                              >
                                <Palette size={14} />
                              </button>
                              <button
                                onClick={() => handleRemoveArtist(user)}
                                disabled={isSaving}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 disabled:opacity-50"
                              >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setEditingUser(isEditing ? null : user.email); setSelectedSlug(''); }}
                              className="p-1.5 rounded-lg bg-accent/10 text-accent"
                            >
                              <Palette size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setExpandedId(user.id);
                              setDeleteConfirm(user.id);
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      <span className="text-grey-muted ml-1">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
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
                      <div className="px-4 pb-4 pt-1 shadow-[0_-1px_0_rgba(255,255,255,0.04)] bg-glass/50">
                        {/* Candidature artiste - TPS/TVQ */}
                        {(() => {
                          const sub = artistSubs[(user.email || '').toLowerCase()];
                          if (!sub) return null;
                          return (
                            <div className="mt-3 mb-3 rounded-lg bg-purple-500/5 bg-purple-500/5 p-4">
                              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Receipt size={12} />
                                {tx({ fr: 'Infos candidature artiste', en: 'Artist application info', es: 'Info solicitud artista' })}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                {sub.nomLegal && (
                                  <div>
                                    <span className="text-grey-muted text-xs">{tx({ fr: 'Nom legal', en: 'Legal name', es: 'Nombre legal' })}</span>
                                    <p className="text-heading font-medium">{sub.nomLegal}</p>
                                  </div>
                                )}
                                {sub.telephone && (
                                  <div>
                                    <span className="text-grey-muted text-xs flex items-center gap-1"><Phone size={10} /> {tx({ fr: 'Telephone', en: 'Phone', es: 'Telefono' })}</span>
                                    <p className="text-heading font-medium">{sub.telephone}</p>
                                  </div>
                                )}
                                {sub.adresse && (
                                  <div>
                                    <span className="text-grey-muted text-xs flex items-center gap-1"><MapPin size={10} /> {tx({ fr: 'Adresse', en: 'Address', es: 'Direccion' })}</span>
                                    <p className="text-heading font-medium">{sub.adresse}</p>
                                  </div>
                                )}
                                {sub.tpsTvq && (
                                  <div>
                                    <span className="text-grey-muted text-xs flex items-center gap-1"><Receipt size={10} /> TPS / TVQ</span>
                                    <p className="text-green-400 font-bold">{sub.tpsTvq}</p>
                                  </div>
                                )}
                              </div>
                              {!sub.tpsTvq && (
                                <p className="text-grey-muted/60 text-xs mt-2 italic">{tx({ fr: 'Aucun numéro TPS/TVQ fourni', en: 'No GST/QST number provided', es: 'Sin numero TPS/TVQ' })}</p>
                              )}
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          {/* Contact */}
                          <div className="rounded-lg bg-glass p-3">
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2">
                              {tx({ fr: 'Coordonnees', en: 'Contact', es: 'Contacto' })}
                            </h4>
                            <div className="space-y-2 text-[15px]">
                              <p className="text-heading font-medium">{user.fullName || '-'}</p>
                              {user.nomArtiste && (
                                <p className="text-red-400 flex items-center gap-2 text-sm"><Palette size={13} /> {user.nomArtiste}</p>
                              )}
                              <p className="text-grey-muted flex items-center gap-2"><Mail size={13} /> {user.email}</p>
                              {(user.phone || artistSubs[(user.email || '').toLowerCase()]?.telephone) && (
                                <p className="text-grey-muted flex items-center gap-2"><Phone size={13} /> {user.phone || artistSubs[(user.email || '').toLowerCase()]?.telephone}</p>
                              )}
                              {user.company && <p className="text-grey-muted flex items-center gap-2"><Building2 size={13} /> {user.company}</p>}
                            </div>
                          </div>

                          {/* Address */}
                          <div className="rounded-lg bg-glass p-3">
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <MapPin size={12} />
                              {user.isBuyer && user.lastShippingAddress
                                ? tx({ fr: 'Dernière adresse', en: 'Last address', es: 'Ultima direccion' })
                                : tx({ fr: 'Adresse', en: 'Address', es: 'Direccion' })}
                            </h4>
                            {user.lastShippingAddress ? (
                              <div className="text-[15px] text-heading space-y-0.5">
                                <p>{user.lastShippingAddress.address}</p>
                                <p>{user.lastShippingAddress.city}, {user.lastShippingAddress.province} {user.lastShippingAddress.postalCode}</p>
                              </div>
                            ) : artistSubs[(user.email || '').toLowerCase()]?.adresse ? (
                              <div className="text-[15px] text-heading">
                                <p>{artistSubs[(user.email || '').toLowerCase()].adresse}</p>
                                <p className="text-grey-muted text-xs mt-1 italic">{tx({ fr: '(depuis candidature)', en: '(from application)', es: '(desde solicitud)' })}</p>
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
                                  <span className="text-grey-muted">{tx({ fr: 'Dernière cmd', en: 'Last order', es: 'Ultimo pedido' })}</span>
                                  <span className="text-heading">{formatDate(user.lastOrderDate)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-grey-muted">{tx({ fr: 'Inscrit le', en: 'Signed up', es: 'Registrado' })}</span>
                                <span className="text-heading">{formatDate(user.createdAt)}</span>
                              </div>
                              {user.referredBy && (
                                <div className="flex justify-between items-center">
                                  <span className="text-grey-muted flex items-center gap-1"><Gift size={12} className="text-yellow-400" /> {tx({ fr: 'Parrainé par', en: 'Referred by', es: 'Referido por' })}</span>
                                  <span className="text-yellow-400 font-semibold text-sm">#{user.referredBy}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-grey-muted flex items-center gap-1">
                                  <FileCheck size={12} className={user.contractSigned ? 'text-green-400' : 'text-grey-muted/50'} />
                                  {tx({ fr: 'Contrat', en: 'Contract', es: 'Contrato' })}
                                </span>
                                {user.contractSigned ? (
                                  <span className="text-green-400 font-semibold text-sm flex items-center gap-1">
                                    <Check size={12} />
                                    {tx({ fr: 'Signe', en: 'Signed', es: 'Firmado' })} {user.contractVersion || ''}
                                    {user.contractSignedAt && (
                                      <span className="text-green-400/60 text-xs ml-1">({formatDate(user.contractSignedAt)})</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-grey-muted/50 text-sm">{tx({ fr: 'Non signe', en: 'Not signed', es: 'No firmado' })}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {role !== 'admin' && !user.isGuest && (
                          <div className="mt-4 pt-3 shadow-[0_-1px_0_rgba(255,255,255,0.04)] flex flex-wrap items-center gap-3">
                            {/* Artist role actions */}
                            {role === 'artist' ? (
                              <>
                                <button
                                  onClick={() => { setEditingUser(isEditing ? null : user.email); setSelectedSlug(artistSlug || ''); }}
                                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-colors flex items-center gap-1.5"
                                >
                                  <Palette size={12} />
                                  {tx({ fr: 'Changer profil artiste', en: 'Change artist profile', es: 'Cambiar perfil artista' })}
                                </button>
                                <button
                                  onClick={() => handleRemoveArtist(user)}
                                  disabled={isSaving}
                                  className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {isSaving ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                  {tx({ fr: 'Retirer role artiste', en: 'Remove artist role', es: 'Quitar rol artista' })}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => { setEditingUser(isEditing ? null : user.email); setSelectedSlug(''); }}
                                className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors flex items-center gap-1.5"
                              >
                                <Palette size={12} />
                                {tx({ fr: 'Assigner un rôle', en: 'Assign role', es: 'Asignar rol' })}
                              </button>
                            )}

                            {/* Delete */}
                            <div className="ml-auto">
                              {deleteConfirm === user.id ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400 text-xs">
                                    {tx({ fr: 'Confirmer?', en: 'Confirm?', es: 'Confirmar?' })}
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
                                  {tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                                </button>
                              )}
                            </div>
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
                      <div className="px-4 py-3 flex flex-wrap items-center gap-3 bg-accent/5 shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
                        <span className="text-xs text-grey-muted whitespace-nowrap">
                          {role === 'artist' || role === 'tatoueur'
                            ? tx({ fr: 'Changer le rôle:', en: 'Change role:', es: 'Cambiar rol:' })
                            : tx({ fr: 'Assigner un rôle:', en: 'Assign a role:', es: 'Asignar un rol:' })}
                        </span>
                        <select
                          value={selectedSlug}
                          onChange={(e) => { setSelectedSlug(e.target.value); if (e.target.value !== '__new__') setCustomSlug(''); }}
                          className="input-field text-sm py-1.5 px-3 max-w-xs"
                        >
                          <option value="">{tx({ fr: '-- Choisir --', en: '-- Choose --', es: '-- Elegir --' })}</option>
                          {(role === 'artist' || role === 'tatoueur') && (
                            <option value="__downgrade__">{tx({ fr: 'Retirer le rôle (utilisateur normal)', en: 'Remove role (normal user)', es: 'Quitar rol (usuario normal)' })}</option>
                          )}
                          <option value="__new__">{tx({ fr: '+ Nouveau (slug personnalisé)', en: '+ New (custom slug)', es: '+ Nuevo (slug personalizado)' })}</option>
                          <optgroup label={tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' })}>
                            {ARTIST_SLUGS.map(slug => (
                              <option key={`artist-${slug}`} value={`artist:${slug}`}>
                                {artistsData[slug]?.name || slug}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label={tx({ fr: 'Tatoueurs', en: 'Tattoo Artists', es: 'Tatuadores' })}>
                            {TATOUEUR_SLUGS.map(slug => (
                              <option key={`tatoueur-${slug}`} value={`tatoueur:${slug}`}>
                                {tatoueursData[slug]?.name || slug}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        {selectedSlug === '__new__' && (
                          <input
                            type="text"
                            value={customSlug}
                            onChange={(e) => setCustomSlug(e.target.value)}
                            className="input-field text-sm py-1.5 px-3 max-w-xs"
                            placeholder={tx({ fr: 'ex: nom-artiste', en: 'eg: artist-name', es: 'ej: nombre-artista' })}
                          />
                        )}
                        <button
                          onClick={() => handleSetArtist(user)}
                          disabled={(!selectedSlug || (selectedSlug === '__new__' && !customSlug.trim()) || selectedSlug === '') || isSaving}
                          className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          <span className="ml-1">{tx({ fr: 'Confirmer', en: 'Confirm', es: 'Confirmar' })}</span>
                        </button>
                        <button
                          onClick={() => { setEditingUser(null); setCustomSlug(''); }}
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
      <div className="rounded-xl card-bg shadow-lg shadow-black/20 p-5">
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
