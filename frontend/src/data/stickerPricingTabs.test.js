/**
 * Tests unitaires pour buildStickerPricingTabs (tableaux publics de tarifs
 * stickers, /services/stickers). Logique pure, zero fetch, zero mock.
 *
 * Run : cd frontend && npm run test
 *
 * Garantit que la page publique reste alignee sur STICKER_GRID (SSOT) :
 * si une grille change, ces valeurs changent avec elle, seuls les formats
 * et la structure sont verifies en dur ici.
 */
import { describe, it, expect } from 'vitest'
import { buildStickerPricingTabs } from './stickerPricingTabs'
import { STICKER_GRID } from '../utils/pricingData'

const TAB_IDS = ['standard', 'medium', 'large']

describe('buildStickerPricingTabs - structure', () => {
  const tabs = buildStickerPricingTabs('fr')

  it('3 tabs de taille dans l ordre standard/medium/large', () => {
    expect(tabs.map((t) => t.id)).toEqual(TAB_IDS)
  })

  it('3 tables par tab dans l ordre Sans finition / Clear / Finitions', () => {
    for (const tab of tabs) {
      expect(tab.tables).toHaveLength(3)
      expect(tab.tables[0].subtitle).toBe('Sans finition')
      expect(tab.tables[1].subtitle).toBe('Clear')
      expect(tab.tables[2].subtitle).toMatch(/^Finitions \(/)
    }
  })

  it('5 lignes de quantites 25/50/100/250/500 par table', () => {
    for (const tab of tabs) {
      for (const table of tab.tables) {
        expect(table.rows.map((r) => r[0])).toEqual(['25', '50', '100', '250', '500'])
      }
    }
  })

  it('aucun tiret cadratin ni semi-cadratin dans le rendu', () => {
    const all = JSON.stringify(buildStickerPricingTabs('fr')) +
      JSON.stringify(buildStickerPricingTabs('en')) +
      JSON.stringify(buildStickerPricingTabs('es'))
    expect(all).not.toMatch(/[–—]/)
  })
})

describe('buildStickerPricingTabs - valeurs depuis STICKER_GRID (SSOT)', () => {
  const tabs = buildStickerPricingTabs('fr')
  const table = (tier, kindIndex) => tabs.find((t) => t.id === tier).tables[kindIndex]

  it('standard : matte 25 = 25 $, clear 100 = 90 $, fx 500 = 400 $', () => {
    expect(table('standard', 0).rows[0][1]).toBe('25 $')
    expect(table('standard', 1).rows[2][1]).toBe('90 $')
    expect(table('standard', 2).rows[4][1]).toBe('400 $')
  })

  it('decimales quebecoises : standard matte 250 = 187,50 $ / clear 25 = 27,50 $', () => {
    expect(table('standard', 0).rows[3][1]).toBe('187,50 $')
    expect(table('standard', 1).rows[0][1]).toBe('27,50 $')
  })

  it('medium clear 50 = 72,50 $ (midpoint), large fx 500 = 785 $', () => {
    expect(table('medium', 1).rows[1][1]).toBe('72,50 $')
    expect(table('large', 2).rows[4][1]).toBe('785 $')
  })

  it('prix unitaire FR : matte standard 25 -> 1,00 $/u', () => {
    expect(table('standard', 0).rows[0][2]).toBe('1,00 $/u')
  })

  it('toutes les valeurs proviennent de STICKER_GRID (aucune divergence)', () => {
    const kinds = ['matte', 'intermediate', 'fx']
    for (const tab of tabs) {
      tab.tables.forEach((tbl, k) => {
        tbl.rows.forEach((row) => {
          const qty = Number(row[0])
          const expected = STICKER_GRID[tab.id][kinds[k]][qty]
          const rendered = Number(row[1].replace(' $', '').replace(',', '.'))
          expect(rendered).toBe(expected)
        })
      })
    }
  })

  it('ordre strict des groupes a chaque palier : matte < clear < fx', () => {
    for (const tab of tabs) {
      for (let i = 0; i < 5; i++) {
        const val = (k) => Number(tab.tables[k].rows[i][1].replace(' $', '').replace(',', '.'))
        expect(val(0)).toBeLessThan(val(1))
        expect(val(1)).toBeLessThan(val(2))
      }
    }
  })
})

describe('buildStickerPricingTabs - formats par langue', () => {
  it('FR : suffixe quebecois avec espace (25 $)', () => {
    const fr = buildStickerPricingTabs('fr')
    expect(fr[0].tables[0].rows[0][1]).toBe('25 $')
    expect(fr[0].tables[0].headers).toEqual(['Qté', 'Prix', 'Prix/u'])
  })

  it('EN : prefixe anglo conserve ($25, $187.50, $1.00/u)', () => {
    const en = buildStickerPricingTabs('en')
    expect(en[0].tables[0].rows[0][1]).toBe('$25')
    expect(en[0].tables[0].rows[3][1]).toBe('$187.50')
    expect(en[0].tables[0].rows[0][2]).toBe('$1.00/u')
    expect(en[0].tables[0].subtitle).toBe('No finish')
  })

  it('ES : prefixe conserve + libelles espagnols', () => {
    const es = buildStickerPricingTabs('es')
    expect(es[0].tables[0].rows[0][1]).toBe('$25')
    expect(es[0].tables[0].subtitle).toBe('Sin acabado')
    expect(es[0].tables[0].headers).toEqual(['Cant.', 'Precio', 'Precio/u'])
  })

  it('langue inconnue -> fallback FR', () => {
    expect(buildStickerPricingTabs('de')[0].tables[0].rows[0][1]).toBe('25 $')
  })
})
