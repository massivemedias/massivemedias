import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Camera, Award, Shield, Truck, Palette, MessageSquare, ChevronDown, CheckCircle, Image, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';
import ArtistPrintCard from '../components/ArtistPrintCard';
import ConfiguratorArtistPrint from '../components/configurators/ConfiguratorArtistPrint';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import artistsData, { artistFormats } from '../data/artists';

function ArtisteDetail({ subdomainSlug }) {
  const { slug: routeSlug } = useParams();
  const slug = subdomainSlug || routeSlug;
  const { lang } = useLang();
  const { theme } = useTheme();
  const artist = artistsData[slug];
  const [selectedPrint, setSelectedPrint] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const configuratorRef = useRef(null);

  if (!artist) {
    return (
      <div className="section-container pt-32 text-center">
        <h1 className="text-4xl font-heading font-bold text-heading mb-4">
          {lang === 'fr' ? 'Artiste introuvable' : 'Artist not found'}
        </h1>
        <Link to="/artistes" className="text-accent hover:underline">
          {lang === 'fr' ? '← Retour aux artistes' : '← Back to artists'}
        </Link>
      </div>
    );
  }

  const tagline = lang === 'fr' ? artist.tagline.fr : artist.tagline.en;
  const bio = lang === 'fr' ? artist.bio.fr : artist.bio.en;
  const minPrice = Math.min(...Object.values(artist.pricing.studio));

  const handleSelectPrint = (print) => {
    setSelectedPrint(print);
    setTimeout(() => {
      configuratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const highlights = lang === 'fr' ? [
    'Tirages fine art professionnels, qualité galerie',
    'Imprimés par Massive Medias, Montréal',
    'Papiers d\'archives, encres pigmentées',
    'Soft proofing et calibration couleurs inclus',
    'Pick-up gratuit Mile-End ou livraison',
    'Cadre noir ou blanc disponible',
  ] : [
    'Professional fine art prints, gallery quality',
    'Printed by Massive Medias, Montreal',
    'Archival papers, pigmented inks',
    'Soft proofing and color calibration included',
    'Free Mile-End pick-up or delivery',
    'Black or white frame available',
  ];

  const processSteps = lang === 'fr' ? [
    { step: '1', title: 'Choisissez', desc: 'Sélectionnez une oeuvre et configurez votre tirage - série, format et cadre.' },
    { step: '2', title: 'On imprime', desc: 'Impression professionnelle dans nos studios. Soft proofing et contrôle qualité avant envoi.' },
    { step: '3', title: 'Livraison', desc: 'Pick-up gratuit au Mile-End ou livraison sécurisée à votre porte.' },
  ] : [
    { step: '1', title: 'Choose', desc: 'Select an artwork and configure your print - series, format and frame.' },
    { step: '2', title: 'We print', desc: 'Professional printing in our studios. Soft proofing and quality control before shipping.' },
    { step: '3', title: 'Delivery', desc: 'Free Mile-End pick-up or secure delivery to your door.' },
  ];

  const equipmentItems = [
    { name: 'Epson ET-15000', desc: lang === 'fr' ? '4 encres pigmentées - Série Studio' : '4 pigmented inks - Studio Series' },
    { name: 'Canon PRO-1000', desc: lang === 'fr' ? '12 encres pigmentées - Série Musée' : '12 pigmented inks - Museum Series' },
    { name: lang === 'fr' ? 'Papiers Fine Art' : 'Fine Art Papers', desc: lang === 'fr' ? 'Hahnemühle, Canson, Ilford' : 'Hahnemühle, Canson, Ilford' },
  ];

  const faqItems = lang === 'fr' ? [
    { q: 'Comment se passe la commande?', a: 'Sélectionnez l\'oeuvre, la qualité d\'impression, le format et le cadre. Ajoutez au panier et procédez au paiement. Nous imprimons et préparons votre commande sous 24-48h.' },
    { q: 'Quelle est la différence entre Studio et Musée?', a: 'La Série Studio utilise une Epson 4 couleurs, parfaite pour la décoration. La Série Musée utilise une Canon PRO-1000 12 couleurs pour une qualité galerie, idéale pour les collectionneurs.' },
    { q: 'Puis-je récupérer sur place?', a: 'Oui! Pick-up gratuit au Mile-End (7049 rue Saint-Urbain, Montréal). Livraison locale aussi disponible.' },
    { q: 'Les tirages sont-ils signés?', a: 'Les tirages sont imprimés professionnellement par Massive Medias en collaboration avec l\'artiste. Contactez-nous pour les tirages signés ou numérotés.' },
    { q: 'Offrez-vous l\'encadrement?', a: 'Oui, cadre noir ou blanc disponible. Ajoutez l\'option cadre directement dans le configurateur.' },
  ] : [
    { q: 'How does ordering work?', a: 'Select the artwork, print quality, format and frame. Add to cart and proceed to payment. We print and prepare your order within 24-48h.' },
    { q: 'What\'s the difference between Studio and Museum?', a: 'Studio Series uses an Epson 4-color printer, perfect for decoration. Museum Series uses a Canon PRO-1000 12-color printer for gallery quality, ideal for collectors.' },
    { q: 'Can I pick up in person?', a: 'Yes! Free pick-up in Mile-End (7049 rue Saint-Urbain, Montreal). Local delivery also available.' },
    { q: 'Are the prints signed?', a: 'Prints are professionally printed by Massive Medias in collaboration with the artist. Contact us for signed or numbered editions.' },
    { q: 'Do you offer framing?', a: 'Yes, black or white frame available. Add the frame option directly in the configurator.' },
  ];

  return (
    <>
      <SEO
        title={`${artist.name} - ${tagline} | Massive Medias`}
        description={bio.slice(0, 160)}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Artistes' : 'Artists', url: '/artistes' },
          { name: artist.name },
        ]}
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
                <Link to="/" className="text-grey-muted hover:text-accent transition-colors">{lang === 'fr' ? 'Accueil' : 'Home'}</Link>
                <span className="text-grey-muted">/</span>
                <Link to="/artistes" className="text-grey-muted hover:text-accent transition-colors">{lang === 'fr' ? 'Artistes' : 'Artists'}</Link>
                <span className="text-grey-muted">/</span>
                <span className="text-accent">{artist.name}</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-xl icon-bg-blur">
                  <Image size={36} className="text-accent" />
                </div>
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
                {lang === 'fr'
                  ? `${artist.prints.length} oeuvres disponibles · Tirages à partir de ${minPrice}$`
                  : `${artist.prints.length} artworks available · Prints starting at $${minPrice}`}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#oeuvres" className="btn-primary">
                  {lang === 'fr' ? 'Voir les oeuvres' : 'View artworks'}
                  <ArrowRight className="ml-2" size={20} />
                </a>
                <a href="#tarifs" className="btn-outline">
                  {lang === 'fr' ? 'Voir les tarifs' : 'View pricing'}
                </a>
              </div>
            </motion.div>

            {artist.heroImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block lg:flex-1 max-w-md"
              >
                <img
                  src={artist.heroImage}
                  alt={artist.name}
                  className="w-full h-auto object-contain drop-shadow-2xl rounded-2xl"
                />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto">

        {/* ============ DESCRIPTION + HIGHLIGHTS ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20"
        >
          <div>
            <h2 className="text-3xl font-heading font-bold text-gradient mb-6">
              {lang === 'fr' ? 'L\'artiste' : 'The Artist'}
            </h2>
            <p className="text-grey-light text-base leading-relaxed mb-4">{bio}</p>
            {artist.socials && (
              <div className="flex gap-3 mt-6">
                {artist.socials.instagram && (
                  <a href={artist.socials.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline !py-2 !px-4 text-sm">
                    Instagram <ExternalLink size={14} className="ml-1" />
                  </a>
                )}
                {artist.socials.facebook && (
                  <a href={artist.socials.facebook} target="_blank" rel="noopener noreferrer" className="btn-outline !py-2 !px-4 text-sm">
                    Facebook <ExternalLink size={14} className="ml-1" />
                  </a>
                )}
                {artist.socials.gallea && (
                  <a href={artist.socials.gallea} target="_blank" rel="noopener noreferrer" className="btn-outline !py-2 !px-4 text-sm">
                    Gallea <ExternalLink size={14} className="ml-1" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="p-8 rounded-2xl border border-purple-main/30 transition-colors duration-300 highlight-shadow">
            <h3 className="text-xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
              <CheckCircle size={22} className="text-accent" />
              {lang === 'fr' ? 'Ce qui est inclus' : 'What\'s included'}
            </h3>
            <ul className="space-y-4">
              {highlights.map((highlight, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
                  <span className="text-grey-light">{highlight}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

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
              {lang === 'fr' ? 'Demarche artistique' : 'Artistic Approach'}
            </h2>
            <div className="max-w-3xl mx-auto space-y-8">
              {(lang === 'fr' ? artist.demarche.fr : artist.demarche.en).map((section, index) => (
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

        {/* ============ OEUVRES ============ */}
        <motion.div
          id="oeuvres"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20 scroll-mt-24"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-3 text-center">
            {lang === 'fr' ? 'Oeuvres disponibles' : 'Available Artworks'}
          </h2>
          <p className="text-grey-muted text-center mb-10 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'Sélectionnez une oeuvre pour configurer votre tirage.'
              : 'Select an artwork to configure your print.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {artist.prints.map((print, index) => (
              <motion.div
                key={print.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <ArtistPrintCard
                  print={print}
                  minPrice={minPrice}
                  selected={selectedPrint?.id === print.id}
                  onClick={() => handleSelectPrint(print)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

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
              {lang === 'fr' ? 'Configurez votre tirage' : 'Configure Your Print'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-square border border-purple-main/30 card-shadow">
                <img
                  src={selectedPrint.image}
                  alt={lang === 'fr' ? selectedPrint.titleFr : selectedPrint.titleEn}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Options */}
              <div className={`p-6 rounded-2xl border border-purple-main/30 transition-colors duration-300 highlight-shadow lg:sticky lg:top-24 self-start`}>
                <ConfiguratorArtistPrint
                  artist={artist}
                  selectedPrint={selectedPrint}
                />
              </div>
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
            {lang === 'fr' ? 'Comment ça marche' : 'How It Works'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {processSteps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border border-purple-main/30 relative transition-colors duration-300 glass-shadow"
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

        {/* ============ TARIFS ============ */}
        <motion.div
          id="tarifs"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20 scroll-mt-24"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-3 text-center">
            {lang === 'fr' ? 'Tarifs' : 'Pricing'}
          </h2>
          <p className="text-grey-muted text-center mb-8">
            {lang === 'fr' ? 'Tous les prix incluent l\'impression professionnelle et le contrôle qualité.' : 'All prices include professional printing and quality control.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Studio */}
            <div className="rounded-xl overflow-hidden border border-purple-main/30 card-shadow">
              <div className="p-4 border-b border-purple-main/30 bg-glass-alt">
                <div className="flex items-center gap-3">
                  <Camera size={20} className="text-accent" />
                  <h3 className="text-heading font-heading font-bold">
                    {lang === 'fr' ? 'Série Studio' : 'Studio Series'}
                  </h3>
                </div>
                <p className="text-grey-muted text-xs mt-1">Epson ET-15000 - 4 {lang === 'fr' ? 'encres pigmentées' : 'pigmented inks'}</p>
              </div>
              <table className="price-table">
                <thead>
                  <tr>
                    <th>Format</th>
                    <th>{lang === 'fr' ? 'Prix' : 'Price'}</th>
                  </tr>
                </thead>
                <tbody>
                  {artistFormats.map(f => (
                    <tr key={f.id}>
                      <td className="text-heading font-semibold">{f.label}</td>
                      <td className="text-gradient font-bold">{artist.pricing.studio[f.id]}$</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Museum */}
            <div className="rounded-xl overflow-hidden border border-purple-main/30 card-shadow">
              <div className="p-4 border-b border-purple-main/30 bg-glass-alt">
                <div className="flex items-center gap-3">
                  <Award size={20} className="text-accent" />
                  <h3 className="text-heading font-heading font-bold">
                    {lang === 'fr' ? 'Série Musée' : 'Museum Series'}
                  </h3>
                </div>
                <p className="text-grey-muted text-xs mt-1">Canon PRO-1000 - 12 {lang === 'fr' ? 'encres pigmentées' : 'pigmented inks'}</p>
              </div>
              <table className="price-table">
                <thead>
                  <tr>
                    <th>Format</th>
                    <th>{lang === 'fr' ? 'Prix' : 'Price'}</th>
                  </tr>
                </thead>
                <tbody>
                  {artistFormats.map(f => (
                    <tr key={f.id}>
                      <td className="text-heading font-semibold">{f.label}</td>
                      <td className="text-gradient font-bold">{artist.pricing.museum[f.id]}$</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Frame note */}
          <p className="text-grey-muted text-center text-sm mt-6">
            {lang === 'fr'
              ? `Cadre noir ou blanc : +${artist.pricing.framePrice}$ · Taxes en sus`
              : `Black or white frame: +$${artist.pricing.framePrice} · Taxes extra`}
          </p>
        </motion.div>

        {/* ============ ÉQUIPEMENT ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
            {lang === 'fr' ? 'Notre équipement' : 'Our Equipment'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {equipmentItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border border-purple-main/30 text-center transition-colors duration-300 glass-shadow"
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
            {lang === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
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
          className="mb-20 p-12 rounded-2xl text-center border border-accent/30 transition-colors duration-300 cta-shadow"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Tu es artiste? Rejoins la plateforme.' : 'Are you an artist? Join the platform.'}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'On s\'occupe de tout : site web dédié, impression pro, packaging et shipping. Tu fournis tes fichiers, tu fixes ta marge, et tu reçois ton argent.'
              : 'We handle everything: dedicated website, professional printing, packaging and shipping. You provide your files, set your margin, and get paid.'}
          </p>
          <Link to="/contact" className="btn-primary">
            <MessageSquare size={20} className="mr-2" />
            {lang === 'fr' ? 'Contactez-nous' : 'Contact us'}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>
      </div>
    </>
  );
}

export default ArtisteDetail;
