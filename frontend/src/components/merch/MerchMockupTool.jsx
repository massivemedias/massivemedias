/**
 * MerchMockupTool - Outil de mockup merch noir (hoodie/t-shirt/long sleeve)
 * avec placement libre de logos.
 *
 * Interactions:
 *   - Selecteur de produit en haut (switche l'image sans perdre les logos)
 *   - Upload un ou plusieurs logos
 *   - Chaque logo peut etre draggue (souris + touch)
 *   - Poignee bas-droite: resize proportionnel
 *   - Petit X haut-droite: supprime le logo
 *   - Mobile: toggle front/back. Desktop: les 2 vues cote a cote.
 *   - Telecharger PNG front et back separement (image + logos composes)
 *
 * Les logos sont places en coordonnees relatives (0..1 de la box produit),
 * donc ils suivent quand on switche entre produits de ratios differents.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Upload, Download, RotateCcw, X, Shirt, Sparkles, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { merchColors } from '../../data/merchData';

// Catalogue des produits dispo. Chaque face a ses propres dimensions natives
// pour un export HD fidele a l'image source.
const PRODUCTS = {
  hoodie: {
    label: 'Hoodie',
    front: { src: '/images/mockups/hoodie/front.webp', w: 486, h: 608 },
    back:  { src: '/images/mockups/hoodie/back.webp',  w: 486, h: 608 },
  },
  tshirt: {
    label: 'T-shirt',
    front: { src: '/images/mockups/tshirt/front.webp', w: 486, h: 608 },
    back:  { src: '/images/mockups/tshirt/back.webp',  w: 720, h: 900 },
  },
  longsleeve: {
    label: 'Long Sleeve',
    front: { src: '/images/mockups/longsleeve/front.webp', w: 486, h: 608 },
    back:  { src: '/images/mockups/longsleeve/back.webp',  w: 720, h: 900 },
  },
};

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

// Curseur rotation custom (SVG data URI). Le curseur natif n'existe pas.
const ROTATE_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><g fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 12a9 9 0 1 0 3-6.7'/><polyline points='3 4 3 10 9 10'/></g></svg>") 12 12, alias`;

// Halo de rotation: bande de pixels a l'EXTERIEUR du logo avec une "dead zone"
// immediate (pour tolerance drag au bord), puis la zone rotation au-dela.
//   [0 - 3px] dead zone (rien, pas de curseur, pas d'action)
//   [3 - 10px] zone rotation (cursor rotate + click = rotation)
const ROTATE_HALO_OUTER = 10;
const ROTATE_HALO_INNER = 3;

// Increment angulaire quand on tient Shift pendant la rotation (degres)
const ROTATE_SHIFT_STEP = 25;

// ---------------------------------------------------------------------------
// DraggableLogo - un logo superpose draggable + resizable + rotatable + removable
// ---------------------------------------------------------------------------
function DraggableLogo({ logo, onChange, onDelete, containerRef, selected, onSelect }) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const logoRef = useRef(null);

  const rotation = logo.rotation || 0;
  const aspect = logo.aspect || 1;

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

  const startRotate = (clientX, clientY) => {
    const el = logoRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
    const initialRotation = rotation;
    setRotating(true);
    onSelect();

    const move = (e) => {
      const mx = e.touches ? e.touches[0].clientX : e.clientX;
      const my = e.touches ? e.touches[0].clientY : e.clientY;
      const angle = Math.atan2(my - cy, mx - cx) * 180 / Math.PI;
      let newRot = initialRotation + (angle - startAngle);
      if (e.shiftKey) {
        // Shift: snap a des increments fixes (ex: 25 deg) pour alignement facile
        newRot = Math.round(newRot / ROTATE_SHIFT_STEP) * ROTATE_SHIFT_STEP;
      } else {
        // Pas de shift: snap doux aux angles cardinaux (0/90/180/270) si proche
        const snapTargets = [-360, -270, -180, -90, 0, 90, 180, 270, 360];
        for (const target of snapTargets) {
          if (Math.abs(newRot - target) <= 3) { newRot = target; break; }
        }
      }
      onChange({ ...logo, rotation: newRot });
    };
    const end = () => {
      setRotating(false);
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
    setResizing(true);
    onSelect();

    const move = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
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

  return (
    <div
      ref={logoRef}
      className={`absolute select-none ${selected ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-white/40'}`}
      style={{
        left: `${logo.x * 100}%`,
        top: `${logo.y * 100}%`,
        width: `${logo.width * 100}%`,
        aspectRatio: `${aspect}`,
        touchAction: 'none',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      {/* Halo rotation (outer) - zone 3 a 10px EXTERIEUR au logo, curseur rotation */}
      <div
        onMouseDown={(e) => { if (e.button === 0) { e.stopPropagation(); startRotate(e.clientX, e.clientY); } }}
        onTouchStart={(e) => { e.stopPropagation(); const t = e.touches[0]; startRotate(t.clientX, t.clientY); }}
        className="absolute"
        style={{
          inset: -ROTATE_HALO_OUTER,
          cursor: ROTATE_CURSOR,
        }}
      />
      {/* Dead zone (inner) - 0 a 3px exterieur, rien ne se passe (tolerance anti-mis-click).
          Rendue APRES l'outer pour etre au-dessus, rendue AVANT l'image pour que
          l'image garde son drag. */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute"
        style={{ inset: -ROTATE_HALO_INNER, cursor: 'default' }}
      />
      {/* Image du logo - tout l'interieur = zone drag */}
      <img
        src={logo.src}
        alt=""
        draggable={false}
        onMouseDown={(e) => { if (e.button === 0) { e.stopPropagation(); startDrag(e.clientX, e.clientY); } }}
        onTouchStart={(e) => { e.stopPropagation(); const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
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
            style={{ cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
          {/* Resize handle bottom-right */}
          <div
            onMouseDown={(e) => { e.stopPropagation(); startResize(e.clientX, e.clientY, e); }}
            onTouchStart={(e) => { e.stopPropagation(); const t = e.touches[0]; startResize(t.clientX, t.clientY, e); }}
            className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-accent border-2 border-white shadow-lg z-10"
            style={{ cursor: 'nwse-resize' }}
            title="Redimensionner"
          />
          {/* Indicateur de rotation (affiche angle non nul) */}
          {rotation !== 0 && !rotating && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono pointer-events-none whitespace-nowrap z-10">
              {Math.round(rotation)}°
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductCanvas - une face (front ou back) avec son lot de logos
// ---------------------------------------------------------------------------
function ProductCanvas({ side, bgSrc, bgW, bgH, logos, onLogosChange, selectedId, onSelect, onAddLogo }) {
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
        style={{ aspectRatio: `${bgW}/${bgH}`, touchAction: 'none' }}
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
async function composeAndDownload(bgImg, logos, filename, bgW, bgH) {
  if (!bgImg) return;
  const canvas = document.createElement('canvas');
  // Export en 2x pour qualite
  const scale = 2;
  canvas.width = bgW * scale;
  canvas.height = bgH * scale;
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
      const rotation = logo.rotation || 0;
      if (rotation) {
        // Rotation autour du centre du logo
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.drawImage(li, -w / 2, -h / 2, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(li, x, y, w, h);
      }
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
// MerchManualMockup - outil drag-and-drop sur fond noir
// ---------------------------------------------------------------------------
function MerchManualMockup() {
  const [productKey, setProductKey] = useState('hoodie');
  const product = PRODUCTS[productKey];

  const frontImg = useImage(product.front.src);
  const backImg = useImage(product.back.src);

  // Structure: chaque logo est un "item" partage entre tous les produits
  // (meme src, meme aspect) mais garde une position/taille independante
  // pour chaque produit dans `placements`:
  //   { id, src, aspect, placements: { hoodie: {x,y,width}, tshirt:..., longsleeve:... } }
  // Quand on drag/resize sur hoodie, on modifie UNIQUEMENT placements.hoodie.
  const [frontLogoItems, setFrontLogoItems] = useState([]);
  const [backLogoItems, setBackLogoItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mobileSide, setMobileSide] = useState('front');

  // Vue "flat" pour le produit courant (ce que ProductCanvas attend)
  const flattenForProduct = (items) => items.map(item => {
    const p = item.placements[productKey] || item.placements.hoodie || { x: 0.35, y: 0.30, width: 0.30, rotation: 0 };
    return { id: item.id, src: item.src, aspect: item.aspect, x: p.x, y: p.y, width: p.width, rotation: p.rotation || 0 };
  });
  const frontLogos = useMemo(() => flattenForProduct(frontLogoItems), [frontLogoItems, productKey]);
  const backLogos  = useMemo(() => flattenForProduct(backLogoItems),  [backLogoItems, productKey]);

  // Quand ProductCanvas appelle onLogosChange avec un tableau de logos "flat" modifies,
  // on applique les changements de position/taille/rotation UNIQUEMENT au produit courant.
  const syncPlacements = (prevItems, updatedFlat) => {
    const updatedIds = new Set(updatedFlat.map(l => l.id));
    const afterDelete = prevItems.filter(item => updatedIds.has(item.id));
    return afterDelete.map(item => {
      const flat = updatedFlat.find(f => f.id === item.id);
      if (!flat) return item;
      return {
        ...item,
        placements: {
          ...item.placements,
          [productKey]: { x: flat.x, y: flat.y, width: flat.width, rotation: flat.rotation || 0 },
        },
      };
    });
  };

  const handleFrontLogosChange = (updatedFlat) => {
    setFrontLogoItems(prev => syncPlacements(prev, updatedFlat));
  };
  const handleBackLogosChange = (updatedFlat) => {
    setBackLogoItems(prev => syncPlacements(prev, updatedFlat));
  };

  // Quand on ajoute un logo, on initialise ses placements POUR TOUS les produits
  // avec la meme position de depart (il apparait donc au meme endroit partout,
  // jusqu'a ce que tu le bouges sur un produit specifique).
  const createPlacements = (flat) => {
    const placements = {};
    Object.keys(PRODUCTS).forEach(k => {
      placements[k] = { x: flat.x, y: flat.y, width: flat.width, rotation: 0 };
    });
    return placements;
  };
  const handleAddFrontLogo = (flat) => {
    setFrontLogoItems(prev => [...prev, {
      id: flat.id, src: flat.src, aspect: flat.aspect,
      placements: createPlacements(flat),
    }]);
  };
  const handleAddBackLogo = (flat) => {
    setBackLogoItems(prev => [...prev, {
      id: flat.id, src: flat.src, aspect: flat.aspect,
      placements: createPlacements(flat),
    }]);
  };

  useEffect(() => {
    return () => {
      [...frontLogoItems, ...backLogoItems].forEach(l => {
        if (l.src.startsWith('blob:')) URL.revokeObjectURL(l.src);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    [...frontLogoItems, ...backLogoItems].forEach(l => {
      if (l.src.startsWith('blob:')) URL.revokeObjectURL(l.src);
    });
    setFrontLogoItems([]);
    setBackLogoItems([]);
    setSelectedId(null);
  };

  const totalLogos = frontLogoItems.length + backLogoItems.length;
  const productSlug = productKey; // hoodie / tshirt / longsleeve

  return (
    <div className="space-y-4">
      {/* Selecteur de produit */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-grey-muted font-semibold mr-1">
          Produit
        </span>
        {Object.entries(PRODUCTS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            onClick={() => setProductKey(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border-2 ${
              productKey === key
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-transparent bg-black/20 text-grey-muted hover:text-heading hover:bg-black/30'
            }`}
          >
            <Shirt size={14} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Barre d'actions globale */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-black/20 p-3">
        <div className="flex items-center gap-2 text-grey-muted text-sm">
          <Shirt size={16} />
          <span className="font-semibold text-heading">{product.label} noir</span>
          <span className="text-xs">· {totalLogos} logo{totalLogos !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => composeAndDownload(frontImg, frontLogos, `${productSlug}-front-mockup.png`, product.front.w, product.front.h)}
          disabled={!frontImg || frontLogos.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-40 hover:bg-accent/90 transition-colors"
        >
          <Download size={14} />
          Export Devant
        </button>
        <button
          type="button"
          onClick={() => composeAndDownload(backImg, backLogos, `${productSlug}-back-mockup.png`, product.back.w, product.back.h)}
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
          <ProductCanvas
            side="front"
            bgSrc={product.front.src}
            bgW={product.front.w}
            bgH={product.front.h}
            logos={frontLogos}
            onLogosChange={handleFrontLogosChange}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddLogo={handleAddFrontLogo}
          />
        </div>
        <div className={mobileSide === 'back' ? 'block' : 'hidden md:block'}>
          <ProductCanvas
            side="back"
            bgSrc={product.back.src}
            bgW={product.back.w}
            bgH={product.back.h}
            logos={backLogos}
            onLogosChange={handleBackLogosChange}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddLogo={handleAddBackLogo}
          />
        </div>
      </div>

      {/* Aide */}
      <div className="text-[11px] text-grey-muted/80 italic px-1">
        Drag sur le logo pour deplacer · <b>autour</b> du logo = rotation (tiens <kbd className="px-1 rounded bg-white/10">Shift</kbd> pour snap par 25°) · poignee accent = resize · X rouge = supprimer · chaque produit se souvient de sa position/taille/rotation
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MerchAIMockup - Generateur de mannequin IA via Gemini
// ---------------------------------------------------------------------------
const AI_PRODUCTS = [
  { id: 'tshirt', label: 'T-shirt' },
  { id: 'hoodie', label: 'Hoodie' },
  { id: 'longsleeve', label: 'Long Sleeve' },
  { id: 'totebag', label: 'Tote Bag' },
];

function MerchAIMockup() {
  const [product, setProduct] = useState('tshirt');
  const [color, setColor] = useState(merchColors[9]); // black par defaut
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (loading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [loading]);

  const handleLogoFile = (f) => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const resizeFileToBase64 = (f) => new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const MAX = 1000;
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX || h > MAX) {
        const r = Math.min(MAX / w, MAX / h);
        w = Math.round(w * r); h = Math.round(h * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/webp', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(f);
  });

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';
      const body = {
        product,
        colorName: color.name,
        colorHex: color.hex,
      };
      if (logoFile) {
        body.logoBase64 = await resizeFileToBase64(logoFile);
      }
      const res = await fetch(`${apiUrl}/mockup/generate-textile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.success && data.image) {
        setResult(`data:${data.image.mimeType};base64,${data.image.data}`);
      } else {
        throw new Error('Pas d\'image retournee');
      }
    } catch (err) {
      setError(err.message || 'Erreur de generation');
    } finally {
      setLoading(false);
    }
  }, [product, color, logoFile]);

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `mannequin-${product}-${color.id}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-5">
      {/* Colonne gauche: config */}
      <div className="space-y-4">
        {/* Produit */}
        <div>
          <span className="text-xs uppercase tracking-wider text-grey-muted font-semibold block mb-2">Produit</span>
          <div className="flex flex-wrap gap-2">
            {AI_PRODUCTS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProduct(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border-2 ${
                  product === p.id
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-transparent bg-black/20 text-grey-muted hover:text-heading'
                }`}
              >
                <Shirt size={13} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Couleur */}
        <div>
          <span className="text-xs uppercase tracking-wider text-grey-muted font-semibold block mb-2">
            Couleur - <span className="text-heading normal-case font-normal">{color.name}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {merchColors.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c)}
                title={c.name}
                className={`w-9 h-9 rounded-xl transition-all shadow-sm ${
                  color.id === c.id
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-black scale-110'
                    : 'hover:scale-105 hover:ring-1 hover:ring-white/30'
                }`}
                style={{
                  backgroundColor: c.hex,
                  border: c.id === 'white' ? '1px solid rgba(255,255,255,0.15)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Logo (optionnel) */}
        <div>
          <span className="text-xs uppercase tracking-wider text-grey-muted font-semibold block mb-2">
            Design sur le textile <span className="normal-case font-normal text-grey-muted">(optionnel)</span>
          </span>
          {logoPreview ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20">
              <img src={logoPreview} alt="design" className="w-14 h-14 object-contain rounded-lg bg-white/5 p-1" />
              <div className="flex-1 min-w-0">
                <p className="text-heading text-xs truncate">{logoFile?.name}</p>
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); if (logoPreview) URL.revokeObjectURL(logoPreview); setLogoPreview(null); }}
                  className="text-red-400 text-[11px] hover:underline flex items-center gap-1 mt-1"
                >
                  <X size={10} /> Retirer
                </button>
              </div>
            </div>
          ) : (
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-white/10 hover:border-white/25 cursor-pointer transition-colors"
              onClick={() => logoInputRef.current?.click()}
            >
              <ImageIcon size={20} className="text-grey-muted flex-shrink-0" />
              <span className="text-grey-muted text-xs">Deposer un logo ou design (PNG, WebP...)</span>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files[0]) handleLogoFile(e.target.files[0]); }} />
            </label>
          )}
        </div>

        {/* Bouton generer */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: 'var(--logo-accent, #ffcc02)', color: '#000' }}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Generation... {elapsed}s</>
            : <><Sparkles size={16} /> Generer le mannequin IA</>
          }
        </button>

        <p className="text-grey-muted text-[11px] text-center">
          ~10-20s - Gemini 2.5 Flash · ~0.02$/image
        </p>
      </div>

      {/* Colonne droite: resultat */}
      <div className="rounded-xl bg-black/20 flex items-center justify-center min-h-[420px] relative overflow-hidden">
        {!loading && !result && !error && (
          <div className="text-center text-grey-muted space-y-2">
            <Shirt size={40} className="mx-auto opacity-30" />
            <p className="text-sm">Choisis un produit et une couleur,<br />puis clique sur Generer</p>
          </div>
        )}
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--logo-accent, #ffcc02)' }} />
            <p className="text-heading text-sm font-semibold">Generation en cours... {elapsed}s</p>
            <p className="text-grey-muted text-xs">{color.name} {AI_PRODUCTS.find(p => p.id === product)?.label}</p>
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center gap-2 text-red-400 text-sm p-6 text-center">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button onClick={handleGenerate} className="text-accent text-xs mt-1 hover:underline">Reessayer</button>
          </div>
        )}
        {result && !loading && (
          <>
            <img src={result} alt={`${color.name} ${product}`} className="w-full h-full object-contain max-h-[600px]" />
            <button
              onClick={handleDownload}
              className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-semibold hover:bg-black/80 transition-colors"
            >
              <Download size={12} /> Telecharger
            </button>
            <button
              onClick={handleGenerate}
              className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-semibold hover:bg-black/80 transition-colors"
            >
              <Sparkles size={12} /> Regenerer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MerchMockupTool - composant exporte (avec sous-tabs)
// ---------------------------------------------------------------------------
function MerchMockupTool() {
  const [subTab, setSubTab] = useState('ai');
  return (
    <div className="space-y-4">
      {/* Sous-tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-black/20 w-fit">
        <button
          type="button"
          onClick={() => setSubTab('ai')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            subTab === 'ai' ? 'bg-accent text-white' : 'text-grey-muted hover:text-heading'
          }`}
        >
          <Sparkles size={13} />
          Mannequin IA
        </button>
        <button
          type="button"
          onClick={() => setSubTab('manual')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            subTab === 'manual' ? 'bg-accent text-white' : 'text-grey-muted hover:text-heading'
          }`}
        >
          <Shirt size={13} />
          Mockup Manuel
        </button>
      </div>

      {subTab === 'ai' && <MerchAIMockup />}
      {subTab === 'manual' && <MerchManualMockup />}
    </div>
  );
}

export default MerchMockupTool;
