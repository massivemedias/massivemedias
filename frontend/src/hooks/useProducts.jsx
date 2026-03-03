import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api.get('/products', {
      params: {
        populate: 'images',
        'filters[active][$eq]': true,
        sort: 'sortOrder:asc',
      }
    })
    .then(res => {
      if (!cancelled) {
        setProducts(res.data.data || []);
        setLoading(false);
      }
    })
    .catch((err) => {
      if (!cancelled) {
        console.warn('[Products] API unavailable, using fallbacks', err?.response?.status || err.message);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext) || { products: null, loading: false };
}

/**
 * Get a single product by slug or category from the CMS products
 */
export function useProduct(slugOrCategory) {
  const { products } = useProducts();
  if (!products || !slugOrCategory) return null;
  return products.find(p => p.slug === slugOrCategory || p.category === slugOrCategory) || null;
}
