import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Ruler, DollarSign, Printer, Lock, Check } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { mediaUrl } from '../utils/cms';

const SIZE_LABELS = {
  petit: { fr: 'Petit (5-10 cm)', en: 'Small (2-4 in)' },
  moyen: { fr: 'Moyen (10-20 cm)', en: 'Medium (4-8 in)' },
  grand: { fr: 'Grand (20-35 cm)', en: 'Large (8-14 in)' },
  'tres-grand': { fr: 'Tres grand (35+ cm)', en: 'Extra large (14+ in)' },
};

export default function FlashLightbox({ flash, onClose, onReserve, tatoueurName }) {
  const { lang, tx } = useLang();

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
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
          className="relative z-10 bg-bg-card rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl"
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
          <div className="md:w-1/2 relative bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title || 'Flash tattoo'}
                className="w-full h-full object-contain max-h-[50vh] md:max-h-[90vh]"
              />
            ) : (
              <div className="w-full h-full min-h-[300px] bg-bg-elevated flex items-center justify-center">
                <span className="text-grey-muted text-lg">Flash</span>
              </div>
            )}

            {/* Status overlay */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-heading font-bold text-lg uppercase tracking-widest px-6 py-3 rounded-full border border-white/30 backdrop-blur-sm flex items-center gap-2">
                  <Lock size={20} />
                  {flash.status === 'reserve'
                    ? tx({ fr: 'Reserve', en: 'Reserved' })
                    : tx({ fr: 'Piece tatouee', en: 'Tattooed piece' })
                  }
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto">
            {/* Title */}
            {title && (
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-2">
                {title}
              </h2>
            )}

            {/* Artist */}
            {tatoueurName && (
              <p className="text-grey-muted text-sm mb-4">
                {tx({ fr: 'par', en: 'by' })} {tatoueurName}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {flash.style && (
                <span className="bg-bg-elevated text-grey-light text-xs px-3 py-1.5 rounded-full capitalize">
                  {flash.style}
                </span>
              )}
              {sizeLabel[lang] && (
                <span className="bg-bg-elevated text-grey-light text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Ruler size={12} />
                  {sizeLabel[lang]}
                </span>
              )}
              {flash.bodyPlacement && (
                <span className="bg-bg-elevated text-grey-light text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                  <MapPin size={12} />
                  {flash.bodyPlacement}
                </span>
              )}
              {flash.isUnique && (
                <span className="bg-accent/20 text-accent text-xs px-3 py-1.5 rounded-full font-bold">
                  {tx({ fr: 'Piece unique', en: 'One of a kind' })}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-grey-light text-sm leading-relaxed mb-6">
                {description}
              </p>
            )}

            {/* Price */}
            {flash.priceTattoo && (
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
              {isAvailable && (
                <button
                  onClick={() => onReserve?.(flash)}
                  className="w-full btn-primary text-center py-3 text-base font-bold"
                >
                  <Check size={20} className="mr-2" />
                  {tx({ fr: 'Reserver cette piece', en: 'Reserve this piece' })}
                </button>
              )}

              {flash.printAvailable && flash.pricePrint && (
                <button
                  className="w-full btn-secondary text-center py-3 text-base"
                >
                  <Printer size={20} className="mr-2" />
                  {tx({ fr: 'Acheter le print', en: 'Buy the print' })} - {flash.pricePrint}$
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
