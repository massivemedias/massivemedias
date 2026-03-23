import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Instagram, ExternalLink, ArrowRight, Palette, Calendar, Filter, X } from 'lucide-react';
import SEO from '../components/SEO';
import FlashCard from '../components/FlashCard';
import FlashLightbox from '../components/FlashLightbox';
import ReservationForm from '../components/ReservationForm';
import { useLang } from '../i18n/LanguageContext';
import { useTatoueurs } from '../hooks/useTatoueurs';
import { mediaUrl } from '../utils/cms';
import tatoueursData from '../data/tatoueurs';

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

      {/* ========== BIO ========== */}
      {bio && (
        <section className="py-12 md:py-16">
          <div className="section-container max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-heading font-bold text-heading mb-6">
                {tx({ fr: 'A propos', en: 'About' })}
              </h2>
              <p className="text-grey-light leading-relaxed text-base md:text-lg">
                {bio}
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center p-4 bg-bg-card rounded-xl border border-white/5">
                  <span className="block text-2xl font-heading font-bold text-green-500">{stats.disponible}</span>
                  <span className="text-xs text-grey-muted">{tx({ fr: 'Disponibles', en: 'Available' })}</span>
                </div>
                <div className="text-center p-4 bg-bg-card rounded-xl border border-white/5">
                  <span className="block text-2xl font-heading font-bold text-amber-500">{stats.reserve}</span>
                  <span className="text-xs text-grey-muted">{tx({ fr: 'Reserves', en: 'Reserved' })}</span>
                </div>
                <div className="text-center p-4 bg-bg-card rounded-xl border border-white/5">
                  <span className="block text-2xl font-heading font-bold text-grey-light">{stats.tatoue}</span>
                  <span className="text-xs text-grey-muted">{tx({ fr: 'Tatoues', en: 'Tattooed' })}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

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
                    disponible: { fr: 'Disponibles', en: 'Available' },
                    reserve: { fr: 'Reserves', en: 'Reserved' },
                    tatoue: { fr: 'Tatoues', en: 'Tattooed' },
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {flashs.map((flash, index) => (
                  <FlashCard
                    key={flash.id || index}
                    flash={flash}
                    onClick={setSelectedFlash}
                    index={index}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ========== REALISATIONS ========== */}
      {(tatoueur.realisations?.length > 0 || tatoueur.instagramHandle) && (
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

              {/* Grille de realisations */}
              {tatoueur.realisations?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {tatoueur.realisations.map((real, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      viewport={{ once: true }}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setSelectedFlash({ image: real.image, titleFr: real.caption, titleEn: real.caption, status: 'tatoue' })}
                    >
                      <img
                        src={real.image}
                        alt={real.caption || `Realisation ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {real.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-xs font-medium drop-shadow-lg">{real.caption}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-bg-card rounded-2xl border border-white/5 p-8 text-center">
                  <p className="text-grey-muted mb-4">
                    {tx({
                      fr: `Decouvrez les realisations de ${tatoueur.name} sur Instagram`,
                      en: `Discover ${tatoueur.name}'s work on Instagram`,
                    })}
                  </p>
                  <a
                    href={`https://instagram.com/${tatoueur.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center"
                  >
                    <Instagram size={20} className="mr-2" />
                    {tx({ fr: 'Voir sur Instagram', en: 'View on Instagram' })}
                  </a>
                </div>
              )}

              {/* Lien Instagram sous la grille */}
              {tatoueur.realisations?.length > 0 && tatoueur.instagramHandle && (
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
