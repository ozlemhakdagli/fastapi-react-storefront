# Frontend image: Vite build served by nginx, which also forwards /api to the backend.
#
# Not yet tested with Docker. Read "Running with Docker" in the README before you rely on it, and
# please report what you had to change.

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
