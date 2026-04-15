/**
 * StickerPreviewCanvas - Affiche un preview live du sticker avec FX applique.
 *
 * Charge l'image source (upload user ou sticker Massive par defaut), la dessine
 * dans un canvas en respectant la forme choisie, applique stroke + shader, et
 * genere un blob PNG pour le thumb du panier (via onThumbChange callback).
 *
 * Tilt 3D au hover pour montrer la profondeur des FX.
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
    setTilt({ x: -dy * 10, y: dx * 10 });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const tilting = tilt.x !== 0 || tilt.y !== 0;

  return (
    <div
      className={className}
      style={{ perspective: '900px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-auto block rounded-xl"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilting ? 1.02 : 1})`,
          transition: tilting ? 'transform 0.08s ease-out' : 'transform 0.55s cubic-bezier(0.25,0.8,0.25,1)',
          transformStyle: 'preserve-3d',
          boxShadow: tilting
            ? `${-tilt.y * 1.5}px ${tilt.x * 1.5}px 28px rgba(0,0,0,0.35)`
            : '0 4px 16px rgba(0,0,0,0.18)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}

export default StickerPreviewCanvas;
