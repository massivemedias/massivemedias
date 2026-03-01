import { thumb } from '../utils/paths';

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
  { id: 'studio', labelFr: 'Série Studio', labelEn: 'Studio Series', desc: '4 encres pigmentées / 4 pigmented inks' },
  { id: 'museum', labelFr: 'Série Musée', labelEn: 'Museum Series', desc: '12 encres pigmentées / 12 pigmented inks' },
];

export const artistFormats = [
  { id: 'a4', label: 'A4 (8.5×11")' },
  { id: 'a3', label: 'A3 (11×17")' },
  { id: 'a3plus', label: 'A3+ (13×19")' },
  { id: 'a2', label: 'A2 (18×24")' },
];

const artistsData = {
  'mok': {
    slug: 'mok',
    name: 'Mok',
    tagline: {
      fr: 'Photographie urbaine & lumière',
      en: 'Urban Photography & Light',
    },
    bio: {
      fr: "Photographe montréalais avec un oeil unique pour la composition et la lumière. Ses oeuvres capturent l'essence de la ville à travers des perspectives inattendues - architecture, reflets, textures urbaines. Chaque tirage est une invitation à voir Montréal autrement.",
      en: "Montreal photographer with a unique eye for composition and light. His work captures the essence of the city through unexpected perspectives - architecture, reflections, urban textures. Each print is an invitation to see Montreal differently.",
    },
    avatar: null,
    heroImage: thumb('/images/prints/Printstoutcourt.webp'),
    prints: [
      { id: 'mok-001', titleFr: 'Oeuvre I', titleEn: 'Artwork I', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-002', titleFr: 'Oeuvre II', titleEn: 'Artwork II', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-003', titleFr: 'Oeuvre III', titleEn: 'Artwork III', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-004', titleFr: 'Oeuvre IV', titleEn: 'Artwork IV', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-005', titleFr: 'Oeuvre V', titleEn: 'Artwork V', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'mok-006', titleFr: 'Oeuvre VI', titleEn: 'Artwork VI', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
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
      fr: 'Lumiere interieure & art visionnaire',
      en: 'Inner Light & Visionary Art',
    },
    bio: {
      fr: "Artiste montrealaise explorant la lumiere interieure a travers des figures feminines universelles - guerisseuses, deesses, ames eclairees. Ses oeuvres utilisent des peintures fluorescentes qui revelent de nouvelles dimensions la nuit.",
      en: "Montreal artist exploring inner light through universal feminine figures - healers, goddesses, enlightened souls. Her works use fluorescent paints that reveal new dimensions at night.",
    },
    demarche: {
      fr: [
        { title: 'Demarche artistique', text: "Mon art est une exploration de la lumiere interieure, un voyage a travers les couches de l'etre pour reveler ce qui, souvent, reste cache. Il ne s'agit plus de fuir ou de se defendre, mais d'embrasser pleinement qui nous sommes. Mes figures, souvent feminines mais universelles dans leur essence, sont des guides. Elles incarnent la douceur, la force tranquille, la souverainete de l'ame. Guerisseuses, deesses, ames eclairees : elles montrent un chemin de reconnexion, d'alignement et de presence a soi." },
        { title: 'Les yeux ne mentent pas', text: "Dans un monde sature de vitesse et d'apparences, mes oeuvres invitent a ralentir, a contempler, a ressentir. Les regards qu'elles portent ne figent pas : ils revelent. Ils sont des portails vers l'intime, des invitations a l'eveil interieur. Chaque visage devient miroir, chaque expression un souffle de verite." },
        { title: 'Un modele pour chacun-e', text: "A travers mes creations, je propose un chemin vers l'harmonie interieure. L'equilibre entre les polarites - energie masculine et feminine, action et contemplation, ombre et lumiere - est au coeur de ma demarche. Ce n'est pas la perfection que je cherche a representer, mais la completude. L'acceptation de toutes nos facettes, meme les plus contradictoires, comme des forces complementaires." },
        { title: "L'importance de la lumiere", text: "La lumiere est au coeur de mon travail - autant dans sa forme que dans son essence. Le jour, mes oeuvres revelent une histoire. La nuit, grace a l'usage de peintures fluorescentes, elles s'illuminent differemment, devoilant d'autres verites, d'autres dimensions. Ombre et lumiere ne sont pas opposees : elles dialoguent, se nourrissent l'une de l'autre. C'est dans leur rencontre que nait la profondeur." },
        { title: null, text: "Ma pratique artistique est un acte de transmutation. Chaque creation est une offrande : un espace pour ressentir, se questionner, se souvenir. Car derriere chaque image se cache une intention : celle de rappeler que la beaute veritable se trouve dans l'authenticite, dans le courage d'etre pleinement soi." },
      ],
      en: [
        { title: 'Artistic approach', text: "My art is an exploration of inner light, a journey through layers of being to reveal what often remains hidden. It is no longer about fleeing or defending, but about fully embracing who we are. My figures, often feminine but universal in their essence, are guides. They embody gentleness, quiet strength, the sovereignty of the soul. Healers, goddesses, enlightened souls: they show a path of reconnection, alignment and presence to self." },
        { title: 'Eyes never lie', text: "In a world saturated with speed and appearances, my works invite you to slow down, contemplate, and feel. The gazes they carry do not freeze: they reveal. They are portals to the intimate, invitations to inner awakening. Each face becomes a mirror, each expression a breath of truth." },
        { title: 'A model for everyone', text: "Through my creations, I offer a path toward inner harmony. The balance between polarities - masculine and feminine energy, action and contemplation, shadow and light - is at the heart of my approach. It is not perfection I seek to represent, but completeness. The acceptance of all our facets, even the most contradictory, as complementary forces." },
        { title: 'The importance of light', text: "Light is at the heart of my work - in both its form and its essence. By day, my works reveal a story. At night, through the use of fluorescent paints, they illuminate differently, unveiling other truths, other dimensions. Shadow and light are not opposed: they dialogue, nourish each other. It is in their meeting that depth is born." },
        { title: null, text: "My artistic practice is an act of transmutation. Each creation is an offering: a space to feel, to question, to remember. For behind each image lies an intention: to remind us that true beauty is found in authenticity, in the courage to be fully oneself." },
      ],
    },
    socials: {
      facebook: 'https://www.facebook.com/HlyArtMtl',
      instagram: 'https://www.instagram.com/Psyqueenmedusa/',
      gallea: 'https://www.gallea.ca/fr/artistes/psyqu33n',
    },
    avatar: null,
    heroImage: thumb('/images/prints/Printstoutcourt.webp'),
    prints: [
      { id: 'psyqu33n-001', titleFr: 'Bastet', titleEn: 'Bastet', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'psyqu33n-002', titleFr: 'La douleur derriere le masque', titleEn: 'The Pain Behind the Mask', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
      { id: 'psyqu33n-003', titleFr: 'Goddess', titleEn: 'Goddess', image: thumb('/images/prints/Printstoutcourt.webp'), limited: false },
    ],
    pricing: {
      studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 },
      museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 },
      framePrice: 20,
    },
  },
};

export default artistsData;
