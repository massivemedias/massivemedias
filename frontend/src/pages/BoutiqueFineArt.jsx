import { Printer, Shield, Sparkles, Truck } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorFineArt from '../components/configurators/ConfiguratorFineArt';
import { fineArtImages, fineArtFaq } from '../data/products';

function BoutiqueFineArt() {
  const trustItems = [
    { icon: Printer, fr: 'Qualit\u00e9 galerie', en: 'Gallery quality' },
    { icon: Shield, fr: 'Conservation 100+ ans', en: '100+ year conservation' },
    { icon: Sparkles, fr: 'Calibration ICC', en: 'ICC calibration' },
    { icon: Truck, fr: 'Pick-up gratuit Mile-End', en: 'Free pick-up Mile-End' },
  ];

  const features = [
    { icon: Printer, fr: 'Impression 12 couleurs', en: '12-color printing', descFr: 'Impression professionnelle 12 encres pigment\u00e9es pour une fid\u00e9lit\u00e9 de couleur exceptionnelle, qualit\u00e9 galerie.', descEn: 'Professional 12-color pigment printing for exceptional color fidelity, gallery quality.' },
    { icon: Shield, fr: 'Papiers d\'archives', en: 'Archival papers', descFr: 'Papiers fine art premium : coton, alpha-cellulose. Standards galerie et mus\u00e9e. Conservation 100+ ans.', descEn: 'Premium fine art papers: cotton, alpha-cellulose. Gallery and museum standards. 100+ year conservation.' },
    { icon: Sparkles, fr: 'Soft proofing inclus', en: 'Soft proofing included', descFr: 'Calibration colorim\u00e9trique rigoureuse et pr\u00e9visualisation num\u00e9rique avant impression pour valider les couleurs.', descEn: 'Rigorous color calibration and digital preview before printing to validate colors.' },
  ];

  const ctaLinks = [
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers' },
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design' },
    { to: '/boutique/sublimation', fr: 'Sublimation & Merch', en: 'Sublimation & Merch' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="impression-fine-art"
      pageTitle={{ fr: 'Impression Fine Art \u2014 Boutique | Massive Medias', en: 'Fine Art Printing \u2014 Shop | Massive Medias' }}
      metaDescription={{
        fr: 'Tirages fine art qualit\u00e9 galerie. Imprimante professionnelle 12 couleurs. Papiers premium. Calibration ICC.',
        en: 'Gallery-quality fine art prints. Professional 12-color printer. Premium papers. ICC calibration.',
      }}
      productTitle={{ fr: 'Impression Fine Art', en: 'Fine Art Printing' }}
      productSubtitle={{
        fr: 'Tirages qualit\u00e9 galerie sur papiers premium.',
        en: 'Gallery-quality prints on premium papers.',
      }}
      badge={{ fr: 'Soft proofing inclus', en: 'Soft proofing included', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nos tirages?', en: 'Why our prints?' }}
      featuresSubtitle={{
        fr: 'Des impressions professionnelles aux standards des galeries.',
        en: 'Professional prints meeting gallery standards.',
      }}
      images={fineArtImages}
      faq={fineArtFaq}
      ctaLinks={ctaLinks}
    >
      <ConfiguratorFineArt />
    </BoutiqueProductLayout>
  );
}

export default BoutiqueFineArt;
