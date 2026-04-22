FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="express"

WORKDIR /src
RUN apk add --no-cache openssl

COPY backend/package*.json ./
RUN npm install --include=dev

COPY backend/ .
RUN npx prisma generate
RUN npm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]
