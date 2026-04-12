FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json .
RUN npm install

COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src/ ./src/

RUN npm run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM nginx:alpine as runner

# Install envsubst (comes with gettext)
RUN apk add --no-cache gettext

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx template and entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# BACKEND_URL will be injected by Railway as an env variable
# Entrypoint will substitute it into the nginx config

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
