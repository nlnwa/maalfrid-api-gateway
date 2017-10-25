const {detectLanguage} = require('./service/maalfrid');
const db = require('./db');
const debug = require('debug')('maalfrid-api-gateway:controller');

async function updateLanguageCodes(texts) {
  const languageCodes = await Promise.all(texts.map((datum) => detectLanguage(datum.text)));
  const updates = texts.reduce((acc, text, index) => {
    acc[text.warcId] = {language: languageCodes[index]};
    return acc;
  }, {});
  return db.updateLanguageCodes(updates).run();
}

function respond(ctx, value) {
  ctx.body = {
    value,
    count: value.length,
  };
}

module.exports = {
  async detectLanguageOfAllTexts(ctx) {
    const texts = await db.getExtractedTexts().run();
    ctx.body = await updateLanguageCodes(texts);
  },

  async detectLanguageOfAllTextsMissingCode(ctx) {
    const texts = await db.getExtractedTextsWithoutLanguageCode().run();
    ctx.body = await updateLanguageCodes(texts);
  },

  async getExecutions(ctx) {
    debug('Request (getExecutions):\n%O', ctx.query);
    const args = ctx.query;
    const seedId = args.seed_id || undefined;
    const jobId = args.job_id || undefined;
    const startTime = new Date(args.start_time);
    const endTime = new Date(args.end_time);

    if (isNaN(startTime.valueOf())) {
      ctx.throw(400, 'startTime: Invalid Date');
    } else if (isNaN(endTime.valueOf())) {
      ctx.throw(400, 'endTime: Invalid Date');
    }

    const value = await db.getExecutions(jobId, seedId, startTime, endTime).run();

    debug('Response (getExecutions):\n%O', value);
    respond(ctx, value);
  },

  async getLanguageStatistic(ctx) {
    debug('Request (getLanguageStatistic):\n%O', ctx.query);
    const executionId = ctx.query.execution_id;
    if (executionId instanceof Array) {
      const value = await Promise.all(executionId.map((id) => {
        const selection = db.getCrawlLogAndCorrespondingExtractedText(id);
        return db.getLanguageStatistic(selection).run();
      }));
      respond(ctx, value);
    } else {
      const selection = db.getCrawlLogAndCorrespondingExtractedText(executionId);
      const value = await db.getLanguageStatistic(selection).run();
      respond(ctx, [value]);
    }
    /* const selection = executionId instanceof Array ?
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
    respond(ctx, value);
  },
};