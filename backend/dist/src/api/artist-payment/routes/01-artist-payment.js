"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'GET',
            path: '/artist-payments/list',
            handler: 'artist-payment.listPayments',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/artist-payments/create',
            handler: 'artist-payment.createPayment',
            config: {
                auth: false,
            },
        },
    ],
};
