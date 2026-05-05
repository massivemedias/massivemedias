import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ArtistsContext = createContext(null);

export function ArtistsProvider({ children }) {
  const [artists, setArtists] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch CMS artistes pour les champs modifiables par l'artiste (avatar, bio, socials)
    // Les prints, prix et donnees structurelles restent dans artists.js (source de verite)
    let cancelled = false;
    async function fetchArtists() {
      try {
        const { data } = await api.get('/artists', {
          params: {
            populate: ['avatar', 'heroImage'],
            pagination: { pageSize: 50 },
          },
        });
        if (!cancelled && data?.data) {
          // Indexer par slug
          const map = {};
          for (const a of data.data) {
            if (a.slug) map[a.slug] = a;
          }
          setArtists(map);
        }
      } catch {
        // CMS indisponible - on utilise les donnees locales
      }
      if (!cancelled) setLoading(false);
    }
    fetchArtists();
    return () => { cancelled = true; };
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
