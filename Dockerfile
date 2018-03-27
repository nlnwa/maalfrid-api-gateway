FROM node:8-alpine

LABEL maintainer="nettarkivet@nb.no"

COPY package.json yarn.lock /usr/src/app/
WORKDIR /usr/src/app

RUN apk add --no-cache libc6-compat \
&& yarn install --production \
&& yarn cache clean

COPY . .

ENV HOST=0.0.0.0 \
    PORT=3010 \
    CORS_ALLOW_ORIGIN=* \
    PATH_PREFIX=/ \
    MAALFRID_HOST=host \
    MAALFRID_PORT=port \
    DB_PORT=port \
    DB_HOST=host \
    DB_NAME=name \
    DB_USER=admin \
    DB_PASSWORD='' \
    NODE_ENV=production \
    LOG_LEVEL=info

EXPOSE 3010

ENTRYPOINT ["/usr/local/bin/node", "index.js"]
