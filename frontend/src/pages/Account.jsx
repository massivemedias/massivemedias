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

function getMemberSince(createdAt, lang) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  const localeMap = { fr: 'fr-CA', en: 'en-CA', es: 'es-MX' };
  return d.toLocaleDateString(localeMap[lang] || 'fr-CA', { year: 'numeric', month: 'long' });
}

function Account() {
  const { t, lang, tx } = useLang();
  const { user, signOut, updateProfile, updatePassword } = useAuth();
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
    { id: 'overview', label: tx({ fr: 'Tableau de bord', en: 'Dashboard', es: 'Panel' }), icon: User },
    { id: 'orders', label: tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' }), icon: Package },
    { id: 'profile', label: tx({ fr: 'Profil', en: 'Profile', es: 'Perfil' }), icon: Pencil },
    { id: 'address', label: tx({ fr: 'Adresse', en: 'Address', es: 'Direccion' }), icon: MapPin },
    { id: 'security', label: tx({ fr: 'Securite', en: 'Security', es: 'Seguridad' }), icon: Shield },
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

  const dateLocale = { fr: 'fr-CA', en: 'en-CA', es: 'es-MX' }[lang] || 'fr-CA';

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(dateLocale, {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  const getStatusLabel = (status) => {
    const labels = {
      pending: tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' }),
      paid: tx({ fr: 'Paye', en: 'Paid', es: 'Pagado' }),
      processing: tx({ fr: 'En traitement', en: 'Processing', es: 'En proceso' }),
      shipped: tx({ fr: 'Expedie', en: 'Shipped', es: 'Enviado' }),
      delivered: tx({ fr: 'Livre', en: 'Delivered', es: 'Entregado' }),
      cancelled: tx({ fr: 'Annule', en: 'Cancelled', es: 'Cancelado' }),
      refunded: tx({ fr: 'Rembourse', en: 'Refunded', es: 'Reembolsado' }),
    };
    return labels[status] || status;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const { error } = await updateProfile(profileForm);
    setProfileSaving(false);
    if (error) {
      setSaveMsg(tx({ fr: 'Erreur lors de la sauvegarde.', en: 'Error saving.', es: 'Error al guardar.' }));
    } else {
      setSaveMsg(tx({ fr: 'Profil sauvegarde!', en: 'Profile saved!', es: 'Perfil guardado!' }));
    }
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    setAddressSaving(true);
    const { error } = await updateProfile(addressForm);
    setAddressSaving(false);
    if (error) {
      setSaveMsg(tx({ fr: 'Erreur lors de la sauvegarde.', en: 'Error saving.', es: 'Error al guardar.' }));
    } else {
      setSaveMsg(tx({ fr: 'Adresse sauvegardee!', en: 'Address saved!', es: 'Direccion guardada!' }));
    }
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);
    if (newPassword.length < 6) {
      setPwdError(tx({ fr: 'Minimum 6 caracteres.', en: 'Minimum 6 characters.', es: 'Minimo 6 caracteres.' }));
      return;
    }
    if (newPassword !== confirmPwd) {
      setPwdError(tx({ fr: 'Les mots de passe ne correspondent pas.', en: 'Passwords do not match.', es: 'Las contrasenas no coinciden.' }));
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
  const memberSince = getMemberSince(user?.created_at, lang);

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
            {/* -- Header with Avatar -- */}
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-accent">{initials}</span>
              </div>
              <div className="flex-grow min-w-0">
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                  {tx({ fr: 'Bonjour', en: 'Hello', es: 'Hola' })}, {firstName}
                </h1>
                <p className="text-grey-muted text-sm mt-0.5">
                  {user?.email}
                  {memberSince && (
                    <span className="ml-3 text-grey-muted/60">
                      {tx({ fr: 'Membre depuis', en: 'Member since', es: 'Miembro desde' })} {memberSince}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={signOut} className="flex items-center gap-2 text-grey-muted hover:text-red-400 transition-colors text-sm flex-shrink-0">
                <LogOut size={16} />
                <span className="hidden sm:inline">{t('auth.logout')}</span>
              </button>
            </div>

            {/* -- Tab navigation -- */}
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

            {/* -- Tab content -- */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >

                {/* -- OVERVIEW TAB -- */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          icon: Package,
                          value: ordersLoading ? '-' : orders.length,
                          label: tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' }),
                          color: 'text-blue-400',
                          bgColor: 'bg-blue-500/10',
                        },
                        {
                          icon: Heart,
                          value: ordersLoading ? '-' : orders.filter(o => o.status === 'delivered').length,
                          label: tx({ fr: 'Livrees', en: 'Delivered', es: 'Entregados' }),
                          color: 'text-green-400',
                          bgColor: 'bg-green-500/10',
                        },
                        {
                          icon: Clock,
                          value: ordersLoading ? '-' : orders.filter(o => ['pending', 'processing', 'paid'].includes(o.status)).length,
                          label: tx({ fr: 'En cours', en: 'In progress', es: 'En curso' }),
                          color: 'text-yellow-400',
                          bgColor: 'bg-yellow-500/10',
                        },
                        {
                          icon: Gift,
                          value: memberSince ? memberSince.split(' ').pop() : '-',
                          label: tx({ fr: 'Membre depuis', en: 'Since', es: 'Desde' }),
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
                        {tx({ fr: 'Actions rapides', en: 'Quick actions', es: 'Acciones rapidas' })}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Link
                          to="/boutique"
                          className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors group"
                        >
                          <ShoppingBag size={20} className="text-accent" />
                          <div className="flex-grow">
                            <p className="text-heading text-sm font-medium">{tx({ fr: 'Voir la boutique', en: 'Browse shop', es: 'Ver la tienda' })}</p>
                            <p className="text-grey-muted text-xs">{tx({ fr: 'Stickers, prints, merch', en: 'Stickers, prints, merch', es: 'Stickers, prints, merch' })}</p>
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
                              <p className="text-heading text-sm font-medium">{tx({ fr: 'Recommander', en: 'Reorder', es: 'Reordenar' })}</p>
                              <p className="text-grey-muted text-xs">{tx({ fr: 'Voir mes commandes', en: 'View my orders', es: 'Ver mis pedidos' })}</p>
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
                              <p className="text-heading text-sm font-medium">{tx({ fr: 'Populaire', en: 'Popular', es: 'Popular' })}</p>
                              <p className="text-grey-muted text-xs">{tx({ fr: 'Stickers custom', en: 'Custom stickers', es: 'Stickers personalizados' })}</p>
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
                            <p className="text-heading text-sm font-medium">{tx({ fr: 'Support', en: 'Support', es: 'Soporte' })}</p>
                            <p className="text-grey-muted text-xs">{tx({ fr: 'On repond vite!', en: 'We reply fast!', es: 'Respondemos rapido!' })}</p>
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
                              {tx({ fr: 'Parraine un ami', en: 'Refer a friend', es: 'Recomienda a un amigo' })}
                            </h3>
                            <p className="text-grey-muted text-xs">
                              {tx({ fr: 'Vous recevez chacun 10%', en: 'You both get 10% off', es: 'Ambos reciben 10% de descuento' })}
                            </p>
                          </div>
                        </div>
                        <p className="text-grey-muted text-xs mb-4">
                          {tx({
                            fr: 'Partage ton lien et recois 10% de rabais sur ta prochaine commande quand ton ami commande.',
                            en: 'Share your link and get 10% off your next order when your friend orders.',
                            es: 'Comparte tu enlace y recibe 10% de descuento en tu proximo pedido cuando tu amigo ordene.',
                          })}
                        </p>
                        <button
                          onClick={handleCopyReferral}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
                        >
                          {refCopied ? (
                            <>
                              <Check size={16} />
                              {tx({ fr: 'Lien copie!', en: 'Link copied!', es: 'Enlace copiado!' })}
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              {tx({ fr: 'Copier mon lien', en: 'Copy my link', es: 'Copiar mi enlace' })}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Recent orders mini */}
                      <div className="rounded-2xl border border-purple-main/30 p-6 card-bg card-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-heading font-semibold text-sm">
                            {tx({ fr: 'Commandes recentes', en: 'Recent orders', es: 'Pedidos recientes' })}
                          </h3>
                          {orders.length > 0 && (
                            <button
                              onClick={() => setActiveTab('orders')}
                              className="text-accent text-xs font-medium hover:underline"
                            >
                              {tx({ fr: 'Voir tout', en: 'View all', es: 'Ver todo' })}
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
                            <p className="text-grey-muted text-xs">{tx({ fr: 'Aucune commande', en: 'No orders yet', es: 'Sin pedidos aun' })}</p>
                            <Link to="/boutique" className="text-accent text-xs font-medium hover:underline mt-1 inline-block">
                              {tx({ fr: 'Passer une commande', en: 'Place an order', es: 'Hacer un pedido' })}
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {orders.slice(0, 3).map((order) => (
                              <div key={order.documentId || order.id} className="flex items-center justify-between py-2 border-b border-purple-main/10 last:border-0">
                                <div>
                                  <p className="text-heading text-xs font-medium">{formatDate(order.createdAt)}</p>
                                  <p className="text-grey-muted text-[10px]">
                                    {order.items?.length || 0} {(order.items?.length || 0) > 1 ? tx({ fr: 'articles', en: 'items', es: 'articulos' }) : tx({ fr: 'article', en: 'item', es: 'articulo' })}
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
                            {tx({ fr: 'Complete ton profil', en: 'Complete your profile', es: 'Completa tu perfil' })}
                          </p>
                          <p className="text-grey-muted text-xs">
                            {tx({
                              fr: 'Ajoute tes informations pour accelerer tes prochaines commandes.',
                              en: 'Add your info to speed up your next orders.',
                              es: 'Agrega tu informacion para acelerar tus proximos pedidos.',
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="text-accent text-sm font-medium hover:underline flex-shrink-0 flex items-center gap-1"
                        >
                          {tx({ fr: 'Completer', en: 'Complete', es: 'Completar' })}
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* -- PROFILE TAB -- */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileSave} className="rounded-2xl border border-purple-main/30 p-6 md:p-8 card-bg card-shadow">
                    <h3 className="text-heading font-semibold mb-6 flex items-center gap-2">
                      <User size={18} className="text-accent" />
                      {tx({ fr: 'Informations personnelles', en: 'Personal information', es: 'Informacion personal' })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      <FormInput
                        icon={User}
                        label={tx({ fr: 'Nom complet', en: 'Full name', es: 'Nombre completo' })}
                        value={profileForm.full_name}
                        placeholder={tx({ fr: 'Ton nom', en: 'Your name', es: 'Tu nombre' })}
                        onChange={v => setProfileForm(p => ({ ...p, full_name: v }))}
                      />
                      <FormInput
                        icon={Phone}
                        label={tx({ fr: 'Telephone', en: 'Phone', es: 'Telefono' })}
                        value={profileForm.phone}
                        type="tel"
                        placeholder="514-xxx-xxxx"
                        onChange={v => setProfileForm(p => ({ ...p, phone: v }))}
                      />
                      <FormInput
                        icon={Building2}
                        label={tx({ fr: 'Entreprise', en: 'Company', es: 'Empresa' })}
                        value={profileForm.company}
                        placeholder={tx({ fr: 'Nom de l\'entreprise', en: 'Company name', es: 'Nombre de la empresa' })}
                        onChange={v => setProfileForm(p => ({ ...p, company: v }))}
                      />
                      <div className="mb-4">
                        <label className="flex items-center gap-2 text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1.5">
                          <Mail size={14} />
                          {tx({ fr: 'Courriel', en: 'Email', es: 'Correo' })}
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="input-field text-sm opacity-60 cursor-not-allowed"
                        />
                        <p className="text-grey-muted/50 text-[10px] mt-1">
                          {tx({ fr: 'Le courriel ne peut pas etre modifie ici.', en: 'Email cannot be changed here.', es: 'El correo no se puede cambiar aqui.' })}
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
                      {tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
                    </button>
                  </form>
                )}

                {/* -- ORDERS TAB -- */}
                {activeTab === 'orders' && (
                  <div className="rounded-2xl border border-purple-main/30 p-6 md:p-8 card-bg card-shadow">
                    <h3 className="text-heading font-semibold mb-6 flex items-center gap-2">
                      <Package size={18} className="text-accent" />
                      {tx({ fr: 'Historique des commandes', en: 'Order history', es: 'Historial de pedidos' })}
                    </h3>
                    {ordersLoading ? (
                      <div className="flex items-center gap-3 text-grey-muted py-12 justify-center">
                        <Loader2 size={20} className="animate-spin" />
                        <span>{tx({ fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' })}</span>
                      </div>
                    ) : ordersError ? (
                      <p className="text-grey-muted text-center py-12">{tx({ fr: 'Erreur au chargement des commandes.', en: 'Error loading orders.', es: 'Error al cargar los pedidos.' })}</p>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package size={48} className="text-grey-muted/20 mx-auto mb-4" />
                        <p className="text-heading font-medium mb-1">{t('account.noOrders')}</p>
                        <p className="text-grey-muted text-sm mb-4">
                          {tx({ fr: 'Tes commandes apparaitront ici.', en: 'Your orders will appear here.', es: 'Tus pedidos apareceran aqui.' })}
                        </p>
                        <Link to="/boutique" className="btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-2">
                          <ShoppingBag size={16} />
                          {tx({ fr: 'Decouvrir la boutique', en: 'Browse the shop', es: 'Descubrir la tienda' })}
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
                                    {order.items?.length || 0} {(order.items?.length || 0) > 1 ? tx({ fr: 'articles', en: 'items', es: 'articulos' }) : tx({ fr: 'article', en: 'item', es: 'articulo' })}
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
                                      <span>{tx({ fr: 'Design pret', en: 'Design ready', es: 'Diseno listo' })}: {order.designReady ? tx({ fr: 'Oui', en: 'Yes', es: 'Si' }) : tx({ fr: 'Non', en: 'No', es: 'No' })}</span>
                                    )}
                                    <span>{tx({ fr: 'Devise', en: 'Currency', es: 'Moneda' })}: {(order.currency || 'cad').toUpperCase()}</span>
                                    <Link
                                      to="/boutique"
                                      className="ml-auto flex items-center gap-1.5 text-accent font-medium hover:underline"
                                    >
                                      <RotateCcw size={12} />
                                      {tx({ fr: 'Commander a nouveau', en: 'Order again', es: 'Ordenar de nuevo' })}
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

                {/* -- ADDRESS TAB -- */}
                {activeTab === 'address' && (
                  <form onSubmit={handleAddressSave} className="rounded-2xl border border-purple-main/30 p-6 md:p-8 card-bg card-shadow">
                    <h3 className="text-heading font-semibold mb-6 flex items-center gap-2">
                      <MapPin size={18} className="text-accent" />
                      {tx({ fr: 'Adresse de livraison', en: 'Shipping address', es: 'Direccion de envio' })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      <div className="md:col-span-2">
                        <FormInput
                          icon={MapPin}
                          label={tx({ fr: 'Adresse', en: 'Street address', es: 'Direccion' })}
                          value={addressForm.address}
                          placeholder={tx({ fr: '123 rue Exemple', en: '123 Example St', es: '123 Calle Ejemplo' })}
                          onChange={v => setAddressForm(a => ({ ...a, address: v }))}
                        />
                      </div>
                      <FormInput
                        icon={MapPin}
                        label={tx({ fr: 'Ville', en: 'City', es: 'Ciudad' })}
                        value={addressForm.city}
                        placeholder="Montreal"
                        onChange={v => setAddressForm(a => ({ ...a, city: v }))}
                      />
                      <FormInput
                        icon={MapPin}
                        label={tx({ fr: 'Province / Etat', en: 'Province / State', es: 'Provincia / Estado' })}
                        value={addressForm.province}
                        placeholder="QC"
                        onChange={v => setAddressForm(a => ({ ...a, province: v }))}
                      />
                      <FormInput
                        icon={MapPin}
                        label={tx({ fr: 'Code postal', en: 'Postal code', es: 'Codigo postal' })}
                        value={addressForm.postal_code}
                        placeholder="H2X 1Y4"
                        onChange={v => setAddressForm(a => ({ ...a, postal_code: v }))}
                      />
                      <FormInput
                        icon={MapPin}
                        label={tx({ fr: 'Pays', en: 'Country', es: 'Pais' })}
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
                      {tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
                    </button>
                  </form>
                )}

                {/* -- SECURITY TAB -- */}
                {activeTab === 'security' && (
                  <div className="rounded-2xl border border-purple-main/30 p-6 md:p-8 card-bg card-shadow">
                    {/* Password section */}
                    <div className="mb-6">
                      <h3 className="text-heading font-semibold text-sm mb-4 flex items-center gap-2">
                        <Lock size={16} className="text-accent" />
                        {tx({ fr: 'Mot de passe', en: 'Password', es: 'Contrasena' })}
                      </h3>

                      {changingPassword ? (
                        <form onSubmit={handlePasswordChange} className="max-w-sm space-y-4">
                          <div>
                            <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1.5 block">
                              {tx({ fr: 'Nouveau mot de passe', en: 'New password', es: 'Nueva contrasena' })}
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
                              {tx({ fr: 'Confirmer', en: 'Confirm', es: 'Confirmar' })}
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
                              <Check size={14} /> {tx({ fr: 'Mot de passe mis a jour!', en: 'Password updated!', es: 'Contrasena actualizada!' })}
                            </p>
                          )}
                          <div className="flex gap-3 pt-1">
                            <button type="submit" disabled={pwdLoading} className="btn-primary text-sm py-2 px-6">
                              {pwdLoading ? '...' : tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setChangingPassword(false); setPwdError(''); setNewPassword(''); setConfirmPwd(''); }}
                              className="text-grey-muted hover:text-heading text-sm transition-colors"
                            >
                              {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-heading text-sm">--------</p>
                            <p className="text-grey-muted text-xs mt-1">
                              {tx({ fr: 'Change ton mot de passe regulierement pour securiser ton compte.', en: 'Change your password regularly to secure your account.', es: 'Cambia tu contrasena regularmente para proteger tu cuenta.' })}
                            </p>
                          </div>
                          <button
                            onClick={() => setChangingPassword(true)}
                            className="text-accent hover:text-accent/80 transition-colors text-sm font-medium flex items-center gap-1.5"
                          >
                            <Pencil size={14} />
                            {tx({ fr: 'Modifier', en: 'Edit', es: 'Editar' })}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Email section */}
                    <div className="pt-6 border-t border-purple-main/10">
                      <h3 className="text-heading font-semibold text-sm mb-2 flex items-center gap-2">
                        <Mail size={16} className="text-accent" />
                        {tx({ fr: 'Email du compte', en: 'Account email', es: 'Correo de la cuenta' })}
                      </h3>
                      <p className="text-heading text-sm">{user?.email}</p>
                      <p className="text-grey-muted text-xs mt-1">
                        {tx({ fr: 'L\'email est utilise pour la connexion et les notifications de commande.', en: 'Email is used for login and order notifications.', es: 'El correo se usa para iniciar sesion y notificaciones de pedidos.' })}
                      </p>
                    </div>

                    {/* Danger zone */}
                    <div className="pt-6 mt-6 border-t border-red-500/10">
                      <h3 className="text-red-400/70 font-semibold text-sm mb-2 flex items-center gap-2">
                        <Shield size={16} />
                        {tx({ fr: 'Zone danger', en: 'Danger zone', es: 'Zona de peligro' })}
                      </h3>
                      <p className="text-grey-muted text-xs mb-3">
                        {tx({
                          fr: 'Deconnexion de tous les appareils.',
                          en: 'Sign out from all devices.',
                          es: 'Cerrar sesion en todos los dispositivos.',
                        })}
                      </p>
                      <button
                        onClick={signOut}
                        className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={14} />
                        {tx({ fr: 'Se deconnecter', en: 'Sign out', es: 'Cerrar sesion' })}
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
