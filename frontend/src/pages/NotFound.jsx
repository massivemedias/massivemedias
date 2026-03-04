import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';

function NotFound() {
  const { tx } = useLang();

  return (
    <>
      <SEO
        title={tx({ fr: 'Page non trouvée - Massive Medias', en: 'Page Not Found - Massive Medias', es: 'Página no encontrada - Massive Medias' })}
        description={tx({ fr: 'La page demandée n\'existe pas.', en: 'The requested page does not exist.', es: 'La página solicitada no existe.' })}
        noindex
      />
      <div className="section-container pt-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-8xl font-heading font-bold text-gradient mb-4">404</h1>
          <p className="text-2xl text-heading font-heading mb-2">
            {tx({ fr: 'Page non trouvée', en: 'Page Not Found', es: 'Página no encontrada' })}
          </p>
          <p className="text-grey-muted mb-8">
            {tx({
              fr: 'La page que tu cherches n\'existe pas ou a été déplacée.',
              en: 'The page you are looking for does not exist or has been moved.',
              es: 'La página que buscas no existe o fue movida.',
            })}
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/" className="btn-primary">
              <Home size={20} className="mr-2" />
              {tx({ fr: 'Retour à l\'accueil', en: 'Back to Home', es: 'Volver al inicio' })}
            </Link>
            <Link to="/boutique" className="btn-outline">
              <ArrowLeft size={20} className="mr-2" />
              {tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' })}
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default NotFound;
