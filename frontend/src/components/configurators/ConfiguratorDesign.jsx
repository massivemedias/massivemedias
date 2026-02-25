import { useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LanguageContext';
import FileUpload from '../FileUpload';
import { designServices } from '../../data/products';

function ConfiguratorDesign() {
  const { lang } = useLang();
  const [selected, setSelected] = useState('logo');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const service = designServices.find(s => s.id === selected);

  return (
    <>
      {/* Service type selector */}
      <div className="mb-6">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {lang === 'fr' ? 'Type de service' : 'Service type'}
        </label>
        <div className="space-y-2">
          {designServices.map(s => (
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
                {s.priceRange}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected service details */}
      {service && (
        <div className="p-5 rounded-xl mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl font-heading font-bold text-heading">{service.priceRange}</span>
          </div>
          <div className="flex items-center gap-2 text-grey-muted text-xs">
            <Clock size={14} className="text-accent" />
            <span>{lang === 'fr' ? `D\u00e9lai : ${service.timelineFr}` : `Timeline: ${service.timelineEn}`}</span>
          </div>
          {service.id === 'retouching' && (
            <div className="text-grey-muted text-xs mt-2">
              {lang === 'fr' ? 'Prix par image. Rabais volume disponible.' : 'Price per image. Volume discount available.'}
            </div>
          )}
        </div>
      )}

      {/* Note about sticker design */}
      <div className="p-3 rounded-lg mb-5 text-xs text-grey-muted bg-glass">
        {lang === 'fr'
          ? '\ud83c\udfa8 Le design de stickers est inclus dans le prix de production des stickers.'
          : '\ud83c\udfa8 Sticker design is included in the sticker production price.'}
      </div>

      {/* File upload */}
      <FileUpload
        files={uploadedFiles}
        onFilesChange={setUploadedFiles}
        label={lang === 'fr' ? 'Références / brief' : 'References / brief'}
      />

      {/* Request quote */}
      <Link
        to={`/contact?service=design-graphique&type=${selected}${uploadedFiles.length > 0 ? `&fileIds=${uploadedFiles.map(f => f.id).join(',')}` : ''}`}
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
          ? '2 rondes de r\u00e9visions incluses dans tous les forfaits.'
          : '2 rounds of revisions included in all packages.'}
      </p>
    </>
  );
}

export default ConfiguratorDesign;
