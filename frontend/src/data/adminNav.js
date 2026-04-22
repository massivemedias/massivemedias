/**
 * SOURCE UNIQUE du menu admin.
 * Importe dans AdminLayout.jsx ET Account.jsx.
 * Pour ajouter un onglet: ajouter ICI et nulle part ailleurs.
 *
 * Ordre du menu (demande proprietaire, avril 2026) :
 *   1. Dashboard         (vue d'ensemble)
 *   2. Messages          (priorites relation client/artiste)
 *   3. Utilisateurs      (gestion comptes)
 *   4. Artistes (God)    (mutations directes + finances commissions)
 *   5. ai.massive        (outils IA internes)
 *   6. Notes             (pense-betes admin)
 *   7. Commandes         (workflow vente principal)
 *   8. Inventaire        (stock)
 *   9. Depenses          (factures d'achat)
 *  10. Tarifs            (CMS prix)
 *  11. Codes Promo       (promotions)
 *  12. Temoignages       (social proof)
 */
import {
  LayoutDashboard, Bot, StickyNote, ShoppingBag, Banknote, Package,
  MessageSquare, Users, FileText, Star, DollarSign, Tag, Palette, Receipt,
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, fr: 'Dashboard', en: 'Dashboard', es: 'Dashboard', tooltip: { fr: 'Vue d\'ensemble de l\'activite', en: 'Activity overview', es: 'Resumen de actividad' } },
  { to: '/admin/messages', icon: MessageSquare, fr: 'Messages', en: 'Messages', es: 'Mensajes', tooltip: { fr: 'Messages des artistes et clients', en: 'Artist and client messages', es: 'Mensajes de artistas y clientes' } },
  { to: '/admin/utilisateurs', icon: Users, fr: 'Utilisateurs', en: 'Users', es: 'Usuarios', tooltip: { fr: 'Gestion des comptes (admin, artistes, clients)', en: 'Account management (admin, artists, clients)', es: 'Gestion de cuentas' } },
  { to: '/admin/artists', icon: Palette, fr: 'Artistes (God)', en: 'Artists (God)', es: 'Artistas (God)', tooltip: { fr: 'God Mode: mutations directes sur les profils, oeuvres et commissions artistes', en: 'God Mode: direct mutations on artist profiles, artworks and commissions', es: 'God Mode: mutaciones directas en perfiles y obras' } },
  // Commissions fusionnees (avril 2026) : integrees directement dans l'onglet
  // "Artistes (God)" -> tab Finances & Payouts.
  { to: '/admin/massive-ia', icon: Bot, fr: 'ai.massive', en: 'ai.massive', es: 'ai.massive', tooltip: { fr: 'Outils IA: chat, stickers, mockups', en: 'AI tools: chat, stickers, mockups', es: 'Herramientas IA: chat, stickers, mockups' } },
  { to: '/admin/notes', icon: StickyNote, fr: 'Notes', en: 'Notes', es: 'Notas', tooltip: { fr: 'Notes internes et rappels', en: 'Internal notes and reminders', es: 'Notas internas y recordatorios' } },
  { to: '/admin/commandes', icon: ShoppingBag, fr: 'Commandes', en: 'Orders', es: 'Pedidos', tooltip: { fr: 'Gestion des commandes clients', en: 'Customer order management', es: 'Gestion de pedidos' } },
  { to: '/admin/inventaire', icon: Package, fr: 'Inventaire', en: 'Inventory', es: 'Inventario', tooltip: { fr: 'Gestion du stock (textiles, cadres, materiel)', en: 'Stock management (textiles, frames, equipment)', es: 'Gestion de stock' } },
  // Factures supprime (avril 2026) : workflow unifie dans /admin/commandes.
  // Les depenses (achats) ont leur propre onglet dedie ci-dessous.
  { to: '/admin/depenses', icon: FileText, fr: 'Depenses', en: 'Expenses', es: 'Gastos', tooltip: { fr: 'Factures d\'achat et depenses operationnelles', en: 'Purchase invoices and operating expenses', es: 'Facturas de compra y gastos' } },
  // Onglet Stats supprime (avril 2026) : integre au Dashboard via toggle
  // "Afficher les statistiques detaillees". Les deep-links /admin/stats
  // redirigent vers /admin/dashboard (voir App.jsx).
  { to: '/admin/tarifs', icon: DollarSign, fr: 'Tarifs', en: 'Pricing', es: 'Precios', tooltip: { fr: 'Gestion des prix (CMS)', en: 'Price management (CMS)', es: 'Gestion de precios' } },
  // Facturation : onglet integre dans /admin/commandes (avril 2026) pour centraliser le workflow.
  { to: '/admin/promos', icon: Tag, fr: 'Codes Promo', en: 'Promo Codes', es: 'Codigos Promo', tooltip: { fr: 'Gestion des codes promotionnels', en: 'Promo code management', es: 'Gestion de codigos promocionales' } },
  { to: '/admin/temoignages', icon: Star, fr: 'Temoignages', en: 'Testimonials', es: 'Testimonios', tooltip: { fr: 'Temoignages clients affiches sur le site', en: 'Client testimonials shown on website', es: 'Testimonios de clientes' } },
];

export default ADMIN_NAV_ITEMS;
