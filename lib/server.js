const Koa = require('koa')
const app = new Koa()
const cors = require('@koa/cors')
const body = require('koa-json-body')
const error = require('koa-json-error')
const mount = require('koa-mount')
const jwt = require('koa-jwt')
const config = require('./config')
const log = require('./logger')(config.app.name)

log.info('Version:', config.app.version, 'Node:', process.version)

app.use(error(config.error))
app.use(cors(config.cors))
app.use(body(config.body))
app.use(jwt(config.jwt))

require('./routes').forEach((route) => app.use(mount(config.server.prefix, route)))

app.listen(
  config.server.port,
  config.server.host,
  () => {
    log.info(`Listening on ${config.server.host}:${config.server.port}`)
  })
