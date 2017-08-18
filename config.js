module.exports = {
    sproett: {
        host: process.env.SPROETT_SERVICE_HOST || 'localhost',
        port: process.env.SPROETT_SERVICE_PORT || 50051,
        proto_path: 'api/maalfrid.proto'
    },
    rethinkdb: {
        host: process.env.RETHINK_HOST || 'localhost',
        port: process.env.RETHINK_PORT || 28015,
        db: process.env.RETHINK_DB || 'broprox'
    },
    express: {
        host: "0.0.0.0",
        port: 3002
    },
    corsOptions: {
        origin: process.env.CORS_ORIGIN || '*',
        optionsSuccessStatus: 200
    }
};
