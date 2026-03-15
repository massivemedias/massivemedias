import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Copy, Check, Download, Printer, Users, BarChart3 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const TPS_RATE = 0.05;
const TVQ_RATE = 0.09975;

function withTax(price) {
  const tps = price * TPS_RATE;
  const tvq = price * TVQ_RATE;
  return (price + tps + tvq).toFixed(2);
}

// --- Prix service impression (client externe apporte son fichier) ---
const SERVICE_PRICES = [
  { format: 'A4 (8.5x11")', studio: 20, museum: 35, frame: 30, notes: '' },
  { format: 'A3 (11x17")', studio: 25, museum: 65, frame: 30, notes: '' },
  { format: 'A3+ (13x19")', studio: 35, museum: 95, frame: 30, notes: '' },
  { format: 'A2 (18x24")', studio: null, museum: 75, frame: null, notes: 'Canon Pro 2600 seulement (12 encres). Pas de frame.' },
];

// --- Prix boutique artiste (ce que le client final paie) ---
const ARTIST_PRICES = [
  { format: 'A4 (8.5x11")', studio: 35, museum: 75, frame: 20 },
  { format: 'A3 (11x17")', studio: 50, museum: 120, frame: 20 },
  { format: 'A3+ (13x19")', studio: 65, museum: 160, frame: 20 },
  { format: 'A2 (18x24")', studio: null, museum: 125, frame: null },
];

// --- Concurrence ---
const COMPETITORS = [
  { name: 'Society6', commission: '10-20%', example18x24: '~11-22$', notes: '10% standard, 20% si abonnement payant' },
  { name: 'Redbubble', commission: '10-30%', example18x24: '~11-33$', notes: 'Variable selon le produit' },
  { name: 'Fine Art America', commission: 'Markup libre', example18x24: 'Variable', notes: 'Prix de base fixe + ton markup' },
  { name: 'INPRNT', commission: '50%', example18x24: '~55$', notes: 'Meilleur taux, mais prix client plus eleves' },
  { name: 'Printify', commission: 'Markup libre', example18x24: 'Variable', notes: 'Cout production ~11-16$, tu fixes ton prix' },
  { name: 'Massive Medias', commission: '~30-40%', example18x24: '30-50$', notes: 'Impression locale fine art, qualite superieure' },
];

function AdminTarifs() {
  const { tx } = useLang();
  const [copied, setCopied] = useState(false);
  const artistSheetRef = useRef(null);

  const handleCopy = () => {
    const el = artistSheetRef.current;
    if (!el) return;
    // Build plain text version
    const lines = [];
    lines.push('GRILLE TARIFAIRE ARTISTES - MASSIVE MEDIAS');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push('IMPRESSION FINE ART - PRIX DE VENTE (ce que ton client paie)');
    lines.push('-'.repeat(50));
    lines.push('');
    lines.push('SERIE STUDIO (4 encres pigmentees)');
    lines.push('Format          | Prix    | + Taxes  | + Frame  | + Frame & Taxes');
    ARTIST_PRICES.forEach(p => {
      if (p.studio) {
        const f = p.format.padEnd(16);
        lines.push(`${f}| ${p.studio}$`.padEnd(26) + `| ${withTax(p.studio)}$`.padEnd(11) + (p.frame ? `| ${p.studio + p.frame}$`.padEnd(11) + `| ${withTax(p.studio + p.frame)}$` : '| N/A         | N/A'));
      }
    });
    lines.push('');
    lines.push('SERIE MUSEE (12 encres pigmentees - Canon Pro 2600)');
    lines.push('Format          | Prix    | + Taxes  | + Frame  | + Frame & Taxes');
    ARTIST_PRICES.forEach(p => {
      const f = p.format.padEnd(16);
      lines.push(`${f}| ${p.museum}$`.padEnd(26) + `| ${withTax(p.museum)}$`.padEnd(11) + (p.frame ? `| ${p.museum + p.frame}$`.padEnd(11) + `| ${withTax(p.museum + p.frame)}$` : '| N/A         | N/A'));
    });
    lines.push('');
    lines.push('* A2 (18x24") = Canon Pro 2600 uniquement (12 encres), pas de frame disponible');
    lines.push('* Frame = cadre noir ou blanc');
    lines.push('');
    lines.push('-'.repeat(50));
    lines.push('CE QUE TU GARDES (ta commission par vente)');
    lines.push('-'.repeat(50));
    lines.push('');
    lines.push('Format          | Studio      | Musee');
    ARTIST_PRICES.forEach((p, i) => {
      const sp = SERVICE_PRICES[i];
      const f = p.format.padEnd(16);
      const studioProfit = p.studio && sp.studio ? p.studio - sp.studio : null;
      const museumProfit = p.museum - sp.museum;
      lines.push(`${f}| ${studioProfit !== null ? studioProfit + '$' : 'N/A'}`.padEnd(30) + `| ${museumProfit}$`);
    });
    lines.push('');
    lines.push('Ta commission = profit net. Tu fournis ton fichier, on fait le reste.');
    lines.push('Massive gere: impression, calibration, papier, encres, expedition.');
    lines.push('');
    lines.push('--- Massive Medias - massivemedias.com ---');

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadPDF = () => {
    const el = artistSheetRef.current;
    if (!el) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Grille Tarifaire Artistes - Massive Medias</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1a1a2e; background: #fff; }
  h1 { font-size: 22px; margin-bottom: 6px; color: #6b21a8; }
  h2 { font-size: 16px; margin: 24px 0 10px; color: #6b21a8; border-bottom: 2px solid #6b21a8; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 14px 0 6px; color: #333; }
  p { font-size: 11px; color: #555; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
  th { background: #6b21a8; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e5e5; }
  tr:nth-child(even) td { background: #f8f6ff; }
  .highlight { background: #fef3c7 !important; font-weight: 700; color: #92400e; }
  .note { font-size: 10px; color: #888; font-style: italic; margin-top: 4px; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 10px; color: #999; text-align: center; }
  .badge { display: inline-block; background: #6b21a8; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <h1>Grille Tarifaire Artistes</h1>
  <p style="color:#6b21a8;font-weight:600;">Massive Medias - Impression Fine Art - Montreal</p>

  <h2>Prix de vente (ce que ton client paie)</h2>

  <h3><span class="badge">STUDIO</span> Serie Studio - 4 encres pigmentees</h3>
  <table>
    <tr><th>Format</th><th>Prix</th><th>+ Taxes</th><th>+ Frame</th><th>+ Frame & Taxes</th></tr>
    ${ARTIST_PRICES.filter(p => p.studio).map(p => `<tr>
      <td>${p.format}</td><td>${p.studio}$</td><td>${withTax(p.studio)}$</td>
      <td>${p.frame ? (p.studio + p.frame) + '$' : 'N/A'}</td><td>${p.frame ? withTax(p.studio + p.frame) + '$' : 'N/A'}</td>
    </tr>`).join('')}
  </table>

  <h3><span class="badge">MUSEE</span> Serie Musee - 12 encres pigmentees (Canon Pro 2600)</h3>
  <table>
    <tr><th>Format</th><th>Prix</th><th>+ Taxes</th><th>+ Frame</th><th>+ Frame & Taxes</th></tr>
    ${ARTIST_PRICES.map(p => `<tr>
      <td>${p.format}</td><td>${p.museum}$</td><td>${withTax(p.museum)}$</td>
      <td>${p.frame ? (p.museum + p.frame) + '$' : 'N/A'}</td><td>${p.frame ? withTax(p.museum + p.frame) + '$' : 'N/A'}</td>
    </tr>`).join('')}
  </table>

  <p class="note">* A2 (18x24") = Canon Pro 2600 uniquement (12 encres), pas de frame disponible</p>
  <p class="note">* Frame = cadre noir ou blanc</p>
  <p class="note">* Taxes = TPS 5% + TVQ 9.975%</p>

  <h2>Ta commission par vente</h2>
  <table>
    <tr><th>Format</th><th>Studio</th><th>Musee</th></tr>
    ${ARTIST_PRICES.map((p, i) => {
      const sp = SERVICE_PRICES[i];
      const studioProfit = p.studio && sp.studio ? p.studio - sp.studio : null;
      const museumProfit = p.museum - sp.museum;
      return `<tr>
        <td>${p.format}</td>
        <td class="highlight">${studioProfit !== null ? studioProfit + '$' : 'N/A'}</td>
        <td class="highlight">${museumProfit}$</td>
      </tr>`;
    }).join('')}
  </table>
  <p>Ta commission = profit net. Tu fournis ton fichier, Massive fait le reste.</p>
  <p>Massive gere: impression fine art, calibration couleurs, soft proofing, papier archive, encres pigmentees, expedition.</p>

  <h2>Comparaison avec la concurrence</h2>
  <table>
    <tr><th>Plateforme</th><th>Commission artiste</th><th>Sur un print ~110$</th><th>Notes</th></tr>
    ${COMPETITORS.map(c => `<tr${c.name === 'Massive Medias' ? ' style="background:#f0e6ff;font-weight:600;"' : ''}>
      <td>${c.name}</td><td>${c.commission}</td><td>${c.example18x24}</td><td style="font-size:10px">${c.notes}</td>
    </tr>`).join('')}
  </table>

  <div class="footer">
    Massive Medias - massivemedias.com - Impression fine art locale a Montreal<br/>
    Grille tarifaire generee le ${new Date().toLocaleDateString('fr-CA')}
  </div>
</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-heading flex items-center gap-2">
            <DollarSign size={20} className="text-accent" />
            {tx({ fr: 'Grille tarifaire', en: 'Pricing Grid', es: 'Tabla de precios' })}
          </h2>
          <p className="text-sm text-grey-muted mt-1">{tx({ fr: 'Prix service impression + boutique artiste + comparaison concurrence', en: 'Printing service + artist store + competitor comparison', es: 'Servicio de impresion + tienda artista + comparacion competencia' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-semibold hover:bg-accent/30 transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? tx({ fr: 'Copie!', en: 'Copied!', es: 'Copiado!' }) : tx({ fr: 'Copier pour artiste', en: 'Copy for artist', es: 'Copiar para artista' })}
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-semibold hover:bg-purple-500/30 transition-colors">
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      <div ref={artistSheetRef}>
        {/* ====== SECTION 1: Service impression (couts Massive) ====== */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-glass p-5 card-border mb-6">
          <h3 className="text-sm font-heading font-bold text-heading mb-1 flex items-center gap-2">
            <Printer size={16} className="text-blue-400" />
            {tx({ fr: 'Service impression (client externe)', en: 'Printing service (external client)', es: 'Servicio de impresion (cliente externo)' })}
          </h3>
          <p className="text-xs text-grey-muted mb-4">{tx({ fr: 'Prix quand quelqu\'un apporte son propre fichier', en: 'Price when someone brings their own file', es: 'Precio cuando alguien trae su propio archivo' })}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b card-border">
                  <th className="text-left py-2 px-3 text-grey-muted font-medium">Format</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">Studio (4 pig.)</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">Musee (12 pig.)</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">Frame</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">Musee + Frame + Taxes</th>
                  <th className="text-left py-2 px-3 text-grey-muted font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {SERVICE_PRICES.map((p, i) => (
                  <tr key={i} className="border-b card-border hover:bg-accent/5 transition-colors">
                    <td className="py-2.5 px-3 text-heading font-medium">{p.format}</td>
                    <td className="py-2.5 px-3 text-center text-heading">{p.studio !== null ? `${p.studio}$` : <span className="text-grey-muted">N/A</span>}</td>
                    <td className="py-2.5 px-3 text-center text-heading">{p.museum}$</td>
                    <td className="py-2.5 px-3 text-center text-heading">{p.frame !== null ? `+${p.frame}$` : <span className="text-grey-muted">N/A</span>}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-accent">{p.frame !== null ? `${withTax(p.museum + p.frame)}$` : `${withTax(p.museum)}$`}</td>
                    <td className="py-2.5 px-3 text-xs text-grey-muted">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ====== SECTION 2: Boutique artiste ====== */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl bg-glass p-5 card-border mb-6">
          <h3 className="text-sm font-heading font-bold text-heading mb-1 flex items-center gap-2">
            <Users size={16} className="text-green-400" />
            {tx({ fr: 'Boutique artiste (prix client final)', en: 'Artist store (end client price)', es: 'Tienda artista (precio cliente final)' })}
          </h3>
          <p className="text-xs text-grey-muted mb-4">{tx({ fr: 'Ce que le client de l\'artiste paie + split des revenus', en: 'What the artist\'s client pays + revenue split', es: 'Lo que paga el cliente del artista + reparto de ingresos' })}</p>

          {/* Studio */}
          <h4 className="text-xs font-semibold text-heading mb-2 mt-2 uppercase tracking-wider">Serie Studio - 4 encres pigmentees</h4>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b card-border">
                  <th className="text-left py-2 px-3 text-grey-muted font-medium">Format</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">Prix</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">+ Taxes</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">+ Frame</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">+ Frame & Taxes</th>
                  <th className="text-center py-2 px-3 text-green-400 font-semibold">Massive</th>
                  <th className="text-center py-2 px-3 text-purple-400 font-semibold">Artiste</th>
                </tr>
              </thead>
              <tbody>
                {ARTIST_PRICES.filter(p => p.studio).map((p, idx) => {
                  const sp = SERVICE_PRICES.find(s => s.format === p.format);
                  const artistCut = p.studio - (sp?.studio || 0);
                  return (
                    <tr key={idx} className="border-b card-border hover:bg-accent/5 transition-colors">
                      <td className="py-2.5 px-3 text-heading font-medium">{p.format}</td>
                      <td className="py-2.5 px-3 text-center text-heading">{p.studio}$</td>
                      <td className="py-2.5 px-3 text-center text-heading">{withTax(p.studio)}$</td>
                      <td className="py-2.5 px-3 text-center text-heading">{p.frame ? `${p.studio + p.frame}$` : 'N/A'}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-accent">{p.frame ? `${withTax(p.studio + p.frame)}$` : 'N/A'}</td>
                      <td className="py-2.5 px-3 text-center text-green-400 font-semibold">{sp?.studio || 0}$</td>
                      <td className="py-2.5 px-3 text-center text-purple-400 font-bold">{artistCut}$</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Museum */}
          <h4 className="text-xs font-semibold text-heading mb-2 uppercase tracking-wider">Serie Musee - 12 encres pigmentees (Canon Pro 2600)</h4>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b card-border">
                  <th className="text-left py-2 px-3 text-grey-muted font-medium">Format</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">Prix</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">+ Taxes</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">+ Frame</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">+ Frame & Taxes</th>
                  <th className="text-center py-2 px-3 text-green-400 font-semibold">Massive</th>
                  <th className="text-center py-2 px-3 text-purple-400 font-semibold">Artiste</th>
                </tr>
              </thead>
              <tbody>
                {ARTIST_PRICES.map((p, idx) => {
                  const sp = SERVICE_PRICES[idx];
                  const artistCut = p.museum - sp.museum;
                  return (
                    <tr key={idx} className="border-b card-border hover:bg-accent/5 transition-colors">
                      <td className="py-2.5 px-3 text-heading font-medium">{p.format}</td>
                      <td className="py-2.5 px-3 text-center text-heading">{p.museum}$</td>
                      <td className="py-2.5 px-3 text-center text-heading">{withTax(p.museum)}$</td>
                      <td className="py-2.5 px-3 text-center text-heading">{p.frame ? `${p.museum + p.frame}$` : 'N/A'}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-accent">{p.frame ? `${withTax(p.museum + p.frame)}$` : 'N/A'}</td>
                      <td className="py-2.5 px-3 text-center text-green-400 font-semibold">{sp.museum}$</td>
                      <td className="py-2.5 px-3 text-center text-purple-400 font-bold">{artistCut}$</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-accent/10 rounded-lg p-3 text-xs text-grey-muted space-y-1">
            <p>* A2 (18x24") = Canon Pro 2600 uniquement (12 encres), pas de frame disponible</p>
            <p>* Frame = cadre noir ou blanc (+20$ artiste / +30$ service)</p>
            <p>* Taxes = TPS 5% + TVQ 9.975%</p>
            <p>* Commission artiste = profit net (l'artiste fournit son fichier, Massive fait le reste)</p>
          </div>
        </motion.div>

        {/* ====== SECTION 3: Comparaison concurrence ====== */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-1 flex items-center gap-2">
            <BarChart3 size={16} className="text-yellow-400" />
            {tx({ fr: 'Comparaison concurrence', en: 'Competitor comparison', es: 'Comparacion con competencia' })}
          </h3>
          <p className="text-xs text-grey-muted mb-4">{tx({ fr: 'Commission artiste sur les plateformes print-on-demand vs Massive', en: 'Artist commission on POD platforms vs Massive', es: 'Comision artista en plataformas POD vs Massive' })}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b card-border">
                  <th className="text-left py-2 px-3 text-grey-muted font-medium">Plateforme</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">Commission artiste</th>
                  <th className="text-center py-2 px-3 text-grey-muted font-medium">Sur un print ~110$</th>
                  <th className="text-left py-2 px-3 text-grey-muted font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c, i) => (
                  <tr key={i} className={`border-b card-border transition-colors ${c.name === 'Massive Medias' ? 'bg-accent/10' : 'hover:bg-accent/5'}`}>
                    <td className={`py-2.5 px-3 font-medium ${c.name === 'Massive Medias' ? 'text-accent font-bold' : 'text-heading'}`}>{c.name}</td>
                    <td className={`py-2.5 px-3 text-center ${c.name === 'Massive Medias' ? 'text-accent font-bold' : 'text-heading'}`}>{c.commission}</td>
                    <td className={`py-2.5 px-3 text-center ${c.name === 'Massive Medias' ? 'text-accent font-bold' : 'text-heading'}`}>{c.example18x24}</td>
                    <td className="py-2.5 px-3 text-xs text-grey-muted">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-green-500/10 rounded-lg p-3 text-xs text-green-400 space-y-1">
            <p className="font-semibold">{tx({ fr: 'Avantages Massive vs plateformes POD:', en: 'Massive advantages vs POD platforms:', es: 'Ventajas de Massive vs plataformas POD:' })}</p>
            <p>- Impression locale fine art (pas de dropshipping generique)</p>
            <p>- Papier archival + encres pigmentees (pas du jet d'encre standard)</p>
            <p>- Calibration couleurs + soft proofing inclus</p>
            <p>- Commission artiste superieure a Society6, Redbubble</p>
            <p>- Pick-up gratuit Mile-End ou livraison locale</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminTarifs;
