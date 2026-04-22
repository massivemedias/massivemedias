"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const auth_1 = require("../../../utils/auth");
// BILLING-SETTINGS (avril 2026)
// Single-type qui stocke les parametres de facturation de Massive Medias :
// numeros de taxes (TPS/TVQ/NEQ), coordonnees bancaires, email Interac.
//
// GET  /billing-settings          : public (utilise par le PDF cote client)
// PUT  /billing-settings          : admin-only (edite par /admin/reglages-facturation)
//
// Note : pas de secret business ici (les numeros de taxes et le email Interac
// apparaissent deja sur toutes les factures). Les coordonnees bancaires SONT
// sensibles mais sont destinees a etre imprimees sur les factures, donc leur
// lecture publique est acceptable. Ne PAS stocker ici des infos type mot de
// passe banque, API keys, etc.
// Cast any sur le UID : les types Strapi sont regeneres au boot serveur.
exports.default = strapi_1.factories.createCoreController('api::billing-settings.billing-settings', ({ strapi }) => ({
    async find(ctx) {
        try {
            const entry = await strapi.documents('api::billing-settings.billing-settings').findFirst({});
            if (!entry) {
                // Bootstrap : retourner les defaults si l'entite n'a pas encore ete creee.
                ctx.body = {
                    data: {
                        companyName: 'Massive Medias',
                        companyOwner: 'Michael Sanchez',
                        companyAddress: '5338 rue Marquette',
                        companyCity: 'Montreal (QC) H2J 3Z3',
                        companyEmail: 'massivemedias@gmail.com',
                        companyWebsite: 'massivemedias.com',
                        neq: '2269057891',
                        tps: '732457635RT0001',
                        tvq: '4012577678TQ0001',
                        interacEmail: 'massivemedias@gmail.com',
                    },
                };
                return;
            }
            ctx.body = { data: entry };
        }
        catch (err) {
            ctx.throw(500, err.message);
        }
    },
    async update(ctx) {
        var _a;
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const body = ((_a = ctx.request.body) === null || _a === void 0 ? void 0 : _a.data) || ctx.request.body || {};
        const ALLOWED = [
            'companyName', 'companyOwner', 'companyAddress', 'companyCity',
            'companyPhone', 'companyEmail', 'companyWebsite',
            'neq', 'tps', 'tvq',
            'interacEmail',
            'bankName', 'bankTransit', 'bankInstitution', 'bankAccount',
            'paymentNotes',
        ];
        const data = {};
        for (const key of ALLOWED) {
            if (body[key] !== undefined)
                data[key] = body[key];
        }
        try {
            // Single-type : on utilise findFirst + update/create selon existence
            const existing = await strapi.documents('api::billing-settings.billing-settings').findFirst({});
            let saved;
            if (existing) {
                saved = await strapi.documents('api::billing-settings.billing-settings').update({
                    documentId: existing.documentId,
                    data,
                });
            }
            else {
                saved = await strapi.documents('api::billing-settings.billing-settings').create({
                    data,
                });
            }
            strapi.log.info(`[billing-settings] updated fields: ${Object.keys(data).join(', ')}`);
            ctx.body = { data: saved };
        }
        catch (err) {
            strapi.log.error('billing-settings update error:', err);
            ctx.throw(500, err.message);
        }
    },
}));
