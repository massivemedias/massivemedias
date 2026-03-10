import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Palette, Shirt, ShoppingCart, Check, X, Code, PenTool, User } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/useProducts';
import artistsData from '../data/artists';
import { getTshirtImage, getHoodieImage, getCrewneckImage } from '../data/merchData';
import { img } from '../utils/paths';

// Maudite Machine (Massive) en premier
const artistOrder = ['maudite-machine', 'psyqu33n', 'adrift', 'mok'];

// Fallback - Produits pret-a-porter (utilise si CMS indisponible)
const defaultClothingProducts = [
  {
    id: 'tshirt',
    fr: 'T-Shirt',
    en: 'T-Shirt',
    es: 'Camiseta',
    price: 22,
    image: getTshirtImage('orchid'),
    desc_fr: 'Coton preshrunk, design exclusif. Tailles S à 3XL.',
    desc_en: 'Preshrunk cotton, exclusive design. Sizes S to 3XL.',
    desc_es: 'Algodón preencogido, diseño exclusivo. Tallas S a 3XL.',
    comingSoon: false,
    link: '/boutique/merch/tshirt',
  },
  {
    id: 'hoodie',
    fr: 'Hoodie',
    en: 'Hoodie',
    es: 'Sudadera con capucha',
    price: 39,
    image: getHoodieImage('mint-green'),
    desc_fr: 'Molleton épais, design exclusif. Tailles S à 3XL.',
    desc_en: 'Heavy fleece, exclusive design. Sizes S to 3XL.',
    desc_es: 'Forro polar grueso, diseño exclusivo. Tallas S a 3XL.',
    comingSoon: false,
    link: '/boutique/merch/hoodie',
  },
  {
    id: 'crewneck',
    fr: 'Crewneck',
    en: 'Crewneck',
    es: 'Sudadera cuello redondo',
    price: 30,
    image: getCrewneckImage('light-pink'),
    desc_fr: 'Molleton mi-poids, design exclusif. Tailles S à 3XL.',
    desc_en: 'Midweight fleece, exclusive design. Sizes S to 3XL.',
    desc_es: 'Forro polar de peso medio, diseño exclusivo. Tallas S a 3XL.',
    comingSoon: false,
    link: '/boutique/merch/crewneck',
  },
];

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

// Categories pour filtrer
const categories = [
  { id: 'all', fr: 'Tout', en: 'All', es: 'Todo' },
  { id: 'artistes', fr: 'Artistes', en: 'Artists', es: 'Artistas' },
  { id: 'pret-a-porter', fr: 'Prêt-à-porter Massive', en: 'Massive Clothing', es: 'Ropa Massive' },
  { id: 'prints', fr: 'Prints', en: 'Prints', es: 'Impresiones' },
  { id: 'stickers', fr: 'Packs de stickers', en: 'Sticker packs', es: 'Packs de stickers' },
  { id: 'services', fr: 'Services', en: 'Services', es: 'Servicios' },
];

function Boutique() {
  const { tx } = useLang();
  const { addToCart } = useCart();
  const { products: cmsProducts } = useProducts();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [view, setView] = useState('main'); // 'main' | 'prints'

  // Reset view when navigating to /boutique (e.g. clicking Boutique link in header)
  useEffect(() => {
    setView('main');
    setActiveCategory('all');
  }, [location.key]);


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
        link: p.link || `/boutique/merch/${p.slug?.replace('merch-', '') || p.slug}`,
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

  // Stickers individuels des artistes pour le carousel
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
    // Packs + stickers artistes sans doublons (par image)
    const packImages = new Set(stickerProducts.map(s => s.image));
    return [...stickerProducts, ...artistStickers.filter(s => !packImages.has(s.image))];
  }, [stickerProducts, orderedArtists]);

  // Quelques prints featured pour la vue principale
  const featuredPrints = orderedArtists
    .flatMap(a => (a.prints || []).slice(0, 5).map(p => ({ ...p, artist: a })))
    .slice(0, 12);

  const show = (cat) => activeCategory === 'all' || activeCategory === cat;

  // ── Vue Prints complete ──
  if (view === 'prints') {
    return (
      <>
        <SEO
          title={tx({ fr: 'Prints - Boutique | Massive', en: 'Prints - Shop | Massive', es: 'Impresiones - Tienda | Massive' })}
          description=""
          noindex
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
            {tx({ fr: 'Retour a la boutique', en: 'Back to shop', es: 'Volver a la tienda' })}
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
                        ? `${artist.prints.length} ${tx({ fr: 'oeuvres', en: 'artworks', es: 'obras' })}${minPrice ? tx({ fr: ` - a partir de ${minPrice}$`, en: ` - from $${minPrice}`, es: ` - desde ${minPrice}$` }) : ''}`
                        : tx({ fr: 'Bientot disponible', en: 'Coming soon', es: 'Disponible pronto' })}
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
        title={tx({ fr: 'Boutique | Massive', en: 'Shop | Massive', es: 'Tienda | Massive' })}
        description={tx({
          fr: 'Boutique Massive - Vêtements, prints, stickers et plus.',
          en: 'Massive Shop - Clothing, prints, stickers and more.',
          es: 'Tienda Massive - Ropa, impresiones, stickers y mas.',
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
                fr: 'Vêtements, prints d\'artistes et produits exclusifs. Fabriqué à Montréal.',
                en: 'Clothing, artist prints and exclusive products. Made in Montreal.',
                es: 'Ropa, impresiones de artistas y productos exclusivos. Hecho en Montreal.',
              })}
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
              {tx(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="section-container max-w-6xl mx-auto">

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
                {tx({ fr: 'Nos artistes', en: 'Our artists', es: 'Nuestros artistas' })}
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
                            {tx({ fr: artist.tagline.fr, en: artist.tagline.en, es: artist.tagline.es || artist.tagline.en })}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                            <span className="text-white/50 text-[10px]">
                              {printCount > 0
                                ? `${printCount} ${tx({ fr: 'oeuvres', en: 'artworks', es: 'obras' })}`
                                : tx({ fr: 'Bientot', en: 'Soon', es: 'Pronto' })}
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

        {/* ═══════════════════ PRET-A-PORTER MASSIVE ═══════════════════ */}
        {show('pret-a-porter') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 opacity-50 pointer-events-none select-none"
          >
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">
                {tx({ fr: 'Prêt-à-porter Massive', en: 'Massive Clothing', es: 'Ropa Massive' })}
              </h2>
              <span className="px-3 py-1 rounded-full bg-glass backdrop-blur-sm text-grey-muted text-[11px] font-bold uppercase tracking-wider border border-white/10">
                {tx({ fr: 'Bientôt disponible', en: 'Coming soon', es: 'Disponible pronto' })}
              </span>
            </div>

            {/* Product cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 grayscale">
              {clothingProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    viewport={{ once: true }}
                  >
                    <div
                      className="group block rounded-2xl overflow-hidden card-bg-bordered transition-all duration-300"
                    >
                      <div className="aspect-square bg-glass overflow-hidden relative flex items-center justify-center p-6">
                        <img
                          src={product.image}
                          alt={tx(product)}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-heading font-bold text-heading mb-1">
                              {tx(product)}
                            </h3>
                            <p className="text-grey-muted text-xs">
                              {tx({ fr: product.desc_fr, en: product.desc_en, es: product.desc_es || product.desc_en })}
                            </p>
                          </div>
                          <span className="text-xl font-heading font-bold text-grey-muted whitespace-nowrap">
                            {product.price}$
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
              ))}
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
                    {tx({ fr: 'Qualite superieure', en: 'Premium quality', es: 'Calidad superior' })}
                  </h3>
                </div>
                <p className="text-grey-muted text-sm leading-relaxed">
                  {tx({
                    fr: 'Chaque pièce est pensée pour durer. Matériaux premium, impression locale, coutures renforcées. Des vêtements qui gardent leur éclat lavage après lavage.',
                    en: 'Each piece is designed to last. Premium materials, local printing, reinforced stitching. Clothes that keep their look wash after wash.',
                    es: 'Cada pieza está diseñada para durar. Materiales premium, impresión local, costuras reforzadas. Ropa que mantiene su aspecto lavado tras lavado.',
                  })}
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
                    {tx({ fr: 'Collaborations artistiques', en: 'Artist collaborations', es: 'Colaboraciones artisticas' })}
                  </h3>
                </div>
                <p className="text-grey-muted text-sm leading-relaxed">
                  {tx({
                    fr: 'Des artistes locaux laissent leur empreinte sur nos collections. Street art, tatouage, graphisme - des créations authentiques faites à Montréal.',
                    en: 'Local artists leave their mark on our collections. Street art, tattoo, graphic design - authentic creations made in Montreal.',
                    es: 'Artistas locales dejan su huella en nuestras colecciones. Street art, tatuaje, diseno grafico - creaciones autenticas hechas en Montreal.',
                  })}
                </p>
              </motion.div>
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
                {tx({ fr: 'Voir tout', en: 'View all', es: 'Ver todo' })}
                <ArrowRight size={14} />
              </button>
            </div>

            <div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
              style={{ scrollBehavior: 'auto' }}
            >
              {featuredPrints.map((print, i) => {
                const minPrice = Math.min(...Object.values(print.artist.pricing.studio));
                return (
                  <motion.div
                    key={print.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="flex-shrink-0 w-[35vw] sm:w-[22vw] lg:w-[12vw]"
                  >
                    <Link
                      to={`/artistes/${print.artist.slug}`}
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
                {tx({ fr: 'Packs de stickers', en: 'Sticker packs', es: 'Packs de stickers' })}
              </h2>
              <span className="text-grey-muted text-xs">
                {tx({
                  fr: `Des ${Math.min(...stickerProducts.flatMap(s => s.tiers.map(t => t.price)))}$ le pack`,
                  en: `From $${Math.min(...stickerProducts.flatMap(s => s.tiers.map(t => t.price)))} per pack`,
                  es: `Desde ${Math.min(...stickerProducts.flatMap(s => s.tiers.map(t => t.price)))}$ por pack`,
                })}
              </span>
            </div>

            <div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
              style={{ scrollBehavior: 'auto' }}
            >
              {allStickers.map((sticker, i) => {
                const isSelected = selectedSticker === sticker.id;
                return (
                  <motion.div
                    key={sticker.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="flex-shrink-0 w-[40vw] sm:w-[25vw] lg:w-[14vw]"
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
                          alt={tx(sticker)}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
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
                          {tx({ fr: `Des ${sticker.tiers[0]?.price || 35}$ / pack`, en: `From $${sticker.tiers[0]?.price || 35} / pack`, es: `Desde ${sticker.tiers[0]?.price || 35}$ / pack` })}
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
                              {tx(sticker)}
                            </h4>
                            <p className="text-grey-muted text-[11px]">
                              {tx({ fr: 'Pack de stickers vinyle die-cut', en: 'Die-cut vinyl sticker pack', es: 'Pack de stickers de vinilo troquelados' })}
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
                              / pack
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
                            <><Check size={16} className="mr-1.5" />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</>
                          ) : (
                            <><ShoppingCart size={16} className="mr-1.5" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
                          )}
                        </button>
                      </div>

                      {sticker.artistSlug && (
                        <Link
                          to={`/artistes/${sticker.artistSlug}`}
                          className="mt-3 flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
                        >
                          <User size={14} />
                          {tx({
                            fr: `Voir les prints et oeuvres de ${tx(sticker)}`,
                            en: `See prints and artworks by ${tx(sticker)}`,
                            es: `Ver prints y obras de ${tx(sticker)}`,
                          })}
                          <ArrowRight size={14} />
                        </Link>
                      )}
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
                to="/#services"
                className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold hover:gap-2.5 transition-all"
              >
                {tx({ fr: 'Tous les services', en: 'All services', es: 'Todos los servicios' })}
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Link
                to="/services/design"
                className="group flex items-center gap-5 p-6 rounded-2xl card-bg-bordered hover:border-accent/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-glass flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                  <PenTool size={24} className="text-accent/60 group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-base font-heading font-bold text-heading group-hover:text-accent transition-colors">
                    Design graphique
                  </h3>
                  <p className="text-grey-muted text-xs mt-0.5">
                    {tx({
                      fr: 'Logos, identites visuelles, affiches et pochettes.',
                      en: 'Logos, visual identities, posters and covers.',
                      es: 'Logos, identidades visuales, carteles y portadas.',
                    })}
                  </p>
                </div>
                <ArrowRight size={18} className="text-grey-muted group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>

              <Link
                to="/services/web"
                className="group flex items-center gap-5 p-6 rounded-2xl card-bg-bordered hover:border-accent/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-glass flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                  <Code size={24} className="text-accent/60 group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-base font-heading font-bold text-heading group-hover:text-accent transition-colors">
                    {tx({ fr: 'Developpement web', en: 'Web development', es: 'Desarrollo web' })}
                  </h3>
                  <p className="text-grey-muted text-xs mt-0.5">
                    {tx({
                      fr: 'Sites web, applications et solutions sur mesure.',
                      en: 'Websites, applications and custom solutions.',
                      es: 'Sitios web, aplicaciones y soluciones a medida.',
                    })}
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
            {tx({ fr: 'Un projet custom en tete?', en: 'Got a custom project in mind?', es: 'Tienes un proyecto personalizado en mente?' })}
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
            <Link to="/boutique" className="btn-outline">
              {tx({ fr: 'Voir les services', en: 'See services', es: 'Ver servicios' })}
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default Boutique;
