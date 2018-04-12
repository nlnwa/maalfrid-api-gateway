const _ = require('koa-route');
const ctl = require('./controller');

module.exports = [
  _.get('/detect/missing', ctl.detectLanguageOfAllTextsMissingCode),
  _.get('/generate/report', ctl.generateReport),
  _.get('/generate/stats', ctl.generateStats),
  _.get('/statistic', ctl.getLanguageStatistic),
  _.get('/executions', ctl.getExecutions),
  _.get('/text', ctl.getText),
  _.get('/healthz', (ctx) => ctx.body = {message: 'api works!'}),
];
