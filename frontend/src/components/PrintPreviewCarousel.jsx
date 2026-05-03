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
import { getImageOrientation, orientationToAspectRatio } from '../utils/imageOrientation';

// Mockup scenes : chaque scene a une orientation fixe (ratio du cadre photo
// physique mesure au pixel sur les .webp 875x875). On ne presente que les
// scenes dont l'orientation matche l'orientation de l'IMAGE source uploadee
// par le client - garantit zero letterboxing / zero crop excessif.
//   - portrait : bedroom, living_room, zen (cadres ~3:4 sur les 3 photos)
//   - landscape : office (cadre ~4:3)
//   - square   : aucun asset disponible pour l'instant. Quand client uploade
//     une image carree, on retombe sur la FramePreview CSS (slide 0) qui
//     supporte le 1:1 nativement. Pour ajouter une scene carree dans le
//     futur : asset .webp avec cadre vert pur 1:1 + entree { id, orientation: 'square' }.
const MOCKUP_SCENES = [
  { id: 'bedroom', fr: 'Chambre', en: 'Bedroom', orientation: 'portrait' },
  { id: 'living_room', fr: 'Salon', en: 'Living Room', orientation: 'portrait' },
  { id: 'office', fr: 'Bureau', en: 'Office', orientation: 'landscape' },
  { id: 'zen', fr: 'Zen', en: 'Zen', orientation: 'portrait' },
];

const MAT_COLOR = { r: 240, g: 237, b: 232 };

function PrintPreviewCarousel({ image, withFrame, frameColor, format, formats, tx, isLandscape, isSquare = false, onClickImage }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // On suit le chargement de l'image en STATE (pas seulement en ref) pour
  // declencher un re-render des useEffect de dessin canvas une fois l'image
  // prete. Sans ca, le pre-draw initial partait parfois avec
  // userImgRef.current === null -> canvas vide jusqu'a la premiere
  // interaction utilisateur.
  const [userImgLoaded, setUserImgLoaded] = useState(false);
  const canvasRefs = useRef({});
  const lightboxCanvasRef = useRef(null);
  const userImgRef = useRef(null);
  const roomImgCache = useRef({});
  const autoPlayRef = useRef(null);

  // RATIO-DRIVEN (3 mai 2026) : reecriture complete. Auparavant on
  // categorisait sur le FORMAT du print choisi (A4 portrait, 16x20, etc.) -
  // mais une image carree dans un format A4 portrait etait letterbox-cropped
  // et ne correspondait pas a ce que le client voyait dans son fichier.
  //
  // Nouvelle regle : on categorise sur le RATIO de l'IMAGE source (square
  // si |ratio - 1| <= 5%, portrait si <1, landscape si >1). Le format du
  // print n'intervient plus dans la selection des scenes ni dans l'aspect
  // ratio du slide 0. La FramePreview prend l'aspect ratio de l'image, et
  // les scenes mockup sont filtrees sur le meme critere.
  //
  // useState pour orientation pilote par un useEffect qui detecte le ratio
  // au load de l'image (asynchrone car on lit naturalWidth/naturalHeight).
  const [imageOrientation, setImageOrientation] = useState('unknown');
  useEffect(() => {
    if (!image) { setImageOrientation('unknown'); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageOrientation(getImageOrientation(img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => setImageOrientation('unknown');
    img.src = image;
  }, [image]);

  // Filter strict : on n'affiche QUE les scenes dont l'orientation matche
  // exactement l'orientation de l'image. Si aucune match (ex: image carree
  // alors qu'on n'a pas encore de scene 1:1), seul slide 0 (FramePreview CSS)
  // s'affiche - elle supporte tous les ratios via aspect-ratio CSS.
  const visibleScenes = MOCKUP_SCENES.filter(s => s.orientation === imageOrientation);
  const totalSlides = image ? 1 + visibleScenes.length : 0;

  // Si le slide courant disparait apres un changement d'orientation (upload
  // d'une nouvelle image), force le retour au slide 0.
  useEffect(() => {
    if (slideIdx > visibleScenes.length) setSlideIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageOrientation]);

  // Charger l'image du client. Le state userImgLoaded re-trigger les
  // useEffect de dessin canvas une fois l'image prete (sans ca, le
  // pre-draw initial pouvait partir avec userImgRef vide).
  useEffect(() => {
    setUserImgLoaded(false);
    userImgRef.current = null;
    if (!image) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      userImgRef.current = img;
      setUserImgLoaded(true);
    };
    img.src = image;
  }, [image]);

  // Pas d'auto-play - navigation manuelle seulement

  // Dessiner un mockup Canvas (chroma-key).
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

      // Chroma-key: identifier les pixels verts (cadre photo + parasites
      // dans le decor : plantes, canape vert, etc.).
      // FIX-CHROMA (1 mai 2026) : algo connected-components pour ne garder
      // que la plus grande zone verte CONNEXE = le cadre photo. L'ancien
      // algo prenait le bounding box de TOUS les verts -> bbox enorme
      // incluant la verdure du decor -> image utilisateur dessinee dans
      // une zone deformee a la mauvaise position. Constate sur
      // living_room_white (bbox vert x=8-521 y=230-778) et bedroom_white
      // (x=0-523 y=174-766) - la moitie de l'image au lieu du cadre seul.
      const imageData = ctx.getImageData(0, 0, cw, ch);
      const pixels = imageData.data;
      const totalPx = cw * ch;
      const isGreen = new Uint8Array(totalPx);
      for (let i = 0; i < totalPx; i++) {
        const off = i * 4;
        const r = pixels[off], g = pixels[off + 1], b = pixels[off + 2];
        if (g > 100 && g > r * 1.3 && g > b * 1.3) isGreen[i] = 1;
      }

      // Flood-fill : assigner un id de composante a chaque pixel vert,
      // tracker la taille + bbox de chaque composante, garder la plus
      // grande comme cadre photo.
      const compId = new Uint16Array(totalPx);
      let nextId = 1;
      let bestId = 0, bestSize = 0;
      let minX = cw, minY = ch, maxX = 0, maxY = 0;
      const stack = [];
      for (let i = 0; i < totalPx; i++) {
        if (!isGreen[i] || compId[i]) continue;
        // BFS iteratif (stack array, pas de recursion -> pas d'overflow)
        stack.length = 0;
        stack.push(i);
        compId[i] = nextId;
        let size = 0;
        let cMinX = cw, cMaxX = 0, cMinY = ch, cMaxY = 0;
        while (stack.length) {
          const idx = stack.pop();
          const x = idx % cw;
          const y = (idx / cw) | 0;
          size++;
          if (x < cMinX) cMinX = x;
          if (x > cMaxX) cMaxX = x;
          if (y < cMinY) cMinY = y;
          if (y > cMaxY) cMaxY = y;
          // 4 voisins
          if (x > 0 && isGreen[idx - 1] && !compId[idx - 1]) { compId[idx - 1] = nextId; stack.push(idx - 1); }
          if (x < cw - 1 && isGreen[idx + 1] && !compId[idx + 1]) { compId[idx + 1] = nextId; stack.push(idx + 1); }
          if (y > 0 && isGreen[idx - cw] && !compId[idx - cw]) { compId[idx - cw] = nextId; stack.push(idx - cw); }
          if (y < ch - 1 && isGreen[idx + cw] && !compId[idx + cw]) { compId[idx + cw] = nextId; stack.push(idx + cw); }
        }
        if (size > bestSize) {
          bestSize = size;
          bestId = nextId;
          minX = cMinX; maxX = cMaxX; minY = cMinY; maxY = cMaxY;
        }
        nextId++;
        if (nextId >= 65535) break; // safe-guard Uint16
      }

      if (!bestId || maxX <= minX || maxY <= minY) return;

      // Remplacer UNIQUEMENT les pixels du cadre photo (composante elue)
      // par la couleur du mat. Les autres pixels verts (decor parasite)
      // restent intacts pour ne pas trahir le mockup.
      for (let i = 0; i < totalPx; i++) {
        if (compId[i] === bestId) {
          const off = i * 4;
          pixels[off] = MAT_COLOR.r;
          pixels[off + 1] = MAT_COLOR.g;
          pixels[off + 2] = MAT_COLOR.b;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // FIX-NO-WHITE-BORDER (3 mai 2026) : margin retire (etait 4-8px). Avant,
      // on retrecissait la zone d'image de 2% pour eviter d'exposer un liseret
      // vert d'antialiasing - mais ca laissait visible le mat (couleur claire
      // de remplacement chroma-key) tout autour de l'image, donnant ces bords
      // blancs disgracieux. Maintenant l'image utilisateur remplit pile la
      // bbox du cadre detecte. Pour rattraper l'antialiasing du chroma-key
      // sans deborder dans le decor, on overdraw de 2px et on clip strictement
      // a la bbox vraie via ctx.clip(), donc 0 debordement et 0 bord visible.
      const overdraw = 2;
      const printX = minX - overdraw;
      const printY = minY - overdraw;
      const printW = maxX - minX + 1 + overdraw * 2;
      const printH = maxY - minY + 1 + overdraw * 2;
      // La bbox de clipping reste la bbox vraie (sans overdraw) pour ne pas
      // laisser l'image deborder hors du cadre vers le decor.
      const clipX = minX, clipY = minY;
      const clipW = maxX - minX + 1, clipH = maxY - minY + 1;
      if (clipW <= 0 || clipH <= 0) return;

      // REVERT (23 avril 2026) : l'ancien "mini cadre carre centre avec mat
      // top/bottom visible" a ete rejete par le proprietaire - le cadre au mur
      // restait portrait, les clients croyaient recevoir un cadre rectangulaire
      // avec l'image au milieu. Mieux vaut cacher les slides environnementaux
      // pour les formats carres (voir MOCKUP_SCENES filter plus bas) que
      // tromper visuellement.
      //
      // Pour les formats RECT qui seuls atteignent drawMockup : comportement
      // historique (clip rectangulaire plein, object-fit:cover sur l'image).
      // Ratio calcule sur la bbox vraie (clip), pas sur la bbox overdraw,
      // pour que le cover crop reflete l'apparence finale dans le cadre.
      const printRatio = clipW / clipH;
      const userImg = userImgRef.current;
      const imgRatio = userImg.naturalWidth / userImg.naturalHeight;
      let sx = 0, sy = 0, sw = userImg.naturalWidth, sh = userImg.naturalHeight;
      if (imgRatio > printRatio) { sw = Math.round(sh * printRatio); sx = Math.round((userImg.naturalWidth - sw) / 2); }
      else { sh = Math.round(sw / printRatio); sy = Math.round((userImg.naturalHeight - sh) / 2); }

      // Clip strict sur la bbox vraie du cadre + overdraw de l'image pour
      // recouvrir l'antialiasing du chroma-key. Resultat : aucun pixel mat
      // (blanc cassé) visible autour de l'image, aucun debordement dans le
      // decor.
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.beginPath();
      ctx.rect(clipX, clipY, clipW, clipH);
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
    if (!image || !userImgLoaded || slideIdx === 0) return;
    if (hideRoomMockups) return; // format carre : pas de rendu de scene
    const sceneId = visibleScenes[slideIdx - 1]?.id;
    if (!sceneId) return;
    const timer = setTimeout(() => {
      const canvas = canvasRefs.current[sceneId];
      if (canvas) drawMockup(canvas, 600, sceneId);
    }, 100);
    return () => clearTimeout(timer);
  }, [image, userImgLoaded, frameColor, withFrame, slideIdx, drawMockup]);

  // Pre-dessiner tous les mockups au chargement initial
  useEffect(() => {
    if (!image || !userImgLoaded) return;
    const timer = setTimeout(() => {
      visibleScenes.forEach(s => {
        const canvas = canvasRefs.current[s.id];
        if (canvas) drawMockup(canvas, 600, s.id);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [image, userImgLoaded, drawMockup]);

  // Lightbox mockup
  useEffect(() => {
    if (lightboxOpen && slideIdx > 0 && lightboxCanvasRef.current && userImgLoaded) {
      drawMockup(lightboxCanvasRef.current, 1400, visibleScenes[slideIdx - 1].id);
    }
  }, [lightboxOpen, slideIdx, userImgLoaded, drawMockup]);

  if (!image) return null;

  // FramePreview inline (slide 0)
  // RATIO-DRIVEN (3 mai 2026) : l'aspect-ratio du cadre suit l'IMAGE source,
  // plus le format. Resultat : zero letterboxing - l'image carree apparait
  // dans un cadre carre, portrait dans portrait, paysage dans paysage.
  // Le format reste utilise pour le sizing (previewMaxW) afin que A2 affiche
  // un cadre plus grand qu'A6.
  const fmt = formats?.find(f => f.id === format);
  const fmtW = fmt?.w || 8.5;
  const fmtH = fmt?.h || 11;
  const maxDim = Math.max(fmtW, fmtH);
  const scaleFactor = 320 / 24;
  const previewMaxW = Math.max(180, Math.round(maxDim * scaleFactor));
  // Le ratio CSS du cadre est entierement pilote par l'orientation de l'image.
  const frameAspectRatio = orientationToAspectRatio(imageOrientation);
  const isPostcard = format === 'postcard';
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
        <div className={`relative overflow-hidden w-full ${slideIdx === 0 ? '' : 'hidden'}`}>
          <div className="flex items-center justify-center cursor-pointer" onClick={onClickImage}>
            <div
              className={`relative transition-all duration-500 ease-out ${imageOrientation === 'square' ? 'aspect-square' : ''}`}
              style={{
                // RATIO-DRIVEN : aspectRatio pilote par l'image source via
                // orientationToAspectRatio(). Plus de calcul base sur le
                // format - une image carree donne un cadre 1:1 quoiqu'il
                // arrive. Aspect-square Tailwind double-up en inline pour
                // etre sur contre les purges CSS Tailwind.
                aspectRatio: frameAspectRatio,
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

        {/* Slides 1-4: Mockups Canvas (tous rendus, seul l'actif visible).
            CANVAS-FIT (1 mai 2026) : separation stricte entre la
            resolution interne du canvas (canvas.width/height assignees
            en JS dans drawMockup pour la qualite de rendu) et la taille
            d'affichage CSS (w-full h-auto block). Resultat : le canvas
            occupe 100% de la largeur du conteneur parent et conserve son
            ratio natif comme une image statique. Le wrapper est un
            simple w-full sans aspect-ratio impose - la hauteur s'aligne
            sur la hauteur naturelle du canvas, identique a l'image
            mockup pre-upload. */}
        {visibleScenes.map((s, i) => (
          <div
            key={s.id}
            className={`relative w-full ${slideIdx === i + 1 ? '' : 'hidden'}`}
          >
            <canvas
              ref={el => { canvasRefs.current[s.id] = el; }}
              className="w-full h-auto block cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
          </div>
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
