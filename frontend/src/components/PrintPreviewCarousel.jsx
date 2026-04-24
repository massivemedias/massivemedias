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

function PrintPreviewCarousel({ image, withFrame, frameColor, format, formats, tx, isLandscape, isSquare = false, onClickImage }) {
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

  // Pas d'auto-play - navigation manuelle seulement

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

      // Reduire la zone pour eviter les bords verts et le debordement
      const margin = Math.max(4, Math.round(Math.min(maxX - minX, maxY - minY) * 0.02));
      let printX = minX + margin, printY = minY + margin;
      let printW = maxX - minX + 1 - margin * 2, printH = maxY - minY + 1 - margin * 2;
      if (printW <= 0 || printH <= 0) return;

      // FIX-SQUARE-MOCKUP (23 avril 2026) : si le format choisi est carre, on
      // reduit la zone d'impression a un carre centre dans le cadre detecte.
      // Les pixels green exterieurs au carre ont deja ete remplaces par la
      // couleur mat (visible ci-dessus ligne 73-75), donc l'image carree rendue
      // s'inscrit dans un "mini cadre" carre avec mat top/bottom visible.
      // C'est l'equivalent visuel d'un mat carre dans un cadre portrait : le
      // rendu reste propre et coherent sans devoir fabriquer des assets de
      // chambre dedies aux formats carres.
      const currentFmt = formats?.find(f => f.id === format);
      const fmtShape = currentFmt?.shape
        || (Math.abs((currentFmt?.w || 1) - (currentFmt?.h || 1)) < 0.5 ? 'square' : 'rect');
      const isSquareFormat = fmtShape === 'square';
      if (isSquareFormat) {
        const side = Math.min(printW, printH);
        printX = printX + Math.round((printW - side) / 2);
        printY = printY + Math.round((printH - side) / 2);
        printW = side;
        printH = side;
      }

      const printRatio = printW / printH; // 1 si format carre
      const userImg = userImgRef.current;
      const imgRatio = userImg.naturalWidth / userImg.naturalHeight;
      let sx = 0, sy = 0, sw = userImg.naturalWidth, sh = userImg.naturalHeight;
      if (imgRatio > printRatio) { sw = Math.round(sh * printRatio); sx = Math.round((userImg.naturalWidth - sw) / 2); }
      else { sh = Math.round(sw / printRatio); sy = Math.round((userImg.naturalHeight - sh) / 2); }

      // Clipper pour que l'image ne depasse jamais le cadre reduit
      ctx.save();
      ctx.beginPath();
      ctx.rect(printX, printY, printW, printH);
      ctx.clip();
      ctx.drawImage(userImg, sx, sy, sw, sh, printX, printY, printW, printH);
      ctx.restore();
    };

    if (roomImgCache.current[roomKey]) { doRender(roomImgCache.current[roomKey]); }
    else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { roomImgCache.current[roomKey] = img; doRender(img); };
      img.src = roomSrc;
    }
  }, [withFrame, frameColor, format, formats]);

  // Dessiner le mockup du slide actif quand les options changent
  useEffect(() => {
    if (!image || !userImgRef.current || slideIdx === 0) return;
    const sceneId = MOCKUP_SCENES[slideIdx - 1]?.id;
    if (!sceneId) return;
    const timer = setTimeout(() => {
      const canvas = canvasRefs.current[sceneId];
      if (canvas) drawMockup(canvas, 600, sceneId);
    }, 100);
    return () => clearTimeout(timer);
  }, [image, frameColor, withFrame, slideIdx, drawMockup]);

  // Pre-dessiner tous les mockups au chargement initial
  useEffect(() => {
    if (!image || !userImgRef.current) return;
    const timer = setTimeout(() => {
      MOCKUP_SCENES.forEach(s => {
        const canvas = canvasRefs.current[s.id];
        if (canvas) drawMockup(canvas, 600, s.id);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [image, drawMockup]);

  // Lightbox mockup
  useEffect(() => {
    if (lightboxOpen && slideIdx > 0 && lightboxCanvasRef.current && userImgRef.current) {
      drawMockup(lightboxCanvasRef.current, 1400, MOCKUP_SCENES[slideIdx - 1].id);
    }
  }, [lightboxOpen, slideIdx, drawMockup]);

  if (!image) return null;

  // FramePreview inline (slide 0)
  // FIX-SQUARE (23 avril 2026) : si le format est carre (shape === 'square' OU
  // isSquare signale par le parent), le cadre preview rend un 1:1 exact,
  // l'object-fit:cover garde l'image carree sans distorsion, et le rapport de
  // landscape est ignore.
  const fmt = formats?.find(f => f.id === format);
  const fmtShape = fmt?.shape || (Math.abs((fmt?.w || 1) - (fmt?.h || 1)) < 0.5 ? 'square' : 'rect');
  const renderSquare = fmtShape === 'square' || isSquare;
  const fmtW = fmt?.w || 8.5;
  const fmtH = fmt?.h || 11;
  const useLandscape = !renderSquare && isLandscape;
  const w = renderSquare ? 1 : (useLandscape ? Math.max(fmtW, fmtH) : Math.min(fmtW, fmtH));
  const h = renderSquare ? 1 : (useLandscape ? Math.min(fmtW, fmtH) : Math.max(fmtW, fmtH));
  const maxDim = Math.max(fmtW, fmtH);
  const scaleFactor = 320 / 24;
  const previewMaxW = Math.max(180, Math.round(maxDim * scaleFactor));
  const isPostcard = format === 'postcard';
  const frameW = isPostcard && withFrame ? (useLandscape ? 7 : 5) : w;
  const frameH = isPostcard && withFrame ? (useLandscape ? 5 : 7) : h;
  const frameThickness = withFrame ? Math.max(8, Math.round(previewMaxW * 0.04)) : 0;
  const matThickness = withFrame ? (isPostcard ? Math.max(16, Math.round(previewMaxW * 0.1)) : Math.max(12, Math.round(previewMaxW * 0.06))) : 0;

  return (
    <div className="space-y-2">
      {/* Zone d'apercu unique - swipeable */}
      <div className="relative overflow-hidden rounded-xl"
        onTouchStart={(e) => { e.currentTarget._touchX = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (!e.currentTarget._touchX) return;
          const diff = e.currentTarget._touchX - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40) {
            const dir = diff > 0 ? 1 : -1;
            setSlideIdx(prev => (prev + dir + totalSlides) % totalSlides);
          }
          e.currentTarget._touchX = null;
        }}>
        {/* Slide 0: FramePreview
            REWRITE (23 avril 2026) : architecture entierement en positionnement
            absolu + object-fit + outline (pas de border ni box-shadow inset).
            Chaque couche (cadre / mat / image) est un enfant absolute du wrapper
            aspect-ratio -> layout strict, aucun cascade de rounding subpixel,
            layout identique noir vs blanc.

            Hierarchie :
              <wrapper aspectRatio>     relative, aspect-ratio impose
                <frame>                 absolute inset-0, couleur + outline
                <mat>                   absolute inset-{frameThickness}
                  <imageBox>            absolute inset-{matThickness}, overflow hidden
                    <img>               absolute top:0 left:0 w/h:100%, object-fit:cover

            La couleur du cadre blanc utilise `outline: 1px solid` avec
            `outline-offset: -1px` - contrairement a `border`, outline n'entre
            PAS dans le box-sizing, donc zero decalage. */}
        <div className={slideIdx === 0 ? '' : 'hidden'}>
          <div className="flex items-center justify-center p-2 cursor-pointer" onClick={onClickImage}>
            <div
              className={`relative transition-all duration-500 ease-out ${renderSquare ? 'aspect-square' : ''}`}
              style={{
                // Si renderSquare, on force 1/1 (l'aspect-square Tailwind fait pareil
                // mais on double-up en inline pour etre sur contre les purges CSS).
                aspectRatio: renderSquare ? '1 / 1' : (withFrame ? `${frameW} / ${frameH}` : `${w} / ${h}`),
                width: '100%',
                maxWidth: `${previewMaxW}px`,
              }}
            >
              {withFrame ? (
                <>
                  {/* Cadre exterieur (couleur + outline pour blanc) */}
                  <div
                    className="absolute inset-0 rounded-[2px]"
                    style={{
                      background: frameColor === 'black'
                        ? 'linear-gradient(135deg, #2a2a2a, #111)'
                        : 'linear-gradient(135deg, #fff, #e8e3de)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      // outline n'est PAS dans le box model -> zero decalage entre noir et blanc.
                      outline: frameColor === 'white' ? '1px solid rgba(0,0,0,0.12)' : 'none',
                      outlineOffset: '-1px',
                    }}
                  />
                  {/* Mat / passe-partout (absolute inset base sur frameThickness) */}
                  <div
                    className="absolute overflow-hidden"
                    style={{
                      top: `${frameThickness}px`,
                      left: `${frameThickness}px`,
                      right: `${frameThickness}px`,
                      bottom: `${frameThickness}px`,
                      background: '#f5f2ed',
                    }}
                  >
                    {/* Zone image (absolute inset base sur matThickness) */}
                    <div
                      className="absolute overflow-hidden"
                      style={{
                        top: `${matThickness}px`,
                        left: `${matThickness}px`,
                        right: `${matThickness}px`,
                        bottom: `${matThickness}px`,
                      }}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-glass" />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Sans cadre : image pleine bord avec shadow */
                <div className="absolute inset-0 overflow-hidden shadow-lg">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-glass" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slides 1-4: Mockups Canvas (tous rendus, seul l'actif visible) */}
        {MOCKUP_SCENES.map((s, i) => (
          <canvas
            key={s.id}
            ref={el => { canvasRefs.current[s.id] = el; }}
            className={`w-full cursor-pointer ${slideIdx === i + 1 ? '' : 'hidden'}`}
            onClick={() => setLightboxOpen(true)}
          />
        ))}
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
