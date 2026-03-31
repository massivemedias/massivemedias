"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Promo code validation controller
 * Les codes sont dans src/utils/promo-codes.ts (un seul endroit)
 */
const promo_codes_1 = require("../../../utils/promo-codes");
exports.default = {
    async validate(ctx) {
        const { code } = ctx.request.body;
        if (!code || typeof code !== 'string') {
            ctx.body = { valid: false };
            return;
        }
        const promo = promo_codes_1.PROMO_CODES[code.toUpperCase().trim()];
        if (promo) {
            ctx.body = {
                valid: true,
                discountPercent: promo.discountPercent,
                label: promo.label,
            };
        }
        else {
            ctx.body = { valid: false };
        }
    },
};
