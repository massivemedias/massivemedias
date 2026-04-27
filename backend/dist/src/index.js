"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const inventory_item_1 = require("./api/inventory-item/controllers/inventory-item");
exports.default = {
    register( /* { strapi }: { strapi: Core.Strapi } */) { },
    async bootstrap({ strapi }) {
        var _a, _b;
        // ── Auto-create admin super user ──
        try {
            const existingAdmins = await strapi.db.query('admin::user').findMany({ limit: 1 });
            if (existingAdmins.length === 0) {
                const superAdminRole = await strapi.db.query('admin::role').findOne({
                    where: { code: 'strapi-super-admin' },
                });
                if (superAdminRole) {
                    const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';
                    const adminPassword = process.env.ADMIN_PASSWORD || 'Massive1423!!';
                    await strapi.admin.services.user.create({
                        email: adminEmail,
                        firstname: 'Massive',
                        lastname: 'Medias',
                        password: adminPassword,
                        registrationToken: null,
                        isActive: true,
                        roles: [superAdminRole.id],
                    });
                    console.log(`[bootstrap] Admin super user created (${adminEmail})`);
                }
            }
        }
        catch (err) {
            console.error('[bootstrap] Admin user creation error:', err.message);
        }
        // TOUJOURS verifier les permissions et user-roles (meme sans seed de contenu)
        try {
            // Permissions publiques
            console.log('[seed] Checking public permissions...');
            const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
                where: { type: 'public' },
            });
            if (publicRole) {
                const permActions = [
                    'api::site-content.site-content.find',
                    'api::service-page.service-page.find',
                    'api::service-page.service-page.findOne',
                    'api::artist.artist.find',
                    'api::artist.artist.findOne',
                    'api::product.product.find',
                    'api::product.product.findOne',
                    'api::boutique-item.boutique-item.find',
                    'api::boutique-item.boutique-item.findOne',
                    'api::news-article.news-article.find',
                    'api::news-article.news-article.findOne',
                    'api::inventory-item.inventory-item.find',
                    'api::inventory-item.inventory-item.findOne',
                    'api::service-package.service-package.find',
                    'api::service-package.service-package.findOne',
                    'plugin::upload.content-api.upload',
                    'plugin::upload.content-api.find',
                ];
                for (const action of permActions) {
                    const existingPerm = await strapi.db.query('plugin::users-permissions.permission').findOne({
                        where: { action, role: publicRole.id },
                    });
                    if (!existingPerm) {
                        await strapi.db.query('plugin::users-permissions.permission').create({
                            data: { action, role: publicRole.id },
                        });
                        console.log(`[seed] Public permission for ${action} added!`);
                    }
                }
                console.log('[seed] Public permissions OK!');
            }
            // User Roles (proteger contre les resets de schema)
            console.log('[seed] Checking User Roles...');
            const userRolesToSeed = [
                { email: 'howdiy@gmail.com', role: 'artist', artistSlug: 'maudite-machine', displayName: 'Maudite Machine' },
                { email: 'medusart@protonmail.com', role: 'artist', artistSlug: 'psyqu33n', displayName: 'Psyqu33n' },
                { email: 'jay-gagnon@hotmail.ca', role: 'artist', artistSlug: 'adrift', displayName: 'Adrift Vision' },
                { email: 'mokrane.ouzane@gmail.com', role: 'artist', artistSlug: 'mok', displayName: 'Mok' },
                { email: 'qdelobel@gmail.com', role: 'artist', artistSlug: 'quentin-delobel', displayName: 'Quentin Delobel' },
                { email: 'alx.rouleau@gmail.com', role: 'artist', artistSlug: 'no-pixl', displayName: 'No Pixl' },
                { email: 'liah28@gmail.com', role: 'artist', artistSlug: 'cornelia-rose', displayName: 'Cornelia Rose' },
            ];
            for (const ur of userRolesToSeed) {
                const existing = await strapi.documents('api::user-role.user-role').findMany({
                    filters: { email: { $eqi: ur.email } },
                    limit: 1,
                });
                if (!existing || existing.length === 0) {
                    await strapi.documents('api::user-role.user-role').create({ data: ur });
                    console.log(`[seed] User role for "${ur.email}" created (${ur.role})!`);
                }
            }
            console.log('[seed] User Roles OK!');
        }
        catch (err) {
            console.error('[seed] Permissions/UserRoles error:', err.message);
        }
        // FIX-UNIQUE-COMPANY (27 avril 2026) : drop defensif au boot des index UNIQUE
        // orphelins sur company_name dans orders/invoices.
        //
        // Pourquoi au boot et pas seulement via migration : les migrations Strapi
        // sont parfois skippees sur Render (cold start, restore depuis snapshot,
        // deploy partiel) et l'index UNIQUE survit en BDD meme apres avoir retire
        // le `unique: true` du schema. Resultat : creation de commande manuelle
        // qui reutilise un companyName -> "This attribute must be unique".
        //
        // Idempotent : DROP INDEX IF EXISTS + introspection pg_index avant. Si
        // les index n'existent pas (cas normal apres 1ere execution), no-op silencieux.
        // Erreur loggee mais NE BLOQUE PAS le demarrage Strapi - on degrade gracefully.
        try {
            const knex = (_a = strapi.db) === null || _a === void 0 ? void 0 : _a.connection;
            if (knex && typeof knex.raw === 'function') {
                const dropOrphanUnique = async (tableName, columnName) => {
                    // Detecte tous les index UNIQUE qui touchent la colonne et les drop.
                    // Couvre a la fois les CONSTRAINTS (table-level) et les INDEX (db-level)
                    // car Postgres garde les deux au sens index quand on declare unique.
                    const result = await knex.raw(`
            DO $$
            DECLARE
              dropped_count INTEGER := 0;
              con RECORD;
              idx RECORD;
            BEGIN
              -- Skip si table absente (premier deploy sur DB vide)
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = current_schema() AND table_name = '${tableName}'
              ) THEN RETURN; END IF;
              -- Skip si colonne absente
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = '${tableName}'
                  AND column_name = '${columnName}'
              ) THEN RETURN; END IF;

              -- 1. Drop UNIQUE constraints (niveau table)
              FOR con IN
                SELECT tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu
                  ON tc.constraint_name = ccu.constraint_name
                 AND tc.table_schema = ccu.table_schema
                WHERE tc.table_schema = current_schema()
                  AND tc.table_name = '${tableName}'
                  AND tc.constraint_type = 'UNIQUE'
                  AND ccu.column_name = '${columnName}'
              LOOP
                EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', '${tableName}', con.constraint_name);
                dropped_count := dropped_count + 1;
              END LOOP;

              -- 2. Drop UNIQUE indexes (niveau db, peut etre orphelin sans constraint)
              FOR idx IN
                SELECT i.relname AS index_name
                FROM pg_class t
                JOIN pg_index ix ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
                WHERE t.relname = '${tableName}'
                  AND t.relkind = 'r'
                  AND ix.indisunique = true
                  AND a.attname = '${columnName}'
              LOOP
                EXECUTE format('DROP INDEX IF EXISTS %I', idx.index_name);
                dropped_count := dropped_count + 1;
              END LOOP;

              IF dropped_count > 0 THEN
                RAISE NOTICE 'Dropped % UNIQUE index/constraint(s) on ${tableName}.${columnName}', dropped_count;
              END IF;
            END $$;
          `);
                    return result;
                };
                await dropOrphanUnique('orders', 'company_name');
                await dropOrphanUnique('invoices', 'company_name');
                console.log('[bootstrap] Orphan UNIQUE indexes on company_name checked (orders + invoices)');
            }
            else {
                console.warn('[bootstrap] strapi.db.connection unavailable, skip orphan-unique cleanup');
            }
        }
        catch (cleanupErr) {
            // Non bloquant : si la cleanup plante (permissions, syntax PG specifique),
            // on log mais on laisse Strapi demarrer. Le runtime est protege par le
            // catch enrichi dans manualCreate qui detecte l'erreur unique et renvoie
            // un message clair au frontend.
            console.error('[bootstrap] Orphan-unique cleanup failed (non-blocking):', cleanupErr === null || cleanupErr === void 0 ? void 0 : cleanupErr.message);
        }
        // FIX-TAXONOMY (avril 2026) : reclassification auto des items d'inventaire
        // qui ont ete melanges entre equipement permanent et consommables. Idempotent :
        // si tous les items sont deja dans leur categorie cible, no-op. Execute
        // systematiquement au boot pour qu'aucun redeploy n'ait a attendre un click
        // admin manuel. L'erreur est loggee mais n'empeche PAS le demarrage Strapi.
        try {
            const report = await (0, inventory_item_1.runExplicitReclassificationApril2026)(strapi);
            if (report.reclassified > 0 || report.errors.length > 0) {
                console.log(`[bootstrap] Inventaire reclassification : ${report.reclassified} modifies, ` +
                    `${report.alreadyCorrect} deja OK, ${report.errors.length} erreurs sur ${report.scanned} items scannes.`);
                for (const ch of report.changes) {
                    console.log(`[bootstrap]   - ${ch.name}: ${ch.from} -> ${ch.to}`);
                }
                for (const err of report.errors) {
                    console.warn(`[bootstrap]   ! ${err.name}: ${err.error}`);
                }
            }
            else {
                console.log(`[bootstrap] Inventaire reclassification : aucun changement (${report.alreadyCorrect} items deja correctement ranges).`);
            }
        }
        catch (err) {
            console.error('[bootstrap] Reclassification inventaire echoue (non bloquant) :', err === null || err === void 0 ? void 0 : err.message);
        }
        // Seed contenu seulement si SEED_CONTENT=true (evite OOM sur Render free tier)
        if (process.env.SEED_CONTENT !== 'true')
            return;
        // Import dynamique pour ne charger les donnees que si necessaire
        const { siteContentSeedData, servicePagesSeedData, artistsSeedData, productsSeedData } = await Promise.resolve().then(() => __importStar(require('./seed-data')));
        console.log('[seed] Checking Site Content...');
        try {
            const existing = await strapi.documents('api::site-content.site-content').findFirst();
            if (existing) {
                console.log(`[seed] Site Content exists (documentId: ${existing.documentId}). Updating...`);
                await strapi.documents('api::site-content.site-content').update({
                    documentId: existing.documentId,
                    data: siteContentSeedData,
                    status: 'published',
                });
                console.log('[seed] Site Content updated and published!');
            }
            else {
                console.log('[seed] No Site Content found. Creating...');
                await strapi.documents('api::site-content.site-content').create({
                    data: siteContentSeedData,
                    status: 'published',
                });
                console.log('[seed] Site Content created and published!');
            }
            // Seed Service Pages
            console.log('[seed] Checking Service Pages...');
            for (const spData of servicePagesSeedData) {
                const existing = await strapi.documents('api::service-page.service-page').findMany({
                    filters: { slug: spData.slug },
                });
                if (existing.length > 0) {
                    console.log(`[seed] Service Page "${spData.slug}" exists. Updating...`);
                    await strapi.documents('api::service-page.service-page').update({
                        documentId: existing[0].documentId,
                        data: spData,
                        status: 'published',
                    });
                }
                else {
                    console.log(`[seed] Creating Service Page "${spData.slug}"...`);
                    await strapi.documents('api::service-page.service-page').create({
                        data: spData,
                        status: 'published',
                    });
                }
            }
            console.log('[seed] All 4 Service Pages seeded!');
            // Seed Artists
            console.log('[seed] Checking Artists...');
            for (const artistData of artistsSeedData) {
                const existing = await strapi.documents('api::artist.artist').findMany({
                    filters: { slug: artistData.slug },
                });
                if (existing.length > 0) {
                    console.log(`[seed] Artist "${artistData.slug}" exists. Updating...`);
                    await strapi.documents('api::artist.artist').update({
                        documentId: existing[0].documentId,
                        data: artistData,
                        status: 'published',
                    });
                }
                else {
                    console.log(`[seed] Creating Artist "${artistData.slug}"...`);
                    await strapi.documents('api::artist.artist').create({
                        data: artistData,
                        status: 'published',
                    });
                }
            }
            console.log(`[seed] All ${artistsSeedData.length} Artists seeded!`);
            // Seed Products
            console.log('[seed] Checking Products...');
            for (const productData of productsSeedData) {
                const existing = await strapi.documents('api::product.product').findMany({
                    filters: { slug: productData.slug },
                });
                if (existing.length > 0) {
                    console.log(`[seed] Product "${productData.slug}" exists. Updating...`);
                    await strapi.documents('api::product.product').update({
                        documentId: existing[0].documentId,
                        data: productData,
                        status: 'published',
                    });
                }
                else {
                    console.log(`[seed] Creating Product "${productData.slug}"...`);
                    await strapi.documents('api::product.product').create({
                        data: productData,
                        status: 'published',
                    });
                }
            }
            console.log(`[seed] All ${productsSeedData.length} Products seeded!`);
            console.log('[seed] Done!');
        }
        catch (err) {
            console.error('[seed] Error:', err.message);
            if ((_b = err.details) === null || _b === void 0 ? void 0 : _b.errors) {
                err.details.errors.forEach((e) => { var _a; return console.error('[seed]  -', (_a = e.path) === null || _a === void 0 ? void 0 : _a.join('.'), ':', e.message); });
            }
        }
    },
};
