'use strict';

/**
 * INVOICE-COUNTER-A6 (2026-05-13)
 *
 * Cree la table `invoice_counters` qui sert de compteur atomique par annee
 * pour la generation des invoiceNumber (format MM-AAAA-XXXX).
 *
 * Resout A6 : avant cette migration, chaque generation de invoiceNumber
 * faisait un read-modify-write (SELECT MAX -> parse -> increment -> UPDATE)
 * sans verrou. Sous concurrence (2 webhooks Stripe paralleles, retry post-
 * cold-start Render, etc.), deux handlers pouvaient lire la meme valeur
 * et generer le MEME numero, violant la contrainte UNIQUE sur
 * orders.invoice_number et invoices.invoice_number -> le 2e crash, son
 * order reste stuck en 'draft' alors que le paiement Stripe est confirme.
 *
 * Le helper `nextInvoiceNumber()` (cf. backend/src/utils/invoice-counter.ts)
 * utilise un UPSERT atomique sur cette table :
 *   INSERT INTO invoice_counters (year, seq) VALUES (?, 1)
 *   ON CONFLICT (year) DO UPDATE SET seq = invoice_counters.seq + 1
 *   RETURNING seq
 * -> garanti par Postgres/SQLite (>= 3.24) qu'aucun deux callers ne
 * recoivent jamais le meme `seq`. Plus de collision possible.
 *
 * SEED : on lit le MAX existant dans orders.invoice_number + invoices.
 * invoice_number par annee, et on insere ces valeurs dans invoice_counters
 * pour que le prochain appel a nextInvoiceNumber genere un numero
 * STRICTEMENT superieur a tout numero deja en BDD (pas de collision avec
 * l'historique).
 */

module.exports = {
  async up(knex) {
    // 1. Creer la table (compatible PG + SQLite >= 3.24)
    const exists = await knex.schema.hasTable('invoice_counters');
    if (!exists) {
      await knex.schema.createTable('invoice_counters', (t) => {
        t.integer('year').primary();
        t.integer('seq').notNullable().defaultTo(0);
      });
    }

    // 2. Seed depuis l'existant. On extrait year+seq via regex JS pour eviter
    //    les fonctions SQL specifiques (SUBSTRING differe entre PG et SQLite).
    const ordersRows = await knex('orders')
      .whereNotNull('invoice_number')
      .select('invoice_number')
      .catch(() => []);
    let invoicesRows = [];
    try {
      const hasInvoicesTable = await knex.schema.hasTable('invoices');
      if (hasInvoicesTable) {
        invoicesRows = await knex('invoices')
          .whereNotNull('invoice_number')
          .select('invoice_number');
      }
    } catch (_e) {
      invoicesRows = [];
    }

    const maxByYear = new Map();
    const regex = /^MM-(\d{4})-(\d{4})$/;
    for (const row of [...ordersRows, ...invoicesRows]) {
      const m = String(row.invoice_number || '').match(regex);
      if (!m) continue;
      const year = parseInt(m[1], 10);
      const seq = parseInt(m[2], 10);
      if (!Number.isFinite(year) || !Number.isFinite(seq)) continue;
      const current = maxByYear.get(year) || 0;
      if (seq > current) maxByYear.set(year, seq);
    }

    // 3. Upsert le max par annee (idempotent : on prend le GREATEST en cas de
    //    re-run de la migration).
    for (const [year, seq] of maxByYear.entries()) {
      const existing = await knex('invoice_counters').where({ year }).first();
      if (existing) {
        if ((existing.seq || 0) < seq) {
          await knex('invoice_counters').where({ year }).update({ seq });
        }
      } else {
        await knex('invoice_counters').insert({ year, seq });
      }
    }
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('invoice_counters');
  },
};
