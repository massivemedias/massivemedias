export default {
  routes: [
    {
      method: 'GET',
      path: '/expenses/admin',
      handler: 'expense.adminList',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/expenses/create',
      handler: 'expense.createExpense',
      config: {
        auth: false,
      },
    },
  ],
};
