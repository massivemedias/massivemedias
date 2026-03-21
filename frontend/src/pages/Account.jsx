import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useSearchParams } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Building2, Package, LogOut, Loader2, Check, Lock,
  Eye, EyeOff, ChevronDown, ChevronUp, Shield, Pencil, Save, ShoppingBag,
  ArrowRight, Gift, Copy, Heart, Clock, RotateCcw, MessageCircle, Download,
  Palette, Settings, Menu, X, Banknote, Receipt, BarChart3, DollarSign, Users, ScrollText, ImagePlus,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { getMyOrders } from '../services/orderService';
import { getContactSubmissions, getArtistSubmissions } from '../services/adminService';
import { getArtistMessagesAdmin } from '../services/artistService';
import { generateInvoicePDF } from '../utils/generateInvoice';
import AddressAutocomplete from '../components/AddressAutocomplete';
import artistsData from '../data/artists';

const AccountArtistDashboard = lazy(() => import('../components/AccountArtistDashboard'));

const PROVINCES_CA = [
  { code: 'QC', fr: 'Quebec', en: 'Quebec' },
  { code: 'ON', fr: 'Ontario', en: 'Ontario' },
  { code: 'BC', fr: 'Colombie-Britannique', en: 'British Columbia' },
  { code: 'AB', fr: 'Alberta', en: 'Alberta' },
  { code: 'MB', fr: 'Manitoba', en: 'Manitoba' },
  { code: 'SK', fr: 'Saskatchewan', en: 'Saskatchewan' },
  { code: 'NS', fr: 'Nouvelle-Ecosse', en: 'Nova Scotia' },
  { code: 'NB', fr: 'Nouveau-Brunswick', en: 'New Brunswick' },
  { code: 'NL', fr: 'Terre-Neuve-et-Labrador', en: 'Newfoundland and Labrador' },
  { code: 'PE', fr: 'Ile-du-Prince-Edouard', en: 'Prince Edward Island' },
  { code: 'NT', fr: 'Territoires du Nord-Ouest', en: 'Northwest Territories' },
  { code: 'YT', fr: 'Yukon', en: 'Yukon' },
  { code: 'NU', fr: 'Nunavut', en: 'Nunavut' },
];

const COUNTRIES = [
  { code: 'Canada', fr: 'Canada', en: 'Canada' },
  { code: 'US', fr: 'Etats-Unis', en: 'United States' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  processing: 'bg-blue-500/20 text-blue-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  refunded: 'bg-grey-500/20 text-grey-400',
};

function FormInput({ icon: Icon, label, value, onChange, type = 'text', placeholder, autoComplete }) {
  return (
    <div className="mb-5">
      <label className="flex items-center gap-2 text-xs text-grey-muted uppercase tracking-wider font-medium mb-2">
        <Icon size={15} />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field text-base"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function FormSelect({ icon: Icon, label, value, onChange, options, autoComplete }) {
  return (
    <div className="mb-5">
      <label className="flex items-center gap-2 text-xs text-grey-muted uppercase tracking-wider font-medium mb-2">
        <Icon size={15} />
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field text-base"
        autoComplete={autoComplete}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
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
  const { user, signOut, updateProfile, updatePassword, loading: authLoading } = useAuth();
  const { role: userRole, isAdmin, isArtist, artistSlug, loading: roleLoading } = useUserRole();
  const [searchParams] = useSearchParams();
  const meta = user?.user_metadata || {};

  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['profile', 'address', 'security', 'overview', 'orders', 'artist', 'dashboard', 'profil-artiste', 'contrat', 'tarifs', 'retrait', 'ventes'];
  const initialTab = (tabFromUrl && validTabs.includes(tabFromUrl)) ? tabFromUrl : (isAdmin ? 'profile' : isArtist ? 'dashboard' : 'overview');
  const [activeTab, setActiveTab] = useState(initialTab);
  const userChangedTab = useRef(false);

  // Wrapper pour tracker quand l'utilisateur change de tab manuellement
  const handleSetTab = (tab) => {
    userChangedTab.current = true;
    setActiveTab(tab);
  };

  // Reset tab SEULEMENT au premier chargement du role, PAS si l'user a deja clique
  useEffect(() => {
    if (isArtist && !tabFromUrl && !userChangedTab.current && (activeTab === 'overview' || activeTab === 'profile')) {
      setActiveTab('dashboard');
    }
  }, [isArtist]);

  // Sync tab when URL query changes (e.g. from admin sidebar links)
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
  const [artistMobileOpen, setArtistMobileOpen] = useState(false);

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

  // Menu items pour le sidebar admin
  const ADMIN_NAV_ITEMS = [
    { to: '/admin/commandes', icon: ShoppingBag, fr: 'Commandes', en: 'Orders', es: 'Pedidos' },
    { to: '/admin/commissions', icon: Banknote, fr: 'Commissions', en: 'Commissions', es: 'Comisiones' },
    { to: '/admin/inventaire', icon: Package, fr: 'Inventaire', en: 'Inventory', es: 'Inventario' },
    { to: '/admin/messages', icon: MessageCircle, fr: 'Messages', en: 'Messages', es: 'Mensajes' },
    { to: '/admin/utilisateurs', icon: Users, fr: 'Utilisateurs', en: 'Users', es: 'Usuarios' },
    { to: '/admin/depenses', icon: Receipt, fr: 'Dépenses', en: 'Expenses', es: 'Gastos' },
    { to: '/admin/stats', icon: BarChart3, fr: 'Stats', en: 'Stats', es: 'Stats' },
    { to: '/admin/tarifs', icon: DollarSign, fr: 'Tarifs', en: 'Pricing', es: 'Precios' },
  ];

  const ACCOUNT_SIDEBAR_ITEMS = [
    { id: 'profile', label: tx({ fr: 'Profil', en: 'Profile', es: 'Perfil' }), icon: Pencil },
    { id: 'address', label: tx({ fr: 'Adresse', en: 'Address', es: 'Direccion' }), icon: MapPin },
    { id: 'security', label: tx({ fr: 'Sécurité', en: 'Security', es: 'Seguridad' }), icon: Shield },
  ];

  const baseTabs = [
    { id: 'overview', label: tx({ fr: 'Tableau de bord', en: 'Dashboard', es: 'Panel' }), icon: User },
    { id: 'orders', label: tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' }), icon: Package },
    { id: 'profile', label: tx({ fr: 'Profil', en: 'Profile', es: 'Perfil' }), icon: Pencil },
    { id: 'address', label: tx({ fr: 'Adresse', en: 'Address', es: 'Direccion' }), icon: MapPin },
    { id: 'security', label: tx({ fr: 'Sécurité', en: 'Security', es: 'Seguridad' }), icon: Shield },
  ];

  // Tabs pour users non-admin
  const tabs = [...baseTabs];

  const [adminMobileOpen, setAdminMobileOpen] = useState(false);

  // Admin notification badge - count new messages
  const [adminNewMsgCount, setAdminNewMsgCount] = useState(0);
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function fetchNewCount() {
      try {
        const [contactRes, artistRes, artistMsgRes] = await Promise.all([
          getContactSubmissions({ pageSize: 200 }),
          getArtistSubmissions({ pageSize: 200 }),
          getArtistMessagesAdmin(),
        ]);
        const contacts = contactRes?.data?.data || [];
        const artists = artistRes?.data?.data || [];
        const artistMsgs = artistMsgRes?.data?.data || [];
        const newContacts = contacts.filter(c => (c.status || 'new') === 'new').length;
        const newArtists = artists.filter(a => (a.status || 'new') === 'new').length;
        const newArtistMsgs = artistMsgs.filter(m => (m.status || 'new') === 'new').length;
        if (!cancelled) setAdminNewMsgCount(newContacts + newArtists + newArtistMsgs);
      } catch { /* ignore */ }
    }
    fetchNewCount();
    const interval = setInterval(fetchNewCount, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAdmin]);

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
      setPwdError(tx({ fr: 'Minimum 6 caractères.', en: 'Minimum 6 characters.', es: 'Minimo 6 caracteres.' }));
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

  // --- Contenu partage: Profile, Address, Security ---
  const renderProfileContent = () => (
    <form onSubmit={handleProfileSave} className="rounded-2xl p-6 md:p-10 card-bg card-shadow">
      <h3 className="text-heading font-semibold text-lg mb-6 flex items-center gap-2">
        <User size={20} className="text-accent" />
        {tx({ fr: 'Informations personnelles', en: 'Personal information', es: 'Informacion personal' })}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <FormInput
          icon={User}
          label={tx({ fr: 'Nom complet', en: 'Full name', es: 'Nombre completo' })}
          value={profileForm.full_name}
          placeholder={tx({ fr: 'Ton nom', en: 'Your name', es: 'Tu nombre' })}
          onChange={v => setProfileForm(p => ({ ...p, full_name: v }))}
          autoComplete="name"
        />
        <FormInput
          icon={Phone}
          label={tx({ fr: 'Telephone', en: 'Phone', es: 'Telefono' })}
          value={profileForm.phone}
          type="tel"
          placeholder="514-xxx-xxxx"
          onChange={v => setProfileForm(p => ({ ...p, phone: v }))}
          autoComplete="tel"
        />
        <FormInput
          icon={Building2}
          label={tx({ fr: 'Entreprise', en: 'Company', es: 'Empresa' })}
          value={profileForm.company}
          placeholder={tx({ fr: 'Nom de l\'entreprise', en: 'Company name', es: 'Nombre de la empresa' })}
          onChange={v => setProfileForm(p => ({ ...p, company: v }))}
          autoComplete="organization"
        />
        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs text-grey-muted uppercase tracking-wider font-medium mb-2">
            <Mail size={15} />
            {tx({ fr: 'Courriel', en: 'Email', es: 'Correo' })}
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input-field text-base opacity-60 cursor-not-allowed"
          />
          <p className="text-grey-muted/50 text-[11px] mt-1">
            {tx({ fr: 'Le courriel ne peut pas être modifié ici.', en: 'Email cannot be changed here.', es: 'El correo no se puede cambiar aqui.' })}
          </p>
        </div>
      </div>
      <button type="submit" disabled={profileSaving} className="btn-primary text-base py-3 px-10 mt-3">
        {profileSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
        {tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
      </button>
    </form>
  );

  const renderAddressContent = () => (
    <form onSubmit={handleAddressSave} className="rounded-2xl p-6 md:p-10 card-bg card-shadow">
      <h3 className="text-heading font-semibold text-lg mb-6 flex items-center gap-2">
        <MapPin size={20} className="text-accent" />
        {tx({ fr: 'Adresse de livraison', en: 'Shipping address', es: 'Direccion de envio' })}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <div className="md:col-span-2 mb-5">
          <label className="flex items-center gap-2 text-xs text-grey-muted uppercase tracking-wider font-medium mb-2">
            <MapPin size={15} />
            {tx({ fr: 'Adresse', en: 'Street address', es: 'Direccion' })}
          </label>
          <AddressAutocomplete
            value={addressForm.address}
            onChange={v => setAddressForm(a => ({ ...a, address: v }))}
            onPlaceSelect={({ address, city, province, postalCode, country }) => {
              setAddressForm(a => ({
                ...a,
                address,
                city: city || a.city,
                province: province || a.province,
                postal_code: postalCode || a.postal_code,
                country: country === 'United States' ? 'US' : country || a.country,
              }));
            }}
            className="input-field text-base"
            placeholder={tx({ fr: '123 rue Exemple', en: '123 Example St', es: '123 Calle Ejemplo' })}
          />
        </div>
        <FormInput
          icon={MapPin}
          label={tx({ fr: 'Ville', en: 'City', es: 'Ciudad' })}
          value={addressForm.city}
          placeholder="Montreal"
          onChange={v => setAddressForm(a => ({ ...a, city: v }))}
          autoComplete="address-level2"
        />
        <FormSelect
          icon={MapPin}
          label={tx({ fr: 'Province / Etat', en: 'Province / State', es: 'Provincia / Estado' })}
          value={addressForm.province}
          onChange={v => setAddressForm(a => ({ ...a, province: v }))}
          autoComplete="address-level1"
          options={
            addressForm.country === 'Canada'
              ? [{ value: '', label: tx({ fr: 'Selectionner...', en: 'Select...', es: 'Seleccionar...' }) }, ...PROVINCES_CA.map(p => ({ value: p.code, label: lang === 'en' ? p.en : p.fr }))]
              : [{ value: '', label: tx({ fr: 'Selectionner...', en: 'Select...', es: 'Seleccionar...' }) }, { value: addressForm.province, label: addressForm.province || '...' }]
          }
        />
        <FormInput
          icon={MapPin}
          label={tx({ fr: 'Code postal', en: 'Postal code', es: 'Codigo postal' })}
          value={addressForm.postal_code}
          placeholder="H2X 1Y4"
          onChange={v => setAddressForm(a => ({ ...a, postal_code: v }))}
          autoComplete="postal-code"
        />
        <FormSelect
          icon={MapPin}
          label={tx({ fr: 'Pays', en: 'Country', es: 'Pais' })}
          value={addressForm.country}
          onChange={v => setAddressForm(a => ({ ...a, country: v, province: '' }))}
          autoComplete="country-name"
          options={[
            ...COUNTRIES.map(c => ({ value: c.code, label: lang === 'en' ? c.en : c.fr })),
            { value: 'other', label: tx({ fr: 'Autre', en: 'Other', es: 'Otro' }) },
          ]}
        />
      </div>
      <button type="submit" disabled={addressSaving} className="btn-primary text-base py-3 px-10 mt-3">
        {addressSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
        {tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
      </button>
    </form>
  );

  const renderSecurityContent = () => (
    <div className="rounded-2xl p-6 md:p-10 card-bg card-shadow">
      <div className="mb-8">
        <h3 className="text-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <Lock size={20} className="text-accent" />
          {tx({ fr: 'Mot de passe', en: 'Password', es: 'Contrasena' })}
        </h3>
        {changingPassword ? (
          <form onSubmit={handlePasswordChange} className="max-w-sm space-y-4">
            <div>
              <label className="text-xs text-grey-muted uppercase tracking-wider font-medium mb-2 block">
                {tx({ fr: 'Nouveau mot de passe', en: 'New password', es: 'Nueva contrasena' })}
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field text-base"
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
              <label className="text-xs text-grey-muted uppercase tracking-wider font-medium mb-2 block">
                {tx({ fr: 'Confirmer', en: 'Confirm', es: 'Confirmar' })}
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                className="input-field text-base"
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
              <p className="text-heading text-base">--------</p>
              <p className="text-grey-muted text-sm mt-1">
                {tx({ fr: 'Change ton mot de passe régulièrement pour sécuriser ton compte.', en: 'Change your password regularly to secure your account.', es: 'Cambia tu contrasena regularmente para proteger tu cuenta.' })}
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
      <div className="pt-6 shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
        <h3 className="text-heading font-semibold text-lg mb-3 flex items-center gap-2">
          <Mail size={20} className="text-accent" />
          {tx({ fr: 'Email du compte', en: 'Account email', es: 'Correo de la cuenta' })}
        </h3>
        <p className="text-heading text-base">{user?.email}</p>
        <p className="text-grey-muted text-sm mt-1">
          {tx({ fr: 'L\'email est utilisé pour la connexion et les notifications de commande.', en: 'Email is used for login and order notifications.', es: 'El correo se usa para iniciar sesion y notificaciones de pedidos.' })}
        </p>
      </div>
      <div className="pt-6 mt-6 shadow-[0_-1px_0_rgba(239,68,68,0.1)]">
        <h3 className="text-red-400/70 font-semibold text-base mb-2 flex items-center gap-2">
          <Shield size={18} />
          {tx({ fr: 'Zone danger', en: 'Danger zone', es: 'Zona de peligro' })}
        </h3>
        <p className="text-grey-muted text-sm mb-3">
          {tx({ fr: 'Déconnexion de tous les appareils.', en: 'Sign out from all devices.', es: 'Cerrar sesion en todos los dispositivos.' })}
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
  );

  const renderOrdersContent = () => (
    <div className="rounded-2xl p-6 md:p-8 card-bg card-shadow">
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
                    className="shadow-[0_-1px_0_rgba(255,255,255,0.04)] px-4 pb-4"
                  >
                    {order.items && (
                      <div className="mt-3 space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 py-2">
                            {item.image && <img src={item.image} alt={item.productName || ''} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
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
                      <button
                        onClick={() => generateInvoicePDF(order, 'receipt')}
                        className="flex items-center gap-1.5 text-accent font-medium hover:underline"
                      >
                        <Download size={12} />
                        {tx({ fr: 'Télécharger le reçu', en: 'Download receipt', es: 'Descargar recibo' })}
                      </button>
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
  );

  // Titre de la section active (admin sidebar)
  const getAdminSectionTitle = () => {
    const item = ACCOUNT_SIDEBAR_ITEMS.find(i => i.id === activeTab);
    return item ? item.label : tx({ fr: 'Mon compte', en: 'My account', es: 'Mi cuenta' });
  };

  // ============================================================
  // Attendre que le role soit resolu avant d'afficher le layout
  // (evite le flash overview -> dashboard sur refresh)
  // ============================================================
  if (authLoading || roleLoading) {
    return (
      <>
        <SEO title={`${t('account.title')} - Massive`} description="" noindex />
        <section className="section-container pt-28 pb-20 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </section>
      </>
    );
  }

  // ============================================================
  // ADMIN LAYOUT - sidebar style like /admin pages
  // ============================================================
  if (isAdmin) {
    return (
      <>
        <SEO title={`${t('account.title')} - Massive`} description="" noindex />
        <section className="section-container pt-28 pb-20 min-h-screen">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-accent">{initials}</span>
              </div>
              <div className="flex-grow min-w-0">
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                  {meta.full_name || firstName}
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
              <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-semibold flex-shrink-0">
                <LogOut size={16} />
                <span className="hidden sm:inline">{tx({ fr: 'Déconnexion', en: 'Sign out', es: 'Cerrar sesion' })}</span>
              </button>
            </div>
          </div>

          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between mb-4 max-w-7xl mx-auto">
            <h2 className="text-xl font-heading font-bold text-heading">{getAdminSectionTitle()}</h2>
            <button
              onClick={() => setAdminMobileOpen(!adminMobileOpen)}
              className="p-2 rounded-lg bg-glass text-heading"
            >
              {adminMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile nav */}
          {adminMobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden flex flex-wrap gap-2 mb-6 max-w-7xl mx-auto"
            >
              {ACCOUNT_SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { handleSetTab(item.id); setAdminMobileOpen(false); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                );
              })}
              <div className="w-full shadow-[0_-1px_0_rgba(255,255,255,0.04)] mt-1 pt-2" />
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isMessages = item.to === '/admin/messages';
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setAdminMobileOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-glass text-grey-muted hover:text-heading relative"
                  >
                    <Icon size={14} />
                    {tx({ fr: item.fr, en: item.en, es: item.es })}
                    {isMessages && adminNewMsgCount > 0 && (
                      <span className="ml-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[9px] font-bold animate-pulse">
                        {adminNewMsgCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </motion.div>
          )}

          <div className="flex gap-6 max-w-7xl mx-auto">
            {/* Sidebar desktop */}
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="sticky top-28 rounded-xl bg-glass p-3 space-y-1">
                <h2 className="text-xs font-semibold text-grey-muted uppercase tracking-wider px-3 py-2">
                  {tx({ fr: 'Mon compte', en: 'My account', es: 'Mi cuenta' })}
                </h2>
                {ACCOUNT_SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSetTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-accent/20 text-accent'
                          : 'text-grey-muted hover:text-heading hover:bg-glass'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}

                <div className="shadow-[0_-1px_0_rgba(255,255,255,0.04)] my-2" />

                <h2 className="text-xs font-semibold text-grey-muted uppercase tracking-wider px-3 py-2">
                  Admin
                </h2>
                {ADMIN_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isMessages = item.to === '/admin/messages';
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-grey-muted hover:text-heading hover:bg-glass relative"
                    >
                      <Icon size={16} />
                      {tx({ fr: item.fr, en: item.en, es: item.es })}
                      {isMessages && adminNewMsgCount > 0 && (
                        <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-[10px] font-bold animate-pulse">
                          {adminNewMsgCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              <h2 className="hidden lg:block text-3xl font-heading font-bold text-heading mb-6">
                {getAdminSectionTitle()}
              </h2>

              {/* Save feedback */}
              <AnimatePresence>
                {saveMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm flex items-center gap-2"
                  >
                    <Check size={16} />
                    {saveMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'profile' && renderProfileContent()}
                  {activeTab === 'address' && renderAddressContent()}
                  {activeTab === 'security' && renderSecurityContent()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </section>
      </>
    );
  }

  // ============================================================
  // ARTIST LAYOUT - sidebar style like admin
  // ============================================================
  const ARTIST_SIDEBAR_ITEMS = isArtist ? [
    { id: 'dashboard', label: tx({ fr: 'Tableau de bord', en: 'Dashboard', es: 'Panel' }), icon: Palette },
    { id: 'profil-artiste', label: tx({ fr: 'Page Artiste', en: 'Artist Page', es: 'Pagina Artista' }), icon: User },
    { id: 'contrat', label: tx({ fr: 'Contrat', en: 'Contract', es: 'Contrato' }), icon: ScrollText },
    { id: 'tarifs', label: tx({ fr: 'Tarifs Massive', en: 'Massive Pricing', es: 'Precios Massive' }), icon: Receipt },
    { id: 'ventes', label: tx({ fr: 'Mes ventes', en: 'My sales', es: 'Mis ventas' }), icon: BarChart3 },
    { id: 'retrait', label: tx({ fr: 'Retrait', en: 'Withdrawal', es: 'Retiro' }), icon: Banknote },
  ] : [];

  const artistValidTabs = ['dashboard', 'profil-artiste', 'contrat', 'tarifs', 'retrait', 'ventes', 'profile', 'address', 'security', 'orders'];

  const getArtistSectionTitle = () => {
    const artistItem = ARTIST_SIDEBAR_ITEMS.find(i => i.id === activeTab);
    if (artistItem) return artistItem.label;
    const accountItem = ACCOUNT_SIDEBAR_ITEMS.find(i => i.id === activeTab);
    if (accountItem) return accountItem.label;
    if (activeTab === 'orders') return tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' });
    return tx({ fr: 'Tableau de bord', en: 'Dashboard', es: 'Panel' });
  };

  if (isArtist) {
    const artistAvatar = artistSlug && artistsData[artistSlug]?.avatar;
    return (
      <>
        <SEO title={`${t('account.title')} - Massive`} description="" noindex />
        <section className="section-container pt-28 pb-20 min-h-screen">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex items-center gap-4">
              {artistAvatar ? (
                <img src={artistAvatar} alt={initials} className="w-11 h-11 rounded-full object-cover border-2 border-accent/40 flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-accent">{initials}</span>
                </div>
              )}
              <div className="flex-grow min-w-0">
                <p className="text-sm text-heading font-bold">{meta.full_name || user?.email?.split('@')[0] || ''}</p>
                <p className="text-xs text-grey-muted/60">
                  {user?.email}
                  {memberSince && (
                    <span className="ml-2">- {tx({ fr: 'Membre depuis', en: 'Member since', es: 'Miembro desde' })} {memberSince}</span>
                  )}
                </p>
              </div>
              <button onClick={signOut} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-semibold flex-shrink-0">
                <LogOut size={14} />
                <span className="hidden sm:inline">{tx({ fr: 'Déconnexion', en: 'Sign out', es: 'Cerrar sesion' })}</span>
              </button>
            </div>
          </div>

          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between mb-4 max-w-7xl mx-auto">
            <h2 className="text-xl font-heading font-bold text-heading">{getArtistSectionTitle()}</h2>
            <button
              onClick={() => setArtistMobileOpen(!artistMobileOpen)}
              className="p-2 rounded-lg bg-glass text-heading"
            >
              {artistMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile nav */}
          {artistMobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden flex flex-wrap gap-2 mb-6 max-w-7xl mx-auto"
            >
              {/* Mon compte en premier */}
              <button
                onClick={() => { handleSetTab('orders'); setArtistMobileOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'orders' ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
                }`}
              >
                <ShoppingBag size={14} />
                {tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' })}
              </button>
              {ACCOUNT_SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { handleSetTab(item.id); setArtistMobileOpen(false); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                );
              })}
              <div className="w-full shadow-[0_-1px_0_rgba(255,255,255,0.04)] mt-1 pt-2" />
              {/* Artiste */}
              {ARTIST_SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { handleSetTab(item.id); setArtistMobileOpen(false); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive ? 'bg-accent text-white' : 'bg-glass text-grey-muted hover:text-heading'
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                );
              })}
            </motion.div>
          )}

          <div className="flex gap-6 max-w-7xl mx-auto">
            {/* Sidebar desktop */}
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="sticky top-28 rounded-xl bg-glass p-3 space-y-1">
                {/* Mon compte EN PREMIER */}
                <h2 className="text-xs font-semibold text-grey-muted uppercase tracking-wider px-3 py-2">
                  {tx({ fr: 'Mon compte', en: 'My account', es: 'Mi cuenta' })}
                </h2>
                <button
                  onClick={() => handleSetTab('orders')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'orders'
                      ? 'bg-accent/20 text-accent'
                      : 'text-grey-muted hover:text-heading hover:bg-glass'
                  }`}
                >
                  <ShoppingBag size={16} />
                  {tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' })}
                  {orders.length > 0 && (
                    <span className="text-[10px] bg-accent/20 text-accent rounded-full px-1.5 py-0.5 font-bold ml-auto">{orders.length}</span>
                  )}
                </button>
                {ACCOUNT_SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSetTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-accent/20 text-accent'
                          : 'text-grey-muted hover:text-heading hover:bg-glass'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}

                <div className="shadow-[0_-1px_0_rgba(255,255,255,0.04)] my-2" />

                {/* Artiste EN SECOND */}
                <h2 className="text-xs font-semibold text-grey-muted uppercase tracking-wider px-3 py-2">
                  {tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' })}
                </h2>
                {ARTIST_SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSetTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-accent/20 text-accent'
                          : 'text-grey-muted hover:text-heading hover:bg-glass'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              <h2 className="hidden lg:block text-3xl font-heading font-bold text-heading mb-6">
                {getArtistSectionTitle()}
              </h2>

              {/* Save feedback */}
              <AnimatePresence>
                {saveMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm flex items-center gap-2"
                  >
                    <Check size={16} />
                    {saveMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Artist sections */}
                  {['dashboard', 'profil-artiste', 'contrat', 'tarifs', 'retrait', 'ventes'].includes(activeTab) && (
                    <Suspense fallback={<div className="flex items-center gap-2 text-grey-muted py-8 justify-center"><Loader2 size={16} className="animate-spin" /></div>}>
                      <AccountArtistDashboard section={activeTab} />
                    </Suspense>
                  )}
                  {activeTab === 'profile' && renderProfileContent()}
                  {activeTab === 'address' && renderAddressContent()}
                  {activeTab === 'security' && renderSecurityContent()}
                  {activeTab === 'orders' && renderOrdersContent()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </section>
      </>
    );
  }

  // ============================================================
  // REGULAR USER LAYOUT - tabs style (original)
  // ============================================================
  return (
    <>
      <SEO title={`${t('account.title')} - Massive`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* -- Header with Avatar -- */}
            <div className="flex items-center gap-4 mb-8">
              {(() => {
                const av = artistSlug && artistsData[artistSlug]?.avatar;
                return av ? (
                  <img src={av} alt={initials} className="w-11 h-11 rounded-full object-cover border-2 border-accent/40 flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-accent">{initials}</span>
                  </div>
                );
              })()}
              <div className="flex-grow min-w-0">
                <h1 className="text-lg font-heading font-bold text-heading">
                  {meta.full_name || user?.email?.split('@')[0] || ''}
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
              <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-semibold flex-shrink-0">
                <LogOut size={16} />
                <span className="hidden sm:inline">{tx({ fr: 'Déconnexion', en: 'Sign out', es: 'Cerrar sesion' })}</span>
              </button>
            </div>

            {/* -- Tab navigation -- */}
            <div className="flex gap-1 mb-8 shadow-[0_1px_0_rgba(255,255,255,0.04)] overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSetTab(tab.id)}
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
                  className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm flex items-center gap-2"
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
                          label: tx({ fr: 'Livrées', en: 'Delivered', es: 'Entregados' }),
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
                        <div key={i} className="rounded-xl p-4 card-bg card-shadow text-center">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stat.bgColor} mb-2`}>
                            <stat.icon size={18} className={stat.color} />
                          </div>
                          <p className="text-2xl font-bold text-heading">{stat.value}</p>
                          <p className="text-xs text-grey-muted mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Quick actions */}
                    <div className="rounded-2xl p-6 card-bg card-shadow">
                      <h3 className="text-heading font-semibold text-sm mb-4">
                        {tx({ fr: 'Actions rapides', en: 'Quick actions', es: 'Acciones rapidas' })}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Link
                          to="/boutique"
                          className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors group"
                        >
                          <ShoppingBag size={20} className="text-accent" />
                          <div className="flex-grow">
                            <p className="text-heading text-sm font-medium">{tx({ fr: 'Voir la boutique', en: 'Browse shop', es: 'Ver la tienda' })}</p>
                            <p className="text-grey-muted text-xs">{tx({ fr: 'Stickers, prints, merch', en: 'Stickers, prints, merch', es: 'Stickers, prints, merch' })}</p>
                          </div>
                          <ArrowRight size={16} className="text-accent md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {orders.length > 0 ? (
                          <button
                            onClick={() => handleSetTab('orders')}
                            className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 transition-colors group text-left"
                          >
                            <RotateCcw size={20} className="text-blue-400" />
                            <div className="flex-grow">
                              <p className="text-heading text-sm font-medium">{tx({ fr: 'Recommander', en: 'Reorder', es: 'Reordenar' })}</p>
                              <p className="text-grey-muted text-xs">{tx({ fr: 'Voir mes commandes', en: 'View my orders', es: 'Ver mis pedidos' })}</p>
                            </div>
                            <ArrowRight size={16} className="text-blue-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <Link
                            to="/boutique/stickers"
                            className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 transition-colors group"
                          >
                            <Heart size={20} className="text-purple-400" />
                            <div className="flex-grow">
                              <p className="text-heading text-sm font-medium">{tx({ fr: 'Populaire', en: 'Popular', es: 'Popular' })}</p>
                              <p className="text-grey-muted text-xs">{tx({ fr: 'Stickers custom', en: 'Custom stickers', es: 'Stickers personalizados' })}</p>
                            </div>
                            <ArrowRight size={16} className="text-purple-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                          </Link>
                        )}
                        <Link
                          to="/contact"
                          className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 hover:bg-green-500/10 transition-colors group"
                        >
                          <MessageCircle size={20} className="text-green-400" />
                          <div className="flex-grow">
                            <p className="text-heading text-sm font-medium">{tx({ fr: 'Support', en: 'Support', es: 'Soporte' })}</p>
                            <p className="text-grey-muted text-xs">{tx({ fr: 'On repond vite!', en: 'We reply fast!', es: 'Respondemos rapido!' })}</p>
                          </div>
                          <ArrowRight size={16} className="text-green-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </div>
                    </div>

                    {/* Referral + Recent orders side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Referral card */}
                      <div className="rounded-2xl p-6 card-bg card-shadow">
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
                            fr: 'Partage ton lien et reçois 10% de rabais sur ta prochaine commande quand ton ami commande.',
                            en: 'Share your link and get 10% off your next order when your friend orders.',
                            es: 'Comparte tu enlace y recibe 10% de descuento en tu proximo pedido cuando tu amigo ordene.',
                          })}
                        </p>
                        <button
                          onClick={handleCopyReferral}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
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
                      <div className="rounded-2xl p-6 card-bg card-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-heading font-semibold text-sm">
                            {tx({ fr: 'Commandes recentes', en: 'Recent orders', es: 'Pedidos recientes' })}
                          </h3>
                          {orders.length > 0 && (
                            <button
                              onClick={() => handleSetTab('orders')}
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
                              <div key={order.documentId || order.id} className="flex items-center justify-between py-2 shadow-[0_1px_0_rgba(255,255,255,0.03)] last:shadow-none">
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
                      <div className="rounded-xl bg-accent/5 p-5 flex items-center gap-4">
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
                          onClick={() => handleSetTab('profile')}
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
                {activeTab === 'profile' && renderProfileContent()}

                {/* -- ORDERS TAB -- */}
                {activeTab === 'orders' && renderOrdersContent()}

                {/* -- ADDRESS TAB -- */}
                {activeTab === 'address' && renderAddressContent()}

                {/* -- SECURITY TAB -- */}
                {activeTab === 'security' && renderSecurityContent()}

              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Account;
