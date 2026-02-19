import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, AlertCircle } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { stripePromise } from '../lib/stripe';
import { createPaymentIntent } from '../services/orderService';
import CheckoutForm from '../components/CheckoutForm';

function Checkout() {
  const { t, lang } = useLang();
  const { items, cartTotal } = useCart();
  const { user } = useAuth();
  const isFr = lang === 'fr';

  const [step, setStep] = useState('info'); // 'info' | 'payment'
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nom: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    telephone: '',
    designReady: 'yes',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { clientSecret: secret } = await createPaymentIntent({
        items,
        customerEmail: formData.email,
        customerName: formData.nom,
        customerPhone: formData.telephone,
        designReady: formData.designReady === 'yes',
        notes: formData.message,
        supabaseUserId: user?.id || '',
      });

      setClientSecret(secret);
      setStep('payment');
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.message ||
        (isFr ? 'Erreur lors de la création du paiement.' : 'Error creating payment.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Empty cart
  if (items.length === 0 && step === 'info') {
    return (
      <section className="section-container pt-32 pb-20 text-center">
        <h1 className="text-3xl font-heading font-bold text-heading mb-4">{t('checkout.title')}</h1>
        <p className="text-grey-muted mb-6">{t('checkout.emptyCart')}</p>
        <Link to="/boutique" className="btn-primary">{t('checkout.continueShopping')}</Link>
      </section>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('checkout.title')} - Massive Medias</title>
      </Helmet>

      <section className="section-container pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/panier" className="inline-flex items-center gap-2 text-grey-muted hover:text-magenta transition-colors mb-6 text-sm">
              <ArrowLeft size={16} />
              {t('checkout.backToCart')}
            </Link>

            <h1 className="text-4xl font-heading font-bold text-heading mb-8">{t('checkout.title')}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

              {/* Left: Form */}
              <div className="lg:col-span-3">
                {step === 'info' ? (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <h2 className="text-xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
                      <User size={20} className="text-magenta" />
                      {t('checkout.customerInfo')}
                    </h2>

                    <form onSubmit={handleInfoSubmit} className="space-y-5">
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
                          placeholder="514-xxx-xxxx"
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
                            {isFr ? 'Oui' : 'Yes'}
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
                          rows={3}
                          placeholder={isFr ? 'Couleurs, texte, précisions...' : 'Colors, text, details...'}
                          className="input-field resize-none"
                        />
                      </div>

                      {error && (
                        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full justify-center text-base py-3.5 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {t('checkout.processing')}
                          </>
                        ) : (
                          isFr ? 'Continuer vers le paiement' : 'Continue to payment'
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <button
                      onClick={() => setStep('info')}
                      className="flex items-center gap-2 text-grey-muted hover:text-heading transition-colors mb-6 text-sm"
                    >
                      <ArrowLeft size={16} />
                      {isFr ? 'Modifier mes informations' : 'Edit my information'}
                    </button>

                    {/* Customer info summary */}
                    <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--bg-glass)', border: '1px solid var(--bg-card-border)' }}>
                      <p className="text-heading font-semibold">{formData.nom}</p>
                      <p className="text-grey-muted text-sm">{formData.email}</p>
                      {formData.telephone && <p className="text-grey-muted text-sm">{formData.telephone}</p>}
                    </div>

                    {clientSecret && stripePromise && (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: 'night',
                            variables: {
                              colorPrimary: '#e91e8c',
                              colorBackground: '#1a1a2e',
                              colorText: '#e4e4f0',
                              colorDanger: '#ef4444',
                              fontFamily: 'system-ui, sans-serif',
                              borderRadius: '8px',
                            },
                          },
                        }}
                      >
                        <CheckoutForm cartTotal={cartTotal} />
                      </Elements>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Right: Order Summary */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-purple-main/30 p-6 sticky top-28" style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}>
                  <h3 className="font-heading font-bold text-heading mb-4">
                    {t('checkout.orderSummary')}
                  </h3>

                  <div className="space-y-3 mb-4">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-heading text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-grey-muted text-xs">{item.finish} · {item.shape} · {item.quantity}x</p>
                        </div>
                        <p className="text-heading font-semibold text-sm flex-shrink-0">{item.totalPrice}$</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4" style={{ borderColor: 'var(--bg-card-border)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-heading font-semibold">{isFr ? 'Total' : 'Total'}</span>
                      <span className="text-2xl font-heading font-bold text-gradient">{cartTotal}$</span>
                    </div>
                    <p className="text-grey-muted text-xs mt-2">
                      {isFr ? 'Taxes en sus si applicable. Livraison locale gratuite.' : 'Taxes extra if applicable. Free local delivery.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Checkout;
