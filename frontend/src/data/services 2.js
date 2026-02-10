import { Printer, Sticker, Shirt, FileText, Palette, Code } from 'lucide-react';
import { img } from '../utils/paths';

const servicesData = {
  'impression-fine-art': {
    slug: 'impression-fine-art',
    icon: Printer,
    title: 'Impression Fine Art',
    subtitle: 'Tirages qualité galerie sur papiers premium',
    heroImage: img('/images/prints/Prints1.jpeg'),
    description: `Le Fine Art désigne des impressions photographiques ou artistiques réalisées sur des papiers d'archives haut de gamme (coton, alpha-cellulose) avec des encres pigmentées à haute longévité. Ces tirages respectent les standards des galeries d'art et musées, avec une durée de conservation pouvant dépasser 100 ans.

Chaque impression fait l'objet d'un calibrage colorimétrique rigoureux pour garantir une fidélité optimale aux intentions de l'artiste.`,
    highlights: [
      'Canon imagePROGRAF PRO-1000 — 12 encres pigmentées',
      'Accès Canon imagePROGRAF PRO-2600 pour grands formats (24")',
      'Papiers Hahnemühle, Ilford, Canon Premium',
      'Calibration professionnelle, profils ICC sur mesure',
      'Durée de conservation 100+ ans',
      'Pick-up gratuit Mile-End, livraison locale',
    ],
    process: [
      { step: 1, title: 'Réception du fichier', desc: 'Envoi de ton fichier haute résolution (ou création graphique sur demande)' },
      { step: 2, title: 'Analyse colorimétrique', desc: 'Calibration selon le papier choisi, profil ICC adapté' },
      { step: 3, title: 'Soft proofing', desc: 'Prévisualisation numérique et validation avant impression' },
      { step: 4, title: 'Impression', desc: 'Tirage sur Canon Pro-1000 avec profil ICC personnalisé' },
      { step: 5, title: 'Séchage & contrôle', desc: 'Séchage 24h, contrôle qualité, lamination optionnelle' },
      { step: 6, title: 'Finition', desc: 'Emballage protection ou encadrement selon ta commande' },
    ],
    pricing: {
      title: 'Tarifs Impression Fine Art',
      note: '15-20% sous Etsy/Printify, qualité supérieure, zéro frais de shipping',
      headers: ['Format', 'Sans cadre', 'Avec cadre noir', 'Réf. Etsy'],
      rows: [
        ['A4 (8×10")', '45$', '75$', '59$ + shipping'],
        ['A3 (12×18")', '55$', '95$', '76$ + shipping'],
        ['A3+ (13×19")', '65$', '110$', '—'],
        ['A2 (18×24")', '95$', '150$', '132$ + shipping'],
        ['24×36" (grand format)', '150$', 'Sur demande', '189$ + shipping'],
      ],
    },
    gallery: [
      img('/images/prints/Prints2.jpeg'),
      img('/images/prints/Prints3.jpeg'),
      img('/images/prints/Prints7.jpeg'),
      img('/images/prints/Prints8.jpeg'),
      img('/images/prints/Prints11.jpeg'),
      img('/images/prints/Prints14.jpeg'),
      img('/images/prints/Prints16.jpeg'),
      img('/images/prints/Prints20.jpeg'),
    ],
    equipment: [
      { name: 'Canon imagePROGRAF PRO-1000', desc: 'Imprimante fine art 12 couleurs, jusqu\'à 17" (A2+). Qualité musée.' },
      { name: 'Canon imagePROGRAF PRO-2600', desc: 'Grand format jusqu\'à 24" via partenariat. Expositions et tirages oversize.' },
      { name: 'Lamineuse VEVOR 25"', desc: 'Lamination et protection des tirages pour une durabilité maximale.' },
    ],
    seo: {
      title: 'Impression Fine Art Montréal — Massive Medias',
      description: 'Tirages fine art qualité galerie sur Canon Pro-1000. Papiers Hahnemühle, Ilford. Pick-up gratuit Mile-End. 15-20% sous Etsy.',
    },
  },

  'stickers-custom': {
    slug: 'stickers-custom',
    icon: Sticker,
    title: 'Stickers Custom',
    subtitle: 'Autocollants découpés sur mesure pour créateurs',
    heroImage: img('/images/stickers/Stickers1.jpeg'),
    description: `Autocollants découpés sur mesure pour artistes, labels, événements et marques. Service complet incluant la création graphique du visuel si nécessaire.

Découpés à la forme exacte de ton design avec la Silhouette Cameo 5, chaque sticker est fini avec une lamination pour résister à l'eau, aux UV et aux rayures.`,
    highlights: [
      'Silhouette Cameo 5 — découpe de précision',
      'Vinyle matte, glossy, transparent, holographique',
      'Découpe contour à la forme exacte du design',
      'Lamination incluse — résistant eau, UV, rayures',
      'Création graphique incluse dans le prix',
      'Délai rapide : 24-72h',
    ],
    process: [
      { step: 1, title: 'Brief créatif', desc: 'Dis-nous ce que tu veux — logo, illustration, texte, forme custom' },
      { step: 2, title: 'Création graphique', desc: 'On crée ou adapte ton visuel pour la découpe (inclus dans le prix)' },
      { step: 3, title: 'Validation', desc: 'Aperçu numérique pour validation avant production' },
      { step: 4, title: 'Impression', desc: 'Impression haute qualité sur vinyle de ton choix' },
      { step: 5, title: 'Lamination', desc: 'Couche protectrice pour durabilité maximale' },
      { step: 6, title: 'Découpe & livraison', desc: 'Découpe de précision Cameo 5 et remise/livraison' },
    ],
    pricing: {
      title: 'Tarifs Stickers',
      note: 'Design graphique inclus dans tous les prix',
      tables: [
        {
          subtitle: 'Stickers ronds 2,5" holographiques',
          headers: ['Quantité', 'Prix', 'Prix/unité'],
          rows: [
            ['50', '50$', '1,00$'],
            ['100', '85$', '0,85$'],
            ['150', '110$', '0,73$'],
            ['250', '175$', '0,70$'],
          ],
        },
        {
          subtitle: 'Stickers A4 custom découpés',
          headers: ['Quantité', 'Prix', 'Prix/feuille'],
          rows: [
            ['10 feuilles', '70$', '7,00$'],
            ['25 feuilles', '150$', '6,00$'],
          ],
        },
      ],
    },
    gallery: [
      img('/images/stickers/Stickers2.jpg'),
      img('/images/stickers/Stickers3.jpeg'),
      img('/images/stickers/Stickers4.jpeg'),
      img('/images/stickers/Stickers5.jpeg'),
      img('/images/stickers/Stickers9.jpeg'),
      img('/images/stickers/Stickers10.jpeg'),
      img('/images/stickers/Stickers11.jpeg'),
      img('/images/stickers/Stickers15.jpeg'),
    ],
    equipment: [
      { name: 'Silhouette Cameo 5', desc: 'Découpe de précision jusqu\'à 12" de large. Contour, kiss-cut, die-cut.' },
      { name: 'Lamineuse VEVOR 25"', desc: 'Lamination matte ou glossy pour protection eau/UV/rayures.' },
      { name: 'Epson ET-2850', desc: 'Impression vinyle haute qualité, couleurs vibrantes.' },
    ],
    seo: {
      title: 'Stickers Custom Montréal — Massive Medias',
      description: 'Stickers die-cut personnalisés. Holographique, matte, glossy, transparent. Design inclus. Silhouette Cameo 5. Montréal.',
    },
  },

  'sublimation-merch': {
    slug: 'sublimation-merch',
    icon: Shirt,
    title: 'Sublimation & Merch',
    subtitle: 'T-shirts, mugs, accessoires — ton merch sur mesure',
    heroImage: img('/images/textile/Textile1.jpeg'),
    description: `Impression sublimation sur textile et objets. La sublimation produit des couleurs vibrantes et permanentes qui ne craquent pas, ne s'effacent pas et résistent au lavage.

Idéal pour le merch d'artiste, les événements, les cadeaux corporatifs ou tout projet personnalisé. Du t-shirt au thermos en passant par les mugs et les tapis de souris.`,
    highlights: [
      'Presse Bettersub — grand format textile',
      'Presse Cricut — objets et accessoires',
      'Kit pincement gobelets — drinkware sublimation',
      'Impression permanente — ne craque pas, ne s\'efface pas',
      'Couleurs vibrantes, résistant au lavage',
      'Petites et moyennes séries',
    ],
    process: [
      { step: 1, title: 'Choix du produit', desc: 'T-shirt, hoodie, mug, thermos, tapis de souris, porte-clés, etc.' },
      { step: 2, title: 'Design', desc: 'Envoi de ton visuel ou création graphique sur demande' },
      { step: 3, title: 'Validation', desc: 'Mockup numérique pour approbation avant production' },
      { step: 4, title: 'Impression sublimation', desc: 'Impression du transfert sur papier sublimation spécialisé' },
      { step: 5, title: 'Pressage', desc: 'Transfert à haute température et pression — couleurs permanentes' },
      { step: 6, title: 'Contrôle & livraison', desc: 'Vérification qualité et remise/livraison' },
    ],
    pricing: {
      title: 'Tarifs Sublimation & Merch',
      note: 'Prix par unité, dégressif selon quantité. Contacte-nous pour un devis.',
      headers: ['Produit', 'À partir de', 'Délai'],
      rows: [
        ['T-shirt sublimation', '35$', '3-5 jours'],
        ['Hoodie / chandail', '55$', '5-7 jours'],
        ['Mug 11oz', '20$', '2-3 jours'],
        ['Mug 15oz', '25$', '2-3 jours'],
        ['Thermos / bouteille', '30$', '3-5 jours'],
        ['Tapis de souris', '18$', '2-3 jours'],
        ['Porte-clés', '12$', '2-3 jours'],
        ['Gobelet sublimation', '28$', '3-5 jours'],
      ],
    },
    gallery: [
      img('/images/textile/Textile2.jpeg'),
      img('/images/textile/Textile3.jpeg'),
      img('/images/textile/Textile5.jpeg'),
      img('/images/textile/Textile7.jpeg'),
      img('/images/textile/Textile9.jpeg'),
      img('/images/textile/Textile13.jpeg'),
      img('/images/textile/Textile17.jpeg'),
      img('/images/textile/Textile20.jpeg'),
    ],
    equipment: [
      { name: 'Heat Press Bettersub', desc: 'Presse à chaud grand format pour t-shirts, hoodies et textiles.' },
      { name: 'Heat Press Cricut', desc: 'Presse compacte polyvalente pour objets et accessoires.' },
      { name: 'Kit pincement gobelets', desc: 'Sublimation sur gobelets, thermos et drinkware.' },
    ],
    seo: {
      title: 'Sublimation & Merch Montréal — Massive Medias',
      description: 'T-shirts, mugs, thermos, accessoires en sublimation. Merch d\'artiste sur mesure. Production locale Montréal.',
    },
  },

  'flyers-cartes': {
    slug: 'flyers-cartes',
    icon: FileText,
    title: 'Flyers & Cartes',
    subtitle: 'Impression rapide pour événements et promotions',
    heroImage: img('/images/prints/Prints5.jpeg'),
    description: `Flyers, cartes postales, cartes d'affaires — tout ce dont tu as besoin pour promouvoir ton événement, ton show ou ton projet. Impression locale rapide, qualité pro.

Parfait pour les artistes, promoteurs d'événements, labels, cafés et commerces du Mile-End et Plateau.`,
    highlights: [
      'Flyers A6, A5, lettre (8,5×11")',
      'Cartes postales et cartes d\'affaires',
      'Papier premium 300g+ mat ou brillant',
      'Impression recto ou recto-verso',
      'Délai express disponible (24h)',
      'Design graphique disponible en option',
    ],
    process: [
      { step: 1, title: 'Brief', desc: 'Format, quantité, recto/verso, finition souhaitée' },
      { step: 2, title: 'Design (optionnel)', desc: 'Création graphique si tu n\'as pas de fichier prêt' },
      { step: 3, title: 'Validation', desc: 'Épreuve numérique pour approbation' },
      { step: 4, title: 'Impression', desc: 'Impression haute qualité sur papier premium' },
      { step: 5, title: 'Découpe & finition', desc: 'Découpe de précision et finition selon ta commande' },
      { step: 6, title: 'Livraison', desc: 'Pick-up Mile-End ou livraison locale' },
    ],
    pricing: {
      title: 'Tarifs Flyers & Cartes',
      note: 'Design graphique disponible en supplément. Contacte-nous pour un devis personnalisé.',
      headers: ['Produit', 'Quantité', 'Prix'],
      rows: [
        ['Flyers 8,5×11"', '50', '45$'],
        ['Flyers 8,5×11"', '100', '75$'],
        ['Flyers 8,5×11"', '250', '150$'],
        ['Cartes postales 4×6"', '50', '35$'],
        ['Cartes postales 4×6"', '100', '60$'],
        ['Cartes d\'affaires', '100', '45$'],
        ['Cartes d\'affaires', '250', '85$'],
        ['Affiches 11×17"', '25', '95$'],
        ['Affiches 11×17"', '50', '160$'],
      ],
    },
    gallery: [
      img('/images/prints/Prints4.JPG'),
      img('/images/prints/Prints6.jpeg'),
      img('/images/prints/Prints9.jpeg'),
      img('/images/prints/Prints12.jpeg'),
      img('/images/prints/Prints15.jpeg'),
      img('/images/prints/Prints18.jpeg'),
      img('/images/prints/Prints22.jpeg'),
      img('/images/prints/Prints25.jpeg'),
    ],
    equipment: [
      { name: 'Canon imagePROGRAF PRO-1000', desc: 'Qualité supérieure même pour les flyers — 12 couleurs pigmentées.' },
      { name: 'Epson ET-2850', desc: 'Volume d\'impression rapide pour les séries courantes.' },
      { name: 'Silhouette Cameo 5', desc: 'Découpe de précision pour formats personnalisés.' },
    ],
    seo: {
      title: 'Flyers & Cartes Montréal — Massive Medias',
      description: 'Flyers, cartes postales, cartes d\'affaires. Impression rapide et locale à Montréal. Qualité pro, prix compétitifs.',
    },
  },

  'design-graphique': {
    slug: 'design-graphique',
    icon: Palette,
    title: 'Design Graphique',
    subtitle: 'Identités visuelles, affiches et créations pour artistes',
    heroImage: img('/images/prints/Prints10.jpeg'),
    description: `Service complet de design graphique en partenariat avec Christopher Gagnon, infographiste avec près de 10 ans d'expérience. De la conception de logo à l'identité visuelle complète, en passant par les affiches d'événements et les pochettes d'album.

On connaît la scène créative montréalaise. On sait ce qui marche visuellement pour les artistes, labels, promoteurs et commerces locaux.`,
    highlights: [
      'Suite Adobe CC — Photoshop, Illustrator, InDesign, Lightroom',
      'Partenariat avec Christopher Gagnon (10 ans exp.)',
      'Logos, identités visuelles complètes',
      'Affiches, flyers, pochettes album',
      'Retouche photo professionnelle',
      'Design stickers inclus avec commande stickers',
    ],
    process: [
      { step: 1, title: 'Brief créatif', desc: 'Discussion sur ta vision, tes références, ton public cible' },
      { step: 2, title: 'Recherche & moodboard', desc: 'Exploration visuelle, palette de couleurs, direction artistique' },
      { step: 3, title: 'Propositions', desc: '2-3 directions créatives pour choix et feedback' },
      { step: 4, title: 'Itérations', desc: 'Raffinement selon tes commentaires (2 rondes de révisions incluses)' },
      { step: 5, title: 'Finalisation', desc: 'Fichiers finaux haute résolution dans tous les formats nécessaires' },
      { step: 6, title: 'Livraison', desc: 'Package complet : print-ready, web, réseaux sociaux' },
    ],
    pricing: {
      title: 'Tarifs Design Graphique',
      note: 'Le design de stickers est inclus dans le prix de production des stickers.',
      headers: ['Service', 'Prix', 'Délai'],
      rows: [
        ['Création logo', '300$ – 600$', '5-10 jours'],
        ['Identité visuelle complète', '800$ – 1 500$', '2-3 semaines'],
        ['Affiche / flyer événement', '150$ – 300$', '3-5 jours'],
        ['Pochette album / single', '200$ – 400$', '5-7 jours'],
        ['Retouche photo (par image)', '15$ – 50$', '24-48h'],
        ['Design stickers', 'Inclus', '—'],
      ],
    },
    gallery: [
      img('/images/prints/Prints13.jpeg'),
      img('/images/prints/Prints17.jpeg'),
      img('/images/prints/Prints19.jpeg'),
      img('/images/prints/Prints21.jpeg'),
      img('/images/prints/Prints23.jpeg'),
      img('/images/prints/Prints24.jpeg'),
      img('/images/stickers/Stickers12.jpeg'),
      img('/images/stickers/Stickers14.jpeg'),
    ],
    team: {
      name: 'Christopher Gagnon',
      role: 'Infographiste partenaire',
      bio: 'Diplômé en design graphique avec près de 10 ans d\'expérience. Spécialisé en identité visuelle, packaging et design web.',
      portfolio: 'Soundwave Festival, Laboratoire Bio Stratège, ChromaPur, Nutramazonie, NextGen Football, Belette Trois-Mille.',
    },
    seo: {
      title: 'Design Graphique Montréal — Massive Medias',
      description: 'Logos, identités visuelles, affiches, pochettes album. Design graphique professionnel pour créateurs à Montréal.',
    },
  },

  'developpement-web': {
    slug: 'developpement-web',
    icon: Code,
    title: 'Développement Web',
    subtitle: 'Sites vitrines, e-commerce et landing pages pour créateurs',
    heroImage: img('/images/locale/locale1.jpeg'),
    description: `Sites web modernes, performants et optimisés SEO pour artistes, créateurs et petites entreprises. Du portfolio d'artiste à la boutique e-commerce complète, on maîtrise les technologies qui comptent.

15+ années d'expérience en développement web. Le fondateur de Massive Medias est programmeur-analyste de formation — ce n'est pas un side-project, c'est notre expertise première.`,
    highlights: [
      'React, Angular, Node.js, AWS',
      'CMS headless (Strapi), WordPress, Shopify',
      'Sites responsive mobile-first',
      'SEO optimisé dès le départ',
      'Hébergement 1 an inclus (landing pages)',
      'Maintenance mensuelle disponible',
    ],
    process: [
      { step: 1, title: 'Consultation', desc: 'Discussion de tes besoins, objectifs et budget' },
      { step: 2, title: 'Architecture & wireframes', desc: 'Structure du site, navigation, maquettes basse fidélité' },
      { step: 3, title: 'Design', desc: 'Maquettes haute fidélité, palette, typographie, identité visuelle' },
      { step: 4, title: 'Développement', desc: 'Code propre, technologies modernes, responsive' },
      { step: 5, title: 'Tests & optimisation', desc: 'Tests multi-devices, performances, SEO, accessibilité' },
      { step: 6, title: 'Lancement & formation', desc: 'Mise en ligne, formation sur le CMS, documentation' },
    ],
    pricing: {
      title: 'Tarifs Développement Web',
      note: 'Chaque projet est unique. Ces prix sont des fourchettes indicatives.',
      headers: ['Service', 'Prix', 'Inclus'],
      rows: [
        ['Landing page événement', '800$ – 1 200$', 'Design, responsive, formulaire, hébergement 1 an'],
        ['Site vitrine artiste (5-10 pages)', '2 000$ – 3 500$', 'Portfolio, bio, contact, réseaux sociaux'],
        ['Site e-commerce simple', '4 000$ – 6 000$', 'Boutique, paiement, gestion stocks'],
        ['Maintenance mensuelle', '100$ – 200$/mois', 'Mises à jour, sécurité, modifications mineures'],
      ],
    },
    gallery: [
      img('/images/locale/locale2.jpeg'),
      img('/images/locale/locale4.jpeg'),
      img('/images/locale/locale6.jpeg'),
      img('/images/locale/locale12.jpeg'),
      img('/images/locale/locale13.jpeg'),
      img('/images/locale/locale14.jpeg'),
      img('/images/prints/Prints26.jpeg'),
      img('/images/stickers/Stickers13.jpeg'),
    ],
    technologies: [
      'React / Next.js',
      'Angular',
      'Node.js / Express',
      'Strapi (CMS headless)',
      'WordPress',
      'Shopify',
      'AWS (hébergement)',
      'PostgreSQL / SQLite',
      'Tailwind CSS',
      'Framer Motion',
    ],
    seo: {
      title: 'Développement Web Montréal — Massive Medias',
      description: 'Sites vitrines, e-commerce, landing pages. React, Strapi, WordPress, Shopify. 15+ ans d\'expérience. Montréal.',
    },
  },
};

export default servicesData;
