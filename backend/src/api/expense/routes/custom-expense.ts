/**
 * Routes custom pour Expenses (admin-only).
 *
 * SEC-A7 (2026-05-13) : defense en profondeur via la policy globale
 * `global::admin-auth`. Avant ce fix, la securite reposait UNIQUEMENT sur
 * l'appel manuel `requireAdminAuth(ctx)` dans chaque controller -> un futur
 * oubli exposait toute la table. La policy ajoute une couche au niveau
 * routeur qui bloque l'acces meme si le controller oublie le guard.
 *
 * `auth: false` est CONSERVE volontairement : ca dit au middleware
 * users-permissions de Strapi de NE PAS valider le token comme un JWT
 * Strapi-interne (puisqu'on utilise des JWTs Supabase). La policy
 * `admin-auth` prend le relais et valide le JWT via Supabase + check
 * ADMIN_EMAILS. Cf. backend/src/policies/admin-auth.ts pour le detail.
 *
 * Triple defense en profondeur :
 *   1. policy global::admin-auth      <- ce fichier (router-level)
 *   2. requireAdminAuth() dans le controller  <- legacy, conserve
 *   3. ADMIN_EMAILS env var sur Render <- limite les comptes autorises
 */
const ADMIN_POLICY = ['global::admin-auth'];

export default {
  routes: [
    {
      method: 'GET',
      path: '/expenses/admin',
      handler: 'expense.adminList',
      config: {
        auth: false,
        policies: ADMIN_POLICY,
      },
    },
    {
      method: 'GET',
      path: '/expenses/summary/:year',
      handler: 'expense.yearSummary',
      config: {
        auth: false,
        policies: ADMIN_POLICY,
      },
    },
    {
      method: 'POST',
      path: '/expenses/create',
      handler: 'expense.createExpense',
      config: {
        auth: false,
        policies: ADMIN_POLICY,
      },
    },
    {
      method: 'PUT',
      path: '/expenses/:documentId',
      handler: 'expense.updateExpense',
      config: {
        auth: false,
        policies: ADMIN_POLICY,
      },
    },
    {
      method: 'DELETE',
      path: '/expenses/:documentId',
      handler: 'expense.deleteExpense',
      config: {
        auth: false,
        policies: ADMIN_POLICY,
      },
    },
  ],
};
