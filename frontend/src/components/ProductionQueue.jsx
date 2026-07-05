import { Link } from 'react-router-dom'
import { Factory, ArrowRight } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { STATUS_COLORS, STATUS_LABELS, PRODUCTION_STAGE_LABELS } from '../constants/orderStatus'

/**
 * ProductionQueue (FILE-PROD-01A)
 * -------------------------------
 * Section "File de production" en tete du dashboard admin : les commandes
 * payees non expediees (status paid / processing / ready), triees de la plus
 * ancienne a la plus recente, pour voir d'un coup d'oeil ce qui doit sortir.
 *
 * Zero fetch ici : AdminDashboard charge deja orders/admin-list (pageSize 500,
 * refresh 60s) et passe la liste brute en prop. Le filtre et le tri se font
 * localement, coherent avec la regle "zero nouvel endpoint".
 *
 * Navigation : clic sur une ligne -> /admin/commandes. AdminOrders n'expose
 * pas (encore) d'ouverture d'une commande precise par URL (expansion en state
 * local uniquement), donc pas de deep-link possible sans le modifier, ce qui
 * est hors scope de ce chantier.
 *
 * Props :
 *   - orders : array brut de commandes (shape orders/admin-list)
 */

const PRODUCTION_STATUSES = ['paid', 'processing', 'ready']

// Montants stockes en cents dans Strapi, meme convention que AdminOrders.
const dollars = (v) => `${((v || 0) / 100).toFixed(2)}$`

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function ageInDays(createdAt) {
  const created = new Date(createdAt || Date.now()).getTime()
  return Math.max(0, Math.floor((Date.now() - created) / ONE_DAY_MS))
}

// Code couleur d'urgence : normal <= 2 jours, ambre 3 a 5, rouge > 5.
function ageColorClass(days) {
  if (days > 5) return 'text-red-400'
  if (days >= 3) return 'text-amber-400'
  return 'text-grey-muted'
}

// Meme derivation de reference courte que AdminOrders / les emails.
function shortRef(order) {
  return (
    String(order.stripePaymentIntentId || '').slice(-8) ||
    String(order.documentId || '').slice(-8)
  ).toUpperCase()
}

function ProductionQueue({ orders }) {
  const { tx } = useLang()

  const queue = (orders || [])
    .filter((o) => PRODUCTION_STATUSES.includes(o.status))
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))

  // File vide : une ligne discrete, pas de section vide criarde.
  if (queue.length === 0) {
    return (
      <div className="px-4 py-3 rounded-xl bg-black/20 text-xs text-grey-muted">
        {tx({
          fr: 'File de production : aucune commande en attente',
          en: 'Production queue: no pending orders',
          es: 'Cola de producción: ningún pedido pendiente',
        })}
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-black/20 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <Factory size={16} className="text-accent flex-shrink-0" />
          <h2 className="text-sm font-bold text-heading">
            {tx({ fr: 'File de production', en: 'Production queue', es: 'Cola de producción' })}
          </h2>
          <span className="text-xs font-semibold text-accent whitespace-nowrap">
            {tx({
              fr: `${queue.length} commande${queue.length > 1 ? 's' : ''} à produire`,
              en: `${queue.length} order${queue.length > 1 ? 's' : ''} to produce`,
              es: `${queue.length} pedido${queue.length > 1 ? 's' : ''} por producir`,
            })}
          </span>
        </div>
        <Link
          to="/admin/commandes"
          className="text-xs text-grey-muted hover:text-accent transition-colors whitespace-nowrap"
        >
          {tx({ fr: 'Tout voir', en: 'View all', es: 'Ver todo' })}
        </Link>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {queue.map((order) => {
          const days = ageInDays(order.createdAt)
          const stageLabel = PRODUCTION_STAGE_LABELS[order.productionStage]
          return (
            <Link
              key={order.documentId || shortRef(order)}
              to="/admin/commandes"
              className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-b-0 hover:bg-black/25 transition-colors group"
            >
              <span className="font-mono text-xs font-semibold text-heading flex-shrink-0">
                #{shortRef(order)}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-400'}`}
              >
                {STATUS_LABELS[order.status] ? tx(STATUS_LABELS[order.status]) : order.status}
              </span>
              {stageLabel && (
                <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-grey-muted whitespace-nowrap flex-shrink-0">
                  {stageLabel}
                </span>
              )}
              <span className="flex-1 min-w-0 truncate text-xs text-grey-muted">
                {order.customerName || order.customerEmail || ''}
              </span>
              <span
                className={`text-xs font-bold whitespace-nowrap flex-shrink-0 ${ageColorClass(days)}`}
                title={tx({ fr: 'Âge de la commande', en: 'Order age', es: 'Edad del pedido' })}
              >
                {days} j
              </span>
              <span className="text-xs font-semibold text-heading whitespace-nowrap flex-shrink-0">
                {dollars(order.total)}
              </span>
              <ArrowRight
                size={13}
                className="text-grey-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default ProductionQueue
