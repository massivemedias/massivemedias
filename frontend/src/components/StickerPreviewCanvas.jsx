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

// Dimensions du canvas selon la forme (garde un ratio coherent)
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
    case 'broken_glass':
      return {
        background: `conic-gradient(from ${angle}deg at ${px}% ${py}%,
          rgba(200,230,255,0.15), rgba(255,200,255,0.1), rgba(200,255,230,0.15),
          rgba(200,230,255,0.15))`,
        mixBlendMode: 'overlay',
        opacity: 0.5,
      };
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

  // Redessiner quand un parametre change
  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const { w, h } = getCanvasSize(shape);
    canvas.width = w;
    canvas.height = h;

    drawSticker(canvas, img, { shape, shader: finish, strokeColor, strokeWidth });

    // FIX-SHADER-MASK : capture le canvas en dataURL apres chaque redraw
    // pour servir de mask CSS a l'overlay shader. Try/catch car le canvas
    // peut etre tainted si l'image source vient d'une origine sans CORS
    // (rare car loadImage pose crossOrigin='anonymous', mais defensif).
    try {
      setMaskDataUrl(canvas.toDataURL('image/png'));
      setCanvasAspect(canvas.width / canvas.height);
    } catch (_) {
      setMaskDataUrl('');
    }

    // Generer le thumb blob pour le panier
    if (onThumbChange) {
      try {
        // Revoquer l'ancien blob
        if (lastThumbRef.current) URL.revokeObjectURL(lastThumbRef.current);
        const blobUrl = await canvasToBlobUrl(canvas);
        lastThumbRef.current = blobUrl;
        onThumbChange(blobUrl);
      } catch (_) {
        // ignore
      }
    }
  }, [shape, finish, strokeColor, strokeWidth, onThumbChange]);

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
        className="relative"
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
