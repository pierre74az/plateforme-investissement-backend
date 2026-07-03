# ⚙️ InvestBF — API Engine (Backend)

Ce dépôt héberge l'API REST robuste et sécurisée de la plateforme d'investissement **InvestBF**. Elle gère l'authentification sécurisée, la validation des dossiers de KYC, la création de projets d'investissement, le calcul des souscriptions et l'intégration des paiements avec Stripe.

---

## 🛠️ Stack Technique

- **Runtime** : [Node.js](https://nodejs.org/) (Express.js)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Base de Données** : [PostgreSQL](https://www.postgresql.org/)
- **ORM** : [Prisma](https://www.prisma.io/)
- **Authentification** : JWT (JSON Web Tokens) & [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- **Passerelle de Paiement** : [Stripe SDK](https://stripe.com/)
- **Sécurité** : Helmet, CORS, Express-Rate-Limit

---

## 📁 Structure du Projet

```text
plateforme-investissement-backend/
├── prisma/
│   ├── migrations/         # Historique des migrations SQL de la base
│   ├── schema.prisma       # Définition des modèles de données Prisma (PostgreSQL)
│   └── seed.ts             # Script de population (Admin + 20 Offres d'exemples)
├── src/
│   ├── controllers/        # Contrôleurs contenant la logique métier
│   │   ├── auth.controller.ts         # Inscription, connexion (Bcrypt.js, JWT)
│   │   ├── kyc.controller.ts          # Soumission & validation administrative
│   │   ├── offering.controller.ts     # Offres d'investissement
│   │   ├── payment.controller.ts      # Création des sessions Stripe Checkout
│   │   ├── subscription.controller.ts # Souscriptions investisseurs
│   │   ├── user.controller.ts         # Profils & gestion des utilisateurs
│   │   └── webhook.controller.ts      # Webhook de confirmation Stripe
│   ├── lib/                # Fichiers de configuration des clients tiers
│   │   ├── prisma.ts       # Instance unique globale du Prisma Client
│   │   └── stripe.ts       # Configuration & initialisation Stripe SDK
│   ├── middleware/         # Middlewares Express réutilisables
│   │   ├── auth.middleware.ts         # Guard de vérification du JWT
│   │   ├── security.middleware.ts     # Configuration Helmet & Rate-Limiter
│   │   └── uploads.middleware.ts      # Gestion de l'upload des pièces KYC (Multer)
│   ├── routes/             # Définition des points d'accès (routes) HTTP
│   │   ├── auth.routes.ts
│   │   ├── kyc.routes.ts
│   │   ├── offering.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── subscription.routes.ts
│   │   └── user.routes.ts
│   ├── types/              # Déclarations & extensions de types TypeScript
│   │   └── express.d.ts    # Ajout du paramètre `userId` à l'objet Request d'Express
│   ├── config.ts           # Variables d'environnement & configuration globale
│   └── index.ts            # Point d'entrée de l'application (Démarrage du serveur)
├── uploads/                # Stockage local temporaire des fichiers KYC
├── tsconfig.json           # Configuration du compilateur TypeScript
└── package.json            # Scripts de build, dépendances et metadata npm
```

---

## 🗄️ Architecture des Données (Prisma Schema)

L'API s'articule autour de 4 entités principales :
- `User` : Gestion des utilisateurs (Investisseurs et Administrateurs) avec solde de portefeuille (`balance`) et statut de conformité (`kycStatus`).
- `KycDocument` : Liens sécurisés vers les pièces justificatives d'identité et de domicile d'un utilisateur.
- `Offering` : Offres d'investissement des PME (Secteur, Prix par part, Parts totales, Risque).
- `Subscription` : Souscriptions de parts d'une entreprise reliées à une transaction Stripe.

---

## 🚦 Endpoints de l'API

### Authentification (`/api/auth`)
- `POST /register` : Inscription d'un investisseur
- `POST /login` : Connexion et retour du token JWT
- `GET /me` : Récupération du profil utilisateur connecté

### Catalogue (`/api/offerings`)
- `GET /` : Récupère la liste des offres disponibles
- `GET /:id` : Détails d'une offre spécifique
- `POST /` : *(Admin)* Ajoute une nouvelle opportunité
- `PUT /:id` : *(Admin)* Met à jour une offre existante

### KYC & Conformité (`/api/kyc`)
- `POST /` : Soumission des fichiers de justificatifs d'identité
- `GET /` : *(Admin)* Récupère la liste des KYC en attente de validation

### Transactions & Paiement (`/api/payments`)
- `POST /create-checkout-session` : Initialise une session Stripe Checkout pour l'achat de parts
- `POST /webhooks/stripe` : Endpoint webhook gérant les confirmations asynchrones de Stripe pour valider et créditer les parts achetées

---

## 💻 Démarrage Local

### Prérequis
- Node.js (version 20+)
- Une base de données PostgreSQL (locale ou cloud de type Neon/Render)

### Configuration

1. Naviguez dans le dossier backend :
   ```bash
   cd plateforme-investissement-backend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Créez un fichier `.env` à la racine :
   ```env
   PORT=3001
   DATABASE_URL="postgresql://user:password@localhost:5432/investbf?schema=public"
   JWT_SECRET="votre_secret_jwt_super_securise"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   FRONTEND_URL="http://localhost:3000"
   ADMIN_PASSWORD="InvestBF@2026"
   ```

4. Exécutez les migrations de base de données :
   ```bash
   npx prisma migrate dev
   ```

5. Lancez le script de population de base (Seed) pour créer le compte Admin de démo et les 20 entreprises :
   ```bash
   npx prisma db seed
   ```

6. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

---

## 🚀 Déploiement sur Render

Ce backend est optimisé pour être déployé sur la formule gratuite de **Render**.

### Paramètres de déploiement Render
1. Créez un **Web Service** lié à votre dépôt GitHub.
2. Renseignez la configuration suivante :
   - **Environment** : `Node`
   - **Build Command** : `npm run build:prod` (ce script compile TypeScript et exécute automatiquement les seeds de données)
   - **Start Command** : `npm start`
3. Ajoutez vos variables d'environnement (`DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, etc.) dans l'onglet **Environment** sur Render.
