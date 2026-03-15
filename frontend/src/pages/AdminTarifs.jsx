import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Copy, Check, Download, Printer, Users, BarChart3, Sticker, Shirt, Palette, Globe, FileText } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// =============================================
// DONNEES TARIFS
// =============================================

// --- Prix service impression (client externe apporte son fichier) ---
const SERVICE_PRICES = [
  { format: 'A4 (8.5x11")', studio: 20, museum: 35, frame: 30, notes: '' },
  { format: 'A3 (11x17")', studio: 25, museum: 65, frame: 30, notes: '' },
  { format: 'A3+ (13x19")', studio: 35, museum: 95, frame: 30, notes: '' },
  { format: 'A2 (18x24")', studio: null, museum: 75, frame: null, notes: 'Canon Pro 2600 seulement (12 encres). Pas de frame.' },
];

// --- Prix boutique artiste (ce que le client final paie) ---
const ARTIST_PRICES = [
  { format: 'A4 (8.5x11")', studio: 35, museum: 75, frame: 30 },
  { format: 'A3 (11x17")', studio: 50, museum: 120, frame: 30 },
  { format: 'A3+ (13x19")', studio: 65, museum: 160, frame: 30 },
  { format: 'A2 (18x24")', studio: null, museum: 125, frame: null },
];

// --- Stickers ---
const STICKER_STANDARD = [
  { qty: 25, price: 45, unit: 1.80 },
  { qty: 50, price: 69, unit: 1.38 },
  { qty: 100, price: 85, unit: 0.85 },
  { qty: 250, price: 125, unit: 0.50 },
  { qty: 500, price: 179, unit: 0.36 },
];

const STICKER_HOLO = [
  { qty: 25, price: 55, unit: 2.20 },
  { qty: 50, price: 85, unit: 1.70 },
  { qty: 100, price: 105, unit: 1.05 },
  { qty: 250, price: 155, unit: 0.62 },
  { qty: 500, price: 219, unit: 0.44 },
];

// --- Flyers / Cartes postales ---
const FLYERS = [
  { qty: 50, single: 40, double: 52 },
  { qty: 100, single: 65, double: 85 },
  { qty: 150, single: 90, double: 117 },
  { qty: 250, single: 130, double: 169 },
  { qty: 500, single: 225, double: 293 },
];

// --- Sublimation / Merch ---
const SUBLIMATION = [
  { product: 'T-shirt', tiers: [{ qty: 1, unit: 30 }, { qty: 5, unit: 27 }, { qty: 10, unit: 25 }, { qty: '25+', unit: 23, soumission: true }] },
  { product: 'Crewneck', tiers: [{ qty: 1, unit: 40 }, { qty: 5, unit: 37 }, { qty: 10, unit: 35 }, { qty: '25+', unit: 33, soumission: true }] },
  { product: 'Hoodie', tiers: [{ qty: 1, unit: 50 }, { qty: 5, unit: 45 }, { qty: 10, unit: 42 }, { qty: '25+', unit: 40, soumission: true }] },
  { product: 'Tote Bag', tiers: [{ qty: 1, unit: 15 }, { qty: 10, unit: 13 }, { qty: 25, unit: 12 }, { qty: 50, unit: 10 }] },
  { product: 'Sac banane', tiers: [{ qty: 1, unit: 80 }, { qty: 5, unit: 75 }, { qty: 10, unit: 70 }] },
  { product: 'Mug', tiers: [{ qty: 1, unit: 15 }, { qty: 5, unit: 13 }, { qty: 10, unit: 12 }, { qty: 25, unit: 10 }] },
  { product: 'Tumbler', tiers: [{ qty: 1, unit: 25 }, { qty: 5, unit: 22 }, { qty: 10, unit: 20 }, { qty: 25, unit: 18 }] },
];
const SUBLIMATION_DESIGN = 125;

// --- Merch Massive (prix boutique) ---
const MERCH_MASSIVE = [
  { product: 'T-shirt Massive', price: 22 },
  { product: 'Crewneck Massive', price: 30 },
  { product: 'Hoodie Massive', price: 39 },
];

// --- Design graphique ---
const DESIGN_SERVICES = [
  { service: 'Creation logo', price: '300$ - 600$', delai: '5-10 jours' },
  { service: 'Identite visuelle complete', price: '800$ - 1 500$', delai: '2-3 semaines' },
  { service: 'Affiche / flyer evenement', price: '150$ - 300$', delai: '3-5 jours' },
  { service: 'Pochette album / single', price: '200$ - 400$', delai: '5-7 jours' },
  { service: 'Design d\'icones (set)', price: '200$ - 500$', delai: '3-7 jours' },
  { service: 'Retouche photo (par image)', price: '15$ - 50$', delai: '24-48h' },
];

// --- Web ---
const WEB_SERVICES = [
  { service: 'Landing page', price: '900$', delai: '1-2 semaines' },
  { service: 'Site vitrine (5-10 pages)', price: '1 000$ - 1 500$', delai: '2-4 semaines' },
  { service: 'Site e-commerce', price: '1 500$ - 2 500$', delai: '3-6 semaines' },
  { service: 'Refonte site existant', price: 'Sur soumission', delai: 'Variable' },
  { service: 'Maintenance mensuelle', price: '100$ - 200$/mois', delai: '-' },
];
const WEB_DESIGN_ONLY = [
  { service: 'Landing page (Figma)', price: '450$' },
  { service: 'Site vitrine (5-10 pages)', price: '900$' },
  { service: 'E-commerce / multi-pages (10+)', price: '1 500$ - 2 000$' },
];
const WEB_HOURLY = '85$/h';

// --- Concurrence (donnees mises a jour 2025-2026) ---
const COMPETITORS = [
  { name: 'Society6', commission: '5-10%', artistProfit: '~4$', quality: 'POD generique', notes: '5-10% depuis mars 2025. L\'artiste ne controle meme plus ses prix.', highlight: false },
  { name: 'Redbubble', commission: '~10% net', artistProfit: '~2-3$', quality: 'POD generique', notes: 'Frais plateforme 50% sur le markup depuis sept. 2025. Net ~2-3$ par vente.', highlight: false },
  { name: 'Printify', commission: 'Markup libre', artistProfit: '~20-25$', quality: 'Variable (dropship)', notes: 'Cout base ~10-12$ USD. MAIS: tu geres ta boutique, marketing, service client, livraison.', highlight: 'printify' },
  { name: 'Printful', commission: 'Markup libre', artistProfit: '~20$', quality: 'POD (giclee 8 encres)', notes: 'Cout base ~16$+ USD. Meme modele que Printify, tu geres tout.', highlight: false },
  { name: 'INPRNT', commission: '50%', artistProfit: '~18$', quality: 'Giclee d\'archives (8 encres)', notes: 'Meilleur POD en qualite. Sur invitation. Print ~36$, artiste garde 18$.', highlight: false },
  { name: 'Fine Art America', commission: 'Markup libre', artistProfit: '~10-25$', quality: 'Giclee d\'archives', notes: 'Prix de base fixe + ton markup. Qualite correcte.', highlight: false },
  { name: 'Massive Medias', commission: '~30-40%', artistProfit: '40-50$', quality: '12 encres pigmentees, musee', notes: 'Impression locale fine art. Zero gestion pour l\'artiste. Qualite superieure a tout POD.', highlight: 'massive' },
];

// =============================================
// COMPOSANTS
// =============================================

function SectionCard({ icon: Icon, iconColor, title, subtitle, children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="rounded-xl bg-glass p-5 card-border mb-6">
      <h3 className="text-sm font-heading font-bold text-heading mb-1 flex items-center gap-2">
        <Icon size={16} className={iconColor} />
        {title}
      </h3>
      {subtitle && <p className="text-xs text-grey-muted mb-4">{subtitle}</p>}
      {children}
    </motion.div>
  );
}

function DataTable({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b card-border">
            {headers.map((h, i) => (
              <th key={i} className={`py-2 px-3 font-medium ${h.className || 'text-grey-muted'} ${i === 0 ? 'text-left' : 'text-center'}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, className = 'text-heading', center = true }) {
  return <td className={`py-2.5 px-3 ${center ? 'text-center' : ''} ${className}`}>{children}</td>;
}

// =============================================
// PAGE PRINCIPALE
// =============================================

function AdminTarifs() {
  const { tx } = useLang();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('artistes');
  const artistSheetRef = useRef(null);

  // --- Copier texte artiste ---
  const handleCopy = () => {
    const lines = [];
    lines.push('GRILLE TARIFAIRE ARTISTES - MASSIVE MEDIAS');
    lines.push('='.repeat(55));
    lines.push('Tous les prix sont avant taxes (TPS + TVQ en sus)');
    lines.push('');

    // Prints
    lines.push('IMPRESSION FINE ART');
    lines.push('-'.repeat(55));
    lines.push('');
    lines.push('SERIE STUDIO (4 encres pigmentees)');
    lines.push('Format           | Sans frame | Avec frame');
    ARTIST_PRICES.forEach(p => {
      if (p.studio) {
        lines.push(`${p.format.padEnd(17)}| ${(p.studio + '$').padEnd(11)}| ${p.frame ? (p.studio + p.frame) + '$' : 'N/A'}`);
      }
    });
    lines.push('');
    lines.push('SERIE MUSEE (12 encres pigmentees - Canon Pro 2600)');
    lines.push('Format           | Sans frame | Avec frame');
    ARTIST_PRICES.forEach(p => {
      lines.push(`${p.format.padEnd(17)}| ${(p.museum + '$').padEnd(11)}| ${p.frame ? (p.museum + p.frame) + '$' : 'N/A'}`);
    });
    lines.push('');
    lines.push('* A2 (18x24") = Canon Pro 2600 uniquement (12 encres), pas de frame');
    lines.push('* Frame = cadre noir ou blanc (+30$)');
    lines.push('');

    // Stickers
    lines.push('PACKS STICKERS (design inclus)');
    lines.push('-'.repeat(55));
    lines.push('Quantite | Standard (Matte/Glossy) | FX (Holo/Broken Glass)');
    STICKER_STANDARD.forEach((s, i) => {
      const h = STICKER_HOLO[i];
      lines.push(`${(s.qty + ' stickers').padEnd(13)}| ${(s.price + '$ (' + s.unit.toFixed(2) + '$/u)').padEnd(24)}| ${h.price}$ (${h.unit.toFixed(2)}$/u)`);
    });
    lines.push('');

    // Commission
    lines.push('TA COMMISSION PAR VENTE (PRINTS)');
    lines.push('-'.repeat(55));
    lines.push('Format           | Studio      | Musee');
    ARTIST_PRICES.forEach((p, i) => {
      const sp = SERVICE_PRICES[i];
      const studioProfit = p.studio && sp.studio ? p.studio - sp.studio : null;
      const museumProfit = p.museum - sp.museum;
      lines.push(`${p.format.padEnd(17)}| ${(studioProfit !== null ? studioProfit + '$' : 'N/A').padEnd(12)}| ${museumProfit}$`);
    });
    lines.push('');
    lines.push('Commission identique avec ou sans frame (le frame va a Massive).');
    lines.push('Ta commission = profit net. Tu fournis ton fichier, on fait le reste.');
    lines.push('');
    lines.push('--- Massive Medias - massivemedias.com ---');

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // --- PDF artiste (theme Ocean, jsPDF) ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentW = W - margin * 2;
    let y = 0;

    // Couleurs theme
    const bg = [4, 20, 24];
    const headerBg = [13, 48, 64];
    const cyan = [0, 188, 212];
    const cyanLight = [77, 208, 225];
    const purple = [168, 85, 247];
    const textLight = [232, 224, 240];
    const textMuted = [184, 172, 204];
    const white = [255, 255, 255];
    const green = [34, 197, 94];
    const orange = [249, 115, 22];

    // Background page
    const fillPage = () => {
      doc.setFillColor(...bg);
      doc.rect(0, 0, W, H, 'F');
    };
    fillPage();

    // Check page break
    const checkPage = (needed = 20) => {
      if (y + needed > H - 12) {
        doc.addPage();
        fillPage();
        y = margin;
      }
    };

    // --- HEADER ---
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, W, 32, 'F');
    doc.setFillColor(...cyan);
    doc.rect(0, 32, W, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...white);
    doc.text('Grille Tarifaire Artistes', margin, 14);
    doc.setFontSize(10);
    doc.setTextColor(...cyan);
    doc.text('Massive Medias - Impression Fine Art & Stickers - Montreal', margin, 21);
    doc.setFontSize(7);
    doc.setTextColor(...cyanLight);
    doc.text(`Tous les prix sont avant taxes (TPS + TVQ en sus) - ${new Date().toLocaleDateString('fr-CA')}`, margin, 28);
    y = 38;

    // --- Section title helper ---
    const sectionTitle = (title) => {
      checkPage(18);
      doc.setFillColor(...headerBg);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setFillColor(...cyan);
      doc.rect(margin, y + 7, contentW, 0.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...cyan);
      doc.text(title.toUpperCase(), margin + 3, y + 5);
      y += 11;
    };

    // --- Badge helper ---
    const badge = (text, x, yPos) => {
      doc.setFillColor(...cyan);
      doc.roundedRect(x, yPos - 3.5, doc.getTextWidth(text) + 6, 5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...bg);
      doc.text(text, x + 3, yPos);
    };

    // --- Table helper ---
    const makeTable = (headers, rows, options = {}) => {
      checkPage(10 + rows.length * 7);
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [headers],
        body: rows,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          textColor: textLight,
          cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
          lineWidth: 0,
        },
        headStyles: {
          fillColor: headerBg,
          textColor: cyan,
          fontStyle: 'bold',
          fontSize: 7,
        },
        alternateRowStyles: {
          fillColor: [10, 35, 45],
        },
        columnStyles: options.columnStyles || {},
        didParseCell: options.didParseCell || undefined,
      });
      y = doc.lastAutoTable.finalY + 4;
    };

    // ================================
    // PAGE 1: Prints + Stickers + Commission
    // ================================

    sectionTitle('Prints Fine Art - Prix de vente');

    // Studio
    badge('STUDIO', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...cyanLight);
    doc.text('  4 encres pigmentees', margin + doc.getTextWidth('STUDIO') + 8, y);
    y += 4;

    makeTable(
      ['Format', 'Sans frame', 'Avec frame (+30$)'],
      ARTIST_PRICES.filter(p => p.studio).map(p => [
        p.format,
        p.studio + '$',
        p.frame ? (p.studio + p.frame) + '$' : 'N/A',
      ]),
      { columnStyles: { 1: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } } }
    );

    // Museum
    badge('MUSEE', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...cyanLight);
    doc.text('  12 encres pigmentees (Canon Pro 2600)', margin + doc.getTextWidth('MUSEE') + 8, y);
    y += 4;

    makeTable(
      ['Format', 'Sans frame', 'Avec frame (+30$)'],
      ARTIST_PRICES.map(p => [
        p.format,
        p.museum + '$',
        p.frame ? (p.museum + p.frame) + '$' : 'N/A',
      ]),
      { columnStyles: { 1: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } } }
    );

    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'italic');
    doc.text('* A2 (18x24") = Canon Pro 2600 uniquement, pas de frame disponible. Frame = cadre noir ou blanc.', margin, y);
    y += 6;

    // Stickers
    sectionTitle('Packs Stickers (design inclus)');
    makeTable(
      ['Quantite', 'Standard (Matte/Glossy)', '$/unite', 'FX (Holo/Broken Glass)', '$/unite'],
      STICKER_STANDARD.map((s, i) => {
        const h = STICKER_HOLO[i];
        return [s.qty.toString(), s.price + '$', s.unit.toFixed(2) + '$', h.price + '$', h.unit.toFixed(2) + '$'];
      }),
      { columnStyles: { 1: { fontStyle: 'bold' }, 3: { fontStyle: 'bold' } } }
    );

    // Commission
    sectionTitle('Ta commission par vente (Prints)');
    makeTable(
      ['Format', 'Studio', 'Musee'],
      ARTIST_PRICES.map((p, i) => {
        const sp = SERVICE_PRICES[i];
        const studioProfit = p.studio && sp.studio ? p.studio - sp.studio : null;
        const museumProfit = p.museum - sp.museum;
        return [p.format, studioProfit !== null ? studioProfit + '$' : 'N/A', museumProfit + '$'];
      }),
      {
        columnStyles: { 1: { fontStyle: 'bold', textColor: cyan }, 2: { fontStyle: 'bold', textColor: cyan } },
        didParseCell: (data) => {
          if (data.section === 'body') {
            data.cell.styles.fillColor = [8, 40, 55];
          }
        },
      }
    );

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('Commission identique avec ou sans frame (le frame va a Massive).', margin, y);
    y += 6;

    // ================================
    // EXEMPLE CONCRET (3 cartes)
    // ================================
    checkPage(55);

    // Box background
    doc.setFillColor(10, 35, 45);
    doc.setDrawColor(...cyan);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, 50, 2, 2, 'FD');

    const boxY = y + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...white);
    doc.text('Exemple : Le client achete un print qualite musee avec frame', margin + 5, boxY + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...cyanLight);
    doc.text('Le client paie 105$ (print 75$ + frame 30$). Ou va l\'argent?', margin + 5, boxY + 9);

    // 3 cards
    const cardW = (contentW - 16) / 3;
    const cardY = boxY + 14;
    const cardH = 28;

    // Card: Massive Impression
    doc.setFillColor(8, 45, 55);
    doc.setDrawColor(0, 120, 140);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin + 4, cardY, cardW, cardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...cyan);
    doc.text('35$', margin + 4 + cardW / 2, cardY + 10, { align: 'center' });
    doc.setFontSize(6);
    doc.text('MASSIVE - IMPRESSION', margin + 4 + cardW / 2, cardY + 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...textMuted);
    doc.text('Papier d\'archives, 12 encres', margin + 7, cardY + 20);
    doc.text('pigmentees, calibration, soft', margin + 7, cardY + 23);
    doc.text('proofing, main d\'oeuvre', margin + 7, cardY + 26);

    // Card: Massive Frame
    const card2X = margin + 4 + cardW + 2;
    doc.setFillColor(8, 45, 55);
    doc.setDrawColor(0, 120, 140);
    doc.roundedRect(card2X, cardY, cardW, cardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...cyan);
    doc.text('30$', card2X + cardW / 2, cardY + 10, { align: 'center' });
    doc.setFontSize(6);
    doc.text('MASSIVE - FRAME', card2X + cardW / 2, cardY + 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...textMuted);
    doc.text('Cadre noir ou blanc,', card2X + 3, cardY + 20);
    doc.text('materiaux + assemblage', card2X + 3, cardY + 23);

    // Card: Artiste
    const card3X = margin + 4 + (cardW + 2) * 2;
    doc.setFillColor(25, 15, 40);
    doc.setDrawColor(120, 60, 180);
    doc.roundedRect(card3X, cardY, cardW, cardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...purple);
    doc.text('40$', card3X + cardW / 2, cardY + 10, { align: 'center' });
    doc.setFontSize(6);
    doc.text('ARTISTE - PROFIT NET', card3X + cardW / 2, cardY + 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...textMuted);
    doc.text('Fournit son fichier image,', card3X + 3, cardY + 20);
    doc.text('zero gestion, zero frais,', card3X + 3, cardY + 23);
    doc.text('pas de boutique a gerer', card3X + 3, cardY + 26);

    // Total line
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('35$ + 30$ + 40$ = ', margin + 5 + contentW / 2 - 25, cardY + cardH + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text('105$', margin + 5 + contentW / 2 + 2, cardY + cardH + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(' - Sans frame: client paie 75$, Massive 35$, artiste 40$', margin + 5 + contentW / 2 + 10, cardY + cardH + 4);

    y += 55;

    // Info box - pourquoi c'est juste
    checkPage(16);
    doc.setFillColor(8, 35, 45);
    doc.setDrawColor(...cyan);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin, y + 12);
    doc.setFillColor(6, 30, 40);
    doc.rect(margin + 1, y, contentW - 1, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...cyan);
    doc.text('L\'artiste et Massive font a peu pres le meme profit reel,', margin + 4, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cyanLight);
    doc.text('mais l\'artiste n\'a rien a faire. Tu fournis ton fichier, Massive gere: impression fine art,', margin + 4, y + 8);
    doc.text('calibration couleurs, soft proofing, papier archive, encres pigmentees, expedition.', margin + 4, y + 11);
    y += 17;

    // ================================
    // COMPARAISON CONCURRENCE
    // ================================
    sectionTitle('Comparaison concurrence (2025-2026)');
    makeTable(
      ['Plateforme', 'Artiste garde', 'Qualite', 'Notes'],
      COMPETITORS.map(c => [c.name, c.artistProfit, c.quality, c.notes]),
      {
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 22, fontStyle: 'bold' },
          2: { cellWidth: 28, fontSize: 6.5 },
          3: { fontSize: 6.5 },
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const name = COMPETITORS[data.row.index]?.name;
            if (name === 'Massive Medias') {
              data.cell.styles.textColor = cyan;
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [8, 40, 55];
            }
          }
        },
      }
    );

    // Info box Printify
    checkPage(14);
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin, y + 10);
    doc.setFillColor(20, 15, 10);
    doc.rect(margin + 1, y, contentW - 1, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...orange);
    doc.text('Printify vs Massive:', margin + 4, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(253, 186, 116);
    doc.text('Printify semble comparable (~20-25$) mais l\'artiste doit gerer sa propre boutique (Etsy ~6.5% frais,', margin + 4, y + 6.5);
    doc.text('Shopify ~39$/mois), le marketing, le service client et les retours. Avec Massive, tu fournis ton fichier et c\'est tout.', margin + 4, y + 9.5);
    y += 14;

    // Info box resume
    checkPage(16);
    doc.setDrawColor(...green);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin, y + 13);
    doc.setFillColor(8, 18, 12);
    doc.rect(margin + 1, y, contentW - 1, 13, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...green);
    doc.text('En resume:', margin + 4, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(134, 239, 172);
    doc.text('Society6 / Redbubble: 2-4$ par vente (presque rien). Printify / Printful: ~20-25$ mais tu geres tout.', margin + 4, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.text('Massive: 40-50$ profit net, zero gestion, qualite musee superieure a tout POD.', margin + 4, y + 10.5);
    y += 17;

    // --- Service impression (client externe) ---
    sectionTitle('Service impression (client externe)');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('Prix quand quelqu\'un apporte son propre fichier', margin, y);
    y += 4;

    makeTable(
      ['Format', 'Studio (4 encres)', 'Musee (12 encres)', 'Frame (+)', 'Notes'],
      SERVICE_PRICES.map(p => [
        p.format,
        p.studio ? p.studio + '$' : '-',
        p.museum + '$',
        p.frame ? p.frame + '$' : 'N/A',
        p.notes || '',
      ]),
      {
        columnStyles: { 1: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' }, 4: { fontSize: 6 } },
      }
    );

    // --- FOOTER ---
    const footerH = 10;
    const footerY = H - footerH;
    // If we're too close to footer, add new page
    if (y > footerY - 5) {
      doc.addPage();
      fillPage();
    }
    doc.setFillColor(...headerBg);
    doc.rect(0, footerY, W, footerH, 'F');
    doc.setFillColor(...cyan);
    doc.rect(0, footerY, W, 0.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...cyan);
    doc.text('Massive Medias', W / 2 - 20, footerY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cyanLight);
    doc.text(' - massivemedias.com - Impression fine art locale a Montreal', W / 2, footerY + 5);

    // Also add footer on first page if we have multiple
    const totalPages = doc.internal.getNumberOfPages();
    if (totalPages > 1) {
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(...headerBg);
        doc.rect(0, footerY, W, footerH, 'F');
        doc.setFillColor(...cyan);
        doc.rect(0, footerY, W, 0.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...cyan);
        doc.text('Massive Medias', W / 2 - 20, footerY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...cyanLight);
        doc.text(' - massivemedias.com - Impression fine art locale a Montreal', W / 2, footerY + 5);
      }
    }

    doc.save('Massive-Medias-Grille-Tarifaire-Artistes.pdf');
  };

  // --- Tabs ---
  const tabs = [
    { id: 'artistes', label: 'Artistes', icon: Users },
    { id: 'services', label: 'Tous les tarifs', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-heading flex items-center gap-2">
            <DollarSign size={20} className="text-accent" />
            {tx({ fr: 'Grille tarifaire', en: 'Pricing Grid', es: 'Tabla de precios' })}
          </h2>
          <p className="text-sm text-grey-muted mt-1">Tous les prix avant taxes (TPS + TVQ en sus)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copie!' : 'Copier pour artiste'}
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-semibold hover:bg-purple-500/30 transition-colors">
            <Download size={16} />
            PDF Artiste
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === t.id ? 'bg-accent text-white' : 'bg-glass card-border text-grey-muted hover:text-heading'}`}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ========================================= */}
      {/* TAB ARTISTES */}
      {/* ========================================= */}
      {activeTab === 'artistes' && (
        <div ref={artistSheetRef}>
          {/* Exemple concret - en premier */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-glass p-5 card-border mb-6">
            <div className="space-y-4">
              <div className="bg-purple-500/5 rounded-lg p-4 card-border">
                <p className="text-sm text-heading font-medium leading-relaxed">
                  <span className="text-accent font-bold">Exemple :</span> Le client achete un print qualite musee avec frame. Il paie <span className="text-heading font-bold text-lg">105$</span> <span className="text-grey-muted">(+ taxes)</span>. Ou va l'argent?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                  <div className="text-3xl font-bold text-green-400">35$</div>
                  <div className="text-xs text-green-400 font-bold mt-1 uppercase tracking-wider">Massive - Impression</div>
                  <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
                    <p>- Papier d'archives</p>
                    <p>- 12 encres pigmentees</p>
                    <p>- Calibration couleurs</p>
                    <p>- Soft proofing</p>
                    <p>- Main d'oeuvre</p>
                  </div>
                </div>
                <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                  <div className="text-3xl font-bold text-green-400">30$</div>
                  <div className="text-xs text-green-400 font-bold mt-1 uppercase tracking-wider">Massive - Frame</div>
                  <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
                    <p>- Cadre noir ou blanc</p>
                    <p>- Materiaux + assemblage</p>
                  </div>
                </div>
                <div className="bg-purple-500/15 rounded-xl p-4 text-center border border-purple-500/30">
                  <div className="text-3xl font-bold text-purple-400">40$</div>
                  <div className="text-xs text-purple-400 font-bold mt-1 uppercase tracking-wider">Artiste - Profit net</div>
                  <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
                    <p>- Fournit son fichier image</p>
                    <p>- Zero gestion</p>
                    <p>- Zero frais</p>
                    <p>- Pas de boutique a gerer</p>
                    <p>- Pas de livraison</p>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-grey-muted">
                35$ + 30$ + 40$ = <span className="text-heading font-bold">105$</span> &mdash; Sans frame: client paie 75$, Massive 35$, artiste 40$
              </div>

              <div className="bg-accent/10 rounded-lg p-4 text-sm text-grey-muted space-y-2">
                <p className="font-semibold text-heading text-base">Pourquoi c'est juste?</p>
                <p>L'artiste recoit <span className="text-purple-400 font-semibold">40$ de profit net</span> pour un upload de fichier. Aucune gestion, aucun frais, aucune boutique a maintenir.</p>
                <p>Massive recoit 65$ mais doit couvrir: papier d'archives, 12 encres pigmentees, calibration, cadre, main d'oeuvre, local. Le vrai profit Massive apres couts materiaux est d'environ 30-40$.</p>
                <p className="font-bold text-accent text-base mt-2">L'artiste et Massive font a peu pres le meme profit reel, mais l'artiste n'a rien a faire.</p>
              </div>
            </div>
          </motion.div>

          {/* Prints service */}
          <SectionCard icon={Printer} iconColor="text-blue-400" title="Service impression (client externe)" subtitle="Prix quand quelqu'un apporte son propre fichier">
            <DataTable headers={[
              { label: 'Format' }, { label: 'Studio (4 pig.)' }, { label: 'Musee (12 pig.)' }, { label: 'Frame' }, { label: 'Notes' }
            ]}>
              {SERVICE_PRICES.map((p, i) => (
                <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                  <Td center={false} className="text-heading font-medium">{p.format}</Td>
                  <Td>{p.studio !== null ? `${p.studio}$` : <span className="text-grey-muted">N/A</span>}</Td>
                  <Td>{p.museum}$</Td>
                  <Td>{p.frame !== null ? `+${p.frame}$` : <span className="text-grey-muted">N/A</span>}</Td>
                  <Td center={false} className="text-xs text-grey-muted">{p.notes}</Td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>

          {/* Artist prints */}
          <SectionCard icon={Users} iconColor="text-green-400" title="Boutique artiste (prix client final)" subtitle="Ce que le client de l'artiste paie + split des revenus">
            <h4 className="text-xs font-semibold text-heading mb-2 mt-2 uppercase tracking-wider">Serie Studio - 4 encres pigmentees</h4>
            <div className="overflow-x-auto mb-6">
              <DataTable headers={[
                { label: 'Format' }, { label: 'Sans frame' }, { label: 'Avec frame' },
                { label: 'Massive', className: 'text-green-400 font-semibold' },
                { label: 'Artiste', className: 'text-purple-400 font-semibold' },
              ]}>
                {ARTIST_PRICES.filter(p => p.studio).map((p, idx) => {
                  const sp = SERVICE_PRICES.find(s => s.format === p.format);
                  const artistCut = p.studio - (sp?.studio || 0);
                  return (
                    <tr key={idx} className="border-b card-border hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{p.format}</Td>
                      <Td className="text-heading font-semibold">{p.studio}$</Td>
                      <Td className="text-heading font-semibold">{p.frame ? `${p.studio + p.frame}$` : 'N/A'}</Td>
                      <Td className="text-green-400 font-semibold">{sp?.studio || 0}${p.frame ? ` / ${(sp?.studio || 0) + p.frame}$` : ''}</Td>
                      <Td className="text-purple-400 font-bold text-base">{artistCut}$</Td>
                    </tr>
                  );
                })}
              </DataTable>
            </div>

            <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">Serie Musee - 12 encres pigmentees (Canon Pro 2600)</h4>
            <div className="overflow-x-auto mb-4">
              <DataTable headers={[
                { label: 'Format' }, { label: 'Sans frame' }, { label: 'Avec frame' },
                { label: 'Massive', className: 'text-green-400 font-semibold' },
                { label: 'Artiste', className: 'text-purple-400 font-semibold' },
              ]}>
                {ARTIST_PRICES.map((p, idx) => {
                  const sp = SERVICE_PRICES[idx];
                  const artistCut = p.museum - sp.museum;
                  return (
                    <tr key={idx} className="border-b card-border hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{p.format}</Td>
                      <Td className="text-heading font-semibold">{p.museum}$</Td>
                      <Td className="text-heading font-semibold">{p.frame ? `${p.museum + p.frame}$` : 'N/A'}</Td>
                      <Td className="text-green-400 font-semibold">{sp.museum}${p.frame ? ` / ${sp.museum + p.frame}$` : ''}</Td>
                      <Td className="text-purple-400 font-bold text-base">{artistCut}$</Td>
                    </tr>
                  );
                })}
              </DataTable>
            </div>

            <div className="bg-accent/10 rounded-lg p-3 text-xs text-grey-muted space-y-1">
              <p>* A2 (18x24") = Canon Pro 2600 uniquement (12 encres), pas de frame disponible</p>
              <p>* Frame = cadre noir ou blanc (+30$)</p>
              <p>* Commission artiste = profit net, identique avec ou sans frame (le frame va a Massive)</p>
            </div>
          </SectionCard>

          {/* Stickers pour artistes */}
          <SectionCard icon={Sticker} iconColor="text-pink-400" title="Packs stickers artiste" subtitle="Prix pour les artistes qui veulent vendre des stickers (design inclus)">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">Standard (Matte / Glossy / Die-cut)</h4>
                <DataTable headers={[{ label: 'Quantite' }, { label: 'Prix' }, { label: '$/unite' }]}>
                  {STICKER_STANDARD.map((s, i) => (
                    <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{s.qty}</Td>
                      <Td className="text-heading font-semibold">{s.price}$</Td>
                      <Td className="text-accent font-semibold">{s.unit.toFixed(2)}$</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">FX (Holographique / Broken Glass / Stars)</h4>
                <DataTable headers={[{ label: 'Quantite' }, { label: 'Prix' }, { label: '$/unite' }]}>
                  {STICKER_HOLO.map((s, i) => (
                    <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{s.qty}</Td>
                      <Td className="text-heading font-semibold">{s.price}$</Td>
                      <Td className="text-accent font-semibold">{s.unit.toFixed(2)}$</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          </SectionCard>

          {/* Concurrence */}
          <SectionCard icon={BarChart3} iconColor="text-yellow-400" title="Comparaison concurrence (donnees 2025-2026)" subtitle="Combien l'artiste garde reellement sur chaque plateforme">
            <DataTable headers={[
              { label: 'Plateforme' },
              { label: 'Artiste garde' },
              { label: 'Qualite' },
              { label: 'Ce que l\'artiste doit gerer' },
            ]}>
              {COMPETITORS.map((c, i) => (
                <tr key={i} className={`border-b card-border transition-colors ${c.highlight === 'massive' ? 'bg-accent/10' : c.highlight === 'printify' ? 'bg-orange-500/5' : 'hover:bg-accent/5'}`}>
                  <Td center={false} className={c.highlight === 'massive' ? 'text-accent font-bold' : 'text-heading font-medium'}>{c.name}</Td>
                  <Td className={`font-bold text-base ${c.highlight === 'massive' ? 'text-accent' : c.highlight === 'printify' ? 'text-orange-400' : 'text-heading'}`}>{c.artistProfit}</Td>
                  <Td className="text-xs text-grey-muted">{c.quality}</Td>
                  <Td center={false} className="text-xs text-grey-muted">{c.notes}</Td>
                </tr>
              ))}
            </DataTable>

            {/* Printify deep comparison */}
            <div className="mt-4 bg-orange-500/10 rounded-lg p-4 text-xs space-y-2">
              <p className="font-semibold text-orange-400 text-sm">Printify vs Massive - la vraie comparaison</p>
              <p className="text-grey-muted">Printify semble comparable (~20-25$ artiste) mais il y a des differences majeures:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div className="space-y-1">
                  <p className="font-semibold text-orange-400">Printify - l'artiste doit:</p>
                  <p className="text-grey-muted">- Creer et payer sa boutique (Etsy ~6.5% frais, Shopify ~39$/mois)</p>
                  <p className="text-grey-muted">- Gerer le service client et les retours</p>
                  <p className="text-grey-muted">- Payer pour la publicite / marketing</p>
                  <p className="text-grey-muted">- Accepter une qualite variable (dropshipping, 4-8 encres, papier 170-200 gsm)</p>
                  <p className="text-grey-muted">- Cout base en USD (~10-12$ USD = ~14-16$ CAD)</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-accent">Massive - l'artiste doit:</p>
                  <p className="text-grey-muted">- Fournir son fichier. C'est tout.</p>
                  <p className="text-grey-muted">- Zero frais de boutique (page artiste gratuite sur massivemedias.com)</p>
                  <p className="text-grey-muted">- Zero gestion, zero service client</p>
                  <p className="text-grey-muted">- Qualite musee garantie (12 encres pigmentees, papier d'archives)</p>
                  <p className="text-grey-muted">- Impression locale a Montreal, pick-up Mile-End</p>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-green-500/10 rounded-lg p-3 text-xs text-green-400 space-y-1">
              <p className="font-semibold">En resume:</p>
              <p>- Society6 / Redbubble: l'artiste fait 2-4$ par vente. C'est presque rien.</p>
              <p>- Printify / Printful: ~20-25$ mais l'artiste gere tout (boutique, marketing, service client, livraison)</p>
              <p>- INPRNT: ~18$ et bonne qualite, mais sur invitation seulement</p>
              <p>- <strong>Massive: 40-50$ de profit net, zero gestion, qualite musee superieure a tout POD</strong></p>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB TOUS LES TARIFS (interne Massive) */}
      {/* ========================================= */}
      {activeTab === 'services' && (
        <div>
          {/* Prints */}
          <SectionCard icon={Printer} iconColor="text-blue-400" title="Prints Fine Art" subtitle="Service impression (client apporte son fichier)">
            <DataTable headers={[{ label: 'Format' }, { label: 'Studio (4 pig.)' }, { label: 'Musee (12 pig.)' }, { label: 'Frame' }, { label: 'Notes' }]}>
              {SERVICE_PRICES.map((p, i) => (
                <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                  <Td center={false} className="text-heading font-medium">{p.format}</Td>
                  <Td>{p.studio !== null ? `${p.studio}$` : <span className="text-grey-muted">N/A</span>}</Td>
                  <Td>{p.museum}$</Td>
                  <Td>{p.frame !== null ? `+${p.frame}$` : <span className="text-grey-muted">N/A</span>}</Td>
                  <Td center={false} className="text-xs text-grey-muted">{p.notes}</Td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>

          {/* Stickers */}
          <SectionCard icon={Sticker} iconColor="text-pink-400" title="Stickers" subtitle="Design inclus dans le prix" delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">Standard (Matte / Glossy / Die-cut)</h4>
                <DataTable headers={[{ label: 'Quantite' }, { label: 'Prix' }, { label: '$/unite' }]}>
                  {STICKER_STANDARD.map((s, i) => (
                    <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{s.qty}</Td>
                      <Td className="text-heading font-semibold">{s.price}$</Td>
                      <Td className="text-accent font-semibold">{s.unit.toFixed(2)}$</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">FX (Holographique / Broken Glass / Stars)</h4>
                <DataTable headers={[{ label: 'Quantite' }, { label: 'Prix' }, { label: '$/unite' }]}>
                  {STICKER_HOLO.map((s, i) => (
                    <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{s.qty}</Td>
                      <Td className="text-heading font-semibold">{s.price}$</Td>
                      <Td className="text-accent font-semibold">{s.unit.toFixed(2)}$</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          </SectionCard>

          {/* Flyers */}
          <SectionCard icon={FileText} iconColor="text-orange-400" title="Flyers / Cartes postales" subtitle="Format A6 (4x6&quot;)" delay={0.1}>
            <DataTable headers={[{ label: 'Quantite' }, { label: 'Recto' }, { label: 'Recto-verso' }, { label: '$/u recto' }, { label: '$/u r-v' }]}>
              {FLYERS.map((f, i) => (
                <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                  <Td center={false} className="text-heading font-medium">{f.qty}</Td>
                  <Td className="text-heading font-semibold">{f.single}$</Td>
                  <Td className="text-heading font-semibold">{f.double}$</Td>
                  <Td className="text-accent">{(f.single / f.qty).toFixed(2)}$</Td>
                  <Td className="text-accent">{(f.double / f.qty).toFixed(2)}$</Td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>

          {/* Sublimation */}
          <SectionCard icon={Shirt} iconColor="text-cyan-400" title="Sublimation / Merch (commandes clients)" subtitle={`Design: ${SUBLIMATION_DESIGN}$ (une fois)`} delay={0.15}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b card-border">
                    <th className="text-left py-2 px-3 text-grey-muted font-medium">Produit</th>
                    <th className="text-center py-2 px-3 text-grey-muted font-medium" colSpan={4}>Prix / unite selon quantite</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBLIMATION.map((s, i) => (
                    <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{s.product}</Td>
                      {s.tiers.map((t, j) => (
                        <Td key={j} className="text-heading">
                          <span className="text-grey-muted text-xs block">{t.qty}x</span>
                          <span className="font-semibold">{t.unit}$</span>
                          {t.soumission && <span className="text-xs text-accent block">soumission</span>}
                        </Td>
                      ))}
                      {s.tiers.length < 4 && Array.from({ length: 4 - s.tiers.length }).map((_, j) => (
                        <Td key={`empty-${j}`} className="text-grey-muted">-</Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Merch Massive */}
          <SectionCard icon={Shirt} iconColor="text-purple-400" title="Merch Massive (boutique)" subtitle="Prix de vente boutique Massive" delay={0.2}>
            <DataTable headers={[{ label: 'Produit' }, { label: 'Prix' }, { label: 'Tailles' }]}>
              {MERCH_MASSIVE.map((m, i) => (
                <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                  <Td center={false} className="text-heading font-medium">{m.product}</Td>
                  <Td className="text-heading font-semibold">{m.price}$</Td>
                  <Td className="text-grey-muted text-xs">S - 3XL</Td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>

          {/* Design */}
          <SectionCard icon={Palette} iconColor="text-yellow-400" title="Design graphique" delay={0.25}>
            <DataTable headers={[{ label: 'Service' }, { label: 'Prix' }, { label: 'Delai' }]}>
              {DESIGN_SERVICES.map((d, i) => (
                <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                  <Td center={false} className="text-heading font-medium">{d.service}</Td>
                  <Td className="text-heading font-semibold">{d.price}</Td>
                  <Td className="text-grey-muted">{d.delai}</Td>
                </tr>
              ))}
            </DataTable>
            <p className="text-xs text-grey-muted mt-2">* Design stickers inclus dans le prix des stickers</p>
          </SectionCard>

          {/* Web */}
          <SectionCard icon={Globe} iconColor="text-emerald-400" title="Developpement Web" subtitle={`Taux horaire: ${WEB_HOURLY}`} delay={0.3}>
            <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">Sites complets (design + code + SEO)</h4>
            <div className="mb-6">
              <DataTable headers={[{ label: 'Service' }, { label: 'Prix' }, { label: 'Delai' }]}>
                {WEB_SERVICES.map((w, i) => (
                  <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                    <Td center={false} className="text-heading font-medium">{w.service}</Td>
                    <Td className="text-heading font-semibold">{w.price}</Td>
                    <Td className="text-grey-muted">{w.delai}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>

            <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">Webdesign seulement (livrable Figma)</h4>
            <DataTable headers={[{ label: 'Service' }, { label: 'Prix' }]}>
              {WEB_DESIGN_ONLY.map((w, i) => (
                <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                  <Td center={false} className="text-heading font-medium">{w.service}</Td>
                  <Td className="text-heading font-semibold">{w.price}</Td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

export default AdminTarifs;
