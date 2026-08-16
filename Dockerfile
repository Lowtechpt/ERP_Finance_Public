# Multi-stage build for ERP Finance.
# The demo image runs the SQLite backend, which needs no external database.

# ============ BUILD STAGE ============
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Compiles the frontend into dist/ and the TypeScript API into dist-server/,
# then builds the SQLite demo database from schema.sql + seed data.
RUN npm run build && npm run seed:demo

# ============ DEMO (RUNTIME) STAGE ============
FROM node:22-alpine AS demo

WORKDIR /app

# No npm install here on purpose: the API imports only Node built-ins
# (node:http, node:sqlite, node:child_process), so the runtime needs no
# node_modules at all.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/server/db/erp-finance-demo.sqlite ./server/db/

ENV PRIMAVERA_MODE=demo \
    NODE_ENV=production \
    MEG_FINANCE_API_PORT=5000 \
    MEG_FINANCE_API_HOST=0.0.0.0 \
    STATIC_DIR=/app/dist

EXPOSE 5000

# Drop privileges: the node image ships an unprivileged `node` user.
USER node

# Serves both the API and the built frontend on a single port.
CMD ["node", "dist-server/primavera-api.js"]

# ============ DEVELOPMENT STAGE ============
FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PRIMAVERA_MODE=demo \
    NODE_ENV=development \
    MEG_FINANCE_API_HOST=0.0.0.0

# 5000 = API, 5173 = Vite dev server with hot reload.
EXPOSE 5000 5173

CMD ["npm", "run", "dev"]
