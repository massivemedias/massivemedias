import { factories } from '@strapi/strapi';
import { uploadStreamToFolder } from '../../../utils/google-drive';
import { requireAdminAuth } from '../../../utils/auth';

export default factories.createCoreController('api::invoice.invoice', ({ strapi }) => ({

  async findAll(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const sort = ((ctx.query.sort as string) || 'date:desc') as any;
    const pageSize = parseInt((ctx.query as any)?.pagination?.pageSize || '100');
    const invoices = await strapi.documents('api::invoice.invoice').findMany({
      sort,
      limit: pageSize,
    });
    ctx.body = {
      data: invoices,
      meta: { pagination: { page: 1, pageSize, total: invoices.length } },
    };
  },

  async createOne(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { data } = ctx.request.body as any;
    if (!data) return ctx.badRequest('data is required');
    const invoice = await strapi.documents('api::invoice.invoice').create({ data });
    ctx.body = { data: invoice };
  },

  async updateOne(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const { data } = ctx.request.body as any;
    if (!data) return ctx.badRequest('data is required');
    const invoice = await strapi.documents('api::invoice.invoice').update({
      documentId,
      data,
    });
    ctx.body = { data: invoice };
  },

  async deleteOne(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    await strapi.documents('api::invoice.invoice').delete({ documentId });
    ctx.body = { success: true };
  },

  async uploadPdf(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const fs = require('fs');

    // Track filepath for guaranteed cleanup in the outer finally - meme pattern
    // que artist-edit-request.uploadDirect. Si n'importe quel step throw (Drive
    // API down, OOM, timeout network), le fichier temp DOIT etre supprime
    // sinon le disque ephemere de Render se remplit et crash la requete suivante.
    let filepath: string | null = null;

    try {
      const { request: { files } } = ctx as any;

      if (!files || !files.file) {
        return ctx.badRequest('No file provided');
      }

      const folderId = process.env.GOOGLE_DRIVE_INVOICES_FOLDER_ID;
      if (!folderId) {
        strapi.log.error('GOOGLE_DRIVE_INVOICES_FOLDER_ID env var not set');
        return ctx.badRequest('Invoice upload not configured');
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      filepath = file.filepath || file.path;
      const fileName = file.originalFilename || file.name || 'facture.pdf';
      const mimeType = file.mimetype || file.type || 'application/pdf';
      const fileSize = Number(file.size) || 0;

      // Hard limit contre OOM et saturation disque: 50MB par facture.
      // Nos PDF de factures pesent typiquement < 500KB, donc 50MB est une marge
      // large mais rejette quand meme les uploads pathologiques (ex: client qui
      // envoie un DMG par erreur au lieu du PDF).
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (fileSize > MAX_FILE_SIZE) {
        return ctx.badRequest(
          `Fichier trop volumineux (${(fileSize / (1024 * 1024)).toFixed(1)} MB). Maximum: 50 MB.`
        );
      }

      // Stream disque -> Drive. Pas de fs.readFileSync qui chargerait tout le
      // fichier en RAM et annulerait le benefice que formidable ait ecrit le
      // fichier sur disque en premier lieu.
      const readStream = fs.createReadStream(filepath);
      const result = await uploadStreamToFolder(readStream, fileName, folderId, mimeType, fileSize);

      ctx.body = {
        success: true,
        pdfUrl: result.webViewLink,
        pdfFileId: result.fileId,
        fileName: result.fileName,
      };
    } catch (err: any) {
      strapi.log.error('Invoice PDF upload error:', err?.message || err);
      ctx.throw(500, "Erreur lors de l'upload du PDF");
    } finally {
      // Cleanup garanti - wrap en try/catch pour qu'un echec de cleanup ne masque
      // jamais la vraie erreur du handler. Le fichier peut deja ne pas exister
      // (formidable a pu le nettoyer lui-meme, ou on n'a jamais atteint le point
      // d'assignation), donc une erreur ENOENT ici est attendue et ignoree.
      if (filepath) {
        try { fs.unlinkSync(filepath); } catch (_) { /* ignore */ }
      }
    }
  },
}));
