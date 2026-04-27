import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Check, Sparkles, Shuffle, RotateCcw, Plus, Minus, AlertCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useUserRole } from '../../contexts/UserRoleContext';
import {
  stickerFinishes as defaultFinishes, stickerShapes as defaultShapes, stickerSizes as defaultSizes,
  getStickerPriceForTotal,
} from '../../data/products';

const MIN_TOTAL = 25; // Minimum d'impression

function ConfiguratorArtistSticker({ artist, selectedSticker, allStickers = [] }) {
  const { tx } = useLang();
  const { addToCart } = useCart();
  const { artistSlug: loggedArtistSlug } = useUserRole();
  const isArtistOwnPrint = loggedArtistSlug && loggedArtistSlug === artist?.slug;

  const stickers = allStickers.length > 0 ? allStickers : (artist?.stickers || []);

  const [finish, setFinish] = useState('clear');
  const [shape, setShape] = useState('diecut');
  const [size, setSize] = useState('3in');
  const [added, setAdded] = useState(false);
  const [notes, setNotes] = useState('');
  const [previewSticker, setPreviewSticker] = useState(null);
  // Composition du pack: { stickerId: qty_dans_UN_pack }
  const [pack, setPack] = useState({});
  // Nombre de packs a imprimer
  const [packCount, setPackCount] = useState(1);

  // Pre-selectionner le sticker clique
  useEffect(() => {
    if (selectedSticker?.id) {
      setPack(prev => {
        if (Object.keys(prev).length === 0) {
          return { [selectedSticker.id]: 1 };
        }
        if (!prev[selectedSticker.id]) {
          return { ...prev, [selectedSticker.id]: 1 };
        }
        return prev;
      });
      setAdded(false);
    }
  }, [selectedSticker?.id]);

  // Taille d'un pack (somme des qty dans le pack)
  const packSize = useMemo(() => Object.values(pack).reduce((s, q) => s + q, 0), [pack]);
  // Total de stickers a imprimer
  const totalQty = packSize * packCount;

  const isSpecialFinish = finish === 'holographic' || finish === 'broken-glass' || finish === 'stars';
  // FIX-PRICING-TIERS (27 avril 2026) : `size` impacte le prix via 3 paliers
  // (Standard/Medium/Large). React re-render automatiquement quand size change.
  const priceInfo = totalQty > 0 ? getStickerPriceForTotal(finish, shape, totalQty, size) : null;
  const canCheckout = totalQty >= MIN_TOTAL && packSize > 0;
  const missing = Math.max(0, MIN_TOTAL - totalQty);

  const updateStickerQty = (id, delta) => {
    setPack(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  };

  const randomMix = () => {
    if (stickers.length === 0) return;
    // Un de chaque sticker disponible (pack complet)
    const newPack = {};
    stickers.forEach(s => { newPack[s.id] = 1; });
    setPack(newPack);
  };

  const resetPack = () => {
    setPack(selectedSticker ? { [selectedSticker.id]: 1 } : {});
    setPackCount(1);
  };

  if (!selectedSticker || !artist) return null;

  const handleAddToCart = () => {
    if (!priceInfo || !canCheckout) return;
    const packDetails = stickers
      .filter(s => pack[s.id] > 0)
      .map(s => ({
        id: s.id,
        title: tx({ fr: s.titleFr, en: s.titleEn, es: s.titleEs || s.titleEn }),
        qty: pack[s.id] * packCount, // quantite totale par design
        qtyPerPack: pack[s.id],
        image: s.image,
      }));

    const finishLabel = defaultFinishes.find(f => f.id === finish);
    const shapeLabel = defaultShapes.find(s => s.id === shape);
    const sizeLabel = defaultSizes.find(s => s.id === size)?.label;

    try {
      addToCart({
        productId: `artist-sticker-pack-${artist.slug}-${Date.now()}`,
        productName: tx({
          fr: `${artist.name} - ${packCount} pack${packCount > 1 ? 's' : ''} de ${packSize} stickers`,
          en: `${artist.name} - ${packCount} pack${packCount > 1 ? 's' : ''} of ${packSize} stickers`,
          es: `${artist.name} - ${packCount} pack${packCount > 1 ? 's' : ''} de ${packSize} stickers`,
        }),
        finish: tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEn }),
        shape: tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn }),
        size: sizeLabel, // affichage label
        sizeId: size,    // id stable pour recalcul (size multiplier)
        quantity: totalQty,
        unitPrice: priceInfo.unitPrice,
        totalPrice: priceInfo.price,
        image: selectedSticker.image,
        uploadedFiles: [],
        notes,
        packDetails,
        packComposition: { packSize, packCount, total: totalQty },
        ...(isArtistOwnPrint ? { isArtistOwnPrint: true, artistSlug: artist.slug } : {}),
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('addToCart error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pack builder header */}
      <div className="flex items-center justify-between">
        <label className="text-heading font-semibold text-xs uppercase tracking-wider">
          {tx({ fr: 'Composez votre pack', en: 'Build your pack', es: 'Componga su pack' })}
        </label>
        <div className="flex gap-1.5">
          <button
            onClick={randomMix}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
            title={tx({ fr: 'Un de chaque', en: 'One of each', es: 'Uno de cada' })}
          >
            <Shuffle size={12} />
            {tx({ fr: 'Un de chaque', en: 'One each', es: 'Uno cada' })}
          </button>
          <button
            onClick={resetPack}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-grey-muted hover:bg-white/10 transition-colors"
            title={tx({ fr: 'Reinitialiser', en: 'Reset', es: 'Reiniciar' })}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Apercu du sticker selectionne */}
      {previewSticker && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-black/20">
          <img src={previewSticker.image} alt="" className="w-28 h-28 object-contain" />
          <div>
            <p className="text-heading font-bold text-sm">{tx({ fr: previewSticker.titleFr, en: previewSticker.titleEn, es: previewSticker.titleEs || previewSticker.titleEn })}</p>
            <p className="text-grey-muted text-xs mt-1">{tx({ fr: 'Cliquez + pour ajouter au pack', en: 'Click + to add to pack', es: 'Haz clic + para agregar' })}</p>
          </div>
        </div>
      )}

      {/* Sticker grid with qty selectors */}
      <div className="space-y-1 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
        {stickers.map(s => {
          const qty = pack[s.id] || 0;
          const title = tx({ fr: s.titleFr, en: s.titleEn, es: s.titleEs || s.titleEn });
          const isSelected = qty > 0;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${isSelected ? 'bg-accent/10' : 'bg-white/3 hover:bg-white/5'}`}
            >
              <div className="flex-shrink-0">
                <img
                  src={s.image}
                  alt={title}
                  className={`w-14 h-14 rounded-lg object-contain cursor-pointer transition-all ${previewSticker?.id === s.id ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-white/30'}`}
                  onClick={() => setPreviewSticker(s)}
                />
              </div>
              <span className={`flex-1 text-sm font-medium truncate ${isSelected ? 'text-heading' : 'text-grey-muted'}`}>
                {title}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => updateStickerQty(s.id, -1)}
                  disabled={qty === 0}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-heading bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={13} />
                </button>
                <span className={`w-8 text-center text-sm font-bold ${isSelected ? 'text-accent' : 'text-grey-muted'}`}>
                  {qty}
                </span>
                <button
                  onClick={() => updateStickerQty(s.id, 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-heading bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pack size indicator */}
      <div className="p-3 rounded-xl bg-accent/5 text-center">
        <span className="text-sm font-bold text-heading">
          {packSize} {packSize > 1
            ? tx({ fr: 'stickers par pack', en: 'stickers per pack', es: 'stickers por pack' })
            : tx({ fr: 'sticker par pack', en: 'sticker per pack', es: 'sticker por pack' })}
        </span>
        {packSize === 0 && (
          <span className="text-grey-muted text-xs block mt-1">
            {tx({ fr: 'Cliquez + sur les stickers pour composer votre pack', en: 'Click + on stickers to build your pack', es: 'Haz clic + en los stickers para componer tu pack' })}
          </span>
        )}
      </div>

      {/* Pack count multiplier */}
      {packSize > 0 && (
        <div className="p-4 rounded-xl highlight-bordered">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-heading font-semibold text-xs uppercase tracking-wider mb-1">
                {tx({ fr: 'Nombre de packs', en: 'Number of packs', es: 'Numero de packs' })}
              </div>
              <div className="text-grey-muted text-xs">
                {tx({
                  fr: `${packSize} × ${packCount} = ${totalQty} stickers`,
                  en: `${packSize} × ${packCount} = ${totalQty} stickers`,
                  es: `${packSize} × ${packCount} = ${totalQty} stickers`,
                })}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setPackCount(c => Math.max(1, c - 1))}
                disabled={packCount <= 1}
                className="w-10 h-10 rounded-lg border border-white/10 text-heading font-bold text-base flex items-center justify-center hover:border-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                -
              </button>
              <span className="text-heading font-bold w-10 text-center text-base">{packCount}</span>
              <button
                onClick={() => setPackCount(c => c + 1)}
                className="w-10 h-10 rounded-lg border border-white/10 text-heading font-bold text-base flex items-center justify-center hover:border-accent/50 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerte minimum */}
      {packSize > 0 && !canCheckout && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
          <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-yellow-400 font-semibold">
              {tx({ fr: `Minimum ${MIN_TOTAL} stickers pour imprimer`, en: `Minimum ${MIN_TOTAL} stickers to print`, es: `Minimo ${MIN_TOTAL} stickers para imprimir` })}
            </p>
            <p className="text-yellow-400/80 mt-0.5">
              {tx({
                fr: `Il manque ${missing} stickers. Augmentez le nombre de packs ou ajoutez des stickers au pack.`,
                en: `${missing} more stickers needed. Increase pack count or add stickers to the pack.`,
                es: `Faltan ${missing} stickers. Aumenta el numero de packs o agrega stickers al pack.`,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Finish selector */}
      <div>
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
          {tx({ fr: 'Finition', en: 'Finish', es: 'Acabado' })}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {defaultFinishes.map(f => (
            <button
              key={f.id}
              onClick={() => setFinish(f.id)}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-medium transition-all border-2 ${finish === f.id
                ? 'border-accent option-selected'
                : 'border-transparent hover:border-grey-muted/30 option-default'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full mb-1 border ${
                f.id === 'clear' ? 'bg-white/80 border-gray-300 shadow-inner' :
                f.id === 'glossy' ? 'bg-white border-gray-300 shadow-sm' :
                f.id === 'broken-glass' ? 'bg-gradient-to-br from-cyan-200 via-white to-cyan-400 border-cyan-300' :
                f.id === 'stars' ? 'bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400 border-yellow-300' :
                'bg-gradient-to-br from-pink-300 via-purple-300 to-cyan-300 border-transparent'
              }`} />
              <span className="text-heading leading-tight text-center font-semibold text-[11px]">
                {tx({ fr: f.labelFr.replace('Vinyle ', ''), en: f.labelEn.replace(' Vinyl', ''), es: f.labelEn.replace(' Vinyl', '') })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shape + Size */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Forme', en: 'Shape', es: 'Forma' })}
          </label>
          <div className="flex flex-col gap-1.5">
            {defaultShapes.map(s => (
              <button
                key={s.id}
                onClick={() => setShape(s.id)}
                className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all border-2 ${shape === s.id
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className={`flex-shrink-0 ${
                  s.id === 'round' ? 'w-3.5 h-3.5 rounded-full border-2 border-current' :
                  s.id === 'square' ? 'w-3.5 h-3.5 rounded-sm border-2 border-current' :
                  s.id === 'rectangle' ? 'w-4 h-3 rounded-sm border-2 border-current' :
                  'w-4 h-3.5 border-2 border-current border-dashed rounded-lg'
                } text-grey-muted`} />
                <span className="text-heading font-semibold text-[11px]">
                  {tx({ fr: s.labelFr, en: s.labelEn, es: s.labelEn })}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
            {tx({ fr: 'Taille', en: 'Size', es: 'Tamano' })}
          </label>
          <div className="flex flex-col gap-1.5">
            {defaultSizes.map(s => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all border-2 ${size === s.id
                  ? 'border-accent text-heading option-selected'
                  : 'border-transparent text-heading hover:border-grey-muted/30 option-default'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {/* FIX-PRICING-TIERS (27 avril 2026) : 3 paliers de prix selon la
              taille. Affiche le palier actif. Coherent avec ConfiguratorStickers. */}
          <p className="mt-2 flex items-start gap-1 text-[10px] text-grey-muted leading-relaxed">
            <Info size={10} className="text-accent flex-shrink-0 mt-0.5" />
            <span>
              {priceInfo?.tier === 'large' ? (
                tx({
                  fr: 'Large (jusqu\'a 5"). Calcule sur la dimension la plus large.',
                  en: 'Large (up to 5"). Based on longest dimension.',
                  es: 'Large (hasta 5"). Según la dimensión más larga.',
                })
              ) : priceInfo?.tier === 'medium' ? (
                tx({
                  fr: 'Medium (jusqu\'a 3.5"). Calcule sur la dimension la plus large.',
                  en: 'Medium (up to 3.5"). Based on longest dimension.',
                  es: 'Medium (hasta 3.5"). Según la dimensión más larga.',
                })
              ) : (
                tx({
                  fr: 'Standard (jusqu\'a 2.5"). Calcule sur la dimension la plus large.',
                  en: 'Standard (up to 2.5"). Based on longest dimension.',
                  es: 'Standard (hasta 2.5"). Según la dimensión más larga.',
                })
              )}
            </span>
          </p>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
          {tx({ fr: 'Notes', en: 'Notes', es: 'Notas' })}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={tx({ fr: 'Instructions speciales, details...', en: 'Special instructions, details...', es: 'Instrucciones especiales, detalles...' })}
          className="w-full rounded-lg border-2 border-grey-muted/20 bg-transparent px-3 py-2.5 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Price display */}
      {priceInfo && canCheckout && (
        <div className="p-4 rounded-xl highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/sticker)
            </span>
          </div>
          <div className="text-grey-muted text-xs mt-1">
            {tx({
              fr: `${packCount} pack${packCount > 1 ? 's' : ''} de ${packSize} = ${totalQty} stickers`,
              en: `${packCount} pack${packCount > 1 ? 's' : ''} of ${packSize} = ${totalQty} stickers`,
              es: `${packCount} pack${packCount > 1 ? 's' : ''} de ${packSize} = ${totalQty} stickers`,
            })}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {isSpecialFinish && (
              <span className="text-accent text-xs font-medium">
                {tx({ fr: 'Effets Speciaux', en: 'Special Effects', es: 'Efectos Especiales' })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              <Sparkles size={12} />
              {tx({ fr: 'Pack mixte', en: 'Mixed pack', es: 'Pack mixto' })}
            </span>
          </div>
        </div>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAddToCart}
        disabled={!canCheckout}
        className={`btn-primary w-full justify-center text-sm py-3 ${!canCheckout ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {added ? (
          <><Check size={18} className="mr-2" />{tx({ fr: 'Ajoute au panier!', en: 'Added to cart!', es: 'Agregado al carrito!' })}</>
        ) : (
          <><ShoppingCart size={18} className="mr-2" />{
            packSize === 0
              ? tx({ fr: 'Composez votre pack', en: 'Build your pack', es: 'Componga su pack' })
              : !canCheckout
                ? tx({ fr: `Minimum ${MIN_TOTAL} stickers`, en: `Minimum ${MIN_TOTAL} stickers`, es: `Minimo ${MIN_TOTAL} stickers` })
                : tx({ fr: `Ajouter au panier (${totalQty} stickers)`, en: `Add to cart (${totalQty} stickers)`, es: `Agregar al carrito (${totalQty} stickers)` })
          }</>
        )}
      </button>

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
        {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
      </Link>

      <p className="text-grey-muted text-xs text-center">
        {tx({
          fr: `Stickers vinyl imprimes par Massive. Minimum ${MIN_TOTAL} par commande.`,
          en: `Vinyl stickers printed by Massive. Minimum ${MIN_TOTAL} per order.`,
          es: `Stickers vinyl impresos por Massive. Minimo ${MIN_TOTAL} por pedido.`,
        })}
      </p>
    </div>
  );
}

export default ConfiguratorArtistSticker;
