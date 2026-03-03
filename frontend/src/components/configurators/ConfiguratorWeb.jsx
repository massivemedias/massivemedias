import { useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LanguageContext';
import FileUpload from '../FileUpload';
import { webServices, webHourlyRate } from '../../data/products';

function ConfiguratorWeb() {
  const { lang } = useLang();
  const [selected, setSelected] = useState('showcase');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');

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
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="text-heading">
                {lang === 'fr' ? s.labelFr : s.labelEn}
              </span>
              <span className="text-accent font-semibold text-xs whitespace-nowrap ml-2">
                {getPrice(s)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected service details */}
      {service && (
        <div className="p-5 rounded-xl mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl font-heading font-bold text-heading">{getPrice(service)}</span>
          </div>
          <div className="text-grey-muted text-xs">
            {lang === 'fr' ? `${service.labelFr}` : `${service.labelEn}`}
          </div>
        </div>
      )}

      {/* Hourly rate note */}
      <div className="p-3 rounded-lg mb-5 text-xs text-grey-muted bg-glass">
        {lang === 'fr'
          ? `\u23f1\ufe0f Taux horaire : ${webHourlyRate} (Web, Design, Restauration)`
          : `\u23f1\ufe0f Hourly rate: ${webHourlyRate} (Web, Design, Restoration)`}
      </div>

      {/* File upload + Notes side by side */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4 mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          label={lang === 'fr' ? 'Documents' : 'Documents'}
          compact
        />
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {lang === 'fr' ? 'Notes / Description' : 'Notes / Description'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={lang === 'fr' ? 'Decrivez votre projet (fonctionnalites, design, references...)' : 'Describe your project (features, design, references...)'}
            className="w-full h-[calc(100%-2rem)] min-h-[120px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Request quote */}
      <Link
        to={`/contact?service=developpement-web&type=${selected}${uploadedFiles.length > 0 ? `&fileIds=${uploadedFiles.map(f => f.id).join(',')}` : ''}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`}
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
