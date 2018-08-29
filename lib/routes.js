const _ = require('koa-route')
const ctl = require('./controller')
const {adminGuard} = require('./auth')

module.exports = [
  _.get('/update', adminGuard(ctl.updateEntitiesAndSeeds)),
  _.get('/detect/missing', adminGuard(ctl.detectLanguageOfTextsMissingCode)),
  _.get('/generate/aggregate', adminGuard(ctl.generateAggregate)),
  _.post('/detect', ctl.detectLanguageOfText),
  _.get('/statistic', ctl.getLanguageStatistic),
  _.get('/executions', ctl.getExecutions),
  _.get('/entities', ctl.getEntities),
  _.get('/seeds', ctl.getSeeds),
  _.get('/text', ctl.getText),
  _.get('/filter', ctl.getFilter),
  _.post('/filter', ctl.saveFilter),
  _.get('/healthz', (ctx) => { ctx.body = {message: 'api works!'} })
]
