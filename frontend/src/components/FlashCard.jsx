import { motion } from 'framer-motion';
import { Lock, Check, Palette } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { mediaUrl } from '../utils/cms';

const STATUS_CONFIG = {
  disponible: {
    labelFr: 'Disponible',
    labelEn: 'Available',
    color: 'bg-green-500',
    border: 'border-green-500/30',
    icon: Check,
  },
  reserve: {
    labelFr: 'Reserve',
    labelEn: 'Reserved',
    color: 'bg-amber-500',
    border: 'border-amber-500/30',
    icon: Lock,
  },
  tatoue: {
    labelFr: 'Tatoue',
    labelEn: 'Tattooed',
    color: 'bg-gray-500',
    border: 'border-gray-500/30',
    icon: Palette,
  },
};

const SIZE_LABELS = {
  petit: { fr: 'Petit', en: 'Small' },
  moyen: { fr: 'Moyen', en: 'Medium' },
  grand: { fr: 'Grand', en: 'Large' },
  'tres-grand': { fr: 'Tres grand', en: 'Extra large' },
};

export default function FlashCard({ flash, onClick, index = 0 }) {
  const { lang, tx } = useLang();
  const status = STATUS_CONFIG[flash.status] || STATUS_CONFIG.disponible;
  const StatusIcon = status.icon;
  const isAvailable = flash.status === 'disponible';

  const title = lang === 'en' ? (flash.titleEn || flash.titleFr) : (flash.titleFr || flash.titleEn);
  const imageUrl = flash.image?.url ? mediaUrl(flash.image) : flash.image;
  const sizeLabel = SIZE_LABELS[flash.size] || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      viewport={{ once: true }}
      className={`group relative cursor-pointer rounded-lg overflow-hidden border ${status.border} bg-bg-card transition-all duration-300 hover:shadow-lg hover:shadow-accent/5`}
      onClick={() => onClick?.(flash)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title || 'Flash tattoo'}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              !isAvailable ? 'opacity-60' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
            <Palette className="w-12 h-12 text-grey-muted/30" />
          </div>
        )}

        {/* Status overlay for non-available */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm uppercase tracking-widest px-4 py-2 rounded-full border border-white/30 backdrop-blur-sm">
              {tx({ fr: status.labelFr, en: status.labelEn })}
            </span>
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 right-3 ${status.color} text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
          <StatusIcon size={12} />
          {tx({ fr: status.labelFr, en: status.labelEn })}
        </div>

        {/* Unique badge */}
        {flash.isUnique && isAvailable && (
          <div className="absolute top-3 left-3 bg-accent text-black text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            {tx({ fr: 'Piece unique', en: 'One of a kind' })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {title && (
          <h3 className="font-heading font-bold text-heading text-sm mb-1 line-clamp-1">
            {title}
          </h3>
        )}

        <div className="flex items-center justify-between text-xs text-grey-muted">
          <div className="flex items-center gap-2">
            {flash.style && (
              <span className="bg-bg-elevated px-2 py-0.5 rounded-full capitalize">
                {flash.style}
              </span>
            )}
            {sizeLabel[lang] && (
              <span className="bg-bg-elevated px-2 py-0.5 rounded-full">
                {sizeLabel[lang]}
              </span>
            )}
          </div>

          {flash.priceTattoo && isAvailable && (
            <span className="font-bold text-accent text-sm">
              {flash.priceTattoo}$
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
