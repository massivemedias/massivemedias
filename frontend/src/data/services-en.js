import { Printer, Sticker, Shirt, FileText, Palette, Code } from 'lucide-react';
import { img, thumb } from '../utils/paths';

const servicesDataEn = {
  'impression-fine-art': {
    slug: 'impression-fine-art',
    icon: Printer,
    title: 'Fine Art Printing',
    subtitle: 'Gallery-quality prints on premium papers',
    heroImage: thumb('/images/prints/Prints1.jpeg'),
    description: `Fine Art refers to photographic or artistic prints made on high-end archival papers (cotton, alpha-cellulose) with pigmented inks for maximum longevity. These prints meet gallery and museum standards, with a conservation life exceeding 100 years.

Each print undergoes rigorous color calibration to ensure optimal fidelity to the artist's intentions.`,
    highlights: [
      'Professional fine art printer - 12 pigmented inks',
      'Large format printer access for 24"+ prints',
      'Premium professional fine art papers',
      'Professional calibration, custom ICC profiles',
      '100+ year conservation life',
      'Free pick-up Mile-End, local delivery',
    ],
    process: [
      { step: 1, title: 'File reception', desc: 'Submit your high-resolution file (or graphic design on request)' },
      { step: 2, title: 'Color analysis', desc: 'Calibration according to chosen paper, adapted ICC profile' },
      { step: 3, title: 'Soft proofing', desc: 'Digital preview and validation before printing' },
      { step: 4, title: 'Printing', desc: 'Print on professional large format printer with custom ICC profile' },
      { step: 5, title: 'Drying & quality check', desc: '24h drying, quality control, optional lamination' },
      { step: 6, title: 'Finishing', desc: 'Protective packaging or framing per your order' },
    ],
    pricing: {
      title: 'Fine Art Printing Pricing',
      note: '15-20% below Etsy/Printify, superior quality, zero shipping fees',
      headers: ['Format', 'Unframed', 'Black frame', 'Etsy Ref.'],
      rows: [
        ['A4 (8×10")', '$45', '$75', '$59 + shipping'],
        ['A3 (12×18")', '$55', '$95', '$76 + shipping'],
        ['A3+ (13×19")', '$65', '$110', '-'],
        ['A2 (18×24")', '$95', '$150', '$132 + shipping'],
        ['24×36" (large format)', '$150', 'On request', '$189 + shipping'],
      ],
    },
    gallery: [
      thumb('/images/prints/Prints2.jpeg'),
      thumb('/images/prints/Prints3.jpeg'),
      thumb('/images/prints/Prints7.jpeg'),
      thumb('/images/prints/Prints8.jpeg'),
      thumb('/images/prints/Prints11.jpeg'),
      thumb('/images/prints/Prints14.jpeg'),
      thumb('/images/prints/Prints16.jpeg'),
      thumb('/images/prints/Prints20.jpeg'),
    ],
    equipment: [
      { name: 'Professional fine art printer', desc: '12-color printing, up to 17" (A2+). Museum quality.' },
      { name: 'Large format printer', desc: 'Large format up to 24" via partnership. Exhibitions and oversize prints.' },
      { name: 'Professional laminator', desc: 'Lamination and print protection for maximum durability.' },
    ],
    seo: {
      title: 'Fine Art Printing Montreal - Massive Medias',
      description: 'Gallery-quality fine art prints on professional large format printer. Premium fine art papers. Free pick-up Mile-End. 15-20% below Etsy.',
    },
  },

  'stickers-custom': {
    slug: 'stickers-custom',
    icon: Sticker,
    title: 'Custom Stickers',
    subtitle: 'Custom die-cut stickers for creators',
    heroImage: thumb('/images/stickers/Stickers1.jpeg'),
    description: `Custom die-cut stickers for artists, labels, events and brands. Complete service including graphic design if needed.

Cut to the exact shape of your design with our professional cutting equipment, each sticker is finished with lamination for water, UV and scratch resistance.`,
    highlights: [
      'Professional precision cutting equipment',
      'Matte, glossy, clear, holographic vinyl',
      'Contour cut to the exact shape of the design',
      'Lamination included - water, UV, scratch resistant',
      'Sticker graphic design included in the price',
      'Local delivery available',
      'Fast turnaround: 24-72h',
    ],
    process: [
      { step: 1, title: 'Creative brief', desc: 'Tell us what you want - logo, illustration, text, custom shape' },
      { step: 2, title: 'Graphic design', desc: 'We create or adapt your visual for cutting (included in price)' },
      { step: 3, title: 'Validation', desc: 'Digital preview for validation before production' },
      { step: 4, title: 'Printing', desc: 'High quality printing on your choice of vinyl' },
      { step: 5, title: 'Lamination', desc: 'Protective layer for maximum durability' },
      { step: 6, title: 'Cutting & delivery', desc: 'Professional precision cutting and pick-up/delivery' },
    ],
    pricing: {
      title: 'Sticker Pricing',
      note: 'Graphic design included in all prices',
      tables: [
        {
          subtitle: 'Round 2.5" holographic stickers',
          headers: ['Quantity', 'Price', 'Price/unit'],
          rows: [
            ['50', '$50', '$1.00'],
            ['100', '$85', '$0.85'],
            ['150', '$110', '$0.73'],
            ['250', '$175', '$0.70'],
          ],
        },
        {
          subtitle: 'Custom cut A4 stickers',
          headers: ['Quantity', 'Price', 'Price/sheet'],
          rows: [
            ['10 sheets', '$70', '$7.00'],
            ['25 sheets', '$150', '$6.00'],
          ],
        },
      ],
    },
    gallery: [
      thumb('/images/stickers/Stickers2.jpg'),
      thumb('/images/stickers/Stickers3.jpeg'),
      thumb('/images/stickers/Stickers4.jpeg'),
      thumb('/images/stickers/Stickers5.jpeg'),
      thumb('/images/stickers/Stickers9.jpeg'),
      thumb('/images/stickers/Stickers10.jpeg'),
      thumb('/images/stickers/Stickers11.jpeg'),
      thumb('/images/stickers/Stickers15.jpeg'),
    ],
    equipment: [
      { name: 'Professional cutter', desc: 'Precision cutting up to 12" wide. Contour, kiss-cut, die-cut.' },
      { name: 'Laminator', desc: 'Matte or glossy lamination for water/UV/scratch protection.' },
      { name: 'Vinyl printer', desc: 'High quality vinyl printing, vibrant colors.' },
    ],
    seo: {
      title: 'Custom Stickers Montreal - Massive Medias',
      description: 'Custom die-cut stickers. Holographic, matte, glossy, clear. Design included. Pro cutting. Montreal.',
    },
  },

  'sublimation-merch': {
    slug: 'sublimation-merch',
    icon: Shirt,
    title: 'Sublimation & Merch',
    subtitle: 'T-shirts, mugs, accessories - your custom merch',
    heroImage: thumb('/images/stickers/Stickers3.jpeg'),
    description: `Sublimation printing on textiles and objects. Sublimation produces vibrant and permanent colors that don't crack, don't fade and are wash-resistant.

Ideal for artist merch, events, corporate gifts or any custom project. From t-shirts to tumblers, mugs and mousepads.`,
    highlights: [
      'Large format heat press - textile',
      'Compact heat press - objects and accessories',
      'Tumbler pinch kit - drinkware sublimation',
      "Permanent printing - doesn't crack, doesn't fade",
      'Vibrant colors, wash-resistant',
      'Small and medium runs',
    ],
    process: [
      { step: 1, title: 'Product choice', desc: 'T-shirt, hoodie, mug, tumbler, mousepad, keychain, etc.' },
      { step: 2, title: 'Design', desc: 'Send your visual or request graphic design' },
      { step: 3, title: 'Validation', desc: 'Digital mockup for approval before production' },
      { step: 4, title: 'Sublimation printing', desc: 'Transfer printing on specialized sublimation paper' },
      { step: 5, title: 'Pressing', desc: 'High temperature and pressure transfer - permanent colors' },
      { step: 6, title: 'Quality check & delivery', desc: 'Quality verification and pick-up/delivery' },
    ],
    pricing: {
      title: 'Sublimation & Merch Pricing',
      note: 'Price per unit, volume discounts available. Contact us for a quote.',
      headers: ['Product', 'Starting at', 'Turnaround'],
      rows: [
        ['Sublimation t-shirt', '$35', '3-5 days'],
        ['Hoodie / sweater', '$55', '5-7 days'],
        ['Mug 11oz', '$20', '2-3 days'],
        ['Mug 15oz', '$25', '2-3 days'],
        ['Tumbler / bottle', '$30', '3-5 days'],
        ['Mousepad', '$18', '2-3 days'],
        ['Keychain', '$12', '2-3 days'],
        ['Sublimation tumbler', '$28', '3-5 days'],
      ],
    },
    gallery: [
      thumb('/images/prints/Prints5.jpeg'),
      thumb('/images/prints/Prints10.jpeg'),
      thumb('/images/prints/Prints16.jpeg'),
      thumb('/images/prints/Prints20.jpeg'),
      thumb('/images/stickers/Stickers1.jpeg'),
      thumb('/images/stickers/Stickers5.jpeg'),
      thumb('/images/stickers/Stickers9.jpeg'),
      thumb('/images/stickers/Stickers12.jpeg'),
    ],
    equipment: [
      { name: 'Large format heat press', desc: 'Large format heat press for t-shirts, hoodies and textiles.' },
      { name: 'Compact heat press', desc: 'Compact versatile press for objects and accessories.' },
      { name: 'Tumbler pinch kit', desc: 'Sublimation on tumblers, bottles and drinkware.' },
    ],
    seo: {
      title: 'Sublimation & Merch Montreal - Massive Medias',
      description: "T-shirts, mugs, tumblers, accessories in sublimation. Custom artist merch. Local production in Montreal.",
    },
  },

  'flyers-cartes': {
    slug: 'flyers-cartes',
    icon: FileText,
    title: 'Flyers & Cards',
    subtitle: 'Fast printing for events and promotions',
    heroImage: thumb('/images/prints/Prints5.jpeg'),
    description: `Flyers, postcards, business cards - everything you need to promote your event, show or project. Fast local printing, professional quality.

Perfect for artists, event promoters, labels, cafes and businesses in Mile-End and Plateau.`,
    highlights: [
      'Flyers A6, A5, letter (8.5×11")',
      'Postcards and business cards',
      'Premium 300g+ paper, matte or glossy',
      'Single or double-sided printing',
      'Express turnaround available (24h)',
      'Graphic design available as an option',
    ],
    process: [
      { step: 1, title: 'Brief', desc: 'Format, quantity, single/double-sided, desired finish' },
      { step: 2, title: 'Design (optional)', desc: "Graphic design if you don't have a print-ready file" },
      { step: 3, title: 'Validation', desc: 'Digital proof for approval' },
      { step: 4, title: 'Printing', desc: 'High quality printing on premium paper' },
      { step: 5, title: 'Cutting & finishing', desc: 'Precision cutting and finishing per your order' },
      { step: 6, title: 'Delivery', desc: 'Mile-End pick-up or local delivery' },
    ],
    pricing: {
      title: 'Flyers & Cards Pricing',
      note: 'Graphic design available as add-on. Contact us for a custom quote.',
      headers: ['Product', 'Quantity', 'Price'],
      rows: [
        ['Flyers 8.5×11"', '50', '$45'],
        ['Flyers 8.5×11"', '100', '$75'],
        ['Flyers 8.5×11"', '250', '$150'],
        ['Postcards 4×6"', '50', '$35'],
        ['Postcards 4×6"', '100', '$60'],
        ['Business cards', '100', '$45'],
        ['Business cards', '250', '$85'],
        ['Posters 11×17"', '25', '$95'],
        ['Posters 11×17"', '50', '$160'],
      ],
    },
    gallery: [
      thumb('/images/prints/Prints4.JPG'),
      thumb('/images/prints/Prints6.jpeg'),
      thumb('/images/prints/Prints9.jpeg'),
      thumb('/images/prints/Prints12.jpeg'),
      thumb('/images/prints/Prints15.jpeg'),
      thumb('/images/prints/Prints18.jpeg'),
      thumb('/images/prints/Prints22.jpeg'),
      thumb('/images/prints/Prints23.jpeg'),
    ],
    equipment: [
      { name: 'Professional printer', desc: 'Superior quality even for flyers - 12 pigmented colors.' },
      { name: '3x Inkjet printers', desc: 'Fast volume printing for standard runs.' },
      { name: 'Professional cutter', desc: 'Precision cutting for custom formats.' },
    ],
    seo: {
      title: 'Flyers & Cards Montreal - Massive Medias',
      description: 'Flyers, postcards, business cards. Fast local printing in Montreal. Pro quality, competitive pricing.',
    },
  },

  'design-graphique': {
    slug: 'design-graphique',
    icon: Palette,
    title: 'Graphic Design',
    subtitle: 'Visual identities, posters and creations for artists',
    heroImage: thumb('/images/prints/Prints10.jpeg'),
    description: `Complete graphic design service in partnership with Christopher Gagnon, graphic designer with nearly 10 years of experience. From logo design to complete visual identity, including event posters and album covers.

We know the Montreal creative scene. We know what works visually for artists, labels, promoters and local businesses.`,
    highlights: [
      'Adobe CC Suite - Photoshop, Illustrator, InDesign, Lightroom',
      'Partnership with Christopher Gagnon (10 years exp.)',
      'Logos, complete visual identities',
      'Posters, flyers, album covers',
      'Professional photo retouching',
      'Sticker design included with sticker orders',
    ],
    process: [
      { step: 1, title: 'Creative brief', desc: 'Discussion about your vision, references, target audience' },
      { step: 2, title: 'Research & moodboard', desc: 'Visual exploration, color palette, artistic direction' },
      { step: 3, title: 'Proposals', desc: '2-3 creative directions for selection and feedback' },
      { step: 4, title: 'Iterations', desc: 'Refinement based on your comments (2 revision rounds included)' },
      { step: 5, title: 'Finalization', desc: 'Final high-resolution files in all required formats' },
      { step: 6, title: 'Delivery', desc: 'Complete package: print-ready, web, social media' },
    ],
    pricing: {
      title: 'Graphic Design Pricing',
      note: 'Sticker design is included in the sticker production price.',
      headers: ['Service', 'Price', 'Timeline'],
      rows: [
        ['Logo design', '$300 – $600', '5-10 days'],
        ['Complete visual identity', '$800 – $1,500', '2-3 weeks'],
        ['Event poster / flyer', '$150 – $300', '3-5 days'],
        ['Album / single cover', '$200 – $400', '5-7 days'],
        ['Photo retouching (per image)', '$15 – $50', '24-48h'],
        ['Sticker design', 'Included', '-'],
      ],
    },
    gallery: [
      thumb('/images/prints/Prints13.jpeg'),
      thumb('/images/prints/Prints17.jpeg'),
      thumb('/images/prints/Prints19.jpeg'),
      thumb('/images/prints/Prints21.jpeg'),
      thumb('/images/prints/Prints23.jpeg'),
      thumb('/images/prints/Prints22.jpeg'),
      thumb('/images/stickers/Stickers12.jpeg'),
      thumb('/images/stickers/Stickers14.jpeg'),
    ],
    team: {
      name: 'Christopher Gagnon',
      role: 'Partner Graphic Designer',
      bio: 'Graduate graphic designer with nearly 10 years of experience. Specialized in visual identity, packaging and web design.',
      portfolio: 'Soundwave Festival, Laboratoire Bio Stratège, ChromaPur, Nutramazonie, NextGen Football, Belette Trois-Mille.',
    },
    seo: {
      title: 'Graphic Design Montreal - Massive Medias',
      description: 'Logos, visual identities, posters, album covers. Professional graphic design for creators in Montreal.',
    },
  },

  'developpement-web': {
    slug: 'developpement-web',
    icon: Code,
    title: 'Web Development',
    subtitle: 'Showcase sites, e-commerce and landing pages for creators',
    heroImage: thumb('/images/locale/locale11.jpeg'),
    description: `Modern, fast and SEO-optimized websites for artists, creators and small businesses. From artist portfolios to complete e-commerce stores, we master the technologies that matter.

15+ years of web development experience. The founder of Massive Medias is a trained programmer-analyst - this isn't a side project, it's our primary expertise.`,
    highlights: [
      'React, Angular, Node.js, AWS',
      'Headless CMS (Strapi), WordPress, Shopify',
      'Mobile-first responsive sites',
      'SEO-optimized from the start',
      '1-year hosting included (landing pages)',
      'Monthly maintenance available',
    ],
    process: [
      { step: 1, title: 'Consultation', desc: 'Discussion of your needs, goals and budget' },
      { step: 2, title: 'Architecture & wireframes', desc: 'Site structure, navigation, low-fidelity mockups' },
      { step: 3, title: 'Design', desc: 'High-fidelity mockups, palette, typography, visual identity' },
      { step: 4, title: 'Development', desc: 'Clean code, modern technologies, responsive' },
      { step: 5, title: 'Testing & optimization', desc: 'Multi-device testing, performance, SEO, accessibility' },
      { step: 6, title: 'Launch & training', desc: 'Go-live, CMS training, documentation' },
    ],
    pricing: {
      title: 'Web Development Pricing',
      note: 'Every project is unique. These prices are indicative ranges.',
      headers: ['Service', 'Price', 'Included'],
      rows: [
        ['Event landing page', '$800 – $1,200', 'Design, responsive, form, 1-year hosting'],
        ['Artist showcase site (5-10 pages)', '$2,000 – $3,500', 'Portfolio, bio, contact, social media'],
        ['Simple e-commerce site', '$4,000 – $6,000', 'Shop, payments, inventory management'],
        ['Monthly maintenance', '$100 – $200/mo', 'Updates, security, minor changes'],
      ],
    },
    gallery: [
      thumb('/images/locale/locale2.jpeg'),
      thumb('/images/locale/locale3.jpeg'),
      thumb('/images/locale/locale9.jpeg'),
      thumb('/images/locale/locale10.jpeg'),
      thumb('/images/locale/locale11.jpeg'),
      thumb('/images/prints/Prints1.jpeg'),
      thumb('/images/prints/Prints15.jpeg'),
      thumb('/images/stickers/Stickers13.jpeg'),
    ],
    technologies: [
      'React / Next.js',
      'Angular',
      'Node.js / Express',
      'Strapi (headless CMS)',
      'WordPress',
      'Shopify',
      'AWS (hosting)',
      'PostgreSQL / SQLite',
      'Tailwind CSS',
      'Framer Motion',
    ],
    seo: {
      title: 'Web Development Montreal - Massive Medias',
      description: 'Showcase sites, e-commerce, landing pages. React, Strapi, WordPress, Shopify. 15+ years experience. Montreal.',
    },
  },
};

export default servicesDataEn;
