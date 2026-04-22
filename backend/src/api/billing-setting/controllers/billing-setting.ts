import { factories } from '@strapi/strapi';
import { requireAdminAuth } from '../../../utils/auth';

// BILLING-SETTINGS (avril 2026)
// Single-type qui stocke les parametres de facturation de Massive Medias :
// numeros de taxes (TPS/TVQ/NEQ), coordonnees bancaires, email Interac.
//
// GET  /billing-settings          : public (utilise par le PDF cote client)
// PUT  /billing-settings          : admin-only (edite par /admin/reglages-facturation)
//
// Note : pas de secret business ici (les numeros de taxes et le email Interac
// apparaissent deja sur toutes les factures). Les coordonnees bancaires SONT
// sensibles mais sont destinees a etre imprimees sur les factures, donc leur
// lecture publique est acceptable. Ne PAS stocker ici des infos type mot de
// passe banque, API keys, etc.

// Cast any sur le UID : les types Strapi sont regeneres au boot serveur.
export default factories.createCoreController('api::billing-setting.billing-setting' as any, ({ strapi }) => ({

  async find(ctx) {
    try {
      const entry = await strapi.documents('api::billing-setting.billing-setting' as any).findFirst({});
      if (!entry) {
        // Bootstrap : retourner les defaults si l'entite n'a pas encore ete creee.
        ctx.body = {
          data: {
            companyName: 'Massive Medias',
            companyOwner: 'Michael Sanchez',
            companyAddress: '5338 rue Marquette',
            companyCity: 'Montreal (QC) H2J 3Z3',
            companyEmail: 'massivemedias@gmail.com',
            companyWebsite: 'massivemedias.com',
            neq: '2269057891',
            tps: '732457635RT0001',
            tvq: '4012577678TQ0001',
            interacEmail: 'massivemedias@gmail.com',
          },
        };
        return;
      }
      ctx.body = { data: entry };
    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  },

  async update(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const body = (ctx.request.body as any)?.data || (ctx.request.body as any) || {};

    const ALLOWED = [
      'companyName', 'companyOwner', 'companyAddress', 'companyCity',
      'companyPhone', 'companyEmail', 'companyWebsite',
      'neq', 'tps', 'tvq',
      'interacEmail',
      'bankName', 'bankTransit', 'bankInstitution', 'bankAccount',
      'paymentNotes',
    ];
    const data: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    try {
      // Single-type : on utilise findFirst + update/create selon existence
      const existing = await strapi.documents('api::billing-setting.billing-setting' as any).findFirst({});
      let saved;
      if (existing) {
        saved = await strapi.documents('api::billing-setting.billing-setting' as any).update({
          documentId: (existing as any).documentId,
          data,
        } as any);
      } else {
        saved = await strapi.documents('api::billing-setting.billing-setting' as any).create({
          data,
        } as any);
      }
      strapi.log.info(`[billing-settings] updated fields: ${Object.keys(data).join(', ')}`);
      ctx.body = { data: saved };
    } catch (err: any) {
      strapi.log.error('billing-settings update error:', err);
      ctx.throw(500, err.message);
    }
  },
}));
