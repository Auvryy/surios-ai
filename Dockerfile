# Multi-stage Dockerfile for SuriOS (SvelteKit + Svelte 5 + Node 22)

# Stage 1: Build application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install


# Copy source code and build
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Stage 2: Minimal production runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy only production artifacts and node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder /app/scripts/create-admin.mjs ./scripts/create-admin.mjs
COPY --from=builder /app/scripts/seed-presentation.mjs ./scripts/seed-presentation.mjs
COPY --from=builder /app/scripts/fixtures/presentation-snapshot.json ./scripts/fixtures/presentation-snapshot.json

EXPOSE 3000

CMD ["node", "build"]
