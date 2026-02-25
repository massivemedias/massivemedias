import api from './api';

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
    };
    if (category) {
      params['filters[category][$eq]'] = category;
    }

    const { data } = await api.get('/products', { params });
    const products = data.data || [];
    cache.set(cacheKey, products);
    return products;
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return [];
  }
}

export async function getProduct(slug) {
  const cacheKey = `product-${slug}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const { data } = await api.get('/products', {
      params: {
        'filters[slug][$eq]': slug,
        'populate': 'images',
      },
    });
    const product = data.data?.[0] || null;
    if (product) cache.set(cacheKey, product);
    return product;
  } catch (err) {
    console.error('Failed to fetch product:', err);
    return null;
  }
}

export function clearProductCache() {
  cache.clear();
}
