import { useState } from 'react';
import { ArrowRight, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import { webHourlyRate as defaultRate } from '../../data/products';

function ConfiguratorWeb() {
  const { lang, tx } = useLang();
  const cmsProduct = useProduct('web');
  const webHourlyRate = cmsProduct?.pricingData?.hourlyRate || defaultRate;

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');

  return (
    <>
      {/* Intro */}
      <div className="mb-6">
        <p className="text-sm text-grey-muted leading-relaxed">
          {tx({
            fr: 'Décrivez votre projet web et vos attentes. Joignez tout document utile (maquettes, cahier des charges, références, logos...). Nous vous répondrons avec un devis personnalisé.',
            en: 'Describe your web project and expectations. Attach any useful documents (mockups, specs, references, logos...). We\'ll respond with a personalized quote.',
            es: 'Describa su proyecto web y sus expectativas. Adjunte cualquier documento util (maquetas, especificaciones, referencias, logos...). Le responderemos con un presupuesto personalizado.',
          })}
        </p>
      </div>

      {/* Message */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {tx({ fr: 'Votre projet', en: 'Your project', es: 'Su proyecto' })}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder={tx({
            fr: 'Décrivez votre site web idéal: objectif du site, fonctionnalités souhaitées, références de sites que vous aimez, contenu existant, échéancier...',
            en: 'Describe your ideal website: site goals, desired features, reference sites you like, existing content, timeline...',
            es: 'Describa su sitio web ideal: objetivo del sitio, funcionalidades deseadas, sitios de referencia, contenido existente, cronograma...',
          })}
          className="w-full min-h-[140px] rounded-lg bg-black/20 shadow-lg px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:ring-2 focus:ring-accent focus:outline-none transition-all resize-none"
        />
      </div>

      {/* File upload */}
      <div className="mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          label={tx({
            fr: 'Documents (optionnel)',
            en: 'Documents (optional)',
            es: 'Documentos (opcional)',
          })}
          hint={tx({
            fr: 'Maquettes, cahier des charges, logos, images, références...',
            en: 'Mockups, specs, logos, images, references...',
            es: 'Maquetas, especificaciones, logos, imagenes, referencias...',
          })}
          compact
        />
      </div>

      {/* Hourly rate note */}
      <div className="p-3 rounded-lg mb-5 text-xs text-grey-muted bg-glass">
        {tx({
          fr: `Taux horaire : ${webHourlyRate} - Design, developpement, SEO, maintenance`,
          en: `Hourly rate: ${webHourlyRate} - Design, development, SEO, maintenance`,
          es: `Tarifa por hora: ${webHourlyRate} - Diseno, desarrollo, SEO, mantenimiento`,
        })}
      </div>

      {/* Request quote */}
      <Link
        to={`/contact?service=developpement-web${uploadedFiles.length > 0 ? `&fileIds=${uploadedFiles.map(f => f.id).join(',')}` : ''}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`}
        className="btn-primary w-full justify-center text-base py-3.5 mb-3"
      >
        <Send size={18} className="mr-2" />
        {tx({ fr: 'Demander un devis', en: 'Request a quote', es: 'Solicitar un presupuesto' })}
      </Link>

      <Link to="/boutique" className="btn-outline w-full justify-center text-sm py-2.5">
        {tx({ fr: 'Voir tous les services', en: 'View all services', es: 'Ver todos los servicios' })}
      </Link>

      <p className="text-grey-muted text-xs mt-3 text-center">
        {tx({ fr: '15+ ans d\'expérience. Chaque projet est unique.', en: '15+ years of experience. Every project is unique.', es: '15+ anos de experiencia. Cada proyecto es unico.' })}
      </p>
    </>
  );
}

export default ConfiguratorWeb;
