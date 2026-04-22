import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MASSIVE_LOGO_B64 } from './massiveLogo';

// Logo Massive Medias (horizontal 1440x263, ratio ~5.48:1)
const LOGO_B64 = MASSIVE_LOGO_B64;
const LOGO_RATIO = 1440 / 263;

// Info entreprise
const COMPANY = {
  name: 'Massive Medias',
  owner: 'Michael Sanchez',
  neq: '2269057891',
  tps: '732457635RT0001',
  tvq: '4012577678TQ0001',
  address: '5338 rue Marquette',
  city: 'Montreal (QC) H2J 3Z3',
  phone: '+1 514 653 1423',
  email: 'massivemedias@gmail.com',
  website: 'massivemedias.com',
};

// Informations de paiement (affichees sur les factures manuelles B2B)
const PAYMENT_INFO = {
  interacEmail: 'massivemedias@gmail.com',
  bankName: 'RBC Banque Royale',
  accountHolder: 'Michael Gilbert Sanchez',
  transit: '03981',
  institution: '003',
  account: '5129614',
};

// Convertir cents en dollars formate
const dollars = (cents) => {
  const val = (cents || 0) / 100;
  return val.toFixed(2) + ' $';
};

// Générer un numéro de facture unique basee sur la date et l'ID
const generateInvoiceNumber = (order) => {
  const date = new Date(order.createdAt);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const shortId = (order.documentId || '').slice(-6).toUpperCase();
  return `MM-${y}${m}${d}-${shortId}`;
};

/**
 * Genere et telecharge une facture/recu PDF pour une commande
 * @param {Object} order - L'objet commande complet depuis l'API
 * @param {'invoice'|'receipt'} type - Type de document
 */
export function generateInvoicePDF(order, type = 'invoice', options = {}) {
  // FIX-BILLING (avril 2026) : les infos Massive Medias et les coordonnees
  // bancaires peuvent etre overridees via options.settings (fetchees depuis
  // /billing-settings backend). Si absentes, les defauts hardcoded sont
  // utilises pour ne pas casser la retro-compat.
  const S = options?.settings || {};
  const company = {
    name:     S.companyName    || COMPANY.name,
    owner:    S.companyOwner   || COMPANY.owner,
    neq:      S.neq            || COMPANY.neq,
    tps:      S.tps            || COMPANY.tps,
    tvq:      S.tvq            || COMPANY.tvq,
    address:  S.companyAddress || COMPANY.address,
    city:     S.companyCity    || COMPANY.city,
    phone:    S.companyPhone   || COMPANY.phone,
    email:    S.companyEmail   || COMPANY.email,
    website:  S.companyWebsite || COMPANY.website,
  };
  const paymentInfo = {
    interacEmail: S.interacEmail    || PAYMENT_INFO.interacEmail,
    bankName:     S.bankName        || PAYMENT_INFO.bankName,
    accountHolder: S.companyOwner   || PAYMENT_INFO.accountHolder,
    transit:      S.bankTransit     || PAYMENT_INFO.transit,
    institution:  S.bankInstitution || PAYMENT_INFO.institution,
    account:      S.bankAccount     || PAYMENT_INFO.account,
    notes:        S.paymentNotes    || '',
  };

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const isReceipt = type === 'receipt';
  const title = isReceipt ? 'RECU' : 'FACTURE';
  const invoiceNum = generateInvoiceNumber(order);

  // Couleurs
  const darkText = [30, 30, 30];
  const greyText = [120, 120, 120];
  const accentColor = [139, 92, 246]; // purple-500
  const lightBg = [248, 248, 252];

  // ==================== HEADER ====================
  // Logo Massive Medias horizontal (contient le wordmark)
  const logoW = 50;
  const logoH = logoW / LOGO_RATIO;
  try {
    doc.addImage(LOGO_B64, 'PNG', margin, y, logoW, logoH);
  } catch {
    // silently skip logo if it fails
  }

  // Company details (sous le logo)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...greyText);
  doc.text(company.address, margin, y + logoH + 4);
  doc.text(company.city, margin, y + logoH + 8);
  doc.text(`${company.phone || ''}  |  ${company.email}`, margin, y + logoH + 12);

  // Document type - right aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...accentColor);
  doc.text(title, pageWidth - margin, y + 8, { align: 'right' });

  // Invoice number and date
  doc.setFontSize(9);
  doc.setTextColor(...greyText);
  doc.setFont('helvetica', 'normal');
  doc.text(`No: ${invoiceNum}`, pageWidth - margin, y + 14, { align: 'right' });
  const orderDate = new Date(order.createdAt).toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  doc.text(`Date: ${orderDate}`, pageWidth - margin, y + 19, { align: 'right' });

  y += 26;

  // Separator line
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ==================== CLIENT + DETAILS ====================
  const colWidth = contentWidth / 2;

  // Client info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentColor);
  doc.text('FACTURER A', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkText);
  doc.text(order.customerName || '-', margin, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...greyText);
  let clientY = y + 10;
  doc.text(order.customerEmail || '', margin, clientY);
  clientY += 4;
  if (order.customerPhone) {
    doc.text(order.customerPhone, margin, clientY);
    clientY += 4;
  }

  // Shipping address
  const addr = order.shippingAddress;
  if (addr) {
    clientY += 2;
    doc.text(addr.address || '', margin, clientY);
    clientY += 4;
    doc.text(`${addr.city || ''}, ${addr.province || ''} ${addr.postalCode || ''}`, margin, clientY);
  }

  // Order details (right column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentColor);
  doc.text('DETAILS', margin + colWidth, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...greyText);
  const details = [
    ['Paiement', isReceipt ? 'Confirmé' : 'Stripe'],
    ['Devise', (order.currency || 'cad').toUpperCase()],
    ['NEQ', company.neq],
    ['TPS', company.tps],
    ['TVQ', company.tvq],
  ];
  if (order.stripePaymentIntentId) {
    const ref = order.stripePaymentIntentId;
    details.unshift(['Ref.', ref.length > 20 ? ref.slice(0, 20) + '...' : ref]);
  }

  let detailY = y + 5;
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...greyText);
    doc.text(label + ':', margin + colWidth, detailY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(value, margin + colWidth + 22, detailY);
    detailY += 5;
  });

  y = Math.max(clientY, detailY) + 8;

  // ==================== TABLE DES ARTICLES ====================
  const items = Array.isArray(order.items) ? order.items : [];

  const tableData = items.map((item) => {
    // FIX-PDF (avril 2026): lire le nom sur tous les champs possibles selon la source.
    // Commandes e-commerce : productName
    // Commandes manuelles : description (saisi par l'admin dans CreateManualOrderModal)
    // Items CMS legacy : name / title
    const name = item.productName || item.description || item.name || item.title || 'Produit';
    const details = [item.size, item.finish, item.shape].filter(Boolean).join(' / ');
    const fullName = details ? `${name}\n${details}` : name;
    const qty = Number(item.quantity) || 1;

    // Resolution prix unitaire : unitPrice direct > lineTotal/qty > totalPrice/qty
    let unit = Number(item.unitPrice);
    if (!Number.isFinite(unit) || unit <= 0) {
      const lineT = Number(item.lineTotal) || Number(item.totalPrice) || 0;
      unit = qty > 0 ? lineT / qty : lineT;
    }
    const unitPrice = Number.isFinite(unit) && unit > 0 ? `${unit.toFixed(2)} $` : '-';

    // Resolution total ligne : lineTotal > totalPrice > qty * unitPrice (calcul)
    let lineTotal = Number(item.lineTotal);
    if (!Number.isFinite(lineTotal) || lineTotal <= 0) lineTotal = Number(item.totalPrice);
    if (!Number.isFinite(lineTotal) || lineTotal <= 0) lineTotal = qty * (Number(item.unitPrice) || 0);
    const total = Number.isFinite(lineTotal) && lineTotal > 0 ? `${lineTotal.toFixed(2)} $` : '-';

    return [fullName, qty, unitPrice, total];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Article', 'Qte', 'Prix unit.', 'Total']],
    body: tableData,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4,
      textColor: darkText,
      lineColor: [230, 230, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: lightBg,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Style les details de produit en gris
      if (data.section === 'body' && data.column.index === 0) {
        const text = data.cell.text;
        if (text.length > 1) {
          data.cell.styles.fontSize = 8;
        }
      }
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ==================== TOTAUX ====================
  const totalsX = pageWidth - margin - 70;
  const valuesX = pageWidth - margin;

  const drawTotalLine = (label, value, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(...(bold ? darkText : greyText));
    doc.text(label, totalsX, y);
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(value, valuesX, y, { align: 'right' });
    y += bold ? 7 : 5;
  };

  drawTotalLine('Sous-total', dollars(order.subtotal));

  if (order.shipping > 0) {
    drawTotalLine('Livraison', dollars(order.shipping));
  } else {
    drawTotalLine('Livraison', 'Gratuit');
  }

  if (order.tps > 0) {
    drawTotalLine(`TPS (5%) - ${company.tps}`, dollars(order.tps));
  }

  if (order.tvq > 0) {
    drawTotalLine(`TVQ (9.975%) - ${company.tvq}`, dollars(order.tvq));
  }

  // Separator
  y += 1;
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.3);
  doc.line(totalsX, y, valuesX, y);
  y += 5;

  // Total final
  drawTotalLine('TOTAL', dollars(order.total), true);

  // ==================== LIEN DE PAIEMENT STRIPE (si facture non payee) ====================
  // FIX-PDF : injection du lien de paiement Stripe directement dans le PDF pour que
  // le client puisse cliquer et payer en ligne. Visible uniquement si :
  //   - Ce n'est pas un recu (recu = deja paye)
  //   - La commande a un stripePaymentLink ou paymentUrl
  //   - Le statut n'est pas "paid" ou "delivered"
  const paymentUrl = order.stripePaymentLink
    || order.paymentUrl
    || order.invoice?.stripePaymentLink
    || options?.paymentUrl
    || '';
  const isPaid = ['paid', 'processing', 'ready', 'shipped', 'delivered'].includes(order.status);
  if (!isReceipt && paymentUrl && !isPaid) {
    y += 10;
    // Encadre accent
    const boxPadding = 5;
    const boxH = 24;
    doc.setFillColor(...accentColor);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, boxH, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Payer cette facture en ligne', margin + boxPadding, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Paiement securise via Stripe (carte de credit, Apple Pay, Google Pay).',
      margin + boxPadding, y + 15);

    // URL cliquable (jsPDF supporte doc.link pour rendre une zone cliquable)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const urlDisplay = paymentUrl.length > 90 ? paymentUrl.slice(0, 87) + '...' : paymentUrl;
    doc.textWithLink(urlDisplay, margin + boxPadding, y + 21, { url: paymentUrl });

    y += boxH + 4;
  }

  // ==================== MODALITES DE PAIEMENT (B2B / factures non payees) ====================
  // Affichee sur toutes les factures NON-payees pour donner au client les options
  // de paiement alternatives au Stripe Payment Link (qui est affiche juste au-dessus).
  // Inclut : Interac e-Transfer + depot direct si coordonnees bancaires configurees
  // dans /billing-settings.
  if (!isReceipt && !isPaid) {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    doc.text('MODALITES DE PAIEMENT', margin, y);
    y += 4;
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 45, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkText);

    // Interac
    if (paymentInfo.interacEmail) {
      doc.setFont('helvetica', 'bold');
      doc.text('Virement Interac : ', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(paymentInfo.interacEmail, margin + 32, y);
      y += 5;
    }

    // Depot direct : tous les champs banque doivent etre renseignes pour etre affiche
    if (paymentInfo.bankName && paymentInfo.transit && paymentInfo.institution && paymentInfo.account) {
      doc.setFont('helvetica', 'bold');
      doc.text('Depot direct : ', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${paymentInfo.bankName}  |  Transit: ${paymentInfo.transit}  |  Inst: ${paymentInfo.institution}  |  Compte: ${paymentInfo.account}`,
        margin + 28, y,
      );
      y += 5;
      if (paymentInfo.accountHolder) {
        doc.setFontSize(7.5);
        doc.setTextColor(...greyText);
        doc.text(`Titulaire : ${paymentInfo.accountHolder}`, margin + 28, y);
        y += 5;
      }
    }

    // Notes libres admin (delai de paiement, penalites, etc.)
    if (paymentInfo.notes) {
      doc.setFontSize(8);
      doc.setTextColor(...greyText);
      const noteLines = doc.splitTextToSize(paymentInfo.notes, pageWidth - 2 * margin);
      for (const line of noteLines) {
        doc.text(line, margin, y);
        y += 4;
      }
    }

    y += 2;
  }

  // ==================== FOOTER ====================
  y += 10;

  // Merci message
  if (isReceipt) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...accentColor);
    doc.text('Merci pour votre achat!', pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...greyText);
    doc.text('Ce document sert de preuve de paiement.', pageWidth / 2, y, { align: 'center' });
  }

  // Bottom footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(230, 230, 240);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...greyText);
  doc.text(
    `${company.name}  |  ${company.address}, ${company.city}  |  ${company.email}  |  ${company.website}`,
    pageWidth / 2, footerY - 3,
    { align: 'center' }
  );
  doc.text(
    `NEQ: ${company.neq}  |  TPS: ${company.tps}  |  TVQ: ${company.tvq}`,
    pageWidth / 2, footerY + 1,
    { align: 'center' }
  );

  // ==================== TELECHARGER OU RETOURNER ====================
  const fileName = `${title.toLowerCase()}-${invoiceNum}.pdf`;

  // Si appele avec { returnBase64: true } on retourne la donnee pour envoi courriel
  // au lieu de declencher le download navigateur. Signature retrocompatible : les
  // callers existants (bouton Download) continuent de recevoir juste le fileName.
  if (options?.returnBase64) {
    const base64 = doc.output('datauristring').split(',')[1];
    return { fileName, base64 };
  }

  doc.save(fileName);
  return fileName;
}

export default generateInvoicePDF;

// Labels bilingues pour les factures manuelles
const INVOICE_LABELS = {
  fr: {
    title: 'FACTURE',
    no: 'No',
    date: 'Date',
    from: 'DE',
    billTo: 'FACTURER \u00c0',
    neq: 'NEQ',
    descr: 'Description',
    qty: 'Qte',
    unitPrice: 'Prix/u',
    total: 'Total',
    billing: 'Facturation',
    type: 'Type',
    subtotal: 'Sous-total',
    discount: 'Rabais',
    gst: 'TPS (5%)',
    qst: 'TVQ (9,975%)',
    grandTotal: 'TOTAL',
    paymentTitle: 'MODALITES DE PAIEMENT',
    interacTitle: 'Virement Interac',
    interacHint: 'Aucune question de securite requise',
    eftTitle: 'Virement bancaire (EFT)',
    eftLine: (t, i, a) => `Transit: ${t}   Institution: ${i}   Compte: ${a}`,
    paymentTerm: 'Paiement du dans les 30 jours suivant la reception de la facture',
    thanks: 'Merci pour votre confiance!',
    filePrefix: 'facture',
    locale: 'fr-CA',
  },
  en: {
    title: 'INVOICE',
    no: 'No',
    date: 'Date',
    from: 'FROM',
    billTo: 'BILL TO',
    neq: 'QBN',
    descr: 'Description',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    total: 'Total',
    billing: 'Billing',
    type: 'Type',
    subtotal: 'Subtotal',
    discount: 'Discount',
    gst: 'GST (5%)',
    qst: 'QST (9.975%)',
    grandTotal: 'TOTAL',
    paymentTitle: 'PAYMENT METHODS',
    interacTitle: 'Interac e-Transfer',
    interacHint: 'No security question required',
    eftTitle: 'Wire Transfer (EFT)',
    eftLine: (t, i, a) => `Transit: ${t}   Institution: ${i}   Account: ${a}`,
    paymentTerm: 'Payment due within 30 days of invoice reception',
    thanks: 'Thank you for your trust!',
    filePrefix: 'invoice',
    locale: 'en-CA',
  },
};

// ==================== FACTURE MANUELLE (admin) ====================
export function generateManualInvoicePDF(invoice, lang = 'fr') {
  const L = INVOICE_LABELS[lang] || INVOICE_LABELS.fr;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;

  // Logo Massive Medias horizontal
  const logoW = 55;
  const logoH = logoW / LOGO_RATIO;
  try { doc.addImage(LOGO_B64, 'PNG', margin, 12, logoW, logoH); } catch {}

  // Titre FACTURE / INVOICE
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(61, 0, 121);
  doc.text(L.title, pageWidth - margin, 22, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`${L.no}: ${invoice.invoiceNumber}`, pageWidth - margin, 30, { align: 'right' });
  const dateStr = new Date(invoice.date).toLocaleDateString(L.locale, { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`${L.date}: ${dateStr}`, pageWidth - margin, 36, { align: 'right' });

  // Ligne separatrice
  doc.setDrawColor(220);
  doc.line(margin, 42, pageWidth - margin, 42);

  // DE / FROM
  let y = 50;
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(L.from, margin, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text(COMPANY.name, margin, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120);
  let deY = y + 11;
  if (invoice.includeOwnerName) {
    doc.text(COMPANY.owner, margin, deY);
    deY += 5;
  }
  doc.text(COMPANY.address, margin, deY);
  doc.text(COMPANY.city, margin, deY + 5);
  doc.text(COMPANY.phone, margin, deY + 10);
  doc.text(COMPANY.email, margin, deY + 15);
  doc.text(`${L.neq} ${COMPANY.neq}`, margin, deY + 20);

  // FACTURER A / BILL TO
  const col2 = pageWidth / 2 + 10;
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(L.billTo, col2, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text(invoice.customerName, col2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120);
  if (invoice.customerAddress) doc.text(invoice.customerAddress, col2, y + 11);
  if (invoice.customerPhone) doc.text(invoice.customerPhone, col2, y + 16);
  if (invoice.customerEmail) doc.text(invoice.customerEmail, col2, y + 21);

  // Table items - espace genereux entre le bloc DE et la table
  const deLastLineY = deY + 20; // NEQ/QBN est la derniere ligne
  const tableY = deLastLineY + 16; // 16mm de marge entre le bloc et l'en-tete violet
  const items = invoice.items || [];
  const tableBody = items.map(it => {
    // Build rich description: main line + web meta + bullet details
    const lines = [it.description + (it.papier ? ` - ${it.papier}` : '') + (it.format ? ` (${it.format})` : '')];
    if (it.category === 'web') {
      const h = Number(it.hours) || 0;
      const r = Number(it.hourlyRate) || 0;
      if (h > 0) lines.push(`${L.billing}: ${h.toFixed(2)}h x ${r.toFixed(2)}$/h`);
      if (it.projectType) lines.push(`${L.type}: ${it.projectType}`);
      if (it.projectUrl) lines.push(`URL: ${it.projectUrl}`);
      if (it.technologies) lines.push(`Tech: ${it.technologies}`);
    }
    const detailLines = (it.details || '').split('\n').map(s => s.trim()).filter(Boolean);
    detailLines.forEach(line => lines.push(`  \u2022 ${line}`));
    return [
      lines.join('\n'),
      `${it.qty || 1}`,
      `${Number(it.prix || 0).toFixed(2)} $`,
      `${(Number(it.prix || 0) * (it.qty || 1)).toFixed(2)} $`,
    ];
  });

  autoTable(doc, {
    startY: tableY,
    head: [[L.descr, L.qty, L.unitPrice, L.total]],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [61, 0, 121], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
    },
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 8;
  const totalsX = pageWidth - margin - 55;

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(L.subtotal, totalsX, finalY);
  doc.setTextColor(30);
  doc.text(`${Number(invoice.subtotal).toFixed(2)} $`, pageWidth - margin, finalY, { align: 'right' });

  let ty = finalY;
  if (invoice.discountPercent > 0) {
    ty += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 125, 50);
    doc.text(`${L.discount} (${invoice.discountPercent}%)`, totalsX, ty);
    doc.text(`-${Number(invoice.discountAmount).toFixed(2)} $`, pageWidth - margin, ty, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }

  ty += 6;
  doc.setTextColor(120);
  doc.text(L.gst, totalsX, ty);
  doc.setTextColor(30);
  doc.text(`${Number(invoice.tps).toFixed(2)} $`, pageWidth - margin, ty, { align: 'right' });

  ty += 6;
  doc.setTextColor(120);
  doc.text(L.qst, totalsX, ty);
  doc.setTextColor(30);
  doc.text(`${Number(invoice.tvq).toFixed(2)} $`, pageWidth - margin, ty, { align: 'right' });

  ty += 3;
  doc.setDrawColor(61, 0, 121);
  doc.setLineWidth(0.5);
  doc.line(totalsX, ty, pageWidth - margin, ty);

  ty += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(61, 0, 121);
  doc.text(L.grandTotal, totalsX, ty);
  doc.text(`${Number(invoice.total).toFixed(2)} $`, pageWidth - margin, ty, { align: 'right' });

  // ==================== MODALITES DE PAIEMENT / PAYMENT METHODS ====================
  let payY = ty + 18;
  // Boite grise avec info de paiement
  const boxH = 32;
  doc.setFillColor(248, 248, 252);
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, payY, pageWidth - margin * 2, boxH, 2, 2, 'FD');

  // Titre
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(61, 0, 121);
  doc.text(L.paymentTitle, margin + 4, payY + 6);

  // Colonne 1 - Interac
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'bold');
  doc.text(L.interacTitle, margin + 4, payY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(PAYMENT_INFO.interacEmail, margin + 4, payY + 16);
  doc.setTextColor(140);
  doc.setFontSize(6);
  doc.text(L.interacHint, margin + 4, payY + 20);

  // Colonne 2 - Virement bancaire
  const col2X = pageWidth / 2;
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'bold');
  doc.text(L.eftTitle, col2X, payY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(60);
  doc.text(`${PAYMENT_INFO.bankName} - ${PAYMENT_INFO.accountHolder}`, col2X, payY + 16);
  doc.text(
    L.eftLine(PAYMENT_INFO.transit, PAYMENT_INFO.institution, PAYMENT_INFO.account),
    col2X, payY + 20
  );

  // Terme de paiement (centre en bas de la boite)
  doc.setFontSize(6);
  doc.setTextColor(140);
  doc.setFont('helvetica', 'italic');
  doc.text(L.paymentTerm, pageWidth / 2, payY + 27, { align: 'center' });

  // Footer
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160);
  doc.text(
    `${COMPANY.name} - ${COMPANY.address}, ${COMPANY.city} - ${COMPANY.email} - ${L.neq} ${COMPANY.neq}`,
    pageWidth / 2, 282, { align: 'center' }
  );
  doc.text(L.thanks, pageWidth / 2, 286, { align: 'center' });

  doc.save(`${L.filePrefix}-${invoice.invoiceNumber}.pdf`);
}
