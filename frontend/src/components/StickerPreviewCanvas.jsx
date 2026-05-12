/**
 * StickerPreviewCanvas - Affiche un preview live du sticker avec FX applique.
 *
 * Charge l'image source (upload user ou sticker Massive par defaut), la dessine
 * dans un canvas en respectant la forme choisie, applique stroke + shader, et
 * genere un blob PNG pour le thumb du panier (via onThumbChange callback).
 *
 * Tilt 3D au hover pour montrer la profondeur des FX.
 * FX overlay CSS dynamique: les effets bougent avec le curseur (holo, glossy, etc.)
 * Shape-aware: le border-radius CSS masque les coins pour les formes rondes/carrees.
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { drawSticker, loadImage, canvasToBlobUrl, canvasToFullBlobUrl } from '../utils/stickerFx';

// Dimensions du canvas PREVIEW (visible a l'ecran). Limite pour garder le tilt
// 3D fluide (60fps) meme avec une grande image source. Le rendu HD pour le
// telechargement est fait separement dans un canvas off-screen aux dimensions
// natives de l'image (cf. redraw() plus bas).
function getCanvasSize(shape) {
  switch (shape) {
    case 'rectangle':
      return { w: 900, h: 600 }; // ratio 3:2
    case 'round':
    case 'square':
    case 'diecut':
    default:
      return { w: 800, h: 800 };
  }
}

// Dimensions du canvas HD pour l'EXPORT/TELECHARGEMENT. Utilise les dimensions
// natives de l'image source (img.naturalWidth/naturalHeight) pour preserver
// la resolution. Pour les shapes carrees (round/square/diecut), on prend
// max(w,h) au carre. Pour rectangle, on impose 3:2 a partir de la grande
// dimension. Cap a 4096 pour eviter les canvas geants qui plantent certains
// browsers (limite typique iOS Safari = 4096x4096).
function getHdSize(img, shape) {
  const HD_CAP = 4096;
  const nW = img.naturalWidth || 800;
  const nH = img.naturalHeight || 800;
  if (shape === 'rectangle') {
    const longSide = Math.min(Math.max(nW, nH), HD_CAP);
    return { w: longSide, h: Math.round(longSide * 2 / 3) };
  }
  // round/square/diecut : carre (max des 2 dimensions natives)
  const size = Math.min(Math.max(nW, nH), HD_CAP);
  return { w: size, h: size };
}

// Border-radius CSS pour que la forme visible corresponde au sticker
function getShapeRadius(shape) {
  switch (shape) {
    case 'round':    return '50%';
    case 'square':   return '8%';
    case 'rectangle': return '6%';
    default:         return '0'; // diecut: pas de clip CSS, alpha naturel
  }
}

// Normalise le nom du shader
function normalizeFx(f) {
  if (!f || f === 'clear' || f === 'matte' || f === 'none') return null;
  return f.replace('_', '-');
}

// Genere le style CSS de l'overlay FX dynamique (suit le curseur)
function getFxOverlayStyle(fx, tilt) {
  if (!fx) return null;
  const angle = Math.atan2(tilt.y, tilt.x) * 180 / Math.PI;
  // Position normalisee 0-100 depuis le tilt
  const px = 50 + tilt.y * 5; // horizontal shift
  const py = 50 - tilt.x * 5; // vertical shift

  switch (fx) {
    case 'holographic': {
      // DYNAMIC-AMP-V3 (12 mai 2026) : amplitude angulaire amplifiee
      // pour scintillement visible au hover desktop. Le `atan2(tilt.y,
      // tilt.x)` precedent ne variait QU'EN DIRECTION (pas en magnitude),
      // donc en pratique l'angle restait quasi statique tant que la
      // souris bougeait dans le meme quadrant. Remplace par un calcul
      // direct multiplicatif (tilt.x + tilt.y) * facteur -> l'angle
      // glisse continuellement avec la position du curseur, donnant un
      // scintillement franc et continu (~+90% d'amplitude).
      // Static colors INCHANGEES (alpha 0.18-0.20, opacity 0.25, NO
      // conic-gradient -> pas de pointe centrale).
      const dynamicAngle = 90 + tilt.x * 12 + tilt.y * 12;
      return {
        background: `linear-gradient(${dynamicAngle}deg,
          rgba(255,0,200,0.20) 0%,
          rgba(255,165,0,0.18) 16%,
          rgba(255,255,0,0.18) 32%,
          rgba(0,255,100,0.18) 48%,
          rgba(0,180,255,0.20) 64%,
          rgba(130,0,255,0.18) 80%,
          rgba(255,0,200,0.20) 100%)`,
        mixBlendMode: 'color',
        opacity: 0.25,
      };
    }
    case 'glossy':
      return {
        background: `radial-gradient(ellipse 60% 40% at ${px}% ${py}%,
          rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 50%, transparent 70%)`,
        mixBlendMode: 'overlay',
        opacity: 0.7,
      };
    case 'broken-glass':
    case 'broken_glass': {
      // BROKEN-GLASS-V4 (12 mai 2026) : refonte realiste "verre brise reel"
      // sur user feedback ("triangles colores plats vs cracked ice reflets
      // dynamiques"). Avec la passe canvas V4 qui rend les eclats
      // MAJORITAIREMENT TRANSPARENTS (iridescence subtile uniquement),
      // l'overlay CSS doit fournir des reflets blancs/lumineux puissants
      // qui se promenent d'un eclat a l'autre selon la souris. Changements
      // vs V3 :
      //   - Constellation : couleurs pastel reduites -> blanc/argent
      //     dominant. Les iridescences viennent du canvas, pas de l'overlay.
      //   - Amplitude amp 26 -> 34 (+31%) : reflets se promenent plus
      //     large -> impression franche de "lumiere qui glisse".
      //   - Drift 2.4 -> 3.8 (+58%) : parallax beaucoup plus marque,
      //     les reflets surfent loin devant la souris.
      //   - Specular central plus serre (15% -> 12%) et plus intense
      //     (alpha 0.85 -> 0.98) -> ressemble a un vrai point de lumiere
      //     speculaire au lieu d'un halo flou.
      //   - prismBand allege (0.4 -> 0.28 alpha max) : le rainbow vient
      //     surtout du canvas maintenant, l'overlay donne juste le
      //     "wash" de couleur qui bascule.
      // mix-blend-mode color-dodge : la lumiere ne s'ajoute que sur les
      // facettes claires du canvas -> illusion d'eclats deja la qui
      // s'illuminent quand le faisceau les touche.
      const amp = 34;
      const facets = [
        { ox: 0,           oy: 0,           color: 'rgba(255,255,255,0.98)', spread: 7 },
        { ox: -amp,        oy: -amp * 0.6,  color: 'rgba(245,250,255,0.78)', spread: 6 },
        { ox: amp * 0.85,  oy: -amp * 0.45, color: 'rgba(255,250,250,0.70)', spread: 6 },
        { ox: -amp * 1.35, oy: amp * 0.55,  color: 'rgba(250,255,250,0.62)', spread: 5 },
        { ox: amp * 0.55,  oy: amp * 1.15,  color: 'rgba(255,253,245,0.65)', spread: 5 },
        { ox: amp * 1.55,  oy: -amp * 0.2,  color: 'rgba(250,248,255,0.58)', spread: 4 },
        { ox: -amp * 0.75, oy: amp * 1.25,  color: 'rgba(255,250,255,0.55)', spread: 4 },
        { ox: amp * 1.15,  oy: amp * 0.95,  color: 'rgba(255,255,250,0.50)', spread: 4 },
        { ox: -amp * 0.4,  oy: -amp * 1.15, color: 'rgba(248,250,255,0.55)', spread: 5 },
      ];
      const driftX = -tilt.y * 3.8;
      const driftY = tilt.x * 3.8;
      // Magnitude du tilt 0-1 : amplifie la parallax des facettes
      // (proches grossissent, lointaines retrecissent) quand le sticker
      // "bascule" sous le doigt/curseur.
      const tiltMag = Math.min(1, Math.sqrt(tilt.x * tilt.x + tilt.y * tilt.y) / 10);
      const constellation = facets.map((f) => {
        const cx = px + f.ox + driftX;
        const cy = py + f.oy + driftY;
        const dx = cx - px;
        const dy = cy - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Facette proche du curseur grossit (1.0 -> 1.7x), loin retrecit
        // (1.0 -> 0.65x) -> illusion d'une source ponctuelle proche du verre.
        const proximityBoost = dist < 20 ? 1 + tiltMag * 0.7 : dist > 40 ? 1 - tiltMag * 0.35 : 1;
        const finalSpread = Math.max(2, f.spread * proximityBoost);
        return `radial-gradient(circle ${finalSpread}% at ${cx}% ${cy}%, ${f.color} 0%, transparent 62%)`;
      }).join(', ');

      // Specular central tres serre et tres brillant - represente le point
      // de reflexion direct de la "lumiere virtuelle" sur le shard sous
      // le curseur. Color-dodge le transforme en "LED" sur les pixels clairs.
      const specular = `radial-gradient(circle 12% at ${px}% ${py}%, ` +
        `rgba(255,255,255,0.98) 0%, ` +
        `rgba(255,255,255,0.55) 18%, ` +
        `rgba(255,255,255,0.18) 38%, ` +
        `transparent 55%)`;

      // Halo doux autour du specular - "lumiere indirecte" qui eclaire
      // les facettes adjacentes.
      const sweep = `radial-gradient(circle 48% at ${px}% ${py}%, ` +
        `rgba(255,255,255,0.45) 0%, ` +
        `rgba(235,245,255,0.20) 25%, ` +
        `rgba(255,240,250,0.08) 50%, ` +
        `transparent 75%)`;

      // Bandeau prismatique allege - la couleur principale vient du
      // canvas maintenant, ce bandeau ajoute juste un "wash" qui bascule
      // avec le tilt pour suggerer que la lumiere change d'angle.
      const sweepAngle = 110 + tilt.y * 8;
      const stop1 = Math.max(5, Math.min(45, 20 + tilt.x * 2.5));
      const stop2 = Math.max(40, Math.min(80, 55 + tilt.y * 2.5));
      const prismBand = `linear-gradient(${sweepAngle}deg, ` +
        `transparent ${stop1 - 5}%, ` +
        `rgba(255,210,245,0.26) ${stop1}%, ` +
        `rgba(210,240,255,0.28) ${(stop1 + stop2) / 2}%, ` +
        `rgba(255,245,210,0.22) ${stop2}%, ` +
        `transparent ${stop2 + 5}%)`;

      return {
        // Ordre : specular > halo > prismBand > constellation
        background: `${specular}, ${sweep}, ${prismBand}, ${constellation}`,
        mixBlendMode: 'color-dodge',
        opacity: 0.95,
      };
    }
    case 'stars':
      return {
        background: `conic-gradient(from ${angle + 45}deg at ${px}% ${py}%,
          rgba(255,220,255,0.2), rgba(220,240,255,0.15), rgba(255,255,220,0.2),
          rgba(220,255,240,0.15), rgba(255,220,255,0.2))`,
        mixBlendMode: 'color',
        opacity: 0.35,
      };
    case 'dots':
      return {
        background: `radial-gradient(circle at ${px}% ${py}%,
          rgba(255,255,255,0.12) 0%, transparent 60%)`,
        mixBlendMode: 'overlay',
        opacity: 0.5,
      };
    default:
      return null;
  }
}

function StickerPreviewCanvas({
  imageUrl,           // url (string) ou null - si null on n'affiche rien
  shape = 'diecut',   // 'round' | 'square' | 'rectangle' | 'diecut'
  finish = 'clear',   // shader FX
  strokeColor = '#ffffff',
  strokeWidth = 0,
  className = '',
  onThumbChange,      // (url: string) => void - appele quand un nouveau preview PNG est dispo
  enableTilt = true,
  // FIX-RESOLUTION (8 mai 2026) : fullResolution=true => l'export utilise un
  // canvas HD aux dimensions natives de l'image source + canvasToFullBlobUrl
  // (pas de resize 256px). Sinon comportement legacy : data URL 256x256 thumb
  // (utilise par ConfiguratorStickers pour stocker la preview dans le panier).
  fullResolution = false,
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const lastThumbRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  // FIX-SHADER-MASK (3 mai 2026) : on capture le canvas en dataURL apres
  // chaque redraw pour s'en servir comme mask CSS sur l'overlay shader.
  // Resultat : l'effet holographic / glossy / etc. ne s'applique QUE sur
  // les pixels opaques de l'image (la silhouette du sticker), au lieu de
  // remplir le rectangle entier du wrapper.
  const [maskDataUrl, setMaskDataUrl] = useState('');
  // Aspect-ratio dynamique du canvas (pour que le wrapper s'adapte aux
  // dimensions reelles du rendu plutot que d'imposer 1:1 ou 800x800).
  const [canvasAspect, setCanvasAspect] = useState(1);

  // Charger l'image quand imageUrl change
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    if (!imageUrl) {
      imgRef.current = null;
      return;
    }
    loadImage(imageUrl)
      .then((img) => {
        if (cancelled) return;
        imgRef.current = img;
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        imgRef.current = null;
        setLoaded(false);
      });
    return () => { cancelled = true; };
  }, [imageUrl]);

  // Ref pour debounce le rendu HD (evite de regenerer un canvas 4096x4096 a
  // chaque changement de slider stroke pendant que l'utilisateur drag).
  const hdDebounceRef = useRef(null);

  // Redessiner quand un parametre change
  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // 1. PREVIEW : canvas affiche a l'ecran (800x800 max). Limite volontaire
    //    pour garder le tilt 3D fluide a 60fps meme avec une image 4K source.
    const { w, h } = getCanvasSize(shape);
    canvas.width = w;
    canvas.height = h;
    drawSticker(canvas, img, { shape, shader: finish, strokeColor, strokeWidth });

    // FIX-SHADER-MASK : capture le canvas preview en dataURL pour servir
    // de mask CSS a l'overlay shader (suit le curseur).
    try {
      setMaskDataUrl(canvas.toDataURL('image/png'));
      setCanvasAspect(canvas.width / canvas.height);
    } catch (_) {
      setMaskDataUrl('');
    }

    // 2. EXPORT pour onThumbChange. 2 modes selon `fullResolution` :
    //
    //    - fullResolution=true (ai.massive admin) : canvas HD off-screen aux
    //      dimensions natives de l'image, exporte via canvasToFullBlobUrl
    //      (blob URL, PAS de resize 256). Cap a 4096px pour compat Safari iOS.
    //      Debounce 350ms pour ne pas regenerer un canvas 4096x4096 a chaque
    //      pixel du slider stroke pendant que l'utilisateur drag.
    //
    //    - fullResolution=false (panier ConfiguratorStickers, defaut) : canvas
    //      preview 800x800 -> canvasToBlobUrl qui resize a 256x256 + data URL
    //      (compact pour serialisation localStorage du panier).
    //
    //    Avant ce fix : meme code dans les 2 cas -> le bouton "Telecharger PNG"
    //    de ai.massive recevait un thumb 256 a la place du HD attendu (1.7 MB
    //    source -> 43 KB telecharge - rapport observe par l'admin).
    if (onThumbChange) {
      if (fullResolution) {
        if (hdDebounceRef.current) clearTimeout(hdDebounceRef.current);
        hdDebounceRef.current = setTimeout(async () => {
          try {
            const hd = getHdSize(img, shape);
            const hdCanvas = document.createElement('canvas');
            hdCanvas.width = hd.w;
            hdCanvas.height = hd.h;
            drawSticker(hdCanvas, img, { shape, shader: finish, strokeColor, strokeWidth });
            if (lastThumbRef.current) URL.revokeObjectURL(lastThumbRef.current);
            const blobUrl = await canvasToFullBlobUrl(hdCanvas);
            lastThumbRef.current = blobUrl;
            onThumbChange(blobUrl);
          } catch (_) {
            // Fallback : si le canvas HD plante (memoire/taille), on exporte
            // le preview en full blob plutot qu'un thumb 256 (mieux que rien).
            try {
              const blobUrl = await canvasToFullBlobUrl(canvas);
              if (lastThumbRef.current) URL.revokeObjectURL(lastThumbRef.current);
              lastThumbRef.current = blobUrl;
              onThumbChange(blobUrl);
            } catch (_) { /* ignore */ }
          }
        }, 350);
      } else {
        // Mode panier legacy : thumb 256 data URL
        try {
          if (lastThumbRef.current && lastThumbRef.current.startsWith('blob:')) {
            URL.revokeObjectURL(lastThumbRef.current);
          }
          const dataUrl = await canvasToBlobUrl(canvas);
          lastThumbRef.current = dataUrl;
          onThumbChange(dataUrl);
        } catch (_) { /* ignore */ }
      }
    }
  }, [shape, finish, strokeColor, strokeWidth, onThumbChange, fullResolution]);

  // Cleanup du debounce HD a l'unmount
  useEffect(() => {
    return () => {
      if (hdDebounceRef.current) clearTimeout(hdDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    redraw();
  }, [loaded, redraw]);

  // Cleanup blob a l'unmount
  useEffect(() => {
    return () => {
      if (lastThumbRef.current) URL.revokeObjectURL(lastThumbRef.current);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!enableTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

    // Pour les stickers ronds: hit-test rapide via distance au centre
    // (cercle parfait, pas besoin de sampler le canvas).
    if (shape === 'round') {
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      if (distFromCenter > 1) {
        setTilt({ x: 0, y: 0 });
        return;
      }
    }

    // Pour diecut: le PNG a sa propre alpha (forme libre, rond/etoile/custom).
    // On sample le pixel du canvas a la position du curseur - si transparent,
    // le curseur est en dehors de la silhouette visible -> pas de tilt.
    // getImageData marche car loadImage pose crossOrigin='anonymous'.
    if (shape === 'diecut') {
      const canvas = canvasRef.current;
      if (canvas) {
        const px = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
        const py = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
        if (px >= 0 && py >= 0 && px < canvas.width && py < canvas.height) {
          try {
            const ctx = canvas.getContext('2d');
            const alpha = ctx.getImageData(px, py, 1, 1).data[3];
            if (alpha < 16) {
              setTilt({ x: 0, y: 0 });
              return;
            }
          } catch (_) {
            // Canvas tainted (image sans CORS) -> fallback silencieux sur le
            // comportement precedent (tilt sur toute la zone).
          }
        }
      }
    }

    setTilt({ x: -dy * 10, y: dx * 10 });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const tilting = tilt.x !== 0 || tilt.y !== 0;
  const shapeRadius = getShapeRadius(shape);
  const fx = normalizeFx(finish);
  const fxOverlay = tilting && fx ? getFxOverlayStyle(fx, tilt) : null;

  // 3D-V2 (11 mai 2026) : perspective plus profonde (1400px au lieu de 900)
  // pour amplifier l'effet de profondeur sans deformation excessive. Le tilt
  // est legerement amplifie et un boost de scale au survol donne une
  // sensation tactile (le sticker se rapproche du curseur). Les ombres
  // portees suivent dynamiquement l'inclinaison via shadowOffsetX/Y derives
  // du tilt - plus on incline, plus l'ombre s'eloigne du sticker -> illusion
  // d'un objet qui se souleve de la surface.
  const shadowOffsetX = -tilt.y * 2.2;
  const shadowOffsetY = tilt.x * 2.2 + 8;
  const shadowBlur = tilting ? 22 : 12;
  const shadowAlpha = tilting ? 0.48 : 0.30;

  return (
    <div
      className={className}
      style={{ perspective: '1400px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative w-full"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilting ? 1.04 : 1})`,
          transition: tilting
            ? 'transform 0.08s ease-out, filter 0.12s ease-out, box-shadow 0.12s ease-out'
            : 'transform 0.55s cubic-bezier(0.25,0.8,0.25,1), filter 0.55s cubic-bezier(0.25,0.8,0.25,1), box-shadow 0.55s cubic-bezier(0.25,0.8,0.25,1)',
          transformStyle: 'preserve-3d',
          // Aspect-ratio suit le canvas reel (1:1 ou 3:2 selon shape).
          // round/square/rectangle : overflow hidden + borderRadius pour CSS clip.
          // diecut : visible pour laisser passer le drop-shadow de la silhouette
          // (alpha-channel) et ne pas couper la zone du contour.
          aspectRatio: canvasAspect || 1,
          borderRadius: shape === 'diecut' ? undefined : shapeRadius,
          overflow: shape === 'diecut' ? 'visible' : 'hidden',
          boxShadow: shape === 'diecut'
            ? 'none'
            : `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha})`,
          // drop-shadow pour diecut suit la silhouette alpha du canvas.
          filter: shape === 'diecut'
            ? `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur * 0.7}px rgba(0,0,0,${shadowAlpha + 0.05}))`
            : undefined,
          willChange: 'transform, filter, box-shadow',
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ borderRadius: shape === 'diecut' ? undefined : shapeRadius }}
        />

        {/* FX overlay dynamique - suit le curseur.
            FIX-SHADER-MASK (3 mai 2026) : mask CSS base sur le canvas
            dataURL pour que l'effet ne s'applique QUE sur les pixels opaques
            de la silhouette du sticker. Avant, l'overlay remplissait le
            rectangle entier via absolute inset-0 -> effet visible meme dans
            les zones transparentes du diecut. Le mask alpha-channel garantit
            que les pixels transparents du canvas masquent l'overlay au
            meme endroit. */}
        {fxOverlay && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              ...fxOverlay,
              borderRadius: shape === 'diecut' ? undefined : shapeRadius,
              transition: 'background 0.1s ease-out, opacity 0.1s ease-out',
              // FIX-POINTER (3 mai 2026 v2) : pointerEvents: 'none' EN PLUS
              // de la classe Tailwind, defense en profondeur. Si Tailwind est
              // purge ou si un style inline override par accident, l'inline
              // prime et garantit que l'overlay laisse passer mouseMove vers
              // le parent perspective qui calcule le tilt 3D.
              pointerEvents: 'none',
              // Mask base sur le canvas : seuls les pixels opaques recoivent
              // l'effet. WebkitMask pour compat Safari.
              ...(maskDataUrl ? {
                WebkitMaskImage: `url(${maskDataUrl})`,
                maskImage: `url(${maskDataUrl})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              } : {}),
            }}
          />
        )}
      </div>
    </div>
  );
}

export default StickerPreviewCanvas;
