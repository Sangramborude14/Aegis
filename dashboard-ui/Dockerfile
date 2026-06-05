# Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
# Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
#Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

#Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
ENV NEXT_TELEMETRY_DISABLED=1

#Copy public assests and static build outputs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

#Copy standalone build server
COPY --from=builder /app/.next/standalone ./

EXPOSE 3002
CMD ["node", "server.js"]