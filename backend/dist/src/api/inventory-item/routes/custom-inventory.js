"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'GET',
            path: '/inventory-items/low-stock',
            handler: 'inventory-item.lowStock',
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/inventory-items/dashboard',
            handler: 'inventory-item.dashboard',
            config: {
                auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/inventory-items/:documentId/adjust',
            handler: 'inventory-item.adjustStock',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/inventory-items/create',
            handler: 'inventory-item.createItem',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/inventory-items/import-invoice',
            handler: 'inventory-item.importInvoice',
            config: {
                auth: false,
            },
        },
    ],
};
