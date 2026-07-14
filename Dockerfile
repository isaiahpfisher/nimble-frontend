# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build the app to serve under the "/nimble-frontend/" subpath, since on AWS
# Apache owns the root and reverse-proxies /nimble-frontend/ to this container.
RUN APP_BASE=/nimble-frontend/ npm run build

# ---- serve stage ----
FROM nginx:alpine
# Place the build under a matching subdir so filesystem paths line up with the
# /nimble-frontend/ URL prefix (nginx uses `root`, not `alias`).
COPY --from=build /app/dist /usr/share/nginx/html/nimble-frontend
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
