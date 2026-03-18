import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Copy, Check, Download, Printer, Users, BarChart3, Sticker, Shirt, Palette, Globe, FileText, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// =============================================
// DONNEES TARIFS
// =============================================

const SERVICE_PRICES = [
  { format: 'A4 (8.5x11")', studio: 20, museum: 35, frame: 30, notes: { fr: '', en: '', es: '' } },
  { format: 'A3 (11x17")', studio: 25, museum: 65, frame: 30, notes: { fr: '', en: '', es: '' } },
  { format: 'A3+ (13x19")', studio: 35, museum: 95, frame: 30, notes: { fr: '', en: '', es: '' } },
  { format: 'A2 (18x24")', studio: null, museum: 110, frame: null, notes: { fr: '12 encres pigmentées seulement. Pas de frame.', en: '12 pigmented inks only. No frame.', es: '12 tintas pigmentadas solamente. Sin marco.' } },
];

const ARTIST_PRICES = [
  { format: 'A4 (8.5x11")', studio: 35, museum: 75, frame: 30 },
  { format: 'A3 (11x17")', studio: 50, museum: 120, frame: 30 },
  { format: 'A3+ (13x19")', studio: 65, museum: 160, frame: 30 },
  { format: 'A2 (18x24")', studio: null, museum: 190, frame: null },
];

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

const FLYERS = [
  { qty: 50, single: 40, double: 52 },
  { qty: 100, single: 65, double: 85 },
  { qty: 150, single: 90, double: 117 },
  { qty: 250, single: 130, double: 169 },
  { qty: 500, single: 225, double: 293 },
];

const SUBLIMATION = [
  { product: 'T-shirt', tiers: [{ qty: 1, unit: 30 }, { qty: 5, unit: 27 }, { qty: 10, unit: 25 }, { qty: '25+', unit: 23, soumission: true }] },
  { product: 'Crewneck', tiers: [{ qty: 1, unit: 40 }, { qty: 5, unit: 37 }, { qty: 10, unit: 35 }, { qty: '25+', unit: 33, soumission: true }] },
  { product: 'Hoodie', tiers: [{ qty: 1, unit: 50 }, { qty: 5, unit: 45 }, { qty: 10, unit: 42 }, { qty: '25+', unit: 40, soumission: true }] },
  { product: 'Tote Bag', tiers: [{ qty: 1, unit: 15 }, { qty: 10, unit: 13 }, { qty: 25, unit: 12 }, { qty: 50, unit: 10 }] },
  { product: { fr: 'Sac banane', en: 'Fanny pack', es: 'Rinonera' }, tiers: [{ qty: 1, unit: 80 }, { qty: 5, unit: 75 }, { qty: 10, unit: 70 }] },
  { product: 'Mug', tiers: [{ qty: 1, unit: 15 }, { qty: 5, unit: 13 }, { qty: 10, unit: 12 }, { qty: 25, unit: 10 }] },
  { product: 'Tumbler', tiers: [{ qty: 1, unit: 25 }, { qty: 5, unit: 22 }, { qty: 10, unit: 20 }, { qty: 25, unit: 18 }] },
];
const SUBLIMATION_DESIGN = 125;

const MERCH_MASSIVE = [
  { product: 'T-shirt Massive', price: 22 },
  { product: 'Crewneck Massive', price: 30 },
  { product: 'Hoodie Massive', price: 39 },
];

const WEB_HOURLY = '85$/h';

// =============================================
// COMPOSANTS
// =============================================

function SectionCard({ icon: Icon, iconColor, title, subtitle, children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="rounded-xl bg-glass p-5 mb-6">
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
          <tr className="border-b border-white/5">
            {headers.map((h, i) => (
              <th key={i} className={`py-2 px-1.5 sm:px-3 font-medium text-xs sm:text-sm ${h.className || 'text-grey-muted'} ${i === 0 ? 'text-left' : 'text-center'}`}>
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
  return <td className={`py-2.5 px-1.5 sm:px-3 text-xs sm:text-sm ${center ? 'text-center' : ''} ${className}`}>{children}</td>;
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
    lines.push(tx({ fr: 'Tous les prix sont avant taxes (TPS + TVQ en sus)', en: 'All prices before taxes (GST + QST extra)', es: 'Todos los precios antes de impuestos (TPS + TVQ extra)' }));
    lines.push('');
    lines.push('IMPRESSION FINE ART');
    lines.push('-'.repeat(55));
    lines.push('');
    lines.push(tx({ fr: 'SÉRIE STUDIO (4 encres pigmentées)', en: 'STUDIO SERIES (4 pigmented inks)', es: 'SERIE ESTUDIO (4 tintas pigmentadas)' }));
    lines.push(`Format           | ${tx({ fr: 'Sans frame', en: 'No frame', es: 'Sin marco' })} | ${tx({ fr: 'Avec frame', en: 'With frame', es: 'Con marco' })}`);
    ARTIST_PRICES.forEach(p => {
      if (p.studio) {
        lines.push(`${p.format.padEnd(17)}| ${(p.studio + '$').padEnd(11)}| ${p.frame ? (p.studio + p.frame) + '$' : 'N/A'}`);
      }
    });
    lines.push('');
    lines.push(tx({ fr: 'SÉRIE MUSÉE (12 encres pigmentées)', en: 'MUSEUM SERIES (12 pigmented inks)', es: 'SERIE MUSEO (12 tintas pigmentadas)' }));
    lines.push(`Format           | ${tx({ fr: 'Sans frame', en: 'No frame', es: 'Sin marco' })} | ${tx({ fr: 'Avec frame', en: 'With frame', es: 'Con marco' })}`);
    ARTIST_PRICES.forEach(p => {
      lines.push(`${p.format.padEnd(17)}| ${(p.museum + '$').padEnd(11)}| ${p.frame ? (p.museum + p.frame) + '$' : 'N/A'}`);
    });
    lines.push('');
    lines.push(tx({ fr: '* A2 (18x24") = 12 encres pigmentées uniquement, pas de frame', en: '* A2 (18x24") = 12 pigmented inks only, no frame', es: '* A2 (18x24") = 12 tintas pigmentadas solamente, sin marco' }));
    lines.push(tx({ fr: '* Frame = cadre noir ou blanc (+30$)', en: '* Frame = black or white frame (+30$)', es: '* Marco = marco negro o blanco (+30$)' }));
    lines.push('');
    lines.push(tx({ fr: 'PACKS STICKERS (design inclus)', en: 'STICKER PACKS (design included)', es: 'PACKS STICKERS (diseno incluido)' }));
    lines.push('-'.repeat(55));
    lines.push(`${tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' })} | Standard (Matte/Glossy) | FX (Holo/Broken Glass)`);
    STICKER_STANDARD.forEach((s, i) => {
      const h = STICKER_HOLO[i];
      lines.push(`${(s.qty + ' stickers').padEnd(13)}| ${(s.price + '$ (' + s.unit.toFixed(2) + '$/u)').padEnd(24)}| ${h.price}$ (${h.unit.toFixed(2)}$/u)`);
    });
    lines.push('');
    lines.push(tx({ fr: 'TA COMMISSION PAR VENTE (PRINTS)', en: 'YOUR COMMISSION PER SALE (PRINTS)', es: 'TU COMISION POR VENTA (PRINTS)' }));
    lines.push('-'.repeat(55));
    lines.push(`Format           | Studio      | ${tx({ fr: 'Musee', en: 'Museum', es: 'Museo' })}`);
    ARTIST_PRICES.forEach((p, i) => {
      const sp = SERVICE_PRICES[i];
      const studioProfit = p.studio && sp.studio ? p.studio - sp.studio : null;
      const museumProfit = p.museum - sp.museum;
      lines.push(`${p.format.padEnd(17)}| ${(studioProfit !== null ? studioProfit + '$' : 'N/A').padEnd(12)}| ${museumProfit}$`);
    });
    lines.push('');
    lines.push(tx({ fr: 'Commission identique avec ou sans frame (le frame va a Massive).', en: 'Same commission with or without frame (frame goes to Massive).', es: 'Comision identica con o sin marco (el marco va a Massive).' }));
    lines.push(tx({ fr: 'Ta commission = profit net. Tu fournis ton fichier, on fait le reste.', en: 'Your commission = net profit. You provide your file, we do the rest.', es: 'Tu comision = ganancia neta. Tu proporcionas tu archivo, nosotros hacemos el resto.' }));
    lines.push('');
    lines.push('--- Massive Medias - massivemedias.com ---');

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // --- PDF artiste (generation directe jsPDF + autotable, sans html2canvas) ---
  const [pdfLoading, setPdfLoading] = useState(false);
  const handleDownloadPDF = () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const pageW = 215.9;
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = 20;

      // Couleurs
      const purple = [130, 0, 210];
      const accent = [255, 82, 160];
      const dark = [26, 26, 46];
      const green = [74, 222, 128];
      const grey = [156, 163, 175];
      const white = [255, 255, 255];

      // --- Header ---
      doc.setFillColor(...dark);
      doc.rect(0, 0, pageW, 40, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('MASSIVE MEDIAS', margin, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...accent);
      doc.text(tx({ fr: 'Grille tarifaire artistes', en: 'Artist pricing grid', es: 'Tabla de precios artistas' }), margin, 26);
      doc.setTextColor(...grey);
      doc.setFontSize(8);
      doc.text(tx({ fr: 'Tous les prix avant taxes (TPS + TVQ en sus)', en: 'All prices before taxes (GST + QST extra)', es: 'Precios antes de impuestos' }), margin, 32);
      doc.text('massivemedias.com', pageW - margin, 32, { align: 'right' });
      y = 48;

      // --- Exemple concret ---
      doc.setFillColor(245, 240, 255);
      doc.roundedRect(margin, y, contentW, 22, 3, 3, 'F');
      doc.setTextColor(...purple);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(tx({ fr: 'Exemple:', en: 'Example:', es: 'Ejemplo:' }), margin + 4, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(tx({
        fr: 'Client achète print musée + frame = 105$. Massive 35$ (impression) + 30$ (frame) = 65$. Artiste = 40$ profit net.',
        en: 'Client buys museum print + frame = 105$. Massive 35$ (print) + 30$ (frame) = 65$. Artist = 40$ net profit.',
        es: 'Cliente compra print museo + marco = 105$. Massive 35$ (impresion) + 30$ (marco) = 65$. Artista = 40$ ganancia neta.',
      }), margin + 4, y + 13, { maxWidth: contentW - 8 });
      y += 28;

      // Helper: section title
      const sectionTitle = (text) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...purple);
        doc.text(text, margin, y);
        y += 2;
        doc.setDrawColor(...accent);
        doc.setLineWidth(0.5);
        doc.line(margin, y, margin + contentW, y);
        y += 6;
      };

      // Helper: autoTable wrapper
      const addTable = (head, body, opts = {}) => {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [head],
          body,
          theme: 'grid',
          headStyles: { fillColor: purple, textColor: white, fontSize: 8, fontStyle: 'bold', halign: 'center' },
          bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
          alternateRowStyles: { fillColor: [248, 245, 255] },
          styles: { cellPadding: 2.5, lineColor: [200, 200, 220], lineWidth: 0.2 },
          ...opts,
        });
        y = doc.lastAutoTable.finalY + 8;
      };

      // --- Serie Studio (4 encres) ---
      sectionTitle(tx({ fr: 'Série Studio - 4 encres pigmentées', en: 'Studio Series - 4 pigmented inks', es: 'Serie Estudio - 4 tintas pigmentadas' }));
      addTable(
        ['Format', tx({ fr: 'Sans frame', en: 'No frame', es: 'Sin marco' }), tx({ fr: 'Avec frame', en: 'With frame', es: 'Con marco' }), 'Massive', tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' })],
        ARTIST_PRICES.filter(p => p.studio).map(p => {
          const sp = SERVICE_PRICES.find(s => s.format === p.format);
          return [p.format, `${p.studio}$`, p.frame ? `${p.studio + p.frame}$` : 'N/A', `${sp?.studio || 0}$`, `${p.studio - (sp?.studio || 0)}$`];
        }),
        { columnStyles: { 4: { textColor: purple, fontStyle: 'bold' } } }
      );

      // --- Serie Musee (12 encres) ---
      sectionTitle(tx({ fr: 'Série Musée - 12 encres pigmentées', en: 'Museum Series - 12 pigmented inks', es: 'Serie Museo - 12 tintas pigmentadas' }));
      addTable(
        ['Format', tx({ fr: 'Sans frame', en: 'No frame', es: 'Sin marco' }), tx({ fr: 'Avec frame', en: 'With frame', es: 'Con marco' }), 'Massive', tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' })],
        ARTIST_PRICES.map((p, i) => {
          const sp = SERVICE_PRICES[i];
          return [p.format, `${p.museum}$`, p.frame ? `${p.museum + p.frame}$` : 'N/A', `${sp.museum}$`, `${p.museum - sp.museum}$`];
        }),
        { columnStyles: { 4: { textColor: purple, fontStyle: 'bold' } } }
      );

      // Notes
      doc.setFontSize(7);
      doc.setTextColor(...grey);
      doc.text([
        tx({ fr: '* A2 (18x24") = 12 encres pigmentées uniquement, pas de frame disponible', en: '* A2 (18x24") = 12 pigmented inks only, no frame available', es: '* A2 = solo 12 tintas, sin marco' }),
        tx({ fr: '* Frame = cadre noir ou blanc (+30$)', en: '* Frame = black or white (+30$)', es: '* Marco = negro o blanco (+30$)' }),
        tx({ fr: '* Commission artiste = profit net, identique avec ou sans frame', en: '* Artist commission = net profit, same with or without frame', es: '* Comision = ganancia neta, igual con o sin marco' }),
      ], margin, y);
      y += 14;

      // --- Stickers ---
      if (y > 220) { doc.addPage(); y = 20; }
      sectionTitle(tx({ fr: 'Packs stickers artiste (design inclus)', en: 'Artist sticker packs (design included)', es: 'Packs stickers artista (diseno incluido)' }));
      addTable(
        [tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' }), 'Standard', '$/unit', 'FX (Holo)', '$/unit'],
        STICKER_STANDARD.map((s, i) => {
          const h = STICKER_HOLO[i];
          return [`${s.qty}`, `${s.price}$`, `${s.unit.toFixed(2)}$`, `${h.price}$`, `${h.unit.toFixed(2)}$`];
        })
      );

      // --- Commission recap ---
      if (y > 220) { doc.addPage(); y = 20; }
      sectionTitle(tx({ fr: 'Ta commission par vente (prints)', en: 'Your commission per sale (prints)', es: 'Tu comision por venta (prints)' }));
      addTable(
        ['Format', 'Studio', tx({ fr: 'Musee', en: 'Museum', es: 'Museo' })],
        ARTIST_PRICES.map((p, i) => {
          const sp = SERVICE_PRICES[i];
          const studioProfit = p.studio && sp.studio ? p.studio - sp.studio : null;
          return [p.format, studioProfit !== null ? `${studioProfit}$` : 'N/A', `${p.museum - sp.museum}$`];
        }),
        { columnStyles: { 1: { textColor: purple, fontStyle: 'bold' }, 2: { textColor: purple, fontStyle: 'bold' } } }
      );

      // --- Concurrence ---
      if (y > 180) { doc.addPage(); y = 20; }
      sectionTitle(tx({ fr: 'Comparaison concurrence (2025-2026)', en: 'Competition comparison (2025-2026)', es: 'Comparacion competencia (2025-2026)' }));

      const competitorRows = [
        ['Society6', '~4$', tx({ fr: 'Impression a la demande', en: 'Print on demand', es: 'Impresion bajo demanda' }), tx({ fr: '5-10% marge. Pas de controle des prix.', en: '5-10% margin. No price control.', es: '5-10% margen. Sin control de precios.' })],
        ['Redbubble', '~2-3$', tx({ fr: 'Impression a la demande', en: 'Print on demand', es: 'Impresion bajo demanda' }), tx({ fr: 'Frais 50% sur markup.', en: '50% markup fee.', es: 'Tarifa 50% sobre margen.' })],
        ['Printify', '~20-25$', tx({ fr: 'Variable (dropship)', en: 'Variable (dropship)', es: 'Variable (dropship)' }), tx({ fr: 'Tu geres tout (boutique, marketing, livraison)', en: 'You manage everything (store, marketing, shipping)', es: 'Gestionas todo (tienda, marketing, envio)' })],
        ['INPRNT', '~18$', tx({ fr: 'Giclee 8 encres', en: 'Giclee 8 inks', es: 'Giclee 8 tintas' }), tx({ fr: 'Sur invitation seulement', en: 'Invite only', es: 'Solo invitacion' })],
        ['Massive Medias', '40-50$', tx({ fr: '12 encres musée', en: '12 inks museum', es: '12 tintas museo' }), tx({ fr: 'Zéro gestion. Qualité supérieure.', en: 'Zero management. Superior quality.', es: 'Cero gestion. Calidad superior.' })],
      ];

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [[tx({ fr: 'Plateforme', en: 'Platform', es: 'Plataforma' }), tx({ fr: 'Artiste garde', en: 'Artist keeps', es: 'Artista conserva' }), tx({ fr: 'Qualité', en: 'Quality', es: 'Calidad' }), 'Notes']],
        body: competitorRows,
        theme: 'grid',
        headStyles: { fillColor: purple, textColor: white, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [248, 245, 255] },
        styles: { cellPadding: 2.5, lineColor: [200, 200, 220], lineWidth: 0.2 },
        didParseCell: (data) => {
          // Highlight Massive row
          if (data.section === 'body' && data.row.index === competitorRows.length - 1) {
            data.cell.styles.fillColor = [240, 230, 255];
            data.cell.styles.textColor = purple;
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      y = doc.lastAutoTable.finalY + 10;

      // --- Footer ---
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFillColor(...dark);
      doc.roundedRect(margin, y, contentW, 18, 3, 3, 'F');
      doc.setTextColor(...accent);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(tx({
        fr: "L'artiste et Massive font le meme profit reel, mais l'artiste n'a rien a faire.",
        en: 'The artist and Massive make the same real profit, but the artist has nothing to do.',
        es: 'El artista y Massive ganan lo mismo, pero el artista no hace nada.',
      }), margin + 4, y + 7, { maxWidth: contentW - 8 });
      doc.setTextColor(...grey);
      doc.setFontSize(7);
      doc.text('massivemedias.com - Montreal, QC', margin + 4, y + 14);

      doc.save('Massive-Medias-Grille-Tarifaire-Artistes.pdf');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(tx({ fr: 'Erreur lors de la generation du PDF.', en: 'Error generating PDF.', es: 'Error al generar el PDF.' }));
    } finally {
      setPdfLoading(false);
    }
  };

  // Labels traduits
  const L = {
    title: tx({ fr: 'Grille tarifaire', en: 'Pricing Grid', es: 'Tabla de precios' }),
    subtitle: tx({ fr: 'Tous les prix avant taxes (TPS + TVQ en sus)', en: 'All prices before taxes (GST + QST extra)', es: 'Todos los precios antes de impuestos (TPS + TVQ extra)' }),
    copyBtn: tx({ fr: 'Copier pour artiste', en: 'Copy for artist', es: 'Copiar para artista' }),
    copied: tx({ fr: 'Copie!', en: 'Copied!', es: 'Copiado!' }),
    pdfBtn: tx({ fr: 'PDF Artiste', en: 'Artist PDF', es: 'PDF Artista' }),
    tabArtists: tx({ fr: 'Artistes', en: 'Artists', es: 'Artistas' }),
    tabAll: tx({ fr: 'Tous les tarifs', en: 'All pricing', es: 'Todos los precios' }),
    format: 'Format',
    noFrame: tx({ fr: 'Sans frame', en: 'No frame', es: 'Sin marco' }),
    withFrame: tx({ fr: 'Avec frame', en: 'With frame', es: 'Con marco' }),
    frame: tx({ fr: 'Frame', en: 'Frame', es: 'Marco' }),
    qty: tx({ fr: 'Quantite', en: 'Quantity', es: 'Cantidad' }),
    price: tx({ fr: 'Prix', en: 'Price', es: 'Precio' }),
    unit: '$/unit',
    notes: 'Notes',
    product: tx({ fr: 'Produit', en: 'Product', es: 'Producto' }),
    service: 'Service',
    delay: tx({ fr: 'Délai', en: 'Timeline', es: 'Plazo' }),
    sizes: tx({ fr: 'Tailles', en: 'Sizes', es: 'Tallas' }),
    front: tx({ fr: 'Recto', en: 'Front', es: 'Anverso' }),
    frontBack: tx({ fr: 'Recto-verso', en: 'Front & back', es: 'Anverso-reverso' }),
    perUnitFront: tx({ fr: '$/u recto', en: '$/u front', es: '$/u anverso' }),
    perUnitFB: tx({ fr: '$/u r-v', en: '$/u f&b', es: '$/u a-r' }),
    pricePerQty: tx({ fr: 'Prix / unite selon quantite', en: 'Price / unit by quantity', es: 'Precio / unidad por cantidad' }),
    quote: tx({ fr: 'soumission', en: 'quote', es: 'cotizacion' }),
    hourly: tx({ fr: 'Taux horaire', en: 'Hourly rate', es: 'Tarifa por hora' }),
  };

  // --- Donnees design/web traduites ---
  const DESIGN_SERVICES = [
    { service: tx({ fr: 'Création logo', en: 'Logo creation', es: 'Creacion de logo' }), price: '300$ - 600$', delai: tx({ fr: '5-10 jours', en: '5-10 days', es: '5-10 dias' }) },
    { service: tx({ fr: 'Identité visuelle complète', en: 'Full visual identity', es: 'Identidad visual completa' }), price: '800$ - 1 500$', delai: tx({ fr: '2-3 semaines', en: '2-3 weeks', es: '2-3 semanas' }) },
    { service: tx({ fr: 'Affiche / flyer événement', en: 'Poster / event flyer', es: 'Cartel / flyer de evento' }), price: '150$ - 300$', delai: tx({ fr: '3-5 jours', en: '3-5 days', es: '3-5 dias' }) },
    { service: tx({ fr: 'Pochette album / single', en: 'Album / single artwork', es: 'Portada album / single' }), price: '200$ - 400$', delai: tx({ fr: '5-7 jours', en: '5-7 days', es: '5-7 dias' }) },
    { service: tx({ fr: "Design d'icones (set)", en: 'Icon design (set)', es: 'Diseno de iconos (set)' }), price: '200$ - 500$', delai: tx({ fr: '3-7 jours', en: '3-7 days', es: '3-7 dias' }) },
    { service: tx({ fr: 'Retouche photo (par image)', en: 'Photo retouching (per image)', es: 'Retoque de foto (por imagen)' }), price: '15$ - 50$', delai: '24-48h' },
  ];

  const WEB_SERVICES = [
    { service: 'Landing page', price: '900$', delai: tx({ fr: '1-2 semaines', en: '1-2 weeks', es: '1-2 semanas' }) },
    { service: tx({ fr: 'Site vitrine (5-10 pages)', en: 'Showcase site (5-10 pages)', es: 'Sitio vitrina (5-10 paginas)' }), price: '1 000$ - 1 500$', delai: tx({ fr: '2-4 semaines', en: '2-4 weeks', es: '2-4 semanas' }) },
    { service: tx({ fr: 'Site e-commerce', en: 'E-commerce site', es: 'Sitio e-commerce' }), price: '1 500$ - 2 500$', delai: tx({ fr: '3-6 semaines', en: '3-6 weeks', es: '3-6 semanas' }) },
    { service: tx({ fr: 'Refonte site existant', en: 'Existing site redesign', es: 'Rediseno sitio existente' }), price: tx({ fr: 'Sur soumission', en: 'On quote', es: 'Bajo cotizacion' }), delai: 'Variable' },
    { service: tx({ fr: 'Maintenance mensuelle', en: 'Monthly maintenance', es: 'Mantenimiento mensual' }), price: tx({ fr: '100$ - 200$/mois', en: '100$ - 200$/mo', es: '100$ - 200$/mes' }), delai: '-' },
  ];

  const WEB_DESIGN_ONLY = [
    { service: 'Landing page (Figma)', price: '450$' },
    { service: tx({ fr: 'Site vitrine (5-10 pages)', en: 'Showcase site (5-10 pages)', es: 'Sitio vitrina (5-10 paginas)' }), price: '900$' },
    { service: tx({ fr: 'E-commerce / multi-pages (10+)', en: 'E-commerce / multi-page (10+)', es: 'E-commerce / multi-paginas (10+)' }), price: '1 500$ - 2 000$' },
  ];

  const COMPETITORS = [
    { name: 'Society6', artistProfit: '~4$', quality: tx({ fr: 'Impression a la demande', en: 'Print on demand', es: 'Impresion bajo demanda' }), notes: tx({ fr: "5-10% depuis mars 2025. L'artiste ne controle meme plus ses prix.", en: '5-10% since March 2025. The artist no longer controls their prices.', es: '5-10% desde marzo 2025. El artista ya no controla sus precios.' }), highlight: false },
    { name: 'Redbubble', artistProfit: '~2-3$', quality: tx({ fr: 'Impression a la demande', en: 'Print on demand', es: 'Impresion bajo demanda' }), notes: tx({ fr: 'Frais plateforme 50% sur le markup depuis sept. 2025. Net ~2-3$ par vente.', en: 'Platform fee 50% on markup since Sept. 2025. Net ~2-3$ per sale.', es: 'Tarifa de plataforma 50% sobre el margen desde sept. 2025. Neto ~2-3$ por venta.' }), highlight: false },
    { name: 'Printify', artistProfit: '~20-25$', quality: tx({ fr: 'Variable (dropship)', en: 'Variable (dropship)', es: 'Variable (dropship)' }), notes: tx({ fr: 'Cout base ~10-12$ USD. MAIS: tu geres ta boutique, marketing, service client, livraison.', en: 'Base cost ~10-12$ USD. BUT: you manage your store, marketing, customer service, shipping.', es: 'Costo base ~10-12$ USD. PERO: gestionas tu tienda, marketing, servicio al cliente, envio.' }), highlight: 'printify' },
    { name: 'Printful', artistProfit: '~20$', quality: tx({ fr: 'Giclee 8 encres', en: 'Giclee 8 inks', es: 'Giclee 8 tintas' }), notes: tx({ fr: 'Cout base ~16$+ USD. Meme modele que Printify, tu geres tout.', en: 'Base cost ~16$+ USD. Same model as Printify, you manage everything.', es: 'Costo base ~16$+ USD. Mismo modelo que Printify, gestionas todo.' }), highlight: false },
    { name: 'INPRNT', artistProfit: '~18$', quality: tx({ fr: "Giclee d'archives (8 encres)", en: 'Archival giclee (8 inks)', es: 'Giclee de archivo (8 tintas)' }), notes: tx({ fr: "Meilleure qualité en impression à la demande. Sur invitation. Print ~36$, artiste garde 18$.", en: 'Best print-on-demand quality. Invite-only. Print ~36$, artist keeps 18$.', es: 'Mejor calidad en impresion bajo demanda. Solo invitacion. Print ~36$, artista queda 18$.' }), highlight: false },
    { name: 'Fine Art America', artistProfit: '~10-25$', quality: tx({ fr: "Giclee d'archives", en: 'Archival giclee', es: 'Giclee de archivo' }), notes: tx({ fr: 'Prix de base fixe + ton markup. Qualité correcte.', en: 'Fixed base price + your markup. Decent quality.', es: 'Precio base fijo + tu margen. Calidad correcta.' }), highlight: false },
    { name: 'Massive Medias', artistProfit: '40-50$', quality: tx({ fr: '12 encres pigmentées, musée', en: '12 pigmented inks, museum', es: '12 tintas pigmentadas, museo' }), notes: tx({ fr: "Impression locale fine art. Zéro gestion pour l'artiste. Qualité supérieure à toute impression à la demande.", en: 'Local fine art printing. Zero management for the artist. Quality superior to all print-on-demand.', es: 'Impresion local fine art. Cero gestion para el artista. Calidad superior a toda impresion bajo demanda.' }), highlight: 'massive' },
  ];

  // --- Tabs ---
  const tabs = [
    { id: 'artistes', label: L.tabArtists, icon: Users },
    { id: 'services', label: L.tabAll, icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-heading flex items-center gap-2">
            <DollarSign size={20} className="text-accent" />
            {L.title}
          </h2>
          <p className="text-sm text-grey-muted mt-1">{L.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? L.copied : L.copyBtn}
          </button>
          <button onClick={handleDownloadPDF} disabled={pdfLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-semibold hover:bg-purple-500/30 transition-colors disabled:opacity-50">
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {pdfLoading ? tx({ fr: 'Generation...', en: 'Generating...', es: 'Generando...' }) : L.pdfBtn}
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-accent text-white' : 'card-bg shadow-lg shadow-black/20 text-grey-muted hover:text-heading'}`}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================= */}
      {/* TAB ARTISTES */}
      {/* ========================================= */}
      {activeTab === 'artistes' && (
        <div ref={artistSheetRef}>
          {/* Exemple concret */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-glass p-5 mb-6">
            <div className="space-y-4">
              <div className="bg-purple-500/5 rounded-lg p-4">
                <p className="text-sm text-heading font-medium leading-relaxed">
                  <span className="text-accent font-bold">{tx({ fr: 'Exemple', en: 'Example', es: 'Ejemplo' })} :</span> {tx({ fr: 'Le client achete un print qualite musee avec frame. Il paie', en: 'The client buys a museum quality print with frame. They pay', es: 'El cliente compra un print calidad museo con marco. Paga' })} <span className="text-heading font-bold text-lg">105$</span> <span className="text-grey-muted">(+ {tx({ fr: 'taxes', en: 'taxes', es: 'impuestos' })})</span>. {tx({ fr: "Ou va l'argent?", en: 'Where does the money go?', es: 'A donde va el dinero?' })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-green-500/10 rounded-xl p-4 text-center bg-green-500/5">
                  <div className="text-3xl font-bold text-green-400">35$</div>
                  <div className="text-xs text-green-400 font-bold mt-1 uppercase tracking-wider">Massive - {tx({ fr: 'Impression', en: 'Printing', es: 'Impresion' })}</div>
                  <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
                    <p>- {tx({ fr: "Papier d'archives", en: 'Archival paper', es: 'Papel de archivo' })}</p>
                    <p>- {tx({ fr: '12 encres pigmentées', en: '12 pigmented inks', es: '12 tintas pigmentadas' })}</p>
                    <p>- {tx({ fr: 'Calibration couleurs', en: 'Color calibration', es: 'Calibracion de colores' })}</p>
                    <p>- Soft proofing</p>
                    <p>- {tx({ fr: "Main d'oeuvre", en: 'Labor', es: 'Mano de obra' })}</p>
                  </div>
                </div>
                <div className="bg-green-500/10 rounded-xl p-4 text-center bg-green-500/5">
                  <div className="text-3xl font-bold text-green-400">30$</div>
                  <div className="text-xs text-green-400 font-bold mt-1 uppercase tracking-wider">Massive - Frame</div>
                  <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
                    <p>- {tx({ fr: 'Cadre noir ou blanc', en: 'Black or white frame', es: 'Marco negro o blanco' })}</p>
                    <p>- {tx({ fr: 'Materiaux + assemblage', en: 'Materials + assembly', es: 'Materiales + ensamblaje' })}</p>
                  </div>
                </div>
                <div className="bg-purple-500/15 rounded-xl p-4 text-center border border-purple-500/30">
                  <div className="text-3xl font-bold text-purple-400">40$</div>
                  <div className="text-xs text-purple-400 font-bold mt-1 uppercase tracking-wider">{tx({ fr: 'Artiste - Profit net', en: 'Artist - Net profit', es: 'Artista - Ganancia neta' })}</div>
                  <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
                    <p>- {tx({ fr: 'Fournit son fichier image', en: 'Provides their image file', es: 'Proporciona su archivo de imagen' })}</p>
                    <p>- {tx({ fr: 'Zero gestion', en: 'Zero management', es: 'Cero gestion' })}</p>
                    <p>- {tx({ fr: 'Zero frais', en: 'Zero fees', es: 'Cero costos' })}</p>
                    <p>- {tx({ fr: 'Pas de boutique a gerer', en: 'No store to manage', es: 'Sin tienda que gestionar' })}</p>
                    <p>- {tx({ fr: 'Pas de livraison', en: 'No shipping', es: 'Sin envio' })}</p>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-grey-muted">
                35$ + 30$ + 40$ = <span className="text-heading font-bold">105$</span> - {tx({ fr: 'Sans frame: client paie 75$, Massive 35$, artiste 40$', en: 'No frame: client pays 75$, Massive 35$, artist 40$', es: 'Sin marco: cliente paga 75$, Massive 35$, artista 40$' })}
              </div>

              <div className="bg-accent/10 rounded-lg p-4 text-sm text-grey-muted space-y-2">
                <p className="font-semibold text-heading text-base">{tx({ fr: "Pourquoi c'est juste?", en: 'Why is it fair?', es: 'Por que es justo?' })}</p>
                <p>{tx({ fr: "L'artiste recoit", en: 'The artist receives', es: 'El artista recibe' })} <span className="text-purple-400 font-semibold">{tx({ fr: '40$ de profit net', en: '40$ net profit', es: '40$ de ganancia neta' })}</span> {tx({ fr: "pour un upload de fichier. Aucune gestion, aucun frais, aucune boutique a maintenir.", en: 'for a file upload. No management, no fees, no store to maintain.', es: 'por subir un archivo. Sin gestion, sin costos, sin tienda que mantener.' })}</p>
                <p>{tx({ fr: "Massive recoit 65$ mais doit couvrir: papier d'archives, 12 encres pigmentees, calibration, cadre, main d'oeuvre, local. Le vrai profit Massive apres couts materiaux est d'environ 30-40$.", en: 'Massive receives 65$ but must cover: archival paper, 12 pigmented inks, calibration, frame, labor, studio. The real Massive profit after material costs is about 30-40$.', es: 'Massive recibe 65$ pero debe cubrir: papel de archivo, 12 tintas pigmentadas, calibracion, marco, mano de obra, local. La ganancia real de Massive despues de costos de materiales es de aproximadamente 30-40$.' })}</p>
                <p className="font-bold text-accent text-base mt-2">{tx({ fr: "L'artiste et Massive font a peu pres le meme profit reel, mais l'artiste n'a rien a faire.", en: 'The artist and Massive make roughly the same real profit, but the artist has nothing to do.', es: 'El artista y Massive obtienen aproximadamente la misma ganancia real, pero el artista no tiene nada que hacer.' })}</p>
              </div>
            </div>
          </motion.div>

          {/* Artist prints */}
          <SectionCard icon={Users} iconColor="text-green-400"
            title={tx({ fr: 'Boutique artiste (prix client final)', en: 'Artist store (client final price)', es: 'Tienda artista (precio cliente final)' })}
            subtitle={tx({ fr: "Ce que le client de l'artiste paie + split des revenus", en: "What the artist's client pays + revenue split", es: 'Lo que el cliente del artista paga + division de ingresos' })}>
            <h4 className="text-xs font-semibold text-heading mb-2 mt-2 uppercase tracking-wider">{tx({ fr: 'Série Studio - 4 encres pigmentées', en: 'Studio Series - 4 pigmented inks', es: 'Serie Estudio - 4 tintas pigmentadas' })}</h4>
            <div className="overflow-x-auto mb-6">
              <DataTable headers={[
                { label: L.format }, { label: L.noFrame }, { label: L.withFrame },
                { label: 'Massive', className: 'text-green-400 font-semibold' },
                { label: tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' }), className: 'text-purple-400 font-semibold' },
              ]}>
                {ARTIST_PRICES.filter(p => p.studio).map((p, idx) => {
                  const sp = SERVICE_PRICES.find(s => s.format === p.format);
                  const artistCut = p.studio - (sp?.studio || 0);
                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
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

            <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">{tx({ fr: 'Série Musée - 12 encres pigmentées', en: 'Museum Series - 12 pigmented inks', es: 'Serie Museo - 12 tintas pigmentadas' })}</h4>
            <div className="overflow-x-auto mb-4">
              <DataTable headers={[
                { label: L.format }, { label: L.noFrame }, { label: L.withFrame },
                { label: 'Massive', className: 'text-green-400 font-semibold' },
                { label: tx({ fr: 'Artiste', en: 'Artist', es: 'Artista' }), className: 'text-purple-400 font-semibold' },
              ]}>
                {ARTIST_PRICES.map((p, idx) => {
                  const sp = SERVICE_PRICES[idx];
                  const artistCut = p.museum - sp.museum;
                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
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
              <p>* {tx({ fr: 'A2 (18x24") = 12 encres pigmentées uniquement, pas de frame disponible', en: 'A2 (18x24") = 12 pigmented inks only, no frame available', es: 'A2 (18x24") = 12 tintas pigmentadas solamente, sin marco disponible' })}</p>
              <p>* {tx({ fr: 'Frame = cadre noir ou blanc (+30$)', en: 'Frame = black or white frame (+30$)', es: 'Marco = marco negro o blanco (+30$)' })}</p>
              <p>* {tx({ fr: 'Commission artiste = profit net, identique avec ou sans frame (le frame va a Massive)', en: 'Artist commission = net profit, same with or without frame (frame goes to Massive)', es: 'Comision artista = ganancia neta, identica con o sin marco (el marco va a Massive)' })}</p>
            </div>
          </SectionCard>

          {/* Stickers pour artistes */}
          <SectionCard icon={Sticker} iconColor="text-pink-400"
            title={tx({ fr: 'Packs stickers artiste', en: 'Artist sticker packs', es: 'Packs stickers artista' })}
            subtitle={tx({ fr: 'Prix pour les artistes qui veulent vendre des stickers (design inclus)', en: 'Prices for artists who want to sell stickers (design included)', es: 'Precios para artistas que quieren vender stickers (diseno incluido)' })}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">Standard (Matte / Glossy / Die-cut)</h4>
                <DataTable headers={[{ label: L.qty }, { label: L.price }, { label: L.unit }]}>
                  {STICKER_STANDARD.map((s, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{s.qty}</Td>
                      <Td className="text-heading font-semibold">{s.price}$</Td>
                      <Td className="text-accent font-semibold">{s.unit.toFixed(2)}$</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">FX (Holographique / Broken Glass / Stars)</h4>
                <DataTable headers={[{ label: L.qty }, { label: L.price }, { label: L.unit }]}>
                  {STICKER_HOLO.map((s, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
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
          <SectionCard icon={BarChart3} iconColor="text-yellow-400"
            title={tx({ fr: 'Comparaison concurrence (donnees 2025-2026)', en: 'Competition comparison (2025-2026 data)', es: 'Comparacion competencia (datos 2025-2026)' })}
            subtitle={tx({ fr: "Combien l'artiste garde reellement sur chaque plateforme", en: 'How much the artist actually keeps on each platform', es: 'Cuanto el artista realmente conserva en cada plataforma' })}>
            {/* Mobile: cards */}
            <div className="sm:hidden space-y-3">
              {COMPETITORS.map((c, i) => (
                <div key={i} className={`rounded-lg p-3 ${c.highlight === 'massive' ? 'bg-accent/10' : c.highlight === 'printify' ? 'bg-orange-500/5' : 'bg-glass'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${c.highlight === 'massive' ? 'text-accent' : 'text-heading'}`}>{c.name}</span>
                    <span className={`font-bold text-lg ${c.highlight === 'massive' ? 'text-accent' : c.highlight === 'printify' ? 'text-orange-400' : 'text-heading'}`}>{c.artistProfit}</span>
                  </div>
                  <p className="text-xs text-grey-muted mb-1">{c.quality}</p>
                  <p className="text-xs text-grey-muted">{c.notes}</p>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden sm:block">
            <DataTable headers={[
              { label: tx({ fr: 'Plateforme', en: 'Platform', es: 'Plataforma' }) },
              { label: tx({ fr: 'Artiste garde', en: 'Artist keeps', es: 'Artista conserva' }) },
              { label: tx({ fr: 'Qualité', en: 'Quality', es: 'Calidad' }) },
              { label: tx({ fr: "Ce que l'artiste doit gerer", en: 'What the artist must manage', es: 'Lo que el artista debe gestionar' }) },
            ]}>
              {COMPETITORS.map((c, i) => (
                <tr key={i} className={`border-b border-white/5 transition-colors ${c.highlight === 'massive' ? 'bg-accent/10' : c.highlight === 'printify' ? 'bg-orange-500/5' : 'hover:bg-accent/5'}`}>
                  <Td center={false} className={c.highlight === 'massive' ? 'text-accent font-bold' : 'text-heading font-medium'}>{c.name}</Td>
                  <Td className={`font-bold text-base ${c.highlight === 'massive' ? 'text-accent' : c.highlight === 'printify' ? 'text-orange-400' : 'text-heading'}`}>{c.artistProfit}</Td>
                  <Td className="text-xs text-grey-muted">{c.quality}</Td>
                  <Td center={false} className="text-xs text-grey-muted">{c.notes}</Td>
                </tr>
              ))}
            </DataTable>
            </div>

            {/* Printify comparison */}
            <div className="mt-4 bg-orange-500/10 rounded-lg p-4 text-xs space-y-2">
              <p className="font-semibold text-orange-400 text-sm">{tx({ fr: 'Printify vs Massive - la vraie comparaison', en: 'Printify vs Massive - the real comparison', es: 'Printify vs Massive - la verdadera comparacion' })}</p>
              <p className="text-grey-muted">{tx({ fr: "Printify semble comparable (~20-25$ artiste) mais il y a des differences majeures:", en: 'Printify seems comparable (~20-25$ artist) but there are major differences:', es: 'Printify parece comparable (~20-25$ artista) pero hay diferencias importantes:' })}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div className="space-y-1">
                  <p className="font-semibold text-orange-400">{tx({ fr: "Printify - l'artiste doit:", en: 'Printify - the artist must:', es: 'Printify - el artista debe:' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: 'Creer et payer sa boutique (Etsy ~6.5% frais, Shopify ~39$/mois)', en: 'Create and pay for their store (Etsy ~6.5% fees, Shopify ~39$/mo)', es: 'Crear y pagar su tienda (Etsy ~6.5% tarifas, Shopify ~39$/mes)' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: 'Gerer le service client et les retours', en: 'Manage customer service and returns', es: 'Gestionar servicio al cliente y devoluciones' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: 'Payer pour la publicite / marketing', en: 'Pay for advertising / marketing', es: 'Pagar por publicidad / marketing' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: 'Accepter une qualité variable (dropshipping, 4-8 encres, papier 170-200 gsm)', en: 'Accept variable quality (dropshipping, 4-8 inks, 170-200 gsm paper)', es: 'Aceptar calidad variable (dropshipping, 4-8 tintas, papel 170-200 gsm)' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: 'Cout base en USD (~10-12$ USD = ~14-16$ CAD)', en: 'Base cost in USD (~10-12$ USD = ~14-16$ CAD)', es: 'Costo base en USD (~10-12$ USD = ~14-16$ CAD)' })}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-accent">{tx({ fr: "Massive - l'artiste doit:", en: 'Massive - the artist must:', es: 'Massive - el artista debe:' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: "Fournir son fichier. C'est tout.", en: "Provide their file. That's it.", es: 'Proporcionar su archivo. Eso es todo.' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: 'Zero frais de boutique (page artiste gratuite sur massivemedias.com)', en: 'Zero store fees (free artist page on massivemedias.com)', es: 'Cero costos de tienda (pagina de artista gratuita en massivemedias.com)' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: 'Zero gestion, zero service client', en: 'Zero management, zero customer service', es: 'Cero gestion, cero servicio al cliente' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: "Qualité musée garantie (12 encres pigmentées, papier d'archives)", en: 'Guaranteed museum quality (12 pigmented inks, archival paper)', es: 'Calidad museo garantizada (12 tintas pigmentadas, papel de archivo)' })}</p>
                  <p className="text-grey-muted">- {tx({ fr: 'Impression locale a Montreal, pick-up Mile-End', en: 'Local printing in Montreal, pick-up Mile-End', es: 'Impresion local en Montreal, recoger en Mile-End' })}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-green-500/10 rounded-lg p-3 text-xs text-green-400 space-y-1">
              <p className="font-semibold">{tx({ fr: 'En résumé:', en: 'In summary:', es: 'En resumen:' })}</p>
              <p>- {tx({ fr: "Society6 / Redbubble: l'artiste fait 2-4$ par vente. C'est presque rien.", en: 'Society6 / Redbubble: the artist makes 2-4$ per sale. Almost nothing.', es: 'Society6 / Redbubble: el artista gana 2-4$ por venta. Casi nada.' })}</p>
              <p>- {tx({ fr: "Printify / Printful: ~20-25$ mais l'artiste gere tout (boutique, marketing, service client, livraison)", en: 'Printify / Printful: ~20-25$ but the artist manages everything (store, marketing, customer service, shipping)', es: 'Printify / Printful: ~20-25$ pero el artista gestiona todo (tienda, marketing, servicio al cliente, envio)' })}</p>
              <p>- {tx({ fr: "INPRNT: ~18$ et bonne qualité, mais sur invitation seulement", en: 'INPRNT: ~18$ and good quality, but invite-only', es: 'INPRNT: ~18$ y buena calidad, pero solo por invitacion' })}</p>
              <p>- <strong>{tx({ fr: 'Massive: 40-50$ de profit net, zéro gestion, qualité musée supérieure à toute impression à la demande', en: 'Massive: 40-50$ net profit, zero management, museum quality superior to all print-on-demand', es: 'Massive: 40-50$ de ganancia neta, cero gestion, calidad museo superior a toda impresion bajo demanda' })}</strong></p>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB TOUS LES TARIFS */}
      {/* ========================================= */}
      {activeTab === 'services' && (
        <div>
          {/* Prints */}
          <SectionCard icon={Printer} iconColor="text-blue-400"
            title="Prints Fine Art"
            subtitle={tx({ fr: 'Service impression (client apporte son fichier)', en: 'Print service (client provides their file)', es: 'Servicio de impresion (cliente trae su archivo)' })}>
            <DataTable headers={[{ label: L.format }, { label: 'Studio (4 pig.)' }, { label: tx({ fr: 'Musee (12 pig.)', en: 'Museum (12 pig.)', es: 'Museo (12 pig.)' }) }, { label: L.frame }, { label: L.notes }]}>
              {SERVICE_PRICES.map((p, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
                  <Td center={false} className="text-heading font-medium">{p.format}</Td>
                  <Td>{p.studio !== null ? `${p.studio}$` : <span className="text-grey-muted">N/A</span>}</Td>
                  <Td>{p.museum}$</Td>
                  <Td>{p.frame !== null ? `+${p.frame}$` : <span className="text-grey-muted">N/A</span>}</Td>
                  <Td center={false} className="text-xs text-grey-muted">{tx(p.notes)}</Td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>

          {/* Stickers */}
          <SectionCard icon={Sticker} iconColor="text-pink-400" title="Stickers" subtitle={tx({ fr: 'Design inclus dans le prix', en: 'Design included in price', es: 'Diseno incluido en el precio' })} delay={0.05}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">Standard (Matte / Glossy / Die-cut)</h4>
                <DataTable headers={[{ label: L.qty }, { label: L.price }, { label: L.unit }]}>
                  {STICKER_STANDARD.map((s, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{s.qty}</Td>
                      <Td className="text-heading font-semibold">{s.price}$</Td>
                      <Td className="text-accent font-semibold">{s.unit.toFixed(2)}$</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">FX (Holographique / Broken Glass / Stars)</h4>
                <DataTable headers={[{ label: L.qty }, { label: L.price }, { label: L.unit }]}>
                  {STICKER_HOLO.map((s, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
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
          <SectionCard icon={FileText} iconColor="text-orange-400"
            title={tx({ fr: 'Flyers / Cartes postales', en: 'Flyers / Postcards', es: 'Flyers / Tarjetas postales' })}
            subtitle="Format A6 (4x6&quot;)" delay={0.1}>
            <DataTable headers={[{ label: L.qty }, { label: L.front }, { label: L.frontBack }, { label: L.perUnitFront }, { label: L.perUnitFB }]}>
              {FLYERS.map((f, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
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
          <SectionCard icon={Shirt} iconColor="text-cyan-400"
            title={tx({ fr: 'Sublimation / Merch (commandes clients)', en: 'Sublimation / Merch (client orders)', es: 'Sublimacion / Merch (pedidos clientes)' })}
            subtitle={`Design: ${SUBLIMATION_DESIGN}$ (${tx({ fr: 'une fois', en: 'one time', es: 'una vez' })})`} delay={0.15}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-2 px-3 text-grey-muted font-medium">{L.product}</th>
                    <th className="text-center py-2 px-3 text-grey-muted font-medium" colSpan={4}>{L.pricePerQty}</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBLIMATION.map((s, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
                      <Td center={false} className="text-heading font-medium">{typeof s.product === 'object' ? tx(s.product) : s.product}</Td>
                      {s.tiers.map((t, j) => (
                        <Td key={j} className="text-heading">
                          <span className="text-grey-muted text-xs block">{t.qty}x</span>
                          <span className="font-semibold">{t.unit}$</span>
                          {t.soumission && <span className="text-xs text-accent block">{L.quote}</span>}
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
          <SectionCard icon={Shirt} iconColor="text-purple-400"
            title={tx({ fr: 'Merch Massive (boutique)', en: 'Massive Merch (store)', es: 'Merch Massive (tienda)' })}
            subtitle={tx({ fr: 'Prix de vente boutique Massive', en: 'Massive store selling price', es: 'Precio de venta tienda Massive' })} delay={0.2}>
            <DataTable headers={[{ label: L.product }, { label: L.price }, { label: L.sizes }]}>
              {MERCH_MASSIVE.map((m, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
                  <Td center={false} className="text-heading font-medium">{m.product}</Td>
                  <Td className="text-heading font-semibold">{m.price}$</Td>
                  <Td className="text-grey-muted text-xs">S - 3XL</Td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>

          {/* Design */}
          <SectionCard icon={Palette} iconColor="text-yellow-400" title={tx({ fr: 'Design graphique', en: 'Graphic Design', es: 'Diseno grafico' })} delay={0.25}>
            <DataTable headers={[{ label: L.service }, { label: L.price }, { label: L.delay }]}>
              {DESIGN_SERVICES.map((d, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
                  <Td center={false} className="text-heading font-medium">{d.service}</Td>
                  <Td className="text-heading font-semibold">{d.price}</Td>
                  <Td className="text-grey-muted">{d.delai}</Td>
                </tr>
              ))}
            </DataTable>
            <p className="text-xs text-grey-muted mt-2">* {tx({ fr: 'Design stickers inclus dans le prix des stickers', en: 'Sticker design included in sticker price', es: 'Diseno de stickers incluido en el precio de los stickers' })}</p>
          </SectionCard>

          {/* Web */}
          <SectionCard icon={Globe} iconColor="text-emerald-400"
            title={tx({ fr: 'Developpement Web', en: 'Web Development', es: 'Desarrollo Web' })}
            subtitle={`${L.hourly}: ${WEB_HOURLY}`} delay={0.3}>
            <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">{tx({ fr: 'Sites complets (design + code + SEO)', en: 'Full sites (design + code + SEO)', es: 'Sitios completos (diseno + codigo + SEO)' })}</h4>
            <div className="mb-6">
              <DataTable headers={[{ label: L.service }, { label: L.price }, { label: L.delay }]}>
                {WEB_SERVICES.map((w, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
                    <Td center={false} className="text-heading font-medium">{w.service}</Td>
                    <Td className="text-heading font-semibold">{w.price}</Td>
                    <Td className="text-grey-muted">{w.delai}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>

            <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">{tx({ fr: 'Webdesign seulement (livrable Figma)', en: 'Webdesign only (Figma deliverable)', es: 'Webdesign solamente (entregable Figma)' })}</h4>
            <DataTable headers={[{ label: L.service }, { label: L.price }]}>
              {WEB_DESIGN_ONLY.map((w, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-accent/5 transition-colors">
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
