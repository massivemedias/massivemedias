import { describe, it, expect } from 'vitest'
import { labelLineGapPx } from './etiquetteLayout'

// ctx de mesure mocke : renvoie des metriques controlees par texte (le vrai
// canvas jsdom n'expose pas actualBoundingBox*). On teste la LOGIQUE du modele.
function mockCtx(metrics) {
  return {
    font: '',
    measureText(t) {
      const m = metrics[t] || metrics._default
      return {
        fontBoundingBoxAscent: m.fBBA, fontBoundingBoxDescent: m.fBBD,
        actualBoundingBoxAscent: m.aA, actualBoundingBoxDescent: m.aD,
      }
    },
  }
}
const base = { family: 'x', weight: 700, size1: 40, size2: 20 }

describe('labelLineGapPx', () => {
  it('retourne 0 quand il n y a pas de ligne 2', () => {
    expect(labelLineGapPx({ ...base, line1: 'Emma', line2: '' })).toBe(0)
    expect(labelLineGapPx({ ...base, line1: 'Emma', line2: '   ' })).toBe(0)
  })

  it('pousse la ligne 2 plus bas quand la ligne 1 a une descendante marquee', () => {
    const noDesc = mockCtx({ _default: { fBBA: 32, fBBD: 8, aA: 28, aD: 4 } })
    const bigDesc = mockCtx({ Gregory: { fBBA: 32, fBBD: 8, aA: 28, aD: 18 }, _default: { fBBA: 32, fBBD: 8, aA: 28, aD: 4 } })
    const gapNo = labelLineGapPx({ ...base, line1: 'Anna', line2: 'x', ctx: noDesc })
    const gapBig = labelLineGapPx({ ...base, line1: 'Gregory', line2: 'x', ctx: bigDesc })
    expect(gapBig).toBeGreaterThan(gapNo) // la descendante impose plus de marge -> jamais de chevauchement
  })

  it('ne renvoie jamais une marge negative (pas de resserrement qui chevauche)', () => {
    const tall = mockCtx({ _default: { fBBA: 100, fBBD: 5, aA: 5, aD: 0 } })
    expect(labelLineGapPx({ ...base, line1: 'A', line2: 'B', ctx: tall })).toBeGreaterThanOrEqual(0)
  })

  it('respecte le plafond anti-debordement (maxGapPx)', () => {
    const huge = mockCtx({ _default: { fBBA: 10, fBBD: 40, aA: 40, aD: 40 } })
    expect(labelLineGapPx({ ...base, line1: 'A', line2: 'B', ctx: huge, maxGapPx: 12 })).toBeLessThanOrEqual(12)
  })

  it('repli sans DOM ni ctx : valeur proportionnelle positive', () => {
    const g = labelLineGapPx({ ...base, line1: 'Emma', line2: 'Tremblay' }) // pas de ctx, pas de document en test node
    expect(g).toBeGreaterThan(0)
  })
})
