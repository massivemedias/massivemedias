// SEO-02 : hook qui resout les meta title/description en preferant le CMS
// au hardcoded.
//
// Pattern d'usage dans une page :
//   import { useSeoMeta } from '@/hooks/useSeoMeta';
//   const seo = useSeoMeta({
//     cmsSlug: 'merch',                         // slug du service-page CMS
//     fallback: {
//       titleFr: 'Merch personnalise Montreal | Massive Medias',
//       titleEn: 'Custom Merch Montreal | Massive Medias',
//       titleEs: 'Merchandising personalizado | Massive Medias',
//       descriptionFr: '...',
//       descriptionEn: '...',
//       descriptionEs: '...',
//     },
//   });
//   return <SEO title={seo.title} description={seo.description} />;
//
// Si le service-page CMS a sa composante seo remplie, elle gagne. Sinon
// le fallback hardcoded sert. Avantage : editer un meta ne demande plus
// un redeploy frontend, juste un save dans Strapi admin.

import { useServicePages } from './useServicePages';
import { useLang } from '../i18n/LanguageContext';

function pickLang(obj, lang, suffix) {
  if (!obj) return undefined;
  const key = `${suffix}${lang === 'fr' ? 'Fr' : lang === 'es' ? 'Es' : 'En'}`;
  return obj[key] || obj[`${suffix}En`] || obj[`${suffix}Fr`];
}

export function useSeoMeta({ cmsSlug, fallback }) {
  const { lang } = useLang();
  const { servicePages } = useServicePages() || {};

  // fallback hardcoded (toujours dispo)
  const localTitle = pickLang(fallback, lang, 'title');
  const localDescription = pickLang(fallback, lang, 'description');

  // CMS service-page[slug].seo prioritaire si rempli
  const page = Array.isArray(servicePages) ? servicePages.find((p) => p.slug === cmsSlug) : null;
  const cmsSeo = page?.seo;

  const title = pickLang(cmsSeo, lang, 'title') || localTitle;
  const description = pickLang(cmsSeo, lang, 'description') || localDescription;

  return {
    title,
    description,
    source: cmsSeo ? 'cms' : 'fallback',
  };
}
