import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ArtistsContext = createContext(null);

export function ArtistsProvider({ children }) {
  const [artists, setArtists] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CMS artistes DESACTIVE - les donnees locales (artists.js) sont la source de verite.
    // Le CMS overridait les prix, les prints, les bios avec des donnees obsoletes.
    // Quand le CMS sera nettoye et fiable, reactiver ici.
    setLoading(false);
  }, []);

  return (
    <ArtistsContext.Provider value={{ artists, loading }}>
      {children}
    </ArtistsContext.Provider>
  );
}

export function useArtists() {
  return useContext(ArtistsContext) || { artists: null, loading: false };
}
