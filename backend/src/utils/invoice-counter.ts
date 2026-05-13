/**
 * Helper atomique pour generer des invoiceNumber au format MM-AAAA-XXXX
 * SANS race condition. Resout A6.
 *
 * Avant ce helper, chaque call site faisait :
 *   1. SELECT max(invoice_number) WHERE prefix = 'MM-2026-'
 *   2. parse + increment en memoire
 *   3. UPDATE orders SET invoice_number = ...
 * Entre 1 et 3, un webhook concurrent pouvait lire le meme max et generer
 * le MEME numero -> contrainte UNIQUE rejetee -> commande payee stuck en
 * 'draft'.
 *
 * Le helper utilise la table `invoice_counters` (cf. migration
 * 2026.05.13.00.00.00-invoice-counter.js) avec un UPSERT atomique :
 *   INSERT INTO invoice_counters (year, seq) VALUES (?, 1)
 *   ON CONFLICT (year) DO UPDATE SET seq = invoice_counters.seq + 1
 *   RETURNING seq
 *
 * Postgres et SQLite >= 3.24 (3.35+ pour RETURNING) garantissent que deux
 * appels concurrents recoivent toujours deux `seq` distincts. La table est
 * seedee depuis les invoice_number existants par la migration, donc le 1er
 * appel post-migration genere un numero STRICTEMENT superieur a l'historique.
 *
 * Format de sortie strictement preserve : `MM-{4 chiffres annee}-{4 chiffres seq}`
 */
export async function nextInvoiceNumber(year?: number): Promise<string> {
  const targetYear = year ?? new Date().getFullYear();
  const knex = (strapi.db as any).connection;
  const client = String(knex.client.config.client || '').toLowerCase();
  const isPostgres = client === 'postgres' || client === 'pg' || client === 'postgresql';

  let seq: number;

  if (isPostgres) {
    // PG : UPSERT + RETURNING en une seule requete atomique. La contrainte
    // PK sur (year) garantit qu'un seul caller insere, les autres font UPDATE.
    const result = await knex.raw(
      `INSERT INTO invoice_counters (year, seq) VALUES (?, 1)
       ON CONFLICT (year) DO UPDATE SET seq = invoice_counters.seq + 1
       RETURNING seq`,
      [targetYear],
    );
    seq = Number(result?.rows?.[0]?.seq) || 1;
  } else {
    // SQLite (dev) : UPSERT supporte depuis 3.24, RETURNING depuis 3.35.
    // On enveloppe dans une transaction pour serialiser le SELECT post-UPSERT
    // (SQLite acquiert un write lock pour toute la duree de la transaction,
    // donc le SELECT lit notre propre write sans risque de re-lecture).
    seq = await knex.transaction(async (trx: any) => {
      await trx.raw(
        `INSERT INTO invoice_counters (year, seq) VALUES (?, 1)
         ON CONFLICT (year) DO UPDATE SET seq = invoice_counters.seq + 1`,
        [targetYear],
      );
      const row = await trx('invoice_counters').where({ year: targetYear }).first('seq');
      return Number(row?.seq) || 1;
    });
  }

  return `MM-${targetYear}-${String(seq).padStart(4, '0')}`;
}
