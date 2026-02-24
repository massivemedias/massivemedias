import { img } from '../utils/paths';

export const stickerFinishes = [
  { id: 'matte', labelFr: 'Vinyle Matte', labelEn: 'Matte Vinyl' },
  { id: 'glossy', labelFr: 'Vinyle Glossy', labelEn: 'Glossy Vinyl' },
  { id: 'transparent', labelFr: 'Vinyle Transparent', labelEn: 'Clear Vinyl' },
  { id: 'holographic', labelFr: 'Holographique', labelEn: 'Holographic' },
];

export const stickerShapes = [
  { id: 'round', labelFr: 'Rond', labelEn: 'Round' },
  { id: 'square', labelFr: 'Carré', labelEn: 'Square' },
  { id: 'rectangle', labelFr: 'Rectangle', labelEn: 'Rectangle' },
  { id: 'diecut', labelFr: 'Die-cut (custom)', labelEn: 'Die-cut (custom)' },
];

export const stickerSizes = [
  { id: '2in', label: '2"' },
  { id: '2.5in', label: '2.5"' },
  { id: '3in', label: '3"' },
  { id: '4in', label: '4"' },
];

// Prix Standard (Mat/Brillant). Laminé Pro et Holographique ont leurs propres prix.
export const stickerPriceTiers = [
  { qty: 25, price: 30, unitPrice: 1.20 },
  { qty: 50, price: 45, unitPrice: 0.90 },
  { qty: 100, price: 75, unitPrice: 0.75 },
  { qty: 250, price: 150, unitPrice: 0.60 },
  { qty: 500, price: 250, unitPrice: 0.50 },
];

export const laminatedPriceTiers = [
  { qty: 25, price: 35, unitPrice: 1.40 },
  { qty: 50, price: 55, unitPrice: 1.10 },
  { qty: 100, price: 95, unitPrice: 0.95 },
  { qty: 250, price: 190, unitPrice: 0.76 },
  { qty: 500, price: 325, unitPrice: 0.65 },
];

export const holographicPriceTiers = [
  { qty: 25, price: 42, unitPrice: 1.68 },
  { qty: 50, price: 65, unitPrice: 1.30 },
  { qty: 100, price: 110, unitPrice: 1.10 },
  { qty: 250, price: 220, unitPrice: 0.88 },
  { qty: 500, price: 380, unitPrice: 0.76 },
];

// Die-cut utilise les mêmes prix (Cameo 5 = coût minimal)
export const diecutPriceTiers = stickerPriceTiers;

export function getStickerPrice(finish, shape, qty) {
  let tiers;
  if (finish === 'holographic') {
    tiers = holographicPriceTiers;
  } else {
    // matte, glossy, transparent = Standard pricing
    tiers = stickerPriceTiers;
  }
  const tier = tiers.find(t => t.qty === qty);
  if (!tier) return null;
  return {
    qty: tier.qty,
    price: tier.price,
    unitPrice: tier.unitPrice,
  };
}

export const stickerImages = [
  img('/images/stickers/Stickers-Cosmo.webp'),
  img('/images/stickers/Stickers-Cosmovision.webp'),
  img('/images/stickers/Stickers-Fusion-State-Rec.webp'),
  img('/images/stickers/Stickers-Maudite-Machine.webp'),
  img('/images/stickers/Stickers-Vrstl.webp'),
  img('/images/stickers/Stickers-massive.webp'),
];

export const stickerHighlights = {
  fr: [
    'Découpe de précision professionnelle',
    'Vinyle matte, glossy, transparent, holographique',
    'Découpe contour à la forme exacte du design',
    'Lamination incluse - résistant eau, UV, rayures',
    'Design graphique inclus dans le prix',
    'Livraison locale disponible',
    'Délai rapide : 24-72h',
  ],
  en: [
    'Professional precision cutting',
    'Matte, glossy, clear, holographic vinyl',
    'Contour cut to exact design shape',
    'Lamination included - water, UV, scratch resistant',
    'Graphic design included in price',
    'Local delivery available',
    'Fast turnaround: 24-72h',
  ],
};

export const stickerFaq = {
  fr: [
    { q: 'Quels fichiers dois-je fournir?', a: 'Idéalement un fichier vectoriel (AI, SVG, PDF) ou un PNG haute résolution (300 DPI minimum) avec fond transparent. Si vous n\'avez pas de fichier prêt, notre service de design graphique est inclus dans le prix.' },
    { q: 'Quel est le délai de production?', a: 'Production en 24 à 72 heures selon la complexité et la quantité. Nous vous confirmerons le délai exact lors de la validation de votre commande.' },
    { q: 'Peut-on commander une forme totalement custom?', a: 'Oui! L\'option die-cut permet de découper vos stickers selon n\'importe quelle forme. Le contour suit exactement votre design.' },
    { q: 'Quelle est la qualité du vinyle?', a: 'Nous utilisons du vinyle professionnel avec lamination intégrée. Résistant à l\'eau, aux UV et aux rayures. Durée de vie extérieure de 3-5 ans.' },
    { q: 'La livraison est-elle disponible?', a: 'Livraison locale gratuite à Montréal (Mile-End et environs). Envoi postal disponible partout au Canada.' },
    { q: 'Le design est vraiment inclus?', a: 'Oui, la création ou l\'adaptation graphique de votre sticker est incluse dans tous nos prix. On s\'assure que votre design est optimisé pour l\'impression.' },
  ],
  en: [
    { q: 'What files should I provide?', a: 'Ideally a vector file (AI, SVG, PDF) or high-resolution PNG (300 DPI minimum) with transparent background. If you don\'t have a ready file, our graphic design service is included in the price.' },
    { q: 'What is the production time?', a: 'Production in 24 to 72 hours depending on complexity and quantity. We\'ll confirm the exact timeline when validating your order.' },
    { q: 'Can I order a completely custom shape?', a: 'Yes! The die-cut option lets us cut your stickers in any shape. The contour follows your design exactly.' },
    { q: 'What is the vinyl quality?', a: 'We use professional-grade vinyl with integrated lamination. Water, UV, and scratch resistant. Outdoor lifespan of 3-5 years.' },
    { q: 'Is delivery available?', a: 'Free local delivery in Montreal (Mile-End area). Postal shipping available across Canada.' },
    { q: 'Is design really included?', a: 'Yes, graphic creation or adaptation of your sticker is included in all our prices. We make sure your design is optimized for printing.' },
  ],
};

// =============================================
// FINE ART
// =============================================

export const fineArtPrinterTiers = [
  { id: 'studio', labelFr: 'Série Studio', labelEn: 'Studio Series', desc: 'Epson ET-15000' },
  { id: 'museum', labelFr: 'Série Musée', labelEn: 'Museum Series', desc: 'Canon PRO-1000 / PRO-2600' },
];

export const fineArtFormats = [
  { id: 'a4', label: 'A4 (8.5×11")', studioPrice: 16, museumPrice: 35 },
  { id: 'a3', label: 'A3 (11×17")', studioPrice: 22, museumPrice: 65 },
  { id: 'a3plus', label: 'A3+ (13×19")', studioPrice: 30, museumPrice: 95 },
  { id: 'a2', label: 'A2 (18×24")', studioPrice: 42, museumPrice: 125 },
];

export const fineArtFramePrice = 30;

export function getFineArtPrice(tier, format, withFrame) {
  const fmt = fineArtFormats.find(f => f.id === format);
  if (!fmt) return null;
  const base = tier === 'museum' ? fmt.museumPrice : fmt.studioPrice;
  return { price: base + (withFrame ? fineArtFramePrice : 0), basePrice: base, framePrice: withFrame ? fineArtFramePrice : 0 };
}

export const fineArtImages = [
  img('/images/prints/FineArt1.webp'),
  img('/images/prints/FineArt4.webp'),
  img('/images/prints/FineArt6.webp'),
  img('/images/prints/FineArt-Photo.webp'),
  img('/images/prints/Prints7.webp'),
  img('/images/prints/Prints17.webp'),
  img('/images/prints/Prints18.webp'),
  img('/images/prints/Prints22.webp'),
  img('/images/prints/Prints24.webp'),
];

export const fineArtFaq = {
  fr: [
    { q: 'Quelle est la différence entre Série Studio et Série Musée?', a: 'La Série Studio (Epson ET-15000) offre une excellente qualité pour tous les usages, idéale pour les images avec bonne luminosité. La Série Musée (Canon PRO-1000/PRO-2600) utilise 12 encres pigmentées pour une qualité supérieure, parfaite pour la photographie et les tirages galerie.' },
    { q: 'Quels papiers utilisez-vous?', a: 'Nous utilisons des papiers fine art professionnels premium : coton, alpha-cellulose, papiers d\'archives. Chaque papier est calibré avec un profil ICC sur mesure pour des couleurs fidèles.' },
    { q: 'Quelle est la durée de conservation?', a: 'Nos tirages fine art ont une durée de conservation de 100+ ans grâce aux encres pigmentées et papiers d\'archives. C\'est le standard des galeries et musées.' },
    { q: 'Puis-je faire encadrer mon tirage?', a: 'Oui! Nous offrons l\'option cadre noir ou blanc pour 30$ supplémentaires. Vous pouvez l\'ajouter directement dans le configurateur.' },
    { q: 'Quel fichier dois-je fournir?', a: 'Idéalement un fichier haute résolution (300 DPI minimum). Nous effectuons un soft proofing (prévisualisation numérique) avant impression pour valider les couleurs avec vous.' },
    { q: 'La livraison est-elle disponible?', a: 'Pick-up gratuit au Mile-End. Livraison locale disponible à Montréal. Envoi postal avec emballage protection pour le reste du Canada.' },
  ],
  en: [
    { q: 'What is the difference between Studio and Museum Series?', a: 'The Studio Series (Epson ET-15000) offers excellent quality for all uses, ideal for images with good brightness. The Museum Series (Canon PRO-1000/PRO-2600) uses 12 pigmented inks for superior quality, perfect for photography and gallery prints.' },
    { q: 'What papers do you use?', a: 'We use premium professional fine art papers: cotton, alpha-cellulose, archival papers. Each paper is calibrated with a custom ICC profile for accurate colors.' },
    { q: 'What is the conservation lifespan?', a: 'Our fine art prints have a 100+ year conservation life thanks to pigmented inks and archival papers. This is the gallery and museum standard.' },
    { q: 'Can I get my print framed?', a: 'Yes! We offer a black or white frame option for an additional $30. You can add it directly in the configurator.' },
    { q: 'What file should I provide?', a: 'Ideally a high-resolution file (300 DPI minimum). We perform soft proofing (digital preview) before printing to validate colors with you.' },
    { q: 'Is delivery available?', a: 'Free pick-up in Mile-End. Local delivery available in Montreal. Postal shipping with protective packaging for the rest of Canada.' },
  ],
};

// =============================================
// SUBLIMATION & MERCH
// =============================================

export const sublimationProducts = [
  { id: 'tshirt', labelFr: 'T-shirt', labelEn: 'T-shirt' },
  { id: 'hoodie', labelFr: 'Hoodie', labelEn: 'Hoodie' },
];

export const sublimationPriceTiers = {
  tshirt: [
    { qty: 1, unitPrice: 30, price: 30 },
    { qty: 5, unitPrice: 25, price: 125 },
    { qty: 10, unitPrice: 22, price: 220 },
  ],
  hoodie: [
    { qty: 1, unitPrice: 50, price: 50 },
    { qty: 5, unitPrice: 45, price: 225 },
    { qty: 10, unitPrice: 40, price: 400 },
  ],
};

export const sublimationDesignPrice = 125;

export function getSublimationPrice(product, qtyIndex, withDesign) {
  const tiers = sublimationPriceTiers[product];
  if (!tiers || !tiers[qtyIndex]) return null;
  const tier = tiers[qtyIndex];
  return {
    qty: tier.qty,
    price: tier.price + (withDesign ? sublimationDesignPrice : 0),
    basePrice: tier.price,
    unitPrice: tier.unitPrice,
    designPrice: withDesign ? sublimationDesignPrice : 0,
  };
}

export const sublimationImages = [
  img('/images/textile/Textile1.webp'),
  img('/images/textile/Textile2.webp'),
  img('/images/textile/Textile3.webp'),
  img('/images/textile/Textile4.webp'),
  img('/images/textile/Textile5.webp'),
  img('/images/textile/Textile6.webp'),
  img('/images/textile/Textile7.webp'),
  img('/images/textile/Textile9.webp'),
];

export const sublimationFaq = {
  fr: [
    { q: 'Qu\'est-ce que la sublimation?', a: 'La sublimation est un procédé d\'impression qui transfère l\'encre directement dans la fibre du tissu à haute température. Le résultat est une impression permanente qui ne craque pas, ne s\'efface pas et résiste au lavage.' },
    { q: 'Sur quels produits imprimez-vous?', a: 'T-shirts, hoodies, mugs, thermos, tapis de souris, porte-clés, et bien plus. Contactez-nous pour des produits spécifiques.' },
    { q: 'Puis-je fournir mon propre design?', a: 'Oui! Si vous avez un design prêt, le prix est celui affiché. Si vous avez besoin de création graphique, un supplément de 100-150$ s\'applique selon la complexité.' },
    { q: 'Quelle est la quantité minimale?', a: 'Nous acceptons les commandes à partir d\'une seule unité. Les prix sont dégressifs à partir de 5 et 10 unités.' },
    { q: 'L\'impression est-elle vraiment permanente?', a: 'Oui, la sublimation produit une impression permanente intégrée dans la fibre. Pas de texture en relief, pas de craquement après lavage. Les couleurs restent vibrantes.' },
    { q: 'Quel est le délai de production?', a: 'Généralement 3 à 5 jours ouvrables selon la quantité. Délai express disponible sur demande.' },
  ],
  en: [
    { q: 'What is sublimation?', a: 'Sublimation is a printing process that transfers ink directly into the fabric fiber at high temperature. The result is a permanent print that doesn\'t crack, doesn\'t fade, and is wash-resistant.' },
    { q: 'What products do you print on?', a: 'T-shirts, hoodies, mugs, tumblers, mousepads, keychains, and more. Contact us for specific products.' },
    { q: 'Can I provide my own design?', a: 'Yes! If you have a ready design, the price shown applies. If you need graphic design, an additional $100-150 applies depending on complexity.' },
    { q: 'What is the minimum quantity?', a: 'We accept orders starting from a single unit. Prices decrease at 5 and 10 units.' },
    { q: 'Is the print really permanent?', a: 'Yes, sublimation produces a permanent print integrated into the fiber. No raised texture, no cracking after washing. Colors stay vibrant.' },
    { q: 'What is the production time?', a: 'Generally 3 to 5 business days depending on quantity. Express turnaround available on request.' },
  ],
};

// =============================================
// FLYERS & CARTES
// =============================================

export const flyerSides = [
  { id: 'recto', labelFr: 'Recto', labelEn: 'Single-sided', multiplier: 1.0 },
  { id: 'recto-verso', labelFr: 'Recto-verso', labelEn: 'Double-sided', multiplier: 1.3 },
];

export const flyerPriceTiers = [
  { qty: 50, price: 40, unitPrice: 0.80 },
  { qty: 100, price: 65, unitPrice: 0.65 },
  { qty: 150, price: 90, unitPrice: 0.60 },
  { qty: 250, price: 130, unitPrice: 0.52 },
  { qty: 500, price: 225, unitPrice: 0.45 },
];

export function getFlyerPrice(side, qtyIndex) {
  const tier = flyerPriceTiers[qtyIndex];
  if (!tier) return null;
  const sideOpt = flyerSides.find(s => s.id === side);
  const multiplier = sideOpt ? sideOpt.multiplier : 1.0;
  return {
    qty: tier.qty,
    price: Math.round(tier.price * multiplier),
    unitPrice: +(tier.unitPrice * multiplier).toFixed(2),
  };
}

export const flyerImages = [
  img('/images/flyers/discodyssee.webp'),
  img('/images/flyers/from_vision.webp'),
  img('/images/flyers/rituals.webp'),
  img('/images/prints/Prints24.webp'),
  img('/images/prints/FineArt-Photo.webp'),
];

export const flyerFaq = {
  fr: [
    { q: 'Quels formats proposez-vous?', a: 'Flyers A6 (4"×6"), A5, lettre (8,5×11"). Cartes postales et cartes d\'affaires. Formats personnalisés disponibles sur demande.' },
    { q: 'Quel papier utilisez-vous?', a: 'Papier premium 300g+ en finition matte ou brillante. Qualité professionnelle supérieure à l\'impression en ligne standard.' },
    { q: 'Offrez-vous l\'impression recto-verso?', a: 'Oui! L\'option recto-verso est disponible avec un supplément de 30%. Parfait pour les cartes d\'affaires et flyers avec plus d\'informations.' },
    { q: 'Quel est le délai de production?', a: 'Délai standard de 24 à 48 heures. Service express disponible le jour même pour les urgences.' },
    { q: 'Puis-je faire faire le design aussi?', a: 'Oui, notre service de design graphique est disponible en option. Contactez-nous pour un devis incluant la création graphique.' },
    { q: 'La livraison est-elle disponible?', a: 'Pick-up gratuit au Mile-End. Livraison locale disponible à Montréal. Idéal pour les événements du Plateau et Mile-End.' },
  ],
  en: [
    { q: 'What formats do you offer?', a: 'A6 (4"×6"), A5, letter (8.5×11") flyers. Postcards and business cards. Custom formats available on request.' },
    { q: 'What paper do you use?', a: 'Premium 300g+ paper in matte or glossy finish. Professional quality superior to standard online printing.' },
    { q: 'Do you offer double-sided printing?', a: 'Yes! Double-sided option is available with a 30% surcharge. Perfect for business cards and flyers with more information.' },
    { q: 'What is the production time?', a: 'Standard turnaround of 24 to 48 hours. Same-day express service available for urgent needs.' },
    { q: 'Can you design my flyers too?', a: 'Yes, our graphic design service is available as an option. Contact us for a quote including graphic creation.' },
    { q: 'Is delivery available?', a: 'Free pick-up in Mile-End. Local delivery available in Montreal. Ideal for Plateau and Mile-End events.' },
  ],
};

// =============================================
// DESIGN GRAPHIQUE (devis seulement)
// =============================================

export const designServices = [
  { id: 'logo', labelFr: 'Création logo', labelEn: 'Logo design', priceRange: '300$ - 600$', timelineFr: '5-10 jours', timelineEn: '5-10 days' },
  { id: 'identity', labelFr: 'Identité visuelle complète', labelEn: 'Complete visual identity', priceRange: '800$ - 1 500$', timelineFr: '2-3 semaines', timelineEn: '2-3 weeks' },
  { id: 'poster', labelFr: 'Affiche / flyer événement', labelEn: 'Event poster / flyer', priceRange: '150$ - 300$', timelineFr: '3-5 jours', timelineEn: '3-5 days' },
  { id: 'album', labelFr: 'Pochette album / single', labelEn: 'Album / single cover', priceRange: '200$ - 400$', timelineFr: '5-7 jours', timelineEn: '5-7 days' },
  { id: 'icons', labelFr: 'Design d\'icônes (set)', labelEn: 'Icon set design', priceRange: '200$ - 500$', timelineFr: '3-7 jours', timelineEn: '3-7 days' },
  { id: 'retouching', labelFr: 'Retouche photo (par image)', labelEn: 'Photo retouching (per image)', priceRange: '15$ - 50$', timelineFr: '24-48h', timelineEn: '24-48h' },
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
};

// =============================================
// DÉVELOPPEMENT WEB (devis seulement)
// =============================================

export const webServices = [
  { id: 'landing', labelFr: 'Landing page événement', labelEn: 'Event landing page', price: '900$' },
  { id: 'showcase', labelFr: 'Site vitrine (5-10 pages)', labelEn: 'Showcase site (5-10 pages)', price: '2 000$ - 3 500$' },
  { id: 'ecommerce', labelFr: 'Site e-commerce', labelEn: 'E-commerce site', price: '4 000$ - 6 000$' },
  { id: 'redesign', labelFr: 'Refonte site existant', labelEn: 'Existing site redesign', price: { fr: 'Sur soumission', en: 'On quote' } },
  { id: 'maintenance', labelFr: 'Maintenance mensuelle', labelEn: 'Monthly maintenance', price: '100$ - 200$/mois' },
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
    { q: 'Puis-je voir des exemples de vos réalisations?', a: 'Oui! Notre portfolio inclut des projets comme le SPVM, La Presse, Maudite Machine, et plusieurs sites pour artistes et commerces locaux.' },
  ],
  en: [
    { q: 'What technologies do you use?', a: 'React/Next.js, Angular, Node.js, WordPress, Shopify, Strapi. We choose the technology best suited to your project and needs.' },
    { q: 'Will the site be responsive?', a: 'Yes, all our sites are mobile-first and adapt perfectly to all screens: mobile, tablet and desktop.' },
    { q: 'Is SEO included?', a: 'Yes, technical SEO optimization is included: meta tags, sitemap, schema markup, performance, Google Analytics and Search Console.' },
    { q: 'How long does a project take?', a: 'A landing page takes about 2 weeks. A showcase site 4-6 weeks. An e-commerce 6-10 weeks. Each project is unique.' },
    { q: 'Do you offer maintenance?', a: 'Yes, we offer monthly maintenance packages ($100-200/mo) including updates, backups, monitoring and support.' },
    { q: 'Can I see examples of your work?', a: 'Yes! Our portfolio includes projects like SPVM, La Presse, Maudite Machine, and several sites for artists and local businesses.' },
  ],
};
