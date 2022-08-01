FROM node:16.16.0-alpine3.15@sha256:0c63549e96af4d047ccbea1491944c1c3ce46cc5e4f6a2e69aa537dc1e744902 as dependencies
RUN apk add --no-cache --virtual .gyp python3 make g++

### Install build toolchain, install node deps and compile native add-ons
WORKDIR /var/build
COPY package.json .
RUN npm install

### copy in application source
FROM dependencies as builder
COPY . .
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
RUN npm run build

FROM nginx:stable-alpine@sha256:1aeb5626e29b4f463ce25fc4b07c85eb231f50494d2f46d9184153a4e938302e as release
COPY default.conf /etc/nginx/conf.d/

WORKDIR /usr/share/nginx/html

### Copy static files to final stage image
COPY --from=builder /var/build/dist .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
