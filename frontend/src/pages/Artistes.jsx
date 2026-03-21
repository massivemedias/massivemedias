import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useArtists } from '../hooks/useArtists';
import { mediaUrl } from '../utils/cms';
import artistsData from '../data/artists';

function Artistes() {
  const { lang, tx } = useLang();
  const { artists: cmsArtists } = useArtists();

  const artists = useMemo(() => {
    const localList = Object.values(artistsData);
    if (!cmsArtists || cmsArtists.length === 0) return localList;

    // Merge: CMS prioritaire, local en fallback
    const merged = localList.map(local => {
      const cms = cmsArtists.find(a => a.slug === local.slug);
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

    // Ajouter les artistes CMS-only (pas dans les donnees locales)
    const localSlugs = new Set(localList.map(a => a.slug));
    const cmsOnly = cmsArtists
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
        pricing: cms.pricing || { studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 }, museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 }, framePrice: 30 },
        socials: cms.socials || {},
      }));

    return [...merged, ...cmsOnly];
  }, [cmsArtists]);

  return (
    <>
      <SEO
        title={tx({ fr: 'Artistes - Tirages Fine Art | Massive', en: 'Artists - Fine Art Prints | Massive', es: 'Artistas - Impresiones Fine Art | Massive' })}
        description={tx({
          fr: 'Découvrez les artistes de Massive Medias. Tirages fine art professionnels sur papiers haut de gamme, qualité galerie et musée. Explorez leurs oeuvres et commandez en ligne depuis Montréal.',
          en: 'Discover Massive artists. Professional fine art prints, gallery quality. Montreal.',
          es: 'Descubre los artistas de Massive. Impresiones fine art profesionales, calidad galeria. Montreal.',
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }) },
        ]}
      />

      {/* ============ HERO EDITORIAL ============ */}
      <section className="pt-24 pb-6 md:pt-32 md:pb-10">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-8 text-sm">
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

            <p className="text-lg md:text-xl text-grey-light max-w-xl">
              {tx({
                fr: "Tirages fine art d'artistes sélectionnés. Qualité galerie.",
                en: 'Fine art prints from selected artists. Gallery quality.',
                es: 'Impresiones fine art de artistas seleccionados. Calidad galeria.',
              })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ EDITORIAL GRID ============ */}
      <div className="section-container max-w-7xl mx-auto pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-20">
          {artists.map((artist, index) => {
            const tagline = tx({ fr: artist.tagline.fr, en: artist.tagline.en, es: artist.tagline.es || artist.tagline.en });

            // Layout assignments based on position
            const isFeatured = index === 0;
            const isTallRight = index === 1;
            const isWide = index === artists.length - 1 && artists.length >= 6;

            // Grid classes
            let gridClasses = '';
            let aspectClasses = 'aspect-[3/4]';

            if (isFeatured) {
              gridClasses = 'md:col-span-2 md:row-span-2';
              aspectClasses = 'aspect-[3/4] md:aspect-auto md:h-full min-h-[400px] md:min-h-0';
            } else if (isTallRight) {
              gridClasses = 'md:row-span-2';
              aspectClasses = 'aspect-[3/4] md:aspect-auto md:h-full min-h-[400px] md:min-h-0';
            } else if (isWide) {
              gridClasses = 'md:col-span-2';
              aspectClasses = 'aspect-[3/4] md:aspect-[16/9]';
            }

            return (
              <motion.div
                key={artist.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true, margin: '-50px' }}
                className={gridClasses}
              >
                <Link
                  to={`/artistes/${artist.slug}`}
                  className={`group block relative overflow-hidden ${aspectClasses}`}
                >
                  {/* Full-bleed image */}
                  <img
                    src={artist.heroImage || artist.avatar}
                    alt={artist.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading={index < 2 ? 'eager' : 'lazy'}
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent group-hover:from-black/80 transition-all duration-500" />

                  {/* Content - bottom aligned */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
                    {/* Artist name */}
                    <h2 className={`font-heading font-bold text-white leading-none mb-2 drop-shadow-lg ${
                      isFeatured ? 'text-3xl md:text-6xl' : 'text-2xl md:text-3xl'
                    }`}>
                      {artist.name}
                    </h2>

                    {/* Tagline */}
                    <p className="text-white/60 text-sm md:text-base leading-snug max-w-md line-clamp-2">
                      {tagline}
                    </p>

                    {/* Artwork count + arrow - hover reveal */}
                    <div className="flex items-center justify-between mt-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <span className="text-white/40 text-xs uppercase tracking-widest">
                        {artist.prints?.length || 0} {tx({ fr: 'oeuvres', en: 'artworks', es: 'obras' })}
                      </span>
                      <ArrowRight size={18} className="text-accent" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20 p-12 rounded-2xl text-center border border-accent/30 transition-colors duration-300 cta-shadow"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
            {tx({ fr: 'Tu es artiste?', en: 'Are you an artist?', es: '\u00bfEres artista?' })}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {tx({
              fr: 'Rejoins notre plateforme. On s\'occupe de tout : site web dédié, impression pro, packaging et shipping. Tu fournis tes fichiers, tu fixes ta marge, et tu reçois ton argent. Zéro mal de tête.',
              en: 'Join our platform. We handle everything: dedicated website, professional printing, packaging and shipping. You provide your files, set your margin, and get paid. Zero headaches.',
              es: 'Unete a nuestra plataforma. Nos encargamos de todo: sitio web dedicado, impresion profesional, empaque y envio. Tu provees tus archivos, fijas tu margen y recibes tu dinero. Cero dolores de cabeza.',
            })}
          </p>
          <Link to="/contact" className="btn-primary">
            <MessageSquare size={20} className="mr-2" />
            {tx({ fr: 'Nous contacter', en: 'Contact us', es: 'Contactanos' })}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>
      </div>
    </>
  );
}

export default Artistes;
