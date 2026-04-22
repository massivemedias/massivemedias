/**
 * SOURCE UNIQUE du menu admin.
 * Importe dans AdminLayout.jsx ET Account.jsx.
 * Pour ajouter un onglet: ajouter ICI et nulle part ailleurs.
 */
import {
  LayoutDashboard, Bot, StickyNote, ShoppingBag, Banknote, Package,
  MessageSquare, Users, FileText, Star, BarChart3, DollarSign, Tag, Palette, Receipt,
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, fr: 'Dashboard', en: 'Dashboard', es: 'Dashboard', tooltip: { fr: 'Vue d\'ensemble de l\'activite', en: 'Activity overview', es: 'Resumen de actividad' } },
  { to: '/admin/massive-ia', icon: Bot, fr: 'ai.massive', en: 'ai.massive', es: 'ai.massive', tooltip: { fr: 'Outils IA: chat, stickers, mockups', en: 'AI tools: chat, stickers, mockups', es: 'Herramientas IA: chat, stickers, mockups' } },
  { to: '/admin/notes', icon: StickyNote, fr: 'Notes', en: 'Notes', es: 'Notas', tooltip: { fr: 'Notes internes et rappels', en: 'Internal notes and reminders', es: 'Notas internas y recordatorios' } },
  { to: '/admin/commandes', icon: ShoppingBag, fr: 'Commandes', en: 'Orders', es: 'Pedidos', tooltip: { fr: 'Gestion des commandes clients', en: 'Customer order management', es: 'Gestion de pedidos' } },
  // Commissions fusionnees (avril 2026) : integrees directement dans l'onglet
  // "Artistes (God)" -> tab Finances & Payouts.
  { to: '/admin/inventaire', icon: Package, fr: 'Inventaire', en: 'Inventory', es: 'Inventario', tooltip: { fr: 'Gestion du stock (textiles, cadres, materiel)', en: 'Stock management (textiles, frames, equipment)', es: 'Gestion de stock' } },
  { to: '/admin/messages', icon: MessageSquare, fr: 'Messages', en: 'Messages', es: 'Mensajes', tooltip: { fr: 'Messages des artistes et clients', en: 'Artist and client messages', es: 'Mensajes de artistas y clientes' } },
  { to: '/admin/utilisateurs', icon: Users, fr: 'Utilisateurs', en: 'Users', es: 'Usuarios', tooltip: { fr: 'Gestion des comptes (admin, artistes, clients)', en: 'Account management (admin, artists, clients)', es: 'Gestion de cuentas' } },
  { to: '/admin/artists', icon: Palette, fr: 'Artistes (God)', en: 'Artists (God)', es: 'Artistas (God)', tooltip: { fr: 'God Mode: mutations directes sur les profils et oeuvres artistes', en: 'God Mode: direct mutations on artist profiles and artworks', es: 'God Mode: mutaciones directas en perfiles y obras' } },
  // Factures supprime (avril 2026) : workflow unifie dans /admin/commandes.
  // Les depenses (achats) ont leur propre onglet dedie ci-dessous.
  { to: '/admin/depenses', icon: FileText, fr: 'Depenses', en: 'Expenses', es: 'Gastos', tooltip: { fr: 'Factures d\'achat et depenses operationnelles', en: 'Purchase invoices and operating expenses', es: 'Facturas de compra y gastos' } },
  { to: '/admin/temoignages', icon: Star, fr: 'Temoignages', en: 'Testimonials', es: 'Testimonios', tooltip: { fr: 'Temoignages clients affiches sur le site', en: 'Client testimonials shown on website', es: 'Testimonios de clientes' } },
  { to: '/admin/stats', icon: BarChart3, fr: 'Stats', en: 'Stats', es: 'Stats', tooltip: { fr: 'Statistiques de ventes et revenus', en: 'Sales and revenue statistics', es: 'Estadisticas de ventas' } },
  { to: '/admin/tarifs', icon: DollarSign, fr: 'Tarifs', en: 'Pricing', es: 'Precios', tooltip: { fr: 'Gestion des prix (CMS)', en: 'Price management (CMS)', es: 'Gestion de precios' } },
  { to: '/admin/reglages-facturation', icon: Receipt, fr: 'Facturation', en: 'Billing', es: 'Facturacion', tooltip: { fr: 'TPS/TVQ, Interac, coordonnees bancaires', en: 'Tax numbers, Interac, bank info', es: 'Impuestos, Interac, banco' } },
  { to: '/admin/promos', icon: Tag, fr: 'Codes Promo', en: 'Promo Codes', es: 'Codigos Promo', tooltip: { fr: 'Gestion des codes promotionnels', en: 'Promo code management', es: 'Gestion de codigos promocionales' } },
];

export default ADMIN_NAV_ITEMS;
