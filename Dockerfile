FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="express"

WORKDIR /src
RUN apk add --no-cache openssl

# Clear any npm config that might force --omit=dev
RUN npm config set omit ""

COPY backend/package*.json ./
RUN npm install --omit=dev=false

COPY backend/ .
RUN npx prisma generate
RUN npm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]
