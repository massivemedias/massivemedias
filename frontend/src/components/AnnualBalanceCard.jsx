import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Download, Loader2, Lightbulb, Info,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getExpenseSummary } from '../services/adminService';

/**
 * AnnualBalanceCard
 * -----------------
 * Bilan comptable annuel (revenus vs depenses + taxes perçues/payees + net a
 * remettre). Deplace de AdminDepenses vers le Dashboard (avril 2026) car le
 * composant melange revenus et depenses - sa place est dans la vue d'ensemble
 * de l'entreprise, pas dans le panneau Depenses.
 *
 * Inclut le bloc pedagogique "Guide Express : Finances pour les nuls" au-dessus
 * des cartes de taxes, pour qu'un admin sans formation comptable comprenne
 * instantanement chaque chiffre. Texte vulgarise intentionnellement.
 */

const MONTH_NAMES = {
  fr: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
};

function downloadCSV(filename, csvContent) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fmt = (v) => {
  const n = parseFloat(v || 0) || 0;
  return n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function AnnualBalanceCard() {
  const { tx, lang } = useLang();
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearData, setYearData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [showMonthly, setShowMonthly] = useState(false);

  const fetchYear = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getExpenseSummary(year);
      setYearData(data?.data || data || null);
    } catch (err) {
      console.warn('[AnnualBalanceCard] fetch failed:', err?.message);
      setYearData(null);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchYear(); }, [fetchYear]);

  const exportCSV = () => {
    if (!yearData) return;
    // FIX-DEFENSIVE (23 avril 2026) : optional chaining + fallbacks partout
    // pour ne pas crasher l'export si l'API retourne une structure tronquee
    // (ex: yearData.months absent, yearData.totals partiel).
    const months = Object.entries(yearData?.months || {});
    const mNames = MONTH_NAMES.fr;
    const t = yearData?.totals || {};
    // Helper local : valeur numerique safe (evite NaN dans le CSV).
    const num = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
    const lines = [
      `Massive Medias - Bilan annuel ${year}`,
      `NEQ: 2269057891 | TPS: 732457635RT0001 | TVQ: 4012577678TQ0001`,
      '',
      'Mois,Revenus,Depenses,TPS payee,TVQ payee,Bilan',
      ...months.map(([key, m]) => {
        const safeM = m || {};
        const balance = num(safeM.revenue) - num(safeM.expenses);
        return `${mNames[parseInt(key) - 1]},${fmt(safeM.revenue)},${fmt(safeM.expenses)},${fmt(safeM.tps)},${fmt(safeM.tvq)},${fmt(balance)}`;
      }),
      `Total,${fmt(t.revenue)},${fmt(t.expenses)},${fmt(t.tps)},${fmt(t.tvq)},${fmt(num(t.revenue) - num(t.expenses))}`,
      '',
      'Taxes',
      `,TPS (5%),TVQ (9.975%)`,
      `Percue sur ventes,${fmt(t.revenueTps)},${fmt(t.revenueTvq)}`,
      `Payee sur achats,${fmt(t.tps)},${fmt(t.tvq)}`,
      `Net a remettre,${fmt(num(t.revenueTps) - num(t.tps))},${fmt(num(t.revenueTvq) - num(t.tvq))}`,
      '',
      `Depenses deductibles,${fmt(t.deductible)}`,
      // FIX-MANUAL-EXPORT (23 avril 2026) : breakdown explicite des sources
      // de revenus pour transparence comptable. Inclut les commandes manuelles
      // (B2B, prepaid Interac/Square/comptant, et liens Stripe payes). Si les
      // champs sont absents (vieux backend pre-fix), fallback 0 - pas de
      // regression sur l'export existant.
      '',
      'Source des revenus',
      `Commandes web (Stripe checkout),${fmt(t.revenueWeb)},${num(t.webCount)} commande${num(t.webCount) > 1 ? 's' : ''}`,
      `Commandes manuelles (B2B / prepaid),${fmt(t.revenueManual)},${num(t.manualCount)} commande${num(t.manualCount) > 1 ? 's' : ''}`,
    ];
    downloadCSV(`massive-bilan-${year}.csv`, lines.join('\n'));
  };

  const t = yearData?.totals || {};
  const bilan = (t.revenue || 0) - (t.expenses || 0);
  const netTps = (t.revenueTps || 0) - (t.tps || 0);
  const netTvq = (t.revenueTvq || 0) - (t.tvq || 0);

  return (
    <div className="rounded-2xl card-bg shadow-lg shadow-black/20 p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-heading font-heading font-bold text-base flex items-center gap-2">
          <BarChart3 size={18} className="text-accent" />
          {tx({ fr: 'Bilan annuel', en: 'Annual balance', es: 'Balance anual' })}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded bg-glass text-grey-muted hover:text-heading" aria-label="Annee precedente"><ChevronLeft size={14} /></button>
          <span className="text-sm font-bold text-heading min-w-[4ch] text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded bg-glass text-grey-muted hover:text-heading" aria-label="Annee suivante"><ChevronRight size={14} /></button>
          {yearData && (
            <button onClick={exportCSV} className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              title={tx({ fr: 'Exporter CSV', en: 'Export CSV', es: 'Exportar CSV' })}>
              <Download size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ===== GUIDE EXPRESS : FINANCES POUR LES NULS =====
          Encart pedagogique pour que le client comprenne chaque chiffre sans
          avoir a googler. Texte vulgarise approuve par le proprietaire. */}
      <div className="rounded-xl bg-amber-500/8 border border-amber-400/25 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGuide(v => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-amber-500/5 transition-colors"
        >
          <Lightbulb size={15} className="text-amber-300 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
            {tx({
              fr: 'Guide express : finances pour les nuls',
              en: 'Quick guide: finance for dummies',
              es: 'Guia rapida: finanzas para principiantes',
            })}
          </span>
          {showGuide ? <ChevronUp size={13} className="ml-auto text-amber-300" /> : <ChevronDown size={13} className="ml-auto text-amber-300" />}
        </button>
        <AnimatePresence initial={false}>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <dl className="px-4 pb-3 space-y-2 text-[12px] leading-relaxed">
                <div className="flex gap-2">
                  <dt className="font-bold text-green-300 flex-shrink-0 w-[110px]">{tx({ fr: 'Revenus :', en: 'Revenue:', es: 'Ingresos:' })}</dt>
                  <dd className="text-amber-100/85">
                    {tx({
                      fr: 'Le total de tes ventes (sans les taxes). C\'est ton chiffre d\'affaires.',
                      en: 'Total sales (excluding taxes). Your gross turnover.',
                      es: 'Total de ventas (sin impuestos). Tu facturacion.',
                    })}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-red-300 flex-shrink-0 w-[110px]">{tx({ fr: 'Depenses :', en: 'Expenses:', es: 'Gastos:' })}</dt>
                  <dd className="text-amber-100/85">
                    {tx({
                      fr: 'Ce que l\'entreprise a coute (materiel, logiciels).',
                      en: 'What the business cost you (supplies, software).',
                      es: 'Lo que costo el negocio (material, software).',
                    })}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-accent flex-shrink-0 w-[110px]">{tx({ fr: 'Bilan (Profit) :', en: 'Balance (Profit):', es: 'Balance (Beneficio):' })}</dt>
                  <dd className="text-amber-100/85">
                    {tx({
                      fr: 'Tes revenus moins tes depenses. C\'est ce que l\'entreprise a vraiment gagne.',
                      en: 'Revenue minus expenses. What the business really earned.',
                      es: 'Ingresos menos gastos. Lo que realmente ganaste.',
                    })}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-blue-300 flex-shrink-0 w-[110px]">{tx({ fr: 'Taxes percues :', en: 'Taxes collected:', es: 'Impuestos cobrados:' })}</dt>
                  <dd className="text-amber-100/85">
                    {tx({
                      fr: 'L\'argent des taxes que tes clients t\'ont donne. ',
                      en: 'Tax money your clients gave you. ',
                      es: 'Los impuestos que tus clientes te dieron. ',
                    })}
                    <span className="italic text-red-300/90">
                      {tx({
                        fr: 'Attention : cet argent ne t\'appartient pas.',
                        en: 'Warning: this money is not yours.',
                        es: 'Atencion: este dinero no es tuyo.',
                      })}
                    </span>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-purple-300 flex-shrink-0 w-[110px]">{tx({ fr: 'Taxes payees :', en: 'Taxes paid:', es: 'Impuestos pagados:' })}</dt>
                  <dd className="text-amber-100/85">
                    {tx({
                      fr: 'Les taxes que tu as payees quand tu as achete ton materiel. Le gouvernement te les rembourse.',
                      en: 'Taxes you paid when you bought supplies. Government reimburses them.',
                      es: 'Impuestos pagados en las compras. El gobierno te los devuelve.',
                    })}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-amber-300 flex-shrink-0 w-[110px]">{tx({ fr: 'Net a remettre :', en: 'Net owing:', es: 'Neto a remitir:' })}</dt>
                  <dd className="text-amber-100/85">
                    {tx({
                      fr: '(Percues - Payees). C\'est le cheque exact que tu dois faire au gouvernement a la fin de l\'annee.',
                      en: '(Collected - Paid). The exact check you owe the government at year-end.',
                      es: '(Cobrados - Pagados). El cheque exacto que debes al gobierno.',
                    })}
                  </dd>
                </div>
              </dl>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-accent" /></div>
      ) : !yearData ? (
        <div className="text-center py-8 text-grey-muted text-sm">
          {tx({ fr: 'Aucune donnee pour cette annee.', en: 'No data for this year.', es: 'Sin datos.' })}
        </div>
      ) : (
        <>
          {/* ===== Cartes cles : Revenus / Depenses / Bilan ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg bg-green-500/8 border border-green-500/20 p-3">
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">
                {tx({ fr: 'Revenus', en: 'Revenue', es: 'Ingresos' })}
              </p>
              <p className="text-xl font-heading font-bold text-green-400">{fmt(t.revenue)}$</p>
            </div>
            <div className="rounded-lg bg-red-500/8 border border-red-500/20 p-3">
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">
                {tx({ fr: 'Depenses', en: 'Expenses', es: 'Gastos' })}
              </p>
              <p className="text-xl font-heading font-bold text-red-400">{fmt(t.expenses)}$</p>
            </div>
            <div className={`rounded-lg border p-3 ${bilan >= 0 ? 'bg-accent/8 border-accent/30' : 'bg-red-500/8 border-red-500/30'}`}>
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">
                {tx({ fr: 'Bilan (profit)', en: 'Balance (profit)', es: 'Balance (beneficio)' })}
              </p>
              <p className={`text-xl font-heading font-bold ${bilan >= 0 ? 'text-accent' : 'text-red-400'}`}>
                {bilan >= 0 ? '+' : ''}{fmt(bilan)}$
              </p>
            </div>
          </div>

          {/* ===== Cartes taxes ===== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-accent/5 p-3">
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TPS percue', en: 'GST collected', es: 'TPS cobrado' })}</p>
              <p className="text-sm font-bold text-green-400">{fmt(t.revenueTps)}$</p>
            </div>
            <div className="rounded-lg bg-accent/5 p-3">
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TPS payee', en: 'GST paid', es: 'TPS pagado' })}</p>
              <p className="text-sm font-bold text-red-400">{fmt(t.tps)}$</p>
            </div>
            <div className="rounded-lg bg-accent/5 p-3">
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TVQ percue', en: 'QST collected', es: 'TVQ cobrado' })}</p>
              <p className="text-sm font-bold text-green-400">{fmt(t.revenueTvq)}$</p>
            </div>
            <div className="rounded-lg bg-accent/5 p-3">
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'TVQ payee', en: 'QST paid', es: 'TVQ pagado' })}</p>
              <p className="text-sm font-bold text-red-400">{fmt(t.tvq)}$</p>
            </div>
          </div>

          {/* ===== Cartes net a remettre + deductibles ===== */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 rounded-lg bg-blue-500/5 border border-blue-500/15 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'TPS nette a remettre', en: 'Net GST owing', es: 'TPS neto' })}</p>
                <Info size={10} className="text-grey-muted/70" title="Percue - Payee" />
              </div>
              <p className={`text-lg font-bold ${netTps >= 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(netTps)}$</p>
            </div>
            <div className="flex-1 rounded-lg bg-purple-500/5 border border-purple-500/15 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'TVQ nette a remettre', en: 'Net QST owing', es: 'TVQ neto' })}</p>
                <Info size={10} className="text-grey-muted/70" title="Percue - Payee" />
              </div>
              <p className={`text-lg font-bold ${netTvq >= 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(netTvq)}$</p>
            </div>
            <div className="flex-1 rounded-lg bg-accent/5 border border-accent/15 p-3">
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mb-1">{tx({ fr: 'Depenses deductibles', en: 'Deductible expenses', es: 'Gastos deducibles' })}</p>
              <p className="text-lg font-bold text-green-400">{fmt(t.deductible)}$</p>
            </div>
          </div>

          {/* ===== Toggle : detail mensuel ===== */}
          <button
            type="button"
            onClick={() => setShowMonthly(v => !v)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-glass hover:bg-white/5 transition-colors text-xs text-grey-muted hover:text-heading"
          >
            <BarChart3 size={12} />
            {showMonthly
              ? tx({ fr: 'Masquer le detail mensuel', en: 'Hide monthly detail', es: 'Ocultar detalle mensual' })
              : tx({ fr: 'Voir le detail mensuel', en: 'View monthly detail', es: 'Ver detalle mensual' })}
            {showMonthly ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <AnimatePresence initial={false}>
            {showMonthly && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead>
                      <tr className="shadow-[0_1px_0_rgba(255,255,255,0.04)]">
                        <th className="text-left py-2 text-grey-muted font-semibold">{tx({ fr: 'Mois', en: 'Month', es: 'Mes' })}</th>
                        <th className="text-right py-2 text-green-400 font-semibold">{tx({ fr: 'Revenus', en: 'Revenue', es: 'Ingresos' })}</th>
                        <th className="text-right py-2 text-red-400 font-semibold">{tx({ fr: 'Depenses', en: 'Expenses', es: 'Gastos' })}</th>
                        <th className="text-right py-2 text-blue-400 font-semibold">TPS</th>
                        <th className="text-right py-2 text-purple-400 font-semibold">TVQ</th>
                        <th className="text-right py-2 text-heading font-semibold">{tx({ fr: 'Bilan', en: 'Balance', es: 'Balance' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(yearData.months || {}).map(([key, m]) => {
                        const balance = (m.revenue || 0) - (m.expenses || 0);
                        const hasData = (m.revenue || 0) > 0 || (m.expenses || 0) > 0;
                        if (!hasData) return (
                          <tr key={key} className="shadow-[0_1px_0_rgba(255,255,255,0.04)] opacity-30">
                            <td className="py-2 text-grey-muted">{(MONTH_NAMES[lang] || MONTH_NAMES.fr)[parseInt(key) - 1]}</td>
                            <td className="text-right py-2 text-grey-muted">-</td>
                            <td className="text-right py-2 text-grey-muted">-</td>
                            <td className="text-right py-2 text-grey-muted">-</td>
                            <td className="text-right py-2 text-grey-muted">-</td>
                            <td className="text-right py-2 text-grey-muted">-</td>
                          </tr>
                        );
                        return (
                          <tr key={key} className="shadow-[0_1px_0_rgba(255,255,255,0.04)]">
                            <td className="py-2 text-heading font-medium">{(MONTH_NAMES[lang] || MONTH_NAMES.fr)[parseInt(key) - 1]}</td>
                            <td className="text-right py-2 text-green-400">{fmt(m.revenue)}$</td>
                            <td className="text-right py-2 text-red-400">{fmt(m.expenses)}$</td>
                            <td className="text-right py-2 text-blue-400">{fmt(m.tps)}$</td>
                            <td className="text-right py-2 text-purple-400">{fmt(m.tvq)}$</td>
                            <td className={`text-right py-2 font-semibold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {balance >= 0 ? '+' : ''}{fmt(balance)}$
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="shadow-[0_-2px_0_rgba(255,82,160,0.2)]">
                        <td className="py-3 text-heading font-bold">Total {year}</td>
                        <td className="text-right py-3 text-green-400 font-bold">{fmt(t.revenue)}$</td>
                        <td className="text-right py-3 text-red-400 font-bold">{fmt(t.expenses)}$</td>
                        <td className="text-right py-3 text-blue-400 font-bold">{fmt(t.tps)}$</td>
                        <td className="text-right py-3 text-purple-400 font-bold">{fmt(t.tvq)}$</td>
                        <td className={`text-right py-3 font-bold text-lg ${bilan >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {bilan >= 0 ? '+' : ''}{fmt(bilan)}$
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default AnnualBalanceCard;
