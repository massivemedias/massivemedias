/**
 * stickerFx.js - Utilitaires Canvas 2D pour generer des stickers avec effets FX
 *
 * Utilise par:
 *   - AdminMassiveIA (panneau admin /admin/massive-ia, onglet Stickers)
 *   - ConfiguratorStickers (page client /services/stickers)
 *
 * Les effets sont appliques UNIQUEMENT sur les pixels opaques via source-atop,
 * donc la silhouette du sticker (bords die-cut, formes decoupees) est preservee.
 *
 * Shaders supportes: 'none' | 'clear' | 'glossy' | 'holographic' | 'broken-glass' | 'stars' | 'dots'
 * Les alias 'clear' et 'broken_glass' sont acceptes (compat AdminMassiveIA).
 */

// Charge une File/Blob/URL dans une HTMLImageElement
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const isFile = typeof File !== 'undefined' && source instanceof File;
    const isBlob = typeof Blob !== 'undefined' && source instanceof Blob;
    const shouldRevoke = isFile || isBlob;
    const url = shouldRevoke ? URL.createObjectURL(source) : source;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (shouldRevoke) URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      if (shouldRevoke) URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// Dessine l'image dans ctx avec un contour (stroke) autour des pixels non-transparents
// Technique: on dessine la silhouette coloree decalee dans 16 directions, puis l'image par dessus
export function drawStickerWithStroke(ctx, img, strokeColor, strokeWidth) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const drawW = w - strokeWidth * 2;
  const drawH = h - strokeWidth * 2;

  if (strokeWidth > 0) {
    const tmp = document.createElement('canvas');
    tmp.width = drawW;
    tmp.height = drawH;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(img, 0, 0, drawW, drawH);
    tctx.globalCompositeOperation = 'source-in';
    tctx.fillStyle = strokeColor;
    tctx.fillRect(0, 0, drawW, drawH);

    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const dx = Math.cos(angle) * strokeWidth;
      const dy = Math.sin(angle) * strokeWidth;
      ctx.drawImage(tmp, strokeWidth + dx, strokeWidth + dy, drawW, drawH);
    }
  }

  ctx.drawImage(img, strokeWidth, strokeWidth, drawW, drawH);
}

// Normalise le nom du shader (accepte les alias)
function normalizeShader(shader) {
  if (!shader) return 'none';
  if (shader === 'clear' || shader === 'matte') return 'none';
  if (shader === 'broken_glass') return 'broken-glass';
  return shader;
}

// Applique un shader FX sur le canvas (applique via source-atop = pixels opaques seulement)
export function applyShader(ctx, rawShader, w, h) {
  const shader = normalizeShader(rawShader);
  if (shader === 'none') return;

  ctx.save();

  if (shader === 'holographic') {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.28;
    let grad;
    if (typeof ctx.createConicGradient === 'function') {
      grad = ctx.createConicGradient(0, w / 2, h / 2);
      grad.addColorStop(0.00, '#ff00cc');
      grad.addColorStop(0.14, '#ff6600');
      grad.addColorStop(0.28, '#ffee00');
      grad.addColorStop(0.42, '#00ff88');
      grad.addColorStop(0.57, '#00ccff');
      grad.addColorStop(0.71, '#5500ff');
      grad.addColorStop(0.85, '#ff0088');
      grad.addColorStop(1.00, '#ff00cc');
    } else {
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0.0, '#ff00cc');
      grad.addColorStop(0.2, '#ff6600');
      grad.addColorStop(0.4, '#ffee00');
      grad.addColorStop(0.6, '#00ff88');
      grad.addColorStop(0.8, '#00ccff');
      grad.addColorStop(1.0, '#5500ff');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.10;
    const high = ctx.createLinearGradient(0, 0, w, h);
    high.addColorStop(0.0, 'rgba(255,255,255,0)');
    high.addColorStop(0.4, 'rgba(255,255,255,1)');
    high.addColorStop(0.5, 'rgba(255,255,255,0)');
    high.addColorStop(0.6, 'rgba(255,255,255,0.8)');
    high.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = high;
    ctx.fillRect(0, 0, w, h);
  }

  else if (shader === 'glossy') {
    ctx.globalCompositeOperation = 'source-atop';

    const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    topGrad.addColorStop(0.0,  'rgba(255,255,255,0.60)');
    topGrad.addColorStop(0.30, 'rgba(255,255,255,0.20)');
    topGrad.addColorStop(0.55, 'rgba(255,255,255,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    ctx.save();
    const cx = w * 0.5;
    const cy = h * 0.20;
    const radX = w * 0.38;
    const radY = h * 0.14;
    ctx.scale(1, radY / radX);
    const ovalGrd = ctx.createRadialGradient(cx, cy * (radX / radY), 0, cx, cy * (radX / radY), radX);
    ovalGrd.addColorStop(0,    'rgba(255,255,255,0.55)');
    ovalGrd.addColorStop(0.45, 'rgba(255,255,255,0.18)');
    ovalGrd.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = ovalGrd;
    ctx.beginPath();
    ctx.arc(cx, cy * (radX / radY), radX, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const bottomGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
  }

  else if (shader === 'broken-glass') {
    ctx.globalCompositeOperation = 'source-atop';

    let seed = ((w * 31337) ^ (h * 42069)) >>> 0;
    const rnd = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };

    const FACETS = 34;
    const hueShift = rnd() * 360;
    const refSize = Math.min(w, h);

    for (let i = 0; i < FACETS; i++) {
      const cx = rnd() * w;
      const cy = rnd() * h;
      const size = refSize * (0.07 + rnd() * 0.20);
      const a0 = rnd() * Math.PI * 2;
      const a1 = a0 + Math.PI * (0.35 + rnd() * 1.0);
      const a2 = a1 + Math.PI * (0.35 + rnd() * 1.0);
      const r0 = size * (0.6 + rnd() * 0.5);
      const r1 = size * (0.5 + rnd() * 0.6);
      const r2 = size * (0.4 + rnd() * 0.7);

      ctx.save();
      ctx.globalAlpha = 0.18 + rnd() * 0.32;
      const hue = (hueShift + i * (360 / FACETS) + rnd() * 25) % 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 62%)`;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0);
      ctx.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1);
      ctx.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineCap = 'round';
    const CRACKS = 12;
    for (let c = 0; c < CRACKS; c++) {
      const x0 = rnd() * w;
      const y0 = rnd() * h;
      const angle = rnd() * Math.PI * 2;
      const mainLen = refSize * (0.08 + rnd() * 0.28);
      ctx.save();
      ctx.globalAlpha = 0.35 + rnd() * 0.30;
      ctx.lineWidth = 0.4 + rnd() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + Math.cos(angle) * mainLen, y0 + Math.sin(angle) * mainLen);
      const branchT = 0.3 + rnd() * 0.45;
      const bx = x0 + Math.cos(angle) * mainLen * branchT;
      const by = y0 + Math.sin(angle) * mainLen * branchT;
      const bAngle = angle + (rnd() > 0.5 ? 1 : -1) * (0.4 + rnd() * 0.7);
      const bLen = mainLen * (0.25 + rnd() * 0.45);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(bAngle) * bLen, by + Math.sin(bAngle) * bLen);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = 'rgba(220,230,255,1)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  else if (shader === 'stars') {
    let seed = ((w * 12345) ^ (h * 67890)) >>> 0;
    const rnd = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };

    const refSize = Math.min(w, h);
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tc = tmp.getContext('2d');

    const draw4Star = (c, x, y, outerR, innerR, angle = 0) => {
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = angle + (i * Math.PI) / 4;
        const r = i % 2 === 0 ? outerR : innerR;
        if (i === 0) c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      c.closePath();
    };

    const nStars = 100;
    for (let i = 0; i < nStars; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const outerR = refSize * (0.007 + rnd() * 0.022);
      const innerR = outerR * (0.13 + rnd() * 0.10);
      const alpha = 0.60 + rnd() * 0.35;
      const rot = rnd() * Math.PI * 0.5;
      const brightness = Math.round(220 + rnd() * 35);
      tc.save();
      tc.globalAlpha = alpha;
      tc.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
      draw4Star(tc, x, y, outerR, innerR, rot);
      tc.fill();
      tc.restore();
    }

    const nCrosses = 35;
    for (let i = 0; i < nCrosses; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = refSize * (0.004 + rnd() * 0.010);
      const t = Math.max(0.8, r * 0.25);
      const alpha = 0.45 + rnd() * 0.50;
      tc.save();
      tc.globalAlpha = alpha;
      tc.fillStyle = 'rgba(255,255,255,1)';
      tc.fillRect(x - r, y - t / 2, r * 2, t);
      tc.fillRect(x - t / 2, y - r, t, r * 2);
      tc.restore();
    }

    const nDots = 50;
    for (let i = 0; i < nDots; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = refSize * (0.002 + rnd() * 0.005);
      const alpha = 0.50 + rnd() * 0.45;
      tc.save();
      tc.globalAlpha = alpha;
      tc.fillStyle = 'rgba(255,255,255,1)';
      tc.beginPath();
      tc.arc(x, y, r, 0, Math.PI * 2);
      tc.fill();
      tc.restore();
    }

    const nAccent = 10;
    for (let i = 0; i < nAccent; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const outerR = refSize * (0.022 + rnd() * 0.024);
      const innerR = outerR * 0.14;
      tc.save();
      tc.globalAlpha = 0.85 + rnd() * 0.15;
      tc.fillStyle = 'rgba(255,255,255,1)';
      draw4Star(tc, x, y, outerR, innerR, rnd() * Math.PI * 0.5);
      tc.fill();
      tc.globalAlpha = 0.20;
      const halo = tc.createRadialGradient(x, y, 0, x, y, outerR * 2.5);
      halo.addColorStop(0, 'rgba(255,255,255,0.8)');
      halo.addColorStop(1, 'rgba(255,255,255,0)');
      tc.fillStyle = halo;
      tc.beginPath();
      tc.arc(x, y, outerR * 2.5, 0, Math.PI * 2);
      tc.fill();
      tc.restore();
    }

    if (typeof tc.createConicGradient === 'function') {
      tc.globalCompositeOperation = 'source-atop';
      tc.globalAlpha = 0.22;
      const holoGrad = tc.createConicGradient(Math.PI * 0.3, w * 0.8, -h * 0.2);
      holoGrad.addColorStop(0.00, '#ff00cc');
      holoGrad.addColorStop(0.14, '#ff6600');
      holoGrad.addColorStop(0.28, '#ffee00');
      holoGrad.addColorStop(0.42, '#00ff88');
      holoGrad.addColorStop(0.57, '#00ccff');
      holoGrad.addColorStop(0.71, '#5500ff');
      holoGrad.addColorStop(0.85, '#ff0088');
      holoGrad.addColorStop(1.00, '#ff00cc');
      tc.fillStyle = holoGrad;
      tc.fillRect(0, 0, w, h);
    }

    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 1;
    ctx.drawImage(tmp, 0, 0);
  }

  else if (shader === 'dots') {
    ctx.globalCompositeOperation = 'source-atop';

    let seed = ((w * 54321) ^ (h * 98765)) >>> 0;
    const rnd = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };

    const refSize = Math.min(w, h);
    const n = 280;
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const t = rnd();
      let r;
      if (t < 0.70) r = refSize * (0.0015 + rnd() * 0.0035);
      else if (t < 0.95) r = refSize * (0.005 + rnd() * 0.008);
      else r = refSize * (0.013 + rnd() * 0.010);
      const alpha = 0.55 + rnd() * 0.40;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Dessine un sticker complet sur un canvas cible.
 *
 * @param {HTMLCanvasElement} canvas - Canvas cible (dimensions fixees en amont)
 * @param {HTMLImageElement}  img    - Image source chargee
 * @param {object}            opts
 * @param {string}            opts.shape      - 'round' | 'square' | 'rectangle' | 'diecut'
 * @param {string}            opts.shader     - shader FX
 * @param {string}            opts.strokeColor
 * @param {number}            opts.strokeWidth  - en pixels canvas
 * @param {string}            [opts.bgColor]    - couleur fond (derriere le sticker). undefined = transparent
 */
export function drawSticker(canvas, img, opts) {
  const { shape = 'diecut', shader = 'none', strokeColor = '#ffffff', strokeWidth = 0, bgColor } = opts || {};
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, W, H);

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
  }

  // Safe area: reserve une marge interieure pour que le stroke/stroke-ombre ne touche
  // pas les bords du canvas (et donc du cadre affiche). Min 4% de la plus petite
  // dimension, et au moins strokeWidth + 8px pour garantir l'espace du contour.
  // A 800px, 4% = 32px canvas = ~10px affiche a 250px de large.
  const safePad = Math.max(Math.round(Math.min(W, H) * 0.04), strokeWidth + 8);
  const innerW = W - safePad * 2;
  const innerH = H - safePad * 2;

  // Canvas intermediaire aux dimensions reduites: on y dessine tout, puis on le place
  // au centre du canvas final avec la safe area preservee tout autour.
  const inner = document.createElement('canvas');
  inner.width = innerW;
  inner.height = innerH;
  const ictx = inner.getContext('2d');

  // Clip selon la forme (sauf diecut qui suit la silhouette de l'image)
  ictx.save();
  if (shape === 'round') {
    ictx.beginPath();
    ictx.arc(innerW / 2, innerH / 2, Math.min(innerW, innerH) / 2, 0, Math.PI * 2);
    ictx.clip();
  } else if (shape === 'square') {
    const radius = Math.min(innerW, innerH) * 0.06;
    roundedRectPath(ictx, 0, 0, innerW, innerH, radius);
    ictx.clip();
  } else if (shape === 'rectangle') {
    const radius = Math.min(innerW, innerH) * 0.04;
    roundedRectPath(ictx, 0, 0, innerW, innerH, radius);
    ictx.clip();
  }
  // diecut: pas de clip, on laisse la transparence de l'image faire le die-cut

  if (shape === 'diecut') {
    // Diecut: image contain + stroke sur les pixels opaques
    const ratio = img.naturalWidth / img.naturalHeight;
    const boxRatio = innerW / innerH;
    let drawW, drawH;
    if (ratio > boxRatio) {
      drawW = innerW;
      drawH = Math.round(innerW / ratio);
    } else {
      drawH = innerH;
      drawW = Math.round(innerH * ratio);
    }
    const dx = Math.round((innerW - drawW) / 2);
    const dy = Math.round((innerH - drawH) / 2);

    const off = document.createElement('canvas');
    off.width = drawW;
    off.height = drawH;
    const octx = off.getContext('2d');
    drawStickerWithStroke(octx, img, strokeColor, 0);

    if (strokeWidth > 0) {
      const pad = strokeWidth;
      const off2 = document.createElement('canvas');
      off2.width = drawW + pad * 2;
      off2.height = drawH + pad * 2;
      const o2ctx = off2.getContext('2d');
      drawStickerWithStroke(o2ctx, img, strokeColor, pad);
      const finalRatio = off2.width / off2.height;
      let fw, fh;
      if (finalRatio > boxRatio) { fw = innerW; fh = Math.round(innerW / finalRatio); }
      else { fh = innerH; fw = Math.round(innerH * finalRatio); }
      const fx = Math.round((innerW - fw) / 2);
      const fy = Math.round((innerH - fh) / 2);
      ictx.drawImage(off2, fx, fy, fw, fh);
    } else {
      ictx.drawImage(off, dx, dy, drawW, drawH);
    }
  } else {
    // round/square/rectangle: image cover + stroke "bord du shape"
    // L'image remplit la forme. Si l'image a de la transparence,
    // on la pose sur un fond blanc pour que le sticker soit plein.
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const boxRatio = innerW / innerH;
    const imgRatio = iw / ih;

    // Cover: on agrandit l'image pour remplir la forme
    let sx, sy, sw, sh;
    if (imgRatio > boxRatio) {
      // Image plus large: crop sur les cotes
      sh = ih;
      sw = Math.round(ih * boxRatio);
      sx = Math.round((iw - sw) / 2);
      sy = 0;
    } else {
      sw = iw;
      sh = Math.round(iw / boxRatio);
      sx = 0;
      sy = Math.round((ih - sh) / 2);
    }

    // Fond blanc (la forme prend la couleur du fond blanc)
    // Les clients s'attendent a un sticker opaque pour round/square/rectangle
    ictx.fillStyle = '#ffffff';
    ictx.fillRect(0, 0, innerW, innerH);
    ictx.drawImage(img, sx, sy, sw, sh, 0, 0, innerW, innerH);
  }
  ictx.restore();

  // Stroke sur le contour du shape (round/square/rectangle)
  if (shape !== 'diecut' && strokeWidth > 0) {
    ictx.save();
    ictx.globalCompositeOperation = 'source-over';
    ictx.strokeStyle = strokeColor;
    ictx.lineWidth = strokeWidth * 2; // x2 car la moitie sera clippee par le shape
    if (shape === 'round') {
      ictx.beginPath();
      ictx.arc(innerW / 2, innerH / 2, Math.min(innerW, innerH) / 2, 0, Math.PI * 2);
      ictx.stroke();
    } else {
      const radius = shape === 'square' ? Math.min(innerW, innerH) * 0.06 : Math.min(innerW, innerH) * 0.04;
      roundedRectPath(ictx, 0, 0, innerW, innerH, radius);
      ictx.stroke();
    }
    ictx.restore();
  }

  // Appliquer le shader FX sur les pixels opaques du inner canvas
  applyShader(ictx, shader, innerW, innerH);

  // Composer inner au centre du canvas final avec la safe area preservee
  ctx.drawImage(inner, safePad, safePad);
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Exporte le canvas en data URL PNG (pour panier/thumb/localStorage)
// IMPORTANT: data URL au lieu de blob URL - les blob URLs meurent au changement
// de page (session-scoped) ce qui cassait les images du panier quand le client
// navigait depuis le configurateur vers /panier.
// Data URL = base64 inline, survit au reload + navigation + serialization JSON.
// On reduit la taille a 256px pour eviter d'exploser le localStorage (data URL
// en base64 ~33% plus gros que binaire).
export function canvasToBlobUrl(canvas) {
  return new Promise((resolve) => {
    try {
      // Resize to thumbnail dims for storage efficiency (256x256 max)
      const thumb = document.createElement('canvas');
      const maxDim = 256;
      const ratio = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);
      thumb.width = Math.round(canvas.width * ratio);
      thumb.height = Math.round(canvas.height * ratio);
      const ctx = thumb.getContext('2d');
      ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
      // toDataURL avec compression PNG (lossless pour stickers qui ont souvent
      // peu de couleurs). Si c'est trop gros on bascule sur JPEG q=0.85.
      let dataUrl = thumb.toDataURL('image/png');
      if (dataUrl.length > 120 * 1024) {
        dataUrl = thumb.toDataURL('image/jpeg', 0.85);
      }
      resolve(dataUrl);
    } catch (e) {
      // Fallback vers blob URL si toDataURL echoue (ex: canvas tainted)
      canvas.toBlob((blob) => {
        if (!blob) return resolve('');
        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    }
  });
}
