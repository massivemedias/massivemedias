// ADMIN-VISITORS (9 juillet 2026) : hash IP conforme Loi 25, partage.
// Meme algo que hashIp() de api/qr-code (sha256 sale via QR_IP_HASH_SALT).
// JAMAIS d'IP en clair stockee ou loggee : on ne garde que ce hash.
import crypto from 'crypto'

/**
 * sha256(ip_nettoyee + salt) -> 64 hex. Retourne '' si l'IP ou le salt
 * manque (sans salt le hash serait reversible par force brute, on prefere
 * ne rien stocker qu'un hash faible). Le salt vit dans QR_IP_HASH_SALT
 * (variable Render, jamais dans le code).
 */
export function hashIpSalted(ip: string, salt: string): string {
  const clean = (ip || '').replace(/^::ffff:/, '').trim()
  if (!clean || !salt) return ''
  return crypto.createHash('sha256').update(clean + salt).digest('hex')
}

/**
 * Fenetres de comptage supportees par le widget admin (heures).
 * Cle -> millisecondes. Toute cle hors de cette table est refusee.
 */
export const VISITOR_WINDOWS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
}

/**
 * Normalise une fenetre demandee par le client vers une cle valide.
 * Defaut '3h' (celle du brief) pour toute valeur inconnue/absente.
 */
export function normalizeWindow(raw: any): string {
  const key = String(raw || '').trim()
  return VISITOR_WINDOWS[key] ? key : '3h'
}

/**
 * Compte les ipHash DISTINCTS dans une liste de hits sur une fenetre.
 * Pur (testable sans DB) : recoit les hits deja charges, filtre par
 * hitAt >= now - window, deduplique les ipHash non vides.
 */
export function countDistinctVisitors(
  hits: Array<{ ipHash?: string; hitAt?: string | Date }>,
  windowKey: string,
  now: number,
): number {
  const span = VISITOR_WINDOWS[windowKey] || VISITOR_WINDOWS['3h']
  const cutoff = now - span
  const seen = new Set<string>()
  for (const h of hits) {
    if (!h.ipHash) continue
    const t = h.hitAt ? new Date(h.hitAt).getTime() : 0
    if (t >= cutoff) seen.add(h.ipHash)
  }
  return seen.size
}
