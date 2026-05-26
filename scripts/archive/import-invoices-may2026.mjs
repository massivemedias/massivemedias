#!/usr/bin/env node
/**
 * import-invoices-may2026.mjs  (21 mai 2026)
 *
 * Importe les factures du dossier ~/Desktop/Invoice (avril-mai 2026) :
 *   - 25 items d'inventaire (stickers, papiers, consommables, equipement, merch)
 *   - 27 depenses (Amazon.ca, Jukebox, Red River, Topaz, Craft Vinyl)
 *
 * Total depenses : 1177.16 $ CAD  (TPS 39.97 $ + TVQ 83.68 $).
 *
 * ====================== A LIRE AVANT DE LANCER ======================
 *
 * 1. LANCE CE SCRIPT UNE SEULE FOIS. createItem ADDITIONNE la quantite
 *    si un item au meme SKU + nom existe deja, et createExpense ne
 *    deduplique pas. Relancer = stock double + depenses en double. En
 *    cas d'echec partiel, NE RELANCE PAS tel quel : envoie-moi le log,
 *    on reprendra seulement les lignes manquantes.
 *
 * 2. EXCLU : invoice.pdf (Prime Video "Ad free", 3.44 $) n'est PAS
 *    importe -> abonnement personnel, pas une depense d'entreprise.
 *
 * 3. DEJA DANS L'INVENTAIRE : le papier aquarelle Arches (B01EQHJH10)
 *    et la regle carree metallique (B08QJPQJT7) existent deja dans ton
 *    inventaire (ajoutes manuellement). Leurs ITEMS ne sont PAS recrees
 *    ici. Leurs DEPENSES sont incluses (notes "DEJA INVENTAIRE") -> si
 *    tu as deja saisi ces 2 depenses, supprime les doublons apres coup.
 *
 * 4. RED RIVER : la facture #1089049 (109.72 USD) est incluse ici avec
 *    les BONS chiffres. L'ancien script import-redriver-invoice.mjs n'a
 *    jamais ete lance et contient un total perime (101.97 USD). NE LANCE
 *    PAS import-redriver-invoice.mjs : ce script-ci le remplace.
 *
 * 5. Le remboursement Amazon (Epson Luster 17x22, ASIN B000N2VE7I) n'est
 *    PAS dans le dossier -> rien a exclure de ce cote.
 *
 * Auth : passe ton JWT Supabase via SUPABASE_TOKEN. Logge-toi admin sur
 * https://massivemedias.com, ouvre la console et tape :
 *   (await window.supabase.auth.getSession()).data.session.access_token
 * Puis :
 *   SUPABASE_TOKEN=eyJ... node scripts/import-invoices-may2026.mjs
 *
 * Taux USD->CAD : constante USD_TO_CAD ci-dessous (defaut 1.40). Ajuste
 * AVANT de lancer si besoin (affecte Red River + Topaz uniquement).
 */

const TOKEN = process.env.SUPABASE_TOKEN;
if (!TOKEN) {
  console.error('FATAL : SUPABASE_TOKEN env var requis.');
  console.error('Recupere-le sur massivemedias.com (console admin) :');
  console.error('  (await window.supabase.auth.getSession()).data.session.access_token');
  process.exit(1);
}

const API = 'https://massivemedias-api.onrender.com/api';
const USD_TO_CAD = 1.40; // ajuste si besoin (Red River + Topaz)

function round2(n) { return Math.round(n * 100) / 100; }

// ====================== INVENTAIRE (25 items) ======================
// Le backend auto-genere le SKU : {PREFIX}-{VARIANT}-{DETAIL6}-{NNN}.
// variant 'AMZ' = Amazon, 'RR' = Red River, detail = ASIN / no item.
// Quantites suivies en PAQUETS (convention de l'inventaire existant),
// sauf aimants + tapis (unites). costPrice = cout HT par unite suivie.
const ITEMS = [
  // --- STICKERS : papiers / vinyles imprimables ---
  {
    nameFr: `Papier autocollant blanc mat 8.5x11 (paquet 100 feuilles)`,
    nameEn: `White Matte Full-Sheet Label Paper 8.5x11 (100-sheet pack)`,
    category: 'stickers', variant: 'AMZ', detail: 'B01DJBMLV2', brand: '',
    quantity: 1, costPrice: 51.10, lowStockThreshold: 1,
    notes: `ASIN B01DJBMLV2. Amazon.ca (vendeur EPHESUS TRADING), facture CA6GJDFXKVAI, 12 mai 2026. Feuille pleine inkjet/laser.`,
  },
  {
    nameFr: `Papier sticker vinyle mat imprimable 8.5x11 (paquet 80 feuilles)`,
    nameEn: `Matte Printable Vinyl Sticker Paper 8.5x11 (80-sheet pack)`,
    category: 'stickers', variant: 'AMZ', detail: 'B0DJX6G3BH', brand: 'HOMSTO',
    quantity: 2, costPrice: 34.99, lowStockThreshold: 1,
    notes: `ASIN B0DJX6G3BH. Amazon.ca (vendeur HOMSTO USA). 2 paquets : factures CA6RBP6A7OI (8 mai) + CA6QVP6A7OI (5 mai 2026).`,
  },
  {
    nameFr: `Papier sticker vinyle mat impermeable 8.5x11 (paquet 20 feuilles)`,
    nameEn: `Waterproof Matte Vinyl Sticker Paper 8.5x11 (20-sheet pack)`,
    category: 'stickers', variant: 'AMZ', detail: 'B0BVMY4478', brand: '',
    quantity: 5, costPrice: 17.47, lowStockThreshold: 2,
    notes: `ASIN B0BVMY4478. Amazon.ca (vendeur Marchenko Iryna), facture CA64BFASMN6I, 2 mai 2026. 5 paquets de 20 feuilles.`,
  },
  {
    nameFr: `Papier sticker holographique 8.5x11 (paquet 20 feuilles)`,
    nameEn: `Holographic Sticker Paper 8.5x11 (20-sheet pack)`,
    category: 'stickers', variant: 'AMZ', detail: 'B08JZ2DWNL', brand: 'Bleidruck',
    quantity: 2, costPrice: 16.99, lowStockThreshold: 1,
    notes: `ASIN B08JZ2DWNL. Amazon.ca, facture CA62WZGRTKOI, 24 avril 2026. Vinyle arc-en-ciel impermeable imprimable.`,
  },
  {
    nameFr: `Papier sticker vinyle holographique format lettre (paquet 50 feuilles)`,
    nameEn: `Holographic Printable Vinyl Sticker Paper Letter (50-sheet pack)`,
    category: 'stickers', variant: 'AMZ', detail: 'B08SKHC494', brand: 'Bleidruck',
    quantity: 1, costPrice: 47.38, lowStockThreshold: 1,
    notes: `ASIN B08SKHC494. Amazon.ca (vendeur SUPER GLOBAL STORE), facture CA6GS6K9127I, 24 avril 2026.`,
  },
  {
    nameFr: `Papier sticker adhesif mat 8.5x11 (paquet 100 feuilles)`,
    nameEn: `Matte Adhesive Sticker Paper 8.5x11 (100-sheet pack)`,
    category: 'stickers', variant: 'RR', detail: '1262', brand: 'Red River Paper',
    quantity: 2, costPrice: round2(19.90 * USD_TO_CAD), lowStockThreshold: 1,
    notes: `Red River #1262. Facture #1089049, 13 mai 2026. 2 paquets de 100 feuilles. 19.90 USD/paquet @ ${USD_TO_CAD}.`,
  },
  {
    nameFr: `Papier sticker glossy (echantillon 2 feuilles, NON encre pigment)`,
    nameEn: `Glossy Sticker Paper (2-sheet sample, NOT for pigment ink)`,
    category: 'stickers', variant: 'RR', detail: '9897', brand: 'Red River Paper',
    quantity: 1, costPrice: round2(2.00 * USD_TO_CAD), lowStockThreshold: 1,
    notes: `Red River #9897. Facture #1089049, 13 mai 2026. Echantillon 2 feuilles. ATTENTION : non compatible encre pigment.`,
  },

  // --- PAPIERS : photo / beaux-arts ---
  {
    nameFr: `Papier photo glossy jet d'encre 11x17 (paquet 100 feuilles)`,
    nameEn: `Glossy Inkjet Photo Paper 11x17 (100-sheet pack)`,
    category: 'papiers', variant: 'AMZ', detail: 'B07QCWM8RK', brand: 'Koala',
    quantity: 1, costPrice: 31.49, lowStockThreshold: 1,
    notes: `ASIN B07QCWM8RK. Amazon.ca (vendeur Skyprint Corp), facture CA6AI8X405DI, 8 mai 2026. 48lb / 180gsm.`,
  },
  {
    nameFr: `Papier photo lustre double face 8.5x11 (paquet 40 feuilles)`,
    nameEn: `Double-Sided Luster Photo Paper 8.5x11 (40-sheet pack)`,
    category: 'papiers', variant: 'AMZ', detail: 'B09YM14QQN', brand: 'A-SUB',
    quantity: 1, costPrice: 29.99, lowStockThreshold: 1,
    notes: `ASIN B09YM14QQN. Amazon.ca (vendeur ASUB PTE), facture CA62L3LS68HI, 17 avril 2026. 74lb jet d'encre.`,
  },
  {
    nameFr: `Aurora Art White 300 (echantillon 2 feuilles)`,
    nameEn: `Aurora Art White 300 (2-sheet sample)`,
    category: 'papiers', variant: 'RR', detail: '9868', brand: 'Red River Paper',
    quantity: 1, costPrice: round2(2.50 * USD_TO_CAD), lowStockThreshold: 1,
    notes: `Red River #9868. Facture #1089049, 13 mai 2026. Beaux-arts 300gsm, echantillon 2 feuilles.`,
  },
  {
    nameFr: `UltraPro Satin 270 (echantillon 2 feuilles)`,
    nameEn: `UltraPro Satin 270 (2-sheet sample)`,
    category: 'papiers', variant: 'RR', detail: '9874', brand: 'Red River Paper',
    quantity: 3, costPrice: round2(2.00 * USD_TO_CAD), lowStockThreshold: 1,
    notes: `Red River #9874. Facture #1089049, 13 mai 2026. Satin 270gsm. 3 echantillons de 2 feuilles.`,
  },
  {
    nameFr: `Polar Gloss Metallic 255 (echantillon 2 feuilles)`,
    nameEn: `Polar Gloss Metallic 255 (2-sheet sample)`,
    category: 'papiers', variant: 'RR', detail: '9889', brand: 'Red River Paper',
    quantity: 1, costPrice: round2(2.00 * USD_TO_CAD), lowStockThreshold: 1,
    notes: `Red River #9889. Facture #1089049, 13 mai 2026. Metallique brillant 255gsm, echantillon 2 feuilles.`,
  },

  // --- CONSOMMABLES : lamination, encre, scellant, emballage ---
  {
    nameFr: `Vinyle cristal transparent lamination froide A4 (paquet 25 feuilles)`,
    nameEn: `Crystal Clear Cold-Lamination Vinyl A4 (25-sheet pack)`,
    category: 'consommables', variant: 'AMZ', detail: 'B0BCFPKQHL', brand: 'Bleidruck',
    quantity: 7, costPrice: 13.41, lowStockThreshold: 2,
    notes: `ASIN B0BCFPKQHL. Amazon.ca. 7 paquets sur 3 factures : CA63PHGRTKOI (19 mai), CA636UGRTKOI (2 mai), CA62WJGRTKOI (24 avril 2026). Cout HT moyen.`,
  },
  {
    nameFr: `Vinyle lamination holographique blanc mat A4 (paquet 36 feuilles)`,
    nameEn: `Holographic Overlay Lamination Vinyl Matte White A4 (36-sheet pack)`,
    category: 'consommables', variant: 'AMZ', detail: 'B0BZY2F39F', brand: 'Teckwrap',
    quantity: 1, costPrice: 48.49, lowStockThreshold: 1,
    notes: `ASIN B0BZY2F39F. Amazon.ca (vendeur ELITPRO), facture CA6U8OB0AJDI, 12 mai 2026. Overlay lamination clair.`,
  },
  {
    nameFr: `Vinyle lamination holographique arc-en-ciel A4 (paquet 28 feuilles)`,
    nameEn: `Holographic Overlay Lamination Vinyl Rainbow A4 (28-sheet pack)`,
    category: 'consommables', variant: 'AMZ', detail: 'B0CG1YHZR5', brand: 'Teckwrap',
    quantity: 1, costPrice: 43.73, lowStockThreshold: 1,
    notes: `ASIN B0CG1YHZR5. Amazon.ca (vendeur SMYRNA WHOLESALE), facture CA65C89UAQEI, 12 mai 2026. Motifs arc-en-ciel.`,
  },
  {
    nameFr: `Rouleau lamination autocollante mate 12po x 30pi`,
    nameEn: `Matte Self-Adhesive Laminating Roll 12in x 30ft`,
    category: 'consommables', variant: 'AMZ', detail: 'B0DHVHFGCV', brand: '',
    quantity: 2, costPrice: 15.90, lowStockThreshold: 1,
    notes: `ASIN B0DHVHFGCV. Amazon.ca (vendeur MYRAY), facture CA642N94EW0I, 10 mai 2026. Lot de 2 rouleaux, 3 mil.`,
  },
  {
    nameFr: `Film lamination holographique verre brise 8.25x11.7 (paquet 25 feuilles)`,
    nameEn: `Broken-Glass Holographic Lamination Film 8.25x11.7 (25-sheet pack)`,
    category: 'consommables', variant: 'AMZ', detail: 'B0964PSH1M', brand: 'Bleidruck',
    quantity: 1, costPrice: 36.56, lowStockThreshold: 1,
    notes: `ASIN B0964PSH1M. Amazon.ca (vendeur SENEL), facture CA69OOLIPPJI, 5 mai 2026. Overlay lamination froide glitter.`,
  },
  {
    nameFr: `Film lamination holographique etoiles 8.25x11.7 (paquet 25 feuilles)`,
    nameEn: `Stars Holographic Lamination Film 8.25x11.7 (25-sheet pack)`,
    category: 'consommables', variant: 'AMZ', detail: 'B0964NH3S2', brand: 'Bleidruck',
    quantity: 1, costPrice: 15.99, lowStockThreshold: 1,
    notes: `ASIN B0964NH3S2. Amazon.ca, facture CA63ACGRTKOI, 5 mai 2026. Overlay lamination froide glitter motif etoiles.`,
  },
  {
    nameFr: `Mod Podge scellant fini brillant lavable 16oz`,
    nameEn: `Mod Podge Dishwasher-Safe Gloss Sealer 16oz`,
    category: 'consommables', variant: 'AMZ', detail: 'B00J2TJF6A', brand: 'Mod Podge',
    quantity: 1, costPrice: 32.99, lowStockThreshold: 1,
    notes: `ASIN B00J2TJF6A. Amazon.ca (vendeur Ben Gavrilov), facture CA613DXHXFY7I, 14 mai 2026. Colle / scellant / fini.`,
  },
  {
    nameFr: `Boite d'entretien d'encre T04D1 (Epson ET-2850/3750/4750)`,
    nameEn: `T04D1 Ink Maintenance Box (Epson ET-2850/3750/4750)`,
    category: 'consommables', variant: 'AMZ', detail: 'B09XHSH769', brand: '',
    quantity: 1, costPrice: 24.98, lowStockThreshold: 1,
    notes: `ASIN B09XHSH769. Amazon.ca, facture CA64P5F8RTEI, 5 mai 2026. Compatible imprimante Epson ET-2850.`,
  },
  {
    nameFr: `Encre compatible Epson 502 (ensemble 5 bouteilles)`,
    nameEn: `Compatible Epson 502 Ink (5-bottle set)`,
    category: 'consommables', variant: 'AMZ', detail: 'B0BQNB8RTX', brand: '',
    quantity: 1, costPrice: 23.79, lowStockThreshold: 1,
    notes: `ASIN B0BQNB8RTX. Amazon.ca (vendeur ERIAN), facture CA6BR7OTFKVI, 5 mai 2026. Ensemble : 2 noir + cyan + magenta + jaune.`,
  },
  {
    nameFr: `Sacs cellophane refermables 6x9po (paquet 200)`,
    nameEn: `Self-Sealing Cellophane Bags 6x9in (200-pack)`,
    category: 'consommables', variant: 'AMZ', detail: 'B08FQRW91G', brand: 'Morepack',
    quantity: 1, costPrice: 12.59, lowStockThreshold: 1,
    notes: `ASIN B08FQRW91G. Amazon.ca (vendeur Changsha Yideou), facture CA6QH3ACJOQI, 2 mai 2026. Emballage stickers/prints.`,
  },
  {
    nameFr: `Film lamination Oracal Oraguard 210 mat 11x8.5 (paquet 25 feuilles)`,
    nameEn: `Oracal Oraguard 210 Matte Lamination Film 11x8.5 (25-sheet pack)`,
    category: 'consommables', variant: 'CRAFTVNL', detail: '49356', brand: 'Oracal',
    quantity: 1, costPrice: 24.99, lowStockThreshold: 1,
    notes: `Craft Vinyl (craftvinyl.ca), commande #49356, 14 mai 2026. Compatible Orajet 1917 inkjet.`,
  },

  // --- EQUIPEMENT : outils durables ---
  {
    nameFr: `Tapis de decoupe 12x12 pour Silhouette Cameo (lot de 5)`,
    nameEn: `12x12 Cutting Mat for Silhouette Cameo (5-pack)`,
    category: 'equipment', variant: 'AMZ', detail: 'B08CRKC5CJ', brand: 'Ecraft',
    quantity: 5, costPrice: 4.00, lowStockThreshold: 2,
    notes: `ASIN B08CRKC5CJ. Amazon.ca (vendeur Dongguan Woke), facture CA638SA5F46I, 14 mai 2026. Lot de 5 tapis.`,
  },

  // --- MERCH ---
  {
    nameFr: `Aimant premium 2x2po fini super mat`,
    nameEn: `Premium Magnet 2x2in Super Matte`,
    category: 'merch', variant: 'JUKEBOX', detail: '2696015', brand: 'Jukebox Print',
    quantity: 25, costPrice: 1.32, lowStockThreshold: 5,
    notes: `Jukebox Print, commande #2696015, 30 avril 2026. 25 aimants 2"x2" fini super mat.`,
  },
];

// ====================== DEPENSES (27) ======================
// 1 depense par facture. amount = total TTC paye. tps/tvq = montants
// de taxe (recuperables CTI/RTI). Achats US (Red River, Topaz) : tps/tvq
// = 0 (taxe de vente US non recuperable au QC).
const EXPENSES = [
  {
    description: `Jukebox Print - 25 aimants premium 2x2 (commande 2696015)`,
    amount: 53.59, category: 'consommables', date: '2026-04-30',
    vendor: 'Jukebox Print', receiptNumber: '2696015', taxDeductible: true,
    tpsAmount: 2.33, tvqAmount: 4.65,
    notes: `Sous-total 33.00 + livraison 13.61 + TPS 2.33 + TVQ 4.65. Paye Visa ...8027.`,
  },
  {
    description: `Amazon - papier photo lustre A-SUB 8.5x11 (facture CA62L3LS68HI)`,
    amount: 34.48, category: 'consommables', date: '2026-04-17',
    vendor: 'Amazon.ca', receiptNumber: 'CA62L3LS68HI', taxDeductible: true,
    tpsAmount: 1.50, tvqAmount: 2.99,
    notes: `ASIN B09YM14QQN. Commande 702-4230725-9424235. Papier photo lustre double face 40 feuilles.`,
  },
  {
    description: `Amazon - regle carree metallique 300mm (facture CA6GR3LXXGI)`,
    amount: 13.68, category: 'equipment', date: '2026-04-18',
    vendor: 'Amazon.ca', receiptNumber: 'CA6GR3LXXGI', taxDeductible: true,
    tpsAmount: 0.59, tvqAmount: 1.19,
    notes: `DEJA INVENTAIRE : la regle est deja dans l'inventaire (ajoutee manuellement). ASIN B08QJPQJT7, commande 702-4577402-9919466. Supprime cette depense si deja saisie.`,
  },
  {
    description: `Amazon - vinyle sticker holographique lettre (facture CA6GS6K9127I)`,
    amount: 54.48, category: 'consommables', date: '2026-04-24',
    vendor: 'Amazon.ca', receiptNumber: 'CA6GS6K9127I', taxDeductible: true,
    tpsAmount: 2.37, tvqAmount: 4.73,
    notes: `ASIN B08SKHC494. Commande 702-6782161-2937821. 50 feuilles holographiques.`,
  },
  {
    description: `Amazon - vinyle cristal transparent A4 (facture CA62WJGRTKOI)`,
    amount: 29.04, category: 'consommables', date: '2026-04-24',
    vendor: 'Amazon.ca', receiptNumber: 'CA62WJGRTKOI', taxDeductible: true,
    tpsAmount: 1.26, tvqAmount: 2.52,
    notes: `ASIN B0BCFPKQHL. Commande 702-1315771-2440205. 2 paquets de 25 feuilles, lamination froide.`,
  },
  {
    description: `Amazon - papier sticker holographique 8.5x11 (facture CA62WZGRTKOI)`,
    amount: 39.06, category: 'consommables', date: '2026-04-24',
    vendor: 'Amazon.ca', receiptNumber: 'CA62WZGRTKOI', taxDeductible: true,
    tpsAmount: 1.70, tvqAmount: 3.38,
    notes: `ASIN B08JZ2DWNL. Commande 702-4455525-3545814. 2 paquets de 20 feuilles.`,
  },
  {
    description: `Amazon - vinyle cristal transparent A4 (facture CA636UGRTKOI)`,
    amount: 43.56, category: 'consommables', date: '2026-05-02',
    vendor: 'Amazon.ca', receiptNumber: 'CA636UGRTKOI', taxDeductible: true,
    tpsAmount: 1.89, tvqAmount: 3.78,
    notes: `ASIN B0BCFPKQHL. Commande 702-6403821-0960252. 3 paquets de 25 feuilles, lamination froide.`,
  },
  {
    description: `Amazon - sacs cellophane 6x9 (paquet 200) (facture CA6QH3ACJOQI)`,
    amount: 14.48, category: 'consommables', date: '2026-05-02',
    vendor: 'Amazon.ca', receiptNumber: 'CA6QH3ACJOQI', taxDeductible: true,
    tpsAmount: 0.63, tvqAmount: 1.26,
    notes: `ASIN B08FQRW91G. Commande 702-6403821-0960252. Sacs cellophane refermables, emballage.`,
  },
  {
    description: `Amazon - papier sticker vinyle mat impermeable (facture CA64BFASMN6I)`,
    amount: 100.45, category: 'consommables', date: '2026-05-02',
    vendor: 'Amazon.ca', receiptNumber: 'CA64BFASMN6I', taxDeductible: true,
    tpsAmount: 4.35, tvqAmount: 8.75,
    notes: `ASIN B0BVMY4478. Commande 702-6403821-0960252. 5 paquets de 20 feuilles 8.5x11.`,
  },
  {
    description: `Amazon - boite d'entretien d'encre T04D1 Epson (facture CA64P5F8RTEI)`,
    amount: 28.72, category: 'consommables', date: '2026-05-05',
    vendor: 'Amazon.ca', receiptNumber: 'CA64P5F8RTEI', taxDeductible: true,
    tpsAmount: 1.25, tvqAmount: 2.49,
    notes: `ASIN B09XHSH769. Commande 702-1513755-0189866. Boite d'entretien Epson ET-2850.`,
  },
  {
    description: `Amazon - papier sticker vinyle mat 8.5x11 (facture CA6QVP6A7OI)`,
    amount: 40.23, category: 'consommables', date: '2026-05-05',
    vendor: 'Amazon.ca', receiptNumber: 'CA6QVP6A7OI', taxDeductible: true,
    tpsAmount: 1.75, tvqAmount: 3.49,
    notes: `ASIN B0DJX6G3BH. Commande 702-1513755-0189866. Paquet 80 feuilles, vendeur HOMSTO.`,
  },
  {
    description: `Amazon - encre compatible Epson 502 (5 bouteilles) (facture CA6BR7OTFKVI)`,
    amount: 27.35, category: 'consommables', date: '2026-05-05',
    vendor: 'Amazon.ca', receiptNumber: 'CA6BR7OTFKVI', taxDeductible: true,
    tpsAmount: 1.19, tvqAmount: 2.37,
    notes: `ASIN B0BQNB8RTX. Commande 702-1513755-0189866. Ensemble 5 bouteilles : 2 noir + CMJ.`,
  },
  {
    description: `Amazon - film holographique etoiles 25 feuilles (facture CA63ACGRTKOI)`,
    amount: 18.38, category: 'consommables', date: '2026-05-05',
    vendor: 'Amazon.ca', receiptNumber: 'CA63ACGRTKOI', taxDeductible: true,
    tpsAmount: 0.80, tvqAmount: 1.59,
    notes: `ASIN B0964NH3S2. Commande 702-1513755-0189866. Film lamination froide motif etoiles.`,
  },
  {
    description: `Amazon - papier photo glossy Koala 11x17 (facture CA6AI8X405DI)`,
    amount: 36.21, category: 'consommables', date: '2026-05-08',
    vendor: 'Amazon.ca', receiptNumber: 'CA6AI8X405DI', taxDeductible: true,
    tpsAmount: 1.58, tvqAmount: 3.14,
    notes: `ASIN B07QCWM8RK. Commande 702-0708630-8553867. Paquet 100 feuilles 180gsm.`,
  },
  {
    description: `Amazon - papier sticker vinyle mat 8.5x11 (facture CA6RBP6A7OI)`,
    amount: 40.23, category: 'consommables', date: '2026-05-08',
    vendor: 'Amazon.ca', receiptNumber: 'CA6RBP6A7OI', taxDeductible: true,
    tpsAmount: 1.75, tvqAmount: 3.49,
    notes: `ASIN B0DJX6G3BH. Commande 702-0708630-8553867. Paquet 80 feuilles, vendeur HOMSTO.`,
  },
  {
    description: `Amazon - rouleau lamination autocollante 12po (facture CA642N94EW0I)`,
    amount: 31.79, category: 'consommables', date: '2026-05-10',
    vendor: 'Amazon.ca', receiptNumber: 'CA642N94EW0I', taxDeductible: true,
    tpsAmount: 0, tvqAmount: 0,
    notes: `ASIN B0DHVHFGCV. Commande 702-9642338-6093823. Lot 2 rouleaux 12po x 30pi. Aucune taxe facturee.`,
  },
  {
    description: `Amazon - bloc papier aquarelle Arches 9x12 (facture CA66XLX5GPSI)`,
    amount: 42.89, category: 'consommables', date: '2026-05-10',
    vendor: 'Amazon.ca', receiptNumber: 'CA66XLX5GPSI', taxDeductible: true,
    tpsAmount: 0, tvqAmount: 3.89,
    notes: `DEJA INVENTAIRE : le bloc Arches est deja dans l'inventaire (PAP-ARCHES-9X12-140CP). ASIN B01EQHJH10, commande 702-8504198-2883412. Supprime cette depense si deja saisie.`,
  },
  {
    description: `Amazon - vinyle lamination holographique blanc mat (facture CA6U8OB0AJDI)`,
    amount: 55.75, category: 'consommables', date: '2026-05-12',
    vendor: 'Amazon.ca', receiptNumber: 'CA6U8OB0AJDI', taxDeductible: true,
    tpsAmount: 2.42, tvqAmount: 4.84,
    notes: `ASIN B0BZY2F39F. Commande 702-8097410-0290623. Teckwrap overlay A4, 36 feuilles.`,
  },
  {
    description: `Amazon - vinyle lamination holographique arc-en-ciel (facture CA65C89UAQEI)`,
    amount: 50.28, category: 'consommables', date: '2026-05-12',
    vendor: 'Amazon.ca', receiptNumber: 'CA65C89UAQEI', taxDeductible: true,
    tpsAmount: 2.19, tvqAmount: 4.36,
    notes: `ASIN B0CG1YHZR5. Commande 702-3943365-4069828. Teckwrap overlay A4, 28 feuilles motifs.`,
  },
  {
    description: `Amazon - papier autocollant blanc mat 8.5x11 (facture CA6GJDFXKVAI)`,
    amount: 58.75, category: 'consommables', date: '2026-05-12',
    vendor: 'Amazon.ca', receiptNumber: 'CA6GJDFXKVAI', taxDeductible: true,
    tpsAmount: 2.55, tvqAmount: 5.10,
    notes: `ASIN B01DJBMLV2. Commande 702-5330447-9712260. Paquet 100 feuilles pleines inkjet/laser.`,
  },
  {
    description: `Amazon - Mod Podge scellant brillant 16oz (facture CA613DXHXFY7I)`,
    amount: 37.93, category: 'consommables', date: '2026-05-14',
    vendor: 'Amazon.ca', receiptNumber: 'CA613DXHXFY7I', taxDeductible: true,
    tpsAmount: 1.65, tvqAmount: 3.29,
    notes: `ASIN B00J2TJF6A. Commande 702-0116037-8426658. Scellant lavable fini brillant.`,
  },
  {
    description: `Amazon - tapis de decoupe 12x12 Silhouette (lot 5) (facture CA638SA5F46I)`,
    amount: 22.97, category: 'equipment', date: '2026-05-14',
    vendor: 'Amazon.ca', receiptNumber: 'CA638SA5F46I', taxDeductible: true,
    tpsAmount: 1.00, tvqAmount: 1.99,
    notes: `ASIN B08CRKC5CJ. Commande 702-2689364-0811421. Lot de 5 tapis Ecraft pour Silhouette Cameo.`,
  },
  {
    description: `Craft Vinyl - film lamination Oraguard 210 mat (commande 49356)`,
    amount: 42.52, category: 'consommables', date: '2026-05-14',
    vendor: 'Craft Vinyl', receiptNumber: '49356', taxDeductible: true,
    tpsAmount: 1.85, tvqAmount: 3.69,
    notes: `craftvinyl.ca. Sous-total 24.99 + livraison 11.99 + taxes 5.54. Oracal Oraguard 210, 25 feuilles 11x8.5. Paye Shop Pay Visa ...8027.`,
  },
  {
    description: `Red River Paper - facture 1089049 (papiers + stickers)`,
    amount: round2(109.72 * USD_TO_CAD), category: 'consommables', date: '2026-05-13',
    vendor: 'Red River Paper', receiptNumber: '1089049', taxDeductible: true,
    tpsAmount: 0, tvqAmount: 0,
    notes: `Facture USD 109.72 (sous-total 52.30 + livraison 49.59 + sales tax US 7.83). Converti @ ${USD_TO_CAD} = ${round2(109.72 * USD_TO_CAD)} CAD. Payee en 2 transactions Visa (101.97 + 7.75 USD). Sales tax US non recuperable -> TPS/TVQ = 0. 5 articles. Remplace import-redriver-invoice.mjs.`,
  },
  {
    description: `Amazon - film holographique verre brise 25 feuilles (facture CA69OOLIPPJI)`,
    amount: 42.03, category: 'consommables', date: '2026-05-05',
    vendor: 'Amazon.ca', receiptNumber: 'CA69OOLIPPJI', taxDeductible: true,
    tpsAmount: 1.83, tvqAmount: 3.64,
    notes: `ASIN B0964PSH1M. Commande 702-6002644-8817066. Film lamination froide motif verre brise.`,
  },
  {
    description: `Amazon - vinyle cristal transparent A4 (facture CA63PHGRTKOI)`,
    amount: 35.30, category: 'consommables', date: '2026-05-19',
    vendor: 'Amazon.ca', receiptNumber: 'CA63PHGRTKOI', taxDeductible: true,
    tpsAmount: 1.54, tvqAmount: 3.06,
    notes: `ASIN B0BCFPKQHL. Commande 702-2451651-1805859. 2 paquets de 25 feuilles, lamination froide.`,
  },
  {
    description: `Topaz Labs - Topaz Photo abonnement annuel (facture TS-12667030)`,
    amount: round2(21.00 * USD_TO_CAD), category: 'software', date: '2026-05-18',
    vendor: 'Topaz Labs', receiptNumber: 'TS-12667030', taxDeductible: true,
    tpsAmount: 0, tvqAmount: 0,
    notes: `Facture USD 21.00 converti @ ${USD_TO_CAD} = ${round2(21.00 * USD_TO_CAD)} CAD. Logiciel de retouche photo, engagement annuel.`,
  },
];

// ====================== HELPERS ======================
async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`POST ${path} -> ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

// ====================== MAIN ======================
(async () => {
  const expTotal = EXPENSES.reduce((s, e) => s + e.amount, 0);
  console.log(`\n=== Import factures avril-mai 2026 ===`);
  console.log(`Items inventaire : ${ITEMS.length}`);
  console.log(`Depenses         : ${EXPENSES.length}  (total ${round2(expTotal)} $ CAD)`);
  console.log(`ATTENTION : lance ce script UNE SEULE FOIS (re-run = doublons).\n`);

  // --- Inventaire ---
  console.log(`--- Inventaire (${ITEMS.length} items) ---`);
  let itemsOk = 0, itemsMerged = 0, itemsFail = 0;
  for (const item of ITEMS) {
    try {
      const result = await post('/inventory-items/create', item);
      const id = result?.data?.documentId || result?.data?.id || '???';
      const sku = result?.data?.sku || '?';
      if (result?.merged) {
        itemsMerged++;
        console.log(`  ~ MERGE  ${item.nameFr.slice(0, 52).padEnd(52)} qty=${String(item.quantity).padStart(3)}  ${sku}  (quantite ADDITIONNEE - inattendu)`);
      } else {
        itemsOk++;
        console.log(`  + cree   ${item.nameFr.slice(0, 52).padEnd(52)} qty=${String(item.quantity).padStart(3)}  ${sku}  ${id}`);
      }
    } catch (e) {
      itemsFail++;
      console.error(`  ! ECHEC  ${item.nameFr}`);
      console.error(`    status=${e.status} body=${JSON.stringify(e.body).slice(0, 220)}`);
    }
  }
  console.log(`Inventaire : ${itemsOk} crees, ${itemsMerged} merges, ${itemsFail} echecs\n`);

  // --- Depenses ---
  console.log(`--- Depenses (${EXPENSES.length}) ---`);
  let expOk = 0, expFail = 0, expSum = 0;
  for (const exp of EXPENSES) {
    try {
      const result = await post('/expenses/create', exp);
      const id = result?.data?.documentId || result?.data?.id || '???';
      expOk++;
      expSum += exp.amount;
      console.log(`  + ${String(exp.amount).padStart(7)} $  ${exp.description.slice(0, 58).padEnd(58)} ${id}`);
    } catch (e) {
      expFail++;
      console.error(`  ! ECHEC  ${exp.description}`);
      console.error(`    status=${e.status} body=${JSON.stringify(e.body).slice(0, 220)}`);
    }
  }
  console.log(`Depenses : ${expOk} creees (${round2(expSum)} $ CAD), ${expFail} echecs\n`);

  // --- Bilan ---
  const allOk = itemsFail === 0 && expFail === 0;
  console.log(`=== ${allOk ? 'TERMINE - tout est passe' : 'TERMINE AVEC ERREURS'} ===`);
  if (!allOk) {
    console.log(`Des lignes ont echoue. NE RELANCE PAS le script tel quel.`);
    console.log(`Envoie ce log a Claude pour reprendre seulement les lignes manquantes.`);
    process.exit(2);
  }
  console.log(`Le dashboard admin (inventaire + depenses) reflete maintenant ces donnees.\n`);
})();
