import { describe, it, expect } from 'vitest'
import { ETIQUETTE_THEMES, KIDS_SAFE, themeSlugs } from './etiquettes'
import { MASSIVE_STICKERS } from './massiveStickers'

/**
 * Integrite de ETIQUETTE_THEMES (chips du configurateur Mini Massive).
 *
 * POURQUOI CES TESTS : la liste est editable a la main par Mika. Un slug mal
 * tape, un design retire de KIDS_SAFE, ou un doublon ne se voient PAS a l'oeil
 * et ne cassent PAS le build : la chip afficherait juste un compte faux ou une
 * vignette 404. Ces tests attrapent ca au CI, pas en prod.
 */
describe('ETIQUETTE_THEMES', () => {
  const catalogue = new Set(MASSIVE_STICKERS.map((s) => s.slug))
  const kids = new Set(KIDS_SAFE)

  it('a 9 themes, chacun avec un id et un nom FR/EN/ES', () => {
    expect(ETIQUETTE_THEMES).toHaveLength(9)
    for (const t of ETIQUETTE_THEMES) {
      expect(t.id, `theme sans id`).toBeTruthy()
      for (const l of ['fr', 'en', 'es']) {
        expect(t.name[l], `${t.id} : nom ${l} manquant`).toBeTruthy()
      }
    }
  })

  it('a des ids uniques', () => {
    const ids = ETIQUETTE_THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ne reference que des slugs qui existent au catalogue', () => {
    const fantomes = ETIQUETTE_THEMES.flatMap((t) =>
      t.slugs.filter((s) => !catalogue.has(s)).map((s) => `${t.id} -> ${s}`))
    expect(fantomes, 'slugs inconnus du catalogue').toEqual([])
  })

  it('ne reference que des slugs presents dans KIDS_SAFE', () => {
    const horsKids = ETIQUETTE_THEMES.flatMap((t) =>
      t.slugs.filter((s) => !kids.has(s)).map((s) => `${t.id} -> ${s}`))
    expect(horsKids, 'slugs hors KIDS_SAFE (chip afficherait un design non-kids)').toEqual([])
  })

  it('n a pas de doublon a l interieur d un theme', () => {
    for (const t of ETIQUETTE_THEMES) {
      expect(new Set(t.slugs).size, `${t.id} contient un doublon`).toBe(t.slugs.length)
    }
  })

  it('respecte la regle Mika : un design dans 2 themes MAX', () => {
    const n = {}
    for (const t of ETIQUETTE_THEMES) for (const s of t.slugs) n[s] = (n[s] || 0) + 1
    const trop = Object.entries(n).filter(([, c]) => c > 2).map(([s, c]) => `${s} (${c})`)
    expect(trop, 'designs dans plus de 2 themes').toEqual([])
  })

  it('a des themes non vides', () => {
    for (const t of ETIQUETTE_THEMES) {
      expect(themeSlugs(t.id).length, `${t.id} est vide`).toBeGreaterThan(0)
    }
  })

  it('themeSlugs() filtre sur KIDS_SAFE et retombe sur tout si l id est inconnu', () => {
    for (const t of ETIQUETTE_THEMES) {
      expect(themeSlugs(t.id).every((s) => kids.has(s))).toBe(true)
    }
    expect(themeSlugs('id-qui-nexiste-pas')).toEqual(KIDS_SAFE)
  })

  it('KIDS_SAFE lui-meme est propre (pas de doublon, tous au catalogue)', () => {
    expect(new Set(KIDS_SAFE).size, 'doublon dans KIDS_SAFE').toBe(KIDS_SAFE.length)
    expect(KIDS_SAFE.filter((s) => !catalogue.has(s)), 'slugs KIDS_SAFE inconnus').toEqual([])
  })
})
