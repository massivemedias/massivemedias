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
    if (cmsArtists && cmsArtists.length > 0) {
      return cmsArtists.map(a => ({
        slug: a.slug,
        name: a.name,
        tagline: { fr: a.taglineFr || '', en: a.taglineEn || '' },
        avatar: mediaUrl(a.avatar),
        heroImage: mediaUrl(a.heroImage),
        prints: a.prints || [],
        pricing: a.pricing || { studio: { a4: 35 }, museum: { a4: 75 }, framePrice: 20 },
      }));
    }
    return Object.values(artistsData);
  }, [cmsArtists]);

  return (
    <>
      <SEO
        title={tx({ fr: 'Artistes - Tirages Fine Art | Massive Medias', en: 'Artists - Fine Art Prints | Massive Medias', es: 'Artistas - Impresiones Fine Art | Massive Medias' })}
        description={tx({
          fr: 'Découvrez les artistes de Massive Medias. Tirages fine art professionnels, qualité galerie. Montréal.',
          en: 'Discover Massive Medias artists. Professional fine art prints, gallery quality. Montreal.',
          es: 'Descubre los artistas de Massive Medias. Impresiones fine art profesionales, calidad galería. Montreal.',
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-20">
          {artists.map((artist, index) => {
            const tagline = tx({ fr: artist.tagline.fr, en: artist.tagline.en, es: artist.tagline.es || artist.tagline.en });
            const minPrice = Math.min(...Object.values(artist.pricing.studio));

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
                  className="group flex flex-col items-center text-center"
                >
                  <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-2 border-purple-main/30 group-hover:border-accent/60 transition-all duration-300 group-hover:scale-105 card-shadow">
                    <img
                      src={artist.avatar || artist.heroImage}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h2 className="text-lg md:text-xl font-heading font-bold text-heading mt-4 mb-1">
                    {artist.name}
                  </h2>
                  <p className="text-grey-muted text-xs mb-2">{tagline}</p>
                  <p className="text-grey-muted text-xs mb-3">
                    {artist.prints.length} {tx({ fr: 'oeuvres', en: 'artworks', es: 'obras' })} · {tx({ fr: `${minPrice}$+`, en: `$${minPrice}+`, es: `$${minPrice}+` })}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold group-hover:gap-2.5 transition-all">
                    {tx({ fr: 'Voir', en: 'View', es: 'Ver' })}
                    <ArrowRight size={16} />
                  </span>
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
