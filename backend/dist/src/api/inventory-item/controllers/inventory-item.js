"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExplicitReclassificationApril2026 = void 0;
const strapi_1 = require("@strapi/strapi");
const auth_1 = require("../../../utils/auth");
// FIX-TAXONOMY (avril 2026) : reclassification explicite demandee par le
// proprietaire apres constatation que les fournitures recurrentes (papier,
// encre, pochettes, cartouches) etaient melangees avec les machines
// permanentes (Epson 2850, Cameo 5, Fellowes, etc.) dans la meme categorie
// "Equipement & Machines".
//
// La liste ci-dessous est EXPLICITE (pas d'heuristique fragile). Chaque entree
// est un pattern (substring, case-insensitive) match contre nameFr + nameEn.
// Un item est reclasse SEULEMENT s'il match ET si sa categorie actuelle
// differe de la cible. Idempotent : re-execute = no-op.
const EXPLICIT_RECLASSIFY_PLAN = [
    // Consommables (fournitures qui s'epuisent)
    { pattern: 'canon mc-20', target: 'consumables' }, // Cartouche d'entretien Canon MC-20 PRO-1000
    { pattern: 'canon mc 20', target: 'consumables' }, // variante orthographique
    { pattern: 'cartouche', target: 'consumables' },
    { pattern: 'epson papier lustre', target: 'consumables' },
    { pattern: 'epson papier photo mat', target: 'consumables' },
    { pattern: 'pochettes plastifieuse 17x11', target: 'consumables' },
    { pattern: 'pochettes plastifieuse a3', target: 'consumables' },
    { pattern: 'pochettes plastifieuse brill', target: 'consumables' },
    { pattern: 'tubes en carton', target: 'consumables' },
    // Equipment (materiel permanent, machines, outils)
    { pattern: 'epson 2850', target: 'equipment' },
    { pattern: 'fellowes jupiter', target: 'equipment' },
    { pattern: 'regle carree', target: 'equipment' }, // Regle carree 300mm inox
    { pattern: 'règle carrée', target: 'equipment' }, // avec accents
    { pattern: 'silhouette cameo', target: 'equipment' },
    // Software (licences, logiciels)
    { pattern: 'silhouette connect', target: 'software' },
];
/**
 * Applique la reclassification explicite. Idempotent. Retourne le rapport
 * detaille des items modifies + ignores. Partagee entre l'endpoint admin
 * et le bootstrap (auto-run au premier boot apres deploy).
 */
async function runExplicitReclassificationApril2026(strapi) {
    const allItems = await strapi.documents('api::inventory-item.inventory-item').findMany({
        limit: 1000,
    });
    const changes = [];
    const errors = [];
    let alreadyCorrect = 0;
    let unmatched = 0;
    for (const item of allItems) {
        const haystack = `${item.nameFr || ''} ${item.nameEn || ''}`.toLowerCase();
        const match = EXPLICIT_RECLASSIFY_PLAN.find(p => haystack.includes(p.pattern));
        if (!match) {
            unmatched++;
            continue;
        }
        if (item.category === match.target) {
            alreadyCorrect++;
            continue;
        }
        changes.push({
            id: item.id,
            documentId: item.documentId,
            name: item.nameFr || item.nameEn || '(sans nom)',
            from: item.category,
            to: match.target,
        });
    }
    for (const change of changes) {
        try {
            await strapi.documents('api::inventory-item.inventory-item').update({
                documentId: change.documentId,
                data: { category: change.to },
            });
        }
        catch (err) {
            errors.push({
                documentId: change.documentId,
                name: change.name,
                error: (err === null || err === void 0 ? void 0 : err.message) || 'Erreur inconnue',
            });
        }
    }
    return {
        scanned: allItems.length,
        reclassified: changes.length - errors.length,
        alreadyCorrect,
        unmatched,
        changes,
        errors,
    };
}
exports.runExplicitReclassificationApril2026 = runExplicitReclassificationApril2026;
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
        const { quantity, reserved, notes, nameFr, nameEn, costPrice, location, category, variant, brand, color, detail, hasZip, stickerFormat, stickerType, finitionPapier, fx, taillePapier, } = ctx.request.body;
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
        // Champs conditionnels par categorie : null = effacer (cas ou l'utilisateur
        // switch de Stickers vers une autre categorie qui n'utilise pas ces champs).
        if (stickerFormat !== undefined)
            updateData.stickerFormat = stickerFormat || null;
        if (stickerType !== undefined)
            updateData.stickerType = stickerType || null;
        if (finitionPapier !== undefined)
            updateData.finitionPapier = finitionPapier || null;
        if (fx !== undefined)
            updateData.fx = fx || null;
        if (taillePapier !== undefined)
            updateData.taillePapier = taillePapier || null;
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
        const { nameFr, nameEn, category, variant, detail, brand, color, hasZip, quantity, costPrice, location, notes, lowStockThreshold, stickerFormat, stickerType, finitionPapier, fx, taillePapier, } = ctx.request.body;
        if (!nameFr || !category) {
            return ctx.badRequest('nameFr and category are required');
        }
        // Nouveau schema inventaire (7 categories principales) + aliases legacy
        // pour les items crees avant la refonte.
        const VALID_CATEGORIES = [
            'stickers', 'papiers', 'textile', 'consommables', 'materiel', 'cadre', 'merch',
            // Legacy (items existants)
            'frame', 'accessory', 'sticker', 'print', 'equipment', 'consommable', 'emballage',
            'flyer', 'business-card', 'web', 'design', 'photo', 'video', 'consulting', 'hosting', 'other',
        ];
        if (!VALID_CATEGORIES.includes(category)) {
            return ctx.badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
        }
        // Prefixes SKU par categorie (nouveaux + legacy pour compat SKU existants).
        const SKU_PREFIXES = {
            stickers: 'STK',
            papiers: 'PAP',
            textile: 'TXT',
            consommables: 'CON',
            materiel: 'MAT',
            cadre: 'CAD',
            merch: 'MER',
            // Legacy
            frame: 'FRM',
            accessory: 'ACC',
            sticker: 'STK',
            print: 'PRT',
            equipment: 'EQP',
            consommable: 'CSM',
            emballage: 'EMB',
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
                stickerFormat: stickerFormat || null,
                stickerType: stickerType || null,
                finitionPapier: finitionPapier || null,
                fx: fx || null,
                taillePapier: taillePapier || null,
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
    // POST /inventory-items/reclassify-taxonomy - One-shot migration script (avril 2026)
    // Reclassifie les items dans les categories generiques strictes :
    //   - equipment   : machines/outils durables (Epson, Cameo, Fellowes, regle, etc.)
    //   - consumables : papier, encre, pochettes, cartouches
    //   - packaging   : tubes, boites, ruban, adhesif
    //   - software    : licences, logiciels (Silhouette Connect, etc.)
    //
    // Cible uniquement les items avec category dans [materiel, equipment, consommables,
    // consommable, emballage] pour eviter de toucher aux categories metier
    // (stickers, papiers, textile, cadre, merch) qui sont deja correctement rangees.
    //
    // Body optionnel : { dryRun?: boolean } pour preview sans ecrire.
    // Admin only. Retourne le diff detaille pour audit.
    async reclassifyTaxonomy(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const body = ctx.request.body || {};
        const dryRun = !!body.dryRun;
        const SOURCE_CATEGORIES = ['materiel', 'equipment', 'consommables', 'consommable', 'emballage'];
        const items = await strapi.documents('api::inventory-item.inventory-item').findMany({
            filters: { category: { $in: SOURCE_CATEGORIES } },
            limit: 500,
        });
        // Heuristiques par mot-cle. Ordre : plus specifique en premier.
        function classify(nameFr, nameEn) {
            const s = `${nameFr || ''} ${nameEn || ''}`.toLowerCase();
            // Software : logiciels, licences
            if (/\b(silhouette\s*connect|logiciel|license|licence|software|app\s+design|adobe)\b/.test(s)) {
                return 'software';
            }
            // Packaging : tubes, boites, emballage, adhesif
            if (/\b(tube|boite|boîte|box|ruban|adhesif|adhésif|tape|sleeve|pochette\s+envoi|enveloppe|carton|bulle|mailer)\b/.test(s)) {
                return 'packaging';
            }
            // Consumables : papier, encre, cartouche, pochettes lamin
            if (/\b(papier|paper|encre|ink|cartouche|toner|pochette|lamin|film|bobine|feuille\s+vinyl)\b/.test(s)) {
                return 'consumables';
            }
            // Equipment : machines lourdes, outils
            if (/\b(epson|silhouette\s*cameo|cameo|fellowes|règle|regle|ruler|printer|plotter|decoup|machine|heat\s*press|presse)\b/.test(s)) {
                return 'equipment';
            }
            // Fallback generique pour categorie materiel/equipment : equipment si dur, consumable sinon
            return null;
        }
        const plan = [];
        for (const item of items) {
            const target = classify(item.nameFr, item.nameEn);
            if (!target || target === item.category)
                continue;
            plan.push({
                id: item.id,
                documentId: item.documentId,
                sku: item.sku || '',
                name: item.nameFr || item.nameEn || '(sans nom)',
                oldCategory: item.category,
                newCategory: target,
            });
        }
        if (dryRun) {
            strapi.log.info(`[reclassifyTaxonomy] DRY RUN : ${plan.length} items seraient reclasses`);
            ctx.body = { data: { dryRun: true, plan, plannedCount: plan.length, totalScanned: items.length } };
            return;
        }
        // Execution reelle
        let applied = 0;
        const errors = [];
        for (const change of plan) {
            try {
                await strapi.documents('api::inventory-item.inventory-item').update({
                    documentId: change.documentId,
                    data: { category: change.newCategory },
                });
                applied++;
            }
            catch (err) {
                errors.push({ documentId: change.documentId, sku: change.sku, error: err === null || err === void 0 ? void 0 : err.message });
            }
        }
        strapi.log.info(`[reclassifyTaxonomy] ${applied}/${plan.length} items reclasses (${errors.length} erreurs)`);
        ctx.body = {
            data: {
                dryRun: false,
                plan,
                applied,
                errors,
                totalScanned: items.length,
            },
        };
    },
    // POST /inventory-items/reclassify-explicit-april2026
    // Reclassification EXPLICITE par liste d'items (pas d'heuristique) demandee
    // par le proprietaire. Idempotent. Aussi auto-declenchee au bootstrap backend
    // (voir src/index.ts). Admin-only.
    async reclassifyExplicitApril2026(ctx) {
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        try {
            const report = await runExplicitReclassificationApril2026(strapi);
            strapi.log.info(`[reclassifyExplicit] scanned=${report.scanned} reclassified=${report.reclassified} already=${report.alreadyCorrect} errors=${report.errors.length}`);
            ctx.body = { data: report };
        }
        catch (err) {
            strapi.log.error('[reclassifyExplicit] ECHEC :', err);
            return ctx.throw(500, (err === null || err === void 0 ? void 0 : err.message) || 'Erreur reclassification');
        }
    },
}));
