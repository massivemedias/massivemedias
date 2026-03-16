import { jsPDF } from 'jspdf';

/**
 * Genere et telecharge le contrat artiste en PDF
 * @param {'fr'|'en'|'es'} lang - Langue du contrat
 * @param {string} contractHtml - Le HTML du contrat
 */
export function generateContractPDF(lang, contractHtml) {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const labels = {
      fr: { filename: 'Contrat-Partenariat-Artiste-MassiveMedias.pdf', footer: 'Massive Medias - Contrat de partenariat artiste v3' },
      en: { filename: 'Artist-Partnership-Agreement-MassiveMedias.pdf', footer: 'Massive Medias - Artist Partnership Agreement v3' },
      es: { filename: 'Contrato-Asociacion-Artistica-MassiveMedias.pdf', footer: 'Massive Medias - Contrato de asociacion artistica v3' },
    };
    const l = labels[lang] || labels.fr;

    // Colors
    const purple = [61, 0, 121];
    const dark = [40, 40, 40];
    const grey = [140, 140, 140];

    let pageNum = 1;

    const addFooter = () => {
      doc.setFontSize(7.5);
      doc.setTextColor(...grey);
      doc.text(l.footer, margin, pageHeight - 8);
      doc.text('Page ' + pageNum, pageWidth - margin, pageHeight - 8, { align: 'right' });
      doc.setTextColor(...dark);
    };

    const checkPage = (needed) => {
      if (y + (needed || 10) > pageHeight - 16) {
        addFooter();
        doc.addPage();
        pageNum++;
        y = margin;
      }
    };

    const writeText = (text, x, fontSize, fontStyle, color, maxW) => {
      doc.setFontSize(fontSize || 9);
      doc.setFont('helvetica', fontStyle || 'normal');
      if (color) doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxW || contentWidth);
      for (const line of lines) {
        checkPage(5);
        doc.text(line, x || margin, y);
        y += fontSize ? fontSize * 0.42 : 3.8;
      }
    };

    // --- Header with logo area ---
    doc.setFillColor(61, 0, 121);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MASSIVE MEDIAS', margin, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 200, 0);
    doc.text('massivemedias.com  |  massivemedias@gmail.com  |  NEQ: 2269057891', margin, 19);
    y = 36;

    // --- Parse HTML to structured blocks ---
    // Simple regex-based parser - much more robust than DOMParser
    const html = contractHtml;

    // Extract blocks in order
    const blockRegex = /<(h[34]|p|ul|ol|em)([^>]*)>([\s\S]*?)<\/\1>/gi;
    const liRegex = /<li>([\s\S]*?)<\/li>/gi;
    const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    const hasTag = (s, tag) => new RegExp('<' + tag + '(\\s|>)', 'i').test(s);

    let match;
    while ((match = blockRegex.exec(html)) !== null) {
      const tag = match[1].toLowerCase();
      const attrs = match[2] || '';
      const inner = match[3];

      try {
        if (tag === 'h3') {
          checkPage(16);
          y += 4;
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...dark);
          doc.text(stripTags(inner), pageWidth / 2, y, { align: 'center' });
          y += 7;
          continue;
        }

        if (tag === 'h4') {
          checkPage(14);
          y += 6;
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...purple);
          const text = stripTags(inner);
          doc.text(text, margin, y);
          y += 2;
          doc.setDrawColor(...purple);
          doc.setLineWidth(0.3);
          const tw = Math.min(doc.getTextWidth(text), contentWidth);
          doc.line(margin, y, margin + tw, y);
          y += 5;
          doc.setTextColor(...dark);
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          continue;
        }

        if (tag === 'p') {
          checkPage(6);
          const text = stripTags(inner);
          if (!text) continue;

          const isCenter = attrs.includes('text-align:center');
          const isItalic = attrs.includes('font-style:italic') || tag === 'em';
          const isBoldParagraph = hasTag(inner, 'strong') && stripTags(inner.replace(/<strong>[\s\S]*?<\/strong>/gi, '').trim()).length < 5;

          if (isItalic) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            const lines = doc.splitTextToSize(text, contentWidth - 4);
            for (const line of lines) {
              checkPage(4.5);
              doc.text(line, margin + 2, y);
              y += 3.8;
            }
            y += 1.5;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...dark);
          } else if (isBoldParagraph) {
            y += 2;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...dark);
            const lines = doc.splitTextToSize(text, contentWidth);
            for (const line of lines) {
              checkPage(4.5);
              doc.text(line, margin, y);
              y += 3.8;
            }
            y += 1;
            doc.setFont('helvetica', 'normal');
          } else if (isCenter) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...dark);
            const lines = doc.splitTextToSize(text, contentWidth);
            for (const line of lines) {
              checkPage(4.5);
              doc.text(line, pageWidth / 2, y, { align: 'center' });
              y += 3.8;
            }
            y += 1;
          } else {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...dark);
            const lines = doc.splitTextToSize(text, contentWidth);
            for (const line of lines) {
              checkPage(4.5);
              doc.text(line, margin, y);
              y += 3.8;
            }
            y += 1;
          }
          continue;
        }

        if (tag === 'em') {
          checkPage(6);
          const text = stripTags(inner);
          if (!text) continue;
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          const lines = doc.splitTextToSize(text, contentWidth - 4);
          for (const line of lines) {
            checkPage(4.5);
            doc.text(line, margin + 2, y);
            y += 3.8;
          }
          y += 1.5;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...dark);
          continue;
        }

        if (tag === 'ul' || tag === 'ol') {
          checkPage(6);
          let liMatch;
          let idx = 0;
          const localLiRegex = /<li>([\s\S]*?)<\/li>/gi;
          while ((liMatch = localLiRegex.exec(inner)) !== null) {
            idx++;
            checkPage(5);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...dark);
            const bullet = tag === 'ol' ? (idx + '.') : '-';
            const text = stripTags(liMatch[1]);
            const bw = doc.getTextWidth(bullet + '  ');
            const lines = doc.splitTextToSize(text, contentWidth - bw - 6);
            doc.text(bullet, margin + 4, y);
            for (let i = 0; i < lines.length; i++) {
              if (i > 0) checkPage(4.5);
              doc.text(lines[i], margin + 4 + bw, y);
              y += 3.8;
            }
            y += 0.5;
          }
          y += 2;
          continue;
        }
      } catch (nodeErr) {
        console.warn('PDF node error:', nodeErr);
        // Skip this block and continue
      }
    }

    // --- Signature zone ---
    checkPage(45);
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    const sigTitle = lang === 'en' ? 'SIGNATURES' : lang === 'es' ? 'FIRMAS' : 'SIGNATURES';
    doc.text(sigTitle, pageWidth / 2, y, { align: 'center' });
    y += 10;

    const colW = contentWidth / 2 - 4;
    doc.setDrawColor(...dark);

    // Left column - Massive Medias
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Massive Medias', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(lang === 'en' ? 'Name:' : lang === 'es' ? 'Nombre:' : 'Nom :', margin, y);
    doc.line(margin + 18, y + 1, margin + colW, y + 1);
    y += 8;
    doc.text('Date :', margin, y);
    doc.line(margin + 18, y + 1, margin + colW, y + 1);
    y += 8;
    doc.text('Signature :', margin, y);
    doc.line(margin + 22, y + 1, margin + colW, y + 1);

    // Right column - Artist
    let yR = y - 22;
    const rX = margin + colW + 8;
    doc.setFont('helvetica', 'bold');
    doc.text(lang === 'en' ? 'The Artist' : lang === 'es' ? 'El Artista' : "L'Artiste", rX, yR);
    doc.setFont('helvetica', 'normal');
    yR += 6;
    doc.text(lang === 'en' ? 'Name:' : lang === 'es' ? 'Nombre:' : 'Nom :', rX, yR);
    doc.line(rX + 18, yR + 1, rX + colW, yR + 1);
    yR += 8;
    doc.text('Date :', rX, yR);
    doc.line(rX + 18, yR + 1, rX + colW, yR + 1);
    yR += 8;
    doc.text('Signature :', rX, yR);
    doc.line(rX + 22, yR + 1, rX + colW, yR + 1);

    // Footer on last page
    addFooter();

    // Save
    doc.save(l.filename);
  } catch (err) {
    console.error('Contract PDF generation error:', err);
    alert('Erreur PDF: ' + (err.message || 'Erreur inconnue'));
  }
}
