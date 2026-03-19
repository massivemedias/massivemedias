import { factories } from '@strapi/strapi';

const MISSING_ARTISTS = [
  {
    slug: 'cornelia-rose',
    name: 'Cornelia Rose',
    taglineFr: 'Art visuel & peinture',
    taglineEn: 'Visual Art & Painting',
    taglineEs: 'Arte visual y pintura',
    bioFr: '',
    bioEn: '',
    bioEs: '',
    socials: {},
    pricing: { studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 }, museum: { a4: 75, a3: 120, a3plus: 160, a2: 190 }, framePrice: 30 },
    prints: [
      { id: 'cr-001', titleFr: 'Cornelia Rose Art', titleEn: 'Cornelia Rose Art', titleEs: 'Cornelia Rose Art', limited: false },
      { id: 'cr-002', titleFr: 'Chrystaline Nectar', titleEn: 'Chrystaline Nectar', titleEs: 'Chrystaline Nectar', limited: false },
      { id: 'cr-003', titleFr: 'Cosmic Compass', titleEn: 'Cosmic Compass', titleEs: 'Cosmic Compass', limited: false },
      { id: 'cr-004', titleFr: 'Liongate', titleEn: 'Liongate', titleEs: 'Liongate', limited: false },
      { id: 'cr-005', titleFr: 'Owl Eyes', titleEn: 'Owl Eyes', titleEs: 'Owl Eyes', limited: false },
      { id: 'cr-006', titleFr: 'The Bear', titleEn: 'The Bear', titleEs: 'The Bear', limited: false },
      { id: 'cr-007', titleFr: 'Sans titre I', titleEn: 'Untitled I', titleEs: 'Sin titulo I', limited: false },
      { id: 'cr-008', titleFr: 'Sans titre II', titleEn: 'Untitled II', titleEs: 'Sin titulo II', limited: false },
      { id: 'cr-009', titleFr: 'Sans titre III', titleEn: 'Untitled III', titleEs: 'Sin titulo III', limited: false },
      { id: 'cr-010', titleFr: 'Sans titre IV', titleEn: 'Untitled IV', titleEs: 'Sin titulo IV', limited: false },
      { id: 'cr-011', titleFr: 'Sans titre V', titleEn: 'Untitled V', titleEs: 'Sin titulo V', limited: false },
      { id: 'cr-012', titleFr: 'Sans titre VI', titleEn: 'Untitled VI', titleEs: 'Sin titulo VI', limited: false },
      { id: 'cr-013', titleFr: 'Sans titre VII', titleEn: 'Untitled VII', titleEs: 'Sin titulo VII', limited: false },
    ],
    active: true,
    commissionRate: 0.5,
    sortOrder: 6,
  },
];

export default factories.createCoreController('api::artist.artist', ({ strapi }) => ({
  async seedMissing(ctx) {
    const results = [];
    for (const artistData of MISSING_ARTISTS) {
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
