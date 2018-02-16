const _ = require('koa-route');
const ctl = require('./controller');

module.exports = [
  _.get('/statistic', ctl.getLanguageStatistic),
  _.get('/detect/all', ctl.detectLanguageOfAllTexts),
  _.get('/detect/missing', ctl.detectLanguageOfAllTextsMissingCode),
  _.get('/executions', ctl.getExecutions),
  _.get('/texts', ctl.getCrawlLogAndText),
  _.get('/healthz', (ctx) => ctx.body = {message: 'api works!'}),
];

