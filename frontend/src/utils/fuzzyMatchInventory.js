/**
 * Fuzzy matching pour lier des lignes de facture fournisseur
 * aux items d'inventaire existants.
 *
 * Strategie:
 * 1. Normaliser les chaines (lowercase, sans accents, sans ponctuation)
 * 2. Extraire les tokens significatifs (> 2 caracteres)
 * 3. Calculer un score de similarite base sur:
 *    - Tokens communs (Jaccard)
 *    - Correspondance de chiffres/dimensions (ex: "13x19", "100g")
 *    - Bonus si la categorie matche
 * 4. Score minimum pour proposer un match: 0.35
 */

// Liste de mots courants à ignorer (stop words FR/EN)
const STOP_WORDS = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'et', 'ou',
  'a', 'au', 'aux', 'pour', 'par', 'sur', 'avec', 'sans',
  'the', 'of', 'and', 'or', 'for', 'with', 'to', 'in', 'on',
  'pack', 'boite', 'box', 'paquet', 'qte', 'qty', 'lot',
]);

/**
 * Normalise une chaine pour le matching.
 * - Minuscules
 * - Enleve les accents
 * - Remplace la ponctuation par des espaces
 * - Compacte les espaces
 */
export function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^\w\s]/g, ' ')        // Ponctuation -> espaces
    .replace(/\s+/g, ' ')            // Compacter les espaces
    .trim();
}

/**
 * Extrait les tokens significatifs d'une chaine.
 * Ignore les stop words et les tokens < 2 chars (sauf les chiffres utiles).
 */
export function tokenize(str) {
  const normalized = normalize(str);
  return normalized
    .split(/\s+/)
    .filter(token => {
      if (token.length < 2) return false;
      if (STOP_WORDS.has(token)) return false;
      return true;
    });
}

/**
 * Extrait les "patterns techniques" d'une chaine:
 * dimensions (13x19), grammages (250g, 300gsm), pourcentages, references.
 * Ces patterns sont tres discriminants et meritent un boost dans le score.
 */
export function extractTechnicalTokens(str) {
  const normalized = normalize(str);
  const patterns = [];

  // Dimensions: 13x19, 8.5x11, 100 x 150, etc.
  const dimensions = normalized.match(/\d+\.?\d*\s*x\s*\d+\.?\d*/g) || [];
  patterns.push(...dimensions.map(d => d.replace(/\s+/g, '')));

  // Grammages: 250g, 300gsm, 100lb
  const weights = normalized.match(/\d+\s*(?:g|gsm|lb|oz|pt)(?:\b|$)/g) || [];
  patterns.push(...weights.map(w => w.replace(/\s+/g, '')));

  // Tailles de papier: a4, a3, a3+, 8x10, 11x14, etc.
  const paperSizes = normalized.match(/\b(?:a[234]\+?|letter|legal|tabloid)\b/g) || [];
  patterns.push(...paperSizes);

  // Pourcentages
  const percents = normalized.match(/\d+\s*%/g) || [];
  patterns.push(...percents.map(p => p.replace(/\s+/g, '')));

  return patterns;
}

/**
 * Calcule la similarite Jaccard entre deux sets de tokens.
 * 1.0 = identique, 0.0 = aucun token commun
 */
function jaccardSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Calcule la distance de Levenshtein entre deux chaines.
 * Utilisee pour detecter les fautes de frappe legeres.
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  matrix[0] = Array.from({ length: a.length + 1 }, (_, i) => i);

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Calcule un score global de similarite (0-1) entre une ligne de facture
 * et un item d'inventaire existant.
 */
export function scoreMatch(invoiceLine, inventoryItem) {
  if (!invoiceLine || !inventoryItem) return 0;

  const lineDesc = invoiceLine.description || '';
  const itemName = [
    inventoryItem.nameFr,
    inventoryItem.nameEn,
    inventoryItem.variant,
    inventoryItem.sku,
  ].filter(Boolean).join(' ');

  if (!lineDesc || !itemName) return 0;

  const lineTokens = tokenize(lineDesc);
  const itemTokens = tokenize(itemName);

  // Score Jaccard sur les tokens
  let score = jaccardSimilarity(lineTokens, itemTokens);

  // Bonus pour les patterns techniques matches (dimensions, grammages, formats)
  const lineTech = extractTechnicalTokens(lineDesc);
  const itemTech = extractTechnicalTokens(itemName);
  if (lineTech.length > 0 && itemTech.length > 0) {
    const techMatches = lineTech.filter(t => itemTech.includes(t)).length;
    const techScore = techMatches / Math.max(lineTech.length, itemTech.length);
    // Les specs techniques valent beaucoup: bonus jusqu'a +0.3
    score += techScore * 0.3;
  }

  // Bonus si la categorie matche
  if (invoiceLine.category && inventoryItem.category) {
    if (invoiceLine.category === inventoryItem.category) {
      score += 0.1;
    }
  }

  // Bonus Levenshtein: si la description contient exactement le nom (faute near)
  const normLine = normalize(lineDesc);
  const normItem = normalize(inventoryItem.nameFr || '');
  if (normItem.length >= 4 && normLine.includes(normItem)) {
    score += 0.2;
  } else if (normItem.length >= 4) {
    const dist = levenshtein(normLine, normItem);
    const maxLen = Math.max(normLine.length, normItem.length);
    const editRatio = 1 - dist / maxLen;
    if (editRatio > 0.7) {
      score += editRatio * 0.15;
    }
  }

  return Math.min(1, score);
}

/**
 * Trouve le meilleur match dans une liste d'items d'inventaire.
 * @param {Object} invoiceLine - La ligne de facture (description, category, etc.)
 * @param {Array} inventoryItems - La liste complete des items d'inventaire actifs
 * @param {Number} minScore - Score minimum requis (default 0.35)
 * @returns {Object|null} { item, score } ou null si aucun match
 */
export function findBestMatch(invoiceLine, inventoryItems, minScore = 0.35) {
  if (!inventoryItems || inventoryItems.length === 0) return null;

  let best = null;
  for (const item of inventoryItems) {
    if (!item.active) continue;
    const score = scoreMatch(invoiceLine, item);
    if (score >= minScore && (!best || score > best.score)) {
      best = { item, score };
    }
  }
  return best;
}

/**
 * Trouve les N meilleurs matches (pour permettre a l'utilisateur de choisir).
 */
export function findTopMatches(invoiceLine, inventoryItems, n = 3, minScore = 0.25) {
  if (!inventoryItems || inventoryItems.length === 0) return [];

  const scored = inventoryItems
    .filter(item => item.active)
    .map(item => ({ item, score: scoreMatch(invoiceLine, item) }))
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);

  return scored;
}

/**
 * Mapping des categories de depense "physiques" (qui justifient d'etre dans l'inventaire)
 * vers les categories d'inventaire Strapi.
 *
 * Utilise pour determiner si une ligne de facture fournisseur devrait
 * automatiquement avoir addToInventory = true.
 */
export const PHYSICAL_EXPENSE_CATEGORIES = {
  // Materiel d'impression / consommables
  'materiel': 'other',
  'consommables': 'other',
  // Equipement
  'equipment': 'equipment',
  'equipement': 'equipment',
};

/**
 * Keywords qui suggerent qu'un item est physique/a ajouter a l'inventaire.
 * Utilise comme fallback quand la categorie de depense n'est pas claire.
 */
const PHYSICAL_KEYWORDS = [
  // Papier
  'papier', 'paper', 'hahnemuhle', 'epson', 'canson', 'luster', 'matte', 'glossy',
  'photo paper', 'fine art', 'archival',
  // Encre
  'encre', 'ink', 'cartouche', 'cartridge', 'toner',
  // Cadres
  'cadre', 'frame', 'passepartout', 'mat', 'matboard',
  // Vinyle / stickers
  'vinyle', 'vinyl', 'adhesif', 'adhesive', 'lamine', 'laminate',
  // Emballage
  'emballage', 'packaging', 'carton', 'tube', 'enveloppe', 'envelope',
  // Textile
  'textile', 'coton', 'cotton', 'tshirt', 't-shirt', 'hoodie', 'sweat',
  // Hardware
  'imprimante', 'printer', 'ecran', 'monitor', 'disque', 'ssd', 'hdd',
  'camera', 'objectif', 'lens', 'tripod', 'trepied',
];

/**
 * Determine si une ligne de facture fournisseur devrait avoir
 * addToInventory = true par defaut.
 *
 * Base sur:
 * 1. La categorie de depense (materiel, equipment, consommables)
 * 2. Les keywords dans la description
 */
export function shouldDefaultAddToInventory(invoiceLine, expenseCategory = '') {
  // Par categorie de depense
  if (PHYSICAL_EXPENSE_CATEGORIES[expenseCategory]) {
    return true;
  }

  // Par keyword dans la description
  const normalized = normalize(invoiceLine?.description || '');
  if (!normalized) return false;

  return PHYSICAL_KEYWORDS.some(kw => normalized.includes(normalize(kw)));
}

/**
 * Determine la categorie d'inventaire Strapi la plus probable
 * pour une ligne de facture, basee sur des keywords.
 */
export function guessInventoryCategory(invoiceLine) {
  const normalized = normalize(invoiceLine?.description || '');
  if (!normalized) return 'other';

  if (/(papier|paper|hahnemuhle|canson|luster|photo paper|fine art|archival)/.test(normalized)) {
    return 'print';
  }
  if (/(encre|ink|cartouche|cartridge|toner)/.test(normalized)) {
    return 'print';
  }
  if (/(cadre|frame|passepartout|matboard)/.test(normalized)) {
    return 'frame';
  }
  if (/(vinyle|vinyl|adhesif|sticker)/.test(normalized)) {
    return 'sticker';
  }
  if (/(textile|coton|tshirt|t-shirt|hoodie|sweat|merch)/.test(normalized)) {
    return 'textile';
  }
  if (/(imprimante|printer|ecran|monitor|camera|objectif|lens|tripod)/.test(normalized)) {
    return 'equipment';
  }

  // Fallback sur la categorie existante si presente
  const VALID = ['textile', 'frame', 'accessory', 'sticker', 'print', 'merch', 'equipment', 'other'];
  if (invoiceLine?.category && VALID.includes(invoiceLine.category)) {
    return invoiceLine.category;
  }
  return 'other';
}
