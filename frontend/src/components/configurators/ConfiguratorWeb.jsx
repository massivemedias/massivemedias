import { useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import { webServices as defaultServices, webHourlyRate as defaultRate } from '../../data/products';

function ConfiguratorWeb() {
  const { lang, tx } = useLang();
  const cmsProduct = useProduct('web');
  const webServices = cmsProduct?.pricingData?.services || defaultServices;
  const webHourlyRate = cmsProduct?.pricingData?.hourlyRate || defaultRate;

  const [selected, setSelected] = useState('showcase');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const service = webServices.find(s => s.id === selected);

  const getPrice = (s) => {
    if (typeof s.price === 'object') {
      return tx({ fr: s.price.fr, en: s.price.en, es: s.price.es || s.price.en });
    }
    return s.price;
  };

  return (
    <>
      {/* Project type selector */}
      <div className="mb-6">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {tx({ fr: 'Type de projet', en: 'Project type', es: 'Tipo de proyecto' })}
        </label>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-accent uppercase tracking-wider pt-1 pb-0.5">
            {tx({ fr: 'Creation de site (Design + Code + SEO inclus)', en: 'Site Creation (Design + Code + SEO included)', es: 'Creacion de sitio (Diseno + Codigo + SEO incluido)' })}
          </p>
          {webServices.filter(s => s.category === 'site').map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`w-full flex items-center justify-between p-3.5 rounded-lg text-sm font-medium transition-all border-2 text-left ${selected === s.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="text-heading">
                {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEs || s.labelEn })}
              </span>
              <span className="text-accent font-semibold text-xs whitespace-nowrap ml-2">
                {getPrice(s)}
              </span>
            </button>
          ))}
          <div className="border-t border-grey-muted/20 my-3" />
          <p className="text-xs font-semibold text-accent uppercase tracking-wider pt-1 pb-0.5">
            {tx({ fr: 'Webdesign seul (Livrable Figma)', en: 'Webdesign Only (Figma Deliverable)', es: 'Webdesign solo (Entregable Figma)' })}
          </p>
          {webServices.filter(s => s.category === 'webdesign').map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`w-full flex items-center justify-between p-3.5 rounded-lg text-sm font-medium transition-all border-2 text-left ${selected === s.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="text-heading">
                {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEs || s.labelEn })}
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
            {tx({ fr: service.labelFr, en: service.labelEn, es: service.labelEn })}
          </div>
        </div>
      )}

      {/* Hourly rate note */}
      <div className="p-3 rounded-lg mb-5 text-xs text-grey-muted bg-glass">
        {tx({
          fr: `\u23f1\ufe0f Taux horaire : ${webHourlyRate} (Web, Design, Restauration)`,
          en: `\u23f1\ufe0f Hourly rate: ${webHourlyRate} (Web, Design, Restoration)`,
          es: `\u23f1\ufe0f Tarifa por hora: ${webHourlyRate} (Web, Dise\u00f1o, Restauraci\u00f3n)`,
        })}
      </div>

      {/* File upload + Notes side by side */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          label={tx({ fr: 'Documents', en: 'Documents', es: 'Documentos' })}
          compact
        />
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {tx({ fr: 'Notes / Description', en: 'Notes / Description', es: 'Notas / Descripci\u00f3n' })}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={tx({ fr: 'Decrivez votre projet (fonctionnalites, design, references...)', en: 'Describe your project (features, design, references...)', es: 'Describa su proyecto (funcionalidades, dise\u00f1o, referencias...)' })}
            className="w-full min-h-[100px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Request quote */}
      <Link
        to={`/contact?service=developpement-web&type=${selected}${uploadedFiles.length > 0 ? `&fileIds=${uploadedFiles.map(f => f.id).join(',')}` : ''}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`}
        className="btn-primary w-full justify-center text-base py-3.5 mb-3"
      >
        {tx({ fr: 'Demander un devis', en: 'Request a quote', es: 'Solicitar un presupuesto' })}
        <ArrowRight size={20} className="ml-2" />
      </Link>

      <Link to="/boutique" className="btn-outline w-full justify-center text-sm py-2.5">
        {tx({ fr: 'Voir tous les services', en: 'View all services', es: 'Ver todos los servicios' })}
      </Link>

      <p className="text-grey-muted text-xs mt-3 text-center">
        {tx({ fr: '15+ ans d\'exp\u00e9rience. Chaque projet est unique.', en: '15+ years of experience. Every project is unique.', es: '15+ a\u00f1os de experiencia. Cada proyecto es \u00fanico.' })}
      </p>
    </>
  );
}

export default ConfiguratorWeb;
