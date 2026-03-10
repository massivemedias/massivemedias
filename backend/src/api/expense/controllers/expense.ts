import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::expense.expense', ({ strapi }) => ({

  async adminList(ctx) {
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
        populate: ['receipt'],
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
    const { description, amount, category, date, vendor, receiptNumber, taxDeductible, tpsAmount, tvqAmount, notes } = ctx.request.body as any;

    if (!description || !amount || !category || !date) {
      return ctx.badRequest('Description, montant, categorie et date sont requis');
    }

    const validCategories = ['materials', 'shipping', 'software', 'marketing', 'rent', 'equipment', 'taxes', 'other'];
    if (!validCategories.includes(category)) {
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
        taxDeductible: taxDeductible || false,
        tpsAmount: parseFloat(tpsAmount) || 0,
        tvqAmount: parseFloat(tvqAmount) || 0,
        notes: notes || '',
      },
    });

    ctx.body = { data: expense };
  },
}));
