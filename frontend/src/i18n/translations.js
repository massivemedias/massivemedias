const translations = {
  fr: {
    // ──────────── NAV ────────────
    nav: {
      services: 'Services',
      tarifs: 'Tarifs',
      portfolio: 'Portfolio',
      boutique: 'Boutique',
      aPropos: 'À propos',
      contact: 'Contact',
      panier: 'Panier',
      login: 'Connexion',
      account: 'Mon compte',
      servicesList: [
        { name: 'Impression Fine Art', slug: 'impression-fine-art' },
        { name: 'Stickers Custom', slug: 'stickers-custom' },
        { name: 'Sublimation & Merch', slug: 'sublimation-merch' },
        { name: 'Flyers & Cartes', slug: 'flyers-cartes' },
        { name: 'Design Graphique', slug: 'design-graphique' },
        { name: 'Développement Web', slug: 'developpement-web' },
      ],
    },

    // ──────────── FOOTER ────────────
    footer: {
      tagline: 'Create. Print. Repeat.',
      studioDesc: 'Studio de production créative',
      location: 'Montréal, QC',
      navTitle: 'Navigation',
      servicesTitle: 'Services',
      contactTitle: 'Contact',
      mileEnd: 'Mile-End, Montréal',
      byAppointment: 'Sur rendez-vous',
      copyright: 'Massive Medias. Tous droits réservés. NEQ 2269057891',
    },

    // ──────────── COMMON ────────────
    common: {
      learnMore: 'En savoir plus',
      requestQuote: 'Demander une soumission',
      comingSoon: 'Bientôt disponible',
      viewPricing: 'Voir les tarifs',
      requestPackage: 'Demander ce package',
      projects: 'projet',
      projectsPlural: 'projets',
    },

    // ──────────── HOME ────────────
    home: {
      seo: {
        title: 'Massive Medias - Studio de production créative, Montréal',
        description: 'Impression fine art, stickers custom, sublimation, design graphique et développement web à Montréal. Service local depuis 2013.',
      },
      hero: {
        tagline: 'Create. Print. Repeat.',
        subtitle: 'Studio de production créative à Montréal',
        services: 'Impression fine art · Stickers · Merch · Design · Web',
        cta1: 'Voir nos services',
        cta2: 'Demander une soumission',
      },
      servicesSection: {
        title: 'Tout sous un même toit.',
        subtitle: "De l'idée à l'objet fini, on s'occupe de tout.",
      },
      serviceCards: [
        {
          title: 'Impression Fine Art',
          description: "Tirages premium sur équipement professionnel grand format. Posters, affiches, photos d'art sur papiers fine art professionnels.",
        },
        {
          title: 'Stickers Custom',
          description: 'Die-cut sur mesure avec découpe de précision professionnelle. Matte, glossy, transparent, holographique basic ou premium.',
        },
        {
          title: 'Sublimation & Merch',
          description: "T-shirts, hoodies, mugs, thermos, tapis de souris, porte-clés et plus. Impression sublimation sur mesure.",
        },
        {
          title: 'Flyers & Cartes',
          description: "Flyers A6, cartes postales, cartes d'affaires. Impression rapide et locale pour tes événements et promotions.",
        },
        {
          title: 'Design Graphique',
          description: 'Logos, identités visuelles, affiches, packaging. En partenariat avec Christopher Gagnon, infographiste.',
        },
        {
          title: 'Développement Web',
          description: 'Sites vitrines, e-commerce, landing pages. Technologies modernes : React, Strapi, WordPress, Shopify.',
        },
      ],
      projectsSection: {
        title: 'Nos réalisations',
        subtitle: "Quelques projets qui parlent d'eux-mêmes.",
        viewAll: 'Voir tout le portfolio',
      },
      featuredProjects: [
        { title: 'Tirages Fine Art', category: 'Impression' },
        { title: 'Stickers Holographiques', category: 'Stickers' },
        { title: 'T-shirts Sublimation', category: 'Merch' },
        { title: 'Affiches Événement', category: 'Impression' },
        { title: 'Die-Cut Custom', category: 'Stickers' },
        { title: 'Mugs & Accessoires', category: 'Merch' },
      ],
      stats: {
        since: 'Depuis',
        projects: 'Projets livrés',
        local: 'Local, Montréal',
        delay: 'Délai standard',
      },
      why: {
        title: 'Pourquoi Massive?',
      },
      advantages: [
        {
          title: 'Livraison locale gratuite',
          description: 'Basé dans le Mile-End à Montréal. Pick-up ou livraison locale, zéro frais de shipping, zéro délai postal.',
        },
        {
          title: 'Qualité professionnelle',
          description: "Équipement d'impression grand format, papiers fine art, découpe de précision. Du matériel pro pour des résultats pro.",
        },
        {
          title: 'Service personnalisé',
          description: "Un seul interlocuteur de A à Z. On comprend ton projet parce qu'on vient du même milieu créatif.",
        },
        {
          title: 'Solution complète',
          description: 'Impression + design + web + merch. Pas besoin de courir entre 4 fournisseurs différents.',
        },
        {
          title: 'Prix compétitifs',
          description: 'Fine art 20% sous la concurrence. Pas de frais cachés, pas de minimum excessif.',
        },
        {
          title: 'La scène, on connaît',
          description: "Musiciens, photographes, artistes visuels, promoteurs d'événements - c'est notre monde depuis le jour 1.",
        },
      ],
      cta: {
        title: 'Prêt à lancer ton projet?',
        subtitle: "Dis-nous ce que tu as en tête. Soumission rapide, sans engagement.",
        button: 'Demander une soumission',
      },
    },

    // ──────────── SERVICES PAGE ────────────
    servicesPage: {
      seo: {
        title: 'Services - Massive Medias',
        description: 'Impression, stickers, sublimation, flyers, design graphique et développement web. Tous nos services créatifs.',
      },
      hero: {
        title: 'Nos services',
        subtitle: "De l'impression fine art aux stickers custom, de la sublimation textile au développement web - on couvre toute la chaîne de production créative.",
      },
      serviceCards: [
        {
          title: 'Impression Fine Art',
          description: "Tirages premium sur imprimante professionnelle grand format. Posters, affiches, photos d'art sur papiers fine art professionnels. Qualité galerie pour vos expositions et ventes d'art.",
        },
        {
          title: 'Stickers Custom',
          description: 'Die-cut sur mesure avec équipement de découpe professionnel. Matte, glossy, transparent, holographique basic ou premium. Découpe précise à la forme de ton design.',
        },
        {
          title: 'Sublimation & Merch',
          description: "T-shirts, hoodies, mugs, thermos, tapis de souris, porte-clés et plus. Impression sublimation permanente et vibrante pour ton merch d'artiste.",
        },
        {
          title: 'Flyers & Cartes',
          description: "Flyers A6, cartes postales, cartes d'affaires. Impression rapide et locale pour tes événements, shows et promotions. Prix compétitifs.",
        },
        {
          title: 'Design Graphique',
          description: "Logos, identités visuelles, affiches, packaging, supports marketing. En partenariat avec Christopher Gagnon, infographiste avec près de 10 ans d'expérience.",
        },
        {
          title: 'Développement Web',
          description: "Sites vitrines, e-commerce, landing pages. Technologies modernes : React, Strapi, WordPress, Shopify. Du site d'artiste à la boutique complète.",
        },
      ],
      packages: {
        title: 'Packages combinés',
        subtitle: 'Pour les créateurs qui veulent une solution complète.',
      },
      packageArtist: {
        badge: 'Le plus populaire',
        title: 'Package Lancement Artiste',
        price: '2 800$',
        originalPrice: 'Valeur séparée: 4 660$ - Économie de 40%',
        items: ['25 prints A3+', '100 stickers promotionnels', '10 affiches A2', 'Site vitrine 5 pages'],
      },
      packageEvent: {
        badge: 'Événements',
        title: 'Package Événement',
        price: '900$',
        originalPrice: 'Valeur séparée: 1 410$ - Économie de 36%',
        items: ['150 flyers 8,5x11"', '25 affiches 11x17"', '200 stickers 2,5" holographiques', 'Landing page événement'],
      },
    },

    // ──────────── TARIFS PAGE ────────────
    tarifsPage: {
      seo: {
        title: 'Tarifs - Massive Medias',
        description: 'Grille tarifaire complète : impressions fine art, stickers, design graphique, développement web et packages combinés.',
      },
      hero: {
        title: 'Tarifs',
        subtitle: 'Prix transparents, qualité premium. 15-20% sous la concurrence en ligne.',
      },
      fineArt: {
        title: 'Impressions Fine Art',
        subtitle: 'Tirages qualité galerie sur papiers premium, encres pigmentées',
        note: 'Série Studio (Epson ET-15000) : bonne qualité pour tout, idéale pour les images avec bonne luminosité · Série Musée (Canon PRO-1000 / PRO-2600) : qualité supérieure pour la photographie et les tirages galerie · Ajouter 30$ pour un cadre noir ou blanc',
        headers: ['Format', 'Série Studio (Epson ET-15000)', 'Série Musée (Canon PRO-1000 et PRO-2600)'],
        rows: [
          ['A4 (8.5×11")', '16$', '35$'],
          ['A3 (11×17")', '22$', '65$'],
          ['A3+ (13×19")', '30$', '95$'],
          ['A2 (18×24")', '42$', '125$'],
        ],
      },
      stickers: {
        title: 'Stickers Custom (Die-Cut)',
        subtitle: 'Standard, Laminé Pro ou Holographique · Design graphique inclus',
        headers: ['Qté', 'Standard (Mat/Brillant)', 'Laminé Pro (Ultra-Résistant)', 'Holographique (Effets Spéciaux)'],
        rows: [
          ['25', '30$ (1,20$/u)', '35$ (1,40$/u)', '42$ (1,68$/u)'],
          ['50', '45$ (0,90$/u)', '55$ (1,10$/u)', '65$ (1,30$/u)'],
          ['100', '75$ (0,75$/u)', '95$ (0,95$/u)', '110$ (1,10$/u)'],
          ['250', '150$ (0,60$/u)', '190$ (0,76$/u)', '220$ (0,88$/u)'],
          ['500', '250$ (0,50$/u)', '325$ (0,65$/u)', '380$ (0,76$/u)'],
        ],
      },
      sublimation: {
        title: 'T-Shirts & Hoodies Sublimation',
        subtitle: 'Impression permanente qui ne craque pas — couleurs vibrantes',
        note: '+100-150$ si création design graphique à faire',
        headers: ['Produit', 'Quantité', 'Prix/unité', 'Prix total'],
        rows: [
          ['T-shirt impression (design fourni)', '1', '30$', '30$'],
          ['T-shirt impression (design fourni)', '5', '25$', '125$'],
          ['T-shirt impression (design fourni)', '10', '22$', '220$'],
          ['T-shirt impression (design fourni)', '25+', '20$', 'Sur soumission'],
          ['Hoodie impression (design fourni)', '1', '50$', '50$'],
          ['Hoodie impression (design fourni)', '5', '45$', '225$'],
          ['Hoodie impression (design fourni)', '10', '40$', '400$'],
        ],
      },
      flyers: {
        title: 'Flyers & Cartes Postales (A6 / 4"×6")',
        subtitle: 'Impression rapide pour événements, shows et promotions',
        headers: ['Quantité', 'Prix total', 'Prix/unité'],
        rows: [
          ['50', '40$', '0,80$'],
          ['100', '65$', '0,65$'],
          ['150', '90$', '0,60$'],
          ['250', '130$', '0,52$'],
          ['500', '225$', '0,45$'],
        ],
      },
      design: {
        title: 'Design Graphique',
        subtitle: 'Photoshop, Illustrator, InDesign, Figma — du logo à l\'identité complète',
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
      web: {
        title: 'Développement Web & Design',
        subtitle: 'React, WordPress, Shopify — sites performants, sécurisés et optimisés SEO',
        headers: ['Service', 'Prix'],
        rows: [
          ['Landing page événement', '900$'],
          ['Site vitrine artiste/label (5-10 pages)', '2 000$ – 3 500$'],
          ['Site e-commerce simple', '4 000$ – 6 000$'],
          ['Refonte site existant', 'Sur soumission'],
          ['Maintenance mensuelle', '100$ – 200$/mois'],
          ['Taux horaire (Web, Design, Restauration)', '85$/h'],
        ],
      },
      packages: {
        title: 'Packages combinés',
        artistBadge: 'Le plus populaire',
        artistTitle: 'Package Lancement Artiste',
        artistDiscount: '-40%',
        artistItems: ['25 prints A3+', '100 stickers promotionnels', '10 affiches A2', 'Site vitrine 5 pages'],
        eventBadge: 'Événements',
        eventTitle: 'Package Événement',
        eventDiscount: '-36%',
        eventItems: ['150 flyers 8,5×11"', '25 affiches 11×17"', '200 stickers 2,5" holographiques', 'Landing page événement'],
      },
      cta: {
        title: "Besoin d'un devis personnalisé?",
        subtitle: 'Chaque projet est unique. Envoie-nous les détails et on te revient avec une soumission dans les 24h.',
        button: 'Demander une soumission',
      },
    },

    // ──────────── PORTFOLIO PAGE ────────────
    portfolioPage: {
      seo: {
        title: 'Portfolio - Massive Medias',
        description: 'Galerie de nos réalisations : impressions fine art, stickers, merch textile, design graphique et plus.',
      },
      hero: {
        title: 'Portfolio',
        subtitle: 'Un aperçu de nos réalisations. Chaque projet est unique, chaque détail compte.',
      },
      categories: {
        all: 'Tout',
        web: 'Sites Web',
        prints: 'Impressions',
        stickers: 'Stickers',
        locale: 'Studio',
      },
    },

    // ──────────── A PROPOS PAGE ────────────
    aboutPage: {
      seo: {
        title: 'À propos - Massive Medias',
        description: "Studio de production créative fondé en 2020 à Montréal. L'équipe, l'espace et notre histoire.",
      },
      hero: {
        title: 'À propos',
        subtitle: 'Un studio créatif ancré dans le Mile-End, au cœur de la scène artistique montréalaise.',
      },
      history: {
        title: "L'histoire",
        paragraphs: [
          "Massive Medias est un studio de production créative établi depuis 2020 dans le Mile-End, au cœur de l'écosystème artistique montréalais.",
          "L'entreprise offre quatre services intégrés destinés aux artistes visuels, photographes, musiciens et créateurs indépendants : impressions fine art, stickers personnalisés, design graphique et développement web.",
          "Notre philosophie : offrir un service local, personnalisé et de qualité professionnelle, sans les délais et les complications des services en ligne. Pas de shipping, pas d'attente. Pick-up au Mile-End ou livraison locale.",
        ],
      },
      timeline: {
        title: 'Notre parcours',
        events: [
          { year: '2018-2019', event: 'Début impression et matériel promotionnel pour la scène musicale' },
          { year: '2020', event: 'Massive Medias devient activité structurée. Lancement officiel.' },
          { year: '2023-2024', event: "Acquisition d'équipements professionnels d'impression, découpe et sublimation" },
          { year: '2025', event: 'Enregistrement officiel au REQ. Recentrage: prints, stickers, graphisme, web' },
          { year: '2026', event: 'Incorporation provinciale prévue. Lancement Merch-as-a-Service.' },
        ],
      },
      team: {
        title: "L'équipe",
        mika: {
          name: 'Michael "Mika" Sanchez',
          role: 'Fondateur',
          bio: "Fondateur de Massive Medias, Mika est aussi compositeur de musique électronique et producteur sous le nom Maudite Machine et fondateur du label VRSTL Records. Programmeur-analyste de formation, il combine expertise technique et connaissance intime de la scène créative montréalaise.",
          bio2: "15+ années d'expérience en développement web et design graphique. Expertise en gestion de la couleur et calibration pour l'impression Fine Art.",
        },
        chris: {
          name: 'Christopher Gagnon',
          role: 'Partenaire Design',
          bio: "Infographiste diplômé avec près de 10 ans d'expérience. Spécialisé en identité visuelle, packaging et design web. Christopher apporte une expertise créative complète à chaque projet.",
          bio2: 'Portfolio : Soundwave Festival, Laboratoire Bio Stratège, ChromaPur, Nutramazonie, NextGen Football et plus encore.',
        },
      },
      equipment: {
        title: 'Notre équipement',
        items: [
          { name: 'Imprimante fine art', desc: 'Impression professionnelle 12 couleurs, jusqu\'à 17"' },
          { name: 'Découpe professionnelle', desc: 'Découpe stickers et vinyle de précision' },
          { name: 'Presse à chaud grand format', desc: 'Sublimation textile grand format' },
          { name: 'Presse à chaud compacte', desc: 'Presse polyvalente pour objets et accessoires' },
          { name: 'Lamineuse', desc: 'Lamination et finition professionnelle' },
          { name: 'Imprimante courante', desc: 'Impression courante et épreuves' },
          { name: 'Station de travail', desc: 'Production, design et développement' },
        ],
      },
      space: {
        location: 'Mile-End, Montréal',
        title: "L'espace Versatile",
        description: "On opère depuis l'espace collaboratif Versatile, au 7049 rue Saint-Urbain dans le Mile-End. Un lieu de création partagé avec une quinzaine de créateurs : vidéastes, photographes, designers, artistes. Pick-up disponible sur rendez-vous.",
      },
      universe: {
        title: "Aussi dans l'univers Massive",
        mauditeMachine: {
          title: 'Maudite Machine',
          description: "Compositeur de musique électronique et producteur. Sets et productions dark disco / indie dance. Sorties sur plusieurs labels, performances lors d'événements majeurs au Canada.",
        },
        vrstl: {
          title: 'VRSTL Records',
          description: "Label canadien dédié à l'Indie Dance et la Dark Minimal. Direction artistique, gestion des sorties, distribution digitale et promotion.",
        },
      },
    },

    // ──────────── CONTACT PAGE ────────────
    contactPage: {
      seo: {
        title: 'Contact - Massive Medias',
        description: 'Demande de soumission et contact. On te revient dans les 24h.',
      },
      hero: {
        title: 'Contact',
        subtitle: 'Un projet en tête? Une question sur nos services? Envoie-nous un message et on te revient rapidement.',
      },
      info: {
        title: 'Coordonnées',
        location: 'Mile-End, Montréal, QC',
        byAppointment: 'Sur rendez-vous',
        social: 'Réseaux sociaux',
      },
      form: {
        fullName: 'Nom complet',
        email: 'Email',
        phone: 'Téléphone',
        company: 'Entreprise / Projet',
        service: 'Service',
        budget: 'Budget estimé',
        urgency: 'Urgence',
        message: 'Décris ton projet',
        namePlaceholder: 'Ton nom',
        emailPlaceholder: 'ton@email.com',
        phonePlaceholder: '514-xxx-xxxx',
        companyPlaceholder: 'Nom de ton entreprise ou projet',
        messagePlaceholder: 'Dis-nous ce que tu as en tête...',
        selectPlaceholder: 'Sélectionne...',
        serviceOptions: [
          'Impression Fine Art',
          'Stickers Custom',
          'Sublimation & Merch',
          'Flyers & Cartes',
          'Design Graphique',
          'Développement Web',
          'Package complet',
          'Autre',
        ],
        budgetOptions: [
          'Moins de 500$',
          '500$ - 1 000$',
          '1 000$ - 3 000$',
          '3 000$+',
          'Je ne sais pas encore',
        ],
        urgencyOptions: [
          'Standard (5-7 jours)',
          'Rush (24-48h)',
          'Flexible',
        ],
        submit: 'Envoyer ma demande',
        sending: 'Envoi en cours...',
        successTitle: 'Message envoyé!',
        successMessage: 'Merci pour ta demande. On te revient dans les 24 heures.',
        sendAnother: 'Envoyer un autre message',
        errorMessage: 'Une erreur est survenue. Essaie à nouveau ou écris-nous directement à',
      },
    },

    // ──────────── SERVICE DETAIL PAGE ────────────
    serviceDetail: {
      breadcrumbServices: 'Services',
      requestQuote: 'Demander une soumission',
      viewPricing: 'Voir les tarifs',
      theService: 'Le service',
      highlights: 'Points forts',
      gallery: 'Exemples de réalisations',
      process: 'Notre processus',
      equipment: 'Équipement utilisé',
      technologies: 'Technologies maîtrisées',
      team: "L'équipe design",
      portfolioLabel: 'Portfolio',
      ctaTitle: 'Prêt à commander?',
      ctaSubtitle: 'Envoie-nous les détails de ton projet. Soumission gratuite dans les 24h.',
      prev: 'Précédent',
      next: 'Suivant',
      whatWeDeliver: 'Ce que comprend votre site',
      whatWeDeliverSub: 'Chaque projet inclut un ensemble complet de services professionnels',
      webProjectsTitle: 'Sites et applications réalisés',
      webProjectsSub: 'Une sélection de projets web livrés pour nos clients',
    },

    // ──────────── AUTH ────────────
    auth: {
      loginTitle: 'Connexion',
      loginSubtitle: 'Connecte-toi pour suivre tes commandes',
      registerTitle: 'Créer un compte',
      registerSubtitle: 'Inscris-toi pour commander et suivre tes projets',
      forgotTitle: 'Mot de passe oublié',
      forgotSubtitle: 'Entre ton email et on t\'envoie un lien de réinitialisation',
      fullName: 'Nom complet',
      fullNamePlaceholder: 'Ton nom',
      email: 'Email',
      emailPlaceholder: 'ton@email.com',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      forgotPassword: 'Mot de passe oublié?',
      loginButton: 'Se connecter',
      createAccount: 'Créer mon compte',
      sendReset: 'Envoyer le lien',
      noAccount: 'Pas encore de compte?',
      hasAccount: 'Déjà un compte?',
      registerLink: 'Créer un compte',
      loginLink: 'Se connecter',
      backToLogin: 'Retour à la connexion',
      logout: 'Déconnexion',
      resetSent: 'Un email de réinitialisation a été envoyé. Vérifie ta boîte de réception.',
      invalidCredentials: 'Email ou mot de passe incorrect',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
    },

    // ──────────── CHECKOUT ────────────
    checkout: {
      title: 'Paiement',
      backToCart: 'Retour au panier',
      emptyCart: 'Ton panier est vide.',
      continueShopping: 'Continuer mes achats',
      customerInfo: 'Vos informations',
      paymentInfo: 'Paiement',
      orderSummary: 'Résumé de commande',
      processing: 'Traitement en cours...',
      payAmount: 'Payer {amount}$',
      stripeError: 'Erreur de paiement. Veuillez réessayer.',
      successTitle: 'Commande confirmée!',
      successMessage: 'Merci pour ta commande! Tu recevras un email de confirmation sous peu. On te contacte pour la suite.',
      cancelTitle: 'Paiement annulé',
      cancelMessage: 'Le paiement a été annulé. Ton panier est toujours sauvegardé.',
    },

    // ──────────── ACCOUNT ────────────
    account: {
      title: 'Mon compte',
      profile: 'Profil',
      orders: 'Mes commandes',
      noOrders: 'Aucune commande pour le moment.',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════════════════════
  en: {
    // ──────────── NAV ────────────
    nav: {
      services: 'Services',
      tarifs: 'Pricing',
      portfolio: 'Portfolio',
      boutique: 'Shop',
      aPropos: 'About',
      contact: 'Contact',
      panier: 'Cart',
      login: 'Login',
      account: 'My Account',
      servicesList: [
        { name: 'Fine Art Printing', slug: 'impression-fine-art' },
        { name: 'Custom Stickers', slug: 'stickers-custom' },
        { name: 'Sublimation & Merch', slug: 'sublimation-merch' },
        { name: 'Flyers & Cards', slug: 'flyers-cartes' },
        { name: 'Graphic Design', slug: 'design-graphique' },
        { name: 'Web Development', slug: 'developpement-web' },
      ],
    },

    // ──────────── FOOTER ────────────
    footer: {
      tagline: 'Create. Print. Repeat.',
      studioDesc: 'Creative production studio',
      location: 'Montreal, QC',
      navTitle: 'Navigation',
      servicesTitle: 'Services',
      contactTitle: 'Contact',
      mileEnd: 'Mile-End, Montreal',
      byAppointment: 'By appointment',
      copyright: 'Massive Medias. All rights reserved. NEQ 2269057891',
    },

    // ──────────── COMMON ────────────
    common: {
      learnMore: 'Learn more',
      requestQuote: 'Request a quote',
      comingSoon: 'Coming soon',
      viewPricing: 'View pricing',
      requestPackage: 'Request this package',
      projects: 'project',
      projectsPlural: 'projects',
    },

    // ──────────── HOME ────────────
    home: {
      seo: {
        title: 'Massive Medias - Creative Production Studio, Montreal',
        description: 'Fine art printing, custom stickers, sublimation, graphic design and web development in Montreal. Local service since 2013.',
      },
      hero: {
        tagline: 'Create. Print. Repeat.',
        subtitle: 'Creative Production Studio in Montreal',
        services: 'Fine Art Printing · Stickers · Merch · Design · Web',
        cta1: 'View Our Services',
        cta2: 'Request a Quote',
      },
      servicesSection: {
        title: 'Everything Under One Roof.',
        subtitle: 'From idea to finished product, we handle everything.',
      },
      serviceCards: [
        {
          title: 'Fine Art Printing',
          description: 'Premium prints on professional large format equipment. Posters, art photos on professional fine art papers.',
        },
        {
          title: 'Custom Stickers',
          description: 'Custom die-cut with professional precision cutting. Matte, glossy, clear, basic or premium holographic.',
        },
        {
          title: 'Sublimation & Merch',
          description: 'T-shirts, hoodies, mugs, tumblers, mousepads, keychains and more. Custom sublimation printing.',
        },
        {
          title: 'Flyers & Cards',
          description: 'A6 flyers, postcards, business cards. Fast local printing for your events and promotions.',
        },
        {
          title: 'Graphic Design',
          description: 'Logos, visual identities, posters, packaging. In partnership with Christopher Gagnon, graphic designer.',
        },
        {
          title: 'Web Development',
          description: 'Showcase sites, e-commerce, landing pages. Modern technologies: React, Strapi, WordPress, Shopify.',
        },
      ],
      projectsSection: {
        title: 'Our Work',
        subtitle: 'A few projects that speak for themselves.',
        viewAll: 'View full portfolio',
      },
      featuredProjects: [
        { title: 'Fine Art Prints', category: 'Printing' },
        { title: 'Holographic Stickers', category: 'Stickers' },
        { title: 'Sublimation T-Shirts', category: 'Merch' },
        { title: 'Event Posters', category: 'Printing' },
        { title: 'Custom Die-Cut', category: 'Stickers' },
        { title: 'Mugs & Accessories', category: 'Merch' },
      ],
      stats: {
        since: 'Since',
        projects: 'Projects delivered',
        local: 'Local, Montreal',
        delay: 'Standard turnaround',
      },
      why: {
        title: 'Why Massive?',
      },
      advantages: [
        {
          title: 'Free Local Delivery',
          description: 'Based in Mile-End, Montreal. Pick-up or local delivery, zero shipping fees, zero postal delays.',
        },
        {
          title: 'Professional Quality',
          description: 'Large format printing equipment, fine art papers, precision cutting. Pro gear for pro results.',
        },
        {
          title: 'Personalized Service',
          description: 'One point of contact from A to Z. We understand your project because we come from the same creative scene.',
        },
        {
          title: 'Complete Solution',
          description: "Printing + design + web + merch. No need to run between 4 different vendors.",
        },
        {
          title: 'Competitive Pricing',
          description: 'Fine art 20% below competition. No hidden fees, no excessive minimums.',
        },
        {
          title: 'We Know the Scene',
          description: "Musicians, photographers, visual artists, event promoters - it's been our world since day 1.",
        },
      ],
      cta: {
        title: 'Ready to Launch Your Project?',
        subtitle: 'Tell us what you have in mind. Quick quote, no commitment.',
        button: 'Request a Quote',
      },
    },

    // ──────────── SERVICES PAGE ────────────
    servicesPage: {
      seo: {
        title: 'Services - Massive Medias',
        description: 'Printing, stickers, sublimation, flyers, graphic design and web development. All our creative services.',
      },
      hero: {
        title: 'Our Services',
        subtitle: 'From fine art printing to custom stickers, from textile sublimation to web development - we cover the entire creative production chain.',
      },
      serviceCards: [
        {
          title: 'Fine Art Printing',
          description: 'Premium prints on professional large format printer. Posters, art photos on professional fine art papers. Gallery quality for your exhibitions and art sales.',
        },
        {
          title: 'Custom Stickers',
          description: 'Custom die-cut with professional cutting equipment. Matte, glossy, clear, basic or premium holographic. Precise cutting to the shape of your design.',
        },
        {
          title: 'Sublimation & Merch',
          description: "T-shirts, hoodies, mugs, tumblers, mousepads, keychains and more. Permanent and vibrant sublimation printing for your artist merch.",
        },
        {
          title: 'Flyers & Cards',
          description: 'A6 flyers, postcards, business cards. Fast local printing for your events, shows and promotions. Competitive pricing.',
        },
        {
          title: 'Graphic Design',
          description: "Logos, visual identities, posters, packaging, marketing materials. In partnership with Christopher Gagnon, graphic designer with nearly 10 years of experience.",
        },
        {
          title: 'Web Development',
          description: "Showcase sites, e-commerce, landing pages. Modern technologies: React, Strapi, WordPress, Shopify. From artist sites to complete online stores.",
        },
      ],
      packages: {
        title: 'Combined Packages',
        subtitle: 'For creators who want a complete solution.',
      },
      packageArtist: {
        badge: 'Most popular',
        title: 'Artist Launch Package',
        price: '$2,800',
        originalPrice: 'Separate value: $4,660 - Save 40%',
        items: ['25 A3+ prints', '100 promotional stickers', '10 A2 posters', '5-page showcase website'],
      },
      packageEvent: {
        badge: 'Events',
        title: 'Event Package',
        price: '$900',
        originalPrice: 'Separate value: $1,410 - Save 36%',
        items: ['150 flyers 8.5x11"', '25 posters 11x17"', '200 holographic 2.5" stickers', 'Event landing page'],
      },
    },

    // ──────────── TARIFS PAGE ────────────
    tarifsPage: {
      seo: {
        title: 'Pricing - Massive Medias',
        description: 'Complete pricing: fine art printing, stickers, graphic design, web development and combined packages.',
      },
      hero: {
        title: 'Pricing',
        subtitle: 'Transparent pricing, premium quality. 15-20% below online competition.',
      },
      fineArt: {
        title: 'Fine Art Printing',
        subtitle: 'Gallery-quality prints on premium papers, pigment inks',
        note: 'Studio Series (Epson ET-15000): great quality for everything, ideal for images with good brightness · Museum Series (Canon PRO-1000 / PRO-2600): superior quality for photography and gallery prints · Add $30 for a black or white frame',
        headers: ['Format', 'Studio Series (Epson ET-15000)', 'Museum Series (Canon PRO-1000 & PRO-2600)'],
        rows: [
          ['A4 (8.5×11")', '$16', '$35'],
          ['A3 (11×17")', '$22', '$65'],
          ['A3+ (13×19")', '$30', '$95'],
          ['A2 (18×24")', '$42', '$125'],
        ],
      },
      stickers: {
        title: 'Custom Stickers (Die-Cut)',
        subtitle: 'Standard, Pro Laminated or Holographic · Graphic design included',
        headers: ['Qty', 'Standard (Matte/Glossy)', 'Pro Laminated (Ultra-Resistant)', 'Holographic (Special Effects)'],
        rows: [
          ['25', '$30 ($1.20/u)', '$35 ($1.40/u)', '$42 ($1.68/u)'],
          ['50', '$45 ($0.90/u)', '$55 ($1.10/u)', '$65 ($1.30/u)'],
          ['100', '$75 ($0.75/u)', '$95 ($0.95/u)', '$110 ($1.10/u)'],
          ['250', '$150 ($0.60/u)', '$190 ($0.76/u)', '$220 ($0.88/u)'],
          ['500', '$250 ($0.50/u)', '$325 ($0.65/u)', '$380 ($0.76/u)'],
        ],
      },
      sublimation: {
        title: 'T-Shirts & Hoodies Sublimation',
        subtitle: "Permanent print that won't crack — vibrant colors",
        note: '+$100-150 if graphic design creation is needed',
        headers: ['Product', 'Quantity', 'Price/unit', 'Total'],
        rows: [
          ['T-shirt print (design provided)', '1', '$30', '$30'],
          ['T-shirt print (design provided)', '5', '$25', '$125'],
          ['T-shirt print (design provided)', '10', '$22', '$220'],
          ['T-shirt print (design provided)', '25+', '$20', 'On quote'],
          ['Hoodie print (design provided)', '1', '$50', '$50'],
          ['Hoodie print (design provided)', '5', '$45', '$225'],
          ['Hoodie print (design provided)', '10', '$40', '$400'],
        ],
      },
      flyers: {
        title: 'Flyers & Postcards (A6 / 4"×6")',
        subtitle: 'Fast printing for events, shows and promotions',
        headers: ['Quantity', 'Total Price', 'Price/unit'],
        rows: [
          ['50', '$40', '$0.80'],
          ['100', '$65', '$0.65'],
          ['150', '$90', '$0.60'],
          ['250', '$130', '$0.52'],
          ['500', '$225', '$0.45'],
        ],
      },
      design: {
        title: 'Graphic Design',
        subtitle: 'Photoshop, Illustrator, InDesign, Figma — from logos to full identities',
        headers: ['Service', 'Price', 'Timeline'],
        rows: [
          ['Logo design', '$300 – $600', '5-10 days'],
          ['Complete visual identity', '$800 – $1,500', '2-3 weeks'],
          ['Event poster / flyer', '$150 – $300', '3-5 days'],
          ['Album / single cover', '$200 – $400', '5-7 days'],
          ['Photo retouching (per image)', '$15 – $50', '24-48h'],
          ['Sticker design', 'Included', '—'],
        ],
      },
      web: {
        title: 'Web Development & Design',
        subtitle: 'React, WordPress, Shopify — fast, secure, SEO-optimized sites',
        headers: ['Service', 'Price'],
        rows: [
          ['Event landing page', '$900'],
          ['Artist/label showcase site (5-10 pages)', '$2,000 – $3,500'],
          ['Simple e-commerce site', '$4,000 – $6,000'],
          ['Existing site redesign', 'On quote'],
          ['Monthly maintenance', '$100 – $200/mo'],
          ['Hourly rate (Web, Design, Restoration)', '$85/h'],
        ],
      },
      packages: {
        title: 'Combined Packages',
        artistBadge: 'Most popular',
        artistTitle: 'Artist Launch Package',
        artistDiscount: '-40%',
        artistItems: ['25 A3+ prints', '100 promotional stickers', '10 A2 posters', '5-page showcase website'],
        eventBadge: 'Events',
        eventTitle: 'Event Package',
        eventDiscount: '-36%',
        eventItems: ['150 flyers 8.5×11"', '25 posters 11×17"', '200 holographic 2.5" stickers', 'Event landing page'],
      },
      cta: {
        title: 'Need a custom quote?',
        subtitle: "Every project is unique. Send us the details and we'll get back to you within 24 hours.",
        button: 'Request a Quote',
      },
    },

    // ──────────── PORTFOLIO PAGE ────────────
    portfolioPage: {
      seo: {
        title: 'Portfolio - Massive Medias',
        description: 'Gallery of our work: fine art prints, stickers, textile merch, graphic design and more.',
      },
      hero: {
        title: 'Portfolio',
        subtitle: 'A glimpse at our work. Every project is unique, every detail matters.',
      },
      categories: {
        all: 'All',
        web: 'Websites',
        prints: 'Prints',
        stickers: 'Stickers',
        locale: 'Studio',
      },
    },

    // ──────────── A PROPOS PAGE ────────────
    aboutPage: {
      seo: {
        title: 'About - Massive Medias',
        description: 'Creative production studio founded in 2020 in Montreal. The team, the space and our story.',
      },
      hero: {
        title: 'About',
        subtitle: "A creative studio rooted in Mile-End, at the heart of Montreal's artistic scene.",
      },
      history: {
        title: 'Our Story',
        paragraphs: [
          "Massive Medias is a creative production studio established since 2020 in Mile-End, at the heart of Montreal's artistic ecosystem.",
          'The company offers four integrated services for visual artists, photographers, musicians and independent creators: fine art printing, custom stickers, graphic design and web development.',
          "Our philosophy: offer local, personalized, professional-quality service without the delays and complications of online services. No shipping, no waiting. Pick-up in Mile-End or local delivery.",
        ],
      },
      timeline: {
        title: 'Our Journey',
        events: [
          { year: '2018-2019', event: 'Started printing and promotional materials for the music scene' },
          { year: '2020', event: 'Massive Medias becomes a structured business. Official launch.' },
          { year: '2023-2024', event: 'Acquisition of professional printing, cutting and sublimation equipment' },
          { year: '2025', event: 'Official registration with the REQ. Refocus: prints, stickers, design, web' },
          { year: '2026', event: 'Provincial incorporation planned. Launch of Merch-as-a-Service.' },
        ],
      },
      team: {
        title: 'The Team',
        mika: {
          name: 'Michael "Mika" Sanchez',
          role: 'Founder',
          bio: 'Founder of Massive Medias, Mika is also an electronic music composer and producer under the name Maudite Machine and founder of the label VRSTL Records. Trained as a programmer-analyst, he combines technical expertise with an intimate knowledge of the Montreal creative scene.',
          bio2: '15+ years of experience in web development and graphic design. Expertise in color management and calibration for Fine Art printing.',
        },
        chris: {
          name: 'Christopher Gagnon',
          role: 'Design Partner',
          bio: 'Graduate graphic designer with nearly 10 years of experience. Specialized in visual identity, packaging and web design. Christopher brings complete creative expertise to every project.',
          bio2: 'Portfolio: Soundwave Festival, Laboratoire Bio Stratège, ChromaPur, Nutramazonie, NextGen Football and more.',
        },
      },
      equipment: {
        title: 'Our Equipment',
        items: [
          { name: 'Fine art printer', desc: 'Professional 12-color printing, up to 17"' },
          { name: 'Professional cutter', desc: 'Precision sticker and vinyl cutting' },
          { name: 'Large format heat press', desc: 'Large format textile sublimation' },
          { name: 'Compact heat press', desc: 'Versatile press for objects and accessories' },
          { name: 'Laminator', desc: 'Professional lamination and finishing' },
          { name: 'Standard printer', desc: 'Everyday printing and proofs' },
          { name: 'Workstation', desc: 'Production, design and development' },
        ],
      },
      space: {
        location: 'Mile-End, Montreal',
        title: 'The Versatile Space',
        description: "We operate from the Versatile collaborative space, at 7049 Saint-Urbain Street in Mile-End. A shared creative space with about fifteen creators: videographers, photographers, designers, artists. Pick-up available by appointment.",
      },
      universe: {
        title: 'Also in the Massive Universe',
        mauditeMachine: {
          title: 'Maudite Machine',
          description: 'Electronic music composer and producer. Dark disco / indie dance sets and productions. Releases on multiple labels, performances at major events across Canada.',
        },
        vrstl: {
          title: 'VRSTL Records',
          description: 'Canadian label dedicated to Indie Dance and Dark Minimal. Art direction, release management, digital distribution and promotion.',
        },
      },
    },

    // ──────────── CONTACT PAGE ────────────
    contactPage: {
      seo: {
        title: 'Contact - Massive Medias',
        description: "Quote request and contact. We'll get back to you within 24 hours.",
      },
      hero: {
        title: 'Contact',
        subtitle: "Have a project in mind? A question about our services? Send us a message and we'll get back to you quickly.",
      },
      info: {
        title: 'Contact Info',
        location: 'Mile-End, Montreal, QC',
        byAppointment: 'By appointment',
        social: 'Social Media',
      },
      form: {
        fullName: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        company: 'Company / Project',
        service: 'Service',
        budget: 'Estimated Budget',
        urgency: 'Urgency',
        message: 'Describe Your Project',
        namePlaceholder: 'Your name',
        emailPlaceholder: 'your@email.com',
        phonePlaceholder: '514-xxx-xxxx',
        companyPlaceholder: 'Your company or project name',
        messagePlaceholder: 'Tell us what you have in mind...',
        selectPlaceholder: 'Select...',
        serviceOptions: [
          'Fine Art Printing',
          'Custom Stickers',
          'Sublimation & Merch',
          'Flyers & Cards',
          'Graphic Design',
          'Web Development',
          'Complete Package',
          'Other',
        ],
        budgetOptions: [
          'Under $500',
          '$500 - $1,000',
          '$1,000 - $3,000',
          '$3,000+',
          "I don't know yet",
        ],
        urgencyOptions: [
          'Standard (5-7 days)',
          'Rush (24-48h)',
          'Flexible',
        ],
        submit: 'Send My Request',
        sending: 'Sending...',
        successTitle: 'Message Sent!',
        successMessage: "Thanks for your request. We'll get back to you within 24 hours.",
        sendAnother: 'Send another message',
        errorMessage: 'An error occurred. Try again or write to us directly at',
      },
    },

    // ──────────── SERVICE DETAIL PAGE ────────────
    serviceDetail: {
      breadcrumbServices: 'Services',
      requestQuote: 'Request a Quote',
      viewPricing: 'View pricing',
      theService: 'The Service',
      highlights: 'Highlights',
      gallery: 'Examples of Our Work',
      process: 'Our Process',
      equipment: 'Equipment Used',
      technologies: 'Technologies We Master',
      team: 'The Design Team',
      portfolioLabel: 'Portfolio',
      ctaTitle: 'Ready to Order?',
      ctaSubtitle: "Send us your project details. Free quote within 24 hours.",
      prev: 'Previous',
      next: 'Next',
      whatWeDeliver: 'What Your Website Includes',
      whatWeDeliverSub: 'Every project comes with a complete set of professional services',
      webProjectsTitle: 'Websites and Applications Built',
      webProjectsSub: 'A selection of web projects delivered for our clients',
    },

    // ──────────── AUTH ────────────
    auth: {
      loginTitle: 'Login',
      loginSubtitle: 'Sign in to track your orders',
      registerTitle: 'Create Account',
      registerSubtitle: 'Sign up to order and track your projects',
      forgotTitle: 'Forgot Password',
      forgotSubtitle: "Enter your email and we'll send you a reset link",
      fullName: 'Full name',
      fullNamePlaceholder: 'Your name',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      password: 'Password',
      confirmPassword: 'Confirm password',
      forgotPassword: 'Forgot password?',
      loginButton: 'Sign in',
      createAccount: 'Create account',
      sendReset: 'Send reset link',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      registerLink: 'Create account',
      loginLink: 'Sign in',
      backToLogin: 'Back to login',
      logout: 'Sign out',
      resetSent: 'A reset email has been sent. Check your inbox.',
      invalidCredentials: 'Invalid email or password',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
    },

    // ──────────── CHECKOUT ────────────
    checkout: {
      title: 'Checkout',
      backToCart: 'Back to cart',
      emptyCart: 'Your cart is empty.',
      continueShopping: 'Continue shopping',
      customerInfo: 'Your information',
      paymentInfo: 'Payment',
      orderSummary: 'Order summary',
      processing: 'Processing...',
      payAmount: 'Pay ${amount}',
      stripeError: 'Payment error. Please try again.',
      successTitle: 'Order confirmed!',
      successMessage: "Thanks for your order! You'll receive a confirmation email shortly. We'll be in touch for next steps.",
      cancelTitle: 'Payment cancelled',
      cancelMessage: 'The payment was cancelled. Your cart is still saved.',
    },

    // ──────────── ACCOUNT ────────────
    account: {
      title: 'My Account',
      profile: 'Profile',
      orders: 'My Orders',
      noOrders: 'No orders yet.',
    },
  },
};

export default translations;
