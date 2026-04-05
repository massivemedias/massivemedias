"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/artists/cleanup-sold-uniques',
            handler: 'artist.cleanupSoldUniques',
            config: { auth: false },
        },
    ],
};
