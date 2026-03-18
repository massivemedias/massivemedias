import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Image } from 'lucide-react';
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
          fr: 'Découvrez les artistes de Massive. Tirages fine art professionnels, qualité galerie. Montréal.',
          en: 'Discover Massive artists. Professional fine art prints, gallery quality. Montreal.',
          es: 'Descubre los artistas de Massive. Impresiones fine art profesionales, calidad galería. Montreal.',
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }) },
        ]}
      />

      {/* ============ HERO ============ */}
      <section className="relative py-[2.08rem] md:py-[2.6rem] overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>
        <div className="relative z-10 section-container !py-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-2 mb-6 text-sm">
              <Link to="/" className="text-grey-muted hover:text-accent transition-colors">{tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' })}</Link>
              <span className="text-grey-muted">/</span>
              <span className="text-accent">{tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' })}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl icon-bg-blur">
                <Image size={36} className="text-accent" />
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-heading font-bold text-heading">
                  {tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' })}
                </h1>
              </div>
            </div>

            <p className="text-xl md:text-2xl text-grey-light mb-8">
              {tx({
                fr: 'Tirages fine art d\'artistes sélectionnés. Imprimés professionnellement, qualité galerie.',
                en: 'Fine art prints from selected artists. Professionally printed, gallery quality.',
                es: 'Impresiones fine art de artistas seleccionados. Impresas profesionalmente, calidad galería.',
              })}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto">

        {/* Artists grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-20">
          {artists.map((artist, index) => {
            const tagline = tx({ fr: artist.tagline.fr, en: artist.tagline.en, es: artist.tagline.es || artist.tagline.en });

            return (
              <motion.div
                key={artist.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  to={`/artistes/${artist.slug}`}
                  className="group block relative rounded-2xl overflow-hidden aspect-[3/4] card-shadow"
                >
                  {/* Background hero image */}
                  <img
                    src={artist.heroImage || artist.avatar}
                    alt={artist.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-6">
                    {/* Avatar top */}
                    <div>
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                        <img
                          src={artist.avatar || artist.heroImage}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Info bottom */}
                    <div>
                      <h2 className="text-xl md:text-2xl font-heading font-bold text-white drop-shadow-lg mb-1">
                        {artist.name}
                      </h2>
                      <p className="text-white/70 text-xs md:text-sm leading-snug mb-3 line-clamp-2">{tagline}</p>
                      <p className="text-white/50 text-xs">
                        {artist.prints.length} {tx({ fr: 'oeuvres', en: 'artworks', es: 'obras' })}
                      </p>
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
              es: 'Únete a nuestra plataforma. Nos encargamos de todo: sitio web dedicado, impresión profesional, empaque y envío. Tú provees tus archivos, fijas tu margen y recibes tu dinero. Cero dolores de cabeza.',
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
