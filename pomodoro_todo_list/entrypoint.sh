#!/bin/sh
for file in /usr/share/nginx/html/assets/*.js; do
  sed -i "s|__VITE_API_URL__|${VITE_API_URL:-http://localhost:3000}|g" "$file"
done
nginx -g "daemon off;"
