import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Copy, Check, Download, Printer, Users, BarChart3, Sticker, Shirt, Palette, Globe, FileText } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

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

// --- Concurrence ---
const COMPETITORS = [
  { name: 'Society6', commission: '10-20%', example18x24: '~11-22$', notes: '10% standard, 20% si abonnement payant' },
  { name: 'Redbubble', commission: '10-30%', example18x24: '~11-33$', notes: 'Variable selon le produit' },
  { name: 'Fine Art America', commission: 'Markup libre', example18x24: 'Variable', notes: 'Prix de base fixe + ton markup' },
  { name: 'INPRNT', commission: '50%', example18x24: '~55$', notes: 'Meilleur taux, mais prix client plus eleves' },
  { name: 'Printify', commission: 'Markup libre', example18x24: 'Variable', notes: 'Cout production ~11-16$, tu fixes ton prix' },
  { name: 'Massive Medias', commission: '~30-40%', example18x24: '30-50$', notes: 'Impression locale fine art, qualite superieure' },
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

  // --- PDF artiste ---
  const handleDownloadPDF = () => {
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
  @media print { body { padding: 20px; } @page { margin: 15mm; } }
</style></head><body>
  <h1>Grille Tarifaire Artistes</h1>
  <p style="color:#6b21a8;font-weight:600;">Massive Medias - Impression Fine Art & Stickers - Montreal</p>
  <p style="font-size:10px;color:#999;">Tous les prix sont avant taxes (TPS + TVQ en sus)</p>

  <h2>Prints Fine Art - Prix de vente</h2>

  <h3><span class="badge">STUDIO</span> 4 encres pigmentees</h3>
  <table>
    <tr><th>Format</th><th>Sans frame</th><th>Avec frame (+30$)</th></tr>
    ${ARTIST_PRICES.filter(p => p.studio).map(p => `<tr>
      <td>${p.format}</td><td>${p.studio}$</td>
      <td>${p.frame ? (p.studio + p.frame) + '$' : 'N/A'}</td>
    </tr>`).join('')}
  </table>

  <h3><span class="badge">MUSEE</span> 12 encres pigmentees (Canon Pro 2600)</h3>
  <table>
    <tr><th>Format</th><th>Sans frame</th><th>Avec frame (+30$)</th></tr>
    ${ARTIST_PRICES.map(p => `<tr>
      <td>${p.format}</td><td>${p.museum}$</td>
      <td>${p.frame ? (p.museum + p.frame) + '$' : 'N/A'}</td>
    </tr>`).join('')}
  </table>
  <p class="note">* A2 (18x24") = Canon Pro 2600 uniquement (12 encres), pas de frame disponible</p>

  <h2>Packs Stickers (design inclus)</h2>
  <table>
    <tr><th>Quantite</th><th>Standard (Matte/Glossy)</th><th>$/unite</th><th>FX (Holo/Broken Glass)</th><th>$/unite</th></tr>
    ${STICKER_STANDARD.map((s, i) => {
      const h = STICKER_HOLO[i];
      return `<tr><td>${s.qty}</td><td>${s.price}$</td><td>${s.unit.toFixed(2)}$</td><td>${h.price}$</td><td>${h.unit.toFixed(2)}$</td></tr>`;
    }).join('')}
  </table>

  <h2>Ta commission par vente (Prints)</h2>
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
  <p>Commission identique avec ou sans frame (le frame va a Massive).</p>
  <p>Ta commission = profit net. Tu fournis ton fichier, Massive fait le reste.</p>

  <h2>Comparaison avec la concurrence</h2>
  <table>
    <tr><th>Plateforme</th><th>Commission artiste</th><th>Sur un print ~110$</th><th>Notes</th></tr>
    ${COMPETITORS.map(c => `<tr${c.name === 'Massive Medias' ? ' style="background:#f0e6ff;font-weight:600;"' : ''}>
      <td>${c.name}</td><td>${c.commission}</td><td>${c.example18x24}</td><td style="font-size:10px">${c.notes}</td>
    </tr>`).join('')}
  </table>

  <div style="background:#f0fdf4;padding:12px;border-radius:6px;margin-top:16px;font-size:11px;color:#166534;">
    <strong>Avantages Massive vs plateformes POD:</strong><br/>
    - Impression locale fine art (pas de dropshipping generique)<br/>
    - Papier archival + encres pigmentees<br/>
    - Calibration couleurs + soft proofing inclus<br/>
    - Commission artiste superieure a Society6, Redbubble<br/>
    - Pick-up gratuit Mile-End ou livraison locale
  </div>

  <div class="footer">
    Massive Medias - massivemedias.com - Montreal<br/>
    Grille tarifaire generee le ${new Date().toLocaleDateString('fr-CA')}
  </div>
</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 400);
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
          <SectionCard icon={BarChart3} iconColor="text-yellow-400" title="Comparaison concurrence" subtitle="Commission artiste sur les plateformes print-on-demand vs Massive">
            <DataTable headers={[{ label: 'Plateforme' }, { label: 'Commission artiste' }, { label: 'Sur un print ~110$' }, { label: 'Notes' }]}>
              {COMPETITORS.map((c, i) => (
                <tr key={i} className={`border-b card-border transition-colors ${c.name === 'Massive Medias' ? 'bg-accent/10' : 'hover:bg-accent/5'}`}>
                  <Td center={false} className={c.name === 'Massive Medias' ? 'text-accent font-bold' : 'text-heading font-medium'}>{c.name}</Td>
                  <Td className={c.name === 'Massive Medias' ? 'text-accent font-bold' : 'text-heading'}>{c.commission}</Td>
                  <Td className={c.name === 'Massive Medias' ? 'text-accent font-bold' : 'text-heading'}>{c.example18x24}</Td>
                  <Td center={false} className="text-xs text-grey-muted">{c.notes}</Td>
                </tr>
              ))}
            </DataTable>

            <div className="mt-4 bg-green-500/10 rounded-lg p-3 text-xs text-green-400 space-y-1">
              <p className="font-semibold">Avantages Massive vs plateformes POD:</p>
              <p>- Impression locale fine art (pas de dropshipping generique)</p>
              <p>- Papier archival + encres pigmentees (pas du jet d'encre standard)</p>
              <p>- Calibration couleurs + soft proofing inclus</p>
              <p>- Commission artiste superieure a Society6, Redbubble</p>
              <p>- Pick-up gratuit Mile-End ou livraison locale</p>
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
