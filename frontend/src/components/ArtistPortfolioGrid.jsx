/**
 * ArtistPortfolioGrid (8 mai 2026)
 * ----------------------------------------------------------------
 * Grille de 8 (par defaut) prints aleatoires des artistes Massive Medias,
 * avec rendu "Fine Art encadre" (cadre noir / blanc alterne, mat blanc casse,
 * shadow). A chaque rechargement de page, les images sont re-piochees au
 * hasard pour dynamiser visuellement la section "Realisations" de la page
 * /services/prints. Les prints prives (private:true) sont exclus.
 *
 * Principe : on collecte TOUS les prints publics de TOUS les artistes (CMS
 * via useArtists + fallback local artistsData), shuffle, slice. Si la pool
 * a moins de N items disponibles on remplit avec des placeholders Fine Art
 * elegants pour garder la grille symetrique.
 *
 * Click sur un cadre = redirige vers la fiche artiste avec ?print=id pour
 * pre-selectionner l'oeuvre - bonus discoverabilite (l'utilisateur arrive
 * direct sur la page d'achat).
 */
import { useMemo } from 'react';
import { Frame } from 'lucide-react';
import { useArtists } from '../hooks/useArtists';
import artistsDataLocal from '../data/artists';
import { useLang } from '../i18n/LanguageContext';

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function ArtistPortfolioGrid({ count = 8 }) {
  const { artists: cmsArtists } = useArtists();
  const { tx } = useLang();

  // Pool d'images pickable : merge CMS + local, dedupe par id, exclut prives
  // et items sans image utilisable. La pool est calculee au mount uniquement
  // (deps minimales) - le random ne se relance pas a chaque re-render, mais
  // l'utilisateur voit du nouveau a chaque rechargement de page (F5).
  const samples = useMemo(() => {
    const all = [];
    const seen = new Set();

    const cmsArr = !cmsArtists
      ? []
      : Array.isArray(cmsArtists)
        ? cmsArtists
        : Object.values(cmsArtists);

    // Source 1 : CMS (priorite, contient les nouvelles oeuvres approuvees)
    for (const a of cmsArr) {
      for (const p of (a.prints || [])) {
        if (!p?.id || seen.has(p.id)) continue;
        if (p.private) continue;
        if (!p.image) continue;
        seen.add(p.id);
        all.push({
          id: p.id,
          image: p.image,
          title: p.titleFr || p.title || '',
          artistName: a.name || a.slug,
          artistSlug: a.slug,
        });
      }
    }

    // Source 2 : local artistsData (fallback si CMS down ou anciennes oeuvres
    // qui ne sont pas dans le CMS pour une raison quelconque)
    for (const slug of Object.keys(artistsDataLocal || {})) {
      const a = artistsDataLocal[slug];
      if (!a?.prints) continue;
      for (const p of a.prints) {
        if (!p?.id || seen.has(p.id)) continue;
        if (p.private) continue;
        if (!p.image) continue;
        seen.add(p.id);
        all.push({
          id: p.id,
          image: p.image,
          title: p.titleFr || p.title || '',
          artistName: a.name || slug,
          artistSlug: slug,
        });
      }
    }

    if (all.length === 0) return [];
    return shuffle(all).slice(0, count);
    // Note : `Math.random()` n'est pas dans les deps mais c'est intentionnel.
    // Le useMemo recompute QUAND cmsArtists/count change (load CMS) - chaque
    // mount/reload trigger un nouveau pick. Pas besoin de re-shuffle a chaque
    // render (lourd visuellement et inutile UX).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsArtists, count]);

  // Padder avec des placeholders si pool < count, pour garder la symetrie de
  // la grille (4x2 sur desktop, 2x4 sur mobile). Plus elegant qu'une grille
  // tronquee qui laisse des trous visuels.
  const slots = useMemo(() => {
    const result = [...samples];
    while (result.length < count) {
      result.push({ id: `placeholder-${result.length}`, placeholder: true });
    }
    return result;
  }, [samples, count]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {slots.map((s, idx) => {
        // Alternance de cadre : indices pairs = noir, impairs = blanc.
        // Patron 4x2 sur desktop : la rangee 1 alterne N/B/N/B et la rangee
        // 2 inverse en B/N/B/N -> motif damier visuellement satisfaisant.
        const isBlackFrame = (idx + Math.floor(idx / 4)) % 2 === 0;
        const frameClasses = isBlackFrame
          ? 'bg-[#0a0a0a] border-[#0a0a0a]'
          : 'bg-[#f5f5f0] border-[#f5f5f0]';

        return (
          <div
            key={s.id}
            className={`group relative aspect-square border-[10px] ${frameClasses} shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.5)]`}
          >
            {/* Mat board (passe-partout) blanc casse autour de l'image. */}
            <div className="w-full h-full bg-[#faf8f3] p-2 md:p-3 overflow-hidden">
              {s.placeholder ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-grey-muted/50 gap-2">
                  <Frame size={28} strokeWidth={1.2} />
                  <span className="text-[10px] uppercase tracking-[0.2em]">
                    {tx({ fr: 'Fine Art', en: 'Fine Art', es: 'Fine Art' })}
                  </span>
                </div>
              ) : (
                <a
                  href={`/artistes/${s.artistSlug}?print=${encodeURIComponent(s.id)}`}
                  className="block w-full h-full relative"
                  title={`${s.title} — ${s.artistName}`}
                >
                  <img
                    src={s.image}
                    alt={s.title || `Print ${s.artistName}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay au hover : nom oeuvre + artiste */}
                  <div className="absolute inset-0 flex flex-col items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 via-black/0 to-transparent p-3">
                    {s.title && (
                      <p className="text-white text-xs font-semibold truncate w-full text-center">
                        {s.title}
                      </p>
                    )}
                    <p className="text-white/80 text-[10px] uppercase tracking-wider truncate w-full text-center">
                      {s.artistName}
                    </p>
                  </div>
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ArtistPortfolioGrid;
