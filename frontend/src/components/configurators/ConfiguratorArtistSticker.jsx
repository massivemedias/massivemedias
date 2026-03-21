import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Check, Sparkles, Shuffle, RotateCcw, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import {
  stickerFinishes as defaultFinishes, stickerShapes as defaultShapes, stickerSizes as defaultSizes,
  stickerPriceTiers as defaultTiers, getStickerPrice as defaultGetPrice,
} from '../../data/products';

const PACK_TIERS = [25, 50, 100, 250, 500];

function ConfiguratorArtistSticker({ artist, selectedSticker, allStickers = [] }) {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();

  const stickers = allStickers.length > 0 ? allStickers : (artist?.stickers || []);

  const [finish, setFinish] = useState('matte');
  const [shape, setShape] = useState('diecut');
  const [size, setSize] = useState('3in');
  const [added, setAdded] = useState(false);
  const [notes, setNotes] = useState('');
  // Pack: { stickerId: qty } ex: { 'psyqu33n-stk-001': 3, 'psyqu33n-stk-002': 5 }
  const [pack, setPack] = useState({});

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

  const totalQty = useMemo(() => Object.values(pack).reduce((s, q) => s + q, 0), [pack]);

  // Trouver le tier actuel en fonction du total
  const currentTier = useMemo(() => {
    const tier = PACK_TIERS.find(t => t >= totalQty) || PACK_TIERS[PACK_TIERS.length - 1];
    return tier;
  }, [totalQty]);

  const isSpecialFinish = finish === 'holographic' || finish === 'broken-glass' || finish === 'stars';
  const priceInfo = defaultGetPrice(finish, shape, currentTier);
  const packComplete = totalQty >= 25;

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

  const setStickerQty = (id, qty) => {
    setPack(prev => {
      const updated = { ...prev };
      if (qty <= 0) delete updated[id];
      else updated[id] = qty;
      return updated;
    });
  };

  const randomMix = () => {
    if (stickers.length === 0) return;
    const target = Math.max(25, currentTier);
    const perSticker = Math.floor(target / stickers.length);
    const remainder = target % stickers.length;
    const newPack = {};
    stickers.forEach((s, i) => {
      newPack[s.id] = perSticker + (i < remainder ? 1 : 0);
    });
    setPack(newPack);
  };

  const resetPack = () => setPack(selectedSticker ? { [selectedSticker.id]: 1 } : {});

  if (!selectedSticker || !artist) return null;

  const stickerTitle = tx({ fr: selectedSticker.titleFr, en: selectedSticker.titleEn, es: selectedSticker.titleEs || selectedSticker.titleEn });

  const handleAddToCart = () => {
    if (!priceInfo || !packComplete) return;
    const packDetails = stickers
      .filter(s => pack[s.id] > 0)
      .map(s => ({
        id: s.id,
        title: tx({ fr: s.titleFr, en: s.titleEn, es: s.titleEs || s.titleEn }),
        qty: pack[s.id],
        image: s.image,
      }));

    const finishLabel = defaultFinishes.find(f => f.id === finish);
    const shapeLabel = defaultShapes.find(s => s.id === shape);
    const sizeLabel = defaultSizes.find(s => s.id === size)?.label;

    try {
      addToCart({
        productId: `artist-sticker-pack-${artist.slug}-${Date.now()}`,
        productName: `${artist.name} - Pack Stickers (${totalQty}x)`,
        finish: tx({ fr: finishLabel?.labelFr, en: finishLabel?.labelEn, es: finishLabel?.labelEn }),
        shape: tx({ fr: shapeLabel?.labelFr, en: shapeLabel?.labelEn, es: shapeLabel?.labelEn }),
        size: sizeLabel,
        quantity: totalQty,
        unitPrice: priceInfo.unitPrice,
        totalPrice: priceInfo.price,
        image: selectedSticker.image,
        uploadedFiles: [],
        notes,
        packDetails,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('addToCart error:', err);
    }
  };

  const remaining = Math.max(0, 25 - totalQty);

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
            title={tx({ fr: 'Mix aleatoire', en: 'Random mix', es: 'Mix aleatorio' })}
          >
            <Shuffle size={12} />
            {tx({ fr: 'Random', en: 'Random', es: 'Random' })}
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

      {/* Sticker grid with qty selectors */}
      <div className="space-y-1 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
        {stickers.map(s => {
          const qty = pack[s.id] || 0;
          const title = tx({ fr: s.titleFr, en: s.titleEn, es: s.titleEs || s.titleEn });
          const isSelected = qty > 0;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isSelected ? 'bg-accent/10' : 'bg-white/3 hover:bg-white/5'}`}
            >
              <img
                src={s.image}
                alt={title}
                className="w-10 h-10 rounded-md object-contain flex-shrink-0"
              />
              <span className={`flex-1 text-xs font-medium truncate ${isSelected ? 'text-heading' : 'text-grey-muted'}`}>
                {title}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => updateStickerQty(s.id, -1)}
                  disabled={qty === 0}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-heading bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className={`w-7 text-center text-xs font-bold ${isSelected ? 'text-accent' : 'text-grey-muted'}`}>
                  {qty}
                </span>
                <button
                  onClick={() => updateStickerQty(s.id, 1)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-heading bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pack total indicator */}
      <div className={`p-3 rounded-xl text-center ${packComplete ? 'bg-green-500/10' : 'bg-accent/5'}`}>
        <span className={`text-sm font-bold ${packComplete ? 'text-green-400' : 'text-heading'}`}>
          {totalQty} stickers
        </span>
        {!packComplete && (
          <span className="text-grey-muted text-xs ml-2">
            ({tx({ fr: `encore ${remaining} pour completer`, en: `${remaining} more to complete`, es: `${remaining} mas para completar` })})
          </span>
        )}
        {packComplete && (
          <span className="text-green-400 text-xs ml-2">
            {tx({ fr: 'Pack complet!', en: 'Pack complete!', es: 'Pack completo!' })}
          </span>
        )}
      </div>

      {/* Tier selector - only show when pack has items */}
      {totalQty > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {PACK_TIERS.map(tier => {
            const p = defaultGetPrice(finish, shape, tier);
            const isActive = tier === currentTier;
            const isTooLow = tier < totalQty;
            return (
              <button
                key={tier}
                onClick={() => {
                  // Adjust pack to match this tier
                  if (tier > totalQty) {
                    // Need more stickers - add randomly
                    const diff = tier - totalQty;
                    const newPack = { ...pack };
                    let added = 0;
                    while (added < diff) {
                      const s = stickers[added % stickers.length];
                      newPack[s.id] = (newPack[s.id] || 0) + 1;
                      added++;
                    }
                    setPack(newPack);
                  }
                }}
                disabled={isTooLow}
                className={`flex flex-col items-center py-2 rounded-lg text-xs transition-all border-2 ${
                  isActive
                    ? 'border-accent option-selected'
                    : isTooLow
                      ? 'border-transparent opacity-30 cursor-not-allowed option-default'
                      : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="text-heading font-bold text-sm">{tier}</span>
                <span className="text-grey-muted text-[10px]">{p ? `${p.price}$` : ''}</span>
              </button>
            );
          })}
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
                f.id === 'matte' ? 'bg-gray-400 border-gray-400' :
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
      {priceInfo && packComplete && (
        <div className="p-4 rounded-xl highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-heading font-bold text-heading">{priceInfo.price}$</span>
            <span className="text-grey-muted text-sm">
              ({priceInfo.unitPrice.toFixed(2)}$/sticker)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
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
        disabled={!packComplete}
        className={`btn-primary w-full justify-center text-sm py-3 ${!packComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {added ? (
          <><Check size={18} className="mr-2" />{tx({ fr: 'Ajoute au panier!', en: 'Added to cart!', es: 'Agregado al carrito!' })}</>
        ) : (
          <><ShoppingCart size={18} className="mr-2" />{tx({ fr: `Ajouter le pack (${totalQty}x)`, en: `Add pack (${totalQty}x)`, es: `Agregar pack (${totalQty}x)` })}</>
        )}
      </button>

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-2.5">
        {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
      </Link>

      <p className="text-grey-muted text-xs text-center">
        {tx({
          fr: `Pack de ${totalQty} stickers vinyl, imprimes par Massive. Minimum 25.`,
          en: `Pack of ${totalQty} vinyl stickers, printed by Massive. Minimum 25.`,
          es: `Pack de ${totalQty} stickers vinyl, impresos por Massive. Minimo 25.`,
        })}
      </p>
    </div>
  );
}

export default ConfiguratorArtistSticker;
