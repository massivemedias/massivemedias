"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'GET',
            path: '/invoices',
            handler: 'invoice.findAll',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/invoices',
            handler: 'invoice.createOne',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/invoices/:documentId',
            handler: 'invoice.updateOne',
            config: { auth: false },
        },
        {
            method: 'DELETE',
            path: '/invoices/:documentId',
            handler: 'invoice.deleteOne',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/invoices/upload-pdf',
            handler: 'invoice.uploadPdf',
            config: { auth: false },
        },
    ],
};
