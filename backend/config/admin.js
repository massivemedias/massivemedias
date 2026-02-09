module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'replaceWithSecureRandomString'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'replaceWithSecureRandomString'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'replaceWithSecureRandomString'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
