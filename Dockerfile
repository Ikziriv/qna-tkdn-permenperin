# syntax=docker/dockerfile:1

# --- Build Stage ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm ci

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY server ./server
COPY lib ./lib
COPY drizzle ./drizzle
COPY types.ts ./
COPY constants.ts ./
COPY i18next.d.ts ./
COPY i18n.ts ./
COPY metadata.json ./
COPY tsconfig.json ./
COPY index.html ./

EXPOSE 4000
CMD ["npm", "run", "server"]
