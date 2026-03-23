"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'GET',
            path: '/analytics/stats',
            handler: 'analytics.getStats',
            config: {
                auth: false,
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/analytics/artist/:slug',
            handler: 'analytics.getArtistStats',
            config: {
                auth: false,
                policies: [],
            },
        },
    ],
};
