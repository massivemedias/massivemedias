import { motion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getArtistPrintPrice } from '../data/artists';
import { toFull } from '../utils/paths';

function ArtistPrintCard({ print, minPrice, pricing, selected, onClick, onZoom }) {
  const { tx } = useLang();
  const title = tx({ fr: print.titleFr, en: print.titleEn, es: print.titleEs || print.titleEn });

  // Pour les pieces uniques: prix custom ou prix fixe
  const fixedPrice = print.customPrice
    ? print.customPrice
    : (print.fixedFormat && print.fixedTier && pricing)
      ? getArtistPrintPrice(pricing, print.fixedTier, print.fixedFormat, false)?.basePrice
      : null;

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
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={print.image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {(print.unique || print.private) && print.sold && (
          <>
            <div className="absolute inset-0 bg-black/40 z-10" />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-grey-muted text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap z-20">
              {tx({ fr: 'Vendu', en: 'Sold', es: 'Vendido' })}
            </div>
          </>
        )}
        {print.unique && !print.sold && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap z-10">
            {tx({ fr: 'Unique', en: 'Unique', es: 'Única' })}
          </div>
        )}
        {print.onSale && !print.sold && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-500 text-black text-[9px] font-bold uppercase tracking-wider whitespace-nowrap z-10">
            -{print.salePercent || 20}%
          </div>
        )}
        {print.limited && !print.unique && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap z-10">
            {tx({ fr: 'Édition limitée', en: 'Limited', es: 'Limitada' })}
          </div>
        )}
        {onZoom && (
          <div
            onClick={handleZoom}
            // Mobile : loupe discrete flottante en bas a droite, sans fond, avec
            // drop-shadow fort pour rester visible sur images claires.
            // Desktop (md+) : comportement original (haut gauche, fond noir, fade au hover).
            className="absolute bottom-2 right-2 md:bottom-auto md:right-auto md:top-3 md:left-3 md:p-1.5 md:rounded-full md:bg-black/50 md:hover:bg-black/70 text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          >
            <ZoomIn className="w-5 h-5 md:w-4 md:h-4 drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)] md:drop-shadow-none" />
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-accent/10 border-2 border-accent rounded-t-xl" />
        )}
      </div>
      <div className="p-3">
        <h3 className="text-heading font-heading font-bold text-sm truncate">{title}</h3>
        <p className="text-grey-muted text-xs mt-0.5">
          {fixedPrice != null
            ? `${fixedPrice}$`
            : tx({ fr: `A partir de ${minPrice}$`, en: `Starting at $${minPrice}`, es: `Desde $${minPrice}` })
          }
        </p>
      </div>
    </motion.button>
  );
}

export default ArtistPrintCard;
