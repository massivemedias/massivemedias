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
import { drawSticker, loadImage, canvasToBlobUrl } from '../utils/stickerFx';

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
    case 'holographic':
      return {
        background: `conic-gradient(from ${angle + 90}deg at ${px}% ${py}%,
          rgba(255,0,200,0.35), rgba(255,165,0,0.3), rgba(255,255,0,0.3),
          rgba(0,255,100,0.3), rgba(0,180,255,0.35), rgba(130,0,255,0.3),
          rgba(255,0,200,0.35))`,
        mixBlendMode: 'color',
        opacity: 0.45,
      };
    case 'glossy':
      return {
        background: `radial-gradient(ellipse 60% 40% at ${px}% ${py}%,
          rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 50%, transparent 70%)`,
        mixBlendMode: 'overlay',
        opacity: 0.7,
      };
    case 'broken-glass':
    case 'broken_glass': {
      // FIX-BROKEN-GLASS-V2 (3 mai 2026) : double calque interactif :
      //   1. Constellation de 7 reflets ponctuels (refraction prismatique
      //      sur les facettes statiques dessinees par le canvas-side).
      //   2. Balayage lumineux primaire (linear-gradient) qui suit la
      //      position de la souris -> couche dominante qui "passe" sur
      //      le sticker au survol et fait scintiller les arretes du verre.
      // Mix-blend-mode 'color-dodge' : eclaire fortement les zones blanches
      // de la texture de verre brisee dessinee par le canvas (les arretes
      // brillent comme du cristal au passage de la lumiere).
      // Le mask alpha + pointer-events-none du fix precedent restent
      // intacts (geres au niveau du <div> overlay).
      const amp = 18;
      const facets = [
        { ox: 0, oy: 0, color: 'rgba(255,255,255,0.9)', spread: 8 },
        { ox: -amp, oy: -amp * 0.6, color: 'rgba(180,230,255,0.7)', spread: 6 },
        { ox: amp * 0.8, oy: -amp * 0.4, color: 'rgba(255,200,240,0.6)', spread: 6 },
        { ox: -amp * 1.2, oy: amp * 0.5, color: 'rgba(200,255,230,0.55)', spread: 5 },
        { ox: amp * 0.5, oy: amp, color: 'rgba(255,240,200,0.6)', spread: 5 },
        { ox: amp * 1.4, oy: -amp * 0.2, color: 'rgba(220,200,255,0.55)', spread: 4 },
        { ox: -amp * 0.7, oy: amp * 1.1, color: 'rgba(255,220,255,0.5)', spread: 4 },
      ];
      const driftX = -tilt.y * 1.5;
      const driftY = tilt.x * 1.5;
      const constellation = facets.map(f => {
        const cx = px + f.ox + driftX;
        const cy = py + f.oy + driftY;
        return `radial-gradient(circle ${f.spread}% at ${cx}% ${cy}%, ${f.color} 0%, transparent 60%)`;
      }).join(', ');

      // Balayage primaire : grand spot blanc tres brillant (radial 40% de
      // la zone) suit DIRECTEMENT le curseur. C'est lui qui donne le
      // ressenti "lumiere qui se balade dans le verre" au mouvement.
      const sweep = `radial-gradient(circle 40% at ${px}% ${py}%, ` +
        `rgba(255,255,255,0.55) 0%, ` +
        `rgba(220,240,255,0.25) 25%, ` +
        `rgba(255,220,250,0.1) 50%, ` +
        `transparent 70%)`;

      // Bandeau diagonale : linear-gradient qui balaie le sticker selon
      // l'angle du tilt. Position d'arret se decale avec px/py pour
      // simuler l'arc-en-ciel d'une lumiere reflechie sur du verre fracture.
      const sweepAngle = 110 + tilt.y * 4;
      const stop1 = Math.max(5, Math.min(45, 20 + tilt.x * 1.5));
      const stop2 = Math.max(40, Math.min(80, 55 + tilt.y * 1.5));
      const prismBand = `linear-gradient(${sweepAngle}deg, ` +
        `transparent ${stop1 - 5}%, ` +
        `rgba(255,200,240,0.35) ${stop1}%, ` +
        `rgba(200,240,255,0.4) ${(stop1 + stop2) / 2}%, ` +
        `rgba(255,240,200,0.3) ${stop2}%, ` +
        `transparent ${stop2 + 5}%)`;

      return {
        // L'ordre est important : sweep primaire d'abord (le plus brillant
        // au-dessus), prismBand ensuite, puis la constellation de facettes.
        background: `${sweep}, ${prismBand}, ${constellation}`,
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
  onThumbChange,      // (blobUrl: string) => void - appele quand un nouveau thumb PNG est dispo
  enableTilt = true,
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

    // 2. HD EXPORT : canvas off-screen aux dimensions natives de l'image
    //    pour preserver la resolution lors du telechargement. Genere un
    //    blob URL separe transmis via onThumbChange. Debounce 350ms pour
    //    ne pas ralentir le preview pendant que l'utilisateur drag le
    //    slider stroke - seul le DERNIER state est exporte.
    //
    //    FIX-RESOLUTION (8 mai 2026) : avant ce fix, le blob exporte etait
    //    le canvas preview (800x800), donc une image source 4000x4000 etait
    //    sevement compressee au telechargement. Maintenant on genere un
    //    canvas dedie aux dimensions natives (cap 4096 pour compat Safari iOS).
    if (onThumbChange) {
      if (hdDebounceRef.current) clearTimeout(hdDebounceRef.current);
      hdDebounceRef.current = setTimeout(async () => {
        try {
          const hd = getHdSize(img, shape);
          const hdCanvas = document.createElement('canvas');
          hdCanvas.width = hd.w;
          hdCanvas.height = hd.h;
          drawSticker(hdCanvas, img, { shape, shader: finish, strokeColor, strokeWidth });
          if (lastThumbRef.current) URL.revokeObjectURL(lastThumbRef.current);
          const blobUrl = await canvasToBlobUrl(hdCanvas);
          lastThumbRef.current = blobUrl;
          onThumbChange(blobUrl);
        } catch (_) {
          // Si le canvas HD plante (memoire, taille), fallback sur le canvas
          // preview pour ne pas casser le bouton telecharger.
          try {
            const blobUrl = await canvasToBlobUrl(canvas);
            if (lastThumbRef.current) URL.revokeObjectURL(lastThumbRef.current);
            lastThumbRef.current = blobUrl;
            onThumbChange(blobUrl);
          } catch (_) { /* ignore */ }
        }
      }, 350);
    }
  }, [shape, finish, strokeColor, strokeWidth, onThumbChange]);

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

  return (
    <div
      className={className}
      style={{ perspective: '900px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative w-full"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilting ? 1.02 : 1})`,
          transition: tilting ? 'transform 0.08s ease-out, filter 0.08s ease-out' : 'transform 0.55s cubic-bezier(0.25,0.8,0.25,1), filter 0.55s cubic-bezier(0.25,0.8,0.25,1)',
          transformStyle: 'preserve-3d',
          // FIX-SHAPE (3 mai 2026) : retire clipPath: circle(50%) du wrapper
          // diecut. Avant, ca forcait un disque parfait quelle que soit la
          // forme reelle de l'image -> stickers etoile/coeur/silhouette
          // custom etaient cropees en cercle. Maintenant le canvas a sa
          // propre alpha (transparence des pixels en dehors de l'image)
          // et le drop-shadow s'applique sur la silhouette via filter.
          // round/square/rectangle : on garde overflow:hidden + borderRadius
          // car ces formes ont un contour rectangulaire defini par CSS.
          // Aspect-ratio : suit la dimension reelle du canvas (canvasAspect)
          // au lieu d'imposer 1:1 ou 3:2 hardcode.
          // FIX-LAYOUT (3 mai 2026 v2) : ajout w-full pour que aspectRatio
          // ait une largeur de reference (sinon collapse a 0 sans children
          // sized) -> le wrapper interne occupe la zone complete du parent
          // perspective, garantit que onMouseMove du parent recoit les
          // events sur toute la silhouette du sticker.
          aspectRatio: canvasAspect || 1,
          borderRadius: shape === 'diecut' ? undefined : shapeRadius,
          overflow: shape === 'diecut' ? 'visible' : 'hidden',
          boxShadow: shape === 'diecut'
            ? 'none'
            : (tilting
              ? `${-tilt.y * 1.5}px ${tilt.x * 1.5}px 28px rgba(0,0,0,0.35)`
              : '0 4px 16px rgba(0,0,0,0.18)'),
          filter: shape === 'diecut'
            ? (tilting
              ? `drop-shadow(${-tilt.y * 1.5}px ${tilt.x * 1.5 + 6}px 14px rgba(0,0,0,0.45))`
              : 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))')
            : undefined,
          willChange: 'transform, filter',
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
