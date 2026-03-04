const SITE_URL = 'https://massivemedias.com';

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Massive Medias',
    alternateName: 'Massive Medias Inc.',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og-image.jpg`,
      width: 1200,
      height: 630,
    },
    email: 'info@massivemedias.com',
    foundingDate: '2013',
    foundingLocation: 'Montreal, QC, Canada',
    description: 'Studio de production créative à Montréal spécialisé en impression fine art, stickers die-cut, sublimation textile, design graphique et développement web.',
    knowsLanguage: ['fr', 'en', 'es'],
    sameAs: [
      'https://instagram.com/massivemedias',
      'https://facebook.com/massivemedias',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Mile-End',
      addressLocality: 'Montreal',
      addressRegion: 'QC',
      postalCode: 'H2T',
      addressCountry: 'CA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@massivemedias.com',
      availableLanguage: ['French', 'English', 'Spanish'],
    },
  };
}

export function getLocalBusinessSchema(lang) {
  const descMap = {
    fr: 'Studio de production créative à Montréal spécialisé en impression fine art, stickers die-cut, sublimation textile, design graphique et développement web. Production locale au Mile-End depuis 2013.',
    en: 'Creative production studio in Montreal specializing in fine art printing, die-cut stickers, textile sublimation, graphic design and web development. Local production in Mile-End since 2013.',
    es: 'Estudio de producción creativa en Montreal especializado en impresión fine art, stickers troquelados, sublimación textil, diseño gráfico y desarrollo web. Producción local en Mile-End desde 2013.',
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'Massive Medias',
    description: descMap[lang] || descMap.fr,
    url: SITE_URL,
    email: 'info@massivemedias.com',
    image: `${SITE_URL}/og-image.jpg`,
    priceRange: '$$',
    currenciesAccepted: 'CAD',
    paymentAccepted: 'Credit Card, Debit Card, Apple Pay, Google Pay',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Mile-End',
      addressLocality: 'Montreal',
      addressRegion: 'QC',
      postalCode: 'H2T',
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 45.525,
      longitude: -73.6,
    },
    areaServed: [
      { '@type': 'City', name: 'Montreal' },
      { '@type': 'AdministrativeArea', name: 'Quebec' },
      { '@type': 'Country', name: 'Canada' },
    ],
    knowsLanguage: ['fr', 'en', 'es'],
    sameAs: [
      'https://instagram.com/massivemedias',
      'https://facebook.com/massivemedias',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Impression Fine Art' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Stickers Die-Cut' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Sublimation Textile' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Design Graphique' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Developpement Web' } },
      ],
    },
  };
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Massive Medias',
    description: 'Studio de production créative à Montréal',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['fr-CA', 'en-CA', 'es-MX'],
  };
}

export function getFAQSchema(items) {
  if (!items || items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

export function getProductSchema({ name, description, price, currency = 'CAD', image, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : undefined,
    url: `${SITE_URL}${url}`,
    brand: {
      '@type': 'Brand',
      name: 'Massive Medias',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Massive Medias',
      },
    },
  };
}

export function getServiceSchema({ name, description, url, priceRange }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${SITE_URL}${url}`,
    provider: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Massive Medias',
    },
    areaServed: [
      { '@type': 'City', name: 'Montreal' },
      { '@type': 'AdministrativeArea', name: 'Quebec' },
      { '@type': 'Country', name: 'Canada' },
    ],
    ...(priceRange ? { priceRange } : {}),
  };
}
