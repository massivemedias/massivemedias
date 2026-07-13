import { factories } from '@strapi/strapi';
import { sendNewUserNotificationEmail } from '../../../utils/email';
import { requireAdminAuth, requireUserAuth } from '../../../utils/auth'

// Statuts de commande qui comptent comme "paye reellement"
const PAID_STATUSES = ['paid', 'processing', 'ready', 'shipped', 'delivered'];

/**
 * Reconcilie les clients avec les commandes reellement payees.
 * Auto-cree les clients manquants, met a jour orderCount/totalSpent/lastOrderDate
 * a partir des vraies commandes (evite les desyncs si un webhook a foire).
 */
async function reconcileClientsFromOrders(strapi: any) {
  try {
    const orders = await strapi.documents('api::order.order').findMany({
      filters: { status: { $in: PAID_STATUSES } } as any,
      limit: 10000,
    });
    // Grouper par email
    const byEmail = new Map<string, { email: string; name: string; phone: string; totalSpent: number; orderCount: number; lastOrderDate: string | null; supabaseUserId: string }>();
    for (const o of orders as any[]) {
      const email = (o.customerEmail || '').toLowerCase();
      if (!email) continue;
      const total = (o.total || 0) / 100; // stocke en cents
      const prev = byEmail.get(email);
      const createdAt = o.createdAt || null;
      if (prev) {
        prev.totalSpent += total;
        prev.orderCount += 1;
        if (createdAt && (!prev.lastOrderDate || new Date(createdAt) > new Date(prev.lastOrderDate))) {
          prev.lastOrderDate = createdAt;
        }
        if (!prev.name && o.customerName) prev.name = o.customerName;
        if (!prev.phone && o.customerPhone) prev.phone = o.customerPhone;
        if (!prev.supabaseUserId && o.supabaseUserId) prev.supabaseUserId = o.supabaseUserId;
      } else {
        byEmail.set(email, {
          email,
          name: o.customerName || '',
          phone: o.customerPhone || '',
          totalSpent: total,
          orderCount: 1,
          lastOrderDate: createdAt,
          supabaseUserId: o.supabaseUserId || '',
        });
      }
    }
    // Upsert dans clients
    const existingClients = await strapi.documents('api::client.client').findMany({ limit: 10000 });
    const existingMap = new Map<string, any>();
    for (const c of existingClients as any[]) {
      if (c.email) existingMap.set(c.email.toLowerCase(), c);
    }
    for (const [email, stats] of byEmail) {
      const existing = existingMap.get(email);
      const roundedTotal = Math.round(stats.totalSpent * 100) / 100;
      if (existing) {
        // Update seulement si desync
        const needsUpdate =
          (existing.orderCount || 0) !== stats.orderCount ||
          Math.abs((parseFloat(existing.totalSpent) || 0) - roundedTotal) > 0.01 ||
          existing.lastOrderDate !== stats.lastOrderDate;
        if (needsUpdate) {
          await strapi.documents('api::client.client').update({
            documentId: existing.documentId,
            data: {
              orderCount: stats.orderCount,
              totalSpent: roundedTotal,
              lastOrderDate: stats.lastOrderDate,
              ...(stats.name && !existing.name ? { name: stats.name } : {}),
              ...(stats.phone && !existing.phone ? { phone: stats.phone } : {}),
              ...(stats.supabaseUserId && !existing.supabaseUserId ? { supabaseUserId: stats.supabaseUserId } : {}),
            } as any,
          });
        }
      } else {
        // Auto-creer le client manquant
        await strapi.documents('api::client.client').create({
          data: {
            email,
            name: stats.name || email.split('@')[0],
            phone: stats.phone,
            supabaseUserId: stats.supabaseUserId,
            orderCount: stats.orderCount,
            totalSpent: roundedTotal,
            lastOrderDate: stats.lastOrderDate,
          } as any,
        });
      }
    }
  } catch (err) {
    strapi.log.warn('reconcileClientsFromOrders failed:', err);
  }
}

// STICKERS-FAV : trouve la fiche client du user connecte (par supabaseUserId
// d'abord, sinon par email). Retourne null si aucune.
async function findClientForUser(strapi: any, userId: string | null, userEmail: string | null) {
  if (userId) {
    const byId = await strapi.documents('api::client.client').findMany({ filters: { supabaseUserId: userId }, limit: 1 });
    if (byId[0]) return byId[0];
  }
  if (userEmail) {
    const byEmail = await strapi.documents('api::client.client').findMany({ filters: { email: userEmail.toLowerCase() }, limit: 1 });
    if (byEmail[0]) return byEmail[0];
  }
  return null;
}

// FAV-02 : les favoris passent d'un tableau plat (stickers seulement, format
// #95) a DEUX listes { stickers, prints } - catalogues et identifiants
// differents. Migration DOUCE, sans script DB : un ancien tableau lu ici devient
// { stickers: [...], prints: [] }, et la prochaine ecriture persiste la nouvelle
// forme. Aucun favori perdu. Slugs assainis (memes regles qu'avant : slug/id
// plausible, dedupe, cap 500). L'id de print stable = `${artistSlug}-NNN`
// (ex. mok-001) qui matche le meme regex que les slugs stickers.
const FAV_SLUG_RE = /^[a-z0-9-]{1,80}$/i;
function sanitizeFavList(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return [...new Set(
    arr.filter((s: any) => typeof s === 'string' && FAV_SLUG_RE.test(s))
  )].slice(0, 500);
}
function normalizeFavoris(raw: any): { stickers: string[]; prints: string[] } {
  // Ancien format (tableau plat) => tout en stickers, prints vide (migration).
  if (Array.isArray(raw)) return { stickers: sanitizeFavList(raw), prints: [] };
  if (raw && typeof raw === 'object') {
    return { stickers: sanitizeFavList(raw.stickers), prints: sanitizeFavList(raw.prints) };
  }
  return { stickers: [], prints: [] };
}

export default factories.createCoreController('api::client.client', ({ strapi }) => ({

  async findAll(ctx) {
    // SEC-CLIENTS (12 juillet 2026) : liste complete des fiches clients = PII
    // (email, tel, notes, montants — Loi 25). Garde admin obligatoire. Non
    // appele par le front (l'admin passe par adminList).
    if (!(await requireAdminAuth(ctx))) return;
    // Auto-reconcile avec les vraies commandes avant de retourner (auto-cree les clients manquants, corrige les desyncs)
    await reconcileClientsFromOrders(strapi);
    const sort = ((ctx.query.sort as string) || 'createdAt:desc') as any;
    const pageSize = parseInt((ctx.query as any)?.pagination?.pageSize || '100');
    const clients = await strapi.documents('api::client.client').findMany({ sort, limit: pageSize });
    ctx.body = { data: clients };
  },

  async updateOne(ctx) {
    // SEC-CLIENTS : edition d'une fiche client = admin uniquement (sinon
    // n'importe qui pouvait modifier n'importe quel client). Non appele par le front.
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const { data } = ctx.request.body as any;
    if (!data) return ctx.badRequest('data is required');
    const client = await strapi.documents('api::client.client').update({ documentId, data });
    ctx.body = { data: client };
  },

  async deleteOne(ctx) {
    // SEC-CLIENTS : suppression d'une fiche client = admin uniquement.
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    await strapi.documents('api::client.client').delete({ documentId });
    ctx.body = { success: true };
  },

  async adminList(ctx) {
    // SEC-CLIENTS : CRM clients (PII + adresses + montants depenses) = admin
    // uniquement. Le front admin (adminService.getClients) envoie deja le Bearer
    // Supabase admin via l'interceptor api.js -> rien ne casse.
    if (!(await requireAdminAuth(ctx))) return;
    // Auto-reconcile avec les vraies commandes avant de retourner
    await reconcileClientsFromOrders(strapi);

    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 25;
    const search = ctx.query.search as string;
    const sort = (ctx.query.sort as string) || 'lastOrderDate:desc';

    const filters: any = {};
    if (search) {
      filters.$or = [
        { name: { $containsi: search } },
        { email: { $containsi: search } },
        { company: { $containsi: search } },
      ];
    }

    const [items, allFiltered] = await Promise.all([
      strapi.documents('api::client.client').findMany({
        filters,
        sort: sort as any,
        limit: pageSize,
        start: (page - 1) * pageSize,
        populate: ['orders'] as any,
      }),
      strapi.documents('api::client.client').findMany({ filters } as any),
    ]);

    // Enrichir chaque client avec l'adresse du dernier order
    const enriched = items.map((c: any) => {
      const lastOrder = c.orders?.[0];
      return {
        ...c,
        lastShippingAddress: lastOrder?.shippingAddress || null,
        lastCustomerPhone: lastOrder?.customerPhone || c.phone || null,
        orders: undefined, // ne pas envoyer le raw orders au frontend
      };
    });

    const total = allFiltered.length;
    ctx.body = {
      data: enriched,
      meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
    };
  },

  // Liste les utilisateurs inscrits via Supabase Auth.
  //
  // FIX-SORT (3 mai 2026) : Supabase Admin API /auth/v1/admin/users ne
  // garantit aucun tri (ordre BDD arbitraire). Pour exposer la liste
  // "plus recent en premier" comme demande par l'admin, on fetch TOUTES
  // les pages en interne (boucle defensive avec safety cap), on trie par
  // created_at descendant en memoire, PUIS on applique la pagination
  // demandee. Ainsi page=1 contient toujours les dernieres inscriptions,
  // peu importe combien d'users existent en BDD.
  //
  // Cap de securite : 20 pages * 1000 = 20 000 users. Au-dela on log un
  // warning et on tronque - signe qu'il faudrait passer a une query SQL
  // directe sur auth.users plutot que d'iterer l'admin API.
  async listSupabaseUsers(ctx) {
    // SEC-CLIENTS (4 juillet 2026) : liste de comptes = donnees personnelles
    // (Loi 25). Garde admin obligatoire, meme pattern que orders/admin-list.
    // Le front (AdminUtilisateurs + autocomplete commande manuelle) envoie
    // deja le Bearer Supabase via l'interceptor api.js, rien ne casse.
    if (!(await requireAdminAuth(ctx))) return

    const supabaseUrl = process.env.SUPABASE_API_URL;
    const supabaseKey = process.env.SUPABASE_API_KEY; // service_role key
    if (!supabaseUrl || !supabaseKey) {
      ctx.status = 500;
      ctx.body = { error: 'Supabase non configure' };
      return;
    }

    const page = parseInt(ctx.query.page as string) || 1;
    const perPage = parseInt(ctx.query.perPage as string) || 50;

    try {
      // 1. Fetch all users de Supabase, en boucle pour traverser toutes les pages.
      const FETCH_PAGE_SIZE = 1000; // max admin API recommande
      const MAX_PAGES = 20; // safety cap : 20 000 users
      const allUsers: any[] = [];
      let supabaseTotal: number | null = null;
      for (let internalPage = 1; internalPage <= MAX_PAGES; internalPage++) {
        const url = `${supabaseUrl}/auth/v1/admin/users?page=${internalPage}&per_page=${FETCH_PAGE_SIZE}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
        });
        if (!res.ok) {
          ctx.status = res.status;
          ctx.body = { error: 'Erreur Supabase Auth' };
          return;
        }
        const data: any = await res.json();
        const pageUsers = data.users || [];
        if (typeof data.total === 'number') supabaseTotal = data.total;
        allUsers.push(...pageUsers);
        // Stop si la page renvoyee est partielle (= derniere page)
        if (pageUsers.length < FETCH_PAGE_SIZE) break;
        if (internalPage === MAX_PAGES) {
          strapi.log.warn(
            `[listSupabaseUsers] Cap MAX_PAGES atteint a 20 000 users. ` +
            `Migrer vers une query SQL directe sur auth.users si la base depasse cette taille.`
          );
        }
      }

      // 2. Tri descendant par date de creation - garantit que la page 1
      // contient toujours les inscriptions les plus recentes.
      allUsers.sort((a, b) => {
        const ta = new Date(a.created_at || 0).getTime() || 0;
        const tb = new Date(b.created_at || 0).getTime() || 0;
        return tb - ta;
      });

      // 3. Mapping vers la shape exposee au frontend.
      const mapped = allUsers.map((u: any) => {
        const meta = u.user_metadata || {};
        const profileAddress = meta.address ? {
          address: meta.address,
          city: meta.city || '',
          province: meta.province || '',
          postalCode: meta.postal_code || '',
          country: meta.country || '',
        } : null;
        return {
          id: u.id,
          email: u.email,
          fullName: meta.full_name || meta.name || null,
          phone: u.phone || meta.phone || null,
          // AUTOCOMPLETE-CLIENT (4 juillet 2026) : entreprise saisie dans le
          // panneau compte (Account.jsx -> user_metadata.company). Expose pour
          // pre-remplir le champ entreprise de la commande manuelle.
          company: meta.company || null,
          createdAt: u.created_at,
          lastSignIn: u.last_sign_in_at,
          emailConfirmed: !!u.email_confirmed_at,
          provider: u.app_metadata?.provider || 'email',
          referredBy: meta.referred_by || null,
          contractSigned: meta.contractSigned || false,
          contractSignedAt: meta.contractSignedAt || null,
          contractVersion: meta.contractVersion || null,
          nomArtiste: meta.nomArtiste || null,
          profileAddress,
        };
      });

      // 4. Pagination APRES le tri global - page 1 = users les plus recents.
      const total = supabaseTotal ?? mapped.length;
      const start = (page - 1) * perPage;
      const sliced = mapped.slice(start, start + perPage);

      ctx.body = {
        data: sliced,
        meta: {
          page,
          perPage,
          total,
          pageCount: Math.ceil(total / perPage),
        },
      };
    } catch (err) {
      strapi.log.error('Supabase users fetch error:', err);
      ctx.status = 500;
      ctx.body = { error: 'Impossible de recuperer les utilisateurs' };
    }
  },

  // Notification de nouvelle inscription + linking auto des guest orders
  async notifySignup(ctx) {
    const { name, email, provider, supabaseUserId } = ctx.request.body as any;
    if (!email) {
      ctx.status = 400;
      ctx.body = { error: 'Email requis' };
      return;
    }

    sendNewUserNotificationEmail(name || '', email, provider || 'email').catch(err => {
      strapi.log.warn('Email notification inscription non envoye:', err);
    });

    // Linker les guest orders avec cet email au nouveau supabaseUserId
    let linkedCount = 0;
    if (supabaseUserId) {
      // SEC-CLIENTS (12 juillet 2026) : endpoint public (appele au signup, avant
      // meme la session sur inscription email -> on ne peut pas exiger un JWT).
      // Avant de relier des commandes, verifier que le supabaseUserId correspond
      // REELLEMENT a cet email cote Supabase, sinon un anonyme pourrait relier les
      // commandes d'une victime a SON propre compte (hijack). Fail-closed : en cas
      // de doute on ne relie pas (les commandes restent visibles par email de
      // toute facon dans /orders/my-orders). Meme API REST que deleteSupabaseUser.
      let idMatchesEmail = false;
      try {
        const supabaseUrl = process.env.SUPABASE_API_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_KEY;
        if (supabaseUrl && supabaseKey) {
          const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${supabaseUserId}`, {
            headers: { Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey },
          });
          if (res.ok) {
            const u: any = await res.json();
            idMatchesEmail = String(u?.email || '').toLowerCase() === String(email).toLowerCase();
          }
        }
      } catch (verifErr) {
        strapi.log.warn('notify-signup: verification supabaseUserId echouee:', verifErr);
      }
      if (!idMatchesEmail) {
        strapi.log.warn(`notify-signup: supabaseUserId ne correspond pas a l'email ${email} - linking ignore (anti-hijack)`);
        ctx.body = { success: true, linkedCount: 0 };
        return;
      }
      try {
        const orders = await strapi.documents('api::order.order').findMany({
          filters: {
            customerEmail: email.toLowerCase(),
            $or: [
              { supabaseUserId: '' as any },
              { supabaseUserId: { $null: true } as any },
            ],
          } as any,
        });
        for (const order of orders) {
          await strapi.documents('api::order.order').update({
            documentId: order.documentId,
            data: { supabaseUserId } as any,
          });
          linkedCount++;
        }
        // Aussi update le client record
        const clients = await strapi.documents('api::client.client').findMany({
          filters: { email: email.toLowerCase() },
        });
        for (const client of clients) {
          if (!client.supabaseUserId || client.supabaseUserId === '') {
            await strapi.documents('api::client.client').update({
              documentId: client.documentId,
              data: { supabaseUserId } as any,
            });
          }
        }
        if (linkedCount > 0) {
          strapi.log.info(`Auto-linked ${linkedCount} guest orders to new user ${supabaseUserId} (${email})`);
        }
      } catch (linkErr) {
        strapi.log.warn('Erreur linking guest orders:', linkErr);
      }
    }

    ctx.body = { success: true, linkedCount };
  },

  // Supprimer un utilisateur Supabase
  async deleteSupabaseUser(ctx) {
    // SEC-CLIENTS : suppression d'un compte Supabase = admin uniquement. Le front
    // (AdminUtilisateurs) envoie deja le Bearer admin -> rien ne casse.
    if (!(await requireAdminAuth(ctx))) return;
    const supabaseUrl = process.env.SUPABASE_API_URL;
    const supabaseKey = process.env.SUPABASE_API_KEY;
    if (!supabaseUrl || !supabaseKey) {
      ctx.status = 500;
      ctx.body = { error: 'Supabase non configure' };
      return;
    }

    const { id } = ctx.params;
    if (!id) {
      ctx.status = 400;
      ctx.body = { error: 'User ID requis' };
      return;
    }

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      });
      if (!res.ok) {
        ctx.status = res.status;
        ctx.body = { error: 'Erreur suppression utilisateur' };
        return;
      }
      ctx.body = { success: true };
    } catch (err) {
      strapi.log.error('Supabase user delete error:', err);
      ctx.status = 500;
      ctx.body = { error: 'Impossible de supprimer l\'utilisateur' };
    }
  },

  // STICKERS-FAV : favoris de l'utilisateur connecte, stockes dans le champ JSON
  // `favoris` de sa fiche client (lie par supabaseUserId/email). User-self :
  // requireUserAuth + on ne touche QUE le client du user authentifie (aucun
  // :documentId expose). Le merge anonyme<->serveur se fait cote front au login.
  async getMyFavoris(ctx) {
    if (!(await requireUserAuth(ctx))) return;
    const { userId, userEmail } = (ctx.state as any).user;
    const client = await findClientForUser(strapi, userId, userEmail);
    // Toujours renvoyer la forme deux listes ; migration lue a la volee.
    ctx.body = { favoris: normalizeFavoris((client as any)?.favoris) };
  },

  async updateMyFavoris(ctx) {
    if (!(await requireUserAuth(ctx))) return;
    const { userId, userEmail } = (ctx.state as any).user;
    const incoming = (ctx.request.body as any)?.favoris;
    // Accepte { stickers, prints } (nouveau front) OU un tableau plat (ancien
    // front pendant un rollout) - normalizeFavoris migre et assainit les deux.
    if (incoming == null || typeof incoming !== 'object') {
      return ctx.badRequest('favoris ({ stickers, prints }) requis');
    }
    const favoris = normalizeFavoris(incoming);
    const client = await findClientForUser(strapi, userId, userEmail);
    if (client) {
      await strapi.documents('api::client.client').update({
        documentId: (client as any).documentId,
        data: { favoris } as any,
      });
    } else if (userEmail) {
      // User connecte sans fiche client (aucune commande) : creer une fiche
      // minimale pour persister ses favoris.
      await strapi.documents('api::client.client').create({
        data: { email: userEmail, name: (userEmail.split('@')[0] || 'Client'), supabaseUserId: userId || '', favoris } as any,
      });
    }
    ctx.body = { favoris };
  },
}));
