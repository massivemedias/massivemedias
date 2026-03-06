import { useState } from 'react';
import { Printer, Shield, Sparkles, Truck, Frame, Gift, Building2, Camera, FileText, Music, Users, Briefcase, Megaphone } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorFineArt from '../components/configurators/ConfiguratorFineArt';
import ConfiguratorFlyers from '../components/configurators/ConfiguratorFlyers';
import { useProduct } from '../hooks/useProducts';
import { mediaUrl } from '../utils/cms';
import { useLang } from '../i18n/LanguageContext';
import { fineArtImages, fineArtFaq as defaultFineArtFaq, flyerImages, flyerFaq as defaultFlyerFaq } from '../data/products';

function BoutiqueFineArt() {
  const [tab, setTab] = useState('fineart');
  const { tx } = useLang();
  const cmsFineArt = useProduct('fine-art');
  const cmsFlyers = useProduct('flyers');
  const fineArtFaq = cmsFineArt ? { fr: cmsFineArt.faqFr || defaultFineArtFaq.fr, en: cmsFineArt.faqEn || defaultFineArtFaq.en, es: cmsFineArt?.faqEs || defaultFineArtFaq.es } : defaultFineArtFaq;
  const flyerFaq = cmsFlyers ? { fr: cmsFlyers.faqFr || defaultFlyerFaq.fr, en: cmsFlyers.faqEn || defaultFlyerFaq.en, es: cmsFlyers?.faqEs || defaultFlyerFaq.es } : defaultFlyerFaq;

  const cmsImages = cmsFineArt?.images?.length ? cmsFineArt.images.map(img => mediaUrl(img)) : null;
  const trustItems = [
    { icon: Printer, fr: 'Qualit\u00e9 galerie', en: 'Gallery quality', es: 'Calidad galer\u00eda' },
    { icon: Shield, fr: 'Conservation 100+ ans', en: '100+ year conservation', es: 'Conservaci\u00f3n 100+ a\u00f1os' },
    { icon: Sparkles, fr: 'Calibration ICC', en: 'ICC calibration', es: 'Calibraci\u00f3n ICC' },
    { icon: Truck, fr: 'Pick-up gratuit Mile-End', en: 'Free pick-up Mile-End', es: 'Recogida gratis Mile-End' },
  ];

  const features = [
    { icon: Printer, fr: 'Impression 12 couleurs', en: '12-color printing', es: 'Impresi\u00f3n 12 colores', descFr: 'Impression professionnelle 12 encres pigment\u00e9es pour une fid\u00e9lit\u00e9 de couleur exceptionnelle, qualit\u00e9 galerie.', descEn: 'Professional 12-color pigment printing for exceptional color fidelity, gallery quality.', descEs: 'Impresi\u00f3n profesional con 12 tintas pigmentadas para una fidelidad de color excepcional, calidad galer\u00eda.' },
    { icon: Shield, fr: 'Papiers d\'archives', en: 'Archival papers', es: 'Papeles de archivo', descFr: 'Papiers fine art premium : coton, alpha-cellulose. Standards galerie et mus\u00e9e. Conservation 100+ ans.', descEn: 'Premium fine art papers: cotton, alpha-cellulose. Gallery and museum standards. 100+ year conservation.', descEs: 'Papeles fine art premium: algod\u00f3n, alfa-celulosa. Est\u00e1ndares de galer\u00eda y museo. Conservaci\u00f3n 100+ a\u00f1os.' },
    { icon: Sparkles, fr: 'Soft proofing inclus', en: 'Soft proofing included', es: 'Soft proofing incluido', descFr: 'Calibration colorim\u00e9trique rigoureuse et pr\u00e9visualisation num\u00e9rique avant impression pour valider les couleurs.', descEn: 'Rigorous color calibration and digital preview before printing to validate colors.', descEs: 'Calibraci\u00f3n colorim\u00e9trica rigurosa y previsualizaci\u00f3n digital antes de imprimir para validar los colores.' },
  ];

  const useCases = [
    { icon: Frame, fr: 'Galerie & expo', en: 'Gallery & expo', es: 'Galería y expo', descFr: 'Tirages qualité musée', descEn: 'Museum-quality prints', descEs: 'Impresiones calidad museo' },
    { icon: Building2, fr: 'Deco bureau', en: 'Office decor', es: 'Decoraci\u00f3n oficina', descFr: 'Art pour espaces de travail', descEn: 'Art for workspaces', descEs: 'Arte para espacios de trabajo' },
    { icon: Music, fr: 'Événements', en: 'Events', es: 'Eventos', descFr: 'Flyers de soirée, concert', descEn: 'Party flyers, concerts', descEs: 'Flyers de fiesta, conciertos' },
    { icon: Gift, fr: 'Cadeau', en: 'Gift', es: 'Regalo', descFr: 'Tirage personnalisé unique', descEn: 'Unique custom print', descEs: 'Impresión personalizada única' },
    { icon: Camera, fr: 'Photo d\'art', en: 'Art photo', es: 'Foto art\u00edstica', descFr: 'Tirages photo professionnels', descEn: 'Professional photo prints', descEs: 'Impresiones fotogr\u00e1ficas profesionales' },
    { icon: Briefcase, fr: 'Cartes d\'affaires', en: 'Business cards', es: 'Tarjetas de presentación', descFr: 'Cartes pros sur papier épais', descEn: 'Pro cards on thick paper', descEs: 'Tarjetas profesionales en papel grueso' },
  ];

  const ctaLinks = [
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers', es: 'Stickers Personalizados' },
    { to: '/boutique/design', fr: 'Design', en: 'Design', es: 'Dise\u00f1o' },
    { to: '/boutique/sublimation', fr: 'Sublimation & Merch', en: 'Sublimation & Merch', es: 'Sublimaci\u00f3n y Merch' },
  ];

  const allImages = cmsImages || [...fineArtImages, ...flyerImages];

  const mergedFaq = {
    fr: [...fineArtFaq.fr, ...flyerFaq.fr],
    en: [...fineArtFaq.en, ...flyerFaq.en],
    es: [...(fineArtFaq.es || []), ...(flyerFaq.es || [])],
  };

  return (
    <BoutiqueProductLayout
      serviceSlug="impression-fine-art"
      pageTitle={{ fr: 'Prints - Boutique | Massive', en: 'Prints - Shop | Massive', es: 'Prints - Tienda | Massive' }}
      metaDescription={{
        fr: 'Tirages fine art, flyers, cartes d\'affaires. Impression professionnelle 12 couleurs. Qualit\u00e9 galerie.',
        en: 'Fine art prints, flyers, business cards. Professional 12-color printing. Gallery quality.',
        es: 'Impresiones fine art, flyers, tarjetas de presentaci\u00f3n. Impresi\u00f3n profesional 12 colores. Calidad galer\u00eda.',
      }}
      productTitle={{ fr: 'Prints', en: 'Prints', es: 'Prints' }}
      productSubtitle={{
        fr: 'Fine art, flyers, cartes - impression qualit\u00e9 pro.',
        en: 'Fine art, flyers, cards - pro quality printing.',
        es: 'Fine art, flyers, tarjetas - impresi\u00f3n de calidad profesional.',
      }}
      badge={{ fr: 'Soft proofing inclus', en: 'Soft proofing included', es: 'Soft proofing incluido', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nos impressions?', en: 'Why our prints?', es: '\u00bfPor qu\u00e9 nuestras impresiones?' }}
      featuresSubtitle={{
        fr: 'Impression locale professionnelle aux standards galerie.',
        en: 'Professional local printing meeting gallery standards.',
        es: 'Impresi\u00f3n local profesional con est\u00e1ndares de galer\u00eda.',
      }}
      useCases={useCases}
      images={allImages}
      faq={mergedFaq}
      ctaLinks={ctaLinks}
    >
      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('fineart')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            tab === 'fineart'
              ? 'bg-accent text-white'
              : 'bg-glass text-grey-muted hover:text-heading'
          }`}
        >
          Fine Art
        </button>
        <button
          onClick={() => setTab('flyers')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            tab === 'flyers'
              ? 'bg-accent text-white'
              : 'bg-glass text-grey-muted hover:text-heading'
          }`}
        >
          {tx({ fr: 'Flyers & Cartes', en: 'Flyers & Cards', es: 'Flyers y Tarjetas' })}
        </button>
      </div>

      {tab === 'fineart' ? <ConfiguratorFineArt /> : <ConfiguratorFlyers />}
    </BoutiqueProductLayout>
  );
}

export default BoutiqueFineArt;
