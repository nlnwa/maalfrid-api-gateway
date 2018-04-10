const config = require('./config');
const r = require('rethinkdbdash')(config.rethinkdb);

module.exports = {
    r() {
        return r;
    },
  /**
   * Update language fields in extracted text table
   *
   * @param {Array} updates List of update objects of the form: {[warcId]: {language: [code]}
   * @return {*} Raw result rethinkdb update result object (updates, changes, etc..)
   */
  updateLanguageCodes(updates) {
    return r.table('extracted_text')
      .getAll(r.args(Object.keys(updates)))
      .update((extractedText) => r.expr(updates)(extractedText('warcId')));
  },

  /**
   * @return {*} Table of extracted texts
   */
  getExtractedTexts() {
    return r.table('extracted_text');
  },

  getExtractedTextsWithoutLanguageCode() {
    return r.table('extracted_text')
      .filter(r.row.hasFields('language').not());
  },

  filterNorwegian(selection) {
    return selection
      .filter(r.row('language').eq('NOB').or(r.row('language').eq('NNO')));
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
   * Get list of crawl log entries which have entries in the extracted text table
   *
   * @param {string} executionId
   * @return {Selection} List of crawl log entries and their corresponding extracted text entries
   */
  getCrawlLogAndCorrespondingExtractedText(executionId) {
    return r.table('crawl_log')
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
      .filter(r.row('endTime').during(r.expr(startTime), r.expr(endTime)));
  },
};
