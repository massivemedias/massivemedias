import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Building2, Package, LogOut, Loader2, Check, Lock,
  Eye, EyeOff, ChevronDown, ChevronUp, Shield, Pencil, Save, ShoppingBag,
  ArrowRight, Gift, Copy, Heart, Clock, RotateCcw, MessageCircle,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getMyOrders } from '../services/orderService';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  processing: 'bg-blue-500/20 text-blue-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  refunded: 'bg-grey-500/20 text-grey-400',
};

function FormInput({ icon: Icon, label, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="mb-4">
      <label className="flex items-center gap-2 text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1.5">
        <Icon size={14} />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (email || '??').substring(0, 2).toUpperCase();
}

function getMemberSince(createdAt, isFr) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  return d.toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long' });
}

function Account() {
  const { t, lang } = useLang();
  const { user, signOut, updateProfile, updatePassword } = useAuth();
  const isFr = lang === 'fr';
  const meta = user?.user_metadata || {};

  const [activeTab, setActiveTab] = useState('overview');

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Password
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: meta.full_name || '',
    phone: meta.phone || '',
    company: meta.company || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Address form
  const [addressForm, setAddressForm] = useState({
    address: meta.address || '',
    city: meta.city || '',
    province: meta.province || '',
    postal_code: meta.postal_code || '',
    country: meta.country || 'Canada',
  });
  const [addressSaving, setAddressSaving] = useState(false);

  // Save feedback
  const [saveMsg, setSaveMsg] = useState('');

  // Referral copy
  const [refCopied, setRefCopied] = useState(false);

  // Sync forms when user metadata changes
  useEffect(() => {
    setProfileForm({
      full_name: meta.full_name || '',
      phone: meta.phone || '',
      company: meta.company || '',
    });
    setAddressForm({
      address: meta.address || '',
      city: meta.city || '',
      province: meta.province || '',
      postal_code: meta.postal_code || '',
      country: meta.country || 'Canada',
    });
  }, [user]);

  const tabs = [
    { id: 'overview', label: isFr ? 'Tableau de bord' : 'Dashboard', icon: User },
    { id: 'orders', label: isFr ? 'Commandes' : 'Orders', icon: Package },
    { id: 'profile', label: isFr ? 'Profil' : 'Profile', icon: Pencil },
    { id: 'address', label: isFr ? 'Adresse' : 'Address', icon: MapPin },
    { id: 'security', label: isFr ? 'Securite' : 'Security', icon: Shield },
  ];

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    async function fetchOrders() {
      try {
        const data = await getMyOrders(user.id);
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setOrdersError(true);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }
    fetchOrders();
    return () => { cancelled = true; };
  }, [user?.id]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  const getStatusLabel = (status) => {
    const labels = {
      pending: isFr ? 'En attente' : 'Pending',
      paid: isFr ? 'Paye' : 'Paid',
      processing: isFr ? 'En traitement' : 'Processing',
      shipped: isFr ? 'Expedie' : 'Shipped',
      delivered: isFr ? 'Livre' : 'Delivered',
      cancelled: isFr ? 'Annule' : 'Cancelled',
      refunded: isFr ? 'Rembourse' : 'Refunded',
    };
    return labels[status] || status;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const { error } = await updateProfile(profileForm);
    setProfileSaving(false);
    if (error) {
      setSaveMsg(isFr ? 'Erreur lors de la sauvegarde.' : 'Error saving.');
    } else {
      setSaveMsg(isFr ? 'Profil sauvegarde!' : 'Profile saved!');
    }
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    setAddressSaving(true);
    const { error } = await updateProfile(addressForm);
    setAddressSaving(false);
    if (error) {
      setSaveMsg(isFr ? 'Erreur lors de la sauvegarde.' : 'Error saving.');
    } else {
      setSaveMsg(isFr ? 'Adresse sauvegardee!' : 'Address saved!');
    }
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);
    if (newPassword.length < 6) {
      setPwdError(isFr ? 'Minimum 6 caracteres.' : 'Minimum 6 characters.');
      return;
    }
    if (newPassword !== confirmPwd) {
      setPwdError(isFr ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }
    setPwdLoading(true);
    const { error } = await updatePassword(newPassword);
    setPwdLoading(false);
    if (error) {
      setPwdError(error.message);
    } else {
      setPwdSuccess(true);
      setNewPassword('');
      setConfirmPwd('');
      setTimeout(() => { setChangingPassword(false); setPwdSuccess(false); }, 2000);
    }
  };

  const handleCopyReferral = () => {
    const link = `${window.location.origin}?ref=${user?.id?.substring(0, 8) || 'massive'}`;
    navigator.clipboard.writeText(link).then(() => {
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    });
  };

  const firstName = meta.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const initials = getInitials(meta.full_name, user?.email);
  const memberSince = getMemberSince(user?.created_at, isFr);

  return (
    <>
      <SEO title={`${t('account.title')} - Massive Medias`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* ── Header with Avatar ── */}
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-accent">{initials}</span>
              </div>
              <div className="flex-grow min-w-0">
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                  {isFr ? 'Bonjour' : 'Hello'}, {firstName}
                </h1>
                <p className="text-grey-muted text-sm mt-0.5">
                  {user?.email}
                  {memberSince && (
                    <span className="ml-3 text-grey-muted/60">
                      {isFr ? 'Membre depuis' : 'Member since'} {memberSince}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={signOut} className="flex items-center gap-2 text-grey-muted hover:text-red-400 transition-colors text-sm flex-shrink-0">
                <LogOut size={16} />
                <span className="hidden sm:inline">{t('auth.logout')}</span>
              </button>
            </div>

            {/* ── Tab navigation ── */}
            <div className="flex gap-1 mb-8 border-b border-purple-main/20 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-grey-muted hover:text-heading hover:border-grey-muted/30'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.id === 'orders' && orders.length > 0 && (
                    <span className="text-[10px] bg-accent/20 text-accent rounded-full px-1.5 py-0.5 font-bold">{orders.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Save feedback */}
            <AnimatePresence>
              {saveMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2"
                >
                  <Check size={16} />
                  {saveMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Tab content ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          icon: Package,
                          value: ordersLoading ? '-' : orders.length,
                          label: isFr ? 'Commandes' : 'Orders',
                          color: 'text-blue-400',
                          bgColor: 'bg-blue-500/10',
                        },
                        {
                          icon: Heart,
                          value: ordersLoading ? '-' : orders.filter(o => o.status === 'delivered').length,
                          label: isFr ? 'Livrees' : 'Delivered',
                          color: 'text-green-400',
                          bgColor: 'bg-green-500/10',
                        },
                        {
                          icon: Clock,
                          value: ordersLoading ? '-' : orders.filter(o => ['pending', 'processing', 'paid'].includes(o.status)).length,
                          label: isFr ? 'En cours' : 'In progress',
                          color: 'text-yellow-400',
                          bgColor: 'bg-yellow-500/10',
                        },
                        {
                          icon: Gift,
                          value: memberSince ? memberSince.split(' ').pop() : '-',
                          label: isFr ? 'Membre depuis' : 'Since',
                          color: 'text-accent',
                          bgColor: 'bg-accent/10',
                        },
                      ].map((stat, i) => (
                        <div key={i} className="rounded-xl border border-purple-main/20 p-4 card-bg card-shadow text-center">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stat.bgColor} mb-2`}>
                            <stat.icon size={18} className={stat.color} />
                          </div>
                          <p className="text-2xl font-bold text-heading">{stat.value}</p>
                          <p className="text-xs text-grey-muted mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Quick actions */}
                    <div className="rounded-2xl border border-purple-main/30 p-6 card-bg card-shadow">
                      <h3 className="text-heading font-semibold text-sm mb-4">
                        {isFr ? 'Actions rapides' : 'Quick actions'}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Link
                          to="/boutique"
                          className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors group"
                        >
                          <ShoppingBag size={20} className="text-accent" />
                          <div className="flex-grow">
                            <p className="text-heading text-sm font-medium">{isFr ? 'Voir la boutique' : 'Browse shop'}</p>
                            <p className="text-grey-muted text-xs">{isFr ? 'Stickers, prints, merch' : 'Stickers, prints, merch'}</p>
                          </div>
                          <ArrowRight size={16} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {orders.length > 0 ? (
                          <button
                            onClick={() => setActiveTab('orders')}
                            className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors group text-left"
                          >
                            <RotateCcw size={20} className="text-blue-400" />
                            <div className="flex-grow">
                              <p className="text-heading text-sm font-medium">{isFr ? 'Recommander' : 'Reorder'}</p>
                              <p className="text-grey-muted text-xs">{isFr ? 'Voir mes commandes' : 'View my orders'}</p>
                            </div>
                            <ArrowRight size={16} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <Link
                            to="/boutique/stickers"
                            className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 transition-colors group"
                          >
                            <Heart size={20} className="text-purple-400" />
                            <div className="flex-grow">
                              <p className="text-heading text-sm font-medium">{isFr ? 'Populaire' : 'Popular'}</p>
                              <p className="text-grey-muted text-xs">{isFr ? 'Stickers custom' : 'Custom stickers'}</p>
                            </div>
                            <ArrowRight size={16} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        )}
                        <Link
                          to="/contact"
                          className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors group"
                        >
                          <MessageCircle size={20} className="text-green-400" />
                          <div className="flex-grow">
                            <p className="text-heading text-sm font-medium">{isFr ? 'Support' : 'Support'}</p>
                            <p className="text-grey-muted text-xs">{isFr ? 'On repond vite!' : 'We reply fast!'}</p>
                          </div>
                          <ArrowRight size={16} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </div>
                    </div>

                    {/* Referral + Recent orders side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Referral card */}
                      <div className="rounded-2xl border border-purple-main/30 p-6 card-bg card-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <Gift size={18} className="text-accent" />
                          </div>
                          <div>
                            <h3 className="text-heading font-semibold text-sm">
                              {isFr ? 'Parraine un ami' : 'Refer a friend'}
                            </h3>
                            <p className="text-grey-muted text-xs">
                              {isFr ? 'Vous recevez chacun 10%' : 'You both get 10% off'}
                            </p>
                          </div>
                        </div>
                        <p className="text-grey-muted text-xs mb-4">
                          {isFr
                            ? 'Partage ton lien et recois 10% de rabais sur ta prochaine commande quand ton ami commande.'
                            : 'Share your link and get 10% off your next order when your friend orders.'}
                        </p>
                        <button
                          onClick={handleCopyReferral}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
                        >
                          {refCopied ? (
                            <>
                              <Check size={16} />
                              {isFr ? 'Lien copie!' : 'Link copied!'}
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              {isFr ? 'Copier mon lien' : 'Copy my link'}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Recent orders mini */}
                      <div className="rounded-2xl border border-purple-main/30 p-6 card-bg card-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-heading font-semibold text-sm">
                            {isFr ? 'Commandes recentes' : 'Recent orders'}
                          </h3>
                          {orders.length > 0 && (
                            <button
                              onClick={() => setActiveTab('orders')}
                              className="text-accent text-xs font-medium hover:underline"
                            >
                              {isFr ? 'Voir tout' : 'View all'}
                            </button>
                          )}
                        </div>
                        {ordersLoading ? (
                          <div className="flex items-center gap-2 text-grey-muted py-6 justify-center">
                            <Loader2 size={16} className="animate-spin" />
                          </div>
                        ) : orders.length === 0 ? (
                          <div className="text-center py-6">
                            <Package size={32} className="text-grey-muted/20 mx-auto mb-2" />
                            <p className="text-grey-muted text-xs">{isFr ? 'Aucune commande' : 'No orders yet'}</p>
                            <Link to="/boutique" className="text-accent text-xs font-medium hover:underline mt-1 inline-block">
                              {isFr ? 'Passer une commande' : 'Place an order'}
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {orders.slice(0, 3).map((order) => (
                              <div key={order.documentId || order.id} className="flex items-center justify-between py-2 border-b border-purple-main/10 last:border-0">
                                <div>
                                  <p className="text-heading text-xs font-medium">{formatDate(order.createdAt)}</p>
                                  <p className="text-grey-muted text-[10px]">
                                    {order.items?.length || 0} {(order.items?.length || 0) > 1 ? (isFr ? 'articles' : 'items') : (isFr ? 'article' : 'item')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[order.status] || 'bg-grey-500/20 text-grey-400'}`}>
                                    {getStatusLabel(order.status)}
                                  </span>
                                  <span className="text-heading text-xs font-bold">{((order.total || 0) / 100).toFixed(2)}$</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profile completion prompt */}
                    {(!meta.full_name || !meta.phone || !meta.address) && (
                      <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-accent" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-heading text-sm font-medium">
                            {isFr ? 'Complete ton profil' : 'Complete your profile'}
                          </p>
                          <p className="text-grey-muted text-xs">
                            {isFr
                              ? 'Ajoute tes informations pour accelerer tes prochaines commandes.'
                              : 'Add your info to speed up your next orders.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="text-accent text-sm font-medium hover:underline flex-shrink-0 flex items-center gap-1"
                        >
                          {isFr ? 'Completer' : 'Complete'}
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PROFILE TAB ── */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileSave} className="rounded-2xl border border-purple-main/30 p-6 md:p-8 card-bg card-shadow">
                    <h3 className="text-heading font-semibold mb-6 flex items-center gap-2">
                      <User size={18} className="text-accent" />
                      {isFr ? 'Informations personnelles' : 'Personal information'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      <FormInput
                        icon={User}
                        label={isFr ? 'Nom complet' : 'Full name'}
                        value={profileForm.full_name}
                        placeholder={isFr ? 'Ton nom' : 'Your name'}
                        onChange={v => setProfileForm(p => ({ ...p, full_name: v }))}
                      />
                      <FormInput
                        icon={Phone}
                        label={isFr ? 'Telephone' : 'Phone'}
                        value={profileForm.phone}
                        type="tel"
                        placeholder="514-xxx-xxxx"
                        onChange={v => setProfileForm(p => ({ ...p, phone: v }))}
                      />
                      <FormInput
                        icon={Building2}
                        label={isFr ? 'Entreprise' : 'Company'}
                        value={profileForm.company}
                        placeholder={isFr ? 'Nom de l\'entreprise' : 'Company name'}
                        onChange={v => setProfileForm(p => ({ ...p, company: v }))}
                      />
                      <div className="mb-4">
                        <label className="flex items-center gap-2 text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1.5">
                          <Mail size={14} />
                          {isFr ? 'Courriel' : 'Email'}
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="input-field text-sm opacity-60 cursor-not-allowed"
                        />
                        <p className="text-grey-muted/50 text-[10px] mt-1">
                          {isFr ? 'Le courriel ne peut pas etre modifie ici.' : 'Email cannot be changed here.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="btn-primary text-sm py-2.5 px-8 mt-2"
                    >
                      {profileSaving ? (
                        <Loader2 size={16} className="animate-spin mr-2" />
                      ) : (
                        <Save size={16} className="mr-2" />
                      )}
                      {isFr ? 'Sauvegarder' : 'Save'}
                    </button>
                  </form>
                )}

                {/* ── ORDERS TAB ── */}
                {activeTab === 'orders' && (
                  <div className="rounded-2xl border border-purple-main/30 p-6 md:p-8 card-bg card-shadow">
                    <h3 className="text-heading font-semibold mb-6 flex items-center gap-2">
                      <Package size={18} className="text-accent" />
                      {isFr ? 'Historique des commandes' : 'Order history'}
                    </h3>
                    {ordersLoading ? (
                      <div className="flex items-center gap-3 text-grey-muted py-12 justify-center">
                        <Loader2 size={20} className="animate-spin" />
                        <span>{isFr ? 'Chargement...' : 'Loading...'}</span>
                      </div>
                    ) : ordersError ? (
                      <p className="text-grey-muted text-center py-12">{isFr ? 'Erreur au chargement des commandes.' : 'Error loading orders.'}</p>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package size={48} className="text-grey-muted/20 mx-auto mb-4" />
                        <p className="text-heading font-medium mb-1">{t('account.noOrders')}</p>
                        <p className="text-grey-muted text-sm mb-4">
                          {isFr ? 'Tes commandes apparaitront ici.' : 'Your orders will appear here.'}
                        </p>
                        <Link to="/boutique" className="btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-2">
                          <ShoppingBag size={16} />
                          {isFr ? 'Decouvrir la boutique' : 'Browse the shop'}
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => {
                          const isExpanded = expandedOrder === (order.documentId || order.id);
                          return (
                            <div key={order.documentId || order.id} className="rounded-xl bg-glass overflow-hidden">
                              <button
                                onClick={() => setExpandedOrder(isExpanded ? null : (order.documentId || order.id))}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                              >
                                <div>
                                  <p className="text-heading font-semibold text-sm">{formatDate(order.createdAt)}</p>
                                  <p className="text-grey-muted text-xs">
                                    {order.items?.length || 0} {(order.items?.length || 0) > 1 ? (isFr ? 'articles' : 'items') : (isFr ? 'article' : 'item')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-grey-500/20 text-grey-400'}`}>
                                    {getStatusLabel(order.status)}
                                  </span>
                                  <span className="text-heading font-bold text-sm">{((order.total || 0) / 100).toFixed(2)}$</span>
                                  {isExpanded ? <ChevronUp size={16} className="text-grey-muted" /> : <ChevronDown size={16} className="text-grey-muted" />}
                                </div>
                              </button>

                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="border-t border-purple-main/10 px-4 pb-4"
                                >
                                  {order.items && (
                                    <div className="mt-3 space-y-2">
                                      {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2">
                                          {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                                          <div className="flex-grow min-w-0">
                                            <p className="text-heading text-sm font-medium truncate">{item.productName}</p>
                                            <p className="text-grey-muted text-xs">
                                              {[item.finish, item.shape, item.size, `${item.quantity}x`].filter(Boolean).join(' - ')}
                                            </p>
                                            {item.notes && <p className="text-grey-muted text-xs mt-0.5 italic">"{item.notes}"</p>}
                                          </div>
                                          <span className="text-heading text-sm font-medium flex-shrink-0">{item.totalPrice}$</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {order.notes && (
                                    <div className="mt-3 p-3 rounded-lg bg-purple-main/10">
                                      <p className="text-xs text-grey-muted mb-1">Notes</p>
                                      <p className="text-heading text-xs whitespace-pre-wrap">{order.notes}</p>
                                    </div>
                                  )}
                                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-grey-muted">
                                    {order.designReady !== undefined && (
                                      <span>{isFr ? 'Design pret' : 'Design ready'}: {order.designReady ? (isFr ? 'Oui' : 'Yes') : (isFr ? 'Non' : 'No')}</span>
                                    )}
                                    <span>{isFr ? 'Devise' : 'Currency'}: {(order.currency || 'cad').toUpperCase()}</span>
                                    <Link
                                      to="/boutique"
                                      className="ml-auto flex items-center gap-1.5 text-accent font-medium hover:underline"
                                    >
                                      <RotateCcw size={12} />
                                      {isFr ? 'Commander a nouveau' : 'Order again'}
                                    </Link>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── ADDRESS TAB ── */}
                {activeTab === 'address' && (
                  <form onSubmit={handleAddressSave} className="rounded-2xl border border-purple-main/30 p-6 md:p-8 card-bg card-shadow">
                    <h3 className="text-heading font-semibold mb-6 flex items-center gap-2">
                      <MapPin size={18} className="text-accent" />
                      {isFr ? 'Adresse de livraison' : 'Shipping address'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      <div className="md:col-span-2">
                        <FormInput
                          icon={MapPin}
                          label={isFr ? 'Adresse' : 'Street address'}
                          value={addressForm.address}
                          placeholder={isFr ? '123 rue Exemple' : '123 Example St'}
                          onChange={v => setAddressForm(a => ({ ...a, address: v }))}
                        />
                      </div>
                      <FormInput
                        icon={MapPin}
                        label={isFr ? 'Ville' : 'City'}
                        value={addressForm.city}
                        placeholder="Montreal"
                        onChange={v => setAddressForm(a => ({ ...a, city: v }))}
                      />
                      <FormInput
                        icon={MapPin}
                        label={isFr ? 'Province / Etat' : 'Province / State'}
                        value={addressForm.province}
                        placeholder="QC"
                        onChange={v => setAddressForm(a => ({ ...a, province: v }))}
                      />
                      <FormInput
                        icon={MapPin}
                        label={isFr ? 'Code postal' : 'Postal code'}
                        value={addressForm.postal_code}
                        placeholder="H2X 1Y4"
                        onChange={v => setAddressForm(a => ({ ...a, postal_code: v }))}
                      />
                      <FormInput
                        icon={MapPin}
                        label={isFr ? 'Pays' : 'Country'}
                        value={addressForm.country}
                        placeholder="Canada"
                        onChange={v => setAddressForm(a => ({ ...a, country: v }))}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="btn-primary text-sm py-2.5 px-8 mt-2"
                    >
                      {addressSaving ? (
                        <Loader2 size={16} className="animate-spin mr-2" />
                      ) : (
                        <Save size={16} className="mr-2" />
                      )}
                      {isFr ? 'Sauvegarder' : 'Save'}
                    </button>
                  </form>
                )}

                {/* ── SECURITY TAB ── */}
                {activeTab === 'security' && (
                  <div className="rounded-2xl border border-purple-main/30 p-6 md:p-8 card-bg card-shadow">
                    {/* Password section */}
                    <div className="mb-6">
                      <h3 className="text-heading font-semibold text-sm mb-4 flex items-center gap-2">
                        <Lock size={16} className="text-accent" />
                        {isFr ? 'Mot de passe' : 'Password'}
                      </h3>

                      {changingPassword ? (
                        <form onSubmit={handlePasswordChange} className="max-w-sm space-y-4">
                          <div>
                            <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1.5 block">
                              {isFr ? 'Nouveau mot de passe' : 'New password'}
                            </label>
                            <div className="relative">
                              <input
                                type={showPwd ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="input-field text-sm"
                                placeholder="--------"
                                required
                                minLength={6}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPwd(!showPwd)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted hover:text-heading transition-colors"
                              >
                                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1.5 block">
                              {isFr ? 'Confirmer' : 'Confirm'}
                            </label>
                            <input
                              type={showPwd ? 'text' : 'password'}
                              value={confirmPwd}
                              onChange={e => setConfirmPwd(e.target.value)}
                              className="input-field text-sm"
                              placeholder="--------"
                              required
                              minLength={6}
                            />
                          </div>
                          {pwdError && <p className="text-red-400 text-xs">{pwdError}</p>}
                          {pwdSuccess && (
                            <p className="text-green-400 text-xs flex items-center gap-1">
                              <Check size={14} /> {isFr ? 'Mot de passe mis a jour!' : 'Password updated!'}
                            </p>
                          )}
                          <div className="flex gap-3 pt-1">
                            <button type="submit" disabled={pwdLoading} className="btn-primary text-sm py-2 px-6">
                              {pwdLoading ? '...' : (isFr ? 'Sauvegarder' : 'Save')}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setChangingPassword(false); setPwdError(''); setNewPassword(''); setConfirmPwd(''); }}
                              className="text-grey-muted hover:text-heading text-sm transition-colors"
                            >
                              {isFr ? 'Annuler' : 'Cancel'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-heading text-sm">--------</p>
                            <p className="text-grey-muted text-xs mt-1">
                              {isFr ? 'Change ton mot de passe regulierement pour securiser ton compte.' : 'Change your password regularly to secure your account.'}
                            </p>
                          </div>
                          <button
                            onClick={() => setChangingPassword(true)}
                            className="text-accent hover:text-accent/80 transition-colors text-sm font-medium flex items-center gap-1.5"
                          >
                            <Pencil size={14} />
                            {isFr ? 'Modifier' : 'Edit'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Email section */}
                    <div className="pt-6 border-t border-purple-main/10">
                      <h3 className="text-heading font-semibold text-sm mb-2 flex items-center gap-2">
                        <Mail size={16} className="text-accent" />
                        {isFr ? 'Email du compte' : 'Account email'}
                      </h3>
                      <p className="text-heading text-sm">{user?.email}</p>
                      <p className="text-grey-muted text-xs mt-1">
                        {isFr ? 'L\'email est utilise pour la connexion et les notifications de commande.' : 'Email is used for login and order notifications.'}
                      </p>
                    </div>

                    {/* Danger zone */}
                    <div className="pt-6 mt-6 border-t border-red-500/10">
                      <h3 className="text-red-400/70 font-semibold text-sm mb-2 flex items-center gap-2">
                        <Shield size={16} />
                        {isFr ? 'Zone danger' : 'Danger zone'}
                      </h3>
                      <p className="text-grey-muted text-xs mb-3">
                        {isFr
                          ? 'Deconnexion de tous les appareils.'
                          : 'Sign out from all devices.'}
                      </p>
                      <button
                        onClick={signOut}
                        className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={14} />
                        {isFr ? 'Se deconnecter' : 'Sign out'}
                      </button>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Account;
