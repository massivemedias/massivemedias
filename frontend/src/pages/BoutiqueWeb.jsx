import { Code, Shield, Sparkles, Truck } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorWeb from '../components/configurators/ConfiguratorWeb';
import { webImages, webFaq } from '../data/products';

function BoutiqueWeb() {
  const trustItems = [
    { icon: Code, fr: '15+ ans d\'exp\u00e9rience', en: '15+ years experience' },
    { icon: Shield, fr: 'SEO inclus', en: 'SEO included' },
    { icon: Sparkles, fr: 'Mobile-first', en: 'Mobile-first' },
    { icon: Truck, fr: 'Maintenance disponible', en: 'Maintenance available' },
  ];

  const features = [
    { icon: Code, fr: 'Technologies modernes', en: 'Modern technologies', descFr: 'React, Angular, Node.js, WordPress, Shopify, Strapi. On choisit la technologie adapt\u00e9e \u00e0 votre projet.', descEn: 'React, Angular, Node.js, WordPress, Shopify, Strapi. We choose the technology suited to your project.' },
    { icon: Shield, fr: 'SEO & Performance', en: 'SEO & Performance', descFr: 'Optimisation SEO technique, Core Web Vitals, score PageSpeed 90+. Votre site sera visible et rapide.', descEn: 'Technical SEO optimization, Core Web Vitals, PageSpeed score 90+. Your site will be visible and fast.' },
    { icon: Sparkles, fr: 'Design sur mesure', en: 'Custom design', descFr: 'Maquettes UI/UX, identit\u00e9 visuelle, responsive mobile-first. Un design unique pour votre marque.', descEn: 'UI/UX mockups, visual identity, mobile-first responsive. A unique design for your brand.' },
  ];

  const ctaLinks = [
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design' },
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="developpement-web"
      pageTitle={{ fr: 'D\u00e9veloppement Web \u2014 Boutique | Massive Medias', en: 'Web Development \u2014 Shop | Massive Medias' }}
      metaDescription={{
        fr: 'Sites vitrines, e-commerce, landing pages. React, WordPress, Shopify. 15+ ans d\'exp\u00e9rience. Montr\u00e9al.',
        en: 'Showcase sites, e-commerce, landing pages. React, WordPress, Shopify. 15+ years experience. Montreal.',
      }}
      productTitle={{ fr: 'D\u00e9veloppement Web', en: 'Web Development' }}
      productSubtitle={{
        fr: 'Sites vitrines, e-commerce et landing pages pour cr\u00e9ateurs.',
        en: 'Showcase sites, e-commerce and landing pages for creators.',
      }}
      badge={{ fr: '15+ ans d\'exp\u00e9rience', en: '15+ years experience', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nous choisir?', en: 'Why choose us?' }}
      featuresSubtitle={{
        fr: 'Des sites web performants, optimis\u00e9s et sur mesure.',
        en: 'Performant, optimized and custom websites.',
      }}
      images={webImages}
      faq={webFaq}
      ctaLinks={ctaLinks}
    >
      <ConfiguratorWeb />
    </BoutiqueProductLayout>
  );
}

export default BoutiqueWeb;
