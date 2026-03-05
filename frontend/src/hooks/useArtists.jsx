import { createContext, useContext } from 'react';

const ArtistsContext = createContext(null);

// Strapi desactive - donnees locales uniquement
export function ArtistsProvider({ children }) {
  return (
    <ArtistsContext.Provider value={{ artists: null, loading: false }}>
      {children}
    </ArtistsContext.Provider>
  );
}

export function useArtists() {
  return useContext(ArtistsContext) || { artists: null, loading: false };
}
