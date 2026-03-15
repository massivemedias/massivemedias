import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::user-role.user-role', ({ strapi }) => ({

  // GET /user-roles/list - Liste tous les roles
  async list(ctx) {
    try {
      const entries = await strapi.documents('api::user-role.user-role').findMany({
        sort: { createdAt: 'desc' },
      });

      ctx.body = {
        data: (entries || []).map((e: any) => ({
          documentId: e.documentId,
          email: e.email,
          role: e.role,
          artistSlug: e.artistSlug,
          supabaseUserId: e.supabaseUserId,
          displayName: e.displayName,
        })),
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // GET /user-roles/by-email?email=xxx - Role d'un user par email
  async byEmail(ctx) {
    const { email } = ctx.query;
    if (!email) {
      ctx.throw(400, 'Email required');
      return;
    }

    try {
      const entries = await strapi.documents('api::user-role.user-role').findMany({
        filters: { email: { $eqi: email as string } },
        limit: 1,
      });

      if (!entries || entries.length === 0) {
        ctx.body = { data: { role: 'user', artistSlug: null } };
        return;
      }

      const e: any = entries[0];
      ctx.body = {
        data: {
          documentId: e.documentId,
          email: e.email,
          role: e.role,
          artistSlug: e.artistSlug,
          displayName: e.displayName,
        },
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // PUT /user-roles/set - Definir le role d'un user
  // Body: { email, role, artistSlug?, supabaseUserId?, displayName? }
  async setRole(ctx) {
    const { email, role, artistSlug, supabaseUserId, displayName } = ctx.request.body as any;

    if (!email || !role) {
      ctx.throw(400, 'Email and role required');
      return;
    }

    if (!['user', 'artist'].includes(role)) {
      ctx.throw(400, 'Role must be "user" or "artist"');
      return;
    }

    try {
      // Chercher si un role existe deja pour cet email
      const existing = await strapi.documents('api::user-role.user-role').findMany({
        filters: { email: { $eqi: email } },
        limit: 1,
      });

      let entry: any;

      if (existing && existing.length > 0) {
        // Mettre a jour
        entry = await strapi.documents('api::user-role.user-role').update({
          documentId: existing[0].documentId,
          data: {
            role,
            artistSlug: artistSlug || null,
            supabaseUserId: supabaseUserId || existing[0].supabaseUserId,
            displayName: displayName || existing[0].displayName,
          },
        });
      } else {
        // Creer
        entry = await strapi.documents('api::user-role.user-role').create({
          data: {
            email: email.toLowerCase().trim(),
            role,
            artistSlug: artistSlug || null,
            supabaseUserId: supabaseUserId || null,
            displayName: displayName || null,
          },
        });
      }

      ctx.body = {
        data: {
          documentId: entry.documentId,
          email: entry.email,
          role: entry.role,
          artistSlug: entry.artistSlug,
        },
      };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // DELETE /user-roles/:documentId - Supprimer un role (remet en user)
  async removeRole(ctx) {
    const { documentId } = ctx.params;

    try {
      await strapi.documents('api::user-role.user-role').delete({
        documentId,
      });
      ctx.body = { data: { success: true } };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },
}));
