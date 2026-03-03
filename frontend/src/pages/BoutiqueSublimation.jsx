import { Shirt, Shield, Sparkles, Truck, Music, Users, Gift, Store } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorSublimation from '../components/configurators/ConfiguratorSublimation';
import { useProduct } from '../hooks/useProducts';
import { sublimationImages, sublimationFaq as defaultFaq } from '../data/products';

function BoutiqueSublimation() {
  const cmsProduct = useProduct('sublimation');
  const sublimationFaq = cmsProduct ? { fr: cmsProduct.faqFr || defaultFaq.fr, en: cmsProduct.faqEn || defaultFaq.en, es: cmsProduct?.faqEs || defaultFaq.es } : defaultFaq;
  const trustItems = [
    { icon: Shirt, fr: 'Impression permanente', en: 'Permanent print', es: 'Impresi\u00f3n permanente' },
    { icon: Shield, fr: 'R\u00e9sistant au lavage', en: 'Wash resistant', es: 'Resistente al lavado' },
    { icon: Sparkles, fr: 'Couleurs vibrantes', en: 'Vibrant colors', es: 'Colores vibrantes' },
    { icon: Truck, fr: 'Livraison locale', en: 'Local delivery', es: 'Entrega local' },
  ];

  const features = [
    { icon: Shirt, fr: 'Impression permanente', en: 'Permanent print', es: 'Impresi\u00f3n permanente', descFr: 'La sublimation transf\u00e8re l\'encre directement dans la fibre. Pas de texture en relief, pas de craquement apr\u00e8s lavage.', descEn: 'Sublimation transfers ink directly into the fiber. No raised texture, no cracking after washing.', descEs: 'La sublimaci\u00f3n transfiere la tinta directamente a la fibra. Sin textura en relieve, sin agrietamiento tras el lavado.' },
    { icon: Shield, fr: 'Qualit\u00e9 durable', en: 'Lasting quality', es: 'Calidad duradera', descFr: 'Couleurs vibrantes qui ne s\'effacent pas au lavage. R\u00e9sultat professionnel garanti pour votre merch.', descEn: 'Vibrant colors that don\'t fade in the wash. Guaranteed professional result for your merch.', descEs: 'Colores vibrantes que no se desvanecen con el lavado. Resultado profesional garantizado para tu merch.' },
    { icon: Sparkles, fr: 'Polyvalence', en: 'Versatility', es: 'Versatilidad', descFr: 'T-shirts, hoodies, mugs, thermos, tapis de souris et plus. Tout votre merch en un seul endroit.', descEn: 'T-shirts, hoodies, mugs, tumblers, mousepads and more. All your merch in one place.', descEs: 'Camisetas, hoodies, tazas, termos, alfombrillas y m\u00e1s. Todo tu merch en un solo lugar.' },
  ];

  const useCases = [
    { icon: Music, fr: 'Merch artiste', en: 'Artist merch', es: 'Merch de artista', descFr: 'T-shirts et hoodies de concert', descEn: 'Concert t-shirts and hoodies', descEs: 'Camisetas y hoodies de concierto' },
    { icon: Users, fr: 'Equipe', en: 'Team', es: 'Equipo', descFr: 'Uniformes et vetements de marque', descEn: 'Uniforms and branded apparel', descEs: 'Uniformes y ropa de marca' },
    { icon: Gift, fr: 'Cadeau promo', en: 'Promo gifts', es: 'Regalos promo', descFr: 'Goodies pour evenements', descEn: 'Goodies for events', descEs: 'Goodies para eventos' },
    { icon: Store, fr: 'Boutique en ligne', en: 'Online store', es: 'Tienda en l\u00ednea', descFr: 'Vente de merch personnalise', descEn: 'Selling custom merch', descEs: 'Venta de merch personalizado' },
  ];

  const ctaLinks = [
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers', es: 'Stickers Personalizados' },
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design', es: 'Dise\u00f1o Gr\u00e1fico' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print', es: 'Impresi\u00f3n Fine Art' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="sublimation-merch"
      pageTitle={{ fr: 'Sublimation & Merch - Boutique | Massive Medias', en: 'Sublimation & Merch - Shop | Massive Medias', es: 'Sublimaci\u00f3n y Merch - Tienda | Massive Medias' }}
      metaDescription={{
        fr: 'T-shirts, hoodies, mugs en sublimation. Impression permanente. Merch d\'artiste sur mesure. Montr\u00e9al.',
        en: 'T-shirts, hoodies, mugs sublimation printing. Permanent print. Custom artist merch. Montreal.',
        es: 'Camisetas, hoodies, tazas en sublimaci\u00f3n. Impresi\u00f3n permanente. Merch de artista personalizado. Montreal.',
      }}
      productTitle={{ fr: 'Sublimation & Merch', en: 'Sublimation & Merch', es: 'Sublimaci\u00f3n y Merch' }}
      productSubtitle={{
        fr: 'T-shirts, hoodies, mugs - ton merch sur mesure.',
        en: 'T-shirts, hoodies, mugs - your custom merch.',
        es: 'Camisetas, hoodies, tazas - tu merch personalizado.',
      }}
      badge={{ fr: '\u00c0 partir de 1 unit\u00e9', en: 'Starting from 1 unit', es: 'Desde 1 unidad', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi la sublimation?', en: 'Why sublimation?', es: '\u00bfPor qu\u00e9 la sublimaci\u00f3n?' }}
      featuresSubtitle={{
        fr: 'La meilleure technique pour du merch durable et vibrant.',
        en: 'The best technique for durable, vibrant merch.',
        es: 'La mejor t\u00e9cnica para merch duradero y vibrante.',
      }}
      useCases={useCases}
      images={sublimationImages}
      faq={sublimationFaq}
      ctaLinks={ctaLinks}
    >
      <ConfiguratorSublimation />
    </BoutiqueProductLayout>
  );
}

export default BoutiqueSublimation;
