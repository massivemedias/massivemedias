import { Package, CreditCard, Hammer, MapPin, CheckCircle, XCircle } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'

/**
 * ACCOUNT-TRACKING : timeline compacte du suivi d'une commande, pilotee par le
 * `status` Strapi (le user connecte possede deja ses commandes, pas besoin du
 * form public /tracking). Meme mapping de statuts que la page publique
 * Tracking.jsx (qui reste inchangee), en version horizontale compacte pour la
 * liste du compte.
 */
const STATUS_PROGRESS = { draft: 1, pending: 1, paid: 2, processing: 3, ready: 4, shipped: 4, delivered: 5 }
const NEGATIVE = new Set(['cancelled', 'refunded'])
const STEPS = [
  { id: 1, icon: Package, label: { fr: 'Reçue', en: 'Received', es: 'Recibida' } },
  { id: 2, icon: CreditCard, label: { fr: 'Payée', en: 'Paid', es: 'Pagada' } },
  { id: 3, icon: Hammer, label: { fr: 'Production', en: 'Production', es: 'Producción' } },
  { id: 4, icon: MapPin, label: { fr: 'Prête / Expédiée', en: 'Ready / Shipped', es: 'Lista / Enviada' } },
  { id: 5, icon: CheckCircle, label: { fr: 'Livrée', en: 'Delivered', es: 'Entregada' } },
]

export default function OrderTimeline({ status }) {
  const { tx } = useLang()

  if (NEGATIVE.has(status)) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <XCircle size={16} className="flex-shrink-0" />
        {tx({
          fr: status === 'cancelled' ? 'Commande annulée' : 'Commande remboursée',
          en: status === 'cancelled' ? 'Order cancelled' : 'Order refunded',
          es: status === 'cancelled' ? 'Pedido cancelado' : 'Pedido reembolsado',
        })}
      </div>
    )
  }

  const current = STATUS_PROGRESS[status] || 0
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const Icon = s.icon
        const done = s.id < current
        const active = s.id === current
        return (
          <div key={s.id} className="flex items-center min-w-0">
            <div className="flex flex-col items-center gap-1 w-12 sm:w-16">
              <div
                className={`w-7 h-7 rounded-full grid place-items-center flex-shrink-0 transition-colors ${
                  done ? 'bg-accent text-white' : active ? 'bg-accent text-white ring-2 ring-accent/40' : 'bg-white/5 text-grey-muted/50 border border-white/10'
                }`}
              >
                <Icon size={13} />
              </div>
              <span className={`text-[9px] leading-tight text-center ${done || active ? 'text-grey-muted' : 'text-grey-muted/40'}`}>
                {tx(s.label)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 min-w-[8px] -mt-4 ${done ? 'bg-accent' : 'bg-white/10'}`} aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}
