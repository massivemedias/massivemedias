import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await api.get('/products', {
          params: {
            'populate': 'images',
            'filters[active][$eq]': true,
            'sort': 'sortOrder:asc',
            'pagination[pageSize]': 100,
          },
        });
        setProducts(data.data || []);
      } catch (err) {
        console.warn('CMS products unavailable:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
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

export function useProduct(slug) {
  const { products } = useProducts();
  if (!products || !slug) return null;
  return products.find(p => p.slug === slug) || null;
}
