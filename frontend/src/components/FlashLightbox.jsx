import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Ruler, DollarSign, Printer, Lock, Check, LogIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { mediaUrl } from '../utils/cms';

const SIZE_LABELS = {
  petit: { fr: 'Petit (5-10 cm)', en: 'Small (2-4 in)' },
  moyen: { fr: 'Moyen (10-20 cm)', en: 'Medium (4-8 in)' },
  grand: { fr: 'Grand (20-35 cm)', en: 'Large (8-14 in)' },
  'tres-grand': { fr: 'Tres grand (35+ cm)', en: 'Extra large (14+ in)' },
};

export default function FlashLightbox({ flash, onClose, onReserve, tatoueurName, allFlashs = [], onNavigate, hidePrices = false }) {
  const { lang, tx } = useLang();
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const currentIndex = allFlashs.findIndex(f => f.id === flash?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allFlashs.length - 1;

  const goPrev = () => { if (hasPrev && onNavigate) onNavigate(allFlashs[currentIndex - 1]); setShowLoginPrompt(false); };
  const goNext = () => { if (hasNext && onNavigate) onNavigate(allFlashs[currentIndex + 1]); setShowLoginPrompt(false); };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!flash) return null;

  const title = lang === 'en' ? (flash.titleEn || flash.titleFr) : (flash.titleFr || flash.titleEn);
  const description = lang === 'en' ? (flash.descriptionEn || flash.descriptionFr) : (flash.descriptionFr || flash.descriptionEn);
  const imageUrl = flash.image?.url ? mediaUrl(flash.image) : flash.image;
  const sizeLabel = SIZE_LABELS[flash.size] || {};
  const isAvailable = flash.status === 'disponible';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-8"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] flex flex-col md:flex-row shadow-2xl overflow-y-auto md:overflow-y-hidden"
          style={{ backgroundColor: 'var(--bg-card, #1a1a2e)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Image */}
          <div className="md:w-1/2 relative bg-black flex items-center justify-center min-h-[200px] max-h-[40vh] md:max-h-none md:min-h-0 flex-shrink-0">
            {/* Navigation arrows */}
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            )}
            {/* Counter */}
            {allFlashs.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                {currentIndex + 1} / {allFlashs.length}
              </div>
            )}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title || 'Flash tattoo'}
                className="w-full h-full object-contain max-h-[50vh] md:max-h-[90vh]"
              />
            ) : (
              <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-accent/10 via-bg-elevated to-bg-card flex flex-col items-center justify-center p-8">
                <Ruler className="w-16 h-16 text-accent/20 mb-3" />
                <span className="text-grey-muted text-sm">{title || 'Flash'}</span>
              </div>
            )}

            {/* Status overlay */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-heading font-bold text-lg uppercase tracking-widest px-6 py-3 rounded-full border border-white/30 backdrop-blur-sm flex items-center gap-2">
                  <Lock size={20} />
                  {flash.status === 'reserve'
                    ? tx({ fr: 'Réservé', en: 'Reserved' })
                    : tx({ fr: 'Pièce tatouée', en: 'Tattooed piece' })
                  }
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-4 md:p-10 overflow-y-auto flex-1" style={{ backgroundColor: 'var(--bg-card, #1a1a2e)' }}>
            {/* Title */}
            {title && (
              <h2 className="text-xl md:text-4xl font-heading font-bold text-heading mb-1 md:mb-3">
                {title}
              </h2>
            )}

            {/* Artist */}
            {tatoueurName && (
              <p className="text-grey-muted text-xs md:text-base mb-3 md:mb-5">
                {tx({ fr: 'par', en: 'by' })} {tatoueurName}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-6">
              {flash.style && (
                <span className="bg-bg-elevated text-grey-light text-xs md:text-sm px-3 py-1.5 rounded-full capitalize">
                  {flash.style}
                </span>
              )}
              {sizeLabel[lang] && (
                <span className="bg-bg-elevated text-grey-light text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Ruler size={14} />
                  {sizeLabel[lang]}
                </span>
              )}
              {flash.bodyPlacement && (
                <span className="bg-bg-elevated text-grey-light text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <MapPin size={14} />
                  {flash.bodyPlacement}
                </span>
              )}
              {flash.isUnique && (
                <span className="bg-accent/20 text-accent text-xs md:text-sm px-3 py-1.5 rounded-full font-bold">
                  {tx({ fr: 'Pièce unique', en: 'One of a kind' })}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-grey-light text-sm md:text-base leading-relaxed mb-6">
                {description}
              </p>
            )}

            {/* Price */}
            {flash.priceTattoo && !hidePrices && (
              <div className="mb-6 p-4 bg-bg-elevated rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-grey-muted text-sm flex items-center gap-2">
                    <DollarSign size={16} />
                    {tx({ fr: 'Prix du tatouage', en: 'Tattoo price' })}
                  </span>
                  <span className="text-2xl font-heading font-bold text-accent">
                    {flash.priceTattoo}$
                  </span>
                </div>
                {flash.printAvailable && flash.pricePrint && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-grey-muted text-sm flex items-center gap-2">
                      <Printer size={16} />
                      {tx({ fr: 'Print disponible', en: 'Print available' })}
                    </span>
                    <span className="text-lg font-bold text-heading">
                      {flash.pricePrint}$
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {isAvailable && !showLoginPrompt && (
                <button
                  onClick={() => {
                    if (!user) {
                      setShowLoginPrompt(true);
                    } else {
                      onReserve?.(flash);
                    }
                  }}
                  className="w-full btn-primary text-center py-3 text-base font-bold"
                >
                  <Check size={20} className="mr-2" />
                  {tx({ fr: 'Réserver cette pièce', en: 'Reserve this piece' })}
                </button>
              )}

              {showLoginPrompt && (
                <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-center space-y-3">
                  <LogIn size={24} className="mx-auto text-accent" />
                  <p className="text-heading text-sm font-medium">
                    {tx({ fr: 'Connectez-vous pour reserver ce flash', en: 'Sign in to reserve this flash' })}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      className="flex-1 btn-primary text-center py-2 text-sm font-bold"
                      onClick={onClose}
                    >
                      {tx({ fr: 'Se connecter', en: 'Sign in' })}
                    </Link>
                    <button
                      onClick={() => setShowLoginPrompt(false)}
                      className="flex-1 btn-secondary text-center py-2 text-sm"
                    >
                      {tx({ fr: 'Annuler', en: 'Cancel' })}
                    </button>
                  </div>
                </div>
              )}

              {flash.printAvailable && flash.pricePrint && (
                <button
                  className="w-full btn-secondary text-center py-3 text-base"
                >
                  <Printer size={20} className="mr-2" />
                  {tx({ fr: 'Acheter le print', en: 'Buy the print' })}{!hidePrices ? ` - ${flash.pricePrint}$` : ''}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
