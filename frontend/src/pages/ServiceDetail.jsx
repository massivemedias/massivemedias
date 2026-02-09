import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Wrench, Users } from 'lucide-react';
import { useState } from 'react';
import servicesData from '../data/services';

function ServiceDetail() {
  const { slug } = useParams();
  const service = servicesData[slug];
  const [lightboxImage, setLightboxImage] = useState(null);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const Icon = service.icon;

  // Obtenir services adjacents pour navigation
  const slugs = Object.keys(servicesData);
  const currentIndex = slugs.indexOf(slug);
  const prevService = currentIndex > 0 ? servicesData[slugs[currentIndex - 1]] : null;
  const nextService = currentIndex < slugs.length - 1 ? servicesData[slugs[currentIndex + 1]] : null;

  return (
    <>
      <Helmet>
        <title>{service.seo.title}</title>
        <meta name="description" content={service.seo.description} />
      </Helmet>

      {/* ============ HERO ============ */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <img src={service.heroImage} alt={service.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.85) 0%, rgba(26,0,51,0.95) 100%)' }}></div>
        </div>

        <div className="relative z-10 section-container !py-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-sm">
              <Link to="/services" className="text-grey-muted hover:text-magenta transition-colors">Services</Link>
              <span className="text-grey-muted">/</span>
              <span className="text-magenta">{service.title}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 82, 160, 0.15)', backdropFilter: 'blur(10px)' }}>
                <Icon size={36} className="text-magenta" />
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-heading font-bold text-white">
                  {service.title}
                </h1>
              </div>
            </div>

            <p className="text-xl md:text-2xl text-grey-light mb-8">
              {service.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact" className="btn-primary">
                Demander une soumission
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <a href="#tarifs" className="btn-outline">
                Voir les tarifs
              </a>
            </div>
          </motion.div>
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
              Le service
            </h2>
            {service.description.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-grey-light text-lg leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="p-8 rounded-2xl border border-purple-main/30" style={{ background: 'linear-gradient(145deg, rgba(49,0,81,0.4), rgba(70,1,94,0.3))' }}>
            <h3 className="text-xl font-heading font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle size={22} className="text-magenta" />
              Points forts
            </h3>
            <ul className="space-y-4">
              {service.highlights.map((highlight, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-magenta mt-2 flex-shrink-0"></div>
                  <span className="text-grey-light">{highlight}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* ============ GALERIE ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
            Exemples de réalisations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {service.gallery.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group relative rounded-xl overflow-hidden cursor-pointer"
                style={{ aspectRatio: '1' }}
                onClick={() => setLightboxImage(image)}
              >
                <img
                  src={image}
                  alt={`${service.title} - exemple ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ============ PROCESSUS ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-heading font-bold text-gradient mb-10 text-center">
            Notre processus
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.process.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border border-purple-main/30 relative"
                style={{ background: 'rgba(49, 0, 81, 0.3)' }}
              >
                <div className="absolute -top-3 -left-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #A348FE, #FF52A0)' }}>
                  {item.step}
                </div>
                <h3 className="text-white font-heading font-bold text-lg mt-2 mb-2">
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
            {service.pricing.title}
          </h2>
          <p className="text-grey-muted text-center mb-8">{service.pricing.note}</p>

          {/* Si le service a un seul tableau de prix */}
          {service.pricing.headers && (
            <div className="rounded-xl overflow-hidden border border-purple-main/30 max-w-4xl mx-auto">
              <table className="price-table">
                <thead>
                  <tr>
                    {service.pricing.headers.map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {service.pricing.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={j === 0 ? 'text-white font-semibold' : j === 1 ? 'text-gradient font-bold' : 'text-grey-muted'}
                        >
                          {/* Si c'est la colonne "Réf. Etsy", barrer le texte */}
                          {service.pricing.headers[j]?.includes('Réf') && cell !== '—' ? (
                            <span className="line-through">{cell}</span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Si le service a plusieurs tableaux (comme stickers) */}
          {service.pricing.tables && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {service.pricing.tables.map((table, tableIndex) => (
                <div key={tableIndex} className="rounded-xl overflow-hidden border border-purple-main/30">
                  <div className="p-4 border-b border-purple-main/30" style={{ background: 'rgba(49, 0, 81, 0.5)' }}>
                    <h3 className="text-white font-heading font-bold">{table.subtitle}</h3>
                  </div>
                  <table className="price-table">
                    <thead>
                      <tr>
                        {table.headers.map((header, i) => (
                          <th key={i}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className={j === 0 ? 'text-white font-semibold' : j === 1 ? 'text-gradient font-bold' : 'text-grey-muted'}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ============ ÉQUIPEMENT ============ */}
        {service.equipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center flex items-center justify-center gap-3">
              <Wrench size={28} className="text-magenta" />
              Équipement utilisé
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {service.equipment.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl border border-purple-main/30 text-center"
                  style={{ background: 'rgba(49, 0, 81, 0.3)' }}
                >
                  <h4 className="text-white font-heading font-bold mb-2">{item.name}</h4>
                  <p className="text-grey-muted text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ TECHNOLOGIES (pour web seulement) ============ */}
        {service.technologies && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center">
              Technologies maîtrisées
            </h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {service.technologies.map((tech, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-white border border-purple-main/50"
                  style={{ background: 'rgba(49, 0, 81, 0.5)' }}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ ÉQUIPE DESIGN (pour design graphique seulement) ============ */}
        {service.team && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-gradient mb-8 text-center flex items-center justify-center gap-3">
              <Users size={28} className="text-magenta" />
              L'équipe design
            </h2>
            <div className="max-w-2xl mx-auto p-8 rounded-2xl border border-purple-main/30 text-center" style={{ background: 'linear-gradient(145deg, rgba(49,0,81,0.4), rgba(70,1,94,0.3))' }}>
              <h3 className="text-2xl font-heading font-bold text-white mb-1">{service.team.name}</h3>
              <p className="text-magenta font-semibold mb-4">{service.team.role}</p>
              <p className="text-grey-light leading-relaxed mb-4">{service.team.bio}</p>
              <p className="text-grey-muted text-sm">
                <strong className="text-grey-light">Portfolio :</strong> {service.team.portfolio}
              </p>
            </div>
          </motion.div>
        )}

        {/* ============ CTA ============ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20 p-12 rounded-2xl text-center border border-magenta/30"
          style={{ background: 'linear-gradient(145deg, rgba(49,0,81,0.6), rgba(70,1,94,0.4))' }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Prêt à commander?
          </h2>
          <p className="text-grey-light text-lg mb-8 max-w-2xl mx-auto">
            Envoie-nous les détails de ton projet. Soumission gratuite dans les 24h.
          </p>
          <Link to="/contact" className="btn-primary">
            Demander une soumission
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </motion.div>

        {/* ============ NAVIGATION SERVICES ============ */}
        <div className="flex justify-between items-center py-8 border-t border-purple-main/30">
          {prevService ? (
            <Link
              to={`/services/${prevService.slug}`}
              className="flex items-center gap-3 text-grey-light hover:text-magenta transition-colors group"
            >
              <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
              <div>
                <div className="text-xs text-grey-muted">Précédent</div>
                <div className="font-heading font-bold">{prevService.title}</div>
              </div>
            </Link>
          ) : <div />}

          {nextService ? (
            <Link
              to={`/services/${nextService.slug}`}
              className="flex items-center gap-3 text-grey-light hover:text-magenta transition-colors text-right group"
            >
              <div>
                <div className="text-xs text-grey-muted">Suivant</div>
                <div className="font-heading font-bold">{nextService.title}</div>
              </div>
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          ) : <div />}
        </div>
      </div>

      {/* ============ LIGHTBOX ============ */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-pointer"
            style={{ background: 'rgba(0, 0, 0, 0.95)' }}
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt={service.title}
                className="w-full h-full object-contain rounded-lg"
              />
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-bold transition-colors w-10 h-10 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                &times;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ServiceDetail;
