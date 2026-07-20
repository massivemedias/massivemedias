/* ---------------------------------------------------------------------------
 * ETIQUETTE Mini Massive — REGLE D'INTERLIGNE UNIQUE (apercu + production)
 * ---------------------------------------------------------------------------
 * Le bloc etiquette a 1 ou 2 lignes (prenom + ligne 2). La ligne 2 doit
 * RESPIRER sous la ligne 1 sans JAMAIS toucher ses descendantes (g, j, y,
 * boucles des polices scriptes). L'ancienne approche (marge negative calibree a
 * la main par police) chevauchait des que la ligne 1 avait une descendante.
 *
 * Cette fonction est la SOURCE UNIQUE de l'interligne : l'apercu du
 * configurateur (EtiquettePreview) l'utilise, et tout rendu de PRODUCTION (export
 * ou fichier d'impression) DOIT l'appeler aussi — sinon le client recoit autre
 * chose que l'apercu. Rendu chaque ligne en `line-height:1` ; le marginTop
 * retourne se pose entre les deux boites.
 *
 * Principe : on mesure les glyphes REELS (canvas measureText -> actual/ font
 * BoundingBox) et on pousse la ligne 2 juste sous le bas reel de la ligne 1,
 * plus une respiration proportionnelle a la taille de la ligne 2.
 * ------------------------------------------------------------------------- */

// Respiration = fraction de la taille de la ligne 2 (l'air minimal entre les
// deux glyphes, meme quand aucune descendante n'entre en jeu).
export const LABEL_LINE_BREATHE = 0.20

let _sharedCtx = null
function measureCtx() {
  if (_sharedCtx) return _sharedCtx
  if (typeof document === 'undefined') return null
  _sharedCtx = document.createElement('canvas').getContext('2d')
  return _sharedCtx
}

/**
 * marginTop (px, >= 0) a poser sur la ligne 2 (line-height:1) sous la ligne 1.
 * @param {object} o
 * @param {string} o.line1  texte ligne 1 (prenom)
 * @param {string} o.line2  texte ligne 2 (vide -> 0)
 * @param {string} o.family font-family CSS
 * @param {number|string} o.weight font-weight
 * @param {number} o.size1  taille px de la ligne 1
 * @param {number} o.size2  taille px de la ligne 2
 * @param {number} [o.maxGapPx] plafond de securite (anti-debordement du cadre)
 * @param {CanvasRenderingContext2D} [o.ctx] contexte de mesure (sinon partage)
 * @returns {number}
 */
export function labelLineGapPx({ line1, line2, family, weight, size1, size2, maxGapPx = Infinity, ctx }) {
  if (!line2 || !line2.trim() || !size2 || size2 <= 0) return 0
  // Respiration visible visee entre le bas reel de la ligne 1 et le haut reel de
  // la ligne 2 (proportionnelle, avec un plancher en px pour les petites tailles).
  const breathe = Math.max(size2 * LABEL_LINE_BREATHE, 3)
  const m = ctx || measureCtx()
  // Repli sans DOM (SSR / tests) : respiration + marge descendante prudente.
  if (!m) return clamp(Math.round(breathe + size1 * 0.14), 0, maxGapPx)

  m.font = `${weight} ${size1}px ${family}`
  const m1 = m.measureText(line1 && line1.trim() ? line1 : 'Xg')
  m.font = `${weight} ${size2}px ${family}`
  const m2 = m.measureText(line2)

  // MODELE DEMI-INTERLIGNE (line-height:1). En line-height:1 la boite = fontSize
  // et le demi-interligne (souvent negatif pour les scriptes) place la baseline a
  // (fontSize + fBBAsc - fBBDesc)/2 du haut de boite. On resout le marginTop pour
  // que l'ecart entre le BAS REEL de la ligne 1 (baseline + descendante reelle) et
  // le HAUT REEL de la ligne 2 (baseline - ascendante reelle) vaille `breathe`.
  const fBBA1 = num(m1.fontBoundingBoxAscent, size1 * 0.8)
  const fBBD1 = num(m1.fontBoundingBoxDescent, size1 * 0.2)
  const aD1 = num(m1.actualBoundingBoxDescent, fBBD1)         // descendante reelle ligne 1
  const fBBA2 = num(m2.fontBoundingBoxAscent, size2 * 0.8)
  const fBBD2 = num(m2.fontBoundingBoxDescent, size2 * 0.2)
  const aA2 = num(m2.actualBoundingBoxAscent, fBBA2)          // ascendante reelle ligne 2

  const marginTop = breathe + aD1 + aA2
    - (size1 - fBBA1 + fBBD1) / 2
    - (size2 + fBBA2 - fBBD2) / 2

  return clamp(Math.round(marginTop), 0, maxGapPx)
}

function num(v, fallback) { return (typeof v === 'number' && isFinite(v)) ? v : fallback }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
