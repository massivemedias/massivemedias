import { useState, useMemo } from 'react';
import { Scissors, Shield, Sparkles, Truck, Droplets, Tag, Gift, Music, Package } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorStickers from '../components/configurators/ConfiguratorStickers';
import { stickerImages, stickerFaq } from '../data/products';
import { img } from '../utils/paths';

// Image de finition par type (affichee en premier dans la galerie)
const finishImages = {
  matte: img('/images/stickers/finish-matte.webp'),
  glossy: img('/images/stickers/finish-glossy.webp'),
  holographic: img('/images/stickers/finish-holographic.webp'),
  'broken-glass': img('/images/stickers/finish-broken-glass.webp'),
  stars: img('/images/stickers/finish-stars.webp'),
};

function BoutiqueStickers() {
  const [selectedFinish, setSelectedFinish] = useState('matte');

  // Image de finition en premier, puis les images de realisations
  const allImages = useMemo(() => {
    const finishImg = finishImages[selectedFinish];
    return finishImg ? [finishImg, ...stickerImages] : stickerImages;
  }, [selectedFinish]);

  const trustItems = [
    { icon: Scissors, fr: 'D\u00e9coupe pr\u00e9cision', en: 'Precision cutting' },
    { icon: Shield, fr: 'Durabilit\u00e9 3-5 ans', en: '3-5 year durability' },
    { icon: Sparkles, fr: 'Design inclus', en: 'Design included' },
    { icon: Truck, fr: 'Livraison locale gratuite', en: 'Free local delivery' },
  ];

  const features = [
    { icon: Scissors, fr: 'D\u00e9coupe de pr\u00e9cision', en: 'Precision cutting', descFr: 'Contour cut professionnel \u00e0 la forme exacte de votre design. \u00c9quipement pro jusqu\'au 12" de large.', descEn: 'Professional contour cutting to the exact shape of your design. Pro equipment up to 12" wide.' },
    { icon: Droplets, fr: 'R\u00e9sistant \u00e0 tout', en: 'Weather resistant', descFr: 'Lamination int\u00e9gr\u00e9e. Eau, UV, rayures \u2014 vos stickers durent 3 \u00e0 5 ans en ext\u00e9rieur.', descEn: 'Integrated lamination. Water, UV, scratches \u2014 your stickers last 3-5 years outdoors.' },
    { icon: Sparkles, fr: 'Design inclus', en: 'Design included', descFr: 'Cr\u00e9ation ou adaptation graphique incluse dans tous les prix. On optimise votre design pour l\'impression.', descEn: 'Graphic creation or adaptation included in all prices. We optimize your design for printing.' },
  ];

  const useCases = [
    { icon: Tag, fr: 'Branding', en: 'Branding', descFr: 'Logo sur produits, emballages', descEn: 'Logo on products, packaging' },
    { icon: Music, fr: 'Evenements', en: 'Events', descFr: 'Merch de concert, festivals', descEn: 'Concert merch, festivals' },
    { icon: Gift, fr: 'Emballage', en: 'Packaging', descFr: 'Etiquettes pour vos produits', descEn: 'Labels for your products' },
    { icon: Package, fr: 'Promotions', en: 'Promotions', descFr: 'Giveaways, lancement', descEn: 'Giveaways, launches' },
  ];

  const ctaLinks = [
    { to: '/boutique/design', fr: 'Design', en: 'Design' },
    { to: '/boutique/fine-art', fr: 'Prints', en: 'Prints' },
    { to: '/boutique/sublimation', fr: 'Merch', en: 'Merch' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="stickers-custom"
      pageTitle={{ fr: 'Stickers Custom - Boutique | Massive Medias', en: 'Custom Stickers - Shop | Massive Medias' }}
      metaDescription={{
        fr: 'Commandez vos stickers custom. Vinyle matte, glossy, holographique, verre brise, etoiles. Decoupe de precision. Design inclus.',
        en: 'Order your custom stickers. Matte, glossy, holographic, broken glass, stars vinyl. Precision cutting. Design included.',
      }}
      productTitle={{ fr: 'Stickers Custom', en: 'Custom Stickers' }}
      productSubtitle={{
        fr: 'Autocollants d\u00e9coup\u00e9s sur mesure. Design graphique inclus.',
        en: 'Custom die-cut stickers. Graphic design included.',
      }}
      badge={{ fr: 'Design inclus', en: 'Design included', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nos stickers?', en: 'Why our stickers?' }}
      featuresSubtitle={{
        fr: 'Des autocollants professionnels con\u00e7us pour durer.',
        en: 'Professional stickers built to last.',
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
