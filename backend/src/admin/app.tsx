import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: ['fr'],
    translations: {
      fr: {
        'app.components.LeftMenu.navbrand.title': 'mm-admin',
        'app.components.LeftMenu.navbrand.workplace': 'Massive Medias',
        'Auth.form.welcome.title': 'Bienvenue dans mm-admin',
        'Auth.form.welcome.subtitle': 'Panneau d\'administration Massive Medias',
      },
    },
  },
  bootstrap(app: StrapiApp) {
    // mm-admin ready
  },
};
