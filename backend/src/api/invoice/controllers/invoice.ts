import { factories } from '@strapi/strapi';
import { uploadBufferToFolder } from '../../../utils/google-drive';

export default factories.createCoreController('api::invoice.invoice', ({ strapi }) => ({
  // POST /invoices/upload-pdf - Upload un PDF de facture vers Google Drive
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
