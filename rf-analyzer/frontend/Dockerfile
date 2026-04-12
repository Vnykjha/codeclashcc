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

# Copy nginx template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# BACKEND_URL will be injected by Railway as an env variable
# e.g. http://backend.railway.internal:8000
# nginx Docker image auto-runs envsubst on /etc/nginx/templates/
# when NGINX_ENVSUBST_TEMPLATE_DIR is set (it is by default)

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
