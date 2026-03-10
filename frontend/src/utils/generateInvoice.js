import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Logo Massive Medias en base64 (favicon 80x80 PNG)
const LOGO_B64 = 'data:image/png;base64,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';

// Info entreprise
const COMPANY = {
  name: 'Massive Medias',
  owner: 'Michael Sanchez',
  neq: '2269057891',
  tps: '732457635RT0001',
  tvq: '4012577678TQ0001',
  address: '5338 rue Marquette',
  city: 'Montreal (QC) H2J 3Z3',
  email: 'hello@massivemedias.com',
  website: 'massivemedias.com',
};

// Convertir cents en dollars formate
const dollars = (cents) => {
  const val = (cents || 0) / 100;
  return val.toFixed(2) + ' $';
};

// Generer un numero de facture unique basee sur la date et l'ID
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
export function generateInvoicePDF(order, type = 'invoice') {
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
  // Logo
  try {
    doc.addImage(LOGO_B64, 'PNG', margin, y, 16, 16);
  } catch {
    // silently skip logo if it fails
  }

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...darkText);
  doc.text(COMPANY.name, margin + 20, y + 6);

  // Company details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...greyText);
  doc.text(COMPANY.address, margin + 20, y + 11);
  doc.text(`${COMPANY.city}  |  ${COMPANY.email}`, margin + 20, y + 15);

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
    ['Paiement', isReceipt ? 'Confirme' : 'Stripe'],
    ['Devise', (order.currency || 'cad').toUpperCase()],
    ['NEQ', COMPANY.neq],
    ['TPS', COMPANY.tps],
    ['TVQ', COMPANY.tvq],
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
    const name = item.productName || 'Produit';
    const details = [item.size, item.finish, item.shape].filter(Boolean).join(' / ');
    const fullName = details ? `${name}\n${details}` : name;
    const qty = item.quantity || 1;
    const unitPrice = item.unitPrice
      ? `${Number(item.unitPrice).toFixed(2)} $`
      : (item.totalPrice ? `${(Number(item.totalPrice) / qty).toFixed(2)} $` : '-');
    const total = item.totalPrice ? `${Number(item.totalPrice).toFixed(2)} $` : '-';
    return [fullName, qty, unitPrice, total];
  });

  doc.autoTable({
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
    drawTotalLine(`TPS (5%) - ${COMPANY.tps}`, dollars(order.tps));
  }

  if (order.tvq > 0) {
    drawTotalLine(`TVQ (9.975%) - ${COMPANY.tvq}`, dollars(order.tvq));
  }

  // Separator
  y += 1;
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.3);
  doc.line(totalsX, y, valuesX, y);
  y += 5;

  // Total final
  drawTotalLine('TOTAL', dollars(order.total), true);

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
    `${COMPANY.name}  |  ${COMPANY.address}, ${COMPANY.city}  |  ${COMPANY.email}  |  ${COMPANY.website}`,
    pageWidth / 2, footerY - 3,
    { align: 'center' }
  );
  doc.text(
    `NEQ: ${COMPANY.neq}  |  TPS: ${COMPANY.tps}  |  TVQ: ${COMPANY.tvq}`,
    pageWidth / 2, footerY + 1,
    { align: 'center' }
  );

  // ==================== TELECHARGER ====================
  const fileName = `${title.toLowerCase()}-${invoiceNum}.pdf`;
  doc.save(fileName);

  return fileName;
}

export default generateInvoicePDF;
