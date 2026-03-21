import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CMS produits DESACTIVE - les donnees locales (products.js, services.js) sont la source de verite.
    // Le CMS overridait les prix et descriptions avec des donnees obsoletes.
    // Quand le CMS sera nettoye et fiable, reactiver ici.
    setLoading(false);
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
