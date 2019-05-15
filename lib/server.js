const Koa = require('koa')
const app = new Koa()
const cors = require('@koa/cors')
const body = require('koa-json-body')
const error = require('koa-json-error')
const mount = require('koa-mount')
const jwt = require('koa-jwt')

const routes = require('./routes')
const healthCheck = require('./healthz')
const config = require('./config')
const log = config.logger

const { connect, disconnect } = require('./db')

/**
 * Register shutdown handler function
 *
 * @param handlerFn - signal handler function
 */
function handleShutdown (handlerFn) {
  const signals = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM']
  signals.forEach(signal => process.on(signal, (signal) => {
    log.info(`Received ${signal}, shutting down...`)
    handlerFn()
  }))
}

function initApp () {
  app.use(error(config.error))
  app.use(cors(config.cors))
  app.use(body(config.body))
  app.use(mount(config.server.prefix, healthCheck))
  app.use(jwt(config.jwt))
  routes.forEach(route => app.use(mount(config.server.prefix, route)))

  app.listen(
    config.server.port,
    config.server.host,
    () => {
      log.info(`Listening on ${config.server.host}:${config.server.port}`)
    })
}

(async function init () {
  log.info('App:', config.app.version, 'Node:', process.version)

  handleShutdown(() => {
    disconnect()
    process.exit(0)
  })

  try {
    await connect()
  } catch (err) {
    log.error(err)
    process.exit(1)
  }

  initApp()
})()
