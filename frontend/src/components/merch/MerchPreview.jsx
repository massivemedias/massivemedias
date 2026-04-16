/**
 * MerchPreview - Preview mockup simplifie pour le configurateur public.
 *
 * Affiche l'image produit (dans la couleur selectionnee) avec le logo
 * du client en overlay draggable. Zone drag-drop integree pour l'upload.
 * Pas de rotation (version publique simplifiee).
 */
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Move } from 'lucide-react';

function MerchPreview({ productImageUrl, logoUrl, logoPosition, onLogoPositionChange, onFileSelect, onLogoRemove, label }) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Logo aspect ratio (loaded on mount)
  const [logoAspect, setLogoAspect] = useState(1);

  const handleImageLoad = useCallback((e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setLogoAspect(naturalWidth / naturalHeight);
    }
  }, []);

  // --- Drag logo ---
  const startDrag = (clientX, clientY) => {
    if (!containerRef.current || !logoPosition) return;
    const rect = containerRef.current.getBoundingClientRect();
    const logoX = logoPosition.x * rect.width;
    const logoY = logoPosition.y * rect.height;
    const offsetX = clientX - rect.left - logoX;
    const offsetY = clientY - rect.top - logoY;
    setDragging(true);

    const move = (e) => {
      e.preventDefault();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const r = containerRef.current.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (cx - r.left - offsetX) / r.width));
      const ny = Math.max(0, Math.min(1, (cy - r.top - offsetY) / r.height));
      onLogoPositionChange({ ...logoPosition, x: nx, y: ny });
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

  // --- Resize logo ---
  const startResize = (clientX, clientY, e) => {
    e.stopPropagation();
    if (!containerRef.current || !logoPosition) return;
    const rect = containerRef.current.getBoundingClientRect();
    const logoPixelX = logoPosition.x * rect.width;
    setResizing(true);

    const move = (ev) => {
      ev.preventDefault();
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const r = containerRef.current.getBoundingClientRect();
      const newW = Math.max(20, (cx - r.left) - logoPixelX);
      const newWRel = Math.min(0.8, Math.max(0.08, newW / r.width));
      onLogoPositionChange({ ...logoPosition, width: newWRel });
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

  // --- File drop ---
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div
        ref={containerRef}
        className={`
          relative overflow-hidden rounded-xl border-2 transition-colors select-none
          ${dragOver ? 'border-accent bg-accent/5' : 'border-white/10 bg-white/[0.06]'}
          ${!logoUrl ? 'cursor-pointer' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => { if (!logoUrl) inputRef.current?.click(); }}
      >
        {/* Product image - padded to leave room for CTA below */}
        <img
          src={productImageUrl}
          alt=""
          className="w-[80%] mx-auto h-auto object-contain pointer-events-none pt-3 pb-10"
          draggable={false}
        />

        {/* Logo overlay */}
        {logoUrl && logoPosition && (
          <div
            className={`absolute select-none group ${dragging || resizing ? '' : 'hover:ring-1 hover:ring-accent/50'}`}
            style={{
              left: `${logoPosition.x * 100}%`,
              top: `${logoPosition.y * 100}%`,
              width: `${logoPosition.width * 100}%`,
              aspectRatio: `${logoAspect}`,
              touchAction: 'none',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={(e) => { if (e.button === 0) { e.stopPropagation(); startDrag(e.clientX, e.clientY); } }}
            onTouchStart={(e) => { e.stopPropagation(); const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
          >
            <img
              src={logoUrl}
              alt="Design"
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
              onLoad={handleImageLoad}
            />

            {/* Resize handle bas-droite - visible seulement au hover du logo */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-accent rounded-tl-md cursor-nwse-resize opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
              onMouseDown={(e) => { if (e.button === 0) startResize(e.clientX, e.clientY, e); }}
              onTouchStart={(e) => { const t = e.touches[0]; startResize(t.clientX, t.clientY, e); }}
            />

            {/* Bouton supprimer */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onLogoRemove?.(); }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Drop zone placeholder (quand pas de logo) */}
        {!logoUrl && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-3 gap-1 pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Upload size={14} className="text-accent" />
            </div>
            <span className="text-sm font-semibold text-accent/80">
              Deposez votre design
            </span>
          </div>
        )}

        {/* Drag over feedback */}
        {dragOver && (
          <div className="absolute inset-0 bg-accent/10 border-2 border-accent border-dashed rounded-xl flex items-center justify-center pointer-events-none">
            <span className="text-accent font-semibold text-sm">Deposez ici</span>
          </div>
        )}

        {/* Hint drag quand logo present */}
        {logoUrl && !dragging && !resizing && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white/60 text-[9px] pointer-events-none">
            <Move size={8} />
            <span>Deplacer</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Bouton changer design (quand logo present) */}
      {logoUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-accent hover:text-accent/80 transition-colors mt-1"
        >
          Changer le design
        </button>
      )}
    </div>
  );
}

export default MerchPreview;
