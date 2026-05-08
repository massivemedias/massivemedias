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

async function autoSlugify(event: { params: { data: Record<string, unknown> } }) {
  const { data } = event.params;
  if (!data) return;
  // Genere le slug depuis name SEULEMENT si l'admin ne l'a pas fourni.
  // Si data.slug est explicitement '', le sanitize plus bas le considere comme
  // non-fourni et on regenere depuis name (evite slugs vides en BDD).
  if (!data.slug || (typeof data.slug === 'string' && !data.slug.trim())) {
    if (data.name && typeof data.name === 'string') {
      data.slug = slugify(data.name);
    }
  } else if (typeof data.slug === 'string') {
    // L'admin a fourni un slug : on le normalise quand meme (lowercase, sans
    // espace ni accent) pour eviter "Gallium " -> "gallium-" ou "Galliüm" ->
    // "galliüm". Conservation des tirets manuels intentionnels.
    data.slug = slugify(data.slug);
  }
}

export default {
  beforeCreate: async (event: any) => {
    await autoSlugify(event);
    if (bilingual.beforeCreate) await bilingual.beforeCreate(event);
  },
  beforeUpdate: async (event: any) => {
    await autoSlugify(event);
    if (bilingual.beforeUpdate) await bilingual.beforeUpdate(event);
  },
};
