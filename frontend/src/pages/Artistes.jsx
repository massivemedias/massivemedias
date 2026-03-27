import { useMemo, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MessageSquare, Camera, PenTool, Store, LayoutGrid, Grid3x3, List, ChevronDown, Paintbrush, Aperture } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useArtists } from '../hooks/useArtists';
import { useTatoueurs } from '../hooks/useTatoueurs';
import { mediaUrl } from '../utils/cms';
import artistsData from '../data/artists';
import tatoueursData from '../data/tatoueurs';

// Type map for each artist slug
const ARTIST_TYPES = {
  'adrift': 'photographe',
  'maudite-machine': 'peintre',
  'mok': 'photographe',
  'psyqu33n': 'peintre',
  'quentin-delobel': 'photographe',
  'no-pixl': 'photographe',
  'cornelia-rose': 'peintre',
  'ginko-ink': 'tatoueur',
};

const TYPE_LABELS = {
  photographe: { fr: 'Photographe', en: 'Photographer', es: 'Fotógrafo' },
  peintre: { fr: 'Peintre', en: 'Painter', es: 'Pintor' },
  tatoueur: { fr: 'Tatoueur', en: 'Tattoo Artist', es: 'Tatuador' },
};

const FILTER_OPTIONS = [
  { key: 'all', fr: 'Tous', en: 'All', es: 'Todos' },
  { key: 'photographe', fr: 'Photographes', en: 'Photographers', es: 'Fotógrafos' },
  { key: 'peintre', fr: 'Peintres', en: 'Painters', es: 'Pintores' },
  { key: 'tatoueur', fr: 'Tatoueurs', en: 'Tattoo Artists', es: 'Tatuadores' },
];

function Artistes() {
  const { lang, tx } = useLang();
  const { artists: cmsArtists } = useArtists();
  const { tatoueurs: cmsTatoueurs } = useTatoueurs();
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

  const artists = useMemo(() => {
    const localList = Object.values(artistsData);
    const cmsArray = !cmsArtists ? [] : Array.isArray(cmsArtists) ? cmsArtists : Object.values(cmsArtists);
    if (cmsArray.length === 0) return localList;

    const merged = localList.map(local => {
      const cms = cmsArray.find(a => a.slug === local.slug);
      if (!cms) return local;
      return {
        ...local,
        name: cms.name || local.name,
        tagline: {
          fr: cms.taglineFr || local.tagline.fr,
          en: cms.taglineEn || local.tagline.en,
          es: local.tagline.es || local.tagline.en,
        },
        bio: {
          fr: cms.bioFr || local.bio.fr,
          en: cms.bioEn || local.bio.en,
          es: local.bio.es || local.bio.en,
        },
        avatar: cms.socials?.avatarUrl || (cms.avatar ? mediaUrl(cms.avatar) : null) || local.avatar,
        heroImage: cms.heroImage ? mediaUrl(cms.heroImage) : local.heroImage,
      };
    });

    const localSlugs = new Set(localList.map(a => a.slug));
    const cmsOnly = cmsArray
      .filter(a => !localSlugs.has(a.slug))
      .map(cms => ({
        slug: cms.slug,
        name: cms.name,
        tagline: { fr: cms.taglineFr || '', en: cms.taglineEn || '' },
        bio: { fr: cms.bioFr || '', en: cms.bioEn || '' },
        avatar: mediaUrl(cms.avatar),
        heroImage: mediaUrl(cms.heroImage),
        prints: (cms.prints || []).map((p, i) => ({
          ...p,
          image: cms.printImages?.[i] ? mediaUrl(cms.printImages[i]) : '',
        })),
        pricing: cms.pricing || { studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 }, museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 }, framePriceByFormat: { postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 } },
        socials: cms.socials || {},
      }));

    return [...merged, ...cmsOnly];
  }, [cmsArtists]);

  const tatoueurs = useMemo(() => {
    const localList = Object.values(tatoueursData);
    if (!cmsTatoueurs || cmsTatoueurs.length === 0) return localList;

    const merged = localList.map(local => {
      const cms = cmsTatoueurs.find(t => t.slug === local.slug);
      if (!cms) return local;
      return {
        ...local,
        name: cms.name || local.name,
        bioFr: cms.bioFr || local.bioFr,
        bioEn: cms.bioEn || local.bioEn,
        studio: cms.studio || local.studio,
        city: cms.city || local.city,
        styles: cms.styles || local.styles,
        instagramHandle: cms.instagramHandle || local.instagramHandle,
        avatar: cms.avatar ? mediaUrl(cms.avatar) : local.avatar,
        heroImage: cms.heroImage ? mediaUrl(cms.heroImage) : local.heroImage,
        priceTattooMin: cms.priceTattooMin || local.priceTattooMin,
        flashs: local.flashs,
      };
    });

    const localSlugs = new Set(localList.map(t => t.slug));
    const cmsOnly = cmsTatoueurs
      .filter(t => !localSlugs.has(t.slug))
      .map(cms => ({
        slug: cms.slug,
        name: cms.name,
        bioFr: cms.bioFr || '',
        bioEn: cms.bioEn || '',
        studio: cms.studio || '',
        city: cms.city || '',
        styles: cms.styles || [],
        instagramHandle: cms.instagramHandle || '',
        avatar: mediaUrl(cms.avatar),
        heroImage: mediaUrl(cms.heroImage),
        priceTattooMin: cms.priceTattooMin,
        flashs: cms.flashs || [],
      }));

    return [...merged, ...cmsOnly];
  }, [cmsTatoueurs]);

  // Merge all creators into a single list with unified shape
  const allCreators = useMemo(() => {
    const fromArtists = artists.map(a => ({
      slug: a.slug,
      name: a.name,
      avatar: a.avatar,
      heroImage: a.heroImage,
      tagline: a.tagline,
      bio: a.bio,
      link: `/artistes/${a.slug}`,
      type: ARTIST_TYPES[a.slug] || 'peintre',
      prints: a.prints || [],
      flashs: [],
      isTatoueur: false,
      studio: null,
      city: null,
    }));

    const fromTatoueurs = tatoueurs.map(t => ({
      slug: t.slug,
      name: t.name,
      avatar: t.avatar,
      heroImage: t.heroImage || t.avatar,
      tagline: {
        fr: t.studio ? `${t.studio} - ${t.city || ''}` : (t.bioFr || '').slice(0, 60),
        en: t.studio ? `${t.studio} - ${t.city || ''}` : (t.bioEn || '').slice(0, 60),
        es: t.studio ? `${t.studio} - ${t.city || ''}` : (t.bioEs || t.bioEn || '').slice(0, 60),
      },
      bio: {
        fr: t.bioFr || '',
        en: t.bioEn || '',
        es: t.bioEs || t.bioEn || '',
      },
      link: `/tatoueurs/${t.slug}`,
      type: 'tatoueur',
      prints: [],
      flashs: t.flashs || [],
      isTatoueur: true,
      studio: t.studio,
      city: t.city,
    }));

    return [...fromArtists, ...fromTatoueurs];
  }, [artists, tatoueurs]);

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
    const label = TYPE_LABELS[type] || TYPE_LABELS.peintre;
    const colors = {
      photographe: 'bg-blue-600 text-white border-blue-500',
      peintre: 'bg-purple-600 text-white border-purple-500',
      tatoueur: 'bg-pink-600 text-white border-pink-500',
    };
    return (
      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[type] || colors.peintre}`}>
        {tx(label)}
      </span>
    );
  };

  return (
    <>
      <SEO
        title={tx({ fr: 'Artistes - Photographes, Tatoueurs & Boutique | Massive', en: 'Artists - Photographers, Tattoo Artists & Shop | Massive', es: 'Artistas - Fotógrafos, Tatuadores & Tienda | Massive' })}
        description={tx({
          fr: 'Decouvrez les artistes de Massive Medias. Photographes, peintres, tatoueurs. Tirages fine art, flashs originaux, boutique en ligne. Montreal.',
          en: 'Discover Massive Medias artists. Photographers, painters, tattoo artists. Fine art prints, original flash designs, online shop. Montreal.',
          es: 'Descubre los artistas de Massive Medias. Fotógrafos, pintores, tatuadores. Impresiones fine art, flashs originales, tienda en línea. Montreal.',
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }) },
        ]}
      />

      {/* ============ HERO ============ */}
      <section className="pt-24 pb-2 md:pt-28 md:pb-2">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link to="/" className="text-grey-muted hover:text-accent transition-colors">
                {tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' })}
              </Link>
              <span className="text-grey-muted">/</span>
              <span className="text-accent">
                {tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' })}
              </span>
            </div>

            <h1 className="text-5xl md:text-8xl font-heading font-bold text-heading tracking-tight leading-none mb-4">
              {tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' })}
            </h1>

            <div className="w-16 h-1 bg-accent mb-6" />

            <p className="text-lg md:text-xl text-grey-light max-w-xl mb-2">
              {tx({
                fr: "Photographes, peintres, tatoueurs. Decouvrez les createurs de Massive Medias.",
                en: 'Photographers, painters, tattoo artists. Discover the creators of Massive Medias.',
                es: 'Fotógrafos, pintores, tatuadores. Descubre los creadores de Massive Medias.',
              })}
            </p>

          </motion.div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
              {filteredCreators.map((creator, index) => {
                const tagline = tx({ fr: creator.tagline?.fr || '', en: creator.tagline?.en || '', es: creator.tagline?.es || '' });
                const flashCount = creator.isTatoueur ? (creator.flashs || []).filter(f => f.status === 'disponible').length : 0;

                return (
                  <motion.div
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
                        alt={creator.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading={index < 4 ? 'eager' : 'lazy'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-500" />

                      {/* Avatar rond en haut a gauche */}
                      {creator.avatar && (
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                          <img loading="lazy"
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover shadow-lg shadow-black/40"
                          />
                        </div>
                      )}

                      {/* Type badge top right */}
                      <div className="absolute top-3 right-3 z-10">
                        {getTypeBadge(creator.type)}
                      </div>

                      {/* Badge flashs tatoueur */}
                      {creator.isTatoueur && flashCount > 0 && (
                        <div className="absolute top-12 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                          {flashCount} flash{flashCount > 1 ? 's' : ''}
                        </div>
                      )}

                      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
                        <h3 className="font-heading font-bold text-white text-lg md:text-xl leading-tight mb-1 drop-shadow-lg">
                          {creator.name}
                        </h3>
                        <p className="text-white/50 text-xs md:text-sm leading-snug line-clamp-1">
                          {tagline}
                        </p>
                        <div className="flex items-center justify-between mt-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <span className="text-white/40 text-[10px] uppercase tracking-widest">
                            {creator.isTatoueur
                              ? `${flashCount} ${tx({ fr: 'flashs', en: 'flash designs', es: 'flashs' })}`
                              : `${creator.prints?.length || 0} ${tx({ fr: 'oeuvres', en: 'artworks', es: 'obras' })}`
                            }
                          </span>
                          <ArrowRight size={14} className="text-accent" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
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
                const flashCount = creator.isTatoueur ? (creator.flashs || []).filter(f => f.status === 'disponible').length : 0;
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

                                  {!creator.isTatoueur && printsCount > 0 && (
                                    <span className="text-grey-muted text-xs">
                                      {printsCount} {tx({ fr: 'oeuvres disponibles', en: 'artworks available', es: 'obras disponibles' })}
                                    </span>
                                  )}

                                  {creator.isTatoueur && flashCount > 0 && (
                                    <span className="text-grey-muted text-xs">
                                      {flashCount} flash{flashCount > 1 ? 's' : ''} {tx({ fr: 'disponibles', en: 'available', es: 'disponibles' })}
                                    </span>
                                  )}

                                  {creator.studio && (
                                    <span className="text-grey-muted text-xs">
                                      {creator.studio}{creator.city ? ` - ${creator.city}` : ''}
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
                  >
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
                    {tx({ fr: 'Merch Massive - Bientot disponible!', en: 'Massive Merch - Coming Soon!', es: 'Merch Massive - Muy pronto!' })}
                  </h3>
                  <p className="text-accent text-sm font-semibold mb-4">
                    {tx({ fr: 'Tres prochainement', en: 'Very soon', es: 'Muy pronto' })}
                  </p>
                  <p className="text-grey-light text-base md:text-lg mb-6">
                    {tx({
                      fr: "Prints personnalises, stickers exclusifs, t-shirts, hoodies et plus - tout designe par Massive Medias et produit a Montreal. Notre collection arrive tres bientot!",
                      en: 'Custom prints, exclusive stickers, t-shirts, hoodies and more - all designed by Massive Medias and produced in Montreal. Our collection is coming very soon!',
                      es: 'Impresiones personalizadas, stickers exclusivos, camisetas, hoodies y más - todo diseñado por Massive Medias y producido en Montreal. Nuestra colección llega muy pronto!',
                    })}
                  </p>

                  <div className="flex flex-wrap gap-3 mb-8">
                    <Link to="/boutique/fine-art" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Fine Art', en: 'Fine Art', es: 'Fine Art' })}
                    </Link>
                    <Link to="/boutique/stickers" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })}
                    </Link>
                    <Link to="/boutique/merch/tshirt" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Merch', en: 'Merch', es: 'Merch' })}
                    </Link>
                    <Link to="/boutique/sublimation" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Sublimation', en: 'Sublimation', es: 'Sublimación' })}
                    </Link>
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
              fr: "Photographe, peintre, tatoueur - rejoins la plateforme Massive Medias. On s'occupe de tout.",
              en: 'Photographer, painter, tattoo artist - join the Massive Medias platform. We handle everything.',
              es: 'Fotógrafo, pintor, tatuador - únete a la plataforma Massive Medias. Nos encargamos de todo.',
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
