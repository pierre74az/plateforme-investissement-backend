# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les manifestes en premier pour profiter du cache Docker
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && \
    npm install --save-dev typescript ts-node @types/node && \
    npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Dépendances de production uniquement
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copier le build compilé depuis le stage précédent
COPY --from=builder /app/dist ./dist

# Dossier pour les fichiers uploadés (KYC)
RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
