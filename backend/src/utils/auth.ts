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

type Ctx = any;

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
export async function requireAdminAuth(ctx: Ctx): Promise<boolean> {
  const authHeader = (ctx.request.headers['authorization'] as string) || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    ctx.status = 401;
    ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'Missing Authorization header' } };
    return false;
  }

  // Option A: service token (ADMIN_API_TOKEN)
  const adminApiToken = process.env.ADMIN_API_TOKEN;
  if (adminApiToken && adminApiToken.length >= 16 && token === adminApiToken) {
    (ctx.state as any).adminAuthMethod = 'service-token';
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
      if (!error && data?.user?.email) {
        const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
        const adminEmails = adminEmailsRaw.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        if (adminEmails.includes(data.user.email.toLowerCase())) {
          (ctx.state as any).adminAuthMethod = 'supabase-jwt';
          (ctx.state as any).adminUserEmail = data.user.email;
          return true;
        }
      }
    }
  } catch (e: any) {
    (strapi as any)?.log?.warn?.('requireAdminAuth: Supabase verification error', e?.message || e);
  }

  ctx.status = 401;
  ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'Admin authentication required' } };
  (strapi as any)?.log?.warn?.(`Admin-protected endpoint hit without valid auth: ${ctx.method} ${ctx.url}`);
  return false;
}

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
export async function requireUserAuth(ctx: Ctx): Promise<boolean> {
  const authHeader = (ctx.request.headers['authorization'] as string) || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    ctx.status = 401;
    ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'Missing Authorization header' } };
    return false;
  }

  // Fast-path pour service token (= admin)
  const adminApiToken = process.env.ADMIN_API_TOKEN;
  if (adminApiToken && adminApiToken.length >= 16 && token === adminApiToken) {
    (ctx.state as any).user = { userEmail: null, userId: null, isAdmin: true, authMethod: 'service-token' };
    return true;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY;
    if (supabaseUrl && supabaseKey) {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user?.email) {
        const email = data.user.email.toLowerCase();
        const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
        const adminEmails = adminEmailsRaw.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        (ctx.state as any).user = {
          userEmail: email,
          userId: data.user.id,
          isAdmin: adminEmails.includes(email),
          authMethod: 'supabase-jwt',
        };
        return true;
      }
    }
  } catch (e: any) {
    (strapi as any)?.log?.warn?.('requireUserAuth: Supabase verification error', e?.message || e);
  }

  ctx.status = 401;
  ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'User authentication required' } };
  return false;
}

/**
 * Helper utilitaire: verifie que le user connecte est proprietaire d'une
 * ressource, soit via son email soit via le fait qu'il est admin.
 *
 * Exemple:
 *   if (!assertOwnershipOrAdmin(ctx, order.customerEmail)) return;
 *
 * Pre-requis: requireUserAuth(ctx) deja appele avec succes.
 */
export function assertOwnershipOrAdmin(ctx: Ctx, resourceOwnerEmail: string | null | undefined): boolean {
  const user = (ctx.state as any)?.user;
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'requireUserAuth must be called first' } };
    return false;
  }
  if (user.isAdmin) return true;
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
