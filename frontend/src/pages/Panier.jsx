import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowLeft, ArrowRight, Paperclip, Percent, MapPin, AlertTriangle, Tag, CheckCircle, X } from 'lucide-react';
import SEO from '../components/SEO';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { validatePromoCode } from '../services/orderService';
import { getStickerPrice } from '../data/products';

const ARTIST_DISCOUNT = 0.25;
// Produits a paliers fixes - pas de +/- libre
const TIERED_PRODUCTS = ['sticker-custom', 'sticker-artist'];

function Panier() {
  const { tx } = useLang();
  const { items, removeFromCart, updateQuantity, cartTotal, promoCode, discountPercent, discountAmount, promoLabel, applyPromoCode, removePromoCode } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  const hasArtistOwnPrints = items.some(i => i.isArtistOwnPrint);
  const hasArtistOwnPrintsOnly = items.some(i => i.isArtistOwnPrint && (i.productId || '').startsWith('artist-print-'));
  const artistDiscountTotal = items
    .filter(i => i.isArtistOwnPrint)
    .reduce((sum, i) => sum + Math.round(i.totalPrice * ARTIST_DISCOUNT), 0);
  const adjustedTotal = cartTotal - artistDiscountTotal;

  // Empty cart
  if (items.length === 0) {
    return (
      <>
        <SEO title={tx({ fr: 'Panier | Massive', en: 'Cart | Massive', es: 'Carrito | Massive' })} description="" noindex />
        <div className="section-container pt-32 max-w-2xl mx-auto text-center">
          <ShoppingCart size={64} className="text-grey-muted mx-auto mb-6" />
          <h1 className="text-3xl font-heading font-bold text-heading mb-4">
            {tx({ fr: 'Votre panier est vide', en: 'Your cart is empty', es: 'Su carrito esta vacio' })}
          </h1>
          <p className="text-grey-light mb-8">
            {tx({ fr: 'Ajoutez des produits pour commencer.', en: 'Add products to get started.', es: 'Agregue productos para comenzar.' })}
          </p>
          <Link to="/boutique" className="btn-primary">
            {tx({ fr: 'Voir la boutique', en: 'Browse shop', es: 'Ver la tienda' })}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={tx({ fr: 'Panier | Massive', en: 'Cart | Massive', es: 'Carrito | Massive' })} description="" noindex />

      <div className="section-container pt-28 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-heading mb-8">
          {tx({ fr: 'Votre panier', en: 'Your cart', es: 'Su carrito' })}
        </h1>

        {/* Cart items */}
        <div className="space-y-4 mb-8">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-glass"
            >
              {/* Ligne 1: image + nom */}
              <div className="flex items-center gap-3 mb-3">
                <img src={item.image} alt={item.productName || ''} className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-heading text-sm sm:text-base leading-tight">{item.productName}</h3>
                  <p className="text-grey-muted text-xs sm:text-sm truncate">
                    {[item.finish, item.shape, item.size].filter(Boolean).join(' · ')}
                  </p>
                  {item.uploadedFiles?.length > 0 && (
                    <p className="text-accent text-xs flex items-center gap-1 mt-0.5">
                      <Paperclip size={12} />
                      {item.uploadedFiles.length} {tx({ fr: 'fichier(s) joint(s)', en: 'file(s) attached', es: 'archivo(s) adjunto(s)' })}
                    </p>
                  )}
                </div>
              </div>
              {/* Detail du pack stickers */}
              {item.packDetails?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-0 sm:pl-[68px] mb-2">
                  {item.packDetails.map((pd, j) => (
                    <div key={j} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 text-[10px]">
                      <img src={pd.image} alt={pd.title} className="w-4 h-4 rounded-sm object-contain" />
                      <span className="text-grey-light">{pd.title}</span>
                      <span className="text-accent font-bold">x{pd.qty}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Ligne 2: quantite + prix + supprimer */}
              <div className="flex items-center justify-between pl-0 sm:pl-[68px]">
                <div className="flex items-center gap-2">
                  {TIERED_PRODUCTS.includes(item.productId) ? (
                    <span className="text-heading font-bold text-sm px-2">{item.quantity} {tx({ fr: 'unites', en: 'units', es: 'unidades' })}</span>
                  ) : (
                  <>
                  <button
                    onClick={() => updateQuantity(i, Math.max(1, item.quantity - 1), item.unitPrice)}
                    className="w-8 h-8 rounded-lg border border-white/10 text-heading font-bold text-sm flex items-center justify-center hover:border-accent/50 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-heading font-bold text-sm w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(i, item.quantity + 1, item.unitPrice)}
                    className="w-8 h-8 rounded-lg border border-white/10 text-heading font-bold text-sm flex items-center justify-center hover:border-accent/50 transition-colors"
                  >
                    +
                  </button>
                  </>
                  )}
                </div>
                <div className="text-right">
                  {item.isArtistOwnPrint ? (
                    <>
                      <p className="font-bold text-heading">
                        <span className="line-through text-grey-muted text-sm mr-1">{item.totalPrice}$</span>
                        {Math.round(item.totalPrice * (1 - ARTIST_DISCOUNT))}$
                      </p>
                      <p className="text-green-400 text-xs font-semibold flex items-center gap-1 justify-end">
                        <Percent size={10} /> -30%
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-heading">{item.totalPrice}$</p>
                      {item.quantity > 1 && <p className="text-grey-muted text-xs">{item.unitPrice}$/u</p>}
                    </>
                  )}
                </div>
                <button
                  onClick={() => removeFromCart(i)}
                  className="p-2 text-grey-muted hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label={tx({ fr: `Supprimer ${item.productName}`, en: `Remove ${item.productName}`, es: `Eliminar ${item.productName}` })}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Artist own prints notice */}
        {hasArtistOwnPrints && (
          <div className="space-y-3 mb-6">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Percent size={16} className="text-green-400" />
                <span className="text-green-400 font-semibold text-sm">
                  {tx({ fr: 'Rabais artiste 25% applique', en: 'Artist 25% discount applied', es: 'Descuento artista 25% aplicado' })}
                </span>
              </div>
              <div className="flex items-start gap-2 mt-2">
                <MapPin size={14} className="text-grey-muted flex-shrink-0 mt-0.5" />
                <p className="text-grey-muted text-xs">
                  {tx({
                    fr: 'Frais de livraison en sus. Pickup gratuit au 7049 St-Urbain, Montréal.',
                    en: 'Shipping fees extra. Free pickup at 7049 St-Urbain, Montreal.',
                    es: 'Gastos de envio adicionales. Recogida gratis en 7049 St-Urbain, Montreal.',
                  })}
                </p>
              </div>
              {hasArtistOwnPrintsOnly && (
                <div className="flex items-start gap-2 mt-2">
                  <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-400/80 text-xs">
                    {tx({
                      fr: 'Prints: usage personnel, portfolio ou exposition uniquement. Revente interdite (contrat signe).',
                      en: 'Prints: personal use, portfolio or exhibition only. Resale prohibited (signed contract).',
                      es: 'Prints: uso personal, portafolio o exposicion solamente. Reventa prohibida (contrato firmado).',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Promo code */}
        <div className="mb-6">
          {promoCode ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
              <div className="flex-grow">
                <span className="text-green-400 font-semibold text-sm">{promoCode}</span>
                <span className="text-grey-muted text-sm ml-2">(-{discountPercent}%)</span>
              </div>
              <button
                onClick={() => { removePromoCode(); setPromoInput(''); setPromoError(''); }}
                className="text-grey-muted hover:text-red-400 text-xs underline transition-colors"
              >
                {tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); if (promoError) setPromoError(''); }}
                    placeholder={tx({ fr: 'Code promo', en: 'Promo code', es: 'Codigo promo' })}
                    className="input-field pl-9 text-sm"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!promoInput.trim()) return;
                    setPromoLoading(true);
                    setPromoError('');
                    try {
                      const result = await validatePromoCode(promoInput.trim());
                      if (result.valid) {
                        applyPromoCode(promoInput.trim(), result.discountPercent, result.label);
                        setPromoInput('');
                      } else {
                        setPromoError(tx({ fr: 'Code promo invalide', en: 'Invalid promo code', es: 'Codigo promo invalido' }));
                      }
                    } catch {
                      setPromoError(tx({ fr: 'Code promo invalide', en: 'Invalid promo code', es: 'Codigo promo invalido' }));
                    } finally {
                      setPromoLoading(false);
                    }
                  }}
                  disabled={promoLoading || !promoInput.trim()}
                  className="btn-outline text-sm px-4 py-2 flex-shrink-0 disabled:opacity-50"
                >
                  {promoLoading ? '...' : tx({ fr: 'Appliquer', en: 'Apply', es: 'Aplicar' })}
                </button>
              </div>
              {promoError && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <X size={12} /> {promoError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-6 rounded-xl mb-8 highlight-bordered">
          {(hasArtistOwnPrints || discountAmount > 0) ? (
            <>
              <div className="flex justify-between items-center mb-1">
                <span className="text-grey-muted text-sm">{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</span>
                <span className="text-grey-muted line-through">{cartTotal}$</span>
              </div>
              {hasArtistOwnPrints && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-green-400 text-sm">{tx({ fr: 'Rabais artiste (-25%)', en: 'Artist discount (-25%)', es: 'Descuento artista (-25%)' })}</span>
                  <span className="text-green-400 font-semibold">-{artistDiscountTotal}$</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-green-400 text-sm">
                    {tx({ fr: 'Rabais', en: 'Discount', es: 'Descuento' })} ({promoCode}, -{discountPercent}%)
                  </span>
                  <span className="text-green-400 font-semibold">-{discountAmount}$</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-heading font-semibold">{tx({ fr: 'Total', en: 'Total', es: 'Total' })}</span>
                <span className="text-2xl font-heading font-bold text-heading">{adjustedTotal - discountAmount}$</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center mb-2">
              <span className="text-heading font-semibold">{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</span>
              <span className="text-2xl font-heading font-bold text-heading">{cartTotal}$</span>
            </div>
          )}
          <p className="text-grey-muted text-sm mt-2">
            {tx({ fr: 'Taxes en sus si applicable. Livraison locale gratuite à Montréal.', en: 'Taxes extra if applicable. Free local delivery in Montreal.', es: 'Impuestos adicionales si aplica. Envio local gratis en Montreal.' })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/boutique" className="btn-outline flex-1 justify-center">
            <ArrowLeft size={18} className="mr-2" />
            {tx({ fr: 'Continuer mes achats', en: 'Continue shopping', es: 'Seguir comprando' })}
          </Link>
          <button
            onClick={() => navigate('/checkout')}
            className="btn-primary flex-1 justify-center"
          >
            {tx({ fr: 'Passer au paiement', en: 'Proceed to checkout', es: 'Proceder al pago' })}
            <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </>
  );
}

export default Panier;
