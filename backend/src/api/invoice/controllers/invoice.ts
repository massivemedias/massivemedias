import { factories } from '@strapi/strapi';
import { uploadBufferToFolder } from '../../../utils/google-drive';

export default factories.createCoreController('api::invoice.invoice', ({ strapi }) => ({

  async findAll(ctx) {
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
    const { data } = ctx.request.body as any;
    if (!data) return ctx.badRequest('data is required');
    const invoice = await strapi.documents('api::invoice.invoice').create({ data });
    ctx.body = { data: invoice };
  },

  async updateOne(ctx) {
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
    const { documentId } = ctx.params;
    await strapi.documents('api::invoice.invoice').delete({ documentId });
    ctx.body = { success: true };
  },

  async uploadPdf(ctx) {
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
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(file.filepath || file.path);
    const fileName = file.originalFilename || file.name || 'facture.pdf';
    const mimeType = file.mimetype || file.type || 'application/pdf';

    try {
      const result = await uploadBufferToFolder(fileBuffer, fileName, folderId, mimeType);

      ctx.body = {
        success: true,
        pdfUrl: result.webViewLink,
        pdfFileId: result.fileId,
        fileName: result.fileName,
      };
    } catch (err: any) {
      strapi.log.error('Invoice PDF upload error:', err);
      ctx.throw(500, 'Erreur lors de l\'upload du PDF');
    }
  },
}));
