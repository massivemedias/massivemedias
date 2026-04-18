import { Shirt, Shield, Sparkles, Truck, Music, Users, Gift, Store } from 'lucide-react';
import ProductLayout from '../components/ProductLayout';
import ConfiguratorSublimation from '../components/configurators/ConfiguratorSublimation';
import MerchPauseBanner from '../components/MerchPauseBanner';
import { useProduct } from '../hooks/useProducts';
import { mediaUrl } from '../utils/cms';
import { sublimationImages, sublimationFaq as defaultFaq } from '../data/products';

function ServiceMerch() {
  const cmsProduct = useProduct('sublimation');
  const sublimationFaq = cmsProduct ? { fr: cmsProduct.faqFr || defaultFaq.fr, en: cmsProduct.faqEn || defaultFaq.en, es: cmsProduct?.faqEs || defaultFaq.es } : defaultFaq;
  const cmsImages = cmsProduct?.images?.length ? cmsProduct.images.map(img => mediaUrl(img)) : null;
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
    { icon: Users, fr: 'Équipe', en: 'Team', es: 'Equipo', descFr: 'Uniformes et vêtements de marque', descEn: 'Uniforms and branded apparel', descEs: 'Uniformes y ropa de marca' },
    { icon: Gift, fr: 'Cadeau promo', en: 'Promo gifts', es: 'Regalos promo', descFr: 'Goodies pour événements', descEn: 'Goodies for events', descEs: 'Goodies para eventos' },
    { icon: Store, fr: 'Boutique en ligne', en: 'Online store', es: 'Tienda en l\u00ednea', descFr: 'Vente de merch personnalisé', descEn: 'Selling custom merch', descEs: 'Venta de merch personalizado' },
  ];

  const ctaLinks = [
    { to: '/services/stickers', fr: 'Stickers Custom', en: 'Custom Stickers', es: 'Stickers Personalizados' },
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design', es: 'Dise\u00f1o Gr\u00e1fico' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print', es: 'Impresi\u00f3n Fine Art' },
  ];

  return (
    <ProductLayout
      serviceSlug="sublimation-merch"
      startingPrice={15}
      pageTitle={{ fr: 'Sublimation Textile Montréal - T-Shirts, Hoodies, Mugs | Massive', en: 'Textile Sublimation Montreal - T-Shirts, Hoodies, Mugs | Massive', es: 'Sublimacion Textil Montreal - Camisetas, Hoodies, Tazas | Massive' }}
      metaDescription={{
        fr: 'Sublimation textile à Montréal. T-shirts, hoodies, long sleeves, mugs, tote bags. Impression all-over permanente. Merch d\'artiste et corporatif. À partir d\'1 unité. Production locale Mile-End.',
        en: 'Textile sublimation in Montreal. T-shirts, hoodies, long sleeves, mugs, tote bags. Permanent all-over printing. Artist and corporate merch. From 1 unit. Local production Mile-End.',
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
      images={cmsImages || sublimationImages}
      faq={sublimationFaq}
      ctaLinks={ctaLinks}
    >
      <MerchPauseBanner />
      <ConfiguratorSublimation />
    </ProductLayout>
  );
}

export default ServiceMerch;
