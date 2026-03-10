import { thumb, img } from '../utils/paths';

/**
 * Artist print pricing - returns final client price (production + artist margin included)
 */
export function getArtistPrintPrice(pricing, tier, format, withFrame) {
  const prices = tier === 'museum' ? pricing.museum : pricing.studio;
  const base = prices[format];
  if (base == null) return null;
  const framePrice = withFrame ? (pricing.framePrice || 20) : 0;
  return { price: base + framePrice, basePrice: base, framePrice };
}

export const artistPrinterTiers = [
  { id: 'studio', labelFr: 'Série Studio', labelEn: 'Studio Series', labelEs: 'Serie Studio', desc: '4 encres pigmentées / 4 pigmented inks' },
  { id: 'museum', labelFr: 'Série Musée', labelEn: 'Museum Series', labelEs: 'Serie Museo', desc: '12 encres pigmentées / 12 pigmented inks' },
];

export const artistFormats = [
  { id: 'a4', label: 'A4 (8.5×11")' },
  { id: 'a3', label: 'A3 (11×17")' },
  { id: 'a3plus', label: 'A3+ (13×19")' },
  { id: 'a2', label: 'A2 (18×24")' },
];

const artistsData = {
  'adrift': {
    slug: 'adrift',
    name: 'Adrift',
    tagline: {
      fr: 'Art numerique & univers immersifs',
      en: 'Digital Art & Immersive Worlds',
      es: 'Arte digital y mundos inmersivos',
    },
    bio: {
      fr: "Adrift explore les frontieres entre le reel et le virtuel a travers des compositions numeriques saisissantes. Son univers visuel puise dans la science-fiction, les textures organiques et les paysages oniriques pour creer des oeuvres qui transportent le spectateur dans des dimensions paralleles.",
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
      { id: 'adrift-005', titleFr: 'Print 3', titleEn: 'Print 3', titleEs: 'Print 3', image: thumb('/images/prints/Adrift5.webp'), fullImage: img('/images/prints/Adrift5.webp'), limited: false },
      { id: 'adrift-006', titleFr: 'Print 4', titleEn: 'Print 4', titleEs: 'Print 4', image: thumb('/images/prints/Adrift6.webp'), fullImage: img('/images/prints/Adrift6.webp'), limited: false },
      { id: 'adrift-007', titleFr: 'Print 5', titleEn: 'Print 5', titleEs: 'Print 5', image: thumb('/images/prints/Adrift7.webp'), fullImage: img('/images/prints/Adrift7.webp'), limited: false },
      { id: 'adrift-008', titleFr: 'Print 6', titleEn: 'Print 6', titleEs: 'Print 6', image: thumb('/images/prints/Adrift8.webp'), fullImage: img('/images/prints/Adrift8.webp'), limited: false },
      { id: 'adrift-009', titleFr: 'Print 7', titleEn: 'Print 7', titleEs: 'Print 7', image: thumb('/images/prints/Adrift9.webp'), fullImage: img('/images/prints/Adrift9.webp'), limited: false },
      { id: 'adrift-010', titleFr: 'Print 8', titleEn: 'Print 8', titleEs: 'Print 8', image: thumb('/images/prints/Adrift10.webp'), fullImage: img('/images/prints/Adrift10.webp'), limited: false },
      { id: 'adrift-011', titleFr: 'Print 9', titleEn: 'Print 9', titleEs: 'Print 9', image: thumb('/images/prints/Adrift11.webp'), fullImage: img('/images/prints/Adrift11.webp'), limited: false },
      { id: 'adrift-012', titleFr: 'Print 10', titleEn: 'Print 10', titleEs: 'Print 10', image: thumb('/images/prints/Adrift12.webp'), fullImage: img('/images/prints/Adrift12.webp'), limited: false },
      { id: 'adrift-013', titleFr: 'Print 11', titleEn: 'Print 11', titleEs: 'Print 11', image: thumb('/images/prints/Adrift13.webp'), fullImage: img('/images/prints/Adrift13.webp'), limited: false },
      { id: 'adrift-014', titleFr: 'Print 12', titleEn: 'Print 12', titleEs: 'Print 12', image: thumb('/images/prints/Adrift14.webp'), fullImage: img('/images/prints/Adrift14.webp'), limited: false },
      { id: 'adrift-015', titleFr: 'Print 13', titleEn: 'Print 13', titleEs: 'Print 13', image: thumb('/images/prints/Adrift15.webp'), fullImage: img('/images/prints/Adrift15.webp'), limited: false },
      { id: 'adrift-016', titleFr: 'Print 14', titleEn: 'Print 14', titleEs: 'Print 14', image: thumb('/images/prints/Adrift16.webp'), fullImage: img('/images/prints/Adrift16.webp'), limited: false },
    ],
    pricing: {
      studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 },
      framePrice: 20,
    },
  },
  'maudite-machine': {
    slug: 'maudite-machine',
    name: 'Maudite Machine',
    tagline: {
      fr: 'Musique electronique & culture visuelle',
      en: 'Electronic Music & Visual Culture',
      es: 'Música electrónica y cultura visual',
    },
    bio: {
      fr: "Maudite Machine est un collectif audiovisuel montrealais qui fusionne musique electronique et art visuel. Leurs creations graphiques - affiches, pochettes et illustrations - capturent l'energie brute de la scene underground et la transforment en oeuvres visuelles percutantes.",
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
      studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 },
      framePrice: 20,
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
      studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 },
      framePrice: 20,
    },
  },
  'psyqu33n': {
    slug: 'psyqu33n',
    name: 'Psyqu33n',
    tagline: {
      fr: 'Ombre & lumiere - art visionnaire',
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
    avatar: thumb('/images/prints/Psyqu33n1.webp'),
    heroImage: thumb('/images/prints/Psyqu33n1.webp'),
    stickers: [
      { id: 'psyqu33n-stk-002', titleFr: 'See Medusa', titleEn: 'See Medusa', titleEs: 'See Medusa', image: img('/images/stickers/Stickers-Psyqu33n2.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n2.webp') },
      { id: 'psyqu33n-stk-003', titleFr: 'The Queen', titleEn: 'The Queen', titleEs: 'The Queen', image: img('/images/stickers/Stickers-Psyqu33n3.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n3.webp') },
      { id: 'psyqu33n-stk-005', titleFr: 'Incarner son pouvoir', titleEn: 'Embodying Your Power', titleEs: 'Encarnar tu poder', image: img('/images/stickers/Stickers-Psyqu33n5.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n5.webp') },
      { id: 'psyqu33n-stk-007', titleFr: 'Monkey', titleEn: 'Monkey', titleEs: 'Monkey', image: img('/images/stickers/Stickers-Psyqu33n7.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n7.webp') },
      { id: 'psyqu33n-stk-008', titleFr: 'Ailes', titleEn: 'Wings', titleEs: 'Alas', image: img('/images/stickers/Stickers-Psyqu33n8.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n8.webp') },
      { id: 'psyqu33n-stk-009', titleFr: 'Illustration', titleEn: 'Illustration', titleEs: 'Ilustracion', image: img('/images/stickers/Stickers-Psyqu33n9.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n9.webp') },
      { id: 'psyqu33n-stk-011', titleFr: 'Psyqu33n', titleEn: 'Psyqu33n', titleEs: 'Psyqu33n', image: img('/images/stickers/Stickers-Psyqu33n11.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n11.webp') },
      { id: 'psyqu33n-stk-012', titleFr: 'Medusa Bandana', titleEn: 'Medusa Bandana', titleEs: 'Medusa Bandana', image: img('/images/stickers/Stickers-Psyqu33n12.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n12.webp') },
      { id: 'psyqu33n-stk-013', titleFr: 'Sticker Queen', titleEn: 'Sticker Queen', titleEs: 'Sticker Queen', image: img('/images/stickers/Stickers-Psyqu33n13.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n13.webp') },
      { id: 'psyqu33n-stk-014', titleFr: 'Trouver le divin en soi', titleEn: 'Finding the Divine Within', titleEs: 'Encontrar lo divino en uno mismo', image: img('/images/stickers/Stickers-Psyqu33n14.webp'), fullImage: img('/images/stickers/Stickers-Psyqu33n14.webp') },
    ],
    prints: [
      { id: 'psyqu33n-001', titleFr: "Accepter ses parts d'ombres et de lumiere", titleEn: 'Embracing Shadow and Light', titleEs: 'Aceptar sus partes de sombra y luz', image: thumb('/images/prints/Psyqu33n1.webp'), fullImage: img('/images/prints/Psyqu33n1.webp'), limited: false },
      { id: 'psyqu33n-002', titleFr: 'Croire en quelque chose de plus grand', titleEn: 'Believing in Something Greater', titleEs: 'Creer en algo mas grande', image: thumb('/images/prints/Psyqu33n2.webp'), fullImage: img('/images/prints/Psyqu33n2.webp'), limited: false },
      { id: 'psyqu33n-003', titleFr: "L'archetype de la reine - la force d'avancer", titleEn: 'The Queen Archetype - Strength to Move Forward', titleEs: 'El arquetipo de la reina - la fuerza de avanzar', image: thumb('/images/prints/Psyqu33n3.webp'), fullImage: img('/images/prints/Psyqu33n3.webp'), limited: false },
      { id: 'psyqu33n-004', titleFr: 'La douleur derriere le masque', titleEn: 'The Pain Behind the Mask', titleEs: 'El dolor detras de la mascara', image: thumb('/images/prints/Psyqu33n4.webp'), fullImage: img('/images/prints/Psyqu33n4.webp'), limited: false },
      { id: 'psyqu33n-005', titleFr: 'La purge - liberer les emotions stockees', titleEn: 'The Purge - Releasing Stored Emotions', titleEs: 'La purga - liberar las emociones almacenadas', image: thumb('/images/prints/Psyqu33n5.webp'), fullImage: img('/images/prints/Psyqu33n5.webp'), limited: false },
      { id: 'psyqu33n-006', titleFr: 'Le masque de la femme forte', titleEn: 'The Mask of the Strong Woman', titleEs: 'La mascara de la mujer fuerte', image: thumb('/images/prints/Psyqu33n6.webp'), fullImage: img('/images/prints/Psyqu33n6.webp'), limited: false },
      { id: 'psyqu33n-007', titleFr: 'Le Vampire - Recalibrer ses relations', titleEn: 'The Vampire - Recalibrating Relationships', titleEs: 'El Vampiro - Recalibrar las relaciones', image: thumb('/images/prints/Psyqu33n7.webp'), fullImage: img('/images/prints/Psyqu33n7.webp'), limited: false },
      { id: 'psyqu33n-008', titleFr: 'Nefertiti', titleEn: 'Nefertiti', titleEs: 'Nefertiti', image: thumb('/images/prints/Psyqu33n8.webp'), fullImage: img('/images/prints/Psyqu33n8.webp'), limited: false },
      { id: 'psyqu33n-009', titleFr: 'Rabbit', titleEn: 'Rabbit', titleEs: 'Conejo', image: thumb('/images/prints/Psyqu33n9.webp'), fullImage: img('/images/prints/Psyqu33n9.webp'), limited: false },
      { id: 'psyqu33n-010', titleFr: 'Renard', titleEn: 'Fox', titleEs: 'Zorro', image: thumb('/images/prints/Psyqu33n10.webp'), fullImage: img('/images/prints/Psyqu33n10.webp'), limited: false },
      { id: 'psyqu33n-011', titleFr: 'The Rebirth', titleEn: 'The Rebirth', titleEs: 'El Renacimiento', image: thumb('/images/prints/Psyqu33n11.webp'), fullImage: img('/images/prints/Psyqu33n11.webp'), limited: false },
      { id: 'psyqu33n-012', titleFr: 'Trouver le divin en soi', titleEn: 'Finding the Divine Within', titleEs: 'Encontrar lo divino en uno mismo', image: thumb('/images/prints/Psyqu33n12.webp'), fullImage: img('/images/prints/Psyqu33n12.webp'), limited: false },
      { id: 'psyqu33n-013', titleFr: 'Trusting the Process', titleEn: 'Trusting the Process', titleEs: 'Confiar en el proceso', image: thumb('/images/prints/Psyqu33n13.webp'), fullImage: img('/images/prints/Psyqu33n13.webp'), limited: false },
    ],
    pricing: {
      studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 },
      framePrice: 20,
    },
  },
};

export default artistsData;
