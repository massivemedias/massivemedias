"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'GET',
            path: '/user-roles/list',
            handler: 'user-role.list',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/user-roles/by-email',
            handler: 'user-role.byEmail',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/user-roles/set',
            handler: 'user-role.setRole',
            config: { auth: false },
        },
        {
            method: 'PUT',
            path: '/user-roles/artist-data',
            handler: 'user-role.updateArtistData',
            config: { auth: false },
        },
        {
            method: 'GET',
            path: '/user-roles/artist-data/:slug',
            handler: 'user-role.getArtistData',
            config: { auth: false },
        },
        {
            method: 'DELETE',
            path: '/user-roles/:documentId',
            handler: 'user-role.removeRole',
            config: { auth: false },
        },
    ],
};
