"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::inventory-item.inventory-item', ({ strapi }) => ({
    async lowStock(ctx) {
        const items = await strapi.documents('api::inventory-item.inventory-item').findMany({
            filters: { active: true },
            populate: ['image', 'product'],
        });
        const lowStockItems = items.filter((item) => item.quantity <= (item.lowStockThreshold || 5));
        ctx.body = { data: lowStockItems };
    },
    async dashboard(ctx) {
        const items = await strapi.documents('api::inventory-item.inventory-item').findMany({
            filters: { active: true },
            populate: ['image', 'product'],
            sort: 'category',
        });
        const summary = {
            total: items.length,
            lowStock: 0,
            outOfStock: 0,
            totalValue: 0,
        };
        const enriched = items.map((item) => {
            const available = (item.quantity || 0) - (item.reserved || 0);
            const threshold = item.lowStockThreshold || 5;
            let status = 'ok';
            if (available <= 0) {
                status = 'out';
                summary.outOfStock++;
            }
            else if (available <= threshold) {
                status = 'low';
                summary.lowStock++;
            }
            const value = (item.quantity || 0) * (Number(item.costPrice) || 0);
            summary.totalValue += value;
            return {
                ...item,
                available,
                status,
                value: Math.round(value * 100) / 100,
            };
        });
        summary.totalValue = Math.round(summary.totalValue * 100) / 100;
        ctx.body = { data: enriched, summary };
    },
    async adjustStock(ctx) {
        const { documentId } = ctx.params;
        const { quantity, reserved, notes, nameFr, nameEn, costPrice, location, category, variant } = ctx.request.body;
        const item = await strapi.documents('api::inventory-item.inventory-item').findFirst({
            filters: { documentId },
        });
        if (!item) {
            return ctx.notFound('Inventory item not found');
        }
        const updateData = {};
        if (quantity !== undefined)
            updateData.quantity = quantity;
        if (reserved !== undefined)
            updateData.reserved = reserved;
        if (notes !== undefined)
            updateData.notes = notes;
        if (nameFr)
            updateData.nameFr = nameFr;
        if (nameEn)
            updateData.nameEn = nameEn;
        if (costPrice !== undefined)
            updateData.costPrice = costPrice;
        if (location !== undefined)
            updateData.location = location;
        if (category)
            updateData.category = category;
        if (variant !== undefined)
            updateData.variant = variant;
        const updated = await strapi.documents('api::inventory-item.inventory-item').update({
            documentId: item.documentId,
            data: updateData,
            populate: ['image', 'product'],
        });
        ctx.body = { data: updated };
    },
    /**
     * Creer un nouvel item d'inventaire avec SKU auto-genere
     * Format SKU: {CAT}-{VARIANT}-{DETAIL}-{NNN}
     * Ex: TXT-HOODIE-L-001, FRM-BLACK-A4-001, STK-HOLO-3IN-001
     */
    async createItem(ctx) {
        const { nameFr, nameEn, category, variant, detail, quantity, costPrice, location, notes, lowStockThreshold } = ctx.request.body;
        if (!nameFr || !category) {
            return ctx.badRequest('nameFr and category are required');
        }
        const VALID_CATEGORIES = ['textile', 'frame', 'accessory', 'sticker', 'print', 'merch', 'equipment', 'other'];
        if (!VALID_CATEGORIES.includes(category)) {
            return ctx.badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
        }
        // Prefixes SKU par categorie
        const SKU_PREFIXES = {
            textile: 'TXT',
            frame: 'FRM',
            accessory: 'ACC',
            sticker: 'STK',
            print: 'PRT',
            merch: 'MRC',
            equipment: 'EQP',
            other: 'OTH',
        };
        const prefix = SKU_PREFIXES[category] || 'OTH';
        const variantSlug = (variant || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GEN';
        const detailSlug = (detail || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || '';
        const skuBase = detailSlug ? `${prefix}-${variantSlug}-${detailSlug}` : `${prefix}-${variantSlug}`;
        // Trouver le prochain numero pour ce prefixe
        const existing = await strapi.documents('api::inventory-item.inventory-item').findMany({
            filters: { sku: { $startsWith: skuBase } },
            sort: 'sku:desc',
        });
        let nextNum = 1;
        if (existing.length > 0) {
            // Extraire le dernier numero
            const lastSku = existing[0].sku || '';
            const match = lastSku.match(/-(\d+)$/);
            if (match)
                nextNum = parseInt(match[1], 10) + 1;
            else
                nextNum = existing.length + 1;
        }
        const sku = `${skuBase}-${String(nextNum).padStart(3, '0')}`;
        const created = await strapi.documents('api::inventory-item.inventory-item').create({
            data: {
                nameFr,
                nameEn: nameEn || nameFr,
                sku,
                category,
                variant: variant || '',
                quantity: quantity || 0,
                reserved: 0,
                lowStockThreshold: lowStockThreshold || 5,
                costPrice: costPrice || 0,
                location: location || '',
                notes: notes || '',
                active: true,
            },
        });
        strapi.log.info(`Inventory item created: ${sku} - ${nameFr} (qty: ${quantity || 0})`);
        ctx.body = { data: created };
    },
    /**
     * Supprimer (desactiver) un item d'inventaire
     */
    async deleteItem(ctx) {
        const { documentId } = ctx.params;
        const item = await strapi.documents('api::inventory-item.inventory-item').findFirst({
            filters: { documentId },
        });
        if (!item)
            return ctx.notFound('Item not found');
        await strapi.documents('api::inventory-item.inventory-item').delete({
            documentId: item.documentId,
        });
        strapi.log.info(`Inventory item deleted: ${item.sku} - ${item.nameFr}`);
        ctx.body = { data: { deleted: true } };
    },
    /**
     * Import depuis facture PDF: cree ou met a jour les items d'inventaire
     * + cree une depense automatiquement
     */
    async importInvoice(ctx) {
        const { items, expense } = ctx.request.body;
        if ((!items || !Array.isArray(items) || items.length === 0) && !expense) {
            return ctx.badRequest('Au moins un item ou une depense est requis');
        }
        const VALID_CATEGORIES = ['textile', 'frame', 'accessory', 'sticker', 'print', 'merch', 'equipment', 'other'];
        const results = [];
        for (const item of items) {
            if (!item.nameFr || !item.category)
                continue;
            if (!VALID_CATEGORIES.includes(item.category))
                item.category = 'other';
            // Chercher un item existant par SKU ou nom
            let existing = null;
            if (item.sku) {
                existing = await strapi.documents('api::inventory-item.inventory-item').findFirst({
                    filters: { sku: item.sku },
                });
            }
            if (!existing && item.nameFr) {
                existing = await strapi.documents('api::inventory-item.inventory-item').findFirst({
                    filters: { nameFr: { $containsi: item.nameFr } },
                });
            }
            if (existing) {
                // Ajouter au stock existant
                const updated = await strapi.documents('api::inventory-item.inventory-item').update({
                    documentId: existing.documentId,
                    data: {
                        quantity: (existing.quantity || 0) + (item.quantity || 0),
                        costPrice: item.costPrice || existing.costPrice,
                        notes: item.notes ? `${existing.notes || ''}\n${item.notes}`.trim() : existing.notes,
                    },
                });
                results.push({ action: 'updated', item: updated });
            }
            else {
                // Creer un nouvel item
                const created = await strapi.documents('api::inventory-item.inventory-item').create({
                    data: {
                        nameFr: item.nameFr,
                        nameEn: item.nameEn || item.nameFr,
                        sku: item.sku || '',
                        category: item.category,
                        variant: item.variant || '',
                        quantity: item.quantity || 0,
                        reserved: 0,
                        lowStockThreshold: item.lowStockThreshold || 5,
                        costPrice: item.costPrice || 0,
                        location: item.location || '',
                        notes: item.notes || '',
                        active: true,
                    },
                });
                results.push({ action: 'created', item: created });
            }
        }
        // Creer la depense associee
        let expenseResult = null;
        if (expense && expense.amount) {
            const EXPENSE_CATS = ['consommables', 'materiel', 'shipping', 'software', 'marketing', 'equipment', 'taxes', 'other'];
            expenseResult = await strapi.documents('api::expense.expense').create({
                data: {
                    description: expense.description || 'Import facture',
                    amount: parseFloat(expense.amount) || 0,
                    category: EXPENSE_CATS.includes(expense.category) ? expense.category : 'materiel',
                    date: expense.date || new Date().toISOString().split('T')[0],
                    vendor: expense.vendor || '',
                    receiptNumber: expense.receiptNumber || '',
                    receiptUrl: expense.receiptUrl || '',
                    taxDeductible: expense.taxDeductible !== false,
                    tpsAmount: parseFloat(expense.tpsAmount) || 0,
                    tvqAmount: parseFloat(expense.tvqAmount) || 0,
                    notes: expense.notes || '',
                },
            });
        }
        strapi.log.info(`Import facture: ${results.length} items, depense: ${(expense === null || expense === void 0 ? void 0 : expense.amount) || 0}$`);
        ctx.body = { data: { items: results, expense: expenseResult } };
    },
}));
