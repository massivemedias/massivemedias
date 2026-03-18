import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Palette, ChevronDown, ChevronUp, Loader2,
  Banknote, TrendingUp, CheckCircle, Calendar, FileText,
  Plus, Save, X,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getCommissions, createArtistPayment } from '../services/adminService';

const METHOD_LABELS = {
  interac: { fr: 'Interac e-Transfer', en: 'Interac e-Transfer', es: 'Interac e-Transfer' },
  cash: { fr: 'Comptant', en: 'Cash', es: 'Efectivo' },
  cheque: { fr: 'Cheque', en: 'Cheque', es: 'Cheque' },
  other: { fr: 'Autre', en: 'Other', es: 'Otro' },
};

function AdminCommissions() {
  const { tx } = useLang();
  const [data, setData] = useState({ artists: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedArtist, setExpandedArtist] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'interac', date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await getCommissions();
      setData(res.data || { artists: [] });
      setError('');
    } catch {
      setError(tx({ fr: 'Impossible de charger les commissions', en: 'Unable to load commissions', es: 'No se pueden cargar las comisiones' }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePayment = async (artist) => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) return;
    setSaving(true);
    try {
      await createArtistPayment({
        artistSlug: artist.slug,
        artistName: artist.name,
        amount: paymentData.amount,
        method: paymentData.method,
        date: paymentData.date,
        notes: paymentData.notes,
      });
      setShowPaymentForm(null);
      setPaymentData({ amount: '', method: 'interac', date: new Date().toISOString().split('T')[0], notes: '' });
      await fetchData();
    } catch {
      setError(tx({ fr: 'Erreur lors de l\'enregistrement', en: 'Error saving payment', es: 'Error al guardar el pago' }));
    } finally {
      setSaving(false);
    }
  };

  const dollars = (v) => `$${(v || 0).toFixed(2)}`;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  // Totals
  const totalSales = data.artists.reduce((s, a) => s + a.totalSales, 0);
  const totalCommission = data.artists.reduce((s, a) => s + a.totalCommission, 0);
  const totalPaid = data.artists.reduce((s, a) => s + a.totalPaid, 0);
  const totalBalance = data.artists.reduce((s, a) => s + a.balance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-grey-muted">
        {tx({ fr: 'Suivi des ventes et commissions par artiste', en: 'Track artist sales and commissions', es: 'Seguimiento de ventas y comisiones por artista' })}
      </p>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 shadow-sm bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: tx({ fr: 'Ventes artistes', en: 'Artist sales', es: 'Ventas artistas' }), value: dollars(totalSales), icon: TrendingUp, accent: 'text-accent' },
          { label: tx({ fr: 'Commissions dues', en: 'Commissions due', es: 'Comisiones debidas' }), value: dollars(totalCommission), icon: DollarSign, accent: 'text-blue-400' },
          { label: tx({ fr: 'Total verse', en: 'Total paid', es: 'Total pagado' }), value: dollars(totalPaid), icon: CheckCircle, accent: 'text-green-400' },
          { label: tx({ fr: 'Solde a payer', en: 'Balance owing', es: 'Saldo a pagar' }), value: dollars(totalBalance), icon: Banknote, accent: totalBalance > 0 ? 'text-orange-400' : 'text-grey-muted' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 card-bg shadow-lg shadow-black/20">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={card.accent} />
                <span className="text-grey-muted text-xs">{card.label}</span>
              </div>
              <span className="text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Artists list */}
      {data.artists.length === 0 ? (
        <div className="text-center py-20 text-grey-muted">
          <Palette size={40} className="mx-auto mb-4 opacity-30" />
          <p>{tx({ fr: 'Aucune vente artiste pour le moment', en: 'No artist sales yet', es: 'No hay ventas de artistas todavia' })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.artists.map((artist) => {
            const isExpanded = expandedArtist === artist.slug;
            const isPaymentOpen = showPaymentForm === artist.slug;

            return (
              <motion.div
                key={artist.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl card-bg shadow-lg shadow-black/20 overflow-hidden"
              >
                {/* Artist row */}
                <button
                  onClick={() => setExpandedArtist(isExpanded ? null : artist.slug)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm flex-shrink-0">
                    {artist.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-heading font-semibold">{artist.name}</p>
                    <p className="text-grey-muted text-xs">
                      {tx({ fr: 'Taux', en: 'Rate', es: 'Tasa' })}: {Math.round(artist.rate * 100)}% - {artist.orders.length} {tx({ fr: 'vente(s)', en: 'sale(s)', es: 'venta(s)' })}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-grey-muted text-[10px] uppercase">{tx({ fr: 'Ventes', en: 'Sales', es: 'Ventas' })}</p>
                      <p className="text-heading font-medium">{dollars(artist.totalSales)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-grey-muted text-[10px] uppercase">Commission</p>
                      <p className="text-blue-400 font-medium">{dollars(artist.totalCommission)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-grey-muted text-[10px] uppercase">{tx({ fr: 'Verse', en: 'Paid', es: 'Pagado' })}</p>
                      <p className="text-green-400 font-medium">{dollars(artist.totalPaid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-grey-muted text-[10px] uppercase">{tx({ fr: 'Solde', en: 'Balance', es: 'Saldo' })}</p>
                      <p className={`font-bold ${artist.balance > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                        {dollars(artist.balance)}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-grey-muted" /> : <ChevronDown size={18} className="text-grey-muted" />}
                </button>

                {/* Mobile summary */}
                <div className="md:hidden flex items-center gap-4 px-4 pb-3 text-xs">
                  <span className="text-grey-muted">{tx({ fr: 'Ventes', en: 'Sales', es: 'Ventas' })}: <span className="text-heading">{dollars(artist.totalSales)}</span></span>
                  <span className="text-grey-muted">Comm: <span className="text-blue-400">{dollars(artist.totalCommission)}</span></span>
                  <span className={`font-bold ${artist.balance > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                    {tx({ fr: 'Solde', en: 'Balance', es: 'Saldo' })}: {dollars(artist.balance)}
                  </span>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5"
                    >
                      <div className="p-4 space-y-4">
                        {/* Orders table */}
                        <div>
                          <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3">
                            {tx({ fr: 'Detail des ventes', en: 'Sales detail', es: 'Detalle de ventas' })}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-grey-muted uppercase tracking-wider">
                                  <th className="text-left p-2">Date</th>
                                  <th className="text-left p-2">{tx({ fr: 'Produit', en: 'Product', es: 'Producto' })}</th>
                                  <th className="text-left p-2">{tx({ fr: 'Client', en: 'Client', es: 'Cliente' })}</th>
                                  <th className="text-right p-2">{tx({ fr: 'Vente', en: 'Sale', es: 'Venta' })}</th>
                                  <th className="text-right p-2">{tx({ fr: 'Cout prod.', en: 'Prod. cost', es: 'Costo prod.' })}</th>
                                  <th className="text-right p-2">{tx({ fr: 'Profit net', en: 'Net profit', es: 'Profit neto' })}</th>
                                  <th className="text-right p-2">Commission</th>
                                </tr>
                              </thead>
                              <tbody>
                                {artist.orders.map((o, i) => (
                                  <tr key={i} className="border-t border-white/5">
                                    <td className="p-2 text-grey-muted">{formatDate(o.orderDate)}</td>
                                    <td className="p-2 text-heading">{o.productName}</td>
                                    <td className="p-2 text-grey-muted">{o.customerName}</td>
                                    <td className="p-2 text-right text-heading">{dollars(o.salePrice)}</td>
                                    <td className="p-2 text-right text-grey-muted">{dollars(o.productionCost)}</td>
                                    <td className="p-2 text-right text-heading">{dollars(o.netProfit)}</td>
                                    <td className="p-2 text-right text-blue-400 font-medium">{dollars(o.commission)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-white/5 font-semibold">
                                  <td colSpan={3} className="p-2 text-heading">Total</td>
                                  <td className="p-2 text-right text-heading">{dollars(artist.totalSales)}</td>
                                  <td className="p-2 text-right text-grey-muted">{dollars(artist.totalProduction)}</td>
                                  <td className="p-2 text-right text-heading">{dollars(artist.totalNetProfit)}</td>
                                  <td className="p-2 text-right text-blue-400">{dollars(artist.totalCommission)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Payments history */}
                        {artist.payments && artist.payments.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-grey-muted uppercase tracking-wider mb-3">
                              {tx({ fr: 'Historique des paiements', en: 'Payment history', es: 'Historial de pagos' })}
                            </h4>
                            <div className="space-y-2">
                              {artist.payments.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-green-500/5 bg-green-500/5">
                                  <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-green-400 font-medium text-sm">{dollars(parseFloat(p.amount))}</span>
                                    <span className="text-grey-muted text-xs ml-2">
                                      {METHOD_LABELS[p.method] ? tx(METHOD_LABELS[p.method]) : p.method} - {formatDate(p.date)}
                                    </span>
                                    {p.notes && <span className="text-grey-muted text-xs ml-2">({p.notes})</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Balance summary */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-glass bg-white/5">
                          <div className="flex items-center gap-6 text-sm">
                            <span className="text-grey-muted">{tx({ fr: 'Commission totale', en: 'Total commission', es: 'Comision total' })}: <span className="text-blue-400 font-medium">{dollars(artist.totalCommission)}</span></span>
                            <span className="text-grey-muted">{tx({ fr: 'Verse', en: 'Paid', es: 'Pagado' })}: <span className="text-green-400 font-medium">{dollars(artist.totalPaid)}</span></span>
                            <span className={`font-bold text-lg ${artist.balance > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                              {tx({ fr: 'Solde', en: 'Balance', es: 'Saldo' })}: {dollars(artist.balance)}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setShowPaymentForm(isPaymentOpen ? null : artist.slug);
                              setPaymentData({ amount: artist.balance > 0 ? artist.balance.toFixed(2) : '', method: 'interac', date: new Date().toISOString().split('T')[0], notes: '' });
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-xs font-medium"
                          >
                            <Plus size={14} />
                            {tx({ fr: 'Enregistrer paiement', en: 'Log payment', es: 'Registrar pago' })}
                          </button>
                        </div>

                        {/* Payment form */}
                        <AnimatePresence>
                          {isPaymentOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 rounded-lg bg-green-500/5 bg-green-500/5 space-y-3">
                                <h4 className="text-sm font-semibold text-heading flex items-center gap-2">
                                  <Banknote size={16} className="text-green-400" />
                                  {tx({ fr: 'Nouveau paiement a', en: 'New payment to', es: 'Nuevo pago a' })} {artist.name}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div>
                                    <label className="text-xs text-grey-muted mb-1 block">{tx({ fr: 'Montant ($)', en: 'Amount ($)', es: 'Monto ($)' })}</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={paymentData.amount}
                                      onChange={(e) => setPaymentData(d => ({ ...d, amount: e.target.value }))}
                                      className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-grey-muted mb-1 block">{tx({ fr: 'Methode', en: 'Method', es: 'Metodo' })}</label>
                                    <select
                                      value={paymentData.method}
                                      onChange={(e) => setPaymentData(d => ({ ...d, method: e.target.value }))}
                                      className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                    >
                                      {Object.entries(METHOD_LABELS).map(([k, v]) => (
                                        <option key={k} value={k}>{tx(v)}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs text-grey-muted mb-1 block">Date</label>
                                    <input
                                      type="date"
                                      value={paymentData.date}
                                      onChange={(e) => setPaymentData(d => ({ ...d, date: e.target.value }))}
                                      className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-grey-muted mb-1 block">Notes</label>
                                    <input
                                      type="text"
                                      value={paymentData.notes}
                                      onChange={(e) => setPaymentData(d => ({ ...d, notes: e.target.value }))}
                                      className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                      placeholder={tx({ fr: 'Optionnel', en: 'Optional', es: 'Opcional' })}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handlePayment(artist)}
                                    disabled={saving || !paymentData.amount}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-xs font-medium disabled:opacity-50"
                                  >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
                                  </button>
                                  <button
                                    onClick={() => setShowPaymentForm(null)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-glass text-grey-muted hover:text-heading transition-colors text-xs"
                                  >
                                    <X size={14} />
                                    {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminCommissions;
