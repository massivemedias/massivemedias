import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Building2, Package, LogOut, Loader2, Pencil, Check, X, Lock, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
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

// Editable field row component
function ProfileField({ icon: Icon, label, value, onSave, type = 'text', placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-purple-main/10 last:border-0">
      <Icon size={16} className="text-grey-muted flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="text-xs text-grey-muted mb-0.5">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type={type}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="input-field text-sm py-1.5"
              placeholder={placeholder}
              autoFocus
            />
            <button onClick={handleSave} disabled={saving} className="text-green-400 hover:text-green-300 transition-colors flex-shrink-0">
              <Check size={18} />
            </button>
            <button onClick={handleCancel} className="text-grey-muted hover:text-red-400 transition-colors flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        ) : (
          <p className="text-heading text-sm truncate">{value || <span className="text-grey-muted italic">-</span>}</p>
        )}
      </div>
      {!editing && (
        <button onClick={() => setEditing(true)} className="text-accent hover:text-accent/80 transition-colors text-xs font-medium flex-shrink-0">
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
}

function Account() {
  const { t, lang } = useLang();
  const { user, signOut, updateProfile, updatePassword } = useAuth();
  const isFr = lang === 'fr';

  const meta = user?.user_metadata || {};

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(false);

  // Password change
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Expanded order
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Save feedback
  const [saveMsg, setSaveMsg] = useState('');

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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

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

  const handleProfileSave = async (field, value) => {
    const { error } = await updateProfile({ [field]: value });
    if (error) {
      setSaveMsg(isFr ? 'Erreur lors de la sauvegarde.' : 'Error saving.');
    } else {
      setSaveMsg(isFr ? 'Sauvegarde!' : 'Saved!');
    }
    setTimeout(() => setSaveMsg(''), 2000);
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
      setTimeout(() => {
        setChangingPassword(false);
        setPwdSuccess(false);
      }, 2000);
    }
  };

  return (
    <>
      <SEO title={`${t('account.title')} - Massive Medias`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-4xl font-heading font-bold text-heading">{t('account.title')}</h1>
              <button onClick={signOut} className="flex items-center gap-2 text-grey-muted hover:text-red-400 transition-colors text-sm">
                <LogOut size={16} />
                {t('auth.logout')}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

              {/* Left column - Profile */}
              <div className="lg:col-span-2 space-y-6">

                {/* Identity */}
                <div className="rounded-2xl border border-purple-main/30 p-6 card-bg card-shadow">
                  <h2 className="text-lg font-heading font-bold text-heading mb-4 flex items-center gap-2">
                    <User size={18} className="text-accent" />
                    {t('account.profile')}
                  </h2>

                  {saveMsg && (
                    <p className="text-green-400 text-xs mb-3">{saveMsg}</p>
                  )}

                  <ProfileField
                    icon={User}
                    label={isFr ? 'Nom complet' : 'Full name'}
                    value={meta.full_name}
                    placeholder={isFr ? 'Ton nom' : 'Your name'}
                    onSave={v => handleProfileSave('full_name', v)}
                  />
                  <ProfileField
                    icon={Mail}
                    label={isFr ? 'Courriel' : 'Email'}
                    value={user?.email}
                    type="email"
                    placeholder="email@example.com"
                    onSave={v => handleProfileSave('email', v)}
                  />
                  <ProfileField
                    icon={Phone}
                    label={isFr ? 'Telephone' : 'Phone'}
                    value={meta.phone}
                    type="tel"
                    placeholder="514-xxx-xxxx"
                    onSave={v => handleProfileSave('phone', v)}
                  />
                  <ProfileField
                    icon={Building2}
                    label={isFr ? 'Entreprise' : 'Company'}
                    value={meta.company}
                    placeholder={isFr ? 'Nom de l\'entreprise' : 'Company name'}
                    onSave={v => handleProfileSave('company', v)}
                  />

                  {/* Password */}
                  <div className="pt-3 mt-1">
                    {changingPassword ? (
                      <form onSubmit={handlePasswordChange} className="space-y-3">
                        <p className="text-xs text-grey-muted mb-1">{isFr ? 'Nouveau mot de passe' : 'New password'}</p>
                        <div className="relative">
                          <input
                            type={showPwd ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="input-field text-sm py-1.5"
                            placeholder="••••••••"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-grey-muted"
                          >
                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <input
                          type={showPwd ? 'text' : 'password'}
                          value={confirmPwd}
                          onChange={e => setConfirmPwd(e.target.value)}
                          className="input-field text-sm py-1.5"
                          placeholder={isFr ? 'Confirmer' : 'Confirm'}
                          required
                          minLength={6}
                        />
                        {pwdError && <p className="text-red-400 text-xs">{pwdError}</p>}
                        {pwdSuccess && <p className="text-green-400 text-xs">{isFr ? 'Mot de passe mis a jour!' : 'Password updated!'}</p>}
                        <div className="flex gap-2">
                          <button type="submit" disabled={pwdLoading} className="btn-primary text-xs py-1.5 px-4">
                            {pwdLoading ? '...' : (isFr ? 'Sauvegarder' : 'Save')}
                          </button>
                          <button type="button" onClick={() => { setChangingPassword(false); setPwdError(''); }} className="text-grey-muted hover:text-heading text-xs">
                            {isFr ? 'Annuler' : 'Cancel'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center gap-4 py-3">
                        <Lock size={16} className="text-grey-muted flex-shrink-0" />
                        <div className="flex-grow">
                          <p className="text-xs text-grey-muted mb-0.5">{isFr ? 'Mot de passe' : 'Password'}</p>
                          <p className="text-heading text-sm">••••••••</p>
                        </div>
                        <button onClick={() => setChangingPassword(true)} className="text-accent hover:text-accent/80 transition-colors text-xs font-medium flex-shrink-0">
                          <Pencil size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="rounded-2xl border border-purple-main/30 p-6 card-bg card-shadow">
                  <h2 className="text-lg font-heading font-bold text-heading mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-accent" />
                    {isFr ? 'Adresse' : 'Address'}
                  </h2>
                  <ProfileField
                    icon={MapPin}
                    label={isFr ? 'Adresse' : 'Street address'}
                    value={meta.address}
                    placeholder={isFr ? '123 rue Exemple' : '123 Example St'}
                    onSave={v => handleProfileSave('address', v)}
                  />
                  <ProfileField
                    icon={MapPin}
                    label={isFr ? 'Ville' : 'City'}
                    value={meta.city}
                    placeholder={isFr ? 'Montreal' : 'Montreal'}
                    onSave={v => handleProfileSave('city', v)}
                  />
                  <ProfileField
                    icon={MapPin}
                    label={isFr ? 'Province / Etat' : 'Province / State'}
                    value={meta.province}
                    placeholder="QC"
                    onSave={v => handleProfileSave('province', v)}
                  />
                  <ProfileField
                    icon={MapPin}
                    label={isFr ? 'Code postal' : 'Postal code'}
                    value={meta.postal_code}
                    placeholder="H2X 1Y4"
                    onSave={v => handleProfileSave('postal_code', v)}
                  />
                </div>
              </div>

              {/* Right column - Orders */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-purple-main/30 p-6 card-bg card-shadow">
                  <h2 className="text-lg font-heading font-bold text-heading mb-6 flex items-center gap-2">
                    <Package size={18} className="text-accent" />
                    {t('account.orders')}
                  </h2>

                  {ordersLoading ? (
                    <div className="flex items-center gap-3 text-grey-muted py-8 justify-center">
                      <Loader2 size={18} className="animate-spin" />
                      <span>{isFr ? 'Chargement...' : 'Loading...'}</span>
                    </div>
                  ) : ordersError ? (
                    <p className="text-grey-muted text-center py-8">{isFr ? 'Erreur au chargement des commandes.' : 'Error loading orders.'}</p>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package size={40} className="text-grey-muted/30 mx-auto mb-3" />
                      <p className="text-grey-muted">{t('account.noOrders')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => {
                        const isExpanded = expandedOrder === (order.documentId || order.id);
                        return (
                          <div
                            key={order.documentId || order.id}
                            className="rounded-xl bg-glass overflow-hidden"
                          >
                            {/* Order header - clickable */}
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : (order.documentId || order.id))}
                              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-heading font-semibold text-sm">
                                    {formatDate(order.createdAt)}
                                  </p>
                                  <p className="text-grey-muted text-xs">
                                    {order.items?.length || 0} {(order.items?.length || 0) > 1 ? (isFr ? 'articles' : 'items') : (isFr ? 'article' : 'item')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-grey-500/20 text-grey-400'}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                                <span className="text-heading font-bold text-sm">
                                  {((order.total || 0) / 100).toFixed(2)}$
                                </span>
                                {isExpanded ? <ChevronUp size={16} className="text-grey-muted" /> : <ChevronDown size={16} className="text-grey-muted" />}
                              </div>
                            </button>

                            {/* Expanded details */}
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="border-t border-purple-main/10 px-4 pb-4"
                              >
                                {/* Items list */}
                                {order.items && (
                                  <div className="mt-3 space-y-2">
                                    {order.items.map((item, i) => (
                                      <div key={i} className="flex items-center gap-3 py-2">
                                        {item.image && (
                                          <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                        )}
                                        <div className="flex-grow min-w-0">
                                          <p className="text-heading text-sm font-medium truncate">{item.productName}</p>
                                          <p className="text-grey-muted text-xs">
                                            {[item.finish, item.shape, item.size, `${item.quantity}x`].filter(Boolean).join(' - ')}
                                          </p>
                                          {item.notes && (
                                            <p className="text-grey-muted text-xs mt-0.5 italic">"{item.notes}"</p>
                                          )}
                                        </div>
                                        <span className="text-heading text-sm font-medium flex-shrink-0">{item.totalPrice}$</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Order notes */}
                                {order.notes && (
                                  <div className="mt-3 p-3 rounded-lg bg-purple-main/10">
                                    <p className="text-xs text-grey-muted mb-1">{isFr ? 'Notes' : 'Notes'}</p>
                                    <p className="text-heading text-xs whitespace-pre-wrap">{order.notes}</p>
                                  </div>
                                )}

                                {/* Order meta */}
                                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-grey-muted">
                                  {order.designReady !== undefined && (
                                    <span>
                                      {isFr ? 'Design pret' : 'Design ready'}: {order.designReady ? (isFr ? 'Oui' : 'Yes') : (isFr ? 'Non' : 'No')}
                                    </span>
                                  )}
                                  <span>
                                    {isFr ? 'Devise' : 'Currency'}: {(order.currency || 'cad').toUpperCase()}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Account;
