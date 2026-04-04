/**
 * InstantMockup - Apercu instantane d'une image dans un cadre sur un mur
 *
 * Utilise du CSS pur (pas d'API) pour un rendu < 1 seconde.
 * Montre l'image dans un cadre noir ou blanc accroché sur un mur
 * avec ombre portee et eclairage realiste.
 *
 * Props:
 *   - imageUrl: URL de l'image (uploadee ou artiste)
 *   - frameColor: 'black' | 'white'
 *   - className: classes CSS additionnelles
 */
import { useState, useEffect } from 'react';
import { useLang } from '../i18n/LanguageContext';

// Couleurs mur selon le theme (subtiles, neutres)
const WALL_STYLES = [
  { bg: 'linear-gradient(180deg, #e8e0d6 0%, #d4ccc2 100%)', shadow: 'rgba(0,0,0,0.25)' }, // Beige chaud
];

function InstantMockup({ imageUrl, frameColor = 'black', className = '' }) {
  const { tx } = useLang();
  const [isLandscape, setIsLandscape] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Detecter orientation
  useEffect(() => {
    if (!imageUrl) { setLoaded(false); return; }
    const img = new window.Image();
    img.onload = () => {
      setIsLandscape(img.naturalWidth > img.naturalHeight);
      setLoaded(true);
    };
    img.onerror = () => setLoaded(false);
    img.src = imageUrl;
  }, [imageUrl]);

  if (!imageUrl || !loaded) return null;

  const wall = WALL_STYLES[0];
  const isBlack = frameColor === 'black';

  // Dimensions cadre proportionnelles
  const frameW = isLandscape ? 280 : 200;
  const frameH = isLandscape ? 200 : 280;
  const borderW = 8;
  const matW = 16;

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      {/* Mur */}
      <div
        className="relative flex items-center justify-center"
        style={{
          background: wall.bg,
          padding: '40px 30px 50px',
          minHeight: `${frameH + 100}px`,
        }}
      >
        {/* Eclairage spot du haut */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{
            width: '60%',
            height: '40%',
            background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Cadre + image */}
        <div
          className="relative"
          style={{
            width: `${frameW}px`,
            maxWidth: '80%',
            // Ombre portee du cadre sur le mur
            filter: `drop-shadow(0 8px 24px ${wall.shadow}) drop-shadow(0 2px 8px rgba(0,0,0,0.15))`,
          }}
        >
          {/* Cadre exterieur */}
          <div
            style={{
              padding: `${borderW}px`,
              background: isBlack
                ? 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #111 100%)'
                : 'linear-gradient(145deg, #fff 0%, #f5f0eb 50%, #e8e3de 100%)',
              borderRadius: '2px',
            }}
          >
            {/* Passe-partout */}
            <div
              style={{
                padding: `${matW}px`,
                background: isBlack
                  ? 'linear-gradient(135deg, #f8f6f2 0%, #f0ece6 100%)'
                  : 'linear-gradient(135deg, #fefefe 0%, #f8f6f2 100%)',
              }}
            >
              {/* Image */}
              <div className="relative overflow-hidden" style={{ aspectRatio: isLandscape ? '4/3' : '3/4' }}>
                <img
                  src={imageUrl}
                  alt={tx({ fr: 'Apercu', en: 'Preview', es: 'Vista previa' })}
                  className="w-full h-full object-cover"
                />
                {/* Reflet subtil sur le verre */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Surface/meuble en bas */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: '20px',
            background: 'linear-gradient(180deg, #b8a898 0%, #a09080 100%)',
            borderTop: '1px solid rgba(0,0,0,0.1)',
          }}
        />

        {/* Leger vignettage */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.08) 100%)',
          }}
        />
      </div>
    </div>
  );
}

export default InstantMockup;
