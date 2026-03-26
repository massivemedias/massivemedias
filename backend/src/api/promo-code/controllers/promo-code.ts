/**
 * Promo code validation controller
 *
 * Codes promo valides (hardcoded pour le moment).
 * Pour ajouter/modifier des codes, editer la map PROMO_CODES ci-dessous.
 * A terme, ces codes pourront etre geres via une collection Strapi.
 */

const PROMO_CODES: Record<string, { discountPercent: number; label: string }> = {
  'MASSIVE6327': { discountPercent: 20, label: 'Promo Massive 20%' },
};

export default {
  async validate(ctx) {
    const { code } = ctx.request.body as any;

    if (!code || typeof code !== 'string') {
      ctx.body = { valid: false };
      return;
    }

    const promo = PROMO_CODES[code.toUpperCase().trim()];

    if (promo) {
      ctx.body = {
        valid: true,
        discountPercent: promo.discountPercent,
        label: promo.label,
      };
    } else {
      ctx.body = { valid: false };
    }
  },
};
