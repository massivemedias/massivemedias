import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Send, CheckCircle, Heart, AlertCircle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';
import SEO from '../components/SEO';

function Temoignage() {
  const { lang, tx } = useLang();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Si pas de token, afficher une page generique
  if (!token) {
    return (
      <>
        <SEO
          title={tx({ fr: 'Temoignage', en: 'Testimonial', es: 'Testimonio' })}
          description={tx({ fr: 'Partagez votre experience avec Massive Medias', en: 'Share your experience with Massive Medias', es: 'Comparta su experiencia con Massive Medias' })}
        />
        <div className="section-container pt-32 pb-20 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto text-center"
          >
            <AlertCircle size={48} className="text-grey-muted mx-auto mb-4" />
            <h1 className="text-3xl font-heading font-bold text-heading mb-4">
              {tx({ fr: 'Lien invalide', en: 'Invalid link', es: 'Enlace invalido' })}
            </h1>
            <p className="text-grey-muted mb-6">
              {tx({
                fr: 'Ce lien de temoignage est invalide ou a expire. Si vous avez recu un email de notre part, verifiez le lien.',
                en: 'This testimonial link is invalid or expired. If you received an email from us, please check the link.',
                es: 'Este enlace de testimonio es invalido o ha expirado. Si recibio un correo nuestro, verifique el enlace.',
              })}
            </p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              {tx({ fr: 'Retour a l\'accueil', en: 'Back to home', es: 'Volver al inicio' })}
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

  // Page soumission reussie
  if (submitted) {
    return (
      <>
        <SEO title={tx({ fr: 'Merci!', en: 'Thank you!', es: 'Gracias!' })} />
        <div className="section-container pt-32 pb-20 min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Heart size={64} className="text-accent mx-auto mb-6" fill="currentColor" />
            </motion.div>
            <h1 className="text-4xl font-heading font-bold text-heading mb-4">
              {tx({ fr: 'Merci beaucoup!', en: 'Thank you so much!', es: 'Muchas gracias!' })}
            </h1>
            <p className="text-grey-muted text-lg mb-2">
              {tx({
                fr: 'Votre temoignage compte enormement pour nous.',
                en: 'Your testimonial means a lot to us.',
                es: 'Su testimonio significa mucho para nosotros.',
              })}
            </p>
            <p className="text-grey-muted mb-8">
              {tx({
                fr: 'Il sera affiche sur notre site apres verification.',
                en: 'It will be displayed on our website after review.',
                es: 'Se mostrara en nuestro sitio web despues de la revision.',
              })}
            </p>

            <div className="flex items-center justify-center gap-1 mb-8">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={28} className={s <= rating ? 'text-yellow-400' : 'text-grey-muted/30'} fill={s <= rating ? 'currentColor' : 'none'} />
              ))}
            </div>

            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              {tx({ fr: 'Retour a l\'accueil', en: 'Back to home', es: 'Volver al inicio' })}
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      await api.post('/testimonials/submit', {
        token,
        textFr: text,
        rating,
        name: name || undefined,
        role: role || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error;
      if (msg?.includes('deja ete soumis') || msg?.includes('already')) {
        setError(tx({
          fr: 'Ce temoignage a deja ete soumis. Merci!',
          en: 'This testimonial has already been submitted. Thank you!',
          es: 'Este testimonio ya fue enviado. Gracias!',
        }));
      } else if (msg?.includes('invalide') || msg?.includes('invalid') || err.response?.status === 404) {
        setError(tx({
          fr: 'Ce lien est invalide ou a expire.',
          en: 'This link is invalid or expired.',
          es: 'Este enlace es invalido o ha expirado.',
        }));
      } else {
        setError(tx({
          fr: 'Une erreur est survenue. Veuillez reessayer.',
          en: 'An error occurred. Please try again.',
          es: 'Ocurrio un error. Intente de nuevo.',
        }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title={tx({ fr: 'Votre avis - Massive Medias', en: 'Your review - Massive Medias', es: 'Su opinion - Massive Medias' })}
        description={tx({ fr: 'Partagez votre experience avec Massive Medias', en: 'Share your experience with Massive Medias', es: 'Comparta su experiencia con Massive Medias' })}
      />

      <div className="section-container pt-32 pb-20 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-4">
              {tx({
                fr: 'Votre avis compte',
                en: 'Your opinion matters',
                es: 'Su opinion importa',
              })}
            </h1>
            <p className="text-grey-muted text-lg">
              {tx({
                fr: 'Prenez un moment pour partager votre experience avec Massive Medias. Votre temoignage aide d\'autres clients a nous decouvrir.',
                en: 'Take a moment to share your experience with Massive Medias. Your testimonial helps other customers discover us.',
                es: 'Tome un momento para compartir su experiencia con Massive Medias. Su testimonio ayuda a otros clientes a descubrirnos.',
              })}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Rating */}
            <div className="text-center">
              <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-3">
                {tx({ fr: 'Votre note', en: 'Your rating', es: 'Su calificacion' })}
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={36}
                      className={`transition-colors ${
                        s <= (hoverRating || rating) ? 'text-yellow-400' : 'text-grey-muted/30'
                      }`}
                      fill={s <= (hoverRating || rating) ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Temoignage */}
            <div>
              <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2">
                {tx({ fr: 'Votre temoignage', en: 'Your testimonial', es: 'Su testimonio' })} *
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                required
                placeholder={tx({
                  fr: 'Racontez votre experience: le service recu, la qualite, ce que vous avez le plus apprecie...',
                  en: 'Tell us about your experience: the service received, the quality, what you appreciated most...',
                  es: 'Cuentenos su experiencia: el servicio recibido, la calidad, lo que mas aprecio...',
                })}
                className="w-full rounded-xl border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Nom et role (optionnel) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2">
                  {tx({ fr: 'Votre nom (optionnel)', en: 'Your name (optional)', es: 'Su nombre (opcional)' })}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tx({ fr: 'Ex: Marie D.', en: 'E.g.: Marie D.', es: 'Ej: Marie D.' })}
                  className="w-full rounded-xl border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors"
                />
                <p className="text-grey-muted text-xs mt-1">
                  {tx({
                    fr: 'Laissez vide pour garder le nom de votre compte',
                    en: 'Leave empty to keep your account name',
                    es: 'Deje vacio para mantener el nombre de su cuenta',
                  })}
                </p>
              </div>
              <div>
                <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2">
                  {tx({ fr: 'Votre titre (optionnel)', en: 'Your title (optional)', es: 'Su titulo (opcional)' })}
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={tx({ fr: 'Ex: Photographe, Musicien...', en: 'E.g.: Photographer, Musician...', es: 'Ej: Fotografo, Musico...' })}
                  className="w-full rounded-xl border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="btn-primary w-full justify-center text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {tx({ fr: 'Envoi en cours...', en: 'Sending...', es: 'Enviando...' })}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send size={18} />
                  {tx({ fr: 'Envoyer mon temoignage', en: 'Send my testimonial', es: 'Enviar mi testimonio' })}
                </span>
              )}
            </button>

            <p className="text-grey-muted text-xs text-center">
              {tx({
                fr: 'Votre temoignage pourra etre affiche sur notre site web. Nous nous reservons le droit de moderer le contenu.',
                en: 'Your testimonial may be displayed on our website. We reserve the right to moderate content.',
                es: 'Su testimonio podra mostrarse en nuestro sitio web. Nos reservamos el derecho de moderar el contenido.',
              })}
            </p>
          </form>
        </motion.div>
      </div>
    </>
  );
}

export default Temoignage;
