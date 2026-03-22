import { useState } from 'react';
import { Save, Upload, Instagram, Globe, ExternalLink } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { mediaUrl } from '../../utils/cms';
import api from '../../services/api';

const STYLE_OPTIONS = [
  'fineline', 'botanique', 'blackwork', 'neo-traditionnel', 'japonais',
  'realisme', 'geometrique', 'old school', 'minimaliste', 'aquarelle',
  'dotwork', 'lettering',
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
    styles: tatoueur?.styles || [],
    socials: tatoueur?.socials || {},
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      alert(tx({ fr: 'Erreur lors de la sauvegarde.', en: 'Error saving profile.' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-heading">
          {tx({ fr: 'Mon profil', en: 'My Profile' })}
        </h2>
        <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !px-5 text-sm flex items-center gap-2">
          <Save size={16} />
          {saving ? '...' : saved ? tx({ fr: 'Sauvegarde!', en: 'Saved!' }) : tx({ fr: 'Sauvegarder', en: 'Save' })}
        </button>
      </div>

      <div className="bg-bg-card rounded-xl border border-white/5 p-6 space-y-5">
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: "Nom d'artiste", en: 'Artist name' })}</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Instagram', en: 'Instagram handle' })}</label>
            <div className="flex items-center gap-2">
              <Instagram size={16} className="text-grey-muted flex-shrink-0" />
              <input type="text" value={form.instagramHandle} onChange={(e) => setForm(f => ({ ...f, instagramHandle: e.target.value }))} placeholder="ginko.ink" className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Studio', en: 'Studio' })}</label>
            <input type="text" value={form.studio} onChange={(e) => setForm(f => ({ ...f, studio: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Ville', en: 'City' })}</label>
            <input type="text" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Bio (FR)', en: 'Bio (FR)' })}</label>
          <textarea value={form.bioFr} onChange={(e) => setForm(f => ({ ...f, bioFr: e.target.value }))} rows={4} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Bio (EN)', en: 'Bio (EN)' })}</label>
          <textarea value={form.bioEn} onChange={(e) => setForm(f => ({ ...f, bioEn: e.target.value }))} rows={4} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
        </div>

        {/* Styles */}
        <div>
          <label className="block text-sm text-grey-light mb-2">{tx({ fr: 'Styles de tatouage', en: 'Tattoo styles' })}</label>
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
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Prix minimum ($)', en: 'Minimum price ($)' })}</label>
            <input type="number" value={form.priceTattooMin} onChange={(e) => setForm(f => ({ ...f, priceTattooMin: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Taux horaire ($)', en: 'Hourly rate ($)' })}</label>
            <input type="number" value={form.hourlyRate} onChange={(e) => setForm(f => ({ ...f, hourlyRate: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
