"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const auth_1 = require("../../../utils/auth");
exports.default = strapi_1.factories.createCoreController('api::inventory-item.inventory-item', ({ strapi }) => ({
    async lowStock(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const items = await strapi.documents('api::inventory-item.inventory-item').findMany({
            filters: { active: true },
            populate: ['image', 'product'],
        });
        const lowStockItems = items.filter((item) => item.quantity <= (item.lowStockThreshold || 5));
        ctx.body = { data: lowStockItems };
    },
    async dashboard(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
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
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { documentId } = ctx.params;
        const { quantity, reserved, notes, nameFr, nameEn, costPrice, location, category, variant, brand, color, detail, hasZip } = ctx.request.body;
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
        if (brand !== undefined)
            updateData.brand = brand;
        if (color !== undefined)
            updateData.color = color;
        if (detail !== undefined)
            updateData.detail = detail;
        if (hasZip !== undefined)
            updateData.hasZip = !!hasZip;
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
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { nameFr, nameEn, category, variant, detail, brand, color, hasZip, quantity, costPrice, location, notes, lowStockThreshold } = ctx.request.body;
        if (!nameFr || !category) {
            return ctx.badRequest('nameFr and category are required');
        }
        const VALID_CATEGORIES = ['textile', 'frame', 'accessory', 'sticker', 'print', 'merch', 'equipment', 'flyer', 'business-card', 'web', 'design', 'photo', 'video', 'consulting', 'hosting', 'other'];
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
            flyer: 'FLY',
            'business-card': 'BCD',
            web: 'WEB',
            design: 'DSG',
            photo: 'PHT',
            video: 'VID',
            consulting: 'CST',
            hosting: 'HST',
            other: 'OTH',
        };
        const prefix = SKU_PREFIXES[category] || 'OTH';
        const variantSlug = (variant || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GEN';
        const detailSlug = (detail || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || '';
        const skuBase = detailSlug ? `${prefix}-${variantSlug}-${detailSlug}` : `${prefix}-${variantSlug}`;
        // Auto-merge: chercher un item existant avec le meme SKU base (meme categorie+variant+detail)
        const existingItems = await strapi.documents('api::inventory-item.inventory-item').findMany({
            filters: { sku: { $startsWith: skuBase }, active: true },
            sort: 'sku:desc',
        });
        // Chercher un item identique (meme nom OU meme SKU base avec un seul item)
        const duplicate = existingItems.find((item) => {
            const itemName = (item.nameFr || '').toLowerCase().trim();
            const newName = nameFr.toLowerCase().trim();
            return itemName === newName;
        });
        if (duplicate) {
            // Merge: ajouter la quantite au stock existant
            const updated = await strapi.documents('api::inventory-item.inventory-item').update({
                documentId: duplicate.documentId,
                data: {
                    quantity: (duplicate.quantity || 0) + (quantity || 0),
                    costPrice: costPrice || duplicate.costPrice,
                    location: location || duplicate.location,
                    notes: notes ? `${duplicate.notes || ''}\n${notes}`.trim() : duplicate.notes,
                },
                populate: ['image', 'product'],
            });
            strapi.log.info(`Inventory item merged: ${duplicate.sku} - ${nameFr} (+${quantity || 0} = ${updated.quantity})`);
            ctx.body = { data: updated, merged: true };
            return;
        }
        // Pas de doublon: creer un nouveau
        let nextNum = 1;
        if (existingItems.length > 0) {
            const lastSku = existingItems[0].sku || '';
            const match = lastSku.match(/-(\d+)$/);
            if (match)
                nextNum = parseInt(match[1], 10) + 1;
            else
                nextNum = existingItems.length + 1;
        }
        const sku = `${skuBase}-${String(nextNum).padStart(3, '0')}`;
        const created = await strapi.documents('api::inventory-item.inventory-item').create({
            data: {
                nameFr,
                nameEn: nameEn || nameFr,
                sku,
                category,
                variant: variant || '',
                brand: brand || '',
                color: color || '',
                detail: detail || '',
                hasZip: !!hasZip,
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
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
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
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { items, expense } = ctx.request.body;
        if ((!items || !Array.isArray(items) || items.length === 0) && !expense) {
            return ctx.badRequest('Au moins un item ou une depense est requis');
        }
        const VALID_CATEGORIES = ['textile', 'frame', 'accessory', 'sticker', 'print', 'merch', 'equipment', 'flyer', 'business-card', 'web', 'design', 'photo', 'video', 'consulting', 'hosting', 'other'];
        const results = [];
        for (const item of items) {
            if (!item.nameFr || !item.category)
                continue;
            if (!VALID_CATEGORIES.includes(item.category))
                item.category = 'other';
            // Mode explicite du frontend:
            // - 'create': forcer la creation d'un nouvel item (aucun fuzzy match)
            // - 'link':   lier a un item existant (priorite a linkedInventoryId, sinon fuzzy match par nom)
            // - undefined (legacy): comportement historique = fuzzy match par nom
            const matchMode = item.matchMode || 'link';
            let existing = null;
            if (matchMode === 'create') {
                // L'utilisateur a explicitement demande "Creer nouveau": on saute tout matching
                existing = null;
            }
            else {
                // matchMode === 'link' ou legacy
                if (item.linkedInventoryId) {
                    existing = await strapi.documents('api::inventory-item.inventory-item').findOne({
                        documentId: item.linkedInventoryId,
                    });
                }
                if (!existing && item.sku) {
                    existing = await strapi.documents('api::inventory-item.inventory-item').findFirst({
                        filters: { sku: item.sku },
                    });
                }
                if (!existing && item.nameFr) {
                    // Fallback fuzzy match par nom
                    existing = await strapi.documents('api::inventory-item.inventory-item').findFirst({
                        filters: { nameFr: { $containsi: item.nameFr } },
                    });
                }
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
    /**
     * Sync inventaire depuis une facture sortante (delta oldItems -> newItems).
     * - Pour chaque item matche par sku/nameFr, calcule la difference de qty
     *   entre l'ancienne version et la nouvelle, puis ajuste l'inventaire.
     * - Items non matches sont ignores silencieusement (pas tous les items de
     *   facture correspondent a de l'inventaire, ex: services web/design).
     * - Safety: n'autorise jamais une quantite inventaire < 0.
     *
     * Request body:
     *   { oldItems: Array<{ description, sku?, qty }>,
     *     newItems: Array<{ description, sku?, qty }> }
     *
     * Algorithme:
     *   1. Aggrege oldItems par cle (sku ou nameFr normalise) -> totalQty
     *   2. Aggrege newItems pareil
     *   3. Pour chaque cle, delta = newQty - oldQty
     *   4. Match en inventaire, applique -delta sur quantity
     *      (sortie = deduction = soustrait delta positif, ajoute si delta negatif)
     */
    async syncOutgoingInvoice(ctx) {
        var _a, _b, _c, _d;
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const { oldItems = [], newItems = [] } = ctx.request.body;
        const normalize = (s) => (s || '').trim().toLowerCase();
        const keyOf = (it) => (it.sku && it.sku.trim())
            ? `sku:${normalize(it.sku)}`
            : `name:${normalize(it.description || it.nameFr || '')}`;
        const aggregate = (list) => {
            const map = new Map();
            for (const it of list || []) {
                const key = keyOf(it);
                if (!key || key === 'name:' || key === 'sku:')
                    continue;
                const qty = Number(it.qty) || 0;
                if (qty <= 0)
                    continue;
                const existing = map.get(key);
                if (existing) {
                    existing.qty += qty;
                }
                else {
                    map.set(key, { qty, raw: it });
                }
            }
            return map;
        };
        const oldAgg = aggregate(oldItems);
        const newAgg = aggregate(newItems);
        const allKeys = new Set([...oldAgg.keys(), ...newAgg.keys()]);
        const adjustments = [];
        for (const key of allKeys) {
            const oldQty = ((_a = oldAgg.get(key)) === null || _a === void 0 ? void 0 : _a.qty) || 0;
            const newQty = ((_b = newAgg.get(key)) === null || _b === void 0 ? void 0 : _b.qty) || 0;
            const raw = ((_c = newAgg.get(key)) === null || _c === void 0 ? void 0 : _c.raw) || ((_d = oldAgg.get(key)) === null || _d === void 0 ? void 0 : _d.raw);
            const delta = newQty - oldQty; // positif = plus vendu, negatif = moins vendu
            if (delta === 0)
                continue;
            // Match par sku exact en priorite, sinon fuzzy par nameFr
            let existing = null;
            if (raw === null || raw === void 0 ? void 0 : raw.sku) {
                existing = await strapi.documents('api::inventory-item.inventory-item').findFirst({
                    filters: { sku: raw.sku.trim() },
                });
            }
            if (!existing && (raw === null || raw === void 0 ? void 0 : raw.description)) {
                existing = await strapi.documents('api::inventory-item.inventory-item').findFirst({
                    filters: { nameFr: { $containsi: raw.description.trim().slice(0, 60) } },
                });
            }
            if (!existing) {
                adjustments.push({ key, status: 'no-match', description: raw === null || raw === void 0 ? void 0 : raw.description, delta });
                continue;
            }
            const currentQty = existing.quantity || 0;
            const targetQty = Math.max(0, currentQty - delta);
            await strapi.documents('api::inventory-item.inventory-item').update({
                documentId: existing.documentId,
                data: { quantity: targetQty },
            });
            adjustments.push({
                key,
                status: 'updated',
                sku: existing.sku,
                nameFr: existing.nameFr,
                delta,
                before: currentQty,
                after: targetQty,
            });
        }
        const matched = adjustments.filter(a => a.status === 'updated').length;
        const skipped = adjustments.filter(a => a.status === 'no-match').length;
        strapi.log.info(`Sync facture sortante: ${matched} items ajustes, ${skipped} sans match`);
        ctx.body = { data: { adjustments, matched, skipped } };
    },
}));
