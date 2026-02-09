import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Printer, Sticker, Palette, Code, Shirt, FileText, Package } from 'lucide-react';
import { img, thumb } from '../utils/paths';

function Tarifs() {
  return (
    <>
      <Helmet>
        <title>Tarifs — Massive Medias</title>
        <meta name="description" content="Grille tarifaire complète : impressions fine art, stickers, design graphique, développement web et packages combinés." />
      </Helmet>

      {/* Hero */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={thumb('/images/prints/Prints6.jpeg')} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(45,0,89,0.88) 0%, rgba(58,0,112,0.95) 100%)' }}></div>
        </div>
        <div className="relative z-10 section-container !py-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
              Tarifs
            </h1>
            <p className="text-xl md:text-2xl text-grey-light max-w-3xl mx-auto">
              Prix transparents, qualité premium. 15-20% sous la concurrence en ligne.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="section-container max-w-6xl mx-auto">

        {/* Impressions Fine Art */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(163, 72, 254, 0.12)' }}>
              <Printer size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white">Impressions Fine Art</h2>
          </div>
          <p className="text-grey-light mb-6">Canon imagePROGRAF PRO-1000 · Papiers Hahnemühle, Ilford, Canon · Qualité galerie</p>

          <div className="rounded-xl overflow-hidden border border-purple-main/30">
            <table className="price-table">
              <thead>
                <tr>
                  <th>Format</th>
                  <th>Sans cadre</th>
                  <th>Avec cadre noir</th>
                  <th className="text-grey-muted">Réf. Etsy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-white font-semibold">A4 (8×10")</td>
                  <td className="text-gradient font-bold">45$</td>
                  <td>75$</td>
                  <td className="text-grey-muted line-through">59$ + shipping</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">A3 (12×18")</td>
                  <td className="text-gradient font-bold">55$</td>
                  <td>95$</td>
                  <td className="text-grey-muted line-through">76$ + shipping</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">A3+ (13×19")</td>
                  <td className="text-gradient font-bold">65$</td>
                  <td>110$</td>
                  <td className="text-grey-muted">—</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">A2 (18×24")</td>
                  <td className="text-gradient font-bold">95$</td>
                  <td>150$</td>
                  <td className="text-grey-muted line-through">132$ + shipping</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">24×36"</td>
                  <td className="text-gradient font-bold">150$</td>
                  <td>Sur demande</td>
                  <td className="text-grey-muted line-through">189$ + shipping</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-grey-muted text-sm mt-3 italic">Pick-up gratuit Mile-End · Livraison locale disponible</p>
        </motion.div>

        {/* Stickers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(163, 72, 254, 0.12)' }}>
              <Sticker size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white">Stickers personnalisés</h2>
          </div>
          <p className="text-grey-light mb-6">Silhouette Cameo 5 · Vinyle matte, glossy, transparent, holographique · Création graphique incluse</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl overflow-hidden border border-purple-main/30">
              <div className="p-4 border-b border-purple-main/30" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <h3 className="text-white font-heading font-bold">Stickers ronds 2,5" holographiques</h3>
              </div>
              <table className="price-table">
                <thead>
                  <tr>
                    <th>Quantité</th>
                    <th>Prix</th>
                    <th>Prix/unité</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-white">50</td>
                    <td className="text-gradient font-bold">50$</td>
                    <td className="text-grey-muted">1,00$/u</td>
                  </tr>
                  <tr>
                    <td className="text-white">100</td>
                    <td className="text-gradient font-bold">85$</td>
                    <td className="text-grey-muted">0,85$/u</td>
                  </tr>
                  <tr>
                    <td className="text-white">150</td>
                    <td className="text-gradient font-bold">110$</td>
                    <td className="text-grey-muted">0,73$/u</td>
                  </tr>
                  <tr>
                    <td className="text-white">250</td>
                    <td className="text-gradient font-bold">175$</td>
                    <td className="text-grey-muted">0,70$/u</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-xl overflow-hidden border border-purple-main/30">
              <div className="p-4 border-b border-purple-main/30" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <h3 className="text-white font-heading font-bold">Stickers A4 custom découpés</h3>
              </div>
              <table className="price-table">
                <thead>
                  <tr>
                    <th>Quantité</th>
                    <th>Prix</th>
                    <th>Prix/feuille</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-white">10 feuilles</td>
                    <td className="text-gradient font-bold">70$</td>
                    <td className="text-grey-muted">7,00$/f</td>
                  </tr>
                  <tr>
                    <td className="text-white">25 feuilles</td>
                    <td className="text-gradient font-bold">150$</td>
                    <td className="text-grey-muted">6,00$/f</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Design Graphique */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(163, 72, 254, 0.12)' }}>
              <Palette size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white">Design Graphique</h2>
          </div>
          <p className="text-grey-light mb-6">Suite Adobe Creative Cloud · Photoshop, Illustrator, InDesign, Lightroom</p>

          <div className="rounded-xl overflow-hidden border border-purple-main/30">
            <table className="price-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Prix</th>
                  <th>Délai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-white font-semibold">Création logo</td>
                  <td className="text-gradient font-bold">300$ – 600$</td>
                  <td className="text-grey-muted">5-10 jours</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">Identité visuelle complète</td>
                  <td className="text-gradient font-bold">800$ – 1 500$</td>
                  <td className="text-grey-muted">2-3 semaines</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">Affiche / flyer événement</td>
                  <td className="text-gradient font-bold">150$ – 300$</td>
                  <td className="text-grey-muted">3-5 jours</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">Pochette album / single</td>
                  <td className="text-gradient font-bold">200$ – 400$</td>
                  <td className="text-grey-muted">5-7 jours</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">Retouche photo (par image)</td>
                  <td className="text-gradient font-bold">15$ – 50$</td>
                  <td className="text-grey-muted">24-48h</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">Design stickers</td>
                  <td className="text-gradient font-bold">Inclus</td>
                  <td className="text-grey-muted">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Développement Web */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(163, 72, 254, 0.12)' }}>
              <Code size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white">Développement Web</h2>
          </div>
          <p className="text-grey-light mb-6">React, CMS headless, WordPress, Shopify · Sites performants, sécurisés, optimisés SEO</p>

          <div className="rounded-xl overflow-hidden border border-purple-main/30">
            <table className="price-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Prix</th>
                  <th>Inclus</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-white font-semibold">Landing page événement</td>
                  <td className="text-gradient font-bold">800$ – 1 200$</td>
                  <td className="text-grey-muted">Design, responsive, formulaire, hébergement 1 an</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">Site vitrine artiste (5-10 pages)</td>
                  <td className="text-gradient font-bold">2 000$ – 3 500$</td>
                  <td className="text-grey-muted">Portfolio, bio, contact, réseaux sociaux</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">Site e-commerce simple</td>
                  <td className="text-gradient font-bold">4 000$ – 6 000$</td>
                  <td className="text-grey-muted">Boutique, paiement, gestion stocks</td>
                </tr>
                <tr>
                  <td className="text-white font-semibold">Maintenance mensuelle</td>
                  <td className="text-gradient font-bold">100$ – 200$/mois</td>
                  <td className="text-grey-muted">Mises à jour, sécurité, modifications mineures</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(163, 72, 254, 0.12)' }}>
              <Package size={28} className="text-magenta" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white">Packages combinés</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Package Lancement Artiste */}
            <div className="rounded-2xl overflow-hidden border-2 border-magenta/40" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
              <div className="p-2">
                <img src={thumb('/images/prints/Prints3.jpeg')} alt="Package Lancement" className="w-full h-40 object-cover rounded-xl" />
              </div>
              <div className="p-8">
                <div className="text-magenta text-xs font-semibold uppercase tracking-wider mb-2">Le plus populaire</div>
                <h3 className="text-2xl font-heading font-bold text-white mb-1">Package Lancement Artiste</h3>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl font-heading font-bold text-gradient">2 800$</span>
                  <span className="text-grey-muted line-through text-sm">4 660$</span>
                  <span className="text-magenta text-sm font-semibold">-40%</span>
                </div>
                <ul className="space-y-2 text-grey-light text-sm mb-6">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>25 prints A3+</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>100 stickers promotionnels</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>10 affiches A2</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>Site vitrine 5 pages</li>
                </ul>
                <Link to="/contact" className="btn-primary w-full text-center">Demander ce package</Link>
              </div>
            </div>

            {/* Package Événement */}
            <div className="rounded-2xl overflow-hidden border border-purple-main/30" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
              <div className="p-2">
                <img src={thumb('/images/stickers/Stickers3.jpeg')} alt="Package Événement" className="w-full h-40 object-cover rounded-xl" />
              </div>
              <div className="p-8">
                <div className="text-electric-purple text-xs font-semibold uppercase tracking-wider mb-2">Événements</div>
                <h3 className="text-2xl font-heading font-bold text-white mb-1">Package Événement</h3>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl font-heading font-bold text-gradient">900$</span>
                  <span className="text-grey-muted line-through text-sm">1 410$</span>
                  <span className="text-magenta text-sm font-semibold">-36%</span>
                </div>
                <ul className="space-y-2 text-grey-light text-sm mb-6">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>150 flyers 8,5×11"</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>25 affiches 11×17"</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>200 stickers 2,5" holographiques</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-magenta"></div>Landing page événement</li>
                </ul>
                <Link to="/contact" className="btn-primary w-full text-center">Demander ce package</Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-2xl border border-purple-main/30"
          style={{ background: 'linear-gradient(145deg, rgba(49,0,81,0.5), rgba(70,1,94,0.3))' }}
        >
          <h2 className="text-3xl font-heading font-bold text-white mb-4">
            Besoin d'un devis personnalisé?
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            Chaque projet est unique. Envoie-nous les détails et on te revient avec une soumission dans les 24h.
          </p>
          <Link to="/contact" className="btn-primary">
            Demander une soumission
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>

      </div>
    </>
  );
}

export default Tarifs;
