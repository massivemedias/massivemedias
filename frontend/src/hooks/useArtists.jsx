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
        // FIX-401-CMS (3 mai 2026) : route publique dediee /artists-cms-list
        // qui retourne uniquement les champs CMS modifiables (avatar, heroImage,
        // taglines) sans auth. Avant, on tapait sur /api/artists auto-generee
        // Strapi qui retourne 401 (collection protegee par defaut, et nos
        // tokens Supabase ne sont pas reconnus comme tokens Strapi user).
        const { data } = await api.get('/artists-cms-list');
        if (!cancelled && data?.data) {
          // Indexer par slug
          const map = {};
          for (const a of data.data) {
            if (a.slug) map[a.slug] = a;
          }
          setArtists(map);
        }
      } catch {
        // Backend indispo - fallback silencieux sur artists.js hardcoded
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
