const dbConfig = require('./config').rethinkdb;
const r = require('rethinkdbdash')(dbConfig);
const log = require('./logger');

module.exports = {
  /**
   * Update language fields in extracted text table
   *
   * @param {Array} updates List of update objects of the form: {[warcId]: {language: [code]}
   * @return {*} Raw result rethinkdb update result object (updates, changes, etc..)
   */
  updateLanguageCodes(updates) {
    return r.db('veidemann').table('extracted_text')
      .getAll(r.args(Object.keys(updates)))
      .update((extractedText) => r.expr(updates)(extractedText('warcId')));
  },

  /**
   * @return {*} Table of extracted texts
   */
  getExtractedTexts() {
    return r.db('veidemann').table('extracted_text');
  },

  getExecutionIds() {
    return r.db('veidemann').table('executions').map(r.row('id'));
  },

  insertReport(id, stat) {
    return r.db('report').table('cache').insert({id, stat});
  },

  getExtractedTextsWithoutLanguageCode() {
    return r.db('veidemann').table('extracted_text')
      .filter(r.row.hasFields('language').not());
  },

  filterNorwegian(selection) {
    return selection
      .filter(r.row('language').eq('NOB').or(r.row('language').eq('NNO')));
  },

  /**
   * Get list of crawl log entries which have entries in the extracted text table
   *
   * @param {string} executionId
   * @return {Selection} List of crawl log entries and their corresponding extracted text entries
   */
  getCrawlLogAndCorrespondingExtractedText(executionId) {
    return r.db('veidemann').table('crawl_log')
      .filter({executionId})
      .filter({recordType: 'response'})
      .union(
        r.table('crawl_log')
          .filter({executionId})
          .filter({recordType: 'revisit'})
          .getField('warcRefersTo')
          .map((warcId) => r.table('crawl_log').get(warcId))
        // .filter((entry) => r.not(entry.eq(null))) // TODO bug in backend, can be removed after fix
      )
      .eqJoin('warcId', r.table('extracted_text'))
      .zip()
      .without('text');
  },

  getLanguageStatistic(selection) {
    const longTextThreshold = 3500;
    return selection
      .group('language')
      .ungroup()
      .map((doc) => ({
        language: doc('group'),
        total: doc('reduction').count(),
        short: doc('reduction')('wordCount')
          .filter((wc) => wc.lt(longTextThreshold)).count(),
        long: doc('reduction')('wordCount')
          .filter((wc) => wc.ge(longTextThreshold)).count(),
        /* avg: {
          lix: doc('reduction')('lix').avg(),
          sentenceCount: doc('reduction')('sentenceCount').avg(),
        },*/
      }));
  },

  getStatsFromCache(executionId) {
    return r.db('report').table('cache').get(executionId)('stat');
  },

  /**
   * A better approach than filtering on the huge crawl_log is to start with extracted_text
   */

  getExtractedTextsoeoeoe() {
    return r.db('veidemann').table('extracted_text')
      .filter(r.row.hasFields('language')).without('text')
      .eqJoin('warcId', r.db('veidemann').table('crawl_log'))
      .zip()
      .without([
        'fetchTimeMs',
        'fetchTimeStamp',
        'timeStamp',
        'ipAddress',
        'blockDigest',
        'payloadDigest',
        'statusCode',
        'storageRef',
        'surt',
      ])
      .eqJoin('executionId', r.db('veidemann').table('executions'))
      .zip()
      .without(['documentsCrawled', 'documentsDenied', 'documentsRetried', 'urisCrawled', 'scope'])
      .group('executionId')
      .ungroup()
      .forEach((doc) => r.db('report').table('maalfrid_report').insert(
        {
          id: doc('group'),
          texts: doc('reduction'),
        }
      ));
  },

  generateReportCache() {
    return r.db('report').table('maalfrid_report')
      .map((doc) => ({
          id: doc('id'),
          count: doc('texts').count(),
          stat: doc('texts')
            .group('language')
            .ungroup()
            .map((lang) => ({
              language: lang('group'),
              count: lang('reduction').count(),
              short: lang('reduction')('wordCount').filter((wc) => wc.lt(3500)).count(),
              long: lang('reduction')('wordCount').filter((wc) => wc.ge(3500)).count(),

            })),
        })
      );
  },


  /**
   * Get list of executions of job and seed within time interval
   *
   * @param {string} jobId
   * @param {string} seedId
   * @param {Date} startTime
   * @param {Date} endTime
   * @return {Selection} list of executions
   */
  getExecutions(jobId, seedId, startTime, endTime) {
    return r.table('executions')
      .filter({seedId})
      .filter({jobId})
      // inclusive startTime, exclusive endTime
      .filter(r.row('endTime').during(r.expr(startTime), r.expr(endTime)))
      .withFields(['startTime', 'endTime', 'id', 'jobId', 'state']);
  },
};
