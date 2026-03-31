"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/promo-codes/validate',
            handler: 'promo-code.validate',
            config: {
                auth: false,
            },
        },
    ],
};
