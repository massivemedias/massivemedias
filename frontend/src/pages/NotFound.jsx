import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';

function NotFound() {
  const { lang } = useLang();
  const isFr = lang === 'fr';

  return (
    <>
      <SEO
        title={isFr ? 'Page non trouv\u00e9e - Massive Medias' : 'Page Not Found - Massive Medias'}
        description={isFr ? 'La page demand\u00e9e n\'existe pas.' : 'The requested page does not exist.'}
        noindex
      />
      <div className="section-container pt-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-8xl font-heading font-bold text-gradient mb-4">404</h1>
          <p className="text-2xl text-heading font-heading mb-2">
            {isFr ? 'Page non trouv\u00e9e' : 'Page Not Found'}
          </p>
          <p className="text-grey-muted mb-8">
            {isFr
              ? 'La page que tu cherches n\'existe pas ou a \u00e9t\u00e9 d\u00e9plac\u00e9e.'
              : 'The page you are looking for does not exist or has been moved.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/" className="btn-primary">
              <Home size={20} className="mr-2" />
              {isFr ? 'Retour \u00e0 l\'accueil' : 'Back to Home'}
            </Link>
            <Link to="/boutique" className="btn-outline">
              <ArrowLeft size={20} className="mr-2" />
              {isFr ? 'Boutique' : 'Shop'}
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default NotFound;
