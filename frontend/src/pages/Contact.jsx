import { motion } from 'framer-motion';
import { Mail, MapPin, Instagram, Facebook, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

function Contact() {
  const { t, lang } = useLang();
  const formRef = useRef();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    entreprise: '',
    service: '',
    budget: '',
    urgence: '',
    message: ''
  });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      await api.post('/contact-submissions/submit', formData);
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
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
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
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
            {t('contactPage.hero.title')}
          </h1>
          <p className="text-xl text-grey-light">
            {t('contactPage.hero.subtitle')}
          </p>
        </motion.div>

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
                    href="mailto:massivemedias@gmail.com"
                    className="text-heading hover:text-accent transition-colors"
                  >
                    massivemedias@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold text-heading mb-4">
                {t('contactPage.info.social')}
              </h3>
              <div className="flex gap-4">
                <a
                  href="https://instagram.com/massivemedias"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full text-white hover:bg-accent transition-all duration-300 social-icon-btn"
                  aria-label="Instagram"
                >
                  <Instagram size={24} />
                </a>
                <a
                  href="https://facebook.com/massivemedias"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full text-white hover:bg-accent transition-all duration-300 social-icon-btn"
                  aria-label="Facebook"
                >
                  <Facebook size={24} />
                </a>
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
                      <a href="mailto:massivemedias@gmail.com" className="underline">massivemedias@gmail.com</a>
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
      </section>
    </>
  );
}

export default Contact;
