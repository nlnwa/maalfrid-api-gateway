FROM node:boron-slim

RUN mkdir -p /usr/src/app/api
WORKDIR /usr/src/app

COPY package.json /usr/src/app
RUN npm install --production && npm cache clean

COPY . /usr/src/app

ENV SPROETT_HOST host \
    SPROETT_PORT port \
    SPROETT_POOL_SIZE 1 \
    DB_PORT port \
    DB_HOST host \
    DB_NAME name \
    CORS_ORIGIN *

EXPOSE 3002

CMD [ "node", "server.js" ]
