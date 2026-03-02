import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Building2, Package, LogOut, Loader2, Check, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Shield, Pencil, Save } from 'lucide-react';
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

function Account() {
  const { t, lang } = useLang();
  const { user, signOut, updateProfile, updatePassword } = useAuth();
  const isFr = lang === 'fr';
  const meta = user?.user_metadata || {};

  // Tabs
  const [activeTab, setActiveTab] = useState('profile');

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
    { id: 'profile', label: isFr ? 'Mon profil' : 'My Profile', icon: User },
    { id: 'orders', label: isFr ? 'Commandes' : 'Orders', icon: Package },
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

  return (
    <>
      <SEO title={`${t('account.title')} - Massive Medias`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading">{t('account.title')}</h1>
              <button onClick={signOut} className="flex items-center gap-2 text-grey-muted hover:text-red-400 transition-colors text-sm">
                <LogOut size={16} />
                {t('auth.logout')}
              </button>
            </div>

            {/* Welcome line */}
            <p className="text-grey-muted mb-8">
              {isFr ? 'Bonjour' : 'Hello'} <span className="text-heading font-medium">{meta.full_name || user?.email}</span>
            </p>

            {/* Tab navigation */}
            <div className="flex gap-1 mb-8 border-b border-purple-main/20 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
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

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >

                {/* ── PROFILE TAB ── */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileSave} className="rounded-2xl border border-purple-main/30 p-6 md:p-8 card-bg card-shadow">
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
                        <p className="text-grey-muted mb-1">{t('account.noOrders')}</p>
                        <p className="text-grey-muted/60 text-sm">
                          {isFr ? 'Tes commandes apparaitront ici.' : 'Your orders will appear here.'}
                        </p>
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
                                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-grey-muted">
                                    {order.designReady !== undefined && (
                                      <span>{isFr ? 'Design pret' : 'Design ready'}: {order.designReady ? (isFr ? 'Oui' : 'Yes') : (isFr ? 'Non' : 'No')}</span>
                                    )}
                                    <span>{isFr ? 'Devise' : 'Currency'}: {(order.currency || 'cad').toUpperCase()}</span>
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
                                placeholder="••••••••"
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
                              placeholder="••••••••"
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
                            <p className="text-heading text-sm">••••••••</p>
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
