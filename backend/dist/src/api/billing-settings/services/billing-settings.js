"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
// Cast any : les types Strapi ne sont regeneres qu'au boot du serveur Strapi.
// En prod (Render), le type sera valide des le redeploy. En local, on evite
// l'erreur TS avec un cast.
exports.default = strapi_1.factories.createCoreService('api::billing-settings.billing-settings');
