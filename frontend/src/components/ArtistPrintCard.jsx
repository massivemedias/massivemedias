import { motion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { toFull } from '../utils/paths';

function ArtistPrintCard({ print, minPrice, selected, onClick, onZoom }) {
  const { tx } = useLang();
  const title = tx({ fr: print.titleFr, en: print.titleEn, es: print.titleEs || print.titleEn });

  const handleZoom = (e) => {
    e.stopPropagation();
    if (onZoom) onZoom(print.fullImage || toFull(print.image));
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`group block w-full text-left rounded-xl overflow-hidden transition-all duration-300 border-2 ${
        selected
          ? 'border-accent shadow-lg shadow-accent/20'
          : 'border-transparent hover:border-accent/30 card-bg-bordered'
      }`}
    >
      <div className="relative aspect-[2/3] overflow-hidden watermark">
        <img
          src={print.image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {print.limited && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wider">
            {tx({ fr: 'Édition limitée', en: 'Limited Edition', es: 'Edición limitada' })}
          </div>
        )}
        {onZoom && (
          <div
            onClick={handleZoom}
            className="absolute top-3 left-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          >
            <ZoomIn size={16} />
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-accent/10 border-2 border-accent rounded-t-xl" />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-heading font-heading font-bold text-sm">{title}</h3>
        <p className="text-grey-muted text-xs mt-1">
          {tx({ fr: `A partir de ${minPrice}$`, en: `Starting at $${minPrice}`, es: `Desde $${minPrice}` })}
        </p>
      </div>
    </motion.button>
  );
}

export default ArtistPrintCard;
