import { useMemo, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MERCH_HIDDEN } from '../config/merchStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MessageSquare, Camera, Store, LayoutGrid, Grid3x3, List, ChevronDown, Paintbrush, Aperture } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useArtists } from '../hooks/useArtists';
import { mediaUrl } from '../utils/cms';
import TierExplainer from '../components/TierExplainer';
import FavoriteHeart from '../components/FavoriteHeart';

// Type map for each artist slug
const ARTIST_TYPES = {
  'adrift': 'photographe',
  'maudite-machine': 'peintre',
  'mok': 'photographe',
  'psyqu33n': 'peintre',
  'quentin-delobel': 'photographe',
  'no-pixl': 'photographe',
  'cornelia-rose': 'peintre',
  'eric-sanchez': 'photographe',
};

const TYPE_LABELS = {
  photographe: { fr: 'Photographe', en: 'Photographer', es: 'Fotógrafo' },
  peintre: { fr: 'Peintre', en: 'Painter', es: 'Pintor' },
};

const FILTER_OPTIONS = [
  { key: 'all', fr: 'Tous', en: 'All', es: 'Todos' },
  { key: 'photographe', fr: 'Photographes', en: 'Photographers', es: 'Fotógrafos' },
  { key: 'peintre', fr: 'Peintres', en: 'Painters', es: 'Pintores' },
];

/**
 * UI-HERO-PRINTS (14 juillet 2026) : le hero prend en fond une oeuvre d'artiste
 * tiree au hasard parmi les prints publies.
 *
 * A `false` -> le hero redevient EXACTEMENT celui d'avant (texte sur le fond de
 * page, jetons de theme, aucune image). Rien n'est supprime.
 */
const HERO_RANDOM_BG_ENABLED = true

/**
 * Voile de lisibilite du hero.
 *
 * Degrade HORIZONTAL : tres sombre a gauche (la ou vit le texte), il s'ouvre
 * vers la droite pour laisser respirer l'oeuvre.
 *
 * Les alphas ne sont PAS choisis a l'oeil, ils sont dimensionnes. Contraste du
 * blanc mesure sur le pixel le plus clair de chaque zone de texte :
 *   - print le plus clair du catalogue (luminance 0,89) : titre 6,29:1, corps 6,29:1
 *   - print le plus sombre (0,04)                       : titre 12,8:1, corps 9,77:1
 *   - image BLANCHE PURE (plancher absolu)              : titre 5,49:1, corps 5,49:1
 * Seuils AA : 3:1 (grand texte) et 4,5:1 (texte normal). Le plancher blanc est
 * la garantie qui compte : AUCUN print ajoute plus tard ne peut casser la
 * lisibilite.
 *
 * Noir pur uniquement, zero couleur de theme -> valable sur les 11 palettes.
 * Assez sombre pour porter du texte blanc MEME sans image derriere : c'est ce
 * qui evite le flash de texte invisible pendant le chargement sur themes clairs.
 */
const HERO_SCRIM = {
  backgroundImage: [
    'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.80) 25%, rgba(0,0,0,0.66) 50%, rgba(0,0,0,0.42) 75%, rgba(0,0,0,0.25) 100%)',
    'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 35%)',
  ].join(', '),
}

function Artistes() {
  const { lang, tx } = useLang();
  const { artists: cmsArtists } = useArtists();
  const location = useLocation();

  const [viewMode, setViewMode] = useState('large'); // 'large' | 'small' | 'list'
  const [filter, setFilter] = useState('all');
  const [expandedSlug, setExpandedSlug] = useState(null);

  // Scroll to anchor on load
  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const el = document.getElementById(location.hash.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [location.hash]);

  // STRAPI-ONLY (11 mai 2026) : la source de verite est 100% le CMS. Plus
  // de fallback artists.js (supprime). Si le CMS n'a pas charge / vide, on
  // affiche une liste vide (Loading...) plutot qu'un fallback potentiellement
  // stale.
  const artists = useMemo(() => {
    const cmsArray = !cmsArtists ? [] : Array.isArray(cmsArtists) ? cmsArtists : Object.values(cmsArtists);
    return cmsArray.map((cms) => ({
      slug: cms.slug,
      name: cms.name,
      tagline: { fr: cms.taglineFr || '', en: cms.taglineEn || '', es: cms.taglineEs || cms.taglineEn || '' },
      bio: { fr: cms.bioFr || '', en: cms.bioEn || '', es: cms.bioEs || cms.bioEn || '' },
      avatar: cms.socials?.avatarUrl || (cms.avatar ? mediaUrl(cms.avatar) : null),
      heroImage: cms.heroImage ? mediaUrl(cms.heroImage) : null,
      prints: cms.prints || [],
      pricing: cms.pricing || { studio: { postcard: 25, a4: 35, a3: 50, a3plus: 65 }, museum: { postcard: 50, a4: 75, a3: 120, a3plus: 160, a2: 190 }, framePriceByFormat: { postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 } },
      socials: cms.socials || {},
    }));
  }, [cmsArtists]);

  // ---- UI-HERO-PRINTS : l'oeuvre de fond du hero ----
  // Le pool est construit depuis les prints DEJA fetches par useArtists() :
  // aucun appel reseau supplementaire. L'IIFE de la grille d'oeuvres plus bas
  // n'est pas touchee (pas de refactoring opportuniste).
  const heroPool = useMemo(() => {
    const out = []
    artists.forEach((a) => {
      (a.prints || []).forEach((p) => {
        if (p && p.image) out.push({ image: p.image, artistName: a.name, artistSlug: a.slug })
      })
    })
    return out
  }, [artists])

  const [heroBg, setHeroBg] = useState(null)
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [heroFailed, setHeroFailed] = useState(false)

  // UN SEUL tirage, au premier rendu ou le pool devient non vide (le CMS arrive
  // apres le montage). Resultat : une nouvelle oeuvre a chaque chargement de
  // page, et AUCUNE rotation pendant la session.
  useEffect(() => {
    if (heroBg || heroPool.length === 0) return
    setHeroBg(heroPool[Math.floor(Math.random() * heroPool.length)])
  }, [heroPool, heroBg])

  // Le hero n'a un fond que si : flag ON + une oeuvre tiree + image non cassee.
  // Dans tous les autres cas (flag off, CMS vide, image 404) -> rendu STRICTEMENT
  // identique a l'ancien hero, jetons de theme compris.
  const heroHasBg = HERO_RANDOM_BG_ENABLED && Boolean(heroBg) && !heroFailed

  // Merge all creators into a single list with unified shape
  const allCreators = useMemo(() => {
    return artists.map(a => ({
      slug: a.slug,
      name: a.name,
      avatar: a.avatar,
      heroImage: a.heroImage,
      tagline: a.tagline,
      bio: a.bio,
      link: `/artistes/${a.slug}`,
      type: ARTIST_TYPES[a.slug] || 'peintre',
      prints: a.prints || [],
      studio: null,
      city: null,
    }));
  }, [artists]);

  const filteredCreators = useMemo(() => {
    if (filter === 'all') return allCreators;
    return allCreators.filter(c => c.type === filter);
  }, [allCreators, filter]);

  const viewModes = [
    { key: 'large', icon: LayoutGrid, label: tx({ fr: 'Grande grille', en: 'Large grid', es: 'Grilla grande' }) },
    { key: 'small', icon: Grid3x3, label: tx({ fr: 'Petite grille', en: 'Small grid', es: 'Grilla pequena' }) },
    { key: 'list', icon: List, label: tx({ fr: 'Liste', en: 'List', es: 'Lista' }) },
  ];

  const getTypeBadge = (type) => {
    const config = {
      photographe: { Icon: Aperture, color: 'text-white/60' },
      peintre: { Icon: Paintbrush, color: 'text-white/60' },
    };
    const c = config[type] || config.peintre;
    return <c.Icon size={18} className={c.color} strokeWidth={1.5} />;
  };

  return (
    <>
      <SEO
        title={tx({ fr: "Prints d'artistes - Photographes & Peintres | Massive", en: 'Artist Prints - Photographers & Painters | Massive', es: 'Prints de artistas - Fotógrafos & Pintores | Massive' })}
        description={tx({
          fr: 'Découvrez les artistes de Massive Medias. Photographes, peintres. Tirages fine art, impression et distribution en ligne. Montréal.',
          en: 'Discover Massive Medias artists. Photographers, painters. Fine art prints, printing and online distribution. Montreal.',
          es: 'Descubre los artistas de Massive Medias. Fotógrafos, pintores. Impresiones fine art, impresión y distribución en línea. Montreal.',
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: "Prints d'artistes", en: 'Artist Prints', es: 'Prints de artistas' }) },
        ]}
      />

      {/* ============ HERO ============ */}
      {/* UI-HERO-PRINTS : quand une oeuvre est tiree, le hero devient un bloc
          arrondi (meme forme que le hero /stickers) avec l'oeuvre en fond + un
          voile. Sinon `heroHasBg` est faux et TOUT ce bloc retombe exactement
          sur l'ancien rendu : pas de conteneur, pas d'image, jetons de theme.

          Les couleurs de texte suivent `heroHasBg`, ce n'est pas cosmetique : la
          surface passe d'un fond de PAGE (qui suit le theme) a une image
          ASSOMBRIE (sombre sur les 11 palettes). Garder les jetons donnerait du
          texte fonce sur du sombre en theme clair. Inversement, `text-accent`
          est INTERDIT ici : l'accent est un violet fonce sur les 2 themes
          clairs -> 1,71:1 sur le voile. L'accent ne revient donc que comme FOND
          de pastille (fond accent + texte blanc), qui tient sur les 11 palettes. */}
      <section className="relative py-4 overflow-hidden">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={heroHasBg ? 'relative overflow-hidden rounded-3xl px-6 sm:px-10 py-12 sm:py-16' : ''}>
              {heroHasBg && (
                <>
                  {/* Above the fold : jamais de lazy. Thumb WebP 800px (convention
                      hero du projet, cf. paths.js) -> LCP leger. Fade-in par
                      transition CSS au onLoad, PAS framer (rAF throttle en onglet
                      cache). onError -> heroFailed -> retour au hero d'origine. */}
                  <img
                    src={heroBg.image}
                    alt=""
                    aria-hidden="true"
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                    onLoad={() => setHeroLoaded(true)}
                    onError={() => setHeroFailed(true)}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {/* Voile rendu DES LE DEPART, meme avant que l'image charge :
                      il est assez sombre pour porter le texte blanc tout seul, ce
                      qui evite le flash de blanc-sur-blanc sur les themes clairs. */}
                  <div aria-hidden="true" className="absolute inset-0" style={HERO_SCRIM} />
                </>
              )}

              <div className="relative">
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <Link
                    to="/"
                    className={heroHasBg ? 'text-white/70 hover:text-white transition-colors' : 'text-grey-muted hover:text-accent transition-colors'}
                  >
                    {tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' })}
                  </Link>
                  <span className={heroHasBg ? 'text-white/40' : 'text-grey-muted'}>/</span>
                  <span className={heroHasBg ? 'text-white font-semibold' : 'text-accent'}>
                    {tx({ fr: "Prints d'artistes", en: 'Artist Prints', es: 'Prints de artistas' })}
                  </span>
                </div>

                <h1 className={`text-4xl md:text-5xl font-heading font-bold tracking-tight leading-none mb-3 ${heroHasBg ? 'text-white' : 'text-heading'}`}>
                  {tx({ fr: "Prints d'artistes", en: 'Artist Prints', es: 'Prints de artistas' })}
                </h1>

                <p className={`text-base md:text-lg max-w-2xl leading-relaxed mb-4 ${heroHasBg ? 'text-white/85' : 'text-grey-light'}`}>
                  {tx({
                    fr: "Ces artistes travaillent avec Massive pour imprimer, distribuer et promouvoir leur travail. Chaque print et sticker que vous voyez ici est produit dans notre studio au Plateau Mont-Royal.",
                    en: 'These artists work with Massive to print, distribute and promote their work. Every print and sticker you see here is produced in our Plateau Mont-Royal studio.',
                    es: 'Estos artistas trabajan con Massive para imprimir, distribuir y promover su trabajo. Cada print y sticker que ves aquí es producido en nuestro estudio del Plateau Mont-Royal.',
                  })}
                </p>

                {/* CTA Rejoindre la plateforme */}
                <Link
                  to="/contact?tab=artiste"
                  className={heroHasBg
                    ? 'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white font-semibold text-sm hover:brightness-110 transition-all group'
                    : 'inline-flex items-center gap-2 text-accent font-semibold text-sm hover:text-accent-hover transition-colors group'}
                >
                  {tx({
                    fr: 'Tu es artiste ? Rejoins la plateforme',
                    en: 'Are you an artist? Join the platform',
                    es: '¿Eres artista? Únete a la plataforma',
                  })}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>

                {/* Credit de l'artiste dont l'oeuvre habille le hero. */}
                {heroHasBg && (
                  <div className="mt-8 flex justify-end">
                    <Link
                      to={`/artistes/${heroBg.artistSlug}`}
                      className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
                    >
                      <span className="uppercase tracking-widest text-[10px] text-white/45">
                        {tx({ fr: 'Oeuvre', en: 'Artwork', es: 'Obra' })}
                      </span>
                      <span className="underline underline-offset-2 decoration-white/30 text-white/90">
                        {heroBg.artistName}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ARCHI-04 : bandeau CTA "prints custom", miroir du CTA custom de /stickers.
          Place haut (juste sous le hero), vers le service fine art /services/prints.
          Gradient via --accent-rgb (theme-safe, jamais de rose/mauve code en dur). */}
      <section className="section-container mb-3">
        <div
          className="rounded-2xl px-6 py-5 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ background: 'linear-gradient(120deg, rgba(var(--accent-rgb),1), rgba(var(--accent-rgb),0.62))', boxShadow: '0 14px 36px rgba(var(--accent-rgb),0.28)' }}
        >
          <div>
            <p className="text-white font-heading font-bold text-xl leading-tight">
              {tx({ fr: 'Imprime tes œuvres', en: 'Print your work', es: 'Imprime tus obras' })}
            </p>
            <p className="text-white/90 text-sm mt-1">
              {tx({
                fr: 'Fais tes prints custom en fine art, imprimés à Montréal.',
                en: 'Make custom fine-art prints, printed in Montreal.',
                es: 'Haz tus prints custom en fine art, impresos en Montreal.',
              })}
            </p>
          </div>
          <Link
            to="/services/prints"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-accent font-bold text-sm px-5 py-2.5 rounded-full hover:brightness-95 transition-all whitespace-nowrap"
          >
            {tx({ fr: 'Faire mes prints custom', en: 'Make custom prints', es: 'Hacer mis prints custom' })}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ============ TOUS LES ARTISTES (melanges) ============ */}
      <section id="artistes" className="scroll-mt-24">
        <div className="section-container max-w-7xl mx-auto pb-8">

          {/* Toolbar: view mode + filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            {/* View mode buttons - a gauche */}
            <div className="flex items-center gap-1 bg-bg-card rounded-lg p-1 border border-white/5">
              {viewModes.map(vm => {
                const Icon = vm.icon;
                return (
                  <button
                    key={vm.key}
                    onClick={() => setViewMode(vm.key)}
                    title={vm.label}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === vm.key
                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                        : 'text-grey-muted hover:text-accent'
                    }`}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setFilter(opt.key)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition-all duration-200 ${
                    filter === opt.key
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                      : 'bg-transparent text-grey-light border-white/10 hover:border-accent/30 hover:text-accent'
                  }`}
                >
                  {tx(opt)}
                </button>
              ))}
            </div>
          </div>

          {/* ---- LARGE GRID VIEW ---- */}
          {viewMode === 'large' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-12">
              {filteredCreators.map((creator, index) => {
                const tagline = tx({ fr: creator.tagline?.fr || '', en: creator.tagline?.en || '', es: creator.tagline?.es || '' });

                return (
                  <motion.article
                    key={creator.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    viewport={{ once: true, margin: '-50px' }}
                  >
                    <Link
                      to={creator.link}
                      className="group block relative overflow-hidden rounded-xl aspect-[4/5]"
                    >
                      <img
                        src={creator.heroImage || creator.avatar}
                        alt={`${creator.name} - artiste Massive Medias`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading={index < 4 ? 'eager' : 'lazy'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-all duration-500" />

                      {/* Avatar rond en haut a gauche */}
                      {creator.avatar && (
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                          <img loading="lazy"
                            src={creator.avatar}
                            alt=""
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover shadow-lg shadow-black/40"
                          />
                        </div>
                      )}

                      {/* Type badge top right */}
                      <div className="absolute top-3 right-3 z-10">
                        {getTypeBadge(creator.type)}
                      </div>

                      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
                        <h3 className="font-heading font-bold text-white text-lg md:text-xl leading-tight mb-1 drop-shadow-lg">
                          {creator.name}
                        </h3>
                        <p className="text-white/85 text-xs md:text-sm leading-snug line-clamp-1">
                          {tagline}
                        </p>
                        <div className="flex items-center justify-between mt-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <span className="text-white/75 text-[10px] uppercase tracking-widest">
                            {`${creator.prints?.length || 0} ${tx({ fr: 'oeuvres', en: 'artworks', es: 'obras' })}`}
                          </span>
                          <ArrowRight size={14} className="text-accent" />
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          )}

          {/* ---- SMALL GRID VIEW ---- */}
          {viewMode === 'small' && (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 mb-12">
              {filteredCreators.map((creator, index) => (
                <motion.div
                  key={creator.slug}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  viewport={{ once: true, margin: '-30px' }}
                >
                  <Link
                    to={creator.link}
                    className="group block relative overflow-hidden rounded-lg aspect-square"
                  >
                    <img
                      src={creator.heroImage || creator.avatar}
                      alt={creator.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      loading={index < 6 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    {/* Type badge */}
                    <div className="absolute top-2 right-2 z-10">
                      {getTypeBadge(creator.type)}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <h3 className="font-heading font-bold text-white text-sm leading-tight drop-shadow-lg">
                        {creator.name}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* ---- ACCORDION LIST VIEW ---- */}
          {viewMode === 'list' && (
            <div className="flex flex-col gap-2 mb-12">
              {filteredCreators.map((creator, index) => {
                const isExpanded = expandedSlug === creator.slug;
                const bio = tx({ fr: creator.bio?.fr || '', en: creator.bio?.en || '', es: creator.bio?.es || '' });
                const printsCount = creator.prints?.length || 0;

                return (
                  <motion.div
                    key={creator.slug}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    viewport={{ once: true, margin: '-20px' }}
                    className="bg-bg-card border border-white/5 rounded-xl overflow-hidden"
                  >
                    {/* Accordion header */}
                    <button
                      onClick={() => setExpandedSlug(isExpanded ? null : creator.slug)}
                      className="w-full flex items-center justify-between px-5 py-4 md:px-6 md:py-5 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {creator.avatar && (
                          <img loading="lazy"
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-lg shadow-black/40 shrink-0"
                          />
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                            {creator.name}
                          </h3>
                          {getTypeBadge(creator.type)}
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-grey-muted shrink-0 ml-4"
                      >
                        <ChevronDown size={22} />
                      </motion.div>
                    </button>

                    {/* Accordion content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 md:px-6 md:pb-6 border-t border-white/5 pt-5">
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Profile photo */}
                              <div className="shrink-0">
                                <img loading="lazy"
                                  src={creator.heroImage || creator.avatar}
                                  alt={creator.name}
                                  className="w-28 h-28 md:w-36 md:h-36 rounded-xl object-cover border border-white/10"
                                />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                {bio && (
                                  <p className="text-grey-light text-sm md:text-base leading-relaxed mb-4 line-clamp-4">
                                    {bio}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 mb-5">
                                  {getTypeBadge(creator.type)}

                                  {printsCount > 0 && (
                                    <span className="text-grey-muted text-xs">
                                      {printsCount} {tx({ fr: 'oeuvres disponibles', en: 'artworks available', es: 'obras disponibles' })}
                                    </span>
                                  )}
                                </div>

                                <Link
                                  to={creator.link}
                                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-white transition-colors"
                                >
                                  {tx({ fr: 'Voir le profil', en: 'View profile', es: 'Ver perfil' })}
                                  <ArrowRight size={16} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============ GRILLE OEUVRES ARTISTES ============ */}
      {(() => {
        const allWorks = [];
        artists.forEach(a => {
          (a.prints || []).forEach(p => {
            allWorks.push({ ...p, artistSlug: a.slug, artistName: a.name });
          });
        });
        // Shuffle
        for (let i = allWorks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allWorks[i], allWorks[j]] = [allWorks[j], allWorks[i]];
        }
        const display = allWorks.slice(0, 12);
        if (display.length === 0) return null;
        return (
          <section className="py-8 md:py-12">
            <div className="section-container max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {display.map((work, i) => (
                  <motion.div
                    key={work.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    {/* FAV-02 : coeur favori prints. SIBLING du <Link> (un bouton
                        dans un <a> = HTML invalide) ; stopPropagation dans le coeur. */}
                    {work.id && (
                      <FavoriteHeart space="prints" slug={work.id} className="absolute top-2 right-2 z-20" />
                    )}
                    <Link to={`/artistes/${work.artistSlug}?print=${work.id}`} className="group relative block rounded-lg overflow-hidden aspect-square">
                      <img
                        src={work.image}
                        alt={work.titleFr || work.titleEn || ''}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300 md:opacity-0 md:group-hover:opacity-100">
                        <span className="text-accent text-[10px] font-semibold uppercase tracking-wider">{work.artistName}</span>
                        <p className="text-white text-xs font-heading font-bold mt-0.5 line-clamp-1">
                          {lang === 'en' ? (work.titleEn || work.titleFr) : work.titleFr}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              {/* TIERS-01 : explication Studio vs Musee (version longue, repliee),
                  les oeuvres ci-dessus etant vendues dans les deux series. */}
              <TierExplainer variant="long" className="max-w-3xl mx-auto" />
            </div>
          </section>
        );
      })()}

      {/* ============ SECTION BOUTIQUE MASSIVE ============ */}
      <section id="boutique" className="scroll-mt-24 py-12 md:py-16">
        <div className="section-container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Store size={28} className="text-accent" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading">
                {tx({ fr: 'Boutique Massive', en: 'Massive Shop', es: 'Tienda Massive' })}
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/5 hover:border-accent/20 transition-all duration-300">
              <div className="p-8 md:p-12 bg-gradient-to-br from-bg-card via-bg-card to-accent/5">
                <div className="max-w-2xl">
                  <h3 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-2">
                    {tx({ fr: 'Merch Massive - Bientôt disponible!', en: 'Massive Merch - Coming Soon!', es: '¡Merch Massive - Muy pronto!' })}
                  </h3>
                  <p className="text-accent text-sm font-semibold mb-4">
                    {tx({ fr: 'Très prochainement', en: 'Very soon', es: 'Muy pronto' })}
                  </p>
                  <p className="text-grey-light text-base md:text-lg mb-6">
                    {tx({
                      fr: "Prints personnalisés, stickers exclusifs, t-shirts, hoodies et plus - tout désigné par Massive Medias et produit à Montréal. Notre collection arrive très bientôt!",
                      en: 'Custom prints, exclusive stickers, t-shirts, hoodies and more - all designed by Massive Medias and produced in Montreal. Our collection is coming very soon!',
                      es: 'Impresiones personalizadas, stickers exclusivos, camisetas, hoodies y más - todo diseñado por Massive Medias y producido en Montreal. Nuestra colección llega muy pronto!',
                    })}
                  </p>

                  <div className="flex flex-wrap gap-3 mb-8">
                    <Link to="/boutique/fine-art" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Fine Art', en: 'Fine Art', es: 'Fine Art' })}
                    </Link>
                    <Link to="/services/stickers" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })}
                    </Link>
                    {!MERCH_HIDDEN && (
                      <>
                        <Link to="/boutique/merch/tshirt" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                          {tx({ fr: 'Merch', en: 'Merch', es: 'Merch' })}
                        </Link>
                        <Link to="/boutique/sublimation" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                          {tx({ fr: 'Sublimation', en: 'Sublimation', es: 'Sublimación' })}
                        </Link>
                      </>
                    )}
                  </div>

                  <Link to="/boutique" className="btn-primary inline-flex items-center">
                    {tx({ fr: 'Explorer la boutique', en: 'Explore the shop', es: 'Explorar la tienda' })}
                    <ArrowRight size={18} className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <div className="section-container max-w-7xl mx-auto pb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20 p-12 rounded-2xl text-center border border-accent/30 transition-colors duration-300 cta-shadow"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
            {tx({ fr: 'Tu es artiste?', en: 'Are you an artist?', es: 'Eres artista?' })}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {tx({
              fr: "Photographe, peintre, illustrateur - rejoins la plateforme Massive Medias. On s'occupe de tout.",
              en: 'Photographer, painter, illustrator - join the Massive Medias platform. We handle everything.',
              es: 'Fotógrafo, pintor, ilustrador - únete a la plataforma Massive Medias. Nos encargamos de todo.',
            })}
          </p>
          <Link to="/contact" className="btn-primary">
            <MessageSquare size={20} className="mr-2" />
            {tx({ fr: 'Nous contacter', en: 'Contact us', es: 'Contáctanos' })}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>
      </div>
    </>
  );
}

export default Artistes;
