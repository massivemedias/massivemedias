/**
 * InstantMockup v5 - Cadre dynamique Canvas
 *
 * Photos de pieces SANS cadre + cadre dessine en Canvas.
 * Le cadre s'adapte au format (A6-A2) et a l'orientation (portrait/paysage).
 * Ombres, passe-partout, reflet verre - tout en Canvas.
 * Instantane, zero API.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sofa, BedDouble, Briefcase, UtensilsCrossed, BookOpen, Flower2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const SCENES = [
  { id: 'living_room', icon: Sofa, fr: 'Salon', en: 'Living Room', es: 'Salon' },
  { id: 'bedroom', icon: BedDouble, fr: 'Chambre', en: 'Bedroom', es: 'Dormitorio' },
  { id: 'office', icon: Briefcase, fr: 'Bureau', en: 'Office', es: 'Oficina' },
  { id: 'dining', icon: UtensilsCrossed, fr: 'Salle a manger', en: 'Dining Room', es: 'Comedor' },
  { id: 'studio', icon: BookOpen, fr: 'Studio', en: 'Studio', es: 'Estudio' },
  { id: 'zen', icon: Flower2, fr: 'Zen', en: 'Zen', es: 'Zen' },
];

// Dimensions reelles en pouces
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
  const [isLandscape, setIsLandscape] = useState(false);

  const roomImgCache = useRef({});
  const userImgRef = useRef(null);

  const scene = SCENES[sceneIdx];

  // Charger l'image du client + detecter orientation
  useEffect(() => {
    if (!imageUrl) { setReady(false); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      userImgRef.current = img;
      setIsLandscape(img.naturalWidth > img.naturalHeight);
      setReady(true);
    };
    img.onerror = () => setReady(false);
    img.src = imageUrl;
  }, [imageUrl]);

  const drawComposite = useCallback((canvas, targetWidth) => {
    if (!canvas || !userImgRef.current) return;

    const roomSrc = `/images/mockups/${scene.id}.webp`;

    const doRender = (roomImg) => {
      const roomRatio = roomImg.naturalHeight / roomImg.naturalWidth;
      const cw = targetWidth;
      const ch = Math.round(cw * roomRatio);
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');

      // 1. Photo de la piece (fond)
      ctx.drawImage(roomImg, 0, 0, cw, ch);

      // 2. Calculer les dimensions du cadre selon le format et l'orientation
      const fmtBase = FORMAT_SIZES[format] || FORMAT_SIZES.a4;
      const fmtW = isLandscape ? Math.max(fmtBase.w, fmtBase.h) : Math.min(fmtBase.w, fmtBase.h);
      const fmtH = isLandscape ? Math.min(fmtBase.w, fmtBase.h) : Math.max(fmtBase.w, fmtBase.h);
      const fmtRatio = fmtW / fmtH;

      // Echelle: le plus grand format (A2) occupe ~45% de la largeur du canvas
      const a2Max = Math.max(FORMAT_SIZES.a2.w, FORMAT_SIZES.a2.h);
      const fmtMax = Math.max(fmtW, fmtH);
      const baseScale = 0.45 * (fmtMax / a2Max);
      // Minimum 25% pour que A6 soit visible
      const scale = Math.max(0.25, baseScale);

      // Taille de l'image (print) en pixels
      let printW, printH;
      if (isLandscape) {
        printW = Math.round(cw * scale);
        printH = Math.round(printW / fmtRatio);
      } else {
        printH = Math.round(ch * scale * 1.1);
        printW = Math.round(printH * fmtRatio);
      }

      // Epaisseurs cadre et passe-partout proportionnelles au print
      const frameBorder = Math.max(4, Math.round(Math.min(printW, printH) * 0.03));
      const matBorder = Math.max(6, Math.round(Math.min(printW, printH) * 0.07));

      // Dimensions totales (cadre exterieur)
      const totalW = printW + (matBorder + frameBorder) * 2;
      const totalH = printH + (matBorder + frameBorder) * 2;

      // Centrer sur le mur (partie superieure, ~35% du haut)
      const cx = Math.round(cw / 2);
      const cy = Math.round(ch * 0.35);
      const frameX = cx - totalW / 2;
      const frameY = cy - totalH / 2;

      // 3. Ombre portee du cadre sur le mur
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = frameColor === 'white' ? '#e8e4de' : '#1a1a1a';
      ctx.fillRect(frameX, frameY, totalW, totalH);
      ctx.restore();

      // 4. Cadre (bois noir ou blanc)
      const isBlack = frameColor === 'black';
      // Gradient pour simuler le bois/reflet
      const frameGrad = ctx.createLinearGradient(frameX, frameY, frameX + totalW, frameY + totalH);
      if (isBlack) {
        frameGrad.addColorStop(0, '#333');
        frameGrad.addColorStop(0.3, '#1a1a1a');
        frameGrad.addColorStop(0.7, '#111');
        frameGrad.addColorStop(1, '#222');
      } else {
        frameGrad.addColorStop(0, '#fff');
        frameGrad.addColorStop(0.3, '#f0ece6');
        frameGrad.addColorStop(0.7, '#e8e4de');
        frameGrad.addColorStop(1, '#f5f2ed');
      }
      ctx.fillStyle = frameGrad;
      ctx.fillRect(frameX, frameY, totalW, totalH);

      // 5. Passe-partout (blanc casse)
      const matX = frameX + frameBorder;
      const matY = frameY + frameBorder;
      const matW = totalW - frameBorder * 2;
      const matH = totalH - frameBorder * 2;
      ctx.fillStyle = '#f5f2ed';
      ctx.fillRect(matX, matY, matW, matH);

      // Ombre interieure du passe-partout (biseau)
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      const printX = matX + matBorder;
      const printY = matY + matBorder;
      ctx.fillStyle = '#eee';
      ctx.fillRect(printX, printY, printW, printH);
      ctx.restore();

      // 6. Dessiner l'image du client (cover crop au ratio du format)
      const userImg = userImgRef.current;
      const imgRatio = userImg.naturalWidth / userImg.naturalHeight;
      let sx = 0, sy = 0, sw = userImg.naturalWidth, sh = userImg.naturalHeight;
      if (imgRatio > fmtRatio) {
        sw = Math.round(sh * fmtRatio);
        sx = Math.round((userImg.naturalWidth - sw) / 2);
      } else {
        sh = Math.round(sw / fmtRatio);
        sy = Math.round((userImg.naturalHeight - sh) / 2);
      }
      ctx.drawImage(userImg, sx, sy, sw, sh, printX, printY, printW, printH);

      // 7. Reflet de verre subtil
      const glassGrad = ctx.createLinearGradient(printX, printY, printX + printW, printY + printH);
      glassGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
      glassGrad.addColorStop(0.3, 'rgba(255,255,255,0.02)');
      glassGrad.addColorStop(0.7, 'transparent');
      glassGrad.addColorStop(1, 'rgba(255,255,255,0.03)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(printX, printY, printW, printH);
    };

    // Charger ou utiliser le cache
    if (roomImgCache.current[scene.id]) {
      doRender(roomImgCache.current[scene.id]);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        roomImgCache.current[scene.id] = img;
        doRender(img);
      };
      img.src = roomSrc;
    }
  }, [scene.id, frameColor, format, isLandscape]);

  useEffect(() => {
    if (ready && canvasRef.current) drawComposite(canvasRef.current, 800);
  }, [ready, drawComposite]);

  useEffect(() => {
    if (lightboxOpen && lightboxCanvasRef.current && ready) drawComposite(lightboxCanvasRef.current, 1400);
  }, [lightboxOpen, ready, drawComposite]);

  if (!imageUrl || !ready) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl cursor-pointer shadow-lg"
        onClick={() => setLightboxOpen(true)}
      />

      {/* Selecteur scenes */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {SCENES.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSceneIdx(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                i === sceneIdx ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
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
            <canvas ref={lightboxCanvasRef} className="w-full rounded-lg" />
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
