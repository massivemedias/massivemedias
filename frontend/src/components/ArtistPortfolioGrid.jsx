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
import artistsDataLocal from '../data/artistPricing';
import { useLang } from '../i18n/LanguageContext';

// Helper : derive l'orientation depuis les dimensions du frame (width > height
// = landscape). Pre-applique a chaque entry de MOCKUP_FRAMES pour eviter de
// recalculer a chaque render.
const orientOf = (w, h) => (w > h ? 'landscape' : 'portrait');

// Coords du cadre dans chaque mockup, en % (top, left, width, height) du
// conteneur carre + orientation derivee. Mesures par scan de la zone verte
// (#00FF00) de chaque fichier source dans /public/images/mockups/.
//
// SQUARE-MOCKUP (11 mai 2026) : ajout de gallery_square_black / _white
// (cssOnly=true, pas d'asset webp requis). Cadre 1:1 centre sur un mur de
// galerie gradient avec ombre. Permet aux oeuvres carrees (Gallium Wheel
// of Time / Fire Body / etc.) d'avoir un mockup approprie sans
// letterboxing.
const MOCKUP_FRAMES = {
  bedroom_black:        { top: 21.6,  left: 41.49, width: 16.8,  height: 25.6,  orientation: orientOf(16.8,  25.6)  },
  bedroom_white:        { top: 19.89, left: 41.26, width: 18.51, height: 25.03, orientation: orientOf(18.51, 25.03) },
  dining_black:         { top: 24.69, left: 38.74, width: 22.51, height: 30.4,  orientation: orientOf(22.51, 30.4)  },
  dining_white:         { top: 24.23, left: 41.14, width: 17.94, height: 24.57, orientation: orientOf(17.94, 24.57) },
  living_room_black:    { top: 19.09, left: 40.91, width: 19.66, height: 28.23, orientation: orientOf(19.66, 28.23) },
  living_room_white:    { top: 26.29, left: 38.86, width: 20.69, height: 26.97, orientation: orientOf(20.69, 26.97) },
  office_black:         { top: 22.17, left: 38.63, width: 22.74, height: 31.66, orientation: orientOf(22.74, 31.66) },
  office_white:         { top: 30.74, left: 33.94, width: 33.49, height: 23.54, orientation: orientOf(33.49, 23.54) }, // landscape
  studio_black:         { top: 32,    left: 40,    width: 19.77, height: 27.77, orientation: orientOf(19.77, 27.77) },
  studio_white:         { top: 28.46, left: 38.51, width: 22.86, height: 31.66, orientation: orientOf(22.86, 31.66) },
  zen_black:            { top: 23.54, left: 38.17, width: 25.94, height: 35.77, orientation: orientOf(25.94, 35.77) },
  zen_white:            { top: 21.49, left: 38.4,  width: 23.2,  height: 33.49, orientation: orientOf(23.2,  33.49) },
  // cssOnly: rendu sans asset webp - mur gradient + cadre 1:1 centre.
  gallery_square_black: { cssOnly: true, frameColor: 'black', orientation: 'square' },
  gallery_square_white: { cssOnly: true, frameColor: 'white', orientation: 'square' },
};

// Cycle deterministe. Inclut maintenant 2 slots gallery_square pour donner
// aux oeuvres carrees une place visible dans la grille (sinon pickByOrientation
// les remappe sur des portrait avec letterboxing dur).
const SCENE_CYCLE = [
  'living_room_black',
  'gallery_square_white',
  'bedroom_white',
  'studio_black',
  'gallery_square_black',
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

  // Pool COMPLETE (pas de slice ici - on slice apres matching d'orientation).
  // Memo sur cmsArtists uniquement -> 1 shuffle par mount/load CMS.
  const pool = useMemo(() => {
    const all = [];
    const seen = new Set();

    const cmsArr = !cmsArtists
      ? []
      : Array.isArray(cmsArtists)
        ? cmsArtists
        : Object.values(cmsArtists);

    // SQUARE-MIGRATION (11 mai 2026) : on lit l'orientation DIRECTEMENT depuis
    // la base de donnees (CMS Strapi `orientation` ou fallback local). Plus
    // d'async `new Image().onload` -> evite la course condition, evite les
    // problemes CORS (`naturalWidth` parfois bloque cross-origin) et evite
    // surtout le mismatch fichier-vs-realite (cas Gallium "Wheel of Time"
    // 1550x1554 dont le filename suggere autre chose).
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
          orientation: p.orientation || 'portrait',
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
          orientation: p.orientation || 'portrait',
        });
      }
    }
    return shuffle(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsArtists]);

  // SQUARE-MIGRATION (11 mai 2026) : ERADICATION DU CODE ASYNC.
  // Avant : useEffect chargeait chaque image avec `new Image()` et lisait
  // `naturalWidth/naturalHeight` pour deviner l'orientation -> 3 problemes :
  //   1. Race condition : 1er render avec orientations={} -> tous mappes
  //      en 'portrait' -> oeuvres carrees stuckees dans cadres portrait avec
  //      letterboxing dur (cas Gallium Wheel of Time).
  //   2. Filename pas fiable : "wheel-of-time-20x20.webp" (carre) mais le
  //      naturalWidth/Height pouvait ne jamais charger (CORS, lazy, etc.).
  //   3. Pas de support 'square' du tout : la formule renvoyait soit
  //      'landscape' soit 'portrait', jamais 'square'.
  // Maintenant : on lit `s.orientation` qui vient directement du CMS Strapi
  // (champ `orientation` peuple par le script de migration). Synchrone,
  // deterministe, source de verite unique.

  // Slots avec matching strict orientation : pour chaque case du SCENE_CYCLE,
  // on prend la premiere oeuvre du pool dont `orientation` matche celle du
  // cadre. Filtrage strict : un cadre 'square' (gallery_square) ne recevra
  // QUE des oeuvres `orientation === 'square'`, idem pour landscape/portrait.
  // Si epuise -> placeholder Massive Medias (preferable au letterboxing).
  const slots = useMemo(() => {
    const consumed = new Set();
    const pickByOrientation = (target) => {
      // Pass 1 : match strict d'orientation.
      for (const s of pool) {
        if (consumed.has(s.id)) continue;
        if (s.orientation === target) {
          consumed.add(s.id);
          return s;
        }
      }
      // Pass 2 (UNIQUEMENT pour cadres non-carres) : fallback sur n'importe
      // quelle oeuvre non consommee plutot que d'afficher un placeholder.
      // Pour les cadres 'square' on REFUSE le fallback - un portrait dans
      // un cadre carre = letterboxing visible, on prefere le placeholder.
      if (target === 'square') return null;
      for (const s of pool) {
        if (consumed.has(s.id)) continue;
        if (s.orientation === 'square') continue; // jamais consommer un carre pour un cadre non-carre
        consumed.add(s.id);
        return s;
      }
      return null;
    };

    const result = [];
    for (let i = 0; i < count; i++) {
      const mockupKey = SCENE_CYCLE[i % SCENE_CYCLE.length];
      const frame = MOCKUP_FRAMES[mockupKey];
      const picked = pickByOrientation(frame.orientation);
      if (picked) {
        result.push({ ...picked, mockupKey, frame });
      } else {
        result.push({
          id: `placeholder-${i}`,
          placeholder: true,
          image: FALLBACK_IMAGE,
          mockupKey,
          frame,
        });
      }
    }
    return result;
  }, [pool, count]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {slots.map((s) => {
        const mockupKey = s.mockupKey;
        const frame = s.frame;
        const mockupUrl = `/images/mockups/${mockupKey}.webp`;

        // SQUARE-MIGRATION (11 mai 2026) : rendu CSS-only pour les cadres
        // gallery_square (pas d'asset webp). Un mur de galerie en gradient +
        // un cadre 1:1 centre + ombre. Le frameColor (black/white) varie le
        // contour du cadre. Permet d'afficher proprement les oeuvres carrees
        // sans letterboxing dur dans un cadre portrait.
        const isCssOnly = frame.cssOnly === true;
        const isLightFrame = frame.frameColor === 'white';

        const inner = (
          <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
            {isCssOnly ? (
              // === MOCKUP CSS-ONLY (gallery_square) ===
              // Mur gradient + cadre 1:1 centre. Pas de scale ici car le
              // cadre est deja dimensionne pour ~70% du conteneur.
              <div
                className="absolute inset-0"
                style={{
                  background: isLightFrame
                    ? 'linear-gradient(180deg, #f4f1ec 0%, #e8e2d8 100%)'
                    : 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
                }}
              >
                {/* Plinthe stylisee pour donner de la profondeur au mur. */}
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: '12%',
                    background: isLightFrame
                      ? 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.10) 100%)'
                      : 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.45) 100%)',
                  }}
                />
                {/* Cadre 1:1 centre, ~68% du conteneur. */}
                <div
                  className="absolute"
                  style={{
                    top: '16%',
                    left: '16%',
                    width: '68%',
                    height: '68%',
                    padding: '6%',
                    background: isLightFrame ? '#ffffff' : '#0a0a0a',
                    borderRadius: '2px',
                    boxShadow: isLightFrame
                      ? '0 10px 30px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12)'
                      : '0 12px 36px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.30)',
                  }}
                >
                  {/* Passepartout (matte) pour ajouter une bordure douce. */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      padding: '4%',
                      background: isLightFrame ? '#fafafa' : '#f5f5f0',
                      boxSizing: 'border-box',
                    }}
                  >
                    <img
                      src={s.image}
                      alt={s.placeholder ? '' : (s.title || `Print ${s.artistName}`)}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // === MOCKUP PHOTO (bedroom / studio / etc.) ===
              // Wrapper interne avec zoom 1.15 : rapproche visuellement le
              // cadre de l'utilisateur. Le parent overflow-hidden rogne les
              // bords du mockup zoome.
              <div
                className="absolute inset-0"
                style={{ transform: 'scale(1.15)', transformOrigin: 'center' }}
              >
                <img
                  src={mockupUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                  aria-hidden="true"
                />
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
              </div>
            )}
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
