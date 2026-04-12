#!/bin/sh
set -e

# Substitute environment variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Test nginx config
nginx -t

# Start nginx
exec nginx -g 'daemon off;'
