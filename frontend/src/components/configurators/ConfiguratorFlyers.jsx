import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import FileUpload from '../FileUpload';
import {
  flyerSides as defaultSides, flyerPriceTiers as defaultTiers, getFlyerPrice as defaultGetPrice, flyerImages,
} from '../../data/products';

function ConfiguratorFlyers() {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();
  const cmsProduct = useProduct('flyers');
  const pd = cmsProduct?.pricingData;

  const flyerSides = pd?.sides || defaultSides;
  const flyerPriceTiers = pd?.priceTiers || defaultTiers;

  const [side, setSide] = useState('recto');
  const [qtyIndex, setQtyIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const getFlyerPrice = pd?.priceTiers
    ? (s, qi) => {
        const tier = flyerPriceTiers[qi];
        if (!tier) return null;
        const sideOpt = flyerSides.find(x => x.id === s);
        const multiplier = sideOpt ? sideOpt.multiplier : 1.0;
        return { qty: tier.qty, price: Math.round(tier.price * multiplier), unitPrice: +(tier.unitPrice * multiplier).toFixed(2) };
      }
    : defaultGetPrice;

  const priceInfo = getFlyerPrice(side, qtyIndex);
  const sideLabel = flyerSides.find(s => s.id === side);

  const handleAddToCart = () => {
    if (!priceInfo) return;
    addToCart({
      productId: 'flyer-a6',
      productName: tx({ fr: 'Flyers A6', en: 'A6 Flyers', es: 'Flyers A6' }),
      finish: tx({ fr: sideLabel?.labelFr, en: sideLabel?.labelEn, es: sideLabel?.labelEn }),
      shape: null,
      size: 'A6 (4x6")',
      quantity: priceInfo.qty,
      unitPrice: priceInfo.unitPrice,
      totalPrice: priceInfo.price,
      image: flyerImages[0],
      uploadedFiles,
      notes,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      {/* Side selector */}
      <div className="mb-5">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {tx({ fr: 'Impression', en: 'Printing', es: 'Impresion' })}
        </label>
        <div className="flex flex-wrap gap-2">
          {flyerSides.map(s => (
            <button
              key={s.id}
              onClick={() => setSide(s.id)}
              className={`flex flex-col items-center justify-center min-w-[7rem] py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 ${side === s.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className="text-heading leading-tight text-center font-semibold text-sm">
                {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEn })}
              </span>
              {s.multiplier > 1 && (
                <span className="text-grey-muted mt-0.5 text-[10px]">+30%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity selector */}
      <div className="mb-6">
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {tx({ fr: 'Quantit\u00e9', en: 'Quantity', es: 'Cantidad' })}
        </label>
        <div className="flex flex-wrap gap-2">
          {flyerPriceTiers.map((tier, i) => {
            const p = getFlyerPrice(side, i);
            return (
              <button
                key={tier.qty}
                onClick={() => setQtyIndex(i)}
                className={`flex flex-col items-center py-2.5 px-4 rounded-lg text-xs font-medium transition-all border-2 min-w-[5rem] ${qtyIndex === i
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="text-heading font-bold text-sm">{tier.qty}</span>
                <span className="text-grey-muted mt-0.5">{p ? `${p.price}$` : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* File upload + Notes side by side */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 mb-5">
        <FileUpload
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          label={tx({ fr: 'Votre fichier', en: 'Your file', es: 'Su archivo' })}
          compact
        />
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {tx({ fr: 'Notes / Description', en: 'Notes / Description', es: 'Notas / Descripci\u00f3n' })}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={tx({ fr: 'Décrivez le produit souhaité (contenu, style, details...)', en: 'Describe the desired product (content, style, details...)', es: 'Describa el producto deseado (contenido, estilo, detalles...)' })}
            className="w-full min-h-[100px] rounded-lg border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Price display */}
      {priceInfo && (
        <div className="p-5 rounded-xl mb-5 highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/{tx({ fr: 'unit\u00e9', en: 'unit', es: 'unidad' })})
            </span>
          </div>
          <div className="text-grey-muted text-xs mt-2">
            {tx({ fr: 'Papier premium 300g+ - Qualit\u00e9 professionnelle', en: 'Premium 300g+ paper - Professional quality', es: 'Papel premium 300g+ - Calidad profesional' })}
          </div>
        </div>
      )}

      {/* Add to cart */}
      <button onClick={handleAddToCart} className="btn-primary w-full justify-center text-base py-3.5 mb-3">
        {added ? (
          <><Check size={20} className="mr-2" />{tx({ fr: 'Ajout\u00e9 au panier!', en: 'Added to cart!', es: '\u00a1Agregado al carrito!' })}</>
        ) : (
          <><ShoppingCart size={20} className="mr-2" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
        )}
      </button>

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
        {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
      </Link>

      <p className="text-grey-muted text-xs mt-3 text-center">
        {tx({ fr: 'Design graphique disponible en option. Service express disponible sur demande.', en: 'Graphic design available as an option. Express service available on request.', es: 'Diseño gráfico disponible como opción. Servicio express disponible bajo pedido.' })}
      </p>
    </>
  );
}

export default ConfiguratorFlyers;
