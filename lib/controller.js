const {detectLanguage} = require('./service/maalfrid');
const db = require('./db');
const appName = require('./config').app;
const debug = require('debug')(appName + 'maalfrid-api-gateway:controller');
const log = require('./logger');

function detectAndUpdate(cursor) {
  let count = 0;

  return cursor.eachAsync((row) => {
    count++;
    if (!(count % 100)) {
      debug('(detectLanguageOfAllTexts) %s', count);
    }

    return detectLanguage(row.text)
      .then((result) => db.getExtractedTexts().get(row.warcId).update({language: result.code}).run())
      .catch((err) => log.error('detectLanguage failed for warcId: ', row.warcId, err.message));
  }, {concurrency: 10});
}

module.exports = {
  async detectLanguageOfAllTexts(ctx) {
    log.info('Detecting languages of all extracted texts');
    ctx.req.setTimeout(0);
    const cursor = await db.getExtractedTexts().run({cursor: true});
    ctx.body = await detectAndUpdate(cursor);
  },

  async detectLanguageOfAllTextsMissingCode(ctx) {
    log.info('Detecting languages of all extracted texts missing language property');
    ctx.req.setTimeout(0);
    const cursor = await db.getExtractedTextsWithoutLanguageCode().run({cursor: true});
    ctx.body = await detectAndUpdate(cursor);
  },

  async getExecutions(ctx) {
    const args = ctx.query;
    const seedId = args.seed_id || undefined;
    const jobId = args.job_id || undefined;
    const startTime = new Date(args.start_time);
    const endTime = new Date(args.end_time);

    ctx.assert(!isNaN(startTime.valueOf()), 400, 'startTime: Invalid Date');
    ctx.assert(!isNaN(endTime.valueOf()), 400, 'endTime: Invalid Date');

    const value = await db.getExecutions(jobId, seedId, startTime, endTime).run();

    ctx.body = {value};
  },

  async getText(ctx) {
    const args = ctx.query;
    const warcId = args.warcId;

    ctx.assert(warcId, 400, 'missing query parameter: warcId');

    const value = await db.getExtractedText(warcId).run();
    ctx.body = {value};
  },

  async generateReport(ctx) {
    console.time('report');
    await db.getExtractedTextsoeoeoe().run();
    console.timeEnd('report');
    ctx.body = {status: 'Report generated'};
  },

  async generateStats(ctx) {
    log.info('Generating report cache for all executions');

    console.time('Total time');

    const cursor = await db.getExecutionIds().run({cursor: true});

    // see https://www.rethinkdb.com/api/javascript/each_async/
    await cursor.eachAsync(
      (id) => {
        console.time(id);
        const selection = db.getCrawlLogAndCorrespondingExtractedText(id);
        return db.getLanguageStatistic(selection).run()
          .then((stat) => db.insertReport(id, stat).run())
          .then(() => console.timeEnd(id));
      },
      (err) => {
        if (err) {
          log.error(err);
        }
        console.timeEnd('Total time');
      });

    ctx.body = {status: 'Done processing'};
  },

  async getLanguageStatistic(ctx) {
    debug('Request (getLanguageStatistic):\n%O', ctx.query);
    const executionId = ctx.query.execution_id;
    if (executionId instanceof Array) {
      const value = await Promise.all(executionId.map((id) => db.getStatsFromCache(id).run()));
      ctx.body = {value};
    } else {
      const value = await db.getStatsFromCache(executionId).run();
      ctx.body = {value};
    }
    /*
    const selection = executionId instanceof Array ?
      executionId
        .map((id) => db.getCrawlLogAndCorrespondingExtractedText(id))
        .reduce((acc, curr) => acc.union(curr))
      : db.getCrawlLogAndCorrespondingExtractedText(executionId);
    */
    debug('Response (getLanguageStatistic):\n%j', ctx.body);
  },

  async getCrawlLogAndText(ctx) {
    const executionId = ctx.query.execution_id || '';
    const value = await db.getCrawlLogAndCorrespondingExtractedText(executionId).run();
    ctx.body = {value};
  },
};
