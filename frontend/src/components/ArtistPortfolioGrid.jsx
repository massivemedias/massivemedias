/**
 * ArtistPortfolioGrid (8 mai 2026, v3 absolute positioning)
 * ------------------------------------------------------------------------
 * Grille de 8 prints aleatoires des artistes Massive Medias affiches DANS
 * les vrais mockups environnementaux (bedroom, dining, living_room, office,
 * studio, zen) en versions black et white.
 *
 * Architecture v3 (8 mai 2026) : on REMPLACE le canvas chroma-key d'InstantMockup
 * (v2) par un simple positioning absolu sur l'œuvre, avec coords pre-mesurees
 * pour chaque mockup. Plus simple, plus rapide (pas de getImageData/drawImage),
 * affichage immediat sans delai de chargement async.
 *
 * Les coords MOCKUP_FRAMES ont ete extraites en parsant la zone verte (#00FF00)
 * de chaque mockup via canvas - cf. script de calibration. Elles sont en %
 * du conteneur carre (875x875 sur les sources).
 *
 * Click sur un mockup = navigation /artistes/:slug?print=:id pour pre-selection
 * de l'œuvre.
 */
import { useMemo } from 'react';
import { Frame } from 'lucide-react';
import { useArtists } from '../hooks/useArtists';
import artistsDataLocal from '../data/artists';
import { useLang } from '../i18n/LanguageContext';

// Coords du cadre dans chaque mockup, en % (top, left, width, height) du
// conteneur carre. Mesures par scan de la zone verte (#00FF00) de chaque
// fichier source dans /public/images/mockups/. Si on ajoute un nouveau
// mockup, refaire le scan via l'outil de calibration.
const MOCKUP_FRAMES = {
  bedroom_black:     { top: 21.6,  left: 41.49, width: 16.8,  height: 25.6 },
  bedroom_white:     { top: 19.89, left: 41.26, width: 18.51, height: 25.03 },
  dining_black:      { top: 24.69, left: 38.74, width: 22.51, height: 30.4 },
  dining_white:      { top: 24.23, left: 41.14, width: 17.94, height: 24.57 },
  living_room_black: { top: 19.09, left: 40.91, width: 19.66, height: 28.23 },
  living_room_white: { top: 26.29, left: 38.86, width: 20.69, height: 26.97 },
  office_black:      { top: 22.17, left: 38.63, width: 22.74, height: 31.66 },
  office_white:      { top: 30.74, left: 33.94, width: 33.49, height: 23.54 },
  studio_black:      { top: 32,    left: 40,    width: 19.77, height: 27.77 },
  studio_white:      { top: 28.46, left: 38.51, width: 22.86, height: 31.66 },
  zen_black:         { top: 23.54, left: 38.17, width: 25.94, height: 35.77 },
  zen_white:         { top: 21.49, left: 38.4,  width: 23.2,  height: 33.49 },
};

// Cycle deterministe : 8 combinaisons mockup (sceneId + frameColor) qui
// melange les 6 scenes et les 2 couleurs de cadre - varietes visuelles
// cote a cote dans la grille 4x2 desktop.
const SCENE_CYCLE = [
  'living_room_black',
  'bedroom_white',
  'studio_black',
  'dining_white',
  'zen_black',
  'office_white',
  'living_room_white',
  'bedroom_black',
];

// Image fallback pour les slots sans œuvre. Le print Massive Medias generique
// existe deja dans le projet et s'integre proprement dans n'importe quel cadre.
const FALLBACK_IMAGE = '/images/mockup-massive-print.webp';

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

  // Pool d'images : merge CMS + local, dedupe par id, exclut prives
  const samples = useMemo(() => {
    const all = [];
    const seen = new Set();

    const cmsArr = !cmsArtists
      ? []
      : Array.isArray(cmsArtists)
        ? cmsArtists
        : Object.values(cmsArtists);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsArtists, count]);

  const slots = useMemo(() => {
    const result = [...samples];
    while (result.length < count) {
      result.push({
        id: `placeholder-${result.length}`,
        placeholder: true,
        image: FALLBACK_IMAGE,
      });
    }
    return result;
  }, [samples, count]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {slots.map((s, idx) => {
        const mockupKey = SCENE_CYCLE[idx % SCENE_CYCLE.length];
        const frame = MOCKUP_FRAMES[mockupKey];
        const mockupUrl = `/images/mockups/${mockupKey}.webp`;

        const inner = (
          <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
            {/* Mockup en background : photo de la piece avec son cadre vide */}
            <img
              src={mockupUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
            {/* Œuvre injectee dans le cadre du mockup. Coords en % du
                conteneur, pre-mesurees depuis la zone verte source. */}
            <img
              src={s.image}
              alt={s.placeholder ? '' : (s.title || `Print ${s.artistName}`)}
              loading="lazy"
              decoding="async"
              style={{
                position: 'absolute',
                top: `${frame.top}%`,
                left: `${frame.left}%`,
                width: `${frame.width}%`,
                height: `${frame.height}%`,
                objectFit: 'cover',
              }}
            />
            {/* Overlay au hover : titre + artiste */}
            {!s.placeholder && (
              <div className="absolute inset-0 flex flex-col items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 via-black/0 to-transparent p-3 pointer-events-none">
                {s.title && (
                  <p className="text-white text-xs md:text-sm font-semibold truncate w-full text-center">
                    {s.title}
                  </p>
                )}
                <p className="text-white/80 text-[10px] uppercase tracking-wider truncate w-full text-center">
                  {s.artistName}
                </p>
              </div>
            )}
            {s.placeholder && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur text-white text-[9px] uppercase tracking-widest flex items-center gap-1">
                <Frame size={10} />
                {tx({ fr: 'Fine Art', en: 'Fine Art', es: 'Fine Art' })}
              </div>
            )}
          </div>
        );

        return s.placeholder ? (
          <div key={s.id} className="group">{inner}</div>
        ) : (
          <a
            key={s.id}
            href={`/artistes/${s.artistSlug}?print=${encodeURIComponent(s.id)}`}
            title={`${s.title} — ${s.artistName}`}
            className="group block focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}

export default ArtistPortfolioGrid;
