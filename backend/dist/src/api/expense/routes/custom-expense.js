"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
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
            method: 'GET',
            path: '/expenses/summary/:year',
            handler: 'expense.yearSummary',
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
        {
            method: 'PUT',
            path: '/expenses/:documentId',
            handler: 'expense.updateExpense',
            config: {
                auth: false,
            },
        },
        {
            method: 'DELETE',
            path: '/expenses/:documentId',
            handler: 'expense.deleteExpense',
            config: {
                auth: false,
            },
        },
    ],
};
