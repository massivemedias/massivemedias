import { FileText, Shield, Sparkles, Truck, Music, Users, Briefcase, Megaphone } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorFlyers from '../components/configurators/ConfiguratorFlyers';
import { useProduct } from '../hooks/useProducts';
import { mediaUrl } from '../utils/cms';
import { flyerImages, flyerFaq as defaultFaq } from '../data/products';

function BoutiqueFlyers() {
  const cmsProduct = useProduct('flyers');
  const flyerFaq = cmsProduct ? { fr: cmsProduct.faqFr || defaultFaq.fr, en: cmsProduct.faqEn || defaultFaq.en, es: cmsProduct?.faqEs || defaultFaq.es } : defaultFaq;
  const cmsImages = cmsProduct?.images?.length ? cmsProduct.images.map(img => mediaUrl(img)) : null;
  const trustItems = [
    { icon: FileText, fr: 'Papier premium 300g+', en: 'Premium 300g+ paper', es: 'Papel premium 300g+' },
    { icon: Shield, fr: 'Qualit\u00e9 professionnelle', en: 'Professional quality', es: 'Calidad profesional' },
    { icon: Sparkles, fr: 'D\u00e9lai express 24h', en: '24h express turnaround', es: 'Plazo express 24h' },
    { icon: Truck, fr: 'Pick-up gratuit Mile-End', en: 'Free pick-up Mile-End', es: 'Recogida gratis Mile-End' },
  ];

  const features = [
    { icon: FileText, fr: 'Papier premium', en: 'Premium paper', es: 'Papel premium', descFr: 'Papier 300g+ en finition matte ou brillante. Qualit\u00e9 sup\u00e9rieure \u00e0 l\'impression en ligne standard.', descEn: 'Premium 300g+ paper in matte or glossy finish. Quality superior to standard online printing.', descEs: 'Papel 300g+ en acabado mate o brillante. Calidad superior a la impresi\u00f3n en l\u00ednea est\u00e1ndar.' },
    { icon: Shield, fr: 'Impression pro', en: 'Pro printing', es: 'Impresi\u00f3n profesional', descFr: 'Imprimante professionnelle 12 couleurs pigment\u00e9es. Couleurs vibrantes et pr\u00e9cises m\u00eame pour les flyers.', descEn: 'Professional 12-color pigmented printer. Vibrant and precise colors even for flyers.', descEs: 'Impresora profesional de 12 colores pigmentados. Colores vibrantes y precisos incluso para flyers.' },
    { icon: Sparkles, fr: 'Service rapide', en: 'Fast service', es: 'Servicio r\u00e1pido', descFr: 'D\u00e9lai standard 24-48h. Service express le jour m\u00eame disponible pour les urgences.', descEn: 'Standard 24-48h turnaround. Same-day express service available for urgent needs.', descEs: 'Plazo est\u00e1ndar 24-48h. Servicio express el mismo d\u00eda disponible para urgencias.' },
  ];

  const useCases = [
    { icon: Music, fr: 'Événements', en: 'Events', es: 'Eventos', descFr: 'Flyers de soirée, concert', descEn: 'Party flyers, concerts', descEs: 'Flyers de fiesta, conciertos' },
    { icon: Briefcase, fr: 'Cartes d\'affaires', en: 'Business cards', es: 'Tarjetas de presentación', descFr: 'Cartes pros sur papier épais', descEn: 'Pro cards on thick paper', descEs: 'Tarjetas profesionales en papel grueso' },
    { icon: Megaphone, fr: 'Marketing', en: 'Marketing', es: 'Marketing', descFr: 'Prospectus et promos', descEn: 'Leaflets and promos', descEs: 'Folletos y promos' },
    { icon: Users, fr: 'Networking', en: 'Networking', es: 'Networking', descFr: 'Distribution en main propre', descEn: 'Hand-to-hand distribution', descEs: 'Distribuci\u00f3n en mano' },
  ];

  const ctaLinks = [
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design', es: 'Dise\u00f1o Gr\u00e1fico' },
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers', es: 'Stickers Personalizados' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print', es: 'Impresi\u00f3n Fine Art' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="flyers-cartes"
      pageTitle={{ fr: 'Flyers & Cartes - Boutique | Massive', en: 'Flyers & Cards - Shop | Massive', es: 'Flyers y Tarjetas - Tienda | Massive' }}
      metaDescription={{
        fr: 'Flyers, cartes postales, cartes d\'affaires. Impression rapide et locale \u00e0 Montr\u00e9al. Qualit\u00e9 pro.',
        en: 'Flyers, postcards, business cards. Fast local printing in Montreal. Pro quality.',
        es: 'Flyers, postales, tarjetas de presentaci\u00f3n. Impresi\u00f3n r\u00e1pida y local en Montreal. Calidad profesional.',
      }}
      productTitle={{ fr: 'Flyers & Cartes', en: 'Flyers & Cards', es: 'Flyers y Tarjetas' }}
      productSubtitle={{
        fr: 'Impression rapide pour \u00e9v\u00e9nements et promotions.',
        en: 'Fast printing for events and promotions.',
        es: 'Impresi\u00f3n r\u00e1pida para eventos y promociones.',
      }}
      badge={{ fr: 'Express 24h', en: '24h Express', es: 'Express 24h', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nos flyers?', en: 'Why our flyers?', es: '\u00bfPor qu\u00e9 nuestros flyers?' }}
      featuresSubtitle={{
        fr: 'Impression locale rapide, qualit\u00e9 professionnelle.',
        en: 'Fast local printing, professional quality.',
        es: 'Impresi\u00f3n local r\u00e1pida, calidad profesional.',
      }}
      useCases={useCases}
      images={cmsImages || flyerImages}
      faq={flyerFaq}
      ctaLinks={ctaLinks}
    >
      <ConfiguratorFlyers />
    </BoutiqueProductLayout>
  );
}

export default BoutiqueFlyers;
