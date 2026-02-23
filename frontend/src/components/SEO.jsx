import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';

const SITE_NAME = 'Massive Medias';
const SITE_URL = 'https://massivemedias.com';
const DEFAULT_OG_IMAGE = '/og-image.jpg';

export default function SEO({
  title,
  description,
  ogImage,
  ogType = 'website',
  noindex = false,
  jsonLd,
  breadcrumbs,
}) {
  const { lang } = useLang();
  const location = useLocation();

  const canonicalUrl = `${SITE_URL}${location.pathname}`;
  const ogImageUrl = ogImage
    ? (ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`)
    : `${SITE_URL}${DEFAULT_OG_IMAGE}`;
  const locale = lang === 'fr' ? 'fr_CA' : 'en_CA';
  const alternateLocale = lang === 'fr' ? 'en_CA' : 'fr_CA';

  const jsonLdScripts = [];

  if (breadcrumbs && breadcrumbs.length > 0) {
    jsonLdScripts.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.name,
        ...(crumb.url ? { item: `${SITE_URL}${crumb.url}` } : {}),
      })),
    });
  }

  if (jsonLd) {
    if (Array.isArray(jsonLd)) {
      jsonLdScripts.push(...jsonLd);
    } else {
      jsonLdScripts.push(jsonLd);
    }
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hreflang="fr" href={canonicalUrl} />
      <link rel="alternate" hreflang="en" href={canonicalUrl} />
      <link rel="alternate" hreflang="x-default" href={canonicalUrl} />

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content={alternateLocale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {jsonLdScripts.map((schema, i) => (
        <script key={`jsonld-${i}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
