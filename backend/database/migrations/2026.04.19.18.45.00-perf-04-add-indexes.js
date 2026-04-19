'use strict';

/**
 * PERF-04: index Postgres explicites sur les colonnes frequemment filtrees.
 *
 * Strapi ajoute automatiquement un index sur `id`, `document_id` et les attributs
 * `unique: true` (donc stripe_payment_intent_id deja couvert). Les autres colonnes
 * utilisees dans les filtres/sorts/joins n'ont aucun index - a 50K+ rows un
 * findMany({ filters: { customerEmail: 'x' } }) peut prendre 500ms+.
 *
 * Les indexes sont crees avec IF NOT EXISTS pour l'idempotence (la migration peut
 * etre re-executee sans exploser). Strapi wrappe la migration dans une transaction
 * knex - CREATE INDEX CONCURRENTLY n'est pas compatible, on utilise la forme simple
 * (volume actuel permet un brief lock table).
 */
module.exports = {
  async up(knex) {
    // --- orders ---
    // Hot paths:
    //   - stats() GROUP BY status (PERF-03)
    //   - adminList ORDER BY created_at DESC + filter status
    //   - myOrders WHERE supabase_user_id = ?
    //   - webhook lookup by stripe_checkout_session_id
    //   - reconcile-stripe cron filtering by status + created_at
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(LOWER(customer_email))');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session_id ON orders(stripe_checkout_session_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders(created_at DESC)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_orders_supabase_user_id ON orders(supabase_user_id)');

    // --- qr_scans ---
    // listWithScans fait N+1 findMany({ qrCode: { documentId: X } }) - meme avec
    // l'eventuelle refacto future vers GROUP BY, un index sur la FK est requis.
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_code_id ON qr_scans(qr_code_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at_desc ON qr_scans(scanned_at DESC)');

    // --- qr_codes ---
    // redirect() fait findFirst by short_id sur tous les scans - index pour le
    // hot path public /api/qr/:shortId
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_qr_codes_short_id ON qr_codes(short_id)');

    // --- withdrawal_requests ---
    // myRequests filter par email + status IN ('pending', 'processing')
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_email ON withdrawal_requests(LOWER(email))');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status)');

    // --- user_roles ---
    // byEmail + setRole lookup par email (case-insensitive)
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(LOWER(email))');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_user_roles_supabase_user_id ON user_roles(supabase_user_id)');
  },

  async down(knex) {
    // Rollback - DROP IF EXISTS pour ne pas crasher si l'index n'a jamais ete cree
    await knex.raw('DROP INDEX IF EXISTS idx_orders_status');
    await knex.raw('DROP INDEX IF EXISTS idx_orders_status_created_at');
    await knex.raw('DROP INDEX IF EXISTS idx_orders_customer_email');
    await knex.raw('DROP INDEX IF EXISTS idx_orders_stripe_checkout_session_id');
    await knex.raw('DROP INDEX IF EXISTS idx_orders_created_at_desc');
    await knex.raw('DROP INDEX IF EXISTS idx_orders_supabase_user_id');
    await knex.raw('DROP INDEX IF EXISTS idx_qr_scans_qr_code_id');
    await knex.raw('DROP INDEX IF EXISTS idx_qr_scans_scanned_at_desc');
    await knex.raw('DROP INDEX IF EXISTS idx_qr_codes_short_id');
    await knex.raw('DROP INDEX IF EXISTS idx_withdrawal_requests_email');
    await knex.raw('DROP INDEX IF EXISTS idx_withdrawal_requests_status');
    await knex.raw('DROP INDEX IF EXISTS idx_user_roles_email');
    await knex.raw('DROP INDEX IF EXISTS idx_user_roles_supabase_user_id');
  },
};
