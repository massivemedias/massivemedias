/**
 * Policy globale `global::admin-auth` (A7 - defense en profondeur 2026-05-13).
 *
 * Resout l'audit A7 : les routes admin custom declaraient `auth: false`
 * (necessaire pour bypass le middleware users-permissions qui attend un
 * JWT Strapi-interne) et reposaient UNIQUEMENT sur l'appel manuel
 * `requireAdminAuth(ctx)` dans chaque controller. Si un futur dev oublie
 * cet appel, l'endpoint expose toute la table publiquement, sans le
 * moindre filet de securite.
 *
 * Cette policy fournit le filet : declaree dans `policies: [...]` du
 * routeur, elle s'execute AVANT le controller et applique exactement la
 * meme verification que `requireAdminAuth`. Garantit que meme si un
 * controller oublie le guard manuel, le router-level admin-auth bloque
 * l'acces (defense en profondeur).
 *
 * Pourquoi pas retirer `auth: false` ?
 * Strapi v5 expose 2 layers d'auth :
 *   1. Middleware users-permissions (Strapi-native JWT)
 *   2. Policies (custom logic)
 * Notre stack utilise des JWTs SUPABASE (pas Strapi). Le middleware
 * users-permissions ne sait pas valider un JWT Supabase et le rejette en
 * 401 - donc on garde `auth: false` pour le faire sauter, et on met une
 * policy custom (celle-ci) qui sait verifier le JWT Supabase via
 * `requireAdminAuth`. La policy EST le router-level auth.
 *
 * `requireAdminAuth` est conserve dans les controllers comme 3e niveau
 * (defense en profondeur). Il loggue son resultat dans ctx.state pour
 * que la policy + le controller partagent l'info sans double-validation
 * (le call rapide via service-token re-valide sans I/O, le call Supabase
 * peut etre couteux mais Supabase mettent leur reponse en cache).
 */

import { requireAdminAuth } from '../utils/auth';

const adminAuthPolicy = async (ctx: any) => {
  const ok = await requireAdminAuth(ctx);
  if (!ok) {
    // requireAdminAuth a deja set ctx.status et ctx.body sur 401/403.
    // On retourne false pour que Strapi ne tente pas d'appeler le controller.
    return false;
  }
  return true;
};

export default adminAuthPolicy;
