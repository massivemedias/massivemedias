"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cron_tasks_1 = __importDefault(require("./cron-tasks"));
// MONEY RETRIEVER (Phase 7) : on active explicitement le runner cron de
// Strapi et on lui passe les taches definies dans config/cron-tasks.ts.
// Sans ce flag, Strapi ignore les tasks meme si le fichier existe.
const config = ({ env }) => ({
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    url: env('PUBLIC_URL', env('RENDER_EXTERNAL_URL', '')),
    app: {
        keys: env.array('APP_KEYS'),
    },
    cron: {
        enabled: true,
        tasks: cron_tasks_1.default,
    },
});
exports.default = config;
