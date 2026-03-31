"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/withdrawal-requests/create',
            handler: 'withdrawal-request.createRequest',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/withdrawal-requests/my-requests',
            handler: 'withdrawal-request.myRequests',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/withdrawal-requests/admin',
            handler: 'withdrawal-request.adminList',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/withdrawal-requests/:documentId/process',
            handler: 'withdrawal-request.processRequest',
            config: { auth: false },
        },
    ],
};
