import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, Palette, Clock, CheckCircle, Download,
  FileText, Loader2, AlertCircle, ExternalLink, Package,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { getCommissions } from '../services/adminService';
import artistsData from '../data/artists';

// Prix service (cout Massive) et prix artiste (prix client)
const SERVICE_PRICES = {
  studio: { a4: 20, a3: 25, a3plus: 35 },
  museum: { a4: 35, a3: 65, a3plus: 95, a2: 75 },
};
const ARTIST_PRICES = {
  studio: { a4: 35, a3: 50, a3plus: 65 },
  museum: { a4: 75, a3: 120, a3plus: 160, a2: 125 },
};
const FRAME_PRICE = 30;

function AccountArtistDashboard() {
  const { tx, lang } = useLang();
  const { artistSlug } = useUserRole();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const artist = artistsData[artistSlug] || null;

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const { data } = await getCommissions();
        if (!cancelled) {
          // Filtrer seulement les commissions de cet artiste
          const all = data.data || data || [];
          const mine = all.filter(c =>
            c.artistSlug === artistSlug ||
            c.items?.some(item =>
              item.productName?.toLowerCase().includes(artistSlug) ||
              item.artistSlug === artistSlug
            )
          );
          setCommissions(mine);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [artistSlug]);

  // Calculs financiers
  const { totalEarned, totalPaid, balance, orderCount } = useMemo(() => {
    let totalEarned = 0;
    let totalPaid = 0;
    let orderCount = commissions.length;

    commissions.forEach(c => {
      const artistEarning = c.artistEarning || c.commission || 0;
      totalEarned += artistEarning;
      if (c.paid || c.status === 'paid') {
        totalPaid += artistEarning;
      }
    });

    return {
      totalEarned,
      totalPaid,
      balance: totalEarned - totalPaid,
      orderCount,
    };
  }, [commissions]);

  const formatMoney = (n) => `${n.toFixed(2)}$`;

  return (
    <div className="space-y-6">
      {/* Header artiste */}
      <div className="flex items-center gap-4 mb-2">
        {artist?.avatar && (
          <img src={artist.avatar} alt={artist?.name} className="w-12 h-12 rounded-full object-cover border-2 border-accent/40" />
        )}
        <div>
          <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2">
            <Palette size={18} className="text-accent" />
            {tx({ fr: 'Tableau de bord artiste', en: 'Artist Dashboard', es: 'Panel de artista' })}
          </h3>
          {artist && (
            <p className="text-grey-muted text-sm">
              {artist.name} - {artist.prints?.length || 0} {tx({ fr: 'oeuvres en ligne', en: 'artworks online', es: 'obras en linea' })}
            </p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: DollarSign,
            value: loading ? '-' : formatMoney(totalEarned),
            label: tx({ fr: 'Gains totaux', en: 'Total earnings', es: 'Ganancias totales' }),
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
          },
          {
            icon: CheckCircle,
            value: loading ? '-' : formatMoney(totalPaid),
            label: tx({ fr: 'Deja paye', en: 'Already paid', es: 'Ya pagado' }),
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
          },
          {
            icon: TrendingUp,
            value: loading ? '-' : formatMoney(balance),
            label: tx({ fr: 'Solde a recevoir', en: 'Balance due', es: 'Saldo pendiente' }),
            color: balance > 0 ? 'text-accent' : 'text-grey-muted',
            bgColor: balance > 0 ? 'bg-accent/10' : 'bg-grey-500/10',
          },
          {
            icon: Package,
            value: loading ? '-' : orderCount,
            label: tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' }),
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-purple-main/20 p-4 card-bg card-shadow text-center"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stat.bgColor} mb-2`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-xl font-bold text-heading">{stat.value}</p>
            <p className="text-xs text-grey-muted mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Balance highlight */}
      {balance > 0 && !loading && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <DollarSign size={18} className="text-accent" />
          </div>
          <div className="flex-grow">
            <p className="text-heading text-sm font-medium">
              {tx({
                fr: `Massive te doit ${formatMoney(balance)}`,
                en: `Massive owes you ${formatMoney(balance)}`,
                es: `Massive te debe ${formatMoney(balance)}`,
              })}
            </p>
            <p className="text-grey-muted text-xs">
              {tx({
                fr: 'Paiement par Interac ou en personne. Contacte-nous pour recevoir ton argent.',
                en: 'Payment via Interac or in person. Contact us to receive your money.',
                es: 'Pago por Interac o en persona. Contactanos para recibir tu dinero.',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Exemple concret */}
      <div className="rounded-2xl border border-purple-main/30 p-5 card-bg card-shadow">
        <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-main/20 mb-4">
          <p className="text-sm text-heading font-medium leading-relaxed">
            <span className="text-accent font-bold">{tx({ fr: 'Exemple :', en: 'Example:', es: 'Ejemplo:' })}</span>{' '}
            {tx({
              fr: 'Le client achete un print qualite musee avec frame. Il paie',
              en: 'The client buys a museum quality print with frame. They pay',
              es: 'El cliente compra un print calidad museo con marco. Paga',
            })}{' '}
            <span className="text-heading font-bold text-lg">105$</span>{' '}
            <span className="text-grey-muted">{tx({ fr: '(+ taxes)', en: '(+ taxes)', es: '(+ impuestos)' })}</span>.{' '}
            {tx({ fr: 'Ou va l\'argent?', en: 'Where does the money go?', es: 'A donde va el dinero?' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* Massive impression */}
          <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
            <div className="text-3xl font-bold text-green-400">35$</div>
            <div className="text-xs text-green-400 font-bold mt-1 uppercase tracking-wider">Massive - Impression</div>
            <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
              <p>{tx({ fr: '- Papier d\'archives', en: '- Archival paper', es: '- Papel de archivo' })}</p>
              <p>{tx({ fr: '- 12 encres pigmentees', en: '- 12 pigment inks', es: '- 12 tintas pigmentadas' })}</p>
              <p>{tx({ fr: '- Calibration couleurs', en: '- Color calibration', es: '- Calibracion de colores' })}</p>
              <p>{tx({ fr: '- Soft proofing', en: '- Soft proofing', es: '- Soft proofing' })}</p>
            </div>
          </div>

          {/* Massive frame */}
          <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
            <div className="text-3xl font-bold text-green-400">30$</div>
            <div className="text-xs text-green-400 font-bold mt-1 uppercase tracking-wider">Massive - Frame</div>
            <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
              <p>{tx({ fr: '- Cadre noir ou blanc', en: '- Black or white frame', es: '- Marco negro o blanco' })}</p>
              <p>{tx({ fr: '- Materiaux + assemblage', en: '- Materials + assembly', es: '- Materiales + ensamblaje' })}</p>
            </div>
          </div>

          {/* Artiste */}
          <div className="bg-purple-500/15 rounded-xl p-4 text-center border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400">40$</div>
            <div className="text-xs text-purple-400 font-bold mt-1 uppercase tracking-wider">{tx({ fr: 'Toi - Profit net', en: 'You - Net profit', es: 'Tu - Beneficio neto' })}</div>
            <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
              <p>{tx({ fr: '- Tu fournis ton fichier', en: '- You provide your file', es: '- Proporcionas tu archivo' })}</p>
              <p>{tx({ fr: '- Zero gestion', en: '- Zero management', es: '- Cero gestion' })}</p>
              <p>{tx({ fr: '- Zero frais', en: '- Zero fees', es: '- Cero costos' })}</p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-grey-muted">
          35$ + 30$ + 40$ = <span className="text-heading font-bold">105$</span> &mdash; {tx({ fr: 'Sans frame: client paie 75$, Massive 35$, toi 40$', en: 'Without frame: client pays $75, Massive $35, you $40', es: 'Sin marco: cliente paga 75$, Massive 35$, tu 40$' })}
        </div>
      </div>

      {/* Grille tarifaire */}
      <div className="rounded-2xl border border-purple-main/30 p-5 card-bg card-shadow">
        <h4 className="text-heading font-semibold text-sm mb-4 flex items-center gap-2">
          <FileText size={16} className="text-accent" />
          {tx({ fr: 'Tes tarifs de vente', en: 'Your selling prices', es: 'Tus precios de venta' })}
        </h4>
        <p className="text-grey-muted text-xs mb-4">
          {tx({
            fr: 'Prix affiches aux clients dans ta boutique. Ta marge = prix client - cout impression Massive. Le cadre (30$) va entierement a Massive. TPS + TVQ en sus.',
            en: 'Prices shown to customers in your store. Your margin = client price - Massive print cost. Frame ($30) goes entirely to Massive. GST + QST extra.',
            es: 'Precios mostrados a los clientes en tu tienda. Tu margen = precio cliente - costo impresion Massive. El marco (30$) va completamente a Massive. Impuestos adicionales.',
          })}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-grey-muted text-xs uppercase tracking-wider border-b border-purple-main/20">
                <th className="text-left py-2 pr-3">{tx({ fr: 'Format', en: 'Format', es: 'Formato' })}</th>
                <th className="text-right py-2 px-2">{tx({ fr: 'Prix client', en: 'Client price', es: 'Precio cliente' })}</th>
                <th className="text-right py-2 px-2">{tx({ fr: 'Cout Massive', en: 'Massive cost', es: 'Costo Massive' })}</th>
                <th className="text-right py-2 px-2 text-green-400">{tx({ fr: 'Ta marge', en: 'Your margin', es: 'Tu margen' })}</th>
              </tr>
            </thead>
            <tbody>
              {/* Serie Studio */}
              <tr className="border-b border-purple-main/10">
                <td colSpan="4" className="pt-3 pb-1 text-accent font-semibold text-xs">
                  {tx({ fr: 'Serie Studio (4 encres pigmentees)', en: 'Studio Series (4 pigment inks)', es: 'Serie Studio (4 tintas pigmentadas)' })}
                </td>
              </tr>
              {[
                { format: 'A4 (8.5x11")', key: 'a4' },
                { format: 'A3 (11x17")', key: 'a3' },
                { format: 'A3+ (13x19")', key: 'a3plus' },
              ].map(({ format, key }) => (
                <tr key={`studio-${key}`} className="border-b border-purple-main/10 hover:bg-accent/5 transition-colors">
                  <td className="py-2 pr-3 text-heading">{format}</td>
                  <td className="py-2 px-2 text-right text-heading">{ARTIST_PRICES.studio[key]}$</td>
                  <td className="py-2 px-2 text-right text-grey-muted">{SERVICE_PRICES.studio[key]}$</td>
                  <td className="py-2 px-2 text-right text-green-400 font-semibold">{ARTIST_PRICES.studio[key] - SERVICE_PRICES.studio[key]}$</td>
                </tr>
              ))}

              {/* Serie Musee */}
              <tr className="border-b border-purple-main/10">
                <td colSpan="4" className="pt-4 pb-1 text-accent font-semibold text-xs">
                  {tx({ fr: 'Serie Musee (12 encres pigmentees - Canon Pro 2600)', en: 'Museum Series (12 pigment inks - Canon Pro 2600)', es: 'Serie Museo (12 tintas pigmentadas - Canon Pro 2600)' })}
                </td>
              </tr>
              {[
                { format: 'A4 (8.5x11")', key: 'a4' },
                { format: 'A3 (11x17")', key: 'a3' },
                { format: 'A3+ (13x19")', key: 'a3plus' },
                { format: 'A2 (18x24")', key: 'a2' },
              ].map(({ format, key }) => (
                <tr key={`museum-${key}`} className="border-b border-purple-main/10 hover:bg-accent/5 transition-colors">
                  <td className="py-2 pr-3 text-heading">{format}</td>
                  <td className="py-2 px-2 text-right text-heading">{ARTIST_PRICES.museum[key]}$</td>
                  <td className="py-2 px-2 text-right text-grey-muted">{SERVICE_PRICES.museum[key]}$</td>
                  <td className="py-2 px-2 text-right text-green-400 font-semibold">{ARTIST_PRICES.museum[key] - SERVICE_PRICES.museum[key]}$</td>
                </tr>
              ))}

              {/* Cadre */}
              <tr className="border-t-2 border-purple-main/20">
                <td className="py-2 pr-3 text-heading font-medium">
                  {tx({ fr: 'Cadre (noir ou blanc)', en: 'Frame (black or white)', es: 'Marco (negro o blanco)' })}
                </td>
                <td className="py-2 px-2 text-right text-heading">{FRAME_PRICE}$</td>
                <td className="py-2 px-2 text-right text-grey-muted">{FRAME_PRICE}$</td>
                <td className="py-2 px-2 text-right text-grey-muted">0$</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-grey-muted text-[11px] mt-3 italic">
          {tx({
            fr: 'Note: Le format A2 (18x24") est imprime exclusivement sur la Canon Pro 2600 (12 encres). Pas de cadre disponible pour ce format.',
            en: 'Note: A2 (18x24") is printed exclusively on Canon Pro 2600 (12 inks). No frame available for this format.',
            es: 'Nota: El formato A2 (18x24") se imprime exclusivamente en Canon Pro 2600 (12 tintas). Sin marco disponible para este formato.',
          })}
        </p>
      </div>

      {/* Historique commissions */}
      <div className="rounded-2xl border border-purple-main/30 p-5 card-bg card-shadow">
        <h4 className="text-heading font-semibold text-sm mb-4 flex items-center gap-2">
          <Clock size={16} className="text-accent" />
          {tx({ fr: 'Historique des ventes', en: 'Sales history', es: 'Historial de ventas' })}
        </h4>

        {loading ? (
          <div className="flex items-center gap-2 text-grey-muted py-8 justify-center">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-yellow-400 py-4">
            <AlertCircle size={16} />
            <span className="text-sm">{tx({ fr: 'Impossible de charger les ventes', en: 'Unable to load sales', es: 'No se pueden cargar las ventas' })}</span>
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-8">
            <Package size={32} className="text-grey-muted/20 mx-auto mb-2" />
            <p className="text-grey-muted text-sm">
              {tx({ fr: 'Aucune vente pour le moment', en: 'No sales yet', es: 'Sin ventas por el momento' })}
            </p>
            <p className="text-grey-muted/60 text-xs mt-1">
              {tx({
                fr: 'Les ventes de tes prints apparaitront ici automatiquement.',
                en: 'Sales of your prints will appear here automatically.',
                es: 'Las ventas de tus prints apareceran aqui automaticamente.',
              })}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {commissions.map((c, i) => (
              <div key={c.documentId || i} className="flex items-center justify-between py-3 border-b border-purple-main/10 last:border-0">
                <div>
                  <p className="text-heading text-sm font-medium">
                    {c.customerName || c.customerEmail || 'Client'}
                  </p>
                  <p className="text-grey-muted text-xs">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-CA') : '-'}
                    {c.items && ` - ${c.items.length} article${c.items.length > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    c.paid || c.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {c.paid || c.status === 'paid'
                      ? tx({ fr: 'Paye', en: 'Paid', es: 'Pagado' })
                      : tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' })
                    }
                  </span>
                  <span className="text-green-400 font-bold text-sm">
                    +{formatMoney(c.artistEarning || c.commission || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {artist && (
          <Link
            to={`/artistes/${artistSlug}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors group"
          >
            <Palette size={20} className="text-accent" />
            <div className="flex-grow">
              <p className="text-heading text-sm font-medium">{tx({ fr: 'Ma boutique', en: 'My store', es: 'Mi tienda' })}</p>
              <p className="text-grey-muted text-xs">massivemedias.com/artistes/{artistSlug}</p>
            </div>
            <ExternalLink size={16} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}
        <Link
          to="/contact"
          className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors group"
        >
          <DollarSign size={20} className="text-green-400" />
          <div className="flex-grow">
            <p className="text-heading text-sm font-medium">
              {tx({ fr: 'Demander un paiement', en: 'Request payment', es: 'Solicitar pago' })}
            </p>
            <p className="text-grey-muted text-xs">
              {tx({ fr: 'Interac ou en personne', en: 'Interac or in person', es: 'Interac o en persona' })}
            </p>
          </div>
          <ExternalLink size={16} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  );
}

export default AccountArtistDashboard;
