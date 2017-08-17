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
