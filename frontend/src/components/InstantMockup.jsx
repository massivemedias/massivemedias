/**
 * InstantMockup v6 - Composant controle (sceneId en prop)
 *
 * Rendu canvas chroma-key pour un seul scene donne.
 * La navigation (fleches, dots) est geree par le parent (ArtisteDetail).
 * Cliquer sur le canvas ouvre la lightbox haute resolution.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

const MAT_COLOR = { r: 240, g: 237, b: 232 }; // #f0ede8

function InstantMockup({ imageUrl, frameColor = 'black', isLandscape = false, sceneId, className = '' }) {
  const canvasRef = useRef(null);
  const lightboxCanvasRef = useRef(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const roomImgCache = useRef({});
  const userImgRef = useRef(null);

  // Charger l'image du print
  useEffect(() => {
    if (!imageUrl) { setReady(false); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { userImgRef.current = img; setReady(true); };
    img.onerror = () => setReady(false);
    img.src = imageUrl;
  }, [imageUrl]);

  const drawComposite = useCallback((canvas, targetWidth, sid, landscape, fc) => {
    if (!canvas || !userImgRef.current || !sid) return;
    // Utilise la variante " 2" pour les prints paysage
    const variant = landscape ? ' 2' : '';
    const roomKey = `${sid}_${fc}${variant}`;
    const roomSrc = `/images/mockups/${roomKey}.webp`;

    const doRender = (roomImg) => {
      const roomRatio = roomImg.naturalHeight / roomImg.naturalWidth;
      const cw = targetWidth;
      const ch = Math.round(cw * roomRatio);
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(roomImg, 0, 0, cw, ch);

      const imageData = ctx.getImageData(0, 0, cw, ch);
      const pixels = imageData.data;
      let minX = cw, minY = ch, maxX = 0, maxY = 0;

      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const i = (y * cw + x) * 4;
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          const isGreen = g > 100 && g > r * 1.3 && g > b * 1.3;
          if (isGreen) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            pixels[i] = MAT_COLOR.r;
            pixels[i + 1] = MAT_COLOR.g;
            pixels[i + 2] = MAT_COLOR.b;
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);

      if (maxX <= minX || maxY <= minY) return;

      const margin = Math.max(4, Math.round(Math.min(maxX - minX, maxY - minY) * 0.02));
      const printX = minX + margin;
      const printY = minY + margin;
      const printW = maxX - minX + 1 - margin * 2;
      const printH = maxY - minY + 1 - margin * 2;
      if (printW <= 0 || printH <= 0) return;

      const printRatio = printW / printH;
      const userImg = userImgRef.current;
      const imgRatio = userImg.naturalWidth / userImg.naturalHeight;

      let sx = 0, sy = 0, sw = userImg.naturalWidth, sh = userImg.naturalHeight;
      if (imgRatio > printRatio) {
        sw = Math.round(sh * printRatio);
        sx = Math.round((userImg.naturalWidth - sw) / 2);
      } else {
        sh = Math.round(sw / printRatio);
        sy = Math.round((userImg.naturalHeight - sh) / 2);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(printX, printY, printW, printH);
      ctx.clip();
      ctx.drawImage(userImg, sx, sy, sw, sh, printX, printY, printW, printH);
      ctx.restore();
    };

    if (roomImgCache.current[roomKey]) {
      doRender(roomImgCache.current[roomKey]);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { roomImgCache.current[roomKey] = img; doRender(img); };
      img.onerror = () => {
        // Fallback: si la variante landscape n'existe pas, tenter la version portrait
        if (landscape) {
          const fallbackKey = `${sid}_${fc}`;
          if (roomImgCache.current[fallbackKey]) {
            doRender(roomImgCache.current[fallbackKey]);
          } else {
            const fallbackImg = new Image();
            fallbackImg.crossOrigin = 'anonymous';
            fallbackImg.onload = () => { roomImgCache.current[fallbackKey] = fallbackImg; doRender(fallbackImg); };
            fallbackImg.src = `/images/mockups/${fallbackKey}.webp`;
          }
        }
      };
      img.src = roomSrc;
    }
  }, []);

  // Dessiner quand scene, cadre ou image change
  useEffect(() => {
    if (!ready || !sceneId) return;
    if (canvasRef.current) drawComposite(canvasRef.current, 800, sceneId, isLandscape, frameColor);
  }, [ready, sceneId, isLandscape, frameColor, drawComposite]);

  // Lightbox
  useEffect(() => {
    if (lightboxOpen && lightboxCanvasRef.current && ready && sceneId) {
      drawComposite(lightboxCanvasRef.current, 1400, sceneId, isLandscape, frameColor);
    }
  }, [lightboxOpen, ready, sceneId, isLandscape, frameColor, drawComposite]);

  if (!imageUrl || !ready || !sceneId) return null;

  return (
    <div className={`w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl cursor-zoom-in shadow-lg"
        onClick={() => setLightboxOpen(true)}
      />

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
          </div>
        </div>
      )}
    </div>
  );
}

export default InstantMockup;
