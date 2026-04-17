import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MapPin, Instagram, Facebook, Send, CheckCircle, AlertCircle, Briefcase, Palette, ChevronDown, HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useSiteContent } from '../hooks/useSiteContent';
import { bl } from '../utils/cms';
import api from '../services/api';
import ArtistPartnershipForm from '../components/ArtistPartnershipForm';
import { ARTIST_FAQ } from '../data/artistContract';

function ArtistFAQ({ lang, tx }) {
  const [openIdx, setOpenIdx] = useState(null);
  const faq = ARTIST_FAQ[lang] || ARTIST_FAQ.fr;

  return (
    <div className="max-w-4xl mx-auto mt-16 mb-4">
      <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-3">
        <HelpCircle size={24} className="text-accent" />
        {tx({ fr: 'Questions fréquentes - Artistes', en: 'FAQ - Artists', es: 'Preguntas frecuentes - Artistas' })}
      </h2>
      <div className="space-y-2">
        {faq.map((item, i) => (
          <div key={i} className="rounded-xl bg-glass overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-accent/5 transition-colors"
            >
              <span className="text-heading font-semibold text-sm flex-1">{item.q}</span>
              <ChevronDown
                size={16}
                className={`text-accent flex-shrink-0 transition-transform duration-200 ${openIdx === i ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-grey-light text-sm leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// Icone WhatsApp inline (meme SVG que le Footer pour coherence)
const WhatsAppIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

const socialIconMap = {
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: WhatsAppIcon,
};

function Contact() {
  const { t, lang, tx } = useLang();
  const { content } = useSiteContent();

  const contactEmail = 'massivemedias@gmail.com';
  const cmsSocialLinks = content?.socialLinks;
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'artiste' ? 'artist' : 'service');
  const formRef = useRef();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    entreprise: '',
    service: '',
    budget: '',
    urgence: '',
    message: '',
    website: '', // honeypot anti-spam
  });
  const [formLoadTime] = useState(Date.now());
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Anti-spam: si le honeypot est rempli ou soumission trop rapide (<3s)
    if (formData.website || (Date.now() - formLoadTime) < 3000) {
      setStatus('success'); // fake success pour pas alerter le bot
      return;
    }

    setStatus('sending');

    try {
      const { website, ...submitData } = formData; // exclure le honeypot
      await api.post('/contact-submissions/submit', submitData);
      setStatus('success');
      setFormData({
        nom: '',
        email: '',
        telephone: '',
        entreprise: '',
        service: '',
        budget: '',
        urgence: '',
        message: ''
      });
    } catch (error) {
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (status === 'error' || status === 'success') {
      setStatus('idle');
    }
  };

  const serviceOptions = t('contactPage.form.serviceOptions');
  const budgetOptions = t('contactPage.form.budgetOptions');
  const urgencyOptions = t('contactPage.form.urgencyOptions');

  return (
    <>
      <SEO
        title={t('contactPage.seo.title')}
        description={t('contactPage.seo.description')}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: t('nav.contact') },
        ]}
      />

      <section className="section-container pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-3 text-sm">
            <Link to="/" className="text-grey-muted hover:text-accent transition-colors">
              {tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' })}
            </Link>
            <span className="text-grey-muted">/</span>
            <span className="text-accent">
              {tx({ fr: 'Contact', en: 'Contact', es: 'Contacto' })}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
            {t('contactPage.hero.title')}
          </h1>
          <p className="text-xl text-grey-light">
            {t('contactPage.hero.subtitle')}
          </p>
        </motion.div>

        {/* Onglets */}
        <div className="flex justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveTab('service')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
              activeTab === 'service'
                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                : 'bg-glass text-grey-muted hover:text-heading hover:bg-glass-hover'
            }`}
          >
            <Briefcase size={16} />
            {tx({ fr: 'Demande de service', en: 'Service request', es: 'Solicitud de servicio' })}
          </button>
          <button
            onClick={() => setActiveTab('artist')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
              activeTab === 'artist'
                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                : 'bg-glass text-grey-muted hover:text-heading hover:bg-glass-hover'
            }`}
          >
            <Palette size={16} />
            {tx({ fr: 'Partenariat artiste', en: 'Artist partnership', es: 'Asociacion artistica' })}
          </button>
        </div>

        <AnimatePresence mode="wait">
        {activeTab === 'service' && (
        <motion.div
          key="service"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Coordonnées */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h3 className="font-heading text-2xl font-bold text-heading mb-6">
                {t('contactPage.info.title')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-accent mt-1" size={20} />
                  <div>
                    <p className="text-heading font-semibold">{t('contactPage.info.location')}</p>
                    <p className="text-grey-muted text-sm">{t('contactPage.info.byAppointment')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="text-accent mt-1" size={20} />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-heading hover:text-accent transition-colors"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold text-heading mb-4">
                {t('contactPage.info.social')}
              </h3>
              <div className="flex gap-4">
                {cmsSocialLinks
                  ? cmsSocialLinks.map((social, index) => {
                      const platform = social.platform?.toLowerCase();
                      const Icon = socialIconMap[platform];
                      return (
                        <a
                          key={index}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-full text-white hover:bg-accent transition-all duration-300 social-icon-btn"
                          aria-label={social.label || platform}
                        >
                          {Icon ? <Icon size={24} /> : <Instagram size={24} />}
                        </a>
                      );
                    })
                  : <>
                      <a href="https://instagram.com/massivemedias" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full text-white hover:bg-accent transition-all duration-300 social-icon-btn" aria-label="Instagram">
                        <Instagram size={24} />
                      </a>
                      <a href="https://facebook.com/massivemedias" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full text-white hover:bg-accent transition-all duration-300 social-icon-btn" aria-label="Facebook">
                        <Facebook size={24} />
                      </a>
                      <a href="https://wa.me/15146531423" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full text-white hover:bg-accent transition-all duration-300 social-icon-btn" aria-label="WhatsApp">
                        <WhatsAppIcon size={24} />
                      </a>
                    </>
                }
              </div>
            </div>
          </motion.div>

          {/* Formulaire */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2"
          >
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 px-8 rounded-2xl transition-colors duration-300 bg-glass"
              >
                <CheckCircle size={64} className="text-green-400 mx-auto mb-6" />
                <h3 className="font-heading text-3xl font-bold text-heading mb-4">
                  {t('contactPage.form.successTitle')}
                </h3>
                <p className="text-grey-light text-lg mb-8">
                  {t('contactPage.form.successMessage')}
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="btn-outline"
                >
                  {t('contactPage.form.sendAnother')}
                </button>
              </motion.div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Honeypot anti-spam - invisible pour les humains */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nom" className="block text-heading font-semibold mb-2">
                      {t('contactPage.form.fullName')} *
                    </label>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      required
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder={t('contactPage.form.namePlaceholder')}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-heading font-semibold mb-2">
                      {t('contactPage.form.email')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('contactPage.form.emailPlaceholder')}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="telephone" className="block text-heading font-semibold mb-2">
                      {t('contactPage.form.phone')}
                    </label>
                    <input
                      type="tel"
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder={t('contactPage.form.phonePlaceholder')}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="entreprise" className="block text-heading font-semibold mb-2">
                      {t('contactPage.form.company')}
                    </label>
                    <input
                      type="text"
                      id="entreprise"
                      name="entreprise"
                      value={formData.entreprise}
                      onChange={handleChange}
                      placeholder={t('contactPage.form.companyPlaceholder')}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="service" className="block text-heading font-semibold mb-2">
                      {t('contactPage.form.service')}
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">{t('contactPage.form.selectPlaceholder')}</option>
                      {serviceOptions.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="budget" className="block text-heading font-semibold mb-2">
                      {t('contactPage.form.budget')}
                    </label>
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">{t('contactPage.form.selectPlaceholder')}</option>
                      {budgetOptions.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="urgence" className="block text-heading font-semibold mb-2">
                      {t('contactPage.form.urgency')}
                    </label>
                    <select
                      id="urgence"
                      name="urgence"
                      value={formData.urgence}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">{t('contactPage.form.selectPlaceholder')}</option>
                      {urgencyOptions.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-heading font-semibold mb-2">
                    {t('contactPage.form.message')} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder={t('contactPage.form.messagePlaceholder')}
                    className="input-field resize-none"
                  />
                </div>

                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30 error-bg"
                  >
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-sm">
                      {t('contactPage.form.errorMessage')}{' '}
                      <a href={`mailto:${contactEmail}`} className="underline">{contactEmail}</a>
                    </p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-primary w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('contactPage.form.sending')}
                    </>
                  ) : (
                    <>
                      {t('contactPage.form.submit')}
                      <Send className="ml-2" size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
        </motion.div>
        )}

        {activeTab === 'artist' && (
          <motion.div
            key="artist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ArtistPartnershipForm />
            <ArtistFAQ lang={lang} tx={tx} />
          </motion.div>
        )}
        </AnimatePresence>
      </section>
    </>
  );
}

export default Contact;
