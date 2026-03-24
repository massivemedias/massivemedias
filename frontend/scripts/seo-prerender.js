/**
 * SEO Pre-renderer
 * Genere un index.html par route avec les bonnes meta tags
 * Execute apres le build Vite: node scripts/seo-prerender.js
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const BASE_URL = 'https://massivemedias.com';

// Meta par route
const ROUTES = {
  '/': {
    title: 'Massive Medias | Impression Fine Art, Stickers & Design - Montreal',
    description: 'Studio de production creative a Montreal. Impression fine art, stickers die-cut, sublimation textile, design graphique. Mile-End.',
  },
  '/artistes': {
    title: 'Artistes | Massive Medias - Photographes, Peintres & Tatoueurs',
    description: 'Decouvrez nos artistes partenaires. Photographes, peintres, artistes visuels et tatoueurs. Prints et oeuvres disponibles.',
  },
  '/tatoueurs': {
    title: 'Tatoueurs | Massive Medias - Flashs & Reservations Montreal',
    description: 'Reservez un flash de tatouage unique aupres de nos tatoueurs partenaires a Montreal. Fineline, botanique, blackwork.',
  },
  '/tatoueurs/ginko-ink': {
    title: 'Ginko Ink | Tatoueuse Fineline Montreal - Flashs Disponibles',
    description: 'Myriam Rivest, tatoueuse fineline a Montreal. Flashs botaniques, creatures feeriques et personnages. Reservez votre piece unique.',
    ogImage: `${BASE_URL}/images/tatoueurs/ginko-ink/hero.webp`,
  },
  '/boutique': {
    title: 'Boutique | Massive Medias - Prints, Stickers & Merch',
    description: 'Prints fine art, stickers die-cut, t-shirts et hoodies. Impression professionnelle, materiaux premium. Livraison rapide.',
  },
  '/services/prints': {
    title: 'Impression Fine Art | Massive Medias - Tirages Premium Montreal',
    description: 'Impression fine art professionnelle. Papier Hahnemuhle, encres pigmentees 12 couleurs. Formats A6 a A2. Livraison 24-48h.',
  },
  '/services/stickers': {
    title: 'Stickers Die-Cut | Massive Medias - Autocollants Premium',
    description: 'Stickers die-cut impermeables avec finitions premium. Holographique, etoiles, glossy, matte. Stickers personnalises.',
  },
  '/services/merch': {
    title: 'Merch & Textile | Massive Medias - T-shirts, Hoodies & Plus',
    description: 'Sublimation textile professionnelle. T-shirts, hoodies, crewnecks, tote bags. Impression all-over ou placement.',
  },
  '/services/design': {
    title: 'Design Graphique | Massive Medias - Logos, Flyers & Pochettes',
    description: 'Design graphique professionnel. Logos, flyers evenementiels, pochettes d\'album, identite visuelle. Montreal.',
  },
  '/services/web': {
    title: 'Developpement Web | Massive Medias - Sites & Applications',
    description: 'Developpement web professionnel. Sites vitrines, e-commerce, applications React. SEO, performance et design moderne.',
  },
  '/a-propos': {
    title: 'A propos | Massive Medias - Studio Creatif Montreal Mile-End',
    description: 'Massive Medias est un studio de production creative base au Mile-End a Montreal. Notre mission: rendre la creation accessible.',
  },
  '/contact': {
    title: 'Contact | Massive Medias - Demandez un Devis',
    description: 'Contactez Massive Medias pour vos projets d\'impression, design ou web. Studio au Mile-End, Montreal. Reponse rapide.',
  },
  // Artistes individuels
  '/artistes/adrift': {
    title: 'Adrift | Massive Medias - Art Numerique & Prints',
    description: 'Adrift explore les frontieres entre le reel et le virtuel. Prints fine art disponibles en plusieurs formats.',
  },
  '/artistes/maudite-machine': {
    title: 'Maudite Machine | Massive Medias - Musique & Art Visuel',
    description: 'Collectif audiovisuel montrealais fusionnant musique electronique et art visuel. Affiches et prints disponibles.',
  },
  '/artistes/psyqu33n': {
    title: 'Psyqu33n | Massive Medias - Art Visionnaire',
    description: 'Art visionnaire explorant l\'ombre et la lumiere. Peinture, body painting et art numerique. Prints fine art disponibles.',
  },
  '/artistes/mok': {
    title: 'Mok | Massive Medias - Photographie Urbaine Montreal',
    description: 'Photographe montrealais avec un oeil unique pour la composition et la lumiere. Tirages fine art disponibles.',
  },
  '/artistes/quentin-delobel': {
    title: 'Quentin Delobel | Massive Medias - Photographie',
    description: 'Photographe francais base a Montreal. Lumiere naturelle et contrastes dans ses portraits. Tirages disponibles.',
  },
  '/artistes/no-pixl': {
    title: 'No Pixl | Massive Medias - Photographie Evenementielle',
    description: 'Photographe evenementiel et paysagiste. Festivals et paysages canadiens. Tirages fine art disponibles.',
  },
  '/artistes/cornelia-rose': {
    title: 'Cornelia Rose | Massive Medias - Art Visionnaire',
    description: 'Artiste visionnaire specialisee en body painting et art numerique. Univers colores et psychedeliques.',
  },
};

// Lire le template index.html genere par Vite
const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

let count = 0;

for (const [route, meta] of Object.entries(ROUTES)) {
  if (route === '/') continue; // La homepage est deja le index.html principal

  const ogImage = meta.ogImage || `${BASE_URL}/og-image.jpg`;
  const canonicalUrl = `${BASE_URL}${route}`;

  // Remplacer les meta tags
  let html = template;

  // Title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${meta.title}</title>`
  );

  // Meta description
  html = html.replace(
    /name="description" content="[^"]*"/,
    `name="description" content="${meta.description}"`
  );

  // OG tags
  html = html.replace(
    /property="og:title" content="[^"]*"/,
    `property="og:title" content="${meta.title}"`
  );
  html = html.replace(
    /property="og:description" content="[^"]*"/,
    `property="og:description" content="${meta.description}"`
  );
  html = html.replace(
    /property="og:url" content="[^"]*"/,
    `property="og:url" content="${canonicalUrl}"`
  );
  html = html.replace(
    /property="og:image" content="[^"]*"/,
    `property="og:image" content="${ogImage}"`
  );

  // Twitter Card
  html = html.replace(
    /name="twitter:title" content="[^"]*"/,
    `name="twitter:title" content="${meta.title}"`
  );
  html = html.replace(
    /name="twitter:description" content="[^"]*"/,
    `name="twitter:description" content="${meta.description}"`
  );

  // Ajouter canonical (avant </head>)
  if (!html.includes('rel="canonical"')) {
    html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n  </head>`);
  }

  // Creer le dossier et ecrire le fichier
  const dir = join(DIST, route);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  count++;
}

// Mettre a jour aussi le 404.html
const notFoundHtml = template.replace(
  /<title>[^<]*<\/title>/,
  '<title>Page introuvable | Massive Medias</title>'
).replace(
  /name="description" content="[^"]*"/,
  'name="description" content="Cette page n\'existe pas. Retournez a l\'accueil de Massive Medias."'
);
writeFileSync(join(DIST, '404.html'), notFoundHtml);

console.log(`[seo-prerender] ${count} pages pre-rendues + 404.html`);
