import { Scissors, Shield, Sparkles, Truck, Droplets } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorStickers from '../components/configurators/ConfiguratorStickers';
import { stickerImages, stickerFaq } from '../data/products';

function BoutiqueStickers() {
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

  const ctaLinks = [
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print' },
    { to: '/boutique/sublimation', fr: 'Sublimation & Merch', en: 'Sublimation & Merch' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="stickers-custom"
      pageTitle={{ fr: 'Stickers Custom \u2014 Boutique | Massive Medias', en: 'Custom Stickers \u2014 Shop | Massive Medias' }}
      metaDescription={{
        fr: 'Commandez vos stickers custom. Vinyle matte, glossy, transparent, holographique. D\u00e9coupe de pr\u00e9cision. Design inclus.',
        en: 'Order your custom stickers. Matte, glossy, clear, holographic vinyl. Precision cutting. Design included.',
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
      images={stickerImages}
      faq={stickerFaq}
      ctaLinks={ctaLinks}
    >
      <ConfiguratorStickers />
    </BoutiqueProductLayout>
  );
}

export default BoutiqueStickers;
