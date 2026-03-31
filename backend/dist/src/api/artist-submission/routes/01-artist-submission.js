"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/artist-submissions/submit',
            handler: 'artist-submission.submit',
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/artist-submissions/admin',
            handler: 'artist-submission.adminList',
            config: {
                auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/artist-submissions/:documentId/status',
            handler: 'artist-submission.updateStatus',
            config: {
                auth: false,
            },
        },
        {
            method: 'DELETE',
            path: '/artist-submissions/:documentId',
            handler: 'artist-submission.deleteSubmission',
            config: {
                auth: false,
            },
        },
    ],
};
