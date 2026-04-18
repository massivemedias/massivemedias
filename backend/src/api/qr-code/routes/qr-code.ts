import { factories } from '@strapi/strapi';

// Default CRUD routes - we override create/findMany/delete with custom handlers in
// custom-qr-code.ts so these are kept minimal (mostly a no-op). We still keep findOne
// for default Strapi admin panel access to the content type.
export default factories.createCoreRouter('api::qr-code.qr-code', {
  only: ['findOne'],
});
