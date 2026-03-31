"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/artist-edit-requests/create',
            handler: 'artist-edit-request.createRequest',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/artist-edit-requests/my-requests',
            handler: 'artist-edit-request.myRequests',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/artist-edit-requests/admin',
            handler: 'artist-edit-request.adminList',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/artist-edit-requests/:documentId/approve',
            handler: 'artist-edit-request.approve',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/artist-edit-requests/:documentId/reject',
            handler: 'artist-edit-request.reject',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/artist-edit-requests/cleanup-originals',
            handler: 'artist-edit-request.cleanupOriginals',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/artist-edit-requests/upload-direct',
            handler: 'artist-edit-request.uploadDirect',
            config: { auth: false },
        },
    ],
};
