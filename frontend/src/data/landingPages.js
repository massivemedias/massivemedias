/**
 * landingPages (8 mai 2026) - data centralisee des 5 landing pages SEO
 * local. Chaque page cible UN keyword precis a haute intention d'achat
 * locale + une zone geographique (Montreal, Mile-End, Quebec).
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
  'imprimeur-mile-end': {
    keyword: 'Imprimeur Mile-End',
    geo: 'Mile-End, Montréal',
    title: 'Imprimeur Mile-End Montréal | Stickers, Prints, Sublimation | Massive Medias',
    description: 'Imprimeur indépendant au Mile-End à Montréal. Stickers personnalisés, fine art, sublimation textile, design graphique. Production locale, livraison 24-48h, ramassage sur place.',
    h1: 'Imprimeur au Mile-End, Montréal',
    intro: 'Massive Medias est un studio d\'impression indépendant basé au cœur du Mile-End, à Montréal. Depuis 2022, on imprime des stickers personnalisés, des prints fine art, du merch et du matériel événementiel pour les artistes, les commerces et les organisations du quartier. Production 100% locale, finition soignée, ramassage gratuit sur rendez-vous au studio.',
    sections: [
      {
        h2: 'Tous les services d\'impression sous le même toit',
        body: 'Stickers die-cut sur vinyle imperméable, tirages fine art sur papier Hahnemühle 308gsm avec encres pigmentaires 12 couleurs, sublimation textile sur t-shirts/hoodies/tote bags, flyers et cartes d\'affaires en quantités flexibles, design graphique sur mesure et développement web. Une seule équipe, un seul interlocuteur, zéro intermédiaire.',
      },
      {
        h2: 'Pourquoi imprimer au Mile-End plutôt qu\'en ligne ailleurs',
        body: 'On valide chaque proof avec toi avant de lancer la production. On répond aux courriels en moins de 24h. On accepte les commandes urgentes (24-48h pour les stickers). Tu peux passer chercher tes prints au studio (5338 rue Marquette) sans frais de livraison. Et chaque dollar reste dans l\'économie locale du quartier.',
      },
      {
        h2: 'Production locale, encres premium, finitions soignées',
        body: 'Notre équipement : imprimante pigmentaire 12 couleurs Epson SureColor (pour fine art), plotter de découpe Roland (pour stickers die-cut), presse à sublimation Geo Knight (pour textile). Pas d\'externalisation : tout sort du studio Mile-End. Garantie satisfaction ou réimpression gratuite.',
      },
    ],
    faq: [
      {
        q: 'Où êtes-vous situés exactement au Mile-End ?',
        a: 'Au 5338 rue Marquette, Montréal H2J 3Z3. Sur rendez-vous uniquement (lundi au vendredi, 9h-18h). Stationnement libre sur la rue.',
      },
      {
        q: 'Quel est le délai de production typique ?',
        a: 'Stickers die-cut : 24-48h. Prints fine art : 2-3 jours ouvrables. Sublimation textile : 3-5 jours ouvrables. Pour les commandes urgentes, on peut accélérer moyennant un supplément.',
      },
      {
        q: 'Vous livrez à l\'extérieur du Mile-End ?',
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

  'stickers-personnalises-montreal': {
    keyword: 'Stickers personnalisés Montréal',
    geo: 'Montréal, QC',
    title: 'Stickers Personnalisés Montréal | Die-Cut Vinyle Premium | Massive Medias',
    description: 'Stickers personnalisés à Montréal : die-cut vinyle imperméable, finitions holographique, glossy, matte, broken glass. Production locale Mile-End, livraison rapide, dès 25 unités.',
    h1: 'Stickers personnalisés à Montréal',
    intro: 'Massive Medias imprime des stickers personnalisés à Montréal sur vinyle imperméable haute qualité, avec découpe die-cut sur mesure pour chaque forme. Holographique, glossy, matte, broken glass : 4 finitions premium pour faire ressortir tes designs. Production locale au Mile-End, délai 24-48h pour les commandes standard, dès 25 stickers.',
    sections: [
      {
        h2: 'Vinyle imperméable, résistant aux UV et aux rayures',
        body: 'On utilise du vinyle adhésif premium 80-100 microns, garanti 3-5 ans en extérieur (résistance UV, eau salée, lavages auto). Adhésif removable disponible sur demande pour les applications temporaires (vitrines, événements). Test de tenue garanti sur tous nos lots.',
      },
      {
        h2: '4 finitions premium pour démarquer ta marque',
        body: 'Holographique (effet arc-en-ciel changeant selon l\'angle), glossy (brillance miroir intense), matte (toucher velours sans reflet), broken glass (paillettes de verre brisé pour effet luxe). Chaque finition modifie complètement la perception du design - on t\'aide à choisir.',
      },
      {
        h2: 'Die-cut sur mesure : ta forme, pas un rectangle',
        body: 'Notre plotter Roland découpe avec une précision de 0.1mm. N\'importe quelle forme : logo, mascotte, lettrage, illustration complexe. On extrait automatiquement le contour ou tu nous fournis ton tracé vectoriel. Aucun supplément pour les formes complexes.',
      },
    ],
    faq: [
      {
        q: 'Quel est le minimum de commande pour les stickers ?',
        a: '25 stickers minimum. Au-delà, le prix unitaire baisse rapidement (palier à 50, 100, 250, 500, 1000+). Devis instantané sur le configurateur du site.',
      },
      {
        q: 'Mes stickers vont-ils tenir dehors sous la neige et la pluie ?',
        a: 'Oui. Le vinyle qu\'on utilise est imperméable et résiste aux UV, à l\'eau salée et aux variations de température (-30°C à +60°C). Tenue garantie 3 à 5 ans en extérieur selon l\'exposition.',
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

  'print-fine-art-quebec': {
    keyword: 'Print fine art Québec',
    geo: 'Province de Québec',
    title: 'Print Fine Art Québec | Hahnemühle, Encres Pigmentaires 12 Couleurs | Massive',
    description: 'Tirages fine art au Québec sur papier Hahnemühle 308gsm, encres pigmentaires Epson 12 couleurs. Formats A6 à A2, éditions limitées, livraison provinciale. Studio Montréal Mile-End.',
    h1: 'Print fine art au Québec',
    intro: 'Tirages fine art galerie qualité musée, imprimés à Montréal et expédiés partout au Québec. Papier Hahnemühle Photo Rag 308gsm (le standard mondial des galeries d\'art), encres pigmentaires Epson UltraChrome 12 couleurs (longévité 200+ ans en archivage). Formats A6 (10×15cm) jusqu\'à A2 (42×60cm). Éditions ouvertes ou limitées numérotées, signées par l\'artiste.',
    sections: [
      {
        h2: 'Papier Hahnemühle Photo Rag 308gsm, le choix des galeries',
        body: 'Le papier Hahnemühle Photo Rag 308gsm est utilisé par les plus grandes galeries du monde (Tate Modern, MoMA, Guggenheim) pour son rendu doux et naturel des couleurs, sa résistance à la lumière et son toucher cotton premium. Surface mate sans reflet, blanc ivoire chaud. Pas de surface plastique ni de glossy artificiel.',
      },
      {
        h2: 'Encres pigmentaires 12 couleurs, longévité 200+ ans',
        body: 'Notre Epson SureColor utilise 12 cartouches d\'encres pigmentaires (vs 4-6 dans une imprimante grand public). Résultat : gamut couleur 30% plus large, transitions plus douces, noirs plus profonds. Tests Wilhelm Imaging Research : longévité 200+ ans en conditions d\'archivage standard (lumière ambiante, encadrement sous verre).',
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
    description: 'Sublimation textile à Montréal : t-shirts, hoodies, long sleeves all-over ou placement. Production locale Mile-End, dès 1 pièce, qualité durable lavable. Devis gratuit en 24h.',
    h1: 'Sublimation textile à Montréal',
    intro: 'Sublimation textile sur t-shirts, hoodies, long sleeves et tote bags, imprimée à Montréal au Mile-End. Technique haut de gamme qui INCRUSTE l\'encre dans la fibre du tissu (vs simple impression en surface) : aucune perte de couleur après lavage, toucher zéro relief, durée de vie identique au tissu lui-même. Impression all-over (tout le vêtement) ou placement (zone localisée).',
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
        h2: 'Production locale Mile-End, dès 1 pièce',
        body: 'Notre presse à sublimation Geo Knight permet de produire à partir de 1 unité (vs 50+ chez les sérigraphes). Idéal pour les samples, les drops limités, les commandes prototype. Réassorts rapides : tu peux commander 10 t-shirts mardi, 50 le vendredi suivant, sans setup fee répété.',
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
    description: 'Impression flyers et cartes d\'affaires à Montréal : papier 14pt à 24pt Soft Touch, recto-verso inclus. Production rapide Mile-End, dès 100 unités. Idéal événements, campagnes, commerces.',
    h1: 'Impression flyers et cartes d\'affaires à Montréal',
    intro: 'Impression de flyers, cartes d\'affaires et affiches événementielles à Montréal au Mile-End. Papiers premium de 14pt (standard) à 24pt Soft Touch (luxe), finitions UV/mat/lustre, recto-verso inclus. Production locale rapide (3-5 jours ouvrables), dès 100 unités. Idéal pour les événements DJ, vernissages d\'art, commerces, soirées électroniques, salons et conférences.',
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
        body: 'On a imprimé pour des soirées techno au Stereo, des vernissages à la Galerie Pangée, des campagnes électorales municipales, des grand-ouvertures de cafés Mile-End. Production rapide compatible avec les délais serrés des événements (3-5 jours, parfois 48h en rush).',
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
