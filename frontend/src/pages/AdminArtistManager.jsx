// AdminArtistManager - Hub "God Mode" admin : mutations directes sur les artistes
// et leurs oeuvres sans passer par le systeme de edit-requests (avril 2026).
//
// Routes backend utilisees :
//   GET    /admin/artists-list            - liste compacte
//   GET    /admin/artists-detail/:slug    - profil + oeuvres completes
//   PUT    /admin/artists-profile/:slug   - update profil (bio/socials/commission)
//   PUT    /admin/artists-item/:slug/:itemId   - update titre/prix d'une oeuvre
//   DELETE /admin/artists-item/:slug/:itemId   - hard delete oeuvre + images

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, Loader2, ChevronLeft, Trash2, Save, CheckCircle,
  XCircle, Image as ImageIcon, Pencil, DollarSign, Sparkles,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import {
  getAdminArtistsList, getAdminArtistDetail,
  updateAdminArtistProfile, updateAdminArtistItem, deleteAdminArtistItem,
} from '../services/adminService';

function AdminArtistManager() {
  const { tx } = useLang();

  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [artists, setArtists] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedSlug, setSelectedSlug] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Toast global (success / error) - auto dismiss
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.type === 'error' ? 6500 : 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const showSuccess = (message) => setToast({ type: 'success', message });
  const showError = (err) => {
    const msg = err?.response?.data?.error?.message
      || err?.response?.data?.message
      || err?.message
      || 'Erreur inconnue';
    setToast({ type: 'error', message: msg });
  };

  // ------- Liste -------
  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await getAdminArtistsList();
      setArtists(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      showError(err);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter(a =>
      (a.name || '').toLowerCase().includes(q)
      || (a.slug || '').toLowerCase().includes(q)
      || (a.email || '').toLowerCase().includes(q),
    );
  }, [artists, search]);

  // ------- Detail -------
  const loadDetail = useCallback(async (slug) => {
    setDetailLoading(true);
    try {
      const { data } = await getAdminArtistDetail(slug);
      setDetail(data?.data || null);
    } catch (err) {
      showError(err);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openArtist = (slug) => {
    setSelectedSlug(slug);
    setView('detail');
    setDetail(null);
    loadDetail(slug);
  };

  const backToList = () => {
    setView('list');
    setSelectedSlug(null);
    setDetail(null);
  };

  // ------- Profil: save partial -------
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState(null); // { [field]: value } patch
  useEffect(() => { setProfileDraft(null); }, [selectedSlug]);

  const handleProfileField = (field, value) => {
    setProfileDraft(prev => ({ ...(prev || {}), [field]: value }));
  };

  const saveProfile = async () => {
    if (!detail || !profileDraft || Object.keys(profileDraft).length === 0) return;
    setProfileSaving(true);
    try {
      await updateAdminArtistProfile(detail.slug, profileDraft);
      showSuccess(tx({
        fr: `Profil de ${detail.name} mis a jour.`,
        en: `${detail.name}'s profile updated.`,
        es: `Perfil de ${detail.name} actualizado.`,
      }));
      setProfileDraft(null);
      // Refresh detail pour refleter
      await loadDetail(detail.slug);
      loadList();
    } catch (err) {
      showError(err);
    } finally {
      setProfileSaving(false);
    }
  };

  // ------- Items: edit + delete -------
  const [editingItem, setEditingItem] = useState(null); // { id, category, titleFr, customPrice }
  const [itemSaving, setItemSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const openEditItem = (item, category) => {
    setEditingItem({
      id: item.id,
      category,
      titleFr: item.titleFr || item.titleEn || '',
      customPrice: item.customPrice != null ? String(item.customPrice) : '',
    });
  };

  const saveItem = async () => {
    if (!editingItem || !detail) return;
    const patch = {
      category: editingItem.category,
      titleFr: editingItem.titleFr,
      titleEn: editingItem.titleFr, // miroir par defaut pour simplifier
    };
    if (editingItem.customPrice !== '' && editingItem.customPrice != null) {
      const p = parseFloat(String(editingItem.customPrice).replace(',', '.'));
      if (!Number.isFinite(p) || p < 0) {
        showError(new Error('Prix invalide'));
        return;
      }
      patch.customPrice = p;
    }
    setItemSaving(true);
    try {
      await updateAdminArtistItem(detail.slug, editingItem.id, patch);
      showSuccess(tx({
        fr: `Oeuvre ${editingItem.id} mise a jour.`,
        en: `Item ${editingItem.id} updated.`,
        es: `Obra ${editingItem.id} actualizada.`,
      }));
      setEditingItem(null);
      await loadDetail(detail.slug);
    } catch (err) {
      showError(err);
    } finally {
      setItemSaving(false);
    }
  };

  const deleteItem = async (item, category) => {
    if (!detail) return;
    const label = item.titleFr || item.titleEn || item.id;
    const confirmMsg = tx({
      fr: `Supprimer DEFINITIVEMENT l'oeuvre "${label}" (${item.id}) de ${detail.name} ?\n\nL'image sera aussi supprimee du stockage cloud.\nCette action est irreversible.`,
      en: `PERMANENTLY delete "${label}" (${item.id}) from ${detail.name}?\n\nThe image will also be deleted from cloud storage.\nThis cannot be undone.`,
      es: `Eliminar DEFINITIVAMENTE "${label}" (${item.id}) de ${detail.name}?\n\nLa imagen tambien se eliminara del almacenamiento.\nEsta accion es irreversible.`,
    });
    if (!window.confirm(confirmMsg)) return;

    setDeletingItem(item.id);
    try {
      await deleteAdminArtistItem(detail.slug, item.id, category);
      showSuccess(tx({
        fr: `"${label}" supprimee definitivement.`,
        en: `"${label}" permanently deleted.`,
        es: `"${label}" eliminada definitivamente.`,
      }));
      await loadDetail(detail.slug);
      loadList();
    } catch (err) {
      showError(err);
    } finally {
      setDeletingItem(null);
    }
  };

  // ================= RENDER =================

  const ToastView = (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 border ${
            toast.type === 'success'
              ? 'bg-green-600/95 border-green-400/60'
              : 'bg-red-600/95 border-red-400/60'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle size={20} className="text-white flex-shrink-0 mt-0.5" />
            : <XCircle size={20} className="text-white flex-shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">
              {toast.type === 'success'
                ? tx({ fr: 'Succes', en: 'Success', es: 'Exito' })
                : tx({ fr: 'Erreur', en: 'Error', es: 'Error' })}
            </p>
            <p className="text-white/90 text-xs mt-0.5 whitespace-pre-wrap">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white"><XCircle size={16} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ----- Vue Liste -----
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {ToastView}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-accent" />
            <h2 className="text-xl font-heading font-bold text-heading">
              {tx({ fr: 'Gestion Artistes (God Mode)', en: 'Artist Management (God Mode)', es: 'Gestion Artistas' })}
            </h2>
          </div>
          <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/30">
            {tx({
              fr: 'Mutations DIRECTES, bypass edit-requests. A utiliser avec prudence.',
              en: 'DIRECT mutations, bypasses edit-requests. Use with caution.',
              es: 'Mutaciones DIRECTAS. Usar con precaucion.',
            })}
          </span>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx({ fr: 'Chercher un artiste...', en: 'Search artist...', es: 'Buscar artista...' })}
            className="input-field text-sm w-full pl-9"
          />
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-grey-muted py-12">
            {tx({ fr: 'Aucun artiste.', en: 'No artists.', es: 'Sin artistas.' })}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(a => (
              <button
                key={a.documentId}
                onClick={() => openArtist(a.slug)}
                className="text-left card-bg rounded-xl p-4 hover:bg-accent/5 transition-colors border border-white/5 hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-heading font-semibold text-base">{a.name}</h3>
                    <p className="text-grey-muted text-xs">{a.slug}</p>
                  </div>
                  {!a.active && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                      {tx({ fr: 'Inactif', en: 'Inactive', es: 'Inactivo' })}
                    </span>
                  )}
                </div>
                {a.email && <p className="text-xs text-grey-muted truncate">{a.email}</p>}
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-heading">
                    <ImageIcon size={11} className="text-accent" />
                    {a.printsCount} {tx({ fr: 'prints', en: 'prints', es: 'prints' })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-heading">
                    <Sparkles size={11} className="text-purple-400" />
                    {a.stickersCount} {tx({ fr: 'stickers', en: 'stickers', es: 'stickers' })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-grey-muted ml-auto">
                    <DollarSign size={11} />
                    {Math.round((a.commissionRate ?? 0.5) * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ----- Vue Detail -----
  return (
    <div className="space-y-6">
      {ToastView}

      <button
        onClick={backToList}
        className="inline-flex items-center gap-1.5 text-grey-muted hover:text-heading text-sm"
      >
        <ChevronLeft size={14} /> {tx({ fr: 'Retour', en: 'Back', es: 'Volver' })}
      </button>

      {detailLoading || !detail ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-heading font-bold text-heading">{detail.name}</h2>
              <p className="text-grey-muted text-sm">/artistes/{detail.slug}</p>
              {detail.email && <p className="text-grey-muted text-xs mt-1">{detail.email}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded ${detail.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {detail.active ? tx({ fr: 'Actif', en: 'Active', es: 'Activo' }) : tx({ fr: 'Inactif', en: 'Inactive', es: 'Inactivo' })}
              </span>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                {tx({ fr: 'Commission', en: 'Commission', es: 'Comision' })}: {Math.round((detail.commissionRate ?? 0.5) * 100)}%
              </span>
            </div>
          </div>

          {/* Profil editable */}
          <div className="card-bg rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-heading font-semibold text-sm uppercase tracking-wider">
                {tx({ fr: 'Profil', en: 'Profile', es: 'Perfil' })}
              </h3>
              {profileDraft && Object.keys(profileDraft).length > 0 && (
                <button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 disabled:opacity-50"
                >
                  {profileSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InputField label="Nom" value={profileDraft?.name ?? detail.name} onChange={v => handleProfileField('name', v)} />
              <InputField label="Email" value={profileDraft?.email ?? detail.email} onChange={v => handleProfileField('email', v)} />
              <InputField label="Tagline FR" value={profileDraft?.taglineFr ?? detail.taglineFr} onChange={v => handleProfileField('taglineFr', v)} />
              <InputField label="Tagline EN" value={profileDraft?.taglineEn ?? detail.taglineEn} onChange={v => handleProfileField('taglineEn', v)} />
              <TextareaField label="Bio FR" value={profileDraft?.bioFr ?? detail.bioFr} onChange={v => handleProfileField('bioFr', v)} />
              <TextareaField label="Bio EN" value={profileDraft?.bioEn ?? detail.bioEn} onChange={v => handleProfileField('bioEn', v)} />
              <InputField
                label={tx({ fr: 'Commission (0.0 - 1.0)', en: 'Commission (0.0 - 1.0)', es: 'Comision (0.0 - 1.0)' })}
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={profileDraft?.commissionRate ?? detail.commissionRate ?? 0.5}
                onChange={v => handleProfileField('commissionRate', parseFloat(v))}
              />
              <div>
                <label className="text-xs text-grey-muted block mb-1">{tx({ fr: 'Actif', en: 'Active', es: 'Activo' })}</label>
                <select
                  value={(profileDraft?.active ?? detail.active) ? 'true' : 'false'}
                  onChange={e => handleProfileField('active', e.target.value === 'true')}
                  className="input-field text-sm w-full"
                >
                  <option value="true">{tx({ fr: 'Oui', en: 'Yes', es: 'Si' })}</option>
                  <option value="false">{tx({ fr: 'Non', en: 'No', es: 'No' })}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Oeuvres - Prints */}
          <ItemsGrid
            category="prints"
            items={detail.prints}
            onEdit={(it) => openEditItem(it, 'prints')}
            onDelete={(it) => deleteItem(it, 'prints')}
            deletingItemId={deletingItem}
            tx={tx}
          />

          {/* Oeuvres - Stickers */}
          <ItemsGrid
            category="stickers"
            items={detail.stickers}
            onEdit={(it) => openEditItem(it, 'stickers')}
            onDelete={(it) => deleteItem(it, 'stickers')}
            deletingItemId={deletingItem}
            tx={tx}
          />

          {/* Edit item modal */}
          <AnimatePresence>
            {editingItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingItem(null)}
                className="fixed inset-0 z-[9500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#1a0030] rounded-2xl border border-white/10 shadow-2xl p-5 max-w-md w-full space-y-4"
                >
                  <h3 className="text-heading font-bold text-base">
                    {tx({ fr: 'Editer l\'oeuvre', en: 'Edit item', es: 'Editar obra' })}
                    <span className="text-xs text-grey-muted ml-2 font-mono">{editingItem.id}</span>
                  </h3>
                  <InputField
                    label={tx({ fr: 'Titre', en: 'Title', es: 'Titulo' })}
                    value={editingItem.titleFr}
                    onChange={v => setEditingItem(prev => ({ ...prev, titleFr: v }))}
                  />
                  <InputField
                    label={tx({ fr: 'Prix custom ($) - 0 pour standard', en: 'Custom price ($) - 0 for default', es: 'Precio personalizado ($) - 0 por defecto' })}
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingItem.customPrice}
                    onChange={v => setEditingItem(prev => ({ ...prev, customPrice: v }))}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingItem(null)} className="flex-1 py-2 rounded-lg bg-white/5 text-grey-muted text-sm hover:bg-white/10">
                      {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                    </button>
                    <button
                      onClick={saveItem}
                      disabled={itemSaving}
                      className="flex-[2] py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {itemSaving && <Loader2 size={14} className="animate-spin" />}
                      {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ----- Small components -----

function InputField({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <div>
      <label className="text-xs text-grey-muted block mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="input-field text-sm w-full"
        {...rest}
      />
    </div>
  );
}

function TextareaField({ label, value, onChange }) {
  return (
    <div className="md:col-span-2">
      <label className="text-xs text-grey-muted block mb-1">{label}</label>
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="input-field text-sm w-full resize-none"
      />
    </div>
  );
}

function ItemsGrid({ category, items, onEdit, onDelete, deletingItemId, tx }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="card-bg rounded-xl p-4">
        <h3 className="text-heading font-semibold text-sm uppercase tracking-wider mb-2">
          {category}
        </h3>
        <p className="text-grey-muted text-xs">
          {tx({ fr: 'Aucune oeuvre.', en: 'No items.', es: 'Sin obras.' })}
        </p>
      </div>
    );
  }
  return (
    <div className="card-bg rounded-xl p-4">
      <h3 className="text-heading font-semibold text-sm uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>{category} ({items.length})</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map(item => (
          <div key={item.id} className="relative rounded-lg overflow-hidden bg-black/20 border border-white/5 group">
            <div className="aspect-square bg-black/30">
              {item.image ? (
                <img src={item.image} alt={item.titleFr || item.id} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-grey-muted text-[10px] text-center p-1">{item.id}</div>
              )}
            </div>
            <div className="p-2">
              <p className="text-[11px] text-heading font-semibold truncate">{item.titleFr || item.titleEn || item.id}</p>
              <p className="text-[9px] text-grey-muted font-mono truncate">{item.id}</p>
              {item.customPrice != null && (
                <p className="text-[10px] text-accent mt-0.5">{item.customPrice}$</p>
              )}
              {item.unique && <span className="inline-block text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded mt-1">unique</span>}
              {item.sold && <span className="inline-block text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded mt-1 ml-1">sold</span>}
            </div>
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(item)}
                title={tx({ fr: 'Editer', en: 'Edit', es: 'Editar' })}
                className="p-1.5 rounded-lg bg-accent/80 text-white hover:bg-accent shadow-lg"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => onDelete(item)}
                disabled={deletingItemId === item.id}
                title={tx({ fr: 'Supprimer definitivement', en: 'Delete permanently', es: 'Eliminar definitivamente' })}
                className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 shadow-lg disabled:opacity-50"
              >
                {deletingItemId === item.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminArtistManager;
