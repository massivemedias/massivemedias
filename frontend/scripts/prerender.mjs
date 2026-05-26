#!/usr/bin/env node
/**
 * prerender.mjs
 *
 * Apres vite build : ouvre chaque route dans Chromium headless via sirv local,
 * attend le rendu React complet (mount + react-helmet-async head injection),
 * injecte un <meta name="x-prerendered" content="1"> dans le head, et ecrit
 * le HTML final dans dist/<route>/index.html.
 *
 * Pourquoi : sans prerender, Google recoit la coquille Vite et indexe une
 * page vide (cf. Search Console : 52 pages "Detectee/Exploree non indexee").
 *
 * REGLE DE SECURITE : ce script ne casse JAMAIS un deploiement.
 *   - Chromium absent / sandbox interdit / module manquant -> log + exit 0.
 *   - Routes en echec ponctuel -> log + on continue avec les autres.
 *   - En CI (CI=1) ou CF_PAGES=1 -> toujours exit 0, le deploy continue.
 *   - En local sans CI -> exit 2 si fail (signal pour iterer), exit 0 si OK.
 *
 * MARQUEUR x-prerendered : lu par cloudflare-worker/og-worker.js, qui skip
 * son injection HTMLRewriter quand il voit ce marqueur (evite d'ecraser les
 * meta du snapshot avec des meta plus generiques).
 *
 * IMPORTS DYNAMIQUES (sirv, puppeteer) : dans main() try/catch. Un import
 * statique au top niveau crash Node avant que main() puisse l'attraper, ce
 * qui violerait la regle "ne jamais casser le deploy".
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { getAllPrerenderRoutes, STRAPI_API } from './routes.mjs';

const __filename = fileURLToPath(import.meta.url);
// __filename = .../frontend/scripts/prerender.mjs -> DIST = .../frontend/dist
const DIST = resolve(dirname(__filename), '..', 'dist');
// PORT 5174 et HOSTNAME 'localhost' (pas 127.0.0.1) sont volontaires :
// la whitelist CORS de Strapi prod (backend/config/middlewares.ts) accepte
// uniquement http://localhost:{3000,5173,5174}. Si on utilisait 127.0.0.1
// ou 4173, Strapi retourne 500 sur le preflight CORS depuis le browser
// headless -> useArtists fetch fail silent -> snapshots artistes vides.
// Port 5174 plutot que 5173 pour ne pas entrer en conflit avec un eventuel
// `vite dev` qui tourne en parallele (5173 = default vite).
const PORT = 5174;
const HOST = `http://localhost:${PORT}`;
const IS_CI = !!(process.env.CI || process.env.CF_PAGES);

function banner(title, lines = []) {
  const sep = '='.repeat(72);
  console.log('');
  console.log(sep);
  console.log(`  ${title}`);
  for (const l of lines) console.log(`  ${l}`);
  console.log(sep);
  console.log('');
}

/**
 * Exit 0 en CI/CF_PAGES (jamais casser le deploy). Exit 'code' en local.
 */
function exitSafe(code) {
  if (IS_CI) {
    if (code !== 0) {
      console.log(`[prerender] exit code ${code} demande -> mais CI/CF_PAGES detecte, exit 0 pour ne pas casser le deploy.`);
    }
    process.exit(0);
  }
  process.exit(code);
}

async function main() {
  // 1. Verifier que dist/ existe (vite build a tourne avant nous).
  if (!existsSync(DIST)) {
    banner('PRERENDER SKIP', [
      `dist/ introuvable a ${DIST}.`,
      'vite build doit avoir tourne avant. Skip prerender.',
    ]);
    return exitSafe(0);
  }
  if (!existsSync(join(DIST, 'index.html'))) {
    banner('PRERENDER SKIP', ['dist/index.html introuvable. Skip prerender.']);
    return exitSafe(0);
  }

  // 2. Resoudre la liste des routes (hit Strapi pour les slugs artistes).
  let routes;
  try {
    routes = await getAllPrerenderRoutes();
  } catch (err) {
    banner('PRERENDER SKIP', [
      'Resolution des routes a echoue :',
      err?.message || String(err),
    ]);
    return exitSafe(0);
  }

  // Lit le title shell pour le fallback de detection helmet.
  // Utilise par le 3e niveau du waitForFunction si data-rh n'est pas trouve.
  let defaultTitle = '';
  try {
    const shell = readFileSync(join(DIST, 'index.html'), 'utf8');
    const m = shell.match(/<title>([^<]*)<\/title>/i);
    if (m) defaultTitle = m[1].trim();
    console.log(`[prerender] Title shell : "${defaultTitle}"`);
  } catch (_) { /* ignore */ }

  // 3. Imports dynamiques de sirv + puppeteer.
  //    Un import statique top-level crasherait Node avant qu'on puisse
  //    attraper l'erreur et exit safely. Donc tout est ici dans main().
  let sirv, puppeteer;
  try {
    ({ default: sirv } = await import('sirv'));
    ({ default: puppeteer } = await import('puppeteer'));
  } catch (err) {
    banner('PRERENDER SKIP', [
      'Import de sirv ou puppeteer a echoue :',
      err?.message || String(err),
      '',
      'Pour activer le prerender en local :',
      '  cd frontend && npm install --legacy-peer-deps',
      '',
      'Skip prerender, le deploy continue.',
    ]);
    return exitSafe(0);
  }

  // 4. Demarre sirv (sert dist/ en SPA mode pour Chromium).
  const { createServer } = await import('node:http');
  const handler = sirv(DIST, { single: true, dev: false, etag: false });
  const server = createServer(handler);
  try {
    await new Promise((res, rej) => {
      server.once('error', rej);
      // Bind sur 127.0.0.1 (loopback) - le browser headless naviguera via
      // 'localhost' (cf. HOST), le DNS local resoudra vers 127.0.0.1.
      // L'Origin envoye par le browser sera 'http://localhost:5174', matche
      // par la whitelist CORS de Strapi.
      server.listen(PORT, '127.0.0.1', res);
    });
  } catch (err) {
    banner('PRERENDER SKIP', [
      `sirv n'a pas pu ecouter sur le port ${PORT} :`,
      err?.message || String(err),
    ]);
    return exitSafe(0);
  }
  console.log(`[prerender] sirv up sur ${HOST}, ${routes.length} routes a pre-rendre`);

  // 5. Warm-up Strapi (1er hit reveille le free tier Render).
  //    Sans ca, la 1ere page artiste prendrait 30s+ et timeout.
  try {
    await fetch(`${STRAPI_API}/artists?fields[0]=slug&pagination[pageSize]=1`, {
      signal: AbortSignal.timeout(20000),
    });
    console.log('[prerender] Strapi warm-up OK');
  } catch (_) {
    console.log('[prerender] Strapi warm-up echoue (non bloquant)');
  }

  // 6. Lance Chromium.
  //    --lang=fr-CA : force la locale du browser headless en francais
  //    canadien. Sans ca, Chromium tombe en en-US par defaut, ce qui fait
  //    que l'app (multilingue FR/EN/ES avec detection navigator.language)
  //    rend toutes les pages en anglais -> snapshots SEO en EN au lieu
  //    de FR. La VRAIE prod sert FR aux visiteurs fr-CA majoritaires.
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=fr-CA'],
    });
  } catch (err) {
    banner('PRERENDER SKIP', [
      'Lancement Chromium a echoue :',
      err?.message || String(err),
      '',
      'En CI / CF_PAGES, c\'est attendu si le runner n\'a pas Chromium.',
      'Le deploy continue sans prerender.',
    ]);
    try { server.close(); } catch (_) { /* ignore */ }
    // exitSafe(2) : en local, signal au dev que son env n'a pas Chromium
    // (npm install --legacy-peer-deps oublie ? Sandbox refuse ?). En CI ou
    // CF_PAGES, exitSafe force exit 0 -> deploy continue meme sans prerender.
    return exitSafe(2);
  }

  // 7. Iterate sur chaque route.
  // IMPORTANT : on ne touche PAS dist/index.html pendant la boucle.
  // sirv en mode single l'utilise comme fallback SPA pour TOUTES les
  // routes inexistantes physiquement (/a-propos, /artistes/mok, etc.).
  // Si on l'ecrasait par le snapshot SSR de '/' au milieu de la boucle,
  // sirv servirait ensuite ce snapshot pour les autres routes, et React
  // tenterait d'hydrater une home pre-rendue sur une URL differente ->
  // crash silencieux du mount -> timeout sur #root pour les 32 suivantes.
  // Le snapshot de '/' est donc bufferise en memoire et ecrit a la toute
  // fin, une fois que la boucle a fini d'utiliser le shell.
  let homePending = null;
  let okCount = 0;
  let failCount = 0;
  let totalBytes = 0;
  const startedTotal = Date.now();
  let isFirst = true;

  for (const route of routes) {
    const url = `${HOST}${route}`;
    const startedAt = Date.now();
    const outPath = route === '/'
      ? join(DIST, 'index.html')
      : join(DIST, route.replace(/^\//, ''), 'index.html');
    // 1er nav prend + de temps (cold-start interne des fetch dans l'app).
    const navTimeout = isFirst ? 60000 : 30000;
    isFirst = false;

    let page;
    try {
      page = await browser.newPage();

      // Force la langue FR avant que React boot.
      // evaluateOnNewDocument tourne dans le contexte de la page AVANT tout
      // script applicatif. On set localStorage["massive-lang"]="fr" et on
      // override navigator.language pour que LanguageContext.jsx (src/i18n/)
      // detecte FR meme si Chromium headless retourne en-US par defaut.
      // Sans ce hack, les snapshots SEO seraient en anglais alors que la
      // prod sert FR aux visiteurs fr-CA majoritaires -> Google indexerait
      // les versions EN qui ne sont pas les vraies pages.
      await page.evaluateOnNewDocument(() => {
        try {
          localStorage.setItem('massive-lang', 'fr');
        } catch (_) { /* localStorage indispo, on continue */ }
        try {
          Object.defineProperty(navigator, 'language', { get: () => 'fr-CA' });
          Object.defineProperty(navigator, 'languages', { get: () => ['fr-CA', 'fr', 'en'] });
        } catch (_) { /* deja defini, on ignore */ }
      });

      await page.goto(url, { waitUntil: 'networkidle0', timeout: navTimeout });

      // a. Attendre que React ait peuple #root (mount + useEffect initial).
      await page.waitForSelector('#root *', { timeout: 30000 });

      // b. Attendre que react-helmet-async ait processe le <head>.
      //    Helmet marque ses elements geres avec data-rh="true" (v2.x).
      //    Fallback : si data-rh n'apparait pas (page sans <SEO />), on
      //    teste un changement de title vs le shell ; sinon on attend un peu.
      try {
        await page.waitForSelector('head [data-rh="true"]', { timeout: 8000 });
      } catch (_) {
        try {
          await page.waitForFunction(
            (def) => {
              const t = (document.title || '').trim();
              return t.length > 0 && t !== def;
            },
            { timeout: 5000 },
            defaultTitle,
          );
        } catch (_) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      // c. Injecte le marqueur prerendered (lu par og-worker.js pour skip
      //    son HTMLRewriter et preserver les meta du snapshot).
      await page.evaluate(() => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'x-prerendered');
        m.setAttribute('content', '1');
        document.head.appendChild(m);
      });

      // d. Serialise le DOM final.
      //    Pour '/' : on bufferise et on ecrit en fin de boucle (cf. note plus haut).
      //    Pour les autres : on ecrit directement dans dist/<route>/index.html
      //    (chemin separe de dist/index.html, pas de conflit avec le shell SPA).
      const html = await page.content();
      if (route === '/') {
        homePending = { outPath, html };
      } else {
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, html, 'utf8');
      }
      okCount++;
      totalBytes += html.length;
      console.log(`  [ok]   ${route.padEnd(46)} ${(html.length / 1024).toFixed(1)} kb (${Date.now() - startedAt} ms)`);
    } catch (err) {
      failCount++;
      const msg = (err?.message || String(err)).split('\n')[0].slice(0, 100);
      console.log(`  [fail] ${route.padEnd(46)} ${msg}`);
    } finally {
      if (page) {
        try { await page.close(); } catch (_) { /* ignore */ }
      }
    }
  }

  // 8a. Ecrire le snapshot de '/' (bufferise) maintenant que la boucle est
  //     terminee. Ecrase dist/index.html : c'est volontaire, ce sera le
  //     point d'entree HTML servi par CF Pages a partir de maintenant.
  if (homePending) {
    try {
      mkdirSync(dirname(homePending.outPath), { recursive: true });
      writeFileSync(homePending.outPath, homePending.html, 'utf8');
    } catch (err) {
      console.log(`[prerender] ecriture du snapshot home a echoue : ${err?.message || err}`);
      failCount++;
      okCount--;
    }
  }

  // 8b. Cleanup browser + sirv.
  try { await browser.close(); } catch (_) { /* ignore */ }
  try { server.close(); } catch (_) { /* ignore */ }

  // 9. Rapport final.
  const elapsedS = ((Date.now() - startedTotal) / 1000).toFixed(1);
  const avgKb = okCount > 0 ? (totalBytes / okCount / 1024).toFixed(1) : '0';
  banner('PRERENDER RECAP', [
    `${okCount} OK, ${failCount} fail, ${elapsedS}s total`,
    `Snapshot moyen : ${avgKb} kb/page`,
    failCount > 0
      ? `${failCount} route(s) en echec (voir [fail] ci-dessus).`
      : 'Toutes les routes ont ete prerendues.',
  ]);

  // 10. Exit policy. exitSafe() force exit 0 en CI/CF_PAGES.
  if (failCount > 0) {
    console.log(`[prerender] ${failCount} route(s) en echec -> exit 2 (mode local). En CI / CF_PAGES ce serait un exit 0.`);
    return exitSafe(2);
  }
  return exitSafe(0);
}

// Filet de securite ultime : meme une exception inattendue ne casse pas
// le deploy. On log et on exit 0 si CI/CF_PAGES.
main().catch((err) => {
  banner('PRERENDER FATAL (non bloquant)', [
    err?.message || String(err),
    ...(err?.stack ? err.stack.split('\n').slice(0, 4) : []),
  ]);
  return exitSafe(0);
});
