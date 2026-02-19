import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../i18n/LanguageContext';

function Panier() {
  const { lang } = useLang();
  const { items, removeFromCart, cartTotal } = useCart();
  const isFr = lang === 'fr';

  // Empty cart
  if (items.length === 0) {
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
          <Link to="/checkout" className="btn-primary flex-1 justify-center">
            {isFr ? 'Passer au paiement' : 'Proceed to checkout'}
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    </>
  );
}

export default Panier;
