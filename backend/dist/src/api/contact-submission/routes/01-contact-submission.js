"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/contact-submissions/submit',
            handler: 'contact-submission.submit',
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/contact-submissions/admin',
            handler: 'contact-submission.adminList',
            config: {
                auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/contact-submissions/:documentId/status',
            handler: 'contact-submission.updateStatus',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/contact-submissions/:documentId/reply',
            handler: 'contact-submission.reply',
            config: {
                auth: false,
            },
        },
        {
            method: 'DELETE',
            path: '/contact-submissions/:documentId',
            handler: 'contact-submission.deleteSubmission',
            config: {
                auth: false,
            },
        },
    ],
};
