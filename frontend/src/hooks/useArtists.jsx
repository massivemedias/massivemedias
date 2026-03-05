import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ArtistsContext = createContext(null);

export function ArtistsProvider({ children }) {
  const [artists, setArtists] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtists() {
      try {
        const { data } = await api.get('/artists', {
          params: {
            'populate': 'avatar,heroImage,printImages',
            'filters[active][$eq]': true,
            'sort': 'sortOrder:asc',
            'pagination[pageSize]': 50,
          },
        });
        setArtists(data.data || []);
      } catch (err) {
        console.error('CMS artists unavailable:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchArtists();
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
