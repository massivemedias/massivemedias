/**
 * InstantMockup v6 - Composant controle (sceneId en prop)
 *
 * Rendu canvas chroma-key pour un scene donne.
 * La navigation (fleches, dots) est geree par le parent (ArtisteDetail).
 * Pour les prints paysage, utilise les mockups du dossier /landscape/.
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

  // FIX-MOCKUP (avril 2026) : compteur de generation par canvas pour eliminer
  // les race conditions de chargement async. Quand l'utilisateur change de
  // cadre rapidement, plusieurs img.onload peuvent etre en vol ; sans ce
  // counter, un onload tardif ecraserait le rendu plus recent. Chaque
  // drawComposite incremente son counter + le capture en closure. Si un
  // doRender arrive a s'executer alors que genRef.current a bouge, il
  // abandonne son dessin (return silencieux).
  const mainGenRef = useRef(0);
  const lightboxGenRef = useRef(0);

  // Charger l'image du print
  useEffect(() => {
    if (!imageUrl) { setReady(false); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { userImgRef.current = img; setReady(true); };
    img.onerror = () => setReady(false);
    img.src = imageUrl;
  }, [imageUrl]);

  const drawComposite = useCallback((canvas, targetWidth, sid, landscape, fc, genRef) => {
    if (!canvas || !userImgRef.current || !sid || !genRef) return;

    // Capture la generation de CE call. Si une nouvelle drawComposite est
    // appelee (nouveau cadre/scene), genRef.current devient > myGen et le
    // doRender en cours est abandonne.
    const myGen = ++genRef.current;

    // Paysage: sous-dossier /landscape/ avec cadres horizontaux
    const roomKey = landscape ? `landscape/${sid}_${fc}` : `${sid}_${fc}`;
    const roomSrc = `/images/mockups/${roomKey}.webp`;

    const doRender = (roomImg) => {
      // GUARD anti-race : si une drawComposite plus recente a demarre, stop.
      if (myGen !== genRef.current) return;

      const roomRatio = roomImg.naturalHeight / roomImg.naturalWidth;
      const cw = targetWidth;
      const ch = Math.round(cw * roomRatio);

      // Reset COMPLET du canvas : setter .width efface tout le contenu ET reset
      // toutes les transforms / states. On ajoute quand meme un clearRect
      // explicite apres pour etre defensif sur d'eventuels residus de pixels
      // si la meme dimension est reutilisee (edge case sur certains browsers).
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, cw, ch);

      // 1. Dessiner la photo de la piece
      ctx.drawImage(roomImg, 0, 0, cw, ch);

      // 2. Detecter la zone verte (#00FF00) = emplacement du cadre.
      //    FIX PERSPECTIVE (avril 2026) : le bounding box rectangulaire droit ne
      //    suffit pas si le cadre est en perspective (le polygone vert est alors
      //    un quadrilatere deforme, pas un rectangle). On construit en parallele
      //    un MASQUE BITMAP pixel-parfait des zones vertes pour clipper l'image
      //    utilisateur avec un globalCompositeOperation = 'destination-in'.
      //    Resultat : meme si destX/destY/destW/destH deborde un peu du vrai
      //    polygone, le mask garantit qu'AUCUN pixel ne sort du cadre reel.
      const imageData = ctx.getImageData(0, 0, cw, ch);
      const pixels = imageData.data;
      const maskData = ctx.createImageData(cw, ch);
      const maskPixels = maskData.data;
      let minX = cw, minY = ch, maxX = 0, maxY = 0;
      let greenCount = 0;

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
            // Remplacer le vert par la couleur du mat sur le canvas principal
            pixels[i] = MAT_COLOR.r;
            pixels[i + 1] = MAT_COLOR.g;
            pixels[i + 2] = MAT_COLOR.b;
            // Marquer dans le mask bitmap : pixel opaque = zone ou le print est autorise
            maskPixels[i + 3] = 255;
            greenCount++;
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);

      if (maxX <= minX || maxY <= minY || greenCount === 0) return;

      // 3. Zone d'impression : on utilise le bounding box pour POSITIONNER l'image
      //    (centrage, contain, etc.) mais le clip final sera fait via le mask bitmap
      //    pour respecter la forme exacte du quadrilatere en perspective.
      //    On retire la marge interieure classique car le mask epouse deja le bord
      //    vert exact et une marge en plus rognerait visiblement le print.
      const printX = minX;
      const printY = minY;
      const printW = maxX - minX + 1;
      const printH = maxY - minY + 1;
      if (printW <= 0 || printH <= 0) return;

      const printRatio = printW / printH;
      const userImg = userImgRef.current;
      const imgRatio = userImg.naturalWidth / userImg.naturalHeight;

      // "Contain": image entiere toujours visible, mat remplit le reste.
      let destX = printX, destY = printY, destW = printW, destH = printH;
      if (imgRatio > printRatio) {
        destH = Math.round(printW / imgRatio);
        destY = printY + Math.round((printH - destH) / 2);
      } else {
        destW = Math.round(printH * imgRatio);
        destX = printX + Math.round((printW - destW) / 2);
      }

      // 4. CLIPPING VIA MASK BITMAP (chroma-key strict).
      //    - On dessine d'abord l'image utilisateur dans un canvas offscreen
      //      aux coordonnees destX/destY/destW/destH (qui peuvent deborder).
      //    - Puis on applique le mask avec destination-in : seuls les pixels
      //      du print qui correspondent a un pixel vert d'origine restent.
      //    - Enfin on compose le resultat sur le canvas principal.
      //    Cette approche elimine 100% des debordements, meme sur cadres
      //    quadrilateres deformes (perspective), sans avoir besoin de warp
      //    matrix3d complexe.
      const offCanvas = document.createElement('canvas');
      offCanvas.width = cw;
      offCanvas.height = ch;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(
        userImg,
        0, 0, userImg.naturalWidth, userImg.naturalHeight,
        destX, destY, destW, destH,
      );

      // putImageData ignore globalCompositeOperation, donc on passe par un
      // canvas intermediaire pour que le mask s'applique comme une image.
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = cw;
      maskCanvas.height = ch;
      maskCanvas.getContext('2d').putImageData(maskData, 0, 0);

      offCtx.globalCompositeOperation = 'destination-in';
      offCtx.drawImage(maskCanvas, 0, 0);
      offCtx.globalCompositeOperation = 'source-over';

      // Dernier guard anti-race AVANT le compose final. Entre le debut de
      // doRender et ici, un autre drawComposite a pu etre appele (ex: l'user
      // a clique un autre cadre pendant le scan). Si c'est le cas, on ne
      // composite PAS sur le canvas (il est deja en cours de redessin par
      // le nouveau cycle).
      if (myGen !== genRef.current) return;

      // Compose le print clippe sur le canvas principal (par-dessus le mat beige)
      ctx.drawImage(offCanvas, 0, 0);
    };

    if (roomImgCache.current[roomKey]) {
      // Guard immediat aussi pour le cache hit : si une autre draw a demarre
      // entre l'increment de myGen et ce if, on abandonne.
      if (myGen === genRef.current) doRender(roomImgCache.current[roomKey]);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Toujours cacher l'image pour les prochaines requetes (non-bloquant
        // meme si cette generation est stale).
        roomImgCache.current[roomKey] = img;
        doRender(img);
      };
      img.onerror = () => {
        // Fallback portrait si le mockup paysage est absent
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

  // Redessiner quand scene, orientation, cadre ou image change
  useEffect(() => {
    if (!ready || !sceneId) return;
    if (canvasRef.current) drawComposite(canvasRef.current, 800, sceneId, isLandscape, frameColor, mainGenRef);
  }, [ready, sceneId, isLandscape, frameColor, drawComposite]);

  // Lightbox haute resolution
  useEffect(() => {
    if (lightboxOpen && lightboxCanvasRef.current && ready && sceneId) {
      drawComposite(lightboxCanvasRef.current, 1400, sceneId, isLandscape, frameColor, lightboxGenRef);
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
