FROM node:22-alpine

WORKDIR /app

# bcrypt needs build tools for native compilation
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && apk del python3 make g++

COPY src/ ./src/

EXPOSE 8080

CMD ["node", "src/server.js"]
