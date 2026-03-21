/**
 * Invoice PDF Parser
 * Extrait les donnees d'une facture PDF: fournisseur, date, items, taxes
 * Utilise pdfjs-dist pour l'extraction de texte
 */
import * as pdfjsLib from 'pdfjs-dist';

// Worker inline (evite les problemes de path en prod)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Extraire tout le texte d'un fichier PDF
 * Regroupe par ligne en utilisant la position Y pour mieux gerer les colonnes
 */
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Grouper les items par ligne (position Y similaire, tolerance 3px)
    const lines = [];
    content.items.forEach(item => {
      if (!item.str.trim()) return;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      let line = lines.find(l => Math.abs(l.y - y) < 3);
      if (!line) {
        line = { y, items: [] };
        lines.push(line);
      }
      line.items.push({ x, text: item.str });
    });

    // Trier par Y descendant (haut de page en premier), puis X
    lines.sort((a, b) => b.y - a.y);
    const text = lines.map(l => {
      l.items.sort((a, b) => a.x - b.x);
      return l.items.map(i => i.text).join(' ');
    }).join('\n');

    pages.push(text);
  }

  return pages.join('\n');
}

/**
 * Extraire la date de la facture
 */
function extractDate(text) {
  const enMonths = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
  const frMonths = { janvier: '01', fevrier: '02', février: '02', mars: '03', avril: '04', mai: '05', juin: '06', juillet: '07', aout: '08', août: '08', septembre: '09', octobre: '10', novembre: '11', decembre: '12', décembre: '12' };

  // Chercher une date pres d'un mot-cle (facture, invoice, facturation, date)
  const dateContext = text.match(/(?:date de facturation|invoice date|date)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i);
  if (dateContext) {
    const d = dateContext[1];
    const enM = d.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
    if (enM) return `${enM[3]}-${enMonths[enM[2].toLowerCase()]}-${enM[1].padStart(2, '0')}`;
    const frM = d.match(/(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(\d{4})/i);
    if (frM) return `${frM[3]}-${frMonths[frM[2].toLowerCase()]}-${frM[1].padStart(2, '0')}`;
  }

  // YYYY-MM-DD
  const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];

  // DD/MM/YYYY ou DD-MM-YYYY
  const dmy = text.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // "23 February 2026" (EN)
  const enMatch = text.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
  if (enMatch) return `${enMatch[3]}-${enMonths[enMatch[2].toLowerCase()]}-${enMatch[1].padStart(2, '0')}`;

  // "February 23, 2026" (EN alt)
  const enMatch2 = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (enMatch2) return `${enMatch2[3]}-${enMonths[enMatch2[1].toLowerCase()]}-${enMatch2[2].padStart(2, '0')}`;

  // "15 mars 2026" (FR)
  const frMatch = text.match(/(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(\d{4})/i);
  if (frMatch) return `${frMatch[3]}-${frMonths[frMatch[2].toLowerCase()]}-${frMatch[1].padStart(2, '0')}`;

  return new Date().toISOString().split('T')[0];
}

/**
 * Extraire le numéro de facture
 */
function extractInvoiceNumber(text) {
  const patterns = [
    // "# de facture: CA6U6OTPYGI" ou "Invoice #: ABC123"
    /(?:# de facture|invoice #|# de facture|facture #)[:\s]*([A-Z0-9][\w-]{2,20})/i,
    // "No. Facture: 12345" ou "Invoice No: 12345"
    /(?:no\.?\s*(?:de\s+)?facture|invoice\s+no)[:\s]*([A-Z0-9][\w-]{2,20})/i,
    // "Facture: 12345" (mais PAS "Facture" suivi de mots comme "subtotal", "details")
    /(?:facture|invoice)[:\s#]+([A-Z0-9][\w-]{2,20})(?!\s*(?:subtotal|details|total|date|page))/i,
    /(?:num[eé]ro|number)[.\s:#-]*\s*([A-Z0-9][\w-]{2,20})/i,
    /(?:re[cç]u|receipt)[.\s:#-]*\s*([A-Z0-9][\w-]{2,20})/i,
    // Amazon: "Commande #: 702-3026210-0485833" ou "Order #:"
    /(?:commande|order)\s*#?[:\s]*([0-9][\d-]{5,25})/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m && !/subtotal|details|total|partiel/i.test(m[1])) return m[1];
  }
  return '';
}

/**
 * Extraire le nom du fournisseur (premiere ligne significative ou champ identifie)
 */
function extractVendor(text) {
  // Detecter les gros fournisseurs connus
  const knownVendors = [
    { pattern: /amazon/i, name: 'Amazon' },
    { pattern: /bureau en gros|staples/i, name: 'Bureau en Gros / Staples' },
    { pattern: /dollarama/i, name: 'Dollarama' },
    { pattern: /canva/i, name: 'Canva' },
    { pattern: /adobe/i, name: 'Adobe' },
    { pattern: /postes canada|canada post/i, name: 'Postes Canada' },
    { pattern: /ups/i, name: 'UPS' },
    { pattern: /fedex/i, name: 'FedEx' },
    { pattern: /jiffy/i, name: 'Jiffy Shirts' },
    { pattern: /siser/i, name: 'Siser' },
  ];
  for (const kv of knownVendors) {
    if (kv.pattern.test(text)) return kv.name;
  }

  const patterns = [
    /(?:vendu par|sold by)[:\s]*([^\n]{3,50})/i,
    /(?:fournisseur|vendor|supplier|de|from)[:\s]+([^\n,]{3,50})/i,
    /(?:raison sociale|company)[:\s]+([^\n,]{3,50})/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let v = m[1].trim();
      // Nettoyer: couper apres le nom d'entreprise (avant adresse, numeros)
      v = v.replace(/\s+\d{1,5}\s+(rue|av|boul|st|street|ave|blvd).*/i, '').trim();
      if (v.length >= 3) return v;
    }
  }

  // Premiere ligne non-vide qui semble etre un nom d'entreprise
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (/^\d+$/.test(line)) continue;
    if (/^\d{4}-\d{2}-\d{2}$/.test(line)) continue;
    if (/invoice|facture|page/i.test(line)) continue;
    if (line.length >= 3 && line.length <= 60) return line;
  }

  return '';
}

/**
 * Extraire les montants de taxes TPS et TVQ
 */
function extractTaxes(text) {
  let tps = 0;
  let tvq = 0;

  // TPS / GST (5%)
  const tpsPatterns = [
    /(?:TPS|GST|taxe f[eé]d[eé]rale)[:\s]*\$?\s*([\d,]+\.\d{2})/i,
    /(?:TPS|GST)\s*\(?\s*5\s*%?\s*\)?\s*:?\s*\$?\s*([\d,]+\.\d{2})/i,
  ];
  for (const p of tpsPatterns) {
    const m = text.match(p);
    if (m) { tps = parseFloat(m[1].replace(',', '')); break; }
  }

  // TVQ / QST (9.975%)
  const tvqPatterns = [
    /(?:TVQ|QST|taxe provinciale)[:\s]*\$?\s*([\d,]+\.\d{2})/i,
    /(?:TVQ|QST)\s*\(?\s*9[\.,]975?\s*%?\s*\)?\s*:?\s*\$?\s*([\d,]+\.\d{2})/i,
  ];
  for (const p of tvqPatterns) {
    const m = text.match(p);
    if (m) { tvq = parseFloat(m[1].replace(',', '')); break; }
  }

  return { tps, tvq };
}

/**
 * Extraire le sous-total et le total
 */
function extractTotals(text) {
  let subtotal = 0;
  let total = 0;

  const subtotalMatch = text.match(/(?:sous[- ]?total|subtotal)[:\s]*\$?\s*([\d,]+\.\d{2})/i);
  if (subtotalMatch) subtotal = parseFloat(subtotalMatch[1].replace(',', ''));

  // Total: prend le dernier match (souvent en bas de facture)
  const totalMatches = [...text.matchAll(/(?:total|montant total|total due|amount due)[:\s]*\$?\s*([\d,]+\.\d{2})/gi)];
  if (totalMatches.length > 0) {
    total = parseFloat(totalMatches[totalMatches.length - 1][1].replace(',', ''));
  }

  return { subtotal, total };
}

/**
 * Deviner la catégorie d'inventaire a partir de la description
 */
function guessCategory(description) {
  const d = description.toLowerCase();
  if (/t-?shirt|hoodie|crewneck|chandail|vêtement|textile|coton|polyester|gildan|bella|canvas/i.test(d)) return 'textile';
  if (/cadre|frame|moulure|verre|glass/i.test(d)) return 'frame';
  if (/sublimation|heat transfer|transfert/i.test(d)) return 'merch';
  if (/sticker|vinyle|vinyl|autocollant|decal/i.test(d)) return 'sticker';
  if (/papier|paper|toile|canvas|rouleau|roll|encre|ink|toner/i.test(d)) return 'print';
  if (/tasse|mug|coussin|pillow|sac|bag|tote|poster/i.test(d)) return 'merch';
  if (/emballage|packaging|boite|box|tube|mailer|enveloppe/i.test(d)) return 'accessory';
  return 'other';
}

/**
 * Deviner la catégorie de depense
 */
function guessExpenseCategory(description, vendor) {
  const text = `${description} ${vendor}`.toLowerCase();
  if (/papier|encre|ink|toner|vinyle|vinyl|rouleau|roll|ruban|ribbon|laminat|sublimation|heat transfer|transfert/i.test(text)) return 'consommables';
  if (/t-?shirt|hoodie|textile|chandail|gildan|bella|canvas|coton/i.test(text)) return 'materiel';
  if (/postes?[ -]?canada|ups|fedex|purolator|shipping|livraison|expedition/i.test(text)) return 'shipping';
  if (/adobe|canva|shopify|figma|licence|license|saas|abonnement|subscription/i.test(text)) return 'software';
  if (/facebook|google ads|pub|advertising|marketing|promo/i.test(text)) return 'marketing';
  if (/imprimante|printer|cutter|presse|laminateur|machine|outil|tool/i.test(text)) return 'equipment';
  return 'materiel';
}

/**
 * Extraire les lignes d'items de la facture
 * Cherche les patterns: description + quantite + prix unitaire + total
 */
function extractLineItems(text) {
  const items = [];
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // Lignes/mots a ignorer dans les descriptions
  const skipPattern = /^(sous|sub|total|tps|tvq|gst|qst|tax|montant|amount|description|qty|quantit|prix|price|unit|shipping|frais|charge|page|invoice|facture|paid|pay|date|order|commande|asin|expedi)/i;

  // Pattern Amazon: "Description ASIN: xxx qty $price $0.00 $0.00 $total"
  // Cherche les ASIN comme marqueur d'item Amazon
  const asinPattern = /ASIN:\s*([A-Z0-9]{10})/gi;
  const asins = [...text.matchAll(asinPattern)];

  if (asins.length > 0) {
    // Format Amazon detecte - parser differemment
    // Chercher chaque bloc: description avant ASIN, puis qty + prix apres
    for (const asin of asins) {
      const asinIdx = text.indexOf(asin[0]);
      // Remonter pour trouver la description (entre le precedent \n et l'ASIN)
      const before = text.substring(Math.max(0, asinIdx - 300), asinIdx);
      const descLines = before.split(/\n/).map(l => l.trim()).filter(Boolean);
      // Prendre les dernieres lignes non-header comme description
      let desc = '';
      for (let i = descLines.length - 1; i >= 0; i--) {
        const line = descLines[i];
        if (skipPattern.test(line)) continue;
        if (/^\$/.test(line)) continue;
        if (line.length > 10) { desc = line; break; }
      }

      // Chercher les prix apres l'ASIN
      const after = text.substring(asinIdx + asin[0].length, asinIdx + asin[0].length + 200);
      const prices = [...after.matchAll(/\$?([\d,]+\.\d{2})/g)].map(m => parseFloat(m[1].replace(',', '')));
      const qtyMatch = after.match(/^\s*(\d{1,4})\s/);
      const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;

      if (desc && prices.length > 0) {
        const unitPrice = prices[0];
        const total = prices.length >= 4 ? prices[prices.length - 1] : unitPrice * qty;
        items.push({ description: desc.trim(), quantity: qty, unitPrice, total });
      }
    }
  }

  // Pattern 1: qty x description @ price = total
  if (items.length === 0) {
    const pattern1 = /(\d+)\s*x\s+(.+?)\s*@?\s*\$?\s*(\d+[.,]\d{2})\s*=?\s*\$?\s*(\d+[.,]\d{2})?/gi;
    for (const m of fullText.matchAll(pattern1)) {
      items.push({
        description: m[2].trim(),
        quantity: parseInt(m[1]),
        unitPrice: parseFloat(m[3].replace(',', '.')),
        total: m[4] ? parseFloat(m[4].replace(',', '.')) : parseInt(m[1]) * parseFloat(m[3].replace(',', '.')),
      });
    }
  }

  // Pattern 2: description qty unitPrice total (colonnes typiques)
  if (items.length === 0) {
    const pattern2 = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s/\-().]{3,50}?)\s+(\d{1,4})\s+\$?\s*(\d+[.,]\d{2})\s+\$?\s*(\d+[.,]\d{2})/g;
    for (const m of fullText.matchAll(pattern2)) {
      const desc = m[1].trim();
      if (skipPattern.test(desc)) continue;
      items.push({
        description: desc,
        quantity: parseInt(m[2]),
        unitPrice: parseFloat(m[3].replace(',', '.')),
        total: parseFloat(m[4].replace(',', '.')),
      });
    }
  }

  // Pattern 3: description + montant simple
  if (items.length === 0) {
    const pattern3 = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s/\-().#]{5,60}?)\s+\$?\s*(\d+[.,]\d{2})\s*$/gm;
    for (const m of text.matchAll(pattern3)) {
      const desc = m[1].trim();
      if (skipPattern.test(desc)) continue;
      if (/total|subtotal/i.test(desc)) continue;
      items.push({
        description: desc,
        quantity: 1,
        unitPrice: parseFloat(m[2].replace(',', '.')),
        total: parseFloat(m[2].replace(',', '.')),
      });
    }
  }

  // Fallback: si toujours rien, utiliser le subtotal comme item unique
  if (items.length === 0) {
    const { subtotal } = extractTotals(text);
    if (subtotal > 0) {
      // Essayer de trouver une description dans le texte
      let desc = 'Article';
      for (const line of lines) {
        if (line.length > 15 && line.length < 100 && !skipPattern.test(line) && /[a-zA-Z]{3,}/.test(line) && !/\$/.test(line)) {
          desc = line;
          break;
        }
      }
      items.push({ description: desc, quantity: 1, unitPrice: subtotal, total: subtotal });
    }
  }

  return items.map(item => ({
    ...item,
    category: guessCategory(item.description),
    addToInventory: true,
  }));
}

/**
 * Parser principal: extrait toutes les donnees d'une facture PDF
 * @param {File} file - le fichier PDF
 * @returns {Object} donnees structurees de la facture
 */
export async function parseInvoicePDF(file) {
  const text = await extractTextFromPDF(file);

  const vendor = extractVendor(text);
  const date = extractDate(text);
  const invoiceNumber = extractInvoiceNumber(text);
  const { tps, tvq } = extractTaxes(text);
  const { subtotal, total } = extractTotals(text);
  const lineItems = extractLineItems(text);

  // Si on a des items mais pas de subtotal, calculer
  const calculatedSubtotal = subtotal || lineItems.reduce((s, i) => s + i.total, 0);
  const calculatedTotal = total || (calculatedSubtotal + tps + tvq);

  return {
    rawText: text,
    vendor,
    date,
    invoiceNumber,
    lineItems,
    subtotal: Math.round(calculatedSubtotal * 100) / 100,
    tps: Math.round(tps * 100) / 100,
    tvq: Math.round(tvq * 100) / 100,
    total: Math.round(calculatedTotal * 100) / 100,
    expenseCategory: guessExpenseCategory(
      lineItems.map(i => i.description).join(' '),
      vendor
    ),
  };
}
