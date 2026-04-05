import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, Frame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useUserRole } from '../../contexts/UserRoleContext';
import {
  getArtistPrintPrice, artistPrinterTiers, artistFormats, isFormatAvailable, framePriceByFormat,
} from '../../data/artists';

function ConfiguratorArtistPrint({ artist, selectedPrint, savedConfigs = {}, onFrameColorChange }) {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();
  const { artistSlug: loggedArtistSlug } = useUserRole();

  const isUnique = selectedPrint?.unique;
  const isSold = selectedPrint?.sold;
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

  // Notifier le parent quand la couleur du cadre change (pour MockupPreview)
  useEffect(() => {
    if (onFrameColorChange) onFrameColorChange(withFrame ? frameColor : 'black');
  }, [frameColor, withFrame, onFrameColorChange]);

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
          ? tx({ fr: 'Pièce unique', en: 'One of a kind', es: 'Pieza unica' })
          : tx({ fr: tierLabel?.labelFr, en: tierLabel?.labelEn, es: tierLabel?.labelEn }),
        shape: withFrame
          ? tx({
              fr: `Cadre ${frameColor === 'black' ? 'noir' : 'blanc'}`,
              en: `${frameColor === 'black' ? 'Black' : 'White'} frame`,
              es: `Marco ${frameColor === 'black' ? 'negro' : 'blanco'}`,
            })
          : null,
        size: isUnique ? tx({ fr: 'Pièce unique', en: 'Unique piece', es: 'Pieza unica' }) : formatLabel?.label,
        quantity: isUnique ? 1 : quantity,
        unitPrice: effectivePrice,
        totalPrice: effectivePrice * (isUnique ? 1 : quantity),
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
    <div className="space-y-3">
      {/* Selected print info */}
      <div className="p-3 rounded-xl bg-glass flex items-center gap-3">
        <img
          src={selectedPrint.image}
          alt={printTitle}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div>
          <div className="text-heading font-heading font-bold text-sm leading-tight">{printTitle}</div>
          <div className="text-grey-muted text-xs">{artist.name}</div>
          {isUnique && (
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">
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
                  fr: `Cette oeuvre est une pièce unique. Un seul exemplaire sera produit.`,
                  en: `This artwork is one of a kind. Only one copy will be produced.`,
                  es: `Esta obra es una pieza unica. Solo se producira una copia.`,
                })
              : tx({
                  fr: `Cette oeuvre est une pièce unique - Format ${(fixedFormat || '').toUpperCase()}, série studio, sans cadre.`,
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
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
            {tx({ fr: 'Qualité d\'impression', en: 'Print Quality', es: 'Calidad de impresión' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {artistPrinterTiers.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTier(t.id);
                  const newPrices = t.id === 'museum' ? artist.pricing.museum : artist.pricing.studio;
                  if (newPrices[format] == null) setFormat('a4');
                }}
                className={`text-center py-2.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${tier === t.id
                  ? 'border-accent option-selected'
                  : 'border-transparent hover:border-grey-muted/30 option-default'
                }`}
              >
                <span className="text-heading font-semibold text-sm block">
                  {tx({ fr: t.labelFr, en: t.labelEn, es: t.labelEn })}
                </span>
                <span className="text-grey-muted text-[10px]">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Format selector */}
      {!fixedFormat && !(isUnique && customPrice) && (
        <div>
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
            Format
          </label>
          <div className="flex flex-wrap items-end gap-3 justify-center">
            {artistFormats.map(f => {
              const price = getFormatPrice(f.id);
              const hasPricing = price != null;
              const fmtAllowed = isFormatAvailable(f.id, maxFormat);
              const isAvailable = hasPricing && fmtAllowed;
              // Taille proportionnelle: le plus grand (A2=24") = 80px de hauteur
              const scale = 80 / 24;
              const rectW = Math.max(28, Math.round(f.w * scale));
              const rectH = Math.max(40, Math.round(f.h * scale));
              const formatDesc = lang === 'fr' ? f.descFr : f.descEn;
              return (
                <button
                  key={f.id}
                  onClick={() => { if (isAvailable) { setFormat(f.id); } }}
                  disabled={!isAvailable}
                  title={formatDesc}
                  className={`flex flex-col items-center gap-1.5 transition-all ${!isAvailable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Rectangle proportionnel avec label */}
                  <div
                    className={`rounded-sm transition-all flex items-center justify-center ${format === f.id
                      ? 'ring-2 ring-accent bg-accent/20'
                      : 'bg-white/10 hover:bg-white/15'
                    }`}
                    style={{ width: `${rectW}px`, height: `${rectH}px` }}
                  >
                    <span className={`font-bold leading-none ${format === f.id ? 'text-accent' : 'text-white/40'}`} style={{ fontSize: `${Math.max(8, Math.min(14, rectH / 4))}px` }}>
                      {f.short}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className={`font-medium leading-tight ${format === f.id ? 'text-accent' : 'text-heading'}`} style={{ fontSize: '10px' }}>
                      {f.w}x{f.h}"
                    </div>
                    <div className="text-grey-muted leading-tight" style={{ fontSize: '9px' }}>
                      {!fmtAllowed ? 'N/A' : hasPricing ? `${price}$` : 'N/A'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Nom du format selectionne */}
          {(() => {
            const sel = artistFormats.find(f => f.id === format);
            return sel ? (
              <p className="text-center text-accent text-xs font-medium mt-2">
                {lang === 'fr' ? sel.descFr : sel.descEn} - {sel.label}
              </p>
            ) : null;
          })()}
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

      {/* Frame option */}
      {!noFrame && !(isUnique && customPrice) && (
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
            <span className="text-accent font-semibold text-sm">+{framePriceByFormat[format] || 30}$</span>
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
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-1.5">
          {tx({ fr: 'Notes', en: 'Notes', es: 'Notas' })}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={tx({ fr: 'Dedicace, message, details...', en: 'Dedication, message, details...', es: 'Dedicatoria, mensaje, detalles...' })}
          className="w-full rounded-lg border-2 border-grey-muted/20 bg-transparent px-3 py-2 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Price display */}
      {isUnique && customPrice ? (
        <div className="p-5 rounded-xl highlight-bordered">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-heading font-bold text-heading">{customPrice}$</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-grey-muted text-xs">
              {tx({
                fr: 'Pièce unique - prix fixé par l\'artiste. Certificat d\'authenticité inclus.',
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
                  fr: 'Ce format n\'est pas disponible dans cette série.',
                  en: 'This format is not available in this series.',
                  es: 'Este formato no esta disponible en esta serie.',
                })}
              </span>
            </div>
          )}
          {priceInfo && (
            <div className="p-4 rounded-xl highlight-bordered">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-heading font-bold text-heading">{priceInfo.price * quantity}$</span>
                    {quantity > 1 && <span className="text-grey-muted text-sm">{quantity} x {priceInfo.price}$</span>}
                  </div>
                  {withFrame && (
                    <div className="text-grey-muted text-xs mt-0.5">
                      {tx({
                        fr: `Tirage ${priceInfo.basePrice}$ + Cadre ${priceInfo.framePrice}$`,
                        en: `Print ${priceInfo.basePrice}$ + Frame ${priceInfo.framePrice}$`,
                        es: `Impresión ${priceInfo.basePrice}$ + Marco ${priceInfo.framePrice}$`,
                      })}
                    </div>
                  )}
                </div>
                {!isUnique && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border border-white/10 text-heading font-bold text-sm flex items-center justify-center hover:border-accent/50 transition-colors">-</button>
                    <span className="text-heading font-bold w-6 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 rounded-lg border border-white/10 text-heading font-bold text-sm flex items-center justify-center hover:border-accent/50 transition-colors">+</button>
                  </div>
                )}
              </div>
              <div className="text-grey-muted text-xs mt-1.5">
                {tier === 'museum'
                  ? tx({ fr: 'Qualité musée - 12 encres pigmentées, conservation 100+ ans', en: 'Museum quality - 12 pigmented inks, 100+ year archival', es: 'Calidad museo - 12 tintas pigmentadas, conservación 100+ años' })
                  : tx({ fr: 'Qualité studio - impression professionnelle pigmentée', en: 'Studio quality - professional pigmented printing', es: 'Calidad estudio - impresión profesional pigmentada' })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add to cart / Vendu */}
      {isSold ? (
        <div className="w-full text-center py-3 rounded-xl bg-grey-muted/20 text-grey-muted text-sm font-semibold">
          {tx({ fr: 'Cette piece unique a ete vendue', en: 'This unique piece has been sold', es: 'Esta pieza unica ha sido vendida' })}
        </div>
      ) : (
        <>
          <button onClick={handleAddToCart} disabled={!effectivePrice} className={`btn-primary w-full justify-center text-sm py-3 ${!effectivePrice ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {added ? (
              <><Check size={18} className="mr-2" />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</>
            ) : (
              <><ShoppingCart size={18} className="mr-2" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar al carrito' })}</>
            )}
          </button>

          <Link to="/panier" className="btn-outline w-full justify-center text-xs py-2.5">
            {tx({ fr: 'Voir le panier', en: 'View cart', es: 'Ver el carrito' })}
          </Link>
        </>
      )}

      <p className="text-grey-muted text-[10px] text-center leading-tight">
        {tx({
          fr: 'Impression pro par Massive. Soft proofing inclus.',
          en: 'Pro printing by Massive. Soft proofing included.',
          es: 'Impresion pro por Massive. Soft proofing incluido.',
        })}
      </p>
    </div>
  );
}

export default ConfiguratorArtistPrint;
