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
    { icon: Shield, fr: 'Qualite professionnelle', en: 'Professional quality', es: 'Calidad profesional' },
    { icon: Sparkles, fr: 'Production locale', en: 'Local production', es: 'Produccion local' },
    { icon: Truck, fr: 'Pick-up gratuit Mile-End', en: 'Free pick-up Mile-End', es: 'Recogida gratis Mile-End' },
  ];

  const features = [
    { icon: FileText, fr: 'Papier premium', en: 'Premium paper', es: 'Papel premium', descFr: 'Papier 300g+ en finition matte ou lustree. Qualite superieure a l\'impression en ligne standard.', descEn: 'Premium 300g+ paper in matte or glossy finish. Quality superior to standard online printing.', descEs: 'Papel 300g+ en acabado mate o brillante. Calidad superior a la impresion en linea estandar.' },
    { icon: Shield, fr: 'Impression pro', en: 'Pro printing', es: 'Impresion profesional', descFr: 'Imprimante professionnelle 12 couleurs pigmentees. Couleurs vibrantes et precises meme pour les flyers.', descEn: 'Professional 12-color pigmented printer. Vibrant and precise colors even for flyers.', descEs: 'Impresora profesional de 12 colores pigmentados. Colores vibrantes y precisos incluso para flyers.' },
    { icon: Sparkles, fr: 'Service rapide', en: 'Fast service', es: 'Servicio rapido', descFr: 'Production locale Mile-End. Service express disponible sur demande.', descEn: 'Local production Mile-End. Express service available on request.', descEs: 'Produccion local Mile-End. Servicio express disponible bajo pedido.' },
  ];

  const useCases = [
    { icon: Music, fr: 'Evenements', en: 'Events', es: 'Eventos', descFr: 'Flyers de soiree, concert', descEn: 'Party flyers, concerts', descEs: 'Flyers de fiesta, conciertos' },
    { icon: Briefcase, fr: 'Cartes d\'affaires', en: 'Business cards', es: 'Tarjetas de presentacion', descFr: 'Cartes pros sur papier epais', descEn: 'Pro cards on thick paper', descEs: 'Tarjetas profesionales en papel grueso' },
    { icon: Megaphone, fr: 'Marketing', en: 'Marketing', es: 'Marketing', descFr: 'Prospectus et promos', descEn: 'Leaflets and promos', descEs: 'Folletos y promos' },
    { icon: Users, fr: 'Networking', en: 'Networking', es: 'Networking', descFr: 'Distribution en main propre', descEn: 'Hand-to-hand distribution', descEs: 'Distribucion en mano' },
  ];

  const ctaLinks = [
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design', es: 'Diseno Grafico' },
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers', es: 'Stickers Personalizados' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print', es: 'Impresion Fine Art' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="flyers-cartes"
      startingPrice={40}
      pageTitle={{ fr: 'Impression Flyers & Cartes Montreal - Rapide et Pro | Massive', en: 'Flyers & Cards Printing Montreal - Fast & Pro | Massive', es: 'Impresion Flyers y Tarjetas Montreal - Rapido y Pro | Massive' }}
      metaDescription={{
        fr: 'Flyers, cartes postales, cartes d\'affaires. Impression rapide et locale a Montreal. Qualite pro.',
        en: 'Flyers, postcards, business cards. Fast local printing in Montreal. Pro quality.',
        es: 'Flyers, postales, tarjetas de presentacion. Impresion rapida y local en Montreal. Calidad profesional.',
      }}
      productTitle={{ fr: 'Flyers & Cartes', en: 'Flyers & Cards', es: 'Flyers y Tarjetas' }}
      productSubtitle={{
        fr: 'Impression rapide pour evenements et promotions.',
        en: 'Fast printing for events and promotions.',
        es: 'Impresion rapida para eventos y promociones.',
      }}
      badge={{ fr: 'Express', en: 'Express', es: 'Express', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nos flyers?', en: 'Why our flyers?', es: 'Por que nuestros flyers?' }}
      featuresSubtitle={{
        fr: 'Impression locale rapide, qualite professionnelle.',
        en: 'Fast local printing, professional quality.',
        es: 'Impresion local rapida, calidad profesional.',
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
