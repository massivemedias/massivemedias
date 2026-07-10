// TARIFS-STICKERS (5 juillet 2026) : generateur UNIQUE des tableaux de tarifs
// stickers de la page publique /services/stickers, partage par services.js,
// services-en.js et services-es.js. Source des prix = STICKER_GRID (SSOT du
// PR #51 dans utils/pricingData.js) : plus AUCUN prix hardcode dans les
// fichiers de langue, la page suit automatiquement toute mise a jour de grille.
//
// 3 groupes de prix affiches, alignes sur les finitions v2 du configurateur
// (products.js stickerFinishes) :
//   matte        -> "Sans finition"
//   intermediate -> "Clear"
//   fx           -> "Finitions (Matte / Lustre / Holo / Verre Brise / Etoiles / Points)"
import { STICKER_GRID } from '../utils/pricingData'

// PRICING-VOLUME (9 juillet 2026) : les paliers sont DERIVES du grid (SSOT) au
// lieu d'etre hardcodes -> les paliers volume 1000/2000 (et tout futur palier)
// apparaissent automatiquement dans la page publique Tarifs, FR/EN/ES.
const QUANTITIES = Object.keys(STICKER_GRID.standard.matte).map(Number).sort((a, b) => a - b)
const TIERS = ['standard', 'medium', 'large']
const KINDS = ['matte', 'intermediate', 'fx']

// Format FR = convention quebecoise (25 $, 187,50 $, 1,00 $/u). EN/ES gardent
// leur format anglo existant ($25, $187.50, $1.00/u) : l'uniformisation
// site-wide des formats est un chantier separe, on ne change ici que le FR.
function formatMoney(value, lang) {
  if (lang === 'fr') {
    const num = Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',')
    return `${num} $`
  }
  const num = Number.isInteger(value) ? String(value) : value.toFixed(2)
  return `$${num}`
}

function formatUnitPrice(total, qty, lang) {
  const unit = total / qty
  if (lang === 'fr') return `${unit.toFixed(2).replace('.', ',')} $/u`
  return `$${unit.toFixed(2)}/u`
}

const LABELS = {
  fr: {
    tabs: {
      standard: `Standard (jusqu'à 2.5")`,
      medium: `Medium (jusqu'à 3.5")`,
      large: `Large (jusqu'à 5")`,
    },
    headers: ['Qté', 'Prix', 'Prix/u'],
    kinds: {
      matte: 'Sans finition',
      intermediate: 'Clear',
      fx: 'Finitions (Matte / Lustré / Holo / Verre Brisé / Étoiles / Points)',
    },
  },
  en: {
    tabs: {
      standard: 'Standard (up to 2.5")',
      medium: 'Medium (up to 3.5")',
      large: 'Large (up to 5")',
    },
    headers: ['Qty', 'Price', 'Price/u'],
    kinds: {
      matte: 'No finish',
      intermediate: 'Clear',
      fx: 'Finishes (Matte / Luster / Holo / Broken Glass / Stars / Dots)',
    },
  },
  es: {
    tabs: {
      standard: 'Standard (hasta 2.5")',
      medium: 'Medium (hasta 3.5")',
      large: 'Large (hasta 5")',
    },
    headers: ['Cant.', 'Precio', 'Precio/u'],
    kinds: {
      matte: 'Sin acabado',
      intermediate: 'Clear',
      fx: 'Acabados (Mate / Lustrado / Holo / Vidrio Roto / Estrellas / Puntos)',
    },
  },
}

export function buildStickerPricingTabs(lang) {
  // Langue effective resolue UNE fois : labels ET formats restent coherents
  // (langue inconnue -> tout en FR, pas un melange labels FR / format anglo).
  const resolved = LABELS[lang] ? lang : 'fr'
  const L = LABELS[resolved]
  return TIERS.map((tier) => ({
    id: tier,
    label: L.tabs[tier],
    tables: KINDS.map((kind) => ({
      subtitle: L.kinds[kind],
      headers: L.headers,
      rows: QUANTITIES.map((qty) => {
        const total = STICKER_GRID[tier][kind][qty]
        return [String(qty), formatMoney(total, resolved), formatUnitPrice(total, qty, resolved)]
      }),
    })),
  }))
}
