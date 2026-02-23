import { useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LanguageContext';
import { webServices, webHourlyRate } from '../../data/products';

function ConfiguratorWeb() {
  const { lang } = useLang();
  const [selected, setSelected] = useState('showcase');

  const service = webServices.find(s => s.id === selected);

  const getPrice = (s) => {
    if (typeof s.price === 'object') {
      return lang === 'fr' ? s.price.fr : s.price.en;
    }
    return s.price;
  };

  return (
    <>
      {/* Project type selector */}
      <div className="mb-6">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Type de projet' : 'Project type'}
        </label>
        <div className="space-y-2">
          {webServices.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`w-full flex items-center justify-between p-3.5 rounded-lg text-sm font-medium transition-all border-2 text-left ${selected === s.id
                ? 'border-magenta'
                : 'border-transparent hover:border-grey-muted/30'
              }`}
              style={{ background: selected === s.id ? 'var(--highlight-bg)' : 'var(--bg-glass)' }}
            >
              <span className="text-heading">
                {lang === 'fr' ? s.labelFr : s.labelEn}
              </span>
              <span className="text-magenta font-semibold text-xs whitespace-nowrap ml-2">
                {getPrice(s)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected service details */}
      {service && (
        <div className="p-5 rounded-xl mb-5" style={{ background: 'var(--highlight-bg)', border: '1px solid var(--bg-card-border)' }}>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl font-heading font-bold text-heading">{getPrice(service)}</span>
          </div>
          <div className="text-grey-muted text-xs">
            {lang === 'fr' ? `${service.labelFr}` : `${service.labelEn}`}
          </div>
        </div>
      )}

      {/* Hourly rate note */}
      <div className="p-3 rounded-lg mb-5 text-xs text-grey-muted" style={{ background: 'var(--bg-glass)', border: '1px solid var(--bg-card-border)' }}>
        {lang === 'fr'
          ? `\u23f1\ufe0f Taux horaire : ${webHourlyRate} (Web, Design, Restauration)`
          : `\u23f1\ufe0f Hourly rate: ${webHourlyRate} (Web, Design, Restoration)`}
      </div>

      {/* Request quote */}
      <Link
        to={`/contact?service=developpement-web&type=${selected}`}
        className="btn-primary w-full justify-center text-base py-3.5 mb-3"
      >
        {lang === 'fr' ? 'Demander un devis' : 'Request a quote'}
        <ArrowRight size={20} className="ml-2" />
      </Link>

      <Link to="/boutique" className="btn-outline w-full justify-center text-sm py-2.5">
        {lang === 'fr' ? 'Voir tous les services' : 'View all services'}
      </Link>

      <p className="text-grey-muted text-xs mt-3 text-center">
        {lang === 'fr'
          ? '15+ ans d\'exp\u00e9rience. Chaque projet est unique.'
          : '15+ years of experience. Every project is unique.'}
      </p>
    </>
  );
}

export default ConfiguratorWeb;
