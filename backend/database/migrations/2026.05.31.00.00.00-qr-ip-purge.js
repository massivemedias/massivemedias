'use strict';

/**
 * QR-IP-PURGE (Loi 25, 2026-05-31)
 *
 * Contexte : avant le chantier feat/qr-ip-hash, l'endpoint public de
 * redirection (GET /api/qr/:shortId) inserait l'IP du visiteur EN CLAIR dans
 * qr_scans.ip_address. C'est une donnee personnelle au sens de la Loi 25
 * (Quebec). Comme les statistiques de scan sont destinees a etre partagees a
 * des clients, on ne doit conserver aucune IP lisible.
 *
 * Cette migration met en oeuvre l'option PURGE (recommandee) :
 *   - on VIDE le champ ip_address (-> NULL) sur toutes les rows existantes.
 *   - on perd la deduplication des visiteurs uniques SUR L'HISTORIQUE
 *     uniquement (les scans passes).
 *   - on conserve tout le reste : scanned_at, city, country, user_agent,
 *     referer, relation qrCode.
 *
 * A partir de maintenant, le controller (cf. backend/src/api/qr-code/
 * controllers/qr-code.ts -> redirect) n'ecrit plus ip_address : il ecrit
 * ip_hash (SHA-256 sale de l'IP), qui permet de compter les uniques FUTURS
 * sans jamais persister de donnee reidentifiante.
 *
 * Alternative non retenue (option HACHAGE) : hacher les IP existantes vers
 * ip_hash puis vider ip_address. Elle preserve les uniques historiques, mais
 * elle transforme une donnee qu'on n'aurait pas du conserver au lieu de la
 * supprimer. Pour la conformite, la suppression est preferable. Le code
 * complet de cette alternative est documente dans la PR/le rapport du
 * chantier, non applique ici.
 *
 * IDEMPOTENCE : la migration peut etre rejouee sans danger. Au 2e passage,
 * il ne reste plus aucune row avec ip_address non vide, donc l'UPDATE ne
 * touche rien (compte purgees = 0).
 *
 * ROLLBACK : volontairement un no-op. Les IP purgees sont irrecuperables,
 * c'est exactement l'effet recherche.
 */

module.exports = {
  async up(knex) {
    const hasTable = await knex.schema.hasTable('qr_scans');
    if (!hasTable) {
      console.log('[qr-ip-purge] table qr_scans absente, rien a faire.');
      return;
    }
    const hasCol = await knex.schema.hasColumn('qr_scans', 'ip_address');
    if (!hasCol) {
      console.log('[qr-ip-purge] colonne ip_address absente, rien a purger.');
      return;
    }

    // AVANT : compte des rows ou une IP est encore lisible.
    const beforeRow = await knex('qr_scans')
      .whereNotNull('ip_address')
      .andWhere('ip_address', '<>', '')
      .count({ c: '*' })
      .first();
    const before = Number(beforeRow && beforeRow.c ? beforeRow.c : 0);
    console.log(`[qr-ip-purge] rows avec ip_address non vide AVANT : ${before}`);

    // PURGE : on vide l'IP lisible (-> NULL). Idempotent : si before=0, no-op.
    if (before > 0) {
      await knex('qr_scans')
        .whereNotNull('ip_address')
        .andWhere('ip_address', '<>', '')
        .update({ ip_address: null });
    }

    // APRES : doit etre 0.
    const afterRow = await knex('qr_scans')
      .whereNotNull('ip_address')
      .andWhere('ip_address', '<>', '')
      .count({ c: '*' })
      .first();
    const after = Number(afterRow && afterRow.c ? afterRow.c : 0);
    console.log(
      `[qr-ip-purge] rows avec ip_address non vide APRES : ${after} `
      + `(purgees : ${before - after})`
    );
  },

  async down() {
    // No-op volontaire : les IP purgees ne sont pas restaurables (objectif Loi 25).
    console.log('[qr-ip-purge] rollback no-op : les IP purgees ne sont pas restaurables.');
  },
};
