import { factories } from '@strapi/strapi';
import { PROMO_CODES } from '../../../utils/promo-codes';

export default factories.createCoreController('api::promo-code.promo-code' as any, ({ strapi }) => ({

  // POST /promo-codes/validate - retrocompat avec l'ancien format
  async validate(ctx) {
    const { code } = ctx.request.body as any;

    if (!code || typeof code !== 'string') {
      ctx.body = { valid: false };
      return;
    }

    const upperCode = code.toUpperCase().trim();

    // FIX-CONSISTENCY (2 mai 2026) : check D'ABORD la table hardcodee
    // (utilisee par order.ts pour le calcul final). Garantit qu'un code
    // valide ici est appliquable au checkout. Si absent en hardcode,
    // fallback sur la BDD pour les codes admin-managed.
    const hardcoded = PROMO_CODES[upperCode];
    if (hardcoded) {
      ctx.body = {
        valid: true,
        discountPercent: hardcoded.discountPercent,
        label: hardcoded.label,
      };
      return;
    }

    const promo: any = await strapi.documents('api::promo-code.promo-code' as any).findFirst({
      filters: { code: upperCode },
    });

    if (!promo) {
      ctx.body = { valid: false };
      return;
    }

    // Verifier actif
    if (!promo.active) {
      ctx.body = { valid: false, reason: 'Code desactive' };
      return;
    }

    // Verifier expiration
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      ctx.body = { valid: false, reason: 'Code expire' };
      return;
    }

    // Verifier limite d'utilisation (0 = illimite)
    if (promo.maxUses > 0 && (promo.currentUses || 0) >= promo.maxUses) {
      ctx.body = { valid: false, reason: 'Limite d\'utilisation atteinte' };
      return;
    }

    // Incrementer le compteur d'utilisation
    await strapi.documents('api::promo-code.promo-code' as any).update({
      documentId: promo.documentId,
      data: { currentUses: (promo.currentUses || 0) + 1 },
    });

    ctx.body = {
      valid: true,
      discountPercent: promo.discountPercent,
      label: promo.label,
    };
  },

  // GET /promo-codes - liste tous les codes promo
  async list(ctx) {
    const promos = await strapi.documents('api::promo-code.promo-code' as any).findMany({
      sort: { createdAt: 'desc' } as any,
      limit: 200,
    });
    ctx.body = { data: promos };
  },

  // POST /promo-codes - creer un code promo
  async createCode(ctx) {
    const { code, discountPercent, label, active, expiresAt, maxUses } = ctx.request.body as any;

    if (!code || !discountPercent || !label) {
      return ctx.badRequest('code, discountPercent et label sont requis');
    }

    const upperCode = code.toUpperCase().trim().replace(/\s+/g, '');
    if (!upperCode) return ctx.badRequest('Code invalide');

    // Verifier unicite
    const existing = await strapi.documents('api::promo-code.promo-code' as any).findFirst({
      filters: { code: upperCode },
    });
    if (existing) {
      return ctx.badRequest(`Le code "${upperCode}" existe deja`);
    }

    const promo = await strapi.documents('api::promo-code.promo-code' as any).create({
      data: {
        code: upperCode,
        discountPercent: Math.min(100, Math.max(1, Number(discountPercent) || 10)),
        label: label.trim(),
        active: active !== false,
        expiresAt: expiresAt || null,
        maxUses: Number(maxUses) || 0,
        currentUses: 0,
      } as any,
    });

    strapi.log.info(`Code promo cree: ${upperCode} (${discountPercent}%)`);
    ctx.body = { data: promo };
  },

  // PUT /promo-codes/:documentId - modifier un code promo
  async updateCode(ctx) {
    const { documentId } = ctx.params;
    const updates = ctx.request.body as any;

    if (!documentId) return ctx.badRequest('documentId requis');

    const data: any = {};
    if (updates.code) data.code = updates.code.toUpperCase().trim().replace(/\s+/g, '');
    if (updates.discountPercent !== undefined) data.discountPercent = Math.min(100, Math.max(1, Number(updates.discountPercent) || 10));
    if (updates.label !== undefined) data.label = updates.label;
    if (updates.active !== undefined) data.active = !!updates.active;
    if (updates.expiresAt !== undefined) data.expiresAt = updates.expiresAt || null;
    if (updates.maxUses !== undefined) data.maxUses = Number(updates.maxUses) || 0;
    if (updates.currentUses !== undefined) data.currentUses = Number(updates.currentUses) || 0;

    const promo = await strapi.documents('api::promo-code.promo-code' as any).update({
      documentId,
      data,
    });

    ctx.body = { data: promo };
  },

  // DELETE /promo-codes/:documentId - supprimer un code promo
  async deleteCode(ctx) {
    const { documentId } = ctx.params;
    if (!documentId) return ctx.badRequest('documentId requis');

    await strapi.documents('api::promo-code.promo-code' as any).delete({ documentId });
    ctx.body = { success: true };
  },
}));
