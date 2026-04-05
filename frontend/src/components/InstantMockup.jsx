/**
 * InstantMockup v5 - Chroma-key Canvas
 *
 * 12 photos de pieces avec cadres integres + placeholder vert (#00FF00).
 * Canvas detecte les pixels verts en temps reel et les remplace par:
 * 1. Couleur mat (passe-partout) pour couvrir tout le vert
 * 2. Image du client dimensionnee selon le format choisi, centree dans le mat
 *
 * Le cadre fait partie de la photo = integration naturelle.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sofa, BedDouble, Briefcase, Flower2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const SCENES = [
  { id: 'bedroom', icon: BedDouble, fr: 'Chambre', en: 'Bedroom', es: 'Dormitorio' },
  { id: 'living_room', icon: Sofa, fr: 'Salon', en: 'Living Room', es: 'Salon' },
  { id: 'office', icon: Briefcase, fr: 'Bureau', en: 'Office', es: 'Oficina' },
  { id: 'zen', icon: Flower2, fr: 'Zen', en: 'Zen', es: 'Zen' },
];

const MAT_COLOR = { r: 240, g: 237, b: 232 }; // #f0ede8

function InstantMockup({ imageUrl, frameColor = 'black', format = 'a4', className = '' }) {
  const { tx } = useLang();
  const canvasRefs = useRef({});
  const lightboxCanvasRef = useRef(null);
  const [lightboxScene, setLightboxScene] = useState(null);
  const [ready, setReady] = useState(false);

  const roomImgCache = useRef({});
  const userImgRef = useRef(null);

  useEffect(() => {
    if (!imageUrl) { setReady(false); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { userImgRef.current = img; setReady(true); };
    img.onerror = () => setReady(false);
    img.src = imageUrl;
  }, [imageUrl]);

  const drawComposite = useCallback((canvas, targetWidth, sceneId) => {
    if (!canvas || !userImgRef.current) return;
    const roomKey = `${sceneId}_${frameColor}`;

    const doRender = (roomImg) => {
      const roomRatio = roomImg.naturalHeight / roomImg.naturalWidth;
      const cw = targetWidth;
      const ch = Math.round(cw * roomRatio);
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');

      // 1. Dessiner la photo de la piece
      ctx.drawImage(roomImg, 0, 0, cw, ch);

      // 2. Detecter la bounding box du vert (#00FF00) dans les pixels
      const imageData = ctx.getImageData(0, 0, cw, ch);
      const pixels = imageData.data;
      let minX = cw, minY = ch, maxX = 0, maxY = 0;

      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const i = (y * cw + x) * 4;
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          // Vert: detection large pour attraper l'anti-aliasing et la compression
          const isGreen = g > 100 && g > r * 1.3 && g > b * 1.3;
          if (isGreen) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            // Remplacer le pixel vert par la couleur du mat
            pixels[i] = MAT_COLOR.r;
            pixels[i + 1] = MAT_COLOR.g;
            pixels[i + 2] = MAT_COLOR.b;
          }
        }
      }

      // Remettre les pixels modifies (vert -> mat)
      ctx.putImageData(imageData, 0, 0);

      if (maxX <= minX || maxY <= minY) return; // Pas de vert trouve

      // 3. Zone du mat (la ou etait le vert)
      const matX = minX;
      const matY = minY;
      const matW = maxX - minX + 1;
      const matH = maxY - minY + 1;

      // 4. Dessiner l'image du client - elle remplit tout le mat
      // (le format est deja represente par le ratio de la photo du client)
      const userImg = userImgRef.current;
      const matRatio = matW / matH;
      const imgRatio = userImg.naturalWidth / userImg.naturalHeight;

      // L'image remplit toute la zone du mat (pas de marge supplementaire)
      const printX = matX;
      const printY = matY;
      const printW = matW;
      const printH = matH;
      const printRatio = printW / printH;

      // Cover crop
      let sx = 0, sy = 0, sw = userImg.naturalWidth, sh = userImg.naturalHeight;
      if (imgRatio > printRatio) {
        sw = Math.round(sh * printRatio);
        sx = Math.round((userImg.naturalWidth - sw) / 2);
      } else {
        sh = Math.round(sw / printRatio);
        sy = Math.round((userImg.naturalHeight - sh) / 2);
      }

      ctx.drawImage(userImg, sx, sy, sw, sh, printX, printY, printW, printH);
    };

    const roomSrc = `/images/mockups/${roomKey}.webp`;
    if (roomImgCache.current[roomKey]) {
      doRender(roomImgCache.current[roomKey]);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { roomImgCache.current[roomKey] = img; doRender(img); };
      img.src = roomSrc;
    }
  }, [frameColor]);

  const [sceneIdx, setSceneIdx] = useState(0);

  // Dessiner le mockup actif
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRefs.current['main'];
    if (canvas) drawComposite(canvas, 800, SCENES[sceneIdx].id);
  }, [ready, frameColor, sceneIdx, drawComposite]);

  // Lightbox
  useEffect(() => {
    if (lightboxScene && lightboxCanvasRef.current && ready) {
      drawComposite(lightboxCanvasRef.current, 1400, lightboxScene);
    }
  }, [lightboxScene, ready, frameColor, drawComposite]);

  if (!imageUrl || !ready) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Dots au dessus */}
      <div className="flex items-center justify-center gap-2">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSceneIdx(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === sceneIdx ? 'bg-accent scale-125' : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Canvas mockup unique */}
      <canvas
        ref={el => { canvasRefs.current['main'] = el; }}
        className="w-full rounded-xl cursor-pointer shadow-lg"
        onClick={() => setLightboxScene(SCENES[sceneIdx].id)}
      />

      {/* Lightbox */}
      {lightboxScene && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxScene(null)}>
          <button onClick={() => setLightboxScene(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10">
            <X size={24} />
          </button>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <canvas ref={lightboxCanvasRef} className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

export default InstantMockup;
