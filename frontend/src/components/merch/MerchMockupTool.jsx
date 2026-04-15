/**
 * MerchMockupTool - Outil de mockup hoodie noir avec placement libre de logos.
 *
 * Interactions:
 *   - Upload un ou plusieurs logos
 *   - Chaque logo peut etre draggue (souris + touch)
 *   - Poignee bas-droite: resize proportionnel
 *   - Petit X haut-droite: supprime le logo
 *   - Mobile: toggle front/back. Desktop: les 2 vues cote a cote.
 *   - Telecharger PNG front et back separement (image hoodie + logos composes)
 *
 * Les logos sont places en coordonnees relatives (0..1 de la box hoodie).
 * Chaque face a sa propre liste de logos.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Upload, Download, RotateCcw, X, Shirt } from 'lucide-react';

const HOODIE_FRONT = '/images/mockups/hoodie/front.webp';
const HOODIE_BACK = '/images/mockups/hoodie/back.webp';

// Dimensions natives des images hoodies (486x608) - utilise pour l'export HD
const HOODIE_W = 486;
const HOODIE_H = 608;

// ---------------------------------------------------------------------------
// Hook pour charger une image en HTMLImageElement
// ---------------------------------------------------------------------------
function useImage(src) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!src) { setImg(null); return; }
    const i = new window.Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.onerror = () => setImg(null);
    i.src = src;
    return () => { i.onload = null; i.onerror = null; };
  }, [src]);
  return img;
}

// ---------------------------------------------------------------------------
// DraggableLogo - un logo superpose draggable + resizable + removable
// ---------------------------------------------------------------------------
function DraggableLogo({ logo, onChange, onDelete, containerRef, selected, onSelect }) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const startDrag = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    const logoX = logo.x * rect.width;
    const logoY = logo.y * rect.height;
    const offsetX = clientX - rect.left - logoX;
    const offsetY = clientY - rect.top - logoY;
    setDragging(true);
    onSelect();

    const move = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const r = containerRef.current.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (cx - r.left - offsetX) / r.width));
      const ny = Math.max(0, Math.min(1, (cy - r.top - offsetY) / r.height));
      onChange({ ...logo, x: nx, y: ny });
    };
    const end = () => {
      setDragging(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  };

  const startResize = (clientX, clientY, e) => {
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const logoPixelX = logo.x * rect.width;
    const logoPixelY = logo.y * rect.height;
    const startW = logo.width * rect.width;
    setResizing(true);
    onSelect();

    const move = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const r = containerRef.current.getBoundingClientRect();
      const newW = Math.max(20, (cx - r.left) - logoPixelX);
      const newWRel = Math.min(1 - logo.x, newW / r.width);
      onChange({ ...logo, width: newWRel });
    };
    const end = () => {
      setResizing(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  };

  const aspect = logo.aspect || 1;

  return (
    <div
      onMouseDown={(e) => { if (e.button === 0) startDrag(e.clientX, e.clientY); }}
      onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
      className={`absolute select-none ${dragging || resizing ? 'cursor-grabbing' : 'cursor-grab'} ${selected ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-white/40'}`}
      style={{
        left: `${logo.x * 100}%`,
        top: `${logo.y * 100}%`,
        width: `${logo.width * 100}%`,
        aspectRatio: `${aspect}`,
        touchAction: 'none',
        transform: 'translateZ(0)',
      }}
    >
      <img
        src={logo.src}
        alt=""
        draggable={false}
        className="w-full h-full object-contain pointer-events-none"
      />
      {selected && (
        <>
          {/* Delete X */}
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg z-10"
          >
            <X size={14} />
          </button>
          {/* Resize handle bottom-right */}
          <div
            onMouseDown={(e) => startResize(e.clientX, e.clientY, e)}
            onTouchStart={(e) => { e.stopPropagation(); const t = e.touches[0]; startResize(t.clientX, t.clientY, e); }}
            className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-accent border-2 border-white shadow-lg cursor-nwse-resize"
            title="Redimensionner"
          />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HoodieCanvas - une face (front ou back) avec son lot de logos
// ---------------------------------------------------------------------------
function HoodieCanvas({ side, bgSrc, logos, onLogosChange, selectedId, onSelect, onAddLogo }) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = '';
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(f);
      const img = new window.Image();
      img.onload = () => {
        const aspect = img.naturalWidth / img.naturalHeight;
        onAddLogo({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          src: url,
          aspect,
          // Par defaut: centre, largeur 30% du hoodie
          x: 0.35,
          y: 0.30,
          width: 0.30,
        });
      };
      img.src = url;
    }
  };

  const deselect = () => onSelect(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs uppercase tracking-wider text-grey-muted font-semibold">
          {side === 'front' ? 'Devant' : 'Dos'}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/20 hover:bg-accent/30 text-accent text-[11px] font-semibold transition-colors"
            title="Ajouter un logo"
          >
            <Upload size={12} />
            Ajouter logo
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            multiple
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseDown={(e) => { if (e.target === containerRef.current || e.target.tagName === 'IMG') deselect(); }}
        className="relative w-full rounded-lg overflow-hidden bg-black/30 border border-white/5"
        style={{ aspectRatio: `${HOODIE_W}/${HOODIE_H}`, touchAction: 'none' }}
      >
        <img
          src={bgSrc}
          alt={side}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
        {logos.map((logo) => (
          <DraggableLogo
            key={logo.id}
            logo={logo}
            containerRef={containerRef}
            selected={selectedId === logo.id}
            onSelect={() => onSelect(logo.id)}
            onChange={(updated) => onLogosChange(logos.map(l => l.id === updated.id ? updated : l))}
            onDelete={() => {
              onLogosChange(logos.filter(l => l.id !== logo.id));
              onSelect(null);
            }}
          />
        ))}

        {logos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white/40 text-xs px-4">
              <Upload size={20} className="mx-auto mb-1.5" />
              Clique sur "Ajouter logo" pour commencer
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composeur offscreen pour l'export PNG
// Dessine l'image hoodie puis chaque logo a sa position relative
// ---------------------------------------------------------------------------
async function composeAndDownload(bgImg, logos, filename) {
  if (!bgImg) return;
  const canvas = document.createElement('canvas');
  // Export en 2x pour qualite
  const scale = 2;
  canvas.width = HOODIE_W * scale;
  canvas.height = HOODIE_H * scale;
  const ctx = canvas.getContext('2d');

  // Draw hoodie fond
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Charger chaque logo et le dessiner
  const loadImg = (src) => new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  for (const logo of logos) {
    try {
      const li = await loadImg(logo.src);
      const aspect = logo.aspect || (li.naturalWidth / li.naturalHeight);
      const w = logo.width * canvas.width;
      const h = w / aspect;
      const x = logo.x * canvas.width;
      const y = logo.y * canvas.height;
      ctx.drawImage(li, x, y, w, h);
    } catch (_) { /* ignore */ }
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

// ---------------------------------------------------------------------------
// MerchMockupTool - composant exporte
// ---------------------------------------------------------------------------
function MerchMockupTool() {
  const frontImg = useImage(HOODIE_FRONT);
  const backImg = useImage(HOODIE_BACK);

  const [frontLogos, setFrontLogos] = useState([]);
  const [backLogos, setBackLogos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mobileSide, setMobileSide] = useState('front'); // mobile only

  // Cleanup: revoquer les URLs blob a unmount
  useEffect(() => {
    return () => {
      [...frontLogos, ...backLogos].forEach(l => {
        if (l.src.startsWith('blob:')) URL.revokeObjectURL(l.src);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    [...frontLogos, ...backLogos].forEach(l => {
      if (l.src.startsWith('blob:')) URL.revokeObjectURL(l.src);
    });
    setFrontLogos([]);
    setBackLogos([]);
    setSelectedId(null);
  };

  const totalLogos = frontLogos.length + backLogos.length;

  return (
    <div className="space-y-4">
      {/* Barre d'actions globale */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-black/20 p-3">
        <div className="flex items-center gap-2 text-grey-muted text-sm">
          <Shirt size={16} />
          <span className="font-semibold text-heading">Hoodie noir</span>
          <span className="text-xs">· {totalLogos} logo{totalLogos !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => composeAndDownload(frontImg, frontLogos, 'hoodie-front-mockup.png')}
          disabled={!frontImg || frontLogos.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-40 hover:bg-accent/90 transition-colors"
        >
          <Download size={14} />
          Export Devant
        </button>
        <button
          type="button"
          onClick={() => composeAndDownload(backImg, backLogos, 'hoodie-back-mockup.png')}
          disabled={!backImg || backLogos.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-40 hover:bg-accent/90 transition-colors"
        >
          <Download size={14} />
          Export Dos
        </button>
        {totalLogos > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* Toggle mobile front/back */}
      <div className="flex md:hidden gap-2 rounded-lg bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setMobileSide('front')}
          className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${mobileSide === 'front' ? 'bg-accent text-white' : 'text-grey-muted'}`}
        >
          Devant
        </button>
        <button
          type="button"
          onClick={() => setMobileSide('back')}
          className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${mobileSide === 'back' ? 'bg-accent text-white' : 'text-grey-muted'}`}
        >
          Dos
        </button>
      </div>

      {/* Desktop: 2 colonnes / Mobile: 1 colonne avec toggle */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={mobileSide === 'front' ? 'block' : 'hidden md:block'}>
          <HoodieCanvas
            side="front"
            bgSrc={HOODIE_FRONT}
            logos={frontLogos}
            onLogosChange={setFrontLogos}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddLogo={(logo) => setFrontLogos((prev) => [...prev, logo])}
          />
        </div>
        <div className={mobileSide === 'back' ? 'block' : 'hidden md:block'}>
          <HoodieCanvas
            side="back"
            bgSrc={HOODIE_BACK}
            logos={backLogos}
            onLogosChange={setBackLogos}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddLogo={(logo) => setBackLogos((prev) => [...prev, logo])}
          />
        </div>
      </div>

      {/* Aide */}
      <div className="text-[11px] text-grey-muted/80 italic px-1">
        Drag pour deplacer · poignee accent = resize (ratio garde) · X rouge = supprimer · clique ailleurs pour deselectionner
      </div>
    </div>
  );
}

export default MerchMockupTool;
