import { Palette, Shield, Sparkles, Truck } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorDesign from '../components/configurators/ConfiguratorDesign';
import { useProduct } from '../hooks/useProducts';
import { designImages, designFaq as defaultFaq } from '../data/products';

function BoutiqueDesign() {
  const cmsProduct = useProduct('design');
  const designFaq = cmsProduct ? { fr: cmsProduct.faqFr || defaultFaq.fr, en: cmsProduct.faqEn || defaultFaq.en, es: cmsProduct?.faqEs || defaultFaq.es } : defaultFaq;
  const trustItems = [
    { icon: Palette, fr: 'Adobe Illustrator & Figma', en: 'Adobe Illustrator & Figma', es: 'Adobe Illustrator y Figma' },
    { icon: Shield, fr: '2 r\u00e9visions incluses', en: '2 revisions included', es: '2 revisiones incluidas' },
    { icon: Sparkles, fr: 'Fichiers print + web', en: 'Print + web files', es: 'Archivos print + web' },
    { icon: Truck, fr: 'Livraison num\u00e9rique', en: 'Digital delivery', es: 'Entrega digital' },
  ];

  const features = [
    { icon: Palette, fr: 'Outils professionnels', en: 'Professional tools', es: 'Herramientas profesionales', descFr: 'Adobe Illustrator pour les cr\u00e9ations vectorielles, Figma pour le prototypage, Photoshop pour la retouche et InDesign pour la mise en page.', descEn: 'Adobe Illustrator for vector creations, Figma for prototyping, Photoshop for retouching and InDesign for layout.', descEs: 'Adobe Illustrator para creaciones vectoriales, Figma para prototipado, Photoshop para retoque e InDesign para maquetaci\u00f3n.' },
    { icon: Shield, fr: 'Fichiers complets', en: 'Complete files', es: 'Archivos completos', descFr: 'Package complet : AI, EPS, SVG, PNG, PDF. Versions print-ready, web-optimis\u00e9es et formats r\u00e9seaux sociaux.', descEn: 'Complete package: AI, EPS, SVG, PNG, PDF. Print-ready, web-optimized and social media format versions.', descEs: 'Paquete completo: AI, EPS, SVG, PNG, PDF. Versiones listas para impresi\u00f3n, optimizadas para web y formatos de redes sociales.' },
    { icon: Sparkles, fr: 'Expertise musicale', en: 'Music expertise', es: 'Experiencia musical', descFr: 'Sp\u00e9cialis\u00e9s dans l\'identit\u00e9 visuelle pour artistes, labels, promoteurs et \u00e9v\u00e9nements musicaux.', descEn: 'Specialized in visual identity for artists, labels, promoters and music events.', descEs: 'Especializados en identidad visual para artistas, sellos, promotores y eventos musicales.' },
  ];

  const ctaLinks = [
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers', es: 'Stickers Personalizados' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print', es: 'Impresi\u00f3n Fine Art' },
    { to: '/boutique/web', fr: 'D\u00e9veloppement Web', en: 'Web Development', es: 'Desarrollo Web' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="design-graphique"
      pageTitle={{ fr: 'Design Graphique - Boutique | Massive', en: 'Graphic Design - Shop | Massive', es: 'Dise\u00f1o Gr\u00e1fico - Tienda | Massive' }}
      metaDescription={{
        fr: 'Logos, identit\u00e9s visuelles, affiches, pochettes album. Design graphique professionnel. Montr\u00e9al.',
        en: 'Logos, visual identities, posters, album covers. Professional graphic design. Montreal.',
        es: 'Logos, identidades visuales, afiches, portadas de \u00e1lbum. Dise\u00f1o gr\u00e1fico profesional. Montreal.',
      }}
      productTitle={{ fr: 'Design Graphique', en: 'Graphic Design', es: 'Dise\u00f1o Gr\u00e1fico' }}
      productSubtitle={{
        fr: 'Logos, identit\u00e9s visuelles, affiches et cr\u00e9ations digitales.',
        en: 'Logos, visual identities, posters and digital creations.',
        es: 'Logos, identidades visuales, afiches y creaciones digitales.',
      }}
      badge={{ fr: '2 r\u00e9visions incluses', en: '2 revisions included', es: '2 revisiones incluidas', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi notre design?', en: 'Why our design?', es: '\u00bfPor qu\u00e9 nuestro dise\u00f1o?' }}
      featuresSubtitle={{
        fr: 'Cr\u00e9ations professionnelles avec les outils de l\'industrie.',
        en: 'Professional creations with industry-standard tools.',
        es: 'Creaciones profesionales con herramientas de la industria.',
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
