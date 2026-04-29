import type { Core } from '@strapi/strapi';
import cronTasks from './cron-tasks';

// MONEY RETRIEVER (Phase 7) : on active explicitement le runner cron de
// Strapi et on lui passe les taches definies dans config/cron-tasks.ts.
// Sans ce flag, Strapi ignore les tasks meme si le fichier existe.
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', env('RENDER_EXTERNAL_URL', '')),
  app: {
    keys: env.array('APP_KEYS'),
  },
  cron: {
    enabled: true,
    tasks: cronTasks,
  },
});

export default config;
