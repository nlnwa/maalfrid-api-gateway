const RETHINK_HOST = process.env.RETHINK_HOST || 'localhost';
const RETHINK_PORT = process.env.RETHINK_PORT || 50051;
const RETHINK_DB = process.env.RETHINK_DB || 'broprox';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'localhost';

module.exports = {
    rethinkdb: {
        host: RETHINK_HOST,
        port: RETHINK_PORT,
        db: RETHINK_DB
    },
    express: {
        host: "0.0.0.0",
        port: 3002
    },
    corsOptions: {
        origin: CORS_ORIGIN,
        optionsSuccessStatus: 200
    }
};
