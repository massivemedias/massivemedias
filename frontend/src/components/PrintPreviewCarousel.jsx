/**
 * PrintPreviewCarousel - Carrousel unique: apercu cadre + mockups
 *
 * Slide 0: FramePreview (apercu CSS du print dans un cadre)
 * Slides 1-4: Mockups dans des pieces (chroma-key Canvas)
 * Auto-play 3 secondes, dots en dessous, swipe mobile
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

// Import du FramePreview depuis ConfiguratorFineArt (on le duplique ici pour l'isoler)
// Les scenes mockup
const MOCKUP_SCENES = [
  { id: 'bedroom', fr: 'Chambre', en: 'Bedroom' },
  { id: 'living_room', fr: 'Salon', en: 'Living Room' },
  { id: 'office', fr: 'Bureau', en: 'Office' },
  { id: 'zen', fr: 'Zen', en: 'Zen' },
];

const MAT_COLOR = { r: 240, g: 237, b: 232 };

function PrintPreviewCarousel({ image, withFrame, frameColor, format, formats, tx, isLandscape, onClickImage }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const canvasRefs = useRef({});
  const lightboxCanvasRef = useRef(null);
  const userImgRef = useRef(null);
  const roomImgCache = useRef({});
  const autoPlayRef = useRef(null);
  const totalSlides = image ? 1 + MOCKUP_SCENES.length : 0;

  // Charger l'image du client
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { userImgRef.current = img; };
    img.src = image;
  }, [image]);

  // Auto-play 3 secondes
  useEffect(() => {
    if (!image || totalSlides <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % totalSlides);
    }, 3000);
    return () => clearInterval(autoPlayRef.current);
  }, [image, totalSlides]);

  // Pause auto-play au hover
  const pauseAutoPlay = () => clearInterval(autoPlayRef.current);
  const resumeAutoPlay = () => {
    if (!image || totalSlides <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % totalSlides);
    }, 3000);
  };

  // Dessiner un mockup Canvas (chroma-key)
  const drawMockup = useCallback((canvas, targetWidth, sceneId) => {
    if (!canvas || !userImgRef.current) return;
    const fc = withFrame ? frameColor : 'black';
    const roomKey = `${sceneId}_${fc}`;
    const roomSrc = `/images/mockups/${roomKey}.webp`;

    const doRender = (roomImg) => {
      const roomRatio = roomImg.naturalHeight / roomImg.naturalWidth;
      const cw = targetWidth;
      const ch = Math.round(cw * roomRatio);
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(roomImg, 0, 0, cw, ch);

      // Chroma-key: remplacer le vert par mat + image
      const imageData = ctx.getImageData(0, 0, cw, ch);
      const pixels = imageData.data;
      let minX = cw, minY = ch, maxX = 0, maxY = 0;
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const i = (y * cw + x) * 4;
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          if (g > 100 && g > r * 1.3 && g > b * 1.3) {
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

      const printX = minX, printY = minY, printW = maxX - minX + 1, printH = maxY - minY + 1;
      const printRatio = printW / printH;
      const userImg = userImgRef.current;
      const imgRatio = userImg.naturalWidth / userImg.naturalHeight;
      let sx = 0, sy = 0, sw = userImg.naturalWidth, sh = userImg.naturalHeight;
      if (imgRatio > printRatio) { sw = Math.round(sh * printRatio); sx = Math.round((userImg.naturalWidth - sw) / 2); }
      else { sh = Math.round(sw / printRatio); sy = Math.round((userImg.naturalHeight - sh) / 2); }
      ctx.drawImage(userImg, sx, sy, sw, sh, printX, printY, printW, printH);
    };

    if (roomImgCache.current[roomKey]) { doRender(roomImgCache.current[roomKey]); }
    else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { roomImgCache.current[roomKey] = img; doRender(img); };
      img.src = roomSrc;
    }
  }, [withFrame, frameColor]);

  // Dessiner les mockups quand l'image ou les options changent
  useEffect(() => {
    if (!image || !userImgRef.current) return;
    // Petit delai pour s'assurer que l'image est chargee
    const timer = setTimeout(() => {
      MOCKUP_SCENES.forEach(s => {
        const canvas = canvasRefs.current[s.id];
        if (canvas) drawMockup(canvas, 600, s.id);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [image, frameColor, withFrame, drawMockup]);

  // Lightbox mockup
  useEffect(() => {
    if (lightboxOpen && slideIdx > 0 && lightboxCanvasRef.current && userImgRef.current) {
      drawMockup(lightboxCanvasRef.current, 1400, MOCKUP_SCENES[slideIdx - 1].id);
    }
  }, [lightboxOpen, slideIdx, drawMockup]);

  if (!image) return null;

  // FramePreview inline (slide 0)
  const fmt = formats?.find(f => f.id === format);
  const fmtW = fmt?.w || 8.5;
  const fmtH = fmt?.h || 11;
  const useLandscape = isLandscape;
  const w = useLandscape ? Math.max(fmtW, fmtH) : Math.min(fmtW, fmtH);
  const h = useLandscape ? Math.min(fmtW, fmtH) : Math.max(fmtW, fmtH);
  const maxDim = Math.max(fmtW, fmtH);
  const scaleFactor = 320 / 24;
  const previewMaxW = Math.max(180, Math.round(maxDim * scaleFactor));
  const isPostcard = format === 'postcard';
  const frameW = isPostcard && withFrame ? (useLandscape ? 7 : 5) : w;
  const frameH = isPostcard && withFrame ? (useLandscape ? 5 : 7) : h;
  const frameThickness = withFrame ? Math.max(8, Math.round(previewMaxW * 0.04)) : 0;
  const matThickness = withFrame ? (isPostcard ? Math.max(16, Math.round(previewMaxW * 0.1)) : Math.max(12, Math.round(previewMaxW * 0.06))) : 0;

  return (
    <div
      className="space-y-2"
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
    >
      {/* Zone d'apercu unique */}
      <div className="relative overflow-hidden rounded-xl" style={{ minHeight: '200px' }}>
        {/* Slide 0: FramePreview */}
        {slideIdx === 0 && (
          <div className="flex items-center justify-center p-2 cursor-pointer" onClick={onClickImage}>
            <div style={{ aspectRatio: withFrame ? `${frameW}/${frameH}` : `${w}/${h}`, width: '100%', maxWidth: `${previewMaxW}px` }}
              className="relative transition-all duration-500 ease-out">
              {withFrame ? (
                <div className="absolute inset-0 rounded-[2px]" style={{
                  background: frameColor === 'black' ? 'linear-gradient(135deg, #2a2a2a, #111)' : 'linear-gradient(135deg, #fff, #e8e3de)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  padding: `${frameThickness}px`,
                }}>
                  <div style={{ background: '#f5f2ed', padding: `${matThickness}px`, width: '100%', height: '100%' }}>
                    <div className="w-full h-full overflow-hidden">
                      {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-glass" />}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 overflow-hidden shadow-lg">
                  {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-glass" />}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slides 1-4: Mockups Canvas */}
        {slideIdx > 0 && (
          <canvas
            ref={el => { canvasRefs.current[MOCKUP_SCENES[slideIdx - 1].id] = el; }}
            className="w-full cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          />
        )}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSlideIdx(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === slideIdx ? 'bg-accent scale-125' : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10">
            <X size={24} />
          </button>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {slideIdx > 0 ? (
              <canvas ref={lightboxCanvasRef} className="w-full rounded-lg" />
            ) : (
              <div className="flex justify-center">
                <img src={image} alt="" className="max-h-[80vh] rounded-lg object-contain" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PrintPreviewCarousel;
