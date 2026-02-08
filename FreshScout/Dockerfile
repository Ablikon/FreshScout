# ── Build stage ──
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY index.html ./
COPY vite.config.js ./
COPY eslint.config.js ./
COPY public/ ./public/
COPY src/ ./src/

RUN npm run build

# ── Production stage ──
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
