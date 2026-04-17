import { useState, useRef } from 'react';
import { Save, Upload, Instagram, Globe, ExternalLink, Camera, Image, Plus, X, Facebook } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { mediaUrl } from '../../utils/cms';
import api from '../../services/api';
import { uploadArtistFile } from '../../services/api';

// TikTok icon (lucide doesn't have one)
function TikTokIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const STYLE_OPTIONS = [
  'fineline', 'botanique', 'blackwork', 'neo-traditionnel', 'japonais',
  'realisme', 'geometrique', 'old school', 'minimaliste', 'aquarelle',
  'dotwork', 'lettering',
];

const CATEGORY_OPTIONS = [
  { value: 'prints', label: { fr: 'Prints', en: 'Prints', es: 'Prints' } },
  { value: 'stickers', label: { fr: 'Stickers', en: 'Stickers', es: 'Stickers' } },
  { value: 'merch', label: { fr: 'Merch', en: 'Merch', es: 'Merch' } },
];

export default function TatoueurProfile({ tatoueur, setTatoueur }) {
  const { tx } = useLang();
  const [form, setForm] = useState({
    name: tatoueur?.name || '',
    bioFr: tatoueur?.bioFr || '',
    bioEn: tatoueur?.bioEn || '',
    studio: tatoueur?.studio || '',
    city: tatoueur?.city || '',
    instagramHandle: tatoueur?.instagramHandle || '',
    priceTattooMin: tatoueur?.priceTattooMin || '',
    hourlyRate: tatoueur?.hourlyRate || '',
    hidePrices: tatoueur?.hidePrices || false,
    styles: tatoueur?.styles || [],
    socials: tatoueur?.socials || {},
    avatarUrl: tatoueur?.avatarUrl || tatoueur?.avatar || '',
    heroUrl: tatoueur?.heroUrl || tatoueur?.heroImage || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Image uploads
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const heroInputRef = useRef(null);

  // Oeuvres upload
  const [oeuvreFile, setOeuvreFile] = useState(null);
  const [oeuvrePreview, setOeuvrePreview] = useState(null);
  const [oeuvreTitle, setOeuvreTitle] = useState('');
  const [oeuvreCategory, setOeuvreCategory] = useState('prints');
  const [oeuvreUploading, setOeuvreUploading] = useState(false);
  const [oeuvreSuccess, setOeuvreSuccess] = useState('');
  const [oeuvreError, setOeuvreError] = useState('');
  const oeuvreInputRef = useRef(null);
  const oeuvreDropRef = useRef(null);

  const toggleStyle = (style) => {
    setForm(f => ({
      ...f,
      styles: f.styles.includes(style) ? f.styles.filter(s => s !== style) : [...f.styles, style],
    }));
  };

  const handleSave = async () => {
    if (!tatoueur?.documentId) return;
    setSaving(true);
    try {
      await api.put(`/tatoueurs/${tatoueur.documentId}`, { data: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(tx({ fr: 'Erreur lors de la sauvegarde.', en: 'Error saving profile.', es: 'Error al guardar el perfil.' }));
    } finally {
      setSaving(false);
    }
  };

  // Avatar upload
  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await uploadArtistFile(file);
      setForm(f => ({ ...f, avatarUrl: result.url }));
    } catch {
      alert(tx({ fr: 'Erreur upload avatar', en: 'Error uploading avatar', es: 'Error al subir avatar' }));
    } finally {
      setAvatarUploading(false);
    }
  };

  // Hero image upload
  const handleHeroUpload = async (file) => {
    if (!file) return;
    setHeroUploading(true);
    try {
      const result = await uploadArtistFile(file);
      setForm(f => ({ ...f, heroUrl: result.url }));
    } catch {
      alert(tx({ fr: 'Erreur upload image', en: 'Error uploading image', es: 'Error al subir imagen' }));
    } finally {
      setHeroUploading(false);
    }
  };

  // Oeuvre file selection
  const handleOeuvreFileSelect = (file) => {
    if (!file) return;
    setOeuvreFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setOeuvrePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Oeuvre drag and drop
  const handleOeuvreDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleOeuvreFileSelect(file);
    }
  };

  const handleOeuvreDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Submit oeuvre
  const handleOeuvreSubmit = async () => {
    if (!oeuvreFile || !oeuvreTitle.trim()) return;
    setOeuvreUploading(true);
    setOeuvreError('');
    try {
      const result = await uploadArtistFile(oeuvreFile);
      await api.post('/artist-submissions/submit', {
        artistSlug: tatoueur?.slug || tatoueur?.name || '',
        artistName: tatoueur?.name || '',
        email: tatoueur?.email || '',
        subject: `Nouvelle oeuvre: ${oeuvreTitle}`,
        category: oeuvreCategory,
        title: oeuvreTitle,
        imageUrl: result.url,
        type: 'oeuvre-submission',
      });
      setOeuvreSuccess(tx({ fr: 'Oeuvre soumise! En attente d\'approbation.', en: 'Work submitted! Awaiting approval.', es: 'Obra enviada! En espera de aprobacion.' }));
      setOeuvreFile(null);
      setOeuvrePreview(null);
      setOeuvreTitle('');
      setOeuvreCategory('prints');
      setTimeout(() => setOeuvreSuccess(''), 4000);
    } catch {
      setOeuvreError(tx({ fr: 'Erreur lors de la soumission', en: 'Error submitting work', es: 'Error al enviar la obra' }));
      setTimeout(() => setOeuvreError(''), 4000);
    } finally {
      setOeuvreUploading(false);
    }
  };

  const existingPrints = tatoueur?.prints || [];

  return (
    <div className="space-y-6">
      {/* Save button only - no duplicate title */}
      <div className="flex items-center justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !px-5 text-sm flex items-center gap-2">
          <Save size={16} />
          {saving ? '...' : saved ? tx({ fr: 'Sauvegarde!', en: 'Saved!', es: 'Guardado!' }) : tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
        </button>
      </div>

      {/* Avatar + Hero Image Section */}
      <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden">
        {/* Hero banner */}
        <div className="relative h-40 md:h-52 bg-bg-elevated overflow-hidden group">
          {form.heroUrl ? (
            <img src={form.heroUrl} alt="Hero" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
              <Image size={40} className="text-grey-muted/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => heroInputRef.current?.click()}
              disabled={heroUploading}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/30 transition-colors"
            >
              {heroUploading ? (
                <span className="animate-spin">...</span>
              ) : (
                <>
                  <Camera size={16} />
                  {tx({ fr: 'Changer la banniere', en: 'Change banner', es: 'Cambiar banner' })}
                </>
              )}
            </button>
          </div>
          <input
            ref={heroInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleHeroUpload(e.target.files?.[0])}
          />
        </div>

        {/* Avatar overlay */}
        <div className="relative px-6 pb-6">
          <div className="relative -mt-12 mb-4 flex items-end gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-bg-card overflow-hidden bg-bg-elevated flex-shrink-0">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera size={24} className="text-grey-muted/40" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {avatarUploading ? (
                  <span className="text-white text-xs animate-spin">...</span>
                ) : (
                  <Camera size={16} className="text-white" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
              />
            </div>
            <div className="pb-1">
              <p className="text-heading font-heading font-bold text-lg">{form.name || tx({ fr: 'Nom d\'artiste', en: 'Artist name', es: 'Nombre de artista' })}</p>
              <p className="text-grey-muted text-sm">{form.city}{form.city && form.studio ? ' - ' : ''}{form.studio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="bg-bg-card rounded-xl border border-white/5 p-6 space-y-5">
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: "Nom d'artiste", en: 'Artist name', es: 'Nombre de artista' })}</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Studio', en: 'Studio', es: 'Estudio' })}</label>
            <input type="text" value={form.studio} onChange={(e) => setForm(f => ({ ...f, studio: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Ville', en: 'City', es: 'Ciudad' })}</label>
            <input type="text" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Bio (FR)', en: 'Bio (FR)', es: 'Bio (FR)' })}</label>
          <textarea value={form.bioFr} onChange={(e) => setForm(f => ({ ...f, bioFr: e.target.value }))} rows={4} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Bio (EN)', en: 'Bio (EN)', es: 'Bio (EN)' })}</label>
          <textarea value={form.bioEn} onChange={(e) => setForm(f => ({ ...f, bioEn: e.target.value }))} rows={4} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
        </div>

        {/* Styles */}
        <div>
          <label className="block text-sm text-grey-light mb-2">{tx({ fr: 'Styles de tatouage', en: 'Tattoo styles', es: 'Estilos de tatuaje' })}</label>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map(style => (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${
                  form.styles.includes(style)
                    ? 'bg-accent text-black font-bold'
                    : 'bg-bg-elevated text-grey-light hover:text-accent border border-white/5'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Prix minimum ($)', en: 'Minimum price ($)', es: 'Precio minimo ($)' })}</label>
            <input type="number" value={form.priceTattooMin} onChange={(e) => setForm(f => ({ ...f, priceTattooMin: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Taux horaire ($)', en: 'Hourly rate ($)', es: 'Tarifa por hora ($)' })}</label>
            <input type="number" value={form.hourlyRate} onChange={(e) => setForm(f => ({ ...f, hourlyRate: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
        </div>

        {/* Hide prices toggle */}
        <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-xl">
          <div>
            <p className="text-sm text-heading font-medium">{tx({ fr: 'Masquer les prix aux clients', en: 'Hide prices from clients', es: 'Ocultar precios a los clientes' })}</p>
            <p className="text-xs text-grey-muted mt-0.5">{tx({ fr: 'Les prix ne seront pas affiches sur votre page publique', en: 'Prices will not be shown on your public page', es: 'Los precios no se mostraran en su pagina publica' })}</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, hidePrices: !f.hidePrices }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.hidePrices ? 'bg-accent' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.hidePrices ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Social Links Section */}
      <div className="bg-bg-card rounded-xl border border-white/5 p-6 space-y-4">
        <h3 className="text-lg font-heading font-bold text-heading">
          {tx({ fr: 'Liens sociaux', en: 'Social links', es: 'Redes sociales' })}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Instagram */}
          <div>
            <label className="block text-sm text-grey-light mb-1">Instagram</label>
            <div className="flex items-center gap-2">
              <Instagram size={16} className="text-grey-muted flex-shrink-0" />
              <input
                type="text"
                value={form.instagramHandle}
                onChange={(e) => setForm(f => ({ ...f, instagramHandle: e.target.value }))}
                placeholder="@username"
                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>

          {/* TikTok */}
          <div>
            <label className="block text-sm text-grey-light mb-1">TikTok</label>
            <div className="flex items-center gap-2">
              <TikTokIcon size={16} className="text-grey-muted flex-shrink-0" />
              <input
                type="text"
                value={form.socials?.tiktok || ''}
                onChange={(e) => setForm(f => ({ ...f, socials: { ...f.socials, tiktok: e.target.value } }))}
                placeholder="@username"
                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Site web', en: 'Website', es: 'Sitio web' })}</label>
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-grey-muted flex-shrink-0" />
              <input
                type="url"
                value={form.socials?.website || ''}
                onChange={(e) => setForm(f => ({ ...f, socials: { ...f.socials, website: e.target.value } }))}
                placeholder="https://..."
                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Facebook */}
          <div>
            <label className="block text-sm text-grey-light mb-1">Facebook</label>
            <div className="flex items-center gap-2">
              <Facebook size={16} className="text-grey-muted flex-shrink-0" />
              <input
                type="text"
                value={form.socials?.facebook || ''}
                onChange={(e) => setForm(f => ({ ...f, socials: { ...f.socials, facebook: e.target.value } }))}
                placeholder="facebook.com/..."
                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mes oeuvres Section */}
      <div className="bg-bg-card rounded-xl border border-white/5 p-6 space-y-5">
        <div>
          <h3 className="text-lg font-heading font-bold text-heading">
            {tx({ fr: 'Mes oeuvres', en: 'My Work', es: 'Mis obras' })}
          </h3>
          <p className="text-sm text-grey-muted mt-1">
            {tx({
              fr: 'Deposez vos designs pour les vendre en prints, stickers ou merch via Massive Medias',
              en: 'Upload your designs to sell as prints, stickers or merch through Massive Medias',
              es: 'Sube tus disenos para venderlos como prints, stickers o merch a traves de Massive Medias',
            })}
          </p>
        </div>

        {/* Existing prints grid */}
        {existingPrints.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingPrints.map((print, idx) => (
              <div key={idx} className="bg-bg-elevated rounded-lg border border-white/5 overflow-hidden">
                {print.imageUrl && (
                  <img src={print.imageUrl} alt={print.title || ''} className="w-full aspect-square object-cover" />
                )}
                <div className="p-2">
                  <p className="text-xs text-heading font-medium truncate">{print.title || `#${idx + 1}`}</p>
                  {print.category && (
                    <span className="text-[10px] text-grey-muted uppercase">{print.category}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload new oeuvre */}
        <div className="bg-bg-elevated rounded-xl border border-white/5 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-heading flex items-center gap-2">
            <Plus size={16} className="text-accent" />
            {tx({ fr: 'Ajouter une oeuvre', en: 'Add a work', es: 'Agregar una obra' })}
          </h4>

          {/* Drag and drop / click area */}
          <div
            ref={oeuvreDropRef}
            onDrop={handleOeuvreDrop}
            onDragOver={handleOeuvreDragOver}
            onClick={() => !oeuvreFile && oeuvreInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              oeuvreFile
                ? 'border-accent/30 bg-accent/5'
                : 'border-white/10 hover:border-accent/30 hover:bg-white/[0.02]'
            }`}
          >
            {oeuvrePreview ? (
              <div className="relative inline-block">
                <img src={oeuvrePreview} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOeuvreFile(null);
                    setOeuvrePreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={32} className="text-grey-muted mx-auto" />
                <p className="text-sm text-grey-light">
                  {tx({
                    fr: 'Glissez-deposez une image ou cliquez pour parcourir',
                    en: 'Drag and drop an image or click to browse',
                    es: 'Arrastra y suelta una imagen o haz clic para buscar',
                  })}
                </p>
                <p className="text-xs text-grey-muted">PNG, JPG, TIFF</p>
              </div>
            )}
            <input
              ref={oeuvreInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleOeuvreFileSelect(e.target.files?.[0])}
            />
          </div>

          {/* Title + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Titre', en: 'Title', es: 'Titulo' })}</label>
              <input
                type="text"
                value={oeuvreTitle}
                onChange={(e) => setOeuvreTitle(e.target.value)}
                placeholder={tx({ fr: 'Titre de l\'oeuvre', en: 'Work title', es: 'Titulo de la obra' })}
                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })}</label>
              <select
                value={oeuvreCategory}
                onChange={(e) => setOeuvreCategory(e.target.value)}
                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{tx(opt.label)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-grey-muted italic">
              {tx({
                fr: 'Soumission sujette a approbation par l\'equipe Massive',
                en: 'Submission subject to approval by the Massive team',
                es: 'Envio sujeto a aprobacion por el equipo Massive',
              })}
            </p>
            <button
              type="button"
              onClick={handleOeuvreSubmit}
              disabled={!oeuvreFile || !oeuvreTitle.trim() || oeuvreUploading}
              className="btn-primary !py-2 !px-5 text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {oeuvreUploading ? (
                <>
                  <span className="animate-spin">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                  {tx({ fr: 'Envoi...', en: 'Sending...', es: 'Enviando...' })}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {tx({ fr: 'Soumettre', en: 'Submit', es: 'Enviar' })}
                </>
              )}
            </button>
          </div>

          {/* Success / Error messages */}
          {oeuvreSuccess && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {oeuvreSuccess}
            </div>
          )}
          {oeuvreError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {oeuvreError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
