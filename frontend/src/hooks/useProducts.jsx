import { createContext, useContext } from 'react';

const ProductsContext = createContext(null);

// Strapi desactive - donnees locales uniquement
export function ProductsProvider({ children }) {
  return (
    <ProductsContext.Provider value={{ products: null, loading: false }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext) || { products: null, loading: false };
}

export function useProduct() {
  return null;
}
