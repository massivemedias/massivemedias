/**
 * Promo code validation controller
 * Les codes sont dans src/utils/promo-codes.ts (un seul endroit)
 */
import { PROMO_CODES } from '../../../utils/promo-codes';

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
