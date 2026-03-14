ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts/start-workers.sh ./scripts/start-workers.sh

RUN npm run build
RUN chmod +x ./scripts/start-workers.sh

EXPOSE 5001

CMD ["node", "dist/index.js"]
