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

// Meta par route - optimise pour le referencement local Montreal
const ROUTES = {
  '/': {
    title: 'Massive Medias | Impression Fine Art, Stickers Custom & Design Graphique Montreal',
    description: 'Studio de production creative a Montreal, Mile-End. Impression fine art sur papier Hahnemuhle, stickers die-cut personnalises, sublimation textile, design graphique et developpement web. Commandez en ligne, livraison rapide au Quebec.',
  },
  '/artistes': {
    title: 'Artistes Montreal | Photographes, Peintres & Tatoueurs - Massive Medias',
    description: 'Decouvrez les artistes de Massive Medias a Montreal. Photographes, peintres et tatoueurs. Achetez des tirages fine art, flashs de tatouage et oeuvres originales en ligne. Livraison au Canada.',
  },
  '/tatoueurs': {
    title: 'Tatoueurs Montreal | Flash Tattoo & Reservations en Ligne - Massive Medias',
    description: 'Reservez un flash de tatouage unique aupres de nos tatoueurs partenaires a Montreal. Fineline, botanique, blackwork. Consultez les disponibilites et reservez votre piece en ligne.',
  },
  '/tatoueurs/ginko-ink': {
    title: 'Ginko Ink | Tatoueuse Fineline Montreal - Flashs Botaniques & Reservations',
    description: 'Myriam Rivest (Ginko Ink), tatoueuse fineline a Montreal. Flashs botaniques, creatures feeriques et personnages. Reservez votre piece unique en ligne. Disponibilites et tarifs.',
    ogImage: `${BASE_URL}/images/tatoueurs/ginko-ink/hero.webp`,
  },
  '/boutique': {
    title: 'Boutique en Ligne | Prints Fine Art, Stickers & Merch - Massive Medias Montreal',
    description: 'Achetez des prints fine art, stickers die-cut et merch en ligne. Impression professionnelle sur materiaux premium. T-shirts, hoodies, affiches. Livraison rapide au Quebec et au Canada.',
  },
  '/services/prints': {
    title: 'Impression Fine Art Montreal | Tirages Hahnemuhle, Encres Pigmentees - Massive Medias',
    description: 'Service d\'impression fine art professionnel a Montreal. Papier Hahnemuhle Photo Rag, encres pigmentees 12 couleurs, conservation 100+ ans. Formats A6 a A2. Tirage photo, affiche, illustration. Devis gratuit.',
  },
  '/services/stickers': {
    title: 'Stickers Personnalises Montreal | Die-Cut, Holographique, Vinyle - Massive Medias',
    description: 'Stickers die-cut personnalises a Montreal. Vinyle impermeable, finitions holographique, glossy, matte et broken glass. Decoupe sur mesure, petites et grandes quantites. Commander en ligne.',
  },
  '/services/merch': {
    title: 'Impression Textile Montreal | T-shirts, Hoodies, Sublimation - Massive Medias',
    description: 'Sublimation textile professionnelle a Montreal. T-shirts, hoodies, crewnecks, tote bags personnalises. Impression all-over ou placement. Qualite premium, petites series ou bulk.',
  },
  '/services/design': {
    title: 'Design Graphique Montreal | Logos, Flyers, Pochettes d\'Album - Massive Medias',
    description: 'Studio de design graphique a Montreal. Logos, identite visuelle, flyers evenementiels, pochettes d\'album, affiches. Creatifs billingues FR/EN. Portfolio et devis gratuit.',
  },
  '/services/web': {
    title: 'Developpement Web Montreal | Sites React, E-commerce, SEO - Massive Medias',
    description: 'Developpement web professionnel a Montreal. Sites vitrines React, boutiques e-commerce, applications web. SEO, performance et design moderne. Devis gratuit.',
  },
  '/a-propos': {
    title: 'A Propos de Massive Medias | Studio Creatif Montreal Mile-End',
    description: 'Massive Medias est un studio de production creative fonde en 2022, base au Mile-End a Montreal. Impression fine art, stickers, design graphique et developpement web. Notre mission: rendre la creation accessible.',
  },
  '/contact': {
    title: 'Contactez Massive Medias | Devis Gratuit Impression & Design Montreal',
    description: 'Contactez Massive Medias pour vos projets d\'impression fine art, stickers, design graphique ou developpement web. Studio au Mile-End, Montreal. Reponse en moins de 24h. Devis gratuit.',
  },
  // Artistes individuels
  '/artistes/adrift': {
    title: 'Adrift | Art Numerique & Prints Fine Art - Massive Medias Montreal',
    description: 'Adrift explore les frontieres entre le reel et le virtuel a travers l\'art numerique. Prints fine art disponibles en plusieurs formats sur papier Hahnemuhle. Achetez en ligne.',
  },
  '/artistes/maudite-machine': {
    title: 'Maudite Machine | Art Visuel & Musique Electronique Montreal - Massive Medias',
    description: 'Collectif audiovisuel montrealais fusionnant musique electronique et art visuel. Affiches, prints fine art et oeuvres originales disponibles. Achetez en ligne sur Massive Medias.',
  },
  '/artistes/psyqu33n': {
    title: 'Psyqu33n | Art Visionnaire, Peinture & Body Art Montreal - Massive Medias',
    description: 'Psyqu33n, artiste visionnaire a Montreal. Peinture, body painting et art numerique explorant l\'ombre et la lumiere. Prints fine art disponibles en formats A4 a A2.',
  },
  '/artistes/mok': {
    title: 'Mok | Photographie Urbaine Montreal - Tirages Fine Art - Massive Medias',
    description: 'Mok, photographe montrealais specialise en photographie urbaine. Architecture, reflets et textures de Montreal. Tirages fine art sur papier Hahnemuhle disponibles en ligne.',
  },
  '/artistes/quentin-delobel': {
    title: 'Quentin Delobel | Photographe Portrait Montreal - Tirages Fine Art - Massive Medias',
    description: 'Quentin Delobel, photographe francais base a Montreal. Portraits en lumiere naturelle, contrastes et intimite. Tirages fine art disponibles en plusieurs formats.',
  },
  '/artistes/no-pixl': {
    title: 'No Pixl | Photographie Evenementielle & Paysage Canada - Massive Medias',
    description: 'No Pixl, photographe evenementiel et paysagiste. Festivals et paysages canadiens captures avec passion. Tirages fine art disponibles sur Massive Medias.',
  },
  '/artistes/cornelia-rose': {
    title: 'Cornelia Rose | Art Visionnaire & Body Painting Montreal - Massive Medias',
    description: 'Cornelia Rose, artiste visionnaire a Montreal specialisee en body painting et art numerique. Univers colores et psychedeliques. Prints fine art disponibles en ligne.',
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
