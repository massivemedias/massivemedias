/**
 * Artist lifecycles
 * ---------------------------------------------------------------------
 * 2 hooks combines a chaque create/update :
 *
 *   1. autoSlugify : si l'admin n'a pas explicitement fourni un slug, on
 *      le derive du nom (slugify : minuscules, sans accents, espaces -> tirets).
 *      Critique pour les sous-domaines artistes (`<slug>.massivemedias.com`)
 *      qui matchent le slug en BDD via getSubdomainSlug() cote frontend.
 *
 *   2. bilingual auto-translate : si bioFr/taglineFr/etc. sont fournis et
 *      les variantes En/Es vides, traduit automatiquement (cf.
 *      utils/bilingual-lifecycle.ts).
 */
import { createBilingualLifecycle } from '../../../../utils/bilingual-lifecycle';
import { slugify } from '../../../../utils/slugify';

const bilingual = createBilingualLifecycle();

// CREATE-only : si l'admin n'a pas fourni de slug, on le derive du name.
// Si fourni, on normalise.
async function autoSlugifyCreate(event: { params: { data: Record<string, unknown> } }) {
  const { data } = event.params;
  if (!data) return;
  if (!data.slug || (typeof data.slug === 'string' && !data.slug.trim())) {
    if (data.name && typeof data.name === 'string') {
      data.slug = slugify(data.name);
    }
  } else if (typeof data.slug === 'string') {
    data.slug = slugify(data.slug);
  }
}

// UPDATE : on NE TOUCHE PLUS au slug si pas explicitement fourni.
// FIX SLUG-DRIFT (10 mai 2026) : avant ce fix, beforeUpdate appliquait
// autoSlugify identique a beforeCreate. Resultat : changer le name d'un
// artiste existant (ex: "Gallium" -> "Gallium Beaumer") regenerait le
// slug en "gallium-beaumer" - ce qui cassait :
//   - Les sous-domaines deja configures sur Cloudflare (gallium.massivemedias.com)
//   - Les liens internes (footer, sitemap, indexation Google deja faite)
//   - Le merge frontend artists.js[slug] qui ne matchait plus
// Maintenant : si on ne fournit PAS de slug dans le payload update, on
// preserve le slug existant en BDD (Strapi laisse le champ inchange).
// Si on fournit un slug, on le normalise (slugify) comme avant.
async function autoSlugifyUpdate(event: { params: { data: Record<string, unknown> } }) {
  const { data } = event.params;
  if (!data) return;
  if (data.slug && typeof data.slug === 'string') {
    data.slug = slugify(data.slug);
  }
  // Pas de fallback sur data.name - on preserve le slug existant.
}

export default {
  beforeCreate: async (event: any) => {
    await autoSlugifyCreate(event);
    if (bilingual.beforeCreate) await bilingual.beforeCreate(event);
  },
  beforeUpdate: async (event: any) => {
    await autoSlugifyUpdate(event);
    if (bilingual.beforeUpdate) await bilingual.beforeUpdate(event);
  },
};
