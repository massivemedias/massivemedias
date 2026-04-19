"use strict";
/**
 * Helpers d'authentification partages pour tous les controllers custom.
 *
 * Contexte: les routes custom Strapi declarent `config: { auth: false }` pour
 * bypasser le middleware d'auth Strapi v5 qui attend un token Strapi user.
 * Notre auth reelle est via Supabase JWT (frontend) ou ADMIN_API_TOKEN (service).
 * Chaque controller sensible DOIT donc appeler un de ces helpers en tete du
 * handler pour eviter d'exposer les donnees / actions en acces public.
 *
 * Extrait depuis `backend/src/api/order/controllers/order.ts` dans le cadre de
 * la remediation SEC-01 (audit du 2026-04-18).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertOwnershipOrAdmin = exports.requireUserAuth = exports.requireAdminAuth = void 0;
/**
 * Guard pour endpoints destructifs/admin-only (list, update, delete, *admin*).
 *
 * Accepte EITHER:
 *   1. Authorization: Bearer <ADMIN_API_TOKEN>
 *      -> service token pour crons / scripts server-to-server
 *   2. Authorization: Bearer <Supabase JWT>
 *      -> email du JWT doit figurer dans ADMIN_EMAILS (ou ADMIN_EMAIL fallback)
 *
 * @returns true si autorise (le handler peut continuer)
 *          false si rejete (ctx.status = 401 deja positionne, appelant doit return)
 *
 * Pattern d'usage:
 *   async myAdminHandler(ctx) {
 *     if (!(await requireAdminAuth(ctx))) return;
 *     // ... logique metier
 *   }
 */
async function requireAdminAuth(ctx) {
    var _a, _b, _c, _d, _e;
    const authHeader = ctx.request.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        ctx.status = 401;
        ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'Missing Authorization header' } };
        return false;
    }
    // Option A: service token (ADMIN_API_TOKEN)
    const adminApiToken = process.env.ADMIN_API_TOKEN;
    if (adminApiToken && adminApiToken.length >= 16 && token === adminApiToken) {
        ctx.state.adminAuthMethod = 'service-token';
        return true;
    }
    // Option B: Supabase JWT avec email dans ADMIN_EMAILS
    try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY;
        if (supabaseUrl && supabaseKey) {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase.auth.getUser(token);
            if (!error && ((_a = data === null || data === void 0 ? void 0 : data.user) === null || _a === void 0 ? void 0 : _a.email)) {
                const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
                const adminEmails = adminEmailsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
                if (adminEmails.includes(data.user.email.toLowerCase())) {
                    ctx.state.adminAuthMethod = 'supabase-jwt';
                    ctx.state.adminUserEmail = data.user.email;
                    return true;
                }
            }
        }
    }
    catch (e) {
        (_c = (_b = strapi === null || strapi === void 0 ? void 0 : strapi.log) === null || _b === void 0 ? void 0 : _b.warn) === null || _c === void 0 ? void 0 : _c.call(_b, 'requireAdminAuth: Supabase verification error', (e === null || e === void 0 ? void 0 : e.message) || e);
    }
    ctx.status = 401;
    ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'Admin authentication required' } };
    (_e = (_d = strapi === null || strapi === void 0 ? void 0 : strapi.log) === null || _d === void 0 ? void 0 : _d.warn) === null || _e === void 0 ? void 0 : _e.call(_d, `Admin-protected endpoint hit without valid auth: ${ctx.method} ${ctx.url}`);
    return false;
}
exports.requireAdminAuth = requireAdminAuth;
/**
 * Guard pour endpoints user-connecte (un utilisateur accede a SES propres donnees).
 *
 * Accepte un Supabase JWT valide (peu importe l'email, du moment qu'il existe).
 * Attache { userEmail, userId, isAdmin } a ctx.state.user pour que le handler
 * puisse verifier l'ownership des donnees demandees.
 *
 * Usage typique:
 *   async myMessages(ctx) {
 *     if (!(await requireUserAuth(ctx))) return;
 *     const email = (ctx.state as any).user.userEmail;
 *     const msgs = await strapi.documents(...).findMany({ filters: { recipientEmail: email } });
 *     ctx.body = { data: msgs };
 *   }
 *
 * Les admins (emails dans ADMIN_EMAILS) passent AUSSI ce check - utile quand
 * un handler est a la fois user-self ET admin (ex: admin peut voir les messages
 * d'un artiste au nom de cet artiste).
 *
 * @returns true si autorise. ctx.state.user = { userEmail, userId, isAdmin }
 */
async function requireUserAuth(ctx) {
    var _a, _b, _c;
    const authHeader = ctx.request.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        ctx.status = 401;
        ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'Missing Authorization header' } };
        return false;
    }
    // Fast-path pour service token (= admin)
    const adminApiToken = process.env.ADMIN_API_TOKEN;
    if (adminApiToken && adminApiToken.length >= 16 && token === adminApiToken) {
        ctx.state.user = { userEmail: null, userId: null, isAdmin: true, authMethod: 'service-token' };
        return true;
    }
    try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY;
        if (supabaseUrl && supabaseKey) {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase.auth.getUser(token);
            if (!error && ((_a = data === null || data === void 0 ? void 0 : data.user) === null || _a === void 0 ? void 0 : _a.email)) {
                const email = data.user.email.toLowerCase();
                const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
                const adminEmails = adminEmailsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
                ctx.state.user = {
                    userEmail: email,
                    userId: data.user.id,
                    isAdmin: adminEmails.includes(email),
                    authMethod: 'supabase-jwt',
                };
                return true;
            }
        }
    }
    catch (e) {
        (_c = (_b = strapi === null || strapi === void 0 ? void 0 : strapi.log) === null || _b === void 0 ? void 0 : _b.warn) === null || _c === void 0 ? void 0 : _c.call(_b, 'requireUserAuth: Supabase verification error', (e === null || e === void 0 ? void 0 : e.message) || e);
    }
    ctx.status = 401;
    ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'User authentication required' } };
    return false;
}
exports.requireUserAuth = requireUserAuth;
/**
 * Helper utilitaire: verifie que le user connecte est proprietaire d'une
 * ressource, soit via son email soit via le fait qu'il est admin.
 *
 * Exemple:
 *   if (!assertOwnershipOrAdmin(ctx, order.customerEmail)) return;
 *
 * Pre-requis: requireUserAuth(ctx) deja appele avec succes.
 */
function assertOwnershipOrAdmin(ctx, resourceOwnerEmail) {
    var _a;
    const user = (_a = ctx.state) === null || _a === void 0 ? void 0 : _a.user;
    if (!user) {
        ctx.status = 401;
        ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'requireUserAuth must be called first' } };
        return false;
    }
    if (user.isAdmin)
        return true;
    if (!resourceOwnerEmail) {
        ctx.status = 403;
        ctx.body = { error: { status: 403, name: 'Forbidden', message: 'Resource has no owner, admin only' } };
        return false;
    }
    if (String(user.userEmail || '').toLowerCase() !== String(resourceOwnerEmail).toLowerCase()) {
        ctx.status = 403;
        ctx.body = { error: { status: 403, name: 'Forbidden', message: 'You do not own this resource' } };
        return false;
    }
    return true;
}
exports.assertOwnershipOrAdmin = assertOwnershipOrAdmin;
