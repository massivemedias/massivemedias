import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import MassiveLogo from './MassiveLogo';
import { useLang } from '../i18n/LanguageContext';

function Footer() {
  const { t, lang } = useLang();
  const [nlEmail, setNlEmail] = useState('');
  const [nlStatus, setNlStatus] = useState(null);
  const currentYear = new Date().getFullYear();
  const services = t('nav.servicesList');

  return (
    <footer className="py-12 mt-20 transition-colors duration-300 footer-bg footer-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Colonne 1 - Logo + tagline */}
          <div>
            <MassiveLogo className="h-12 w-auto mb-4 transition-colors duration-300" />
            <p className="text-magenta font-semibold mb-2">{t('footer.tagline')}</p>
            <p className="text-sm footer-muted">
              {t('footer.studioDesc')}<br />
              {t('footer.location')}
            </p>
          </div>

          {/* Colonne 2 - Navigation */}
          <div>
            <h4 className="font-heading font-bold mb-4 footer-heading">{t('footer.navTitle')}</h4>
            <ul className="space-y-2 footer-links">
              <li>
                <Link to="/boutique" className="hover:text-magenta transition-colors duration-300">
                  {t('nav.boutique')}
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="hover:text-magenta transition-colors duration-300">
                  {t('nav.aPropos')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-magenta transition-colors duration-300">
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 - Services */}
          <div>
            <h4 className="font-heading font-bold mb-4 footer-heading">{t('footer.servicesTitle')}</h4>
            <ul className="space-y-2 footer-links">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link to={`/services/${service.slug}`} className="hover:text-magenta transition-colors duration-300">
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 - Contact */}
          <div>
            <h4 className="font-heading font-bold mb-4 footer-heading">{t('footer.contactTitle')}</h4>
            <ul className="space-y-3 footer-links">
              <li>{t('footer.mileEnd')}</li>
              <li>{t('footer.byAppointment')}</li>
              <li>
                <a
                  href="mailto:info@massivemedias.com"
                  className="hover:text-magenta transition-colors duration-300 flex items-center gap-2"
                >
                  <Mail size={16} />
                  info@massivemedias.com
                </a>
              </li>
            </ul>

            {/* Réseaux sociaux */}
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com/massivemedias"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-white hover:bg-magenta transition-all duration-300 social-icon-btn"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com/massivemedias"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-white hover:bg-magenta transition-all duration-300 social-icon-btn"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="py-8 footer-border">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="font-heading font-bold mb-2 footer-heading">
              {lang === 'fr' ? 'Reste dans la loop' : 'Stay in the Loop'}
            </h4>
            <p className="text-sm footer-muted mb-4">
              {lang === 'fr'
                ? 'Promos, nouveaux services et projets. Pas de spam, promis.'
                : 'Promos, new services and projects. No spam, promise.'}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!nlEmail) return;
                setNlStatus('sending');
                try {
                  const res = await fetch('https://formspree.io/f/xzdardoe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: nlEmail, _subject: 'Newsletter signup' }),
                  });
                  setNlStatus(res.ok ? 'ok' : 'error');
                  if (res.ok) setNlEmail('');
                } catch { setNlStatus('error'); }
              }}
              className="flex gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={nlEmail}
                onChange={(e) => setNlEmail(e.target.value)}
                placeholder={lang === 'fr' ? 'ton@email.com' : 'your@email.com'}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm border border-purple-main/30 bg-transparent text-heading placeholder:text-grey-muted focus:outline-none focus:border-magenta transition-colors"
              />
              <button
                type="submit"
                disabled={nlStatus === 'sending'}
                className="px-4 py-2.5 rounded-lg bg-magenta text-white text-sm font-semibold hover:bg-magenta/80 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
            {nlStatus === 'ok' && (
              <p className="text-green-500 text-sm mt-2">{lang === 'fr' ? 'Inscrit! Merci.' : 'Subscribed! Thanks.'}</p>
            )}
            {nlStatus === 'error' && (
              <p className="text-red-500 text-sm mt-2">{lang === 'fr' ? 'Erreur. Réessaie.' : 'Error. Try again.'}</p>
            )}
          </div>
        </div>

        {/* Bas de footer */}
        <div className="pt-8 text-center text-sm footer-border footer-muted">
          <p>
            © 2013-{currentYear} {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
