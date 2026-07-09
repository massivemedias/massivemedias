/**
 * ADMIN-VISITORS : tests des helpers de comptage (backend/src/utils/ip-hash.ts,
 * module pur sans dependance Strapi). Importe le VRAI code serveur.
 *
 * Loi 25 : le hash ne doit JAMAIS etre reversible trivialement et ne jamais
 * exposer l'IP en clair.
 */
import { describe, it, expect } from 'vitest'
import {
  hashIpSalted,
  normalizeWindow,
  countDistinctVisitors,
  extractClientIp,
  VISITOR_WINDOWS,
} from '../../../backend/src/utils/ip-hash'

describe('hashIpSalted (Loi 25)', () => {
  it('produit un sha256 de 64 hex, jamais l IP en clair', () => {
    const h = hashIpSalted('24.201.55.10', 'sel-secret')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(h).not.toContain('24.201')
  })
  it('deterministe : meme IP + meme sel -> meme hash', () => {
    expect(hashIpSalted('1.2.3.4', 's')).toBe(hashIpSalted('1.2.3.4', 's'))
  })
  it('le sel change tout : meme IP, sel different -> hash different', () => {
    expect(hashIpSalted('1.2.3.4', 'a')).not.toBe(hashIpSalted('1.2.3.4', 'b'))
  })
  it('sans sel ou sans IP -> chaine vide (on ne stocke pas un hash faible)', () => {
    expect(hashIpSalted('1.2.3.4', '')).toBe('')
    expect(hashIpSalted('', 'sel')).toBe('')
  })
  it('normalise le prefixe IPv6-mapped ::ffff:', () => {
    expect(hashIpSalted('::ffff:1.2.3.4', 's')).toBe(hashIpSalted('1.2.3.4', 's'))
  })
})

describe('normalizeWindow', () => {
  it('accepte 1h / 3h / 24h', () => {
    expect(normalizeWindow('1h')).toBe('1h')
    expect(normalizeWindow('3h')).toBe('3h')
    expect(normalizeWindow('24h')).toBe('24h')
  })
  it('defaut 3h pour toute valeur inconnue/absente', () => {
    expect(normalizeWindow('7h')).toBe('3h')
    expect(normalizeWindow('')).toBe('3h')
    expect(normalizeWindow(undefined)).toBe('3h')
    expect(normalizeWindow('DROP TABLE')).toBe('3h')
  })
  it('les 3 fenetres ont les bonnes durees en ms', () => {
    expect(VISITOR_WINDOWS['1h']).toBe(3600000)
    expect(VISITOR_WINDOWS['3h']).toBe(10800000)
    expect(VISITOR_WINDOWS['24h']).toBe(86400000)
  })
})

describe('countDistinctVisitors', () => {
  const now = 1_700_000_000_000
  const minsAgo = (m) => new Date(now - m * 60000).toISOString()

  it('compte les ipHash DISTINCTS dans la fenetre', () => {
    const hits = [
      { ipHash: 'aaa', hitAt: minsAgo(10) },
      { ipHash: 'aaa', hitAt: minsAgo(5) }, // meme visiteur, 2 pages
      { ipHash: 'bbb', hitAt: minsAgo(20) },
      { ipHash: 'ccc', hitAt: minsAgo(30) },
    ]
    expect(countDistinctVisitors(hits, '1h', now)).toBe(3)
  })
  it('exclut les hits hors fenetre', () => {
    const hits = [
      { ipHash: 'aaa', hitAt: minsAgo(30) },  // dans 1h
      { ipHash: 'bbb', hitAt: minsAgo(90) },  // hors 1h, dans 3h
      { ipHash: 'ccc', hitAt: minsAgo(200) }, // hors 3h, dans 24h
    ]
    expect(countDistinctVisitors(hits, '1h', now)).toBe(1)
    expect(countDistinctVisitors(hits, '3h', now)).toBe(2)
    expect(countDistinctVisitors(hits, '24h', now)).toBe(3)
  })
  it('ignore les hits sans ipHash (salt absent au moment du hit)', () => {
    const hits = [
      { ipHash: '', hitAt: minsAgo(5) },
      { ipHash: undefined, hitAt: minsAgo(5) },
      { ipHash: 'zzz', hitAt: minsAgo(5) },
    ]
    expect(countDistinctVisitors(hits, '1h', now)).toBe(1)
  })
  it('liste vide -> 0', () => {
    expect(countDistinctVisitors([], '24h', now)).toBe(0)
  })
  it('fenetre inconnue -> retombe sur 3h (pas de crash)', () => {
    const hits = [{ ipHash: 'a', hitAt: minsAgo(100) }]
    expect(countDistinctVisitors(hits, 'bogus', now)).toBe(1)
  })
})

describe('extractClientIp (proxy Cloudflare/Render)', () => {
  it('priorite cf-connecting-ip (Cloudflare)', () => {
    const ctx = { request: { headers: { 'cf-connecting-ip': '24.1.1.1', 'x-forwarded-for': '10.0.0.1, 172.16.0.1' } }, ip: '192.168.1.1' }
    expect(extractClientIp(ctx)).toBe('24.1.1.1')
  })
  it('fallback x-forwarded-for[0] si pas de cf', () => {
    const ctx = { request: { headers: { 'x-forwarded-for': '24.2.2.2, 172.16.0.1' } }, ip: '192.168.1.1' }
    expect(extractClientIp(ctx)).toBe('24.2.2.2')
  })
  it('fallback ctx.ip si aucun header proxy', () => {
    const ctx = { request: { headers: {} }, ip: '127.0.0.1' }
    expect(extractClientIp(ctx)).toBe('127.0.0.1')
  })
  it('la meme IP client donne le meme ipHash quel que soit le hop proxy', () => {
    const salt = 'sel'
    const ctxA = { request: { headers: { 'cf-connecting-ip': '24.1.1.1', 'x-forwarded-for': '24.1.1.1, 10.0.0.5' } } }
    const ctxB = { request: { headers: { 'cf-connecting-ip': '24.1.1.1', 'x-forwarded-for': '24.1.1.1, 10.0.0.9' } } }
    expect(hashIpSalted(extractClientIp(ctxA), salt)).toBe(hashIpSalted(extractClientIp(ctxB), salt))
  })
})
