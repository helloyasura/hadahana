# Handahana Studio — production image for ervanta.com/hadahana
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Default live prefix under ervanta.com
ARG NEXT_PUBLIC_BASE_PATH=/hadahana
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_POSTHOG_KEY=
ARG NEXT_PUBLIC_POSTHOG_HOST=
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID=
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_TELEMETRY_DISABLED=1
ARG CACHEBUST=0
RUN echo "cachebust=${CACHEBUST}" >/tmp/cachebust \
  && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ARG NEXT_PUBLIC_BASE_PATH=/hadahana
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

ENV CHROMIUM_PATH=/usr/bin/chromium-browser
# System Chromium only: no Playwright browser download; Sinhala HarfBuzz fonts.
RUN apk add --no-cache wget chromium font-noto-sinhala \
  && addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
