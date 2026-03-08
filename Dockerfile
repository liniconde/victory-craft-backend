ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 5001

CMD ["node", "dist/index.js"]
