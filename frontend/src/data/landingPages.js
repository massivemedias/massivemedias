/**
 * landingPages (8 mai 2026) - data centralisee des 5 landing pages SEO
 * local. Chaque page cible UN keyword precis a haute intention d'achat
 * locale + une zone geographique (Montreal, Plateau Mont-Royal, Quebec).
 *
 * Strategie SEO :
 *   - Title : 50-60 chars, keyword en debut + marque a la fin
 *   - Description : 140-160 chars, CTA inclus, keyword une fois
 *   - H1 : exactement le keyword principal (signal le plus fort a Google)
 *   - 800-1200 mots de contenu unique (anti-duplicate-content)
 *   - 3-5 H2 avec variantes long-tail du keyword principal
 *   - FAQ schema (rich snippet sur SERP)
 *   - LocalBusiness + Service + Breadcrumb schema (graph SEO local)
 *   - Internal links vers /services/* et /contact pour distribuer le PageRank
 *
 * Resolu par le composant LandingLocal.jsx via le slug d'URL.
 */

export const LANDING_PAGES = {
  'imprimeur-plateau-mont-royal': {
    keyword: 'Imprimeur Plateau Mont-Royal',
    geo: 'Plateau Mont-Royal, Montréal',
    title: 'Imprimeur Plateau Mont-Royal | Stickers, Prints, Sublimation | Massive Medias',
    description: 'Imprimeur indépendant sur le Plateau Mont-Royal à Montréal. Stickers personnalisés, fine art, sublimation textile, design graphique. Production locale, livraison 24-48h, ramassage sur place.',
    h1: 'Imprimeur sur le Plateau Mont-Royal, Montréal',
    intro: 'Massive Medias est un studio d\'impression indépendant basé sur le Plateau Mont-Royal à Montréal. Depuis 2022, on imprime des stickers personnalisés, des prints fine art, du merch et du matériel événementiel pour les artistes, les commerces et les organisations du quartier. Production 100% locale, finition soignée, ramassage gratuit sur rendez-vous au studio.',
    sections: [
      {
        h2: 'Tous les services d\'impression sous le même toit',
        body: 'Stickers die-cut sur vinyle imperméable, tirages fine art sur papier coton fine art 308gsm avec encres pigmentaires 12 couleurs, sublimation textile sur t-shirts/hoodies/tote bags, flyers et cartes d\'affaires en quantités flexibles, design graphique sur mesure et développement web. Une seule équipe, un seul interlocuteur, zéro intermédiaire.',
      },
      {
        h2: 'Pourquoi imprimer sur le Plateau plutôt qu\'en ligne ailleurs',
        body: 'On valide chaque proof avec toi avant de lancer la production. On répond aux courriels en moins de 24h. On accepte les commandes urgentes (24-48h pour les stickers). Tu peux passer chercher tes prints au studio du Plateau Mont-Royal sans frais de livraison (adresse exacte au rendez-vous). Et chaque dollar reste dans l\'économie locale du quartier.',
      },
      {
        h2: 'Production locale, encres premium, finitions soignées',
        body: 'Notre équipement : imprimante pigmentaire 12 couleurs professionnelle (pour fine art), plotter de découpe de précision (pour stickers die-cut), presse à sublimation professionnelle (pour textile). Pas d\'externalisation : tout sort du studio Plateau Mont-Royal.',
      },
    ],
    faq: [
      {
        q: 'Où êtes-vous situés exactement sur le Plateau Mont-Royal ?',
        a: 'Dans le secteur est du Plateau Mont-Royal (proche métro Joliette/Préfontaine). Sur rendez-vous uniquement (lundi au vendredi, 9h-18h) - l\'adresse exacte est communiquée à la prise de rendez-vous. Stationnement libre sur la rue.',
      },
      {
        q: 'Quel est le délai de production typique ?',
        a: 'Stickers die-cut : 24-48h. Prints fine art : 2-3 jours ouvrables. Sublimation textile : 3-5 jours ouvrables. Pour les commandes urgentes, on peut accélérer moyennant un supplément.',
      },
      {
        q: 'Vous livrez à l\'extérieur du Plateau ?',
        a: 'Oui. Livraison gratuite à vélo dans Montréal pour les commandes 50$+. Postes Canada partout au Québec et au Canada. Ramassage gratuit au studio pour qui veut éviter les frais.',
      },
      {
        q: 'Vous acceptez les petites quantités ?',
        a: 'Oui, à partir de 1 unité pour les prints fine art, 25 stickers minimum, 1 t-shirt minimum. Pas de minimum sur le design graphique et le web.',
      },
    ],
    relatedServices: [
      { slug: 'stickers', label: 'Stickers personnalisés' },
      { slug: 'prints', label: 'Prints fine art' },
      { slug: 'merch', label: 'Sublimation textile' },
      { slug: 'design', label: 'Design graphique' },
    ],
    heroImage: '/images/locale/locale10.webp',
  },

  // RESTORE-MILE-END (7 juillet 2026) : page ressuscitee apres le rename du
  // 10 mai (966edd92). Decision SEO du 23 juin : position 1 sur "printing
  // mile end", l'URL doit vivre. Coexiste avec imprimeur-plateau-mont-royal
  // (requetes differentes), contenu VOLONTAIREMENT reformule pour eviter le
  // duplicate content avec l'entree plateau.
  // Wording obligatoire : le studio est BASE au Plateau (SANS l'adresse exacte,
  // regle ADRESSE-PRIVEE du 14 juillet 2026 - quartier seulement en public) et
  // DESSERT le Mile-End. Jamais "situe au Mile-End", pas de marque
  // d'equipement, pas de garantie inventee (CONVENTIONS section 3).
  'imprimeur-mile-end': {
    keyword: 'Imprimeur Mile-End',
    geo: 'Mile-End, Montréal',
    title: 'Imprimeur Mile-End Montréal | Stickers, Prints, Sublimation | Massive Medias',
    description: 'Imprimeur indépendant qui dessert le Mile-End à Montréal : stickers personnalisés, prints fine art, sublimation textile, design graphique. Studio au Plateau voisin, livraison à vélo, ramassage sur rendez-vous.',
    h1: 'Imprimeur pour le Mile-End, Montréal',
    intro: 'Massive Medias est un studio d\'impression indépendant basé au Plateau Mont-Royal, à quelques minutes du Mile-End qu\'on dessert au quotidien. Depuis 2022, on imprime stickers, prints fine art, merch et matériel événementiel pour les artistes, ateliers et commerces du Mile-End et des quartiers voisins. Production 100% montréalaise, proof numérique validé avant chaque impression, livraison à vélo ou ramassage au studio.',
    sections: [
      {
        h2: 'Le Mile-End, on connaît : artistes, studios et commerces indépendants',
        body: 'Le Mile-End vit de création : musiciens, illustrateurs, ateliers textiles, cafés et boutiques indépendantes. C\'est exactement notre clientèle. Stickers die-cut pour le merch de tournée, tirages fine art pour les expositions, t-shirts et tote bags sublimés pour la boutique, flyers pour les lancements. Un seul studio, un seul interlocuteur, zéro sous-traitance.',
      },
      {
        h2: 'À dix minutes du Mile-End, sans les délais du web-to-print',
        body: 'On valide chaque proof numérique avec toi avant de lancer la production. Les stickers urgents sortent en 24-48h. Livraison gratuite à vélo dans le Mile-End et le reste de Montréal pour les commandes de 50$ et plus, ou ramassage sans frais au studio du Plateau Mont-Royal, sur rendez-vous (adresse exacte au rendez-vous). Chaque dollar reste dans l\'économie locale montréalaise.',
      },
      {
        h2: 'Encres pigmentaires, découpe de précision, sublimation',
        body: 'Impression pigmentaire 12 couleurs sur papier coton fine art 308gsm, découpe de précision pour les stickers die-cut sur vinyle laminé, presse à sublimation professionnelle pour le textile. Tout sort de notre studio montréalais, rien n\'est externalisé.',
      },
    ],
    faq: [
      {
        q: 'Où est votre studio par rapport au Mile-End ?',
        a: 'Le studio est au Plateau Mont-Royal, à une dizaine de minutes du Mile-End (adresse exacte communiquée à la prise de rendez-vous). On dessert le quartier au quotidien : livraison à vélo ou ramassage au studio sur rendez-vous, du lundi au vendredi, 9h à 18h.',
      },
      {
        q: 'Quels délais pour une commande du Mile-End ?',
        a: 'Les mêmes que partout à Montréal : 24-48h pour les stickers die-cut, 2-3 jours ouvrables pour les prints fine art, 3-5 jours pour la sublimation textile. Urgences possibles avec supplément.',
      },
      {
        q: 'La livraison dans le Mile-End est-elle gratuite ?',
        a: 'Oui, à vélo, pour les commandes de 50$ et plus. Sous ce montant, ramassage gratuit au studio ou envoi par Postes Canada.',
      },
      {
        q: 'Acceptez-vous les petites quantités ?',
        a: 'Oui : 1 print fine art à l\'unité, 25 stickers minimum, 1 t-shirt minimum. Aucun minimum en design graphique.',
      },
    ],
    relatedServices: [
      { slug: 'stickers', label: 'Stickers personnalisés' },
      { slug: 'prints', label: 'Prints fine art' },
      { slug: 'merch', label: 'Sublimation textile' },
      { slug: 'design', label: 'Design graphique' },
    ],
    heroImage: '/images/locale/locale7.webp',
  },

  'stickers-personnalises-montreal': {
    keyword: 'Stickers personnalisés Montréal',
    geo: 'Montréal, QC',
    title: 'Stickers Personnalisés Montréal | Die-Cut Vinyle Premium | Massive Medias',
    description: 'Stickers personnalisés à Montréal : die-cut vinyle imperméable, finitions holographique, glossy, mat, broken glass. Production locale Plateau Mont-Royal, livraison rapide, dès 25 unités.',
    h1: 'Stickers personnalisés à Montréal',
    intro: 'Massive Medias imprime des stickers personnalisés à Montréal sur vinyle imperméable haute qualité, avec découpe die-cut sur mesure pour chaque forme. Holographique, glossy, matte, broken glass : 4 finitions premium pour faire ressortir tes designs. Production locale au Plateau Mont-Royal, délai 24-48h pour les commandes standard, dès 25 stickers.',
    sections: [
      {
        h2: 'Vinyle imperméable, résistant aux UV et aux rayures',
        body: 'On utilise du vinyle adhésif premium 80-100 microns, tenue 3 à 5 ans en extérieur (résistance UV, eau salée, lavages auto). Adhésif removable disponible sur demande pour les applications temporaires (vitrines, événements).',
      },
      {
        h2: '4 finitions premium pour démarquer ta marque',
        body: 'Holographique (effet arc-en-ciel changeant selon l\'angle), glossy (brillance miroir intense), matte (toucher velours sans reflet), broken glass (paillettes de verre brisé pour effet luxe). Chaque finition modifie complètement la perception du design - on t\'aide à choisir.',
      },
      {
        h2: 'Die-cut sur mesure : ta forme, pas un rectangle',
        body: 'Notre plotter de découpe travaille avec une précision de 0.1mm. N\'importe quelle forme : logo, mascotte, lettrage, illustration complexe. On extrait automatiquement le contour ou tu nous fournis ton tracé vectoriel. Aucun supplément pour les formes complexes.',
      },
    ],
    faq: [
      {
        q: 'Quel est le minimum de commande pour les stickers ?',
        a: '25 stickers minimum. Au-delà, le prix unitaire baisse rapidement (palier à 50, 100, 250, 500, 1000+). Devis instantané sur le configurateur du site.',
      },
      {
        q: 'Mes stickers vont-ils tenir dehors sous la neige et la pluie ?',
        a: 'Oui. Le vinyle qu\'on utilise est imperméable et résiste aux UV, à l\'eau salée et aux variations de température (-30°C à +60°C). Tenue 3 à 5 ans en extérieur selon l\'exposition.',
      },
      {
        q: 'Combien de temps pour recevoir mes stickers ?',
        a: 'Production : 24-48h ouvrables. Livraison Montréal : 24h supplémentaires (vélo gratuit dès 50$). Postes Canada Québec : 2-3 jours. Au total, 3 à 5 jours ouvrables maximum.',
      },
      {
        q: 'Puis-je commander un seul sticker pour tester ?',
        a: 'Pas en standard, mais on offre des proofs physiques sur demande pour les grosses commandes (250+ unités). Pour 1-10 stickers, on recommande nos prints fine art ou un sticker generic en boutique.',
      },
    ],
    relatedServices: [
      { slug: 'stickers', label: 'Configurateur stickers' },
      { slug: 'design', label: 'Design graphique sur mesure' },
      { slug: 'prints', label: 'Prints fine art' },
    ],
    heroImage: '/images/realisations/stickers/Stickers-Cosmovision.webp',
  },

  'etiquettes-personnalisees-enfants-montreal': {
    keyword: 'Étiquettes personnalisées enfants Montréal',
    geo: 'Montréal, QC',
    title: 'Étiquettes Personnalisées Enfants Montréal | École & Garderie | Massive',
    description: 'Étiquettes personnalisées pour enfants à Montréal : le prénom + un vrai design d\'artiste, couleurs assorties, imperméables et résistantes aux UV. Prêtes pour la rentrée.',
    h1: 'Étiquettes personnalisées pour enfants à Montréal',
    intro: 'Chez Massive, l\'étiquette qui identifie les affaires de ton enfant n\'est pas un clipart générique : c\'est un vrai design de notre collection originale, avec son prénom, et des couleurs qui s\'assortissent automatiquement au dessin choisi. Imperméables, résistantes aux UV et découpées à la forme, elles tiennent le rythme d\'une année de garderie et d\'école. Imprimées à Montréal, prêtes pour la rentrée.',
    sections: [
      {
        h2: 'Un design que ton enfant choisit, pas un autocollant générique',
        body: 'Ton enfant pige dans la collection Massive (animaux mignons, créatures, motifs colorés) et son étiquette prend les couleurs du dessin toute seule : fond, contour et texte s\'assortissent, avec un contraste lisible garanti. Résultat, une étiquette qu\'il reconnaît d\'un coup d\'œil dans le bac de la garderie et qu\'il a hâte de coller.',
      },
      {
        h2: 'Conçues pour survivre à une année d\'enfant',
        body: 'Vinyle laminé premium, imperméable et résistant aux UV, découpe à la forme avec coins arrondis (rien qui accroche ni se décolle). Elles encaissent l\'eau, les frottements du sac à dos et les lavages à la main : sur la gourde, la boîte à lunch, les bottes de pluie ou l\'étui à crayons.',
      },
      {
        h2: 'Trois formats pour tout étiqueter avant la rentrée',
        body: 'Mini pour les crayons et ustensiles, moyenne pour les gourdes et boîtes à collation, grande pour les boîtes à lunch et vêtements. Tu configures tout en ligne en deux minutes (design, prénom, format, coins) et l\'aperçu est fidèle à ce que tu reçois. Livraison gratuite à Montréal.',
      },
    ],
    faq: [
      {
        q: 'En quoi vos étiquettes sont différentes des étiquettes d\'école habituelles ?',
        a: 'Au lieu d\'un motif générique, ton enfant choisit un vrai design de la collection Massive et les couleurs de l\'étiquette s\'assortissent automatiquement au dessin. Elles sont imprimées et découpées à Montréal, pas commandées en gros à l\'étranger.',
      },
      {
        q: 'Est-ce que ça résiste à la gourde, au sac et aux lavages ?',
        a: 'Oui : le vinyle est laminé, imperméable et résistant aux UV. Elles tiennent l\'eau, les frottements et les lavages à la main. On les recommande sur gourdes, boîtes à lunch, contenants, crayons et vêtements du quotidien.',
      },
      {
        q: 'Je les reçois à temps pour la rentrée ?',
        a: 'Production rapide et livraison gratuite à Montréal. Configure tes étiquettes quelques jours avant la rentrée : plus tu t\'y prends tôt, plus tu es certain d\'avoir tout étiqueté avant le premier jour.',
      },
      {
        q: 'Combien d\'étiquettes je reçois et à quel prix ?',
        a: 'Trois trousses selon les besoins, de l\'essentiel pour un enfant à la trousse complète pour la fratrie. Le nombre d\'étiquettes et le prix s\'affichent directement dans le configurateur avant de commander.',
      },
    ],
    relatedServices: [
      { slug: 'stickers', label: 'Stickers personnalisés' },
      { slug: 'design', label: 'Design graphique sur mesure' },
    ],
    ctaPrimary: { href: '/etiquettes', label: { fr: 'Créer l\'étiquette de mon enfant', en: 'Create my kid\'s label', es: 'Crear la etiqueta de mi hijo' } },
    ctaSecondary: { href: '/etiquettes', label: { fr: 'Voir les designs', en: 'See the designs', es: 'Ver los diseños' } },
    heroImage: '/images/etiquettes/mockup-lunchbox.webp',
  },

  'print-fine-art-quebec': {
    keyword: 'Print fine art Québec',
    geo: 'Province de Québec',
    title: 'Print Fine Art Québec | Photo Rag 308gsm, Encres Pigmentaires 12 Couleurs | Massive',
    description: 'Tirages fine art au Québec sur papier Photo Rag 308gsm, encres pigmentaires 12 couleurs. Formats A6 à A2, éditions limitées, livraison provinciale. Studio Montréal Plateau Mont-Royal.',
    h1: 'Print fine art au Québec',
    intro: 'Tirages fine art galerie qualité musée, imprimés à Montréal et expédiés partout au Québec. Papier Photo Rag 308gsm (le standard mondial des galeries d\'art), encres pigmentaires 12 couleurs (longévité 200+ ans en archivage). Formats A6 (10×15cm) jusqu\'à A2 (42×60cm). Éditions ouvertes ou limitées numérotées, signées par l\'artiste.',
    sections: [
      {
        h2: 'Papier Photo Rag 308gsm, le choix des galeries',
        body: 'Le papier Photo Rag 308gsm est utilisé par les plus grandes galeries du monde (Tate Modern, MoMA, Guggenheim) pour son rendu doux et naturel des couleurs, sa résistance à la lumière et son toucher cotton premium. Surface mate sans reflet, blanc ivoire chaud. Pas de surface plastique ni de glossy artificiel.',
      },
      {
        h2: 'Encres pigmentaires 12 couleurs, longévité 200+ ans',
        body: 'Notre imprimante pigmentaire utilise 12 cartouches d\'encres pigmentaires (vs 4-6 dans une imprimante grand public). Résultat : gamut couleur 30% plus large, transitions plus douces, noirs plus profonds. Tests Wilhelm Imaging Research : longévité 200+ ans en conditions d\'archivage standard (lumière ambiante, encadrement sous verre).',
      },
      {
        h2: 'Éditions limitées numérotées et signées',
        body: 'Pour les artistes qui vendent en éditions limitées : numérotation manuelle à la mine de plomb (ex: 12/50), signature de l\'artiste, certificat d\'authenticité avec QR code blockchain (anti-contrefaçon). On gère le tirage de 1 à 250 exemplaires, avec pause inter-tirage si besoin.',
      },
    ],
    faq: [
      {
        q: 'Est-ce que vous livrez partout au Québec ?',
        a: 'Oui. Postes Canada Express partout au Québec (1-3 jours ouvrables), tube rigide pour les A2/A3, enveloppe carton renforcée pour les A4/A5/A6. Livraison gratuite dès 100$.',
      },
      {
        q: 'Quelle est la différence entre fine art et impression photo standard ?',
        a: 'Fine art = papier 100% coton ou alpha-cellulose sans acide, encres pigmentaires (vs colorant), longévité 200+ ans (vs 25 ans). C\'est la différence entre un tirage qui finit dans une galerie vs un tirage Costco.',
      },
      {
        q: 'Vous gérez les éditions limitées avec certificats ?',
        a: 'Oui. Numérotation manuelle, signature de l\'artiste sur place ou par envoi, certificat d\'authenticité physique + QR code unique blockchain. Service inclus dès 25 tirages.',
      },
      {
        q: 'Quels formats fine art sont disponibles ?',
        a: 'A6 (10×15), A5 (15×21), A4 (21×30), A3 (30×42), A2 (42×60). Sur demande : formats custom carrés (20×20, 30×30), panoramique 16:9, et grands formats jusqu\'à 60×90cm.',
      },
    ],
    relatedServices: [
      { slug: 'prints', label: 'Configurateur prints' },
      { slug: 'design', label: 'Préparation fichier' },
    ],
    heroImage: '/images/realisations/prints/FineArt4.webp',
  },

  'sublimation-textile-montreal': {
    keyword: 'Sublimation textile Montréal',
    geo: 'Montréal, QC',
    title: 'Sublimation Textile Montréal | T-shirts, Hoodies All-Over | Massive Medias',
    description: 'Sublimation textile à Montréal : t-shirts, hoodies, long sleeves all-over ou placement. Production locale Plateau Mont-Royal, dès 1 pièce, qualité durable lavable. Devis gratuit en 24h.',
    h1: 'Sublimation textile à Montréal',
    intro: 'Sublimation textile sur t-shirts, hoodies, long sleeves et tote bags, imprimée à Montréal au Plateau Mont-Royal. Technique haut de gamme qui INCRUSTE l\'encre dans la fibre du tissu (vs simple impression en surface) : aucune perte de couleur après lavage, toucher zéro relief, durée de vie identique au tissu lui-même. Impression all-over (tout le vêtement) ou placement (zone localisée).',
    sections: [
      {
        h2: 'Sublimation vs sérigraphie vs DTG : laquelle choisir ?',
        body: 'Sublimation : couleurs vives, all-over possible, durée de vie maximale, mais tissu polyester (ou mélange 50%+ poly) obligatoire. Sérigraphie : grandes quantités, design simple, sur coton 100%. DTG : petites séries, designs photoréalistes, sur coton. Pour 90% des cas, sublimation gagne sur la qualité long terme.',
      },
      {
        h2: 'All-over ou placement : 2 styles, 2 budgets',
        body: 'All-over (tout le vêtement imprimé devant/derrière/manches) : effet streetwear premium, idéal pour les marques fashion. Placement (zone localisée poitrine/dos) : 60% moins cher, parfait pour les logos et événements. On t\'aide à choisir selon ton design et ton budget.',
      },
      {
        h2: 'Production locale Plateau Mont-Royal, dès 1 pièce',
        body: 'Notre presse à sublimation professionnelle permet de produire à partir de 1 unité (vs 50+ chez les sérigraphes). Idéal pour les samples, les drops limités, les commandes prototype. Réassorts rapides : tu peux commander 10 t-shirts mardi, 50 le vendredi suivant, sans setup fee répété.',
      },
    ],
    faq: [
      {
        q: 'Quels matériaux acceptent la sublimation ?',
        a: 'Polyester 100% (idéal), mélanges polyester-coton 50/50 (très bon), polyester-coton 70/30 (acceptable). Pas possible sur coton 100% ni sur cuir/jean. On a un catalogue de blanks polyester premium prêts à imprimer.',
      },
      {
        q: 'Combien de temps pour produire 50 t-shirts all-over ?',
        a: '3-5 jours ouvrables typiquement. Pour les rush (24-48h), on accepte selon notre charge de production - frais accélérés +25%.',
      },
      {
        q: 'Le rendu est-il identique au design vectoriel ?',
        a: 'À 95% oui. La sublimation a une légère perte de saturation sur les jaunes vifs et les rouges purs (limite physique du procédé). On compense par un profil ICC custom et on envoie un proof digital avant production.',
      },
      {
        q: 'Quel est le coût pour 25 hoodies all-over ?',
        a: 'À partir de ~45$/hoodie selon le blank choisi (Gildan, Independent, Champion). Devis précis en 24h via le configurateur ou par email. Dégressif important au-delà de 50 unités.',
      },
    ],
    relatedServices: [
      { slug: 'merch', label: 'Configurateur sublimation' },
      { slug: 'design', label: 'Design graphique merch' },
      { slug: 'stickers', label: 'Stickers complémentaires' },
    ],
    heroImage: '/images/realisations/textile/Textile1.webp',
  },

  'impression-flyers-montreal': {
    keyword: 'Impression flyers Montréal',
    geo: 'Montréal, QC',
    title: 'Impression Flyers Montréal | Cartes d\'affaires, Affiches Événementielles',
    description: 'Impression flyers et cartes d\'affaires à Montréal : papier 14pt à 24pt Soft Touch, recto-verso inclus. Production rapide Plateau Mont-Royal, dès 100 unités. Idéal événements, campagnes, commerces.',
    h1: 'Impression flyers et cartes d\'affaires à Montréal',
    intro: 'Impression de flyers, cartes d\'affaires et affiches événementielles à Montréal au Plateau Mont-Royal. Papiers premium de 14pt (standard) à 24pt Soft Touch (luxe), finitions UV/mat/lustre, recto-verso inclus. Production locale rapide (3-5 jours ouvrables), dès 100 unités. Idéal pour les événements DJ, vernissages d\'art, commerces, soirées électroniques, salons et conférences.',
    sections: [
      {
        h2: 'Papiers premium pour des flyers qui ne finissent pas à la poubelle',
        body: 'Standard 14pt : papier épais brillant, le minimum syndical pour avoir l\'air pro. Lamination 16pt : protection plastique mat ou brillant, durée de vie x3, idéal pour les cartes d\'affaires qui circulent. Soft Touch 24pt : papier ultra-épais avec finition velours sensuel, l\'effet "wow" des cartes haut de gamme - on l\'utilise pour 80% des artistes et boutiques branchées.',
      },
      {
        h2: 'Recto-verso quadrichromie inclus, pas de surprise',
        body: 'Tous nos prix incluent l\'impression recto-verso en quadrichromie (CMJN). Pas de supplément caché pour le verso comme chez les imprimeurs en ligne. Tu fournis 2 fichiers PDF (avant + arrière) et on s\'occupe du reste : marges de coupe, rectos calés au mm, calibrage couleur.',
      },
      {
        h2: 'Idéal pour événements, vernissages et campagnes locales',
        body: 'On a imprimé pour des soirées techno au Stereo, des vernissages à la Galerie Pangée, des campagnes électorales municipales, des grand-ouvertures de cafés Plateau Mont-Royal. Production rapide compatible avec les délais serrés des événements (3-5 jours, parfois 48h en rush).',
      },
    ],
    faq: [
      {
        q: 'Quel papier choisir pour mes cartes d\'affaires ?',
        a: 'Soft Touch 24pt si tu veux te démarquer (l\'effet velours est inoubliable). Lamination 16pt si tu veux la durabilité maximum. Standard 14pt si budget serré (mais c\'est moins impressionnant).',
      },
      {
        q: 'Délai de production typique ?',
        a: 'Production seule : 3 jours ouvrables. Production + livraison Montréal : 4-5 jours ouvrables. Rush 48h : disponible avec supplément +30% selon notre charge de production.',
      },
      {
        q: 'Quel format pour mes flyers événementiels ?',
        a: 'A6 (10×15cm) : standard "carte postale", facile à distribuer en main à main. A5 (15×21cm) : plus impactant, format magazine. DL (10×21cm) : look soigné, idéal pour les vernissages et événements premium.',
      },
      {
        q: 'Vous acceptez les designs faits sur Canva ou Photoshop ?',
        a: 'Oui aux deux, mais on recommande Photoshop ou Illustrator (mode CMJN, 300dpi, marges 3mm). Canva fonctionne en RGB par défaut - on convertit en CMJN gratuitement mais les couleurs peuvent légèrement décaler. On envoie un proof avant production.',
      },
    ],
    relatedServices: [
      { slug: 'design', label: 'Design graphique flyers' },
      { slug: 'prints', label: 'Affiches grand format' },
      { slug: 'stickers', label: 'Stickers événement' },
    ],
    heroImage: '/images/realisations/prints/FineArt4.webp',
  },
};

export const LANDING_SLUGS = Object.keys(LANDING_PAGES);
