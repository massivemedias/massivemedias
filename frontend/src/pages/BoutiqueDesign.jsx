import { Palette, Shield, Sparkles, Truck } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorDesign from '../components/configurators/ConfiguratorDesign';
import { designImages, designFaq } from '../data/products';

function BoutiqueDesign() {
  const trustItems = [
    { icon: Palette, fr: 'Adobe Illustrator & Figma', en: 'Adobe Illustrator & Figma' },
    { icon: Shield, fr: '2 r\u00e9visions incluses', en: '2 revisions included' },
    { icon: Sparkles, fr: 'Fichiers print + web', en: 'Print + web files' },
    { icon: Truck, fr: 'Livraison num\u00e9rique', en: 'Digital delivery' },
  ];

  const features = [
    { icon: Palette, fr: 'Outils professionnels', en: 'Professional tools', descFr: 'Adobe Illustrator pour les cr\u00e9ations vectorielles, Figma pour le prototypage, Photoshop pour la retouche et InDesign pour la mise en page.', descEn: 'Adobe Illustrator for vector creations, Figma for prototyping, Photoshop for retouching and InDesign for layout.' },
    { icon: Shield, fr: 'Fichiers complets', en: 'Complete files', descFr: 'Package complet : AI, EPS, SVG, PNG, PDF. Versions print-ready, web-optimis\u00e9es et formats r\u00e9seaux sociaux.', descEn: 'Complete package: AI, EPS, SVG, PNG, PDF. Print-ready, web-optimized and social media format versions.' },
    { icon: Sparkles, fr: 'Expertise musicale', en: 'Music expertise', descFr: 'Sp\u00e9cialis\u00e9s dans l\'identit\u00e9 visuelle pour artistes, labels, promoteurs et \u00e9v\u00e9nements musicaux.', descEn: 'Specialized in visual identity for artists, labels, promoters and music events.' },
  ];

  const ctaLinks = [
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print' },
    { to: '/boutique/web', fr: 'D\u00e9veloppement Web', en: 'Web Development' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="design-graphique"
      pageTitle={{ fr: 'Design Graphique \u2014 Boutique | Massive Medias', en: 'Graphic Design \u2014 Shop | Massive Medias' }}
      metaDescription={{
        fr: 'Logos, identit\u00e9s visuelles, affiches, pochettes album. Design graphique professionnel. Montr\u00e9al.',
        en: 'Logos, visual identities, posters, album covers. Professional graphic design. Montreal.',
      }}
      productTitle={{ fr: 'Design Graphique', en: 'Graphic Design' }}
      productSubtitle={{
        fr: 'Logos, identit\u00e9s visuelles, affiches et cr\u00e9ations digitales.',
        en: 'Logos, visual identities, posters and digital creations.',
      }}
      badge={{ fr: '2 r\u00e9visions incluses', en: '2 revisions included', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi notre design?', en: 'Why our design?' }}
      featuresSubtitle={{
        fr: 'Cr\u00e9ations professionnelles avec les outils de l\'industrie.',
        en: 'Professional creations with industry-standard tools.',
      }}
      images={designImages}
      faq={designFaq}
      ctaLinks={ctaLinks}
    >
      <ConfiguratorDesign />
    </BoutiqueProductLayout>
  );
}

export default BoutiqueDesign;
