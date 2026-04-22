FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="express"

WORKDIR /src
RUN apk add --no-cache openssl

COPY backend/package*.json ./
RUN npm install

COPY backend/ .
RUN npx prisma generate
RUN tsc

EXPOSE 8080

CMD ["node", "dist/index.js"]
