import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, Check, X, Upload, Palette } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { mediaUrl } from '../../utils/cms';
import api from '../../services/api';

const SIZE_OPTIONS = [
  { value: 'petit', labelFr: 'Petit (5-10 cm)', labelEn: 'Small (2-4 in)' },
  { value: 'moyen', labelFr: 'Moyen (10-20 cm)', labelEn: 'Medium (4-8 in)' },
  { value: 'grand', labelFr: 'Grand (20-35 cm)', labelEn: 'Large (8-14 in)' },
  { value: 'tres-grand', labelFr: 'Tres grand (35+ cm)', labelEn: 'Extra large (14+ in)' },
];

const STATUS_COLORS = {
  disponible: 'bg-green-500',
  reserve: 'bg-amber-500',
  tatoue: 'bg-gray-500',
};

function FlashForm({ flash, onSave, onCancel, tx }) {
  const [form, setForm] = useState({
    titleFr: flash?.titleFr || '',
    titleEn: flash?.titleEn || '',
    descriptionFr: flash?.descriptionFr || '',
    descriptionEn: flash?.descriptionEn || '',
    style: flash?.style || '',
    size: flash?.size || 'moyen',
    bodyPlacement: flash?.bodyPlacement || '',
    priceTattoo: flash?.priceTattoo || '',
    pricePrint: flash?.pricePrint || '',
    printAvailable: flash?.printAvailable || false,
    isUnique: flash?.isUnique ?? true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(flash?.image ? mediaUrl(flash.image) : null);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, imageFile });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-bg-card rounded-xl border border-white/5 p-6 space-y-4">
      <h3 className="text-lg font-heading font-bold text-heading">
        {flash ? tx({ fr: 'Modifier le flash', en: 'Edit flash' }) : tx({ fr: 'Nouveau flash', en: 'New flash design' })}
      </h3>

      {/* Image upload */}
      <div>
        <label className="block text-sm text-grey-light mb-2">{tx({ fr: 'Image', en: 'Image' })} *</label>
        <div className="flex items-start gap-4">
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
          )}
          <label className="flex-1 border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-accent/30 transition-colors">
            <Upload size={24} className="mx-auto text-grey-muted mb-2" />
            <span className="text-sm text-grey-muted">{tx({ fr: 'Choisir une image', en: 'Choose an image' })}</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Titles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Titre (FR)', en: 'Title (FR)' })}</label>
          <input type="text" value={form.titleFr} onChange={(e) => setForm(f => ({ ...f, titleFr: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Titre (EN)', en: 'Title (EN)' })}</label>
          <input type="text" value={form.titleEn} onChange={(e) => setForm(f => ({ ...f, titleEn: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Description (FR)', en: 'Description (FR)' })}</label>
          <textarea value={form.descriptionFr} onChange={(e) => setForm(f => ({ ...f, descriptionFr: e.target.value }))} rows={3} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Description (EN)', en: 'Description (EN)' })}</label>
          <textarea value={form.descriptionEn} onChange={(e) => setForm(f => ({ ...f, descriptionEn: e.target.value }))} rows={3} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
        </div>
      </div>

      {/* Style, Size, Placement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Style', en: 'Style' })}</label>
          <input type="text" value={form.style} onChange={(e) => setForm(f => ({ ...f, style: e.target.value }))} placeholder="fineline, blackwork..." className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Taille', en: 'Size' })}</label>
          <select value={form.size} onChange={(e) => setForm(f => ({ ...f, size: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none">
            {SIZE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{tx({ fr: opt.labelFr, en: opt.labelEn })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Emplacement suggere', en: 'Suggested placement' })}</label>
          <input type="text" value={form.bodyPlacement} onChange={(e) => setForm(f => ({ ...f, bodyPlacement: e.target.value }))} placeholder="avant-bras, cotes..." className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Prix du tatouage ($)', en: 'Tattoo price ($)' })} *</label>
          <input type="number" value={form.priceTattoo} onChange={(e) => setForm(f => ({ ...f, priceTattoo: e.target.value }))} required className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Prix du print ($)', en: 'Print price ($)' })}</label>
          <input type="number" value={form.pricePrint} onChange={(e) => setForm(f => ({ ...f, pricePrint: e.target.value }))} disabled={!form.printAvailable} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none disabled:opacity-40" />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.printAvailable} onChange={(e) => setForm(f => ({ ...f, printAvailable: e.target.checked }))} className="accent-accent" />
          <span className="text-sm text-grey-light">{tx({ fr: 'Aussi disponible en print', en: 'Also available as print' })}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isUnique} onChange={(e) => setForm(f => ({ ...f, isUnique: e.target.checked }))} className="accent-accent" />
          <span className="text-sm text-grey-light">{tx({ fr: 'Pièce unique (un seul tatouage)', en: 'One of a kind (single tattoo)' })}</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-grey-muted hover:text-heading transition-colors">
          {tx({ fr: 'Annuler', en: 'Cancel' })}
        </button>
        <button type="submit" disabled={saving} className="btn-primary !py-2 !px-5 text-sm">
          {saving ? '...' : (flash ? tx({ fr: 'Sauvegarder', en: 'Save' }) : tx({ fr: 'Soumettre pour approbation', en: 'Submit for approval' }))}
        </button>
      </div>
    </form>
  );
}

export default function TatoueurFlashManager({ tatoueur, setTatoueur }) {
  const { lang, tx } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [editingFlash, setEditingFlash] = useState(null);

  const flashs = tatoueur?.flashs || [];

  const handleSave = async (formData) => {
    try {
      const { imageFile, ...fields } = formData;

      // Upload image first if present
      let imageId = null;
      if (imageFile) {
        const form = new FormData();
        form.append('files', imageFile);
        const uploadRes = await api.post('/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadRes.data?.[0]?.id) {
          imageId = uploadRes.data[0].id;
        }
      }

      const payload = {
        data: {
          ...fields,
          priceTattoo: fields.priceTattoo ? Number(fields.priceTattoo) : null,
          pricePrint: fields.pricePrint ? Number(fields.pricePrint) : null,
          status: 'disponible',
          approved: false,
          visible: true,
          tatoueur: tatoueur?.documentId || null,
          ...(imageId ? { image: imageId } : {}),
        },
      };

      if (editingFlash?.documentId) {
        await api.put(`/flashs/${editingFlash.documentId}`, payload);
      } else {
        await api.post('/flashs', payload);
      }

      // Refresh tatoueur data
      const { data } = await api.get('/tatoueurs', {
        params: {
          'filters[slug][$eq]': tatoueur?.slug,
          populate: '*',
        },
      });
      if (data.data?.length > 0 && setTatoueur) {
        setTatoueur(data.data[0]);
      }

      setShowForm(false);
      setEditingFlash(null);
    } catch (err) {
      console.error('[FlashManager] Save error:', err);
      alert(tx({
        fr: 'Erreur lors de la sauvegarde. Reessaie.',
        en: 'Error saving. Please try again.',
      }));
    }
  };

  const handleStatusChange = async (flash, newStatus) => {
    try {
      await api.put(`/flashs/${flash.documentId}`, {
        data: { status: newStatus },
      });
      // Refresh tatoueur data
      const { data } = await api.get('/tatoueurs', {
        params: {
          'filters[slug][$eq]': tatoueur?.slug,
          populate: '*',
        },
      });
      if (data.data?.length > 0 && setTatoueur) {
        setTatoueur(data.data[0]);
      }
    } catch (err) {
      console.error('[FlashManager] Status change error:', err);
      alert(tx({
        fr: 'Erreur lors du changement de statut.',
        en: 'Error changing status.',
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-heading">
          {tx({ fr: 'Mes flashs', en: 'My Flash Designs' })}
        </h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2">
            <Plus size={16} />
            {tx({ fr: 'Nouveau flash', en: 'New flash' })}
          </button>
        )}
      </div>

      {/* Flash form */}
      <AnimatePresence>
        {(showForm || editingFlash) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <FlashForm
              flash={editingFlash}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingFlash(null); }}
              tx={tx}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash list */}
      {flashs.length === 0 ? (
        <div className="text-center py-12 bg-bg-card rounded-xl border border-white/5">
          <Palette className="w-12 h-12 text-grey-muted/30 mx-auto mb-3" />
          <p className="text-grey-muted">
            {tx({ fr: 'Aucun flash pour le moment.', en: 'No flash designs yet.' })}
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary !py-2 !px-4 text-sm mt-4">
            {tx({ fr: 'Ajouter mon premier flash', en: 'Add my first flash' })}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {flashs.map((flash, i) => {
            const title = lang === 'en' ? (flash.titleEn || flash.titleFr) : (flash.titleFr || flash.titleEn);
            const imageUrl = flash.image?.url ? mediaUrl(flash.image) : flash.image;

            return (
              <div key={flash.id || i} className="bg-bg-card rounded-xl border border-white/5 p-4 flex items-center gap-4">
                {/* Thumbnail */}
                {imageUrl ? (
                  <img src={imageUrl} alt={title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-bg-elevated flex items-center justify-center flex-shrink-0">
                    <Palette size={20} className="text-grey-muted/30" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-heading text-sm truncate">{title || tx({ fr: 'Sans titre', en: 'Untitled' })}</h3>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[flash.status]}`} />
                    <span className="text-xs text-grey-muted capitalize">{flash.status}</span>
                  </div>
                  <div className="text-xs text-grey-muted mt-0.5">
                    {flash.style && <span className="capitalize">{flash.style}</span>}
                    {flash.priceTattoo && <span className="ml-2">{flash.priceTattoo}$</span>}
                    {flash.isUnique && <span className="ml-2 text-accent">{tx({ fr: 'Unique', en: 'Unique' })}</span>}
                    {!flash.approved && <span className="ml-2 text-amber-500">{tx({ fr: 'En attente', en: 'Pending' })}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {flash.status === 'reserve' && (
                    <button
                      onClick={() => handleStatusChange(flash, 'tatoue')}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                      title={tx({ fr: 'Marquer comme tatoue', en: 'Mark as tattooed' })}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingFlash(flash)}
                    className="p-2 text-grey-muted hover:text-accent transition-colors"
                    title={tx({ fr: 'Modifier', en: 'Edit' })}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
