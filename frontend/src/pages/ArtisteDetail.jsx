import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MessageSquare, ChevronDown, ChevronLeft, ChevronRight, CheckCircle, Image, ExternalLink, X, ZoomIn } from 'lucide-react';
import SEO from '../components/SEO';
import { getArtistSchema } from '../components/seo/schemas';
import ArtistPrintCard from '../components/ArtistPrintCard';
import ConfiguratorArtistPrint from '../components/configurators/ConfiguratorArtistPrint';
import ConfiguratorArtistSticker from '../components/configurators/ConfiguratorArtistSticker';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import { useArtists } from '../hooks/useArtists';
import { mediaUrl } from '../utils/cms';
import artistsData from '../data/artists';
import { toFull } from '../utils/paths';
import { useAuth } from '../contexts/AuthContext';

function buildArtistFromCMS(cms) {
  if (!cms) return null;
  return {
    slug: cms.slug,
    name: cms.name,
    tagline: { fr: cms.taglineFr || '', en: cms.taglineEn || '' },
    bio: { fr: cms.bioFr || '', en: cms.bioEn || '' },
    demarche: (cms.demarcheFr || cms.demarcheEn) ? { fr: cms.demarcheFr || [], en: cms.demarcheEn || [] } : null,
    avatar: mediaUrl(cms.avatar),
    heroImage: mediaUrl(cms.heroImage),
    socials: cms.socials || {},
    pricing: cms.pricing || { studio: { a4: 35, a3: 50, a3plus: 65, a2: 85 }, museum: { a4: 75, a3: 120, a3plus: 160, a2: 225 }, framePriceByFormat: { postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 } },
    prints: (cms.prints || []).map((p, i) => ({
      ...p,
      image: cms.printImages?.[i] ? mediaUrl(cms.printImages[i]) : p.image || '',
      fullImage: cms.printImages?.[i] ? mediaUrl(cms.printImages[i]) : p.fullImage || '',
    })),
  };
}

function ArtisteDetail({ subdomainSlug }) {
  const { slug: routeSlug } = useParams();
  const slug = subdomainSlug || routeSlug;
  const { lang, tx } = useLang();
  const { theme } = useTheme();
  const { artists: cmsArtists } = useArtists();
  const { user } = useAuth();

  const artist = useMemo(() => {
    const local = artistsData[slug] || null;
    const cmsArr = !cmsArtists ? [] : Array.isArray(cmsArtists) ? cmsArtists : Object.values(cmsArtists);
    const cmsArtist = cmsArr.find(a => a.slug === slug);
    if (!cmsArtist && !local) return null;
    if (!cmsArtist) return local;
    const cms = buildArtistFromCMS(cmsArtist);
    if (!local) return cms;
    // Local = base, CMS = override pour les champs simples, ajout pour les listes
    const mergeList = (cmsList, localList) => {
      const cms2 = Array.isArray(cmsList) ? cmsList : [];
      const local2 = Array.isArray(localList) ? localList : [];
      if (cms2.length === 0) return local2;
      if (local2.length === 0) return cms2;
      const localIds = new Set(local2.map(p => p.id));
      const newFromCms = cms2.filter(p => !localIds.has(p.id));
      return [...local2, ...newFromCms];
    };
    return {
      ...local,
      ...cms,
      tagline: (cms.tagline.fr || cms.tagline.en) ? cms.tagline : local.tagline,
      bio: (cms.bio.fr || cms.bio.en) ? cms.bio : local.bio,
      demarche: cms.demarche || local.demarche || null,
      socials: { ...(local.socials || {}), ...(cms.socials || {}) },
      prints: mergeList(cms.prints, local.prints),
      stickers: mergeList(cms.stickers, local.stickers),
      merch: mergeList(cms.merch, local.merch),
      pricing: cms.pricing || local.pricing,
      avatar: (cms.socials?.avatarUrl) || (cms.avatar && !cms.avatar.includes('undefined') ? cms.avatar : null) || local.avatar,
      heroImage: (cms.heroImage && !cms.heroImage.includes('undefined')) ? cms.heroImage : local.heroImage,
    };
  }, [cmsArtists, slug]);
  const [selectedPrint, setSelectedPrint] = useState(null);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const configuratorRef = useRef(null);
  const stickerConfiguratorRef = useRef(null);
  const printConfigsRef = useRef({}); // Sauvegarder la config par print id
  const [searchParams] = useSearchParams();

  // Auto-select sticker from URL param (e.g. ?sticker=psyqu33n-stk-002)
  useEffect(() => {
    const stickerId = searchParams.get('sticker');
    if (stickerId && artist?.stickers?.length) {
      const sticker = artist.stickers.find(s => s.id === stickerId);
      if (sticker) {
        setSelectedSticker(sticker);
        setTimeout(() => {
          stickerConfiguratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [artist, searchParams]);

  // Auto-select print from URL param (e.g. ?print=psyqu33n-001)
  useEffect(() => {
    const printId = searchParams.get('print');
    if (printId && artist?.prints?.length) {
      const print = artist.prints.find(p => p.id === printId);
      if (print) {
        setSelectedPrint(print);
        setTimeout(() => {
          configuratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [artist, searchParams]);

  // Fleches clavier dans le lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') { setLightbox(null); return; }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const dir = e.key === 'ArrowLeft' ? -1 : 1;
      const isSticker = typeof lightbox === 'object' && lightbox.type === 'sticker';
      const items = isSticker ? (artist?.stickers || []) : (artist?.prints || []);
      if (items.length <= 1) return;
      const idx = isSticker ? lightbox.index : lightbox;
      const next = (idx + dir + items.length) % items.length;
      setLightbox(isSticker ? { type: 'sticker', index: next } : next);
      if (!isSticker) setSelectedPrint(items[next]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox, artist]);

  // Fleches clavier dans le configurateur (quand pas de lightbox)
  useEffect(() => {
    if (!selectedPrint || lightbox !== null || !artist?.prints?.length) return;
    const handleKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      const dir = e.key === 'ArrowLeft' ? -1 : 1;
      const idx = artist.prints.findIndex(p => p.id === selectedPrint.id);
      const next = (idx + dir + artist.prints.length) % artist.prints.length;
      setSelectedPrint(artist.prints[next]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedPrint, lightbox, artist]);

  if (!artist) {
    return (
      <div className="section-container pt-32 text-center">
        <h1 className="text-4xl font-heading font-bold text-heading mb-4">
          {tx({ fr: 'Artiste introuvable', en: 'Artist not found', es: 'Artista no encontrado' })}
        </h1>
        <Link to="/artistes" className="text-accent hover:underline">
          {tx({ fr: '← Retour aux artistes', en: '← Back to artists', es: '← Volver a artistas' })}
        </Link>
      </div>
    );
  }

  const tagline = tx({ fr: artist.tagline.fr, en: artist.tagline.en, es: artist.tagline.es || artist.tagline.en });
  const bio = tx({ fr: artist.bio.fr, en: artist.bio.en, es: artist.bio.es || artist.bio.en });
  const minPrice = Math.min(...Object.values(artist.pricing.studio).filter(v => v != null));

  // Renommages depuis Supabase user_metadata (si artiste connecte)
  const localRenames = useMemo(() => {
    return user?.user_metadata?.artist_renames || {};
  }, [user]);
  const getItemTitle = (item) => {
    if (localRenames[item.id]) return localRenames[item.id];
    return tx({ fr: item.titleFr, en: item.titleEn, es: item.titleEs || item.titleEn });
  };

  // Liens sociaux : Supabase user_metadata (si artiste connecte) > artists.js
  const artistSocials = useMemo(() => {
    // Si l'artiste connecte visite sa propre page, lire ses socials depuis Supabase
    const meta = user?.user_metadata;
    if (meta?.artist_socials && Object.keys(meta.artist_socials).length > 0) {
      return { ...artist?.socials, ...meta.artist_socials };
    }
    return artist?.socials || {};
  }, [user, artist]);

  const handleSelectPrint = (print) => {
    setSelectedPrint(print);
    setTimeout(() => {
      configuratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const navigatePrint = (dir) => {
    if (!selectedPrint || !artist?.prints?.length) return;
    const idx = artist.prints.findIndex(p => p.id === selectedPrint.id);
    const next = (idx + dir + artist.prints.length) % artist.prints.length;
    setSelectedPrint(artist.prints[next]);
  };

  const handleSelectSticker = (sticker) => {
    setSelectedSticker(sticker);
    setTimeout(() => {
      stickerConfiguratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const highlights = tx({
    fr: [
      'Tirages fine art professionnels, qualité galerie',
      'Imprimés par Massive, Montréal',
      'Papiers d\'archives, encres pigmentées',
      'Soft proofing et calibration couleurs inclus',
      'Pick-up gratuit Mile-End ou livraison',
      'Cadre noir ou blanc disponible',
    ],
    en: [
      'Professional fine art prints, gallery quality',
      'Printed by Massive, Montreal',
      'Archival papers, pigmented inks',
      'Soft proofing and color calibration included',
      'Free Mile-End pick-up or delivery',
      'Black or white frame available',
    ],
    es: [
      'Impresiones fine art profesionales, calidad galeria',
      'Impresas por Massive, Montreal',
      'Papeles de archivo, tintas pigmentadas',
      'Soft proofing y calibracion de colores incluidos',
      'Recogida gratuita en Mile-End o envio',
      'Marco negro o blanco disponible',
    ],
  });

  const processSteps = tx({
    fr: [
      { step: '1', title: 'Choisissez', desc: 'Sélectionnez une oeuvre et configurez votre tirage - série, format et cadre.' },
      { step: '2', title: 'On imprime', desc: 'Impression professionnelle dans nos studios. Soft proofing et contrôle qualité avant envoi.' },
      { step: '3', title: 'Livraison', desc: 'Pick-up gratuit au Mile-End ou livraison partout dans le monde. Frais de port configurables lors du paiement.' },
    ],
    en: [
      { step: '1', title: 'Choose', desc: 'Select an artwork and configure your print - series, format and frame.' },
      { step: '2', title: 'We print', desc: 'Professional printing in our studios. Soft proofing and quality control before shipping.' },
      { step: '3', title: 'Delivery', desc: 'Free Mile-End pick-up or worldwide shipping. Shipping fees configurable at checkout.' },
    ],
    es: [
      { step: '1', title: 'Elige', desc: 'Selecciona una obra y configura tu impresion - serie, formato y marco.' },
      { step: '2', title: 'Imprimimos', desc: 'Impresion profesional en nuestros estudios. Soft proofing y control de calidad antes del envio.' },
      { step: '3', title: 'Entrega', desc: 'Recogida gratuita en Mile-End o envio a todo el mundo. Gastos de envio configurables en el pago.' },
    ],
  });

  const equipmentItems = [
    { name: tx({ fr: 'Impression pigmentée 4 couleurs', en: '4-Color Pigment Printing', es: 'Impresion pigmentada 4 colores' }), desc: tx({ fr: 'Qualité décoration - Série Studio', en: 'Decoration quality - Studio Series', es: 'Calidad decoracion - Serie Studio' }) },
    { name: tx({ fr: 'Impression pigmentée 12 couleurs', en: '12-Color Pigment Printing', es: 'Impresion pigmentada 12 colores' }), desc: tx({ fr: 'Qualité galerie - Série Musée', en: 'Gallery quality - Museum Series', es: 'Calidad galeria - Serie Museo' }) },
    { name: tx({ fr: 'Papiers Fine Art', en: 'Fine Art Papers', es: 'Papeles Fine Art' }), desc: 'Hahnemuhle, Canson, Ilford' },
  ];

  const faqItems = tx({
    fr: [
      { q: 'Comment se passe la commande?', a: 'Sélectionnez l\'oeuvre, la qualité d\'impression, le format et le cadre. Ajoutez au panier et procédez au paiement. Nous imprimons et préparons votre commande avec soin.' },
      { q: 'Quelle est la différence entre Studio et Musée?', a: 'La Série Studio utilise une imprimante 4 encres pigmentées, parfaite pour la décoration. La Série Musée utilise une imprimante 12 encres pigmentées pour une qualité galerie, idéale pour les collectionneurs.' },
      { q: 'Puis-je récupérer sur place?', a: 'Oui! Pick-up gratuit au Mile-End (7049 rue Saint-Urbain, Montréal). Livraison locale aussi disponible.' },
      { q: 'Les tirages sont-ils signés?', a: 'Les tirages sont imprimés professionnellement par Massive en collaboration avec l\'artiste. Contactez-nous pour les tirages signés ou numérotés.' },
      { q: 'Offrez-vous l\'encadrement?', a: 'Oui, cadre noir ou blanc disponible. Ajoutez l\'option cadre directement dans le configurateur.' },
    ],
    en: [
      { q: 'How does ordering work?', a: 'Select the artwork, print quality, format and frame. Add to cart and proceed to payment. We print and prepare your order with care.' },
      { q: 'What\'s the difference between Studio and Museum?', a: 'Studio Series uses a 4-color pigment printer, perfect for decoration. Museum Series uses a 12-color pigment printer for gallery quality, ideal for collectors.' },
      { q: 'Can I pick up in person?', a: 'Yes! Free pick-up in Mile-End (7049 rue Saint-Urbain, Montreal). Local delivery also available.' },
      { q: 'Are the prints signed?', a: 'Prints are professionally printed by Massive in collaboration with the artist. Contact us for signed or numbered editions.' },
      { q: 'Do you offer framing?', a: 'Yes, black or white frame available. Add the frame option directly in the configurator.' },
    ],
    es: [
      { q: 'Como funciona el pedido?', a: 'Selecciona la obra, la calidad de impresion, el formato y el marco. Agrega al carrito y procede al pago. Imprimimos y preparamos tu pedido con cuidado.' },
      { q: 'Cual es la diferencia entre Studio y Museo?', a: 'La Serie Studio usa una impresora de 4 tintas pigmentadas, perfecta para decoracion. La Serie Museo usa una impresora de 12 tintas pigmentadas para calidad galeria, ideal para coleccionistas.' },
      { q: 'Puedo recoger en persona?', a: 'Si! Recogida gratuita en Mile-End (7049 rue Saint-Urbain, Montreal). Envio local tambien disponible.' },
      { q: 'Las impresiones estan firmadas?', a: 'Las impresiones son realizadas profesionalmente por Massive en colaboracion con el artista. Contactanos para ediciones firmadas o numeradas.' },
      { q: 'Ofrecen enmarcado?', a: 'Si, marco negro o blanco disponible. Agrega la opcion de marco directamente en el configurador.' },
    ],
  });

  return (
    <>
      <SEO
        title={`${artist.name} - ${tagline} | Massive`}
        description={bio.slice(0, 160)}
        ogImage={`/images/og/og-${artist.slug}.jpg`}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }), url: '/artistes' },
          { name: artist.name },
        ]}
        jsonLd={[getArtistSchema({
          name: artist.name,
          slug: artist.slug,
          description: bio.slice(0, 300),
          image: `/images/og/og-${artist.slug}.jpg`,
          prints: (artist.prints || []).map(p => ({
            title: getItemTitle(p),
            fullImage: p.fullImage || p.image,
            unique: p.unique,
            price: p.price,
          })),
        })]}
      />

      {/* ============ HERO ============ */}
      <section className="relative py-[2.08rem] md:py-[2.6rem] overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>

        <div className="relative z-10 section-container !py-0">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl lg:flex-1"
            >
              <div className="flex items-center gap-2 mb-6 text-sm">
                <Link to="/" className="text-grey-muted hover:text-accent transition-colors">{tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' })}</Link>
                <span className="text-grey-muted">/</span>
                <Link to="/artistes" className="text-grey-muted hover:text-accent transition-colors">{tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' })}</Link>
                <span className="text-grey-muted">/</span>
                <span className="text-accent">{artist.name}</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                {artist.avatar ? (
                  <img loading="lazy"
                    src={artist.avatar}
                    alt={artist.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-accent/40"
                  />
                ) : (
                  <div className="p-4 rounded-xl icon-bg-blur">
                    <Image size={36} className="text-accent" />
                  </div>
                )}
                <div>
                  <h1 className="text-4xl md:text-6xl font-heading font-bold text-heading">
                    {artist.name}
                  </h1>
                </div>
              </div>

              <p className="text-xl md:text-2xl text-grey-light mb-4">
                {tagline}
              </p>
              <p className="text-sm text-grey-muted mb-8">
                {tx({
                  fr: `${artist.prints.length} oeuvres disponibles · Tirages à partir de ${minPrice}$`,
                  en: `${artist.prints.length} artworks available · Prints starting at $${minPrice}`,
                  es: `${artist.prints.length} obras disponibles · Impresiones desde ${minPrice}$`,
                })}
              </p>

            </motion.div>

            {artist.heroImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block lg:flex-1 max-w-md"
              >
                <div className="relative overflow-hidden rounded-2xl">
                <img loading="lazy"
                  src={artist.heroImage}
                  alt={artist.name}
                  className="w-full h-auto max-h-[400px] object-contain drop-shadow-2xl"
                />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto !pt-0">

        {/* ============ OEUVRES + BIO cote a cote en desktop ============ */}
        <motion.div
          id="oeuvres"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20 scroll-mt-24"
        >
          <div className="flex items-center gap-4 mb-3">
            <h2 id="section-prints" className="text-3xl font-heading font-bold text-gradient scroll-mt-24">
              {tx({ fr: 'Oeuvres disponibles', en: 'Available Artworks', es: 'Obras disponibles' })}
            </h2>
            {/* Mini nav pour scroller entre sections */}
            {(artist.stickers?.length > 0 || artist.merch?.length > 0) && (
              <div className="flex gap-1.5">
                <button onClick={() => document.getElementById('section-prints')?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-1 rounded-full text-[11px] font-semibold bg-accent/15 text-accent hover:bg-accent/25 transition-colors">
                  Prints ({artist.prints?.length || 0})
                </button>
                {artist.stickers?.length > 0 && (
                  <button onClick={() => document.getElementById('section-stickers')?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 text-grey-light hover:bg-white/10 transition-colors">
                    Stickers ({artist.stickers.length})
                  </button>
                )}
                {artist.merch?.length > 0 && (
                  <button onClick={() => document.getElementById('section-merch')?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 text-grey-light hover:bg-white/10 transition-colors">
                    Merch ({artist.merch.length})
                  </button>
                )}
              </div>
            )}
          </div>
          </h2>
          <p className="text-grey-muted text-center mb-10 max-w-2xl mx-auto">
            {tx({
              fr: 'Cliquez sur une oeuvre pour configurer votre tirage.',
              en: 'Click an artwork to configure your print.',
              es: 'Haz clic en una obra para configurar tu impresion.',
            })}
          </p>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Bio artiste - prend 1/3 en desktop, sticky */}
            <div className="lg:w-1/3 lg:sticky lg:top-24 self-start order-2 lg:order-1">
              <div className="p-6 rounded-2xl transition-colors duration-300 highlight-shadow">
                <h3 className="text-xl font-heading font-bold text-gradient mb-4">
                  {tx({ fr: 'L\'artiste', en: 'The Artist', es: 'El artista' })}
                </h3>
                <p className="text-grey-light text-sm leading-relaxed whitespace-pre-line mb-4">{bio}</p>
                {(artistSocials && Object.values(artistSocials).some(v => v)) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {artistSocials.instagram && (
                      <a href={artistSocials.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline !py-1.5 !px-3 text-xs">
                        Instagram <ExternalLink size={12} className="ml-1" />
                      </a>
                    )}
                    {artistSocials.youtube && (
                      <a href={artistSocials.youtube} target="_blank" rel="noopener noreferrer" className="btn-outline !py-1.5 !px-3 text-xs">
                        YouTube <ExternalLink size={12} className="ml-1" />
                      </a>
                    )}
                    {artistSocials.tiktok && (
                      <a href={artistSocials.tiktok} target="_blank" rel="noopener noreferrer" className="btn-outline !py-1.5 !px-3 text-xs">
                        TikTok <ExternalLink size={12} className="ml-1" />
                      </a>
                    )}
                    {artistSocials.facebook && (
                      <a href={artistSocials.facebook} target="_blank" rel="noopener noreferrer" className="btn-outline !py-1.5 !px-3 text-xs">
                        Facebook <ExternalLink size={12} className="ml-1" />
                      </a>
                    )}
                    {artistSocials.gallea && (
                      <a href={artistSocials.gallea} target="_blank" rel="noopener noreferrer" className="btn-outline !py-1.5 !px-3 text-xs">
                        Gallea <ExternalLink size={12} className="ml-1" />
                      </a>
                    )}
                    {artistSocials.etsy && (
                      <a href={artistSocials.etsy} target="_blank" rel="noopener noreferrer" className="btn-outline !py-1.5 !px-3 text-xs">
                        Etsy <ExternalLink size={12} className="ml-1" />
                      </a>
                    )}
                    {artistSocials.website && (
                      <a href={artistSocials.website} target="_blank" rel="noopener noreferrer" className="btn-outline !py-1.5 !px-3 text-xs">
                        {tx({ fr: 'Site web', en: 'Website', es: 'Sitio web' })} <ExternalLink size={12} className="ml-1" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Ce qui est inclus */}
              <div className="mt-6 p-6 rounded-2xl transition-colors duration-300 highlight-shadow">
                <h3 className="text-lg font-heading font-bold text-heading mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-accent" />
                  {tx({ fr: 'Ce qui est inclus', en: 'What\'s included', es: 'Que esta incluido' })}
                </h3>
                <ul className="space-y-3">
                  {highlights.map((highlight, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.08 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                      <span className="text-grey-light text-sm">{highlight}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Oeuvres - prend 2/3 en desktop, a droite */}
            <div className="lg:w-2/3 order-1 lg:order-2">
              <div className="flex flex-wrap gap-4">
                {artist.prints.map((print, index) => (
                  <motion.div
                    key={print.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]"
                  >
                    <ArtistPrintCard
                      print={print}
                      minPrice={minPrice}
                      pricing={artist.pricing}
                      selected={selectedPrint?.id === print.id}
                      onClick={() => handleSelectPrint(print)}
                      onZoom={() => {
                        setLightbox(index);
                        setSelectedPrint(print);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============ STICKERS ============ */}
        {artist.stickers && artist.stickers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20 scroll-mt-24"
          >
            <h2 id="section-stickers" className="text-3xl font-heading font-bold text-gradient mb-3 text-center scroll-mt-24">
              {tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })}
            </h2>
            <p className="text-grey-muted text-center mb-10 max-w-2xl mx-auto">
              {tx({
                fr: 'Designs originaux disponibles en stickers vinyl.',
                en: 'Original designs available as vinyl stickers.',
                es: 'Disenos originales disponibles en stickers vinyl.',
              })}
            </p>
            <p className="text-grey-muted text-center mb-10 text-sm">
              {tx({
                fr: 'Cliquez sur un sticker pour configurer votre commande.',
                en: 'Click a sticker to configure your order.',
                es: 'Haz clic en un sticker para configurar tu pedido.',
              })}
            </p>
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {artist.stickers.map((sticker, index) => (
                <motion.div
                  key={sticker.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]"
                >
                  <div
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      selectedSticker?.id === sticker.id
                        ? 'border border-accent shadow-lg shadow-accent/20'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => handleSelectSticker(sticker)}
                  >
                    <div className="aspect-square p-4">
                      <img loading="lazy"
                        src={sticker.image}
                        alt={getItemTitle(sticker)}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 sticker-diecut"
                      />
                    </div>
                    <div className="p-3 text-center">
                      <h3 className="text-sm font-heading font-bold text-heading truncate">
                        {getItemTitle(sticker)}
                      </h3>
                      <p className="text-accent text-xs font-semibold mt-1">
                        {tx({ fr: 'Des 30$ / 25x', en: 'From $30 / 25x', es: 'Desde 30$ / 25x' })}
                      </p>
                    </div>
                    {/* Zoom button */}
                    <button
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70 z-10"
                      onClick={(e) => { e.stopPropagation(); setLightbox({ type: 'sticker', index }); }}
                      aria-label="Zoom"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ CONFIGURATEUR STICKERS ============ */}
        {selectedSticker && (
          <motion.div
            ref={stickerConfiguratorRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-20 scroll-mt-24"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
              {tx({ fr: 'Configurez votre sticker', en: 'Configure Your Sticker', es: 'Configura tu sticker' })}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 max-w-5xl mx-auto">
              {/* Preview */}
              <div
                className="relative rounded-2xl overflow-hidden aspect-square cursor-pointer group flex items-center justify-center p-6"
                onClick={() => setLightbox({ type: 'sticker', index: artist.stickers.findIndex(s => s.id === selectedSticker.id) })}
              >
                <img loading="lazy"
                  src={selectedSticker.image}
                  alt={tx({ fr: selectedSticker.titleFr, en: selectedSticker.titleEn, es: selectedSticker.titleEs || selectedSticker.titleEn })}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 sticker-diecut"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn size={32} className="text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                </div>
              </div>

              {/* Options */}
              <div className="p-4 sm:p-6 rounded-2xl transition-colors duration-300 highlight-shadow lg:sticky lg:top-24 self-start">
                <ConfiguratorArtistSticker
                  artist={artist}
                  selectedSticker={selectedSticker}
                  allStickers={artist.stickers || []}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ CONFIGURATEUR ============ */}
        {selectedPrint && (
          <motion.div
            ref={configuratorRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-20 scroll-mt-24"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
              {tx({ fr: 'Configurez votre tirage', en: 'Configure Your Print', es: 'Configura tu impresion' })}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 max-w-5xl mx-auto items-start">
              {/* Preview avec fleches navigation */}
              <div className="relative flex items-center lg:sticky lg:top-24">
                {/* Fleche gauche */}
                {artist.prints.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigatePrint(-1); }}
                    className="absolute -left-2 lg:-left-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div
                  className="relative overflow-hidden cursor-pointer group w-full flex items-center justify-center"
                  style={{ minHeight: '400px' }}
                  onClick={() => setLightbox(artist.prints.findIndex(p => p.id === selectedPrint.id))}
                >
                  <img loading="lazy"
                    src={selectedPrint.fullImage || toFull(selectedPrint.image)}
                    alt={getItemTitle(selectedPrint)}
                    className="max-w-full max-h-[70vh] object-contain"
                    onLoad={(e) => setIsLandscape(e.target.naturalWidth > e.target.naturalHeight)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <ZoomIn size={32} className="text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                  </div>
                  {/* Indicateur position */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                    {artist.prints.findIndex(p => p.id === selectedPrint.id) + 1} / {artist.prints.length}
                  </div>
                </div>
                {/* Fleche droite */}
                {artist.prints.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigatePrint(1); }}
                    className="absolute -right-2 lg:-right-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                    aria-label="Next"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>

              {/* Options */}
              <div className="p-4 sm:p-6 rounded-2xl transition-colors duration-300 highlight-shadow lg:sticky lg:top-24 self-start">
                <ConfiguratorArtistPrint
                  artist={artist}
                  selectedPrint={selectedPrint}
                  savedConfigs={printConfigsRef.current}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ DEMARCHE ARTISTIQUE ============ */}
        {artist.demarche && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-10 text-center">
              {tx({ fr: 'Demarche artistique', en: 'Artistic Approach', es: 'Enfoque artistico' })}
            </h2>
            <div className="max-w-3xl mx-auto space-y-8">
              {(artist.demarche[lang] || artist.demarche.en || artist.demarche.fr).map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  viewport={{ once: true }}
                >
                  {section.title && (
                    <h3 className="text-xl font-heading font-bold text-heading mb-3">{section.title}</h3>
                  )}
                  <p className="text-grey-light leading-relaxed">{section.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ PROCESSUS ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-10 text-center">
            {tx({ fr: 'Comment ca marche', en: 'How It Works', es: 'Como funciona' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {processSteps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl relative transition-colors duration-300 glass-shadow"
              >
                <div className="absolute -top-3 -left-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: theme === 'light' ? '#1A1A1A' : `linear-gradient(135deg, var(--logo-main, #8100D1), var(--accent-color, #FF52A0))` }}>
                  {item.step}
                </div>
                <h3 className="text-heading font-heading font-bold text-lg mt-2 mb-2">
                  {item.title}
                </h3>
                <p className="text-grey-muted text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>


        {/* ============ EQUIPEMENT ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
            {tx({ fr: 'Notre équipement', en: 'Our Equipment', es: 'Nuestro equipo' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {equipmentItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl text-center transition-colors duration-300 glass-shadow"
              >
                <h4 className="text-heading font-heading font-bold mb-2">{item.name}</h4>
                <p className="text-grey-muted text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ============ FAQ ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
            {tx({ fr: 'Questions fréquentes', en: 'Frequently Asked Questions', es: 'Preguntas frecuentes' })}
          </h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="rounded-xl border border-purple-main/30 overflow-hidden transition-colors duration-300"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors duration-200 hover:bg-glass-alt"
                >
                  <span className="text-heading font-semibold pr-4">{item.q}</span>
                  <ChevronDown
                    size={20}
                    className={`text-accent flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-grey-light leading-relaxed border-t border-purple-main/20 pt-4">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ============ CTA ============ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20 p-12 rounded-2xl text-center transition-colors duration-300 cta-shadow"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
            {tx({ fr: 'Tu es artiste? Rejoins la plateforme.', en: 'Are you an artist? Join the platform.', es: 'Eres artista? Unete a la plataforma.' })}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {tx({
              fr: 'On s\'occupe de tout : site web dédié, impression pro, packaging et shipping. Tu fournis tes fichiers, tu fixes ta marge, et tu reçois ton argent.',
              en: 'We handle everything: dedicated website, professional printing, packaging and shipping. You provide your files, set your margin, and get paid.',
              es: 'Nos encargamos de todo: sitio web dedicado, impresion profesional, empaque y envio. Tu proporcionas tus archivos, fijas tu margen y recibes tu dinero.',
            })}
          </p>
          <Link to="/contact" className="btn-primary">
            <MessageSquare size={20} className="mr-2" />
            {tx({ fr: 'Contactez-nous', en: 'Contact us', es: 'Contactanos' })}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>
      </div>

      {/* ============ LIGHTBOX ============ */}
      <AnimatePresence>
        {lightbox !== null && (() => {
          const isSticker = typeof lightbox === 'object' && lightbox.type === 'sticker';
          const items = isSticker ? (artist.stickers || []) : artist.prints;
          const idx = isSticker ? lightbox.index : lightbox;
          const item = items[idx];
          if (!item) return null;
          const goLB = (dir) => (e) => {
            e.stopPropagation();
            const next = (idx + dir + items.length) % items.length;
            setLightbox(isSticker ? { type: 'sticker', index: next } : next);
            if (!isSticker) {
              setSelectedPrint(items[next]);
            }
          };
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightbox(null)}
            >
              {/* Close */}
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
              >
                <X size={24} />
              </button>

              {/* Fleche gauche */}
              {items.length > 1 && (
                <button
                  onClick={goLB(-1)}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white w-12 h-12 flex items-center justify-center z-10"
                  aria-label={tx({ fr: 'Image precedente', en: 'Previous image', es: 'Imagen anterior' })}
                >
                  <ChevronLeft size={32} />
                </button>
              )}

              {/* Fleche droite */}
              {items.length > 1 && (
                <button
                  onClick={goLB(1)}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white w-12 h-12 flex items-center justify-center z-10"
                  aria-label={tx({ fr: 'Image suivante', en: 'Next image', es: 'Siguiente imagen' })}
                >
                  <ChevronRight size={32} />
                </button>
              )}

              <motion.div
                key={isSticker ? `stk-${idx}` : idx}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative watermark-light rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <img loading="lazy"
                  src={item.fullImage || toFull(item.image)}
                  alt={tx({ fr: item.titleFr, en: item.titleEn, es: item.titleEs || item.titleEn })}
                  className={`max-w-full max-h-[85vh] object-contain${isSticker ? ' sticker-diecut' : ''}`}
                />
              </motion.div>

              {/* Compteur */}
              {items.length > 1 && (
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                  {idx + 1} / {items.length}
                </span>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}

export default ArtisteDetail;
