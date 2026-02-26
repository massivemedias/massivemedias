import type { Core } from '@strapi/strapi';

const siteContentSeedData = {
  announcementFr: '',
  announcementEn: '',
  announcementActive: false,

  homeSeo: {
    titleFr: 'Massive Medias - Studio de production créative, Montréal',
    titleEn: 'Massive Medias - Creative Production Studio, Montreal',
    descriptionFr: 'Impression fine art, stickers custom, sublimation, design graphique et développement web à Montréal. Service local depuis 2013.',
    descriptionEn: 'Fine art printing, custom stickers, sublimation, graphic design and web development in Montreal. Local service since 2013.',
  },

  heroTaglineFr: 'Create. Print. Repeat.',
  heroTaglineEn: 'Create. Print. Repeat.',
  heroSubtitleFr: 'Studio de production créative à Montréal',
  heroSubtitleEn: 'Creative Production Studio in Montreal',
  heroServicesFr: 'Prints · Stickers · Merch · Design',
  heroServicesEn: 'Prints · Stickers · Merch · Design',
  heroCta1Fr: 'Voir nos services',
  heroCta1En: 'View Our Services',
  heroCta2Fr: 'Demander une soumission',
  heroCta2En: 'Request a Quote',

  servicesSectionTitleFr: 'Tout sous un même toit.',
  servicesSectionTitleEn: 'Everything Under One Roof.',
  servicesSectionSubtitleFr: "De l'idée à l'objet fini, on s'occupe de tout.",
  servicesSectionSubtitleEn: 'From idea to finished product, we handle everything.',
  serviceCards: [
    { titleFr: 'Prints', titleEn: 'Prints', descriptionFr: "Tirages fine art, posters, affiches, flyers et cartes d'affaires. Impression professionnelle grand format et rapide, locale.", descriptionEn: 'Fine art prints, posters, flyers and business cards. Professional large format and fast local printing.', link: '/services/prints', iconName: 'Printer' },
    { titleFr: 'Stickers', titleEn: 'Stickers', descriptionFr: 'Die-cut sur mesure avec découpe de précision professionnelle. Matte, glossy, transparent, holographique basic ou premium.', descriptionEn: 'Custom die-cut with professional precision cutting. Matte, glossy, clear, basic or premium holographic.', link: '/services/stickers', iconName: 'Sticker' },
    { titleFr: 'Merch', titleEn: 'Merch', descriptionFr: 'T-shirts, hoodies, mugs, thermos, tapis de souris, porte-clés et plus. Impression sublimation sur mesure.', descriptionEn: 'T-shirts, hoodies, mugs, tumblers, mousepads, keychains and more. Custom sublimation printing.', link: '/services/merch', iconName: 'Shirt' },
    { titleFr: 'Design', titleEn: 'Design', descriptionFr: 'Logos, identités visuelles, affiches, packaging. Design graphique et création visuelle.', descriptionEn: 'Logos, visual identities, posters, packaging. Graphic design and visual creation.', link: '/services/design', iconName: 'Palette' },
    { titleFr: 'Web & SEO', titleEn: 'Web & SEO', descriptionFr: 'Sites web, e-commerce, référencement naturel. Développement web moderne et optimisation SEO.', descriptionEn: 'Websites, e-commerce, search engine optimization. Modern web development and SEO.', link: '/services/design', iconName: 'Globe' },
  ],

  projectsSectionTitleFr: 'Nos réalisations',
  projectsSectionTitleEn: 'Our Work',
  projectsSectionSubtitleFr: "Quelques projets qui parlent d'eux-mêmes.",
  projectsSectionSubtitleEn: 'A few projects that speak for themselves.',
  featuredProjects: [
    { titleFr: 'Tirages Fine Art', titleEn: 'Fine Art Prints', categoryFr: 'Impression', categoryEn: 'Printing', link: '/boutique/fine-art' },
    { titleFr: 'Stickers Holographiques', titleEn: 'Holographic Stickers', categoryFr: 'Stickers', categoryEn: 'Stickers', link: '/boutique/stickers' },
    { titleFr: 'T-shirts Sublimation', titleEn: 'Sublimation T-Shirts', categoryFr: 'Merch', categoryEn: 'Merch', link: '/boutique/sublimation' },
    { titleFr: 'Affiches Événement', titleEn: 'Event Posters', categoryFr: 'Impression', categoryEn: 'Printing', link: '/boutique/flyers' },
    { titleFr: 'Die-Cut Custom', titleEn: 'Custom Die-Cut', categoryFr: 'Stickers', categoryEn: 'Stickers', link: '/boutique/stickers' },
    { titleFr: 'Mugs & Accessoires', titleEn: 'Mugs & Accessories', categoryFr: 'Merch', categoryEn: 'Merch', link: '/boutique/sublimation' },
  ],

  stats: [
    { value: '2013', suffix: '', labelFr: 'Depuis', labelEn: 'Since', isCounter: true },
    { value: '150', suffix: '+', labelFr: 'Projets livrés', labelEn: 'Projects delivered', isCounter: true },
    { value: '100', suffix: '%', labelFr: 'Local, Montréal', labelEn: 'Local, Montreal', isCounter: true },
    { value: '24-48', suffix: 'h', labelFr: 'Délai standard', labelEn: 'Standard turnaround', isCounter: false },
  ],

  advantagesTitleFr: 'Pourquoi Massive?',
  advantagesTitleEn: 'Why Massive?',
  advantages: [
    { titleFr: 'Livraison locale gratuite', titleEn: 'Free Local Delivery', descriptionFr: 'Basé dans le Mile-End à Montréal. Pick-up ou livraison locale, zéro frais de shipping, zéro délai postal.', descriptionEn: 'Based in Mile-End, Montreal. Pick-up or local delivery, zero shipping fees, zero postal delays.', iconName: 'Truck' },
    { titleFr: 'Qualité professionnelle', titleEn: 'Professional Quality', descriptionFr: "Équipement d'impression grand format, papiers fine art, découpe de précision. Du matériel pro pour des résultats pro.", descriptionEn: 'Large format printing equipment, fine art papers, precision cutting. Pro gear for pro results.', iconName: 'Award' },
    { titleFr: 'Service personnalisé', titleEn: 'Personalized Service', descriptionFr: "Un seul interlocuteur de A à Z. On comprend ton projet parce qu'on vient du même milieu créatif.", descriptionEn: 'One point of contact from A to Z. We understand your project because we come from the same creative scene.', iconName: 'Users' },
    { titleFr: 'Solution complète', titleEn: 'Complete Solution', descriptionFr: 'Impression + design + web + merch. Pas besoin de courir entre 4 fournisseurs différents.', descriptionEn: 'Printing + design + web + merch. No need to run between 4 different vendors.', iconName: 'Zap' },
    { titleFr: 'Prix compétitifs', titleEn: 'Competitive Pricing', descriptionFr: 'Fine art 20% sous la concurrence. Pas de frais cachés, pas de minimum excessif.', descriptionEn: 'Fine art 20% below competition. No hidden fees, no excessive minimums.', iconName: 'DollarSign' },
    { titleFr: 'La scène, on connaît', titleEn: 'We Know the Scene', descriptionFr: "Musiciens, photographes, artistes visuels, promoteurs d'événements - c'est notre monde depuis le jour 1.", descriptionEn: "Musicians, photographers, visual artists, event promoters - it's been our world since day 1.", iconName: 'Music' },
  ],

  testimonialsTitleFr: 'Ce que nos clients disent',
  testimonialsTitleEn: 'What Our Clients Say',
  testimonials: [
    { name: 'Samuel L.', roleFr: 'Photographe', roleEn: 'Photographer', textFr: 'Tirages fine art impeccables. La qualité des couleurs est fidèle à mes fichiers. Je recommande à tous les photographes de Montréal.', textEn: 'Flawless fine art prints. Color quality is true to my files. I recommend to all Montreal photographers.' },
    { name: 'Marie-Ève D.', roleFr: "Promotrice d'événements", roleEn: 'Event Promoter', textFr: 'Stickers et affiches pour notre festival en 48h. Qualité et rapidité au rendez-vous. On revient chaque année!', textEn: 'Stickers and posters for our festival in 48h. Quality and speed delivered. We come back every year!' },
    { name: 'Julien P.', roleFr: 'Musicien', roleEn: 'Musician', textFr: 'Du merch pour notre tournée: t-shirts, stickers, affiches. Tout était parfait et livré dans les temps. Le one-stop shop idéal.', textEn: 'Merch for our tour: t-shirts, stickers, posters. Everything was perfect and delivered on time. The ideal one-stop shop.' },
  ],

  ctaTitleFr: 'Prêt à lancer ton projet?',
  ctaTitleEn: 'Ready to Launch Your Project?',
  ctaSubtitleFr: 'Dis-nous ce que tu as en tête. Soumission rapide, sans engagement.',
  ctaSubtitleEn: 'Tell us what you have in mind. Quick quote, no commitment.',
  ctaButtonFr: 'Demander une soumission',
  ctaButtonEn: 'Request a Quote',

  aboutSeo: {
    titleFr: 'À propos - Massive Medias',
    titleEn: 'About - Massive Medias',
    descriptionFr: "Studio de production créative fondé en 2020 à Montréal. L'équipe, l'espace et notre histoire.",
    descriptionEn: 'Creative production studio founded in 2020 in Montreal. The team, the space and our story.',
  },
  aboutHeroTitleFr: 'À propos',
  aboutHeroTitleEn: 'About',
  aboutHeroSubtitleFr: 'Un studio créatif ancré dans le Mile-End, au cœur de la scène artistique montréalaise.',
  aboutHeroSubtitleEn: "A creative studio rooted in Mile-End, at the heart of Montreal's artistic scene.",
  aboutHistoryTitleFr: "L'histoire",
  aboutHistoryTitleEn: 'Our Story',
  aboutTextFr: "Massive Medias est un studio de production créative actif depuis 2013 et établi dans le Mile-End, au cœur de l'écosystème artistique montréalais.\nL'entreprise offre quatre services intégrés destinés aux artistes visuels, photographes, musiciens et créateurs indépendants : impressions fine art, stickers personnalisés, design graphique et développement web.\nNotre philosophie : offrir un service local, personnalisé et de qualité professionnelle, sans les délais et les complications des services en ligne. Pas de shipping, pas d'attente. Pick-up au Mile-End ou livraison locale.",
  aboutTextEn: "Massive Medias is a creative production studio active since 2013 and based in Mile-End, at the heart of Montreal's artistic ecosystem.\nThe company offers four integrated services for visual artists, photographers, musicians and independent creators: fine art printing, custom stickers, graphic design and web development.\nOur philosophy: offer local, personalized, professional-quality service without the delays and complications of online services. No shipping, no waiting. Pick-up in Mile-End or local delivery.",
  aboutTimelineTitleFr: 'Notre parcours',
  aboutTimelineTitleEn: 'Our Journey',
  aboutTimeline: [
    { year: '2013', eventFr: 'Premiers projets graphiques et web en freelance. Naissance de la vision Massive Medias.', eventEn: 'First freelance graphic and web projects. Birth of the Massive Medias vision.' },
    { year: '2018-2019', eventFr: 'Début impression et matériel promotionnel pour la scène musicale montréalaise.', eventEn: 'Started printing and promotional materials for the Montreal music scene.' },
    { year: '2020', eventFr: 'Massive Medias devient activité structurée. Lancement officiel du studio.', eventEn: 'Massive Medias becomes a structured business. Official studio launch.' },
    { year: '2023-2024', eventFr: "Acquisition d'équipements professionnels d'impression, découpe et sublimation.", eventEn: 'Acquisition of professional printing, cutting and sublimation equipment.' },
    { year: '2025', eventFr: 'Enregistrement officiel au REQ. Recentrage: prints, stickers, graphisme, web.', eventEn: 'Official registration with the REQ. Refocus: prints, stickers, design, web.' },
    { year: '2026', eventFr: 'Incorporation provinciale prévue. Lancement Merch-as-a-Service.', eventEn: 'Provincial incorporation planned. Launch of Merch-as-a-Service.' },
  ],
  aboutTeamTitleFr: "L'équipe",
  aboutTeamTitleEn: 'The Team',
  aboutTeam: [
    { name: 'Michael "Mika" Sanchez', roleFr: 'Fondateur', roleEn: 'Founder', bioFr: "Fondateur de Massive Medias, Mika est aussi compositeur de musique électronique et producteur sous le nom Maudite Machine et fondateur du label VRSTL Records. Programmeur-analyste de formation, il combine expertise technique et connaissance intime de la scène créative montréalaise.", bioEn: 'Founder of Massive Medias, Mika is also an electronic music composer and producer under the name Maudite Machine and founder of the label VRSTL Records. Trained as a programmer-analyst, he combines technical expertise with an intimate knowledge of the Montreal creative scene.', bio2Fr: "15+ années d'expérience en développement web et design graphique. Expertise en gestion de la couleur et calibration pour l'impression Fine Art.", bio2En: '15+ years of experience in web development and graphic design. Expertise in color management and calibration for Fine Art printing.' },
    { name: 'Christopher Gagnon', roleFr: 'Partenaire Design', roleEn: 'Design Partner', bioFr: "Infographiste diplômé avec près de 10 ans d'expérience. Spécialisé en identité visuelle, packaging et design web. Christopher apporte une expertise créative complète à chaque projet.", bioEn: 'Graduate graphic designer with nearly 10 years of experience. Specialized in visual identity, packaging and web design. Christopher brings complete creative expertise to every project.', bio2Fr: 'Portfolio : Soundwave Festival, Laboratoire Bio Stratège, ChromaPur, Nutramazonie, NextGen Football et plus encore.', bio2En: 'Portfolio: Soundwave Festival, Laboratoire Bio Stratège, ChromaPur, Nutramazonie, NextGen Football and more.' },
  ],
  aboutEquipmentTitleFr: 'Notre équipement',
  aboutEquipmentTitleEn: 'Our Equipment',
  aboutEquipment: [
    { nameFr: 'Imprimante fine art', nameEn: 'Fine art printer', descFr: 'Impression professionnelle 12 couleurs, jusqu\'à 17"', descEn: 'Professional 12-color printing, up to 17"', iconName: 'Printer' },
    { nameFr: 'Découpe professionnelle', nameEn: 'Professional cutter', descFr: 'Découpe stickers et vinyle de précision', descEn: 'Precision sticker and vinyl cutting', iconName: 'Scissors' },
    { nameFr: 'Presse à chaud grand format', nameEn: 'Large format heat press', descFr: 'Sublimation textile grand format', descEn: 'Large format textile sublimation', iconName: 'Shirt' },
    { nameFr: 'Presse à chaud compacte', nameEn: 'Compact heat press', descFr: 'Presse polyvalente pour objets et accessoires', descEn: 'Versatile press for objects and accessories', iconName: 'Shirt' },
    { nameFr: 'Lamineuse', nameEn: 'Laminator', descFr: 'Lamination et finition professionnelle', descEn: 'Professional lamination and finishing', iconName: 'Monitor' },
    { nameFr: 'Imprimante courante', nameEn: 'Standard printer', descFr: 'Impression courante et épreuves', descEn: 'Everyday printing and proofs', iconName: 'Printer' },
    { nameFr: 'Station de travail', nameEn: 'Workstation', descFr: 'Production, design et développement', descEn: 'Production, design and development', iconName: 'Monitor' },
  ],
  aboutSpaceLocationFr: 'Mile-End, Montréal',
  aboutSpaceLocationEn: 'Mile-End, Montreal',
  aboutSpaceTitleFr: "L'espace Versatile",
  aboutSpaceTitleEn: 'The Versatile Space',
  aboutSpaceDescriptionFr: "On opère depuis l'espace collaboratif Versatile, au 7049 rue Saint-Urbain dans le Mile-End. Un lieu de création partagé avec une quinzaine de créateurs : vidéastes, photographes, designers, artistes. Pick-up disponible sur rendez-vous.",
  aboutSpaceDescriptionEn: "We operate from the Versatile collaborative space, at 7049 Saint-Urbain Street in Mile-End. A shared creative space with about fifteen creators: videographers, photographers, designers, artists. Pick-up available by appointment.",
  aboutUniverseTitleFr: "Aussi dans l'univers Massive",
  aboutUniverseTitleEn: 'Also in the Massive Universe',
  aboutUniverse: [
    { titleFr: 'Maudite Machine', titleEn: 'Maudite Machine', descriptionFr: "Compositeur de musique électronique et producteur. Sets et productions dark disco / indie dance. Sorties sur plusieurs labels, performances lors d'événements majeurs au Canada.", descriptionEn: 'Electronic music composer and producer. Dark disco / indie dance sets and productions. Releases on multiple labels, performances at major events across Canada.', url: 'https://mauditemachine.com' },
    { titleFr: 'VRSTL Records', titleEn: 'VRSTL Records', descriptionFr: "Label canadien dédié à l'Indie Dance et la Dark Minimal. Direction artistique, gestion des sorties, distribution digitale et promotion.", descriptionEn: 'Canadian label dedicated to Indie Dance and Dark Minimal. Art direction, release management, digital distribution and promotion.', url: 'https://vrstl.com' },
  ],
  contactSeo: {
    titleFr: 'Contact - Massive Medias',
    titleEn: 'Contact - Massive Medias',
    descriptionFr: 'Demande de soumission et contact. On te revient dans les 24h.',
    descriptionEn: "Quote request and contact. We'll get back to you within 24 hours.",
  },
  footerTaglineFr: 'Create. Print. Repeat.',
  footerTaglineEn: 'Create. Print. Repeat.',
  footerStudioDescFr: 'Studio de production créative',
  footerStudioDescEn: 'Creative production studio',
  footerLocationFr: 'Montréal, QC',
  footerLocationEn: 'Montreal, QC',
  contactEmail: 'info@massivemedias.com',
  contactPhone: '',
  socialLinks: [
    { platform: 'instagram', url: 'https://instagram.com/massivemedias', label: 'Instagram' },
    { platform: 'facebook', url: 'https://facebook.com/massivemedias', label: 'Facebook' },
    { platform: 'whatsapp', url: 'https://wa.me/15146531423', label: 'WhatsApp' },
  ],
  newsletterFormEndpoint: 'https://formspree.io/f/xzdardoe',
};

const servicePagesSeedData = [
  {
    slug: 'prints',
    boutiqueSlug: 'fine-art',
    iconName: 'Printer',
    titleFr: 'Prints',
    titleEn: 'Prints',
    subtitleFr: 'Fine art, flyers, cartes - impression qualité pro',
    subtitleEn: 'Fine art, flyers, cards - professional quality printing',
    descriptionFr: "Le Fine Art désigne des impressions photographiques ou artistiques réalisées sur des papiers d'archives haut de gamme (coton, alpha-cellulose) avec des encres pigmentées à haute longévité. Ces tirages respectent les standards des galeries d'art et musées, avec une durée de conservation pouvant dépasser 100 ans.\n\nChaque impression fait l'objet d'un calibrage colorimétrique rigoureux pour garantir une fidélité optimale aux intentions de l'artiste.\n\nNous imprimons aussi des flyers, cartes postales et cartes d'affaires - tout ce dont tu as besoin pour promouvoir ton événement, ton show ou ton projet. Impression locale rapide, qualité pro.",
    descriptionEn: "Fine Art refers to photographic or artistic prints made on high-end archival papers (cotton, alpha-cellulose) with pigmented inks for maximum longevity. These prints meet gallery and museum standards, with a conservation life exceeding 100 years.\n\nEach print undergoes rigorous color calibration to ensure optimal fidelity to the artist's intentions.\n\nWe also print flyers, postcards and business cards - everything you need to promote your event, show or project. Fast local printing, professional quality.",
    highlightsFr: ['Imprimante professionnelle fine art - 12 encres pigmentées','Accès imprimante grand format pour tirages 24" et plus','Papiers fine art professionnels premium','Calibration professionnelle, profils ICC sur mesure','Durée de conservation 100+ ans','Flyers A6, A5, lettre (8,5×11")','Cartes postales et cartes d\'affaires','Papier premium 300g+ mat ou brillant','Pick-up gratuit Mile-End, livraison locale'],
    highlightsEn: ['Professional fine art printer - 12 pigmented inks','Large format printer access for 24"+ prints','Premium professional fine art papers','Professional calibration, custom ICC profiles','100+ year conservation life','Flyers A6, A5, letter (8.5×11")','Postcards and business cards','Premium 300g+ paper, matte or glossy','Free pick-up Mile-End, local delivery'],
    processFr: [{ step: 1, title: 'Réception du fichier', desc: 'Envoi de ton fichier haute résolution (ou création graphique sur demande)' },{ step: 2, title: 'Analyse colorimétrique', desc: 'Calibration selon le papier choisi, profil ICC adapté' },{ step: 3, title: 'Soft proofing', desc: 'Prévisualisation numérique et validation avant impression' },{ step: 4, title: 'Impression', desc: 'Tirage sur imprimante professionnelle grand format avec profil ICC personnalisé' },{ step: 5, title: 'Séchage & contrôle', desc: 'Séchage 24h, contrôle qualité, lamination optionnelle' },{ step: 6, title: 'Finition', desc: 'Emballage protection ou encadrement selon ta commande' }],
    processEn: [{ step: 1, title: 'File reception', desc: 'Submit your high-resolution file (or graphic design on request)' },{ step: 2, title: 'Color analysis', desc: 'Calibration according to chosen paper, adapted ICC profile' },{ step: 3, title: 'Soft proofing', desc: 'Digital preview and validation before printing' },{ step: 4, title: 'Printing', desc: 'Print on professional large format printer with custom ICC profile' },{ step: 5, title: 'Drying & quality check', desc: '24h drying, quality control, optional lamination' },{ step: 6, title: 'Finishing', desc: 'Protective packaging or framing per your order' }],
    comparisonFr: { title: 'Studio vs Musée : quelle série choisir?', headers: ['Critère', 'Série Studio', 'Série Musée'], rows: [['Imprimante','Epson ET-15000','Canon PRO-1000 / PRO-2600'],['Encres','4 couleurs pigmentées','12 couleurs pigmentées'],['Gamut couleur','Excellent','Ultra-large (galerie)'],['Longévité','50+ ans','100+ ans (archival)'],['Papier max','A2 (18×24")','A1 (24×36")'],['Idéal pour','Décoration, cadeaux, affiches','Expositions, galeries, collectionneurs'],['Profil ICC','Standard','Sur mesure par tirage']] },
    comparisonEn: { title: 'Studio vs Museum: Which Series to Choose?', headers: ['Criteria', 'Studio Series', 'Museum Series'], rows: [['Printer','Epson ET-15000','Canon PRO-1000 / PRO-2600'],['Inks','4 pigment inks','12 pigment inks'],['Color gamut','Excellent','Ultra-wide (gallery grade)'],['Longevity','50+ years','100+ years (archival)'],['Max paper size','A2 (18×24")','A1 (24×36")'],['Best for','Decor, gifts, posters','Exhibitions, galleries, collectors'],['ICC Profile','Standard','Custom per print']] },
    pricingFr: { title: 'Tarifs Prints', note: 'Série Studio : bonne qualité pour tout · Série Musée : qualité supérieure pour la photographie et les tirages galerie · Ajouter 30$ pour un cadre noir ou blanc', tables: [{ subtitle: 'Impression Fine Art', headers: ['Format','Série Studio (Epson ET-15000)','Série Musée (Canon PRO-1000 / PRO-2600)'], rows: [['A4 (8.5×11")','16$','35$'],['A3 (11×17")','22$','65$'],['A3+ (13×19")','30$','95$'],['A2 (18×24")','42$','125$']] },{ subtitle: 'Flyers & Cartes Postales (A6 / 4"×6")', headers: ['Quantité','Prix total','Prix/unité'], rows: [['50','40$','0,80$'],['100','65$','0,65$'],['150','90$','0,60$'],['250','130$','0,52$'],['500','225$','0,45$']] }] },
    pricingEn: { title: 'Prints Pricing', note: 'Studio Series: great quality for everything · Museum Series: superior quality for photography and gallery prints · Add $30 for a black or white frame', tables: [{ subtitle: 'Fine Art Printing', headers: ['Format','Studio Series (Epson ET-15000)','Museum Series (Canon PRO-1000 / PRO-2600)'], rows: [['A4 (8.5×11")','$16','$35'],['A3 (11×17")','$22','$65'],['A3+ (13×19")','$30','$95'],['A2 (18×24")','$42','$125']] },{ subtitle: 'Flyers & Postcards (A6 / 4"×6")', headers: ['Quantity','Total Price','Price/unit'], rows: [['50','$40','$0.80'],['100','$65','$0.65'],['150','$90','$0.60'],['250','$130','$0.52'],['500','$225','$0.45']] }] },
    equipmentFr: [{ name: 'Imprimante fine art professionnelle', desc: 'Impression 12 couleurs, jusqu\'à 17" (A2+). Qualité musée.' },{ name: 'Imprimante grand format', desc: 'Grand format jusqu\'à 24" via partenariat. Expositions et tirages oversize.' },{ name: 'Lamineuse professionnelle', desc: 'Lamination et protection des tirages pour une durabilité maximale.' },{ name: '3x Imprimantes jet d\'encre', desc: 'Volume d\'impression rapide pour les séries courantes.' },{ name: 'Découpeuse professionnelle', desc: 'Découpe de précision pour formats personnalisés.' }],
    equipmentEn: [{ name: 'Professional fine art printer', desc: '12-color printing, up to 17" (A2+). Museum quality.' },{ name: 'Large format printer', desc: 'Large format up to 24" via partnership. Exhibitions and oversize prints.' },{ name: 'Professional laminator', desc: 'Lamination and print protection for maximum durability.' },{ name: '3x Inkjet printers', desc: 'Fast volume printing for standard runs.' },{ name: 'Professional cutter', desc: 'Precision cutting for custom formats.' }],
    faqFr: [{ q: 'Quelle est la différence entre Série Studio et Série Musée?', a: 'La Série Studio (Epson ET-15000) offre une qualité excellente pour décoration et cadeaux. La Série Musée (Canon PRO-1000/PRO-2600) utilise des encres pigmentées 12 couleurs pour une fidélité galerie et une longévité de 100+ ans.' },{ q: 'Quel format de fichier dois-je fournir?', a: 'Idéalement un fichier haute résolution (300 DPI minimum) en TIFF, PNG ou JPEG. On peut aussi travailler à partir de fichiers PSD ou PDF.' },{ q: 'Offrez-vous l\'encadrement?', a: 'Oui, on propose l\'encadrement sur demande à partir de 30$. Cadres noirs, blancs ou bois naturel disponibles.' },{ q: 'Quel est le délai de production?', a: 'Généralement 24 à 48 heures pour les tirages standards. Les commandes en volume ou grand format peuvent nécessiter 3 à 5 jours.' },{ q: 'Peut-on récupérer sur place?', a: 'Oui! Pick-up gratuit au Mile-End. On offre aussi la livraison locale à Montréal.' }],
    faqEn: [{ q: 'What is the difference between Studio and Museum Series?', a: 'The Studio Series (Epson ET-15000) offers excellent quality for decoration and gifts. The Museum Series (Canon PRO-1000/PRO-2600) uses 12-color pigment inks for gallery-grade fidelity and 100+ year longevity.' },{ q: 'What file format should I provide?', a: 'Ideally a high-resolution file (300 DPI minimum) in TIFF, PNG or JPEG. We can also work from PSD or PDF files.' },{ q: 'Do you offer framing?', a: 'Yes, we offer framing on request starting at $30. Black, white or natural wood frames available.' },{ q: 'What is the production time?', a: 'Generally 24 to 48 hours for standard prints. Volume orders or large format may require 3 to 5 days.' },{ q: 'Can I pick up in person?', a: 'Yes! Free pick-up in Mile-End. We also offer local delivery in Montreal.' }],
    seo: { titleFr: 'Prints - Fine Art, Flyers & Cartes | Montréal - Massive Medias', titleEn: 'Prints - Fine Art, Flyers & Cards | Montreal - Massive Medias', descriptionFr: 'Tirages fine art qualité galerie, flyers, cartes postales et cartes d\'affaires. Impression professionnelle locale à Montréal.', descriptionEn: 'Gallery-quality fine art prints, flyers, postcards and business cards. Professional local printing in Montreal.' },
    sortOrder: 1, active: true,
  },
  {
    slug: 'stickers',
    boutiqueSlug: 'stickers',
    iconName: 'Sticker',
    titleFr: 'Stickers',
    titleEn: 'Stickers',
    subtitleFr: 'Autocollants découpés sur mesure pour créateurs',
    subtitleEn: 'Custom die-cut stickers for creators',
    descriptionFr: "Autocollants découpés sur mesure pour artistes, labels, événements et marques. Service complet incluant la création graphique du visuel si nécessaire.\n\nDécoupés à la forme exacte de ton design avec notre équipement de découpe professionnel, chaque sticker est fini avec une lamination pour résister à l'eau, aux UV et aux rayures.",
    descriptionEn: "Custom die-cut stickers for artists, labels, events and brands. Complete service including graphic design if needed.\n\nCut to the exact shape of your design with our professional cutting equipment, each sticker is finished with lamination for water, UV and scratch resistance.",
    highlightsFr: ['Équipement de découpe de précision professionnel','Vinyle matte, glossy, transparent, holographique','Découpe contour à la forme exacte du design','Lamination incluse - résistant eau, UV, rayures','Création graphique du sticker incluse dans le prix','Livraison locale disponible','Délai rapide : 24-72h'],
    highlightsEn: ['Professional precision cutting equipment','Matte, glossy, clear, holographic vinyl','Contour cut to the exact shape of the design','Lamination included - water, UV, scratch resistant','Sticker graphic design included in the price','Local delivery available','Fast turnaround: 24-72h'],
    processFr: [{ step: 1, title: 'Brief créatif', desc: 'Dis-nous ce que tu veux - logo, illustration, texte, forme custom' },{ step: 2, title: 'Création graphique', desc: 'On crée ou adapte ton visuel pour la découpe (inclus dans le prix)' },{ step: 3, title: 'Validation', desc: 'Aperçu numérique pour validation avant production' },{ step: 4, title: 'Impression', desc: 'Impression haute qualité sur vinyle de ton choix' },{ step: 5, title: 'Lamination', desc: 'Couche protectrice pour durabilité maximale' },{ step: 6, title: 'Découpe & livraison', desc: 'Découpe de précision professionnelle et remise/livraison' }],
    processEn: [{ step: 1, title: 'Creative brief', desc: 'Tell us what you want - logo, illustration, text, custom shape' },{ step: 2, title: 'Graphic design', desc: 'We create or adapt your visual for cutting (included in price)' },{ step: 3, title: 'Validation', desc: 'Digital preview for validation before production' },{ step: 4, title: 'Printing', desc: 'High quality printing on your choice of vinyl' },{ step: 5, title: 'Lamination', desc: 'Protective layer for maximum durability' },{ step: 6, title: 'Cutting & delivery', desc: 'Professional precision cutting and pick-up/delivery' }],
    pricingFr: { title: 'Tarifs Stickers Custom (Die-Cut)', note: 'Design graphique inclus dans tous les prix', tables: [{ subtitle: 'Stickers custom die-cut', headers: ['Qté','Standard (Mat/Brillant)','Laminé Pro (Ultra-Résistant)','Holographique (Effets Spéciaux)'], rows: [['25','30$ (1,20$/u)','35$ (1,40$/u)','42$ (1,68$/u)'],['50','45$ (0,90$/u)','55$ (1,10$/u)','65$ (1,30$/u)'],['100','75$ (0,75$/u)','95$ (0,95$/u)','110$ (1,10$/u)'],['250','150$ (0,60$/u)','190$ (0,76$/u)','220$ (0,88$/u)'],['500','250$ (0,50$/u)','325$ (0,65$/u)','380$ (0,76$/u)']] }] },
    pricingEn: { title: 'Custom Stickers Pricing (Die-Cut)', note: 'Graphic design included in all prices', tables: [{ subtitle: 'Custom die-cut stickers', headers: ['Qty','Standard (Matte/Glossy)','Pro Laminated (Ultra-Resistant)','Holographic (Special Effects)'], rows: [['25','$30 ($1.20/u)','$35 ($1.40/u)','$42 ($1.68/u)'],['50','$45 ($0.90/u)','$55 ($1.10/u)','$65 ($1.30/u)'],['100','$75 ($0.75/u)','$95 ($0.95/u)','$110 ($1.10/u)'],['250','$150 ($0.60/u)','$190 ($0.76/u)','$220 ($0.88/u)'],['500','$250 ($0.50/u)','$325 ($0.65/u)','$380 ($0.76/u)']] }] },
    equipmentFr: [{ name: 'Découpeuse professionnelle', desc: 'Découpe de précision jusqu\'à 12" de large. Contour, kiss-cut, die-cut.' },{ name: 'Lamineuse', desc: 'Lamination matte ou glossy pour protection eau/UV/rayures.' },{ name: 'Imprimante vinyle', desc: 'Impression vinyle haute qualité, couleurs vibrantes.' }],
    equipmentEn: [{ name: 'Professional cutter', desc: 'Precision cutting up to 12" wide. Contour, kiss-cut, die-cut.' },{ name: 'Laminator', desc: 'Matte or glossy lamination for water/UV/scratch protection.' },{ name: 'Vinyl printer', desc: 'High quality vinyl printing, vibrant colors.' }],
    faqFr: [{ q: 'Quels types de finis sont disponibles?', a: 'On offre glossy (brillant), matte, holographique, transparent et prismatique. Chaque fini a ses avantages selon l\'utilisation.' },{ q: 'Le design graphique est-il inclus?', a: 'Oui! La création ou adaptation de ton visuel pour la découpe est incluse dans le prix. Tu peux aussi fournir un fichier prêt.' },{ q: 'Quelle est la quantité minimum?', a: 'À partir de 10 stickers identiques. Plus la quantité augmente, plus le prix unitaire diminue.' },{ q: 'Les stickers sont-ils résistants à l\'eau?', a: 'Oui, tous nos stickers sont laminés et résistants à l\'eau, aux UV et aux rayures. Durabilité extérieure de 3 à 5 ans.' },{ q: 'Peut-on avoir une forme totalement custom?', a: 'Absolument! Nos stickers sont découpés sur mesure (die-cut) selon la forme exacte de ton design.' }],
    faqEn: [{ q: 'What finishes are available?', a: 'We offer glossy, matte, holographic, clear and prismatic. Each finish has its advantages depending on the use case.' },{ q: 'Is graphic design included?', a: 'Yes! Creating or adapting your visual for die-cutting is included in the price. You can also provide a print-ready file.' },{ q: 'What is the minimum quantity?', a: 'Starting from 10 identical stickers. The more you order, the lower the unit price.' },{ q: 'Are the stickers waterproof?', a: 'Yes, all our stickers are laminated and resistant to water, UV and scratches. Outdoor durability of 3 to 5 years.' },{ q: 'Can I get a fully custom shape?', a: 'Absolutely! Our stickers are die-cut to match the exact shape of your design.' }],
    seo: { titleFr: 'Stickers Custom Montréal - Massive Medias', titleEn: 'Custom Stickers Montreal - Massive Medias', descriptionFr: 'Stickers die-cut personnalisés. Holographique, matte, glossy, transparent. Design inclus. Découpe pro. Montréal.', descriptionEn: 'Custom die-cut stickers. Holographic, matte, glossy, clear. Design included. Pro cutting. Montreal.' },
    sortOrder: 2, active: true,
  },
  {
    slug: 'merch',
    boutiqueSlug: 'sublimation',
    iconName: 'Shirt',
    titleFr: 'Merch',
    titleEn: 'Merch',
    subtitleFr: 'T-shirts, crewnecks, hoodies, sacs bananes, mugs - ton merch sur mesure',
    subtitleEn: 'T-shirts, crewnecks, hoodies, fanny packs, mugs - your custom merch',
    descriptionFr: "Impression sublimation sur textile et objets. La sublimation produit des couleurs vibrantes et permanentes qui ne craquent pas, ne s'effacent pas et résistent au lavage.\n\nIdéal pour le merch d'artiste, les événements, les cadeaux corporatifs ou tout projet personnalisé. T-shirts, crewnecks, hoodies, sacs bananes avec ton logo, mugs, thermos et plus encore.",
    descriptionEn: "Sublimation printing on textiles and objects. Sublimation produces vibrant and permanent colors that don't crack, don't fade and are wash-resistant.\n\nIdeal for artist merch, events, corporate gifts or any custom project. T-shirts, crewnecks, hoodies, fanny packs with your logo, mugs, tumblers and more.",
    highlightsFr: ['Presse à chaud grand format - textile','Presse à chaud compacte - objets et accessoires','Kit pincement gobelets - drinkware sublimation','Sacs bananes personnalisés avec ton logo','Impression permanente - ne craque pas, ne s\'efface pas','Couleurs vibrantes, résistant au lavage','Petites et moyennes séries'],
    highlightsEn: ['Large format heat press - textile','Compact heat press - objects and accessories','Tumbler pinch kit - drinkware sublimation','Custom fanny packs with your logo',"Permanent printing - doesn't crack, doesn't fade",'Vibrant colors, wash-resistant','Small and medium runs'],
    processFr: [{ step: 1, title: 'Choix du produit', desc: 'T-shirt, crewneck, hoodie, sac banane, mug, thermos, tapis de souris, etc.' },{ step: 2, title: 'Design', desc: 'Envoi de ton visuel ou création graphique sur demande' },{ step: 3, title: 'Validation', desc: 'Mockup numérique pour approbation avant production' },{ step: 4, title: 'Impression sublimation', desc: 'Impression du transfert sur papier sublimation spécialisé' },{ step: 5, title: 'Pressage', desc: 'Transfert à haute température et pression - couleurs permanentes' },{ step: 6, title: 'Contrôle & livraison', desc: 'Vérification qualité et remise/livraison' }],
    processEn: [{ step: 1, title: 'Product choice', desc: 'T-shirt, crewneck, hoodie, fanny pack, mug, tumbler, mousepad, etc.' },{ step: 2, title: 'Design', desc: 'Send your visual or request graphic design' },{ step: 3, title: 'Validation', desc: 'Digital mockup for approval before production' },{ step: 4, title: 'Sublimation printing', desc: 'Transfer printing on specialized sublimation paper' },{ step: 5, title: 'Pressing', desc: 'High temperature and pressure transfer - permanent colors' },{ step: 6, title: 'Quality check & delivery', desc: 'Quality verification and pick-up/delivery' }],
    pricingFr: { title: 'Tarifs Merch Sublimation', note: '+100-150$ si création design graphique à faire', headers: ['Produit','Quantité','Prix/unité','Prix total'], rows: [['T-shirt (design fourni)','1','30$','30$'],['T-shirt (design fourni)','5','25$','125$'],['T-shirt (design fourni)','10','22$','220$'],['T-shirt (design fourni)','25+','20$','Sur soumission'],['Crewneck (design fourni)','1','45$','45$'],['Crewneck (design fourni)','5','40$','200$'],['Crewneck (design fourni)','10','35$','350$'],['Hoodie (design fourni)','1','50$','50$'],['Hoodie (design fourni)','5','45$','225$'],['Hoodie (design fourni)','10','40$','400$'],['Sac banane avec logo','1','80$','80$'],['Sac banane avec logo','5','70$','350$'],['Sac banane avec logo','10','60$','600$']] },
    pricingEn: { title: 'Merch Sublimation Pricing', note: '+$100-150 if graphic design creation is needed', headers: ['Product','Quantity','Price/unit','Total'], rows: [['T-shirt (design provided)','1','$30','$30'],['T-shirt (design provided)','5','$25','$125'],['T-shirt (design provided)','10','$22','$220'],['T-shirt (design provided)','25+','$20','On quote'],['Crewneck (design provided)','1','$45','$45'],['Crewneck (design provided)','5','$40','$200'],['Crewneck (design provided)','10','$35','$350'],['Hoodie (design provided)','1','$50','$50'],['Hoodie (design provided)','5','$45','$225'],['Hoodie (design provided)','10','$40','$400'],['Fanny pack with logo','1','$80','$80'],['Fanny pack with logo','5','$70','$350'],['Fanny pack with logo','10','$60','$600']] },
    equipmentFr: [{ name: 'Presse à chaud grand format', desc: 'Presse à chaud grand format pour t-shirts, hoodies et textiles.' },{ name: 'Presse à chaud compacte', desc: 'Presse compacte polyvalente pour objets et accessoires.' },{ name: 'Kit pincement gobelets', desc: 'Sublimation sur gobelets, thermos et drinkware.' }],
    equipmentEn: [{ name: 'Large format heat press', desc: 'Large format heat press for t-shirts, hoodies and textiles.' },{ name: 'Compact heat press', desc: 'Compact versatile press for objects and accessories.' },{ name: 'Tumbler pinch kit', desc: 'Sublimation on tumblers, bottles and drinkware.' }],
    faqFr: [{ q: 'Qu\'est-ce que la sublimation?', a: 'La sublimation est un procédé d\'impression qui transfère l\'encre directement dans la fibre du tissu via chaleur et pression. Les couleurs sont permanentes, ne craquent pas et ne se décollent pas au lavage.' },{ q: 'Peut-on imprimer sur n\'importe quel tissu?', a: 'La sublimation fonctionne sur les tissus en polyester ou à forte teneur en polyester, et sur les substrats traités (mugs, thermos, etc.). Les t-shirts 100% coton nécessitent un traitement spécial.' },{ q: 'Quelle est la quantité minimum?', a: 'À partir d\'une seule unité! Pas de minimum. Idéal pour les prototypes ou les petites séries.' },{ q: 'Le design est-il inclus?', a: 'L\'adaptation de ton visuel pour la sublimation est incluse. Si tu n\'as pas de design, on peut le créer moyennant des frais de design graphique.' },{ q: 'Quels produits peut-on sublimer?', a: 'T-shirts, crewnecks, hoodies, sacs bananes, mugs, thermos, tapis de souris, porte-clés, et plus. Les sacs bananes sont parfaits pour mettre ton logo dessus!' }],
    faqEn: [{ q: 'What is sublimation?', a: 'Sublimation is a printing process that transfers ink directly into the fabric fiber through heat and pressure. Colors are permanent, won\'t crack or peel in the wash.' },{ q: 'Can you print on any fabric?', a: 'Sublimation works on polyester or high-polyester-content fabrics, and on coated substrates (mugs, tumblers, etc.). 100% cotton t-shirts require special treatment.' },{ q: 'What is the minimum order?', a: 'Starting from a single unit! No minimum. Perfect for prototypes or small runs.' },{ q: 'Is design included?', a: 'Adapting your visual for sublimation is included. If you don\'t have a design, we can create one for a graphic design fee.' },{ q: 'What products can be sublimated?', a: 'T-shirts, crewnecks, hoodies, fanny packs, mugs, tumblers, mousepads, keychains, and more. Fanny packs are perfect for putting your logo on!' }],
    seo: { titleFr: 'Merch & Sublimation Montréal - Massive Medias', titleEn: 'Merch & Sublimation Montreal - Massive Medias', descriptionFr: 'T-shirts, crewnecks, hoodies, sacs bananes, mugs en sublimation. Merch d\'artiste sur mesure. Production locale Montréal.', descriptionEn: 'T-shirts, crewnecks, hoodies, fanny packs, mugs in sublimation. Custom artist merch. Local production in Montreal.' },
    sortOrder: 3, active: true,
  },
  {
    slug: 'design',
    iconName: 'Palette',
    titleFr: 'Design',
    titleEn: 'Design',
    subtitleFr: 'Design graphique, web design, développement et référencement',
    subtitleEn: 'Graphic design, web design, development and SEO',
    descriptionFr: "Service complet de design graphique, web design et développement. De la conception de logos à l'identité visuelle complète, en passant par les affiches d'événements, les pochettes d'album et le design d'icônes.\n\nSites web modernes, performants et optimisés SEO pour artistes, créateurs et petites entreprises. Du portfolio d'artiste à la boutique e-commerce complète.\n\n15+ années d'expérience en développement web. Le fondateur de Massive Medias est programmeur-analyste de formation. Nous travaillons avec Adobe Illustrator, Figma, Photoshop et les technologies web modernes.",
    descriptionEn: "Complete graphic design, web design and development service. From logo design to full visual identity, including event posters, album covers and icon design.\n\nModern, fast and SEO-optimized websites for artists, creators and small businesses. From artist portfolios to complete e-commerce stores.\n\n15+ years of web development experience. The founder of Massive Medias is a trained programmer-analyst. We work with Adobe Illustrator, Figma, Photoshop and modern web technologies.",
    highlightsFr: ['Adobe Illustrator - Logos vectoriels et identités visuelles','Figma - Maquettes UI/UX et prototypage interactif','Adobe Photoshop - Retouche photo et compositing','Logos et identités visuelles complètes','Affiches, flyers et pochettes album','Web design sur mesure et responsive','Développement front-end et back-end complet','SEO technique et référencement naturel','Intégration CMS (WordPress, Strapi, Shopify)','Hébergement, domaine et maintenance'],
    highlightsEn: ['Adobe Illustrator - Vector logos and visual identities','Figma - UI/UX mockups and interactive prototyping','Adobe Photoshop - Photo retouching and compositing','Logos and complete visual identities','Posters, flyers and album covers','Custom web design and responsive','Full front-end and back-end development','Technical SEO and organic search optimization','CMS integration (WordPress, Strapi, Shopify)','Hosting, domain and maintenance'],
    whatWeDeliverFr: [{ title: 'Web Design', desc: 'Maquettes UI/UX sur mesure, palette de couleurs, typographie et identité visuelle cohérente avec ta marque.' },{ title: 'Développement', desc: 'Code propre et maintenable avec React, Angular ou WordPress selon tes besoins.' },{ title: 'Responsive', desc: 'Design adaptatif parfait sur mobile, tablette et desktop. Mobile-first.' },{ title: 'SEO & Référencement', desc: 'Optimisation on-page, méta-tags, sitemap, schema markup, Google Analytics et Search Console.' },{ title: 'Performance', desc: 'Images optimisées WebP, lazy loading, minification, CDN. Score 90+ sur PageSpeed.' },{ title: 'Sécurité', desc: 'Certificat SSL, headers sécurisés, protection anti-spam, sauvegardes automatiques.' }],
    whatWeDeliverEn: [{ title: 'Web Design', desc: 'Custom UI/UX mockups, color palette, typography and visual identity aligned with your brand.' },{ title: 'Development', desc: 'Clean, maintainable code with React, Angular or WordPress depending on your needs.' },{ title: 'Responsive', desc: 'Perfectly adaptive design on mobile, tablet and desktop. Mobile-first approach.' },{ title: 'SEO & Ranking', desc: 'On-page optimization, meta tags, sitemap, schema markup, Google Analytics and Search Console.' },{ title: 'Performance', desc: 'Optimized WebP images, lazy loading, minification, CDN. 90+ PageSpeed score.' },{ title: 'Security', desc: 'SSL certificate, security headers, anti-spam protection, automatic backups.' }],
    processFr: [{ step: 1, title: 'Brief créatif', desc: 'Discussion sur ta vision, tes références, ton public cible et tes objectifs' },{ step: 2, title: 'Recherche & moodboard', desc: 'Exploration visuelle, palette de couleurs, direction artistique, architecture du site' },{ step: 3, title: 'Création & design', desc: 'Design sur Illustrator/Figma - logos, maquettes, identité visuelle' },{ step: 4, title: 'Développement', desc: 'Code propre, technologies modernes, responsive, intégrations API' },{ step: 5, title: 'SEO & Optimisation', desc: 'Référencement, performances, accessibilité, tests multi-devices' },{ step: 6, title: 'Livraison & lancement', desc: 'Fichiers finaux, mise en ligne, formation CMS, suivi post-lancement' }],
    processEn: [{ step: 1, title: 'Creative brief', desc: 'Discussion about your vision, references, target audience and goals' },{ step: 2, title: 'Research & moodboard', desc: 'Visual exploration, color palette, artistic direction, site architecture' },{ step: 3, title: 'Creation & design', desc: 'Design on Illustrator/Figma - logos, mockups, visual identity' },{ step: 4, title: 'Development', desc: 'Clean code, modern technologies, responsive, API integrations' },{ step: 5, title: 'SEO & Optimization', desc: 'Search ranking, performance, accessibility, multi-device testing' },{ step: 6, title: 'Delivery & launch', desc: 'Final files, go-live, CMS training, post-launch monitoring' }],
    pricingFr: { title: 'Tarifs Design & Web', note: 'Le design de stickers est inclus dans le prix de production des stickers.', tables: [{ subtitle: 'Design Graphique', headers: ['Service','Prix','Délai'], rows: [['Création logo','300$ - 600$','5-10 jours'],['Identité visuelle complète','800$ - 1 500$','2-3 semaines'],['Affiche / flyer événement','150$ - 300$','3-5 jours'],['Pochette album / single','200$ - 400$','5-7 jours'],['Design d\'icônes (set)','200$ - 500$','3-7 jours'],['Retouche photo (par image)','15$ - 50$','24-48h']] },{ subtitle: 'Développement Web & Référencement', headers: ['Service','Prix'], rows: [['Landing page événement','900$'],['Site vitrine artiste/label (5-10 pages)','2 000$ - 3 500$'],['Site e-commerce simple','4 000$ - 6 000$'],['Refonte site existant','Sur soumission'],['Maintenance mensuelle','100$ - 200$/mois'],['Taux horaire (Web, Design, Restauration)','85$/h']] }] },
    pricingEn: { title: 'Design & Web Pricing', note: 'Sticker design is included in the sticker production price.', tables: [{ subtitle: 'Graphic Design', headers: ['Service','Price','Timeline'], rows: [['Logo design','$300 - $600','5-10 days'],['Complete visual identity','$800 - $1,500','2-3 weeks'],['Event poster / flyer','$150 - $300','3-5 days'],['Album / single cover','$200 - $400','5-7 days'],['Icon set design','$200 - $500','3-7 days'],['Photo retouching (per image)','$15 - $50','24-48h']] },{ subtitle: 'Web Development & SEO', headers: ['Service','Price'], rows: [['Event landing page','$900'],['Artist/label showcase site (5-10 pages)','$2,000 - $3,500'],['Simple e-commerce site','$4,000 - $6,000'],['Existing site redesign','On quote'],['Monthly maintenance','$100 - $200/mo'],['Hourly rate (Web, Design, Restoration)','$85/h']] }] },
    webProjectsFr: [{ name: 'Sonaa.ca', desc: 'Portail d\'actualités technologiques avec agrégation de contenu automatisée', url: 'https://sonaa.ca', tags: ['React','API','SEO'] },{ name: 'Recrutement SPVM', desc: 'Site de recrutement pour le Service de police de la Ville de Montréal', url: 'https://recrutementspvm.ca', tags: ['WordPress','UX','Responsive'] },{ name: 'Maudite Machine', desc: 'Site d\'artiste pour DJ et producteur de musique électronique', url: 'https://mauditemachine.com', tags: ['React','Animation','Audio'] },{ name: 'SPVM', desc: 'Site officiel du Service de police de la Ville de Montréal', url: 'https://spvm.qc.ca', tags: ['Angular','CMS','Accessibilité'] },{ name: 'Sarah Latulippe', desc: 'Portfolio de photographe professionnelle - corporatif, portrait et réseaux sociaux', url: 'https://sarahlatulippe.com', tags: ['WordPress','Portfolio','SEO'] },{ name: 'La Presse', desc: 'Site du plus grand journal francophone d\'Amérique du Nord', url: 'https://lapresse.ca', tags: ['Angular','Performance','CMS'] },{ name: 'Générateur QR', desc: 'Application web de génération de codes QR et raccourcisseur de liens', url: 'https://main.d15strqjqfjba7.amplifyapp.com/', tags: ['React','AWS','API'] },{ name: 'Boutique Maude', desc: 'Boutique en ligne de prêt-à-porter avec catalogue et paiement intégré', url: 'https://boutiquemaude.com', tags: ['E-commerce','Shopify','SEO'] }],
    webProjectsEn: [{ name: 'Sonaa.ca', desc: 'Tech news portal with automated content aggregation', url: 'https://sonaa.ca', tags: ['React','API','SEO'] },{ name: 'SPVM Recruitment', desc: 'Recruitment website for the Montreal Police Department', url: 'https://recrutementspvm.ca', tags: ['WordPress','UX','Responsive'] },{ name: 'Maudite Machine', desc: 'Artist website for a DJ and electronic music producer', url: 'https://mauditemachine.com', tags: ['React','Animation','Audio'] },{ name: 'SPVM', desc: 'Official website of the Montreal Police Department', url: 'https://spvm.qc.ca', tags: ['Angular','CMS','Accessibility'] },{ name: 'Sarah Latulippe', desc: 'Professional photographer portfolio - corporate, portrait and social media', url: 'https://sarahlatulippe.com', tags: ['WordPress','Portfolio','SEO'] },{ name: 'La Presse', desc: 'Largest French-language newspaper in North America', url: 'https://lapresse.ca', tags: ['Angular','Performance','CMS'] },{ name: 'QR Generator', desc: 'QR code generator and link shortener web application', url: 'https://main.d15strqjqfjba7.amplifyapp.com/', tags: ['React','AWS','API'] },{ name: 'Boutique Maude', desc: 'Fashion e-commerce store with integrated catalog and payments', url: 'https://boutiquemaude.com', tags: ['E-commerce','Shopify','SEO'] }],
    technologiesFr: ['React / Next.js','Angular','Node.js / Express','Strapi (CMS headless)','WordPress','Shopify','AWS (hébergement)','PostgreSQL / SQLite','Tailwind CSS','Framer Motion','Google Analytics','Search Console'],
    technologiesEn: ['React / Next.js','Angular','Node.js / Express','Strapi (headless CMS)','WordPress','Shopify','AWS (hosting)','PostgreSQL / SQLite','Tailwind CSS','Framer Motion','Google Analytics','Search Console'],
    teamFr: { name: 'Christopher Gagnon', role: 'Infographiste partenaire', bio: 'Diplômé en design graphique avec près de 10 ans d\'expérience. Spécialisé en identité visuelle, packaging et design web.', portfolio: 'Soundwave Festival, Laboratoire Bio Stratège, ChromaPur, Nutramazonie, NextGen Football, Belette Trois-Mille.' },
    teamEn: { name: 'Christopher Gagnon', role: 'Partner Graphic Designer', bio: 'Graduate graphic designer with nearly 10 years of experience. Specialized in visual identity, packaging and web design.', portfolio: 'Soundwave Festival, Laboratoire Bio Stratège, ChromaPur, Nutramazonie, NextGen Football, Belette Trois-Mille.' },
    faqFr: [{ q: 'Combien coûte un logo?', a: 'Les logos débutent à 150$ pour un concept simple. Une identité visuelle complète (logo + couleurs + typographie + déclinaisons) commence à 400$.' },{ q: 'Combien coûte un site web?', a: 'Les sites vitrines débutent à 900$. Les sites e-commerce ou avec fonctionnalités avancées sont sur devis selon la complexité du projet.' },{ q: 'Quel est le délai pour un site web?', a: 'Comptez 2 à 4 semaines pour un site vitrine, 4 à 8 semaines pour un e-commerce. Tout dépend de la complexité et de la rapidité des retours.' },{ q: 'Le SEO est-il inclus?', a: 'Oui! Chaque site inclut l\'optimisation SEO de base : méta-tags, sitemap, schema markup, Google Analytics et Search Console.' },{ q: 'Offrez-vous la maintenance?', a: 'Oui, on offre des forfaits de maintenance mensuelle incluant mises à jour, sauvegardes, monitoring de performance et support technique.' }],
    faqEn: [{ q: 'How much does a logo cost?', a: 'Logos start at $150 for a simple concept. A complete visual identity (logo + colors + typography + variations) starts at $400.' },{ q: 'How much does a website cost?', a: 'Showcase websites start at $900. E-commerce or advanced features are quoted based on project complexity.' },{ q: 'What is the timeline for a website?', a: 'Expect 2 to 4 weeks for a showcase site, 4 to 8 weeks for e-commerce. It depends on complexity and feedback speed.' },{ q: 'Is SEO included?', a: 'Yes! Every website includes basic SEO optimization: meta tags, sitemap, schema markup, Google Analytics and Search Console.' },{ q: 'Do you offer maintenance?', a: 'Yes, we offer monthly maintenance packages including updates, backups, performance monitoring and technical support.' }],
    seo: { titleFr: 'Design Graphique & Web Montréal - Massive Medias', titleEn: 'Graphic Design & Web Montreal - Massive Medias', descriptionFr: 'Logos, identités visuelles, sites web, e-commerce, SEO. Design graphique et développement web professionnel à Montréal.', descriptionEn: 'Logos, visual identities, websites, e-commerce, SEO. Professional graphic design and web development in Montreal.' },
    sortOrder: 4, active: true,
  },
];

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Only seed if SEED_CONTENT env var is set
    if (process.env.SEED_CONTENT !== 'true') return;

    console.log('[seed] Checking Site Content...');

    try {
      const existing = await strapi.documents('api::site-content.site-content').findFirst();

      if (existing) {
        console.log(`[seed] Site Content exists (documentId: ${existing.documentId}). Updating...`);
        await strapi.documents('api::site-content.site-content').update({
          documentId: existing.documentId,
          data: siteContentSeedData as any,
          status: 'published',
        });
        console.log('[seed] Site Content updated and published!');
      } else {
        console.log('[seed] No Site Content found. Creating...');
        await strapi.documents('api::site-content.site-content').create({
          data: siteContentSeedData as any,
          status: 'published',
        });
        console.log('[seed] Site Content created and published!');
      }

      // Seed Service Pages
      console.log('[seed] Checking Service Pages...');
      for (const spData of servicePagesSeedData) {
        const existing = await strapi.documents('api::service-page.service-page').findMany({
          filters: { slug: spData.slug },
        });

        if (existing.length > 0) {
          console.log(`[seed] Service Page "${spData.slug}" exists. Updating...`);
          await strapi.documents('api::service-page.service-page').update({
            documentId: existing[0].documentId,
            data: spData as any,
            status: 'published',
          });
        } else {
          console.log(`[seed] Creating Service Page "${spData.slug}"...`);
          await strapi.documents('api::service-page.service-page').create({
            data: spData as any,
            status: 'published',
          });
        }
      }
      console.log('[seed] All 4 Service Pages seeded!');

      // Set public permissions
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });

      if (publicRole) {
        const permActions = [
          'api::site-content.site-content.find',
          'api::service-page.service-page.find',
          'api::service-page.service-page.findOne',
        ];

        for (const action of permActions) {
          const existingPerm = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: { action },
          });

          if (!existingPerm) {
            await strapi.db.query('plugin::users-permissions.permission').create({
              data: { action, role: publicRole.id },
            });
            console.log(`[seed] Public permission for ${action} added!`);
          }
        }
      }

      console.log('[seed] Done!');
    } catch (err: any) {
      console.error('[seed] Error:', err.message);
      if (err.details?.errors) {
        err.details.errors.forEach((e: any) => console.error('[seed]  -', e.path?.join('.'), ':', e.message));
      }
    }
  },
};
