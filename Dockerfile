FROM node:slim

RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

COPY package.json yarn.lock /usr/src/app/
RUN yarn install --production && yarn cache clean

COPY . /usr/src/app

ENV MAALFRID_HOST=host \
    MAALFRID_PORT=port \
    MAALFRID_POOL_SIZE=1 \
    DB_PORT=port \
    DB_HOST=host \
    DB_NAME=name

EXPOSE 3002

CMD [ "node", "index.js" ]
