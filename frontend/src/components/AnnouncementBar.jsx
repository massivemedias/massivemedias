import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../i18n/LanguageContext';
import { FINE_ART_GRID } from '../utils/pricingData';

// PRIX D'APPEL derive de la grille, jamais fige dans le libelle. L'ancienne
// valeur en dur ("16$") ne correspondait a AUCUNE entree de FINE_ART_GRID :
// le vrai point d'entree est le plus petit prix de la grille (A6 studio).
const FINE_ART_FROM = Math.min(
  ...Object.values(FINE_ART_GRID)
    .flatMap((f) => [f.studio, f.museum])
    .filter((v) => typeof v === 'number' && v > 0),
);

function AnnouncementBar() {
  const { tx } = useLang();
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="announcement-bar relative overflow-hidden"
        >
          <div className="flex items-center justify-center gap-3 py-2 px-4 text-center">
            <span className="text-xs font-medium">
              {tx({
                fr: `Livraison gratuite Plateau Mont-Royal - Impression fine art à partir de ${FINE_ART_FROM}$`,
                en: `Free Plateau Mont-Royal delivery - Fine art prints starting at $${FINE_ART_FROM}`,
                es: `Envio gratis Plateau Mont-Royal - Impresiones fine art desde $${FINE_ART_FROM}`,
              })}
            </span>
            <Link to="/boutique" className="text-xs font-bold underline underline-offset-2 hover:opacity-80 transition-opacity">
              {tx({ fr: 'Voir la boutique', en: 'Shop now', es: 'Ver la tienda' })}
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
              aria-label={tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnnouncementBar;
