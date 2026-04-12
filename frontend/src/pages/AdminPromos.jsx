import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Plus, X, Save, Loader2, Trash2, Pencil,
  CheckCircle, XCircle, Clock, Hash, Percent, Search,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

const EMPTY_FORM = {
  code: '',
  discountPercent: 10,
  label: '',
  active: true,
  expiresAt: '',
  maxUses: 0,
};

function AdminPromos() {
  const { tx, lang } = useLang();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPromos = useCallback(async () => {
    try {
      const res = await api.get('/promo-codes');
      setPromos(res.data?.data || []);
    } catch (err) {
      console.error('Erreur chargement promos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      code: p.code || '',
      discountPercent: p.discountPercent || 10,
      label: p.label || '',
      active: p.active !== false,
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 16) : '',
      maxUses: p.maxUses || 0,
    });
    setEditingId(p.documentId);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.label || !form.discountPercent) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        discountPercent: Number(form.discountPercent),
        label: form.label,
        active: form.active,
        expiresAt: form.expiresAt || null,
        maxUses: Number(form.maxUses) || 0,
      };
      if (editingId) {
        await api.put(`/promo-codes/${editingId}`, payload);
      } else {
        await api.post('/promo-codes', payload);
      }
      setShowForm(false);
      setEditingId(null);
      fetchPromos();
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p) => {
    try {
      await api.put(`/promo-codes/${p.documentId}`, { active: !p.active });
      fetchPromos();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(tx({ fr: `Supprimer le code "${p.code}"?`, en: `Delete code "${p.code}"?`, es: `Eliminar codigo "${p.code}"?` }))) return;
    try {
      await api.delete(`/promo-codes/${p.documentId}`);
      fetchPromos();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleResetUses = async (p) => {
    try {
      await api.put(`/promo-codes/${p.documentId}`, { currentUses: 0 });
      fetchPromos();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const isExpired = (p) => p.expiresAt && new Date(p.expiresAt) < new Date();
  const isMaxedOut = (p) => p.maxUses > 0 && (p.currentUses || 0) >= p.maxUses;

  const filtered = promos.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.code?.toLowerCase().includes(q) || p.label?.toLowerCase().includes(q);
  });

  const activeCount = promos.filter(p => p.active && !isExpired(p) && !isMaxedOut(p)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-heading flex items-center gap-2">
          <Tag size={24} className="text-accent" />
          {tx({ fr: 'Codes Promo', en: 'Promo Codes', es: 'Codigos Promo' })}
        </h2>
        <button onClick={openNew} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} />
          {tx({ fr: 'Nouveau code', en: 'New code', es: 'Nuevo codigo' })}
        </button>
      </div>

      {/* Mini tuto */}
      <div className="rounded-xl p-4 card-bg border border-white/5 text-sm text-grey-muted space-y-2">
        <p className="text-heading font-semibold text-base">
          {tx({ fr: 'Comment ca marche', en: 'How it works', es: 'Como funciona' })}
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-[13px] leading-relaxed">
          <li>{tx({
            fr: 'Clique "Nouveau code" pour creer un code promo (ex: NOEL25 pour 25% de rabais)',
            en: 'Click "New code" to create a promo code (e.g. XMAS25 for 25% off)',
            es: 'Clic "Nuevo codigo" para crear un codigo promo (ej: NAVIDAD25 para 25% de descuento)',
          })}</li>
          <li>{tx({
            fr: 'Le code est automatiquement en MAJUSCULES. Tu peux ajouter une date d\'expiration et une limite d\'utilisations.',
            en: 'The code is automatically UPPERCASE. You can add an expiry date and a usage limit.',
            es: 'El codigo se convierte automaticamente a MAYUSCULAS. Puedes agregar fecha de expiracion y limite de usos.',
          })}</li>
          <li>{tx({
            fr: 'Le client entre le code dans son panier avant de payer. Le rabais est applique automatiquement sur le total.',
            en: 'The customer enters the code in their cart before paying. The discount is applied automatically to the total.',
            es: 'El cliente ingresa el codigo en su carrito antes de pagar. El descuento se aplica automaticamente.',
          })}</li>
          <li>{tx({
            fr: 'Le compteur d\'utilisations se met a jour a chaque fois qu\'un client utilise le code.',
            en: 'The usage counter updates each time a customer uses the code.',
            es: 'El contador de usos se actualiza cada vez que un cliente usa el codigo.',
          })}</li>
          <li>{tx({
            fr: 'Tu peux desactiver un code a tout moment avec le bouton vert (il devient gris). Le code reste dans la liste mais ne fonctionne plus au panier.',
            en: 'You can disable a code anytime with the green button (turns grey). The code stays in the list but no longer works in the cart.',
            es: 'Puedes desactivar un codigo con el boton verde (se vuelve gris). El codigo queda en la lista pero ya no funciona.',
          })}</li>
        </ol>
        <p className="text-[11px] text-grey-muted/60 pt-1">
          {tx({
            fr: 'Astuce: donne le code a un client ou partage-le sur tes reseaux. Il fonctionne sur tout le site (prints, stickers, merch).',
            en: 'Tip: give the code to a customer or share it on social media. It works on the entire site (prints, stickers, merch).',
            es: 'Consejo: dale el codigo a un cliente o compartelo en redes. Funciona en todo el sitio.',
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl p-4 card-bg text-center">
          <p className="text-2xl font-bold text-heading">{promos.length}</p>
          <p className="text-xs text-grey-muted">Total</p>
        </div>
        <div className="rounded-xl p-4 card-bg text-center">
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          <p className="text-xs text-grey-muted">{tx({ fr: 'Actifs', en: 'Active', es: 'Activos' })}</p>
        </div>
        <div className="rounded-xl p-4 card-bg text-center">
          <p className="text-2xl font-bold text-accent">{promos.reduce((s, p) => s + (p.currentUses || 0), 0)}</p>
          <p className="text-xs text-grey-muted">{tx({ fr: 'Utilisations totales', en: 'Total uses', es: 'Usos totales' })}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tx({ fr: 'Chercher par code ou description...', en: 'Search by code or label...', es: 'Buscar por codigo o etiqueta...' })}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-glass text-heading text-sm placeholder:text-grey-muted/50 focus:outline-none"
        />
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-6 card-bg overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-heading font-semibold flex items-center gap-2">
                {editingId ? <Pencil size={18} className="text-accent" /> : <Plus size={18} className="text-accent" />}
                {editingId
                  ? tx({ fr: 'Modifier le code promo', en: 'Edit promo code', es: 'Editar codigo promo' })
                  : tx({ fr: 'Nouveau code promo', en: 'New promo code', es: 'Nuevo codigo promo' })}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-grey-muted hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">Code *</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                  placeholder="EX: NOEL25, FRIEND10..."
                  className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none font-mono tracking-wider"
                />
              </div>
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">{tx({ fr: 'Rabais (%)', en: 'Discount (%)', es: 'Descuento (%)' })} *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.discountPercent}
                    onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-glass text-heading text-sm focus:outline-none"
                  />
                  <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted" />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">{tx({ fr: 'Description', en: 'Description', es: 'Descripcion' })} *</label>
              <input
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder={tx({ fr: 'Ex: Promo lancement, Ami de la maison...', en: 'Ex: Launch promo, Friend of the house...', es: 'Ej: Promo lanzamiento...' })}
                className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">
                  {tx({ fr: 'Expiration (optionnel)', en: 'Expiration (optional)', es: 'Expiracion (opcional)' })}
                </label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none"
                />
                <p className="text-[9px] text-grey-muted/60 mt-1">{tx({ fr: 'Vide = jamais', en: 'Empty = never', es: 'Vacio = nunca' })}</p>
              </div>
              <div>
                <label className="text-xs text-grey-muted uppercase tracking-wider mb-1 block">
                  {tx({ fr: 'Limite d\'utilisations', en: 'Usage limit', es: 'Limite de usos' })}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.maxUses}
                  onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none"
                />
                <p className="text-[9px] text-grey-muted/60 mt-1">{tx({ fr: '0 = illimite', en: '0 = unlimited', es: '0 = ilimitado' })}</p>
              </div>
            </div>

            {/* Preview */}
            {form.code && form.discountPercent > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-accent/5 border border-accent/20 flex items-center gap-3">
                <Tag size={18} className="text-accent flex-shrink-0" />
                <div>
                  <span className="font-mono text-accent font-bold tracking-wider">{form.code}</span>
                  <span className="text-grey-muted mx-2">-</span>
                  <span className="text-heading font-semibold">{form.discountPercent}%</span>
                  {form.label && <span className="text-grey-muted text-xs ml-2">({form.label})</span>}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.code || !form.label} className="btn-primary text-sm flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editingId
                  ? tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })
                  : tx({ fr: 'Creer le code', en: 'Create code', es: 'Crear codigo' })}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-outline text-sm">
                {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-grey-muted">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p>{tx({ fr: 'Aucun code promo', en: 'No promo codes', es: 'Sin codigos promo' })}</p>
          </div>
        ) : filtered.map(p => {
          const expired = isExpired(p);
          const maxed = isMaxedOut(p);
          const isValid = p.active && !expired && !maxed;

          return (
            <div key={p.documentId} className="rounded-xl card-bg p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Info gauche */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${isValid ? 'bg-green-500/10' : 'bg-grey-muted/10'}`}>
                    <Tag size={18} className={isValid ? 'text-green-400' : 'text-grey-muted'} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-heading font-bold text-sm tracking-wider">{p.code}</span>
                      <span className="text-accent font-semibold text-sm">-{p.discountPercent}%</span>
                      {!p.active && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-grey-muted/20 text-grey-muted font-semibold uppercase">
                          {tx({ fr: 'Inactif', en: 'Inactive', es: 'Inactivo' })}
                        </span>
                      )}
                      {expired && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold uppercase">
                          {tx({ fr: 'Expire', en: 'Expired', es: 'Expirado' })}
                        </span>
                      )}
                      {maxed && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold uppercase">
                          {tx({ fr: 'Limite atteinte', en: 'Limit reached', es: 'Limite alcanzado' })}
                        </span>
                      )}
                    </div>
                    <p className="text-grey-muted text-xs truncate">{p.label}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-grey-muted/70">
                      <span className="flex items-center gap-1">
                        <Hash size={10} />
                        {p.currentUses || 0}{p.maxUses > 0 ? `/${p.maxUses}` : ''} {tx({ fr: 'utilisation(s)', en: 'use(s)', es: 'uso(s)' })}
                      </span>
                      {p.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {expired ? tx({ fr: 'Expire le', en: 'Expired', es: 'Expirado' }) : tx({ fr: 'Expire le', en: 'Expires', es: 'Expira' })}{' '}
                          {new Date(p.expiresAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions droite */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(p)}
                    className={`p-2 rounded-lg transition-colors ${p.active ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-grey-muted/10 text-grey-muted hover:bg-grey-muted/20'}`}
                    title={p.active ? 'Desactiver' : 'Activer'}
                  >
                    {p.active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </button>
                  {p.currentUses > 0 && (
                    <button
                      onClick={() => handleResetUses(p)}
                      className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                      title={tx({ fr: 'Remettre compteur a 0', en: 'Reset counter', es: 'Restablecer contador' })}
                    >
                      <Hash size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminPromos;
