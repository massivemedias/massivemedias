/**
 * ArtistPortfolioGrid (8 mai 2026, v2 vrais mockups)
 * ------------------------------------------------------------------------
 * Grille de 8 (par defaut) prints aleatoires des artistes Massive Medias,
 * affiches DANS les vrais mockups environnementaux du dossier
 * /public/images/mockups/ (bedroom, dining, living_room, office, studio,
 * zen, en versions black et white). Le rendu utilise <InstantMockup> qui
 * fait du chroma-key sur la zone verte (#00FF00) de chaque mockup pour
 * clipper l'oeuvre pile dans le cadre, perspective comprise.
 *
 * v2 (8 mai 2026) : remplace les fausses bordures CSS noir/blanc de v1
 * (refusees par le client) par les VRAIS mockups deja presents dans le
 * projet. La logique de randomisation et le filtre prive sont conserves.
 *
 * Click sur un mockup = navigation vers la fiche artiste avec ?print=id
 * pre-selectionne pour conversion directe.
 */
import { useMemo } from 'react';
import { Frame } from 'lucide-react';
import { useArtists } from '../hooks/useArtists';
import artistsDataLocal from '../data/artists';
import { useLang } from '../i18n/LanguageContext';
import InstantMockup from './InstantMockup';

// Cycle deterministe de 8 combinaisons mockup (sceneId + frameColor) - alterne
// les 6 scenes disponibles + les 2 couleurs de cadre pour un mix visuel varie
// (pas 2 fois la meme piece cote a cote dans la grille 4x2 desktop).
//
// Disponibles dans /public/images/mockups/ :
//   bedroom_black, bedroom_white, dining_black, dining_white,
//   living_room_black, living_room_white, office_black, office_white,
//   studio_black, studio_white, zen_black, zen_white
const SCENE_CYCLE = [
  { sceneId: 'living_room', frameColor: 'black' },
  { sceneId: 'bedroom',     frameColor: 'white' },
  { sceneId: 'studio',      frameColor: 'black' },
  { sceneId: 'dining',      frameColor: 'white' },
  { sceneId: 'zen',         frameColor: 'black' },
  { sceneId: 'office',      frameColor: 'white' },
  { sceneId: 'living_room', frameColor: 'white' },
  { sceneId: 'bedroom',     frameColor: 'black' },
];

// Image fallback pour les slots sans œuvre disponible. Existe dans le
// projet (/public/images/mockup-massive-print.webp) - asset Massive Medias
// generique qui s'integre proprement dans le chroma-key vert des mockups.
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

  // Pool d'images pickable : merge CMS + local, dedupe par id, exclut prives
  // et items sans image utilisable.
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

    // Source 2 : local artistsData (fallback offline / oeuvres pre-CMS)
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
  // Math.random sciemment hors deps : on veut un re-shuffle au reload de la
  // page (cmsArtists change apres le fetch initial -> deuxieme shuffle apres
  // l'arrivee du CMS), pas un re-shuffle a chaque re-render parent.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsArtists, count]);

  // Padder avec des placeholders si pool < count (pour preserver la symetrie)
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
        const scene = SCENE_CYCLE[idx % SCENE_CYCLE.length];
        const content = (
          <div className="relative group block w-full overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl">
            {/* InstantMockup rend un canvas avec la photo de la piece +
                l'oeuvre clippee dans la zone verte (chroma-key + perspective).
                C'est le MEME composant que sur la fiche artiste, donc rendu
                identique a celui que verrait le client en page de produit. */}
            <InstantMockup
              imageUrl={s.image}
              sceneId={scene.sceneId}
              frameColor={scene.frameColor}
              className="block w-full h-auto"
            />
            {/* Overlay au hover : titre oeuvre + artiste (sauf placeholder). */}
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
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/40 backdrop-blur text-white text-[9px] uppercase tracking-widest flex items-center gap-1">
                <Frame size={10} />
                {tx({ fr: 'Fine Art', en: 'Fine Art', es: 'Fine Art' })}
              </div>
            )}
          </div>
        );

        return s.placeholder ? (
          <div key={s.id}>{content}</div>
        ) : (
          <a
            key={s.id}
            href={`/artistes/${s.artistSlug}?print=${encodeURIComponent(s.id)}`}
            title={`${s.title} — ${s.artistName}`}
            className="block focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
          >
            {content}
          </a>
        );
      })}
    </div>
  );
}

export default ArtistPortfolioGrid;
