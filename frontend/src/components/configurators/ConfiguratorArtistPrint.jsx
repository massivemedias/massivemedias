import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, Frame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useUserRole } from '../../contexts/UserRoleContext';
import {
  getArtistPrintPrice, artistPrinterTiers, artistFormats, isFormatAvailable,
} from '../../data/artists';

function ConfiguratorArtistPrint({ artist, selectedPrint, savedConfigs = {} }) {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();
  const { artistSlug: loggedArtistSlug } = useUserRole();

  const isUnique = selectedPrint?.unique;
  const fixedFormat = selectedPrint?.fixedFormat;
  const fixedTier = selectedPrint?.fixedTier;
  const noFrame = selectedPrint?.noFrame;
  const customPrice = selectedPrint?.customPrice;
  const maxFormat = selectedPrint?.maxFormat; // ex: 'a3' = max A3, pas de A3+ ni A2

  const [tier, setTier] = useState(fixedTier || 'studio');
  const [format, setFormat] = useState(fixedFormat || 'a4');
  const [withFrame, setWithFrame] = useState(false);
  const [frameColor, setFrameColor] = useState('black');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [notes, setNotes] = useState('');
  const prevPrintIdRef = useRef(selectedPrint?.id);

  // Sauvegarder la config actuelle avant de changer de print
  useEffect(() => {
    if (prevPrintIdRef.current && prevPrintIdRef.current !== selectedPrint?.id) {
      savedConfigs[prevPrintIdRef.current] = { tier, format, withFrame, frameColor, quantity, notes };
    }
    prevPrintIdRef.current = selectedPrint?.id;

    // Restaurer config sauvegardee ou reset
    const saved = savedConfigs[selectedPrint?.id];
    if (saved) {
      setTier(saved.tier);
      setFormat(saved.format);
      setWithFrame(saved.withFrame);
      setFrameColor(saved.frameColor);
      setQuantity(saved.quantity);
      setNotes(saved.notes);
      setAdded(false);
    } else {
      setAdded(false);
      if (selectedPrint?.fixedFormat) setFormat(selectedPrint.fixedFormat);
      else setFormat('a4');
      if (selectedPrint?.fixedTier) setTier(selectedPrint.fixedTier);
      else setTier('studio');
      if (selectedPrint?.noFrame) setWithFrame(false);
      else setWithFrame(false);
      setFrameColor('black');
      if (selectedPrint?.unique) setQuantity(1);
      else setQuantity(1);
      setNotes('');
      // Si le format actuel depasse maxFormat, redescendre
      if (selectedPrint?.maxFormat && !isFormatAvailable('a4', selectedPrint.maxFormat)) {
        setFormat(selectedPrint.maxFormat);
      }
    }
  }, [selectedPrint?.id]);

  if (!selectedPrint || !artist) return null;

  const priceInfo = getArtistPrintPrice(artist.pricing, tier, format, withFrame);
  const tierLabel = artistPrinterTiers.find(t => t.id === tier);
  const formatLabel = artistFormats.find(f => f.id === format);
  const printTitle = tx({ fr: selectedPrint.titleFr, en: selectedPrint.titleEn, es: selectedPrint.titleEn });

  const isArtistOwnPrint = loggedArtistSlug && loggedArtistSlug === artist?.slug;

  // Prix effectif: customPrice pour pieces uniques, sinon prix standard
  const effectivePrice = (isUnique && customPrice) ? customPrice : priceInfo?.price;

  const handleAddToCart = () => {
    if (!effectivePrice) return;
    try {
      addToCart({
        productId: `artist-print-${artist.slug}-${selectedPrint.id}`,
        productName: `${artist.name} - ${printTitle}`,
        finish: isUnique
          ? tx({ fr: 'Piece unique', en: 'One of a kind', es: 'Pieza unica' })
          : tx({ fr: tierLabel?.labelFr, en: tierLabel?.labelEn, es: tierLabel?.labelEn }),
        shape: withFrame
          ? tx({
              fr: `Cadre ${frameColor === 'black' ? 'noir' : 'blanc'}`,
              en: `${frameColor === 'black' ? 'Black' : 'White'} frame`,
              es: `Marco ${frameColor === 'black' ? 'negro' : 'blanco'}`,
            })
          : null,
        size: isUnique ? tx({ fr: 'Piece unique', en: 'Unique piece', es: 'Pieza unica' }) : formatLabel?.label,
        quantity: 1,
        unitPrice: effectivePrice,
        totalPrice: effectivePrice,
        image: selectedPrint.image,
        uploadedFiles: [],
        notes,
        isUnique: isUnique || false,
        ...(isArtistOwnPrint ? { isArtistOwnPrint: true, artistSlug: artist.slug } : {}),
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('addToCart error:', err);
    }
  };

  // Get price for display in format buttons
  const getFormatPrice = (fmtId) => {
    const p = getArtistPrintPrice(artist.pricing, tier, fmtId, false);
    return p?.basePrice;
  };

  return (
    <div className="space-y-4">
      {/* Selected print info */}
      <div className="p-4 rounded-xl bg-glass flex items-center gap-4">
        <img
          src={selectedPrint.image}
          alt={printTitle}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <div className="text-heading font-heading font-bold text-sm">{printTitle}</div>
          <div className="text-grey-muted text-xs">{artist.name}</div>
          {isUnique && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">
              {tx({ fr: 'Pièce unique', en: 'One of a kind', es: 'Pieza única' })}
            </span>
          )}
        </div>
      </div>

      {/* Unique print info */}
      {isUnique && (
        <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-2">
          <p className="text-heading font-medium">
            {customPrice
              ? tx({
                  fr: `Cette oeuvre est une piece unique. Un seul exemplaire sera produit.`,
                  en: `This artwork is one of a kind. Only one copy will be produced.`,
                  es: `Esta obra es una pieza unica. Solo se producira una copia.`,
                })
              : tx({
                  fr: `Cette oeuvre est une piece unique - Format ${(fixedFormat || '').toUpperCase()}, serie studio, sans cadre.`,
                  en: `This artwork is one of a kind - ${(fixedFormat || '').toUpperCase()} format, studio series, unframed.`,
                  es: `Esta obra es una pieza unica - Formato ${(fixedFormat || '').toUpperCase()}, serie estudio, sin marco.`,
                })
            }
          </p>
          {customPrice && (
            <p className="text-accent font-bold text-lg">{customPrice}$</p>
          )}
        </div>
      )}

      {/* Printer tier selector */}
      {!fixedTier && !(isUnique && customPrice) && (
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {tx({ fr: 'Qualité d\'impression', en: 'Print Quality', es: 'Calidad de impresión' })}
          </label>
          <div className="space-y-2">
            {artistPrinterTiers.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTier(t.id);
                  // Reset format if current format is unavailable in new tier
                  const newPrices = t.id === 'museum' ? artist.pricing.museum : artist.pricing.studio;
                  if (newPrices[format] == null) setFormat('a4');
                }}
                className={`block w-full text-center py-3.5 px-4 rounded-lg text-xs font-medium transition-all border-2 ${tier === t.id
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="text-heading font-semibold text-sm">
                  {tx({ fr: t.labelFr, en: t.labelEn, es: t.labelEn })}
                </span>
                <span className="text-grey-muted ml-2 text-[11px]">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Format selector */}
      {!fixedFormat && !(isUnique && customPrice) && (
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {artistFormats.map(f => {
              const price = getFormatPrice(f.id);
              const hasPricing = price != null;
              const fmtAllowed = isFormatAvailable(f.id, maxFormat);
              const isAvailable = hasPricing && fmtAllowed;
              return (
                <button
                  key={f.id}
                  onClick={() => { if (isAvailable) { setFormat(f.id); if (f.id === 'a2') setWithFrame(false); } }}
                  disabled={!isAvailable}
                  className={`relative block w-full text-center py-3.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${!isAvailable
                    ? 'opacity-40 cursor-not-allowed border-transparent option-default'
                    : format === f.id
                      ? 'border-accent option-selected'
                      : 'border-transparent hover:border-grey-muted/30 option-default'
                  }`}
                >
                  <div className="text-heading font-bold text-sm">{f.label}</div>
                  {!fmtAllowed ? (
                    <div className="text-grey-muted mt-0.5 text-[10px] leading-tight">
                      {tx({
                        fr: 'Non disponible',
                        en: 'Not available',
                        es: 'No disponible',
                      })}
                    </div>
                  ) : (
                    <div className="text-grey-muted mt-0.5">{hasPricing ? `${price}$` : 'N/A'}</div>
                  )}
                </button>
              );
            })}
          </div>
          {maxFormat && (
            <p className="text-grey-muted text-[11px] mt-2 leading-snug">
              {tx({
                fr: `Cette oeuvre est disponible jusqu'au format ${artistFormats.find(f => f.id === maxFormat)?.label || maxFormat}.`,
                en: `This artwork is available up to ${artistFormats.find(f => f.id === maxFormat)?.label || maxFormat} format.`,
                es: `Esta obra esta disponible hasta el formato ${artistFormats.find(f => f.id === maxFormat)?.label || maxFormat}.`,
              })}
            </p>
          )}
        </div>
      )}

      {/* Frame option - disabled for A2, unique pieces with custom price */}
      {!noFrame && format !== 'a2' && !(isUnique && customPrice) && (
        <div>
          <label className={`flex items-center gap-3 w-full p-4 rounded-lg cursor-pointer transition-all border-2 ${withFrame ? 'checkbox-active' : 'option-default'}`}>
            <input
              type="checkbox"
              checked={withFrame}
              onChange={(e) => setWithFrame(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${withFrame ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
              {withFrame && <Check size={14} className="text-white" />}
            </div>
            <div className="flex-1">
              <span className="text-heading font-medium text-sm">
                {tx({ fr: 'Ajouter un cadre', en: 'Add a frame', es: 'Agregar un marco' })}
              </span>
            </div>
            <span className="text-accent font-semibold text-sm">+{artist.pricing.framePrice}$</span>
          </label>

          {withFrame && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => setFrameColor('black')}
                className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg text-xs font-medium transition-all border-2 ${frameColor === 'black'
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black border border-grey-muted/30" />
                <span className="text-heading font-semibold">{tx({ fr: 'Noir', en: 'Black', es: 'Negro' })}</span>
              </button>
              <button
                onClick={() => setFrameColor('white')}
                className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg text-xs font-medium transition-all border-2 ${frameColor === 'white'
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white border border-grey-muted/30" />
                <span className="text-heading font-semibold">{tx({ fr: 'Blanc', en: 'White', es: 'Blanco' })}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {tx({ fr: 'Notes / Description', en: 'Notes / Description', es: 'Notas / Descripción' })}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={tx({ fr: 'Décrivez vos préférences (dedicace, message, details...)', en: 'Describe your preferences (dedication, message, details...)', es: 'Describe tus preferencias (dedicatoria, mensaje, detalles...)' })}
          className="w-full rounded-lg border-2 border-grey-muted/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Quantity */}
      {!isUnique && (
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-lg border border-white/10 text-heading font-bold text-lg flex items-center justify-center hover:border-accent/50 transition-colors"
            >
              -
            </button>
            <span className="text-heading font-bold text-lg w-10 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 rounded-lg border border-white/10 text-heading font-bold text-lg flex items-center justify-center hover:border-accent/50 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Price display */}
      {isUnique && customPrice ? (
        <div className="p-5 rounded-xl highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-heading font-bold text-heading">{customPrice}$</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-grey-muted text-xs">
              {tx({
                fr: 'Piece unique - prix fixe par l\'artiste. Certificat d\'authenticite inclus.',
                en: 'Unique piece - price set by the artist. Certificate of authenticity included.',
                es: 'Pieza unica - precio fijado por el artista. Certificado de autenticidad incluido.',
              })}
            </span>
          </div>
        </div>
      ) : (
        <>
          {!priceInfo && (
            <div className="p-5 rounded-xl highlight-bordered text-center">
              <span className="text-grey-muted text-sm">
                {tx({
                  fr: 'Ce format n\'est pas disponible dans cette serie.',
                  en: 'This format is not available in this series.',
                  es: 'Este formato no esta disponible en esta serie.',
                })}
              </span>
            </div>
          )}
          {priceInfo && (
            <div className="p-5 rounded-xl highlight-bordered">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-heading font-bold text-heading">{priceInfo.price * quantity}$</span>
                {quantity > 1 && <span className="text-grey-muted text-sm">{quantity} x {priceInfo.price}$</span>}
              </div>
              {withFrame && (
                <div className="text-grey-muted text-xs mt-1">
                  {tx({
                    fr: `Tirage ${priceInfo.basePrice}$ + Cadre ${priceInfo.framePrice}$`,
                    en: `Print ${priceInfo.basePrice}$ + Frame ${priceInfo.framePrice}$`,
                    es: `Impresion ${priceInfo.basePrice}$ + Marco ${priceInfo.framePrice}$`,
                  })}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-grey-muted text-xs">
                  {tier === 'museum'
                    ? tx({ fr: 'Qualite musee - 12 encres pigmentees, conservation 100+ ans', en: 'Museum quality - 12 pigmented inks, 100+ year archival', es: 'Calidad museo - 12 tintas pigmentadas, conservacion 100+ anos' })
                    : tx({ fr: 'Qualite studio - impression professionnelle pigmentee', en: 'Studio quality - professional pigmented printing', es: 'Calidad estudio - impresion profesional pigmentada' })}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add to cart */}
      <button onClick={handleAddToCart} disabled={!effectivePrice} className={`btn-primary w-full justify-center text-base py-4 ${!effectivePrice ? 'opacity-40 cursor-not-allowed' : ''}`}>
        {added ? (
          <><Check size={20} className="mr-2" />{tx({ fr: 'Ajouté au panier!', en: 'Added to cart!', es: 'Agregado al carrito!' })}</>
        ) : (
          <><ShoppingCart size={20} className="mr-2" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
        )}
      </button>

      <Link to="/panier" className="btn-outline w-full justify-center text-sm py-3">
        {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
      </Link>

      <p className="text-grey-muted text-xs text-center">
        {tx({
          fr: 'Impression professionnelle par Massive. Soft proofing inclus.',
          en: 'Professional printing by Massive. Soft proofing included.',
          es: 'Impresión profesional por Massive. Soft proofing incluido.',
        })}
      </p>
    </div>
  );
}

export default ConfiguratorArtistPrint;
