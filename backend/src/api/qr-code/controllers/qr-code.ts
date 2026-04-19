import { factories } from '@strapi/strapi';
import crypto from 'crypto';
import { requireAdminAuth } from '../../../utils/auth';

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

    const { destinationUrl, title } = (ctx.request.body || {}) as any;
    if (!destinationUrl || typeof destinationUrl !== 'string') {
      return ctx.badRequest('destinationUrl is required');
    }
    const trimmed = destinationUrl.trim();
    if (!isSafeHttpUrl(trimmed)) {
      return ctx.badRequest('destinationUrl must be a valid http(s) URL');
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
      createdAt: (entity as any).createdAt,
      scansCount: 0,
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

    // Efficient scan counting: one findMany per code. For low counts this is fine;
    // if the list grows past a few hundred QR codes, we should move to an aggregate
    // query (strapi.db.query) with GROUP BY for speed.
    const result = await Promise.all(codes.map(async (c: any) => {
      const scans = await strapi.documents('api::qr-scan.qr-scan').findMany({
        filters: { qrCode: { documentId: c.documentId } } as any,
        limit: 100000,
      });
      return {
        id: c.id,
        documentId: c.documentId,
        shortId: c.shortId,
        destinationUrl: c.destinationUrl,
        title: c.title || '',
        createdByEmail: c.createdByEmail || null,
        createdAt: c.createdAt,
        active: c.active !== false,
        scansCount: scans.length,
        lastScannedAt: scans.length > 0
          ? scans.reduce((acc: string, s: any) => (s.scannedAt > acc ? s.scannedAt : acc), '1970-01-01T00:00:00.000Z')
          : null,
      };
    }));

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
    const ipAddress =
      (ctx.request.headers['cf-connecting-ip'] as string)
      || (ctx.request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || ctx.ip
      || '';
    const userAgent = String(ctx.request.headers['user-agent'] || '').slice(0, 500);
    const referer = String(ctx.request.headers['referer'] || '').slice(0, 500);

    // Fire-and-forget - do NOT await, do NOT let it block the redirect.
    strapi.documents('api::qr-scan.qr-scan').create({
      data: {
        scannedAt: new Date(),
        ipAddress: ipAddress.slice(0, 64),
        userAgent,
        referer,
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

    ctx.body = {
      qrCode: { shortId: (qr as any).shortId, destinationUrl: (qr as any).destinationUrl },
      scans: scans.map((s: any) => ({
        scannedAt: s.scannedAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        referer: s.referer,
      })),
      total: scans.length,
    };
  },
}));
