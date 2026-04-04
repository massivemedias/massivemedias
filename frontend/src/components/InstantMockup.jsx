/**
 * InstantMockup - Apercu photo d'une image dans un cadre sur un mur
 *
 * Utilise des photos de pieces pre-generees (Gemini, stockees en static)
 * et superpose l'image du client dans un cadre CSS par-dessus.
 * Zero API call, instantane (< 1 seconde), 6 scenes.
 *
 * Props:
 *   - imageUrl: URL de l'image (uploadee ou artiste)
 *   - frameColor: 'black' | 'white'
 *   - className: classes CSS additionnelles
 */
import { useState, useEffect } from 'react';
import { X, Sofa, BedDouble, Briefcase, UtensilsCrossed, BookOpen, Flower2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const SCENES = [
  { id: 'living_room', icon: Sofa, fr: 'Salon', en: 'Living Room', es: 'Salon', img: '/images/mockups/living_room.webp' },
  { id: 'bedroom', icon: BedDouble, fr: 'Chambre', en: 'Bedroom', es: 'Dormitorio', img: '/images/mockups/bedroom.webp' },
  { id: 'office', icon: Briefcase, fr: 'Bureau', en: 'Office', es: 'Oficina', img: '/images/mockups/office.webp' },
  { id: 'dining', icon: UtensilsCrossed, fr: 'Salle a manger', en: 'Dining Room', es: 'Comedor', img: '/images/mockups/dining.webp' },
  { id: 'studio', icon: BookOpen, fr: 'Studio', en: 'Studio', es: 'Estudio', img: '/images/mockups/studio.webp' },
  { id: 'zen', icon: Flower2, fr: 'Zen', en: 'Zen', es: 'Zen', img: '/images/mockups/zen.webp' },
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

  // Cadre CSS superpose sur la photo de la piece
  const renderMockup = (isLarge = false) => {
    const frameW = isLandscape ? (isLarge ? '42%' : '44%') : (isLarge ? '28%' : '30%');
    const borderPx = isLarge ? 8 : 5;
    const matPx = isLarge ? 16 : 10;

    return (
      <div
        className={`relative overflow-hidden ${isLarge ? 'rounded-lg' : 'rounded-xl cursor-pointer'}`}
        style={{ aspectRatio: '16/10' }}
        onClick={!isLarge ? () => setLightboxOpen(true) : undefined}
      >
        {/* Photo de la piece en background */}
        <img
          src={scene.img}
          alt={tx({ fr: scene.fr, en: scene.en, es: scene.es })}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Cadre + image du client, centre sur le mur */}
        <div className="absolute inset-0 flex items-start justify-center" style={{ paddingTop: '8%' }}>
          <div
            style={{
              width: frameW,
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35)) drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
            }}
          >
            {/* Cadre exterieur */}
            <div
              style={{
                padding: `${borderPx}px`,
                background: isBlack
                  ? 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f5f0eb 50%, #ebe6e0 100%)',
                borderRadius: '1px',
              }}
            >
              {/* Passe-partout */}
              <div
                style={{
                  padding: `${matPx}px`,
                  background: isBlack
                    ? 'linear-gradient(135deg, #f5f3ef 0%, #edeae4 100%)'
                    : 'linear-gradient(135deg, #fefefe 0%, #f8f5f0 100%)',
                }}
              >
                {/* Image du client */}
                <div className="relative overflow-hidden" style={{ aspectRatio: isLandscape ? '4/3' : '3/4' }}>
                  <img
                    src={imageUrl}
                    alt={tx({ fr: 'Votre oeuvre', en: 'Your artwork', es: 'Tu obra' })}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* Reflet verre subtil */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.03) 100%)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vignettage leger */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center 40%, transparent 50%, rgba(0,0,0,0.12) 100%)' }}
        />
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {renderMockup(false)}

      {/* Selecteur de scenes */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
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

      {/* Lightbox plein ecran */}
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
            {/* Selecteur dans le lightbox */}
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
