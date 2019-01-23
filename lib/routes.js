const _ = require('koa-route')
const ctl = require('./controller')
const { adminGuard } = require('./auth')

module.exports = [
  _.get('/statistics', ctl.getStatistics),
  _.get('/executions', ctl.getExecutions),
  _.get('/entities', ctl.getEntities),
  _.get('/seeds', ctl.getSeeds),
  _.get('/text', ctl.getText),
  _.get('/filter/:id', ctl.getFilterSetById),
  _.del('/filter/:id', ctl.deleteFilterSet),
  _.post('/filter', ctl.saveFilterSet),
  _.put('/filter', ctl.createFilterSet),
  _.get('/filter', ctl.getFilterSet),
  _.post('/action/detect-language', ctl.detectLanguageOfText),
  _.post('/action/apply-filters', adminGuard(ctl.applyFilters))
]
