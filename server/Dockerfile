# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA

RUN apk add --no-cache python3 make g++ sqlite

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server ./server
RUN npm ci --omit=dev --workspace=server --include-workspace-root

RUN mkdir -p /app/server/data && chown -R node:node /app

USER node

EXPOSE 3000
WORKDIR /app/server
CMD ["node", "backend/server.js"]
