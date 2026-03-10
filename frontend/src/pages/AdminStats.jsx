import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Receipt, Loader2,
  BarChart3, Users, ShoppingBag, Percent, ExternalLink,
  Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getOrderStats } from '../services/adminService';

const CATEGORY_LABELS = {
  materials: 'Materiaux', shipping: 'Expedition', software: 'Logiciel',
  marketing: 'Marketing', rent: 'Loyer', equipment: 'Equipement',
  taxes: 'Taxes', other: 'Autre',
};

function AdminStats() {
  const { tx } = useLang();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderStats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-accent" /></div>;
  }

  if (!stats) {
    return <div className="text-center py-20 text-grey-muted">{tx({ fr: 'Erreur de chargement', en: 'Loading error', es: 'Error de carga' })}</div>;
  }

  const summaryCards = [
    { label: tx({ fr: 'Revenus totaux', en: 'Total revenue', es: 'Ingresos totales' }), value: `${(stats.revenue?.totalDollars || 0).toFixed(2)}$`, icon: DollarSign, accent: 'text-green-400' },
    { label: tx({ fr: 'Depenses totales', en: 'Total expenses', es: 'Total gastos' }), value: `${(stats.expenses?.total || 0).toFixed(2)}$`, icon: Receipt, accent: 'text-red-400' },
    { label: tx({ fr: 'Profit brut', en: 'Gross profit', es: 'Ganancia bruta' }), value: `${(stats.profit?.gross || 0).toFixed(2)}$`, icon: TrendingUp, accent: stats.profit?.gross >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' }), value: stats.orderStats?.total || 0, icon: ShoppingBag, accent: 'text-accent' },
  ];

  // Revenue bar chart data
  const monthlyRev = stats.revenue?.monthly || [];
  const maxRevenue = Math.max(...monthlyRev.map(m => m.revenue), 1);

  // Expense categories
  const expByCat = stats.expenses?.byCategory || {};
  const maxExpCat = Math.max(...Object.values(expByCat), 1);

  // Order status breakdown
  const byStatus = stats.orderStats?.byStatus || {};
  const totalOrders = Object.values(byStatus).reduce((s, v) => s + v, 0) || 1;

  const statusColors = {
    pending: 'bg-yellow-400', paid: 'bg-green-400', processing: 'bg-blue-400',
    shipped: 'bg-purple-400', delivered: 'bg-emerald-400', cancelled: 'bg-red-400', refunded: 'bg-gray-400',
  };

  const statusLabels = {
    pending: 'En attente', paid: 'Paye', processing: 'En production',
    shipped: 'Expedie', delivered: 'Livre', cancelled: 'Annule', refunded: 'Rembourse',
  };

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 bg-glass card-border">
              <div className="flex items-center gap-2 mb-2"><Icon size={16} className={card.accent} /><span className="text-grey-muted text-xs">{card.label}</span></div>
              <span className="text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-green-400" />
            {tx({ fr: 'Revenus mensuels', en: 'Monthly revenue', es: 'Ingresos mensuales' })}
          </h3>
          {monthlyRev.length === 0 ? (
            <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune donnee', en: 'No data', es: 'Sin datos' })}</p>
          ) : (
            <div className="space-y-2">
              {monthlyRev.slice(-12).map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-grey-muted w-16 flex-shrink-0">{m.month}</span>
                  <div className="flex-1 h-5 rounded bg-glass overflow-hidden">
                    <div className="h-full rounded bg-green-400/60" style={{ width: `${(m.revenue / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-xs text-heading font-semibold w-20 text-right">{(m.revenue / 100).toFixed(0)}$</span>
                  <span className="text-[10px] text-grey-muted w-10 text-right">{m.orders} cmd</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses by category */}
        <div className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Receipt size={16} className="text-red-400" />
            {tx({ fr: 'Depenses par categorie', en: 'Expenses by category', es: 'Gastos por categoria' })}
          </h3>
          {Object.keys(expByCat).length === 0 ? (
            <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune donnee', en: 'No data', es: 'Sin datos' })}</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(expByCat).sort(([,a], [,b]) => b - a).map(([cat, amount]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-grey-muted w-20 flex-shrink-0 truncate">{CATEGORY_LABELS[cat] || cat}</span>
                  <div className="flex-1 h-5 rounded bg-glass overflow-hidden">
                    <div className="h-full rounded bg-red-400/60" style={{ width: `${(amount / maxExpCat) * 100}%` }} />
                  </div>
                  <span className="text-xs text-heading font-semibold w-16 text-right">{amount.toFixed(0)}$</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-accent" />
            {tx({ fr: 'Status des commandes', en: 'Order status', es: 'Estado de pedidos' })}
          </h3>
          <div className="space-y-2">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs text-grey-muted w-24 flex-shrink-0">{statusLabels[status] || status}</span>
                <div className="flex-1 h-5 rounded bg-glass overflow-hidden">
                  <div className={`h-full rounded ${statusColors[status] || 'bg-accent'}`} style={{ width: `${(count / totalOrders) * 100}%`, opacity: 0.6 }} />
                </div>
                <span className="text-xs text-heading font-semibold w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Taxes */}
        <div className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Percent size={16} className="text-purple-400" />
            {tx({ fr: 'Bilan taxes', en: 'Tax summary', es: 'Resumen impuestos' })}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-grey-muted"></span>
              <span className="text-grey-muted text-xs text-center">TPS (5%)</span>
              <span className="text-grey-muted text-xs text-center">TVQ (9.975%)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-grey-muted text-xs">{tx({ fr: 'Percue', en: 'Collected', es: 'Cobrado' })}</span>
              <span className="text-heading text-center font-semibold">{(stats.taxes?.tpsCollected || 0).toFixed(2)}$</span>
              <span className="text-heading text-center font-semibold">{(stats.taxes?.tvqCollected || 0).toFixed(2)}$</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-grey-muted text-xs">{tx({ fr: 'Payee', en: 'Paid', es: 'Pagado' })}</span>
              <span className="text-heading text-center">{(stats.taxes?.tpsPaid || 0).toFixed(2)}$</span>
              <span className="text-heading text-center">{(stats.taxes?.tvqPaid || 0).toFixed(2)}$</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm border-t pt-2 card-border">
              <span className="text-heading font-semibold text-xs">{tx({ fr: 'A remettre', en: 'Net owed', es: 'A remitir' })}</span>
              <span className={`text-center font-bold ${(stats.taxes?.tpsNet || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>{(stats.taxes?.tpsNet || 0).toFixed(2)}$</span>
              <span className={`text-center font-bold ${(stats.taxes?.tvqNet || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>{(stats.taxes?.tvqNet || 0).toFixed(2)}$</span>
            </div>
          </div>
        </div>

        {/* Google Analytics link */}
        <div className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            Google Analytics
          </h3>
          <p className="text-grey-muted text-sm mb-4">
            {tx({
              fr: 'Consulte les stats detaillees de trafic, visiteurs, pages vues et conversions directement sur Google Analytics.',
              en: 'View detailed traffic, visitor, pageview and conversion stats directly on Google Analytics.',
              es: 'Consulta las estadisticas detalladas de trafico, visitantes, paginas vistas y conversiones en Google Analytics.',
            })}
          </p>
          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-colors"
          >
            <BarChart3 size={16} />
            {tx({ fr: 'Ouvrir Google Analytics', en: 'Open Google Analytics', es: 'Abrir Google Analytics' })}
            <ExternalLink size={14} />
          </a>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass text-grey-muted text-xs hover:text-heading transition-colors"
            >
              Search Console <ExternalLink size={10} />
            </a>
            <a
              href="https://dashboard.stripe.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass text-grey-muted text-xs hover:text-heading transition-colors"
            >
              Stripe Dashboard <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* KPIs calcules */}
        <div className="rounded-xl bg-glass p-5 card-border">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            KPIs
          </h3>
          <div className="space-y-4">
            {(() => {
              const totalRev = stats.revenue?.totalDollars || 0;
              const totalOrders2 = stats.orderStats?.total || 0;
              const avgOrder = totalOrders2 > 0 ? (totalRev / totalOrders2) : 0;
              const totalExp = stats.expenses?.total || 0;
              const margin = totalRev > 0 ? ((totalRev - totalExp) / totalRev * 100) : 0;
              return [
                { label: tx({ fr: 'Panier moyen', en: 'Avg order value', es: 'Valor medio pedido' }), value: `${avgOrder.toFixed(2)}$`, good: true },
                { label: tx({ fr: 'Marge nette', en: 'Net margin', es: 'Margen neto' }), value: `${margin.toFixed(1)}%`, good: margin > 0 },
                { label: tx({ fr: 'Taux annulation', en: 'Cancel rate', es: 'Tasa cancelacion' }),
                  value: `${totalOrders2 > 0 ? (((byStatus.cancelled || 0) / totalOrders2) * 100).toFixed(1) : 0}%`,
                  good: false, reverse: true },
                { label: tx({ fr: 'Taux remboursement', en: 'Refund rate', es: 'Tasa reembolso' }),
                  value: `${totalOrders2 > 0 ? (((byStatus.refunded || 0) / totalOrders2) * 100).toFixed(1) : 0}%`,
                  good: false, reverse: true },
              ].map((kpi, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-grey-muted">{kpi.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-lg font-bold ${
                      kpi.reverse
                        ? (parseFloat(kpi.value) > 5 ? 'text-red-400' : 'text-green-400')
                        : (kpi.good ? 'text-green-400' : 'text-red-400')
                    }`}>{kpi.value}</span>
                    {kpi.reverse
                      ? (parseFloat(kpi.value) > 5 ? <ArrowUpRight size={14} className="text-red-400" /> : <ArrowDownRight size={14} className="text-green-400" />)
                      : (kpi.good ? <ArrowUpRight size={14} className="text-green-400" /> : <ArrowDownRight size={14} className="text-red-400" />)
                    }
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Top clients */}
        <div className="rounded-xl bg-glass p-5 card-border lg:col-span-2">
          <h3 className="text-sm font-heading font-bold text-heading mb-4 flex items-center gap-2">
            <Users size={16} className="text-accent" />
            {tx({ fr: 'Top 10 clients', en: 'Top 10 clients', es: 'Top 10 clientes' })}
          </h3>
          {(stats.topClients || []).length === 0 ? (
            <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune donnee', en: 'No data', es: 'Sin datos' })}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(stats.topClients || []).map((client, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-heading font-medium truncate">{client.name}</p>
                    <p className="text-xs text-grey-muted truncate">{client.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-heading font-semibold">{(client.totalSpent / 100).toFixed(0)}$</p>
                    <p className="text-[10px] text-grey-muted">{client.orderCount} cmd</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminStats;
