import { Code, Shield, Sparkles, Truck } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorWeb from '../components/configurators/ConfiguratorWeb';
import { useProduct } from '../hooks/useProducts';
import { webImages, webFaq as defaultFaq } from '../data/products';

function BoutiqueWeb() {
  const cmsProduct = useProduct('web');
  const webFaq = cmsProduct ? { fr: cmsProduct.faqFr || defaultFaq.fr, en: cmsProduct.faqEn || defaultFaq.en, es: cmsProduct?.faqEs || defaultFaq.es } : defaultFaq;
  const trustItems = [
    { icon: Code, fr: '15+ ans d\'exp\u00e9rience', en: '15+ years experience', es: '15+ a\u00f1os de experiencia' },
    { icon: Shield, fr: 'SEO inclus', en: 'SEO included', es: 'SEO incluido' },
    { icon: Sparkles, fr: 'Mobile-first', en: 'Mobile-first', es: 'Mobile-first' },
    { icon: Truck, fr: 'Maintenance disponible', en: 'Maintenance available', es: 'Mantenimiento disponible' },
  ];

  const features = [
    { icon: Code, fr: 'Technologies modernes', en: 'Modern technologies', es: 'Tecnolog\u00edas modernas', descFr: 'React, Angular, Node.js, WordPress, Shopify, Strapi. On choisit la technologie adapt\u00e9e \u00e0 votre projet.', descEn: 'React, Angular, Node.js, WordPress, Shopify, Strapi. We choose the technology suited to your project.', descEs: 'React, Angular, Node.js, WordPress, Shopify, Strapi. Elegimos la tecnolog\u00eda adecuada para tu proyecto.' },
    { icon: Shield, fr: 'SEO & Performance', en: 'SEO & Performance', es: 'SEO y Rendimiento', descFr: 'Optimisation SEO technique, Core Web Vitals, score PageSpeed 90+. Votre site sera visible et rapide.', descEn: 'Technical SEO optimization, Core Web Vitals, PageSpeed score 90+. Your site will be visible and fast.', descEs: 'Optimizaci\u00f3n SEO t\u00e9cnica, Core Web Vitals, puntuaci\u00f3n PageSpeed 90+. Tu sitio ser\u00e1 visible y r\u00e1pido.' },
    { icon: Sparkles, fr: 'Design sur mesure', en: 'Custom design', es: 'Dise\u00f1o a medida', descFr: 'Maquettes UI/UX, identit\u00e9 visuelle, responsive mobile-first. Un design unique pour votre marque.', descEn: 'UI/UX mockups, visual identity, mobile-first responsive. A unique design for your brand.', descEs: 'Maquetas UI/UX, identidad visual, responsive mobile-first. Un dise\u00f1o \u00fanico para tu marca.' },
  ];

  const ctaLinks = [
    { to: '/boutique/design', fr: 'Design Graphique', en: 'Graphic Design', es: 'Dise\u00f1o Gr\u00e1fico' },
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers', es: 'Stickers Personalizados' },
    { to: '/boutique/fine-art', fr: 'Impression Fine Art', en: 'Fine Art Print', es: 'Impresi\u00f3n Fine Art' },
  ];

  return (
    <BoutiqueProductLayout
      serviceSlug="developpement-web"
      pageTitle={{ fr: 'D\u00e9veloppement Web - Boutique | Massive', en: 'Web Development - Shop | Massive', es: 'Desarrollo Web - Tienda | Massive' }}
      metaDescription={{
        fr: 'Sites vitrines, e-commerce, landing pages. React, WordPress, Shopify. 15+ ans d\'exp\u00e9rience. Montr\u00e9al.',
        en: 'Showcase sites, e-commerce, landing pages. React, WordPress, Shopify. 15+ years experience. Montreal.',
        es: 'Sitios vitrina, e-commerce, landing pages. React, WordPress, Shopify. 15+ a\u00f1os de experiencia. Montreal.',
      }}
      productTitle={{ fr: 'D\u00e9veloppement Web', en: 'Web Development', es: 'Desarrollo Web' }}
      productSubtitle={{
        fr: 'Sites vitrines, e-commerce et landing pages pour cr\u00e9ateurs.',
        en: 'Showcase sites, e-commerce and landing pages for creators.',
        es: 'Sitios vitrina, e-commerce y landing pages para creadores.',
      }}
      badge={{ fr: '15+ ans d\'exp\u00e9rience', en: '15+ years experience', es: '15+ a\u00f1os de experiencia', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nous choisir?', en: 'Why choose us?', es: '\u00bfPor qu\u00e9 elegirnos?' }}
      featuresSubtitle={{
        fr: 'Des sites web performants, optimis\u00e9s et sur mesure.',
        en: 'Performant, optimized and custom websites.',
        es: 'Sitios web eficientes, optimizados y a medida.',
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
