# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

# Stage 2: Build client
FROM deps AS build-client
COPY client/ client/
COPY tsconfig.base.json ./
RUN npm run build -w client

# Stage 3: Build server
FROM deps AS build-server
COPY server/ server/
COPY tsconfig.base.json ./
RUN npm run build -w server

# Stage 4: Production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci -w server --omit=dev

COPY --from=build-server /app/server/dist server/dist
COPY --from=build-client /app/client/dist client/dist

RUN mkdir -p /data/db /data/storage/avatars /data/storage/business-cards /data/storage/documents

EXPOSE 3000
CMD ["node", "server/dist/index.js"]
