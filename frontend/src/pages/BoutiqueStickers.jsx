import { useState, useMemo } from 'react';
import { Scissors, Shield, Sparkles, Truck, Droplets, Tag, Gift, Music, Package } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorStickers from '../components/configurators/ConfiguratorStickers';
import { useProduct } from '../hooks/useProducts';
import { mediaUrl } from '../utils/cms';
import { useLang } from '../i18n/LanguageContext';
import { stickerImages, stickerFaq as defaultFaq } from '../data/products';
import { img } from '../utils/paths';

// Image de finition par type (affichee en premier dans la galerie)
const finishImages = {
  clear: img('/images/stickers/finish-matte.webp'),
  glossy: img('/images/stickers/finish-glossy.webp'),
  holographic: img('/images/stickers/finish-holographic.webp'),
  'broken-glass': img('/images/stickers/finish-broken-glass.webp'),
  stars: img('/images/stickers/finish-stars.webp'),
};

function BoutiqueStickers() {
  const { lang } = useLang();
  const cmsProduct = useProduct('stickers');
  const stickerFaq = cmsProduct ? { fr: cmsProduct.faqFr || defaultFaq.fr, en: cmsProduct.faqEn || defaultFaq.en, es: cmsProduct?.faqEs || defaultFaq.es } : defaultFaq;
  const cmsImages = cmsProduct?.images?.length ? cmsProduct.images.map(i => mediaUrl(i)) : null;

  const [selectedFinish, setSelectedFinish] = useState('clear');

  // Image de finition en premier, puis les images de realisations
  const allImages = useMemo(() => {
    if (cmsImages) return cmsImages;
    const finishImg = finishImages[selectedFinish];
    return finishImg ? [finishImg, ...stickerImages] : stickerImages;
  }, [selectedFinish, cmsImages]);
  // FIX-PRICING-TIERS (27 avril 2026) : suppression des mentions "Design inclus"
  // alignement sur la nouvelle politique - le client fournit son fichier pret
  // a imprimer, le service de design est facture a part. On remplace par un
  // trust signal alternatif (Proof avant impression) qui reste vrai et utile.
  const trustItems = [
    { icon: Scissors, fr: 'D\u00e9coupe pr\u00e9cision', en: 'Precision cutting', es: 'Corte de precisi\u00f3n' },
    { icon: Shield, fr: 'Durabilit\u00e9 3-5 ans', en: '3-5 year durability', es: 'Durabilidad 3-5 a\u00f1os' },
    { icon: Sparkles, fr: 'Proof avant impression', en: 'Digital proof included', es: 'Prueba antes de imprimir' },
    { icon: Truck, fr: 'Livraison locale gratuite', en: 'Free local delivery', es: 'Env\u00edo local gratis' },
  ];

  const features = [
    { icon: Scissors, fr: 'D\u00e9coupe de pr\u00e9cision', en: 'Precision cutting', es: 'Corte de precisi\u00f3n', descFr: 'Contour cut professionnel \u00e0 la forme exacte de votre design. \u00c9quipement pro jusqu\'au 12" de large.', descEn: 'Professional contour cutting to the exact shape of your design. Pro equipment up to 12" wide.', descEs: 'Corte de contorno profesional a la forma exacta de tu dise\u00f1o. Equipo profesional hasta 12" de ancho.' },
    { icon: Droplets, fr: 'R\u00e9sistant \u00e0 tout', en: 'Weather resistant', es: 'Resistente a todo', descFr: 'Lamination int\u00e9gr\u00e9e. Eau, UV, rayures - vos stickers durent 3 \u00e0 5 ans en ext\u00e9rieur.', descEn: 'Integrated lamination. Water, UV, scratches - your stickers last 3-5 years outdoors.', descEs: 'Laminaci\u00f3n integrada. Agua, UV, rayaduras - tus stickers duran de 3 a 5 a\u00f1os en exteriores.' },
    { icon: Sparkles, fr: 'Proof avant impression', en: 'Digital proof included', es: 'Prueba antes de imprimir', descFr: 'On envoie un proof num\u00e9rique pour validation avant production. Couleurs, forme, d\u00e9tails - tu valides tout avant l\'impression.', descEn: 'We send a digital proof for validation before production. Colors, shape, details - you validate everything before printing.', descEs: 'Enviamos una prueba digital para validaci\u00f3n antes de la producci\u00f3n. Colores, forma, detalles - validas todo antes de imprimir.' },
  ];

  const useCases = [
    { icon: Tag, fr: 'Branding', en: 'Branding', es: 'Branding', descFr: 'Logo sur produits, emballages', descEn: 'Logo on products, packaging', descEs: 'Logo en productos, empaques' },
    { icon: Music, fr: 'Événements', en: 'Events', es: 'Eventos', descFr: 'Merch de concert, festivals', descEn: 'Concert merch, festivals', descEs: 'Merch de conciertos, festivales' },
    { icon: Gift, fr: 'Emballage', en: 'Packaging', es: 'Empaque', descFr: 'Étiquettes pour vos produits', descEn: 'Labels for your products', descEs: 'Etiquetas para tus productos' },
    { icon: Package, fr: 'Promotions', en: 'Promotions', es: 'Promociones', descFr: 'Giveaways, lancement', descEn: 'Giveaways, launches', descEs: 'Giveaways, lanzamientos' },
  ];

  const ctaLinks = [
    { to: '/boutique/design', fr: 'Design', en: 'Design', es: 'Dise\u00f1o' },
    { to: '/boutique/fine-art', fr: 'Prints', en: 'Prints', es: 'Prints' },
    { to: '/boutique/sublimation', fr: 'Merch', en: 'Merch', es: 'Merch' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="stickers-custom"
      startingPrice={30}
      pageTitle={{ fr: 'Stickers Die-Cut Montréal - Autocollants Personnalisés | Massive', en: 'Die-Cut Stickers Montreal - Custom Stickers | Massive', es: 'Stickers Die-Cut Montreal - Pegatinas Personalizadas | Massive' }}
      metaDescription={{
        fr: 'Stickers die-cut personnalisés à Montréal. Vinyle matte, glossy, holographique, verre brisé. Découpe de précision, 3 paliers de prix selon la taille. À partir de 25 unités. Production locale Mile-End.',
        en: 'Custom die-cut stickers in Montreal. Matte, glossy, holographic, broken glass vinyl. Precision cutting, 3 size-based price tiers. From 25 units. Local production Mile-End.',
        es: 'Pide tus stickers personalizados. Vinilo mate, brillante, hologr\u00e1fico, vidrio roto, estrellas. Corte de precisi\u00f3n. 3 niveles de precio seg\u00fan el tama\u00f1o.',
      }}
      productTitle={{ fr: 'Stickers Custom', en: 'Custom Stickers', es: 'Stickers Personalizados' }}
      productSubtitle={{
        fr: 'Autocollants d\u00e9coup\u00e9s sur mesure. 3 paliers de prix selon la taille.',
        en: 'Custom die-cut stickers. 3 price tiers based on size.',
        es: 'Stickers troquelados a medida. 3 niveles de precio seg\u00fan el tama\u00f1o.',
      }}
      badge={{ fr: 'Production locale', en: 'Local production', es: 'Producci\u00f3n local', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nos stickers?', en: 'Why our stickers?', es: '\u00bfPor qu\u00e9 nuestros stickers?' }}
      featuresSubtitle={{
        fr: 'Des autocollants professionnels con\u00e7us pour durer.',
        en: 'Professional stickers built to last.',
        es: 'Stickers profesionales dise\u00f1ados para durar.',
      }}
      useCases={useCases}
      images={allImages}
      faq={stickerFaq}
      ctaLinks={ctaLinks}
      galleryResetKey={selectedFinish}
      containMainCount={1}
    >
      <ConfiguratorStickers onFinishChange={setSelectedFinish} />
    </BoutiqueProductLayout>
  );
}

export default BoutiqueStickers;
