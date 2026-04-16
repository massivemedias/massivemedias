import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShoppingCart, Check, X, User, Palette, Image, Sticker, Gift, Tag, Percent, Handshake } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/useProducts';
import artistsData from '../data/artists';
import { useArtists } from '../hooks/useArtists';
import { img } from '../utils/paths';

// Maudite Machine (Massive) en premier
const artistOrder = ['cornelia-rose', 'psyqu33n', 'no-pixl', 'maudite-machine', 'adrift', 'quentin-delobel', 'mok'];

// Fallback - Stickers produits finis
const defaultStickerProducts = [
  { id: 'stk-massive', fr: 'Massive', en: 'Massive', es: 'Massive', image: img('/images/stickers/Stickers-massive.webp') },
  { id: 'stk-maudite', fr: 'Maudite Machine', en: 'Maudite Machine', es: 'Maudite Machine', image: img('/images/stickers/Stickers-Maudite-Machine.webp'), artistSlug: 'maudite-machine' },
  { id: 'stk-psyqu33n', fr: 'Psyqu33n', en: 'Psyqu33n', es: 'Psyqu33n', image: img('/images/stickers/Stickers-Psyqu33n2.webp'), artistSlug: 'psyqu33n' },
  { id: 'stk-vrstl', fr: 'Vrstl', en: 'Vrstl', es: 'Vrstl', image: img('/images/stickers/Stickers-Vrstl.webp') },
  { id: 'stk-fusion', fr: 'Fusion State Rec', en: 'Fusion State Rec', es: 'Fusion State Rec', image: img('/images/stickers/Stickers-Fusion-State-Rec.webp') },
];

const defaultStickerPricingTiers = [
  { qty: 1, label: '1 pack', price: 35 },
  { qty: 5, label: '5 packs', price: 25 },
  { qty: 10, label: '10 packs', price: 20 },
  { qty: 25, label: '25+ packs', price: 15 },
];

// Soldes - produits en promotion
const defaultSaleItems = [
  {
    id: 'sale-stk-massive', nameFr: 'Pack Stickers Massive', nameEn: 'Massive Sticker Pack', nameEs: 'Pack Stickers Massive',
    image: img('/images/stickers/Stickers-massive.webp'), originalPrice: 35, salePrice: 20,
    descFr: 'Pack de stickers vinyle die-cut Massive Medias', descEn: 'Massive Medias die-cut vinyl sticker pack', descEs: 'Pack de stickers vinilo troquelados Massive Medias',
    link: null, type: 'sticker',
  },
];

// Cartes cadeaux
const giftCardAmounts = [25, 50, 100, 150];

// Categories sidebar
const sidebarCategories = [
  { id: 'soldes', icon: Percent, fr: 'Soldes', en: 'Sales', es: 'Ofertas' },
  { id: 'artistes', icon: Palette, fr: 'Artistes', en: 'Artists', es: 'Artistas' },
  { id: 'prints', icon: Image, fr: 'Prints', en: 'Prints', es: 'Impresiones' },
  { id: 'stickers', icon: Sticker, fr: 'Stickers', en: 'Stickers', es: 'Stickers' },
  { id: 'cartes-cadeaux', icon: Gift, fr: 'Cartes cadeaux', en: 'Gift cards', es: 'Tarjetas regalo' },
  { id: 'devenir-artiste', icon: Handshake, fr: 'Devenir artiste', en: 'Become an artist', es: 'Ser artista' },
];

function Shop() {
  const { tx } = useLang();
  const { addToCart } = useCart();
  const { products: cmsProducts } = useProducts();
  const { artists: cmsArtists } = useArtists();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [view, setView] = useState('main'); // 'main' | 'prints'

  // Refs pour scroll-to-section
  const sectionRefs = {
    soldes: useRef(null),
    artistes: useRef(null),
    prints: useRef(null),
    stickers: useRef(null),
    'cartes-cadeaux': useRef(null),
    'devenir-artiste': useRef(null),
  };
  const mobileTabsRef = useRef(null);
  const tabRefs = useRef({});

  // Gift card state
  const [selectedGiftAmount, setSelectedGiftAmount] = useState(50);
  const [customGiftAmount, setCustomGiftAmount] = useState('');
  const [giftCardAdded, setGiftCardAdded] = useState(false);
  const [saleAdded, setSaleAdded] = useState(null); // id of last added sale item

  // Reset view when navigating to /boutique
  useEffect(() => {
    setView('main');
    setActiveCategory(null);
  }, [location.key]);

  // Intersection observer pour highlight sidebar
  useEffect(() => {
    if (view !== 'main') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.dataset.section);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [view]);

  // Auto-scroll la barre de tabs mobile vers l'onglet actif
  useEffect(() => {
    if (!activeCategory || !mobileTabsRef.current || !tabRefs.current[activeCategory]) return;
    const container = mobileTabsRef.current;
    const tab = tabRefs.current[activeCategory];
    const tabLeft = tab.offsetLeft;
    const tabWidth = tab.offsetWidth;
    const containerWidth = container.offsetWidth;
    container.scrollTo({
      left: tabLeft - containerWidth / 2 + tabWidth / 2,
      behavior: 'smooth',
    });
  }, [activeCategory]);

  const scrollToSection = (id) => {
    sectionRefs[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [selectedSticker, setSelectedSticker] = useState(null);
  const [stickerTier, setStickerTier] = useState(0);
  const [stickerAdded, setStickerAdded] = useState(false);
  const stickerDetailRef = useRef(null);

  // CMS-first : packs de stickers
  const stickerProducts = useMemo(() => {
    const cmsStickerPacks = cmsProducts?.filter(p => p.category === 'sticker-pack');
    if (cmsStickerPacks && cmsStickerPacks.length > 0) {
      return cmsStickerPacks.map(p => ({
        id: p.slug,
        fr: p.nameFr,
        en: p.nameEn,
        image: p.imageUrl || '',
        tiers: p.pricingData?.tiers || defaultStickerPricingTiers,
      }));
    }
    return defaultStickerProducts.map(s => ({ ...s, tiers: defaultStickerPricingTiers }));
  }, [cmsProducts]);

  const orderedArtists = artistOrder
    .map(slug => {
      const local = artistsData[slug];
      if (!local) return null;
      const cmsArr = !cmsArtists ? [] : Array.isArray(cmsArtists) ? cmsArtists : Object.values(cmsArtists);
      const cms = cmsArr.find(a => a.slug === slug);
      return {
        ...local,
        slug,
        avatar: cms?.socials?.avatarUrl || local.avatar,
      };
    })
    .filter(a => a && a.name);

  // Stickers individuels des artistes
  const allStickers = useMemo(() => {
    const artistStickers = orderedArtists.flatMap(a =>
      (a.stickers || []).map(s => ({
        id: s.id,
        fr: s.titleFr,
        en: s.titleEn,
        es: s.titleEs || s.titleEn,
        image: s.image,
        artistSlug: a.slug,
        tiers: defaultStickerPricingTiers,
      }))
    );
    const packImages = new Set(stickerProducts.map(s => s.image));
    return [...stickerProducts, ...artistStickers.filter(s => !packImages.has(s.image))];
  }, [stickerProducts, orderedArtists]);

  // Quelques prints featured pour la vue principale
  const featuredPrints = orderedArtists
    .flatMap(a => (a.prints || []).slice(0, 5).map(p => ({ ...p, artist: a })))
    .slice(0, 12);

  // ── Vue Prints complete ──
  if (view === 'prints') {
    return (
      <>
        <SEO
          title={tx({
            fr: 'Fine Art Prints Montréal - Tirages Qualité Galerie | Massive',
            en: 'Fine Art Prints Montreal - Gallery Quality Prints | Massive',
            es: 'Fine Art Prints Montreal - Impresiones Calidad Galeria | Massive',
          })}
          description={tx({
            fr: 'Achetez des tirages fine art par des artistes de Montréal. Impression 12 encres pigmentées sur papier Hahnemühle. Qualité musée, livraison locale.',
            en: 'Buy fine art prints from Montreal artists. 12 pigmented ink printing on Hahnemuhle paper. Museum quality, local delivery.',
            es: 'Compra impresiones fine art de artistas de Montreal. Impresion 12 tintas pigmentadas en papel Hahnemuhle. Calidad museo, entrega local.',
          })}
          breadcrumbs={[
            { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
            { name: tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' }), url: '/boutique' },
            { name: 'Prints' },
          ]}
        />
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 hero-aurora"></div>
          <div className="relative z-10 section-container !py-0 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-4">Prints</h1>
              <p className="text-xl text-grey-light max-w-3xl mx-auto">
                {tx({
                  fr: 'Tirages fine art par nos artistes. Cliquez sur une oeuvre pour configurer votre tirage.',
                  en: 'Fine art prints by our artists. Click an artwork to configure your print.',
                  es: 'Impresiones fine art de nuestros artistas. Haz clic en una obra para configurar tu impresion.',
                })}
              </p>
            </motion.div>
          </div>
        </section>
        <div className="section-container max-w-7xl mx-auto">
          <button
            onClick={() => setView('main')}
            className="inline-flex items-center gap-2 text-grey-muted hover:text-accent transition-colors mb-10 text-sm"
          >
            <ArrowLeft size={16} />
            {tx({ fr: 'Retour à la boutique', en: 'Back to shop', es: 'Volver a la tienda' })}
          </button>
          {orderedArtists.map((artist, ai) => {
            const hasPrints = artist.prints && artist.prints.length > 0;
            const studioVals = hasPrints && artist.pricing?.studio ? Object.values(artist.pricing.studio).filter(v => v != null) : [];
            const minPrice = studioVals.length > 0 ? Math.min(...studioVals) : null;
            return (
              <motion.div
                key={artist.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: ai * 0.1 }}
                viewport={{ once: true }}
                className="mb-16"
              >
                <Link to={`/artistes/${artist.slug}`} className="group flex items-center gap-4 mb-6 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-2 ring-purple-main/20 group-hover:ring-accent/60 transition-all flex-shrink-0">
                    <img src={artist.avatar || artist.heroImage} alt={artist.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-heading font-bold text-heading group-hover:text-accent transition-colors">{artist.name}</h2>
                    <p className="text-grey-muted text-xs">
                      {hasPrints
                        ? `${artist.prints.length} ${tx({ fr: 'oeuvres', en: 'artworks', es: 'obras' })}${minPrice ? tx({ fr: ` - à partir de ${minPrice}$`, en: ` - from $${minPrice}`, es: ` - desde ${minPrice}$` }) : ''}`
                        : tx({ fr: 'Bientôt disponible', en: 'Coming soon', es: 'Disponible pronto' })}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-grey-muted group-hover:text-accent ml-auto flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-all" />
                </Link>
                {hasPrints ? (
                  <div className="flex flex-wrap gap-4">
                    {artist.prints.map((print, pi) => (
                      <motion.div
                        key={print.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: pi * 0.03 }}
                        viewport={{ once: true }}
                        className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(20%-0.8rem)]"
                      >
                        <Link to={`/artistes/${artist.slug}?print=${print.id}`} className="group block rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300">
                          <div className="aspect-[2/3] overflow-hidden">
                            <img src={print.image} alt={tx({ fr: print.titleFr, en: print.titleEn, es: print.titleEs || print.titleEn })} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-heading font-bold text-heading truncate">{tx({ fr: print.titleFr, en: print.titleEn, es: print.titleEs || print.titleEn })}</h3>
                            <p className="text-accent text-xs font-semibold mt-1">
                              {tx({ fr: `A partir de ${minPrice}$`, en: `From $${minPrice}`, es: `Desde ${minPrice}$` })}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-purple-main/20 p-8 text-center">
                    <p className="text-grey-muted text-sm">
                      {tx({ fr: 'Prints bientot disponibles. Restez a l\'affut!', en: 'Prints coming soon. Stay tuned!', es: 'Impresiones disponibles pronto. Mantente atento!' })}
                    </p>
                  </div>
                )}
                {ai < orderedArtists.length - 1 && <div className="border-t border-grey-muted/10 mt-12" />}
              </motion.div>
            );
          })}
        </div>
      </>
    );
  }

  // ── Vue principale - Boutique ──
  return (
    <>
      <SEO
        title={tx({
          fr: 'Boutique Massive Montréal - Prints, Stickers & Design | Massive',
          en: 'Massive Shop Montreal - Prints, Stickers & Design | Massive',
          es: 'Tienda Massive Montreal - Prints, Stickers & Diseno | Massive',
        })}
        description={tx({
          fr: 'Boutique en ligne Massive à Montréal. Tirages fine art, stickers die-cut, design graphique et développement web. Production locale Mile-End, livraison rapide.',
          en: 'Massive online shop in Montreal. Fine art prints, die-cut stickers, graphic design and web development. Local production Mile-End, fast delivery.',
          es: 'Tienda en linea Massive en Montreal. Impresiones fine art, stickers die-cut, diseno grafico y desarrollo web. Produccion local Mile-End, entrega rapida.',
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' }) },
        ]}
      />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
              {tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' })}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-3xl mx-auto">
              {tx({
                fr: 'Prints d\'artistes, stickers et services créatifs. Fabriqué à Montréal.',
                en: 'Artist prints, stickers and creative services. Made in Montreal.',
                es: 'Impresiones de artistas, stickers y servicios creativos. Hecho en Montreal.',
              })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mobile category tabs - horizontal scroll pills */}
      <div className="md:hidden sticky top-20 z-40 bg-bg-primary/95 backdrop-blur-xl border-b card-border">
        <div ref={mobileTabsRef} className="flex overflow-x-auto scrollbar-hide px-3 py-2.5 gap-2">
          {sidebarCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                ref={el => tabRefs.current[cat.id] = el}
                onClick={() => scrollToSection(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? cat.id === 'soldes'
                      ? 'bg-red-500 text-white'
                      : 'bg-accent text-white'
                    : 'bg-glass text-grey-light'
                }`}
              >
                <Icon size={13} />
                {tx(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout: sidebar + content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 overflow-x-clip">
        <div className="flex gap-8">

          {/* Desktop sidebar */}
          <aside className="hidden md:block w-48 flex-shrink-0">
            <nav className="sticky top-28 space-y-1">
              <p className="text-[10px] font-bold text-grey-muted uppercase tracking-widest mb-3 px-3">
                {tx({ fr: 'Categories', en: 'Categories', es: 'Categorias' })}
              </p>
              {sidebarCategories.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToSection(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeCategory === cat.id
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-grey-light hover:text-heading hover:bg-glass border border-transparent'
                    }`}
                  >
                    <Icon size={16} className={activeCategory === cat.id ? 'text-accent' : 'text-grey-muted'} />
                    {tx(cat)}
                  </button>
                );
              })}

              {/* Mini CTA dans la sidebar */}
              <div className="mt-6 pt-6 border-t border-[var(--bg-card-border)]">
                <div className="rounded-xl bg-glass p-4">
                  <p className="text-xs text-grey-muted mb-2">
                    {tx({ fr: 'Projet sur mesure?', en: 'Custom project?', es: 'Proyecto a medida?' })}
                  </p>
                  <Link to="/contact" className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold hover:gap-2.5 transition-all">
                    {tx({ fr: 'Contacte-nous', en: 'Contact us', es: 'Contactanos' })}
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* ═══════════════════ ARTISTES ═══════════════════ */}
            <section ref={sectionRefs.artistes} data-section="artistes" className="mb-16 scroll-mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-8">
                  {tx({ fr: 'Massive Artistes', en: 'Massive Artists', es: 'Massive Artistas' })}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {orderedArtists.map((artist, i) => {
                    const printCount = artist.prints?.length || 0;
                    return (
                      <motion.div
                        key={artist.slug}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                        viewport={{ once: true }}
                      >
                        <Link
                          to={`/artistes/${artist.slug}`}
                          className="group block rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300"
                        >
                          <div className="aspect-[3/4] overflow-hidden relative">
                            <img
                              src={artist.heroImage || artist.avatar}
                              alt={artist.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <img
                                src={artist.avatar}
                                alt={`${artist.name} - Artiste Massive`}
                                className="w-12 h-12 rounded-full ring-2 ring-white/20 object-cover mb-2"
                              />
                              <h3 className="text-lg font-heading font-bold text-white group-hover:text-accent transition-colors leading-tight">
                                {artist.name}
                              </h3>
                              <p className="text-white/60 text-[11px] mt-0.5 leading-snug">
                                {tx({ fr: artist.tagline?.fr || '', en: artist.tagline?.en || '', es: artist.tagline?.es || artist.tagline?.en || '' })}
                              </p>
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                                <span className="text-white/50 text-[10px]">
                                  {printCount > 0
                                    ? `${printCount} ${tx({ fr: 'oeuvres', en: 'artworks', es: 'obras' })}`
                                    : tx({ fr: 'Bientot', en: 'Soon', es: 'Pronto' })}
                                </span>
                                <ArrowRight size={12} className="text-accent md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </section>

            {/* ═══════════════════ PRINTS ═══════════════════ */}
            <section ref={sectionRefs.prints} data-section="prints" className="mb-16 scroll-mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                    Prints
                  </h2>
                  <button
                    onClick={() => { setView('prints'); window.scrollTo(0, 0); }}
                    className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold hover:gap-2.5 transition-all"
                  >
                    {tx({ fr: 'Voir tout', en: 'View all', es: 'Ver todo' })}
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Grille responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {featuredPrints.map((print, i) => {
                    const studioVals = print.artist?.pricing?.studio ? Object.values(print.artist.pricing.studio).filter(v => v != null) : [];
                    const minPrice = studioVals.length > 0 ? Math.min(...studioVals) : 0;
                    return (
                      <motion.div
                        key={print.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.04 }}
                        viewport={{ once: true }}
                      >
                        <Link
                          to={`/artistes/${print.artist.slug}?print=${print.id}`}
                          className="group block rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300"
                        >
                          <div className="aspect-[2/3] overflow-hidden">
                            <img
                              src={print.image}
                              alt={tx({ fr: print.titleFr, en: print.titleEn, es: print.titleEs || print.titleEn })}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-0.5">{print.artist.name}</p>
                            <h3 className="text-xs font-heading font-bold text-heading truncate">
                              {tx({ fr: print.titleFr, en: print.titleEn, es: print.titleEs || print.titleEn })}
                            </h3>
                            <p className="text-accent text-xs font-semibold mt-1">
                              {tx({ fr: `Des ${minPrice}$`, en: `From $${minPrice}`, es: `Desde ${minPrice}$` })}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Voir tout en bas */}
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => { setView('prints'); window.scrollTo(0, 0); }}
                    className="btn-outline !py-2 !px-6 text-sm inline-flex items-center gap-2"
                  >
                    {tx({ fr: 'Voir toutes les oeuvres', en: 'View all artworks', es: 'Ver todas las obras' })}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            </section>

            {/* ═══════════════════ STICKERS ═══════════════════ */}
            <section ref={sectionRefs.stickers} data-section="stickers" className="mb-16 scroll-mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                    {tx({ fr: 'Packs de stickers', en: 'Sticker packs', es: 'Packs de stickers' })}
                  </h2>
                  <span className="text-grey-muted text-xs">
                    {(() => {
                      const prices = stickerProducts.flatMap(s => (s.tiers || []).map(t => t.price));
                      const min = prices.length > 0 ? Math.min(...prices) : 0;
                      return tx({
                        fr: `Des ${min}$ le pack`,
                        en: `From $${min} per pack`,
                        es: `Desde ${min}$ por pack`,
                      });
                    })()}
                  </span>
                </div>

                {/* Grille responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {allStickers.map((sticker, i) => {
                    const isSelected = selectedSticker === sticker.id;
                    return (
                      <motion.div
                        key={sticker.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.04 }}
                        viewport={{ once: true }}
                      >
                        <button
                          onClick={() => {
                            const newId = isSelected ? null : sticker.id;
                            setSelectedSticker(newId);
                            setStickerTier(0);
                            setStickerAdded(false);
                            if (newId) {
                              setTimeout(() => stickerDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
                            }
                          }}
                          className={`group block w-full text-left rounded-2xl overflow-hidden card-bg-bordered transition-all duration-300 cursor-pointer ${
                            isSelected ? 'ring-2 ring-accent border-accent/50' : 'hover:border-accent/50'
                          }`}
                        >
                          <div className="aspect-square overflow-hidden bg-glass p-4">
                            <img
                              src={sticker.image}
                              alt={tx(sticker)}
                              className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105${sticker.artistSlug ? ' sticker-diecut' : ''}`}
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-heading font-bold text-heading truncate">
                              {tx(sticker)}
                            </h3>
                            <p className="text-grey-muted text-[11px] mt-0.5">
                              {tx({ fr: 'Pack de stickers vinyle', en: 'Vinyl sticker pack', es: 'Pack de stickers de vinilo' })}
                            </p>
                            <p className="text-accent text-xs font-semibold mt-1">
                              {tx({ fr: `Des ${sticker.tiers?.[0]?.price || 35}$ / pack`, en: `From $${sticker.tiers?.[0]?.price || 35} / pack`, es: `Desde ${sticker.tiers?.[0]?.price || 35}$ / pack` })}
                            </p>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Fiche produit sticker */}
                <AnimatePresence>
                  {selectedSticker && (() => {
                    const sticker = allStickers.find(s => s.id === selectedSticker);
                    if (!sticker) return null;
                    const tiers = sticker.tiers || defaultStickerPricingTiers;
                    const tier = tiers[stickerTier] || tiers[0];
                    const total = tier.price * tier.qty;

                    const handleAddToCart = () => {
                      addToCart({
                        productId: `${sticker.id}-x${tier.qty}`,
                        productName: `${tx({ fr: 'Pack de stickers', en: 'Sticker pack', es: 'Pack de stickers' })} ${tx(sticker)} (${tier.label})`,
                        finish: tx(sticker),
                        shape: null,
                        size: tier.label,
                        quantity: 1,
                        unitPrice: total,
                        totalPrice: total,
                        image: sticker.image,
                        notes: '',
                      });
                      setStickerAdded(true);
                      setTimeout(() => setStickerAdded(false), 2000);
                    };

                    const specs = [
                      { fr: 'Vinyle premium', en: 'Premium vinyl', es: 'Vinilo premium' },
                      { fr: 'Decoupe die-cut', en: 'Die-cut', es: 'Troquelado' },
                      { fr: 'Resistant UV et eau', en: 'UV & waterproof', es: 'Resistente UV y agua' },
                      { fr: 'Finition lustrée', en: 'Glossy finish', es: 'Acabado brillante' },
                    ];

                    return (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div ref={stickerDetailRef} className="mt-6 rounded-2xl card-bg-bordered p-6 md:p-8">
                          {/* Header avec fermer */}
                          <div className="flex items-start justify-between mb-6">
                            <h3 className="text-xl md:text-2xl font-heading font-bold text-heading">
                              {tx(sticker)}
                            </h3>
                            <button
                              onClick={() => setSelectedSticker(null)}
                              className="text-grey-muted hover:text-heading transition-colors p-1 -mt-1"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          {/* Layout: image + details */}
                          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            {/* Image grande */}
                            <div className="md:w-2/5 flex-shrink-0">
                              <div className="aspect-square rounded-xl bg-glass p-6 flex items-center justify-center">
                                <img
                                  src={sticker.image}
                                  alt={tx(sticker)}
                                  className={`max-w-full max-h-full object-contain${sticker.artistSlug ? ' sticker-diecut' : ''}`}
                                />
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-grey-light text-sm mb-4">
                                {tx({
                                  fr: 'Pack de stickers vinyle die-cut imprimés en haute qualité à Montréal. Chaque pack contient plusieurs stickers du design sélectionné.',
                                  en: 'Die-cut vinyl sticker pack printed in high quality in Montreal. Each pack contains multiple stickers of the selected design.',
                                  es: 'Pack de stickers de vinilo troquelados impresos en alta calidad en Montreal. Cada pack contiene varios stickers del diseno seleccionado.',
                                })}
                              </p>

                              {/* Specs */}
                              <div className="grid grid-cols-2 gap-2 mb-6">
                                {specs.map((spec, si) => (
                                  <div key={si} className="flex items-center gap-2 text-xs text-grey-light">
                                    <Check size={12} className="text-accent flex-shrink-0" />
                                    {tx(spec)}
                                  </div>
                                ))}
                              </div>

                              {/* Paliers de prix */}
                              <p className="text-xs text-grey-muted uppercase tracking-wider font-semibold mb-2">
                                {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                                {tiers.map((t, ti) => (
                                  <button
                                    key={ti}
                                    onClick={() => { setStickerTier(ti); setStickerAdded(false); }}
                                    className={`p-3 rounded-xl text-center transition-all border-2 ${
                                      stickerTier === ti
                                        ? 'border-accent bg-accent/10'
                                        : 'border-transparent hover:border-grey-muted/20 bg-glass'
                                    }`}
                                  >
                                    <span className="block text-xs text-grey-muted mb-0.5">{t.label}</span>
                                    <span className="block text-lg font-heading font-bold text-heading">{t.price}$</span>
                                    <span className="block text-[10px] text-grey-muted">/ pack</span>
                                  </button>
                                ))}
                              </div>

                              {/* Total + Add to cart */}
                              <div className="flex items-center justify-between gap-4 pt-4 border-t card-border">
                                <div>
                                  <span className="text-grey-muted text-xs">Total</span>
                                  <span className="block text-2xl font-heading font-bold text-heading">{total}$</span>
                                </div>
                                <button
                                  onClick={handleAddToCart}
                                  className={`btn-primary py-3 px-6 ${stickerAdded ? '!bg-green-500 !border-green-500' : ''}`}
                                >
                                  {stickerAdded ? (
                                    <><Check size={16} className="mr-1.5" />{tx({ fr: 'Ajoute au panier!', en: 'Added to cart!', es: 'Agregado!' })}</>
                                  ) : (
                                    <><ShoppingCart size={16} className="mr-1.5" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
                                  )}
                                </button>
                              </div>

                              {/* Lien artiste si applicable */}
                              {sticker.artistSlug && (
                                <Link
                                  to={`/artistes/${sticker.artistSlug}`}
                                  className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
                                >
                                  <User size={14} />
                                  {tx({
                                    fr: `Voir la boutique de ${tx(sticker)}`,
                                    en: `Visit ${tx(sticker)}'s shop`,
                                    es: `Visitar la tienda de ${tx(sticker)}`,
                                  })}
                                  <ArrowRight size={14} />
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Note revenus partages */}
                          {!sticker.artistSlug && (
                            <p className="text-grey-muted text-[11px] mt-5 pt-4 border-t card-border text-center">
                              {tx({
                                fr: 'Une partie des revenus de chaque vente est reversée aux artistes et labels partenaires.',
                                en: 'A portion of the revenue from each sale goes to the partner artists and labels.',
                                es: 'Una parte de los ingresos de cada venta se destina a los artistas y sellos asociados.',
                              })}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </motion.div>
            </section>

            {/* ═══════════════════ SOLDES ═══════════════════ */}
            <section ref={sectionRefs.soldes} data-section="soldes" className="mb-16 scroll-mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading flex items-center gap-3">
                    <Percent size={24} className="text-red-400" />
                    {tx({ fr: 'Soldes', en: 'Sales', es: 'Ofertas' })}
                  </h2>
                  <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                    {tx({ fr: 'Quantites limitees', en: 'Limited quantities', es: 'Cantidades limitadas' })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {defaultSaleItems.map((item, i) => {
                    const discount = Math.round((1 - item.salePrice / item.originalPrice) * 100);
                    const justAdded = saleAdded === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                        viewport={{ once: true }}
                      >
                        <button
                          onClick={() => {
                            addToCart({
                              productId: item.id,
                              productName: tx({ fr: item.nameFr, en: item.nameEn, es: item.nameEs }),
                              finish: 'Solde',
                              shape: null,
                              size: null,
                              quantity: 1,
                              unitPrice: item.salePrice,
                              totalPrice: item.salePrice,
                              image: item.image,
                              notes: '',
                            });
                            setSaleAdded(item.id);
                            setTimeout(() => setSaleAdded(null), 2000);
                          }}
                          className={`group block w-full text-left rounded-2xl overflow-hidden card-bg-bordered transition-all duration-300 relative ${
                            justAdded ? 'ring-2 ring-green-400 border-green-400/50' : 'hover:border-accent/50'
                          }`}
                        >
                          {/* Badge solde */}
                          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                            -{discount}%
                          </div>
                          <div className="aspect-square overflow-hidden bg-glass p-4">
                            <img
                              src={item.image}
                              alt={tx({ fr: item.nameFr, en: item.nameEn, es: item.nameEs })}
                              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-heading font-bold text-heading truncate">
                              {tx({ fr: item.nameFr, en: item.nameEn, es: item.nameEs })}
                            </h3>
                            <p className="text-grey-muted text-[11px] mt-0.5">
                              {tx({ fr: item.descFr, en: item.descEn, es: item.descEs })}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-accent text-base font-heading font-bold">{item.salePrice}$</span>
                              <span className="text-grey-muted text-xs line-through">{item.originalPrice}$</span>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
                              {justAdded ? (
                                <span className="text-green-400 flex items-center gap-1"><Check size={14} />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</span>
                              ) : (
                                <span className="text-accent flex items-center gap-1"><ShoppingCart size={14} />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar' })}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Note sur les revenus partages */}
                <p className="text-grey-muted text-[11px] mt-4 text-center">
                  {tx({
                    fr: 'Une partie des revenus de chaque vente est reversée aux artistes et labels partenaires.',
                    en: 'A portion of the revenue from each sale goes to the partner artists and labels.',
                    es: 'Una parte de los ingresos de cada venta se destina a los artistas y sellos asociados.',
                  })}
                </p>
              </motion.div>
            </section>

            {/* ═══════════════════ CARTES CADEAUX ═══════════════════ */}
            <section ref={sectionRefs['cartes-cadeaux']} data-section="cartes-cadeaux" className="mb-16 scroll-mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-2">
                  {tx({ fr: 'Cartes cadeaux', en: 'Gift cards', es: 'Tarjetas regalo' })}
                </h2>
                <p className="text-grey-muted text-sm mb-8">
                  {tx({
                    fr: 'Offrez de l\'art et de la creativite. Valable sur tous nos produits et services.',
                    en: 'Give the gift of art and creativity. Valid on all our products and services.',
                    es: 'Regala arte y creatividad. Valido en todos nuestros productos y servicios.',
                  })}
                </p>

                <div className="rounded-2xl card-bg-bordered p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Gift size={24} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-bold text-heading">
                        {tx({ fr: 'Carte cadeau Massive Medias', en: 'Massive Medias Gift Card', es: 'Tarjeta regalo Massive Medias' })}
                      </h3>
                      <p className="text-grey-muted text-xs">
                        {tx({ fr: 'Prints, stickers, design, web - tout est possible', en: 'Prints, stickers, design, web - anything goes', es: 'Prints, stickers, diseno, web - todo es posible' })}
                      </p>
                    </div>
                  </div>

                  {/* Montants */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {giftCardAmounts.map(amount => (
                      <button
                        key={amount}
                        onClick={() => { setSelectedGiftAmount(amount); setCustomGiftAmount(''); setGiftCardAdded(false); }}
                        className={`p-4 rounded-xl text-center transition-all border-2 ${
                          selectedGiftAmount === amount && !customGiftAmount
                            ? 'border-accent bg-accent/10'
                            : 'border-transparent hover:border-grey-muted/20 bg-glass'
                        }`}
                      >
                        <span className="block text-2xl font-heading font-bold text-heading">{amount}$</span>
                      </button>
                    ))}
                  </div>

                  {/* Montant personnalise */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-grey-muted text-sm whitespace-nowrap">
                      {tx({ fr: 'Ou montant libre :', en: 'Or custom amount:', es: 'O monto personalizado:' })}
                    </span>
                    <div className="relative flex-1 max-w-[160px]">
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={customGiftAmount}
                        onChange={(e) => { setCustomGiftAmount(e.target.value); setGiftCardAdded(false); }}
                        placeholder="..."
                        className="w-full px-4 py-2.5 rounded-lg bg-transparent border-2 border-grey-muted/20 text-heading text-sm focus:border-accent focus:outline-none transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted text-sm">$</span>
                    </div>
                  </div>

                  {/* Ajouter au panier */}
                  <button
                    onClick={() => {
                      const amount = customGiftAmount ? parseInt(customGiftAmount) : selectedGiftAmount;
                      if (!amount || amount < 10) return;
                      addToCart({
                        productId: `gift-card-${amount}`,
                        productName: tx({ fr: `Carte cadeau ${amount}$`, en: `Gift card $${amount}`, es: `Tarjeta regalo ${amount}$` }),
                        finish: tx({ fr: 'Carte cadeau', en: 'Gift card', es: 'Tarjeta regalo' }),
                        shape: null,
                        size: null,
                        quantity: 1,
                        unitPrice: amount,
                        totalPrice: amount,
                        image: null,
                        notes: 'gift-card',
                      });
                      setGiftCardAdded(true);
                      setTimeout(() => setGiftCardAdded(false), 2500);
                    }}
                    className="btn-primary py-3 px-8 text-base"
                  >
                    {giftCardAdded ? (
                      <><Check size={18} className="mr-2" />{tx({ fr: 'Ajoute au panier!', en: 'Added to cart!', es: 'Agregado al carrito!' })}</>
                    ) : (
                      <><ShoppingCart size={18} className="mr-2" />{tx({
                        fr: `Acheter la carte ${customGiftAmount ? customGiftAmount : selectedGiftAmount}$`,
                        en: `Buy $${customGiftAmount ? customGiftAmount : selectedGiftAmount} gift card`,
                        es: `Comprar tarjeta de ${customGiftAmount ? customGiftAmount : selectedGiftAmount}$`,
                      })}</>
                    )}
                  </button>
                </div>
              </motion.div>
            </section>

            {/* ═══════════════════ DEVENIR ARTISTE ═══════════════════ */}
            <section ref={sectionRefs['devenir-artiste']} data-section="devenir-artiste" className="mb-16 scroll-mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/contact?tab=artiste"
                  className="group block p-8 md:p-10 rounded-2xl card-bg-bordered hover:border-accent/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                      <Handshake size={28} className="text-accent" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading group-hover:text-accent transition-colors">
                        {tx({ fr: 'Devenir artiste partenaire', en: 'Become a partner artist', es: 'Convertirse en artista asociado' })}
                      </h2>
                      <p className="text-grey-light text-sm md:text-base mt-2 max-w-2xl">
                        {tx({
                          fr: 'Rejoins le réseau Massive et vends tes prints en ligne. Zéro frais, zéro gestion - tu fournis ton art, on s\'occupe du reste.',
                          en: 'Join the Massive network and sell your prints online. Zero fees, zero management - you provide your art, we handle the rest.',
                          es: 'Unete a la red Massive y vende tus prints en linea. Cero costos, cero gestion - tu proporcionas tu arte, nosotros nos encargamos del resto.',
                        })}
                      </p>
                    </div>
                    <ArrowRight size={24} className="text-grey-muted group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0 hidden md:block" />
                  </div>
                </Link>
              </motion.div>
            </section>

            {/* ═══════════════════ CTA ═══════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center p-12 rounded-2xl mb-8 cta-text-bordered"
            >
              <h2 className="text-3xl font-heading font-bold text-heading mb-4">
                {tx({ fr: 'Un projet custom en tête?', en: 'Got a custom project in mind?', es: 'Tienes un proyecto personalizado en mente?' })}
              </h2>
              <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
                {tx({
                  fr: 'On imprime tout sur mesure. Contacte-nous pour discuter de ton projet.',
                  en: 'We print everything custom. Contact us to discuss your project.',
                  es: 'Imprimimos todo a medida. Contactanos para discutir tu proyecto.',
                })}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/contact" className="btn-primary">
                  {tx({ fr: 'Nous contacter', en: 'Contact us', es: 'Contactanos' })}
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Shop;
