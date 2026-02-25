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
            <p className="text-accent font-semibold mb-2">{t('footer.tagline')}</p>
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
                <Link to="/boutique" className="hover:text-accent transition-colors duration-300">
                  {t('nav.boutique')}
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="hover:text-accent transition-colors duration-300">
                  {t('nav.aPropos')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors duration-300">
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
                  <Link to={`/services/${service.slug}`} className="hover:text-accent transition-colors duration-300">
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
                  className="hover:text-accent transition-colors duration-300 flex items-center gap-2"
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
                className="p-2 rounded-full text-white hover:bg-accent transition-all duration-300 social-icon-btn"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com/massivemedias"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-white hover:bg-accent transition-all duration-300 social-icon-btn"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://wa.me/15146531423"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-white hover:bg-[#25D366] transition-all duration-300 social-icon-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
                className="flex-1 px-4 py-2.5 rounded-lg text-sm border border-purple-main/30 bg-transparent text-heading placeholder:text-grey-muted focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={nlStatus === 'sending'}
                className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition-colors flex items-center gap-2 disabled:opacity-50"
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
