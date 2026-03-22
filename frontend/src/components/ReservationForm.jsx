import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Upload, Check, Calendar, MapPin } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function ReservationForm({ flash, tatoueur, onClose, onSuccess }) {
  const { tx } = useLang();
  const { user } = useAuth();

  const [form, setForm] = useState({
    clientName: user?.user_metadata?.full_name || '',
    clientEmail: user?.email || '',
    clientPhone: '',
    placement: flash?.bodyPlacement || '',
    size: flash?.size || '',
    requestedDate: '',
    messageDuClient: '',
    budget: flash?.priceTattoo ? `${flash.priceTattoo}$` : '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      await api.post('/reservations', {
        data: {
          ...form,
          tatoueur: tatoueur?.documentId,
          flash: flash?.documentId || null,
          supabaseUserId: user?.id || null,
          status: 'demandee',
        },
      });
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(tx({ fr: 'Erreur lors de l\'envoi. Reessaie plus tard.', en: 'Error sending. Try again later.' }));
    } finally {
      setSending(false);
    }
  };

  const flashTitle = flash ? (tx({ fr: flash.titleFr, en: flash.titleEn }) || 'Flash') : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 bg-bg-card rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-bold text-heading">
                {tx({ fr: 'Demande de reservation', en: 'Booking request' })}
              </h2>
              {flashTitle && (
                <p className="text-sm text-grey-muted mt-0.5">
                  {flashTitle} - {tatoueur?.name}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-elevated transition-colors text-grey-muted">
              <X size={20} />
            </button>
          </div>

          {sent ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-heading font-bold text-heading mb-2">
                {tx({ fr: 'Demande envoyee!', en: 'Request sent!' })}
              </h3>
              <p className="text-sm text-grey-muted mb-6">
                {tx({
                  fr: `${tatoueur?.name} recevra ta demande et te contactera pour confirmer le rendez-vous.`,
                  en: `${tatoueur?.name} will receive your request and contact you to confirm the appointment.`,
                })}
              </p>
              <button onClick={onClose} className="btn-primary">
                {tx({ fr: 'Fermer', en: 'Close' })}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Nom complet', en: 'Full name' })} *</label>
                  <input type="text" required value={form.clientName} onChange={(e) => setForm(f => ({ ...f, clientName: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-grey-light mb-1">Email *</label>
                  <input type="email" required value={form.clientEmail} onChange={(e) => setForm(f => ({ ...f, clientEmail: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
              </div>

              {/* Phone & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Telephone', en: 'Phone' })}</label>
                  <input type="tel" value={form.clientPhone} onChange={(e) => setForm(f => ({ ...f, clientPhone: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-grey-light mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    {tx({ fr: 'Date souhaitee', en: 'Preferred date' })}
                  </label>
                  <input type="date" value={form.requestedDate} onChange={(e) => setForm(f => ({ ...f, requestedDate: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
              </div>

              {/* Placement & Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-grey-light mb-1 flex items-center gap-1">
                    <MapPin size={14} />
                    {tx({ fr: 'Emplacement sur le corps', en: 'Body placement' })}
                  </label>
                  <input type="text" value={form.placement} onChange={(e) => setForm(f => ({ ...f, placement: e.target.value }))} placeholder={tx({ fr: 'ex: avant-bras droit', en: 'e.g. right forearm' })} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Budget', en: 'Budget' })}</label>
                  <input type="text" value={form.budget} onChange={(e) => setForm(f => ({ ...f, budget: e.target.value }))} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm text-grey-light mb-1">{tx({ fr: 'Message pour le tatoueur', en: 'Message for the artist' })}</label>
                <textarea value={form.messageDuClient} onChange={(e) => setForm(f => ({ ...f, messageDuClient: e.target.value }))} rows={4} placeholder={tx({ fr: 'Decris ton projet, tes inspirations...', en: 'Describe your project, your inspirations...' })} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <p className="text-xs text-grey-muted">
                {tx({
                  fr: "Ce n'est pas un booking automatique. Le tatoueur examinera ta demande et te contactera pour confirmer.",
                  en: 'This is not automatic booking. The artist will review your request and contact you to confirm.',
                })}
              </p>

              <button type="submit" disabled={sending} className="w-full btn-primary py-3 text-base font-bold flex items-center justify-center gap-2">
                <Send size={18} />
                {sending ? '...' : tx({ fr: 'Envoyer la demande', en: 'Send request' })}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
