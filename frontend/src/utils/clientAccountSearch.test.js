/**
 * Tests unitaires pour le filtrage local de l'autocomplete client
 * (commande manuelle admin). Logique pure, aucun fetch, aucun mock.
 *
 * Run : cd frontend && npm run test
 */
import { describe, it, expect } from 'vitest'
import {
  filterClientAccounts,
  normalizeSearchText,
  CLIENT_SEARCH_MAX_RESULTS,
} from './clientAccountSearch'

const ACCOUNTS = [
  { fullName: 'Jerome Tremblay', email: 'jerome@example.com', company: 'La Presse Inc.', phone: '(514) 555-1234' },
  { fullName: 'Marie-Ève Côté', email: 'mev@studio.ca', company: '', phone: '' },
  { fullName: '', email: 'zorro@masque.mx', company: 'Zorro SA', phone: '4385551234' },
]

describe('normalizeSearchText', () => {
  it('minuscules + accents retires', () => {
    expect(normalizeSearchText('Côté ÉÀÜ')).toBe('cote eau')
  })
  it('tolere null/undefined', () => {
    expect(normalizeSearchText(null)).toBe('')
    expect(normalizeSearchText(undefined)).toBe('')
  })
})

describe('filterClientAccounts', () => {
  it('moins de 2 caracteres -> aucun resultat', () => {
    expect(filterClientAccounts(ACCOUNTS, 'j')).toEqual([])
    expect(filterClientAccounts(ACCOUNTS, '  ')).toEqual([])
    expect(filterClientAccounts(ACCOUNTS, '')).toEqual([])
  })

  it('match sur le nom, insensible casse et accents', () => {
    expect(filterClientAccounts(ACCOUNTS, 'cote')).toHaveLength(1)
    expect(filterClientAccounts(ACCOUNTS, 'JEROME')).toHaveLength(1)
  })

  it('match sur le courriel', () => {
    const r = filterClientAccounts(ACCOUNTS, 'zorro@')
    expect(r).toHaveLength(1)
    expect(r[0].email).toBe('zorro@masque.mx')
  })

  it('match sur l entreprise', () => {
    const r = filterClientAccounts(ACCOUNTS, 'presse')
    expect(r).toHaveLength(1)
    expect(r[0].company).toBe('La Presse Inc.')
  })

  it('match telephone malgre les formats differents', () => {
    expect(filterClientAccounts(ACCOUNTS, '514 555')).toHaveLength(1)
    expect(filterClientAccounts(ACCOUNTS, '5551234')).toHaveLength(2)
  })

  it('terme inexistant -> liste vide (saisie manuelle possible)', () => {
    expect(filterClientAccounts(ACCOUNTS, 'xyz introuvable')).toEqual([])
  })

  it('cap au maximum de resultats pour le dropdown', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      fullName: `Client ${i}`,
      email: `c${i}@x.com`,
      company: '',
      phone: '',
    }))
    expect(filterClientAccounts(many, 'client')).toHaveLength(CLIENT_SEARCH_MAX_RESULTS)
  })

  it('tolere une liste null sans planter', () => {
    expect(filterClientAccounts(null, 'abc')).toEqual([])
  })
})
