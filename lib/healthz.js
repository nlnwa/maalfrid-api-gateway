const _ = require('koa-route')
const db = require('./db')
const config = require('./config')
const { keyGuard } = require('./auth')

/**
 * Health check
 *
 * @see https://inadarei.github.io/rfc-healthcheck/
 * @param ctx {object} Koa context
 * @returns {Promise<void>}
 */
async function healthCheck (ctx) {
  try {
    await db.healthCheck()
    ctx.body = { status: 'pass' }
  } catch (e) {
    ctx.status = 503
    ctx.body = { status: 'fail', details: e.message }
  }
}

module.exports = _.get(config.healthCheckService.path, keyGuard(healthCheck, config.healthCheckService.apiKey))
