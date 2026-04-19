'use strict';

/**
 * PERF-04: index Postgres explicites sur les colonnes frequemment filtrees.
 *
 * V2 (hotfix 2026-04-19 post-deploy): chaque CREATE INDEX est wrappe dans un
 * bloc DO qui verifie que la colonne existe via information_schema.columns.
 * La v1 avait ete naive sur qr_scans.qr_code_id: Strapi v5 route les relations
 * manyToOne via une TABLE DE LIAISON (qr_scans_qr_code_lnk ou similaire), pas
 * une FK directe. Le CREATE INDEX plantait, la migration throw, Strapi crash
 * au boot -> tous les deploys subsequents cascade-failed.
 *
 * Design v2:
 *   - DO $$ ... END $$ par index, check colonne avant CREATE
 *   - pg_class.reltype lookup pour les tables (eviter table inexistante)
 *   - IF NOT EXISTS sur le CREATE INDEX pour idempotence cross-retry
 *   - Tout passe dans UNE SEULE transaction knex (pas CONCURRENTLY)
 *   - Silent skip si une table/colonne manque -> pas de crash deploy
 *
 * Pour les relations via link table: on skippe pour l'instant, chantier
 * separé PERF-04b qui identifiera les tables _lnk et les indexera correctement.
 */

// Helper: genere le SQL defensif pour creer un index seulement si toutes
// les colonnes referencees existent dans la table cible.
function safeCreateIndex(indexName, tableName, columns) {
  // columns peut etre une string simple ("status") ou une expression ("LOWER(email)")
  // Pour le check information_schema, on extrait les identifiants alphanumeriques.
  const colNames = Array.isArray(columns) ? columns : [columns];
  const rawColumnExprs = colNames.map((c) => String(c));
  const columnList = rawColumnExprs.join(', ');

  // Extraire les noms de colonnes purs pour le check. "LOWER(customer_email)" -> "customer_email".
  // "status, created_at DESC" -> ["status", "created_at"].
  const identifiersToCheck = new Set();
  for (const expr of rawColumnExprs) {
    const matches = expr.match(/[a-z_][a-z0-9_]*/gi) || [];
    for (const m of matches) {
      const lower = m.toLowerCase();
      // Skippe les mots-cles SQL pour garder juste les identifiants colonne.
      if (!['lower', 'upper', 'desc', 'asc', 'nulls', 'first', 'last'].includes(lower)) {
        identifiersToCheck.add(lower);
      }
    }
  }

  const existenceChecks = Array.from(identifiersToCheck)
    .map((col) => `column_name = '${col}'`)
    .join(' OR ');

  const expectedCount = identifiersToCheck.size;

  return `
    DO $$
    BEGIN
      IF (
        SELECT COUNT(*) FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = '${tableName}'
          AND (${existenceChecks})
      ) = ${expectedCount} THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columnList})';
      ELSE
        RAISE NOTICE 'Skipping index ${indexName}: column(s) missing on ${tableName}';
      END IF;
    END $$;
  `;
}

module.exports = {
  async up(knex) {
    // --- orders ---
    await knex.raw(safeCreateIndex('idx_orders_status', 'orders', 'status'));
    await knex.raw(safeCreateIndex('idx_orders_status_created_at', 'orders', 'status, created_at DESC'));
    await knex.raw(safeCreateIndex('idx_orders_customer_email', 'orders', 'LOWER(customer_email)'));
    await knex.raw(safeCreateIndex('idx_orders_stripe_checkout_session_id', 'orders', 'stripe_checkout_session_id'));
    await knex.raw(safeCreateIndex('idx_orders_created_at_desc', 'orders', 'created_at DESC'));
    await knex.raw(safeCreateIndex('idx_orders_supabase_user_id', 'orders', 'supabase_user_id'));

    // --- qr_scans ---
    // qr_code_id: FK potentielle si Strapi utilise FK directe, absent si via table de
    // liaison. Le safeCreateIndex skip automatiquement si la colonne n'existe pas.
    await knex.raw(safeCreateIndex('idx_qr_scans_qr_code_id', 'qr_scans', 'qr_code_id'));
    await knex.raw(safeCreateIndex('idx_qr_scans_scanned_at_desc', 'qr_scans', 'scanned_at DESC'));

    // --- qr_codes ---
    await knex.raw(safeCreateIndex('idx_qr_codes_short_id', 'qr_codes', 'short_id'));

    // --- withdrawal_requests ---
    await knex.raw(safeCreateIndex('idx_withdrawal_requests_email', 'withdrawal_requests', 'LOWER(email)'));
    await knex.raw(safeCreateIndex('idx_withdrawal_requests_status', 'withdrawal_requests', 'status'));

    // --- user_roles ---
    await knex.raw(safeCreateIndex('idx_user_roles_email', 'user_roles', 'LOWER(email)'));
    await knex.raw(safeCreateIndex('idx_user_roles_supabase_user_id', 'user_roles', 'supabase_user_id'));
  },

  async down(knex) {
    // Rollback - DROP IF EXISTS pour ne pas crasher si l'index n'a jamais ete cree
    const indexes = [
      'idx_orders_status',
      'idx_orders_status_created_at',
      'idx_orders_customer_email',
      'idx_orders_stripe_checkout_session_id',
      'idx_orders_created_at_desc',
      'idx_orders_supabase_user_id',
      'idx_qr_scans_qr_code_id',
      'idx_qr_scans_scanned_at_desc',
      'idx_qr_codes_short_id',
      'idx_withdrawal_requests_email',
      'idx_withdrawal_requests_status',
      'idx_user_roles_email',
      'idx_user_roles_supabase_user_id',
    ];
    for (const name of indexes) {
      await knex.raw(`DROP INDEX IF EXISTS ${name}`);
    }
  },
};
