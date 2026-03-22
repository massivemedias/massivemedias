import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Eye, EyeOff, X, Image, ExternalLink } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { mediaUrl } from '../../utils/cms';

export default function TatoueurRealisations({ tatoueur, setTatoueur }) {
  const { tx } = useLang();

  // Realisations sont stockees dans realisationImages (media multiple) sur le tatoueur
  const images = tatoueur?.realisationImages || [];
  const [hiddenImages, setHiddenImages] = useState(new Set());

  const visibleCount = images.length - hiddenImages.size;

  const toggleHide = (index) => {
    setHiddenImages(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-heading">
          {tx({ fr: 'Mes realisations', en: 'My Work' })}
        </h2>
        <span className="text-sm text-grey-muted">
          {visibleCount} {tx({ fr: 'visible', en: 'visible' })}{visibleCount > 1 ? 's' : ''} / {images.length} total
        </span>
      </div>

      <p className="text-sm text-grey-muted">
        {tx({
          fr: "Upload tes photos de tatouages realises. Tu peux masquer/afficher chaque image sans approbation.",
          en: 'Upload your completed tattoo photos. You can hide/show each image without approval.',
        })}
      </p>

      {/* Upload zone */}
      <label className="block border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-accent/30 transition-colors">
        <Upload size={32} className="mx-auto text-grey-muted mb-3" />
        <span className="text-sm text-grey-muted block">
          {tx({ fr: 'Cliquer ou glisser des images ici', en: 'Click or drag images here' })}
        </span>
        <span className="text-xs text-grey-muted/50 block mt-1">
          JPG, PNG, WebP - max 10 MB
        </span>
        <input type="file" accept="image/*" multiple className="hidden" />
      </label>

      {/* Images grid */}
      {images.length === 0 ? (
        <div className="text-center py-12 bg-bg-card rounded-xl border border-white/5">
          <Image className="w-12 h-12 text-grey-muted/30 mx-auto mb-3" />
          <p className="text-grey-muted">
            {tx({ fr: 'Aucune realisation pour le moment.', en: 'No completed work yet.' })}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, index) => {
            const url = img?.url ? mediaUrl(img) : img;
            const isHidden = hiddenImages.has(index);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`relative group rounded-lg overflow-hidden ${isHidden ? 'opacity-40' : ''}`}
              >
                <img
                  src={url}
                  alt={`Realisation ${index + 1}`}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => toggleHide(index)}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                    title={isHidden ? tx({ fr: 'Afficher', en: 'Show' }) : tx({ fr: 'Masquer', en: 'Hide' })}
                  >
                    {isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                {/* Hidden badge */}
                {isHidden && (
                  <div className="absolute top-2 right-2 bg-red-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {tx({ fr: 'Masque', en: 'Hidden' })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
