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
 */
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');
    pages.push(text);
  }

  return pages.join('\n');
}

/**
 * Extraire la date de la facture
 */
function extractDate(text) {
  // YYYY-MM-DD
  const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];

  // DD/MM/YYYY ou DD-MM-YYYY
  const dmy = text.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Mois en texte: "15 mars 2026", "March 15, 2026"
  const frMonths = { janvier: '01', fevrier: '02', février: '02', mars: '03', avril: '04', mai: '05', juin: '06', juillet: '07', aout: '08', août: '08', septembre: '09', octobre: '10', novembre: '11', decembre: '12', décembre: '12' };
  const enMonths = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };

  const frMatch = text.match(/(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(\d{4})/i);
  if (frMatch) return `${frMatch[3]}-${frMonths[frMatch[2].toLowerCase()]}-${frMatch[1].padStart(2, '0')}`;

  const enMatch = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (enMatch) return `${enMatch[3]}-${enMonths[enMatch[1].toLowerCase()]}-${enMatch[2].padStart(2, '0')}`;

  return new Date().toISOString().split('T')[0];
}

/**
 * Extraire le numéro de facture
 */
function extractInvoiceNumber(text) {
  const patterns = [
    /(?:facture|invoice|fact|inv)[.\s:#-]*\s*([A-Z0-9][\w-]{2,20})/i,
    /(?:no|num[eé]ro|number|#)[.\s:#-]*\s*([A-Z0-9][\w-]{2,20})/i,
    /(?:re[cç]u|receipt)[.\s:#-]*\s*([A-Z0-9][\w-]{2,20})/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return '';
}

/**
 * Extraire le nom du fournisseur (premiere ligne significative ou champ identifie)
 */
function extractVendor(text) {
  const patterns = [
    /(?:de|from|vendu par|sold by|fournisseur|vendor|supplier)[:\s]+([^\n,]{3,50})/i,
    /(?:raison sociale|company)[:\s]+([^\n,]{3,50})/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }

  // Premiere ligne non-vide qui semble etre un nom d'entreprise
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    // Ignorer les lignes qui sont juste des numeros ou des dates
    if (/^\d+$/.test(line)) continue;
    if (/^\d{4}-\d{2}-\d{2}$/.test(line)) continue;
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
  if (/papier|encre|ink|toner|vinyle|vinyl|rouleau|roll|ruban|ribbon|laminat/i.test(text)) return 'consommables';
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

  // Nettoyer le texte - garder les lignes significatives
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // Pattern 1: qty x description @ price = total
  // Ex: "2 x T-Shirt Gildan S/M @ 8.50 = 17.00"
  const pattern1 = /(\d+)\s*x\s+(.+?)\s*@?\s*\$?\s*(\d+[.,]\d{2})\s*=?\s*\$?\s*(\d+[.,]\d{2})?/gi;
  for (const m of fullText.matchAll(pattern1)) {
    items.push({
      description: m[2].trim(),
      quantity: parseInt(m[1]),
      unitPrice: parseFloat(m[3].replace(',', '.')),
      total: m[4] ? parseFloat(m[4].replace(',', '.')) : parseInt(m[1]) * parseFloat(m[3].replace(',', '.')),
    });
  }

  // Pattern 2: description qty unitPrice total (colonnes typiques)
  // Ex: "T-Shirt Gildan S/M 2 8.50 17.00"
  if (items.length === 0) {
    const pattern2 = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s/\-().]{3,50}?)\s+(\d{1,4})\s+\$?\s*(\d+[.,]\d{2})\s+\$?\s*(\d+[.,]\d{2})/g;
    for (const m of fullText.matchAll(pattern2)) {
      const desc = m[1].trim();
      // Ignorer les lignes qui sont des en-tetes ou des totaux
      if (/^(sous|sub|total|tps|tvq|gst|qst|tax|montant|amount|description|qty|quantit|prix|price|unit)/i.test(desc)) continue;
      items.push({
        description: desc,
        quantity: parseInt(m[2]),
        unitPrice: parseFloat(m[3].replace(',', '.')),
        total: parseFloat(m[4].replace(',', '.')),
      });
    }
  }

  // Pattern 3: lignes simples avec juste description et un montant
  // Ex: "Encre Epson T522 Cyan 45.99"
  if (items.length === 0) {
    const pattern3 = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s/\-().#]{5,60}?)\s+\$?\s*(\d+[.,]\d{2})\s*$/gm;
    for (const m of text.matchAll(pattern3)) {
      const desc = m[1].trim();
      if (/^(sous|sub|total|tps|tvq|gst|qst|tax|montant|amount|date|facture|invoice|client|adresse|phone|tel)/i.test(desc)) continue;
      if (/total|subtotal/i.test(desc)) continue;
      items.push({
        description: desc,
        quantity: 1,
        unitPrice: parseFloat(m[2].replace(',', '.')),
        total: parseFloat(m[2].replace(',', '.')),
      });
    }
  }

  // Enrichir chaque item avec une categorie devinee
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
