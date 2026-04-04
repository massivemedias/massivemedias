/**
 * InstantMockup - Apercu instantane d'une image dans un cadre sur un mur
 *
 * 6 scenes CSS avec meubles/elements en gradients, zero API, < 1 seconde.
 * - Salon, Chambre, Bureau, Salle a manger, Studio, Zen
 * - Cadre noir ou blanc avec passe-partout
 * - Clic pour lightbox plein ecran
 * - Dots pour changer de scene
 */
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

// 6 scenes avec couleurs mur, meubles CSS, ambiance
const SCENES = [
  {
    id: 'living_room', fr: 'Salon', en: 'Living Room', es: 'Salon',
    wall: 'linear-gradient(180deg, #e8e0d6 0%, #ddd4c8 100%)',
    furniture: (
      <>
        {/* Sol parquet */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '18%', background: 'linear-gradient(180deg, #b89878 0%, #a88868 100%)' }} />
        {/* Canape */}
        <div className="absolute bottom-[18%] left-[5%] right-[40%]" style={{ height: '22%', background: 'linear-gradient(0deg, #6b7b6a 0%, #7d8d7c 40%, #8a9a89 100%)', borderRadius: '8px 8px 0 0' }} />
        <div className="absolute bottom-[18%] left-[3%]" style={{ width: '4%', height: '28%', background: 'linear-gradient(90deg, #5a6a59, #6b7b6a)', borderRadius: '6px 0 0 0' }} />
        {/* Coussin */}
        <div className="absolute bottom-[30%] left-[10%]" style={{ width: '12%', height: '8%', background: '#d4a87a', borderRadius: '4px', opacity: 0.8 }} />
        {/* Plante droite */}
        <div className="absolute bottom-[18%] right-[8%]" style={{ width: '3%', height: '12%', background: '#8a7560', borderRadius: '0 0 2px 2px' }} />
        <div className="absolute bottom-[30%] right-[4%]" style={{ width: '11%', height: '18%', background: 'radial-gradient(ellipse, #4a7a4a 0%, #3a6a3a 60%, transparent 70%)', opacity: 0.9 }} />
      </>
    ),
  },
  {
    id: 'bedroom', fr: 'Chambre', en: 'Bedroom', es: 'Dormitorio',
    wall: 'linear-gradient(180deg, #e0dce8 0%, #d4d0dc 100%)',
    furniture: (
      <>
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '18%', background: 'linear-gradient(180deg, #c8beb0 0%, #b8ae9e 100%)' }} />
        {/* Tete de lit */}
        <div className="absolute bottom-[18%] left-[15%] right-[15%]" style={{ height: '18%', background: 'linear-gradient(0deg, #e8e2da 0%, #f0ebe4 100%)', borderRadius: '6px 6px 0 0' }} />
        {/* Oreillers */}
        <div className="absolute bottom-[30%] left-[22%]" style={{ width: '14%', height: '6%', background: '#fff', borderRadius: '3px', opacity: 0.9 }} />
        <div className="absolute bottom-[30%] right-[22%]" style={{ width: '14%', height: '6%', background: '#fff', borderRadius: '3px', opacity: 0.9 }} />
        {/* Lampe */}
        <div className="absolute bottom-[18%] right-[6%]" style={{ width: '2%', height: '20%', background: '#b0a090' }} />
        <div className="absolute bottom-[38%] right-[3%]" style={{ width: '8%', height: '5%', background: 'linear-gradient(0deg, #e8d8c0, #f0e8d8)', borderRadius: '50% 50% 0 0' }} />
      </>
    ),
  },
  {
    id: 'office', fr: 'Bureau', en: 'Office', es: 'Oficina',
    wall: 'linear-gradient(180deg, #dde0e4 0%, #d0d4d8 100%)',
    furniture: (
      <>
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '18%', background: 'linear-gradient(180deg, #a09088 0%, #908078 100%)' }} />
        {/* Bureau */}
        <div className="absolute bottom-[18%] left-[10%] right-[10%]" style={{ height: '4%', background: 'linear-gradient(0deg, #6a5a48, #7a6a58)', borderRadius: '2px' }} />
        {/* Ecran */}
        <div className="absolute bottom-[22%] left-[38%]" style={{ width: '18%', height: '14%', background: '#1a1a2e', borderRadius: '3px', border: '2px solid #333' }} />
        <div className="absolute bottom-[22%] left-[45%]" style={{ width: '4%', height: '3%', background: '#555' }} />
        {/* Etagere */}
        <div className="absolute top-[12%] right-[5%]" style={{ width: '18%', height: '3%', background: '#8a7a68', borderRadius: '1px' }} />
        <div className="absolute top-[8%] right-[7%]" style={{ width: '5%', height: '4%', background: '#4a7a4a', borderRadius: '2px', opacity: 0.7 }} />
        <div className="absolute top-[8%] right-[14%]" style={{ width: '3%', height: '4%', background: '#c0a880', borderRadius: '1px' }} />
      </>
    ),
  },
  {
    id: 'dining', fr: 'Salle a manger', en: 'Dining Room', es: 'Comedor',
    wall: 'linear-gradient(180deg, #f0e8dc 0%, #e4dcd0 100%)',
    furniture: (
      <>
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '18%', background: 'linear-gradient(180deg, #c8b8a0 0%, #b8a890 100%)' }} />
        {/* Table */}
        <div className="absolute bottom-[18%] left-[20%] right-[20%]" style={{ height: '3%', background: 'linear-gradient(0deg, #7a6248, #8a7258)', borderRadius: '2px' }} />
        {/* Pieds table */}
        <div className="absolute bottom-[10%] left-[25%]" style={{ width: '2%', height: '8%', background: '#6a5238' }} />
        <div className="absolute bottom-[10%] right-[25%]" style={{ width: '2%', height: '8%', background: '#6a5238' }} />
        {/* Vase */}
        <div className="absolute bottom-[21%] left-[44%]" style={{ width: '6%', height: '8%', background: '#d4b896', borderRadius: '30% 30% 40% 40%' }} />
        <div className="absolute bottom-[29%] left-[45%]" style={{ width: '4%', height: '4%', background: '#5a8a4a', borderRadius: '50%', opacity: 0.8 }} />
        {/* Lustre */}
        <div className="absolute top-0 left-[46%]" style={{ width: '2%', height: '10%', background: '#b0a090' }} />
        <div className="absolute top-[10%] left-[40%]" style={{ width: '14%', height: '4%', background: 'radial-gradient(ellipse, #f0e0c8 0%, #d4c0a0 100%)', borderRadius: '0 0 50% 50%' }} />
      </>
    ),
  },
  {
    id: 'studio', fr: 'Studio', en: 'Studio', es: 'Estudio',
    wall: 'linear-gradient(180deg, #d8d0c8 0%, #c8c0b8 100%)',
    furniture: (
      <>
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '18%', background: 'linear-gradient(180deg, #a8a098 0%, #989088 100%)' }} />
        {/* Chevalet */}
        <div className="absolute bottom-[18%] right-[12%]" style={{ width: '2%', height: '30%', background: '#8a7a60', transform: 'rotate(-5deg)' }} />
        <div className="absolute bottom-[18%] right-[8%]" style={{ width: '2%', height: '30%', background: '#7a6a50', transform: 'rotate(5deg)' }} />
        <div className="absolute bottom-[38%] right-[6%]" style={{ width: '14%', height: '12%', background: '#f0e8dc', border: '2px solid #c0b0a0', borderRadius: '1px' }} />
        {/* Tabouret */}
        <div className="absolute bottom-[18%] left-[8%]" style={{ width: '10%', height: '3%', background: '#6a5a48', borderRadius: '2px' }} />
        <div className="absolute bottom-[10%] left-[10%]" style={{ width: '2%', height: '8%', background: '#5a4a38' }} />
        <div className="absolute bottom-[10%] left-[15%]" style={{ width: '2%', height: '8%', background: '#5a4a38' }} />
      </>
    ),
  },
  {
    id: 'zen', fr: 'Zen', en: 'Zen', es: 'Zen',
    wall: 'linear-gradient(180deg, #e8e4dc 0%, #dcd8d0 100%)',
    furniture: (
      <>
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '18%', background: 'linear-gradient(180deg, #c8bca8 0%, #b8ac98 100%)' }} />
        {/* Banc bas */}
        <div className="absolute bottom-[18%] left-[25%] right-[25%]" style={{ height: '5%', background: 'linear-gradient(0deg, #a89878, #b8a888)', borderRadius: '2px' }} />
        {/* Bougie gauche */}
        <div className="absolute bottom-[23%] left-[30%]" style={{ width: '3%', height: '5%', background: '#f0e8dc', borderRadius: '1px' }} />
        <div className="absolute bottom-[28%] left-[30.5%]" style={{ width: '2%', height: '2%', background: 'radial-gradient(#ffa500, #ff6600)', borderRadius: '50% 50% 20% 20%', opacity: 0.9 }} />
        {/* Plante bambou */}
        <div className="absolute bottom-[18%] left-[6%]" style={{ width: '4%', height: '8%', background: '#a09078', borderRadius: '2px' }} />
        <div className="absolute bottom-[26%] left-[5%]" style={{ width: '2%', height: '22%', background: '#5a8a3a' }} />
        <div className="absolute bottom-[26%] left-[7%]" style={{ width: '2%', height: '18%', background: '#4a7a2a', transform: 'rotate(5deg)' }} />
        <div className="absolute bottom-[26%] left-[3.5%]" style={{ width: '2%', height: '15%', background: '#6a9a4a', transform: 'rotate(-8deg)' }} />
      </>
    ),
  },
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

  const renderScene = (size = 'small') => {
    const isLarge = size === 'large';
    const borderW = isLarge ? 10 : 6;
    const matW = isLarge ? 20 : 12;

    return (
      <div
        className={`relative overflow-hidden ${isLarge ? '' : 'rounded-xl cursor-pointer'}`}
        style={{
          background: scene.wall,
          aspectRatio: '16/10',
          width: '100%',
        }}
        onClick={!isLarge ? () => setLightboxOpen(true) : undefined}
      >
        {/* Spot eclairage */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: '50%', height: '35%', background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.25) 0%, transparent 70%)' }} />

        {/* Cadre + image au centre */}
        <div className="absolute inset-0 flex items-start justify-center" style={{ paddingTop: isLarge ? '6%' : '5%' }}>
          <div style={{
            width: isLandscape ? '55%' : '38%',
            filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.3)) drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
          }}>
            {/* Cadre */}
            <div style={{
              padding: `${borderW}px`,
              background: isBlack
                ? 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #111 100%)'
                : 'linear-gradient(145deg, #fff 0%, #f5f0eb 50%, #e8e3de 100%)',
              borderRadius: '1px',
            }}>
              {/* Passe-partout */}
              <div style={{
                padding: `${matW}px`,
                background: isBlack
                  ? 'linear-gradient(135deg, #f8f6f2 0%, #f0ece6 100%)'
                  : 'linear-gradient(135deg, #fefefe 0%, #f8f6f2 100%)',
              }}>
                <div className="relative overflow-hidden" style={{ aspectRatio: isLandscape ? '4/3' : '3/4' }}>
                  <img
                    src={imageUrl}
                    alt={tx({ fr: 'Apercu', en: 'Preview', es: 'Vista previa' })}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* Reflet verre */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meubles / elements de scene */}
        {scene.furniture}

        {/* Vignettage */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.06) 100%)' }} />
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Scene */}
      {renderScene('small')}

      {/* Dots scenes */}
      <div className="flex items-center justify-center gap-2">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSceneIdx(i)}
            className="group flex flex-col items-center gap-0.5"
            title={tx({ fr: s.fr, en: s.en, es: s.es })}
          >
            <span className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === sceneIdx ? 'bg-accent scale-125' : 'bg-white/20 group-hover:bg-white/40'
            }`} />
            <span className={`text-[8px] transition-colors ${
              i === sceneIdx ? 'text-accent' : 'text-transparent group-hover:text-grey-muted'
            }`}>
              {tx({ fr: s.fr, en: s.en, es: s.es })}
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <X size={24} />
          </button>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {renderScene('large')}
            {/* Dots dans le lightbox aussi */}
            <div className="flex items-center justify-center gap-3 mt-4">
              {SCENES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSceneIdx(i)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    i === sceneIdx ? 'bg-accent text-white' : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {tx({ fr: s.fr, en: s.en, es: s.es })}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstantMockup;
