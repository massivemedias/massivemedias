import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Instagram, Filter, X } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useTatoueurs } from '../hooks/useTatoueurs';
import { mediaUrl } from '../utils/cms';
import tatoueursData from '../data/tatoueurs';

const ALL_STYLES = [
  'fineline', 'botanique', 'blackwork', 'neo-traditionnel', 'japonais',
  'realisme', 'geometrique', 'old school', 'minimaliste', 'aquarelle',
  'dotwork', 'lettering',
];

function Tatoueurs() {
  const { lang, tx } = useLang();
  const { tatoueurs: cmsTatoueurs } = useTatoueurs();
  const [activeStyle, setActiveStyle] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const tatoueurs = useMemo(() => {
    const localList = Object.values(tatoueursData);
    if (!cmsTatoueurs || cmsTatoueurs.length === 0) return localList;

    // Merge: CMS prioritaire, local en fallback
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
        flashs: local.flashs, // Local flashs as fallback
      };
    });

    // Ajouter les tatoueurs CMS-only
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
        socials: cms.socials || {},
        avatar: mediaUrl(cms.avatar),
        heroImage: mediaUrl(cms.heroImage),
        priceTattooMin: cms.priceTattooMin,
        flashs: (cms.flashs || []),
      }));

    return [...merged, ...cmsOnly];
  }, [cmsTatoueurs]);

  const filtered = useMemo(() => {
    if (!activeStyle) return tatoueurs;
    return tatoueurs.filter(t => t.styles?.includes(activeStyle));
  }, [tatoueurs, activeStyle]);

  const availableFlashCount = (t) => {
    return (t.flashs || []).filter(f => f.status === 'disponible').length;
  };

  return (
    <>
      <SEO
        title={tx({ fr: 'Tatoueurs - Flash Tattoo | Massive', en: 'Tattoo Artists - Flash Tattoo | Massive' })}
        description={tx({
          fr: 'Decouvrez les tatoueurs partenaires de Massive Medias. Flashs originaux, pieces uniques, reservation en ligne. Montreal.',
          en: 'Discover Massive Medias partner tattoo artists. Original flash designs, unique pieces, online booking. Montreal.',
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home' }), url: '/' },
          { name: tx({ fr: 'Tatoueurs', en: 'Tattoo Artists' }) },
        ]}
      />

      {/* Hero */}
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
                {tx({ fr: 'Tatoueurs', en: 'Tattoo Artists' })}
              </span>
            </div>

            <h1 className="text-5xl md:text-8xl font-heading font-bold text-heading tracking-tight leading-none mb-4">
              {tx({ fr: 'Tatoueurs', en: 'Tattoo Artists' })}
            </h1>

            <div className="w-16 h-1 bg-accent mb-6" />

            <p className="text-lg md:text-xl text-grey-light max-w-xl mb-8">
              {tx({
                fr: "Flashs originaux, pieces uniques, reservation en ligne. Trouvez votre prochain tatouage.",
                en: 'Original flash designs, unique pieces, online booking. Find your next tattoo.',
              })}
            </p>

            {/* Style Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm text-grey-muted hover:text-accent transition-colors md:hidden"
              >
                <Filter size={16} />
                {tx({ fr: 'Filtrer par style', en: 'Filter by style' })}
              </button>

              <div className={`flex flex-wrap gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
                {activeStyle && (
                  <button
                    onClick={() => setActiveStyle(null)}
                    className="text-xs px-3 py-1.5 rounded-full bg-accent text-black font-bold flex items-center gap-1"
                  >
                    <X size={12} />
                    {tx({ fr: 'Tout voir', en: 'Show all' })}
                  </button>
                )}
                {ALL_STYLES.map(style => (
                  <button
                    key={style}
                    onClick={() => setActiveStyle(activeStyle === style ? null : style)}
                    className={`text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${
                      activeStyle === style
                        ? 'bg-accent text-black font-bold'
                        : 'bg-bg-elevated text-grey-light hover:text-accent hover:border-accent/30 border border-transparent'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <div className="section-container max-w-7xl mx-auto pb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-grey-muted text-lg">
              {tx({ fr: 'Aucun tatoueur pour ce style.', en: 'No tattoo artist for this style.' })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-20">
            {filtered.map((tatoueur, index) => {
              const bio = lang === 'en' ? (tatoueur.bioEn || tatoueur.bioFr) : (tatoueur.bioFr || tatoueur.bioEn);
              const flashCount = availableFlashCount(tatoueur);

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
                    {/* Hero image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {tatoueur.heroImage || tatoueur.avatar ? (
                        <img
                          src={tatoueur.heroImage || tatoueur.avatar}
                          alt={tatoueur.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading={index < 3 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <div className="w-full h-full bg-bg-elevated" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Flash count badge */}
                      {flashCount > 0 && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          {flashCount} flash{flashCount > 1 ? 's' : ''} {tx({ fr: 'dispo', en: 'available' })}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        {/* Avatar */}
                        {tatoueur.avatar && (
                          <img
                            src={tatoueur.avatar}
                            alt={tatoueur.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-accent/30 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <h2 className="font-heading font-bold text-heading text-lg leading-tight">
                            {tatoueur.name}
                          </h2>
                          <div className="flex items-center gap-1.5 text-grey-muted text-xs mt-0.5">
                            {tatoueur.studio && <span>{tatoueur.studio}</span>}
                            {tatoueur.studio && tatoueur.city && <span>-</span>}
                            {tatoueur.city && (
                              <span className="flex items-center gap-0.5">
                                <MapPin size={10} />
                                {tatoueur.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Styles */}
                      {tatoueur.styles && tatoueur.styles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {tatoueur.styles.slice(0, 4).map(style => (
                            <span key={style} className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-grey-light capitalize">
                              {style}
                            </span>
                          ))}
                          {tatoueur.styles.length > 4 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-grey-muted">
                              +{tatoueur.styles.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bio preview */}
                      {bio && (
                        <p className="text-grey-muted text-xs line-clamp-2 mb-3">
                          {bio}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          {tatoueur.priceTattooMin && (
                            <span className="text-xs text-grey-muted">
                              {tx({ fr: 'A partir de', en: 'From' })} <span className="text-accent font-bold">{tatoueur.priceTattooMin}$</span>
                            </span>
                          )}
                          {tatoueur.instagramHandle && (
                            <a
                              href={`https://instagram.com/${tatoueur.instagramHandle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-grey-muted hover:text-accent transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Instagram size={14} />
                            </a>
                          )}
                        </div>
                        <ArrowRight size={16} className="text-grey-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20 p-12 rounded-2xl text-center border border-accent/30 transition-colors duration-300 cta-shadow"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
            {tx({ fr: 'Tu es tatoueur?', en: 'Are you a tattoo artist?' })}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {tx({
              fr: "Rejoins la plateforme Massive Medias. Page dediee, galerie de flashs, systeme de reservation, sous-domaine personnalise. On s'occupe de ta presence en ligne.",
              en: 'Join the Massive Medias platform. Dedicated page, flash gallery, booking system, custom subdomain. We handle your online presence.',
            })}
          </p>
          <Link to="/tatoueur/inscription" className="btn-primary">
            {tx({ fr: "S'inscrire comme tatoueur", en: 'Sign up as a tattoo artist' })}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>
      </div>
    </>
  );
}

export default Tatoueurs;
