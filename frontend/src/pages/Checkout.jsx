import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, AlertCircle, Paperclip, Truck, Store } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { trackBeginCheckout } from '../utils/analytics';
import CheckoutForm from '../components/CheckoutForm';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { calculateShipping as calcShipping } from '../utils/shipping';

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
const ARTIST_DISCOUNT = 0.25;

function calculateTaxes(subtotal, province) {
  const tps = +(subtotal * TPS_RATE).toFixed(2);
  const tvq = province === 'QC' ? +(subtotal * TVQ_RATE).toFixed(2) : 0;
  return { tps, tvq, total: +(tps + tvq).toFixed(2) };
}

function Checkout() {
  const { t, lang, tx } = useLang();
  const { items, cartTotal, promoCode, discountPercent, discountAmount } = useCart();
  const { user, session, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Guest checkout supporte - pas de redirection vers login

  const [step, setStep] = useState('info'); // 'info' | 'payment'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('shipping'); // 'shipping' | 'pickup'

  const meta = user?.user_metadata || {};
  const [formData, setFormData] = useState({
    nom: meta.full_name || '',
    email: user?.email || '',
    telephone: meta.phone || '',
    adresse: meta.address || '',
    ville: meta.city || '',
    province: meta.province || 'QC',
    codePostal: meta.postal_code || '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Rabais artiste 30% sur ses propres prints
  const artistDiscountTotal = items
    .filter(i => i.isArtistOwnPrint)
    .reduce((sum, i) => sum + Math.round(i.totalPrice * ARTIST_DISCOUNT), 0);
  // Promo code discount applied on full cart total
  const promoDiscount = discountAmount || 0;
  const subtotal = cartTotal - artistDiscountTotal - promoDiscount;

  const { shippingCost: shippingCalc } = useMemo(() => calcShipping(formData.province, formData.codePostal, items), [formData.province, formData.codePostal, items]);
  const shipping = deliveryMethod === 'pickup' ? 0 : shippingCalc;
  const taxes = useMemo(() => calculateTaxes(subtotal, formData.province), [subtotal, formData.province]);
  const orderTotal = +(subtotal + shipping + taxes.total).toFixed(2);

  // Detect if design is ready based on uploaded files in cart
  const hasDesignFiles = items.some(item => item.uploadedFiles?.length > 0);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();

    // Sauvegarder les infos dans le profil pour pre-remplir la prochaine fois
    if (user && updateProfile) {
      updateProfile({
        full_name: formData.nom,
        phone: formData.telephone,
        address: formData.adresse,
        city: formData.ville,
        province: formData.province,
        postal_code: formData.codePostal,
      }).catch(() => {});
    }

    setStep('payment');
    trackBeginCheckout(items, orderTotal);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                          placeholder="514-555-1234"
                          pattern="^[\+]?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$"
                          title={tx({ fr: 'Format: 514-555-1234 ou (514) 555-1234', en: 'Format: 514-555-1234 or (514) 555-1234', es: 'Formato: 514-555-1234 o (514) 555-1234' })}
                          className="input-field"
                        />
                      </div>

                      {/* Methode de livraison */}
                      <div className="pt-2">
                        <h2 className="text-xl font-heading font-bold text-heading mb-4 flex items-center gap-2">
                          <Truck size={20} className="text-accent" />
                          {tx({ fr: 'Mode de livraison', en: 'Delivery method', es: 'Metodo de entrega' })}
                        </h2>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <button
                            type="button"
                            onClick={() => setDeliveryMethod('shipping')}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              deliveryMethod === 'shipping'
                                ? 'border-accent bg-accent/10'
                                : 'border-white/10 bg-glass hover:border-white/20'
                            }`}
                          >
                            <Truck size={20} className={deliveryMethod === 'shipping' ? 'text-accent mb-2' : 'text-grey-muted mb-2'} />
                            <p className="text-heading font-semibold text-sm">{tx({ fr: 'Livraison', en: 'Shipping', es: 'Envio' })}</p>
                            <p className="text-grey-muted text-xs">{tx({ fr: 'A votre adresse', en: 'To your address', es: 'A tu direccion' })}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryMethod('pickup')}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              deliveryMethod === 'pickup'
                                ? 'border-accent bg-accent/10'
                                : 'border-white/10 bg-glass hover:border-white/20'
                            }`}
                          >
                            <Store size={20} className={deliveryMethod === 'pickup' ? 'text-accent mb-2' : 'text-grey-muted mb-2'} />
                            <p className="text-heading font-semibold text-sm">{tx({ fr: 'Ramassage sur place', en: 'Pickup', es: 'Recoger en tienda' })}</p>
                            <p className="text-grey-muted text-xs">{tx({ fr: 'Gratuit - 5338 Marquette', en: 'Free - 5338 Marquette', es: 'Gratis - 5338 Marquette' })}</p>
                          </button>
                        </div>
                      </div>

                      {deliveryMethod === 'pickup' ? (
                        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 mb-2">
                          <p className="text-heading font-semibold text-sm mb-1">{tx({ fr: 'Adresse de ramassage', en: 'Pickup address', es: 'Direccion de recogida' })}</p>
                          <p className="text-grey-muted text-sm">5338 rue Marquette, Montreal, QC H2J 3Z3</p>
                          <p className="text-grey-muted text-xs mt-2">{tx({ fr: 'Nous vous contacterons pour coordonner le ramassage.', en: 'We will contact you to coordinate pickup.', es: 'Le contactaremos para coordinar la recogida.' })}</p>
                        </div>
                      ) : (
                      <>
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
                        <AddressAutocomplete
                          id="adresse"
                          required
                          value={formData.adresse}
                          onChange={v => { setFormData(f => ({ ...f, adresse: v })); if (error) setError(''); }}
                          onPlaceSelect={({ address, city, province, postalCode }) => {
                            setFormData(f => ({
                              ...f,
                              adresse: address,
                              ville: city || f.ville,
                              province: province || f.province,
                              codePostal: postalCode || f.codePostal,
                            }));
                          }}
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
                            pattern="[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d"
                            title="Format: A1A 1A1"
                            className="input-field uppercase"
                            maxLength={7}
                          />
                        </div>
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
                  <div>
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
                        {deliveryMethod === 'pickup'
                          ? tx({ fr: 'Ramassage sur place - 5338 rue Marquette, Montreal', en: 'Pickup - 5338 rue Marquette, Montreal', es: 'Recoger - 5338 rue Marquette, Montreal' })
                          : `${formData.adresse}, ${formData.ville}, ${formData.province} ${formData.codePostal}`
                        }
                      </p>
                    </div>

                    {step === 'payment' && (
                      <CheckoutForm cartTotal={orderTotal} checkoutData={{
                        items: items.map(item => ({ ...item, uploadedFiles: item.uploadedFiles || [] })),
                        customerEmail: formData.email,
                        customerName: formData.nom,
                        customerPhone: formData.telephone,
                        shippingAddress: deliveryMethod === 'pickup'
                          ? { address: 'Ramassage sur place - 5338 rue Marquette', city: 'Montreal', province: 'QC', postalCode: 'H2J 3Z3' }
                          : { address: formData.adresse, city: formData.ville, province: formData.province, postalCode: formData.codePostal },
                        deliveryMethod,
                        promoCode: promoCode || undefined,
                        designReady: hasDesignFiles,
                        notes: deliveryMethod === 'pickup' ? `[PICKUP] ${formData.message || ''}`.trim() : formData.message,
                        supabaseUserId: user?.id || '',
                      }} />
                    )}
                  </div>
                )}
              </div>

              {/* Right: Order Summary */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl p-6 sticky top-28 card-bg card-shadow">
                  <h3 className="font-heading font-bold text-heading mb-4">
                    {t('checkout.orderSummary')}
                  </h3>

                  <div className="space-y-3 mb-4">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <img src={item.image} alt={item.productName || ''} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
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
                        <div className="flex-shrink-0 text-right">
                          {item.isArtistOwnPrint ? (
                            <>
                              <p className="text-grey-muted text-xs line-through">{item.totalPrice}$</p>
                              <p className="text-green-400 font-semibold text-sm">{Math.round(item.totalPrice * (1 - ARTIST_DISCOUNT))}$</p>
                            </>
                          ) : (
                            <p className="text-heading font-semibold text-sm">{item.totalPrice}$</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 card-border space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-grey-muted">{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</span>
                      <span className={`text-heading ${(artistDiscountTotal > 0 || promoDiscount > 0) ? 'line-through text-grey-muted' : ''}`}>{cartTotal.toFixed(2)}$</span>
                    </div>
                    {artistDiscountTotal > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-400">{tx({ fr: 'Rabais artiste (-30%)', en: 'Artist discount (-30%)', es: 'Descuento artista (-30%)' })}</span>
                        <span className="text-green-400">-{artistDiscountTotal.toFixed(2)}$</span>
                      </div>
                    )}
                    {promoDiscount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-400">
                          {tx({ fr: 'Rabais', en: 'Discount', es: 'Descuento' })} ({promoCode}, -{discountPercent}%)
                        </span>
                        <span className="text-green-400">-{promoDiscount.toFixed(2)}$</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-grey-muted">
                        {deliveryMethod === 'pickup'
                          ? tx({ fr: 'Ramassage sur place', en: 'Pickup', es: 'Recoger en tienda' })
                          : tx({ fr: 'Frais de livraison', en: 'Shipping', es: 'Envio' })}
                      </span>
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
                        {tx({ fr: 'Livraison gratuite - région de Montréal', en: 'Free shipping - Montreal area', es: 'Envio gratis - zona de Montreal' })}
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
