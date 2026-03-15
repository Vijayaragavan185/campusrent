FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start"]
