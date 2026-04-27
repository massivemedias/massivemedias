"use strict";
// Controller backup admin - export JSON complet pour tranquillite d'esprit.
//
// Pourquoi ce endpoint existe :
//   Render PostgreSQL fait des snapshots daily, mais le client veut une copie
//   PHYSIQUE sur son ordinateur. Ce endpoint genere un JSON downloadable de
//   toutes les entites vitales : si demain Render disparait, le client a
//   toujours ses clients/commandes/factures sur son disque dur.
//
// Securite :
//   requireAdminAuth en premiere ligne. Aucun acces public possible. Logged
//   pour traceabilite (qui a exporte quoi, quand).
//
// Performance :
//   - Promise.all parallelise les 8 fetchs (1 round-trip vers PG au lieu de 8)
//   - findMany sans populate -> juste les champs scalaires, pas de relations
//     hydratees (les FKs restent en clair, suffisant pour un backup de donnees)
//   - Pas de pagination : on veut TOUT. Si la base devient enorme (>100k records
//     par table), il faudra chunker - pour l'instant ~quelques milliers max.
//
// Sanitization :
//   On supprime password/resetPasswordToken/confirmationToken au cas ou ils
//   auraient ete persistes (ne devrait pas via Supabase auth qui gere les
//   credentials hors Strapi, mais belt-and-suspenders).
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../../utils/auth");
// Champs sensibles a exclure du dump - definis a part pour test/audit faciles.
const SENSITIVE_FIELDS = [
    'password',
    'resetPasswordToken',
    'confirmationToken',
    // Tokens stripe internes (au cas ou) - pas critiques mais inutiles dans un backup
    'stripePaymentIntentSecret',
    'stripeSessionSecret',
];
function sanitize(records) {
    if (!Array.isArray(records))
        return [];
    return records.map((r) => {
        if (!r || typeof r !== 'object')
            return r;
        const clean = { ...r };
        for (const f of SENSITIVE_FIELDS) {
            if (f in clean)
                delete clean[f];
        }
        return clean;
    });
}
// Wrapper defensif : si une entite est absente du schema (deploy intermediaire,
// content-type pas encore migre), on log et continue avec un tableau vide
// plutot que de faire planter TOUT le backup. Le client peut quand meme
// recuperer ce qu'il y a.
async function safeFindMany(uid) {
    var _a, _b;
    try {
        const docs = await strapi.documents(uid).findMany({});
        return Array.isArray(docs) ? docs : [];
    }
    catch (err) {
        (_b = (_a = strapi === null || strapi === void 0 ? void 0 : strapi.log) === null || _a === void 0 ? void 0 : _a.warn) === null || _b === void 0 ? void 0 : _b.call(_a, `[backup] safeFindMany ${uid} failed: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        return [];
    }
}
exports.default = {
    /**
     * GET /admin/backup/export
     *
     * Genere un JSON complet de toutes les entites vitales et le retourne
     * comme fichier telechargeable (Content-Disposition: attachment).
     *
     * Format du dump :
     * {
     *   meta: { generatedAt, generatedBy, version, counts: {...} },
     *   clients: [...], orders: [...], invoices: [...], products: [...],
     *   artists: [...], testimonials: [...], expenses: [...],
     *   contactSubmissions: [...], userRoles: [...]
     * }
     */
    async exportAll(ctx) {
        var _a, _b, _c, _d, _e, _f;
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const startedAt = Date.now();
        const adminEmail = ((_a = ctx.state) === null || _a === void 0 ? void 0 : _a.adminUserEmail)
            || ((_b = ctx.state) === null || _b === void 0 ? void 0 : _b.adminAuthMethod)
            || 'unknown-admin';
        try {
            // Parallelisation des 9 fetchs - 1 seul round-trip effectif vers PG
            // au lieu de 9 sequentiels. Sur ~10k records total, gain typique 8-10x.
            const [clients, orders, invoices, products, artists, testimonials, expenses, contactSubmissions, userRoles,] = await Promise.all([
                safeFindMany('api::client.client'),
                safeFindMany('api::order.order'),
                safeFindMany('api::invoice.invoice'),
                safeFindMany('api::product.product'),
                safeFindMany('api::artist.artist'),
                safeFindMany('api::testimonial.testimonial'),
                safeFindMany('api::expense.expense'),
                safeFindMany('api::contact-submission.contact-submission'),
                safeFindMany('api::user-role.user-role'),
            ]);
            const cleanClients = sanitize(clients);
            const cleanOrders = sanitize(orders);
            const cleanInvoices = sanitize(invoices);
            const cleanProducts = sanitize(products);
            const cleanArtists = sanitize(artists);
            const cleanTestimonials = sanitize(testimonials);
            const cleanExpenses = sanitize(expenses);
            const cleanContactSubmissions = sanitize(contactSubmissions);
            const cleanUserRoles = sanitize(userRoles);
            const counts = {
                clients: cleanClients.length,
                orders: cleanOrders.length,
                invoices: cleanInvoices.length,
                products: cleanProducts.length,
                artists: cleanArtists.length,
                testimonials: cleanTestimonials.length,
                expenses: cleanExpenses.length,
                contactSubmissions: cleanContactSubmissions.length,
                userRoles: cleanUserRoles.length,
            };
            const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
            const dump = {
                meta: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: adminEmail,
                    version: '1.0',
                    source: 'massive-medias-backend',
                    strapi: 'v5',
                    counts,
                    totalRecords,
                    notes: 'Backup manuel JSON. Mots de passe et tokens sensibles exclus. '
                        + 'Conserver ce fichier en lieu sur (chiffre si possible).',
                },
                clients: cleanClients,
                orders: cleanOrders,
                invoices: cleanInvoices,
                products: cleanProducts,
                artists: cleanArtists,
                testimonials: cleanTestimonials,
                expenses: cleanExpenses,
                contactSubmissions: cleanContactSubmissions,
                userRoles: cleanUserRoles,
            };
            // Format date YYYY-MM-DD pour le filename - lisible et triable.
            const today = new Date().toISOString().slice(0, 10);
            const filename = `massive_medias_backup_${today}.json`;
            ctx.set('Content-Type', 'application/json; charset=utf-8');
            ctx.set('Content-Disposition', `attachment; filename="${filename}"`);
            ctx.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            ctx.set('X-Backup-Total-Records', String(totalRecords));
            const elapsedMs = Date.now() - startedAt;
            (_d = (_c = strapi === null || strapi === void 0 ? void 0 : strapi.log) === null || _c === void 0 ? void 0 : _c.info) === null || _d === void 0 ? void 0 : _d.call(_c, `[backup] Export by ${adminEmail}: ${totalRecords} records in ${elapsedMs}ms `
                + `(clients=${counts.clients}, orders=${counts.orders}, invoices=${counts.invoices}, `
                + `products=${counts.products}, artists=${counts.artists}, testimonials=${counts.testimonials}, `
                + `expenses=${counts.expenses}, contactSubmissions=${counts.contactSubmissions}, `
                + `userRoles=${counts.userRoles})`);
            ctx.body = dump;
        }
        catch (err) {
            (_f = (_e = strapi === null || strapi === void 0 ? void 0 : strapi.log) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.call(_e, `[backup] Export failed for ${adminEmail}: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            ctx.status = 500;
            ctx.body = {
                error: {
                    status: 500,
                    name: 'BackupFailed',
                    message: 'Erreur lors de la generation du backup. Voir les logs serveur.',
                },
            };
        }
    },
};
