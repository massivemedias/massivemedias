import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../i18n/LanguageContext';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzdardoe';

function Panier() {
  const { lang } = useLang();
  const { items, removeFromCart, clearCart, cartTotal } = useCart();
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState('idle');
  const [formData, setFormData] = useState({
    nom: '', email: '', telephone: '', message: '', designReady: 'yes'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status === 'error') setStatus('idle');
  };

  const formatCartForEmail = () => {
    return items.map((item, i) =>
      `${i + 1}. ${item.productName} — ${item.finish}, ${item.shape}, ${item.size} — ${item.quantity}x @ ${item.unitPrice}$/u = ${item.totalPrice}$`
    ).join('\n');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const body = {
        ...formData,
        _subject: `Nouvelle commande — ${items.length} produit(s) — ${cartTotal}$`,
        commande: formatCartForEmail(),
        total: `${cartTotal}$`,
        designPret: formData.designReady === 'yes'
          ? (lang === 'fr' ? 'Oui, design prêt' : 'Yes, design ready')
          : (lang === 'fr' ? 'Non, besoin du service design' : 'No, need design service'),
      };
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Submission failed');
      setStatus('success');
      clearCart();
    } catch {
      setStatus('error');
    }
  };

  const isFr = lang === 'fr';

  // Success state
  if (status === 'success') {
    return (
      <>
        <Helmet><title>{isFr ? 'Commande envoyée | Massive Medias' : 'Order sent | Massive Medias'}</title></Helmet>
        <div className="section-container pt-32 max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-heading font-bold text-heading mb-4">
              {isFr ? 'Commande envoyée!' : 'Order sent!'}
            </h1>
            <p className="text-grey-light text-lg mb-8">
              {isFr
                ? 'Nous vous contacterons dans les 24 heures pour confirmer les détails et organiser le paiement.'
                : 'We\'ll contact you within 24 hours to confirm details and arrange payment.'}
            </p>
            <Link to="/boutique/stickers" className="btn-primary">
              {isFr ? 'Retour à la boutique' : 'Back to shop'}
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

  // Empty cart
  if (items.length === 0 && !showForm) {
    return (
      <>
        <Helmet><title>{isFr ? 'Panier | Massive Medias' : 'Cart | Massive Medias'}</title></Helmet>
        <div className="section-container pt-32 max-w-2xl mx-auto text-center">
          <ShoppingCart size={64} className="text-grey-muted mx-auto mb-6" />
          <h1 className="text-3xl font-heading font-bold text-heading mb-4">
            {isFr ? 'Votre panier est vide' : 'Your cart is empty'}
          </h1>
          <p className="text-grey-light mb-8">
            {isFr ? 'Ajoutez des produits pour commencer.' : 'Add products to get started.'}
          </p>
          <Link to="/boutique/stickers" className="btn-primary">
            {isFr ? 'Voir les stickers' : 'Browse stickers'}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>{isFr ? 'Panier | Massive Medias' : 'Cart | Massive Medias'}</title></Helmet>

      <div className="section-container pt-28 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-8">
          {isFr ? 'Votre panier' : 'Your cart'}
        </h1>

        {!showForm ? (
          <>
            {/* Cart items */}
            <div className="space-y-4 mb-8">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--bg-card-border)' }}
                >
                  <img src={item.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-heading">{item.productName}</h3>
                    <p className="text-grey-muted text-sm truncate">
                      {item.finish} · {item.shape} · {item.size} · {item.quantity}x
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-heading">{item.totalPrice}$</p>
                    <p className="text-grey-muted text-xs">{item.unitPrice}$/u</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(i)}
                    className="p-2 text-grey-muted hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="p-6 rounded-xl mb-8" style={{ background: 'var(--highlight-bg)', border: '1px solid var(--bg-card-border)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-heading font-semibold">{isFr ? 'Sous-total' : 'Subtotal'}</span>
                <span className="text-2xl font-heading font-bold text-heading">{cartTotal}$</span>
              </div>
              <p className="text-grey-muted text-sm">
                {isFr ? 'Taxes en sus si applicable. Livraison locale gratuite à Montréal.' : 'Taxes extra if applicable. Free local delivery in Montreal.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/boutique/stickers" className="btn-outline flex-1 justify-center">
                <ArrowLeft size={18} className="mr-2" />
                {isFr ? 'Continuer mes achats' : 'Continue shopping'}
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary flex-1 justify-center"
              >
                {isFr ? 'Passer la commande' : 'Place order'}
              </button>
            </div>
          </>
        ) : (
          /* Order form */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-grey-muted hover:text-heading transition-colors mb-6 text-sm">
              <ArrowLeft size={16} />
              {isFr ? 'Retour au panier' : 'Back to cart'}
            </button>

            {/* Order summary */}
            <div className="p-4 rounded-xl mb-8" style={{ background: 'var(--highlight-bg)', border: '1px solid var(--bg-card-border)' }}>
              <h3 className="font-semibold text-heading mb-3">{isFr ? 'Résumé de commande' : 'Order summary'}</h3>
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-grey-light">{item.productName} — {item.finish}, {item.shape}, {item.size} × {item.quantity}</span>
                  <span className="text-heading font-medium">{item.totalPrice}$</span>
                </div>
              ))}
              <div className="flex justify-between border-t mt-3 pt-3" style={{ borderColor: 'var(--bg-card-border)' }}>
                <span className="font-bold text-heading">{isFr ? 'Total' : 'Total'}</span>
                <span className="font-bold text-heading text-lg">{cartTotal}$</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="nom" className="block text-heading font-semibold text-sm mb-2">
                    {isFr ? 'Nom complet' : 'Full name'} *
                  </label>
                  <input
                    type="text" id="nom" name="nom" required
                    value={formData.nom} onChange={handleChange}
                    placeholder={isFr ? 'Votre nom' : 'Your name'}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-heading font-semibold text-sm mb-2">
                    {isFr ? 'Courriel' : 'Email'} *
                  </label>
                  <input
                    type="email" id="email" name="email" required
                    value={formData.email} onChange={handleChange}
                    placeholder={isFr ? 'votre@email.com' : 'your@email.com'}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telephone" className="block text-heading font-semibold text-sm mb-2">
                  {isFr ? 'Téléphone' : 'Phone'}
                </label>
                <input
                  type="tel" id="telephone" name="telephone"
                  value={formData.telephone} onChange={handleChange}
                  placeholder={isFr ? '514-xxx-xxxx' : '514-xxx-xxxx'}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-heading font-semibold text-sm mb-2">
                  {isFr ? 'Avez-vous votre design prêt?' : 'Do you have your design ready?'}
                </label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${formData.designReady === 'yes' ? 'bg-magenta text-white' : 'text-heading'}`} style={formData.designReady !== 'yes' ? { background: 'var(--bg-glass)', border: '1px solid var(--bg-card-border)' } : undefined}>
                    <input type="radio" name="designReady" value="yes" checked={formData.designReady === 'yes'} onChange={handleChange} className="hidden" />
                    {isFr ? 'Oui, j\'ai mon design' : 'Yes, I have my design'}
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${formData.designReady === 'no' ? 'bg-magenta text-white' : 'text-heading'}`} style={formData.designReady !== 'no' ? { background: 'var(--bg-glass)', border: '1px solid var(--bg-card-border)' } : undefined}>
                    <input type="radio" name="designReady" value="no" checked={formData.designReady === 'no'} onChange={handleChange} className="hidden" />
                    {isFr ? 'Non, j\'ai besoin du design' : 'No, I need design help'}
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-heading font-semibold text-sm mb-2">
                  {isFr ? 'Instructions ou détails' : 'Instructions or details'}
                </label>
                <textarea
                  id="message" name="message"
                  value={formData.message} onChange={handleChange}
                  rows={4}
                  placeholder={isFr ? 'Décrivez votre projet, précisez les couleurs, le texte, etc.' : 'Describe your project, specify colors, text, etc.'}
                  className="input-field resize-none"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">
                    {isFr ? 'Erreur lors de l\'envoi. Réessayez ou écrivez à ' : 'Error sending. Try again or email '}
                    <a href="mailto:massivemedias@gmail.com" className="underline">massivemedias@gmail.com</a>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn-primary w-full justify-center text-base py-3.5 disabled:opacity-50"
              >
                {status === 'sending' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isFr ? 'Envoi en cours...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    {isFr ? 'Envoyer la commande' : 'Send order'}
                  </>
                )}
              </button>

              <p className="text-grey-muted text-xs text-center">
                {isFr
                  ? 'Nous vous contacterons dans les 24h pour confirmer et organiser le paiement.'
                  : 'We\'ll contact you within 24h to confirm and arrange payment.'}
              </p>
            </form>
          </motion.div>
        )}
      </div>
    </>
  );
}

export default Panier;
