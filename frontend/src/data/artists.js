import { thumb, img } from '../utils/paths';

/**
 * Artist print pricing - returns final client price (production + artist margin included)
 *
 * maxFormat sur un print: limite le format max dispo (fichier source < 6 Mo)
 *   - pas de maxFormat = tous les formats (a4, a3, a3plus, a2)
 *   - maxFormat: 'a3' = max A3, A3+ et A2 grises
 *   - maxFormat: 'a4' = seulement A4
 */
export const framePriceByFormat = { postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 };

export function getArtistPrintPrice(pricing, tier, format, withFrame) {
  const prices = tier === 'museum' ? pricing.museum : pricing.studio;
  const base = prices[format];
  if (base == null) return null;
  const framePrice = withFrame ? (framePriceByFormat[format] || 30) : 0;
  return { price: base + framePrice, basePrice: base, framePrice };
}

export const artistPrinterTiers = [
  { id: 'studio', labelFr: 'Série Studio', labelEn: 'Studio Series', labelEs: 'Serie Studio', desc: '4 encres pigmentées / 4 pigmented inks' },
  { id: 'museum', labelFr: 'Série Musée', labelEn: 'Museum Series', labelEs: 'Serie Museo', desc: '12 encres pigmentées / 12 pigmented inks' },
];

export const artistFormats = [
  { id: 'postcard', label: 'A6 (4x6")', short: 'A6', descFr: 'Format A6', descEn: 'A6 format', rank: -1, w: 4, h: 6 },
  { id: 'a4', label: 'A4 (8.5x11")', short: 'A4', descFr: 'Format Lettre', descEn: 'Letter format', rank: 0, w: 8.5, h: 11 },
  { id: 'a3', label: 'A3 (11x17")', short: 'A3', descFr: 'Format Tabloide', descEn: 'Tabloid format', rank: 1, w: 11, h: 17 },
  { id: 'a3plus', label: 'A3+ (13x19")', short: 'A3+', descFr: 'Format Poster', descEn: 'Poster format', rank: 2, w: 13, h: 19 },
  { id: 'a2', label: 'A2 (18x24")', short: 'A2', descFr: 'Grand Poster', descEn: 'Large Poster', rank: 3, w: 18, h: 24 },
];

// Verifie si un format est disponible pour un print selon maxFormat
export function isFormatAvailable(formatId, maxFormat) {
  if (!maxFormat) return true; // pas de restriction
  const fmt = artistFormats.find(f => f.id === formatId);
  const max = artistFormats.find(f => f.id === maxFormat);
  if (!fmt || !max) return true;
  return fmt.rank <= max.rank;
}

const artistsData = {
  'adrift': {
    slug: 'adrift',
    name: 'Adrift',
    tagline: {
      fr: 'Art numérique & univers immersifs',
      en: 'Digital Art & Immersive Worlds',
      es: 'Arte digital y mundos inmersivos',
    },
    bio: {
      fr: "Adrift explore les frontières entre le réel et le virtuel à travers des compositions numériques saisissantes. Son univers visuel puise dans la science-fiction, les textures organiques et les paysages oniriques pour créer des oeuvres qui transportent le spectateur dans des dimensions parallèles.",
      en: "Adrift explores the boundaries between real and virtual through striking digital compositions. Their visual universe draws from science fiction, organic textures and dreamlike landscapes to create works that transport the viewer into parallel dimensions.",
      es: "Adrift explora las fronteras entre lo real y lo virtual a través de composiciones digitales impactantes. Su universo visual se nutre de la ciencia ficción, las texturas orgánicas y los paisajes oníricos para crear obras que transportan al espectador a dimensiones paralelas.",
    },
    socials: {
      instagram: 'https://instagram.com/alx.rouleau',
      youtube: 'https://www.youtube.com/@adrift.vision',
      tiktok: 'https://tiktok.com/@adriftvision',
      website: 'https://www.adrift.vision',
    },
    avatar: img('/images/prints/AdriftAvatar.webp'),
    heroImage: thumb('/images/prints/Adrift1.webp'),
    prints: [
      { id: 'adrift-001', titleFr: 'Print 1', titleEn: 'Print 1', titleEs: 'Print 1', image: thumb('/images/prints/Adrift1.webp'), fullImage: img('/images/prints/Adrift1.webp'), limited: false },
      { id: 'adrift-002', titleFr: 'Print 2', titleEn: 'Print 2', titleEs: 'Print 2', image: thumb('/images/prints/Adrift2.webp'), fullImage: img('/images/prints/Adrift2.webp'), limited: false },
      { id: 'adrift-003', titleFr: 'Print 3', titleEn: 'Print 3', titleEs: 'Print 3', image: thumb('/images/prints/Adrift5.webp'), fullImage: img('/images/prints/Adrift5.webp'), limited: false },
      { id: 'adrift-004', titleFr: 'Print 4', titleEn: 'Print 4', titleEs: 'Print 4', image: thumb('/images/prints/Adrift6.webp'), fullImage: img('/images/prints/Adrift6.webp'), limited: false },
      { id: 'adrift-005', titleFr: 'Print 5', titleEn: 'Print 5', titleEs: 'Print 5', image: thumb('/images/prints/Adrift7.webp'), fullImage: img('/images/prints/Adrift7.webp'), limited: false },
      { id: 'adrift-006', titleFr: 'Print 6', titleEn: 'Print 6', titleEs: 'Print 6', image: thumb('/images/prints/Adrift8.webp'), fullImage: img('/images/prints/Adrift8.webp'), limited: false },
      { id: 'adrift-007', titleFr: 'Print 7', titleEn: 'Print 7', titleEs: 'Print 7', image: thumb('/images/prints/Adrift9.webp'), fullImage: img('/images/prints/Adrift9.webp'), limited: false },
      { id: 'adrift-008', titleFr: 'Print 8', titleEn: 'Print 8', titleEs: 'Print 8', image: thumb('/images/prints/Adrift10.webp'), fullImage: img('/images/prints/Adrift10.webp'), limited: false },
      { id: 'adrift-009', titleFr: 'Print 9', titleEn: 'Print 9', titleEs: 'Print 9', image: thumb('/images/prints/Adrift11.webp'), fullImage: img('/images/prints/Adrift11.webp'), limited: false },
      { id: 'adrift-010', titleFr: 'Print 10', titleEn: 'Print 10', titleEs: 'Print 10', image: thumb('/images/prints/Adrift12.webp'), fullImage: img('/images/prints/Adrift12.webp'), limited: false },
      { id: 'adrift-011', titleFr: 'Print 11', titleEn: 'Print 11', titleEs: 'Print 11', image: thumb('/images/prints/Adrift13.webp'), fullImage: img('/images/prints/Adrift13.webp'), limited: false },
      { id: 'adrift-012', titleFr: 'Print 12', titleEn: 'Print 12', titleEs: 'Print 12', image: thumb('/images/prints/Adrift14.webp'), fullImage: img('/images/prints/Adrift14.webp'), limited: false },
      { id: 'adrift-013', titleFr: 'Print 13', titleEn: 'Print 13', titleEs: 'Print 13', image: thumb('/images/prints/Adrift15.webp'), fullImage: img('/images/prints/Adrift15.webp'), limited: false },
      { id: 'adrift-014', titleFr: 'Print 14', titleEn: 'Print 14', titleEs: 'Print 14', image: thumb('/images/prints/Adrift16.webp'), fullImage: img('/images/prints/Adrift16.webp'), limited: false },
    ],
    pricing: {
      studio: { postcard: 15, a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { postcard: 25, a4: 75, a3: 120, a3plus: 160, a2: 190 },
      framePrice: 30,
    },
  },
  'maudite-machine': {
    slug: 'maudite-machine',
    name: 'Maudite Machine',
    tagline: {
      fr: 'Musique électronique & culture visuelle',
      en: 'Electronic Music & Visual Culture',
      es: 'Música electrónica y cultura visual',
    },
    bio: {
      fr: "Maudite Machine est un collectif audiovisuel montréalais qui fusionne musique électronique et art visuel. Leurs créations graphiques - affiches, pochettes et illustrations - capturent l'énergie brute de la scène underground et la transforment en oeuvres visuelles percutantes.",
      en: "Maudite Machine is a Montreal-based audiovisual collective that fuses electronic music and visual art. Their graphic creations - posters, album covers and illustrations - capture the raw energy of the underground scene and transform it into striking visual works.",
      es: "Maudite Machine es un colectivo audiovisual de Montreal que fusiona música electrónica y arte visual. Sus creaciones gráficas - carteles, portadas de álbum e ilustraciones - capturan la energía cruda de la escena underground y la transforman en obras visuales impactantes.",
    },
    avatar: img('/images/stickers/Stickers-Maudite-Machine.webp'),
    heroImage: thumb('/images/prints/Gemini2.webp'),
    stickers: [
      { id: 'mm-stk-001', titleFr: 'Maudite Machine', titleEn: 'Maudite Machine', titleEs: 'Maudite Machine', image: img('/images/stickers/Stickers-Maudite-Machine.webp'), fullImage: img('/images/stickers/Stickers-Maudite-Machine.webp') },
    ],
    prints: [
      { id: 'gemini-002', titleFr: 'Affiche 1', titleEn: 'Poster 1', titleEs: 'Afiche 1', image: thumb('/images/prints/Gemini2.webp'), fullImage: img('/images/prints/Gemini2.webp'), limited: false, unique: true, fixedFormat: 'a2', fixedTier: 'studio', noFrame: true },
      { id: 'gemini-004', titleFr: 'Affiche 2', titleEn: 'Poster 2', titleEs: 'Afiche 2', image: thumb('/images/prints/Gemini4.webp'), fullImage: img('/images/prints/Gemini4.webp'), limited: false, unique: true, fixedFormat: 'a2', fixedTier: 'studio', noFrame: true },
    ],
    pricing: {
      studio: { postcard: 15, a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { postcard: 25, a4: 75, a3: 120, a3plus: 160, a2: 190 },
      framePrice: 30,
    },
  },
  'mok': {
    slug: 'mok',
    name: 'Mok',
    tagline: {
      fr: 'Photographie urbaine & lumière',
      en: 'Urban Photography & Light',
      es: 'Fotografía urbana y luz',
    },
    bio: {
      fr: "Photographe montréalais avec un oeil unique pour la composition et la lumière. Ses oeuvres capturent l'essence de la ville à travers des perspectives inattendues - architecture, reflets, textures urbaines. Chaque tirage est une invitation à voir Montréal autrement.",
      en: "Montreal photographer with a unique eye for composition and light. His work captures the essence of the city through unexpected perspectives - architecture, reflections, urban textures. Each print is an invitation to see Montreal differently.",
      es: "Fotógrafo montrealense con una mirada única para la composición y la luz. Sus obras capturan la esencia de la ciudad a través de perspectivas inesperadas - arquitectura, reflejos, texturas urbanas. Cada impresión es una invitación a ver Montreal de otra manera.",
    },
    avatar: img('/images/prints/MokAvatar.webp'),
    heroImage: thumb('/images/prints/Mok1.webp'),
    prints: [
      { id: 'mok-001', titleFr: 'Metro Montreal', titleEn: 'Montreal Metro', titleEs: 'Metro Montreal', image: thumb('/images/prints/Mok1.webp'), fullImage: img('/images/prints/Mok1.webp'), limited: false },
    ],
    pricing: {
      studio: { postcard: 15, a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { postcard: 25, a4: 75, a3: 120, a3plus: 160, a2: 190 },
      framePrice: 30,
    },
  },
  'quentin-delobel': {
    slug: 'quentin-delobel',
    name: 'Quentin Delobel',
    tagline: {
      fr: 'Photographie - lumière, contrastes & intimité',
      en: 'Photography - Light, Contrasts & Intimacy',
      es: 'Fotografia - luz, contrastes e intimidad',
    },
    bio: {
      fr: "Quand j'ai découvert la photo, c'est devenu ma deuxième mémoire. Une capacité nouvelle à revivre avec une exactitude poignante l'intensité des moments, de la lumière, des échanges, des contrastes... Partager la photographie avec les autres c'est leur livrer une version intime de la réalité telle que je la perçois.",
      en: "When I discovered photography, it became my second memory. A new ability to relive with poignant accuracy the intensity of moments, light, exchanges, contrasts... Sharing photography with others means delivering an intimate version of reality as I perceive it.",
      es: "Cuando descubri la fotografia, se convirtio en mi segunda memoria. Una nueva capacidad de revivir con una exactitud conmovedora la intensidad de los momentos, la luz, los intercambios, los contrastes... Compartir la fotografia con los demas es entregarles una version intima de la realidad tal como la percibo.",
    },
    avatar: img('/images/prints/QuentinDelobelAvatar.webp'),
    heroImage: img('/images/prints/QuentinDelobel15.webp'),
    prints: [
      { id: 'qd-001', titleFr: 'Photo 1', titleEn: 'Photo 1', titleEs: 'Foto 1', image: thumb('/images/prints/QuentinDelobel1.webp'), fullImage: img('/images/prints/QuentinDelobel1.webp'), limited: false },
      { id: 'qd-002', titleFr: 'Photo 2', titleEn: 'Photo 2', titleEs: 'Foto 2', image: thumb('/images/prints/QuentinDelobel2.webp'), fullImage: img('/images/prints/QuentinDelobel2.webp'), limited: false },
      { id: 'qd-003', titleFr: 'Photo 3', titleEn: 'Photo 3', titleEs: 'Foto 3', image: thumb('/images/prints/QuentinDelobel3.webp'), fullImage: img('/images/prints/QuentinDelobel3.webp'), limited: false },
      { id: 'qd-004', titleFr: 'Photo 4', titleEn: 'Photo 4', titleEs: 'Foto 4', image: thumb('/images/prints/QuentinDelobel4.webp'), fullImage: img('/images/prints/QuentinDelobel4.webp'), limited: false },
      { id: 'qd-005', titleFr: 'Photo 5', titleEn: 'Photo 5', titleEs: 'Foto 5', image: thumb('/images/prints/QuentinDelobel5.webp'), fullImage: img('/images/prints/QuentinDelobel5.webp'), limited: false },
      { id: 'qd-006', titleFr: 'Photo 6', titleEn: 'Photo 6', titleEs: 'Foto 6', image: thumb('/images/prints/QuentinDelobel6.webp'), fullImage: img('/images/prints/QuentinDelobel6.webp'), limited: false },
      { id: 'qd-007', titleFr: 'Photo 7', titleEn: 'Photo 7', titleEs: 'Foto 7', image: thumb('/images/prints/QuentinDelobel7.webp'), fullImage: img('/images/prints/QuentinDelobel7.webp'), limited: false },
      { id: 'qd-008', titleFr: 'Photo 8', titleEn: 'Photo 8', titleEs: 'Foto 8', image: thumb('/images/prints/QuentinDelobel8.webp'), fullImage: img('/images/prints/QuentinDelobel8.webp'), limited: false },
      { id: 'qd-009', titleFr: 'Photo 9', titleEn: 'Photo 9', titleEs: 'Foto 9', image: thumb('/images/prints/QuentinDelobel9.webp'), fullImage: img('/images/prints/QuentinDelobel9.webp'), limited: false },
      { id: 'qd-010', titleFr: 'Photo 10', titleEn: 'Photo 10', titleEs: 'Foto 10', image: thumb('/images/prints/QuentinDelobel10.webp'), fullImage: img('/images/prints/QuentinDelobel10.webp'), limited: false },
      { id: 'qd-011', titleFr: 'Photo 11', titleEn: 'Photo 11', titleEs: 'Foto 11', image: thumb('/images/prints/QuentinDelobel11.webp'), fullImage: img('/images/prints/QuentinDelobel11.webp'), limited: false },
      { id: 'qd-012', titleFr: 'Photo 12', titleEn: 'Photo 12', titleEs: 'Foto 12', image: thumb('/images/prints/QuentinDelobel12.webp'), fullImage: img('/images/prints/QuentinDelobel12.webp'), limited: false },
      { id: 'qd-013', titleFr: 'Photo 13', titleEn: 'Photo 13', titleEs: 'Foto 13', image: thumb('/images/prints/QuentinDelobel13.webp'), fullImage: img('/images/prints/QuentinDelobel13.webp'), limited: false },
      { id: 'qd-014', titleFr: 'Photo 14', titleEn: 'Photo 14', titleEs: 'Foto 14', image: thumb('/images/prints/QuentinDelobel14.webp'), fullImage: img('/images/prints/QuentinDelobel14.webp'), limited: false },
      { id: 'qd-015', titleFr: 'Photo 15', titleEn: 'Photo 15', titleEs: 'Foto 15', image: thumb('/images/prints/QuentinDelobel15.webp'), fullImage: img('/images/prints/QuentinDelobel15.webp'), limited: false },
      { id: 'qd-016', titleFr: 'Photo 16', titleEn: 'Photo 16', titleEs: 'Foto 16', image: thumb('/images/prints/QuentinDelobel16.webp'), fullImage: img('/images/prints/QuentinDelobel16.webp'), limited: false },
      { id: 'qd-017', titleFr: 'Photo 17', titleEn: 'Photo 17', titleEs: 'Foto 17', image: thumb('/images/prints/QuentinDelobel17.webp'), fullImage: img('/images/prints/QuentinDelobel17.webp'), limited: false },
      { id: 'qd-018', titleFr: 'Photo 18', titleEn: 'Photo 18', titleEs: 'Foto 18', image: thumb('/images/prints/QuentinDelobel18.webp'), fullImage: img('/images/prints/QuentinDelobel18.webp'), limited: false },
      { id: 'qd-019', titleFr: 'Photo 19', titleEn: 'Photo 19', titleEs: 'Foto 19', image: thumb('/images/prints/QuentinDelobel19.webp'), fullImage: img('/images/prints/QuentinDelobel19.webp'), limited: false },
      { id: 'qd-020', titleFr: 'Photo 20', titleEn: 'Photo 20', titleEs: 'Foto 20', image: thumb('/images/prints/QuentinDelobel20.webp'), fullImage: img('/images/prints/QuentinDelobel20.webp'), limited: false },
    ],
    pricing: {
      studio: { postcard: 15, a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { postcard: 25, a4: 75, a3: 120, a3plus: 160, a2: 190 },
      framePrice: 30,
    },
    socials: {
      facebook: 'https://www.facebook.com/quentind',
      instagram: 'https://www.instagram.com/poppip.art/',
    },
  },
  'no-pixl': {
    slug: 'no-pixl',
    name: 'No Pixl',
    tagline: {
      fr: 'Photographie événementielle & paysages',
      en: 'Event Photography & Landscapes',
      es: 'Fotografia de eventos y paisajes',
    },
    bio: {
      fr: "No Pixl capture l'intensité des nuits montréalaises et la beauté brute des paysages québécois. Entre raves souterraines et falaises gaspésiennes, son objectif saisit l'énergie des foules en mouvement et la quiétude des grands espaces. Chaque image raconte une histoire de lumières, de contrastes et d'instants fugaces figés dans le temps.",
      en: "No Pixl captures the intensity of Montreal nightlife and the raw beauty of Quebec landscapes. Between underground raves and Gaspe cliffs, his lens seizes the energy of moving crowds and the stillness of wide-open spaces. Each image tells a story of lights, contrasts, and fleeting moments frozen in time.",
      es: "No Pixl captura la intensidad de la vida nocturna montrealesa y la belleza cruda de los paisajes quebequenses. Entre raves subterraneas y acantilados gaspesianos, su lente atrapa la energia de las multitudes en movimiento y la quietud de los grandes espacios. Cada imagen cuenta una historia de luces, contrastes e instantes fugaces congelados en el tiempo.",
    },
    socials: {
      instagram: 'https://www.instagram.com/no.pixl',
      website: 'https://nopixl.myportfolio.com',
    },
    avatar: img('/images/prints/NoPixlAvatar.webp'),
    heroImage: thumb('/images/prints/NoPixl2.webp'),
    prints: [
      { id: 'nopixl-001', titleFr: 'Red Room', titleEn: 'Red Room', titleEs: 'Red Room', image: thumb('/images/prints/NoPixl1.webp'), fullImage: img('/images/prints/NoPixl1.webp'), limited: false },
      { id: 'nopixl-002', titleFr: 'Blue Beams', titleEn: 'Blue Beams', titleEs: 'Blue Beams', image: thumb('/images/prints/NoPixl2.webp'), fullImage: img('/images/prints/NoPixl2.webp'), limited: false },
      { id: 'nopixl-003', titleFr: 'Golden Hour', titleEn: 'Golden Hour', titleEs: 'Golden Hour', image: thumb('/images/prints/NoPixl3.webp'), fullImage: img('/images/prints/NoPixl3.webp'), limited: false },
      { id: 'nopixl-004', titleFr: 'Behind the Decks', titleEn: 'Behind the Decks', titleEs: 'Behind the Decks', image: thumb('/images/prints/NoPixl4.webp'), fullImage: img('/images/prints/NoPixl4.webp'), limited: false },
      { id: 'nopixl-005', titleFr: 'Hands Up', titleEn: 'Hands Up', titleEs: 'Hands Up', image: thumb('/images/prints/NoPixl5.webp'), fullImage: img('/images/prints/NoPixl5.webp'), limited: false },
      { id: 'nopixl-006', titleFr: 'Laser V', titleEn: 'Laser V', titleEs: 'Laser V', image: thumb('/images/prints/NoPixl6.webp'), fullImage: img('/images/prints/NoPixl6.webp'), limited: false },
      { id: 'nopixl-007', titleFr: 'Backstage', titleEn: 'Backstage', titleEs: 'Backstage', image: thumb('/images/prints/NoPixl7.webp'), fullImage: img('/images/prints/NoPixl7.webp'), limited: false },
      { id: 'nopixl-008', titleFr: 'Holy Priest', titleEn: 'Holy Priest', titleEs: 'Holy Priest', image: thumb('/images/prints/NoPixl8.webp'), fullImage: img('/images/prints/NoPixl8.webp'), limited: false },
      { id: 'nopixl-009', titleFr: 'Holy Priest II', titleEn: 'Holy Priest II', titleEs: 'Holy Priest II', image: thumb('/images/prints/NoPixl9.webp'), fullImage: img('/images/prints/NoPixl9.webp'), limited: false },
      { id: 'nopixl-010', titleFr: 'Holy Priest III', titleEn: 'Holy Priest III', titleEs: 'Holy Priest III', image: thumb('/images/prints/NoPixl10.webp'), fullImage: img('/images/prints/NoPixl10.webp'), limited: false },
      { id: 'nopixl-011', titleFr: 'Baie Éternité', titleEn: 'Eternity Bay', titleEs: 'Bahia Eternidad', image: thumb('/images/prints/NoPixl11.webp'), fullImage: img('/images/prints/NoPixl11.webp'), limited: false },
      { id: 'nopixl-012', titleFr: 'Cap Gaspé', titleEn: 'Cape Gaspe', titleEs: 'Cabo Gaspe', image: thumb('/images/prints/NoPixl12.webp'), fullImage: img('/images/prints/NoPixl12.webp'), limited: false },
      { id: 'nopixl-013', titleFr: 'Horizon', titleEn: 'Horizon', titleEs: 'Horizonte', image: thumb('/images/prints/NoPixl13.webp'), fullImage: img('/images/prints/NoPixl13.webp'), limited: false },
      { id: 'nopixl-014', titleFr: 'Rocher Percé', titleEn: 'Perce Rock', titleEs: 'Roca Perce', image: thumb('/images/prints/NoPixl14.webp'), fullImage: img('/images/prints/NoPixl14.webp'), limited: false },
      { id: 'nopixl-015', titleFr: 'Falaises', titleEn: 'Cliffs', titleEs: 'Acantilados', image: thumb('/images/prints/NoPixl15.webp'), fullImage: img('/images/prints/NoPixl15.webp'), limited: false },
      { id: 'nopixl-016', titleFr: 'Plongeurs', titleEn: 'Divers', titleEs: 'Buzos', image: thumb('/images/prints/NoPixl16.webp'), fullImage: img('/images/prints/NoPixl16.webp'), limited: false },
    ],
    pricing: {
      studio: { postcard: 15, a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { postcard: 25, a4: 75, a3: 120, a3plus: 160, a2: 190 },
      framePrice: 30,
    },
  },
  'psyqu33n': {
    slug: 'psyqu33n',
    name: 'Psyqu33n',
    tagline: {
      fr: 'Ombre & lumière - art visionnaire',
      en: 'Shadow & Light - Visionary Art',
      es: 'Sombra y luz - arte visionario',
    },
    bio: {
      fr: "Sous le nom de Psyqu33n, l'artiste explore le chemin vers l'harmonie intérieure et l'équilibre des polarités. Ses créations, centrées sur des regards agissant comme des portails vers l'intime, servent de guides pour révéler ce qui est caché. Sa démarche est une invitation à la contemplation et à l'affirmation de soi, incarnant une force tranquille et universelle.\n\nSon travail se distingue particulièrement par sa métamorphose lumineuse. Grâce à l'utilisation de pigments fluorescents, ses oeuvres offrent une double lecture : une narration diurne et une révélation nocturne. Ce jeu de lumière illustre la vibration spirituelle de son univers, où chaque facette de l'être finit par trouver sa propre clarté.",
      en: "Under the name Psyqu33n, the artist explores the path to inner harmony and the balance of polarities. Her creations, centered on gazes acting as portals to the intimate, serve as guides to reveal what is hidden. Her approach is an invitation to contemplation and self-affirmation, embodying a quiet and universal strength.\n\nHer work stands out particularly through its luminous metamorphosis. Through the use of fluorescent pigments, her works offer a dual reading: a daytime narrative and a nocturnal revelation. This play of light illustrates the spiritual vibration of her universe, where every facet of being eventually finds its own clarity.",
      es: "Bajo el nombre de Psyqu33n, la artista explora el camino hacia la armonía interior y el equilibrio de las polaridades. Sus creaciones, centradas en miradas que actúan como portales hacia lo íntimo, sirven de guías para revelar lo que está oculto. Su enfoque es una invitación a la contemplación y a la afirmación de sí misma, encarnando una fuerza tranquila y universal.\n\nSu trabajo se distingue particularmente por su metamorfosis luminosa. Gracias al uso de pigmentos fluorescentes, sus obras ofrecen una doble lectura: una narración diurna y una revelación nocturna. Este juego de luz ilustra la vibración espiritual de su universo, donde cada faceta del ser termina por encontrar su propia claridad.",
    },
    socials: {
      facebook: 'https://www.facebook.com/HlyArtMtl',
      instagram: 'https://www.instagram.com/Psyqueenmedusa/',
      gallea: 'https://www.gallea.ca/fr/artistes/psyqu33n',
      website: 'https://psyqu33n.com',
      email: 'medusart@protonmail.com',
    },
    avatar: img('/images/stickers/Stickers-Psyqu33n12.webp'),
    heroImage: thumb('/images/prints/Psyqu33n1.webp'),
    stickers: [
      { id: 'psyqu33n-stk-001', titleFr: 'Incarner son pouvoir', titleEn: 'Embodying Your Power', titleEs: 'Encarnar tu poder', image: img('/images/stickers/Stickers-Psyqu33n1.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n1.webp') },
      { id: 'psyqu33n-stk-002', titleFr: 'See Medusa', titleEn: 'See Medusa', titleEs: 'See Medusa', image: img('/images/stickers/Stickers-Psyqu33n2.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n2.webp') },
      { id: 'psyqu33n-stk-003', titleFr: 'The Queen', titleEn: 'The Queen', titleEs: 'The Queen', image: img('/images/stickers/Stickers-Psyqu33n3.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n3.webp') },
      { id: 'psyqu33n-stk-004', titleFr: 'Monkey', titleEn: 'Monkey', titleEs: 'Monkey', image: img('/images/stickers/Stickers-Psyqu33n4.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n4.webp') },
      { id: 'psyqu33n-stk-005', titleFr: 'Ailes', titleEn: 'Wings', titleEs: 'Alas', image: img('/images/stickers/Stickers-Psyqu33n5.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n5.webp') },
      { id: 'psyqu33n-stk-006', titleFr: 'Medusa Bandana', titleEn: 'Medusa Bandana', titleEs: 'Medusa Bandana', image: img('/images/stickers/Stickers-Psyqu33n6.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n6.webp') },
      { id: 'psyqu33n-stk-007', titleFr: 'Trouver le divin en soi', titleEn: 'Finding the Divine Within', titleEs: 'Encontrar lo divino en uno mismo', image: img('/images/stickers/Stickers-Psyqu33n7.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n7.webp') },
      { id: 'psyqu33n-stk-008', titleFr: 'Bat', titleEn: 'Bat', titleEs: 'Bat', image: img('/images/stickers/Stickers-Psyqu33n8.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n8.webp') },
      { id: 'psyqu33n-stk-009', titleFr: 'Psyqu33n', titleEn: 'Psyqu33n', titleEs: 'Psyqu33n', image: img('/images/stickers/Stickers-Psyqu33n9.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n9.webp') },
      { id: 'psyqu33n-stk-010', titleFr: 'New Sticker', titleEn: 'New Sticker', titleEs: 'New Sticker', image: img('/images/stickers/Stickers-Psyqu33n10.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n10.webp') },
      { id: 'psyqu33n-stk-011', titleFr: 'Psyqu33n Sticker', titleEn: 'Psyqu33n Sticker', titleEs: 'Psyqu33n Sticker', image: img('/images/stickers/Stickers-Psyqu33n11.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n11.webp') },
    ],
    prints: [
      { id: 'psyqu33n-001', titleFr: "Accepter ses parts d'ombres et de lumiere", titleEn: 'Embracing Shadow and Light', titleEs: 'Aceptar sus partes de sombra y luz', image: thumb('/images/prints/Psyqu33n1.webp'), fullImage: img('/images/prints/Psyqu33n1.webp'), limited: false },
      { id: 'psyqu33n-002', titleFr: 'Angel', titleEn: 'Angel', titleEs: 'Angel', image: thumb('/images/prints/Psyqu33n2.webp'), fullImage: img('/images/prints/Psyqu33n2.webp'), limited: false },
      { id: 'psyqu33n-003', titleFr: 'Croire en quelque chose de plus grand', titleEn: 'Believing in Something Greater', titleEs: 'Creer en algo mas grande', image: thumb('/images/prints/Psyqu33n3.webp'), fullImage: img('/images/prints/Psyqu33n3.webp'), limited: false },
      { id: 'psyqu33n-004', titleFr: 'Cutie', titleEn: 'Cutie', titleEs: 'Cutie', image: thumb('/images/prints/Psyqu33n4.webp'), fullImage: img('/images/prints/Psyqu33n4.webp'), limited: false },
      { id: 'psyqu33n-005', titleFr: 'Harley', titleEn: 'Harley', titleEs: 'Harley', image: thumb('/images/prints/Psyqu33n5.webp'), fullImage: img('/images/prints/Psyqu33n5.webp'), limited: false },
      { id: 'psyqu33n-006', titleFr: 'La douleur derriere le masque', titleEn: 'The Pain Behind the Mask', titleEs: 'El dolor detras de la mascara', image: thumb('/images/prints/Psyqu33n6.webp'), fullImage: img('/images/prints/Psyqu33n6.webp'), limited: false },
      { id: 'psyqu33n-007', titleFr: 'La purge - liberer les emotions stockees', titleEn: 'The Purge - Releasing Stored Emotions', titleEs: 'La purga - liberar las emociones almacenadas', image: thumb('/images/prints/Psyqu33n7.webp'), fullImage: img('/images/prints/Psyqu33n7.webp'), limited: false },
      { id: 'psyqu33n-008', titleFr: 'Le masque de la femme forte', titleEn: 'The Mask of the Strong Woman', titleEs: 'La mascara de la mujer fuerte', image: thumb('/images/prints/Psyqu33n8.webp'), fullImage: img('/images/prints/Psyqu33n8.webp'), limited: false },
      { id: 'psyqu33n-009', titleFr: 'Le Vampire - Recalibrer ses relations', titleEn: 'The Vampire - Recalibrating Relationships', titleEs: 'El Vampiro - Recalibrar las relaciones', image: thumb('/images/prints/Psyqu33n9.webp'), fullImage: img('/images/prints/Psyqu33n9.webp'), limited: false },
      { id: 'psyqu33n-010', titleFr: 'Mask', titleEn: 'Mask', titleEs: 'Mask', image: thumb('/images/prints/Psyqu33n10.webp'), fullImage: img('/images/prints/Psyqu33n10.webp'), limited: false },
      { id: 'psyqu33n-011', titleFr: 'Metaverse', titleEn: 'Metaverse', titleEs: 'Metaverse', image: thumb('/images/prints/Psyqu33n11.webp'), fullImage: img('/images/prints/Psyqu33n11.webp'), limited: false },
      { id: 'psyqu33n-012', titleFr: 'Psyborg', titleEn: 'Psyborg', titleEs: 'Psyborg', image: thumb('/images/prints/Psyqu33n12.webp'), fullImage: img('/images/prints/Psyqu33n12.webp'), limited: false },
      { id: 'psyqu33n-013', titleFr: 'Rabbit', titleEn: 'Rabbit', titleEs: 'Conejo', image: thumb('/images/prints/Psyqu33n13.webp'), fullImage: img('/images/prints/Psyqu33n13.webp'), limited: false },
      { id: 'psyqu33n-014', titleFr: 'Renard', titleEn: 'Fox', titleEs: 'Zorro', image: thumb('/images/prints/Psyqu33n14.webp'), fullImage: img('/images/prints/Psyqu33n14.webp'), limited: false },
      { id: 'psyqu33n-015', titleFr: "Secret d'Egypte", titleEn: 'Secret of Egypt', titleEs: 'Secreto de Egipto', image: thumb('/images/prints/Psyqu33n15.webp'), fullImage: img('/images/prints/Psyqu33n15.webp'), limited: false },
      { id: 'psyqu33n-016', titleFr: 'The Sun', titleEn: 'The Sun', titleEs: 'El Sol', image: thumb('/images/prints/Psyqu33n16.webp'), fullImage: img('/images/prints/Psyqu33n16.webp'), limited: false },
      { id: 'psyqu33n-017', titleFr: 'The Gaming Queen', titleEn: 'The Gaming Queen', titleEs: 'The Gaming Queen', image: thumb('/images/prints/Psyqu33n17.webp'), fullImage: img('/images/prints/Psyqu33n17.webp'), limited: false },
      { id: 'psyqu33n-018', titleFr: 'The Rebirth', titleEn: 'The Rebirth', titleEs: 'The Rebirth', image: thumb('/images/prints/Psyqu33n18.webp'), fullImage: img('/images/prints/Psyqu33n18.webp'), limited: false },
      { id: 'psyqu33n-019', titleFr: 'Trouver le divin en soi', titleEn: 'Finding the Divine Within', titleEs: 'Encontrar lo divino en uno mismo', image: thumb('/images/prints/Psyqu33n19.webp'), fullImage: img('/images/prints/Psyqu33n19.webp'), limited: false },
      { id: 'psyqu33n-020', titleFr: 'Trusting the Process', titleEn: 'Trusting the Process', titleEs: 'Confiar en el proceso', image: thumb('/images/prints/Psyqu33n20.webp'), fullImage: img('/images/prints/Psyqu33n20.webp'), limited: false },
      { id: 'psyqu33n-021', titleFr: 'Vampire', titleEn: 'Vampire', titleEs: 'Vampiro', image: thumb('/images/prints/Psyqu33n21.webp'), fullImage: img('/images/prints/Psyqu33n21.webp'), limited: false },
      { id: 'psyqu33n-022', titleFr: "Queen d'Asie", titleEn: 'Queen of Asia', titleEs: 'Reina de Asia', image: thumb('/images/prints/Psyqu33n22.webp'), fullImage: img('/images/prints/Psyqu33n22.webp'), limited: false },
    ],
    pricing: {
      studio: { postcard: 15, a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { postcard: 25, a4: 75, a3: 120, a3plus: 160, a2: 190 },
      framePrice: 30,
    },
  },
  'cornelia-rose': {
    slug: 'cornelia-rose',
    name: 'Cornelia Rose',
    tagline: {
      fr: 'Art visionnaire & peinture corporelle',
      en: 'Visionary Art & Body Painting',
      es: 'Arte visionario y pintura corporal',
    },
    bio: {
      fr: "Cornelia Rose est une artiste visionnaire et peintre corporelle, residant actuellement a Kingston, Ontario. Ayant grandi dans une ferme en Suisse, elle a toujours aime plonger ses mains dans la terre et ressentir la connexion avec le monde naturel. Titulaire d'un baccalaureat en psychologie et arts visuels, elle aspire a fusionner ces deux disciplines, utilisant l'art comme outil therapeutique pour explorer les themes de la nature, la psychologie humaine et notre connexion spirituelle a l'ensemble. Ses peintures sont devenues son recit personnel, documentant son parcours d'utilisation de l'art comme force de guerison. Dans ses oeuvres mystiques, Cornelia emploie des figures et un langage psychedelique, invitant le spectateur a un voyage visuel pour voir le monde a travers de nouveaux yeux.",
      en: "Cornelia Rose is a visionary artist and body painter, currently residing in Kingston, Ontario. Growing up on a farm in Switzerland, she has always loved getting her hands into the soil and feeling the connection to our natural world. With a BA in Psychology and Visual Arts, she aspires to merge these two disciplines, using art as a therapeutic tool to explore themes of nature, understanding human psychology and our spiritual connection to it all. Cornelia's paintings have become her own personal narrative, documenting her journey of using art as a healing force, a medicine in her own personal life and traumas. In her mystical works, Cornelia employs figures and psychedelic language, inviting the viewers on a visual journey to see the world through new eyes.",
      es: "Cornelia Rose es una artista visionaria y pintora corporal, que reside actualmente en Kingston, Ontario. Habiendo crecido en una granja en Suiza, siempre ha amado sumergir sus manos en la tierra y sentir la conexion con el mundo natural. Con una licenciatura en Psicologia y Artes Visuales, aspira a fusionar estas dos disciplinas, utilizando el arte como herramienta terapeutica para explorar temas de la naturaleza, la psicologia humana y nuestra conexion espiritual con todo. Sus pinturas se han convertido en su narrativa personal, documentando su camino de usar el arte como fuerza de sanacion. En sus obras misticas, Cornelia emplea figuras y un lenguaje psicodelico, invitando al espectador a un viaje visual para ver el mundo a traves de nuevos ojos.",
    },
    socials: {
      instagram: 'https://www.instagram.com/corneliarose_art/',
      website: 'https://www.corneliaroseart.com/',
    },
    avatar: img('/images/prints/CorneliaRoseAvatar.webp'),
    heroImage: thumb('/images/prints/CorneliaRose1.webp'),
    prints: [
      { id: 'cr-001', titleFr: 'Cornelia Rose Art', titleEn: 'Cornelia Rose Art', titleEs: 'Cornelia Rose Art', image: thumb('/images/prints/CorneliaRose1.webp'), fullImage: img('/images/prints/CorneliaRose1.webp'), limited: false },
      { id: 'cr-002', titleFr: 'Chrystaline Nectar', titleEn: 'Chrystaline Nectar', titleEs: 'Chrystaline Nectar', image: thumb('/images/prints/CorneliaRose2.webp'), fullImage: img('/images/prints/CorneliaRose2.webp'), limited: false },
      { id: 'cr-003', titleFr: 'Cosmic Compass', titleEn: 'Cosmic Compass', titleEs: 'Cosmic Compass', image: thumb('/images/prints/CorneliaRose3.webp'), fullImage: img('/images/prints/CorneliaRose3.webp'), limited: false },
      { id: 'cr-004', titleFr: 'Liongate', titleEn: 'Liongate', titleEs: 'Liongate', image: thumb('/images/prints/CorneliaRose4.webp'), fullImage: img('/images/prints/CorneliaRose4.webp'), limited: false },
      { id: 'cr-005', titleFr: 'Owl Eyes', titleEn: 'Owl Eyes', titleEs: 'Owl Eyes', image: thumb('/images/prints/CorneliaRose5.webp'), fullImage: img('/images/prints/CorneliaRose5.webp'), limited: false },
      { id: 'cr-006', titleFr: 'The Bear', titleEn: 'The Bear', titleEs: 'The Bear', image: thumb('/images/prints/CorneliaRose6.webp'), fullImage: img('/images/prints/CorneliaRose6.webp'), limited: false },
      { id: 'cr-007', titleFr: 'Sans titre I', titleEn: 'Untitled I', titleEs: 'Sin titulo I', image: thumb('/images/prints/CorneliaRose7.webp'), fullImage: img('/images/prints/CorneliaRose7.webp'), limited: false },
      { id: 'cr-008', titleFr: 'Sans titre II', titleEn: 'Untitled II', titleEs: 'Sin titulo II', image: thumb('/images/prints/CorneliaRose8.webp'), fullImage: img('/images/prints/CorneliaRose8.webp'), limited: false },
      { id: 'cr-009', titleFr: 'Sans titre III', titleEn: 'Untitled III', titleEs: 'Sin titulo III', image: thumb('/images/prints/CorneliaRose9.webp'), fullImage: img('/images/prints/CorneliaRose9.webp'), limited: false },
      { id: 'cr-010', titleFr: 'Sans titre IV', titleEn: 'Untitled IV', titleEs: 'Sin titulo IV', image: thumb('/images/prints/CorneliaRose10.webp'), fullImage: img('/images/prints/CorneliaRose10.webp'), limited: false },
      { id: 'cr-011', titleFr: 'Sans titre V', titleEn: 'Untitled V', titleEs: 'Sin titulo V', image: thumb('/images/prints/CorneliaRose11.webp'), fullImage: img('/images/prints/CorneliaRose11.webp'), limited: false },
      { id: 'cr-012', titleFr: 'Sans titre VI', titleEn: 'Untitled VI', titleEs: 'Sin titulo VI', image: thumb('/images/prints/CorneliaRose12.webp'), fullImage: img('/images/prints/CorneliaRose12.webp'), limited: false },
      { id: 'cr-013', titleFr: 'Sans titre VII', titleEn: 'Untitled VII', titleEs: 'Sin titulo VII', image: thumb('/images/prints/CorneliaRose13.webp'), fullImage: img('/images/prints/CorneliaRose13.webp'), limited: false },
    ],
    pricing: {
      studio: { postcard: 15, a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { postcard: 25, a4: 75, a3: 120, a3plus: 160, a2: 190 },
      framePrice: 30,
    },
  },
};

export default artistsData;
