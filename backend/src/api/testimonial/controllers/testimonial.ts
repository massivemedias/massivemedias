import { factories } from '@strapi/strapi';
import crypto from 'crypto';

export default factories.createCoreController('api::testimonial.testimonial', ({ strapi }) => ({

  // GET /testimonials/public - temoignages approuves pour le site
  async publicList(ctx) {
    const items = await strapi.documents('api::testimonial.testimonial').findMany({
      filters: { approved: true },
      sort: 'createdAt:desc',
      limit: 20,
    });

    ctx.body = {
      data: items.map((t: any) => ({
        id: t.id,
        documentId: t.documentId,
        name: t.name,
        roleFr: t.roleFr,
        roleEn: t.roleEn,
        textFr: t.textFr,
        textEn: t.textEn,
        rating: t.rating,
        featured: t.featured,
        createdAt: t.createdAt,
      })),
    };
  },

  // GET /testimonials/admin - liste admin avec pagination
  async adminList(ctx) {
    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 25;
    const status = ctx.query.status as string;
    const search = ctx.query.search as string;

    const filters: any = {};
    if (status === 'approved') filters.approved = true;
    if (status === 'pending') filters.approved = false;
    if (search) {
      filters.$or = [
        { name: { $containsi: search } },
        { email: { $containsi: search } },
        { textFr: { $containsi: search } },
      ];
    }

    const [items, allFiltered] = await Promise.all([
      strapi.documents('api::testimonial.testimonial').findMany({
        filters,
        sort: 'createdAt:desc',
        limit: pageSize,
        start: (page - 1) * pageSize,
        populate: { order: true, client: true },
      }),
      strapi.documents('api::testimonial.testimonial').findMany({ filters }),
    ]);

    const total = allFiltered.length;
    ctx.body = {
      data: items,
      meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
    };
  },

  // POST /testimonials/submit - soumission publique via token
  async submit(ctx) {
    const { token, textFr, textEn, rating, name, role } = ctx.request.body as any;

    if (!token || !textFr) {
      return ctx.badRequest('Token et temoignage requis');
    }

    // Trouver le temoignage par token
    const existing = await strapi.documents('api::testimonial.testimonial').findFirst({
      filters: { token },
    });

    if (!existing) {
      return ctx.notFound('Lien invalide ou expire');
    }

    // Verifier qu'il n'a pas deja ete soumis
    if ((existing as any).textFr && (existing as any).approved) {
      return ctx.badRequest('Ce temoignage a deja ete soumis');
    }

    const updateData: any = {
      textFr,
      rating: rating || 5,
    };
    if (textEn) updateData.textEn = textEn;
    if (name) updateData.name = name;
    if (role) {
      updateData.roleFr = role;
      updateData.roleEn = role;
    }

    const updated = await strapi.documents('api::testimonial.testimonial').update({
      documentId: (existing as any).documentId,
      data: updateData,
    });

    strapi.log.info(`Temoignage soumis par ${(existing as any).email} (token: ${token})`);
    ctx.body = { success: true, data: updated };
  },

  // POST /testimonials/generate-link - admin genere un lien pour un client
  async generateLink(ctx) {
    const { orderId, clientEmail, clientName } = ctx.request.body as any;

    if (!clientEmail || !clientName) {
      return ctx.badRequest('Email et nom du client requis');
    }

    const token = crypto.randomBytes(16).toString('hex');

    const data: any = {
      name: clientName,
      email: clientEmail,
      textFr: '',
      token,
      approved: false,
    };

    // Lier a la commande si fournie
    if (orderId) {
      data.order = { connect: [orderId] };
    }

    // Chercher le client par email
    const client = await strapi.documents('api::client.client').findFirst({
      filters: { email: clientEmail },
    });
    if (client) {
      data.client = { connect: [(client as any).documentId] };
    }

    const testimonial = await strapi.documents('api::testimonial.testimonial').create({ data });

    const siteUrl = process.env.SITE_URL || 'https://massivemedias.com';
    const link = `${siteUrl}/temoignage?token=${token}`;

    strapi.log.info(`Lien temoignage genere pour ${clientEmail}: ${link}`);
    ctx.body = { success: true, token, link, data: testimonial };
  },

  // PUT /testimonials/:documentId/approve - approuver/rejeter
  async approve(ctx) {
    const { documentId } = ctx.params;
    const { approved, featured } = ctx.request.body as any;

    const item = await strapi.documents('api::testimonial.testimonial').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Temoignage introuvable');

    const updateData: any = {};
    if (approved !== undefined) updateData.approved = approved;
    if (featured !== undefined) updateData.featured = featured;

    const updated = await strapi.documents('api::testimonial.testimonial').update({
      documentId: (item as any).documentId,
      data: updateData,
    });

    ctx.body = { data: updated };
  },

  // DELETE /testimonials/:documentId
  async deleteTestimonial(ctx) {
    const { documentId } = ctx.params;

    const item = await strapi.documents('api::testimonial.testimonial').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Temoignage introuvable');

    await strapi.documents('api::testimonial.testimonial').delete({
      documentId: (item as any).documentId,
    });

    ctx.body = { success: true };
  },
}));
