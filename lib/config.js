const log = require('./logger');

module.exports = {
  server: {
    host: '0.0.0.0',
    port: 3002,
    prefix: '/api',
  },
  maalfrid: {
    host: process.env.MAALFRID_HOST || 'localhost',
    port: process.env.MAALFRID_PORT || 50051,
    poolSize: process.env.MAALFRID_POOL_SIZE || 1,
  },
  rethinkdb: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 28015,
    db: process.env.DB_NAME || 'broprox',
    log: log.info,
    silent: true,
  },
  cors: {origin: '*'},
  error: {
    postFormat: (e, obj) => {
      if (process.env.NODE_ENV === 'production') delete obj.stack;
      return obj;
    },
  },
};
