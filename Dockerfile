FROM node:boron-slim

RUN mkdir -p /usr/src/app/api
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY package.json /usr/src/app
RUN npm install --production && npm cache clean

COPY . /usr/src/app

ENV SPROETT_HOST host
ENV SPROETT_PORT port
ENV DB_PORT port
ENV DB_HOST host
ENV DB_NAME name
ENV CORS_ORIGIN *

EXPOSE 3002

CMD [ "node", "server.js" ]
