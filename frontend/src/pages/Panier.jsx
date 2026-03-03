import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowLeft, ArrowRight, Paperclip } from 'lucide-react';
import SEO from '../components/SEO';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../i18n/LanguageContext';

function Panier() {
  const { tx } = useLang();
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart();

  // Empty cart
  if (items.length === 0) {
    return (
      <>
        <SEO title={tx({ fr: 'Panier | Massive Medias', en: 'Cart | Massive Medias', es: 'Carrito | Massive Medias' })} description="" noindex />
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
      <SEO title={tx({ fr: 'Panier | Massive Medias', en: 'Cart | Massive Medias', es: 'Carrito | Massive Medias' })} description="" noindex />

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
              className="flex items-center gap-4 p-4 rounded-xl bg-glass"
            >
              <img src={item.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <h3 className="font-semibold text-heading">{item.productName}</h3>
                <p className="text-grey-muted text-sm truncate">
                  {[item.finish, item.shape, item.size].filter(Boolean).join(' · ')}
                </p>
                {item.uploadedFiles?.length > 0 && (
                  <p className="text-accent text-xs flex items-center gap-1 mt-0.5">
                    <Paperclip size={12} />
                    {item.uploadedFiles.length} {tx({ fr: 'fichier(s) joint(s)', en: 'file(s) attached', es: 'archivo(s) adjunto(s)' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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
              </div>
              <div className="text-right flex-shrink-0 min-w-[60px]">
                <p className="font-bold text-heading">{item.totalPrice}$</p>
                {item.quantity > 1 && <p className="text-grey-muted text-xs">{item.unitPrice}$/u</p>}
              </div>
              <button
                onClick={() => removeFromCart(i)}
                className="p-2 text-grey-muted hover:text-red-500 transition-colors flex-shrink-0"
                aria-label={tx({ fr: `Supprimer ${item.productName}`, en: `Remove ${item.productName}`, es: `Eliminar ${item.productName}` })}
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-6 rounded-xl mb-8 highlight-bordered">
          <div className="flex justify-between items-center mb-2">
            <span className="text-heading font-semibold">{tx({ fr: 'Sous-total', en: 'Subtotal', es: 'Subtotal' })}</span>
            <span className="text-2xl font-heading font-bold text-heading">{cartTotal}$</span>
          </div>
          <p className="text-grey-muted text-sm">
            {tx({ fr: 'Taxes en sus si applicable. Livraison locale gratuite a Montreal.', en: 'Taxes extra if applicable. Free local delivery in Montreal.', es: 'Impuestos adicionales si aplica. Envio local gratis en Montreal.' })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/boutique" className="btn-outline flex-1 justify-center">
            <ArrowLeft size={18} className="mr-2" />
            {tx({ fr: 'Continuer mes achats', en: 'Continue shopping', es: 'Seguir comprando' })}
          </Link>
          <Link to="/checkout" className="btn-primary flex-1 justify-center">
            {tx({ fr: 'Passer au paiement', en: 'Proceed to checkout', es: 'Proceder al pago' })}
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    </>
  );
}

export default Panier;
