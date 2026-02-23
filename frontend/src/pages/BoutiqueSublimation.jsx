import { Shirt, Shield, Sparkles, Truck } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorSublimation from '../components/configurators/ConfiguratorSublimation';
import { sublimationImages, sublimationFaq } from '../data/products';

function BoutiqueSublimation() {
  const trustItems = [
    { icon: Shirt, fr: 'Impression permanente', en: 'Permanent print' },
    { icon: Shield, fr: 'R\u00e9sistant au lavage', en: 'Wash resistant' },
    { icon: Sparkles, fr: 'Couleurs vibrantes', en: 'Vibrant colors' },
    { icon: Truck, fr: 'Livraison locale', en: 'Local delivery' },
  ];

  const features = [
    { icon: Shirt, fr: 'Impression permanente', en: 'Permanent print', descFr: 'La sublimation transf\u00e8re l\'encre directement dans la fibre. Pas de texture en relief, pas de craquement apr\u00e8s lavage.', descEn: 'Sublimation transfers ink directly into the fiber. No raised texture, no cracking after washing.' },
    { icon: Shield, fr: 'Qualit\u00e9 durable', en: 'Lasting quality', descFr: 'Couleurs vibrantes qui ne s\'effacent pas au lavage. R\u00e9sultat professionnel garanti pour votre merch.', descEn: 'Vibrant colors that don\'t fade in the wash. Guaranteed professional result for your merch.' },
    { icon: Sparkles, fr: 'Polyvalence', en: 'Versatility', descFr: 'T-shirts, hoodies, mugs, thermos, tapis de souris et plus. Tout votre merch en un seul endroit.', descEn: 'T-shirts, hoodies, mugs, tumblers, mousepads and more. All your merch in one place.' },
  ];

  const ctaLinks = [
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers' },
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="sublimation-merch"
      pageTitle={{ fr: 'Sublimation & Merch \u2014 Boutique | Massive Medias', en: 'Sublimation & Merch \u2014 Shop | Massive Medias' }}
      metaDescription={{
        fr: 'T-shirts, hoodies, mugs en sublimation. Impression permanente. Merch d\'artiste sur mesure. Montr\u00e9al.',
        en: 'T-shirts, hoodies, mugs sublimation printing. Permanent print. Custom artist merch. Montreal.',
      }}
      productTitle={{ fr: 'Sublimation & Merch', en: 'Sublimation & Merch' }}
      productSubtitle={{
        fr: 'T-shirts, hoodies, mugs \u2014 ton merch sur mesure.',
        en: 'T-shirts, hoodies, mugs \u2014 your custom merch.',
      }}
      badge={{ fr: '\u00c0 partir de 1 unit\u00e9', en: 'Starting from 1 unit', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi la sublimation?', en: 'Why sublimation?' }}
      featuresSubtitle={{
        fr: 'La meilleure technique pour du merch durable et vibrant.',
        en: 'The best technique for durable, vibrant merch.',
      }}
      images={sublimationImages}
      faq={sublimationFaq}
      ctaLinks={ctaLinks}
    >
      <ConfiguratorSublimation />
    </BoutiqueProductLayout>
  );
}

export default BoutiqueSublimation;
