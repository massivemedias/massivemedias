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
    avatar: '/images/prints/AdriftAvatar.webp',
    heroImage: thumb('/images/prints/Adrift1.webp'),
    prints: [
      { id: 'adrift-001', titleFr: 'Print I', titleEn: 'Print I', titleEs: 'Print I', image: thumb('/images/prints/Adrift1.webp'), fullImage: img('/images/prints/Adrift1.webp'), limited: false },
      { id: 'adrift-002', titleFr: 'Print II', titleEn: 'Print II', titleEs: 'Print II', image: thumb('/images/prints/Adrift2.webp'), fullImage: img('/images/prints/Adrift2.webp'), limited: false },
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
    avatar: '/images/stickers/Stickers-Maudite-Machine.webp',
    heroImage: thumb('/images/prints/Printstoutcourt.webp'),
    prints: [],
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
    avatar: '/images/prints/MokAvatar.webp',
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
      fr: "J'incarne l'ombre et la lumiere, la force et la douceur, le chaos et l'harmonie. Mon art est un espace d'expression libre, un pont entre les mondes, une invitation a l'introspection et a l'elevation. Je suis issue de deux mondes underground que tout oppose - le graffiti, instinctif, rapide, brut, et l'exploration de la psyche, plongeant dans les profondeurs de l'esprit, du sacre, du symbolique. Ensemble, ils composent un langage unique.",
      en: "I embody both shadow and light, strength and softness, chaos and harmony. My art is a space of free expression, a bridge between worlds, an invitation to introspection and elevation. I come from two underground realms that seem to stand in opposition - graffiti, instinctive, fast, raw, and the exploration of the psyche, diving deep into the spirit, into the sacred and the symbolic. Together, they form a unique language.",
      es: "Encarno la sombra y la luz, la fuerza y la dulzura, el caos y la armonía. Mi arte es un espacio de expresión libre, un puente entre mundos, una invitación a la introspección y a la elevación. Provengo de dos mundos underground que todo opone - el graffiti, instintivo, rápido, crudo, y la exploración de la psique, sumergiéndose en las profundidades del espíritu, de lo sagrado, de lo simbólico. Juntos, componen un lenguaje único.",
    },
    demarche: {
      fr: [
        { title: 'Demarche artistique', text: "Mon art est une exploration de la lumiere interieure, un voyage a travers les couches de l'etre pour reveler ce qui, souvent, reste cache. Il ne s'agit plus de fuir ou de se defendre, mais d'embrasser pleinement qui nous sommes. Mes figures, souvent feminines mais universelles dans leur essence, sont des guides. Elles incarnent la douceur, la force tranquille, la souverainete de l'ame. Guerisseuses, deesses, ames eclairees : elles montrent un chemin de reconnexion, d'alignement et de presence a soi." },
        { title: 'Les yeux ne mentent pas', text: "Dans un monde sature de vitesse et d'apparences, mes oeuvres invitent a ralentir, a contempler, a ressentir. Les regards qu'elles portent ne figent pas : ils revelent. Ils sont des portails vers l'intime, des invitations a l'eveil interieur. Chaque visage devient miroir, chaque expression un souffle de verite." },
        { title: 'Un modele pour chacun-e', text: "A travers mes creations, je propose un chemin vers l'harmonie interieure. L'equilibre entre les polarites - energie masculine et feminine, action et contemplation, ombre et lumiere - est au coeur de ma demarche. Ce n'est pas la perfection que je cherche a representer, mais la completude." },
        { title: "L'importance de la lumiere", text: "La lumiere est au coeur de mon travail - autant dans sa forme que dans son essence. Le jour, mes oeuvres revelent une histoire. La nuit, grace a l'usage de peintures fluorescentes, elles s'illuminent differemment, devoilant d'autres verites, d'autres dimensions. Ombre et lumiere ne sont pas opposees : elles dialoguent, se nourrissent l'une de l'autre." },
        { title: 'A propos du nom Psyqu33n', text: "Psyqu33n symbolise une renaissance me permettant d'incarner pleinement qui je suis. C'est l'archetype de la souverainete interieure, l'affirmation de toutes mes facettes. Le 33, loin d'etre un simple chiffre, porte une vibration spirituelle profonde - un nombre maitre porteur d'un grand potentiel de transformation, de guerison et d'altruisme." },
      ],
      en: [
        { title: 'Artistic approach', text: "My art is an exploration of inner light, a journey through layers of being to reveal what often remains hidden. It is no longer about fleeing or defending, but about fully embracing who we are. My figures, often feminine but universal in their essence, are guides. They embody gentleness, quiet strength, the sovereignty of the soul. Healers, goddesses, enlightened souls: they show a path of reconnection, alignment and presence to self." },
        { title: 'Eyes never lie', text: "In a world saturated with speed and appearances, my works invite you to slow down, contemplate, and feel. The gazes they carry do not freeze: they reveal. They are portals to the intimate, invitations to inner awakening. Each face becomes a mirror, each expression a breath of truth." },
        { title: 'A model for everyone', text: "Through my creations, I offer a path toward inner harmony. The balance between polarities - masculine and feminine energy, action and contemplation, shadow and light - is at the heart of my approach. It is not perfection I seek to represent, but completeness." },
        { title: 'The importance of light', text: "Light is at the heart of my work - in both its form and its essence. By day, my works reveal a story. At night, through the use of fluorescent paints, they illuminate differently, unveiling other truths, other dimensions. Shadow and light are not opposed: they dialogue, nourish each other." },
        { title: 'About the name Psyqu33n', text: "Psyqu33n symbolizes a rebirth - a return to my essence, allowing me to fully embody who I am. It represents the archetype of inner sovereignty, the affirmation of all my facets. The number 33 carries a deep spiritual vibration - a master number bearing great potential for transformation, healing, and altruism." },
      ],
      es: [
        { title: 'Enfoque artístico', text: "Mi arte es una exploración de la luz interior, un viaje a través de las capas del ser para revelar lo que, a menudo, permanece oculto. Ya no se trata de huir o de defenderse, sino de abrazar plenamente quienes somos. Mis figuras, a menudo femeninas pero universales en su esencia, son guías. Encarnan la dulzura, la fuerza tranquila, la soberanía del alma. Sanadoras, diosas, almas iluminadas: muestran un camino de reconexión, alineación y presencia consigo mismo." },
        { title: 'Los ojos no mienten', text: "En un mundo saturado de velocidad y apariencias, mis obras invitan a desacelerar, contemplar, sentir. Las miradas que portan no congelan: revelan. Son portales hacia lo íntimo, invitaciones al despertar interior. Cada rostro se convierte en espejo, cada expresión en un soplo de verdad." },
        { title: 'Un modelo para todos', text: "A través de mis creaciones, propongo un camino hacia la armonía interior. El equilibrio entre las polaridades - energía masculina y femenina, acción y contemplación, sombra y luz - está en el corazón de mi enfoque. No es la perfección lo que busco representar, sino la plenitud." },
        { title: 'La importancia de la luz', text: "La luz está en el corazón de mi trabajo - tanto en su forma como en su esencia. De día, mis obras revelan una historia. De noche, gracias al uso de pinturas fluorescentes, se iluminan de manera diferente, desvelando otras verdades, otras dimensiones. Sombra y luz no se oponen: dialogan, se nutren mutuamente." },
        { title: 'Sobre el nombre Psyqu33n', text: "Psyqu33n simboliza un renacimiento que me permite encarnar plenamente quien soy. Es el arquetipo de la soberanía interior, la afirmación de todas mis facetas. El 33, lejos de ser un simple número, porta una vibración espiritual profunda - un número maestro portador de un gran potencial de transformación, sanación y altruismo." },
      ],
    },
    socials: {
      facebook: 'https://www.facebook.com/HlyArtMtl',
      instagram: 'https://www.instagram.com/Psyqueenmedusa/',
      gallea: 'https://www.gallea.ca/fr/artistes/psyqu33n',
      website: 'https://psyqu33n.com',
      email: 'medusart@protonmail.com',
    },
    avatar: '/images/prints/Psyqu33nAvatar.webp',
    heroImage: thumb('/images/prints/Psyqu33n1.webp'),
    prints: [
      { id: 'psyqu33n-001', titleFr: 'Accepter ses parts d\'ombres et de lumiere', titleEn: 'Embracing Shadow and Light', titleEs: 'Aceptar sus partes de sombra y luz', image: thumb('/images/prints/Psyqu33n1.webp'), fullImage: img('/images/prints/Psyqu33n1.webp'), limited: false },
      { id: 'psyqu33n-002', titleFr: 'Trusting the Process', titleEn: 'Trusting the Process', titleEs: 'Trusting the Process', image: thumb('/images/prints/Psyqu33n2.webp'), fullImage: img('/images/prints/Psyqu33n2.webp'), limited: false },
      { id: 'psyqu33n-003', titleFr: 'Bat', titleEn: 'Bat', titleEs: 'Murciélago', image: thumb('/images/prints/Psyqu33n3.webp'), fullImage: img('/images/prints/Psyqu33n3.webp'), limited: false },
      { id: 'psyqu33n-004', titleFr: 'Monkey', titleEn: 'Monkey', titleEs: 'Mono', image: thumb('/images/prints/Psyqu33n4.webp'), fullImage: img('/images/prints/Psyqu33n4.webp'), limited: false },
      { id: 'psyqu33n-005', titleFr: 'Rabbit', titleEn: 'Rabbit', titleEs: 'Conejo', image: thumb('/images/prints/Psyqu33n5.webp'), fullImage: img('/images/prints/Psyqu33n5.webp'), limited: false },
      { id: 'psyqu33n-006', titleFr: 'Renard', titleEn: 'Fox', titleEs: 'Zorro', image: thumb('/images/prints/Psyqu33n6.webp'), fullImage: img('/images/prints/Psyqu33n6.webp'), limited: false },
      { id: 'psyqu33n-007', titleFr: 'Croire en quelque chose de plus grand', titleEn: 'Believing in Something Greater', titleEs: 'Creer en algo más grande', image: thumb('/images/prints/Psyqu33n7.webp'), fullImage: img('/images/prints/Psyqu33n7.webp'), limited: false },
      { id: 'psyqu33n-008', titleFr: 'Incarner son pouvoir', titleEn: 'Embodying Your Power', titleEs: 'Encarnar tu poder', image: thumb('/images/prints/Psyqu33n8.webp'), fullImage: img('/images/prints/Psyqu33n8.webp'), limited: false },
      { id: 'psyqu33n-009', titleFr: 'L\'archetype de la reine - la force d\'avancer', titleEn: 'The Queen Archetype - Strength to Move Forward', titleEs: 'El arquetipo de la reina - la fuerza de avanzar', image: thumb('/images/prints/Psyqu33n9.webp'), fullImage: img('/images/prints/Psyqu33n9.webp'), limited: false },
      { id: 'psyqu33n-010', titleFr: 'La douleur derriere le masque', titleEn: 'The Pain Behind the Mask', titleEs: 'El dolor detrás de la máscara', image: thumb('/images/prints/Psyqu33n10.webp'), fullImage: img('/images/prints/Psyqu33n10.webp'), limited: false },
      { id: 'psyqu33n-011', titleFr: 'La purge - liberer les emotions stockees', titleEn: 'The Purge - Releasing Stored Emotions', titleEs: 'La purga - liberar las emociones almacenadas', image: thumb('/images/prints/Psyqu33n11.webp'), fullImage: img('/images/prints/Psyqu33n11.webp'), limited: false },
      { id: 'psyqu33n-012', titleFr: 'Le masque de la femme forte', titleEn: 'The Mask of the Strong Woman', titleEs: 'La máscara de la mujer fuerte', image: thumb('/images/prints/Psyqu33n12.webp'), fullImage: img('/images/prints/Psyqu33n12.webp'), limited: false },
    ],
    pricing: {
      studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 },
      framePrice: 20,
    },
  },
};

export default artistsData;
