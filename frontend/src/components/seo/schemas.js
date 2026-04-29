const SITE_URL = 'https://massivemedias.com';

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Massive Medias',
    alternateName: 'Massive',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og-image.jpg`,
      width: 1200,
      height: 630,
    },
    email: 'massivemedias@gmail.com',
    telephone: '+15146531423',
    foundingDate: '2022',
    foundingLocation: 'Montreal, QC, Canada',
    description: 'Massive Medias - Imprimeur a Montreal specialise en impression fine art, stickers personnalises, sublimation textile, design graphique, developpement web et SEO. Production locale au Mile-End.',
    knowsLanguage: ['fr', 'en', 'es'],
    sameAs: [
      'https://instagram.com/massivemedias',
      'https://facebook.com/massivemedias',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '5338 rue Marquette',
      addressLocality: 'Montreal',
      addressRegion: 'QC',
      postalCode: 'H2J 3Z3',
      addressCountry: 'CA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+15146531423',
      email: 'massivemedias@gmail.com',
      availableLanguage: ['French', 'English', 'Spanish'],
    },
  };
}

export function getLocalBusinessSchema(lang) {
  const descMap = {
    fr: 'Massive Medias - Imprimeur a Montreal. Impression fine art, stickers personnalises die-cut, sublimation textile, design graphique, developpement web et webmastering. Studio de production creative au Mile-End. Print Montreal, stickers Montreal.',
    en: 'Massive Medias - Printer in Montreal. Fine art printing, custom die-cut stickers, textile sublimation, graphic design, web development and webmastering. Creative production studio in Mile-End. Print Montreal, stickers Montreal.',
    es: 'Massive Medias - Impresor en Montreal. Impresion fine art, stickers personalizados troquelados, sublimacion textil, diseno grafico, desarrollo web y webmastering. Estudio de produccion creativa en Mile-End.',
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'Massive Medias',
    alternateName: 'Massive',
    description: descMap[lang] || descMap.fr,
    url: SITE_URL,
    telephone: '+15146531423',
    email: 'massivemedias@gmail.com',
    image: `${SITE_URL}/og-image.jpg`,
    priceRange: '$$',
    currenciesAccepted: 'CAD',
    paymentAccepted: 'Credit Card, Debit Card, Apple Pay, Google Pay',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '5338 rue Marquette',
      addressLocality: 'Montreal',
      addressRegion: 'QC',
      postalCode: 'H2J 3Z3',
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 45.5335,
      longitude: -73.5734,
    },
    hasMap: 'https://www.google.com/maps/place/5338+Rue+Marquette,+Montr%C3%A9al,+QC+H2J+3Z3',
    areaServed: [
      { '@type': 'City', name: 'Montreal' },
      { '@type': 'AdministrativeArea', name: 'Quebec' },
      { '@type': 'Country', name: 'Canada' },
    ],
    serviceType: [
      'Impression fine art',
      'Stickers personnalises',
      'Sublimation textile',
      'Design graphique',
      'Developpement web',
      'SEO',
      'Webmastering',
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    knowsLanguage: ['fr', 'en', 'es'],
    sameAs: [
      'https://instagram.com/massivemedias',
      'https://facebook.com/massivemedias',
    ],
    potentialAction: {
      '@type': 'CommunicateAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'tel:+15146531423',
        actionPlatform: 'http://schema.org/TelephoneAction',
      },
      name: 'Appeler Massive Medias',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Impression Fine Art' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Stickers Die-Cut Personnalises' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Sublimation Textile' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Design Graphique' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Developpement Web' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'SEO et Webmastering' } },
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

// SEO-LOCAL (28 avril 2026) : Service schema enrichi.
//
// Ajout des champs serviceType (categorie schema.org), category (texte libre),
// keywords (mots-cles a haute intention d'achat locale), image (visuel hero),
// audience et hasOfferCatalog (sous-services). Tous optionnels - retro-compat
// avec les appels existants qui passent uniquement {name, description, url}.
export function getServiceSchema({
  name,
  description,
  url,
  priceRange,
  serviceType,
  category,
  keywords,
  image,
  audience,
  offers,
  subServices,
}) {
  const fullImage = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : undefined;

  const schema = {
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
  };

  if (priceRange) schema.priceRange = priceRange;
  if (serviceType) schema.serviceType = serviceType;
  if (category) schema.category = category;
  if (keywords && keywords.length > 0) {
    schema.keywords = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  }
  if (fullImage) schema.image = fullImage;
  if (audience) {
    schema.audience = {
      '@type': 'Audience',
      audienceType: audience,
    };
  }
  if (offers) {
    schema.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'CAD',
      ...offers,
      seller: { '@type': 'Organization', name: 'Massive Medias' },
      availability: 'https://schema.org/InStock',
    };
  }
  if (subServices && subServices.length > 0) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: `${name} - Sous-services`,
      itemListElement: subServices.map(s => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s },
      })),
    };
  }

  return schema;
}
