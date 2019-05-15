const { name, version } = require('../package.json')
const { getSigningKey } = require('./keystore')
const log = require('./logger')(name)
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  app: { name, version },
  logger: log,
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT, 10) || 3010,
    prefix: process.env.PATH_PREFIX || '/maalfrid/api'
  },
  healthCheckService: {
    apiKey: process.env.HEALTHZ_API_KEY || '',
    path: '/healthz'
  },
  languageService: {
    host: process.env.LANGUAGE_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.LANGUAGE_SERVICE_PORT) || 8672,
    protocol: 'node_modules/maalfrid-api/maalfrid/service/language/ls.proto'
  },
  aggregatorService: {
    host: process.env.AGGREGATOR_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.AGGREGATOR_SERVICE_PORT) || 3011,
    protocol: 'node_modules/maalfrid-api/maalfrid/service/aggregator/aggregator.proto'
  },
  rethinkdb: {
    servers: [
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 28015
      }
    ],
    db: process.env.DB_NAME || 'maalfrid',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || '',
    log: log.error,
    silent: true
  },
  auth: {
    updateInterval: 60 * 1000 // 1 minute in ms
  },
  jwt: {
    secret: (header, payload) => {
      const issuer = payload['iss']
      const kid = header['kid']
      return getSigningKey(issuer, kid)
    },
    algorithms: ['RS256'], // see https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/
    debug: process.env.NODE_ENV !== 'production'
  },
  cors: { origin: process.env.CORS_ALLOW_ORIGIN || '*' },
  error: {
    postFormat: (e, obj) => {
      if (isProduction) {
        delete obj.stack
      }
      return obj
    }
  },
  body: {
    fallback: true
  }
}
