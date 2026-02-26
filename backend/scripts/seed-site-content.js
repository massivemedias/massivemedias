/**
 * Seed script for Site Content single type.
 * Uses Strapi's internal Document Service API (no token needed).
 *
 * Usage:
 *   cd backend
 *   node scripts/seed-site-content.js
 *
 * Prerequisites:
 *   - Strapi must NOT be running (this script boots its own instance)
 */

const { createStrapi } = require('@strapi/strapi');

const siteContentData = {
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
    { platform: 'Instagram', url: 'https://instagram.com/massivemedias', label: 'Instagram' },
    { platform: 'Facebook', url: 'https://facebook.com/massivemedias', label: 'Facebook' },
    { platform: 'WhatsApp', url: 'https://wa.me/15146531423', label: 'WhatsApp' },
  ],
  newsletterFormEndpoint: 'https://formspree.io/f/xzdardoe',
};

async function seed() {
  console.log('Seeding Site Content...\n');

  const strapi = await createStrapi({ appDir: process.cwd() }).load();

  try {
    // Check if content exists
    const existing = await strapi.documents('api::site-content.site-content').findFirst();

    if (existing) {
      console.log(`  Site Content exists (id: ${existing.id}). Updating...`);
      await strapi.documents('api::site-content.site-content').update({
        documentId: existing.documentId,
        data: siteContentData,
        status: 'published',
      });
      console.log('  Site Content updated and published!');
    } else {
      console.log('  No existing Site Content. Creating...');
      await strapi.documents('api::site-content.site-content').create({
        data: siteContentData,
        status: 'published',
      });
      console.log('  Site Content created and published!');
    }

    // Also set public permissions for site-content.find
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (publicRole) {
      const existingPerm = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action: 'api::site-content.site-content.find', role: publicRole.id },
      });

      if (!existingPerm) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action: 'api::site-content.site-content.find', role: publicRole.id },
        });
        console.log('  Public permission for site-content.find added!');
      } else {
        console.log('  Public permission already exists.');
      }
    }

    console.log('\nSeed complete!\n');
    console.log('Next steps:');
    console.log('  1. Start Strapi: npm run develop');
    console.log('  2. Open admin -> Content Manager -> Site Content');
    console.log('  3. Upload images for service cards, featured projects, etc.');
    console.log('  4. Start frontend: npm run dev -- verify CMS data loads\n');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await strapi.destroy();
  }
}

seed();
