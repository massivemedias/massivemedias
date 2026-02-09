# MassiveMedias - Frontend

Frontend moderne pour le site MassiveMedias, construit avec React, Vite, et Tailwind CSS.

## Technologies

- **React** - Bibliothèque UI
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Routing
- **Framer Motion** - Animations
- **Axios** - Client HTTP
- **React Hook Form** - Gestion de formulaires
- **Lucide React** - Icônes
- **Stripe** - Paiements (configuration nécessaire)

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Le site sera accessible sur http://localhost:3000

## Build de production

```bash
npm run build
npm run preview
```

## Variables d'environnement

Copier `.env.example` vers `.env` et configurer:

- `VITE_API_URL` - URL de l'API Strapi
- `VITE_STRIPE_PUBLIC_KEY` - Clé publique Stripe (si nécessaire)

## Structure du projet

```
src/
├── assets/         # Images, fonts, etc.
├── components/     # Composants réutilisables
├── hooks/          # Custom hooks
├── layouts/        # Layouts de pages
├── pages/          # Pages de l'application
├── services/       # Services API
└── utils/          # Fonctions utilitaires
```
