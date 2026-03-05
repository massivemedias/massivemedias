import { createContext, useContext } from 'react';

const ServicePagesContext = createContext(null);

// Strapi desactive - donnees locales uniquement
export function ServicePagesProvider({ children }) {
  return (
    <ServicePagesContext.Provider value={{ servicePages: null, loading: false }}>
      {children}
    </ServicePagesContext.Provider>
  );
}

export function useServicePages() {
  return useContext(ServicePagesContext);
}
