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
    const allExpenses = await strapi.documents('api::expense.expense').findMany({});
    const summary = {
      total: allExpenses.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0),
      tps: allExpenses.reduce((s: number, e: any) => s + (parseFloat(e.tpsAmount) || 0), 0),
      tvq: allExpenses.reduce((s: number, e: any) => s + (parseFloat(e.tvqAmount) || 0), 0),
      deductible: allExpenses.filter((e: any) => e.taxDeductible).reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0),
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

    // Revenus: commandes payees de l'annee
    const orders = await strapi.documents('api::order.order').findMany({
      filters: {
        status: { $in: ['paid', 'processing', 'ready', 'shipped', 'delivered'] },
        createdAt: { $gte: `${startDate}T00:00:00.000Z`, $lte: `${endDate}T23:59:59.999Z` },
      },
    });

    // Grouper par mois
    const months: any = {};
    for (let m = 0; m < 12; m++) {
      const key = String(m + 1).padStart(2, '0');
      months[key] = { expenses: 0, tps: 0, tvq: 0, deductible: 0, revenue: 0, revenueTps: 0, revenueTvq: 0 };
    }

    for (const e of expenses as any[]) {
      const m = e.date ? e.date.substring(5, 7) : null;
      if (!m || !months[m]) continue;
      months[m].expenses += parseFloat(e.amount) || 0;
      months[m].tps += parseFloat(e.tpsAmount) || 0;
      months[m].tvq += parseFloat(e.tvqAmount) || 0;
      if (e.taxDeductible) months[m].deductible += parseFloat(e.amount) || 0;
    }

    for (const o of orders as any[]) {
      const d = o.createdAt ? new Date(o.createdAt) : null;
      if (!d) continue;
      const m = String(d.getMonth() + 1).padStart(2, '0');
      if (!months[m]) continue;
      months[m].revenue += parseFloat(o.subtotal) || 0;
      months[m].revenueTps += parseFloat(o.tps) || 0;
      months[m].revenueTvq += parseFloat(o.tvq) || 0;
    }

    // Totaux annuels
    const totals = {
      expenses: 0, tps: 0, tvq: 0, deductible: 0, revenue: 0, revenueTps: 0, revenueTvq: 0,
    };
    for (const m of Object.values(months) as any[]) {
      totals.expenses += m.expenses;
      totals.tps += m.tps;
      totals.tvq += m.tvq;
      totals.deductible += m.deductible;
      totals.revenue += m.revenue;
      totals.revenueTps += m.revenueTps;
      totals.revenueTvq += m.revenueTvq;
    }

    ctx.body = { year, months, totals };
  },
}));
