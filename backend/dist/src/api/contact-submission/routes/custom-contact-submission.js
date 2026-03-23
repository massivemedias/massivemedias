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
    ],
};
