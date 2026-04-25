"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const auth_1 = require("../../../utils/auth");
const VALID_CATEGORIES = ['consommables', 'materiel', 'shipping', 'software', 'marketing', 'equipment', 'taxes', 'other'];
exports.default = strapi_1.factories.createCoreController('api::expense.expense', ({ strapi }) => ({
    async adminList(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const page = parseInt(ctx.query.page) || 1;
        const pageSize = parseInt(ctx.query.pageSize) || 25;
        const category = ctx.query.category;
        const search = ctx.query.search;
        const filters = {};
        if (category && category !== 'all')
            filters.category = category;
        if (search) {
            filters.$or = [
                { description: { $containsi: search } },
                { vendor: { $containsi: search } },
            ];
        }
        const [items, allFiltered] = await Promise.all([
            strapi.documents('api::expense.expense').findMany({
                filters,
                sort: 'date:desc',
                limit: pageSize,
                start: (page - 1) * pageSize,
            }),
            strapi.documents('api::expense.expense').findMany({ filters }),
        ]);
        // Summary
        const allExpenses = await strapi.documents('api::expense.expense').findMany({});
        const summary = {
            total: allExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
            tps: allExpenses.reduce((s, e) => s + (parseFloat(e.tpsAmount) || 0), 0),
            tvq: allExpenses.reduce((s, e) => s + (parseFloat(e.tvqAmount) || 0), 0),
            deductible: allExpenses.filter((e) => e.taxDeductible).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
        };
        const total = allFiltered.length;
        ctx.body = {
            data: items,
            summary,
            meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
        };
    },
    async createExpense(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { description, amount, category, date, vendor, receiptNumber, receiptUrl, taxDeductible, tpsAmount, tvqAmount, notes } = ctx.request.body;
        if (!description || !amount || !category || !date) {
            return ctx.badRequest('Description, montant, categorie et date sont requis');
        }
        if (!VALID_CATEGORIES.includes(category)) {
            return ctx.badRequest('Categorie invalide');
        }
        const expense = await strapi.documents('api::expense.expense').create({
            data: {
                description,
                amount: parseFloat(amount),
                category,
                date,
                vendor: vendor || '',
                receiptNumber: receiptNumber || '',
                receiptUrl: receiptUrl || '',
                taxDeductible: taxDeductible || false,
                tpsAmount: parseFloat(tpsAmount) || 0,
                tvqAmount: parseFloat(tvqAmount) || 0,
                notes: notes || '',
            },
        });
        ctx.body = { data: expense };
    },
    async updateExpense(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const body = ctx.request.body;
        const item = await strapi.documents('api::expense.expense').findFirst({
            filters: { documentId },
        });
        if (!item)
            return ctx.notFound('Depense introuvable');
        if (body.category && !VALID_CATEGORIES.includes(body.category)) {
            return ctx.badRequest('Categorie invalide');
        }
        const updateData = {};
        if (body.description !== undefined)
            updateData.description = body.description;
        if (body.amount !== undefined)
            updateData.amount = parseFloat(body.amount);
        if (body.category !== undefined)
            updateData.category = body.category;
        if (body.date !== undefined)
            updateData.date = body.date;
        if (body.vendor !== undefined)
            updateData.vendor = body.vendor;
        if (body.receiptNumber !== undefined)
            updateData.receiptNumber = body.receiptNumber;
        if (body.receiptUrl !== undefined)
            updateData.receiptUrl = body.receiptUrl;
        if (body.taxDeductible !== undefined)
            updateData.taxDeductible = body.taxDeductible;
        if (body.tpsAmount !== undefined)
            updateData.tpsAmount = parseFloat(body.tpsAmount) || 0;
        if (body.tvqAmount !== undefined)
            updateData.tvqAmount = parseFloat(body.tvqAmount) || 0;
        if (body.notes !== undefined)
            updateData.notes = body.notes;
        const updated = await strapi.documents('api::expense.expense').update({
            documentId: item.documentId,
            data: updateData,
        });
        ctx.body = { data: updated };
    },
    async deleteExpense(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const item = await strapi.documents('api::expense.expense').findFirst({
            filters: { documentId },
        });
        if (!item)
            return ctx.notFound('Depense introuvable');
        await strapi.documents('api::expense.expense').delete({
            documentId: item.documentId,
        });
        strapi.log.info(`Depense supprimee: ${item.description} (${item.amount}$)`);
        ctx.body = { success: true };
    },
    async yearSummary(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const year = parseInt(ctx.params.year) || new Date().getFullYear();
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        // Depenses de l'annee
        const expenses = await strapi.documents('api::expense.expense').findMany({
            filters: {
                date: { $gte: startDate, $lte: endDate },
            },
        });
        // Revenus: commandes PAYEES (status post-paiement) de l'annee.
        // FIX-MANUAL-EXPORT (23 avril 2026) : le filtre status couvre deja les
        // commandes manuelles prepaid (status='paid' force par manualCreate quand
        // isAlreadyPaid=true) et les manuelles avec lien Stripe payees (status='paid'
        // post-webhook). Les manuelles encore 'pending' (lien Stripe non clique)
        // restent exclues - revenu non realise. Aucune exclusion sur isManual.
        const orders = await strapi.documents('api::order.order').findMany({
            filters: {
                status: { $in: ['paid', 'processing', 'ready', 'shipped', 'delivered'] },
                createdAt: { $gte: `${startDate}T00:00:00.000Z`, $lte: `${endDate}T23:59:59.999Z` },
            },
        });
        // Grouper par mois
        const months = {};
        for (let m = 0; m < 12; m++) {
            const key = String(m + 1).padStart(2, '0');
            // FIX-MANUAL-EXPORT : breakdown par source (manual vs web) pour transparence
            // dans l'export CSV. Les totaux globaux restent inchanges (somme des deux),
            // ce sont des champs ADDITIONNELS pas un remplacement -> zero regression
            // sur les readers existants.
            months[key] = {
                expenses: 0, tps: 0, tvq: 0, deductible: 0,
                revenue: 0, revenueTps: 0, revenueTvq: 0,
                revenueManual: 0, revenueWeb: 0,
                manualCount: 0, webCount: 0,
            };
        }
        // FIX-DEFENSIVE : numericSafe gere null/undefined/strings/cents-vs-dollars.
        // Retourne toujours un Number fini >= 0 pour ne jamais propager NaN dans
        // les sommations (qui contamineraient TOUT le rapport annuel).
        const numericSafe = (val) => {
            if (val === null || val === undefined)
                return 0;
            const n = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
            return Number.isFinite(n) && n >= 0 ? n : 0;
        };
        for (const e of expenses) {
            const m = (e === null || e === void 0 ? void 0 : e.date) ? String(e.date).substring(5, 7) : null;
            if (!m || !months[m])
                continue;
            months[m].expenses += numericSafe(e === null || e === void 0 ? void 0 : e.amount);
            months[m].tps += numericSafe(e === null || e === void 0 ? void 0 : e.tpsAmount);
            months[m].tvq += numericSafe(e === null || e === void 0 ? void 0 : e.tvqAmount);
            if (e === null || e === void 0 ? void 0 : e.taxDeductible)
                months[m].deductible += numericSafe(e === null || e === void 0 ? void 0 : e.amount);
        }
        let manualOrdersIncluded = 0;
        let webOrdersIncluded = 0;
        for (const o of orders) {
            const d = (o === null || o === void 0 ? void 0 : o.createdAt) ? new Date(o.createdAt) : null;
            if (!d || isNaN(d.getTime()))
                continue; // skip orders with corrupted dates
            const m = String(d.getMonth() + 1).padStart(2, '0');
            if (!months[m])
                continue;
            const subtotal = numericSafe(o === null || o === void 0 ? void 0 : o.subtotal);
            const tps = numericSafe(o === null || o === void 0 ? void 0 : o.tps);
            const tvq = numericSafe(o === null || o === void 0 ? void 0 : o.tvq);
            const isManual = !!(o === null || o === void 0 ? void 0 : o.isManual);
            months[m].revenue += subtotal;
            months[m].revenueTps += tps;
            months[m].revenueTvq += tvq;
            // Breakdown source (additif aux champs existants)
            if (isManual) {
                months[m].revenueManual += subtotal;
                months[m].manualCount++;
                manualOrdersIncluded++;
            }
            else {
                months[m].revenueWeb += subtotal;
                months[m].webCount++;
                webOrdersIncluded++;
            }
        }
        // Totaux annuels (champs existants conserves identiques + breakdown manual/web)
        const totals = {
            expenses: 0, tps: 0, tvq: 0, deductible: 0,
            revenue: 0, revenueTps: 0, revenueTvq: 0,
            revenueManual: 0, revenueWeb: 0,
            manualCount: 0, webCount: 0,
        };
        for (const m of Object.values(months)) {
            totals.expenses += m.expenses;
            totals.tps += m.tps;
            totals.tvq += m.tvq;
            totals.deductible += m.deductible;
            totals.revenue += m.revenue;
            totals.revenueTps += m.revenueTps;
            totals.revenueTvq += m.revenueTvq;
            totals.revenueManual += m.revenueManual;
            totals.revenueWeb += m.revenueWeb;
            totals.manualCount += m.manualCount;
            totals.webCount += m.webCount;
        }
        strapi.log.info(`[yearSummary ${year}] orders=${orders.length} ` +
            `(manual=${manualOrdersIncluded}, web=${webOrdersIncluded}) ` +
            `revenue=${totals.revenue.toFixed(2)}$ ` +
            `(manual=${totals.revenueManual.toFixed(2)}$, web=${totals.revenueWeb.toFixed(2)}$)`);
        ctx.body = { year, months, totals };
    },
}));
