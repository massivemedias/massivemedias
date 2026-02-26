import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Palette, Shield, Award, Truck, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';
import ArtistPrintCard from '../components/ArtistPrintCard';
import ConfiguratorArtistPrint from '../components/configurators/ConfiguratorArtistPrint';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import artistsData, { artistFormats } from '../data/artists';

function ArtisteDetail() {
  const { slug } = useParams();
  const { lang } = useLang();
  const { theme } = useTheme();
  const artist = artistsData[slug];
  const [selectedPrint, setSelectedPrint] = useState(null);
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

  const seriesInfo = [
    {
      titleFr: 'Série Studio',
      titleEn: 'Studio Series',
      descFr: 'Imprimante Epson ET-15000 — 4 encres pigmentées. Excellente qualité pour décoration, cadeaux et usage quotidien. Durée de conservation 50+ ans.',
      descEn: 'Epson ET-15000 printer — 4 pigmented inks. Excellent quality for decoration, gifts and everyday use. 50+ year conservation.',
      icon: Camera,
    },
    {
      titleFr: 'Série Musée',
      titleEn: 'Museum Series',
      descFr: 'Imprimante Canon PRO-1000 — 12 encres pigmentées. Qualité galerie avec gamut ultra-large. Papiers fine art d\'archives. Conservation 100+ ans.',
      descEn: 'Canon PRO-1000 printer — 12 pigmented inks. Gallery quality with ultra-wide gamut. Archival fine art papers. 100+ year conservation.',
      icon: Award,
    },
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
        title={`${artist.name} — ${tagline} | Massive Medias`}
        description={bio.slice(0, 160)}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Artistes' : 'Artists', url: '/artistes' },
          { name: artist.name },
        ]}
      />

      {/* ============ HERO ============ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 hero-aurora"></div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {artist.avatar && (
              <img
                src={artist.avatar}
                alt={artist.name}
                className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border-2 border-accent/30"
              />
            )}
            <h1 className="text-6xl md:text-8xl font-heading font-bold text-heading mb-4">
              {artist.name}
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-2xl mx-auto mb-6">
              {tagline}
            </p>
            <p className="text-sm text-grey-muted">
              {lang === 'fr'
                ? `${artist.prints.length} oeuvres disponibles · Tirages à partir de ${minPrice}$`
                : `${artist.prints.length} artworks available · Prints starting at $${minPrice}`}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ BIO ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-6">
            {lang === 'fr' ? 'À propos de l\'artiste' : 'About the Artist'}
          </h2>
          <p className="text-grey-light text-lg leading-relaxed">{bio}</p>
        </motion.div>
      </section>

      {/* ============ OEUVRES ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Oeuvres disponibles' : 'Available Artworks'}
          </h2>
          <p className="text-grey-light text-lg max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'Sélectionnez une oeuvre pour configurer votre tirage.'
              : 'Select an artwork to configure your print.'}
          </p>
        </motion.div>

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
                minPrice={Math.min(...Object.values(artist.pricing.studio))}
                selected={selectedPrint?.id === print.id}
                onClick={() => handleSelectPrint(print)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ CONFIGURATEUR ============ */}
      {selectedPrint && (
        <section ref={configuratorRef} className="section-container scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <h2 className="text-3xl font-heading font-bold text-heading mb-8 text-center">
              {lang === 'fr' ? 'Configurez votre tirage' : 'Configure Your Print'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-square">
                <img
                  src={selectedPrint.image}
                  alt={lang === 'fr' ? selectedPrint.titleFr : selectedPrint.titleEn}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Options */}
              <div className={`p-6 rounded-2xl ${theme === 'light' ? 'bg-white/50' : 'bg-glass'} lg:sticky lg:top-24 self-start`}>
                <ConfiguratorArtistPrint
                  artist={artist}
                  selectedPrint={selectedPrint}
                />
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* ============ SÉRIES D'IMPRESSION ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Nos séries d\'impression' : 'Our Print Series'}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {seriesInfo.map((series, index) => {
            const Icon = series.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-xl bg-glass card-shadow"
              >
                <div className="mb-4 p-3 rounded-lg w-fit icon-bg">
                  <Icon size={28} className="text-accent" />
                </div>
                <h3 className="font-heading text-xl font-bold text-heading mb-3">
                  {lang === 'fr' ? series.titleFr : series.titleEn}
                </h3>
                <p className="text-grey-light text-sm leading-relaxed">
                  {lang === 'fr' ? series.descFr : series.descEn}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Pricing grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-10 max-w-3xl mx-auto overflow-x-auto"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-grey-muted/20">
                <th className="text-left py-3 px-4 text-heading font-semibold">Format</th>
                <th className="text-center py-3 px-4 text-heading font-semibold">
                  {lang === 'fr' ? 'Série Studio' : 'Studio Series'}
                </th>
                <th className="text-center py-3 px-4 text-heading font-semibold">
                  {lang === 'fr' ? 'Série Musée' : 'Museum Series'}
                </th>
              </tr>
            </thead>
            <tbody>
              {artistFormats.map(f => (
                <tr key={f.id} className="border-b border-grey-muted/10">
                  <td className="py-3 px-4 text-grey-light">{f.label}</td>
                  <td className="py-3 px-4 text-center text-heading font-medium">{artist.pricing.studio[f.id]}$</td>
                  <td className="py-3 px-4 text-center text-heading font-medium">{artist.pricing.museum[f.id]}$</td>
                </tr>
              ))}
              <tr className="border-b border-grey-muted/10">
                <td className="py-3 px-4 text-grey-light">{lang === 'fr' ? 'Cadre (noir ou blanc)' : 'Frame (black or white)'}</td>
                <td className="py-3 px-4 text-center text-heading font-medium" colSpan={2}>+{artist.pricing.framePrice}$</td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      </section>

      {/* ============ TRUST / AVANTAGES ============ */}
      <section className="section-container">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Shield, fr: 'Impression professionnelle par Massive Medias', en: 'Professional printing by Massive Medias' },
            { icon: Truck, fr: 'Pick-up gratuit Mile-End ou livraison', en: 'Free Mile-End pick-up or delivery' },
            { icon: Palette, fr: 'Soft proofing et calibration couleurs', en: 'Soft proofing and color calibration' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6"
              >
                <div className="mb-3 p-3 rounded-lg w-fit mx-auto icon-bg">
                  <Icon size={24} className="text-accent" />
                </div>
                <p className="text-grey-light text-sm">{lang === 'fr' ? item.fr : item.en}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, index) => (
            <motion.details
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="group p-5 rounded-xl bg-glass card-shadow"
            >
              <summary className="cursor-pointer text-heading font-heading font-bold text-sm list-none flex items-center justify-between">
                {item.q}
                <span className="text-accent ml-4 transition-transform group-open:rotate-45 text-lg">+</span>
              </summary>
              <p className="text-grey-light text-sm mt-3 leading-relaxed">{item.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* ============ CTA ARTISTE ============ */}
      <section className="section-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl cta-text-bordered"
        >
          <h2 className="text-3xl font-heading font-bold text-heading mb-4">
            {lang === 'fr' ? 'Tu es artiste? Rejoins la plateforme.' : 'Are you an artist? Join the platform.'}
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'On s\'occupe de tout : site web, impression pro, packaging et shipping. Tu fournis tes fichiers, tu fixes ta marge, et tu reçois ton argent.'
              : 'We handle everything: website, professional printing, packaging and shipping. You provide your files, set your margin, and get paid.'}
          </p>
          <Link to="/contact" className="btn-primary">
            <MessageSquare size={20} className="mr-2" />
            {lang === 'fr' ? 'Contactez-nous' : 'Contact us'}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>
      </section>
    </>
  );
}

export default ArtisteDetail;
