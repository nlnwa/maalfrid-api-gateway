const version = require('../package.json').version
const name = require('../package.json').name
const keyStore = require('./keystore')
const log = require('./logger')(name)

module.exports = {
  app: {name, version},
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT, 10) || 3010,
    prefix: process.env.PATH_PREFIX || '/api'
  },
  maalfrid: {
    host: process.env.MAALFRID_HOST || 'localhost',
    port: parseInt(process.env.MAALFRID_PORT) || 50051,
    protocol: './lib/service/maalfrid.proto'
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
  jwt: {
    secret: async function secret (header, payload) {
      const issuer = payload['iss']
      const kid = header['kid']
      return keyStore.getSigningKey(issuer, kid)
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
