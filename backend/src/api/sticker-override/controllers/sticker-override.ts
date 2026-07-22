/**
 * ADMIN-STICKERS phase 2 - overrides du catalogue sticker.
 *
 * ARCHITECTURE (validee 21 juillet 2026, option B) : le catalogue de base reste
 * le fichier statique `frontend/src/data/massiveStickers.js` (385 designs, dans
 * le bundle, affichage instantane). Cette table ne porte QUE le delta edite par
 * l'admin. Un slug absent d'ici = valeurs d'origine.
 *
 * SECURITE : la lecture est publique (la vitrine en a besoin pour fusionner),
 * l'ecriture passe par requireAdminAuth (conventions 2.7).
 *
 * "RIEN NE MEURT" : il n'y a AUCUN endpoint de suppression. Masquer = poser
 * hidden=true, reversible d'un clic. Aucun design n'est jamais efface.
 */
import { factories } from '@strapi/strapi';
import { requireAdminAuth } from '../../../utils/auth';

const UID = 'api::sticker-override.sticker-override' as any;

// Un slug de design : lettres minuscules, chiffres, tirets. Verrouille pour
// eviter qu'une faute de frappe cree une ligne fantome jamais rattachee.
const SLUG_RE = /^[a-z0-9-]{3,80}$/;

const NAME_MAX = 80;

function cleanName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/\s+/g, ' ');
  if (!t) return null;
  return t.slice(0, NAME_MAX);
}

// Epaisseur du contour die-cut, en px. Bornee SERVEUR : au-dela de 6 px le
// contour devient une tache blanche qui mange le design, et une valeur
// negative casserait le filtre CSS. null = on revient au defaut du site.
const STROKE_MIN = 0;
const STROKE_MAX = 6;

function cleanStroke(v: unknown): number | null {
  if (v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(STROKE_MAX, Math.max(STROKE_MIN, Math.round(n * 10) / 10));
}

export default factories.createCoreController(UID, ({ strapi }) => ({

  /**
   * GET /sticker-overrides  (PUBLIC)
   * Payload volontairement minimal : la vitrine fusionne ca par-dessus le
   * catalogue statique. Seuls les slugs REELLEMENT modifies sont renvoyes.
   */
  async listPublic(ctx) {
    const rows = await strapi.documents(UID).findMany({ limit: 1000 } as any);
    ctx.body = {
      data: (rows || []).map((r: any) => ({
        slug: r.slug,
        nameFr: r.nameFr || null,
        nameEn: r.nameEn || null,
        nameEs: r.nameEs || null,
        hidden: !!r.hidden,
        strokeWidth: r.strokeWidth ?? null,
      })),
    };
  },

  /**
   * PUT /sticker-overrides/:slug  (ADMIN)
   * Upsert : cree la ligne si le slug n'a jamais ete edite, sinon la met a jour.
   * On n'ecrit QUE les champs presents dans le body (edition partielle), pour
   * qu'un masquage n'efface pas un renommage fait plus tot.
   */
  async upsert(ctx) {
    if (!(await requireAdminAuth(ctx))) return;

    const slug = String(ctx.params?.slug || '').trim();
    if (!SLUG_RE.test(slug)) {
      ctx.status = 400;
      ctx.body = { error: { status: 400, name: 'InvalidSlug', message: 'Slug invalide', code: 'INVALID_SLUG' } };
      return;
    }

    const body = (ctx.request.body || {}) as any;
    const patch: Record<string, any> = {};
    if ('nameFr' in body) patch.nameFr = cleanName(body.nameFr);
    if ('nameEn' in body) patch.nameEn = cleanName(body.nameEn);
    if ('nameEs' in body) patch.nameEs = cleanName(body.nameEs);
    if ('hidden' in body) patch.hidden = !!body.hidden;
    if ('strokeWidth' in body) patch.strokeWidth = cleanStroke(body.strokeWidth);

    if (Object.keys(patch).length === 0) {
      ctx.status = 400;
      ctx.body = { error: { status: 400, name: 'EmptyPatch', message: 'Rien a modifier', code: 'EMPTY_PATCH' } };
      return;
    }

    const existing = await strapi.documents(UID).findMany({ filters: { slug }, limit: 1 } as any);
    let row: any;
    if (existing && existing.length) {
      row = await strapi.documents(UID).update({ documentId: existing[0].documentId, data: patch } as any);
    } else {
      row = await strapi.documents(UID).create({ data: { slug, ...patch } } as any);
    }

    strapi.log.info(`[sticker-override] ${slug} <- ${JSON.stringify(patch)}`);
    ctx.body = {
      data: {
        slug: row.slug,
        nameFr: row.nameFr || null,
        nameEn: row.nameEn || null,
        nameEs: row.nameEs || null,
        hidden: !!row.hidden,
        strokeWidth: row.strokeWidth ?? null,
      },
    };
  },
}));
