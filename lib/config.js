const version = require('../package.json').version;
const name = require('../package.json').name;
const log = require('./logger')(name);

module.exports = {
  app: {name, version},
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT, 10) || 3010,
    prefix: process.env.PATH_PREFIX || '/api',
  },
  maalfrid: {
    host: process.env.MAALFRID_HOST || 'localhost',
    port: parseInt(process.env.MAALFRID_PORT) || 50051,
    protocol: './lib/service/maalfrid.proto',
  },
  stat: {
    longTextThreshold: process.env.LONG_TEXT_THRESHOLD || 3500,
  },
  rethinkdb: {
    servers: [
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 28015,
      },
    ],
    db: process.env.DB_NAME || 'maalfrid',
    user: process.env.DB_USER || 'maalfrid',
    password: process.env.DB_PASSWORD || '',
    log: log.info,
    silent: true,
  },
  cors: {origin: process.env.CORS_ALLOW_ORIGIN || '*'},
  error: {
    postFormat: (e, obj) => {
      if (process.env.NODE_ENV === 'production') delete obj.stack;
      return obj;
    },
  },
  body: {
    fallback: true,
  },
};
