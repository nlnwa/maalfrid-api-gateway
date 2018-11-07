const _ = require('koa-route')
const ctl = require('./controller')

module.exports = [
  _.post('/detect', ctl.detectLanguageOfText),
  _.get('/statistic', ctl.getLanguageStatistic),
  _.get('/executions', ctl.getExecutions),
  _.get('/entities', ctl.getEntities),
  _.get('/seeds', ctl.getSeeds),
  _.get('/text', ctl.getText),
  _.get('/filter/:id', ctl.getFilterById),
  _.get('/filter', ctl.getFilterBySeedId),
  _.post('/filter', ctl.saveFilter),
  _.get('/healthz', (ctx) => { ctx.body = {message: 'api works!'} })
]
