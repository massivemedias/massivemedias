"use strict";
// Routes admin pour le backup manuel JSON.
//
// Endpoint dedie a l'export "tranquillite d'esprit" : le client telecharge
// localement une copie complete des entites vitales (clients, orders, invoices,
// products, artists, testimonials, expenses, contact-submissions). C'est un
// COMPLEMENT aux backups gerees par l'hebergeur (Render PostgreSQL daily
// snapshots), pas un substitut.
//
// Securite : auth: false ici, mais le controller appelle requireAdminAuth en
// premiere ligne -> seuls les emails dans ADMIN_EMAILS (ou le token service)
// peuvent declencher l'export. Voir backend/src/utils/auth.ts.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'GET',
            path: '/admin/backup/export',
            handler: 'backup.exportAll',
            config: {
                auth: false,
            },
        },
    ],
};
