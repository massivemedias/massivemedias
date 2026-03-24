import { useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Camera, PenTool, Store, MapPin, Instagram } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useArtists } from '../hooks/useArtists';
import { useTatoueurs } from '../hooks/useTatoueurs';
import { mediaUrl } from '../utils/cms';
import artistsData from '../data/artists';
import tatoueursData from '../data/tatoueurs';

function Artistes() {
  const { lang, tx } = useLang();
  const { artists: cmsArtists } = useArtists();
  const { tatoueurs: cmsTatoueurs } = useTatoueurs();
  const location = useLocation();

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
    // cmsArtists peut etre null, un tableau, ou un objet {slug: data}
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

  return (
    <>
      <SEO
        title={tx({ fr: 'Artistes - Photographes, Tatoueurs & Boutique | Massive', en: 'Artists - Photographers, Tattoo Artists & Shop | Massive' })}
        description={tx({
          fr: 'Decouvrez les artistes de Massive Medias. Photographes, peintres, tatoueurs. Tirages fine art, flashs originaux, boutique en ligne. Montreal.',
          en: 'Discover Massive Medias artists. Photographers, painters, tattoo artists. Fine art prints, original flash designs, online shop. Montreal.',
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home' }), url: '/' },
          { name: tx({ fr: 'Artistes', en: 'Artists' }) },
        ]}
      />

      {/* ============ HERO ============ */}
      <section className="pt-24 pb-6 md:pt-32 md:pb-10">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-8 text-sm">
              <Link to="/" className="text-grey-muted hover:text-accent transition-colors">
                {tx({ fr: 'Accueil', en: 'Home' })}
              </Link>
              <span className="text-grey-muted">/</span>
              <span className="text-accent">
                {tx({ fr: 'Artistes', en: 'Artists' })}
              </span>
            </div>

            <h1 className="text-5xl md:text-8xl font-heading font-bold text-heading tracking-tight leading-none mb-4">
              {tx({ fr: 'Massive Artistes', en: 'Massive Artists' })}
            </h1>

            <div className="w-16 h-1 bg-accent mb-6" />

            <p className="text-lg md:text-xl text-grey-light max-w-xl mb-8">
              {tx({
                fr: "Photographes, peintres, tatoueurs. Decouvrez les createurs de Massive Medias.",
                en: 'Photographers, painters, tattoo artists. Discover the creators of Massive Medias.',
              })}
            </p>

            {/* Quick nav */}
            <div className="flex flex-wrap gap-3">
              <a href="#photographes" className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-bg-card border border-white/10 text-grey-light hover:text-accent hover:border-accent/30 transition-colors">
                <Camera size={16} />
                {tx({ fr: 'Photographes & Peintres', en: 'Photographers & Painters' })}
              </a>
              <a href="#tatoueurs" className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-bg-card border border-white/10 text-grey-light hover:text-accent hover:border-accent/30 transition-colors">
                <PenTool size={16} />
                {tx({ fr: 'Tatoueurs', en: 'Tattoo Artists' })}
              </a>
              <a href="#boutique" className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-bg-card border border-white/10 text-grey-light hover:text-accent hover:border-accent/30 transition-colors">
                <Store size={16} />
                {tx({ fr: 'Boutique Massive', en: 'Massive Shop' })}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ SECTION PHOTOGRAPHES & PEINTRES ============ */}
      <section id="photographes" className="scroll-mt-24">
        <div className="section-container max-w-7xl mx-auto pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-8"
          >
            <Camera size={28} className="text-accent" />
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading">
              {tx({ fr: 'Photographes & Peintres', en: 'Photographers & Painters' })}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
            {artists.map((artist, index) => {
              const tagline = tx({ fr: artist.tagline.fr, en: artist.tagline.en, es: artist.tagline.es || artist.tagline.en });

              return (
                <motion.div
                  key={artist.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  viewport={{ once: true, margin: '-50px' }}
                >
                  <Link
                    to={`/artistes/${artist.slug}`}
                    className="group block relative overflow-hidden rounded-xl aspect-[4/5]"
                  >
                    <img
                      src={artist.heroImage || artist.avatar}
                      alt={artist.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading={index < 4 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-500" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
                      <h3 className="font-heading font-bold text-white text-lg md:text-xl leading-tight mb-1 drop-shadow-lg">
                        {artist.name}
                      </h3>
                      <p className="text-white/50 text-xs md:text-sm leading-snug line-clamp-1">
                        {tagline}
                      </p>
                      <div className="flex items-center justify-between mt-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <span className="text-white/40 text-[10px] uppercase tracking-widest">
                          {artist.prints?.length || 0} {tx({ fr: 'oeuvres', en: 'artworks' })}
                        </span>
                        <ArrowRight size={14} className="text-accent" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SECTION TATOUEURS ============ */}
      <section id="tatoueurs" className="scroll-mt-24 py-12 md:py-16 bg-bg-elevated/30">
        <div className="section-container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <PenTool size={28} className="text-accent" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading">
                {tx({ fr: 'Tatoueurs', en: 'Tattoo Artists' })}
              </h2>
            </div>
            <Link to="/tatoueurs" className="text-sm text-grey-muted hover:text-accent transition-colors flex items-center gap-1">
              {tx({ fr: 'Voir tout', en: 'View all' })}
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {tatoueurs.map((tatoueur, index) => {
              const bio = lang === 'en' ? (tatoueur.bioEn || tatoueur.bioFr) : (tatoueur.bioFr || tatoueur.bioEn);
              const flashCount = (tatoueur.flashs || []).filter(f => f.status === 'disponible').length;

              return (
                <motion.div
                  key={tatoueur.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true, margin: '-50px' }}
                >
                  <Link
                    to={`/tatoueurs/${tatoueur.slug}`}
                    className="group block relative overflow-hidden rounded-xl bg-bg-card border border-white/5 hover:border-accent/20 transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {tatoueur.heroImage || tatoueur.avatar ? (
                        <img
                          src={tatoueur.heroImage || tatoueur.avatar}
                          alt={tatoueur.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-bg-elevated" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {flashCount > 0 && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          {flashCount} flash{flashCount > 1 ? 's' : ''} {tx({ fr: 'dispo', en: 'available' })}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        {tatoueur.avatar && (
                          <img src={tatoueur.avatar} alt={tatoueur.name} className="w-12 h-12 rounded-full object-cover border-2 border-accent/30 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-heading font-bold text-heading text-lg leading-tight">{tatoueur.name}</h3>
                          <div className="flex items-center gap-1.5 text-grey-muted text-xs mt-0.5">
                            {tatoueur.studio && <span>{tatoueur.studio}</span>}
                            {tatoueur.studio && tatoueur.city && <span>-</span>}
                            {tatoueur.city && <span className="flex items-center gap-0.5"><MapPin size={10} />{tatoueur.city}</span>}
                          </div>
                        </div>
                      </div>

                      {tatoueur.styles && tatoueur.styles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {tatoueur.styles.slice(0, 4).map(style => (
                            <span key={style} className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-grey-light capitalize">{style}</span>
                          ))}
                        </div>
                      )}

                      {bio && <p className="text-grey-muted text-xs line-clamp-2 mb-3">{bio}</p>}

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        {tatoueur.priceTattooMin && (
                          <span className="text-xs text-grey-muted">
                            {tx({ fr: 'A partir de', en: 'From' })} <span className="text-accent font-bold">{tatoueur.priceTattooMin}$</span>
                          </span>
                        )}
                        <ArrowRight size={16} className="text-grey-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
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
                    <Link to={`/artistes/${work.artistSlug}`} className="group relative block rounded-lg overflow-hidden aspect-square">
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
                {tx({ fr: 'Boutique Massive', en: 'Massive Shop' })}
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/5 hover:border-accent/20 transition-all duration-300">
              <div className="p-8 md:p-12 bg-gradient-to-br from-bg-card via-bg-card to-accent/5">
                <div className="max-w-2xl">
                  <h3 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-4">
                    {tx({ fr: 'Prints, Stickers & Merch', en: 'Prints, Stickers & Merch' })}
                  </h3>
                  <p className="text-grey-light text-base md:text-lg mb-6">
                    {tx({
                      fr: "Tirages fine art, stickers custom, t-shirts et hoodies. Tout est produit a Montreal avec des materiaux premium.",
                      en: 'Fine art prints, custom stickers, t-shirts and hoodies. Everything is produced in Montreal with premium materials.',
                    })}
                  </p>

                  <div className="flex flex-wrap gap-3 mb-8">
                    <Link to="/boutique/fine-art" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Fine Art', en: 'Fine Art' })}
                    </Link>
                    <Link to="/boutique/stickers" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Stickers', en: 'Stickers' })}
                    </Link>
                    <Link to="/boutique/merch/tshirt" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Merch', en: 'Merch' })}
                    </Link>
                    <Link to="/boutique/sublimation" className="text-sm px-4 py-2 rounded-full bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-white/5 transition-colors">
                      {tx({ fr: 'Sublimation', en: 'Sublimation' })}
                    </Link>
                  </div>

                  <Link to="/boutique" className="btn-primary inline-flex items-center">
                    {tx({ fr: 'Explorer la boutique', en: 'Explore the shop' })}
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
            {tx({ fr: 'Tu es artiste?', en: 'Are you an artist?' })}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {tx({
              fr: "Photographe, peintre, tatoueur - rejoins la plateforme Massive Medias. On s'occupe de tout.",
              en: 'Photographer, painter, tattoo artist - join the Massive Medias platform. We handle everything.',
            })}
          </p>
          <Link to="/contact" className="btn-primary">
            <MessageSquare size={20} className="mr-2" />
            {tx({ fr: 'Nous contacter', en: 'Contact us' })}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>
      </div>
    </>
  );
}

export default Artistes;
