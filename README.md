# MassiveMedias - Site Web

Nouveau site web pour MassiveMedias avec un backend Strapi et un frontend React moderne.

## Structure du projet

```
massivemedias/
├── backend/          # API Strapi
├── frontend/         # Application React + Vite
└── _old/            # Ancien site (sauvegarde, non déployé)
```

## Démarrage rapide

### Backend (Strapi)

```bash
cd backend
npm install
npm run develop
```

Le backend sera accessible sur http://localhost:1337
Panel d'administration : http://localhost:1337/admin

### Frontend (React + Vite)

Dans un autre terminal :

```bash
cd frontend
npm install
npm run dev
```

Le frontend sera accessible sur http://localhost:3000

## Technologies utilisées

### Backend
- Strapi v5 - Headless CMS
- SQLite - Base de données (développement)
- Node.js

### Frontend
- React 19 - Bibliothèque UI
- Vite - Build tool
- Tailwind CSS - Framework CSS
- React Router - Routing
- Framer Motion - Animations
- Axios - Client HTTP
- React Hook Form - Gestion de formulaires
- Lucide React - Icônes
- Stripe - Paiements
- React Helmet Async - SEO

## Configuration

### Backend

1. Configurer les variables d'environnement dans `backend/.env`
2. Générer de nouvelles clés secrètes pour la production
3. Au premier lancement, créer un compte administrateur

### Frontend

1. Copier `frontend/.env.example` vers `frontend/.env`
2. Configurer l'URL de l'API Strapi
3. Ajouter les clés Stripe si nécessaire

## Développement

Les deux serveurs peuvent tourner simultanément :
- Backend : http://localhost:1337
- Frontend : http://localhost:3000

Le frontend est configuré pour proxifier les requêtes `/api` vers le backend.

## Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

Les fichiers de production seront dans `frontend/dist`

## Notes importantes

- Le dossier `_old/` contient l'ancien site et **ne doit pas être déployé**
- Il est déjà ignoré dans `.gitignore`
- Les secrets dans les fichiers `.env` doivent être régénérés pour la production

## Prochaines étapes

1. Ajouter vos assets (images, fonts, etc.)
2. Personnaliser le design et le contenu
3. Créer les types de contenu dans Strapi
4. Développer les pages et composants
5. Configurer les domaines et déploiement

## Support

Pour toute question ou problème, consultez la documentation :
- [Strapi Documentation](https://docs.strapi.io)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
