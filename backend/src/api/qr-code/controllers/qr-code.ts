import { factories } from '@strapi/strapi';
import crypto from 'crypto';
import geoip from 'geoip-lite';
import { requireAdminAuth } from '../../../utils/auth';
import { sendQrReportEmail } from '../../../utils/email';

/**
 * Resolves an IPv4/IPv6 address to { city, country } using the bundled
 * geoip-lite MaxMind GeoLite2 database. Returns empty strings if the IP is
 * private/loopback (e.g. ::1, 127.0.0.1) or not found in the dataset.
 *
 * Why geoip-lite : zero external API calls (latency-free, no rate limits,
 * no GDPR concern around shipping IPs to 3rd parties), runs entirely in
 * the same Render container that handles the request.
 */
function resolveGeo(ip: string): { city: string; country: string } {
  if (!ip) return { city: '', country: '' };
  // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4 -> 1.2.3.4)
  const clean = ip.replace(/^::ffff:/, '').trim();
  // Filter local/private networks - geoip-lite would just return null but we
  // skip the lookup cost.
  if (clean === '::1' || clean.startsWith('127.') || clean.startsWith('10.') || clean.startsWith('192.168.') || clean.startsWith('169.254.')) {
    return { city: '', country: '' };
  }
  try {
    const lookup = geoip.lookup(clean);
    if (!lookup) return { city: '', country: '' };
    return {
      city: (lookup.city || '').slice(0, 120),
      country: (lookup.country || '').slice(0, 4), // ISO 3166-1 alpha-2
    };
  } catch {
    return { city: '', country: '' };
  }
}

/**
 * Hash d'IP conforme Loi 25 (Quebec). On ne stocke JAMAIS l'IP lisible (ni
 * complete, ni tronquee). A la place, on garde un SHA-256 de (IP + sel) qui :
 *   - est stable : la meme IP donne toujours le meme hash -> permet de compter
 *     les visiteurs uniques (count de hash distincts) sans jamais reidentifier
 *     la personne.
 *   - n'est pas reversible : impossible de remonter a l'IP a partir du hash.
 *   - est inutile sans le sel : le sel (QR_IP_HASH_SALT) reste cote serveur,
 *     donc meme une fuite de la base ne permet pas un rainbow-table sur l'espace
 *     des IPv4.
 *
 * Si le sel est absent, on retourne '' (chaine vide) : on prefere NE RIEN
 * stocker plutot que de hacher sans sel (un hash non sale d'une IPv4 est
 * trivialement cassable par force brute sur 4 milliards de valeurs). Le caller
 * (redirect) logue alors un avertissement clair.
 *
 * La resolution geoip (ville/pays) se fait sur l'IP brute EN MEMOIRE avant cet
 * appel, puis l'IP brute est jetee : elle n'est jamais persistee.
 */
function hashIp(ip: string, salt: string): string {
  const clean = (ip || '').replace(/^::ffff:/, '').trim();
  if (!clean || !salt) return '';
  return crypto.createHash('sha256').update(clean + salt).digest('hex'); // 64 hex
}

/**
 * Lightweight User-Agent device classifier. We don't need a full UA parser
 * (ua-parser-js etc.) for the scope of "mobile vs desktop vs tablet" buckets
 * in the dashboard - regexes on a few well-known tokens are enough and avoid
 * shipping a 200kB dependency for a single field.
 */
function classifyDevice(ua: string): string {
  if (!ua) return 'unknown';
  const u = ua.toLowerCase();
  if (/ipad|tablet|kindle|silk|playbook/.test(u)) return 'tablet';
  if (/mobi|iphone|android|phone|windows phone|blackberry/.test(u)) return 'mobile';
  if (/bot|crawler|spider|slurp|httpclient|axios|curl|wget|postman/.test(u)) return 'bot';
  return 'desktop';
}

/**
 * Classifie le systeme d'exploitation a partir du User-Agent. On reste sur les
 * grandes familles fiables (iOS / Android / autre). Le MODELE exact d'appareil
 * n'est PAS deductible de facon fiable du UA moderne, on ne l'expose donc jamais.
 * La categorie 'autre' absorbe desktop (Windows/Mac/Linux), bots et UA inconnus :
 * aucun scan n'est jamais perdu (somme des OS = total).
 */
function classifyOs(ua: string): string {
  if (!ua) return 'autre';
  const u = ua.toLowerCase();
  if (/iphone|ipad|ipod/.test(u)) return 'iOS';
  if (/android/.test(u)) return 'Android';
  return 'autre';
}

/**
 * Classifie le navigateur a partir du User-Agent. L'ORDRE des tests est
 * critique : un UA Chrome contient le token "Safari", un UA Edge contient
 * "Chrome", etc. On teste donc du plus specifique au plus generique :
 *   Firefox -> Edge(=autre) -> Chrome -> Safari -> autre.
 * La categorie 'autre' absorbe Edge, Opera, navigateurs in-app et inconnus :
 * aucun scan n'est jamais perdu (somme des navigateurs = total).
 */
function classifyBrowser(ua: string): string {
  if (!ua) return 'autre';
  const u = ua.toLowerCase();
  if (/firefox|fxios/.test(u)) return 'Firefox';
  if (/edg\//.test(u)) return 'autre'; // Edge contient "chrome", on l'ecarte avant Chrome
  if (/chrome|crios|chromium/.test(u)) return 'Chrome';
  if (/safari/.test(u)) return 'Safari'; // un vrai Safari n'a pas de token chrome/crios
  return 'autre';
}

/**
 * Extrait l'heure locale (0-23, fuseau America/Toronto) d'une date de scan.
 * On passe par Intl.DateTimeFormat pour un decoupage robuste cote fuseau
 * (evite l'effet "serveur UTC"). Le `% 24` garde-fou neutralise le cas limite
 * ou certains environnements rendent "24" a minuit.
 */
function hourInMontreal(value: string | Date): number {
  try {
    const d = value instanceof Date ? value : new Date(value);
    const parts = new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric', hour12: false, timeZone: 'America/Toronto',
    }).formatToParts(d);
    const h = parseInt((parts.find(p => p.type === 'hour') || { value: '0' }).value, 10);
    return Number.isFinite(h) ? (h % 24) : 0;
  } catch {
    return 0;
  }
}

/**
 * Cle de jour locale 'YYYY-MM-DD' (fuseau America/Toronto) pour grouper la
 * serie temporelle. Le format en-CA donne directement l'ordre ISO triable.
 */
function dayKeyMontreal(value: string | Date): string {
  try {
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' }); // YYYY-MM-DD
  } catch {
    return '0000-00-00';
  }
}

/**
 * Agrege un tableau de rows qr_scan en un objet analytics. SOURCE UNIQUE de
 * l'agregation : utilise par listScans (drilldown admin) ET par le rapport
 * courriel (sendReport), pour ne PAS dupliquer la logique. Tout est calcule en
 * memoire sur la fenetre fournie ; par construction byDay/byHour/byOs/byBrowser
 * totalisent total, et uniquesEstimes <= total (rows sans ipHash exclues).
 */
function buildScanAnalytics(scans: any[]) {
  const byCity: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const byDevice: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0, bot: 0, unknown: 0 };
  const byOs: Record<string, number> = { iOS: 0, Android: 0, autre: 0 };
  const byBrowser: Record<string, number> = { Safari: 0, Chrome: 0, Firefox: 0, autre: 0 };
  const byDay: Record<string, number> = {};
  const byHour: Record<string, number> = {};
  for (let h = 0; h < 24; h++) byHour[String(h)] = 0;
  const refererCounts: Record<string, number> = {};
  const uniqueHashes = new Set<string>();
  let lastScannedAt: string | null = null;

  for (const s of scans as any[]) {
    const ua = s.userAgent || '';
    byCity[s.city || 'Inconnu'] = (byCity[s.city || 'Inconnu'] || 0) + 1;
    byCountry[s.country || 'XX'] = (byCountry[s.country || 'XX'] || 0) + 1;
    const device = classifyDevice(ua);
    byDevice[device] = (byDevice[device] || 0) + 1;
    const os = classifyOs(ua);
    byOs[os] = (byOs[os] || 0) + 1;
    const browser = classifyBrowser(ua);
    byBrowser[browser] = (byBrowser[browser] || 0) + 1;
    const dayKey = dayKeyMontreal(s.scannedAt);
    byDay[dayKey] = (byDay[dayKey] || 0) + 1;
    const hourKey = String(hourInMontreal(s.scannedAt));
    byHour[hourKey] = (byHour[hourKey] || 0) + 1;
    const ref = (s.referer || '').trim();
    if (ref) refererCounts[ref] = (refererCounts[ref] || 0) + 1;
    if (s.ipHash) uniqueHashes.add(s.ipHash);
    if (!lastScannedAt || s.scannedAt > lastScannedAt) lastScannedAt = s.scannedAt;
  }

  const topReferers = Object.entries(refererCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([referer, count]) => ({ referer, count }));

  return {
    total: scans.length,
    uniquesEstimes: uniqueHashes.size,
    lastScannedAt,
    byCity, byCountry, byDevice, byOs, byBrowser, byDay, byHour, topReferers,
  };
}

/**
 * Generates a URL-safe short id for the trackable QR redirect endpoint.
 * Uses crypto.randomBytes for unpredictability (prevents enumeration of existing QR codes)
 * and a base62 alphabet so the id is short, case-sensitive, and URL-safe without encoding.
 * Default length = 8 chars = 62^8 = ~218 trillion combinations. Collision probability
 * is astronomically low for this use case.
 */
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; // no 0/O/1/l/I for readability
function generateShortId(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  }
  return out;
}

/**
 * Minimal URL validator. We accept only http/https schemes to avoid generating QR codes
 * that encode javascript:, data:, file: or other schemes that could be abused for XSS or
 * phishing when the user/admin clicks through our redirect endpoint.
 */
function isSafeHttpUrl(u: string): boolean {
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validateur courriel minimal pour le champ optionnel clientEmail (destinataire
 * du rapport de stats, cf. chantier rapport courriel). Volontairement simple :
 * on verifie juste la forme "x@y.z". Une string vide est consideree valide
 * (le champ est optionnel). Retourne la valeur nettoyee (trim, lowercase) ou
 * null si invalide.
 */
function normalizeClientEmail(value: unknown): { ok: boolean; email: string | null } {
  if (value === undefined || value === null || value === '') return { ok: true, email: null };
  if (typeof value !== 'string') return { ok: false, email: null };
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return { ok: true, email: null };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 200) {
    return { ok: false, email: null };
  }
  return { ok: true, email: trimmed };
}

// requireAdminAuth importe depuis ../../../utils/auth (SEC-01, 2026-04-18).

export default factories.createCoreController('api::qr-code.qr-code', ({ strapi }) => ({

  /**
   * POST /api/qr-codes
   * Creates a new dynamic QR code.
   * Body: { destinationUrl: string, title?: string }
   * Returns: { id, shortId, destinationUrl, trackingUrl, title, createdAt }
   * trackingUrl is what the frontend should encode visually in the QR image.
   */
  async createDynamic(ctx) {
    if (!(await requireAdminAuth(ctx))) return;

    const { destinationUrl, title, clientEmail } = (ctx.request.body || {}) as any;
    if (!destinationUrl || typeof destinationUrl !== 'string') {
      return ctx.badRequest('destinationUrl is required');
    }
    const trimmed = destinationUrl.trim();
    if (!isSafeHttpUrl(trimmed)) {
      return ctx.badRequest('destinationUrl must be a valid http(s) URL');
    }
    // clientEmail optionnel : destinataire du futur rapport de stats. Valide
    // seulement s'il est fourni ; vide/absent est accepte (null en base).
    const clientEmailCheck = normalizeClientEmail(clientEmail);
    if (!clientEmailCheck.ok) {
      return ctx.badRequest('clientEmail must be a valid email address');
    }

    // Generate a unique shortId. In the (virtually impossible) case of a collision,
    // retry up to 5 times with progressively longer ids.
    let shortId = '';
    let attempts = 0;
    while (attempts < 5) {
      const candidate = generateShortId(8 + attempts);
      const existing = await strapi.documents('api::qr-code.qr-code').findMany({
        filters: { shortId: candidate } as any,
        limit: 1,
      });
      if (existing.length === 0) {
        shortId = candidate;
        break;
      }
      attempts++;
    }
    if (!shortId) {
      return ctx.internalServerError('Could not generate unique short id');
    }

    const createdByEmail = (ctx.state as any).adminUserEmail || null;
    const entity = await strapi.documents('api::qr-code.qr-code').create({
      data: {
        shortId,
        destinationUrl: trimmed,
        title: (title && typeof title === 'string') ? title.trim().slice(0, 200) : '',
        createdByEmail,
        clientEmail: clientEmailCheck.email,
        active: true,
      } as any,
    });

    // Strapi v5 preficxe automatiquement toutes les routes custom par /api/.
    // La route est definie en path:'/qr/:shortId' dans custom-qr-code.ts, ce qui
    // donne en realite /api/qr/:shortId une fois mountee. La trackingUrl qu'on
    // encode dans le QR doit donc inclure /api/ pour pointer sur le bon endpoint.
    const trackingBase = process.env.QR_TRACKING_BASE_URL
      || process.env.PUBLIC_API_URL
      || 'https://massivemedias-api.onrender.com';
    const normalizedBase = trackingBase.replace(/\/$/, '').replace(/\/api$/, '');
    const trackingUrl = `${normalizedBase}/api/qr/${shortId}`;

    ctx.body = {
      id: (entity as any).id,
      documentId: (entity as any).documentId,
      shortId,
      destinationUrl: trimmed,
      trackingUrl,
      title: (entity as any).title || '',
      clientEmail: (entity as any).clientEmail || null,
      createdAt: (entity as any).createdAt,
      scansCount: 0,
    };
  },

  /**
   * PUT /api/qr-codes/:documentId
   * Met a jour les champs editables d'un QR existant : title, destinationUrl,
   * active, clientEmail. Le shortId n'est JAMAIS modifiable (le QR est deja
   * imprime, changer le shortId casserait toutes les redirections existantes).
   * Tous les champs sont optionnels dans le body : on ne met a jour que ceux
   * qui sont fournis (patch partiel).
   */
  async updateQr(ctx) {
    if (!(await requireAdminAuth(ctx))) return;

    const { documentId } = ctx.params;
    const entity = await strapi.documents('api::qr-code.qr-code').findFirst({
      filters: { documentId } as any,
    });
    if (!entity) return ctx.notFound('QR code not found');

    const body = (ctx.request.body || {}) as any;
    const data: Record<string, any> = {};

    if (typeof body.title === 'string') {
      data.title = body.title.trim().slice(0, 200);
    }
    if (body.destinationUrl !== undefined) {
      const trimmed = String(body.destinationUrl).trim();
      if (!isSafeHttpUrl(trimmed)) {
        return ctx.badRequest('destinationUrl must be a valid http(s) URL');
      }
      data.destinationUrl = trimmed;
    }
    if (body.active !== undefined) {
      data.active = !!body.active;
    }
    if (body.clientEmail !== undefined) {
      const check = normalizeClientEmail(body.clientEmail);
      if (!check.ok) return ctx.badRequest('clientEmail must be a valid email address');
      data.clientEmail = check.email; // null vide le champ
    }
    // shortId volontairement ignore meme s'il est present dans le body.

    if (Object.keys(data).length === 0) {
      return ctx.badRequest('No editable field provided');
    }

    const updated = await strapi.documents('api::qr-code.qr-code').update({
      documentId,
      data: data as any,
    });

    ctx.body = {
      documentId,
      shortId: (updated as any).shortId,
      destinationUrl: (updated as any).destinationUrl,
      title: (updated as any).title || '',
      clientEmail: (updated as any).clientEmail || null,
      active: (updated as any).active !== false,
    };
  },

  /**
   * GET /api/qr-codes/list
   * Returns the admin list of QR codes with aggregate scan counts.
   * Sorted by most-recent first. No pagination yet (low volume expected).
   */
  async listWithScans(ctx) {
    if (!(await requireAdminAuth(ctx))) return;

    const codes = await strapi.documents('api::qr-code.qr-code').findMany({
      sort: { createdAt: 'desc' } as any,
      limit: 500,
    });

    // PERF-01 : aggregate en une seule query au lieu du N+1 precedent. On
    // fetch TOUS les scans en une fois avec le qrCode relation populate (pour
    // connaitre le documentId parent), puis on group-by en memoire. Ancien
    // code lancait 1 query par QR code -> explosait a 500 QR codes ou plus.
    // ANALYTICS (3 mai 2026) : on inclut aussi city/userAgent pour calculer
    // le top-city et le device dominant par QR sans 2eme requete.
    const allScans = await strapi.db.query('api::qr-scan.qr-scan').findMany({
      populate: ['qrCode'],
      select: ['scannedAt', 'city', 'userAgent'],
    });

    const scansByQrCodeId = new Map<number, {
      count: number;
      lastScannedAt: string | null;
      cityCounts: Record<string, number>;
      deviceCounts: Record<string, number>;
    }>();
    for (const scan of allScans as any[]) {
      const qrCodeId = scan.qrCode?.id;
      if (!qrCodeId) continue;
      const existing = scansByQrCodeId.get(qrCodeId) || {
        count: 0, lastScannedAt: null, cityCounts: {}, deviceCounts: {},
      };
      existing.count++;
      if (!existing.lastScannedAt || scan.scannedAt > existing.lastScannedAt) {
        existing.lastScannedAt = scan.scannedAt;
      }
      const city = scan.city || 'Inconnu';
      existing.cityCounts[city] = (existing.cityCounts[city] || 0) + 1;
      const device = classifyDevice(scan.userAgent || '');
      existing.deviceCounts[device] = (existing.deviceCounts[device] || 0) + 1;
      scansByQrCodeId.set(qrCodeId, existing);
    }

    // Helper : top entry d'un Record<string, number>.
    const topOf = (counts: Record<string, number>): { name: string; count: number } | null => {
      const entries = Object.entries(counts);
      if (entries.length === 0) return null;
      entries.sort((a, b) => b[1] - a[1]);
      return { name: entries[0][0], count: entries[0][1] };
    };

    const result = codes.map((c: any) => {
      const agg = scansByQrCodeId.get(c.id) || {
        count: 0, lastScannedAt: null, cityCounts: {}, deviceCounts: {},
      };
      return {
        id: c.id,
        documentId: c.documentId,
        shortId: c.shortId,
        destinationUrl: c.destinationUrl,
        title: c.title || '',
        createdByEmail: c.createdByEmail || null,
        clientEmail: c.clientEmail || null,
        createdAt: c.createdAt,
        active: c.active !== false,
        scansCount: agg.count,
        lastScannedAt: agg.lastScannedAt,
        topCity: topOf(agg.cityCounts),
        topDevice: topOf(agg.deviceCounts),
      };
    });

    ctx.body = { data: result, total: result.length };
  },

  /**
   * DELETE /api/qr-codes/:documentId
   * Deletes a QR code (and cascades to scans via Strapi relation cleanup).
   */
  async deleteQr(ctx) {
    if (!(await requireAdminAuth(ctx))) return;

    const { documentId } = ctx.params;
    const entity = await strapi.documents('api::qr-code.qr-code').findFirst({
      filters: { documentId } as any,
    });
    if (!entity) return ctx.notFound('QR code not found');

    // Delete all associated scans first (Strapi cascading behavior is not always reliable).
    const scans = await strapi.documents('api::qr-scan.qr-scan').findMany({
      filters: { qrCode: { documentId } } as any,
      limit: 100000,
    });
    for (const s of scans) {
      try {
        await strapi.documents('api::qr-scan.qr-scan').delete({ documentId: (s as any).documentId });
      } catch (e) { /* continue */ }
    }

    await strapi.documents('api::qr-code.qr-code').delete({ documentId });
    ctx.body = { success: true, deletedScans: scans.length };
  },

  /**
   * GET /qr/:shortId
   * PUBLIC endpoint. Logs the scan and 302-redirects to the destination URL.
   *
   * Design choices:
   * - 302 (not 301) so browsers don't cache the redirect - we need every scan logged.
   * - Cache-Control: no-store for the same reason.
   * - Scan logging is BEST-EFFORT: if the insert fails we still redirect the user.
   *   It's better to let the scan through than to break the UX because our DB hiccuped.
   * - We don't wait for the insert to finish (fire-and-forget) to keep the redirect
   *   instant. The insert typically completes in < 50ms anyway.
   */
  async redirect(ctx) {
    const { shortId } = ctx.params;
    if (!shortId || typeof shortId !== 'string') {
      ctx.status = 400;
      ctx.body = 'Invalid QR code';
      return;
    }

    const entity = await strapi.documents('api::qr-code.qr-code').findFirst({
      filters: { shortId } as any,
    }) as any;

    if (!entity || entity.active === false) {
      ctx.status = 404;
      ctx.body = 'QR code not found or disabled';
      return;
    }

    // Best-effort scan logging. Does not block the redirect.
    // IP-HASH (Loi 25, 31 mai 2026) : ipRaw est l'IP en clair recuperee des
    // headers. Elle sert UNIQUEMENT en memoire, pour 2 derivations immediates
    // (geoip + hash sale), puis elle est jetee. Elle n'est JAMAIS persistee.
    const ipRaw =
      (ctx.request.headers['cf-connecting-ip'] as string)
      || (ctx.request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || ctx.ip
      || '';
    const userAgent = String(ctx.request.headers['user-agent'] || '').slice(0, 500);
    const referer = String(ctx.request.headers['referer'] || '').slice(0, 500);
    // GEOIP (3 mai 2026) : enrichissement local via geoip-lite (MaxMind
    // GeoLite2). Aucune API externe -> pas de latence ajoutee, pas de
    // rate-limit, pas de probleme GDPR cote IP shipping. Calcule AVANT le
    // hash, sur l'IP brute en memoire.
    const { city, country } = resolveGeo(ipRaw);

    // IP-HASH (Loi 25) : on hache l'IP avec un sel serveur. Si le sel est
    // absent, on NE stocke aucune IP (ni claire ni hachee) et on logue un
    // avertissement, pour ne jamais persister un hash non sale (cassable par
    // force brute sur l'espace IPv4).
    const ipSalt = process.env.QR_IP_HASH_SALT || '';
    if (!ipSalt) {
      strapi.log.warn(
        '[qr] QR_IP_HASH_SALT absent : scan journalise sans hash IP '
        + '(deduplication des visiteurs uniques desactivee). '
        + 'Definir QR_IP_HASH_SALT dans les variables d\'environnement pour l\'activer.'
      );
    }
    const ipHash = hashIp(ipRaw, ipSalt);

    // Fire-and-forget - do NOT await, do NOT let it block the redirect.
    // On ecrit ipHash (jamais ipAddress). Le champ ipAddress reste dans le
    // schema le temps de la migration mais n'est plus alimente.
    strapi.documents('api::qr-scan.qr-scan').create({
      data: {
        scannedAt: new Date(),
        ipHash,
        userAgent,
        referer,
        city,
        country,
        qrCode: entity.documentId,
      } as any,
    }).catch((err: any) => {
      strapi.log.warn(`QR scan log failed for ${shortId}:`, err?.message || err);
    });

    // 302 redirect to destination
    ctx.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    ctx.status = 302;
    ctx.redirect(entity.destinationUrl);
  },

  /**
   * GET /api/qr-codes/:documentId/scans
   * Returns the raw scan list for a given QR code (for drilldown in the admin UI).
   */
  async listScans(ctx) {
    if (!(await requireAdminAuth(ctx))) return;

    const { documentId } = ctx.params;
    const qr = await strapi.documents('api::qr-code.qr-code').findFirst({
      filters: { documentId } as any,
    });
    if (!qr) return ctx.notFound('QR code not found');

    const scans = await strapi.documents('api::qr-scan.qr-scan').findMany({
      filters: { qrCode: { documentId } } as any,
      sort: { scannedAt: 'desc' } as any,
      limit: 1000,
    });

    // Agregation via le helper partage (SOURCE UNIQUE, reutilisee par le rapport
    // courriel). enrichedScans reste local : c'est la liste par-scan du drilldown,
    // pas de l'agregat.
    const analytics = buildScanAnalytics(scans);
    const enrichedScans = scans.map((s: any) => {
      const ua = s.userAgent || '';
      return {
        scannedAt: s.scannedAt,
        ipAddress: s.ipAddress, // conserve pour compat (vide depuis le hash Loi 25)
        userAgent: s.userAgent,
        referer: s.referer,
        city: s.city || '',
        country: s.country || '',
        device: classifyDevice(ua),
        os: classifyOs(ua),
        browser: classifyBrowser(ua),
      };
    });

    ctx.body = {
      qrCode: { shortId: (qr as any).shortId, destinationUrl: (qr as any).destinationUrl },
      scans: enrichedScans,
      total: scans.length,
      analytics,
    };
  },

  /**
   * POST /api/qr-codes/:documentId/send-report
   * Envoie par courriel le rapport de stats du QR.
   * Destinataire : l'adresse passee dans le body (envoi a la volee), sinon le
   * clientEmail du QR. Aucune adresse valide -> 400 clair.
   * Reutilise buildScanAnalytics (meme agregation que listScans) et
   * sendQrReportEmail (meme pattern Resend que les autres courriels du projet).
   */
  async sendReport(ctx) {
    if (!(await requireAdminAuth(ctx))) return;

    const { documentId } = ctx.params;
    const qr = await strapi.documents('api::qr-code.qr-code').findFirst({
      filters: { documentId } as any,
    }) as any;
    if (!qr) return ctx.notFound('QR code not found');

    const body = (ctx.request.body || {}) as any;
    const rawEmail = (body.email !== undefined && body.email !== null && body.email !== '')
      ? body.email
      : qr.clientEmail;
    const check = normalizeClientEmail(rawEmail);
    if (!check.ok || !check.email) {
      return ctx.badRequest('Aucune adresse courriel valide. Renseigne le courriel du client ou passe une adresse dans la requete.');
    }

    const scans = await strapi.documents('api::qr-scan.qr-scan').findMany({
      filters: { qrCode: { documentId } } as any,
      sort: { scannedAt: 'desc' } as any,
      limit: 1000,
    });
    const analytics = buildScanAnalytics(scans);

    const ok = await sendQrReportEmail({
      qrTitle: qr.title || '',
      shortId: qr.shortId,
      destinationUrl: qr.destinationUrl,
      recipientEmail: check.email,
      analytics,
    });

    if (!ok) {
      return ctx.internalServerError('Le rapport n\'a pas pu etre envoye (Resend non configure ou erreur d\'envoi).');
    }
    ctx.body = { success: true, sentTo: check.email, total: analytics.total };
  },
}));
