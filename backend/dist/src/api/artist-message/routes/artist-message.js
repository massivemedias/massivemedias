"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Core router disabled - all routes are custom (custom-artist-message.ts)
// The default core router was intercepting custom paths like /admin and /my-messages
// by matching them as :id params (GET /artist-messages/:id) with auth required.
exports.default = { routes: [] };
