import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Frame, Upload, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../i18n/LanguageContext';
import { useProduct } from '../../hooks/useProducts';
import { useProductPricing } from '../../hooks/useProductPricing';
import FileUpload from '../FileUpload';
// CACHE-BUST (11 mai 2026) : rename PrintPreviewCarousel -> PrintPreviewCarouselV2
// pour forcer Cloudflare a MISS son cache CDN agressif qui servait l'ancien
// chunk meme apres plusieurs commits. Le nom de fichier change donc CF doit
// chercher la nouvelle version sur l'origine.
import PrintPreviewCarousel from '../PrintPreviewCarouselV2';
import {
  fineArtPrinterTiers as defaultTiers, fineArtFormats as defaultFormats, fineArtFramePrice as defaultFramePrice,
  fineArtFramePriceByFormat, getFineArtPrice as defaultGetPrice, fineArtImages,
  getAffichePrice,
} from '../../data/products';

// AFFICHES STANDARD (chantier feat/affiches-standard-et-audit-tarifs) :
// 3e tier "affiche-standard" a cote de Studio/Musee, avec paliers degressifs.
// Les paliers sont fetches depuis Strapi (product slug "affiche-standard"),
// le calcul prix utilise getAffichePrice(format, qty, paliers).
// Mapping IDs : les formats du configurateur sont en minuscules (a4, a3, a3plus)
// mais les cles paliers dans Strapi sont en majuscules (A4, A3, A3+).
const FORMAT_ID_TO_PALIER_KEY = { a4: 'A4', a3: 'A3', a3plus: 'A3+' };
const AFFICHE_STANDARD_TIER = {
  id: 'affiche-standard',
  labelFr: 'Affiches Standard',
  labelEn: 'Standard Posters',
  labelEs: 'Carteles Estandar',
  descFr: 'Volume / evenementiel',
  descEn: 'Volume / events',
  descEs: 'Volumen / eventos',
};

function FramePreview({ image, withFrame, frameColor, format, formats, tx, isLandscape, onClickImage }) {
  const fmt = formats.find(f => f.id === format);
  const fmtW = fmt?.w || 8.5;
  const fmtH = fmt?.h || 11;

  // Orientation: A6 = portrait par defaut (cadre photo 5x7), autres = portrait
  // L'image uploadee peut forcer paysage
  const isPostcard = format === 'postcard';
  const useLandscape = image ? isLandscape : false;
  const w = useLandscape ? Math.max(fmtW, fmtH) : Math.min(fmtW, fmtH);
  const h = useLandscape ? Math.min(fmtW, fmtH) : Math.max(fmtW, fmtH);

  // A6 avec cadre = cadre photo 5x7" (image 4x6 dans cadre 5x7)
  // Les autres = cadre ajuste au format du print
  const frameW = isPostcard && withFrame ? (useLandscape ? 7 : 5) : w;
  const frameH = isPostcard && withFrame ? (useLandscape ? 5 : 7) : h;

  // Taille du preview proportionnelle
  const maxDim = Math.max(fmtW, fmtH);
  const scaleFactor = 320 / 24; // A2 = 320px max
  const previewMaxW = Math.max(180, Math.round(maxDim * scaleFactor));

  // Epaisseur du cadre proportionnelle
  // A6: cadre plus fin (cadre photo), passe-partout plus epais (espace 5x7 -> 4x6)
  const frameThickness = withFrame ? (isPostcard ? Math.max(6, Math.round(previewMaxW * 0.035)) : Math.max(8, Math.round(previewMaxW * 0.04))) : 0;
  const matThickness = withFrame ? (isPostcard ? Math.max(16, Math.round(previewMaxW * 0.1)) : Math.max(12, Math.round(previewMaxW * 0.06))) : 0;

  return (
    <div className="flex items-center justify-center p-2">
      <div
        className={`relative transition-all duration-500 ease-out ${image && onClickImage ? 'cursor-zoom-in' : ''}`}
        onClick={image && onClickImage ? onClickImage : undefined}
        style={{
          aspectRatio: withFrame ? `${frameW}/${frameH}` : `${w}/${h}`,
          width: '100%',
          maxWidth: `${previewMaxW}px`,
        }}
      >
        {withFrame ? (
          <div
            className="w-full h-full transition-all duration-500"
            style={{
              border: `${frameThickness}px solid ${frameColor === 'white' ? '#e5e5e5' : '#1a1a1a'}`,
              padding: `${matThickness}px`,
              background: '#ffffff',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            }}
          >
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-300">
                  <ImageIcon size={28} className="mx-auto mb-1" />
                  <p className="text-[10px]">{tx({ fr: 'Votre image ici', en: 'Your image here', es: 'Tu imagen aqui' })}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-white flex items-center justify-center" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-center text-gray-300">
                <ImageIcon size={28} className="mx-auto mb-1" />
                <p className="text-[10px]">{tx({ fr: 'Deposez votre image', en: 'Drop your image', es: 'Deposita tu imagen' })}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfiguratorFineArt() {
  const { lang, tx } = useLang();
  const { addToCart } = useCart();
  // PRIX-HARDCODE : on IGNORE les champs de pricing du CMS.
  // La grille officielle vit uniquement dans utils/pricingData.js.
  const cmsProduct = useProduct('fine-art');
  const pd = cmsProduct?.pricingData;

  const fineArtPrinterTiers = defaultTiers;
  const fineArtFormats = defaultFormats;
  const fineArtFramePrice = defaultFramePrice;

  const [tier, setTier] = useState('studio');
  const [format, setFormat] = useState('a4');
  const [withFrame, setWithFrame] = useState(false);
  const [frameColor, setFrameColor] = useState('black');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // CLICKABLE-PREVIEW : ref vers FileUpload pour pouvoir declencher le
  // file picker depuis un clic sur la zone placeholder (mockup-massive-print)
  // ci-dessous. Pattern identique a ConfiguratorStickers (VERSION FINALE
  // GELEE du 12 mai 2026, regles dures : cursor:pointer seul, pas d'overlay).
  const fileUploadRef = useRef(null);
  const openFilePicker = () => fileUploadRef.current?.openPicker?.();

  // AFFICHES STANDARD : fetch direct via API (useProductPricing accepte un slug
  // et retourne pricingData). useProduct (ligne au-dessus) reste null car le
  // ProductsProvider est encore desactive, mais useProductPricing fonctionne
  // independamment et est deja prouve fonctionnel pour les autres consumers.
  const { pricingData: afficheData } = useProductPricing('affiche-standard');
  const afficheStandardPaliers = afficheData?.afficheStandardPaliers || null;

  // Liste des 3 tiers (Studio + Musee + Affiches Standard) construite localement.
  // On ne touche pas fineArtPrinterTiers (data store) : c'est utilise ailleurs.
  const allTiers = [...fineArtPrinterTiers, AFFICHE_STANDARD_TIER];
  const isAfficheStandard = tier === 'affiche-standard';

  // Reset qty=1 quand on quitte Affiches Standard (Studio/Musee n'utilisent
  // pas le degressif, donc qty>1 n'a pas de sens commercial pour eux).
  useEffect(() => {
    if (!isAfficheStandard) setQuantity(1);
  }, [isAfficheStandard]);

  // Forcer withFrame=false en mode Affiches Standard (l'option Cadre est
  // exclusive aux Series Studio/Musee, pas pour les commandes en volume).
  useEffect(() => {
    if (isAfficheStandard && withFrame) setWithFrame(false);
  }, [isAfficheStandard, withFrame]);

  // Auto-switch vers un format compatible si on entre en Affiches Standard
  // avec un format non supporte (postcard/a2/sq*) : fallback sur A3.
  useEffect(() => {
    if (isAfficheStandard && !FORMAT_ID_TO_PALIER_KEY[format]) {
      setFormat('a3');
    }
  }, [isAfficheStandard, format]);

  // PRIX-HARDCODE : lookup strict dans pricingData.FINE_ART_GRID via defaultGetPrice.
  const getFineArtPrice = defaultGetPrice;

  // Branche le calcul de prix selon le tier :
  //   - studio/museum -> getFineArtPrice (existant, a l'unite + cadre optionnel)
  //   - affiche-standard -> getAffichePrice(format, qty, paliers) du helper
  //     unit-teste a l'etape 3 (51 tests verts)
  const affichePriceUnit = isAfficheStandard
    ? getAffichePrice(FORMAT_ID_TO_PALIER_KEY[format] || null, quantity, afficheStandardPaliers)
    : null;
  const priceInfo = isAfficheStandard
    ? (affichePriceUnit != null ? { price: affichePriceUnit } : null)
    : getFineArtPrice(tier, format, withFrame);

  const tierLabel = allTiers.find(t => t.id === tier);
  const formatLabel = fineArtFormats.find(f => f.id === format);

  // Info palier (actuel + prochain) pour l'affichage UX en mode Affiches
  // Standard. Calcule a partir du JSON paliers, sans recoder la logique de
  // lookup : on parcourt la meme liste triee que getAffichePrice utilise.
  const palierInfo = (() => {
    if (!isAfficheStandard) return null;
    const palierKey = FORMAT_ID_TO_PALIER_KEY[format];
    const formatPaliers = palierKey ? afficheStandardPaliers?.[palierKey] : null;
    if (!formatPaliers || typeof formatPaliers !== 'object') return null;
    const sorted = Object.entries(formatPaliers)
      .map(([k, v]) => [Number(k), v])
      .filter(([k, v]) => Number.isInteger(k) && k > 0 && typeof v === 'number' && v > 0)
      .sort((a, b) => a[0] - b[0]);
    if (sorted.length === 0) return null;
    let current = null;
    let next = null;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i][0] <= quantity) {
        current = { qty: sorted[i][0], unit: sorted[i][1] };
        next = sorted[i + 1] ? { qty: sorted[i + 1][0], unit: sorted[i + 1][1] } : null;
      }
    }
    if (!current) return null;
    const nextSaving = next ? next.qty * (current.unit - next.unit) : null;
    return { current, next, nextSaving };
  })();

  // Images uploadees (filtrer que les images)
  const imageFiles = useMemo(() => uploadedFiles.filter(f => f.mime?.startsWith('image/')), [uploadedFiles]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  // FIX-SQUARE (23 avril 2026) : detection carre (tolerance 3%) pour filtrer
  // les formats proposes et swap le cadre de preview. Un ratio 0.97-1.03 est
  // considere carre - couvre les images legerement croppees par le client.
  const [isSquare, setIsSquare] = useState(false);

  // Reset index si les fichiers changent
  useEffect(() => {
    if (activeImageIdx >= imageFiles.length) setActiveImageIdx(Math.max(0, imageFiles.length - 1));
  }, [imageFiles.length]);

  const previewImage = imageFiles[activeImageIdx]?.url || null;

  // Detecter orientation de l'image active (landscape + square)
  useEffect(() => {
    if (!previewImage) { setIsLandscape(false); setIsSquare(false); return; }
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;
      const ratio = w / h;
      const square = ratio >= 0.97 && ratio <= 1.03;
      setIsSquare(square);
      setIsLandscape(!square && w > h);
    };
    img.src = previewImage;
  }, [previewImage]);

  // FIX-UX (23 avril 2026 v2) : filtrage NON-strict. L'admin / client peut
  // toujours choisir un format portrait (A4, A3, etc.) pour une image carree,
  // il sera juste crope par object-fit. On s'est rendu compte que le filtrage
  // strict (ancien comportement, masquant les portrait quand isSquare) faisait
  // peur au client qui voulait garder la liberte de choix.
  //
  // Nouvelle regle :
  //   - Image carree (isSquare=true)  -> AFFICHE tout (rectangles + carres)
  //   - Image rectangulaire (isSquare=false) -> AFFICHE uniquement les rectangles
  //     (les carres n'ont aucun sens pour une image portrait/paysage)
  //
  // Ordre d'affichage : les rectangles d'abord (ordre historique A6 -> A2),
  // puis les carres a la fin (sq8, sq10, sq12). L'admin peut voir les options
  // carres comme "aussi disponible" sans les considerer comme default.
  const visibleFormats = useMemo(() => {
    if (!isSquare) {
      // Image portrait/paysage : on cache les formats carres (inutile pour
      // une image non-1:1, ca forcerait un crop enorme).
      return fineArtFormats.filter(f => (f.shape || 'rect') !== 'square');
    }
    // Image carree : rectangles d'abord, puis carres
    const rects = fineArtFormats.filter(f => (f.shape || 'rect') !== 'square');
    const squares = fineArtFormats.filter(f => (f.shape || 'rect') === 'square');
    return [...rects, ...squares];
  }, [fineArtFormats, isSquare]);

  // Auto-selection : si le format courant sort de la liste visible (ex: l'admin
  // avait selectionne sq12 puis uploade une image portrait qui cache les
  // carres), on revient sur A4 par defaut. JAMAIS d'auto-switch vers un format
  // carre - l'utilisateur choisit explicitement s'il veut imprimer en carre.
  useEffect(() => {
    const isCurrentVisible = visibleFormats.some(f => f.id === format);
    if (!isCurrentVisible) {
      const fallback = visibleFormats.find(f => f.id === 'a4') || visibleFormats[0];
      if (fallback) setFormat(fallback.id);
    }
  }, [visibleFormats, format]);

  const canAddToCart = uploadedFiles.length > 0 || notes.trim().length > 0;

  const handleAddToCart = () => {
    if (!priceInfo || !canAddToCart) return;

    // Edge case : si l'utilisateur efface l'input qty et clique "Ajouter au
    // panier" sans avoir blur (le onBlur normalement clamp a 1), quantity
    // peut etre 0. Sans cette protection, totalPrice serait 0$ envoye au
    // panier (Studio/Musee qui ont priceInfo non-null avec qty=0). Clamp
    // defensif a 1 minimum, utilise pour les deux branches ci-dessous.
    const safeQty = Math.max(1, quantity || 1);

    // AFFICHES STANDARD : branche dediee. SKU sans cadre (pas d'option en
    // mode volume), productName/finish distincts, et metadata palierApplique
    // pour audit posterieur (analytics + verification ad hoc cote admin).
    if (isAfficheStandard) {
      const cartSku = `affiche-standard-${format}`;
      addToCart({
        productId: 'affiche-standard',
        sku: cartSku,
        productName: tx({ fr: 'Affiche Standard', en: 'Standard Poster', es: 'Cartel Estandar' }),
        finish: tx({ fr: 'Affiches Standard', en: 'Standard Posters', es: 'Carteles Estandar' }),
        shape: null,
        size: formatLabel?.label,
        quantity: safeQty,
        unitPrice: priceInfo.price,
        totalPrice: priceInfo.price * safeQty,
        image: fineArtImages[0],
        uploadedFiles,
        notes,
        meta: {
          palierApplique: palierInfo?.current?.qty || null,
          prixUnitairePalier: priceInfo.price,
        },
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      return;
    }

    // STUDIO / MUSEE (existant, inchange).
    // INVENTORY-A1 (2026-05-13) : SKU deterministe pour permettre au backend
    // (order.ts ligne 1364, `item.sku || item.slug`) de decrementer le
    // papier/consommable correspondant. Le SKU inclut le tier (qualite
    // papier), le format et l'option cadre. L'admin peut creer un
    // inventory item par combinaison ou utiliser le suffixe -NNN auto-genere
    // (le backend gere les deux via exact match + prefix fallback).
    const cartSku = withFrame
      ? `fine-art-${tier}-${format}-frame-${frameColor}`
      : `fine-art-${tier}-${format}`;
    addToCart({
      productId: 'fine-art-print',
      sku: cartSku,
      productName: tx({ fr: 'Impression Fine Art', en: 'Fine Art Print', es: 'Impresion Fine Art' }),
      finish: tx({ fr: tierLabel?.labelFr, en: tierLabel?.labelEn, es: tierLabel?.labelEn }),
      shape: withFrame
        ? tx({
            fr: `Cadre ${frameColor === 'black' ? 'noir' : 'blanc'}`,
            en: `${frameColor === 'black' ? 'Black' : 'White'} frame`,
            es: `Marco ${frameColor === 'black' ? 'negro' : 'blanco'}`,
          })
        : null,
      size: formatLabel?.label,
      quantity: safeQty,
      unitPrice: priceInfo.price,
      totalPrice: priceInfo.price * safeQty,
      image: fineArtImages[0],
      uploadedFiles,
      notes,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    // FIX-Z (3 mai 2026) : z-10 sur le wrapper du configurateur + ses
    // colonnes pour qu'aucun stacking context interne (sticky, transform)
    // ne puisse remonter au-dessus des lightboxes (qui sont a z-[99999]).
    <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
      {/* ========== COLONNE GAUCHE : Preview + Upload ========== */}
      <div className="md:w-[35%] lg:w-[30%] flex-shrink-0 relative z-10">
        <div className="md:sticky md:top-28 z-10">
          {/* FIX-OVERFLOW (1 mai 2026) : conteneurs strictement bornes.
              COMPACT v3 (1 mai 2026) : mb-3 entre dropzone et apercu pour
              maximiser le compactage de la colonne gauche et eliminer le
              gap visible a droite quand la colonne droite est plus haute. */}
          <div className="relative overflow-hidden w-full mb-3">
            <FileUpload
              ref={fileUploadRef}
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
              label={tx({ fr: 'Votre fichier', en: 'Your file', es: 'Tu archivo' })}
              compact
              hidePreview
            />
          </div>
          {/* Apercu (mission UX 1 mai 2026) :
              - Pas d'upload : image statique par defaut (mockup brand
                Massive print) plate, juste un visuel d'inspiration.
              - Upload present : carrousel complet (FramePreview CSS +
                slides mockups environnementaux filtres par orientation).
              COMPACT v3 (1 mai 2026) : max-h-[400px] sur les deux
              wrappers + object-contain pour borner la hauteur de
              l'apercu et eviter qu'il pousse la colonne plus bas que
              la colonne de droite. */}
          {previewImage ? (
            // FIX-PREVIEW (4 mai 2026) : retire max-h-[400px] + flex centering
            // qui ecrasaient le carrousel a quelques pixels. Maintenant
            // le wrapper s'expand avec le contenu, w-full pour reactivite.
            <div className="relative w-full overflow-hidden">
              <PrintPreviewCarousel
                image={previewImage}
                withFrame={withFrame}
                frameColor={frameColor}
                format={format}
                formats={fineArtFormats}
                tx={tx}
                isLandscape={isLandscape}
                isSquare={isSquare}
                // DATA-DRIVEN ORIENTATION (11 mai 2026) : on passe l'orientation
                // explicite calculee localement (isSquare/isLandscape ont deja
                // detecte le ratio via naturalWidth/Height sur le file upload
                // - aucun CORS issue car blob: URL local). PrintPreviewCarousel
                // utilise cette valeur en PRIORITE ABSOLUE pour filter scenes.
                orientation={isSquare ? 'square' : (isLandscape ? 'landscape' : 'portrait')}
                onClickImage={() => setLightboxOpen(true)}
              />
            </div>
          ) : (
            // CLICKABLE-PREVIEW (cf. ConfiguratorStickers VERSION FINALE GELEE
            // du 12 mai 2026) : zone placeholder entiere cliquable pour
            // declencher le file picker. REGLES DURES : cursor:pointer seul,
            // aucun overlay sombre / icone / texte / flou / assombrissement
            // au hover. Accessibilite preservee (role/tabIndex/aria-label/
            // clavier Enter+Space). Quand previewImage existe (branche au-
            // dessus), le carrousel garde son comportement actuel (clic =
            // lightbox via onClickImage) ; pour changer une image deja
            // uploadee, l'utilisateur passe par le bouton FileUpload en haut.
            <div
              className="relative w-full rounded-xl shadow-lg bg-black/10 overflow-hidden cursor-pointer"
              onClick={openFilePicker}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilePicker(); } }}
              role="button"
              tabIndex={0}
              aria-label={tx({ fr: 'Televerser une image', en: 'Upload an image', es: 'Subir una imagen' })}
            >
              <img
                src="/images/thumbs/mockup-massive-print.webp"
                alt=""
                className="w-full h-auto max-h-96 object-contain block"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>

      {/* ========== COLONNE DROITE : Selecteurs ========== */}
      <div className="flex-1 min-w-0 space-y-4 relative z-10">
        {/* HIERARCHIE-UI (30 avril 2026) : la case a cocher Cadre a ete
            deplacee SOUS la section Format (cf. plus bas) pour suivre
            l'ordre logique de selection : qualite -> format -> cadre. */}

        {/* Qualite */}
        <div>
          <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2.5">
            {tx({ fr: 'Qualite', en: 'Quality', es: 'Calidad' })}
          </label>
          <div className="flex gap-2">
            {allTiers.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTier(t.id);
                  // Si on switch vers Studio/Musee avec un format invisible
                  // pour ce tier (A2 Studio = null par ex.), fallback A4.
                  // Le cas affiche-standard est gere par un useEffect dedie
                  // qui force a3 si le format n'est pas dans {a4,a3,a3plus}.
                  if (t.id !== 'affiche-standard') {
                    const curFmt = fineArtFormats.find(f => f.id === format);
                    const price = t.id === 'museum' ? curFmt?.museumPrice : curFmt?.studioPrice;
                    if (price == null) setFormat('a4');
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-base font-semibold transition-all border-2 ${tier === t.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-transparent bg-white/5 text-grey-muted hover:bg-white/8 hover:text-heading'
                }`}
              >
                {tx({ fr: t.labelFr, en: t.labelEn, es: t.labelEn })}
                <span className="block text-xs font-normal mt-1 opacity-70">
                  {tx({ fr: t.descFr, en: t.descEn, es: t.descEn })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Format : toujours en grille 5 colonnes. Pour une image carree, les 3
            formats carres (sq8/sq10/sq12) sont ajoutes en 2e rangee apres les
            rectangulaires. L'utilisateur garde la liberte de choisir portrait
            meme pour une image 1:1 (cropping automatique via object-fit:cover). */}
        <div>
          <label className="block text-heading font-semibold text-sm uppercase tracking-wider mb-2.5">
            {tx({ fr: 'Format', en: 'Format', es: 'Formato' })}
            {isSquare && previewImage && (
              <span className="ml-2 text-[13px] font-normal text-grey-muted/70 normal-case tracking-normal">
                {tx({
                  fr: '(formats carres aussi disponibles pour votre image 1:1)',
                  en: '(square formats also available for your 1:1 image)',
                  es: '(formatos cuadrados tambien disponibles)',
                })}
              </span>
            )}
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {visibleFormats.map(f => {
              // Calcul prix + disponibilite selon tier.
              // - studio/museum : prix unitaire fixe lu dans fineArtFormats
              // - affiche-standard : prix unitaire du palier COURANT (lookup
              //   getAffichePrice avec quantity actuelle), seulement pour
              //   A4/A3/A3+. Autres formats (postcard/a2/sq*) -> grises avec
              //   tooltip explicite pour rediriger vers la bonne categorie.
              let price = null;
              let isAvailable = false;
              let disabledTooltip = null;
              if (isAfficheStandard) {
                const palierKey = FORMAT_ID_TO_PALIER_KEY[f.id];
                if (palierKey) {
                  price = getAffichePrice(palierKey, quantity, afficheStandardPaliers);
                  isAvailable = price != null;
                } else {
                  isAvailable = false;
                  if (f.id === 'postcard') {
                    disabledTooltip = tx({
                      fr: 'A6 disponible dans la categorie Flyers',
                      en: 'A6 available in Flyers category',
                      es: 'A6 disponible en la categoria Flyers',
                    });
                  } else if (f.id === 'a2') {
                    disabledTooltip = tx({
                      fr: 'Sur soumission, contactez-nous',
                      en: 'On request, contact us',
                      es: 'A pedido, contactenos',
                    });
                  } else {
                    disabledTooltip = tx({
                      fr: 'Format non disponible en Affiches Standard',
                      en: 'Format not available in Standard Posters',
                      es: 'Formato no disponible en Carteles Estandar',
                    });
                  }
                }
              } else {
                price = tier === 'museum' ? f.museumPrice : f.studioPrice;
                isAvailable = price != null;
              }
              const scale = 2.8;
              const rectH = Math.max(24, Math.round((f.h || 11) * scale));
              const rectW = Math.max(16, Math.round((f.w || 8.5) * scale));
              return (
                <button
                  key={f.id}
                  onClick={() => isAvailable && setFormat(f.id)}
                  disabled={!isAvailable}
                  title={disabledTooltip || f.typeName || f.label}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-lg transition-all border-2 ${
                    !isAvailable
                      ? 'opacity-25 cursor-not-allowed border-transparent bg-white/3'
                      : format === f.id
                      ? 'border-accent bg-accent/10'
                      : 'border-transparent bg-white/5 hover:bg-white/8 hover:border-grey-muted/20'
                  }`}
                >
                  <div
                    className={`rounded-[2px] mb-1.5 ${
                      format === f.id ? 'bg-accent/40' : 'bg-white/10'
                    }`}
                    style={{ width: `${rectW}px`, height: `${rectH}px` }}
                  />
                  <span className={`text-sm font-bold leading-tight ${format === f.id ? 'text-accent' : 'text-heading'}`}>
                    {f.label}
                  </span>
                  {f.typeName && (
                    <span className={`text-[11px] ${format === f.id ? 'text-accent/70' : 'text-grey-muted/60'}`}>
                      {f.typeName}
                    </span>
                  )}
                  <span className={`text-sm font-semibold ${format === f.id ? 'text-accent' : 'text-grey-muted'}`}>
                    {isAvailable ? (isAfficheStandard ? `${price}$/u` : `${price}$`) : 'N/A'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cadre - case a cocher + couleurs. Position : APRES Format pour
            respecter la hierarchie logique de selection (la presence d'un
            cadre depend du format choisi - certains formats n'ont pas de
            prix de cadre).
            AFFICHES STANDARD : option Cadre cachee (pas pertinent en volume,
            le state withFrame est force a false par useEffect plus haut). */}
        {!isAfficheStandard && (
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={withFrame} onChange={(e) => setWithFrame(e.target.checked)} className="sr-only" />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${withFrame ? 'bg-accent border-accent' : 'border-grey-muted/50'}`}>
                {withFrame && <Check size={12} className="text-white" />}
              </div>
              <span className="text-heading text-base font-semibold">{tx({ fr: 'Cadre', en: 'Frame', es: 'Marco' })}</span>
              <span className="text-accent text-sm font-semibold">+{fineArtFramePriceByFormat[format] || fineArtFramePrice}$</span>
            </label>
            {withFrame && (
              <div className="flex gap-1.5">
                <button onClick={() => setFrameColor('black')}
                  className={`w-6 h-6 rounded-full bg-black border-2 transition-all ${frameColor === 'black' ? 'border-accent scale-110' : 'border-grey-muted/30'}`} />
                <button onClick={() => setFrameColor('white')}
                  className={`w-6 h-6 rounded-full bg-white border-2 transition-all ${frameColor === 'white' ? 'border-accent scale-110' : 'border-grey-muted/30'}`} />
              </div>
            )}
          </div>
        )}

        {/* AFFICHES STANDARD : affichage du palier actif + prochain palier.
            Visible uniquement en mode affiche-standard, sous l'emplacement du
            Cadre (cache). Calcul issu de palierInfo (current + next + saving). */}
        {isAfficheStandard && palierInfo && (
          <div className="rounded-lg bg-accent/5 border border-accent/20 px-3 py-2.5">
            <p className="text-heading text-sm font-semibold">
              {tx({
                fr: `${quantity} unite${quantity > 1 ? 's' : ''} a ${palierInfo.current.unit}$/u = ${quantity * palierInfo.current.unit}$`,
                en: `${quantity} unit${quantity > 1 ? 's' : ''} at ${palierInfo.current.unit}$/u = ${quantity * palierInfo.current.unit}$`,
                es: `${quantity} unidad${quantity > 1 ? 'es' : ''} a ${palierInfo.current.unit}$/u = ${quantity * palierInfo.current.unit}$`,
              })}
            </p>
            {palierInfo.next && (
              <p className="text-grey-muted text-xs mt-1">
                {tx({
                  fr: `Prochain palier : ${palierInfo.next.qty} unites a ${palierInfo.next.unit}$/u (economie de ${palierInfo.nextSaving}$)`,
                  en: `Next tier: ${palierInfo.next.qty} units at ${palierInfo.next.unit}$/u (save ${palierInfo.nextSaving}$)`,
                  es: `Proximo nivel: ${palierInfo.next.qty} unidades a ${palierInfo.next.unit}$/u (ahorro ${palierInfo.nextSaving}$)`,
                })}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={tx({ fr: 'Notes ou instructions (optionnel)', en: 'Notes or instructions (optional)', es: 'Notas o instrucciones (opcional)' })}
          className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-heading placeholder:text-grey-muted/40 focus:bg-white/8 focus:outline-none transition-colors resize-none"
        />

        {/* Prix + bouton panier - aligne a droite */}
        {priceInfo && (
          <div className="flex items-center justify-end gap-3 flex-wrap">
            <div className="flex-shrink-0 text-right">
              <span className="text-2xl md:text-3xl font-heading font-bold text-heading">{priceInfo.price * quantity}$</span>
              {quantity > 1 && (
                <span className="text-grey-muted text-sm ml-1.5">{quantity} × {priceInfo.price}$</span>
              )}
              {withFrame && quantity === 1 && (
                <span className="text-grey-muted text-sm ml-1.5">
                  ({priceInfo.basePrice}+{priceInfo.framePrice})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg border border-white/10 text-heading font-bold text-base flex items-center justify-center hover:border-accent/50">-</button>
              {/* Input clavier editable : pattern hybride [-] [input] [+].
                  Utile en mode Affiches Standard pour aller a 100 sans 99 clics.
                  type="text" + inputMode="numeric" : clavier numerique mobile,
                  sans les spinners HTML5 natifs (peu esthetiques sur w-14).
                  Regex onChange ne laisse passer que les chiffres. Vide
                  temporaire autorise pendant l'edition, clamp a 1 au blur
                  si vide ou < 1. */}
              <input
                type="text"
                inputMode="numeric"
                value={quantity || ''}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setQuantity(cleaned === '' ? 0 : parseInt(cleaned, 10));
                }}
                onBlur={() => {
                  if (!quantity || quantity < 1) setQuantity(1);
                }}
                aria-label={tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })}
                className="w-14 h-9 rounded-lg border border-white/10 bg-transparent text-heading font-bold text-base text-center focus:border-accent/50 focus:outline-none"
              />
              <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 rounded-lg border border-white/10 text-heading font-bold text-base flex items-center justify-center hover:border-accent/50">+</button>
            </div>
            <button onClick={handleAddToCart} disabled={!canAddToCart} className={`btn-primary justify-center text-base py-2.5 px-6 ${!canAddToCart ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {added ? (
                <><Check size={16} className="mr-1.5" />{tx({ fr: 'Ajoute!', en: 'Added!', es: 'Agregado!' })}</>
              ) : (
                <><ShoppingCart size={16} className="mr-1.5" />{tx({ fr: 'Ajouter au panier', en: 'Add to cart', es: 'Agregar' })}</>
              )}
            </button>
          </div>
        )}

      </div>

      {/* Lightbox avec cadre/bordures
          FIX-PORTAL (3 mai 2026) : createPortal vers document.body. Le
          parent (column sticky md:sticky top-28 + transform AnimatePresence
          + le wrapper du configurateur) cree un stacking context qui
          isolait z-[99999] - la lightbox restait sous le panneau de config
          transparent. Le portal sort completement du DOM tree, garantit
          que la modale rend au-dessus de tout. */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {lightboxOpen && previewImage && (() => {
            const fmt = fineArtFormats.find(f => f.id === format);
            const fW = fmt?.w || 8.5;
            const fH = fmt?.h || 11;
            const lbLandscape = isLandscape;
            const imgW = lbLandscape ? Math.max(fW, fH) : Math.min(fW, fH);
            const imgH = lbLandscape ? Math.min(fW, fH) : Math.max(fW, fH);
            const borderPx = withFrame ? 16 : 0;
            const matPx = withFrame ? 24 : 12;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center cursor-zoom-out"
                onClick={() => setLightboxOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="relative"
                  style={{
                    aspectRatio: `${imgW}/${imgH}`,
                    maxWidth: '80vw',
                    maxHeight: '85vh',
                    width: lbLandscape ? '70vw' : '50vw',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      border: withFrame ? `${borderPx}px solid ${frameColor === 'white' ? '#e5e5e5' : '#1a1a1a'}` : 'none',
                      padding: `${matPx}px`,
                      background: '#ffffff',
                      boxShadow: '0 12px 60px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div className="relative w-full h-full watermark-light">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  {/* Info format sous le cadre */}
                  <p className="text-center text-white/60 text-sm mt-3">
                    {fmt?.label} · {tier === 'museum' ? tx({ fr: 'Musée', en: 'Museum', es: 'Museo' }) : 'Studio'}
                    {withFrame && ` · ${tx({ fr: 'Cadre', en: 'Frame', es: 'Marco' })} ${frameColor === 'white' ? tx({ fr: 'blanc', en: 'white', es: 'blanco' }) : tx({ fr: 'noir', en: 'black', es: 'negro' })}`}
                  </p>
                </motion.div>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors"
                >
                  &times;
                </button>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

export default ConfiguratorFineArt;
