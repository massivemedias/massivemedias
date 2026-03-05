import { createContext, useContext } from 'react';

const SiteContentContext = createContext(null);

// Strapi desactive - donnees locales uniquement
export function SiteContentProvider({ children }) {
  return (
    <SiteContentContext.Provider value={{ content: null, loading: false }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  return useContext(SiteContentContext) || { content: null, loading: false };
}
