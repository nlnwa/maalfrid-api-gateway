const _ = require('koa-route')
const ctl = require('./controller')
const config = require('./config')
const { adminGuard, keyGuard } = require('./auth')

module.exports = {
  authenticated: [
    _.get('/statistics', ctl.getStatistics),
    _.get('/executions', ctl.getExecutions),
    _.get('/entities', ctl.getEntities),
    _.get('/seeds', ctl.getSeeds),
    _.get('/text', ctl.getText),
    _.get('/filter/:id', ctl.getFilterById),
    _.del('/filter/:id', ctl.deleteFilter),
    _.post('/filter', ctl.saveFilter),
    _.put('/filter', ctl.createFilter),
    _.get('/filter', ctl.getFilterBySeedId),
    _.post('/action/detect-language', ctl.detectLanguageOfText),
    _.post('/action/apply-filters', adminGuard(ctl.applyFilters))
  ],
  unauthenticated: [
    _.get('/healthz', keyGuard(ctl.healthCheck, config.healthCheckService.apiKey))
  ]
}
