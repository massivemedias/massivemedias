'use strict';

/**
 * HOTFIX-B2B (23 avril 2026) : suppression defensive de toute contrainte UNIQUE
 * orpheline sur company_name dans les tables `orders` et `invoices`.
 *
 * Contexte : le schema Strapi declare companyName comme un simple string
 * optionnel sans unique. Le client rapporte pourtant "This attribute must be
 * unique" a la creation de commandes manuelles. Scenario suspecte : un deploy
 * partiel entre deux schema versions a pu creer un index unique qui ne
 * reflete plus la declaration actuelle. Postgres ne laisse PAS Strapi le
 * re-creer mais il n'essaie pas de le drop si le schema ne dit pas unique.
 *
 * Cette migration balaie systematiquement :
 *   1. Les contraintes UNIQUE au niveau table (ALTER TABLE DROP CONSTRAINT)
 *   2. Les index UNIQUE au niveau DB (DROP INDEX)
 * Le tout wrappe en DO blocks pour etre idempotent et no-op si rien n'existe.
 */

function dropUniqueOnCompanyName(tableName) {
  // Postgres stocke les contraintes UNIQUE dans information_schema.table_constraints
  // ET les indexes UNIQUE dans pg_indexes. On balaie les deux pour etre sur.
  return `
    DO $$
    DECLARE
      con RECORD;
      idx RECORD;
    BEGIN
      -- Table existe ?
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = '${tableName}'
      ) THEN
        RAISE NOTICE 'Skip ${tableName}: table absente';
        RETURN;
      END IF;

      -- Colonne existe ?
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = '${tableName}'
          AND column_name = 'company_name'
      ) THEN
        RAISE NOTICE 'Skip ${tableName}.company_name: colonne absente (schema pas encore sync)';
        RETURN;
      END IF;

      -- 1. Drop toute contrainte UNIQUE qui touche company_name uniquement
      FOR con IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
         AND tc.table_schema = ccu.table_schema
        WHERE tc.table_schema = current_schema()
          AND tc.table_name = '${tableName}'
          AND tc.constraint_type = 'UNIQUE'
          AND ccu.column_name = 'company_name'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', '${tableName}', con.constraint_name);
        RAISE NOTICE 'Dropped UNIQUE constraint % on ${tableName}.company_name', con.constraint_name;
      END LOOP;

      -- 2. Drop tout index UNIQUE qui concerne company_name (niveau DB, pas forcement une contrainte)
      FOR idx IN
        SELECT i.relname AS index_name
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = '${tableName}'
          AND t.relkind = 'r'
          AND ix.indisunique = true
          AND a.attname = 'company_name'
      LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', idx.index_name);
        RAISE NOTICE 'Dropped UNIQUE index % on ${tableName}.company_name', idx.index_name;
      END LOOP;
    END $$;
  `;
}

module.exports = {
  async up(knex) {
    await knex.raw(dropUniqueOnCompanyName('orders'));
    await knex.raw(dropUniqueOnCompanyName('invoices'));
  },

  async down() {
    // Pas de down intentionnellement : on ne veut JAMAIS re-ajouter une unique
    // sur company_name. C'est semantiquement faux (plusieurs commandes peuvent
    // avoir la meme entreprise ou un company_name vide).
  },
};
