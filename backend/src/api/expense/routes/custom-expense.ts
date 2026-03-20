export default {
  routes: [
    {
      method: 'GET',
      path: '/expenses/admin',
      handler: 'expense.adminList',
      config: {},
    },
    {
      method: 'GET',
      path: '/expenses/summary/:year',
      handler: 'expense.yearSummary',
      config: {},
    },
    {
      method: 'POST',
      path: '/expenses/create',
      handler: 'expense.createExpense',
      config: {},
    },
    {
      method: 'PUT',
      path: '/expenses/:documentId',
      handler: 'expense.updateExpense',
      config: {},
    },
    {
      method: 'DELETE',
      path: '/expenses/:documentId',
      handler: 'expense.deleteExpense',
      config: {},
    },
  ],
};
