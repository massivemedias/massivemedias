import { FileText, Shield, Sparkles, Truck, Music, Users, Briefcase, Megaphone } from 'lucide-react';
import ProductLayout from '../components/ProductLayout';
import ConfiguratorFlyers from '../components/configurators/ConfiguratorFlyers';
import { useProduct } from '../hooks/useProducts';
import { mediaUrl } from '../utils/cms';
import { flyerImages, flyerFaq as defaultFaq } from '../data/products';

function ServiceFlyers() {
  const cmsProduct = useProduct('flyers');
  const flyerFaq = cmsProduct ? { fr: cmsProduct.faqFr || defaultFaq.fr, en: cmsProduct.faqEn || defaultFaq.en, es: cmsProduct?.faqEs || defaultFaq.es } : defaultFaq;
  const cmsImages = cmsProduct?.images?.length ? cmsProduct.images.map(img => mediaUrl(img)) : null;
  const trustItems = [
    { icon: FileText, fr: 'Papier souple cartonné', en: 'Soft cardstock', es: 'Cartulina flexible' },
    { icon: Shield, fr: 'Optimisé pour la distribution', en: 'Optimized for distribution', es: 'Optimizado para distribución' },
    { icon: Sparkles, fr: 'Production locale', en: 'Local production', es: 'Produccion local' },
    { icon: Truck, fr: 'Pick-up gratuit Mile-End', en: 'Free pick-up Mile-End', es: 'Recogida gratis Mile-End' },
  ];

  // CONTENT-DISTRIBUTION (3 mai 2026) : description ajoutee pour clarifier
  // que les flyers utilisent un papier souple cartonné optimise pour la
  // distribution a grand volume, par opposition aux papiers d'art rigides
  // des series Studio et Musee (collection Fine Art) qui sont destinees a
  // l'affichage decoratif. Le client doit comprendre que ce n'est pas un
  // produit premium d'art mais un materiel utilitaire de qualite pro.
  const features = [
    {
      icon: FileText,
      fr: 'Papier souple cartonné',
      en: 'Soft cardstock paper',
      es: 'Papel cartulina flexible',
      descFr: 'Imprimés sur un papier souple cartonné, optimisé pour la distribution à grand volume. Contrairement aux séries Studio et Musée qui utilisent des papiers d\'art rigides pour l\'affichage décoratif, ce matériel est conçu pour être manipulé et distribué efficacement.',
      descEn: 'Printed on soft cardstock paper, optimized for high-volume distribution. Unlike the Studio and Museum series which use rigid art papers for decorative display, this material is designed to be handled and distributed efficiently.',
      descEs: 'Impresos en papel cartulina flexible, optimizado para distribución a gran volumen. A diferencia de las series Studio y Museo que utilizan papeles de arte rígidos para exhibición decorativa, este material está diseñado para ser manipulado y distribuido eficientemente.',
    },
    { icon: Shield, fr: 'Impression pro', en: 'Pro printing', es: 'Impresion profesional', descFr: 'Imprimante professionnelle 12 couleurs pigmentees. Couleurs vibrantes et precises meme pour les flyers.', descEn: 'Professional 12-color pigmented printer. Vibrant and precise colors even for flyers.', descEs: 'Impresora profesional de 12 colores pigmentados. Colores vibrantes y precisos incluso para flyers.' },
    { icon: Sparkles, fr: 'Service rapide', en: 'Fast service', es: 'Servicio rapido', descFr: 'Production locale Mile-End. Service express disponible sur demande.', descEn: 'Local production Mile-End. Express service available on request.', descEs: 'Produccion local Mile-End. Servicio express disponible bajo pedido.' },
  ];

  // HIDE-BUSINESS-CARDS (29 avril 2026) : tile cartes d'affaires retiree.
  const useCases = [
    { icon: Music, fr: 'Evenements', en: 'Events', es: 'Eventos', descFr: 'Flyers de soiree, concert', descEn: 'Party flyers, concerts', descEs: 'Flyers de fiesta, conciertos' },
    { icon: Megaphone, fr: 'Marketing', en: 'Marketing', es: 'Marketing', descFr: 'Prospectus et promos', descEn: 'Leaflets and promos', descEs: 'Folletos y promos' },
    { icon: Users, fr: 'Networking', en: 'Networking', es: 'Networking', descFr: 'Distribution en main propre', descEn: 'Hand-to-hand distribution', descEs: 'Distribucion en mano' },
  ];

  const ctaLinks = [
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design', es: 'Diseno Grafico' },
    { to: '/services/stickers', fr: 'Stickers Custom', en: 'Custom Stickers', es: 'Stickers Personalizados' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print', es: 'Impresion Fine Art' },
  ];

  return (
    <ProductLayout
      serviceSlug="flyers-cartes"
      startingPrice={40}
      pageTitle={{ fr: 'Impression Flyers Montreal - Rapide et Pro | Massive', en: 'Flyer Printing Montreal - Fast & Pro | Massive', es: 'Impresion Flyers Montreal - Rapido y Pro | Massive' }}
      metaDescription={{
        fr: 'Flyers et cartes postales premium. Impression rapide et locale a Montreal. Qualite pro.',
        en: 'Premium flyers and postcards. Fast local printing in Montreal. Pro quality.',
        es: 'Flyers y postales premium. Impresion rapida y local en Montreal. Calidad profesional.',
      }}
      productTitle={{ fr: 'Flyers Premium', en: 'Premium Flyers', es: 'Flyers Premium' }}
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
    </ProductLayout>
  );
}

export default ServiceFlyers;
