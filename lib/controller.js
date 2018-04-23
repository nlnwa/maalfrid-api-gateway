const {detectLanguage} = require('./service/maalfrid');
const db = require('./db');
const log = require('./logger');

function detectAndUpdate(cursor) {
  return cursor.eachAsync((row) => {
    return detectLanguage(row.text)
      .then((result) => db.getExtractedTexts().get(row.warcId).update({language: result.code}).run())
      .catch((err) => log.error('detectLanguage failed for warcId: ', row.warcId, err.message));
  }, {concurrency: 10});
}

module.exports = {
  async detectLanguageOfAllTexts(ctx) {
    ctx.req.setTimeout(0);

    log.info('Detecting languages of all extracted texts');
    const cursor = await db.getExtractedTexts().run({cursor: true});

    ctx.body = await detectAndUpdate(cursor);

    log.info('Done detecting language of all texts');
  },

  async detectLanguageOfAllTextsMissingCode(ctx) {
    ctx.req.setTimeout(0);

    log.info('Detecting languages of all extracted texts missing language property');
    const cursor = await db.getExtractedTextsWithoutLanguageCode().run({cursor: true});
    ctx.body = await detectAndUpdate(cursor);
    log.info('Done detecting language of texts missing language property');
  },

  async generateAggregate(ctx) {
    ctx.req.setTimeout(100000);

    log.info('Generating aggregate of extracted texts and crawl log grouped on executionId');
    ctx.body = await db.generateAggregate().run();
    log.info('Done generating aggregate');
  },

  async generateStats(ctx) {
    ctx.req.setTimeout(100000);

    log.info('Generating language statistics');
    ctx.body = await db.aggregateStats().run();
    log.info('Done generating language statistics');
  },

  async updateEntitiesAndSeeds(ctx) {
    log.info('Updating entities and seeds...');
    ctx.body = {
      entities: await db.updateEntities().run(),
      seeds: await db.updateSeeds().run(),
    };
    log.info('Updated entities and seeds successfully');
  },

  async getEntities(ctx) {
    ctx.body = {value: await db.getEntities().run()};
  },

  async getSeeds(ctx) {
    const entityId = ctx.query.entity_id;

    ctx.assert(entityId, 400, 'missing parameter: entity_id');

    ctx.body = {value: await db.getSeeds(entityId).run()};
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
    const warcId = ctx.query.warc_id;

    ctx.assert(warcId, 400, 'missing query parameter: warc_id');

    const value = await db.getExtractedText(warcId).run();

    ctx.body = {value};
  },

  async getLanguageStatistic(ctx) {
    const executionId = ctx.query.execution_id;

    ctx.assert(executionId, 400, 'missing query parameter: execution_id');

    let value;

    if (executionId instanceof Array) {
      value = await Promise.all(executionId.map((id) => db.getStats(id).run()));
    } else {
      value = await db.getStats(executionId).run();
    }

    ctx.body = {value};
  },
};
