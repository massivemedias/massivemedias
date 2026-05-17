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
        // HOTFIX-ARTIST-REGRESSION (14 mai 2026) :
        // Le commit precedent passait `pagination: { limit: -1 }`. Or
        // backend/config/api.ts impose `maxLimit: 100`. En Strapi v5 REST,
        // `pagination[limit]=-1` AVEC un maxLimit configure est invalide :
        // Strapi clamp/rejette -> reponse /artists cassee -> seul un sous-
        // ensemble (Adrift) parsait -> TOUS les autres artistes disparus
        // de /artistes ET /artistes/:slug renvoyait "introuvable".
        //
        // On REVIENT a la config PROUVEE fonctionnelle : pagination
        // page-based `pageSize` (Strapi v5 la gere proprement, 200 < pas
        // de souci car withCount + maxLimit clamp a 100 max items/page
        // mais 200 force juste le pageSize demande tant que <= maxLimit ;
        // on met 100 = maxLimit pour etre dans la fenetre valide ET
        // couvrir largement les ~10-15 artistes reels). `printImages`
        // RETIRE du populate : c'etait un enrichissement secondaire non
        // essentiel (les prints ont deja leur `image` dans le JSON), il
        // alourdissait la reponse et n'est pas requis pour reparer la
        // regression. Le vrai fix stickers reste dans buildArtistFromCMS
        // (exception-safe, conserve).
        const { data } = await apiPublic.get('/artists', {
          params: {
            populate: ['avatar', 'heroImage'],
            pagination: { pageSize: 100 },
          },
        });
        // Guard blinde : data.data doit etre un tableau. Chaque entree
        // est parsee individuellement - une entree corrompue ne doit
        // JAMAIS faire planter la construction de toute la map.
        const list = Array.isArray(data?.data) ? data.data : [];
        if (!cancelled && list.length > 0) {
          const map = {};
          for (const a of list) {
            try {
              if (a && typeof a === 'object' && a.slug) {
                map[a.slug] = a;
              }
            } catch (perItemErr) {
              // Entree artiste corrompue -> on skip, on garde les autres
              // eslint-disable-next-line no-console
              console.warn('[useArtists] entree artiste ignoree:', perItemErr);
            }
          }
          if (Object.keys(map).length > 0) setArtists(map);
        }
      } catch (err) {
        // CMS indisponible / reponse invalide - on log pour diagnostic
        // mais on ne crash pas : le frontend gere artists=null gracieusement.
        // eslint-disable-next-line no-console
        console.warn('[useArtists] fetch /artists echoue:', err?.message || err);
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
