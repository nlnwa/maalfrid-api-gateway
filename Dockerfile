FROM node:8-alpine

LABEL maintainer="nettarkivet@nb.no"

COPY package.json yarn.lock /usr/src/app/
WORKDIR /usr/src/app

RUN yarn install --production && yarn cache clean

COPY . .

ENV MAALFRID_HOST=host \
    MAALFRID_PORT=port \
    DB_PORT=port \
    DB_HOST=host \
    DB_NAME=name \
    NODE_ENV=development \
    LOG_LEVEL=info

EXPOSE 3002

CMD [ "node", "index.js" ]
