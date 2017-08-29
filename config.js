module.exports = {
  sproett: {
    host: process.env.SPROETT_HOST || 'localhost',
    port: process.env.SPROETT_PORT || 50051,
    proto_path: 'api/maalfrid.proto',
  },
  rethinkdb: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 28015,
    db: process.env.DB_NAME || 'broprox',
  },
  express: {
    host: '0.0.0.0',
    port: 3002,
  },
  corsOptions: {
    origin: process.env.CORS_ORIGIN || '*',
    optionsSuccessStatus: 200,
  },
};
