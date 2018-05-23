const dbConfig = require('./config').rethinkdb;
const r = require('rethinkdbdash')(dbConfig);
const longTextThreshold = require('./config').stat.longTextThreshold;

module.exports = {

  /**
   *
   * @param {string} warcId
   * @return {*} extracted_text
   */
  getExtractedText(warcId) {
    return r.db('veidemann').table('extracted_text').get(warcId)('text');
  },

  /**
   * @return {*} Query for table of extracted texts
   */
  getExtractedTexts() {
    return r.db('veidemann').table('extracted_text');
  },

  /**
   * @return {*} Query for extracted texts with language field
   */
  getExtractedTextsWithoutLanguageCode() {
    return r.db('veidemann').table('extracted_text').filter(r.row.hasFields('language').not());
  },

  getStats(executionId) {
    return r.db('maalfrid').table('stats').get(executionId)('stats');
  },

  updateEntities() {
    return r.db('veidemann').table('config_crawl_entities')
      .filter((doc) => doc('meta')('label').contains({key: 'Group', value: 'Språkrådet'}))
      .forEach((entity) => r.db('maalfrid').table('entities').insert(entity, {conflict: 'replace'}));
  },

  updateSeeds() {
    return r.db('maalfrid').table('seeds')
      .insert(r.db('veidemann').table('config_seeds')
          .getAll(r.args(r.db('maalfrid').table('entities').getField('id').coerceTo('array')), {index: 'entityId'}),
        {conflict: 'replace'});
  },

  getEntities() {
    return r.db('maalfrid').table('entities');
  },

  getSeeds(entityId) {
    return r.db('maalfrid').table('seeds').filter({entityId});
  },

  /**
   * Take all executions having a seedId matching any revelant (public sector) seed,
   * join it with crawl_log and extracted_text data and
   * write it to an aggregation table grouped on executionId and jobExecutionId
   *
   * @return {*} write query
   */
  generateAggregate() {
    return r.db('veidemann').table('executions')
      .getAll(r.args(r.db('maalfrid').table('seeds')('id').coerceTo('array')), {index: 'seedId'})
      .eqJoin('id', r.db('veidemann').table('crawl_log'), {index: 'executionId'})
      .without(
        'left',
        {
          right: [
            'fetchTimeMs',
            'fetchTimeStamp',
            'timeStamp',
            'ipAddress',
            'blockDigest',
            'payloadDigest',
            'statusCode',
            'storageRef',
            'surt',
          ],
        })
      .getField('right')
      .eqJoin('warcId', r.db('veidemann').table('extracted_text'))
      .without({right: ['text', 'warcId']})
      .zip()
      .filter(r.row.hasFields('language'))
      .group('executionId', 'jobExecutionId')
      .without('executionId', 'jobExecutionId')
      .ungroup()
      .forEach((doc) => {
        const executionId = doc('group').nth(0);
        const texts = doc('reduction');
        return r.db('maalfrid').table('aggregate').insert(
          r.db('veidemann').table('executions').get(executionId)
            .pluck(
              'jobExecutionId',
              'startTime',
              'jobId',
              'state',
              'endTime',
              'seedId')
            .merge({executionId, texts}));
      });
  },

  /**
   * Aggregate statistics about extracted texts per execution grouped on language
   *
   * @return {*} Query
   */
  aggregateStats() {
    return r.db('maalfrid').table('aggregate')
      .forEach((doc) => {
        return r.db('maalfrid').table('stats').insert({
          id: doc('executionId'),
          stats: doc('texts')
            .group('language')
            .pluck('wordCount')
            .ungroup()
            .map((lang) => ({
              language: lang('group'),
              count: lang('reduction').count(),
              short: lang('reduction')('wordCount').filter((wc) => wc.lt(longTextThreshold)).count(),
              long: lang('reduction')('wordCount').filter((wc) => wc.ge(longTextThreshold)).count(),
            })),
        });
      });
  },


  /**
   * Get list of executions of job and seed within time interval
   *
   * @param {string} jobId
   * @param {string} seedId
   * @param {Date} startTime
   * @param {Date} endTime
   * @return {*} list of executions
   */
  getExecutions(jobId, seedId, startTime, endTime) {
    return r.db('maalfrid').table('aggregate')
      .filter({seedId})
      .filter({jobId})
      // inclusive startTime, exclusive endTime
      .filter(r.row('endTime').during(r.expr(startTime), r.expr(endTime)));
  },
};
