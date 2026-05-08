import { createContext, useContext, useState, useEffect } from 'react';
import { apiPublic } from '../services/api';

const ArtistsContext = createContext(null);

// FIX-PUBLIC-401 (7 mai 2026, refactor 8 mai 2026) : on utilise apiPublic
// (instance axios SANS intercepteur Authorization) au lieu de `api`. Strapi v5
// rejette en 401 tout Bearer Supabase JWT (pas un JWT Strapi natif) sur les
// routes CRUD core, meme publiques. Avant le fix : un admin loggue voyait
// /api/artists -> 401 -> cmsArtists=null -> fallback local stale et les nouvelles
// oeuvres approuvees etaient invisibles. apiPublic resout le probleme pour tous
// les endpoints CRUD publics du CMS (cf. services/api.js commentaire dedie).
export function ArtistsProvider({ children }) {
  const [artists, setArtists] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchArtists() {
      try {
        const { data } = await apiPublic.get('/artists', {
          params: {
            populate: ['avatar', 'heroImage'],
            pagination: { pageSize: 50 },
          },
        });
        if (!cancelled && data?.data) {
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
