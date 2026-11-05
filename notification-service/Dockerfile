# Build context: repository root (the service depends on the shared library libs/event-bus).
# ---------- Shared library ----------
FROM node:22-alpine AS lib
WORKDIR /libs/event-bus
COPY libs/event-bus/package*.json ./
RUN npm ci
COPY libs/event-bus/tsconfig*.json ./
COPY libs/event-bus/src ./src
RUN npm run build

# ---------- Build stage ----------
FROM node:22-alpine AS build
COPY --from=lib /libs/event-bus/package.json /libs/event-bus/package.json
COPY --from=lib /libs/event-bus/dist /libs/event-bus/dist
WORKDIR /app
COPY notification-service/package*.json notification-service/.npmrc ./
RUN npm ci
COPY notification-service/tsconfig*.json ./
COPY notification-service/src ./src
RUN npm run build && npm prune --omit=dev

# ---------- Runtime stage ----------
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY notification-service/package.json ./
USER node
EXPOSE 3004
CMD ["node", "dist/main.js"]
