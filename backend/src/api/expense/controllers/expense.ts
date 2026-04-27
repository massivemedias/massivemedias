import { factories } from '@strapi/strapi';
import { requireAdminAuth } from '../../../utils/auth';

const VALID_CATEGORIES = ['consommables', 'materiel', 'shipping', 'software', 'marketing', 'equipment', 'taxes', 'other'];

export default factories.createCoreController('api::expense.expense', ({ strapi }) => ({

  async adminList(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 25;
    const category = ctx.query.category as string;
    const search = ctx.query.search as string;

    const filters: any = {};
    if (category && category !== 'all') filters.category = category;
    if (search) {
      filters.$or = [
        { description: { $containsi: search } },
        { vendor: { $containsi: search } },
      ];
    }

    const [items, allFiltered] = await Promise.all([
      strapi.documents('api::expense.expense').findMany({
        filters,
        sort: 'date:desc',
        limit: pageSize,
        start: (page - 1) * pageSize,
      }),
      strapi.documents('api::expense.expense').findMany({ filters }),
    ]);

    // Summary
    // FIX-COMPTA (27 avril 2026) : `deductible` est calcule en HT (avant taxes)
    // au lieu de TTC. Raison fiscale QC : les TPS/TVQ payees sont RECUPERABLES
    // via credits de taxes sur intrants (CTI/RTI). Les inclure dans les
    // "depenses deductibles" gonfle artificiellement la deduction fiscale.
    // Bonne formule : amount HT = amount_TTC - tps - tvq.
    // Ex: facture 200$ TTC = 173.91$ HT + 8.70$ TPS + 17.39$ TVQ
    //     -> deductible compte 173.91$ (les 26.09$ taxes sont recuperees
    //        separement via la ligne "Net a remettre").
    const allExpenses = await strapi.documents('api::expense.expense').findMany({});
    const summary = {
      total: allExpenses.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0),
      tps: allExpenses.reduce((s: number, e: any) => s + (parseFloat(e.tpsAmount) || 0), 0),
      tvq: allExpenses.reduce((s: number, e: any) => s + (parseFloat(e.tvqAmount) || 0), 0),
      deductible: allExpenses.filter((e: any) => e.taxDeductible).reduce((s: number, e: any) => {
        const amt = parseFloat(e.amount) || 0;
        const tpsAmt = parseFloat(e.tpsAmount) || 0;
        const tvqAmt = parseFloat(e.tvqAmount) || 0;
        return s + (amt - tpsAmt - tvqAmt);
      }, 0),
    };

    const total = allFiltered.length;
    ctx.body = {
      data: items,
      summary,
      meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
    };
  },

  async createExpense(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { description, amount, category, date, vendor, receiptNumber, receiptUrl, taxDeductible, tpsAmount, tvqAmount, notes } = ctx.request.body as any;

    if (!description || !amount || !category || !date) {
      return ctx.badRequest('Description, montant, categorie et date sont requis');
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return ctx.badRequest('Categorie invalide');
    }

    const expense = await strapi.documents('api::expense.expense').create({
      data: {
        description,
        amount: parseFloat(amount),
        category,
        date,
        vendor: vendor || '',
        receiptNumber: receiptNumber || '',
        receiptUrl: receiptUrl || '',
        taxDeductible: taxDeductible || false,
        tpsAmount: parseFloat(tpsAmount) || 0,
        tvqAmount: parseFloat(tvqAmount) || 0,
        notes: notes || '',
      },
    });

    ctx.body = { data: expense };
  },

  async updateExpense(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;
    const body = ctx.request.body as any;

    const item = await strapi.documents('api::expense.expense').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Depense introuvable');

    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
      return ctx.badRequest('Categorie invalide');
    }

    const updateData: any = {};
    if (body.description !== undefined) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.vendor !== undefined) updateData.vendor = body.vendor;
    if (body.receiptNumber !== undefined) updateData.receiptNumber = body.receiptNumber;
    if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl;
    if (body.taxDeductible !== undefined) updateData.taxDeductible = body.taxDeductible;
    if (body.tpsAmount !== undefined) updateData.tpsAmount = parseFloat(body.tpsAmount) || 0;
    if (body.tvqAmount !== undefined) updateData.tvqAmount = parseFloat(body.tvqAmount) || 0;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updated = await strapi.documents('api::expense.expense').update({
      documentId: item.documentId,
      data: updateData,
    });

    ctx.body = { data: updated };
  },

  async deleteExpense(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const { documentId } = ctx.params;

    const item = await strapi.documents('api::expense.expense').findFirst({
      filters: { documentId },
    });
    if (!item) return ctx.notFound('Depense introuvable');

    await strapi.documents('api::expense.expense').delete({
      documentId: item.documentId,
    });

    strapi.log.info(`Depense supprimee: ${item.description} (${item.amount}$)`);
    ctx.body = { success: true };
  },

  async yearSummary(ctx) {
    if (!(await requireAdminAuth(ctx))) return;
    const year = parseInt(ctx.params.year as string) || new Date().getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Depenses de l'annee
    const expenses = await strapi.documents('api::expense.expense').findMany({
      filters: {
        date: { $gte: startDate, $lte: endDate },
      },
    });

    // Revenus: commandes PAYEES (status post-paiement) de l'annee.
    // FIX-MANUAL-EXPORT (23 avril 2026) : le filtre status couvre deja les
    // commandes manuelles prepaid (status='paid' force par manualCreate quand
    // isAlreadyPaid=true) et les manuelles avec lien Stripe payees (status='paid'
    // post-webhook). Les manuelles encore 'pending' (lien Stripe non clique)
    // restent exclues - revenu non realise. Aucune exclusion sur isManual.
    const orders = await strapi.documents('api::order.order').findMany({
      filters: {
        status: { $in: ['paid', 'processing', 'ready', 'shipped', 'delivered'] as any },
        createdAt: { $gte: `${startDate}T00:00:00.000Z`, $lte: `${endDate}T23:59:59.999Z` },
      },
    });

    // Grouper par mois
    const months: any = {};
    for (let m = 0; m < 12; m++) {
      const key = String(m + 1).padStart(2, '0');
      // FIX-MANUAL-EXPORT : breakdown par source (manual vs web) pour transparence
      // dans l'export CSV. Les totaux globaux restent inchanges (somme des deux),
      // ce sont des champs ADDITIONNELS pas un remplacement -> zero regression
      // sur les readers existants.
      months[key] = {
        expenses: 0, tps: 0, tvq: 0, deductible: 0,
        revenue: 0, revenueTps: 0, revenueTvq: 0,
        revenueManual: 0, revenueWeb: 0,
        manualCount: 0, webCount: 0,
      };
    }

    // FIX-DEFENSIVE : numericSafe gere null/undefined/strings/cents-vs-dollars.
    // Retourne toujours un Number fini >= 0 pour ne jamais propager NaN dans
    // les sommations (qui contamineraient TOUT le rapport annuel).
    const numericSafe = (val: any): number => {
      if (val === null || val === undefined) return 0;
      const n = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    for (const e of expenses as any[]) {
      const m = e?.date ? String(e.date).substring(5, 7) : null;
      if (!m || !months[m]) continue;
      const amt = numericSafe(e?.amount);
      const tpsAmt = numericSafe(e?.tpsAmount);
      const tvqAmt = numericSafe(e?.tvqAmount);
      months[m].expenses += amt;       // TTC : ce que l'admin a reellement paye
      months[m].tps += tpsAmt;          // TPS payee (recuperable via CTI)
      months[m].tvq += tvqAmt;          // TVQ payee (recuperable via RTI)
      // FIX-COMPTA (27 avril 2026) : deductible calcule en HT (amount - tps - tvq).
      // Avant : deductible = amount_TTC -> faux fiscalement (les taxes recuperables
      // ne sont pas des charges deductibles). Voir le commentaire long dans
      // adminList summary plus haut pour le raisonnement complet.
      if (e?.taxDeductible) months[m].deductible += (amt - tpsAmt - tvqAmt);
    }

    let manualOrdersIncluded = 0;
    let webOrdersIncluded = 0;
    // FIX-CENTS-DOLLARS (27 avril 2026) : Order schema stocke subtotal/tps/tvq
    // en CENTS (integer), Expense schema stocke amount/tpsAmount/tvqAmount en
    // DOLLARS (decimal). Avant ce fix : on additionnait les cents directement
    // dans `revenue` puis le frontend AnnualBalanceCard affichait fmt(revenue)$
    // sans diviser par 100 -> chiffres 100x trop eleves (2064.43$ HT reel
    // affiche comme 206 443$). On divise par 100 ici pour normaliser tous les
    // champs en DOLLARS, coherent avec les depenses qui sont deja en dollars.
    const CENTS_TO_DOLLARS = 100;
    for (const o of orders as any[]) {
      const d = o?.createdAt ? new Date(o.createdAt) : null;
      if (!d || isNaN(d.getTime())) continue; // skip orders with corrupted dates
      const m = String(d.getMonth() + 1).padStart(2, '0');
      if (!months[m]) continue;

      const subtotal = numericSafe(o?.subtotal) / CENTS_TO_DOLLARS;
      const tps = numericSafe(o?.tps) / CENTS_TO_DOLLARS;
      const tvq = numericSafe(o?.tvq) / CENTS_TO_DOLLARS;
      const isManual = !!o?.isManual;

      months[m].revenue += subtotal;
      months[m].revenueTps += tps;
      months[m].revenueTvq += tvq;
      // Breakdown source (additif aux champs existants)
      if (isManual) {
        months[m].revenueManual += subtotal;
        months[m].manualCount++;
        manualOrdersIncluded++;
      } else {
        months[m].revenueWeb += subtotal;
        months[m].webCount++;
        webOrdersIncluded++;
      }
    }

    // Totaux annuels (champs existants conserves identiques + breakdown manual/web)
    const totals = {
      expenses: 0, tps: 0, tvq: 0, deductible: 0,
      revenue: 0, revenueTps: 0, revenueTvq: 0,
      revenueManual: 0, revenueWeb: 0,
      manualCount: 0, webCount: 0,
    };
    for (const m of Object.values(months) as any[]) {
      totals.expenses += m.expenses;
      totals.tps += m.tps;
      totals.tvq += m.tvq;
      totals.deductible += m.deductible;
      totals.revenue += m.revenue;
      totals.revenueTps += m.revenueTps;
      totals.revenueTvq += m.revenueTvq;
      totals.revenueManual += m.revenueManual;
      totals.revenueWeb += m.revenueWeb;
      totals.manualCount += m.manualCount;
      totals.webCount += m.webCount;
    }

    strapi.log.info(
      `[yearSummary ${year}] orders=${orders.length} ` +
      `(manual=${manualOrdersIncluded}, web=${webOrdersIncluded}) ` +
      `revenue=${totals.revenue.toFixed(2)}$ ` +
      `(manual=${totals.revenueManual.toFixed(2)}$, web=${totals.revenueWeb.toFixed(2)}$)`
    );

    ctx.body = { year, months, totals };
  },
}));
