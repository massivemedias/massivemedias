import { img } from '../utils/paths';
// PRIX-HARDCODE (avril 2026): toutes les grilles tarifaires vivent dans pricingData.js.
// Ce fichier ne fait que les re-exporter sous l'ancienne forme pour compat retroactive.
import {
  STICKER_GRID_STANDARD,
  STICKER_GRID_FX,
  STICKER_FX_FINISHES,
  FINE_ART_GRID,
  FLYER_GRID,
  SUBLIMATION_UNIT_PRICES,
  SUBLIMATION_DESIGN_FEE,
  SUBLIMATION_BLANK_COST,
  SUBLIMATION_BYOT_ALLOWED,
  lookupStickerPrice,
  lookupFineArtPrice,
  lookupFlyerPrice,
  lookupSublimationPrice,
} from '../utils/pricingData';

export const stickerFinishes = [
  { id: 'matte', labelFr: 'Matte', labelEn: 'Matte', labelEs: 'Mate', descFr: 'Fini mat naturel, sans reflets', descEn: 'Natural matte finish, no shine', descEs: 'Acabado mate natural, sin reflejos' },
  { id: 'glossy', labelFr: 'Vinyle Lustré', labelEn: 'Luster Vinyl', labelEs: 'Vinilo Lustrado', descFr: 'Brillant subtil, couleurs éclatantes', descEn: 'Subtle shine, vibrant colors', descEs: 'Brillo sutil, colores vibrantes' },
  { id: 'holographic', labelFr: 'Holographique', labelEn: 'Holographic', labelEs: 'Holográfico', descFr: 'Reflets arc-en-ciel, effet wow', descEn: 'Rainbow reflections, wow effect', descEs: 'Reflejos arcoíris, efecto wow' },
  { id: 'broken-glass', labelFr: 'Verre Brisé', labelEn: 'Broken Glass', labelEs: 'Vidrio Roto', descFr: 'Éclats cristallins, reflets prismatiques', descEn: 'Crystal shards, prismatic reflections', descEs: 'Fragmentos cristalinos, reflejos prismáticos' },
  { id: 'stars', labelFr: 'Étoiles', labelEn: 'Stars', labelEs: 'Estrellas', descFr: 'Motif étoiles scintillantes', descEn: 'Sparkling star pattern', descEs: 'Patrón de estrellas centelleantes' },
  { id: 'dots', labelFr: 'Points', labelEn: 'Dots', labelEs: 'Puntos', descFr: 'Motif points structuré', descEn: 'Structured dot pattern', descEs: 'Patrón de puntos estructurado' },
];

export const stickerShapes = [
  { id: 'round', labelFr: 'Rond', labelEn: 'Round', labelEs: 'Redondo', descFr: 'Classique et polyvalent', descEn: 'Classic and versatile', descEs: 'Clásico y versátil' },
  { id: 'square', labelFr: 'Carré', labelEn: 'Square', labelEs: 'Cuadrado', descFr: 'Moderne et structuré', descEn: 'Modern and structured', descEs: 'Moderno y estructurado' },
  { id: 'rectangle', labelFr: 'Rectangle', labelEn: 'Rectangle', labelEs: 'Rectángulo', descFr: 'Idéal pour étiquettes', descEn: 'Ideal for labels', descEs: 'Ideal para etiquetas' },
  { id: 'diecut', labelFr: 'Die-cut (custom)', labelEn: 'Die-cut (custom)', labelEs: 'Die-cut (personalizado)', descFr: 'Découpe à ta forme', descEn: 'Cut to your shape', descEs: 'Cortado a tu forma' },
];

export const stickerSizes = [
  { id: '2in', label: '2"' },
  { id: '2.5in', label: '2.5"' },
  { id: '3in', label: '3"' },
  { id: '4in', label: '4"' },
  { id: '5in', label: '5"' },
];

// Tiers sticker derives AUTOMATIQUEMENT depuis pricingData.STICKER_GRID_STANDARD.
// Ne jamais editer ici, modifier pricingData.js (source unique de verite).
function gridToTiers(grid) {
  return Object.keys(grid)
    .map(Number)
    .sort((a, b) => a - b)
    .map(qty => ({
      qty,
      price: grid[qty],
      unitPrice: Math.round((grid[qty] / qty) * 100) / 100,
    }));
}

export const stickerPriceTiers = gridToTiers(STICKER_GRID_STANDARD);
export const holographicPriceTiers = gridToTiers(STICKER_GRID_FX);
export const diecutPriceTiers = stickerPriceTiers;

// -------------------------------------------------------------
// SIZE MULTIPLIERS - DEPRECATED (avril 2026)
// La grille officielle impose un prix fixe par palier, peu importe la taille.
// Gardes a 1.0 pour ne rien casser chez les eventuels consommateurs (exports
// API pricing-config, admin UI). NE PAS reintroduire de multiplier != 1.0.
// -------------------------------------------------------------
export const SIZE_MULTIPLIERS = {
  '2': 1.0,
  '2.5': 1.0,
  '3': 1.0,
  '4': 1.0,
  '5': 1.0,
};

// DEPRECATED (avril 2026): la grille officielle est fixe, la taille n'impacte plus le prix.
// Conserve pour ne pas casser les imports existants. Retourne toujours 1.0.
export function getSizeMultiplier(size) {
  return 1.0;
}

/**
 * Calcule le prix d'un palier sticker STRICTEMENT depuis la grille hardcoded.
 * Proxy vers lookupStickerPrice de pricingData.js (source unique de verite).
 * La taille du sticker n'impacte PAS le prix.
 */
export function getStickerPrice(finish, shape, qty, size) {
  const r = lookupStickerPrice(finish, qty);
  if (!r) return null;
  return {
    qty: r.qty,
    price: r.price,
    unitPrice: r.unitPrice,
    sizeMultiplier: 1.0,
    baseUnitPrice: r.unitPrice,
  };
}

/**
 * Calcule le prix proportionnel pour une quantite quelconque (pack builder).
 * Utilise le unitPrice du palier le plus eleve que la quantite atteint.
 * HARDCODED via pricingData.STICKER_GRID_*. La taille n'est PAS utilisee.
 *
 * Retourne null si total < 25 (minimum d'impression).
 */
export function getStickerPriceForTotal(finish, shape, total, size) {
  if (!total || total < 25) return null;
  const grid = STICKER_FX_FINISHES.includes(finish) ? STICKER_GRID_FX : STICKER_GRID_STANDARD;
  const tierQtys = Object.keys(grid).map(Number).sort((a, b) => a - b);
  let tierQty = tierQtys[0];
  for (const q of tierQtys) {
    if (total >= q) tierQty = q;
  }
  const tierUnitPrice = Math.round((grid[tierQty] / tierQty) * 100) / 100;
  return {
    qty: total,
    unitPrice: tierUnitPrice,
    price: Math.round(total * tierUnitPrice * 100) / 100,
    tierQty,
    sizeMultiplier: 1.0,
    baseUnitPrice: tierUnitPrice,
  };
}

export const stickerImages = [
  img('/images/realisations/stickers/Stickers-Cosmo.webp'),
  img('/images/realisations/stickers/Stickers-Cosmovision.webp'),
  img('/images/realisations/stickers/Stickers-Fusion-State-Rec.webp'),
  img('/images/realisations/stickers/Stickers-Maudite-Machine.webp'),
  img('/images/realisations/stickers/Stickers-Vrstl.webp'),
  img('/images/realisations/stickers/Stickers-massive.webp'),
  img('/images/stickers/Stickers-Psyqu33n2.webp'),
  img('/images/stickers/Stickers-Psyqu33n3.webp'),
  img('/images/stickers/Stickers-Psyqu33n5.webp'),
  img('/images/stickers/Stickers-Psyqu33n6.webp'),
  img('/images/stickers/Stickers-Psyqu33n8.webp'),
  img('/images/stickers/Stickers-Psyqu33n9.webp'),
  img('/images/stickers/Stickers-Psyqu33n10.webp'),
  img('/images/stickers/Stickers-Psyqu33n12.webp'),
  img('/images/stickers/Stickers-Psyqu33n13.webp'),
  img('/images/stickers/Stickers-Psyqu33n14.webp'),
];

export const stickerHighlights = {
  fr: [
    'Découpe de précision professionnelle',
    'Vinyle clear (lamine), lustre, holographique, transparent, verre brise, etoiles',
    'Découpe contour à la forme exacte du design',
    'Lamination incluse - résistant eau, UV, rayures',
    'Design graphique inclus dans le prix',
    'Livraison locale disponible',
    'Production locale Montréal',
  ],
  en: [
    'Professional precision cutting',
    'Clear (laminated), glossy, holographic vinyl',
    'Contour cut to exact design shape',
    'Lamination included - water, UV, scratch resistant',
    'Graphic design included in price',
    'Local delivery available',
    'Local production Montreal',
  ],
  es: [
    'Corte de precisión profesional',
    'Vinilo mate, brillante, transparente, holográfico',
    'Corte de contorno a la forma exacta del diseño',
    'Laminación incluida - resistente al agua, UV, rayaduras',
    'Diseño gráfico incluido en el precio',
    'Entrega local disponible',
    'Produccion local Montreal',
  ],
};

export const stickerFaq = {
  fr: [
    { q: 'Quels fichiers dois-je fournir?', a: 'Idéalement un fichier vectoriel (AI, SVG, PDF) ou un PNG haute résolution (300 DPI minimum) avec fond transparent. Si vous n\'avez pas de fichier prêt, notre service de design graphique est inclus dans le prix.' },
    { q: 'Quel est le délai de production?', a: 'Le délai de production varie selon la complexité et la quantité. Contactez-nous pour un estimé. Nous vous confirmerons le délai exact lors de la validation de votre commande.' },
    { q: 'Peut-on commander une forme totalement custom?', a: 'Oui! L\'option die-cut permet de découper vos stickers selon n\'importe quelle forme. Le contour suit exactement votre design.' },
    { q: 'Quelle est la qualité du vinyle?', a: 'Nous utilisons du vinyle professionnel avec lamination intégrée. Résistant à l\'eau, aux UV et aux rayures. Durée de vie extérieure de 3-5 ans.' },
    { q: 'La livraison est-elle disponible?', a: 'Livraison locale gratuite à Montréal (Mile-End et environs). Envoi postal disponible partout au Canada.' },
    { q: 'Le design est vraiment inclus?', a: 'Oui, la création ou l\'adaptation graphique de votre sticker est incluse dans tous nos prix. On s\'assure que votre design est optimisé pour l\'impression.' },
    { q: 'Que se passe-t-il si je ne suis pas satisfait?', a: 'La promesse Massive : si le résultat ne correspond pas à ce qui a été validé, on refait votre commande. On valide toujours un proof numérique avec vous avant production.' },
    { q: 'Puis-je voir un proof avant impression?', a: 'Oui, nous envoyons toujours un proof numérique par courriel avant de lancer la production. Vous validez les couleurs, la forme et les détails.' },
  ],
  en: [
    { q: 'What files should I provide?', a: 'Ideally a vector file (AI, SVG, PDF) or high-resolution PNG (300 DPI minimum) with transparent background. If you don\'t have a ready file, our graphic design service is included in the price.' },
    { q: 'What is the production time?', a: 'Production in 24 to 72 hours depending on complexity and quantity. We\'ll confirm the exact timeline when validating your order.' },
    { q: 'Can I order a completely custom shape?', a: 'Yes! The die-cut option lets us cut your stickers in any shape. The contour follows your design exactly.' },
    { q: 'What is the vinyl quality?', a: 'We use professional-grade vinyl with integrated lamination. Water, UV, and scratch resistant. Outdoor lifespan of 3-5 years.' },
    { q: 'Is delivery available?', a: 'Free local delivery in Montreal (Mile-End area). Postal shipping available across Canada.' },
    { q: 'Is design really included?', a: 'Yes, graphic creation or adaptation of your sticker is included in all our prices. We make sure your design is optimized for printing.' },
    { q: 'What if I\'m not satisfied?', a: 'The Massive Promise: if the result doesn\'t match what was validated, we redo your order. We always validate a digital proof with you before production.' },
    { q: 'Can I see a proof before printing?', a: 'Yes, we always send a digital proof by email before starting production. You validate colors, shape and details.' },
  ],
  es: [
    { q: '¿Qué archivos debo proporcionar?', a: 'Idealmente un archivo vectorial (AI, SVG, PDF) o un PNG de alta resolución (300 DPI mínimo) con fondo transparente. Si no tienes un archivo listo, nuestro servicio de diseño gráfico está incluido en el precio.' },
    { q: '¿Cuál es el plazo de producción?', a: 'Producción en 24 a 72 horas según la complejidad y cantidad. Confirmaremos el plazo exacto al validar tu pedido.' },
    { q: '¿Puedo pedir una forma totalmente personalizada?', a: '¡Sí! La opción die-cut permite cortar tus stickers en cualquier forma. El contorno sigue exactamente tu diseño.' },
    { q: '¿Cuál es la calidad del vinilo?', a: 'Utilizamos vinilo profesional con laminación integrada. Resistente al agua, a los rayos UV y a las rayaduras. Vida útil exterior de 3 a 5 años.' },
    { q: '¿Hay entrega disponible?', a: 'Entrega local gratuita en Montreal (Mile-End y alrededores). Envío postal disponible en todo Canadá.' },
    { q: '¿El diseño está realmente incluido?', a: 'Sí, la creación o adaptación gráfica de tu sticker está incluida en todos nuestros precios. Nos aseguramos de que tu diseño esté optimizado para la impresión.' },
    { q: '¿Qué pasa si no estoy satisfecho?', a: 'La promesa Massive: si el resultado no corresponde a lo que fue validado, rehacemos tu pedido. Siempre validamos una prueba digital contigo antes de la producción.' },
    { q: '¿Puedo ver una prueba antes de imprimir?', a: 'Sí, siempre enviamos una prueba digital por correo electrónico antes de iniciar la producción. Validas los colores, la forma y los detalles.' },
  ],
};

// =============================================
// FINE ART
// =============================================

export const fineArtPrinterTiers = [
  { id: 'studio', labelFr: 'Serie Studio', labelEn: 'Studio Series', labelEs: 'Serie Studio', desc: '', descFr: '4 encres pigmentees', descEn: '4 pigmented inks', descEs: '4 tintas pigmentadas' },
  { id: 'museum', labelFr: 'Serie Musee', labelEn: 'Museum Series', labelEs: 'Serie Museo', desc: '', descFr: '12 encres pigmentees', descEn: '12 pigmented inks', descEs: '12 tintas pigmentadas' },
];

// Derive depuis FINE_ART_GRID (pricingData.js). Source unique de verite.
export const fineArtFormats = Object.keys(FINE_ART_GRID).map(id => ({
  id,
  label: FINE_ART_GRID[id].label,
  studioPrice: FINE_ART_GRID[id].studio,
  museumPrice: FINE_ART_GRID[id].museum,
  w: FINE_ART_GRID[id].w,
  h: FINE_ART_GRID[id].h,
  typeName: FINE_ART_GRID[id].typeName,
}));

// Prix du cadre derive depuis FINE_ART_GRID (source unique de verite).
export const fineArtFramePriceByFormat = Object.fromEntries(
  Object.keys(FINE_ART_GRID).map(id => [id, FINE_ART_GRID[id].frame])
);
export const fineArtFramePrice = 30; // fallback si format inconnu

export function getFineArtPrice(tier, format, withFrame) {
  return lookupFineArtPrice(tier, format, withFrame);
}

export const fineArtImages = [
  img('/images/realisations/prints/FineArt1.webp'),
  img('/images/realisations/prints/FineArt4.webp'),
  img('/images/realisations/prints/FineArt6.webp'),
  img('/images/realisations/prints/Prints7.webp'),
  img('/images/realisations/prints/Prints17.webp'),
  img('/images/realisations/prints/Prints18.webp'),
  img('/images/realisations/prints/Prints24.webp'),
];

export const fineArtFaq = {
  fr: [
    { q: 'Quelle est la différence entre Série Studio et Série Musée?', a: 'La Série Studio utilise une imprimante 4 encres pigmentées, excellente pour tous les usages. La Série Musée utilise une imprimante 12 encres pigmentées pour une qualité supérieure, parfaite pour la photographie et les tirages galerie.' },
    { q: 'Quels papiers utilisez-vous?', a: 'Nous utilisons des papiers fine art professionnels premium : coton, alpha-cellulose, papiers d\'archives. Chaque papier est calibré avec un profil ICC sur mesure pour des couleurs fidèles.' },
    { q: 'Quelle est la durée de conservation?', a: 'Nos tirages fine art ont une durée de conservation de 100+ ans grâce aux encres pigmentées et papiers d\'archives. C\'est le standard des galeries et musées.' },
    { q: 'Puis-je faire encadrer mon tirage?', a: 'Oui! Cadre noir ou blanc disponible : 20$ pour carte postale et A4, 30$ pour A3, 35$ pour A3+ et 45$ pour A2. Ajoutez-le directement dans le configurateur.' },
    { q: 'Quel fichier dois-je fournir?', a: 'Idéalement un fichier haute résolution (300 DPI minimum). Nous effectuons un soft proofing (prévisualisation numérique) avant impression pour valider les couleurs avec vous.' },
    { q: 'La livraison est-elle disponible?', a: 'Pick-up gratuit au Mile-End. Livraison locale disponible à Montréal. Envoi postal avec emballage protection pour le reste du Canada.' },
  ],
  en: [
    { q: 'What is the difference between Studio and Museum Series?', a: 'The Studio Series uses a 4-color pigment printer, excellent for all uses. The Museum Series uses a 12-color pigment printer for superior quality, perfect for photography and gallery prints.' },
    { q: 'What papers do you use?', a: 'We use premium professional fine art papers: cotton, alpha-cellulose, archival papers. Each paper is calibrated with a custom ICC profile for accurate colors.' },
    { q: 'What is the conservation lifespan?', a: 'Our fine art prints have a 100+ year conservation life thanks to pigmented inks and archival papers. This is the gallery and museum standard.' },
    { q: 'Can I get my print framed?', a: 'Yes! We offer a black or white frame option for an additional $30. You can add it directly in the configurator.' },
    { q: 'What file should I provide?', a: 'Ideally a high-resolution file (300 DPI minimum). We perform soft proofing (digital preview) before printing to validate colors with you.' },
    { q: 'Is delivery available?', a: 'Free pick-up in Mile-End. Local delivery available in Montreal. Postal shipping with protective packaging for the rest of Canada.' },
  ],
  es: [
    { q: '¿Cuál es la diferencia entre Serie Studio y Serie Museo?', a: 'La Serie Studio utiliza una impresora de 4 tintas pigmentadas, excelente para todos los usos. La Serie Museo utiliza una impresora de 12 tintas pigmentadas para una calidad superior, perfecta para fotografía e impresiones de galería.' },
    { q: '¿Qué papeles utilizan?', a: 'Utilizamos papeles fine art profesionales premium: algodón, alfa-celulosa, papeles de archivo. Cada papel está calibrado con un perfil ICC personalizado para colores fieles.' },
    { q: '¿Cuál es la duración de conservación?', a: 'Nuestras impresiones fine art tienen una duración de conservación de más de 100 años gracias a las tintas pigmentadas y papeles de archivo. Es el estándar de galerías y museos.' },
    { q: '¿Puedo enmarcar mi impresión?', a: '¡Sí! Ofrecemos la opción de marco negro o blanco por $30 adicionales. Puedes agregarlo directamente en el configurador.' },
    { q: '¿Qué archivo debo proporcionar?', a: 'Idealmente un archivo de alta resolución (300 DPI mínimo). Realizamos un soft proofing (previsualización digital) antes de imprimir para validar los colores contigo.' },
    { q: '¿Hay entrega disponible?', a: 'Recogida gratuita en Mile-End. Entrega local disponible en Montreal. Envío postal con embalaje protector para el resto de Canadá.' },
  ],
};

// =============================================
// SUBLIMATION & MERCH
// =============================================

export const sublimationProducts = [
  { id: 'tshirt', labelFr: 'T-shirt', labelEn: 'T-shirt', labelEs: 'Camiseta', descFr: 'Léger et confortable, all-over', descEn: 'Light and comfortable, all-over', descEs: 'Ligera y cómoda, all-over' },
  { id: 'longsleeve', labelFr: 'Long Sleeve', labelEn: 'Long Sleeve', labelEs: 'Long Sleeve', descFr: 'Style décontracté, coton épais', descEn: 'Casual style, thick cotton', descEs: 'Estilo casual, algodón grueso' },
  { id: 'hoodie', labelFr: 'Hoodie', labelEn: 'Hoodie', labelEs: 'Hoodie', descFr: 'Chaleureux et streetwear', descEn: 'Warm and streetwear', descEs: 'Cálido y streetwear' },
  { id: 'totebag', labelFr: 'Tote Bag', labelEn: 'Tote Bag', labelEs: 'Tote Bag', descFr: 'Pratique et écologique', descEn: 'Practical and eco-friendly', descEs: 'Práctico y ecológico' },
  { id: 'bag', labelFr: 'Sac banane', labelEn: 'Fanny Pack', labelEs: 'Riñonera', descFr: 'Compact et tendance', descEn: 'Compact and trendy', descEs: 'Compacta y de moda' },
  { id: 'mug', labelFr: 'Mug', labelEn: 'Mug', labelEs: 'Taza', descFr: 'Classique 11oz ou 15oz', descEn: 'Classic 11oz or 15oz', descEs: 'Clásica 11oz o 15oz' },
  { id: 'tumbler', labelFr: 'Tumbler', labelEn: 'Tumbler', labelEs: 'Tumbler', descFr: 'Bouteille isotherme', descEn: 'Insulated bottle', descEs: 'Botella térmica' },
];

// Derive depuis SUBLIMATION_UNIT_PRICES (pricingData.js). Grille officielle 2026,
// tous les paliers sont fermes (plus de "sur soumission") et le prix total est calcule.
export const sublimationPriceTiers = Object.fromEntries(
  Object.entries(SUBLIMATION_UNIT_PRICES).map(([productId, grid]) => [
    productId,
    Object.keys(grid)
      .map(Number)
      .sort((a, b) => a - b)
      .map(qty => ({
        qty,
        unitPrice: grid[qty],
        price: grid[qty] * qty,
      })),
  ])
);

export const sublimationDesignPrice = SUBLIMATION_DESIGN_FEE;

/**
 * Cout du vetement/objet vierge (blank) par unite.
 * Utilise pour l'option "J'apporte mon propre textile" (BYOT = Bring Your Own Textile):
 * si le client fournit son vetement, on deduit ce cout du prix total pour ne
 * facturer que le "print fee" (travail d'impression + encre + main d'oeuvre).
 *
 * Ces valeurs doivent correspondre a notre cout d'achat blank moyen + marge
 * raisonnable. Si un produit n'est pas dans cette table, BYOT est indisponible
 * pour ce produit (ex: si on ne pense pas qu'un mug client puisse etre sublime
 * sur notre equipement).
 */
// Derive depuis SUBLIMATION_BLANK_COST (pricingData.js).
export const sublimationBlankCost = SUBLIMATION_BLANK_COST;

// Derive depuis SUBLIMATION_BYOT_ALLOWED (pricingData.js).
export const sublimationBYOTAllowed = new Set(SUBLIMATION_BYOT_ALLOWED);

export function canBringOwnGarment(product) {
  return sublimationBYOTAllowed.has(product);
}

/**
 * Retourne le prix d'un produit sublimation pour une quantite donnee.
 * Proxy vers lookupSublimationPrice de pricingData.js (source unique de verite).
 *
 * @param product         tshirt | longsleeve | hoodie | totebag | bag | mug | tumbler
 * @param qtyIndex        index du palier dans sublimationPriceTiers[product]
 * @param withDesign      true = ajouter le design fee fixe (125$)
 * @param bringOwnGarment true = client apporte son propre textile (BYOT)
 */
export function getSublimationPrice(product, qtyIndex, withDesign, bringOwnGarment = false) {
  const tiers = sublimationPriceTiers[product];
  if (!tiers || !tiers[qtyIndex]) return null;
  const tier = tiers[qtyIndex];
  const r = lookupSublimationPrice(product, tier.qty, { withDesign, byot: bringOwnGarment });
  if (!r) return null;
  return {
    qty: r.qty,
    price: r.price,
    basePrice: r.basePrice,
    unitPrice: r.unitPrice,
    designPrice: r.designPrice,
    blankCostUnit: r.blankCostUnit,
    blankCostTotal: r.blankCostTotal,
    printFeeUnit: Math.max(0, r.catalogUnitPrice - r.blankCostUnit),
    printFeeTotal: r.printFeeTotal,
    byotActive: r.byotActive,
    byotDiscount: r.byotDiscount,
    byotEligible: r.byotEligible,
  };
}

export const sublimationImages = [
  img('/images/realisations/textile/Textile1.webp'),
  img('/images/realisations/textile/Textile2.webp'),
  img('/images/realisations/textile/Textile3.webp'),
  img('/images/realisations/textile/Textile4.webp'),
  img('/images/realisations/textile/Textile5.webp'),
  img('/images/realisations/textile/Textile6.webp'),
  img('/images/realisations/textile/Textile7.webp'),
  img('/images/realisations/textile/Textile9.webp'),
];

export const sublimationFaq = {
  fr: [
    { q: 'Qu\'est-ce que la sublimation?', a: 'La sublimation est un procédé d\'impression qui transfère l\'encre directement dans la fibre du tissu à haute température. Le résultat est une impression permanente qui ne craque pas, ne s\'efface pas et résiste au lavage.' },
    { q: 'Sur quels produits imprimez-vous?', a: 'T-shirts, long sleeves, hoodies, sacs bananes, mugs, thermos, tapis de souris, porte-clés, et bien plus. Les sacs bananes sont parfaits pour y mettre ton logo!' },
    { q: 'Puis-je fournir mon propre design?', a: 'Oui! Si vous avez un design prêt, le prix est celui affiché. Si vous avez besoin de création graphique, un supplément de 100-150$ s\'applique selon la complexité.' },
    { q: 'Quelle est la quantité minimale?', a: 'Nous acceptons les commandes à partir d\'une seule unité. Les prix sont dégressifs à partir de 5 et 10 unités.' },
    { q: 'L\'impression est-elle vraiment permanente?', a: 'Oui, la sublimation produit une impression permanente intégrée dans la fibre. Pas de texture en relief, pas de craquement après lavage. Les couleurs restent vibrantes.' },
    { q: 'Quel est le délai de production?', a: 'Le délai varie selon la quantité. Contactez-nous pour un estimé.' },
  ],
  en: [
    { q: 'What is sublimation?', a: 'Sublimation is a printing process that transfers ink directly into the fabric fiber at high temperature. The result is a permanent print that doesn\'t crack, doesn\'t fade, and is wash-resistant.' },
    { q: 'What products do you print on?', a: 'T-shirts, long sleeves, hoodies, fanny packs, mugs, tumblers, mousepads, keychains, and more. Fanny packs are perfect for putting your logo on!' },
    { q: 'Can I provide my own design?', a: 'Yes! If you have a ready design, the price shown applies. If you need graphic design, an additional $100-150 applies depending on complexity.' },
    { q: 'What is the minimum quantity?', a: 'We accept orders starting from a single unit. Prices decrease at 5 and 10 units.' },
    { q: 'Is the print really permanent?', a: 'Yes, sublimation produces a permanent print integrated into the fiber. No raised texture, no cracking after washing. Colors stay vibrant.' },
    { q: 'What is the production time?', a: 'Production time varies depending on quantity. Contact us for an estimate.' },
  ],
  es: [
    { q: '¿Qué es la sublimación?', a: 'La sublimación es un proceso de impresión que transfiere la tinta directamente en la fibra del tejido a alta temperatura. El resultado es una impresión permanente que no se agrieta, no se desvanece y resiste el lavado.' },
    { q: '¿En qué productos imprimen?', a: 'Camisetas, long sleeves, hoodies, riñoneras, tazas, termos, alfombrillas de ratón, llaveros y mucho más. ¡Las riñoneras son perfectas para poner tu logo!' },
    { q: '¿Puedo proporcionar mi propio diseño?', a: '¡Sí! Si tienes un diseño listo, el precio mostrado aplica. Si necesitas diseño gráfico, se aplica un suplemento de $100-150 según la complejidad.' },
    { q: '¿Cuál es la cantidad mínima?', a: 'Aceptamos pedidos desde una sola unidad. Los precios son decrecientes a partir de 5 y 10 unidades.' },
    { q: '¿La impresión es realmente permanente?', a: 'Sí, la sublimación produce una impresión permanente integrada en la fibra. Sin textura en relieve, sin agrietamiento después del lavado. Los colores se mantienen vibrantes.' },
    { q: '¿Cuál es el plazo de producción?', a: 'El plazo varía según la cantidad. Contáctanos para un estimado.' },
  ],
};

// =============================================
// FLYERS & CARTES
// =============================================

// Note: `multiplier` conserve pour l'affichage UI (badge "+30%") mais n'est PLUS
// utilise pour calculer le prix. Le prix Recto-Verso est hardcoded dans FLYER_GRID.
export const flyerSides = [
  { id: 'recto', labelFr: 'Recto', labelEn: 'Single-sided', labelEs: 'Una cara', multiplier: 1.0 },
  { id: 'recto-verso', labelFr: 'Recto-verso', labelEn: 'Double-sided', labelEs: 'Doble cara', multiplier: 1.3 },
];

// Derive depuis FLYER_GRID (pricingData.js). Prix Recto uniquement pour la liste des tiers.
export const flyerPriceTiers = Object.keys(FLYER_GRID)
  .map(Number)
  .sort((a, b) => a - b)
  .map(qty => ({
    qty,
    price: FLYER_GRID[qty].recto,
    unitPrice: Math.round((FLYER_GRID[qty].recto / qty) * 100) / 100,
  }));

export function getFlyerPrice(side, qtyIndex) {
  const tier = flyerPriceTiers[qtyIndex];
  if (!tier) return null;
  return lookupFlyerPrice(side, tier.qty);
}


export const flyerImages = [
  img('/images/realisations/flyers/discodyssee.webp'),
  img('/images/realisations/flyers/from_vision.webp'),
  img('/images/realisations/flyers/rituals.webp'),
  img('/images/realisations/prints/Prints24.webp'),
  img('/images/realisations/prints/FineArt4.webp'),
];

export const flyerFaq = {
  fr: [
    { q: 'Quels formats proposez-vous?', a: 'Flyers A6 (4x6"), A5, lettre (8.5x11"). Cartes postales et cartes d\'affaires. Formats personnalisés disponibles sur demande.' },
    { q: 'Quel papier utilisez-vous?', a: 'Papier premium 300g+ en finition matte ou lustrée. Qualité professionnelle supérieure à l\'impression en ligne standard.' },
    { q: 'Offrez-vous l\'impression recto-verso?', a: 'Oui! L\'option recto-verso est disponible avec un supplément de 30%. Parfait pour les cartes d\'affaires et flyers avec plus d\'informations.' },
    { q: 'Quel est le délai de production?', a: 'Le délai varie selon la quantité. Service express disponible sur demande.' },
    { q: 'Puis-je faire faire le design aussi?', a: 'Oui, notre service de design graphique est disponible en option. Contactez-nous pour un devis incluant la création graphique.' },
    { q: 'La livraison est-elle disponible?', a: 'Pick-up gratuit au Mile-End. Livraison locale disponible à Montréal. Idéal pour les événements du Plateau et Mile-End.' },
  ],
  en: [
    { q: 'What formats do you offer?', a: 'A6 (4x6"), A5, letter (8.5x11") flyers. Postcards and business cards. Custom formats available on request.' },
    { q: 'What paper do you use?', a: 'Premium 300g+ paper in matte or glossy finish. Professional quality superior to standard online printing.' },
    { q: 'Do you offer double-sided printing?', a: 'Yes! Double-sided option is available with a 30% surcharge. Perfect for business cards and flyers with more information.' },
    { q: 'What is the production time?', a: 'Production time varies depending on quantity. Express service available on request.' },
    { q: 'Can you design my flyers too?', a: 'Yes, our graphic design service is available as an option. Contact us for a quote including graphic creation.' },
    { q: 'Is delivery available?', a: 'Free pick-up in Mile-End. Local delivery available in Montreal. Ideal for Plateau and Mile-End events.' },
  ],
  es: [
    { q: '¿Qué formatos ofrecen?', a: 'Flyers A6 (4x6"), A5, carta (8.5x11"). Postales y tarjetas de presentación. Formatos personalizados disponibles bajo pedido.' },
    { q: '¿Qué papel utilizan?', a: 'Papel premium de 300g+ en acabado mate o brillante. Calidad profesional superior a la impresión en línea estándar.' },
    { q: '¿Ofrecen impresión a doble cara?', a: '¡Sí! La opción a doble cara está disponible con un suplemento del 30%. Perfecto para tarjetas de presentación y flyers con más información.' },
    { q: '¿Cuál es el plazo de producción?', a: 'El plazo varía según la cantidad. Servicio express disponible bajo pedido.' },
    { q: '¿Pueden hacer el diseño también?', a: 'Sí, nuestro servicio de diseño gráfico está disponible como opción. Contáctanos para un presupuesto que incluya la creación gráfica.' },
    { q: '¿Hay entrega disponible?', a: 'Recogida gratuita en Mile-End. Entrega local disponible en Montreal. Ideal para eventos del Plateau y Mile-End.' },
  ],
};

// =============================================
// DESIGN GRAPHIQUE (devis seulement)
// =============================================

export const designServices = [
  { id: 'logo', labelFr: 'Création logo', labelEn: 'Logo design', labelEs: 'Creación de logo', priceRange: '300$ - 600$', timelineFr: '5-10 jours', timelineEn: '5-10 days', timelineEs: '5-10 días' },
  { id: 'identity', labelFr: 'Identité visuelle complète', labelEn: 'Complete visual identity', labelEs: 'Identidad visual completa', priceRange: '800$ - 1 500$', timelineFr: '2-3 semaines', timelineEn: '2-3 weeks', timelineEs: '2-3 semanas' },
  { id: 'poster', labelFr: 'Affiche / flyer événement', labelEn: 'Event poster / flyer', labelEs: 'Afiche / flyer de evento', priceRange: '150$ - 300$', timelineFr: '3-5 jours', timelineEn: '3-5 days', timelineEs: '3-5 días' },
  { id: 'album', labelFr: 'Pochette album / single', labelEn: 'Album / single cover', labelEs: 'Portada de álbum / single', priceRange: '150$ - 350$', timelineFr: '5-7 jours', timelineEn: '5-7 days', timelineEs: '5-7 días' },
  { id: 'retouching', labelFr: 'Retouche photo (par image)', labelEn: 'Photo retouching (per image)', labelEs: 'Retoque fotográfico (por imagen)', priceRange: '15$ - 50$', timelineFr: 'Variable', timelineEn: 'Variable', timelineEs: 'Variable' },
];

export const designImages = [
  img('/images/graphism/logo_massive.webp'),
  img('/images/graphism/onomiko.webp'),
  img('/images/graphism/lumiere_noire.webp'),
  img('/images/graphism/sony_delite_logo.webp'),
  img('/images/graphism/massive_sticker.webp'),
  img('/images/graphism/maudite_machine_sticker.webp'),
  img('/images/graphism/vrstl_sticker.webp'),
  img('/images/graphism/creation_icone_logo.webp'),
  img('/images/graphism/creation_pdf.webp'),
];

export const designFaq = {
  fr: [
    { q: 'Qu\'est-ce qui est inclus dans une création de logo?', a: 'Recherche de références, exploration visuelle, création vectorielle sur Illustrator, 2 rondes de révisions, et livraison des fichiers finaux en AI, EPS, SVG, PNG et PDF.' },
    { q: 'Quels outils utilisez-vous?', a: 'Adobe Illustrator pour les logos et créations vectorielles, Figma pour le design d\'interfaces et prototypage, Photoshop pour la retouche et le compositing, InDesign pour la mise en page.' },
    { q: 'Combien de révisions sont incluses?', a: '2 rondes de révisions sont incluses dans tous nos forfaits. Des révisions supplémentaires peuvent être ajoutées au taux horaire.' },
    { q: 'Le design de stickers est-il inclus?', a: 'Oui! La création graphique de stickers est incluse dans le prix de production des stickers. Pas de frais supplémentaires.' },
    { q: 'Dans quels formats livrez-vous?', a: 'Package complet : fichiers vectoriels (AI, EPS, SVG), raster haute résolution (PNG, JPEG), PDF print-ready, versions web optimisées et formats réseaux sociaux.' },
    { q: 'Travaillez-vous avec des artistes musicaux?', a: 'Oui! Nous créons des pochettes d\'album, des affiches de concerts, des logos d\'artistes et des identités visuelles pour labels et promoteurs.' },
  ],
  en: [
    { q: 'What is included in a logo creation?', a: 'Reference research, visual exploration, vector creation on Illustrator, 2 rounds of revisions, and delivery of final files in AI, EPS, SVG, PNG and PDF.' },
    { q: 'What tools do you use?', a: 'Adobe Illustrator for logos and vector creations, Figma for interface design and prototyping, Photoshop for retouching and compositing, InDesign for layout.' },
    { q: 'How many revisions are included?', a: '2 rounds of revisions are included in all our packages. Additional revisions can be added at the hourly rate.' },
    { q: 'Is sticker design included?', a: 'Yes! Sticker graphic design is included in the sticker production price. No additional fees.' },
    { q: 'What formats do you deliver in?', a: 'Complete package: vector files (AI, EPS, SVG), high-resolution raster (PNG, JPEG), print-ready PDF, web-optimized versions and social media formats.' },
    { q: 'Do you work with music artists?', a: 'Yes! We create album covers, concert posters, artist logos and visual identities for labels and promoters.' },
  ],
  es: [
    { q: '¿Qué incluye la creación de un logo?', a: 'Investigación de referencias, exploración visual, creación vectorial en Illustrator, 2 rondas de revisiones y entrega de archivos finales en AI, EPS, SVG, PNG y PDF.' },
    { q: '¿Qué herramientas utilizan?', a: 'Adobe Illustrator para logos y creaciones vectoriales, Figma para diseño de interfaces y prototipado, Photoshop para retoque y composición, InDesign para maquetación.' },
    { q: '¿Cuántas revisiones están incluidas?', a: '2 rondas de revisiones están incluidas en todos nuestros paquetes. Se pueden agregar revisiones adicionales a la tarifa por hora.' },
    { q: '¿El diseño de stickers está incluido?', a: '¡Sí! El diseño gráfico de stickers está incluido en el precio de producción de los stickers. Sin cargos adicionales.' },
    { q: '¿En qué formatos entregan?', a: 'Paquete completo: archivos vectoriales (AI, EPS, SVG), raster de alta resolución (PNG, JPEG), PDF listo para imprimir, versiones optimizadas para web y formatos para redes sociales.' },
    { q: '¿Trabajan con artistas musicales?', a: '¡Sí! Creamos portadas de álbum, carteles de conciertos, logos de artistas e identidades visuales para sellos y promotores.' },
  ],
};

// =============================================
// DÉVELOPPEMENT WEB (devis seulement)
// =============================================

export const webServices = [
  { id: 'landing', category: 'site', labelFr: 'Landing page', labelEn: 'Event landing page', labelEs: 'Landing page de evento', price: '900$' },
  { id: 'showcase', category: 'site', labelFr: 'Site vitrine (5-10 pages)', labelEn: 'Showcase site (5-10 pages)', labelEs: 'Sitio vitrina (5-10 paginas)', price: '1 000$ - 1 500$' },
  { id: 'ecommerce', category: 'site', labelFr: 'Site e-commerce', labelEn: 'E-commerce site', labelEs: 'Sitio e-commerce', price: '1 500$ - 2 500$' },
  { id: 'redesign', category: 'site', labelFr: 'Refonte site existant', labelEn: 'Existing site redesign', labelEs: 'Rediseno de sitio existente', price: { fr: 'Sur soumission', en: 'On quote', es: 'Bajo presupuesto' } },
  { id: 'webdesign-landing', category: 'webdesign', labelFr: 'Landing page (Figma)', labelEn: 'Landing page (Figma)', labelEs: 'Landing page (Figma)', price: '450$' },
  { id: 'webdesign-showcase', category: 'webdesign', labelFr: 'Site vitrine (5-10 pages)', labelEn: 'Showcase site (5-10 pages)', labelEs: 'Sitio vitrina (5-10 paginas)', price: '900$' },
  { id: 'webdesign-ecommerce', category: 'webdesign', labelFr: 'E-commerce / multi-pages (10+)', labelEn: 'E-commerce / multi-page (10+)', labelEs: 'E-commerce / multi-paginas (10+)', price: '1 500$ - 2 000$' },
  { id: 'maintenance', category: 'site', labelFr: 'Maintenance mensuelle', labelEn: 'Monthly maintenance', labelEs: 'Mantenimiento mensual', price: '100$ - 200$/mois' },
];

export const webHourlyRate = '85$/h';

export const webImages = [
  img('/images/web/sonaa.webp'),
  img('/images/web/recrutementspvm.webp'),
  img('/images/web/mauditemachine.webp'),
  img('/images/web/spvm.webp'),
  img('/images/web/sarahlatulippe.webp'),
  img('/images/web/lapresse.webp'),
  img('/images/web/qrgenerator.webp'),
  img('/images/web/boutiquemaude.webp'),
];

export const webFaq = {
  fr: [
    { q: 'Quelles technologies utilisez-vous?', a: 'React/Next.js, Angular, Node.js, WordPress, Shopify, Strapi. On choisit la technologie la mieux adaptée à votre projet et vos besoins.' },
    { q: 'Le site sera-t-il responsive?', a: 'Oui, tous nos sites sont mobile-first et s\'adaptent parfaitement à tous les écrans : mobile, tablette et desktop.' },
    { q: 'Le SEO est-il inclus?', a: 'Oui, l\'optimisation SEO technique est incluse : méta-tags, sitemap, schema markup, performance, Google Analytics et Search Console.' },
    { q: 'Combien de temps prend un projet?', a: 'Une landing page prend environ 2 semaines. Un site vitrine 4-6 semaines. Un e-commerce 6-10 semaines. Chaque projet est unique.' },
    { q: 'Offrez-vous la maintenance?', a: 'Oui, nous offrons des forfaits de maintenance mensuelle (100-200$/mois) incluant mises à jour, sauvegardes, monitoring et support.' },
    { q: 'Puis-je voir des exemples de vos réalisations?', a: 'Oui! Notre portfolio inclut des projets comme la Ville de Montréal, La Presse, Maudite Machine, et plusieurs sites pour artistes et commerces locaux.' },
  ],
  en: [
    { q: 'What technologies do you use?', a: 'React/Next.js, Angular, Node.js, WordPress, Shopify, Strapi. We choose the technology best suited to your project and needs.' },
    { q: 'Will the site be responsive?', a: 'Yes, all our sites are mobile-first and adapt perfectly to all screens: mobile, tablet and desktop.' },
    { q: 'Is SEO included?', a: 'Yes, technical SEO optimization is included: meta tags, sitemap, schema markup, performance, Google Analytics and Search Console.' },
    { q: 'How long does a project take?', a: 'A landing page takes about 2 weeks. A showcase site 4-6 weeks. An e-commerce 6-10 weeks. Each project is unique.' },
    { q: 'Do you offer maintenance?', a: 'Yes, we offer monthly maintenance packages ($100-200/mo) including updates, backups, monitoring and support.' },
    { q: 'Can I see examples of your work?', a: 'Yes! Our portfolio includes projects like the City of Montreal, La Presse, Maudite Machine, and several sites for artists and local businesses.' },
  ],
  es: [
    { q: '¿Qué tecnologías utilizan?', a: 'React/Next.js, Angular, Node.js, WordPress, Shopify, Strapi. Elegimos la tecnología mejor adaptada a tu proyecto y tus necesidades.' },
    { q: '¿El sitio será responsive?', a: 'Sí, todos nuestros sitios son mobile-first y se adaptan perfectamente a todas las pantallas: móvil, tableta y escritorio.' },
    { q: '¿El SEO está incluido?', a: 'Sí, la optimización SEO técnica está incluida: meta tags, sitemap, schema markup, rendimiento, Google Analytics y Search Console.' },
    { q: '¿Cuánto tiempo toma un proyecto?', a: 'Una landing page toma aproximadamente 2 semanas. Un sitio vitrina 4-6 semanas. Un e-commerce 6-10 semanas. Cada proyecto es único.' },
    { q: '¿Ofrecen mantenimiento?', a: 'Sí, ofrecemos paquetes de mantenimiento mensual ($100-200/mes) que incluyen actualizaciones, respaldos, monitoreo y soporte.' },
    { q: '¿Puedo ver ejemplos de sus trabajos?', a: '¡Sí! Nuestro portafolio incluye proyectos como la Ciudad de Montreal, La Presse, Maudite Machine, y varios sitios para artistas y comercios locales.' },
  ],
};
