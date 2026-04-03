"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/mockup/generate',
            handler: 'mockup.generate',
            config: { auth: false },
        },
    ],
};
