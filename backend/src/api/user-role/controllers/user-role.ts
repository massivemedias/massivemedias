import { factories } from '@strapi/strapi';
import { requireAdminAuth, requireUserAuth, assertOwnershipOrAdmin } from '../../../utils/auth';

export default factories.createCoreController('api::user-role.user-role', ({ strapi }) => ({

  // GET /user-roles/list - Liste tous les roles (admin only)
  async list(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
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
  // Accessible au user lui-meme (pour lire son propre role apres connexion)
  // OU a un admin (pour voir les roles des autres). Bloque si email != JWT et pas admin.
  async byEmail(ctx) {
    if (!(await requireUserAuth(ctx))) return;
    const { email } = ctx.query;
    if (!(await assertOwnershipOrAdmin(ctx, email as string))) return;
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
    if (!(await requireAdminAuth(ctx))) return;
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

  // PUT /user-roles/artist-data - Sauvegarder renames et hero pour un artiste
  // User connecte peut modifier SES donnees, admin peut modifier les donnees
  // de n'importe quel artiste.
  async updateArtistData(ctx) {
    if (!(await requireUserAuth(ctx))) return;
    const { email, itemRenames, heroImageId } = ctx.request.body as any;
    if (!email) { ctx.throw(400, 'Email required'); return; }
    if (!assertOwnershipOrAdmin(ctx, email)) return;

    try {
      const existing = await strapi.documents('api::user-role.user-role').findMany({
        filters: { email: { $eqi: email } },
        limit: 1,
      });
      if (!existing || existing.length === 0) { ctx.throw(404, 'User role not found'); return; }

      const updateData: any = {};
      if (itemRenames !== undefined) updateData.itemRenames = itemRenames;
      if (heroImageId !== undefined) updateData.heroImageId = heroImageId;

      await strapi.documents('api::user-role.user-role').update({
        documentId: existing[0].documentId,
        data: updateData,
      });

      ctx.body = { success: true };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // GET /user-roles/artist-data/:slug - Lire les renames et hero d'un artiste (public)
  async getArtistData(ctx) {
    const { slug } = ctx.params;
    try {
      const entries = await strapi.documents('api::user-role.user-role').findMany({
        filters: { artistSlug: slug },
        limit: 1,
      });
      if (!entries || entries.length === 0) {
        ctx.body = { data: { itemRenames: {}, heroImageId: null } };
        return;
      }
      const e: any = entries[0];
      ctx.body = { data: { itemRenames: e.itemRenames || {}, heroImageId: e.heroImageId || null } };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  // DELETE /user-roles/:documentId - Supprimer un role (remet en user)
  async removeRole(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
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
