# Frontend image: Vite build served by nginx, which also forwards /api to the backend.
#
# NOT TESTED: this file was written on a machine without Docker. Read the "Docker" section of the
# README before relying on it, and please report what you had to change.

FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
