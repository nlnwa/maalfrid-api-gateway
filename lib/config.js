const log = require('./logger');

module.exports = {
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 3002,
    prefix: '/api',
  },
  maalfrid: {
    host: process.env.MAALFRID_HOST || 'localhost',
    port: process.env.MAALFRID_PORT || 50051,
    protocol: 'maalfrid/api/maalfrid.proto',
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
