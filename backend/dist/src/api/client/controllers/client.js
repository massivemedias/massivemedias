"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const email_1 = require("../../../utils/email");
// Statuts de commande qui comptent comme "paye reellement"
const PAID_STATUSES = ['paid', 'processing', 'ready', 'shipped', 'delivered'];
/**
 * Reconcilie les clients avec les commandes reellement payees.
 * Auto-cree les clients manquants, met a jour orderCount/totalSpent/lastOrderDate
 * a partir des vraies commandes (evite les desyncs si un webhook a foire).
 */
async function reconcileClientsFromOrders(strapi) {
    try {
        const orders = await strapi.documents('api::order.order').findMany({
            filters: { status: { $in: PAID_STATUSES } },
            limit: 10000,
        });
        // Grouper par email
        const byEmail = new Map();
        for (const o of orders) {
            const email = (o.customerEmail || '').toLowerCase();
            if (!email)
                continue;
            const total = (o.total || 0) / 100; // stocke en cents
            const prev = byEmail.get(email);
            const createdAt = o.createdAt || null;
            if (prev) {
                prev.totalSpent += total;
                prev.orderCount += 1;
                if (createdAt && (!prev.lastOrderDate || new Date(createdAt) > new Date(prev.lastOrderDate))) {
                    prev.lastOrderDate = createdAt;
                }
                if (!prev.name && o.customerName)
                    prev.name = o.customerName;
                if (!prev.phone && o.customerPhone)
                    prev.phone = o.customerPhone;
                if (!prev.supabaseUserId && o.supabaseUserId)
                    prev.supabaseUserId = o.supabaseUserId;
            }
            else {
                byEmail.set(email, {
                    email,
                    name: o.customerName || '',
                    phone: o.customerPhone || '',
                    totalSpent: total,
                    orderCount: 1,
                    lastOrderDate: createdAt,
                    supabaseUserId: o.supabaseUserId || '',
                });
            }
        }
        // Upsert dans clients
        const existingClients = await strapi.documents('api::client.client').findMany({ limit: 10000 });
        const existingMap = new Map();
        for (const c of existingClients) {
            if (c.email)
                existingMap.set(c.email.toLowerCase(), c);
        }
        for (const [email, stats] of byEmail) {
            const existing = existingMap.get(email);
            const roundedTotal = Math.round(stats.totalSpent * 100) / 100;
            if (existing) {
                // Update seulement si desync
                const needsUpdate = (existing.orderCount || 0) !== stats.orderCount ||
                    Math.abs((parseFloat(existing.totalSpent) || 0) - roundedTotal) > 0.01 ||
                    existing.lastOrderDate !== stats.lastOrderDate;
                if (needsUpdate) {
                    await strapi.documents('api::client.client').update({
                        documentId: existing.documentId,
                        data: {
                            orderCount: stats.orderCount,
                            totalSpent: roundedTotal,
                            lastOrderDate: stats.lastOrderDate,
                            ...(stats.name && !existing.name ? { name: stats.name } : {}),
                            ...(stats.phone && !existing.phone ? { phone: stats.phone } : {}),
                            ...(stats.supabaseUserId && !existing.supabaseUserId ? { supabaseUserId: stats.supabaseUserId } : {}),
                        },
                    });
                }
            }
            else {
                // Auto-creer le client manquant
                await strapi.documents('api::client.client').create({
                    data: {
                        email,
                        name: stats.name || email.split('@')[0],
                        phone: stats.phone,
                        supabaseUserId: stats.supabaseUserId,
                        orderCount: stats.orderCount,
                        totalSpent: roundedTotal,
                        lastOrderDate: stats.lastOrderDate,
                    },
                });
            }
        }
    }
    catch (err) {
        strapi.log.warn('reconcileClientsFromOrders failed:', err);
    }
}
exports.default = strapi_1.factories.createCoreController('api::client.client', ({ strapi }) => ({
    async findAll(ctx) {
        var _a, _b;
        // Auto-reconcile avec les vraies commandes avant de retourner (auto-cree les clients manquants, corrige les desyncs)
        await reconcileClientsFromOrders(strapi);
        const sort = (ctx.query.sort || 'createdAt:desc');
        const pageSize = parseInt(((_b = (_a = ctx.query) === null || _a === void 0 ? void 0 : _a.pagination) === null || _b === void 0 ? void 0 : _b.pageSize) || '100');
        const clients = await strapi.documents('api::client.client').findMany({ sort, limit: pageSize });
        ctx.body = { data: clients };
    },
    async updateOne(ctx) {
        const { documentId } = ctx.params;
        const { data } = ctx.request.body;
        if (!data)
            return ctx.badRequest('data is required');
        const client = await strapi.documents('api::client.client').update({ documentId, data });
        ctx.body = { data: client };
    },
    async deleteOne(ctx) {
        const { documentId } = ctx.params;
        await strapi.documents('api::client.client').delete({ documentId });
        ctx.body = { success: true };
    },
    async adminList(ctx) {
        // Auto-reconcile avec les vraies commandes avant de retourner
        await reconcileClientsFromOrders(strapi);
        const page = parseInt(ctx.query.page) || 1;
        const pageSize = parseInt(ctx.query.pageSize) || 25;
        const search = ctx.query.search;
        const sort = ctx.query.sort || 'lastOrderDate:desc';
        const filters = {};
        if (search) {
            filters.$or = [
                { name: { $containsi: search } },
                { email: { $containsi: search } },
                { company: { $containsi: search } },
            ];
        }
        const [items, allFiltered] = await Promise.all([
            strapi.documents('api::client.client').findMany({
                filters,
                sort: sort,
                limit: pageSize,
                start: (page - 1) * pageSize,
                populate: ['orders'],
            }),
            strapi.documents('api::client.client').findMany({ filters }),
        ]);
        // Enrichir chaque client avec l'adresse du dernier order
        const enriched = items.map((c) => {
            var _a;
            const lastOrder = (_a = c.orders) === null || _a === void 0 ? void 0 : _a[0];
            return {
                ...c,
                lastShippingAddress: (lastOrder === null || lastOrder === void 0 ? void 0 : lastOrder.shippingAddress) || null,
                lastCustomerPhone: (lastOrder === null || lastOrder === void 0 ? void 0 : lastOrder.customerPhone) || c.phone || null,
                orders: undefined, // ne pas envoyer le raw orders au frontend
            };
        });
        const total = allFiltered.length;
        ctx.body = {
            data: enriched,
            meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
        };
    },
    // Liste les utilisateurs inscrits via Supabase Auth.
    //
    // FIX-SORT (3 mai 2026) : Supabase Admin API /auth/v1/admin/users ne
    // garantit aucun tri (ordre BDD arbitraire). Pour exposer la liste
    // "plus recent en premier" comme demande par l'admin, on fetch TOUTES
    // les pages en interne (boucle defensive avec safety cap), on trie par
    // created_at descendant en memoire, PUIS on applique la pagination
    // demandee. Ainsi page=1 contient toujours les dernieres inscriptions,
    // peu importe combien d'users existent en BDD.
    //
    // Cap de securite : 20 pages * 1000 = 20 000 users. Au-dela on log un
    // warning et on tronque - signe qu'il faudrait passer a une query SQL
    // directe sur auth.users plutot que d'iterer l'admin API.
    async listSupabaseUsers(ctx) {
        const supabaseUrl = process.env.SUPABASE_API_URL;
        const supabaseKey = process.env.SUPABASE_API_KEY; // service_role key
        if (!supabaseUrl || !supabaseKey) {
            ctx.status = 500;
            ctx.body = { error: 'Supabase non configure' };
            return;
        }
        const page = parseInt(ctx.query.page) || 1;
        const perPage = parseInt(ctx.query.perPage) || 50;
        try {
            // 1. Fetch all users de Supabase, en boucle pour traverser toutes les pages.
            const FETCH_PAGE_SIZE = 1000; // max admin API recommande
            const MAX_PAGES = 20; // safety cap : 20 000 users
            const allUsers = [];
            let supabaseTotal = null;
            for (let internalPage = 1; internalPage <= MAX_PAGES; internalPage++) {
                const url = `${supabaseUrl}/auth/v1/admin/users?page=${internalPage}&per_page=${FETCH_PAGE_SIZE}`;
                const res = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                    },
                });
                if (!res.ok) {
                    ctx.status = res.status;
                    ctx.body = { error: 'Erreur Supabase Auth' };
                    return;
                }
                const data = await res.json();
                const pageUsers = data.users || [];
                if (typeof data.total === 'number')
                    supabaseTotal = data.total;
                allUsers.push(...pageUsers);
                // Stop si la page renvoyee est partielle (= derniere page)
                if (pageUsers.length < FETCH_PAGE_SIZE)
                    break;
                if (internalPage === MAX_PAGES) {
                    strapi.log.warn(`[listSupabaseUsers] Cap MAX_PAGES atteint a 20 000 users. ` +
                        `Migrer vers une query SQL directe sur auth.users si la base depasse cette taille.`);
                }
            }
            // 2. Tri descendant par date de creation - garantit que la page 1
            // contient toujours les inscriptions les plus recentes.
            allUsers.sort((a, b) => {
                const ta = new Date(a.created_at || 0).getTime() || 0;
                const tb = new Date(b.created_at || 0).getTime() || 0;
                return tb - ta;
            });
            // 3. Mapping vers la shape exposee au frontend.
            const mapped = allUsers.map((u) => {
                var _a;
                const meta = u.user_metadata || {};
                const profileAddress = meta.address ? {
                    address: meta.address,
                    city: meta.city || '',
                    province: meta.province || '',
                    postalCode: meta.postal_code || '',
                    country: meta.country || '',
                } : null;
                return {
                    id: u.id,
                    email: u.email,
                    fullName: meta.full_name || meta.name || null,
                    phone: u.phone || meta.phone || null,
                    createdAt: u.created_at,
                    lastSignIn: u.last_sign_in_at,
                    emailConfirmed: !!u.email_confirmed_at,
                    provider: ((_a = u.app_metadata) === null || _a === void 0 ? void 0 : _a.provider) || 'email',
                    referredBy: meta.referred_by || null,
                    contractSigned: meta.contractSigned || false,
                    contractSignedAt: meta.contractSignedAt || null,
                    contractVersion: meta.contractVersion || null,
                    nomArtiste: meta.nomArtiste || null,
                    profileAddress,
                };
            });
            // 4. Pagination APRES le tri global - page 1 = users les plus recents.
            const total = supabaseTotal !== null && supabaseTotal !== void 0 ? supabaseTotal : mapped.length;
            const start = (page - 1) * perPage;
            const sliced = mapped.slice(start, start + perPage);
            ctx.body = {
                data: sliced,
                meta: {
                    page,
                    perPage,
                    total,
                    pageCount: Math.ceil(total / perPage),
                },
            };
        }
        catch (err) {
            strapi.log.error('Supabase users fetch error:', err);
            ctx.status = 500;
            ctx.body = { error: 'Impossible de recuperer les utilisateurs' };
        }
    },
    // Notification de nouvelle inscription + linking auto des guest orders
    async notifySignup(ctx) {
        const { name, email, provider, supabaseUserId } = ctx.request.body;
        if (!email) {
            ctx.status = 400;
            ctx.body = { error: 'Email requis' };
            return;
        }
        (0, email_1.sendNewUserNotificationEmail)(name || '', email, provider || 'email').catch(err => {
            strapi.log.warn('Email notification inscription non envoye:', err);
        });
        // Linker les guest orders avec cet email au nouveau supabaseUserId
        let linkedCount = 0;
        if (supabaseUserId) {
            try {
                const orders = await strapi.documents('api::order.order').findMany({
                    filters: {
                        customerEmail: email.toLowerCase(),
                        $or: [
                            { supabaseUserId: '' },
                            { supabaseUserId: { $null: true } },
                        ],
                    },
                });
                for (const order of orders) {
                    await strapi.documents('api::order.order').update({
                        documentId: order.documentId,
                        data: { supabaseUserId },
                    });
                    linkedCount++;
                }
                // Aussi update le client record
                const clients = await strapi.documents('api::client.client').findMany({
                    filters: { email: email.toLowerCase() },
                });
                for (const client of clients) {
                    if (!client.supabaseUserId || client.supabaseUserId === '') {
                        await strapi.documents('api::client.client').update({
                            documentId: client.documentId,
                            data: { supabaseUserId },
                        });
                    }
                }
                if (linkedCount > 0) {
                    strapi.log.info(`Auto-linked ${linkedCount} guest orders to new user ${supabaseUserId} (${email})`);
                }
            }
            catch (linkErr) {
                strapi.log.warn('Erreur linking guest orders:', linkErr);
            }
        }
        ctx.body = { success: true, linkedCount };
    },
    // Supprimer un utilisateur Supabase
    async deleteSupabaseUser(ctx) {
        const supabaseUrl = process.env.SUPABASE_API_URL;
        const supabaseKey = process.env.SUPABASE_API_KEY;
        if (!supabaseUrl || !supabaseKey) {
            ctx.status = 500;
            ctx.body = { error: 'Supabase non configure' };
            return;
        }
        const { id } = ctx.params;
        if (!id) {
            ctx.status = 400;
            ctx.body = { error: 'User ID requis' };
            return;
        }
        try {
            const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                },
            });
            if (!res.ok) {
                ctx.status = res.status;
                ctx.body = { error: 'Erreur suppression utilisateur' };
                return;
            }
            ctx.body = { success: true };
        }
        catch (err) {
            strapi.log.error('Supabase user delete error:', err);
            ctx.status = 500;
            ctx.body = { error: 'Impossible de supprimer l\'utilisateur' };
        }
    },
}));
