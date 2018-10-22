const version = require('../package.json').version
const name = require('../package.json').name
const {getSigningKey} = require('./keystore')
const log = require('./logger')(name)

module.exports = {
  app: {name, version},
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT, 10) || 3010,
    prefix: process.env.PATH_PREFIX || '/api'
  },
  languageService: {
    host: process.env.LANGUAGE_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.LANGUAGE_SERVICE_PORT) || 8672,
    protocol: 'node_modules/maalfrid-api/maalfrid/service/language/ls.proto'
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
    log: log.info,
    silent: true
  },
  auth: {
    updateInterval: 60000 // 1 minute
  },
  jwt: {
    secret: async function secret (header, payload) {
      const issuer = payload['iss']
      const kid = header['kid']
      return getSigningKey(issuer, kid)
    },
    algorithms: ['RS256'] // see https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/
  },
  cors: {origin: process.env.CORS_ALLOW_ORIGIN || '*'},
  error: {
    // don't print stack trace in production
    postFormat: (e, obj) => {
      if (process.env.NODE_ENV === 'production') delete obj.stack
      return obj
    }
  },
  body: {
    fallback: true
  }
}
