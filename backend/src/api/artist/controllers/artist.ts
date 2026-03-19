import { factories } from '@strapi/strapi';

const MISSING_ARTISTS = [
  {
    slug: 'no-pixl',
    name: 'No Pixl',
    taglineFr: 'Photographie evenementielle & paysages',
    taglineEn: 'Event Photography & Landscapes',
    taglineEs: 'Fotografia de eventos y paisajes',
    bioFr: "No Pixl capture l'intensite des nuits montrealaises et la beaute brute des paysages quebecois. Entre raves souterraines et falaises gaspeesiennes, son objectif saisit l'energie des foules en mouvement et la quietude des grands espaces.",
    bioEn: "No Pixl captures the intensity of Montreal nightlife and the raw beauty of Quebec landscapes. Between underground raves and Gaspe cliffs, his lens seizes the energy of moving crowds and the stillness of wide-open spaces.",
    bioEs: "No Pixl captura la intensidad de la vida nocturna montrealesa y la belleza cruda de los paisajes quebequenses. Entre raves subterraneas y acantilados gaspesianos, su lente atrapa la energia de las multitudes en movimiento y la quietud de los grandes espacios.",
    socials: { instagram: 'https://www.instagram.com/no.pixl', website: 'https://nopixl.myportfolio.com' },
    pricing: { studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 }, museum: { a4: 75, a3: 120, a3plus: 160, a2: 190 }, framePrice: 30 },
    prints: [
      { id: 'nopixl-001', titleFr: 'Red Room', titleEn: 'Red Room', titleEs: 'Red Room', limited: false },
      { id: 'nopixl-002', titleFr: 'Blue Beams', titleEn: 'Blue Beams', titleEs: 'Blue Beams', limited: false },
      { id: 'nopixl-003', titleFr: 'Golden Hour', titleEn: 'Golden Hour', titleEs: 'Golden Hour', limited: false },
      { id: 'nopixl-004', titleFr: 'Behind the Decks', titleEn: 'Behind the Decks', titleEs: 'Behind the Decks', limited: false },
      { id: 'nopixl-005', titleFr: 'Hands Up', titleEn: 'Hands Up', titleEs: 'Hands Up', limited: false },
      { id: 'nopixl-006', titleFr: 'Laser V', titleEn: 'Laser V', titleEs: 'Laser V', limited: false },
      { id: 'nopixl-007', titleFr: 'Backstage', titleEn: 'Backstage', titleEs: 'Backstage', limited: false },
      { id: 'nopixl-008', titleFr: 'Holy Priest', titleEn: 'Holy Priest', titleEs: 'Holy Priest', limited: false },
      { id: 'nopixl-009', titleFr: 'Holy Priest II', titleEn: 'Holy Priest II', titleEs: 'Holy Priest II', limited: false },
      { id: 'nopixl-010', titleFr: 'Holy Priest III', titleEn: 'Holy Priest III', titleEs: 'Holy Priest III', limited: false },
      { id: 'nopixl-011', titleFr: 'Baie Eternite', titleEn: 'Eternity Bay', titleEs: 'Bahia Eternidad', limited: false },
      { id: 'nopixl-012', titleFr: 'Cap Gaspe', titleEn: 'Cape Gaspe', titleEs: 'Cabo Gaspe', limited: false },
      { id: 'nopixl-013', titleFr: 'Horizon', titleEn: 'Horizon', titleEs: 'Horizonte', limited: false },
      { id: 'nopixl-014', titleFr: 'Rocher Perce', titleEn: 'Perce Rock', titleEs: 'Roca Perce', limited: false },
      { id: 'nopixl-015', titleFr: 'Falaises', titleEn: 'Cliffs', titleEs: 'Acantilados', limited: false },
      { id: 'nopixl-016', titleFr: 'Plongeurs', titleEn: 'Divers', titleEs: 'Buzos', limited: false },
    ],
    active: true,
    commissionRate: 0.5,
    sortOrder: 5,
  },
  {
    slug: 'quentin-delobel',
    name: 'Quentin Delobel',
    taglineFr: 'Photographie - lumiere, contrastes & intimite',
    taglineEn: 'Photography - Light, Contrasts & Intimacy',
    taglineEs: 'Fotografia - luz, contrastes e intimidad',
    bioFr: "Quand j'ai decouvert la photo, c'est devenu ma deuxieme memoire. Une capacite nouvelle a revivre avec une exactitude poignante l'intensite des moments, de la lumiere, des echanges, des contrastes... Partager la photographie avec les autres c'est leur livrer une version intime de la realite telle que je la percois.",
    bioEn: "When I discovered photography, it became my second memory. A new ability to relive with poignant accuracy the intensity of moments, light, exchanges, contrasts... Sharing photography with others means delivering an intimate version of reality as I perceive it.",
    bioEs: "Cuando descubri la fotografia, se convirtio en mi segunda memoria. Una nueva capacidad de revivir con una exactitud conmovedora la intensidad de los momentos, la luz, los intercambios, los contrastes... Compartir la fotografia con los demas es entregarles una version intima de la realidad tal como la percibo.",
    socials: { facebook: 'https://www.facebook.com/quentind', instagram: 'https://www.instagram.com/poppip.art/' },
    pricing: { studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 }, museum: { a4: 75, a3: 120, a3plus: 160, a2: 190 }, framePrice: 30 },
    prints: [
      { id: 'qd-001', titleFr: 'Photo 1', titleEn: 'Photo 1', titleEs: 'Foto 1', limited: false },
      { id: 'qd-002', titleFr: 'Photo 2', titleEn: 'Photo 2', titleEs: 'Foto 2', limited: false },
      { id: 'qd-003', titleFr: 'Photo 3', titleEn: 'Photo 3', titleEs: 'Foto 3', limited: false },
      { id: 'qd-004', titleFr: 'Photo 4', titleEn: 'Photo 4', titleEs: 'Foto 4', limited: false },
      { id: 'qd-005', titleFr: 'Photo 5', titleEn: 'Photo 5', titleEs: 'Foto 5', limited: false },
      { id: 'qd-006', titleFr: 'Photo 6', titleEn: 'Photo 6', titleEs: 'Foto 6', limited: false },
      { id: 'qd-007', titleFr: 'Photo 7', titleEn: 'Photo 7', titleEs: 'Foto 7', limited: false },
      { id: 'qd-008', titleFr: 'Photo 8', titleEn: 'Photo 8', titleEs: 'Foto 8', limited: false },
      { id: 'qd-009', titleFr: 'Photo 9', titleEn: 'Photo 9', titleEs: 'Foto 9', limited: false },
      { id: 'qd-010', titleFr: 'Photo 10', titleEn: 'Photo 10', titleEs: 'Foto 10', limited: false },
      { id: 'qd-011', titleFr: 'Photo 11', titleEn: 'Photo 11', titleEs: 'Foto 11', limited: false },
      { id: 'qd-012', titleFr: 'Photo 12', titleEn: 'Photo 12', titleEs: 'Foto 12', limited: false },
      { id: 'qd-013', titleFr: 'Photo 13', titleEn: 'Photo 13', titleEs: 'Foto 13', limited: false },
      { id: 'qd-014', titleFr: 'Photo 14', titleEn: 'Photo 14', titleEs: 'Foto 14', limited: false },
      { id: 'qd-015', titleFr: 'Photo 15', titleEn: 'Photo 15', titleEs: 'Foto 15', limited: false },
      { id: 'qd-016', titleFr: 'Photo 16', titleEn: 'Photo 16', titleEs: 'Foto 16', limited: false },
      { id: 'qd-017', titleFr: 'Photo 17', titleEn: 'Photo 17', titleEs: 'Foto 17', limited: false },
      { id: 'qd-018', titleFr: 'Photo 18', titleEn: 'Photo 18', titleEs: 'Foto 18', limited: false },
      { id: 'qd-019', titleFr: 'Photo 19', titleEn: 'Photo 19', titleEs: 'Foto 19', limited: false },
      { id: 'qd-020', titleFr: 'Photo 20', titleEn: 'Photo 20', titleEs: 'Foto 20', limited: false },
    ],
    active: true,
    commissionRate: 0.5,
    sortOrder: 4,
  },
];

export default factories.createCoreController('api::artist.artist', ({ strapi }) => ({
  async seedMissing(ctx) {
    const results = [];

    for (const artistData of MISSING_ARTISTS) {
      // Verifier si l'artiste existe deja
      const existing = await strapi.documents('api::artist.artist').findMany({
        filters: { slug: { $eq: artistData.slug } },
        limit: 1,
      });

      if (existing && existing.length > 0) {
        results.push({ slug: artistData.slug, status: 'already_exists' });
        continue;
      }

      const entry = await strapi.documents('api::artist.artist').create({
        data: artistData as any,
        status: 'published',
      });

      results.push({ slug: artistData.slug, status: 'created', documentId: entry.documentId });
    }

    ctx.body = { data: results };
  },
}));
