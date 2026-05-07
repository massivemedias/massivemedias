import type { Core } from '@strapi/strapi';
import cronTasks from './cron-tasks';

// MONEY RETRIEVER (Phase 7) : on active explicitement le runner cron de
// Strapi et on lui passe les taches definies dans config/cron-tasks.ts.
// Sans ce flag, Strapi ignore les tasks meme si le fichier existe.
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', env('RENDER_EXTERNAL_URL', '')),
  // FIX-HTTP2-PROTOCOL (re-applied 5 mai 2026 v2) : `proxy: true` est CRUCIAL
  // quand Strapi tourne derriere un load balancer (Render + Cloudflare). Sans
  // ce flag, Koa ne fait pas confiance aux headers X-Forwarded-* (For/Proto/
  // Host) -> ctx.protocol = 'http' meme en HTTPS via le LB -> URLs incoherentes
  // qui peuvent generer des RST_STREAM HTTP/2 cote proxy. Avec proxy: true,
  // Koa lit les vrais X-Forwarded-* envoyes par Render/CF -> coherence des
  // headers HTTP/2 maintenue tout le long du flow de la requete.
  proxy: true,
  app: {
    keys: env.array('APP_KEYS'),
  },
  cron: {
    enabled: true,
    tasks: cronTasks,
  },
});

export default config;
