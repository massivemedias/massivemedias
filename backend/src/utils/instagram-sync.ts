/**
 * IG-FEED : synchronisation des derniers posts Instagram de @massivemedias.
 *
 * ARCHITECTURE (imposee) :
 *   - Instagram API OFFICIELLE avec Instagram Login (pas de scraping). Compte
 *     PROFESSIONNEL (Business ou Creator). UNE seule variable d'environnement
 *     Render : INSTAGRAM_ACCESS_TOKEN (long-lived, ~60j, refreshable). JAMAIS
 *     commite. Le endpoint /me/ resout le compte depuis le token : pas besoin
 *     d'un user-id separe. Setup detaille : docs/INSTAGRAM-FEED-SETUP.md.
 *   - La sync tourne cote BACKEND uniquement (cron 6h, cf config/cron-tasks.ts).
 *     Le frontend lit NOTRE endpoint (/instagram-posts/latest), jamais Meta :
 *     zero cookie tiers, zero appel Meta cote client.
 *   - Les images sont PROXIFIEES sur notre stockage Supabase. Deux raisons :
 *     (1) les URLs cdninstagram.com EXPIRENT (~jours) ; (2) charger un <img>
 *     cdninstagram = un appel Meta cote client, ce qu'on interdit. On stocke
 *     donc notre propre thumbUrl.
 *   - FALLBACK : si Meta tombe, on N'ECRASE RIEN. Les posts deja en base restent
 *     servis. La sync echoue proprement (log warn), le cache tient.
 *
 * TOKEN : le long-lived token Instagram dure ~60 jours. `refreshTokenIfNeeded`
 * le rafraichit tout seul quand il approche de l'expiration (Meta le permet une
 * fois le token age de 24h). En Phase 1 (pas encore de token), tout est
 * court-circuite proprement : `syncInstagram` retourne { skipped: true }.
 */

const GRAPH = 'https://graph.instagram.com';
const KEEP = 8;            // nombre de posts gardes en cache (on affiche les 3-4 plus recents)
const FETCH = 8;           // nombre de posts demandes a l'API

type IgMedia = {
  id: string;
  caption?: string;
  media_type?: string;    // IMAGE | VIDEO | CAROUSEL_ALBUM
  media_url?: string;
  thumbnail_url?: string; // present sur les VIDEO
  permalink?: string;
  timestamp?: string;     // ISO
};

/** Config presente ? (Phase 1 = non -> on skip proprement) */
export function instagramConfigured(): boolean {
  return !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCESS_TOKEN.length > 20);
}

/** Telecharge une image et la pousse sur Supabase Storage, renvoie NOTRE url. */
async function proxyImageToSupabase(srcUrl: string, igId: string, log: any): Promise<string | null> {
  const apiUrl = process.env.SUPABASE_API_URL;
  const apiKey = process.env.SUPABASE_API_KEY;
  const bucket = process.env.SUPABASE_BUCKET || 'strapi-media';
  if (!apiUrl || !apiKey) {
    log?.warn?.('[IG-SYNC] Supabase non configure, image non proxifiee');
    return null;
  }
  try {
    const res = await fetch(srcUrl);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const path = `instagram/${igId}.${ext}`;
    // upsert = true : re-sync ecrase l'ancienne version de la meme image.
    const up = await fetch(`${apiUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
        'cache-control': '86400',
      },
      body: buf,
    });
    if (!up.ok) throw new Error(`supabase ${up.status}: ${await up.text()}`);
    return `${apiUrl}/storage/v1/object/public/${bucket}/${path}`;
  } catch (e: any) {
    log?.warn?.(`[IG-SYNC] proxy image echoue (${igId}): ${e?.message || e}`);
    return null;
  }
}

/** Rafraichit le long-lived token s'il approche de l'expiration. Best-effort. */
async function refreshTokenIfNeeded(log: any): Promise<void> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return;
  try {
    const url = `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return; // token pas encore rafraichissable (< 24h) ou invalide : on ne bloque pas la sync
    const data: any = await res.json();
    if (data?.access_token && data.access_token !== token) {
      // On NE PEUT PAS reecrire l'env Render depuis le code. On loggue pour que
      // l'admin mette a jour la variable. La sync du jour marche quand meme avec
      // le token courant. (Phase 2 : envisager un content-type "secret" en base.)
      log?.info?.('[IG-SYNC] token rafraichi cote Meta - METTRE A JOUR INSTAGRAM_ACCESS_TOKEN sur Render avec la nouvelle valeur avant J+60');
    }
  } catch {
    /* best-effort, jamais bloquant */
  }
}

/**
 * Synchronise le cache. Upsert par igId, proxifie l'image, purge au-dela de KEEP.
 * Retourne un resume pour le log cron.
 */
export async function syncInstagram(strapi: any): Promise<{ skipped?: boolean; synced?: number; error?: string }> {
  const log = strapi?.log;
  if (!instagramConfigured()) {
    log?.info?.('[IG-SYNC] INSTAGRAM_ACCESS_TOKEN absent - Phase 1, sync ignoree (le cache/fallback reste servi)');
    return { skipped: true };
  }

  await refreshTokenIfNeeded(log);

  const token = process.env.INSTAGRAM_ACCESS_TOKEN!;
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `${GRAPH}/me/media?fields=${fields}&limit=${FETCH}&access_token=${token}`;

  let medias: IgMedia[] = [];
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`graph ${res.status}: ${await res.text()}`);
    const data: any = await res.json();
    medias = Array.isArray(data?.data) ? data.data : [];
  } catch (e: any) {
    // FALLBACK : Meta injoignable -> on ne touche a rien, le cache existant tient.
    log?.warn?.(`[IG-SYNC] fetch Meta echoue, cache conserve: ${e?.message || e}`);
    return { error: String(e?.message || e) };
  }

  if (!medias.length) {
    log?.warn?.('[IG-SYNC] Meta a renvoye 0 post, cache conserve');
    return { synced: 0 };
  }

  const now = new Date().toISOString();
  let synced = 0;
  const seen: string[] = [];

  for (const m of medias.slice(0, KEEP)) {
    if (!m.id) continue;
    seen.push(m.id);
    const source = m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url;
    const existing = await strapi.documents('api::instagram-post.instagram-post').findMany({
      filters: { igId: { $eq: m.id } },
      limit: 1,
    });
    const already = existing?.[0];
    // On ne re-proxifie l'image que si le post est nouveau (l'image d'un post ne
    // change pas). Economise des telechargements a chaque cron.
    let thumbUrl = already?.thumbUrl || null;
    if (!thumbUrl && source) thumbUrl = await proxyImageToSupabase(source, m.id, log);

    const payload = {
      igId: m.id,
      permalink: m.permalink || '',
      mediaType: m.media_type || 'IMAGE',
      thumbUrl: thumbUrl || '',
      caption: m.caption || '',
      postedAt: m.timestamp || now,
      syncedAt: now,
    };
    if (already) {
      await strapi.documents('api::instagram-post.instagram-post').update({ documentId: already.documentId, data: payload });
    } else {
      await strapi.documents('api::instagram-post.instagram-post').create({ data: payload });
    }
    synced++;
  }

  // Purge : tout ce qui n'est plus dans les KEEP derniers posts.
  try {
    const all = await strapi.documents('api::instagram-post.instagram-post').findMany({ limit: 100 });
    for (const p of all) {
      if (!seen.includes(p.igId)) {
        await strapi.documents('api::instagram-post.instagram-post').delete({ documentId: p.documentId });
      }
    }
  } catch (e: any) {
    log?.warn?.(`[IG-SYNC] purge partielle: ${e?.message || e}`);
  }

  log?.info?.(`[IG-SYNC] ${synced} post(s) synchronise(s)`);
  return { synced };
}
