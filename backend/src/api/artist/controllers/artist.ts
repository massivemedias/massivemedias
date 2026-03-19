import { factories } from '@strapi/strapi';

// Mapping local: slug -> prints avec images correctes
const LOCAL_PRINTS: Record<string, any[]> = {
  'mok': [
    { id: 'mok-001', titleFr: 'Metro Montreal', titleEn: 'Montreal Metro', image: '/images/thumbs/prints/Mok1.webp', fullImage: '/images/prints/Mok1.webp', limited: false },
  ],
  'quentin-delobel': Array.from({ length: 20 }, (_, i) => ({
    id: `qd-${String(i + 1).padStart(3, '0')}`, titleFr: `Photo ${i + 1}`, titleEn: `Photo ${i + 1}`,
    image: `/images/thumbs/prints/QuentinDelobel${i + 1}.webp`, fullImage: `/images/prints/QuentinDelobel${i + 1}.webp`, limited: false,
  })),
  'psyqu33n': [
    { id: 'psyqu33n-001', titleFr: "Accepter ses parts d'ombres et de lumiere", titleEn: 'Embracing Shadow and Light', image: '/images/thumbs/prints/Psyqu33n1.webp', fullImage: '/images/prints/Psyqu33n1.webp', limited: false },
    { id: 'psyqu33n-002', titleFr: 'Croire en quelque chose de plus grand', titleEn: 'Believing in Something Greater', image: '/images/thumbs/prints/Psyqu33n2.webp', fullImage: '/images/prints/Psyqu33n2.webp', limited: false },
    { id: 'psyqu33n-003', titleFr: "L'archetype de la reine", titleEn: 'The Queen Archetype', image: '/images/thumbs/prints/Psyqu33n3.webp', fullImage: '/images/prints/Psyqu33n3.webp', limited: false },
    { id: 'psyqu33n-004', titleFr: 'La douleur derriere le masque', titleEn: 'The Pain Behind the Mask', image: '/images/thumbs/prints/Psyqu33n4.webp', fullImage: '/images/prints/Psyqu33n4.webp', limited: false },
    { id: 'psyqu33n-005', titleFr: 'La purge', titleEn: 'The Purge', image: '/images/thumbs/prints/Psyqu33n5.webp', fullImage: '/images/prints/Psyqu33n5.webp', limited: false },
    { id: 'psyqu33n-006', titleFr: 'Le masque de la femme forte', titleEn: 'The Mask of the Strong Woman', image: '/images/thumbs/prints/Psyqu33n6.webp', fullImage: '/images/prints/Psyqu33n6.webp', limited: false },
    { id: 'psyqu33n-007', titleFr: 'Le Vampire', titleEn: 'The Vampire', image: '/images/thumbs/prints/Psyqu33n7.webp', fullImage: '/images/prints/Psyqu33n7.webp', limited: false },
    { id: 'psyqu33n-008', titleFr: 'Nefertiti', titleEn: 'Nefertiti', image: '/images/thumbs/prints/Psyqu33n8.webp', fullImage: '/images/prints/Psyqu33n8.webp', limited: false },
    { id: 'psyqu33n-009', titleFr: 'Rabbit', titleEn: 'Rabbit', image: '/images/thumbs/prints/Psyqu33n9.webp', fullImage: '/images/prints/Psyqu33n9.webp', limited: false },
    { id: 'psyqu33n-010', titleFr: 'Renard', titleEn: 'Fox', image: '/images/thumbs/prints/Psyqu33n10.webp', fullImage: '/images/prints/Psyqu33n10.webp', limited: false },
    { id: 'psyqu33n-011', titleFr: 'The Rebirth', titleEn: 'The Rebirth', image: '/images/thumbs/prints/Psyqu33n11.webp', fullImage: '/images/prints/Psyqu33n11.webp', limited: false },
    { id: 'psyqu33n-012', titleFr: 'Trouver le divin en soi', titleEn: 'Finding the Divine Within', image: '/images/thumbs/prints/Psyqu33n12.webp', fullImage: '/images/prints/Psyqu33n12.webp', limited: false },
    { id: 'psyqu33n-013', titleFr: 'Trusting the Process', titleEn: 'Trusting the Process', image: '/images/thumbs/prints/Psyqu33n13.webp', fullImage: '/images/prints/Psyqu33n13.webp', limited: false },
  ],
  'no-pixl': [
    { id: 'nopixl-001', titleFr: 'Red Room', titleEn: 'Red Room', image: '/images/thumbs/prints/NoPixl1.webp', fullImage: '/images/prints/NoPixl1.webp', limited: false },
    { id: 'nopixl-002', titleFr: 'Blue Beams', titleEn: 'Blue Beams', image: '/images/thumbs/prints/NoPixl2.webp', fullImage: '/images/prints/NoPixl2.webp', limited: false },
    { id: 'nopixl-004', titleFr: 'Behind the Decks', titleEn: 'Behind the Decks', image: '/images/thumbs/prints/NoPixl4.webp', fullImage: '/images/prints/NoPixl4.webp', limited: false },
    { id: 'nopixl-005', titleFr: 'Hands Up', titleEn: 'Hands Up', image: '/images/thumbs/prints/NoPixl5.webp', fullImage: '/images/prints/NoPixl5.webp', limited: false },
    { id: 'nopixl-006', titleFr: 'Laser V', titleEn: 'Laser V', image: '/images/thumbs/prints/NoPixl6.webp', fullImage: '/images/prints/NoPixl6.webp', limited: false },
    { id: 'nopixl-007', titleFr: 'Backstage', titleEn: 'Backstage', image: '/images/thumbs/prints/NoPixl7.webp', fullImage: '/images/prints/NoPixl7.webp', limited: false },
    { id: 'nopixl-008', titleFr: 'Holy Priest', titleEn: 'Holy Priest', image: '/images/thumbs/prints/NoPixl8.webp', fullImage: '/images/prints/NoPixl8.webp', limited: false },
    { id: 'nopixl-009', titleFr: 'Holy Priest II', titleEn: 'Holy Priest II', image: '/images/thumbs/prints/NoPixl9.webp', fullImage: '/images/prints/NoPixl9.webp', limited: false },
    { id: 'nopixl-010', titleFr: 'Holy Priest III', titleEn: 'Holy Priest III', image: '/images/thumbs/prints/NoPixl10.webp', fullImage: '/images/prints/NoPixl10.webp', limited: false },
    { id: 'nopixl-011', titleFr: 'Baie Eternite', titleEn: 'Eternity Bay', image: '/images/thumbs/prints/NoPixl11.webp', fullImage: '/images/prints/NoPixl11.webp', limited: false },
    { id: 'nopixl-012', titleFr: 'Cap Gaspe', titleEn: 'Cape Gaspe', image: '/images/thumbs/prints/NoPixl12.webp', fullImage: '/images/prints/NoPixl12.webp', limited: false },
    { id: 'nopixl-013', titleFr: 'Horizon', titleEn: 'Horizon', image: '/images/thumbs/prints/NoPixl13.webp', fullImage: '/images/prints/NoPixl13.webp', limited: false },
    { id: 'nopixl-014', titleFr: 'Rocher Perce', titleEn: 'Perce Rock', image: '/images/thumbs/prints/NoPixl14.webp', fullImage: '/images/prints/NoPixl14.webp', limited: false },
    { id: 'nopixl-015', titleFr: 'Falaises', titleEn: 'Cliffs', image: '/images/thumbs/prints/NoPixl15.webp', fullImage: '/images/prints/NoPixl15.webp', limited: false },
    { id: 'nopixl-016', titleFr: 'Plongeurs', titleEn: 'Divers', image: '/images/thumbs/prints/NoPixl16.webp', fullImage: '/images/prints/NoPixl16.webp', limited: false },
  ],
  'cornelia-rose': [
    { id: 'cr-001', titleFr: 'Cornelia Rose Art', titleEn: 'Cornelia Rose Art', image: '/images/thumbs/prints/CorneliaRose1.webp', fullImage: '/images/prints/CorneliaRose1.webp', limited: false },
    { id: 'cr-002', titleFr: 'Chrystaline Nectar', titleEn: 'Chrystaline Nectar', image: '/images/thumbs/prints/CorneliaRose2.webp', fullImage: '/images/prints/CorneliaRose2.webp', limited: false },
    { id: 'cr-003', titleFr: 'Cosmic Compass', titleEn: 'Cosmic Compass', image: '/images/thumbs/prints/CorneliaRose3.webp', fullImage: '/images/prints/CorneliaRose3.webp', limited: false },
    { id: 'cr-004', titleFr: 'Liongate', titleEn: 'Liongate', image: '/images/thumbs/prints/CorneliaRose4.webp', fullImage: '/images/prints/CorneliaRose4.webp', limited: false },
    { id: 'cr-005', titleFr: 'Owl Eyes', titleEn: 'Owl Eyes', image: '/images/thumbs/prints/CorneliaRose5.webp', fullImage: '/images/prints/CorneliaRose5.webp', limited: false },
    { id: 'cr-006', titleFr: 'The Bear', titleEn: 'The Bear', image: '/images/thumbs/prints/CorneliaRose6.webp', fullImage: '/images/prints/CorneliaRose6.webp', limited: false },
    { id: 'cr-007', titleFr: 'Sans titre I', titleEn: 'Untitled I', image: '/images/thumbs/prints/CorneliaRose7.webp', fullImage: '/images/prints/CorneliaRose7.webp', limited: false },
    { id: 'cr-008', titleFr: 'Sans titre II', titleEn: 'Untitled II', image: '/images/thumbs/prints/CorneliaRose8.webp', fullImage: '/images/prints/CorneliaRose8.webp', limited: false },
    { id: 'cr-009', titleFr: 'Sans titre III', titleEn: 'Untitled III', image: '/images/thumbs/prints/CorneliaRose9.webp', fullImage: '/images/prints/CorneliaRose9.webp', limited: false },
    { id: 'cr-010', titleFr: 'Sans titre IV', titleEn: 'Untitled IV', image: '/images/thumbs/prints/CorneliaRose10.webp', fullImage: '/images/prints/CorneliaRose10.webp', limited: false },
    { id: 'cr-011', titleFr: 'Sans titre V', titleEn: 'Untitled V', image: '/images/thumbs/prints/CorneliaRose11.webp', fullImage: '/images/prints/CorneliaRose11.webp', limited: false },
    { id: 'cr-012', titleFr: 'Sans titre VI', titleEn: 'Untitled VI', image: '/images/thumbs/prints/CorneliaRose12.webp', fullImage: '/images/prints/CorneliaRose12.webp', limited: false },
    { id: 'cr-013', titleFr: 'Sans titre VII', titleEn: 'Untitled VII', image: '/images/thumbs/prints/CorneliaRose13.webp', fullImage: '/images/prints/CorneliaRose13.webp', limited: false },
  ],
  'adrift': [
    { id: 'adrift-001', titleFr: 'Print 1', titleEn: 'Print 1', image: '/images/thumbs/prints/Adrift1.webp', fullImage: '/images/prints/Adrift1.webp', limited: false },
    { id: 'adrift-002', titleFr: 'Print 2', titleEn: 'Print 2', image: '/images/thumbs/prints/Adrift2.webp', fullImage: '/images/prints/Adrift2.webp', limited: false },
    { id: 'adrift-003', titleFr: 'Print 3', titleEn: 'Print 3', image: '/images/thumbs/prints/Adrift5.webp', fullImage: '/images/prints/Adrift5.webp', limited: false },
    { id: 'adrift-004', titleFr: 'Print 4', titleEn: 'Print 4', image: '/images/thumbs/prints/Adrift6.webp', fullImage: '/images/prints/Adrift6.webp', limited: false },
    { id: 'adrift-005', titleFr: 'Print 5', titleEn: 'Print 5', image: '/images/thumbs/prints/Adrift7.webp', fullImage: '/images/prints/Adrift7.webp', limited: false },
    { id: 'adrift-006', titleFr: 'Print 6', titleEn: 'Print 6', image: '/images/thumbs/prints/Adrift8.webp', fullImage: '/images/prints/Adrift8.webp', limited: false },
    { id: 'adrift-007', titleFr: 'Print 7', titleEn: 'Print 7', image: '/images/thumbs/prints/Adrift9.webp', fullImage: '/images/prints/Adrift9.webp', limited: false },
    { id: 'adrift-008', titleFr: 'Print 8', titleEn: 'Print 8', image: '/images/thumbs/prints/Adrift10.webp', fullImage: '/images/prints/Adrift10.webp', limited: false },
    { id: 'adrift-009', titleFr: 'Print 9', titleEn: 'Print 9', image: '/images/thumbs/prints/Adrift11.webp', fullImage: '/images/prints/Adrift11.webp', limited: false },
    { id: 'adrift-010', titleFr: 'Print 10', titleEn: 'Print 10', image: '/images/thumbs/prints/Adrift12.webp', fullImage: '/images/prints/Adrift12.webp', limited: false },
    { id: 'adrift-011', titleFr: 'Print 11', titleEn: 'Print 11', image: '/images/thumbs/prints/Adrift13.webp', fullImage: '/images/prints/Adrift13.webp', limited: false },
    { id: 'adrift-012', titleFr: 'Print 12', titleEn: 'Print 12', image: '/images/thumbs/prints/Adrift14.webp', fullImage: '/images/prints/Adrift14.webp', limited: false },
    { id: 'adrift-013', titleFr: 'Print 13', titleEn: 'Print 13', image: '/images/thumbs/prints/Adrift15.webp', fullImage: '/images/prints/Adrift15.webp', limited: false },
    { id: 'adrift-014', titleFr: 'Print 14', titleEn: 'Print 14', image: '/images/thumbs/prints/Adrift16.webp', fullImage: '/images/prints/Adrift16.webp', limited: false },
  ],
  'maudite-machine': [
    { id: 'gemini-002', titleFr: 'Affiche 1', titleEn: 'Poster 1', image: '/images/thumbs/prints/Gemini2.webp', fullImage: '/images/prints/Gemini2.webp', limited: false, unique: true, fixedFormat: 'a2', fixedTier: 'studio', noFrame: true },
    { id: 'gemini-004', titleFr: 'Affiche 2', titleEn: 'Poster 2', image: '/images/thumbs/prints/Gemini4.webp', fullImage: '/images/prints/Gemini4.webp', limited: false, unique: true, fixedFormat: 'a2', fixedTier: 'studio', noFrame: true },
  ],
};

export default factories.createCoreController('api::artist.artist', ({ strapi }) => ({
  // POST /artists/sync-images - One-shot fix for CMS prints without images
  async syncImages(ctx) {
    const results: any[] = [];

    try {
      const artists = await strapi.documents('api::artist.artist' as any).findMany({ limit: 100 });

      for (const artist of artists as any[]) {
        const slug = artist.slug;
        const localPrints = LOCAL_PRINTS[slug];
        if (!localPrints) {
          results.push({ slug, action: 'skip', reason: 'not in local mapping' });
          continue;
        }

        const cmsPrints: any[] = Array.isArray(artist.prints) ? [...artist.prints] : [];
        const localById: Record<string, any> = {};
        for (const lp of localPrints) localById[lp.id] = lp;

        const newPrints: any[] = [];
        const changes: string[] = [];

        for (const cp of cmsPrints) {
          const hasImage = cp.image && String(cp.image).trim();
          const isSupabase = hasImage && String(cp.image).includes('supabase');

          if (isSupabase) {
            newPrints.push(cp);
            changes.push(`KEEP(supabase): ${cp.id}`);
          } else if (localById[cp.id]) {
            const local = localById[cp.id];
            const updated = { ...cp, image: local.image, fullImage: local.fullImage };
            for (const key of ['unique', 'fixedFormat', 'fixedTier', 'noFrame', 'limited']) {
              if (local[key] !== undefined) updated[key] = local[key];
            }
            newPrints.push(updated);
            changes.push(`FIX: ${cp.id}`);
          } else {
            changes.push(`REMOVE: ${cp.id} (${cp.titleFr})`);
          }
        }

        // Add local prints not in CMS
        const cmsIds = new Set(cmsPrints.map((p: any) => p.id));
        for (const lp of localPrints) {
          if (!cmsIds.has(lp.id)) {
            newPrints.push(lp);
            changes.push(`ADD: ${lp.id}`);
          }
        }

        if (changes.length === 0) {
          results.push({ slug, action: 'ok', prints: newPrints.length });
          continue;
        }

        await strapi.documents('api::artist.artist' as any).update({
          documentId: artist.documentId,
          data: { prints: newPrints },
          status: 'published',
        });

        results.push({ slug, action: 'updated', prints: newPrints.length, changes });
      }

      ctx.body = { success: true, results };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },
}));
