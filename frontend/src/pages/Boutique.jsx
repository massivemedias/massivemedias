import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Palette, Shirt, ShoppingCart, Check, X } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/useProducts';
import artistsData from '../data/artists';
import { getTshirtImage, getHoodieImage, getCrewneckImage } from '../data/merchData';

// Maudite Machine (Massive) en premier
const artistOrder = ['maudite-machine', 'psyqu33n', 'adrift', 'mok'];

// Fallback - Produits pret-a-porter (utilise si CMS indisponible)
const defaultClothingProducts = [
  {
    id: 'tshirt',
    fr: 'T-Shirt',
    en: 'T-Shirt',
    price: 35,
    image: getTshirtImage('orchid'),
    desc_fr: 'Coton preshrunk, design exclusif. Tailles S a 3XL.',
    desc_en: 'Preshrunk cotton, exclusive design. Sizes S to 3XL.',
    comingSoon: true,
  },
  {
    id: 'hoodie',
    fr: 'Hoodie',
    en: 'Hoodie',
    price: 65,
    image: getHoodieImage('mint-green'),
    desc_fr: 'Molleton epais, design exclusif. Tailles S a 3XL.',
    desc_en: 'Heavy fleece, exclusive design. Sizes S to 3XL.',
    comingSoon: true,
  },
  {
    id: 'crewneck',
    fr: 'Crewneck',
    en: 'Crewneck',
    price: 55,
    image: getCrewneckImage('light-pink'),
    desc_fr: 'Molleton mi-poids, design exclusif. Tailles S a 3XL.',
    desc_en: 'Midweight fleece, exclusive design. Sizes S to 3XL.',
    comingSoon: true,
  },
];

// Fallback - Stickers produits finis
const defaultStickerProducts = [
  { id: 'stk-massive', fr: 'Massive Medias', en: 'Massive Medias', image: '/images/stickers/Stickers-massive.webp' },
  { id: 'stk-maudite', fr: 'Maudite Machine', en: 'Maudite Machine', image: '/images/stickers/Stickers-Maudite-Machine.webp' },
  { id: 'stk-cosmo', fr: 'Cosmovision', en: 'Cosmovision', image: '/images/stickers/Stickers-Cosmovision.webp' },
  { id: 'stk-vrstl', fr: 'Vrstl', en: 'Vrstl', image: '/images/stickers/Stickers-Vrstl.webp' },
  { id: 'stk-fusion', fr: 'Fusion State Rec', en: 'Fusion State Rec', image: '/images/stickers/Stickers-Fusion-State-Rec.webp' },
];

const defaultStickerPricingTiers = [
  { qty: 1, label: '1 pack', price: 35 },
  { qty: 5, label: '5 packs', price: 25 },
  { qty: 10, label: '10 packs', price: 20 },
  { qty: 25, label: '25+ packs', price: 15 },
];

// Categories pour filtrer
const categories = [
  { id: 'all', fr: 'Tout', en: 'All' },
  { id: 'pret-a-porter', fr: 'Pret-a-porter', en: 'Clothing' },
  { id: 'artistes', fr: 'Artistes', en: 'Artists' },
  { id: 'prints', fr: 'Prints', en: 'Prints' },
  { id: 'stickers', fr: 'Packs de stickers', en: 'Sticker packs' },
  { id: 'services', fr: 'Services', en: 'Services' },
];

function Boutique() {
  const { lang } = useLang();
  const { addToCart } = useCart();
  const { products: cmsProducts } = useProducts();
  const [activeCategory, setActiveCategory] = useState('all');
  const [view, setView] = useState('main'); // 'main' | 'prints'
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [stickerTier, setStickerTier] = useState(0);
  const [stickerAdded, setStickerAdded] = useState(false);

  // CMS-first : vetements pret-a-porter
  const clothingProducts = useMemo(() => {
    const cmsClothing = cmsProducts?.filter(p => p.category === 'pret-a-porter');
    if (cmsClothing && cmsClothing.length > 0) {
      return cmsClothing.map(p => ({
        id: p.slug,
        fr: p.nameFr,
        en: p.nameEn,
        price: p.pricingData?.price || 0,
        image: p.imageUrl || '',
        desc_fr: p.descriptionFr || '',
        desc_en: p.descriptionEn || '',
        comingSoon: p.comingSoon ?? false,
      }));
    }
    return defaultClothingProducts;
  }, [cmsProducts]);

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
    .map(slug => ({ ...artistsData[slug], slug }))
    .filter(a => a.name);

  // Quelques prints featured pour la vue principale
  const featuredPrints = orderedArtists
    .flatMap(a => (a.prints || []).slice(0, 3).map(p => ({ ...p, artist: a })))
    .slice(0, 6);

  const show = (cat) => activeCategory === 'all' || activeCategory === cat;

  // ── Vue Prints complete ──
  if (view === 'prints') {
    return (
      <>
        <SEO
          title={lang === 'fr' ? 'Prints - Boutique | Massive Medias' : 'Prints - Shop | Massive Medias'}
          description=""
          noindex
        />
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 hero-aurora"></div>
          <div className="relative z-10 section-container !py-0 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-4">Prints</h1>
              <p className="text-xl text-grey-light max-w-3xl mx-auto">
                {lang === 'fr'
                  ? 'Tirages fine art par nos artistes. Cliquez sur une oeuvre pour configurer votre tirage.'
                  : 'Fine art prints by our artists. Click an artwork to configure your print.'}
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
            {lang === 'fr' ? 'Retour a la boutique' : 'Back to shop'}
          </button>
          {orderedArtists.map((artist, ai) => {
            const hasPrints = artist.prints && artist.prints.length > 0;
            const minPrice = hasPrints ? Math.min(...Object.values(artist.pricing.studio)) : null;
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
                        ? `${artist.prints.length} ${lang === 'fr' ? 'oeuvres' : 'artworks'}${minPrice ? (lang === 'fr' ? ` - a partir de ${minPrice}$` : ` - from $${minPrice}`) : ''}`
                        : (lang === 'fr' ? 'Bientot disponible' : 'Coming soon')}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-grey-muted group-hover:text-accent ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
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
                        <Link to={`/artistes/${artist.slug}`} className="group block rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300">
                          <div className="aspect-[2/3] overflow-hidden">
                            <img src={print.image} alt={lang === 'fr' ? print.titleFr : print.titleEn} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-heading font-bold text-heading truncate">{lang === 'fr' ? print.titleFr : print.titleEn}</h3>
                            <p className="text-accent text-xs font-semibold mt-1">
                              {lang === 'fr' ? `A partir de ${minPrice}$` : `From $${minPrice}`}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-purple-main/20 p-8 text-center">
                    <p className="text-grey-muted text-sm">
                      {lang === 'fr' ? 'Prints bientot disponibles. Restez a l\'affut!' : 'Prints coming soon. Stay tuned!'}
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
        title={lang === 'fr' ? 'Boutique | Massive Medias' : 'Shop | Massive Medias'}
        description={lang === 'fr'
          ? 'Boutique Massive Medias - Vetements, prints, stickers et plus.'
          : 'Massive Medias Shop - Clothing, prints, stickers and more.'}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Boutique' : 'Shop' },
        ]}
      />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
              {lang === 'fr' ? 'Boutique' : 'Shop'}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-3xl mx-auto">
              {lang === 'fr'
                ? 'Vetements, prints d\'artistes et produits exclusifs. Fabrique a Montreal.'
                : 'Clothing, artist prints and exclusive products. Made in Montreal.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category tabs */}
      <div className="section-container max-w-6xl mx-auto !pb-0">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-accent text-white'
                  : 'bg-glass text-grey-light hover:text-heading hover:bg-glass'
              }`}
            >
              {lang === 'fr' ? cat.fr : cat.en}
            </button>
          ))}
        </div>
      </div>

      <div className="section-container max-w-6xl mx-auto">

        {/* ═══════════════════ PRET-A-PORTER ═══════════════════ */}
        {show('pret-a-porter') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                {lang === 'fr' ? 'Pret-a-porter' : 'Clothing'}
              </h2>
            </div>

            {/* Product cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {clothingProducts.map((product, i) => {
                const isAvailable = !product.comingSoon;
                const Wrapper = isAvailable && product.link ? Link : 'div';
                const wrapperProps = isAvailable && product.link ? { to: product.link } : {};
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    viewport={{ once: true }}
                  >
                    <Wrapper
                      {...wrapperProps}
                      className={`group block rounded-2xl overflow-hidden card-bg-bordered transition-all duration-300 ${
                        isAvailable ? 'hover:border-accent/50 cursor-pointer' : 'opacity-70'
                      }`}
                    >
                      <div className="aspect-square bg-glass overflow-hidden relative flex items-center justify-center p-6">
                        <img
                          src={product.image}
                          alt={lang === 'fr' ? product.fr : product.en}
                          className={`w-full h-full object-contain transition-transform duration-500 ${isAvailable ? 'group-hover:scale-105' : ''}`}
                          loading="lazy"
                        />
                        {product.badge_fr && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wider">
                            {lang === 'fr' ? product.badge_fr : product.badge_en}
                          </span>
                        )}
                        {product.comingSoon && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-glass backdrop-blur-sm text-grey-muted text-[10px] font-bold uppercase tracking-wider border border-white/10">
                            {lang === 'fr' ? 'Bientot' : 'Soon'}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-heading font-bold text-heading mb-1">
                              {lang === 'fr' ? product.fr : product.en}
                            </h3>
                            <p className="text-grey-muted text-xs">
                              {lang === 'fr' ? product.desc_fr : product.desc_en}
                            </p>
                          </div>
                          <span className="text-xl font-heading font-bold text-accent whitespace-nowrap">
                            {product.price}$
                          </span>
                        </div>
                        {isAvailable && (
                          <span className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold mt-4 group-hover:gap-2.5 transition-all">
                            {lang === 'fr' ? 'Configurer' : 'Configure'}
                            <ArrowRight size={14} />
                          </span>
                        )}
                      </div>
                    </Wrapper>
                  </motion.div>
                );
              })}
            </div>

            {/* Feature blocks - Qualite + Collabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="rounded-2xl card-bg-bordered p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sparkles size={18} className="text-accent" />
                  </div>
                  <h3 className="text-sm font-heading font-bold text-heading uppercase tracking-wide">
                    {lang === 'fr' ? 'Qualite superieure' : 'Premium quality'}
                  </h3>
                </div>
                <p className="text-grey-muted text-sm leading-relaxed">
                  {lang === 'fr'
                    ? 'Chaque piece est pensee pour durer. Materiaux premium, impression locale, coutures renforcees. Des vetements qui gardent leur eclat lavage apres lavage.'
                    : 'Each piece is designed to last. Premium materials, local printing, reinforced stitching. Clothes that keep their look wash after wash.'}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl card-bg-bordered p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Palette size={18} className="text-accent" />
                  </div>
                  <h3 className="text-sm font-heading font-bold text-heading uppercase tracking-wide">
                    {lang === 'fr' ? 'Collaborations artistiques' : 'Artist collaborations'}
                  </h3>
                </div>
                <p className="text-grey-muted text-sm leading-relaxed">
                  {lang === 'fr'
                    ? 'Des artistes locaux laissent leur empreinte sur nos collections. Street art, tatouage, graphisme - des creations authentiques faites a Montreal.'
                    : 'Local artists leave their mark on our collections. Street art, tattoo, graphic design - authentic creations made in Montreal.'}
                </p>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ═══════════════════ ARTISTES ═══════════════════ */}
        {show('artistes') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                {lang === 'fr' ? 'Nos artistes' : 'Our artists'}
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <img
                            src={artist.avatar}
                            alt=""
                            className="w-9 h-9 rounded-full ring-2 ring-white/20 object-cover mb-2"
                          />
                          <h3 className="text-base font-heading font-bold text-white group-hover:text-accent transition-colors leading-tight">
                            {artist.name}
                          </h3>
                          <p className="text-white/60 text-[11px] mt-0.5 leading-snug">
                            {lang === 'fr' ? artist.tagline.fr : artist.tagline.en}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                            <span className="text-white/50 text-[10px]">
                              {printCount > 0
                                ? `${printCount} ${lang === 'fr' ? 'oeuvres' : 'artworks'}`
                                : (lang === 'fr' ? 'Bientot' : 'Soon')}
                            </span>
                            <ArrowRight size={12} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ═══════════════════ PRINTS ═══════════════════ */}
        {show('prints') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                Prints
              </h2>
              <button
                onClick={() => { setView('prints'); window.scrollTo(0, 0); }}
                className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold hover:gap-2.5 transition-all"
              >
                {lang === 'fr' ? 'Voir tout' : 'View all'}
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredPrints.map((print, i) => {
                const minPrice = Math.min(...Object.values(print.artist.pricing.studio));
                return (
                  <motion.div
                    key={print.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      to={`/artistes/${print.artist.slug}`}
                      className="group block rounded-2xl overflow-hidden card-bg-bordered hover:border-accent/50 transition-all duration-300"
                    >
                      <div className="aspect-[2/3] overflow-hidden">
                        <img
                          src={print.image}
                          alt={lang === 'fr' ? print.titleFr : print.titleEn}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-0.5">{print.artist.name}</p>
                        <h3 className="text-xs font-heading font-bold text-heading truncate">
                          {lang === 'fr' ? print.titleFr : print.titleEn}
                        </h3>
                        <p className="text-accent text-xs font-semibold mt-1">
                          {lang === 'fr' ? `Des ${minPrice}$` : `From $${minPrice}`}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ═══════════════════ STICKERS ═══════════════════ */}
        {show('stickers') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                {lang === 'fr' ? 'Packs de stickers' : 'Sticker packs'}
              </h2>
              <span className="text-grey-muted text-xs">
                {lang === 'fr'
                  ? `Des ${Math.min(...stickerProducts.flatMap(s => s.tiers.map(t => t.price)))}$ le pack`
                  : `From $${Math.min(...stickerProducts.flatMap(s => s.tiers.map(t => t.price)))} per pack`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {stickerProducts.map((sticker, i) => {
                const isSelected = selectedSticker === sticker.id;
                return (
                  <motion.div
                    key={sticker.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <button
                      onClick={() => {
                        setSelectedSticker(isSelected ? null : sticker.id);
                        setStickerTier(0);
                        setStickerAdded(false);
                      }}
                      className={`group block w-full text-left rounded-2xl overflow-hidden card-bg-bordered transition-all duration-300 cursor-pointer ${
                        isSelected ? 'ring-2 ring-accent border-accent/50' : 'hover:border-accent/50'
                      }`}
                    >
                      <div className="aspect-square overflow-hidden bg-glass p-4">
                        <img
                          src={sticker.image}
                          alt={lang === 'fr' ? sticker.fr : sticker.en}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-heading font-bold text-heading truncate">
                          {lang === 'fr' ? sticker.fr : sticker.en}
                        </h3>
                        <p className="text-grey-muted text-[11px] mt-0.5">
                          {lang === 'fr' ? 'Pack de stickers vinyle' : 'Vinyl sticker pack'}
                        </p>
                        <p className="text-accent text-xs font-semibold mt-1">
                          {lang === 'fr' ? `Des ${sticker.tiers[0]?.price || 35}$ / pack` : `From $${sticker.tiers[0]?.price || 35} / pack`}
                        </p>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Panneau d'achat */}
            <AnimatePresence>
              {selectedSticker && (() => {
                const sticker = stickerProducts.find(s => s.id === selectedSticker);
                if (!sticker) return null;
                const tiers = sticker.tiers || defaultStickerPricingTiers;
                const tier = tiers[stickerTier] || tiers[0];
                const total = tier.price * tier.qty;

                const handleAddToCart = () => {
                  addToCart({
                    productId: `${sticker.id}-x${tier.qty}`,
                    productName: `${lang === 'fr' ? 'Pack de stickers' : 'Sticker pack'} ${lang === 'fr' ? sticker.fr : sticker.en} (${tier.label})`,
                    finish: lang === 'fr' ? sticker.fr : sticker.en,
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

                return (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 rounded-2xl card-bg-bordered p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img src={sticker.image} alt="" className="w-10 h-10 object-contain" />
                          <div>
                            <h4 className="text-sm font-heading font-bold text-heading">
                              {lang === 'fr' ? sticker.fr : sticker.en}
                            </h4>
                            <p className="text-grey-muted text-[11px]">
                              {lang === 'fr' ? 'Pack de stickers vinyle die-cut' : 'Die-cut vinyl sticker pack'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSticker(null)}
                          className="text-grey-muted hover:text-heading transition-colors p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Paliers de prix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
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
                            <span className="block text-xs text-grey-muted mb-1">{t.label}</span>
                            <span className="block text-lg font-heading font-bold text-heading">{t.price}$</span>
                            <span className="block text-[10px] text-grey-muted">
                              {lang === 'fr' ? '/ pack' : '/ pack'}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Total + Add to cart */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-grey-muted text-xs">Total</span>
                          <span className="block text-xl font-heading font-bold text-heading">{total}$</span>
                        </div>
                        <button
                          onClick={handleAddToCart}
                          className="btn-primary py-2.5 px-6"
                        >
                          {stickerAdded ? (
                            <><Check size={16} className="mr-1.5" />{lang === 'fr' ? 'Ajoute!' : 'Added!'}</>
                          ) : (
                            <><ShoppingCart size={16} className="mr-1.5" />{lang === 'fr' ? 'Ajouter au panier' : 'Add to cart'}</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </motion.section>
        )}

        {/* ═══════════════════ SERVICES ═══════════════════ */}
        {show('services') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                Services
              </h2>
              <Link
                to="/services"
                className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold hover:gap-2.5 transition-all"
              >
                {lang === 'fr' ? 'Tous les services' : 'All services'}
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Link
                to="/boutique/sublimation"
                className="group flex items-center gap-5 p-6 rounded-2xl card-bg-bordered hover:border-accent/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-glass flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                  <Shirt size={24} className="text-accent/60 group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-base font-heading font-bold text-heading group-hover:text-accent transition-colors">
                    Sublimation & Merch Custom
                  </h3>
                  <p className="text-grey-muted text-xs mt-0.5">
                    {lang === 'fr'
                      ? 'Impression permanente sur textile. T-shirts, hoodies, mugs.'
                      : 'Permanent textile printing. T-shirts, hoodies, mugs.'}
                  </p>
                </div>
                <ArrowRight size={18} className="text-grey-muted group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>

              <Link
                to="/boutique/fine-art"
                className="group flex items-center gap-5 p-6 rounded-2xl card-bg-bordered hover:border-accent/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-glass flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                  <img src="/images/prints/PrintsFlatlay.webp" alt="" className="w-full h-full object-cover rounded-xl" />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-base font-heading font-bold text-heading group-hover:text-accent transition-colors">
                    Fine Art & Flyers
                  </h3>
                  <p className="text-grey-muted text-xs mt-0.5">
                    {lang === 'fr'
                      ? 'Tirages giclees, flyers, cartes d\'affaires.'
                      : 'Giclee prints, flyers, business cards.'}
                  </p>
                </div>
                <ArrowRight size={18} className="text-grey-muted group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            </div>
          </motion.section>
        )}

        {/* ═══════════════════ CTA ═══════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl mb-8 cta-text-bordered"
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Un projet custom en tete?' : 'Got a custom project in mind?'}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'On imprime tout sur mesure. Contacte-nous pour discuter de ton projet.'
              : 'We print everything custom. Contact us to discuss your project.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/contact" className="btn-primary">
              {lang === 'fr' ? 'Nous contacter' : 'Contact us'}
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link to="/services" className="btn-outline">
              {lang === 'fr' ? 'Voir les services' : 'See services'}
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default Boutique;
