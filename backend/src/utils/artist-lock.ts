/**
 * Helper de verrouillage par artiste pour serialiser les operations
 * read-modify-write sur `artist.prints[]`. Resout A4 (double-vente piece unique).
 *
 * Contexte : 4 sites dans order.ts modifient `artist.prints` via le pattern
 * findFirst -> mutate JSON local -> documents.update. Entre le read et le
 * write il existe une fenetre (~50ms d'apres le commentaire d'origine) ou
 * un autre handler peut faire la meme operation. Si 2 webhooks Stripe
 * arrivent simultanement pour la meme piece unique, le 2eme write ecrase
 * le 1er => double-vente legale possible.
 *
 * Solution : `withArtistLock(artistDocId, fn)` garantit qu'un seul caller
 * peut etre dans la section critique pour un artiste donne.
 *
 * - Postgres (prod) : `pg_advisory_xact_lock(hashtext('artist:' + docId))`
 *   acquis dans une transaction qui englobe le callback. Le lock est
 *   cluster-wide (entre toutes les connexions du pool, donc entre tous les
 *   workers Strapi), et se libere automatiquement a la fin de la txn (ou
 *   en cas de rollback/erreur). Le callback peut utiliser strapi.documents
 *   normalement - les operations passent par d'autres connexions du pool,
 *   mais le lock bloque les autres callers de withArtistLock pour le meme
 *   artistDocId, ce qui suffit a serialiser les sections critiques.
 *
 * - SQLite (dev) : mutex chaine en-memoire. Suffit pour un dev mono-process.
 *   En production, on est toujours sur PG via Render -> chemin PG actif.
 *
 * Le helper est SAFE en cas d'erreur : finally garantit le release.
 */

// Mutex chaine pour SQLite (dev). Map cle -> derniere promise dans la chaine.
const localLocks = new Map<string, Promise<void>>();

async function withLocalLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = localLocks.get(key);
  localLocks.set(key, current);
  if (previous) {
    try {
      await previous;
    } catch {
      /* le precedent a fail, on continue quand meme */
    }
  }
  try {
    return await fn();
  } finally {
    if (localLocks.get(key) === current) {
      localLocks.delete(key);
    }
    release();
  }
}

export async function withArtistLock<T>(
  artistDocId: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!artistDocId) {
    // Pas de docId -> impossible de lock, on execute directement (le caller
    // se debrouillera, mais c'est tres improbable d'arriver ici).
    return await fn();
  }
  const knex = (strapi.db as any).connection;
  const client = String(knex.client.config.client || '').toLowerCase();
  const isPostgres = client === 'postgres' || client === 'pg' || client === 'postgresql';
  const key = `artist:${artistDocId}`;

  if (!isPostgres) {
    return await withLocalLock(key, fn);
  }

  // Postgres : on prend un advisory_xact_lock dans une transaction qui
  // englobe entierement le callback. Le lock se libere automatiquement
  // au commit/rollback de la txn (meme si fn jette).
  //
  // Note importante : le callback n'utilise PAS `trx` directement, il
  // continue d'appeler strapi.documents qui passent par d'autres connexions
  // du pool. C'est ok parce que le lock advisory est cluster-wide :
  // toute session Postgres qui appelle pg_advisory_xact_lock avec la meme
  // cle se bloque jusqu'a la fin de notre txn. Donc les operations Strapi
  // qui ne passent pas par withArtistLock peuvent toujours courir en
  // parallele, mais SI elles passent par withArtistLock pour le meme
  // artistDocId, elles attendent.
  return await knex.transaction(async (trx: any) => {
    await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', [key]);
    return await fn();
  });
}
