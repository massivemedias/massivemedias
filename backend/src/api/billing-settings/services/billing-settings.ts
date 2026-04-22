import { factories } from '@strapi/strapi';

// Cast any : les types Strapi ne sont regeneres qu'au boot du serveur Strapi.
// En prod (Render), le type sera valide des le redeploy. En local, on evite
// l'erreur TS avec un cast.
export default factories.createCoreService('api::billing-settings.billing-settings' as any);
