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
        'content-manager.plugin.name': 'Gestionnaire de contenu',
        'content-type-builder.plugin.name': 'Constructeur de types',
        'upload.plugin.name': 'Mediatheque',
        'Settings.application.strapi.description': 'Massive Medias - Studio de production creative',
        'global.content-manager': 'Gestionnaire de contenu',
        'global.plugins.content-type-builder': 'Constructeur de types',
        'global.plugins.upload': 'Mediatheque',
      },
    },
  },
  bootstrap(app: StrapiApp) {
    // mm-admin ready
  },
};
