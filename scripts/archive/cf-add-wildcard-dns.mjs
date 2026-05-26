#!/usr/bin/env node
/**
 * cf-add-wildcard-dns.mjs (8 mai 2026)
 * ---------------------------------------------------------------------
 * Cree le DNS record CNAME `*` -> `massivemedias.com` (proxied) dans la
 * zone Cloudflare massivemedias.com via l'API REST. Necessaire car :
 *
 *   1. Cloudflare Pages REFUSE les wildcard custom domains (`*.x.com`)
 *      via son API (erreur 8000015 "Domain is invalid").
 *   2. Le Worker `artist-proxy` est deja deploye avec la route
 *      `*.massivemedias.com/*` (cf. cloudflare-worker/wrangler.toml).
 *      Il intercepte les requetes wildcard et fait office de proxy /
 *      injection meta OG. Mais sans DNS wildcard, les sous-domaines
 *      retournent NXDOMAIN avant meme d'atteindre le Worker.
 *   3. Le scope OAuth de wrangler n'inclut pas `dns:write` (juste
 *      `zone:read`), d'ou ce script avec un API token dedie.
 *
 * Usage :
 *
 *   1. Va sur https://dash.cloudflare.com/profile/api-tokens
 *   2. "Create Token" -> template "Edit zone DNS" -> selectionne
 *      la zone "massivemedias.com" -> Continue -> Create Token
 *   3. Copie le token genere
 *   4. Lance :
 *        CLOUDFLARE_API_TOKEN="<le-token>" node scripts/cf-add-wildcard-dns.mjs
 *
 * Le script verifie d'abord si l'enregistrement existe deja (idempotent).
 */

const ZONE_ID = '4ac189efe0feb78f35605dbd6bb32775'; // massivemedias.com
const API = 'https://api.cloudflare.com/client/v4';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!TOKEN) {
  console.error('❌ CLOUDFLARE_API_TOKEN non defini.');
  console.error('');
  console.error('Genere un token avec scope DNS:Edit :');
  console.error('  https://dash.cloudflare.com/profile/api-tokens');
  console.error('');
  console.error('Puis relance :');
  console.error('  CLOUDFLARE_API_TOKEN="..." node scripts/cf-add-wildcard-dns.mjs');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.success) {
    const err = data.errors?.[0]?.message || JSON.stringify(data.errors);
    throw new Error(`${method} ${path} -> ${err}`);
  }
  return data.result;
}

async function main() {
  console.log('🔍 Verification du token...');
  const verify = await fetch(`${API}/user/tokens/verify`, { headers });
  const v = await verify.json();
  if (!v.success) {
    console.error('❌ Token invalide :', v.errors);
    process.exit(1);
  }
  console.log('✓ Token actif');

  console.log('\n🔍 Recherche d\'un wildcard existant...');
  const records = await api('GET', `/zones/${ZONE_ID}/dns_records?type=CNAME&name=%2A.massivemedias.com`);
  const existing = records.find((r) => r.name === '*.massivemedias.com');

  if (existing) {
    console.log(`✓ Record existe deja : ${existing.type} ${existing.name} -> ${existing.content} (proxied: ${existing.proxied})`);
    console.log(`  ID: ${existing.id}`);
    if (!existing.proxied) {
      console.log('\n⚠️  Le record n\'est PAS proxied (orange cloud). Mise a jour...');
      const updated = await api('PATCH', `/zones/${ZONE_ID}/dns_records/${existing.id}`, {
        proxied: true,
      });
      console.log(`✓ Record mis a jour proxied=true`);
    }
    console.log('\n🎉 Aucune action necessaire, le DNS est deja configure.');
    return;
  }

  console.log('  Aucun wildcard trouve, creation en cours...');
  const created = await api('POST', `/zones/${ZONE_ID}/dns_records`, {
    type: 'CNAME',
    name: '*',
    content: 'massivemedias.com',
    ttl: 1, // auto
    proxied: true,
    comment: 'Wildcard pour sous-domaines artistes - auto-added (8 mai 2026)',
  });

  console.log(`✓ Record cree : ${created.type} ${created.name} -> ${created.content}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Proxied: ${created.proxied}`);

  console.log('\n🎉 Wildcard DNS configure.');
  console.log('\nLes sous-domaines artistes (ex: psyqu33n.massivemedias.com)');
  console.log('vont maintenant resoudre via Cloudflare et passer par le');
  console.log('Worker artist-proxy (route *.massivemedias.com/*) qui sert');
  console.log('le frontend Pages. Propagation : quelques secondes a 5 min.');
}

main().catch((err) => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
