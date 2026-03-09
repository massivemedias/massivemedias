import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, AlertCircle, Paperclip } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getStripePromise } from '../lib/stripe';
import { createPaymentIntent } from '../services/orderService';
import CheckoutForm from '../components/CheckoutForm';

const provinces = [
  { code: 'QC', fr: 'Quebec', en: 'Quebec', es: 'Quebec' },
  { code: 'ON', fr: 'Ontario', en: 'Ontario', es: 'Ontario' },
  { code: 'BC', fr: 'Colombie-Britannique', en: 'British Columbia', es: 'Columbia Britanica' },
  { code: 'AB', fr: 'Alberta', en: 'Alberta', es: 'Alberta' },
  { code: 'MB', fr: 'Manitoba', en: 'Manitoba', es: 'Manitoba' },
  { code: 'SK', fr: 'Saskatchewan', en: 'Saskatchewan', es: 'Saskatchewan' },
  { code: 'NS', fr: 'Nouvelle-Ecosse', en: 'Nova Scotia', es: 'Nueva Escocia' },
  { code: 'NB', fr: 'Nouveau-Brunswick', en: 'New Brunswick', es: 'Nuevo Brunswick' },
  { code: 'NL', fr: 'Terre-Neuve-et-Labrador', en: 'Newfoundland and Labrador', es: 'Terranova y Labrador' },
  { code: 'PE', fr: 'Ile-du-Prince-Edouard', en: 'Prince Edward Island', es: 'Isla del Principe Eduardo' },
  { code: 'NT', fr: 'Territoires du Nord-Ouest', en: 'Northwest Territories', es: 'Territorios del Noroeste' },
  { code: 'YT', fr: 'Yukon', en: 'Yukon', es: 'Yukon' },
  { code: 'NU', fr: 'Nunavut', en: 'Nunavut', es: 'Nunavut' },
];

// TPS (GST) 5% partout au Canada, TVQ (QST) 9.975% au Quebec seulement
const TPS_RATE = 0.05;
const TVQ_RATE = 0.09975;

function calculateShipping(province, postalCode) {
  if (!province) return 0;
  // Montreal (codes postaux H): gratuit
  if (province === 'QC' && postalCode?.toUpperCase().startsWith('H')) return 0;
  // Reste du Quebec
  if (province === 'QC') return 15;
  // Reste du Canada
  return 25;
}

function calculateTaxes(subtotal, province) {
  const tps = +(subtotal * TPS_RATE).toFixed(2);
  const tvq = province === 'QC' ? +(subtotal * TVQ_RATE).toFixed(2) : 0;
  return { tps, tvq, total: +(tps + tvq).toFixed(2) };
}

function Checkout() {
  const { t, lang, tx } = useLang();
  const { items, cartTotal } = useCart();
  const { user } = useAuth();
  const { step: themeStep } = useTheme();

  const [step, setStep] = useState('info'); // 'info' | 'payment'
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getStripePromise()?.then(setStripePromise);
  }, []);

  // Read theme CSS variables for Stripe appearance
  const stripeAppearance = useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    const accent = s.getPropertyValue('--accent-color').trim() || '#FF52A0';
    const bg = s.getPropertyValue('--bg-main').trim() || '#1a1a2e';
    const text = s.getPropertyValue('--text-heading').trim() || '#e4e4f0';
    return {
      theme: 'night',
      variables: {
        colorPrimary: accent,
        colorBackground: bg,
        colorText: text,
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    };
  }, [themeStep]);

  const [formData, setFormData] = useState({
    nom: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    telephone: '',
    adresse: '',
    ville: '',
    province: 'QC',
    codePostal: '',
    designReady: 'yes',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const shipping = useMemo(() => calculateShipping(formData.province, formData.codePostal), [formData.province, formData.codePostal]);
  const taxes = useMemo(() => calculateTaxes(cartTotal, formData.province), [cartTotal, formData.province]);
  const orderTotal = +(cartTotal + shipping + taxes.total).toFixed(2);

  // Custom items need design question - ready-made boutique items don't
  const CUSTOM_PREFIXES = ['sticker-custom', 'sublimation-', 'fine-art-print', 'flyer-'];
  const hasCustomItems = items.some(item =>
    CUSTOM_PREFIXES.some(prefix => item.productId?.startsWith(prefix))
  );

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Include extra checkout files in the items data
      const itemsToSend = items.map(item => ({
        ...item,
        uploadedFiles: item.uploadedFiles || [],
      }));

      const { clientSecret: secret } = await createPaymentIntent({
        items: itemsToSend,
        customerEmail: formData.email,
        customerName: formData.nom,
        customerPhone: formData.telephone,
        shippingAddress: {
          address: formData.adresse,
          city: formData.ville,
          province: formData.province,
          postalCode: formData.codePostal,
        },
        subtotal: cartTotal,
        shipping,
        taxes,
        orderTotal,
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
        tx({ fr: 'Erreur lors de la creation du paiement.', en: 'Error creating payment.', es: 'Error al crear el pago.' })
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
      <SEO title={`${t('checkout.title')} - Massive`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/panier" className="inline-flex items-center gap-2 text-grey-muted hover:text-accent transition-colors mb-6 text-sm">
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
                      <User size={20} className="text-accent" />
                      {t('checkout.customerInfo')}
                    </h2>

                    <form onSubmit={handleInfoSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="nom" className="block text-heading font-semibold text-sm mb-2">
                            {tx({ fr: 'Nom complet', en: 'Full name', es: 'Nombre completo' })} *
                          </label>
                          <input
                            type="text" id="nom" name="nom" required autoComplete="name"
                            value={formData.nom} onChange={handleChange}
                            placeholder={tx({ fr: 'Votre nom', en: 'Your name', es: 'Su nombre' })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-heading font-semibold text-sm mb-2">
                            {tx({ fr: 'Courriel', en: 'Email', es: 'Correo' })} *
                          </label>
                          <input
                            type="email" id="email" name="email" required autoComplete="email"
                            value={formData.email} onChange={handleChange}
                            placeholder={tx({ fr: 'votre@email.com', en: 'your@email.com', es: 'su@email.com' })}
                            className="input-field"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="telephone" className="block text-heading font-semibold text-sm mb-2">
                          {tx({ fr: 'Telephone', en: 'Phone', es: 'Telefono' })}
                        </label>
                        <input
                          type="tel" id="telephone" name="telephone" autoComplete="tel"
                          value={formData.telephone} onChange={handleChange}
                          placeholder="514-xxx-xxxx"
                          className="input-field"
                        />
                      </div>

                      {/* Adresse de livraison */}
                      <div className="pt-2">
                        <h2 className="text-xl font-heading font-bold text-heading mb-5 flex items-center gap-2">
                          <MapPin size={20} className="text-accent" />
                          {tx({ fr: 'Adresse de livraison', en: 'Shipping address', es: 'Direccion de envio' })}
                        </h2>
                      </div>

                      <div>
                        <label htmlFor="adresse" className="block text-heading font-semibold text-sm mb-2">
                          {tx({ fr: 'Adresse', en: 'Address', es: 'Direccion' })} *
                        </label>
                        <input
                          type="text" id="adresse" name="adresse" required autoComplete="street-address"
                          value={formData.adresse} onChange={handleChange}
                          placeholder={tx({ fr: '123 rue Exemple', en: '123 Example St', es: '123 Calle Ejemplo' })}
                          className="input-field"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label htmlFor="ville" className="block text-heading font-semibold text-sm mb-2">
                            {tx({ fr: 'Ville', en: 'City', es: 'Ciudad' })} *
                          </label>
                          <input
                            type="text" id="ville" name="ville" required autoComplete="address-level2"
                            value={formData.ville} onChange={handleChange}
                            placeholder={tx({ fr: 'Montreal', en: 'Montreal', es: 'Montreal' })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label htmlFor="province" className="block text-heading font-semibold text-sm mb-2">
                            Province *
                          </label>
                          <select
                            id="province" name="province" required autoComplete="address-level1"
                            value={formData.province} onChange={handleChange}
                            className="input-field"
                          >
                            {provinces.map(p => (
                              <option key={p.code} value={p.code}>{tx({ fr: p.fr, en: p.en, es: p.es })}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="codePostal" className="block text-heading font-semibold text-sm mb-2">
                            {tx({ fr: 'Code postal', en: 'Postal code', es: 'Codigo postal' })} *
                          </label>
                          <input
                            type="text" id="codePostal" name="codePostal" required autoComplete="postal-code"
                            value={formData.codePostal} onChange={handleChange}
                            placeholder="H2X 1Y4"
                            className="input-field uppercase"
                            maxLength={7}
                          />
                        </div>
                      </div>

                      {hasCustomItems && (
                        <>
                          <div>
                            <label className="block text-heading font-semibold text-sm mb-2">
                              {tx({ fr: 'Avez-vous votre design pret?', en: 'Do you have your design ready?', es: 'Tiene su diseno listo?' })}
                            </label>
                            <div className="flex gap-4">
                              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${formData.designReady === 'yes' ? 'bg-accent text-white' : 'text-heading bg-glass'}`}>
                                <input type="radio" name="designReady" value="yes" checked={formData.designReady === 'yes'} onChange={handleChange} className="hidden" />
                                {tx({ fr: 'Oui', en: 'Yes', es: 'Si' })}
                              </label>
                              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${formData.designReady === 'no' ? 'bg-accent text-white' : 'text-heading bg-glass'}`}>
                                <input type="radio" name="designReady" value="no" checked={formData.designReady === 'no'} onChange={handleChange} className="hidden" />
                                {tx({ fr: 'Non, j\'ai besoin du design', en: 'No, I need design help', es: 'No, necesito ayuda con el diseno' })}
                              </label>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="message" className="block text-heading font-semibold text-sm mb-2">
                              {tx({ fr: 'Instructions ou details', en: 'Instructions or details', es: 'Instrucciones o detalles' })}
                            </label>
                            <textarea
                              id="message" name="message"
                              value={formData.message} onChange={handleChange}
                              rows={3}
                              placeholder={tx({ fr: 'Couleurs, texte, precisions...', en: 'Colors, text, details...', es: 'Colores, texto, detalles...' })}
                              className="input-field resize-none"
                            />
                          </div>
                        </>
                      )}

                      {/* Files from cart items summary */}
                      {items.some(item => item.uploadedFiles?.length > 0) && (
                        <div className="p-4 rounded-lg bg-glass">
                          <p className="text-heading font-semibold text-sm mb-2 flex items-center gap-2">
                            <Paperclip size={14} className="text-accent" />
                            {tx({ fr: 'Fichiers joints aux produits', en: 'Files attached to products', es: 'Archivos adjuntos a los productos' })}
                          </p>
                          {items.filter(item => item.uploadedFiles?.length > 0).map((item, i) => (
                            <div key={i} className="text-grey-muted text-xs mb-1">
                              <span className="text-heading">{item.productName}:</span>{' '}
                              {item.uploadedFiles.map(f => f.name).join(', ')}
                            </div>
                          ))}
                        </div>
                      )}

                      {error && (
                        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30 error-bg">
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
                          tx({ fr: 'Continuer vers le paiement', en: 'Continue to payment', es: 'Continuar al pago' })
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
                      {tx({ fr: 'Modifier mes informations', en: 'Edit my information', es: 'Editar mi informacion' })}
                    </button>

                    {/* Customer info summary */}
                    <div className="p-4 rounded-xl mb-6 bg-glass">
                      <p className="text-heading font-semibold">{formData.nom}</p>
                      <p className="text-grey-muted text-sm">{formData.email}</p>
                      {formData.telephone && <p className="text-grey-muted text-sm">{formData.telephone}</p>}
                      <p className="text-grey-muted text-sm mt-2">
                        {formData.adresse}, {formData.ville}, {formData.province} {formData.codePostal}
                      </p>
                    </div>

                    {clientSecret && stripePromise && (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: stripeAppearance,
                        }}
                      >
                        <CheckoutForm cartTotal={orderTotal} />
                      </Elements>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Right: Order Summary */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-purple-main/30 p-6 sticky top-28 card-bg card-shadow">
                  <h3 className="font-heading font-bold text-heading mb-4">
                    {t('checkout.orderSummary')}
                  </h3>

                  <div className="space-y-3 mb-4">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-heading text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-grey-muted text-xs">
                            {[item.finish, item.shape, `${item.quantity}x`].filter(Boolean).join(' · ')}
                          </p>
                          {item.uploadedFiles?.length > 0 && (
                            <p className="text-accent text-xs flex items-center gap-1">
                              <Paperclip size={10} />
                              {item.uploadedFiles.length} {tx({ fr: 'fichier(s)', en: 'file(s)', es: 'archivo(s)' })}
                            </p>
                          )}
                        </div>
                        <p className="text-heading font-semibold text-sm flex-shrink-0">{item.totalPrice}$</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 card-border space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-grey-muted">{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</span>
                      <span className="text-heading">{cartTotal.toFixed(2)}$</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-grey-muted">{tx({ fr: 'Livraison', en: 'Shipping', es: 'Envio' })}</span>
                      <span className="text-heading">
                        {shipping === 0 ? tx({ fr: 'Gratuit', en: 'Free', es: 'Gratis' }) : `${shipping.toFixed(2)}$`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-grey-muted">TPS (5%)</span>
                      <span className="text-heading">{taxes.tps.toFixed(2)}$</span>
                    </div>
                    {taxes.tvq > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-grey-muted">TVQ (9.975%)</span>
                        <span className="text-heading">{taxes.tvq.toFixed(2)}$</span>
                      </div>
                    )}
                    <div className="border-t pt-3 mt-3 card-border">
                      <div className="flex justify-between items-center">
                        <span className="text-heading font-semibold">Total</span>
                        <span className="text-2xl font-heading font-bold text-gradient">{orderTotal.toFixed(2)}$</span>
                      </div>
                    </div>
                    {shipping === 0 && formData.province === 'QC' && formData.codePostal?.toUpperCase().startsWith('H') && (
                      <p className="text-green-400 text-xs mt-1">
                        {tx({ fr: 'Livraison gratuite - region de Montreal', en: 'Free shipping - Montreal area', es: 'Envio gratis - zona de Montreal' })}
                      </p>
                    )}
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
