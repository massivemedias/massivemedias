import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Check, ArrowRight, Instagram, PenTool } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const STYLE_OPTIONS = [
  'fineline', 'botanique', 'blackwork', 'neo-traditionnel', 'japonais',
  'realisme', 'geometrique', 'old school', 'minimaliste', 'aquarelle',
  'dotwork', 'lettering',
];

function TatoueurInscription() {
  const { tx } = useLang();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    instagramHandle: '',
    studio: '',
    city: 'Montreal',
    styles: [],
    bioFr: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const toggleStyle = (style) => {
    setForm(f => ({
      ...f,
      styles: f.styles.includes(style) ? f.styles.filter(s => s !== style) : [...f.styles, style],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      // Envoyer comme contact submission avec tag tatoueur
      await api.post('/contact-submissions/submit', {
        data: {
          name: form.name,
          email: form.email,
          subject: `[TATOUEUR] Inscription - ${form.name}`,
          message: `Nom d'artiste: ${form.name}\nInstagram: @${form.instagramHandle}\nStudio: ${form.studio}\nVille: ${form.city}\nStyles: ${form.styles.join(', ')}\n\nBio:\n${form.bioFr}\n\nMessage:\n${form.message}`,
          source: 'tatoueur-inscription',
        },
      });
      setSent(true);
    } catch (err) {
      setError(tx({ fr: 'Erreur lors de l\'envoi. Reessaie plus tard.', en: 'Error sending. Try again later.' }));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SEO
        title={tx({ fr: 'Inscription Tatoueur | Massive', en: 'Tattoo Artist Sign Up | Massive' })}
        description={tx({ fr: 'Rejoins la plateforme Massive Medias comme tatoueur partenaire.', en: 'Join Massive Medias as a partner tattoo artist.' })}
        noindex
      />

      <div className="pt-24 pb-20 section-container max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-sm">
            <Link to="/" className="text-grey-muted hover:text-accent transition-colors">{tx({ fr: 'Accueil', en: 'Home' })}</Link>
            <span className="text-grey-muted">/</span>
            <Link to="/tatoueurs" className="text-grey-muted hover:text-accent transition-colors">{tx({ fr: 'Tatoueurs', en: 'Tattoo Artists' })}</Link>
            <span className="text-grey-muted">/</span>
            <span className="text-accent">{tx({ fr: 'Inscription', en: 'Sign Up' })}</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <PenTool size={32} className="text-accent" />
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading">
              {tx({ fr: 'Devenir tatoueur partenaire', en: 'Become a partner tattoo artist' })}
            </h1>
          </div>

          <p className="text-grey-light text-lg mb-8">
            {tx({
              fr: "Page dediee, galerie de flashs, systeme de reservation, sous-domaine personnalise, 30% de rabais sur les prints et le merch. On s'occupe de ta presence en ligne.",
              en: 'Dedicated page, flash gallery, booking system, custom subdomain, 30% discount on prints and merch. We handle your online presence.',
            })}
          </p>

          {sent ? (
            <div className="bg-bg-card rounded-2xl border border-green-500/30 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-heading mb-2">
                {tx({ fr: 'Demande envoyee!', en: 'Application sent!' })}
              </h2>
              <p className="text-grey-muted mb-6">
                {tx({
                  fr: "On va examiner ta demande et te contacter rapidement. En attendant, suis-nous sur Instagram!",
                  en: 'We will review your application and contact you soon. In the meantime, follow us on Instagram!',
                })}
              </p>
              <Link to="/tatoueurs" className="btn-primary">
                {tx({ fr: 'Voir les tatoueurs', en: 'View tattoo artists' })}
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-bg-card rounded-2xl border border-white/5 p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-grey-light mb-1">{tx({ fr: "Nom d'artiste", en: 'Artist name' })} *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-grey-light mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-grey-light mb-1 flex items-center gap-1"><Instagram size={14} /> Instagram</label>
                  <input type="text" value={form.instagramHandle} onChange={(e) => setForm(f => ({ ...f, instagramHandle: e.target.value }))} placeholder="ton.handle" className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Studio', en: 'Studio' })}</label>
                  <input type="text" value={form.studio} onChange={(e) => setForm(f => ({ ...f, studio: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Ville', en: 'City' })}</label>
                  <input type="text" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-grey-light mb-2">{tx({ fr: 'Tes styles', en: 'Your styles' })}</label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${
                        form.styles.includes(style)
                          ? 'bg-accent text-black font-bold'
                          : 'bg-bg-elevated text-grey-light border border-white/5'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Bio / Presentation', en: 'Bio / Introduction' })}</label>
                <textarea value={form.bioFr} onChange={(e) => setForm(f => ({ ...f, bioFr: e.target.value }))} rows={4} placeholder={tx({ fr: 'Parle-nous de toi, ton style, ton experience...', en: 'Tell us about yourself, your style, your experience...' })} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
              </div>

              <div>
                <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Message additionnel', en: 'Additional message' })}</label>
                <textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={3} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button type="submit" disabled={sending} className="w-full btn-primary py-3 text-base font-bold flex items-center justify-center gap-2">
                <Send size={18} />
                {sending ? '...' : tx({ fr: 'Envoyer ma candidature', en: 'Submit my application' })}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default TatoueurInscription;
