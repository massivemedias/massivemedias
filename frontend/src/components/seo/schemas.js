const SITE_URL = 'https://massivemedias.com';

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Massive',
    alternateName: 'Massive Inc.',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og-image.jpg`,
      width: 1200,
      height: 630,
    },
    email: 'massivemedias@gmail.com',
    foundingDate: '2022',
    foundingLocation: 'Montreal, QC, Canada',
    description: 'Studio de production créative à Montréal spécialisé en impression fine art, stickers die-cut, sublimation textile, design graphique et développement web.',
    knowsLanguage: ['fr', 'en', 'es'],
    sameAs: [
      'https://instagram.com/massivemedias',
      'https://facebook.com/massivemedias',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '7049 rue Saint-Urbain',
      addressLocality: 'Montréal',
      addressRegion: 'QC',
      postalCode: 'H2R 2E6',
      addressCountry: 'CA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'massivemedias@gmail.com',
      availableLanguage: ['French', 'English', 'Spanish'],
    },
  };
}

export function getLocalBusinessSchema(lang) {
  const descMap = {
    fr: 'Studio de production créative à Montréal spécialisé en impression fine art, stickers die-cut, sublimation textile, design graphique et développement web. Production locale au Mile-End.',
    en: 'Creative production studio in Montreal specializing in fine art printing, die-cut stickers, textile sublimation, graphic design and web development. Local production in Mile-End.',
    es: 'Estudio de producción creativa en Montreal especializado en impresión fine art, stickers troquelados, sublimación textil, diseño gráfico y desarrollo web. Producción local en Mile-End.',
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'Massive',
    description: descMap[lang] || descMap.fr,
    url: SITE_URL,
    email: 'massivemedias@gmail.com',
    image: `${SITE_URL}/og-image.jpg`,
    priceRange: '$$',
    currenciesAccepted: 'CAD',
    paymentAccepted: 'Credit Card, Debit Card, Apple Pay, Google Pay',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '7049 rue Saint-Urbain',
      addressLocality: 'Montréal',
      addressRegion: 'QC',
      postalCode: 'H2R 2E6',
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
    name: 'Massive',
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
      name: 'Massive',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Massive',
      },
    },
  };
}

export function getArtistSchema({ name, slug, description, image, prints = [] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${SITE_URL}/artistes/${slug}`,
    image: image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : undefined,
    description,
    brand: { '@type': 'Brand', name: 'Massive' },
  };

  if (prints.length > 0) {
    schema.makesOffer = prints.slice(0, 10).map(p => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'VisualArtwork',
        name: p.title || p.titleEn || p.titleFr,
        image: p.fullImage ? (p.fullImage.startsWith('http') ? p.fullImage : `${SITE_URL}${p.fullImage}`) : undefined,
        artMedium: 'Fine Art Print',
        creator: { '@type': 'Person', name },
      },
      priceCurrency: 'CAD',
      price: p.unique ? (p.price || 85) : 15,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Massive' },
    }));
  }

  return schema;
}

export function getProductWithVariantsSchema({ name, description, url, image, lowPrice, highPrice, currency = 'CAD' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : undefined,
    url: `${SITE_URL}${url}`,
    brand: { '@type': 'Brand', name: 'Massive' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: currency,
      lowPrice: lowPrice,
      highPrice: highPrice,
      offerCount: 5,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Massive' },
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
      name: 'Massive',
    },
    areaServed: [
      { '@type': 'City', name: 'Montreal' },
      { '@type': 'AdministrativeArea', name: 'Quebec' },
      { '@type': 'Country', name: 'Canada' },
    ],
    ...(priceRange ? { priceRange } : {}),
  };
}
