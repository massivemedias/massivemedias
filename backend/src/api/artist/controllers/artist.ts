import { factories } from '@strapi/strapi';

// Prints locaux a synchroniser vers le CMS (source: artists.js)
const LOCAL_PRINTS: Record<string, any[]> = {
  'adrift': [
    { id: 'adrift-001', titleFr: 'Print 1', titleEn: 'Print 1', titleEs: 'Print 1', limited: false },
    { id: 'adrift-002', titleFr: 'Print 2', titleEn: 'Print 2', titleEs: 'Print 2', limited: false },
    { id: 'adrift-003', titleFr: 'Print 3', titleEn: 'Print 3', titleEs: 'Print 3', limited: false },
    { id: 'adrift-004', titleFr: 'Print 4', titleEn: 'Print 4', titleEs: 'Print 4', limited: false },
    { id: 'adrift-005', titleFr: 'Print 5', titleEn: 'Print 5', titleEs: 'Print 5', limited: false },
    { id: 'adrift-006', titleFr: 'Print 6', titleEn: 'Print 6', titleEs: 'Print 6', limited: false },
    { id: 'adrift-007', titleFr: 'Print 7', titleEn: 'Print 7', titleEs: 'Print 7', limited: false },
    { id: 'adrift-008', titleFr: 'Print 8', titleEn: 'Print 8', titleEs: 'Print 8', limited: false },
    { id: 'adrift-009', titleFr: 'Print 9', titleEn: 'Print 9', titleEs: 'Print 9', limited: false },
    { id: 'adrift-010', titleFr: 'Print 10', titleEn: 'Print 10', titleEs: 'Print 10', limited: false },
    { id: 'adrift-011', titleFr: 'Print 11', titleEn: 'Print 11', titleEs: 'Print 11', limited: false },
    { id: 'adrift-012', titleFr: 'Print 12', titleEn: 'Print 12', titleEs: 'Print 12', limited: false },
    { id: 'adrift-013', titleFr: 'Print 13', titleEn: 'Print 13', titleEs: 'Print 13', limited: false },
    { id: 'adrift-014', titleFr: 'Print 14', titleEn: 'Print 14', titleEs: 'Print 14', limited: false },
  ],
  'mok': [
    { id: 'mok-001', titleFr: 'Metro Montreal', titleEn: 'Montreal Metro', titleEs: 'Metro Montreal', limited: false },
    { id: 'mok-002', titleFr: 'Ciel urbain', titleEn: 'Urban sky', titleEs: 'Cielo urbano', limited: false },
    { id: 'mok-003', titleFr: 'Foret boreal', titleEn: 'Boreal forest', titleEs: 'Bosque boreal', limited: false },
    { id: 'mok-004', titleFr: 'Neon alley', titleEn: 'Neon alley', titleEs: 'Callejon neon', limited: false },
    { id: 'mok-005', titleFr: 'Hiver', titleEn: 'Winter', titleEs: 'Invierno', limited: false },
    { id: 'mok-006', titleFr: 'Reflets', titleEn: 'Reflections', titleEs: 'Reflejos', limited: false },
    { id: 'mok-007', titleFr: 'Downtown', titleEn: 'Downtown', titleEs: 'Centro', limited: false },
    { id: 'mok-008', titleFr: 'Lumiere bleue', titleEn: 'Blue light', titleEs: 'Luz azul', limited: false },
    { id: 'mok-009', titleFr: 'Train de nuit', titleEn: 'Night train', titleEs: 'Tren nocturno', limited: false },
    { id: 'mok-010', titleFr: 'Graffiti', titleEn: 'Graffiti', titleEs: 'Graffiti', limited: false },
    { id: 'mok-011', titleFr: 'Pont Jacques-Cartier', titleEn: 'Jacques-Cartier Bridge', titleEs: 'Puente Jacques-Cartier', limited: false },
    { id: 'mok-012', titleFr: 'Vitrine', titleEn: 'Storefront', titleEs: 'Vitrina', limited: false },
  ],
  'psyqu33n': [
    { id: 'psyqu33n-001', titleFr: "Accepter ses parts d'ombres et de lumiere", titleEn: 'Embracing Shadow and Light', titleEs: 'Aceptar sus partes de sombra y luz', limited: false },
    { id: 'psyqu33n-002', titleFr: 'Croire en quelque chose de plus grand', titleEn: 'Believing in Something Greater', titleEs: 'Creer en algo mas grande', limited: false },
    { id: 'psyqu33n-003', titleFr: "L'archetype de la reine", titleEn: 'The Queen Archetype', titleEs: 'El arquetipo de la reina', limited: false },
    { id: 'psyqu33n-004', titleFr: 'La douleur derriere le masque', titleEn: 'The Pain Behind the Mask', titleEs: 'El dolor detras de la mascara', limited: false },
    { id: 'psyqu33n-005', titleFr: 'La purge', titleEn: 'The Purge', titleEs: 'La purga', limited: false },
    { id: 'psyqu33n-006', titleFr: 'Le masque de la femme forte', titleEn: 'The Mask of the Strong Woman', titleEs: 'La mascara de la mujer fuerte', limited: false },
    { id: 'psyqu33n-007', titleFr: 'Le Vampire', titleEn: 'The Vampire', titleEs: 'El Vampiro', limited: false },
    { id: 'psyqu33n-008', titleFr: 'Nefertiti', titleEn: 'Nefertiti', titleEs: 'Nefertiti', limited: false },
    { id: 'psyqu33n-009', titleFr: 'Rabbit', titleEn: 'Rabbit', titleEs: 'Conejo', limited: false },
    { id: 'psyqu33n-010', titleFr: 'Renard', titleEn: 'Fox', titleEs: 'Zorro', limited: false },
    { id: 'psyqu33n-011', titleFr: 'The Rebirth', titleEn: 'The Rebirth', titleEs: 'El Renacimiento', limited: false },
    { id: 'psyqu33n-012', titleFr: 'Trouver le divin en soi', titleEn: 'Finding the Divine Within', titleEs: 'Encontrar lo divino en uno mismo', limited: false },
    { id: 'psyqu33n-013', titleFr: 'Trusting the Process', titleEn: 'Trusting the Process', titleEs: 'Confiar en el proceso', limited: false },
  ],
  'maudite-machine': [
    { id: 'gemini-002', titleFr: 'Affiche 1', titleEn: 'Poster 1', titleEs: 'Afiche 1', limited: false, unique: true, fixedFormat: 'a2', fixedTier: 'studio', noFrame: true },
    { id: 'gemini-004', titleFr: 'Affiche 2', titleEn: 'Poster 2', titleEs: 'Afiche 2', limited: false, unique: true, fixedFormat: 'a2', fixedTier: 'studio', noFrame: true },
  ],
};

export default factories.createCoreController('api::artist.artist', ({ strapi }) => ({
  async syncPrints(ctx) {
    const results = [];
    for (const [slug, localPrints] of Object.entries(LOCAL_PRINTS)) {
      const artists = await strapi.documents('api::artist.artist').findMany({
        filters: { slug: { $eq: slug } },
        limit: 1,
      });
      if (!artists || artists.length === 0) {
        results.push({ slug, status: 'not_found' });
        continue;
      }
      const artist = artists[0] as any;
      const cmsPrints = Array.isArray(artist.prints) ? artist.prints : [];

      // Merge: garder les prints CMS existants, ajouter les manquants du local
      const cmsIds = new Set(cmsPrints.map((p: any) => p.id));
      const merged = [...cmsPrints];
      let added = 0;
      for (const lp of localPrints) {
        if (!cmsIds.has(lp.id)) {
          merged.push(lp);
          added++;
        }
      }

      if (added > 0) {
        await strapi.documents('api::artist.artist').update({
          documentId: artist.documentId,
          data: { prints: merged },
          status: 'published',
        });
        results.push({ slug, status: 'synced', before: cmsPrints.length, after: merged.length, added });
      } else {
        results.push({ slug, status: 'already_synced', count: cmsPrints.length });
      }
    }
    ctx.body = { data: results };
  },
}));
