/**
 * QuoteForm (3 mai 2026) - Formulaire de soumission inline pour les pages
 * services. Utilise dans ServiceDetail.jsx pour les services qui n'ont pas
 * de configurateur d'achat direct (ex: web, design sur mesure).
 *
 * POST vers /contact-submissions/submit (meme endpoint que la page Contact).
 * Le champ `service` est pre-rempli pour que l'admin sache d'ou vient la
 * demande.
 *
 * Props:
 *   id?: string (default 'quote-form') - id HTML pour anchor link / scroll
 *   service?: string - slug du service (ex: 'web') pre-rempli dans le payload
 *   title?: { fr, en, es } - titre h2 du bloc
 *   subtitle?: { fr, en, es } - texte d'introduction
 */
import { useState, useRef } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

function QuoteForm({
  id = 'quote-form',
  service = 'web',
  title,
  subtitle,
}) {
  const { tx } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errorMsg, setErrorMsg] = useState('');
  const submittingRef = useRef(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (submittingRef.current) return;
    setStatus(null);
    setErrorMsg('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setStatus('error');
      setErrorMsg(tx({
        fr: 'Tous les champs requis (nom, courriel, message) doivent etre remplis.',
        en: 'All required fields (name, email, message) must be filled.',
        es: 'Todos los campos requeridos deben estar completos.',
      }));
      return;
    }
    if (!trimmedEmail.includes('@')) {
      setStatus('error');
      setErrorMsg(tx({ fr: 'Adresse courriel invalide.', en: 'Invalid email.', es: 'Email invalido.' }));
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await api.post('/contact-submissions/submit', {
        name: trimmedName,
        email: trimmedEmail.toLowerCase(),
        phone: phone.trim() || null,
        message: trimmedMessage,
        service,
        source: `quote-form-${service}`,
      });
      setStatus('success');
      setName(''); setEmail(''); setPhone(''); setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err?.response?.data?.error?.message
        || err?.message
        || tx({ fr: 'Erreur d\'envoi, reessaie plus tard.', en: 'Send failed, try again later.', es: 'Error al enviar.' })
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section id={id} className="scroll-mt-24 py-12 sm:py-16 bg-glass/30 border-y border-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-heading mb-3">
            {tx(title || { fr: 'Demander une soumission', en: 'Request a quote', es: 'Solicitar cotización' })}
          </h2>
          <p className="text-grey-muted text-base">
            {tx(subtitle || {
              fr: 'Parle-nous de ton projet, on te répond dans les 24h.',
              en: 'Tell us about your project, we reply within 24h.',
              es: 'Cuéntanos tu proyecto, respondemos en 24h.',
            })}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-grey-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                {tx({ fr: 'Nom *', en: 'Name *', es: 'Nombre *' })}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={submitting}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-grey-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                {tx({ fr: 'Courriel *', en: 'Email *', es: 'Email *' })}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-grey-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Téléphone (optionnel)', en: 'Phone (optional)', es: 'Teléfono (opcional)' })}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={submitting}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-grey-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
              {tx({ fr: 'Décris ton projet *', en: 'Describe your project *', es: 'Describe tu proyecto *' })}
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={submitting}
              rows={6}
              placeholder={tx({
                fr: 'Type de site, fonctionnalités souhaitées, références visuelles, budget approximatif...',
                en: 'Site type, desired features, visual references, approximate budget...',
                es: 'Tipo de sitio, funciones deseadas, referencias visuales, presupuesto...',
              })}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-heading text-sm focus:outline-none focus:border-accent disabled:opacity-50 resize-none"
            />
          </div>

          {status === 'success' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                {tx({
                  fr: 'Demande envoyée ! On te répond dans les 24h.',
                  en: 'Request sent! We reply within 24h.',
                  es: '¡Solicitud enviada! Respondemos en 24h.',
                })}
              </span>
            </div>
          )}

          {status === 'error' && errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting
                ? tx({ fr: 'Envoi...', en: 'Sending...', es: 'Enviando...' })
                : tx({ fr: 'Envoyer la demande', en: 'Send request', es: 'Enviar solicitud' })}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default QuoteForm;
