const SITE_URL = 'https://massivemedias.com';

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Massive Medias',
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.jpg`,
    email: 'info@massivemedias.com',
    foundingDate: '2013',
    sameAs: [
      'https://instagram.com/massivemedias',
      'https://facebook.com/massivemedias',
    ],
  };
}

export function getLocalBusinessSchema(lang) {
  const descMap = {
    fr: 'Studio de production creative a Montreal. Impression fine art, stickers, sublimation, design graphique et developpement web.',
    en: 'Creative production studio in Montreal. Fine art printing, stickers, sublimation, graphic design and web development.',
    es: 'Estudio de produccion creativa en Montreal. Impresion fine art, stickers, sublimacion, diseno grafico y desarrollo web.',
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'Massive Medias',
    description: descMap[lang] || descMap.fr,
    url: SITE_URL,
    email: 'info@massivemedias.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Montreal',
      addressRegion: 'QC',
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 45.525,
      longitude: -73.6,
    },
    areaServed: {
      '@type': 'City',
      name: 'Montreal',
    },
    priceRange: '$$',
    image: `${SITE_URL}/og-image.jpg`,
    sameAs: [
      'https://instagram.com/massivemedias',
      'https://facebook.com/massivemedias',
    ],
  };
}

export function getFAQSchema(items) {
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
    image: image ? `${SITE_URL}${image}` : undefined,
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

export function getServiceSchema({ name, description, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${SITE_URL}${url}`,
    provider: {
      '@type': 'Organization',
      name: 'Massive Medias',
    },
    areaServed: {
      '@type': 'City',
      name: 'Montreal',
    },
  };
}
