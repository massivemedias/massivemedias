import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

const ArtistsContext = createContext(null);

export function ArtistsProvider({ children }) {
  const [artists, setArtists] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api.get('/artists', {
      params: {
        populate: {
          avatar: true,
          heroImage: true,
          printImages: true,
        },
        filters: { active: true },
        sort: 'sortOrder',
      }
    })
    .then(res => {
      if (!cancelled) {
        setArtists(res.data.data);
        setLoading(false);
      }
    })
    .catch((err) => {
      if (!cancelled) {
        console.warn('[Artists] API unavailable, using fallbacks', err?.response?.status || err.message);
        setLoading(false);
      }
    });

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
