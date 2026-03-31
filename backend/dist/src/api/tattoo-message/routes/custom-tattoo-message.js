"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/tattoo-messages/send',
            handler: 'tattoo-message.send',
            config: { auth: false },
        },
    ],
};
