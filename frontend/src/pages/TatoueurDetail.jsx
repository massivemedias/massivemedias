import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Instagram, ExternalLink, ArrowRight, Palette, Calendar, Filter, X, MessageCircle } from 'lucide-react';
import SEO from '../components/SEO';
import FlashCard from '../components/FlashCard';
import FlashLightbox from '../components/FlashLightbox';
import ReservationForm from '../components/ReservationForm';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import { useLang } from '../i18n/LanguageContext';
import { useTatoueurs } from '../hooks/useTatoueurs';
import { mediaUrl } from '../utils/cms';
import tatoueursData from '../data/tatoueurs';

// Composant Instagram Feed - embeds compacts en grille
function InstagramFeed({ handle, postShortcodes = [] }) {
  useEffect(() => {
    if (postShortcodes.length > 0) {
      // Charger le script Instagram embed.js
      const existing = document.querySelector('script[src*="instagram.com/embed.js"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      } else if (window.instgrm) {
        setTimeout(() => window.instgrm?.Embeds?.process(), 500);
      }
    }
  }, [postShortcodes]);

  // Re-process quand les embeds sont rendus
  useEffect(() => {
    const timer = setTimeout(() => window.instgrm?.Embeds?.process(), 1000);
    return () => clearTimeout(timer);
  }, [postShortcodes]);

  if (!handle && postShortcodes.length === 0) return null;

  return (
    <div className="space-y-4">
      {postShortcodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {postShortcodes.map((code) => (
            <div key={code} className="rounded-xl overflow-hidden" style={{ maxHeight: '380px' }}>
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={`https://www.instagram.com/p/${code}/`}
                data-instgrm-version="14"
                style={{ background: 'transparent', border: 0, borderRadius: 0, margin: 0, maxWidth: '100%', minWidth: '100px', padding: 0, width: '100%' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Lien vers Instagram */}
      {handle && (
        <div className="text-center pt-2">
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-full text-sm hover:shadow-lg hover:shadow-pink-500/25 transition-all"
          >
            <Instagram size={16} />
            @{handle}
            <ArrowRight size={14} />
          </a>
        </div>
      )}
    </div>
  );
}

function buildTatoueurFromCMS(cms) {
  if (!cms) return null;
  return {
    slug: cms.slug,
    name: cms.name,
    bioFr: cms.bioFr || '',
    bioEn: cms.bioEn || '',
    studio: cms.studio || '',
    city: cms.city || '',
    styles: cms.styles || [],
    instagramHandle: cms.instagramHandle || '',
    socials: cms.socials || {},
    links: cms.links || [],
    avatar: mediaUrl(cms.avatar),
    heroImage: mediaUrl(cms.heroImage),
    priceTattooMin: cms.priceTattooMin,
    hourlyRate: cms.hourlyRate,
    flashs: (cms.flashs || []).map(f => ({
      ...f,
      image: f.image ? mediaUrl(f.image) : null,
    })),
    realisationImages: (cms.realisationImages || []).map(img => mediaUrl(img)),
    calendarSettings: cms.calendarSettings || null,
  };
}

function TatoueurDetail({ subdomainSlug }) {
  const { slug: routeSlug } = useParams();
  const slug = subdomainSlug || routeSlug;
  const { lang, tx } = useLang();
  const { tatoueurs: cmsTatoueurs } = useTatoueurs();

  const [selectedFlash, setSelectedFlash] = useState(null);
  const [reservingFlash, setReservingFlash] = useState(null);
  const [activeStyle, setActiveStyle] = useState(null);
  const [activeStatus, setActiveStatus] = useState(null);

  const tatoueur = useMemo(() => {
    const local = tatoueursData[slug] || null;
    const cmsData = cmsTatoueurs?.find(t => t.slug === slug);
    if (!cmsData && !local) return null;
    if (!cmsData) return local;
    const cms = buildTatoueurFromCMS(cmsData);
    if (!local) return cms;
    // CMS prioritaire, local en fallback
    return {
      ...local,
      ...cms,
      bioFr: cms.bioFr || local.bioFr,
      bioEn: cms.bioEn || local.bioEn,
      socials: Object.keys(cms.socials || {}).length > 0 ? cms.socials : local.socials,
      flashs: cms.flashs && cms.flashs.length > 0 ? cms.flashs : local.flashs,
      avatar: cms.avatar || local.avatar,
      heroImage: cms.heroImage || local.heroImage,
    };
  }, [cmsTatoueurs, slug]);

  const bio = useMemo(() => {
    if (!tatoueur) return '';
    return lang === 'en' ? (tatoueur.bioEn || tatoueur.bioFr) : (tatoueur.bioFr || tatoueur.bioEn);
  }, [tatoueur, lang]);

  const flashs = useMemo(() => {
    if (!tatoueur?.flashs) return [];
    let list = tatoueur.flashs;
    if (activeStyle) list = list.filter(f => f.style === activeStyle);
    if (activeStatus) list = list.filter(f => f.status === activeStatus);
    return list;
  }, [tatoueur, activeStyle, activeStatus]);

  const flashStyles = useMemo(() => {
    if (!tatoueur?.flashs) return [];
    const styles = new Set(tatoueur.flashs.map(f => f.style).filter(Boolean));
    return [...styles];
  }, [tatoueur]);

  const stats = useMemo(() => {
    if (!tatoueur?.flashs) return { disponible: 0, reserve: 0, tatoue: 0, total: 0 };
    const flashList = tatoueur.flashs;
    return {
      disponible: flashList.filter(f => f.status === 'disponible').length,
      reserve: flashList.filter(f => f.status === 'reserve').length,
      tatoue: flashList.filter(f => f.status === 'tatoue').length,
      total: flashList.length,
    };
  }, [tatoueur]);

  if (!tatoueur) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-3xl font-heading font-bold text-heading mb-4">
          {tx({ fr: 'Tatoueur non trouve', en: 'Tattoo artist not found' })}
        </h1>
        <Link to="/tatoueurs" className="btn-primary">
          <ArrowRight size={20} className="mr-2 rotate-180" />
          {tx({ fr: 'Voir tous les tatoueurs', en: 'View all tattoo artists' })}
        </Link>
      </div>
    );
  }

  const handleReserve = (flash) => {
    setSelectedFlash(null);
    setReservingFlash(flash);
  };

  return (
    <>
      <SEO
        title={`${tatoueur.name} - ${tx({ fr: 'Tatoueur', en: 'Tattoo Artist' })} | Massive`}
        description={bio ? bio.slice(0, 160) : `${tatoueur.name} - ${tx({ fr: 'Tatoueur partenaire Massive Medias', en: 'Massive Medias partner tattoo artist' })}`}
        image={tatoueur.heroImage || tatoueur.avatar}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home' }), url: '/' },
          { name: tx({ fr: 'Tatoueurs', en: 'Tattoo Artists' }), url: '/tatoueurs' },
          { name: tatoueur.name },
        ]}
      />

      {/* ========== HERO ========== */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-end">
        {/* Background */}
        {tatoueur.heroImage ? (
          <img
            src={tatoueur.heroImage}
            alt={tatoueur.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-bg-elevated to-bg-base" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="relative z-10 section-container w-full pb-8 md:pb-12 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row items-start md:items-end gap-6"
          >
            {/* Avatar */}
            {tatoueur.avatar && (
              <img
                src={tatoueur.avatar}
                alt={tatoueur.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-accent/40 shadow-2xl"
              />
            )}

            <div className="flex-1 min-w-0">
              {/* Name */}
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-white leading-none mb-2 drop-shadow-lg">
                {tatoueur.name}
              </h1>

              {/* Studio + City */}
              <div className="flex items-center gap-3 text-white/70 text-sm md:text-base mb-4">
                {tatoueur.studio && <span>{tatoueur.studio}</span>}
                {tatoueur.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {tatoueur.city}
                  </span>
                )}
              </div>

              {/* Style badges */}
              {tatoueur.styles && tatoueur.styles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tatoueur.styles.map(style => (
                    <span key={style} className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 capitalize backdrop-blur-sm border border-white/10">
                      {style}
                    </span>
                  ))}
                </div>
              )}

              {/* Social links */}
              <div className="flex items-center gap-3">
                {tatoueur.instagramHandle && (
                  <a
                    href={`https://instagram.com/${tatoueur.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-white/70 hover:text-accent transition-colors text-sm"
                  >
                    <Instagram size={18} />
                    @{tatoueur.instagramHandle}
                  </a>
                )}
                {tatoueur.socials?.website && (
                  <a
                    href={tatoueur.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-white/70 hover:text-accent transition-colors text-sm"
                  >
                    <ExternalLink size={16} />
                    Website
                  </a>
                )}
              </div>
            </div>

            {/* CTA */}
            {stats.disponible > 0 && (
              <a
                href="#flashs"
                className="btn-primary flex-shrink-0"
              >
                <Palette size={20} className="mr-2" />
                {stats.disponible} flash{stats.disponible > 1 ? 's' : ''} {tx({ fr: 'disponible', en: 'available' })}{stats.disponible > 1 ? 's' : ''}
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* ========== BIO + DISPONIBILITES ========== */}
      <section className="py-12 md:py-16">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Colonne gauche: A propos */}
            {bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-heading font-bold text-heading mb-6">
                  {tx({ fr: 'A propos', en: 'About', es: 'Acerca de' })}
                </h2>
                <p className="text-grey-light leading-relaxed text-base md:text-lg">
                  {bio}
                </p>
              </motion.div>
            )}

            {/* Colonne droite: Disponibilites */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
                <Calendar size={22} className="text-accent" />
                {tx({ fr: 'Disponibilites', en: 'Availability', es: 'Disponibilidades' })}
              </h2>
              <AvailabilityCalendar calendarSettings={tatoueur.calendarSettings} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== FLASHS ========== */}
      <section id="flashs" className="py-12 md:py-16 bg-bg-elevated/30">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading">
                {tx({ fr: 'Flashs disponibles', en: 'Available Flash Designs' })}
              </h2>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {/* Status filter */}
                {['disponible', 'reserve', 'tatoue'].map(status => {
                  const labels = {
                    disponible: { fr: 'Disponibles', en: 'Available', es: 'Disponibles' },
                    reserve: { fr: 'Réservés', en: 'Reserved', es: 'Reservados' },
                    tatoue: { fr: 'Tatoués', en: 'Tattooed', es: 'Tatuados' },
                  };
                  const colors = {
                    disponible: 'bg-green-500',
                    reserve: 'bg-amber-500',
                    tatoue: 'bg-gray-500',
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => setActiveStatus(activeStatus === status ? null : status)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                        activeStatus === status
                          ? 'bg-accent text-black font-bold'
                          : 'bg-bg-card text-grey-light hover:text-accent border border-white/5'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
                      {tx(labels[status])}
                    </button>
                  );
                })}

                {/* Style filter */}
                {flashStyles.length > 1 && flashStyles.map(style => (
                  <button
                    key={style}
                    onClick={() => setActiveStyle(activeStyle === style ? null : style)}
                    className={`text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${
                      activeStyle === style
                        ? 'bg-accent text-black font-bold'
                        : 'bg-bg-card text-grey-light hover:text-accent border border-white/5'
                    }`}
                  >
                    {style}
                  </button>
                ))}

                {(activeStyle || activeStatus) && (
                  <button
                    onClick={() => { setActiveStyle(null); setActiveStatus(null); }}
                    className="text-xs px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1"
                  >
                    <X size={12} />
                    {tx({ fr: 'Reinitialiser', en: 'Reset' })}
                  </button>
                )}
              </div>
            </div>

            {/* Flash Grid */}
            {flashs.length === 0 ? (
              <div className="text-center py-16">
                <Palette className="w-16 h-16 text-grey-muted/30 mx-auto mb-4" />
                <p className="text-grey-muted text-lg">
                  {tx({ fr: 'Aucun flash pour ces filtres.', en: 'No flash designs for these filters.' })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
                {flashs.map((flash, index) => (
                  <FlashCard
                    key={flash.id || index}
                    flash={flash}
                    onClick={setSelectedFlash}
                    index={index}
                    hidePrices={tatoueur.hidePrices}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Disponibilites integrees dans la section Bio ci-dessus */}

      {/* ========== REALISATIONS ========== */}
      {(tatoueur.realisations?.length > 0 || tatoueur.realisationImages?.length > 0 || tatoueur.instagramHandle) && (
        <section className="py-12 md:py-16">
          <div className="section-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading flex items-center gap-3">
                  <Instagram size={28} className="text-accent" />
                  {tx({ fr: 'Realisations', en: 'Portfolio' })}
                </h2>
                {tatoueur.instagramHandle && (
                  <a
                    href={`https://instagram.com/${tatoueur.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-grey-muted hover:text-accent transition-colors flex items-center gap-1"
                  >
                    @{tatoueur.instagramHandle}
                    <ArrowRight size={14} />
                  </a>
                )}
              </div>

              {/* Grille de realisations ou feed Instagram */}
              {(() => {
                // Support both local realisations (objects with image/caption) and CMS realisationImages (urls)
                const reals = tatoueur.realisations?.length > 0
                  ? tatoueur.realisations
                  : (tatoueur.realisationImages || []).map((img, i) => ({
                      image: typeof img === 'string' ? img : mediaUrl(img),
                      caption: `Realisation ${i + 1}`,
                    }));

                // Si pas de realisations locales, afficher les embeds Instagram
                if (reals.length === 0 && (tatoueur.instagramPosts?.length > 0 || tatoueur.instagramHandle)) {
                  return <InstagramFeed handle={tatoueur.instagramHandle} postShortcodes={tatoueur.instagramPosts || []} />;
                }

                return reals.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {reals.map((real, i) => {
                    const imgSrc = typeof real === 'string' ? real : (real.image || real);
                    const caption = typeof real === 'string' ? null : real.caption;
                    return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      viewport={{ once: true }}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setSelectedFlash({ image: imgSrc, titleFr: caption, titleEn: caption, status: 'tatoue' })}
                    >
                      <img
                        src={imgSrc}
                        alt={caption || `Realisation ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-xs font-medium drop-shadow-lg">{caption}</p>
                        </div>
                      )}
                    </motion.div>
                    );
                  })}
                </div>
              ) : null})()}

              {/* Lien Instagram sous la grille */}
              {(tatoueur.realisations?.length > 0 || tatoueur.realisationImages?.length > 0) && tatoueur.instagramHandle && (
                <div className="text-center mt-6">
                  <a
                    href={`https://instagram.com/${tatoueur.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-grey-muted hover:text-accent transition-colors"
                  >
                    <Instagram size={16} />
                    {tx({ fr: 'Voir plus sur Instagram', en: 'See more on Instagram' })}
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* ========== PRICING INFO ========== */}
      {(tatoueur.priceTattooMin || tatoueur.hourlyRate) && (
        <section className="py-12 md:py-16">
          <div className="section-container max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-bg-card rounded-2xl p-8 border border-white/5"
            >
              <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
                <Calendar size={24} className="text-accent" />
                {tx({ fr: 'Tarifs et reservation', en: 'Pricing and booking' })}
              </h2>

              <div className="space-y-4">
                {tatoueur.priceTattooMin && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-grey-light">{tx({ fr: 'Prix minimum', en: 'Minimum price' })}</span>
                    <span className="text-xl font-bold text-accent">{tatoueur.priceTattooMin}$</span>
                  </div>
                )}
                {tatoueur.hourlyRate && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-grey-light">{tx({ fr: 'Taux horaire', en: 'Hourly rate' })}</span>
                    <span className="text-xl font-bold text-accent">{tatoueur.hourlyRate}$/h</span>
                  </div>
                )}
              </div>

              <p className="text-grey-muted text-sm mt-6">
                {tx({
                  fr: "Le prix final depend de la taille, la complexite et l'emplacement du tatouage. Chaque flash a son propre prix fixe.",
                  en: 'Final price depends on size, complexity and placement. Each flash design has its own fixed price.',
                })}
              </p>

              <div className="mt-6">
                {tatoueur.instagramHandle ? (
                  <a
                    href={`https://instagram.com/${tatoueur.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center"
                  >
                    <Instagram size={20} className="mr-2" />
                    {tx({ fr: 'Contacter sur Instagram', en: 'Contact on Instagram' })}
                  </a>
                ) : (
                  <Link to="/contact" className="btn-primary w-full text-center">
                    {tx({ fr: 'Nous contacter', en: 'Contact us' })}
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ========== CUSTOM LINKS ========== */}
      {tatoueur.links && tatoueur.links.length > 0 && (
        <section className="pb-12 md:pb-16">
          <div className="section-container max-w-3xl">
            <div className="space-y-2">
              {tatoueur.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-bg-card rounded-xl border border-white/5 hover:border-accent/20 transition-colors group"
                >
                  <span className="text-heading font-medium">{link.label}</span>
                  <ExternalLink size={16} className="text-grey-muted group-hover:text-accent transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== COMMENT CA MARCHE ========== */}
      <section className="py-16 md:py-20 bg-bg-elevated/30">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading text-center mb-10">
              {tx({ fr: 'Comment ca marche', en: 'How it works', es: 'Como funciona' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  num: '1',
                  titleFr: 'Choisis ton flash', titleEn: 'Choose your flash', titleEs: 'Elige tu flash',
                  descFr: 'Parcours la galerie et selectionne le design qui te plait. Chaque flash est une piece unique.',
                  descEn: 'Browse the gallery and select the design you like. Each flash is a unique piece.',
                  descEs: 'Navega por la galeria y selecciona el diseno que te guste. Cada flash es una pieza unica.',
                },
                {
                  num: '2',
                  titleFr: 'Reserve ta piece', titleEn: 'Reserve your piece', titleEs: 'Reserva tu pieza',
                  descFr: 'Envoie un message avec l\'emplacement souhaite et tes disponibilites. Un depot de 40$ confirme ta reservation.',
                  descEn: 'Send a message with your desired placement and availability. A $40 deposit confirms your reservation.',
                  descEs: 'Envia un mensaje con la ubicacion deseada y tus disponibilidades. Un deposito de 40$ confirma tu reserva.',
                },
                {
                  num: '3',
                  titleFr: 'Rendez-vous tattoo', titleEn: 'Tattoo appointment', titleEs: 'Cita de tatuaje',
                  descFr: 'L\'artiste confirme la date et l\'heure. Presente-toi au studio et repars avec ta piece unique.',
                  descEn: 'The artist confirms the date and time. Show up at the studio and leave with your unique piece.',
                  descEs: 'El artista confirma la fecha y hora. Presentate en el estudio y vete con tu pieza unica.',
                },
              ].map((step) => (
                <div key={step.num} className="relative">
                  <div className="absolute -top-3 left-4 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold z-10">
                    {step.num}
                  </div>
                  <div className="bg-bg-card rounded-xl border border-white/5 p-6 pt-8 h-full">
                    <h3 className="text-lg font-heading font-bold text-heading mb-2">
                      {tx({ fr: step.titleFr, en: step.titleEn, es: step.titleEs })}
                    </h3>
                    <p className="text-grey-muted text-sm leading-relaxed">
                      {tx({ fr: step.descFr, en: step.descEn, es: step.descEs })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== CTA TATOUEUR ========== */}
      <section className="py-16 md:py-20">
        <div className="section-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
              {tx({ fr: 'Tu es tatoueur? Rejoins la plateforme.', en: 'Are you a tattoo artist? Join the platform.', es: 'Eres tatuador? Unete a la plataforma.' })}
            </h2>
            <p className="text-grey-muted text-base md:text-lg mb-8 leading-relaxed">
              {tx({
                fr: "On s'occupe de tout : page web dediee, galerie de flashs, systeme de reservation et messagerie avec tes clients. Tu publies tes flashs, tu geres tes disponibilites, et tu recois tes reservations.",
                en: "We take care of everything: dedicated web page, flash gallery, booking system and messaging with your clients. You publish your flashes, manage your availability, and receive your bookings.",
                es: "Nos encargamos de todo: pagina web dedicada, galeria de flashs, sistema de reservas y mensajeria con tus clientes. Publicas tus flashs, gestionas tu disponibilidad y recibes tus reservas.",
              })}
            </p>
            <Link
              to="/contact?tab=tatoueur"
              className="inline-flex items-center gap-3 px-8 py-4 bg-accent/15 border border-accent/30 text-accent font-heading font-bold text-lg rounded-full hover:bg-accent/25 transition-all hover:shadow-lg hover:shadow-accent/10"
            >
              <MessageCircle size={22} />
              {tx({ fr: 'Contactez-nous', en: 'Contact us', es: 'Contactanos' })}
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== BACK LINK ========== */}
      <div className="section-container pb-20">
        <Link
          to="/tatoueurs"
          className="inline-flex items-center gap-2 text-grey-muted hover:text-accent transition-colors text-sm"
        >
          <ArrowRight size={16} className="rotate-180" />
          {tx({ fr: 'Tous les tatoueurs', en: 'All tattoo artists' })}
        </Link>
      </div>

      {/* ========== LIGHTBOX ========== */}
      {selectedFlash && (
        <FlashLightbox
          flash={selectedFlash}
          onClose={() => setSelectedFlash(null)}
          onReserve={handleReserve}
          tatoueurName={tatoueur.name}
          allFlashs={tatoueur.flashs || []}
          onNavigate={setSelectedFlash}
          hidePrices={tatoueur.hidePrices}
        />
      )}

      {/* ========== RESERVATION FORM ========== */}
      {reservingFlash && (
        <ReservationForm
          flash={reservingFlash}
          tatoueur={tatoueur}
          onClose={() => setReservingFlash(null)}
          onSuccess={() => setReservingFlash(null)}
        />
      )}
    </>
  );
}

export default TatoueurDetail;
