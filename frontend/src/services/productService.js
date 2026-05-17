// FIX-PUBLIC-401 (8 mai 2026) : apiPublic (sans Bearer) pour /products. Cf.
// services/api.js pour le contexte. Sans ca, les admins loggues recevaient 401
// et le cache servait null silencieusement -> grilles de prix CMS invisibles.
import { apiPublic } from './api';

// Cache pour éviter les requêtes répétées pendant la même session
const cache = new Map();

export async function getProducts(category = null) {
  const cacheKey = `products-${category || 'all'}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const params = {
      'populate': 'images',
      'filters[active][$eq]': true,
      'sort': 'sortOrder:asc',
      // AUDIT-PAGINATION (14 mai 2026) : sans pagination explicite, Strapi
      // v5 applique son `defaultLimit: 25` (cf. backend/config/api.ts) ->
      // au-dela de 25 produits actifs, les suivants etaient invisibles en
      // boutique (troncature silencieuse, meme classe de bug que le
      // catalogue artiste). pageSize 100 = maxLimit configure (page-based,
      // valide en REST v5 contrairement a limit:-1 qui plante).
      'pagination[pageSize]': 100,
    };
    if (category) {
      params['filters[category][$eq]'] = category;
    }

    const { data } = await apiPublic.get('/products', { params });
    const products = data.data || [];
    cache.set(cacheKey, products);
    return products;
  } catch (err) {
    console.warn('Failed to fetch products:', err.message);
    return [];
  }
}

export async function getProduct(slug) {
  const cacheKey = `product-${slug}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const { data } = await apiPublic.get('/products', {
      params: {
        'filters[slug][$eq]': slug,
        'populate': 'images',
      },
    });
    const product = data.data?.[0] || null;
    if (product) cache.set(cacheKey, product);
    return product;
  } catch (err) {
    console.warn('Failed to fetch product:', err.message);
    return null;
  }
}

export function clearProductCache() {
  cache.clear();
}
