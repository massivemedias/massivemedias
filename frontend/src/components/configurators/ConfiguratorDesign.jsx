import { useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import { designServices as defaultServices } from '../../data/products';

function ConfiguratorDesign() {
  const { lang, tx } = useLang();
  const cmsProduct = useProduct('design');
  const designServices = cmsProduct?.pricingData?.services || defaultServices;

  const [selected, setSelected] = useState('logo');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const service = designServices.find(s => s.id === selected);

  return (
    <>
      {/* Service type selector */}
      <div className="mb-6">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {tx({ fr: 'Type de service', en: 'Service type', es: 'Tipo de servicio' })}
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
                {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEn })}
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
            <span>{tx({ fr: `D\u00e9lai : ${service.timelineFr}`, en: `Timeline: ${service.timelineEn}`, es: `Plazo: ${service.timelineEn}` })}</span>
          </div>
          {service.id === 'retouching' && (
            <div className="text-grey-muted text-xs mt-2">
              {tx({ fr: 'Prix par image. Rabais volume disponible.', en: 'Price per image. Volume discount available.', es: 'Precio por imagen. Descuento por volumen disponible.' })}
            </div>
          )}
        </div>
      )}

      {/* Note about sticker design */}
      <div className="p-3 rounded-lg mb-5 text-xs text-grey-muted bg-glass">
        {tx({ fr: '\ud83c\udfa8 Le design de stickers est inclus dans le prix de production des stickers.', en: '\ud83c\udfa8 Sticker design is included in the sticker production price.', es: '\ud83c\udfa8 El dise\u00f1o de stickers est\u00e1 incluido en el precio de producci\u00f3n de los stickers.' })}
      </div>

      {/* File upload + Notes side by side */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          label={tx({ fr: 'References', en: 'References', es: 'Referencias' })}
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
            placeholder={tx({ fr: 'Decrivez votre projet (objectif, style, references...)', en: 'Describe your project (goal, style, references...)', es: 'Describa su proyecto (objetivo, estilo, referencias...)' })}
            className="w-full min-h-[100px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Request quote */}
      <Link
        to={`/contact?service=design-graphique&type=${selected}${uploadedFiles.length > 0 ? `&fileIds=${uploadedFiles.map(f => f.id).join(',')}` : ''}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`}
        className="btn-primary w-full justify-center text-base py-3.5 mb-3"
      >
        {tx({ fr: 'Demander un devis', en: 'Request a quote', es: 'Solicitar un presupuesto' })}
        <ArrowRight size={20} className="ml-2" />
      </Link>

      <Link to="/boutique" className="btn-outline w-full justify-center text-sm py-2.5">
        {tx({ fr: 'Voir tous les services', en: 'View all services', es: 'Ver todos los servicios' })}
      </Link>

      <p className="text-grey-muted text-xs mt-3 text-center">
        {tx({ fr: '2 rondes de r\u00e9visions incluses dans tous les forfaits.', en: '2 rounds of revisions included in all packages.', es: '2 rondas de revisiones incluidas en todos los paquetes.' })}
      </p>
    </>
  );
}

export default ConfiguratorDesign;
