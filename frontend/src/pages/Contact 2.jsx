import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    entreprise: '',
    service: '',
    budget: '',
    urgence: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Intégrer avec Strapi
    console.log('Form submitted:', formData);
    alert('Merci! On a bien reçu ta demande. On te revient dans les 24 heures.');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <Helmet>
        <title>Contact — Massive Medias</title>
        <meta name="description" content="Demande de soumission et contact. On te revient dans les 24h." />
      </Helmet>

      <section className="section-container pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
            Contact
          </h1>
          <p className="text-xl text-grey-light">
            Un projet en tête? Une question sur nos services? Envoie-nous un message et on te revient rapidement.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Coordonnées */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h3 className="font-heading text-2xl font-bold text-white mb-6">
                Coordonnées
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-magenta mt-1" size={20} />
                  <div>
                    <p className="text-white font-semibold">Mile-End, Montréal, QC</p>
                    <p className="text-grey-muted text-sm">Sur rendez-vous</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="text-magenta mt-1" size={20} />
                  <a 
                    href="mailto:info@massivemedias.com"
                    className="text-white hover:text-magenta transition-colors"
                  >
                    info@massivemedias.com
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold text-white mb-4">
                Réseaux sociaux
              </h3>
              <div className="flex gap-4">
                <a 
                  href="https://instagram.com/massivemedias" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-full bg-purple-main hover:bg-magenta transition-all duration-300 hover:shadow-glow"
                >
                  <Instagram size={24} />
                </a>
                <a 
                  href="https://facebook.com/massivemedias" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-full bg-purple-main hover:bg-magenta transition-all duration-300 hover:shadow-glow"
                >
                  <Facebook size={24} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Formulaire */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nom" className="block text-white font-semibold mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    required
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Ton nom"
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-white font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ton@email.com"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="telephone" className="block text-white font-semibold mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    placeholder="514-xxx-xxxx"
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="entreprise" className="block text-white font-semibold mb-2">
                    Entreprise / Projet
                  </label>
                  <input
                    type="text"
                    id="entreprise"
                    name="entreprise"
                    value={formData.entreprise}
                    onChange={handleChange}
                    placeholder="Nom de ton entreprise ou projet"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="service" className="block text-white font-semibold mb-2">
                    Service
                  </label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Sélectionne...</option>
                    <option value="fine-art">Impression Fine Art</option>
                    <option value="stickers">Stickers Custom</option>
                    <option value="sublimation">Sublimation & Merch</option>
                    <option value="flyers">Flyers & Cartes</option>
                    <option value="design">Design Graphique</option>
                    <option value="web">Développement Web</option>
                    <option value="package">Package complet</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="budget" className="block text-white font-semibold mb-2">
                    Budget estimé
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Sélectionne...</option>
                    <option value="moins-500">Moins de 500$</option>
                    <option value="500-1000">500$ - 1 000$</option>
                    <option value="1000-3000">1 000$ - 3 000$</option>
                    <option value="3000-plus">3 000$+</option>
                    <option value="pas-sure">Je ne sais pas encore</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="urgence" className="block text-white font-semibold mb-2">
                    Urgence
                  </label>
                  <select
                    id="urgence"
                    name="urgence"
                    value={formData.urgence}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Sélectionne...</option>
                    <option value="standard">Standard (5-7 jours)</option>
                    <option value="rush">Rush (24-48h)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-white font-semibold mb-2">
                  Décris ton projet *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Dis-nous ce que tu as en tête..."
                  className="input-field resize-none"
                />
              </div>

              <button type="submit" className="btn-primary w-full md:w-auto">
                Envoyer ma demande
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Contact;
