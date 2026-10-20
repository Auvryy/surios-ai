# Multi-stage Dockerfile for SuriOS (SvelteKit + Svelte 5 + Node 22)

# Stage 1: Build application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies based on package-lock.json
COPY package*.json ./
RUN npm ci

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

EXPOSE 3000

CMD ["node", "build"]
