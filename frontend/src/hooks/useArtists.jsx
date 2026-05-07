import { createContext, useContext, useState, useEffect } from 'react';

const ArtistsContext = createContext(null);

// FIX-PUBLIC-401 (7 mai 2026) : on N'UTILISE PAS l'instance `api` ici car
// elle injecte automatiquement le Bearer Supabase JWT via son intercepteur
// request (cf. services/api.js). Strapi v5 rejette en 401 tout Bearer qui
// n'est pas un JWT Strapi natif, MEME pour les routes publiques. Resultat
// observe : un admin loggue voyait /api/artists -> 401 -> cmsArtists=null
// -> ArtisteDetail tombait sur artistsData[slug] local (22 prints) et les
// nouvelles oeuvres approuvees (uniquement en BDD CMS) etaient invisibles.
//
// Solution : fetch natif sans header d'auth -> Strapi traite la requete en
// "Public" role qui a permission de read sur api::artist.artist par default.
// Les guests non-loggues n'etaient pas impactes (pas de Bearer chez eux).
const API_BASE = 'https://massivemedias-api.onrender.com/api';

export function ArtistsProvider({ children }) {
  const [artists, setArtists] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch CMS artistes pour les champs modifiables par l'artiste (avatar, bio, socials)
    // Les prints, prix et donnees structurelles restent dans artists.js (source de verite)
    let cancelled = false;
    async function fetchArtists() {
      try {
        const url = `${API_BASE}/artists?populate%5B%5D=avatar&populate%5B%5D=heroImage&pagination%5BpageSize%5D=50`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
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
