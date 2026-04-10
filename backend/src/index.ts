import type { Core } from '@strapi/strapi';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // ── Auto-create admin super user ──
    try {
      const existingAdmins = await strapi.db.query('admin::user').findMany({ limit: 1 });
      if (existingAdmins.length === 0) {
        const superAdminRole = await strapi.db.query('admin::role').findOne({
          where: { code: 'strapi-super-admin' },
        });
        if (superAdminRole) {
          const adminEmail = process.env.ADMIN_EMAIL || 'massivemedias@gmail.com';
          const adminPassword = process.env.ADMIN_PASSWORD || 'Massive1423!!';
          await (strapi as any).admin.services.user.create({
            email: adminEmail,
            firstname: 'Massive',
            lastname: 'Medias',
            password: adminPassword,
            registrationToken: null,
            isActive: true,
            roles: [superAdminRole.id],
          });
          console.log(`[bootstrap] Admin super user created (${adminEmail})`);
        }
      }
    } catch (err: any) {
      console.error('[bootstrap] Admin user creation error:', err.message);
    }

    // TOUJOURS verifier les permissions et user-roles (meme sans seed de contenu)
    try {
      // Permissions publiques
      console.log('[seed] Checking public permissions...');
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });

      if (publicRole) {
        const permActions = [
          'api::site-content.site-content.find',
          'api::service-page.service-page.find',
          'api::service-page.service-page.findOne',
          'api::artist.artist.find',
          'api::artist.artist.findOne',
          'api::product.product.find',
          'api::product.product.findOne',
          'api::boutique-item.boutique-item.find',
          'api::boutique-item.boutique-item.findOne',
          'api::news-article.news-article.find',
          'api::news-article.news-article.findOne',
          'api::inventory-item.inventory-item.find',
          'api::inventory-item.inventory-item.findOne',
          'api::service-package.service-package.find',
          'api::service-package.service-package.findOne',
          'api::tatoueur.tatoueur.find',
          'api::tatoueur.tatoueur.findOne',
          'api::flash.flash.find',
          'api::flash.flash.findOne',
          'api::reservation.reservation.find',
          'api::reservation.reservation.findOne',
          'api::reservation.reservation.create',
          'api::tattoo-message.tattoo-message.find',
          'api::tattoo-message.tattoo-message.findOne',
          'api::tattoo-message.tattoo-message.create',
          'plugin::upload.content-api.upload',
          'plugin::upload.content-api.find',
        ];

        for (const action of permActions) {
          const existingPerm = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: { action, role: publicRole.id },
          });
          if (!existingPerm) {
            await strapi.db.query('plugin::users-permissions.permission').create({
              data: { action, role: publicRole.id },
            });
            console.log(`[seed] Public permission for ${action} added!`);
          }
        }
        console.log('[seed] Public permissions OK!');
      }

      // User Roles (proteger contre les resets de schema)
      console.log('[seed] Checking User Roles...');
      const userRolesToSeed = [
        { email: 'howdiy@gmail.com', role: 'artist', artistSlug: 'maudite-machine', displayName: 'Maudite Machine' },
        { email: 'medusart@protonmail.com', role: 'artist', artistSlug: 'psyqu33n', displayName: 'Psyqu33n' },
        { email: 'jay-gagnon@hotmail.ca', role: 'artist', artistSlug: 'adrift', displayName: 'Adrift Vision' },
        { email: 'mokrane.ouzane@gmail.com', role: 'artist', artistSlug: 'mok', displayName: 'Mok' },
        { email: 'qdelobel@gmail.com', role: 'artist', artistSlug: 'quentin-delobel', displayName: 'Quentin Delobel' },
        { email: 'alx.rouleau@gmail.com', role: 'artist', artistSlug: 'no-pixl', displayName: 'No Pixl' },
        { email: 'liah28@gmail.com', role: 'artist', artistSlug: 'cornelia-rose', displayName: 'Cornelia Rose' },
      ];
      for (const ur of userRolesToSeed) {
        const existing = await strapi.documents('api::user-role.user-role').findMany({
          filters: { email: { $eqi: ur.email } } as any,
          limit: 1,
        });
        if (!existing || existing.length === 0) {
          await strapi.documents('api::user-role.user-role').create({ data: ur as any });
          console.log(`[seed] User role for "${ur.email}" created (${ur.role})!`);
        }
      }
      console.log('[seed] User Roles OK!');
    } catch (err: any) {
      console.error('[seed] Permissions/UserRoles error:', err.message);
    }

    // Seed contenu seulement si SEED_CONTENT=true (evite OOM sur Render free tier)
    if (process.env.SEED_CONTENT !== 'true') return;

    // Import dynamique pour ne charger les donnees que si necessaire
    const { siteContentSeedData, servicePagesSeedData, artistsSeedData, productsSeedData } =
      await import('./seed-data');

    console.log('[seed] Checking Site Content...');

    try {
      const existing = await strapi.documents('api::site-content.site-content').findFirst();

      if (existing) {
        console.log(`[seed] Site Content exists (documentId: ${existing.documentId}). Updating...`);
        await strapi.documents('api::site-content.site-content').update({
          documentId: existing.documentId,
          data: siteContentSeedData as any,
          status: 'published',
        });
        console.log('[seed] Site Content updated and published!');
      } else {
        console.log('[seed] No Site Content found. Creating...');
        await strapi.documents('api::site-content.site-content').create({
          data: siteContentSeedData as any,
          status: 'published',
        });
        console.log('[seed] Site Content created and published!');
      }

      // Seed Service Pages
      console.log('[seed] Checking Service Pages...');
      for (const spData of servicePagesSeedData) {
        const existing = await strapi.documents('api::service-page.service-page').findMany({
          filters: { slug: spData.slug },
        });

        if (existing.length > 0) {
          console.log(`[seed] Service Page "${spData.slug}" exists. Updating...`);
          await strapi.documents('api::service-page.service-page').update({
            documentId: existing[0].documentId,
            data: spData as any,
            status: 'published',
          });
        } else {
          console.log(`[seed] Creating Service Page "${spData.slug}"...`);
          await strapi.documents('api::service-page.service-page').create({
            data: spData as any,
            status: 'published',
          });
        }
      }
      console.log('[seed] All 4 Service Pages seeded!');

      // Seed Artists
      console.log('[seed] Checking Artists...');
      for (const artistData of artistsSeedData) {
        const existing = await strapi.documents('api::artist.artist').findMany({
          filters: { slug: artistData.slug },
        });

        if (existing.length > 0) {
          console.log(`[seed] Artist "${artistData.slug}" exists. Updating...`);
          await strapi.documents('api::artist.artist').update({
            documentId: existing[0].documentId,
            data: artistData as any,
            status: 'published',
          });
        } else {
          console.log(`[seed] Creating Artist "${artistData.slug}"...`);
          await strapi.documents('api::artist.artist').create({
            data: artistData as any,
            status: 'published',
          });
        }
      }
      console.log(`[seed] All ${artistsSeedData.length} Artists seeded!`);

      // Seed Products
      console.log('[seed] Checking Products...');
      for (const productData of productsSeedData) {
        const existing = await strapi.documents('api::product.product').findMany({
          filters: { slug: productData.slug },
        });

        if (existing.length > 0) {
          console.log(`[seed] Product "${productData.slug}" exists. Updating...`);
          await strapi.documents('api::product.product').update({
            documentId: existing[0].documentId,
            data: productData as any,
            status: 'published',
          });
        } else {
          console.log(`[seed] Creating Product "${productData.slug}"...`);
          await strapi.documents('api::product.product').create({
            data: productData as any,
            status: 'published',
          });
        }
      }
      console.log(`[seed] All ${productsSeedData.length} Products seeded!`);

      console.log('[seed] Done!');
    } catch (err: any) {
      console.error('[seed] Error:', err.message);
      if (err.details?.errors) {
        err.details.errors.forEach((e: any) => console.error('[seed]  -', e.path?.join('.'), ':', e.message));
      }
    }
  },
};
