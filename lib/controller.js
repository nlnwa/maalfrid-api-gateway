const maalfrid = require('./service/maalfrid');
const db = require('./db');

async function updateLanguageCodes(texts) {
  const languageCodes = await Promise.all(texts.map((datum) => maalfrid.detectLanguage(datum.text)));
  const updates = texts.map((text, index) => ({[text.warcId]: {language: languageCodes[index]}}));
  return db.updateLanguageCodes(updates).run();
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
    const args = ctx.query;
    const seedId = args.seed_id || '';
    const jobId = args.job_id || '';
    const startTime = new Date(args.start_time) || new Date();
    const endTime = new Date(args.end_time) || new Date();

    ctx.body = await db.getExecutions(jobId, seedId, startTime, endTime).run();
  },

  async getLanguageStatistic(ctx) {
    const executionId = ctx.query.execution_id;
    const selection = executionId instanceof Array ?
      executionId
        .map((id) => db.getCrawlLogAndCorrespondingExtractedText(id))
        .reduce((acc, curr) => acc.union(curr))
      : db.getCrawlLogAndCorrespondingExtractedText(executionId);
    ctx.body = await db.getLanguageCodes(selection).run();
  },

  async getCrawlLogAndText(ctx) {
    const executionId = ctx.query.execution_id || '';
    ctx.body = await db.getCrawlLogAndCorrespondingExtractedText(executionId).run();
  },
};
