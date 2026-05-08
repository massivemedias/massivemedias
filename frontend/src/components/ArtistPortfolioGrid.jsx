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
import { useMemo, useEffect, useState } from 'react';
import { Frame } from 'lucide-react';
import { useArtists } from '../hooks/useArtists';
import artistsDataLocal from '../data/artists';
import { useLang } from '../i18n/LanguageContext';

// Helper : derive l'orientation depuis les dimensions du frame (width > height
// = landscape). Pre-applique a chaque entry de MOCKUP_FRAMES pour eviter de
// recalculer a chaque render.
const orientOf = (w, h) => (w > h ? 'landscape' : 'portrait');

// Coords du cadre dans chaque mockup, en % (top, left, width, height) du
// conteneur carre + orientation derivee. Mesures par scan de la zone verte
// (#00FF00) de chaque fichier source dans /public/images/mockups/.
const MOCKUP_FRAMES = {
  bedroom_black:     { top: 21.6,  left: 41.49, width: 16.8,  height: 25.6,  orientation: orientOf(16.8,  25.6)  },
  bedroom_white:     { top: 19.89, left: 41.26, width: 18.51, height: 25.03, orientation: orientOf(18.51, 25.03) },
  dining_black:      { top: 24.69, left: 38.74, width: 22.51, height: 30.4,  orientation: orientOf(22.51, 30.4)  },
  dining_white:      { top: 24.23, left: 41.14, width: 17.94, height: 24.57, orientation: orientOf(17.94, 24.57) },
  living_room_black: { top: 19.09, left: 40.91, width: 19.66, height: 28.23, orientation: orientOf(19.66, 28.23) },
  living_room_white: { top: 26.29, left: 38.86, width: 20.69, height: 26.97, orientation: orientOf(20.69, 26.97) },
  office_black:      { top: 22.17, left: 38.63, width: 22.74, height: 31.66, orientation: orientOf(22.74, 31.66) },
  office_white:      { top: 30.74, left: 33.94, width: 33.49, height: 23.54, orientation: orientOf(33.49, 23.54) }, // landscape
  studio_black:      { top: 32,    left: 40,    width: 19.77, height: 27.77, orientation: orientOf(19.77, 27.77) },
  studio_white:      { top: 28.46, left: 38.51, width: 22.86, height: 31.66, orientation: orientOf(22.86, 31.66) },
  zen_black:         { top: 23.54, left: 38.17, width: 25.94, height: 35.77, orientation: orientOf(25.94, 35.77) },
  zen_white:         { top: 21.49, left: 38.4,  width: 23.2,  height: 33.49, orientation: orientOf(23.2,  33.49) },
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
    return shuffle(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsArtists]);

  // Map id -> 'landscape' | 'portrait' calcule en chargeant chaque image et
  // comparant naturalWidth vs naturalHeight. Permet de matcher orientation
  // œuvre <-> orientation cadre dans MOCKUP_FRAMES (le user a explicitement
  // demande ce match pour eviter object-fit:cover qui crop dur portrait dans
  // landscape ou inverse).
  const [orientations, setOrientations] = useState({});
  useEffect(() => {
    let cancelled = false;
    if (pool.length === 0) return;
    Promise.all(pool.map(s => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve([s.id, img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait']);
      };
      img.onerror = () => resolve([s.id, 'portrait']); // fallback portrait (majoritaire)
      img.src = s.image;
    }))).then(entries => {
      if (cancelled) return;
      const map = {};
      for (const [id, ori] of entries) map[id] = ori;
      setOrientations(map);
    });
    return () => { cancelled = true; };
  }, [pool]);

  // Slots avec matching strict : pour chaque case du SCENE_CYCLE, on prend
  // la premiere oeuvre du pool dont l'orientation matche celle du cadre. Si
  // pas dispo (pool epuise pour cette orientation), on tombe sur l'autre
  // pool ou un placeholder. Tant que `orientations` n'a pas charge, on fait
  // un best-effort en supposant tout en portrait (majoritaire en pratique).
  const slots = useMemo(() => {
    // Index global de consommation par orientation pour ne pas re-utiliser la
    // meme oeuvre dans 2 slots
    const consumed = new Set();
    const pickByOrientation = (target) => {
      for (const s of pool) {
        if (consumed.has(s.id)) continue;
        const ori = orientations[s.id] || 'portrait';
        if (ori === target) {
          consumed.add(s.id);
          return s;
        }
      }
      // Fallback : prend n'importe quelle oeuvre non consommee meme si
      // l'orientation ne match pas (mieux qu'un placeholder).
      for (const s of pool) {
        if (consumed.has(s.id)) continue;
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
  }, [pool, orientations, count]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {slots.map((s) => {
        const mockupKey = s.mockupKey;
        const frame = s.frame;
        const mockupUrl = `/images/mockups/${mockupKey}.webp`;

        const inner = (
          <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
            {/* Wrapper interne avec zoom 1.15 : rapproche visuellement le
                cadre de l'utilisateur (le cadre passe de ~20% a ~23% de la
                surface visible apres scale). transform-origin: center pour
                garder le cadre approximativement au milieu apres crop. Le
                parent overflow-hidden rogne les bords du mockup zoome. */}
            <div
              className="absolute inset-0"
              style={{ transform: 'scale(1.15)', transformOrigin: 'center' }}
            >
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
                  conteneur, pre-mesurees depuis la zone verte source.
                  L'orientation a ete pre-matchee dans le useMemo `slots`
                  pour eviter qu'object-fit:cover crop trop dur. */}
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
