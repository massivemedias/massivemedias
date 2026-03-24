import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Calendar, MapPin, MessageCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

const DEPOSIT_AMOUNT = 40;

export default function ReservationForm({ flash, tatoueur, onClose, onSuccess }) {
  const { tx } = useLang();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    clientName: user?.user_metadata?.full_name || '',
    clientEmail: user?.email || '',
    clientPhone: '',
    placement: flash?.bodyPlacement || '',
    requestedDate: '',
    messageDuClient: '',
  });
  const [error, setError] = useState(null);

  const flashTitle = flash ? (tx({ fr: flash.titleFr, en: flash.titleEn }) || 'Flash') : null;
  const flashImage = typeof flash?.image === 'string' ? flash.image : flash?.image?.url || '';

  const handleReserve = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.clientName || !form.clientEmail) {
      setError(tx({ fr: 'Nom et email requis', en: 'Name and email required' }));
      return;
    }

    try {
      // 1. Creer la reservation dans Strapi
      await api.post('/reservations/submit', {
        ...form,
        tatoueur: tatoueur?.documentId,
        flash: flash?.documentId || flash?.id || null,
        flashTitle: flashTitle,
        supabaseUserId: user?.id || null,
        status: 'demandee',
        budget: flash?.priceTattoo ? `${flash.priceTattoo}$` : '',
      });

      // 2. Ajouter le depot au panier
      addToCart({
        productName: `${tx({ fr: 'Depot reservation flash', en: 'Flash reservation deposit' })} - ${flashTitle}`,
        image: flashImage,
        productId: `deposit-flash-${flash?.id || Date.now()}`,
        unitPrice: DEPOSIT_AMOUNT,
        quantity: 1,
        totalPrice: DEPOSIT_AMOUNT,
        size: tx({ fr: `Tatoueur: ${tatoueur?.name}`, en: `Artist: ${tatoueur?.name}` }),
        isDeposit: true,
      });

      onSuccess?.();
      onClose?.();
      navigate('/panier');
    } catch (err) {
      setError(tx({ fr: 'Erreur lors de l\'envoi. Reessaie plus tard.', en: 'Error sending. Try again later.' }));
    }
  };

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
                {tx({ fr: 'Réserver ce flash', en: 'Reserve this flash' })}
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

          <form onSubmit={handleReserve} className="p-6 space-y-4">
            {/* Flash preview */}
            {flashImage && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-black/20">
                <img src={flashImage} alt={flashTitle} className="w-20 h-20 object-contain rounded-lg bg-white/5" />
                <div className="flex-1 min-w-0">
                  <p className="text-heading font-medium text-sm truncate">{flashTitle}</p>
                  <p className="text-grey-muted text-xs mt-0.5">
                    {tx({ fr: `Prix tatouage: ${flash?.priceTattoo}$`, en: `Tattoo price: $${flash?.priceTattoo}` })}
                  </p>
                </div>
              </div>
            )}

            {/* Booking info message */}
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 space-y-2">
              <p className="text-heading text-sm font-medium flex items-center gap-2">
                <AlertCircle size={16} className="text-accent flex-shrink-0" />
                {tx({ fr: 'Booking Flash', en: 'Flash Booking' })}
              </p>
              <p className="text-grey-light text-xs leading-relaxed">
                {tx({
                  fr: "Pour reserver un flash, merci d'indiquer l'emplacement et la taille approximative, ainsi que tes disponibilites (donne plusieurs options).",
                  en: 'To reserve a flash, please indicate the placement and approximate size, as well as your availability (give multiple options).',
                })}
              </p>
              <p className="text-accent text-xs font-semibold">
                {tx({
                  fr: `Un depot de ${DEPOSIT_AMOUNT}$ est requis dans les 48h pour completer la reservation, apres quoi le flash sera remis a la vente.`,
                  en: `A $${DEPOSIT_AMOUNT} deposit is required within 48h to complete the reservation, after which the flash will be put back on sale.`,
                })}
              </p>
            </div>

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
                  {tx({ fr: 'Tes disponibilites', en: 'Your availability' })}
                </label>
                <input type="text" value={form.requestedDate} onChange={(e) => setForm(f => ({ ...f, requestedDate: e.target.value }))} placeholder={tx({ fr: 'ex: mardi ou jeudi apres-midi', en: 'e.g. Tuesday or Thursday afternoon' })} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
              </div>
            </div>

            {/* Placement */}
            <div>
              <label className="block text-sm text-grey-light mb-1 flex items-center gap-1">
                <MapPin size={14} />
                {tx({ fr: 'Emplacement et taille approximative', en: 'Placement and approximate size' })}
              </label>
              <input type="text" value={form.placement} onChange={(e) => setForm(f => ({ ...f, placement: e.target.value }))} placeholder={tx({ fr: 'ex: avant-bras droit, environ 5 pouces', en: 'e.g. right forearm, about 5 inches' })} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none" />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm text-grey-light mb-1 flex items-center gap-1">
                <MessageCircle size={14} />
                {tx({ fr: 'Message pour le tatoueur', en: 'Message for the artist' })}
              </label>
              <textarea value={form.messageDuClient} onChange={(e) => setForm(f => ({ ...f, messageDuClient: e.target.value }))} rows={3} placeholder={tx({ fr: 'Questions, details supplementaires...', en: 'Questions, additional details...' })} className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:border-accent/50 focus:outline-none resize-none" />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Submit - depot */}
            <button type="submit" className="w-full btn-primary py-3 text-base font-bold flex items-center justify-center gap-2">
              <ShoppingCart size={18} />
              {tx({
                fr: `Reserver - Depot ${DEPOSIT_AMOUNT}$`,
                en: `Reserve - $${DEPOSIT_AMOUNT} Deposit`,
              })}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
