import { useState } from 'react';
import { Printer, Shield, Sparkles, Truck, Frame, Gift, Building2, Camera, FileText, Music, Users, Briefcase, Megaphone } from 'lucide-react';
import BoutiqueProductLayout from '../components/BoutiqueProductLayout';
import ConfiguratorFineArt from '../components/configurators/ConfiguratorFineArt';
import ConfiguratorFlyers from '../components/configurators/ConfiguratorFlyers';
import { useProduct } from '../hooks/useProducts';
import { fineArtImages, fineArtFaq as defaultFineArtFaq, flyerImages, flyerFaq as defaultFlyerFaq } from '../data/products';

function BoutiqueFineArt() {
  const [tab, setTab] = useState('fineart');
  const cmsFineArt = useProduct('fine-art');
  const cmsFlyers = useProduct('flyers');
  const fineArtFaq = cmsFineArt ? { fr: cmsFineArt.faqFr || defaultFineArtFaq.fr, en: cmsFineArt.faqEn || defaultFineArtFaq.en } : defaultFineArtFaq;
  const flyerFaq = cmsFlyers ? { fr: cmsFlyers.faqFr || defaultFlyerFaq.fr, en: cmsFlyers.faqEn || defaultFlyerFaq.en } : defaultFlyerFaq;

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

  const useCases = [
    { icon: Frame, fr: 'Galerie & expo', en: 'Gallery & expo', descFr: 'Tirages qualite musee', descEn: 'Museum-quality prints' },
    { icon: Building2, fr: 'Deco bureau', en: 'Office decor', descFr: 'Art pour espaces de travail', descEn: 'Art for workspaces' },
    { icon: Music, fr: 'Evenements', en: 'Events', descFr: 'Flyers de soiree, concert', descEn: 'Party flyers, concerts' },
    { icon: Gift, fr: 'Cadeau', en: 'Gift', descFr: 'Tirage personnalise unique', descEn: 'Unique custom print' },
    { icon: Camera, fr: 'Photo d\'art', en: 'Art photo', descFr: 'Tirages photo professionnels', descEn: 'Professional photo prints' },
    { icon: Briefcase, fr: 'Cartes d\'affaires', en: 'Business cards', descFr: 'Cartes pros sur papier epais', descEn: 'Pro cards on thick paper' },
  ];

  const ctaLinks = [
    { to: '/boutique/stickers', fr: 'Stickers Custom', en: 'Custom Stickers' },
    { to: '/boutique/design', fr: 'Design', en: 'Design' },
    { to: '/boutique/sublimation', fr: 'Sublimation & Merch', en: 'Sublimation & Merch' },
  ];

  const allImages = [...fineArtImages, ...flyerImages];

  const mergedFaq = {
    fr: [...fineArtFaq.fr, ...flyerFaq.fr],
    en: [...fineArtFaq.en, ...flyerFaq.en],
  };

  return (
    <BoutiqueProductLayout
      serviceSlug="impression-fine-art"
      pageTitle={{ fr: 'Prints - Boutique | Massive Medias', en: 'Prints - Shop | Massive Medias' }}
      metaDescription={{
        fr: 'Tirages fine art, flyers, cartes d\'affaires. Impression professionnelle 12 couleurs. Qualit\u00e9 galerie.',
        en: 'Fine art prints, flyers, business cards. Professional 12-color printing. Gallery quality.',
      }}
      productTitle={{ fr: 'Prints', en: 'Prints' }}
      productSubtitle={{
        fr: 'Fine art, flyers, cartes - impression qualit\u00e9 pro.',
        en: 'Fine art, flyers, cards - pro quality printing.',
      }}
      badge={{ fr: 'Soft proofing inclus', en: 'Soft proofing included', icon: Sparkles }}
      trustItems={trustItems}
      features={features}
      featuresTitle={{ fr: 'Pourquoi nos impressions?', en: 'Why our prints?' }}
      featuresSubtitle={{
        fr: 'Impression locale professionnelle aux standards galerie.',
        en: 'Professional local printing meeting gallery standards.',
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
          Flyers & Cartes
        </button>
      </div>

      {tab === 'fineart' ? <ConfiguratorFineArt /> : <ConfiguratorFlyers />}
    </BoutiqueProductLayout>
  );
}

export default BoutiqueFineArt;
