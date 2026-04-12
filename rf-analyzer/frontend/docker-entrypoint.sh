#!/bin/sh
set -e

# Debug: print BACKEND_URL value
echo "=== Frontend entrypoint starting ==="
echo "BACKEND_URL=${BACKEND_URL}"

# Default if not set
if [ -z "$BACKEND_URL" ]; then
  echo "WARNING: BACKEND_URL not set, using placeholder"
  export BACKEND_URL="http://localhost:8000"
fi

# Ensure it ends with / for nginx proxy_pass path stripping
case "$BACKEND_URL" in
  */) ;;
  *) export BACKEND_URL="${BACKEND_URL}/" ;;
esac

echo "Using BACKEND_URL=${BACKEND_URL}"

# Substitute environment variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Debug: show the generated config
echo "=== Generated nginx config /api/ location ==="
grep -A 5 'location /api/' /etc/nginx/conf.d/default.conf

# Test nginx config
nginx -t

# Start nginx
echo "=== Starting nginx ==="
exec nginx -g 'daemon off;'
