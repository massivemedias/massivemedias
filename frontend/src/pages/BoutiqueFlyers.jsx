import { FileText, Shield, Sparkles, Truck, Music, Users, Briefcase, Megaphone } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorFlyers from '../components/configurators/ConfiguratorFlyers';
import { useProduct } from '../hooks/useProducts';
import { flyerImages, flyerFaq as defaultFaq } from '../data/products';

function BoutiqueFlyers() {
  const cmsProduct = useProduct('flyers');
  const flyerFaq = cmsProduct ? { fr: cmsProduct.faqFr || defaultFaq.fr, en: cmsProduct.faqEn || defaultFaq.en } : defaultFaq;
  const trustItems = [
    { icon: FileText, fr: 'Papier premium 300g+', en: 'Premium 300g+ paper' },
    { icon: Shield, fr: 'Qualit\u00e9 professionnelle', en: 'Professional quality' },
    { icon: Sparkles, fr: 'D\u00e9lai express 24h', en: '24h express turnaround' },
    { icon: Truck, fr: 'Pick-up gratuit Mile-End', en: 'Free pick-up Mile-End' },
  ];

  const features = [
    { icon: FileText, fr: 'Papier premium', en: 'Premium paper', descFr: 'Papier 300g+ en finition matte ou brillante. Qualit\u00e9 sup\u00e9rieure \u00e0 l\'impression en ligne standard.', descEn: 'Premium 300g+ paper in matte or glossy finish. Quality superior to standard online printing.' },
    { icon: Shield, fr: 'Impression pro', en: 'Pro printing', descFr: 'Imprimante professionnelle 12 couleurs pigment\u00e9es. Couleurs vibrantes et pr\u00e9cises m\u00eame pour les flyers.', descEn: 'Professional 12-color pigmented printer. Vibrant and precise colors even for flyers.' },
    { icon: Sparkles, fr: 'Service rapide', en: 'Fast service', descFr: 'D\u00e9lai standard 24-48h. Service express le jour m\u00eame disponible pour les urgences.', descEn: 'Standard 24-48h turnaround. Same-day express service available for urgent needs.' },
  ];

  const useCases = [
    { icon: Music, fr: 'Evenements', en: 'Events', descFr: 'Flyers de soiree, concert', descEn: 'Party flyers, concerts' },
    { icon: Briefcase, fr: 'Cartes d\'affaires', en: 'Business cards', descFr: 'Cartes pros sur papier epais', descEn: 'Pro cards on thick paper' },
    { icon: Megaphone, fr: 'Marketing', en: 'Marketing', descFr: 'Prospectus et promos', descEn: 'Leaflets and promos' },
    { icon: Users, fr: 'Networking', en: 'Networking', descFr: 'Distribution en main propre', descEn: 'Hand-to-hand distribution' },
  ];

  const ctaLinks = [
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design' },
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="flyers-cartes"
      pageTitle={{ fr: 'Flyers & Cartes \u2014 Boutique | Massive Medias', en: 'Flyers & Cards \u2014 Shop | Massive Medias' }}
      metaDescription={{
        fr: 'Flyers, cartes postales, cartes d\'affaires. Impression rapide et locale \u00e0 Montr\u00e9al. Qualit\u00e9 pro.',
        en: 'Flyers, postcards, business cards. Fast local printing in Montreal. Pro quality.',
      }}
      productTitle={{ fr: 'Flyers & Cartes', en: 'Flyers & Cards' }}
      productSubtitle={{
        fr: 'Impression rapide pour \u00e9v\u00e9nements et promotions.',
        en: 'Fast printing for events and promotions.',
      }}
      badge={{ fr: 'Express 24h', en: '24h Express', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nos flyers?', en: 'Why our flyers?' }}
      featuresSubtitle={{
        fr: 'Impression locale rapide, qualit\u00e9 professionnelle.',
        en: 'Fast local printing, professional quality.',
      }}
      useCases={useCases}
      images={flyerImages}
      faq={flyerFaq}
      ctaLinks={ctaLinks}
    >
      <ConfiguratorFlyers />
    </BoutiqueProductLayout>
  );
}

export default BoutiqueFlyers;
