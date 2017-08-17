FROM node:boron-slim

RUN mkdir -p /usr/src/app/api
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY package.json /usr/src/app
RUN npm install --production && npm cache clean

COPY . /usr/src/app

ENV PROTO_PATH api/maalfrid.proto
ENV GRPC_MAALFRID host:port
ENV RETHINK_PORT port
ENV RETHINK_HOST host
ENV RETHINK_DB db
ENV CORS_ORIGIN *

EXPOSE 3002

CMD [ "node", "server.js" ]
