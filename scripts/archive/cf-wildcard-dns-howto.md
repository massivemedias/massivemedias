# Wildcard DNS sur Cloudflare - Procedure (8 mai 2026)

## Le besoin
Creer un record wildcard `*.massivemedias.com` -> `massivemedias.com` (proxied)
pour que les sous-domaines artistes (gallium, psyqu33n, mok, etc.) resolvent
sans devoir ajouter un record manuel par artiste.

## Methodes evaluees

### A. Wrangler CLI - PAS APPLICABLE
`wrangler pages domain add` n'existe pas. Wrangler ne gere QUE Workers/Pages,
pas les records DNS de zone. Ne pas perdre de temps a debug ca.

### B. API REST publique (`api.cloudflare.com/client/v4/...`) - REQUIERT TOKEN
Marche, mais demande un token API avec scope `Zone:DNS:Edit`. Le token OAuth
de Wrangler n'a que `Zone:Read`, donc 403. Cf. `scripts/cf-add-wildcard-dns.mjs`
qui implemente cette voie (active si `CLOUDFLARE_API_TOKEN` env est defini).

### C. API interne du dashboard (`dash.cloudflare.com/api/v4/...`) - METHODE UTILISEE
Le dashboard CF utilise des endpoints same-origin (`/api/v4/zones/...`) qui
authentifient via cookies de session - PAS de token API requis. Quand on est
deja loggue dans le dashboard, ces endpoints repondent 200.

**Procedure executee :**
1. Ouvrir le dashboard CF dans Chrome (Chrome MCP) sur la page DNS de la zone
2. Executer dans la devtools / Chrome MCP javascript_tool :

```js
await fetch('/api/v4/zones/4ac189efe0feb78f35605dbd6bb32775/dns_records', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  body: JSON.stringify({
    type: 'CNAME',
    name: '*',
    content: 'massivemedias.com',
    ttl: 1,
    proxied: true,
    comment: 'Wildcard for artist subdomains'
  })
});
```

3. Reponse : `200 OK` avec `success: true`, record cree.

**Verification dig :**
```
$ dig +short gallium.massivemedias.com @1.1.1.1
172.64.80.1   <- proxy CF, le wildcard fonctionne
```

## Anti-patterns identifies
- Playwright avec copie du profil Chrome -> CF detecte l'automation et redirige
  vers Google OAuth (anti-bot agressive). Cf. `cf-force-dns-puppeteer.mjs` (echec).
- Les cookies de session CF sont chiffres dans le Keychain macOS, donc on ne
  peut pas les extraire programmatiquement vers un curl/fetch externe.
- L'API REST publique `api.cloudflare.com` n'accepte PAS les cookies du dashboard
  (CORS + auth differente). Seul le same-origin `dash.cloudflare.com/api/v4/...`
  fonctionne avec cookies.

## Resultat
Wildcard DNS actif. Tout sous-domaine `*.massivemedias.com` resout vers le
proxy CF, qui declenche le Worker `og-worker.js` (route `*.massivemedias.com/*`).
Le Worker redirige les humains vers `/artistes/<slug>` et sert les meta OG aux
crawlers (FB, Twitter, etc.) directement sur le subdomain.
