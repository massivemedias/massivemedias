import { factories } from '@strapi/strapi';
import { requireAdminAuth } from '../../../utils/auth';
import { syncInstagram } from '../../../utils/instagram-sync';

/**
 * IG-FEED : le frontend lit `latest` (public, read-only). Aucune donnee
 * sensible : id public, permalink public, image proxifiee, legende publique,
 * date. `syncNow` (admin) permet de declencher une sync a la main depuis le
 * dashboard sans attendre le cron.
 */
export default factories.createCoreController('api::instagram-post.instagram-post' as any, ({ strapi }) => ({

  // GET /instagram-posts/latest?limit=4 - public, sert le cache local.
  async latest(ctx) {
    const raw = parseInt(String(ctx.query.limit ?? '4'), 10);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 8) : 4;
    const posts = await (strapi.documents as any)('api::instagram-post.instagram-post').findMany({
      sort: 'postedAt:desc',
      limit,
    });
    ctx.body = {
      data: (posts || []).map((p: any) => ({
        igId: p.igId,
        permalink: p.permalink,
        mediaType: p.mediaType,
        thumbUrl: p.thumbUrl,
        caption: p.caption,
        postedAt: p.postedAt,
      })),
    };
  },

  // POST /instagram-posts/sync-now - admin, declenche une sync immediate.
  async syncNow(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const result = await syncInstagram(strapi);
    ctx.body = { data: result };
  },
}));
