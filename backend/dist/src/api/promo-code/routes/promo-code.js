"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        // Validate DOIT etre avant le POST generique pour eviter conflit de matching
        {
            method: 'POST',
            path: '/promo-codes/validate',
            handler: 'promo-code.validate',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/promo-codes',
            handler: 'promo-code.list',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/promo-codes',
            handler: 'promo-code.createCode',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/promo-codes/:documentId',
            handler: 'promo-code.updateCode',
            config: { auth: false },
        },
        {
            method: 'DELETE',
            path: '/promo-codes/:documentId',
            handler: 'promo-code.deleteCode',
            config: { auth: false },
        },
    ],
};
