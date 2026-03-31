"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/reservations/submit',
            handler: 'reservation.submit',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/reservations/:documentId/status',
            handler: 'reservation.updateStatus',
            config: { auth: false },
        },
    ],
};
