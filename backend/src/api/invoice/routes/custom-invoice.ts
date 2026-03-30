export default {
  routes: [
    {
      method: 'POST',
      path: '/invoices/upload-pdf',
      handler: 'invoice.uploadPdf',
      config: { auth: false },
    },
  ],
};
