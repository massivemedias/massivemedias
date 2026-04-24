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

  /**
   * POST /admin/users/merge - Fusion de 2 utilisateurs (source -> target).
   *
   * Pattern : l'email est la cle universelle dans le systeme (orders.customerEmail,
   * testimonial.email, contact-submission.email, user-role.email, client.email
   * unique). Merger deux comptes = re-linker toutes les donnees du source vers
   * le target PUIS supprimer le source.
   *
   * Body : { sourceEmail: string, targetEmail: string }
   *
   * Entites touchees (best-effort, chaque bloc catch et log sans bloquer) :
   *   - orders.customerEmail = sourceEmail      -> targetEmail
   *     + si target a un supabaseUserId, on patche supabaseUserId sur ces orders
   *     + si target a un client documentId, on re-connect via client relation
   *   - testimonials.email = sourceEmail        -> targetEmail
   *   - contact-submissions.email = sourceEmail -> targetEmail
   *   - artist-edit-requests.email = sourceEmail -> targetEmail
   *   - user-role ou client source : supprimes apres migration
   *
   * Retour : rapport detaille par entite { updatedOrders, updatedTestimonials, etc. }
   * Tout est admin-only. Pas de dry-run implementation pour l'instant : l'admin
   * doit verifier le preview cote frontend avant de confirmer.
   */
  async mergeUsers(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const body = (ctx.request.body as any) || {};
    const sourceEmail = String(body.sourceEmail || '').trim().toLowerCase();
    const targetEmail = String(body.targetEmail || '').trim().toLowerCase();

    if (!sourceEmail || !targetEmail) {
      return ctx.badRequest('sourceEmail et targetEmail requis');
    }
    if (sourceEmail === targetEmail) {
      return ctx.badRequest('sourceEmail et targetEmail doivent etre differents');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sourceEmail) || !emailRegex.test(targetEmail)) {
      return ctx.badRequest('Format email invalide (source ou target)');
    }

    const report: any = {
      sourceEmail,
      targetEmail,
      updatedOrders: 0,
      updatedTestimonials: 0,
      updatedContactSubmissions: 0,
      updatedArtistEditRequests: 0,
      deletedSourceUserRole: false,
      deletedSourceClient: false,
      errors: [],
    };

    // 1. Resolve le client cible (si present) pour re-connecter les orders
    let targetClientDocId: string | null = null;
    let targetSupabaseUserId: string | null = null;
    try {
      const targetClients = await strapi.documents('api::client.client').findMany({
        filters: { email: { $eqi: targetEmail } } as any,
        limit: 1,
      });
      if (targetClients.length > 0) {
        const tc = targetClients[0] as any;
        targetClientDocId = tc.documentId;
        targetSupabaseUserId = tc.supabaseUserId || null;
      }
    } catch (e: any) {
      report.errors.push(`Lookup target client: ${e?.message}`);
    }

    // 2. Orders : update customerEmail + supabaseUserId + re-connect client
    try {
      const orders = await strapi.documents('api::order.order').findMany({
        filters: { customerEmail: { $eqi: sourceEmail } } as any,
        limit: 5000,
      }) as any[];
      for (const o of orders) {
        try {
          const data: any = { customerEmail: targetEmail };
          if (targetSupabaseUserId) data.supabaseUserId = targetSupabaseUserId;
          if (targetClientDocId) data.client = { connect: [targetClientDocId] };
          await strapi.documents('api::order.order').update({
            documentId: o.documentId,
            data,
          });
          report.updatedOrders++;
        } catch (e: any) {
          report.errors.push(`Order ${o.documentId}: ${e?.message}`);
        }
      }
    } catch (e: any) {
      report.errors.push(`Orders lookup: ${e?.message}`);
    }

    // 3. Testimonials : update email + re-connect client
    try {
      const testimonials = await strapi.documents('api::testimonial.testimonial').findMany({
        filters: { email: { $eqi: sourceEmail } } as any,
        limit: 2000,
      }) as any[];
      for (const t of testimonials) {
        try {
          const data: any = { email: targetEmail };
          if (targetClientDocId) data.client = { connect: [targetClientDocId] };
          await strapi.documents('api::testimonial.testimonial').update({
            documentId: t.documentId,
            data,
          });
          report.updatedTestimonials++;
        } catch (e: any) {
          report.errors.push(`Testimonial ${t.documentId}: ${e?.message}`);
        }
      }
    } catch (e: any) {
      // Content-type peut ne pas exister dans tous les environnements
      if (!/not.*found|doesn.*exist/i.test(e?.message || '')) {
        report.errors.push(`Testimonials lookup: ${e?.message}`);
      }
    }

    // 4. Contact submissions
    try {
      const subs = await strapi.documents('api::contact-submission.contact-submission').findMany({
        filters: { email: { $eqi: sourceEmail } } as any,
        limit: 2000,
      }) as any[];
      for (const s of subs) {
        try {
          await strapi.documents('api::contact-submission.contact-submission').update({
            documentId: s.documentId,
            data: { email: targetEmail } as any,
          });
          report.updatedContactSubmissions++;
        } catch (e: any) {
          report.errors.push(`ContactSubmission ${s.documentId}: ${e?.message}`);
        }
      }
    } catch (e: any) {
      if (!/not.*found|doesn.*exist/i.test(e?.message || '')) {
        report.errors.push(`ContactSubmissions lookup: ${e?.message}`);
      }
    }

    // 5. Artist edit requests
    try {
      const reqs = await strapi.documents('api::artist-edit-request.artist-edit-request' as any).findMany({
        filters: { email: { $eqi: sourceEmail } } as any,
        limit: 2000,
      }) as any[];
      for (const r of reqs) {
        try {
          await strapi.documents('api::artist-edit-request.artist-edit-request' as any).update({
            documentId: r.documentId,
            data: { email: targetEmail } as any,
          });
          report.updatedArtistEditRequests++;
        } catch (e: any) {
          report.errors.push(`ArtistEditRequest ${r.documentId}: ${e?.message}`);
        }
      }
    } catch (e: any) {
      if (!/not.*found|doesn.*exist/i.test(e?.message || '')) {
        report.errors.push(`ArtistEditRequests lookup: ${e?.message}`);
      }
    }

    // 6. Supprimer le user-role source (si existe). L'email etant unique, on ne
    //    peut pas juste le patcher vers targetEmail : il faudrait merger les
    //    champs role/artistSlug/etc. -> plus risque que ca ne vaut. On delete
    //    simplement le user-role source. Si le target n'a pas de role, l'admin
    //    le recreera via /user-roles/set s'il en avait besoin.
    try {
      const sourceRoles = await strapi.documents('api::user-role.user-role').findMany({
        filters: { email: { $eqi: sourceEmail } } as any,
        limit: 5,
      });
      for (const r of sourceRoles as any[]) {
        await strapi.documents('api::user-role.user-role').delete({
          documentId: r.documentId,
        });
        report.deletedSourceUserRole = true;
      }
    } catch (e: any) {
      report.errors.push(`Delete source user-role: ${e?.message}`);
    }

    // 7. Supprimer le client source (ses orders ont ete re-connectes au target)
    try {
      const sourceClients = await strapi.documents('api::client.client').findMany({
        filters: { email: { $eqi: sourceEmail } } as any,
        limit: 5,
      });
      for (const c of sourceClients as any[]) {
        await strapi.documents('api::client.client').delete({
          documentId: c.documentId,
        });
        report.deletedSourceClient = true;
      }
    } catch (e: any) {
      report.errors.push(`Delete source client: ${e?.message}`);
    }

    strapi.log.info(
      `[mergeUsers] ${sourceEmail} -> ${targetEmail} : ` +
      `orders=${report.updatedOrders}, testimonials=${report.updatedTestimonials}, ` +
      `contacts=${report.updatedContactSubmissions}, editReqs=${report.updatedArtistEditRequests}, ` +
      `roleDeleted=${report.deletedSourceUserRole}, clientDeleted=${report.deletedSourceClient}, ` +
      `errors=${report.errors.length}`
    );

    ctx.body = { success: report.errors.length === 0, data: report };
  },
}));
