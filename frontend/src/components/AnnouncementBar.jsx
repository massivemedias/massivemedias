import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../i18n/LanguageContext';

function AnnouncementBar() {
  const { lang } = useLang();
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
              {lang === 'fr'
                ? 'Livraison gratuite Mile-End - Impression fine art a partir de 16$'
                : 'Free Mile-End delivery - Fine art prints starting at $16'}
            </span>
            <Link to="/boutique" className="text-xs font-bold underline underline-offset-2 hover:opacity-80 transition-opacity">
              {lang === 'fr' ? 'Voir la boutique' : 'Shop now'}
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Fermer"
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
