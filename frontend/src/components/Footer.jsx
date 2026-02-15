import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';
import MassiveLogo from '../assets/massive-logo.svg';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';

function Footer() {
  const { t } = useLang();
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  const services = t('nav.servicesList');
  const dk = theme === 'light'; // dark footer in light mode

  return (
    <footer className="py-12 mt-20 transition-colors duration-300 footer-bg footer-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Colonne 1 - Logo + tagline */}
          <div>
            <img
              src={MassiveLogo}
              alt="Massive Medias"
              className="h-12 w-auto mb-4"
              style={dk ? { filter: 'brightness(0) invert(1)' } : undefined}
            />
            <p className="text-magenta font-semibold mb-2">{t('footer.tagline')}</p>
            <p className={`text-sm ${dk ? 'text-white/50' : 'text-grey-muted'}`}>
              {t('footer.studioDesc')}<br />
              {t('footer.location')}
            </p>
          </div>

          {/* Colonne 2 - Navigation */}
          <div>
            <h4 className={`font-heading font-bold mb-4 ${dk ? 'text-white' : 'text-heading'}`}>{t('footer.navTitle')}</h4>
            <ul className={`space-y-2 ${dk ? 'text-white/60' : 'text-grey-light'}`}>
              <li>
                <Link to="/services" className="hover:text-magenta transition-colors duration-300">
                  {t('nav.services')}
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="hover:text-magenta transition-colors duration-300">
                  {t('nav.tarifs')}
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-magenta transition-colors duration-300">
                  {t('nav.portfolio')}
                </Link>
              </li>
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
            <h4 className={`font-heading font-bold mb-4 ${dk ? 'text-white' : 'text-heading'}`}>{t('footer.servicesTitle')}</h4>
            <ul className={`space-y-2 ${dk ? 'text-white/60' : 'text-grey-light'}`}>
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
            <h4 className={`font-heading font-bold mb-4 ${dk ? 'text-white' : 'text-heading'}`}>{t('footer.contactTitle')}</h4>
            <ul className={`space-y-3 ${dk ? 'text-white/60' : 'text-grey-light'}`}>
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
                className={`p-2 rounded-full text-white hover:bg-magenta transition-all duration-300 ${dk ? 'bg-white/10' : 'bg-purple-bright'}`}
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com/massivemedias"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-full text-white hover:bg-magenta transition-all duration-300 ${dk ? 'bg-white/10' : 'bg-purple-bright'}`}
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bas de footer */}
        <div className={`pt-8 text-center text-sm footer-border ${dk ? 'text-white/40' : 'text-grey-muted'}`}>
          <p>
            © 2013-{currentYear} {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
