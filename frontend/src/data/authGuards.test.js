/**
 * AUDIT-ENDPOINTS (17 juillet 2026) - comportement des gardes d'auth.
 *
 * C1/C2/C3 ont ajoute `if (!(await requireAdminAuth(ctx))) return;` (ou
 * requireUserAuth) en tete des handlers admin/self-service qui etaient publics.
 * Ce test verrouille le CONTRAT de ces gardes : 401 sans token, laisse passer
 * avec un token valide. C'est le mecanisme que chaque endpoint corrige appelle.
 * La preuve PAR endpoint (401 en prod) est faite par sonde live post-deploiement.
 *
 * Import direct du module serveur (meme pattern que skuRegistry.test.js).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { requireAdminAuth, requireUserAuth } from '../../../backend/src/utils/auth'

// ctx minimal facon Koa/Strapi : headers + status + body.
const mkCtx = (authHeader) => ({
  request: { headers: authHeader ? { authorization: authHeader } : {} },
  state: {},
  status: 200,
  body: undefined,
  method: 'GET',
  url: '/test',
})

const TOKEN = 'test-admin-service-token-1234567890'
const OLD = {}
beforeEach(() => {
  // `strapi` est un global du runtime Strapi ; auth.ts logue via strapi.log.warn
  // sur le chemin de refus. En vitest il n'existe pas -> on le stub.
  globalThis.strapi = { log: { warn: () => {}, info: () => {} } }
  OLD.token = process.env.ADMIN_API_TOKEN
  OLD.emails = process.env.ADMIN_EMAILS
  process.env.ADMIN_API_TOKEN = TOKEN
  // pas de SUPABASE_URL en test -> l'option JWT est court-circuitee, on teste le service token
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_API_URL
})
afterEach(() => {
  if (OLD.token === undefined) delete process.env.ADMIN_API_TOKEN; else process.env.ADMIN_API_TOKEN = OLD.token
  if (OLD.emails === undefined) delete process.env.ADMIN_EMAILS; else process.env.ADMIN_EMAILS = OLD.emails
})

describe('requireAdminAuth', () => {
  it('401 sans header Authorization', async () => {
    const ctx = mkCtx(null)
    const ok = await requireAdminAuth(ctx)
    expect(ok).toBe(false)
    expect(ctx.status).toBe(401)
  })

  it('401 avec un token bidon', async () => {
    const ctx = mkCtx('Bearer pas-le-bon-token')
    const ok = await requireAdminAuth(ctx)
    expect(ok).toBe(false)
    expect(ctx.status).toBe(401)
  })

  it('laisse passer avec le service token admin (Bearer)', async () => {
    const ctx = mkCtx(`Bearer ${TOKEN}`)
    const ok = await requireAdminAuth(ctx)
    expect(ok).toBe(true)
    expect(ctx.status).toBe(200)
    expect(ctx.state.adminAuthMethod).toBe('service-token')
  })
})

describe('requireUserAuth', () => {
  it('401 sans header Authorization', async () => {
    const ctx = mkCtx(null)
    const ok = await requireUserAuth(ctx)
    expect(ok).toBe(false)
    expect(ctx.status).toBe(401)
  })

  it('laisse passer avec le service token (traite comme admin)', async () => {
    const ctx = mkCtx(`Bearer ${TOKEN}`)
    const ok = await requireUserAuth(ctx)
    expect(ok).toBe(true)
    expect(ctx.state.user?.isAdmin).toBe(true)
  })
})
