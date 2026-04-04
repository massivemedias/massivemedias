/**
 * InstantMockup - Apercu photo d'une image dans un cadre sur un mur
 *
 * Photos de pieces pre-generees (Gemini, stockees en static WebP).
 * L'image du client est superposee dans un cadre CSS avec:
 * - Passe-partout realiste
 * - Ombre portee sur le mur
 * - Leger effet perspective pour l'integration
 * - Position ajustee par scene (pas sur les meubles!)
 *
 * Zero API, instantane, 6 scenes, lightbox plein ecran.
 */
import { useState, useEffect } from 'react';
import { X, Sofa, BedDouble, Briefcase, UtensilsCrossed, BookOpen, Flower2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

// Position du cadre adaptee a chaque scene (en % depuis le haut)
// Chaque photo a le mur dans les ~60% superieurs, meubles en bas
const SCENES = [
  { id: 'living_room', icon: Sofa, fr: 'Salon', en: 'Living Room', es: 'Salon', img: '/images/mockups/living_room.webp', frameTop: '10%' },
  { id: 'bedroom', icon: BedDouble, fr: 'Chambre', en: 'Bedroom', es: 'Dormitorio', img: '/images/mockups/bedroom.webp', frameTop: '8%' },
  { id: 'office', icon: Briefcase, fr: 'Bureau', en: 'Office', es: 'Oficina', img: '/images/mockups/office.webp', frameTop: '10%' },
  { id: 'dining', icon: UtensilsCrossed, fr: 'Salle a manger', en: 'Dining Room', es: 'Comedor', img: '/images/mockups/dining.webp', frameTop: '8%' },
  { id: 'studio', icon: BookOpen, fr: 'Studio', en: 'Studio', es: 'Estudio', img: '/images/mockups/studio.webp', frameTop: '10%' },
  { id: 'zen', icon: Flower2, fr: 'Zen', en: 'Zen', es: 'Zen', img: '/images/mockups/zen.webp', frameTop: '10%' },
];

function InstantMockup({ imageUrl, frameColor = 'black', className = '' }) {
  const { tx } = useLang();
  const [isLandscape, setIsLandscape] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!imageUrl) { setLoaded(false); return; }
    setLoaded(false);
    const img = new window.Image();
    img.onload = () => {
      setIsLandscape(img.naturalWidth > img.naturalHeight);
      setLoaded(true);
    };
    img.onerror = () => setLoaded(false);
    img.src = imageUrl;
  }, [imageUrl]);

  if (!imageUrl || !loaded) return null;

  const scene = SCENES[sceneIdx];
  const isBlack = frameColor === 'black';

  const renderMockup = (isLarge = false) => {
    const frameWidth = isLandscape ? (isLarge ? '38%' : '40%') : (isLarge ? '24%' : '26%');
    const borderPx = isLarge ? 7 : 4;
    const matPx = isLarge ? 14 : 8;

    return (
      <div
        className={`relative overflow-hidden select-none ${isLarge ? 'rounded-lg' : 'rounded-xl cursor-pointer'}`}
        style={{ aspectRatio: '16/10' }}
        onClick={!isLarge ? () => setLightboxOpen(true) : undefined}
      >
        {/* Photo de la piece */}
        <img
          src={scene.img}
          alt={tx({ fr: scene.fr, en: scene.en, es: scene.es })}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Cadre positionne sur le mur */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: scene.frameTop,
            width: frameWidth,
            // Ombre portee realiste sur le mur
            filter: `
              drop-shadow(0 4px 12px rgba(0,0,0,0.3))
              drop-shadow(0 1px 3px rgba(0,0,0,0.2))
              drop-shadow(0 12px 28px rgba(0,0,0,0.15))
            `,
            // Subtile perspective pour integrer au mur
            transform: 'translateX(-50%) perspective(800px) rotateX(0.5deg)',
          }}
        >
          {/* Cadre */}
          <div
            style={{
              padding: `${borderPx}px`,
              background: isBlack
                ? 'linear-gradient(160deg, #333 0%, #1a1a1a 40%, #111 100%)'
                : 'linear-gradient(160deg, #fff 0%, #f0ece6 40%, #e5e0da 100%)',
              borderRadius: '1px',
              // Reflet subtil du cadre
              boxShadow: isBlack
                ? 'inset 1px 1px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(0,0,0,0.3)'
                : 'inset 1px 1px 0 rgba(255,255,255,0.5), inset -1px -1px 0 rgba(0,0,0,0.05)',
            }}
          >
            {/* Passe-partout */}
            <div
              style={{
                padding: `${matPx}px`,
                background: isBlack
                  ? '#f0ede8'
                  : '#faf8f5',
                // Ombre interieure du passe-partout (effet profondeur biseau)
                boxShadow: 'inset 0 0 2px rgba(0,0,0,0.08), inset 1px 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {/* Image du client */}
              <div
                className="relative overflow-hidden"
                style={{
                  aspectRatio: isLandscape ? '4/3' : '3/4',
                  // Ombre interieure subtile (le cadre projette une ombre sur l'image)
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src={imageUrl}
                  alt={tx({ fr: 'Votre oeuvre', en: 'Your artwork', es: 'Tu obra' })}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* Reflet de la vitre */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      linear-gradient(
                        120deg,
                        rgba(255,255,255,0.04) 0%,
                        rgba(255,255,255,0.08) 25%,
                        transparent 50%,
                        transparent 75%,
                        rgba(255,255,255,0.02) 100%
                      )
                    `,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vignettage photo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center 35%, transparent 55%, rgba(0,0,0,0.1) 100%)' }}
        />
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {renderMockup(false)}

      {/* Selecteur de scenes */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {SCENES.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSceneIdx(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                i === sceneIdx
                  ? 'bg-accent text-white'
                  : 'bg-black/20 text-grey-muted hover:text-heading'
              }`}
            >
              <Icon size={10} />
              {tx({ fr: s.fr, en: s.en, es: s.es })}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <X size={24} />
          </button>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {renderMockup(true)}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {SCENES.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSceneIdx(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      i === sceneIdx ? 'bg-accent text-white' : 'bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <Icon size={12} />
                    {tx({ fr: s.fr, en: s.en, es: s.es })}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstantMockup;
