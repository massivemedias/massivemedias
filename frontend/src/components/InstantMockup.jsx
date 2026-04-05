/**
 * InstantMockup - Compositing Canvas d'une image dans un cadre photo integre
 *
 * Utilise des photos de pieces pre-generees (Gemini) avec cadre DEJA PRESENT
 * dans l'image. Un placeholder vert a ete remplace par les coords du cadre.
 * Canvas dessine la photo de piece puis place l'image du client dans le cadre.
 *
 * Resultat: integration naturelle, le cadre fait partie de la photo originale.
 * Instantane, zero API call, 6 scenes x 2 couleurs de cadre.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sofa, BedDouble, Briefcase, UtensilsCrossed, BookOpen, Flower2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

// Coordonnees du placeholder (en % de l'image) - detectees depuis les photos
const FRAME_COORDS = {
  living_room_black: { x: 39.8, y: 14.3, w: 20.5, h: 28.3 },
  living_room_white: { x: 41, y: 16.2, w: 17.6, h: 22.7 },
  bedroom_black: { x: 40.4, y: 23.8, w: 21.5, h: 14.6 },
  bedroom_white: { x: 37.7, y: 18.6, w: 24.2, h: 18.4 },
  office_black: { x: 39.5, y: 14.8, w: 21.7, h: 32 },
  office_white: { x: 40.2, y: 16.8, w: 21.7, h: 30.5 },
  dining_black: { x: 35.7, y: 21.7, w: 28.7, h: 18 },
  dining_white: { x: 31.6, y: 23.4, w: 36.5, h: 24.2 },
  studio_black: { x: 42.8, y: 28.7, w: 15.4, h: 22.5 },
  studio_white: { x: 38.5, y: 26, w: 21.3, h: 25 },
  zen_black: { x: 40.6, y: 16.6, w: 21.7, h: 20.9 },
  zen_white: { x: 40.6, y: 27, w: 18.9, h: 25 },
};

const SCENES = [
  { id: 'living_room', icon: Sofa, fr: 'Salon', en: 'Living Room', es: 'Salon' },
  { id: 'bedroom', icon: BedDouble, fr: 'Chambre', en: 'Bedroom', es: 'Dormitorio' },
  { id: 'office', icon: Briefcase, fr: 'Bureau', en: 'Office', es: 'Oficina' },
  { id: 'dining', icon: UtensilsCrossed, fr: 'Salle a manger', en: 'Dining Room', es: 'Comedor' },
  { id: 'studio', icon: BookOpen, fr: 'Studio', en: 'Studio', es: 'Estudio' },
  { id: 'zen', icon: Flower2, fr: 'Zen', en: 'Zen', es: 'Zen' },
];

// Dimensions reelles des formats (en pouces) pour proportions correctes
const FORMAT_SIZES = {
  postcard: { w: 4, h: 6 },
  a4: { w: 8.5, h: 11 },
  a3: { w: 11, h: 17 },
  a3plus: { w: 13, h: 19 },
  a2: { w: 18, h: 24 },
};

function InstantMockup({ imageUrl, frameColor = 'black', format = 'a4', className = '' }) {
  const { tx } = useLang();
  const canvasRef = useRef(null);
  const lightboxCanvasRef = useRef(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Cache des images chargees
  const roomImgCache = useRef({});
  const userImgRef = useRef(null);

  const scene = SCENES[sceneIdx];
  const frameKey = `${scene.id}_${frameColor}`;
  const coords = FRAME_COORDS[frameKey];

  // Charger l'image du client
  useEffect(() => {
    if (!imageUrl) { setReady(false); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { userImgRef.current = img; setReady(true); };
    img.onerror = () => setReady(false);
    img.src = imageUrl;
  }, [imageUrl]);

  // Dessiner le composite sur un canvas
  const drawComposite = useCallback((canvas, targetWidth) => {
    if (!canvas || !userImgRef.current || !coords) return;

    const roomKey = frameKey;
    const roomSrc = `/images/mockups/${roomKey}.webp`;

    const doRender = (roomImg) => {
      const ratio = roomImg.naturalHeight / roomImg.naturalWidth;
      const cw = targetWidth;
      const ch = Math.round(cw * ratio);
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');

      // 1. Dessiner la photo de la piece
      ctx.drawImage(roomImg, 0, 0, cw, ch);

      // 2. Zone du placeholder (le rectangle vert original)
      const placeholderX = Math.round(cw * coords.x / 100);
      const placeholderY = Math.round(ch * coords.y / 100);
      const placeholderW = Math.round(cw * coords.w / 100);
      const placeholderH = Math.round(ch * coords.h / 100);
      const placeholderCx = placeholderX + placeholderW / 2;
      const placeholderCy = placeholderY + placeholderH / 2;

      // 3. Calculer la taille du print selon le format choisi
      // Le format A2 (le plus grand) occupe tout le placeholder
      // Les formats plus petits sont proportionnellement reduits
      const fmtSize = FORMAT_SIZES[format] || FORMAT_SIZES.a4;
      const a2Size = FORMAT_SIZES.a2; // reference = le plus grand
      const fmtArea = fmtSize.w * fmtSize.h;
      const a2Area = a2Size.w * a2Size.h;
      // Echelle basee sur la racine carree du ratio de surface (perception visuelle)
      const scaleFactor = Math.sqrt(fmtArea / a2Area);
      // Minimum 55% du placeholder pour que meme A6 soit visible
      const clampedScale = Math.max(0.55, Math.min(1.0, scaleFactor));

      // Ratio du format (portrait par defaut)
      const fmtRatio = fmtSize.w / fmtSize.h; // < 1 pour portrait

      // Taille du print dans le placeholder
      let printW, printH;
      if (fmtRatio < 1) {
        // Portrait: hauteur = placeholder * scale, largeur = proportionnelle
        printH = Math.round(placeholderH * clampedScale * 1.3); // 1.3x zoom
        printW = Math.round(printH * fmtRatio);
        // Si trop large, contraindre
        if (printW > placeholderW * clampedScale * 1.3) {
          printW = Math.round(placeholderW * clampedScale * 1.3);
          printH = Math.round(printW / fmtRatio);
        }
      } else {
        // Paysage: largeur = placeholder * scale
        printW = Math.round(placeholderW * clampedScale * 1.3);
        printH = Math.round(printW / fmtRatio);
        if (printH > placeholderH * clampedScale * 1.3) {
          printH = Math.round(placeholderH * clampedScale * 1.3);
          printW = Math.round(printH * fmtRatio);
        }
      }

      // Centrer le print dans le placeholder
      const printX = Math.round(placeholderCx - printW / 2);
      const printY = Math.round(placeholderCy - printH / 2);

      // 4. Dessiner l'image du client (cover crop selon le ratio du format)
      const userImg = userImgRef.current;
      const imgRatio = userImg.naturalWidth / userImg.naturalHeight;

      let sx = 0, sy = 0, sw = userImg.naturalWidth, sh = userImg.naturalHeight;
      if (imgRatio > fmtRatio) {
        sw = Math.round(userImg.naturalHeight * fmtRatio);
        sx = Math.round((userImg.naturalWidth - sw) / 2);
      } else {
        sh = Math.round(userImg.naturalWidth / fmtRatio);
        sy = Math.round((userImg.naturalHeight - sh) / 2);
      }

      ctx.drawImage(userImg, sx, sy, sw, sh, printX, printY, printW, printH);
    };

    // Charger ou utiliser le cache
    if (roomImgCache.current[roomKey]) {
      doRender(roomImgCache.current[roomKey]);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        roomImgCache.current[roomKey] = img;
        doRender(img);
      };
      img.src = roomSrc;
    }
  }, [frameKey, coords, format]);

  // Re-dessiner quand les parametres changent
  useEffect(() => {
    if (ready && canvasRef.current) {
      drawComposite(canvasRef.current, 800);
    }
  }, [ready, sceneIdx, frameColor, format, drawComposite]);

  // Dessiner le lightbox
  useEffect(() => {
    if (lightboxOpen && lightboxCanvasRef.current && ready) {
      drawComposite(lightboxCanvasRef.current, 1400);
    }
  }, [lightboxOpen, ready, sceneIdx, frameColor, format, drawComposite]);

  if (!imageUrl || !ready) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Canvas mockup */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl cursor-pointer shadow-lg"
        onClick={() => setLightboxOpen(true)}
        style={{ aspectRatio: '16/10' }}
      />

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
            <canvas
              ref={lightboxCanvasRef}
              className="w-full rounded-lg"
              style={{ aspectRatio: '16/10' }}
            />
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
